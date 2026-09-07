import { describe, it, expect } from "vitest";
import { getTreeChildren, getTreeDepth, getDepthBelow, getAncestorLabels, isNodeOrDescendant, computeLostCuratedContent, flattenSubtree, looksLikeAlternativesSiblingMove, getRootAncestor, type DecisionNode } from "../treeUtils";

function node(id: string, parentId: string | null, overrides: Partial<DecisionNode> = {}): DecisionNode {
  return { id, parentId, label: id, probability: 100, ...overrides };
}

describe("getTreeChildren", () => {
  it("returns root-level nodes when parentId is null", () => {
    const nodes = [node("a", null), node("b", null), node("c", "a")];
    expect(getTreeChildren(nodes, null).map(n => n.id)).toEqual(["a", "b"]);
  });

  it("returns direct children of a given node", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "a"), node("d", "b")];
    expect(getTreeChildren(nodes, "a").map(n => n.id)).toEqual(["b", "c"]);
  });

  it("returns an empty array for a leaf node", () => {
    const nodes = [node("a", null), node("b", "a")];
    expect(getTreeChildren(nodes, "b")).toEqual([]);
  });

  it("supports multiple independent root nodes (the decomposition-step case)", () => {
    // Two genuinely independent decision axes should both be root-level (parentId: null),
    // not forced under a single shared root.
    const nodes = [node("platform-root", null), node("pricing-root", null), node("platform-a", "platform-root")];
    const roots = getTreeChildren(nodes, null);
    expect(roots.map(n => n.id).sort()).toEqual(["platform-root", "pricing-root"]);
  });
});

describe("getTreeDepth", () => {
  it("returns 0 for an empty tree", () => {
    expect(getTreeDepth([])).toBe(0);
  });

  it("returns 1 when there's only a root with no children (root counts as level 1)", () => {
    expect(getTreeDepth([node("a", null)])).toBe(1);
  });

  it("returns 2 for a root with one level of children", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "a")];
    expect(getTreeDepth(nodes)).toBe(2);
  });

  it("returns the depth of the deepest branch, not the shallowest", () => {
    const nodes = [
      node("a", null),
      node("b", "a"),   // level 2
      node("c", "b"),   // level 3
      node("d", "c"),   // level 4
      node("e", "a")    // level 2, shallow sibling
    ];
    expect(getTreeDepth(nodes)).toBe(4);
  });

  it("computes depth starting from an arbitrary subtree root", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "b")];
    expect(getTreeDepth(nodes, "a")).toBe(2);
    expect(getTreeDepth(nodes, "b")).toBe(1);
  });

  it("takes the max across multiple independent roots (the decomposition-step case)", () => {
    const nodes = [
      node("root1", null),
      node("root1-child", "root1"), // root1's subtree is 2 levels deep
      node("root2", null)            // root2 alone is 1 level deep
    ];
    // The deeper of the two independent trees determines the overall reported depth.
    expect(getTreeDepth(nodes)).toBe(2);
  });
});

describe("getDepthBelow", () => {
  it("returns 0 for a leaf node", () => {
    const nodes = [node("a", null), node("b", "a")];
    expect(getDepthBelow(nodes, "b")).toBe(0);
  });

  it("returns the number of levels beneath a given node", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "b"), node("d", "c")];
    expect(getDepthBelow(nodes, "a")).toBe(3);
    expect(getDepthBelow(nodes, "b")).toBe(2);
    expect(getDepthBelow(nodes, "c")).toBe(1);
    expect(getDepthBelow(nodes, "d")).toBe(0);
  });

  it("returns 0 for a node with no matching children in the array", () => {
    const nodes = [node("a", null)];
    expect(getDepthBelow(nodes, "nonexistent")).toBe(0);
  });
});

describe("getAncestorLabels", () => {
  it("returns an empty array for a root node", () => {
    const nodes = [node("a", null, { label: "Root" })];
    expect(getAncestorLabels(nodes, "a")).toEqual([]);
  });

  it("returns the root-first chain of ancestor labels, excluding the node itself", () => {
    const nodes = [
      node("a", null, { label: "Root" }),
      node("b", "a", { label: "Middle" }),
      node("c", "b", { label: "Leaf" })
    ];
    expect(getAncestorLabels(nodes, "c")).toEqual(["Root", "Middle"]);
  });

  it("returns an empty array for a nonexistent node id", () => {
    const nodes = [node("a", null)];
    expect(getAncestorLabels(nodes, "nonexistent")).toEqual([]);
  });

  it("does not loop forever on a malformed cyclic parentId chain", () => {
    const nodes = [node("a", "b", { label: "A" }), node("b", "a", { label: "B" })];
    expect(() => getAncestorLabels(nodes, "a")).not.toThrow();
    expect(getAncestorLabels(nodes, "a").length).toBeLessThanOrEqual(2);
  });
});

