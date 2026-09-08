// src/components/briefbridge/IntakeFormBuilderDialog.tsx
//
// Lets a developer configure their public intake form: branding, the shareable
// link, notification recipients, and a small dynamic custom-question builder.

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Plus, Trash2 } from "lucide-react";
import { saveIntakeConfig } from "@/src/lib/briefBridgeService";
import type { CustomQuestion, CustomQuestionType, IntakeFormConfig } from "@/src/types/briefBridge";

function newQuestion(): CustomQuestion {
  return { id: `q_${Math.random().toString(36).slice(2, 10)}`, label: "", type: "text", required: false };
}

interface IntakeFormBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: IntakeFormConfig;
}

export function IntakeFormBuilderDialog({ open, onOpenChange, config }: IntakeFormBuilderDialogProps) {
  const [draft, setDraft] = useState<IntakeFormConfig>(config);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailsRaw, setEmailsRaw] = useState(config.notificationEmails.join(", "));

  useEffect(() => {
    setDraft(config);
    setEmailsRaw(config.notificationEmails.join(", "));
  }, [config, open]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/intake/${draft.token}` : `/intake/${draft.token}`;

  async function handleSave() {
    setSaving(true);
    try {
      const notificationEmails = emailsRaw.split(",").map(s => s.trim()).filter(Boolean);
      await saveIntakeConfig({ ...draft, notificationEmails });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(id: string, patch: Partial<CustomQuestion>) {
    setDraft(d => ({ ...d, customQuestions: d.customQuestions.map(q => (q.id === id ? { ...q, ...patch } : q)) }));
  }

  function removeQuestion(id: string) {
    setDraft(d => ({ ...d, customQuestions: d.customQuestions.filter(q => q.id !== id) }));
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intake form settings</DialogTitle>
          <DialogDescription>Configure the public form clients see, and where new-lead notifications go.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-slate-400">Turn off to take the public link offline without deleting it.</p>
            </div>
            <Switch checked={draft.isPublished} onCheckedChange={v => setDraft(d => ({ ...d, isPublished: v }))} />
          </div>

          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
              <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Form title</Label>
              <Input id="title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" value={draft.companyName || ""} onChange={e => setDraft(d => ({ ...d, companyName: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="accentColor">Accent color</Label>
              <Input id="accentColor" type="color" value={draft.accentColor || "#3b82f6"} onChange={e => setDraft(d => ({ ...d, accentColor: e.target.value }))} className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notificationEmails">Notify these emails on new leads</Label>
              <Input id="notificationEmails" value={emailsRaw} onChange={e => setEmailsRaw(e.target.value)} placeholder="you@studio.com, team@studio.com" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom questions</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setDraft(d => ({ ...d, customQuestions: [...d.customQuestions, newQuestion()] }))} className="gap-1.5 h-7 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add question
              </Button>
            </div>

            {draft.customQuestions.length === 0 && (
              <p className="text-xs text-slate-400 py-2">No custom questions yet — the form will just ask for the standard fields.</p>
            )}

            {draft.customQuestions.map(q => (
              <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="Question label" value={q.label} onChange={e => updateQuestion(q.id, { label: e.target.value })} className="flex-1" />
                  <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v as CustomQuestionType })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Short text</SelectItem>
                      <SelectItem value="textarea">Long text</SelectItem>
                      <SelectItem value="select">Single choice</SelectItem>
                      <SelectItem value="multi_select">Multiple choice</SelectItem>
                      <SelectItem value="boolean">Yes / No</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="w-8 h-8 text-slate-400 hover:text-red-500 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(q.type === "select" || q.type === "multi_select") && (
                  <Input
                    placeholder="Options, comma-separated"
                    value={(q.options || []).join(", ")}
                    onChange={e => updateQuestion(q.id, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  />
                )}
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} />
                  Required
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
