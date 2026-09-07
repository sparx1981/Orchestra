import { describe, it, expect } from "vitest";
import { buildMarkdownDecisionRecord, buildRunJson, RUN_EXPORT_SCHEMA_VERSION, buildHumanReadableAudit, auditSectionsToPlainText } from "../runExports";

const run = {
  prompt: "Should we hold the Q3 launch window?",
  outcome: "Hold Q3, gated on the July integration milestone.",
  reasons: ["Milestone gates spend", "Vendor risk quantified"],
  decisionTree: [
    { id: "n1", parentId: null, label: "Launch timing", probability: 100, isSelected: true },
    { id: "n2", parentId: "n1", label: "Hold Q3 with gate", probability: 62, isSelected: true, reason: "Objective abort signal" },
    { id: "n3", parentId: "n1", label: "Ship regardless", probability: 15, mandateNote: "Panel would give ~15%" }
  ],
  facilitatorAgentName: "Marcus",
  dissent: [{ agentName: "Priya", position: "Q3 is premature.", wouldChangeIf: "API contract stabilises" }],
  considerations: [
    { text: "Assumes vendor holds July date", category: "assumption", flaggedForReview: true, managerResponse: { stance: "alternative", chosenAlternative: "Slip to Q4 instead" } }
  ],
  rounds: 3
};

describe("buildMarkdownDecisionRecord", () => {
  const md = buildMarkdownDecisionRecord(run);
  it("carries the ADR anatomy: status, context, decision, options, dissent", () => {
    expect(md).toContain("# Decision Record:");
    expect(md).toContain("**Status:** accepted (with recorded dissent)");
    expect(md).toContain("## Decision");
    expect(md).toContain("## Options considered");
    expect(md).toContain("## Dissenting opinions");
  });
  it("bolds selected paths and marks mandated nodes", () => {
    expect(md).toContain("**Hold Q3 with gate (62%)**");
    expect(md).toContain("_[mandated]_");
  });
  it("escapes pipes in the considerations table", () => {
    const withPipe = { ...run, considerations: [{ text: "a | b", category: "risk", flaggedForReview: false }] };
    expect(buildMarkdownDecisionRecord(withPipe)).toContain("a \\| b");
  });
});

describe("buildRunJson", () => {
  const parsed = JSON.parse(buildRunJson(run));
  it("is versioned and structurally complete", () => {
    expect(parsed.schemaVersion).toBe(RUN_EXPORT_SCHEMA_VERSION);
    expect(parsed.outcome).toContain("Hold Q3");
    expect(parsed.decisionTree).toHaveLength(3);
    expect(parsed.dissent).toHaveLength(1);
  });
  it("exports the tree as a flat adjacency list with nullable fields normalised", () => {
    const n3 = parsed.decisionTree.find((n: any) => n.id === "n3");
    expect(n3.parentId).toBe("n1");
    expect(n3.selected).toBe(false);
    expect(n3.reason).toBeNull();
    expect(n3.mandateNote).toContain("15%");
  });
});

describe("buildHumanReadableAudit", () => {
  it("always includes the core sections: what was decided, why, and what was checked", () => {
    const sections = buildHumanReadableAudit(run);
    const headings = sections.map(s => s.heading);
    expect(headings).toContain("What was being decided");
    expect(headings).toContain("What was decided");
    expect(headings).toContain("Why this was decided");
    expect(headings).toContain("What was checked");
  });

  it("states plainly when no source material was checked", () => {
    const ungrounded = { ...run, groundedSourceCount: 0 };
    const sections = buildHumanReadableAudit(ungrounded);
    const checked = sections.find(s => s.heading === "What was checked");
    expect(checked?.paragraphs[0]).toMatch(/not checked against any external material/i);
  });

  it("states plainly when sources and verified calculations backed the discussion", () => {
    const grounded = { ...run, groundedSourceCount: 2, hadVerifiedCalculations: true };
    const sections = buildHumanReadableAudit(grounded);
    const checked = sections.find(s => s.heading === "What was checked");
    expect(checked?.paragraphs[0]).toMatch(/2 uploaded source/);
    expect(checked?.paragraphs[0]).toMatch(/confirmed with an exact calculation/);
  });

  it("includes recorded disagreement in plain language, not ADR jargon", () => {
    const sections = buildHumanReadableAudit(run);
    const dissentSection = sections.find(s => s.heading === "Disagreement recorded during the discussion");
    expect(dissentSection?.paragraphs[0]).toContain("Priya disagreed");
    expect(dissentSection?.paragraphs[0]).toContain("API contract stabilises");
  });

  it("omits the disagreement section entirely when there was none", () => {
    const noDissent = { ...run, dissent: [] };
    const sections = buildHumanReadableAudit(noDissent);
    expect(sections.find(s => s.heading === "Disagreement recorded during the discussion")).toBeUndefined();
  });

  it("includes revisit history in plain language when present", () => {
    const withRevisit = {
      ...run,
      revisitEvents: [{ timestamp: "2026-07-01T10:00:00.000Z", trigger: "go_deeper", note: "n", newRunId: "run_abc" }]
    };
    const sections = buildHumanReadableAudit(withRevisit);
    const revisitSection = sections.find(s => s.heading === "Later revisions to this decision");
    expect(revisitSection?.paragraphs[0]).toMatch(/go deeper/);
    expect(revisitSection?.paragraphs[0]).toContain("run_abc");
  });

  it("includes considerations with the manager's response when overridden", () => {
    const sections = buildHumanReadableAudit(run);
    const considerationsSection = sections.find(s => s.heading === "Assumptions, risks, and constraints considered");
    expect(considerationsSection?.paragraphs[0]).toContain("Assumes vendor holds July date");
  });
});

describe("auditSectionsToPlainText", () => {
  it("renders a readable plain-text document with a title and section headers", () => {
    const sections = buildHumanReadableAudit(run);
    const text = auditSectionsToPlainText(sections, "Decision Audit");
    expect(text).toContain("Decision Audit");
    expect(text).toContain("WHAT WAS DECIDED");
    expect(text).toContain(run.outcome);
  });
});
