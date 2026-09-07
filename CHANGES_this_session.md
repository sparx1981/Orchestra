# Three feature changes — Save Preset cascade, live discussion view, Chat History checkpointing

Not run through tsc/tests here (no local build environment) — run your usual `tsc --noEmit`
and test suite before deploying. A syntax-only parse (esbuild) was run against App.tsx and
passed; this catches brace/JSX mismatches but not type errors.

## 1. Save Preset now also saves to My Teams and My Files
`saveCurrentPresetAs` (src/App.tsx) previously only wrote to the `presets` collection.
It now also calls `saveCurrentTeamAs(name)` and `saveCurrentKnowledgeSetAs(name)` with the
same name, so a single "Save Preset" populates all three libraries. KB save already no-ops
when there are no Knowledge Base files loaded, so this is safe for a preset with none.

## 2. Live discussion view replaces the raise-hand input
The always-visible "raise-hand" Input shown during `collaborativeLoading` is replaced with:
- A collapsed link — "Watch the conversation live" (with an entry-count badge) — and an
  "End early" button (reuses the existing `runAbortRef.current?.abort()` Stop mechanism).
- Expanding it shows the transcript arriving in real time (new `liveTranscript` state,
  mirrored by `checkpointRun` — see #3 — at each phase boundary: position round done, each
  validation round, each focused exchange, dangling questions answered). Auto-scrolls as
  entries arrive.
- The original "note to the team" input isn't removed, just demoted to inside the expanded
  panel, since it's still occasionally useful once someone's actually watching.

Granularity note: transcript entries update per PHASE (each round, each exchange), not per
individual agent call — see the implementation note in code for why per-call streaming
wasn't pursued here (it would need hoisting several variables out of the try block).

## 3. Chat History checkpointing — no more silently-lost conversations
Previously a collaborative run only got an id — and was only ever saved — once it reached
the very end of the function, on success. Anything that died before then (provider outage,
closed tab, crashed extension) left no trace in Chat History at all.

Now:
- A run id (`runId`) and start timestamp are generated the instant Start Discussion is
  clicked, and an initial checkpoint (status `"in_progress"`) is saved to Chat History
  immediately — before any agent has been called.
- `checkpointRun()` re-saves the same document (same `runId`) at each phase boundary as the
  discussion progresses, so a Chat History entry always reflects how far the discussion
  actually got.
- If the run fails or is stopped, the outer catch block re-saves the same document one last
  time with status `"failed"` and the error/stop reason, using whatever was last
  checkpointed (`checkpointRunRef`) — no need to reach the end for something to be saved.
- On success, the same document is updated to `"delivered"`/`"needs_input"` as before —
  it's the same Firestore doc throughout a run's life, not four separate ones.
- `RunStatus` gained `"in_progress"` and `"failed"` alongside the existing `"delivered"` /
  `"needs_input"`. Every existing check in the codebase only ever tests
  `=== "needs_input"`, so both new values fall through to the same render path already used
  for `"delivered"` — nothing else needed updating for it not to crash. A small badge was
  added next to Chat History list entries for `"in_progress"` (spinner) and `"failed"`
  ("Didn't complete") so partial runs are visually distinguishable from completed ones.

### Save points, end to end
1. **Start Discussion clicked** → initial `"in_progress"` save (empty transcript).
2. **Position round complete** → checkpoint (transcript so far).
3. **Each focused exchange completes** (hot-seat) → checkpoint.
4. **Each validation round completes** → checkpoint.
5. **Dangling questions answered** (pre-synthesis) → checkpoint.
6. **Synthesis completes successfully** → final save, status `"delivered"` or
   `"needs_input"`.
7. **Stopped by user, or an unrecoverable error** → final save, status `"failed"`, using
   whichever of steps 1–5 was most recent.

## 4. Checkpoint-on-start extended to Team Chat, Considerations, and Knowledge Base drift
Follow-up from #3 above, after checking which other actions route through `evaluateProposedChanges`/`evaluateKnowledgeBaseDrift` rather than `runCollaborativeSession` (and are therefore NOT covered by the checkpointing in #3):

- **`flushChatToRun`** now takes an optional explicit messages array
  (`flushChatToRun(explicitMessages?: FollowUpMessage[])`), so a caller can flush the array
  it just computed instead of reading the stale `followUpMessages` closure synchronously
  after a `setFollowUpMessages` call (React state updates aren't synchronous, so the old
  no-arg call would have flushed the array from BEFORE the new message).
- **`sendFollowUp`** and **`sendQuickResponse`** (Team Chat) now flush the user's question to
  Firestore immediately, before the mini-round of agent calls starts — previously the
  question itself (not just the answer) could be lost if the browser died mid-round, since
  the only flush was on `followUpLoading` going back to `false` at the very end.
- **`askTeamToReconsiderConsiderations`** (Considerations → "Ask Team to Reconsider") was the
  worse case: its own loading flag (`isAskingTeamToReconsider`) never drove the automatic
  flush effect at all, so even a *successful* exchange only got saved whenever something
  unrelated happened to trigger a flush later. It now: (a) adds a visible "user" message
  representing the ask itself, which didn't previously exist as a chat bubble; (b) flushes
  that immediately; (c) explicitly saves on both success and failure. `submitConsiderationResponses`
  now returns the run it just saved, and this function uses that return value (`runAfterSubmit`)
  as the base for every subsequent save instead of the `collaborativeRun` closure — that
  closure is stale at this point in the same synchronous call (`setCollaborativeRun` hasn't
  committed yet), so spreading it directly would have silently reverted the considerations
  update the moment this function's own saves landed.
