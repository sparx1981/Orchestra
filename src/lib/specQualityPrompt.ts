// Automated Specification Quality Pass — Stage 2 (LLM Structural & Judgment Pass), Stage 3
// (Scoring & Gate Decision) and Stage 4 (rewrite storage, via the Stage 2 response itself).
// Runs on the technical Product Spec only — never the Client-Facing Spec. Provider-agnostic,
// same convention as designIntelligencePrompt.ts / craftReviewPrompt.ts: the model only ever
// receives and returns plain text/JSON, nothing vendor-specific.

import type { CustomAgent } from "@/src/App";
import { runLexicalScan } from "./specQualityLexicalScan";
import type {
  AntiPatternFlag,
  LexicalHit,
  PatternEntry,
  PatternLibrary,
  ScoringRubric,
  SpecQualityJustifications,
  SpecQualityReviewResult,
  SpecQualityScores,
  SqpThresholdConfig,
  StructuralFlag,
} from "./specQualityTypes";

// Fixed, not user-editable — see ScoringRubric in specQualityTypes.ts.
export const SPEC_QUALITY_RUBRIC: ScoringRubric = [
  {
    key: "ai_likeness",
    label: "AI-Likeness",
    description: "Density of generic phrasing and templated structure in the document. Lower is better.",
    target: "1-3",
  },
  {
    key: "requirement_clarity",
    label: "Requirement Clarity",
    description: "Can an engineer act on each requirement without needing a follow-up question?",
    target: "8-10",
  },
  {
    key: "testability",
    label: "Testability",
    description: "Can each requirement and acceptance criterion be verified with a concrete pass/fail check?",
    target: "8-10",
  },
  {
    key: "completeness",
    label: "Completeness",
    description: "Are edge cases, error states, quantified NFRs, and dependencies covered?",
    target: "7-10",
  },
];

const SQP_SYSTEM_PROMPT = `You are reviewing a product specification for generic AI-generated texture
and for spec-writing weaknesses. You will be given:
1. The draft specification text.
2. A list of phrase-level matches already found by a separate lexical scan.
3. A scoring rubric.
4. A list of spec-specific anti-patterns to check for.

Your job:
1. Scan for structural AI-texture patterns not caught by the lexical scan
   (templated section intros, uniform section depth regardless of
   complexity, summary-restatement closings, stacked fragment emphasis).
2. Check for each spec-specific anti-pattern in the provided list. For each
   hit, quote the exact text and name which anti-pattern it matches.
3. Score the document on the four rubric dimensions, 1-10, with a one
   sentence justification for each score.
4. Identify the top 3 changes that would most improve the document.
5. Produce a rewrite that:
   - Never adds a requirement, claim, or fact that was not in the original.
   - Never removes a requirement or piece of substance.
   - Never invents a number, statistic, or example that was not given to
     you. Where a claim needs a number and none is available, insert a
     placeholder in the form [SPECIFY: what is needed] instead of guessing.
   - Replaces every flagged phrase and anti-pattern with specific,
     falsifiable language.
   - Varies section depth to match actual complexity instead of padding
     short sections to match longer ones.

Return your response as a single JSON object matching the schema you have
been given. Do not include any text outside the JSON object.`;

function serializeAntiPatternEntries(library: PatternLibrary): (Pick<PatternEntry, "id" | "category" | "description" | "example" | "suggested_fix" | "severity">)[] {
  return library.entries
    .filter(e => e.category === "spec-anti-pattern" || e.category === "structural")
    .map(e => ({ id: e.id, category: e.category, description: e.description, example: e.example, suggested_fix: e.suggested_fix, severity: e.severity }));
}

/**
 * Builds the Stage 2 user message: draft spec text, Stage 1 hits (labeled so the model
 * incorporates rather than re-reports them), the spec-specific/structural anti-pattern
 * library entries, and the rubric — all plain text/JSON, no vendor-specific schema.
 */
export function buildSpecQualityUserMessage(specText: string, stage1Hits: LexicalHit[], library: PatternLibrary): string {
  return `DRAFT SPECIFICATION TEXT:
${specText}

LEXICAL SCAN HITS (already found — do not re-report these, incorporate them into your structural review and rewrite):
${JSON.stringify(stage1Hits, null, 2)}

SPEC-SPECIFIC AND STRUCTURAL ANTI-PATTERNS TO CHECK FOR:
${JSON.stringify(serializeAntiPatternEntries(library), null, 2)}

SCORING RUBRIC:
${JSON.stringify(SPEC_QUALITY_RUBRIC, null, 2)}

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{
  "scores": { "ai_likeness": 1-10, "requirement_clarity": 1-10, "testability": 1-10, "completeness": 1-10 },
  "score_justifications": { "ai_likeness": "one sentence", "requirement_clarity": "one sentence", "testability": "one sentence", "completeness": "one sentence" },
  "hollow_spec_flag": true | false,
  "structural_flags": [ { "quote": "exact text", "pattern": "which structural pattern", "suggestion": "how to fix it" } ],
  "anti_pattern_flags": [ { "quote": "exact text", "pattern_id": "the matching id from the anti-pattern list above", "suggestion": "how to fix it" } ],
  "top_changes": ["most important change", "second", "third"],
  "rewrite": "the full rewritten specification text"
}`;
}

