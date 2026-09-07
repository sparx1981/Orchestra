# Changes made this session

Verified with: `npx tsc --noEmit` (clean), `npm run build` (clean), `npx vitest run` (281/281 passing).

## 1. Bug fixes you asked about

**Stale Anthropic model IDs.** `claude-3-7-sonnet-20250219` and other retired IDs were
hardcoded in five places (`src/App.tsx` model picker, two default-state initializers, the
lightweight-model set; `server.ts` two request defaults). All replaced with current models:
`claude-sonnet-5`, `claude-opus-5`, `claude-haiku-4-5-20251001`, `claude-sonnet-4-5-20250929`.

**Anthropic `temperature` 400 error (found while fixing the above).** Claude Sonnet 5 /
Opus 5 reject any *non-default* `temperature` with a 400. Since agents can set a custom
temperature, the moment the default model changed every Anthropic call would have started
failing. `server.ts` now has `supportsTemperature(model)`, which drops the parameter only
for the model families that reject it (Sonnet 5, Opus 5, Opus 4.7+, Fable 5, Mythos 5),
leaving it working normally on Haiku 4.5 and older models.

**`max_tokens` hardcoded to 1024.** This is almost certainly the real cause of "thin"
specs, independent of which model was selected. Both Anthropic endpoints in `server.ts`
capped every response — including "write an exhaustive, high-detail section" — at ~750
words with no error surfaced. Raised to 8192 (non-streaming) / 16000 (streaming), with an
optional `maxTokens` override in the request body for future callers.

## 2. Product tab: closing the gap to what you described

The tab was a **single-pass pipeline**: one agent wrote each section once, and nothing
ever checked it. `productSpecGenerator.ts` only formats output — there was no discussion,
critique, or user-facing question anywhere in the flow. That's the opposite of your manual
workflow (draft → validate/expand in another model → repeat until agreement).

