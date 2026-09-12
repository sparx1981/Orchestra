// src/components/briefbridge/EnquiryDetailDrawer.tsx
//
// Slide-over inspection view for a single enquiry: full submission details, custom
// question answers, status control, and the "Pipe to Prompt" action. That action compiles
// the enquiry into a sanitized Markdown brief (compileEnquiryToPrompt), has an agent turn
// it into a single well-structured Product tab prompt, and seeds THAT into the Product tab
// when sent — the compiled brief itself is grounding data, not what actually gets sent.

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, ExternalLink, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { EnquiryStatusBadge } from "@/src/components/briefbridge/EnquiryTable";
import { compileEnquiryToPrompt } from "@/src/lib/briefBridgePrompt";
import { deleteEnquiry, updateEnquiryNotes, updateEnquiryStatus } from "@/src/lib/briefBridgeService";
import type { Enquiry, EnquiryStatus, IntakeFormConfig, PipeToPromptOptions, PipeToPromptTool } from "@/src/types/briefBridge";
import { BUDGET_TIER_LABELS, ENQUIRY_STATUS_LABELS, TARGET_LAUNCH_LABELS, enquiryClientFullName, isCustomFileAnswer } from "@/src/types/briefBridge";

function formatBytesLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
import type { CustomAgent } from "@/src/App";
import { DEFAULT_PRODUCT_AGENTS } from "@/src/lib/productSpecTypes";

// The compiled Markdown brief (see compileEnquiryToPrompt) is a faithful but mechanically
// assembled dump of every field — good grounding, poor prompt. This turns it into the single,
// coherent "describe your app idea" prompt the Product tab actually expects: one lead agent
// call, reading the sanitized brief as pure data and restating the client's request as a
// developer would phrase it, never adding anything the brief doesn't support.
const AI_PROMPT_INSTRUCTION = `You are helping a developer hand a client's intake-form brief to a product-spec generation tool. Read the compiled brief below (already sanitized client input) and produce ONE clear, well-organized prompt describing the requested application, written as if the developer were describing the app idea themselves.

Cover, where the brief actually supports it: the core problem/goal and who it's for, must-have features, anything explicitly out of scope, stated technology or design preferences (label these as client preferences to weigh, not firm requirements, unless the client was explicit that they're required), and relevant budget/timeline context.

Write it as plain prose and/or bullet points suitable for pasting into a single "describe your app idea" text box — NOT as a formal document with a title, headings, or metadata. Do not invent features, users, or constraints the brief doesn't mention. Output ONLY the prompt text itself, nothing else (no preamble like "Here is the prompt:").`;

const TOOL_OPTIONS: { value: PipeToPromptTool; label: string }[] = [
  { value: "generic", label: "Generic / any tool" },
  { value: "cursor", label: "Cursor" },
  { value: "claude_code", label: "Claude Code" },
  { value: "lovable", label: "Lovable" },
  { value: "v0", label: "v0" },
];

interface EnquiryDetailDrawerProps {
  enquiry: Enquiry | null;
  config: IntakeFormConfig | null;
  userId: string;
  productTeam: CustomAgent[];
  callAgent: (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal) => Promise<string>;
  onClose: () => void;
  onPipeToPrompt: (prompt: string) => void;
}

