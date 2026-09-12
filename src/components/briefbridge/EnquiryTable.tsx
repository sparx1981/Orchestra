// src/components/briefbridge/EnquiryTable.tsx
//
// High-density datagrid for browsing enquiries. Built from plain divs rather than a
// <table> primitive (Orchestra's components/ui has no table.tsx yet) so it can stay
// consistent with the rest of the app's Tailwind-only styling.

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import type { Enquiry, EnquiryStatus } from "@/src/types/briefBridge";
import { BUDGET_TIER_LABELS, ENQUIRY_STATUS_LABELS, TARGET_LAUNCH_LABELS, enquiryClientFullName } from "@/src/types/briefBridge";

const STATUS_BADGE_VARIANT: Record<EnquiryStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  triaged: "secondary",
  converted: "outline",
  archived: "destructive",
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{ENQUIRY_STATUS_LABELS[status]}</Badge>;
}

interface EnquiryTableProps {
  enquiries: Enquiry[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDetail: (enquiry: Enquiry) => void;
  onStatusChange: (id: string, status: EnquiryStatus) => void;
}

export function EnquiryTable({
  enquiries,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onStatusChange,
}: EnquiryTableProps) {
  const allSelected = enquiries.length > 0 && enquiries.every(e => selectedIds.has(e.id));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="grid grid-cols-[32px_1.4fr_1fr_0.9fr_0.9fr_1fr_0.7fr_32px] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
        <span>Client / Project</span>
        <span>Company</span>
        <span>Budget</span>
        <span>Launch</span>
        <span>Status</span>
        <span>Received</span>
        <span />
      </div>

      {enquiries.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-slate-400">No enquiries match the current filters.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {enquiries.map(enquiry => (
            <div
              key={enquiry.id}
              className="grid grid-cols-[32px_1.4fr_1fr_0.9fr_0.9fr_1fr_0.7fr_32px] gap-3 px-4 py-3 items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
            >
              <Checkbox checked={selectedIds.has(enquiry.id)} onCheckedChange={() => onToggleSelect(enquiry.id)} aria-label={`Select ${enquiryClientFullName(enquiry)}`} />
              <button onClick={() => onOpenDetail(enquiry)} className="text-left min-w-0 group">
                <div className="font-medium text-slate-800 dark:text-slate-100 truncate group-hover:underline">{enquiry.projectTitle || "Untitled project"}</div>
                <div className="text-xs text-slate-400 truncate">{enquiryClientFullName(enquiry)} · {enquiry.clientEmail}</div>
              </button>
              <span className="truncate text-slate-500 dark:text-slate-400">{enquiry.clientCompany || "—"}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{BUDGET_TIER_LABELS[enquiry.budgetTier]}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{TARGET_LAUNCH_LABELS[enquiry.targetLaunch]}</span>
              <Select value={enquiry.status} onValueChange={v => onStatusChange(enquiry.id, v as EnquiryStatus)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENQUIRY_STATUS_LABELS) as EnquiryStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-400">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => onOpenDetail(enquiry)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  aria-label="Open detail"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
