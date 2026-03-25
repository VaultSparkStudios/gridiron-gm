# Current State

## Snapshot

- Date: 2026-03-25
- Overall status: Live on GitHub Pages, active development
- Current version: v5.6 (morale events + injury severity tiers) / P27 — both builds clean
- Studio OS: Fully compliant

## What exists

### Franchise simulation (gridiron-gm)

- Full roster management (OL sub-positions: LT/LG/C/RG/RT)
- NFL Draft — 7 rounds, 224 picks, modern analytics pick value chart, 2-min timer, AI auto-pick, Sim Draft
- Free agency — sign/release, salary/contract; AI FA signings on season rollover
- **Waiver Wire** — `waivers[]` state; regular-season releases queue; CPU worst-record-first claims; unclaimed → FA; saved
- Scouting — hireable scouts, 3-year draft lookahead, Scout Report Depth panel (`scGrade()`)
- Trading — players + picks, fairness eval; trade surge wk 8-10; deadline wk 10
- Live Sim — play-by-play SVG field, Player of the Game, box scores
- Game simulation — per-player stats, passer rating, AV, season/career tracking
- Weekly Game Plan, Morale/Chemistry, Player Confidence, GM Reputation (5 tiers)
- Opponent Scouting Report, Practice Squad (max 10), IR (max 8 per team)
- Contract re-signing, restructure, franchise tag, mid-season extension (1 SP)
- Coaching & scheme system, Coaching staff upgrades (2 SP → +5 rating)
- Division/Conference Standings, Wild Card Seeding, Rivalry System, Playoff Picture
- Player Aging/Decline, Breakout Seasons, AI Cap Management, FA Mid-Season Refresh
- Season awards (MVP/OPOY/DPOY), Career stats, Cap space forecast
- Draft grade report, Preseason games (2 exhibitions), Rookie dev camp (3 SP)
- Coaching hot seat (wk ≥12), Trade deadline surge banner
- **Player Morale Events** — 3 random weekly triggers per team (regular season):
  - Trade request: OVR ≥ 80, conf < 35, 5% → conf -15, morale -5
  - Holdout: contract=1, OVR ≥ 75, 4% → conf -12, morale -4
  - Leadership boost: OVR ≥ 85, conf > 65, 7% → morale +6, all OVR ≥ 75 conf +5
- **Injury Severity Tiers** — `injSev` + `injRecWks` on players:
  - minor (1-2 wk, 40%), moderate (3-5 wk, 40%), major (6-8 wk → auto IR, 20%)
  - Player modal shows: `[type] — [sev] ([N]wk remaining)`
  - `newSeason` clears severity fields

### POS system
- `POS = ["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"]`

### Phaser Play module (gridiron-gm-play)

- P1–P26: Full gameplay — run/pass/defense, all special teams, onside kick, two-point mini-game, hurry-up defense, goal line stand, no-huddle, muffed punt
- **P27: Pass rush mini-game** — during AI pass plays, "⚡ BLITZ" button appears (720ms window); tap → activates rush mode; user WASD speeds up +12px/s toward QB; if within 22px at 1500ms → SACK; if miss → coverage broken (INT threshold -20); `_passRushMode` / `_passRushCoverBreak` flags
- Per-player stat tracking, drive chart, halftime, two-minute warning
- Mobile: Scale.FIT, D-pad

## Important paths

- `src/App.jsx` — all game code (~1140+ lines, v5.6)
- `gridiron-gm-play/src/scenes/FieldScene.js` — primary Phaser gameplay file
- `gridiron-gm-play/src/data/gameState.js` — shared state + exportStats()
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory

## In progress

- (nothing blocked)

## Next 3 moves

1. **GM: Salary cap penalties** — exceeding cap triggers fine ($5M penalty added to dead cap) + loses a 3rd-round pick next draft
2. **P28: Red zone fade route** — specific play call in red zone (inside 15yd); user WR jumps for contested ball vs CB; timing mini-game
3. **GM: Coaching contract expiry** — coaches have 1-3yr deals; must re-sign or lose to FA at season end
