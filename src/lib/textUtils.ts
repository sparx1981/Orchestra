// Pure text-processing utilities, extracted from App.tsx so they can be unit tested directly.
// No React or app-state dependency.

/**
 * Extracts a JSON object from a model response using a string-aware bracket-depth scan
 * (rather than naive first-'{'-to-last-'}'), so trailing prose or a stray brace elsewhere
 * in the reply doesn't corrupt the parse.
 */
export function extractJson(raw: string): any {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in the response.");
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === "\\") { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error("Could not find a complete JSON object in the response.");
}

/** Truncates text to at most `max` characters, appending a note about how much was cut. */
export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...[truncated — ${text.length - max} more characters omitted to stay within model limits]`;
}
