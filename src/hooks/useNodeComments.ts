import { useState, useRef, useEffect, useCallback } from "react";
import type { CollaborativeRun, NodeComment } from "@/src/App";
import type { DecisionNode } from "@/src/lib/treeUtils";

interface UseNodeCommentsParams {
  collaborativeRun: CollaborativeRun | null;
  setCollaborativeRun: (run: CollaborativeRun) => void;
  setCollaborativeHistory: (updater: (prev: CollaborativeRun[]) => CollaborativeRun[]) => void;
  saveHistoryEntry: (type: "collaborative", entry: { id: string }) => void;
  logDebug: (level: "info" | "warn" | "error", message: string, details?: string) => void;
}

// Everything about manager comments on decision-tree nodes: the "Add Comment" dialog's local
// state, draft CRUD, and the delete-with-undo toast — extracted out of the main component
// since it's a genuinely self-contained unit. `submitCommentBatch` (sending a batch to the
// team for consideration) deliberately stays in the main component instead: it's tightly
// coupled to the discussion engine (facilitator calls, the chat drawer, abort signals), and
// pulling it out here would just relocate that coupling as a long parameter list rather than
// actually isolating anything.
export function useNodeComments({ collaborativeRun, setCollaborativeRun, setCollaborativeHistory, saveHistoryEntry, logDebug }: UseNodeCommentsParams) {
  const [addCommentTarget, setAddCommentTarget] = useState<DecisionNode | null>(null);
  const [addCommentDraftText, setAddCommentDraftText] = useState("");
  const [deletedCommentUndo, setDeletedCommentUndo] = useState<NodeComment | null>(null);
  const deletedCommentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Closes the previously-missing gap: a pending undo timeout could fire setState after the
  // component unmounted (logout, hard navigation) if the user left within the 6s window.
  useEffect(() => {
    return () => {
      if (deletedCommentTimeoutRef.current) clearTimeout(deletedCommentTimeoutRef.current);
    };
  }, []);

  // Every comment mutation goes through here so collaborativeRun, collaborativeHistory, and
  // Firestore all stay in sync — nodeComments has no separate copy of its own.
  const updateNodeComments = (updater: (prev: NodeComment[]) => NodeComment[]) => {
    if (!collaborativeRun) return;
    const updated = updater(collaborativeRun.nodeComments || []);
    const updatedRun: CollaborativeRun = { ...collaborativeRun, nodeComments: updated };
    setCollaborativeRun(updatedRun);
    setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
    saveHistoryEntry("collaborative", updatedRun);
  };

  const openAddCommentDialog = useCallback((node: DecisionNode) => {
    setAddCommentTarget(node);
    setAddCommentDraftText("");
  }, []);

  const saveDraftComment = () => {
    if (!addCommentTarget || !addCommentDraftText.trim()) return;
    const newComment: NodeComment = {
      id: `comment_${Date.now()}`,
      nodeId: addCommentTarget.id,
      nodeLabel: addCommentTarget.label,
      text: addCommentDraftText.trim(),
      timestamp: new Date().toISOString(),
      status: "draft"
    };
    updateNodeComments(prev => [...prev, newComment]);
    logDebug("info", `Draft comment added on "${addCommentTarget.label}"`);
    setAddCommentTarget(null);
    setAddCommentDraftText("");
  };

  // No confirmation on delete — immediate removal with a brief undo window instead, since a
  // confirmation dialog on every delete is more friction than a note this disposable warrants.
  const deleteDraftComment = (id: string) => {
    const comment = (collaborativeRun?.nodeComments || []).find(c => c.id === id);
    if (!comment) return;
    updateNodeComments(prev => prev.filter(c => c.id !== id));
    setDeletedCommentUndo(comment);
    if (deletedCommentTimeoutRef.current) clearTimeout(deletedCommentTimeoutRef.current);
    deletedCommentTimeoutRef.current = setTimeout(() => setDeletedCommentUndo(null), 6000);
  };

  const undoDeleteComment = () => {
    if (!deletedCommentUndo) return;
    updateNodeComments(prev => [...prev, deletedCommentUndo]);
    if (deletedCommentTimeoutRef.current) clearTimeout(deletedCommentTimeoutRef.current);
    setDeletedCommentUndo(null);
  };

  // Marks a comment's reply as seen once its card is expanded/viewed in the drawer.
  const markCommentReplyRead = (id: string) => {
    updateNodeComments(prev => prev.map(c => (c.id === id && c.replyUnread ? { ...c, replyUnread: false } : c)));
  };

  // Used by the New Conversation / History-load / Use-Saved-Team reset paths so a stale
  // "Add Comment" dialog doesn't linger bound to a node from a conversation the user has
  // since left.
  const resetCommentDialogState = () => {
    setAddCommentTarget(null);
  };

  return {
    addCommentTarget,
    setAddCommentTarget,
    addCommentDraftText,
    setAddCommentDraftText,
    deletedCommentUndo,
    updateNodeComments,
    openAddCommentDialog,
    saveDraftComment,
    deleteDraftComment,
    undoDeleteComment,
    markCommentReplyRead,
    resetCommentDialogState
  };
}
