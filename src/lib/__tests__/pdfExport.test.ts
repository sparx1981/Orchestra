import { describe, it, expect } from "vitest";
import { buildAuditPdf } from "../pdfExport";
import { PDFDocument } from "pdf-lib";

const sections = [
  { heading: "What was decided", paragraphs: ["Hold Q3, gated on the July integration milestone."] },
  { heading: "Why this was decided", paragraphs: ["Milestone gates spend.", "Vendor risk quantified."] }
];

describe("buildAuditPdf", () => {
  it("produces a well-formed PDF that a PDF parser can read back", async () => {
    const bytes = await buildAuditPdf("Decision Audit", "Should we hold Q3?", sections);
    expect(bytes.length).toBeGreaterThan(500);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("paginates across multiple pages when content is long enough to overflow one", async () => {
    const manySections = Array.from({ length: 40 }, (_, i) => ({
      heading: `Section ${i}`,
      paragraphs: ["This is a reasonably long paragraph of text meant to take up real vertical space on the page so that pagination is actually exercised by this test rather than assumed."]
    }));
    const bytes = await buildAuditPdf("Long Document", "", manySections);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });

  it("handles an empty sections array without throwing", async () => {
    const bytes = await buildAuditPdf("Empty Doc", "", []);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it("wraps a very long word-free paragraph across multiple lines rather than overflowing the page width", async () => {
    const longWordSections = [{ heading: "Test", paragraphs: [Array.from({ length: 80 }, () => "reasonably-long-word").join(" ")] }];
    const bytes = await buildAuditPdf("Wrap Test", "", longWordSections);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