describe("isNodeOrDescendant", () => {
  const nodes = [
    node("root", null),
    node("child", "root"),
    node("grandchild", "child"),
    node("sibling", "root")
  ];

  it("returns true for the node itself", () => {
    expect(isNodeOrDescendant(nodes, "child", "child")).toBe(true);
  });

  it("returns true for a direct child", () => {
    expect(isNodeOrDescendant(nodes, "root", "child")).toBe(true);
  });

  it("returns true for a grandchild (multi-level descendant)", () => {
    expect(isNodeOrDescendant(nodes, "root", "grandchild")).toBe(true);
  });

  it("returns false for a sibling that isn't a descendant", () => {
    expect(isNodeOrDescendant(nodes, "child", "sibling")).toBe(false);
  });

  it("returns false for an ancestor (moving a node UNDER its own parent is not a cycle)", () => {
    expect(isNodeOrDescendant(nodes, "grandchild", "root")).toBe(false);
  });

  it("does not loop forever on a malformed cyclic parentId chain", () => {
    const cyclic = [node("a", "b"), node("b", "a")];
    expect(() => isNodeOrDescendant(cyclic, "a", "b")).not.toThrow();
  });
});

describe("computeLostCuratedContent", () => {
  it("returns no warnings when nothing curated existed", () => {
    const oldTree = [node("a", null), node("b", "a")];
    const newTree = [node("a", null), node("b", "a")];
    expect(computeLostCuratedContent(oldTree, newTree)).toEqual([]);
  });

  it("returns no warnings when curated content survives unchanged", () => {
    const oldTree = [node("a", null, { mandateNote: "Panel would've said 40%." })];
    const newTree = [node("a", null, { mandateNote: "Panel would've said 40%." })];
    expect(computeLostCuratedContent(oldTree, newTree)).toEqual([]);
  });

  it("flags a curated node that no longer exists at all", () => {
    const oldTree = [node("a", null, { label: "Lagos day trip", scopingSummary: "A nice trip." })];
    const newTree: DecisionNode[] = [];
    const warnings = computeLostCuratedContent(oldTree, newTree);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Lagos day trip");
    expect(warnings[0]).toContain("no longer appears");
  });

  it("flags a node that survives but lost its mandate note", () => {
    const oldTree = [node("a", null, { label: "Forced branch", mandateNote: "40% unforced." })];
    const newTree = [node("a", null, { label: "Forced branch" })];
    const warnings = computeLostCuratedContent(oldTree, newTree);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("mandate note");
  });

  it("flags a node that lost multiple kinds of curated content at once", () => {
    const oldTree = [node("a", null, {
      label: "Costa Dorada",
      scopingSummary: "Summary here.",
      contradictionWarning: "May be wrong."
    })];
    const newTree = [node("a", null, { label: "Costa Dorada" })];
    const warnings = computeLostCuratedContent(oldTree, newTree);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("scoping summary");
    expect(warnings[0]).toContain("contradiction flag");
  });

  it("does not flag unrelated nodes with no curated content, even if they also changed", () => {
    const oldTree = [node("a", null, { label: "Plain node" })];
    const newTree = [node("a", null, { label: "Renamed node" })];
    expect(computeLostCuratedContent(oldTree, newTree)).toEqual([]);
  });
});

