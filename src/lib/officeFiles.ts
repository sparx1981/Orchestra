// Generates downloadable Word / Excel / PowerPoint files from structured content.
// Heavy libraries (docx, exceljs, pptxgenjs) are only ever loaded when a file is actually
// requested (dynamic import), so they never add weight to the app's main bundle.
// All builders accept an optional verificationNotes list — grounding-check findings that
// get embedded into the artifact itself (docx appendix / xlsx sheet / pptx notes) so the
// audit trail travels with the file rather than living only in the app's debug panel.

export type OfficeKind = "docx" | "xlsx" | "pptx";

/**
 * Detects an explicit request to create a specific office file type from free text (the
 * initial task, or a Chat With The Team message). Used for auto-detect; the "Create File"
 * button always works regardless of what was typed.
 *
 * Unambiguous tokens (file extensions, "powerpoint", "word document") trigger on their own.
 * Generic format nouns ("presentation", "spreadsheet", "worksheet", "slides") are common in
 * ordinary writing ("the presentation of the results should be clear") and only trigger
 * alongside a nearby create-ish verb, to avoid firing an unwanted paid generation.
 */
export function detectFileRequest(text: string): OfficeKind | null {
  const t = text.toLowerCase();
  const hasCreateVerb = /\b(create|make|generate|build|draft|produce|write up|writes? this up|turn (this|it|these) into|export (this|it) as|save (this|it) as|convert (this|it) (into|to))\b/.test(t);

  if (/\bpptx\b|\bpowerpoint\b/.test(t)) return "pptx";
  if (/\bxlsx\b/.test(t)) return "xlsx";
  if (/\bdocx\b|\bword doc(ument)?\b/.test(t)) return "docx";

  if (hasCreateVerb) {
    if (/\b(slide ?deck|slides?|presentation)\b/.test(t)) return "pptx";
    if (/\b(excel|spreadsheet|worksheet)\b/.test(t)) return "xlsx";
  }
  return null;
}


export interface DocSection {
  heading: string;
  level?: 1 | 2 | 3;
  paragraphs?: string[];
  bullets?: string[];
  /** Direct quotations (e.g. from the panel transcript), rendered as attributed blockquotes. */
  quotes?: { text: string; attribution?: string }[];
  /** Genuinely 2-dimensional data, rendered as a real Word table rather than aligned text. */
  table?: { columns: string[]; rows: (string | number)[][] };
}
export interface DocSpec {
  title: string;
  subtitle?: string;
  /** Auto-required at generation time for documents with more than 3 sections. */
  executiveSummary?: string;
  sections: DocSection[];
}

export interface SheetSpec {
  name: string;
  columns: string[];
  rows: (string | number)[][];
}
export interface SpreadsheetSpec {
  title: string;
  sheets: SheetSpec[];
}

export interface SlideSpec {
  title: string;
  /** Two-level bullets: sub items render indented at a smaller size. */
  bullets: { text: string; sub?: string[] }[];
  notes?: string;
}
export interface DeckSpec {
  title: string;
  subtitle?: string;
  slides: SlideSpec[];
}

export interface GeneratedFile {
  kind: OfficeKind;
  name: string;
  url: string; // object URL — caller should revoke it when no longer needed
}

const BRAND_COLOR = "2563EB"; // matches the app's blue-600 accent, hex without '#'

