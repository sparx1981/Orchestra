import { describe, it, expect } from "vitest";
import { compareRuns } from "../runCompare";
import type { RunExportInput } from "../runExports";

const baseRun: RunExportInput = {
  prompt: "Should we hold Q3?",
  outcome: "Hold Q3, gated on July.",
  reasons: ["Milestone gates spend", "Vendor risk quantified"],
  decisionTree: [
    { id: "n1", parentId: null, label: "Launch timing", probability: 100, isSelected: true },
    { id: "n2", parentId: "n1", label: "Hold", probability: 62, isSelected: true }
  ],
  considerations: [{ text: "Assumes vendor holds date", category: "assumption", flaggedForReview: true }],
  dissent: [{ agentName: "Priya", position: "too risky", wouldChangeIf: "contract signed" }],
  rounds: 3
};

describe("compareRuns", () => {
  it("detects an identical outcome and fully overlapping reasons", () => {
    const result = compareRuns(baseRun, { ...baseRun });
    expect(result.outcomesMatch).toBe(true);
    expect(result.reasonsInBoth).toHaveLength(2);
    expect(result.reasonsOnlyInA).toHaveLength(0);
    expect(result.reasonsOnlyInB).toHaveLength(0);
  });

  it("detects a changed outcome and partially divergent reasons", () => {
    const changed: RunExportInput = {
      ...baseRun,
      outcome: "Slip to Q4 instead.",
      reasons: ["Milestone gates spend", "Partner confirmed delay is safe"]
    };
    const result = compareRuns(baseRun, changed);
    expect(result.outcomesMatch).toBe(false);
    expect(result.reasonsInBoth).toEqual(["Milestone gates spend"]);
    expect(result.reasonsOnlyInA).toEqual(["Vendor risk quantified"]);
    expect(result.reasonsOnlyInB).toEqual(["Partner confirmed delay is safe"]);
  });

  it("lists root axes for each run without attempting to match them across runs", () => {
    const other: RunExportInput = {
      ...baseRun,
      decisionTree: [
        { id: "x1", parentId: null, label: "Scope reduction", probability: 100, isSelected: true }
      ]
    };
    const result = compareRuns(baseRun, other);
    expect(result.rootAxesA).toEqual(["Launch timing"]);
    expect(result.rootAxesB).toEqual(["Scope reduction"]);
  });

  it("counts dissent independently for each run", () => {
    const noDissent: RunExportInput = { ...baseRun, dissent: [] };
    const result = compareRuns(baseRun, noDissent);
    expect(result.dissentCountA).toBe(1);
    expect(result.dissentCountB).toBe(0);
  });

  it("surfaces grounding-status asymmetry between a grounded and an ungrounded run", () => {
    const grounded: RunExportInput = { ...baseRun, groundedSourceCount: 3, hadVerifiedCalculations: true };
    const ungrounded: RunExportInput = { ...baseRun, groundedSourceCount: 0, hadVerifiedCalculations: false };
    const result = compareRuns(grounded, ungrounded);
    expect(result.groundedSourceCountA).toBe(3);
    expect(result.groundedSourceCountB).toBe(0);
    expect(result.hadVerifiedCalculationsA).toBe(true);
    expect(result.hadVerifiedCalculationsB).toBe(false);
  });

  it("defaults grounding status to zero/false when absent (legacy runs)", () => {
    const result = compareRuns(baseRun, baseRun);
    expect(result.groundedSourceCountA).toBe(0);
    expect(result.hadVerifiedCalculationsA).toBe(false);
  });

  it("diffs consideration texts as an exact-match set", () => {
    const other: RunExportInput = {
      ...baseRun,
      considerations: [{ text: "A totally different consideration", category: "risk", flaggedForReview: false }]
    };
    const result = compareRuns(baseRun, other);
    expect(result.considerationTextsOnlyInA).toEqual(["Assumes vendor holds date"]);
    expect(result.considerationTextsOnlyInB).toEqual(["A totally different consideration"]);
  });
});
