# Latest Handoff

Last updated: 2026-03-25 (session 7 — final closeout)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (batch 6 — moves 30-32)

### gridiron-gm — v5.5 (App.jsx)

**Move 31 — Coaching Staff Upgrades**
- `upgradeCoach(role)` function: costs 2 SP, raises `coach.rating` +5 (max 95), deducts `scPts`, logs
- `CoachCard` UI updated: Fire + Upgrade buttons stacked; upgrade disabled if scPts<2 or rating≥95

**Move 32 — Waiver Wire System**
- `waivers` state added; included in saveGame/loadGame
- `releaseP`: during `sp==='regular'`, sends to `waivers` with `waiverWk` stamp instead of `fa`
- `simWk` waiver processing: CPU teams sorted by `t.w` asc (worst first); 60% claim chance per player if under position quota; unclaimed → `fa`; `setWaivers([])` after
- `startGame` + `newSeason`: `setWaivers([])`
- FA tab: amber "WAIVER WIRE (N)" section above FA table; Claim button calls `signP` + removes from waivers

### gridiron-gm-play — P26 (FieldScene.js)

**Move 30 — P26 Two-Point Conversion Mini-Game**
- `_showPATChoice()` GO FOR 2 callback → `_startTwoPointPlay()` (subtitle updated to "MINI-GAME")
- `_startTwoPointPlay()`: hides all, shows qb/wr1/dl; positions at yards 5/3/8; displays banner + countdown; sets `this.phase = 'two_point'`; `_tpTimer = 3500`
- `update()` `two_point` phase: WASD moves QB (copied from run phase); DL pursues at 55px/s; win = qb.x ≤ yardToX(0)+8; tackle = distance < 16; timer expire = fail
- `_resolveTwoPoint(success, reason)`: clears phase, awards pts, `_tdFlash`, then PAT post-flow → `_showKickoffChoice`

---

## What is mid-flight

Nothing. Both builds clean and committed.

---

## What to do next (priority order)

1. **GM: Player morale events** — 1-2 random weekly triggers per team: trade request, holdout, leadership boost; shown in log
2. **P27: Pass rush mini-game** — on AI pass plays, user can tap to control a DL rusher; pressure reduces pass accuracy, sack ends play
3. **GM: Injury severity tiers** — minor (1-2 wk), moderate (3-5 wk), major (6-8 wk → auto IR); replace flat injury bool

---

## Constraints

- ALL changes to `src/App.jsx` must be ADDITIVE
- Single-file React, inline styles, no external deps
- Compact/minified code style — match existing density
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- Save state fields: `v:2, yr, wk, sp, ui, teams, sched, byeMap, fa, dc, draftPicks, draftIdx, draftLog, log, champs, pb, myScout, faScouts, scPts, faCoaches, rivalry, ftag, waivers`
- `ir[]` is part of each team object — saved/loaded automatically with teams
- `sp` = season phase string; `scPts` = staff points (number)
- Score fields in FieldScene: `state.score.opp` (AI), `state.score.team` (user)

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