function safeFilename(title: string, ext: string): string {
  const base = (title || "Document").replace(/[^\w\-() ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 80) || "Document";
  return `${base}.${ext}`;
}

export async function buildDocx(spec: DocSpec, verificationNotes?: string[]): Promise<GeneratedFile> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, Footer, PageNumber } = await import("docx");

  const children: any[] = [
    new Paragraph({
      text: spec.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 }
    })
  ];
  if (spec.subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: spec.subtitle, italics: true, color: "666666" })],
        spacing: { after: 300 }
      })
    );
  }
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_COLOR } },
      spacing: { after: 300 }
    })
  );

  // Executive summary: a reader-first block before the body, visually set apart.
  if (spec.executiveSummary) {
    children.push(new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1, spacing: { before: 120, after: 120 } }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: spec.executiveSummary, italics: false })],
        spacing: { after: 300 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_COLOR } },
        indent: { left: 240 }
      })
    );
  }

  // Computed multilevel heading numbers (1. / 1.1 / 1.1.1) — deterministic text prefixes
  // rather than Word field numbering, so what you see in any viewer is what compiled.
  const counters = [0, 0, 0];
  const numberFor = (level: 1 | 2 | 3): string => {
    counters[level - 1] += 1;
    for (let i = level; i < 3; i++) counters[i] = 0;
    return counters.slice(0, level).join(".") + ".";
  };

  for (const section of spec.sections) {
    const level = (section.level === 3 ? 3 : section.level === 2 ? 2 : 1) as 1 | 2 | 3;
    const headingLevel = level === 3 ? HeadingLevel.HEADING_3 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;
    children.push(new Paragraph({ text: `${numberFor(level)} ${section.heading}`, heading: headingLevel, spacing: { before: 240, after: 120 } }));
    for (const p of section.paragraphs || []) {
      children.push(new Paragraph({ children: [new TextRun({ text: p })], spacing: { after: 160 }, alignment: AlignmentType.LEFT }));
    }
    for (const q of section.quotes || []) {
      // Attributed blockquote: indented, brand-colour left border, italic text.
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `“${q.text}”`, italics: true, color: "334155" })],
          indent: { left: 480 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_COLOR } },
          spacing: { after: q.attribution ? 40 : 160 }
        })
      );
      if (q.attribution) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `— ${q.attribution}`, color: "64748B", size: 20 })],
            indent: { left: 480 },
            spacing: { after: 160 }
          })
        );
      }
    }
    if (section.table && section.table.columns.length > 0) {
      const headerRow = new TableRow({
        children: section.table.columns.map(col => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, color: "FFFFFF" })] })],
          shading: { fill: BRAND_COLOR }
        }))
      });
      const dataRows = section.table.rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({ children: [new Paragraph({ text: String(cell) })] }))
      }));
      children.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ spacing: { after: 160 } }));
    }
    for (const b of section.bullets || []) {
      children.push(new Paragraph({ text: b, bullet: { level: 0 }, spacing: { after: 80 } }));
    }
  }

  // Verification appendix: grounding-check findings travel with the artifact.
  if (verificationNotes && verificationNotes.length > 0) {
    children.push(new Paragraph({ text: "Verification Notes", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 } }));
    for (const note of verificationNotes) {
      children.push(new Paragraph({ text: note, bullet: { level: 0 }, spacing: { after: 60 } }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } } // 11pt
      }
    },
    sections: [{
      properties: {},
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Generated by Orchestra · ", color: "94A3B8", size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], color: "94A3B8", size: 16 })
              ]
            })
          ]
        })
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  return { kind: "docx", name: safeFilename(spec.title, "docx"), url: URL.createObjectURL(blob) };
}

