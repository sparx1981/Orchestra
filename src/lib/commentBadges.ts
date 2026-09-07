// Comment-badge derivation, extracted from App.tsx so it can be unit tested directly.
// Uses a minimal structural type (same pattern as gatekeeperMerge's DecisionNodeLike)
// rather than importing App's full NodeComment, so this module has no App dependency.

/** The fields of a node comment that badge derivation and the tree UI actually read.
 * Structural subset of App's NodeComment (same pattern as gatekeeperMerge's DecisionNodeLike),
 * so this module and the tree components have no import dependency on App.tsx. */
export interface NodeCommentLike {
  id: string;
  nodeId: string;
  nodeLabel: string;
  text: string;
  status: "draft" | "submitted";
  reply?: string;
  replyAgentId?: string;
  replyAgentName?: string;
  replyUnread?: boolean;
}

export type CommentBadgeState = "none" | "draft" | "sent" | "replied" | "unread";

// The four states a node's comment badge can be in, checked in priority order: an unread
// reply outranks a read one, which outranks "sent, no reply yet," which outranks a draft.
export function getNodeCommentBadge(comments: NodeCommentLike[], nodeId: string): CommentBadgeState {
  const forNode = comments.filter(c => c.nodeId === nodeId);
  if (forNode.length === 0) return "none";
  if (forNode.some(c => c.replyUnread)) return "unread";
  if (forNode.some(c => c.reply)) return "replied";
  if (forNode.some(c => c.status === "submitted")) return "sent";
  return "draft";
}

// Builds every node's badge state in a single O(n) pass over the comments array, instead of
// each node independently filtering the full array (O(nodes × comments)). Meant to be wrapped
// in useMemo, keyed on the comments array, and passed down as a plain lookup.
export function buildCommentBadgeMap(comments: NodeCommentLike[]): Map<string, CommentBadgeState> {
  const byNode = new Map<string, NodeCommentLike[]>();
  for (const c of comments) {
    const list = byNode.get(c.nodeId);
    if (list) list.push(c);
    else byNode.set(c.nodeId, [c]);
  }
  const result = new Map<string, CommentBadgeState>();
  byNode.forEach((forNode, nodeId) => {
    let state: CommentBadgeState = "draft";
    if (forNode.some(c => c.replyUnread)) state = "unread";
    else if (forNode.some(c => c.reply)) state = "replied";
    else if (forNode.some(c => c.status === "submitted")) state = "sent";
    result.set(nodeId, state);
  });
  return result;
}
