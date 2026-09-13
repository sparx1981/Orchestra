import type { ProductSpec, ProductSpecSection, VibeCodingTool } from "./productSpecTypes";
import { VIBE_CODING_TOOLS } from "./productSpecTypes";

/**
 * Renders spec.designSystem (Module A) as Markdown body content, no heading of its own —
 * callers (buildProductSpecMarkdown below, and the docx/rtf/pdf builders in
 * productSpecExport.ts via getDesignAppendixSections) prepend their own heading so this stays
 * reusable across every output format's own heading style.
 */
export function buildDesignSystemMarkdown(spec: ProductSpec): string {
  const ds = spec.designSystem;
  if (!ds) return "";
  const lines: string[] = [];
  lines.push(`- **Style:** ${ds.style.name} — ${ds.style.rationale}`);
  lines.push(`- **Palette:** ${ds.palette.name} — ${ds.palette.rationale}`);
  lines.push(`- **Typography:** ${ds.typography.name} — ${ds.typography.rationale}`);
  lines.push(`- **Layout:** ${ds.layout.density} density, ${ds.layout.navPattern} — ${ds.layout.rationale}`);
  lines.push(ds.motion ? `- **Motion:** ${ds.motion.name} — ${ds.motion.rationale}` : `- **Motion:** disabled for this product`);
  lines.push(`- **Design Dials used:** Variance ${ds.dials.variance}/10, Motion ${ds.dials.motion}/10, Density ${ds.dials.density}/10`);
  lines.push("");
  if (ds.anti_patterns.length > 0) {
    lines.push(`**Anti-Patterns to Avoid**`);
    ds.anti_patterns.forEach(a => lines.push(`- ${a}`));
    lines.push("");
  }
  lines.push(ds.rationale);
  if (ds.surfaceOverrides && ds.surfaceOverrides.length > 0) {
    lines.push("");
    lines.push(`**Per-Surface Overrides**`);
    ds.surfaceOverrides.forEach(o => {
      lines.push(`- *${o.surfaceName}* (${o.mode}): ${o.rationale || "see per-field overrides"}`);
    });
  }
  return lines.join("\n");
}

/** Renders spec.designReview (Module B) as Markdown body content — same no-own-heading
 *  convention as buildDesignSystemMarkdown above. */
export function buildDesignReviewMarkdown(spec: ProductSpec): string {
  const review = spec.designReview;
  if (!review) return "";
  const lines: string[] = [];
  lines.push(`**Surface Mode: ${review.mode.charAt(0).toUpperCase()}${review.mode.slice(1)}**`);
  if (review.modeRationale) lines.push(review.modeRationale);
  lines.push("");
  if (review.critiqueFindings.length > 0) {
    lines.push(`### Critique`);
    review.critiqueFindings.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }
  if (review.auditResults.length > 0) {
    lines.push(`### Audit (UX Guidelines Checklist)`);
    lines.push(`| Category | Status | Notes |`);
    lines.push(`| --- | --- | --- |`);
    review.auditResults.forEach(a => lines.push(`| ${a.category} | ${a.status === "pass" ? "Pass" : "Flag"} | ${a.notes.replace(/\|/g, "/")} |`));
    lines.push("");
  }
  if (review.fixList.length > 0) {
    lines.push(`### Prioritized Fix List`);
    review.fixList.forEach((f, i) => lines.push(`${i + 1}. ${f}`));
  }
  return lines.join("\n");
}

/** Renders spec.qualityReview (Automated Specification Quality Pass) as Markdown body
 *  content — same no-own-heading convention as buildDesignSystemMarkdown/buildDesignReviewMarkdown
 *  above. See specQualityPrompt.ts for how this result is produced. */
export function buildSpecQualityMarkdown(spec: ProductSpec): string {
  const review = spec.qualityReview;
  if (!review) return "";
  const lines: string[] = [];
  lines.push(`| Dimension | Score | Justification |`);
  lines.push(`| --- | --- | --- |`);
  const dims: { key: keyof typeof review.scores; label: string }[] = [
    { key: "ai_likeness", label: "AI-Likeness" },
    { key: "requirement_clarity", label: "Requirement Clarity" },
    { key: "testability", label: "Testability" },
    { key: "completeness", label: "Completeness" },
  ];
  dims.forEach(d => lines.push(`| ${d.label} | ${review.scores[d.key]}/10 | ${review.score_justifications[d.key].replace(/\|/g, "/")} |`));
  lines.push("");
  lines.push(`**Gate Status:** ${review.gate_status === "pass" ? "Pass" : "Needs Revision"}`);
  lines.push("");
  if (review.hollow_spec_flag) {
    lines.push(`> **Hollow-spec warning:** this document reads as polished prose but scored low on testability and/or completeness — an engineer may not have enough here to build from.`);
    lines.push("");
  }
  if (review.top_changes.length > 0) {
    lines.push(`### Top Changes`);
    review.top_changes.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
    lines.push("");
  }
  if (review.structural_flags.length > 0) {
    lines.push(`### Structural Flags`);
    review.structural_flags.forEach(f => lines.push(`- **${f.pattern}:** "${f.quote}" — ${f.suggestion}`));
    lines.push("");
  }
  if (review.anti_pattern_flags.length > 0) {
    lines.push(`### Anti-Pattern Flags`);
    review.anti_pattern_flags.forEach(f => lines.push(`- **[${f.pattern_id}]:** "${f.quote}" — ${f.suggestion}`));
  }
  return lines.join("\n");
}

