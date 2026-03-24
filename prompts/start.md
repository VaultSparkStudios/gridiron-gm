# Start Protocol — Gridiron GM

Run this at the beginning of every session.

## Steps

1. Read `AGENTS.md` for repo identity and rules
2. Read `context/CURRENT_STATE.md` for where things stand
3. Read `context/TASK_BOARD.md` for what needs to be done
4. Read `context/LATEST_HANDOFF.md` for what was last worked on
5. If doing game code work, read `HANDOFF.md` for full architecture reference

## Startup brief format

After reading the above, produce a concise startup brief:

```
## Session Start — Gridiron GM

**Status:** [one line]
**Last work:** [one line]
**Active tasks:** [bullet list from TASK_BOARD.md]
**Blockers:** [any blockers, or "none"]
**Ready to:** [what you can help with]
```

## Rules reminder

- ALL changes to src/App.jsx are additive — no removals without explicit user approval
- Single-file React, inline styles, no external deps
- Match existing compact/minified code style
- Never hardcode `/Gridiron-GM/` — use env var or lowercase slug
