import { useState, useEffect, useMemo, useCallback, useRef, memo, createContext, useContext, ChangeEvent, type ReactNode } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  LayoutGrid, 
  MessageSquare,
  Sparkles,
  Cpu,
  Zap,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Moon,
  Sun,
  PlusCircle,
  Pin,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Share2,
  Star,
  Maximize2,
  Lock,
  Repeat,
  Info,
  Camera,
  Save,
  Check,
  ListPlus,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  Scale,
  AlertTriangle,
  Hand,
  SendHorizontal,
  Eraser,
  ArrowRight,
  GitCompareArrows,
  Calculator,
  Users,
  GitBranch,
  Clock,
  MessagesSquare,
  Layers,
  Wand2,
  Youtube,
  HardDrive,
  Github,
  FileArchive,
  CalendarDays,
  Mail,
  ClipboardPaste,
  NotebookText,
  Workflow,
  ListTree,
  Link2,
  History,
  LogIn,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Bug,
  Copy,
  Image as ImageIcon,
  Bookmark,
  FolderOpen,
  Square,
  Target,
  MessageSquareText,
  Download,
  FilePlus2,
  FileSpreadsheet,
  Presentation,
  MoveUp,
  SkipForward,
  MoreVertical,
  Search,
  Pencil,
  MessageCircle,
  ClipboardList,
  Lightbulb,
  ListChecks,
  Move,
  CornerDownRight,
  Settings2,
  PenLine,
  Atom,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Orchestra wordmark: three overlapping figures — the team — with the facilitator picked
// out in front in the sky accent. Inline SVG (not a hosted image) so it stays crisp, themes
// with dark mode, and never depends on a third-party CDN being up.
function OrchestraWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none shrink-0">
      <svg viewBox="0 0 28 28" className={compact ? "w-5 h-5" : "w-7 h-7"} aria-hidden="true">
        <circle cx="8.5" cy="10.5" r="4.5" className="fill-slate-900 dark:fill-slate-100" />
        <circle cx="19.5" cy="10.5" r="4.5" className="fill-slate-900 dark:fill-slate-100" />
        <path d="M2 25c0-4.5 3-7.5 7-7.5" strokeWidth="3.4" fill="none" strokeLinecap="round" className="stroke-slate-900 dark:stroke-slate-100" />
        <path d="M26 25c0-4.5-3-7.5-7-7.5" strokeWidth="3.4" fill="none" strokeLinecap="round" className="stroke-slate-900 dark:stroke-slate-100" />
        <circle cx="14" cy="9.5" r="5.5" className="fill-blue-600" />
        <path d="M5 26.5c0-6 4-9.8 9-9.8s9 3.8 9 9.8" strokeWidth="3.6" fill="none" strokeLinecap="round" className="stroke-blue-600" />
      </svg>
      <span className={`font-heading font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100 ${compact ? "text-base" : "text-[1.3rem]"}`}>
        Orchestra
      </span>
    </div>
  );
}

// Primary navigation, rendered as header pills (desktop) and a scrollable row (mobile).
// Agent Comparison Playground lives here (not the profile menu) so the profile menu can
// stay strictly account actions — Settings, session status, Log out — rather than mixing
// "another workspace" with "sign out" under one affordance.
const NAV_ITEMS = [
  { id: "custom", label: "Multi Agent Team", icon: Users },
  { id: "product", label: "Product", icon: Sparkles },
  { id: "enquiries", label: "Enquiries", icon: Inbox },
  { id: "history", label: "History", icon: History },
] as const;
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { generateGeminiContent, generateImageContent } from "@/src/lib/gemini";
import type { OfficeKind, GeneratedFile, DocSpec, SpreadsheetSpec, DeckSpec } from "@/src/lib/officeFiles";
import { validateDocSpec, validateSpreadsheetSpec, validateDeckSpec, verifySpecAgainstSource, checkClaimsAgainstNumbers, extractSignificantNumbers, findNumberSpans } from "@/src/lib/fileVerification";
import { compareRuns } from "@/src/lib/runCompare";
import { buildDeliverableDecisionTree } from "@/src/lib/deliverableTree";
import { PROMPT_EXPANSION_SYSTEM_INSTRUCTION, detectRoleAssignmentLanguage } from "@/src/lib/promptExpansion";
import {
  buildGoDeeperQuestionInstruction,
  parseGoDeeperQuestionResponse,
  buildGoDeeperSynthesisInstruction,
  parseGoDeeperSynthesisResponse,
  type GoDeeperQA
} from "@/src/lib/goDeeper";
import { runCalculation } from "@/src/lib/calculations";
import { classifyAgentError, unrecoverableErrorGuidance } from "@/src/lib/errorClassification";
import { buildDocx, buildXlsx, buildPptx, detectFileRequest } from "@/src/lib/officeFiles";
import type { DecisionNode } from "@/src/lib/treeUtils";
import { getTreeChildren, getTreeDepth, getDepthBelow, getAncestorLabels, isNodeOrDescendant, computeLostCuratedContent, flattenSubtree, looksLikeAlternativesSiblingMove, getRootAncestor } from "@/src/lib/treeUtils";
import { extractJson, truncateText } from "@/src/lib/textUtils";
import { ConfirmActionDialog } from "@/src/components/ConfirmActionDialog";
import { CountTag } from "@/src/components/CountTag";
import { DecisionTreeSection, PausedGoDeeperContext, SIMPLE_TREE_MAX_LEVELS, type TreeNodeActions } from "@/src/components/tree/DecisionTree";

import { validateTreeRestructureResponse, validateSectionRevisionResponse, validateNodeRevisionResponse } from "@/src/lib/modelResponses";
import { buildDecompositionInstruction, normalizeDecompositionResponse, buildAxesBlock, type DecisionAxis, type TaskType } from "@/src/lib/decomposition";
import { getNewKnowledgeSourceIds } from "@/src/lib/knowledgeStaleness";
import { buildAlreadyCoveredBlock } from "@/src/lib/alreadyCovered";
import { withTimeoutSignal, DEFAULT_MODEL_CALL_TIMEOUT_MS } from "@/src/lib/abortUtils";
import { auth, db } from "@/src/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile, updatePassword, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, collection, query, orderBy, limit as fsLimit, getDocs, writeBatch } from "firebase/firestore";
import { AuthScreen } from "@/src/components/AuthScreen";
import { DebugPanel, type DebugLogEntry } from "@/src/components/DebugPanel";
import { CreateFileMenu, GeneratedFileCard } from "@/src/components/OfficeFileControls";
import { useNodeComments } from "@/src/hooks/useNodeComments";
import { applyChangesToRun } from "@/src/lib/gatekeeperMerge";
import { ProductTab } from "@/src/components/product/ProductTab";
import { DEFAULT_PRODUCT_AGENTS } from "@/src/lib/productSpecTypes";
import type { ProductSpec } from "@/src/lib/productSpecTypes";
import { wouldExceedHistoryStorageLimits, capSpecForHistoryStorage, SAFE_HISTORY_DOC_BUDGET_CHARS } from "@/src/lib/productSpecTypes";
import { isLikelyTextSourceFile, prioritizeCodebasePaths, buildCodebaseDigest, type CodebaseFileEntry } from "@/src/lib/codebaseIngest";
import { buildProductSpecDocx } from "@/src/lib/productSpecExport";
import { EnquiryHub } from "@/src/components/briefbridge/EnquiryHub";
import { PublicIntakePortal } from "@/src/components/briefbridge/PublicIntakePortal";

// Caps how many agent calls within a single round are actually in flight at once. Firing
// every panelist's call simultaneously (the previous behaviour) means a 6-agent team sends
// 6 concurrent requests to the same provider in the same instant — bursty concurrent load
// like that is exactly the shape that trips a provider's demand-shedding/rate-limiting
// fastest, on top of just being more requests to lose if a spike is already underway.
// Capping concurrency spreads a round's calls out over a few seconds instead, without
// changing anything else about the round (same agents, same prompts, same results once
// settleRound collects them) — see mapWithConcurrency below for the mechanism.
export const AGENT_CALL_CONCURRENCY = 3;

// Drop-in replacement for `items.map(async (item) => ...)` that still returns one Promise
// per item, in original order (so every existing call site — settleRound, Promise.all,
// whatever consumes the returned array — needs no changes downstream), but never lets more
// than `limit` of the underlying async operations run at the same time. The rest queue and
// start as earlier ones finish.
export function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R>[] {
  let nextIndex = 0;
  const results: Promise<R>[] = new Array(items.length);
  const resolvers: ((value: R) => void)[] = new Array(items.length);
  const rejecters: ((reason?: any) => void)[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    results[i] = new Promise<R>((resolve, reject) => { resolvers[i] = resolve; rejecters[i] = reject; });
  }
  const runNext = () => {
    if (nextIndex >= items.length) return;
    const i = nextIndex++;
    fn(items[i], i).then(
      (value) => { resolvers[i](value); runNext(); },
      (err) => { rejecters[i](err); runNext(); }
    );
  };
  for (let i = 0; i < Math.min(limit, items.length); i++) runNext();
  return results;
}

// Fast-path heuristic for #6 in the QA-driven roadmap: a short, KB-less, single-question
// prompt is very likely a simple/low-stakes call that doesn't need the full clarifying-
// question ritual or a stretched-out multi-axis tree. Deliberately conservative — errs
// toward the FULL flow whenever there's real signal of complexity (a KB attached, a long
// prompt, or more than one question mark suggesting a genuinely compound ask), since a
// false "yes, this is simple" costs more (a shallow answer to something that needed depth)
// than a false "no, treat it as complex" (one extra round of questions on something simple).
export function isLowStakesPrompt(prompt: string, hasKnowledgeBase: boolean): boolean {
  const trimmed = prompt.trim();
  if (hasKnowledgeBase || !trimmed) return false;
  if (trimmed.length > 140) return false;
  const questionMarks = (trimmed.match(/\?/g) || []).length;
  if (questionMarks > 1) return false;
  return true;
}

export function cleanUndefined<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null) {
    return null as any;
  }
  if (Array.isArray(val)) {
    return val.map(cleanUndefined) as any;
  }
  if (typeof val === "object") {
    const proto = Object.getPrototypeOf(val);
    if (proto !== null && proto !== Object.prototype) {
      return val; // Don't modify class instances, Date, Firestore FieldValue, etc.
    }
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      const v = (val as any)[key];
      if (v !== undefined) {
        cleaned[key] = cleanUndefined(v);
      }
    }
    return cleaned;
  }
  return val;
}

interface AgentResult {
  text: string;
  image?: string;
  isToolCall?: boolean;
}

interface Results {
  gemini: string | AgentResult;
  anthropic: string | AgentResult;
  openai: string | AgentResult;
  perplexity: string | AgentResult;
  grok: string | AgentResult;
}

export interface CustomAgent {
  id: string;
  provider: "gemini" | "anthropic" | "openai" | "perplexity" | "grok";
  model: string;
  name: string;
  persona: string;
  // Optional per-agent sampling temperature (0-1). Unset means "use the provider's default".
  temperature?: number;
}

// Minimal shareable read access (Phase 3 roadmap, round 2, item #3). Deliberately a
// snapshot, not a live reference to the run — sharing publishes a point-in-time copy of
// exactly these fields, nothing more (no knowledge base content, no chat thread, no
// internal ids). Explicitly scoped to READ-ONLY: this does not implement commenting.
// A real "named collaborator can comment" flow needs its own auth/identity and moderation
// surface that would be irresponsible to ship without live testing against real accounts —
// shipping read-only now, honestly, is better than a half-built comment system.
interface SharedRunSnapshot {
  token: string;
  prompt: string;
  outcome: string;
  reasons: string[];
  decisionTree: DecisionNode[];
  facilitatorAgentName?: string;
  dissent?: DissentEntry[];
  considerations?: Consideration[];
  rounds: number;
  sharedAt: string;
  // Grounding status carried across the sharing boundary (Phase 4 roadmap #1) — previously
  // a recipient had no way to know whether the decision they were reading had ever been
  // checked against real source material at all.
  groundedSourceCount: number;
  hadVerifiedCalculations: boolean;
  // Lifecycle (Phase 4 roadmap, share-link expiry/revocation): a permanent, un-revocable
  // link was a real confidentiality concern for legal/finance/government use. undefined
  // expiresAt means "never expires" (an explicit choice at share time, not a silent default).
  ownerUid: string;
  expiresAt?: string;
  revoked?: boolean;
}

interface SavedTeam {
  id: string;
  name: string;
  agents: CustomAgent[];
  createdAt: string;
}

// Saved Knowledge Base setups ("My Files"). Unlike SavedTeam (which embeds full agent
// objects because Team Agents rosters are genuinely swappable per-conversation state),
// this ALSO embeds full file content rather than just referencing ids — deliberately.
// The Knowledge Base list (`knowledgeFiles`) is a single shared, permanent library synced
// 1:1 with Firestore (deleting a file here actually deletes it, there's no separate
// "active vs. archived" concept). A reference-only saved set would break the moment a
// referenced file was later removed from that shared library — and the whole point of
// "load this setup again without re-uploading" is that it keeps working regardless of
// what happens to the live library afterward.
interface SavedKnowledgeSet {
  id: string;
  name: string;
  files: KnowledgeFile[];
  createdAt: string;
}

// Client/Project Presets (Phase 4 roadmap): recurring-workflow users (consultants, legal,
// finance) were saving a team AND a knowledge set separately every time, then applying both
// every time — two saves and two loads for what's conceptually one "client type" or
// "project type." A preset bundles both into one save and one apply. Deliberately embeds
// full team/file content (like SavedTeam and SavedKnowledgeSet each already do) rather than
// referencing them by id — a preset should keep working even if the original standalone
// saved team/set it was created from is later renamed or deleted.
interface SavedPreset {
  id: string;
  name: string;
  agents: CustomAgent[];
  files: KnowledgeFile[];
  createdAt: string;
}

export type KnowledgeSourceType = "file" | "image" | "web" | "website" | "youtube" | "google_drive" | "google_calendar" | "gmail" | "text" | "notebooklm" | "github" | "codebase_zip";
export type DiscussionDepth = "fast" | "deep" | "extended";

export interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  size: number;
  uploadedAt: string;
  sourceType: KnowledgeSourceType;
  url?: string;
  targetTab?: "custom" | "product" | "all";
}

// A distinct decision axis identified by the decomposition step, before any discussion
// happens. "independent" axes should surface as separate root-level branches in the final
// tree rather than being forced under a single hierarchy; "priority" guides how much
// discussion depth an axis deserves. For Deliverable tasks, each axis doubles as a candidate
// section, and suggestedAgentName is a starting-point authorship guess the outline stage can
// confirm or reassign.


// One section of a Deliverable-type output, drafted directly by the team member best suited
// to it rather than argued over by the whole panel.
interface DeliverableSection {
  id: string;
  heading: string;
  authorAgentId: string;
  authorAgentName: string;
  content: string;
}

interface DeliverableSpec {
  title: string;
  subtitle?: string;
  sections: DeliverableSection[];
}

// A Deliverable outline awaiting manager sign-off before the team spends effort drafting full
// section content. Holds everything needed to resume the discussion once approved, since the
// run that produced it has already finished (loading goes back to false while it waits).
interface PendingOutlineSection {
  id: string;
  heading: string;
  brief: string;
  independent: boolean;
  authorAgentId: string;
}
interface PendingDeliverableOutline {
  title: string;
  subtitle?: string;
  sections: PendingOutlineSection[];
  transcript: CollaborativeTranscriptEntry[];
  axes: DecisionAxis[];
  roundsRun: number;
  forcedConstraint?: string;
  startedAt: number;
  knowledgeContext: string;
  resourceScope: string;
  depthInstruction: string;
  // Who compiled this outline — so the drafting continuation is run by the same facilitator.
  facilitatorAgentName?: string;
  // Whether the manager explicitly picked "Deliverable" pre-discussion or the decomposition
  // step classified it that way itself (manager picked "Let the team decide").
  taskTypeSource: "manager" | "auto";
  requirementsLog: RequirementEntry[];
}

// Decision-path counterpart to PendingDeliverableOutline — the same "review before the team
// spends effort" pause, applied to the identified decision axes instead of deliverable
// sections. Deliberately much thinner: this pause happens right after decomposition, before
// any position statements or transcript exist, so there's nothing accumulated to preserve —
// just the axes themselves and the original call's arguments, replayed verbatim on approval
// (see approveAxesAndDiscuss) so resuming is indistinguishable from the original call except
// for skipping decomposition a second time.
interface PendingDecisionAxes {
  axes: DecisionAxis[];
  taskTypeSource: "manager" | "auto";
  forcedConstraint?: string | null;
  premiseAmendments?: string | null;
  managerFeedback?: string | null;
  promptOverride?: string | null;
  blockingAnswer?: { statusNote: string; answer: string } | null;
  requirementEntries?: { label: string; text: string; sourceType?: RequirementEntry["sourceType"] }[] | null;
}

// A snapshot of a run's outcome/deliverable taken immediately before a pivot (Force, Promote,
// Discuss, or a Chat With The Team revision) overwrites it — so a manager who pivots can still
// see what the team originally thought, instead of that context simply disappearing.
interface RunRevisionSnapshot {
  timestamp: string;
  trigger: string;
  outcome: string;
  reasons: string[];
  decisionTree: DecisionNode[];
  deliverable?: DeliverableSpec;
}

// The team's own read on whether this result is complete, or whether they need something
// from the manager before it truly is — surfaced distinctly rather than folded silently into
// the answer text, so a genuine blocker doesn't read the same as a routine response.
// "in_progress" and "failed" back a run that's been checkpointed to Chat History before it
// finished — see checkpointRun in runCollaborativeSession. Every existing check in the
// codebase only ever tests `=== "needs_input"`, so these two new values fall through to the
// same rendering path "delivered" already used — they render fine today, deliberately, with
// no special-casing required elsewhere.
type RunStatus = "delivered" | "needs_input" | "in_progress" | "failed";

// A premise the panel weighed while reaching its decisions — an assumption, risk, constraint,
// or tradeoff — kept as its own entity rather than folded into a DecisionNode's `reason`
// string. That distinction is the whole point: a single consideration can bear on several
// branches at once (linkedNodeIds), can be disputed without disputing the branch it
// influenced, and survives even if it applied to a branch that wasn't selected. Only
// generated at Deep/Extended discussion depth, where real cross-examination actually
// produces this kind of material — Fast depth's single round rarely surfaces enough to make
// extracting it worthwhile.
interface Consideration {
  id: string;
  text: string;
  category: "assumption" | "risk" | "constraint" | "tradeoff";
  raisedByAgentId: string;
  linkedNodeIds: string[];
  // The facilitator's own judgment that this is uncertain/consequential enough to put in
  // front of the manager proactively (via the post-outcome check-in) rather than only being
  // reachable by a manager who goes looking for the full list.
  flaggedForReview: boolean;
  // 2-3 short alternative positions the manager might reasonably take instead of the
  // panel's stated one — rendered as one-click response options, mirroring how the
  // clarifying-question flow offers options rather than demanding free text.
  alternatives?: string[];
  managerResponse?: {
    // "agree" (default) · "alternative" (picked one of the panel-offered alternatives)
    // · "custom" (free-text response). "disagree"/"uncertain" remain readable for runs
    // persisted before this scheme.
    stance: "agree" | "alternative" | "custom" | "disagree" | "uncertain";
    chosenAlternative?: string;
    note?: string;
  };
}

// A minuted minority view: a panelist whose final-round position materially disagreed
// with the declared outcome, plus the concrete condition under which the outcome should
// be revisited. Disagree-and-commit only works when the disagreement is on the record.
interface DissentEntry {
  agentName: string;
  position: string;
  wouldChangeIf: string;
}

// A manager's note on a specific decision-tree node, left via "Add Comment." Comments start
// as "draft" (visible only to the manager, not yet sent) and become "submitted" once part of
// a batch sent to the team. The team's short acknowledgment lands back on the same comment.
export interface NodeComment {
  id: string;
  nodeId: string;
  nodeLabel: string;
  text: string;
  timestamp: string;
  status: "draft" | "submitted";
  reply?: string;
  replyAgentId?: string;
  replyAgentName?: string;
  replyUnread?: boolean;
}

// One discrete, individually-approvable change proposed by the team in response to a chat
// exchange (a single Discuss, a general question, or a batch of comments). Nothing here is
// applied to the live run until the manager approves it via the Gatekeeper card — this is
// the "before any changes are committed back to the main project body" step made concrete
// and per-item rather than an opaque all-or-nothing revision.
interface ProposedChange {
  id: string;
  kind: "outcome" | "reasons" | "node" | "restructure" | "section";
  label: string;
  before?: string;
  after: string;
  nodeId?: string;
  newProbability?: number;
  newReason?: string;
  newLabel?: string;
  newOutcome?: string;
  newReasons?: string[];
  newDecisionTree?: DecisionNode[];
  sectionId?: string;
  newSectionHeading?: string;
  newSectionContent?: string;
  approved: boolean;
}

// A single turn in the unified chat drawer — general questions, per-node "Let's discuss
// this" exchanges, and batch-comment submissions all flow through the same message list.
// nodeContext tags which node(s) a message concerns, if any, so a message anchored to a
// specific branch stays identifiable even in an otherwise general conversation.
interface FollowUpMessage {
  id: string;
  role: "user" | "team";
  text: string;
  transcript?: CollaborativeTranscriptEntry[];
  revisedOutcome?: boolean;
  revisedDeliverable?: boolean;
  generatedFile?: GeneratedFile;
  status?: RunStatus;
  statusNote?: string;
  nodeContext?: PinnedNodeContext[];
  // Populated for "Everyone" mode (every agent's individual take) or a specific agent's reply
  // (a single-entry array) — an alternative to the consolidated Team response in `text`.
  individualResponses?: CollaborativeTranscriptEntry[];
  // When present, this message renders as a Gatekeeper approval card instead of plain text —
  // nothing in `proposedChanges` has been applied to the run yet.
  proposedChanges?: ProposedChange[];
  changesApplied?: boolean;
  // Team Chat is discussion-only — it never proposes or applies edits itself (see
  // checkFollowUpWarrantsRediscussion). When the exchange revealed something significant,
  // this points at the node to comment on instead, since a node comment is what actually
  // triggers a full re-discussion (submitCommentBatch) — a deliberate, visible act rather
  // than an in-chat approve/reject checklist. nodeId/nodeLabel omitted when the suggestion
  // concerns the overall outcome rather than one specific branch.
  suggestedCommentNodeId?: string;
  suggestedCommentNodeLabel?: string;
  suggestedCommentReason?: string;
  // Set on a message injected via the manager's calculator (Phase 3 roadmap item #3) — a
  // real mathjs-evaluated figure, distinctly badged so it reads as verified arithmetic
  // rather than another unverifiable claim in the transcript.
  isVerifiedCalculation?: boolean;
  // Set when the manager explicitly dismissed a proposed-changes card without applying
  // anything — distinct from simply not having decided yet, so the card doesn't sit there
  // indefinitely with no way to say "not right now" short of approving or leaving it stale.
  changesIgnored?: boolean;
}

// Generates a message id unique enough for this purpose — avoids the previous pattern of
// deriving a target index from `followUpMessages.length` read via closure, which could race
// if two send paths (regular chat, comment batch, node-pinned discuss) both reached their
// pre-await code in the same tick.
// Everything about a decision-tree node worth giving the model as context when a
// conversation is anchored to it — richer than just the label, so "Let's discuss this"
// actually seeds the discussion with the branch's probability and reasoning from turn one,
// not just its name.
interface PinnedNodeContext {
  nodeId: string;
  nodeLabel: string;
  probability?: number;
  reason?: string;
  parentLabel?: string;
}

function newMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface CollaborativeTranscriptEntry {
  agentId: string;
  agentName: string;
  provider: string;
  message: string;
  // Which act of the meeting this entry belongs to ("Opening positions",
  // "Validation round 2", "Manager", "Focused exchange", "Closing answers").
  // Drives the transcript's structural round dividers; also annotated into the
  // prior-round text agents receive so they can tell acts apart.
  roundLabel?: string;
}

/** One item in a run's Discussion Requirements — a read-only, auto-built record of what
 *  the current outcome is actually answering to. "original"/"clarification" entries are
 *  seeded once when a fresh discussion starts; "addition" entries accumulate every time a
 *  later interaction (Force, a node comment, Considerations, Expand Scope, dissent-revisit,
 *  answering a needs_input blocker) triggers a real re-discussion. Team Chat deliberately
 *  never contributes here — see the Team Chat audit this was born from. */
interface RequirementEntry {
  id: string;
  group: "original" | "clarification" | "addition";
  /** Only meaningful for group "addition" — which mechanism produced this entry, used to
   *  sub-group "Later Additions" in the Requirements panel. Set explicitly at creation,
   *  not inferred from label text later — some labels (wrap-up gate answers) are just the
   *  raw question with no reliable pattern to match against. */
  sourceType?: "force" | "comment" | "expand_scope" | "considerations" | "dissent" | "needs_input" | "follow_up" | "revision";
  label: string;
  text: string;
  timestamp: string;
}

export interface CollaborativeRun {
  id: string;
  timestamp: string;
  prompt: string;
  transcript: CollaborativeTranscriptEntry[];
  outcome: string;
  reasons: string[];
  decisionTree: DecisionNode[];
  rounds: number;
  // The maximum validation rounds the chosen depth allowed (fast=1, deep=2, extended=4) —
  // compared against `rounds` to show when the convergence check cut the discussion short.
  // Previously this only ever appeared in the debug log; the actual number of rounds used
  // vs. paid for was invisible anywhere in the UI itself.
  plannedRounds?: number;
  requirementsLog?: RequirementEntry[];
  // Set when a re-discussion (Force, Considerations, comments, dissent-revisit, a
  // needs_input answer) explicitly flagged that it changed something in the tree beyond
  // what was directly discussed — see the "preserve unless implicated" instruction in
  // runCollaborativeSession. Surfaced as a dismissible banner so an unrelated change is
  // never silent, even when it was a legitimate one.
  structuralChangeNote?: string;
  // Layer 2 of the re-discussion data-loss fix — a plain structural diff (not another LLM
  // call) run after every revision, flagging any previously-curated content (scoping
  // conversations, mandate notes, contradiction flags) that vanished or lost detail. This
  // exists because Layer 1's "preserve unless implicated" instruction is exactly that — an
  // instruction, not a guarantee, when the whole tree is being regenerated by an LLM.
  preservationWarnings?: string[];
  // Set when this run was produced by a user forcing a specific decision-tree branch; the
  // whole panel re-discussed the task treating this as a fixed constraint.
  forcedConstraint?: string;
  // The decision axes identified before discussion began — shown for transparency and used
  // to guide both the discussion and the final tree's structure.
  axes?: DecisionAxis[];
  // User-given title, overriding the auto-generated summary in Chat History.
  title?: string;
  // Decision vs Deliverable classification (see TaskType) and, for Deliverable tasks, the
  // actual structured output the team produced — sections drafted by named authors rather
  // than a decision outcome/tree. outcome/reasons/decisionTree stay populated (possibly
  // empty) for Deliverable runs so existing code paths don't need null-checks everywhere;
  // the UI branches on taskType to decide which to render.
  taskType?: TaskType;
  // Whether taskType was the manager's explicit pre-discussion pick or the decomposition
  // step's own auto-classification (manager chose "Let the team decide") — surfaced next to
  // the outcome/outline so a "let the team decide" pick doesn't leave the manager guessing
  // which way it landed.
  taskTypeSource?: "manager" | "auto";
  deliverable?: DeliverableSpec;
  status?: RunStatus;
  statusNote?: string;
  // Which agent acted as facilitator (synthesis, outline compilation, completeness check) —
  // surfaced in the UI so that role isn't invisible to the user.
  facilitatorAgentName?: string;
  // Minority views recorded at synthesis — empty/absent when the panel genuinely converged.
  dissent?: DissentEntry[];
  // Present when this run was a re-discussion triggered by the manager amending the
  // panel's considerations (see rerunWithConsiderationResponses).
  premiseAmendments?: string;
  // Present when this run was a re-discussion triggered by "Discuss This Batch" on the
  // decision tree — node-specific feedback rather than premise amendments.
  managerFeedback?: string;
  // The Team Chat conversation for this run. Previously followUpMessages lived only in
  // local component state with no persistence at all — every Q&A exchange that didn't
  // happen to trigger a Gatekeeper-approved change was silently lost the moment the user
  // navigated away, reopened this same run from history, or started a new conversation.
  chatMessages?: FollowUpMessage[];
  // Every share-link token ever created for this run — lets the Share dialog show and
  // revoke past links rather than each share being an untracked, unmanageable one-off.
  sharedTokens?: string[];
  // Grounding status recorded AT THE TIME this run completed — deliberately a durable
  // snapshot, not derived live from the current knowledgeFiles state, since Knowledge Base
  // is a single shared mutable library: by the time someone compares two old runs, the
  // live library may look nothing like what either run actually saw.
  groundedSourceCount?: number;
  // The actual KnowledgeFile ids grounded at that same moment — lets a later check compute
  // exactly which current sources are NEW since then (by id, not just a count delta), which
  // groundedSourceCount alone can't do: a removed-one/added-one swap leaves the count
  // unchanged but the sources genuinely different. Refreshed whenever the run is checked
  // against the current Knowledge Base, whether via a full re-discussion, Move/Promote, or
  // the incremental drift check (checkAgainstNewKnowledgeSources) — see the KB-staleness
  // banner in the main output view.
  groundedSourceIds?: string[];
  hadVerifiedCalculations?: boolean;
  // Bidirectional provenance (Phase 4 roadmap): previously a revisit/Go-Deeper run knew
  // what triggered it (via managerFeedback/premiseAmendments), but the ORIGINAL run had no
  // record it had spawned anything — from its own perspective, nothing happened. This is
  // the other direction: which run(s) resulted from acting on this one, and when/why.
  spawnedRunIds?: string[];
  revisitEvents?: { timestamp: string; trigger: "go_deeper" | "dissent_revisit" | "discuss_batch" | "blocking_answer" | "other"; note: string; newRunId: string }[];
  // Snapshots of the outcome/deliverable taken immediately before each pivot, oldest first —
  // so a manager can see what the team thought before Force/Promote/Discuss/a Chat With The
  // Team revision changed it, rather than that context simply being overwritten.
  history?: RunRevisionSnapshot[];
  // Manager comments left on tree nodes via "Add Comment" — persisted with the run so the
  // thread survives reloading it from Chat History.
  nodeComments?: NodeComment[];
  // Assumptions/risks/constraints/tradeoffs the panel weighed while reaching its decisions —
  // see the Consideration type for why these are kept separate from decisions themselves.
  considerations?: Consideration[];
}

interface ComparisonRun {
  id: string;
  timestamp: string;
  prompt: string;
  outputFormat: string;
  enabledAgents: Record<string, boolean>;
  results: Results;
  aggregatedReview: string | AgentResult;
  title?: string;
}

interface ParallelTeamRun {
  id: string;
  timestamp: string;
  prompt: string;
  results: Record<string, { name: string; provider: string; text: string; error?: string }>;
  title?: string;
}

interface UnifiedHistoryEntry {
  id: string;
  timestamp: string;
  type: "comparison" | "parallel" | "collaborative" | "product";
  summary: string;
  title?: string;
}

// Default prompt for the Output Editor feature (Settings → Editor). Users can edit this
// freely; this is only the starting point.
const DEFAULT_EDITOR_PROMPT = `You are an expert copyeditor. Your sole task is to review the output from our team and rewrite it so that it sounds like it was written by a natural, capable human writer rather than an AI. Adhere strictly to the following rules:

1. Tone and Audience Detection: Automatically analyze the input text to determine its intended tone (e.g., professional, casual, academic, creative) and audience. Maintain that exact tone, but make it sound authentic. If the text is highly technical, keep the advanced vocabulary but rewrite the phrasing so it sounds like a human expert speaking naturally to another expert.

2. Eliminate "AI-isms" and Clichés: Strip out robotic transitions, predictable structures, and common AI buzzwords/phrases (e.g., "delve," "testament," "tapestry," "moreover," "in conclusion," "in today's fast-paced world"). Rewrite fluff and repetitive sentences to be concise and natural without losing the original meaning or context.

3. Acronym Rule: Identify less common or technical acronyms (e.g., API, CAGR, OKR). If they are not already explained, look up their definition and insert it in parentheses immediately following the first mention of the acronym. Do not define common acronyms (e.g., NASA, CEO, AI).

4. Formatting and Code Preservation: Leave all links, URLs, code blocks, and placeholders (e.g., "[Insert Name]") completely untouched.

5. Language and Spelling: Match the exact region/dialect of English used in the input text (e.g., if the text uses UK spelling like "colour," use UK spelling in your output).

6. Output Constraint (Strict): Output ONLY the revised text. Do not include any introductory remarks, conversational filler ("Here is the revised text:"), or concluding summaries. If the text is already written perfectly and requires no changes, output the original text exactly as-is.`;

const MODEL_OPTIONS = {
  gemini: [
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite" },
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview)" },
  ],
  anthropic: [
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "claude-opus-5", name: "Claude Opus 5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
  ],
  openai: [
    { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
    { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
    { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
    { id: "gpt-6-astra", name: "GPT-6 Astra (staged rollout — may not be enabled on your key yet)" },
    { id: "gpt-5.5", name: "GPT-5.5" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
  ],
  perplexity: [
    { id: "sonar-pro", name: "Sonar Pro" },
    { id: "sonar", name: "Sonar" },
    { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro" },
    { id: "sonar-reasoning", name: "Sonar Reasoning" },
    { id: "sonar-deep-research", name: "Sonar Deep Research" },
  ],
  grok: [
    { id: "grok-3", name: "Grok 3" },
    { id: "grok-3-mini", name: "Grok 3 Mini" },
    { id: "grok-2-latest", name: "Grok 2" },
    { id: "grok-2-vision-1212", name: "Grok 2 Vision" },
  ],
};

const AGENT_LINKS = {
  gemini: "https://aistudio.google.com/app/apikey",
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  perplexity: "https://www.perplexity.ai/settings/api",
  grok: "https://console.x.ai/",
};

// Stable, distinct text colors per agent so multi-persona conversations are easy to scan.
// A single generic, friendly, helpful default persona — used everywhere the app needs to
// hand the user a starting agent: initial app state, "start completely fresh", and
// replacing the roster's last agent when it's removed. Previously this was "Lead Analyst"
// with an analyst-flavoured persona in two places (and an empty roster in a third) —
// inconsistent and presumptuous about what the user actually wants from the team.
function createDefaultAgent(provider: CustomAgent["provider"] = "gemini", model?: string): CustomAgent {
  return {
    id: `agent_${Date.now()}`,
    provider,
    model: model || MODEL_OPTIONS[provider]?.[0]?.id || "",
    name: "Assistant",
    persona: "You are a friendly, helpful assistant. Give clear, practical answers, and ask a clarifying question when the task is ambiguous."
  };
}

const AGENT_TEXT_COLORS = [
  "text-blue-600 dark:text-blue-400",
  "text-purple-600 dark:text-purple-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-amber-600 dark:text-amber-400",
  "text-pink-600 dark:text-pink-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-red-600 dark:text-red-400",
  "text-indigo-600 dark:text-indigo-400"
];
// Same hues as AGENT_TEXT_COLORS, same index, solid fill + white text — for a bolder avatar
// circle (sidebar roster) rather than the light tinted chip used inline in transcripts.
// Sharing the index guarantees an agent's colour is identical everywhere it appears:
// Team Agents, Panel Discussion, and Team Chat all derive from the same lookup.
const AGENT_SOLID_BG_COLORS = [
  "bg-blue-600 dark:bg-blue-500",
  "bg-purple-600 dark:bg-purple-500",
  "bg-emerald-600 dark:bg-emerald-500",
  "bg-amber-600 dark:bg-amber-500",
  "bg-pink-600 dark:bg-pink-500",
  "bg-cyan-600 dark:bg-cyan-500",
  "bg-red-600 dark:bg-red-500",
  "bg-indigo-600 dark:bg-indigo-500"
];
function getAgentColorClass(agentId: string, team: { id: string }[]): string {
  const idx = team.findIndex(a => a.id === agentId);
  return AGENT_TEXT_COLORS[(idx >= 0 ? idx : 0) % AGENT_TEXT_COLORS.length];
}
function getAgentSolidBgClass(agentId: string, team: { id: string }[]): string {
  const idx = team.findIndex(a => a.id === agentId);
  return AGENT_SOLID_BG_COLORS[(idx >= 0 ? idx : 0) % AGENT_SOLID_BG_COLORS.length];
}
// Human-readable model name for the roster row (e.g. "Claude Sonnet 5") — shown under the
// agent's name so which model an agent is running is visible without expanding it. Falls
// back to the raw model id for anything not in MODEL_OPTIONS (a custom/future model id).
function getAgentModelLabel(agent: CustomAgent): string {
  return (MODEL_OPTIONS[agent.provider] || []).find(m => m.id === agent.model)?.name || agent.model;
}

// One agent-identity treatment everywhere a teammate is named — transcript entries,
// clarifying-question attribution, consideration authorship, dissent, drawer pins — so
// each agent coheres into a recognisable colleague instead of styling differently per
// surface. Initial-letter avatar in the agent's colour + name; provider is optional meta.
const AgentChip = memo(function AgentChip({ agentId, name, team, provider, size = "sm" }: {
  agentId: string;
  name: string;
  team: { id: string }[];
  provider?: string;
  size?: "sm" | "xs";
}) {
  const colorClass = getAgentColorClass(agentId, team);
  const isManager = agentId === "manager";
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span
        aria-hidden="true"
        className={`${size === "sm" ? "w-4.5 h-4.5 text-[10px]" : "w-4 h-4 text-[9px]"} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isManager ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : `bg-current/15 ${colorClass}`}`}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <span className={`text-xs font-bold truncate ${isManager ? "text-slate-700 dark:text-slate-200" : colorClass}`}>{name}</span>
      {provider && provider !== "manager" && (
        <Badge variant="outline" className="text-xs font-mono capitalize flex-shrink-0">{provider}</Badge>
      )}
    </span>
  );
});

// Speech-move detection for transcript entries — makes the friction the round prompts
// engineer (challenges by name, concessions, direct questions) visible at a glance instead
// of buried in prose. Deliberately conservative patterns: a missed move costs nothing, a
// false chip misleads.
function detectSpeechMoves(message: string): { move: "challenges" | "concedes" | "asks"; detail?: string }[] {
  const moves: { move: "challenges" | "concedes" | "asks"; detail?: string }[] = [];
  // matchAll (not match) — a message can now legitimately ask several questions, to the
  // same panelist or different ones, so every occurrence gets its own chip.
  const questionMatches = [...message.matchAll(/Question for ([A-Za-z0-9 ._'-]{2,40})[:,]/g)];
  for (const q of questionMatches) moves.push({ move: "asks", detail: q[1].trim() });
  if (/\b(I concede|you've convinced me|changed my mind|I was wrong|I'll concede|fair point[, —-]+I)/i.test(message)) moves.push({ move: "concedes" });
  if (/\b(the weakest (claim|point|assumption)|I (disagree|challenge|push back)|I'm not convinced|this assumes|unexamined assumption)/i.test(message)) moves.push({ move: "challenges" });
  return moves;
}

const SOURCE_TYPE_META: Record<string, { label: string; icon: any; placeholder?: string; kind: "file" | "link" | "text" }> = {
  file: { label: "Upload Files", icon: UploadCloud, kind: "file" },
  image: { label: "Image", icon: ImageIcon, kind: "file" },
  codebase_zip: { label: "Codebase Archive (.zip)", icon: FileArchive, kind: "file" },
  web: { label: "Website / YouTube", icon: Globe, placeholder: "https://example.com/article or a YouTube link", kind: "link" },
  website: { label: "Website", icon: Globe, placeholder: "https://example.com/article", kind: "link" },
  youtube: { label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/watch?v=...", kind: "link" },
  github: { label: "GitHub Repository", icon: Github, placeholder: "https://github.com/owner/repo (optionally /tree/branch/sub/path) — public repos only", kind: "link" },
  google_drive: { label: "Google Drive", icon: HardDrive, placeholder: "Google Drive file or folder link", kind: "link" },
  google_calendar: { label: "Google Calendar", icon: CalendarDays, placeholder: "A label, e.g. 'My work calendar' (we'll pull your primary calendar's events)", kind: "link" },
  gmail: { label: "Gmail", icon: Mail, placeholder: "Gmail search syntax, e.g. from:jane subject:contract", kind: "link" },
  text: { label: "Pasted Text", icon: ClipboardPaste, kind: "text" },
  notebooklm: { label: "NotebookLM Project", icon: NotebookText, placeholder: "NotebookLM project/share link", kind: "link" },
};

// Curated list (and order) of choices shown in the "Add Source" dropdown. "file" covers both
// documents, images, and codebase .zip archives (auto-detected by extension); "web" covers
// both websites and YouTube links — each still resolves to a specific stored sourceType
// (image/website/youtube/codebase_zip) so the right icon shows afterwards.
const ADD_SOURCE_OPTIONS: KnowledgeSourceType[] = ["file", "web", "github", "google_drive", "google_calendar", "gmail", "text", "notebooklm"];

// Source types that read the user's own Google data and therefore require a Google sign-in
// and consent step before a link can be added.
type GoogleGatedSourceType = "google_drive" | "google_calendar" | "gmail" | "notebooklm";
const GOOGLE_GATED_SOURCE_TYPES: KnowledgeSourceType[] = ["google_drive", "google_calendar", "gmail", "notebooklm"];

function StartDiscussionButton({
  label,
  icon: Icon,
  loading,
  disabled,
  onClick,
  depth,
  onDepthChange,
  onStop,
  teamSize
}: {
  label: string;
  icon: any;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  depth: DiscussionDepth;
  onDepthChange: (d: DiscussionDepth) => void;
  onStop?: () => void;
  teamSize: number;
}) {
  const depthLabels: Record<DiscussionDepth, string> = {
    fast: "Fast Discussion",
    deep: "Deep Discussion",
    extended: "Multiple Rounds"
  };
  // Rough model-call estimate per depth, given the current team size — deliberately
  // approximate (labeled "~") rather than exact, since convergence can end a round early
  // and a hot-seat exchange changes the count. The point isn't precision, it's making the
  // cost of a large team + Extended depth visible BEFORE starting, not discovered only
  // after a run burns through a provider's quota.
  const n = Math.max(teamSize, 1);
  const validationRoundsByDepth: Record<DiscussionDepth, number> = { fast: 1, deep: 2, extended: 4 };
  const estimateCalls = (d: DiscussionDepth) => {
    const sitsOut = n >= 3 ? 1 : 0;
    const perRound = n - sitsOut;
    const rounds = validationRoundsByDepth[d];
    return 1 /* decomposition */ + perRound /* position round */ + perRound * rounds /* validation rounds */ + 3 /* synthesis + check-in + retro */;
  };
  return (
    <div className="flex flex-shrink-0 h-11 rounded-xl shadow-sm overflow-hidden">
      <Button
        onClick={loading && onStop ? onStop : onClick}
        disabled={loading ? !onStop : disabled}
        title={`~${estimateCalls(depth)} model calls at ${depthLabels[depth]} with ${n} agent${n === 1 ? "" : "s"}`}
        className={`rounded-none rounded-l-xl px-6 h-full text-sm font-semibold gap-2 border-r text-white ${
          loading ? "bg-red-600 hover:bg-red-700 border-red-500/40" : "bg-blue-600 hover:bg-blue-700 border-blue-500/40"
        }`}
      >
        {loading ? (
          onStop ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </>
          ) : (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )
        ) : (
          <>
            <Icon className="w-4 h-4" /> {label}
          </>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button
            disabled={disabled || loading}
            title={depthLabels[depth]}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-none rounded-r-xl h-full px-2.5"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onDepthChange("fast")} className="text-xs flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Fast Discussion</span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono">~{estimateCalls("fast")}</span>
              {depth === "fast" && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDepthChange("deep")} className="text-xs flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Deep Discussion</span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono">~{estimateCalls("deep")}</span>
              {depth === "deep" && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDepthChange("extended")} className="text-xs flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2"><Repeat className="w-3.5 h-3.5" /> Multiple Rounds</span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono">~{estimateCalls("extended")}</span>
              {depth === "extended" && <Check className="w-3.5 h-3.5 text-blue-500" />}
            </span>
          </DropdownMenuItem>
          <div className="px-2 pt-1.5 pb-0.5 border-t border-slate-100 dark:border-slate-800 mt-1">
            <p className="text-xs text-slate-400 leading-relaxed">Estimated model calls for your current {n}-agent team. Fewer agents or a lower depth uses proportionally less of your provider quota.</p>
            {/* Considerations (assumptions/risks the team flags for your review) are gated
                entirely behind depth !== "fast" — Fast users never see them, not rarely, and
                that was previously undisclosed anywhere in the UI. Making the tradeoff
                visible here doesn't change the behavior, but it turns "why did this
                disappear" into an informed choice. */}
            <p className="text-xs text-slate-400 leading-relaxed mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">Fast Discussion also skips Considerations — the assumptions and risks the team flags for your review. Choose Deep or Multiple Rounds to have those surfaced.</p>
            <p className="text-xs text-slate-400 leading-relaxed mt-1.5">Deep and Multiple Rounds also produce a deeper, more detailed tree and outcome — more sub-factors per axis, more branches, more nested levels — not just extra confidence-checking on the same shape.</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// "Would you like to update the main discussion with these decisions?" made concrete: every
// proposed change is individually approvable (default checked), and nothing touches Panel
// Discussion until the manager explicitly commits — even committing with everything
// unchecked is a valid, deliberate "not like this" outcome.
// Highlights unverified figures IN PLACE within a message, using the same orange styling
// as the "check figures" badge. Previously the badge named the flagged number in its
// tooltip, but in a long paragraph there was no way to actually find "624" — this marks
// the exact substring so the eye goes straight to it.
const MessageWithHighlightedFigures = memo(function MessageWithHighlightedFigures({ text, unverifiedNumbers, className }: { text: string; unverifiedNumbers: string[]; className?: string }) {
  if (unverifiedNumbers.length === 0) {
    return <p className={className}>{text}</p>;
  }
  const flaggedSet = new Set(unverifiedNumbers);
  const spans = findNumberSpans(text).filter(s => flaggedSet.has(s.normalized));
  if (spans.length === 0) {
    return <p className={className}>{text}</p>;
  }
  const parts: ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, i) => {
    if (span.start > cursor) parts.push(text.slice(cursor, span.start));
    parts.push(
      <mark
        key={i}
        title="Doesn't appear in your uploaded Knowledge Base or verified calculations — worth verifying before you rely on it."
        className="bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 rounded px-0.5 font-medium not-italic"
      >
        {text.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className={className}>{parts}</p>;
});

// "Go Deeper" as scope expansion — module-scope type/sentinel so both the main component
// and GoDeeperApprovalPreview below share the exact same session shape.
const GO_DEEPER_ROOT_SENTINEL = "__root__"; // scope = the whole task, no specific node (subsumes the old whole-run mechanism)

interface GoDeeperSessionState {
  nodeId: string;
  nodeLabel: string;
  nodeReason?: string;
  ancestorLabels: string[];
  /** Labels of the node's existing direct children at session start — fed to synthesis so
   *  mid-level expansion proposes new work instead of restating what's already in the tree. */
  existingChildLabels: string[];
  /** "single" (default) = the same one agent asks questions and synthesizes, as before.
   *  "team" = after the Q&A, the whole team debates this branch first (a real multi-round
   *  discussion, same shape as Add Outcome's Full mode / New Tab), and synthesis is grounded
   *  in that debate instead of judging the Q&A answers alone — considers more, tends to
   *  produce more/richer nodes. Chosen on the "choosing" screen, before scope. */
  teamMode: "single" | "team";
  /** Whether the node being expanded is itself on the chosen path (root sentinel = true).
   *  Gates grafted-node selection: a rejected branch must never sprout a live-looking chain. */
  parentIsSelected: boolean;
  scope: "same" | "new" | null;
  status: "choosing" | "asking" | "loading_next" | "synthesizing" | "pending_approval" | "error";
  /** Which call failed, so the error state's Retry knows what to re-attempt. */
  errorPhase?: "question" | "synthesis";
  qa: GoDeeperQA[];
  currentQuestion: { question: string; options: string[]; askedBy: string; isOpener?: boolean } | null;
  /** How the synthesis classified its proposal: competing "alternatives" (one should win,
   *  selection applies), a parallel work "breakdown" (all proceed, nothing to choose), or
   *  "content" (an informational request, answered with concrete findings — nothing to choose,
   *  probability doesn't apply). */
  proposedStructure: "alternatives" | "breakdown" | "content" | null;
  proposedNodes: DecisionNode[];
  /** Prose answer tying "content" nodes together — null for the other two structures. */
  proposedSummary: string | null;
  proposedParentProbabilityChange: { newProbability: number; rationale: string } | null;
  proposedContradictionWarning: string | null;
  error?: string;
}

// Approval preview: the manager can edit a proposed node's label/probability before
// accepting (matching how the deliverable outline is editable before drafting), and the
// parent-probability change specifically needs an explicit opt-in checkbox rather than
// being bundled silently into the same Approve click — a numeric change to something the
// panel already decided deserves its own visible yes/no, separate from "add these new
// sub-decisions," even though both arrive in the same preview.
const GoDeeperApprovalPreview = memo(function GoDeeperApprovalPreview({
  session,
  onApprove,
  onDiscard
}: {
  session: GoDeeperSessionState;
  onApprove: (nodes: DecisionNode[], applyParentProbabilityChange: boolean) => void;
  onDiscard: () => void;
}) {
  const [editedNodes, setEditedNodes] = useState<DecisionNode[]>(session.proposedNodes);
  const [applyProbabilityChange, setApplyProbabilityChange] = useState(false);

  const updateNode = (id: string, patch: Partial<DecisionNode>) => {
    setEditedNodes(prev => prev.map(n => (n.id === id ? { ...n, ...patch } : n)));
  };

  const isAlternatives = session.proposedStructure === "alternatives";
  const isContent = session.proposedStructure === "content";
  // Selection only applies when the nodes compete AND the branch being expanded is itself
  // on the chosen path — a rejected branch must never sprout a live-looking selected chain.
  const selectionApplies = isAlternatives && session.parentIsSelected;

  // A proposed node is top-level WITHIN THIS BATCH if nothing else in the batch is its
  // parent — everything else nests under whichever sibling its (validated) parentRef
  // pointed at. This is what turns a compound, dependent request ("what tiers, and what
  // benefits per tier") into a visible hierarchy here, rather than one flat list where a
  // tier and its own benefits look like unrelated equals.
  const topLevelProposedNodes = editedNodes.filter(n => !editedNodes.some(other => other.id === n.parentId));

  const renderProposedNode = (node: DecisionNode): ReactNode => {
    const children = getTreeChildren(editedNodes, node.id);
    return (
      <div key={node.id} className="space-y-2">
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              value={node.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              className="h-8 text-xs font-semibold flex-1 bg-transparent border-slate-200 dark:border-slate-800"
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <Input
                type="number"
                min={0}
                max={100}
                value={node.probability}
                onChange={(e) => updateNode(node.id, { probability: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                className="h-8 w-16 text-xs font-mono bg-transparent border-slate-200 dark:border-slate-800"
              />
              <span className="text-xs text-slate-400">{isContent ? "score" : "%"}</span>
            </div>
          </div>
          {node.reason && <p className="text-xs text-slate-500 dark:text-slate-400">{node.reason}</p>}
          {isContent && node.isFromKnowledgeBase && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Grounded in your uploaded knowledge base.</p>
          )}
          {isContent && node.isGeneralKnowledgeContent && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Based on general knowledge — not verified against your documents.</p>
          )}
          {selectionApplies && (
            <label className="flex items-center gap-1.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={node.isSelected === true}
                onChange={(e) => updateNode(node.id, { isSelected: e.target.checked })}
                className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
              <span className={`text-[11px] font-medium ${node.isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                {node.isSelected ? "Selected — the team's recommended pick" : "Not selected"}
              </span>
            </label>
          )}
        </div>
        {children.length > 0 && (
          <div className="ml-4 pl-3 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            {children.map(child => renderProposedNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint-foreground">Proposed — review before adding</p>
        {session.proposedStructure && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0">
            {isAlternatives ? "Competing options — one should win" : isContent ? "Findings — answers your request" : "Work breakdown — all proceed"}
          </span>
        )}
      </div>

      {isContent && session.proposedSummary && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{session.proposedSummary}</p>
        </div>
      )}

      {isAlternatives && !session.parentIsSelected && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">"{session.nodeLabel}" isn't the chosen path, so these will be added unselected — promote the branch first if the team should pursue one of them.</p>
      )}

      {session.proposedContradictionWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-warning-soft border-l-[3px] border-l-warning bg-warning-soft">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"><span className="font-semibold text-amber-700 dark:text-amber-400">This may mean the original branch was wrong:</span> {session.proposedContradictionWarning}</p>
        </div>
      )}

      {session.proposedParentProbabilityChange && session.nodeId !== GO_DEEPER_ROOT_SENTINEL && (
        <label className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 cursor-pointer">
          <input type="checkbox" checked={applyProbabilityChange} onChange={(e) => setApplyProbabilityChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold">Also update "{session.nodeLabel}"'s probability to {session.proposedParentProbabilityChange.newProbability}%</span> — {session.proposedParentProbabilityChange.rationale}
          </span>
        </label>
      )}

      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {topLevelProposedNodes.map(node => renderProposedNode(node))}
        {editedNodes.length === 0 && (
          <p className="text-xs text-slate-500 py-2">No new sub-decisions were identified from this conversation.</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onDiscard} className="text-xs text-slate-500 h-8 px-2.5">
          Discard
        </Button>
        <Button
          size="sm"
          disabled={editedNodes.length === 0 && !(applyProbabilityChange && session.proposedParentProbabilityChange)}
          onClick={() => onApprove(editedNodes, applyProbabilityChange)}
          className="h-8 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Check className="w-3.5 h-3.5" /> Approve & Add
        </Button>
      </div>
    </div>
  );
});

const GatekeeperCard = memo(function GatekeeperCard({ changes, onToggle, onApply, onIgnore }: { changes: ProposedChange[]; onToggle: (id: string) => void; onApply: () => void; onIgnore: () => void }) {
  const approvedCount = changes.filter(c => c.approved).length;
  return (
    <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-2">
      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" /> Update the main discussion with these changes?
      </p>
      <div className="space-y-1.5">
        {changes.map(c => (
          <label key={c.id} className="flex items-start gap-2 p-2 rounded-md bg-card border border-slate-200 dark:border-slate-800 cursor-pointer">
            <Checkbox checked={c.approved} onCheckedChange={() => onToggle(c.id)} className="mt-0.5 flex-shrink-0" aria-label={`Approve change: ${c.label}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.label}</p>
              {c.before && (
                <p className="text-xs text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700">{c.before.length > 140 ? `${c.before.slice(0, 140)}…` : c.before}</p>
              )}
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{c.after.length > 160 ? `${c.after.slice(0, 160)}…` : c.after}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApply} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8">
          <CheckCircle2 className="w-3.5 h-3.5" /> Update Panel Discussion ({approvedCount}/{changes.length})
        </Button>
        {/* Explicit "not right now" — previously the only way past this card was to
            approve something; there was no way to say "leave Panel Discussion alone"
            short of just not clicking anything and letting it sit there indefinitely. */}
        <Button size="sm" variant="ghost" onClick={onIgnore} className="h-8 text-xs text-slate-500 dark:text-slate-400">
          Ignore
        </Button>
      </div>
    </div>
  );
});

// Renders a node's comment-state badge: a draft (unsent) comment reads as a light, muted
// icon; sent-but-unanswered is a touch darker; a reply turns it emerald; an unread reply adds
// a small red dot so a revisited batch shows what's new since last time.
// Header-only now — the card-level copy next to the mode switcher was removed since the
// persistent header button already covers the same need from anywhere in the app.
const NewConversationButton = memo(function NewConversationButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={
        <Button
          onClick={onClick}
          className="h-9 rounded-full px-4 gap-1.5 shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">New Conversation</span>
        </Button>
      } />
      <TooltipContent side="bottom" className="text-xs max-w-[220px]">
        Clear the current prompt and result to start fresh — always here in the header, regardless of how far you've scrolled or which tab you're on.
      </TooltipContent>
    </Tooltip>
  );
});

// Minimal shareable read access (Phase 3 roadmap, round 2, item #3). A standalone,
// unauthenticated component — deliberately outside the main App's auth gate, since a
// recipient of a share link may not have (or want) an Orchestra account at all. Fetches
// its own snapshot directly; renders nothing else from the app shell.
function SharedRunView({ token }: { token: string }) {
  const [snapshot, setSnapshot] = useState<SharedRunSnapshot | "not_found" | "expired" | "revoked" | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "sharedRuns", token));
        if (!snap.exists()) { setSnapshot("not_found"); return; }
        const data = snap.data() as SharedRunSnapshot;
        // Expiry/revocation are checked client-side here rather than at the Firestore rule
        // level — the rule still allows reading a revoked/expired doc (simpler and safer
        // than encoding time-based logic into security rules), so enforcement happens in
        // the one place that actually renders it to a viewer. Distinguished from each other
        // (and from a genuinely invalid token) so a legitimate recipient isn't left thinking
        // a naturally-expired link is just broken.
        const isExpired = data.expiresAt ? new Date(data.expiresAt).getTime() < Date.now() : false;
        if (data.revoked) { setSnapshot("revoked"); return; }
        if (isExpired) { setSnapshot("expired"); return; }
        setSnapshot(data);
      } catch {
        setSnapshot("not_found");
      }
    })();
  }, [token]);

  if (snapshot === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (snapshot === "not_found" || snapshot === "expired" || snapshot === "revoked") {
    const messages = {
      not_found: "This share link is invalid or doesn't exist.",
      expired: "This share link has expired. Ask the sender to create a new one.",
      revoked: "This share link was revoked by the person who created it."
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-slate-950 p-8">
        <div className="text-center space-y-2 text-slate-500">
          <ShieldAlert className="w-10 h-10 mx-auto stroke-[1.5]" />
          <p className="text-sm">{messages[snapshot]}</p>
        </div>
      </div>
    );
  }

  const rootNodes = snapshot.decisionTree.filter(n => n.parentId === null);
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-6">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 28 28" className="w-6 h-6" aria-hidden="true">
            <circle cx="8.5" cy="10.5" r="4.5" className="fill-slate-900 dark:fill-slate-100" />
            <circle cx="19.5" cy="10.5" r="4.5" className="fill-slate-900 dark:fill-slate-100" />
            <circle cx="14" cy="9.5" r="5.5" className="fill-blue-600" />
          </svg>
          <span className="font-semibold text-lg">Orchestra</span>
          <Badge variant="outline" className="text-xs ml-auto">Read-only shared view</Badge>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card">
          <p className="text-xs font-medium text-slate-500 mb-1">Task</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{snapshot.prompt}</p>
        </div>

        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/15 space-y-2">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Defined Outcome</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{snapshot.outcome}</p>
        </div>

        {/* Verification status carried across the sharing boundary — the single most
            repeated request across three rounds of QA: a recipient previously had no way
            to know whether this decision was ever checked against real source material. */}
        <div className="flex items-center gap-1.5 text-xs px-1">
          {snapshot.groundedSourceCount > 0 ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-slate-500">
                Checked against {snapshot.groundedSourceCount} uploaded source{snapshot.groundedSourceCount === 1 ? "" : "s"}
                {snapshot.hadVerifiedCalculations && " and verified calculations"}.
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-500">No source material was checked against — figures and claims are unverified.</span>
            </>
          )}
        </div>

        {snapshot.reasons.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Why the Panel Arrived Here</p>
            <ul className="space-y-1.5">
              {snapshot.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rootNodes.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Decision Tree</p>
            <ul className="space-y-1.5">
              {rootNodes.map(n => (
                <li key={n.id} className={`text-sm ${n.isSelected ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`}>
                  {n.label} — {n.probability}%
                </li>
              ))}
            </ul>
          </div>
        )}

        {snapshot.dissent && snapshot.dissent.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Minority View</p>
            {snapshot.dissent.map((d, i) => (
              <p key={i} className="text-sm text-slate-600 dark:text-slate-300"><span className="font-semibold">{d.agentName}:</span> {d.position}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center pt-4">
          Shared {new Date(snapshot.sharedAt).toLocaleDateString()} · This is a static, read-only snapshot — it will not reflect later changes, and comments aren't supported on shared views.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  // Minimal shareable read access (Phase 3 roadmap, round 2, item #3): a ?shared= link
  // bypasses the entire auth flow — a recipient may not have an account at all. Read once
  // at mount (never changes for this component's lifetime), so this early return always
  // takes the same branch on every re-render of this instance, which is what keeps the
  // hooks below it safe to call unconditionally.
  const [sharedRunToken] = useState(() => new URLSearchParams(window.location.search).get("shared"));
  if (sharedRunToken) return <SharedRunView token={sharedRunToken} />;

  // BriefBridge public intake portal: /intake/:token, a path (not query param, unlike
  // ?shared= above) since it's the link a developer hands to a client — worth looking
  // like a real page. Same early-return shape as sharedRunToken: read once at mount,
  // no admin chrome, no auth wall.
  const [intakeToken] = useState(() => {
    const match = window.location.pathname.match(/^\/intake\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  if (intakeToken) return <PublicIntakePortal token={intakeToken} />;

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  // Dark mode must be applied to document.documentElement, not a div inside the React
  // tree: Tailwind's dark variant here compiles to `&:is(.dark *)` — a plain CSS descendant
  // selector — and every Base UI Sheet/Dialog/Select/Tooltip/DropdownMenu portals its
  // content directly to document.body, OUTSIDE any div's DOM subtree. With `dark` applied
  // to an inner div (the previous approach), no dark: class could ever reach a portaled
  // surface — Team Chat (a Sheet) was the one reported, but this affected every dialog,
  // dropdown, select, and tooltip in the app. Applying it to <html> makes it an ancestor of
  // every portal target, since portals still mount as descendants of <body>.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  // Opt-in browser notification when a long-running run finishes while the tab is hidden —
  // requested on demand when the user turns it on, never on load. Deliberately per-session
  // rather than persisted to Firestore, matching the scope of this specific fix.
  const [notifyOnComplete, setNotifyOnComplete] = useState(false);
  const prevLoadingRef = useRef(false);
  const [keys, setKeys] = useState({ gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" });
  const [showKeys, setShowKeys] = useState({ gemini: false, anthropic: false, openai: false, perplexity: false, grok: false });
  const [models, setModels] = useState({
    gemini: "gemini-3.8-flash",
    anthropic: "claude-sonnet-5",
    openai: "gpt-5.6-sol",
    perplexity: "sonar-pro",
    grok: "grok-3",
  });
  const [prompt, setPrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState("Full");
  const [enabledAgents, setEnabledAgents] = useState({ gemini: false, anthropic: false, openai: false, perplexity: false, grok: false });
  const [leadAgentId, setLeadAgentId] = useState<string | null>(null);
  const [results, setResults] = useState<Results>({ gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" });
  const [aggregatedReview, setAggregatedReview] = useState<string | AgentResult>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isAggregatedOpen, setIsAggregatedOpen] = useState(true);
  const [isRawOutputOpen, setIsRawOutputOpen] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [loopingEnabled, setLoopingEnabled] = useState(false);
  const [maxLoops, setMaxLoops] = useState(1);
  // Output Editor (Settings → Editor): an optional copyediting pass over team output.
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [editorBlacklist, setEditorBlacklist] = useState("");
  const [editorRestructuring, setEditorRestructuring] = useState<"moderate" | "minimal">("moderate");
  const [editorPrompt, setEditorPrompt] = useState(DEFAULT_EDITOR_PROMPT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Whether the server has KEYS_ENCRYPTION_SECRET configured — previously only ever logged to
  // the (developer-facing, rarely-opened) debug panel; now also surfaced directly in Settings
  // so a user genuinely knows whether their API keys are encrypted at rest.
  const [keysEncryptionEnabled, setKeysEncryptionEnabled] = useState<boolean | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  // New Tab & Custom Team states
  const [activeTab, setActiveTab] = useState("custom");
  const [customTeam, setCustomTeam] = useState<CustomAgent[]>([
    { id: "agent_1", provider: "gemini", model: "gemini-3.8-flash", name: "Assistant", persona: "You are a friendly, helpful assistant. Give clear, practical answers, and ask a clarifying question when the task is ambiguous." }
  ]);
  // Dedicated Product Specification team and knowledge scoping
  const [productTeam, setProductTeam] = useState<CustomAgent[]>(() => {
    try {
      const saved = localStorage.getItem("product_team_roster");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((agent: CustomAgent) => {
            const validModels = (MODEL_OPTIONS[agent.provider] || []).map(m => m.id);
            if (!validModels.includes(agent.model)) {
              return { ...agent, model: MODEL_OPTIONS[agent.provider]?.[0]?.id || "gemini-3.8-flash" };
            }
            return agent;
          });
        }
      }
    } catch (e) {}
    return DEFAULT_PRODUCT_AGENTS;
  });
  const [productKnowledgeScope, setProductKnowledgeScope] = useState<"product_only" | "all">("all");
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  // In-flight upload tracking: previously a file just silently appeared once processing
  // finished (FileReader for text/images, pdfjs page-by-page extraction for PDFs), with no
  // feedback while that ran — easy to mistake for nothing having happened, especially for a
  // large PDF. Each entry gets a small spinner row; a 30s per-file timeout prevents a stuck
  // read from leaving that spinner there forever.
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string }[]>([]);
  const UPLOAD_TIMEOUT_MS = 30000;
  useEffect(() => { knowledgeFilesRef.current = knowledgeFiles; }, [knowledgeFiles]);
  const [trashedSources, setTrashedSources] = useState<KnowledgeFile[]>([]);
  const [customPrompt, setCustomPromptState] = useState<string>(() => {
    try {
      return localStorage.getItem("orchestra_custom_prompt") || "";
    } catch {
      return "";
    }
  });
  const setCustomPrompt = useCallback((val: string) => {
    setCustomPromptState(val);
    try {
      localStorage.setItem("orchestra_custom_prompt", val);
    } catch {}
  }, []);

  const [productPrompt, setProductPromptState] = useState<string>(() => {
    try {
      return localStorage.getItem("orchestra_product_prompt") || "";
    } catch {
      return "";
    }
  });
  const setProductPrompt = useCallback((val: string) => {
    setProductPromptState(val);
    try {
      localStorage.setItem("orchestra_product_prompt", val);
    } catch {}
  }, []);
  // Optional, separate from the free-text task: constraints the team must respect and what a
  // good outcome looks like, so a pivot can be checked against them explicitly rather than
  // everything living undifferentiated in one textarea.
  // Pipe-to-Prompt bridge (BriefBridge): the Enquiry Hub compiles a client brief into
  // Markdown and hands it here; reusing the existing productPrompt/setActiveTab state
  // (rather than new props on ProductTab) means the Product tab picks it up exactly
  // like a prompt the person typed themselves.
  const handlePipeEnquiryToPrompt = useCallback((prompt: string) => {
    setProductPrompt(prompt);
    setActiveTab("product");
  }, [setProductPrompt]);
  const [taskConstraints, setTaskConstraints] = useState("");
  const [taskSuccessCriteria, setTaskSuccessCriteria] = useState("");
  const [isBriefDetailsOpen, setIsBriefDetailsOpen] = useState(false);
  // "Expand My Prompt" (feature request): opt-in, review-and-edit before use, never
  // automatic. Separate from the pre-discussion clarifying-question flow — this only helps
  // build a better initial prompt, it doesn't replace that later check.
  const [isExpandingPrompt, setIsExpandingPrompt] = useState(false);
  const [expandedPromptDraft, setExpandedPromptDraft] = useState<string | null>(null);
  const [expandedPromptHasRoleWarning, setExpandedPromptHasRoleWarning] = useState(false);
  const [customResults, setCustomResults] = useState<Record<string, { name: string; provider: string; text: string; loading: boolean; error?: string }>>({});
  const [customTeamLoading, setCustomTeamLoading] = useState(false);

  // My Teams: saved Team Agents rosters the user can reuse to start a new conversation
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [savedKnowledgeSets, setSavedKnowledgeSets] = useState<SavedKnowledgeSet[]>([]);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [isSaveTeamDialogOpen, setIsSaveTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isSaveKnowledgeSetDialogOpen, setIsSaveKnowledgeSetDialogOpen] = useState(false);
  const [newKnowledgeSetName, setNewKnowledgeSetName] = useState("");
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [shareDialogRun, setShareDialogRun] = useState<CollaborativeRun | null>(null);
  const [shareExpiryChoice, setShareExpiryChoice] = useState<number | null>(30);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);
  const [isSharingRun, setIsSharingRun] = useState(false);
  // Target-a-specific-section (deliverable regeneration): previously the only way to
  // improve one section was re-running the whole deliverable draft. This regenerates a
  // single section in place, optionally with manager feedback on what should change.
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [sectionRegenDraft, setSectionRegenDraft] = useState<{ id: string; feedback: string } | null>(null);
  // "Open the document" for a knowledge source — since only extracted text (or, for
  // images, the actual data URL) is retained, not the original binary, this opens a
  // preview rather than downloading a file that no longer exists in its original form.
  const [previewingKnowledgeFile, setPreviewingKnowledgeFile] = useState<KnowledgeFile | null>(null);

  // External resources toggle: when true, agents may use general knowledge / live web search
  // in addition to the knowledge base; when false, agents are restricted to uploaded documents only.
  const [useExternalResources, setUseExternalResources] = useState(true);

  // Collapsible state for the Knowledge Base & Agent Roster cards
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isAgentRosterOpen, setIsAgentRosterOpen] = useState(false);
  // Per-agent editor expansion: cards show a one-line summary (name · provider · model)
  // until clicked, so a multi-agent roster no longer forces a very long scroll.
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

  // Knowledge Base: multi-source ingestion (file upload, links, pasted text)
  const [newSourceType, setNewSourceType] = useState<KnowledgeSourceType>("file");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceText, setNewSourceText] = useState("");

  // Tracks whether the user has connected their Google account for each Google-backed
  // source type (Drive, Calendar, Gmail, NotebookLM). Each requires its own sign-in +
  // consent step since they read the user's own data under different scopes.
  const [googleConnections, setGoogleConnections] = useState<Record<GoogleGatedSourceType, boolean>>({
    google_drive: false,
    google_calendar: false,
    gmail: false,
    notebooklm: false
  });
  const [googleConnectNotice, setGoogleConnectNotice] = useState<string | null>(null);
  // Live OAuth access tokens, kept in memory only (never persisted to Firestore) — this is
  // what actually lets us fetch real Drive/Calendar/Gmail content. They expire after roughly
  // an hour and don't survive a page reload, at which point "Connect" needs to run again.
  const googleTokensRef = useRef<Partial<Record<GoogleGatedSourceType, string>>>({});
  const [googleFetchingId, setGoogleFetchingId] = useState<string | null>(null);
  // Same idea as googleFetchingId, for the GitHub-repo-link source type below.
  const [githubFetchingId, setGithubFetchingId] = useState<string | null>(null);
  // Deliberately separate from googleTokensRef/GOOGLE_SCOPES above: those are read-only
  // scopes for pulling knowledge-base content IN. Backing up a spec to Drive is a WRITE,
  // so it gets its own narrower scope and its own token — see backupProductSpecToDrive.
  const driveBackupTokenRef = useRef<string | null>(null);
  const [isBackingUpToDrive, setIsBackingUpToDrive] = useState(false);

  // Agent Roster: suggest a multi-agent setup from a described decision
  const [decisionGoal, setDecisionGoal] = useState("");
  // Clarifying questions asked before a discussion starts (both Parallel and Collaborative).
  // The collected Q&A is kept in a ref (not state) so it's available synchronously the
  // instant the discussion launches, with no stale-closure risk from a state update timing.
  const [clarifyingQuestions, setClarifyingQuestions] = useState<{ question: string; options: string[]; askedBy: string; whyImAsking?: string }[] | null>(null);
  // Slot-per-question answers, aligned by index: null = not yet answered (the lowest null is
  // the current question), "" = skipped individually, any other string = the answer. This is
  // what makes answers editable — clicking edit just returns that slot to null, and the flow
  // naturally re-presents it, with every other answer untouched. Kickoffs are conversations:
  // people revise earlier answers when a later question reframes them.
  const [clarifyingAnswers, setClarifyingAnswers] = useState<(string | null)[]>([]);
  const [customClarifyingAnswer, setCustomClarifyingAnswer] = useState("");

  // Post-outcome check-in: after a fresh Collaborative result (Decision or Deliverable), the
  // team may have a few genuine questions before considering the work fully wrapped up. A
  // fixed free-text closing question is always appended. "gate" shows the initial two-choice
  // banner; "answering" walks through the questions one at a time; "dismissed"/"hidden" show
  // nothing further for this run.
  const [postOutcomeQuestions, setPostOutcomeQuestions] = useState<{ question: string; options: string[]; askedBy: string; freeTextOnly?: boolean }[] | null>(null);
  const [postOutcomeGateState, setPostOutcomeGateState] = useState<"hidden" | "gate" | "answering" | "dismissed">("hidden");
  const [postOutcomeIndex, setPostOutcomeIndex] = useState(0);
  // "Go Deeper" as scope expansion (distinct from "Let's discuss this," which is a free-form
  // chat about a node — this is the mechanism by which the team's actual working scope
  // GROWS, the way a manager would hand a real team member a new assignment mid-project).
  // Session state is intentionally NOT persisted to the run/Firestore — it's a live,
  // abandonable UI concept until the manager reaches and confirms the approval step, which
  // gives "closing the modal discards everything" for free rather than needing explicit
  // cleanup logic. Type + sentinel are defined at module scope (see near NodeActionsMenu)
  // so the approval-preview component can share the exact same shape.
  const [goDeeperSessions, setGoDeeperSessions] = useState<Record<string, GoDeeperSessionState>>({});
  // The dict key is `${runId}::${nodeId}`, NOT the bare node id — see goDeeperSessionKey.
  const [activeGoDeeperSessionKey, setActiveGoDeeperSessionKey] = useState<string | null>(null);
  const [goDeeperCustomAnswer, setGoDeeperCustomAnswer] = useState("");
  // Node whose full Expand-scope Q&A transcript (including unchosen multiple-choice
  // options) is currently being viewed — set from the node menu's "View scoping
  // conversation" item, independent of any live Go Deeper session.
  const [viewingScopingQANode, setViewingScopingQANode] = useState<DecisionNode | null>(null);
  const activeGoDeeperSession = activeGoDeeperSessionKey ? goDeeperSessions[activeGoDeeperSessionKey] : null;
  const [showGoDeeperAxisPicker, setShowGoDeeperAxisPicker] = useState(false);
  const [postOutcomeAnswers, setPostOutcomeAnswers] = useState<(string | null)[]>([]);
  const [postOutcomeCustomAnswer, setPostOutcomeCustomAnswer] = useState("");
  const [isCheckingClarification, setIsCheckingClarification] = useState(false);
  const clarificationContextRef = useRef("");
  // Structured parallel to clarificationContextRef (which flattens everything into one text
  // blob for the prompt) — kept separately so Discussion Requirements can show each
  // clarifying Q&A as its own entry instead of one undifferentiated paragraph.
  const clarificationEntriesRef = useRef<{ question: string; answer: string }[]>([]);
  const getTaskWithClarifications = useCallback(() => {
    let task = clarificationContextRef.current ? `${customPrompt}\n\nCLARIFICATIONS FROM THE USER:\n${clarificationContextRef.current}` : customPrompt;
    if (taskConstraints.trim()) task += `\n\nCONSTRAINTS (must be respected):\n${taskConstraints.trim()}`;
    if (taskSuccessCriteria.trim()) task += `\n\nSUCCESS CRITERIA (what a good outcome looks like):\n${taskSuccessCriteria.trim()}`;
    return task;
  }, [customPrompt, taskConstraints, taskSuccessCriteria]);
  const [isSuggestTeamOpen, setIsSuggestTeamOpen] = useState(false);
  const [suggestingTeam, setSuggestingTeam] = useState(false);
  const [suggestTeamError, setSuggestTeamError] = useState<string | null>(null);
  const [suggestTeamRationale, setSuggestTeamRationale] = useState<string | null>(null);
  // Suggest a Team now previews before committing: nothing touches the live roster until
  // the user reviews the suggestion and applies it (optionally deselecting individual agents).
  const [suggestedTeamPreview, setSuggestedTeamPreview] = useState<CustomAgent[] | null>(null);
  const [suggestedTeamSelected, setSuggestedTeamSelected] = useState<Record<string, boolean>>({});
  const [suggestTeamMode, setSuggestTeamMode] = useState<"replace" | "add">("replace");
  const [justAppliedSuggestion, setJustAppliedSuggestion] = useState(false);

  // Decision Tree display: collapsible + tree/flow view toggle
  const [isDecisionTreeOpen, setIsDecisionTreeOpen] = useState(true);
  // Item #2 from the QA roadmap: a plain-language, progressive-disclosure mode. Session-
  // only (not persisted) for now — collapses the tree by default (still manually
  // expandable) and swaps jargon labels for plain ones in the handful of spots checked
  // below. Deliberately NOT a full re-skin of every label in the app; scoped to the
  // highest-visibility jargon the QA simulation actually flagged (tab/tree section
  // headers, the facilitator-sits-out note, axis terminology).
  const [isSimpleView, setIsSimpleView] = useState(false);
  // Mutually exclusive (feature request): previously isDissentOpen/isAxesOpen were
  // independent, so both tiles could show their detail at once. Minority View defaults
  // open since dissent is the one thing worth surfacing without a click.
  const [openPanelDetail, setOpenPanelDetail] = useState<"dissent" | "axes" | null>("dissent");
  // The raw transcript is collapsed by default once an outcome exists — the Defined Outcome,
  // axes, reasons, and tree are the primary artefacts; the transcript is detail on demand.
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  // Considerations: local draft stances before "Submit Responses" commits them onto the run.
  // Agree is the effective default for any consideration the manager hasn't touched — matches
  // the Gatekeeper's own "approved: true unless unchecked" precedent.
  // (isDissentOpen removed — merged into openPanelDetail above)
  const [isConsiderationsOpen, setIsConsiderationsOpen] = useState(false);
  const [considerationDraftResponses, setConsiderationDraftResponses] = useState<Record<string, { stance: "agree" | "alternative" | "custom" | "disagree" | "uncertain"; chosenAlternative?: string; note: string }>>({});
  const [isAskingTeamToReconsider, setIsAskingTeamToReconsider] = useState(false);
  // Mirrors isAskingTeamToReconsider — same "manager-triggered check, not a chat message"
  // pattern, just for checkAgainstNewKnowledgeSources instead.
  const [isCheckingKnowledgeDrift, setIsCheckingKnowledgeDrift] = useState(false);
  // Chat History: client-side search filter and which entry (if any) is being renamed inline.
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [renamingHistoryId, setRenamingHistoryId] = useState<string | null>(null);
  // Cross-run comparison (Phase 3 roadmap item #2): pairwise by design — a 3+-way diff
  // has no clean visual representation without a lot more UI, and every QA scenario that
  // asked for this (re-run vs. original, site A vs. site B) was fundamentally a pair.
  // Picking a third replaces the first rather than growing the selection.
  const [selectedRunIdsForCompare, setSelectedRunIdsForCompare] = useState<string[]>([]);
  const [isCompareRunsOpen, setIsCompareRunsOpen] = useState(false);
  const toggleRunForCompare = (id: string) => {
    setSelectedRunIdsForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };
  const runToCompareInput = (run: CollaborativeRun) => ({
    prompt: run.prompt,
    outcome: run.outcome,
    reasons: run.reasons,
    decisionTree: run.decisionTree,
    facilitatorAgentName: run.facilitatorAgentName,
    dissent: run.dissent,
    axes: run.axes,
    considerations: run.considerations,
    rounds: run.rounds,
    premiseAmendments: run.premiseAmendments,
    groundedSourceCount: run.groundedSourceCount,
    hadVerifiedCalculations: run.hadVerifiedCalculations ?? (run.chatMessages || []).some(m => m.isVerifiedCalculation)
  });
  const [historyRenameDraft, setHistoryRenameDraft] = useState("");
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState<{ mode: "all" } | { mode: "single"; id: string; label: string } | null>(null);
  const [viewingTeamDetails, setViewingTeamDetails] = useState<SavedTeam | null>(null);
  // Decision tree override: when the user forces a branch (or removes a prior force), we
  // confirm first since either action triggers a full team re-discussion.
  const [pendingTreeAction, setPendingTreeAction] = useState<{ type: "force" | "remove" | "promote"; constraint?: string; label?: string; node?: DecisionNode } | null>(null);
  // Which lightweight single-call node operation is in flight, if any — plus enough context
  // to say what's actually happening ("Promoting X..." not just "Restructuring the tree...").
  // Previously three independent booleans (isPromotingNode / isMovingNode / isRevising) that
  // were mutually exclusive only by discipline — one value makes "two at once" structurally
  // impossible and gives every consumer the same single source of truth.
  const [nodeOpInFlight, setNodeOpInFlight] = useState<{ type: "promote" | "move" | "revise" | "addOutcome" | "newTab"; label: string; destination?: string } | null>(null);
  const isPromotingNode = nodeOpInFlight?.type === "promote";
  const isMovingNode = nodeOpInFlight?.type === "move";
  const isAddingOutcome = nodeOpInFlight?.type === "addOutcome";
  const isRunningNewTab = nodeOpInFlight?.type === "newTab";
  // Drag-and-drop for "Move Decision" (Flow view only): draggedNodeId is set on drag start
  // and read on drop; dragOverNodeId is purely visual (highlights the current hover target).
  // Both cleared on drag end regardless of whether a drop occurred, so a cancelled drag
  // never leaves a stale highlight behind.
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ node: DecisionNode; newParent: DecisionNode; looksLikeAlternatives: boolean } | null>(null);
  // "Revise this section/node" — the lightweight, single-call alternative to a full
  // re-discussion for a plain wording/content change. pendingRevisionRequest is the
  // request-input dialog (open when non-null); revisionPreview holds the before/after once
  // the one call has returned, awaiting explicit approval before anything is actually
  // applied — same confirm-before-commit shape as Move.
  const [pendingRevisionRequest, setPendingRevisionRequest] = useState<{ node: DecisionNode; isSection: boolean } | null>(null);
  const [revisionDraftText, setRevisionDraftText] = useState("");
  // "Add a new outcome" — the manager's own alternative, not something the team proposed.
  // Dialog is open when pendingAddOutcomeNode is non-null; submitAddOutcome runs the team
  // discussion and reconciles selection (see submitAddOutcome below).
  // Consolidated "Modify this decision" entry point (item #1 from the QA roadmap) — replaces
  // separate Expand Scope / Add Outcome menu items with one, which opens this tiny chooser
  // and then delegates to startGoDeeper or requestAddOutcome exactly as before.
  const [pendingModifyChoiceNode, setPendingModifyChoiceNode] = useState<DecisionNode | null>(null);
  const [pendingAddOutcomeNode, setPendingAddOutcomeNode] = useState<DecisionNode | null>(null);
  const [addOutcomeDraftText, setAddOutcomeDraftText] = useState("");
  // "quick" = one facilitator call (the original behaviour). "full" = the whole team debates
  // the new idea against the existing sibling(s) first (position + validation rounds, same
  // engine shape as "+ New Tab"), and the facilitator's selection call is grounded in that
  // debate rather than judging the idea in isolation.
  const [addOutcomeMode, setAddOutcomeMode] = useState<"quick" | "full">("quick");
  // "+ New Tab" — asks for the new decision up front, then runs a full multi-round
  // discussion (same team, same depth setting) scoped to just this decision.
  const [pendingNewTabDialog, setPendingNewTabDialog] = useState(false);
  const [newTabDraftText, setNewTabDraftText] = useState("");
  // Set right after a new tab or a delete changes which root should be showing — read once by
  // DecisionTreeSection (which owns the actual tab-index state) via a useEffect, then cleared.
  const [focusRootId, setFocusRootId] = useState<string | null>(null);
  const isRevising = nodeOpInFlight?.type === "revise";
  const [revisionPreview, setRevisionPreview] = useState<{
    node: DecisionNode;
    isSection: boolean;
    request: string;
    beforeLabel: string;
    afterLabel: string;
    beforeText: string;
    afterText: string;
  } | null>(null);
  // Dismissal for the structuralChangeNote / preservationWarnings banners (Layers 1 & 2 of
  // the re-discussion data-loss fix) — keyed by run id so switching to a different run (or
  // a fresh re-discussion producing a new run) never inherits a stale dismissal.
  const [dismissedChangeBannerForRunId, setDismissedChangeBannerForRunId] = useState<string | null>(null);
  // Discussion Requirements' "Later Additions" collapses past a threshold — this tracks
  // whether the manager has expanded it, reset implicitly on remount (navigating to a
  // different run) since only one Requirements panel is ever visible at once.
  const [expandedRequirementSources, setExpandedRequirementSources] = useState<"all" | null>(null);
  // One-time contextual nudge pointing at Expand Scope — deliberately NOT another tour
  // step (simulated low-technical-confidence personas found the existing tour but still
  // never discovered this feature in practice; a passive step in a tour they may have
  // clicked through isn't the same as an in-context hint at the moment it'd actually help).
  const [hasSeenGoDeeperNudge, setHasSeenGoDeeperNudge] = useState(() => localStorage.getItem("orchestra_seen_go_deeper_nudge") === "true");
  // Mid-discussion question: after the position round, the team can ask the manager ONE
  // genuinely blocking question before continuing to validate — not forced, only surfaced
  // when something real is missing. Bridges an in-flight async run to a UI answer via a
  // Promise whose resolver is stashed in a ref until the manager answers or skips.
  const [pendingMidQuestion, setPendingMidQuestion] = useState<{ question: string; options: string[]; askedBy: string } | null>(null);
  const [midQuestionCustomAnswer, setMidQuestionCustomAnswer] = useState("");
  const midQuestionResolverRef = useRef<((answer: string) => void) | null>(null);
  // Unified chat drawer (Concept A): replaces the separate "Chat With The Team" card and the
  // old per-node Discuss modal with one persistent, slide-out conversation surface.
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  // Workspace panel (Knowledge Base + Team Agents): slides in and out of the LEFT edge of
  // the screen — the mirror image of the Team Chat drawer on the right — but open by
  // default, since setting up sources and the roster is the natural first step of a
  // session. On small screens it opens as an overlay with a backdrop tap-to-dismiss.
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  // Escape closes the workspace panel, matching the free Escape-to-close behaviour the
  // Sheet-based Team Chat drawer gets from its underlying dialog primitive — the panel is a
  // hand-built docked/overlay hybrid (Sheet can't do "docked on desktop, overlay on mobile"
  // in one component) so this parity has to be wired explicitly rather than inherited.
  useEffect(() => {
    if (!isLeftPanelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsLeftPanelOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLeftPanelOpen]);
  const [chatDrawerPinnedNode, setChatDrawerPinnedNode] = useState<PinnedNodeContext | null>(null);
  // Who a drawer message is sent to: "team" (consolidated panel response, the original
  // behavior), "everyone" (every agent's individual take), or a specific agent's id.
  const [chatTargetMode, setChatTargetMode] = useState<string>(customTeam[0]?.id || "team");
  // A Deliverable outline awaiting manager sign-off before the team drafts full sections.
  const [pendingOutline, setPendingOutline] = useState<PendingDeliverableOutline | null>(null);
  // Decision-path counterpart — see PendingDecisionAxes.
  const [pendingAxes, setPendingAxes] = useState<PendingDecisionAxes | null>(null);
  // Live milestone visibility while drafting: which sections are still pending/in-progress vs
  // done, so the manager sees sections land one at a time instead of everything appearing at
  // once when the whole batch finishes.
  const [draftingOutlineSections, setDraftingOutlineSections] = useState<PendingOutlineSection[] | null>(null);
  const [draftingSectionStatus, setDraftingSectionStatus] = useState<Record<string, "pending" | "drafting" | "done">>({});
  const [decisionTreeView, setDecisionTreeView] = useState<"tree" | "flow">("flow");
  // Simple caps rendering at 5 levels; Expanded shows everything. Toggle only appears when
  // the tree actually runs deeper than 5 levels.
  const [treeDetailView, setTreeDetailView] = useState<"simple" | "expanded">("simple");

  // Conversation history for the Agent Comparison Playground
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonRun[]>([]);

  // Conversation history for Multi Agent Team - Parallel mode
  const [parallelTeamHistory, setParallelTeamHistory] = useState<ParallelTeamRun[]>([]);

  // Team Session Console mode: "parallel" runs agents independently (existing behaviour),
  // "collaborative" has agents converse to reach a single, defined outcome.
  const [chatMode, setChatMode] = useState<"parallel" | "collaborative">("collaborative");
  // Manually-maintained — there's no API that reports "this model is lightweight/preview" on
  // the fly, and the providers don't even agree on what a lightweight tier looks like (see
  // MODEL_OPTIONS ordering comments). Update this alongside MODEL_OPTIONS whenever a model is
  // added — it only needs the ones worth flagging as "consider something heavier for a big
  // KB-heavy run", not a full tier for every model.
  const LIGHTWEIGHT_MODEL_IDS = new Set([
    "gemini-3.1-flash-lite", "gemini-3-flash-preview",
    "claude-haiku-4-5-20251001",
    "gpt-5.6-luna", "gpt-5.4-mini",
    "sonar",
    "grok-3-mini",
  ]);
  // Set once per launch attempt when launchDiscussion detects a large KB/prompt combined
  // with at least one lightweight-tier agent on the team — see launchDiscussion below.
  // "Continue anyway" re-calls launchDiscussion with skipSizeCheck=true; changing the team,
  // KB, or prompt after seeing this clears it so the next launch attempt re-checks fresh.
  const [bigDiscussionWarning, setBigDiscussionWarning] = useState<{ totalChars: number; lightAgentNames: string[] } | null>(null);
  const [discussionDepth, setDiscussionDepth] = useState<DiscussionDepth>("fast");
  // The Detail Balance Engine: one visible setting unifying what were previously three
  // independent, invisible-to-each-other levers (Discussion Depth, pre-flight audience
  // questions, per-format export shaping). Standard is the existing lean behavior SaaS
  // personas already like; Domain-Expert opts into preserved technical terminology, deeper
  // nesting, and export-side document-control headers + a sources appendix — the depth
  // AECO/legal/finance personas kept asking for without a global mode switch.
  const [detailProfile, setDetailProfile] = useState<"standard" | "domain-expert">("standard");
  // Manager's explicit pre-discussion pick for decision vs deliverable — null means "let the
  // team decide" (the existing auto-classification in the decomposition step). Reset at the
  // top of every clarifying round so a stale pick can never carry over into an unrelated task.
  const [taskTypeOverride, setTaskTypeOverride] = useState<TaskType | null>(null);
  const domainExpertInstructionSuffix = detailProfile === "domain-expert"
    ? " DOMAIN-EXPERT MODE: preserve the user's own technical terminology and units exactly rather than simplifying or generalising them; nest the analysis as deep as the subject matter genuinely supports rather than stopping at a comfortable summary; never round a number differently than it was given."
    : "";
  const [collaborativeLoading, setCollaborativeLoading] = useState(false);
  const [collaborativeError, setCollaborativeError] = useState<string | null>(null);
  const [collaborativeRun, setCollaborativeRun] = useState<CollaborativeRun | null>(null);

  // Every Expand-scope session is scoped to the run it belongs to — the model's own example
  // schema hands out ids like "n1"/"n2", so two different conversations (or two entries in
  // History) landing on the same node id is the common case, not an edge case. Keying by
  // node id alone let a paused session, its Q&A transcript, or an "updated" badge from one
  // run silently attach to a same-numbered node in a totally different tree.
  const goDeeperKey = useCallback((nodeId: string) => `${collaborativeRun?.id || "none"}::${nodeId}`, [collaborativeRun?.id]);
  // Paused/in-progress Expand-scope sessions for the CURRENTLY DISPLAYED run only, keyed
  // back down to bare node ids — consumed via context by NodeActionsMenu so a node with a
  // paused session offers "Resume expanding scope". Scoped to collaborativeRun.id so a
  // session paused on a different run never lights up a menu here.
  const pausedGoDeeperNodeIds = useMemo(() => {
    if (!collaborativeRun) return new Set<string>();
    const prefix = `${collaborativeRun.id}::`;
    return new Set(Object.keys(goDeeperSessions).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length)));
  }, [goDeeperSessions, collaborativeRun]);

  const [collaborativeHistory, setCollaborativeHistory] = useState<CollaborativeRun[]>([]);
  // Completed (and in-progress-but-saved) Product Spec runs, so a spec survives navigating
  // away from the Product tab and shows up as its own entry in Chat History — see
  // unifiedHistory, openHistoryEntry, and the onSpecChange callback passed to <ProductTab>.
  const [productSpecHistory, setProductSpecHistory] = useState<ProductSpec[]>([]);
  // Set by openHistoryEntry when a "Product Spec" history entry is clicked; consumed by
  // ProductTab's own effect (which loads it into its local `spec` state and calls
  // onSpecLoaded to clear this back to null) rather than lifting all of ProductTab's
  // generation state up into App.tsx.
  const [productSpecToLoad, setProductSpecToLoad] = useState<ProductSpec | null>(null);
  // Only show the Outcome/Tree jump-to links once there's actually more than one viewport of
  // content to jump between. Uses a ResizeObserver on the document body rather than a
  // dependency-array check tied to specific state (collaborativeRun alone) — that approach
  // went stale the moment any OTHER state changed page height (expanding the transcript or
  // decision tree, generating a file), silently hiding the nav exactly when it was needed.
  // Observing actual layout size directly can't go stale the same way.
  const [pageOverflowsViewport, setPageOverflowsViewport] = useState(false);
  // Which "Jump to" section is currently in view — previously nothing tracked this at all,
  // and "Outcome" was simply hardcoded to always render as selected regardless of scroll
  // position. Measures scroll position directly (rather than IntersectionObserver) so this
  // has no dependency on displayedRun/taskType/etc., which are only declared much later
  // inside the JSX render closure and aren't reachable from a top-level effect — this just
  // re-queries the DOM by id on every scroll tick, so it works regardless of which sections
  // currently exist. "In view" means a thin band just below the floating header + Jump To
  // bar (matching jumpTo()'s own scroll offset), not "anywhere in the viewport" — otherwise
  // a tall section would stay "active" long after its heading scrolled out of sight. When
  // more than one short section sits in the band at once, the topmost wins.
  const [activeJumpSectionId, setActiveJumpSectionId] = useState<string | null>(null);
  useEffect(() => {
    const ids = ["prompt-section", "requirements-section", "output-section-decision", "output-section-deliverable", "minority-view-section", "tree-section", "considerations-section", "questions-section"];
    const BAND_TOP = 140; // px — matches jumpTo()'s own floating-bar offset
    const BAND_BOTTOM_FRACTION = 0.7; // ignore anything past 70% down the viewport

    let rafId: number | null = null;
    const measure = () => {
      rafId = null;
      const bandBottom = window.innerHeight * (1 - BAND_BOTTOM_FRACTION);
      let topId: string | null = null;
      let topY = Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > BAND_TOP && rect.top < bandBottom && rect.top < topY) {
          topY = rect.top;
          topId = id;
        }
      }
      if (topId) setActiveJumpSectionId(topId);
    };
    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
  useEffect(() => {
    if (!collaborativeRun) {
      setPageOverflowsViewport(false);
      return;
    }
    const check = () => setPageOverflowsViewport(document.documentElement.scrollHeight > window.innerHeight + 100);
    const raf = requestAnimationFrame(check); // let layout settle after this render first
    const observer = new ResizeObserver(check);
    observer.observe(document.body);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [collaborativeRun]);

  // Rotating "Panel is discussing" status text so long-running discussions don't look hung.
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  // Running count of actual provider calls made during the in-flight run (including
  // retries), shown alongside the loading state so cost/time isn't a total black box.
  const [callCount, setCallCount] = useState(0);
  // Tracks the actual current stage of a Collaborative run (decomposition, position round,
  // which validation round, synthesis, etc.) so the loading state reflects real progress
  // instead of only generic rotating flavour text.
  const [collaborativePhase, setCollaborativePhase] = useState("");
  // Manager raise-hand during a live run: the draft binds the input; the ref is what the
  // engine reads at round boundaries (state would be stale inside the loop's closure).
  const [managerInterjectionDraft, setManagerInterjectionDraft] = useState("");
  const managerInterjectionRef = useRef("");
  // The note is already live-bound into the ref as the manager types (the engine reads
  // whatever's there at the next round boundary regardless), so there's no real "unsent"
  // state to gate on. The Send button/Enter key exist purely for legibility — pressing one
  // gives an explicit, expected confirmation instead of the note just silently sitting in
  // a field with no indication anything happened when you're done typing it.
  const [interjectionQueuedFlash, setInterjectionQueuedFlash] = useState(false);
  const interjectionInputRef = useRef<HTMLInputElement>(null);

  // Live-view + resilience for an in-progress collaborative discussion (see checkpointRun
  // inside runCollaborativeSession). liveTranscript mirrors the transcript entries as they're
  // produced so the "watch live" panel has something to show while waiting; checkpointRunRef
  // holds the most recent checkpointed shape of the run so the outer catch block can persist
  // it to Chat History (tagged "failed") if the discussion dies before reaching synthesis,
  // without needing the transcript/taskType/etc. local variables (which are scoped inside
  // runCollaborativeSession's try block and not reachable from its catch).
  const [liveTranscript, setLiveTranscript] = useState<CollaborativeTranscriptEntry[]>([]);
  const [isLiveViewExpanded, setIsLiveViewExpanded] = useState(false);
  const checkpointRunRef = useRef<CollaborativeRun | null>(null);

  // Auto-scrolled to the bottom as liveTranscript grows, so the "watch live" panel behaves
  // like watching a chat rather than requiring a manual scroll after every new entry.
  const liveTranscriptScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLiveViewExpanded && liveTranscriptScrollRef.current) {
      liveTranscriptScrollRef.current.scrollTop = liveTranscriptScrollRef.current.scrollHeight;
    }
  }, [liveTranscript, isLiveViewExpanded]);

  // Follow-up Q&A with the team after a discussion or parallel run has completed.
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  // Document/spreadsheet/slide-deck creation: tracks in-flight generation and results for the
  // main Team Session output (Parallel/Collaborative) and for individual Team Chat drawer
  // messages (keyed by their id — see newMessageId()).
  const [mainGeneratedFiles, setMainGeneratedFiles] = useState<GeneratedFile[]>([]);
  // Pre-flight discovery: three one-tap questions (audience / purpose / size) before a
  // MANUAL file generation. Auto-detected generations mid-run skip this — they're flow
  // continuations where a modal would be an interruption. Answers persist locally so the
  // second generation opens pre-answered (confirm, don't interrogate) and "Skip" always
  // works: gating must never feel like a toll booth.
  const [filePreflight, setFilePreflight] = useState<{ kind: OfficeKind; sourceText: string } | null>(null);
  const [preflightAudience, setPreflightAudience] = useState<string>(() => localStorage.getItem("orchestra_pref_audience") || "Working team");
  const [preflightPurpose, setPreflightPurpose] = useState<string>(() => localStorage.getItem("orchestra_pref_purpose") || "Inform");
  const [preflightSize, setPreflightSize] = useState<string>(() => localStorage.getItem("orchestra_pref_size") || "Standard");

  const startPreflight = (kind: OfficeKind, sourceText: string) => setFilePreflight({ kind, sourceText });

  const generateWithPreflight = (skip: boolean) => {
    if (!filePreflight) return;
    const { kind, sourceText } = filePreflight;
    setFilePreflight(null);
    if (skip) { createMainFile(kind, sourceText); return; }
    localStorage.setItem("orchestra_pref_audience", preflightAudience);
    localStorage.setItem("orchestra_pref_purpose", preflightPurpose);
    localStorage.setItem("orchestra_pref_size", preflightSize);
    const sizeRule = kind === "pptx"
      ? { "One-pager": "Aim for about 5 slides.", "Standard": "Aim for about 10 slides.", "Comprehensive": "Aim for 15-20 slides." }[preflightSize]
      : { "One-pager": "Keep it to roughly one page of content — be ruthless about what earns inclusion.", "Standard": "Standard length — thorough but not exhaustive.", "Comprehensive": "Comprehensive — include supporting detail and context." }[preflightSize];
    const styleDirective = `Audience: ${preflightAudience.toLowerCase()} — ${preflightAudience === "Executives" ? "lead with conclusions, minimise process detail, formal register" : preflightAudience === "External client" ? "polished and self-contained; no internal shorthand" : "practical working detail is welcome"}. Purpose: to ${preflightPurpose.toLowerCase()} — ${preflightPurpose === "Decide" ? "structure the content to drive a decision (options, tradeoffs, recommendation)" : preflightPurpose === "Record" ? "structure as a durable record (what was decided, why, by whom)" : "structure to explain clearly"}. ${sizeRule}${
      detailProfile === "domain-expert" && kind === "docx"
        ? " DOMAIN-EXPERT MODE: add a short document-control line right after the title — a placeholder revision number, and today's date — since this may be attached to a formal review. Also add a final section titled \"Sources\" stating plainly whether this content was informed by uploaded reference material and, if the content below references specific documents or data by name, name them — otherwise state generally that no specific source documents were identified. Do not invent filenames you weren't given."
        : ""
    }`;
    createMainFile(kind, sourceText, styleDirective);
  };

  // Ecosystem exports: zero-LLM, instant, built from the run's structured data directly.
  const exportRunAs = async (format: "md" | "json" | "audit" | "pdf", run: CollaborativeRun) => {
    const { buildMarkdownDecisionRecord, buildRunJson, downloadTextFile, buildHumanReadableAudit, auditSectionsToPlainText } = await import("@/src/lib/runExports");
    const input = {
      prompt: run.prompt,
      outcome: run.outcome,
      reasons: run.reasons,
      decisionTree: run.decisionTree,
      facilitatorAgentName: run.facilitatorAgentName,
      dissent: run.dissent,
      axes: run.axes,
      considerations: run.considerations,
      rounds: run.rounds,
      premiseAmendments: run.premiseAmendments,
      groundedSourceCount: run.groundedSourceCount,
      hadVerifiedCalculations: run.hadVerifiedCalculations ?? (run.chatMessages || []).some(m => m.isVerifiedCalculation),
      timestamp: run.timestamp,
      spawnedRunIds: run.spawnedRunIds,
      revisitEvents: run.revisitEvents
    };
    const base = (run.prompt || "decision").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "decision";
    if (format === "md") {
      downloadTextFile(buildMarkdownDecisionRecord(input), `${base}_decision_record.md`, "text/markdown");
      logDebug("info", "Exported Markdown decision record");
    } else if (format === "json") {
      downloadTextFile(buildRunJson(input), `${base}_run.json`, "application/json");
      logDebug("info", "Exported structured JSON run");
    } else if (format === "audit") {
      const sections = buildHumanReadableAudit(input);
      downloadTextFile(auditSectionsToPlainText(sections, "Decision Audit"), `${base}_audit.txt`, "text/plain");
      logDebug("info", "Exported human-readable audit");
    } else {
      setIsExportingPdf(true);
      try {
        const { buildAuditPdf } = await import("@/src/lib/pdfExport");
        const sections = buildHumanReadableAudit(input);
        const bytes = await buildAuditPdf("Decision Audit", run.prompt, sections);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}_audit.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        logDebug("info", "Exported PDF audit");
      } catch (err: any) {
        console.error("Error generating PDF:", err);
        logDebug("error", "Failed to generate PDF", err?.message || err);
      } finally {
        setIsExportingPdf(false);
      }
    }
  };
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingConversation, setIsExportingConversation] = useState(false);
  const [mainFileGenerating, setMainFileGenerating] = useState<OfficeKind | null>(null);
  const [followUpFileGenerating, setFollowUpFileGenerating] = useState<{ id: string; kind: OfficeKind } | null>(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Requests permission only at the moment the user opts in — never on page load.
  const toggleNotifyOnComplete = async (enabled: boolean) => {
    if (enabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setNotifyOnComplete(false); return; }
    }
    setNotifyOnComplete(enabled);
  };

  // Fires when either loading flag transitions true→false while the tab is hidden — covers
  // both a full Collaborative run and a Chat/comment-batch exchange, the two genuinely
  // long-running operations in the app.
  useEffect(() => {
    const isLoadingNow = collaborativeLoading || followUpLoading;
    if (
      prevLoadingRef.current && !isLoadingNow && notifyOnComplete &&
      document.visibilityState === "hidden" &&
      typeof Notification !== "undefined" && Notification.permission === "granted"
    ) {
      try {
        const notification = new Notification("The team has finished", { body: "Your Orchestra conversation is ready to review." });
        notification.onclick = () => { window.focus(); notification.close(); };
      } catch {
        // Notification construction can throw in some contexts (e.g. iOS Safari) — nothing to
        // recover here, the in-app state is already correct regardless.
      }
    }
    prevLoadingRef.current = isLoadingNow;
  }, [collaborativeLoading, followUpLoading, notifyOnComplete]);

  // Debug log: records key actions and errors during the session so the user can copy them
  // for troubleshooting. Capped to avoid unbounded growth in a long session.
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const MAX_DEBUG_LOGS = 300;

  const logDebug = useCallback((level: DebugLogEntry["level"], message: string, details?: any) => {
    setDebugLogs(prev => {
      const entry: DebugLogEntry = {
        id: `dbg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        level,
        message,
        details: details !== undefined ? (typeof details === "string" ? details : JSON.stringify(details, null, 2)) : undefined
      };
      const next = [...prev, entry];
      return next.length > MAX_DEBUG_LOGS ? next.slice(next.length - MAX_DEBUG_LOGS) : next;
    });
  }, []);

  // First-run visibility: a brand-new user otherwise lands on two collapsed cards and an
  // empty chat with no obvious way in. Once the account data has synced, if the workspace
  // looks untouched (default single agent, no sources, no history), open the setup cards.
  // Runs at most once per session so it never fights the user's own collapse choices.
  const onboardingCheckDone = useRef(false);
  // Holds the AbortController for whichever discussion (Parallel or Collaborative) is
  // currently in flight, so the Stop button can cancel it.
  const runAbortRef = useRef<AbortController | null>(null);
  const hasEvaluatedTourRef = useRef(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  // Each step targets a REAL element on screen — previously this was a centered modal that
  // just blurred everything, which isn't guidance, it's an interruption. Steps 1-4 target
  // elements that exist before any run (sidebar, task composer); steps 5-7 describe
  // run-dependent features (Go Deeper, the calculator, export formats) that genuinely don't
  // exist yet on a fresh session — those fall back to a small labeled corner card rather
  // than pretending to point at something absent.
  const TOUR_STEPS: { title: string; body: string; selector: string; requiresChatDrawer?: boolean }[] = [
    { title: "Knowledge Base", body: "Upload reference material here — the panel checks its claims against it, and figures that don't trace back to a source get flagged.", selector: "#panel-section-knowledge-base" },
    { title: "Team Agents", body: "Add as many agents as your task needs. Each one argues its own position before the panel converges on a single outcome.", selector: "#panel-section-team-agents" },
    { title: "Expand My Prompt", body: "Rewrites a vague task into a clearer, better-structured one — naming sub-questions your wording only implied. You always review it before it's used.", selector: "[data-tour='expand-prompt']" },
    { title: "Discussion Depth & cost", body: "This dropdown shows roughly how many model calls each depth will use for your current team size, before you commit to it.", selector: "[data-tour='depth-picker']" },
    { title: "Go Deeper", body: "After a run finishes, you'll be asked where to take it next. \"Go deeper on this\" opens a short scoping Q&A — the team asks you a few questions, then proposes new sub-decisions for your approval before anything is added. The same session is available on any individual tree node via its menu's \"Modify This Decision\" action (choose \"Elaborate on what's here\"). You'll see this once a discussion completes.", selector: "[data-tour='go-deeper']" },
    { title: "The calculator", body: "In Team Chat, the calculator icon computes an exact figure with real arithmetic and marks it \"verified\" — a fact the panel can then reason from.", selector: "[data-tour='calculator']", requiresChatDrawer: true },
    { title: "Export formats", body: "Word, Slides, and Spreadsheet are AI-shaped documents with grounding checks. Markdown and JSON are instant, no-cost structured exports.", selector: "[data-tour='export-formats']" },
    { title: "Jump To", body: "Once a discussion completes, this bar lets you jump straight to the Prompt, Outcome, Minority View, Decision Tree, Considerations, or any open Questions — no scrolling required.", selector: "[data-tour='jump-nav']" }
  ];
  const [tourTargetRect, setTourTargetRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!isTourOpen) return;
    const step = TOUR_STEPS[tourStep];
    if (!step?.selector) { setTourTargetRect(null); return; }
    // The calculator lives inside the Team Chat drawer, which is normally closed — open it
    // first so the element actually exists to find, rather than falling back to the corner
    // card just because nothing had opened the drawer yet.
    if (step.requiresChatDrawer && !isChatDrawerOpen) openChatDrawer();
    const measureDelay = step.requiresChatDrawer && !isChatDrawerOpen ? 400 : 350;
    const t = setTimeout(() => {
      const el = document.querySelector(step.selector);
      if (!el) { setTourTargetRect(null); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTourTargetRect(el.getBoundingClientRect());
    }, measureDelay);
    const measure = () => {
      const el = document.querySelector(step.selector);
      if (el) setTourTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isTourOpen, tourStep]);
  // Every anchored step lives on the "custom" tab with the left workspace panel open —
  // if the tour launched from a different tab (the manual "Show Me Around" replay can),
  // the anchors wouldn't exist yet and every step would silently fall back to the corner
  // card. This switches to the right place first, then opens the tour on the next tick so
  // the anchors have actually mounted by the time the first step tries to measure one.
  const startTour = () => {
    setActiveTab("custom");
    setIsLeftPanelOpen(true);
    setTourStep(0);
    setTimeout(() => setIsTourOpen(true), 50);
  };
  const closeTour = () => {
    setIsTourOpen(false);
    setTourStep(0);
    setTourTargetRect(null);
    if (user) {
      setDoc(doc(db, "users", user.uid, "settings", "private"), { hasSeenTour: true, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }
  };
  const renderTourFooter = () => (
    <>
      <div className="flex items-center gap-1.5">
        {TOUR_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === tourStep ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200 dark:bg-slate-700"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={closeTour} className="text-xs text-slate-500 h-7 px-2">
          Skip
        </Button>
        <div className="flex gap-2">
          {tourStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setTourStep(tourStep - 1)} className="h-7 text-xs px-2.5">
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => (tourStep + 1 < TOUR_STEPS.length ? setTourStep(tourStep + 1) : closeTour())}
            className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {tourStep + 1 < TOUR_STEPS.length ? "Next" : "Done"}
          </Button>
        </div>
      </div>
    </>
  );
  // Synchronous re-entrancy guard (Phase 4 roadmap — race-condition fix): every trigger
  // that starts a run (redo, revisit, Discuss This Batch, Considerations re-run, Go
  // Deeper) calls runCollaborativeSession directly, and several of their buttons only
  // disabled based on `collaborativeLoading`, which lags the click by a render — fast
  // enough double-clicking could fire two concurrent runs. A ref is checked and set
  // synchronously, in the same tick as the click, before any state update or await.
  const collaborativeRunInFlightRef = useRef(false);
  // Separate from runAbortRef: a Chat With The Team exchange can be in flight independently
  // of the main Start Discussion run, and needs its own cancellation so a stale follow-up
  // can't splice old data into a conversation the user has since moved away from.
  const followUpAbortRef = useRef<AbortController | null>(null);
  // Mirrors knowledgeFiles for safe reads inside async callbacks (e.g. Google content
  // fetches) without those closures going stale mid-flight.
  const knowledgeFilesRef = useRef<KnowledgeFile[]>([]);
  useEffect(() => {
    if (!user || onboardingCheckDone.current) return;
    const timer = setTimeout(() => {
      if (onboardingCheckDone.current) return;
      onboardingCheckDone.current = true;
      const looksNew = customTeam.length <= 1 && knowledgeFiles.length === 0 && collaborativeHistory.length === 0 && parallelTeamHistory.length === 0;
      if (looksNew) {
        setIsAgentRosterOpen(true);
        setIsKnowledgeBaseOpen(true);
      }
    }, 1500); // allow the Firestore snapshots a moment to hydrate first
    return () => clearTimeout(timer);
  }, [user, customTeam.length, knowledgeFiles.length, collaborativeHistory.length, parallelTeamHistory.length]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setProfileName(currentUser.displayName || "");
        setProfilePhoto(currentUser.photoURL || "");
      } else {
        setUser(null);
        // Reset keys and settings for new user
        setKeys({ gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" });
        setModels({
          gemini: "gemini-3.8-flash",
          anthropic: "claude-sonnet-5",
          openai: "gpt-5.6-sol",
          perplexity: "sonar-pro",
          grok: "grok-3",
        });
        setLoopingEnabled(false);
        setMaxLoops(1);
        setProfileName("");
        setProfilePhoto("");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore: settings doc plus per-user subcollections for knowledge sources,
  // chat history, and saved teams — each stored as its own document so a large PDF, image,
  // or long discussion transcript doesn't bump into a single document's size limit.
  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, "users", user.uid, "settings", "private");
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.keys) setKeys((prev) => ({ ...prev, ...data.keys }));
        if (data.models) {
          const sanitizedModels = { ...data.models };
          (Object.keys(MODEL_OPTIONS) as (keyof typeof MODEL_OPTIONS)[]).forEach((prov) => {
            const validIds = MODEL_OPTIONS[prov].map((m) => m.id);
            if (!validIds.includes(sanitizedModels[prov])) {
              sanitizedModels[prov] = MODEL_OPTIONS[prov][0].id;
            }
          });
          setModels((prev) => ({ ...prev, ...sanitizedModels }));
        }
        if (data.loopingEnabled !== undefined) setLoopingEnabled(data.loopingEnabled);
        if (data.maxLoops !== undefined) setMaxLoops(data.maxLoops);
        if (data.customTeam && Array.isArray(data.customTeam)) {
          const sanitizedTeam = data.customTeam.map((agent: CustomAgent) => {
            const validModels = (MODEL_OPTIONS[agent.provider] || []).map(m => m.id);
            if (!validModels.includes(agent.model)) {
              return { ...agent, model: MODEL_OPTIONS[agent.provider]?.[0]?.id || "gemini-3.8-flash" };
            }
            return agent;
          });
          setCustomTeam(sanitizedTeam);
        }
        if (data.productTeam && Array.isArray(data.productTeam) && data.productTeam.length > 0) {
          const sanitizedProductTeam = data.productTeam.map((agent: CustomAgent) => {
            const validModels = (MODEL_OPTIONS[agent.provider] || []).map(m => m.id);
            if (!validModels.includes(agent.model)) {
              return { ...agent, model: MODEL_OPTIONS[agent.provider]?.[0]?.id || "gemini-3.8-flash" };
            }
            return agent;
          });
          setProductTeam(sanitizedProductTeam);
        }
        if (data.useExternalResources !== undefined) setUseExternalResources(data.useExternalResources);
        if (data.editorSettings) {
          const es = data.editorSettings;
          if (es.enabled !== undefined) setEditorEnabled(es.enabled);
          if (es.blacklist !== undefined) setEditorBlacklist(es.blacklist);
          if (es.restructuring !== undefined) setEditorRestructuring(es.restructuring);
          if (es.prompt !== undefined) setEditorPrompt(es.prompt);
        }
        // First-run coach-mark tour: features kept shipping ahead of discoverability
        // across multiple rounds of testing (Go Deeper, the calculator, Expand My Prompt
        // all independently reported as "good but I didn't find it"). Shown once
        // automatically; replayable anytime from the profile menu. Only evaluated once per
        // session (not on every settings snapshot) so saving something else mid-tour can't
        // reopen it.
        if (!hasEvaluatedTourRef.current) {
          hasEvaluatedTourRef.current = true;
          if (!data.hasSeenTour) startTour();
        }
      }
    });

    const sourcesRef = collection(db, "users", user.uid, "knowledgeSources");
    const unsubSources = onSnapshot(sourcesRef, (snap) => {
      setKnowledgeFiles(snap.docs.map(d => d.data() as KnowledgeFile));
    });

    // Recently deleted knowledge sources (soft-deleted by "Start Completely Fresh") so an
    // accidental reset never permanently loses uploaded documents.
    const trashRef = collection(db, "users", user.uid, "knowledgeTrash");
    const unsubTrash = onSnapshot(trashRef, (snap) => {
      setTrashedSources(snap.docs.map(d => d.data() as KnowledgeFile));
    });

    const historyRef = query(collection(db, "users", user.uid, "history"), orderBy("timestamp", "desc"), fsLimit(150));
    const unsubHistory = onSnapshot(historyRef, (snap) => {
      const comparisons: ComparisonRun[] = [];
      const parallels: ParallelTeamRun[] = [];
      const collaboratives: CollaborativeRun[] = [];
      const products: ProductSpec[] = [];
      snap.docs.forEach(d => {
        const data: any = d.data();
        if (data.type === "comparison") comparisons.push(data as ComparisonRun);
        else if (data.type === "parallel") parallels.push(data as ParallelTeamRun);
        else if (data.type === "collaborative") collaboratives.push(data as CollaborativeRun);
        else if (data.type === "product") products.push(data as ProductSpec);
      });
      setComparisonHistory(comparisons);
      setParallelTeamHistory(parallels);
      setCollaborativeHistory(collaboratives);
      setProductSpecHistory(products);
    });

    const teamsRef = collection(db, "users", user.uid, "teams");
    const unsubTeams = onSnapshot(teamsRef, (snap) => {
      const teams = snap.docs.map(d => d.data() as SavedTeam);
      teams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedTeams(teams);
    });

    const knowledgeSetsRef = collection(db, "users", user.uid, "knowledgeSets");
    const unsubKnowledgeSets = onSnapshot(knowledgeSetsRef, (snap) => {
      const sets = snap.docs.map(d => d.data() as SavedKnowledgeSet);
      sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedKnowledgeSets(sets);
    });

    const presetsRef = collection(db, "users", user.uid, "presets");
    const unsubPresets = onSnapshot(presetsRef, (snap) => {
      const presets = snap.docs.map(d => d.data() as SavedPreset);
      presets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedPresets(presets);
    });

    return () => {
      unsubSettings();
      unsubSources();
      unsubTrash();
      unsubHistory();
      unsubTeams();
      unsubKnowledgeSets();
      unsubPresets();
    };
  }, [user]);

  // Ensure enabled agents have keys
  useEffect(() => {
    setEnabledAgents(prev => {
      const next = { ...prev };
      let changed = false;
      (Object.keys(next) as (keyof typeof next)[]).forEach(agentId => {
        if (next[agentId] && !keys[agentId]) {
          next[agentId] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [keys]);

  // Rotates the "panel is discussing" status text every 5 seconds while a collaborative
  // session is running, so the user can see progress is being made rather than a frozen UI.
  // Cycling placeholder for the manager raise-hand input — the field previously looked like
  // an inert, unlabeled text box; rotating through what it actually DOES (rather than a
  // generic "type here") is the fix, mirroring the same rotation pattern already used for
  // the loading messages below. Stops rotating (and the field gets a persistent explanatory
  // line instead) the moment the manager starts typing.
  const [interjectionPlaceholderIndex, setInterjectionPlaceholderIndex] = useState(0);
  const INTERJECTION_PLACEHOLDERS = [
    "Add a note — it's read to the team at the next round boundary…",
    "e.g. \"focus on the EU market first\" — read out before the next round…",
    "Type here to steer the discussion without stopping it…",
    "Your note joins the transcript as \"You (the manager)\" for every agent to see…"
  ];
  useEffect(() => {
    if (managerInterjectionDraft.trim()) return;
    const interval = setInterval(() => {
      setInterjectionPlaceholderIndex(prev => (prev + 1) % INTERJECTION_PLACEHOLDERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [managerInterjectionDraft]);

  const COLLABORATIVE_LOADING_MESSAGES = [
    "Panel is discussing...",
    "Agents are weighing tradeoffs...",
    "Cross-checking each other's reasoning...",
    "Still going — this can take a minute for deeper discussions...",
    "Working through open questions...",
    "Converging on an outcome..."
  ];

  useEffect(() => {
    if (!collaborativeLoading && !followUpLoading) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % COLLABORATIVE_LOADING_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [collaborativeLoading, followUpLoading]);

  // Checked with an empty keys object — a side-effect-free way to read the server's
  // encryption status without touching any real key data, purely so this can run proactively
  // the moment Settings opens rather than only being inferable after a save.
  useEffect(() => {
    if (!isSettingsOpen || keysEncryptionEnabled !== null) return;
    axios.post("/api/keys/encrypt", { keys: {} })
      .then(res => setKeysEncryptionEnabled(res.data?.encryptionEnabled !== false))
      .catch(() => {}); // leave as null (unknown) rather than assuming either way on failure
  }, [isSettingsOpen, keysEncryptionEnabled]);

  const saveSettings = useCallback(async (newKeys: typeof keys, newModels: typeof models, newLoopingEnabled?: boolean, newMaxLoops?: number) => {
    if (!user) return;
    try {
      // Encrypt any plaintext keys server-side before they touch Firestore. Already-encrypted
      // values pass through unchanged; if the server has no encryption secret configured it
      // returns them as-is (legacy behaviour) and flags encryptionEnabled: false.
      let keysToStore = newKeys;
      try {
        const encRes = await axios.post("/api/keys/encrypt", { keys: newKeys });
        if (encRes.data?.keys) {
          keysToStore = encRes.data.keys;
          setKeys(prev => ({ ...prev, ...encRes.data.keys }));
          setKeysEncryptionEnabled(encRes.data.encryptionEnabled !== false);
          if (encRes.data.encryptionEnabled === false) {
            logDebug("warn", "API keys stored WITHOUT encryption", "Set KEYS_ENCRYPTION_SECRET in the server environment to enable encryption at rest.");
          }
        }
      } catch (encErr: any) {
        logDebug("warn", "Key encryption endpoint unavailable — storing keys unencrypted", encErr?.message || encErr);
      }

      const docRef = doc(db, "users", user.uid, "settings", "private");
      await setDoc(docRef, cleanUndefined({
        keys: keysToStore,
        models: newModels,
        loopingEnabled: newLoopingEnabled !== undefined ? newLoopingEnabled : loopingEnabled,
        maxLoops: newMaxLoops !== undefined ? newMaxLoops : maxLoops,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      logDebug("error", "Failed to save settings to cloud", error?.message || error);
      setStatus("Error saving settings to cloud");
    }
  }, [user]);

  // Persists Output Editor settings (Settings → Editor) separately from the main settings
  // save, since they're independent of API keys/models and change on their own schedule.
  const saveEditorSettings = useCallback(async (enabled: boolean, blacklist: string, restructuring: "moderate" | "minimal", prompt: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "settings", "private");
      await setDoc(docRef, cleanUndefined({
        editorSettings: { enabled, blacklist, restructuring, prompt },
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error: any) {
      console.error("Error saving editor settings:", error);
      logDebug("error", "Failed to save Output Editor settings", error?.message || error);
    }
  }, [user]);

  const saveCustomTeamAndFiles = useCallback(async (team: CustomAgent[], files: KnowledgeFile[], externalResources?: boolean) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "settings", "private");
      await setDoc(docRef, cleanUndefined({
        customTeam: team,
        useExternalResources: externalResources !== undefined ? externalResources : useExternalResources,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error: any) {
      console.error("Error saving custom team/files:", error);
      logDebug("error", "Failed to save agent team to cloud", error?.message || error);
    }
  }, [user, useExternalResources]);

  const saveProductTeamToCloud = useCallback(async (team: CustomAgent[]) => {
    try {
      localStorage.setItem("product_team_roster", JSON.stringify(team));
    } catch (e) {}
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "settings", "private");
      await setDoc(docRef, cleanUndefined({
        productTeam: team,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error: any) {
      console.error("Error saving product team:", error);
      logDebug("error", "Failed to save product team to cloud", error?.message || error);
    }
  }, [user]);

  // Knowledge sources live in their own subcollection (one document per source) so a large
  // PDF or image doesn't risk pushing the whole settings document over Firestore's size limit.
  const saveKnowledgeSource = useCallback(async (file: KnowledgeFile) => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid, "knowledgeSources", file.id);
      await setDoc(ref, { ...cleanUndefined(file), updatedAt: serverTimestamp() });
    } catch (error: any) {
      console.error("Error saving knowledge source:", error);
      logDebug("error", `Failed to save "${file.name}" to your account`, error?.message || error);
    }
  }, [user]);

  const deleteKnowledgeSourceRemote = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "knowledgeSources", id));
    } catch (error: any) {
      console.error("Error deleting knowledge source:", error);
      logDebug("error", "Failed to delete knowledge source from your account", error?.message || error);
    }
  }, [user]);

  // Soft-deletes a knowledge source: moved to knowledgeTrash rather than destroyed, so an
  // accidental "Start Completely Fresh" can be undone via the Restore affordance.
  const moveSourceToTrash = useCallback(async (file: KnowledgeFile) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "knowledgeTrash", file.id), { ...cleanUndefined(file), deletedAt: serverTimestamp() });
      await deleteDoc(doc(db, "users", user.uid, "knowledgeSources", file.id));
    } catch (error: any) {
      logDebug("error", `Failed to move "${file.name}" to recently deleted`, error?.message || error);
    }
  }, [user, logDebug]);

  const restoreTrashedSources = useCallback(async () => {
    if (!user || trashedSources.length === 0) return;
    try {
      for (const file of trashedSources) {
        const { deletedAt, ...clean } = file as any;
        await setDoc(doc(db, "users", user.uid, "knowledgeSources", file.id), { ...cleanUndefined(clean), updatedAt: serverTimestamp() });
        await deleteDoc(doc(db, "users", user.uid, "knowledgeTrash", file.id));
      }
      logDebug("info", `Restored ${trashedSources.length} knowledge source(s) from recently deleted`);
    } catch (error: any) {
      logDebug("error", "Failed to restore recently deleted sources", error?.message || error);
    }
  }, [user, trashedSources, logDebug]);

  // Persists one Chat History entry (comparison, parallel, or collaborative) to its own
  // document under the user's account, tagged with `type` so it can be split back out.
  const saveHistoryEntry = useCallback(async (type: UnifiedHistoryEntry["type"], entry: { id: string }) => {
    if (!user) return;
    try {
      // Long Extended-depth runs accumulate a large transcript, and a Product Spec's
      // revisionHistory keeps a full copy of every prior version of every section — either
      // can, in principle, approach Firestore's 1MB per-document limit. Both are only
      // trimmed if the entry as actually serialized is over budget (see
      // SAFE_HISTORY_DOC_BUDGET_CHARS / capSpecForHistoryStorage) rather than by a flat cap
      // applied unconditionally — a flat per-message or per-section cutoff was previously
      // discarding full-fidelity content from ordinary, moderately long runs and specs
      // nowhere near Firestore's actual limit. The live in-session UI always shows
      // full-fidelity content from local state regardless of what ends up stored here.
      const entryAny = entry as any;
      const fullSize = JSON.stringify(entryAny).length;
      const safeEntry =
        fullSize <= SAFE_HISTORY_DOC_BUDGET_CHARS
          ? entryAny
          : Array.isArray(entryAny.transcript)
          ? { ...entryAny, transcript: entryAny.transcript.map((t: any) => ({ ...t, message: truncateText(t.message, 4000) })) }
          : Array.isArray(entryAny.sections)
          ? capSpecForHistoryStorage(entryAny as ProductSpec).spec
          : entryAny;
      const ref = doc(db, "users", user.uid, "history", entry.id);
      // The Firestore query that reads this collection back (see historyRef below) orders
      // by `timestamp` — a query with `orderBy` silently excludes any document missing that
      // field entirely, rather than treating it as e.g. null/oldest. ProductSpec carries its
      // own date under `createdAt`, not `timestamp`, so without this normalization every
      // "product" entry saved here would be written successfully but then never appear in
      // History at all (previously the exact bug: Product specs never showed up). Every
      // entry type gets a real top-level `timestamp` here regardless of what its own object
      // calls its date field, so a future entry type can't silently reintroduce the same gap.
      const normalizedTimestamp = entryAny.timestamp || entryAny.createdAt || new Date().toISOString();
      await setDoc(ref, { ...cleanUndefined(safeEntry), type, timestamp: normalizedTimestamp, savedAt: serverTimestamp() });
    } catch (error: any) {
      console.error("Error saving history entry:", error);
      logDebug("error", "Failed to save conversation to Chat History", error?.message || error);
    }
  }, [user]);

  const clearAllHistoryRemote = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "history"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error: any) {
      console.error("Error clearing history:", error);
      logDebug("error", "Failed to clear Chat History from your account", error?.message || error);
    }
  }, [user]);

  // Deletes a single Chat History entry. The real-time Firestore listener updates the local
  // comparison/parallel/collaborative arrays automatically once the delete lands.
  const deleteHistoryEntry = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "history", id));
      logDebug("info", "Deleted a Chat History entry");
    } catch (error: any) {
      console.error("Error deleting history entry:", error);
      logDebug("error", "Failed to delete Chat History entry", error?.message || error);
    }
  }, [user, logDebug]);

  // Duplicates a Chat History entry into an independent copy — same content, new id and
  // timestamp, titled "Copy of ..." so it's easy to tell apart in the list. The point: branch
  // off a completed run before making further changes to it, so the original stays intact as
  // a "before" snapshot — then use the existing run-comparison picker (the checkbox already on
  // each collaborative entry) to line the two up side by side once they've diverged. No new
  // comparison mechanism needed; this just gives that picker two things worth comparing.
  const copyHistoryEntry = useCallback(async (entry: UnifiedHistoryEntry) => {
    if (!user) return;
    const newId = `${entry.type}_${Date.now()}`;
    const newTimestamp = new Date().toISOString();
    const baseTitle = entry.title || entry.summary;
    const newTitle = `Copy of ${baseTitle}`;
    try {
      if (entry.type === "collaborative") {
        const source = collaborativeHistory.find(r => r.id === entry.id);
        if (!source) return;
        // spawnedRunIds cleared: that's "runs this one caused" (revisits, Go Deeper, etc.) —
        // the copy hasn't caused anything yet, so it starts with none of its own.
        const copy: CollaborativeRun = { ...source, id: newId, timestamp: newTimestamp, title: newTitle, spawnedRunIds: undefined };
        setCollaborativeHistory(prev => [copy, ...prev]);
        await saveHistoryEntry("collaborative", copy);
      } else if (entry.type === "comparison") {
        const source = comparisonHistory.find(r => r.id === entry.id);
        if (!source) return;
        const copy: ComparisonRun = { ...source, id: newId, timestamp: newTimestamp, title: newTitle };
        setComparisonHistory(prev => [copy, ...prev]);
        await saveHistoryEntry("comparison", copy);
      } else if (entry.type === "product") {
        const source = productSpecHistory.find(r => r.id === entry.id);
        if (!source) return;
        const copy: ProductSpec = { ...source, id: newId, createdAt: newTimestamp, title: newTitle };
        setProductSpecHistory(prev => [copy, ...prev]);
        await saveHistoryEntry("product", copy);
      } else {
        const source = parallelTeamHistory.find(r => r.id === entry.id);
        if (!source) return;
        const copy: ParallelTeamRun = { ...source, id: newId, timestamp: newTimestamp, title: newTitle };
        setParallelTeamHistory(prev => [copy, ...prev]);
        await saveHistoryEntry("parallel", copy);
      }
      logDebug("info", `Copied "${baseTitle}"`, `new entry: ${newTitle}`);
    } catch (error: any) {
      console.error("Error copying history entry:", error);
      logDebug("error", "Failed to copy Chat History entry", error?.message || error);
    }
  }, [user, collaborativeHistory, comparisonHistory, parallelTeamHistory, productSpecHistory, saveHistoryEntry, logDebug]);

  // Gives a Chat History entry a custom title, shown instead of the auto-generated prompt
  // summary. Merges onto the existing document rather than resaving the whole run.
  const renameHistoryEntry = useCallback(async (id: string, title: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "history", id), { title: title.trim() || null }, { merge: true });
      logDebug("info", `Renamed Chat History entry to "${title.trim()}"`);
    } catch (error: any) {
      console.error("Error renaming history entry:", error);
      logDebug("error", "Failed to rename Chat History entry", error?.message || error);
    }
  }, [user, logDebug]);

  // Saves the current Team Agents roster under My Teams so it can be reused later.
  const saveCurrentTeamAs = async (name: string) => {
    if (!user || !name.trim()) return;
    const newTeam: SavedTeam = {
      id: `team_${Date.now()}`,
      name: name.trim(),
      agents: customTeam,
      createdAt: new Date().toISOString()
    };
    setSavedTeams(prev => [newTeam, ...prev]);
    try {
      await setDoc(doc(db, "users", user.uid, "teams", newTeam.id), { ...cleanUndefined(newTeam), savedAt: serverTimestamp() });
      logDebug("info", `Saved team "${newTeam.name}" to My Teams`, `${newTeam.agents.length} agent(s)`);
    } catch (error: any) {
      console.error("Error saving team:", error);
      logDebug("error", `Failed to save team "${name}" to My Teams`, error?.message || error);
    }
  };

  const deleteSavedTeam = async (id: string) => {
    if (!user) return;
    setSavedTeams(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, "users", user.uid, "teams", id));
    } catch (error: any) {
      console.error("Error deleting saved team:", error);
      logDebug("error", "Failed to delete saved team", error?.message || error);
    }
  };

  const saveCurrentKnowledgeSetAs = async (name: string) => {
    if (!user || !name.trim() || knowledgeFiles.length === 0) return;
    const newSet: SavedKnowledgeSet = {
      id: `kbset_${Date.now()}`,
      name: name.trim(),
      files: knowledgeFiles,
      createdAt: new Date().toISOString()
    };
    setSavedKnowledgeSets(prev => [newSet, ...prev]);
    try {
      await setDoc(doc(db, "users", user.uid, "knowledgeSets", newSet.id), { ...cleanUndefined(newSet), savedAt: serverTimestamp() });
      logDebug("info", `Saved Knowledge Base setup "${newSet.name}" to My Files`, `${newSet.files.length} source(s)`);
    } catch (error: any) {
      console.error("Error saving knowledge set:", error);
      logDebug("error", `Failed to save Knowledge Base setup "${name}" to My Files`, error?.message || error);
    }
  };

  const deleteSavedKnowledgeSet = async (id: string) => {
    if (!user) return;
    setSavedKnowledgeSets(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, "users", user.uid, "knowledgeSets", id));
    } catch (error: any) {
      console.error("Error deleting saved knowledge set:", error);
      logDebug("error", "Failed to delete saved knowledge set", error?.message || error);
    }
  };

  // Deliberately MERGES by default (unlike useSavedTeam, which replaces the roster
  // outright) — knowledgeFiles is a single shared, permanent library, not per-conversation
  // state, and replacing it would locally hide whatever was already loaded even though
  // nothing was actually deleted from Firestore. Files already present (matched by name +
  // size) are skipped rather than duplicated. A "replace" mode is available for callers
  // where the loaded set represents a complete, self-contained context on its own (Presets
  // — see applyPreset) or where the user has explicitly confirmed they want a clean swap.
  const useSavedKnowledgeSet = (set: SavedKnowledgeSet, mode: "merge" | "replace" = "merge") => {
    if (mode === "replace" && knowledgeFiles.length > 0) {
      knowledgeFiles.forEach(f => moveSourceToTrash(f));
      setKnowledgeFiles([]);
    }
    const currentFiles = mode === "replace" ? [] : knowledgeFiles;
    const existingKeys = new Set(currentFiles.map(f => `${f.name}::${f.size}`));
    const toAdd = set.files.filter(f => !existingKeys.has(`${f.name}::${f.size}`));
    if (toAdd.length === 0) {
      logDebug("info", `"${set.name}" is already fully loaded`, "No new sources to add");
      return;
    }
    const withFreshIds = toAdd.map(f => ({ ...f, id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` }));
    setKnowledgeFiles(prev => [...(mode === "replace" ? [] : prev), ...withFreshIds]);
    withFreshIds.forEach(f => saveKnowledgeSource(f));
    logDebug("info", `Loaded Knowledge Base setup "${set.name}"`, `${withFreshIds.length} source(s) ${mode === "replace" ? "loaded" : "added"}${mode === "merge" && toAdd.length < set.files.length ? `, ${set.files.length - toAdd.length} already present` : ""}`);
  };

  // Standalone loader confirmation: previously loading a saved set while other files were
  // already present silently merged them with no warning — the user had to notice the
  // mixing after the fact. Now, if anything is already loaded, this holds the pending set
  // and shows a merge/replace choice before either happens.
  const [pendingKnowledgeSetLoad, setPendingKnowledgeSetLoad] = useState<SavedKnowledgeSet | null>(null);
  const requestLoadKnowledgeSet = (set: SavedKnowledgeSet) => {
    if (knowledgeFiles.length > 0) {
      setPendingKnowledgeSetLoad(set);
    } else {
      useSavedKnowledgeSet(set, "merge");
    }
  };

  const saveCurrentPresetAs = async (name: string) => {
    if (!user || !name.trim() || customTeam.length === 0) return;
    const newPreset: SavedPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim(),
      agents: customTeam,
      files: knowledgeFiles,
      createdAt: new Date().toISOString()
    };
    setSavedPresets(prev => [newPreset, ...prev]);
    try {
      await setDoc(doc(db, "users", user.uid, "presets", newPreset.id), { ...cleanUndefined(newPreset), savedAt: serverTimestamp() });
      logDebug("info", `Saved preset "${newPreset.name}"`, `${newPreset.agents.length} agent(s), ${newPreset.files.length} source(s)`);
    } catch (error: any) {
      console.error("Error saving preset:", error);
      logDebug("error", `Failed to save preset "${name}"`, error?.message || error);
    }
    // A preset bundles a team + a Knowledge Base setup, but previously existed ONLY as its
    // own combined record — saving one for a project never fed My Teams or My Files, so
    // neither half was independently reusable outside that specific preset. Cascading into
    // both saveCurrentTeamAs/saveCurrentKnowledgeSetAs (same name, so the three stay
    // recognizably linked) keeps all three libraries in sync from a single save action.
    // saveCurrentKnowledgeSetAs already no-ops when there are no files, so this is safe
    // even for a preset with an empty Knowledge Base.
    await saveCurrentTeamAs(name);
    await saveCurrentKnowledgeSetAs(name);
  };

  const deleteSavedPreset = async (id: string) => {
    if (!user) return;
    setSavedPresets(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, "users", user.uid, "presets", id));
    } catch (error: any) {
      console.error("Error deleting saved preset:", error);
      logDebug("error", "Failed to delete saved preset", error?.message || error);
    }
  };

  // Applies both halves of a preset in one action — the team REPLACES the roster (matching
  // useSavedTeam's semantics), and the files now ALSO replace the Knowledge Base by default
  // (changed from merge): a preset represents a complete, self-contained client/project
  // context, and merging it into whatever happened to already be loaded was mixing
  // different clients' documents together — the exact isolation failure multi-client users
  // hit independently of each other.
  const applyPreset = (preset: SavedPreset) => {
    useSavedTeam({ id: preset.id, name: preset.name, agents: preset.agents, createdAt: preset.createdAt });
    useSavedKnowledgeSet({ id: preset.id, name: preset.name, files: preset.files, createdAt: preset.createdAt }, "replace");
    logDebug("info", `Applied preset "${preset.name}"`, `${preset.agents.length} agent(s) loaded, Knowledge Base replaced with ${preset.files.length} source(s)`);
  };

  // Loads a saved team as the active Team Agents roster and starts a fresh conversation.
  const drawerComposerRef = useRef<HTMLInputElement>(null);
  // Manager-facing calculator (Phase 3 roadmap item #3): a real mathjs evaluation, injected
  // into the transcript as a distinctly badged "verified calculation" rather than trusting
  // an agent's own arithmetic — see src/lib/calculations.ts for why this exists.
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const calculatorResult = useMemo(() => (calculatorExpression.trim() ? runCalculation(calculatorExpression) : null), [calculatorExpression]);
  const insertCalculationIntoChat = () => {
    if (!calculatorResult?.ok) return;
    setFollowUpMessages(prev => [...prev, {
      id: newMessageId(),
      role: "user",
      text: `${calculatorExpression.trim()} = ${calculatorResult.formatted}`,
      isVerifiedCalculation: true
    }]);
    setCalculatorExpression("");
    setIsCalculatorOpen(false);
  };
  const drawerScrollRef = useRef<HTMLDivElement>(null);
  // Team Chat should behave like a chat app: always land at the bottom (the most recent
  // message), both when it's opened and as new messages arrive — previously it opened
  // wherever the scroll position happened to be left, which for a long thread meant
  // opening into the middle of old history rather than the live conversation.
  useEffect(() => {
    if (!isChatDrawerOpen) return;
    const el = drawerScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isChatDrawerOpen, followUpMessages.length]);

  /** Confirmation dialog for answering a "needs_input" blocker — the team explicitly said
   *  it can't finish without this, so the answer goes to a full re-discussion (like Force/
   *  Promote/dissent-revisit), not a quick Team Chat reply. statusNote is captured when the
   *  dialog opens so it survives even if displayedRun changes underneath it. */
  const [pendingBlockingReply, setPendingBlockingReply] = useState<{ statusNote: string } | null>(null);
  // Once a discussion exists, the original prompt composer collapses behind "Start fresh
  // from original wording" — Discussion Requirements takes over as the live record above
  // Defined Outcome. Manually re-expandable, and auto-expanded whenever there's genuinely
  // active input work happening (loading, clarifying questions, an outline awaiting
  // sign-off) so none of that silently hides behind the collapsed bar.
  const [isOriginalComposerExpanded, setIsOriginalComposerExpanded] = useState(false);
  const [blockingReplyDraft, setBlockingReplyDraft] = useState("");

  const jumpToPanelSection = (section: "knowledge-base" | "team-agents") => {
    setIsLeftPanelOpen(true);
    if (section === "knowledge-base") setIsKnowledgeBaseOpen(true);
    else setIsAgentRosterOpen(true);
    // Wait a tick for the panel to render open before scrolling to the section inside it.
    setTimeout(() => {
      document.getElementById(`panel-section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Persists the CURRENT Team Chat thread onto the run it belongs to, right before
  // switching to a different run/team/conversation. The settle-triggered autosave (below,
  // keyed on followUpLoading) covers the common case of a conversation finishing normally;
  // this covers the case of navigating away mid-conversation, which would otherwise abandon
  // whatever was said without ever being written down.
  // Regenerates ONE deliverable section in place — the whole-run re-draft was too coarse
  // when only one section was thin or needed a specific change. Uses the section's own
  // author (consistent authorship, not a different agent redrafting someone else's voice)
  // and gives it the rest of the deliverable as context so the redraft stays consistent.
  const regenerateDeliverableSection = async (sectionId: string, feedback: string) => {
    if (!collaborativeRun?.deliverable) return;
    const section = collaborativeRun.deliverable.sections.find(s => s.id === sectionId);
    if (!section) return;
    const author = customTeam.find(a => a.id === section.authorAgentId) || customTeam[0];
    setRegeneratingSectionId(sectionId);
    try {
      const otherHeadings = collaborativeRun.deliverable.sections.filter(s => s.id !== sectionId).map(s => s.heading).join(", ");
      const instruction = `You previously drafted the "${section.heading}" section of a deliverable titled "${collaborativeRun.deliverable.title}". The deliverable's other sections are: ${otherHeadings || "none"}. ${feedback.trim() ? `The manager's feedback on this section: ${feedback.trim()}` : "The manager asked you to improve this section — go deeper and be more thorough than before."} Redraft ONLY this section's content. Respond with the new prose content only — no heading, no JSON, no markdown fences.`;
      const newContent = await callAgent(author, section.content, instruction, undefined);
      const updatedSections = collaborativeRun.deliverable.sections.map(s => (s.id === sectionId ? { ...s, content: newContent.trim() } : s));
      const updatedRun: CollaborativeRun = { ...collaborativeRun, deliverable: { ...collaborativeRun.deliverable, sections: updatedSections } };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      logDebug("info", `Regenerated section "${section.heading}"`, feedback.trim() || "(no specific feedback given)");
    } catch (err: any) {
      console.error("Error regenerating section:", err);
      logDebug("error", `Failed to regenerate section "${section.heading}"`, err?.message || err);
    } finally {
      setRegeneratingSectionId(null);
      setSectionRegenDraft(null);
    }
  };

  // --- "Go Deeper" as scope expansion: session orchestration ---

  // node=null means the whole-task/root scope (subsumes the old whole-run Go Deeper — see
  // the post-outcome gate wiring, which now routes "Go deeper on this" through here too).
  const startGoDeeper = useCallback((node: DecisionNode | null) => {
    if (!collaborativeRun) return;
    const nodeId = node?.id || GO_DEEPER_ROOT_SENTINEL;
    const key = goDeeperKey(nodeId);
    // Pause & resume: if a session already exists for this node (paused mid-Q&A or awaiting
    // approval), reopen it exactly where it left off instead of silently resetting — the
    // per-node session record exists precisely so non-linear workflows don't lose progress.
    if (goDeeperSessions[key]) {
      setActiveGoDeeperSessionKey(key);
      return;
    }
    setGoDeeperSessions(prev => ({
      ...prev,
      [key]: {
        nodeId,
        nodeLabel: node?.label || "the whole task",
        nodeReason: node?.reason,
        ancestorLabels: node ? getAncestorLabels(collaborativeRun.decisionTree, node.id) : [],
        existingChildLabels: node
          ? getTreeChildren(collaborativeRun.decisionTree, node.id).map(c => c.label)
          : collaborativeRun.decisionTree.filter(n => n.parentId === null).map(n => n.label),
        parentIsSelected: node ? node.isSelected === true : true,
        teamMode: "single",
        scope: null,
        status: "choosing",
        qa: [],
        currentQuestion: null,
        proposedStructure: null,
        proposedNodes: [],
        proposedSummary: null,
        proposedParentProbabilityChange: null,
        proposedContradictionWarning: null
      }
    }));
    setActiveGoDeeperSessionKey(key);
  }, [collaborativeRun, goDeeperSessions, goDeeperKey]);

  const updateGoDeeperSession = (nodeId: string, patch: Partial<GoDeeperSessionState>) => {
    const key = goDeeperKey(nodeId);
    setGoDeeperSessions(prev => (prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
  };

  // Fetches exactly ONE next question, informed by every answer so far — a genuinely
  // different call pattern from the pre-discussion clarifying questions (which batch-
  // generate a fixed list upfront), because each question here needs to react to the last
  // answer. Falls straight into synthesis once the model signals there's nothing more to
  // ask, or after a hard cap.
  //
  // qaOverride exists because answerGoDeeperQuestion calls this in the same tick as its
  // setState — this render's closure over goDeeperSessions is stale and would build the
  // next question WITHOUT the answer just given (and check the 5-question cap against a
  // stale length). Passing the appended array explicitly sidesteps the closure entirely.
  const fetchNextGoDeeperQuestion = async (nodeId: string, qaOverride?: GoDeeperQA[]) => {
    const session = goDeeperSessions[goDeeperKey(nodeId)];
    if (!session || !session.scope) return;
    const qa = qaOverride ?? session.qa;
    updateGoDeeperSession(nodeId, { status: "loading_next", error: undefined, errorPhase: undefined });
    try {
      // The opener doesn't count against the adaptive budget — it's the manager's own
      // steer, not one of the team's follow-up questions.
      const adaptiveCount = qa.filter(x => !x.isOpener).length;
      if (adaptiveCount >= 5) {
        await synthesizeGoDeeperSession(nodeId, qa);
        return;
      }
      const checker = customTeam[0];
      const instruction = buildGoDeeperQuestionInstruction(
        { label: session.nodeLabel, reason: session.nodeReason, ancestorLabels: session.ancestorLabels },
        customPrompt,
        customTeam.map(a => ({ name: a.name, persona: a.persona })),
        qa,
        buildKnowledgeContext()
      );
      const parsed = await callAgentForJson(checker, `Decide the next question, if any, for expanding scope on "${session.nodeLabel}".`, instruction);
      const result = parseGoDeeperQuestionResponse(parsed);
      if (result.done) {
        await synthesizeGoDeeperSession(nodeId, qa);
        return;
      }
      const askerId = customTeam.find(a => a.name.toLowerCase() === (result.askedBy || "").toLowerCase())?.id || checker.id;
      updateGoDeeperSession(nodeId, {
        status: "asking",
        currentQuestion: { question: result.question!, options: result.options!, askedBy: askerId }
      });
    } catch (err: any) {
      console.error("Error fetching next Go Deeper question:", err);
      // A dedicated error status — the "asking" UI requires a currentQuestion to render, so
      // parking a failure there produced a dialog with no body and unreachable buttons.
      updateGoDeeperSession(nodeId, { status: "error", errorPhase: "question", error: "Couldn't reach the team for the next question." });
    }
  };

  // Fixed opening prompt shown before the adaptive Q&A begins — every session starts with
  // the same free-text question so the manager can steer the whole scoping conversation up
  // front, not just react to whatever the team happens to ask first. Answered here with no
  // API call; the answer (if any) becomes context for every adaptive question that follows.
  const GO_DEEPER_OPENER_QUESTION = "Is there anything specific you would like the team to consider in this area?";

  const chooseGoDeeperScope = (nodeId: string, scope: "same" | "new") => {
    updateGoDeeperSession(nodeId, {
      scope,
      status: "asking",
      currentQuestion: { question: GO_DEEPER_OPENER_QUESTION, options: [], askedBy: "__opener__", isOpener: true }
    });
  };

  const answerGoDeeperQuestion = (nodeId: string, answer: string) => {
    const session = goDeeperSessions[goDeeperKey(nodeId)];
    if (!session || !session.currentQuestion) return;
    const isOpener = session.currentQuestion.isOpener === true;
    // A blank opener means "nothing specific" — skip it entirely rather than recording an
    // empty Q&A entry that would just clutter the synthesis transcript for no reason.
    if (isOpener && !answer.trim()) {
      setGoDeeperCustomAnswer("");
      updateGoDeeperSession(nodeId, { currentQuestion: null });
      fetchNextGoDeeperQuestion(nodeId, session.qa);
      return;
    }
    const askerAgent = customTeam.find(a => a.id === session.currentQuestion!.askedBy);
    const newQa: GoDeeperQA = {
      question: session.currentQuestion.question,
      askedBy: isOpener ? "the team" : (askerAgent?.name || "Team"),
      answer,
      isOpener,
      options: session.currentQuestion.options.length > 0 ? session.currentQuestion.options : undefined
    };
    const appendedQa = [...session.qa, newQa];
    setGoDeeperCustomAnswer("");
    updateGoDeeperSession(nodeId, { qa: appendedQa, currentQuestion: null });
    // The appended array is passed explicitly — the previous setTimeout(0) "let state land"
    // approach still invoked THIS render's closure, which read the pre-update session and
    // built every next question without the answer just given.
    fetchNextGoDeeperQuestion(nodeId, appendedQa);
  };

  // Synthesizes the finished Q&A directly into a small mini-tree — deliberately ONE call,
  // not a full multi-agent re-discussion, since the manager's answers already ARE the
  // scoping input at this point. Grafted-node selection is the synthesis's recommendation
  // AND-gated with the parent's own selection state, so expanding a rejected branch can
  // never paint a live-looking chosen chain under it.
  const synthesizeGoDeeperSession = async (nodeId: string, qaOverride?: GoDeeperQA[]) => {
    const session = goDeeperSessions[goDeeperKey(nodeId)];
    if (!session) return;
    const qa = qaOverride ?? session.qa;
    const runFullTeam = session.teamMode === "team" && customTeam.length > 0;
    updateGoDeeperSession(nodeId, { status: "synthesizing", error: undefined, errorPhase: undefined });
    try {
      const synthesizer = customTeam[0];

      // Team mode: the whole team debates this branch first — same position + validation
      // round shape as Add Outcome's Full mode / New Tab — grounded in the manager's Q&A
      // answers, before the single synthesizer turns it into nodes. "Considers more" in
      // practice means the synthesis instruction below gets a real multi-perspective
      // transcript to draw on instead of just the raw Q&A, and is explicitly nudged to
      // propose a richer set of nodes when that transcript is present.
      let debateBlock = "";
      if (runFullTeam) {
        const resourceScope = getResourceScopeInstruction();
        const depthInstruction = getDepthInstruction();
        const knowledgeContext = buildKnowledgeContext();
        const rebuttalRounds = discussionDepth === "extended" ? 4 : discussionDepth === "deep" ? 2 : 1;
        const isDeep = discussionDepth !== "fast";
        const qaText = qa.map(x => `Q (${x.askedBy}): ${x.question}\nA: ${x.answer}`).join("\n\n");
        const chainText = [...session.ancestorLabels, session.nodeLabel].join(" → ");
        let debateTranscript: CollaborativeTranscriptEntry[] = [];
        const positionEntries = await settleRound(
          mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
            const systemInstruction = `You are an AI agent named "${agent.name}" expanding scope on one specific branch of an ongoing project's decision tree. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nGive your honest take in ${isDeep ? "5-8 sentences" : "2-4 sentences"} on what this branch should explore further, grounded in the manager's own answers below — be specific about what new sub-decisions or findings you'd propose.`;
            const fullPrompt = `${knowledgeContext}\n\nORIGINAL TASK:\n${customPrompt}\n\nDECISION CHAIN (root → the branch being expanded): ${chainText}\n\nMANAGER'S SCOPING ANSWERS:\n${qaText || "(none — the manager left the opening question blank)"}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction);
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: "Opening positions" };
          }),
          customTeam,
          "Go Deeper's position round",
        );
        debateTranscript = [...debateTranscript, ...positionEntries];
        logDebug("info", "Go Deeper (whole team): position round complete", `${positionEntries.length} statement(s) collected`);
        for (let round = 1; round <= rebuttalRounds; round++) {
          const soFar = debateTranscript.map(t => `${t.agentName}: ${t.message}`).join("\n\n");
          const rebuttals = await settleRound(
            mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
              const systemInstruction = `You are an AI agent named "${agent.name}" in round ${round + 1} of expanding scope on "${session.nodeLabel}". Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nRead the discussion so far and respond — push back where you disagree, concede where a point changed your mind, add anything genuinely new. Keep it to ${isDeep ? "3-6 sentences" : "2-3 sentences"}.`;
              const fullPrompt = `${knowledgeContext}\n\nBRANCH BEING EXPANDED: ${chainText}\n\nDISCUSSION SO FAR:\n${soFar}`;
              const message = await callAgent(agent, fullPrompt, systemInstruction);
              return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: `Validation round ${round}` };
            }),
            customTeam,
            `Go Deeper's validation round ${round}`,
          );
          debateTranscript = [...debateTranscript, ...rebuttals];
          logDebug("info", `Go Deeper (whole team): validation round ${round} of ${rebuttalRounds} complete`);
        }
        debateBlock = `\n\nTHE WHOLE TEAM'S DEBATE ON THIS BRANCH (already happened — ground your proposed nodes in what was actually argued here, not just the Q&A alone; with this much input, err toward proposing MORE nodes and richer sub-detail than you would from the Q&A in isolation):\n${debateTranscript.map(t => `${t.agentName} (${t.roundLabel}): ${t.message}`).join("\n\n")}`;
      }

      const instruction = buildGoDeeperSynthesisInstruction(
        { label: session.nodeLabel, reason: session.nodeReason, ancestorLabels: session.ancestorLabels, existingChildLabels: session.existingChildLabels },
        customPrompt,
        qa,
        buildKnowledgeContext()
      ) + debateBlock;
      const parsed = await callAgentForJson(synthesizer, `Synthesize the scoping conversation about "${session.nodeLabel}" into new sub-decision nodes.`, instruction);
      const result = parseGoDeeperSynthesisResponse(parsed);
      updateGoDeeperSession(nodeId, {
        status: "pending_approval",
        qa,
        proposedStructure: result.structure,
        proposedNodes: result.nodes.map(n => ({
          id: n.id,
          // A validated parentRef nests this node under another node THIS SAME session
          // proposed (e.g. a tier's benefits under that tier); otherwise it attaches
          // directly under the branch being expanded, exactly as before parentRef existed.
          parentId: n.parentRef ?? (nodeId === GO_DEEPER_ROOT_SENTINEL ? null : nodeId),
          label: n.label,
          reason: n.reason,
          probability: n.probability,
          isSelected: n.isSelected && session.parentIsSelected,
          scopingQA: qa.length > 0 ? qa : undefined,
          // Per-node now, not "every node in a content-mode session" — a session can mix
          // KB-grounded and general-knowledge findings, and each should be labeled for what
          // it actually is rather than one caveat applied uniformly across the batch.
          isGeneralKnowledgeContent: (result.structure === "content" && !n.fromKnowledgeBase) || undefined,
          isFromKnowledgeBase: (result.structure === "content" && n.fromKnowledgeBase) || undefined
        })),
        proposedSummary: result.summary,
        proposedParentProbabilityChange: result.parentProbabilityChange,
        proposedContradictionWarning: result.contradictionWarning
      });
    } catch (err: any) {
      console.error("Error synthesizing Go Deeper session:", err);
      updateGoDeeperSession(nodeId, { status: "error", errorPhase: "synthesis", qa, error: "Couldn't synthesize the session into new nodes." });
    }
  };

  // Commits an approved session. "same" grafts the proposed nodes directly into the live
  // tree (no new run at all); "new" spawns a genuinely separate conversation, seeded with
  // the original task plus this session's context, reusing the SAME bidirectional-
  // provenance mechanism revisit/Discuss-Batch already use (managerFeedback triggers
  // recordRevisitOnSourceRun automatically).
  const approveGoDeeperSession = (nodeId: string, nodesToCommit: DecisionNode[], applyParentProbabilityChange: boolean) => {
    const session = goDeeperSessions[goDeeperKey(nodeId)];
    if (!session || !collaborativeRun) return;
    if (session.scope === "same") {
      // The written summary (content mode only) is attached to just the first committed
      // node rather than duplicated on every one — the "View scoping conversation" dialog
      // shows it once, above the findings it ties together.
      const nodesWithSummary = session.proposedSummary && nodesToCommit.length > 0
        ? nodesToCommit.map((n, i) => (i === 0 ? { ...n, scopingSummary: session.proposedSummary! } : n))
        : nodesToCommit;
      let updatedTree = [...collaborativeRun.decisionTree, ...nodesWithSummary];
      if (nodeId !== GO_DEEPER_ROOT_SENTINEL) {
        updatedTree = updatedTree.map(n => {
          if (n.id !== nodeId) return n;
          const withProbability = applyParentProbabilityChange && session.proposedParentProbabilityChange
            ? { ...n, probability: session.proposedParentProbabilityChange.newProbability }
            : n;
          return session.proposedContradictionWarning
            ? { ...withProbability, contradictionWarning: session.proposedContradictionWarning }
            : withProbability;
        });
      }
      // "Defined Outcome" and "Why The Panel Arrived Here" otherwise go silently stale the
      // moment a graft adds real content underneath them — the top-level summary would
      // still read as if nothing below it had changed. A content-mode graft actually
      // answered a question, so that answer belongs in the outcome itself, not just buried
      // in the tree; the other two structures get a brief provenance note instead, since
      // there's no "answer" to surface, just added structure.
      const outcomeAddendum = nodesToCommit.length > 0
        ? (session.proposedStructure === "content" && session.proposedSummary
            ? ` Regarding "${session.nodeLabel}": ${session.proposedSummary}`
            : ` Scope was also expanded under "${session.nodeLabel}" — see the decision tree for detail.`)
        : "";
      const reasonsAddendum = nodesToCommit.length > 0
        ? [`Expanded scope on "${session.nodeLabel}" following manager Q&A${session.proposedStructure === "content" ? " — see findings below" : ""}.`]
        : [];
      // Every Expand Scope graft becomes its own "addition" entry — per your answer, ALL of
      // them, however deep the node, since each one genuinely shaped what the tree now says.
      // The manager's own opener answer is used as the text when present (it's the actual
      // request); falls back to a compact Q&A summary for sessions where it was skipped.
      const requirementText = session.qa.find(qa => qa.isOpener && qa.answer.trim())?.answer
        || session.qa.map(qa => `${qa.question} → ${qa.answer}`).join("; ")
        || `Expanded scope on "${session.nodeLabel}"`;
      const requirementsAddendum = nodesToCommit.length > 0
        ? [{ id: `req_${Date.now()}`, group: "addition" as const, sourceType: "expand_scope" as const, label: `Expand Scope: "${session.nodeLabel}"`, text: requirementText, timestamp: new Date().toISOString() }]
        : [];
      const updatedRun: CollaborativeRun = {
        ...collaborativeRun,
        decisionTree: updatedTree,
        outcome: collaborativeRun.outcome + outcomeAddendum,
        reasons: [...collaborativeRun.reasons, ...reasonsAddendum],
        requirementsLog: [...(collaborativeRun.requirementsLog || []), ...requirementsAddendum],
        history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, `Went deeper on "${session.nodeLabel}"`)]
      };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      logDebug("info", `Grafted ${nodesToCommit.length} new node(s) under "${session.nodeLabel}"`, session.proposedContradictionWarning || "");
      // Simple detail mode caps rendering at SIMPLE_TREE_MAX_LEVELS — a graft below the cap
      // would land invisibly behind the "+N levels" indicator, looking like data loss the
      // moment it was approved. Auto-switch to expanded so the user sees what they added.
      const graftedDepth = nodeId === GO_DEEPER_ROOT_SENTINEL ? 1 : session.ancestorLabels.length + 2;
      if (nodesToCommit.length > 0 && graftedDepth > SIMPLE_TREE_MAX_LEVELS && treeDetailView === "simple") {
        setTreeDetailView("expanded");
        logDebug("info", "Switched the tree to expanded detail so the newly grafted nodes are visible");
      }
    } else {
      // New conversation: seeded with the original task, the decision chain, and the
      // scoping Q&A, so the spun-off team session isn't an orphaned fragment with no idea
      // what project it's actually part of. The seed is passed directly as a prompt
      // override — the previous setCustomPrompt + setTimeout approach both clobbered the
      // composer with machine-generated text AND didn't actually work (the scheduled call
      // was this render's closure, so the run still read the OLD prompt).
      const chainText = [...session.ancestorLabels, session.nodeLabel].join(" → ");
      const qaText = session.qa.map(qa => `- ${qa.question} → ${qa.answer}`).join("\n");
      const seedPrompt = `Following on from a related project ("${customPrompt}"), the team previously reasoned through: ${chainText}. The manager now wants to expand scope specifically into "${session.nodeLabel}" with this additional detail:\n${qaText}\n\nScope and address this area as its own task.`;
      // This spawned run becomes the new active tree (bidirectional provenance keeps the
      // OLD run linked in history, but doesn't keep it displayed) — so it's a "new
      // conversation" in every sense that matters here, and needs the same stale-state
      // clearing resetConversationState does: without it, this run inherits the previous
      // conversation's leftover clarification answers (silently prepended to every prompt
      // via clarificationContextRef) and any paused Expand-scope sessions whose node ids
      // collide with this new tree's.
      clarificationContextRef.current = "";
      clarificationEntriesRef.current = [];
      runCollaborativeSession(null, null, null, `The manager asked the team to go deeper on "${session.nodeLabel}", starting a new, related conversation seeded with the following scoping answers:\n${qaText}`, seedPrompt);
      logDebug("info", `Starting a new conversation seeded from "${session.nodeLabel}"`);
    }
    setGoDeeperSessions(prev => { const next = { ...prev }; delete next[goDeeperKey(nodeId)]; return next; });
    setActiveGoDeeperSessionKey(null);
  };

  const discardGoDeeperSession = (nodeId: string) => {
    setGoDeeperSessions(prev => { const next = { ...prev }; delete next[goDeeperKey(nodeId)]; return next; });
    setActiveGoDeeperSessionKey(null);
    setGoDeeperCustomAnswer("");
  };

  // Pause & resume: closing the dialog keeps the session alive so re-opening from the same
  // node's menu continues exactly where it left off. Only zero-progress sessions (still on
  // the scope-choice screen) are discarded on close — nothing to resume, and keeping them
  // would leave zombie "in progress" indicators on nodes the user merely peeked at.
  const pauseGoDeeperSession = (nodeId: string) => {
    const session = goDeeperSessions[goDeeperKey(nodeId)];
    if (session && session.status === "choosing") {
      discardGoDeeperSession(nodeId);
      return;
    }
    setActiveGoDeeperSessionKey(null);
    setGoDeeperCustomAnswer("");
  };

  // explicitMessages lets a caller flush the array it JUST computed (e.g. right after
  // appending a message via setFollowUpMessages, before React has committed that state
  // update) instead of reading the still-stale followUpMessages closure — needed by the
  // checkpoint-on-start calls added to sendFollowUp/askTeamToReconsiderConsiderations/
  // checkAgainstNewKnowledgeSources below, so the fact that an exchange was even attempted
  // survives a crash mid-call, not just a successfully completed one.
  const flushChatToRun = (explicitMessages?: FollowUpMessage[]) => {
    const messages = explicitMessages ?? followUpMessages;
    if (!collaborativeRun || messages.length === 0) return;
    const updatedRun: CollaborativeRun = { ...collaborativeRun, chatMessages: messages };
    setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
    saveHistoryEntry("collaborative", updatedRun);
  };

  // Publishes a read-only snapshot for sharing — see the SharedRunSnapshot type comment
  // for why this is deliberately a snapshot, not live, and deliberately read-only.
  const SHARE_EXPIRY_OPTIONS = [
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
    { label: "Never", days: null as number | null }
  ];

  const shareRun = async (run: CollaborativeRun, expiryDays: number | null) => {
    if (!user) return;
    setIsSharingRun(true);
    try {
      const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      // Grounding status carried across the sharing boundary — computed at share time from
      // exactly the same signals the live verification-status line uses, so a recipient can
      // see whether this decision was ever checked against real source material.
      const groundedSourceCount = run.groundedSourceCount ?? contentBearingKnowledgeFiles.length;
      const hadVerifiedCalculations = (run.chatMessages || []).some(m => m.isVerifiedCalculation);
      const snapshot: SharedRunSnapshot = {
        token,
        prompt: run.prompt,
        outcome: run.outcome,
        reasons: run.reasons,
        decisionTree: run.decisionTree,
        facilitatorAgentName: run.facilitatorAgentName,
        dissent: run.dissent,
        considerations: run.considerations,
        rounds: run.rounds,
        sharedAt: new Date().toISOString(),
        groundedSourceCount,
        hadVerifiedCalculations,
        ownerUid: user.uid,
        expiresAt: expiryDays !== null ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined
      };
      await setDoc(doc(db, "sharedRuns", token), cleanUndefined(snapshot));
      const updatedRun: CollaborativeRun = { ...run, sharedTokens: [...(run.sharedTokens || []), token] };
      setCollaborativeRun(prev => (prev?.id === run.id ? updatedRun : prev));
      setCollaborativeHistory(prev => prev.map(r => (r.id === run.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      const url = `${window.location.origin}${window.location.pathname}?shared=${token}`;
      logDebug("info", "Published a read-only share link", `${url} · expires: ${expiryDays !== null ? `${expiryDays} days` : "never"}`);
      return url;
    } catch (error: any) {
      console.error("Error sharing run:", error);
      logDebug("error", "Failed to create share link", error?.message || error);
      return null;
    } finally {
      setIsSharingRun(false);
    }
  };

  const revokeShareLink = async (token: string) => {
    try {
      await setDoc(doc(db, "sharedRuns", token), { revoked: true }, { merge: true });
      logDebug("info", "Revoked share link", token);
      setShareDialogRun(prev => (prev ? { ...prev } : prev)); // trigger a re-render of the list
    } catch (error: any) {
      console.error("Error revoking share link:", error);
      logDebug("error", "Failed to revoke share link", error?.message || error);
    }
  };

  // Fires once per completed Team Chat exchange (the moment followUpLoading transitions
  // true -> false), persisting the conversation onto its run. Deliberately keyed ONLY on
  // followUpLoading, not on followUpMessages/collaborativeRun themselves — including those
  // would also fire on every streaming delta while a message is still being typed out,
  // which would hammer Firestore with a write per token instead of one write per finished
  // exchange. By the time this effect runs, both the loading flag and the message array
  // reflect the same completed exchange (they're set together, synchronously, in the same
  // function before either commits).
  useEffect(() => {
    flushChatToRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followUpLoading]);

  const useSavedTeam = (team: SavedTeam) => {
    flushChatToRun();
    // Same reasoning as resetConversationState/openHistoryEntry: cancel in-flight work and
    // clear transient result state before swapping the roster, or a stale request can finish
    // afterward and overwrite the newly-loaded team's context.
    runAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setMainGeneratedFiles([]);
    setMainFileGenerating(null);
    setFollowUpFileGenerating(null);
    resetPostOutcomeState();
    setPendingOutline(null);
    setDraftingOutlineSections(null);
    setDraftingSectionStatus({});
    setIsChatDrawerOpen(false);
    setChatDrawerPinnedNode(null);
    setChatTargetMode(customTeam[0]?.id || "team");
    setAddCommentTarget(null);
    setPendingMidQuestion(null);
    setConsiderationDraftResponses({});
    setIsConsiderationsOpen(false);

    const clonedAgents = team.agents.map(a => ({ ...a }));
    setCustomTeam(clonedAgents);
    saveCustomTeamAndFiles(clonedAgents, knowledgeFiles);
    // Deliberately NOT clearing customPrompt/taskConstraints/taskSuccessCriteria here —
    // loading a team is a roster swap mid-task, not starting a new conversation. Wiping the
    // user's typed prompt because they picked a different saved team was the reported bug.
    setCustomResults({});
    setCollaborativeRun(null);
    setCollaborativeError(null);
    setFollowUpMessages([]);
    setActiveTab("custom");
    setIsAgentRosterOpen(true);
    logDebug("info", `Loaded team "${team.name}" from My Teams`, `${clonedAgents.length} agent(s)`);
  };

  const handleExternalResourcesToggle = (val: boolean) => {
    setUseExternalResources(val);
    saveCustomTeamAndFiles(customTeam, knowledgeFiles, val);
  };

  const getAvailableProviders = useCallback(() => {
    const options = [];
    if (keys.gemini) options.push({ id: "gemini", name: "Gemini" });
    if (keys.anthropic) options.push({ id: "anthropic", name: "Claude" });
    if (keys.openai) options.push({ id: "openai", name: "OpenAI" });
    if (keys.perplexity) options.push({ id: "perplexity", name: "Perplexity" });
    if (keys.grok) options.push({ id: "grok", name: "Grok" });
    return options;
  }, [keys]);

  const addCustomAgent = () => {
    const isProd = activeTab === "product";
    const currentList = isProd ? productTeam : customTeam;
    const available = getAvailableProviders();
    const defaultProvider = (available[0]?.id as any) || "gemini";
    const newAgent: CustomAgent = {
      id: `agent_${Date.now()}`,
      provider: defaultProvider,
      model: MODEL_OPTIONS[defaultProvider]?.[0]?.id || "",
      name: isProd ? `Product Specialist ${currentList.length + 1}` : `Agent ${currentList.length + 1}`,
      persona: isProd 
        ? "You are a product specialist responsible for architecture, technical invariants, and specification precision."
        : "You are a helpful AI assistant."
    };
    const updated = [...currentList, newAgent];
    if (isProd) {
      setProductTeam(updated);
      saveProductTeamToCloud(updated);
    } else {
      setCustomTeam(updated);
      saveCustomTeamAndFiles(updated, knowledgeFiles);
    }
    setExpandedAgents(prev => ({ ...prev, [newAgent.id]: true })); // open the editor for the new agent
  };

  const updateAgentField = (id: string, field: keyof CustomAgent, value: string | number) => {
    const isProd = activeTab === "product";
    if (isProd) {
      setProductTeam(prev => {
        const updated = prev.map(agent => {
          if (agent.id === id) {
            const nextAgent = { ...agent, [field]: value };
            if (field === "provider") {
              const prov = value as CustomAgent["provider"];
              nextAgent.model = MODEL_OPTIONS[prov]?.[0]?.id || "";
            }
            return nextAgent;
          }
          return agent;
        });
        saveProductTeamToCloud(updated);
        return updated;
      });
    } else {
      setCustomTeam(prev => {
        const updated = prev.map(agent => {
          if (agent.id === id) {
            const nextAgent = { ...agent, [field]: value };
            if (field === "provider") {
              const prov = value as CustomAgent["provider"];
              nextAgent.model = MODEL_OPTIONS[prov]?.[0]?.id || "";
            }
            return nextAgent;
          }
          return agent;
        });
        saveCustomTeamAndFiles(updated, knowledgeFiles);
        return updated;
      });
    }
  };

  // Clears a per-agent temperature override, reverting to the provider's own default.
  const resetAgentTemperature = (id: string) => {
    const isProd = activeTab === "product";
    if (isProd) {
      setProductTeam(prev => {
        const updated = prev.map(agent => {
          if (agent.id !== id) return agent;
          const { temperature, ...rest } = agent;
          return rest as CustomAgent;
        });
        saveProductTeamToCloud(updated);
        return updated;
      });
    } else {
      setCustomTeam(prev => {
        const updated = prev.map(agent => {
          if (agent.id !== id) return agent;
          const { temperature, ...rest } = agent;
          return rest as CustomAgent;
        });
        saveCustomTeamAndFiles(updated, knowledgeFiles);
        return updated;
      });
    }
  };

  const deleteCustomAgent = (id: string) => {
    const isProd = activeTab === "product";
    const currentList = isProd ? productTeam : customTeam;
    // Removing the team's only remaining agent doesn't leave an empty roster
    if (currentList.length <= 1) {
      const fallbackProvider = (getAvailableProviders()[0]?.id as CustomAgent["provider"]) || currentList[0]?.provider || "gemini";
      const updated = [createDefaultAgent(fallbackProvider)];
      if (isProd) {
        setProductTeam(updated);
        saveProductTeamToCloud(updated);
      } else {
        setCustomTeam(updated);
        saveCustomTeamAndFiles(updated, knowledgeFiles);
      }
      return;
    }
    const updated = currentList.filter(agent => agent.id !== id);
    if (isProd) {
      setProductTeam(updated);
      saveProductTeamToCloud(updated);
    } else {
      setCustomTeam(updated);
      saveCustomTeamAndFiles(updated, knowledgeFiles);
    }
  };

  // Marks an agent as lead: moves it to the top of the roster in one step (the same end
  // result as repeatedly using "move up" until it reaches position 0). Position 0 is what
  // determines "lead" throughout the UI — there's no separate flag to keep in sync.
  const promoteAgentToLead = (index: number) => {
    if (index <= 0) return;
    const isProd = activeTab === "product";
    const currentList = isProd ? productTeam : customTeam;
    const updated = [...currentList];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);
    if (isProd) {
      setProductTeam(updated);
      saveProductTeamToCloud(updated);
    } else {
      setCustomTeam(updated);
      saveCustomTeamAndFiles(updated, knowledgeFiles);
    }
  };

  const resetToDefaultProductTeam = () => {
    setProductTeam(DEFAULT_PRODUCT_AGENTS);
    saveProductTeamToCloud(DEFAULT_PRODUCT_AGENTS);
    logDebug("info", "Product Team reset to default specialists");
  };

  // Firestore documents are capped at ~1MB; base64-encoded images inflate by ~33%, so cap
  // the original file size to leave headroom for the rest of the document's fields.
  const MAX_IMAGE_BYTES = 650 * 1024;
  // Zip contents are extracted to a plain-text digest (see codebaseIngest.ts) rather than
  // stored as base64, so the same Firestore-document-size concern doesn't apply the same
  // way — this cap is really about not asking the browser to unzip and scan something huge
  // for what is, after filtering, going to become a ~150k-character text digest regardless.
  const MAX_ZIP_BYTES = 60 * 1024 * 1024; // 60MB

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    const fileArray = Array.from(filesList);

    fileArray.forEach((file: any) => {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const isImage = file.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      const isZip = file.type === "application/zip" || file.type === "application/x-zip-compressed" || /\.zip$/i.test(file.name);

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name }]);
      let settled = false;
      const timeoutHandle = setTimeout(() => {
        if (settled) return;
        settled = true;
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
        logDebug("error", `Upload timed out: "${file.name}"`, `No response after ${UPLOAD_TIMEOUT_MS / 1000}s — the file may be too large or corrupted`);
        setStatus(`"${file.name}" timed out while uploading.`);
      }, UPLOAD_TIMEOUT_MS);
      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutHandle);
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
      };

      const addFile = (content: string, sourceType: KnowledgeSourceType = "file") => {
        const newFile: KnowledgeFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          content,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          sourceType,
          targetTab: activeTab === "product" ? "product" : "custom"
        };
        setKnowledgeFiles(prev => [...prev, newFile]);
        saveKnowledgeSource(newFile);
      };

      if (isImage) {
        if (file.size > MAX_IMAGE_BYTES) {
          logDebug("warn", `Image "${file.name}" was too large to upload`, `${formatBytes(file.size)} exceeds the ${formatBytes(MAX_IMAGE_BYTES)} limit`);
          setStatus(`"${file.name}" is too large (max ${formatBytes(MAX_IMAGE_BYTES)} per image).`);
          settle();
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          logDebug("info", `Uploaded image "${file.name}"`, formatBytes(file.size));
          addFile(dataUrl || "", "image");
          settle();
        };
        reader.onerror = () => { logDebug("error", `Failed to read image "${file.name}"`); settle(); };
        reader.readAsDataURL(file as any);
      } else if (isPdf) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const { extractPdfText } = await import("@/src/lib/pdf");
            const text = await extractPdfText(arrayBuffer);
            logDebug("info", `Extracted text from PDF "${file.name}"`, `${text.length} characters extracted`);
            addFile(text || "(No extractable text found in this PDF.)");
          } catch (err: any) {
            console.error("Failed to extract PDF text:", err);
            logDebug("error", `Failed to extract text from PDF "${file.name}"`, err?.message || err);
            addFile("(Failed to extract text from this PDF.)");
          } finally {
            settle();
          }
        };
        reader.onerror = () => { logDebug("error", `Failed to read PDF "${file.name}"`); settle(); };
        reader.readAsArrayBuffer(file as any);
      } else if (isZip) {
        if (file.size > MAX_ZIP_BYTES) {
          logDebug("warn", `Zip "${file.name}" was too large to process`, `${formatBytes(file.size)} exceeds the ${formatBytes(MAX_ZIP_BYTES)} limit`);
          setStatus(`"${file.name}" is too large (max ${formatBytes(MAX_ZIP_BYTES)} per zip).`);
          settle();
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const JSZip = (await import("jszip")).default;
            const zip = await JSZip.loadAsync(arrayBuffer);

            const allPaths: string[] = [];
            const candidateEntries: { path: string; zipEntry: any }[] = [];
            zip.forEach((relativePath: string, zipEntry: any) => {
              if (zipEntry.dir) return;
              allPaths.push(relativePath);
              if (isLikelyTextSourceFile(relativePath)) candidateEntries.push({ path: relativePath, zipEntry });
            });

            const orderedPaths = new Set(prioritizeCodebasePaths(candidateEntries.map(c => c.path)).slice(0, 60));
            const entriesToRead = candidateEntries.filter(c => orderedPaths.has(c.path));

            const files: CodebaseFileEntry[] = [];
            for (const { path, zipEntry } of entriesToRead) {
              try {
                const text = await zipEntry.async("string");
                files.push({ path, content: text });
              } catch {
                // Unreadable as text (likely a mis-classified binary) — skip rather than fail the whole upload.
              }
            }

            const digest = buildCodebaseDigest({
              sourceLabel: file.name,
              allPaths,
              files,
            });
            logDebug("info", `Extracted codebase digest from "${file.name}"`, `${allPaths.length} files in archive, ${files.length} included as text context`);
            addFile(digest, "codebase_zip");
          } catch (err: any) {
            console.error("Failed to process zip:", err);
            logDebug("error", `Failed to process zip "${file.name}"`, err?.message || err);
            addFile(`(Failed to process this zip archive: ${err?.message || err})`, "codebase_zip");
          } finally {
            settle();
          }
        };
        reader.onerror = () => { logDebug("error", `Failed to read zip "${file.name}"`); settle(); };
        reader.readAsArrayBuffer(file as any);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          addFile(content || "");
          settle();
        };
        reader.onerror = () => { logDebug("error", `Failed to read file "${file.name}"`); settle(); };
        reader.readAsText(file as any);
      }
    });
  };

  // Adds a link-based knowledge source (website, YouTube, Google Drive/Calendar, Gmail, NotebookLM).
  // For Google-gated types, real content is fetched immediately using the live access token
  // (see the fetch* functions below) and stored just like any other knowledge base document —
  // it is included in context regardless of the External Resources toggle, since it's the
  // user's own linked data, not general web grounding.
  // Google API scopes needed to read each source type. Requesting these triggers Google's
  // own consent screen, listing exactly what the app is asking permission to access.
  const GOOGLE_SCOPES: Record<GoogleGatedSourceType, string> = {
    google_drive: "https://www.googleapis.com/auth/drive.readonly",
    google_calendar: "https://www.googleapis.com/auth/calendar.readonly",
    gmail: "https://www.googleapis.com/auth/gmail.readonly",
    notebooklm: ""
  };

  const loadGoogleIdentityScript = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) return resolve();
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
      document.head.appendChild(script);
    });

  // Requests the narrow drive.file scope on demand — this app can only ever see or manage
  // files IT creates through this flow, never the rest of the user's Drive. Kept separate
  // from connectGoogleService (below) since that's for reading knowledge sources, a
  // different purpose that shouldn't silently piggyback on this write-capable consent, or
  // vice versa.
  const connectDriveForBackup = async (): Promise<string | null> => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      logDebug("warn", "Google sign-in isn't configured for this deployment", "Set VITE_GOOGLE_CLIENT_ID (from a Google Cloud OAuth Client) to enable backing up to Google Drive.");
      return null;
    }
    try {
      await loadGoogleIdentityScript();
      const google = (window as any).google;
      return await new Promise<string | null>((resolve) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (response: any) => {
            if (response?.access_token) {
              driveBackupTokenRef.current = response.access_token;
              logDebug("info", "Google Drive connected for backup");
              resolve(response.access_token);
            } else {
              logDebug("warn", "Google Drive backup sign-in was cancelled or denied");
              resolve(null);
            }
          }
        });
        tokenClient.requestAccessToken();
      });
    } catch (err: any) {
      console.error("Google sign-in failed:", err);
      logDebug("error", "Google sign-in failed for Drive backup", err?.message || err);
      return null;
    }
  };

  // Uploads a Product Spec as a .docx to the user's Drive (My Drive root) and returns a
  // link to the created file. Offered proactively — see wouldExceedHistoryStorageLimits —
  // as an explicit, one-click alternative to a spec's full fidelity only ever living in
  // Chat History's trimmed copy or the current browser tab.
  const backupProductSpecToDrive = async (spec: ProductSpec): Promise<{ success: boolean; webViewLink?: string; error?: string }> => {
    setIsBackingUpToDrive(true);
    try {
      let token = driveBackupTokenRef.current;
      if (!token) token = await connectDriveForBackup();
      if (!token) return { success: false, error: "Google sign-in was cancelled or denied." };

      const blob = await buildProductSpecDocx(spec);
      const filename = `${spec.title.replace(/[^a-z0-9]+/gi, "-") || "product-spec"}-spec.docx`;

      const metadata = { name: filename, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", blob);

      const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (!uploadRes.ok) {
        // A 401 means the token expired or was revoked — clear it so the next attempt
        // re-prompts sign-in instead of retrying with a token we know is dead.
        if (uploadRes.status === 401) driveBackupTokenRef.current = null;
        const errText = await uploadRes.text().catch(() => uploadRes.statusText);
        throw new Error(`Drive upload failed (${uploadRes.status}): ${errText}`);
      }
      const data = await uploadRes.json();
      logDebug("info", `Backed up "${spec.title}" to Google Drive`, data.webViewLink || data.id);
      return { success: true, webViewLink: data.webViewLink };
    } catch (err: any) {
      console.error("Drive backup failed:", err);
      logDebug("error", "Failed to back up spec to Google Drive", err?.message || err);
      return { success: false, error: err?.message || String(err) };
    } finally {
      setIsBackingUpToDrive(false);
    }
  };

  // Starts Google's sign-in + consent flow for a given source type. Requires the deployment
  // to supply its own OAuth Client ID (VITE_GOOGLE_CLIENT_ID) from Google Cloud Console —
  // this app has no ability to grant access to your Google data without that configured.
  const connectGoogleService = async (type: GoogleGatedSourceType): Promise<string | null> => {
    setGoogleConnectNotice(null);

    if (type === "notebooklm") {
      const notice = "NotebookLM doesn't offer a public API to connect to yet — add a share link instead and treat it as a manual reference.";
      setGoogleConnectNotice(notice);
      logDebug("warn", `Google connect requested for NotebookLM`, notice);
      return null;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      const notice = `Google sign-in isn't configured for this deployment yet. Set VITE_GOOGLE_CLIENT_ID (from a Google Cloud OAuth Client) and enable the relevant API to allow connecting ${SOURCE_TYPE_META[type].label}.`;
      setGoogleConnectNotice(notice);
      logDebug("warn", `Google connect requested for ${SOURCE_TYPE_META[type].label} but no client ID is configured`, notice);
      return null;
    }

    try {
      await loadGoogleIdentityScript();
      const google = (window as any).google;
      return await new Promise<string | null>((resolve) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES[type],
          callback: (response: any) => {
            if (response?.access_token) {
              googleTokensRef.current[type] = response.access_token;
              setGoogleConnections(prev => ({ ...prev, [type]: true }));
              logDebug("info", `Google account connected for ${SOURCE_TYPE_META[type].label}`);
              resolve(response.access_token);
            } else {
              setGoogleConnectNotice("Google sign-in was cancelled or denied.");
              logDebug("warn", `Google sign-in for ${SOURCE_TYPE_META[type].label} was cancelled or denied`);
              resolve(null);
            }
          }
        });
        tokenClient.requestAccessToken();
      });
    } catch (err: any) {
      console.error("Google sign-in failed:", err);
      logDebug("error", `Google sign-in failed for ${SOURCE_TYPE_META[type].label}`, err?.message || err);
      setGoogleConnectNotice(err.message || "Failed to start Google sign-in.");
      return null;
    }
  };

  // Revokes the token with Google and forgets the local connection state for one service.
  const disconnectGoogleService = (type: GoogleGatedSourceType) => {
    const token = googleTokensRef.current[type];
    if (token && (window as any).google?.accounts?.oauth2?.revoke) {
      (window as any).google.accounts.oauth2.revoke(token, () => {});
    }
    delete googleTokensRef.current[type];
    setGoogleConnections(prev => ({ ...prev, [type]: false }));
    logDebug("info", `Disconnected Google account for ${SOURCE_TYPE_META[type].label}`);
  };

  // Ensures we hold a live access token for a type, silently reusing the in-memory one or
  // prompting a fresh sign-in (e.g. after the ~1hr token expiry, or after a page reload).
  const ensureGoogleToken = async (type: GoogleGatedSourceType): Promise<string | null> => {
    if (googleTokensRef.current[type]) return googleTokensRef.current[type]!;
    return await connectGoogleService(type);
  };

  // --- Real content fetchers for Google-gated sources -----------------------------------
  // These call the Google REST APIs directly from the browser using the OAuth access token
  // obtained above — no token is ever sent to or stored on this app's own server.

  function extractDriveFileId(url: string): string | null {
    const patterns = [/\/d\/([a-zA-Z0-9_-]{10,})/, /[?&]id=([a-zA-Z0-9_-]{10,})/];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  async function fetchDriveContent(url: string, token: string): Promise<string> {
    const fileId = extractDriveFileId(url);
    if (!fileId) throw new Error("Couldn't find a file ID in that Google Drive link. Use a standard file share link.");

    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!metaRes.ok) throw new Error(`Drive API error (${metaRes.status}): ${await metaRes.text()}`);
    const meta = await metaRes.json();

    const googleExportTypes: Record<string, string> = {
      "application/vnd.google-apps.document": "text/plain",
      "application/vnd.google-apps.spreadsheet": "text/csv",
      "application/vnd.google-apps.presentation": "text/plain"
    };

    if (googleExportTypes[meta.mimeType]) {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(googleExportTypes[meta.mimeType])}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!exportRes.ok) throw new Error(`Drive export failed (${exportRes.status}): ${await exportRes.text()}`);
      const text = await exportRes.text();
      return `[Google Drive: ${meta.name}]\n\n${text}`;
    }

    if (meta.mimeType?.startsWith("text/") || meta.mimeType === "application/json") {
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!contentRes.ok) throw new Error(`Drive download failed (${contentRes.status}): ${await contentRes.text()}`);
      const text = await contentRes.text();
      return `[Google Drive: ${meta.name}]\n\n${text}`;
    }

    // Binary formats (PDF, images, Office files) aren't decoded here — name/type only.
    return `[Google Drive: ${meta.name} (${meta.mimeType})]\nThis file type can't be read as text automatically. Re-upload it via "Upload Files" if you need its content in the knowledge base, or convert it to a Google Doc/Sheet first.`;
  }

  async function fetchCalendarContent(token: string): Promise<string> {
    const now = new Date();
    const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Calendar API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const events = (data.items || []) as any[];
    if (events.length === 0) return "[Google Calendar]\nNo events found in the past 7 days or next 30 days.";
    const lines = events.map(e => {
      const start = e.start?.dateTime || e.start?.date || "?";
      const end = e.end?.dateTime || e.end?.date || "?";
      const attendees = (e.attendees || []).map((a: any) => a.email).join(", ");
      return `- ${e.summary || "(untitled)"} | ${start} → ${end}${e.location ? ` | Location: ${e.location}` : ""}${attendees ? ` | Attendees: ${attendees}` : ""}`;
    });
    return `[Google Calendar: primary — events from ${timeMin.slice(0, 10)} to ${timeMax.slice(0, 10)}]\n\n${lines.join("\n")}`;
  }

  async function fetchGmailContent(query: string, token: string): Promise<string> {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=15`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!listRes.ok) throw new Error(`Gmail API error (${listRes.status}): ${await listRes.text()}`);
    const listData = await listRes.json();
    const ids = (listData.messages || []) as { id: string }[];
    if (ids.length === 0) return `[Gmail search: "${query}"]\nNo matching messages found.`;

    const messages = await Promise.all(ids.map(async ({ id }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) return null;
      const msg = await msgRes.json();
      const headers = (msg.payload?.headers || []) as { name: string; value: string }[];
      const get = (name: string) => headers.find(h => h.name === name)?.value || "";
      return `- Subject: ${get("Subject")} | From: ${get("From")} | Date: ${get("Date")}\n  Snippet: ${msg.snippet || ""}`;
    }));

    return `[Gmail search: "${query}" — ${ids.length} message(s), most recent first]\n\n${messages.filter(Boolean).join("\n")}`;
  }

  // Dispatches to the right fetcher for a source type, ensuring a live token first. Content
  // is cached on the KnowledgeFile like any other document; callers persist it afterward.
  const fetchGoogleSourceContent = async (type: GoogleGatedSourceType, url: string): Promise<string> => {
    const token = await ensureGoogleToken(type);
    if (!token) throw new Error("Not connected to Google, or sign-in was cancelled.");
    if (type === "google_drive") return await fetchDriveContent(url, token);
    if (type === "google_calendar") return await fetchCalendarContent(token);
    if (type === "gmail") return await fetchGmailContent(url, token);
    throw new Error("This source type has no content fetcher.");
  };

  // Parses the GitHub URL formats we support: a bare repo (https://github.com/owner/repo)
  // or a specific branch/subpath (.../tree/branch/some/sub/path). Anything else — a PR, an
  // issue, a specific file's "blob" URL — is intentionally not handled here; the person can
  // link the repo itself and we pull the whole (filtered) tree instead.
  function parseGithubUrl(url: string): { owner: string; repo: string; branch?: string; subpath?: string } | null {
    try {
      const u = new URL(url.trim());
      if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;
      const [owner, repoRaw] = parts;
      const repo = repoRaw.replace(/\.git$/i, "");
      if (parts.length >= 4 && parts[2] === "tree") {
        return { owner, repo, branch: parts[3], subpath: parts.slice(4).join("/") || undefined };
      }
      return { owner, repo };
    } catch {
      return null;
    }
  }

  // Fetches a public GitHub repository's file tree and a budgeted selection of its text
  // file contents, entirely client-side against GitHub's public REST API and
  // raw.githubusercontent.com (both send permissive CORS headers for public read requests,
  // so no server proxy is needed — consistent with how website/YouTube links work in this
  // app already). Private repositories are not supported: that would need an auth flow
  // (a personal access token, entered and stored somewhere) which this pass doesn't add.
  const fetchGithubRepoContent = async (url: string): Promise<string> => {
    const parsed = parseGithubUrl(url);
    if (!parsed) throw new Error('That doesn\'t look like a GitHub repository URL — expected something like "https://github.com/owner/repo".');
    const { owner, repo, subpath } = parsed;
    let branch = parsed.branch;

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error("Repository not found, or it's private — only public repositories are supported right now.");
      if (repoRes.status === 403) throw new Error("GitHub's rate limit for unauthenticated requests was hit — wait a bit and try refreshing this source again.");
      throw new Error(`GitHub API error (${repoRes.status}).`);
    }
    const repoMeta = await repoRes.json();
    if (!branch) branch = repoMeta.default_branch || "main";

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    if (!treeRes.ok) throw new Error(`Could not read the file tree for branch "${branch}" (${treeRes.status}).`);
    const treeData = await treeRes.json();

    let allPaths: string[] = (treeData.tree || [])
      .filter((entry: any) => entry.type === "blob")
      .map((entry: any) => entry.path as string);
    if (subpath) allPaths = allPaths.filter(p => p === subpath || p.startsWith(`${subpath}/`));
    if (allPaths.length === 0) throw new Error(subpath ? `No files found under "${subpath}" on branch "${branch}".` : `No files found on branch "${branch}".`);

    const orderedCandidates = prioritizeCodebasePaths(allPaths.filter(isLikelyTextSourceFile)).slice(0, 60);

    // Modest concurrency rather than firing every request at once — public, unauthenticated
    // raw.githubusercontent.com requests aren't as tightly rate-limited as the API itself,
    // but there's no reason to hammer it for a one-time knowledge-base fetch.
    const files: CodebaseFileEntry[] = [];
    const CONCURRENCY = 5;
    for (let i = 0; i < orderedCandidates.length; i += CONCURRENCY) {
      const batch = orderedCandidates.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(async (path): Promise<CodebaseFileEntry | null> => {
        try {
          const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
          if (!raw.ok) return null;
          return { path, content: await raw.text() };
        } catch {
          return null;
        }
      }));
      results.forEach(r => { if (r) files.push(r); });
    }

    return buildCodebaseDigest({
      sourceLabel: `github.com/${owner}/${repo} (branch: ${branch})${subpath ? ` — path: ${subpath}` : ""}`,
      allPaths,
      files,
    });
  };

  // Same pattern as fetchAndStoreGoogleContent: fetch real content, store it on the
  // KnowledgeFile as if it had been uploaded directly, and persist it — from then on it's
  // included in context regardless of the External Resources toggle, since it's a source
  // the user explicitly linked, not general web grounding.
  const fetchAndStoreGithubContent = async (fileId: string, url: string, name: string) => {
    setGithubFetchingId(fileId);
    try {
      const content = await fetchGithubRepoContent(url);
      const updated: Partial<KnowledgeFile> = { content, size: new Blob([content]).size };
      setKnowledgeFiles(prev => prev.map(f => (f.id === fileId ? { ...f, ...updated } : f)));
      const existing = knowledgeFilesRef.current.find(f => f.id === fileId);
      if (existing) saveKnowledgeSource({ ...existing, ...updated } as KnowledgeFile);
      logDebug("info", `Fetched content for "${name}"`, `${content.length} characters`);
    } catch (err: any) {
      const errorNote = `[Could not fetch GitHub repo content: ${err?.message || err}]`;
      setKnowledgeFiles(prev => prev.map(f => (f.id === fileId ? { ...f, content: errorNote } : f)));
      const existing = knowledgeFilesRef.current.find(f => f.id === fileId);
      if (existing) saveKnowledgeSource({ ...existing, content: errorNote } as KnowledgeFile);
      logDebug("error", `Failed to fetch GitHub repo content for "${name}"`, err?.message || err);
    } finally {
      setGithubFetchingId(null);
    }
  };

  const addLinkSource = () => {
    if (!newSourceUrl.trim()) return;
    const url = newSourceUrl.trim();
    // The "web" dropdown option covers both websites and YouTube; resolve to the specific
    // type here so the right icon/label shows in the Loaded Sources list.
    const resolvedType: KnowledgeSourceType =
      newSourceType === "web" ? (/(?:youtube\.com|youtu\.be)/i.test(url) ? "youtube" : "website") : newSourceType;
    const fileId = `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFile: KnowledgeFile = {
      id: fileId,
      name: url,
      content: "",
      size: 0,
      uploadedAt: new Date().toISOString(),
      sourceType: resolvedType,
      url,
      targetTab: activeTab === "product" ? "product" : "custom"
    };
    setKnowledgeFiles(prev => [...prev, newFile]);
    saveKnowledgeSource(newFile);
    setNewSourceUrl("");

    if (GOOGLE_GATED_SOURCE_TYPES.includes(resolvedType) && resolvedType !== "notebooklm") {
      fetchAndStoreGoogleContent(fileId, resolvedType as GoogleGatedSourceType, url, newFile.name);
    } else if (resolvedType === "github") {
      fetchAndStoreGithubContent(fileId, url, newFile.name);
    }
  };

  // Fetches real content for a Google-gated source and stores it as the file's content —
  // from then on it's treated exactly like an uploaded document, included in context
  // regardless of the External Resources toggle. Used both right after linking and from the
  // manual "Refresh" action in the Loaded Sources list.
  const fetchAndStoreGoogleContent = async (fileId: string, type: GoogleGatedSourceType, url: string, name: string) => {
    setGoogleFetchingId(fileId);
    try {
      const content = await fetchGoogleSourceContent(type, url);
      const updated: Partial<KnowledgeFile> = { content, size: new Blob([content]).size };
      setKnowledgeFiles(prev => prev.map(f => (f.id === fileId ? { ...f, ...updated } : f)));
      const existing = knowledgeFilesRef.current.find(f => f.id === fileId);
      if (existing) saveKnowledgeSource({ ...existing, ...updated } as KnowledgeFile);
      logDebug("info", `Fetched content for "${name}"`, `${content.length} characters`);
    } catch (err: any) {
      const errorNote = `[Could not fetch content: ${err?.message || err}]`;
      setKnowledgeFiles(prev => prev.map(f => (f.id === fileId ? { ...f, content: errorNote } : f)));
      const existing = knowledgeFilesRef.current.find(f => f.id === fileId);
      if (existing) saveKnowledgeSource({ ...existing, content: errorNote } as KnowledgeFile);
      logDebug("error", `Failed to fetch content for "${name}"`, err?.message || err);
    } finally {
      setGoogleFetchingId(null);
    }
  };

  // Adds a pasted-text knowledge source, treated the same as an uploaded document.
  const addTextSource = () => {
    if (!newSourceText.trim()) return;
    const existingTextCount = knowledgeFiles.filter(f => f.sourceType === "text").length;
    const newFile: KnowledgeFile = {
      id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Pasted Text ${existingTextCount + 1}`,
      content: newSourceText,
      size: new Blob([newSourceText]).size,
      uploadedAt: new Date().toISOString(),
      sourceType: "text",
      targetTab: activeTab === "product" ? "product" : "custom"
    };
    setKnowledgeFiles(prev => [...prev, newFile]);
    saveKnowledgeSource(newFile);
    setNewSourceText("");
  };

  const deleteKnowledgeFile = (id: string) => {
    setKnowledgeFiles(prev => prev.filter(file => file.id !== id));
    deleteKnowledgeSourceRemote(id);
  };

  // Safety caps to avoid "input token count exceeds maximum" errors from oversized
  // knowledge base content or very long multi-round transcripts.
  const MAX_SOURCE_CHARS = 60000; // ~15k tokens per source
  const MAX_CONTEXT_CHARS = 260000; // ~65k tokens total knowledge context
  const MAX_TRANSCRIPT_CHARS = 200000; // ~50k tokens of panel discussion history

  // Builds the knowledge base context block shared by both chat modes.
  // The single definition of "a real, content-bearing KB source" (has content, isn't an
  // image) — was previously duplicated as an inline filter at 10 separate call sites, each
  // independently re-scanning knowledgeFiles and each a place the definition could silently
  // drift if only one were ever updated. Memoized so it's computed once per knowledgeFiles
  // change rather than once per call site per render. Declared before buildKnowledgeContext
  // (which uses it) rather than relying on hoisting/closure-over-a-later-line — see the
  // mapWithConcurrency/AGENT_CALL_CONCURRENCY incident earlier this session for why that
  // ordering assumption isn't one to repeat.
  const contentBearingKnowledgeFiles = useMemo(
    () => knowledgeFiles.filter(f => f.content && f.sourceType !== "image"),
    [knowledgeFiles]
  );

  const isProductTab = activeTab === "product";
  const currentTeam = isProductTab ? productTeam : customTeam;

  const currentKnowledgeFiles = useMemo(() => {
    if (isProductTab && productKnowledgeScope === "product_only") {
      const filtered = knowledgeFiles.filter(f => f.targetTab === "product");
      return filtered.length > 0 ? filtered : knowledgeFiles;
    }
    return knowledgeFiles;
  }, [isProductTab, productKnowledgeScope, knowledgeFiles]);

  const contentBearingProductKnowledgeFiles = useMemo(() => {
    return currentKnowledgeFiles.filter(f => f.content && f.sourceType !== "image");
  }, [currentKnowledgeFiles]);

  const buildKnowledgeContext = useCallback(() => {
    if (knowledgeFiles.length === 0) return "";
    const contentSources = contentBearingKnowledgeFiles;
    const imageSources = knowledgeFiles.filter(f => f.sourceType === "image");
    const linkSources = knowledgeFiles.filter(f => !f.content && f.url);

    let context = "";
    if (contentSources.length > 0) {
      context += `KNOWLEDGE BASE DOCUMENTS:\nThe following documents have been provided as context. Use this knowledge to satisfy the query:\n\n` +
        contentSources.map(f => `--- FILE: ${f.name} ---\n${truncateText(f.content, MAX_SOURCE_CHARS)}\n--- END FILE ---`).join("\n\n");
    }
    if (imageSources.length > 0) {
      context += `${context ? "\n\n" : ""}IMAGE ATTACHMENTS:\nThe user has uploaded the following images. Vision-capable agents (Gemini, Claude) receive the actual image content alongside this text; other agents see only this list:\n` +
        imageSources.map(f => `- ${f.name} (${formatBytes(f.size)})`).join("\n");
    }
    if (linkSources.length > 0) {
      context += `${context ? "\n\n" : ""}LINKED EXTERNAL SOURCES:\nThe user has linked the following sources. If you have web search / browsing capability, consult them when relevant:\n` +
        linkSources.map(f => `- [${SOURCE_TYPE_META[f.sourceType]?.label || "Link"}] ${f.url}`).join("\n");
    }
    return truncateText(context, MAX_CONTEXT_CHARS);
  }, [knowledgeFiles, contentBearingKnowledgeFiles]);

  // The ids of currently-live, content-bearing KB sources — the "what was actually grounded"
  // set stamped onto a run at completion (groundedSourceIds) and compared against later to
  // detect drift.
  const getGroundedSourceIds = useCallback(
    () => contentBearingKnowledgeFiles.map(f => f.id),
    [contentBearingKnowledgeFiles]
  );

  // Plain source text for the live-discussion claim checker (Phase 3 roadmap item #1):
  // deliberately just the file contents, not the full prompt-formatted context with its
  // "KNOWLEDGE BASE DOCUMENTS:" framing — that framing text can't introduce false numeric
  // matches, but keeping this separate from buildKnowledgeContext makes the intent explicit
  // and avoids recomputing the (potentially large) formatted string on every transcript render.
  const knowledgeBaseTextForClaimChecks = useMemo(() => {
    return knowledgeFiles
      .filter(f => f.content && f.sourceType !== "image")
      .map(f => f.content)
      .join("\n\n");
  }, [knowledgeFiles]);

  // The verification system trusting its own outputs (Phase 3 roadmap, round 2, item #1):
  // a figure the manager confirmed with the calculator was being flagged as "unverified"
  // the moment a later message in the SAME conversation restated it — the check only ever
  // looked at the Knowledge Base, never at the app's own prior verified calculations. This
  // folds verified-calculation messages into the trusted corpus so a legitimately-echoed
  // verified figure stops reading as a false positive.
  const trustedFactsCorpus = useMemo(() => {
    const verifiedCalcTexts = followUpMessages.filter(m => m.isVerifiedCalculation).map(m => m.text);
    return [knowledgeBaseTextForClaimChecks, ...verifiedCalcTexts].filter(Boolean).join("\n\n");
  }, [knowledgeBaseTextForClaimChecks, followUpMessages]);

  // The expensive half of claim-checking (a full regex scan of the whole corpus) computed
  // ONCE per corpus change, not once per transcript message per render — previously every
  // message row re-ran this from scratch on every render, and during an active stream that
  // meant re-scanning the entire knowledge base on every single chunk. null (not an empty
  // Set) when there's no corpus at all, matching checkClaimsAgainstKnowledgeBase's existing
  // "nothing to check against" semantics rather than "checked against nothing, all clean".
  const trustedFactsSourceNumbers = useMemo(
    () => (trustedFactsCorpus.trim() ? extractSignificantNumbers(trustedFactsCorpus) : null),
    [trustedFactsCorpus]
  );

  // Instruction appended to every agent call describing whether it may reach beyond the
  // knowledge base (general knowledge / live web search) or must stay confined to it.
  const getResourceScopeInstruction = useCallback(() => {
    return useExternalResources
      ? "RESOURCE SCOPE: You may use your general knowledge and, where available, live web search to supplement the knowledge base documents above."
      : "RESOURCE SCOPE: You must rely ONLY on the knowledge base documents and prompt above. Do not use outside/general knowledge and do not search the internet. If the provided material is insufficient to answer, say so explicitly.";
  }, [useExternalResources]);

  // Instruction reflecting the chosen discussion depth (Fast / Deep / Extended Discussion).
  const getDepthInstruction = useCallback(() => {
    if (discussionDepth === "extended") {
      return "DISCUSSION DEPTH: Extended Discussion (multiple rounds). Treat this as one round of a longer back-and-forth. Engage closely with other panelists' points, keep refining your position across rounds, and don't be afraid to change your mind if a later round raises a better argument.";
    }
    if (discussionDepth === "deep") {
      return "DISCUSSION DEPTH: Deep Discussion. Take your time. Consider multiple angles, tradeoffs, and edge cases, and justify your reasoning thoroughly before concluding.";
    }
    return "DISCUSSION DEPTH: Fast Discussion. Prioritize speed and concision. Give your best answer directly without exhaustive exploration of alternatives.";
  }, [discussionDepth]);

  // Shared helper to call a single custom agent (Gemini directly, others via the server route).
  // Converts uploaded image sources (stored as data URLs) into raw base64 parts for
  // vision-capable providers. Gemini and Claude receive actual pixels; Perplexity and
  // Grok have no image input on these endpoints and see the filenames only.
  const getVisionImageParts = useCallback((): { mimeType: string; data: string }[] => {
    return knowledgeFiles
      .filter(f => f.sourceType === "image" && f.content?.startsWith("data:"))
      .map(f => {
        const match = f.content.match(/^data:([^;]+);base64,(.*)$/s);
        return match ? { mimeType: match[1], data: match[2] } : null;
      })
      .filter((p): p is { mimeType: string; data: string } => p !== null);
  }, [knowledgeFiles]);

  // A single, unretried attempt to call one agent. Split out so callAgent can wrap it with
  // retry/backoff without duplicating the provider-routing logic.
  const callAgentOnce = useCallback(async (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal): Promise<string> => {
    setCallCount(c => c + 1);
    const images = agent.provider === "gemini" || agent.provider === "anthropic" || agent.provider === "openai" ? getVisionImageParts() : [];
    if (agent.provider === "gemini") {
      return await generateGeminiContent(
        userContent,
        keys.gemini || undefined,
        agent.model,
        systemInstruction,
        useExternalResources,
        images,
        signal,
        agent.temperature
      );
    }
    const otherRes = await axios.post("/api/execute-others", {
      prompt: userContent,
      systemInstruction,
      keys,
      models: { [agent.provider]: agent.model },
      agents: [agent.provider],
      useExternalResources,
      images,
      temperature: agent.temperature
    }, { signal, timeout: DEFAULT_MODEL_CALL_TIMEOUT_MS });
    const text = otherRes.data[0]?.text || "No response received.";
    if (typeof text === "string" && text.startsWith("Error: ")) throw new Error(text.slice(7));
    return text;
  }, [keys, useExternalResources, getVisionImageParts]);

  // Calls an agent with automatic retry (exponential backoff + jitter) for transient failures
  // — rate limits and brief provider outages are common when several agents fire at once.
  // A user-initiated Stop (AbortSignal) is never retried; it propagates immediately.
  const callAgent = useCallback(async (agent: CustomAgent, userContent: string, systemInstruction: string, signal?: AbortSignal): Promise<string> => {
    // A provider "high demand" 503 gets a longer runway than a generic transient blip — see
    // classifyAgentError. Determined dynamically per-attempt (not fixed upfront) so a call
    // that starts out as a plain network hiccup but turns into a 503 on a later attempt
    // still gets the longer schedule from that point on, and vice versa.
    const genericMaxAttempts = 3;
    const overloadMaxAttempts = 5;
    let lastError: any;
    // Context captured once, up front, so every log line below can reference it without
    // recomputing — this is the "what was actually requested" half of the diagnostic: which
    // model, how much was sent, for which agent. Combined with the elapsed/attempt numbers
    // added below, a single log line is now enough to answer "what, how much, how long, how
    // many tries" without cross-referencing several separate entries.
    const callStartedAt = Date.now();
    const promptChars = userContent.length + systemInstruction.length;
    const modelLabel = `${agent.provider}${agent.model ? `/${agent.model}` : ""}`;
    for (let attempt = 1; ; attempt++) {
      try {
        const result = await callAgentOnce(agent, userContent, systemInstruction, signal);
        if (attempt > 1) {
          // Only worth a log line when it actually took more than one try — the ordinary
          // one-shot success case would just be noise on every single call.
          logDebug("info", `${agent.name} (${modelLabel}) recovered on attempt ${attempt}`, `${((Date.now() - callStartedAt) / 1000).toFixed(1)}s total, ${promptChars} prompt chars`);
        }
        return result;
      } catch (err: any) {
        if (signal?.aborted || err?.name === "AbortError" || err?.name === "CanceledError" || axios.isCancel?.(err)) {
          throw err;
        }
        lastError = err;
        // Retrying a quota-exhausted or auth-rejected call cannot succeed — the account is
        // out of credits or the key is invalid, neither of which resolves in the 1-2 seconds
        // between attempts. A real usage log showed this burning 3x the necessary call
        // volume (2 wasted retries per agent, per round) at exactly the moment credits were
        // already critically low. Fail immediately instead, with guidance pointing at the
        // actual fix rather than a generic "check your API keys" message.
        const classification = classifyAgentError(err);
        if (classification.isUnrecoverable) {
          logDebug("error", `${agent.name} (${modelLabel}) call failed — not retrying`, `${classification.reason ? unrecoverableErrorGuidance(classification.reason) : (err?.message || err)} — ${promptChars} prompt chars, failed after ${((Date.now() - callStartedAt) / 1000).toFixed(1)}s`);
          throw err;
        }
        const isOverload = classification.reason === "transient_overload";
        const maxAttempts = isOverload ? overloadMaxAttempts : genericMaxAttempts;
        if (attempt < maxAttempts) {
          // Generic: ~500ms, ~1000ms (unchanged). Overload: ~2s, ~4s, ~8s, ~16s — enough
          // runway for a real provider capacity spike to actually clear, rather than giving
          // up after the ~1.5s total a generic blip's schedule allows.
          const delayMs = isOverload
            ? 2000 * Math.pow(2, attempt - 1) + Math.random() * 500
            : 500 * Math.pow(2, attempt - 1) + Math.random() * 300;
          logDebug("warn", `${agent.name} (${modelLabel}) call failed — retrying (${attempt}/${maxAttempts - 1})${isOverload ? " [provider reports high demand — waiting longer]" : ""}`, `${err?.message || err} — ${promptChars} prompt chars, waiting ${(delayMs / 1000).toFixed(1)}s before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Final, permanent failure for this call — one line with everything needed to
          // diagnose it without hunting through the retry lines above: model, prompt size,
          // total attempts made, total time spent trying, and the last error seen.
          logDebug("error", `${agent.name} (${modelLabel}) permanently failed after ${attempt} attempt(s)`, `${((Date.now() - callStartedAt) / 1000).toFixed(1)}s total, ${promptChars} prompt chars, last error: ${err?.message || err}`);
          break;
        }
      }
    }
    throw lastError;
  }, [callAgentOnce, logDebug]);

  // Streams a single agent's response, calling onChunk as text arrives and resolving with the
  // full text at the end. Used for the longest single waits (Parallel mode, Chat With The
  // Team's final answer) where visible incremental progress meaningfully helps. Unlike
  // callAgent, this has no automatic retry — a stream that fails partway has already shown
  // the user partial output, so silently retrying from scratch would be more confusing than
  // just surfacing the error.
  const callAgentStreaming = useCallback(async (
    agent: CustomAgent,
    userContent: string,
    systemInstruction: string,
    onChunk: (deltaText: string) => void,
    signal?: AbortSignal
  ): Promise<string> => {
    setCallCount(c => c + 1);
    const images = agent.provider === "gemini" || agent.provider === "anthropic" || agent.provider === "openai" ? getVisionImageParts() : [];
    const res = await fetch("/api/execute-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        agent: agent.provider,
        prompt: userContent,
        systemInstruction,
        keys,
        model: agent.model,
        useExternalResources,
        images,
        temperature: agent.temperature
      })
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Stream request failed (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let streamError: string | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const trimmed = frame.trim();
        if (!trimmed.startsWith("data:")) continue;
        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          if (typeof json.text === "string" && json.text.length > 0) {
            fullText += json.text;
            onChunk(json.text);
          } else if (json.error) {
            streamError = json.error;
          }
        } catch {
          // Ignore a malformed/partial frame — SSE frames arrive whole in practice here.
        }
      }
    }
    if (streamError) throw new Error(streamError);
    return fullText;
  }, [keys, useExternalResources, getVisionImageParts]);

  // Entry point for the Start Discussion button in BOTH modes. Before running anything, asks
  // a lightweight check: does this task genuinely need clarification first? If the planner
  // returns questions, they're presented one at a time with clickable options (like this
  // chat's own clarifying-question UI); once answered (or skipped), the real discussion runs
  // with the Q&A appended as extra context for every agent.
  // Detects "the team is still just the untouched default assistant" — a genuinely
  // customized single-agent team should never trigger this, only the literal untouched
  // default persona created by createDefaultAgent().
  const isDefaultOnlyTeam = () =>
    customTeam.length === 1 && customTeam[0].name === "Assistant" && customTeam[0].persona === createDefaultAgent().persona;

  const [isTeamSetupGateOpen, setIsTeamSetupGateOpen] = useState(false);
  // "See response" on a question chip briefly rings the entry it jumps to, so the jump
  // itself is visible feedback, not just an unexplained scroll.
  const [highlightedTranscriptIndex, setHighlightedTranscriptIndex] = useState<number | null>(null);
  const jumpToTranscriptEntry = (index: number) => {
    document.getElementById(`transcript-entry-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedTranscriptIndex(index);
    setTimeout(() => setHighlightedTranscriptIndex(prev => (prev === index ? null : prev)), 2000);
  };

  // The first later transcript entry actually spoken by the named recipient — per the round
  // prompts ("first, if anyone asked you a direct question, answer it"), a panelist's next
  // contribution after being asked is where the answer lives. There's no explicit
  // question-to-answer tag from the model, so this positional heuristic is the closest
  // available signal; it errs toward "no link" rather than pointing somewhere wrong.
  const findAnswerEntryIndex = (transcript: CollaborativeTranscriptEntry[], afterIndex: number, recipientName: string): number | null => {
    const target = recipientName.trim().toLowerCase();
    for (let j = afterIndex + 1; j < transcript.length; j++) {
      const name = transcript[j].agentName.trim().toLowerCase();
      if (name === target || name.includes(target) || target.includes(name)) return j;
    }
    return null;
  };

  // "Expand My Prompt": a neutral, un-personified call — deliberately does NOT include any
  // agent's own persona in the system instruction, since the point is a consistent,
  // role-free rewrite regardless of which agent happens to execute the call. Reuses
  // callAgent (and therefore its retry/fail-fast behavior) rather than a bespoke call path.
  const expandUserPrompt = async () => {
    if (!customPrompt.trim() || isExpandingPrompt) return;
    setIsExpandingPrompt(true);
    setExpandedPromptDraft(null);
    setExpandedPromptHasRoleWarning(false);
    try {
      const executor = getRunFacilitator(collaborativeRun) || customTeam[0];
      if (!executor) return;
      const expanded = await callAgent(executor, customPrompt, PROMPT_EXPANSION_SYSTEM_INSTRUCTION, undefined);
      const cleaned = expanded.trim();
      setExpandedPromptDraft(cleaned);
      setExpandedPromptHasRoleWarning(detectRoleAssignmentLanguage(cleaned));
      logDebug("info", "Expanded prompt drafted for review", `${cleaned.length} characters`);
    } catch (err: any) {
      console.error("Error expanding prompt:", err);
      logDebug("error", "Failed to expand prompt", err?.message || err);
    } finally {
      setIsExpandingPrompt(false);
    }
  };

  const startDiscussionWithClarification = async () => {
    if (!customPrompt || customTeam.length === 0 || getAvailableProviders().length === 0) return;
    // Gate: starting a real discussion with only the untouched default agent is very
    // likely not what the user intended — offer a way out before spending API calls on a
    // one-person "team". Dismissable and skippable; never blocks proceeding outright.
    if (isDefaultOnlyTeam()) {
      setIsTeamSetupGateOpen(true);
      return;
    }
    await proceedWithDiscussion();
  };

  const chooseSuggestTeamFromGate = () => {
    setIsTeamSetupGateOpen(false);
    setIsLeftPanelOpen(true);
    setIsAgentRosterOpen(true);
    setIsSuggestTeamOpen(true);
    setSuggestTeamMode("replace");
    setDecisionGoal(customPrompt);
    // suggestAgentTeam reads decisionGoal from component state, so it needs to run after
    // the setDecisionGoal above has actually committed and re-rendered.
    setTimeout(() => { suggestAgentTeam(); }, 60);
  };

  const chooseManualSetupFromGate = () => {
    setIsTeamSetupGateOpen(false);
    jumpToPanelSection("team-agents");
  };

  const proceedWithDiscussion = async () => {
    clarificationContextRef.current = "";
    clarificationEntriesRef.current = [];
    setTaskTypeOverride(null);
    setClarifyingAnswers([]);
    setClarifyingQuestions(null);
    setCustomClarifyingAnswer("");
    // Fast-path: a short, simple, KB-less prompt skips the clarifying-question ritual
    // entirely (the upfront task-type/detail-profile questions AND the team's own
    // checker call) and goes straight into the discussion — see isLowStakesPrompt.
    // taskTypeOverride/detailProfile stay at their defaults (auto-classify, Standard),
    // same as if the manager had answered "Let the team decide" / "Standard" anyway.
    if (isLowStakesPrompt(customPrompt, knowledgeFiles.some(f => f.content && f.sourceType !== "image"))) {
      logDebug("info", "Fast-path: skipping clarifying questions for a simple, low-stakes prompt", customPrompt.slice(0, 200));
      launchDiscussion();
      return;
    }
    setIsCheckingClarification(true);
    // Plain local objects, not derived from any agent call — declared here, outside the
    // try/catch below, specifically so the catch block's fallback can still show these two
    // even when the team's own clarifying-question generation call fails. See the catch
    // block for why that distinction matters.
    const taskTypeQuestion = {
      question: TASK_TYPE_QUESTION,
      options: ["Decision", "Deliverable", "Let the team decide"],
      askedBy: "__app__",
      whyImAsking: "Decision produces a recommendation with a probability-weighted tree of alternatives. Deliverable produces a finished piece of work (a document, plan, or analysis) with no tree. Pick \"Let the team decide\" if you're not sure — the team classifies it from the task itself."
    };
    const detailProfileQuestion = {
      question: DETAIL_PROFILE_QUESTION,
      options: ["Standard", "Domain-Expert"],
      askedBy: "__app__",
      whyImAsking: "Domain-Expert keeps your exact numbers, units, and technical wording, and adds a formal cover note to Word exports. Standard is quicker and works for most tasks."
    };
    try {
      const checker = customTeam[0];
      const rosterText = customTeam.map(a => `- ${a.name}: ${a.persona.slice(0, 150)}`).join("\n");
      const instruction = `You are checking whether a task needs clarification before a multi-agent team starts work on it. Only ask questions that would genuinely change HOW the team approaches the task or WHAT a good answer looks like — do not ask generic or low-value questions. Match the number of questions to the task's complexity: a simple, narrow task usually needs 0-1; a genuinely multi-dimensional or high-stakes task can reasonably need more — typically 1-3, and rarely up to 5 for something with several genuinely distinct unknowns. If the task is already clear and actionable as written, return an empty list.\n\nTHE TEAM:\n${rosterText}\n\nFor each question, decide which single team member above would most plausibly be the one asking it, based on their persona and expertise — this is shown to the user as "<name> wants to know: ...", so pick whoever's angle the question genuinely reflects, not just the first person on the roster.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "questions": [\n    { "question": "short, specific question", "options": ["short option 1", "short option 2", "short option 3"], "askedBy": "exact name of the team member asking, from the list above", "whyImAsking": "one sentence, written in the asker's own voice, on what concretely changes about the team's approach depending on the answer" }\n  ]\n}\n\nEach question needs 2-4 short, mutually exclusive answer options a user could click (a few words each) covering the realistic possibilities — do not include an "other" option, the user can always type their own answer or skip ahead instead.`;
      const parsed = await callAgentForJson(checker, `TASK:\n${customPrompt}`, instruction);
      const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
        .filter((q: any) => q?.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q: any) => ({
          question: q.question,
          options: q.options,
          askedBy: customTeam.find(a => a.name.toLowerCase() === String(q.askedBy || "").toLowerCase())?.id || checker.id,
          whyImAsking: typeof q.whyImAsking === "string" && q.whyImAsking.trim() ? q.whyImAsking.trim() : undefined
        }))
        .slice(0, 5);
      questions.unshift(detailProfileQuestion);
      questions.unshift(taskTypeQuestion);
      setIsCheckingClarification(false);
      setClarifyingAnswers(new Array(questions.length).fill(null));
      setClarifyingCursor(null);
      setClarifyingQuestions(questions);
      logDebug("info", `Asking ${questions.length} clarifying question(s) before starting`, customPrompt.slice(0, 200));
    } catch (err: any) {
      // Previously this fell straight through to launchDiscussion() on ANY failure here —
      // including the common case where a transient provider overload (see the 503 retry
      // widening elsewhere) took down just the team's own clarifying-question call. That
      // silently skipped the ENTIRE confirmation step, task-type and detail-profile included,
      // even though those two are plain local objects with no API dependency at all — nothing
      // about them required this call to have succeeded. From the manager's side this looked
      // exactly like "sporadic": no error, no explanation, the discussion just started on
      // default settings as if the confirmation had never existed. Now the failure only
      // drops the team's own questions (which genuinely couldn't be generated); the two
      // always-asked ones still show.
      logDebug("warn", "Couldn't check whether the task needs clarifying — asking the standard setup questions only", err?.message || err);
      setIsCheckingClarification(false);
      const fallbackQuestions = [taskTypeQuestion, detailProfileQuestion];
      setClarifyingAnswers(new Array(fallbackQuestions.length).fill(null));
      setClarifyingCursor(null);
      setClarifyingQuestions(fallbackQuestions);
    }
  };

  // Threshold picked from the run that prompted this feature: a 6-source/103k-char KB plus
  // task/team overhead landed calls around 112k-124k characters and repeatedly hit provider
  // capacity errors on the team's lightweight-tier agents. 70,000 combined KB+prompt
  // characters is comfortably below that but well above a typical small-KB run, so it flags
  // the genuinely heavy case without nagging on every KB-grounded discussion.
  const BIG_DISCUSSION_CHAR_THRESHOLD = 70000;

  const launchDiscussion = (skipSizeCheck = false) => {
    if (!skipSizeCheck) {
      // Was buildKnowledgeContext().length — that builds the ENTIRE concatenated, truncated
      // KB string (three filter passes, template-literal joins over every file's content)
      // purely to read its length off the end. Summing content lengths directly gets the
      // same estimate without ever allocating the big string — capped per-file at
      // MAX_SOURCE_CHARS to match what buildKnowledgeContext actually sends per file, so an
      // oversized single file doesn't inflate this estimate past what would really be sent.
      const estimatedKbChars = contentBearingKnowledgeFiles.reduce((sum, f) => sum + Math.min(f.content?.length || 0, MAX_SOURCE_CHARS), 0);
      const estimatedChars = estimatedKbChars + customPrompt.length;
      const lightAgents = customTeam.filter(a => LIGHTWEIGHT_MODEL_IDS.has(a.model));
      if (estimatedChars > BIG_DISCUSSION_CHAR_THRESHOLD && lightAgents.length > 0) {
        setBigDiscussionWarning({ totalChars: estimatedChars, lightAgentNames: lightAgents.map(a => a.name) });
        return;
      }
    }
    setBigDiscussionWarning(null);
    if (chatMode === "parallel") runCustomTeamExecution();
    else runCollaborativeSession(undefined, taskTypeOverride ?? undefined);
  };

  // The current question is the lowest unanswered slot; composition only happens at launch,
  // which is exactly what makes editing free — a revised answer just changes what gets
  // composed, with no downstream state to unwind.
  const currentClarifyingIndex = clarifyingAnswers.findIndex(a => a === null);
  // Manual navigation cursor — null means "follow the natural lowest-unanswered flow"
  // (unchanged auto-advance-and-launch behavior). Previously there was no way to peek ahead
  // at an unanswered question without answering everything before it first; this lets Back/
  // Next move freely while leaving the natural flow completely intact when untouched.
  const [clarifyingCursor, setClarifyingCursor] = useState<number | null>(null);
  const displayedClarifyingIndex = clarifyingCursor !== null ? clarifyingCursor : currentClarifyingIndex;
  const goToClarifyingQuestion = (index: number) => {
    if (!clarifyingQuestions) return;
    setClarifyingCursor(Math.max(0, Math.min(index, clarifyingQuestions.length - 1)));
    setCustomClarifyingAnswer("");
  };

  // Sentinel identifying the app-level Detail Profile question injected into every
  // clarifying-question round (see proceedWithDiscussion) — never a real agent id, so the
  // question renders with no "X wants to know" attribution, and it's excluded from the
  // composed context below since it's a setting for the app, not part of the task brief
  // the panel should read.
  const DETAIL_PROFILE_QUESTION = "Standard detail, or go deeper with Domain-Expert mode for this discussion?";
  const TASK_TYPE_QUESTION = "Should this discussion produce a decision or a deliverable?";
  const composeClarifications = (answers: (string | null)[]) => {
    if (!clarifyingQuestions) return "";
    return clarifyingQuestions
      .map((q, i) => ({ q, a: answers[i] }))
      .filter(x => x.a && x.q.question !== DETAIL_PROFILE_QUESTION && x.q.question !== TASK_TYPE_QUESTION) // drop unanswered/skipped/app-level settings
      .map(x => `Q: ${x.q.question}\nA: ${x.a}`)
      .join("\n\n");
  };

  // Structured sibling of composeClarifications, same filter, kept as an array instead of
  // one flattened string — feeds Discussion Requirements' "Clarifications" group.
  const composeClarificationEntries = (answers: (string | null)[]): { question: string; answer: string }[] => {
    if (!clarifyingQuestions) return [];
    return clarifyingQuestions
      .map((q, i) => ({ q, a: answers[i] }))
      .filter(x => x.a && x.q.question !== DETAIL_PROFILE_QUESTION && x.q.question !== TASK_TYPE_QUESTION)
      .map(x => ({ question: x.q.question, answer: x.a as string }));
  };

  // Records the answer to whichever question is currently displayed (the natural
  // lowest-unanswered slot, unless the user manually navigated elsewhere). When every slot
  // is filled, composes the Q&A into context and starts the discussion — unchanged from
  // before; manual navigation only affects WHERE an answer is written, not this completion
  // check, since it already just looks for any remaining null regardless of position.
  const answerClarifyingQuestion = (answer: string) => {
    if (!clarifyingQuestions || displayedClarifyingIndex === -1) return;
    const updated = [...clarifyingAnswers];
    updated[displayedClarifyingIndex] = answer;
    setClarifyingAnswers(updated);
    setCustomClarifyingAnswer("");
    setClarifyingCursor(null); // return to the natural flow after answering
    // Detail Profile is presented as a question (rather than only a standalone toggle) —
    // applying it here means whichever answer the manager gives right before starting is
    // the one that actually takes effect, even if it differs from the toggle's last state.
    const detailProfileIdx = clarifyingQuestions.findIndex(q => q.question === DETAIL_PROFILE_QUESTION);
    if (detailProfileIdx === displayedClarifyingIndex) {
      setDetailProfile(answer.toLowerCase().includes("domain") ? "domain-expert" : "standard");
    }
    const taskTypeIdx = clarifyingQuestions.findIndex(q => q.question === TASK_TYPE_QUESTION);
    if (taskTypeIdx === displayedClarifyingIndex) {
      const lower = answer.toLowerCase();
      setTaskTypeOverride(lower.includes("deliverable") ? "deliverable" : lower.includes("decision") ? "decision" : null);
    }
    if (!updated.some(a => a === null)) {
      clarificationContextRef.current = composeClarifications(updated);
      clarificationEntriesRef.current = composeClarificationEntries(updated);
      setClarifyingQuestions(null);
      launchDiscussion();
    }
  };

  // Skip just the current question ("" marks it skipped) — the rest still get asked.
  const skipThisClarifyingQuestion = () => answerClarifyingQuestion("");

  // Used only by the combined Task Type + Detail Profile screen (see isAppSettingsStep in
  // the render) — both are answered from one view rather than one always being "the
  // current question", so this targets an explicit index instead of displayedClarifyingIndex.
  // Reuses the exact same detection/side-effect logic as answerClarifyingQuestion for
  // consistency; setting clarifyingCursor to null afterward lets the natural "lowest
  // unanswered index" rule carry the manager straight to whatever comes next the instant
  // BOTH are filled, with no separate "Continue" step needed.
  const answerAppSettingsQuestion = (index: number, answer: string) => {
    if (!clarifyingQuestions) return;
    const updated = [...clarifyingAnswers];
    updated[index] = answer;
    setClarifyingAnswers(updated);
    setClarifyingCursor(null);
    const detailProfileIdx = clarifyingQuestions.findIndex(q => q.question === DETAIL_PROFILE_QUESTION);
    if (detailProfileIdx === index) {
      setDetailProfile(answer.toLowerCase().includes("domain") ? "domain-expert" : "standard");
    }
    const taskTypeIdx = clarifyingQuestions.findIndex(q => q.question === TASK_TYPE_QUESTION);
    if (taskTypeIdx === index) {
      const lower = answer.toLowerCase();
      setTaskTypeOverride(lower.includes("deliverable") ? "deliverable" : lower.includes("decision") ? "decision" : null);
    }
    if (!updated.some(a => a === null)) {
      clarificationContextRef.current = composeClarifications(updated);
      clarificationEntriesRef.current = composeClarificationEntries(updated);
      setClarifyingQuestions(null);
      launchDiscussion();
    }
  };

  const skipRemainingClarifyingQuestions = () => {
    clarificationContextRef.current = composeClarifications(clarifyingAnswers);
    clarificationEntriesRef.current = composeClarificationEntries(clarifyingAnswers);
    setClarifyingQuestions(null);
    launchDiscussion();
  };

  const runCustomTeamExecution = async () => {
    if (!customPrompt) return;
    
    setMainGeneratedFiles([]);
    setCallCount(0);
    const initialResults: typeof customResults = {};
    customTeam.forEach(agent => {
      initialResults[agent.id] = {
        name: agent.name,
        provider: agent.provider,
        text: "",
        loading: true
      };
    });
    setCustomResults(initialResults);
    setCustomTeamLoading(true);
    logDebug("info", `Started Parallel run with ${customTeam.length} agent(s)`, `depth: ${discussionDepth}, prompt: ${customPrompt.slice(0, 200)}`);

    const knowledgeContext = buildKnowledgeContext();
    const promptSnapshot = customPrompt;
    const finalResultsAcc: ParallelTeamRun["results"] = {};

    const controller = new AbortController();
    runAbortRef.current = controller;
    const signal = controller.signal;

    const promises = mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
      try {
        const systemInstruction = `You are an AI agent named "${agent.name}". Persona: ${agent.persona}\n\n${getResourceScopeInstruction()}\n\n${getDepthInstruction()}`;
        const fullPrompt = `${knowledgeContext}\n\nUSER PROMPT:\n${getTaskWithClarifications()}`;

        let streamedSoFar = "";
        const responseText = await callAgentStreaming(agent, fullPrompt, systemInstruction, (delta) => {
          streamedSoFar += delta;
          setCustomResults(prev => ({
            ...prev,
            [agent.id]: {
              ...prev[agent.id],
              text: streamedSoFar,
              loading: false // first chunk arriving means there's live text to show instead of a spinner
            }
          }));
        }, signal);

        finalResultsAcc[agent.id] = { name: agent.name, provider: agent.provider, text: responseText };
        setCustomResults(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            text: responseText,
            loading: false
          }
        }));
      } catch (error: any) {
        const wasStopped = signal.aborted || error?.name === "AbortError" || error?.name === "CanceledError";
        const errMsg = wasStopped ? "Stopped by user." : (error.message || "Failed to execute agent.");
        if (!wasStopped) {
          console.error(`Error executing agent ${agent.name}:`, error);
          logDebug("error", `Agent "${agent.name}" (${agent.provider}) failed during Parallel run`, errMsg);
        }
        finalResultsAcc[agent.id] = { name: agent.name, provider: agent.provider, text: "", error: errMsg };
        setCustomResults(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            text: "",
            loading: false,
            error: errMsg
          }
        }));
      }
    });

    await Promise.all(promises);
    setCustomTeamLoading(false);
    runAbortRef.current = null;
    if (signal.aborted) {
      logDebug("info", "Parallel run stopped by user");
    } else {
      logDebug("info", "Parallel run completed", `${Object.values(finalResultsAcc).filter(r => r.error).length} of ${customTeam.length} agent(s) errored`);
    }

    const parallelRun: ParallelTeamRun = { id: `pteam_${Date.now()}`, timestamp: new Date().toISOString(), prompt: promptSnapshot, results: finalResultsAcc };
    setParallelTeamHistory(prev => [parallelRun, ...prev]);
    saveHistoryEntry("parallel", parallelRun);

    if (!signal.aborted) {
      const detectedKind = detectFileRequest(promptSnapshot);
      if (detectedKind) {
        const combinedText = Object.values(finalResultsAcc).map(r => `${r.name}: ${r.error ? `[error: ${r.error}]` : r.text}`).join("\n\n");
        createMainFile(detectedKind, combinedText);
      }
    }
  };

  // Calls an agent expecting a JSON reply. If the first attempt doesn't parse, makes ONE
  // automatic re-ask with an explicit "JSON only" correction before giving up — cheap
  // insurance against an otherwise-good response being ruined by stray commentary.
  const callAgentForJson = useCallback(async (agent: CustomAgent, prompt: string, systemInstruction: string, signal?: AbortSignal): Promise<any> => {
    const raw = await callAgent(agent, prompt, systemInstruction, signal);
    try {
      return extractJson(raw);
    } catch (firstError: any) {
      if (signal?.aborted) throw firstError;
      logDebug("warn", `${agent.name}'s response wasn't valid JSON — re-asking once`, firstError?.message || firstError);
      const retryInstruction = `${systemInstruction}\n\nIMPORTANT CORRECTION: Your previous reply could not be parsed as JSON. Respond with ONLY the raw JSON object — no markdown fences, no commentary before or after it.`;
      const retryRaw = await callAgent(agent, prompt, retryInstruction, signal);
      return extractJson(retryRaw); // let a second failure surface as a real error
    }
  }, [callAgent, logDebug]);

  // Converts arbitrary team output into a professionally formatted, downloadable Word /
  // Excel / PowerPoint file. An agent first restructures the content into the right shape
  // for the target format (headings/paragraphs, rows/columns, or slides/bullets); that
  // structure is then rendered into a real file by src/lib/officeFiles.ts.
  const generateOfficeFile = useCallback(async (kind: OfficeKind, sourceText: string, styleDirective?: string): Promise<GeneratedFile> => {
    // The run's own facilitator compiles its documents (customTeam[0] was a leftover from
    // before facilitator routing existed) — falling back to the roster head when there's
    // no run in play (e.g. parallel-mode results).
    const agent = getRunFacilitator(collaborativeRun);
    if (!agent) throw new Error("Add at least one agent to Team Agents before creating files.");

    // Medium-specific shaping: each container gets rules for ITS strengths — narrative
    // anatomy for docx, assertion-evidence signal for pptx, normalised analytics for xlsx —
    // instead of one text-dump instruction with the file type swapped in.
    const instructions: Record<OfficeKind, string> = {
      docx: `Convert the content below into a well-structured outline for a professional Word document. Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "title": "document title",\n  "subtitle": "optional one-line subtitle, or omit",\n  "executiveSummary": "REQUIRED whenever there are more than 3 sections: a 100-150 word summary a reader could stop after",\n  "sections": [\n    { "heading": "section heading", "level": 1, "paragraphs": ["a full paragraph of 40-120 words"], "bullets": ["short bullet point"], "quotes": [{ "text": "a direct quotation taken VERBATIM from the content", "attribution": "who said it" }], "table": { "columns": ["Col A"], "rows": [["value"]] } }\n  ]\n}\nRules: level 1 for major sections, 2-3 for subsections. Word documents are the NARRATIVE container: prefer well-written prose paragraphs; use bullets only for genuinely list-like content (never more than 3 consecutive long bullets — write prose instead). Use "quotes" only for verbatim quotations that appear word-for-word in the content. Use "table" only for genuinely 2-dimensional data. Every number and quotation must appear in the content below — do not invent, estimate, or round differently.`,
      xlsx: `Convert the content below into tabular data for a professional spreadsheet. Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "title": "spreadsheet title",\n  "sheets": [\n    { "name": "Sheet1", "columns": ["Column A", "Column B"], "rows": [["value", 123]] }\n  ]\n}\nRules: normalise the data — one fact per cell (never comma-joined lists in a cell), units in the column header not the cell, numbers as raw JSON numbers never strings. Choose columns so the table is filterable and sortable. Split unrelated data into separate sheets rather than one mixed sheet. If the content isn't naturally tabular, build a reasonable structured breakdown (e.g. topic / point / detail) rather than forcing an awkward table. Every number must appear in the content below — do not invent, estimate, or re-derive figures.`,
      pptx: `Convert the content below into a slide deck outline. Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "title": "deck title",\n  "subtitle": "optional one-line subtitle, or omit",\n  "slides": [\n    { "title": "slide title", "bullets": ["short bullet", { "text": "bullet with detail", "sub": ["supporting sub-point"] }], "notes": "speaker notes carrying the full prose the slide compresses away" }\n  ]\n}\nRules: slide titles are ASSERTIONS — full-sentence claims of at most 14 words ("Q3 holds only if the July integration lands"), never topic nouns ("Timeline"). At most 6 bullets per slide and 14 words per bullet; split across slides rather than cramming. Slides are the SIGNAL, notes are the narrative: put the detail in notes. The final slide must be titled as the decision/next-steps close. Every number must appear in the content below — do not invent.`
    };

    const styledInstruction = styleDirective ? `${instructions[kind]}\n\nSTYLE DIRECTIVE (from the user's pre-flight answers): ${styleDirective}` : instructions[kind];
    // Provenance carrying into exports (Phase 3 roadmap, round 2, item #1): a figure the
    // manager confirmed with the calculator was being marked "unverified" in the exported
    // document's own Verification Notes appendix, because the grounding check only ever
    // saw the run's outcome/reasons/tree text, never the calculator confirmations that
    // happened afterward in Team Chat. Appending them here means the SAME trusted corpus
    // backs both the live claim-check badges and file-generation verification.
    const verifiedCalcTexts = followUpMessages.filter(m => m.isVerifiedCalculation).map(m => m.text);
    const sourceWithVerifiedCalcs = verifiedCalcTexts.length > 0
      ? `${sourceText}\n\nManager-verified calculations (confirmed exact, treat as ground truth):\n${verifiedCalcTexts.join("\n")}`
      : sourceText;
    const truncatedSource = truncateText(sourceWithVerifiedCalcs, MAX_TRANSCRIPT_CHARS);
    const contentPrompt = `CONTENT TO CONVERT:\n\n${truncatedSource}`;

    // Gate 0 — schema validation with one retry: a malformed spec previously reached the
    // builders through a blind `as` cast and failed deep inside them (or worse, didn't).
    const validate = (raw: any) =>
      kind === "docx" ? validateDocSpec(raw) : kind === "xlsx" ? validateSpreadsheetSpec(raw) : validateDeckSpec(raw);

    let parsed = await callAgentForJson(agent, contentPrompt, styledInstruction);
    let result = validate(parsed);
    if (!result.ok) {
      logDebug("warn", `Generated ${kind} spec failed validation — retrying once with the errors`, result.errors.join("; "));
      parsed = await callAgentForJson(
        agent,
        contentPrompt,
        `${styledInstruction}\n\nYour previous response failed validation with these errors — fix them and respond again with ONLY the corrected raw JSON:\n${result.errors.map(e => `- ${e}`).join("\n")}`
      );
      result = validate(parsed);
      if (!result.ok) throw new Error(`Could not produce a valid ${kind} structure: ${result.errors.join("; ")}`);
    }

    // Gate 3 — deterministic grounding verification against exactly the corpus the
    // generator saw. Findings are embedded into the artifact itself so the audit trail
    // travels with the file. The admission policy is mark-not-silently-ship.
    const report = verifySpecAgainstSource(kind, result.spec as any, truncatedSource);
    const verificationNotes: string[] = [];
    if (verifiedCalcTexts.length > 0) {
      verificationNotes.push(`Manager-verified calculations included in this document: ${verifiedCalcTexts.join("; ")}`);
    }
    if (report.unverifiedNumbers.length > 0) {
      verificationNotes.push(`Figures not found in the session's source material (verify before relying on them): ${report.unverifiedNumbers.join(", ")}`);
    }
    for (const q of report.unverifiedQuotes) {
      verificationNotes.push(`Quotation could not be matched verbatim to the source: “${q.slice(0, 120)}”`);
    }
    if (verificationNotes.length > 0) {
      logDebug("warn", `Grounding check flagged ${verificationNotes.length} item(s) in the ${kind} file — noted inside the document`, verificationNotes.join(" | "));
    } else {
      logDebug("info", `Grounding check clean for the ${kind} file (all figures and quotations trace to the source)`);
    }

    if (kind === "docx") return await buildDocx(result.spec as DocSpec, verificationNotes);
    if (kind === "xlsx") return await buildXlsx(result.spec as SpreadsheetSpec, verificationNotes);
    return await buildPptx(result.spec as DeckSpec, verificationNotes);
  }, [customTeam, callAgentForJson, collaborativeRun]);

  const createMainFile = async (kind: OfficeKind, sourceText: string, styleDirective?: string) => {
    setMainFileGenerating(kind);
    try {
      const file = await generateOfficeFile(kind, sourceText, styleDirective);
      setMainGeneratedFiles(prev => [...prev, file]);
      logDebug("info", `Created ${kind} file "${file.name}"`);
    } catch (err: any) {
      logDebug("error", `Failed to create ${kind} file`, err?.message || err);
    } finally {
      setMainFileGenerating(null);
    }
  };

  // Renders the decision tree as indented text for the export document — reuses the same
  // traversal helper the tree UI itself uses.
  const treeToExportText = (nodes: DecisionNode[], parentId: string | null = null, depth = 0): string => {
    const children = getTreeChildren(nodes, parentId);
    return children.map(n => {
      const line = `${"  ".repeat(depth)}- ${n.label} (${n.probability}%)${n.reason ? ` — ${n.reason}` : ""}`;
      const childText = treeToExportText(nodes, n.id, depth + 1);
      return childText ? `${line}\n${childText}` : line;
    }).join("\n");
  };

  // Everything about a run in one document: transcript, outcome/deliverable, tree, the
  // comment thread, and revision history — previously the only export path was a single
  // output's text via "Create File," with no way to export the conversation as a whole.
  const exportFullConversation = async (run: CollaborativeRun) => {
    setIsExportingConversation(true);
    try {
      const sections: string[] = [];
      sections.push(`TASK\n${run.prompt}`);

      if (run.taskType === "deliverable" && run.deliverable) {
        sections.push(`DELIVERABLE — ${run.deliverable.title}${run.deliverable.subtitle ? `\n${run.deliverable.subtitle}` : ""}\n\n${run.deliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}`);
      } else {
        sections.push(`OUTCOME\n${run.outcome}\n\nREASONS\n${run.reasons.map(r => `- ${r}`).join("\n")}`);
        if (run.decisionTree.length > 0) sections.push(`DECISION TREE\n${treeToExportText(run.decisionTree)}`);
      }

      if (run.transcript.length > 0) {
        sections.push(`PANEL DISCUSSION\n${run.transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n")}`);
      }

      if (run.nodeComments && run.nodeComments.length > 0) {
        sections.push(`COMMENTS\n${run.nodeComments.map(c => `On "${c.nodeLabel}": ${c.text}${c.reply ? `\n  Reply (${c.replyAgentName}): ${c.reply}` : ""}`).join("\n\n")}`);
      }

      if (followUpMessages.length > 0) {
        sections.push(`TEAM CHAT\n${followUpMessages.map(m => {
          if (m.role === "user") return `You: ${m.text}`;
          if (m.individualResponses && m.individualResponses.length > 0) {
            return m.individualResponses.map(r => `${r.agentName}: ${r.message}`).join("\n\n");
          }
          return `Team: ${m.text}`;
        }).join("\n\n")}`);
      }

      if (run.history && run.history.length > 0) {
        sections.push(`REVISION HISTORY\n${run.history.map(h => `[${new Date(h.timestamp).toLocaleString()}] ${h.trigger} — prior outcome: ${h.outcome || h.deliverable?.title || "n/a"}`).join("\n")}`);
      }

      const file = await generateOfficeFile("docx", sections.join("\n\n---\n\n"));
      setMainGeneratedFiles(prev => [...prev, file]);
      logDebug("info", "Exported full conversation", file.name);
    } catch (err: any) {
      logDebug("error", "Failed to export full conversation", err?.message || err);
    } finally {
      setIsExportingConversation(false);
    }
  };

  const createFollowUpFile = async (messageId: string, kind: OfficeKind, sourceText: string) => {
    setFollowUpFileGenerating({ id: messageId, kind });
    try {
      const file = await generateOfficeFile(kind, sourceText);
      setFollowUpMessages(prev => prev.map(m => (m.id === messageId ? { ...m, generatedFile: file } : m)));
      logDebug("info", `Created ${kind} file "${file.name}"`);
    } catch (err: any) {
      logDebug("error", `Failed to create ${kind} file`, err?.message || err);
    } finally {
      setFollowUpFileGenerating(null);
    }
  };

  // Given a described decision, asks an available model to design a multi-agent roster
  // (personas, providers, models drawn only from what's actually configured) suited to
  // reaching a reliable discussion and decision on that topic. Returns a PREVIEW — nothing
  // is applied to the live roster until the user reviews it and clicks Apply.
  const suggestAgentTeam = async () => {
    const availableProviders = getAvailableProviders();
    if (!decisionGoal.trim() || availableProviders.length === 0) return;

    setSuggestingTeam(true);
    setSuggestTeamError(null);
    setSuggestTeamRationale(null);
    setSuggestedTeamPreview(null);
    setSuggestedTeamSelected({});
    setJustAppliedSuggestion(false); // clear any stale "Team applied" banner from a prior suggestion

    try {
      const plannerProviderId = (availableProviders.find(p => p.id === "gemini")?.id || availableProviders[0].id) as CustomAgent["provider"];
      const plannerModel = MODEL_OPTIONS[plannerProviderId]?.[0]?.id || "";
      const plannerAgent: CustomAgent = {
        id: "planner",
        provider: plannerProviderId,
        model: plannerModel,
        name: isProductTab ? "Product Architecture Planner" : "Team Planner",
        persona: ""
      };

      const modelListText = availableProviders
        .map(p => `${p.id}: ${(MODEL_OPTIONS[p.id as CustomAgent["provider"]] || []).map(m => m.id).join(", ")}`)
        .join("\n");

      // Factor in linked knowledge sources (using currentKnowledgeFiles to respect product scope if selected)
      const activeKnowledgeSources = isProductTab ? currentKnowledgeFiles : knowledgeFiles;
      const sourceHintsText = activeKnowledgeSources.length > 0
        ? `\n\nThe user has linked these knowledge sources, which may hint at relevant technical specifications, schemas, or requirements:\n${activeKnowledgeSources.map(f => `- ${f.name} (${SOURCE_TYPE_META[f.sourceType]?.label || f.sourceType})`).join("\n")}`
        : "";

      const activeTeamForAdd = isProductTab ? productTeam : customTeam;
      const modeInstruction = suggestTeamMode === "add"
        ? (isProductTab
            ? `\n\nThe user wants to ADD to their existing Product Specification team below, not replace it. Suggest ONLY new technical, architectural, or design specialists covering gaps in the current team — do not duplicate existing coverage, and do NOT suggest marketing or non-technical roles.\n\nEXISTING TEAM:\n${activeTeamForAdd.map(a => `- ${a.name} (${a.provider}): ${a.persona.slice(0, 150)}`).join("\n")}`
            : `\n\nThe user wants to ADD to their existing team below, not replace it. Suggest ONLY new agents that cover expertise or perspectives genuinely missing from the current roster — do not duplicate coverage that already exists.\n\nEXISTING TEAM:\n${activeTeamForAdd.map(a => `- ${a.name} (${a.provider}): ${a.persona.slice(0, 150)}`).join("\n")}`)
        : "";

      let plannerInstruction = "";
      let userPromptContent = "";

      if (isProductTab) {
        plannerInstruction = `You are a Principal Software Engineering Leader and Chief Product Architect who designs specialized multi-agent AI teams to produce an in-depth, production-ready Product Specification (PRD, Technical Architecture, UI/UX Design System, Data Schemas, API Contracts, Guardrails, and AI Coding Playbook).

Available providers and their models (you may ONLY use these, exactly as spelled):
${modelListText}

CRITICAL MANDATE — THE REQUIRED OUTPUT IS AN IN-DEPTH, PRODUCTION-READY PRODUCT SPECIFICATION:
Whatever prompt or concept the user inputs, remember that the required output of the Product panel is a concrete, comprehensive, production-ready engineering and product specification that can be fed directly into AI coding tools (Cursor, Claude Code, Google AI Studio, Lovable, v0) and human software engineering teams.

ABSOLUTE DOMAIN RESTRICTIONS & EXCLUSIONS:
1. STRICTLY FORBIDDEN ROLES (Zero non-technical / non-spec roles):
   - DO NOT suggest ANY team members who are not able to contribute to product requirements, engineering, UI/UX, schemas, and architecture.
   - Specifically: NO Marketing (e.g. CMO, Digital Marketer, Growth Hacker, Social Media, Content Marketer, SEO Specialist). Marketing is NOT relevant to authoring a product specification.
   - Also NO Sales, Business Development, Advertising, PR, Investor Pitching, Customer Support, Community Management, or HR.
   - Every single agent must be a hands-on technical or design contributor.
2. MANDATORY SPECIFICATION DISCIPLINES:
   Every suggested agent must directly author or validate core sections of the production-ready specification:
   - Agent #1 MUST ALWAYS be the Lead Product Architect / Principal PM: establishes the product vision, core user journeys, FTUX, and technical invariants.
   - System Architecture & Engineering: Principal Full-Stack Engineer / Distributed Systems Architect (specifies tech stack, directory trees, framework patterns, code guardrails, dependencies).
   - UI/UX Design Systems: UI/UX Architect / Design System Engineer (specifies screen inventory, layout anatomy, visual state matrices [empty, loading, error, success], Tailwind CSS utility tokens, responsive adaptations).
   - Data Models & API Contracts: Database Architect / API Specialist (specifies strict TypeScript types, PostgreSQL/Firestore schemas, validation constraints, REST/GraphQL endpoints).
   - QA, Reliability & AI Coding: QA Engineer / Vibe Coding Specialist (specifies edge cases, latency/offline recovery, race conditions, token limits, and prompt playbooks for AI coding agents).
   - Specialized Technical Domain Specialists ONLY if directly required by the prompt (e.g. Cryptography/Smart Contract Engineer for blockchain, WebAudio/DSP Engineer for audio apps, Shader/WebGL Architect for graphics, Spatial/GIS Engineer for mapping apps).
3. TEAM SIZING:
   - Choose a lean, high-signal team of 3 to 5 specialists. Avoid redundant or overlapping roles.
4. MODEL ASSIGNMENT:
   - Assign providers and models strictly from the available list above. Favor lightweight, fast models for focused spec roles, and heavier models for the Lead Architect or complex schema/contract roles.${sourceHintsText}${modeInstruction}

Respond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:
{
  "agents": [
    {
      "name": "short technical role name (e.g. Lead Product Architect, System Architect, UI/UX Design Architect, Data & API Engineer, QA & Vibe Coding Specialist)",
      "provider": "one of the available provider ids",
      "model": "one of that provider's model ids",
      "persona": "a detailed technical system prompt defining their exact responsibilities for authoring the production-ready specification"
    }
  ],
  "rationale": "1-2 concise sentences explaining how this technical team ensures a complete, production-ready specification without any irrelevant non-spec roles"
}`;

        userPromptContent = `APPLICATION / PRODUCT TO SPECIFY FOR PRODUCTION:\n${decisionGoal}\n\nREMEMBER: The required output is an in-depth, production-ready product specification (requirements, architecture, UI/UX design system, schemas, API contracts, edge cases). DO NOT suggest Marketing, Sales, or any non-technical roles.`;
      } else {
        plannerInstruction = `You are an expert at designing multi-agent AI panels for high-quality group decision-making.\n\nAvailable providers and their models (you may ONLY use these, exactly as spelled):\n${modelListText}\n\nGiven the decision the user needs help with, design a team of AGENTS whose SIZE matches the complexity of the decision — do not default to any particular number. Guidelines: a narrow, binary, or low-stakes call usually needs only 2-3 agents (more voices just add noise and cost); a genuinely multi-faceted, high-stakes, or cross-functional decision (e.g. spanning technical, financial, legal, and strategic dimensions) benefits from 5-7 agents so each dimension gets a dedicated, non-redundant voice. Read the decision below and choose deliberately — explain your sizing choice in the rationale. Give each agent a complementary, non-redundant persona (differing expertise, risk tolerance, priorities, or perspective), and assign each a provider and model from the list above, mixing providers where it would add useful viewpoint diversity.\n\nMODEL CHOICE: within each provider's list, models are generally ordered lighter/cheaper first where that provider actually has a meaningful lightweight option — for a provider whose lineup is all one tier (e.g. several similar-generation models with no real "light" variant), don't invent a weight difference that isn't there; just pick a sensible, current model. Where a genuine lighter option does exist, default to it for most agents — it's sufficient for most panel roles and keeps cost and latency down. Only reach for a heavier model on an agent-by-agent basis where the specific role clearly needs it: the facilitator/synthesizing role on a genuinely complex decision, or a role doing deep quantitative or legal reasoning that a lighter model would plausibly get wrong. Don't default every agent to the heaviest option "to be safe" — that's the pattern to avoid.${sourceHintsText}${modeInstruction}\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "agents": [\n    { "name": "short role name", "provider": "one of the available provider ids", "model": "one of that provider's model ids", "persona": "a detailed system-prompt-style persona and objective for this agent" }\n  ],\n  "rationale": "1-3 sentences explaining why this team composition AND size should produce a reliable decision"\n}`;

        userPromptContent = `DECISION TO BE MADE:\n${decisionGoal}`;
      }

      const parsed = await callAgentForJson(plannerAgent, userPromptContent, plannerInstruction);

      let suggested: CustomAgent[] = (Array.isArray(parsed.agents) ? parsed.agents : [])
        .filter((a: any) => availableProviders.some(p => p.id === a.provider))
        .map((a: any, idx: number) => {
          const provider = a.provider as CustomAgent["provider"];
          const validModels = (MODEL_OPTIONS[provider] || []).map(m => m.id);
          const model = validModels.includes(a.model) ? a.model : (validModels[0] || "");
          return {
            id: `agent_${Date.now()}_${idx}`,
            provider,
            model,
            name: a.name || `Agent ${idx + 1}`,
            persona: a.persona || "You are a helpful AI assistant."
          };
        });

      // Defensive filtering for Product Tab: strictly reject any marketing or non-technical roles
      if (isProductTab) {
        const isDisallowedNonSpecRole = (name: string, persona: string) => {
          const combined = `${name} ${persona}`.toLowerCase();
          return /\b(marketing|marketer|growth hacker|sales|advertis|social media|pr specialist|public relations|copywriter for ads|seo specialist|business development|lead generation|customer support|community manager)\b/i.test(combined);
        };

        suggested = suggested.filter(a => !isDisallowedNonSpecRole(a.name, a.persona));

        // Ensure Agent #1 is clearly designated as the Lead Architect if missing
        if (suggested.length > 0 && !suggested[0].name.toLowerCase().includes("lead") && !suggested[0].name.toLowerCase().includes("architect") && !suggested[0].name.toLowerCase().includes("product")) {
          suggested[0].name = `Lead ${suggested[0].name}`;
        }

        // If filtering stripped too many agents, fallback to default technical specialist archetypes
        if (suggested.length === 0) {
          const defaultProvider = plannerProviderId;
          const defaultModel = plannerModel;
          suggested = [
            {
              id: `agent_${Date.now()}_0`,
              name: "Lead Product Architect",
              provider: defaultProvider,
              model: defaultModel,
              persona: "You are the Lead Product Architect. You formulate the core product vision, user journeys, FTUX, feature boundaries, and technical invariants for the production specification."
            },
            {
              id: `agent_${Date.now()}_1`,
              name: "System Architect",
              provider: defaultProvider,
              model: defaultModel,
              persona: "You are the Principal System Architect. You specify the technology stack, modular directory trees, TypeScript patterns, and architectural guardrails for production implementation."
            },
            {
              id: `agent_${Date.now()}_2`,
              name: "UI/UX Design Architect",
              provider: defaultProvider,
              model: defaultModel,
              persona: "You are the Design System Architect. You specify screen inventories, visual layout anatomies, complete state matrices (empty, loading, error, success), and Tailwind tokens."
            },
            {
              id: `agent_${Date.now()}_3`,
              name: "Data & API Architect",
              provider: defaultProvider,
              model: defaultModel,
              persona: "You are the Database & API Architect. You define strict TypeScript types, persistent schemas, validation rules, and REST/GraphQL endpoint contracts."
            },
            {
              id: `agent_${Date.now()}_4`,
              name: "QA & Vibe Coding Specialist",
              provider: defaultProvider,
              model: defaultModel,
              persona: "You are the QA and AI Coding Specialist. You specify edge cases, race conditions, error recovery, and sequential prompt playbooks for AI coding tools."
            }
          ];
        }
      }

      if (suggested.length === 0) {
        throw new Error("The planner didn't return a usable team. Try rephrasing the decision.");
      }

      setSuggestedTeamPreview(suggested);
      setSuggestedTeamSelected(Object.fromEntries(suggested.map(a => [a.id, true])));
      setSuggestTeamRationale(typeof parsed.rationale === "string" ? parsed.rationale : null);
      logDebug("info", `Suggested a ${suggested.length}-agent ${isProductTab ? "product spec" : "decision"} team for review`, decisionGoal.slice(0, 200));
    } catch (error: any) {
      console.error("Error suggesting agent team:", error);
      logDebug("error", "Failed to suggest an agent team", error?.message || error);
      setSuggestTeamError(error.message || "Failed to suggest a team setup.");
    } finally {
      setSuggestingTeam(false);
    }
  };

  // Commits the selected agents from the preview — replacing or adding to the current
  // roster depending on the chosen mode — and offers to save the result as a named team.
  const applySuggestedTeam = () => {
    if (!suggestedTeamPreview) return;
    const selected = suggestedTeamPreview.filter(a => suggestedTeamSelected[a.id]);
    if (selected.length === 0) return;

    if (isProductTab) {
      const updated = suggestTeamMode === "add" ? [...productTeam, ...selected] : selected;
      setProductTeam(updated);
      saveProductTeamToCloud(updated);
      logDebug("info", `Applied ${selected.length} suggested product specialist(s)`, suggestTeamMode === "add" ? "added to product team" : "replaced product team");
    } else {
      const updated = suggestTeamMode === "add" ? [...customTeam, ...selected] : selected;
      setCustomTeam(updated);
      saveCustomTeamAndFiles(updated, knowledgeFiles);
      logDebug("info", `Applied ${selected.length} suggested agent(s)`, suggestTeamMode === "add" ? "added to existing team" : "replaced current team");
    }

    setSuggestedTeamPreview(null);
    setSuggestedTeamSelected({});
    setJustAppliedSuggestion(true);
  };

  const discardSuggestedTeam = () => {
    setSuggestedTeamPreview(null);
    setSuggestedTeamSelected({});
    setSuggestTeamRationale(null);
  };

  // Runs a full collaborative session: each agent states its position, then goes through one or
  // more rounds where agents can question, rebut, or validate each other's points, then a
  // facilitator agent synthesizes a single defined outcome with reasoning and a decision tree.
  // Runs one discussion round across all agents, tolerating individual failures: if an
  // agent errors (rate limit, provider outage), the round continues with the rest and the
  // failed agent's turn is marked unavailable, instead of the whole discussion dying.
  // ---- Team retro memory: shared working notes that persist across sessions ----
  // Elite teams differ from talented strangers by what they remember about working
  // together. After each completed run the facilitator distils up to 3 short notes on HOW
  // the team worked (recurring assumptions, blind spots, what the manager corrected); a
  // rolling window of the most recent 5 is injected into the next session's opening round.
  // Keyed by a fingerprint of the roster so the memory follows the team, not the session.
  const teamFingerprint = (agents: CustomAgent[]) =>
    agents.map(a => a.name.trim().toLowerCase()).sort().join("|").replace(/[^a-z0-9|]/g, "").slice(0, 180) || "team";

  const loadTeamMemory = async (agents: CustomAgent[]): Promise<string[]> => {
    if (!user) return [];
    try {
      const snap = await getDoc(doc(db, "users", user.uid, "teamMemory", teamFingerprint(agents)));
      const notes = snap.exists() ? snap.data()?.notes : null;
      return Array.isArray(notes) ? notes.filter((n: any) => typeof n === "string").slice(-5) : [];
    } catch (err: any) {
      logDebug("warn", "Could not load team working notes — starting without them", err?.message || err);
      return [];
    }
  };

  const updateTeamRetroMemory = async (run: CollaborativeRun, facilitatorAgent: CustomAgent, priorNotes: string[]) => {
    if (!user) return;
    try {
      const transcriptText = truncateText(run.transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n"), 12000);
      const parsed = await callAgentForJson(
        facilitatorAgent,
        `TASK THE TEAM JUST COMPLETED:\n${run.prompt}\n\nDISCUSSION:\n${transcriptText}\n\nOUTCOME:\n${run.outcome}`,
        `You just facilitated this team session. In at most 3 short bullets, note anything about HOW this team works that future sessions should know — recurring assumptions, blind spots, what the manager pushed back on, who reliably covers what. Notes must be about the team's working patterns, not this task's content. If nothing is genuinely worth remembering, return an empty list.\n\nRespond with ONLY raw JSON: { "notes": ["...", "..."] }`
      );
      const fresh = (Array.isArray(parsed.notes) ? parsed.notes : []).filter((n: any) => typeof n === "string" && n.trim()).slice(0, 3);
      if (fresh.length === 0) return;
      const rolling = [...priorNotes, ...fresh].slice(-5);
      await setDoc(doc(db, "users", user.uid, "teamMemory", teamFingerprint(customTeam)), {
        notes: rolling,
        updatedAt: serverTimestamp()
      });
      logDebug("info", `Team working notes updated (${fresh.length} new, ${rolling.length} kept)`, fresh.join(" · "));
    } catch (err: any) {
      logDebug("warn", "Retro-memory update failed — sessions continue without it", err?.message || err);
    }
  };

  // The facilitator for post-run tasks (gatekeeper evaluations, tree restructures,
  // follow-up synthesis) is whoever facilitated the run itself — falling back to the first
  // roster member for runs recorded before facilitator attribution existed.
  const getRunFacilitator = (run?: CollaborativeRun | null): CustomAgent =>
    (run?.facilitatorAgentName && customTeam.find(a => a.name === run.facilitatorAgentName)) || customTeam[0];

  const settleRound = useCallback(async (
    promises: Promise<CollaborativeTranscriptEntry>[],
    agentsInRound: CustomAgent[],
    roundLabel: string,
    signal?: AbortSignal
  ): Promise<CollaborativeTranscriptEntry[]> => {
    const roundStartedAt = Date.now();
    const settled = await Promise.allSettled(promises);
    if (signal?.aborted) {
      throw new DOMException("Discussion stopped by user.", "AbortError");
    }
    const entries: CollaborativeTranscriptEntry[] = [];
    const failures: { agent: string; provider: string; reason: string }[] = [];
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        entries.push(result.value);
      } else {
        const agent = agentsInRound[i];
        const reason = result.reason?.message || String(result.reason);
        failures.push({ agent: agent.name, provider: agent.provider, reason });
        logDebug("error", `Agent "${agent.name}" (${agent.provider}) failed during ${roundLabel}`, reason);
        entries.push({
          agentId: agent.id,
          agentName: `${agent.name} (unavailable this round)`,
          provider: agent.provider,
          message: `[This agent could not respond this round: ${reason}]`
        });
      }
    });
    const elapsedS = ((Date.now() - roundStartedAt) / 1000).toFixed(1);
    if (entries.every(e => e.agentName.includes("(unavailable this round)"))) {
      // One combined summary line — every agent's provider, name, and failure reason,
      // plus how long the round ran before giving up — rather than only the per-agent
      // lines above, so this single entry is enough to diagnose the round without
      // scrolling back through individual failures.
      const summary = failures.map(f => `${f.agent} (${f.provider}): ${f.reason}`).join(" | ");
      logDebug("error", `Every agent failed during ${roundLabel} — check API keys and the debug panel for details.`, `${failures.length} agent(s), ${elapsedS}s elapsed. ${summary}`);
      throw new Error(`Every agent failed during ${roundLabel} — check API keys and the debug panel for details.`);
    }
    if (failures.length > 0) {
      logDebug("warn", `${roundLabel} completed with ${failures.length} of ${agentsInRound.length} agent(s) unavailable`, `${elapsedS}s elapsed. ${failures.map(f => `${f.agent}: ${f.reason}`).join(" | ")}`);
    }
    return entries;
  }, [logDebug]);


  // Finding 1 of the latency review: previously every validation round re-sent the ENTIRE
  // raw transcript to every agent, growing every round with no compaction — round 4 of an
  // Extended discussion could be carrying 3+ full rounds a Fast discussion never has to.
  // This is the fix: fold whatever round is about to become "old" into a single rolling
  // summary via ONE small call, so round-to-round agent prompts stay
  // [compact summary of everything older] + [most recent round, verbatim] instead of
  // [everything, verbatim, forever]. The most recent round is what agents are actually
  // rebutting, so it's the one thing that must never be summarized — only genuinely older
  // material gets compacted. The final synthesis call is entirely unaffected by this: it
  // reads the raw `transcript` array directly, never these compacted strings, so full
  // fidelity is preserved exactly where it matters most.
  const compactOlderRounds = useCallback(async (
    existingSummary: string,
    roundToFold: string,
    facilitator: CustomAgent,
    task: string,
    signal?: AbortSignal
  ): Promise<string> => {
    const instruction = `You are compactly summarizing a multi-agent panel discussion so far, for internal use feeding the NEXT round of debate — not a final summary for the manager. Capture: each panelist's current position, any position CHANGES from earlier in the discussion, resolved points (briefly), and unresolved disagreements in enough detail that a panelist could still rebut them specifically by name and claim. Be concise — this is working memory for the next round, not a transcript. Do not lose specific claims, figures, or named disagreements just to save space; do drop redundant restatement and resolved side-points.`;
    const prompt = existingSummary
      ? `TASK:\n${task}\n\nEXISTING SUMMARY OF EARLIER ROUNDS:\n${existingSummary}\n\nNEW ROUND TO FOLD IN:\n${roundToFold}\n\nProduce ONE updated summary covering everything from both, in the same compact style — not two summaries concatenated back to back.`
      : `TASK:\n${task}\n\nROUND TO SUMMARIZE:\n${roundToFold}\n\nProduce a compact summary in the style described.`;
    return await callAgent(facilitator, prompt, instruction, signal);
  }, [callAgent]);

  // Called when the user clicks the "Force this branch" control on a decision tree node.
  // Builds a plain-language constraint description and asks for confirmation before
  // triggering a full re-discussion (the whole panel re-runs under the new constraint).
  // Captures the current state of a run immediately before a pivot changes it, so the prior
  // reasoning isn't simply lost once Force/Promote/Discuss/a Chat revision overwrites it.
  const snapshotCurrentRun = (run: CollaborativeRun, trigger: string): RunRevisionSnapshot => ({
    timestamp: new Date().toISOString(),
    trigger,
    outcome: run.outcome,
    reasons: run.reasons,
    decisionTree: run.decisionTree,
    deliverable: run.deliverable
  });

  // Opens the unified chat drawer — optionally pinned to a specific node, when triggered from
  // "Let's discuss this," so the exchange stays visibly anchored to what it's about.
  const openChatDrawer = (pinnedNode?: PinnedNodeContext) => {
    setChatDrawerPinnedNode(pinnedNode || null);
    setIsChatDrawerOpen(true);
  };

  // Agree is the effective stance for anything the manager hasn't touched this session — but
  // if it was already responded to in a prior visit, that persisted response is what should
  // show, not a reset back to agree.
  const getConsiderationDraft = (consideration: Consideration) => {
    if (considerationDraftResponses[consideration.id]) return considerationDraftResponses[consideration.id];
    if (consideration.managerResponse) {
      // Runs persisted before the alternative/custom scheme stored "disagree"/"uncertain" —
      // read them as custom responses so the note (their reasoning) stays front and centre.
      const legacy = consideration.managerResponse.stance === "disagree" || consideration.managerResponse.stance === "uncertain";
      return {
        stance: legacy ? ("custom" as const) : consideration.managerResponse.stance,
        chosenAlternative: consideration.managerResponse.chosenAlternative,
        note: consideration.managerResponse.note || (legacy ? `(${consideration.managerResponse.stance})` : "")
      };
    }
    return { stance: "agree" as const, chosenAlternative: undefined, note: "" };
  };

  // Agree is the default; picking a panel-offered alternative records which one; "custom"
  // opens the free-text response. Selecting the already-selected alternative toggles back
  // to agree so a stray click is always reversible.
  const setConsiderationResponse = (considerationId: string, stance: "agree" | "alternative" | "custom", chosenAlternative?: string) => {
    setConsiderationDraftResponses(prev => {
      const current = prev[considerationId];
      if (stance === "alternative" && current?.stance === "alternative" && current.chosenAlternative === chosenAlternative) {
        return { ...prev, [considerationId]: { stance: "agree", chosenAlternative: undefined, note: current.note || "" } };
      }
      return { ...prev, [considerationId]: { stance, chosenAlternative: stance === "alternative" ? chosenAlternative : undefined, note: current?.note || "" } };
    });
  };

  const setConsiderationNote = (considerationId: string, note: string) => {
    setConsiderationDraftResponses(prev => ({ ...prev, [considerationId]: { stance: prev[considerationId]?.stance || "custom", chosenAlternative: prev[considerationId]?.chosenAlternative, note } }));
  };

  // Records every consideration's current stance onto the run — this is the "record," not the
  // "act on it," step. Nothing is sent to the team here; that's a separate, explicit action
  // (askTeamToReconsiderConsiderations) so recording a disagreement never silently triggers
  // work the manager didn't ask for.
  const submitConsiderationResponses = (): CollaborativeRun | undefined => {
    if (!collaborativeRun?.considerations) return undefined;
    const updated = collaborativeRun.considerations.map(c => {
      const draft = getConsiderationDraft(c);
      return { ...c, managerResponse: { stance: draft.stance, chosenAlternative: draft.chosenAlternative, note: draft.note.trim() || undefined } };
    });
    const updatedRun: CollaborativeRun = { ...collaborativeRun, considerations: updated };
    setCollaborativeRun(updatedRun);
    setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
    saveHistoryEntry("collaborative", updatedRun);
    const disputedCount = updated.filter(c => c.managerResponse?.stance !== "agree").length;
    logDebug("info", "Recorded manager responses to considerations", `${updated.length} total, ${disputedCount} disputed/uncertain`);
    return updatedRun;
  };

  // The explicit, separate step that actually asks the team to act on disputed considerations
  // — reuses evaluateProposedChanges (the same mechanism sendFollowUp/submitCommentBatch use)
  // so the result lands in the drawer as a normal Gatekeeper card. Nothing new to build for
  // the "commit" side: disputing a premise just becomes a new source feeding the same
  // propose-then-approve mechanism already in place.
  const askTeamToReconsiderConsiderations = async () => {
    if (!collaborativeRun?.considerations) return;
    // Computed from the current draft state directly, not from what's already persisted on
    // the run — setCollaborativeRun is async, so a just-prior submitConsiderationResponses()
    // call in the same handler wouldn't be reflected here yet if this read from the run itself.
    const disputed = collaborativeRun.considerations.filter(c => getConsiderationDraft(c).stance !== "agree");
    if (disputed.length === 0) return;

    // Persist every current stance first, so the record and the request sent to the team
    // always agree with each other regardless of whether "Submit Responses" was clicked first.
    // Its return value (not the collaborativeRun closure, which setCollaborativeRun hasn't
    // updated yet at this point in the same synchronous call) is what every save below is
    // based on — using the stale closure here would silently revert the considerations
    // update the moment this function's own saves land.
    const runAfterSubmit = submitConsiderationResponses() || collaborativeRun;

    setIsAskingTeamToReconsider(true);
    openChatDrawer();
    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const signal = controller.signal;

    const summary = disputed.map(c => {
      const draft = getConsiderationDraft(c);
      const response = draft.stance === "alternative" && draft.chosenAlternative
        ? `manager instead takes the position: "${draft.chosenAlternative}"`
        : `manager's own response: ${draft.note || "(disputed, no note given)"}`;
      return `- "${c.text}" (${c.category}) — ${response}${draft.stance === "alternative" && draft.note ? ` (note: ${draft.note})` : ""}`;
    }).join("\n");
    const consolidatedText = `Reconsidering ${disputed.length} disputed consideration${disputed.length === 1 ? "" : "s"}:\n${summary}`;

    // Checkpoint-on-start: previously nothing about this ask was saved anywhere until the
    // whole exchange finished — and unlike sendFollowUp/sendQuickResponse,
    // isAskingTeamToReconsider isn't in flushChatToRun's automatic-flush dependency array,
    // so even a SUCCESSFUL completion wasn't guaranteed to be saved promptly; it just sat
    // in local state until something unrelated happened to trigger a flush. A user-facing
    // message representing the ask itself didn't exist before either — this both closes
    // the gap and makes the Team Chat log show what was actually asked, not just the
    // eventual answer. Saved explicitly (not via flushChatToRun) so it's built from
    // runAfterSubmit, not the stale collaborativeRun closure.
    //
    // Deliberately declared here, OUTSIDE the try block below (not as a const inside it) —
    // a const declared inside a try{} is scoped to that block alone and is NOT visible from
    // its own catch{} block, the same trap fixed for `transcript` in runCollaborativeSession.
    // The catch block below needs messagesWithAsk/runWithAsk to save the error message
    // against the right base run.
    const userMessage: FollowUpMessage = { id: newMessageId(), role: "user", text: consolidatedText };
    setFollowUpMessages(prev => [...prev, userMessage]);
    const messagesWithAsk = [...followUpMessages, userMessage];
    const runWithAsk: CollaborativeRun = { ...runAfterSubmit, chatMessages: messagesWithAsk };
    setCollaborativeHistory(prev => prev.map(r => (r.id === runWithAsk.id ? runWithAsk : r)));
    saveHistoryEntry("collaborative", runWithAsk);

    try {
      const evalResult = await evaluateProposedChanges(
        runAfterSubmit,
        `The manager reviewed the panel's considerations and pushed back on the following:\n${summary}`,
        "The team will reconsider the affected decisions in light of the manager's pushback.",
        signal
      );

      const teamMessage: FollowUpMessage = {
        id: newMessageId(),
        role: "team",
        text: evalResult.changes.length > 0
          ? `Reconsidered ${disputed.length} disputed consideration${disputed.length === 1 ? "" : "s"} — see the proposed changes below.`
          : "We've reconsidered your pushback on these points, but don't think it changes the recommendation — happy to discuss further if you want to push on any of them specifically.",
        proposedChanges: evalResult.changes.length > 0 ? evalResult.changes : undefined,
        status: evalResult.status,
        statusNote: evalResult.statusNote
      };
      setFollowUpMessages(prev => [...prev, teamMessage]);
      const runWithReply: CollaborativeRun = { ...runWithAsk, chatMessages: [...messagesWithAsk, teamMessage] };
      setCollaborativeHistory(prev => prev.map(r => (r.id === runWithReply.id ? runWithReply : r)));
      saveHistoryEntry("collaborative", runWithReply);
      logDebug("info", "Team reconsidered disputed considerations", `${disputed.length} disputed, ${evalResult.changes.length} proposed change(s)`);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        logDebug("error", "Failed to ask the team to reconsider disputed considerations", err?.message || err);
        const errorMessage: FollowUpMessage = { id: newMessageId(), role: "team", text: `Sorry, something went wrong reconsidering these: ${err.message || "please try again."}` };
        setFollowUpMessages(prev => [...prev, errorMessage]);
        const runWithError: CollaborativeRun = { ...runWithAsk, chatMessages: [...messagesWithAsk, errorMessage] };
        setCollaborativeHistory(prev => prev.map(r => (r.id === runWithError.id ? runWithError : r)));
        saveHistoryEntry("collaborative", runWithError);
      }
    } finally {
      setIsAskingTeamToReconsider(false);
      followUpAbortRef.current = null;
    }
  };

  // The heavier escalation path: instead of a single gatekeeper pass, re-run the ENTIRE
  // team discussion with the manager's consideration responses injected as amended premises.
  // Deliberately batch-and-explicit: responses accumulate silently as drafts; nothing runs
  // until the manager presses the button, however many considerations changed. The previous
  // run is preserved automatically via snapshotCurrentRun in the new run's history, so this
  // is always a step forward, never an overwrite.
  const rerunWithConsiderationResponses = () => {
    if (!collaborativeRun?.considerations) return;
    const changed = collaborativeRun.considerations.filter(c => getConsiderationDraft(c).stance !== "agree");
    if (changed.length === 0) return;
    submitConsiderationResponses();
    const items = changed.map(c => {
      const draft = getConsiderationDraft(c);
      const response = draft.stance === "alternative" && draft.chosenAlternative
        ? `the manager instead takes the position: "${draft.chosenAlternative}"`
        : `the manager's own response: "${draft.note || "disputed without elaboration"}"`;
      return {
        label: `Reconsidered: "${c.text}"`,
        text: `Panel's original ${c.category} → ${response}${draft.stance === "alternative" && draft.note ? ` (manager's note: ${draft.note})` : ""}`,
        sourceType: "considerations" as const
      };
    });
    const amendments = items.map(item => `- ${item.label} → ${item.text}`).join("\n");
    logDebug("info", `Re-running the full discussion with ${changed.length} amended premise(s)`, amendments.slice(0, 300));
    runCollaborativeSession(null, null, amendments, null, null, null, items);
  };

  // Node comments: "Add Comment" saves a draft locally; nothing is sent to the team until the
  // whole batch of drafts is submitted together via "Discuss This Batch." Extracted into its
  // own hook — see src/hooks/useNodeComments.ts.
  const {
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
  } = useNodeComments({ collaborativeRun, setCollaborativeRun, setCollaborativeHistory, saveHistoryEntry, logDebug });

  const requestForceBranch = useCallback((node: DecisionNode) => {
    if (!collaborativeRun) return;
    const parent = collaborativeRun.decisionTree.find(n => n.id === node.parentId);
    const parentLabel = parent ? parent.label : "the overall decision";
    const constraint = `The decision at "${parentLabel}" must resolve to: "${node.label}".`;
    setPendingTreeAction({ type: "force", constraint, label: node.label });
  }, [collaborativeRun]);

  // Called when the user clicks "Promote to top-level decision" on a decision tree node.
  const requestPromoteNode = useCallback((node: DecisionNode) => {
    if (!collaborativeRun) return;
    setPendingTreeAction({ type: "promote", label: node.label, node });
  }, [collaborativeRun]);

  // Shared engine for the "lightweight restructure" family (Promote, Move): a single
  // facilitator call, full tree in and out, no team re-discussion — this is a structural
  // edit the manager has already decided on, not something to re-litigate. A full
  // re-discussion was considered and rejected: re-arguing the whole tree risks reshaping
  // or merging axes nowhere near the branch involved. Promote and Move were previously two
  // near-identical copies of this procedure; only the instruction, labels, and busy flag
  // genuinely differed, so those are the parameters.
  const restructureTreeViaFacilitator = async (opts: {
    instruction: string;
    snapshotLabel: string;
    successLog: string;
    failureLog: string;
    setBusy: (v: boolean) => void;
    // Optional deterministic post-processing of the facilitator's returned tree — e.g.
    // inserting a marker node — kept out of the LLM call entirely (cheaper and more
    // reliable than asking the model to also manage a bookkeeping node it didn't create).
    transformTree?: (tree: DecisionNode[]) => DecisionNode[];
  }) => {
    if (!collaborativeRun) return;
    opts.setBusy(true);
    try {
      const knowledgeContext = buildKnowledgeContext();
      const prompt = `${knowledgeContext}\n\nORIGINAL TASK:\n${collaborativeRun.prompt}\n\nCURRENT OUTCOME:\n${collaborativeRun.outcome}\n\nCURRENT REASONS:\n${collaborativeRun.reasons.join("\n")}\n\nCURRENT DECISION TREE (JSON):\n${truncateText(JSON.stringify(collaborativeRun.decisionTree), 20000)}`;

      const facilitator = getRunFacilitator(collaborativeRun);
      // Validated at the parse boundary — a malformed tree (missing ids/labels) fails here
      // with a message naming what arrived, instead of rendering incorrectly downstream.
      const validated = validateTreeRestructureResponse(await callAgentForJson(facilitator, prompt, opts.instruction));
      const finalTree = opts.transformTree ? opts.transformTree(validated.decisionTree as unknown as DecisionNode[]) : (validated.decisionTree as unknown as DecisionNode[]);

      const updatedRun: CollaborativeRun = {
        ...collaborativeRun,
        outcome: validated.outcome ?? collaborativeRun.outcome,
        reasons: validated.reasons ?? collaborativeRun.reasons,
        decisionTree: finalTree,
        history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, opts.snapshotLabel)]
      };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      logDebug("info", opts.successLog, "Tree restructured without a full re-discussion.");
    } catch (err: any) {
      logDebug("error", opts.failureLog, err?.message || err);
    } finally {
      opts.setBusy(false);
    }
  };

  // Restructures the tree to treat a node as an independent, top-level decision rather than
  // a sub-branch — a structural/emphasis change rather than re-litigating the content of
  // the decision itself.
  const promoteNodeToTopLevel = async (node: DecisionNode) => {
    if (!collaborativeRun) return;
    const parent = collaborativeRun.decisionTree.find(n => n.id === node.parentId);
    const parentLabel = parent ? parent.label : "the overall decision";
    const resourceScope = getResourceScopeInstruction();

    await restructureTreeViaFacilitator({
      instruction: `You are the neutral facilitator of a multi-agent panel, revisiting a decision tree you previously produced. ${resourceScope}\n\nThe user believes the decision "${node.label}" — currently nested under "${parentLabel}" — deserves to be treated as an independent, top-level decision in its own right, not a sub-branch dependent on "${parentLabel}".\n\nRestructure the tree so this decision becomes its own top-level branch (parentId: null), recompute probabilities and reasoning at the affected branch points so they remain internally consistent (siblings still sum to ~100), and update the "reason" text on any node whose context changed as a result. Only change the recommended outcome if this restructuring genuinely reveals it should change — don't change it just because you were asked to restructure.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "outcome": "...",\n  "reasons": ["...", "..."],\n  "decisionTree": [ ...the complete updated tree, full depth, unique ids... ]\n}`,
      snapshotLabel: `Promoted "${node.label}" to top-level`,
      successLog: `Promoted "${node.label}" to a top-level decision`,
      failureLog: `Failed to promote "${node.label}" to a top-level decision`,
      setBusy: (v: boolean) => setNodeOpInFlight(v ? { type: "promote", label: node.label } : null)
    });
  };

  const moveNodeUnderParent = async (node: DecisionNode, newParent: DecisionNode) => {
    if (!collaborativeRun) return;
    const oldParent = collaborativeRun.decisionTree.find(n => n.id === node.parentId);
    const oldParentLabel = oldParent ? oldParent.label : "the top level";
    const resourceScope = getResourceScopeInstruction();

    // A move across independent axes ("tabs" in Flow view) leaves the branch's original tab
    // with nothing where it used to be — from that tab's perspective the branch just vanished,
    // even though it's really a continuation, not a deletion. Detected against the tree as it
    // stood BEFORE the move, so this only fires for a genuine cross-tab move, never an
    // ordinary same-tab reparent (where nothing was lost from view in the first place).
    const sourceRoot = getRootAncestor(collaborativeRun.decisionTree, node.id);
    const destRoot = getRootAncestor(collaborativeRun.decisionTree, newParent.id);
    const isCrossTabMove = !!sourceRoot && !!destRoot && sourceRoot.id !== destRoot.id;
    const originalParentId = node.parentId;

    await restructureTreeViaFacilitator({
      instruction: `You are the neutral facilitator of a multi-agent panel, revisiting a decision tree you previously produced. ${resourceScope}\n\nThe user has decided that "${node.label}" — currently nested under "${oldParentLabel}" — belongs instead as a sub-decision under "${newParent.label}", together with its own existing sub-branches (move the whole subtree as-is, don't discard or rewrite what's under it unless internal consistency genuinely requires a small wording fix).\n\nRestructure the tree so "${node.label}" (and everything currently beneath it) becomes a child of "${newParent.label}". Recompute probabilities among "${newParent.label}"'s children so siblings sum to ~100 again, and set "isSelected" on the moved branch consistent with whether "${newParent.label}" itself is on the selected path — a moved branch must never appear as a live, selected chain underneath a branch that isn't itself selected. Update "reason" text only on nodes whose surrounding context genuinely changed as a result of the move. Do not otherwise alter the tree, wording, or any branch unrelated to this move. Only change the recommended outcome if this restructuring genuinely reveals it should — don't change it just because you were asked to restructure.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "outcome": "...",\n  "reasons": ["...", "..."],\n  "decisionTree": [ ...the complete updated tree, full depth, unique ids... ]\n}`,
      snapshotLabel: `Moved "${node.label}" under "${newParent.label}"`,
      successLog: `Moved "${node.label}" under "${newParent.label}"`,
      failureLog: `Failed to move "${node.label}" under "${newParent.label}"`,
      setBusy: (v: boolean) => setNodeOpInFlight(v ? { type: "move", label: node.label, destination: newParent.label } : null),
      // Inserted deterministically, never by the model — it's pure bookkeeping the facilitator
      // has no reason to reconstruct correctly (or be asked to spend tokens on). Guarded on
      // originalParentId !== null: a root axis has no "old sibling slot" to leave a marker in.
      transformTree: isCrossTabMove && destRoot && originalParentId !== null
        ? (tree) => [
            ...tree,
            {
              id: `movedmarker_${node.id}_${Date.now()}`,
              parentId: originalParentId,
              label: `→ Moved to "${newParent.label}"`,
              probability: 0,
              isSelected: false,
              reason: `This branch moved to the "${destRoot.label}" tab, under "${newParent.label}" — see that tab for its current position and reasoning.`,
              movedTo: { nodeId: node.id, rootId: destRoot.id, label: newParent.label, rootLabel: destRoot.label }
            }
          ]
        : undefined
    });
  };

  // Deletes a node and everything beneath it — no confirmation dialog, since the general
  // Undo control (undoLastTreeChange) already covers this: a snapshot goes onto history
  // before the removal, same as every other tree-changing operation. If the deleted subtree
  // included the currently-selected node, selection simply disappears rather than
  // auto-falling to a sibling — the team should re-pick, not have the app guess for them.
  // Deleting a root node deletes that whole tab; guarded so the last remaining tab can't be
  // removed, since a run with zero tabs isn't a state worth allowing.
  const deleteNode = useCallback((node: DecisionNode) => {
    if (!collaborativeRun) return;
    const isRoot = node.parentId === null;
    if (isRoot) {
      const rootCount = getTreeChildren(collaborativeRun.decisionTree, null).length;
      if (rootCount <= 1) {
        logDebug("warn", "Can't delete the only remaining tab", `"${node.label}" is the last tab in this run.`);
        return;
      }
    }
    const toRemove = new Set(flattenSubtree(collaborativeRun.decisionTree, node.id).map(x => x.node.id));
    const updatedTree = collaborativeRun.decisionTree.filter(n => !toRemove.has(n.id));
    const updatedRun: CollaborativeRun = {
      ...collaborativeRun,
      decisionTree: updatedTree,
      history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, `Deleted "${node.label}"${isRoot ? " (tab)" : ""}`)]
    };
    setCollaborativeRun(updatedRun);
    setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
    saveHistoryEntry("collaborative", updatedRun);
    logDebug("info", `Deleted "${node.label}"${isRoot ? " and its tab" : ""}`, `${toRemove.size} node(s) removed.`);
  }, [collaborativeRun, logDebug, saveHistoryEntry]);

  const requestModifyDecision = useCallback((node: DecisionNode) => {
    setPendingModifyChoiceNode(node);
  }, []);

  const requestAddOutcome = useCallback((node: DecisionNode) => {
    setAddOutcomeDraftText("");
    setAddOutcomeMode("quick");
    setPendingAddOutcomeNode(node);
  }, []);

  // "Add a new outcome": the manager's OWN alternative, not something the team proposed —
  // different from Expand Scope, which only elaborates on what's already there. One
  // facilitator call builds the new branch out (with its own sub-nodes if the idea genuinely
  // has distinct parts) AND makes an honest comparative call against the existing sibling(s)
  // shown as read-only context. Selection reconciliation happens here in code, not by trusting
  // the model to echo the tree back correctly: existing siblings are never included in what
  // the model returns at all, and the only field ever touched on them afterward is isSelected.
  const submitAddOutcome = async () => {
    if (!pendingAddOutcomeNode || !collaborativeRun || !addOutcomeDraftText.trim()) return;
    const parent = pendingAddOutcomeNode;
    const existingSiblings = getTreeChildren(collaborativeRun.decisionTree, parent.id);
    const parentIsSelected = parent.isSelected === true;
    const draftText = addOutcomeDraftText.trim();
    const runFullDebate = addOutcomeMode === "full" && customTeam.length > 0;
    setPendingAddOutcomeNode(null);
    setNodeOpInFlight({ type: "addOutcome", label: parent.label });
    const controller = new AbortController();
    runAbortRef.current = controller;
    const signal = controller.signal;
    try {
      const facilitator = getRunFacilitator(collaborativeRun);
      const resourceScope = getResourceScopeInstruction();
      const depthInstruction = getDepthInstruction();
      const knowledgeContext = buildKnowledgeContext();
      const siblingsBlock = existingSiblings.length > 0
        ? `\n\nEXISTING SIBLING OPTION(S) UNDER "${parent.label}" (context only, so you can fairly judge whether the manager's new idea beats them — you must NOT rewrite, rename, or re-justify any of these; they are not part of what you return):\n${existingSiblings.map(s => `- id "${s.id}": "${s.label}" (${s.probability}%${s.isSelected ? ", currently selected" : ""}) — ${s.reason || "(no reason recorded)"}`).join("\n")}`
        : "\n\n(This decision has no other options recorded yet — your new node will be the first.)";

      // Full mode: the whole team debates the new idea against the named existing sibling(s)
      // first — same position + validation round shape as "+ New Tab" — and the transcript
      // becomes grounding context for the facilitator's build+selection call below, instead
      // of that call judging the idea in isolation on a single pass.
      let debateBlock = "";
      if (runFullDebate) {
        const rebuttalRounds = discussionDepth === "extended" ? 4 : discussionDepth === "deep" ? 2 : 1;
        const isDeep = discussionDepth !== "fast";
        let debateTranscript: CollaborativeTranscriptEntry[] = [];
        const positionEntries = await settleRound(
          mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
            const systemInstruction = `You are an AI agent named "${agent.name}" reconsidering one specific decision under "${parent.label}" now that the manager has proposed a new alternative the panel didn't originally consider. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${siblingsBlock}\n\nTHE MANAGER'S NEW IDEA:\n${draftText}\n\nGive your honest position in ${isDeep ? "5-8 sentences" : "2-4 sentences"}: does this new idea hold up against the existing option(s) above, or not? Be specific about why.`;
            const fullPrompt = `${knowledgeContext}\n\nORIGINAL TASK:\n${collaborativeRun.prompt}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: "Opening positions" };
          }),
          customTeam,
          "the new outcome's position round",
          signal
        );
        debateTranscript = [...debateTranscript, ...positionEntries];
        logDebug("info", "New outcome: position round complete", `${positionEntries.length} statement(s) collected`);
        for (let round = 1; round <= rebuttalRounds; round++) {
          const soFar = debateTranscript.map(t => `${t.agentName}: ${t.message}`).join("\n\n");
          const rebuttals = await settleRound(
            mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
              const systemInstruction = `You are an AI agent named "${agent.name}" in round ${round + 1} of reconsidering a decision given a new alternative. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nRead the discussion so far and respond — push back where you disagree, concede where a point changed your mind, refine your own position. Keep it to ${isDeep ? "3-6 sentences" : "2-3 sentences"}.`;
              const fullPrompt = `${knowledgeContext}\n\nTHE NEW IDEA UNDER DEBATE:\n${draftText}\n\nDISCUSSION SO FAR:\n${soFar}`;
              const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
              return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: `Validation round ${round}` };
            }),
            customTeam,
            `the new outcome's validation round ${round}`,
            signal
          );
          debateTranscript = [...debateTranscript, ...rebuttals];
          logDebug("info", `New outcome: validation round ${round} of ${rebuttalRounds} complete`);
        }
        debateBlock = `\n\nTHE PANEL'S FULL DEBATE ON THIS NEW IDEA (already happened — ground your build-out and selection call in what was actually argued here, not just your own independent read of the idea):\n${debateTranscript.map(t => `${t.agentName} (${t.roundLabel}): ${t.message}`).join("\n\n")}`;
      }

      const instruction = `You are the neutral facilitator of a multi-agent panel, revisiting one specific decision in a tree you previously produced. ${resourceScope}\n\nThe manager has their OWN idea for an outcome under "${parent.label}" — one the panel didn't propose and hasn't considered before now. Build it out properly: create a node for it, with genuine sub-nodes beneath it ONLY if the idea itself contains distinct sub-parts worth breaking out (most ideas don't — default to a single node unless it clearly does), grounded in the Knowledge Base above where relevant.${siblingsBlock}\n\nTHE MANAGER'S NEW OUTCOME:\n${draftText}${debateBlock}\n\nAfter building it out, make an honest comparative call: given everything above${runFullDebate ? " (including the panel's debate)" : ""}, should this new outcome now be the SELECTED path under "${parent.label}", replacing whichever existing option currently holds that position (if any)? Don't default to yes just because it's new and don't default to no out of deference to the existing pick either — decide on the actual merits shown above. If "${parent.label}" itself isn't currently on the panel's selected path at all, selection doesn't apply here — just build the node out and set winningId to "__new__".\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "nodes": [\n    { "id": "new1", "label": "short label", "reason": "substantive reasoning, not a restatement of the idea", "probability": 0-100, "parentRef": null | "the id of another node in THIS SAME nodes array, if nested beneath it" }\n  ],\n  "winningId": "__new__"${existingSiblings.length > 0 ? ` | ${existingSiblings.map(s => `"${s.id}"`).join(" | ")}` : ""},\n  "rationale": "1-2 sentences on the selection call specifically"\n}\n\nRules: 1-4 new nodes (most ideas need just 1 — don't manufacture sub-nodes that aren't genuinely distinct). Nodes with "parentRef": null are the outcome's own root(s); any node with "parentRef" set nests beneath another node in this same batch. Probabilities among nodes sharing the same "parentRef" (including null) should sum to roughly 100 among themselves.`;

      const parsed = await callAgentForJson(facilitator, `Add this new outcome under "${parent.label}".`, instruction, signal);
      const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      if (rawNodes.length === 0) throw new Error("The facilitator didn't return any nodes for this outcome.");

      // Fresh, collision-free ids for every new node — never trust the model's own id
      // namespace against ids already live in the tree.
      const idMap = new Map<string, string>();
      rawNodes.forEach((n: any, i: number) => {
        const rawId = typeof n.id === "string" ? n.id : `n${i}`;
        idMap.set(rawId, `outcome_${Date.now()}_${i}`);
      });
      const newNodes: DecisionNode[] = rawNodes.map((n: any, i: number) => {
        const rawId = typeof n.id === "string" ? n.id : `n${i}`;
        const rawParentRef = typeof n.parentRef === "string" ? n.parentRef : null;
        const resolvedParentId = rawParentRef && idMap.has(rawParentRef) && rawParentRef !== rawId ? idMap.get(rawParentRef)! : parent.id;
        return {
          id: idMap.get(rawId)!,
          parentId: resolvedParentId,
          label: typeof n.label === "string" && n.label.trim() ? n.label.trim() : "New outcome",
          probability: Math.max(0, Math.min(100, Number(n.probability) || 50)),
          reason: typeof n.reason === "string" ? n.reason : undefined,
          isSelected: false // reconciled below — never trusted from the model directly
        };
      });
      const newRootIds = newNodes.filter(n => n.parentId === parent.id).map(n => n.id);

      const winningIdRaw = typeof parsed.winningId === "string" ? parsed.winningId : null;
      const winningIsNew = winningIdRaw === "__new__";
      const winningExistingId = winningIdRaw && existingSiblings.some(s => s.id === winningIdRaw) ? winningIdRaw : null;

      let updatedTree = [...collaborativeRun.decisionTree, ...newNodes];
      if (parentIsSelected && (winningIsNew || winningExistingId)) {
        updatedTree = updatedTree.map(n => {
          // The ONLY field ever touched on an existing node — everything else about it is
          // passed straight through, exactly as the menu's tooltip promises.
          if (winningIsNew && newRootIds.includes(n.id)) return { ...n, isSelected: true };
          if (existingSiblings.some(s => s.id === n.id)) return { ...n, isSelected: n.id === winningExistingId };
          return n;
        });
      }

      const updatedRun: CollaborativeRun = {
        ...collaborativeRun,
        decisionTree: updatedTree,
        history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, `Added a new outcome under "${parent.label}"`)]
      };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      logDebug("info", `Added a new outcome under "${parent.label}"`, `${newNodes.length} node(s) added${winningIsNew ? " — selected as the new pick" : winningExistingId ? " — existing option remains selected" : ""}`);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Error adding new outcome:", err);
        logDebug("error", `Failed to add a new outcome under "${parent.label}"`, err?.message || err);
      }
    } finally {
      setNodeOpInFlight(null);
      runAbortRef.current = null;
    }
  };

  // "+ New Tab": a full multi-round discussion (position round, then discussionDepth-many
  // validation rounds, same as the main engine's decision path) scoped to ONE new decision,
  // using the existing team. Deliberately simpler than runCollaborativeSession — no axis
  // classification, no clarifying questions, no considerations/requirements log, no
  // mid-discussion questions — since none of those are meaningful for a single, focused,
  // manager-initiated decision. The result is grafted as a brand new root (tab); nothing
  // about any existing tab, or the run's own outcome/reasons, is touched.
  const submitNewTabDiscussion = async () => {
    if (!collaborativeRun || !newTabDraftText.trim() || customTeam.length === 0) return;
    const decisionText = newTabDraftText.trim();
    setPendingNewTabDialog(false);
    setNewTabDraftText("");
    setNodeOpInFlight({ type: "newTab", label: decisionText.slice(0, 60) });
    const controller = new AbortController();
    runAbortRef.current = controller;
    const signal = controller.signal;
    try {
      const resourceScope = getResourceScopeInstruction();
      const depthInstruction = getDepthInstruction();
      const knowledgeContext = buildKnowledgeContext();
      const facilitator = getRunFacilitator(collaborativeRun);
      const rebuttalRounds = discussionDepth === "extended" ? 4 : discussionDepth === "deep" ? 2 : 1;
      const isDeep = discussionDepth !== "fast";

      let transcript: CollaborativeTranscriptEntry[] = [];
      const positionEntries = await settleRound(
        mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
          const systemInstruction = `You are an AI agent named "${agent.name}" taking part in a focused, one-off discussion — a new decision the manager has added to an ongoing project, separate from the project's other decisions. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nState your position on the decision below in ${isDeep ? "6-10 sentences, exploring tradeoffs and edge cases" : "3-6 concise sentences"}. Be direct about what outcome you'd recommend and why, and note your confidence (low/medium/high).`;
          const fullPrompt = `${knowledgeContext}\n\nBACKGROUND — the overall project this new decision belongs to:\n${collaborativeRun.prompt}\n\nTHE NEW DECISION TO DISCUSS NOW (only this — not the rest of the project):\n${decisionText}`;
          const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
          return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: "Opening positions" };
        }),
        customTeam,
        "the new tab's position round",
        signal
      );
      transcript = [...transcript, ...positionEntries];
      logDebug("info", "New tab: position round complete", `${positionEntries.length} statement(s) collected`);

      for (let round = 1; round <= rebuttalRounds; round++) {
        const transcriptSoFar = transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n");
        const rebuttals = await settleRound(
          mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
            const systemInstruction = `You are an AI agent named "${agent.name}" in round ${round + 1} of a focused discussion on one new decision. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nRead the discussion so far and respond: push back where you disagree, concede where a point changed your mind, and refine your own position. Keep it to ${isDeep ? "4-8 sentences" : "2-4 sentences"}.`;
            const fullPrompt = `${knowledgeContext}\n\nTHE NEW DECISION:\n${decisionText}\n\nDISCUSSION SO FAR:\n${transcriptSoFar}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: `Validation round ${round}` };
          }),
          customTeam,
          `the new tab's validation round ${round}`,
          signal
        );
        transcript = [...transcript, ...rebuttals];
        logDebug("info", `New tab: validation round ${round} of ${rebuttalRounds} complete`);
      }

      const finalTranscriptText = transcript.map(t => `${t.agentName} (${t.roundLabel}): ${t.message}`).join("\n\n");
      const synthesisInstruction = `You are the neutral facilitator, "${facilitator.name}", synthesizing a panel discussion on ONE new decision into a small decision tree. ${resourceScope}\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "nodes": [\n    { "id": "n1", "label": "short label for this option", "reason": "the panel's actual reasoning", "probability": 0-100, "isSelected": true | false, "parentRef": null | "the id of another node in THIS SAME array" }\n  ]\n}\n\nRules: propose 2-5 competing options (root nodes, "parentRef": null) unless the discussion genuinely converged on a single clear answer with no real alternative (then 1 is fine), with real sub-detail nested via "parentRef" only where it's genuinely dependent on a specific option, not a flat restating of the same options. Root-level probabilities should sum to roughly 100. Mark exactly one option "isSelected": true — the panel's actual recommendation based on the discussion below, not a default.`;
      const parsed = await callAgentForJson(facilitator, `THE NEW DECISION:\n${decisionText}\n\nFULL PANEL DISCUSSION:\n${finalTranscriptText}`, synthesisInstruction, signal);

      const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      if (rawNodes.length === 0) throw new Error("The facilitator didn't return any nodes for this new decision.");
      const idMap = new Map<string, string>();
      rawNodes.forEach((n: any, i: number) => {
        const rawId = typeof n.id === "string" ? n.id : `n${i}`;
        idMap.set(rawId, `tab_${Date.now()}_${i}`);
      });
      const newNodes: DecisionNode[] = rawNodes.map((n: any, i: number) => {
        const rawId = typeof n.id === "string" ? n.id : `n${i}`;
        const rawParentRef = typeof n.parentRef === "string" ? n.parentRef : null;
        const resolvedParentId = rawParentRef && idMap.has(rawParentRef) && rawParentRef !== rawId ? idMap.get(rawParentRef)! : null;
        return {
          id: idMap.get(rawId)!,
          parentId: resolvedParentId,
          label: typeof n.label === "string" && n.label.trim() ? n.label.trim() : "Option",
          probability: Math.max(0, Math.min(100, Number(n.probability) || 0)),
          reason: typeof n.reason === "string" ? n.reason : undefined,
          isSelected: n.isSelected === true
        };
      });
      // Wrapped under one labeled root so the new tab reads as "the decision" with its
      // options beneath it — matching how every other tab (an axis from the original
      // classification) already has its own named root node, not a bare list of options.
      const newTabRootLabel = decisionText.length > 60 ? `${decisionText.slice(0, 60)}…` : decisionText;
      const tabRootId = `tabroot_${Date.now()}`;
      const tabRoot: DecisionNode = { id: tabRootId, parentId: null, label: newTabRootLabel, probability: 100, reason: decisionText };
      const reparented = newNodes.map(n => (n.parentId === null ? { ...n, parentId: tabRootId } : n));

      const updatedRun: CollaborativeRun = {
        ...collaborativeRun,
        decisionTree: [...collaborativeRun.decisionTree, tabRoot, ...reparented],
        history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, `Added new tab: "${newTabRootLabel}"`)]
      };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      setFocusRootId(tabRootId);
      logDebug("info", `Added new tab: "${newTabRootLabel}"`, `${reparented.length} option(s), ${transcript.length} statement(s) total`);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Error running new-tab discussion:", err);
        logDebug("error", "Failed to run the new tab's discussion", err?.message || err);
      }
    } finally {
      setNodeOpInFlight(null);
      runAbortRef.current = null;
    }
  };

  // Opens the request-input dialog for "Revise this section/node" — isSection is decided by
  // whether the node links to an actual drafted deliverable section (linkedSectionHeading),
  // not by taskType alone, since a deliverable's tree can have unlinked axis nodes too.
  const requestReviseNode = useCallback((node: DecisionNode) => {
    setRevisionDraftText("");
    setPendingRevisionRequest({ node, isSection: !!node.linkedSectionHeading });
  }, []);

  // The lightweight alternative to a full re-discussion for a plain content change — ONE
  // call to the actual author (the section's drafting agent, or the run's facilitator for
  // a decision node's reasoning), not a full re-discussion. Produces a preview; nothing is
  // applied until the manager explicitly confirms it, same as Move.
  const submitRevisionRequest = async () => {
    if (!pendingRevisionRequest || !collaborativeRun || !revisionDraftText.trim()) return;
    const { node, isSection } = pendingRevisionRequest;
    const request = revisionDraftText.trim();
    setPendingRevisionRequest(null);
    setNodeOpInFlight({ type: "revise", label: node.label });
    try {
      const section = isSection ? collaborativeRun.deliverable?.sections.find(s => s.heading === node.linkedSectionHeading) : undefined;
      if (isSection && !section) throw new Error("Couldn't find the linked section to revise.");

      const author = isSection
        ? customTeam.find(a => a.id === section!.authorAgentId) || getRunFacilitator(collaborativeRun)
        : getRunFacilitator(collaborativeRun);
      if (!author) throw new Error("No agent available to make this revision.");

      const beforeLabel = node.label;
      const beforeText = isSection ? section!.content : (node.reason || "");
      // Previously the one call site with no Knowledge Base access at all — inconsistent
      // with every other agent call (position statements, validation, synthesis, Move/
      // Promote, Chat, Gatekeeper) already including it. A manager saying "update this per
      // the new spec doc" needs the model to actually see the doc, not just the manager's
      // typed paraphrase of it.
      const knowledgeContext = buildKnowledgeContext();

      const revisionInstruction = isSection
        ? `You are an AI agent named "${author.name}" revising a section you previously drafted for a team deliverable. Persona: ${author.persona}\n\nSection heading: "${node.linkedSectionHeading}"\n\nThe manager has asked for a specific change — make ONLY that change, keep everything else about the section's content, tone, and length as close to the original as the request allows. This is a targeted revision, not a rewrite from scratch. If the Knowledge Base below is relevant to the requested change, ground the revision in it; otherwise it's provided for reference only and most requests won't need it.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary): { "content": "the full revised section text" }`
        : `You are the neutral facilitator of a multi-agent panel, asked to revise one specific node's reasoning in an existing decision tree — not to re-run any discussion. Persona: ${author.persona}\n\nNode label: "${node.label}"\nCurrent reasoning: "${node.reason || "(none)"}"\n\nThe manager has asked for a specific change — make ONLY that change. Update the label too, but only if the request genuinely calls for it (most requests only affect the reasoning); otherwise keep the label exactly as-is. If the Knowledge Base below is relevant to the requested change, ground the revision in it; otherwise it's provided for reference only and most requests won't need it.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary): { "label": "the label, revised or unchanged", "reason": "the full revised reasoning" }`;

      const revisionPrompt = `${knowledgeContext}\n\nCURRENT CONTENT:\n${isSection ? beforeText : `Label: ${beforeLabel}\nReasoning: ${beforeText}`}\n\nMANAGER'S REQUESTED CHANGE:\n${request}`;

      const parsed = await callAgentForJson(author, revisionPrompt, revisionInstruction);
      // Validated at the parse boundary — encodes the same per-field fallback as before
      // (missing/empty fields keep the current content), so the success path is unchanged.
      const fallback = { label: beforeLabel, text: beforeText };
      const revised = isSection
        ? validateSectionRevisionResponse(parsed, fallback)
        : validateNodeRevisionResponse(parsed, fallback);

      setRevisionPreview({ node, isSection, request, beforeLabel, afterLabel: revised.label, beforeText, afterText: revised.text });
    } catch (err: any) {
      logDebug("error", `Failed to revise "${node.label}"`, err?.message || err);
    } finally {
      setNodeOpInFlight(null);
    }
  };

  // Applies a previewed revision — a direct, single-node/section mutation with no
  // downstream re-discussion, and logs it as its own Requirements entry so it's visible
  // in the audit trail the same way every other tree-changing action already is.
  const confirmRevision = () => {
    if (!revisionPreview || !collaborativeRun) return;
    const { node, isSection, request, afterLabel, afterText } = revisionPreview;
    setRevisionPreview(null);

    const updatedRun: CollaborativeRun = isSection
      ? {
          ...collaborativeRun,
          deliverable: collaborativeRun.deliverable
            ? { ...collaborativeRun.deliverable, sections: collaborativeRun.deliverable.sections.map(s => (s.heading === node.linkedSectionHeading ? { ...s, content: afterText } : s)) }
            : collaborativeRun.deliverable
        }
      : {
          ...collaborativeRun,
          decisionTree: collaborativeRun.decisionTree.map(n => (n.id === node.id ? { ...n, label: afterLabel, reason: afterText } : n))
        };

    const entry: RequirementEntry = {
      id: `req_${Date.now()}`,
      group: "addition",
      sourceType: "revision",
      label: `Revised "${node.label}"`,
      text: request,
      timestamp: new Date().toISOString()
    };
    updatedRun.requirementsLog = [...(collaborativeRun.requirementsLog || []), entry];
    updatedRun.history = [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, `Revised "${node.label}"`)];

    setCollaborativeRun(updatedRun);
    setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
    saveHistoryEntry("collaborative", updatedRun);
    logDebug("info", `Revised "${node.label}"`, "Single-call revision — no re-discussion.");
  };

  // Drop handler: validates before ever asking for confirmation, so an invalid drag simply
  // does nothing rather than opening a dialog for a move that could never succeed.
  const handleNodeDrop = (draggedId: string, targetId: string) => {
    if (!collaborativeRun || draggedId === targetId) return;
    const draggedNode = collaborativeRun.decisionTree.find(n => n.id === draggedId);
    const targetNode = collaborativeRun.decisionTree.find(n => n.id === targetId);
    if (!draggedNode || !targetNode) return;
    if (draggedNode.parentId === targetId) return; // already there — no-op, not an error
    if (isNodeOrDescendant(collaborativeRun.decisionTree, draggedId, targetId)) {
      logDebug("warn", "Can't move a branch under its own descendant", `"${draggedNode.label}" → "${targetNode.label}"`);
      return;
    }
    setPendingMove({
      node: draggedNode,
      newParent: targetNode,
      looksLikeAlternatives: looksLikeAlternativesSiblingMove(collaborativeRun.decisionTree, draggedId, targetId)
    });
  };

  // unified chat drawer pinned to that node with its full context (not just the label), so
  // the discussion is actually seeded with the branch's probability and reasoning from the
  // first turn rather than the model only knowing its name.
  const requestDiscussNode = useCallback((node: DecisionNode) => {
    const parent = collaborativeRun?.decisionTree.find(n => n.id === node.parentId);
    setChatTargetMode(customTeam[0]?.id || "team");
    openChatDrawer({
      nodeId: node.id,
      nodeLabel: node.label,
      probability: node.probability,
      reason: node.reason,
      parentLabel: parent?.label
    });
  }, [collaborativeRun]);

  const runCollaborativeSession = async (forcedConstraint?: string | null, forceTaskType?: TaskType | null, premiseAmendments?: string | null, managerFeedback?: string | null, promptOverride?: string | null, blockingAnswer?: { statusNote: string; answer: string } | null, requirementEntries?: { label: string; text: string; sourceType?: RequirementEntry["sourceType"] }[] | null, preApprovedAxes?: { axes: DecisionAxis[]; taskTypeSource: "manager" | "auto" } | null) => {
    // promptOverride exists for spawned runs (Go Deeper's "new conversation") — passing the
    // seed directly avoids both clobbering the composer with machine-generated text and the
    // stale-closure trap where a setCustomPrompt + deferred call still read the old prompt.
    const effectivePrompt = promptOverride || customPrompt;
    if (!effectivePrompt || customTeam.length === 0) return;
    if (collaborativeRunInFlightRef.current) {
      logDebug("warn", "Ignored a duplicate run request — a discussion is already in progress");
      return;
    }
    collaborativeRunInFlightRef.current = true;

    // Bidirectional provenance: if this call carries managerFeedback OR a blockingAnswer,
    // it's a revisit of whatever run is currently displayed (Discuss This Batch, a dissent
    // revisit, Go Deeper, or answering a "needs_input" blocker — all route through here).
    // Captured now, before any state changes, so it reflects the run actually being acted on.
    const revisitSourceRun = (managerFeedback || blockingAnswer) ? collaborativeRun : null;
    const revisitTrigger: "go_deeper" | "dissent_revisit" | "discuss_batch" | "blocking_answer" | "other" =
      blockingAnswer ? "blocking_answer"
      : !managerFeedback ? "other"
      : managerFeedback.includes("asked the team to go deeper") ? "go_deeper"
      : managerFeedback.includes("dissenting condition has occurred") ? "dissent_revisit"
      : managerFeedback.startsWith("- On \"") ? "discuss_batch"
      : "other";
    const revisitNote = blockingAnswer ? `Answered: "${blockingAnswer.answer}"` : (managerFeedback || "");
    const recordRevisitOnSourceRun = (newRunId: string) => {
      if (!revisitSourceRun) return;
      const updatedSource: CollaborativeRun = {
        ...revisitSourceRun,
        spawnedRunIds: [...(revisitSourceRun.spawnedRunIds || []), newRunId],
        revisitEvents: [
          ...(revisitSourceRun.revisitEvents || []),
          { timestamp: new Date().toISOString(), trigger: revisitTrigger, note: revisitNote.slice(0, 300), newRunId }
        ]
      };
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedSource.id ? updatedSource : r)));
      saveHistoryEntry("collaborative", updatedSource);
    };

    // Discussion Requirements: a read-only, auto-built record of what the current outcome
    // is actually answering to — shown above Defined Outcome in place of the original
    // prompt composer, since editing that composer and resubmitting doesn't refine the
    // discussion, it discards it. Team Chat deliberately never contributes an entry here
    // (see the Team Chat audit) — only things that trigger a genuine re-discussion do.
    //
    // A promptOverride means this is Expand Scope's "start a new conversation" — a
    // genuinely different task despite carrying managerFeedback, so it gets a fresh log
    // seeded from its own seed prompt, same as any other brand-new discussion.
    const isFreshRequirementsStart = !!promptOverride || (!forcedConstraint && !premiseAmendments && !managerFeedback && !blockingAnswer);
    const requirementsCarrySource = !isFreshRequirementsStart ? collaborativeRun : null;
    let requirementsLog: RequirementEntry[];
    if (requirementsCarrySource) {
      // Structured entries (one per comment/answer/consideration) are preferred whenever a
      // call site supplies them — previously every multi-item source (comments, wrap-up
      // answers, Considerations responses) got flattened into one "- Q → A\n- Q → A" blob
      // under a single generic label, which rendered as an unreadable run-on paragraph.
      // Each becomes its own entry now, same as Clarifications already does.
      let newEntries: RequirementEntry[];
      if (requirementEntries && requirementEntries.length > 0) {
        newEntries = requirementEntries.map((e, i) => ({
          id: `req_${Date.now()}_${i}`,
          group: "addition" as const,
          sourceType: e.sourceType,
          label: e.label,
          text: e.text,
          timestamp: new Date().toISOString()
        }));
      } else {
        const additionLabel =
          forcedConstraint ? "Forced constraint"
          : blockingAnswer ? "Answered the team's question"
          : revisitTrigger === "dissent_revisit" ? "Dissent condition occurred"
          : revisitTrigger === "discuss_batch" ? "Node comment(s) added"
          : "Follow-up answered"; // premiseAmendments: Considerations' "re-run" and the wrap-up gate's content answers both land here
        const additionSourceType: RequirementEntry["sourceType"] =
          forcedConstraint ? "force"
          : blockingAnswer ? "needs_input"
          : revisitTrigger === "dissent_revisit" ? "dissent"
          : revisitTrigger === "discuss_batch" ? "comment"
          : "follow_up";
        const additionText = forcedConstraint || (blockingAnswer ? `Regarding "${blockingAnswer.statusNote}": ${blockingAnswer.answer}` : (managerFeedback || premiseAmendments || ""));
        newEntries = [{ id: `req_${Date.now()}`, group: "addition", sourceType: additionSourceType, label: additionLabel, text: additionText, timestamp: new Date().toISOString() }];
      }
      requirementsLog = [...(requirementsCarrySource.requirementsLog || []), ...newEntries];
    } else {
      requirementsLog = [
        { id: "req_original", group: "original", label: "Original request", text: promptOverride || customPrompt, timestamp: new Date().toISOString() },
        ...clarificationEntriesRef.current.map((qa, i) => ({ id: `req_clarify_${i}`, group: "clarification" as const, label: qa.question, text: qa.answer, timestamp: new Date().toISOString() }))
      ];
    }

    // Layer 1 of the re-discussion data-loss fix: previously, revising an existing run
    // (Force, Considerations, comments, dissent-revisit, a needs_input answer) regenerated
    // the ENTIRE decision tree from scratch — the synthesis step never saw the current tree
    // at all, so Expand-Scope findings, moved branches, mandate notes, and contradiction
    // flags anywhere the fresh discussion didn't happen to touch could be silently dropped
    // or reshaped. requirementsCarrySource already captures exactly "is this a revision of
    // an existing run" (reused here rather than recomputing the same condition twice).
    const treeToPreserve = requirementsCarrySource;
    const preserveTreeInstructionBlock = treeToPreserve && treeToPreserve.decisionTree.length > 0
      ? `\n\nThis is a REVISION of an existing decision tree below, not a first pass — the discussion above is about something specific, not a request to start over. Any branch or node NOT directly relevant to that discussion must be preserved essentially as-is: same content, same "reason", and critically the same "scopingQA", "scopingSummary", "mandateNote", "contradictionWarning", and "movedTo" fields wherever they're present on the current tree — do not drop them. Only revise or replace nodes the fresh discussion actually addressed, and add new nodes it genuinely surfaced. If something elsewhere in the tree genuinely needs to change as a result of this discussion even though it wasn't directly asked about, you may do so, but you MUST include a "structuralChangeNote" field in your response explaining what changed and why — so the manager isn't surprised by an unrelated change appearing unannounced. Omit "structuralChangeNote" entirely when nothing outside the direct scope of this discussion changed, which should be the common case.`
      : "";
    const preserveTreeDataBlock = treeToPreserve && treeToPreserve.decisionTree.length > 0
      ? `\n\nCURRENT DECISION TREE, BEFORE THIS ROUND OF DISCUSSION (JSON) — the tree to revise, not replace:\n${truncateText(JSON.stringify(treeToPreserve.decisionTree), 20000)}`
      : "";

    // ---- Facilitator selection: rotating, and (when the team is big enough) sitting out ----
    // The facilitator runs the process — decomposition, convergence checks, synthesis — and
    // with 3+ agents they sit out the debate itself, so the person weighing the arguments
    // is not also the person who made some of them. Rotation is seeded on run count so the
    // same roster gets a different facilitator each session. With 1-2 agents everyone must
    // debate; the facilitator is then a disclosed player-coach and the synthesis prompt
    // carries an explicit self-check against over-weighting their own arguments.
    const facilitator = customTeam[collaborativeHistory.length % customTeam.length];
    const facilitatorSitsOut = customTeam.length >= 3;
    const panelists = facilitatorSitsOut ? customTeam.filter(a => a.id !== facilitator.id) : customTeam;
    const playerCoachCheck = facilitatorSitsOut
      ? ""
      : " You also argued a position in this debate: actively check that you are not over-weighting your own arguments, and cite at least one point from each other panelist in your reasoning.";
    const teamNotes = await loadTeamMemory(customTeam);
    const teamNotesBlock = teamNotes.length > 0
      ? `\n\nTEAM WORKING NOTES (carried over from this team's previous sessions — apply where relevant):\n${teamNotes.map(n => `- ${n}`).join("\n")}`
      : "";

    setCollaborativeError(null);
    setCollaborativeLoading(true);
    managerInterjectionRef.current = "";
    setManagerInterjectionDraft("");
    flushChatToRun();
    setFollowUpMessages([]);
    setMainGeneratedFiles([]);
    setCallCount(0);
    resetPostOutcomeState();
    setLiveTranscript([]);
    setIsLiveViewExpanded(false);

    // Generated once, up front, and reused for every save of this run below (the initial
    // checkpoint, every in-progress checkpoint, and the final delivered/needs_input save) so
    // they all land in the SAME Firestore document rather than each save creating a new Chat
    // History entry. Previously a run only got an id — and therefore only got saved — once it
    // reached the very end of the function; anything that died before then (a provider outage,
    // a closed tab, a crashed browser extension taking the page down with it) left literally no
    // trace in Chat History, however long the discussion had actually been running.
    const runId = `run_${Date.now()}`;
    const runStartedIso = new Date().toISOString();
    const initialCheckpoint: CollaborativeRun = {
      id: runId,
      timestamp: runStartedIso,
      prompt: effectivePrompt,
      transcript: [],
      outcome: "",
      reasons: [],
      decisionTree: [],
      rounds: 0,
      requirementsLog,
      forcedConstraint: forcedConstraint || undefined,
      premiseAmendments: premiseAmendments || undefined,
      managerFeedback: managerFeedback || undefined,
      facilitatorAgentName: facilitator.name,
      status: "in_progress",
      groundedSourceCount: contentBearingKnowledgeFiles.length,
      groundedSourceIds: getGroundedSourceIds()
    };
    checkpointRunRef.current = initialCheckpoint;
    setCollaborativeHistory(prev => [initialCheckpoint, ...prev]);
    saveHistoryEntry("collaborative", initialCheckpoint);
    logDebug("info", "Saved an initial in-progress checkpoint to Chat History", runId);

    const controller = new AbortController();
    runAbortRef.current = controller;
    const signal = controller.signal;

    const constraintBlock = (forcedConstraint
      ? `\n\nUSER-FORCED CONSTRAINT: ${forcedConstraint}\nTreat this as a decision the user has already made and locked in. Do not re-litigate whether it's correct — instead discuss and reason about its implications, and design your recommendation and decision tree consistent with it.`
      : "") + (premiseAmendments
      ? `\n\nMANAGER'S AMENDED PREMISES: In a previous discussion of this task, the panel raised considerations (assumptions, risks, constraints, tradeoffs) and the manager has now responded to them as follows:\n${premiseAmendments}\nTreat each of the manager's responses as the authoritative position on that premise. Where the manager chose an alternative or gave their own view, reason FROM that amended premise — do not restate the original one.`
      : "") + (managerFeedback
      ? `\n\nMANAGER FEEDBACK ON THE PREVIOUS DISCUSSION: While reviewing the panel's decision tree from a prior round of this discussion, the manager left the following feedback on specific branches:\n${managerFeedback}\nDiscuss this feedback directly — do not just acknowledge it. Where it changes your assessment of a branch's likelihood or validity, reflect that in your reasoning and in the updated decision tree.`
      : "") + (blockingAnswer
      ? `\n\nMANAGER'S ANSWER TO THE TEAM'S OPEN QUESTION: The panel previously indicated it could not consider this complete without the following: "${blockingAnswer.statusNote}"\nThe manager's answer: "${blockingAnswer.answer}"\nTreat this as authoritative and use it to complete the decision now — this was specifically blocking completion, not a general comment.`
      : "");

    const startedAt = Date.now();

    try {
      const knowledgeContext = buildKnowledgeContext();
      const resourceScope = getResourceScopeInstruction();
      const depthInstruction = getDepthInstruction();
      const isDeep = discussionDepth === "deep" || discussionDepth === "extended";
      // Every mode gets at least one validation round so agents can question and check each
      // other's reasoning. Fast: 1 round. Deep: 2 rounds. Multiple Rounds: up to 4 rounds
      // (fewer if the panel converges early — see the check at the end of each round below).
      const rebuttalRounds = discussionDepth === "extended" ? 4 : discussionDepth === "deep" ? 2 : 1;

      // One combined "what's about to be sent" line: team roster with each agent's actual
      // provider/model (not just a count — a 503 on one provider means something different
      // from one on another), how much Knowledge Base content is being attached, and the
      // full prompt length. Previously this only logged team size and a 200-char prompt
      // snippet, so diagnosing "why did this fail" meant guessing at how much load was
      // actually behind the scenes.
      const rosterLabel = customTeam.map(a => `${a.name} (${a.provider}/${a.model})`).join(", ");
      const groundedFiles = contentBearingKnowledgeFiles;
      const kbCharTotal = groundedFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);
      logDebug("info", forcedConstraint ? "Re-discussing with a user-forced constraint" : `Started Collaborative discussion with ${customTeam.length} agent(s)`, `depth: ${discussionDepth} (up to ${rebuttalRounds} validation round(s)), team: ${rosterLabel}, KB: ${groundedFiles.length} source(s)/${kbCharTotal} chars, prompt: ${effectivePrompt.length} chars${forcedConstraint ? `, constraint: ${forcedConstraint}` : ""} — "${effectivePrompt.slice(0, 200)}"`);

      setCollaborativePhase("Understanding the task and mapping out its structure...");
      // Decomposition step: before anyone discusses anything, (a) classify whether this task
      // is fundamentally a DECISION (produces a recommended outcome + tree) or a DELIVERABLE
      // (produces a piece of work — a document, plan, analysis — where a decision tree adds
      // no value), and (b) identify the distinct axes/sections the task actually contains —
      // including which are independent of each other vs. genuinely sequential/dependent —
      // and their relative priority. This gives the discussion a shared skeleton to organise
      // around instead of inventing structure from scratch after the fact.
      let axes: DecisionAxis[] = [];
      let taskType: TaskType = "decision";
      let taskTypeSource: "manager" | "auto" = "auto";
      if (preApprovedAxes) {
        // Resuming after axis sign-off — skip decomposition entirely and use the manager's
        // finalized (possibly edited) axes directly, exactly as approveOutlineAndDraft skips
        // re-generating an outline it's already been handed.
        axes = preApprovedAxes.axes;
        taskType = "decision";
        taskTypeSource = preApprovedAxes.taskTypeSource;
        logDebug("info", `Resuming with ${axes.length} approved decision axis/axes`, axes.map(a => a.label).join("; "));
      } else {
        try {
          const rosterText = customTeam.map(a => `- ${a.name}: ${a.persona.slice(0, 150)}`).join("\n");
          const hasKnowledgeBase = knowledgeFiles.some(f => f.content && f.sourceType !== "image");
          const decompositionInstruction = buildDecompositionInstruction(rosterText, discussionDepth, domainExpertInstructionSuffix, isLowStakesPrompt(effectivePrompt, hasKnowledgeBase));
          const decompositionParsed = await callAgentForJson(
            customTeam[0],
            `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}`,
            decompositionInstruction,
            signal
          );
          // Normalised + validated at the parse boundary — see src/lib/decomposition.ts.
          ({ taskType, axes } = normalizeDecompositionResponse(decompositionParsed));
          logDebug("info", `Classified as a "${taskType}" task with ${axes.length} axis/axes`, axes.map(a => `${a.label} (${a.independent ? "independent" : "dependent"}, priority ${a.priority}${a.suggestedAgentName ? `, suggested: ${a.suggestedAgentName}` : ""})`).join("; "));
        } catch (decompErr: any) {
          // Decomposition is a helpful skeleton, not a hard requirement — proceed without it
          // (defaulting to a decision-style discussion) rather than blocking the whole run.
          logDebug("warn", "Decomposition step failed — proceeding as a decision task without a pre-identified axis structure", decompErr?.message || decompErr);
        }
        if (forceTaskType) taskType = forceTaskType; // explicit user override takes precedence
        taskTypeSource = forceTaskType ? "manager" : "auto";
      }

      const axesBlock = buildAxesBlock(axes, taskType);

      let transcript: CollaborativeTranscriptEntry[] = [];
      let roundsRun = 0;

      // Called at each phase boundary below (position round done, each validation/exchange
      // round done, dangling questions answered) — never mid-message, always at a point
      // where `transcript` is a complete, consistent array. Does two things: mirrors it into
      // liveTranscript (React state) so the "watch live" panel has something to render, and
      // checkpoints the run to Chat History so a discussion that dies later (provider outage,
      // closed tab, browser crash) still leaves whatever was actually said on the record,
      // rather than the total loss a failure used to mean. checkpointRunRef is what the outer
      // catch block reads from, since transcript/taskType/etc. are scoped to this try block.
      const checkpointRun = () => {
        setLiveTranscript([...transcript]);
        const checkpoint: CollaborativeRun = {
          id: runId,
          timestamp: runStartedIso,
          prompt: effectivePrompt,
          transcript,
          outcome: "",
          reasons: [],
          decisionTree: [],
          rounds: roundsRun,
          plannedRounds: rebuttalRounds,
          requirementsLog,
          forcedConstraint: forcedConstraint || undefined,
          axes: axes.length > 0 ? axes : undefined,
          taskType,
          taskTypeSource,
          premiseAmendments: premiseAmendments || undefined,
          managerFeedback: managerFeedback || undefined,
          facilitatorAgentName: facilitator.name,
          status: "in_progress",
          groundedSourceCount: contentBearingKnowledgeFiles.length,
          groundedSourceIds: getGroundedSourceIds()
        };
        checkpointRunRef.current = checkpoint;
        setCollaborativeHistory(prev => (prev.some(r => r.id === runId) ? prev.map(r => (r.id === runId ? checkpoint : r)) : [checkpoint, ...prev]));
        saveHistoryEntry("collaborative", checkpoint);
      };
      let resultOutcome = "";
      let resultReasons: string[] = [];
      let resultDecisionTree: DecisionNode[] = [];
      let resultDissent: DissentEntry[] = [];
      let resultDeliverable: DeliverableSpec | undefined;
      let resultStatus: RunStatus = "delivered";
      let resultStatusNote: string | undefined;
      let resultConsiderations: Consideration[] | undefined;
      let resultStructuralChangeNote: string | undefined;

      if (taskType === "decision" && !preApprovedAxes) {
        // Pause here for manager sign-off before the panel starts debating — the decision-path
        // counterpart to the deliverable outline pause just below. Resumed via
        // approveAxesAndDiscuss, which calls this same function again with preApprovedAxes
        // set, skipping straight past decomposition into the unchanged decision-path body.
        setPendingAxes({
          axes,
          taskTypeSource,
          forcedConstraint,
          premiseAmendments,
          managerFeedback,
          promptOverride,
          blockingAnswer,
          requirementEntries
        });
        logDebug("info", "Decision axes ready for sign-off", `${axes.length} axis/axes awaiting manager approval before discussion`);
        return;
      }

      if (taskType === "deliverable") {
        // ---- DELIVERABLE PATH: light discussion on approach/outline, then divide & conquer ----
        // drafting — each section written directly by the team member best suited to it,
        // rather than argued over by the whole panel. Mirrors how a real team actually
        // produces a piece of work: briefly align on structure, then split up and draft.
        // Every depth gets at least one round where agents actually see each other's outline
        // opinions — a single blind round (each agent answering independently, in parallel)
        // isn't a discussion, just a survey. Fast/Deep: 1 blind + 1 aware round. Extended:
        // 1 blind + 2 aware rounds, mirroring how validation rounds scale for Decision tasks.
        const outlineRefinementRounds = discussionDepth === "extended" ? 2 : 1;

        setCollaborativePhase("Discussing the approach and outline...");
        transcript = await settleRound(
          mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
            const systemInstruction = `You are an AI agent named "${agent.name}" taking part in a multi-agent team preparing to produce a DELIVERABLE (not a decision) for the task below. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\nIn 3-5 sentences, discuss the approach: do the candidate sections above look right (anything missing, redundant, or mis-scoped)? Are you the right person for the section(s) suggested for you, or should someone else take them? Flag anything that needs to stay consistent across sections. Do NOT draft any section content yet — this is planning only.`;
            const fullPrompt = `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message };
          }),
          customTeam,
          "the outline discussion",
          signal
        );
        roundsRun = 1;

        for (let round = 1; round <= outlineRefinementRounds; round++) {
          if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");
          setCollaborativePhase(outlineRefinementRounds > 1 ? `Refining the outline (round ${round} of ${outlineRefinementRounds})...` : "Refining the outline...");
          const priorRoundText = truncateText(transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n"), MAX_TRANSCRIPT_CHARS);
          const isLastRefinement = round === outlineRefinementRounds;
          const refinements = await settleRound(
            mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
              const systemInstruction = `You are an AI agent named "${agent.name}" taking part in a multi-agent team preparing to produce a DELIVERABLE. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\nReview the team's planning discussion below and, in 2-4 sentences, confirm or adjust the outline and assignments — resolve any disagreement about scope or ownership so drafting can start cleanly.${isLastRefinement ? " This is the final planning round, so converge on a concrete outline and assignments." : ""} Still no section content yet.`;
              const fullPrompt = `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}\n\nPLANNING DISCUSSION SO FAR:\n${priorRoundText}`;
              const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
              return { agentId: agent.id, agentName: `${agent.name} (round ${round + 1})`, provider: agent.provider, message };
            }),
            customTeam,
            `the outline refinement round ${round}`,
            signal
          );
          transcript = [...transcript, ...refinements];
          roundsRun = round + 1;
        }
        if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");

        setCollaborativePhase("Finalizing the outline and section assignments...");
        const outlineTranscriptText = truncateText(transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n"), MAX_TRANSCRIPT_CHARS);
        const outlineInstruction = `You are the neutral facilitator of a multi-agent team. ${resourceScope}\n\n${depthInstruction}${constraintBlock}\n\nGiven the team's planning discussion below, finalize the deliverable's outline. Every section needs exactly one clear author. Also mark each section "independent: true" if it can be drafted without needing to read any other section's actual content, or "independent: false" if it genuinely builds on or must stay consistent with another section's content (not just its heading) — be conservative, most sections are independent; only mark a section dependent if its author would actually need to read another section first to do it well.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "title": "deliverable title",\n  "subtitle": "optional one-line subtitle, or omit",\n  "sections": [\n    { "id": "s1", "heading": "section heading", "authorAgentName": "exact team member name", "brief": "1-2 sentences on what this section should cover, incorporating what the team agreed", "independent": true }\n  ]\n}\n\nEvery "authorAgentName" MUST exactly match one of: ${customTeam.map(a => a.name).join(", ")}.`;
        const outlinePrompt = `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}${axesBlock}\n\nTEAM'S PLANNING DISCUSSION:\n${outlineTranscriptText}`;
        const outlineParsed = await callAgentForJson(facilitator, outlinePrompt, outlineInstruction, signal);
        const outlineSections = (Array.isArray(outlineParsed.sections) ? outlineParsed.sections : [])
          .filter((s: any) => s?.heading)
          .map((s: any, i: number) => ({
            id: s.id || `sec${i + 1}`,
            heading: s.heading,
            brief: s.brief || "",
            independent: s.independent !== false,
            author: customTeam.find(a => a.name.toLowerCase() === String(s.authorAgentName || "").toLowerCase()) || facilitator
          }));
        if (outlineSections.length === 0) throw new Error("The facilitator didn't return a usable outline for the deliverable.");
        logDebug("info", `Outline finalized: ${outlineSections.length} section(s)`, outlineSections.map((s: any) => `${s.heading} → ${s.author.name} (${s.independent ? "independent" : "dependent"})`).join("; "));

        // Pause here for manager sign-off rather than drafting immediately — a real team
        // proposes its plan and waits for approval before spending effort executing it. The
        // drafting itself (independent sections, then dependent sections with the independent
        // ones' actual content in view) happens in approveOutlineAndDraft once approved.
        setPendingOutline({
          title: outlineParsed.title || effectivePrompt.slice(0, 80),
          subtitle: typeof outlineParsed.subtitle === "string" ? outlineParsed.subtitle : undefined,
          sections: outlineSections.map((s: any) => ({ id: s.id, heading: s.heading, brief: s.brief, independent: s.independent, authorAgentId: s.author.id })),
          transcript,
          axes,
          roundsRun,
          forcedConstraint: forcedConstraint || undefined,
          startedAt,
          knowledgeContext,
          resourceScope,
          depthInstruction,
          facilitatorAgentName: facilitator.name,
          taskTypeSource,
          requirementsLog
        });
        logDebug("info", "Outline ready for sign-off", `${outlineSections.length} section(s) awaiting manager approval before drafting`);
        return;
      } else {
        // ---- DECISION PATH: unchanged position → validation → synthesis flow ----
        setCollaborativePhase(`Gathering each agent's initial position${panelists.length > 1 ? "s" : ""}...`);
        transcript.push({
          agentId: facilitator.id,
          agentName: facilitator.name,
          provider: facilitator.provider,
          message: facilitatorSitsOut
            ? `I'm facilitating this session — I'll sit out the debate itself, keep the process honest, and synthesize the panel's positions at the end.`
            : `I'm facilitating this session while also debating (the team is too small for me to sit out) — when I synthesize at the end I'll actively check that I'm not over-weighting my own arguments.`,
          roundLabel: "Facilitation"
        });
        const positionEntries = await settleRound(
          mapWithConcurrency(panelists, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
            const positionLength = isDeep
              ? "6-10 sentences, exploring tradeoffs and edge cases"
              : "3-6 concise sentences";
            const systemInstruction = `You are an AI agent named "${agent.name}" taking part in a multi-agent discussion. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\n${teamNotesBlock}\n\nState your position on the task in ${positionLength}. Address each decision axis above that's relevant to your expertise, giving more depth to higher-priority ones — you don't need to weigh in on every axis if one is clearly outside your remit. Be direct about what outcome you would recommend and why. Structure your reasoning: (1) your recommended outcome, (2) the key evidence or reasoning behind it, (3) the strongest counter-argument to your own position and why you still hold it, and (4) your confidence level (low/medium/high) with the main assumption it rests on. If you need one or more named panelists to clarify or justify something before you can be confident, end with a direct question addressed to each by name — ask as many as you genuinely need, to the same panelist or different ones (e.g. "Question for <name>: ..." repeated for each). Do not limit yourself to a single question if more than one is genuinely warranted.`;
            const fullPrompt = `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: "Opening positions" };
          }),
          panelists,
          "the position round",
          signal
        );
        transcript = [...transcript, ...positionEntries];
        logDebug("info", "Position round complete", `${positionEntries.length} statement(s) collected${facilitatorSitsOut ? ` (${facilitator.name} facilitating, sitting out)` : ""}`);
        checkpointRun();

        // Give the team one chance to ask the manager a genuinely blocking question before
        // continuing to validate — not forced, and capped to a single question. Most
        // discussions won't need this; it only fires when something real is missing.
        if (!signal.aborted) {
          try {
            const midCheckTranscript = truncateText(transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n"), MAX_TRANSCRIPT_CHARS);
            const rosterText = panelists.map(a => `- ${a.name}: ${a.persona.slice(0, 150)}`).join("\n");
            const midCheckInstruction = `You are checking whether the panel has a genuinely important question for the manager before continuing to validate each other's positions, based on the positions just stated below. Only ask if something is truly ambiguous, missing, or blocking — most discussions have everything they need and should proceed without asking. Do not manufacture a question just to be thorough.\n\nTHE TEAM:\n${rosterText}\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{ "hasQuestion": false } or { "hasQuestion": true, "question": "...", "options": ["...", "...", "..."], "askedBy": "exact team member name" }\nIf hasQuestion is true, give 2-4 short mutually exclusive options — the manager can always type their own answer instead.`;
            const midCheckPrompt = `TASK:\n${getTaskWithClarifications()}${axesBlock}\n\nTHE PANEL'S INITIAL POSITIONS:\n${midCheckTranscript}`;
            const midCheckParsed = await callAgentForJson(facilitator, midCheckPrompt, midCheckInstruction, signal);

            if (midCheckParsed.hasQuestion === true && midCheckParsed.question && Array.isArray(midCheckParsed.options) && midCheckParsed.options.length >= 2) {
              const askedByAgent = panelists.find(a => a.name.toLowerCase() === String(midCheckParsed.askedBy || "").toLowerCase());
              setCollaborativePhase("The team has a question before continuing...");
              const answer = await askMidDiscussionQuestion({
                question: midCheckParsed.question,
                options: midCheckParsed.options,
                askedBy: askedByAgent?.id || customTeam[0].id
              }, signal);
              if (answer.trim()) {
                transcript = [...transcript, {
                  agentId: "manager",
                  agentName: "You (the manager)",
                  provider: "manager",
                  message: `Re: "${midCheckParsed.question}" — ${answer.trim()}`,
                  roundLabel: "Manager"
                }];
                logDebug("info", "Manager answered the team's mid-discussion question", `Q: ${midCheckParsed.question} · A: ${answer.trim()}`);
              } else {
                logDebug("info", "Manager skipped the team's mid-discussion question");
              }
            }
          } catch (midCheckErr: any) {
            logDebug("warn", "Mid-discussion question check failed — continuing without asking", midCheckErr?.message || midCheckErr);
          }
        }
        if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");

        // Validation / rebuttal rounds: each agent sees the full panel's latest positions
        // (including any questions directed at them) and must answer direct questions, challenge
        // weak reasoning, concede points that changed their mind, or refine their recommendation.
        // Set when a convergence check finds genuine disagreement: the next round budget is
        // spent on a focused two-person exchange at the crux instead of another full
        // broadcast round — cheaper (2 calls vs N) and higher-friction where it counts.
        let pendingExchange: { a: CustomAgent; b: CustomAgent; crux: string } | null = null;
        // Finding 1 fix — rolling context tracking across rounds (see compactOlderRounds).
        // recentRoundText starts as whatever's in the transcript so far (position round,
        // plus any mid-discussion Q&A) — exactly what round 1's prompt would have held
        // before this change, just tracked explicitly now instead of rebuilt from scratch
        // every iteration. focusedExchangesVerbatim is a separate, append-only, NEVER
        // summarized pool — a focused exchange is a compact, deliberately-orchestrated
        // moment, not generic back-and-forth, and folding it into the rolling summary would
        // lose exactly what it was built to preserve.
        let recentRoundText = transcript.map(t => `${t.agentName} (${t.provider}${t.roundLabel && t.roundLabel !== "Opening positions" ? `, ${t.roundLabel.toLowerCase()}` : ""}): ${t.message}`).join("\n\n");
        let olderRoundsSummary = "";
        let focusedExchangesVerbatim = "";

        for (let round = 1; round <= rebuttalRounds; round++) {
          if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");

          // Manager raise-hand: a note typed during the run is read into the record at the
          // next round boundary — legitimate mid-meeting interjection without stopping the run.
          if (managerInterjectionRef.current.trim()) {
            transcript = [...transcript, {
              agentId: "manager",
              agentName: "You (the manager)",
              provider: "manager",
              message: managerInterjectionRef.current.trim(),
              roundLabel: "Manager"
            }];
            logDebug("info", "Manager interjection read into the record at the round boundary", managerInterjectionRef.current.trim().slice(0, 160));
            managerInterjectionRef.current = "";
            setManagerInterjectionDraft("");
          }

          const priorRoundText = truncateText(
            [
              olderRoundsSummary ? `SUMMARY OF EARLIER ROUNDS:\n${olderRoundsSummary}` : "",
              focusedExchangesVerbatim ? `FOCUSED EXCHANGE(S) SO FAR (verbatim):\n${focusedExchangesVerbatim}` : "",
              `MOST RECENT ROUND (verbatim):\n${recentRoundText}`
            ].filter(Boolean).join("\n\n"),
            MAX_TRANSCRIPT_CHARS
          );

          // ---- Focused exchange consumes this round when the panel is genuinely split ----
          if (pendingExchange) {
            const { a, b, crux } = pendingExchange;
            pendingExchange = null;
            // The shared round label becomes the transcript divider — spec format:
            // "Focused exchange: A × B — crux" (crux truncated so the divider stays one line).
            const exchangeLabel = `Focused exchange: ${a.name} × ${b.name} — ${crux.length > 70 ? `${crux.slice(0, 70)}…` : crux}`;
            setCollaborativePhase(`Focused exchange: ${a.name} and ${b.name} work the crux...`);
            const exchangeBase = (agent: CustomAgent, extra: string) =>
              `You are an AI agent named "${agent.name}" in a multi-agent discussion. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\nThe facilitator has identified the crux of the panel's remaining disagreement as: "${crux}" and asked you and ${agent.id === a.id ? b.name : a.name} to work it directly while the rest of the panel listens. ${extra} Keep it to 3-5 sentences, engage the specific point (not generalities), and be explicit about what would change your mind.`;
            const aMessage = await callAgent(a, `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}\n\nPANEL'S DISCUSSION SO FAR:\n${priorRoundText}`, exchangeBase(a, `Open the exchange: state your side of the crux as concretely as you can.`), signal);
            transcript = [...transcript, { agentId: a.id, agentName: a.name, provider: a.provider, message: aMessage, roundLabel: exchangeLabel }];
            const bMessage = await callAgent(b, `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}\n\nPANEL'S DISCUSSION SO FAR:\n${priorRoundText}\n\n${a.name} JUST SAID (responding to the crux):\n${aMessage}`, exchangeBase(b, `Respond directly to ${a.name}'s point above — concede what's right in it, contest what isn't.`), signal);
            transcript = [...transcript, { agentId: b.id, agentName: b.name, provider: b.provider, message: bMessage, roundLabel: exchangeLabel }];
            roundsRun = round;
            // Always verbatim, never folded into olderRoundsSummary — see the declaration
            // above for why. recentRoundText/olderRoundsSummary are deliberately untouched
            // here; the exchange lives in its own permanent pool instead.
            focusedExchangesVerbatim = `${focusedExchangesVerbatim ? `${focusedExchangesVerbatim}\n\n` : ""}${a.name}: ${aMessage}\n\n${b.name}: ${bMessage}`;
            logDebug("info", `Focused exchange complete: ${a.name} × ${b.name}`, crux);
            checkpointRun();
            continue;
          }
          const roundLabel = rebuttalRounds > 1 ? `round ${round} of ${rebuttalRounds}` : "a validation round";
          setCollaborativePhase(rebuttalRounds > 1 ? `Validation round ${round} of ${rebuttalRounds}...` : "Checking and challenging each other's reasoning...");
          const isLastRound = round === rebuttalRounds;
          const rebuttals: CollaborativeTranscriptEntry[] = await settleRound(
            mapWithConcurrency(panelists, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
              const systemInstruction = `You are an AI agent named "${agent.name}" taking part in a multi-agent discussion. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\nYou are now in ${roundLabel}. Review the whole panel's latest positions below. First, if anyone asked you one or more direct questions, answer each of them. Then, in 3-6 sentences: identify the weakest claim or unexamined assumption in the panel's current thinking and challenge it explicitly (name whose point it is), validate points that are genuinely well-supported, concede points that changed your mind and say why, and refine your recommendation. Do not agree merely to be agreeable — surface real disagreement where it exists, and quantify your uncertainty where relevant.${isLastRound ? " This is the final round, so aim to converge: state your final recommendation and the single most important condition under which it would change. Do not pose new questions in this final round." : " If something still needs validating, you may end with one or more direct questions addressed to named panelists — to the same panelist or different ones — there is no limit to how many you may ask."}`;
              const fullPrompt = `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}\n\nPANEL'S LATEST POSITIONS:\n${priorRoundText}`;
              const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
              return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: `Validation round ${round}` };
            }),
            panelists,
            `validation round ${round}`,
            signal
          );
          transcript = [...transcript, ...rebuttals];
          roundsRun = round;
          logDebug("info", `Validation round ${round} of ${rebuttalRounds} complete`);
          checkpointRun();

          // Fold this round into the rolling context BEFORE the convergence check, and
          // unconditionally — if this lived inside the convergence check's try block, a
          // failed convergence check (network blip, provider hiccup) would silently drop
          // this round's content from every subsequent round's context, since the catch
          // below just "continues to the next round" without ever having updated tracking.
          let thisRoundText = "";
          if (round < rebuttalRounds) {
            thisRoundText = rebuttals.map(t => `${t.agentName} (${t.provider}): ${t.message}`).join("\n\n");
            try {
              olderRoundsSummary = await compactOlderRounds(olderRoundsSummary, recentRoundText, facilitator, getTaskWithClarifications(), signal);
              recentRoundText = thisRoundText;
            } catch (compactErr: any) {
              // Best-effort — fall back to raw concatenation for just this transition
              // rather than losing the round; the next successful compaction call
              // self-heals the size back down.
              logDebug("warn", "Context compaction failed — falling back to raw concatenation for this round", compactErr?.message || compactErr);
              recentRoundText = `${recentRoundText}\n\n${thisRoundText}`;
            }
          }

          // Convergence check: only worth the extra (cheap, short-output) call when rounds
          // remain to potentially skip. Saves time and cost on runs that settle early without
          // any quality loss — if genuine disagreement remains, the check says so and the
          // discussion just continues as normal.
          if (round < rebuttalRounds && !signal.aborted) {
            try {
              setCollaborativePhase("Checking whether the panel has converged...");
              const convergenceText = truncateText(
                [
                  olderRoundsSummary ? `SUMMARY OF EARLIER ROUNDS:\n${olderRoundsSummary}` : "",
                  focusedExchangesVerbatim ? `FOCUSED EXCHANGE(S) SO FAR (verbatim):\n${focusedExchangesVerbatim}` : "",
                  `MOST RECENT ROUND (verbatim):\n${recentRoundText}`
                ].filter(Boolean).join("\n\n"),
                MAX_TRANSCRIPT_CHARS
              );
              const convergenceReply = await callAgent(
                facilitator,
                `TASK:\n${getTaskWithClarifications()}\n\nPANEL'S DISCUSSION SO FAR:\n${convergenceText}`,
                `You are checking whether a multi-agent panel discussion has converged. Reply with EXACTLY one word and nothing else: CONVERGED if there is no more material disagreement and another round would mostly repeat existing points, or DISAGREEMENT if genuine unresolved disagreement remains that another round could productively address.`,
                signal
              );
              if (/^\s*CONVERGED/i.test(convergenceReply)) {
                logDebug("info", `Panel converged after validation round ${round} of ${rebuttalRounds} — skipping remaining round(s)`, "This saves time and cost with no expected loss of quality.");
                break;
              }
              // Genuine disagreement with rounds remaining: identify the crux and the two
              // most-opposed panelists, and spend the next round on their focused exchange.
              if (panelists.length >= 2) {
                try {
                  const cruxParsed = await callAgentForJson(
                    facilitator,
                    `TASK:\n${getTaskWithClarifications()}\n\nPANEL'S DISCUSSION SO FAR:\n${convergenceText}`,
                    `The panel has genuine unresolved disagreement. Identify the single crux and the two panelists most opposed on it. Respond with ONLY raw JSON: { "a": "exact name of the panelist most committed to one side", "b": "exact name of the panelist most opposed", "crux": "one sentence stating the disputed point" }. Names must be chosen from: ${panelists.map(p => p.name).join(", ")}.`,
                    signal
                  );
                  const agentA = panelists.find(p => p.name.toLowerCase() === String(cruxParsed.a || "").toLowerCase());
                  const agentB = panelists.find(p => p.name.toLowerCase() === String(cruxParsed.b || "").toLowerCase());
                  if (agentA && agentB && agentA.id !== agentB.id && typeof cruxParsed.crux === "string" && cruxParsed.crux.trim()) {
                    pendingExchange = { a: agentA, b: agentB, crux: cruxParsed.crux.trim() };
                    logDebug("info", `Disagreement persists — next round will be a focused exchange: ${agentA.name} × ${agentB.name}`, cruxParsed.crux.trim());
                  }
                } catch (cruxErr: any) {
                  logDebug("warn", "Crux identification failed — continuing with a normal round instead", cruxErr?.message || cruxErr);
                }
              }
            } catch (convErr: any) {
              // A failed convergence check should never block the discussion — just continue.
              logDebug("warn", "Convergence check failed — continuing to the next round", convErr?.message || convErr);
            }
          }
        }
        if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");

        // Dangling-question guarantee: no direct question posed in the closing act of the
        // debate goes unanswered into synthesis. Cheap scan, capped at two answer calls.
        try {
          const lastLabel = transcript.length > 0 ? transcript[transcript.length - 1].roundLabel : undefined;
          const closingEntries = transcript.filter(t => t.roundLabel === lastLabel && lastLabel && lastLabel !== "Manager");
          const addressed: { agent: CustomAgent; question: string; from: string }[] = [];
          for (const entry of closingEntries) {
            const matches = [...entry.message.matchAll(/Question for ([A-Za-z0-9 ._'-]{2,40})[:,]\s*([^\n]+)/g)];
            for (const m of matches) {
              const target = panelists.find(p => m[1].toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(m[1].trim().toLowerCase()));
              if (target && !addressed.some(x => x.agent.id === target.id) && addressed.length < 2) {
                addressed.push({ agent: target, question: m[2].trim(), from: entry.agentName });
              }
            }
          }
          if (addressed.length > 0 && !signal.aborted) {
            setCollaborativePhase(`Answering ${addressed.length} outstanding question${addressed.length === 1 ? "" : "s"} before closing...`);
            const closingText = truncateText(transcript.map(t => `${t.agentName}: ${t.message}`).join("\n\n"), MAX_TRANSCRIPT_CHARS);
            const answers = await settleRound(
              addressed.map(async ({ agent, question, from }) => {
                const message = await callAgent(
                  agent,
                  `${knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}\n\nPANEL'S DISCUSSION SO FAR:\n${closingText}`,
                  `You are an AI agent named "${agent.name}". Persona: ${agent.persona}\n\nBefore the panel closes, ${from} asked you directly: "${question}". Answer it in 2-4 sentences — this is the last word before synthesis, so be concrete.`,
                  signal
                );
                return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message, roundLabel: "Closing answers" };
              }),
              addressed.map(x => x.agent),
              "closing answers",
              signal
            );
            transcript = [...transcript, ...answers];
            logDebug("info", `Answered ${answers.length} dangling question(s) before synthesis`);
            checkpointRun();
          }
        } catch (danglingErr: any) {
          logDebug("warn", "Dangling-question scan failed — proceeding to synthesis", danglingErr?.message || danglingErr);
        }
        if (signal.aborted) throw new DOMException("Discussion stopped by user.", "AbortError");

        setCollaborativePhase("Synthesizing the outcome and building the decision tree...");
        // Final round: a facilitator (first agent in the roster) synthesizes the discussion into
        // a single outcome, reasoning, and a probability-weighted decision tree.
        const transcriptText = truncateText(
          transcript.map(t => `${t.agentName} (${t.provider}): ${t.message}`).join("\n\n"),
          MAX_TRANSCRIPT_CHARS
        );

        const considerationsRequested = discussionDepth !== "fast";
        const considerationsBlock = considerationsRequested
          ? `\n\nAlso extract the genuinely load-bearing considerations the panel weighed while reaching this — assumptions, risks, constraints, or tradeoffs. Not everything said; only what a manager would actually want visibility into. Each one can apply to a single branch or several at once. Mark flaggedForReview: true only for the small subset (realistically 0-3) that are uncertain or consequential enough to proactively put in front of the manager — everything else still gets recorded, just not flagged.`
          : "";
        const considerationsSchemaBlock = considerationsRequested
          ? `,\n  "considerations": [\n    { "id": "c1", "text": "short statement of the assumption/risk/constraint/tradeoff", "category": "assumption" | "risk" | "constraint" | "tradeoff", "raisedByName": "exact team member name", "linkedNodeIds": ["n2", "n3"], "flaggedForReview": true, "alternatives": ["a short alternative position the manager might reasonably take instead", "another distinct alternative"] }\n  ]`
          : "";
        const synthesisInstruction = `You are the neutral facilitator of a multi-agent panel.${playerCoachCheck} ${resourceScope}\n\n${depthInstruction}${constraintBlock}${axesBlock}\n\nYou will be given the original task and each panel member's stated position, along with ${roundsRun} follow-up validation round(s) in which panelists questioned and challenged each other. Your job is to converge these positions into ONE defined overall outcome that addresses every decision axis above. Weigh arguments by the quality of their evidence, not by how often they were repeated, and reflect any unresolved disagreement in the branch probabilities rather than papering over it. Also decide whether the panel can confidently call this decided, or whether they genuinely need something from the manager first (missing information, an ambiguous requirement) — only flag that if a real gap surfaced in the discussion, not by default.${considerationsBlock}\n\nRespond with ONLY a raw JSON object (no markdown, no commentary) in exactly this shape:\n{\n  "outcome": "a clear, concise statement of the final decided outcome (covering all axes)",\n  "reasons": [${isDeep ? "\"short reason 1\", \"short reason 2\", \"short reason 3\", \"short reason 4\", \"short reason 5\"" : "\"short reason 1\", \"short reason 2\", \"short reason 3\""}],\n  "status": "delivered" | "needs_input",\n  "statusNote": "if needs_input, 1-2 sentences on what's needed — otherwise omit",\n  "dissent": [\n    { "agentName": "exact panelist name", "position": "1-2 sentence summary of their unresolved objection to the outcome you are declaring", "wouldChangeIf": "the concrete condition under which the outcome should be revisited" }\n  ],\n  "decisionTree": [\n    { "id": "n1", "parentId": null, "label": "root branch point description", "probability": 100, "isSelected": true, "reason": "one short sentence explaining why this is a starting decision point" },\n    { "id": "n2", "parentId": "n1", "label": "option A description", "probability": 62, "isSelected": true, "reason": "one short, plain-language sentence explaining why this branch has this likelihood" },\n    { "id": "n3", "parentId": "n1", "label": "option B description", "probability": 38, "isSelected": false, "reason": "one short, plain-language sentence explaining why this branch has this likelihood" }\n  ],\n  "structuralChangeNote": null | "only if you changed something outside the direct scope of this discussion — see the rule below"${considerationsSchemaBlock}\n}\n\nRules for the decisionTree: IMPORTANT — do NOT force everything under a single root. Create one root-level node (parentId: null) for EACH independent decision axis identified above; a task with two independent axes should produce two separate root nodes, each with its own branches beneath it, not one artificially nested under the other. Only nest an axis's node under another node when that axis is genuinely dependent on how the other resolves. Beneath each root, add ${isDeep ? "3-5" : "2-4"} child branches at each divide point representing the alternatives considered, each with a probability (0-100, siblings should sum to ~100) reflecting how likely that branch is to be the right path given the panel's discussion. Every node MUST include a "reason" field: a brief, easy-to-understand, plain-language sentence explaining why the panel arrived at that probability for that branch. Mark the branch(es) that lead to the final outcome with isSelected: true. Capture the FULL depth of each independent decision — keep nesting further child levels under branches wherever the discussion identified a subsequent choice, consequence, or divide point (do not artificially stop at two or three levels; follow every meaningful chain of decisions to its natural end, including deeper levels under non-selected branches where the panel discussed what would follow from them).${isDeep ? ` The manager chose ${discussionDepth === "extended" ? "Multiple Rounds" : "Deep Discussion"} specifically to get a more detailed tree back, not just more confidence in the same one — treat that as a requirement. This ran ${roundsRun} validation round(s); mine that back-and-forth for structure the way a thorough analyst would: for EVERY selected branch, add at least one further nested level examining a concrete consequence, risk, dependency, or follow-on choice — grounded in what the discussion touched on, or what a thorough analyst would flag as the obvious next consideration from that branch, even if it wasn't debated in those exact words.${discussionDepth === "extended" ? " At this depth, go further still: the highest-priority branch(es) should carry at least two nested levels beyond the original axis, not one." : ""} A tree with the same shape as a Fast run on the same task is not an acceptable outcome at this depth.` : ""} Use unique ids for every node. MINORITY VIEWS: if any panelist's final statements maintained material disagreement with the outcome you are declaring, you MUST record it in the "dissent" array — do not average it away; use an empty array only if the panel genuinely converged.${forcedConstraint ? ` The user-forced constraint above MUST be reflected in the tree: the branch(es) matching it must be isSelected: true with probability 100 at that divide point — AND that pinned branch must carry a "mandateNote" field: one sentence stating the panel's honest unforced assessment of it (roughly what probability the panel would have given it unforced, and its chief risk). The mandate is recorded as a mandate, never as unanimous conviction.` : ""}${domainExpertInstructionSuffix}${preserveTreeInstructionBlock}`;

        const synthesisPrompt = `${knowledgeContext}\n\nORIGINAL TASK:\n${getTaskWithClarifications()}\n\nPANEL DISCUSSION:\n${transcriptText}${preserveTreeDataBlock}`;

        let parsed: any;
        try {
          parsed = await callAgentForJson(facilitator, synthesisPrompt, synthesisInstruction, signal);
        } catch (parseErr: any) {
          logDebug("error", "Failed to parse facilitator's synthesis JSON after a re-ask", parseErr?.message || parseErr);
          throw parseErr;
        }

        resultOutcome = parsed.outcome || "No outcome returned.";
        resultReasons = Array.isArray(parsed.reasons) ? parsed.reasons : [];
        resultDecisionTree = Array.isArray(parsed.decisionTree) ? parsed.decisionTree : [];
        if (parsed.status === "needs_input") {
          resultStatus = "needs_input";
          resultStatusNote = typeof parsed.statusNote === "string" ? parsed.statusNote : undefined;
        }
        if (typeof parsed.structuralChangeNote === "string" && parsed.structuralChangeNote.trim()) {
          resultStructuralChangeNote = parsed.structuralChangeNote.trim();
        }
        if (considerationsRequested && Array.isArray(parsed.considerations)) {
          resultConsiderations = parsed.considerations
            .filter((c: any) => c?.text)
            .map((c: any, i: number) => ({
              id: c.id || `cons_${Date.now()}_${i}`,
              text: c.text,
              category: ["assumption", "risk", "constraint", "tradeoff"].includes(c.category) ? c.category : "assumption",
              raisedByAgentId: customTeam.find(a => a.name.toLowerCase() === String(c.raisedByName || "").toLowerCase())?.id || facilitator.id,
              linkedNodeIds: Array.isArray(c.linkedNodeIds) ? c.linkedNodeIds : [],
              flaggedForReview: c.flaggedForReview === true,
              alternatives: Array.isArray(c.alternatives) ? c.alternatives.filter((a: any) => typeof a === "string" && a.trim()).slice(0, 3) : undefined
            }));
        }
        if (Array.isArray(parsed.dissent)) {
          resultDissent = parsed.dissent
            .filter((d: any) => d?.agentName && d?.position)
            .map((d: any) => ({
              agentName: String(d.agentName),
              position: String(d.position),
              wouldChangeIf: typeof d.wouldChangeIf === "string" ? d.wouldChangeIf : ""
            }));
        }
      }

      // Layer 2 of the re-discussion data-loss fix: a plain structural diff against the
      // pre-revision tree, independent of whatever the facilitator claimed via
      // structuralChangeNote — this catches cases where Layer 1's preserve instruction
      // wasn't perfectly followed, not just cases where it was followed and disclosed.
      const preservationWarnings = treeToPreserve && treeToPreserve.decisionTree.length > 0
        ? computeLostCuratedContent(treeToPreserve.decisionTree, resultDecisionTree)
        : undefined;

      const newRun: CollaborativeRun = {
        id: runId,
        timestamp: runStartedIso,
        prompt: effectivePrompt,
        transcript,
        outcome: resultOutcome,
        reasons: resultReasons,
        decisionTree: resultDecisionTree,
        rounds: 1 + roundsRun,
        plannedRounds: rebuttalRounds,
        forcedConstraint: forcedConstraint || undefined,
        axes: axes.length > 0 ? axes : undefined,
        taskType,
        taskTypeSource,
        requirementsLog,
        structuralChangeNote: resultStructuralChangeNote,
        preservationWarnings: preservationWarnings && preservationWarnings.length > 0 ? preservationWarnings : undefined,
        deliverable: resultDeliverable,
        status: resultStatus,
        statusNote: resultStatusNote,
        facilitatorAgentName: facilitator.name,
        dissent: resultDissent.length > 0 ? resultDissent : undefined,
        premiseAmendments: premiseAmendments || undefined,
        managerFeedback: managerFeedback || undefined,
        groundedSourceCount: contentBearingKnowledgeFiles.length,
        groundedSourceIds: getGroundedSourceIds(),
        considerations: resultConsiderations,
        history: collaborativeRun
          ? [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, forcedConstraint ? `Forced: ${forcedConstraint}` : "Refreshed / re-discussed")]
          : undefined
      };

      setCollaborativeRun(newRun);
      recordRevisitOnSourceRun(newRun.id);
      // Replace-if-present rather than a plain prepend: this run's id was already added to
      // collaborativeHistory as its initial "in_progress" checkpoint the moment Start
      // Discussion was clicked (see runId/initialCheckpoint above), so a bare prepend here
      // would leave that same run appearing twice in the list until the next reload. The
      // `some` fallback keeps this safe even if that initial checkpoint save somehow failed.
      setCollaborativeHistory(prev => (prev.some(r => r.id === newRun.id) ? prev.map(r => (r.id === newRun.id ? newRun : r)) : [newRun, ...prev]));
      checkpointRunRef.current = null;
      saveHistoryEntry("collaborative", newRun);
      void updateTeamRetroMemory(newRun, facilitator, teamNotes);
      logDebug("info", "Collaborative discussion completed", `${((Date.now() - startedAt) / 1000).toFixed(1)}s, ${newRun.rounds} round(s), ${resultDecisionTree.length} decision node(s), status: ${resultStatus}`);

      const detectedKind = detectFileRequest(effectivePrompt);
      if (detectedKind) {
        const dissentText = resultDissent.length > 0
          ? `\n\nMinority views (recorded dissent):\n${resultDissent.map(d => `- ${d.agentName}: ${d.position}${d.wouldChangeIf ? ` (revisit if: ${d.wouldChangeIf})` : ""}`).join("\n")}`
          : "";
        const combinedText = `Outcome: ${resultOutcome}\n\nReasons:\n${resultReasons.join("\n")}${dissentText}\n\nDecision tree:\n${treeToExportText(resultDecisionTree)}`;
        createMainFile(detectedKind, combinedText);
      }

      if (!signal.aborted) {
        setCollaborativePhase("Checking if the team has any questions for you...");
        await checkInWithManager(newRun, signal);
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        logDebug("info", "Collaborative discussion stopped by user", `after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
        setCollaborativeError("Discussion stopped.");
        if (checkpointRunRef.current) {
          const stoppedRun: CollaborativeRun = { ...checkpointRunRef.current, status: "failed", statusNote: "Stopped by user before completion." };
          setCollaborativeHistory(prev => prev.map(r => (r.id === stoppedRun.id ? stoppedRun : r)));
          saveHistoryEntry("collaborative", stoppedRun);
        }
      } else {
        console.error("Error running collaborative session:", error);
        logDebug("error", "Collaborative discussion failed", error?.message || error);
        const classification = classifyAgentError(error);
        setCollaborativeError(classification.isUnrecoverable && classification.reason ? unrecoverableErrorGuidance(classification.reason) : (error.message || "Failed to run collaborative session."));
        // The initial checkpoint (saved the instant Start Discussion was clicked) guarantees
        // checkpointRunRef always has SOMETHING even if the failure happened before the
        // position round finished — this is the fix for conversations that "disappeared"
        // when the team never completed: previously nothing was ever saved on this path at
        // all, however far the discussion had actually gotten.
        if (checkpointRunRef.current) {
          const failedRun: CollaborativeRun = { ...checkpointRunRef.current, status: "failed", statusNote: error?.message || "Discussion failed before completing." };
          setCollaborativeHistory(prev => prev.map(r => (r.id === failedRun.id ? failedRun : r)));
          saveHistoryEntry("collaborative", failedRun);
        }
      }
    } finally {
      setCollaborativeLoading(false);
      setCollaborativePhase("");
      runAbortRef.current = null;
      collaborativeRunInFlightRef.current = false;
      checkpointRunRef.current = null;
    }
  };

  // Edits to the pending outline before sign-off: heading, brief, author, add/remove a
  // section. All operate on local state only — nothing is sent to the team until approved.
  const updateOutlineSection = (id: string, field: "heading" | "brief" | "authorAgentId", value: string) => {
    setPendingOutline(prev => prev ? { ...prev, sections: prev.sections.map(s => (s.id === id ? { ...s, [field]: value } : s)) } : null);
  };
  const removeOutlineSection = (id: string) => {
    setPendingOutline(prev => prev ? { ...prev, sections: prev.sections.filter(s => s.id !== id) } : null);
  };
  const addOutlineSection = () => {
    setPendingOutline(prev => {
      if (!prev) return null;
      const newSection: PendingOutlineSection = { id: `sec_${Date.now()}`, heading: "New section", brief: "", independent: true, authorAgentId: customTeam[0]?.id || "" };
      return { ...prev, sections: [...prev.sections, newSection] };
    });
  };

  // Decision-path counterparts to the three functions just above — same shape, applied to
  // pendingAxes.axes instead of pendingOutline.sections. suggestedAgentName is matched by
  // exact name (same convention decomposition itself uses), not stored as an agent id, since
  // DecisionAxis already carries the field that way.
  const updateAxisField = (id: string, field: "label" | "description" | "suggestedAgentName", value: string) => {
    setPendingAxes(prev => prev ? { ...prev, axes: prev.axes.map(a => (a.id === id ? { ...a, [field]: value } : a)) } : null);
  };
  const removeAxis = (id: string) => {
    setPendingAxes(prev => prev ? { ...prev, axes: prev.axes.filter(a => a.id !== id) } : null);
  };
  const addAxis = () => {
    setPendingAxes(prev => {
      if (!prev) return null;
      const newAxis: DecisionAxis = {
        id: `ax_${Date.now()}`,
        label: "New decision point",
        description: "",
        independent: true,
        priority: prev.axes.length + 1,
        suggestedAgentName: customTeam[0]?.name
      };
      return { ...prev, axes: [...prev.axes, newAxis] };
    });
  };

  // Discards the axes without discussing anything — the decision-path equivalent of
  // cancelPendingOutline. Nothing was ever run beyond decomposition, so there's nothing to
  // clean up beyond clearing the pending state itself.
  const cancelPendingAxes = () => {
    setPendingAxes(null);
    logDebug("info", "Decision axes discarded before discussion — no result was saved.");
  };

  // Resumes runCollaborativeSession with the manager's finalized axes, replaying the
  // original call's other arguments verbatim (see PendingDecisionAxes) — the decision-path
  // equivalent of approveOutlineAndDraft, except it re-enters the SAME function rather than
  // a separate continuation, since nothing had happened yet beyond decomposition that would
  // need duplicating out of runCollaborativeSession's decision-path body.
  const approveAxesAndDiscuss = () => {
    if (!pendingAxes || pendingAxes.axes.length === 0) return;
    const { axes, taskTypeSource, forcedConstraint, premiseAmendments, managerFeedback, promptOverride, blockingAnswer, requirementEntries } = pendingAxes;
    setPendingAxes(null);
    runCollaborativeSession(forcedConstraint, "decision", premiseAmendments, managerFeedback, promptOverride, blockingAnswer, requirementEntries, { axes, taskTypeSource });
  };


  // Discards the outline without drafting anything — equivalent to the manager saying "not
  // like this," with no result saved anywhere.
  const cancelPendingOutline = () => {
    setPendingOutline(null);
    logDebug("info", "Outline discarded before drafting — no result was saved.");
  };

  // Drafts the approved outline: independent sections first, then dependent sections with the
  // independent ones' actual content in view — same mechanics as before, just triggered by
  // manager sign-off instead of running automatically right after the outline was compiled.
  const approveOutlineAndDraft = async () => {
    if (!pendingOutline || pendingOutline.sections.length === 0 || customTeam.length === 0) return;
    const outline = pendingOutline;
    setPendingOutline(null);
    setCollaborativeError(null);
    setCollaborativeLoading(true);
    setCallCount(0);
    setDraftingOutlineSections(outline.sections);
    setDraftingSectionStatus(Object.fromEntries(outline.sections.map(s => [s.id, s.independent ? "drafting" : "pending"])));

    const controller = new AbortController();
    runAbortRef.current = controller;
    const signal = controller.signal;
    // Use the same facilitator who compiled this outline (stored on the pending outline);
    // fall back to the roster head for outlines recorded before attribution existed.
    const facilitator = (outline.facilitatorAgentName && customTeam.find(a => a.name === outline.facilitatorAgentName)) || customTeam[0];

    try {
      const resolvedSections = outline.sections.map(s => ({
        ...s,
        author: customTeam.find(a => a.id === s.authorAgentId) || facilitator
      }));
      const otherHeadings = resolvedSections.map(s => s.heading);
      const independentSections = resolvedSections.filter(s => s.independent);
      const dependentSections = resolvedSections.filter(s => !s.independent);
      const draftedById = new Map<string, string>();

      const draftSectionGroup = async (group: typeof resolvedSections, priorContentBlock: string, label: string) => {
        if (group.length === 0) return;
        setDraftingSectionStatus(prev => {
          const next = { ...prev };
          group.forEach(sec => { next[sec.id] = "drafting"; });
          return next;
        });
        const results = await settleRound(
          group.map(sec => (async () => {
            const agent = sec.author;
            const systemInstruction = `You are an AI agent named "${agent.name}" drafting one section of a team deliverable. Persona: ${agent.persona}\n\n${outline.resourceScope}\n\n${outline.depthInstruction}\n\nDeliverable title: "${outline.title}"\nYour section: "${sec.heading}" — ${sec.brief}\n\nOther section headings in this deliverable (for awareness — do not repeat their content): ${otherHeadings.filter(h => h !== sec.heading).join("; ") || "none"}${priorContentBlock}\n\nWrite clear, well-structured, professional prose for YOUR section only, as if it's going straight into the finished deliverable. Do not restate the section heading — just the content.`;
            const fullPrompt = `${outline.knowledgeContext}\n\nTASK:\n${getTaskWithClarifications()}`;
            const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
            // Update the moment THIS section lands, not when the whole group finishes — that's
            // the actual milestone visibility, since settleRound only resolves as a batch.
            setDraftingSectionStatus(prev => ({ ...prev, [sec.id]: "done" }));
            return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message };
          })()),
          group.map(s => s.author),
          label,
          signal
        );
        group.forEach((sec, i) => draftedById.set(sec.id, results[i]?.message || "[This section could not be drafted this round — try regenerating.]"));
      };

      setCollaborativePhase(`Drafting ${independentSections.length} independent section${independentSections.length === 1 ? "" : "s"}...`);
      await draftSectionGroup(independentSections, "", "drafting independent deliverable sections");

      if (dependentSections.length > 0) {
        if (signal.aborted) throw new DOMException("Drafting stopped by user.", "AbortError");
        setCollaborativePhase(`Drafting ${dependentSections.length} dependent section${dependentSections.length === 1 ? "" : "s"}...`);
        const priorContentBlock = independentSections.length > 0
          ? `\n\nAlready-drafted sections this may depend on (read these before writing yours, and stay consistent with them):\n${independentSections.map(s => `## ${s.heading}\n${draftedById.get(s.id) || ""}`).join("\n\n")}`
          : "";
        await draftSectionGroup(dependentSections, priorContentBlock, "drafting dependent deliverable sections");
      }

      const resultDeliverable: DeliverableSpec = {
        title: outline.title,
        subtitle: outline.subtitle,
        sections: resolvedSections.map(sec => ({
          id: sec.id,
          heading: sec.heading,
          authorAgentId: sec.author.id,
          authorAgentName: sec.author.name,
          content: draftedById.get(sec.id) || "[This section could not be drafted this round — try regenerating.]"
        }))
      };

      let resultStatus: RunStatus = "delivered";
      let resultStatusNote: string | undefined;
      try {
        setCollaborativePhase("Reviewing the draft for completeness...");
        const statusInstruction = `You are the neutral facilitator reviewing a just-drafted team deliverable. Decide whether the team can confidently call this delivered, or whether they genuinely need something from the manager (missing information, an ambiguous requirement, access to something not provided) before it's truly complete. Only flag "needs_input" if a section's draft actually surfaces a real gap — do not invent one just to be thorough.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{ "status": "delivered" | "needs_input", "statusNote": "if needs_input, 1-2 sentences on what's needed and from which section — otherwise omit" }`;
        const statusPrompt = `TASK:\n${getTaskWithClarifications()}\n\nDRAFTED SECTIONS:\n${resultDeliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}`;
        const statusParsed = await callAgentForJson(facilitator, statusPrompt, statusInstruction, signal);
        if (statusParsed.status === "needs_input") {
          resultStatus = "needs_input";
          resultStatusNote = typeof statusParsed.statusNote === "string" ? statusParsed.statusNote : undefined;
        }
      } catch (statusErr: any) {
        logDebug("warn", "Completeness check failed — defaulting to delivered", statusErr?.message || statusErr);
      }

      const newRun: CollaborativeRun = {
        id: `run_${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: customPrompt,
        transcript: outline.transcript,
        outcome: "",
        reasons: [],
        // Deliverable runs previously never got a decision tree at all (hardcoded to []),
        // even though the same "why was this addressed, and how" question applies to a
        // deliverable's structure as much as a decision's branches. Built deterministically
        // from the axes already identified during decomposition — no new LLM call needed.
        decisionTree: outline.axes.length > 0 ? buildDeliverableDecisionTree(outline.axes, resultDeliverable.sections) : [],
        rounds: 1 + outline.roundsRun,
        forcedConstraint: outline.forcedConstraint,
        axes: outline.axes.length > 0 ? outline.axes : undefined,
        taskType: "deliverable",
        taskTypeSource: outline.taskTypeSource,
        requirementsLog: outline.requirementsLog,
        deliverable: resultDeliverable,
        groundedSourceCount: contentBearingKnowledgeFiles.length,
        groundedSourceIds: getGroundedSourceIds(),
        status: resultStatus,
        statusNote: resultStatusNote,
        facilitatorAgentName: facilitator.name,
        history: collaborativeRun
          ? [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, "Refreshed / re-discussed")]
          : undefined
      };

      setCollaborativeRun(newRun);
      setCollaborativeHistory(prev => [newRun, ...prev]);
      saveHistoryEntry("collaborative", newRun);
      logDebug("info", "Deliverable drafting completed", `${resultDeliverable.sections.length} section(s), status: ${resultStatus}`);

      const detectedKind = detectFileRequest(customPrompt);
      if (detectedKind) {
        const combinedText = `${resultDeliverable.title}\n\n${resultDeliverable.sections.map(s => `## ${s.heading}\n${s.content}`).join("\n\n")}`;
        createMainFile(detectedKind, combinedText);
      }

      if (!signal.aborted) {
        setCollaborativePhase("Checking if the team has any questions for you...");
        await checkInWithManager(newRun, signal);
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        logDebug("info", "Deliverable drafting stopped by user");
        setCollaborativeError("Drafting stopped.");
      } else {
        console.error("Error drafting the approved outline:", error);
        logDebug("error", "Deliverable drafting failed", error?.message || error);
        const classification = classifyAgentError(error);
        setCollaborativeError(classification.isUnrecoverable && classification.reason ? unrecoverableErrorGuidance(classification.reason) : (error.message || "Failed to draft the deliverable."));
      }
    } finally {
      setCollaborativeLoading(false);
      setCollaborativePhase("");
      runAbortRef.current = null;
      collaborativeRunInFlightRef.current = false;
      setDraftingOutlineSections(null);
      setDraftingSectionStatus({});
    }
  };

  const handleKeyChange = (agent: string, value: string) => {
    const nextKeys = { ...keys, [agent]: value };
    setKeys(nextKeys);
    // saveSettings(nextKeys, models); // Removed auto-save
    
    // Auto-disable agent if key is removed
    if (!value) {
      setEnabledAgents(prev => ({ ...prev, [agent]: false }));
    }
  };

  const handleModelChange = (agent: string, value: string) => {
    const nextModels = { ...models, [agent]: value };
    setModels(nextModels);
    // saveSettings(keys, nextModels); // Removed auto-save
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    setProfileStatus("Updating profile...");
    try {
      await updateProfile(user, {
        displayName: profileName,
        photoURL: profilePhoto
      });
      setProfileStatus("Profile updated successfully!");
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      logDebug("error", "Failed to update profile", error?.message || error);
      setProfileStatus(`Error: ${error.message}`);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !newPassword) return;
    setProfileStatus("Updating password...");
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setProfileStatus("Password updated successfully!");
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      logDebug("error", "Failed to update password", error?.message || error);
      setProfileStatus(`Error: ${error.message}`);
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout error:", error);
      logDebug("error", "Logout failed", error?.message || error);
    }
  };

  const combinedReport = useMemo(() => {
    const activeResults = [
      { id: "gemini", name: "Gemini", res: results.gemini },
      { id: "anthropic", name: "Claude", res: results.anthropic },
      { id: "openai", name: "OpenAI", res: results.openai },
      { id: "perplexity", name: "Perplexity", res: results.perplexity },
      { id: "grok", name: "Grok", res: results.grok },
    ].filter(agent => enabledAgents[agent.id as keyof typeof enabledAgents] && agent.res);

    if (activeResults.length === 0) return "";
    
    return activeResults
      .map(
        (agent) => {
          const text = typeof agent.res === 'string' ? agent.res : agent.res.text;
          const imageInfo = typeof agent.res !== 'string' && agent.res.image ? `\n[Image Generated]` : "";
          return `Response from Agent: ${agent.name}\nResponse Text: ${text}${imageInfo}\n---------------`;
        }
      )
      .join("\n");
  }, [results, enabledAgents]);

  const handleToolCalls = async (agentId: string, text: string) => {
    if (typeof text !== 'string') return text;
    
    try {
      let trimmed = text.trim();
      
      // Try to find a JSON block if the text isn't purely JSON
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        trimmed = jsonMatch[0];
      }

      // Remove markdown code blocks if still present
      if (trimmed.startsWith('```json')) {
        trimmed = trimmed.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      } else if (trimmed.startsWith('```')) {
        trimmed = trimmed.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
      }

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        let toolCall;
        try {
          toolCall = JSON.parse(trimmed);
        } catch (e) {
          console.error("JSON Parse Error in handleToolCalls:", e);
          return text;
        }
        
        // Handle image generation tool calls
        if (toolCall.action === "dalle.text2im" || toolCall.action === "generate_image") {
          let imagePrompt = toolCall.prompt;
          
          if (!imagePrompt && toolCall.action_input) {
            if (typeof toolCall.action_input === 'string') {
              try {
                const input = JSON.parse(toolCall.action_input);
                imagePrompt = input.prompt;
              } catch (e) {
                imagePrompt = toolCall.action_input;
              }
            } else {
              imagePrompt = toolCall.action_input.prompt;
            }
          }

          if (imagePrompt) {
            setStatus(`Agent ${agentId} is generating an image...`);
            try {
              const imageUrl = await generateImageContent(imagePrompt, keys.gemini || undefined);
              if (imageUrl) {
                return {
                  text: toolCall.thought || toolCall.description || `Generated image for: ${imagePrompt}`,
                  image: imageUrl,
                  isToolCall: true
                };
              } else {
                return {
                  text: (toolCall.thought || toolCall.description || "") + "\n\n(Image generation returned no data. Please check your API key and model availability.)",
                  isToolCall: true
                };
              }
            } catch (err: any) {
              console.error("Image Generation Error:", err);
              logDebug("error", "Image generation failed", err?.message || err);
              return {
                text: (toolCall.thought || toolCall.description || "") + `\n\n(Image generation failed: ${err.message})`,
                isToolCall: true
              };
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Error in handleToolCalls:", e);
      logDebug("warn", "Error while checking response for a tool call", e?.message || e);
    }
    return text;
  };

  const runExecution = async () => {
    if (!prompt) return;
    
    const activeAgents = Object.entries(enabledAgents).filter(([_, enabled]) => enabled).map(([id]) => id);
    if (activeAgents.length === 0) {
      setStatus("Please enable at least one agent.");
      return;
    }

    // Determine lead agent
    let currentLead = leadAgentId;
    if (!currentLead || !enabledAgents[currentLead as keyof typeof enabledAgents]) {
      currentLead = activeAgents[0];
    }

    setLoading(true);
    setResults({ gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" });
    setAggregatedReview("");
    logDebug("info", `Started Agent Comparison run with agents: ${activeAgents.join(", ")}`, `format: ${outputFormat}, prompt: ${prompt.slice(0, 200)}`);

    const promptSnapshot = prompt;
    const outputFormatSnapshot = outputFormat;
    const enabledAgentsSnapshot = { ...enabledAgents };
    let lastProcessedResults: Results = { gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" };
    let lastProcessedReview: string | AgentResult = "";

    try {
      let currentPrompt = prompt;
      let lastAggregatedText = "";
      const totalLoops = loopingEnabled ? maxLoops : 1;

      for (let i = 0; i < totalLoops; i++) {
        const loopStatus = totalLoops > 1 ? ` (Loop ${i + 1}/${totalLoops})` : "";
        setStatus(`Executing multi-agent request${loopStatus}...`);

        if (i > 0) {
          currentPrompt = `Original Prompt: ${prompt}\n\nPrevious Aggregated Research Data:\n${lastAggregatedText}\n\nTask: Consider all points raised in the data supplied above as part of your validation and research. Provide an updated and improved response.`;
        }

        const promises = [];
        
        if (enabledAgents.gemini) {
          promises.push(generateGeminiContent(currentPrompt, keys.gemini || undefined).then(res => ({ agent: "gemini", text: res })));
        }

        const otherAgentsToCall = activeAgents.filter(id => id !== "gemini");
        if (otherAgentsToCall.length > 0) {
          const othersPromise = axios.post("/api/execute-others", { 
            prompt: currentPrompt, 
            keys, 
            models,
            agents: otherAgentsToCall 
          }, { timeout: DEFAULT_MODEL_CALL_TIMEOUT_MS }).then(res => res.data);
          promises.push(othersPromise);
        }

        const allResults = await Promise.all(promises);
        const rawResults: any = {};

        allResults.flat().forEach((item: any) => {
          if (item && item.agent) {
            rawResults[item.agent] = item.text;
          }
        });

        // Process tool calls in parallel
        const processedResults: Results = { gemini: "", anthropic: "", openai: "", perplexity: "", grok: "" };
        const toolCallPromises = Object.entries(rawResults).map(async ([agentId, text]) => {
          const processed = await handleToolCalls(agentId, text as string);
          return { agentId, processed };
        });
        
        const processedList = await Promise.all(toolCallPromises);
        processedList.forEach(({ agentId, processed }) => {
          // @ts-ignore
          processedResults[agentId] = processed;
        });

        setResults(processedResults);
        lastProcessedResults = processedResults;
        
        // Phase 2: Lead Agent Review
        setStatus(`Lead agent (${currentLead}) is reviewing responses${loopStatus}...`);
        
        lastAggregatedText = Object.entries(processedResults)
          .filter(([id, res]) => enabledAgents[id as keyof typeof enabledAgents] && res)
          .map(([id, res]) => {
            const text = typeof res === 'string' ? res : res.text;
            return `Agent ${id}: ${text}`;
          })
          .join("\n\n");

        const reviewPrompt = `You are the Lead Agent. Review the following responses from different AI agents to the prompt: "${prompt}".
        
        Responses:
        ${lastAggregatedText}
        
        Provide a consolidated response in the following format: ${outputFormat}.
        Your goal is to synthesize the best information from all agents into a single high-quality output.`;

        let reviewText = "";
        if (currentLead === "gemini") {
          reviewText = await generateGeminiContent(reviewPrompt, keys.gemini || undefined);
        } else {
          const reviewRes = await axios.post("/api/execute-others", {
            prompt: reviewPrompt,
            keys,
            models,
            agents: [currentLead]
          }, { timeout: DEFAULT_MODEL_CALL_TIMEOUT_MS });
          reviewText = reviewRes.data[0]?.text || "Error generating review.";
        }

        const images = Object.values(processedResults)
          .filter(res => typeof res !== 'string' && res.image)
          .map(res => (res as AgentResult).image!);

        const processedReview = await handleToolCalls(currentLead, reviewText);

        if (typeof processedReview === 'string') {
          const reviewWithImage: string | AgentResult = {
            text: processedReview,
            image: images.length > 0 ? images[0] : undefined
          };
          setAggregatedReview(reviewWithImage);
          lastProcessedReview = reviewWithImage;
        } else {
          setAggregatedReview(processedReview);
          lastProcessedReview = processedReview;
        }
      }

      setStatus("Execution complete.");
      setIsAggregatedOpen(true);
      logDebug("info", "Agent Comparison run completed");

      const comparisonRun: ComparisonRun = {
        id: `cmp_${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: promptSnapshot,
        outputFormat: outputFormatSnapshot,
        enabledAgents: enabledAgentsSnapshot,
        results: lastProcessedResults,
        aggregatedReview: lastProcessedReview
      };
      setComparisonHistory(prev => [comparisonRun, ...prev]);
      saveHistoryEntry("comparison", comparisonRun);
    } catch (error: any) {
      console.error("Execution Failed", error);
      logDebug("error", "Agent Comparison run failed", error?.message || error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const agents = [
    { id: "gemini", name: "Gemini", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "anthropic", name: "Claude", icon: Cpu, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "openai", name: "OpenAI", icon: Atom, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "perplexity", name: "Perplexity", icon: Globe, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { id: "grok", name: "Grok", icon: Zap, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  ];

  // Combines history from Agent Comparison Playground and Multi Agent Team (both chat modes)
  // into a single, newest-first list for the Chat History tab.
  const unifiedHistory: UnifiedHistoryEntry[] = useMemo(() => {
    const truncateSummary = (text: string, max = 100) =>
      text.length > max ? `${text.slice(0, max).trim()}…` : text;

    const entries: UnifiedHistoryEntry[] = [
      ...comparisonHistory.map(run => ({
        id: run.id,
        timestamp: run.timestamp,
        type: "comparison" as const,
        summary: truncateSummary(run.prompt),
        title: run.title
      })),
      ...parallelTeamHistory.map(run => ({
        id: run.id,
        timestamp: run.timestamp,
        type: "parallel" as const,
        summary: truncateSummary(run.prompt),
        title: run.title
      })),
      ...collaborativeHistory.map(run => ({
        id: run.id,
        timestamp: run.timestamp,
        type: "collaborative" as const,
        summary: truncateSummary(run.prompt),
        title: run.title
      })),
      ...productSpecHistory.map(spec => ({
        id: spec.id,
        timestamp: spec.createdAt,
        type: "product" as const,
        summary: truncateSummary(spec.subtitle || spec.appConcept || spec.title),
        title: spec.title
      }))
    ];

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [comparisonHistory, parallelTeamHistory, collaborativeHistory, productSpecHistory]);

  // Client-side search over title, summary, and type — no need to round-trip to Firestore
  // for a filter over data that's already local.
  const filteredHistory = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return unifiedHistory;
    return unifiedHistory.filter(entry =>
      (entry.title || "").toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      entry.type.includes(q)
    );
  }, [unifiedHistory, historySearchQuery]);

  // Re-opens a past conversation so it can be continued from where it left off.
  const openHistoryEntry = (entry: UnifiedHistoryEntry) => {
    // Cancel anything still in flight first — otherwise a stale run or follow-up can finish
    // later and overwrite (or splice stale data into) the entry we're about to load.
    runAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    flushChatToRun();
    setMainGeneratedFiles([]);
    setMainFileGenerating(null);
    setFollowUpFileGenerating(null);
    resetPostOutcomeState();
    setPendingOutline(null);
    setDraftingOutlineSections(null);
    setDraftingSectionStatus({});
    setIsChatDrawerOpen(false);
    setChatDrawerPinnedNode(null);
    setChatTargetMode(customTeam[0]?.id || "team");
    setAddCommentTarget(null);
    setPendingMidQuestion(null);
    setConsiderationDraftResponses({});
    setIsConsiderationsOpen(false);

    if (entry.type === "comparison") {
      const run = comparisonHistory.find(r => r.id === entry.id);
      if (!run) return;
      setPrompt(run.prompt);
      setOutputFormat(run.outputFormat);
      setEnabledAgents(prev => ({ ...prev, ...run.enabledAgents }));
      setResults(run.results);
      setAggregatedReview(run.aggregatedReview);
      setActiveTab("comparison");
    } else if (entry.type === "parallel") {
      const run = parallelTeamHistory.find(r => r.id === entry.id);
      if (!run) return;
      setCustomPrompt(run.prompt); setTaskConstraints(""); setTaskSuccessCriteria("");
      const restored: typeof customResults = {};
      (Object.entries(run.results) as [string, ParallelTeamRun["results"][string]][]).forEach(([agentId, res]) => {
        restored[agentId] = { ...res, loading: false };
      });
      setCustomResults(restored);
      setChatMode("parallel");
      setActiveTab("custom");
    } else if (entry.type === "product") {
      const spec = productSpecHistory.find(r => r.id === entry.id);
      if (!spec) return;
      // ProductTab owns its own generation state locally (isGenerating, preflight, etc.) —
      // rather than lifting all of that into App.tsx, we hand it the spec to load via a
      // prop and let its own effect consume it (see specToLoad/onSpecLoaded on <ProductTab>).
      setProductSpecToLoad(spec);
      setActiveTab("product");
    } else {
      const run = collaborativeHistory.find(r => r.id === entry.id);
      if (!run) return;
      setCustomPrompt(run.prompt); setTaskConstraints(""); setTaskSuccessCriteria("");
      setCollaborativeRun(run);
      setCollaborativeError(null);
      setFollowUpMessages(run.chatMessages || []);
      setChatMode("collaborative");
      setActiveTab("custom");
    }
  };

  const clearAllHistory = () => {
    setComparisonHistory([]);
    setParallelTeamHistory([]);
    setCollaborativeHistory([]);
    setProductSpecHistory([]);
    clearAllHistoryRemote();
  };

  // Clears the prompt, current results/discussion, and any follow-up thread. Past
  // conversations remain safely available in Chat History regardless of which option below is used.
  const resetConversationState = () => {
    // Same reasoning as openHistoryEntry: cancel in-flight work before clearing state, or a
    // late-arriving result can silently repopulate the very thing we just reset.
    runAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    flushChatToRun();
    // The facilitator's own example schema uses short ids ("n1", "n2"...), so a brand new
    // tree very likely reuses ids from the previous conversation's tree. Every piece of
    // state below is keyed by node id but lives OUTSIDE the run object, so without an
    // explicit reset here it silently attaches to same-numbered nodes in the new tree —
    // showing a stale "Resume expanding scope" session, an old Q&A transcript, or an
    // "updated" badge that has nothing to do with the new conversation.
    clarificationContextRef.current = "";
    clarificationEntriesRef.current = [];
    setGoDeeperSessions({});
    setActiveGoDeeperSessionKey(null);
    setGoDeeperCustomAnswer("");
    setCustomPrompt(""); setTaskConstraints(""); setTaskSuccessCriteria("");
    setCustomResults({});
    setCollaborativeRun(null);
    setCollaborativeError(null);
    setFollowUpMessages([]);
    setFollowUpInput("");
    setMainGeneratedFiles([]);
    setMainFileGenerating(null);
    setFollowUpFileGenerating(null);
    resetPostOutcomeState();
    setPendingOutline(null);
    setDraftingOutlineSections(null);
    setDraftingSectionStatus({});
    setIsChatDrawerOpen(false);
    setChatDrawerPinnedNode(null);
    setChatTargetMode(customTeam[0]?.id || "team");
    setAddCommentTarget(null);
    setPendingMidQuestion(null);
    setConsiderationDraftResponses({});
    setIsConsiderationsOpen(false);
  };

  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);

  // "New Conversation" now asks whether to carry the current Team Agents roster and
  // Knowledge Base forward, since both are otherwise shared/global rather than per-conversation.
  const startNewConversation = () => {
    setIsNewConversationDialogOpen(true);
  };

  const confirmKeepSetupForNewConversation = () => {
    resetConversationState();
    setIsNewConversationDialogOpen(false);
    setActiveTab("custom");
  };

  const confirmFreshSetupForNewConversation = () => {
    const fallbackProvider = (getAvailableProviders()[0]?.id as CustomAgent["provider"]) || "gemini";
    const defaultTeam: CustomAgent[] = [
      createDefaultAgent(fallbackProvider)
    ];
    setCustomTeam(defaultTeam);
    saveCustomTeamAndFiles(defaultTeam, []);

    knowledgeFiles.forEach(f => moveSourceToTrash(f));
    setKnowledgeFiles([]);

    resetConversationState();
    setIsNewConversationDialogOpen(false);
    setActiveTab("custom");
    logDebug("info", "Started a completely fresh conversation", "Team Agents reset to default, Knowledge Base cleared");
  };

  // Lets the user ask the team a follow-up question after a discussion or parallel run has
  // completed, using the facilitator/lead agent with the prior context in view.
  // Chat With The Team: a follow-up question triggers a real mini-discussion among the agents
  // (not just one facilitator answering) — they see the prior conversation, discuss the new
  // question amongst themselves through the same Fast/Deep/Multiple Rounds depth setting used
  // for the main discussion, then a facilitator feeds back one consolidated response.
  // Shared by sendFollowUp and submitCommentBatch: given a chat exchange (a question or a
  // batch of comments) and the team's answer to it, asks the facilitator what — if anything —
  // should change, as discrete individually-approvable items. Nothing is applied here; this
  // only produces the Gatekeeper card's contents.
  const evaluateProposedChanges = async (
    run: CollaborativeRun,
    exchangeSummary: string,
    finalAnswer: string,
    signal: AbortSignal
  ): Promise<{ changes: ProposedChange[]; status?: RunStatus; statusNote?: string }> => {
    const facilitator = getRunFacilitator(collaborativeRun);
    const knowledgeContext = buildKnowledgeContext();
    const resourceScope = getResourceScopeInstruction();
    const changes: ProposedChange[] = [];
    let status: RunStatus | undefined;
    let statusNote: string | undefined;

    if (run.taskType === "deliverable" && run.deliverable) {
      const updateInstruction = `You are the neutral facilitator of a multi-agent team that previously produced the deliverable below. The team just discussed an exchange with the manager. Decide whether it warrants adding a new section or changing an existing one. Only include sections that are actually new or changed — do not repeat untouched sections. Also decide whether the team now needs something from the manager before the deliverable can be considered complete.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  "sections": [ { "id": "existing section id, or a new one if adding", "heading": "...", "authorAgentName": "exact team member name", "content": "...", "isNew": true | false } ],\n  "status": "delivered" | "needs_input",\n  "statusNote": "if needs_input, 1-2 sentences — otherwise omit"\n}\nOmit "sections" or leave it empty if nothing about the deliverable should change. Every authorAgentName must exactly match one of: ${customTeam.map(a => a.name).join(", ")}.`;
      const updatePrompt = `${knowledgeContext}\n\nPRIOR DELIVERABLE — "${run.deliverable.title}":\n${run.deliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}\n\nEXCHANGE WITH THE MANAGER:\n${exchangeSummary}\n\nFACILITATOR'S ANSWER:\n${finalAnswer}`;

      const update = await callAgentForJson(facilitator, updatePrompt, updateInstruction, signal);
      if (update.status === "needs_input") {
        status = "needs_input";
        statusNote = typeof update.statusNote === "string" ? update.statusNote : undefined;
      }
      if (Array.isArray(update.sections)) {
        for (const s of update.sections) {
          if (!s?.heading) continue;
          const existing = run.deliverable.sections.find(es => es.id === s.id);
          changes.push({
            id: `chg_${Date.now()}_${changes.length}`,
            kind: "section",
            label: s.isNew ? `Add section "${s.heading}"` : `Update section "${s.heading}"`,
            before: existing?.content,
            after: s.content || "",
            sectionId: s.id || `sec_${Date.now()}`,
            newSectionHeading: s.heading,
            newSectionContent: s.content || "",
            approved: true
          });
        }
      }
    } else {
      const revisionInstruction = `You are the neutral facilitator of a multi-agent panel. ${resourceScope}\n\nThe panel previously reached the outcome and decision tree below. The team just discussed an exchange with the manager. Decide what, if anything, should change. Prefer small, targeted changes to specific existing nodes (by id) over restructuring the whole tree — only propose a full restructure if the exchange genuinely invalidates the tree's shape. Also decide whether the team now needs something from the manager before the decision can be considered complete.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  "outcomeChange": { "newOutcome": "...", "newReasons": ["...", "..."] } | null,\n  "nodeChanges": [ { "nodeId": "exact existing node id", "newProbability": 0-100, "newReason": "..." } ],\n  "restructure": { "newDecisionTree": [ ...complete tree, full depth, unique ids... ] } | null,\n  "status": "delivered" | "needs_input",\n  "statusNote": "if needs_input, 1-2 sentences — otherwise omit"\n}\nSet fields to null/empty where nothing changes. Only use "restructure" for genuine structural changes — never as a substitute for listing individual nodeChanges.`;
      const revisionPrompt = `${knowledgeContext}\n\nPRIOR OUTCOME:\n${run.outcome}\n\nPRIOR REASONS:\n${run.reasons.join("\n")}\n\nPRIOR DECISION TREE (JSON):\n${truncateText(JSON.stringify(run.decisionTree), 20000)}\n\nEXCHANGE WITH THE MANAGER:\n${exchangeSummary}\n\nFACILITATOR'S ANSWER:\n${finalAnswer}`;

      const revision = await callAgentForJson(facilitator, revisionPrompt, revisionInstruction, signal);
      if (revision.status === "needs_input") {
        status = "needs_input";
        statusNote = typeof revision.statusNote === "string" ? revision.statusNote : undefined;
      }
      if (revision.outcomeChange?.newOutcome) {
        changes.push({
          id: `chg_${Date.now()}_${changes.length}`,
          kind: "outcome",
          label: "Update the overall outcome",
          before: run.outcome,
          after: revision.outcomeChange.newOutcome,
          newOutcome: revision.outcomeChange.newOutcome,
          newReasons: Array.isArray(revision.outcomeChange.newReasons) ? revision.outcomeChange.newReasons : run.reasons,
          approved: true
        });
      }
      if (Array.isArray(revision.nodeChanges)) {
        for (const nc of revision.nodeChanges) {
          const existingNode = run.decisionTree.find(n => n.id === nc?.nodeId);
          if (!existingNode) continue;
          changes.push({
            id: `chg_${Date.now()}_${changes.length}`,
            kind: "node",
            label: `Branch "${existingNode.label}"`,
            before: `${existingNode.probability}% — ${existingNode.reason || "no reason given"}`,
            after: `${typeof nc.newProbability === "number" ? nc.newProbability : existingNode.probability}% — ${nc.newReason || existingNode.reason || ""}`,
            nodeId: existingNode.id,
            newProbability: typeof nc.newProbability === "number" ? nc.newProbability : existingNode.probability,
            newReason: nc.newReason || existingNode.reason,
            approved: true
          });
        }
      }
      if (revision.restructure?.newDecisionTree && Array.isArray(revision.restructure.newDecisionTree) && revision.restructure.newDecisionTree.length > 0) {
        changes.push({
          id: `chg_${Date.now()}_${changes.length}`,
          kind: "restructure",
          label: "Restructure the decision tree",
          after: "The tree's branch structure would change — see the updated tree once applied.",
          newDecisionTree: revision.restructure.newDecisionTree,
          approved: true
        });
      }
    }

    return { changes, status, statusNote };
  };

  // Formats ONLY the given sources using the same "--- FILE: ... ---" convention as
  // buildKnowledgeContext, rather than reusing that function directly — the drift check is
  // specifically about what's NEW, and sending the whole KB on every check would cost
  // roughly the same as a full re-discussion for a feature meant to be the cheap alternative
  // to one. Truncation limits mirror buildKnowledgeContext's (60k chars/source, 260k total).
  const buildContextForSources = (sources: KnowledgeFile[]): string => {
    if (sources.length === 0) return "";
    const context = `NEWLY ADDED KNOWLEDGE BASE DOCUMENTS (added since this discussion was last checked):\n${sources.map(f => `--- FILE: ${f.name} ---\n${truncateText(f.content, 60000)}\n--- END FILE ---`).join("\n\n")}`;
    return truncateText(context, 260000);
  };

  // The incremental counterpart to a full re-discussion: checks the current outcome/tree
  // (or deliverable) against ONLY what's genuinely new in the Knowledge Base since this run
  // was last checked, and proposes changes ONLY where that new material actually warrants
  // one — deliberately conservative, since "a document was added" is not itself a reason to
  // change anything. Reuses evaluateProposedChanges' exact response shape/schema so the
  // result flows through the same ProposedChange type, the same GatekeeperCard, and the same
  // applyApprovedChanges commit path as every other source of proposed changes — nothing new
  // to build on the review/apply side.
  const evaluateKnowledgeBaseDrift = async (
    run: CollaborativeRun,
    newSources: KnowledgeFile[],
    signal: AbortSignal
  ): Promise<{ changes: ProposedChange[]; status?: RunStatus; statusNote?: string }> => {
    const facilitator = getRunFacilitator(run);
    const newSourcesContext = buildContextForSources(newSources);
    const resourceScope = getResourceScopeInstruction();
    const changes: ProposedChange[] = [];
    let status: RunStatus | undefined;
    let statusNote: string | undefined;
    const sourceNames = newSources.map(f => f.name).join(", ");

    if (run.taskType === "deliverable" && run.deliverable) {
      const updateInstruction = `You are the neutral facilitator of a multi-agent team that previously produced the deliverable below. New source material has been added to the Knowledge Base since — decide whether it warrants adding a new section or changing an existing one. Most of the time it will not: only propose a change where the new material specifically contradicts, meaningfully extends, or corrects something already in the deliverable. Adding a document is not by itself a reason to change anything. Only include sections that are actually new or changed — do not repeat untouched sections.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  "sections": [ { "id": "existing section id, or a new one if adding", "heading": "...", "authorAgentName": "exact team member name", "content": "...", "isNew": true | false } ]\n}\nOmit "sections" or leave it empty if the new material doesn't warrant any change — this should be the common case. Every authorAgentName must exactly match one of: ${customTeam.map(a => a.name).join(", ")}.`;
      const updatePrompt = `${newSourcesContext}\n\nPRIOR DELIVERABLE — "${run.deliverable.title}":\n${run.deliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}`;

      const update = await callAgentForJson(facilitator, updatePrompt, updateInstruction, signal);
      if (Array.isArray(update.sections)) {
        for (const s of update.sections) {
          if (!s?.heading) continue;
          const existing = run.deliverable.sections.find(es => es.id === s.id);
          changes.push({
            id: `chg_${Date.now()}_${changes.length}`,
            kind: "section",
            label: s.isNew ? `Add section "${s.heading}"` : `Update section "${s.heading}"`,
            before: existing?.content,
            after: s.content || "",
            sectionId: s.id || `sec_${Date.now()}`,
            newSectionHeading: s.heading,
            newSectionContent: s.content || "",
            approved: true
          });
        }
      }
    } else {
      const revisionInstruction = `You are the neutral facilitator of a multi-agent panel. ${resourceScope}\n\nThe panel previously reached the outcome and decision tree below. New source material (${sourceNames}) has been added to the Knowledge Base since — decide whether it warrants any change. Most of the time it will not: only propose a change where the new material specifically contradicts, meaningfully extends, or corrects something already in the tree. Adding a document is not by itself a reason to change anything — resist proposing a change just to demonstrate the new material was read. Prefer small, targeted changes to specific existing nodes (by id) over restructuring the whole tree — only propose a full restructure if the new material genuinely invalidates the tree's shape.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  "outcomeChange": { "newOutcome": "...", "newReasons": ["...", "..."] } | null,\n  "nodeChanges": [ { "nodeId": "exact existing node id", "newProbability": 0-100, "newReason": "..." } ],\n  "restructure": { "newDecisionTree": [ ...complete tree, full depth, unique ids... ] } | null\n}\nSet every field to null/empty if the new material doesn't change anything — this should be the common case. Only use "restructure" for genuine structural changes — never as a substitute for listing individual nodeChanges.`;
      const revisionPrompt = `${newSourcesContext}\n\nPRIOR OUTCOME:\n${run.outcome}\n\nPRIOR REASONS:\n${run.reasons.join("\n")}\n\nPRIOR DECISION TREE (JSON):\n${truncateText(JSON.stringify(run.decisionTree), 20000)}`;

      const revision = await callAgentForJson(facilitator, revisionPrompt, revisionInstruction, signal);
      if (revision.outcomeChange?.newOutcome) {
        changes.push({
          id: `chg_${Date.now()}_${changes.length}`,
          kind: "outcome",
          label: "Update the overall outcome",
          before: run.outcome,
          after: revision.outcomeChange.newOutcome,
          newOutcome: revision.outcomeChange.newOutcome,
          newReasons: Array.isArray(revision.outcomeChange.newReasons) ? revision.outcomeChange.newReasons : run.reasons,
          approved: true
        });
      }
      if (Array.isArray(revision.nodeChanges)) {
        for (const nc of revision.nodeChanges) {
          const existingNode = run.decisionTree.find(n => n.id === nc?.nodeId);
          if (!existingNode) continue;
          changes.push({
            id: `chg_${Date.now()}_${changes.length}`,
            kind: "node",
            label: `Branch "${existingNode.label}"`,
            before: `${existingNode.probability}% — ${existingNode.reason || "no reason given"}`,
            after: `${typeof nc.newProbability === "number" ? nc.newProbability : existingNode.probability}% — ${nc.newReason || existingNode.reason || ""}`,
            nodeId: existingNode.id,
            newProbability: typeof nc.newProbability === "number" ? nc.newProbability : existingNode.probability,
            newReason: nc.newReason || existingNode.reason,
            approved: true
          });
        }
      }
      if (revision.restructure?.newDecisionTree && Array.isArray(revision.restructure.newDecisionTree) && revision.restructure.newDecisionTree.length > 0) {
        changes.push({
          id: `chg_${Date.now()}_${changes.length}`,
          kind: "restructure",
          label: "Restructure the decision tree",
          after: "The tree's branch structure would change — see the updated tree once applied.",
          newDecisionTree: revision.restructure.newDecisionTree,
          approved: true
        });
      }
    }

    return { changes, status, statusNote };
  };

  // Triggered from the Knowledge Base staleness banner. Computes exactly which current
  // sources are new since this run's last check (by id — see groundedSourceIds), and if
  // there are any, runs evaluateKnowledgeBaseDrift and surfaces the result as a normal
  // Gatekeeper card in the chat drawer — no new review UI. Refreshes groundedSourceIds to
  // the full current set once the check completes REGARDLESS of whether it proposed any
  // changes: the check having happened is what settles the staleness, not its outcome —
  // otherwise a "nothing needs to change" result would leave the banner reappearing forever
  // for the same already-reviewed sources.
  const checkAgainstNewKnowledgeSources = async () => {
    if (!collaborativeRun) return;
    const newIds = getNewKnowledgeSourceIds(knowledgeFiles, collaborativeRun.groundedSourceIds);
    const newSources = knowledgeFiles.filter(f => newIds.has(f.id));
    if (newSources.length === 0) return;

    openChatDrawer();
    setIsCheckingKnowledgeDrift(true);
    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const signal = controller.signal;
    const sourceNames = newSources.map(f => f.name).join(", ");

    const askMessage: FollowUpMessage = {
      id: newMessageId(),
      role: "user",
      text: `Check the current ${collaborativeRun.taskType === "deliverable" ? "deliverable" : "outcome and decision tree"} against ${newSources.length} newly added knowledge source${newSources.length === 1 ? "" : "s"}: ${sourceNames}.`
    };
    setFollowUpMessages(prev => [...prev, askMessage]);
    // Checkpoint-on-start, same reasoning as askTeamToReconsiderConsiderations above —
    // isCheckingKnowledgeDrift also doesn't drive flushChatToRun's automatic effect.
    const messagesWithAsk = [...followUpMessages, askMessage];
    flushChatToRun(messagesWithAsk);

    try {
      const evalResult = await evaluateKnowledgeBaseDrift(collaborativeRun, newSources, signal);
      const refreshedIds = getGroundedSourceIds();
      const teamMessage: FollowUpMessage = {
        id: newMessageId(),
        role: "team",
        text: evalResult.changes.length > 0
          ? `Checked against ${sourceNames} — ${evalResult.changes.length} update${evalResult.changes.length === 1 ? "" : "s"} look${evalResult.changes.length === 1 ? "s" : ""} warranted:`
          : `Checked against ${sourceNames} — this doesn't change anything in the current ${collaborativeRun.taskType === "deliverable" ? "deliverable" : "outcome or tree"}.`,
        proposedChanges: evalResult.changes.length > 0 ? evalResult.changes : undefined
      };
      // Deliberately ONE combined save (groundedSourceIds refresh + chatMessages together),
      // not two separate saves — a separate save built from the stale `collaborativeRun`
      // closure would have reverted chatMessages back to its pre-ask value, silently
      // undoing the checkpoint-on-start flush above the moment this succeeded.
      const updatedRun: CollaborativeRun = { ...collaborativeRun, groundedSourceIds: refreshedIds, groundedSourceCount: refreshedIds.length, chatMessages: [...messagesWithAsk, teamMessage] };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      setFollowUpMessages(prev => [...prev, teamMessage]);
      logDebug("info", `Checked against ${newSources.length} new knowledge source(s)`, `${evalResult.changes.length} proposed change(s)`);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        logDebug("error", "Failed to check against new knowledge sources", err?.message || err);
        const errorMessage: FollowUpMessage = { id: newMessageId(), role: "team", text: "Sorry, something went wrong checking the new sources — please try again." };
        setFollowUpMessages(prev => [...prev, errorMessage]);
        flushChatToRun([...messagesWithAsk, errorMessage]);
      }
    } finally {
      setIsCheckingKnowledgeDrift(false);
      followUpAbortRef.current = null;
    }
  };

  // Extracted out of buildPriorContextBlock so submitCommentBatch — which only needs this
  // narrower summary, not the full "ORIGINAL TASK + transcript" context block — can share it
  // instead of keeping its own copy of the same ternary.
  const summarizePriorResult = (run: CollaborativeRun): string => {
    return run.taskType === "deliverable" && run.deliverable
      ? `PRIOR DELIVERABLE — "${run.deliverable.title}":\n${run.deliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}`
      : `PRIOR FINAL OUTCOME:\n${run.outcome}\n\nPRIOR REASONS:\n${run.reasons.join("\n")}`;
  };

  // Shared by sendFollowUp and sendQuickResponse — previously duplicated verbatim in both.
  // Summarizes whatever the conversation is following up on (a Collaborative run's transcript
  // and outcome/deliverable, or a Parallel run's results) as context for the model. Closes
  // over chatMode/collaborativeRun/customResults rather than taking parameters, since both
  // call sites already have identical access to all of them.
  const buildPriorContextBlock = (): string => {
    if (chatMode === "collaborative" && collaborativeRun) {
      const transcriptText = truncateText(
        collaborativeRun.transcript.map(t => `${t.agentName} (${t.provider}): ${t.message}`).join("\n\n"),
        MAX_TRANSCRIPT_CHARS
      );
      return `ORIGINAL TASK:\n${collaborativeRun.prompt}\n\nPRIOR ${collaborativeRun.taskType === "deliverable" ? "PLANNING DISCUSSION" : "PANEL DISCUSSION"}:\n${transcriptText}\n\n${summarizePriorResult(collaborativeRun)}`;
    }
    const resultsText = (Object.values(customResults) as (typeof customResults)[string][])
      .map(r => `${r.name} (${r.provider}): ${r.error ? `[error: ${r.error}]` : r.text}`)
      .join("\n\n");
    return `ORIGINAL TASK:\n${getTaskWithClarifications()}\n\nPRIOR TEAM RESPONSES:\n${resultsText}`;
  };

  // Team Chat (general chat and "Let's discuss this") is discussion-only: it can never
  // propose or apply edits to the tree/outcome itself, unlike Considerations' "Ask the Team
  // to Reconsider" which retains that via evaluateProposedChanges. This is a much lighter,
  // best-effort check that only decides whether the exchange revealed something significant
  // enough to be worth a full re-discussion — if so, it points at the specific node to
  // comment on (comments are what actually trigger runCollaborativeSession, via
  // submitCommentBatch), rather than trying to sneak a change through chat.
  const checkFollowUpWarrantsRediscussion = async (
    run: CollaborativeRun,
    question: string,
    panelDiscussionText: string,
    finalAnswer: string,
    signal: AbortSignal
  ): Promise<{ nodeId?: string; nodeLabel?: string; reason: string } | null> => {
    const facilitator = getRunFacilitator(run);
    if (!facilitator || run.decisionTree.length === 0) return null;
    const nodeList = run.decisionTree.map(n => `${n.id}: ${n.label}`).join("\n");
    const instruction = `You are the neutral facilitator of a multi-agent panel, reviewing a side conversation the manager just had with the team after the panel's work was completed. Decide whether anything in this exchange is significant enough that it should be brought back to the full team for a proper re-discussion — a challenged assumption, new information that could change a probability or the outcome, or a real disagreement the quick answer just papered over. A routine clarifying question that doesn't call anything into question does NOT warrant this — most exchanges don't. Default to false unless something genuinely was called into question.\n\nEXISTING DECISION TREE NODES:\n${nodeList}\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  \"warrantsRediscussion\": true | false,\n  \"nodeId\": \"an exact id from the list above, if this concerns one specific branch — otherwise omit\",\n  \"reason\": \"one plain sentence on what should be re-examined, only if warrantsRediscussion is true\"\n}`;
    const prompt = `USER'S QUESTION:\n${question}\n\nPANEL DISCUSSION OF THIS FOLLOW-UP:\n${panelDiscussionText}\n\nTEAM'S ANSWER GIVEN:\n${finalAnswer}`;
    try {
      const parsed = await callAgentForJson(facilitator, prompt, instruction, signal);
      if (parsed?.warrantsRediscussion !== true) return null;
      const node = run.decisionTree.find(n => n.id === parsed.nodeId);
      return {
        nodeId: node?.id,
        nodeLabel: node?.label,
        reason: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "This may be worth bringing back to the full team."
      };
    } catch {
      return null; // Best-effort — a failed check should never block or degrade the chat answer itself.
    }
  };

  const sendFollowUp = async (overrideText?: string, nodeContext?: PinnedNodeContext[]) => {
    const question = (overrideText ?? followUpInput).trim();
    if (!question || customTeam.length === 0) return;
    const priorFollowUpThread = followUpMessages.map(m => `${m.role === "user" ? "User" : "Team"}: ${m.text}`).join("\n");
    // Seeds the discussion with the branch's actual probability/reasoning/parent from the
    // first turn — not just its name — so "Let's discuss this" gives the model real context
    // to work with instead of a bare label it has to guess the significance of.
    const nodeContextBlock = nodeContext && nodeContext.length > 0
      ? `\n\nThis message specifically concerns ${nodeContext.length === 1 ? "this branch" : "these branches"} of the decision tree:\n${nodeContext.map(n =>
          `- "${n.nodeLabel}"${n.parentLabel ? ` (under "${n.parentLabel}")` : ""}${typeof n.probability === "number" ? `, currently ${n.probability}%` : ""}${n.reason ? ` — reasoning so far: ${n.reason}` : ""}`
        ).join("\n")}`
      : "";

    const userMessage: FollowUpMessage = { id: newMessageId(), role: "user", text: question, nodeContext };
    setFollowUpMessages(prev => [...prev, userMessage]);
    setFollowUpInput("");
    setFollowUpLoading(true);
    setCollaborativePhase("Discussing your question with the team...");
    setCallCount(0);
    // Checkpoint-on-start: previously the question only got saved once the whole exchange
    // (mini-round + facilitator synthesis) finished, via flushChatToRun's followUpLoading
    // effect — so a browser crash mid-round lost the question too, not just the answer.
    // followUpMessages here is still the pre-append value (this runs before React commits
    // the state update above), so the explicit array below is the correct just-appended one.
    flushChatToRun([...followUpMessages, userMessage]);

    // Tracks the id of the streamed placeholder "team" message once it's pushed, so a
    // failure partway through updates that message in place instead of appending a stray
    // empty bubble followed by a separate error bubble. Id-based (not index-based) so this
    // stays correct even if another send path appends a message in between.
    let placeholderMessageId: string | null = null;

    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const signal = controller.signal;

    try {
      const resourceScope = getResourceScopeInstruction();
      const depthInstruction = getDepthInstruction();
      const knowledgeContext = buildKnowledgeContext();

      // Prior conversation context, built the same way regardless of which mode produced it.
      const priorContextBlock = buildPriorContextBlock();

      // Team mode is deliberately a single round now: every agent gives their view once, then
      // the facilitator synthesizes — no validation/rebuttal rounds. Routine chat (a
      // clarification, a quick question) doesn't need the full multi-round debate the original
      // decision went through; that debate now happens where it actually matters, on a
      // specific proposed change, via evaluateProposedChanges below and the Gatekeeper card it
      // feeds. This also means a chat message costs roughly 1/4 to 1/9 the model calls it used
      // to at Deep/Extended depth, since the rebuttal rounds were the expensive part.
      const miniTranscript: CollaborativeTranscriptEntry[] = await settleRound(
        mapWithConcurrency(customTeam, AGENT_CALL_CONCURRENCY, async (agent: CustomAgent) => {
          const systemInstruction = `You are an AI agent named "${agent.name}" continuing a discussion with the user after your panel already completed the work below. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nThe user has a follow-up question. Answer it directly in 3-6 sentences, staying consistent with your panel's prior reasoning.`;
          const fullPrompt = `${knowledgeContext}\n\n${priorContextBlock}${priorFollowUpThread ? `\n\nFOLLOW-UP CONVERSATION SO FAR:\n${priorFollowUpThread}` : ""}\n\nUSER'S NEW FOLLOW-UP QUESTION:\n${question}${nodeContextBlock}`;
          const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
          return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message };
        }),
        customTeam,
        "the follow-up round",
        signal
      );
      if (signal.aborted) throw new DOMException("Chat stopped.", "AbortError");

      // Facilitator feeds back one consolidated response to the user. Pushed as a placeholder
      // immediately (with the panel discussion already attached) so the answer can stream in
      // live rather than appearing all at once after the wait.
      const facilitator = getRunFacilitator(collaborativeRun);
      setCollaborativePhase("Preparing the team's answer...");
      const finalTranscriptText = truncateText(
        miniTranscript.map(t => `${t.agentName} (${t.provider}): ${t.message}`).join("\n\n"),
        MAX_TRANSCRIPT_CHARS
      );
      const synthesisInstruction = `You are the neutral facilitator of a multi-agent panel, feeding back a response to the user after your panel discussed their follow-up question. ${resourceScope}\n\n${depthInstruction}\n\nThe panel just gave their individual views below — your job is to converge them into ONE clear, decisive outcome, not a noncommittal summary of "some said X, others said Y." Weigh the arguments, take a position, and state it directly: what is the team's answer, and why. If the panel genuinely split with no clear resolution, say so explicitly and state what would settle it — but default to being decisive when the panel's views point the same direction, which is the common case. 3-8 sentences, plain prose, no JSON, no markdown headers.${domainExpertInstructionSuffix}`;
      const synthesisPrompt = `${knowledgeContext}\n\n${priorContextBlock}\n\nUSER'S NEW FOLLOW-UP QUESTION:\n${question}${nodeContextBlock}\n\nPANEL DISCUSSION OF THIS FOLLOW-UP:\n${finalTranscriptText}`;

      const teamMessageId = newMessageId();
      placeholderMessageId = teamMessageId;
      setFollowUpMessages(prev => [...prev, { id: teamMessageId, role: "team", text: "", transcript: miniTranscript }]);

      let streamedAnswer = "";
      const finalAnswer = await callAgentStreaming(facilitator, synthesisPrompt, synthesisInstruction, (delta) => {
        streamedAnswer += delta;
        setFollowUpMessages(prev => prev.map(m => (m.id === teamMessageId ? { ...m, text: streamedAnswer } : m)));
      }, signal);

      // Team Chat never proposes or applies changes itself — see checkFollowUpWarrantsRediscussion.
      // If the exchange revealed something significant, the message below surfaces a
      // suggestion to add a node comment instead, which is the actual trigger for a full
      // re-discussion (submitCommentBatch → runCollaborativeSession).
      let rediscussionSuggestion: { nodeId?: string; nodeLabel?: string; reason: string } | null = null;
      if (chatMode === "collaborative" && collaborativeRun && !signal.aborted) {
        try {
          rediscussionSuggestion = await checkFollowUpWarrantsRediscussion(collaborativeRun, question, finalTranscriptText, finalAnswer, signal);
        } catch (checkErr: any) {
          logDebug("warn", "Could not check whether the follow-up warrants a full re-discussion", checkErr?.message || checkErr);
        }
      }

      setFollowUpMessages(prev => prev.map(m => (m.id === teamMessageId
        // Authoritatively set text to the stream's final return value here, rather than
        // trusting that onChunk fired correctly during streaming. If the stream delivered
        // zero non-empty text frames (a provider/format quirk, not necessarily an error),
        // m.text would otherwise stay "" forever — and an empty team message renders its
        // loading-dots fallback permanently, with no request actually in flight anymore.
        ? {
            ...m,
            text: m.text || finalAnswer || streamedAnswer || "(The team didn't return a response — try asking again.)",
            suggestedCommentNodeId: rediscussionSuggestion?.nodeId,
            suggestedCommentNodeLabel: rediscussionSuggestion?.nodeLabel,
            suggestedCommentReason: rediscussionSuggestion?.reason,
            nodeContext: nodeContext
          }
        : m)));
      logDebug("info", "Chat With The Team discussion completed", `1 round across ${customTeam.length} agent(s)${rediscussionSuggestion ? ", suggested a full re-discussion" : ""}`);

      // Auto-detect: if the question itself asked for a document/spreadsheet/deck, create it
      // automatically in addition to the button always being available on the message.
      const detectedKind = detectFileRequest(question);
      if (detectedKind) {
        createFollowUpFile(teamMessageId, detectedKind, finalAnswer);
      }
    } catch (error: any) {
      const wasStopped = signal.aborted || error?.name === "AbortError" || error?.name === "CanceledError";
      if (wasStopped) {
        logDebug("info", "Chat With The Team exchange stopped");
        if (placeholderMessageId !== null) {
          const targetId = placeholderMessageId;
          setFollowUpMessages(prev => prev.map(m => (m.id === targetId ? { ...m, text: m.text || "Stopped." } : m)));
        }
      } else {
        console.error("Follow-up question failed:", error);
        logDebug("error", "Follow-up question failed", error?.message || error);
        const errorText = `Sorry, something went wrong: ${error.message || "please try again."}`;
        if (placeholderMessageId !== null) {
          const targetId = placeholderMessageId;
          setFollowUpMessages(prev => prev.map(m => (m.id === targetId ? { ...m, text: errorText } : m)));
        } else {
          setFollowUpMessages(prev => [...prev, { id: newMessageId(), role: "team", text: errorText }]);
        }
      }
    } finally {
      setFollowUpLoading(false);
      setCollaborativePhase("");
      followUpAbortRef.current = null;
    }
  };

  // "Everyone" (agents = the whole team) or a specific individual agent (agents = one-element
  // array) — each agent answers independently with no cross-talk, validation rounds, or
  // synthesis. Deliberately skips the Gatekeeper evaluation step that "Team" mode runs:
  // these are individual takes, not an official panel revision, so nothing here should be
  // able to propose changes to the live outcome/tree.
  const sendQuickResponse = async (agents: CustomAgent[], overrideText?: string, nodeContext?: PinnedNodeContext[]) => {
    const question = (overrideText ?? followUpInput).trim();
    if (!question || agents.length === 0) return;
    const nodeContextBlock = nodeContext && nodeContext.length > 0
      ? `\n\nThis message specifically concerns ${nodeContext.length === 1 ? "this branch" : "these branches"} of the decision tree:\n${nodeContext.map(n =>
          `- "${n.nodeLabel}"${n.parentLabel ? ` (under "${n.parentLabel}")` : ""}${typeof n.probability === "number" ? `, currently ${n.probability}%` : ""}${n.reason ? ` — reasoning so far: ${n.reason}` : ""}`
        ).join("\n")}`
      : "";

    const userMessage: FollowUpMessage = { id: newMessageId(), role: "user", text: question, nodeContext };
    setFollowUpMessages(prev => [...prev, userMessage]);
    setFollowUpInput("");
    setFollowUpLoading(true);
    setCollaborativePhase(agents.length === 1 ? `Asking ${agents[0].name}...` : "Asking everyone individually...");
    setCallCount(0);
    // Same checkpoint-on-start reasoning as sendFollowUp above.
    flushChatToRun([...followUpMessages, userMessage]);

    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const signal = controller.signal;

    try {
      const resourceScope = getResourceScopeInstruction();
      const depthInstruction = getDepthInstruction();
      const knowledgeContext = buildKnowledgeContext();

      const priorContextBlock = buildPriorContextBlock();

      const priorFollowUpThread = followUpMessages.map(m => `${m.role === "user" ? "User" : "Team"}: ${m.text}`).join("\n");

      const responses = await settleRound(
        agents.map(async (agent) => {
          const systemInstruction = `You are an AI agent named "${agent.name}", answering a direct question on your own — not as a consolidated panel response. Persona: ${agent.persona}\n\n${resourceScope}\n\n${depthInstruction}\n\nGive YOUR OWN individual take in 3-6 sentences. Speak in your own voice; don't try to represent the whole team's consensus.`;
          const fullPrompt = `${knowledgeContext}\n\n${priorContextBlock}${priorFollowUpThread ? `\n\nFOLLOW-UP CONVERSATION SO FAR:\n${priorFollowUpThread}` : ""}\n\nUSER'S QUESTION:\n${question}${nodeContextBlock}`;
          const message = await callAgent(agent, fullPrompt, systemInstruction, signal);
          return { agentId: agent.id, agentName: agent.name, provider: agent.provider, message };
        }),
        agents,
        agents.length === 1 ? `asking ${agents[0].name} directly` : "asking everyone individually",
        signal
      );

      setFollowUpMessages(prev => [...prev, { id: newMessageId(), role: "team", text: "", individualResponses: responses, nodeContext }]);
      logDebug("info", agents.length === 1 ? `${agents[0].name} responded directly` : "Everyone responded individually", `${responses.length} response(s)`);
    } catch (error: any) {
      const wasStopped = signal.aborted || error?.name === "AbortError" || error?.name === "CanceledError";
      if (wasStopped) {
        logDebug("info", "Quick response stopped");
      } else {
        console.error("Quick response failed:", error);
        logDebug("error", "Quick response failed", error?.message || error);
        setFollowUpMessages(prev => [...prev, { id: newMessageId(), role: "team", text: `Sorry, something went wrong: ${error.message || "please try again."}` }]);
      }
    } finally {
      setFollowUpLoading(false);
      setCollaborativePhase("");
      followUpAbortRef.current = null;
    }
  };

  // Single entry point for the drawer's Send action — routes to the consolidated Team
  // pipeline, the Everyone (individual, parallel) pipeline, or a specific agent, based on
  // chatTargetMode. Both the Enter-key handler and the Send button go through this so the two
  // can never fall out of sync with each other.
  const sendDrawerMessage = () => {
    const nodeContext = chatDrawerPinnedNode ? [chatDrawerPinnedNode] : undefined;
    if (chatTargetMode === "everyone") {
      sendQuickResponse(customTeam, undefined, nodeContext);
    } else if (chatTargetMode !== "team") {
      const agent = customTeam.find(a => a.id === chatTargetMode);
      if (agent) sendQuickResponse([agent], undefined, nodeContext);
    } else {
      sendFollowUp(undefined, nodeContext);
    }
  };

  // Flips one proposed change's approval state within a Gatekeeper card — per-item, not
  // all-or-nothing, so the manager can accept some of a batch's suggestions and decline others.
  const toggleProposedChangeApproval = (messageId: string, changeId: string) => {
    setFollowUpMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.proposedChanges) return m;
      return { ...m, proposedChanges: m.proposedChanges.map(c => (c.id === changeId ? { ...c, approved: !c.approved } : c)) };
    }));
  };

  // Commits only the approved subset of a Gatekeeper card's proposed changes back to the main
  // Panel Discussion — this is the step the Gatekeeper Step exists to gate.
  // The explicit "not right now" counterpart to applying changes — dismisses the card
  // without touching Panel Discussion at all, distinct from simply leaving it unanswered.
  const ignoreProposedChanges = (messageId: string) => {
    setFollowUpMessages(prev => prev.map(m => (m.id === messageId ? { ...m, changesIgnored: true } : m)));
    logDebug("info", "Dismissed proposed changes without updating Panel Discussion");
  };

  const applyApprovedChanges = (messageId: string) => {
    const message = followUpMessages.find(m => m.id === messageId);
    if (!message?.proposedChanges || !collaborativeRun) return;

    const facilitator = getRunFacilitator(collaborativeRun);
    const merged = applyChangesToRun(collaborativeRun, message.proposedChanges, { id: facilitator?.id || "", name: facilitator?.name || "Team" });

    if (merged.approvedCount > 0) {
      const updatedRun: CollaborativeRun = {
        ...collaborativeRun,
        outcome: merged.outcome,
        reasons: merged.reasons,
        decisionTree: merged.decisionTree,
        deliverable: merged.deliverable,
        history: [...(collaborativeRun.history || []), snapshotCurrentRun(collaborativeRun, "Chat With The Team")]
      };
      setCollaborativeRun(updatedRun);
      setCollaborativeHistory(prev => prev.map(r => (r.id === updatedRun.id ? updatedRun : r)));
      saveHistoryEntry("collaborative", updatedRun);
      logDebug("info", `Applied ${merged.approvedCount} approved change(s) to the main discussion`, `${message.proposedChanges.length - merged.approvedCount} declined`);
    }

    setFollowUpMessages(prev => prev.map(m => (m.id === messageId ? { ...m, changesApplied: true } : m)));
  };

  // Reverts the most recent tree-changing operation — comment-batch re-discussions, drag-and-
  // drop restructures (promote/move), node revisions, and Gatekeeper commits all already push
  // a pre-change snapshot onto collaborativeRun.history via snapshotCurrentRun; this was
  // previously only ever surfaced next to the Gatekeeper commit confirmation, even though the
  // data to undo any of the others was sitting right there unused. Only ever pops the single
  // most recent entry, since history is a simple chronological stack.
  const undoLastTreeChange = () => {
    if (!collaborativeRun || !collaborativeRun.history || collaborativeRun.history.length === 0) return;
    const history = [...collaborativeRun.history];
    const lastSnapshot = history.pop()!;
    const restoredRun: CollaborativeRun = {
      ...collaborativeRun,
      outcome: lastSnapshot.outcome,
      reasons: lastSnapshot.reasons,
      decisionTree: lastSnapshot.decisionTree,
      deliverable: lastSnapshot.deliverable,
      history
    };
    setCollaborativeRun(restoredRun);
    setCollaborativeHistory(prev => prev.map(r => (r.id === restoredRun.id ? restoredRun : r)));
    saveHistoryEntry("collaborative", restoredRun);
    logDebug("info", "Reverted the last committed change", `Restored to state before: "${lastSnapshot.trigger}"`);
  };

  // Sends every draft comment as one batch straight back into a full re-discussion — the
  // whole panel debates the feedback (not just the facilitator acknowledging it solo), and
  // the outcome/reasons/tree/considerations can genuinely change as a result. This used to
  // route to Team Chat as a single facilitator JSON call that produced acknowledgment text
  // and, separately, a Gatekeeper-style change proposal — nothing about the panel's actual
  // reasoning updated, which is why it felt disconnected from "the team's output": it WAS
  // disconnected from it. Now it's the same re-discussion mechanism the Considerations
  // "Re-run Discussion" button uses, just fed with node-specific feedback instead of
  // premise amendments, and it shows up back in Panel Discussion where the rest of the
  // debate lives, not as a side conversation in the drawer.
  // selectedIds omitted = every pending draft, exactly as before. Provided = only those
  // specific comments go into this discussion; everything else stays in "draft" status,
  // untouched, ready for a later batch whenever the manager gets to them — previously
  // there was no way to address 2 urgent comments without also paying for a full
  // re-discussion covering 3 others you weren't ready to commit to yet.
  const submitCommentBatch = (selectedIds?: string[]) => {
    if (!collaborativeRun || customTeam.length === 0 || collaborativeLoading) return;
    const allDrafts = (collaborativeRun.nodeComments || []).filter(c => c.status === "draft");
    const draftComments = selectedIds ? allDrafts.filter(c => selectedIds.includes(c.id)) : allDrafts;
    if (draftComments.length === 0) return;

    const submittedIds = new Set(draftComments.map(c => c.id));
    updateNodeComments(prev => prev.map(c => (submittedIds.has(c.id) ? { ...c, status: "submitted" as const } : c)));
    const feedbackText = draftComments.map(c => `- On "${c.nodeLabel}": ${c.text}`).join("\n");
    logDebug("info", `Re-running the discussion with feedback on ${draftComments.length} of ${allDrafts.length} branch comment(s)`, feedbackText.slice(0, 300));
    runCollaborativeSession(null, null, null, feedbackText, null, null, draftComments.map(c => ({ label: `Comment on "${c.nodeLabel}"`, text: c.text, sourceType: "comment" as const })));
  };

  // After a fresh Collaborative result, checks whether the team has genuine questions for the
  // manager before considering the work wrapped up — only proposing a question when something
  // real warrants it (a low-confidence area, an assumption made, a call that reasonably could
  // go either way). A fixed free-text closing question is always appended regardless, since
  // "anything else before we continue?" is always worth asking. Runs as part of the same
  // discussion (same abort signal) so Stop / New Conversation / loading history cancels it too.
  // Pauses the calling discussion (via await) to ask the manager one question, resolving with
  // their answer — or an empty string if they skip. Tied to the same abort signal as the rest
  // of the run, so Stop / New Conversation / loading history correctly unblocks it instead of
  // leaving the run hanging forever on an answer that will never come.
  const askMidDiscussionQuestion = (q: { question: string; options: string[]; askedBy: string }, signal: AbortSignal): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Discussion stopped by user.", "AbortError"));
        return;
      }
      setPendingMidQuestion(q);
      setMidQuestionCustomAnswer("");
      const onAbort = () => {
        setPendingMidQuestion(null);
        midQuestionResolverRef.current = null;
        reject(new DOMException("Discussion stopped by user.", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      midQuestionResolverRef.current = (answer: string) => {
        signal.removeEventListener("abort", onAbort);
        setPendingMidQuestion(null);
        midQuestionResolverRef.current = null;
        resolve(answer);
      };
    });
  };

  const answerMidDiscussionQuestion = (answer: string) => {
    midQuestionResolverRef.current?.(answer);
  };

  const checkInWithManager = async (run: CollaborativeRun, signal: AbortSignal) => {
    const facilitator = getRunFacilitator(run);
    // Guaranteed next-steps prompt: previously the ONLY always-present question was a
    // generic "any other comments?" closing line — the team's own check-in questions were
    // conditional ("if nothing genuinely warrants checking in, return an empty list"), so a
    // run could complete with literally nothing offered beyond that generic line, which is
    // exactly what "didn't prompt me about going further into depth, or the next step"
    // was describing. This is now unconditional and explicitly about depth/next steps.
    const nextStepsQuestion = {
      question: "Where would you like to take this next?",
      options: ["Go deeper on this", "Start a related follow-up", "This is complete for now"],
      askedBy: facilitator?.id || "",
      freeTextOnly: false
    };
    try {
      const rosterText = customTeam.map(a => `- ${a.name}: ${a.persona.slice(0, 150)}`).join("\n");
      const resultSummary = run.taskType === "deliverable" && run.deliverable
        ? `DELIVERABLE — "${run.deliverable.title}":\n${run.deliverable.sections.map(s => `## ${s.heading} (by ${s.authorAgentName})\n${s.content}`).join("\n\n")}`
        : `OUTCOME:\n${run.outcome}\n\nREASONS:\n${run.reasons.join("\n")}`;
      // Everything the manager has ALREADY been asked and answered this session — see
      // src/lib/alreadyCovered.ts. Without this, the check-in step was working from only
      // the final outcome/reasons, genuinely blind to what had already been asked, so it
      // had no way to avoid re-asking a close variant of it.
      const alreadyCoveredBlock = buildAlreadyCoveredBlock(run.requirementsLog, run.transcript);
      const instruction = `You are checking in with the manager after the team just completed the task below. Only propose questions that would genuinely be valuable to confirm before considering this fully wrapped up — e.g. a low-confidence area, an assumption the team made, a choice that reasonably could go either way, or something only the manager would know (timeline, priorities, constraints). Before proposing anything, check it against the "ALREADY ASKED AND ANSWERED" list below (if present) — if a question would just restate or lightly reword something already covered there, skip it; only ask about what's still genuinely open. If nothing genuinely warrants checking in, return an empty list — do not manufacture a question just to have one. Propose at most 3.\n\nTHE TEAM:\n${rosterText}${alreadyCoveredBlock}\n\nFor each question, pick which team member above would most plausibly be the one asking it.\n\nRespond with ONLY a raw JSON object (no markdown, no commentary):\n{\n  "questions": [\n    { "question": "short, specific question", "options": ["short option 1", "short option 2", "short option 3"], "askedBy": "exact team member name" }\n  ]\n}\n\nEach question needs 2-4 short, mutually exclusive answer options — the manager can always type their own answer instead.`;
      const prompt = `TASK:\n${run.prompt}\n\n${resultSummary}`;
      const parsed = await callAgentForJson(facilitator, prompt, instruction, signal);
      const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
        .filter((q: any) => q?.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q: any) => ({
          question: q.question,
          options: q.options,
          askedBy: customTeam.find(a => a.name.toLowerCase() === String(q.askedBy || "").toLowerCase())?.id || facilitator.id
        }))
        .slice(0, 3);
      if (signal.aborted) return;
      setPostOutcomeAnswers(new Array(questions.length + 1).fill(null));
      setPostOutcomeQuestions([...questions, nextStepsQuestion]);
      setPostOutcomeGateState("gate");
      logDebug("info", `Team has ${questions.length} check-in question(s) plus the next-steps question`, run.id);
    } catch (err: any) {
      if (signal.aborted) return;
      // Not a core requirement — if the check itself fails, still offer the one guaranteed
      // next-steps question rather than silently dropping the whole feature.
      logDebug("warn", "Post-outcome check-in failed — offering just the next-steps question", err?.message || err);
      setPostOutcomeAnswers([null]);
      setPostOutcomeQuestions([nextStepsQuestion]);
      setPostOutcomeGateState("gate");
    }
  };

  const resetPostOutcomeState = () => {
    setPostOutcomeQuestions(null);
    setPostOutcomeGateState("hidden");
    setPostOutcomeIndex(0);
    setPostOutcomeAnswers([]);
    setPostOutcomeCustomAnswer("");
    setShowGoDeeperAxisPicker(false);
  };

  // Slot-based, matching the pre-discussion clarifying-question pattern: answers align by
  // index (null = not yet answered), and postOutcomeIndex is a freely-movable cursor rather
  // than a one-way pointer. Previously this only ever moved forward and auto-submitted the
  // moment the last question was answered — there was no way to go back and check or change
  // an earlier answer once you'd moved past it, which is exactly what was reported.
  const goToPostOutcomeQuestion = (index: number) => {
    if (!postOutcomeQuestions) return;
    const clamped = Math.max(0, Math.min(index, postOutcomeQuestions.length - 1));
    setPostOutcomeIndex(clamped);
    setPostOutcomeCustomAnswer("");
    setShowGoDeeperAxisPicker(false);
  };

  const answerPostOutcomeQuestion = (answer: string) => {
    if (!postOutcomeQuestions) return;
    const updated = [...postOutcomeAnswers];
    updated[postOutcomeIndex] = answer;
    setPostOutcomeAnswers(updated);
    setPostOutcomeCustomAnswer("");
    // Auto-advance to the next UNANSWERED question if one exists ahead — keeps the common
    // case (answering straight through) just as fast as before — but never auto-submits,
    // since with free navigation "the last slot got filled" no longer reliably means "the
    // user is done reviewing."
    const nextUnanswered = updated.findIndex((a, i) => a === null && i > postOutcomeIndex);
    if (nextUnanswered !== -1) {
      setPostOutcomeIndex(nextUnanswered);
    } else if (postOutcomeIndex + 1 < postOutcomeQuestions.length) {
      setPostOutcomeIndex(postOutcomeIndex + 1);
    }
  };

  const skipRemainingPostOutcomeQuestions = () => {
    if (!postOutcomeQuestions) return;
    const answers = postOutcomeAnswers
      .map((a, i) => (a !== null ? { question: postOutcomeQuestions[i].question, answer: a } : null))
      .filter((x): x is { question: string; answer: string } => x !== null);
    submitPostOutcomeAnswers(answers);
  };

  // Compiles whatever was answered into one message and sends it to the team like any other
  // Chat With The Team exchange — reusing the same streaming/revision/status machinery rather
  // than building a parallel mechanism. If nothing was answered, this is equivalent to "stop
  // here": no call is made.
  // The fixed navigational question the app always appends (see checkInWithManager) —
  // matched by text since it's not the team's own content, just "what next?" bookkeeping.
  const POST_OUTCOME_NEXT_STEPS_QUESTION = "Where would you like to take this next?";

  const submitPostOutcomeAnswers = (answers: { question: string; answer: string }[]) => {
    setPostOutcomeGateState("dismissed");
    if (answers.length === 0) return;

    // Split the two genuinely different things this gate bundles: the team's own content
    // questions (substantive — could actually change the outcome) vs. the app's fixed
    // "what next?" question (navigational — never content the team needs to see).
    const navAnswer = answers.find(a => a.question === POST_OUTCOME_NEXT_STEPS_QUESTION);
    const contentAnswers = answers.filter(a => a.question !== POST_OUTCOME_NEXT_STEPS_QUESTION);

    // "Go deeper on this" opens the same Go Deeper session used from a tree node's context
    // menu, subsuming the old whole-run mechanism. Takes priority over any content answers
    // present at the same time — running a full re-discussion AND opening a scoping session
    // against the tree it would replace is a genuine conflict, so this wins and any content
    // answers are dropped rather than risk that collision (rare in practice: the nav
    // question is always present, content questions are 0-3 and optional).
    if (navAnswer?.answer.startsWith("Go deeper on this")) {
      const focusMatch = navAnswer.answer.match(/ — focus on: (.+)$/);
      const targetNode = focusMatch && collaborativeRun
        ? getTreeChildren(collaborativeRun.decisionTree, null).find(n => n.label === focusMatch[1])
        : null;
      startGoDeeper(targetNode || null);
      if (contentAnswers.length > 0) {
        logDebug("info", "Dropped wrap-up content answers in favor of Go Deeper", `${contentAnswers.length} answer(s) not separately delivered`);
      }
      return;
    }

    // Content answers are substantive — they could genuinely change the outcome — so they
    // go to a full re-discussion (same premiseAmendments mechanism Considerations' "re-run
    // with these responses" uses), never to Team Chat. Takes priority over the nav pick:
    // the current task isn't really "complete" or ready to be left behind for a new one if
    // the manager just answered something that might change it.
    if (contentAnswers.length > 0) {
      const amendments = contentAnswers.map(a => `- ${a.question} → ${a.answer}`).join("\n");
      logDebug("info", `Re-running the discussion with ${contentAnswers.length} wrap-up answer(s)`, amendments.slice(0, 300));
      runCollaborativeSession(null, null, amendments, null, null, null, contentAnswers.map(a => ({ label: a.question, text: a.answer, sourceType: "follow_up" as const })));
      return;
    }

    // No content to act on — just the navigational pick. "This is complete for now" needs
    // nothing further (the gate above already dismissed itself). "Start a related
    // follow-up" opens a fresh task, keeping the current team and knowledge base — the
    // same thing "New Conversation → Keep Setup" does, just without the extra dialog since
    // the manager's intent is already established by picking this.
    if (navAnswer?.answer === "Start a related follow-up") {
      confirmKeepSetupForNewConversation();
    }
  };

  // Memoized so DecisionTreeNode/FlowNode's memo() wrapping actually engages — passing a
  // fresh object literal as the `actions` prop on every render (as this used to be, inline
  // in JSX) gives every node in the tree a "changed" prop every time, defeating memo()
  // entirely regardless of how stable the individual handlers are. Every handler referenced
  // below is itself useCallback-wrapped for the same reason — one un-memoized function in
  // here would make this useMemo re-fire every render too.
  const deliverableTreeActions = useMemo<TreeNodeActions>(() => ({
    onAddComment: openAddCommentDialog,
    onViewScopingQA: setViewingScopingQANode,
    onReviseNode: collaborativeLoading || isRevising ? undefined : requestReviseNode,
    onDeleteNode: collaborativeLoading ? undefined : deleteNode
  }), [openAddCommentDialog, collaborativeLoading, isRevising, requestReviseNode, deleteNode]);

  const mainTreeActions = useMemo<TreeNodeActions>(() => ({
    onForce: requestForceBranch,
    onPromote: requestPromoteNode,
    onDiscuss: requestDiscussNode,
    onGoDeeper: startGoDeeper,
    onAddOutcome: collaborativeLoading || isAddingOutcome ? undefined : requestAddOutcome,
    onModifyDecision: collaborativeLoading || isAddingOutcome ? undefined : requestModifyDecision,
    onAddComment: openAddCommentDialog,
    onViewScopingQA: setViewingScopingQANode,
    onReviseNode: collaborativeLoading || isRevising ? undefined : requestReviseNode,
    onDeleteNode: collaborativeLoading ? undefined : deleteNode
  }), [requestForceBranch, requestPromoteNode, requestDiscussNode, startGoDeeper, collaborativeLoading, isAddingOutcome, requestAddOutcome, requestModifyDecision, openAddCommentDialog, isRevising, requestReviseNode, deleteNode]);

  return (
    <TooltipProvider>
      <div className="min-h-screen transition-colors duration-300">
      <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
        {authLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !user ? (
          <AuthScreen />
        ) : (
          <>
            {/* Floating, centred pill header — detached from the page edge, white surface,
                soft shadow. Wordmark left; quiet text navigation; the primary action
                (New Conversation) as the single filled CTA; profile menu on the far right. */}
            <div className="sticky top-4 z-30 px-4 sm:px-6">
              <header className="mx-auto w-full max-w-5xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[28px] md:rounded-full shadow-[0_8px_30px_-6px_rgba(15,23,42,0.12)] border border-slate-200/70 dark:border-slate-800">
              <div className="h-14 flex items-center gap-3 lg:gap-6 pl-5 pr-2.5">
                <OrchestraWordmark />
                <nav className="hidden md:flex items-center gap-1 ml-auto">
                  {NAV_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === item.id
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
                <div className="flex items-center gap-2 md:ml-2 ml-auto">
                  {/* role=status/aria-live: transient state changes (saves, errors,
                      generation progress) were previously invisible to screen readers —
                      the region persists even while visually hidden below sm so the
                      announcement still fires on mobile. */}
                  <span role="status" aria-live="polite">
                    {status && (
                      <Badge variant="outline" className="hidden sm:inline-flex animate-in fade-in slide-in-from-right-2 rounded-full border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                        {status}
                      </Badge>
                    )}
                  </span>
                  
                  <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 border-l dark:border-slate-800">
                      <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                          <Settings className="w-5 h-5 text-blue-600" />
                          Settings
                        </SheetTitle>
                        <SheetDescription>
                          Manage your profile and API configurations.
                        </SheetDescription>
                      </SheetHeader>

                      <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 border-b dark:border-slate-800">
                          <TabsList className="w-full grid grid-cols-3 h-11 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-2">
                            <TabsTrigger value="profile" className="rounded-lg text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                              <User className="w-3.5 h-3.5 mr-2" />
                              Profile
                            </TabsTrigger>
                            <TabsTrigger value="api" className="rounded-lg text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                              <Key className="w-3.5 h-3.5 mr-2" />
                              API Keys
                            </TabsTrigger>
                            <TabsTrigger value="editor" className="rounded-lg text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Editor
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                          <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-6">
                              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed dark:border-slate-800">
                                <div className="relative group">
                                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 dark:bg-slate-800">
                                    {profilePhoto ? (
                                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                        <User className="w-10 h-10" />
                                      </div>
                                    )}
                                  </div>
                                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all scale-90 group-hover:scale-100">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                  </label>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.email}</p>
                                  <p className="text-xs text-slate-500 font-semibold mt-1">User Account</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800">
                                <div>
                                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">Appearance</Label>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Light or dark interface</p>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full w-8 h-8 ${!darkMode ? "bg-white shadow-sm" : ""}`}
                                    onClick={() => setDarkMode(false)}
                                  >
                                    <Sun className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full w-8 h-8 ${darkMode ? "bg-slate-700 shadow-sm" : ""}`}
                                    onClick={() => setDarkMode(true)}
                                  >
                                    <Moon className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800">
                                <div className="pr-4">
                                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">Notify me when done</Label>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">A browser notification when a run or chat finishes while this tab is hidden.</p>
                                </div>
                                <Switch checked={notifyOnComplete} onCheckedChange={toggleNotifyOnComplete} />
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="profile-name" className="text-xs font-medium text-slate-500">Display Name</Label>
                                  <Input 
                                    id="profile-name"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="Your name"
                                    className="rounded-xl bg-card"
                                  />
                                </div>
                                <Button onClick={handleProfileUpdate} className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl h-10 text-xs font-medium">
                                  Update Display Name
                                </Button>
                              </div>

                              <Separator className="dark:bg-slate-800" />

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-password" className="text-xs font-medium text-slate-500">Change Password</Label>
                                  <Input 
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="rounded-xl bg-card"
                                  />
                                </div>
                                <Button 
                                  onClick={handlePasswordUpdate} 
                                  disabled={!newPassword}
                                  variant="outline"
                                  className="w-full rounded-xl h-10 text-xs font-medium"
                                >
                                  Update Password
                                </Button>
                              </div>

                              {profileStatus && (
                                <div role="alert" className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${profileStatus.includes('Error') ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>
                                  {profileStatus.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                  {profileStatus}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="api" className="mt-0 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {keysEncryptionEnabled === false && (
                              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                  <span className="font-bold">Keys are stored without encryption.</span> The server doesn't have an encryption secret configured — your API keys are saved as plain text. Ask whoever manages this deployment to set <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 px-1 rounded">KEYS_ENCRYPTION_SECRET</code>.
                                </p>
                              </div>
                            )}
                            {keysEncryptionEnabled === true && (
                              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" /> Keys are encrypted at rest on this server.
                              </div>
                            )}
                            <div className="space-y-6">
                              {Object.keys(keys).map((k) => (
                                <div key={k} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`${k}-key`} className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                      {k} Platform
                                      <a href={AGENT_LINKS[k as keyof typeof AGENT_LINKS]} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-0.5 lowercase font-normal">
                                        <ExternalLink className="w-3 h-3" /> manage
                                      </a>
                                    </Label>
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <div className="relative">
                                      <Input
                                        id={`${k}-key`}
                                        type={showKeys[k as keyof typeof showKeys] ? "text" : "password"}
                                        placeholder={keys[k as keyof typeof keys]?.startsWith("enc:v1:") ? "Key saved (encrypted) — type to replace" : `Enter ${k} key...`}
                                        value={keys[k as keyof typeof keys]?.startsWith("enc:v1:") ? "" : keys[k as keyof typeof keys]}
                                        onChange={(e) => handleKeyChange(k, e.target.value)}
                                        className="bg-card pr-10 rounded-xl border-slate-200 dark:border-slate-800"
                                      />
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowKeys({...showKeys, [k]: !showKeys[k as keyof typeof showKeys]})}
                                      >
                                        {showKeys[k as keyof typeof showKeys] ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                                      </Button>
                                    </div>
                                    {keys[k as keyof typeof keys]?.startsWith("enc:v1:") && (
                                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Stored encrypted — never sent to your browser in plaintext.
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-500">Model Selection</Label>
                                    <Select 
                                      value={models[k as keyof typeof models]} 
                                      onValueChange={(val) => handleModelChange(k, val)}
                                    >
                                      <SelectTrigger className="bg-card h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl">
                                        {MODEL_OPTIONS[k as keyof typeof MODEL_OPTIONS].map(opt => (
                                          <SelectItem key={opt.id} value={opt.id} className="rounded-lg">{opt.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="editor" className="mt-0 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-6">
                              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${editorEnabled ? "bg-blue-50 dark:bg-blue-950/30 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                    <Pencil className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="editor-enabled-toggle" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                      Output Editor
                                    </Label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Copyedits team output before you see it</p>
                                  </div>
                                  <Switch
                                    id="editor-enabled-toggle"
                                    checked={editorEnabled}
                                    onCheckedChange={(val: boolean) => { setEditorEnabled(val); saveEditorSettings(val, editorBlacklist, editorRestructuring, editorPrompt); }}
                                  />
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  When enabled, team output is passed through a copyediting step before you see it — removing AI-sounding phrasing, defining unexplained acronyms, and enforcing anything set below.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="editor-blacklist" className="text-xs font-medium text-slate-500">Blacklisted Words</Label>
                                <Textarea
                                  id="editor-blacklist"
                                  value={editorBlacklist}
                                  onChange={(e) => setEditorBlacklist(e.target.value)}
                                  onBlur={() => saveEditorSettings(editorEnabled, editorBlacklist, editorRestructuring, editorPrompt)}
                                  placeholder={"One word or phrase per line, e.g.\ndelve\ntestament\nin today's fast-paced world"}
                                  rows={5}
                                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[100px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-slate-500">Excluded from any output the Editor processes — one entry per line.</p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500">Restructuring Allowance</Label>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => { setEditorRestructuring("moderate"); saveEditorSettings(editorEnabled, editorBlacklist, "moderate", editorPrompt); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${editorRestructuring === "moderate" ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {editorRestructuring === "moderate" ? <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 flex-shrink-0" />}
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Moderate</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Break up large walls of text and use bullets if it aids readability.</p>
                                  </button>
                                  <button
                                    onClick={() => { setEditorRestructuring("minimal"); saveEditorSettings(editorEnabled, editorBlacklist, "minimal", editorPrompt); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${editorRestructuring === "minimal" ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {editorRestructuring === "minimal" ? <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 flex-shrink-0" />}
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Minimal</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Keep the paragraph structure exactly as is.</p>
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="editor-prompt" className="text-xs font-medium text-slate-500">Editor Prompt</Label>
                                  {editorPrompt !== DEFAULT_EDITOR_PROMPT && (
                                    <button
                                      onClick={() => { setEditorPrompt(DEFAULT_EDITOR_PROMPT); saveEditorSettings(editorEnabled, editorBlacklist, editorRestructuring, DEFAULT_EDITOR_PROMPT); }}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                                    >
                                      Reset to default
                                    </button>
                                  )}
                                </div>
                                <div className="relative">
                                  <Textarea
                                    id="editor-prompt"
                                    value={editorPrompt}
                                    onChange={(e) => setEditorPrompt(e.target.value)}
                                    onBlur={() => saveEditorSettings(editorEnabled, editorBlacklist, editorRestructuring, editorPrompt)}
                                    rows={10}
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[220px] max-h-[400px] overflow-y-auto custom-scrollbar focus-visible:ring-2 focus-visible:ring-blue-500 outline-none leading-relaxed"
                                  />
                                  {/* Signals there's more content below the fold beyond just the
                                      native scrollbar, since the default prompt is intentionally long. */}
                                  <div className="absolute bottom-0 inset-x-1 h-6 rounded-b-xl bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
                                </div>
                                <p className="text-xs text-slate-500">Blacklisted words and the restructuring allowance above are automatically enforced alongside this prompt — no need to repeat them here.</p>
                              </div>
                            </div>
                          </TabsContent>
                        </div>
                      </Tabs>

                      <div className="p-6 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 rounded-xl shadow-lg shadow-blue-500/20 font-medium text-xs"
                          onClick={() => {
                            saveSettings(keys, models);
                            setIsSettingsOpen(false);
                            setStatus("Settings saved successfully");
                            setTimeout(() => setStatus(null), 3000);
                          }}
                        >
                          <Save className="w-4 h-4" />
                          Save & Close Settings
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <NewConversationButton onClick={startNewConversation} />

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 p-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="h-5 w-5 text-slate-500" />
                        )}
                      </Button>
                    } />
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("comparison")} className="cursor-pointer">
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          <span>Comparison</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("teams")} className="cursor-pointer">
                          <Bookmark className="mr-2 h-4 w-4" />
                          <span>My Teams</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("files")} className="cursor-pointer">
                          <FolderOpen className="mr-2 h-4 w-4" />
                          <span>My Files</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={startTour} className="cursor-pointer">
                          <Sparkles className="mr-2 h-4 w-4" />
                          <span>Show Me Around</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-slate-500 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> Private Session
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Mobile navigation: the same three destinations, in a scrollable row
                  inside the floating pill. */}
              <nav className="md:hidden flex items-center gap-1 px-3 pb-2.5 overflow-x-auto">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTab === item.id
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </nav>
              </header>
            </div>

            {/* Full-bleed by explicit request: the Team Session console should span the
                viewport. Long prose readability is handled inside cards (see the prose
                width caps on outcome/section content) rather than by capping the shell. */}
            <main className="w-full flex-1 px-6 lg:px-8 pt-6 pb-8 space-y-8">
              {activeTab === "comparison" ? (
                <>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-blue-500" />
                      Comparison
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      A playground: send one prompt to every configured agent at once and compare their answers side by side.
                    </p>
                  </div>

                  {/* Prompt Section - MOVED TO TOP */}
                  <section className="space-y-4">
                <div className="flex gap-3 items-stretch">
                  <div className="relative flex-1 flex gap-2 items-stretch">
                    <div className="flex-shrink-0">
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="w-[161px] h-16 rounded-2xl border-slate-200 dark:border-slate-800 bg-card shadow-lg text-lg font-medium">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full">Full</SelectItem>
                          <SelectItem value="Summary">Summary</SelectItem>
                          <SelectItem value="Bullet Points">Bullet Points</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="relative flex-1 h-16">
                      <Input
                        placeholder="Enter your prompt for all agents..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="h-full px-6 text-xl shadow-lg border-slate-200 dark:border-slate-800 bg-card focus-visible:ring-blue-500 rounded-2xl"
                        onKeyDown={(e) => e.key === "Enter" && runExecution()}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button 
                          size="lg" 
                          onClick={runExecution} 
                          disabled={loading || !prompt}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                        >
                          {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Execute
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="looping-mode"
                          checked={loopingEnabled}
                          onCheckedChange={(val) => {
                            setLoopingEnabled(val);
                            saveSettings(keys, models, val, maxLoops);
                          }}
                        />
                        <Label htmlFor="looping-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                          <Repeat className={`w-4 h-4 ${loopingEnabled ? "text-blue-500" : "text-slate-500"}`} />
                          Recursive Looping
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3.5 h-3.5 ml-0.5 opacity-50 hover:opacity-100 transition-opacity" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] p-4 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                              <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">Recursive Refinement</p>
                                <p>This feature feeds the initial prompt and the combined research back into the agents for multiple rounds of analysis.</p>
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">Why enable it?</p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li><strong className="text-slate-900 dark:text-slate-100">Self-Correction:</strong> Agents can spot and fix errors made in the first pass.</li>
                                    <li><strong className="text-slate-900 dark:text-slate-100">Deeper Insight:</strong> Encourages agents to build upon each other's unique findings.</li>
                                    <li><strong className="text-slate-900 dark:text-slate-100">Polished Results:</strong> Produces a much more thorough and validated final report.</li>
                                  </ul>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      
                      {loopingEnabled && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-xs text-slate-500 font-medium">Iterations:</span>
                          <Select 
                            value={maxLoops.toString()} 
                            onValueChange={(val) => {
                              const num = parseInt(val);
                              setMaxLoops(num);
                              saveSettings(keys, models, loopingEnabled, num);
                            }}
                          >
                            <SelectTrigger className="h-8 w-16 text-xs rounded-md border-slate-200 dark:border-slate-800">
                              <SelectValue placeholder={maxLoops.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()} className="text-xs">
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-500 italic">
                    </div>
                  </div>
                </div>
              </section>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {agents.map((agent) => {
                    const Icon = agent.icon;
                    const result = results[agent.id as keyof Results];
                    const isEnabled = enabledAgents[agent.id as keyof typeof enabledAgents];
                    const isLead = leadAgentId === agent.id || (!leadAgentId && agents.filter(a => enabledAgents[a.id as keyof typeof enabledAgents])[0]?.id === agent.id);
                    
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: agents.indexOf(agent) * 0.1 }}
                        className="relative transition-all hover:z-50"
                      >
                        <Card className={`h-[600px] flex flex-col shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 !overflow-visible group transition-all ${isLead && isEnabled ? "ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-slate-950" : "hover:border-blue-300 dark:hover:border-blue-700"}`}>
                          <div className={`p-5 flex items-center justify-between ${isEnabled ? agent.bg : "bg-slate-100 dark:bg-slate-800/50"} border-b dark:border-slate-800`}>
                            <div className={`flex items-center gap-3 ${!isEnabled ? "opacity-50 grayscale-[0.5]" : ""}`}>
                              <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${isEnabled ? agent.color : "text-slate-500"}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium text-sm tracking-tight ${!isEnabled ?"text-slate-500" :""}`}>{agent.name}</span>
                                  {isEnabled && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`w-6 h-6 rounded-full transition-colors ${isLead ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "text-slate-300 hover:text-yellow-400"}`}
                                      onClick={() => setLeadAgentId(agent.id)}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isLead ? "fill-current" : ""}`} />
                                    </Button>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 font-mono truncate max-w-[100px]">
                                  {models[agent.id as keyof typeof models]}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {result && isEnabled && (
                                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold">
                                  DONE
                                </Badge>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="group/toggle relative">
                                  <div className={!isEnabled ? "opacity-50 grayscale-[0.5]" : ""}>
                                    <Switch 
                                      checked={isEnabled} 
                                      disabled={!keys[agent.id as keyof typeof keys]}
                                      onCheckedChange={(val) => {
                                        setEnabledAgents(prev => ({ ...prev, [agent.id]: val }));
                                        if (!val && leadAgentId === agent.id) setLeadAgentId(null);
                                      }}
                                      className="data-checked:bg-blue-600 data-unchecked:bg-[#eaa8a8] dark:data-unchecked:bg-slate-700"
                                    />
                                  </div>
                                  {!keys[agent.id as keyof typeof keys] && (
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover/toggle:block w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-[9999] border border-slate-700 animate-in fade-in slide-in-from-bottom-1">
                                      An API key for this agent must be supplied in settings
                                    </div>
                                  )}
                                </div>
                                {!keys[agent.id as keyof typeof keys] && (
                                  <Lock className={`w-3 h-3 ${!isEnabled ? "opacity-50" : "text-slate-500"}`} />
                                )}
                              </div>
                            </div>
                          </div>
                          <CardContent className={`flex-1 p-0 min-h-0 flex flex-col ${!isEnabled ? "opacity-50 grayscale-[0.5]" : ""}`}>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                              <div className="p-6 pb-2">
                                {!isEnabled ? (
                                  <div className="flex flex-col items-center justify-center h-full pt-32 text-slate-500 dark:text-slate-600">
                                    <Icon className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-xs font-medium tracking-[0.2em]">
                                      Agent Disabled
                                    </p>
                                  </div>
                                ) : loading && !result ? (
                                  <div className="flex flex-col items-center justify-center h-full space-y-4 pt-32">
                                    <div className="relative">
                                      <RefreshCw className={`w-10 h-10 animate-spin ${agent.color} opacity-20`} />
                                      <div className={`absolute inset-0 flex items-center justify-center ${agent.color}`}>
                                        <Icon className="w-4 h-4 animate-pulse" />
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium animate-pulse tracking-[0.2em]">
                                      Processing...
                                    </p>
                                  </div>
                                ) : result ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                    {typeof result === 'string' ? result : (
                                      <div className="space-y-4">
                                        {result.text && <p>{result.text}</p>}
                                        {result.image && (
                                          <div className="rounded-lg overflow-hidden border dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                                            <img 
                                              src={result.image} 
                                              alt="Generated content" 
                                              className="w-full h-auto object-cover"
                                              referrerPolicy="no-referrer"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full pt-32 text-slate-300 dark:text-slate-700">
                                    <Icon className="w-16 h-16 mb-4 opacity-10" />
                                    <p className="text-xs font-medium tracking-[0.2em] opacity-30">
                                      Standby
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {result && isEnabled && (
                              <div className="px-3 py-1.5 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => setExpandedAgentId(agent.id)}
                                  title="Expand Output"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <Dialog open={!!expandedAgentId} onOpenChange={(open) => !open && setExpandedAgentId(null)}>
                <DialogContent className="max-w-[60vw] w-[60vw] h-[80vh] flex flex-col p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-card">
                  <DialogHeader className="p-6 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedAgentId && (
                          <>
                            <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${agents.find(a => a.id === expandedAgentId)?.color}`}>
                              {(() => {
                                const Icon = agents.find(a => a.id === expandedAgentId)?.icon || MessageSquare;
                                return <Icon className="w-5 h-5" />;
                              })()}
                            </div>
                            <DialogTitle className="text-xl font-medium tracking-tight">
                              {agents.find(a => a.id === expandedAgentId)?.name} Output
                            </DialogTitle>
                          </>
                        )}
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <div className="p-8">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                        {expandedAgentId && (() => {
                          const res = results[expandedAgentId as keyof Results];
                          if (typeof res === 'string') return res;
                          return (
                            <div className="space-y-6">
                              {res.text && <p>{res.text}</p>}
                              {res.image && (
                                <div className="rounded-xl overflow-hidden border dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950">
                                  <img 
                                    src={res.image} 
                                    alt="Generated content" 
                                    className="w-full h-auto"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Combined Report Section */}
              {(combinedReport || aggregatedReview) && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Collapsible open={isAggregatedOpen} onOpenChange={setIsAggregatedOpen}>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Output
                      </h2>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {combinedReport.length} characters
                        </Badge>
                        <CollapsibleTrigger render={
                          <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isAggregatedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        } />
                      </div>
                    </div>
                    
                    <CollapsibleContent className="space-y-6">
                      {aggregatedReview && (
                        <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-900/10 shadow-md">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center">
                                  Lead Agent Review ({outputFormat})
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3.5 h-3.5 ml-1.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[320px] p-4 bg-card border-yellow-200 dark:border-yellow-900 shadow-xl">
                                      <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                        <p className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">What the Lead Agent does:</p>
                                        <p>Think of it as the <span className="font-semibold italic">Editor-in-Chief</span> or <span className="font-semibold italic">Project Manager</span> of the group:</p>
                                        <ul className="space-y-2">
                                          <li className="flex gap-2">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-500">1.</span>
                                            <span><strong className="text-slate-900 dark:text-slate-100">Gathering Information:</strong> Waits for all agents to finish their individual research.</span>
                                          </li>
                                          <li className="flex gap-2">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-500">2.</span>
                                            <span><strong className="text-slate-900 dark:text-slate-100">Reading the Room:</strong> Compares findings, agreements, and unique details.</span>
                                          </li>
                                          <li className="flex gap-2">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-500">3.</span>
                                            <span><strong className="text-slate-900 dark:text-slate-100">Synthesizing:</strong> Connects the dots and merges the best parts together.</span>
                                          </li>
                                          <li className="flex gap-2">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-500">4.</span>
                                            <span><strong className="text-slate-900 dark:text-slate-100">Quality Control:</strong> Filters out errors and prioritizes high-signal info.</span>
                                          </li>
                                          <li className="flex gap-2">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-500">5.</span>
                                            <span><strong className="text-slate-900 dark:text-slate-100">Final Polish:</strong> Rewrites everything into your chosen format for a cohesive result.</span>
                                          </li>
                                        </ul>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </CardTitle>
                              </div>
                              <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-700 dark:text-yellow-400">
                                {leadAgentId || agents.filter(a => enabledAgents[a.id as keyof typeof enabledAgents])[0]?.id}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                              {typeof aggregatedReview === 'string' ? aggregatedReview : (
                                <div className="space-y-6">
                                  {aggregatedReview.text && <p>{aggregatedReview.text}</p>}
                                  {(Object.values(results) as (string | AgentResult)[])
                                    .filter((res): res is AgentResult => typeof res !== 'string' && !!res && 'image' in res && !!res.image)
                                    .map((res, idx) => (
                                      <div key={idx} className="rounded-xl overflow-hidden border dark:border-slate-800 shadow-lg bg-white dark:bg-slate-950">
                                        <img 
                                          src={res.image} 
                                          alt="Generated content" 
                                          className="w-full h-auto"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Collapsible open={isRawOutputOpen} onOpenChange={setIsRawOutputOpen}>
                        <Card className="shadow-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                          <CardContent className="p-0">
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 border-b dark:border-slate-800 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger render={
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                    {isRawOutputOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </Button>
                                } />
                                <span className="text-xs font-medium text-slate-500">Raw Aggregated Output</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs gap-1.5"
                                onClick={() => {
                                  navigator.clipboard.writeText(combinedReport);
                                  setStatus("Copied to clipboard!");
                                }}
                              >
                                Copy All
                              </Button>
                            </div>
                            <CollapsibleContent>
                              <div className="h-[300px] w-full overflow-y-auto custom-scrollbar border-t dark:border-slate-800">
                                <div className="p-6 font-mono text-sm text-slate-600 dark:text-slate-500 whitespace-pre-wrap leading-relaxed">
                                  {combinedReport}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.section>
              )}
                </>
              ) : activeTab === "custom" || activeTab === "product" ? (
                <div className="animate-in fade-in duration-300">
                  {/* Visually this tab opens straight onto the console card; the sr-only h1
                      gives the heading outline a level-1 root without altering the layout. */}
                  <h1 className="sr-only">{activeTab === "product" ? "Product" : "Multi Agent Team"}</h1>
                  {/* Mobile backdrop while the workspace panel is open as an overlay */}
                  {isLeftPanelOpen && (
                    <div
                      className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
                      onClick={() => setIsLeftPanelOpen(false)}
                      aria-hidden="true"
                    />
                  )}
                  {/* Workspace panel: Knowledge Base + Team Agents. Slides in/out of the
                      left edge exactly like Team Chat does on the right — fixed, full
                      height below the header, its own scroll, a close handle hanging off
                      its outer edge — but open by default. */}
                  <aside
                    className={`fixed inset-y-0 lg:top-[84px] left-0 z-40 lg:z-10 w-[320px] xl:w-[380px] max-w-[88vw] bg-background border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
                      isLeftPanelOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                    aria-label="Workspace panel"
                    aria-hidden={!isLeftPanelOpen}
                  >
                    {isLeftPanelOpen && (
                      <button
                        onClick={() => setIsLeftPanelOpen(false)}
                        aria-label="Close workspace panel"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center pl-3 pr-3 py-3 rounded-r-xl bg-slate-700 hover:bg-slate-800 text-white shadow-lg transition-colors"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </button>
                    )}
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
                    {/* Knowledge Base Upload Area */}
                    <div id="panel-section-knowledge-base" className="space-y-6">
                      <Card className="shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <Collapsible open={isKnowledgeBaseOpen} onOpenChange={setIsKnowledgeBaseOpen}>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between gap-2">
                          <div className="space-y-1.5">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                              <UploadCloud className="w-4 h-4 text-blue-500" />
                              {isProductTab ? "Product Knowledge Base" : "Knowledge Base"}
                              <Badge variant="outline" className="text-xs font-mono font-bold">
                                {currentKnowledgeFiles.length}
                              </Badge>
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg gap-1.5 border-slate-200 dark:border-slate-800 h-8 text-xs"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" /> Files
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    disabled={knowledgeFiles.length === 0}
                                    onClick={() => { setNewKnowledgeSetName(""); setIsSaveKnowledgeSetDialogOpen(true); }}
                                    className="text-xs flex items-center gap-2 cursor-pointer"
                                  >
                                    <Bookmark className="w-3.5 h-3.5" /> Save This Setup
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                      disabled={savedKnowledgeSets.length === 0}
                                      className="text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5" /> Load Setup
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-56">
                                      {savedKnowledgeSets.map(set => (
                                        <DropdownMenuItem
                                          key={set.id}
                                          onClick={() => requestLoadKnowledgeSet(set)}
                                          className="text-xs flex items-center justify-between gap-2 cursor-pointer"
                                        >
                                          <span className="truncate">{set.name}</span>
                                          <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                                            {set.files.length}
                                          </Badge>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={knowledgeFiles.length === 0}
                                    onClick={() => {
                                      const count = knowledgeFiles.length;
                                      knowledgeFiles.forEach(f => moveSourceToTrash(f));
                                      setKnowledgeFiles([]);
                                      logDebug("info", "Knowledge Base cleared", `${count} source(s) moved to recently deleted — recoverable via "Restore all" in this card`);
                                    }}
                                    className="text-xs flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
                                  >
                                    <Eraser className="w-3.5 h-3.5" /> Clear Knowledge Base
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CollapsibleTrigger
                            render={
                              <Button variant="ghost" size="icon" aria-label={isKnowledgeBaseOpen ? "Collapse Knowledge Base" : "Expand Knowledge Base"} className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0">
                                {isKnowledgeBaseOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            }
                          />
                        </CardHeader>
                        <CollapsibleContent>
                        <CardContent className="space-y-5">
                          {/* Scope Switcher for Product Tab */}
                          {isProductTab && (
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
                              <button
                                type="button"
                                onClick={() => setProductKnowledgeScope("all")}
                                className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                                  productKnowledgeScope === "all"
                                    ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                All Workspace ({knowledgeFiles.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductKnowledgeScope("product_only")}
                                className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                                  productKnowledgeScope === "product_only"
                                    ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Product Scope ({knowledgeFiles.filter(f => f.targetTab === "product").length})
                              </button>
                            </div>
                          )}

                          {/* Source Type Selector */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500">Add Source</Label>
                            <Select value={newSourceType} onValueChange={(val) => setNewSourceType(val as KnowledgeSourceType)}>
                              <SelectTrigger className="h-8 text-xs bg-card border-slate-200 dark:border-slate-800 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ADD_SOURCE_OPTIONS.map(type => {
                                  const meta = SOURCE_TYPE_META[type];
                                  return (
                                    <SelectItem key={type} value={type} className="text-xs">
                                      <span className="flex items-center gap-2">
                                        <meta.icon className="w-3.5 h-3.5" /> {meta.label}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Upload Box (files & images) */}
                          {newSourceType === "file" && (
                            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors group">
                              <input 
                                type="file" 
                                multiple 
                                onChange={handleFileUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".txt,.md,.json,.csv,.js,.ts,.html,.css,.pdf,.zip,application/zip,application/x-zip-compressed,image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.png,.jpg,.jpeg,.gif,.webp,.svg"
                              />
                              <div className="space-y-2">
                                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 text-slate-500 group-hover:text-blue-500 transition-colors">
                                  <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    Drag & drop or Click to Upload
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Text, markdown, json, csv, PDF, a codebase .zip archive, or images (PNG/JPEG/GIF/WebP/SVG, up to {formatBytes(MAX_IMAGE_BYTES)} each).
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pasted Text (text type) */}
                          {newSourceType === "text" && (
                            <div className="space-y-2">
                              <Textarea
                                value={newSourceText}
                                onChange={(e) => setNewSourceText(e.target.value)}
                                placeholder="Paste text for the knowledge base..."
                                rows={4}
                                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card focus-visible:ring-2 focus-visible:ring-blue-500 outline-none resize-none"
                              />
                              <Button
                                onClick={addTextSource}
                                disabled={!newSourceText.trim()}
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Pasted Text
                              </Button>
                            </div>
                          )}

                          {/* Link-based sources */}
                          {SOURCE_TYPE_META[newSourceType].kind === "link" && (
                            <div className="space-y-2">
                              {GOOGLE_GATED_SOURCE_TYPES.includes(newSourceType) && !googleConnections[newSourceType as GoogleGatedSourceType] ? (
                                <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2 text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                                    Connecting {SOURCE_TYPE_META[newSourceType].label} requires you to sign in with Google and grant this app permission to access it.
                                  </p>
                                  <Button
                                    onClick={() => connectGoogleService(newSourceType as GoogleGatedSourceType)}
                                    size="sm"
                                    className="w-full bg-card text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg gap-1.5"
                                  >
                                    <LogIn className="w-3.5 h-3.5" /> Connect Google Account
                                  </Button>
                                  {googleConnectNotice && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">{googleConnectNotice}</p>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {GOOGLE_GATED_SOURCE_TYPES.includes(newSourceType) && (
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3" /> Google account connected
                                      </p>
                                      <button
                                        onClick={() => disconnectGoogleService(newSourceType as GoogleGatedSourceType)}
                                        className="text-xs text-slate-500 hover:text-red-500 underline underline-offset-2"
                                      >
                                        Disconnect
                                      </button>
                                    </div>
                                  )}
                                  <Input
                                    value={newSourceUrl}
                                    onChange={(e) => setNewSourceUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addLinkSource()}
                                    placeholder={SOURCE_TYPE_META[newSourceType].placeholder}
                                    className="h-9 text-xs bg-card border-slate-200 dark:border-slate-800"
                                  />
                                  {newSourceType === "gmail" && (
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                      Plain phrases like "emails from John about the contract" won't match well — use Gmail's own operators: <code className="font-mono">from:</code>, <code className="font-mono">subject:</code>, <code className="font-mono">label:</code>, <code className="font-mono">after:</code>, etc.
                                    </p>
                                  )}
                                  <Button
                                    onClick={addLinkSource}
                                    disabled={!newSourceUrl.trim()}
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                                  >
                                    <Link2 className="w-3.5 h-3.5" /> Add {SOURCE_TYPE_META[newSourceType].label}
                                  </Button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Knowledge Source List */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-medium text-slate-500 flex justify-between items-center">
                              <span>Loaded Sources ({knowledgeFiles.length})</span>
                              {knowledgeFiles.some(f => f.size > 0) && (
                                <span className="text-xs font-mono lowercase">
                                  {formatBytes(knowledgeFiles.reduce((acc, f) => acc + f.size, 0))}
                                </span>
                              )}
                            </h3>
                            {/* In-flight uploads: a small spinner row per file, so an upload
                                doesn't look like nothing happened while it's still processing
                                (especially noticeable on larger PDFs going through extraction). */}
                            {uploadingFiles.length > 0 && (
                              <div className="space-y-2">
                                {uploadingFiles.map(u => (
                                  <div key={u.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10">
                                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">Uploading "{u.name}"…</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {currentKnowledgeFiles.length === 0 && uploadingFiles.length === 0 ? (
                              <div className="text-center py-8 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-1">
                                <FileText className="w-8 h-8 mx-auto stroke-[1.5]" />
                                <p className="text-xs">No knowledge sources in this scope.</p>
                              </div>
                            ) : currentKnowledgeFiles.length > 0 && (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {currentKnowledgeFiles.map(file => {
                                  const meta = SOURCE_TYPE_META[file.sourceType] || SOURCE_TYPE_META.file;
                                  const SourceIcon = meta.icon;
                                  return (
                                    <div 
                                      key={file.id} 
                                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950/40 shadow-sm"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex-shrink-0">
                                          <SourceIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-200 flex items-center">
                                            <span className="truncate">{file.name}</span>
                                            {file.targetTab === "product" && (
                                              <Badge variant="outline" className="text-[10px] py-0 px-1 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 ml-1.5 flex-shrink-0 font-normal">
                                                Product
                                              </Badge>
                                            )}
                                          </p>
                                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                                            {meta.label}{file.size > 0 ? ` · ${formatBytes(file.size)}` : ""}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {file.content && (
                                          <Tooltip>
                                            <TooltipTrigger render={
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewingKnowledgeFile(file)}
                                                className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </Button>
                                            } />
                                            <TooltipContent side="top" className="p-2 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                              <p className="text-xs text-slate-700 dark:text-slate-300">Open document</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {GOOGLE_GATED_SOURCE_TYPES.includes(file.sourceType) && file.sourceType !== "notebooklm" && (
                                          <Tooltip>
                                            <TooltipTrigger render={
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={googleFetchingId === file.id}
                                                onClick={() => fetchAndStoreGoogleContent(file.id, file.sourceType as GoogleGatedSourceType, file.url || "", file.name)}
                                                className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                              >
                                                <RefreshCw className={`w-3.5 h-3.5 ${googleFetchingId === file.id ? "animate-spin" : ""}`} />
                                              </Button>
                                            } />
                                            <TooltipContent side="top" className="p-2 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                              <p className="text-xs text-slate-700 dark:text-slate-300">Refresh content from Google</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {file.sourceType === "github" && (
                                          <Tooltip>
                                            <TooltipTrigger render={
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={githubFetchingId === file.id}
                                                onClick={() => fetchAndStoreGithubContent(file.id, file.url || "", file.name)}
                                                className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                              >
                                                <RefreshCw className={`w-3.5 h-3.5 ${githubFetchingId === file.id ? "animate-spin" : ""}`} />
                                              </Button>
                                            } />
                                            <TooltipContent side="top" className="p-2 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                              <p className="text-xs text-slate-700 dark:text-slate-300">Re-fetch latest content from GitHub</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {file.url && /^https?:\/\//.test(file.url) && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
                                            className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => deleteKnowledgeFile(file.id)}
                                          className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Recently deleted (soft-deleted by Start Completely Fresh) */}
                          {trashedSources.length > 0 && (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-dashed border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10">
                              <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <Trash2 className="w-3 h-3 flex-shrink-0" /> Recently deleted ({trashedSources.length})
                              </span>
                              <Button
                                onClick={restoreTrashedSources}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs rounded-md border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                              >
                                Restore all
                              </Button>
                            </div>
                          )}

                          {/* External Resources Toggle */}
                          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg hit-target flex items-center justify-center flex-shrink-0 ${useExternalResources ? "bg-blue-50 dark:bg-blue-950/30 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                <Globe className="w-3.5 h-3.5" />
                              </div>
                              <Label htmlFor="external-resources-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex-1 flex items-center gap-1.5">
                                {useExternalResources ? "External Resources Enabled" : "Knowledge Base Only"}
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-3 h-3 text-slate-500 hover:text-blue-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[240px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                      Agents may use general knowledge and web search alongside your documents.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Switch
                                id="external-resources-toggle"
                                checked={useExternalResources}
                                onCheckedChange={handleExternalResourcesToggle}
                              />
                            </div>
                            {!useExternalResources && (
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Agents are restricted to your uploaded documents and linked sources only.
                              </p>
                            )}
                          </div>
                        </CardContent>
                        </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    </div>

                    {/* Team Agents */}
                    <div id="panel-section-team-agents" className="space-y-6">
                      <Card className="shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <Collapsible open={isAgentRosterOpen} onOpenChange={setIsAgentRosterOpen}>
                        <CardHeader className="pb-4 space-y-3">
                          <div className="flex flex-row items-start justify-between gap-2">
                            <div className="space-y-1">
                              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Users className="w-4 h-4 text-blue-500" />
                                {isProductTab ? "Product Team" : "Team Agents"}
                                <Badge variant="outline" className="text-xs font-mono font-bold">
                                  {currentTeam.length}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Deploy as many agents as your objectives require.
                              </CardDescription>
                            </div>
                            <CollapsibleTrigger render={
                              <Button variant="ghost" size="icon" aria-label={isAgentRosterOpen ? "Collapse Team Agents" : "Expand Team Agents"} className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0">
                                {isAgentRosterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            } />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={addCustomAgent} 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 flex-1"
                            >
                              <Plus className="w-4 h-4" /> Add Agent
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg gap-1.5 border-slate-200 dark:border-slate-800 flex-1"
                                >
                                  <Bookmark className="w-3.5 h-3.5" /> Teams
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuGroup>
                                  {isProductTab && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={resetToDefaultProductTeam}
                                        className="text-xs flex items-center gap-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" /> Reset to Default Product Team
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => { setNewTeamName(""); setIsSaveTeamDialogOpen(true); }}
                                    className="text-xs flex items-center gap-2 cursor-pointer"
                                  >
                                    <Bookmark className="w-3.5 h-3.5" /> Save Team
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                      disabled={savedTeams.length === 0}
                                      className="text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5" /> Load Team
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-56">
                                      {savedTeams.map(team => (
                                        <DropdownMenuItem
                                          key={team.id}
                                          onClick={() => useSavedTeam(team)}
                                          className="text-xs flex items-center justify-between gap-2 cursor-pointer"
                                        >
                                          <span className="truncate">{team.name}</span>
                                          <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                                            {team.agents.length}
                                          </Badge>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  {/* Client/Project Presets: bundles a saved team + saved knowledge
                                      set into one action — recurring-workflow users (consultants,
                                      legal, finance) were saving and loading each half separately
                                      every time for what's conceptually one "client type". */}
                                  <DropdownMenuItem
                                    disabled={customTeam.length === 0}
                                    onClick={() => { setNewPresetName(""); setIsSavePresetDialogOpen(true); }}
                                    className="text-xs flex items-center gap-2 cursor-pointer"
                                  >
                                    <Layers className="w-3.5 h-3.5" /> Save as Preset (Team + Files)
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                      disabled={savedPresets.length === 0}
                                      className="text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5" /> Load Preset
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-64">
                                      {savedPresets.map(preset => (
                                        <DropdownMenuItem
                                          key={preset.id}
                                          onClick={() => applyPreset(preset)}
                                          className="text-xs flex items-center justify-between gap-2 cursor-pointer"
                                        >
                                          <span className="truncate">{preset.name}</span>
                                          <span className="flex items-center gap-1 flex-shrink-0">
                                            <CountTag>{preset.agents.length}</CountTag>
                                            <CountTag>{preset.files.length}</CountTag>
                                          </span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const fallbackProvider = (getAvailableProviders()[0]?.id as CustomAgent["provider"]) || "gemini";
                                      const updated = [createDefaultAgent(fallbackProvider)];
                                      setCustomTeam(updated);
                                      saveCustomTeamAndFiles(updated, knowledgeFiles);
                                      logDebug("info", "Team cleared", "Reset to a single default assistant");
                                    }}
                                    className="text-xs flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
                                  >
                                    <Eraser className="w-3.5 h-3.5" /> Clear Team
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CollapsibleContent>
                        <CardContent className="space-y-6">
                          {/* Suggest a team for a decision or product specification */}
                          <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10">
                            <button
                              onClick={() => {
                                setIsSuggestTeamOpen(prev => {
                                  const next = !prev;
                                  if (next && !decisionGoal.trim()) {
                                    const activePrompt = isProductTab ? productPrompt : customPrompt;
                                    if (activePrompt && activePrompt.trim()) {
                                      setDecisionGoal(activePrompt.trim());
                                    }
                                  }
                                  return next;
                                });
                              }}
                              className="w-full flex items-center justify-between gap-2 p-4"
                            >
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Suggest a team
                              </span>
                              {isSuggestTeamOpen ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />}
                            </button>
                            {isSuggestTeamOpen && (
                              <div className="px-4 pb-4 space-y-3">
                                {!suggestedTeamPreview && (
                                  <>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-card border border-slate-200 dark:border-slate-800">
                                        <button
                                          onClick={() => setSuggestTeamMode("replace")}
                                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${suggestTeamMode === "replace" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                                        >
                                          Replace team
                                        </button>
                                        <button
                                          onClick={() => setSuggestTeamMode("add")}
                                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${suggestTeamMode === "add" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                                        >
                                          Add to team
                                        </button>
                                      </div>
                                      {isProductTab ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (productPrompt.trim()) setDecisionGoal(productPrompt.trim());
                                          }}
                                          disabled={!productPrompt.trim()}
                                          className={`text-xs ${
                                            productPrompt.trim()
                                              ? "text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 cursor-pointer font-medium"
                                              : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                          }`}
                                          title={productPrompt.trim() ? "Populate with the prompt from your Product tab" : "Enter a prompt on the Product tab first"}
                                        >
                                          Use my Product prompt
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (customPrompt.trim()) setDecisionGoal(customPrompt.trim());
                                          }}
                                          disabled={!customPrompt.trim()}
                                          className={`text-xs ${
                                            customPrompt.trim()
                                              ? "text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 cursor-pointer font-medium"
                                              : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                          }`}
                                          title={customPrompt.trim() ? "Populate with your Team Session prompt" : "Enter a prompt in the Team Session first"}
                                        >
                                          Use my Team Session prompt
                                        </button>
                                      )}
                                    </div>
                                    <Textarea
                                      value={decisionGoal}
                                      onChange={(e) => setDecisionGoal(e.target.value)}
                                      placeholder={
                                        isProductTab
                                          ? "Describe the application, feature, or system to specify (e.g. 'Build a real-time collaborative canvas with CRDT sync, offline caching, and conflict resolution'). The required output is a production-ready specification."
                                          : "Describe the decision you need this team to reliably reach, e.g. 'Should we migrate our backend from REST to GraphQL?'"
                                      }
                                      rows={3}
                                      className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[70px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                                    />
                                    <Button
                                      onClick={suggestAgentTeam}
                                      disabled={suggestingTeam || !decisionGoal.trim() || getAvailableProviders().length === 0}
                                      size="sm"
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                                    >
                                      {suggestingTeam ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                      )}
                                      Suggest Agent Setup
                                    </Button>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                      {isProductTab
                                        ? (suggestTeamMode === "add"
                                            ? "Suggests technical specialists (Engineering, UI/UX, Schemas, QA) to complement your current team. Non-technical roles like Marketing are strictly excluded."
                                            : "Suggests a production-ready team of product, engineering, UI/UX, and QA specialists tailored to author an in-depth product specification. Irrelevant roles like Marketing are excluded.")
                                        : (suggestTeamMode === "add"
                                            ? "Suggests agents to add alongside your current team, avoiding overlap with existing coverage."
                                            : "Suggests a full roster to review before it replaces your current team — nothing is applied until you confirm.")}
                                      {currentKnowledgeFiles.length > 0 && " Your linked knowledge sources are factored into the suggestion."}
                                    </p>
                                    {suggestTeamError && (
                                      <p className="text-xs text-red-500 flex items-start gap-1.5">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {suggestTeamError}
                                      </p>
                                    )}
                                  </>
                                )}

                                {suggestTeamRationale && !suggestedTeamPreview && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> {suggestTeamRationale}
                                  </p>
                                )}

                                {/* Preview: nothing is applied until the user confirms */}
                                {suggestedTeamPreview && (
                                  <div className="space-y-3">
                                    <span className="block text-xs font-medium text-blue-600 dark:text-blue-400">
                                      Review {isProductTab ? "product specialists" : "suggestion"} ({Object.values(suggestedTeamSelected).filter(Boolean).length} of {suggestedTeamPreview.length} selected)
                                    </span>
                                    {suggestTeamRationale && (
                                      <p className="text-xs text-slate-500 leading-relaxed">{suggestTeamRationale}</p>
                                    )}
                                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                                      {suggestedTeamPreview.map(agent => (
                                        <label
                                          key={agent.id}
                                          className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-card cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!suggestedTeamSelected[agent.id]}
                                            onChange={(e) => setSuggestedTeamSelected(prev => ({ ...prev, [agent.id]: e.target.checked }))}
                                            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-blue-600 cursor-pointer"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                                              {agent.name}
                                              <span className="font-mono text-[10px] lowercase text-faint-foreground">{agent.provider}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{agent.persona}</p>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                    <Button
                                      onClick={applySuggestedTeam}
                                      disabled={Object.values(suggestedTeamSelected).every(v => !v)}
                                      size="sm"
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {isProductTab
                                        ? (suggestTeamMode === "add" ? "Add Selected Specialists" : "Apply Product Spec Team")
                                        : (suggestTeamMode === "add" ? "Add Selected Agents" : "Apply Selected Team")}
                                    </Button>
                                    <Button
                                      onClick={discardSuggestedTeam}
                                      size="sm"
                                      variant="ghost"
                                      className="w-full text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                                    >
                                      Discard
                                    </Button>
                                  </div>
                                )}

                                {justAppliedSuggestion && !suggestedTeamPreview && (
                                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10">
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Team applied.</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => { setNewTeamName(""); setIsSaveTeamDialogOpen(true); setJustAppliedSuggestion(false); }}
                                      className="h-7 text-xs rounded-md border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                                    >
                                      Save this team
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {getAvailableProviders().length === 0 ? (
                            <div className="text-center py-12 px-6 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 space-y-4">
                              <Lock className="w-10 h-10 mx-auto text-slate-500 stroke-[1.5]" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No API Keys Connected</p>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                  Your custom agents need active API keys to run. Open the Settings sheet to add keys for Gemini, Claude, Perplexity, or Grok.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {currentTeam.map((agent, index) => {
                                const availableProviders = getAvailableProviders();
                                const isExpanded = expandedAgents[agent.id] ?? currentTeam.length === 1;
                                return (
                                  <div 
                                    key={agent.id} 
                                    className={`rounded-xl border transition-all ${
                                      isProductTab && index === 0 
                                        ? "border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm" 
                                        : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20"
                                    } relative group`}
                                  >
                                    {/* One-line summary header; click to expand/collapse the editor */}
                                    <div className="flex items-center gap-1.5 p-3">
                                      <button
                                        onClick={() => setExpandedAgents(prev => ({ ...prev, [agent.id]: !isExpanded }))}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${getAgentSolidBgClass(agent.id, currentTeam)}`}
                                        >
                                          {(agent.name || "?").trim().charAt(0).toUpperCase() || "?"}
                                        </span>
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{agent.name || "Unnamed agent"}</span>
                                          {index === 0 && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex-shrink-0">
                                              ★ Lead
                                            </span>
                                          )}
                                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                                            {getAgentModelLabel(agent)}
                                          </span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-auto" />}
                                      </button>
                                      
                                      {/* Mark as lead: moves this agent to the top of the roster in one
                                          step (equivalent to using "move up" repeatedly). Replaces the
                                          old separate up/down reordering buttons. */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={index === 0}
                                        onClick={(e) => { e.stopPropagation(); promoteAgentToLead(index); }}
                                        title={index === 0 ? "Current lead" : `Mark ${agent.name} as lead`}
                                        aria-label={index === 0 ? `${agent.name} is the current lead` : `Mark ${agent.name} as lead`}
                                        className={`w-6 h-6 rounded flex-shrink-0 ${
                                          index === 0
                                            ? "text-amber-500 disabled:opacity-100"
                                            : "text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
                                        }`}
                                      >
                                        <Star className="w-3.5 h-3.5" fill={index === 0 ? "currentColor" : "none"} />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteCustomAgent(agent.id)}
                                        aria-label={currentTeam.length === 1 ? `Reset ${agent.name} to the default assistant` : `Remove ${agent.name}`}
                                        className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4">
                                    {isProductTab && index === 0 && (
                                      <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <p className="font-semibold">Top Agent: Lead Architect & Orchestrator</p>
                                          <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                                            This agent formulates the overall system architecture, sets core requirements, and provides the baseline that all downstream domain specialists validate against.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`agent-name-${agent.id}`} className="text-xs font-medium text-slate-500">Agent Name</Label>
                                        <Input 
                                          id={`agent-name-${agent.id}`}
                                          value={agent.name} 
                                          onChange={(e) => updateAgentField(agent.id, "name", e.target.value)}
                                          className="h-9 w-full text-xs font-bold bg-card border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-500"
                                          placeholder="Agent Name"
                                        />
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Provider</Label>
                                        <Select 
                                          value={agent.provider} 
                                          onValueChange={(val) => updateAgentField(agent.id, "provider", val)}
                                        >
                                          <SelectTrigger className="h-8 w-full text-xs bg-card border-slate-200 dark:border-slate-800">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableProviders.map(p => (
                                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                                {p.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Model</Label>
                                        <Select 
                                          value={agent.model} 
                                          onValueChange={(val) => updateAgentField(agent.id, "model", val)}
                                        >
                                          <SelectTrigger className="h-8 w-full text-xs bg-card border-slate-200 dark:border-slate-800">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(MODEL_OPTIONS[agent.provider] || []).map(m => (
                                              <SelectItem key={m.id} value={m.id} className="text-xs">
                                                {m.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label htmlFor={`agent-persona-${agent.id}`} className="text-xs font-medium text-slate-500">Custom Persona / Objectives</Label>
                                      <Textarea
                                        id={`agent-persona-${agent.id}`}
                                        value={agent.persona}
                                        onChange={(e) => updateAgentField(agent.id, "persona", e.target.value)}
                                        className="w-full text-xs bg-card border border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none rounded-md p-3 leading-relaxed resize-y min-h-[120px] max-h-[400px] overflow-y-auto custom-scrollbar"
                                        rows={6}
                                        placeholder="e.g. You are an expert financial analyst. Review all proposals for budget risks."
                                      />
                                    </div>

                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                          Response Variety
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-[220px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Lower makes this agent's own answers more focused and consistent; higher makes them more varied and exploratory. This is about ONE agent's response style, not how much weight they carry in the discussion. Leave unset to use the provider's own default.</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono text-slate-500">
                                            {agent.temperature !== undefined ? agent.temperature.toFixed(2) : "default"}
                                          </span>
                                          {agent.temperature !== undefined && (
                                            <button
                                              onClick={() => resetAgentTemperature(agent.id)}
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={agent.temperature ?? 0.7}
                                        onChange={(e) => updateAgentField(agent.id, "temperature", parseFloat(e.target.value))}
                                        className="w-full accent-blue-600 cursor-pointer"
                                      />
                                    </div>
                                    </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                        </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    </div>
                    </div>
                  </aside>
                    {/* Main Content: shifts right to make room for
                        the workspace panel on large screens, full-width when it's closed. */}
                    <div className={`space-y-6 transition-[padding] duration-300 ease-in-out ${isLeftPanelOpen ? "lg:pl-[344px] xl:pl-[404px]" : "lg:pl-0"}`}>
                    {activeTab === "product" ? (
                      <ProductTab
                        customTeam={productTeam}
                        setCustomTeam={setProductTeam}
                        knowledgeFiles={currentKnowledgeFiles}
                        contentBearingKnowledgeFiles={contentBearingProductKnowledgeFiles}
                        callAgent={callAgent}
                        logDebug={logDebug}
                        openLeftPanel={() => setIsLeftPanelOpen(true)}
                        openChatDrawer={(seed?: string) => openChatDrawer()}
                        productPrompt={productPrompt}
                        setProductPrompt={setProductPrompt}
                        openSuggestTeam={(initialPrompt?: string) => {
                          setIsLeftPanelOpen(true);
                          setIsAgentRosterOpen(true);
                          setIsSuggestTeamOpen(true);
                          setSuggestTeamMode("replace");
                          if (initialPrompt && initialPrompt.trim()) {
                            setDecisionGoal(initialPrompt.trim());
                          } else if (productPrompt.trim()) {
                            setDecisionGoal(productPrompt.trim());
                          }
                        }}
                        specToLoad={productSpecToLoad}
                        onSpecLoaded={() => setProductSpecToLoad(null)}
                        onSpecChange={(spec: ProductSpec) => {
                          setProductSpecHistory(prev => [spec, ...prev.filter(s => s.id !== spec.id)]);
                          saveHistoryEntry("product", spec);
                        }}
                        onBackupToDrive={backupProductSpecToDrive}
                        isBackingUpToDrive={isBackingUpToDrive}
                      />
                    ) : (
                      <div className="max-w-[1700px] mx-auto space-y-6">
                    {(() => {
                      const showComposerExpanded = !collaborativeRun || collaborativeLoading || !!clarifyingQuestions || !!pendingOutline || !!pendingAxes || isOriginalComposerExpanded;
                      if (!showComposerExpanded) {
                        return (
                          <button
                            id="prompt-section"
                            onClick={() => setIsOriginalComposerExpanded(true)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                            Start fresh from original wording
                          </button>
                        );
                      }
                      return (
                    <Card id="prompt-section" className="shadow-md border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              {collaborativeRun ? "Start Fresh From Original Wording" : "Team Session"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {collaborativeRun
                                ? "This discards the current discussion — tree, comments, and everything added since — and starts over from scratch. Your current discussion stays available in History."
                                : chatMode === "parallel"
                                ? "Instruct the team to execute in parallel, drawing from your knowledge documents and personas."
                                : "Agents converse with one another and converge on a single defined outcome."}
                            </CardDescription>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {collaborativeRun && !collaborativeLoading && !clarifyingQuestions && !pendingOutline && !pendingAxes && (
                              <button
                                onClick={() => setIsOriginalComposerExpanded(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 flex-shrink-0"
                              >
                                <ChevronDown className="w-3.5 h-3.5" /> Collapse
                              </button>
                            )}
                            {/* Mode Switcher */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                              <Tooltip>
                                <TooltipTrigger render={
                                  <button
                                    onClick={() => setChatMode("collaborative")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ chatMode ==="collaborative" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
                                  >
                                    <MessagesSquare className="w-3.5 h-3.5" /> Collaborative
                                  </button>
                                } />
                                <TooltipContent side="top" className="max-w-[260px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">Collaborative:</span> agents discuss with each other, question and validate one another's reasoning, and converge on a single defined outcome with a decision tree. Slower, but produces one answer for the whole panel.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger render={
                                  <button
                                    onClick={() => setChatMode("parallel")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ chatMode ==="parallel" ?"bg-card text-blue-600 dark:text-blue-400 shadow-sm" :"text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" }`}
                                  >
                                    <Layers className="w-3.5 h-3.5" /> Parallel
                                  </button>
                                } />
                                <TooltipContent side="top" className="max-w-[260px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">Parallel:</span> every agent answers your prompt independently and simultaneously, with no discussion between them. Faster, and useful for comparing distinct takes side by side rather than reaching one shared conclusion.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                chatMode === "parallel" ? runCustomTeamExecution() : startDiscussionWithClarification();
                              }
                            }}
                            placeholder={chatMode === "parallel" ? "Enter task or instruction for your custom agents..." : "Enter the question you want the panel to reach an outcome on..."}
                            rows={3}
                            className="w-full shadow-sm border border-slate-200 dark:border-slate-800 bg-card focus-visible:ring-2 focus-visible:ring-blue-500 outline-none rounded-xl px-4 py-3 text-sm resize-y min-h-[76px] max-h-[240px] overflow-y-auto custom-scrollbar"
                          />

                          {/* Expand My Prompt: opt-in (button, never automatic), review-and-edit
                              before use (never silently replaces what was typed), and visible —
                              a real Button directly under the textarea, not tucked into a
                              collapsed section, since the whole point is to catch it before
                              starting rather than after a shallow discussion. */}
                          <div className="flex items-center gap-2 flex-wrap" data-tour="expand-prompt">
                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={expandUserPrompt}
                                  disabled={!customPrompt.trim() || isExpandingPrompt}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs rounded-lg gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                >
                                  {isExpandingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                  Expand My Prompt
                                </Button>
                              } />
                              <TooltipContent side="bottom" className="max-w-[260px] p-3 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                  Rewrites your task into a clearer, better-structured prompt — naming specific sub-questions or options your wording only implied. Costs ~1 model call. A well-structured prompt needs fewer clarifying rounds and a more focused discussion, which usually more than pays that back in fewer calls to reach an outcome. You'll review it before it's used.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {expandedPromptDraft !== null && (
                            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" /> Expanded prompt — review before using
                                </span>
                                <button onClick={() => setExpandedPromptDraft(null)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {expandedPromptHasRoleWarning && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  This draft may reference a specific role or team member — edit it out below before using, since role assignment is handled separately by your Team Agents setup.
                                </p>
                              )}
                              <Textarea
                                value={expandedPromptDraft}
                                onChange={(e) => { setExpandedPromptDraft(e.target.value); setExpandedPromptHasRoleWarning(detectRoleAssignmentLanguage(e.target.value)); }}
                                rows={6}
                                className="w-full text-sm bg-card border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 resize-y max-h-[320px] overflow-y-auto custom-scrollbar"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => { setCustomPrompt(expandedPromptDraft); setExpandedPromptDraft(null); logDebug("info", "Replaced the task with the expanded prompt"); }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> Use This
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setExpandedPromptDraft(null)}
                                  className="text-slate-500 dark:text-slate-400"
                                >
                                  Discard
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Moved above the Start Discussion button — constraints/success
                              criteria are inputs that shape the run about to start, so they
                              belong before the action that consumes them, not after it. */}
                          <Collapsible open={isBriefDetailsOpen} onOpenChange={setIsBriefDetailsOpen}>
                            <CollapsibleTrigger render={
                              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                {isBriefDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                Add constraints / success criteria
                                {(taskConstraints.trim() || taskSuccessCriteria.trim()) && !isBriefDetailsOpen && (
                                  <Badge variant="outline" className="text-xs font-mono ml-1">set</Badge>
                                )}
                              </button>
                            } />
                            <CollapsibleContent>
                              <div className="mt-3 space-y-3">
                                <div className="space-y-1">
                                  <Label htmlFor="task-constraints" className="text-xs font-medium text-slate-500">Constraints</Label>
                                  <Textarea
                                    id="task-constraints"
                                    value={taskConstraints}
                                    onChange={(e) => setTaskConstraints(e.target.value)}
                                    placeholder="e.g. must ship by Friday, budget under $5k, cannot use vendor X"
                                    rows={2}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="task-success-criteria" className="text-xs font-medium text-slate-500">Success Criteria</Label>
                                  <Textarea
                                    id="task-success-criteria"
                                    value={taskSuccessCriteria}
                                    onChange={(e) => setTaskSuccessCriteria(e.target.value)}
                                    placeholder="e.g. leadership signs off without revisions, page load stays under 2s"
                                    rows={2}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                                  />
                                </div>
                                <p className="text-xs text-slate-500">Optional — kept separate from the task above so the team can check any pivot against them explicitly.</p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {bigDiscussionWarning && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 space-y-1.5">
                                <p className="text-amber-800 dark:text-amber-300">
                                  This looks like a big discussion (~{Math.round(bigDiscussionWarning.totalChars / 1000)}k characters of knowledge base and prompt combined), and {bigDiscussionWarning.lightAgentNames.length === 1 ? `${bigDiscussionWarning.lightAgentNames[0]} is` : `${bigDiscussionWarning.lightAgentNames.length} agents (${bigDiscussionWarning.lightAgentNames.join(", ")}) are`} on a lighter-tier model — you may have better luck switching to a heavier model for {bigDiscussionWarning.lightAgentNames.length === 1 ? "it" : "them"} first.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => launchDiscussion(true)} className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline">Continue anyway</button>
                                  <span className="text-amber-300 dark:text-amber-700">·</span>
                                  <button onClick={() => setBigDiscussionWarning(null)} className="text-xs font-medium text-slate-500 hover:underline">Let me adjust the team first</button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3" data-tour="depth-picker">
                            {chatMode === "parallel" ? (
                              <StartDiscussionButton
                                label="Start Discussion"
                                icon={Wand2}
                                loading={customTeamLoading || isCheckingClarification}
                                disabled={customTeamLoading || isCheckingClarification || !customPrompt || getAvailableProviders().length === 0}
                                onClick={startDiscussionWithClarification}
                                onStop={() => runAbortRef.current?.abort()}
                                depth={discussionDepth}
                                onDepthChange={setDiscussionDepth}
                                teamSize={customTeam.length}
                              />
                            ) : (
                              <StartDiscussionButton
                                label={collaborativeRun ? "Refresh Output" : "Start Discussion"}
                                icon={collaborativeRun ? RefreshCw : Wand2}
                                loading={collaborativeLoading || isCheckingClarification}
                                disabled={collaborativeLoading || isCheckingClarification || !customPrompt || getAvailableProviders().length === 0}
                                onClick={startDiscussionWithClarification}
                                onStop={() => runAbortRef.current?.abort()}
                                depth={discussionDepth}
                                onDepthChange={setDiscussionDepth}
                                teamSize={customTeam.length}
                              />
                            )}
                          </div>
                        </div>

                        {isCheckingClarification && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking whether anything needs clarifying first...
                          </div>
                        )}

                        {(() => {
                          if (!clarifyingQuestions || currentClarifyingIndex === -1) return null;
                          const isAppSettingsStep =
                            clarifyingQuestions[0]?.question === TASK_TYPE_QUESTION &&
                            clarifyingQuestions[1]?.question === DETAIL_PROFILE_QUESTION &&
                            (displayedClarifyingIndex === 0 || displayedClarifyingIndex === 1);
                          if (!isAppSettingsStep) return null;
                          const taskTypeAnswer = clarifyingAnswers[0];
                          const detailAnswer = clarifyingAnswers[1];
                          return (
                            <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-5">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <Settings2 className="w-3.5 h-3.5" /> Set up this discussion
                              </span>
                              {/* Previously these were two separate "Question 1 of N" / "Question
                                  2 of N" screens with near-identical chip styling — simulated
                                  testing found them easy to conflate. Grouped here as one step
                                  with clearly distinct headers instead; answering both advances
                                  straight to the first real clarifying question automatically. */}
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">What should the team produce?</p>
                                <div className="flex flex-wrap gap-2">
                                  {["Decision", "Deliverable", "Let the team decide"].map(option => (
                                    <button
                                      key={option}
                                      onClick={() => answerAppSettingsQuestion(0, option)}
                                      aria-pressed={taskTypeAnswer === option}
                                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                        taskTypeAnswer === option
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "border-blue-200 dark:border-blue-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2 pt-1 border-t border-blue-200/50 dark:border-blue-900/50">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 pt-3">How much detail?</p>
                                <div className="flex flex-wrap gap-2">
                                  {["Standard", "Domain-Expert"].map(option => (
                                    <button
                                      key={option}
                                      onClick={() => answerAppSettingsQuestion(1, option)}
                                      aria-pressed={detailAnswer === option}
                                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                        detailAnswer === option
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "border-blue-200 dark:border-blue-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Domain-Expert keeps your exact numbers and technical wording, and adds a formal cover note to Word exports.</p>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  onClick={() => {
                                    if (!clarifyingQuestions) return;
                                    // One atomic update, not two sequential answerAppSettingsQuestion
                                    // calls — calling it twice in the same handler would have the
                                    // second call read clarifyingAnswers via a stale closure from
                                    // before the first call's setState applied, silently discarding
                                    // the first answer.
                                    const updated = [...clarifyingAnswers];
                                    updated[0] = "Let the team decide";
                                    updated[1] = "Standard";
                                    setClarifyingAnswers(updated);
                                    setClarifyingCursor(null);
                                    setTaskTypeOverride(null);
                                    setDetailProfile("standard");
                                    if (!updated.some(a => a === null)) {
                                      clarificationContextRef.current = composeClarifications(updated);
                                      clarificationEntriesRef.current = composeClarificationEntries(updated);
                                      setClarifyingQuestions(null);
                                      launchDiscussion();
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1.5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                >
                                  Skip — use defaults
                                </Button>
                                <Button
                                  onClick={skipRemainingClarifyingQuestions}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1.5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                >
                                  <SkipForward className="w-3.5 h-3.5" /> Skip the rest and start
                                </Button>
                              </div>
                            </div>
                          );
                        })()}

                        {clarifyingQuestions && currentClarifyingIndex !== -1 && !(
                          clarifyingQuestions[0]?.question === TASK_TYPE_QUESTION &&
                          clarifyingQuestions[1]?.question === DETAIL_PROFILE_QUESTION &&
                          (displayedClarifyingIndex === 0 || displayedClarifyingIndex === 1)
                        ) && (
                          <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 space-y-4">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <MessageSquareText className="w-3.5 h-3.5" /> Quick question ({displayedClarifyingIndex + 1} of {clarifyingQuestions.length})
                            </span>
                            {/* Progress dots double as direct navigation, consistent with the
                                post-outcome check-in flow — click any dot to jump straight to
                                that question. Previously the only way to revisit an answer was
                                a chip list below the current question, and there was no way at
                                all to peek ahead at an unanswered one. */}
                            <div className="flex items-center gap-1.5">
                              {clarifyingQuestions.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => goToClarifyingQuestion(i)}
                                  aria-label={`Go to question ${i + 1}`}
                                  aria-current={i === displayedClarifyingIndex}
                                  className={`h-1.5 rounded-full transition-all ${
                                    i === displayedClarifyingIndex
                                      ? "w-6 bg-blue-600"
                                      : clarifyingAnswers[i] !== null
                                        ? "w-1.5 bg-blue-300 dark:bg-blue-800"
                                        : "w-1.5 bg-slate-200 dark:bg-slate-700"
                                  }`}
                                />
                              ))}
                            </div>
                            {(() => {
                              const currentQ = clarifyingQuestions[displayedClarifyingIndex];
                              const asker = customTeam.find(a => a.id === currentQ.askedBy);
                              const existingAnswer = clarifyingAnswers[displayedClarifyingIndex];
                              return (
                                <>
                                  {asker && (
                                    <p className="text-xs flex items-center gap-1">
                                      <AgentChip agentId={asker.id} name={asker.name} team={customTeam} />
                                      <span className="text-slate-500 dark:text-slate-400">wants to know:</span>
                                    </p>
                                  )}
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {currentQ.question}
                                  </p>
                                  {currentQ.whyImAsking && (
                                    <details className="text-xs text-slate-500 dark:text-slate-400">
                                      <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none">Why {asker ? asker.name : "the team"} is asking</summary>
                                      <p className="mt-1 leading-relaxed max-w-2xl">{currentQ.whyImAsking}</p>
                                    </details>
                                  )}
                                  {existingAnswer !== null && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <Check className="w-3 h-3 flex-shrink-0" /> Currently answered: <span className="font-medium">{existingAnswer || "(skipped)"}</span> — pick again to change it
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                            <div className="flex flex-wrap gap-2">
                              {clarifyingQuestions[displayedClarifyingIndex].options.map((option, i) => (
                                <button
                                  key={i}
                                  onClick={() => answerClarifyingQuestion(option)}
                                  aria-pressed={clarifyingAnswers[displayedClarifyingIndex] === option}
                                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                    clarifyingAnswers[displayedClarifyingIndex] === option
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "border-blue-200 dark:border-blue-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={customClarifyingAnswer}
                                onChange={(e) => setCustomClarifyingAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && customClarifyingAnswer.trim()) {
                                    answerClarifyingQuestion(customClarifyingAnswer.trim());
                                    setCustomClarifyingAnswer("");
                                  }
                                }}
                                placeholder="Or type your own answer..."
                                className="h-9 text-xs flex-1 bg-card border-slate-200 dark:border-slate-800"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!customClarifyingAnswer.trim()}
                                onClick={() => {
                                  answerClarifyingQuestion(customClarifyingAnswer.trim());
                                  setCustomClarifyingAnswer("");
                                }}
                                className="h-9"
                              >
                                Submit
                              </Button>
                            </div>
                            {/* Explicit Back/Next, independent of answer state — free
                                navigation, not just editing after the fact. */}
                            <div className="flex items-center justify-between">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={displayedClarifyingIndex === 0}
                                onClick={() => goToClarifyingQuestion(displayedClarifyingIndex - 1)}
                                className="h-8 text-xs gap-1 text-slate-500 dark:text-slate-400"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                              </Button>
                              {displayedClarifyingIndex + 1 < clarifyingQuestions.length && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => goToClarifyingQuestion(displayedClarifyingIndex + 1)}
                                  className="h-8 text-xs gap-1 text-slate-500 dark:text-slate-400"
                                >
                                  Next <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={skipThisClarifyingQuestion}
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1.5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                              >
                                Skip this question
                              </Button>
                              <Button
                                onClick={skipRemainingClarifyingQuestions}
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1.5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                              >
                                <SkipForward className="w-3.5 h-3.5" /> Skip the rest and start
                              </Button>
                            </div>
                          </div>
                        )}

                        {chatMode === "parallel" ? (
                          <>
                            {/* Executed Results */}
                            {Object.keys(customResults).length > 0 && (
                              <div className="space-y-4 border-t dark:border-slate-800 pt-6">
                                <h3 className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                  Team Insights & Collaboration Output
                                  {customTeamLoading && callCount > 0 && (
                                    <span className="text-xs normal-case font-normal text-slate-500">· {callCount} call{callCount === 1 ? "" : "s"} so far</span>
                                  )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {(Object.entries(customResults) as [string, any][]).map(([agentId, res]) => (
                                    <Card key={agentId} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden flex flex-col h-[350px]">
                                      <div className="px-4 py-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium text-xs tracking-tight ${getAgentColorClass(agentId, customTeam)}`}>{res.name}</span>
                                          <Badge variant="outline" className="text-xs font-mono capitalize">
                                            {res.provider}
                                          </Badge>
                                        </div>
                                        {res.loading && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                                      </div>
                                      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 relative">
                                        {res.loading ? (
                                          <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500">
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span className="text-xs font-medium">Thinking...</span>
                                          </div>
                                        ) : res.error ? (
                                          <div role="alert" className="text-red-500 text-xs p-3 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>{res.error}</span>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                            {res.text}
                                          </p>
                                        )}
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                                {!customTeamLoading && (
                                  <div className="space-y-2">
                                    <CreateFileMenu
                                      generatingKind={mainFileGenerating}
                                      onSelect={(kind) => startPreflight(
                                        kind,
                                        Object.values(customResults).map((r: any) => `${r.name}: ${r.error ? `[error: ${r.error}]` : r.text}`).join("\n\n")
                                      )}
                                    />
                                    {mainGeneratedFiles.length > 0 && (
                                      <div className="space-y-1.5">
                                        {mainGeneratedFiles.map((f, i) => <GeneratedFileCard key={i} file={f} />)}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => openChatDrawer()}
                                      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      Team Chat
                                      {followUpMessages.length > 0 && (
                                        <CountTag>{followUpMessages.length}</CountTag>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Collaborative Consensus Mode */
                          <div className="space-y-6 border-t dark:border-slate-800 pt-6">
                            {collaborativeError && (
                              <div role="alert" className="text-red-500 text-xs p-3 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{collaborativeError}</span>
                              </div>
                            )}

                            {collaborativeLoading && (
                              <div className="py-6 flex flex-col items-center justify-center gap-3 text-slate-500">
                                <div className="flex flex-col items-center gap-2">
                                  <RefreshCw className="w-6 h-6 animate-spin" />
                                  <span role="status" aria-live="polite" className="text-xs font-medium text-center px-6">{collaborativePhase || COLLABORATIVE_LOADING_MESSAGES[loadingMessageIndex]}</span>
                                  {callCount > 0 && (
                                    <span className="text-xs text-slate-500">{callCount} model call{callCount === 1 ? "" : "s"} so far</span>
                                  )}
                                  {/* Previously a raise-hand Input sat here permanently, taking up
                                      space for a feature people rarely used. Replaced with a
                                      collapsed link + Stop control; expanding it shows the
                                      transcript arriving live (liveTranscript, mirrored by
                                      checkpointRun at each phase boundary) — genuinely more
                                      interesting to watch than a spinner, and an obvious runaway
                                      or error becomes visible early enough to stop rather than
                                      only being discovered after the whole run finishes. The
                                      note-to-the-team feature isn't removed, just demoted to
                                      inside the expanded panel, since it's still occasionally
                                      useful once someone's actually watching. */}
                                  <div className="w-full max-w-xl mt-3 space-y-1.5">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => setIsLiveViewExpanded(v => !v)}
                                        aria-expanded={isLiveViewExpanded}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-2.5 py-1 rounded-lg transition-colors"
                                      >
                                        {isLiveViewExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        {isLiveViewExpanded ? "Hide the conversation" : "Watch the conversation live"}
                                        {liveTranscript.length > 0 && <CountTag>{liveTranscript.length}</CountTag>}
                                      </button>
                                      <button
                                        onClick={() => runAbortRef.current?.abort()}
                                        className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 rounded-lg transition-colors"
                                      >
                                        <Square className="w-2.5 h-2.5 fill-current" /> End early
                                      </button>
                                    </div>
                                    {isLiveViewExpanded && (
                                      <div className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
                                        <div ref={liveTranscriptScrollRef} className="max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                          {liveTranscript.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-4">Nothing said yet — the first agent is still thinking...</p>
                                          ) : (
                                            liveTranscript.map((t, i) => (
                                              <div key={i} className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className={`text-xs font-bold ${getAgentColorClass(t.agentId, customTeam)}`}>{t.agentName}</span>
                                                  {t.roundLabel && <span className="text-xs text-slate-400">· {t.roundLabel}</span>}
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{t.message}</p>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/20">
                                          <Hand className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                          <Input
                                            ref={interjectionInputRef}
                                            value={managerInterjectionDraft}
                                            onChange={(e) => { setManagerInterjectionDraft(e.target.value); managerInterjectionRef.current = e.target.value; }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" && managerInterjectionDraft.trim()) {
                                                e.preventDefault();
                                                interjectionInputRef.current?.blur();
                                                setInterjectionQueuedFlash(true);
                                                setTimeout(() => setInterjectionQueuedFlash(false), 1800);
                                              }
                                            }}
                                            placeholder={INTERJECTION_PLACEHOLDERS[interjectionPlaceholderIndex]}
                                            className="h-7 text-xs flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 placeholder:text-blue-600/70 dark:placeholder:text-blue-400/70"
                                            aria-label="Note for the team, read at the next round boundary"
                                          />
                                          <button
                                            onClick={() => {
                                              if (!managerInterjectionDraft.trim()) return;
                                              interjectionInputRef.current?.blur();
                                              setInterjectionQueuedFlash(true);
                                              setTimeout(() => setInterjectionQueuedFlash(false), 1800);
                                            }}
                                            disabled={!managerInterjectionDraft.trim()}
                                            aria-label="Queue this note for the team"
                                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                          >
                                            <SendHorizontal className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        {(interjectionQueuedFlash || managerInterjectionDraft.trim()) && (
                                          <p className="text-xs text-slate-500 text-left px-3 pb-1.5">
                                            {interjectionQueuedFlash
                                              ? "✓ Queued — the team will hear it at the next round boundary."
                                              : "Will be read to the team at the next round boundary — clear the field to withdraw it."}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {draftingOutlineSections && (
                                  <div className="w-full max-w-md space-y-1.5 mt-2">
                                    {draftingOutlineSections.map(sec => {
                                      const status = draftingSectionStatus[sec.id] || "pending";
                                      return (
                                        <div key={sec.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs">
                                          {status === "done" ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                          ) : status === "drafting" ? (
                                            <RefreshCw className="w-3.5 h-3.5 text-violet-500 animate-spin flex-shrink-0" />
                                          ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex-shrink-0" />
                                          )}
                                          <span className={status === "done" ? "text-slate-600 dark:text-slate-300" : "text-slate-500"}>{sec.heading}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {!collaborativeLoading && !collaborativeRun && !collaborativeError && !pendingOutline && !pendingAxes && (
                              <div className="text-center py-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-4">
                                <MessagesSquare className="w-8 h-8 mx-auto stroke-[1.5]" />
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs px-4">
                                  <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
                                    <span className="text-slate-500 dark:text-slate-400">Set up your <button onClick={() => jumpToPanelSection("team-agents")} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Team Agents</button></span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
                                    <span className="text-slate-500 dark:text-slate-400">Optionally add a <button onClick={() => jumpToPanelSection("knowledge-base")} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Knowledge Base</button></span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
                                    <span className="text-slate-500 dark:text-slate-400">Ask your question and Start Discussion</span>
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Outline sign-off: the team proposes a plan and waits for approval
                                before spending effort drafting full sections. */}
                            {!collaborativeLoading && pendingOutline && (
                              <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-950/10 p-5 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                    <ClipboardList className="w-3.5 h-3.5" /> Proposed Outline — Awaiting Your Sign-Off
                                  </span>
                                  <Badge variant="outline" className="text-xs font-mono border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                                    {pendingOutline.sections.length} section{pendingOutline.sections.length === 1 ? "" : "s"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                                  {pendingOutline.taskTypeSource === "manager"
                                    ? "Produced as a Deliverable, as you specified."
                                    : "The team classified this as a Deliverable rather than a Decision — sections to draft, not a choice to weigh."}
                                </p>
                                <div className="space-y-1.5">
                                  <Input
                                    value={pendingOutline.title}
                                    onChange={(e) => setPendingOutline(prev => (prev ? { ...prev, title: e.target.value } : null))}
                                    className="h-9 text-sm font-bold bg-card border-slate-200 dark:border-slate-800"
                                  />
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Before the team spends effort drafting, review the plan below — adjust headings, briefs, or who's writing what, remove a section, or add one.
                                  </p>
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                  {pendingOutline.sections.map((sec) => (
                                    <div key={sec.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={sec.heading}
                                          onChange={(e) => updateOutlineSection(sec.id, "heading", e.target.value)}
                                          className="h-8 text-xs font-semibold flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        />
                                        <Select value={sec.authorAgentId} onValueChange={(val: string) => updateOutlineSection(sec.id, "authorAgentId", val)}>
                                          <SelectTrigger className="h-8 text-xs w-36 flex-shrink-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                            {/* Explicit formatter — without one, Base UI's Select.Value has no way to
                                                know an agent id maps to a human name and renders the raw id string. */}
                                            <SelectValue>{(val: string) => customTeam.find(a => a.id === val)?.name || "Unassigned"}</SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {customTeam.map(a => (
                                              <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeOutlineSection(sec.id)}
                                          className="w-8 h-8 flex-shrink-0 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      <Textarea
                                        value={sec.brief}
                                        onChange={(e) => updateOutlineSection(sec.id, "brief", e.target.value)}
                                        rows={2}
                                        placeholder="What should this section cover?"
                                        className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-y min-h-[44px] focus-visible:ring-2 focus-visible:ring-violet-500 outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addOutlineSection}
                                  className="w-full gap-1.5 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Section
                                </Button>

                                <div className="flex gap-2 pt-1">
                                  <Button variant="outline" onClick={cancelPendingOutline} className="flex-1">
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={approveOutlineAndDraft}
                                    disabled={pendingOutline.sections.length === 0}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Start Drafting
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Decision-path counterpart to the outline sign-off just above — the
                                team proposes the decision axes it identified and waits for approval
                                before spending effort debating them. */}
                            {!collaborativeLoading && pendingAxes && (
                              <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-950/10 p-5 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                    <ClipboardList className="w-3.5 h-3.5" /> Proposed Decision Axes — Awaiting Your Sign-Off
                                  </span>
                                  <Badge variant="outline" className="text-xs font-mono border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                                    {pendingAxes.axes.length} axis{pendingAxes.axes.length === 1 ? "" : "es"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                                  {pendingAxes.taskTypeSource === "manager"
                                    ? "Produced as a Decision, as you specified."
                                    : "The team classified this as a Decision rather than a Deliverable — points to weigh, not sections to draft."}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Before the panel spends effort debating, review the points below — adjust wording, who's leading each one, remove a point, or add one.
                                </p>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                  {pendingAxes.axes.map((axis) => (
                                    <div key={axis.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={axis.label}
                                          onChange={(e) => updateAxisField(axis.id, "label", e.target.value)}
                                          className="h-8 text-xs font-semibold flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        />
                                        <Select value={axis.suggestedAgentName || ""} onValueChange={(val: string) => updateAxisField(axis.id, "suggestedAgentName", val)}>
                                          <SelectTrigger className="h-8 text-xs w-36 flex-shrink-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                            <SelectValue>{(val: string) => customTeam.find(a => a.name === val)?.name || "Unassigned"}</SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {customTeam.map(a => (
                                              <SelectItem key={a.id} value={a.name} className="text-xs">{a.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeAxis(axis.id)}
                                          className="w-8 h-8 flex-shrink-0 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      <Textarea
                                        value={axis.description}
                                        onChange={(e) => updateAxisField(axis.id, "description", e.target.value)}
                                        rows={2}
                                        placeholder="What does this decision point actually cover?"
                                        className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-y min-h-[44px] focus-visible:ring-2 focus-visible:ring-violet-500 outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addAxis}
                                  className="w-full gap-1.5 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Decision Point
                                </Button>

                                <div className="flex gap-2 pt-1">
                                  <Button variant="outline" onClick={cancelPendingAxes} className="flex-1">
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={approveAxesAndDiscuss}
                                    disabled={pendingAxes.axes.length === 0}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Start Discussion
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                      );
                    })()}

                    {/* Everything from here down is the OUTPUT of a collaborative run — Outcome,
                        Panel Reasoning (Minority View / Decision Axes / Why the Panel Arrived Here),
                        and the Decision Tree — deliberately pulled out of the input Card above into
                        their own sibling Cards. Previously all of it (input textarea through the
                        decision tree) lived inside one Card, which is what produced the "wall of
                        text" feeling: Minority View and Decision Axes had no visual boundary at all
                        (bare Collapsibles), Reasons was a bare <ul>, and Outcome's tinted box was the
                        only thing that looked "contained." Splitting into real siblings means the
                        space-y-6 on the parent max-w-[1700px] div (below) becomes the section gap —
                        a gap IS the separator, no card-on-card divider lines needed. */}
                    {chatMode === "collaborative" && (() => {
                              const displayedRun = collaborativeRun;
                              if (!displayedRun || collaborativeLoading) return null;
                              const rootNodes = getTreeChildren(displayedRun.decisionTree, null);
                              const taskType: TaskType = displayedRun.taskType || "decision"; // older saved runs predate this field
                              // Scrolls so the target section's top lands just below the floating
                              // header + this Jump To bar, instead of scrollIntoView's "start"
                              // (which puts the target flush with the raw viewport top — right
                              // where both floating bars sit, hiding whatever it just jumped to).
                              // Measuring the nav bar's own bottom edge at click time — rather
                              // than a hardcoded offset — keeps this correct if either bar's
                              // height ever changes (e.g. the header wrapping on a narrow width).
                              const jumpTo = (id: string) => {
                                const el = document.getElementById(id);
                                if (!el) return;
                                const navBar = document.querySelector("[data-tour='jump-nav']") as HTMLElement | null;
                                const offset = (navBar?.getBoundingClientRect().bottom ?? 116) + 12;
                                const top = el.getBoundingClientRect().top + window.scrollY - offset;
                                window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
                              };
                              // Shared className for a Jump To pill — active state now reflects real scroll
                              // position (activeJumpSectionId, tracked at the top level of the component)
                              // instead of "Outcome" being permanently hardcoded as selected.
                              const jumpPillClass = (id: string) =>
                                `inline-flex items-center gap-1 h-7 px-2.5 rounded-lg transition-colors flex-shrink-0 ${
                                  activeJumpSectionId === id
                                    ? "font-semibold text-primary bg-accent hover:bg-accent/70"
                                    : "font-medium text-muted-foreground hover:bg-surface-2"
                                }`;
                              // Assigned inside the Panel/Planning Discussion IIFE below, then rendered as
                              // the closing row inside "How the Panel Got Here" for decisions (see §
                              // "Panel/Planning Discussion content" comment further down).
                              let panelDiscussionForDecisions: ReactNode = null;
                              return (
                                <div className="space-y-6">
                                  {/* Sticky "Jump to" sub-nav (Orchestra Refined §5): a real
                                      pill bar (sticky under the header, blurred --card bg, 1px
                                      border) rather than a plain inline text link. It also
                                      carries the session status on the right, so that green
                                      confirmation travels with the user as they scroll instead
                                      of scrolling away. */}
                                  <div data-tour="jump-nav" className="sticky top-[76px] z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border shadow-card text-xs -mt-2 overflow-x-auto" style={{ background: "color-mix(in oklch, var(--card) 88%, transparent)", backdropFilter: "blur(10px)" }}>
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-faint-foreground pl-1 pr-0.5 flex-shrink-0">Jump to</span>
                                    {pageOverflowsViewport && (
                                      <>
                                        <button onClick={() => jumpTo("prompt-section")} className={jumpPillClass("prompt-section")}>
                                          <FileText className="w-3 h-3" /> Prompt
                                        </button>
                                        {displayedRun.requirementsLog && displayedRun.requirementsLog.length > 0 && (
                                          <button onClick={() => jumpTo("requirements-section")} className={jumpPillClass("requirements-section")}>
                                            <ListChecks className="w-3 h-3" /> Requirements
                                          </button>
                                        )}
                                        <button onClick={() => jumpTo(taskType === "deliverable" ? "output-section-deliverable" : "output-section-decision")} className={jumpPillClass(taskType === "deliverable" ? "output-section-deliverable" : "output-section-decision")}>
                                          <Target className="w-3 h-3" /> {taskType === "deliverable" ? "Deliverable" : "Outcome"}
                                        </button>
                                        {taskType === "decision" && displayedRun.dissent && displayedRun.dissent.length > 0 && (
                                          <button onClick={() => { setOpenPanelDetail("dissent"); jumpTo("minority-view-section"); }} className={jumpPillClass("minority-view-section")}>
                                            <AlertTriangle className="w-3 h-3" /> Minority View
                                          </button>
                                        )}
                                        {taskType === "decision" && rootNodes.length > 0 && (
                                          <button onClick={() => jumpTo("tree-section")} className={jumpPillClass("tree-section")}>
                                            <GitBranch className="w-3 h-3" /> Tree
                                          </button>
                                        )}
                                        {displayedRun.considerations && displayedRun.considerations.length > 0 && (
                                          <button onClick={() => { setIsConsiderationsOpen(true); jumpTo("considerations-section"); }} className={jumpPillClass("considerations-section")}>
                                            <Lightbulb className="w-3 h-3" /> Considerations
                                          </button>
                                        )}
                                        {postOutcomeQuestions && (postOutcomeGateState === "gate" || postOutcomeGateState === "answering") && (
                                          <button onClick={() => jumpTo("questions-section")} className={jumpPillClass("questions-section")}>
                                            <MessageSquareText className="w-3 h-3" /> Questions
                                          </button>
                                        )}
                                      </>
                                    )}
                                    <button
                                      onClick={() => openChatDrawer()}
                                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg font-medium text-muted-foreground hover:bg-surface-2 transition-colors flex-shrink-0"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      Team Chat
                                      {followUpMessages.length > 0 && (
                                        <CountTag>{followUpMessages.length}</CountTag>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => { const next = !isSimpleView; setIsSimpleView(next); if (next) { setIsDecisionTreeOpen(false); setTreeDetailView("simple"); } }}
                                      title={isSimpleView ? "Show the full reasoning and tree by default" : "Hide the tree by default and use plain-language labels — good for a first look or sharing with someone less familiar with the tool"}
                                      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg font-medium transition-colors flex-shrink-0 ${isSimpleView ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-surface-2"}`}
                                    >
                                      <Eye className="w-3 h-3" />
                                      Simple View
                                    </button>
                                    <div className="flex-1" />
                                    {displayedRun.status !== "needs_input" && (
                                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-success pr-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {taskType === "deliverable" ? "Draft complete" : "Session complete"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Discussion Requirements: a read-only, auto-built record of what
                                      the team is actually working to satisfy right now — replaces the
                                      original prompt as the prominent "what is this discussion about"
                                      element, since re-submitting that composer discards everything
                                      rather than refining it. Deliberately never touched by Team Chat —
                                      only things that actually trigger a re-discussion land here. */}
                                  {displayedRun.requirementsLog && displayedRun.requirementsLog.length > 0 && (
                                    <Card id="requirements-section" className="shadow-sm border-slate-200 dark:border-slate-800">
                                      <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                          <ListChecks className="w-4 h-4 text-blue-500" />
                                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Discussion Requirements</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1.5">
                                          What the team is working to satisfy, built automatically from your original request and everything added since.
                                        </p>
                                        {(["original", "clarification"] as const).map(group => {
                                          const items = displayedRun.requirementsLog!.filter(r => r.group === group);
                                          if (items.length === 0) return null;
                                          const groupLabel = group === "original" ? "Original Request" : "Clarifications";
                                          return (
                                            <div key={group} className="space-y-1.5">
                                              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint-foreground">{groupLabel}</p>
                                              <ul className="space-y-1.5">
                                                {items.map(item => (
                                                  <li key={item.id} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                                                    {group !== "original" && <span className="font-semibold text-slate-700 dark:text-slate-200">{item.label}: </span>}
                                                    {item.text}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          );
                                        })}
                                        {(() => {
                                          const additions = displayedRun.requirementsLog!.filter(r => r.group === "addition");
                                          if (additions.length === 0) return null;
                                          // Sub-grouped by source rather than one flat bucket — a discussion
                                          // with several Expand Scope sessions plus a comment batch plus a
                                          // Force previously rendered as one undifferentiated list with no
                                          // way to tell what came from where after returning days later.
                                          const sourceOrder: { key: NonNullable<RequirementEntry["sourceType"]>; label: string }[] = [
                                            { key: "force", label: "Forced Constraints" },
                                            { key: "revision", label: "Revisions" },
                                            { key: "expand_scope", label: "Expand Scope" },
                                            { key: "comment", label: "Node Comments" },
                                            { key: "considerations", label: "Considerations" },
                                            { key: "follow_up", label: "Follow-Ups" },
                                            { key: "dissent", label: "Dissent Revisits" },
                                            { key: "needs_input", label: "Answered Blockers" }
                                          ];
                                          const isExpanded = expandedRequirementSources === "all";
                                          const COLLAPSE_THRESHOLD = 6;
                                          const shouldOffer = additions.length > COLLAPSE_THRESHOLD;
                                          const visibleAdditions = isExpanded || !shouldOffer ? additions : additions.slice(-3); // most recent 3 — the ones most likely still relevant
                                          const visibleIds = new Set(visibleAdditions.map(a => a.id));
                                          return (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-faint-foreground">Later Additions</p>
                                                {shouldOffer && (
                                                  <button
                                                    onClick={() => setExpandedRequirementSources(isExpanded ? null : "all")}
                                                    className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                  >
                                                    {isExpanded ? "Show fewer" : `Show all ${additions.length}`}
                                                  </button>
                                                )}
                                              </div>
                                              {sourceOrder.map(({ key, label }) => {
                                                const items = additions.filter(a => a.sourceType === key && visibleIds.has(a.id));
                                                if (items.length === 0) return null;
                                                return (
                                                  <div key={key} className="space-y-1">
                                                    <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 pl-3">{label}</p>
                                                    <ul className="space-y-1.5">
                                                      {items.map(item => (
                                                        <li key={item.id} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                                                          <span className="font-semibold text-slate-700 dark:text-slate-200">{item.label}: </span>
                                                          {item.text}
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                );
                                              })}
                                              {/* Entries predating this fix have no sourceType — kept in their
                                                  own catch-all rather than silently dropped. */}
                                              {(() => {
                                                const untyped = additions.filter(a => !a.sourceType && visibleIds.has(a.id));
                                                if (untyped.length === 0) return null;
                                                return (
                                                  <ul className="space-y-1.5">
                                                    {untyped.map(item => (
                                                      <li key={item.id} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.label}: </span>
                                                        {item.text}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                );
                                              })()}
                                            </div>
                                          );
                                        })()}
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Completion message with the redo action INLINE, in the same
                                      sentence, rather than a separate row below — "here's what
                                      happened" and "here's how to correct the classification" are
                                      one thought, not two disconnected controls. The standalone
                                      Decision/Deliverable badge is gone: the redo link already
                                      states the current classification ("This should be a
                                      Deliverable task"), so the badge was saying the same thing
                                      twice in two different visual languages. */}
                                  <div className="flex items-start gap-2">
                                    {displayedRun.status === "needs_input" ? (
                                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                                      {displayedRun.status === "needs_input"
                                        ? "The team needs your input before they can finish. "
                                        : taskType === "deliverable"
                                          ? "The team has finished drafting your file. "
                                          : "The team has finished their session and reached a decision. "}
                                      <button
                                        onClick={() => runCollaborativeSession(undefined, taskType === "deliverable" ? "decision" : "deliverable")}
                                        className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-2 font-normal"
                                      >
                                        (this should be a {taskType === "deliverable" ? "decision" : "deliverable"} task — redo)
                                      </button>
                                      {displayedRun.facilitatorAgentName && (() => {
                                        const facilitatorAgent = customTeam.find(a => a.name === displayedRun.facilitatorAgentName);
                                        return (
                                          <span className="text-xs text-slate-500 dark:text-slate-500 ml-2">
                                            Facilitated by{" "}
                                            <span className={facilitatorAgent ? getAgentColorClass(facilitatorAgent.id, customTeam) : "font-semibold text-slate-500 dark:text-slate-400"}>
                                              {displayedRun.facilitatorAgentName}
                                            </span>
                                          </span>
                                        );
                                      })()}
                                    </p>
                                  </div>

                                  {displayedRun.status === "needs_input" && displayedRun.statusNote && (
                                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 flex items-start gap-2">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                      <div className="min-w-0">
                                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{displayedRun.statusNote}</p>
                                        <button
                                          onClick={() => { setBlockingReplyDraft(""); setPendingBlockingReply({ statusNote: displayedRun.statusNote || "" }); }}
                                          className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline underline-offset-2 mt-1"
                                        >
                                          Reply to the team →
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Layer 1 of the re-discussion data-loss fix: the facilitator's own
                                      disclosed exception when it changed something beyond what this
                                      round of discussion directly addressed — the "preserve unless
                                      implicated" instruction requires this field whenever that happens,
                                      so an unrelated change is never silent even when legitimate. */}
                                  {displayedRun.structuralChangeNote && dismissedChangeBannerForRunId !== `${displayedRun.id}-structural` && (
                                    <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/10 flex items-start gap-2">
                                      <AlertTriangle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">The team changed something beyond this discussion:</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed mt-0.5">{displayedRun.structuralChangeNote}</p>
                                      </div>
                                      <button
                                        onClick={() => setDismissedChangeBannerForRunId(`${displayedRun.id}-structural`)}
                                        aria-label="Dismiss"
                                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex-shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Layer 2: the safety net. A plain structural diff, not another LLM
                                      claim — catches cases where Layer 1's preserve instruction wasn't
                                      perfectly followed, independent of whether the facilitator noticed
                                      or disclosed it via structuralChangeNote above. */}
                                  {displayedRun.preservationWarnings && displayedRun.preservationWarnings.length > 0 && dismissedChangeBannerForRunId !== `${displayedRun.id}-preservation` && (
                                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 flex items-start gap-2">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                          {displayedRun.preservationWarnings.length === 1 ? "One item" : `${displayedRun.preservationWarnings.length} items`} from before this re-discussion may have been affected:
                                        </p>
                                        <ul className="mt-1 space-y-0.5">
                                          {displayedRun.preservationWarnings.map((w, i) => (
                                            <li key={i} className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">• {w}</li>
                                          ))}
                                        </ul>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">The full prior tree is still available in History if you need to recover anything.</p>
                                      </div>
                                      <button
                                        onClick={() => setDismissedChangeBannerForRunId(`${displayedRun.id}-preservation`)}
                                        aria-label="Dismiss"
                                        className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex-shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Layer 3: Knowledge Base staleness. Distinct from Layer 1/2 above (which
                                      catch a re-discussion silently losing prior structure) — this catches the
                                      opposite direction: new source material arriving with nothing having
                                      re-checked the existing outcome against it yet. Computed live against
                                      groundedSourceIds (an id-diff, not just a count) so an add+remove swap is
                                      still caught even though the count wouldn't move. */}
                                  {(() => {
                                    const newSourceCount = getNewKnowledgeSourceIds(knowledgeFiles, displayedRun.groundedSourceIds).size;
                                    if (newSourceCount === 0 || dismissedChangeBannerForRunId === `${displayedRun.id}-kb-drift`) return null;
                                    return (
                                      <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10 flex items-start gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                            {newSourceCount === 1 ? "1 new knowledge source" : `${newSourceCount} new knowledge sources`} added since this was last checked
                                          </p>
                                          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed mt-0.5">
                                            A quick, targeted check — not a full re-discussion — to see whether the new material actually changes anything.
                                          </p>
                                          <Button
                                            size="sm"
                                            disabled={isCheckingKnowledgeDrift}
                                            onClick={checkAgainstNewKnowledgeSources}
                                            className="h-7 text-xs px-2.5 mt-1.5 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                          >
                                            {isCheckingKnowledgeDrift ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            {isCheckingKnowledgeDrift ? "Checking..." : "Check against new sources"}
                                          </Button>
                                        </div>
                                        <button
                                          onClick={() => setDismissedChangeBannerForRunId(`${displayedRun.id}-kb-drift`)}
                                          aria-label="Dismiss"
                                          className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })()}

                                  {/* Panel/Planning Discussion content, extracted so it can be placed
                                      differently per task type: its own card for deliverables
                                      (unchanged position, right before the drafted document), or as
                                      the closing row inside "How the Panel Got Here" for decisions —
                                      matching the mockup, where Panel Discussion is the last item in
                                      that card rather than a separate one above it. */}
                                  {(() => {
                                    const panelDiscussionContent = (
                                      <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
                                        <CollapsibleTrigger render={
                                          <button className="w-full flex items-center justify-between text-left group">
                                            <span className="flex items-center gap-2 min-w-0">
                                              <MessagesSquare className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500 flex-shrink-0" />
                                              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5 flex-wrap tracking-normal">
                                                {taskType === "deliverable" ? "Planning Discussion" : "Panel Discussion"}
                                                <CountTag>{displayedRun.rounds} round{displayedRun.rounds === 1 ? "" : "s"}</CountTag>
                                                {displayedRun.plannedRounds !== undefined && (displayedRun.rounds - 1) < displayedRun.plannedRounds && (
                                                  <span
                                                    title={`The panel converged after ${displayedRun.rounds - 1} of up to ${displayedRun.plannedRounds} validation round(s) — further rounds were skipped since continuing would have mostly repeated existing points.`}
                                                    className="text-[10px] font-normal normal-case text-emerald-600 dark:text-emerald-400 cursor-help"
                                                  >
                                                    converged early
                                                  </span>
                                                )}
                                              </h3>
                                              {!isTranscriptOpen && (
                                                <span className="text-xs font-normal normal-case text-slate-500 group-hover:text-blue-500 hidden sm:inline">— click to see what the team said</span>
                                              )}
                                            </span>
                                            {isTranscriptOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500 flex-shrink-0" />}
                                          </button>
                                        } />
                                        <CollapsibleContent>
                                          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                                            {displayedRun.transcript.map((entry, i) => {
                                              const prev = i > 0 ? displayedRun.transcript[i - 1] : null;
                                              // Meetings have acts: divide the transcript wherever the round label
                                              // changes, so opening positions, each validation round, focused
                                              // exchanges, and manager interjections read as distinct stages.
                                              const showDivider = !!entry.roundLabel && entry.roundLabel !== prev?.roundLabel;
                                              const moves = entry.provider === "manager" ? [] : detectSpeechMoves(entry.message);
                                              // Live-discussion grounding check (Phase 3 roadmap item #1): the file-generation
                                              // gates only ever ran at export time — this extends the same deterministic,
                                              // zero-LLM-cost numeric check to the transcript itself, the moment a claim is
                                              // made, not just if the manager later happens to export a document.
                                              const claimCheck = entry.provider !== "manager" ? checkClaimsAgainstNumbers(entry.message, trustedFactsSourceNumbers) : null;
                                              const isManager = entry.provider === "manager";
                                              const colorClass = isManager ? "text-slate-700 dark:text-slate-200" : getAgentColorClass(entry.agentId, customTeam);
                                              return (
                                                <div key={i} id={`transcript-entry-${i}`} className={`rounded-xl transition-shadow ${highlightedTranscriptIndex === i ? "ring-2 ring-blue-400 dark:ring-blue-600" : ""}`}>
                                                  {showDivider && (
                                                    <div className="flex items-center gap-2 pt-1 pb-2" role="separator" aria-label={entry.roundLabel}>
                                                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                                      <span className="text-xs font-medium text-slate-500">{entry.roundLabel}</span>
                                                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                                    </div>
                                                  )}
                                                  {/* Chat-message row: avatar left, name+badges line, message
                                                      bubble below — the Slack/Discord anatomy people already
                                                      know how to scan, rather than a plain bordered paragraph. */}
                                                  <div className="flex items-start gap-2.5">
                                                    <span
                                                      aria-hidden="true"
                                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isManager ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900" : `bg-current/15 ${colorClass}`}`}
                                                    >
                                                      {entry.agentName.trim().charAt(0).toUpperCase() || "?"}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`text-sm font-bold ${colorClass}`}>{entry.agentName}</span>
                                                        {moves.map((m, mi) => {
                                                          const answerIndex = m.move === "asks" && m.detail ? findAnswerEntryIndex(displayedRun.transcript, i, m.detail) : null;
                                                          return (
                                                            <Badge
                                                              key={mi}
                                                              variant="outline"
                                                              className={`text-xs gap-1 ${
                                                                m.move === "challenges"
                                                                  ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                                                                  : m.move === "concedes"
                                                                    ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                                                    : "border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                                                              }`}
                                                            >
                                                              {m.move === "asks" ? `asks ${m.detail}` : m.move}
                                                              {answerIndex !== null && (
                                                                <button
                                                                  onClick={() => jumpToTranscriptEntry(answerIndex)}
                                                                  className="ml-0.5 underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-300"
                                                                >
                                                                  See response
                                                                </button>
                                                              )}
                                                            </Badge>
                                                          );
                                                        })}
                                                        {claimCheck?.hasUnverifiedClaims && (
                                                          <Tooltip>
                                                            <TooltipTrigger>
                                                              <Badge variant="outline" className="text-xs gap-1 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 cursor-help">
                                                                <AlertTriangle className="w-3 h-3" /> check figures
                                                              </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-[240px] p-3 bg-card border-orange-200 dark:border-orange-800 shadow-xl">
                                                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                                {claimCheck.unverifiedNumbers.length === 1 ? "This figure" : "These figures"} — {claimCheck.unverifiedNumbers.join(", ")} — {claimCheck.unverifiedNumbers.length === 1 ? "doesn't" : "don't"} appear anywhere in your uploaded Knowledge Base. May be a reasonable estimate, general knowledge, or a fabrication — worth verifying before you rely on it.
                                                              </p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        )}
                                                      </div>
                                                      <div className={`inline-block max-w-full rounded-2xl rounded-tl-sm px-3.5 py-2 ${isManager ? "bg-blue-100/70 dark:bg-blue-950/30" : "bg-surface-2"}`}>
                                                        <MessageWithHighlightedFigures
                                                          text={entry.message}
                                                          unverifiedNumbers={claimCheck?.unverifiedNumbers || []}
                                                          className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    );
                                    // Deliverables keep it as their own card, in its established position
                                    // (right before the drafted document). Decisions place it further down,
                                    // inside "How the Panel Got Here" — see panelDiscussionForDecisions below.
                                    panelDiscussionForDecisions = <div className="pt-4 mt-2 border-t border-border">{panelDiscussionContent}</div>;
                                    return taskType === "deliverable" ? (
                                      <Card className="shadow-md border-slate-200 dark:border-slate-800">
                                        <CardContent className="p-5">{panelDiscussionContent}</CardContent>
                                      </Card>
                                    ) : null;
                                  })()}

                                  {taskType === "deliverable" && displayedRun.deliverable ? (
                                    <>
                                    {/* Decision Tree for deliverables — previously this data was never even
                                        generated (decisionTree: [] was hardcoded), so there was nothing to
                                        show here regardless of layout. Placed right after Planning Discussion
                                        and before the drafted document, so "how/why this was structured"
                                        reads before the structure itself. */}
                                    {displayedRun.decisionTree.length > 0 && (
                                      <PausedGoDeeperContext.Provider value={pausedGoDeeperNodeIds}>
                                      <Card id="tree-section" className="shadow-md border-slate-200 dark:border-slate-800">
                                        <CardContent className="p-5">
                                        <DecisionTreeSection
                                          decisionTree={displayedRun.decisionTree}
                                          actions={deliverableTreeActions}
                                          nodeComments={displayedRun.nodeComments || []}
                                          isCommentingLocked={followUpLoading || collaborativeLoading}
                                          onSubmitBatch={submitCommentBatch}
                                          treeViewMode={decisionTreeView}
                                          onTreeViewModeChange={setDecisionTreeView}
                                          detailMode={treeDetailView}
                                          onDetailModeChange={setTreeDetailView}
                                          isOpen={isDecisionTreeOpen}
                                          onOpenChange={setIsDecisionTreeOpen}
                                        />
                                        </CardContent>
                                      </Card>
                                      </PausedGoDeeperContext.Provider>
                                    )}
                                    <Card id="output-section-deliverable" className="shadow-md border-slate-200 dark:border-slate-800 border-l-4 border-l-violet-400 dark:border-l-violet-600">
                                      <CardContent className="p-5 space-y-1">
                                        <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                                          <FileText className="w-3.5 h-3.5" /> {displayedRun.deliverable.title}
                                        </h3>
                                        {displayedRun.deliverable.subtitle && (
                                          <p className="text-xs text-slate-500 dark:text-slate-400">{displayedRun.deliverable.subtitle}</p>
                                        )}
                                      </CardContent>
                                    </Card>

                                    {/* Sections, each drafted directly by its assigned author */}
                                    <div className="space-y-4">
                                      {displayedRun.deliverable.sections.map((sec) => (
                                        <Card key={sec.id} className="shadow-md border-slate-200 dark:border-slate-800">
                                          <CardContent className="p-5 space-y-2">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{sec.heading}</h4>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${getAgentColorClass(sec.authorAgentId, customTeam)}`}>
                                                  Drafted by {sec.authorAgentName}
                                                </span>
                                                {displayedRun.id === collaborativeRun?.id && (
                                                  <Tooltip>
                                                    <TooltipTrigger render={
                                                      <button
                                                        onClick={() => setSectionRegenDraft(sectionRegenDraft?.id === sec.id ? null : { id: sec.id, feedback: "" })}
                                                        disabled={regeneratingSectionId !== null}
                                                        className="text-slate-400 hover:text-blue-500 disabled:opacity-50"
                                                      >
                                                        {regeneratingSectionId === sec.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                      </button>
                                                    } />
                                                    <TooltipContent side="top" className="p-2 bg-card border-blue-200 dark:border-blue-800 shadow-xl">
                                                      <p className="text-xs text-slate-700 dark:text-slate-300">Regenerate just this section</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                )}
                                              </div>
                                            </div>
                                            {sectionRegenDraft?.id === sec.id && (
                                              <div className="flex gap-2 p-2.5 rounded-lg bg-surface-2">
                                                <Input
                                                  value={sectionRegenDraft.feedback}
                                                  onChange={(e) => setSectionRegenDraft({ id: sec.id, feedback: e.target.value })}
                                                  onKeyDown={(e) => { if (e.key === "Enter") regenerateDeliverableSection(sec.id, sectionRegenDraft.feedback); }}
                                                  placeholder="What should change? (optional)"
                                                  className="h-8 text-xs flex-1 bg-card border-slate-200 dark:border-slate-800"
                                                  autoFocus
                                                />
                                                <Button size="sm" onClick={() => regenerateDeliverableSection(sec.id, sectionRegenDraft.feedback)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                                  Regenerate
                                                </Button>
                                              </div>
                                            )}
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Outcome is the ONE hero on the page (Orchestra Refined §1):
                                          the only tinted, accent-bordered, hero-shadowed surface, so
                                          the eye lands here first. Everything else stays on plain
                                          --card. The 4px primary left bar + --hero-tint + --shadow-hero
                                          do the lifting; body text bumped to ~16.5px/1.62 so it reads
                                          like a conclusion, not a caption. */}
                                      <Card id="output-section-decision" className="relative overflow-hidden border-[color-mix(in_oklch,var(--primary)_22%,var(--border))] bg-hero-tint shadow-hero">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
                                        <CardContent className="p-5 pl-6 space-y-3">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                              <Target className="w-4 h-4" /> Defined Outcome
                                            </h3>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => { setNewShareUrl(null); setShareDialogRun(displayedRun); }}
                                              className="h-7 text-xs rounded-lg bg-card gap-1 px-2.5"
                                            >
                                              <Share2 className="w-3 h-3" /> Share
                                            </Button>
                                          </div>
                                          <p className="text-slate-700 dark:text-slate-200 font-medium" style={{ fontSize: "16.5px", lineHeight: 1.62, letterSpacing: "-0.01em" }}>{displayedRun.outcome}</p>
                                          {displayedRun.taskTypeSource && (
                                            <p className="text-xs text-muted-foreground -mt-2">
                                              {displayedRun.taskTypeSource === "manager"
                                                ? "Produced as a Decision, as you specified."
                                                : "The team classified this as a Decision rather than a Deliverable — a choice to weigh, not sections to draft."}
                                            </p>
                                          )}

                                          {/* Consolidated meta strip (§2): the three previously-stacked
                                              banners — facilitator, verification, revision history — folded
                                              into one hairline-divided inline row inside the hero. Verification
                                              is static state (green text, not a badge); revisions is the one
                                              interactive item and expands in place. */}
                                          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[color-mix(in_oklch,var(--primary)_14%,var(--border))]">
                                            {displayedRun.facilitatorAgentName && (() => {
                                              const facilitatorAgent = customTeam.find(a => a.name === displayedRun.facilitatorAgentName);
                                              return (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Synthesized by{" "}
                                                  <span className={facilitatorAgent ? `font-semibold ${getAgentColorClass(facilitatorAgent.id, customTeam)}` : "font-semibold text-slate-600 dark:text-slate-300"}>
                                                    {displayedRun.facilitatorAgentName}
                                                  </span>
                                                </span>
                                              );
                                            })()}
                                            {displayedRun.facilitatorAgentName && <span className="w-px h-3.5 bg-border" aria-hidden="true" />}
                                            {knowledgeBaseTextForClaimChecks ? (
                                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                                <ShieldCheck className="w-3.5 h-3.5" /> {contentBearingKnowledgeFiles.length} source{contentBearingKnowledgeFiles.length === 1 ? "" : "s"} verified{followUpMessages.some(m => m.isVerifiedCalculation) ? " + calculations" : ""}
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> No sources checked
                                              </span>
                                            )}
                                            {displayedRun.history && displayedRun.history.length > 0 && (
                                              <>
                                                <span className="w-px h-3.5 bg-border" aria-hidden="true" />
                                                <button
                                                  onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
                                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                  <History className="w-3.5 h-3.5" /> {displayedRun.history.length} revision{displayedRun.history.length === 1 ? "" : "s"}
                                                  {isRevisionHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                              </>
                                            )}
                                          </div>

                                          {/* Revision history expands in place under the meta strip (§2) */}
                                          {displayedRun.history && displayedRun.history.length > 0 && isRevisionHistoryOpen && (
                                            <div className="space-y-2 pt-1">
                                              {[...displayedRun.history].reverse().map((snap, i) => (
                                                <details key={i} className="group p-3 rounded-lg border border-border bg-card">
                                                  <summary className="text-xs cursor-pointer list-none flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-2 min-w-0">
                                                      <span className="font-mono text-[10.5px] text-muted-foreground bg-surface-2 border border-border rounded px-1.5 py-0.5 flex-shrink-0">{snap.trigger}</span>
                                                      <span className="text-muted-foreground text-xs flex-shrink-0">{new Date(snap.timestamp).toLocaleString()}</span>
                                                    </span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                                                  </summary>
                                                  <div className="mt-2 pt-2 border-t border-border space-y-1.5">
                                                    {snap.deliverable ? (
                                                      <>
                                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{snap.deliverable.title}</p>
                                                        {snap.deliverable.sections.map(s => (
                                                          <div key={s.id} className="text-xs text-slate-500 dark:text-slate-400">
                                                            <span className="font-semibold">{s.heading}:</span> {s.content.slice(0, 200)}{s.content.length > 200 ? "…" : ""}
                                                          </div>
                                                        ))}
                                                      </>
                                                    ) : (
                                                      <>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300">{snap.outcome}</p>
                                                        {snap.reasons.length > 0 && (
                                                          <ul className="space-y-1">
                                                            {snap.reasons.map((r, ri) => (
                                                              <li key={ri} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                                                                <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" /> {r}
                                                              </li>
                                                            ))}
                                                          </ul>
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                </details>
                                              ))}
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>

                                      {/* Panel Reasoning: Minority View, Decision Axes, and Reasons are all
                                          "how the panel got here" content — the same FAMILY of information,
                                          previously rendered with three different levels of "boxed" (a bare
                                          Collapsible, another bare Collapsible, and an unboxed <ul> floating
                                          on the page). Unified into one card with matched inset anatomy —
                                          each sub-section is a surface-2 block, p-4, left-accent for category
                                          — so the inconsistency itself (not just the density) stops reading
                                          as a wall of text. */}
                                      {((displayedRun.dissent && displayedRun.dissent.length > 0) || (displayedRun.axes && displayedRun.axes.length > 0) || displayedRun.reasons.length > 0) ? (
                                        <Card className="shadow-md border-slate-200 dark:border-slate-800">
                                          <CardContent className="p-5 space-y-4">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">How the Panel Got Here</h3>

                                            {/* Lead with the reasoning (§4) — the digestible summary comes
                                                first; the two drill-down tiles below are dense supporting
                                                material that most people don't need to open to understand
                                                the shape of the decision. */}
                                            {displayedRun.reasons.length > 0 && (
                                              <div className="space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-faint-foreground">Why the Panel Arrived Here</p>
                                                <ul className={`gap-x-6 gap-y-2.5 ${displayedRun.reasons.length > 4 ? "grid grid-cols-1 md:grid-cols-2" : "space-y-2.5"}`}>
                                                  {displayedRun.reasons.map((reason, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                      <span>{reason}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Two compact side-by-side drill-down tiles (§4) — collapsed by
                                                default, a one-line summary means most people never need to
                                                open them. Minority View gets the amber "there's tension here"
                                                treatment; Decision Axes stays neutral. Detail expands below
                                                the grid rather than inline in each tile, so opening one
                                                doesn't reflow the other's position. */}
                                            {((displayedRun.dissent && displayedRun.dissent.length > 0) || (displayedRun.axes && displayedRun.axes.length > 0)) && (
                                              <div id="minority-view-section" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {displayedRun.dissent && displayedRun.dissent.length > 0 && (
                                                  <button
                                                    onClick={() => setOpenPanelDetail(openPanelDetail === "dissent" ? null : "dissent")}
                                                    aria-expanded={openPanelDetail === "dissent"}
                                                    className={`text-left flex items-center gap-2.5 p-3.5 rounded-xl border transition-colors ${openPanelDetail === "dissent" ? "border-amber-300 dark:border-amber-800" : "border-warning-soft"} border-l-[3px] border-l-warning bg-warning-soft`}
                                                  >
                                                    <AlertTriangle className="w-[18px] h-[18px] text-warning flex-shrink-0" />
                                                    <span className="flex-1 min-w-0">
                                                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Minority View</span>
                                                      <span className="block text-xs text-muted-foreground">{displayedRun.dissent.length} agent{displayedRun.dissent.length === 1 ? "" : "s"} dissented</span>
                                                    </span>
                                                    {openPanelDetail === "dissent" ? <ChevronUp className="w-[17px] h-[17px] text-faint-foreground flex-shrink-0" /> : <ChevronDown className="w-[17px] h-[17px] text-faint-foreground flex-shrink-0" />}
                                                  </button>
                                                )}
                                                {displayedRun.axes && displayedRun.axes.length > 0 && (
                                                  <button
                                                    onClick={() => setOpenPanelDetail(openPanelDetail === "axes" ? null : "axes")}
                                                    aria-expanded={openPanelDetail === "axes"}
                                                    className="text-left flex items-center gap-2.5 p-3.5 rounded-xl border border-border bg-surface-2 hover:bg-background transition-colors"
                                                  >
                                                    <ListTree className="w-[18px] h-[18px] text-primary flex-shrink-0" />
                                                    <span className="flex-1 min-w-0">
                                                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Decision Axes</span>
                                                      <span className="block text-xs text-muted-foreground">{displayedRun.axes.length} dimension{displayedRun.axes.length === 1 ? "" : "s"} weighed</span>
                                                    </span>
                                                    {openPanelDetail === "axes" ? <ChevronUp className="w-[17px] h-[17px] text-faint-foreground flex-shrink-0" /> : <ChevronDown className="w-[17px] h-[17px] text-faint-foreground flex-shrink-0" />}
                                                  </button>
                                                )}
                                              </div>
                                            )}

                                            {displayedRun.dissent && displayedRun.dissent.length > 0 && openPanelDetail === "dissent" && (
                                              <div className="space-y-2">
                                                {displayedRun.dissent.map((d, di) => {
                                                  const agent = customTeam.find(a => a.name === d.agentName);
                                                  return (
                                                    <div key={di} className="p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-card space-y-1">
                                                      <AgentChip agentId={agent?.id || d.agentName} name={d.agentName} team={customTeam} />
                                                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{d.position}</p>
                                                      {d.wouldChangeIf && (
                                                        <div className="space-y-1.5">
                                                          <p className="text-xs text-amber-700 dark:text-amber-400"><span className="font-medium">Revisit if:</span> {d.wouldChangeIf}</p>
                                                          {/* Previously this was purely informational — no way to act on it once the
                                                              condition actually occurred. This re-runs the discussion with the
                                                              dissenting condition explicitly framed as now true, so the panel
                                                              reconsiders the outcome in light of it rather than the manager having
                                                              to manually re-explain the whole objection from scratch. */}
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={collaborativeLoading}
                                                            onClick={() => runCollaborativeSession(null, null, null, `${d.agentName}'s dissenting condition has occurred: "${d.wouldChangeIf}" (their original objection was: "${d.position}"). Reconsider the outcome in light of this.`)}
                                                            className="h-6 text-xs rounded-md border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 gap-1"
                                                          >
                                                            <RefreshCw className="w-3 h-3" /> This has occurred — revisit
                                                          </Button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {displayedRun.axes && displayedRun.axes.length > 0 && openPanelDetail === "axes" && (
                                              <div className="space-y-2">
                                                {displayedRun.axes.map((axis) => (
                                                  <div key={axis.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card">
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{axis.label}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                      <CountTag>P{axis.priority}</CountTag>
                                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${axis.independent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                                        {axis.independent ? "independent" : "dependent"}
                                                      </span>
                                                    </div>
                                                    {axis.description && <p className="text-xs text-slate-500 mt-1.5">{axis.description}</p>}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {panelDiscussionForDecisions}
                                          </CardContent>
                                        </Card>
                                      ) : (
                                        <Card className="shadow-md border-slate-200 dark:border-slate-800">
                                          <CardContent className="p-5">{panelDiscussionForDecisions}</CardContent>
                                        </Card>
                                      )}

                                      {/* Forced constraint banner */}
                                      {displayedRun.forcedConstraint && (
                                        <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/10 flex items-start justify-between gap-3">
                                          <p className="text-xs text-indigo-700 dark:text-indigo-400 flex items-start gap-1.5">
                                            <Target className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            <span>You forced this decision: {displayedRun.forcedConstraint}</span>
                                          </p>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPendingTreeAction({ type: "remove" })}
                                            className="h-8 text-xs rounded-md border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 flex-shrink-0"
                                          >
                                            Remove override
                                          </Button>
                                        </div>
                                      )}

                                      {/* Decision Tree */}
                                      {collaborativeRun.history && collaborativeRun.history.length > 0 && (
                                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                                          <span>Last change: {collaborativeRun.history[collaborativeRun.history.length - 1].trigger}</span>
                                          <button onClick={undoLastTreeChange} className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0">
                                            Undo — restore the tree to before this change
                                          </button>
                                        </div>
                                      )}
                                      {!hasSeenGoDeeperNudge && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/10">
                                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                          <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed flex-1">
                                            Want to dig into any branch further? Click the <span className="font-semibold">⋮</span> menu on a node below, choose <span className="font-semibold">Modify This Decision</span>, then <span className="font-semibold">Elaborate on what's here</span>.
                                          </p>
                                          <button
                                            onClick={() => { localStorage.setItem("orchestra_seen_go_deeper_nudge", "true"); setHasSeenGoDeeperNudge(true); }}
                                            aria-label="Dismiss"
                                            className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex-shrink-0"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                      {isPromotingNode && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Promoting "{nodeOpInFlight?.label}" to a top-level decision...
                                        </div>
                                      )}
                                      {isMovingNode && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Moving "{nodeOpInFlight?.label}" under "{nodeOpInFlight?.destination}"...
                                        </div>
                                      )}
                                      {isRevising && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Drafting the revision to "{nodeOpInFlight?.label}"...
                                        </div>
                                      )}
                                      {isAddingOutcome && (
                                        <div className="flex items-center justify-between gap-2 text-xs text-purple-600 dark:text-purple-400">
                                          <span className="flex items-center gap-2">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Building out the new outcome under "{nodeOpInFlight?.label}"...
                                          </span>
                                          <button onClick={() => runAbortRef.current?.abort()} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 flex-shrink-0">
                                            Stop
                                          </button>
                                        </div>
                                      )}
                                      {isRunningNewTab && (
                                        <div className="flex items-center justify-between gap-2 text-xs text-blue-600 dark:text-blue-400">
                                          <span className="flex items-center gap-2">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Discussing the new tab "{nodeOpInFlight?.label}"...
                                          </span>
                                          <button onClick={() => runAbortRef.current?.abort()} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 flex-shrink-0">
                                            Stop
                                          </button>
                                        </div>
                                      )}
                                      <PausedGoDeeperContext.Provider value={pausedGoDeeperNodeIds}>
                                      <Card id="tree-section" className="shadow-md border-slate-200 dark:border-slate-800">
                                        <CardContent className="p-5">
                                        <DecisionTreeSection
                                          decisionTree={displayedRun.decisionTree}
                                          actions={mainTreeActions}
                                          nodeComments={displayedRun.nodeComments || []}
                                          isCommentingLocked={followUpLoading || collaborativeLoading}
                                          onSubmitBatch={submitCommentBatch}
                                          treeViewMode={decisionTreeView}
                                          onTreeViewModeChange={setDecisionTreeView}
                                          detailMode={treeDetailView}
                                          onDetailModeChange={setTreeDetailView}
                                          isOpen={isDecisionTreeOpen}
                                          onOpenChange={setIsDecisionTreeOpen}
                                          onAddTab={collaborativeLoading || isRunningNewTab ? undefined : () => setPendingNewTabDialog(true)}
                                          focusRootId={focusRootId}
                                          onFocusRootHandled={() => setFocusRootId(null)}
                                          simpleLabels={isSimpleView}
                                          drag={{
                                            onMoveNode: (isMovingNode || isPromotingNode || collaborativeLoading) ? undefined : handleNodeDrop,
                                            draggedNodeId,
                                            dragOverNodeId,
                                            onDragStartNode: setDraggedNodeId,
                                            onDragOverNode: setDragOverNodeId,
                                            onDragEndNode: () => { setDraggedNodeId(null); setDragOverNodeId(null); }
                                          }}
                                        />
                                        </CardContent>
                                      </Card>
                                      </PausedGoDeeperContext.Provider>

                                      {/* Considerations — assumptions/risks/constraints/tradeoffs the
                                          panel weighed, kept separate from the decisions they informed.
                                          Always available here (Tier 2); the small subset the
                                          facilitator flags as genuinely uncertain also surface
                                          proactively in the post-outcome check-in (Tier 1). */}
                                      {displayedRun.considerations && displayedRun.considerations.length > 0 && (() => {
                                        const hasDisputed = displayedRun.considerations.some(c => getConsiderationDraft(c).stance !== "agree");
                                        return (
                                          <Card id="considerations-section" className="shadow-md border-slate-200 dark:border-slate-800">
                                          <CardContent className="p-5">
                                          <Collapsible open={isConsiderationsOpen} onOpenChange={setIsConsiderationsOpen}>
                                            <CollapsibleTrigger render={
                                              <button className="w-full flex items-center justify-between text-left group">
                                                <span className="flex items-center gap-2">
                                                  <Lightbulb className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 flex-shrink-0" />
                                                  <h3 className="text-xs font-medium text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                                                    Considerations
                                                    <Badge variant="outline" className="text-xs font-mono normal-case">{displayedRun.considerations!.length}</Badge>
                                                  </h3>
                                                </span>
                                                {isConsiderationsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500" />}
                                              </button>
                                            } />
                                            <CollapsibleContent>
                                              <div className="mt-2 space-y-2">
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                  Assumptions, risks, constraints, and tradeoffs the panel weighed — separate from the decisions they informed, so you can push back on a premise without reopening the whole outcome.
                                                </p>
                                                {displayedRun.considerations!.map(c => {
                                                  const draft = getConsiderationDraft(c);
                                                  const author = customTeam.find(a => a.id === c.raisedByAgentId);
                                                  const linkedLabels = c.linkedNodeIds.map(id => displayedRun.decisionTree.find(n => n.id === id)?.label).filter(Boolean);
                                                  return (
                                                    <div key={c.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                                                      <div className="flex items-start justify-between gap-2">
                                                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex-1 max-w-3xl">{c.text}</p>
                                                        <Badge variant="outline" className="text-xs font-mono capitalize flex-shrink-0">{c.category}</Badge>
                                                      </div>
                                                      <p className="text-xs text-slate-500">
                                                        {author && <>Raised by <span className={`font-semibold ${getAgentColorClass(author.id, customTeam)}`}>{author.name}</span></>}
                                                        {linkedLabels.length > 0 && <> · applies to: {linkedLabels.join(", ")}</>}
                                                      </p>
                                                      {/* Response model: Agree is the default and needs no action; the panel's
                                                          suggested alternatives are one-click positions (clicking the active one
                                                          reverts to agree); "Own response" opens free text. */}
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <button
                                                          onClick={() => setConsiderationResponse(c.id, "agree")}
                                                          aria-pressed={draft.stance === "agree"}
                                                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                                                            draft.stance === "agree"
                                                              ? "bg-emerald-600 text-white"
                                                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                          }`}
                                                        >
                                                          <Check className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                                                          Agree
                                                        </button>
                                                        {(c.alternatives || []).map(alt => (
                                                          <button
                                                            key={alt}
                                                            onClick={() => setConsiderationResponse(c.id, "alternative", alt)}
                                                            aria-pressed={draft.stance === "alternative" && draft.chosenAlternative === alt}
                                                            title={alt}
                                                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors max-w-[280px] truncate ${
                                                              draft.stance === "alternative" && draft.chosenAlternative === alt
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                            }`}
                                                          >
                                                            {alt}
                                                          </button>
                                                        ))}
                                                        <button
                                                          onClick={() => setConsiderationResponse(c.id, "custom")}
                                                          aria-pressed={draft.stance === "custom"}
                                                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                                            draft.stance === "custom"
                                                              ? "bg-amber-600 text-white"
                                                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                          }`}
                                                        >
                                                          Own response…
                                                        </button>
                                                      </div>
                                                      {draft.stance === "custom" && (
                                                        <Textarea
                                                          value={draft.note}
                                                          onChange={(e) => setConsiderationNote(c.id, e.target.value)}
                                                          placeholder="Your response to this consideration — what should the team treat as true instead?"
                                                          rows={2}
                                                          autoFocus
                                                          className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 resize-y min-h-[44px] focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                                                        />
                                                      )}
                                                      {draft.stance === "alternative" && (
                                                        <Textarea
                                                          value={draft.note}
                                                          onChange={(e) => setConsiderationNote(c.id, e.target.value)}
                                                          placeholder="Optional note alongside your chosen alternative..."
                                                          rows={1}
                                                          className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 resize-y min-h-[36px] focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                                                        />
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                                <div className="space-y-2 pt-1">
                                                  <div className="flex gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={submitConsiderationResponses}
                                                      className="flex-1 h-8 text-xs"
                                                    >
                                                      Record Responses
                                                    </Button>
                                                    {hasDisputed && (
                                                      <Button
                                                        size="sm"
                                                        disabled={isAskingTeamToReconsider || followUpLoading || collaborativeLoading}
                                                        onClick={askTeamToReconsiderConsiderations}
                                                        className="flex-1 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                                                      >
                                                        {isAskingTeamToReconsider ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                                                        Ask the Team to Reconsider
                                                      </Button>
                                                    )}
                                                    {hasDisputed && (
                                                      <Button
                                                        size="sm"
                                                        disabled={isAskingTeamToReconsider || followUpLoading || collaborativeLoading}
                                                        onClick={rerunWithConsiderationResponses}
                                                        className="flex-1 h-8 text-xs gap-1.5"
                                                      >
                                                        <RefreshCw className="w-3 h-3" />
                                                        Re-run Discussion ({displayedRun.considerations!.filter(c => getConsiderationDraft(c).stance !== "agree").length})
                                                      </Button>
                                                    )}
                                                  </div>
                                                  {hasDisputed && (
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                      <span className="font-medium">Reconsider</span> is one facilitator pass proposing targeted changes for your approval — quick, good for small pushback. <span className="font-medium">Re-run Discussion</span> starts the whole team debate again with your responses treated as amended premises — use it when a changed premise should reshape the reasoning itself. The current outcome is kept in this conversation's history either way.
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                          </CardContent>
                                          </Card>
                                        );
                                      })()}
                                    </>
                                  )}

                                  {/* Create Document / Spreadsheet / Slide Deck from this output */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <CreateFileMenu
                                        generatingKind={mainFileGenerating}
                                        onSelect={(kind) => startPreflight(kind, taskType === "deliverable" && displayedRun.deliverable
                                          ? `${displayedRun.deliverable.title}\n\n${displayedRun.deliverable.sections.map(s => `## ${s.heading}\n${s.content}`).join("\n\n")}`
                                          : `Outcome: ${displayedRun.outcome}\n\nReasons:\n${displayedRun.reasons.join("\n")}\n\nDecision tree:\n${treeToExportText(displayedRun.decisionTree)}`)}
                                        onExport={(format) => exportRunAs(format, displayedRun)}
                                        isExportingPdf={isExportingPdf}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isExportingConversation}
                                        onClick={() => exportFullConversation(displayedRun)}
                                        className="h-9 text-xs gap-1.5 text-slate-500 dark:text-slate-400"
                                      >
                                        {isExportingConversation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        Export Full Conversation
                                      </Button>
                                    </div>
                                    {mainGeneratedFiles.length > 0 && (
                                      <div className="space-y-1.5">
                                        {mainGeneratedFiles.map((f, i) => <GeneratedFileCard key={i} file={f} />)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                    {/* Post-outcome check-in: the team may have a few questions before calling
                        the work wrapped up. Reuses the same attributed-question pattern as the
                        pre-discussion clarifying flow. */}
                    {chatMode === "collaborative" && collaborativeRun && postOutcomeQuestions && (postOutcomeGateState === "gate" || postOutcomeGateState === "answering") && (
                      <Card id="questions-section" className="shadow-lg border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/5">
                        <CardContent className="p-5">
                          {postOutcomeGateState === "gate" ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <MessageSquareText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  The team has {postOutcomeQuestions.length === 1 ? "one question" : `${postOutcomeQuestions.length} questions`}
                                  {(() => {
                                    const flaggedCount = (collaborativeRun?.considerations || []).filter(c => c.flaggedForReview).length;
                                    return flaggedCount > 0 ? ` and flagged ${flaggedCount === 1 ? "one consideration" : `${flaggedCount} considerations`} worth confirming` : "";
                                  })()} before calling this wrapped up.
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const hasFlagged = (collaborativeRun?.considerations || []).some(c => c.flaggedForReview);
                                    if (hasFlagged) {
                                      setIsConsiderationsOpen(true);
                                      setTimeout(() => document.getElementById("considerations-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                                    }
                                    setPostOutcomeGateState("answering");
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" /> Let's see the questions
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPostOutcomeGateState("dismissed")}
                                  className="flex-1"
                                >
                                  I'm happy with your work — stop here
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                  <MessageSquareText className="w-3.5 h-3.5" /> Question {postOutcomeIndex + 1} of {postOutcomeQuestions.length}
                                </span>
                                <button
                                  onClick={skipRemainingPostOutcomeQuestions}
                                  className="text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  Skip remaining
                                </button>
                              </div>
                              {/* Progress dots double as direct navigation — click any dot to
                                  jump straight to that question, filled dots mark answered
                                  ones. Previously there was no way to see this at a glance or
                                  move anywhere except one step forward. */}
                              <div className="flex items-center gap-1.5">
                                {postOutcomeQuestions.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => goToPostOutcomeQuestion(i)}
                                    aria-label={`Go to question ${i + 1}`}
                                    aria-current={i === postOutcomeIndex}
                                    className={`h-1.5 rounded-full transition-all ${
                                      i === postOutcomeIndex
                                        ? "w-6 bg-blue-600"
                                        : postOutcomeAnswers[i] !== null
                                          ? "w-1.5 bg-blue-300 dark:bg-blue-800"
                                          : "w-1.5 bg-slate-200 dark:bg-slate-700"
                                    }`}
                                  />
                                ))}
                              </div>
                              {(() => {
                                const current = postOutcomeQuestions[postOutcomeIndex];
                                const asker = customTeam.find(a => a.id === current.askedBy);
                                const existingAnswer = postOutcomeAnswers[postOutcomeIndex];
                                const matchesOption = existingAnswer !== null && current.options.includes(existingAnswer);
                                const finishWithCurrentInput = () => {
                                  const text = postOutcomeCustomAnswer.trim();
                                  if (!text && current.freeTextOnly) {
                                    skipRemainingPostOutcomeQuestions();
                                  } else {
                                    answerPostOutcomeQuestion(text);
                                  }
                                };
                                return (
                                  <>
                                    {asker && !current.freeTextOnly && (
                                      <p className="text-xs">
                                        <span className={`font-bold ${getAgentColorClass(asker.id, customTeam)}`}>{asker.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400"> wants to know:</span>
                                      </p>
                                    )}
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{current.question}</p>
                                    {!current.freeTextOnly && current.options.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {current.options.map((option, i) => (
                                          <button
                                            key={i}
                                            data-tour={option === "Go deeper on this" ? "go-deeper" : undefined}
                                            onClick={() => {
                                              // Target-a-specific-axis: rather than always
                                              // re-running the whole task, offer to focus on
                                              // one root axis when there's more than one —
                                              // most runs that warrant "go deeper" only had
                                              // one part that was actually thin.
                                              const rootAxes = (collaborativeRun?.decisionTree || []).filter(n => n.parentId === null);
                                              if (option === "Go deeper on this" && rootAxes.length >= 2) {
                                                setShowGoDeeperAxisPicker(true);
                                              } else {
                                                answerPostOutcomeQuestion(option);
                                              }
                                            }}
                                            aria-pressed={existingAnswer === option || (option === "Go deeper on this" && existingAnswer?.startsWith("Go deeper on this"))}
                                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                              existingAnswer === option || (option === "Go deeper on this" && existingAnswer?.startsWith("Go deeper on this"))
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "border-blue-200 dark:border-blue-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                            }`}
                                          >
                                            {option}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {showGoDeeperAxisPicker && (
                                      <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/10 space-y-2">
                                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Which part should the team focus on?</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {(collaborativeRun?.decisionTree || []).filter(n => n.parentId === null).map(axis => (
                                            <button
                                              key={axis.id}
                                              onClick={() => { setShowGoDeeperAxisPicker(false); answerPostOutcomeQuestion(`Go deeper on this — focus on: ${axis.label}`); }}
                                              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-indigo-200 dark:border-indigo-800 bg-card text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                                            >
                                              {axis.label}
                                            </button>
                                          ))}
                                          <button
                                            onClick={() => { setShowGoDeeperAxisPicker(false); answerPostOutcomeQuestion("Go deeper on this"); }}
                                            className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-card text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          >
                                            Everything
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {/* isGoDeeperPick: the axis picker writes "Go deeper on this — focus
                                        on: X" into postOutcomeAnswers directly — this is NOT free text to
                                        redisplay-and-resubmit. Previously the input's fallback display
                                        showed this string as if typed, but Submit read the real (still
                                        empty) postOutcomeCustomAnswer state underneath it — so clicking
                                        Submit silently overwrote a valid "go deeper on X" answer with "",
                                        which then failed submitPostOutcomeAnswers' startsWith check with
                                        no visible error. Only genuine custom-typed answers populate the
                                        fallback now, and Submit is disabled unless there's real new text. */}
                                    {(() => {
                                      const isGoDeeperPick = existingAnswer !== null && existingAnswer.startsWith("Go deeper on this");
                                      const showCustomFallback = !matchesOption && !isGoDeeperPick && !!existingAnswer;
                                      return (
                                        <div className="flex gap-2">
                                          <Input
                                            value={postOutcomeCustomAnswer || (showCustomFallback ? existingAnswer! : "")}
                                            onChange={(e) => setPostOutcomeCustomAnswer(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") finishWithCurrentInput(); }}
                                            placeholder={current.freeTextOnly ? "Type any comments (optional)..." : "Or type your own answer..."}
                                            className="h-9 text-xs flex-1 bg-card border-slate-200 dark:border-slate-800"
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={!postOutcomeCustomAnswer.trim() && !current.freeTextOnly}
                                            onClick={finishWithCurrentInput}
                                            className="h-9"
                                          >
                                            {current.freeTextOnly ? "Save" : "Submit"}
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                    {existingAnswer !== null && existingAnswer !== "" && (() => {
                                      const focusMatch = existingAnswer.match(/ — focus on: (.+)$/);
                                      return (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                          {focusMatch
                                            ? <>Saved — will focus on "{focusMatch[1]}". Nothing more to do here, hit Finish when ready.</>
                                            : existingAnswer.startsWith("Go deeper on this")
                                            ? "Saved — nothing more to do here, hit Finish when ready."
                                            : "Saved"}
                                        </p>
                                      );
                                    })()}
                                    {/* Explicit Back/Next, independent of whether the current
                                        question has been answered — free navigation is the
                                        whole point, not just editing after the fact. */}
                                    <div className="flex items-center justify-between pt-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={postOutcomeIndex === 0}
                                        onClick={() => goToPostOutcomeQuestion(postOutcomeIndex - 1)}
                                        className="h-8 text-xs gap-1 text-slate-500 dark:text-slate-400"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                                      </Button>
                                      {postOutcomeIndex + 1 < postOutcomeQuestions.length ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => goToPostOutcomeQuestion(postOutcomeIndex + 1)}
                                          className="h-8 text-xs gap-1 text-slate-500 dark:text-slate-400"
                                        >
                                          Next <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={skipRemainingPostOutcomeQuestions}
                                          className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                          Finish
                                        </Button>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    </div>
                    )}
                    </div>
                </div>
              ) : activeTab === "teams" ? (
                /* My Teams Tab */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-blue-500" />
                      My Teams
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Saved Team Agents rosters. Select one to start a new conversation with that setup.
                    </p>
                  </div>

                  {savedTeams.length === 0 ? (
                    <div className="text-center py-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-2">
                      <Bookmark className="w-10 h-10 mx-auto stroke-[1.5]" />
                      <p className="text-sm">No saved teams yet. Build a roster in Multi Agent Team → Team Agents, then use the "Teams" button to save it.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedTeams.map(team => (
                        <Card key={team.id} className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{team.name}</CardTitle>
                                <CardDescription className="text-xs font-mono">
                                  {team.agents.length} agent{team.agents.length === 1 ? "" : "s"} · saved {new Date(team.createdAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewingTeamDetails(team)}
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteSavedTeam(team.id)}
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-1 flex flex-col">
                            <div className="space-y-1.5 flex-1">
                              {team.agents.map(agent => (
                                <div key={agent.id} className="flex items-center gap-2 text-xs">
                                  <span className={`font-bold ${getAgentColorClass(agent.id, team.agents)}`}>{agent.name}</span>
                                  <span className="font-mono text-[10px] lowercase text-faint-foreground">{agent.provider}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setViewingTeamDetails(team)}
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-lg gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </Button>
                              <Button
                                onClick={() => useSavedTeam(team)}
                                size="sm"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "files" ? (
                /* My Files Tab */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                      My Files
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Saved Knowledge Base setups. Load one to attach its sources to a new conversation without re-uploading.
                    </p>
                  </div>

                  {savedKnowledgeSets.length === 0 ? (
                    <div className="text-center py-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-2">
                      <FolderOpen className="w-10 h-10 mx-auto stroke-[1.5]" />
                      <p className="text-sm">No saved file setups yet. Add sources in Multi Agent Team → Knowledge Base, then use the "Files" button to save them.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedKnowledgeSets.map(set => (
                        <Card key={set.id} className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{set.name}</CardTitle>
                                <CardDescription className="text-xs font-mono">
                                  {set.files.length} source{set.files.length === 1 ? "" : "s"} · saved {new Date(set.createdAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSavedKnowledgeSet(set.id)}
                                className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-1 flex flex-col">
                            <div className="space-y-1.5 flex-1">
                              {set.files.map(file => {
                                const meta = SOURCE_TYPE_META[file.sourceType] || SOURCE_TYPE_META.file;
                                const SourceIcon = meta.icon;
                                return (
                                  <div key={file.id} className="flex items-center gap-2 text-xs">
                                    <SourceIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                    <span className="truncate flex-1 text-slate-600 dark:text-slate-300">{file.name}</span>
                                    {file.content && (
                                      <button
                                        onClick={() => setPreviewingKnowledgeFile(file)}
                                        aria-label={`Open ${file.name}`}
                                        className="text-slate-400 hover:text-blue-500 flex-shrink-0"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              onClick={() => requestLoadKnowledgeSet(set)}
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
                            >
                              <FolderOpen className="w-3.5 h-3.5" /> Load Into Knowledge Base
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "enquiries" ? (
                /* Enquiries Tab (BriefBridge) */
                user && <EnquiryHub userId={user.uid} onPipeToPrompt={handlePipeEnquiryToPrompt} />
              ) : (
                /* History Tab */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        History
                      </h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Every conversation from Multi Agent Team and Agent Comparison Playground, and every specification from Product, newest first. Click one to reopen and continue it.
                      </p>
                    </div>
                    {unifiedHistory.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryDeleteTarget({ mode: "all" })}
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear History
                      </Button>
                    )}
                  </div>

                  {selectedRunIdsForCompare.length > 0 && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20">
                      <span className="text-xs text-blue-700 dark:text-blue-400">
                        {selectedRunIdsForCompare.length === 1 ? "1 decision selected — pick one more to compare" : "2 decisions selected"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedRunIdsForCompare([])} className="h-7 text-xs text-slate-500">
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          disabled={selectedRunIdsForCompare.length !== 2}
                          onClick={() => setIsCompareRunsOpen(true)}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                        >
                          <GitCompareArrows className="w-3.5 h-3.5" /> Compare
                        </Button>
                      </div>
                    </div>
                  )}

                  {unifiedHistory.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        placeholder="Search chat history..."
                        className="h-9 pl-9 text-xs bg-card border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  )}

                  {unifiedHistory.length === 0 ? (
                    <div className="text-center py-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-2">
                      <History className="w-10 h-10 mx-auto stroke-[1.5]" />
                      <p className="text-sm">No conversations yet. Run something in Agent Comparison Playground, Multi Agent Team, or the Product tab to see it here.</p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed dark:border-slate-800 text-slate-500 space-y-2">
                      <Search className="w-10 h-10 mx-auto stroke-[1.5]" />
                      <p className="text-sm">No conversations match "{historySearchQuery}".</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredHistory.map(entry => {
                        const typeMeta = {
                          comparison: { label: "Agent Comparison", icon: LayoutGrid },
                          parallel: { label: "Multi Agent Team · Parallel", icon: Layers },
                          collaborative: { label: "Multi Agent Team · Collaborative", icon: MessagesSquare },
                          product: { label: "Product Spec", icon: ClipboardList }
                        }[entry.type];
                        const TypeIcon = typeMeta.icon;
                        const isRenaming = renamingHistoryId === entry.id;
                        // Only collaborative entries can be mid-run checkpoints (see
                        // checkpointRun) — a comparison/parallel entry is always complete by
                        // the time it's ever saved, so this stays undefined for those.
                        const runStatusForBadge = entry.type === "collaborative" ? collaborativeHistory.find(r => r.id === entry.id)?.status : undefined;
                        return (
                          <div
                            key={entry.id}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-3">
                              {entry.type === "collaborative" && (
                                <button
                                  onClick={() => toggleRunForCompare(entry.id)}
                                  aria-pressed={selectedRunIdsForCompare.includes(entry.id)}
                                  aria-label={selectedRunIdsForCompare.includes(entry.id) ? "Remove from comparison" : "Add to comparison"}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${selectedRunIdsForCompare.includes(entry.id) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-400"}`}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button onClick={() => openHistoryEntry(entry)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                                <TypeIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                <Badge variant="outline" className="text-xs font-mono flex-shrink-0">{typeMeta.label}</Badge>
                                <span className="text-xs text-slate-500 font-mono flex-shrink-0">{new Date(entry.timestamp).toLocaleString()}</span>
                                {runStatusForBadge === "in_progress" && (
                                  <Badge className="text-xs flex-shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-0 gap-1">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> In progress
                                  </Badge>
                                )}
                                {runStatusForBadge === "failed" && (
                                  <Badge className="text-xs flex-shrink-0 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-0 gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" /> Didn't complete
                                  </Badge>
                                )}
                              </button>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {entry.type === "collaborative" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { const run = collaborativeHistory.find(r => r.id === entry.id); if (run) { setNewShareUrl(null); setShareDialogRun(run); } }}
                                    className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyHistoryEntry(entry)}
                                  title="Copy — branch this into a new entry you can edit separately"
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setRenamingHistoryId(entry.id); setHistoryRenameDraft(entry.title || entry.summary); }}
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setHistoryDeleteTarget({ mode: "single", id: entry.id, label: entry.title || entry.summary })}
                                  className="w-7 h-7 rounded-md hit-target text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <button onClick={() => openHistoryEntry(entry)}>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                </button>
                              </div>
                            </div>
                            {isRenaming ? (
                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  autoFocus
                                  value={historyRenameDraft}
                                  onChange={(e) => setHistoryRenameDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") { renameHistoryEntry(entry.id, historyRenameDraft); setRenamingHistoryId(null); }
                                    if (e.key === "Escape") setRenamingHistoryId(null);
                                  }}
                                  className="h-8 text-sm flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { renameHistoryEntry(entry.id, historyRenameDraft); setRenamingHistoryId(null); }}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setRenamingHistoryId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button onClick={() => openHistoryEntry(entry)} className="block w-full text-left">
                                <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 truncate">{entry.title || entry.summary}</p>
                              </button>
                            )}
                            {/* Bidirectional provenance: a run that spawned a revisit/Go-Deeper
                                follow-up now says so, rather than only the new run knowing what
                                triggered it. */}
                            {(() => {
                              const run = entry.type === "collaborative" ? collaborativeHistory.find(r => r.id === entry.id) : null;
                              if (!run?.spawnedRunIds?.length) return null;
                              return (
                                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 flex items-center gap-1">
                                  <GitCompareArrows className="w-3 h-3 flex-shrink-0" />
                                  → {run.spawnedRunIds.length} follow-up run{run.spawnedRunIds.length === 1 ? "" : "s"}
                                </p>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Chat History Delete Confirmation Dialog */}
            <Dialog open={!!historyDeleteTarget} onOpenChange={(open) => { if (!open) setHistoryDeleteTarget(null); }}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Trash2 className="w-4 h-4 text-red-500" /> {historyDeleteTarget?.mode === "all" ? "Clear All History?" : "Delete This Conversation?"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {historyDeleteTarget?.mode === "all"
                      ? "This permanently removes every conversation from Chat History. This can't be undone."
                      : `"${historyDeleteTarget?.label}" will be permanently removed from Chat History. This can't be undone.`}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setHistoryDeleteTarget(null)} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (historyDeleteTarget?.mode === "all") clearAllHistory();
                        else if (historyDeleteTarget?.mode === "single") deleteHistoryEntry(historyDeleteTarget.id);
                        setHistoryDeleteTarget(null);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <footer className="w-full px-6 lg:px-8 py-12 border-t dark:border-slate-800 mt-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 opacity-60">
                  <OrchestraWordmark compact />
                </div>
              </div>
            </footer>
          </>
        )}

        {/* Decision Tree Override / Promote Confirmation Dialog */}
        <ConfirmActionDialog
          open={!!pendingTreeAction}
          onClose={() => setPendingTreeAction(null)}
          icon={pendingTreeAction?.type === "promote" ? <MoveUp className="w-4 h-4 text-indigo-500" /> : <Target className="w-4 h-4 text-blue-500" />}
          title={pendingTreeAction?.type === "force" ? "Force This Branch?" : pendingTreeAction?.type === "promote" ? "Promote To Top-Level Decision?" : "Remove Override?"}
          confirmLabel={<><RefreshCw className="w-3.5 h-3.5" /> {pendingTreeAction?.type === "promote" ? "Restructure" : "Re-discuss"}</>}
          confirmClassName={`text-white gap-1.5 ${pendingTreeAction?.type === "promote" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}
          onConfirm={() => {
            if (pendingTreeAction?.type === "promote" && pendingTreeAction.node) {
              const node = pendingTreeAction.node;
              setPendingTreeAction(null);
              promoteNodeToTopLevel(node);
            } else {
              const constraint = pendingTreeAction?.type === "force" ? pendingTreeAction.constraint : null;
              setPendingTreeAction(null);
              runCollaborativeSession(constraint);
            }
          }}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {pendingTreeAction?.type === "force"
              ? `The full panel will re-discuss the task treating "${pendingTreeAction.label}" as a fixed decision, and work out the implications and an updated recommendation consistent with it. This runs all agents again from scratch.`
              : pendingTreeAction?.type === "promote"
              ? `The facilitator will restructure the tree so "${pendingTreeAction.label}" stands on its own as an independent, top-level decision rather than a sub-branch — recomputing probabilities and reasoning to stay consistent. This is a single facilitator call, not a full re-discussion, so it's much faster and cheaper than "Force this branch." The recommended outcome usually won't change unless the restructuring genuinely reveals it should.`
              : "The full panel will re-discuss the task without your prior constraint, as a fresh, unconstrained discussion. This runs all agents again from scratch."}
          </p>
        </ConfirmActionDialog>

        {/* Move Decision: drag-and-drop confirmation, same lightweight-restructure family as
            Promote (one facilitator call, full tree in and out) — chosen over a full
            re-discussion specifically because re-arguing the whole tree risks reshaping axes
            nowhere near the branch being moved, which defeats the point of a precise move. */}
        <ConfirmActionDialog
          open={!!pendingMove}
          onClose={() => setPendingMove(null)}
          icon={<Move className="w-4 h-4 text-indigo-500" />}
          title="Move This Decision?"
          confirmLabel={<><Move className="w-3.5 h-3.5" /> Move</>}
          confirmClassName="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          onConfirm={() => {
            if (pendingMove) {
              const { node, newParent } = pendingMove;
              setPendingMove(null);
              moveNodeUnderParent(node, newParent);
            }
          }}
        >
          {pendingMove?.looksLikeAlternatives && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-warning-soft border-l-[3px] border-l-warning bg-warning-soft">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-700 dark:text-amber-400">These currently look like competing options for the same choice</span> — their probabilities, together with their other siblings, sum close to 100%. Nesting one under the other turns "an alternative to" into "only applies if," which may not be what you intend. Proceed if that's a genuine dependency you've identified, not just a re-shuffle.
              </p>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            "{pendingMove?.node.label}" (and everything nested beneath it) will move to become a sub-decision under "{pendingMove?.newParent.label}". The facilitator will recompute probabilities among its new siblings so they stay consistent — this is a single restructuring call, not a full re-discussion, so it's fast and won't reshape any other part of the tree.
          </p>
        </ConfirmActionDialog>

        {/* "Revise this section/node" — request input. Deliberately a single free-text box,
            no structure: this is the lightweight path specifically because it's ONE call to
            the actual author, not a re-discussion, so there's no team to brief beyond the
            content itself and what should change about it. */}
        <ConfirmActionDialog
          open={!!pendingRevisionRequest}
          onClose={() => setPendingRevisionRequest(null)}
          icon={<PenLine className="w-4 h-4 text-emerald-500" />}
          title={pendingRevisionRequest?.isSection ? "Revise This Section" : "Revise This Node"}
          headerDescription={<>"{pendingRevisionRequest?.node.label}" — one call to {pendingRevisionRequest?.isSection ? "its original author" : "the facilitator"}, not a full re-discussion.</>}
          confirmLabel={<><PenLine className="w-3.5 h-3.5" /> Revise</>}
          confirmClassName="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          confirmDisabled={!revisionDraftText.trim()}
          onConfirm={submitRevisionRequest}
        >
          <Input
            autoFocus
            value={revisionDraftText}
            onChange={(e) => setRevisionDraftText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && revisionDraftText.trim()) submitRevisionRequest(); }}
            placeholder={pendingRevisionRequest?.isSection ? "e.g. make this more concise, add a concrete example..." : "e.g. state this more confidently, mention the cost tradeoff..."}
            className="h-9 text-xs bg-card border-slate-200 dark:border-slate-800"
          />
        </ConfirmActionDialog>

        {/* "Modify this decision" — the consolidated entry point replacing separate Expand
            Scope / Add Outcome menu items. Two option cards, not a ConfirmActionDialog
            (there's no single confirm action here, just a choice between two different
            flows that each open their own dialog). */}
        <Dialog open={!!pendingModifyChoiceNode} onOpenChange={(v) => { if (!v) setPendingModifyChoiceNode(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base"><Wand2 className="w-4 h-4 text-indigo-500" /> Modify This Decision</DialogTitle>
              <DialogDescription>Under "{pendingModifyChoiceNode?.label}" — how do you want to change it?</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <button
                onClick={() => { const node = pendingModifyChoiceNode; setPendingModifyChoiceNode(null); if (node) startGoDeeper(node); }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-indigo-700 dark:text-indigo-400"><Sparkles className="w-3.5 h-3.5" /> Elaborate on what's here</div>
                <p className="text-xs text-slate-500 mt-1">A short Q&A, then new child nodes fleshing this branch out further. Purely additive — doesn't touch the rest of the tree.</p>
              </button>
              <button
                onClick={() => { const node = pendingModifyChoiceNode; setPendingModifyChoiceNode(null); if (node) requestAddOutcome(node); }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors"
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-purple-700 dark:text-purple-400"><ListPlus className="w-3.5 h-3.5" /> Add my own outcome</div>
                <p className="text-xs text-slate-500 mt-1">Propose an option the team hasn't considered. They build it out and decide if it beats the existing sibling(s).</p>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* "+ New Tab" — asks for the new decision up front, then runs a full multi-round
            discussion with the existing team, scoped to just this one decision. */}
        <ConfirmActionDialog
          open={pendingNewTabDialog}
          onClose={() => { setPendingNewTabDialog(false); setNewTabDraftText(""); }}
          icon={<Plus className="w-4 h-4 text-blue-500" />}
          title="New Tab — a New Decision"
          headerDescription="The full team will discuss this as its own, independent decision — a full multi-round debate, same as your main discussion — and the result becomes a new tab. Nothing about your existing tabs changes."
          confirmLabel={<><Plus className="w-3.5 h-3.5" /> Start Discussion</>}
          confirmClassName="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          confirmDisabled={!newTabDraftText.trim()}
          onConfirm={submitNewTabDiscussion}
        >
          <Textarea
            autoFocus
            value={newTabDraftText}
            onChange={(e) => setNewTabDraftText(e.target.value)}
            placeholder="What is the decision being made here?"
            rows={3}
            className="text-xs bg-card border-slate-200 dark:border-slate-800 resize-y"
          />
        </ConfirmActionDialog>

        {/* "Add a new outcome" — the manager's own idea, not something the team proposed.
            Different from Expand Scope: see the menu tooltip for the distinction. */}
        <ConfirmActionDialog
          open={!!pendingAddOutcomeNode}
          onClose={() => { setPendingAddOutcomeNode(null); setAddOutcomeDraftText(""); }}
          icon={<ListPlus className="w-4 h-4 text-purple-500" />}
          title="Add a New Outcome"
          headerDescription={<>Under "{pendingAddOutcomeNode?.label}" — describe the option you want considered. The team will build it out and decide whether it should be selected over the existing option(s); nothing else about this decision changes.</>}
          confirmLabel={<><ListPlus className="w-3.5 h-3.5" /> Add & Discuss</>}
          confirmClassName="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          confirmDisabled={!addOutcomeDraftText.trim()}
          onConfirm={submitAddOutcome}
        >
          <Textarea
            autoFocus
            value={addOutcomeDraftText}
            onChange={(e) => setAddOutcomeDraftText(e.target.value)}
            placeholder="e.g. What about a hybrid approach that combines X and Y?"
            rows={3}
            className="text-xs bg-card border-slate-200 dark:border-slate-800 resize-y"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-card border border-slate-200 dark:border-slate-800 w-fit">
              <button
                onClick={() => setAddOutcomeMode("quick")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${addOutcomeMode === "quick" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Quick — one call
              </button>
              <button
                onClick={() => setAddOutcomeMode("full")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${addOutcomeMode === "full" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Full team debate
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {addOutcomeMode === "quick"
                ? "The facilitator alone builds this out and makes the selection call — fast and cheap, but only one perspective judges it."
                : "The whole team debates your idea against the existing option(s) first (a full multi-round discussion, same as \"+ New Tab\"), then the facilitator's build-out and selection call is grounded in that debate — slower and more thorough."}
            </p>
          </div>
        </ConfirmActionDialog>

        {/* Revision preview — before/after, nothing applied until explicitly confirmed. Same
            shape as Move's confirmation: the manager reviews the actual proposed change
            rather than trusting a description of it. */}
        <ConfirmActionDialog
          open={!!revisionPreview}
          onClose={() => setRevisionPreview(null)}
          icon={<PenLine className="w-4 h-4 text-emerald-500" />}
          title="Review This Revision"
          headerDescription="Nothing is applied until you confirm."
          contentClassName="max-w-lg"
          bodyClassName="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1"
          buttonsOutsideBody
          cancelLabel="Discard"
          confirmLabel={<><Check className="w-3.5 h-3.5" /> Apply</>}
          confirmClassName="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          onConfirm={confirmRevision}
        >
          {!revisionPreview?.isSection && revisionPreview?.beforeLabel !== revisionPreview?.afterLabel && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint-foreground">Label</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 line-through">{revisionPreview?.beforeLabel}</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">{revisionPreview?.afterLabel}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint-foreground">Before</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed p-2.5 rounded-lg bg-surface-2 whitespace-pre-wrap">{revisionPreview?.beforeText}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">After</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 whitespace-pre-wrap">{revisionPreview?.afterText}</p>
            </div>
          </div>
        </ConfirmActionDialog>

        {/* Answering a "needs_input" blocker: the team explicitly said it can't finish
            without this, so — like Force/Promote — this is a full re-discussion, not a
            quick chat reply, and gets the same explicit confirm-before-running treatment. */}
        <Dialog open={!!pendingBlockingReply} onOpenChange={(open) => { if (!open) setPendingBlockingReply(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Answer the Team's Question?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{pendingBlockingReply?.statusNote}</p>
              </div>
              <Input
                autoFocus
                value={blockingReplyDraft}
                onChange={(e) => setBlockingReplyDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && blockingReplyDraft.trim()) { const note = pendingBlockingReply!.statusNote; setPendingBlockingReply(null); runCollaborativeSession(null, null, null, null, null, { statusNote: note, answer: blockingReplyDraft.trim() }); } }}
                placeholder="Your answer..."
                className="h-9 text-xs bg-card border-slate-200 dark:border-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The full panel will re-discuss the task with this answer in hand, and work out an updated recommendation consistent with it. This runs all agents again from scratch.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPendingBlockingReply(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  disabled={!blockingReplyDraft.trim()}
                  onClick={() => {
                    const note = pendingBlockingReply!.statusNote;
                    const answer = blockingReplyDraft.trim();
                    setPendingBlockingReply(null);
                    runCollaborativeSession(null, null, null, null, null, { statusNote: note, answer });
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-discuss
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unified Chat Drawer (Concept A) — replaces the separate Chat With The Team card and
            the old per-node Discuss modal with one persistent, slide-out surface. */}
        <Sheet open={isChatDrawerOpen} onOpenChange={setIsChatDrawerOpen}>
          <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0 border-l dark:border-slate-800">
            {/* Close control lives on the drawer's own left edge — where it actually borders
                the rest of the page — rather than at the screen's far right where the open
                trigger sits. Positioned via absolute + a full negative translate so it hangs
                just outside the drawer's box, anchored to SheetContent's own fixed position
                rather than the viewport, so it tracks correctly whether the drawer is
                full-width (mobile) or capped (sm and up). */}
            <button
              onClick={() => setIsChatDrawerOpen(false)}
              aria-label="Close Team Chat"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex items-center pl-3 pr-3 py-3 rounded-l-xl bg-slate-700 hover:bg-slate-800 text-white shadow-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SheetHeader className="p-6 pb-4 border-b dark:border-slate-800 flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Team Chat
              </SheetTitle>
              <SheetDescription className="text-xs">
                {chatTargetMode === "everyone"
                  ? "Every agent answers individually — no cross-talk, no panel revision."
                  : chatTargetMode !== "team"
                    ? "A direct question to one agent — their own take, not an official panel answer."
                    : chatMode === "collaborative"
                      ? "What you raise here can propose changes to the panel's outcome and decision tree — nothing is committed until you approve it."
                      : "Ask the team a follow-up about their responses."}
              </SheetDescription>
              {chatDrawerPinnedNode && (
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <Badge variant="outline" className="text-xs gap-1 border-teal-300 dark:border-teal-800 text-teal-600 dark:text-teal-400 min-w-0">
                    <GitBranch className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{chatDrawerPinnedNode.nodeLabel}</span>
                    {typeof chatDrawerPinnedNode.probability === "number" && ` · ${chatDrawerPinnedNode.probability}%`}
                  </Badge>
                  {/* Containment chain: which run this node discussion belongs to, so a user
                      several layers deep (drawer → pinned node → mid-run) can still see the
                      top of the stack without closing anything. */}
                  {collaborativeRun?.prompt && (
                    <span className="text-xs text-slate-500 truncate min-w-0">
                      in: {collaborativeRun.prompt.length > 60 ? `${collaborativeRun.prompt.slice(0, 60)}…` : collaborativeRun.prompt}
                    </span>
                  )}
                  <button onClick={() => setChatDrawerPinnedNode(null)} aria-label="Unpin node from this conversation" className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </SheetHeader>

            <div ref={drawerScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
              {followUpMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs space-y-1">
                  <MessageSquare className="w-6 h-6 mx-auto stroke-[1.5] mb-2" />
                  <p>Ask the team anything, or discuss a specific branch from the decision tree.</p>
                </div>
              ) : (
                followUpMessages.map((m) => {
                  const isMostRecentCommit = m.changesApplied && m.id === [...followUpMessages].reverse().find(x => x.changesApplied)?.id;
                  return (
                  m.isVerifiedCalculation ? (
                    <div key={m.id} className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/15 flex items-center gap-2 mx-2">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">{m.text}</span>
                      <Badge variant="outline" className="text-xs border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 ml-auto flex-shrink-0">verified</Badge>
                    </div>
                  ) : m.role === "user" ? (
                    <div key={m.id} className="p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/20 text-slate-700 dark:text-slate-200 ml-6">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-500">You</span>
                        {m.nodeContext && m.nodeContext.length > 0 && (
                          <span className="text-xs text-teal-600 dark:text-teal-400 truncate">Re: {m.nodeContext.map(n => n.nodeLabel).join(", ")}</span>
                        )}
                      </div>
                      {m.text}
                    </div>
                  ) : (
                    <div key={m.id} className="mr-6 space-y-2">
                      {m.transcript && m.transcript.length > 0 && (
                        <div className="space-y-2 p-2.5 rounded-lg bg-surface-2 border border-slate-100 dark:border-slate-800">
                          <span className="block text-xs font-medium text-slate-500">Panel discussion</span>
                          {m.transcript.map((entry, j) => {
                            const colorClass = getAgentColorClass(entry.agentId, customTeam);
                            return (
                              <div key={j} className="flex items-start gap-2">
                                <span
                                  aria-hidden="true"
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 bg-current/15 ${colorClass}`}
                                >
                                  {entry.agentName.trim().charAt(0).toUpperCase() || "?"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className={`block text-xs font-bold ${colorClass}`}>{entry.agentName}</span>
                                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{entry.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {m.individualResponses && m.individualResponses.length > 0 ? (
                        <div className="space-y-2">
                          {m.individualResponses.map((r, idx) => {
                            const rCheck = checkClaimsAgainstNumbers(r.message, trustedFactsSourceNumbers);
                            return (
                              <div key={idx} className="p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-xs font-medium ${getAgentColorClass(r.agentId, customTeam)}`}>{r.agentName}</span>
                                  {rCheck?.hasUnverifiedClaims && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="text-xs gap-1 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 cursor-help">
                                          <AlertTriangle className="w-3 h-3" /> check figures
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[240px] p-3 bg-card border-orange-200 dark:border-orange-800 shadow-xl">
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                          {rCheck.unverifiedNumbers.join(", ")} — not found in your Knowledge Base or prior verified calculations.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </span>
                                <MessageWithHighlightedFigures text={r.message} unverifiedNumbers={rCheck?.unverifiedNumbers || []} />
                              </div>
                            );
                          })}
                        </div>
                      ) : (() => {
                        const teamCheck = m.text ? checkClaimsAgainstNumbers(m.text, trustedFactsSourceNumbers) : null;
                        return (
                        <div className="p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-slate-500">Team's Outcome</span>
                            {teamCheck?.hasUnverifiedClaims && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs gap-1 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 cursor-help">
                                    <AlertTriangle className="w-3 h-3" /> check figures
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[240px] p-3 bg-card border-orange-200 dark:border-orange-800 shadow-xl">
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {teamCheck.unverifiedNumbers.join(", ")} — not found in your Knowledge Base or prior verified calculations.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                          {m.text ? (
                            <MessageWithHighlightedFigures text={m.text} unverifiedNumbers={teamCheck?.unverifiedNumbers || []} className="whitespace-pre-wrap" />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                            </span>
                          )}
                        </div>
                        );
                      })()}
                      {m.status === "needs_input" && (
                        <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            <span className="font-bold">Needs your input: </span>{m.statusNote || "The team needs something from you before this is complete."}
                          </p>
                        </div>
                      )}
                      {m.proposedChanges && m.proposedChanges.length > 0 && (
                        m.changesApplied ? (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {m.proposedChanges.filter(c => c.approved).length} change(s) committed to the main discussion.
                            </p>
                            {isMostRecentCommit && (
                              <button onClick={undoLastTreeChange} className="text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2">
                                Undo
                              </button>
                            )}
                          </div>
                        ) : m.changesIgnored ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <X className="w-3 h-3 flex-shrink-0" /> Dismissed — Panel Discussion was not updated.
                          </p>
                        ) : (
                          <GatekeeperCard
                            changes={m.proposedChanges}
                            onToggle={(changeId) => toggleProposedChangeApproval(m.id, changeId)}
                            onApply={() => applyApprovedChanges(m.id)}
                            onIgnore={() => ignoreProposedChanges(m.id)}
                          />
                        )
                      )}
                      {m.suggestedCommentReason && (() => {
                        const suggestedNode = m.suggestedCommentNodeId
                          ? collaborativeRun?.decisionTree.find(n => n.id === m.suggestedCommentNodeId)
                          : undefined;
                        return (
                          <div className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/10 flex items-start gap-2">
                            <MessagesSquare className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">{m.suggestedCommentReason}</p>
                              {suggestedNode ? (
                                <button
                                  onClick={() => openAddCommentDialog(suggestedNode)}
                                  className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline underline-offset-2 mt-1"
                                >
                                  Add a comment on "{suggestedNode.label}" to bring this to the full team →
                                </button>
                              ) : (
                                <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">Add a comment on the relevant branch in the tree above to bring this to the full team.</p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {m.generatedFile ? (
                        <GeneratedFileCard file={m.generatedFile} />
                      ) : (
                        <CreateFileMenu
                          generatingKind={followUpFileGenerating?.id === m.id ? followUpFileGenerating.kind : null}
                          onSelect={(kind) => createFollowUpFile(m.id, kind, m.individualResponses && m.individualResponses.length > 0
                            ? m.individualResponses.map(r => `${r.agentName}: ${r.message}`).join("\n\n")
                            : m.text)}
                        />
                      )}
                    </div>
                  )
                  );
                })
              )}
              {followUpLoading && followUpMessages[followUpMessages.length - 1]?.role !== "team" && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-500 mr-6 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span role="status" aria-live="polite" className="text-xs font-medium">{collaborativePhase || COLLABORATIVE_LOADING_MESSAGES[loadingMessageIndex]}</span>
                  {callCount > 0 && (
                    <span className="text-xs normal-case font-normal tracking-normal">· {callCount} call{callCount === 1 ? "" : "s"}</span>
                  )}
                </div>
              )}
            </div>

            <div className="border-t dark:border-slate-800 flex-shrink-0">
              <p className="px-4 pt-2 text-xs text-slate-500">
                Talking to: <span className="font-semibold text-slate-500 dark:text-slate-400">{chatTargetMode === "everyone" ? "Everyone" : chatTargetMode === "team" ? "Team" : customTeam.find(a => a.id === chatTargetMode)?.name || "this agent"}</span>
              </p>
              {isCalculatorOpen && (
                <div className="mx-4 mb-2 flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-2">
                  <Calculator className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <Input
                    value={calculatorExpression}
                    onChange={(e) => setCalculatorExpression(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && calculatorResult?.ok) insertCalculationIntoChat(); }}
                    placeholder="e.g. (1250 - 900) / 900 * 100"
                    className="flex-1 h-7 text-xs border-none bg-transparent shadow-none focus-visible:ring-0 px-0 font-mono"
                    autoFocus
                  />
                  {calculatorResult && (
                    <span className={`text-xs font-mono flex-shrink-0 ${calculatorResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {calculatorResult.ok ? `= ${calculatorResult.formatted}` : calculatorResult.error}
                    </span>
                  )}
                  <Button size="sm" disabled={!calculatorResult?.ok} onClick={insertCalculationIntoChat} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                    Insert
                  </Button>
                </div>
              )}
              <div className="p-4 pt-1.5 flex gap-2">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      data-tour="calculator"
                      onClick={() => setIsCalculatorOpen(v => !v)}
                      variant={isCalculatorOpen ? "default" : "outline"}
                      size="icon"
                      className={`!h-9 !w-9 flex-shrink-0 rounded-lg ${isCalculatorOpen ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 dark:border-slate-800"}`}
                    >
                      <Calculator className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    Compute an exact figure with a real calculator instead of trusting an agent's own arithmetic.
                  </TooltipContent>
                </Tooltip>
                <Select value={chatTargetMode} onValueChange={setChatTargetMode}>
                  <SelectTrigger className="!h-9 text-xs w-[110px] flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {/* Explicit formatter — "team"/"everyone" aren't real agent ids, and a
                        genuine agent id has no inherent human-readable form without this
                        lookup, so Base UI's default (render the raw value) showed the id. */}
                    <SelectValue>{(val: string) => (val === "team" ? "Team" : val === "everyone" ? "Everyone" : customTeam.find(a => a.id === val)?.name || "this agent")}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team" className="text-xs">Team</SelectItem>
                    <SelectItem value="everyone" className="text-xs">Everyone</SelectItem>
                    {customTeam.map(a => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  ref={drawerComposerRef}
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendDrawerMessage()}
                  placeholder={
                    chatTargetMode === "everyone"
                      ? "Ask everyone individually..."
                      : chatTargetMode !== "team"
                        ? `Ask ${customTeam.find(a => a.id === chatTargetMode)?.name || "this agent"}...`
                        : chatDrawerPinnedNode
                          ? `Message the team about "${chatDrawerPinnedNode.nodeLabel}"...`
                          : "Message the team..."
                  }
                  className="flex-1 min-w-0 h-9 text-sm border-slate-200 dark:border-slate-800 bg-card rounded-lg"
                />
                <Button
                  onClick={sendDrawerMessage}
                  disabled={followUpLoading || !followUpInput.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 w-9 flex-shrink-0"
                >
                  {followUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mid-Discussion Question Dialog — the team pausing to ask the manager one genuinely
            blocking question before continuing to validate positions. */}
        <Dialog open={!!pendingMidQuestion} onOpenChange={(open) => { if (!open) answerMidDiscussionQuestion(""); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-teal-500" /> The Team Has a Question
              </DialogTitle>
            </DialogHeader>
            {pendingMidQuestion && (
              <div className="space-y-4">
                {(() => {
                  const asker = customTeam.find(a => a.id === pendingMidQuestion.askedBy);
                  return asker ? (
                    <p className="text-xs">
                      <span className={`font-bold ${getAgentColorClass(asker.id, customTeam)}`}>{asker.name}</span>
                      <span className="text-slate-500 dark:text-slate-400"> wants to know, before the team continues:</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Before the team continues validating positions:</p>
                  );
                })()}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pendingMidQuestion.question}</p>
                <div className="flex flex-wrap gap-2">
                  {pendingMidQuestion.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => answerMidDiscussionQuestion(option)}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={midQuestionCustomAnswer}
                    onChange={(e) => setMidQuestionCustomAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && midQuestionCustomAnswer.trim()) answerMidDiscussionQuestion(midQuestionCustomAnswer.trim()); }}
                    placeholder="Or type your own answer..."
                    className="h-9 text-xs flex-1 bg-card border-slate-200 dark:border-slate-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!midQuestionCustomAnswer.trim()}
                    onClick={() => answerMidDiscussionQuestion(midQuestionCustomAnswer.trim())}
                    className="h-9"
                  >
                    Submit
                  </Button>
                </div>
                <button
                  onClick={() => answerMidDiscussionQuestion("")}
                  className="text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-full text-center"
                >
                  Skip — let the team continue without answering
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Node Comments Dialog — view existing comments on this node (drafts, sent, and any
            replies) and add a further one, all in the same place. */}
        <Dialog open={!!addCommentTarget} onOpenChange={(open) => { if (!open) setAddCommentTarget(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MessageSquarePlus className="w-4 h-4 text-slate-500" /> Comments
              </DialogTitle>
              {addCommentTarget && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Branch: "{addCommentTarget.label}"</p>
              )}
            </DialogHeader>
            <div className="space-y-4">
              {(() => {
                const existingComments = addCommentTarget ? (collaborativeRun?.nodeComments || []).filter(c => c.nodeId === addCommentTarget.id) : [];
                if (existingComments.length === 0) return null;
                return (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                    {existingComments.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex-1 max-w-3xl">{c.text}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge variant="outline" className="text-xs font-mono capitalize">{c.status}</Badge>
                            {c.status === "draft" && (
                              <button onClick={() => deleteDraftComment(c.id)} className="text-slate-500 hover:text-red-500 w-5 h-5 flex items-center justify-center hit-target">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {c.reply && (
                          <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                            <MessageSquareText className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                              <span className="font-semibold">{c.replyAgentName}: </span>{c.reply}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="space-y-1.5">
                <Label htmlFor="add-comment-draft" className="text-xs font-medium text-slate-500">Add another comment</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {followUpLoading
                    ? "The team is currently reviewing a batch — you can add another comment once that finishes."
                    : "Saved as a draft — nothing is sent to the team until you submit this along with any other comments as a batch."}
                </p>
                <Textarea
                  id="add-comment-draft"
                  autoFocus
                  value={addCommentDraftText}
                  onChange={(e) => setAddCommentDraftText(e.target.value)}
                  placeholder="e.g. 'This assumes we have budget for X — we don't.'"
                  rows={4}
                  disabled={followUpLoading}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card resize-y min-h-[90px] focus-visible:ring-2 focus-visible:ring-slate-400 outline-none disabled:opacity-50"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddCommentTarget(null)} className="flex-1">Close</Button>
                <Button onClick={saveDraftComment} disabled={!addCommentDraftText.trim() || followUpLoading} className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white gap-1.5">
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Save Draft Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Undo toast for a deleted draft comment */}
        {deletedCommentUndo && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-xs">
            <span>Comment deleted.</span>
            <button onClick={undoDeleteComment} className="font-bold underline underline-offset-2">Undo</button>
          </div>
        )}

        {/* New Conversation Confirmation Dialog */}
        <Dialog open={isNewConversationDialogOpen} onOpenChange={setIsNewConversationDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MessageSquarePlus className="w-4 h-4 text-blue-500" /> Start New Conversation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                Would you like to keep using your current Team Agents ({customTeam.length} agent{customTeam.length === 1 ? "" : "s"}) and Knowledge Base ({knowledgeFiles.length} source{knowledgeFiles.length === 1 ? "" : "s"}) for this new conversation?
              </p>
              <div className="space-y-2">
                <Button
                  onClick={confirmKeepSetupForNewConversation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes, Keep Current Setup
                </Button>
                <Button
                  onClick={confirmFreshSetupForNewConversation}
                  variant="outline"
                  className="w-full border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> No, Start Completely Fresh
                </Button>
                <p className="text-xs text-slate-500 leading-relaxed">
                  "Start Completely Fresh" resets Team Agents to a single default agent and clears the Knowledge Base. Cleared sources are kept under "Recently deleted" in the Knowledge Base card, where they can be restored.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* My Teams — View Details Dialog */}
        <Dialog open={!!viewingTeamDetails} onOpenChange={(open) => { if (!open) setViewingTeamDetails(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Bookmark className="w-4 h-4 text-blue-500" /> {viewingTeamDetails?.name}
              </DialogTitle>
              {viewingTeamDetails && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {viewingTeamDetails.agents.length} agent{viewingTeamDetails.agents.length === 1 ? "" : "s"} · saved {new Date(viewingTeamDetails.createdAt).toLocaleDateString()}
                </p>
              )}
            </DialogHeader>
            {viewingTeamDetails && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {viewingTeamDetails.agents.map(agent => {
                    const modelName = (MODEL_OPTIONS[agent.provider] || []).find(m => m.id === agent.model)?.name || agent.model;
                    return (
                      <div key={agent.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${getAgentColorClass(agent.id, viewingTeamDetails.agents)}`}>{agent.name}</span>
                          <span className="font-mono text-[10px] lowercase text-faint-foreground">{agent.provider}</span>
                          <Badge variant="outline" className="text-xs font-mono">{modelName}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{agent.persona}</p>
                      </div>
                    );
                  })}
                </div>
                <Button
                  onClick={() => { const team = viewingTeamDetails; setViewingTeamDetails(null); if (team) useSavedTeam(team); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit This Team
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Save Team Dialog */}
        <Dialog open={isSaveTeamDialogOpen} onOpenChange={setIsSaveTeamDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Bookmark className="w-4 h-4 text-blue-500" /> Save Team
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="save-team-name" className="text-xs font-medium text-slate-500">Team Name</Label>
                <Input
                  id="save-team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTeamName.trim()) {
                      saveCurrentTeamAs(newTeamName);
                      setIsSaveTeamDialogOpen(false);
                    }
                  }}
                  placeholder="e.g. Product Strategy Panel"
                  className="h-9 text-sm"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Saves the current {customTeam.length} agent{customTeam.length === 1 ? "" : "s"} (personas, providers, and models) to My Teams.
                </p>
              </div>
              <Button
                onClick={() => { saveCurrentTeamAs(newTeamName); setIsSaveTeamDialogOpen(false); }}
                disabled={!newTeamName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Knowledge Set Dialog */}
        <Dialog open={isSaveKnowledgeSetDialogOpen} onOpenChange={setIsSaveKnowledgeSetDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="w-4 h-4 text-blue-500" /> Save Knowledge Base Setup
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="save-kbset-name" className="text-xs font-medium text-slate-500">Setup Name</Label>
                <Input
                  id="save-kbset-name"
                  value={newKnowledgeSetName}
                  onChange={(e) => setNewKnowledgeSetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newKnowledgeSetName.trim()) {
                      saveCurrentKnowledgeSetAs(newKnowledgeSetName);
                      setIsSaveKnowledgeSetDialogOpen(false);
                    }
                  }}
                  placeholder="e.g. Q3 Budget Sources"
                  className="h-9 text-sm"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Saves the current {knowledgeFiles.length} source{knowledgeFiles.length === 1 ? "" : "s"} to My Files — load it again in any future conversation without re-uploading.
                </p>
              </div>
              <Button
                onClick={() => { saveCurrentKnowledgeSetAs(newKnowledgeSetName); setIsSaveKnowledgeSetDialogOpen(false); }}
                disabled={!newKnowledgeSetName.trim() || knowledgeFiles.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* First-run coach-mark tour: a real spotlight, not a centered modal. The target
            element stays fully lit and un-dimmed (four separate dimming rectangles around
            its bounding box, rather than a full-screen overlay) with a ring drawn around
            it, and the callout card sits right next to it — above/below/beside chosen by
            available viewport space. Steps whose target isn't mounted yet (run-dependent
            features on a fresh session) fall back to a small corner card that says so
            honestly, rather than pointing at nothing. */}
        {isTourOpen && (() => {
          const step = TOUR_STEPS[tourStep];
          const rect = tourTargetRect;
          const PAD = 8;
          const CALLOUT_W = 320;
          // Shared callout body — same styling whether it's pinned next to a real element or
          // falling back to a corner card, so the tour reads as one consistent surface
          // rather than two different-looking experiences depending on the step.
          const calloutBody = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-faint-foreground">Step {tourStep + 1} of {TOUR_STEPS.length}</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{step.title}</h4>
                  </div>
                </div>
                <button onClick={closeTour} aria-label="Close tour" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step.body}</p>
              {renderTourFooter()}
            </>
          );
          if (!rect) {
            // No live anchor for this step — a small, clearly-labeled corner card, not a
            // full-screen takeover, since there's nothing on screen to spotlight yet.
            return (
              <div className={`fixed bottom-5 right-5 z-[100] w-[${CALLOUT_W}px] rounded-2xl border border-[color-mix(in_oklch,var(--primary)_22%,var(--border))] bg-card shadow-hero p-4 space-y-3`} style={{ width: CALLOUT_W }}>
                {calloutBody}
              </div>
            );
          }
          const spaceBelow = window.innerHeight - rect.bottom;
          const placeBelow = spaceBelow > 220 || spaceBelow > rect.top;
          const calloutTop = placeBelow ? rect.bottom + PAD : undefined;
          const calloutBottom = !placeBelow ? window.innerHeight - rect.top + PAD : undefined;
          const calloutLeft = Math.min(Math.max(rect.left, 12), window.innerWidth - CALLOUT_W - 12);
          return (
            <>
              {/* Dimming rectangles around the spotlighted element — top / bottom / left / right */}
              <div className="fixed inset-x-0 top-0 z-[99] bg-black/50" style={{ height: Math.max(rect.top - PAD, 0) }} />
              <div className="fixed inset-x-0 z-[99] bg-black/50" style={{ top: rect.bottom + PAD, bottom: 0 }} />
              <div className="fixed z-[99] bg-black/50" style={{ top: rect.top - PAD, height: rect.height + PAD * 2, left: 0, width: Math.max(rect.left - PAD, 0) }} />
              <div className="fixed z-[99] bg-black/50" style={{ top: rect.top - PAD, height: rect.height + PAD * 2, left: rect.right + PAD, right: 0 }} />
              {/* Spotlight ring around the real element, in the app's own primary colour */}
              <div
                className="fixed z-[100] rounded-lg ring-2 ring-primary pointer-events-none transition-all duration-300"
                style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: "0 0 0 4px color-mix(in oklch, var(--primary) 18%, transparent)" }}
              />
              <div
                className="fixed z-[100] rounded-2xl border border-[color-mix(in_oklch,var(--primary)_22%,var(--border))] bg-card shadow-hero p-4 space-y-3"
                style={{ top: calloutTop, bottom: calloutBottom, left: calloutLeft, width: CALLOUT_W }}
              >
                {calloutBody}
              </div>
            </>
          );
        })()}
        {/* "Go Deeper" session modal (scope expansion, not "Let's discuss this"). Blocking by
            deliberate choice — this is a focused intake, not a casual chat, and opening the
            Team Chat drawer for it was reported as confusing. Closing at any point discards
            the session with no side effects, since nothing is written until Approve. */}
        <Dialog open={!!activeGoDeeperSessionKey} onOpenChange={(open) => { if (!open && activeGoDeeperSession) pauseGoDeeperSession(activeGoDeeperSession.nodeId); }}>
          <DialogContent className="max-w-lg">
            {activeGoDeeperSession && (() => {
              const session = activeGoDeeperSession;
              const nodeId = session.nodeId;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Expand scope: {session.nodeLabel}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {session.ancestorLabels.length > 0 ? [...session.ancestorLabels, session.nodeLabel].join(" → ") : "Closing this pauses the session — reopen it from the node's menu to continue."}
                    </DialogDescription>
                  </DialogHeader>

                  {session.status === "choosing" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Who works on this?</p>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-card border border-slate-200 dark:border-slate-800 w-fit">
                          <button
                            onClick={() => updateGoDeeperSession(nodeId, { teamMode: "single" })}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${session.teamMode === "single" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                          >
                            Single agent
                          </button>
                          <button
                            onClick={() => updateGoDeeperSession(nodeId, { teamMode: "team" })}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${session.teamMode === "team" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                          >
                            Whole team
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {session.teamMode === "team"
                            ? "The whole team debates this branch first (a full multi-round discussion), then synthesis is grounded in that debate — considers more, tends to produce more/richer nodes. Slower and costs more."
                            : "One agent asks the questions and turns your answers into new nodes — fast and cheap, same as before."}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Where should this go?</p>
                      <button
                        onClick={() => chooseGoDeeperScope(nodeId, "same")}
                        className="w-full text-left flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        <GitBranch className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Continue in this conversation</span>
                          <span className="block text-xs text-muted-foreground">Adds new sub-decisions directly under this node in the current tree.</span>
                        </span>
                      </button>
                      <button
                        onClick={() => chooseGoDeeperScope(nodeId, "new")}
                        className="w-full text-left flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Start a new conversation</span>
                          <span className="block text-xs text-muted-foreground">Spins off a separate team session, seeded with this context — for scope that's grown past the original task.</span>
                        </span>
                      </button>
                    </div>
                  )}

                  {(session.status === "loading_next" || session.status === "synthesizing") && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {session.status === "synthesizing" ? (session.teamMode === "team" ? "The whole team is debating this branch..." : "Turning this into a plan...") : "Thinking of the next question..."}
                    </div>
                  )}

                  {session.status === "asking" && session.currentQuestion && (() => {
                    const asker = customTeam.find(a => a.id === session.currentQuestion!.askedBy);
                    const isOpener = session.currentQuestion.isOpener === true;
                    return (
                      <div className="space-y-3">
                        {session.qa.filter(x => !x.isOpener).length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {session.qa.filter(x => !x.isOpener).map((_, i) => <div key={i} className="h-1.5 w-6 rounded-full bg-indigo-200 dark:bg-indigo-900" />)}
                            <div className="h-1.5 w-6 rounded-full bg-indigo-600" />
                          </div>
                        )}
                        {asker && (
                          <p className="text-xs flex items-center gap-1">
                            <AgentChip agentId={asker.id} name={asker.name} team={customTeam} />
                            <span className="text-slate-500 dark:text-slate-400">wants to know:</span>
                          </p>
                        )}
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{session.currentQuestion.question}</p>
                        {session.currentQuestion.options.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {session.currentQuestion.options.map((option, i) => (
                              <button
                                key={i}
                                onClick={() => answerGoDeeperQuestion(nodeId, option)}
                                className="px-3 py-2 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 bg-card text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={goDeeperCustomAnswer}
                            onChange={(e) => setGoDeeperCustomAnswer(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && goDeeperCustomAnswer.trim()) answerGoDeeperQuestion(nodeId, goDeeperCustomAnswer.trim()); }}
                            placeholder={isOpener ? "Optional — e.g. a budget ceiling, a vendor to avoid..." : "Or type your own answer..."}
                            className="h-9 text-xs flex-1 bg-card border-slate-200 dark:border-slate-800"
                          />
                          {isOpener ? (
                            <Button size="sm" variant="outline" onClick={() => answerGoDeeperQuestion(nodeId, goDeeperCustomAnswer.trim())} className="h-9">
                              {goDeeperCustomAnswer.trim() ? "Submit" : "Skip"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!goDeeperCustomAnswer.trim()}
                              onClick={() => answerGoDeeperQuestion(nodeId, goDeeperCustomAnswer.trim())}
                              className="h-9"
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                        {isOpener && <p className="text-xs text-slate-400 dark:text-slate-500">You can list more than one thing here — the team will work through each of them, not just the first.</p>}
                        <div className="flex items-center justify-between pt-1">
                          <Button variant="ghost" size="sm" onClick={() => discardGoDeeperSession(nodeId)} className="text-xs text-slate-500 h-7 px-2">
                            Discard session
                          </Button>
                          {session.qa.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => synthesizeGoDeeperSession(nodeId)} className="h-7 text-xs px-2.5">
                              I've told them enough — finish here
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dedicated error state — previously failures were parked in "asking" with
                      no currentQuestion, which renders no body at all: the error text, retry
                      path and every button lived inside an unreachable block. */}
                  {session.status === "error" && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{session.error || "Something went wrong."} Your {session.qa.length} answer{session.qa.length === 1 ? "" : "s"} so far {session.qa.length === 1 ? "is" : "are"} safe.</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={() => discardGoDeeperSession(nodeId)} className="text-xs text-slate-500 h-8 px-2.5">
                          Discard session
                        </Button>
                        <div className="flex items-center gap-2">
                          {session.errorPhase === "question" && session.qa.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => synthesizeGoDeeperSession(nodeId)} className="h-8 text-xs px-2.5">
                              Finish with what I've said
                            </Button>
                          )}
                          <Button size="sm" onClick={() => (session.errorPhase === "synthesis" ? synthesizeGoDeeperSession(nodeId) : fetchNextGoDeeperQuestion(nodeId))} className="h-8 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" /> Try again
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {session.status === "pending_approval" && (
                    <GoDeeperApprovalPreview
                      session={session}
                      onApprove={(nodes, applyProbabilityChange) => approveGoDeeperSession(nodeId, nodes, applyProbabilityChange)}
                      onDiscard={() => discardGoDeeperSession(nodeId)}
                    />
                  )}
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Scoping conversation viewer — read-only transcript of the Expand-scope Q&A that
            produced this node, including every multiple-choice option the manager was
            offered but didn't pick. Independent of any live session; available on any
            grafted node at any time via the node menu. */}
        <Dialog open={!!viewingScopingQANode} onOpenChange={(open) => { if (!open) setViewingScopingQANode(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-indigo-500" /> Scoping conversation
              </DialogTitle>
              <DialogDescription className="text-xs">For "{viewingScopingQANode?.label}"</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {viewingScopingQANode?.scopingSummary && (
                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10">
                  <p className="text-[10px] uppercase tracking-wide text-blue-500 dark:text-blue-400 font-semibold mb-1">Summary</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{viewingScopingQANode.scopingSummary}</p>
                  {viewingScopingQANode.isFromKnowledgeBase && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 pt-1.5 border-t border-blue-200/50 dark:border-blue-900/50">Grounded in your uploaded knowledge base.</p>
                  )}
                  {viewingScopingQANode.isGeneralKnowledgeContent && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 pt-1.5 border-t border-blue-200/50 dark:border-blue-900/50">Based on general knowledge — not verified against your documents.</p>
                  )}
                </div>
              )}
              {viewingScopingQANode?.scopingQA?.map((qa, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {qa.isOpener ? "Manager's note" : qa.question}
                  </p>
                  {!qa.isOpener && <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Asked by {qa.askedBy}</p>}
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{qa.answer || "(skipped)"}</p>
                  {qa.options && qa.options.filter(o => o !== qa.answer).length > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Also considered: {qa.options.filter(o => o !== qa.answer).join(", ")}
                    </p>
                  )}
                </div>
              ))}
              {(!viewingScopingQANode?.scopingQA || viewingScopingQANode.scopingQA.length === 0) && (
                <p className="text-xs text-slate-500 py-2">No scoping conversation recorded for this node.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Merge/Replace confirmation for loading a saved Knowledge Base set — previously
            this silently merged with no warning, and the user had to notice the mixing
            after the fact. */}
        <Dialog open={!!pendingKnowledgeSetLoad} onOpenChange={(open) => { if (!open) setPendingKnowledgeSetLoad(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Load "{pendingKnowledgeSetLoad?.name}"?</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                You have {knowledgeFiles.length} source{knowledgeFiles.length === 1 ? "" : "s"} already loaded. Add this set's {pendingKnowledgeSetLoad?.files.length} source{(pendingKnowledgeSetLoad?.files.length || 0) === 1 ? "" : "s"} alongside them, or clear the current ones first?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { if (pendingKnowledgeSetLoad) useSavedKnowledgeSet(pendingKnowledgeSetLoad, "merge"); setPendingKnowledgeSetLoad(null); }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Merge with current sources
              </Button>
              <Button
                variant="outline"
                onClick={() => { if (pendingKnowledgeSetLoad) useSavedKnowledgeSet(pendingKnowledgeSetLoad, "replace"); setPendingKnowledgeSetLoad(null); }}
                className="gap-1.5 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear current sources first
              </Button>
              <Button variant="ghost" onClick={() => setPendingKnowledgeSetLoad(null)} className="text-slate-500">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Preset Dialog */}
        <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-blue-500" /> Save as Preset
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="save-preset-name" className="text-xs font-medium text-slate-500">Preset Name</Label>
                <Input
                  id="save-preset-name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPresetName.trim()) {
                      saveCurrentPresetAs(newPresetName);
                      setIsSavePresetDialogOpen(false);
                    }
                  }}
                  placeholder="e.g. Trust Distribution Clients"
                  className="h-9 text-sm"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Saves the current {customTeam.length} agent{customTeam.length === 1 ? "" : "s"} and {knowledgeFiles.length} source{knowledgeFiles.length === 1 ? "" : "s"} together — apply both in one action for a future conversation.
                </p>
              </div>
              <Button
                onClick={() => { saveCurrentPresetAs(newPresetName); setIsSavePresetDialogOpen(false); }}
                disabled={!newPresetName.trim() || customTeam.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Save Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document preview — only extracted text (or, for images, the actual data URL) is
            retained, never the original binary, so this is a preview rather than a download
            of a file that no longer exists in its original form. */}
        <Dialog open={!!previewingKnowledgeFile} onOpenChange={(open) => { if (!open) setPreviewingKnowledgeFile(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-sm truncate">{previewingKnowledgeFile?.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {previewingKnowledgeFile && `${formatBytes(previewingKnowledgeFile.size)} · ${previewingKnowledgeFile.sourceType}`}
              </DialogDescription>
            </DialogHeader>
            {previewingKnowledgeFile?.sourceType === "image" ? (
              <img src={previewingKnowledgeFile.content} alt={previewingKnowledgeFile.name} className="max-w-full rounded-lg border border-slate-200 dark:border-slate-800" />
            ) : (
              <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-surface-2 p-4 rounded-lg">{previewingKnowledgeFile?.content || "(No extracted content available.)"}</pre>
            )}
          </DialogContent>
        </Dialog>

        {/* Share dialog: read-only by explicit design — see the SharedRunSnapshot type
            comment for why commenting isn't part of this. */}
        <Dialog open={!!shareDialogRun} onOpenChange={(open) => { if (!open) { setShareDialogRun(null); setNewShareUrl(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Share2 className="w-4 h-4 text-blue-500" /> Share This Decision
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                A read-only, point-in-time snapshot — viewable with no sign-in required.
              </DialogDescription>
            </DialogHeader>

            {/* Itemized inclusion list, replacing prose-only description — several users
                specifically wanted to know exactly what is and isn't in a shared link
                before trusting it with anything confidential. */}
            <div className="p-3 rounded-lg bg-surface-2 space-y-1">
              <p className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Check className="w-3 h-3 flex-shrink-0" /> Outcome, reasoning, decision tree, minority views</p>
              <p className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Check className="w-3 h-3 flex-shrink-0" /> Whether this was grounded in sources or verified calculations</p>
              <p className="text-xs flex items-center gap-1.5 text-slate-400"><X className="w-3 h-3 flex-shrink-0" /> Your Knowledge Base content and Team Chat conversation</p>
              <p className="text-xs flex items-center gap-1.5 text-slate-400"><X className="w-3 h-3 flex-shrink-0" /> Live updates — it won't reflect later changes, and comments aren't supported</p>
            </div>

            {newShareUrl ? (
              <div className="flex items-center gap-2">
                <Input readOnly value={newShareUrl} className="h-9 text-xs font-mono" onFocus={(e) => e.target.select()} />
                <Button
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(newShareUrl); logDebug("info", "Share link copied"); }}
                  className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Link expires after</p>
                <div className="flex gap-1.5 flex-wrap">
                  {SHARE_EXPIRY_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setShareExpiryChoice(opt.days)}
                      aria-pressed={shareExpiryChoice === opt.days}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${shareExpiryChoice === opt.days ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  disabled={isSharingRun}
                  onClick={async () => { if (shareDialogRun) { const url = await shareRun(shareDialogRun, shareExpiryChoice); if (url) setNewShareUrl(url); } }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {isSharingRun ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Create Link
                </Button>
              </div>
            )}

            {/* Manage past links: previously each share was an untracked, unmanageable
                one-off with no way to revoke a link once created. */}
            {shareDialogRun?.sharedTokens && shareDialogRun.sharedTokens.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500">Links created for this decision</p>
                {shareDialogRun.sharedTokens.map(token => {
                  const url = `${window.location.origin}${window.location.pathname}?shared=${token}`;
                  return (
                    <div key={token} className="flex items-center gap-2 p-2 rounded-md bg-surface-2">
                      <span className="text-xs font-mono truncate flex-1 text-slate-500">{token}</span>
                      <button onClick={() => { navigator.clipboard.writeText(url); logDebug("info", "Share link copied"); }} className="text-slate-400 hover:text-blue-500 flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => revokeShareLink(token)} className="text-xs text-red-500 hover:underline flex-shrink-0">
                        Revoke
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Compare Runs (Phase 3 roadmap item #2): built on the same versioned data shape
            as the JSON export, so this is a view over existing structured data rather than
            a new discussion-engine capability. Deliberately no tree-diffing — root axis
            labels are listed per run rather than force-matched, since two independently
            generated trees have no shared node ids and a naive label-similarity match would
            confidently produce wrong pairings. */}
        <Dialog open={isCompareRunsOpen} onOpenChange={setIsCompareRunsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2"><GitCompareArrows className="w-4 h-4" /> Compare Decisions</DialogTitle>
            </DialogHeader>
            {(() => {
              if (selectedRunIdsForCompare.length !== 2) return null;
              const runA = collaborativeHistory.find(r => r.id === selectedRunIdsForCompare[0]);
              const runB = collaborativeHistory.find(r => r.id === selectedRunIdsForCompare[1]);
              if (!runA || !runB) return <p className="text-xs text-slate-500">One of the selected decisions could no longer be found.</p>;
              const cmp = compareRuns(runToCompareInput(runA), runToCompareInput(runB));
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[runA, runB].map((run, idx) => {
                      const grounded = idx === 0 ? cmp.groundedSourceCountA : cmp.groundedSourceCountB;
                      const verified = idx === 0 ? cmp.hadVerifiedCalculationsA : cmp.hadVerifiedCalculationsB;
                      return (
                        <div key={run.id} className="p-3 rounded-lg bg-surface-2 space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground">{idx === 0 ? "A" : "B"} · {new Date(run.startedAt || Date.now()).toLocaleDateString()}</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{run.prompt}</p>
                          {/* Grounding asymmetry between compared runs (Phase 4 roadmap #1) —
                              comparing a grounded run against an ungrounded one side by side
                              without flagging that difference risks it going unnoticed exactly
                              where it matters most. */}
                          <div className="flex items-center gap-1 pt-0.5">
                            {grounded > 0 ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <ShieldAlert className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-xs text-slate-500">
                              {grounded > 0 ? `${grounded} source${grounded === 1 ? "" : "s"}${verified ? " + calcs" : ""}` : "Ungrounded"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold tracking-normal text-muted-foreground flex items-center gap-1.5">
                      Outcome
                      <Badge variant="outline" className={`text-xs ${cmp.outcomesMatch ? "border-emerald-300 text-emerald-600" : "border-amber-300 text-amber-600"}`}>
                        {cmp.outcomesMatch ? "identical" : "different"}
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/15">{runA.outcome}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/15">{runB.outcome}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold tracking-normal text-muted-foreground">Root decision axes</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <ul className="space-y-1">{cmp.rootAxesA.map((a, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {a}</li>)}</ul>
                      <ul className="space-y-1">{cmp.rootAxesB.map((a, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {a}</li>)}</ul>
                    </div>
                  </div>

                  {(cmp.reasonsOnlyInA.length > 0 || cmp.reasonsOnlyInB.length > 0 || cmp.reasonsInBoth.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold tracking-normal text-muted-foreground">Reasons</h4>
                      {cmp.reasonsInBoth.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-2">
                          <span className="text-xs font-medium text-slate-500">In both</span>
                          <ul className="mt-1 space-y-1">{cmp.reasonsInBoth.map((r, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {r}</li>)}</ul>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2.5 rounded-lg border-l-2 border-l-blue-400 bg-surface-2">
                          <span className="text-xs font-medium text-slate-500">Only in A</span>
                          <ul className="mt-1 space-y-1">{cmp.reasonsOnlyInA.map((r, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {r}</li>)}</ul>
                        </div>
                        <div className="p-2.5 rounded-lg border-l-2 border-l-violet-400 bg-surface-2">
                          <span className="text-xs font-medium text-slate-500">Only in B</span>
                          <ul className="mt-1 space-y-1">{cmp.reasonsOnlyInB.map((r, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {r}</li>)}</ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {(cmp.considerationTextsOnlyInA.length > 0 || cmp.considerationTextsOnlyInB.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold tracking-normal text-muted-foreground">Considerations raised in only one run</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <ul className="space-y-1">{cmp.considerationTextsOnlyInA.map((c, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {c}</li>)}</ul>
                        <ul className="space-y-1">{cmp.considerationTextsOnlyInB.map((c, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-300">• {c}</li>)}</ul>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-xs text-slate-500">Minority views: {cmp.dissentCountA}</span>
                    <span className="text-xs text-slate-500">Minority views: {cmp.dissentCountB}</span>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Team setup gate: starting a real discussion with only the untouched default
            assistant is very likely an oversight, not a deliberate choice — this offers a
            way out before spending API calls on what's effectively a one-person "team",
            without ever blocking the user who genuinely wants to proceed that way. */}
        <Dialog open={isTeamSetupGateOpen} onOpenChange={setIsTeamSetupGateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Set up your team first?</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                You're about to start a discussion with only the default assistant. A team with a few specialized agents tends to give a more thoroughly reasoned outcome — but you can continue as-is if that's what you want.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-1">
              <Button onClick={chooseSuggestTeamFromGate} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Sparkles className="w-4 h-4" /> Suggest a team based on my task
              </Button>
              <Button onClick={chooseManualSetupFromGate} variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" /> Let me set up a team manually
              </Button>
              <Button onClick={() => { setIsTeamSetupGateOpen(false); proceedWithDiscussion(); }} variant="ghost" className="w-full justify-start gap-2 text-slate-500 dark:text-slate-400">
                <ArrowRight className="w-4 h-4" /> Continue anyway
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pre-flight discovery: three one-tap questions before a manual file generation.
            Every chip row arrives PRESELECTED from the last-used answers — the common case
            is confirm-and-generate in one click, not an interrogation. Skip always works. */}
        <Dialog open={!!filePreflight} onOpenChange={(open) => { if (!open) setFilePreflight(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Shape this {filePreflight?.kind === "pptx" ? "deck" : filePreflight?.kind === "xlsx" ? "spreadsheet" : "document"}</DialogTitle>
              <DialogDescription className="text-xs">Three quick answers — or skip and take the defaults.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {([
                { label: "Who is it for?", value: preflightAudience, set: setPreflightAudience, options: ["Executives", "Working team", "External client"] },
                { label: "What should it do?", value: preflightPurpose, set: setPreflightPurpose, options: ["Decide", "Inform", "Record"] },
                { label: "How much depth?", value: preflightSize, set: setPreflightSize, options: ["One-pager", "Standard", "Comprehensive"] }
              ] as const).map(q => (
                <div key={q.label} className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500">{q.label}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => q.set(opt)}
                        aria-pressed={q.value === opt}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${q.value === opt ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => generateWithPreflight(true)} className="flex-1 h-8 text-xs">
                  Skip — just generate
                </Button>
                <Button size="sm" onClick={() => generateWithPreflight(false)} className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating workspace panel trigger — the left-edge mirror of the Team Chat tab.
            Only rendered while the panel is closed; closing lives on the panel's own edge. */}
        {(activeTab === "custom" || activeTab === "product") && !isLeftPanelOpen && (
          <button
            onClick={() => setIsLeftPanelOpen(true)}
            aria-label="Open workspace panel"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 pl-3 pr-3 py-3 rounded-r-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
          >
            <span className="relative">
              <PanelLeftOpen className="w-4 h-4" />
              {knowledgeFiles.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-blue-600 text-[10px] font-bold flex items-center justify-center">
                  {knowledgeFiles.length}
                </span>
              )}
            </span>
          </button>
        )}

        {/* Floating Team Chat trigger — previously the drawer was only reachable via "Let's
            discuss this" or the post-run jump-nav, with no way to open it proactively before
            (or independent of) either of those. Only rendered while closed; the close action
            now lives on the drawer's own left edge instead of toggling this same element. */}
        {(activeTab === "custom" || activeTab === "product") && customTeam.length > 0 && !isChatDrawerOpen && (
          <button
            onClick={() => openChatDrawer()}
            aria-label="Open Team Chat"
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 pl-3 pr-3 py-3 rounded-l-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
          >
            <span className="relative">
              <MessageSquare className="w-4 h-4" />
              {/* Previously this counted ALL messages ever exchanged — a number that only
                  ever grew and never reflected whether anything actually needed attention,
                  which is why it stayed nonzero even after everything was read and approved.
                  Now it counts messages with proposed changes still awaiting a decision —
                  the one thing in this drawer that's genuinely "pending". */}
              {(() => {
                const pendingCount = followUpMessages.filter(m => m.proposedChanges && m.proposedChanges.length > 0 && !m.changesApplied).length;
                return pendingCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center" aria-label={`${pendingCount} change${pendingCount === 1 ? "" : "s"} awaiting your review`}>
                    {pendingCount}
                  </span>
                ) : null;
              })()}
            </span>
          </button>
        )}

        {/* Debug Panel */}
        <DebugPanel debugLogs={debugLogs} setDebugLogs={setDebugLogs} />
      </div>
    </div>
    </TooltipProvider>
  );
}
