// Pure merge logic for the Gatekeeper: given a run and a set of proposed changes, returns the
// fields that should change on the run after applying only the *approved* ones. No React,
// no Firestore — this is the one piece of genuinely non-trivial state-merging logic in the
// app's newest features, and it had zero test coverage before this module existed.

export interface DecisionNodeLike {
  id: string;
  parentId: string | null;
  label: string;
  probability: number;
  isSelected?: boolean;
  reason?: string;
}

export interface DeliverableSectionLike {
  id: string;
  heading: string;
  authorAgentId: string;
  authorAgentName: string;
  content: string;
}

export interface ProposedChangeLike {
  id: string;
  kind: "outcome" | "reasons" | "node" | "restructure" | "section";
  nodeId?: string;
  newProbability?: number;
  newReason?: string;
  newOutcome?: string;
  newReasons?: string[];
  newDecisionTree?: DecisionNodeLike[];
  sectionId?: string;
  newSectionHeading?: string;
  newSectionContent?: string;
  approved: boolean;
}

export interface RunLike {
  outcome: string;
  reasons: string[];
  decisionTree: DecisionNodeLike[];
  deliverable?: { title: string; subtitle?: string; sections: DeliverableSectionLike[] };
}

export interface MergeResult {
  outcome: string;
  reasons: string[];
  decisionTree: DecisionNodeLike[];
  deliverable?: { title: string; subtitle?: string; sections: DeliverableSectionLike[] };
  approvedCount: number;
}

/**
 * Applies only the approved changes from `changes` on top of `run`, returning the fields that
 * should be merged back onto the live run. Unapproved changes are silently skipped — a caller
 * committing zero approved changes gets back the run unchanged (a valid, deliberate outcome,
 * not an error).
 *
 * `fallbackAuthor` is used when a "section" change proposes a brand-new section id that
 * doesn't exist on the run yet and the change didn't include enough information to resolve a
 * real author (should not normally happen, since the caller resolves authors before building
 * the change, but this keeps the merge itself total rather than throwing).
 */
export function applyChangesToRun(
  run: RunLike,
  changes: ProposedChangeLike[],
  fallbackAuthor: { id: string; name: string }
): MergeResult {
  const approved = changes.filter(c => c.approved);

  let decisionTree = run.decisionTree;
  let deliverableSections = run.deliverable ? run.deliverable.sections : [];
  let outcome = run.outcome;
  let reasons = run.reasons;
  let decisionTreeChanged = false;
  let deliverableChanged = false;

  for (const change of approved) {
    if (change.kind === "outcome" && change.newOutcome) {
      outcome = change.newOutcome;
      if (change.newReasons) reasons = change.newReasons;
    } else if (change.kind === "node" && change.nodeId) {
      if (!decisionTreeChanged) { decisionTree = [...decisionTree]; decisionTreeChanged = true; }
      decisionTree = decisionTree.map(n =>
        n.id === change.nodeId ? { ...n, probability: change.newProbability ?? n.probability, reason: change.newReason ?? n.reason } : n
      );
    } else if (change.kind === "restructure" && change.newDecisionTree) {
      decisionTree = change.newDecisionTree;
      decisionTreeChanged = true;
    } else if (change.kind === "section" && change.sectionId) {
      if (!deliverableChanged) { deliverableSections = [...deliverableSections]; deliverableChanged = true; }
      const idx = deliverableSections.findIndex(s => s.id === change.sectionId);
      if (idx >= 0) {
        deliverableSections[idx] = {
          ...deliverableSections[idx],
          heading: change.newSectionHeading || deliverableSections[idx].heading,
          content: change.newSectionContent || deliverableSections[idx].content
        };
      } else {
        deliverableSections.push({
          id: change.sectionId,
          heading: change.newSectionHeading || "New section",
          authorAgentId: fallbackAuthor.id,
          authorAgentName: fallbackAuthor.name,
          content: change.newSectionContent || ""
        });
      }
    }
  }

  return {
    outcome,
    reasons,
    decisionTree,
    deliverable: run.deliverable ? { ...run.deliverable, sections: deliverableSections } : undefined,
    approvedCount: approved.length
  };
}
