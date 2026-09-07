import { describe, it, expect } from "vitest";
import {
  buildGoDeeperQuestionInstruction,
  parseGoDeeperQuestionResponse,
  buildGoDeeperSynthesisInstruction,
  parseGoDeeperSynthesisResponse
} from "../goDeeper";

const node = { label: "Catering", reason: "Needed to feed 200 guests", ancestorLabels: ["Set up the annual event", "Vendor logistics"] };
const team = [{ name: "Event Lead", persona: "Coordinates vendors and logistics" }, { name: "Budget Analyst", persona: "Tracks spend against budget" }];

describe("buildGoDeeperQuestionInstruction", () => {
  it("includes the full ancestor chain and the node itself in order", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "Set up the annual event", team, [], "");
    expect(instruction).toContain("Set up the annual event → Vendor logistics → Catering");
  });

  it("includes prior Q&A when present, informing the next question", () => {
    const qa = [{ question: "Buffet or plated?", askedBy: "Event Lead", answer: "Buffet" }];
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, qa, "");
    expect(instruction).toContain("Buffet or plated?");
    expect(instruction).toContain("Buffet");
  });

  it("mentions the Knowledge Base only when one is available", () => {
    const withKb = buildGoDeeperQuestionInstruction(node, "task", team, [], "KNOWLEDGE BASE DOCUMENTS:\n--- FILE: spec.pdf ---\ncontent\n--- END FILE ---");
    const withoutKb = buildGoDeeperQuestionInstruction(node, "task", team, [], "");
    expect(withKb.toLowerCase()).toContain("knowledge base");
    expect(withoutKb.toLowerCase()).not.toContain("knowledge base");
  });

  it("instructs varying the asker rather than defaulting to one person", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], "");
    expect(instruction).toMatch(/should change across questions/i);
  });

  it("includes an opener answer and multiple-choice options in the transcript without special-casing them", () => {
    const qa = [
      { question: "Anything specific to consider?", askedBy: "the team", answer: "Keep it vegetarian-friendly", isOpener: true },
      { question: "Buffet or plated?", askedBy: "Event Lead", answer: "Buffet", options: ["Buffet", "Plated", "Food stations"] }
    ];
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, qa, "");
    expect(instruction).toContain("Keep it vegetarian-friendly");
    expect(instruction).toContain("Buffet or plated?");
  });
});

describe("parseGoDeeperQuestionResponse", () => {
  it("parses a well-formed next-question response", () => {
    const result = parseGoDeeperQuestionResponse({ done: false, question: "Buffet or plated?", options: ["Buffet", "Plated"], askedBy: "Event Lead" });
    expect(result.done).toBe(false);
    expect(result.question).toBe("Buffet or plated?");
    expect(result.askedBy).toBe("Event Lead");
  });

  it("treats an explicit done:true as done", () => {
    expect(parseGoDeeperQuestionResponse({ done: true }).done).toBe(true);
  });

  it("treats malformed responses as done rather than throwing", () => {
    expect(parseGoDeeperQuestionResponse(null).done).toBe(true);
    expect(parseGoDeeperQuestionResponse({}).done).toBe(true);
    expect(parseGoDeeperQuestionResponse({ done: false, question: "x" }).done).toBe(true); // missing options/askedBy
    expect(parseGoDeeperQuestionResponse({ done: false, question: "x", options: ["only one"], askedBy: "A" }).done).toBe(true); // <2 options
  });
});

