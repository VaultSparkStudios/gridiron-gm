<!-- session-protocol-version: 1.3 -->
<!-- canonical-source: VaultSparkStudios/vaultspark-studio-ops/docs/SESSION_PROTOCOL.md -->
<!-- agents: claude-code, codex, any-cli-agent -->

# Session Protocol — VaultSpark Studio OS

This is the **single canonical source** for every Studio OS session protocol. Both Claude Code and Codex (and any future CLI agent) read this file and execute the same flows. Per-agent shims — `~/.claude/skills/*/SKILL.md` for Claude Code, `AGENTS.md` Session-Protocol section for Codex — are thin pointers into this document.

**Rule:** if you are an agent in a VaultSpark Studio OS repo and the user says a command listed below, find the matching section in this file and execute it step by step. Do not invent alternate flows.

**Language:** every step is written as an imperative instruction. No agent-specific terminology (no "Skill tool", no "system reminder", no "Codex config" — just "read X", "run Y", "decide Z"). If a step genuinely requires agent branching, it will say `IF agent = claude-code:` or `IF agent = codex:` explicitly.

## Session lock format

Every session starts by writing `context/.session-lock`:

```
locked_by: agent-session
session_start: <ISO-8601 UTC>
agent: <claude-code | codex | other>
project: <basename of cwd>
note: <optional free-form>
```

The `agent` field is mandatory as of protocol v1.0. It lets downstream tooling (studio-conductor, hot-swap, audit logs) know which agent is driving the session.

---

## The 3-command rhythm

Everything else routes itself. Memorize these three:

| Command | Section | One-line intent |
|---|---|---|
| `/start` or `start` | §1 | Begin every session — lock + load context + render brief |
| `/go` or `go` | §2 | Autonomous sprint through the Unified Genius List at quality bar |
| `/closeout` or `closeout` | §3 | Write-back + score + commit + push |

Natural-language invocation works too. Typing "start" without the slash, or saying "begin session" / "let's start", routes the same. For Codex specifically, there is no native slash-command subsystem, so slash-prefixed commands must be matched as plain user text with the leading `/` treated as optional.

---

## §1 — `/start` protocol

**v1.3 — Token-lean, AI-first (S101).** Target: ≤8K tokens consumed by session start. Raw context files are synthesized into the startup brief — they are NOT individually read at startup.

1. **Write session lock.** Create `context/.session-lock` using the format above. Include the `agent` field.

2. **Run preflight scripts.** These emit compact stdout — read their printed output only, do not open their output files:
   - `node scripts/detect-session-mode.mjs --explain` (BUILDER vs FOUNDER, ~100 tokens)
   - `node scripts/ops.mjs fast-start --stdout` (headroom + queue + rolling status, ~500 tokens)
   - `node scripts/compact-handoff.mjs` (Haiku-compress LATEST_HANDOFF to cache — silent if fresh)
   - `node scripts/check-secrets.mjs --audit` (credentials gateway health)
   - `node scripts/ops.mjs blocker-preflight` (human-blocked classification — read first 20 lines only)

   If any tool is missing, note it and continue.

3. **Context-meter preflight — BEFORE loading any context files:**
   ```
   node scripts/context-meter.mjs --json
   ```
   - `CONTINUE` → proceed to step 4.
   - `CONSIDER_CLOSEOUT` → warn the founder: *"Context already N% used. Recommend fresh terminal."* Proceed only on explicit founder confirmation.
   - `CLOSEOUT` → **stop immediately.** Do not read any context files. Show cached genius list from `.cache/genius-list.json` if available, then prompt for `/closeout`. This terminal is exhausted.

4. **Initiation type check.** Check `context/SELF_IMPROVEMENT_LOOP.md` exists and has ≥2 dated session entries (grep for `^## [0-9]` — do NOT read the full file).
   - Missing or 0–1 entries → route to `/initiate`. Stop.

