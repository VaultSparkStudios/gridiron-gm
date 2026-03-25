# Latest Handoff

Last updated: 2026-03-24

This is the authoritative active handoff for Gridiron GM.

## What was completed

### This session (2026-03-24 — P7: special teams + position fixes)

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

### This session (2026-03-24 — P7 + P8: special teams)

- **Position string fixes** (gridiron-gm-play):
  - `defaultRoster.js` DEFAULT_OPPONENT: DL→DE, LB→MLB, S→FS
  - `BootScene.js` matchup card: DE lookup now includes 'DL' fallback for old exports
  - `FieldScene.js`: 3 stale DL/LB lookups updated to DE/MLB with fallback

- **4th-down decision in PlayCallScene** (gridiron-gm-play):
  - `state.down === 4` triggers purple-bordered 4th-down panel instead of normal call grid
  - PUNT: always available — calls `_doPunt()` in FieldScene, possession flip
  - FIELD GOAL: range-gated at yardLine ≥ 62 (≤38-yard line); shows distance; calls `_attemptFG()`
  - GO FOR IT: clears panel, shows normal call grid in same scene (no relaunch)

- **FG attempt** (gridiron-gm-play FieldScene):
  - `_attemptFG()`: distance = (100-yardLine)+17 yards; success rate `max(0.18, min(0.96, 1.08-dist*0.013))`
  - Made: score.team+3, yardLine set for opponent's 20 after possession flip, green flash
  - Missed: red flash, opponent gets ball at LOS
  - Drive chart: 'FG' (green) or 'NO FG' (gray) entries in GameOverScene

- **PAT after user TD** (gridiron-gm-play FieldScene):
  - User TD now scores +6 (not +7); `_pendingPAT` flag set
  - `_afterPlay` intercepts before launching PlayCall; shows `_showPATChoice()` overlay
  - KICK PAT: +1 at 97% → `_resolvePAT('kick')`
  - GO FOR 2: +2 at 45% → `_resolvePAT('two')`
  - After PAT: opponent gets ball at their 25 (kickoff), AI drive starts

- **Kickoff return mini-game (P8)** (gridiron-gm-play FieldScene):
  - `_startKickoffReturn()` — game opens with user returning opening kickoff
  - `_launchKickoffReturn(catchYard)`: user RB catches at yardLine 8-14; 7 CVG defenders spread at midfield (38-68 yd range); user WASD to return; `_aiRushers` + `_aiCBsSupport` + saf convergence
  - `_startKickoffCover()` — after user TD+PAT or made FG: AI catches at yardLine 87-95, user defends (reuses existing `_startAIDrive`)
  - `_showKickoffFlash(msg, sub, cb)` — 1.3s black overlay with fade before play starts
  - Trigger map: game start → `_startKickoffReturn`; AI TD → `_startKickoffReturn`; user PAT done → `_startKickoffCover`; made FG → `_pendingKickoffCover` flag → `_startKickoffCover`
  - All stats/scoring/drive tracking unchanged — kickoff return IS a run play, chains into normal `_afterPlay`

### This session (2026-03-24 — P8 + mobile + progression visibility)

- **Mobile layout** (gridiron-gm-play):
  - `main.js`: added `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
  - `index.html`: `maximum-scale=1.0, user-scalable=no`; `touch-action:none`; `overflow:hidden`; canvas `max-width/max-height:100svh`
  - `FieldScene.js` D-pad: `sz = 44` (up from 34) for better touch targets

- **Player progression visibility** (gridiron-gm App.jsx):
  - `newSeason`: collects `expFAs` — expired-contract (contract=1) players age≤33, ovr≥42 enter FA pool with updated age/ovr
  - `newSeason`: `devL` array tracks OVR changes ≥+3 or ≤-2 across user team
  - `setFa([...expFAs,...genFA()])` — newly expired players prepend fresh FA market
  - Game log updated: `Dev: X+3 | Y-2 | ...` line (top 6) + `N notable FA(s) hit market` line
  - `PlayerTable`: `⬆` cyan badge after player name for age≤24, pot-ovr≥12 prospects

### Prior sessions

- v3.2: Sim Draft, PlayerTable, FA Overhaul, Clickable Box Scores, Live Sim with SVG field
- v3.3–v3.6: Interactive play-calling, coaching system, salary cap, QTE gameplay
- Track 2 (Phaser): Full P1–P5 play module; AI possession; sound; GM Bridge full loop
- OL sub-positions (LT/LG/C/RG/RT): both repos updated same session
- Studio OS: Applied full studio structure to both repos

## What is mid-flight

- gridiron-gm-play: P7 + P8 + mobile complete, not yet committed

## What to do next

1. OG image `public/images/cover.png` for social sharing (requires design asset)
2. Commit gridiron-gm-play (P7 + P8 + mobile)
3. Commit gridiron-gm (progression visibility + dev badge)

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