export function buildSpecQualityInstruction(): string {
  return SQP_SYSTEM_PROMPT;
}

function toNumber(v: any, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : fallback;
}

function toStr(v: any, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/**
 * Lenient parse: tries strict JSON first (after stripping markdown fences some providers add
 * despite instructions), then falls back to best-effort field extraction — mirrors the
 * tolerance convention in designIntelligencePrompt.ts / craftReviewPrompt.ts. Returns
 * everything the Stage 2 response schema promises EXCEPT gate_status/reviewedAt/modelUsed,
 * which the wrapper below (Stage 3) fills in.
 */
export function parseSpecQualityResponse(raw: string): Omit<SpecQualityReviewResult, "gate_status" | "reviewedAt" | "modelUsed"> {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = null;
  }

  const scoresIn = parsed?.scores || {};
  const scores: SpecQualityScores = {
    ai_likeness: toNumber(scoresIn.ai_likeness, 5),
    requirement_clarity: toNumber(scoresIn.requirement_clarity, 5),
    testability: toNumber(scoresIn.testability, 5),
    completeness: toNumber(scoresIn.completeness, 5),
  };

  const justIn = parsed?.score_justifications || {};
  const score_justifications: SpecQualityJustifications = {
    ai_likeness: toStr(justIn.ai_likeness, "No justification returned by the model."),
    requirement_clarity: toStr(justIn.requirement_clarity, "No justification returned by the model."),
    testability: toStr(justIn.testability, "No justification returned by the model."),
    completeness: toStr(justIn.completeness, "No justification returned by the model."),
  };

  const structural_flags: StructuralFlag[] = Array.isArray(parsed?.structural_flags)
    ? parsed.structural_flags
        .filter((f: any) => f && typeof f.quote === "string")
        .map((f: any) => ({ quote: f.quote, pattern: toStr(f.pattern, "structural"), suggestion: toStr(f.suggestion) }))
    : [];

  const anti_pattern_flags: AntiPatternFlag[] = Array.isArray(parsed?.anti_pattern_flags)
    ? parsed.anti_pattern_flags
        .filter((f: any) => f && typeof f.quote === "string")
        .map((f: any) => ({ quote: f.quote, pattern_id: toStr(f.pattern_id, "unknown"), suggestion: toStr(f.suggestion) }))
    : [];

  const top_changes: string[] = Array.isArray(parsed?.top_changes)
    ? parsed.top_changes.filter((x: any) => typeof x === "string" && x.trim()).slice(0, 3)
    : [];

  const hollow_spec_flag =
    typeof parsed?.hollow_spec_flag === "boolean"
      ? parsed.hollow_spec_flag
      : scores.ai_likeness <= 3 && (scores.testability < 8 || scores.completeness < 7);

  const rewrite = toStr(parsed?.rewrite, "");

  return { scores, score_justifications, hollow_spec_flag, structural_flags, anti_pattern_flags, top_changes, rewrite };
}

/** Stage 3 — compares Stage 2 scores against configurable thresholds. Advisory by default:
 *  the gate never silently blocks anything on its own, it only labels the result — see
 *  gate_mode's actual enforcement in ProductTab (export call sites) for "blocking" mode. */
export function computeGateStatus(scores: SpecQualityScores, thresholds: SqpThresholdConfig): "pass" | "needs_revision" {
  if (scores.ai_likeness > thresholds.ai_likeness_max) return "needs_revision";
  if (scores.testability < thresholds.testability_min) return "needs_revision";
  if (scores.completeness < thresholds.completeness_min) return "needs_revision";
  return "pass";
}

/**
 * Full Stage 1 → 2 → 3 convenience wrapper. `callModel` mirrors the callAgent signature used
 * throughout the app (agent, userContent, systemInstruction, signal) so this runs on whichever
 * provider `agent` is configured with, same as every other multi-agent call in this codebase.
 */
export async function runSpecQualityPass(
  specText: string,
  library: PatternLibrary,
  thresholds: SqpThresholdConfig,
  agent: CustomAgent,
  callModel: (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal) => Promise<string>,
  signal?: AbortSignal
): Promise<SpecQualityReviewResult> {
  const stage1Hits = runLexicalScan(specText, library);
  const userMessage = buildSpecQualityUserMessage(specText, stage1Hits, library);
  const raw = await callModel(agent, userMessage, buildSpecQualityInstruction(), signal);
  const parsed = parseSpecQualityResponse(raw);
  const gate_status = computeGateStatus(parsed.scores, thresholds);

  return {
    ...parsed,
    gate_status,
    reviewedAt: new Date().toISOString(),
    modelUsed: `${agent.provider}/${agent.model}`,
  };
}