export async function buildXlsx(spec: SpreadsheetSpec, verificationNotes?: string[]): Promise<GeneratedFile> {
  // exceljs (replacing write-excel-file) unlocks the analytical features a spreadsheet
  // actually needs to stay useful after the user edits it: real formulas, frozen header
  // rows, autofilters, and number formats — none of which write-excel-file supports.
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Orchestra";
  wb.created = new Date();

  // Sheet 1 — README: what this workbook is, when it was generated, and a sheet index.
  const readme = wb.addWorksheet("README");
  readme.columns = [{ width: 24 }, { width: 70 }];
  readme.addRow(["Title", spec.title]);
  readme.addRow(["Generated", new Date().toISOString().slice(0, 16).replace("T", " ")]);
  readme.addRow(["Generated by", "Orchestra multi-agent session"]);
  readme.addRow([]);
  readme.addRow(["Sheets", ""]);
  for (const sh of spec.sheets) readme.addRow(["", sh.name]);
  readme.getColumn(1).font = { bold: true };
  readme.getRow(1).font = { bold: true, size: 14 };

  for (const sheet of spec.sheets) {
    const ws = wb.addWorksheet(sheet.name || "Sheet1");

    // Header row: brand fill, white bold text, frozen, filterable.
    const header = ws.addRow(sheet.columns);
    header.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND_COLOR}` } };
      cell.alignment = { horizontal: "left" };
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };

    for (const row of sheet.rows) ws.addRow(row);

    // Column widths + numeric formatting: right-aligned with thousands separators;
    // integers stay integers, decimals show two places.
    sheet.columns.forEach((col, i) => {
      const colIdx = i + 1;
      const headerLen = String(col ?? "").length;
      const maxCellLen = sheet.rows.reduce((max, r) => Math.max(max, String(r[i] ?? "").length), 0);
      ws.getColumn(colIdx).width = Math.min(Math.max(headerLen, maxCellLen, 8) + 3, 50);
      const isNumeric = sheet.rows.length > 0 && sheet.rows.every(r => typeof r[i] === "number" || r[i] === "");
      if (isNumeric) {
        const anyDecimal = sheet.rows.some(r => typeof r[i] === "number" && !Number.isInteger(r[i] as number));
        ws.getColumn(colIdx).numFmt = anyDecimal ? "#,##0.00" : "#,##0";
        ws.getColumn(colIdx).alignment = { horizontal: "right" };
        ws.getCell(1, colIdx).alignment = { horizontal: "right" };
      }
    });

    // Totals row with LIVE formulas for fully-numeric columns (2+ data rows): the file
    // keeps recalculating when the user edits it — a baked number would silently go stale.
    const numericCols = sheet.columns.map((_, i) => sheet.rows.every(r => typeof r[i] === "number")).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
    if (numericCols.length > 0 && sheet.rows.length >= 2) {
      const totalRowIdx = sheet.rows.length + 2;
      const totalRow = ws.getRow(totalRowIdx);
      totalRow.getCell(1).value = numericCols.includes(0) ? undefined : "Total";
      for (const ci of numericCols) {
        const colLetter = ws.getColumn(ci + 1).letter;
        totalRow.getCell(ci + 1).value = { formula: `SUM(${colLetter}2:${colLetter}${sheet.rows.length + 1})` } as any;
      }
      totalRow.font = { bold: true };
      totalRow.eachCell(cell => { cell.border = { top: { style: "thin", color: { argb: `FF${BRAND_COLOR}` } } }; });
    }
  }

  if (verificationNotes && verificationNotes.length > 0) {
    const prov = wb.addWorksheet("_Verification");
    prov.columns = [{ width: 100 }];
    prov.addRow(["Verification notes"]).font = { bold: true };
    for (const note of verificationNotes) prov.addRow([note]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return { kind: "xlsx", name: safeFilename(spec.title, "xlsx"), url: URL.createObjectURL(blob) };
}

// PPTX layout constants: hard caps enforced in the BUILDER (the prompt requests them, but
// a builder that trusts the prompt will eventually ship an overflowing slide — previously
// a long bullet list silently ran off the bottom of the fixed text box).
const MAX_BULLETS_PER_SLIDE = 6;
const MAX_WORDS_PER_BULLET = 14;

function splitOverflowSlides(slides: SlideSpec[]): SlideSpec[] {
  const out: SlideSpec[] = [];
  for (const slide of slides) {
    if (slide.bullets.length <= MAX_BULLETS_PER_SLIDE) { out.push(slide); continue; }
    for (let i = 0; i < slide.bullets.length; i += MAX_BULLETS_PER_SLIDE) {
      out.push({
        title: i === 0 ? slide.title : `${slide.title} (cont.)`,
        bullets: slide.bullets.slice(i, i + MAX_BULLETS_PER_SLIDE),
        notes: i === 0 ? slide.notes : undefined
      });
    }
  }
  return out;
}

/** Trims a bullet to the word cap for the slide surface; the full text moves to speaker
 *  notes (the notes are the narrative home — the slide is the signal, not the essay). */
function capBullet(text: string): { display: string; overflowed: boolean } {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_BULLET) return { display: text, overflowed: false };
  return { display: words.slice(0, MAX_WORDS_PER_BULLET).join(" ") + " …", overflowed: true };
}

export async function buildPptx(spec: DeckSpec, verificationNotes?: string[]): Promise<GeneratedFile> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDESCREEN", width: 13.33, height: 7.5 });
  pptx.layout = "WIDESCREEN";

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BRAND_COLOR };
  titleSlide.addText(spec.title, {
    x: 0.6, y: 2.6, w: 12, h: 1.6, fontSize: 40, bold: true, color: "FFFFFF", fontFace: "Calibri"
  });
  if (spec.subtitle) {
    titleSlide.addText(spec.subtitle, { x: 0.6, y: 4.1, w: 12, h: 0.8, fontSize: 18, color: "E0E7FF", fontFace: "Calibri" });
  }

  const slides = splitOverflowSlides(spec.slides);

  // Agenda slide for longer decks: generated, not requested — the deck's own structure
  // is the one thing the builder always knows more reliably than the generator.
  if (slides.length >= 6) {
    const agenda = pptx.addSlide();
    agenda.addText("Agenda", { x: 0.5, y: 0.35, w: 12.3, h: 0.9, fontSize: 26, bold: true, color: "1E293B", fontFace: "Calibri" });
    agenda.addShape("rect", { x: 0.5, y: 1.15, w: 2.2, h: 0.05, fill: { color: BRAND_COLOR } });
    agenda.addText(
      slides.filter(s => !s.title.endsWith("(cont.)")).map(s => ({ text: s.title, options: { bullet: true, breakLine: true } })),
      { x: 0.5, y: 1.5, w: 12.3, h: 5.4, fontSize: 18, color: "334155", fontFace: "Calibri", valign: "top" }
    );
  }

  for (const slide of slides) {
    const s = pptx.addSlide();
    s.addText(slide.title, { x: 0.5, y: 0.35, w: 12.3, h: 0.9, fontSize: 26, bold: true, color: "1E293B", fontFace: "Calibri" });
    s.addShape("rect", { x: 0.5, y: 1.15, w: 2.2, h: 0.05, fill: { color: BRAND_COLOR } });

    // Font autoscale by density: fewer bullets earn more presence.
    const flatCount = slide.bullets.reduce((n, b) => n + 1 + (b.sub?.length || 0), 0);
    const mainSize = flatCount <= 4 ? 20 : 18;

    const overflowNotes: string[] = [];
    const runs: { text: string; options: any }[] = [];
    for (const b of slide.bullets) {
      const capped = capBullet(b.text);
      if (capped.overflowed) overflowNotes.push(`• ${b.text}`);
      runs.push({ text: capped.display, options: { bullet: true, breakLine: true, fontSize: mainSize } });
      for (const sub of b.sub || []) {
        const cappedSub = capBullet(sub);
        if (cappedSub.overflowed) overflowNotes.push(`  – ${sub}`);
        runs.push({ text: cappedSub.display, options: { bullet: true, breakLine: true, indentLevel: 1, fontSize: mainSize - 4 } });
      }
    }
    if (runs.length > 0) {
      s.addText(runs, { x: 0.5, y: 1.5, w: 12.3, h: 5.4, color: "334155", fontFace: "Calibri", valign: "top" });
    }
    const notesParts = [slide.notes, overflowNotes.length > 0 ? `Full text of shortened bullets:\n${overflowNotes.join("\n")}` : ""].filter(Boolean);
    if (notesParts.length > 0) s.addNotes(notesParts.join("\n\n"));
  }

  if (verificationNotes && verificationNotes.length > 0) {
    const last = pptx.addSlide();
    last.addText("Verification notes", { x: 0.5, y: 0.35, w: 12.3, h: 0.9, fontSize: 22, bold: true, color: "64748B", fontFace: "Calibri" });
    last.addText(
      verificationNotes.map(n => ({ text: n, options: { bullet: true, breakLine: true } })),
      { x: 0.5, y: 1.5, w: 12.3, h: 5.4, fontSize: 14, color: "64748B", fontFace: "Calibri", valign: "top" }
    );
  }

  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  return { kind: "pptx", name: safeFilename(spec.title, "pptx"), url: URL.createObjectURL(blob) };
}
