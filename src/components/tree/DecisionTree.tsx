// The decision-tree component family, extracted from App.tsx: the collapsible tree section,
// the recursive Tree and Flow node renderers, the per-node overflow menu, and their small
// supporting pieces. These already formed a self-contained recursive unit — this module makes
// that boundary real, so tree work no longer means finding things in a 13,000-line file.
//
// Extraction is behaviour-preserving: every component's markup, props semantics, memoisation,
// and hook order are unchanged; only the module they live in (and the import paths) moved.

import { useState, useEffect, useMemo, useContext, memo, createContext } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  ListPlus,
  ListTree,
  Maximize2,
  MessageCircle,
  MessageSquarePlus,
  MessageSquareText,
  MessagesSquare,
  MoreVertical,
  Move,
  MoveUp,
  PenLine,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  Workflow,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CountTag } from "@/src/components/CountTag";
import { getTreeChildren, getTreeDepth, getDepthBelow, flattenSubtree, type DecisionNode } from "@/src/lib/treeUtils";
import { buildCommentBadgeMap, type CommentBadgeState, type NodeCommentLike } from "@/src/lib/commentBadges";

// Deep-tree cap for the "simple" detail mode — shared with the graft-depth check in App.
export const SIMPLE_TREE_MAX_LEVELS = 5;

// The per-node actions, as ONE bundle instead of seven parallel optional props. Previously
// every component in the chain (Section → TreeNode/FlowNode → NodeActionsMenu) had to accept,
// type, and forward each handler individually — adding a tree action meant editing four
// signatures and every call site between them. Now a new action touches this interface and
// the one component that renders it. Callers should memoise the bundle (the node components
// are memo()'d, so a fresh object literal per render would defeat that).
export interface TreeNodeActions {
  onForce?: (node: DecisionNode) => void;
  onPromote?: (node: DecisionNode) => void;
  onDiscuss?: (node: DecisionNode) => void;
  onGoDeeper?: (node: DecisionNode) => void;
  onAddOutcome?: (node: DecisionNode) => void;
  /** Single consolidated entry point replacing separate "Expand scope" / "Add a new
   *  outcome" menu items — opens a small chooser (see requestModifyDecision in App.tsx)
   *  that then calls onGoDeeper or onAddOutcome itself. Both those callbacks are still
   *  required on the bundle (the chooser needs them), just no longer rendered as their
   *  own menu rows. */
  onModifyDecision?: (node: DecisionNode) => void;
  onAddComment?: (node: DecisionNode) => void;
  onViewScopingQA?: (node: DecisionNode) => void;
  onReviseNode?: (node: DecisionNode) => void;
  onDeleteNode?: (node: DecisionNode) => void;
  // Implemented by DecisionTreeSection itself (it owns the active-tab state a jump needs to
  // change) and merged into the bundle it hands to its children — see jumpToMovedNode below.
  // Called from a "moved to..." marker's Jump button; not a per-node action a caller sets.
  onJumpToMovedNode?: (nodeId: string, rootId: string) => void;
}

// Drag-and-drop "Move Decision" state — Flow view only. onMoveNode's presence is what makes
// FlowNode boxes draggable at all; the rest is lifted to the common ancestor since both the
// dragged node and the hovered drop target must be visible to every node simultaneously.
export interface TreeDragHandlers {
  onMoveNode?: (draggedId: string, targetId: string) => void;
  draggedNodeId?: string | null;
  dragOverNodeId?: string | null;
  onDragStartNode?: (id: string) => void;
  onDragOverNode?: (id: string | null) => void;
  onDragEndNode?: () => void;
}


// Node ids with a paused (in-progress) Expand-scope session — a context rather than a prop
// because NodeActionsMenu sits at the bottom of a recursive tree render and threading a Set
// through every DecisionTreeNode level just for a menu label would touch every recursion site.
export const PausedGoDeeperContext = createContext<Set<string>>(new Set());

// Whether a subtree (the node itself or anything beneath it) contains a selected node —
// drives the connector semantics: chains carrying the chosen path render solid blue,
// everything else stays dashed, so the winning route reads as one continuous line.

function subtreeContainsSelected(nodes: DecisionNode[], nodeId: string): boolean {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.isSelected) return true;
  return getTreeChildren(nodes, nodeId).some(c => subtreeContainsSelected(nodes, c.id));
}

// Proportional probability encoding: a 2px bar behind the numeric badge, so 62/38 vs 51/49
// splits are pre-attentively distinguishable instead of requiring mental subtraction.

function ProbabilityBar({ probability, isSelected, isGeneralKnowledgeContent }: { probability: number; isSelected?: boolean; isGeneralKnowledgeContent?: boolean }) {
  return (
    <span
      className="hidden sm:inline-flex w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0"
      // Nested probability space: siblings sum to ~100 among themselves, NOT scaled by the
      // parent's own weight — an 85% child of a 20% branch is 85% of *that path*, not of the
      // whole task. Surfaced as a tooltip so a high % under a low-probability parent doesn't
      // silently mislead. General-knowledge content nodes get different wording entirely —
      // simulated financial/legal/medical personas flagged an unlabeled percentage next to
      // an unverified figure as a real liability concern, not just a UX nicety.
      title={isGeneralKnowledgeContent
        ? `${probability}% — a relevance score for how well this finding fits what was asked, not a probability of factual accuracy`
        : `${probability}% relative to sibling options under the same branch — not scaled by the parent's own probability`}
    >
      <span
        className={`h-full rounded-full ${isSelected ? "bg-blue-500" : "bg-slate-400 dark:bg-slate-600"}`}
        style={{ width: `${Math.max(0, Math.min(100, probability))}%` }}
      />
    </span>
  );
}