export function EnquiryDetailDrawer({ enquiry, config, userId, productTeam, callAgent, onClose, onPipeToPrompt }: EnquiryDetailDrawerProps) {
  const [notes, setNotes] = useState(enquiry?.internalNotes || "");
  const [options, setOptions] = useState<PipeToPromptOptions>({
    tool: "generic",
    includeTechStack: true,
    includeBudgetTimeline: true,
    includeDesignAssets: true,
  });

  // Notes (and the AI-drafted prompt below) are local component state, but the drawer
  // itself is never unmounted between enquiries — only `enquiry` swaps — so both need an
  // explicit reset keyed on the enquiry's id or they'd silently carry over from whichever
  // enquiry was open before.
  useEffect(() => {
    setNotes(enquiry?.internalNotes || "");
  }, [enquiry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const compiled = useMemo(() => {
    if (!enquiry) return "";
    return compileEnquiryToPrompt({ ...enquiry, internalNotes: notes }, config, options);
  }, [enquiry, config, options, notes]);

  // The AI-drafted Product tab prompt — see AI_PROMPT_INSTRUCTION. Editable once drafted,
  // and what actually gets sent by "Send to Product tab" (compiled is now purely the
  // sanitized source material fed to the agent, not shown directly).
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  // What `compiled` looked like the last time aiPrompt was (re)generated — lets the UI flag
  // "the brief changed since this was drafted" without re-calling the model automatically
  // on every keystroke/option toggle.
  const [promptGeneratedFrom, setPromptGeneratedFrom] = useState<string | null>(null);

  const effectiveTeam = productTeam.length > 0 ? productTeam : DEFAULT_PRODUCT_AGENTS;

  async function draftPromptFrom(brief: string) {
    setIsGeneratingPrompt(true);
    setPromptError(null);
    try {
      const result = await callAgent(effectiveTeam[0], brief, AI_PROMPT_INSTRUCTION);
      setAiPrompt(result.trim());
      setPromptGeneratedFrom(brief);
    } catch (err: any) {
      setPromptError(err?.message || "Failed to draft the prompt — try again, or edit the brief manually below.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  const handleRegeneratePrompt = () => draftPromptFrom(compiled);

  // Auto-draft once whenever a (different) enquiry is opened — the whole point is that the
  // prompt is already sitting there ready to send. Deliberately NOT re-triggered by every
  // options/notes edit afterward (that would mean a model call per checkbox click); those
  // instead just mark the draft stale via promptGeneratedFrom below, with an explicit
  // Regenerate action. Builds the brief directly from `enquiry` here rather than reading the
  // memoized `compiled` — `notes` state resets in a separate effect on the same dependency,
  // and effects run before that reset's state update is committed, so `compiled` in THIS
  // render would still reflect the previous enquiry's notes.
  useEffect(() => {
    setAiPrompt("");
    setPromptGeneratedFrom(null);
    setPromptError(null);
    if (enquiry) draftPromptFrom(compileEnquiryToPrompt(enquiry, config, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry?.id]);

  const isPromptStale = promptGeneratedFrom !== null && promptGeneratedFrom !== compiled;

  if (!enquiry) return null;

  async function handleStatusChange(status: EnquiryStatus) {
    if (!enquiry) return;
    await updateEnquiryStatus(userId, enquiry.id, status);
  }

  async function handleSaveNotes() {
    if (!enquiry) return;
    await updateEnquiryNotes(userId, enquiry.id, notes);
  }

  async function handleDelete() {
    if (!enquiry) return;
    if (!confirm(`Delete the enquiry from ${enquiryClientFullName(enquiry)}? This can't be undone.`)) return;
    await deleteEnquiry(userId, enquiry.id);
    onClose();
  }

  return (
    <Sheet open={!!enquiry} onOpenChange={open => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{enquiry.projectTitle || "Untitled project"}</SheetTitle>
            <EnquiryStatusBadge status={enquiry.status} />
          </div>
          <SheetDescription>
            {enquiryClientFullName(enquiry)} · {enquiry.clientEmail}{enquiry.clientCompany ? ` · ${enquiry.clientCompany}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-400">Budget tier</p>
              <p className="font-medium">{BUDGET_TIER_LABELS[enquiry.budgetTier]}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-400">Target launch</p>
              <p className="font-medium">{TARGET_LAUNCH_LABELS[enquiry.targetLaunch]}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={enquiry.status} onValueChange={v => handleStatusChange(v as EnquiryStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ENQUIRY_STATUS_LABELS) as EnquiryStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Project overview</Label>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              {enquiry.projectDescription}
            </p>
          </div>

          {enquiry.techPreferences.length > 0 && (
            <div className="space-y-1.5">
              <Label>Technology preferences</Label>
              <p className="text-sm text-slate-600 dark:text-slate-300">{enquiry.techPreferences.join(", ")}</p>
            </div>
          )}

          {enquiry.assetLinks.length > 0 && (
            <div className="space-y-1.5">
              <Label>Reference links</Label>
              <ul className="space-y-1">
                {enquiry.assetLinks.map((link, i) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                      {link} <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {config && config.customQuestions.length > 0 && (
            <div className="space-y-2">
              <Label>Additional answers</Label>
              {config.customQuestions.map(q => {
                const val = enquiry.customAnswers?.[q.id];
                return (
                  <div key={q.id} className="text-sm">
                    <p className="text-xs text-slate-400">{q.label}</p>
                    {isCustomFileAnswer(val) ? (
                      <a
                        href={val.dataUrl}
                        download={val.fileName}
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        {val.fileName} ({formatBytesLabel(val.size)}) <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-200">
                        {val === undefined || val === ""
                          ? "—"
                          : Array.isArray(val)
                          ? val.join(", ") || "—"
                          : typeof val === "boolean"
                          ? val ? "Yes" : "No"
                          : String(val)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea id="internalNotes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes} placeholder="Not visible to the client..." />
          </div>

          <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/15 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pipe to Prompt
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Target tool</Label>
              <Select value={options.tool} onValueChange={v => setOptions(o => ({ ...o, tool: v as PipeToPromptTool }))}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOOL_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {([
                ["includeTechStack", "Tech preferences"],
                ["includeBudgetTimeline", "Budget & timeline"],
                ["includeDesignAssets", "Reference links"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Checkbox checked={options[key]} onCheckedChange={checked => setOptions(o => ({ ...o, [key]: !!checked }))} />
                  {label}
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">AI-drafted prompt for the Product tab</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRegeneratePrompt}
                  disabled={isGeneratingPrompt}
                  className="h-6 px-2 text-[11px] text-blue-600 hover:text-blue-700 gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingPrompt ? "animate-spin" : ""}`} />
                  {isGeneratingPrompt ? "Drafting..." : "Regenerate"}
                </Button>
              </div>
              <Textarea
                rows={6}
                value={isGeneratingPrompt && !aiPrompt ? "" : aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={isGeneratingPrompt ? "Reviewing the client's answers and drafting a prompt..." : "Nothing drafted yet — click Regenerate."}
                disabled={isGeneratingPrompt}
                className="text-xs bg-white dark:bg-slate-900"
              />
              {promptError && (
                <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {promptError}
                </p>
              )}
              {!promptError && isPromptStale && !isGeneratingPrompt && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Target tool, options, or notes changed since this was drafted — Regenerate to reflect them, or send as-is.
                </p>
              )}
            </div>

            <Button
              onClick={() => onPipeToPrompt(aiPrompt.trim() || compiled)}
              disabled={isGeneratingPrompt || (!aiPrompt.trim() && !compiled.trim())}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Send to Product tab
            </Button>
          </div>

          <Button variant="ghost" onClick={handleDelete} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete enquiry
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
