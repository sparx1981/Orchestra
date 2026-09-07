// "Go Deeper" as scope expansion (not to be confused with "Let's discuss this," which is a
// free-form chat about a node). Go Deeper walks the manager through an adaptive Q&A about a
// specific branch, then synthesizes a small mini-tree of new sub-decisions directly from
// that Q&A — no full multi-agent re-discussion. This module holds the pure, testable pieces:
// building the instructions and parsing the model's responses. The actual orchestration
// (state machine, calling agents, committing to the tree or spawning a new run) lives in
// App.tsx, since it needs live component state.

export interface GoDeeperQA {
  question: string;
  askedBy: string;
  answer: string;
  /** True for the fixed opening free-text prompt ("anything specific to consider?") asked
   *  before the adaptive Q&A begins — excluded from the 5-question adaptive cap since it
   *  isn't one of the team's own follow-ups. */
  isOpener?: boolean;
  /** Every option the question offered (multiple-choice only — omitted for free-text
   *  answers and the opener). Kept alongside the chosen answer so the road not taken isn't
   *  silently discarded the moment the manager picks one — surfaced in the tree afterward. */
  options?: string[];
}

export interface GoDeeperNodeContext {
  /** The node being drilled into. */
  label: string;
  reason?: string;
  /** Ancestor chain, root first, immediate parent last — excludes the node itself. */
  ancestorLabels: string[];
  /** Labels of the node's EXISTING direct children, so synthesis on a mid-level node
   *  proposes genuinely new sub-work instead of restating sub-decisions already in the
   *  tree. Empty/omitted for leaves and the root sentinel. */
  existingChildLabels?: string[];
}

export interface GoDeeperTeamMember {
  name: string;
  persona: string;
}

/** Builds the instruction for generating exactly ONE next question, informed by every
 *  answer so far — deliberately one-at-a-time rather than a batch, so question N+1 can
 *  react to answer N. Returns null-signaling instructions ("done": true) once the model
 *  judges there's nothing more worth asking, or once a hard cap is reached by the caller. */
export function buildGoDeeperQuestionInstruction(
  node: GoDeeperNodeContext,
  task: string,
  team: GoDeeperTeamMember[],
  qaSoFar: GoDeeperQA[],
  knowledgeContext: string
): string {
  const rosterText = team.map(a => `- ${a.name}: ${a.persona.slice(0, 150)}`).join("\n");
  const chainText = [...node.ancestorLabels, node.label].join(" → ");
  const qaText = qaSoFar.length > 0
    ? qaSoFar.map(qa => `Q (${qa.askedBy}): ${qa.question}\nA: ${qa.answer}`).join("\n\n")
    : "(none yet — this is the first question)";
  return `A manager is expanding the scope of an ongoing project onto one specific area they want the team to dig into further, the same way they'd hand a real team member a new assignment mid-project.

ORIGINAL TASK: ${task}

DECISION CHAIN (root → the area being expanded): ${chainText}
${node.reason ? `WHY THIS AREA EXISTS: ${node.reason}` : ""}

THE TEAM:
${rosterText}
${knowledgeContext ? `\n${knowledgeContext}\n\nThe Knowledge Base above should inform your questions where relevant — if it already answers something, don't ask the manager to restate it; ask about what the documents DON'T cover instead.` : ""}

QUESTIONS ASKED SO FAR AND THE MANAGER'S ANSWERS:
${qaText}

The manager's opening answer may contain more than one distinct question or concern, not just one — managers often list several things at once ("what about the budget, and also is X vendor still an option, and how does this affect the timeline") rather than raising them one at a time. Before deciding you're done, check: does every distinct question or concern raised anywhere above — in the opener or in a later answer — have enough of an answer to scope real sub-work from? If the manager raised three things and the team has only ever asked about one of them, that is NOT enough, no matter how thorough the questioning on that one topic was — decompose your remaining questions to cover the others rather than continuing to dig into the one already-covered topic.

Decide whether there is one more genuinely useful question to ask before the team has enough to scope real sub-work in this area, informed by everything answered so far — do not repeat ground already covered. Stop only once every distinct thing the manager raised has enough to work with, or once you've already asked 5 questions (in which case stop regardless, even if something remains uncovered — the synthesis step will note the gap).

Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:
{ "done": true } — if there's nothing more useful to ask
or
{ "done": false, "question": "short, specific question", "options": ["short option 1", "short option 2", "short option 3"], "askedBy": "exact name of the team member whose expertise this question reflects, from the list above" }

The asker should change across questions where a different team member's expertise is genuinely more relevant to what's being asked now — do not default to the same person every time. Options should be 2-4 short, mutually exclusive answers a manager could click; they can always type their own answer instead.`;
}

