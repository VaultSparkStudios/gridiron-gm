# Start Protocol

Use this when the user says only `start`.

## Read order

1. `AGENTS.md`
2. `context/PROJECT_BRIEF.md`
3. `context/SOUL.md`
4. `context/BRAIN.md`
5. `context/CURRENT_STATE.md`
6. `context/DECISIONS.md`
7. `context/TASK_BOARD.md`
8. `context/LATEST_HANDOFF.md`
9. `context/SELF_IMPROVEMENT_LOOP.md`
10. only then task-specific files

## Startup rules

- Treat repo files as source of truth, not prior chat memory
- Do not edit code during startup unless the user explicitly asks for implementation immediately
- Use `context/LATEST_HANDOFF.md` as the active handoff source
- Treat legacy handoff docs as historical context only
- Note assumptions clearly

## Self-Improvement Loop — startup check

After reading `context/SELF_IMPROVEMENT_LOOP.md`:
- Note the last audit scores and trajectory per category
- Identify any open brainstorm ideas not yet actioned
- Check if prior `[SIL]` TASK_BOARD commitments were completed
- If a `[SIL]` item appears skipped 2+ sessions in a row, flag it as **Now** on TASK_BOARD and note it in the Startup Brief

## Required startup output

Reply with a concise `Startup Brief` containing:

1. Project identity
2. Current state
3. Active priorities (including any flagged `[SIL]` escalations)
4. Important constraints
5. Last audit scores and dominant trajectory
6. Likely next best move
7. Blockers or ambiguities
