# Agent Instructions — Gridiron GM

## Repo identity

- Repo name: `gridiron-gm`
- GitHub: `VaultSparkStudios/Gridiron-GM`
- Public URL: `https://vaultsparkstudios.com/gridiron-gm/`
- Type: browser-based football GM simulation game (single-file React, no backend)
- Studio: VaultSpark Studios
- **Companion repo:** `gridiron-gm-play` — Phaser 3 gameplay engine; these two repos form one combined product

## Dual-repo contract

This GM app exports franchise data to `gridiron-gm-play` and imports results back via localStorage:
- `gm_roster_export` — this app writes; Play reads on boot
- `gm_game_result` — Play writes; this app reads in `importPlayResult()`
- **Never change bridge key names without updating both repos in the same session**

## Read order

1. `context/PROJECT_BRIEF.md`
2. `context/SOUL.md`
3. `context/BRAIN.md`
4. `context/CURRENT_STATE.md`
5. `context/DECISIONS.md`
6. `context/TASK_BOARD.md`
7. `context/LATEST_HANDOFF.md`

## Non-negotiable rules

- ALL changes to `src/App.jsx` must be ADDITIVE — never remove existing features without explicit user approval
- Single `.jsx` file architecture — all logic stays in `src/App.jsx`, all styles inline, no external deps beyond React
- Match the existing compact/minified code style in `src/App.jsx`
- Never hardcode `/Gridiron-GM/` as the base path — use `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"`

## Session aliases

If the user says only `start`, follow `prompts/start.md`.

If the user says only `closeout`, follow `prompts/closeout.md`.

## After meaningful work

1. Update `context/CURRENT_STATE.md`
2. Update `context/TASK_BOARD.md`
3. Append to `context/DECISIONS.md` for any architectural decisions
4. Update `context/LATEST_HANDOFF.md`
5. Append to `logs/WORK_LOG.md`

## Escalate before changing

- Removing or replacing existing game features
- Public URL or slug
- Deployment workflows
- Canon game data (team names, positions, salary structures)

## Key files

- `src/App.jsx` — live source (v3.6+, ~900 lines)
- `gridiron-gm-v3.1-stable.jsx` — stable v3.1 backup (do not delete)
- `HANDOFF.md` — full game architecture reference
- `context/LATEST_HANDOFF.md` — active session handoff
- `docs/STUDIO_DEPLOYMENT_STANDARD.md` — deployment rules