5. **Load startup brief — THE ONLY CONTEXT READ AT SESSION START.**
   ```
   node scripts/render-startup-brief.mjs   # skip if docs/STARTUP_BRIEF.md < 24h old
   node scripts/validate-brief-format.mjs docs/STARTUP_BRIEF.md
   ```
   - Validator exits 0 → read `docs/STARTUP_BRIEF.md` (~3K tokens) and display it. This single file synthesizes: PROJECT_BRIEF · SOUL · BRAIN · CURRENT_STATE · DECISIONS · TASK_BOARD · LATEST_HANDOFF · SIL rolling header · TRUTH_AUDIT · STUDIO_BRAIN (Founder Mode). **Do NOT additionally read any of those raw files** — load them on-demand only when a specific task requires them.
   - Validator exits 1 → run `node scripts/ops.mjs onboard --repair --write`, re-render, re-validate.
   - Brief or renderer missing → run `node scripts/ops.mjs onboard --repair --write` first.
   - **Improvising a prose brief inline is a protocol violation.** The canonical box-drawing format (project title header · WHERE WE LEFT OFF · SCORE · SIGNALS · HUMAN PRESSURE · GENIUS HIT LIST) is load-bearing for multi-agent continuity — Claude and Codex must hand off without losing format-encoded signal.

6. **SIL escalation check.** Read from the SCORE block in the brief — no separate file read:
   - Note sparkline trajectory and lowest-scoring category.
   - List unactioned `[SIL]` items visible in the GENIUS HIT LIST block.
   - Any `[SIL:2⛔]` item must be escalated to the top of the sprint plan immediately.

7. **Log session intent.** If the founder did not state a goal, ask once: "What is the primary goal for this session?" Log into `context/LATEST_HANDOFF.md → Session Intent:`. Scope cap = `floor(lastVelocity × 1.5)` from the brief's SCORE block.

8. **Top action.** Surface the #1 item from the brief's GENIUS HIT LIST so work starts without diagnostic lag.

9. **Studio Status (Founder Mode).** Active sessions + conflicts are already in the brief's signals. Report only if new conflicts emerged since brief render.

### `/start` rules

- **Raw context files are NOT read at startup.** The startup brief synthesizes them. Load raw files on-demand during work only.
- **Context-meter check runs before ANY file load.** CLOSEOUT verdict = stop immediately, no exceptions.
- Repo files are source of truth — not prior chat memory. When brief and repo disagree, trust the repo.
- `PROJECT_STATUS.json` and registry JSON beat derived Markdown when values conflict.
- No code edits during startup unless the founder immediately requests one.
- `context/LATEST_HANDOFF.md` is the active handoff; all other handoff docs are historical.
- Momentum runway ≤ 2.0: the genius hit list already surfaces this — no TASK_BOARD pre-read needed.
- Compacted or interrupted session: CDR direction is embedded in the brief's signals; check raw CDR only if needed mid-task.
- **Brief format is canonical and non-negotiable.** Every project uses the same box-drawing sections in the same order. This enables Claude↔Codex hot-swap.

---

## §2 — `/go` protocol

Meaning: *"Update memory and task board with all Genius List items/ideas and implement all items at the highest/optimal quality."*

### 2.0 Preflight (abort if any fails)

- `context/.session-lock` must exist → if not, route to `/start` and stop.
- `context/SELF_IMPROVEMENT_LOOP.md` must exist → if not, route to `/initiate` and stop.
- `context/TASK_BOARD.md` must exist → if not, stop with error.

### 2.0.5 Context-meter preflight

Before refreshing or regenerating the genius list, run:

```
node scripts/context-meter.mjs --json
```

- `CONTINUE` → proceed to §2.1.
- `CONSIDER_CLOSEOUT` → proceed only if the founder explicitly wants to continue in the same terminal; otherwise stop and recommend a fresh session.
- `CLOSEOUT` → stop immediately; do not refresh the genius list. Surface the deferred list from `.cache/genius-list.json` / `docs/GENIUS_LIST.md` if available, then prompt for `/closeout`.

This step prevents carry-over terminals from spending the remaining context budget on diagnostics before item #1.

