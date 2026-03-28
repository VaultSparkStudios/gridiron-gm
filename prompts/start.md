<!-- template-version: 2.0 -->
<!-- synced-from: studio-ops/prompts/start.md @ Session 19 (2026-03-28) -->
# ── START ────────────────────────────────────────────────────────────────────
# Use this when the user says only `start`.
# ─────────────────────────────────────────────────────────────────────────────

## Phase 0 — Session Lock + Mode Declaration

**First action — write session lock:**
Create `context/.session-lock` with content:
```
locked_by: agent-session
session_start: YYYY-MM-DDTHH:MM:SSZ
project: {project-slug}
```
This prevents studio-ops (or any cross-repo agent) from writing to this project while a session is active.
The lock is cleared at closeout. If a lock file already exists from a prior session, overwrite it (stale lock).

**Then determine session mode:**

| Mode | Trigger | Focus |
|---|---|---|
| **BUILDER MODE** | Default (no qualifier) | Deep work on this project only |
| **FOUNDER MODE** | User says "start: founder mode" | Cross-project strategy; reads STUDIO_BRAIN.md first |

In **Builder Mode:** read only project files. Skip STUDIO_BRAIN.md unless a specific studio flag
is relevant to this session.

In **Founder Mode:** read `portfolio/STUDIO_BRAIN.md` first for studio-wide context, then
proceed with project files.

---

## Phase 1 — Initiation Type Detection

Check `context/SELF_IMPROVEMENT_LOOP.md`:

| Condition | Type | Action |
|---|---|---|
| File missing or no dated entries | **A — Bootstrap** | Follow `prompts/initiate.md` — do not proceed with Phase 2 |
| 1 entry labeled "Bootstrap Baseline" / "Foundation Baseline" and core files are still template-only | **B — Foundation** | Follow `prompts/initiate.md` Section B |
| 2+ dated entries with real scores | **C — Returning** | Continue with Phase 2 |

---

## Phase 2 — Load Context

Read in this exact order. Do not skip or reorder.

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
| 9 | `context/SELF_IMPROVEMENT_LOOP.md` — **header only** | Rolling Status block: sparkline, averages, last scores. No need to read full entry history. |
| 10 | Task-specific files | Only after all above are read |

**Founder Mode only:** Also read `portfolio/STUDIO_BRAIN.md` (read between steps 9 and 10).

---

## Phase 3 — SIL Escalation Check

After reading the SIL Rolling Status header:

- Note the sparkline — is the 5-session trajectory up down flat?
- Note rolling averages — which category is the lowest? Flag if any avg is below 5.0
- Identify any `[SIL]` items on TASK_BOARD not yet actioned
- **If a `[SIL]` item was skipped 2+ sessions → escalate to Now on TASK_BOARD and flag in brief**
- Surface the top unactioned brainstorm idea from the last SIL entry

**Studio benchmarking (no extra reads required):**
If STUDIO_BRAIN.md has been read (Founder Mode), note in brief:
> Studio avg SIL: [X]/50 · This project last session: [X]/50 [up/down/flat vs studio avg]

---

## Phase 4 — Startup Rules

- Treat repo files as source of truth — not prior chat memory
- Do not edit code during startup unless user immediately asks for implementation
- Use `context/LATEST_HANDOFF.md` as the active handoff source
- Treat any other handoff docs as historical context only
- Note any assumptions before acting on them
- **If resuming from a compacted/interrupted session:** check whether the prior session's human
  direction was recorded in `docs/CREATIVE_DIRECTION_RECORD.md`. If the last CDR entry predates
  work described in LATEST_HANDOFF.md, flag the gap in the startup brief and recover it at
  next closeout.
- **Momentum Runway enforcement:** If the last computed Momentum Runway (from SIL Rolling Status
  or LATEST_HANDOFF.md) is <= 2.0 sessions, this session MUST begin with TASK_BOARD pre-loading
  before any feature or protocol work. Add items to the Now bucket first. Surface this as the
  first item in PRIORITIES in the startup brief. Do not skip this step.

