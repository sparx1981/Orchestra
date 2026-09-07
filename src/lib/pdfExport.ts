// PDF export. Deliberately built by direct construction (pdf-lib) rather than rendering
// HTML through a headless browser — no extra runtime dependency, and predictable output
// for a text-and-headings document like this one. Reuses the same AuditSection[] structure
// the human-readable audit export uses, so both formats are two renderings of one content
// model rather than two independently-maintained documents.

import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { AuditSection } from "./runExports";

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Greedy word-wrap against a font's actual measured width — naive character-count
 *  wrapping looks wrong the moment a font isn't monospace, which none of the standard PDF
 *  fonts are. */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildAuditPdf(title: string, subtitle: string, sections: AuditSection[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawParagraph = (text: string, font: PDFFont, fontSize: number, color = rgb(0.15, 0.15, 0.15), lineHeight = fontSize * 1.4) => {
    const lines = wrapText(text, font, fontSize, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: MARGIN, y: cursorY - fontSize, size: fontSize, font, color });
      cursorY -= lineHeight;
    }
  };

  // Title block
  drawParagraph(title, boldFont, 18, rgb(0.05, 0.05, 0.05));
  cursorY -= 4;
  if (subtitle) {
    drawParagraph(subtitle, regularFont, 10, rgb(0.4, 0.4, 0.4));
  }
  cursorY -= 12;
  ensureSpace(2);
  page.drawLine({ start: { x: MARGIN, y: cursorY }, end: { x: PAGE_WIDTH - MARGIN, y: cursorY }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  cursorY -= 20;

  for (const section of sections) {
    ensureSpace(30);
    drawParagraph(section.heading, boldFont, 12, rgb(0.1, 0.25, 0.6));
    cursorY -= 4;
    for (const p of section.paragraphs) {
      drawParagraph(p, regularFont, 10.5);
      cursorY -= 6;
    }
    cursorY -= 10;
  }

  return doc.save();
}
