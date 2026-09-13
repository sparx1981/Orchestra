// Automated Specification Quality Pass (SQP) — shared types. Mirrors the JSON shapes of
// src/data/sqp/pattern_library.json (the seed/default library — see specQualityPrompt.ts for
// where a user's own stored copy, if any, overrides it) and the result the 4-stage pipeline
// (specQualityLexicalScan.ts Stage 1, specQualityPrompt.ts Stages 2-4) produces per spec.
// Runs on the technical Product Spec only — never the Client-Facing Spec.

import defaultPatternLibraryData from "@/src/data/sqp/pattern_library.json";

export interface ChangelogEntry {
  version: string;
  date: string;
  editor: string; // this app has no separate admin-role concept — user.email or user.uid
  description: string;
}

export type PatternCategory = "phrase-level" | "structural" | "spec-anti-pattern";
export type PatternMatchType = "literal_list" | "regex" | "llm_judgment";
export type PatternSeverity = "low" | "medium" | "high";

export interface PatternEntry {
  id: string;
  category: PatternCategory;
  scope: "universal" | "spec-specific";
  match_type: PatternMatchType;
  // Present when match_type is "literal_list" or "regex" — the literal terms (or regex
  // source strings, matched case-insensitively) Stage 1's pure-code scan matches against.
  terms?: string[];
  // Present (instead of `terms`) when match_type is "llm_judgment" — these entries carry no
  // literal pattern to match; they're described to the model in Stage 2's prompt instead,
  // since detecting them requires semantic judgment a regex can't do.
  description?: string;
  example?: string;
  severity: PatternSeverity;
  suggested_fix: string;
  added: string;
  added_by: string;
}

export interface PatternLibrary {
  version: string;
  changelog: ChangelogEntry[];
  entries: PatternEntry[];
}

// Stage 1 output — one flagged span per lexical hit.
export interface LexicalHit {
  quote: string;
  term: string;
  category: PatternCategory;
  severity: PatternSeverity;
  charOffset: number;
}

// The four rubric dimensions are fixed and NOT user-editable — this is a hardcoded constant,
// not config, unlike the pattern library above. See SPEC_QUALITY_RUBRIC in specQualityPrompt.ts.
export interface ScoringRubricDimension {
  key: "ai_likeness" | "requirement_clarity" | "testability" | "completeness";
  label: string;
  description: string;
  target: string; // e.g. "1-3" or "8-10" — direction the score should point
}

export type ScoringRubric = ScoringRubricDimension[];

// Stage 2 output — a structural AI-texture pattern the lexical scan can't catch (templated
// intros, uniform section depth, summary-restatement closings, stacked fragment emphasis).
export interface StructuralFlag {
  quote: string;
  pattern: string;
  suggestion: string;
}

// Stage 2 output — a hit against one of the spec-specific anti-patterns in the library.
export interface AntiPatternFlag {
  quote: string;
  pattern_id: string;
  suggestion: string;
}

export interface SpecQualityScores {
  ai_likeness: number;
  requirement_clarity: number;
  testability: number;
  completeness: number;
}

export interface SpecQualityJustifications {
  ai_likeness: string;
  requirement_clarity: string;
  testability: string;
  completeness: string;
}

export type SqpGateStatus = "pass" | "needs_revision";

// The full result of one SQP pass over one spec — stored as ProductSpec.qualityReview.
export interface SpecQualityReviewResult {
  scores: SpecQualityScores;
  score_justifications: SpecQualityJustifications;
  // A spec can read as polished (low ai_likeness) yet contain nothing an engineer can
  // actually build from (low testability/completeness) — see the hollow-spec rule in
  // specQualityPrompt.ts's gate decision.
  hollow_spec_flag: boolean;
  structural_flags: StructuralFlag[];
  anti_pattern_flags: AntiPatternFlag[];
  top_changes: string[];
  rewrite: string;
  gate_status: SqpGateStatus;
  reviewedAt: string;
  modelUsed?: string;
}

export type SqpGateMode = "advisory" | "blocking";

export interface SqpThresholdConfig {
  ai_likeness_max: number; // default 3 — gate fails if ai_likeness > this
  testability_min: number; // default 8 — gate fails if testability < this
  completeness_min: number; // default 7 — gate fails if completeness < this
  // "advisory" (default) never blocks export — purely informational in the UI. "blocking"
  // prevents the export actions from firing until the user explicitly overrides. Defaults
  // OFF — most users will never hit blocking mode.
  gate_mode: SqpGateMode;
}

export const DEFAULT_SQP_THRESHOLDS: SqpThresholdConfig = {
  ai_likeness_max: 3,
  testability_min: 8,
  completeness_min: 7,
  gate_mode: "advisory",
};

// The bundled JSON is only ever the SEED/DEFAULT — the library must be editable at runtime
// (see the Settings → Editor → Specification Quality Pass panel), so a user's own edited copy
// lives in Firestore and is what actually gets used once one exists; this export is what
// falls back into place before that first load (or for a user who never edits it).
export const DEFAULT_SQP_PATTERN_LIBRARY: PatternLibrary = defaultPatternLibraryData as PatternLibrary;
