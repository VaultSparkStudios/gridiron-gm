# Current State

## Snapshot

- Date: 2026-03-25
- Overall status: Live on GitHub Pages, active development
- Current version: v5.5 (coaching upgrades + waiver wire) / P26 — both builds clean
- Studio OS: Fully compliant

## What exists

### Franchise simulation (gridiron-gm)

- Full roster management (OL sub-positions: LT/LG/C/RG/RT)
- NFL Draft — 7 rounds, 224 picks, modern analytics pick value chart, 2-min timer, AI auto-pick, Sim Draft
- Free agency — sign/release, salary/contract, sortable/filterable table; AI FA signings on season rollover
- **Waiver Wire** — `waivers[]` state; regular season releases go to waivers (not FA); `waiverWk` stamp; CPU teams (worst record first) claim at 60% chance on simWk; unclaimed → FA; user claims instantly; saved
- Scouting — hireable scouts, 3-year draft lookahead, hidden attributes
- **Scout Report Depth** — `scGrade()` helper; top-5 prospects panel per position (scoutLvl≥1); above filter row
- Trading — players + picks, fairness evaluation; `genTradeOffer` 3 types; banner shows picks
- Live Sim — play-by-play with SVG field, Player of the Game, team recap, box scores
- Game simulation — per-player stats, passer rating, AV, season/career tracking
- **Weekly Game Plan** — Offense/Defense modifiers in `simGame`; shown in Schedule tab
- **Morale / Chemistry** — `morale` (0-100); win/loss/streak updates; shown in header
- **Player Confidence** — `conf` (0-100); LKR_EVENTS × 8, 15%/week; logged
- **GM Reputation** — `gmRep` (0-100); 5 tiers; RESPECTED SP bonus, ELITE re-sign discount
- **Opponent Scouting Report** — auto card in Schedule tab
- **Practice Squad** — `ps[]` max 10; PS tab; promote/release; aging each offseason
- **Injury Reserve (IR)** — `ir[]` max 8 per team; `moveToIR` (injured only, 8-wk min); `activateFromIR`; IR tab; `→ IR` in modal
- **Trade Deadline** — no trades after Week 10
- **Contract re-signing** — preseason RE-SIGN WINDOW; `RES_MAX` demands; 1/2/3/4yr buttons
- **Contract Restructure** — `restructureP`: OVR ≥ 80, contract ≥ 2 yrs; cuts salary 40%; `↻ Restructure` button
- **Mid-Season Contract Extension** — `extendContract(pid,addYrs)`: regular season, 1 SP, +1yr/+2yr buttons
- **Franchise Tag** — `ftag` state; preseason-only; `FT` badge; blocks release; saved
- Injury bridge, Player modal (full stats/scouting/career), Coaching & scheme system
- **Coaching Staff Upgrades** — `upgradeCoach(role)`: costs 2 SP, +5 rating (cap 95); `⬆` button on each coach card
- Salary cap ($200M), QTE gameplay, GM Bridge, Depth chart + Auto-Fill
- **Division/Conference Standings**, **Wild Card Seeding**, **Rivalry System**
- Player Aging/Decline, Breakout Seasons, AI Cap Management, FA Mid-Season Refresh
- Career stats, AI FA signings, season awards, AI trade proposals
- Trade deadline Week 10, Trade deadline surge, Coaching hot seat
- Draft grade report, Cap space forecast, Preseason games, Rookie dev camp

### POS system
- `POS = ["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"]`

### Phaser Play module (gridiron-gm-play)

- P1–P21: Full gameplay (run/pass/defense, all special teams, onside kick)
- P22: Muffed punt, P23: No-huddle offense, P24: Goal line stand, P25: Hurry-up defense
- **P26: Two-point conversion mini-game** — "GO FOR 2" in PAT modal launches `_startTwoPointPlay()`; user WASD controls QB; DL pursues at 55px/s; reach endzone = +2pts; tackled/timer = fail; 3.5s countdown displayed live
- Per-player stat tracking, drive chart, halftime, two-minute warning
- Mobile: Scale.FIT, D-pad

## Important paths

- `src/App.jsx` — all game code (~1110+ lines, v5.5)
- `gridiron-gm-play/src/scenes/FieldScene.js` — primary Phaser gameplay file
- `gridiron-gm-play/src/data/gameState.js` — shared state + exportStats()
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory

## In progress

- (nothing blocked)

## Next 3 moves

1. **GM: Player morale events** — random weekly triggers: trade request, holdout, leadership boost (1-2 per team per week chance)
2. **P27: Pass rush mini-game** — on AI pass plays, user can control a DL rusher to pressure/sack the AI QB
3. **GM: Injury severity tiers** — minor (1-2 wk), moderate (3-5 wk), major (6-8 wk → auto IR); shown in player modal
