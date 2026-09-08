import type { CustomAgent, KnowledgeFile } from "@/src/App";
import { truncateText } from "@/src/lib/textUtils";

export type VibeCodingTool =
  | "google_ai_studio"
  | "cursor"
  | "claude_code"
  | "lovable"
  | "v0"
  | "windsurf"
  | "bolt"
  | "general";

export interface VibeCodingToolInfo {
  id: VibeCodingTool;
  label: string;
  tagline: string;
  recommendedFormat: string;
  tips: string;
}

export interface ProductSpecRevision {
  content: string;
  revisedAt: string;
  reason: string;
}

export interface ProductSpecSection {
  id: string;
  key:
    | "overview"
    | "architecture"
    | "workflows"
    | "ui_ux"
    | "data_models"
    | "api_contracts"
    | "edge_cases"
    | "file_manifest"
    | "vibe_playbook"
    | string;
  heading: string;
  category: "strategy" | "design" | "engineering" | "execution";
  authorAgentId: string;
  authorAgentName: string;
  content: string;
  // Populated by the cross-agent review pass (see handleGenerateSpec): who checked this
  // section for feasibility/consistency, and a short note on what — if anything — that
  // review caused the author to change. Absent for sections that predate this feature or
  // whose review found nothing to flag.
  reviewedByAgentName?: string;
  reviewVerdict?: "approved" | "revised" | "flagged";
  reviewNotes?: string;
  // How many review→revise rounds this section went through before stopping (approved,
  // or the round cap was hit). 1 means approved on the first pass with no revision needed.
  reviewRounds?: number;
  // Whether the reviewer picked for this section was on a different model/provider than
  // the author — same-family models share blind spots, so a same-provider review (only
  // possible when the team has no other provider available) is a weaker check, surfaced
  // to the user rather than silently treated the same as a genuinely independent one.
  reviewCrossProvider?: boolean;
  // Every prior version of `content`, oldest first, pushed here right before an overwrite
  // (by the review pass, the consistency sweep, or a manual "Refine Section"). Lets the
  // user see — and restore — what a revision actually changed.
  revisionHistory?: ProductSpecRevision[];
}

export interface ProductSpecOpenQuestion {
  id: string;
  sectionId: string;
  sectionHeading: string;
  question: string;
  askedByAgentName: string;
  answer?: string;
  // Whether the question came from the agent that drafted the section hitting a genuine
  // ambiguity mid-draft, or from the independent reviewer that checked it afterward.
  phase?: "drafting" | "review";
}

// A question the lead agent asked BEFORE drafting started, because the app idea was
// ambiguous on something that would genuinely change the architecture or scope.
export interface ProductSpecPreflightQuestion {
  id: string;
  question: string;
  answer?: string;
}

export type ProductGenerationDepth = "quick" | "thorough";

// Firestore documents cap at ~1MB (1,048,576 bytes). Previously this was enforced as a flat
// 40,000-character-per-section / 2,000-character-per-revision cap, applied unconditionally —
// which silently discarded full-fidelity content for even moderately detailed specs nowhere
// near Firestore's actual limit (a single well-developed section can easily run past 40,000
// characters on its own well before the *document as a whole* is at any real risk). That
// meant a spec generated at real length (the kind spanning 100-200+ printed pages once
// exported) would come back from Chat History missing most of its content on the very
// documents where completeness matters most.
//
// This budget is spent across the whole document instead: nothing gets trimmed at all unless
// the spec, as a whole, would actually risk exceeding Firestore's real per-document limit.
// SAFE_HISTORY_DOC_BUDGET_CHARS leaves generous headroom under that ceiling for JSON escaping
// overhead and every other field on the document (title, metadata, grounded sources, etc.).
export const SAFE_HISTORY_DOC_BUDGET_CHARS = 850000;
// Kept for compatibility with any external caller expecting the old flat per-section constant
// (nothing in this file uses it anymore — see capSpecForHistoryStorage below).
export const HISTORY_SECTION_CONTENT_CAP = 40000;
// Revisions are already-superseded content, kept for reference/restore — trimmed more readily
// than live section content once the document is over budget, but generously enough that a
// reader can still see the substance of what changed.
export const HISTORY_REVISION_CONTENT_CAP = 8000;
// However small a section's fair share of the budget works out to, never cut it below this —
// guarantees no section is ever blanked to near-nothing even in a genuinely enormous spec.
const MIN_SECTION_CONTENT_FLOOR_CHARS = 20000;

