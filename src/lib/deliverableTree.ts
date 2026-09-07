// Deliverable runs never populated a decisionTree at all — decisionTree: [] was hardcoded
// at construction time, so the Decision Tree section had nothing to show even though the
// exact same underlying question ("why was this axis addressed, and how") applies to a
// deliverable's structure as much as to a decision's branches. This builds a tree
// deterministically from the axes already identified during decomposition — no new LLM
// call, so it's free (and directly in the spirit of "a more effective process needs fewer
// calls," not more).
//
// Deliberately flat rather than nested: axes carry an "independent" flag but no reference
// to WHICH other axis they depend on, so a nested hierarchy would still be guesswork. Each
// node OPTIONALLY links to a drafted section when the axis label confidently matches a
// section heading (see findConfidentSectionMatch) — left unlinked, not guessed, whenever
// more than one section could plausibly match.

export interface DeliverableAxisInput {
  id: string;
  label: string;
  description: string;
  priority: number;
}

export interface DeliverableSectionInput {
  heading: string;
}

export interface DeliverableTreeNode {
  id: string;
  parentId: string | null;
  label: string;
  probability: number;
  isSelected?: boolean;
  reason?: string;
  // Best-effort only: set when an axis label confidently matches a drafted section's
  // heading (case-insensitive containment either direction). Left undefined rather than
  // guessed when ambiguous — axes carry no real foreign key to a section, and a wrong
  // pairing presented as fact would mislead more than an honest "not linked."
  linkedSectionHeading?: string;
}

function findConfidentSectionMatch(axisLabel: string, sections: DeliverableSectionInput[]): string | undefined {
  const normalizedAxis = axisLabel.toLowerCase().trim();
  const matches = sections.filter(s => {
    const normalizedHeading = s.heading.toLowerCase().trim();
    return normalizedHeading.includes(normalizedAxis) || normalizedAxis.includes(normalizedHeading);
  });
  // Confident only if exactly one section matches — if the axis label is generic enough to
  // match multiple headings, that's exactly the ambiguous case that shouldn't be guessed.
  return matches.length === 1 ? matches[0].heading : undefined;
}

export function buildDeliverableDecisionTree(axes: DeliverableAxisInput[], sections: DeliverableSectionInput[] = []): DeliverableTreeNode[] {
  return [...axes]
    .sort((a, b) => a.priority - b.priority)
    .map(axis => ({
      id: axis.id,
      parentId: null,
      label: axis.label,
      // Every identified axis was addressed in the final deliverable — deliverables don't
      // have a "branch not taken" the way decisions do, so 100/isSelected across the board
      // is accurate, not a placeholder.
      probability: 100,
      isSelected: true,
      reason: axis.description,
      linkedSectionHeading: findConfidentSectionMatch(axis.label, sections)
    }));
}
