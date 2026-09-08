// src/lib/briefBridgePrompt.ts
//
// Deterministic prompt synthesis: turns a structured Enquiry into a single Markdown
// brief suitable for seeding the Product tab's prompt (and, from there, an AI coding
// tool). Deliberately has no model call in it — same enquiry + same options always
// produces the same text, which matters because this is the thing developers will
// review and hand off to a client relationship.

import type { CustomQuestion, Enquiry, IntakeFormConfig, PipeToPromptOptions } from "@/src/types/briefBridge";
import { BUDGET_TIER_LABELS, TARGET_LAUNCH_LABELS } from "@/src/types/briefBridge";

const TOOL_LABELS: Record<PipeToPromptOptions["tool"], string> = {
  cursor: "Cursor",
  lovable: "Lovable",
  claude_code: "Claude Code",
  v0: "v0",
  generic: "a general-purpose AI coding tool",
};

/**
 * Neutralizes prompt-injection attempts and Markdown structure-hijacking in
 * free-text a client typed into a public, unauthenticated form. This text is about
 * to be concatenated into a system-style prompt, so it must not be able to open a
 * fenced code block, fake a Markdown heading, or contain a line that reads like an
 * instruction to the model ("ignore previous instructions", etc.) — it should read
 * as *quoted client input*, never as instructions in its own right.
 */
export function sanitizeClientText(raw: string, maxLength = 4000): string {
  if (!raw) return "";
  let text = String(raw).slice(0, maxLength);
  // Strip control characters (except newline/tab).
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  // Neutralize fenced code blocks so client text can't escape its quoted context.
  text = text.replace(/```/g, "\u200b`\u200b`\u200b`");
  // Demote any line that looks like a Markdown heading or a fresh instruction block —
  // client text is a quoted answer, not a new section of the prompt.
  text = text
    .split("\n")
    .map(line => {
      const trimmed = line.trimStart();
      if (/^#{1,6}\s/.test(trimmed)) return line.replace(/^(\s*)#+/, "$1");
      if (/^(system:|assistant:|ignore (all|previous)\s+instructions)/i.test(trimmed)) {
        return `> ${line}`;
      }
      return line;
    })
    .join("\n");
  return text.trim();
}

function formatCustomAnswer(question: CustomQuestion, value: unknown): string {
  if (value === undefined || value === null || value === "") return "_Not answered_";
  if (Array.isArray(value)) return value.map(v => sanitizeClientText(String(v), 200)).join(", ") || "_Not answered_";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return sanitizeClientText(String(value), 1000);
}

export function compileEnquiryToPrompt(
  enquiry: Enquiry,
  config: Pick<IntakeFormConfig, "customQuestions"> | null,
  options: PipeToPromptOptions
): string {
  const lines: string[] = [];

  if (options.customPreamble?.trim()) {
    lines.push(sanitizeClientText(options.customPreamble.trim(), 1000), "");
  }

  lines.push(`# Product Specification Brief: ${sanitizeClientText(enquiry.projectTitle, 200) || "Untitled Project"}`, "");
  lines.push(`_Compiled from a BriefBridge client intake for ${TOOL_LABELS[options.tool]}._`, "");

  lines.push("## 1. Client & Context");
  lines.push(`- **Client:** ${sanitizeClientText(enquiry.clientName, 200)}`);
  if (enquiry.clientCompany) lines.push(`- **Company:** ${sanitizeClientText(enquiry.clientCompany, 200)}`);
  lines.push(`- **Contact:** ${sanitizeClientText(enquiry.clientEmail, 200)}`);
  if (options.includeBudgetTimeline) {
    lines.push(`- **Target launch:** ${TARGET_LAUNCH_LABELS[enquiry.targetLaunch] || enquiry.targetLaunch}`);
    lines.push(`- **Budget tier:** ${BUDGET_TIER_LABELS[enquiry.budgetTier] || enquiry.budgetTier}`);
  }
  lines.push("");

  lines.push("## 2. Project Overview");
  lines.push(sanitizeClientText(enquiry.projectDescription, 6000) || "_No description provided._");
  lines.push("");

  if (options.includeTechStack && enquiry.techPreferences.length > 0) {
    lines.push("## 3. Client Technology Preferences");
    lines.push("These are preferences stated by the client, not firm requirements — weigh them against what's actually the right call:");
    for (const pref of enquiry.techPreferences) lines.push(`- ${sanitizeClientText(pref, 200)}`);
    lines.push("");
  }

  if (options.includeDesignAssets && enquiry.assetLinks.length > 0) {
    lines.push("## 4. Reference & Asset Links");
    for (const link of enquiry.assetLinks) lines.push(`- ${sanitizeClientText(link, 500)}`);
    lines.push("");
  }

  const questions = config?.customQuestions ?? [];
  if (questions.length > 0) {
    lines.push("## 5. Additional Client Answers");
    for (const q of questions) {
      const answer = enquiry.customAnswers?.[q.id];
      lines.push(`- **${sanitizeClientText(q.label, 200)}:** ${formatCustomAnswer(q, answer)}`);
    }
    lines.push("");
  }

  if (enquiry.internalNotes?.trim()) {
    lines.push("## 6. Internal Notes (not client-visible)");
    lines.push(sanitizeClientText(enquiry.internalNotes, 2000));
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `Use the above as the client's brief. Ask clarifying questions where the brief is ambiguous rather than guessing, and propose a scope that fits the stated budget tier and timeline.`
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
