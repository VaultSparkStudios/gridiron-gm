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
- Outputs: Prospects assigned to teams, picks consumed
- Dependencies: `genDC()`, `initPicks()`, `aiBestPick()`, `PICK_VAL[]`, `getTeamNeed()`

### Scouting
- Purpose: Reveal hidden player true ratings incrementally using scout points
- Inputs: Scout level (0/1/2) per player, scout points budget
- Outputs: `scoutedOvr`/`scoutedPot` values; at level 2, truOvr/truPot fully revealed
- Dependencies: `scoutPlayer()`, scout objects per team

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
