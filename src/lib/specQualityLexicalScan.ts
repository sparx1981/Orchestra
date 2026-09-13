// Automated Specification Quality Pass — Stage 1: Deterministic Lexical Scan. Pure code, zero
// LLM dependency by design — this must stay true regardless of which provider the app is
// configured with (see the hard constraint in the SQP feature spec). Only "literal_list" and
// "regex" pattern library entries are handled here; "llm_judgment" entries carry no literal
// pattern to match against and are handled entirely by Stage 2 (specQualityPrompt.ts).

import type { LexicalHit, PatternEntry, PatternLibrary } from "./specQualityTypes";

/** Escapes a literal term for safe use inside a RegExp — needed since library terms may
 *  contain regex-meaningful characters (e.g. apostrophes are fine, but a future term with
 *  parentheses or a period should still match literally, not as regex syntax). */
function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchers(entry: PatternEntry): { term: string; re: RegExp }[] {
  if (!entry.terms || entry.terms.length === 0) return [];
  if (entry.match_type === "literal_list") {
    return entry.terms.map(term => ({ term, re: new RegExp(escapeRegExp(term), "gi") }));
  }
  if (entry.match_type === "regex") {
    return entry.terms.map(term => {
      try {
        return { term, re: new RegExp(term, "gi") };
      } catch {
        // A malformed regex entered via the library editor shouldn't crash the whole scan —
        // skip it silently; the editor validates on save, but stored data can outlive edits
        // to the validation logic itself.
        return { term, re: /(?!)/g }; // matches nothing
      }
    });
  }
  return [];
}

/**
 * Runs the pure-code Stage 1 scan over the full assembled spec text, matching every
 * "literal_list"/"regex" entry in `library`. "llm_judgment" entries are skipped — Stage 2
 * handles those. Case-insensitive; returns every match with its character offset into
 * `specText`, so downstream renderers can locate the flagged span.
 */
export function runLexicalScan(specText: string, library: PatternLibrary): LexicalHit[] {
  const hits: LexicalHit[] = [];
  if (!specText) return hits;

  for (const entry of library.entries) {
    if (entry.match_type === "llm_judgment") continue;
    const matchers = buildMatchers(entry);
    for (const { term, re } of matchers) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(specText))) {
        hits.push({
          quote: match[0],
          term,
          category: entry.category,
          severity: entry.severity,
          charOffset: match.index,
        });
        // Guard against a zero-length match (a regex like "x*") looping forever.
        if (match[0].length === 0) re.lastIndex++;
      }
    }
  }

  return hits.sort((a, b) => a.charOffset - b.charOffset);
}
