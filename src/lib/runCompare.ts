// Cross-run comparison (Phase 3 roadmap item #2). QA personas hit this gap from two
// different workflows — diffing a re-run against its original, and comparing several
// independently completed decisions (multi-site, multi-vendor) side by side. Both need
// the same underlying primitive: a structured comparison between two completed runs.
//
// Deliberately scoped: this does NOT attempt a general tree-diffing algorithm (matching
// nodes across two independently-generated trees with no shared IDs is a much harder,
// higher-risk problem — a naive label-similarity matcher would confidently produce wrong
// pairings, which is worse than not comparing trees at all). Root-axis labels are listed
// for each run side by side instead of being force-matched; the reasons/considerations
// comparison uses exact-text set membership, which is honest about its own limits (a
// reworded but equivalent reason will show as "different" on both sides) rather than
// pretending to a semantic diff it can't actually perform.

import type { RunExportInput } from "./runExports";

export interface RunComparisonResult {
  outcomesMatch: boolean;
  reasonsOnlyInA: string[];
  reasonsOnlyInB: string[];
  reasonsInBoth: string[];
  considerationTextsOnlyInA: string[];
  considerationTextsOnlyInB: string[];
  rootAxesA: string[];
  rootAxesB: string[];
  dissentCountA: number;
  dissentCountB: number;
  // Grounding status per run (Phase 4 roadmap #1) — comparing a grounded run against an
  // ungrounded one without surfacing that asymmetry would let the asymmetry go unnoticed
  // exactly where it matters most: a side-by-side judgement call.
  groundedSourceCountA: number;
  groundedSourceCountB: number;
  hadVerifiedCalculationsA: boolean;
  hadVerifiedCalculationsB: boolean;
}

export function compareRuns(a: RunExportInput, b: RunExportInput): RunComparisonResult {
  const reasonsA = new Set(a.reasons.map(r => r.trim()));
  const reasonsB = new Set(b.reasons.map(r => r.trim()));

  const considerationsA = new Set((a.considerations || []).map(c => c.text.trim()));
  const considerationsB = new Set((b.considerations || []).map(c => c.text.trim()));

  return {
    outcomesMatch: a.outcome.trim() === b.outcome.trim(),
    reasonsOnlyInA: [...reasonsA].filter(r => !reasonsB.has(r)),
    reasonsOnlyInB: [...reasonsB].filter(r => !reasonsA.has(r)),
    reasonsInBoth: [...reasonsA].filter(r => reasonsB.has(r)),
    considerationTextsOnlyInA: [...considerationsA].filter(c => !considerationsB.has(c)),
    considerationTextsOnlyInB: [...considerationsB].filter(c => !considerationsA.has(c)),
    rootAxesA: a.decisionTree.filter(n => n.parentId === null).map(n => n.label),
    rootAxesB: b.decisionTree.filter(n => n.parentId === null).map(n => n.label),
    dissentCountA: (a.dissent || []).length,
    dissentCountB: (b.dissent || []).length,
    groundedSourceCountA: a.groundedSourceCount || 0,
    groundedSourceCountB: b.groundedSourceCount || 0,
    hadVerifiedCalculationsA: a.hadVerifiedCalculations === true,
    hadVerifiedCalculationsB: b.hadVerifiedCalculations === true
  };
}
