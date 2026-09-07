import { describe, it, expect } from "vitest";
import { extractJson, truncateText } from "../textUtils";

describe("extractJson", () => {
  it("parses a clean JSON object", () => {
    expect(extractJson('{"a": 1, "b": "two"}')).toEqual({ a: 1, b: "two" });
  });

  it("strips markdown json fences", () => {
    expect(extractJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("strips bare markdown fences without a language tag", () => {
    expect(extractJson('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("ignores trailing prose after the JSON object", () => {
    expect(extractJson('{"a": 1} — hope that helps!')).toEqual({ a: 1 });
  });

  it("ignores leading prose before the JSON object", () => {
    expect(extractJson('Sure, here you go:\n{"a": 1}')).toEqual({ a: 1 });
  });

  it("handles nested objects correctly (does not stop at the first inner '}')", () => {
    const raw = '{"outer": {"inner": 1}, "sibling": 2}';
    expect(extractJson(raw)).toEqual({ outer: { inner: 1 }, sibling: 2 });
  });

  it("does not get confused by braces inside string values", () => {
    const raw = '{"text": "this has a { brace } inside a string", "n": 5}';
    expect(extractJson(raw)).toEqual({ text: "this has a { brace } inside a string", n: 5 });
  });

  it("does not get confused by escaped quotes inside strings", () => {
    const raw = '{"text": "she said \\"hello {world}\\""}';
    expect(extractJson(raw)).toEqual({ text: 'she said "hello {world}"' });
  });

  it("handles arrays and deeper nesting", () => {
    const raw = '{"items": [{"id": "n1", "parentId": null}, {"id": "n2", "parentId": "n1"}]}';
    expect(extractJson(raw)).toEqual({
      items: [
        { id: "n1", parentId: null },
        { id: "n2", parentId: "n1" }
      ]
    });
  });

  it("throws when there is no JSON object at all", () => {
    expect(() => extractJson("just plain text, no JSON here")).toThrow();
  });

  it("throws when braces never close", () => {
    expect(() => extractJson('{"a": 1, "b": 2')).toThrow();
  });

  it("uses the first complete JSON object when multiple appear", () => {
    // Bracket-depth scanning should close the object as soon as depth returns to 0,
    // not extend to a second, unrelated object later in the text.
    const raw = '{"first": true} some text {"second": true}';
    expect(extractJson(raw)).toEqual({ first: true });
  });
});

describe("truncateText", () => {
  it("returns text unchanged when under the limit", () => {
    expect(truncateText("hello", 100)).toBe("hello");
  });

  it("returns text unchanged when exactly at the limit", () => {
    expect(truncateText("hello", 5)).toBe("hello");
  });

  it("truncates and appends a note when over the limit", () => {
    const result = truncateText("hello world", 5);
    expect(result.startsWith("hello")).toBe(true);
    expect(result).toContain("truncated");
    expect(result).toContain("6 more characters omitted");
  });

  it("handles empty strings", () => {
    expect(truncateText("", 10)).toBe("");
  });
});
