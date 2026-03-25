# Latest Handoff

Last updated: 2026-03-24

This is the authoritative active handoff for Gridiron GM.

## What was completed

### This session (2026-03-24 — backlog clearance)

- **Injury depth chart** (gridiron-gm):
  - `DepthChartView` component — grid by POS, sorted by ovr, ST/BK/INJ labels
  - `DC_S` starter counts per position (e.g. WR:3, DL:4, LB:3)
  - Toggle on Roster tab: "Roster" | "Depth Chart" buttons
  - Injured starters show INJ label + weeks remaining; opacity 0.45

- **Save/load game state** (gridiron-gm):
  - `saveGame()` — JSON.stringify of full state blob (teams, sched, picks, season, user, week, phase); triggers Blob download
  - `loadGame(file)` — FileReader JSON parse; restores all state keys; calls setPhase/setTeams/etc.
  - 💾 and 📂 buttons in header; 📂 LOAD GAME on splash screen

- **4th-down decision UI** (gridiron-gm):
  - Pre-play panel appears when `liveDown===4 && !fourthChoice`
  - Punt: resolves as turnover via `genLivePlay("punt")`
  - FG: gated to yard ≥52 AND kicker available; kicker name+OVR shown; made probability from kicker OVR
  - Go For It: sets `fourthChoice="goforit"`, shows normal call grid

- **Defense sub-positions** (gridiron-gm-play FieldScene):
  - Dot labels changed: DE/DT (was DL/DL), MLB/OLB (was LB/LB), FS (was S)

- **Drive chart in GameOverScene** (gridiron-gm-play):
  - Reads `state.drives[]`, two-column layout (team left, opp right)
  - Color-coded: green=TD, red=INT/FUM, gray=DOWNS/PUNT

- **Drive tracking in FieldScene** (gridiron-gm-play):
  - `state.currentDrive` tracks user possession; pushed to `state.drives` on TD, turnover, or DOWNS
  - AI drives tracked via `_aiDrivePlays/_aiDriveYards/_aiDriveStart` instance props

- **CI workflow** (gridiron-gm-play):
  - `.github/workflows/ci.yml` — push/PR to master, Node 22, `npm ci && npm run build`

### Prior sessions

- v3.2: Sim Draft, PlayerTable, FA Overhaul, Clickable Box Scores, Live Sim with SVG field
- v3.3–v3.6: Interactive play-calling, coaching system, salary cap, QTE gameplay
- Track 2 (Phaser): Full P1–P5 play module; AI possession; sound; GM Bridge full loop
- OL sub-positions (LT/LG/C/RG/RT): both repos updated same session
- Studio OS: Applied full studio structure to both repos

## What is mid-flight

- Both repos committed, not yet pushed

## What to do next

1. OG image `public/images/cover.png` for social sharing (requires design asset)
2. Special teams in Phaser
3. BootScene matchup card (LT vs top DE, QB vs top CB)

## Constraints

- ALL changes to src/App.jsx must be ADDITIVE — no removals without explicit approval
- Single-file React: everything in `src/App.jsx`, inline styles, no external deps
- Match compact/minified code style
- Bridge keys `gm_roster_export` / `gm_game_result` locked — update both repos together

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
