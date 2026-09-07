import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// ---------------------------------------------------------------------------
// API key encryption at rest.
// Keys are encrypted server-side (AES-256-GCM) before the client stores them in
// Firestore, and decrypted here just-in-time for provider calls — the browser
// only ever holds ciphertext once a key has been saved. Requires the
// KEYS_ENCRYPTION_SECRET env var; without it, keys pass through unchanged
// (legacy behaviour) and a warning is logged at startup.
// Ciphertext format: enc:v1:<iv b64>:<authTag b64>:<data b64>
// ---------------------------------------------------------------------------
const ENC_PREFIX = "enc:v1:";
const ENC_SECRET = process.env.KEYS_ENCRYPTION_SECRET || "";
const encKey = ENC_SECRET ? crypto.createHash("sha256").update(ENC_SECRET).digest() : null;

function encryptValue(plain: string): string {
  if (!encKey || !plain || plain.startsWith(ENC_PREFIX)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`;
}

function decryptValue(value: string): string {
  if (!value || !value.startsWith(ENC_PREFIX)) return value; // legacy plaintext passthrough
  if (!encKey) throw new Error("Server is missing KEYS_ENCRYPTION_SECRET but received an encrypted key.");
  const [ivB64, tagB64, dataB64] = value.slice(ENC_PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

function decryptKeys(keys: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(keys)) out[k] = v ? decryptValue(v) : v;
  return out;
}

// Claude Sonnet 5 / Opus 5 (and Opus 4.7+) return a 400 error if temperature, top_p, or
// top_k are set to a non-default value — sampling params were removed from these model
// generations in favor of the `effort` parameter. Haiku 4.5 and older models still accept
// temperature normally. Silently dropping the param (rather than erroring) keeps
// per-agent temperature settings working for older models while avoiding hard failures on
// the newer ones.
const NO_SAMPLING_PARAMS_MODELS = /^claude-(sonnet-5|opus-5|opus-4-7|opus-4-8|fable-5|mythos-5)/;
function supportsTemperature(model: string): boolean {
  return !NO_SAMPLING_PARAMS_MODELS.test(model || "");
}

// Non-streaming calls previously capped output at 1024 tokens regardless of what the
// caller asked for — fine for short answers, but silently truncated anything genuinely
// long-form (e.g. a detailed product-spec section) mid-sentence with no error surfaced.
// Callers can still override via `maxTokens` in the request body.
const DEFAULT_MAX_TOKENS_NON_STREAMING = 8192;
const DEFAULT_MAX_TOKENS_STREAMING = 16000;

type ImagePart = { mimeType: string; data: string }; // data = raw base64, no data: prefix

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  if (!ENC_SECRET) {
    console.warn("[security] KEYS_ENCRYPTION_SECRET is not set — API keys will be stored in plaintext. Set it in the environment to enable encryption at rest.");
  }

  app.use(cors());
  app.use(express.json({ limit: "25mb" })); // room for base64 image parts

  // Helper for OpenAI-compatible APIs (Perplexity and X/Grok)
  async function callOpenAICompatible(url: string, apiKey: string, model: string, prompt: string, temperature?: number) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        ...(typeof temperature === "number" ? { temperature } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // OpenAI's Chat Completions `content` field accepts either a plain string or an array of
  // typed parts — only use the array form when there's actually an image to attach, since
  // some OpenAI-compatible proxies are stricter about the array form than OpenAI itself.
  function buildOpenAIUserContent(prompt: string, images: ImagePart[]): any {
    if (!images || images.length === 0) return prompt;
    return [
      ...images.map(img => ({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } })),
      { type: "text", text: prompt }
    ];
  }

  // Streams a single agent's response as Server-Sent Events, normalized across all four
  // providers into simple JSON delta frames: `data: {"text": "..."}\n\n` for each chunk,
  // ending with `data: {"done": true}\n\n`, or `data: {"error": "..."}\n\n` on failure.
  // Used for the longest single waits (Parallel mode results, Chat With The Team's final
  // answer) where showing text as it arrives meaningfully improves perceived speed.
  app.post("/api/execute-stream", async (req, res) => {
    const {
      agent,
      prompt,
      keys: rawKeys,
      model,
      useExternalResources = true,
      systemInstruction,
      images = [] as ImagePart[],
      temperature,
      maxTokens
    } = req.body;

    let keys: Record<string, string>;
    try {
      keys = decryptKeys(rawKeys);
    } catch (error: any) {
      return res.status(400).json({ error: `Key decryption failed: ${error.message}` });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendFrame = (frame: object) => res.write(`data: ${JSON.stringify(frame)}\n\n`);
    // Tracks disconnect so every provider branch below can stop pulling from the upstream
    // model — previously this only ended the response, leaving the actual generation running
    // (and being billed) server-side after every Stop click, tab close, or navigation.
    let clientClosed = false;
    let anthropicStreamRef: { abort: () => void } | null = null;
    req.on("close", () => {
      clientClosed = true;
      anthropicStreamRef?.abort();
      res.end();
    });

    try {
      const apiKey = keys[agent];
      if (!apiKey) {
        sendFrame({ error: `${agent} API Key missing. Please provide it in settings.` });
        return res.end();
      }

      if (agent === "gemini") {
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: prompt }];
        for (const img of images as ImagePart[]) parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        const stream = await ai.models.generateContentStream({
          model: model || "gemini-3-flash-preview",
          contents: { parts },
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(useExternalResources ? { tools: [{ googleSearch: {} }] } : {}),
            ...(typeof temperature === "number" ? { temperature } : {})
          }
        });
        for await (const chunk of stream) {
          if (clientClosed) break; // stop pulling further tokens once nobody's listening
          if (chunk.text) sendFrame({ text: chunk.text });
        }
        if (!clientClosed) {
          sendFrame({ done: true });
          res.end();
        }
        return;
      }

      if (agent === "anthropic") {
        const anthropic = new Anthropic({ apiKey });
        const contentBlocks: any[] = [];
        for (const img of images as ImagePart[]) contentBlocks.push({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.data } });
        contentBlocks.push({ type: "text", text: prompt });
        const resolvedModel = model || "claude-sonnet-5";
        const stream = anthropic.messages.stream({
          model: resolvedModel,
          max_tokens: typeof maxTokens === "number" ? maxTokens : DEFAULT_MAX_TOKENS_STREAMING,
          ...(systemInstruction ? { system: systemInstruction } : {}),
          ...(typeof temperature === "number" && supportsTemperature(resolvedModel) ? { temperature } : {}),
          messages: [{ role: "user", content: contentBlocks }],
          ...(useExternalResources ? { tools: [{ type: "web_search_20250305", name: "web_search" } as any] } : {})
        });
        anthropicStreamRef = stream; // lets the close handler above call .abort() directly
        stream.on("text", (textDelta: string) => { if (!clientClosed) sendFrame({ text: textDelta }); });
        try {
          await stream.finalMessage();
        } catch (streamErr: any) {
          if (clientClosed) return; // aborted on purpose — not a real error
          throw streamErr;
        }
        if (!clientClosed) {
          sendFrame({ done: true });
          res.end();
        }
        return;
      }

      // OpenAI (vision-capable via image_url parts; GPT-5.x/GPT-6 reasoning models require
      // max_completion_tokens instead of max_tokens and reject non-default temperature, so
      // temperature is intentionally never forwarded here).
      if (agent === "openai") {
        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || "gpt-5.6-sol",
            messages: [
              ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
              { role: "user", content: buildOpenAIUserContent(prompt, images as ImagePart[]) }
            ],
            max_completion_tokens: typeof maxTokens === "number" ? maxTokens : DEFAULT_MAX_TOKENS_STREAMING,
            stream: true
          })
        });

        if (!upstream.ok || !upstream.body) {
          const errText = await upstream.text().catch(() => upstream.statusText);
          sendFrame({ error: `API Error (${upstream.status}): ${errText}` });
          return res.end();
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          if (clientClosed) {
            await reader.cancel().catch(() => {});
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) sendFrame({ text: delta });
            } catch {
              // Ignore malformed/partial SSE lines — the next chunk usually completes them.
            }
          }
        }
        if (!clientClosed) {
          sendFrame({ done: true });
          res.end();
        }
        return;
      }

      // Perplexity / Grok — OpenAI-compatible SSE streaming.
      const url = agent === "perplexity" ? "https://api.perplexity.ai/chat/completions" : "https://api.x.ai/v1/chat/completions";
      const defaultModel = agent === "perplexity" ? "sonar-pro" : "grok-3";
      const combined = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
      const scopedPrompt = useExternalResources
        ? combined
        : `${combined}\n\nIMPORTANT: Do not search the web or use outside knowledge. Answer using only the information given above (including any knowledge base documents). If it is insufficient, say so explicitly.`;

      const upstream = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || defaultModel,
          messages: [{ role: "user", content: scopedPrompt }],
          stream: true,
          ...(typeof temperature === "number" ? { temperature } : {})
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text().catch(() => upstream.statusText);
        sendFrame({ error: `API Error (${upstream.status}): ${errText}` });
        return res.end();
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        if (clientClosed) {
          await reader.cancel().catch(() => {}); // actually closes the upstream connection, not just the local loop
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) sendFrame({ text: delta });
          } catch {
            // Ignore malformed/partial SSE lines — the next chunk usually completes them.
          }
        }
      }
      if (!clientClosed) {
        sendFrame({ done: true });
        res.end();
      }
    } catch (error: any) {
      if (clientClosed) return; // connection already gone — nothing to report back
      sendFrame({ error: error.message || String(error) });
      res.end();
    }
  });


  // (or the original value unchanged when no encryption secret is configured).
  app.post("/api/keys/encrypt", (req, res) => {
    try {
      const { keys = {} } = req.body as { keys: Record<string, string> };
      const encrypted: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) encrypted[k] = v ? encryptValue(v) : v;
      res.json({ keys: encrypted, encryptionEnabled: !!encKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 1. Get Gemini Threads (Simulated)
  app.get("/api/threads", (req, res) => {
    res.json([
      { id: "thread_123", name: "Market Research Analysis" },
      { id: "thread_456", name: "Technical Architecture Review" },
      { id: "thread_789", name: "Product Strategy Brainstorm" },
      { id: "thread_abc", name: "Customer Feedback Summary" },
    ]);
  });

  // 2. Multi-Agent Execution (Gemini, Anthropic, Perplexity, Grok).
  // All provider calls run server-side so no API key is ever used from the browser.
  app.post("/api/execute-others", async (req, res) => {
    const {
      prompt,
      keys: rawKeys,
      models,
      agents = ["anthropic", "perplexity", "grok"],
      useExternalResources = true,
      systemInstruction,
      images = [] as ImagePart[],
      temperature,
      maxTokens
    } = req.body;

    let keys: Record<string, string>;
    try {
      keys = decryptKeys(rawKeys);
    } catch (error: any) {
      return res.status(400).json({ error: `Key decryption failed: ${error.message}` });
    }

    const tasks = [];

    // Gemini (vision-capable: image parts are attached when provided)
    if (agents.includes("gemini")) {
      tasks.push((async () => {
        try {
          const apiKey = keys.gemini;
          if (!apiKey) return { agent: "gemini", text: "Gemini API Key missing. Please provide it in settings." };
          const ai = new GoogleGenAI({ apiKey });
          const parts: any[] = [{ text: prompt }];
          for (const img of images as ImagePart[]) {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
          }
          const response = await ai.models.generateContent({
            model: models?.gemini || "gemini-3-flash-preview",
            contents: { parts },
            config: {
              ...(systemInstruction ? { systemInstruction } : {}),
              ...(useExternalResources ? { tools: [{ googleSearch: {} }] } : {}),
              ...(typeof temperature === "number" ? { temperature } : {})
            }
          });
          return { agent: "gemini", text: response.text || "No response from Gemini" };
        } catch (error: any) {
          return { agent: "gemini", text: `Error: ${error.message}` };
        }
      })());
    }

    // Anthropic (vision-capable: image parts are attached when provided)
    if (agents.includes("anthropic")) {
      tasks.push((async () => {
        try {
          const apiKey = keys.anthropic;
          if (!apiKey) return { agent: "anthropic", text: "Anthropic API Key missing. Please provide it in settings." };
          const anthropic = new Anthropic({ apiKey });
          const contentBlocks: any[] = [];
          for (const img of images as ImagePart[]) {
            contentBlocks.push({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.data } });
          }
          contentBlocks.push({ type: "text", text: prompt });
          const resolvedModel = models?.anthropic || "claude-sonnet-5";
          const msg = await anthropic.messages.create({
            model: resolvedModel,
            max_tokens: typeof maxTokens === "number" ? maxTokens : DEFAULT_MAX_TOKENS_NON_STREAMING,
            ...(systemInstruction ? { system: systemInstruction } : {}),
            ...(typeof temperature === "number" && supportsTemperature(resolvedModel) ? { temperature } : {}),
            messages: [{ role: "user", content: contentBlocks }],
            // Only grant the web search tool when the user has opted in to external resources.
            ...(useExternalResources ? { tools: [{ type: "web_search_20250305", name: "web_search" } as any] } : {})
          });
          // @ts-ignore
          const textBlock = msg.content.find((block: any) => block.type === "text");
          return { agent: "anthropic", text: (textBlock as any)?.text || "No response received." };
        } catch (error: any) {
          return { agent: "anthropic", text: `Error: ${error.message}` };
        }
      })());
    }

    // OpenAI (vision-capable via image_url parts). GPT-5.x/GPT-6 reasoning models require
    // max_completion_tokens instead of max_tokens and reject non-default temperature, so
    // temperature is intentionally never forwarded here.
    if (agents.includes("openai")) {
      tasks.push((async () => {
        try {
          const apiKey = keys.openai;
          if (!apiKey) return { agent: "openai", text: "OpenAI API Key missing. Please provide it in settings." };
          const resolvedModel = models?.openai || "gpt-5.6-sol";
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: resolvedModel,
              messages: [
                ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                { role: "user", content: buildOpenAIUserContent(prompt, images as ImagePart[]) }
              ],
              max_completion_tokens: typeof maxTokens === "number" ? maxTokens : DEFAULT_MAX_TOKENS_NON_STREAMING
            })
          });
          if (!response.ok) {
            const errText = await response.text().catch(() => response.statusText);
            return { agent: "openai", text: `Error: API Error (${response.status}): ${errText}` };
          }
          const data = await response.json();
          return { agent: "openai", text: data.choices?.[0]?.message?.content || "No response received." };
        } catch (error: any) {
          return { agent: "openai", text: `Error: ${error.message}` };
        }
      })());
    }

    // Perplexity - "online" sonar models search the web inherently; when external resources
    // are disabled we instruct the model to rely solely on the supplied context instead.
    if (agents.includes("perplexity")) {
      tasks.push((async () => {
        try {
          const apiKey = keys.perplexity;
          if (!apiKey) return { agent: "perplexity", text: "Perplexity API Key missing. Please provide it in settings." };
          const combined = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
          const scopedPrompt = useExternalResources
            ? combined
            : `${combined}\n\nIMPORTANT: Do not search the web or use outside knowledge. Answer using only the information given above (including any knowledge base documents). If it is insufficient, say so explicitly.`;
          const text = await callOpenAICompatible(
            "https://api.perplexity.ai/chat/completions",
            apiKey,
            models?.perplexity || "sonar-pro",
            scopedPrompt,
            temperature
          );
          return { agent: "perplexity", text };
        } catch (error: any) {
          return { agent: "perplexity", text: `Error: ${error.message}` };
        }
      })());
    }

    // X (Grok)
    if (agents.includes("grok")) {
      tasks.push((async () => {
        try {
          const apiKey = keys.grok;
          if (!apiKey) return { agent: "grok", text: "Grok API Key missing. Please provide it in settings." };
          const combined = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
          const scopedPrompt = useExternalResources
            ? combined
            : `${combined}\n\nIMPORTANT: Do not search the web or use outside knowledge. Answer using only the information given above (including any knowledge base documents). If it is insufficient, say so explicitly.`;
          const text = await callOpenAICompatible(
            "https://api.x.ai/v1/chat/completions",
            apiKey,
            models?.grok || "grok-3",
            scopedPrompt,
            temperature
          );
          return { agent: "grok", text };
        } catch (error: any) {
          return { agent: "grok", text: `Error: ${error.message}` };
        }
      })());
    }

    try {
      const results = await Promise.all(tasks);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Gemini image generation — also server-side so the key stays off the browser.
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, keys: rawKeys } = req.body;
      const keys = decryptKeys(rawKeys);
      const apiKey = keys.gemini;
      if (!apiKey) return res.status(400).json({ error: "Gemini API Key missing. Please provide it in settings." });
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return res.json({ image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
        }
      }
      res.json({ image: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
