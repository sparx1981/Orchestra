import type { ProductSpec, ProductSpecSection, VibeCodingTool } from "./productSpecTypes";
import { VIBE_CODING_TOOLS } from "./productSpecTypes";

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

  for (const section of spec.sections) {
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
