// Module B — Craft Review Agent. Runs automatically after drafting + the existing
// cross-agent review pass complete (not on-request), reviewing the drafted SPEC TEXT
// itself against a fixed quality bar — this app never renders or builds UI, so "review"
// here means reading the written UI/UX and overview sections, not looking at pixels.
// Three sequential passes (critique → audit → polish), each one model call, Polish
// explicitly bounded to run once — see runSpecGeneration's integration of this module.

import type { CustomAgent } from "@/src/App";
import type { ProductSpec, ProductSpecSection, SurfaceMode, DesignReviewResult, DesignReviewAuditEntry } from "./productSpecTypes";
import { UX_GUIDELINES, QUALITY_BAR } from "./designIntelligence";

const MODE_PRIORITIES: Record<SurfaceMode, string> = {
  persuade: "visual impact, CTA clarity, and trust signals — this is a marketing/landing/pricing-style surface where the job is to convince, not just inform",
  operate: "scanability, consistency, and native platform conventions — this is an app UI/dashboard/admin/editor surface where the job is repeat-use efficiency",
  read: "structure, hierarchy, and a comfortable reading measure — this is a docs/article/help-style surface where the job is comprehension over time",
  experience: "distinctiveness and immersion, with restraint everywhere else — this is a portfolio/gallery/showcase surface where the job is to make an impression",
};

function keySections(spec: Pick<ProductSpec, "sections">): ProductSpecSection[] {
  return spec.sections.filter(s => s.key === "overview" || s.key === "ui_ux" || s.key === "workflows");
}

export function buildModeClassificationInstruction(appConcept: string, title: string): string {
  return `You are classifying the primary surface mode of "${title}" for a design/UX review pass. Read the app concept below and choose exactly ONE mode:
- "persuade": marketing site, landing page, pricing page — success is measured by conversion.
- "operate": app UI, dashboard, admin panel, editor — success is measured by repeat-use efficiency.
- "read": documentation, articles, help center, long-form content — success is measured by comprehension.
- "experience": portfolio, gallery, showcase, immersive brand site — success is measured by impression/distinctiveness.

If the product is a mix (e.g. a SaaS app with a marketing landing page), classify by what the MAJORITY of the specified product actually is — most vibe-coded products in this tool are the app itself, not its marketing site, so default to "operate" for anything primarily app-shaped.

APP CONCEPT:
${appConcept}

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "mode": "persuade" | "operate" | "read" | "experience", "modeRationale": "one sentence" }`;
}

export function parseModeClassificationResponse(raw: string): { mode: SurfaceMode; modeRationale: string } {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const validModes: SurfaceMode[] = ["persuade", "operate", "read", "experience"];
    if (validModes.includes(parsed?.mode)) {
      return { mode: parsed.mode, modeRationale: typeof parsed.modeRationale === "string" ? parsed.modeRationale : "" };
    }
  } catch {
    const m = cleaned.match(/"?mode"?\s*[:\-]\s*"?(persuade|operate|read|experience)"?/i);
    if (m) return { mode: m[1].toLowerCase() as SurfaceMode, modeRationale: "" };
  }
  return { mode: "operate", modeRationale: "Could not parse the classification response — defaulted to Operate, the most common case for a vibe-coded app." };
}

function buildCritiqueInstruction(mode: SurfaceMode, title: string): string {
  return `You are the Craft Review Agent running the CRITIQUE pass on "${title}", a "${mode}" surface. Review the drafted spec sections below (overview and UI/UX) purely as WRITTEN SPECIFICATION TEXT — there is no rendered UI to look at, so judge whether the text itself describes a design that would achieve: ${MODE_PRIORITIES[mode]}.

Flag concretely: weak or missing visual hierarchy guidance, an unclear value proposition, inconsistent patterns described across sections, or anything vague enough that a developer implementing this spec would have to guess.

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "critiqueFindings": ["specific finding 1", "specific finding 2"] }
Return an empty array if the spec genuinely has no issues for this mode — don't invent findings to pad the list.`;
}

function buildAuditInstruction(title: string): string {
  const categories = Array.from(new Set(UX_GUIDELINES.map(g => g.category)));
  const guidelinesBlock = categories
    .map(cat => {
      const rules = UX_GUIDELINES.filter(g => g.category === cat).map(g => `  - MUST: ${g.must} | AVOID: ${g.avoid}`).join("\n");
      return `${cat}:\n${rules}`;
    })
    .join("\n\n");

  return `You are the Craft Review Agent running the AUDIT pass on "${title}" — a checklist review of the drafted spec text against these UX guideline categories. For EACH category below, decide "pass" (the spec text addresses or is consistent with these rules, or the category is inapplicable and you say so in notes) or "flag" (the spec text is silent on or contradicts these rules where it should address them).

${guidelinesBlock}

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "auditResults": [ { "category": "accessibility", "status": "pass" | "flag", "notes": "one sentence" } , ... one entry per category listed above, in the same order ] }`;
}

