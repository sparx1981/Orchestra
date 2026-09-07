import { describe, it, expect } from "vitest";
import { buildDeliverableDecisionTree } from "../deliverableTree";

describe("buildDeliverableDecisionTree", () => {
  it("builds one root node per axis, ordered by priority", () => {
    const axes = [
      { id: "ax2", label: "Rev share model", description: "Because rates vary today", priority: 2 },
      { id: "ax1", label: "Unified vs product-centric", description: "Because fragmentation is the core question", priority: 1 }
    ];
    const tree = buildDeliverableDecisionTree(axes);
    expect(tree.map(n => n.id)).toEqual(["ax1", "ax2"]);
    expect(tree.every(n => n.parentId === null)).toBe(true);
  });

  it("marks every axis as selected at 100% — deliverables have no unaddressed branch", () => {
    const tree = buildDeliverableDecisionTree([{ id: "ax1", label: "Onboarding flow", description: "d", priority: 1 }]);
    expect(tree[0].isSelected).toBe(true);
    expect(tree[0].probability).toBe(100);
  });

  it("carries the axis description through as the node's reason", () => {
    const tree = buildDeliverableDecisionTree([{ id: "ax1", label: "Tiering", description: "Needed because benefits vary by tier", priority: 1 }]);
    expect(tree[0].reason).toBe("Needed because benefits vary by tier");
  });

  it("returns an empty tree for an empty axis list", () => {
    expect(buildDeliverableDecisionTree([])).toEqual([]);
  });

  it("links an axis to a section when exactly one heading confidently matches", () => {
    const axes = [{ id: "ax1", label: "Onboarding flow", description: "d", priority: 1 }];
    const sections = [{ heading: "Onboarding Flow for New Developers" }, { heading: "Pricing Tiers" }];
    const tree = buildDeliverableDecisionTree(axes, sections);
    expect(tree[0].linkedSectionHeading).toBe("Onboarding Flow for New Developers");
  });

  it("leaves an axis unlinked when its label matches more than one section — ambiguous, not guessed", () => {
    const axes = [{ id: "ax1", label: "Tiering", description: "d", priority: 1 }];
    const sections = [{ heading: "Tiering Strategy" }, { heading: "Tiering Benefits" }];
    const tree = buildDeliverableDecisionTree(axes, sections);
    expect(tree[0].linkedSectionHeading).toBeUndefined();
  });

  it("leaves an axis unlinked when no section is passed at all", () => {
    const tree = buildDeliverableDecisionTree([{ id: "ax1", label: "Governance", description: "d", priority: 1 }]);
    expect(tree[0].linkedSectionHeading).toBeUndefined();
  });
});
