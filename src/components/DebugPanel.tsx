import { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, Trash2, Copy, Check } from "lucide-react";

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: string;
}

// Floating debug button + bottom sheet showing a running log of actions and errors from the
// session. Fully self-contained: the parent only needs to hold `debugLogs` (written to via
// its own logDebug helper) and pass it in along with a setter to support Clear.
export function DebugPanel({
  debugLogs,
  setDebugLogs,
}: {
  debugLogs: DebugLogEntry[];
  setDebugLogs: (updater: DebugLogEntry[] | ((prev: DebugLogEntry[]) => DebugLogEntry[])) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const errorCount = debugLogs.filter(l => l.level === "error").length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <button
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          title="Debug information"
        >
          <Bug className="w-5 h-5" />
          {errorCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
              {errorCount > 9 ? "9+" : errorCount}
            </span>
          )}
        </button>
      } />
      <SheetContent side="bottom" className="h-[33vh] max-h-[33vh] flex flex-col overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="flex items-center gap-2 text-base">
                <Bug className="w-4 h-4 text-blue-500" /> Debug Information
              </SheetTitle>
              <SheetDescription className="text-xs">
                A record of actions and errors from this session. Copy and share this with support to help diagnose issues.
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugLogs([])}
                disabled={debugLogs.length === 0}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </Button>
              <Button
                size="sm"
                disabled={debugLogs.length === 0}
                onClick={() => {
                  const text = debugLogs
                    .map(l => `[${new Date(l.timestamp).toLocaleString()}] ${l.level.toUpperCase()}: ${l.message}${l.details ? `\n    ${l.details.replace(/\n/g, "\n    ")}` : ""}`)
                    .join("\n\n");
                  navigator.clipboard.writeText(text || "No debug information recorded yet.");
                  setCopyStatus("copied");
                  setTimeout(() => setCopyStatus("idle"), 2000);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {copyStatus === "copied" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copyStatus === "copied" ? "Copied!" : "Copy All"}
              </Button>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
          {debugLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Bug className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-xs">Nothing recorded yet. Debug information will appear here as you use the app.</p>
            </div>
          ) : (
            [...debugLogs].reverse().map(log => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  log.level === "error"
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/10"
                    : log.level === "warn"
                    ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-mono uppercase ${
                      log.level === "error"
                        ? "border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                        : log.level === "warn"
                        ? "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                        : "text-slate-500"
                    }`}
                  >
                    {log.level}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">{log.message}</p>
                {log.details && (
                  <pre className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words font-mono bg-white/50 dark:bg-black/20 rounded p-2 mt-1">{log.details}</pre>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
