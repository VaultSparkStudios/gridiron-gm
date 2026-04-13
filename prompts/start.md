<!-- template-version: 2.8 -->
<!-- synced-from: studio-ops/prompts/start.md @ Session 64 (2026-04-13) -->
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

**Session mode:**

| Mode | Trigger | Focus |
|---|---|---|
| **BUILDER** | Default | This project only |
| **FOUNDER** | "start: founder mode" | Cross-project strategy; read `portfolio/STUDIO_BRAIN.md` first |

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

---

## 6 · Output — Startup Brief

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STARTUP BRIEF — {Project Name}
  {YYYY-MM-DD} · Session {N} · {BUILDER / FOUNDER MODE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  IDENTITY     {type} · {lifecycle}/{audience} · {owner}
  STATE        {current phase and overall health}
  PRIORITIES   Now: {task} · Next: {task}
  CONSTRAINTS  {key constraints or limits}
  PREDICTION   {predicted SIL range} · {trend} · cap {N}  *(SESSION_PLAN.md — omit if > 48h old)*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHERE WE LEFT OFF  (Session {N-1})
  Shipped    {N improvements across N groups — group1, group2, ...}
  Tests      {N passing · delta: +N/-N}  or  N/A
  Deploy     {env · auto / manual / N/A}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DASHBOARD
  SIL    ██████████████████░░ {total}/500  {sparkline}  Avg: {n.n}
         Dev {nn}{↑↓→} │ Align {nn}{↑↓→} │ Momentum {nn}{↑↓→} │ Engage {nn}{↑↓→} │ Process {nn}{↑↓→}
  FLOW   Velocity: {N}{↑↓→} │ Debt: {↑↓→} │ Runway: ~{n.n} sessions │ Days since: {N} │ Ctx: {N}d
  IGNIS  {n}/100K ({TIER}) │ Compliance: {n}/{total}
  TRUTH  {green|yellow|red|unknown} │ Genome: {n}/25

  SIGNALS
  {✓|⚠|⛔} Compliance    {status}
  {✓|⚠|⛔} Tests         {status}
  {✓|⚠|⛔} CI            {status}
  {✓|⚠|⛔} Velocity      {status}
  {✓|⚠|⛔} Runway        {status}
  {✓|⚠|⛔} IGNIS         {score · Nd old · run rescore if ≥7d}
  {✓|⚠}   Genome dims   {all stable / drop: dim X→Y}
  {✓|⚠|⛔} Entropy       {score (healthy/elevated/high)}
  {✓|⚠}   CDR Gap       {status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEXT MOVE    {specific recommended action}
  BLOCKERS     {open blockers or "None"}
  [SIL] FLAGS  {escalated items or "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IGNIS INSIGHT  ignisScore: {N}/100K ({TIER})
  Top pattern: {most relevant IGNIS pattern}
  Brainstorm rate: {brainstorm_conversion_rate}%  Intent rate: {intentCompletionRate}% (last 5)
  {One synthesised observation from portfolio/IGNIS_CORE.md — velocity trend, engagement gap,
   creative drift, stall pattern, runway warning, or applicable canon decision.
   Write "— insufficient data (UNTRACKED)" if no project entry.}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CANON CHECK    {Canon decision relevant to this session's planned work — or "none applicable"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### DASHBOARD sources  *(all from files already loaded — no extra reads)*

| Field | Source |
|---|---|
| SIL bar · Avgs · FLOW · sparkline | `SELF_IMPROVEMENT_LOOP.md` Rolling Status header |
| Days since | `Last session:` date vs today |
| IGNIS score | `context/PROJECT_STATUS.json` → `ignisScore` |
| TRUTH / Genome | `context/TRUTH_AUDIT.md` (or `unknown` if absent) |
| Compliance count | `context/CURRENT_STATE.md` |
| Context age (Ctx) | `Last updated:` date in `context/CURRENT_STATE.md` vs today |
| CDR Gap | Last entry date in `docs/CREATIVE_DIRECTION_RECORD.md` vs `Last updated:` in `context/LATEST_HANDOFF.md` |
| Prediction row | `docs/SESSION_PLAN.md` → `generated-at` comment; if < 48h: show predicted SIL range + trend + scope cap. Rendered automatically by `render-startup-brief.mjs`. |

**SIL bar:** 20 chars · █ per 25 pts · ░ remainder

**SIGNALS thresholds:**
- Compliance: ✓ 20/20 · ⚠ >15 · ⛔ ≤15
- Tests: ✓ passing + delta ≥0 · ⚠ delta <0 · ⛔ failing · *omit if N/A*
- CI: ✓ green · ⚠ unknown · ⛔ failing
- Velocity: ✓ ≥2 or ↑ · ⚠ 1 stable · ⛔ 0 or ↓
- Runway: ✓ >4 · ⚠ 2–4 · ⛔ ≤2
- CDR Gap: ✓ last CDR entry date ≥ last LATEST_HANDOFF date · ⚠ CDR predates LATEST_HANDOFF (gap — flag and recover at closeout)
- Context age: ✓ CURRENT_STATE ≤ 7 days · ⚠ 8–14 days · ⛔ >14 days (shown in FLOW Ctx field)

**IGNIS INSIGHT:** Read only the project section in `portfolio/IGNIS_CORE.md`. Pull ignisScore, grade, brainstorm_conversion_rate, and one project-specific observation. If synthesis is older than `PROJECT_STATUS.json → ignisLastComputed` or flagged stale by truth audit, label it explicitly as stale. Write `UNTRACKED` if no project entry exists.

**CANON CHECK:** Scan `docs/STUDIO_CANON.md` for decisions relevant to this session's planned work. Surface at most 1–2. Optional — skip if not working on protocol, templates, or initiation.

---

## 7 · Session Intent

If the user did not provide a session goal, ask:

> **"What is the primary goal for this session?"** (one sentence)

Log the declared intent in `context/LATEST_HANDOFF.md` under `Session Intent:`.

**Scope check** — immediately after logging intent:
- Count open Now items + work implied by the declared intent
- Compare to avg velocity in Rolling Status header
- If declared scope > 2× recent avg velocity → flag: "⚠ Scope may exceed one session (velocity avg: {N}). Consider splitting or tracking as partial intent."
- If avg velocity = 0 → note: "No recent velocity baseline — scope is uncertain; track partial completion explicitly."

**Key rules:**
- SPARKED projects must have staging before deploying. See `docs/STAGING_PROTOCOL.md`.
- Every public-facing project needs VaultSpark Studios branding. See CANON-006 in `docs/STUDIO_CANON.md`.
