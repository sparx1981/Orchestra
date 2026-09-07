import { describe, it, expect } from "vitest";
import { PROMPT_EXPANSION_SYSTEM_INSTRUCTION, detectRoleAssignmentLanguage } from "../promptExpansion";

describe("PROMPT_EXPANSION_SYSTEM_INSTRUCTION", () => {
  it("explicitly forbids assigning roles, experts, or personas", () => {
    expect(PROMPT_EXPANSION_SYSTEM_INSTRUCTION).toMatch(/MUST NOT assign/i);
    expect(PROMPT_EXPANSION_SYSTEM_INSTRUCTION.toLowerCase()).toContain("role");
  });

  it("instructs conciseness, tying directly to reducing follow-up round-trips", () => {
    expect(PROMPT_EXPANSION_SYSTEM_INSTRUCTION.toLowerCase()).toContain("concise");
    expect(PROMPT_EXPANSION_SYSTEM_INSTRUCTION.toLowerCase()).toMatch(/cheaper|clarification/);
  });

  it("instructs outputting only the rewritten prompt, no preamble", () => {
    expect(PROMPT_EXPANSION_SYSTEM_INSTRUCTION).toMatch(/no preamble/i);
  });
});

describe("detectRoleAssignmentLanguage", () => {
  it("flags direct role assignment", () => {
    expect(detectRoleAssignmentLanguage("As the Legal Counsel, you should consider IP risk.")).toBe(true);
    expect(detectRoleAssignmentLanguage("You are the Ecosystem Strategy Lead for this task.")).toBe(true);
    expect(detectRoleAssignmentLanguage("The Platform Architect should evaluate feasibility.")).toBe(true);
    expect(detectRoleAssignmentLanguage("This should be assigned to the DX Advocate.")).toBe(true);
    expect(detectRoleAssignmentLanguage("Your team must decide the tiering model.")).toBe(true);
  });

  it("does not flag ordinary structured prompt text", () => {
    expect(detectRoleAssignmentLanguage("Evaluate a hybrid tiering model across three developer personas.")).toBe(false);
    expect(detectRoleAssignmentLanguage("Consider Trimble Connect, Tekla Structures, and SketchUp.")).toBe(false);
    expect(detectRoleAssignmentLanguage("As the discussion progresses, revisit the assumptions.")).toBe(false);
  });
});
