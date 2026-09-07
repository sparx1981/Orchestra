import { describe, it, expect } from "vitest";
import {
  wouldExceedHistoryStorageLimits,
  HISTORY_SECTION_CONTENT_CAP,
  HISTORY_REVISION_CONTENT_CAP,
} from "../productSpecTypes";
import type { ProductSpec, ProductSpecSection } from "../productSpecTypes";

function makeSection(overrides: Partial<ProductSpecSection> = {}): ProductSpecSection {
  return {
    id: "sec_1",
    key: "overview",
    heading: "Overview",
    category: "strategy",
    authorAgentId: "agent_1",
    authorAgentName: "Agent",
    content: "short content",
    ...overrides,
  };
}

function makeSpec(sections: ProductSpecSection[]): ProductSpec {
  return {
    id: "spec_1",
    title: "Test",
    subtitle: "Test spec",
    targetTool: "general",
    appConcept: "A test app.",
    createdAt: new Date().toISOString(),
    sections,
    groundedSourceCount: 0,
    groundedSourceIds: [],
  };
}

describe("wouldExceedHistoryStorageLimits", () => {
  it("returns false for a small, unrevised spec", () => {
    const spec = makeSpec([makeSection()]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(false);
  });

  it("returns true when a section's own content exceeds the cap", () => {
    const spec = makeSpec([makeSection({ content: "x".repeat(HISTORY_SECTION_CONTENT_CAP + 1) })]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(true);
  });

  it("returns false right at the cap boundary, true just over it", () => {
    const atCap = makeSpec([makeSection({ content: "x".repeat(HISTORY_SECTION_CONTENT_CAP) })]);
    const overCap = makeSpec([makeSection({ content: "x".repeat(HISTORY_SECTION_CONTENT_CAP + 1) })]);
    expect(wouldExceedHistoryStorageLimits(atCap)).toBe(false);
    expect(wouldExceedHistoryStorageLimits(overCap)).toBe(true);
  });

  it("returns true when a revision history entry exceeds its (smaller) cap", () => {
    const spec = makeSpec([
      makeSection({
        content: "short",
        revisionHistory: [{ content: "y".repeat(HISTORY_REVISION_CONTENT_CAP + 1), revisedAt: new Date().toISOString(), reason: "test" }],
      }),
    ]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(true);
  });

  it("returns false when revision history entries are all under their cap", () => {
    const spec = makeSpec([
      makeSection({
        content: "short",
        revisionHistory: [
          { content: "y".repeat(HISTORY_REVISION_CONTENT_CAP - 1), revisedAt: new Date().toISOString(), reason: "test" },
          { content: "z".repeat(100), revisedAt: new Date().toISOString(), reason: "test 2" },
        ],
      }),
    ]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(false);
  });

  it("checks every section, not just the first", () => {
    const spec = makeSpec([
      makeSection({ id: "sec_1", content: "fine" }),
      makeSection({ id: "sec_2", content: "x".repeat(HISTORY_SECTION_CONTENT_CAP + 1) }),
    ]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(true);
  });

  it("handles a spec with no sections without throwing", () => {
    expect(wouldExceedHistoryStorageLimits(makeSpec([]))).toBe(false);
  });
});
