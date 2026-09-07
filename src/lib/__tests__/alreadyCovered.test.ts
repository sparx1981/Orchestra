import { describe, it, expect } from "vitest";
import { buildAlreadyCoveredBlock } from "../alreadyCovered";

describe("buildAlreadyCoveredBlock", () => {
  it("returns an empty string when there's nothing to report", () => {
    expect(buildAlreadyCoveredBlock([], [])).toBe("");
    expect(buildAlreadyCoveredBlock(undefined, undefined)).toBe("");
  });

  it("includes pre-discussion clarifying Q&A", () => {
    const log = [{ group: "clarification" as const, label: "What's the budget?", text: "$50k" }];
    const block = buildAlreadyCoveredBlock(log, []);
    expect(block).toContain("Q: What's the budget?");
    expect(block).toContain("A: $50k");
  });

  it("excludes the plain original-request entry — that's the task itself, not a Q&A pair", () => {
    const log = [{ group: "original" as const, label: "Original request", text: "Do the thing" }];
    expect(buildAlreadyCoveredBlock(log, [])).toBe("");
  });

  it("includes an answered needs_input reply and an answered considerations dispute", () => {
    const log = [
      { group: "addition" as const, sourceType: "needs_input", label: "Which vendor?", text: "Vendor A" },
      { group: "addition" as const, sourceType: "considerations", label: "Reconsidered: \"assumed timeline\"", text: "manager's response: sooner" }
    ];
    const block = buildAlreadyCoveredBlock(log, []);
    expect(block).toContain("Which vendor?");
    expect(block).toContain("Reconsidered");
  });

  it("excludes an unrelated addition sourceType (e.g. a routine comment) — not a manager-answered exchange", () => {
    const log = [{ group: "addition" as const, sourceType: "comment", label: "Comment on X", text: "seems off" }];
    expect(buildAlreadyCoveredBlock(log, [])).toBe("");
  });

  it("includes mid-discussion manager answers from the transcript, identified by agentId", () => {
    const transcript = [
      { agentId: "agent_1", message: "Some panelist statement" },
      { agentId: "manager", message: 'Re: "Which region first?" — EU first' }
    ];
    const block = buildAlreadyCoveredBlock([], transcript);
    expect(block).toContain("EU first");
    expect(block).not.toContain("Some panelist statement");
  });

  it("combines both sources and includes the explicit don't-repeat instruction header", () => {
    const log = [{ group: "clarification" as const, label: "Q1", text: "A1" }];
    const transcript = [{ agentId: "manager", message: "Re: Q2 — A2" }];
    const block = buildAlreadyCoveredBlock(log, transcript);
    expect(block).toMatch(/do not ask about any of this again/i);
    expect(block).toContain("A1");
    expect(block).toContain("A2");
  });
});
