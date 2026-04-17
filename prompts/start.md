<!-- template-version: 3.2 -->
<!-- synced-from: studio-ops/prompts/start.md @ Session 76 (2026-04-14) -->
<!-- v3.2 changes: blocker preflight rule, execution-first action queue -->
# START

Executed when the user says only `start`.

---

## 1 · Session Lock  *(mandatory first action)*

Write session lock via Bash (avoids Write tool "file not read" guard on new files):
```bash
echo "locked_by: agent-session
session_start: $(date -u +%Y-%m-%dT%H:%M:%SZ)
project: <slug>" > context/.session-lock
```
Overwrite if a stale lock exists. Lock is auto-cleared by the global Stop hook; also cleared manually at closeout.

**Active Session Beacon** *(runs if `.claude/beacon.env` exists — silently skips otherwise)*

```bash
[ -f .claude/beacon.env ] && source .claude/beacon.env && \
  printf '{"active":[{"project":"%s","agent":"claude-code","since":"%s"}]}' \
    "$BEACON_PROJECT_ID" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" | \
  gh gist edit "$BEACON_GIST_ID" -f active.json --filename active.json \
  2>/dev/null || true
```

Setup: create `.claude/beacon.env` (gitignored) with:
```
BEACON_GIST_ID=<gist-id-from-hub-settings>
BEACON_PROJECT_ID=<project-id-from-studioRegistry.js>
```
Get values from Hub Settings → "Active Session Beacon". The Stop hook clears the beacon on session end.

**Session mode (v3.1 — auto-detected):**

Run the mode detector immediately after the session lock:
```bash
node scripts/detect-session-mode.mjs --explain
```
It classifies the session as BUILDER (this-project) or FOUNDER (portfolio-wide) by heuristic on TASK_BOARD scope + LATEST_HANDOFF content + any passed-in user messages. If the classification would flip the current mode, it auto-updates `context/PROJECT_STATUS.json` → `sessionMode`. Re-run mid-session if the user issues a cross-project directive.

| Mode | Trigger | Focus |
|---|---|---|
| **BUILDER** | Default / single-project scope | This project only |
| **FOUNDER** | Detected: portfolio-wide scope, cross-project refs, `portfolio/STUDIO_BRAIN.md` or `STUDIO_PULSE.md` referenced | Cross-project strategy; read `portfolio/STUDIO_BRAIN.md` + `STUDIO_PULSE.md` first |

**v3.1 secrets discovery rule (mandatory):** Before labeling any item "Human Action Required" or "human-blocked", run:
```bash
node scripts/check-secrets.mjs --for <capability>
```
If the capability is READY, proceed autonomously using `scripts/lib/secrets.mjs` `getSecret(key, capability)`. The phantom-blocker pattern is forbidden.

**v3.2 blocker preflight rule (mandatory):** After secrets discovery, agents must try the blocker with elevated/admin access before leaving it as human-blocked:
```bash
node scripts/ops.mjs blocker-preflight
```
If the blocker is agent-attemptable, attempt it first. Human escalation is the last step, not the first.

---

## 2 · Initiation Type

Check `context/SELF_IMPROVEMENT_LOOP.md`:

| Condition | Type | Action |
|---|---|---|
| File missing or no dated entries | **A — Bootstrap** | Follow `prompts/initiate.md` — stop here |
| 1 "Bootstrap/Foundation Baseline" entry; core files still template-only | **B — Foundation** | Follow `prompts/initiate.md` §B — stop here |
| 2+ dated entries with real scores | **C — Returning** | Continue below |

---

## 3 · Load Context  *(read in order — do not skip or reorder)*

| # | File | Purpose |
|---|---|---|
| 1 | `AGENTS.md` | Role rules, enforcement, session aliases |
| 2 | `context/PROJECT_BRIEF.md` | What the project is and why it exists |
| 3 | `context/SOUL.md` | Creative identity and non-negotiables |
| 4 | `context/BRAIN.md` | Strategic mental model and heuristics |
| 5 | `context/CURRENT_STATE.md` | Live snapshot of what exists |
| 6 | `context/DECISIONS.md` | Key decisions with rationale |
| 7 | `context/TASK_BOARD.md` | Now / Next / Blocked / Later tasks |
| 8 | `context/LATEST_HANDOFF.md` | Authoritative handoff from last session |
| 9 | `context/SELF_IMPROVEMENT_LOOP.md` — **header only** | Rolling Status: sparkline, avgs, last scores |
| 10 | `context/TRUTH_AUDIT.md` *(if present and relevant)* | Source-of-truth hierarchy, contradiction status |
| 11 | `docs/SESSION_PLAN.md` *(if < 48h old)* | Predicted SIL range, scope cap, risk flags — surface in DASHBOARD |
| 12 | Task-specific files | Only after all above are read |

*Founder Mode: read `portfolio/STUDIO_BRAIN.md` between steps 9 and 10.*

---

## 4 · SIL Escalation Check

From the Rolling Status header (no extra reads):

