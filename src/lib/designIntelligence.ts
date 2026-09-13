// Module A — Design Intelligence retrieval. Everything here runs in Orchestra's own
// frontend code, never as an LLM tool call: the datasets are small enough (a few dozen
// records each) that a per-call keyword scan is plenty fast without a build step or an
// embeddings index, and keeping retrieval out of the model call is what makes this feature
// work identically across every provider — the model only ever sees the plain JSON this
// file hands it, never a function it could choose to call differently.

import stylesData from "@/src/data/design/styles.json";
import palettesData from "@/src/data/design/palettes.json";
import typographyData from "@/src/data/design/typography.json";
import productTypesData from "@/src/data/design/product_types.json";
import uxGuidelinesData from "@/src/data/design/ux_guidelines.json";
import iconsData from "@/src/data/design/icons.json";
import motionPresetsData from "@/src/data/design/motion_presets.json";
import chartsData from "@/src/data/design/charts.json";
import stacksData from "@/src/data/design/stacks.json";
import qualityBarData from "@/src/data/design/quality_bar.json";

export interface DesignStyle {
  id: string;
  name: string;
  tags: string[];
  description: string;
  best_for: string[];
  avoid_for: string[];
  anti_patterns: string[];
}

export interface DesignPalette {
  id: string;
  name: string;
  tags: string[];
  colors: { background: string; surface: string; primary: string; accent: string; text: string };
  contrast_notes: string;
}

export interface DesignTypography {
  id: string;
  heading_font: string;
  body_font: string;
  tags: string[];
  scale: { base: number; ratio: number; line_height: number };
}

export interface ProductTypeRule {
  id: string;
  matches: string[];
  recommended_density: string;
  recommended_style_ids: string[];
  recommended_nav_pattern: string;
  notes: string;
}

export interface UxGuideline {
  id: string;
  category: string;
  priority: 1 | 2 | 3;
  impact: "CRITICAL" | "HIGH" | "MEDIUM";
  must: string;
  avoid: string;
}

export interface IconGuidance {
  id: string;
  name: string;
  tags: string[];
  style_notes: string;
  recommended_library: string;
}

export interface MotionPreset {
  id: string;
  tier: "subtle" | "standard" | "complex";
  name: string;
  duration_ms: number;
  easing: string;
  framework_notes: string;
}

export interface ChartGuidance {
  id: string;
  chart_type: string;
  data_shape: string;
  best_for: string[];
  avoid_for: string[];
}

export interface StackNote {
  id: string;
  stack: string;
  notes: string;
}

export interface QualityBarRule {
  id: string;
  rule: string;
  category: string;
}

export const STYLES = stylesData as DesignStyle[];
export const PALETTES = palettesData as DesignPalette[];
export const TYPOGRAPHY = typographyData as DesignTypography[];
export const PRODUCT_TYPES = productTypesData as ProductTypeRule[];
export const UX_GUIDELINES = uxGuidelinesData as UxGuideline[];
export const ICONS = iconsData as IconGuidance[];
export const MOTION_PRESETS = motionPresetsData as MotionPreset[];
export const CHARTS = chartsData as ChartGuidance[];
export const STACKS = stacksData as StackNote[];
export const QUALITY_BAR = qualityBarData as QualityBarRule[];

// Design Dials — see ProductTab's sliders. 1-10, defaulting to 5 (mid/standard) so
// generation never requires the user to touch them.
export interface DesignDials {
  variance: number; // 1 = minimal/safe, 10 = bold/asymmetric — biases style/palette retrieval
  motion: number; // 1-3 subtle, 4-7 standard, 8-10 complex — selects the motion_presets tier
  density: number; // 1 = spacious, 10 = dashboard-dense — passed to the agent as override text, not used for retrieval scoring
}

export const DEFAULT_DESIGN_DIALS: DesignDials = { variance: 5, motion: 5, density: 5 };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1);
}

/** The lowercase keyword set a single record is retrievable by — tags/matches plus name/description words. */
function recordKeywords(rec: Record<string, unknown>): Set<string> {
  const words = new Set<string>();
  const fieldsToScan = ["tags", "matches", "best_for", "avoid_for", "name", "description", "notes"];
  for (const field of fieldsToScan) {
    const value = (rec as any)[field];
    if (Array.isArray(value)) {
      for (const v of value) tokenize(String(v)).forEach(t => words.add(t));
    } else if (typeof value === "string") {
      tokenize(value).forEach(t => words.add(t));
    }
  }
  return words;
}

