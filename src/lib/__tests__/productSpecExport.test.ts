import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  parseMarkdownLiteBlocks,
  buildProductSpecDocx,
  buildProductSpecRtf,
  buildProductSpecPdf,
} from "../productSpecExport";
import type { ProductSpec } from "../productSpecTypes";

const sampleSpec: ProductSpec = {
  id: "spec_1",
  title: "Test App",
  subtitle: "A spec used only for export tests",
  targetTool: "general",
  appConcept: "A minimal app for testing exports.",
  createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  sections: [
    {
      id: "sec_1",
      key: "overview",
      heading: "1. Executive Overview",
      category: "strategy",
      authorAgentId: "agent_1",
      authorAgentName: "Product Strategist",
      content: "## Problem Statement\nThis solves a **real** problem.\n\n- First point\n- Second point\n\n```\nconst x = 1;\n```",
    },
  ],
  groundedSourceCount: 0,
  groundedSourceIds: [],
};

describe("buildProductSpecRtf — knowledge sources referenced", () => {
  const specWithSources: ProductSpec = {
    ...sampleSpec,
    groundedSourceCount: 2,
    groundedSourceIds: ["kb_1", "kb_2"],
    groundedSources: [
      { name: "acme/widgets", sourceType: "github", url: "https://github.com/acme/widgets", excerpt: "# Codebase: github.com/acme/widgets (branch: main) 42 total file(s) found in the tree." },
      { name: "legacy-api-notes.pdf", sourceType: "file", excerpt: "The legacy API uses REST with JWT auth and a Postgres backend." },
    ],
  };

  it("lists each source with its type, name, url, and excerpt", () => {
    const rtf = buildProductSpecRtf(specWithSources);
    expect(rtf).toContain("Knowledge Sources Referenced");
    expect(rtf).toContain("GitHub Repository");
    expect(rtf).toContain("acme/widgets");
    expect(rtf).toContain("https://github.com/acme/widgets");
    expect(rtf).toContain("42 total file");
    expect(rtf).toContain("legacy-api-notes.pdf");
    expect(rtf).toContain("Postgres backend");
  });

  it("omits the section entirely when there are no grounded sources", () => {
    const rtf = buildProductSpecRtf(sampleSpec);
    expect(rtf).not.toContain("Knowledge Sources Referenced");
  });

  it("caps the listed sources and notes how many were omitted", () => {
    const many: ProductSpec = {
      ...sampleSpec,
      groundedSources: Array.from({ length: 15 }, (_, i) => ({ name: `file-${i}.txt`, sourceType: "file", excerpt: `excerpt ${i}` })),
    };
    const rtf = buildProductSpecRtf(many);
    expect(rtf).toContain("file-0.txt");
    expect(rtf).toContain("more source(s) not shown");
  });

  it("still renders correctly when a spec has no projectType/groundedSources set at all (older specs)", () => {
    expect(() => buildProductSpecRtf(sampleSpec)).not.toThrow();
  });
});