describe("flattenSubtree", () => {
  const nodes = [
    node("root", null),
    node("child1", "root"),
    node("child2", "root"),
    node("grandchild", "child1")
  ];

  it("includes the root itself at depth 0", () => {
    const result = flattenSubtree(nodes, "root");
    expect(result[0]).toEqual({ node: nodes[0], depth: 0 });
  });

  it("lists every descendant with correct depth", () => {
    const result = flattenSubtree(nodes, "root");
    expect(result.map(r => r.node.id)).toEqual(["root", "child1", "grandchild", "child2"]);
    expect(result.find(r => r.node.id === "child1")!.depth).toBe(1);
    expect(result.find(r => r.node.id === "grandchild")!.depth).toBe(2);
    expect(result.find(r => r.node.id === "child2")!.depth).toBe(1);
  });

  it("returns an empty array for a nonexistent root id", () => {
    expect(flattenSubtree(nodes, "nonexistent")).toEqual([]);
  });

  it("returns just the node itself for a leaf with no children", () => {
    expect(flattenSubtree(nodes, "grandchild")).toEqual([{ node: nodes[3], depth: 0 }]);
  });
});

describe("looksLikeAlternativesSiblingMove", () => {
  it("warns when siblings clearly sum to ~100 (three mutually exclusive transport options)", () => {
    const nodes = [
      node("root", null, { probability: 100 }),
      node("ferry", "root", { probability: 70 }),
      node("flight", "root", { probability: 20 }),
      node("sailing", "root", { probability: 10 })
    ];
    expect(looksLikeAlternativesSiblingMove(nodes, "sailing", "ferry")).toBe(true);
  });

  it("does not warn when the sibling group is inflated by unrelated findings (accommodation + resort findings mixed on one row)", () => {
    const nodes = [
      node("root", null, { probability: 100 }),
      node("self-catering", "root", { probability: 85 }),
      node("all-inclusive", "root", { probability: 15 }),
      node("cambrils", "root", { probability: 70 }),
      node("la-pineda", "root", { probability: 60 }),
      node("altafulla", "root", { probability: 55 })
    ];
    // Six-way sum is 285 — nowhere near 100, so this isn't one clean alternatives set.
    expect(looksLikeAlternativesSiblingMove(nodes, "self-catering", "cambrils")).toBe(false);
  });

  it("never warns when the nodes aren't current siblings, including the cross-tab case", () => {
    const nodes = [
      node("rootA", null, { probability: 100 }),
      node("a1", "rootA", { probability: 50 }),
      node("a2", "rootA", { probability: 50 }),
      node("rootB", null, { probability: 100 }),
      node("b1", "rootB", { probability: 100 })
    ];
    expect(looksLikeAlternativesSiblingMove(nodes, "a1", "b1")).toBe(false);
    expect(looksLikeAlternativesSiblingMove(nodes, "a1", "rootB")).toBe(false);
  });

  it("does not warn for a single child with no real sibling to compete with", () => {
    const nodes = [node("root", null, { probability: 100 }), node("only-child", "root", { probability: 100 })];
    expect(looksLikeAlternativesSiblingMove(nodes, "only-child", "root")).toBe(false);
  });

  it("returns false for a nonexistent node id rather than throwing", () => {
    const nodes = [node("root", null), node("a", "root")];
    expect(looksLikeAlternativesSiblingMove(nodes, "nonexistent", "a")).toBe(false);
  });
});

describe("getRootAncestor", () => {
  it("returns the node itself when it is already a root", () => {
    const nodes = [node("root", null)];
    expect(getRootAncestor(nodes, "root")?.id).toBe("root");
  });

  it("walks up multiple levels to find the top-level axis", () => {
    const nodes = [node("root", null), node("a", "root"), node("b", "a"), node("c", "b")];
    expect(getRootAncestor(nodes, "c")?.id).toBe("root");
  });

  it("distinguishes two independent axes (the cross-tab-move detection case)", () => {
    const nodes = [
      node("rootA", null), node("a1", "rootA"),
      node("rootB", null), node("b1", "rootB")
    ];
    expect(getRootAncestor(nodes, "a1")?.id).toBe("rootA");
    expect(getRootAncestor(nodes, "b1")?.id).toBe("rootB");
    expect(getRootAncestor(nodes, "a1")?.id).not.toBe(getRootAncestor(nodes, "b1")?.id);
  });

  it("returns undefined for a nonexistent node id rather than throwing", () => {
    const nodes = [node("root", null)];
    expect(getRootAncestor(nodes, "nonexistent")).toBeUndefined();
  });

  it("returns undefined rather than looping forever on a cyclic parentId chain", () => {
    const nodes = [node("a", "b"), node("b", "a")]; // malformed: no true root
    expect(getRootAncestor(nodes, "a")).toBeUndefined();
  });
});