Added to `ProductTab.tsx` / `productSpecTypes.ts`:
- **Cross-agent review pass** — after drafting, every section is checked by a *different*
  team member for feasibility, technical truthfulness, and consistency with the rest of
  the spec (each reviewer sees all other sections' content, not just its own).
- **Revision pass** — if the reviewer finds real issues, the original author redrafts
  addressing them specifically (not a generic "improve this" prompt).
- **Open Questions** — anything the reviewer flags as a genuine product decision (not an
  engineering fix) is surfaced in a new card above the spec, with an inline answer box.
  Answering one triggers a targeted refinement of just that section.
- Each section now shows a small "Reviewed by X" / "Revised after review" badge.

This roughly doubles the number of model calls per spec (draft → review → maybe-revise per
section, instead of just draft), which is the accurate cost of actually doing the
verification you asked for rather than skipping it.

**What I did not build**, for scope reasons — worth knowing about:
- It's one review round per section, not an open-ended "until everyone agrees" loop. A
  genuinely contested point could still need a second manual "Refine Section" pass.
- Reviewers only see other sections' drafted content, not each other's review notes — so
  two reviewers can't yet discuss a disagreement with each other, only the section author
  gets to respond to feedback.
- No mechanism (yet) for the *user* to be asked clarifying questions *before* generation
  starts, only after — so a first draft can still go down the wrong path on something
  fundamental (e.g. "should this be multi-tenant?") before the review pass catches it.

## 3. Added OpenAI as a provider

- New model list (`gpt-5.6-sol`/`terra`/`luna`, `gpt-5.5`, `gpt-5.4-mini`, plus
  `gpt-6-astra` flagged in its label as staged-rollout since it launched days ago and
  isn't yet enabled on most API keys — deliberately *not* the default for new agents to
  avoid a confusing first-run failure).
- Full plumbing: `CustomAgent` type, `keys`/`showKeys`/`enabledAgents`/`results`/`models`
  state, the provider picker, results table, and icon/color table. The API-key settings
  panel is generic (`Object.keys(keys).map(...)`) so it needed no new UI code — it just
  picked up the new provider automatically.
- Server-side: dedicated OpenAI handling in both streaming and non-streaming endpoints.
  Uses `max_completion_tokens` (not `max_tokens`) and **never sends `temperature`** —
  every current GPT-5.x/GPT-6 model is a reasoning model that 400s on a non-default value,
  same class of issue as the Anthropic one above. Vision (image) input is wired up too.
- **Not implemented:** OpenAI's built-in web search tool. I didn't have high enough
  confidence in the exact Chat Completions tool schema for it on these models and didn't
  want to guess and risk breaking every OpenAI call when "use external resources" is on.
  Happy to add it if you confirm the schema or don't mind me researching it properly.

## 4. All six follow-up improvements, built in

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 281/281 tests pass.

**1. Pre-flight clarifying questions.** Clicking "Generate Product Spec" now first asks the
Lead Architect whether anything fundamental is ambiguous (single-user vs. multi-tenant,
offline requirements, auth model, monetization, etc.). If so, up to 4 questions are shown
with optional free-text answers before drafting begins — answer, or click "Skip, generate
anyway." Answers are folded into every section's context as firm requirements, and shown
as a "N pre-flight answers" badge (hover for detail) on the finished spec.

**2. Final consistency sweep.** After the existing per-section review/revision pass, one
additional call reads the *final* state of every section together and looks only for
contradictions introduced by revisions happening out of order (e.g. section 3's fix
changed something section 7 still assumes the old way). Genuine conflicts get one targeted
fix call to the original author; minor notes that don't warrant an automatic edit are kept
and shown in the readiness banner.

**3. Reviewers now see the knowledge base too.** The per-section review prompt previously
only cross-checked a section against the *other drafted sections*. It now also includes
the same grounded knowledge-base context the drafting agents saw, so a section can't
quietly drift from an uploaded spec doc without being caught.

**4. Reviewers are told to use search when they can.** Added an explicit instruction in
the review prompt: verify specific, checkable technical claims via web search rather than
judging from memory alone, when the reviewer has search access (this follows your
account's existing "Use External Resources" setting — no new toggle needed, since
`callAgent` already carries that through).

**5. Revision history.** Every section that gets overwritten — by the review pass, the
consistency sweep, or a manual "Refine Section" — now pushes its previous content onto a
`revisionHistory` list first, with a timestamp and the reason for the change. Each section
card shows a "History (N)" button when history exists; expanding it lists every past
version with a one-click "Restore" (which itself is undoable — restoring pushes the
current version back onto history).

**6. Readiness summary banner.** A single line above the spec — "Ready for handoff" or
"Not quite ready yet" — with counts (approved outright / revised after review / still
flagged / open questions unanswered), so you don't have to read every section's individual
badge to know whether it's actually done. Only shown for "Thorough" runs, since "Quick"
runs have no review data to summarize.

**7. Quick vs. Thorough toggle.** A two-way switch next to the Target AI Tool picker.
"Quick" drafts all 8 sections and stops — no review, no revision, no consistency sweep;
useful for a fast first pass or a cheap re-roll. "Thorough" (the default) runs the full
pipeline described above. A spec generated in Quick mode is labeled as such in its header
badge, and the readiness banner doesn't appear (there's nothing to summarize).

### Known limitations of this round
- The pre-flight check and the consistency sweep each add one more model call up front
  and one at the end respectively (the sweep also adds one call per conflict it finds, in
  the worst case up to one per section) — "Thorough" mode is now slower and more expensive
  than before, in exchange for the accuracy these improvements were meant to add.
- Revision history is kept only in-memory as part of the spec object — it is not written
  to a database and will be lost if the spec isn't otherwise persisted/exported.
- The consistency sweep gives the lead agent only a 2000-character-per-section summary of
  the final spec (to keep the prompt a reasonable size) — a very long section's later
  content past that point isn't visible to the sweep.

## 5. "Ask More Questions", drafting-stage questions, and export formats

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 289/289 tests pass.

**Multi-round pre-flight questions.** The pre-flight panel now has an "Ask More Questions"
button alongside "Continue" and "Skip." Clicking it locks in the current round's answers
(shown read-only above the new round), then asks the Lead Architect — now knowing those
answers — whether anything else genuinely needs clarifying, explicitly told not to repeat
itself. If it has nothing further, the panel says so and you can generate immediately.

**Can agents question the user mid-draft? Answered, then fixed.** Previously: no. Each
section was drafted independently by one agent with no way to flag an ambiguity until the
review pass afterward (or never, in Quick mode). Drafting agents can now append a
`QUESTIONS_FOR_USER` block to their own output when they hit something only the product
owner can decide; it's parsed out, stripped from the visible section, and merged into the
same Open Questions list the review pass uses — tagged "while drafting" vs. "during review"
so you can tell which. **This is not agent-to-agent debate** — each section is still
drafted by one agent alone; it only gives that agent an escape hatch to ask you, not a way
to argue with a teammate mid-draft.

