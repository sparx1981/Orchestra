import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { CustomAgent, KnowledgeFile } from "@/src/App";
import type { ProductSpec, ProductSpecSection, VibeCodingTool, ProductGenerationDepth, ProductSpecPreflightQuestion } from "@/src/lib/productSpecTypes";
import {
  VIBE_CODING_TOOLS,
  DEFAULT_PRODUCT_AGENTS,
  wouldExceedHistoryStorageLimits,
} from "@/src/lib/productSpecTypes";
import {
  buildProductSpecMarkdown,
  buildVibeCodingPlaybookMarkdown,
  buildCursorRules,
  downloadFile,
} from "@/src/lib/productSpecGenerator";
import {
  buildProductSpecDocx,
  buildProductSpecRtf,
  buildProductSpecPdf,
  downloadBinaryFile,
} from "@/src/lib/productSpecExport";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Layers,
  Code2,
  FileText,
  Terminal,
  Cpu,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Wand2,
  Settings2,
  CheckCircle2,
  PanelLeftOpen,
  ExternalLink,
  History,
  RotateCcw,
  Gauge,
  ListChecks,
  HelpCircle,
  FileDown,
  FileCode2,
  X,
} from "lucide-react";

interface ProductTabProps {
  customTeam: CustomAgent[];
  setCustomTeam: (agents: CustomAgent[]) => void;
  knowledgeFiles: KnowledgeFile[];
  contentBearingKnowledgeFiles: KnowledgeFile[];
  callAgent: (
    agent: CustomAgent,
    userContent: string,
    systemInstruction: string,
    signal?: AbortSignal
  ) => Promise<string>;
  logDebug: (level: "info" | "warn" | "error", message: string, detail?: any) => void;
  openLeftPanel?: () => void;
  openChatDrawer?: (seedMessage?: string) => void;
  productPrompt?: string;
  setProductPrompt?: (prompt: string) => void;
  openSuggestTeam?: (seedPrompt?: string) => void;
  // Chat History integration: a spec loaded from a "Product Spec" history entry arrives
  // here (App.tsx owns the click-to-open plumbing; ProductTab just consumes it). onSpecLoaded
  // clears it back to null once applied, so switching away and back doesn't redundantly
  // reload it. onSpecChange fires whenever the local spec changes for any reason (finished
  // generating, a question answered, a section refined) so App.tsx can save it to Chat
  // History and keep its own list in sync.
  specToLoad?: ProductSpec | null;
  onSpecLoaded?: () => void;
  onSpecChange?: (spec: ProductSpec) => void;
  // Explicit, user-triggered backup to Google Drive — offered when a spec is large enough
  // that Chat History would trim some of it on save (see wouldExceedHistoryStorageLimits).
  // Deliberately not automatic: this is a write to the user's Drive and should only ever
  // happen on a click, with its own consent prompt, never silently.
  onBackupToDrive?: (spec: ProductSpec) => Promise<{ success: boolean; webViewLink?: string; error?: string }>;
  isBackingUpToDrive?: boolean;
  // Attach a new style-inspiration image/URL to the knowledge base (see the fixed
  // "style inspiration" pre-flight question below) — resolves with the created
  // KnowledgeFile so its id can be recorded against the question.
  onAddStyleInspirationImage?: (file: File) => Promise<KnowledgeFile>;
  onAddStyleInspirationUrl?: (url: string) => KnowledgeFile;
}