function buildPolishInstruction(title: string, critiqueFindings: string[], auditFlags: DesignReviewAuditEntry[]): string {
  const qualityBarBlock = QUALITY_BAR.map(q => `- [${q.category}] ${q.rule}`).join("\n");
  return `You are the Craft Review Agent running the FINAL, ONE-TIME Polish pass on "${title}". This pass produces a SHORT, PRIORITIZED fix list only — do not re-critique or re-audit, that already happened. Synthesize the findings below into concrete, actionable fixes, ordered by impact (most important first). Also independently check the ABSOLUTE quality bar below, which applies regardless of surface mode, and add any violation you can identify from the spec text as its own fix item.

CRITIQUE FINDINGS:
${critiqueFindings.map(f => `- ${f}`).join("\n") || "(none)"}

AUDIT FLAGS:
${auditFlags.map(f => `- [${f.category}] ${f.notes}`).join("\n") || "(none)"}

ABSOLUTE QUALITY BAR (always checked):
${qualityBarBlock}

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "fixList": ["most important fix first", "..."] }
Keep this to the genuinely actionable items — quality over quantity, ideally under 10 items.`;
}

function lenientListParse(raw: string, key: "critiqueFindings" | "fixList"): string[] {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.[key])) return parsed[key].filter((x: any) => typeof x === "string" && x.trim());
  } catch {
    // Fall back to bullet-list scraping for a model that answered in markdown prose.
  }
  return cleaned
    .split("\n")
    .map(l => l.replace(/^[-*•\d.\s]+/, "").trim())
    .filter(l => l.length > 3 && l.length < 400);
}

function lenientAuditParse(raw: string): DesignReviewAuditEntry[] {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.auditResults)) {
      return parsed.auditResults
        .filter((e: any) => e && typeof e.category === "string")
        .map((e: any) => ({
          category: e.category,
          status: e.status === "flag" ? "flag" : "pass",
          notes: typeof e.notes === "string" ? e.notes : "",
        }));
    }
  } catch {
    // Fall through to the category-line scan below.
  }
  const categories = Array.from(new Set(UX_GUIDELINES.map(g => g.category)));
  return categories.map(cat => {
    const re = new RegExp(`${cat}[^\\n]*?(pass|flag)`, "i");
    const m = cleaned.match(re);
    return { category: cat, status: (m?.[1]?.toLowerCase() === "flag" ? "flag" : "pass") as "pass" | "flag", notes: "Parsed leniently from a non-JSON response." };
  });
}

export interface CraftReviewCallbacks {
  onPhase?: (phase: string) => void;
}

/**
 * Runs the three sequential Craft Review passes and returns the combined result. `agent` is
 * whichever agent the caller designates as reviewer (ProductTab passes the QA/Vibe Coding
 * Specialist, mirroring its role in the existing cross-agent review pass). Each pass is one
 * call — Polish is explicitly the third and last, never looped.
 */
export async function runCraftReview(
  spec: Pick<ProductSpec, "sections" | "title">,
  mode: SurfaceMode,
  modeRationale: string,
  agent: CustomAgent,
  callAgent: (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal) => Promise<string>,
  signal?: AbortSignal,
  callbacks?: CraftReviewCallbacks
): Promise<DesignReviewResult> {
  const relevantSections = keySections(spec);
  const sectionsBlock = relevantSections.map(s => `--- ${s.heading} ---\n${s.content.slice(0, 4000)}`).join("\n\n");

  callbacks?.onPhase?.(`${agent.name} is running the Critique pass (Design & UX Review)...`);
  const critiqueRaw = await callAgent(agent, sectionsBlock, buildCritiqueInstruction(mode, spec.title), signal);
  const critiqueFindings = lenientListParse(critiqueRaw, "critiqueFindings");

  callbacks?.onPhase?.(`${agent.name} is running the Audit pass (Design & UX Review)...`);
  const auditRaw = await callAgent(agent, sectionsBlock, buildAuditInstruction(spec.title), signal);
  const auditResults = lenientAuditParse(auditRaw);

  callbacks?.onPhase?.(`${agent.name} is running the Polish pass (Design & UX Review)...`);
  const flagged = auditResults.filter(a => a.status === "flag");
  const polishRaw = await callAgent(agent, sectionsBlock, buildPolishInstruction(spec.title, critiqueFindings, flagged), signal);
  const fixList = lenientListParse(polishRaw, "fixList");

  return { mode, modeRationale, critiqueFindings, auditResults, fixList };
}