/**
 * Appendix sections synthesized from spec.designSystem/designReview/qualityReview, shaped
 * exactly like a ProductSpecSection so every export builder (Markdown here, and docx/rtf/pdf
 * in productSpecExport.ts) can render them through the SAME per-section rendering path used
 * for every other section, rather than a bespoke one-off renderer per format. None of these
 * are real persisted ProductSpecSections — they're never added to spec.sections itself.
 */
export function getDesignAppendixSections(spec: ProductSpec): Pick<ProductSpecSection, "id" | "heading" | "authorAgentName" | "reviewedByAgentName" | "content">[] {
  const sections: Pick<ProductSpecSection, "id" | "heading" | "authorAgentName" | "reviewedByAgentName" | "content">[] = [];
  if (spec.designSystem) {
    sections.push({
      id: "appendix_design_system",
      heading: "Design System",
      authorAgentName: spec.facilitatorAgentName || "Design Intelligence Agent",
      content: buildDesignSystemMarkdown(spec),
    });
  }
  if (spec.designReview) {
    sections.push({
      id: "appendix_design_review",
      heading: "Design & UX Review",
      authorAgentName: "Craft Review Agent",
      content: buildDesignReviewMarkdown(spec),
    });
  }
  if (spec.qualityReview) {
    sections.push({
      id: "appendix_spec_quality",
      heading: "Specification Quality Review",
      authorAgentName: "Specification Quality Pass",
      content: buildSpecQualityMarkdown(spec),
    });
  }
  return sections;
}

/**
 * Formats a complete, high-detail Product Specification into Markdown.
 */
