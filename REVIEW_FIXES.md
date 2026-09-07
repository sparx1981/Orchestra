# Orchestra v43 — architectural review fixes applied

Baseline before any change: tsc clean, 205/205 tests, production build passing.
After all changes: tsc clean, 234/234 tests (29 new), production build passing.
Every change is behaviour-preserving per the review's own risk checks — no feature,
prompt text, dialog copy, or user-visible flow was altered.

## Issue 1 — Everything in one file (partially applied, biggest seam done)
- The entire decision-tree component family moved out of App.tsx into
  `src/components/tree/DecisionTree.tsx`: DecisionTreeSection, DecisionTreeNode, FlowNode,
  NodeActionsMenu, CommentBadgeIcon, ProbabilityBar, subtreeContainsSelected,
  PausedGoDeeperContext, and SIMPLE_TREE_MAX_LEVELS. Markup, memoisation, and hook order
  are verbatim; only the module boundary is new.
- CountTag moved to `src/components/CountTag.tsx` (shared by the tree module and App).
- Comment-badge derivation moved to `src/lib/commentBadges.ts` using a structural
  NodeCommentLike type (same pattern as gatekeeperMerge's DecisionNodeLike), so the tree
  module has zero import dependency on App.tsx.
- App.tsx: 13,451 → 12,617 lines. Further module splits (dialogs, knowledge sources,
  history) remain available along the same pattern.

## Issue 2 — Flat state (applied where provably safe)
- isPromotingNode / isMovingNode / isRevising — three booleans that were mutually
  exclusive only by discipline — are now one `nodeOpInFlight: "promote" | "move" |
  "revise" | null`. Two spinners at once is now structurally impossible. Existing names
  are kept as derived consts so every consumer reads identically.
- The wider 180-hook consolidation (run status object, dialog-payload union) is deferred:
  merging the four node dialogs into one union would technically change stacking behaviour
  in corner cases, and the run-status grouping reaches deep into the engine. Both are
  better done as their own pass with manual QA, not bundled into this one.

## Issue 3 — Prop drilling (applied)
- New `TreeNodeActions` (7 handlers) and `TreeDragHandlers` (6 drag props) bundles in the
  tree module. Section → TreeNode/FlowNode → NodeActionsMenu now pass one `actions` object
  (plus `drag` in Flow view) instead of forwarding up to 13 individual props per level.
  Adding a tree action now touches the interface and the menu, nothing in between.
- Each component destructures the bundle at the top, so bodies are textually unchanged.

## Issue 4 — 700-line engine function (partially applied)
- Promote and Move were two near-identical ~50-line copies of the same "single facilitator
  call, full tree in and out" procedure; they now share `restructureTreeViaFacilitator`,
  parameterised only by what genuinely differed (instruction, labels, busy flag).
- The decomposition phase's pure core (instruction builder, response normaliser, axes-block
  builder) extracted to `src/lib/decomposition.ts` with the DecisionAxis/TaskType types,
  and unit tested. The engine keeps the sequencing and failure fallback exactly as before.
- The remaining phase-by-phase split of runCollaborativeSession (position round, validation
  loop, synthesis) is deferred — those phases share ~30 closure variables and deserve a
  dedicated pass with manual run-through, per the review's own caution.

## Issue 5 — Untyped model responses (applied at the highest-risk boundaries)
- New `src/lib/modelResponses.ts`: validateTreeRestructureResponse (Promote/Move — now also
  rejects trees whose nodes lack usable id/label, naming the exact position, instead of
  rendering incorrectly downstream), validateSectionRevisionResponse and
  validateNodeRevisionResponse (Revise — encode the exact per-field fallbacks the inline
  code had, so the success path is untouched).
- Decomposition responses validated via normalizeDecompositionResponse (Issue 4 above).
- Remaining parse sites (synthesis, status check, Go Deeper already has its own validators
  in src/lib/goDeeper.ts) can adopt the same pattern incrementally.

## Issue 6 — No tests on core logic (applied for everything extracted)
- 29 new tests: modelResponses (12), commentBadges (6), decomposition (11) — including
  regression tests proving the validators preserve the previous fallback semantics.
  205 → 234 passing.

## Issue 7 — API keys client-side (investigated; no change, by design)
The review flagged this as "investigate rather than prescribe", pending server visibility.
Investigated: server.ts already implements the mitigation's substance — keys are encrypted
server-side (AES-256-GCM) before Firestore storage, the client holds and transmits
ciphertext (`enc:v1:…`) once saved, and decryption happens just-in-time per provider call.
The remaining plaintext window is only between typing a key and the encrypt round-trip.
Resolving keys purely by user identity server-side would require the relay to gain
Firestore access and auth verification — a deployment-contract change, out of scope for a
behaviour-preserving pass. Ensure KEYS_ENCRYPTION_SECRET is set in production; the app
already surfaces a warning banner when it isn't.

## Issue 8 — Hand-rolled duplicate dialogs (applied)
- New `src/components/ConfirmActionDialog.tsx` — one parameterised confirmation dialog
  (icon+title header, optional description, body, Cancel/Confirm row) with a
  layout-preserving body wrapper.
- Force/Promote, Move (including its alternatives-warning banner), Revise-request, and
  Revision-preview dialogs all use it; rendered output is unchanged per dialog.
- The Answer-the-Team's-Question dialog and the save dialogs are candidates for the same
  treatment in a follow-up.
