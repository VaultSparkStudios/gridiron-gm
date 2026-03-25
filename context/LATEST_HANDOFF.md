# Latest Handoff

Last updated: 2026-03-25 (session 9 — final closeout)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (batch 8 — moves 36-38)

### gridiron-gm — v5.7 (App.jsx)

**Move 36 — Salary Cap Penalties**
- At start of `simWk`: loop all teams; if `capHit(t) > CAP_CEILING` → `t.deadCap += 5`
- User team additionally loses first owned 3rd-round draft pick (if any); logged `⚠️ CAP VIOLATION`
- CPU teams silently receive dead cap fine only
- Roster tab: red warning banner when `capSpace(ut) < 0` — "⚠️ OVER THE CAP — $5M fine + 3rd-round pick at next simWk"

**Move 37 — Coaching Contract Expiry**
- `genCoach()`: added `contract: R(1,3)` to all new coaches
- `newSeason()`: decrements each coach contract by 1; at 0 → push to `faCoaches` with fresh 1-2yr deal, null from team; user expirations logged `📋 CONTRACT EXPIRED`
- `CoachCard`: shows `[N]yr left` (red when ≤1)
- `reSignCoach(role)`: preseason only, costs 1 SP, +2yr
- Re-sign button on CoachCard when `sp==="preseason" && coach.contract<=1`

### gridiron-gm-play — P28 (FieldScene.js)

**Move 38 — P28 Red Zone Fade Route**
- `_onPlayCalled()`: intercepts `pass_*` when `state.yardLine <= 15 && !this._noHuddleActive` → `_showFadeOption(callId)`
- `_showFadeOption(callId)`: 2-button modal (NORMAL PASS / FADE ROUTE); auto-dismisses to normal pass after 3s
- `_startFadeRoute()`: hides all, shows QB/WR1/CB1; WR+CB at endzone corner `(yardToX(2), FIELD_Y+10)`; ball arcs over 1100ms; "🤲 CATCH!" button appears at 900ms; resolves at 1400ms
- `_resolveFade(caught)`: if not caught → incomplete; if caught → WR vs CB OVR contest (40-85%); TD `+6 + recTD stat` or "KNOCKED AWAY"
- `this._noHuddleActive=false; this._fadeEls=null` added to `create()` init

---

## What is mid-flight

Nothing. Both builds clean and committed.

---

## What to do next (priority order)

1. **GM: Player holdout effect** — holdout players (from morale events) skip simPG lineup; simGame OVR contribution zeroed
2. **P29: Trick play** — reverse/flea flicker option in play call; intercepts `run_*` occasionally; surprise yards bonus
3. **GM: Salary cap forecast improvements** — expiring contracts list below cap forecast + projected space with/without re-signing top players

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
- Injury fields: `p.injured`, `p.injWk`, `p.injType`, `p.injSev`, `p.injRecWks`
- Coach fields: `coach.contract` (years remaining, default 2 if missing)

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
