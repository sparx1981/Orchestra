// Pure decision-tree utilities, extracted from App.tsx so they can be unit tested directly
// and reused without pulling in the rest of the component. No React or app-state dependency.

export interface DecisionNode {
  id: string;
  parentId: string | null;
  label: string;
  probability: number;
  isSelected?: boolean;
  reason?: string;
  // Present only on branches the manager forced: the panel's honest residual assessment
  // (its unforced probability and chief risk), so a mandated 100% never falsifies the record.
  mandateNote?: string;
  // Set only on deliverable-run tree nodes, when an axis confidently links to one drafted
  // section — see src/lib/deliverableTree.ts. Always undefined for decision-run nodes.
  linkedSectionHeading?: string;
  // Set when a "Go Deeper" session on this node (or a descendant scoping session) surfaces
  // reason to doubt the branch's original probability — a visible warning rather than a
  // silent number change, matching how a manager-forced probability is also always shown
  // as a deliberate, visible act rather than quietly overwritten.
  contradictionWarning?: string;
  // Set only on nodes grafted by an Expand-scope session — the full Q&A transcript that
  // produced them, including every multiple-choice option the manager was offered but
  // didn't pick. Without this, choosing one chip during scoping silently discarded every
  // alternative the team had put on the table.
  scopingQA?: { question: string; askedBy: string; answer: string; options?: string[]; isOpener?: boolean }[];
  // Set on nodes grafted by an Expand-scope session classified as "content" (a research/
  // informational request, answered from the model's own general knowledge — not the
  // knowledge base, not fact-checked). Deliberately narrower than the old isContentFinding
  // field it replaces: this ONLY drives a source disclosure and a percentage-meaning
  // tooltip. It must never again gate Force/selection/probability-display behavior — that
  // coupling was exactly what made the old "finding" badge contradict Force being able to
  // act on these nodes like any other, which is why it was removed in the first place.
  isGeneralKnowledgeContent?: boolean;
  // The positive counterpart: set when a "content"-classified Go Deeper finding was
  // actually grounded in an uploaded Knowledge Base document rather than general knowledge.
  // Mutually exclusive with isGeneralKnowledgeContent in practice (a content node is either
  // grounded or it isn't), kept as a separate field rather than inverting the meaning of the
  // existing one so neither flag's name becomes misleading on its own.
  isFromKnowledgeBase?: boolean;
  // A short prose summary tying together a set of "content"-classified Expand-scope nodes
  // grafted in the same session — set on the first node of the batch only, shown above the
  // findings rather than duplicated on every one. The nodes themselves render as ordinary
  // tree nodes (normal probability, fully forceable) — a distinct "finding" badge was tried
  // and removed because it implied non-competing facts while Force could still act on them
  // as if they were competing branches, which was more confusing than no badge at all.
  scopingSummary?: string;
  // Set on a marker node left behind at a branch's original position after a cross-tab
  // Move ("→ Moved to '<label>' in <rootLabel>"). Non-interactive and not a real decision:
  // no Force/Promote/Revise, no probability weight, never isSelected, no children — it
  // exists purely so the original spot shows this was a continuation of the same branch,
  // not a silent disappearance. See moveNodeUnderParent in App.tsx for how it's created,
  // and treeUtils.getRootAncestor for how a cross-tab move is detected in the first place.
  movedTo?: { nodeId: string; rootId: string; label: string; rootLabel: string };
}

/** Direct children of a node (or the root-level nodes, when parentId is null). */
// Caches a parentId -> children[] index per distinct `nodes` array reference, so repeated
// getTreeChildren calls against the same tree during one render pass (once per node, in the
// recursive tree renderers) do an O(1) lookup instead of an O(n) filter each time. WeakMap
// means the cache entry is dropped automatically once that array reference is no longer
// referenced elsewhere — no manual invalidation needed, and a genuinely new tree (new array
// reference, e.g. after any edit) naturally gets a fresh index rather than a stale one.
const childIndexCache = new WeakMap<DecisionNode[], Map<string | null, DecisionNode[]>>();

function getChildIndex(nodes: DecisionNode[]): Map<string | null, DecisionNode[]> {
  let index = childIndexCache.get(nodes);
  if (index) return index;
  index = new Map();
  for (const n of nodes) {
    const bucket = index.get(n.parentId);
    if (bucket) bucket.push(n);
    else index.set(n.parentId, [n]);
  }
  childIndexCache.set(nodes, index);
  return index;
}

export function getTreeChildren(nodes: DecisionNode[], parentId: string | null): DecisionNode[] {
  return getChildIndex(nodes).get(parentId) ?? [];
}

/** Number of levels in a tree (or subtree), where a single root with no children is depth 1. */
export function getTreeDepth(nodes: DecisionNode[], parentId: string | null = null): number {
  const children = getTreeChildren(nodes, parentId);
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map(c => getTreeDepth(nodes, c.id)));
}

/** How many descendant levels exist beneath a given node (0 if it's a leaf). */
export function getDepthBelow(nodes: DecisionNode[], nodeId: string): number {
  const children = getTreeChildren(nodes, nodeId);
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map(c => getDepthBelow(nodes, c.id)));
}

/**
 * The top-level axis (parentId: null) a given node belongs to — i.e. which "tab" it renders
 * under in Flow view. Used to detect a cross-tab move: two nodes are in different tabs iff
 * their root ancestors differ. Returns undefined if nodeId isn't found or the tree has a
 * dangling parentId (defensive only — shouldn't happen in a well-formed tree).
 */
