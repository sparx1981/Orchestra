// The decomposition phase's pure core — instruction construction and response
// normalisation — extracted from the discussion engine in App.tsx so it can be unit tested
// directly, exactly the way the rest of src/lib/ already is. The engine still owns the
// sequencing (when to call, what to do on failure); this module owns what the phase says
// and how its reply is turned into a usable structure.

/** One distinct choice (decision task) or section (deliverable task) the task contains. */
export interface DecisionAxis {
  id: string;
  label: string;
  description: string;
  independent: boolean;
  priority: number;
  suggestedAgentName?: string;
}

// Whether a task is fundamentally a DECISION (should we do X or Y — produces an outcome and
// a probability-weighted tree) or a DELIVERABLE (produce a piece of work — a document, plan,
// analysis — where forcing a decision tree adds no value). Classified automatically by the
// decomposition step; the user can override it with one click if it's wrong.
export type TaskType = "decision" | "deliverable";

/** Builds the decomposition step's system instruction. Verbatim from the engine. */
export function buildDecompositionInstruction(
  rosterText: string,
  discussionDepth: "fast" | "deep" | "extended",
  domainExpertInstructionSuffix: string,
  isLowStakes: boolean = false
): string {
  const lowStakesPrefix = isLowStakes
    ? `This task reads as short, simple, and low-stakes (no attached Knowledge Base, no obvious multi-part structure) — default STRONGLY toward a single axis below. Only identify more than one if the task is UNMISTAKABLY compound (it explicitly asks two or more distinct questions, or names several named alternatives to weigh against each other). A short prompt phrased as one plain question or one clear yes/no call should almost always come back as exactly 1 axis, not be stretched into structure it doesn't need.\n\n`
    : "";
  return `${lowStakesPrefix}You are analysing a task before a multi-agent team starts work on it.\n\nSTEP 1 — Classify the task as exactly one of:\n- "decision": the task asks the team to decide between options, weigh a judgement call, or recommend a course of action (e.g. "should we...", "which approach...", "is it worth...").\n- "deliverable": the task asks the team to produce a piece of work — a document, plan, analysis, draft, summary, or similar output — where there's no real decision to be made, just work to be done well (e.g. "write...", "draft...", "analyse...", "create...", "summarise...").\nIf genuinely unsure, prefer "decision" only when the task explicitly poses a choice; default to "deliverable" otherwise.\n\nSTEP 2 — Identify the distinct axes the task requires. For a "decision" task, an axis is one distinct choice or judgement call (a simple task may have just one). For a "deliverable" task, an axis is one distinct SECTION or component the finished work should contain.\n\nCOMPOUND TASKS — read the task carefully for signs it is asking for MORE than one thing at once: multiple explicit questions in the same prompt, several named alternative approaches offered for comparison (e.g. "one option is X, another could be Y"), a named competitor or precedent to weigh against a different model, or an explicit meta-question layered on top of the main one (e.g. "and is it wrong to do X at all?"). Each of these is very likely its OWN axis, not a detail folded into a single axis — under-decomposing a genuinely compound question is the most common way this step goes wrong, and it produces a shallow, unhelpful tree even when the rest of the discussion is thorough. When in doubt, decompose further rather than collapsing distinct questions into one axis.${discussionDepth !== "fast" ? ` The manager explicitly asked for ${discussionDepth === "extended" ? "Multiple Rounds" : "Deep Discussion"}, which should produce a visibly more detailed structure than a quick pass — not just more confidence in the same shape. This applies REGARDLESS of whether the task looks compound on its own: for EVERY axis you identify, also name the 2-4 concrete sub-factors, sub-questions, or downstream considerations that actually drive it (e.g. "vendor selection" stays its own axis, but you also name sub-factors like "shortlist criteria", "contract terms", and "transition timeline" as their own dependent axes nested under it — not folded into one description field). Do this even for a task that reads as simple; the manager chose this depth specifically to get more structure back.${discussionDepth === "extended" ? " At this depth, go one level further for the highest-priority axis specifically: also identify a plausible second-order consequence or follow-on decision — something that would only need deciding once the first choice is made." : ""}` : ""}\n\nMark each axis "independent: true" if it doesn't logically depend on any other axis, or "independent: false" if it only makes sense after/nested under another. Assign each a "priority" (1 = most important, higher = less critical).\n\nTHE TEAM:\n${rosterText}\n\nFor each axis, also suggest which single team member above is best suited to it (for "deliverable" tasks this is who should draft that section; for "decision" tasks this is whose expertise is most central to that axis) — put their exact name in "suggestedAgentName".\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "taskType": "decision" | "deliverable",\n  "axes": [\n    { "id": "ax1", "label": "short name (a few words)", "description": "one sentence on what this axis covers", "independent": true, "priority": 1, "suggestedAgentName": "exact name from the team list" }\n  ]\n}${domainExpertInstructionSuffix}`;
}

/**
 * Normalises the decomposition reply into a usable { taskType, axes } — validated and
 * defaulted at the parse boundary. Verbatim semantics from the engine's inline logic:
 * unknown taskType defaults to "decision", axes without a label are dropped, missing
 * per-axis fields get positional/neutral defaults, and axes come back priority-sorted.
 */
export function normalizeDecompositionResponse(parsed: any): { taskType: TaskType; axes: DecisionAxis[] } {
  const taskType: TaskType = parsed?.taskType === "deliverable" ? "deliverable" : "decision";
  const axes: DecisionAxis[] = (Array.isArray(parsed?.axes) ? parsed.axes : [])
    .filter((a: any) => a?.label)
    .map((a: any, i: number) => ({
      id: a.id || `ax${i + 1}`,
      label: a.label,
      description: a.description || "",
      independent: a.independent !== false,
      priority: typeof a.priority === "number" ? a.priority : i + 1,
      suggestedAgentName: typeof a.suggestedAgentName === "string" ? a.suggestedAgentName : undefined
    }))
    .sort((a: DecisionAxis, b: DecisionAxis) => a.priority - b.priority);
  return { taskType, axes };
}

/** Builds the shared "axes identified for this task" prompt block. Verbatim from the engine. */
export function buildAxesBlock(axes: DecisionAxis[], taskType: TaskType): string {
  return axes.length > 0
    ? `\n\n${taskType === "deliverable" ? "CANDIDATE SECTIONS" : "DECISION AXES"} IDENTIFIED FOR THIS TASK (in priority order — give more depth/attention to higher-priority ones; independent ones are separate ${taskType === "deliverable" ? "sections" : "decisions"} and should NOT be forced to depend on one another):\n${axes.map((a, i) => `${i + 1}. [${a.independent ? "INDEPENDENT" : "DEPENDENT"}, priority ${a.priority}] ${a.label} — ${a.description}${a.suggestedAgentName ? ` (suggested: ${a.suggestedAgentName})` : ""}`).join("\n")}`
    : "";
}