describe("buildGoDeeperSynthesisInstruction", () => {
  it("includes the full Q&A transcript and the decision chain", () => {
    const qa = [{ question: "Buffet or plated?", askedBy: "Event Lead", answer: "Buffet" }];
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", qa);
    expect(instruction).toContain("Buffet or plated?");
    expect(instruction).toContain("Set up the annual event → Vendor logistics → Catering");
  });

  it("explicitly instructs that sibling probabilities are a separate space from the parent's weight", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toMatch(/never scaled against the parent/i);
  });

  it("lists existing children with an anti-duplication rule so mid-level expansion proposes new work", () => {
    const midLevel = { ...node, existingChildLabels: ["Choose the caterer", "Dietary requirements survey"] };
    const instruction = buildGoDeeperSynthesisInstruction(midLevel, "task", []);
    expect(instruction).toContain("Choose the caterer");
    expect(instruction).toContain("Dietary requirements survey");
    expect(instruction).toMatch(/do NOT restate, rephrase, or trivially subdivide/i);
  });

  it("omits the existing-children block entirely for leaves", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).not.toContain("ALREADY IN THE TREE");
  });

  it("asks the model to classify the proposal as alternatives or breakdown, with per-mode rules", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toContain('"alternatives"');
    expect(instruction).toContain('"breakdown"');
    expect(instruction).toMatch(/INDEPENDENT 0-100 confidence/);
    expect(instruction).toMatch(/mark exactly the option\(s\) you recommend/i);
  });

  it("includes content as a third classification, with a real named example and an explicit anti-pattern to avoid", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toContain('"content"');
    expect(instruction).toMatch(/actually answer the manager's original request/i);
    expect(instruction).toContain("Family Car-Trip Itinerary (Ages 8-14)"); // named as the failure to avoid
  });

  it("surfaces the opener answer separately as the manager's original request to satisfy", () => {
    const qa = [{ question: "Anything specific?", askedBy: "the team", answer: "What day trips can I do?", isOpener: true }];
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", qa);
    expect(instruction).toContain("THE MANAGER'S ORIGINAL REQUEST");
    expect(instruction).toContain("What day trips can I do?");
  });

  it("instructs conservative use of parentProbabilityChange and contradictionWarning", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction.toLowerCase()).toContain("leave it null unless there's a real reason");
    expect(instruction.toLowerCase()).toContain("not merely \"there's more work here than expected.\"".toLowerCase());
  });
});

describe("parseGoDeeperSynthesisResponse", () => {
  it("parses a well-formed synthesis response", () => {
    const result = parseGoDeeperSynthesisResponse({
      nodes: [{ id: "gd1", label: "Buffet catering", reason: "Manager chose buffet", probability: 70 }],
      parentProbabilityChange: null,
      contradictionWarning: null
    });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].label).toBe("Buffet catering");
    expect(result.parentProbabilityChange).toBeNull();
    expect(result.contradictionWarning).toBeNull();
  });

  it("drops malformed nodes rather than including garbage", () => {
    const result = parseGoDeeperSynthesisResponse({ nodes: [{ label: "" }, { noLabel: true }, "not an object"] });
    expect(result.nodes).toHaveLength(0);
  });

  it("assigns a fallback even split probability when the model omits it", () => {
    const result = parseGoDeeperSynthesisResponse({ nodes: [{ label: "A" }, { label: "B" }] });
    expect(result.nodes[0].probability).toBe(50);
    expect(result.nodes[1].probability).toBe(50);
  });

  it("clamps out-of-range probabilities to the fallback rather than trusting them", () => {
    const result = parseGoDeeperSynthesisResponse({ nodes: [{ label: "A", probability: 150 }] });
    expect(result.nodes[0].probability).toBe(100);
  });

  it("parses a valid parentProbabilityChange", () => {
    const result = parseGoDeeperSynthesisResponse({
      nodes: [],
      parentProbabilityChange: { newProbability: 40, rationale: "New risk surfaced" }
    });
    expect(result.parentProbabilityChange).toEqual({ newProbability: 40, rationale: "New risk surfaced" });
  });

  it("rejects an out-of-range parentProbabilityChange", () => {
    const result = parseGoDeeperSynthesisResponse({ nodes: [], parentProbabilityChange: { newProbability: 150 } });
    expect(result.parentProbabilityChange).toBeNull();
  });

  it("parses a contradictionWarning when present", () => {
    const result = parseGoDeeperSynthesisResponse({ nodes: [], contradictionWarning: "The vendor is no longer available." });
    expect(result.contradictionWarning).toBe("The vendor is no longer available.");
  });

  it("handles a completely empty/malformed response without throwing", () => {
    const result = parseGoDeeperSynthesisResponse({});
    expect(result.nodes).toEqual([]);
    expect(result.parentProbabilityChange).toBeNull();
    expect(result.contradictionWarning).toBeNull();
  });

  it("defaults structure to breakdown when missing or unrecognised", () => {
    expect(parseGoDeeperSynthesisResponse({}).structure).toBe("breakdown");
    expect(parseGoDeeperSynthesisResponse({ structure: "nonsense", nodes: [] }).structure).toBe("breakdown");
    expect(parseGoDeeperSynthesisResponse({ structure: "alternatives", nodes: [] }).structure).toBe("alternatives");
  });

  it("forces every node selected in breakdown mode, regardless of what the model said", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [{ label: "A", probability: 90, isSelected: false }, { label: "B", probability: 60 }]
    });
    expect(result.nodes.every(n => n.isSelected)).toBe(true);
  });

  it("respects the model's recommended pick in alternatives mode", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "alternatives",
      nodes: [{ label: "A", probability: 30, isSelected: false }, { label: "B", probability: 70, isSelected: true }]
    });
    expect(result.nodes.find(n => n.label === "B")!.isSelected).toBe(true);
    expect(result.nodes.find(n => n.label === "A")!.isSelected).toBe(false);
  });

  it("falls back to marking the highest-probability alternative when the model marks none", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "alternatives",
      nodes: [{ label: "A", probability: 30 }, { label: "B", probability: 70 }]
    });
    expect(result.nodes.find(n => n.label === "B")!.isSelected).toBe(true);
    expect(result.nodes.filter(n => n.isSelected)).toHaveLength(1);
  });

  it("forces isSelected true on every content-mode node but keeps the model's real probability (an independent confidence, like breakdown)", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "content",
      nodes: [{ label: "Lagos day trip", reason: "45 min drive, sea caves", probability: 40, isSelected: false }],
      summary: "A short answer tying the findings together."
    });
    expect(result.structure).toBe("content");
    expect(result.nodes[0].probability).toBe(40);
    expect(result.nodes[0].isSelected).toBe(true);
    expect(result.summary).toBe("A short answer tying the findings together.");
  });

  it("drops the summary for non-content structures even if the model included one", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [{ label: "A" }],
      summary: "Should not survive."
    });
    expect(result.summary).toBeNull();
  });

  it("defaults summary to null when content mode omits it", () => {
    const result = parseGoDeeperSynthesisResponse({ structure: "content", nodes: [{ label: "A" }] });
    expect(result.summary).toBeNull();
  });
});