- **`checkAgainstNewKnowledgeSources`** (Knowledge Base staleness banner) had the same
  "own loading flag, no auto-flush" problem as Considerations. Same fix: flush the initial
  ask immediately, and combine the groundedSourceIds refresh + final chat message into ONE
  save on success — previously that save spread the stale `collaborativeRun` closure and
  would have silently reverted chatMessages back to its pre-ask value the moment the check
  succeeded, wiping out the just-flushed ask message from Firestore (though it stayed
  visible in local state, so the bug wouldn't have been obvious until a reload).

## 5. Richer debug logging + concurrency capping on agent calls, and why v36 didn't see this

**Debug logging** — three changes to make a failed/slow run diagnosable from the debug panel
alone, without needing to reproduce it live:
- `callAgent` now captures the model (`provider/model`, not just provider), prompt size in
  characters, and a running elapsed-time clock once per call, and threads them through every
  log line it emits: the retry warnings, the final permanent-failure line ("X permanently
  failed after N attempt(s) — Ys total, N prompt chars, last error: ..."), and — new — a
  quiet recovery line if a call only succeeded because of a retry (previously a
  recovered call left no trace at all).
- `settleRound` now times the whole round and, on any failures (not just total failure),
  logs one combined summary line: every failed agent, its provider, its reason, and how long
  the round ran before giving up. Previously only a total-failure gave any round-level
  summary; a round that succeeded with, say, 4 of 6 agents left no record of who or why.
- The discussion-start log now includes the full team roster with each agent's actual
  provider/model (a 503 on one provider means something different from one on another),
  Knowledge Base source count and total character count attached, and full prompt length —
  previously this only logged team size and a 200-character prompt snippet.

**Concurrency capping** — this is the "break large teams into smaller parts" change, though
it's a different mechanism than literally splitting one discussion into two: previously every
call site (`position round`, `validation round`, `outline discussion`, `outline refinement`,
`Team Chat`, `Parallel mode`) fired every agent's call at the exact same instant via
`Array.map`. A 6-agent round meant 6 simultaneous requests hitting the provider together —
which is exactly the shape that trips demand-shedding/rate-limiting fastest, on top of simply
being more requests to lose if a spike is already underway.

Added `mapWithConcurrency`, a drop-in replacement for `items.map(async (item) => ...)` that
still returns one Promise per item in original order (so `settleRound` and every other
downstream consumer needed no changes) but caps how many of the underlying calls are actually
in flight at once — `AGENT_CALL_CONCURRENCY = 3`. All 6 call sites now go through it. A round
of 6 agents now sends its first 3 calls immediately and the next 3 as those finish, rather
than all 6 at once — same total work, same results, less instantaneous burst load.

**What this does NOT do**: it doesn't split one large discussion (e.g. 20 decision axes) into
two smaller sequential discussions — that's a bigger, more invasive change (would need its own
manager-facing UI to review/approve each part, and a way to merge two partial decision trees
back together) and felt like it deserved its own conversation rather than being bundled into
this fix. Happy to scope that out separately if you want it.

**Why v36 didn't have this problem**: checked, rather than guessed. v36's architecture is
essentially identical to current — same concurrent-call pattern (nothing capped concurrency
before this change, including in v36), same decision-axes/Team Planner system, same Gemini
model string (`gemini-3-flash-preview` in both). If anything, v36's retry logic was *weaker*
than current's: a flat 3 attempts for every kind of failure, no distinction for provider
"high demand" 503s at all (that overload-specific 5-attempt schedule was added THIS session,
on top of v36's baseline). So there's no code regression to point to — the honest answer is
that `gemini-3-flash-preview` is a preview-tier model, which is exactly the tier most exposed
to real-world demand fluctuation, and the sessions where v36 "just worked" most likely
coincided with lower demand on Google's side at that moment, not a difference in what
Orchestra was doing.

### Still-known gaps, deliberately not touched

- `approveOutlineAndDraft` (the Deliverable "draft the approved outline" continuation) has
  its own separate `setCollaborativeLoading(true)` / save path and was NOT touched — it's a
  different function from `runCollaborativeSession`. If a deliverable draft dies mid-section,
  it isn't checkpointed the same way. Same fix pattern would apply if wanted.
- `rerunWithConsiderationResponses` (the *other*, heavier Considerations action — "re-run the
  full discussion" rather than "ask team to reconsider") also calls `submitConsiderationResponses()`
  without capturing its return value, then immediately calls `runCollaborativeSession(...)`.
  `runCollaborativeSession` reads `collaborativeRun` via its own closure at call time, which is
  the same one-tick-stale value — so in principle the same class of staleness bug could apply
  there too. It's structurally different enough (a different function stack, no `followUpMessages`
  involved) that I didn't want to bundle a fix into this same change; flagging it here in case
  you want it addressed as its own pass.