- Note sparkline trajectory (↑ ↓ flat) and lowest rolling avg category — flag if any avg < 5.0
- List unactioned `[SIL]` TASK_BOARD items — read `[SIL:N]` skip counters; **any `[SIL:2⛔]` item must be moved to Now immediately**
- Surface top unactioned brainstorm idea from the last SIL entry

*Founder Mode only:* note `Studio avg SIL: [X]/500 · This project: [X]/500 [↑↓→]` in brief.

---

## 5 · Startup Rules

- Repo files are source of truth — not prior chat memory
- `PROJECT_STATUS.json` and registry JSON beat derived Markdown when values conflict
- No code edits during startup unless immediately requested
- `context/LATEST_HANDOFF.md` is the active handoff; all other handoff docs are historical
- Note assumptions before acting on them
- **Compacted/interrupted session:** Check if human direction is in `docs/CREATIVE_DIRECTION_RECORD.md`. If the last CDR entry predates work described in `LATEST_HANDOFF.md`, flag the gap and recover at closeout.
- **⛔ Momentum Runway ≤ 2.0:** Begin with TASK_BOARD pre-loading before any feature or protocol work. Surface as first item in PRIORITIES.
- **Execution-first workflow:** Generate the action queue before substantial implementation work:
  ```bash
  node scripts/ops.mjs action-queue
  ```
  Pull the top local work item from there and use the blocker attempts section before creating any new human escalation.

---

## 6 · Output — Startup Brief  *(v3.2 visual format — canonical renderer MANDATORY)*

**MUST use the canonical renderer.** Do not improvise a prose brief. Steps:

1. Run `node scripts/render-startup-brief.mjs`. This writes `docs/STARTUP_BRIEF.md`.
2. Run `node scripts/validate-brief-format.mjs docs/STARTUP_BRIEF.md`.
3. Exit 0 → display the brief as-is to the user.
4. Exit 1 → brief has drifted. Run `node scripts/ops.mjs onboard --repair --write`, re-render, re-validate. Never display a non-conformant brief.
5. If `render-startup-brief.mjs` is missing → `ops onboard --repair --write` ships it.

Non-canonical sections (product-specific prose blocks like "Contradiction Sentinel", "Executive Focus", "Evidence Gaps", "Today" buckets) are **forbidden in the shared startup brief**. They belong in tool-specific surfaces. The box-drawing format (project title · WHERE WE LEFT OFF · SCORE · SIGNALS · HUMAN PRESSURE · GENIUS HIT LIST) is load-bearing for multi-agent continuity — Claude Code and Codex must both render the same format so sessions can hand off without losing signal.

The template below documents the canonical shape for reference only. **Do not hand-render it** — run the canonical renderer.

**Score bars:** `/100` categories → 20-char bar, 1 █ per 5 pts · `/500` total → 24-char bar, 1 █ per ~21 pts
**Trend arrows:** compare last session score vs 3-session avg: ↑ (+2 or more) · ↓ (−2 or more) · → (stable)

```
╔══════════════════════════════════════════════════════════════════╗
║  STARTUP BRIEF  ·  {Project Name}                               ║
║  {YYYY-MM-DD}  ·  Session {N}  ·  BUILDER MODE                  ║
║  {type}  ·  {lifecycle}/{audience}  ·  {owner}                  ║
╚══════════════════════════════════════════════════════════════════╝

╔══ SCORE ══════════════════════════════════════════════════════════╗
║                                                                    ║
║  {total}/500   ████████████████████████░░░░   {pct}%              ║
║  Trend  {sparkline}  {↑↓→}  ·  Avg3: {avg3}  ·  Days since: {N} ║
║                                                                    ║
║  Dev Health    {nn}  ████████████████████░░░  {↑↓→}              ║
║  Alignment     {nn}  ████████████████████░░░  {↑↓→}              ║
║  Momentum      {nn}  ████████████████░░░░░░░  {↑↓→}              ║
║  Engagement    {nn}  ████████████████████░░░  {↑↓→}              ║
║  Process Qual  {nn}  ████████████████████░░░  {↑↓→}              ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

╔══ WHERE WE LEFT OFF  ·  Session {N-1} ════════════════════════════╗
║  Shipped:  {N items across N groups — group1, group2}              ║
║  Tests:    {N passing · delta: ±N}  ·  Deploy: {status}           ║
╚════════════════════════════════════════════════════════════════════╝

╔══ SIGNALS ════════════════════════════════════════════════════════╗
║  {✓/⚠/⛔}  Tests        {N passing · delta ±N}                   ║
║  {✓/⚠/⛔}  Velocity     {N ↑↓→}  ·  Debt: {↑↓→}  Runway: {N.N} ║
║  {✓/⚠/⛔}  Context age  {N}d old                                  ║
║  {✓/⚠/⛔}  IGNIS        {score} {TIER}  ·  {N}d old              ║
║  {✓/⚠/⛔}  Truth        {status}  ·  Genome: {n}/25               ║
║  {✓/⚠}    Genome dims  {all stable / drop: dim X→Y}              ║
║  {✓/⚠/⛔}  Entropy      {score}  ({healthy/elevated/high})         ║
║  {✓/⚠}    CDR          {no gap / gap: N sessions}                 ║
║  {✓/⚠}    Templates    {v2.9 aligned / drift detected}            ║
║  {✓/⚠/⛔}  Revenue sig. {N}d old  {✓ fresh / ⚠ stale}            ║
╚════════════════════════════════════════════════════════════════════╝

╔══ PREDICTION  ·  SESSION_PLAN.md ════════════════════════════════╗  ← omit if > 48h
║  Session {N}:  {range}/500  {trend}  ·  Scope cap: {N} tasks     ║
╚════════════════════════════════════════════════════════════════════╝

╔══ GENIUS HIT LIST  ·  Session {N} ════════════════════════════════╗
║  Fresh synthesis · all categories · ranked by impact              ║
║                                                                    ║
║  🔥 1  [CAT]  {title}                                             ║
║         {one-line rationale}                                       ║
║         ↳ {command if applicable}                                  ║
║                                                                    ║
║  ⚡ 2  [CAT]  {title}                                             ║
║  ...                                                               ║
╚════════════════════════════════════════════════════════════════════╝
```