export interface GoDeeperQuestionResult {
  done: boolean;
  question?: string;
  options?: string[];
  askedBy?: string;
}

/** Parses and defensively validates the next-question response. Malformed or missing
 *  fields are treated as "done" — a session that stops one question early is a much safer
 *  failure mode than one that crashes or asks a garbled question. */
export function parseGoDeeperQuestionResponse(raw: any): GoDeeperQuestionResult {
  if (!raw || typeof raw !== "object" || raw.done === true) return { done: true };
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const options = Array.isArray(raw.options) ? raw.options.filter((o: any) => typeof o === "string" && o.trim()) : [];
  const askedBy = typeof raw.askedBy === "string" ? raw.askedBy.trim() : "";
  if (!question || options.length < 2 || !askedBy) return { done: true };
  return { done: false, question, options, askedBy };
}

export interface GoDeeperSynthesizedNode {
  id: string;
  label: string;
  reason: string;
  probability: number;
  /** In "alternatives" mode: the synthesis's recommended pick(s). In "breakdown" and
   *  "content" modes every node is true — there is nothing to choose between. */
  isSelected: boolean;
  /** If set, this node nests under ANOTHER node proposed in this same synthesis (matched by
   *  that node's own "id" in the raw response) instead of attaching directly to the branch
   *  being expanded. Lets one Go Deeper session express genuinely hierarchical, dependent
   *  structure — e.g. "what tiers should we have, and what benefits in each tier" produces
   *  tier nodes at one level and benefit nodes nested under their own tier — rather than
   *  flattening a compound request into one level of unrelated siblings. Validated in
   *  parseGoDeeperSynthesisResponse: a reference to a nonexistent id, to itself, or forming
   *  a cycle is dropped (falls back to attaching directly under the expanded branch) rather
   *  than silently corrupting the tree or crashing on commit. */
  parentRef?: string;
  /** True only for "content" mode when that specific finding actually came from the
   *  Knowledge Base rather than general knowledge — drives an accuracy label in the
   *  approval preview ("from your documents" vs "general knowledge, not verified") that
   *  reflects each node's real source instead of one blanket caveat across the whole
   *  session. Always false outside "content" mode, where the distinction doesn't apply. */
  fromKnowledgeBase?: boolean;
}

export interface GoDeeperSynthesisResult {
  /** "alternatives": the nodes compete and one should win (probabilities sum ~100,
   *  isSelected marks the recommendation). "breakdown": parallel pieces of sub-work that
   *  all proceed (probabilities are independent confidences, all isSelected). "content":
   *  the manager asked an informational/research question (not a decision, not sub-tasks)
   *  — nodes are concrete findings/recommendations, not choices; probability doesn't apply. */
  structure: "alternatives" | "breakdown" | "content";
  nodes: GoDeeperSynthesizedNode[];
  parentProbabilityChange: { newProbability: number; rationale: string } | null;
  contradictionWarning: string | null;
  /** 2-4 sentence prose answer tying the "content" nodes together — set only when
   *  structure is "content". Shown above the findings and folded into the top-level
   *  outcome/reasons as a short addendum once approved, so those don't go silently stale. */
  summary: string | null;
}

/** Builds the synthesis instruction — turns the finished Q&A directly into a small mini-tree
 *  of new sub-decisions, without a full panel re-discussion. The model must first classify
 *  what the session actually produced: competing ALTERNATIVES (one should win — sibling
 *  probabilities sum to ~100 in their own nested space, separate from the parent's weight,
 *  and a recommended pick is marked), a parallel work BREAKDOWN (all pieces proceed —
 *  probabilities are independent confidences and selection doesn't apply), or CONTENT (the
 *  manager actually asked a question — "what day trips", "which restaurants", "what's the
 *  weather" — and wants a real answer, not more structure to choose between). Existing
 *  children are listed so mid-level expansion can't just restate sub-decisions already in
 *  the tree. */
