<!-- session-protocol-version: 1.5 -->
<!-- canonical-source: VaultSparkStudios/vaultspark-studio-ops/docs/SESSION_PROTOCOL.md -->
<!-- agents: claude-code, codex, any-cli-agent -->
<!-- transitional: moving to Studio Brain kernel (see docs/STUDIO_BRAIN_ARCHITECTURE.md) -->

# Session Protocol — VaultSpark Studio OS

> **TRANSITIONAL NOTICE (2026-04-23, S110):** This document is the canonical session protocol **today**. It will be thinned to a pointer once the Studio Brain kernel (`studio` CLI) ships and agent skills collapse to 15-line kernel wrappers — see `docs/STUDIO_BRAIN_ARCHITECTURE.md` §7 for the target state and §6 for the migration stages. Until Stage 6 lands, follow the procedures in this file as-is. Any agent reading this file now executes the current protocol; any changes to session behavior between now and kernel go-live should land in **this** file to preserve the canonical-source rule. Canon decision: `context/DECISIONS.md` → **S110 — IGNIS elevated into the broader Studio Brain**.

This is the **single canonical source** for every Studio OS session protocol. Both Claude Code and Codex (and any future CLI agent) read this file and execute the same flows. Per-agent shims — `~/.claude/skills/*/SKILL.md` for Claude Code, `AGENTS.md` Session-Protocol section for Codex — are thin pointers into this document.

**Rule:** if you are an agent in a VaultSpark Studio OS repo and the user says a command listed below, find the matching section in this file and execute it step by step. Do not invent alternate flows.

**Language:** every step is written as an imperative instruction. No agent-specific terminology (no "Skill tool", no "system reminder", no "Codex config" — just "read X", "run Y", "decide Z"). If a step genuinely requires agent branching, it will say `IF agent = claude-code:` or `IF agent = codex:` explicitly.

## Skill authoring standard (CANON-010 extended · S183 founder directive)

Every Studio OS skill — **/start · /audit · /implement · /go · /closeout · /initiate** and the rest — must satisfy three properties. Treat these as the acceptance bar when writing or revising any skill:

1. **Full agent parity (CANON-010).** A skill must read and behave **identically** for Claude Code, Codex, and any future model/agent or MCP surface. The canonical procedure lives **here** (this file); per-agent files are thin pointers, never divergent logic. No step may assume a specific agent's tooling unless explicitly branched with `IF agent = …`. The same MCP tool, the same flags, the same outputs.

2. **Paired visual template.** Any skill that renders a founder-facing surface (start brief, /go status, closeout board, audit/implement summary) must emit the **same canonical visual template** regardless of which agent ran it — same blocks, same field order, same box-drawing — so a session can hand off between agents without losing signal. Render through the shared renderer (`scripts/render-*.mjs` / `studio-brief-renderer` subagent), never an improvised prose version. The closeout board, startup brief, and orientation brief are validated; new founder-facing surfaces SHOULD be validated too.

3. **Per-project scoping — no cross-project accidental overlap.** A skill invoked in project X operates on **project X only**. It resolves the current project from the cwd / session-lock / `PROJECT_STATUS.json`, and writes only to that project's tree — never another project's `context/`, never the wrong registry row. Cross-project effects go through the Ark (CANON-018), never a direct sibling-tree write. When a skill name is ambiguous across scopes, the **most-specific directory wins** (a directory-scoped variant beats the unscoped one). A skill that reads or writes a sibling project's files because it confused the active project is a scoping defect.

When revising a skill, verify all three before shipping. Drift in any of them (agent-divergent behavior, an improvised non-canonical surface, or a cross-project write) is a skill defect tracked the same as a failing test.

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
| `/goal` or `goal` | §2A | Durable Codex objective for long-running, verifiable Studio work |
| `/closeout` or `closeout` | §3 | Write-back + score + commit + push |

**Universal audit + execute combo (S113):**

| Command | Section | One-line intent |
|---|---|---|
| `/audit` or `audit` | §4 | Genius-level 9-axis project audit → ranked `docs/AUDIT_<date>.md` |
| `/implement` or `implement` | §5 | Ship every item from latest AUDIT in optimal-efficiency order |

Natural-language invocation works too. Typing "start" without the slash, or saying "begin session" / "let's start", routes the same. For Codex specifically, there is no native slash-command subsystem, so slash-prefixed commands must be matched as plain user text with the leading `/` treated as optional.

**Founder-Twin + approval discipline (S113 #604, CANON-024):** every Claude Code, Codex, ChatGPT-style CLI agent, subagent, and managed agent uses the shared Founder-Twin model for approval memory. Claude Code routes through the PreToolUse hook. Codex/ChatGPT agents call `node ../vaultspark-studio-ops/scripts/twin-ask.mjs <Tool> <input>` before side-effecting or escalated actions. When approval is needed, request one bounded command-family approval instead of repeated one-off prompts; never request broad approval for destructive, secret-bearing, billing, legal/public-promise, production-destructive, package-publish, force-push, arbitrary-shell, or heredoc/redirection commands. See `docs/TWIN_PROTOCOL.md`.

**Non-malicious action verification (CANON-024):** before side-effecting, networked, privileged, dependency, payment, secret-touching, production, or cross-repo actions, verify intent, target scope, package/download trust, secrets-gateway use, blast radius, and Founder-Twin verdict. Stop on `deny`; ask once at the bounded action-class level on `ask`.

---

## §1 — `/start` protocol

**v1.3 — Token-lean, AI-first (S101).** Target: ≤8K tokens consumed by session start. Raw context files are synthesized into the startup brief — they are NOT individually read at startup.

0. **Sync `main` (direct-to-main repos).** Run `node scripts/start-sync.mjs` (Studio Ops) / `node ../vaultspark-studio-ops/scripts/start-sync.mjs` (siblings with the propagated copy). It classifies working-tree residue with the closeout's own receipt allowlist: **clean** → `git pull --rebase`; **receipt-only** (append-only ledgers the last closeout's push/deploy wrote after its final commit) → `git pull --rebase --autostash`, so the receipts ride this session's first commit; **substantive** → it stops and names the files — a prior session's WIP is never auto-stashed. A bare `git pull --rebase` refuses receipt residue ("You have unstaged changes") and that refusal was being resolved by hand every session (S305).
1. **Run start-recovery preflight, then write session lock.** Before overwriting any existing lock, run `node scripts/start-recovery-preflight.mjs --json` when present. If it reports `possible-cutoff-*`, read the recovery-integrity verdict and use the arc recovery branch before mutating files. Then use the dedicated standalone script — bash `echo` silently fails for dotfiles on Windows, and ops.mjs may not be present in all project repos:
   ```
   node scripts/write-session-lock.mjs --agent <claude-code|codex|other> --trigger <founder-mission|recovery|scheduled-routine|ad-hoc>
   node scripts/session-beacon.mjs acquire --agent <claude-code|codex|other> --trigger <same-trigger> --best-effort
   ```
   The local lock is the source of truth; the beacon is its remotely visible,
   expiring lease for scheduled-writer admission. A live same-project conflict
   is never best-effort: stop and reconcile it. Network unavailability may warn
   for interactive work, while scheduled writers fail closed through
   `check-scheduled-write-admission.mjs`.


