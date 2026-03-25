# Current State

## Snapshot

- Date: 2026-03-25
- Overall status: Live on GitHub Pages, active development
- Current version: v5.8 (holdout effect, cap forecast, trick play) / P29 — both builds clean
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
- **Coaching Contract Expiry** — coaches have `contract` (1-3yr from `genCoach`); `newSeason` decrements; at 0 → auto-fired to faCoaches; user warned in log; `Re-sign +2yr (1SP)` button in preseason when `contract<=1`; contract years shown on CoachCard
- Division/Conference Standings, Wild Card Seeding, Rivalry System, Playoff Picture
- Player Aging/Decline, Breakout Seasons, AI Cap Management, FA Mid-Season Refresh
- Season awards, Career stats, Cap space forecast, Draft grade report
- Preseason games, Rookie dev camp, Coaching hot seat, Trade deadline surge
- Player Morale Events (trade request / holdout / leadership boost per week)
- **Player Holdout Effect** — holdout flag (`p.holdout=true`) set by morale event; cleared at start of next simWk; holdout players excluded from `teamStr` and `simGame` stat gen; cleared on re-sign
- Injury Severity Tiers (minor/moderate/major; major → auto IR; modal shows wk remaining)
- **Salary Cap Penalties** — teams over $200M at simWk: +$5M dead cap; user also loses one 3rd-round pick; red warning banner in roster tab when over cap
- **Cap Forecast Improvements** — expiring contracts list in cap header (top 6 by OVR) with est. ask; "keep all / cut all" projected space for next year

### POS system
- `POS = ["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"]`

### Phaser Play module (gridiron-gm-play)

- P1–P27: Full gameplay — run/pass/defense, all special teams, pass rush mini-game, hurry-up defense, goal line stand, no-huddle, muffed punt, two-point mini-game
- **P28: Red zone fade route** — inside 15yd, pass calls show "FADE ROUTE" option (3s auto-dismiss); `_startFadeRoute()` positions WR+CB in endzone corner; ball arcs 1100ms; "🤲 CATCH!" button at 900ms; `_resolveFade()` — WR vs CB OVR contest (40-85%); TD or knocked away; `_noHuddleActive` guard
- **P29: Trick play** — 15% chance on non-no-huddle `run_*` calls: NORMAL RUN / TRICK PLAY modal (3s auto-dismiss); `_startTrickPlay()` animates QB→RB handoff→WR reverse pitch; "🏈 PITCH!" button at 650ms boosts big-gain odds (50→64%); resolves 50/64% big gain 15-34yds, 30/26% medium 3-11yds, 20/10% blown up -3 to -6yds
- Per-player stat tracking, drive chart, halftime, two-minute warning
- Mobile: Scale.FIT, D-pad

## Important paths

- `src/App.jsx` — all game code (~1180+ lines, v5.8)
- `gridiron-gm-play/src/scenes/FieldScene.js` — primary Phaser gameplay file
- `gridiron-gm-play/src/data/gameState.js` — shared state + exportStats()
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory

## In progress

- (nothing blocked)

## Next 3 moves

1. **P30: Two-minute drill** — compressed AI defense, user faster tempo near end of half
2. **GM: Player trade request resolution** — accept (force trade) or negotiate (conf boost)
3. **P31: Red zone slant** — quick inside route option vs press coverage in RZ