describe("multi-question coverage in the opener/answers", () => {
  it("question instruction warns that the opener or a later answer may contain more than one distinct question", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], "");
    expect(instruction).toMatch(/more than one distinct question or concern/i);
    expect(instruction).toContain("in the opener or in a later answer");
  });

  it("question instruction tells the model not to stop until every distinct thing raised is covered", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], "");
    expect(instruction).toMatch(/every distinct thing the manager raised has enough to work with/i);
  });

  it("synthesis instruction flags the opener text itself as potentially containing multiple asks", () => {
    const qa = [{ question: "Anything specific to consider?", askedBy: "the team", answer: "What about the budget, and is the current vendor still an option?", isOpener: true }];
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", qa);
    expect(instruction).toMatch(/MORE THAN ONE distinct question or concern/);
    expect(instruction).toContain("What about the budget, and is the current vendor still an option?");
  });

  it("synthesis instruction requires every distinct concern to get its own node rather than letting one absorb all of them", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toMatch(/EVERY one of them needs its own node/);
    expect(instruction).toMatch(/prioritise breadth over depth/i);
  });

  it("content-mode rules require the summary to answer every distinct part of the request, not just the first", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toMatch(/answers EVERY distinct part of the manager's original request/);
  });
});

describe("parentRef nesting (compound, dependent requests like tiers + benefits per tier)", () => {
  it("keeps a valid parentRef pointing at another node in the same batch", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [
        { id: "tier-gold", label: "Gold tier" },
        { id: "benefit-shipping", label: "Free shipping", parentRef: "tier-gold" }
      ]
    });
    expect(result.nodes.find(n => n.id === "benefit-shipping")?.parentRef).toBe("tier-gold");
  });

  it("drops a parentRef that references a nonexistent id", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [{ id: "a", label: "A", parentRef: "does-not-exist" }]
    });
    expect(result.nodes[0].parentRef).toBeUndefined();
  });

  it("drops a self-referencing parentRef", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [{ id: "a", label: "A", parentRef: "a" }]
    });
    expect(result.nodes[0].parentRef).toBeUndefined();
  });

  it("drops a parentRef that would form a cycle", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [
        { id: "a", label: "A", parentRef: "b" },
        { id: "b", label: "B", parentRef: "a" }
      ]
    });
    expect(result.nodes.find(n => n.id === "a")?.parentRef).toBeUndefined();
  });

  it("supports nesting more than one level deep (tier -> benefit -> caveat)", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [
        { id: "tier", label: "Gold tier" },
        { id: "benefit", label: "Priority support", parentRef: "tier" },
        { id: "caveat", label: "US business hours only", parentRef: "benefit" }
      ]
    });
    expect(result.nodes.find(n => n.id === "caveat")?.parentRef).toBe("benefit");
  });

  it("in alternatives mode, picks a winner PER sibling group rather than one global winner", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "alternatives",
      nodes: [
        { id: "tierA", label: "Tier A", probability: 60 },
        { id: "tierB", label: "Tier B", probability: 40 },
        { id: "a-benefit1", label: "A benefit 1", parentRef: "tierA", probability: 90 },
        { id: "a-benefit2", label: "A benefit 2", parentRef: "tierA", probability: 10 },
        { id: "b-benefit1", label: "B benefit 1", parentRef: "tierB", probability: 55 },
        { id: "b-benefit2", label: "B benefit 2", parentRef: "tierB", probability: 45 }
      ]
    });
    // Root group (tierA vs tierB): tierA wins.
    expect(result.nodes.find(n => n.id === "tierA")?.isSelected).toBe(true);
    expect(result.nodes.find(n => n.id === "tierB")?.isSelected).toBe(false);
    // tierA's own benefit group picks its own winner, independent of tierB's group.
    expect(result.nodes.find(n => n.id === "a-benefit1")?.isSelected).toBe(true);
    expect(result.nodes.find(n => n.id === "a-benefit2")?.isSelected).toBe(false);
    expect(result.nodes.find(n => n.id === "b-benefit1")?.isSelected).toBe(true);
    expect(result.nodes.find(n => n.id === "b-benefit2")?.isSelected).toBe(false);
  });

  it("synthesis instruction explains parentRef using the tiers/benefits example and contrasts it with genuinely separate concerns", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toContain("what tiers should we have, and what benefits should each tier include");
    expect(instruction).toMatch(/parentRef.*set to that specific tier's own "id"/);
    expect(instruction).toMatch(/stay flat, unrelated siblings/i);
  });

  it("alternatives sibling-sum rule is scoped per parentRef group when nesting is used", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", []);
    expect(instruction).toMatch(/applies WITHIN each "parentRef" group separately/);
  });
});

