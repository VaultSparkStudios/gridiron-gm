# Closeout Protocol

Use this when the user says only `closeout`.

## Required write-back

If meaningful work happened, update in this order:

1. `context/CURRENT_STATE.md`
2. `context/TASK_BOARD.md`
3. `context/LATEST_HANDOFF.md`
4. `logs/WORK_LOG.md`
5. `context/DECISIONS.md` — when reasoning changed
6. `context/SELF_IMPROVEMENT_LOOP.md` — MANDATORY (see below)
7. `docs/CREATIVE_DIRECTION_RECORD.md` — MANDATORY if human gave any creative direction this session
8. Any project-type or repo-specific files whose truth changed

## Self-Improvement Loop — closeout (mandatory)

Append a new entry to `context/SELF_IMPROVEMENT_LOOP.md`:

### Step 1 — Score

Rate each category 0–10:

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | | | code quality, CI, debt |
| Creative Alignment | | | adherence to SOUL.md + CDR |
| Momentum | | | velocity, milestone progress |
| Engagement | | | community / user signals |
| Process Quality | | | handoff freshness, Studio OS compliance |
| **Total** | **/ 50** | | |

### Step 2 — Reflect

- **Top win this session:**
- **Top gap this session:**

### Step 3 — Brainstorm

Generate 3–5 innovative solutions, features, or improvements. Push past the obvious. Consider:
- What would make this 10x more engaging?
- What's the one thing players/users keep asking for?
- What technical debt is silently costing velocity?
- What creative direction has drifted from the SOUL?
- What competitive move would surprise and delight?

### Step 4 — Commit

Pick 1–2 brainstorm items. Add them to `context/TASK_BOARD.md` labeled `[SIL]`.

## Creative Direction Record — closeout check

Review the session. Did the human give any:
- Creative direction (features, feel, scope)?
- Feature assignments or explicit goals?
- Brand, tone, visual, or quality guidance?
- Any "do this / don't do this"?

If yes → append to `docs/CREATIVE_DIRECTION_RECORD.md` (ADDITIVE ONLY, never edit existing entries).

## Required closeout output

Reply with a concise `Session Closeout` containing:

1. What was completed
2. Files changed
3. Validation status
4. Self-Improvement Loop summary (scores, top win, top gap, brainstorm highlights, committed items)
5. Open problems
6. Recommended next action
7. Exact files the next agent should read first
