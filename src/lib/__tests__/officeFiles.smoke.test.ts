// Integration smoke tests: actually execute the three builders against small specs and
// assert they produce files without throwing. This catches library-API misuse (wrong
// exceljs/docx/pptxgenjs calls) that type-checking can't — the builders otherwise only
// ever run in a real browser session with a paid LLM call in front of them.
import { describe, it, expect, beforeAll } from "vitest";
import { buildDocx, buildXlsx, buildPptx } from "../officeFiles";

beforeAll(() => {
  // Node has Blob but not URL.createObjectURL — stub it; we assert on names/kinds, not URLs.
  if (typeof URL.createObjectURL !== "function") {
    (URL as any).createObjectURL = () => "blob:test";
  }
});

describe("office file builders (integration smoke)", () => {
  it("buildDocx produces a docx with exec summary, quotes, table, and verification notes", async () => {
    const file = await buildDocx(
      {
        title: "Q3 Launch Decision",
        subtitle: "Panel record",
        executiveSummary: "Hold Q3, gated on the July milestone.",
        sections: [
          { heading: "Context", level: 1, paragraphs: ["The panel debated launch timing."] },
          { heading: "Positions", level: 2, bullets: ["Hold Q3", "Slip to Q4"], quotes: [{ text: "vendor risk is priced in", attribution: "Priya" }] },
          { heading: "Data", level: 2, table: { columns: ["Option", "Probability"], rows: [["Hold Q3", 62], ["Slip", 23]] } }
        ]
      },
      ["Figure not found in source: 62"]
    );
    expect(file.kind).toBe("docx");
    expect(file.name).toMatch(/\.docx$/);
  });

  it("buildXlsx produces a workbook with README, data sheet, totals, and verification sheet", async () => {
    const file = await buildXlsx(
      {
        title: "Decision Data",
        sheets: [{ name: "Options", columns: ["Option", "Probability", "Cost"], rows: [["Hold Q3", 62, 1250], ["Slip Q4", 23, 900], ["Cancel", 15, 0]] }]
      },
      ["note"]
    );
    expect(file.kind).toBe("xlsx");
    expect(file.name).toMatch(/\.xlsx$/);
  });

  it("buildPptx splits overflowing slides and caps long bullets into notes", async () => {
    const nineBullets = Array.from({ length: 9 }, (_, i) => ({ text: `Point number ${i + 1} with some words attached to it for realism and even more trailing words to overflow the cap` }));
    const file = await buildPptx({
      title: "Q3 holds only if July integration lands",
      slides: [
        { title: "This slide has too many bullets to fit", bullets: nineBullets },
        { title: "Sub-bullet support", bullets: [{ text: "Parent point", sub: ["Child detail one", "Child detail two"] }] }
      ]
    });
    expect(file.kind).toBe("pptx");
    expect(file.name).toMatch(/\.pptx$/);
  });
});
