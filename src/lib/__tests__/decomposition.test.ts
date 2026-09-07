import { describe, it, expect } from "vitest";
import { buildDecompositionInstruction, normalizeDecompositionResponse, buildAxesBlock, type DecisionAxis } from "../decomposition";

describe("buildDecompositionInstruction", () => {
  it("includes the roster and the JSON shape contract", () => {
    const instr = buildDecompositionInstruction("- Ada: systems thinker", "fast", "");
    expect(instr).toContain("- Ada: systems thinker");
    expect(instr).toContain('"taskType": "decision" | "deliverable"');
  });

  it("requires sub-factor breakdown unconditionally at non-fast depths, with the right mode name", () => {
    expect(buildDecompositionInstruction("r", "fast", "")).not.toContain("sub-factors");
    const deep = buildDecompositionInstruction("r", "deep", "");
    expect(deep).toContain("Deep Discussion");
    expect(deep).toContain("REGARDLESS of whether the task looks compound");
    expect(deep).toContain("even for a task that reads as simple");
    const extended = buildDecompositionInstruction("r", "extended", "");
    expect(extended).toContain("Multiple Rounds");
    expect(extended).toContain("second-order consequence");
  });

  it("does not gate the sub-factor requirement on the task warranting it (previous hedge removed)", () => {
    const deep = buildDecompositionInstruction("r", "deep", "");
    expect(deep).not.toContain("Only split further where the task itself actually warrants it");
  });

  it("appends the domain-expert suffix verbatim at the end", () => {
    expect(buildDecompositionInstruction("r", "fast", "\nEXTRA")).toMatch(/EXTRA$/);
  });
});

describe("normalizeDecompositionResponse", () => {
  it("passes a well-formed response through (success path preserved)", () => {
    const { taskType, axes } = normalizeDecompositionResponse({
      taskType: "deliverable",
      axes: [{ id: "a1", label: "Scope", description: "d", independent: false, priority: 2, suggestedAgentName: "Ada" }]
    });
    expect(taskType).toBe("deliverable");
    expect(axes).toEqual([{ id: "a1", label: "Scope", description: "d", independent: false, priority: 2, suggestedAgentName: "Ada" }]);
  });

  it("defaults unknown or missing taskType to decision", () => {
    expect(normalizeDecompositionResponse({ taskType: "banana" }).taskType).toBe("decision");
    expect(normalizeDecompositionResponse(null).taskType).toBe("decision");
  });

  it("drops label-less axes and fills positional defaults, matching the engine's inline logic", () => {
    const { axes } = normalizeDecompositionResponse({
      axes: [{ description: "no label — dropped" }, { label: "Only label" }]
    });
    expect(axes).toHaveLength(1);
    // Indices are post-filter (the engine filters before mapping), so this is ax1/priority 1.
    expect(axes[0]).toEqual({ id: "ax1", label: "Only label", description: "", independent: true, priority: 1, suggestedAgentName: undefined });
  });

  it("sorts axes by priority ascending", () => {
    const { axes } = normalizeDecompositionResponse({
      axes: [{ label: "B", priority: 3 }, { label: "A", priority: 1 }]
    });
    expect(axes.map(a => a.label)).toEqual(["A", "B"]);
  });

  it("treats a non-array axes field as no axes", () => {
    expect(normalizeDecompositionResponse({ axes: "oops" }).axes).toEqual([]);
  });
});

describe("buildAxesBlock", () => {
  const axes: DecisionAxis[] = [
    { id: "a1", label: "Pricing", description: "How to price it", independent: true, priority: 1, suggestedAgentName: "Ada" },
    { id: "a2", label: "Rollout", description: "Launch order", independent: false, priority: 2 }
  ];

  it("returns an empty string when there are no axes", () => {
    expect(buildAxesBlock([], "decision")).toBe("");
  });

  it("uses the task-type-appropriate heading", () => {
    expect(buildAxesBlock(axes, "decision")).toContain("DECISION AXES IDENTIFIED");
    expect(buildAxesBlock(axes, "deliverable")).toContain("CANDIDATE SECTIONS IDENTIFIED");
  });

  it("renders one numbered line per axis with dependence, priority, and suggestion", () => {
    const block = buildAxesBlock(axes, "decision");
    expect(block).toContain("1. [INDEPENDENT, priority 1] Pricing — How to price it (suggested: Ada)");
    expect(block).toContain("2. [DEPENDENT, priority 2] Rollout — Launch order");
  });
});
