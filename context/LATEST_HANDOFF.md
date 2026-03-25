# Latest Handoff

Last updated: 2026-03-25 (session 8 — final closeout)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (batch 7 — moves 33-35)

### gridiron-gm — v5.6 (App.jsx)

**Move 33 — Player Morale Events**
- 3 event types fire per team each week during regular season (alongside LKR_EVENTS)
- **Trade Request** (5%): OVR ≥ 80, conf < 35 → conf -15, morale -5; log `🔁 TRADE REQUEST`
- **Holdout** (4%): contract=1, OVR ≥ 75 → conf -12, morale -4; log `✋ HOLDOUT`
- **Leadership Boost** (7%): OVR ≥ 85, conf > 65 → morale +6, all OVR ≥ 75 players conf +5; log `⭐ LEADERSHIP`
- Events collected in `moraleEvLogs[]`, flushed to `setLog` at end of `simWk`

**Move 34 — Injury Severity Tiers**
- `injSev` ("minor"/"moderate"/"major") and `injRecWks` (total weeks out) added to players
- simGame injury roll: 40% minor (1-2 wk), 40% moderate (3-5 wk), 20% major (6-8 wk)
- simWk: major injuries auto-placed on IR if space (< 8); logged as `🚑 MAJOR INJURY`
- simWk recovery: counts down `injWk` by 1 per week, clears injury at 0
- Player modal: `[injType] — [injSev] ([N]wk remaining)` display
- `newSeason`: clears `injSev:""` and `injRecWks:0` on all roster players

### gridiron-gm-play — P27 (FieldScene.js)

**Move 35 — P27 Pass Rush Mini-Game**
- `_startAIPass()`: stores throw timer as `_rushThrowTimer`; spawns orange "⚡ BLITZ" button (top-right, 720ms window)
- `_activatePassRush()`: cancels 720ms timer, reschedules `_checkRushResult()` at 1500ms, sets `_passRushMode=true`, shows rush hint
- `update()` `ai_pass` block: speed +12px/s when `_passRushMode` is true
- `_checkRushResult()`: dist < 22 → SACK (+state.stats.team.sacks, -5-12 yds); else → `_passRushCoverBreak=true`, normal throw
- `_resolveAIPass()`: INT threshold -20 when `_passRushCoverBreak` (coverage broken); flag cleared after

---

## What is mid-flight

Nothing. Both builds clean.

---

## What to do next (priority order)

1. **GM: Salary cap penalties** — exceeding cap triggers $5M dead cap fine + loss of 3rd-round pick next draft
2. **P28: Red zone fade route** — inside 15yd, play call option; user WR jump timing vs CB; ball arc to corner
3. **GM: Coaching contract expiry** — coaches have 1-3yr deals; re-sign preseason or lose to FA

---

## Constraints

- ALL changes to `src/App.jsx` must be ADDITIVE
- Single-file React, inline styles, no external deps
- Compact/minified code style — match existing density
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- Save state fields: `v:2, yr, wk, sp, ui, teams, sched, byeMap, fa, dc, draftPicks, draftIdx, draftLog, log, champs, pb, myScout, faScouts, scPts, faCoaches, rivalry, ftag, waivers`
- `ir[]` is part of each team object — saved automatically
- `sp` = season phase string; `scPts` = staff points (number)
- Score fields in FieldScene: `state.score.opp` (AI), `state.score.team` (user)
- Injury fields: `p.injured` (bool), `p.injWk` (recovery countdown), `p.injType` (string), `p.injSev` (severity), `p.injRecWks` (total weeks)

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
