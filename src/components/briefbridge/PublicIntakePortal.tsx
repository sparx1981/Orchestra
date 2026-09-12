// src/components/briefbridge/PublicIntakePortal.tsx
//
// Rendered at /intake/:token for an unauthenticated visitor — a client filling in
// a project brief with no Orchestra account of their own. No admin chrome, no nav,
// no auth wall. Mirrors the standalone-shell pattern already used for SharedRunView
// in App.tsx (early-returned before the authenticated app tree mounts).

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { fetchPublicIntakeForm, submitPublicIntake } from "@/src/lib/briefBridgeService";
import type { BudgetTier, CustomFieldResponse, PublicIntakeFormConfig, TargetLaunchTimeframe } from "@/src/types/briefBridge";
import { BUDGET_TIER_LABELS, TARGET_LAUNCH_LABELS, isCustomFileAnswer } from "@/src/types/briefBridge";

type LoadState = "loading" | "not_found" | "ready";

// Keeps a "file"-type custom answer small enough to leave real headroom under Firestore's
// 1MB-per-document cap once base64-encoded (~33% inflation) alongside everything else on
// the enquiry (project description, other custom answers, etc.) — same reasoning as
// MAX_IMAGE_BYTES in App.tsx, just a bit smaller since an enquiry doc has more going on
// than a single knowledge-base file does.
const MAX_CUSTOM_FILE_BYTES = 700 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PublicIntakePortal({ token }: { token: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [form, setForm] = useState<PublicIntakeFormConfig | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientFirstName, setClientFirstName] = useState("");
  const [clientSurname, setClientSurname] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [budgetTier, setBudgetTier] = useState<BudgetTier>("undisclosed");
  const [targetLaunch, setTargetLaunch] = useState<TargetLaunchTimeframe>("flexible");
  const [techPreferencesRaw, setTechPreferencesRaw] = useState("");
  const [assetLinksRaw, setAssetLinksRaw] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, CustomFieldResponse>>({});
  // Per-question error for "file"-type answers (too large, or failed to read) — kept
  // separate from `error` (the whole-form submit error) since it's specific to one field.
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  // Honeypot: real visitors never see this field (visually hidden, tabIndex -1).
  const [gotcha, setGotcha] = useState("");

  function handleCustomFileChange(questionId: string, file: File | null) {
    if (!file) {
      setCustomAnswers(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      setFileErrors(prev => ({ ...prev, [questionId]: "" }));
      return;
    }
    if (file.size > MAX_CUSTOM_FILE_BYTES) {
      setFileErrors(prev => ({ ...prev, [questionId]: `File is too large (max ${formatFileSize(MAX_CUSTOM_FILE_BYTES)}).` }));
      return;
    }
    setFileErrors(prev => ({ ...prev, [questionId]: "" }));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomAnswers(prev => ({ ...prev, [questionId]: { fileName: file.name, dataUrl, size: file.size } }));
    };
    reader.onerror = () => setFileErrors(prev => ({ ...prev, [questionId]: "Couldn't read that file — try again." }));
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    (async () => {
      const result = await fetchPublicIntakeForm(token);
      setForm(result);
      setLoadState(result ? "ready" : "not_found");
    })();
  }, [token]);

  const accent = form?.accentColor || "#3b82f6";

  const missingRequired = useMemo(() => {
    if (!form) return true;
    if (!clientFirstName.trim() || !clientEmail.trim() || !projectTitle.trim() || !projectDescription.trim()) return true;
    for (const q of form.customQuestions) {
      if (!q.required) continue;
      const val = customAnswers[q.id];
      if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) return true;
    }
    return false;
  }, [form, clientFirstName, clientEmail, projectTitle, projectDescription, customAnswers]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || missingRequired || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicIntake(token, (form as any).userId, {
        clientFirstName: clientFirstName.trim(),
        clientSurname: clientSurname.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientCompany: clientCompany.trim() || undefined,
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        budgetTier,
        targetLaunch,
        techPreferences: techPreferencesRaw.split(",").map(s => s.trim()).filter(Boolean),
        assetLinks: assetLinksRaw.split("\n").map(s => s.trim()).filter(Boolean),
        customAnswers,
        _gotcha: gotcha || undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong submitting your brief. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (loadState === "not_found" || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-slate-950 p-8">
        <div className="text-center space-y-2 text-slate-500">
          <ShieldAlert className="w-10 h-10 mx-auto stroke-[1.5]" />
          <p className="text-sm">This intake form isn't available. It may have been unpublished or the link may be incorrect.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-slate-950 p-8">
        <div className="max-w-md text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: accent }} />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Brief received</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Thanks{clientFirstName ? `, ${clientFirstName}` : ""} — {form.companyName || "we"} will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
            {form.companyName || "Project intake"}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1>
          {form.description && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{form.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot — hidden from real visitors via layout, not display:none (some bots
              skip display:none fields specifically). Never focusable via keyboard. */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="company_website">Company Website</label>
            <input id="company_website" tabIndex={-1} autoComplete="off" value={gotcha} onChange={e => setGotcha(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientFirstName">First name *</Label>
              <Input id="clientFirstName" required value={clientFirstName} onChange={e => setClientFirstName(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientSurname">Surname</Label>
              <Input id="clientSurname" value={clientSurname} onChange={e => setClientSurname(e.target.value)} maxLength={200} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientEmail">Email *</Label>
            <Input id="clientEmail" type="email" required value={clientEmail} onChange={e => setClientEmail(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientCompany">Company (optional)</Label>
            <Input id="clientCompany" value={clientCompany} onChange={e => setClientCompany(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectTitle">Project name *</Label>
            <Input id="projectTitle" required value={projectTitle} onChange={e => setProjectTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectDescription">What are you looking to build? *</Label>
            <Textarea
              id="projectDescription"
              required
              rows={6}
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              maxLength={6000}
              placeholder="Describe the product, who it's for, and what it needs to do..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Target launch</Label>
              <Select value={targetLaunch} onValueChange={v => setTargetLaunch(v as TargetLaunchTimeframe)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TARGET_LAUNCH_LABELS) as TargetLaunchTimeframe[]).map(k => (
                    <SelectItem key={k} value={k}>{TARGET_LAUNCH_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget range</Label>
              <Select value={budgetTier} onValueChange={v => setBudgetTier(v as BudgetTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BUDGET_TIER_LABELS) as BudgetTier[]).map(k => (
                    <SelectItem key={k} value={k}>{BUDGET_TIER_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="techPreferences">Technology preferences (optional, comma-separated)</Label>
            <Input id="techPreferences" value={techPreferencesRaw} onChange={e => setTechPreferencesRaw(e.target.value)} placeholder="React, Postgres, Stripe..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assetLinks">Reference links (optional, one per line)</Label>
            <Textarea id="assetLinks" rows={2} value={assetLinksRaw} onChange={e => setAssetLinksRaw(e.target.value)} placeholder="https://..." />
          </div>

          {form.customQuestions.map(q => (
            <div key={q.id} className="space-y-1.5">
              <Label htmlFor={q.id}>{q.label}{q.required ? " *" : ""}</Label>
              {q.description && <p className="text-xs text-slate-400">{q.description}</p>}
              {q.type === "textarea" ? (
                <Textarea
                  id={q.id}
                  rows={3}
                  required={q.required}
                  placeholder={q.placeholder}
                  value={(customAnswers[q.id] as string) || ""}
                  onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
              ) : q.type === "boolean" ? (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id={q.id}
                    checked={!!customAnswers[q.id]}
                    onCheckedChange={checked => setCustomAnswers(prev => ({ ...prev, [q.id]: !!checked }))}
                  />
                  <Label htmlFor={q.id} className="font-normal">Yes</Label>
                </div>
              ) : q.type === "select" ? (
                <Select
                  value={(customAnswers[q.id] as string) || ""}
                  onValueChange={v => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Choose one..." /></SelectTrigger>
                  <SelectContent>
                    {(q.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : q.type === "multi_select" ? (
                <div className="flex flex-wrap gap-2">
                  {(q.options || []).map(opt => {
                    const selected = ((customAnswers[q.id] as string[]) || []).includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setCustomAnswers(prev => {
                            const current = (prev[q.id] as string[]) || [];
                            return { ...prev, [q.id]: selected ? current.filter(v => v !== opt) : [...current, opt] };
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected ? "text-white border-transparent" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                        style={selected ? { backgroundColor: accent } : undefined}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : q.type === "file" ? (
                <div className="space-y-1">
                  <input
                    id={q.id}
                    type="file"
                    onChange={e => handleCustomFileChange(q.id, e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
                  />
                  {isCustomFileAnswer(customAnswers[q.id]) && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {(customAnswers[q.id] as any).fileName} ({formatFileSize((customAnswers[q.id] as any).size)}) selected
                    </p>
                  )}
                  {fileErrors[q.id] && <p className="text-xs text-red-500">{fileErrors[q.id]}</p>}
                </div>
              ) : (
                <Input
                  id={q.id}
                  required={q.required}
                  placeholder={q.placeholder}
                  value={(customAnswers[q.id] as string) || ""}
                  onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  maxLength={1000}
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={missingRequired || submitting}
            className="w-full h-10 text-white"
            style={{ backgroundColor: accent }}
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Send brief"}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center">Powered by Orchestra</p>
      </div>
    </div>
  );
}