export function getRootAncestor(nodes: DecisionNode[], nodeId: string): DecisionNode | undefined {
  const byId = new Map(nodes.map(n => [n.id, n]));
  let current = byId.get(nodeId);
  const seen = new Set<string>(); // guards against a cyclic parentId chain corrupting the tree
  while (current && current.parentId !== null) {
    if (seen.has(current.id)) return undefined;
    seen.add(current.id);
    current = byId.get(current.parentId);
  }
  return current;
}

/** Root-first chain of ancestor labels above a node — excludes the node itself. Used by Go
 *  Deeper to give the question/synthesis instructions the full decision path a branch sits
 *  under, not just its own isolated label. Guards against a malformed/cyclic parentId chain
 *  with a visited-set rather than looping forever. */
export function getAncestorLabels(nodes: DecisionNode[], nodeId: string): string[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const chain: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(nodeId);
  while (current && current.parentId !== null && !visited.has(current.parentId)) {
    visited.add(current.parentId);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent.label);
    current = parent;
  }
  return chain;
}

// Layer 2 of the re-discussion data-loss fix: Layer 1 instructs the facilitator to preserve
// curated content (scoping conversations, mandate notes, contradiction flags) on any branch
// a revision didn't directly address — but an instruction is not a guarantee with an LLM
// regenerating a full tree. This is the safety net: a plain structural diff, run after every
// revision, that flags anything curated which vanished or lost its detail, regardless of
// whether the facilitator meant to drop it or just didn't perfectly follow the rule. Pure
// and deterministic on purpose — this must never itself be a source of hallucinated claims
// about what changed.
export function computeLostCuratedContent(oldTree: DecisionNode[], newTree: DecisionNode[]): string[] {
  const newById = new Map(newTree.map(n => [n.id, n]));
  const warnings: string[] = [];
  for (const oldNode of oldTree) {
    const hadScopingQA = !!(oldNode.scopingQA && oldNode.scopingQA.length > 0);
    const hadSummary = !!oldNode.scopingSummary;
    const hadMandate = !!oldNode.mandateNote;
    const hadContradiction = !!oldNode.contradictionWarning;
    if (!hadScopingQA && !hadSummary && !hadMandate && !hadContradiction) continue;

    const newNode = newById.get(oldNode.id);
    if (!newNode) {
      warnings.push(`"${oldNode.label}" (with prior scoping or mandate detail) no longer appears in the tree.`);
      continue;
    }

    const lost: string[] = [];
    if (hadScopingQA && !(newNode.scopingQA && newNode.scopingQA.length > 0)) lost.push("its scoping conversation");
    if (hadSummary && !newNode.scopingSummary) lost.push("its scoping summary");
    if (hadMandate && !newNode.mandateNote) lost.push("its mandate note");
    if (hadContradiction && !newNode.contradictionWarning) lost.push("its contradiction flag");
    if (lost.length > 0) {
      warnings.push(`"${oldNode.label}" lost ${lost.join(" and ")}.`);
    }
  }
  return warnings;
}

// Used by "Move Decision" to warn (not block) when a drag looks like it's nesting one
// competing alternative under another, rather than genuinely restructuring the tree. The
// signal is deliberately simple and needs no new metadata: if the dragged node and the
// drop target are CURRENT siblings, and every sibling's probability under that shared
// parent sums close to 100, they almost certainly represent one mutually-exclusive choice
// (e.g. Ferry 70 + Flight 20 + Sailing 10) — nesting one under another would silently turn
// "an alternative to" into "dependent on", which is rarely what's intended. When siblings
// DON'T sum close to 100 (the common case once Expand Scope findings get mixed onto the
// same row as an unrelated real decision), there's no such implication and no warning is
// warranted. A move to a target that isn't a current sibling at all — including every
// cross-tab move, since tabs are separate trees — never triggers this by construction.
export function looksLikeAlternativesSiblingMove(nodes: DecisionNode[], draggedId: string, targetId: string): boolean {
  const dragged = nodes.find(n => n.id === draggedId);
  const target = nodes.find(n => n.id === targetId);
  if (!dragged || !target) return false;
  if (dragged.parentId !== target.parentId) return false; // not current siblings — always fine, including every cross-tab move
  const siblings = getTreeChildren(nodes, dragged.parentId);
  if (siblings.length < 2) return false;
  const sum = siblings.reduce((total, n) => total + (typeof n.probability === "number" ? n.probability : 0), 0);
  return sum >= 90 && sum <= 110;
}

// Used by the cross-tab "Move Decision" picker to list every node in a target tab's subtree,
// indented by depth, so the manager can pick the exact destination rather than only ever
// dropping onto the tab's root.
export function flattenSubtree(nodes: DecisionNode[], rootId: string): { node: DecisionNode; depth: number }[] {
  const root = nodes.find(n => n.id === rootId);
  if (!root) return [];
  const result: { node: DecisionNode; depth: number }[] = [{ node: root, depth: 0 }];
  const walk = (parentId: string, depth: number) => {
    for (const child of getTreeChildren(nodes, parentId)) {
      result.push({ node: child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(rootId, 1);
  return result;
}

// Used by "Move Decision" to reject invalid drop targets before ever calling the
// facilitator: a node can't become a child of itself or of any of its own descendants —
// that would disconnect it from the tree entirely (a cycle with no path back to the root).
// Walks UP from candidateId rather than down from rootId, since that's a single linear
// chain instead of a subtree traversal.
export function isNodeOrDescendant(nodes: DecisionNode[], rootId: string, candidateId: string): boolean {
  if (rootId === candidateId) return true;
  const byId = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  let current = byId.get(candidateId);
  while (current && current.parentId !== null && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.parentId === rootId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}