### 2.1 Refresh the genius list — CONDITIONAL

Refreshing is a cost. Only do it when inputs have changed since the last cache write:

```
node scripts/cache-genius-list.mjs --check
```

- Exit 0 → cache is FRESH. Read `.cache/genius-list.json` directly. Skip regen.
- Exit 1 → cache is STALE (TASK_BOARD, SIL, PROJECT_STATUS, STUDIO_BRAIN, GENOME_HISTORY or REGISTRY changed). Regenerate:

```
node scripts/cache-genius-list.mjs --write
```

Then read `.cache/genius-list.json` (or `docs/GENIUS_LIST.md`). Confirm:
- Item count ≥ 10 (list v3 targets 12)
- `IGNIS source` is `fallback` or `live`
- Top 3 items have Final scores > 80

Empty or corrupted → run `node scripts/ops.mjs doctor` and stop. Upstream break.

### 2.2 Detect project type + offer specialty skill (optional)

Read `context/PROJECT_STATUS.json → type` (or `portfolio/PROJECT_REGISTRY.json` in Founder Mode).

| Project type | Offer specialty | When |
|---|---|---|
| `game` | `/game-loop-review` | No playtest review in 3+ sessions or design items on list |
| `novel` | `/novel-continuity-check` | New chapters landed or CANON items on list |
| `app` / `web-app` / `saas` | `/app-release-gate` | Project is SPARKED or LAUNCH items on list |
| `infrastructure` / `internal-ops` | `/infra-debt-sweep` | Velocity declining 3+ sessions or DEBT items |
| any with placeholder SOUL.md | `/soul-interview` | `context/SOUL.md` still has template placeholders |

Surface the suggestion: `Detected project type: <type>. Before /go, consider /<specialty-skill> — <reason>. Continue? (y/n/switch)`.
- `y` → proceed.
- `n` → hand off to specialty, stop.
- `switch` → run specialty first, then resume.

No relevant specialty → skip silently.

### 2.3 Sync net-new items into TASK_BOARD

For each genius-list item not already in `context/TASK_BOARD.md → Unified Genius List`:
- Append a new row with tier, category, status, effort, title.
- Preserve ranked order (higher Final score = higher table rank).
- Append-only — never delete or reorder existing rows.

### 2.4 Capture memory patterns

If the genius list surfaces a *pattern* across items (e.g. "3 items blocked on the same credential", "2 items converge on the same infra gap", "new category of blocker"), write one memory entry:
- `project` type for studio-state patterns.
- `feedback` type for workflow corrections the user endorsed by approving `/go`.
- Never write memory for individual transient items — only recurring patterns.

Memory location: per-agent personal memory. For Claude Code that's `~/.claude/projects/<slug>/memory/`. For Codex that's `~/.codex/memories/<slug>/` or equivalent — see agent-specific docs.

### 2.5 Execute unblocked items sequentially

Walk top-to-bottom. For each item:

**Classify:**
| Status | Action |
|---|---|
| `unblocked` | Proceed to execute. |
| `human-blocked` | Run blocker preflight (§2.6). Do NOT escalate without trying elevated access. |
| `cross-repo-locked` | Skip with note. Add retry hint for the onboard-retry workflow. |
| `externally-blocked` / `blocked-on-hub` | Skip. Owned elsewhere. |

**Gate execution.** Before a risky action, state the action and ask for confirmation:
- Local edits + reversible file writes → proceed without confirm.
- Committing current repo → proceed via `/closeout` autopilot, not mid-sprint.
- Committing / pushing to *another* repo → always confirm + honor `scripts/check-repo-lock.sh`.
- Rotating / creating secrets → always confirm.
- Opening PRs, posting announcements, cron schedules → always confirm.

**Quality bar:**
- Full implementation — no TODOs, no stubs, no half-wired scaffolding.
- Idempotent — re-running does not duplicate state.
- Syntax-checked (`node --check`, `npx tsc --noEmit`, etc.) before moving on.
- Wired into the relevant dispatcher + hooks + workflow as the pattern calls for.
- End-to-end smoke test if feasible.

