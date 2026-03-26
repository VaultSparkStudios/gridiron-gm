# Current State

## Snapshot

- Date: 2026-03-26
- Overall status: Live on GitHub Pages, active development
- Current version: v17.0 (gridiron-gm, 1614 lines) / P95 (gridiron-gm-play, 4220 lines) — both builds clean
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
- **Fan Satisfaction Meter** — `fanSat` 0-100; SP rate modifier; color bar in standings + schedule tab
- **Trade Deadline AI Buy/Sell** — wk 10-11 buyer/seller classification; banner + tags in trade tab
- **Scouting Budget Allocation** — 5SP split across speed/scheme/injury/combine; accuracy multipliers
- **Coaching Hire Market** — `coachMarket` pool; SP-cost hires in coaching tab; fired coaches re-enter
- **Stadium Upgrades** — `stadium.upgrades[]`; crowd noise / premium turf / expanded capacity tiers
- **Practice Squad Call-Up** — `callUpPS()`; in-season only; 1SP; auto-returns after 3 weeks
- **Multi-Year Owner Goal History** — `ownerGoalHistory[]` + `ownerGoalStreak`; dynasty bonus at 3 consecutive
- **Player Retirement** — age 34–37+ chance at wk18; HOF log entry; comp 7th-round pick if OVR≥82
- **Season Awards Panel** — MVP/DPOY/OROY/DROY from stats at wk18; +gmRep for user winners; log tab history
- **Player Development Curve** — age 21–26 probabilistic OVR improvement at season end; logged for user team
- **Draft Class Strength Rating** — `draftClassRating` rolled each newSeason; Weak/Average/Strong/Elite; affects OVR floor/cap
- **Press Conference Events** — 30% chance per regular-season week; 8-question pool; 3 answers with morale/gmRep/fanSat effects
- **AI-Initiated Trades** — 20% chance/week per AI team; `aiOffer` state; ACCEPT/DECLINE/COUNTER in trade tab
- **Playoff Bracket Visual** — visual bracket in playoffs tab; seeds, matchups, scores, winner highlights
- **Team Chemistry System** — `chemistry` 0-100 per team; win/loss/holdout/trade effects; modifies teamStr
- **Weather Impact on Sim** — per-game roll (clear/rain/snow/wind); pass comp / fumble / FG accuracy modifiers
- **Live Stat Write-Back** — Phaser game results write `playerDeltas` to `p.ss`; guarded by `g.playedLive` flag
- **Contract Year Boost** — `p.contract===1` adds +2 teamStr per CY player; CY gold badge in PlayerTable + modal
- **Player Mentorship** — OVR≥85/age≥30 assigned as mentor to age≤24 players; 35% wk18 dev bonus
- **Scheme Fit Ratings** — `p.fit` 0-100 per player; FIT column in PlayerTable; avgFit modifier in teamStr
- **Trade Block** — `p.onBlock` toggle; 🔖 badge; AI offer bias toward on-block players; TRADE BLOCK section in trade tab
- **Player Agent Types** — `p.agent` Aggressive/Moderate/Passive; 1.15x/0.9x salary demand multiplier on re-sign
- **Combine Scores for Prospects** — `genCombine()` on all draft class prospects; percentile shown in player modal
- **OFF/DEF Split Ratings** — `calcOffStr/calcDefStr` helpers; O: / D: labels on every standings row
- **Media Storylines** — `mediaStory` state; generated at newSeason based on prior wins/rivalry; italic banner in schedule tab
- **Preseason Power Rankings** — `powerRankings` state; trend arrows (▲/▽/—); collapsible section in standings tab
- **IR Designations** — `p.irReturnWk` field set on moveToIR; Est.WkX + Min:Xwk shown in IR list
- **Offseason Extensions** — preseason "Extend (2SP)" in PlayerModal for contract===2 players; +2yr 15% raise, sets `p.offsznExt`
- **Practice Squad Poaching** — 15% chance/wk AI poaches user PS player; modal Block(1SP)/Let Go
- **Coaching XP** — OC/DC/ST gain +3/win +1/loss; level up (+5 rating) at 20 XP; XP bar in coaching tab
- **Injury Prone Flag** — `p.injCount` tracked; `p.fragile=true` at injCount≥2; ⚠️ badge in PlayerTable + modal
- **Trade Deadline Urgency** — wk10 if 2+ behind division: owner CONTEND/SELL modal; gmRep +1 on CONTEND
- **Late-Round Gem Scouting** — "Scout Gem (1SP)" in draft tab; boosts R4+ prospect to 85+ pot; GEM banner
- **UDFA Pool** — 8 UDFAs generated after R7; Sign to PS buttons; max 5 signings
- **Holdout Escalation** — 2+ wk holdout → team morale -3, gmRep -1, logged; tracked via `holdoutWks{}`
- **Rookie Wage Scale** — R1 picks get `rookieSlot()` fixed salary (slot-based, ~$4M→$0.8M); shown in draft
- **Expansion Draft Mode** — yr≥3 option; protect 15 players; Las Vegas Aces added as expansion team
- **Salary Cap Floor** — CAP_FLOOR=$150M; auto-sign cheapest FA if under floor; red warning banner in roster tab
- **Player Option Years** — `p.playerOption` on genPlayer; 60% opt-out at contract=1; purple OPT badge in salary column
- **PUP/NFI Designations** — `p.irType` (IR/PUP/NFI) set in moveToIR wk<4; PUP no return until wk9; NFI season-ending
- **Coaching Tree Legacy** — `coachLegacy` state; 20% protege +3 bonus on hire; logged
- **Draft Pick Compensation** — `compPickQueue` state; gmRep≥60 + lost FA → late comp pick; Add to Pool in draft tab
- **Franchise QB Mode** — `franchiseQB` state; 1SP/season; gold FQB badge; +5 teamStr; trade/release blocked
- **Preseason Depth Chart Battles** — "Battle (1SP)" per position group; top 2 compete; winner +1 OVR; `battlesDone`
- **League Trade History Feed** — `tradeHistory` state; user + AI-AI trades logged; collapsible in trade tab
- **Player Breakout Alert** — `breakoutAlerts` state; +2 OVR dev = BREAKOUT banner in log tab
- **Scouting Accuracy Decay** — `scoutTimestamps` state; freshness bar FRESH/AGING/STALE in scouting list
- **IR Auto-Return** — `irReturnWk` countdown shown in IR list; auto-moves player to roster at return week in simWk
- **Player Personality Types** — `p.personality` (Leader/Loner/Hothead/Grinder); badges in PlayerTable + modal; morale/dev effects
- **Rival Game Boost** — `⚔️ RIVALRY WEEK` banner in schedule tab; +4 teamStr vs rivalry opponent
- **Scout Network Tiers** — `scoutTier` state (1-3); Tier2=3SP (combine data), Tier3=6SP (true OVR reveal)
- **Salary Cap Rollover** — `capRollover` state; unused space carries (max $10M); shown in cap header
- **Veteran Minimum Contracts** — VET MIN button for OVR≤65 FAs/waivers; flat $0.5M/1yr
- **Coaching Hot Seat** — `hotSeat` state; streak≤-3 triggers warning; streak≤-4 auto-fires worst coordinator
- **Player Suspension Event** — `suspensionEvent` state; 2%/wk; Handle Internally(1SP) or Release modal
- **Draft Board Rankings** — `draftBoard` state; MY BOARD section in draft tab; ↑/↓ ordering; gold rank badges
- **Preseason Injury Risk Toggle** — `preseasonRisk` state; ON/OFF toggle; 8% injury chance to top-22 starters

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
- **P36: Pick-Six Return** — DB WASD-controlled run after INT; blockers; pursuit AI; TD if reaches endzone
- **P37: Onside Kick** — post-score modal; rapid-tap RECOVER! 1.2s window; ≥3 taps = recovery bonus
- **P38: QB Scramble Spin Move** — SPIN button when DL <40px during pass; 70% break; `_spinUsed` per play
- **P39: Fake Punt/Fake FG** — modal before every punt/FG; FAKE IT / REAL KICK; 3s auto-dismiss
- **P40: Goal Line QB Sneak** — toGo≤1 on runs; PUSH! mash 4 taps/0.8s; QB surge tween
- **P41: Drive Momentum Meter** — ⚡ HUD bar; ±% comp modifier; fills on completions/runs; drains on turnovers
- **P42: Challenge Flag** — 1 per game after turnovers; 45% overturn; pre-play state snapshot
- **P43: 4th Quarter Comeback Mode** — trailing 7+ Q4; +3% comp; AI false start +5%; COMEBACK MODE banner
- **P44: Hail Mary** — 4th & ≥15 inside own 45; QB wind-up 2s; WRs sprint deep; 8% TD / 22% INT / 70% incomplete
- **P45: Audible System** — AUDIBLE button presnap; RUN/PASS override; 1 per drive; `_audibleUsed` flag
- **P46: Red Zone Bootleg** — 25% trigger on pass inside yardLine≥75; QB rolls right; THROW window; scramble fallback
- **P47: Squib Kick** — kickoff modal DEEP/SQUIB/ONSIDE; squib = opp ball at 30, no return
- **P48: Defensive Holding** — 8% CB hold roll per pass play; flag if gain <8yds & no TD/turnover; +5yds auto first down
- **P49: WR vs CB Matchup HUD** — pre-snap OVR comparison; color-coded arrows; ±8% catch chance modifier
- **P50: FG Block Attempt** — AI FG range triggers BLOCK IT! button 0.8s; 18%+ block chance; ball back at 20
- **P51: Offensive Holding** — 6% on runs >6yds; -10yds repeat down; yellow flag
- **P52: QB Injury Risk** — 4% on sack; `_qbInjured` flag; -8% comp; clears at halftime
- **P53: Clock Management** — Q4 trailing: SPIKE IT (stop clock) or OUT OF BOUNDS button after plays
- **P54: QB Reads** — 3 pre-snap zone buttons (CHECKDOWN/PRIMARY/GO ROUTE); 2.5s auto; comp%/yards modifiers
- **P55: Player Fatigue** — `_fatigue{}` dict; accumulates per carry/scramble; -20/quarter recovery; orange HUD >60
- **P56: Goal Line Package** — `_isGoalLine()` at yardLine≥93; gold flash; 0-2yd run range; STR bonus
- **P57: Expanded Audibles** — AUDIBLE_ROUTES (RB SCREEN/SLANT/FADE/OUT ROUTE); 4 buttons at 89% screen height
- **P58: Defensive Formations** — DEF_FORMATIONS (4-3/3-4/NICKEL/DIME/BLITZ); top-right selector; coverage/sack bonuses
- **P59: Punt Return Decision** — AI punts on 4th & >42; FAIR CATCH / RETURN modal; L/M/R lane choice; wind modifier
- **P60: Overtime Mechanic** — tie → OVERTIME flash; coin flip modal; `_isOT=true`; sudden death possession
- **P61: Two-Point Choice** — RUN IT (mini-game) / PASS IT (stat-based) modal before 2pt attempt
- **P62: Wind HUD** — `_wind` rolled at create(); shown on FG/punt; crosswind/head/tailwind accuracy modifiers
- **P63: Defensive Run Stop** — STACK IT! button 1.2s window on AI runs; 52% speed reduction on success
- **P64: No-Huddle Hurry-Up** — HURRY UP button after incomplete; saves 15s clock; -5% comp penalty next play
- **P65: Receiver Route Tree** — CURL/POST/CORNER/GO selector pre-snap; comp%/yard modifiers; 3s auto-CURL
- **P66: Defensive Pass Rush Lane** — INSIDE/OUTSIDE choice on AI passes; sack% / coverage% modifiers
- **P67: QB Checkdown Under Pressure** — 500ms window; guaranteed 1-6yd gain; CHECKDOWN! flash; no INT risk
- **P68: Red Zone Fade to Corner** — FADE ROUTE button 3rd/4th &5+ inside 25; 48% catch/18% INT/34% inc; TD if in endzone
- **P69: Pass Interference Call** — 12% PI roll on deep incomplete; auto +15yds + 1st down; `_piChecked` flag
- **P70: Hurry-Up Defense** — AI scores Q4 within 8pts: PREVENT D / AGGRESSIVE D modal; covMod/sackMod applied; `_hurryUpDef`
- **P71: Motion Pre-Snap** — MOTION button before pass snaps; WR1 tween; -8% coverage +10% comp; `_motionActive`
- **P72: Third Down Tracker** — `_thirdDownAtt/_thirdDownConv` HUD; momentum +20 burst at ≥50% rate ≥4 att
- **P73: Sideline Route** — PlayCallScene new play; WR sideline tween; 78% catch 4-8yds; clock stops
- **P74: DB Bump Coverage** — BUMP! button on AI passes; CB tween forward; -15% comp +6% INT; `_bumpActive`
- **P75: Scramble Slide** — SLIDE button during QB scramble inside own 20; 2-5yd gain, no fumble/injury; `_slid`
- **P76: Red Zone Run Choice** — DIVE/SWEEP before runs at yardLine≥80; DIVE=0-3yd high%, SWEEP=4-12yd lower%; `_rzRunChoice`
- **P77: Penalty Accept/Decline** — modal after flags; ACCEPT/DECLINE; 3s auto-dismiss; wraps existing flag logic
- **P78: Two-Minute Warning Timeout** — Q2/Q4 clock≤120s; overlay + free timeout +15s; `_twoMinWarningFired{}`

## Important paths

- `src/App.jsx` — all game code (~1600+ lines, v9.0)
- `gridiron-gm-play/src/scenes/FieldScene.js` — primary Phaser gameplay file
- `gridiron-gm-play/src/scenes/PlayCallScene.js` — play call menu (8 runs/passes)
- `gridiron-gm-play/src/data/gameState.js` — shared state + exportStats()
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory

## In progress

- (nothing blocked)

## Next session task board

See context/TASK_BOARD.md — backlog cleared (v6.3 / P53)
