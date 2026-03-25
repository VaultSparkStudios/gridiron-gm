# Latest Handoff

Last updated: 2026-03-25 (session 12 — full backlog clear)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v6.1 / P36–P43)

### gridiron-gm — v6.1 (App.jsx)

**Fan Satisfaction Meter**
- `fanSat` state (0–100, starts 50); +8 win / +15 playoff win / +5 star FA signed; -10 loss / -5 cut OVR≥80 / -3 lose star to FA
- SP gain rate modifier: fanSat <30 = -1 SP/wk; >70 = +1 SP/wk
- Color bar (red/yellow/green) in standings tab header + schedule tab

**Trade Deadline AI Buy/Sell Mode**
- `_aiTradeMode` useMemo: weeks 10-11 regular season only
- Buyers (wins≥6): +15% value in trade offers; Sellers (wins≤4): accept -20% value
- "TRADE DEADLINE ACTIVE" banner + ▲/▽ buyer/seller tags on AI team buttons in trade tab

**Scouting Budget Allocation**
- `scoutBudget: { speed:1, scheme:1, injury:1, combine:1 }` state (sum=5, preseason only)
- +/- UI in scouting tab; accuracy multipliers applied in scout reveal logic

**Coaching Hire Market**
- `coachMarket` state — 5-8 coaches per season; `genCoachMarket()` at newSeason
- "COACH MARKET" section in coaching tab; SP-cost hire buttons; fired coaches re-enter pool

**Stadium Upgrades**
- `stadium: { lvl:0, upgrades:[] }` state; `buyStadium(key)` function
- 3 tiers: crowd noise (1SP), premium turf (2SP), expanded capacity (3SP)
- Effects: simGame AI rating penalty, injury rate reduction, seasonal SP bonus

**Practice Squad Call-Up**
- `callUpPS(pid)` — moves PS player to main roster; 1SP; sets `p.psCallUp=true` / `p.callUpWk=wk`
- Auto-return at simWk start if wk >= callUpWk + 3
- "↑ Call Up (1SP)" button in PS view, in-season only

**Multi-Year Owner Goal History**
- `ownerGoalHistory[]` + `ownerGoalStreak` state
- Push result at wk18 eval; +2 SP dynasty bonus at 3 consecutive met; last 3 shown in schedule tab

---

### gridiron-gm-play — P43 (FieldScene.js)

**P36: Pick-Six Return** — phase `pick_six_return`; DB (cb1) controlled by user; lb/lb2 as blockers; qb/rb/wr1 pursue; TD at x<FIELD_LEFT+10
**P37: Onside Kick** — enhanced post-score modal; 1.2s rapid-tap RECOVER!; ≥3 taps = recovery bonus
**P38: QB Scramble Spin Move** — SPIN button DL <40px during `pass_wait`; `_spinUsed` flag; 70% break / 30% sack
**P39: Fake Punt/Fake FG** — modal before punt/FG; FAKE IT / REAL KICK; 3s auto-dismiss to real
**P40: Goal Line QB Sneak** — yardLine≥94 & toGo≤1 on runs; PUSH! mash 4/0.8s; QB x+15 tween
**P41: Drive Momentum Meter** — `_momentum` 0-100; `_momentumBar` + `_momentumText` HUD; ±comp modifier
**P42: Challenge Flag** — `_challengeUsed` per game; `_prePlayState` snapshot; 45% overturn; 4s dismiss
**P43: 4th Quarter Comeback Mode** — `_comebackMode`; trailing 7+ Q4; +3% comp; AI false start +5%; banner

---

## What is mid-flight

Nothing. Both builds clean and committed.

---

## What to do next (priority order)

1. Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
2. Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
3. New backlog items TBD — all current features complete

---

## Constraints

- ALL changes to `src/App.jsx` must be ADDITIVE
- Single-file React, inline styles, no external deps
- Compact/minified code style — match existing density
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- Save state fields: `v:2, yr, wk, sp, ui, teams, sched, byeMap, fa, dc, draftPicks, draftIdx, draftLog, log, champs, pb, myScout, faScouts, scPts, faCoaches, rivalry, ftag, waivers, fanSat, scoutBudget, coachMarket, stadium, ownerGoalHistory, ownerGoalStreak`
- New Phaser flags: `_spinUsed`, `_challengeUsed`, `_prePlayState`, `_momentum`, `_comebackMode`

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