If quality can't be met this session (missing credential, upstream lock, scope overrun), stop on the item, write a `[BLOCKER]` entry, move on.

**Mark progress.** Update TASK_BOARD row status from `unblocked` → `done` with `— **DONE S{N}**: {one-line result}`.

### 2.6 Blocker preflight for gated items

```
node scripts/ops.mjs blocker-preflight
node scripts/check-secrets.mjs --for <capability>
```

Secrets present → proceed autonomously via `getSecret()` from `scripts/lib/secrets.mjs`. Phantom-blocker pattern is forbidden.

Blocker genuinely unresolvable without the Studio Owner → tag with age in sessions + surface at end-of-sprint summary.

### 2.7 Completion target — IMPLEMENT ALL

`/go` implements **every item** on the refreshed genius list at optimal quality. There is no scope cap unless the context-meter demands one.

Between each item, run:

```
node scripts/context-meter.mjs --json
```

Behavior per meter verdict:
- `CONTINUE` → pick the next item and keep going.
- `CONSIDER_CLOSEOUT` → finish the **current** item cleanly, then prompt the founder once: *"Context N% used. Continue or `/closeout` + fresh session?"* Default is CONTINUE unless founder redirects.
- `CLOSEOUT` → stop immediately. Surface deferred items to handoff. Prompt for `/closeout`.

Prioritize compounding items (sanitizer that unblocks 4 items beats one shallow win). Order within the list is IGNIS-ranked — follow it.

### 2.8 End-of-sprint summary

Produce the summary only when either (a) every genius-list item is shipped or explicitly deferred, or (b) the context-meter returned `CLOSEOUT` / the founder invoked `/closeout`.

Before handing back:

```
╔═ /go Sprint Complete ═════════════════════════════════════╗
║  Shipped:       {N} items at quality bar                  ║
║  Deferred:      {N} items — reasons listed below          ║
║  Human-batched: {N} items surfaced for Studio Owner       ║
║  Memory:        {N} new memory entries                    ║
║  Next:          run /closeout to commit + push            ║
╚═══════════════════════════════════════════════════════════╝
```

Then list shipped, deferred with reason, human-batched with why-not-auto.

For deterministic counts, run:

```bash
node scripts/ops.mjs closeout-summary --json
```

Use the returned task-board and memory counts in the sprint summary instead of estimating from prose.

**Never auto-invoke `/closeout`.** Always a separate, confirmed action.

### `/go` rules

- Never skip `/start`. Abort if no session lock.
- Never invent items. Only execute from the refreshed genius list.
- Never collapse TASK_BOARD. Append-only.
- Never silently cross-repo write.
- Never suggest `/closeout` mid-item. Only when the current item is cleanly done AND the context-meter says `CONSIDER_CLOSEOUT` or `CLOSEOUT`.
- Regenerate the list only when `cache-genius-list.mjs --check` reports stale.
- Always finish what you start — complete or defer, not both.
- Implement **all** items unless the context-meter or the founder stops you.

---

## §3 — `/closeout` protocol

### 3.0 Closeout-suggestion gate (context-aware)

Agents and skills MUST NOT suggest `/closeout` after each small item. `/closeout` is only auto-suggested when:

1. `node scripts/context-meter.mjs` returns `CONSIDER_CLOSEOUT` (pctUsed ≥ 75%) or `CLOSEOUT` (pctUsed ≥ 95%), **and**
2. The current genius-list item is cleanly completed (no partial state), **and**
3. The founder has not explicitly told the agent to keep going.

Explicit founder invocation (`closeout` / `/closeout`) always executes immediately regardless of meter state.

### 3.0.1 Intent check

Compare actual work to `context/LATEST_HANDOFF.md → Session Intent:`.
- **Achieved** · **Partial** (note scope drift) · **Redirected** (log reason)

Bypass audit: any commit that used `--no-verify` / `--no-gpg-sign` → log in `context/DECISIONS.md` with date, hook bypassed, reason, follow-up task.