// Renders a node's comment-state badge: a draft (unsent) comment reads as a light, muted
// icon; sent-but-unanswered is a touch darker; a reply turns it emerald; an unread reply adds
// a small red dot so a revisited batch shows what's new since last time.

const CommentBadgeIcon = memo(function CommentBadgeIcon({ state, onClick, nodeLabel }: { state: CommentBadgeState; onClick?: () => void; nodeLabel?: string }) {
  if (state === "none") return null;
  const icon =
    state === "unread" ? (
      <span className="relative flex-shrink-0 inline-flex">
        <MessageSquareText className="w-3 h-3 text-emerald-500" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      </span>
    ) : state === "replied" ? (
      <MessageSquareText className="w-3 h-3 text-emerald-500 flex-shrink-0" />
    ) : state === "sent" ? (
      <MessageSquareText className="w-3 h-3 text-slate-500 flex-shrink-0" />
    ) : (
      <MessageSquareText className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
    );
  // Previously a pure status indicator with no click handler — clicking it (as opposed to
  // digging into the kebab menu's "View / Add Comments" item) did nothing. Now opens the
  // same dialog directly, which is what the icon visually promises.
  if (!onClick) return icon;
  return (
    <button
      onClick={onClick}
      aria-label={`View comments${nodeLabel ? ` on "${nodeLabel}"` : ""}`}
      className="hit-target rounded-full -m-1 p-1 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors"
    >
      {icon}
    </button>
  );
});

// Consolidates the "Force this branch" and "Promote to top-level decision" actions into a
// single overflow control per node, instead of two separate always-visible icon buttons —
// keeps both the Tree and Flow views from getting crowded as more per-node actions exist.

