# Closeout Protocol — Gridiron GM

Run this at the end of every meaningful session.

## Steps

1. Update `context/CURRENT_STATE.md` — snapshot current state
2. Update `context/TASK_BOARD.md` — mark completed items, add new backlog items discovered
3. Append to `context/DECISIONS.md` — record any architectural or design decisions made
4. Update `context/LATEST_HANDOFF.md` — what was done, what's mid-flight, what's next
5. Append to `logs/WORK_LOG.md` — session summary with date
6. Append to `docs/CREATIVE_DIRECTION_RECORD.md` if any human creative direction was given

## Closeout summary format

```
## Session Closeout — Gridiron GM — YYYY-MM-DD

**Completed:**
- item

**Mid-flight:**
- item (or "none")

**Next session should:**
1.
2.

**Build status:** [passes / fails]
```

## Build check

Before closing out, verify:

```bash
npm run build
```

If it fails, fix it before closing the session.
