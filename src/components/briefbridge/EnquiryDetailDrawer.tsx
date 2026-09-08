// src/components/briefbridge/EnquiryDetailDrawer.tsx
//
// Slide-over inspection view for a single enquiry: full submission details, custom
// question answers, status control, and the "Pipe to Prompt" action that compiles
// the enquiry into a Markdown brief and seeds it into the Product tab.

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { EnquiryStatusBadge } from "@/src/components/briefbridge/EnquiryTable";
import { compileEnquiryToPrompt } from "@/src/lib/briefBridgePrompt";
import { deleteEnquiry, updateEnquiryNotes, updateEnquiryStatus } from "@/src/lib/briefBridgeService";
import type { Enquiry, EnquiryStatus, IntakeFormConfig, PipeToPromptOptions, PipeToPromptTool } from "@/src/types/briefBridge";
import { BUDGET_TIER_LABELS, ENQUIRY_STATUS_LABELS, TARGET_LAUNCH_LABELS } from "@/src/types/briefBridge";

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
  onClose: () => void;
  onPipeToPrompt: (prompt: string) => void;
}

export function EnquiryDetailDrawer({ enquiry, config, userId, onClose, onPipeToPrompt }: EnquiryDetailDrawerProps) {
  const [notes, setNotes] = useState(enquiry?.internalNotes || "");
  const [options, setOptions] = useState<PipeToPromptOptions>({
    tool: "generic",
    includeTechStack: true,
    includeBudgetTimeline: true,
    includeDesignAssets: true,
  });

  const compiled = useMemo(() => {
    if (!enquiry) return "";
    return compileEnquiryToPrompt({ ...enquiry, internalNotes: notes }, config, options);
  }, [enquiry, config, options, notes]);

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
    if (!confirm(`Delete the enquiry from ${enquiry.clientName}? This can't be undone.`)) return;
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
            {enquiry.clientName} · {enquiry.clientEmail}{enquiry.clientCompany ? ` · ${enquiry.clientCompany}` : ""}
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
              {config.customQuestions.map(q => (
                <div key={q.id} className="text-sm">
                  <p className="text-xs text-slate-400">{q.label}</p>
                  <p className="text-slate-700 dark:text-slate-200">
                    {(() => {
                      const val = enquiry.customAnswers?.[q.id];
                      if (val === undefined || val === "") return "—";
                      if (Array.isArray(val)) return val.join(", ") || "—";
                      if (typeof val === "boolean") return val ? "Yes" : "No";
                      return String(val);
                    })()}
                  </p>
                </div>
              ))}
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

            <Button
              onClick={() => onPipeToPrompt(compiled)}
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