export function ProductTab({
  customTeam,
  setCustomTeam,
  knowledgeFiles,
  contentBearingKnowledgeFiles,
  callAgent,
  logDebug,
  openLeftPanel,
  openChatDrawer,
  productPrompt,
  setProductPrompt,
  openSuggestTeam,
  specToLoad,
  onSpecLoaded,
  onSpecChange,
  onBackupToDrive,
  isBackingUpToDrive,
  onAddStyleInspirationImage,
  onAddStyleInspirationUrl,
}: ProductTabProps) {
  const [internalPrompt, setInternalPrompt] = useState("");
  const prompt = productPrompt !== undefined ? productPrompt : internalPrompt;
  const setPrompt = setProductPrompt || setInternalPrompt;
  const [selectedTool, setSelectedTool] = useState<VibeCodingTool>("google_ai_studio");
  const [activeView, setActiveView] = useState<"spec" | "playbook" | "rules" | "raw">("spec");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [spec, setSpec] = useState<ProductSpec | null>(null);

  // Storage-limit warning: shown when the spec is large enough that Chat History would
  // trim some of it on save (see wouldExceedHistoryStorageLimits). Dismissible per spec —
  // tracks the spec id it was dismissed for, so switching to a different (or newly
  // regenerated) spec shows the warning again if it applies.
  const [storageWarningDismissedForId, setStorageWarningDismissedForId] = useState<string | null>(null);
  const [driveBackupResult, setDriveBackupResult] = useState<{ success: boolean; webViewLink?: string; error?: string } | null>(null);

  // Chat History integration: when a "Product Spec" history entry is opened, App.tsx hands
  // us the spec via specToLoad. Loading it also resets the transient UI state a fresh
  // generation would have started from (any in-progress pre-flight round, an open "Refine
  // Section" box, etc.) so the loaded spec doesn't appear alongside stale controls from
  // whatever was on screen before.
  useEffect(() => {
    if (!specToLoad) return;
    setSpec(specToLoad);
    setIsGenerating(false);
    setCurrentPhase("");
    setPreflightState("idle");
    setPreflightQuestions([]);
    setPreflightAnswers({});
    setPreflightLocked([]);
    setRegenDraft(null);
    setQuestionDrafts({});
    setExpandedHistorySectionId(null);
    onSpecLoaded?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specToLoad]);

  // Tells App.tsx about every change to the local spec — finished generating, a question
  // answered, a section refined or restored — so it can be saved to Chat History and stay
  // in that list's sync. Loading a spec via specToLoad above also re-fires this once with
  // identical content; harmless (an idempotent overwrite), simpler than special-casing it.
  useEffect(() => {
    if (spec) onSpecChange?.(spec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  // A Drive backup result (or dismissed warning) belongs to one specific spec — switching
  // to a different one (via specToLoad, or finishing a brand-new generation) shouldn't show
  // a stale success/error banner left over from whatever was on screen before.
  useEffect(() => {
    setDriveBackupResult(null);
  }, [spec?.id]);

  // Section regeneration state
  const [regenDraft, setRegenDraft] = useState<{ id: string; feedback: string } | null>(null);
  const [isRegeneratingSectionId, setIsRegeneratingSectionId] = useState<string | null>(null);

  // Open Questions (raised by the cross-agent review pass) — draft answers, keyed by
  // question id, and which one is currently being submitted.
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({});
  const [isAnsweringQuestionId, setIsAnsweringQuestionId] = useState<string | null>(null);

  // Generation depth: "thorough" runs the full draft → cross-review → revise → consistency
  // sweep pipeline; "quick" stops after drafting for a fast first pass.
  const [generationDepth, setGenerationDepth] = useState<ProductGenerationDepth>("quick");

  // New build vs. update to something already in production — a structural choice that
  // reframes every section's instructions (see runSpecGeneration's projectTypeContext), so
  // it's a persistent UI control rather than something left to the pre-flight LLM check's
  // discretion. If "update", the user can (optionally — never forced) point at a knowledge
  // base file that IS the existing codebase, so the spec is grounded on real code rather
  // than a guessed-at "typical" stack for the domain.
  const [projectType, setProjectType] = useState<"new" | "update">("new");
  const [existingCodebaseFileId, setExistingCodebaseFileId] = useState<string>("");
  const codebaseKnowledgeFiles = useMemo(
    () => contentBearingKnowledgeFiles.filter(f => f.sourceType === "github" || f.sourceType === "codebase_zip"),
    [contentBearingKnowledgeFiles]
  );

  // If the selected existing-codebase file gets removed from the knowledge base (deleted,
  // or the KB scope changed), don't silently keep pointing at a ghost id.
  useEffect(() => {
    if (existingCodebaseFileId && !codebaseKnowledgeFiles.some(f => f.id === existingCodebaseFileId)) {
      setExistingCodebaseFileId("");
    }
  }, [existingCodebaseFileId, codebaseKnowledgeFiles]);

  // Auto-select the existing codebase when it's unambiguous: the user has switched to
  // "Update Existing App" and attached exactly one GitHub/zip source, so there's only one
  // sensible answer to "which file is the existing codebase?" — requiring an extra manual
  // pick here is exactly the kind of easy-to-miss step that leads to the codebase being
  // attached but never actually treated as ground truth. Left unset (user's explicit
  // choice to clear it) when there are zero or multiple candidates, since then the answer
  // genuinely isn't obvious and guessing wrong is worse than asking.
  useEffect(() => {
    if (projectType === "update" && !existingCodebaseFileId && codebaseKnowledgeFiles.length === 1) {
      setExistingCodebaseFileId(codebaseKnowledgeFiles[0].id);
    }
  }, [projectType, existingCodebaseFileId, codebaseKnowledgeFiles]);

  // Pre-flight clarifying questions, asked by the lead agent BEFORE drafting starts when
  // the app idea is ambiguous on something that would genuinely change the architecture or
  // scope. "idle" = not asking; "checking" = the lead agent is deciding whether to ask;
  // "asking" = questions are shown, awaiting the user's answers or a skip.
  const [preflightState, setPreflightState] = useState<"idle" | "checking" | "asking" | "confirming">("idle");
  // Flattened, editable list of every pre-flight Q&A (across all "Ask More Questions"
  // rounds) shown on the confirmation screen — the user can tweak wording here before
  // generation actually starts.
  const [confirmQA, setConfirmQA] = useState<ProductSpecPreflightQuestion[]>([]);
  const [preflightQuestions, setPreflightQuestions] = useState<ProductSpecPreflightQuestion[]>([]);
  const [preflightAnswers, setPreflightAnswers] = useState<Record<string, string>>({});
  // Q&A from completed rounds — frozen/read-only once a round is submitted via "Ask More
  // Questions". The active round lives in preflightQuestions/preflightAnswers above.
  const [preflightLocked, setPreflightLocked] = useState<ProductSpecPreflightQuestion[]>([]);
  const [isAskingMorePreflight, setIsAskingMorePreflight] = useState(false);

  // Fixed id for the one pre-flight question that's always asked (never LLM-generated) —
  // whether the product owner has style inspiration to ground the visual design on. Fixed
  // rather than timestamp-based since it's only ever created once per generation attempt
  // and needs a stable id to look up while the user is still interacting with it.
  const STYLE_INSPIRATION_QUESTION_ID = "pf_style_inspiration";
  const STYLE_INSPIRATION_QUESTION_TEXT =
    "Do you have any style inspiration — an image or a website/URL — that should guide the app's visual design?";
  const makeStyleInspirationQuestion = (): ProductSpecPreflightQuestion => ({
    id: STYLE_INSPIRATION_QUESTION_ID,
    question: STYLE_INSPIRATION_QUESTION_TEXT,
    isStyleInspiration: true,
  });
  // UI-only state for how the user is currently answering the style-inspiration question —
  // not part of preflightQuestions itself since it's about the picker widget, not the Q&A
  // record (which only needs the final answer text + chosen file id, set once resolved).
  const [styleInspirationMode, setStyleInspirationMode] = useState<"undecided" | "existing" | "new_url">("undecided");
  const [styleInspirationUrlDraft, setStyleInspirationUrlDraft] = useState("");
  const [isAttachingStyleInspiration, setIsAttachingStyleInspiration] = useState(false);
  const styleInspirationCandidates = useMemo(
    () => knowledgeFiles.filter(f => f.sourceType === "image" || f.sourceType === "website"),
    [knowledgeFiles]
  );

  // Which section's revision history panel is currently expanded (one at a time).
  const [expandedHistorySectionId, setExpandedHistorySectionId] = useState<string | null>(null);

  // Prompt expansion state
  const [isExpandingPrompt, setIsExpandingPrompt] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Use team configured in the left panel
  const effectiveTeam = customTeam && customTeam.length > 0 ? customTeam : DEFAULT_PRODUCT_AGENTS;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2200);
  };

  const handleDownloadSpec = () => {
    if (!spec) return;
    const md = buildProductSpecMarkdown(spec);
    const filename = `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-spec.md`;
    downloadFile(filename, md);
  };

  const handleDownloadCursorRules = () => {
    if (!spec) return;
    const rules = buildCursorRules(spec);
    downloadFile(".cursorrules", rules, "text/plain;charset=utf-8");
  };

  // Word / RTF / PDF export — all deterministic renderings of the spec already in state,
  // no additional model call. Google Docs has no zero-auth "send content directly" API;
  // the practical bridge is the same .docx, which Google Docs opens/imports natively.
  const [isExportingFormat, setIsExportingFormat] = useState<"docx" | "pdf" | null>(null);
  const specFilenameBase = () => (spec ? spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "product-spec");

  const handleExportDocx = async () => {
    if (!spec) return;
    setIsExportingFormat("docx");
    try {
      const blob = await buildProductSpecDocx(spec);
      downloadBinaryFile(`${specFilenameBase()}-spec.docx`, blob, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      logDebug("info", "Exported spec as Word document");
    } catch (err: any) {
      logDebug("error", "Failed to export spec as Word document", err?.message || err);
    } finally {
      setIsExportingFormat(null);
    }
  };

  const handleExportRtf = () => {
    if (!spec) return;
    try {
      const rtf = buildProductSpecRtf(spec);
      downloadBinaryFile(`${specFilenameBase()}-spec.rtf`, new TextEncoder().encode(rtf), "application/rtf");
      logDebug("info", "Exported spec as RTF");
    } catch (err: any) {
      logDebug("error", "Failed to export spec as RTF", err?.message || err);
    }
  };

  const handleExportPdf = async () => {
    if (!spec) return;
    setIsExportingFormat("pdf");
    try {
      const bytes = await buildProductSpecPdf(spec);
      downloadBinaryFile(`${specFilenameBase()}-spec.pdf`, bytes, "application/pdf");
      logDebug("info", "Exported spec as PDF");
    } catch (err: any) {
      logDebug("error", "Failed to export spec as PDF", err?.message || err);
    } finally {
      setIsExportingFormat(null);
    }
  };

  // Explicit, user-triggered backup to Google Drive — see onBackupToDrive prop doc comment.
  const handleBackupToDrive = async () => {
    if (!spec || !onBackupToDrive) return;
    setDriveBackupResult(null);
    const result = await onBackupToDrive(spec);
    setDriveBackupResult(result);
  };

  // Expand Prompt for Vibe Coding
  const handleExpandPrompt = async () => {
    if (!prompt.trim() || isExpandingPrompt) return;
    setIsExpandingPrompt(true);
    setExpandedDraft(null);

    try {
      const facilitator = effectiveTeam[0];
      const instruction = `You are a Principal Product Architect specializing in vibe coding with AI models (Cursor, Claude Code, Lovable, v0).
Your goal is to take a user's rough application idea and expand it into a sharp, rich product brief.
Include:
1. Core App Value Proposition & Target Persona
2. Essential MVP Feature Set (scoped for rapid AI development)
3. Visual Aesthetic & UX Tone (minimalist, modern, accessible)
4. Primary Tech Stack Recommendation
Do not write the full spec yet — produce a concise, inspiring, well-structured brief (3-4 paragraphs) ready for team spec generation.`;

      const expanded = await callAgent(facilitator, `ROUGH APP IDEA:\n${prompt.trim()}`, instruction);
      setExpandedDraft(expanded.trim());
      logDebug("info", "Product prompt expanded successfully");
    } catch (err: any) {
      logDebug("error", "Failed to expand product prompt", err?.message || err);
    } finally {
      setIsExpandingPrompt(false);
    }
  };

  // Pre-flight: before committing to a full draft, ask the lead agent whether anything
  // fundamental about the idea is ambiguous enough to change the architecture or scope.
  // Catches "should this be multi-tenant?" before it propagates through all 8 sections,
  // rather than only catching it via the cross-agent review pass afterward.
  const handleGenerateSpec = async () => {
    if (!prompt.trim() || effectiveTeam.length === 0) return;

    setPreflightAnswers({});
    setPreflightQuestions([]);
    setPreflightLocked([]);
    setStyleInspirationMode("undecided");
    setStyleInspirationUrlDraft("");
    setPreflightState("checking");
    try {
      const leadAgent = effectiveTeam[0];
      const existingCodebaseFile = codebaseKnowledgeFiles.find(f => f.id === existingCodebaseFileId) || null;
      const projectTypeNote = projectType === "update"
        ? existingCodebaseFile
          ? `This is an UPDATE to an existing app; its real codebase ("${existingCodebaseFile.name}") is attached and will be provided in full during drafting — do NOT ask about its current stack, file structure, or architecture, that's already known. Instead, focus any questions on integration constraints, migration/rollout concerns, or scope boundaries for the update itself.`
          : `This is an UPDATE to an existing app, but no codebase was attached to ground it on. Prioritize asking about the current system's architecture, stack, and constraints where genuinely load-bearing — that's more valuable to ask now than after drafting has already assumed something wrong.`
        : `This is a NEW application being built from scratch.`;
      const otherKbNote = contentBearingKnowledgeFiles.length > (existingCodebaseFile ? 1 : 0)
        ? ` The product owner has also attached ${contentBearingKnowledgeFiles.length - (existingCodebaseFile ? 1 : 0)} other knowledge base file(s) (docs, specs, or reference material), which will be fully available during drafting — don't ask about anything one of those would reasonably already answer.`
        : "";
      const checkInstruction = `You are the Lead Product Architect (${leadAgent.name}). Before drafting a full production spec, decide whether you genuinely need to ask the product owner 1-4 clarifying questions first.
${projectTypeNote}${otherKbNote}
Only ask about things that would meaningfully change the architecture or scope depending on the answer (e.g. single-user vs. multi-tenant, offline/local-first requirements, auth model, monetization, target platform). Do NOT ask anything you could reasonably assume a sensible default for — most ideas need zero or one question.
Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "needsClarification": boolean, "questions": ["question 1", "question 2"] }`;
      let llmQs: ProductSpecPreflightQuestion[] = [];
      try {
        const raw = await callAgent(leadAgent, `APP IDEA:\n${prompt.trim()}`, checkInstruction);
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed?.needsClarification && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          llmQs = parsed.questions
            .filter((q: any) => typeof q === "string" && q.trim())
            .slice(0, 4)
            .map((q: string, i: number) => ({ id: `pf_${Date.now()}_${i}`, question: q.trim() }));
        }
      } catch (e) {
        logDebug("warn", "Pre-flight clarification check failed — proceeding with the fixed style-inspiration question only", e);
      }
      // The style-inspiration question is always asked, regardless of what the lead agent
      // decided — unlike the rest of pre-flight (which only fires when genuinely ambiguous),
      // this one has no sensible silent default: skipping it would mean the app never learns
      // about style inspiration unless the user thinks to attach it unprompted.
      setPreflightQuestions([makeStyleInspirationQuestion(), ...llmQs]);
      setPreflightState("asking");
      logDebug("info", `Pre-flight: style-inspiration question plus ${llmQs.length} question(s) from the lead agent`);
      return; // wait for the user to answer or skip
    } catch (e) {
      logDebug("warn", "Pre-flight check failed unexpectedly — proceeding straight to drafting", e);
    }
    setConfirmQA([]);
    setPreflightState("confirming");
  };

  // The style-inspiration question's answer is set directly on the question object (by the
  // picker widget below, when the user chooses/attaches a file or says "no") rather than via
  // preflightAnswers — it's not a plain text field, so it must be preserved here rather than
  // overwritten with whatever (nothing) preflightAnswers has for its id.
  const freezeCurrentRound = () =>
    preflightQuestions.map(q =>
      q.isStyleInspiration ? q : { ...q, answer: preflightAnswers[q.id]?.trim() || undefined }
    );

  const handleSkipPreflight = () => {
    setConfirmQA([...preflightLocked, ...freezeCurrentRound()]);
    setPreflightState("confirming");
  };

  const handleSubmitPreflight = () => {
    setConfirmQA([...preflightLocked, ...freezeCurrentRound()]);
    setPreflightState("confirming");
  };

  // Freezes the active round's answers, then asks the Lead Architect whether — now
  // knowing those answers — anything ELSE genuinely needs clarifying before drafting.
  const handleAskMorePreflight = async () => {
    const allSoFar = [...preflightLocked, ...freezeCurrentRound()];
    setPreflightLocked(allSoFar);
    setPreflightQuestions([]);
    setPreflightAnswers({});
    setIsAskingMorePreflight(true);
    try {
      const leadAgent = effectiveTeam[0];
      const existingCodebaseFile = codebaseKnowledgeFiles.find(f => f.id === existingCodebaseFileId) || null;
      const projectTypeNote = projectType === "update"
        ? existingCodebaseFile
          ? `This is an UPDATE to an existing app; its real codebase ("${existingCodebaseFile.name}") is attached and will be provided in full during drafting — don't ask about its current stack or structure, that's already known.`
          : `This is an UPDATE to an existing app, but no codebase was attached — questions about the current system's architecture/stack are still fair game if genuinely load-bearing.`
        : `This is a NEW application being built from scratch.`;
      const otherKbNote = contentBearingKnowledgeFiles.length > (existingCodebaseFile ? 1 : 0)
        ? ` The product owner has also attached ${contentBearingKnowledgeFiles.length - (existingCodebaseFile ? 1 : 0)} other knowledge base file(s), fully available during drafting — don't ask about anything one of those would reasonably already answer.`
        : "";
      const qaContext = allSoFar
        .map(q => `Q: ${q.question}\nA: ${q.answer || "(left blank — assume a sensible default)"}`)
        .join("\n\n");
      const instruction = `You are the Lead Product Architect (${leadAgent.name}). ${projectTypeNote}${otherKbNote} You already asked the product owner these clarifying questions and got these answers:\n${qaContext}\n\nDecide whether you have any FURTHER genuinely important clarifying questions before drafting — do NOT repeat anything already asked above, and only ask if something else would meaningfully change the architecture or scope.
Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "needsClarification": boolean, "questions": ["question 1", "question 2"] }`;
      const raw = await callAgent(leadAgent, `APP IDEA:\n${prompt.trim()}`, instruction);
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const newQs = (parsed?.needsClarification && Array.isArray(parsed.questions) ? parsed.questions : [])
        .filter((q: any) => typeof q === "string" && q.trim())
        .slice(0, 4)
        .map((q: string, i: number) => ({ id: `pf_${Date.now()}_${i}`, question: q.trim() }));
      setPreflightQuestions(newQs);
      logDebug("info", newQs.length > 0 ? `Lead agent asked ${newQs.length} more pre-flight question(s)` : "Lead agent had no further pre-flight questions");
    } catch (e) {
      logDebug("warn", "Follow-up pre-flight check failed — you can still generate with what's answered so far", e);
      setPreflightQuestions([]);
    } finally {
      setIsAskingMorePreflight(false);
    }
  };

  // Hidden file input backing the style-inspiration "Upload image" button below.
  const styleInspirationFileInputRef = useRef<HTMLInputElement>(null);

  // Records the user's style-inspiration choice (existing file, newly uploaded image, or
  // newly pasted URL) onto the fixed question itself, as both a human-readable answer (fed
  // into every section's drafting prompt) and the KnowledgeFile id (so the generated spec
  // can reference exactly which source it was). The image/URL content itself reaches
  // vision-capable agents automatically once attached to the knowledge base — see
  // getVisionImageParts in App.tsx — this just makes sure every agent is told it exists.
  const applyStyleInspirationChoice = (file: KnowledgeFile) => {
    setPreflightQuestions(prev => prev.map(p =>
      p.isStyleInspiration
        ? {
            ...p,
            styleInspirationFileId: file.id,
            answer: `Yes — use "${file.name}" (${file.sourceType === "image" ? "an uploaded image" : "a website/URL"}) as style inspiration.`,
          }
        : p
    ));
    setStyleInspirationMode("undecided");
  };

  const handleStyleInspirationFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onAddStyleInspirationImage) return;
    setIsAttachingStyleInspiration(true);
    try {
      const newFile = await onAddStyleInspirationImage(file);
      applyStyleInspirationChoice(newFile);
    } catch (err: any) {
      logDebug("error", "Failed to attach style inspiration image", err?.message || err);
    } finally {
      setIsAttachingStyleInspiration(false);
    }
  };

  const handleStyleInspirationUrlSubmit = () => {
    const url = styleInspirationUrlDraft.trim();
    if (!url || !onAddStyleInspirationUrl) return;
    const newFile = onAddStyleInspirationUrl(url);
    applyStyleInspirationChoice(newFile);
    setStyleInspirationUrlDraft("");
  };

  const handleStyleInspirationSkip = () => {
    setPreflightQuestions(prev => prev.map(p =>
      p.isStyleInspiration
        ? { ...p, styleInspirationFileId: undefined, answer: "No style inspiration provided — use your own design judgment." }
        : p
    ));
    setStyleInspirationMode("undecided");
  };

  const handleStyleInspirationChangeAnswer = () => {
    setPreflightQuestions(prev => prev.map(p =>
      p.isStyleInspiration ? { ...p, styleInspirationFileId: undefined, answer: undefined } : p
    ));
    setStyleInspirationMode("undecided");
  };

  // Final step before any model calls happen: a summary of every choice that's about to
  // shape generation (project type, target tool, depth, and every pre-flight answer),
  // editable in place, so the user isn't committing to a 10+ call pipeline on a typo or a
  // toggle they forgot to flip.
  const handleConfirmGeneration = () => {
    setPreflightState("idle");
    runSpecGeneration(confirmQA);
  };

  const handleCancelConfirm = () => {
    setPreflightState("idle");
    setConfirmQA([]);
  };

  // Generate High-Detail Product Spec
  const runSpecGeneration = async (preflight: ProductSpecPreflightQuestion[]) => {
    if (!prompt.trim() || effectiveTeam.length === 0) return;

    setIsGenerating(true);
    setSpec(null);
    setCurrentPhase("Initializing Product Architects & grounding context...");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    // Declared here (outside the try block) so the catch block below can still report how
    // many sections were completed before an error — that's the whole point of surfacing
    // partial progress on failure, not just on success.
    const sectionsRef: ProductSpecSection[] = [];
    const questionsRef: NonNullable<ProductSpec["openQuestions"]> = [];
    const notesRef: string[] = [];

    try {
      const answeredPreflight = preflight.filter(q => q.answer);
      const preflightContext = answeredPreflight.length > 0
        ? `\n\nPRODUCT OWNER'S ANSWERS TO PRE-FLIGHT QUESTIONS (treat these as firm requirements):\n${answeredPreflight
            .map(q => `Q: ${q.question}\nA: ${q.answer}`)
            .join("\n\n")}`
        : "";

      // The style-inspiration file itself (if an image) already reaches every vision-capable
      // agent automatically once attached to the knowledge base (see getVisionImageParts in
      // App.tsx) — this note is what actually tells the agents it's there and what to DO with
      // it, since nothing else in the prompt would otherwise connect "there's an image in the
      // knowledge base" to "use it to inform the Design Vibe and UI/UX sections."
      const styleInspirationQA = preflight.find(q => q.isStyleInspiration && q.styleInspirationFileId);
      const styleInspirationFile = styleInspirationQA
        ? knowledgeFiles.find(f => f.id === styleInspirationQA.styleInspirationFileId)
        : null;
      const styleInspirationContext = styleInspirationFile
        ? `\n\n🎨 STYLE INSPIRATION PROVIDED: The product owner attached "${styleInspirationFile.name}" as visual style inspiration for this app. ${
            styleInspirationFile.sourceType === "image"
              ? "It is included above/alongside as an actual image — look at it directly and analyze its real color palette, typography feel, layout density, imagery style, and overall mood."
              : `It is a website/URL reference (${styleInspirationFile.url || styleInspirationFile.name}) — consider the visual style it suggests.`
          } Explicitly ground the "Design Vibe" part of the Executive Overview section, and the visual details (color palette, typography, spacing, component style) throughout the Screen-by-Screen UI/UX section, in this reference rather than inventing a generic aesthetic.`
        : "";

      // Per-file character budget for knowledge-base grounding. A codebase source (linked
      // GitHub repo or uploaded .zip) is a pre-built, already-prioritized digest — a small
      // slice of it would defeat the point, so it gets the same "one full grounded source"
      // budget the rest of the app uses (MAX_SOURCE_CHARS in App.tsx). Other file types keep
      // a smaller default since most uploaded docs are short enough that 12k chars is already
      // generous, and several such files often get attached at once.
      const KB_FILE_CHAR_CAP = 12000;
      const KB_CODEBASE_FILE_CHAR_CAP = 60000;
      const existingCodebaseFile = codebaseKnowledgeFiles.find(f => f.id === existingCodebaseFileId) || null;

      // Placed first and unmissable — this has to override the generic "recommend a stack /
      // design a new architecture" framing baked into several section instructions below,
      // which is actively wrong advice for an update to something already in production.
      const projectTypeContext = projectType === "update"
        ? existingCodebaseFile
          ? `\n\n⚠️ PROJECT TYPE: UPDATE TO AN EXISTING APPLICATION — READ BEFORE DRAFTING ANY SECTION ⚠️\nThis is an update to an application already in production, NOT a greenfield build. The existing codebase is attached below as "${existingCodebaseFile.name}" and reflects the CURRENT real system — treat it as ground truth, not inspiration. Wherever a section's instructions below say to "recommend" a stack or "design" an architecture, instead VALIDATE AND STATE the existing one found in the codebase: name the actual framework, language, and key dependencies with the specific evidence for each (e.g. "package.json lists react ^18.2.0, express ^4.18.0, and prisma ^5.10.0" — not a vague guess), then specify only what changes or gets added. Do not propose a different stack or a rewrite unless the app idea explicitly asks for one. Do NOT ask the product owner what the underlying tech stack is — it is attached below; read it. Be explicit, in every section, about exactly what changes, what stays exactly as-is, and how new work integrates with the existing code (real file/module names, existing patterns to follow, existing endpoints/schemas to extend rather than replace).`
          : `\n\n⚠️ PROJECT TYPE: UPDATE TO AN EXISTING APPLICATION — READ BEFORE DRAFTING ANY SECTION ⚠️\nThis is an update to an application already in production, NOT a greenfield build — but no existing codebase was attached to ground it on. Do NOT assume a specific existing stack, file structure, or architecture. Where a section's instructions below say to "recommend" a stack, instead state clearly that the existing stack is unknown and describe the update in stack-agnostic terms. Prefer flagging a genuine unknown via the QUESTIONS_FOR_USER mechanism (see below) over guessing at anything architecturally significant about the current system.`
        : "";

      const kbContext = `${projectTypeContext}${styleInspirationContext}${contentBearingKnowledgeFiles.length > 0
        ? `\n\nKNOWLEDGE BASE CONTEXT (${contentBearingKnowledgeFiles.length} files attached):\n${contentBearingKnowledgeFiles
            .map(f => {
              const cap = f.sourceType === "github" || f.sourceType === "codebase_zip" ? KB_CODEBASE_FILE_CHAR_CAP : KB_FILE_CHAR_CAP;
              const isExisting = existingCodebaseFile && f.id === existingCodebaseFile.id;
              const label = isExisting ? `${f.name} — THIS IS THE EXISTING CODEBASE BEING UPDATED` : f.name;
              return `--- ${label} ---\n${f.content.slice(0, cap)}`;
            })
            .join("\n\n")}${preflightContext}`
        : preflightContext}`;

      const toolInfo = VIBE_CODING_TOOLS.find(t => t.id === selectedTool) || VIBE_CODING_TOOLS[0];

      // The top agent (#1 in the left panel list) is designated as the Lead Architect & Facilitator
      const leadAgent = effectiveTeam[0];
      const uxAgent = effectiveTeam.find((a, i) => i > 0 && (a.persona.toLowerCase().includes("design") || a.persona.toLowerCase().includes("ux") || a.name.toLowerCase().includes("design"))) || effectiveTeam[1] || leadAgent;
      const techAgent = effectiveTeam.find((a, i) => i > 0 && (a.persona.toLowerCase().includes("tech") || a.persona.toLowerCase().includes("architect") || a.persona.toLowerCase().includes("system") || a.name.toLowerCase().includes("architect"))) || effectiveTeam[2] || effectiveTeam[1] || leadAgent;
      const qaAgent = effectiveTeam.find((a, i) => i > 0 && (a.persona.toLowerCase().includes("qa") || a.persona.toLowerCase().includes("vibe") || a.persona.toLowerCase().includes("specialist"))) || effectiveTeam[3] || effectiveTeam[2] || effectiveTeam[1] || leadAgent;

      // Step 1: Synthesize Title and App Summary (Led by top agent)
      setCurrentPhase(`Formulating Product Vision & Invariants with ${leadAgent.name} (Lead Architect)...`);
      const titlePrompt = `APP PROMPT:\n${prompt}\n${kbContext}\n\nTARGET AI CODING TOOL:\n${toolInfo.label}: ${toolInfo.recommendedFormat}`;
      const titleInstruction = `You are the Lead Product Architect (${leadAgent.name}). Based on the app prompt, return a raw JSON object with:
{
  "title": "Short, memorable app title",
  "subtitle": "1-sentence punchy elevator pitch / vision",
  "appConcept": "2-3 sentences summarizing the application, core user value, and why it's primed for vibe coding"
}
Output strictly raw JSON without markdown code fences.`;

      let parsedMeta = {
        title: "Vibe Coded Application",
        subtitle: "High-detail specification for AI coding agents",
        appConcept: prompt.slice(0, 200),
      };

      try {
        const metaRaw = await callAgent(leadAgent, titlePrompt, titleInstruction, signal);
        const cleaned = metaRaw.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(cleaned);
        if (json.title) parsedMeta = json;
      } catch (e) {
        logDebug("warn", "Meta parsing used fallback", e);
      }

      // Live incremental spec: pushed to `spec` state after every section finishes drafting
      // or reviewing (not on every intermediate review round — that would mean dozens of
      // updates per section), so the screen shows real progress as it happens and, just as
      // important, whatever's been produced so far survives an error partway through
      // instead of being silently discarded because nothing was ever shown until the very
      // end. `sectionsRef`/`questionsRef`/`notesRef` (declared above, outside the try block,
      // so the catch block can still read them) are mutated in place by the loops below and
      // read fresh each time pushLiveSpec() runs.
      const specId = `spec_${Date.now()}`;
      const buildGroundedExcerpt = (f: KnowledgeFile): string => {
        if (f.sourceType === "github" || f.sourceType === "codebase_zip") {
          // The digest built by codebaseIngest.ts starts with "# Codebase: <label>" then
          // "N total file(s) found..." — pulling those lines (rather than raw file content,
          // which would be far too long for a title page) is concrete proof the actual
          // repo/zip contents were read, not just that a source was attached.
          return f.content.split("\n").filter(l => l.trim()).slice(0, 2).join(" ").slice(0, 300);
        }
        return f.content.trim().replace(/\s+/g, " ").slice(0, 200);
      };
      const groundedSources = contentBearingKnowledgeFiles.map(f => ({
        name: f.name,
        sourceType: f.sourceType,
        url: f.sourceType === "github" ? f.url : undefined,
        excerpt: buildGroundedExcerpt(f),
      }));
      const pushLiveSpec = () => {
        setSpec({
          id: specId,
          title: parsedMeta.title,
          subtitle: parsedMeta.subtitle,
          targetTool: selectedTool,
          appConcept: parsedMeta.appConcept,
          createdAt: new Date().toISOString(),
          sections: [...sectionsRef],
          groundedSourceCount: contentBearingKnowledgeFiles.length,
          groundedSourceIds: contentBearingKnowledgeFiles.map(f => f.id),
          groundedSources: groundedSources.length > 0 ? groundedSources : undefined,
          facilitatorAgentName: leadAgent.name,
          openQuestions: questionsRef.length > 0 ? [...questionsRef] : undefined,
          preflightQuestions: preflight.length > 0 ? preflight : undefined,
          generationDepth,
          consistencyNotes: notesRef.length > 0 ? [...notesRef] : undefined,
          projectType,
          groundedOnExistingCodebase: existingCodebaseFile?.name,
        });
      };
      pushLiveSpec(); // shows the title/subtitle immediately, sections empty for now

      // Step 2: Define Sections to Generate
      const sectionConfigs: {
        key: ProductSpecSection["key"];
        heading: string;
        category: ProductSpecSection["category"];
        agent: CustomAgent;
        instruction: string;
      }[] = [
        {
          key: "overview",
          heading: "1. Executive Overview & Product Vibe",
          category: "strategy",
          agent: leadAgent,
          instruction: `You are the Lead Product Architect (${leadAgent.name}) drafting Section 1: Executive Overview & Product Vibe for "${parsedMeta.title}".
Provide an exhaustive, high-detail breakdown formatted in clear Markdown:
- **Problem Statement & Opportunity**: Why does this app exist? What pain points does it solve?
- **Target User Personas**: Primary persona, key motivation, tech literacy, and context of use.
- **Core Value Loop**: The single recurring loop that drives user satisfaction.
- **Vibe & Design Language**: Explicit aesthetic guidelines (modern, high-contrast, warm/cool neutral palette, typography scale, negative space philosophy).
- **Scope & Anti-Scope**: Explicit MVP boundaries (what MUST be built vs. what is strictly forbidden for the initial version to prevent AI bloat).`,
        },
        {
          key: "architecture",
          heading: "2. Tech Stack & System Architecture",
          category: "engineering",
          agent: techAgent,
          instruction: `You are the Principal System Architect (${techAgent.name}) drafting Section 2: Tech Stack & System Architecture for "${parsedMeta.title}".
Align strictly with the Executive Overview established by ${leadAgent.name} and optimize for ${toolInfo.label}:
- **Recommended Technology Stack**: Exact choices for Framework (e.g. Vite + React 18+ / Next.js), Language (TypeScript strict), Styling (Tailwind CSS v3/v4), State Management (React Context / Zustand), Icons (lucide-react), and Database/Persistence (e.g. Firestore / Supabase / SQLite / IndexedDB).
- **Project Directory & File Structure**: Full annotated ASCII tree showing modular directory layout (/src/components, /src/lib, /src/types, /src/hooks).
- **Architectural Guardrails**: Hard rules for AI coders (no circular imports, type-safe API boundaries, server-side secrets isolation, zero inline styles).
- **Dependencies List**: Exact npm package recommendations with rationale.`,
        },
        {
          key: "workflows",
          heading: "3. User Journeys & Step-by-Step Workflows",
          category: "strategy",
          agent: leadAgent,
          instruction: `You are the Lead Product Architect (${leadAgent.name}) drafting Section 3: User Journeys & Step-by-Step Workflows for "${parsedMeta.title}".
Format in clear Markdown:
- **First-Time User Journey (FTUX / Onboarding)**: Step-by-step walkthrough of the user's first 60 seconds.
- **Primary Core Flow**: Detailed chronological interaction loop with every button click, input, and visual outcome.
- **Secondary Flows**: Configuration, settings, data exports, search, filtering, or history review.
- **State Transition Map**: How user actions transition the app between views and persistent states.`,
        },
        {
          key: "ui_ux",
          heading: "4. Screen-by-Screen UI/UX Specifications",
          category: "design",
          agent: uxAgent,
          instruction: `You are the Design System Architect (${uxAgent.name}) drafting Section 4: Screen-by-Screen UI/UX Specifications for "${parsedMeta.title}".
Review and confirm alignment with ${leadAgent.name}'s user journeys and ${techAgent.name}'s architecture. Format in clear Markdown:
- **Screen Inventory**: Complete list of all views and modals.
- **Layout Anatomy**: Header, main workspace, action bars, inspector panels, and floating triggers.
- **Component Breakdown**: Visual anatomy of custom cards, list items, controls, and chips.
- **Complete Visual States Matrix**:
  - Empty States (illustrative icon, copy, clear CTA)
  - Loading / Pending States (skeleton loaders, subtle progress indicators)
  - Error States (inline banner, retry button, user-friendly guidance)
  - Success / Active States (micro-animations, confirmation badges)
- **Responsive Adaptations**: Mobile (375px+ touch targets min 44px) vs. Desktop (dense layouts, hover feedback).`,
        },
        {
          key: "data_models",
          heading: "5. Data Models, Schemas & TypeScript Types",
          category: "engineering",
          agent: techAgent,
          instruction: `You are the Principal System Architect (${techAgent.name}) drafting Section 5: Data Models, Schemas & TypeScript Types for "${parsedMeta.title}".
Verify all fields map directly to the UI screens defined by ${uxAgent.name} to avoid missing properties or discrepancies:
- **Complete TypeScript Type Definitions**: Every entity, interface, and enum fully defined with explicit types (no 'any').
- **Database / Storage Schema**: Table/collection schemas, field types, primary keys, relationships, and index recommendations.
- **Validation Rules & Invariants**: Max string lengths, required fields, constraints.
- **Sample Seed Data**: Realistic JSON mock data for instant testing in AI coding environments.`,
        },
        {
          key: "api_contracts",
          heading: "6. API Contracts & State Management",
          category: "engineering",
          agent: techAgent,
          instruction: `You are the Principal System Architect (${techAgent.name}) drafting Section 6: API Contracts & State Management for "${parsedMeta.title}".
Ensure client and server models harmonize with all earlier sections:
- **API Endpoints / Server Routes**: Methods (GET, POST, PUT, DELETE), paths, request headers, payload bodies, and status codes.
- **Client Service Layer**: Code examples of fetch wrappers, error handlers, and optimistic updates.
- **Global State Architecture**: How client state is structured, mutated, and synchronized with persistence.`,
        },
        {
          key: "edge_cases",
          heading: "7. Edge Cases, Guardrails & Error Recovery",
          category: "execution",
          agent: qaAgent,
          instruction: `You are the QA & Vibe Coding Specialist (${qaAgent.name}) drafting Section 7: Edge Cases, Guardrails & Error Recovery for "${parsedMeta.title}".
Audit the specs drafted by ${leadAgent.name}, ${techAgent.name}, and ${uxAgent.name} to prevent silent failures:
- **Network & Latency Failures**: Offline behavior, timeout recovery, retry loops with backoff.
- **Data Boundary Conditions**: Extremely long text handling, zero-item lists, oversized inputs, special characters.
- **Rate Limits & Token Constraints**: Defenses against API rate limits and AI context window limits.
- **Security & Secret Protection**: Explicit rules keeping API keys hidden from client-side code.`,
        },
        {
          key: "file_manifest",
          heading: "8. File Manifest — New & Modified Files",
          category: "engineering",
          agent: techAgent,
          instruction: `You are the Principal System Architect (${techAgent.name}) drafting Section 8: File Manifest — New & Modified Files for "${parsedMeta.title}".
This section exists so a developer or coding agent knows exactly which files to touch and where, with zero ambiguity about what's new versus what's being changed. Format as a Markdown table using exactly this column structure:

| File Path | Status | Purpose / Change Summary |
| --- | --- | --- |

- **File Path**: the real, exact relative path (e.g. \`src/components/TaskCard.tsx\`), consistent with the directory structure defined in the Tech Stack & Architecture section.
- **Status**: exactly one of "New", "Modified", or "Deleted" (use "Deleted" only if a file genuinely needs removing).
- **Purpose / Change Summary**: for "New" files, what the file is for; for "Modified" files, precisely what changes and why — never just "update this file"; for "Deleted" files, why it's being removed and what replaces it.

Every file touched by this work must appear in the table — a developer should be able to work from this table alone to know what to open versus what to create. ${
            projectType === "update"
              ? existingCodebaseFile
                ? `This is an UPDATE and the real existing file tree is provided in the knowledge base context under "${existingCodebaseFile.name}" — cross-reference it directly: any file you're changing that already appears there MUST be marked "Modified" using its exact real path copied from that tree, never renamed or guessed. Only mark a file "New" if it genuinely does not appear anywhere in the existing tree.`
                : `This is an UPDATE, but no existing codebase was attached, so you don't have the real file tree — do NOT invent specific existing file paths you can't actually know. Instead describe modified files by their likely existing role (e.g. "the file that currently defines the checkout flow"), clearly flagged as an assumption, and mark unambiguously New files as "New" regardless.`
              : `This is a NEW application, so every row's Status will read "New" — treat this table as the definitive build manifest for what to scaffold.`
          }`,
        },
        {
          key: "vibe_playbook",
          heading: `9. ${toolInfo.label} Implementation Playbook`,
          category: "execution",
          agent: qaAgent,
          instruction: `You are the Vibe Coding Specialist (${qaAgent.name}) drafting Section 9: ${toolInfo.label} Implementation Playbook for "${parsedMeta.title}".
Synthesize the entire team's agreements — including the File Manifest — into a phased, copy-paste playbook tailored for ${toolInfo.label}:
- **Phase 1: Project Scaffolding & Setup** (Copyable prompt for types, dependencies, Tailwind config).
- **Phase 2: Core Components & Layout Shell** (Copyable prompt for layout, responsive shell, empty states).
- **Phase 3: State Management & Primary Flow** (Copyable prompt for interactive state, forms, and business logic).
- **Phase 4: Persistence, Polish & Edge Cases** (Copyable prompt for error boundaries, storage, and polish).
- **Pro-Tips for Vibe Coding this App**: 3-4 golden rules to prevent context drift and hallucinations in ${toolInfo.label}.`,
        },
      ];

      const draftedSections: ProductSpecSection[] = sectionsRef;
      // Hoisted above the drafting loop (not just the review loop below) so a drafting
      // agent's own genuine questions land in the same Open Questions list as the
      // reviewer's — the user shouldn't have to know or care which phase raised something.
      const collectedQuestions: NonNullable<ProductSpec["openQuestions"]> = questionsRef;

      // Appended to every section's drafting instruction: gives the drafting agent itself
      // — not just the later reviewer — a way to flag a genuine ambiguity it personally
      // hit while writing, rather than silently guessing. This is NOT agent-to-agent
      // debate (each section is still drafted independently by one agent); it only lets
      // that one agent surface something to the human when it can't confidently proceed.
      const draftingQuestionsAddendum = `\n\nIf, while drafting, you hit a genuine ambiguity that only the product owner (not a teammate) can resolve, and you cannot reasonably proceed with a sensible default, append this exact block at the very end of your response, after all normal content (omit entirely if you have no such questions — most sections should have none):\n---QUESTIONS_FOR_USER---\n- your question here\n---END_QUESTIONS---`;

      for (let i = 0; i < sectionConfigs.length; i++) {
        if (signal.aborted) throw new DOMException("Spec generation stopped by user.", "AbortError");
        const cfg = sectionConfigs[i];
        setCurrentPhase(`Drafting ${cfg.heading} with ${cfg.agent.name}... (${i + 1}/${sectionConfigs.length})`);

        // Supply preceding drafted sections so subsequent agents cross-reference, validate agreements, and resolve conflicts
        const priorAgreements = draftedSections.length > 0
          ? `\n\nALREADY AGREED SPECIFICATION SECTIONS (Cross-reference these contributions to avoid contradictions):\n${draftedSections
              .map(s => `[Section: ${s.heading} | Author: ${s.authorAgentName}]\n${s.content.slice(0, 1600)}...`)
              .join("\n\n")}`
          : "";

        const promptBody = `TASK:\n${prompt}\n${kbContext}\n\nAPP TITLE: ${parsedMeta.title}\nCONCEPT: ${parsedMeta.appConcept}\nTARGET AI TOOL: ${toolInfo.label}${priorAgreements}`;
        const rawContent = await callAgent(cfg.agent, promptBody, cfg.instruction + draftingQuestionsAddendum, signal);

        const sectionId = `sec_${Date.now()}_${i}`;
        let content = rawContent.trim();
        const qBlockMatch = content.match(/---QUESTIONS_FOR_USER---([\s\S]*?)---END_QUESTIONS---/);
        if (qBlockMatch) {
          content = content.replace(qBlockMatch[0], "").trim();
          qBlockMatch[1]
            .split("\n")
            .map(l => l.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean)
            .forEach((q, qi) => {
              collectedQuestions.push({
                id: `q_draft_${Date.now()}_${i}_${qi}`,
                sectionId,
                sectionHeading: cfg.heading,
                question: q,
                askedByAgentName: cfg.agent.name,
                phase: "drafting",
              });
            });
        }

        draftedSections.push({
          id: sectionId,
          key: cfg.key,
          heading: cfg.heading,
          category: cfg.category,
          authorAgentId: cfg.agent.id,
          authorAgentName: cfg.agent.name,
          content,
        });
        pushLiveSpec(); // show this section on screen the moment it's drafted, before review even starts
      }

      // Step 3: Cross-Agent Review & Reconciliation (skipped in "quick" mode). Each section
      // is checked by a teammate other than its author for feasibility, technical
      // truthfulness, and consistency with every other section AND the grounded knowledge
      // base — the automated equivalent of manually copying a draft between models until
      // they stop disagreeing. Anything the reviewer can fix by giving the author better
      // instructions gets one revision pass; anything that genuinely needs a
      // product-owner decision is surfaced as an open question instead of being silently
      // guessed at.
      const consistencyNotes: string[] = notesRef;
      // Cap on review→revise rounds per section (see runSpecGeneration's docs): most
      // sections converge in 1-2 rounds; this exists to bound worst-case cost rather than
      // loop indefinitely on a genuine, unresolvable disagreement.
      const MAX_REVIEW_ROUNDS = 3;

      // Prefers a reviewer on a DIFFERENT model/provider than the author — same-family
      // models tend to share blind spots, so a same-provider "independent" review is a
      // weaker check than a genuinely different model catching something the author's own
      // model would never have flagged (this is the whole reason manually bouncing a draft
      // between two different providers works as well as it does). Role diversity (QA vs.
      // Tech Lead vs. UX, etc.) is still preferred when it doesn't cost provider diversity;
      // only falls back to a same-provider reviewer when the team has no other provider
      // available at all.
      const pickReviewer = (authorId: string, authorProvider: string): { agent: CustomAgent; crossProvider: boolean } => {
        const roleOrder = [qaAgent, techAgent, uxAgent, leadAgent].filter(a => a.id !== authorId);
        const others = effectiveTeam.filter(a => a.id !== authorId);
        const best = roleOrder.find(a => a.provider !== authorProvider) || others.find(a => a.provider !== authorProvider) || roleOrder[0] || others[0] || effectiveTeam[0];
        return { agent: best, crossProvider: best.provider !== authorProvider };
      };
      // Pushes the section's current content onto its own history before it gets
      // overwritten, so a later revision never loses the prior version.
      const recordRevision = (sec: ProductSpecSection, reason: string): ProductSpecSection["revisionHistory"] => [
        ...(sec.revisionHistory || []),
        { content: sec.content, revisedAt: new Date().toISOString(), reason },
      ];

      if (generationDepth === "thorough") {
        for (let i = 0; i < draftedSections.length; i++) {
          if (signal.aborted) throw new DOMException("Spec generation stopped by user.", "AbortError");
          let sec = draftedSections[i];
          const author = effectiveTeam.find(a => a.id === sec.authorAgentId) || leadAgent;
          const { agent: reviewer, crossProvider } = pickReviewer(sec.authorAgentId, author.provider);

          let round = 0;
          let converged = false;
          const roundIssues: string[] = [];

          // The convergence loop: review, and if the reviewer isn't satisfied, revise and
          // show the REVISED content back to the SAME reviewer rather than accepting the
          // revision on faith — this is the actual "loop until both sides agree" behavior,
          // not just one review and one automatic fix.
          while (round < MAX_REVIEW_ROUNDS) {
            round++;
            setCurrentPhase(`${reviewer.name} is cross-checking "${sec.heading}" — round ${round}/${MAX_REVIEW_ROUNDS}... (section ${i + 1}/${draftedSections.length})`);

            const otherSectionsSummary = draftedSections
              .filter(s => s.id !== sec.id)
              .map(s => `[${s.heading} | Author: ${s.authorAgentName}]\n${s.content.slice(0, 2500)}`)
              .join("\n\n");

            const reviewInstruction = `You are ${reviewer.name}, an independent reviewer on this product spec team — NOT the author of the section below. Scrutinize it for:
1. Feasibility: is everything described actually buildable as written, with no hand-waving?
2. Truthfulness: any unsupported claims, invented library/API behavior, or technical inaccuracies? If you have access to a web search tool, use it to verify any specific, checkable technical claim (a library's actual behavior, an API's actual limits) rather than judging from memory alone.
3. Consistency: does it contradict, duplicate, or drift from anything already agreed in the OTHER sections supplied below, OR from the knowledge base context supplied below (if any)?
4. Completeness: is anything a developer would need left implicit or missing?
5. Existing-codebase fit (only relevant if this is an update to an existing app with a codebase attached — see the knowledge base context): does this section actually respect the real stack, patterns, and structure found in that codebase, rather than quietly proposing a different stack or a rewrite?
${round > 1 ? `\nThis is round ${round} of up to ${MAX_REVIEW_ROUNDS} — the author has already revised this section once in response to your prior feedback. Check specifically whether your previous concerns were actually resolved, not just addressed on the surface.` : ""}

Respond with ONLY a raw JSON object, no markdown fences, no commentary before or after it:
{
  "verdict": "approved" | "needs_revision",
  "issues": ["specific, actionable issue the author should fix"],
  "questionsForUser": ["a question ONLY the product owner can answer — a scope, business-rule, or preference decision that engineering/design judgment cannot resolve alone"],
  "revisionInstructions": "if needs_revision, precise guidance for the author on exactly what to change; empty string if approved"
}
Most problems belong in "issues" for the author to simply fix. Only use "questionsForUser" for genuine product decisions — keep that list short, ideally empty.`;

            const reviewPrompt = `SECTION UNDER REVIEW: "${sec.heading}" (by ${sec.authorAgentName})\n\n${sec.content}\n\nOTHER AGREED SPEC SECTIONS (for consistency cross-check):\n${otherSectionsSummary}${kbContext}`;

            let review: { verdict?: string; issues?: string[]; questionsForUser?: string[]; revisionInstructions?: string } | null = null;
            try {
              const raw = await callAgent(reviewer, reviewPrompt, reviewInstruction, signal);
              const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
              review = JSON.parse(cleaned);
            } catch (e) {
              logDebug("warn", `Review of "${sec.heading}" (round ${round}) could not be parsed`, e);
              break; // can't evaluate further — stop the loop, keep the current content
            }

            (review.questionsForUser || []).forEach((q, qi) => {
              if (!q || !q.trim()) return;
              collectedQuestions.push({
                id: `q_${Date.now()}_${i}_${round}_${qi}`,
                sectionId: sec.id,
                sectionHeading: sec.heading,
                question: q.trim(),
                askedByAgentName: reviewer.name,
                phase: "review",
              });
            });

            const needsRevision = review.verdict === "needs_revision" && ((review.issues && review.issues.length > 0) || !!review.revisionInstructions);
            if (!needsRevision) {
              converged = true;
              break;
            }

            roundIssues.push(...(review.issues || []));
            if (round >= MAX_REVIEW_ROUNDS) break; // don't revise again just to leave it unreviewed — stop here, flagged below

            setCurrentPhase(`${author.name} is addressing ${reviewer.name}'s feedback on "${sec.heading}" (round ${round})...`);
            const revisionInstruction = `You previously drafted the section "${sec.heading}" for "${parsedMeta.title}". A fellow reviewer (${reviewer.name}) checked it against the rest of the spec and raised the points below. Redraft the section addressing every point — your reviewer will check this specific revision next, so make sure each point is genuinely resolved, not just superficially touched. Do not restate the heading — write only the section body in Markdown.

ISSUES RAISED:
${(review.issues || []).map(i2 => `- ${i2}`).join("\n") || "(none)"}

REVISION GUIDANCE:
${review.revisionInstructions || "Tighten technical accuracy and resolve any inconsistency with the other sections."}`;
            try {
              const revised = await callAgent(author, `EXISTING SECTION CONTENT:\n${sec.content}`, revisionInstruction, signal);
              sec = {
                ...sec,
                content: revised.trim(),
                revisionHistory: recordRevision(sec, `Review round ${round} by ${reviewer.name}: ${(review.issues || []).join("; ") || review.revisionInstructions}`),
              };
              draftedSections[i] = sec; // keep in place so later sections' "other sections" context sees the latest version
            } catch (e) {
              logDebug("warn", `Failed to apply round ${round} revision to "${sec.heading}" — keeping the last version reviewed`, e);
              break;
            }
          }

          draftedSections[i] = {
            ...sec,
            reviewedByAgentName: reviewer.name,
            reviewVerdict: converged ? (round > 1 ? "revised" : "approved") : "flagged",
            reviewNotes: roundIssues.length > 0 ? roundIssues.join("; ") : undefined,
            reviewRounds: round,
            reviewCrossProvider: crossProvider,
          };
          pushLiveSpec(); // show this section's finished review state once it's fully resolved (not on every intermediate round)
        }

        // Step 4: Final Consistency Sweep. The per-section review above is order-dependent
        // — section 1's reviewer never sees what section 8 became AFTER its own revision.
        // One lightweight pass over the FINAL state of every section catches anything that
        // slipped through purely because of ordering, without re-running full
        // feasibility/truthfulness review a second time (expensive, mostly redundant).
        if (!signal.aborted && draftedSections.length > 1) {
          setCurrentPhase(`${leadAgent.name} is running a final cross-section consistency sweep...`);
          const fullSpecSummary = draftedSections
            .map(s => `[${s.heading} | Author: ${s.authorAgentName}]\n${s.content.slice(0, 2000)}`)
            .join("\n\n");
          const sweepInstruction = `You are ${leadAgent.name}. All sections of "${parsedMeta.title}" have now been individually reviewed and revised. Read the FINAL version of every section below and check ONLY for cross-section contradictions that may have been introduced by revisions happening out of order (e.g. one section's fix changed a field name, endpoint, or assumption that another section still references the old way). Do not re-review feasibility or completeness — only ordering-induced contradictions.

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{
  "conflicts": [
    { "sectionHeading": "exact heading of the section that needs a small fix", "fixInstruction": "precise instruction for what to change in that section" }
  ],
  "minorNotes": ["a note worth recording but not worth an automatic edit"]
}
Keep "conflicts" to genuine contradictions only — empty array is a fine and common answer.`;
          try {
            const raw = await callAgent(leadAgent, fullSpecSummary, sweepInstruction, signal);
            const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
            const sweep: { conflicts?: { sectionHeading: string; fixInstruction: string }[]; minorNotes?: string[] } = JSON.parse(cleaned);
            (sweep.minorNotes || []).forEach(n => { if (n && n.trim()) consistencyNotes.push(n.trim()); });
            if ((sweep.minorNotes || []).length > 0) pushLiveSpec();
            for (const conflict of sweep.conflicts || []) {
              const idx = draftedSections.findIndex(s => s.heading === conflict.sectionHeading);
              if (idx === -1 || !conflict.fixInstruction) continue;
              const sec = draftedSections[idx];
              const author = effectiveTeam.find(a => a.id === sec.authorAgentId) || leadAgent;
              setCurrentPhase(`${author.name} is reconciling "${sec.heading}" after the consistency sweep...`);
              try {
                const fixed = await callAgent(
                  author,
                  `EXISTING SECTION CONTENT:\n${sec.content}`,
                  `You previously drafted "${sec.heading}" for "${parsedMeta.title}". The final consistency sweep found it now conflicts with another section that changed after your draft. Fix ONLY this: ${conflict.fixInstruction}\nRedraft the full section body in Markdown, unchanged except for this fix. Do not restate the heading.`,
                  signal
                );
                draftedSections[idx] = {
                  ...sec,
                  content: fixed.trim(),
                  revisionHistory: recordRevision(sec, `Consistency sweep: ${conflict.fixInstruction}`),
                  reviewVerdict: "revised",
                  reviewNotes: sec.reviewNotes ? `${sec.reviewNotes}; ${conflict.fixInstruction}` : conflict.fixInstruction,
                };
                pushLiveSpec();
              } catch (e) {
                logDebug("warn", `Consistency sweep fix failed for "${sec.heading}"`, e);
              }
            }
          } catch (e) {
            logDebug("warn", "Final consistency sweep could not be parsed — skipping", e);
          }
        }
      }

      // Final push: identical in shape to every incremental one above, this just guarantees
      // the very last state (including any consistency-sweep notes) is what's on screen and
      // what gets saved once generation is complete.
      pushLiveSpec();
      logDebug(
        "info",
        `Product specification generated successfully: ${parsedMeta.title}`,
        `${sectionsRef.length} sections, ${sectionsRef.filter(s => s.reviewVerdict === "revised").length} revised after review${questionsRef.length > 0 ? `, ${questionsRef.length} open question(s) for you` : ""}`
      );
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) {
        logDebug("info", "Product spec generation aborted by user.", `${sectionsRef.length} section(s) completed before stopping — still shown on screen.`);
      } else {
        logDebug("error", "Error generating product spec", `${err?.message || err}${sectionsRef.length > 0 ? ` — ${sectionsRef.length} section(s) completed before the error are still shown on screen.` : ""}`);
      }
    } finally {
      setIsGenerating(false);
      setCurrentPhase("");
      abortControllerRef.current = null;
    }
  };

  // In-place section regeneration
  const handleRegenerateSection = async (sectionId: string, feedback: string) => {
    if (!spec) return;
    const targetSec = spec.sections.find(s => s.id === sectionId);
    if (!targetSec) return;

    setIsRegeneratingSectionId(sectionId);
    try {
      const agent = effectiveTeam.find(a => a.id === targetSec.authorAgentId) || effectiveTeam[0];
      const otherHeadings = spec.sections.filter(s => s.id !== sectionId).map(s => s.heading).join(", ");
      const existingCodebaseNote = spec.projectType === "update"
        ? spec.groundedOnExistingCodebase
          ? ` This spec is an UPDATE to an existing app grounded on "${spec.groundedOnExistingCodebase}" — keep the revision consistent with that real codebase's actual stack and patterns, not a different one.`
          : " This spec is an UPDATE to an existing app (no codebase was attached) — don't invent a specific existing stack in this revision."
        : "";
      const instruction = `You previously drafted the section "${targetSec.heading}" for the product specification titled "${spec.title}".${existingCodebaseNote}
Other sections in this spec: ${otherHeadings}.

MANAGER FEEDBACK / REVISION GOAL:
${feedback.trim() ? feedback.trim() : "Deepen the technical specificity, provide cleaner code blocks/tables, and ensure pristine architectural alignment."}

Redraft ONLY this section's content in Markdown. Do not restate the section heading — write only the section body.`;

      const promptBody = `APP CONCEPT:\n${spec.appConcept}\n\nEXISTING SECTION CONTENT TO REVISE:\n${targetSec.content}`;
      const newContent = await callAgent(agent, promptBody, instruction);

      const updatedSections = spec.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              content: newContent.trim(),
              revisionHistory: [
                ...(s.revisionHistory || []),
                { content: s.content, revisedAt: new Date().toISOString(), reason: feedback.trim() || "Manual refine (no feedback given)" },
              ],
            }
          : s
      );

      setSpec({ ...spec, sections: updatedSections });
      setRegenDraft(null);
      logDebug("info", `Section regenerated: ${targetSec.heading}`);
    } catch (err: any) {
      logDebug("error", `Failed to regenerate section ${targetSec.heading}`, err?.message || err);
    } finally {
      setIsRegeneratingSectionId(null);
    }
  };

  // Restores a prior version from a section's revision history — pushes the current
  // content onto history (so restoring is itself undoable) and swaps in the chosen past
  // version.
  const handleRestoreRevision = (sectionId: string, historyIndex: number) => {
    if (!spec) return;
    const targetSec = spec.sections.find(s => s.id === sectionId);
    if (!targetSec || !targetSec.revisionHistory || !targetSec.revisionHistory[historyIndex]) return;
    const restoredEntry = targetSec.revisionHistory[historyIndex];

    const updatedSections = spec.sections.map(s => {
      if (s.id !== sectionId) return s;
      const newHistory = [...(s.revisionHistory || [])];
      newHistory[historyIndex] = { content: s.content, revisedAt: new Date().toISOString(), reason: "Superseded by restore" };
      return { ...s, content: restoredEntry.content, revisionHistory: newHistory };
    });

    setSpec({ ...spec, sections: updatedSections });
    logDebug("info", `Restored a previous version of "${targetSec.heading}"`);
  };

  // Answering an Open Question refines just the section it affects, reusing the existing
  // section-regeneration path with the user's answer folded in as feedback.
  const handleAnswerQuestion = async (questionId: string) => {
    if (!spec) return;
    const q = spec.openQuestions?.find(oq => oq.id === questionId);
    const answer = questionDrafts[questionId]?.trim();
    if (!q || !answer) return;

    setIsAnsweringQuestionId(questionId);
    try {
      await handleRegenerateSection(
        q.sectionId,
        `The team raised this question during review: "${q.question}" — here is the product owner's answer. Incorporate it precisely into the section: ${answer}`
      );
      setSpec(prev =>
        prev
          ? { ...prev, openQuestions: prev.openQuestions?.map(oq => (oq.id === questionId ? { ...oq, answer } : oq)) }
          : prev
      );
    } finally {
      setIsAnsweringQuestionId(null);
    }
  };

  const filteredSections = spec?.sections.filter(s => {
    if (selectedCategory === "all") return true;
    return s.category === selectedCategory;
  }) || [];

  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Main Console Card: Prompt + Target AI Tool + Controls */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                Product Specification Console
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed max-w-2xl">
                Describe the application you want to build. Your multi-agent team will formulate comprehensive, production-ready specifications, schemas, UI matrices, and prompt playbooks. The top agent on the left panel acts as the Lead Architect who formulates the vision and orchestrates the team; specialized members draft and cross-reference each other's sections to confirm contributions and eliminate conflicting requirements.
              </CardDescription>
            </div>

            {/* Generation Depth Toggle + Target AI Tool Picker (Dropdown) */}
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setGenerationDepth("quick")}
                    disabled={isGenerating}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      generationDepth === "quick"
                        ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    }`}
                    title="Draft only — skip cross-agent review for a fast first pass"
                  >
                    Quick
                  </button>
                  <button
                    onClick={() => setGenerationDepth("thorough")}
                    disabled={isGenerating}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      generationDepth === "thorough"
                        ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    }`}
                    title="Draft, then cross-agent review, revision, and a final consistency sweep"
                  >
                    Thorough
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <label htmlFor="target-ai-tool-select" className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                Target AI Tool:
              </label>
              <div className="relative">
                <select
                  id="target-ai-tool-select"
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value as VibeCodingTool)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  {VIBE_CODING_TOOLS.map(tool => (
                    <option key={tool.id} value={tool.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">
                      {tool.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              </div>
            </div>
          </div>

          {/* Project Type: New build vs. update to something already in production — a
              structural choice, so it's a persistent control rather than left entirely to
              the pre-flight LLM check's discretion (see projectTypeContext). */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setProjectType("new")}
                  disabled={isGenerating}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    projectType === "new"
                      ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                  title="A new application, built from scratch"
                >
                  New Application
                </button>
                <button
                  onClick={() => setProjectType("update")}
                  disabled={isGenerating}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    projectType === "update"
                      ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                  title="An update to an app that's already in production"
                >
                  Update Existing App
                </button>
              </div>
            </div>

            {projectType === "update" && (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <label htmlFor="existing-codebase-select" className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  Existing codebase:
                </label>
                <div className="relative">
                  <select
                    id="existing-codebase-select"
                    value={existingCodebaseFileId}
                    onChange={(e) => setExistingCodebaseFileId(e.target.value)}
                    disabled={isGenerating}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm max-w-[240px] truncate"
                  >
                    <option value="">None attached — proceed without grounding</option>
                    {codebaseKnowledgeFiles.map(f => (
                      <option key={f.id} value={f.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {codebaseKnowledgeFiles.length === 0 ? (
                  <button onClick={() => openLeftPanel?.()} className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                    + Link a GitHub repo or upload a .zip
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 whitespace-nowrap">optional — not attaching one is fine</span>
                )}
              </div>
            )}
          </div>

          {/* Selected Tool Tagline helper */}
          {(() => {
            const current = VIBE_CODING_TOOLS.find(t => t.id === selectedTool);
            if (!current) return null;
            return (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{current.label}:</span>
                <span className="truncate">{current.tagline}</span>
              </div>
            );
          })()}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the application you want to vibe code (e.g. 'Build an AI voice journal with real-time waveform recording, emotion tagging, weekly trend heatmaps, and offline IndexedDB caching')..."
              rows={4}
              className="w-full text-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[96px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none leading-relaxed"
            />

            {/* Prompt actions: Expand Prompt */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!prompt.trim() || isExpandingPrompt || isGenerating}
                  onClick={handleExpandPrompt}
                  className="h-8 text-xs rounded-lg gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  {isExpandingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Expand My Prompt for Vibe Coding
                </Button>
                {openSuggestTeam && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => openSuggestTeam(prompt)}
                    className="h-8 text-xs rounded-lg gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Suggest Spec Team
                  </Button>
                )}
                {contentBearingKnowledgeFiles.length > 0 && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Grounding with {contentBearingKnowledgeFiles.length} file{contentBearingKnowledgeFiles.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {/* Start Generation / Stop Button */}
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => abortControllerRef.current?.abort()}
                    className="h-9 px-4 text-xs font-semibold gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Stop Drafting
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!prompt.trim() || preflightState === "checking" || preflightState === "confirming"}
                    onClick={handleGenerateSpec}
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-2 shadow-sm transition-all"
                  >
                    {preflightState === "checking" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {preflightState === "checking" ? "Checking your idea for gaps..." : "Generate Product Spec"}
                  </Button>
                )}
              </div>
            </div>

            {/* Pre-flight Clarifying Questions — asked by the Lead Architect BEFORE
                drafting starts, only when something fundamental is genuinely ambiguous. */}
            {preflightState === "asking" && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-3 mt-3 animate-in fade-in">
                {preflightLocked.length > 0 && (
                  <div className="space-y-1.5 pb-2 border-b border-blue-200/60 dark:border-blue-900/40">
                    {preflightLocked.map(q => (
                      <p key={q.id} className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{q.question}</span> — {q.answer || "(left blank, assuming a sensible default)"}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {preflightQuestions.length > 0
                    ? `Before drafting, ${effectiveTeam[0]?.name || "the Lead Architect"} has ${preflightQuestions.length} more quick question${preflightQuestions.length === 1 ? "" : "s"}`
                    : "No further questions from the team — ready to generate"}
                </div>
                {preflightQuestions.length > 0 && (
                  <div className="space-y-2.5">
                    {preflightQuestions.map(q =>
                      q.isStyleInspiration ? (
                        <div key={q.id} className="space-y-2 p-2.5 rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-card">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{q.question}</label>
                          {q.answer ? (
                            <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-md px-2 py-1.5">
                              <span className="truncate">{q.answer}</span>
                              <button type="button" onClick={handleStyleInspirationChangeAnswer} className="text-slate-400 hover:text-slate-600 shrink-0 text-[11px] underline">
                                Change
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                <Button
                                  type="button" size="sm" variant={styleInspirationMode === "existing" ? "default" : "outline"}
                                  className="h-7 text-[11px]"
                                  onClick={() => setStyleInspirationMode(m => m === "existing" ? "undecided" : "existing")}
                                  disabled={styleInspirationCandidates.length === 0}
                                >
                                  Pick from knowledge base{styleInspirationCandidates.length > 0 ? ` (${styleInspirationCandidates.length})` : ""}
                                </Button>
                                <Button
                                  type="button" size="sm" variant="outline" className="h-7 text-[11px]"
                                  onClick={() => styleInspirationFileInputRef.current?.click()}
                                  disabled={isAttachingStyleInspiration || !onAddStyleInspirationImage}
                                >
                                  {isAttachingStyleInspiration ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Upload image"}
                                </Button>
                                <Button
                                  type="button" size="sm" variant={styleInspirationMode === "new_url" ? "default" : "outline"}
                                  className="h-7 text-[11px]"
                                  onClick={() => setStyleInspirationMode(m => m === "new_url" ? "undecided" : "new_url")}
                                  disabled={!onAddStyleInspirationUrl}
                                >
                                  Paste a URL
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] text-slate-500" onClick={handleStyleInspirationSkip}>
                                  No, skip this
                                </Button>
                              </div>
                              <input
                                ref={styleInspirationFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleStyleInspirationFileUpload}
                              />
                              {styleInspirationMode === "existing" && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {styleInspirationCandidates.map(f => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => applyStyleInspirationChoice(f)}
                                      className="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 truncate max-w-[200px]"
                                      title={f.name}
                                    >
                                      {f.sourceType === "image" ? "🖼️" : "🔗"} {f.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {styleInspirationMode === "new_url" && (
                                <div className="flex gap-1.5 pt-1">
                                  <Input
                                    value={styleInspirationUrlDraft}
                                    onChange={(e) => setStyleInspirationUrlDraft(e.target.value)}
                                    placeholder="https://example.com/design-reference"
                                    className="h-7 text-xs bg-card"
                                  />
                                  <Button type="button" size="sm" className="h-7 text-[11px] shrink-0" onClick={handleStyleInspirationUrlSubmit} disabled={!styleInspirationUrlDraft.trim()}>
                                    Attach
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div key={q.id} className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{q.question}</label>
                          <Input
                            value={preflightAnswers[q.id] || ""}
                            onChange={(e) => setPreflightAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Your answer (optional — leave blank to let the team assume a sensible default)"
                            className="h-8 text-xs bg-card"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleSubmitPreflight}
                    disabled={isAskingMorePreflight || preflightQuestions.some(q => q.isStyleInspiration && !q.answer)}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> {preflightQuestions.length > 0 ? "Continue With Answers" : "Review & Continue"}
                  </Button>
                  {preflightQuestions.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAskMorePreflight}
                      disabled={isAskingMorePreflight}
                      className="h-8 text-xs gap-1.5"
                    >
                      {isAskingMorePreflight ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                      Ask More Questions
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSkipPreflight}
                    disabled={isAskingMorePreflight}
                    className="h-8 text-xs text-slate-500"
                  >
                    Skip, review and continue
                  </Button>
                </div>
              </div>
            )}

            {/* Final confirmation — every choice about to shape generation, editable in
                place, before any model calls actually happen. */}
            {preflightState === "confirming" && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-3 mt-3 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ListChecks className="w-3.5 h-3.5" />
                  Confirm before generating
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-card border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide">Project Type</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{projectType === "update" ? "Update Existing App" : "New Application"}</p>
                  </div>
                  {projectType === "update" && (
                    <div className="p-2 rounded-lg bg-card border border-slate-200 dark:border-slate-800">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wide">Existing Codebase</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{codebaseKnowledgeFiles.find(f => f.id === existingCodebaseFileId)?.name || "None attached"}</p>
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-card border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide">Target AI Tool</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{VIBE_CODING_TOOLS.find(t => t.id === selectedTool)?.label || selectedTool}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide">Depth</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{generationDepth === "thorough" ? "Thorough (review + revise)" : "Quick (draft only)"}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Wrong project type, tool, or depth? Change it using the controls above — this card updates live.
                </p>

                {confirmQA.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 pt-2">Your pre-flight answers — edit if needed:</p>
                    {confirmQA.map((qa, idx) =>
                      qa.isStyleInspiration ? (
                        <div key={qa.id} className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{qa.question}</label>
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-card border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                            {qa.answer || "No style inspiration provided — use your own design judgment."}
                          </p>
                        </div>
                      ) : (
                        <div key={qa.id} className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{qa.question}</label>
                          <Input
                            value={qa.answer || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfirmQA(prev => prev.map((p, i) => (i === idx ? { ...p, answer: val || undefined } : p)));
                            }}
                            placeholder="(left blank — team will assume a sensible default)"
                            className="h-8 text-xs bg-card"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleConfirmGeneration} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" /> Start Generation
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelConfirm} className="h-8 text-xs text-slate-500">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Expanded Prompt Preview */}
            {expandedDraft && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-3 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Expanded Product Brief — review before using
                  </span>
                  <button onClick={() => setExpandedDraft(null)} className="text-xs text-slate-400 hover:text-slate-600">
                    Dismiss
                  </button>
                </div>
                <Textarea
                  value={expandedDraft}
                  onChange={(e) => setExpandedDraft(e.target.value)}
                  rows={5}
                  className="w-full text-xs bg-card border-slate-200 dark:border-slate-800 rounded-lg p-3"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => { setPrompt(expandedDraft); setExpandedDraft(null); }}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Use This Prompt
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedDraft(null)}
                    className="h-8 text-xs text-slate-500"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Generation Progress Indicator */}
          {isGenerating && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {currentPhase || "Multi-agent team is collaborating on the product specification..."}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The Product Strategist, System Architect, Design Architect, and Vibe Coding Specialist are formulating your architecture, UI matrix, schemas, and prompt playbook.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Spec Output (When available) - NO DECISION TREE */}
      {spec && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Spec Header & Action Toolbar */}
          <div className="sticky top-[76px] z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {spec.title}
                </h2>
                <Badge variant="outline" className="text-xs font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  {VIBE_CODING_TOOLS.find(t => t.id === spec.targetTool)?.label || spec.targetTool}
                </Badge>
                {spec.groundedSourceCount > 0 && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800">
                    {spec.groundedSourceCount} grounded source{spec.groundedSourceCount === 1 ? "" : "s"}
                  </Badge>
                )}
                {spec.preflightQuestions && spec.preflightQuestions.some(q => q.answer) && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 dark:border-blue-800 cursor-help">
                          <HelpCircle className="w-3 h-3 mr-1" />
                          {spec.preflightQuestions.filter(q => q.answer).length} pre-flight answer{spec.preflightQuestions.filter(q => q.answer).length === 1 ? "" : "s"}
                        </Badge>
                      }
                    />
                    <TooltipContent className="flex-col items-start !max-w-sm w-80 max-h-72 overflow-y-auto gap-2 py-2.5">
                      {spec.preflightQuestions.filter(q => q.answer).map(q => (
                        <p key={q.id} className="text-left leading-snug"><span className="font-semibold">{q.question}</span> — {q.answer}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                )}
                {spec.projectType === "update" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${spec.groundedOnExistingCodebase ? "text-purple-600 border-purple-200 dark:border-purple-800" : "text-amber-600 border-amber-200 dark:border-amber-800"}`}
                    title={spec.groundedOnExistingCodebase ? `Grounded on ${spec.groundedOnExistingCodebase}` : "No existing codebase was attached"}
                  >
                    Update{spec.groundedOnExistingCodebase ? ` · grounded on ${spec.groundedOnExistingCodebase}` : " · no codebase attached"}
                  </Badge>
                )}
                {spec.generationDepth === "quick" && (
                  <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 dark:border-slate-700">
                    Quick draft — no cross-agent review
                  </Badge>
                )}
              </div>
              {spec.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{spec.subtitle}</p>
              )}
            </div>

            {/* Action Buttons: Copy Spec, Copy Playbook, Copy .cursorrules, Download .md */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(buildProductSpecMarkdown(spec), "full_spec")}
                className="text-xs h-8 gap-1.5"
              >
                {copiedType === "full_spec" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === "full_spec" ? "Copied Spec!" : "Copy Full Spec"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(buildVibeCodingPlaybookMarkdown(spec), "playbook")}
                className="text-xs h-8 gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
              >
                {copiedType === "playbook" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5" />}
                {copiedType === "playbook" ? "Copied Prompts!" : "Copy Vibe Prompts"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(buildCursorRules(spec), "cursorrules")}
                className="text-xs h-8 gap-1.5"
              >
                {copiedType === "cursorrules" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
                {copiedType === "cursorrules"
                  ? "Copied Rules!"
                  : spec.targetTool === "google_ai_studio"
                  ? "Copy AI Studio Prompt"
                  : "Copy .cursorrules"}
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadSpec}
                className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-3.5 h-3.5" /> Download .md
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button size="sm" variant="outline" disabled={isExportingFormat !== null} className="text-xs h-8 gap-1.5">
                    {isExportingFormat ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    {isExportingFormat ? `Exporting ${isExportingFormat}...` : "Export As..."}
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={handleExportDocx} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
                    <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-500" /> Word Document (.docx)</span>
                    <span className="text-xs text-slate-400 pl-5">Editable in Microsoft Word or LibreOffice</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportRtf} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
                    <span className="flex items-center gap-2"><FileCode2 className="w-3.5 h-3.5 text-slate-500" /> Rich Text (.rtf)</span>
                    <span className="text-xs text-slate-400 pl-5">Opens in nearly any word processor</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
                    <span className="flex items-center gap-2"><FileDown className="w-3.5 h-3.5 text-red-500" /> PDF</span>
                    <span className="text-xs text-slate-400 pl-5">Fixed-layout, ready to share or print</span>
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" role="separator" />
                  <DropdownMenuItem onClick={handleExportDocx} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
                    <span className="flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5 text-emerald-600" /> Google Docs</span>
                    <span className="text-xs text-slate-400 pl-5">Downloads as .docx — Google Docs opens it via File → Open, or upload it to Drive</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Readiness Summary — one glance at whether this is actually ready to hand off,
              without reading every section's badge individually. */}
          {!isGenerating && spec.generationDepth === "thorough" && (() => {
            const total = spec.sections.length;
            const approved = spec.sections.filter(s => s.reviewVerdict === "approved").length;
            const revised = spec.sections.filter(s => s.reviewVerdict === "revised").length;
            const flagged = spec.sections.filter(s => s.reviewVerdict === "flagged").length;
            const unanswered = (spec.openQuestions || []).filter(q => !q.answer).length;
            const isReady = flagged === 0 && unanswered === 0;
            const crossProviderCount = spec.sections.filter(s => s.reviewCrossProvider === true).length;
            const sameProviderCount = spec.sections.filter(s => s.reviewCrossProvider === false).length;
            return (
              <div
                className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-xl border text-xs ${
                  isReady
                    ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/10"
                }`}
              >
                <span className={`flex items-center gap-1.5 font-semibold ${isReady ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                  <ListChecks className="w-3.5 h-3.5" />
                  {isReady ? "Ready for handoff" : "Not quite ready yet"}
                </span>
                <span className="text-slate-600 dark:text-slate-400">{approved}/{total} approved outright</span>
                {revised > 0 && <span className="text-slate-600 dark:text-slate-400">{revised} revised after review</span>}
                {flagged > 0 && <span className="text-amber-700 dark:text-amber-400 font-medium">{flagged} still flagged — see badges below</span>}
                {unanswered > 0 && <span className="text-amber-700 dark:text-amber-400 font-medium">{unanswered} open question{unanswered === 1 ? "" : "s"} unanswered</span>}
                {spec.consistencyNotes && spec.consistencyNotes.length > 0 && (
                  <span className="text-slate-500 dark:text-slate-400" title={spec.consistencyNotes.join("; ")}>
                    {spec.consistencyNotes.length} minor note{spec.consistencyNotes.length === 1 ? "" : "s"} from the consistency sweep
                  </span>
                )}
                {sameProviderCount > 0 && (
                  <span
                    className="text-slate-500 dark:text-slate-400"
                    title="These sections were reviewed by an agent on the same model provider as the author — add a teammate on a different provider for stronger independent review."
                  >
                    {crossProviderCount > 0 ? `${sameProviderCount}/${total} reviewed same-provider` : "all reviews were same-provider — add a different-provider teammate for a stronger check"}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Storage-limit warning: this spec is large enough that Chat History would trim
              some of it (old section content / superseded revisions) on save — see
              wouldExceedHistoryStorageLimits. Offers two explicit actions rather than
              silently trimming and saying nothing, or silently backing up somewhere. */}
          {wouldExceedHistoryStorageLimits(spec) && storageWarningDismissedForId !== spec.id && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/10 text-xs space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    This spec is large — Chat History keeps a size-capped copy, so some older section revisions won't be saved there in full. Export a full copy now, or back it up to Google Drive, to keep everything.
                  </span>
                </p>
                <button
                  onClick={() => setStorageWarningDismissedForId(spec.id)}
                  className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-200 flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleExportDocx} disabled={isExportingFormat !== null} className="h-7 text-xs gap-1.5">
                  <FileDown className="w-3.5 h-3.5" /> Export Full Copy (.docx)
                </Button>
                {onBackupToDrive && (
                  <Button size="sm" variant="outline" onClick={handleBackupToDrive} disabled={!!isBackingUpToDrive} className="h-7 text-xs gap-1.5">
                    {isBackingUpToDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    Back Up to Google Drive
                  </Button>
                )}
              </div>
              {driveBackupResult && (
                driveBackupResult.success ? (
                  <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Backed up to Drive.
                    {driveBackupResult.webViewLink && (
                      <a href={driveBackupResult.webViewLink} target="_blank" rel="noreferrer" className="underline hover:no-underline">
                        Open in Drive
                      </a>
                    )}
                  </p>
                ) : (
                  <p className="text-red-600 dark:text-red-400">Backup failed: {driveBackupResult.error}</p>
                )
              )}
            </div>
          )}

          {/* Open Questions raised by the cross-agent review pass — things only the
              product owner can decide. Answering one refines just the affected section. */}
          {spec.openQuestions && spec.openQuestions.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  Open Questions From The Team ({spec.openQuestions.filter(q => !q.answer).length} unanswered)
                </CardTitle>
                <CardDescription className="text-xs">
                  While cross-checking each other's work, the team flagged decisions only you can make. Answer below to refine the affected section immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {spec.openQuestions.map(oq => (
                  <div
                    key={oq.id}
                    className={`p-3 rounded-xl border ${
                      oq.answer
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10"
                        : "border-amber-200 dark:border-amber-900/60 bg-card"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{oq.question}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Raised by {oq.askedByAgentName}{oq.phase === "drafting" ? " while drafting" : oq.phase === "review" ? " during review" : ""} — affects "{oq.sectionHeading}"
                    </p>
                    {oq.answer ? (
                      <p className="text-xs mt-2 text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Answered: {oq.answer}</span>
                      </p>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={questionDrafts[oq.id] || ""}
                          onChange={(e) => setQuestionDrafts(prev => ({ ...prev, [oq.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAnswerQuestion(oq.id);
                          }}
                          placeholder="Your answer..."
                          className="h-8 text-xs flex-1 bg-card"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAnswerQuestion(oq.id)}
                          disabled={isAnsweringQuestionId === oq.id || !questionDrafts[oq.id]?.trim()}
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                        >
                          {isAnsweringQuestionId === oq.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Answer & Refine"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* View Mode & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => setActiveView("spec")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === "spec"
                    ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Structured Spec ({spec.sections.length} sections)
              </button>
              <button
                onClick={() => setActiveView("playbook")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === "playbook"
                    ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> AI Coding Playbook
              </button>
              <button
                onClick={() => setActiveView("rules")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === "rules"
                    ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> {spec.targetTool === "google_ai_studio" ? "AI Studio Directives" : ".cursorrules"}
              </button>
              <button
                onClick={() => setActiveView("raw")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === "raw"
                    ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Raw Markdown
              </button>
            </div>

            {/* Category Filter Pills (When in Structured Spec View) */}
            {activeView === "spec" && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "strategy", label: "Strategy" },
                  { id: "design", label: "UI / UX" },
                  { id: "engineering", label: "Architecture" },
                  { id: "execution", label: "Playbook" },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VIEW 1: STRUCTURED SPEC VIEW (NO DECISION TREE) */}
          {activeView === "spec" && (
            <div className="space-y-6">
              {filteredSections.map((sec) => (
                <Card key={sec.id} className="shadow-md border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {sec.heading}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono text-slate-500">
                            {sec.category}
                          </Badge>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Drafted by {sec.authorAgentName}
                        </span>
                        {sec.reviewedByAgentName && (
                          <span
                            className={`ml-2 text-xs font-medium ${
                              sec.reviewVerdict === "flagged"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                            title={sec.reviewNotes || undefined}
                          >
                            · {sec.reviewVerdict === "revised" ? `Revised${sec.reviewRounds && sec.reviewRounds > 1 ? ` (${sec.reviewRounds} rounds)` : ""} after review` : sec.reviewVerdict === "flagged" ? `Still flagged after ${sec.reviewRounds || 1} round${(sec.reviewRounds || 1) === 1 ? "" : "s"} by` : "Reviewed by"} {sec.reviewedByAgentName}
                          </span>
                        )}
                        {sec.reviewedByAgentName && sec.reviewCrossProvider === false && (
                          <span className="ml-2 text-xs text-slate-400" title="This reviewer uses the same model provider as the author — for a stronger independent check, add a teammate on a different provider.">
                            (same-provider review)
                          </span>
                        )}
                      </div>

                      {/* In-place section regeneration trigger + revision history */}
                      <div className="flex items-center gap-2">
                        {sec.revisionHistory && sec.revisionHistory.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedHistorySectionId(expandedHistorySectionId === sec.id ? null : sec.id)}
                            className="h-8 text-xs gap-1.5 text-slate-500 hover:text-blue-600"
                          >
                            <History className="w-3.5 h-3.5" />
                            History ({sec.revisionHistory.length})
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRegenDraft(regenDraft?.id === sec.id ? null : { id: sec.id, feedback: "" })}
                          disabled={isRegeneratingSectionId !== null}
                          className="h-8 text-xs gap-1.5 text-slate-500 hover:text-blue-600"
                        >
                          {isRegeneratingSectionId === sec.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Refine Section
                        </Button>
                      </div>
                    </div>

                    {/* Revision History Panel — every prior version, oldest first, with a
                        one-click restore. */}
                    {expandedHistorySectionId === sec.id && sec.revisionHistory && (
                      <div className="space-y-2 mt-2 p-3 rounded-lg bg-surface-2 border border-slate-200 dark:border-slate-800 animate-in fade-in">
                        {sec.revisionHistory.map((rev, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-3 p-2 rounded-md bg-card border border-slate-200 dark:border-slate-800">
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400">{new Date(rev.revisedAt).toLocaleString()}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate" title={rev.reason}>{rev.reason}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreRevision(sec.id, idx)}
                              className="h-7 text-[11px] gap-1 flex-shrink-0"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Section Regeneration Input */}
                    {regenDraft?.id === sec.id && (
                      <div className="flex gap-2 p-2.5 mt-2 rounded-lg bg-surface-2 border border-blue-200 dark:border-blue-900/60 animate-in fade-in">
                        <Input
                          value={regenDraft.feedback}
                          onChange={(e) => setRegenDraft({ id: sec.id, feedback: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRegenerateSection(sec.id, regenDraft.feedback);
                          }}
                          placeholder="How should this section change? (e.g. 'Switch database to Supabase', 'Add mobile bottom sheet specs')..."
                          className="h-8 text-xs flex-1 bg-card"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRegenerateSection(sec.id, regenDraft.feedback)}
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                      {sec.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* VIEW 2: AI CODING PLAYBOOK */}
          {activeView === "playbook" && (
            <Card className="shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      Step-by-Step AI Coding Agent Playbook
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Copy these prompt phases sequentially into your AI coding tool (Cursor, Claude Code, Lovable, v0) to build the app cleanly.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(buildVibeCodingPlaybookMarkdown(spec), "playbook")}
                    className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {copiedType === "playbook" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Playbook
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {buildVibeCodingPlaybookMarkdown(spec)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW 3: .cursorrules */}
          {activeView === "rules" && (
            <Card className="shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-600" />
                      .cursorrules Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Place this in your project root as <code>.cursorrules</code> to lock in project invariants.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(buildCursorRules(spec), "cursorrules")}
                      className="h-8 text-xs gap-1.5"
                    >
                      {copiedType === "cursorrules" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownloadCursorRules}
                      className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Save .cursorrules
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {buildCursorRules(spec)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW 4: RAW MARKDOWN */}
          {activeView === "raw" && (
            <Card className="shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Complete Markdown Product Specification
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(buildProductSpecMarkdown(spec), "full_spec")}
                    className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {copiedType === "full_spec" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy All Markdown
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {buildProductSpecMarkdown(spec)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up / Team Consultation Card */}
          <Card className="border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Want to discuss or tailor these specs with the team?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open Team Chat to ask follow-up questions, challenge architecture decisions, or generate specialized code stubs.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openChatDrawer?.(`Regarding the product spec for "${spec.title}": `)}
                className="h-8 text-xs gap-1.5 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 whitespace-nowrap"
              >
                Discuss in Team Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
