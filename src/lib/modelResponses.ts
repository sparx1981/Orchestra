// Typed shapes + validation for parsed LLM responses, applied at the parse boundary.
// Model output is the data least likely to reliably match its expected shape — it's produced
// by a model following a natural-language instruction, not a strict contract — so a malformed
// response should be handled HERE, with behaviour that names exactly what was expected,
// rather than several function calls later at the point of use.
//
// Design rule: validation must never change the success path, and where the calling code
// already had a defensive fallback for a missing/empty field, the validator encodes that
// exact fallback rather than replacing it with an error.

/** Minimal structural shape of a decision tree node as returned by the model. */
export interface RawTreeNode {
  id: string;
  label: string;
  parentId?: string | null;
  [key: string]: unknown;
}

/** Facilitator response for the Promote / Move tree-restructure calls, post-validation. */
export interface TreeRestructureResponse {
  outcome?: string;
  reasons?: string[];
  decisionTree: RawTreeNode[];
}

/** Post-validation revision result — both the decision-node and section paths resolve to this. */
export interface RevisionResult {
  label: string;
  text: string;
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `an array of ${value.length}`;
  return typeof value;
}

/**
 * Validates the shared Promote/Move restructure shape: a non-empty decisionTree whose nodes
 * each carry a usable string id and label. outcome/reasons are optional — callers fall back
 * to the current run's values when they're absent, and that behaviour is preserved by
 * returning them as undefined rather than erroring.
 */
export function validateTreeRestructureResponse(parsed: any): TreeRestructureResponse {
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`The facilitator's restructure response wasn't a JSON object (got ${describe(parsed)}).`);
  }
  if (!Array.isArray(parsed.decisionTree) || parsed.decisionTree.length === 0) {
    throw new Error("The facilitator didn't return a usable restructured tree.");
  }
  const badIndex = parsed.decisionTree.findIndex(
    (n: any) => !n || typeof n !== "object" || typeof n.id !== "string" || !n.id || typeof n.label !== "string" || !n.label
  );
  if (badIndex !== -1) {
    throw new Error(
      `The restructured tree's node at position ${badIndex} was missing a string "id"/"label" (got ${describe(parsed.decisionTree[badIndex])}) — refusing to apply a tree that would render incorrectly.`
    );
  }
  return {
    outcome: typeof parsed.outcome === "string" && parsed.outcome ? parsed.outcome : undefined,
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : undefined,
    decisionTree: parsed.decisionTree
  };
}

/**
 * Validates a "Revise this section" response: { "content": "..." }.
 * Preserves the existing fallback — a missing/empty content field yields the before-text
 * unchanged (the preview then shows no diff), exactly as the calling code did inline.
 */
export function validateSectionRevisionResponse(
  parsed: any,
  fallback: { label: string; text: string }
): RevisionResult {
  const text = parsed && typeof parsed.content === "string" && parsed.content.trim() ? parsed.content.trim() : fallback.text;
  return { label: fallback.label, text };
}

/**
 * Validates a "Revise this node" response: { "label": "...", "reason": "..." }.
 * Preserves the existing per-field fallback — either field missing or empty keeps the
 * node's current value for that field.
 */
export function validateNodeRevisionResponse(
  parsed: any,
  fallback: { label: string; text: string }
): RevisionResult {
  const label = parsed && typeof parsed.label === "string" && parsed.label.trim() ? parsed.label.trim() : fallback.label;
  const text = parsed && typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : fallback.text;
  return { label, text };
}
