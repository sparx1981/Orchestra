import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RefreshCw, FilePlus2, FileText, FileSpreadsheet, Presentation, Download, FileCode2, Braces, ClipboardCheck, FileDown } from "lucide-react";
import type { OfficeKind, GeneratedFile } from "@/src/lib/officeFiles";

// Dropdown offering the three file types Team Chat can produce. Always available regardless
// of whether the request was typed in natural language — that's handled separately by
// auto-detection in the calling code.
export function CreateFileMenu({
  onSelect,
  onExport,
  generatingKind,
  isExportingPdf,
  label = "Create File",
}: {
  onSelect: (kind: OfficeKind) => void;
  /** When provided, the menu also offers instant structured exports (no LLM pass):
   *  a Markdown decision record (ADR format), a versioned JSON run export, a plain-
   *  language human-readable audit, and a PDF rendering of that same audit content. */
  onExport?: (format: "md" | "json" | "audit" | "pdf") => void;
  generatingKind?: OfficeKind | null;
  isExportingPdf?: boolean;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button data-tour={onExport ? "export-formats" : undefined} size="sm" variant="outline" disabled={!!generatingKind} className="h-8 text-[11px] rounded-md gap-1.5 border-slate-200 dark:border-slate-800 px-2.5">
          {generatingKind ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FilePlus2 className="w-3 h-3" />}
          {generatingKind ? `Creating ${generatingKind}...` : label}
        </Button>
      } />
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onSelect("docx")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
          <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-500" /> Word Document</span>
          <span className="text-xs text-slate-400 pl-5">A formal, narrative document</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("xlsx")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
          <span className="flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Spreadsheet</span>
          <span className="text-xs text-slate-400 pl-5">Tables and figures with live formulas</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("pptx")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
          <span className="flex items-center gap-2"><Presentation className="w-3.5 h-3.5 text-amber-600" /> Slide Deck</span>
          <span className="text-xs text-slate-400 pl-5">For presenting to an audience</span>
        </DropdownMenuItem>
        {onExport && (
          <>
            <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" role="separator" />
            <DropdownMenuItem onClick={() => onExport("md")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="flex items-center gap-2"><FileCode2 className="w-3.5 h-3.5 text-slate-500" /> Markdown Decision Record</span>
              <span className="text-xs text-slate-400 pl-5">Plain text, instant, no AI pass — for repos/wikis</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("json")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="flex items-center gap-2"><Braces className="w-3.5 h-3.5 text-slate-500" /> JSON Export</span>
              <span className="text-xs text-slate-400 pl-5">Full structured data, instant — for integrations</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("audit")} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="flex items-center gap-2"><ClipboardCheck className="w-3.5 h-3.5 text-slate-500" /> Human-Readable Audit</span>
              <span className="text-xs text-slate-400 pl-5">Plain language, instant — for a non-technical reviewer</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("pdf")} disabled={isExportingPdf} className="text-xs flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="flex items-center gap-2">{isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-slate-500" />} PDF (Audit)</span>
              <span className="text-xs text-slate-400 pl-5">Same audit content, as a portable PDF</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const OFFICE_FILE_META: Record<OfficeKind, { icon: any; label: string; color: string }> = {
  docx: { icon: FileText, label: "Word Document", color: "text-blue-500" },
  xlsx: { icon: FileSpreadsheet, label: "Spreadsheet", color: "text-emerald-600" },
  pptx: { icon: Presentation, label: "Slide Deck", color: "text-amber-600" }
};

export function GeneratedFileCard({ file }: { file: GeneratedFile; key?: string | number }) {
  const meta = OFFICE_FILE_META[file.kind];
  const Icon = meta.icon;
  return (
    <a
      href={file.url}
      download={file.name}
      className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-800 transition-colors group"
    >
      <div className={`p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 ${meta.color} flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-200">{file.name}</p>
        <p className="text-[11px] text-slate-500">{meta.label} · Click to download</p>
      </div>
      <Download className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
    </a>
  );
}
