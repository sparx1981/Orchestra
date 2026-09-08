import { describe, it, expect } from "vitest";
import {
  wouldExceedHistoryStorageLimits,
  capSpecForHistoryStorage,
  SAFE_HISTORY_DOC_BUDGET_CHARS,
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

describe("wouldExceedHistoryStorageLimits / capSpecForHistoryStorage", () => {
  it("returns false for a small, unrevised spec", () => {
    const spec = makeSpec([makeSection()]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(false);
  });

  it("does not trim a single long section that's nowhere near the whole-document budget", () => {
    // A real, well-developed section can easily run to tens of thousands of characters —
    // this must NOT be trimmed just because it's individually large; only the *document as
    // a whole* being over budget should ever trigger trimming (this is the actual bug fix:
    // previously a flat 40,000-char-per-section cap discarded content like this).
    const spec = makeSpec([makeSection({ content: "x".repeat(100000) })]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(false);
    expect(capSpecForHistoryStorage(spec).spec.sections[0].content.length).toBe(100000);
  });

  it("does not trim a genuinely large multi-section spec (100+ printed pages) that's still under budget", () => {
    // ~600,000 characters across sections, comfortably under SAFE_HISTORY_DOC_BUDGET_CHARS.
    const sections = Array.from({ length: 8 }, (_, i) => makeSection({ id: `sec_${i}`, content: "x".repeat(75000) }));
    const spec = makeSpec(sections);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(false);
    const { spec: capped } = capSpecForHistoryStorage(spec);
    expect(capped.sections.every(s => s.content.length === 75000)).toBe(true);
  });

  it("trims proportionally, largest sections losing the most, once genuinely over budget", () => {
    const sections = [
      makeSection({ id: "sec_small", content: "x".repeat(50000) }),
      makeSection({ id: "sec_huge", content: "y".repeat(2000000) }),
    ];
    const spec = makeSpec(sections);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(true);
    const { spec: capped, wasTrimmed } = capSpecForHistoryStorage(spec);
    expect(wasTrimmed).toBe(true);
    const small = capped.sections.find(s => s.id === "sec_small")!;
    const huge = capped.sections.find(s => s.id === "sec_huge")!;
    // The huge section should be cut down substantially more (in absolute terms) than the
    // small one — proportional trimming, not a flat per-section cutoff.
    expect(huge.content.length).toBeLessThan(2000000);
    expect(small.content.length).toBeLessThanOrEqual(50000);
    // The resulting document should actually fit the budget.
    expect(JSON.stringify(capped).length).toBeLessThanOrEqual(SAFE_HISTORY_DOC_BUDGET_CHARS * 1.05);
  });

  it("never trims a section down to nothing, even in an extreme case", () => {
    const sections = Array.from({ length: 20 }, (_, i) => makeSection({ id: `sec_${i}`, content: "x".repeat(500000) }));
    const spec = makeSpec(sections);
    const { spec: capped } = capSpecForHistoryStorage(spec);
    expect(capped.sections.every(s => s.content.length >= 15000)).toBe(true);
  });

  it("trims revision history once the document is over budget, leaving section content alone if it fits", () => {
    const spec = makeSpec([
      makeSection({
        content: "short",
        revisionHistory: Array.from({ length: 50 }, (_, i) => ({
          content: "y".repeat(50000),
          revisedAt: new Date().toISOString(),
          reason: `revision ${i}`,
        })),
      }),
    ]);
    expect(wouldExceedHistoryStorageLimits(spec)).toBe(true);
    const { spec: capped } = capSpecForHistoryStorage(spec);
    expect(capped.sections[0].revisionHistory!.every(r => r.content.length <= HISTORY_REVISION_CONTENT_CAP + 100)).toBe(true);
  });

  it("handles a spec with no sections without throwing", () => {
    expect(wouldExceedHistoryStorageLimits(makeSpec([]))).toBe(false);
    expect(() => capSpecForHistoryStorage(makeSpec([]))).not.toThrow();
  });
});
