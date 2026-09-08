// src/components/briefbridge/EnquiryExportModal.tsx
//
// One-click CSV/JSON export of the currently filtered (or selected) enquiries.

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { enquiriesToCsv, enquiriesToJson } from "@/src/lib/briefBridgeService";
import type { Enquiry } from "@/src/types/briefBridge";

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface EnquiryExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiries: Enquiry[];
}

export function EnquiryExportModal({ open, onOpenChange, enquiries }: EnquiryExportModalProps) {
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export enquiries</DialogTitle>
          <DialogDescription>{enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"} will be exported, matching your current filters.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex-col gap-1"
            onClick={() => download(`enquiries-${stamp}.csv`, enquiriesToCsv(enquiries), "text/csv")}
          >
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-1"
            onClick={() => download(`enquiries-${stamp}.json`, enquiriesToJson(enquiries), "application/json")}
          >
            <Download className="w-4 h-4" /> JSON
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
