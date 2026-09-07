// "Expand My Prompt" (feature request: a well-structured input needs fewer clarifying
// rounds and produces a more focused discussion — the cheapest optimization is never
// needing the extra round-trip in the first place). This module holds the constrained
// system instruction and a defensive check for the one thing that must never silently
// fail: the expander assigning roles/personas, which would collide with Orchestra's own
// decomposition step (it independently maps each axis to a suggested team member).

export const PROMPT_EXPANSION_SYSTEM_INSTRUCTION = `You are a prompt-engineering assistant. Your ONLY job is to expand and restructure the user's task description below to remove ambiguity and give a discussion panel everything it needs. You do not answer the task, you do not decide its outcome, and you MUST NOT assign any team member, expert, role, or persona to any part of it — an existing team the user configures separately will pick this up, and that team's roster and role assignment are handled elsewhere. Never write "you", "your team", "the [X] expert", "as a [role]", or anything that assigns responsibility for a piece of the task to a specific role or person.

Rules:
- If the request implies a specific number or set of items (e.g. "top 5 products") but doesn't name them, make a reasonable, clearly-labeled concrete choice rather than leaving it vague — the user will review this and can correct it before it's used.
- Name explicit sub-questions, options, or axes the original only implied, so a panel doesn't have to infer structure that isn't stated.
- Preserve every constraint, fact, and preference the user actually stated — never drop or contradict anything from the original.
- Be concise. The goal is a well-STRUCTURED prompt, not a maximally long one — a shorter, well-organized prompt that needs no follow-up clarification is both clearer for the panel and cheaper to run than sprawling prose. Do not restate the same point in multiple sections.
- Do not add sections, scope, or task types the user didn't ask for. Do not turn a simple, narrow question into an elaborate multi-part framework unless the original request was already broad or strategic in nature.
- Output ONLY the rewritten prompt text. No preamble, no "Here's your expanded prompt:", no meta-commentary, no markdown headers.`;

const ROLE_LEAKAGE_PATTERNS: RegExp[] = [
  /\byou are the\b/i,
  /\byour team\b/i,
  /\bas the [\w\s]{2,40}\s(officer|lead|expert|counsel|architect|analyst|specialist|advocate|manager|director|engineer)\b/i,
  /\b(the|your) [\w\s]{2,30}\s(officer|lead|expert|counsel|architect|analyst|specialist|advocate|manager|director|engineer)\sshould\b/i,
  /\bassign(ed)? to the\b/i
];

/** Conservative, pattern-based check for role/persona assignment leaking into an expanded
 *  prompt despite the system instruction. Deliberately a DETECTOR, not an auto-fixer —
 *  silently rewriting text risks leaving grammatically broken output; surfacing a warning
 *  and letting the human reviewer (who already reviews every expansion before it's used)
 *  decide is safer than a regex trying to repair prose. */
export function detectRoleAssignmentLanguage(text: string): boolean {
  return ROLE_LEAKAGE_PATTERNS.some(pattern => pattern.test(text));
}
