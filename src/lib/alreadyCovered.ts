// Aggregates everything the manager has already been asked and answered in a run, from the
// two places that information actually lives but weren't being cross-referenced before:
// requirementsLog (the original request, pre-discussion clarifying Q&A, and any prior
// check-in/needs_input/considerations replies from an earlier round of the same run) and the
// transcript's manager-turn entries (a mid-discussion question the panel paused to ask,
// folded into the transcript rather than requirementsLog). Used by checkInWithManager to
// avoid proposing a check-in question that just restates something already settled.

/** Structural subset of App's RequirementEntry — only the fields this needs to read. */
export interface RequirementEntryLike {
  group: "original" | "clarification" | "addition";
  sourceType?: string;
  label: string;
  text: string;
}

/** Structural subset of App's CollaborativeTranscriptEntry — only the fields this needs. */
export interface TranscriptEntryLike {
  agentId: string;
  message: string;
}

// Which "addition" sourceTypes represent a genuine manager-answered exchange (not just a
// team proposal still awaiting a reply) — considerations only qualify once the manager has
// actually disputed/responded to one, which is the only path that ever creates this entry.
const ANSWERED_ADDITION_SOURCE_TYPES = new Set(["needs_input", "considerations"]);

export function buildAlreadyCoveredBlock(
  requirementsLog: RequirementEntryLike[] | undefined,
  transcript: TranscriptEntryLike[] | undefined
): string {
  const priorClarifications = (requirementsLog || [])
    .filter(r => r.group === "clarification" || (r.group === "addition" && r.sourceType !== undefined && ANSWERED_ADDITION_SOURCE_TYPES.has(r.sourceType)))
    .map(r => `Q: ${r.label}\nA: ${r.text}`);
  const midDiscussionAnswers = (transcript || [])
    .filter(t => t.agentId === "manager")
    .map(t => t.message);
  const entries = [...priorClarifications, ...midDiscussionAnswers];
  return entries.length > 0
    ? `\n\nALREADY ASKED AND ANSWERED THIS SESSION — do not ask about any of this again, even reworded:\n${entries.join("\n\n")}\n`
    : "";
}
