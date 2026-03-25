# Current State

## Snapshot

- Date: 2026-03-25
- Overall status: Live on GitHub Pages, active development
- Current version: v6.0 (gridiron-gm) / P35 (gridiron-gm-play) — both builds clean
- Studio OS: Fully compliant

## What exists

### Franchise simulation (gridiron-gm)

- Full roster management (OL sub-positions: LT/LG/C/RG/RT)
- NFL Draft — 7 rounds, 224 picks, modern analytics pick value chart, 2-min timer, AI auto-pick, Sim Draft
- Free agency — sign/release, salary/contract; AI FA signings on season rollover
- Waiver Wire — `waivers[]`; regular-season releases queue; CPU worst-record-first claims; saved
- Scouting — hireable scouts, 3-year draft lookahead, Scout Report Depth panel (`scGrade()`)
- Trading — players + picks, fairness eval; trade surge wk 8-10; deadline wk 10
- Live Sim — play-by-play SVG field, Player of the Game, box scores
- Game simulation — per-player stats, passer rating, AV, season/career tracking
- Weekly Game Plan, Morale/Chemistry, Player Confidence, GM Reputation (5 tiers)
- Opponent Scouting Report, Practice Squad (max 10), IR (max 8 per team)
- Contract re-signing, restructure, franchise tag, mid-season extension (1 SP)
- **Coaching & scheme system** — OC/DC/ST; coaching upgrades (2 SP → +5 rating)
- **Coaching Contract Expiry** — coaches have `contract` (1-3yr); `newSeason` decrements; auto-fired to faCoaches; Re-sign +2yr (1SP) preseason
- Division/Conference Standings, Wild Card Seeding, Rivalry System, Playoff Picture
- Player Aging/Decline, Breakout Seasons, AI Cap Management, FA Mid-Season Refresh
- Season awards, Career stats, Cap space forecast, Draft grade report
- Preseason games, Rookie dev camp, Coaching hot seat, Trade deadline surge
- **Player Morale Events** — trade request / holdout / leadership boost per week
- **Player Holdout Effect** — `p.holdout=true`; cleared at simWk start + on re-sign; excluded from teamStr/simGame
- **Injury Severity Tiers** — minor/moderate/major; major → auto IR; modal shows wk remaining
- **Salary Cap Penalties** — over $200M at simWk: +$5M dead cap + 3rd-round pick forfeit; red warning banner
- **Cap Forecast Improvements** — expiring contracts top 6 by OVR with est. ask; keep-all/cut-all projected space
- **Trade Request Resolution** — morale event sets `p.tradeRequest=true`; banner with Negotiate (1SP) or Find Trade
- **Owner Goals** — adaptive win target per season, evaluated wk 18, banner in schedule tab; resets each season
- **League News** — collapsible section in log tab, generated from sim results/events each week
- **Training Camp Focus** — preseason only; 2SP to boost 1 player attribute (+1); marks `trainedThisCamp`
- **Contract Negotiation Modal** — Negotiate button in preseason re-sign; counter-offer / midpoint / walk away
- **Draft Scout (1SP)** — lighter-accuracy scout button on active draft tab player rows

### POS system
- `POS = ["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"]`

### Phaser Play module (gridiron-gm-play)

- P1–P27: Full gameplay — run/pass/defense, all special teams, pass rush mini-game, hurry-up defense, goal line stand, no-huddle, muffed punt, two-point mini-game
- **P28: Red zone fade route** — 15yd intercept; WR+CB corner; CATCH! button at 900ms; WR vs CB OVR TD contest (40-85%)
- **P29: Trick play** — 15% on non-no-huddle run_*; NORMAL/TRICK modal; PITCH! at 650ms; 50/64% big gain 15-34yds
- **P30: Two-minute drill** — `state._drillMode=true`; auto no-huddle user / auto-prevent AI; clears at halftime
- **P31: Red zone slant** — 3-button RZ modal (Normal/Slant/Fade); WR inside cut; CB press INT risk; ~70% comp
- **P32: Screen pass** — `screen_pass` in PlayCallScene; RB swings flat 580ms; THROW! at 520ms; 82% catch 3-10yds; 15% CB stuff; 5% INT
- **P33: Play action pass** — `pass_action` → `_startPlayAction()`; QB fake→RB 280ms; CB bites upfield; 65%+ comp 10-28yds; 4% INT
- **P34: Fumble risk mechanic** — runs >7yds trigger `fumble_risk` phase; TAP! 1.4s window; <2 taps = fumble ×4; ≥4 taps = fumble ×0.25
- **P35: Defensive blitz control** — `_showDefCall()` pre-snap modal on AI drives (cover2/man/blitz/prevent)

## Important paths

- `src/App.jsx` — all game code (~1200+ lines, v6.0)
- `gridiron-gm-play/src/scenes/FieldScene.js` — primary Phaser gameplay file
- `gridiron-gm-play/src/scenes/PlayCallScene.js` — play call menu (8 runs/passes)
- `gridiron-gm-play/src/data/gameState.js` — shared state + exportStats()
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory

## In progress

- (nothing blocked)

## Next session task board

See context/TASK_BOARD.md — 15 features queued (7 GM + 8 Play P36-P43)