export function buildProductSpecMarkdown(spec: ProductSpec): string {
  const toolInfo = VIBE_CODING_TOOLS.find(t => t.id === spec.targetTool);
  const lines: string[] = [];

  lines.push(`# ${spec.title}`);
  if (spec.subtitle) {
    lines.push(`> ${spec.subtitle}`);
  }
  lines.push("");
  lines.push(`- **Target AI Coding Tool:** ${toolInfo?.label || spec.targetTool} (${toolInfo?.tagline || ""})`);
  lines.push(`- **Generated At:** ${new Date(spec.createdAt).toLocaleDateString()} ${new Date(spec.createdAt).toLocaleTimeString()}`);
  if (spec.facilitatorAgentName) {
    lines.push(`- **Facilitator:** ${spec.facilitatorAgentName}`);
  }
  if (spec.groundedSourceCount > 0) {
    lines.push(`- **Knowledge Grounding:** Verified against ${spec.groundedSourceCount} source document(s)`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const section of [...spec.sections, ...getDesignAppendixSections(spec)]) {
    lines.push(`## ${section.heading}`);
    lines.push(`*Authored by: ${section.authorAgentName}*`);
    lines.push("");
    lines.push(section.content.trim());
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Formats the Client-Facing Product Spec (see handleGenerateClientSpec / ClientFacingSpec)
 * into Markdown. Mirrors buildProductSpecMarkdown's shape but has no "Authored by" bylines
 * or target-tool/grounding metadata — this document is meant for a client/stakeholder
 * audience, not an AI coding agent, so those specifics would just be noise.
 */
export function buildClientFacingSpecMarkdown(spec: ProductSpec): string {
  const clientSpec = spec.clientFacingSpec;
  const lines: string[] = [];

  lines.push(`# ${spec.title} — Client-Facing Product Specification`);
  if (spec.subtitle) {
    lines.push(`> ${spec.subtitle}`);
  }
  lines.push("");
  if (clientSpec?.generatedAt) {
    lines.push(`- **Prepared:** ${new Date(clientSpec.generatedAt).toLocaleDateString()}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const section of clientSpec?.sections || []) {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(section.content.trim());
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Formats a ready-to-copy Prompt Playbook specifically tailored for feeding into
 * Cursor Composer, Claude Code, Lovable, or v0.
 */
export function buildVibeCodingPlaybookMarkdown(spec: ProductSpec): string {
  const playbookSection = spec.sections.find(
    s => s.key === "vibe_playbook" || s.heading.toLowerCase().includes("playbook") || s.heading.toLowerCase().includes("prompt")
  );
  const architectureSection = spec.sections.find(
    s => s.key === "architecture" || s.heading.toLowerCase().includes("architecture") || s.heading.toLowerCase().includes("tech stack")
  );
  const dataModelSection = spec.sections.find(
    s => s.key === "data_models" || s.heading.toLowerCase().includes("schema") || s.heading.toLowerCase().includes("data model")
  );

  const lines: string[] = [];
  lines.push(`# AI Coding Agent Prompt Playbook: ${spec.title}`);
  lines.push(`> Copy and paste these sequential prompt phases directly into your AI coding tool (Cursor, Claude Code, Lovable, v0).`);
  lines.push("");

  if (architectureSection) {
    lines.push("### Master System Prompt / Context Injection");
    lines.push("```markdown");
    lines.push(`You are building ${spec.title}.`);
    lines.push(`App Concept: ${spec.appConcept}`);
    lines.push("");
    lines.push("Core Tech Stack & Principles:");
    lines.push(architectureSection.content.slice(0, 1500));
    lines.push("```");
    lines.push("");
  }

  if (playbookSection) {
    lines.push(playbookSection.content);
  } else {
    // Fallback phased playbook if not distinct
    lines.push("### Phase 1: Project Scaffolding & Types");
    lines.push("```markdown");
    lines.push(`Set up the foundational types and state interfaces for ${spec.title}.`);
    if (dataModelSection) {
      lines.push(dataModelSection.content.slice(0, 1000));
    }
    lines.push("Ensure strict TypeScript types with no 'any'.");
    lines.push("```");
    lines.push("");

    lines.push("### Phase 2: Core Components & Layout");
    lines.push("```markdown");
    lines.push(`Create the main application layout and key UI views with Tailwind CSS.`);
    lines.push("Include clean spacing, responsive flex/grid layouts, and empty states.");
    lines.push("```");
  }

  return lines.join("\n");
}

/**
 * Builds a `.cursorrules` / AI IDE config file for the project.
 */
export function buildCursorRules(spec: ProductSpec): string {
  if (spec.targetTool === "google_ai_studio") {
    return `# Google AI Studio Prompt & Directives for ${spec.title}
# Generated by Multi-Agent Product Specification Panel

You are an expert full-stack developer building "${spec.title}" in Google AI Studio Build.
Concept: ${spec.appConcept}

## Core Google AI Studio Directives:
1. Architecture: Vite + React 18+ with TypeScript and Tailwind CSS.
2. Port & Host: Server must bind strictly to port 3000 on host 0.0.0.0.
3. API Keys & Gemini: All third-party secrets and Gemini API calls must remain server-side in server.ts or /api/* endpoints. Never expose API keys to the browser.
4. UI & Styling: Use Tailwind CSS utility classes exclusively. Keep layout high-contrast with generous negative space and accessible touch targets.
5. Icons: All icons MUST be imported from lucide-react.
6. Animations: Use motion (motion/react) for layout animations and transitions.
7. Modularity: Never place all logic into a single file; extract types into /src/types.ts and components into /src/components/.
8. Strict User Intent: Implement all functional requirements with full working event handlers—never output fake mock stubs or unrequested features.
`;
  }

  return `# .cursorrules for ${spec.title}
# Generated by Multi-Agent Product Specification Panel

You are an expert TypeScript & Modern Frontend developer building "${spec.title}".
Concept: ${spec.appConcept}

## Core Directives:
1. Always use modern TypeScript with explicit interfaces and zero 'any' types.
2. Default to Tailwind CSS utility classes. Never use inline styles or secondary CSS files.
3. Keep layout clean, high-contrast, with generous negative space and accessible touch targets (min 44px).
4. Implement all event handlers with real, interactive state logic—never leave placeholder stubs.
5. Handle all edge cases gracefully: empty states, error boundaries, network retries, and optimistic UI updates.
6. Target Tool: ${spec.targetTool.toUpperCase()}

## Architectural Invariants:
- Modular file structure: declare types in dedicated types file, extract subcomponents into /components.
- Icons strictly from lucide-react.
- Responsive design: mobile-first with desktop density enhancements.
`;
}

/**
 * Helper to download text as a file in the browser.
 */
export function downloadFile(filename: string, content: string, mimeType: string = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