### 3.1 Write-back in canonical order

If meaningful work happened:
1. `context/CURRENT_STATE.md` — shipped behavior changes
2. `context/TASK_BOARD.md` — new tasks, `[SIL:N]` counter updates
3. `context/LATEST_HANDOFF.md` — include **Where We Left Off** block at top
4. `logs/WORK_LOG.md` — session entry
5. `context/DECISIONS.md` — when reasoning changed
6. `context/SELF_IMPROVEMENT_LOOP.md` — mandatory SIL entry
7. `docs/CREATIVE_DIRECTION_RECORD.md` — mandatory if human gave creative direction (ADDITIVE ONLY)
8. `context/TRUTH_AUDIT.md` — when source-of-truth or derived surfaces changed
9. Any repo-specific files whose truth changed

### 3.2 Rolling data + scoring

Compute before scoring:
- **Velocity:** count Now → Done this session, exclude `[SIL]` meta-tasks.
- **Debt delta:** ↑ net new `[DEBT]` · ↓ net resolved · → unchanged.
- **Rolling averages** (3/5/10/25/all) from SIL entries.
- **Sparkline** (last 5 totals): `▁<100 · ▂<200 · ▃<300 · ▄<350 · ▅<400 · ▆<450 · ▇<480 · █480–500`.

Score 5 categories, 0–100 each (Dev Health / Creative Alignment / Momentum / Engagement / Process Quality). Infrastructure vs product projects use different Engagement rubrics — see `AGENTS.md` → *Engagement scoring*.

### 3.3 Human Action Required

Run blocker preflight. Before keeping any item in Human Action Required, run secrets discovery first, then an elevated/admin probe. Owner-only is a last resort.

### 3.4 Next-session pre-load

If fewer than 2 items in `## Now`, move 2–3 from Next. Never leave empty.

### 3.5 Audit JSON

Create `audits/YYYY-MM-DD.json` with schemaVersion 1.3.

### 3.6 IGNIS refresh (if needed)

Required if `ignisLastComputed` ≥ 7d ago, SIL changed ≥ 10 pts, or protocol files changed. `node scripts/ops.mjs rescore --stale`.

### 3.7 State vector + doctor + entropy + genome

- `node scripts/render-state-vector.mjs`
- `node scripts/ops.mjs doctor --update-json`
- `node scripts/compute-entropy.mjs`
- `node scripts/append-genome-snapshot.mjs`

### 3.8 Pre-push secrets scan

`node scripts/scan-secrets.mjs --staged`. Abort on any finding; fix before retry.

### 3.9 Closeout autopilot (mandatory)

`node scripts/closeout-autopilot.mjs`.

Runs: doctor → refresh brief → stamp PROJECT_STATUS → sanitize `.claude/settings.local.json` → git status + diff preview → **human confirmation** → commit (conventional message) → push → clear lock + beacon → print status board.

Never skip the confirmation prompt. `--dry-run` shows plan without writes.

### 3.10 Creative Direction Record

Review the full session for human direction. Append to `docs/CREATIVE_DIRECTION_RECORD.md`:
- Any creative direction (features, feel, scope)
- Brand/tone/quality guidance
- Canon-affecting decisions
- Explicit do/don't instructions

ADDITIVE ONLY — never edit or delete existing entries. If no direction: note "CDR reviewed — no new entries this session."

### 3.11 Output: closeout status board

Print the canonical STATUS BOARD or deterministic closeout ledger with every field filled. `closeout-autopilot` delegates to:

```bash
node scripts/ops.mjs closeout-summary --project . --pushed <yes|no|dry-run>
```

The ledger must include writeback ✓/✗, task-board counts, deferred count, memory entries touched, branch, commit SHA, dirty state, and push state. Use `✓` done, `□` pending/skipped, `—` not-applicable when rendering the box-drawing board.

Validate the candidate output with:

`node scripts/validate-closeout-board-format.mjs --stdin`