2. **Run preflight scripts.** These emit compact stdout — read their printed output only, do not open their output files:
   - **Canon + Ark reconciliation (D-S259.5):** run `node ../vaultspark-studio-ops/scripts/start-canon-sync.mjs --project . --slug <current-repo-slug> --json` (use `node scripts/start-canon-sync.mjs ...` inside Studio Ops). This single gate applies pending propagation, drains signed Ark cargo, refreshes safe adoption suggestions, and checks `context/CANON_ADOPTION.md` against the live `docs/STUDIO_CANON.md`. Studio Ops additionally broadcasts a signed, hash-idempotent `canon-update` snapshot whenever the live Canon fingerprint has changed. A stale/missing adoption posture or failed sync must be surfaced before work begins; never rely on an agent's remembered canon.
   - **Windows Git storm guard (Codex/CLI):** run the idempotent guard installer when available: `node scripts/install-git-window-guard.mjs --apply` (or from a sibling repo: `node ../vaultspark-studio-ops/scripts/install-git-window-guard.mjs --apply`). It sets Windows User env vars (`GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never`, `GIT_EDITOR=true`, `GIT_SEQUENCE_EDITOR=true`, `GIT_PAGER=cat`) so future Codex/shell Git commands fail non-interactively instead of opening credential/editor/pager windows. Current already-running terminals keep their inherited env; Studio Node scripts are also guarded through `scripts/lib/safe-spawn.mjs`.
   - `node scripts/detect-session-mode.mjs --explain` (BUILDER vs FOUNDER, ~100 tokens)
   - `node scripts/compact-handoff.mjs` (Haiku-compress LATEST_HANDOFF to cache — silent if fresh)
   - `node scripts/check-secrets.mjs --audit` (credentials gateway health)
   - `node scripts/ops.mjs blocker-preflight` (human-blocked classification — read first 20 lines only)
   - **Stalled-remediation resume (S288 · Studio Ops):** `node scripts/start-stalled-remediation-resume.mjs`. Doctor's `genius-batch-delivery` probe names its own remedy and, before S288, nothing ever ran it — a batch sat `in_progress` for ten hours with 24 repos' genius summaries behind it while the warning was reported to nobody who would act. This makes exactly **one** bounded attempt per session, writes an attempt receipt to `portfolio/ops/stalled-remediation-resume.ndjson`, and **leaves the doctor warning standing when the resume fails** — acting is the point, looking like it acted is the failure. No poller, no retry loop, no background process (a stopped poller is the S244 defect this replaces, and §0 window discipline forbids one).
   - **Frontier capability currency (CANON-049):** `node scripts/frontier-capability-radar.mjs --refresh-if-stale --write --json`. This checks the machine radar every start and performs a bounded official-source refresh only when the last complete scan is older than seven days. Source failure/timeout stays degraded or unknown — never touch timestamps to green it. Changed fingerprints create scored review candidates; they never auto-install, enable a beta, spend API money, or change a public promise.
   - **Bounded maintenance session lane (S301 · CANON-031):** `node scripts/run-maintenance.mjs --apply --session-due --json`. Eight registry jobs declared a cadence that **nothing could keep** — `--auto` excludes networked risk by design, the ops-daemon is not running, and every hosted cron was retired for runner cost — so their `cadenceMinutes` were undefendable bounds, not schedules. Measured at S301: `source-fingerprint-refresh` sat ten days past a seven-day cadence, and the fingerprint court's growing staleness had no visible cause. This lane admits **only** jobs the registry marks `sessionGated: true`, chosen by what the step actually does rather than by risk label: networked-read plus local-write, mutating nothing outward. It never widens `--allow-destructive`, and it never admits a job that ships, dispatches, or deploys — `fleet-url-health --ship`, `canon-enforcement --ship`, `ladder-court-dispatch`, `console-shell-deploy` and `mcp-leak-reap` stay out on purpose. A job whose court exits non-zero is recorded as a **failure with backoff**, never laundered into a success. The pattern is CANON-049's radar, which is current precisely because a session is obliged to run it.
   - **Machine-change check (S157 #12):** if `.cache/machine-fingerprint.json` is absent OR its `host`+`user` differ from the current machine, run `node scripts/run-doctor.mjs --machine`. It probes toolchain, gh scopes, installed hook-version, node_modules across registry repos, and MCP config — the exact migration-readiness gaps that cost the S152 session a full recovery. Surface any ⚠ before item #1.

   If any tool is missing, note it and continue.

3. **Context-meter preflight — BEFORE loading any context files:**
   ```
   node scripts/context-meter.mjs --json
   ```
   - `CONTINUE` → proceed to step 4.
   - `CONSIDER_CLOSEOUT` → warn the founder: *"Context already N% used. Recommend fresh terminal."* Proceed only on explicit founder confirmation.
   - `CLOSEOUT` → **stop immediately.** Do not read any context files. Show cached genius list from `.cache/genius-list.json` if available, then prompt for `/closeout`. This terminal is exhausted.
   - **Memory remediation gate (S212):** before rendering/loading the startup brief, run `node scripts/compact-memory-index.mjs --check` if `memory/MEMORY.md` exists. If it exits non-zero, run `node scripts/compact-memory-index.mjs --fix` once, then rerun `--check`. The compactor archives the full original before mutation; if the second check still fails, surface the warning but continue unless the context-meter already said `CLOSEOUT`.

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
- Every agent reconciles Studio Canon through `start-canon-sync.mjs`; a prior session's canon memory is never sufficient evidence of currency.
- `PROJECT_STATUS.json` and registry JSON beat derived Markdown when values conflict.
- No code edits during startup unless the founder immediately requests one.
- `context/LATEST_HANDOFF.md` is the active handoff; all other handoff docs are historical.
- Momentum runway ≤ 2.0: the genius hit list already surfaces this — no TASK_BOARD pre-read needed.
- Compacted or interrupted session: CDR direction is embedded in the brief's signals; check raw CDR only if needed mid-task.
- **Brief format is canonical and non-negotiable.** Every project uses the same box-drawing sections in the same order. This enables Claude↔Codex hot-swap.

### Agent-surface continuity

ChatGPT Work/Projects and equivalent plan-included provider surfaces may be used
for cross-device continuation when they reduce friction. They are interfaces,
not state authorities: `context/`, `LATEST_HANDOFF`, `PROJECT_STATUS.json`, the
session lock, and Git evidence remain canonical. Never auto-import provider
memory into Studio state; reconcile an explicit handoff through the normal
write-back protocol.

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

### 2.0.6 Per-item token attribution (S157 #4 — applies to `/go` AND `/implement` waves)

Wave cost must decompose to the offending item, mirroring the closeout §-step pattern (S156 #14):

```
node scripts/record-skill-cost.mjs --skill go --phase start            # once, at wave start (implement: --skill implement)
node scripts/record-skill-cost.mjs --skill go --phase step --step item-<id>   # after EACH item ships
node scripts/record-skill-cost.mjs --skill go --phase finish --session <id>   # at wave end
```

A 90K-token wave must show which item burned 60K. The `steps[]` ledger rows in `.cache/skill-costs` are the
contract; the skill-health tile and cost-regression probe read them. Agent skill bodies (Claude `~/.claude/skills/`,
Codex mirror) inherit this section — SESSION_PROTOCOL.md is canonical per AGENTS.md.

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

**Gate execution.** Before a risky action, run Founder-Twin and the non-malicious action preflight. If confirmation is still required, state the action class and request one bounded approval instead of repeated one-off prompts:
- Local edits + reversible file writes → proceed without confirm.
- Committing current repo → proceed via `/closeout` autopilot, not mid-sprint.
- Committing / pushing to *another* repo → always confirm + honor `scripts/check-repo-lock.sh`.
- Rotating / creating secrets → always confirm.
- Opening PRs, posting announcements, cron schedules → always confirm.
- Destructive commands, package publishes, billing/payment execution, force-pushes, production destructive SQL, and legal/public-promise changes → narrow confirmation only; do not request persistent broad approval.

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

### 2.7.5 Expansion passes — when the list is thin (v1.4)

If ≤2 items remain unblocked, or the founder invokes `/go` consecutively with no primary-list work to do, DO NOT stop. Expand the surface:

1. **Freshness reclass.** Re-run `node scripts/ops.mjs genius-list`. The freshness pass in `scripts/lib/genius-freshness.mjs` re-validates `cross-repo-locked` / `human-blocked` / `staged` cells against live lock state + capability readiness, automatically unblocking items whose blockers have resolved.
2. **Elevated-probe pass.** For each remaining `human-blocked` item where the rule in `scripts/lib/blocker-rules.mjs` is NOT `signupUiOnly`, attempt the admin/API path before keeping it blocked (per AGENTS.md "elevated-access blocker rule").
3. **Innovation pack.** `node scripts/ops.mjs innovation-pack` → `docs/INNOVATION_PACK.md`. Second-order ranked list drawn from: brainstorm orphans · inline TODO/FIXME markers · recently-shipped-but-unpolished code · SIL category regressions · incomplete CAPABILITY_MAP entries · cross-repo silence (≥14d no commits). Walk top candidates with the same quality bar as the primary list.
4. **Compound refinement.** Open the 3 most recently shipped scripts/features. Propose one concrete refinement each (performance · error surface · docstring · tests · polish). Ship the smallest viable one.

Each expansion step stops when it produces shippable work. Anything too large for the current session → add to TASK_BOARD with effort + rationale.

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

### 2.9 Dry-run mode (`/go --dry-run`) — S113

When invoked with `--dry-run`, /go skips execution and prints a preview of what *would* run. Useful for: estimating session effort before committing, sanity-checking the genius list after a refresh, founder visibility into the queue without touching state.

Behavior:
- Context-meter runs as normal (preview only — does not change state)
- Genius list refreshed via `node scripts/ops.mjs genius-list`
- Preview table printed: `[Tier] #N (effort) Title — recommendedModel — blocked? reason`
- Items grouped: `Will execute · Skipped · Deferred (>4h)`
- Expansion-pack preview emitted if primary list is thin
- No TASK_BOARD writes, no commits, no pushes
- Closes with: *"Dry-run complete — N items would execute. Type `go` to run."*

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

## §2A — `/goal` protocol

Meaning: *"Turn Studio context into one durable, bounded Codex objective with a verifiable stop condition."*

Use `/goal` when the founder wants a long-running project session, unattended progress, or a single explicit objective to persist across turns. `/goal` complements `/go`: `/go` executes the full ranked queue, while `/goal` wraps one bounded objective in Codex's durable goal mechanism.

### 2A.0 Preflight

- Run a context-meter check before loading heavy files.
- Load the smallest useful planning context: `docs/STARTUP_BRIEF.md`, `.cache/genius-list.json` or `docs/GENIUS_LIST.md`, `context/PROJECT_STATUS.json`, and `context/TASK_BOARD.md` only if needed.
- If the founder provided an exact task, use that task. Otherwise choose the top unblocked Now/Genius item, with repeatedly skipped `[SIL]` items escalated above ordinary new work.
- Do not select work blocked by missing credentials, launch-date decisions, rights/provenance, public promises, security/data-handling changes, or canon changes unless the founder explicitly approved that scope.

### 2A.1 Codex-native goal

IF agent = codex:

1. Confirm Codex goals are enabled. Preferred config:
   ```toml
   [features]
   goals = true
   ```
2. Build the durable command. **The stop-condition is SATURATION, not completion** — the command's spine is the saturation loop, so Codex keeps working instead of finishing in 10-15 min (founder directive, D-S177.2). The single bounded objective is the *first* item, not the *only* item. Template:
   ```text
   /goal Work continuously on <Studio objective>, then on the next-highest unblocked genius-list items, until the saturation check returns STOP. First read <minimal files>. Work in checkpoints; preserve user changes; run <validation commands> after each checkpoint. After EVERY verified checkpoint you MUST run:
       node ../vaultspark-studio-ops/scripts/session-floor.mjs --shipped <items-shipped-so-far>
     • exit 10 (CONTINUE) → you are NOT done: take the next-highest unblocked item (or climb the audit depth ladder on what you just shipped) and keep working. Do not stop; do not /closeout.
     • exit 0 (STOP) → budget saturated: only now run /closeout.
   Stop early ONLY for a named blocker or a founder-approval-gated action. Never stop because the first objective feels complete — that wasted-boot finish is exactly what this loop exists to prevent.
   ```
   The loop above is the durable command's backbone — it is NOT optional prose to apply separately. Because Codex executes this command text end-to-end, the saturation contract (§2A.3) must live *inside* the command, not only in the surrounding section.
3. If `/goal` is unavailable in the current Codex session, continue with the same workflow manually — run the `session-floor.mjs` loop by hand after each checkpoint — and tell the founder the Codex feature flag likely needs to be enabled before the next session.

### 2A.2 Approval policy

`/goal` does not bypass approvals. Approval prompts are controlled by Codex session flags or config. Recommended unattended Studio profile:

```toml
[profiles.studio_goal]
approval_policy = "never"
sandbox_mode = "workspace-write"
```

Do not recommend full sandbox bypass as the Studio default. Use elevated or unsandboxed modes only in isolated disposable worktrees after explicit founder acceptance.

### 2A.3 Validation and stopping — the saturation contract (S175)

- Prefer the repo's existing validation commands from `package.json`, `pyproject.toml`, Makefile, or documented smoke scripts.
- **Stop on SATURATION, not completion-of-one-objective.** This is the agent-neutral rule that closes the Claude↔Codex gap: Claude Code's `/goal` Stop hook *blocks* termination until a condition holds, so it runs long; a naive Codex `/goal` stops the moment its single objective feels done — wasting the startup context in a 4-10 minute session. Both agents instead consult **one shared engine**: after each verified checkpoint run

  ```bash
  node ../vaultspark-studio-ops/scripts/session-floor.mjs --shipped <N> [--budget +<N>k]
  ```

  It returns `CONTINUE` (exit 10) or `STOP` (exit 0) from the live signals — context-meter %, items-shipped vs the velocity floor (`silVelocity`), genius-list exhaustion, and any `/goal +Nk` budget floor — plus a **boot-amortization** ratio (`workTokens / startupTokens`) that makes a wasted boot visible.
  - **While it returns `CONTINUE` you MUST select the next-highest unblocked item (or climb the audit depth ladder on a shipped item) and keep working.** Do not stop with budget remaining.
  - Stop only when it returns `STOP` (context exhausted · list exhausted+re-verified above the velocity floor · explicit budget floor met), when a **named blocker** prevents completion, or when the next action requires **founder approval**.
- `IF agent = claude-code:` the `/goal` Stop hook already enforces continuation; `session-floor.mjs` is the *same* verdict surfaced inline so the two agents behave identically.
- `IF agent = codex:` the loop above IS your continuation mechanism — Codex has no blocking Stop hook, so the floor check is mandatory after every checkpoint, not optional.
- Use `/goal pause` for risky external actions, approval-sensitive work, or deep context refreshes.
- Use `/goal resume` after the blocker clears.
- Use `/goal clear` after the durable objective is complete or obsolete.

### 2A.4 Budget directive (S175)

`/goal +<N>k …` (e.g. `/goal +300k do all`) sets an **output-token floor** for the session. `session-floor.mjs --budget +300k` then returns `CONTINUE` until that floor is met regardless of how "done" the objective feels — the most direct cure for early-finishing. Scale depth to the floor: a bigger budget means more depth-ladder climbing and more verified second-order work, not a longer single objective.

---

## §2B — `/audit` protocol  *(canonical — the SKILL.md is a pointer; S219)*

**Mission:** one combined ranked improvement plan across 9 axes; genius-level, premise-verified, ready for `/implement`.

1. `node scripts/set-active-skill.mjs audit`; resolve overlay via `node scripts/lib/skill-profile.mjs audit` — `axisWeightDeltas` merge over type weights, `successBar` entries are mandatory per-item quality gates, `promptOverlay` shapes scoring.
2. **Context:** PROJECT_BRIEF · SOUL · CURRENT_STATE · bounded TASK_BOARD audit projection (`node scripts/task-slice.mjs --audit-context --max-chars 8000 --json`; find PATTERNS, don't re-list) · last 5 DECISIONS (constrain, never silently reverse) · registry `type` → axis weights. Never load the full board when this projection is available.
3. **Survey fast:** `node scripts/sample-codebase.mjs --max-tokens 30000 --json` (fallback: manual glob, hard cap 20 files). IGNIS portfolio signals: `portfolio/IGNIS_CORE.md` (top risk → weighting) + `portfolio/IGNIS_PATTERNS.md` (dedup list — a candidate already crystallized there or shipped by a sibling caps Innovation at 4, reframed "adopt <pattern> from <repo>").
4. **9 axes** (score each finding): feature depth · new innovative features · UX · feedback loop · gamification/engagement · AI integration · security · speed/organization · token/API reduction. Type weights: game → gamification 3×, UX 2×, AI/depth 1.5× · app/tool → UX/depth 2×, speed/token 1.5× · novel → depth/UX 2×, AI 1.5× · infrastructure → speed/token 2×, security/AI 1.5× · platform → security/speed 2×, UX/feedback 1.5×.
5. **Generate 2–6 candidates per axis** (≥3 truly novel). **PRE-VERIFY every premise against live code (S175)** — false premise → demote to `skipped` with disproving evidence; reject-on-verify is a WIN (S173). Evidence helper (S220): `node scripts/studio-oracle.mjs preverify "<claim>" [surfaces...]` greps live surfaces + oracle tables and returns evidence lines — the auditor still weighs the evidence (the oracle never rules). **Internal-first ladder (CANON-039):** reuse `docs/INTERNAL_TOOLS.md` → verified OSS (license per CANON-008, trust per CANON-023, pinned versions) → build-and-own (promote to registry) → paid last (CANON-015/029 founder note). Un-researched closed/paid deps are incomplete items.
6. **Score:** Tier 🔥/⚡/💡 · Impact 1–10 (axis-weighted) · honest Effort · Innovation 1–10 · Priority = (Impact × Innovation) / log2(EffortHours + 2). Cull < 1.5 unless security.
7. **Depth ladder (S175):** every item ships `ladder.L1/L2/L3` `{effortHours, recipe}` — minimal / solid default / genius-deep. Scale item count AND ladder depth to the session token budget.
8. **Emit:** `docs/AUDIT_<date>.json` is the SOLE truth (R-H14); merge mode preserves prior executionLog per slug (`--fresh` only for throwaways). Derive md via `node scripts/render-audit-md.mjs --date <date>`; render the `audit` brief through `scripts/lib/skill-brief.mjs` (insights 2–3 sentences, voice rules per `docs/SKILL_BRIEF_SPEC.md`). Stdout: top-5 + total priority.

**Quality bar:** every item has a concrete first step; Innovation ≥8 items must not be TASK_BOARD-derivable; token items need a measurement plan; respect canon.

---

## §2C — `/implement` protocol  *(canonical — the SKILL.md is a pointer; S219)*

**Mission:** execute the latest audit in optimal-efficiency order, complete-all-means-complete-all.

1. `node scripts/set-active-skill.mjs implement`; overlay via `skill-profile.mjs implement` (successBar = mandatory gates; `runMediumGate(profile.medium, item)` from `scripts/lib/medium-quality-gates.mjs` after each item — failure → BLOCKED with fixHint).
2. **Source:** latest audit JSON sidecar (`scripts/lib/audit-sidecar.mjs` → `findLatestAuditSidecar`, `appendExecution`); md-parse only if sidecar absent; neither → route to `/audit`. Iterate `audit.items` via `scripts/lib/sprint-runner.mjs` `runSprint()` where applicable.
3. **Re-sort for efficiency, NOT raw priority** → `docs/IMPLEMENT_PLAN.md`: group same-axis items · 🔥+low-effort first · foundations before façades · token-cost items LAST (measure after everything settles) · parallel-friendly items burst together.
4. **Pre-flight:** `node scripts/check-secrets.mjs --for <cap>` per item naming a capability.
5. **Per item:** surface `[#N · slug] starting` → pick ladder rung by remaining budget (default L2; L3 when ample, L1 when tight) → implement the rung's recipe → **VERIFY before shipped (S175):** run the test surface + confirm the change does what the recipe claims — an unverified `shipped:true` is a lying surface → record IGNIS telemetry (ignisScore/tier/recommendedModel) on the execution-log row → commit bounded scope → **saturation gate:** `node scripts/session-floor.mjs --shipped <N> [--budget +<N>k]` — CONTINUE (exit 10) → next item; list EXHAUSTED with budget left → CLIMB ladders (L2→L3) or `node scripts/ops.mjs innovation-pack`; never stop with budget remaining. STOP (exit 0) → finish cleanly.
6. **On STOP:** strike shipped items in TASK_BOARD · append SIL sprint entry · stdout summary (shipped/deferred/blocked + priority sum) · append per-item results to the audit's `## Execution Log`.

**Rules:** partial ≠ done (mark BLOCKED with reason) · >2 retries on one item → BLOCKED, continue · never skip an existing test surface · idempotent re-runs (execution log skips shipped) · founder-twin unattended mode runs the queue without intermediate prompts. Render `plan` + `sprint` briefs via `skill-brief.mjs`.

---

## §3 — `/closeout` protocol

> **Token-lean entry (S236 audit #1):** run `node scripts/render-closeout-checklist.mjs` and work from `docs/CLOSEOUT_CHECKLIST.md` (~0.6K tok, session-specific dirty flags + SIL stub) instead of re-reading this whole section or `prompts/closeout.md` (~7.4K tok). The checklist renders FROM this protocol; on `--check` failure or any ambiguity, fall back to the full text below. Gates (3.0 suggestion gate, blocker discipline, hygiene, autopilot) are unchanged and enforced by scripts either way.

### 3.0 Closeout-suggestion gate (context-aware)

Agents and skills MUST NOT suggest `/closeout` after each small item. `/closeout` is only auto-suggested when:

1. `node scripts/context-meter.mjs` returns `CONSIDER_CLOSEOUT` (pctUsed ≥ 75%) or `CLOSEOUT` (pctUsed ≥ 95%), **and**
2. The current genius-list item is cleanly completed (no partial state), **and**
3. The founder has not explicitly told the agent to keep going.

Explicit founder invocation (`closeout` / `/closeout`) always executes immediately regardless of meter state.

**Min-session-value gate (S175 — Codex parity).** Before an *agent-initiated* (not founder-invoked) `/closeout` during a `/goal` arc, run:

```bash
node scripts/session-floor.mjs --closeout-gate --shipped <N>
```

Exit 11 = **REFUSE**: the session is below the velocity floor, has barely touched its context, and its boot-amortization is not yet healthy — closing out now would lock in a wasted boot. Return and implement the unshipped audit items (or climb the depth ladder) first. Exit 0 = allowed. Pass `--founder` when the human typed `/closeout` (always honored). This is the Codex equivalent of Claude Code's blocking Stop hook — it stops Codex from closing out a 4-minute boot-waster.

### 3.0.1 Intent check

Compare actual work to `context/LATEST_HANDOFF.md → Session Intent:`.
- **Achieved** · **Partial** (note scope drift) · **Redirected** (log reason)

Bypass audit: any commit that used `--no-verify` / `--no-gpg-sign` → log in `context/DECISIONS.md` with date, hook bypassed, reason, follow-up task.

### 3.1 Write-back in canonical order

**All of these are mandatory every closeout, not optional.** Do not skip to §3.9 without completing this list.

1. `context/CURRENT_STATE.md` — shipped behavior changes
2. `context/TASK_BOARD.md` — new tasks, `[SIL:N]` counter updates
3. `context/LATEST_HANDOFF.md` — include **Where We Left Off** block at top
4. `logs/WORK_LOG.md` — session entry
5. `context/DECISIONS.md` — when reasoning changed
6. `context/SELF_IMPROVEMENT_LOOP.md` — mandatory SIL entry
7. `docs/CREATIVE_DIRECTION_RECORD.md` — mandatory if human gave creative direction (ADDITIVE ONLY)
8. `context/TRUTH_AUDIT.md` — when source-of-truth or derived surfaces changed
9. Any repo-specific files whose truth changed
10. **Agent memory** — for Claude Code: write/update any memory files in `~/.claude/projects/<slug>/memory/` that reflect decisions, patterns, or project state changes from this session. For Codex: equivalent agent-memory location. Memory writes are part of write-back, not a separate step.

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

### 3.4.5 Cross-repo follow-up batons (S153, Orchestrator phase 4)

If this session discovered follow-up work that belongs in a **different** repo (e.g. a Hashmark closeout surfaces a Vorn integration opportunity), ship a `session-handoff-baton` cargo to that repo instead of relying on Tier 1 to remember:

```
node <studio-ops>/scripts/ark.mjs baton --to <slug> --title "<one-line>" --why "<what you observed>" [--priority crit|high|normal|low] [--hints <csv>] [--entry "<ready-to-paste TASK_BOARD row>"]
```

The receiving repo's next `/start` drain auto-promotes the baton above its genius list (priority 0.92 ≥ rank-zero threshold 0.7). Do NOT ship batons for work that belongs in the current repo (that's TASK_BOARD) or for studio-wide canon changes (that's `canon-update`). One baton per distinct follow-up; batch related hints into `--hints`.

### 3.5 Audit JSON

Create `audits/YYYY-MM-DD.json` with schemaVersion 1.3.

### 3.6 IGNIS refresh (if needed)

**Every closeout (S153 — auto-rescore on touch):** `node scripts/ignis-rescore-touched.mjs` — detects repos touched this session and rescores only those. Cheap (1–3 repos typical), keeps coverage cumulative so the portfolio never re-ages 13d like post-migration.

**Additionally, full-stale pass** if `ignisLastComputed` ≥ 7d ago, SIL changed ≥ 10 pts, or protocol files changed: `node scripts/ops.mjs rescore --stale`.

### 3.7 State vector + doctor + entropy + genome

- `node scripts/render-state-vector.mjs`
- `node scripts/ops.mjs doctor --update-json`
- `node scripts/compute-entropy.mjs`
- `node scripts/append-genome-snapshot.mjs`

### 3.8 Pre-push secrets scan

`node scripts/scan-secrets.mjs --staged`. Abort on any finding; fix before retry.

### 3.9 Closeout autopilot (mandatory)

`node scripts/closeout-autopilot.mjs`.

Runs: doctor → refresh brief → stamp PROJECT_STATUS → sanitize `.claude/settings.local.json` → coherence commit gate (Step 4b — hard-aborts on incoherence/flake) → secret scan → git status + diff preview → commit (conventional message) → push → clear lock + beacon → print status board.

**No interactive confirmation gate (D-S177, founder directive).** The autopilot proceeds to commit + push without a readline prompt — the prompt hung non-interactive (agent- and `/goal`-driven) sessions and merely duplicated the closeout-brief gate (§3.7). The safety net is the **coherence commit gate** (Step 4b aborts on a tripped gate unless `--force`), the **secret scan** (aborts on any finding), and the **printed diff preview** the agent reviews before committing. `--dry-run` shows the plan without writes; `--confirm` opts back into the interactive prompt for a founder who wants it.

### 3.9.5 Deploy currency (CANON-036 — mandatory for deploy-capable projects)

After push, production must not silently lag `main`. If the session landed user-visible changes and the project has a production deploy path, resolve deploy currency before the status board:

- **`autoDeploy: "ci-on-push"`** — merge already triggered CD; confirm it ran, record it. Done.
- **`autoDeploy: "closeout"`** — **run the deploy** (`deployCommand`, e.g. `npm run deploy` / `wrangler deploy`) once gates pass: CI green · staging verified (CANON-007) · no secret in diff · normal non-force deploy · Founder-Twin approves the command (CANON-024). A scripted deploy is agent work, not a human blocker (CANON-019).
- **Gate unmet / `autoDeploy: "none"` (internal) / no deploy path** — if production legitimately lags, record `[BLOCKER] production N commits behind — deploy deferred: <reason>` in TASK_BOARD + LATEST_HANDOFF. **Never skip the deploy silently** — that is the exact failure CANON-036 exists to prevent.

The `Deploy:` field in Where-We-Left-Off must reflect the real outcome (`deployed to {env}` / `pending — deferred: <reason>` / `N/A`). Portfolio rollout state is surfaced by `scripts/check-deploy-currency.mjs` (doctor probe `deploy-currency`).

### 3.10 Creative Direction Record

Review the full session for human direction. Append to `docs/CREATIVE_DIRECTION_RECORD.md`:
- Any creative direction (features, feel, scope)
- Brand/tone/quality guidance
- Canon-affecting decisions
- Explicit do/don't instructions

ADDITIVE ONLY — never edit or delete existing entries. If no direction: note "CDR reviewed — no new entries this session."

### 3.10.5 Session hygiene (S119 founder directive — MANDATORY · ACTIVELY VERIFIED, S178)

**This is a gate, not a note.** Before printing the status board the agent must ACTIVELY enumerate, close, and then RE-CONFIRM — not merely claim. Every agent (Claude Code, Codex, any CLI) runs this; agents that spawn background work are responsible for closing it.

1. **Clear ephemeral visual lists used this session.** Any in-session genius lists, sprint sequences, or numbered enumerations rendered to the terminal as transient UI must be marked complete or cleared. Persistent surfaces (TASK_BOARD, GENIUS_LIST.md, AUDIT_*.md) are NOT cleared — only ephemeral session-only renderings.

   **In-session Wave scaffold reconciliation (CANON-044 — MANDATORY for multi-step work).** Studio agents **MUST** keep a live in-session task-scaffolding list ("Wave" is the default label — Wave 1, Wave 2, Wave 3, …; "Phase" is an accepted synonym) for any multi-step (≥3) / multi-phase / multi-wave arc; it pins progress at the bottom of the session window for the founder and the agent. **Each Wave line is a real item from this project's actual audit/implement plan — not a generic phase label** (e.g. "Wave 3 · fix MEMORY.md truncation", not "Wave 3 · implement"). **A scaffold that is opened MUST be reconciled here:** walk every item, set an honest final state (`✔` done · `◼` in-progress · `◻` open · `⊘` dropped-with-reason), carry any unfinished item onto `TASK_BOARD.md` (Now/Next) so it survives, and report the final tally on the Closeout board's **SCAFFOLD** line (`N tasks · X done · Y in progress · Z open`). Leave nothing `in_progress` and nothing dangling. Agent-neutral: Claude `TaskCreate`/`TaskUpdate`, Codex task list, or a rendered checklist — identical discipline (CANON-010 parity). A half-checked scaffold at session end is a closeout defect, same class as an un-updated handoff.

2. **Enumerate EVERY background shell/task the agent started this session.** Do not rely on memory. Re-list them from the agent's own job ledger:
   - *IF agent = Claude Code:* every `run_in_background` Bash call + every `Agent`/Task run — reconcile against the task-completion notifications received this session (and `TaskList` for agentic tasks). Each `b<id>` shell you launched must be accounted for.
   - *IF agent = Codex / other:* the agent's background-job/process list (`jobs`, the run table, etc).

3. **Actively CLOSE each one — don't just label it.**
   - Completed → confirmed closed (it already exited).
   - Still-running OR hung-past-usefulness → **STOP it now** (`TaskStop <id>` / kill the job) unless the founder explicitly flagged it let-run. A finished-but-still-attached or hung shell is closed by the agent, not left for the founder to track.

4. **RE-CONFIRM zero still-running before the board.** After closing, re-enumerate and verify nothing the agent started is still alive. A closeout that prints `running: 0` while a shell the agent spawned is in fact still alive (or was never enumerated) is a hygiene FAILURE — the count must be real (CANON-031 observability honesty).

The status board's `shells:` row reports `N started · M closed · K running` from the RE-CONFIRMED enumeration. **K must be 0 on a clean closeout** (or every nonzero entry is a founder-flagged let-run, listed with purpose + recommended action).

*Rationale (D-S119.2 · reinforced D-S178.5):* Founder reported recurring pain of (a) reminding agents to clean up visual/task lists and (b) agents leaving stale or hung background shells at end-of-session — observed acutely in long multi-shell sessions on a loaded box. Enumerate-close-reconfirm is now an explicit, verified gate for ALL agents, not optional prose.

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

## §3.7 — Unified Closeout Brief (MANDATORY · all agents · S141)

Between §3 step 5 (Brainstorm) and step 6 (Commit), every closeout MUST produce the unified impact brief through the shared renderer. Same output regardless of agent — Claude Code, Codex, ChatGPT custom GPT, or managed agent.

**Source of truth:** `docs/CLOSEOUT_BRIEF_SPEC.md` · **Visual mock:** `docs/CLOSEOUT_BRIEF_MOCK.md` · **Library:** `scripts/lib/skill-brief.mjs` · **Renderer:** `scripts/render-closeout-brief.mjs`

**Steps:**

1. Compose `.cache/closeout-brief-<session>.json` per the spec's input contract.
2. For every item shipped: `id`, `slug`, `title`, `axis`, `projectImpact` (1–10), `ecosystemImpact` (1–10), `insight` (2–3 sentences, voice-driven, no buzzwords), `evidence`.
3. Add `session`, `date`, `agent`, `repo`, one-sentence `headline`, `followUps[]`, `blockers[]`, optional `silDelta`.
4. **S175 v2 fields (all optional — include when applicable):**
   - `honestyLedger[]` — `{title, why}` per item the session DECLINED or rejected (rejected-on-verification, refused force-green, honest deferral). A disciplined session's refusals are first-class work; surface them, don't bury them in `blockers`.
   - `silDelta.kind` — `numeric | structural | idle`. A flat score (Δ0) with real work shipped is a **structural** win (coherence/honesty), not idle — set `structural` so the badge reads correctly. Auto-inferred if omitted.
   - `diffStat` — `{files, insertions, deletions, suite, testsDelta, probesDelta}` for the proof-of-work strip.
   - `amortization` — `{ratio, verdict}` (or `tokens:{startup, work}` and the renderer computes it). From `session-floor.mjs --json`. Makes session efficiency visible at closeout.
5. Run: `node scripts/render-closeout-brief.mjs --input .cache/closeout-brief-<session>.json` (add `--ascii` for narrow/Codex terminals — auto-detected when columns < 95).
6. Renderer writes `docs/CLOSEOUT_BRIEF_<session>_<date>.md` + prints frame to stdout. The "ready to commit & push?" line is the founder-facing review point for attended sessions; it is **advisory, not a blocking interactive gate** (D-S177) — autopilot commits + pushes without pausing for input (safety net: coherence commit gate + secret scan + diff preview).

**Project Impact rubric (1–10):** 1–3 hygiene · 4–6 visible · 7–8 new capability · 9–10 milestone.
**Ecosystem Impact rubric (1–10):** 1–3 local · 4–6 a few siblings · 7–8 10+ repos / canon · 9–10 foundational.

**Voice rules** (apply to every brief insight, all five kinds): 2–3 sentences max · lead with what changed in plain English · warm-confident, slight wit OK · forbidden words: leveraged · best-in-class · stakeholder · synergies · robust · seamless · forbidden openers: "This implementation/feature/change..." · no process narration · no emoji inside insight body.

### §3.7a — Brief variants for other skills

The renderer accepts `kind` field. Each main skill emits its own variant:

| Skill | kind | When |
|---|---|---|
| `/start` | `orientation` | After preflight, before founder prompt — replaces STARTUP_BRIEF.md stdout |
| `/audit` | `audit` | After writing AUDIT JSON sidecar |
| `/implement` | `plan` (pre-exec) + `sprint` (per round + final) | At preflight gate + each round |
| `/closeout` | `closeout` | Step §3.7 above |
| `/go` | `sprint` | At each round boundary |

Full schema + rubrics per kind: `docs/SKILL_BRIEF_SPEC.md`.

**Cross-agent invocation:**
- Claude Code: skill bodies import `scripts/lib/skill-brief.mjs`
- Codex: `node -e "import('./scripts/lib/skill-brief.mjs').then(m => console.log(m.render(JSON.parse(process.argv[1]))))" '<json>'`
- ChatGPT custom GPT: studio-ops MCP tool `skill_brief_render({ brief })`
- Managed agent: outcome rubric requires brief; harness runs renderer

No agent invents its own format. Drift in this layer is treated as a CANON violation.

---

## Specialty protocols

Full step-by-step for each specialty command. `/go` points to these when project context calls for them.

### §4 — `/initiate` (new project onboarding · v3 — S113)

Fully autonomous new-project bootstrap with every current CANON wired in. Target: 60 seconds from command to ready-to-build brief.

**Inputs:** `[project-name] [medium] [audience]` (skill argument-hint). Anything missing → ask founder once, then proceed.

#### 4.1 — Determine archetype (CANON-013 — NEW S113)

Prompt the founder once:

```
Stack archetype for this project?
  [A] Static SaaS / Marketing (default — Cloudflare Pages + Workers + D1 + R2 + Resend; $0/mo; use docs/CLOUDFLARE_MIGRATION_GUIDE.md for Vercel-style migrations)
  [B] Real-time / multiplayer / stateful (adds Durable Objects; $5–15/mo)
  [C] Heavy compute / persistent server (Hetzner CX22 + Caddy + Postgres; ~$5/mo)
```

Write the answer to `portfolio/PROJECT_REGISTRY.json` → `stack: "A" | "B" | "C"`. Default A on no-answer. Full reference: `docs/STUDIO_STACK_CANON.md`.

#### 4.2 — Create GitHub repo

`gh repo create VaultSparkStudios/<slug> --private --description "<one-line>"`. Private by default unless `audience` is explicitly `public-*`.

#### 4.3 — Scaffold context (15 files)

From `docs/templates/project-system/`:
- `AGENTS.md` (PROJECT.template + immediately propagate AGENTS_universal_sections via `node scripts/propagate-agents-sections.mjs --apply` — drops in CANON-006/007/008/011/012/013 + Founder-Twin + `/audit`+`/implement` sections)
- `CLAUDE.md` (CLAUDE.template)
- `context/PROJECT_BRIEF.md` · `SOUL.md` · `BRAIN.md` · `CURRENT_STATE.md` · `TASK_BOARD.md` · `LATEST_HANDOFF.md` · `DECISIONS.md` · `SELF_IMPROVEMENT_LOOP.md` · `TRUTH_AUDIT.md` · `PROJECT_STATUS.json` · `FILE_MAP.md`
- `logs/WORK_LOG.md`
- `docs/CREATIVE_DIRECTION_RECORD.md`
- Archetype scaffolding from `docs/templates/stacks/{A,B,C}-*/` (wrangler.toml + deploy README for A/B; deploy.sh + Caddyfile + systemd unit for C)

#### 4.4 — License / IP detection (CANON-008)

- Default `docs/RIGHTS_PROVENANCE.md` → `License: Proprietary — All Rights Reserved, VaultSpark Studios LLC`
- Scan any upstream fork for `LICENSE` files. AGPL/GPL → record in DECISIONS.md before first commit (only VaultFront exception is pre-approved)
- Never write an open-source `LICENSE` file without explicit founder override

#### 4.5 — Branding + Sitemap (CANON-006 + CANON-011)

- If `audience` is `public-*`:
  - `brandingRequired: true`, `brandingCompliant: false` (until verified)
  - Generate sitemap stub from `docs/PROJECT_SITEMAP_STANDARD.md`
  - Add `/agents.json` + `/.well-known/llms.txt` stubs
  - Add to `app-release-gate` enforcement queue
- If `audience: internal` → exempt from both, mark `stagingType: "none"`

#### 4.6 — Secrets gateway integration (CANON-012)

- AGENTS.md `## Secrets` section auto-injected via `AGENTS_universal_sections.md`
- Repo gets a symlink (or path traversal in CI) to `vaultspark-studio-ops/secrets/`
- Add per-archetype required capabilities to project's TASK_BOARD if any are MISSING in `secrets/CAPABILITY_MAP.json`

#### 4.7 — Founder-Twin profile (S113)

Add per-project entry to `portfolio/TWIN_PROFILES.json`:
```json
"<slug>": {
  "alwaysAsk": ["npm publish", "gh release create"],
  "alwaysApprove": []
}
```

#### 4.8 — Engagement signals + market scan (optional)

If `medium` ∈ {`game`, `app`, `product`} and `audience` is `public-*`, run a brief market/community scan (subreddit size, mention frequency, related projects) and write to `context/MARKET_SIGNALS.md`. Skip silently for internal/infra projects.

#### 4.9 — Register in PROJECT_REGISTRY.json

Required fields (S113 schema):
```
slug · name · medium · type · audience · status · lifecycle · developmentPhase
vaultStatus (FORGE by default) · stack (A/B/C — NEW S113) · priority · health
owner · summary · currentFocus · nextMilestone · repo · runtimeUrl · localPath
studioOsApplied · studioOsAppliedDate · lastInitiated
brandingRequired · brandingCompliant · stagingUrl · stagingType
landing: { tagline, heroCopy, cta, screenshots[], socialLinks{}, pressLinks[],
           releaseHighlights[], themeColor, ogImage }  (S113 — empty object OK)
```

Auto-populate `landing.tagline` from `summary` if ≤80 chars, `landing.heroCopy` from `summary`, `landing.cta` from vaultStatus (SPARKED → "Visit Live", else "Learn More"). Public-facing projects should have founder fill `landing.screenshots[]` during SOUL interview; renderer falls back to `summary` when blank. See `docs/WEBSITE_AUTO_RENDER_PROTOCOL.md`.

#### 4.10 — Open Hub tile

`src/data/studioRegistry.js` in `vaultspark-studio-hub` repo gets a new entry. Done via cross-repo dispatch if a Hub lock exists; otherwise direct edit.

#### 4.11 — `/soul-interview` (§9)

Always run — produces `context/SOUL.md` (3 non-negotiables + extended ledger + tone + audience pact). Required before any feature work.

#### 4.12 — Sync personal + Codex skills

`node scripts/sync-agent-skills.mjs --apply` so the new repo's agents see all 21 universal skills (Claude `~/.claude/skills/` + Codex `~/.agents/skills/` parity).

#### 4.13 — Output founder-ready brief

Box-rendered brief: project identity · archetype · cost ceiling · capabilities READY/MISSING · SOUL summary · top-3 next-actions · how to deploy. Founder can immediately `/go` for the first sprint.

#### 4.14 — Self-Improvement Loop seed

Write a "Bootstrap Baseline" entry in `context/SELF_IMPROVEMENT_LOOP.md` so the next session detects this as a real project (Type B → C) instead of routing back to `/initiate`.

#### Quality bar

- Idempotent: re-running on an already-initiated project is a no-op or a controlled refresh
- Fails closed: any step failure surfaces with a clear next-action, never silently
- Cross-agent: every artifact created works identically for Claude Code + Codex (strict CANON-010 parity)
- Sub-60s target measured end-to-end

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

1. **CI health check — one of two evidence lanes must be green.**
   - **Hosted lane:** the last 5 workflow runs are all green; or
   - **Budget-independent lane:** every non-green hosted run is a verified zero-step GitHub Actions budget rejection **and** `node scripts/check-release-proof.mjs --sha HEAD` passes a signed, network-isolated, exact-SHA receipt from the policy-declared independent runner. A local test run, unsigned JSON, stale receipt, different SHA, non-isolated persistent runner, or merely skipped workflow is never a substitute. This alternate lane exists so the founder's hard $5/month Actions ceiling cannot make safe releases impossible; it does not weaken test, staging, rollback, secrets, or founder-approval gates.
2. Staging smoke test — `curl -f ${stagingUrl}/_health`.
3. Secrets completeness — capability map for this project all READY.
4. Branding compliance — CANON-006 check.
4b. **Footer completeness (S187 · [SIL:2 S187 #2])** — footer must cover all header destinations + required legal pages.
   `node ../vaultspark-studio-ops/scripts/check-footer-completeness.mjs --manifest <footer-manifest.json> --json`.
   Missing manifest → SKIP (document, then create before next release). Footer missing a header link → **red**.
5. Staging parity — `diff` of staging vs prod config.
6. Rollback plan documented.
7. **Platform parity (S154 · CANON-034 extension · [SIL:2 S149 #1])** — record parity notes (screenshots encouraged) for **desktop browser, mobile browser, and native/mobile app** (where applicable). Run the responsive smoke first:
   `node ../vaultspark-studio-ops/scripts/responsive-audit.mjs --url ${stagingUrl}` (or local copy).
   - All surfaces at parity → pass; store notes in `docs/RELEASE_PARITY.md` or the release notes.
   - Browser-below-app gap → allowed ONLY with recorded rationale + catch-up/exception plan appended to `context/DECISIONS.md`. Missing rationale → **red**.
7b. **CANON-041 mobile-parity + elite-visual hard gate (S180 · D-S180.6 — BLOCKING, no general override)** — for any public-web project, ALL THREE must pass:
   - **Desktop↔mobile parity at all times** — every desktop feature/page/flow present + fully usable at ≤360/390/414/768px, portrait + landscape. A desktop-only or mobile-broken feature → **red**.
   - **Mobile nav works (forbidden anti-patterns absent)** — the open mobile menu/drawer scrolls within itself when taller than the screen (no items trapped below the fold); body-scroll-lock released on close; `100dvh` not `100vh`; `env(safe-area-inset-*)`; ≥44px targets; reachable close. A sticky/unscrollable mobile nav → automatic **red** (the specific defect CANON-041 bans).
   - **Elite visual craft** — visually impressive/immersive; purposeful motion + micro-interactions + smooth transitions; `prefers-reduced-motion` respected; 60fps/no-jank; CANON-029-cost-neutral.
   - Attest on pass: `context/MOBILE_PARITY.md` or `PROJECT_STATUS.mobileParity: true` (read by the `canon-041-mobile-parity` doctor probe). `node ../vaultspark-studio-ops/scripts/check-mobile-parity.mjs --json`.
8. Founder approval captured.

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
