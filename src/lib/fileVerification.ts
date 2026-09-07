// Deterministic validation + grounding verification for generated office-file specs.
// This module is the "admission policy" half of the epistemic-integrity design: the
// guarantee is not that the generator never invents (unprovable for any LLM), but that
// invented content cannot compile into a file unnoticed. Everything here is pure code —
// no LLM calls — so it is fast, free, and unit-testable.

import type { DocSpec, SpreadsheetSpec, DeckSpec, DocSection, SlideSpec, SheetSpec } from "./officeFiles";

// ---------------------------------------------------------------------------
// Gate 0 — schema validation.
// The specs previously reached the builders via a blind `as DocSpec` cast; a malformed
// response either crashed inside a builder or silently produced a wrong file. These
// validators normalise what can be normalised (coercing strays to strings, dropping
// empties) and reject what can't, returning human-readable errors that can be fed back
// to the generator for one retry.
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  ok: boolean;
  spec?: T;
  errors: string[];
}

const asTrimmedString = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(x => asTrimmedString(x)).filter((x): x is string => x !== null) : [];

export function validateDocSpec(raw: any): ValidationResult<DocSpec> {
  const errors: string[] = [];
  const title = asTrimmedString(raw?.title);
  if (!title) errors.push('missing or empty "title"');
  if (!Array.isArray(raw?.sections) || raw.sections.length === 0) {
    errors.push('"sections" must be a non-empty array');
    return { ok: false, errors };
  }
  const sections: DocSection[] = [];
  raw.sections.forEach((s: any, i: number) => {
    const heading = asTrimmedString(s?.heading);
    if (!heading) { errors.push(`section ${i + 1}: missing "heading"`); return; }
    const level = s?.level === 2 || s?.level === 3 ? s.level : 1;
    const paragraphs = asStringArray(s?.paragraphs);
    const bullets = asStringArray(s?.bullets);
    const quotes = Array.isArray(s?.quotes)
      ? s.quotes
          .map((q: any) => ({ text: asTrimmedString(q?.text), attribution: asTrimmedString(q?.attribution) || undefined }))
          .filter((q: any): q is { text: string; attribution?: string } => q.text !== null)
      : undefined;
    const table = s?.table && Array.isArray(s.table.columns) && Array.isArray(s.table.rows)
      ? {
          columns: asStringArray(s.table.columns),
          rows: s.table.rows
            .filter((r: any) => Array.isArray(r))
            .map((r: any[]) => r.map(c => (typeof c === "number" ? c : String(c ?? ""))))
        }
      : undefined;
    if (table && table.columns.length === 0) errors.push(`section ${i + 1}: table has no columns`);
    if (paragraphs.length === 0 && bullets.length === 0 && !quotes?.length && !table) {
      errors.push(`section ${i + 1} ("${heading}") has no content`);
      return;
    }
    sections.push({ heading, level, paragraphs, bullets, quotes, table });
  });
  if (sections.length === 0) errors.push("no valid sections after validation");
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors,
    spec: {
      title: title!,
      subtitle: asTrimmedString(raw?.subtitle) || undefined,
      executiveSummary: asTrimmedString(raw?.executiveSummary) || undefined,
      sections
    }
  };
}

export function validateDeckSpec(raw: any): ValidationResult<DeckSpec> {
  const errors: string[] = [];
  const title = asTrimmedString(raw?.title);
  if (!title) errors.push('missing or empty "title"');
  if (!Array.isArray(raw?.slides) || raw.slides.length === 0) {
    errors.push('"slides" must be a non-empty array');
    return { ok: false, errors };
  }
  const slides: SlideSpec[] = [];
  raw.slides.forEach((s: any, i: number) => {
    const slideTitle = asTrimmedString(s?.title);
    if (!slideTitle) { errors.push(`slide ${i + 1}: missing "title"`); return; }
    // Bullets accept either plain strings or {text, sub} objects (two-level bullets).
    const bullets: { text: string; sub?: string[] }[] = [];
    if (Array.isArray(s?.bullets)) {
      for (const b of s.bullets) {
        if (typeof b === "string" && b.trim()) bullets.push({ text: b.trim() });
        else if (b && typeof b === "object") {
          const text = asTrimmedString(b.text);
          if (text) bullets.push({ text, sub: asStringArray(b.sub).slice(0, 4) });
        }
      }
    }
    if (bullets.length === 0) { errors.push(`slide ${i + 1} ("${slideTitle}") has no bullets`); return; }
    slides.push({ title: slideTitle, bullets, notes: asTrimmedString(s?.notes) || undefined });
  });
  if (slides.length === 0) errors.push("no valid slides after validation");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors, spec: { title: title!, subtitle: asTrimmedString(raw?.subtitle) || undefined, slides } };
}

