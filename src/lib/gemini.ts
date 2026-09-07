// All Gemini calls are routed through the app's own server so the API key is never
// used from the browser (and encrypted keys can be decrypted server-side just-in-time).
// The exported signatures are unchanged from the previous client-direct implementation.

import { withTimeoutSignal, DEFAULT_MODEL_CALL_TIMEOUT_MS } from "./abortUtils";

export interface VisionImagePart {
  mimeType: string;
  data: string; // raw base64, no data: prefix
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are a helpful AI assistant. 
      If the user asks you to generate an image, you MUST respond with a JSON object in the following format:
      {
        "action": "dalle.text2im",
        "action_input": "{ \\"prompt\\": \\"detailed description of the image to generate\\" }",
        "thought": "Brief explanation of why you are generating this image"
      }
      Do not include any other text in your response when generating an image, just the JSON block.
      If you are the Lead Agent reviewing other responses that include images, you should also use this format if you want to include a final image in your consolidated response.
      For all other requests, respond with normal text.`;

export async function generateGeminiContent(
  prompt: string,
  customKey?: string,
  model: string = "gemini-3-flash-preview",
  systemInstruction?: string,
  useExternalResources: boolean = true,
  images: VisionImagePart[] = [],
  signal?: AbortSignal,
  temperature?: number
) {
  if (!customKey) {
    throw new Error("Gemini API Key is required. Please provide it in settings.");
  }
  // Previously this fetch had no timeout at all — only the caller-supplied signal (a
  // manual Stop click) could ever cut it off. A hung backend call would sit here
  // indefinitely, invisible to callAgent's retry/backoff logic, which only ever reacts to
  // a rejected promise.
  const { signal: combinedSignal, cleanup } = withTimeoutSignal(signal, DEFAULT_MODEL_CALL_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("/api/execute-others", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: combinedSignal,
      body: JSON.stringify({
        prompt,
        keys: { gemini: customKey },
        models: { gemini: model },
        agents: ["gemini"],
        useExternalResources,
        systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        images,
        temperature
      })
    });
  } finally {
    cleanup();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Gemini request failed (${res.status})`);
  }
  const data = await res.json();
  const text = data?.[0]?.text || "No response from Gemini";
  if (text.startsWith("Error: ")) throw new Error(text.slice(7));
  return text;
}

export async function generateImageContent(prompt: string, customKey?: string) {
  if (!customKey) {
    throw new Error("Gemini API Key is required for image generation. Please provide it in settings.");
  }
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, keys: { gemini: customKey } })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Image generation failed (${res.status})`);
  }
  const data = await res.json();
  return data.image as string | null;
}