**Export to Word, RTF, and PDF.** New `src/lib/productSpecExport.ts`: one shared lightweight
Markdown parser (headings, bullets, numbered lists, fenced code, `**bold**`) feeding three
renderers — the `docx` package (already a dependency, wasn't used yet), a hand-rolled RTF
writer (no library needed, RTF is plain-text markup), and `pdf-lib` (mirroring the existing
`pdfExport.ts` pattern). Wired into a new "Export As..." dropdown next to "Download .md".
Added 8 tests covering the parser and all three renderers.

**Google Docs — scoped honestly, not faked.** There is no zero-auth way to push content
directly into a new Google Doc; that needs OAuth setup in Google Cloud Console, which is a
separate project, not a code change. The "Google Docs" menu item downloads the same `.docx`
and says plainly that Google Docs opens it via File → Open or a Drive upload. I did not
build a button that looks like real integration but isn't.

**Bundle-size regression caught and fixed.** My first pass statically imported `docx`,
which pulled ~200KB gzipped into the main bundle for every user regardless of whether they
ever export. Fixed by dynamically importing it only inside `buildProductSpecDocx` (matching
the pattern the codebase already uses for `exceljs`/`pptxgenjs` elsewhere), confirmed by the
Vite bundler warning disappearing on rebuild.

## 6. Knowledge base: GitHub repos and codebase .zip uploads

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 302/302 tests pass
(13 new tests for the shared ingestion helper).

**New shared module `src/lib/codebaseIngest.ts`.** File filtering (skips `node_modules`,
`.git`, `dist`, build output, binaries, lockfiles), prioritization (README and manifest
files — `package.json`, `pyproject.toml`, `go.mod`, etc. — read first, since they tell an
agent more about scope and stack per character than an arbitrary source file), and a shared
digest builder: a file-tree overview plus the highest-priority files' content up to a
character budget. Used by both flows below so a repo linked via GitHub and that same repo
zipped and uploaded produce comparably-structured output. 13 tests cover filtering,
prioritization, budget truncation, and edge cases (empty codebase, oversized single file).

**Link a GitHub repository.** New "GitHub Repository" option in Add Source, accepting a
plain repo URL or a specific branch/subpath (`.../tree/branch/sub/path`). Fetches the file
tree and a budgeted selection of file contents directly from `api.github.com` and
`raw.githubusercontent.com` — both send public CORS headers, so this needed no server
proxy, consistent with how website/YouTube links already work in this app. Has its own
"Refresh" button in Loaded Sources, parallel to the existing Google one.
**Limitation, stated plainly: public repositories only.** Private repos need a token-based
auth flow (asking for and storing a personal access token) that this pass doesn't add —
happy to build that next if you need it.

**Upload a codebase .zip.** `handleFileUpload` now detects `.zip` files, unpacks them via
`jszip` (added as an explicit dependency — it already existed transitively through `docx`/
`pptxgenjs`, now pinned directly so it doesn't silently disappear on some future dependency
bump), and runs the same filtering/digest pipeline as the GitHub flow.
**Caught and fixed along the way:** the upload dialog's file-picker `accept` attribute
didn't include `.zip`, which would have made this invisible in the browser's file dialog
even with all the logic in place — fixed, and updated the helper text under the upload box.

**Fixed a real blocker for both of these: Product tab was truncating every attached
knowledge-base file to 3,500 characters before sending it to any agent.** That's harmless
for a short doc but would have made a 150,000-character codebase digest almost entirely
useless — only the file tree's first few lines would ever have reached the model. Raised to
12,000 characters for ordinary files and 60,000 specifically for GitHub/zip codebase
sources (matching `MAX_SOURCE_CHARS`, the "one full grounded source" convention already
used elsewhere in this app).

### Known limitations of this round
- GitHub: public repos only, as above. Also subject to GitHub's unauthenticated rate limit
  (60 requests/hour per IP) — fine for occasional use, could get hit if several repos are
  linked back-to-back.
- The 60-file / 150,000-character digest budget means a genuinely large monorepo will only
  ever get partial coverage — the file tree lists everything, but content is prioritized
  (README/manifests first) rather than exhaustive. This is a deliberate tradeoff, not a bug,
  but worth knowing before treating the digest as "the whole codebase."
- Zip processing happens entirely in-browser (no size limit beyond a 60MB safety cap) — a
  very large archive could be slow to unpack and scan on a low-powered device.
- I have still not run any of this against a real GitHub repo, a real zip upload, or live
  API keys — only static verification (types, build, unit tests). Please test both
  ingestion paths for real, and confirm the digest actually improves a spec for an
  "upgrade an existing codebase" prompt, before relying on this.

## 7. Product Specs now appear in Chat History

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 302/302 tests pass.

**The actual problem**: the Product tab kept its generated spec in local component state
only. Navigate away — or refresh — and it was gone for good, with no way back except
re-running the whole team from scratch. Every other mode in this app (Agent Comparison,
Multi Agent Team parallel/collaborative) already saves into a shared Chat History backed by
Firestore; Product specs were the one mode that didn't.

**What changed:**
- `"product"` is now a real Chat History entry type, alongside comparison/parallel/
  collaborative — same list, same search, same rename/delete/copy actions, with its own
  "Product Spec" badge and icon.
- A spec is saved automatically the moment it finishes generating, and again on every
  meaningful change afterward — an Open Question answered, a section refined, a revision
  restored — so reopening it later always reflects the latest state, not just the first
  draft.
- Clicking a Product Spec entry switches to the Product tab and loads that exact spec back
  in, with all its section review badges, revision history, and open questions intact —
  not a re-run, the actual saved output.

**How it's wired** (worth knowing if you touch this code later): rather than lifting all of
ProductTab's internal generation state (there's a lot of it — preflight rounds, per-section
regeneration, export state) up into App.tsx, ProductTab keeps owning its own state and just
gained three props: `specToLoad` (App.tsx hands it a spec to display), `onSpecLoaded`
(clears that back to null once consumed), and `onSpecChange` (fires on every local spec
change so App.tsx can persist it). This kept the change scoped to plumbing rather than a
structural rewrite of either component.