If validation fails, repair the output before presenting it. Do not ship a prose-only closeout summary in place of the canonical board.

---

## Specialty protocols

Full step-by-step for each specialty command. `/go` points to these when project context calls for them.

### §4 — `/initiate` (new project onboarding)

*Full protocol at `docs/templates/project-system/INITIATE_PROMPT.template.md`.* Summary:
1. Parse project name.
2. Create GitHub repo (`gh repo create`).
3. Scaffold 15 context files from `docs/templates/project-system/`.
4. Auto-detect copyleft/license obligations (scan for AGPL / MIT / Apache upstreams).
5. Scrape engagement signals (community size, mention frequency).
6. Register in `portfolio/PROJECT_REGISTRY.json`.
7. Open Hub tile entry.
8. Run `/soul-interview` (§9).
9. Output founder-ready brief.

Target: 60 seconds from command to ready-to-build.

### §5 — `/studio-review` (monthly cross-portfolio review)

1. Read `portfolio/PROJECT_REGISTRY.json` + each project's `context/PROJECT_STATUS.json`.
2. Score 6 categories: Portfolio Balance, Revenue, Hygiene, Coherence, Ops Compliance, Initiation Health.
3. Diff vs last month's `docs/STUDIO_REVIEW_AUTO_YYYY-MM.md`.
4. Surface 3 strategic bets.
5. Write `docs/STUDIO_REVIEW_AUTO_YYYY-MM.md` (replace current-month entry, append-only otherwise).
6. Optionally open a PR for founder sign-off.

### §6 — `/studio-status` (multi-session portfolio query)

1. Read `portfolio/ACTIVE_SESSIONS.json` (written by `studio-conductor.mjs` every 5 min).
2. List active sessions with repo + agent + age.
3. Detect cross-repo conflicts (two agents in overlapping scope).
4. Flag stale locks (> 48h).
5. Compute recommended-next-repo based on blockers + velocity.

### §7 — `/studio-genius-refresh` (mid-session priority refresh)

1. `node scripts/ops.mjs genius-list`
2. `node scripts/studio-pulse.mjs` (if present)
3. `node scripts/render-founder-queue.mjs` (if present)
4. Report delta vs previous snapshot.

### §8 — `/intake-credentials` (credential wizard)

1. Read `secrets/CAPABILITY_MAP.json` for declared capabilities.
2. Read `secrets/.access.log` for gateway health.
3. For each `MISSING` capability: ask for the credential, validate via API ping, write to `secrets/<file>.env`.
4. Never print raw values. Never commit `secrets/*`.
5. Update `context/PROJECT_STATUS.json.blockers` when capabilities flip to READY.

### §9 — `/soul-interview` (creative identity discovery)

Five questions, in order. Record the answers into `context/SOUL.md`:
1. "If this project had to have three non-negotiables, what are they?"
2. "Who is this for? What does a user say to their friend to recommend it?"
3. "What is the one thing this project does that nothing else does?"
4. "What feeling should a user have in the first 30 seconds?"
5. "What is absolutely off-limits — the anti-pattern you would reject even if it made money?"

Produces: 3 non-negotiables + extended ledger + tone + audience pact.

### §10 — `/security-check`

One-command operational security sweep:

1. **Sanitize `.claude/settings.local.json`.** `node scripts/sanitize-claude-settings.mjs --check --json`. If findings > 0, block with instruction to run `node scripts/ops.mjs sanitize-settings`.
2. **Scan staged changes** for leaked credentials. `node scripts/scan-secrets.mjs --staged`.
3. **Audit secrets gateway** health. `node scripts/check-secrets.mjs --audit`. Advisory only.
4. Report + non-zero exit on any finding.

### §11 — `/app-release-gate` (pre-release checklist)

1. CI health check — last 5 workflow runs all green.
2. Staging smoke test — `curl -f ${stagingUrl}/_health`.
3. Secrets completeness — capability map for this project all READY.
4. Branding compliance — CANON-006 check.
5. Staging parity — `diff` of staging vs prod config.
6. Rollback plan documented.
7. Founder approval captured.

