# Systems

## Core systems

### Player Generation
- Purpose: Create realistic fictional NFL players with physical, skill, and biographical attributes
- Inputs: Position, age distribution (20-24 for prospects, broader for vets), gaussian params per position
- Outputs: Full player object with id, name, pos, age, ovr, pot, physical attrs, posAttrs, salary, contract, bio, combine, face, stats
- Dependencies: `PP{}`, `CA{}`, `PA{}`, `STRS{}`, `WKNS{}`, `FN[]`, `LN[]`, `COL[]`

### Game Simulation
- Purpose: Simulate a full game between two teams; update player stats
- Inputs: Home team, away team objects with rosters
- Outputs: `{hsc, asc, boxH, boxA}` — scores and per-player box score stats; mutates player `.ss` and `.gl`
- Dependencies: `simPG()`, `addS()`, `teamStr()`, `qbRate()`

### Live Simulation
- Purpose: Interactive play-by-play sim with visual SVG field
- Inputs: Unplayed user game from schedule
- Outputs: Real-time play text, ball position, score, Player of the Game, commits result to sched/teams via `useEffect([liveDone])`
- Dependencies: `genLivePlay()`, `advanceLivePlay()`, `FieldViz`, live sim state tree

### NFL Draft
- Purpose: 7-round, 224-pick draft with timer, AI auto-picks, Jimmy Johnson trade values
- Inputs: Draft class (240 prospects), 32 teams, pick order
- Outputs: Prospects assigned to teams, picks consumed, an analyst grade on every pick (where he went vs. his consensus rank) and on every team's class
- Dependencies: `genDC()`, `initPicks()`, `aiBestPick()` (blends each team's own noisy read with the consensus board, leaning toward needs), `PICK_VAL[]`, `getTeamNeed()`, `src/scouting.js`

### Scouting
- Purpose: Decide how much you know about each draft prospect. Engine in `src/scouting.js`, screens in `src/ScoutingUI.jsx`, saved as `scouting` in every save.
- Staff: a major scout and a minor scout, each covering a different position group (QB, RB, receivers/TE, OL, DL, LB, DB). Staff changes only in the preseason and free agency; a new crop of scouts looks for work after each draft.
- Budget: scouting points, separate from SP. 8 at the start of each season, 1 per regular-season week, 4 more at the Combine; leftovers expire at the next season. A report costs 1, a full workup 2 more.
- Reads: the major scout has a general idea (letter grade) of everyone in his group, and his full workup gives exact ratings plus the development trait; the minor scout's reads are rougher; the front office covers other groups with rough estimates only.
- Reports: tool grades for each position skill at his projected ceiling, strengths, a concern, and an NFL comparable from current rosters.
- Consensus Big Board: preseason rankings when a class is generated, final rankings after the Combine. The board is always in consensus order; scouting never reorders it. "Your list" is your own ranking, and the draft clock auto-picks from it.
- Combine: the top 180 of the preseason board are invited (everyone gets a pro day). Results are graded against the same position; a few prospects make news; risers/fallers move the final rankings. You get interview slots that read work ethic, which tracks development speed.
- Development traits (Superstar, Star, Normal, Late bloomer) shape young players' off-season growth.
- Old saves: `loadScouting()` builds a staff from the old scout, ranks every class and keeps old reports.

### Trading
- Purpose: Player + pick trades with fairness evaluation
- Inputs: User-selected outgoing/incoming players and picks
- Outputs: Roster mutations, pick ownership transfers, fairness score
- Dependencies: `evalTr()`, `execTr()`, `PICK_VAL[]`, player `tradeVal`

### Season Management
- Purpose: Year-over-year franchise progression — aging, retiring, salary tick, schedule regeneration
- Inputs: All team/player state at end of FA phase
- Outputs: All players aged, contracts decremented, retired players removed, new draft class, new schedule
- Dependencies: `newSeason()`, `genSched()`, `genDC()`, `genFA()`

## System interactions

- **simGame** mutates player `.ss` and `.gl` directly — any system reading those must be aware they're cumulative
- **Live sim** and **simGame** both produce box scores but use different stat paths — live stats are NOT written to `.ss`
- **Draft** and **FA** both add players to team rosters — cap and roster size are checked by the same sign/cut logic
- **Trade** uses `PICK_VAL[]` — any change to pick values affects both trade fairness AND draft order logic

## Risks

- Fragile areas: `advanceLivePlay()` state machine — complex, stateful, many interdependencies
- Fragile areas: `useEffect([liveDone])` commit — depends on correct `wk+h+a` identity matching in sched
- Scaling concerns: All 32 teams' full rosters in memory — fine at current scale, would be an issue at 100+ seasons without pruning career log
- Testing priorities: `simGame` (most used code path), `newSeason` (most state mutation), `execTr` (irreversible)