**A correctness bug I found and fixed while doing this**: `copyHistoryEntry` (the "branch
this into an editable copy" button) used an if/else-if/else chain that would have silently
routed a new "product" entry type into the `else` branch meant for "parallel" runs —
corrupting `parallelTeamHistory` with a `ProductSpec` object the moment someone clicked
"Copy" on a spec. Fixed by giving `"product"` its own explicit branch. This is exactly the
kind of bug that stays invisible until the 4th case is added to a 3-case chain — worth
double-checking any other `if/else` chains keyed on entry type if a 5th type is ever added.

**Also fixed**: Firestore documents cap at ~1MB, and a heavily-revised spec's
`revisionHistory` keeps a full copy of every prior version of every section — across 8
sections and a few review/revision rounds, that adds up. `saveHistoryEntry` now caps each
section's stored content at 40,000 characters and each revision history entry's content at
2,000 characters specifically for the Firestore write (mirroring the existing pattern that
already truncates long collaborative-run transcripts the same way) — the live in-session UI
still shows full-fidelity content from local state; only the persisted copy is capped.

### Known limitations of this round
- I have not tested this against a real Firestore project — only static verification. The
  save/load round-trip (generate → navigate away → reopen from history) should be tested
  for real before relying on it, especially for a large spec with several revisions, to
  confirm the 1MB cap concern above is actually handled correctly in practice.
- A spec loaded from history and then further edited (question answered, section refined)
  saves back under the same document id, silently overwriting the "before" version — there
  is no versioning across sessions, only within a session via each section's own revision
  history. Use "Copy" on the history entry first if you want to preserve the current state
  before making further changes to a re-opened spec.

## 8. Storage-limit warning + explicit "back up now" options

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 309/309 tests pass
(7 new tests for the detection helper).

**The question this answers**: should the app notify the user when a spec is large enough
that Chat History would trim some of it, and suggest downloading or backing it up? Yes to
the notification and the download suggestion. For the backup idea specifically, I pushed
back on one part of it: **automatic, silent backup to Google Drive is the wrong shape for
this.** The existing Google Drive connection in this app is read-only (`drive.readonly`,
used to pull knowledge-base content in) — writing a file to someone's Drive needs a
separate, more sensitive scope, and that should never happen silently under a connection
the user granted for something else entirely, or without an explicit click. So this is
built as **proactive detection + an explicit banner with two one-click actions**, not a
silent background process.

**What changed:**
- `wouldExceedHistoryStorageLimits(spec)` — a new pure function in `productSpecTypes.ts`,
  next to the two cap constants (`HISTORY_SECTION_CONTENT_CAP` = 40,000,
  `HISTORY_REVISION_CONTENT_CAP` = 2,000) it checks against. `saveHistoryEntry` in App.tsx
  now imports these same constants instead of the hardcoded numbers from before — single
  source of truth, so the "would this get trimmed?" check shown to the user can never
  silently drift out of sync with what actually gets trimmed on save.
- A dismissible amber banner appears on the spec (only when it actually applies), with
  **"Export Full Copy (.docx)"** — reuses the export path already built — and **"Back Up to
  Google Drive"**, a genuinely new, separate feature.
- **Google Drive backup, built for real**: its own OAuth scope (`drive.file` — this app can
  only ever see/manage files it creates this way, never anything else already in the
  user's Drive), its own token, requested only on that click. Builds the spec as a `.docx`
  in-browser (reusing `buildProductSpecDocx`) and uploads it via Drive's multipart upload
  endpoint. Success shows an "Open in Drive" link; failure shows the actual error inline
  (including auto-clearing an expired token so the next attempt re-prompts sign-in instead
  of silently retrying with a token already known to be dead).
- Fixed a chunk-splitting mistake I made while wiring this up: I initially dynamic-imported
  `productSpecExport.ts` from `App.tsx`, but `ProductTab.tsx` already imports it statically
  — so the dynamic import bought nothing (the module was already forced into the main
  chunk) and just added confusing indirection. Made it a normal static import in App.tsx
  instead, confirmed by the Vite bundler warning disappearing on rebuild.

**Deployment step this needs that isn't a code change**: the `drive.file` scope has to be
added to the OAuth consent screen for your Google Cloud OAuth Client (the same one already
configured for `VITE_GOOGLE_CLIENT_ID`) — no new client ID needed, just an additional scope
authorized on the existing one.

### Known limitations of this round
- I have not tested the actual Drive upload against a real Google Cloud OAuth client — only
  static verification. The multipart upload request is built to the documented Drive v3 API
  shape, but please test the full flow (consent prompt → upload → "Open in Drive" link)
  for real before relying on it.
- The backup is a one-shot upload, not a sync — backing up, then continuing to edit the
  spec, does not update the Drive copy. Use the button again for a fresh backup if needed.
- The warning banner is dismissible per spec but doesn't remember the dismissal across a
  page reload (no persistence for that one small piece of UI state) — reopening the same
  spec from Chat History will show the warning again if it still applies.

## 9. New Application vs. Update to an Existing App

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 309/309 tests pass.

**The question you asked**: is it worth asking new-vs-update upfront, and if update,
letting the user point at which knowledge-base file is the actual existing codebase (not
forced — if attached, ground the update on it). Yes on both counts, and I built it as a
persistent, always-visible UI control rather than something left to the pre-flight LLM
check's discretion — this is a structural fact about the project, not a nuanced judgment
call, and it needs to be reliable every time, not "usually asked."

**What changed:**
- A new "New Application" / "Update Existing App" toggle sits right under the Target AI
  Tool picker, always visible, defaulting to New (no behavior change for anyone who ignores
  it).
- Selecting "Update Existing App" reveals a dropdown of knowledge-base files scoped to just
  the two source types built for exactly this — a linked GitHub repo or an uploaded
  codebase `.zip`. **Genuinely not forced**: the default option is "None attached — proceed
  without grounding," and if there's nothing in the knowledge base yet, a link offers to
  open it instead of leaving a confusing empty dropdown.
- **If a codebase is attached**, an unmissable directive block (prefixed with a literal
  ⚠️ marker) is injected at the very front of the context every drafting agent, the
  pre-flight check, and the reviewer all see: treat the attached codebase as ground truth,
  describe the existing stack rather than "recommending" a new one (several section
  instructions are written in greenfield language — "recommend a stack," "design an
  architecture" — which is actively wrong advice for an update, so this had to be strong
  enough to override that framing, not just add alongside it), and be explicit about what
  changes vs. what stays exactly as-is.
- **If update but nothing's attached**, a different directive tells every agent not to
  invent a specific existing stack, and to prefer raising a genuine unknown as an Open
  Question over guessing at anything architecturally significant.
- The pre-flight check itself is now project-type aware: told not to waste a question
  asking about the current stack when a codebase is already attached (that's already
  known), but to prioritize exactly that when it's an update with nothing attached.
- The cross-agent review pass gained a fifth criterion — does this section actually match
  the real codebase's patterns, or does it quietly contradict them — alongside the existing
  four (feasibility, truthfulness, consistency, completeness).
- Manually refining a section (the "Refine Section" box) also carries the same project-type
  framing now, so a one-off manual edit doesn't drift back into greenfield-style advice for
  an update.
- The finished spec shows a badge — "Update · grounded on \<filename>" or "Update · no
  codebase attached" — so it's visible at a glance what basis a given spec was built on,
  including when reopened later from Chat History (this is stored on the `ProductSpec`
  object itself: `projectType` and `groundedOnExistingCodebase`).

### Known limitations of this round
- I have not tested this against a real GitHub-linked or zipped codebase end-to-end — only
  static verification. Please generate one real "update" spec with a codebase attached and
  confirm the architecture section actually describes the real stack rather than
  recommending a different one, before relying on this.
- The directive to override greenfield framing is a strong instruction, not a structural
  guarantee — a model can still occasionally ignore it, same as any other instruction in
  this app. The review pass's new fifth criterion is the safety net for that, not a
  hard constraint.
- `groundedOnExistingCodebase` stores the file's *name* at generation time, not a live
  reference — if that knowledge-base file is later renamed or deleted, the badge on an
  already-generated spec still shows the old name (which is arguably correct — it's a
  record of what the spec was actually grounded on at the time — but worth knowing).

## 10. Export formatting rebuilt to match a reference document + real tables

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 317/317 tests pass
(8 new tests for table parsing and title-page content). Also visually verified by rendering
real sample output through LibreOffice for all three formats — see below.

**What this was.** You attached a real Trimble/SketchUp product-spec `.docx` and asked for
the app's export formatting to match it, plus a similarly-structured title page. Rather than
eyeballing the rendered pages, I unzipped the `.docx` and read `word/document.xml` /
`styles.xml` / `header1.xml` / `footer1.xml` directly to extract the *exact* palette, type
sizes, and layout technique — not an approximation.

**Extracted style** (now the single `BRAND` constant in `productSpecExport.ts`): navy
`#003865` for titles/H1/table headers, blue `#0063A3` for H2/subtitle, gray `#464B52` for
body text/H3, an orange `#FBAD26` divider on the title page, Arial throughout, and the
reference's exact technique for the running header (a borderless 2-column table + a ruled
paragraph beneath it) and footer (a ruled paragraph with a right tab-stop and a page-number
field).

**Applied to all three export formats, not just Word** — RTF and PDF got the same title
page, palette, and running header/footer, since the module was already architected around
one shared style feeding three renderers, and leaving RTF/PDF looking like the old generic
style while only Word matched would have been an inconsistent half-measure.

**Title page**, adapted to *your* generated content rather than the reference's fixed
business text: eyebrow label → `spec.title` → `spec.subtitle` → orange rule → a "Document
Purpose" paragraph built from `spec.appConcept` → a metadata line (Generated date / Target
Tool / New-or-Update project type, plus the grounded codebase filename when set).
**Deliberately not copied verbatim**: the reference's "CONFIDENTIAL — FOR INTERNAL USE," a
real company name, and a fixed "v1.0" became generic equivalents ("AI-GENERATED — DRAFT,"
"Generated by Orchestra") — copying a confidentiality claim into an arbitrary AI-drafted
document would be actively misleading, not faithful formatting.