---

## Phase 5 — Output: Startup Brief

Reply using this exact structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STARTUP BRIEF — {Project Name}
  {YYYY-MM-DD} · Session {N} · {BUILDER / FOUNDER MODE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  IDENTITY     {type} · {status} · {owner}
  STATE        {current phase and overall health}
  PRIORITIES   Now: {task} · Next: {task}
  CONSTRAINTS  {key constraints or limits}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHERE WE LEFT OFF  (Session {N-1})
  Shipped    {N improvements across N groups — group1, group2, ...}
             {or: "N tasks completed" if no improvement groups defined}
  Tests      {N passing (N core / N server / N client) · delta: +N/-N}
             {or: "N/A" if project has no test suite}
  Deploy     {deployed to {env} · auto-deploy active / manual / N/A}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DASHBOARD
  SIL          {total}/50 · Avgs — 3: {n.n} | 5: {n.n} | 10: {n.n} | 25: — | all: {n.n}
  IGNIS        {n}/100 ({GRADE}) · Compliance: {n}/{total}
  Velocity: {N} · Debt: {up/down/flat} · Runway: ~{n.n} sessions
  SPARKLINE    {sparkline bars} (last 5 sessions)

  Dev Health        {n}/10  {arrow}  3-avg: {n.n}
  Creative Align    {n}/10  {arrow}  3-avg: {n.n}
  Momentum          {n}/10  {arrow}  3-avg: {n.n}
  Engagement        {n}/10  {arrow}  3-avg: {n.n}
  Process Quality   {n}/10  {arrow}  3-avg: {n.n}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEXT MOVE    {specific recommended action}
  BLOCKERS     {open blockers or "None"}
  [SIL] FLAGS  {escalated items or "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IGNIS INSIGHT  ignisScore: {N}/100 ({GRADE})
  Top pattern: {most relevant IGNIS pattern for this project}
  Brainstorm rate: {brainstorm_conversion_rate}% ({status})
  {One synthesised observation from portfolio/IGNIS_CORE.md
   specific to this project — e.g. velocity trend, engagement
   gap, creative drift signal, stall pattern warning, momentum
   runway warning, or canon decision applicable this session.
   Write "— insufficient data (UNTRACKED)" if no project entry.}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CANON CHECK    {Any STUDIO_CANON.md decision relevant to this session's planned work — one line or "none applicable"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WHERE WE LEFT OFF** data comes from `context/LATEST_HANDOFF.md` — the closeout protocol
writes it there. If no prior session exists, omit the section entirely.

**DASHBOARD** data sources (no extra file reads — all from files already loaded in Phase 2):
- `SIL` + `Avgs` → from Rolling Status header in `context/SELF_IMPROVEMENT_LOOP.md` (already read)
- `IGNIS` → from `context/PROJECT_STATUS.json` `ignisScore` field (already read via CURRENT_STATE)
- `Compliance` → from `context/CURRENT_STATE.md` compliance count (already read)
- `Velocity` / `Debt` / `Runway` → from Rolling Status header (already read)

**IGNIS INSIGHT** data comes from `portfolio/IGNIS_CORE.md` — read only the project-specific
section (search for the project slug). Pull: ignisScore, grade, brainstorm_conversion_rate,
top relevant pattern, and project-specific insight line. Do not read the full file.
If the file does not exist or has no entry for this project, write "— insufficient data (UNTRACKED)."

**CANON CHECK** data comes from `docs/STUDIO_CANON.md` — scan for any canon decisions relevant
to the current session's planned work. Surface at most 1–2. Omit if none apply.
Reading STUDIO_CANON.md is optional — only needed if working on protocol, templates, or initiation.

---

## Phase 6 — Session Intent Declaration

After delivering the startup brief, ask:

> **"What is the primary goal for this session?"** (one sentence)

Log the declared intent in `context/LATEST_HANDOFF.md` under a `Session Intent:` field at the top.
This is checked and logged at closeout.