/**
 * Returns a version of `spec` safe to write to a single Firestore document, trimming as
 * little as possible: revisions and section content are left completely untouched unless the
 * document as a whole is actually over budget, in which case section content is trimmed
 * proportionally (largest sections lose the most) rather than by a flat per-section cutoff.
 */
export function capSpecForHistoryStorage(spec: ProductSpec): { spec: ProductSpec; wasTrimmed: boolean } {
  const fullSize = JSON.stringify(spec).length;
  if (fullSize <= SAFE_HISTORY_DOC_BUDGET_CHARS) {
    return { spec, wasTrimmed: false };
  }

  const sectionsWithCappedRevisions = spec.sections.map(s => ({
    ...s,
    revisionHistory: (s.revisionHistory || []).map(r => ({ ...r, content: truncateText(r.content, HISTORY_REVISION_CONTENT_CAP) })),
  }));

  const overheadSize = JSON.stringify({ ...spec, sections: sectionsWithCappedRevisions.map(s => ({ ...s, content: "" })) }).length;
  const sectionCount = Math.max(sectionsWithCappedRevisions.length, 1);
  const contentBudget = Math.max(SAFE_HISTORY_DOC_BUDGET_CHARS - overheadSize, MIN_SECTION_CONTENT_FLOOR_CHARS * sectionCount);
  const totalContentSize = sectionsWithCappedRevisions.reduce((sum, s) => sum + (s.content?.length || 0), 0);
  const scale = totalContentSize > 0 ? Math.min(1, contentBudget / totalContentSize) : 1;

  const cappedSections = sectionsWithCappedRevisions.map(s => {
    const raw = s.content || "";
    if (scale >= 1) return s; // this section's share of the budget already covers it in full
    const perSectionCap = Math.max(Math.floor(raw.length * scale), MIN_SECTION_CONTENT_FLOOR_CHARS);
    return raw.length > perSectionCap ? { ...s, content: truncateText(raw, perSectionCap) } : s;
  });

  return { spec: { ...spec, sections: cappedSections }, wasTrimmed: true };
}

/** True if saving this spec to Chat History would trim anything — i.e. the full-fidelity
 *  version only exists in the current browser session from here on, unless the user
 *  exports or backs it up some other way. Mirrors capSpecForHistoryStorage's own decision
 *  exactly (it's the same function), so the warning shown in the Product tab can never
 *  drift out of sync with what saveHistoryEntry actually stores. */
export function wouldExceedHistoryStorageLimits(spec: ProductSpec): boolean {
  return capSpecForHistoryStorage(spec).wasTrimmed;
}

export interface ProductSpecGroundedSource {
  name: string;
  sourceType: string;
  // Present for sources with an external location (a GitHub repo's URL) — absent for
  // uploaded files, where `name` (the filename) is the only identifier there is.
  url?: string;
  // A short, concrete excerpt of the actual content the team read — proof this source was
  // genuinely considered, not just listed. For a codebase source (GitHub/.zip) this is the
  // digest's own overview line (file count, stack) rather than raw file content, which
  // would be too long for a title page.
  excerpt: string;
}

export interface ProductSpec {
  id: string;
  title: string;
  subtitle: string;
  targetTool: VibeCodingTool;
  appConcept: string;
  createdAt: string;
  sections: ProductSpecSection[];
  groundedSourceCount: number;
  groundedSourceIds: string[];
  // Per-source detail for the title page's "Knowledge Sources Referenced" list — see
  // ProductSpecGroundedSource. Optional for backward compatibility with specs generated
  // before this field existed (those still have groundedSourceCount/Ids).
  groundedSources?: ProductSpecGroundedSource[];
  facilitatorAgentName?: string;
  // Questions the review pass couldn't resolve on its own — things only the user can
  // decide (e.g. "should this support multiple currencies?"). Surfaced in the UI so the
  // user can answer them and have the affected section refined accordingly.
  openQuestions?: ProductSpecOpenQuestion[];
  // Clarifying questions asked (and the user's answers) before drafting began.
  preflightQuestions?: ProductSpecPreflightQuestion[];
  // Which pipeline produced this spec — "quick" skipped the cross-agent review pass.
  generationDepth?: ProductGenerationDepth;
  // Whether this was scoped as a new build or an update to an existing app, and — if an
  // update — which knowledge-base file (a GitHub repo or codebase .zip) it was grounded on,
  // if any was attached. Recorded for display/history purposes; not attaching one is fine.
  projectType?: "new" | "update";
  groundedOnExistingCodebase?: string;
  // Notes from the final cross-section consistency sweep (see handleGenerateSpec) that
  // didn't require touching any section — e.g. a contradiction the team judged minor.
  consistencyNotes?: string[];
}