export function validateSpreadsheetSpec(raw: any): ValidationResult<SpreadsheetSpec> {
  const errors: string[] = [];
  const title = asTrimmedString(raw?.title);
  if (!title) errors.push('missing or empty "title"');
  if (!Array.isArray(raw?.sheets) || raw.sheets.length === 0) {
    errors.push('"sheets" must be a non-empty array');
    return { ok: false, errors };
  }
  const sheets: SheetSpec[] = [];
  raw.sheets.forEach((sh: any, i: number) => {
    const name = asTrimmedString(sh?.name) || `Sheet${i + 1}`;
    const columns = asStringArray(sh?.columns);
    if (columns.length === 0) { errors.push(`sheet ${i + 1} ("${name}"): no columns`); return; }
    if (!Array.isArray(sh?.rows)) { errors.push(`sheet ${i + 1} ("${name}"): "rows" missing`); return; }
    const rows: (string | number)[][] = sh.rows
      .filter((r: any) => Array.isArray(r))
      .map((r: any[]) => {
        // Normalise row length to the column count: pad short rows, trim long ones.
        const cells = r.map(c => (typeof c === "number" ? c : String(c ?? "")));
        while (cells.length < columns.length) cells.push("");
        return cells.slice(0, columns.length);
      });
    if (rows.length === 0) { errors.push(`sheet ${i + 1} ("${name}"): no data rows`); return; }
    sheets.push({ name: name.slice(0, 31), columns, rows });
  });
  if (sheets.length === 0) errors.push("no valid sheets after validation");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors, spec: { title: title!, sheets } };
}

// ---------------------------------------------------------------------------
// Gate 3 — deterministic grounding verification.
// Numeric echo-check: every numeric literal in the spec must appear (after
// normalisation) somewhere in the source corpus the generator was shown. An invented
// number is the single most damaging hallucination class in a business document, and
// it is catchable with zero LLM cost. Quote containment: anything the spec presents in
// quotation marks must be a substring of the source.
// Checks run against exactly the (truncated) corpus the generator saw — verifying
// against anything else would flag legitimate content whose grounding was truncated away.
// ---------------------------------------------------------------------------

/** Normalises a numeric token for comparison: strips grouping commas, currency
 *  symbols, %, and trailing zeros after the decimal point ("1,250.50" -> "1250.5"). */
export function normalizeNumber(token: string): string {
  let t = token.replace(/[,$£€%]/g, "").trim();
  if (t.includes(".")) t = t.replace(/0+$/, "").replace(/\.$/, "");
  return t;
}

/** Extracts normalised numeric tokens from free text. Ignores 1-2 digit bare integers
 *  (structural numbers: list positions, "3 options", heading levels) which would make
 *  the check too noisy to trust — the target class is figures: 47%, $1,250, 3.7x. */
export function extractSignificantNumbers(text: string): Set<string> {
  const out = new Set<string>();
  const matches = text.match(/[$£€]?\d[\d,]*(?:\.\d+)?%?/g) || [];
  for (const m of matches) {
    const hasSymbol = /[$£€%]/.test(m);
    const normalized = normalizeNumber(m);
    const digits = normalized.replace(/\D/g, "");
    if (hasSymbol || digits.length >= 3 || normalized.includes(".")) out.add(normalized);
  }
  return out;
}