describe("buildProductSpecDocx / buildProductSpecPdf — knowledge sources referenced", () => {
  const specWithSources: ProductSpec = {
    ...sampleSpec,
    groundedSources: [{ name: "taskflow-legacy.zip", sourceType: "codebase_zip", excerpt: "# Codebase: taskflow-legacy.zip 30 total file(s) found in the tree." }],
  };

  it("renders without throwing in DOCX", async () => {
    const blob = await buildProductSpecDocx(specWithSources);
    expect(blob.size).toBeGreaterThan(500);
  });

  it("renders without throwing in PDF, and produces a readable document", async () => {
    const bytes = await buildProductSpecPdf(specWithSources);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});

describe("parseMarkdownLiteBlocks", () => {
  it("classifies headings, bullets, code, and paragraphs", () => {
    const blocks = parseMarkdownLiteBlocks("## Heading\nA plain paragraph.\n- bullet one\n- bullet two\n```\ncode line\n```");
    expect(blocks).toEqual([
      { type: "h2", text: "Heading" },
      { type: "paragraph", text: "A plain paragraph." },
      { type: "bullet", text: "bullet one" },
      { type: "bullet", text: "bullet two" },
      { type: "code", text: "code line" },
    ]);
  });

  it("flushes an unterminated fenced code block instead of dropping it", () => {
    const blocks = parseMarkdownLiteBlocks("```\nunterminated code");
    expect(blocks).toEqual([{ type: "code", text: "unterminated code" }]);
  });

  it("skips blank lines", () => {
    const blocks = parseMarkdownLiteBlocks("Paragraph one.\n\n\nParagraph two.");
    expect(blocks).toHaveLength(2);
  });

  it("parses a pipe table into header + body rows", () => {
    const blocks = parseMarkdownLiteBlocks("| Tier | Price |\n| --- | --- |\n| Free | $0 |\n| Pro | $10 |");
    expect(blocks).toEqual([
      { type: "table", rows: [["Tier", "Price"], ["Free", "$0"], ["Pro", "$10"]] },
    ]);
  });

  it("does not misread a stray '|'-containing sentence as a table without a separator row", () => {
    const blocks = parseMarkdownLiteBlocks("The value is a | b depending on mode.");
    expect(blocks).toEqual([{ type: "paragraph", text: "The value is a | b depending on mode." }]);
  });

  it("handles a table immediately followed by a normal paragraph", () => {
    const blocks = parseMarkdownLiteBlocks("| A | B |\n| --- | --- |\n| 1 | 2 |\nAfter the table.");
    expect(blocks).toEqual([
      { type: "table", rows: [["A", "B"], ["1", "2"]] },
      { type: "paragraph", text: "After the table." },
    ]);
  });
});

const tableSpec: ProductSpec = {
  ...sampleSpec,
  sections: [
    {
      ...sampleSpec.sections[0],
      content: "Intro paragraph.\n\n| Tier | Price | Notes |\n| --- | --- | --- |\n| Free | $0 | Basic |\n| Pro | $10 | Full |",
    },
  ],
};

describe("buildProductSpecRtf — title page and metadata", () => {
  it("includes the document purpose blurb and a metadata line", () => {
    const rtf = buildProductSpecRtf(sampleSpec);
    expect(rtf).toContain("Document Purpose");
    expect(rtf).toContain("implementation-ready product specification for Test App");
    expect(rtf).toContain("A minimal app for testing exports.");
    expect(rtf).toContain("Generated:");
    expect(rtf).toContain("Target Tool:");
    expect(rtf).toContain("New Application"); // default projectType
  });

  it("shows the update project type and grounded codebase name when set", () => {
    const rtf = buildProductSpecRtf({ ...sampleSpec, projectType: "update", groundedOnExistingCodebase: "legacy-app.zip" });
    expect(rtf).toContain("Update to Existing App");
    expect(rtf).toContain("Grounded On:");
    expect(rtf).toContain("legacy-app.zip");
  });

  it("renders a real bordered table rather than a flattened line dump", () => {
    const rtf = buildProductSpecRtf(tableSpec);
    expect(rtf).toContain("\\trowd");
    expect(rtf).toContain("\\cell");
    expect(rtf).toContain("Tier");
    expect(rtf).toContain("Free");
  });
});

describe("buildProductSpecRtf", () => {
  it("produces a balanced RTF document containing the title and section content", () => {
    const rtf = buildProductSpecRtf(sampleSpec);
    expect(rtf.startsWith("{\\rtf1")).toBe(true);
    expect(rtf.endsWith("}")).toBe(true);
    expect(rtf).toContain("Test App");
    expect(rtf).toContain("Executive Overview");
    expect(rtf).toContain("Product Strategist");
    // Bold markers are stripped in RTF's plain-text fallback rather than printed literally
    expect(rtf).not.toContain("**real**");
    expect(rtf).toContain("real");
  });

  it("escapes RTF-significant braces so the document stays well-formed", () => {
    const spec: ProductSpec = { ...sampleSpec, title: "Curly {braces} test" };
    const rtf = buildProductSpecRtf(spec);
    expect(rtf).toContain("\\{braces\\}");
  });
});

describe("buildProductSpecPdf", () => {
  it("produces a well-formed PDF a PDF parser can read back", async () => {
    const bytes = await buildProductSpecPdf(sampleSpec);
    expect(bytes.length).toBeGreaterThan(500);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("handles a spec with many long sections by paginating", async () => {
    const manySections = Array.from({ length: 20 }, (_, i) => ({
      id: `sec_${i}`,
      key: `k${i}`,
      heading: `Section ${i}`,
      category: "strategy" as const,
      authorAgentId: "a",
      authorAgentName: "Agent",
      content: Array.from({ length: 15 }, () => "A reasonably long paragraph of filler text meant to consume real vertical space on the page.").join("\n\n"),
    }));
    const bytes = await buildProductSpecPdf({ ...sampleSpec, sections: manySections });
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });

  it("renders a spec containing a markdown table without throwing, on its own title page plus content page(s)", async () => {
    const bytes = await buildProductSpecPdf(tableSpec);
    const reloaded = await PDFDocument.load(bytes);
    // Title page is forced onto its own page, so a single short section still yields 2+ pages.
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(2);
  });
});

describe("buildProductSpecDocx", () => {
  it("produces a non-empty DOCX blob with the expected zip signature", async () => {
    const blob = await buildProductSpecDocx(sampleSpec);
    expect(blob.size).toBeGreaterThan(500);
    // .docx is a zip container — first two bytes are "PK"
    const buf = new Uint8Array(await blob.arrayBuffer());
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
  });

  it("renders a spec containing a markdown table without throwing", async () => {
    const blob = await buildProductSpecDocx(tableSpec);
    expect(blob.size).toBeGreaterThan(500);
    const buf = new Uint8Array(await blob.arrayBuffer());
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });
});