**Real tables, not just restyled headings.** The reference relies heavily on genuine Word
tables (a pricing-tier table, a huge tools-reference table). Previously, a markdown pipe
table anywhere in a section's content rendered as an ugly flattened single line in every
export format. `parseMarkdownLiteBlocks` now actually detects and parses pipe tables (a
`| a | b |` row immediately followed by a `|---|---|` separator), and all three renderers
draw a real table: header row shaded navy/white bold (Word, PDF) or bold-only (RTF, where
cell shading support is inconsistent outside Word), first column shaded light blue with
navy bold text, hairline gray borders throughout.

**Bugs I found and fixed while visually verifying** (this is exactly why the verification
step matters, not just unit tests):
- The RTF renderer's running header and the "— End of Document —" line had **unescaped em
  dashes**, which rendered as mangled `â€"` garbage in real Word/LibreOffice output despite
  passing every string-based unit test (the tests checked for content, not for whether every
  special character route was actually escaped). Fixed by routing those literals through the
  existing `escapeRtf()` helper like everything else already was.
- The RTF header was **missing its left-side brand text entirely** — it only ever rendered
  the right-aligned "AI-GENERATED — DRAFT," while DOCX and PDF both correctly show
  `{title} — Product Specification` on the left. Added the same tab-stop technique already
  used for the footer.

