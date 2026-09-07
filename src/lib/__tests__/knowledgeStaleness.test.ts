import { describe, it, expect } from "vitest";
import { getNewKnowledgeSourceIds, type KnowledgeSourceLike } from "../knowledgeStaleness";

const source = (id: string, overrides: Partial<KnowledgeSourceLike> = {}): KnowledgeSourceLike => ({
  id,
  content: "some content",
  sourceType: "text",
  ...overrides
});

describe("getNewKnowledgeSourceIds", () => {
  it("returns every source's id when nothing has been grounded yet", () => {
    const result = getNewKnowledgeSourceIds([source("a"), source("b")], undefined);
    expect(result).toEqual(new Set(["a", "b"]));
  });

  it("excludes sources whose id is already in the grounded set", () => {
    const result = getNewKnowledgeSourceIds([source("a"), source("b")], ["a"]);
    expect(result).toEqual(new Set(["b"]));
  });

  it("returns an empty set when every current source is already grounded", () => {
    const result = getNewKnowledgeSourceIds([source("a"), source("b")], ["a", "b"]);
    expect(result.size).toBe(0);
  });

  it("catches an add+remove swap that a plain count comparison would miss", () => {
    // Grounded set had "old"; current files have "old" removed and "new" added. The count
    // is unchanged (1 before, 1 now), but the actual source is genuinely different.
    const result = getNewKnowledgeSourceIds([source("new")], ["old"]);
    expect(result).toEqual(new Set(["new"]));
  });

  it("excludes image sources — they don't count as grounded content", () => {
    const result = getNewKnowledgeSourceIds([source("img", { sourceType: "image" })], undefined);
    expect(result.size).toBe(0);
  });

  it("excludes sources with no content (e.g. a link-only source)", () => {
    const result = getNewKnowledgeSourceIds([source("link", { content: "" })], undefined);
    expect(result.size).toBe(0);
  });

  it("treats an undefined grounded set the same as an empty one", () => {
    expect(getNewKnowledgeSourceIds([source("a")], undefined)).toEqual(getNewKnowledgeSourceIds([source("a")], []));
  });
});
