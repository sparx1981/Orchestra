import { describe, it, expect } from "vitest";
import {
  validateDocSpec,
  validateDeckSpec,
  validateSpreadsheetSpec,
  normalizeNumber,
  extractSignificantNumbers,
  verifySpecAgainstSource,
  checkClaimsAgainstKnowledgeBase,
  checkClaimsAgainstNumbers,
  findNumberSpans
} from "../fileVerification";

describe("validateDocSpec", () => {
  it("accepts a minimal valid spec and normalises it", () => {
    const r = validateDocSpec({ title: " Report ", sections: [{ heading: "A", paragraphs: ["p1"] }] });
    expect(r.ok).toBe(true);
    expect(r.spec!.title).toBe("Report");
    expect(r.spec!.sections[0].level).toBe(1);
  });
  it("rejects missing title and empty sections", () => {
    expect(validateDocSpec({ sections: [] }).ok).toBe(false);
    expect(validateDocSpec({ title: "T" }).ok).toBe(false);
  });
  it("rejects a section with no content", () => {
    const r = validateDocSpec({ title: "T", sections: [{ heading: "Empty" }] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toContain("no content");
  });
  it("keeps quotes and tables when present", () => {
    const r = validateDocSpec({
      title: "T",
      sections: [{ heading: "H", quotes: [{ text: "said something", attribution: "Marcus" }], table: { columns: ["A"], rows: [["x"]] } }]
    });
    expect(r.ok).toBe(true);
    expect(r.spec!.sections[0].quotes![0].attribution).toBe("Marcus");
    expect(r.spec!.sections[0].table!.rows[0][0]).toBe("x");
  });
});

describe("validateDeckSpec", () => {
  it("accepts string bullets and object bullets with subs", () => {
    const r = validateDeckSpec({ title: "Deck", slides: [{ title: "S1", bullets: ["a", { text: "b", sub: ["b1"] }] }] });
    expect(r.ok).toBe(true);
    expect(r.spec!.slides[0].bullets[0].text).toBe("a");
    expect(r.spec!.slides[0].bullets[1].sub).toEqual(["b1"]);
  });
  it("rejects a slide without bullets", () => {
    expect(validateDeckSpec({ title: "D", slides: [{ title: "S" }] }).ok).toBe(false);
  });
});

describe("validateSpreadsheetSpec", () => {
  it("pads short rows and trims long rows to the column count", () => {
    const r = validateSpreadsheetSpec({ title: "S", sheets: [{ name: "Data", columns: ["A", "B"], rows: [["only"], ["x", "y", "extra"]] }] });
    expect(r.ok).toBe(true);
    expect(r.spec!.sheets[0].rows[0]).toEqual(["only", ""]);
    expect(r.spec!.sheets[0].rows[1]).toEqual(["x", "y"]);
  });
  it("truncates sheet names to Excel's 31-char limit", () => {
    const longName = "x".repeat(50);
    const r = validateSpreadsheetSpec({ title: "S", sheets: [{ name: longName, columns: ["A"], rows: [["v"]] }] });
    expect(r.spec!.sheets[0].name.length).toBe(31);
  });
});

describe("number normalisation and extraction", () => {
  it("normalises grouping, currency, percent, and trailing zeros", () => {
    expect(normalizeNumber("1,250.50")).toBe("1250.5");
    expect(normalizeNumber("$3,000")).toBe("3000");
    expect(normalizeNumber("47%")).toBe("47");
  });
  it("ignores small structural integers but keeps figures", () => {
    const nums = extractSignificantNumbers("Option 3 of 5: revenue was $1,250 with 47% margin and a 3.7x multiple");
    expect(nums.has("3")).toBe(false);
    expect(nums.has("5")).toBe(false);
    expect(nums.has("1250")).toBe(true);
    expect(nums.has("47")).toBe(true);
    expect(nums.has("3.7")).toBe(true);
  });
});

describe("findNumberSpans", () => {
  it("locates the exact position of a plain number in prose", () => {
    const text = "This would cost roughly 624 dollars in total.";
    const spans = findNumberSpans(text);
    expect(spans).toHaveLength(1);
    expect(text.slice(spans[0].start, spans[0].end)).toBe("624");
    expect(spans[0].normalized).toBe("624");
  });

  it("locates multiple numbers with correct individual positions", () => {
    const text = "Revenue grew from $1,250 to $1,800 this quarter.";
    const spans = findNumberSpans(text);
    expect(spans.map(s => text.slice(s.start, s.end))).toEqual(["$1,250", "$1,800"]);
  });

  it("ignores insignificant small numbers, matching extractSignificantNumbers' filter", () => {
    const text = "There are 3 options here, at a 47% margin.";
    const spans = findNumberSpans(text);
    // "3" alone is below the significance threshold (no symbol, <3 digits, no decimal);
    // "47%" carries a symbol so it counts.
    expect(spans.map(s => s.raw)).toEqual(["47%"]);
  });
});

describe("checkClaimsAgainstKnowledgeBase", () => {
  const kb = "The Q3 budget is $50,000 with a 12% contingency.";
  it("returns null when there is no knowledge base to check against", () => {
    expect(checkClaimsAgainstKnowledgeBase("The cost is $9,999.", "")).toBeNull();
  });
  it("returns clean when the message has no significant numbers", () => {
    const r = checkClaimsAgainstKnowledgeBase("This seems like a reasonable approach.", kb);
    expect(r?.hasUnverifiedClaims).toBe(false);
  });
  it("passes when every figure traces to the knowledge base", () => {
    const r = checkClaimsAgainstKnowledgeBase("With the $50,000 budget and 12% contingency, this is feasible.", kb);
    expect(r?.hasUnverifiedClaims).toBe(false);
  });
  it("flags a figure that doesn't appear in the knowledge base", () => {
    const r = checkClaimsAgainstKnowledgeBase("This would cost roughly $75,000.", kb);
    expect(r?.hasUnverifiedClaims).toBe(true);
    expect(r?.unverifiedNumbers).toContain("75000");
  });
});

describe("checkClaimsAgainstNumbers", () => {
  const kbNumbers = extractSignificantNumbers("The Q3 budget is $50,000 with a 12% contingency.");

  it("returns null when sourceNumbers is null (the 'no knowledge base' case)", () => {
    expect(checkClaimsAgainstNumbers("The cost is $9,999.", null)).toBeNull();
  });

  it("returns clean when the message has no significant numbers", () => {
    const r = checkClaimsAgainstNumbers("This seems like a reasonable approach.", kbNumbers);
    expect(r?.hasUnverifiedClaims).toBe(false);
  });

  it("passes when every figure traces to the pre-extracted source numbers", () => {
    const r = checkClaimsAgainstNumbers("With the $50,000 budget and 12% contingency, this is feasible.", kbNumbers);
    expect(r?.hasUnverifiedClaims).toBe(false);
  });

  it("flags a figure absent from the pre-extracted source numbers", () => {
    const r = checkClaimsAgainstNumbers("This would cost roughly $75,000.", kbNumbers);
    expect(r?.hasUnverifiedClaims).toBe(true);
    expect(r?.unverifiedNumbers).toContain("75000");
  });

  it("produces identical results to checkClaimsAgainstKnowledgeBase given the same corpus", () => {
    const kb = "The Q3 budget is $50,000 with a 12% contingency.";
    const message = "This would cost roughly $75,000, well over the 12% contingency.";
    const viaWrapper = checkClaimsAgainstKnowledgeBase(message, kb);
    const viaPrimitive = checkClaimsAgainstNumbers(message, extractSignificantNumbers(kb));
    expect(viaPrimitive).toEqual(viaWrapper);
  });

  it("treats an empty-but-present corpus as zero source numbers, not as 'no knowledge base'", () => {
    // A corpus with no significant numbers should flag message numbers as unverified —
    // unlike passing null, which means "don't check at all".
    const r = checkClaimsAgainstNumbers("The cost is $9,999.", new Set());
    expect(r?.hasUnverifiedClaims).toBe(true);
  });
});

describe("verifySpecAgainstSource", () => {
  const source = 'Revenue grew to $1,250 (47% margin). Priya said "the vendor risk is now fully priced into the plan".';
  it("passes when every figure and quote appears in the source", () => {
    const spec = { title: "T", sections: [{ heading: "H", paragraphs: ['Margin reached 47% on revenue of 1,250. As Priya put it, "the vendor risk is now fully priced into the plan".'] }] };
    const r = verifySpecAgainstSource("docx", validateDocSpec(spec).spec!, source);
    expect(r.clean).toBe(true);
  });
  it("flags invented numbers", () => {
    const spec = { title: "T", sections: [{ heading: "H", paragraphs: ["Margin reached 62% on revenue of 9,999."] }] };
    const r = verifySpecAgainstSource("docx", validateDocSpec(spec).spec!, source);
    expect(r.clean).toBe(false);
    expect(r.unverifiedNumbers).toContain("9999");
  });
  it("flags fabricated quotations but tolerates short scare-quotes", () => {
    const spec = { title: "T", sections: [{ heading: "H", paragraphs: ['Priya called it "fast". She added "we should abandon the entire integration and start again from zero".'] }] };
    const r = verifySpecAgainstSource("docx", validateDocSpec(spec).spec!, source);
    expect(r.unverifiedQuotes.length).toBe(1);
  });
  it("verifies numbers inside xlsx cells", () => {
    const spec = validateSpreadsheetSpec({ title: "S", sheets: [{ name: "D", columns: ["Metric", "Value"], rows: [["Revenue", 1250], ["Margin %", 47]] }] }).spec!;
    expect(verifySpecAgainstSource("xlsx", spec, source).clean).toBe(true);
    const bad = validateSpreadsheetSpec({ title: "S", sheets: [{ name: "D", columns: ["Metric", "Value"], rows: [["Revenue", 8888]] }] }).spec!;
    expect(verifySpecAgainstSource("xlsx", bad, source).unverifiedNumbers).toContain("8888");
  });
});