/** Jaccard similarity between the query's token set and a record's keyword set. */
function jaccardScore(queryTokens: Set<string>, recordTokens: Set<string>): number {
  if (queryTokens.size === 0 || recordTokens.size === 0) return 0;
  let intersection = 0;
  for (const t of queryTokens) if (recordTokens.has(t)) intersection++;
  const union = queryTokens.size + recordTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DesignQuery {
  // Free text describing the product — the app concept, industry, and any style keywords
  // pulled from the user's own prompt or preflight answers.
  text: string;
  dials: DesignDials;
}

function scoreAndRank<T extends object>(records: T[], queryTokens: Set<string>, biasTags: string[] = []): T[] {
  return records
    .map(rec => {
      let score = jaccardScore(queryTokens, recordKeywords(rec as Record<string, unknown>));
      const tags = ((rec as any).tags || []) as string[];
      if (biasTags.length > 0 && tags.some(t => biasTags.includes(t.toLowerCase()))) {
        score += 0.25; // dial bias nudges ranking without fully overriding topical relevance
      }
      return { rec, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(r => r.rec);
}

function varianceBiasTags(variance: number): string[] {
  if (variance <= 3) return ["minimal", "low-variance"];
  if (variance >= 8) return ["bold", "asymmetric", "high-variance", "expressive"];
  return ["standard-variance"];
}

function motionTier(motion: number): MotionPreset["tier"] {
  if (motion <= 3) return "subtle";
  if (motion <= 7) return "standard";
  return "complex";
}

export interface DesignReferenceData {
  styles: DesignStyle[];
  palettes: DesignPalette[];
  typography: DesignTypography[];
  productTypes: ProductTypeRule[];
  icons: IconGuidance[];
  motionPresets: MotionPreset[];
  charts: ChartGuidance[];
  stacks: StackNote[];
  // Always included in full regardless of query — these are the fixed quality bar, not
  // something retrieval should ever narrow down.
  qualityBar: QualityBarRule[];
}

const TOP_N = 4;

/**
 * Retrieves the top-N most relevant records per dataset for a design query, applying the
 * Design Dials as a ranking bias (variance) or a hard tier filter (motion) rather than a
 * separate retrieval pass — see DesignDials for what each dial does.
 */
export function retrieveDesignReferenceData(query: DesignQuery): DesignReferenceData {
  const queryTokens = new Set(tokenize(query.text));
  const biasTags = varianceBiasTags(query.dials.variance);
  const tier = motionTier(query.dials.motion);

  return {
    styles: scoreAndRank(STYLES, queryTokens, biasTags).slice(0, TOP_N),
    palettes: scoreAndRank(PALETTES, queryTokens, biasTags).slice(0, TOP_N),
    typography: scoreAndRank(TYPOGRAPHY, queryTokens, biasTags).slice(0, TOP_N),
    productTypes: scoreAndRank(PRODUCT_TYPES, queryTokens).slice(0, TOP_N),
    icons: scoreAndRank(ICONS, queryTokens, biasTags).slice(0, TOP_N),
    motionPresets: MOTION_PRESETS.filter(m => m.tier === tier).slice(0, TOP_N),
    charts: scoreAndRank(CHARTS, queryTokens).slice(0, TOP_N),
    stacks: scoreAndRank(STACKS, queryTokens).slice(0, TOP_N),
    qualityBar: QUALITY_BAR,
  };
}

/** True when a retrieval query matched nothing meaningful in a dataset (all zero-overlap
 *  results) — used to trigger the "reference_data is empty, state that explicitly and use
 *  general defaults" instruction rather than silently handing the agent a low-quality but
 *  non-empty top-N. */
export function isEffectivelyEmpty(query: DesignQuery, records: object[]): boolean {
  const queryTokens = new Set(tokenize(query.text));
  return records.every(r => jaccardScore(queryTokens, recordKeywords(r as Record<string, unknown>)) === 0);
}

/** Compact JSON serialization of the retrieved reference data, ready to insert into a
 *  prompt as a <reference_data> block — deliberately terse (no pretty-printing) to keep
 *  prompt token cost down; the model doesn't need this formatted for human reading. */
export function serializeReferenceDataForPrompt(ref: DesignReferenceData): string {
  return JSON.stringify(ref);
}

export function densityDialLabel(density: number): string {
  if (density <= 3) return "spacious";
  if (density >= 8) return "dashboard-dense";
  return "standard";
}