describe("Knowledge Base awareness (question generation and synthesis)", () => {
  const kbContext = "KNOWLEDGE BASE DOCUMENTS:\nThe following documents have been provided as context. Use this knowledge to satisfy the query:\n\n--- FILE: pricing.pdf ---\nOur current tiers are Free, Pro, and Enterprise.\n--- END FILE ---";

  it("question instruction embeds the actual KB content, not just a presence flag", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], kbContext);
    expect(instruction).toContain("Our current tiers are Free, Pro, and Enterprise");
  });

  it("question instruction tells the model to avoid re-asking what the documents already answer", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], kbContext);
    expect(instruction).toMatch(/don't ask the manager to restate it/i);
  });

  it("question instruction omits the Knowledge Base section entirely when there's no content", () => {
    const instruction = buildGoDeeperQuestionInstruction(node, "task", team, [], "");
    expect(instruction.toLowerCase()).not.toContain("knowledge base");
  });

  it("synthesis instruction embeds real KB content and prefers it over general knowledge when both apply", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", [], kbContext);
    expect(instruction).toContain("Our current tiers are Free, Pro, and Enterprise");
    expect(instruction).toMatch(/prefer a KB-backed finding over general knowledge/i);
  });

  it("synthesis instruction requires fromKnowledgeBase to reflect each node's real source, not the session", () => {
    const instruction = buildGoDeeperSynthesisInstruction(node, "task", [], kbContext);
    expect(instruction).toMatch(/reflect that one node's real source, not the session as a whole/i);
  });

  it("synthesis instruction is backward compatible when no knowledge context is passed", () => {
    expect(() => buildGoDeeperSynthesisInstruction(node, "task", [])).not.toThrow();
  });
});

describe("fromKnowledgeBase parsing", () => {
  it("marks a content-mode node as KB-grounded when the model says so", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "content",
      nodes: [{ id: "a", label: "Pro tier pricing", reason: "$49/mo per the pricing doc", fromKnowledgeBase: true }],
      summary: "Answered from the pricing document."
    });
    expect(result.nodes[0].fromKnowledgeBase).toBe(true);
  });

  it("defaults fromKnowledgeBase to false when omitted in content mode", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "content",
      nodes: [{ id: "a", label: "General fact" }],
      summary: "General knowledge answer."
    });
    expect(result.nodes[0].fromKnowledgeBase).toBe(false);
  });

  it("ignores fromKnowledgeBase outside content mode — the distinction doesn't apply to breakdown/alternatives", () => {
    const result = parseGoDeeperSynthesisResponse({
      structure: "breakdown",
      nodes: [{ id: "a", label: "Some sub-task", fromKnowledgeBase: true }]
    });
    expect(result.nodes[0].fromKnowledgeBase).toBe(false);
  });
});