*(Followed by IGNIS INSIGHT and CANON CHECK as plain text below the box)*

### Brief sources  *(all from files already loaded — no extra reads)*

| Field | Source |
|---|---|
| Score bar · per-category bars · sparkline · Avgs | `SELF_IMPROVEMENT_LOOP.md` Rolling Status header + last entry scores |
| Days since | `Last session:` date vs today |
| IGNIS score | `context/PROJECT_STATUS.json` → `ignisScore`, `ignisGrade`, `ignisLastComputed` |
| Truth / Genome | `context/TRUTH_AUDIT.md` → `context/PROJECT_STATUS.json` |
| Context age | `Last updated:` in `context/CURRENT_STATE.md` vs today |
| CDR Gap | Last `YYYY-MM-DD` entry in `docs/CREATIVE_DIRECTION_RECORD.md` vs `Last updated:` in `context/LATEST_HANDOFF.md` |
| Templates | Compare `template-version:` in `prompts/start.md` vs `START_PROMPT.template.md` |
| Revenue signals | `Generated:` date in `portfolio/REVENUE_SIGNALS.md` vs today |
| Prediction | `docs/SESSION_PLAN.md` `generated-at` comment; include only if < 48h old |
| Genius Hit List | `docs/GENIUS_LIST.md` if present; else call `scripts/generate-genius-list.mjs --brief` |

**Signal thresholds:**
- Tests: ✓ passing + delta ≥0 · ⚠ delta <0 · ⛔ failing
- Velocity: ✓ ≥2 · ⚠ 1 · ⛔ 0
- Runway: ✓ >4 · ⚠ 2–4 · ⛔ ≤2
- Context age: ✓ ≤7d · ⚠ 8–14d · ⛔ >14d
- IGNIS: ✓ <7d · ⚠ 7–14d · ⛔ >14d  ← re-score via `node ../vaultspark-studio-ops/scripts/ops.mjs rescore`
- Genome dims: ✓ no drops vs prior snapshot · ⚠ any dimension dropped
- Entropy: ✓ <0.3 (healthy) · ⚠ 0.3–0.6 (elevated) · ⛔ >0.6 (high)
- CDR Gap: ✓ last CDR date ≥ LATEST_HANDOFF date · ⚠ CDR predates LATEST_HANDOFF
- Templates: ✓ versions match · ⚠ drift
- Revenue: ✓ ≤7d · ⚠ 8–14d · ⛔ >14d

**IGNIS INSIGHT:** Read project section in `portfolio/IGNIS_CORE.md`. One synthesised observation. Label stale if `ignisLastComputed` older than IGNIS_CORE.md. Write `UNTRACKED` if no entry.

**CANON CHECK:** `docs/STUDIO_CANON.md` — at most 1–2 relevant decisions. Omit if no protocol work planned.

---

## 7 · Session Intent

If the user did not provide a session goal, ask:

> **"What is the primary goal for this session?"** (one sentence)

Log the declared intent in `context/LATEST_HANDOFF.md` under `Session Intent:`.

**Scope check** — immediately after logging intent:
- Count open Now items + work implied by the declared intent
- Compare to avg velocity in Rolling Status header
- Compute **sessionScopeCap** = `floor(lastVelocity × 1.5)` where `lastVelocity` = `Velocity: N` from Rolling Status header
- If declared scope > 2× recent avg velocity → flag: "⚠ Scope may exceed one session (velocity avg: {N}). Consider splitting or tracking as partial intent."
- If declared scope items > sessionScopeCap → note: "Scope cap: {cap} items. Items beyond cap: {list — lowest priority first}. Recommend deferring to Next or a follow-up session."
- If avg velocity = 0 → note: "No recent velocity baseline — scope is uncertain; track partial completion explicitly."