/** All text content of a spec, flattened for verification. */
export function flattenSpecText(kind: "docx" | "xlsx" | "pptx", spec: DocSpec | SpreadsheetSpec | DeckSpec): string {
  if (kind === "docx") {
    const d = spec as DocSpec;
    return [
      d.title, d.subtitle, d.executiveSummary,
      ...d.sections.flatMap(s => [
        s.heading, ...(s.paragraphs || []), ...(s.bullets || []),
        ...(s.quotes || []).map(q => q.text),
        ...(s.table ? [s.table.columns.join(" "), ...s.table.rows.map(r => r.join(" "))] : [])
      ])
    ].filter(Boolean).join("\n");
  }
  if (kind === "pptx") {
    const d = spec as DeckSpec;
    return [
      d.title, d.subtitle,
      ...d.slides.flatMap(s => [s.title, ...s.bullets.flatMap(b => [b.text, ...(b.sub || [])]), s.notes])
    ].filter(Boolean).join("\n");
  }
  const d = spec as SpreadsheetSpec;
  return [
    d.title,
    ...d.sheets.flatMap(sh => [sh.name, sh.columns.join(" "), ...sh.rows.map(r => r.join(" "))])
  ].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Live-discussion claim checking (Phase 3 roadmap item #1).
// The gates above only ever ran at document-generation time — several QA personas
// (AECO, finance, manufacturing) independently pointed out that this left the live
// Panel Discussion transcript completely unchecked: an agent could state a fabricated
// figure and nothing would ever flag it unless the manager happened to export a file.
// This extends the same deterministic numeric-echo check to a single transcript
// message against the user's own uploaded knowledge base — cheap enough to run on
// every agent message with no additional LLM cost.
// ---------------------------------------------------------------------------

export interface NumberSpan {
  start: number;
  end: number;
  raw: string;
  normalized: string;
}

/** Same tokenization/significance rules as extractSignificantNumbers, but keeps the
 *  original substring and its position — needed to highlight exactly where a flagged
 *  figure appears in the original prose, not just list it in a badge tooltip. Previously
 *  a message could be flagged "check figures: 624" with no way to find "624" inside a long
 *  paragraph. */
export function findNumberSpans(text: string): NumberSpan[] {
  const spans: NumberSpan[] = [];
  const regex = /[$£€]?\d[\d,]*(?:\.\d+)?%?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const hasSymbol = /[$£€%]/.test(raw);
    const normalized = normalizeNumber(raw);
    const digits = normalized.replace(/\D/g, "");
    if (hasSymbol || digits.length >= 3 || normalized.includes(".")) {
      spans.push({ start: match.index, end: match.index + raw.length, raw, normalized });
    }
  }
  return spans;
}

export interface ClaimCheckResult {
  /** Numbers in the message that don't appear (normalised) in the knowledge base. */
  unverifiedNumbers: string[];
  hasUnverifiedClaims: boolean;
}

/** The expensive half of checkClaimsAgainstKnowledgeBase, split out so a caller checking
 *  many messages against the SAME knowledge base (e.g. every message in a transcript, on
 *  every render, including every chunk of an actively streaming message) can extract the
 *  source numbers ONCE — ideally behind a useMemo keyed on the corpus text — instead of
 *  re-scanning the entire knowledge base from scratch for every single message. Pass
 *  `null` for sourceNumbers to mean "no knowledge base" (mirrors the original function's
 *  null-on-empty-corpus behavior) rather than an empty Set, since an empty-but-present
 *  corpus and no-corpus-at-all are genuinely different cases: the latter means "nothing to
 *  check against, don't flag anything", the former would legitimately flag everything. */
export function checkClaimsAgainstNumbers(message: string, sourceNumbers: Set<string> | null): ClaimCheckResult | null {
  if (sourceNumbers === null) return null;
  const messageNumbers = extractSignificantNumbers(message);
  if (messageNumbers.size === 0) return { unverifiedNumbers: [], hasUnverifiedClaims: false };
  const unverifiedNumbers = [...messageNumbers].filter(n => !sourceNumbers.has(n));
  return { unverifiedNumbers, hasUnverifiedClaims: unverifiedNumbers.length > 0 };
}

/** Checks a single message's numeric claims against the knowledge base text. Returns
 *  null (not "clean") when there's no knowledge base at all — with nothing to check
 *  against, flagging every figure as "unverified" would be noise, not signal, so the
 *  caller should simply not show an indicator in that case rather than show a false one.
 *
 *  Kept exactly as before for any single-check caller (and the existing test suite) — but
 *  if you're checking many messages against the same corpus, use
 *  checkClaimsAgainstNumbers with a memoized Set instead; this wrapper re-extracts the
 *  source numbers from scratch on every call, which is the expensive part. */
export function checkClaimsAgainstKnowledgeBase(message: string, knowledgeBaseText: string): ClaimCheckResult | null {
  if (!knowledgeBaseText || !knowledgeBaseText.trim()) return null;
  return checkClaimsAgainstNumbers(message, extractSignificantNumbers(knowledgeBaseText));
}

export interface VerificationReport {
  /** Numbers present in the spec but absent from the source corpus. */
  unverifiedNumbers: string[];
  /** Quoted strings in the spec that are not substrings of the source. */
  unverifiedQuotes: string[];
  clean: boolean;
}

export function verifySpecAgainstSource(
  kind: "docx" | "xlsx" | "pptx",
  spec: DocSpec | SpreadsheetSpec | DeckSpec,
  sourceText: string
): VerificationReport {
  const specText = flattenSpecText(kind, spec);
  const sourceNumbers = extractSignificantNumbers(sourceText);
  const specNumbers = extractSignificantNumbers(specText);
  const unverifiedNumbers = [...specNumbers].filter(n => !sourceNumbers.has(n));

  // Quote containment: only check quotes long enough to be actual quotations rather
  // than scare-quoted terms ("fast" etc.).
  const normalizeWs = (s: string) => s.replace(/\s+/g, " ").toLowerCase();
  const src = normalizeWs(sourceText);
  const quoted = specText.match(/[“"]([^”"]{20,300})[”"]/g) || [];
  const unverifiedQuotes = quoted
    .map(q => q.slice(1, -1).trim())
    .filter(q => !src.includes(normalizeWs(q)));

  return {
    unverifiedNumbers,
    unverifiedQuotes,
    clean: unverifiedNumbers.length === 0 && unverifiedQuotes.length === 0
  };
}