const NodeActionsMenu = memo(function NodeActionsMenu({ node, actions, isCommentingLocked, className }: { node: DecisionNode; actions: TreeNodeActions; isCommentingLocked?: boolean; className?: string }) {
  const { onForce, onPromote, onDiscuss, onGoDeeper, onAddOutcome, onModifyDecision, onAddComment, onViewScopingQA, onReviseNode, onDeleteNode } = actions;
  // Hook must run unconditionally, before the early return below (rules of hooks).
  const hasPausedSession = useContext(PausedGoDeeperContext).has(node.id);
  const isRoot = node.parentId === null;
  if (!onForce && !onPromote && !onDiscuss && !onGoDeeper && !onAddOutcome && !onModifyDecision && !onAddComment && !onViewScopingQA && !onReviseNode && !onDeleteNode) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button
          aria-label={`Actions for "${node.label}"`}
          className={`opacity-40 hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0 w-7 h-7 rounded-md hit-target flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${className || ""}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      } />
      <DropdownMenuContent align="end" className="w-56">
        {onViewScopingQA && node.scopingQA && node.scopingQA.length > 0 && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onViewScopingQA(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <MessagesSquare className="w-3.5 h-3.5 text-indigo-500" /> View scoping conversation
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              Shows the Q&amp;A that led to this node being added via Expand scope — no new call, just a read of what was already asked and answered. No agents involved.
            </TooltipContent>
          </Tooltip>
        )}
        {onReviseNode && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onReviseNode(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <PenLine className="w-3.5 h-3.5 text-emerald-500" /> {node.linkedSectionHeading ? "Revise this section" : "Revise this node"}
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              One targeted edit from a single agent — the section's original author, or the facilitator for a tree node. Changes only what you ask for; doesn't re-run the discussion, check other nodes, or involve the rest of the team. Sees your Knowledge Base if relevant. Use for a wording or reasoning tweak, not a substantive rethink.
            </TooltipContent>
          </Tooltip>
        )}
        {onAddComment && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onAddComment(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <MessageSquarePlus className="w-3.5 h-3.5 text-slate-500" /> View / Add Comments
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              Draft a note on this specific branch — nothing happens until you submit it. Submitting re-runs the FULL discussion with every agent, incorporating your comment alongside anyone else's queued at the same time. Use to flag something for the team's next full pass, not for an instant fix.
            </TooltipContent>
          </Tooltip>
        )}
        {onDiscuss && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onDiscuss(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <MessageCircle className="w-3.5 h-3.5 text-teal-500" /> Let's discuss this
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              Every current team member gives one view each, then the facilitator gives you one consolidated answer — no validation or rebuttal rounds, so it's much cheaper than a full re-discussion. Doesn't change the outcome or tree by itself; any resulting update goes through a separate approval step. Use to ask a question without committing to a change yet.
            </TooltipContent>
          </Tooltip>
        )}
        {onModifyDecision && (onGoDeeper || onAddOutcome) && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onModifyDecision(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                {hasPausedSession ? "Resume expanding scope" : "Modify this decision"}
                {hasPausedSession && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" aria-label="Session in progress" />}
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              Two ways to change this branch: elaborate on what's already here (a short Q&A, then new child nodes — doesn't touch the rest of the tree), or add YOUR OWN outcome the team hasn't considered (they build it out and decide if it should be selected over the existing option(s)). You'll be asked which after clicking.
            </TooltipContent>
          </Tooltip>
        )}
        {onPromote && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem
                onClick={() => !isRoot && onPromote(node)}
                disabled={isRoot}
                title={isRoot ? "Already a top-level decision" : undefined}
                className="text-xs flex items-center gap-2 cursor-pointer"
              >
                <MoveUp className="w-3.5 h-3.5 text-indigo-500" /> Promote to top-level decision
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              One facilitator call that restructures the tree so this becomes its own independent branch instead of a nested one, recalculating probabilities only at its new position. No other agents involved, no re-discussion of the content itself. Use when this deserves its own standing, not a sub-branch of something else.
            </TooltipContent>
          </Tooltip>
        )}
        {onForce && (
          <Tooltip>
            <TooltipTrigger delay={2000} render={
              <DropdownMenuItem onClick={() => onForce(node)} className="text-xs flex items-center gap-2 cursor-pointer">
                <Target className="w-3.5 h-3.5 text-blue-500" /> Force this branch
              </DropdownMenuItem>
            } />
            <TooltipContent side="left" className="max-w-[260px]">
              The expensive option: re-runs the entire discussion from scratch with the FULL team — decomposition, every agent's position, validation rounds, and a new synthesis — treating this branch as a fixed, mandated starting point. Everything downstream can change as a result. Use only when you're certain this should happen and want the team to work out everything that follows from it.
            </TooltipContent>
          </Tooltip>
        )}
        {onDeleteNode && (
          <>
            <DropdownMenuSeparator />
            <Tooltip>
              <TooltipTrigger delay={2000} render={
                <DropdownMenuItem onClick={() => onDeleteNode(node)} className="text-xs flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" /> Delete {isRoot ? "this tab" : "this node"}
                </DropdownMenuItem>
              } />
              <TooltipContent side="left" className="max-w-[260px]">
                Removes {isRoot ? "this entire tab" : "this node"} and everything beneath it — no confirmation dialog, since it's undoable: the "Undo" control above the tree restores exactly this state.
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Non-interactive breadcrumb left at a branch's original position after a cross-tab Move
// (see moveNodeUnderParent in App.tsx). Deliberately NOT a NodeActionsMenu target: no Force,
// no Promote, no comments, no probability — it's bookkeeping, not a decision, and offering
// decision-shaped actions on it would misrepresent what it is. The Jump button is the one
// interactive element, and it targets the real node via onJumpToMovedNode.
const MovedMarkerRow = memo(function MovedMarkerRow({ node, onJump }: { node: DecisionNode; onJump?: (nodeId: string, rootId: string) => void }) {
  if (!node.movedTo) return null;
  const { movedTo } = node;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-500 dark:text-slate-500">
      <Move className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs italic flex-1 min-w-0 break-words">
        Moved to "{movedTo.label}" in the "{movedTo.rootLabel}" tab
      </span>
      {onJump && (
        <button
          onClick={() => onJump(movedTo.nodeId, movedTo.rootId)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
        >
          Jump
        </button>
      )}
    </div>
  );
});

// Flow-view counterpart to MovedMarkerRow — same non-interactive breadcrumb, shaped as a
// card to match FlowNode's boxes rather than DecisionTreeNode's rows. Not draggable: it's
// not a real branch, so there's nothing to move a second time.
const MovedMarkerCard = memo(function MovedMarkerCard({ node, onJump }: { node: DecisionNode; onJump?: (nodeId: string, rootId: string) => void }) {
  if (!node.movedTo) return null;
  const { movedTo } = node;
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 min-w-[130px] max-w-[180px] text-center text-slate-500 dark:text-slate-500">
      <Move className="w-3.5 h-3.5" />
      <span className="text-xs italic leading-snug px-1 whitespace-normal break-words">
        Moved to "{movedTo.label}" in "{movedTo.rootLabel}"
      </span>
      {onJump && (
        <button
          onClick={() => onJump(movedTo.nodeId, movedTo.rootId)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Jump
        </button>
      )}
    </div>
  );
});

const DecisionTreeNode = memo(function DecisionTreeNode({ node, nodes, level = 1, maxLevels = Infinity, actions, commentBadgeMap, isCommentingLocked, showReasonsInline, hideConfidence }: { node: DecisionNode; nodes: DecisionNode[]; level?: number; maxLevels?: number; actions: TreeNodeActions; commentBadgeMap?: Map<string, CommentBadgeState>; isCommentingLocked?: boolean; showReasonsInline?: boolean; hideConfidence?: boolean; key?: string | number }) {
  const { onForce, onPromote, onDiscuss, onGoDeeper, onAddComment, onViewScopingQA, onReviseNode, onJumpToMovedNode } = actions;
  if (node.movedTo) {
    // A marker is always a leaf with no real children (see moveNodeUnderParent), so there's
    // nothing further to recurse into — render the breadcrumb and stop.
    return <MovedMarkerRow node={node} onJump={onJumpToMovedNode} />;
  }
  const children = getTreeChildren(nodes, node.id);
  const hiddenLevels = level >= maxLevels ? getDepthBelow(nodes, node.id) : 0;
  const commentState = commentBadgeMap?.get(node.id) || "none";
  const isRoot = node.parentId === null;
  const isDeEmphasized = !node.isSelected && node.probability <= 25 && !isRoot;
  const chainSelected = children.some(c => subtreeContainsSelected(nodes, c.id));
  return (
    <div className={isDeEmphasized ? "opacity-70" : undefined}>
      <div
        data-node-id={node.id}
        className={`group flex items-center gap-2 rounded-lg border px-3 py-2 ${
          node.contradictionWarning
            ? "border-warning-soft border-l-[3px] border-l-warning bg-warning-soft"
            : node.isSelected
              ? "border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
        }`}
      >
        <GitBranch className={`${isRoot ? "w-4 h-4" : "w-3.5 h-3.5"} flex-shrink-0 ${node.contradictionWarning ? "text-warning" : node.isSelected ? "text-blue-500" : "text-slate-500"}`} />
        <span className={`${isRoot ? "text-sm font-semibold" : "text-xs font-medium"} text-slate-700 dark:text-slate-200 flex-1 min-w-0 break-words`}>{node.label}</span>
        {node.contradictionWarning && (
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] p-3 bg-card border-amber-200 dark:border-amber-800 shadow-xl">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"><span className="font-semibold text-amber-700 dark:text-amber-400">This branch may need reconsidering:</span> {node.contradictionWarning}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {node.mandateNote && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex-shrink-0 cursor-help">mandated</Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] p-3 bg-card border-amber-200 dark:border-amber-800 shadow-xl">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">You mandated this branch. Panel's unforced view: {node.mandateNote}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <CommentBadgeIcon state={commentState} nodeLabel={node.label} onClick={onAddComment ? () => onAddComment(node) : undefined} />
        {onAddComment && commentState === "none" && (
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={() => !isCommentingLocked && onAddComment(node)}
                aria-label={isCommentingLocked ? "Comments open when the run finishes" : `Comment on "${node.label}"`}
                aria-disabled={isCommentingLocked}
                className={`opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${isCommentingLocked ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{isCommentingLocked ? "Comments open when the run finishes" : "Add a comment for the team"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {node.reason && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{node.reason}</p>
              {node.isGeneralKnowledgeContent && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                  Based on general knowledge — not verified against your documents.
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
        <NodeActionsMenu node={node} actions={actions} isCommentingLocked={isCommentingLocked} className="-my-1" />
        {!hideConfidence && (
          <>
            <ProbabilityBar probability={node.probability} isSelected={node.isSelected} isGeneralKnowledgeContent={node.isGeneralKnowledgeContent} />
            {node.isGeneralKnowledgeContent && (
              <span className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 flex-shrink-0">Score</span>
            )}
            <Badge
              variant="outline"
              title={node.isGeneralKnowledgeContent ? "Relevance score for this finding — not a probability of factual accuracy" : undefined}
              className={`text-xs font-mono flex-shrink-0 ${
                node.isSelected
                  ? "border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20"
                  : "text-slate-500"
              }`}
            >
              {node.probability}%
            </Badge>
          </>
        )}
      </div>
      {showReasonsInline && node.isSelected && node.reason && (
        <div className="mt-1 ml-6 mr-2 max-w-3xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{node.reason}</p>
          {node.isGeneralKnowledgeContent && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Based on general knowledge — not verified against your documents.</p>
          )}
        </div>
      )}
      {node.linkedSectionHeading && (
        <p className="mt-1 ml-6 mr-2 text-xs text-violet-500 dark:text-violet-400 flex items-center gap-1">
          <FileText className="w-3 h-3 flex-shrink-0" /> Appears in section: {node.linkedSectionHeading}
        </p>
      )}
      {children.length > 0 && level < maxLevels && (
        <div className={`ml-4 mt-2 pl-4 border-l-2 space-y-2 ${chainSelected ? "border-solid border-blue-300 dark:border-blue-800" : "border-dashed border-slate-200 dark:border-slate-800"}`}>
          {children.map(child => (
            <DecisionTreeNode key={child.id} node={child} nodes={nodes} level={level + 1} maxLevels={maxLevels} actions={actions} commentBadgeMap={commentBadgeMap} isCommentingLocked={isCommentingLocked} showReasonsInline={showReasonsInline} hideConfidence={hideConfidence} />
          ))}
        </div>
      )}
      {hiddenLevels > 0 && (
        <div className="ml-4 mt-2 pl-4 border-l-2 border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 italic">+{hiddenLevels} deeper level{hiddenLevels === 1 ? "" : "s"} — switch to Expanded view</span>
        </div>
      )}
    </div>
  );
});

const FlowNode = memo(function FlowNode({ node, nodes, level = 1, maxLevels = Infinity, actions, commentBadgeMap, isCommentingLocked, drag, hideConfidence }: { node: DecisionNode; nodes: DecisionNode[]; level?: number; maxLevels?: number; actions: TreeNodeActions; commentBadgeMap?: Map<string, CommentBadgeState>; isCommentingLocked?: boolean; drag?: TreeDragHandlers; hideConfidence?: boolean; key?: string | number }) {
  const { onForce, onPromote, onDiscuss, onGoDeeper, onAddComment, onViewScopingQA, onReviseNode, onJumpToMovedNode } = actions;
  const { onMoveNode, draggedNodeId, dragOverNodeId, onDragStartNode, onDragOverNode, onDragEndNode } = drag ?? {};
  if (node.movedTo) {
    return <MovedMarkerCard node={node} onJump={onJumpToMovedNode} />;
  }
  const children = getTreeChildren(nodes, node.id);
  const hiddenLevels = level >= maxLevels ? getDepthBelow(nodes, node.id) : 0;
  const commentState = commentBadgeMap?.get(node.id) || "none";
  const isBeingDragged = draggedNodeId === node.id;
  // A node can't be dropped onto itself — beyond that, invalid targets (descendants of the
  // dragged node) are still visually accepted here for simplicity; the real cycle check
  // happens in handleNodeDrop before anything is asked for confirmation, so an invalid
  // drop just silently does nothing rather than needing two layers of the same check.
  const isValidDropTarget = !!onMoveNode && !!draggedNodeId && draggedNodeId !== node.id;
  const isDragOverTarget = isValidDropTarget && dragOverNodeId === node.id;
  return (
    <div className="flex flex-col items-center">
      <div
        draggable={!!onMoveNode}
        data-node-id={node.id}
        onDragStart={(e) => { e.stopPropagation(); onDragStartNode?.(node.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => onDragEndNode?.()}
        onDragOver={(e) => { if (isValidDropTarget) { e.preventDefault(); onDragOverNode?.(node.id); } }}
        onDragLeave={() => { if (dragOverNodeId === node.id) onDragOverNode?.(null); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isValidDropTarget && draggedNodeId) onMoveNode!(draggedNodeId, node.id);
          onDragEndNode?.();
        }}
        className={`group flex flex-col items-center gap-1 rounded-lg border px-3 py-2 min-w-[130px] max-w-[180px] text-center relative transition-opacity ${
          node.contradictionWarning
            ? "border-warning-soft border-t-[3px] border-t-warning bg-warning-soft"
            : node.isSelected
              ? "border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
        }${isBeingDragged ? " opacity-40" : ""}${isDragOverTarget ? " ring-2 ring-indigo-500 ring-offset-1" : ""}${onMoveNode ? " cursor-grab active:cursor-grabbing" : ""}`}
      >
        <Tooltip>
          <TooltipTrigger>
            <Info className="absolute top-1 right-1 w-3 h-3 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {node.reason || "No additional reasoning provided."}
            </p>
            {node.isGeneralKnowledgeContent && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                Based on general knowledge — not verified against your documents.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
        {(onPromote || onForce || onDiscuss || onAddComment || onGoDeeper || onViewScopingQA) ? (
          <div className="absolute -top-1 -left-1">
            <NodeActionsMenu node={node} actions={actions} isCommentingLocked={isCommentingLocked} className="bg-white dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800" />
          </div>
        ) : null}
        {commentState !== "none" && (
          // Bottom-left is the one corner not already claimed by the Info tooltip
          // (top-right) or the actions menu (top-left) — bottom-right previously collided
          // with the probability badge sitting at the base of the card.
          <div className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-950 rounded-full p-0.5 shadow-sm border border-slate-200 dark:border-slate-800">
            <CommentBadgeIcon state={commentState} nodeLabel={node.label} onClick={onAddComment ? () => onAddComment(node) : undefined} />
          </div>
        )}
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug px-2 whitespace-normal break-words">{node.label}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {node.mandateNote && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 cursor-help">mandated</Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] p-3 bg-card border-amber-200 dark:border-amber-800 shadow-xl">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">You mandated this branch. Panel's unforced view: {node.mandateNote}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {!hideConfidence && node.isGeneralKnowledgeContent && (
            <span className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Score</span>
          )}
          {!hideConfidence && (
            <Badge
              variant="outline"
              title={node.isGeneralKnowledgeContent ? "Relevance score for this finding — not a probability of factual accuracy" : undefined}
              className={`text-xs font-mono ${
                node.isSelected
                  ? "border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20"
                  : "text-slate-500"
              }`}
            >
              {node.probability}%
            </Badge>
          )}
        </div>
        {!hideConfidence && (
          <ProbabilityBar probability={node.probability} isSelected={node.isSelected} isGeneralKnowledgeContent={node.isGeneralKnowledgeContent} />
        )}
      </div>
      {children.length > 0 && level < maxLevels && (
        <>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-start gap-6">
            {children.map(child => (
              <FlowNode key={child.id} node={child} nodes={nodes} level={level + 1} maxLevels={maxLevels} actions={actions} commentBadgeMap={commentBadgeMap} isCommentingLocked={isCommentingLocked} drag={drag} hideConfidence={hideConfidence} />
            ))}
          </div>
        </>
      )}
      {hiddenLevels > 0 && (
        <>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 italic whitespace-nowrap">+{hiddenLevels} deeper level{hiddenLevels === 1 ? "" : "s"}</span>
        </>
      )}
    </div>
  );
});

export function DecisionTreeSection({
  decisionTree,
  actions,
  drag,
  nodeComments = [],
  isCommentingLocked,
  onSubmitBatch,
  treeViewMode,
  onTreeViewModeChange,
  detailMode,
  onDetailModeChange,
  isOpen,
  onOpenChange,
  onAddTab,
  focusRootId,
  onFocusRootHandled,
  simpleLabels = false,
  hideConfidence = false
}: {
  decisionTree: DecisionNode[];
  /** Per-node action handlers, bundled — see TreeNodeActions. Memoise at the call site. */
  actions: TreeNodeActions;
  /** Drag-and-drop "Move Decision" state — Flow view only. See TreeDragHandlers. */
  drag?: TreeDragHandlers;
  nodeComments?: NodeCommentLike[];
  isCommentingLocked?: boolean;
  onSubmitBatch?: (selectedIds?: string[]) => void;
  treeViewMode: "tree" | "flow";
  onTreeViewModeChange: (v: "tree" | "flow") => void;
  detailMode: "simple" | "expanded";
  onDetailModeChange: (v: "simple" | "expanded") => void;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  /** Click handler for the "+ New Tab" control — same drop target as before still works
   *  alongside it. Omit to hide the click affordance entirely (e.g. mid-discussion). */
  onAddTab?: () => void;
  /** Set by the caller right after a new tab is created (or any other change to which root
   *  should be showing); this component owns activeRootIndex, so it watches this and jumps
   *  to the matching tab, then reports back via onFocusRootHandled so the caller can clear it. */
  focusRootId?: string | null;
  onFocusRootHandled?: () => void;
  /** Item #2 from the QA roadmap — swaps a handful of the most jargon-heavy labels this
   *  section renders for plain-language ones. Deliberately narrow: just the header here,
   *  not a full re-skin of every string in this file. */
  simpleLabels?: boolean;
  /** Item #3 from the QA roadmap — "brainstorm mode": hides every confidence percentage/bar
   *  in the tree, for prompts where being scored feels wrong (creative/ideation asks) rather
   *  than a genuine probability the manager wants to weigh. */
  hideConfidence?: boolean;
}) {
  const { onPromote, onAddComment } = actions;
  const [hideConfidenceLocal, setHideConfidenceLocal] = useState(hideConfidence);
  const { onMoveNode, draggedNodeId, dragOverNodeId, onDragOverNode, onDragEndNode } = drag ?? {};
  // "Explain path": renders each selected-path node's reason inline beneath it, so the
  // winning route plus its rationale reads top-to-bottom as one narrative instead of a
  // series of hover-tooltip peepholes (which touch devices can't reach at all).
  const [showReasonsInline, setShowReasonsInline] = useState(false);
  // Declared before any early return so hooks are always called in the same order,
  // regardless of whether this tree turns out to be empty.
  const [activeRootIndex, setActiveRootIndex] = useState(0);
  // Cross-tab "Move Decision": dropping a dragged node onto a DIFFERENT tab's label opens
  // this picker to choose the exact destination within that tab, since Flow view only ever
  // mounts the active tab's nodes — there's nothing to drop directly onto in a tab that
  // isn't showing. draggedId is captured at drop time rather than read live later, since
  // the native dragend event (which clears the top-level draggedNodeId) fires before the
  // manager gets a chance to make a selection in this picker.
  const [crossTabPicker, setCrossTabPicker] = useState<{ targetRoot: DecisionNode; draggedId: string } | null>(null);
  // Both memoized on decisionTree specifically — previously recomputed via a fresh full
  // traversal on every render regardless of whether the tree itself had changed.
  const rootNodes = useMemo(() => getTreeChildren(decisionTree, null), [decisionTree]);
  const treeDepth = useMemo(() => getTreeDepth(decisionTree), [decisionTree]);
  // One O(n) pass over comments instead of every node independently filtering the full
  // array — see buildCommentBadgeMap.
  const commentBadgeMap = useMemo(() => buildCommentBadgeMap(nodeComments), [nodeComments]);
  // Jumps to a newly-created (or otherwise externally-designated) tab once it exists in
  // rootNodes, then tells the caller it's been handled so focusRootId can be cleared —
  // otherwise re-selecting the same tab id a second time later wouldn't re-trigger anything.
  useEffect(() => {
    if (!focusRootId) return;
    const targetIndex = rootNodes.findIndex(r => r.id === focusRootId);
    if (targetIndex !== -1) setActiveRootIndex(targetIndex);
    onFocusRootHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRootId, rootNodes]);
  if (rootNodes.length === 0) return null;
  const isDeepTree = treeDepth > SIMPLE_TREE_MAX_LEVELS;
  const maxLevels = isDeepTree && detailMode === "simple" ? SIMPLE_TREE_MAX_LEVELS : Infinity;
  // Side-by-side is the whole point of Flow view — showing every independent axis's
  // subtree at once is what made "Expanded" more informative than the flat list. Tabs
  // (one axis at a time) only kick in once there are genuinely too many to fit — with the
  // previous threshold of ">1", even a 2-axis tree lost half its content to a tab switcher
  // by default, which is very likely what "I only see a small number of decisions now" was
  // describing: the feature wasn't removed, but showing one axis at a time made trees that
  // used to display fully now show a fraction of themselves until you clicked through.
  // Flow view uses tabs (one axis at a time) whenever there's more than one root axis —
  // reverted from a side-by-side-up-to-3 layout after real use showed that even 2-3 full
  // subtrees rendered together still overflowed the viewport on anything but a very wide
  // monitor, which defeated the point of "everything fits on screen." List/Simple view is
  // the always-complete view: it renders every root axis unconditionally, with no tabbing
  // at any count — so switching to List always shows everything at once if tabs feel like
  // they're hiding content.
  const hasMultipleAxes = treeViewMode === "flow" && rootNodes.length > 1;
  const safeActiveIndex = Math.min(activeRootIndex, rootNodes.length - 1);
  // Switches to the destination's tab (Flow view only — List/Simple view always renders
  // every axis already) then scrolls the real node into view with a brief highlight, so a
  // "Jump" click from a moved-branch marker lands somewhere visibly findable rather than a
  // silent tab switch with no confirmation of where it landed.
  const jumpToMovedNode = (nodeId: string, rootId: string) => {
    const targetIndex = rootNodes.findIndex(r => r.id === rootId);
    if (targetIndex !== -1) setActiveRootIndex(targetIndex);
    // Flow view unmounts every tab but the active one, so the destination node may not exist
    // in the DOM on this same tick — a frame for the tab switch to render, then a short delay
    // for the resulting layout to settle, before trying to find and scroll to it.
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-indigo-500", "ring-offset-1");
        setTimeout(() => el.classList.remove("ring-2", "ring-indigo-500", "ring-offset-1"), 1500);
      }, 60);
    });
  };
  // Merged bundle handed to children — App owns the per-node action handlers (Force,
  // Promote, ...), this section owns the one action that's genuinely local to it (tab
  // state), and both flow down through the same TreeNodeActions object.
  const sectionActions: TreeNodeActions = { ...actions, onJumpToMovedNode: jumpToMovedNode };
  const draftCount = nodeComments.filter(c => c.status === "draft").length;
  const [isDraftListExpanded, setIsDraftListExpanded] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-muted-foreground" /> {simpleLabels ? "How The Team Reasoned Through This" : "Decision Tree"}
          <CountTag>{treeDepth} level{treeDepth === 1 ? "" : "s"}</CountTag>
        </h3>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={
              <button
                onClick={() => setHideConfidenceLocal(v => !v)}
                className={`flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-medium transition-colors ${hideConfidenceLocal ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Lightbulb className="w-3.5 h-3.5" /> Brainstorm mode
              </button>
            } />
            <TooltipContent side="bottom" className="max-w-[220px]">
              Hides every confidence percentage in this tree — for ideation-style prompts where being scored feels wrong, not a genuine probability you want to weigh.
            </TooltipContent>
          </Tooltip>
          {isDeepTree && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
              <button
                onClick={() => onDetailModeChange("simple")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${ detailMode ==="simple" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
              >
                Simple
              </button>
              <button
                onClick={() => onDetailModeChange("expanded")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${ detailMode ==="expanded" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
              >
                Expanded
              </button>
            </div>
          )}
          {treeViewMode === "tree" && (
            <button
              onClick={() => setShowReasonsInline(v => !v)}
              aria-pressed={showReasonsInline}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${showReasonsInline ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Info className="w-3 h-3" /> Explain path
            </button>
          )}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
            <button
              onClick={() => onTreeViewModeChange("tree")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${ treeViewMode ==="tree" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
            >
              <ListTree className="w-3 h-3" /> Tree
            </button>
            <button
              onClick={() => onTreeViewModeChange("flow")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${ treeViewMode ==="flow" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
            >
              <Workflow className="w-3 h-3" /> Flow
            </button>
          </div>
          <CollapsibleTrigger render={
            <Button variant="ghost" size="icon" aria-label={isOpen ? "Collapse decision tree" : "Expand decision tree"} className="w-7 h-7 rounded-lg hit-target text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          } />
        </div>
      </div>
      {draftCount > 0 && onSubmitBatch && (() => {
        const draftList = nodeComments.filter(c => c.status === "draft");
        return (
          <div className="mt-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
            <button
              onClick={() => {
                if (!isDraftListExpanded) setSelectedDraftIds(new Set(draftList.map(c => c.id)));
                setIsDraftListExpanded(!isDraftListExpanded);
              }}
              className="w-full flex items-center justify-between gap-2 p-2.5 text-left"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-slate-500" /> {draftCount} draft comment{draftCount === 1 ? "" : "s"} not yet sent
              </span>
              {isDraftListExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
            </button>
            {isDraftListExpanded && (
              <div className="px-2.5 pb-2.5 space-y-2">
                {/* Defaults to every draft checked — submitting without ever opening this
                    list behaves exactly as it always has. Unchecking one leaves it as a
                    draft, untouched, for a later batch — not lost, not sent. */}
                <ul className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {draftList.map(c => (
                    <li key={c.id}>
                      <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedDraftIds.has(c.id)}
                          onChange={(e) => {
                            setSelectedDraftIds(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(c.id); else next.delete(c.id);
                              return next;
                            });
                          }}
                          className="mt-0.5 w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">{c.nodeLabel}</span>
                          <span className="block text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedDraftIds(selectedDraftIds.size === draftList.length ? new Set() : new Set(draftList.map(c => c.id)))}
                    className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedDraftIds.size === draftList.length ? "Deselect all" : "Select all"}
                  </button>
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button
                        size="sm"
                        disabled={isCommentingLocked || selectedDraftIds.size === 0}
                        onClick={() => onSubmitBatch(Array.from(selectedDraftIds))}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <MessageCircle className="w-3 h-3" /> Discuss Selected ({selectedDraftIds.size})
                      </Button>
                    } />
                    <TooltipContent side="top" className="max-w-[220px]">
                      Re-opens the full panel discussion so the whole team can debate the selected feedback together — the outcome, reasons, and tree can all change as a result. Unselected comments stay queued as drafts.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      <CollapsibleContent>
        <div className={`mt-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${treeViewMode === "tree" ? "space-y-2" : "overflow-x-auto custom-scrollbar"}`}>
          {treeViewMode === "tree" ? (
            rootNodes.map(node => (
              <DecisionTreeNode key={node.id} node={node} nodes={decisionTree} maxLevels={maxLevels} actions={sectionActions} commentBadgeMap={commentBadgeMap} isCommentingLocked={isCommentingLocked} showReasonsInline={showReasonsInline} hideConfidence={hideConfidenceLocal} />
            ))
          ) : (
            <>
              {hasMultipleAxes && (
                <div className="flex items-center gap-1 mb-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
                  {rootNodes.map((node, i) => {
                    const isCrossTabDropTarget = !!onMoveNode && !!draggedNodeId && draggedNodeId !== node.id && i !== safeActiveIndex;
                    const isCrossTabDragOver = isCrossTabDropTarget && dragOverNodeId === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setActiveRootIndex(i)}
                        onDragOver={(e) => { if (isCrossTabDropTarget) { e.preventDefault(); onDragOverNode?.(node.id); } }}
                        onDragLeave={() => { if (dragOverNodeId === node.id) onDragOverNode?.(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (isCrossTabDropTarget && draggedNodeId) {
                            // Captured now — draggedNodeId will already be cleared by the
                            // time the manager picks a destination from the picker below.
                            setCrossTabPicker({ targetRoot: node, draggedId: draggedNodeId });
                          }
                          onDragEndNode?.();
                        }}
                        className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                          i === safeActiveIndex
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }${isCrossTabDragOver ? " bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-400" : ""}`}
                      >
                        {node.label.length > 32 ? `${node.label.slice(0, 32)}…` : node.label}
                      </button>
                    );
                  })}
                  {(onMoveNode && onPromote || onAddTab) && (() => {
                    const isNewTabDragOver = !!draggedNodeId && dragOverNodeId === "__new_tab__";
                    return (
                      // Now a real button — it has a genuine onClick (start a new tab from
                      // scratch) as well as still being a drop target (drag an existing node
                      // here to promote it into its own tab), so it should carry normal
                      // button affordances again, not the inert-div treatment the pure drop
                      // target used before onAddTab existed.
                      <button
                        onClick={() => { if (!draggedNodeId) onAddTab?.(); }}
                        onDragOver={(e) => { if (draggedNodeId) { e.preventDefault(); onDragOverNode?.("__new_tab__"); } }}
                        onDragLeave={() => { if (dragOverNodeId === "__new_tab__") onDragOverNode?.(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedNodeId && onMoveNode && onPromote) {
                            const draggedNode = decisionTree.find(n => n.id === draggedNodeId);
                            if (draggedNode) onPromote(draggedNode);
                          }
                          onDragEndNode?.();
                        }}
                        className={`my-1 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg border border-dashed transition-colors flex-shrink-0 flex items-center gap-1 ${
                          isNewTabDragOver
                            ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400 text-indigo-600 dark:text-indigo-400"
                            : draggedNodeId
                              ? "border-indigo-300 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400" // a drag is happening elsewhere — invite it over
                              : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400" // resting: still reads as a drop outline, but now also an inviting clickable action
                        }`}
                        title={onAddTab ? "Click to start a new decision from scratch, or drag an existing node here to make it its own tab" : "Drag a node here to make it its own top-level decision"}
                      >
                        {isNewTabDragOver ? <CornerDownRight className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isNewTabDragOver ? "Drop to make a new tab" : "New Tab"}
                      </button>
                    );
                  })()}
                </div>
              )}
              <div className="flex items-start justify-center gap-8 min-w-max py-2 px-2">
                {(hasMultipleAxes ? [rootNodes[safeActiveIndex]] : rootNodes).map((node, i) => (
                  <div key={node.id} className={!hasMultipleAxes && i > 0 ? "pl-8 -ml-8 border-l border-slate-200 dark:border-slate-800" : undefined}>
                    <FlowNode node={node} nodes={decisionTree} maxLevels={maxLevels} actions={sectionActions} commentBadgeMap={commentBadgeMap} isCommentingLocked={isCommentingLocked} drag={drag} hideConfidence={hideConfidenceLocal} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
      {/* Cross-tab "Move Decision" picker: opened by dropping a dragged node onto a
          different tab's label. Lists every node in that tab (indented by depth) since Flow
          view doesn't mount other tabs' nodes to drop directly onto. Selecting one routes
          through the exact same onMoveNode/handleNodeDrop validation and confirmation as an
          ordinary in-tab drop — this picker only supplies the destination, nothing else
          about the move mechanism is different. */}
      <Dialog open={!!crossTabPicker} onOpenChange={(open) => { if (!open) setCrossTabPicker(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Move className="w-4 h-4 text-indigo-500" /> Move To Which Decision?
            </DialogTitle>
            <DialogDescription className="text-xs">Pick where in "{crossTabPicker?.targetRoot.label}" this should go.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {crossTabPicker && flattenSubtree(decisionTree, crossTabPicker.targetRoot.id).map(({ node, depth }) => (
              <button
                key={node.id}
                onClick={() => {
                  const { draggedId } = crossTabPicker;
                  setCrossTabPicker(null);
                  onMoveNode?.(draggedId, node.id);
                }}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                className="w-full text-left py-2 pr-3 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors truncate"
              >
                {node.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