Both were caught by actually converting the generated files through LibreOffice and looking
at the rendered pages — not by the unit tests, which is the honest limitation of testing
output structure without testing rendered appearance.

### Known limitations of this round
- PDF's metadata line and bold inline lead-ins (e.g., **Axis Inference:** in the reference)
  render as plain text, not bold-and-navy like DOCX/RTF — `pdf-lib`'s `drawText` doesn't
  support mixed formatting within one call the way Word's TextRuns do, and adding manual
  per-segment positioning was more than this pass covered. This matches an existing,
  already-documented PDF limitation (bold markers are stripped, not styled) rather than
  introducing a new inconsistency.
- Table columns are always equal-width in all three formats — there's no attempt to size
  columns based on content (the reference's own tables use hand-tuned column widths).
- RTF table cells have no background shading (by design — see above) — only the header
  row's bold weight distinguishes it, versus the fully shaded header/first-column in Word
  and PDF.
- I generated and visually verified a realistic multi-section sample with a table, code
  block, bullets, and both project types — but have not run this against an actual
  end-to-end generation with real API keys. Please generate one real spec and check its
  exported Word doc before relying on this for anything client-facing.

## 11. Knowledge source attribution, a real tooltip bug, and a pre-generation confirmation step

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 323/323 tests pass
(6 new tests for grounded-source rendering). Also visually re-verified the title page with
a GitHub repo + a codebase zip both attached — see the render in this session.

**Knowledge Sources Referenced on the title page.** Every spec's title page now lists each
attached knowledge-base file under "Document Purpose" — its type (GitHub Repository,
Codebase Archive, File, etc.), its name, its URL when it has one (GitHub links), and a short
excerpt of its actual content. For a GitHub repo or `.zip`, that excerpt is the digest's own
overview line (file count, branch) rather than raw file content, which would be far too long
for a title page — the point is proof the source was genuinely read, not a full re-listing.
Capped at 12 sources shown, with a "+N more" note beyond that. New `groundedSources` field
on `ProductSpec` (kept alongside the existing `groundedSourceCount`/`groundedSourceIds` for
backward compatibility with specs generated before this field existed).

**A real tooltip rendering bug, fixed.** The "N pre-flight answers" badge's hover tooltip
was rendering as a giant, badly-overlapping black block — exactly what's in your
screenshot. Root cause, found by reading the actual component rather than guessing: this
codebase's `Tooltip` is a `base-ui` component, not Radix, and doesn't support the `asChild`
prop I'd used (a Radix convention) — the correct pattern here is `render={<Badge>...}`,
which I'd actually used correctly elsewhere (the Google/GitHub refresh button tooltips) but
missed on this one. Compounding it: the tooltip's default styling (`inline-flex
items-center`, sized for a short one-line label) was never overridden for this multi-line,
multi-paragraph use, so several question/answer pairs got forced into a flex *row* instead
of stacking, with no width or height cap — hence the oversized, jumbled block. Fixed both:
correct `render` prop usage, plus `flex-col items-start`, a sensible fixed width, and
`max-h-72 overflow-y-auto` so it degrades to a scrollable box instead of an unbounded one no
matter how many pre-flight rounds accumulate.

**A confirmation step before generation actually starts.** Previously, finishing the
pre-flight Q&A (or skipping it) immediately kicked off the full multi-agent pipeline — no
chance to catch a wrong toggle or a typo before committing to a 10+ model-call run. Now,
after pre-flight resolves, a summary card shows Project Type, (if applicable) which
existing codebase is attached, Target AI Tool, Depth, and every pre-flight answer — the
answers are directly editable inline, and the three toggles above (Project Type, Target
Tool, Depth) remain live and interactive, with the summary card reading their current value
on every render rather than a frozen snapshot, so changing them there updates the card
immediately. "Start Generation" or "Cancel" from here; nothing happens until that click.

### Known limitations of this round
- The confirmation card doesn't duplicate the Project Type / Target Tool / Depth controls —
  it reads their live values and tells the user to adjust them above if needed. This keeps
  a single source of truth (no risk of the card's copy drifting from the real control) but
  means the controls and the summary aren't visually in the same box.
- The tooltip fix was verified by reading the component source and reasoning through the
  CSS carefully, but I have no way to render this specific interactive hover state myself —
  unlike the document export work, there was no way for me to visually confirm this one.
  Please check it in the actual browser.
- Knowledge-source excerpts are short and mechanical (an overview line or the first ~200
  characters) — they're proof-of-use, not a real summary of what each source contributed to
  the spec's reasoning.

## 12. Cross-provider review preference + a real convergence loop

Verified again after these: `tsc --noEmit` clean, `npm run build` clean, 323/323 tests pass
(no new tests added — this logic lives in `ProductTab.tsx`'s generation pipeline, which
already had no unit tests before this change, consistent with the rest of the codebase:
only pure `src/lib/` functions are unit-tested here, not the React component's orchestration
logic itself, which needs a mocked `callAgent` and full team state to exercise meaningfully).

**The gap this closes**: the review pass reviewed once and accepted whatever the author's
revision came back with, with no re-check — the opposite of the "loop until both sides
agree" workflow you described. It also picked a reviewer by *role* only, so if your whole
team happened to be on one provider, "independent review" was really the same model
reviewing itself with a different persona.

**1. Reviewer selection now prefers a different model/provider, not just a different
role.** `pickReviewer` tries, in order: a role-preferred teammate (QA/Tech/UX/Lead) on a
different provider than the author → any teammate on a different provider → a
role-preferred teammate on the same provider → any other teammate → (single-agent team)
the author itself. **Cost: zero extra calls** — this only changes *which* already-planned
reviewer call goes to which agent. Each section now records whether its review was
cross-provider (`reviewCrossProvider` on `ProductSpecSection`); the Readiness Summary
banner surfaces same-provider coverage, and a small "(same-provider review)" note appears
on the affected sections' badges — visible, not silent.

**2. A capped convergence loop, not one review-and-accept.** After a revision, the *same*
reviewer now re-checks the *revised* content — the loop continues until that reviewer
approves, or a 3-round cap is hit (to bound worst-case cost on a genuine, unresolvable
disagreement). Hitting the cap without approval marks the section "flagged" rather than
silently accepting an unreviewed final revision. Each section records how many rounds it
took (`reviewRounds`); the section badge now reads "Revised (2 rounds) after review" when
it took more than one, and "Still flagged after 3 rounds by X" when it never converged.

### Cost, plainly
Previously: 1 review call, +1 revision call if needed — 1-2 calls per section. Now: up to 3
review calls and 2 revision calls per section in the worst case (a section that never
converges) — most sections that needed zero or one revision before still cost the same as
before; only genuinely contested sections get materially more expensive. Across 8 sections
in the worst realistic case, that's roughly 2-3x the review-phase call count versus before —
exactly the tradeoff described when this was proposed, now actually built rather than
estimated.

### Known limitations of this round
- The cap is a fixed constant (3 rounds), not user-configurable — raising it trades more
  cost for a better shot at convergence on hard cases; lowering it saves cost at the risk of
  more sections landing in "flagged" that a 4th round might have resolved.
- "Cross-provider" only helps if your team actually spans more than one provider — a
  single-provider team (e.g., everyone on Claude) still reviews same-provider by
  necessity, and the UI now tells you this rather than hiding it, but doesn't stop you from
  running that way if that's what you want.
- This closes gaps #1 and #2 from the four discussed; a genuinely holistic full-document
  review pass (gap #3) and an explicit named-model "Cross-Model Validation Loop" mode
  (gap #4) are still open, larger changes if wanted next.

## Before you deploy

- Get a fresh **OpenAI API key** (`https://platform.openai.com/api-keys`) and paste it into
  Settings → API — same flow as your other providers.
- If you're on an OpenAI plan/key that doesn't yet have GPT-6 Astra enabled, leave the
  model on GPT-5.6 Sol (the default) — Astra will just 404 until your account gets it.
- Everything here compiles and the existing test suite passes, but I have not run the app
  live against real API keys, so please do one end-to-end product-spec generation as a
  smoke test before relying on it.