export function buildGoDeeperSynthesisInstruction(
  node: GoDeeperNodeContext,
  task: string,
  qa: GoDeeperQA[],
  knowledgeContext: string = ""
): string {
  const chainText = [...node.ancestorLabels, node.label].join(" → ");
  // The opener answer is the manager's own free-text framing of what they actually want —
  // surfaced separately and given top billing, since it's the thing to actually satisfy.
  // Everything else in qa is scoping detail the team gathered to be able to satisfy it well.
  const openerEntry = qa.find(x => x.isOpener && x.answer.trim());
  const clarifyingQa = qa.filter(x => !x.isOpener);
  const clarifyingText = clarifyingQa.map(x => `Q (${x.askedBy}): ${x.question}\nA: ${x.answer}`).join("\n\n");
  const requestBlock = openerEntry
    ? `\nTHE MANAGER'S ORIGINAL REQUEST (this is what must actually be satisfied — read it carefully for MORE THAN ONE distinct question or concern; managers often list several at once rather than raising them one at a time, e.g. "what about the budget, and is X vendor still an option, and how does this affect the timeline" is three separate things, not one):\n${openerEntry.answer}\n`
    : "";
  const existingChildren = node.existingChildLabels || [];
  const existingChildrenBlock = existingChildren.length > 0
    ? `\nSUB-DECISIONS ALREADY IN THE TREE UNDER THIS AREA:\n${existingChildren.map(l => `- ${l}`).join("\n")}\nEvery node you propose must be genuinely NEW work scoped by the manager's answers — do NOT restate, rephrase, or trivially subdivide anything in the list above.\n`
    : "";
  return `A manager just finished a scoping conversation about expanding the team's work on one specific area of an ongoing project. Turn this directly into a small set of new nodes to graft under that area in the decision tree — no further discussion needed, this conversation IS the scoping input.

ORIGINAL TASK: ${task}
DECISION CHAIN (root → the area being expanded): ${chainText}
${existingChildrenBlock}${requestBlock}
CLARIFYING Q&A GATHERED TO SCOPE THE REQUEST:
${clarifyingText || "(none — the manager answered only the opening question)"}
${knowledgeContext ? `\n${knowledgeContext}\n\nGround your proposed nodes in the Knowledge Base above wherever it's actually relevant to this area — a finding backed by an uploaded document is stronger than general knowledge, so prefer it where both would otherwise say the same thing. It's fine if none of it applies here; don't force a connection that isn't genuinely there.\n` : ""}
First classify what this actually calls for:
- "alternatives" — competing options for the same choice, and one of them should win.
- "breakdown" — parallel pieces of sub-work that ALL proceed; there is nothing to choose between them.
- "content" — the manager asked an actual QUESTION (what/which/how/when — day trips, places to eat, weather, logistics, recommendations) and wants it ANSWERED, not turned into more decision structure. This is the common case whenever the original request reads as something to look up or be told, rather than something to decide.

Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:
{
  "structure": "alternatives" | "breakdown" | "content",
  "nodes": [
    { "id": "gd1", "label": "short label", "reason": "see rules below for what this must contain", "probability": 0-100, "isSelected": true | false, "parentRef": null | "the \\"id\\" of another node in THIS SAME nodes array, if this node is dependent on/nested under it — see the nesting section below", "fromKnowledgeBase": true | false }
  ],
  "summary": null | "2-4 sentence prose answer tying the content nodes together — ONLY when structure is \"content\", otherwise null",
  "parentProbabilityChange": null | { "newProbability": 0-100, "rationale": "one sentence on why this session changes how likely the ORIGINAL branch now looks" },
  "contradictionWarning": null | "one sentence, only if the scoping conversation genuinely revealed the original branch may have been the wrong call — not for routine new sub-work"
}

NESTING WITHIN THIS GRAFT — "parentRef": most scoping conversations produce one flat set of new nodes, all attaching directly under the branch being expanded, and "parentRef" should be omitted (null) for every node in that common case. But if the manager's request was genuinely COMPOUND AND DEPENDENT — a second part that only makes sense broken down per-option of the first part, not a second unrelated question — express that as real nesting instead of flattening it into one level of siblings that all look equally related to each other. The canonical example: "what tiers should we have, and what benefits should each tier include" is NOT two unrelated asks to answer side by side — it's one structure where the benefits belong to specific tiers. Propose the tier nodes first with "parentRef": null, then propose each tier's benefit nodes with "parentRef" set to that specific tier's own "id" — so "Free shipping" nests under "Gold tier", not floating as a sibling of "Gold tier" itself. Contrast this with a request that raises two genuinely SEPARATE concerns (e.g. "what about the budget, and is the current vendor still an option") — those stay flat, unrelated siblings, each with "parentRef": null, because neither is a breakdown of the other. Nesting can go more than one level deep if the request genuinely calls for it (e.g. tiers → benefits → a caveat specific to one benefit), by chaining "parentRef" through a benefit node's own "id".

Rules: 2-6 new nodes.

If the manager's original request or the clarifying Q&A raised more than one distinct question or concern, EVERY one of them needs its own node (or nodes) addressing it specifically — do not let the most prominent one absorb all 2-6 nodes while the others go unaddressed. A node's "reason" must make clear which specific concern it answers; if you cannot fit every distinct concern into 6 nodes, prioritise breadth over depth on any single one rather than thoroughly covering only the first.

If "structure" is "content": THIS IS THE IMPORTANT CASE — actually answer the manager's original request, grounded in every clarifying answer given (season, transport, who's traveling, preferences, etc) AND in the Knowledge Base above wherever it genuinely applies — prefer a KB-backed finding over general knowledge when both would otherwise say the same thing, but don't force a document connection that isn't really there; general knowledge is a perfectly good fallback for whatever the KB doesn't cover. Mark each node's "fromKnowledgeBase" true only if that specific finding actually came from the Knowledge Base content above, not the general topic area — this drives an accuracy label the manager sees, so it must reflect that one node's real source, not the session as a whole. If the request contains multiple distinct questions, answer each one — a node (or several) per question — rather than treating it as a single request and only answering the first or most prominent part. Each node's "label" must name a SPECIFIC real thing — an actual place, dish, route, or figure — never a restatement of a clarifying answer as a category. Each "reason" must contain the actual substantive answer: real names, real approximate distances or drive times, real typical temperatures for the stated month, real specific recommendations — written as if genuinely informing the manager, not describing what was asked. isSelected is always true — there is nothing being chosen between. Each "probability" is an INDEPENDENT 0-100 confidence in how well that specific finding fits the manager's request (they do not need to sum to anything, same as "breakdown"). Do NOT create a node like "Family Car-Trip Itinerary (Ages 8-14)" or "October Seasonal Suitability Audit" — those restate the question instead of answering it, which is exactly the failure to avoid. A good node looks like: label "Lagos day trip", reason "45 min drive — dramatic cliffs and boat trips to the Ponta da Piedade sea caves, a strong half-day with kids aged 8-14." "summary" must then be 2-4 sentences in plain prose that directly answers EVERY distinct part of the manager's original request end-to-end, referencing the specific findings below it — not just the part answered by the first node or two.

If "structure" is "alternatives": sibling probabilities should sum to roughly 100 AMONG THEMSELVES ONLY — a separate probability space nested under the parent, never scaled against the parent's own existing weight — and mark exactly the option(s) you recommend with "isSelected": true (usually one), grounded in the manager's answers. If nesting is used, this sibling-sum rule applies WITHIN each "parentRef" group separately (e.g. each tier's own benefit nodes sum to ~100 among themselves, independent of every other tier's benefits and of the tier nodes' own probabilities) — never across the whole flat list regardless of nesting. "summary" must be null.

If "structure" is "breakdown": every node gets "isSelected": true, and each probability is an INDEPENDENT 0-100 confidence that the piece is genuinely needed — they do not sum to anything. "summary" must be null.

Only set "parentProbabilityChange" if the conversation genuinely gave reason to revise the parent's own likelihood — most scoping sessions add detail without casting doubt on the original decision, so leave it null unless there's a real reason. Only set "contradictionWarning" if the scoping conversation surfaced something that makes the ORIGINAL branch look like it may have been the wrong choice, not merely "there's more work here than expected."`;
}