export const VIBE_CODING_TOOLS: VibeCodingToolInfo[] = [
  {
    id: "google_ai_studio",
    label: "Google AI Studio",
    tagline: "Optimized for Google AI Studio Build, full-stack Cloud Run, server-side Gemini & modern React",
    recommendedFormat: "Single or full-stack Vite + React TypeScript, server-side Gemini API proxy (/api/*), port 3000 rules, and modular component hierarchy",
    tips: "Keeps all API keys server-side in server.ts, defines .env.example, strictly adheres to user intent, and avoids unrequested bloat.",
  },
  {
    id: "cursor",
    label: "Cursor Composer",
    tagline: "Optimized for .cursorrules, file-targeted edits & multi-file agents",
    recommendedFormat: "Concise type definitions, file paths & step-by-step Composer prompts",
    tips: "Keep prompts under 1,000 words per phase. Explicitly name target files.",
  },
  {
    id: "claude_code",
    label: "Claude Code",
    tagline: "Optimized for CLI workflows, autonomous task planning & test verification",
    recommendedFormat: "Terminal command sequences, architecture invariants & self-check rubrics",
    tips: "Provide full context up front. Let Claude run build and test commands.",
  },
  {
    id: "lovable",
    label: "Lovable / v0",
    tagline: "Optimized for full-stack frontend velocity, Tailwind tokens & visual craft",
    recommendedFormat: "Component breakdowns, layout anatomy, responsive breakpoints & microcopy",
    tips: "Focus on visual states (empty, loading, error, success) and exact Tailwind classes.",
  },
  {
    id: "windsurf",
    label: "Windsurf Cascade",
    tagline: "Optimized for Cascade memories, workspace flows & rule adherence",
    recommendedFormat: "Rule directives, architectural boundaries & dependency specifications",
    tips: "Structure directives as hard requirements and define clear data contracts.",
  },
  {
    id: "bolt",
    label: "Bolt.new",
    tagline: "Optimized for in-browser Node/Vite stacks & instant sandbox deployment",
    recommendedFormat: "Single package.json setup, zero-config mock data & self-contained client routes",
    tips: "Keep initial packages lean to avoid WebContainer install timeouts.",
  },
  {
    id: "general",
    label: "Standard Markdown",
    tagline: "Universal high-detail PRD compatible with any AI coding model or IDE",
    recommendedFormat: "Exhaustive specifications, schemas, UI states & phase-by-phase execution plan",
    tips: "Great for documentation, human engineering handoffs, or pasting into web chats.",
  },
];

// Curated default team specializing in high-detail vibe coded product specs
export const DEFAULT_PRODUCT_AGENTS: CustomAgent[] = [
  {
    id: "prod_lead",
    name: "Product Strategist",
    provider: "gemini",
    model: "gemini-3.8-flash",
    persona: "You are a seasoned Principal Product Manager who excels at shaping intuitive, viral, and tightly-scoped software. You define clear user personas, frictionless core loops, sharp problem statements, and ruthless MVP feature boundaries tailored for rapid AI-assisted development.",
    temperature: 0.5,
  },
  {
    id: "ux_lead",
    name: "Design Architect",
    provider: "gemini",
    model: "gemini-3.8-flash",
    persona: "You are a world-class UI/UX Design System Architect. You specify concrete screen-by-screen layouts, component hierarchies, precise visual tokens, empty/loading/error states, responsive adaptations, and micro-interactions with Tailwind utility precision.",
    temperature: 0.6,
  },
  {
    id: "tech_lead",
    name: "System Architect",
    provider: "gemini",
    model: "gemini-3.8-flash",
    persona: "You are a Principal Full-Stack Engineer and TypeScript Architect. You design battle-tested, modular software architectures optimized for vibe coding in Cursor and Claude. You provide exhaustive TypeScript data models, clean API contracts, and robust state management structures.",
    temperature: 0.3,
  },
  {
    id: "qa_lead",
    name: "Vibe Coding Specialist",
    provider: "gemini",
    model: "gemini-3.8-flash",
    persona: "You are an expert AI Coding Agent Specialist and QA Engineer. You identify subtle edge cases, race conditions, token context ceilings, and security guardrails. You formulate step-by-step prompting playbooks structured specifically for AI coding agents to build without hallucinations.",
    temperature: 0.4,
  },
];