Any red → block launch. Green across the board → mark project ready for SPARKED transition.

### §12 — `/game-loop-review` (game design audit)

1. Read `context/GAME_LOOP.md` + `context/SOUL.md` + `context/CURRENT_STATE.md`.
2. Scan recent playtest feedback (`docs/PLAYTESTS/*.md`).
3. Score 5 axes: loop tightness, progression curve, session engagement, retention hooks, soul fidelity.
4. Return prioritized findings + 3 concrete actions.

### §13 — `/novel-continuity-check` (canon audit for prose)

1. Read `context/CHARACTER_BIBLE.md` + `context/ENTITY_BIBLE.md` + `context/STORY_OUTLINE.md` + `context/CONTINUITY_RULES.md` + `context/SCENE_LEDGER.md`.
2. Compare recent chapters against bibles and outline.
3. Flag: character-name drift, timeline contradictions, worldbuilding inconsistencies, SOUL violations.
4. Output findings with chapter:line references.

### §14 — `/infra-debt-sweep` (debt audit for infrastructure)

1. Scan for stale scripts (> 90d no touch).
2. Detect orphaned workflows (not referenced anywhere).
3. Find divergent renderers (multiple scripts that write the same target).
4. Identify parser drift (different parse logic for the same file type).
5. Flag god-objects (files > 500 lines with many responsibilities).
6. Detect missing tests + dead code + outdated dependencies.
7. Prioritized findings + suggested consolidations.

### §15 — `/ask` (plain-English intent router)

Inputs are natural language. Match against this document + the skill registry and:
- **High confidence** (intent → exactly one skill) → invoke the matched skill; log "routed to `/<skill>` because <one sentence>".
- **Medium** (2–3 skills match) → present top 3 options with one-line rationale each; default to #1 if user says "go".
- **Low** (no match) → ask one clarifying question. Do not guess.

Context-aware: read `context/PROJECT_STATUS.json → type` to bias matches to the right specialty.

---

## Agent-specific notes

### Claude Code

- Slash commands live at `~/.claude/commands/<name>.md` — thin shims that invoke the matching skill.
- Skills live at `~/.claude/skills/<name>/SKILL.md` — as of protocol v1.0 these are 2-line pointers into this file (§N).
- The `Skill` tool is how an agent invokes another skill mid-session. For a user who typed `/start`, the agent sees the command shim → the shim tells the agent to invoke the `studio-start` skill → the skill points here.

### Codex

- No slash-command system. User input such as `/start`, `/go`, `/closeout`, `/studio-review`, or `/security-check` arrives as plain text. Codex must treat the leading `/` as optional, normalize the command phrase, match against `AGENTS.md`/this file, and execute the corresponding section.
- Personal memory lives at `~/.codex/memories/<slug>/` (or `~/.codexrc` config). Follow the same rules about pattern-level-only memory entries.
- Codex does not have a `Skill tool` equivalent. When `/go` needs to invoke `/game-loop-review`, Codex re-enters §12 directly rather than delegating.

### Any other CLI agent

Read `AGENTS.md` at repo root → read this file → execute. No agent-specific config should be required. If you find a step that only one agent can do, that is a bug — file it on `vaultspark-studio-ops/context/TASK_BOARD.md` tagged `[AGENT-PARITY]`.

---

## Maintenance

- **This file is the single source of truth.** Edits propagate to all repos via the `sync-skill-map.yml` workflow (extended to cover this file).
- **Append-only for specialty protocols.** Adding a new specialty (e.g. `/video-review`) appends a new `§N` section. Existing sections are edited only to clarify or fix bugs, never to reverse decisions silently — use `context/DECISIONS.md` for reversal reasoning.
- **Version bump** (`<!-- session-protocol-version: -->` at top) when a change is breaking or a new command lands.

*Canonical source: `vaultspark-studio-ops/docs/SESSION_PROTOCOL.md`. Propagated to all registry repos.*