/** Parses and defensively validates the synthesis response. Every numeric/shape guard here
 *  mirrors the defensive posture already used for the panel's own decisionTree parsing —
 *  a malformed synthesis should degrade to "no new nodes" rather than corrupt the tree.
 *  Structure defaults to "breakdown" (the safer reading: nothing silently competes with or
 *  displaces anything). In breakdown AND content modes isSelected is forced true on every
 *  node and probability is an independent 0-100 confidence (they render as ordinary tree
 *  nodes — ordinary probability badge, fully forceable — a distinct "finding" badge with no
 *  probability was tried and removed: it implied non-competing facts while Force could still
 *  act on them as if they were competing branches, which was more confusing than no badge at
 *  all). In alternatives mode, if the model marked nothing, the highest-probability node
 *  becomes the recommendation so the preview never shows a choice with no recommended pick.
 *  summary is only kept when structure is "content". */
export function parseGoDeeperSynthesisResponse(raw: any): GoDeeperSynthesisResult {
  const structure: "alternatives" | "breakdown" | "content" =
    raw?.structure === "alternatives" ? "alternatives" : raw?.structure === "content" ? "content" : "breakdown";
  const rawNodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
  const nodes: GoDeeperSynthesizedNode[] = rawNodes
    .filter((n: any) => n && typeof n.label === "string" && n.label.trim())
    .map((n: any, i: number) => ({
      id: typeof n.id === "string" && n.id.trim() ? n.id : `gd_${Date.now()}_${i}`,
      label: n.label.trim(),
      reason: typeof n.reason === "string" ? n.reason.trim() : "",
      probability: typeof n.probability === "number" && n.probability >= 0 && n.probability <= 100 ? n.probability : Math.round(100 / Math.max(rawNodes.length, 1)),
      isSelected: structure !== "alternatives" ? true : n.isSelected === true,
      parentRef: typeof n.parentRef === "string" && n.parentRef.trim() ? n.parentRef.trim() : undefined,
      fromKnowledgeBase: structure === "content" && n.fromKnowledgeBase === true
    }));

  // Validate parentRef against the batch actually produced: must name another node in THIS
  // batch (by final id, after any fallback-id assignment above), never itself, and never
  // form a cycle. Anything that fails is dropped rather than kept — a node that silently
  // lost its intended nesting still renders correctly (flat, under the expanded branch);
  // one left pointing at a dangling or cyclic reference would not.
  const idSet = new Set(nodes.map(n => n.id));
  for (const n of nodes) {
    if (!n.parentRef) continue;
    if (n.parentRef === n.id || !idSet.has(n.parentRef)) {
      n.parentRef = undefined;
      continue;
    }
    const seen = new Set<string>([n.id]);
    let cursor: string | undefined = n.parentRef;
    let cyclic = false;
    while (cursor) {
      if (seen.has(cursor)) { cyclic = true; break; }
      seen.add(cursor);
      cursor = nodes.find(x => x.id === cursor)?.parentRef;
    }
    if (cyclic) n.parentRef = undefined;
  }

  // If the model didn't mark a winner, pick one — but PER sibling group (root-level nodes,
  // and each parentRef group independently), matching the sibling-sum rule above. Picking a
  // single global winner across the whole batch would be wrong the moment nesting is used:
  // a tier's best benefit shouldn't "beat" a different tier's benefits, since they're not
  // actually competing with each other.
  if (structure === "alternatives" && nodes.length > 0) {
    const groups = new Map<string, GoDeeperSynthesizedNode[]>();
    for (const n of nodes) {
      const key = n.parentRef ?? "__root__";
      const group = groups.get(key);
      if (group) group.push(n);
      else groups.set(key, [n]);
    }
    groups.forEach(group => {
      if (!group.some(n => n.isSelected)) {
        const best = group.reduce((a, b) => (b.probability > a.probability ? b : a));
        best.isSelected = true;
      }
    });
  }

  const summary = structure === "content" && typeof raw?.summary === "string" && raw.summary.trim() ? raw.summary.trim() : null;

  const change = raw?.parentProbabilityChange;
  const parentProbabilityChange = (change && typeof change === "object" && typeof change.newProbability === "number" && change.newProbability >= 0 && change.newProbability <= 100)
    ? { newProbability: change.newProbability, rationale: typeof change.rationale === "string" ? change.rationale.trim() : "" }
    : null;

  const contradictionWarning = typeof raw?.contradictionWarning === "string" && raw.contradictionWarning.trim()
    ? raw.contradictionWarning.trim()
    : null;

  return { structure, nodes, parentProbabilityChange, contradictionWarning, summary };
}
