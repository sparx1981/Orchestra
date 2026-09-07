import { describe, it, expect } from "vitest";
import {
  validateTreeRestructureResponse,
  validateSectionRevisionResponse,
  validateNodeRevisionResponse
} from "../modelResponses";

const node = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, parentId: null, ...extra });

describe("validateTreeRestructureResponse", () => {
  it("passes a well-formed response through unchanged (success path preserved)", () => {
    const parsed = { outcome: "Do X", reasons: ["a", "b"], decisionTree: [node("1", "Root"), node("2", "Child")] };
    const result = validateTreeRestructureResponse(parsed);
    expect(result.outcome).toBe("Do X");
    expect(result.reasons).toEqual(["a", "b"]);
    expect(result.decisionTree).toBe(parsed.decisionTree); // same array, not a copy
  });

  it("returns undefined outcome/reasons when absent, so callers keep their existing fallbacks", () => {
    const result = validateTreeRestructureResponse({ decisionTree: [node("1", "Root")] });
    expect(result.outcome).toBeUndefined();
    expect(result.reasons).toBeUndefined();
  });

  it("treats an empty-string outcome as absent, matching the previous inline check", () => {
    const result = validateTreeRestructureResponse({ outcome: "", decisionTree: [node("1", "Root")] });
    expect(result.outcome).toBeUndefined();
  });

  it("rejects a missing or empty decisionTree with the original error message", () => {
    expect(() => validateTreeRestructureResponse({ decisionTree: [] })).toThrow(/didn't return a usable restructured tree/);
    expect(() => validateTreeRestructureResponse({ decisionTree: "not an array" })).toThrow(/usable restructured tree/);
  });

  it("rejects non-object responses", () => {
    expect(() => validateTreeRestructureResponse(null)).toThrow(/wasn't a JSON object/);
    expect(() => validateTreeRestructureResponse("text")).toThrow(/wasn't a JSON object/);
  });

  it("names the exact node position when a node is structurally unusable", () => {
    const parsed = { decisionTree: [node("1", "Root"), { id: "2" /* no label */ }] };
    expect(() => validateTreeRestructureResponse(parsed)).toThrow(/position 1/);
  });

  it("keeps extra per-node fields (scopingQA, probability, etc.) intact", () => {
    const rich = node("1", "Root", { probability: 60, scopingQA: [{ q: "?", a: "!" }], isSelected: true });
    const result = validateTreeRestructureResponse({ decisionTree: [rich] });
    expect(result.decisionTree[0]).toBe(rich);
  });
});

describe("validateSectionRevisionResponse", () => {
  const fallback = { label: "Section A", text: "original text" };

  it("returns trimmed content on the success path", () => {
    const result = validateSectionRevisionResponse({ content: "  revised text  " }, fallback);
    expect(result).toEqual({ label: "Section A", text: "revised text" });
  });

  it("falls back to the before-text when content is missing or empty (previous inline behaviour)", () => {
    expect(validateSectionRevisionResponse({}, fallback).text).toBe("original text");
    expect(validateSectionRevisionResponse({ content: "   " }, fallback).text).toBe("original text");
    expect(validateSectionRevisionResponse(null, fallback).text).toBe("original text");
  });

  it("never changes the label for a section revision", () => {
    expect(validateSectionRevisionResponse({ content: "x", label: "sneaky" }, fallback).label).toBe("Section A");
  });
});

describe("validateNodeRevisionResponse", () => {
  const fallback = { label: "Old label", text: "old reasoning" };

  it("returns trimmed label and reason on the success path", () => {
    const result = validateNodeRevisionResponse({ label: " New label ", reason: " new reasoning " }, fallback);
    expect(result).toEqual({ label: "New label", text: "new reasoning" });
  });

  it("falls back per-field, exactly as the previous inline checks did", () => {
    expect(validateNodeRevisionResponse({ reason: "only reason changed" }, fallback)).toEqual({ label: "Old label", text: "only reason changed" });
    expect(validateNodeRevisionResponse({ label: "only label changed" }, fallback)).toEqual({ label: "only label changed", text: "old reasoning" });
    expect(validateNodeRevisionResponse({}, fallback)).toEqual(fallback);
    expect(validateNodeRevisionResponse(null, fallback)).toEqual(fallback);
  });
});
