// src/components/briefbridge/EnquiryHub.tsx
//
// Primary "Enquiries" tab: KPI summary, search/status filters, the datagrid, and the
// entry points into the config dialog, export modal, and detail drawer. Rendered
// from App.tsx when activeTab === "enquiries" (see NAV_ITEMS).

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Inbox, Search, Settings2, Trash2 } from "lucide-react";
import { EnquiryTable } from "@/src/components/briefbridge/EnquiryTable";
import { EnquiryDetailDrawer } from "@/src/components/briefbridge/EnquiryDetailDrawer";
import { IntakeFormBuilderDialog } from "@/src/components/briefbridge/IntakeFormBuilderDialog";
import { EnquiryExportModal } from "@/src/components/briefbridge/EnquiryExportModal";
import { deleteEnquiry, saveIntakeConfig, subscribeEnquiries, subscribeIntakeConfig, updateEnquiryStatus } from "@/src/lib/briefBridgeService";
import { defaultIntakeFormConfig } from "@/src/types/briefBridge";
import type { Enquiry, EnquiryStatus, IntakeFormConfig } from "@/src/types/briefBridge";
import { ENQUIRY_STATUS_LABELS } from "@/src/types/briefBridge";

function generateToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

interface EnquiryHubProps {
  userId: string;
  onPipeToPrompt: (prompt: string) => void;
}

export function EnquiryHub({ userId, onPipeToPrompt }: EnquiryHubProps) {
  const [config, setConfig] = useState<IntakeFormConfig | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openEnquiry, setOpenEnquiry] = useState<Enquiry | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => subscribeIntakeConfig(userId, setConfig), [userId]);
  useEffect(() => subscribeEnquiries(userId, setEnquiries), [userId]);

  // First-run: no config doc yet means this developer has never opened Enquiries
  // before. Created (but not published) lazily, the first time it's actually
  // needed, so a dev who never sets up an intake form never gets a stray write.
  async function ensureConfig(): Promise<IntakeFormConfig> {
    if (config) return config;
    const fresh = defaultIntakeFormConfig(userId, generateToken());
    await saveIntakeConfig(fresh);
    setConfig(fresh);
    return fresh;
  }

  const filtered = useMemo(() => {
    return enquiries.filter(e => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${e.clientName} ${e.clientEmail} ${e.clientCompany || ""} ${e.projectTitle}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [enquiries, statusFilter, search]);

  const kpis = useMemo(() => {
    const counts: Record<EnquiryStatus | "total", number> = { total: enquiries.length, new: 0, triaged: 0, converted: 0, archived: 0 };
    for (const e of enquiries) counts[e.status]++;
    return counts;
  }, [enquiries]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id))));
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} enquir${selectedIds.size === 1 ? "y" : "ies"}? This can't be undone.`)) return;
    await Promise.all(Array.from(selectedIds).map((id: string) => deleteEnquiry(userId, id)));
    setSelectedIds(new Set());
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            Enquiries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Client briefs from your public intake form. Review one and pipe it straight into the Product tab.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => ensureConfig().then(() => setConfigOpen(true))}>
          <Settings2 className="w-3.5 h-3.5" /> Form settings
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          ["total", "Total"],
          ["new", ENQUIRY_STATUS_LABELS.new],
          ["triaged", ENQUIRY_STATUS_LABELS.triaged],
          ["converted", ENQUIRY_STATUS_LABELS.converted],
          ["archived", ENQUIRY_STATUS_LABELS.archived],
        ] as const).map(([key, label]) => (
          <Card key={key} className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-3">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{kpis[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {enquiries.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-3">
          <Inbox className="w-10 h-10 mx-auto stroke-[1.5]" />
          <p className="text-sm max-w-sm mx-auto">
            No enquiries yet. Publish your intake form to start collecting client briefs — Form settings will give you a shareable link.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => ensureConfig().then(() => setConfigOpen(true))}>
            <Settings2 className="w-3.5 h-3.5" /> Set up intake form
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search client, company, or project..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as EnquiryStatus | "all")}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(ENQUIRY_STATUS_LABELS) as EnquiryStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleBulkDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExportOpen(true)}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>

          <EnquiryTable
            enquiries={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onOpenDetail={setOpenEnquiry}
            onStatusChange={(id, status) => updateEnquiryStatus(userId, id, status)}
          />
        </>
      )}

      <EnquiryDetailDrawer
        enquiry={openEnquiry}
        config={config}
        userId={userId}
        onClose={() => setOpenEnquiry(null)}
        onPipeToPrompt={prompt => {
          onPipeToPrompt(prompt);
          setOpenEnquiry(null);
        }}
      />

      {config && <IntakeFormBuilderDialog open={configOpen} onOpenChange={setConfigOpen} config={config} />}

      <EnquiryExportModal open={exportOpen} onOpenChange={setExportOpen} enquiries={filtered} />
    </div>
  );
}
