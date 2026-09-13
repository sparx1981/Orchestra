// Module A — Design Intelligence Agent. Builds the prompt for a single agent call that
// turns retrieved reference data (see designIntelligence.ts) into a concrete DesignSystem,
// and leniently parses whatever the model sends back. Runs once, BEFORE the spec-drafting
// agents, on whichever provider the Lead Architect agent is configured with — nothing here
// is provider-specific, the model only ever receives and returns plain text/JSON.

import type { CustomAgent } from "@/src/App";
import type { DesignSystem, DesignSystemChoice } from "./productSpecTypes";
import {
  retrieveDesignReferenceData,
  serializeReferenceDataForPrompt,
  densityDialLabel,
  isEffectivelyEmpty,
  type DesignDials,
  type DesignQuery,
  type DesignReferenceData,
} from "./designIntelligence";

export interface DesignIntelligenceInput {
  appConcept: string;
  title: string;
  dials: DesignDials;
}

/**
 * The retrieval query text combines everything that plausibly carries product-type/industry
 * /style signal — the concept itself plus the title — since this app doesn't yet separately
 * extract a structured "industry" field; keyword overlap against tags/matches is what does
 * the actual disambiguation work, not this string's shape.
 */
function buildQuery(input: DesignIntelligenceInput): DesignQuery {
  return { text: `${input.title} ${input.appConcept}`, dials: input.dials };
}

export function buildDesignIntelligenceInstruction(input: DesignIntelligenceInput, referenceData: DesignReferenceData, emptyDatasets: string[]): string {
  const motionEnabled = input.dials.motion > 1; // dial at its floor means "no motion" rather than "subtle motion"
  const densityOverride = densityDialLabel(input.dials.density);

  const emptyNote = emptyDatasets.length > 0
    ? `\n\nNOTE: the following reference_data catalogs returned NO relevant matches for this product (${emptyDatasets.join(", ")}) — this looks like a genuinely novel product type. For those specific catalogs only, say so explicitly in your rationale and fall back to these stated general defaults instead of inventing a value: style → a clean, minimal, low-ornamentation baseline; palette → a neutral gray-and-single-accent baseline; typography → a widely-legible system sans-serif pairing. Do NOT invent an entry that looks like it came from reference_data if it did not.`
    : "";

  return `You are the Design Intelligence Agent, a senior product designer producing a reasoned, concrete design system for "${input.title}" before any other section of the spec is drafted.

APP CONCEPT:
${input.appConcept}

<reference_data>
${serializeReferenceDataForPrompt(referenceData)}
</reference_data>

DESIGN DIALS (set by the product owner, 1-10 scale):
- Variance: ${input.dials.variance} (1 = minimal/safe, 10 = bold/asymmetric) — this already biased which reference_data entries you were given; still pick the single best-fit one.
- Motion: ${input.dials.motion} (${motionEnabled ? "motion is enabled — reference_data.motionPresets is already filtered to the matching tier" : "motion dial is at its floor — treat motion as DISABLED for this product; omit the motion field entirely rather than picking a preset"}).
- Density: ${input.dials.density} → explicit density override: "${densityOverride}". Use this density label directly rather than re-deriving it from reference_data.

YOUR TASK — select EXACTLY ONE of each from reference_data ONLY, never invent an option outside what's supplied (unless a catalog was empty — see the note below):
1. One style (from reference_data.styles)
2. One palette (from reference_data.palettes)
3. One typography pairing (from reference_data.typography)
4. A layout: pick the density label above and the most fitting nav pattern from reference_data.productTypes' recommended_nav_pattern values
5. ${motionEnabled ? "One motion preset (from reference_data.motionPresets)" : "Omit motion — it is disabled by the dial"}

For each choice, justify it in exactly one sentence tied to the product type or audience — not a generic aesthetic preference. Then list 2-4 anti-patterns to avoid, pulled directly from the anti_patterns arrays of the style/records you matched against (do not invent new ones).${emptyNote}

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{
  "style": { "id": "...", "name": "...", "rationale": "one sentence" },
  "palette": { "id": "...", "name": "...", "rationale": "one sentence" },
  "typography": { "id": "...", "name": "...", "rationale": "one sentence" },
  "layout": { "density": "${densityOverride}", "navPattern": "...", "rationale": "one sentence" },
  ${motionEnabled ? '"motion": { "id": "...", "name": "...", "rationale": "one sentence" },' : ""}
  "anti_patterns": ["...", "..."],
  "rationale": "one paragraph tying style + palette + typography + layout together as a coherent system for this product"
}`;
}

