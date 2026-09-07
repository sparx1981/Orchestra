// Knowledge Base staleness detection — extracted from App.tsx so the diff logic driving the
// staleness banner and checkAgainstNewKnowledgeSources isn't duplicated inline in two places
// (which is exactly the kind of thing that silently drifts apart when only one copy gets
// updated later). Deliberately id-based rather than a count comparison: a removed-one/
// added-one swap leaves the count unchanged but the sources genuinely different, and a count
// alone would miss that.

/** Structural subset of App's KnowledgeFile — only the fields staleness detection reads. */
export interface KnowledgeSourceLike {
  id: string;
  content: string;
  sourceType: string;
}

/**
 * The ids of currently-live sources that count as "real" grounded content (has content,
 * isn't an image) and are NOT in the given set of already-checked ids. Returns ids rather
 * than filtered objects so callers keep their own fully-typed KnowledgeFile[] — this only
 * needs to decide WHICH ones are new, not carry their other fields.
 */
export function getNewKnowledgeSourceIds(knowledgeFiles: KnowledgeSourceLike[], alreadyGroundedIds: string[] | undefined): Set<string> {
  const grounded = new Set(alreadyGroundedIds ?? []);
  return new Set(
    knowledgeFiles.filter(f => f.content && f.sourceType !== "image" && !grounded.has(f.id)).map(f => f.id)
  );
}
