import type { ReactNode } from "react";

// Small count/metadata pill used across the tree header, presets list, and chat drawers.
// Extracted from App.tsx so the decision-tree module and the main component share one copy.
export function CountTag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center font-mono text-[10.5px] leading-none text-muted-foreground bg-surface-2 border border-border rounded-md px-1.5 py-1 whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