/**
 * Lenient parse: tries strict JSON first (after stripping markdown fences, which some
 * providers add despite instructions), then falls back to pulling out whatever fields it
 * can find via simple key-based regex scans rather than failing the whole design system —
 * a partial, honestly-labeled design system beats none at all here, since the drafting
 * agents downstream degrade gracefully to their own judgment for anything missing.
 */
export function parseDesignIntelligenceResponse(raw: string, dials: DesignDials): DesignSystem {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = lenientSectionParse(cleaned);
  }

  const toChoice = (v: any, fallbackName: string): DesignSystemChoice => ({
    id: typeof v?.id === "string" && v.id ? v.id : "unspecified",
    name: typeof v?.name === "string" && v.name ? v.name : fallbackName,
    rationale: typeof v?.rationale === "string" && v.rationale ? v.rationale : "No rationale returned by the model — treat as a provisional default.",
  });

  const layout = parsed?.layout || {};
  const motion = parsed?.motion && (parsed.motion.id || parsed.motion.name) ? toChoice(parsed.motion, "Standard motion") : undefined;

  return {
    generatedAt: new Date().toISOString(),
    style: toChoice(parsed?.style, "Component-Library Default"),
    palette: toChoice(parsed?.palette, "Neutral Gray-Blue"),
    typography: toChoice(parsed?.typography, "Inter / Inter"),
    layout: {
      density: typeof layout.density === "string" && layout.density ? layout.density : densityDialLabel(dials.density),
      navPattern: typeof layout.navPattern === "string" && layout.navPattern ? layout.navPattern : "persistent left sidebar",
      rationale: typeof layout.rationale === "string" && layout.rationale ? layout.rationale : "Default layout — the model's response could not be parsed for this field.",
    },
    motion,
    anti_patterns: Array.isArray(parsed?.anti_patterns) ? parsed.anti_patterns.filter((a: any) => typeof a === "string" && a.trim()) : [],
    rationale: typeof parsed?.rationale === "string" && parsed.rationale.trim() ? parsed.rationale.trim() : "The Design Intelligence Agent's response could not be fully parsed — this design system falls back to safe defaults; regenerate for a fully reasoned version.",
    dials: { ...dials },
  };
}

/** Fallback for a model that answered in markdown/prose instead of JSON: pulls values out by
 *  scanning for "field: value"-shaped lines, tolerant of headers, bullets, and bold markers. */
function lenientSectionParse(text: string): any {
  const result: any = {};
  const grab = (label: string): string | undefined => {
    const re = new RegExp(`${label}\\s*[:\\-]\\s*\\*{0,2}([^\\n]+)`, "i");
    const m = text.match(re);
    return m ? m[1].replace(/\*+/g, "").trim() : undefined;
  };
  const style = grab("style");
  const palette = grab("palette");
  const typography = grab("typography");
  const rationale = grab("rationale") || grab("overall rationale");
  if (style) result.style = { name: style, rationale: "" };
  if (palette) result.palette = { name: palette, rationale: "" };
  if (typography) result.typography = { name: typography, rationale: "" };
  if (rationale) result.rationale = rationale;
  const antiPatternsMatch = text.match(/anti[- ]patterns?\s*[:\-]?\s*([\s\S]*?)(\n\n|$)/i);
  if (antiPatternsMatch) {
    result.anti_patterns = antiPatternsMatch[1]
      .split("\n")
      .map(l => l.replace(/^[-*•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
  }
  return result;
}

/**
 * Full retrieve-then-call convenience wrapper: builds the query, retrieves reference data,
 * calls the given agent, and returns a populated DesignSystem. Kept separate from the
 * pure prompt-building functions above so ProductTab can call one function while tests can
 * still exercise buildDesignIntelligenceInstruction / parseDesignIntelligenceResponse
 * independently of any network call.
 */
export async function generateDesignSystem(
  input: DesignIntelligenceInput,
  agent: CustomAgent,
  callAgent: (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal) => Promise<string>,
  signal?: AbortSignal
): Promise<DesignSystem> {
  const query = buildQuery(input);
  const referenceData = retrieveDesignReferenceData(query);
  const emptyDatasets: string[] = [];
  if (isEffectivelyEmpty(query, referenceData.styles)) emptyDatasets.push("styles");
  if (isEffectivelyEmpty(query, referenceData.palettes)) emptyDatasets.push("palettes");
  if (isEffectivelyEmpty(query, referenceData.typography)) emptyDatasets.push("typography");

  const instruction = buildDesignIntelligenceInstruction(input, referenceData, emptyDatasets);
  const raw = await callAgent(agent, `Generate the design system for "${input.title}".`, instruction, signal);
  return parseDesignIntelligenceResponse(raw, input.dials);
}
