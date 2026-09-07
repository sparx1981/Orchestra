import { describe, it, expect } from "vitest";
import { applyChangesToRun, type RunLike, type ProposedChangeLike } from "../gatekeeperMerge";

const fallbackAuthor = { id: "agent1", name: "Alex" };

function baseDecisionRun(): RunLike {
  return {
    outcome: "Go with option A",
    reasons: ["Cheaper", "Faster"],
    decisionTree: [
      { id: "n1", parentId: null, label: "Root", probability: 100, reason: "root reason" },
      { id: "n2", parentId: "n1", label: "Option A", probability: 60, reason: "A is likely" },
      { id: "n3", parentId: "n1", label: "Option B", probability: 40, reason: "B is less likely" }
    ]
  };
}

function baseDeliverableRun(): RunLike {
  return {
    outcome: "",
    reasons: [],
    decisionTree: [],
    deliverable: {
      title: "Q3 Plan",
      sections: [
        { id: "s1", heading: "Intro", authorAgentId: "agent1", authorAgentName: "Alex", content: "Original intro" }
      ]
    }
  };
}

describe("applyChangesToRun — approval filtering", () => {
  it("applies nothing and returns the run unchanged when no changes are approved", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", newOutcome: "Go with option B", approved: false }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.outcome).toBe("Go with option A");
    expect(result.approvedCount).toBe(0);
  });

  it("only applies the subset of changes marked approved, ignoring declined ones", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "node", nodeId: "n2", newProbability: 80, newReason: "stronger evidence", approved: true },
      { id: "c2", kind: "node", nodeId: "n3", newProbability: 20, newReason: "weaker now", approved: false }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.decisionTree.find(n => n.id === "n2")?.probability).toBe(80);
    expect(result.decisionTree.find(n => n.id === "n3")?.probability).toBe(40); // untouched — declined
    expect(result.approvedCount).toBe(1);
  });

  it("committing with everything declined is a valid outcome, not an error", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", newOutcome: "Something else", approved: false },
      { id: "c2", kind: "node", nodeId: "n2", newProbability: 10, approved: false }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result).toMatchObject({ outcome: "Go with option A", approvedCount: 0 });
    expect(result.decisionTree).toEqual(run.decisionTree);
  });
});

describe("applyChangesToRun — outcome changes", () => {
  it("updates outcome and reasons together when both are provided", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", newOutcome: "Go with option B instead", newReasons: ["New evidence surfaced"], approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.outcome).toBe("Go with option B instead");
    expect(result.reasons).toEqual(["New evidence surfaced"]);
  });

  it("keeps prior reasons if the change updates outcome without new reasons", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", newOutcome: "Updated outcome text", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.outcome).toBe("Updated outcome text");
    expect(result.reasons).toEqual(["Cheaper", "Faster"]);
  });

  it("does not apply an outcome change with no newOutcome value", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.outcome).toBe("Go with option A");
  });
});

describe("applyChangesToRun — node changes", () => {
  it("updates only the targeted node's probability and reason", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "node", nodeId: "n2", newProbability: 75, newReason: "revised", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    const n2 = result.decisionTree.find(n => n.id === "n2");
    const n3 = result.decisionTree.find(n => n.id === "n3");
    expect(n2).toMatchObject({ probability: 75, reason: "revised" });
    expect(n3).toMatchObject({ probability: 40, reason: "B is less likely" }); // untouched sibling
  });

  it("silently no-ops a node change targeting an id that doesn't exist in the tree", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "node", nodeId: "does-not-exist", newProbability: 99, approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.decisionTree).toEqual(run.decisionTree);
  });

  it("applies multiple node changes independently in one commit", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "node", nodeId: "n2", newProbability: 55, approved: true },
      { id: "c2", kind: "node", nodeId: "n3", newProbability: 45, approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.decisionTree.find(n => n.id === "n2")?.probability).toBe(55);
    expect(result.decisionTree.find(n => n.id === "n3")?.probability).toBe(45);
  });
});

describe("applyChangesToRun — restructure", () => {
  it("replaces the whole tree wholesale when a restructure change is approved", () => {
    const run = baseDecisionRun();
    const newTree = [{ id: "x1", parentId: null, label: "Completely new root", probability: 100 }];
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "restructure", newDecisionTree: newTree, approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.decisionTree).toEqual(newTree);
  });

  it("does not restructure if newDecisionTree is missing", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "restructure", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.decisionTree).toEqual(run.decisionTree);
  });
});

describe("applyChangesToRun — deliverable sections", () => {
  it("updates an existing section's heading and content by id", () => {
    const run = baseDeliverableRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "section", sectionId: "s1", newSectionHeading: "Introduction", newSectionContent: "Revised intro text", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.deliverable?.sections[0]).toMatchObject({ heading: "Introduction", content: "Revised intro text", authorAgentId: "agent1" });
  });

  it("adds a brand-new section when the sectionId doesn't already exist", () => {
    const run = baseDeliverableRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "section", sectionId: "s2", newSectionHeading: "Budget", newSectionContent: "New budget section", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.deliverable?.sections).toHaveLength(2);
    expect(result.deliverable?.sections[1]).toMatchObject({
      id: "s2",
      heading: "Budget",
      content: "New budget section",
      authorAgentId: fallbackAuthor.id,
      authorAgentName: fallbackAuthor.name
    });
  });

  it("preserves the deliverable's title when only sections change", () => {
    const run = baseDeliverableRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "section", sectionId: "s1", newSectionContent: "Updated", approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.deliverable?.title).toBe("Q3 Plan");
  });

  it("returns deliverable as undefined for a run that never had one (Decision-type run)", () => {
    const run = baseDecisionRun();
    const result = applyChangesToRun(run, [], fallbackAuthor);
    expect(result.deliverable).toBeUndefined();
  });
});

describe("applyChangesToRun — mixed change kinds in one commit", () => {
  it("applies an outcome change and a node change together without interference", () => {
    const run = baseDecisionRun();
    const changes: ProposedChangeLike[] = [
      { id: "c1", kind: "outcome", newOutcome: "Revised outcome", approved: true },
      { id: "c2", kind: "node", nodeId: "n2", newProbability: 90, approved: true }
    ];
    const result = applyChangesToRun(run, changes, fallbackAuthor);
    expect(result.outcome).toBe("Revised outcome");
    expect(result.decisionTree.find(n => n.id === "n2")?.probability).toBe(90);
    expect(result.approvedCount).toBe(2);
  });
});
