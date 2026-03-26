# ── START ────────────────────────────────────────────────────────────────────
# Use this when the user says only `start`.
# ─────────────────────────────────────────────────────────────────────────────

## Phase 1 — Load Context

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
| 9 | `context/SELF_IMPROVEMENT_LOOP.md` | Last audit scores + open brainstorm items |
| 10 | Task-specific files | Only after all above are read |

---

## Phase 2 — SIL Escalation Check

After reading `context/SELF_IMPROVEMENT_LOOP.md`:

- Note last audit scores and trajectory (↑ ↓ →) per category
- Identify any `[SIL]` items on TASK_BOARD not yet actioned
- **If a `[SIL]` item was skipped 2+ sessions → escalate to Now on TASK_BOARD and flag in brief**
- Surface the top unactioned brainstorm idea from the last SIL entry

---

## Phase 3 — Startup Rules

- Treat repo files as source of truth — not prior chat memory
- Do not edit code during startup unless user immediately asks for implementation
- Use `context/LATEST_HANDOFF.md` as the active handoff source
- Treat any other handoff docs as historical context only
- Note any assumptions before acting on them

---

## Phase 4 — Output: Startup Brief

Reply using this exact structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STARTUP BRIEF — {Project Name}
  {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  IDENTITY     {type} · {status} · {owner}
  STATE        {current phase and overall health}
  PRIORITIES   Now: {task} · Next: {task}
  CONSTRAINTS  {key constraints or limits}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LAST AUDIT   {total}/50 · {date}

  Dev Health        {n}/10  {↑↓→}
  Creative Align    {n}/10  {↑↓→}
  Momentum          {n}/10  {↑↓→}
  Engagement        {n}/10  {↑↓→}
  Process Quality   {n}/10  {↑↓→}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEXT MOVE    {specific recommended action}
  BLOCKERS     {open blockers or "None"}
  [SIL] FLAGS  {escalated items or "None"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After the brief, ask: **"What are we working on today?"**
