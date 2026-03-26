# Task Board

## Done (recent)

- [x] v3.2–v5.6: Full franchise sim + Phaser P1–P27, all core systems
- [x] GM: Player morale events, injury severity tiers
- [x] P27: Pass rush mini-game (BLITZ button, sack/coverage break)
- [x] P28: Red zone fade route — 15yd intercept; WR+CB corner; CATCH! button; OVR-based TD chance
- [x] GM: Salary cap penalties — over $200M → +$5M dead cap + 3rd-round pick forfeit
- [x] GM: Coaching contract expiry — contract field on coaches; auto-fire; Re-sign +2yr (1SP)
- [x] P29: Trick play — 15% on run_; NORMAL/TRICK modal; PITCH! at 650ms
- [x] P30: Two-minute drill — _drillMode; auto no-huddle user; auto-prevent AI
- [x] P31: Red zone slant — 3-button RZ modal; WR inside cut; CB press INT risk
- [x] GM: Player holdout effect — p.holdout flag; excluded from teamStr/simGame
- [x] GM: Cap forecast improvements — expiring list + keep-all/cut-all projected space
- [x] GM: Trade request resolution — p.tradeRequest flag; Negotiate or Find Trade
- [x] **v6.0 GM: Owner Goals** — adaptive win target; banner in schedule; season reset
- [x] **v6.0 GM: League News** — collapsible log section; generated from sim events
- [x] **v6.0 GM: Training Camp Focus** — 2SP; +1 attribute; trainedThisCamp flag
- [x] **v6.0 GM: Contract Negotiation Modal** — counter/midpoint/walk away in preseason resign
- [x] **v6.0 GM: Draft Scout (1SP)** — lighter accuracy scout on active draft tab
- [x] **P32: Screen pass** — RB flat; THROW! at 520ms; 82% catch 3-10yds
- [x] **P33: Play action pass** — QB fake; CB bites; 10-28yd enhanced pass
- [x] **P34: Fumble risk mechanic** — runs >7yds; TAP! window; taps modify fumble chance
- [x] **P35: Defensive blitz control** — _showDefCall() pre-snap modal confirmed live

## In Progress

- (none)

## Done (v17.0 / P91-P95 — 2026-03-26)

- [x] **v17 GM: Weekly Injury Report** — 🩺 button in game plan → modal (Out/Q/Probable)
- [x] **v17 GM: Player Season Grade Dashboard** — `glGrade()` helper; shown in Stats tab + player modal
- [x] **v17 GM: Young Core BUILD badge** — age≤24 && OVR≥75 → BUILD badge in PlayerTable
- [x] **v17 GM: Scheme Transition Cost** — change OC/DC scheme costs 2SP + `_schemeTransWks=2` = −3 teamStr
- [x] **v17 GM: Coordinator Poaching Risk** — 15% chance in newSeason (coord RTG≥80); retain 2SP or let go
- [x] **v17 GM: Draft Trade Machine** — trade-up/trade-down buttons when user is on the clock
- [x] **v17 GM: Clutch Performance Index** — clutch/trait players show ⚡ CLUTCH INDEX in player modal
- [x] **v17 GM: Position Market Rate** — POS_MARKET const; shown in FA tab as rate table
- [x] **v17 GM: Game Week Weather Preview** — nextGameWx set after simWk; shown in game plan
- [x] **v17 GM: League Trade Activity** — enriched trade history (YOU / NEW badges, color-coded)
- [x] **P91: Pass Rush Counter Move** — COUNTER button 700ms into pass rush; 55% break chance
- [x] **P92: Read-Option Play** — KEEP vs PITCH choice at snap; added to PlayCallScene
- [x] **P93: Second Read Toggle** — 👁 2ND READ button during pass; swaps WR1/WR2 targets
- [x] **P94: Drive Summary Card** — 2-sec overlay on drive end: plays/yards/result
- [x] **P95: Field Goal Ice** — 8% chance opponent ices kicker; 2.2s delay + re-kick

- [x] **v6.1 GM: Fan Satisfaction Meter** — `fanSat` 0-100; SP rate modifier; color bar in standings/schedule
- [x] **v6.1 GM: Trade Deadline AI Buy/Sell Mode** — wk 10-11 buyer/seller; banner + tags in trade tab
- [x] **v6.1 GM: Scouting Budget Allocation** — 5SP across speed/scheme/injury/combine; accuracy multipliers
- [x] **v6.1 GM: Coaching Hire Market** — `coachMarket` pool; SP-cost hires; fired coaches re-enter
- [x] **v6.1 GM: Stadium Upgrades** — crowd noise / premium turf / expanded capacity
- [x] **v6.1 GM: Practice Squad Call-Up** — 1SP; in-season; auto-returns after 3 wks
- [x] **v6.1 GM: Multi-Year Owner Goal History** — `ownerGoalHistory[]`; dynasty bonus at 3 consecutive
- [x] **P36: Pick-Six Return** — DB WASD run after INT; pursuit AI; TD/tackle resolution
- [x] **P37: Onside Kick** — post-score modal; rapid-tap RECOVER! 1.2s window
- [x] **P38: QB Scramble Spin Move** — SPIN button DL <40px; 70% break; `_spinUsed` per play
- [x] **P39: Fake Punt / Fake FG** — modal before punt/FG; FAKE IT / REAL KICK; 3s auto-dismiss
- [x] **P40: Goal Line QB Sneak** — toGo≤1; PUSH! mash 4 taps/0.8s; QB surge tween
- [x] **P41: Drive Momentum Meter** — ⚡ HUD bar; ±% comp modifier; color-coded
- [x] **P42: Challenge Flag** — 1 per game; 45% overturn; pre-play state snapshot
- [x] **P43: 4th Quarter Comeback Mode** — trailing 7+ Q4; +3% comp; AI false start +5%

- [x] **v6.2 GM: Player Retirement** — age 34–37+; HOF log; comp 7th-round pick OVR≥82
- [x] **v6.2 GM: Season Awards Panel** — MVP/DPOY/OROY/DROY; `awards[]`; log tab display
- [x] **v6.2 GM: Player Development Curve** — age 21–26 OVR boosts at wk18; user logged
- [x] **v6.2 GM: Draft Class Strength Rating** — Weak/Average/Strong/Elite; OVR floor/cap effect
- [x] **v6.2 GM: Press Conference Events** — 30% per wk; 8-question pool; morale/gmRep/fanSat effects
- [x] **P44: Hail Mary** — 4th & ≥15; QB wind-up; 8% TD / 22% INT / 70% incomplete
- [x] **P45: Audible System** — presnap RUN/PASS override; 1 per drive
- [x] **P46: Red Zone Bootleg** — 25% trigger inside 25; QB rolls; THROW window
- [x] **P47: Squib Kick** — DEEP/SQUIB/ONSIDE modal; squib skips return
- [x] **P48: Defensive Holding** — 8% CB hold; flag if gain <8yds; +5yds auto first down

- [x] **v6.3 GM: AI-Initiated Trades** — 20% chance/wk; `aiOffer` state; ACCEPT/DECLINE/COUNTER in trade tab
- [x] **v6.3 GM: Playoff Bracket Visual** — visual bracket; seeds/matchups/scores/winner highlights
- [x] **v6.3 GM: Team Chemistry** — `chemistry` 0-100 per team; win/loss/holdout effects; modifies teamStr
- [x] **v6.3 GM: Weather Impact on Sim** — per-game roll; rain/snow/wind affect pass comp + FG accuracy
- [x] **v6.3 GM: Live Stat Write-Back** — Phaser playerDeltas write to p.ss; guarded by playedLive flag
- [x] **P49: WR vs CB Matchup HUD** — pre-snap OVR bars; ±8% catch modifier
- [x] **P50: FG Block Attempt** — AI FG BLOCK IT! button; 18%+ chance; ball back at 20
- [x] **P51: Offensive Holding** — 6% on runs >6yds; -10yds repeat down
- [x] **P52: QB Injury Risk** — 4% on sack; -8% comp; clears halftime
- [x] **P53: Clock Management** — Q4 trailing SPIKE IT / OUT OF BOUNDS buttons
- [x] **P54: QB Reads** — 3 pre-snap zones; 2.5s auto; comp%/yards modifiers
- [x] **P55: Player Fatigue** — accumulates per carry/scramble; -20/quarter recovery; orange HUD >60
- [x] **P56: Goal Line Package** — at yardLine≥93; gold flash; 0-2yd range; STR bonus
- [x] **P57: Expanded Audibles** — 4 hot routes; 4 buttons at 89% screen; modifiers
- [x] **P58: Defensive Formations** — 5 formations; top-right selectors; coverage/sack bonuses
- [x] **P59: Punt Return Decision** — AI punts on 4th & >42; FAIR CATCH / RETURN; lane choice (L/M/R); wind modifier
- [x] **P60: Overtime Mechanic** — tie → OVERTIME flash; coin flip modal; sudden death; AI or user possession
- [x] **P61: Two-Point Choice** — RUN (mini-game) / PASS (stat-based) before 2pt attempt
- [x] **P62: Wind HUD** — roll per game; shown on FG/punt; crosswind/head/tailwind accuracy modifiers
- [x] **P63: Defensive Run Stop** — STACK IT! button 1.2s window on AI runs; 52% speed reduction on success

- [x] **v8.0 GM: Contract Year Boost** — `p.contract===1` → +2 teamStr per CY player; CY badge in PlayerTable/modal
- [x] **v8.0 GM: Player Mentorship** — OVR≥85/age≥30 mentor assigned to age≤24; 35% dev bonus at wk18
- [x] **v8.0 GM: Scheme Fit Ratings** — `p.fit` 0-100; FIT column in PlayerTable; avgFit modifier in teamStr
- [x] **v8.0 GM: Trade Block** — `p.onBlock` toggle; 🔖 badge; AI offer bias; TRADE BLOCK section in trade tab
- [x] **v8.0 GM: Player Agent Types** — Aggressive/Moderate/Passive; 1.15x/0.9x salary demand multiplier
- [x] **v8.0 GM: Combine Scores for Prospects** — `genCombine()` on all draft prospects; shown in player modal
- [x] **v8.0 GM: OFF/DEF Split Ratings** — `calcOffStr/calcDefStr` helpers; O:/D: shown on standings rows
- [x] **v8.0 GM: Media Storylines** — `mediaStory` state; generated at newSeason; italic banner in schedule tab
- [x] **v8.0 GM: Preseason Power Rankings** — `powerRankings` state; trend arrows; collapsible in standings tab
- [x] **v8.0 GM: IR Designations** — `irReturnWk` field; Est.WkX + Min:Xwk shown in IR section

- [x] **v9.0 GM: Offseason Extensions** — preseason Extend (2SP); +2yr 15% raise; `p.offsznExt`
- [x] **v9.0 GM: Practice Squad Poaching** — 15%/wk AI poach attempt; Block(1SP)/Let Go modal; `psPoachAttempt`
- [x] **v9.0 GM: Coaching XP** — `coach.xp`; +3/win +1/loss; level up at 20XP; XP bar in coaching tab
- [x] **v9.0 GM: Injury Prone Flag** — `p.injCount`; `p.fragile` at ≥2; ⚠️ badge; "Injury Prone" in modal
- [x] **v9.0 GM: Trade Deadline Urgency** — wk10 2+ behind → CONTEND/SELL modal; gmRep +1; `deadlineUrgency`
- [x] **v9.0 GM: Gem Scout** — "Scout Gem (1SP)" in draft; R4–R7 pot boost to 85+; ⭐ GEM banner; `gemScout`
- [x] **v9.0 GM: UDFA Pool** — 8 UDFAs after R7; Sign to PS (max 5); `udfaPool`
- [x] **v9.0 GM: Holdout Escalation** — 2+ wk holdout → morale -3 gmRep -1; `holdoutWks{}`
- [x] **v9.0 GM: Rookie Wage Scale** — `rookieSlot()` fixed R1 salary; shown in draft + log
- [x] **v9.0 GM: Expansion Draft** — yr≥3; protect 15; Las Vegas Aces expansion team; `expansionMode`
- [x] **P64: No-Huddle Hurry-Up** — HURRY UP after incomplete; 15s saved; -5% comp next play
- [x] **P65: Receiver Route Tree** — CURL/POST/CORNER/GO pre-snap; comp%/yard mods; 3s auto-CURL
- [x] **P66: Defensive Pass Rush Lane** — INSIDE/OUTSIDE on AI passes; sack%/coverage% mods
- [x] **P67: QB Checkdown Under Pressure** — 500ms window; 1-6yd guaranteed; no INT; CHECKDOWN! flash
- [x] **P68: Red Zone Fade to Corner** — FADE ROUTE 3rd/4th &5+ inside 25; 48%/18%/34%; TD possible

- [x] **v10.0 GM: Salary Cap Floor** — CAP_FLOOR=150; auto-sign FA if under; red banner in roster tab
- [x] **v10.0 GM: Player Option Years** — `p.playerOption`; 60% opt-out at contract=1; OPT badge
- [x] **v10.0 GM: PUP/NFI Designations** — `p.irType`; PUP no return wk<9; NFI season-ending; colored badge
- [x] **v10.0 GM: Coaching Tree Legacy** — `coachLegacy`; 20% protege +3 on hire; logged
- [x] **v10.0 GM: Draft Pick Compensation** — `compPickQueue`; gmRep≥60 + lost FA → comp pick R3-R5
- [x] **v10.0 GM: Franchise QB Mode** — `franchiseQB`; FQB badge; +5 teamStr; trade/release blocked; 1SP/season
- [x] **v10.0 GM: Depth Chart Battles** — "Battle (1SP)" preseason; top 2 compete; winner +1 OVR; `battlesDone`
- [x] **v10.0 GM: Trade History Feed** — `tradeHistory`; user + AI-AI trades; collapsible in trade tab
- [x] **v10.0 GM: Breakout Alert** — `breakoutAlerts`; +2 OVR dev → BREAKOUT banner in log tab
- [x] **v10.0 GM: Scout Accuracy Decay** — `scoutTimestamps`; freshness bar FRESH/AGING/STALE
- [x] **P69: Pass Interference** — 12% deep incomplete; +15yds auto 1st down; `_piChecked`
- [x] **P70: Hurry-Up Defense** — AI scores Q4 ≤8pts lead; PREVENT/AGGRESSIVE modal; `_hurryUpDef`
- [x] **P71: Motion Pre-Snap** — MOTION button; WR1 tween; -8% cov +10% comp; `_motionActive`
- [x] **P72: Third Down Tracker** — HUD 3RD: X/Y; momentum +20 at ≥50% rate; flash
- [x] **P73: Sideline Route** — PlayCallScene new play; WR sideline tween; clock stops

- [x] **v11.0 GM: IR Auto-Return** — irReturnWk countdown in IR list; auto-roster return in simWk
- [x] **v11.0 GM: Player Personality** — p.personality (Leader/Loner/Hothead/Grinder); badges; morale/dev effects
- [x] **v11.0 GM: Rival Game Boost** — RIVALRY WEEK banner; +4 teamStr vs rivalry opponent
- [x] **v11.0 GM: Scout Network Tiers** — scoutTier (1-3); Tier2=combine, Tier3=trueOvr; SP upgrades
- [x] **v11.0 GM: Cap Rollover** — capRollover state; unused cap carries (max $10M); shown in cap header
- [x] **v11.0 GM: Veteran Minimum** — VET MIN button OVR≤65; $0.5M/1yr; FA + waiver
- [x] **v11.0 GM: Coaching Hot Seat** — hotSeat state; streak≤-3 warning; streak≤-4 auto-fire
- [x] **v11.0 GM: Player Suspension** — suspensionEvent state; 2%/wk; Handle/Release modal; p.suspended
- [x] **v11.0 GM: Draft Board** — draftBoard state; MY BOARD section; ↑/↓ ordering; gold badges
- [x] **v11.0 GM: Preseason Injury Risk** — preseasonRisk toggle; 8% per starter when ON
- [x] **P74: DB Bump Coverage** — BUMP! on AI passes; -15% comp +6% INT; _bumpActive
- [x] **P75: Scramble Slide** — SLIDE inside own 20; 2-5yd safe gain; _slid
- [x] **P76: Red Zone Run Choice** — DIVE/SWEEP at yardLine≥80; _rzRunChoice
- [x] **P77: Penalty Accept/Decline** — modal after flags; ACCEPT/DECLINE; 3s auto
- [x] **P78: Two-Minute Warning Timeout** — Q2/Q4 ≤120s overlay; FREE TIMEOUT +15s

- [x] **v13.0 GM: International Series Game** — intlGameWk; ✈️ badge; +8 fanSat on win
- [x] **v13.0 GM: Player Endorsement Deals** — endorsed field; 💰 badge; +1SP/4wks per 2 active
- [x] **v13.0 GM: Franchise Milestones** — milestones state; SP rewards for first_season/50wins/title/dynasty
- [x] **v13.0 GM: Conditional Draft Picks** — condition field on R4+ picks; 12% chance; shown in War Room
- [x] **v13.0 GM: Scheme Clash Modifier** — SCHEME_CLASH const; applied in simGame; ±1-2 score adjust
- [x] **v13.0 GM: Restricted Free Agency** — rfaTenders state; RFA Tender btn preseason; RFA badge
- [x] **v13.0 GM: Player Role Assignment** — role field (core/rotation/depth); CORE badge; +0.5 teamStr
- [x] **v13.0 GM: League-Wide Cap Forecast** — capOutlookOpen; collapsible standings panel; all 32 teams
- [x] **v13.0 GM: Draft War Room** — positional needs + best available per position in draft tab
- [x] **v13.0 GM: Player Career Milestones** — 20K pyds / 5K scrimmage / 30 TDs; +1SP each
- [x] **P81: TE Seam Route** — new play; TE upfield 180px; 50-70% catch; 8-18 yds
- [x] **P82: DL Stunts** — pre-snap btn; +8% INT on opponent passes; _dlStunt flag
- [x] **P83: WR Crack Block** — 20% on runs; WR blocks CB; +2-4 yd bonus
- [x] **P84: Pump Fake** — 800ms btn; CB freeze; +10% comp; _pumpFakeBonus
- [x] **P85: Wildcat Package** — new play; KEEP (RB STR run) or PASS (40% comp 8-20 yds)

- [x] **v13.1 GM: NFL Comp Pick Formula** — faLostVal/faGainedVal; OVR×contract net loss; awards R3-R7 pick
- [x] **v14.0 GM: Two-Point Conversion Strategy** — twoPoint in gamePlan; toggle in game plan UI; 15% +1 score chance in simGame
- [x] **v14.0 GM: Injury Insurance** — injInsurance state; 🛡️ Insure (2SP) for OVR≥85; IR → $2M cap relief
- [x] **v14.0 GM: League MVP Race** — mvpRaceLeader state; wk9 check; user QB leading → +3 fanSat
- [x] **v14.0 GM: Offseason Training Camp** — otcFocus state; preseason picker; +1 OVR top 5 in group at season end
- [x] **v14.0 GM: Fan Loyalty Index** — fanLoyalty state; consecutive winning seasons → +2 fanSat/wk per year
- [x] **v14.0 GM: Coaching Buyout** — dead cap on hot-seat fire = salary × contract × 0.5
- [x] **v14.0 GM: Rival Week Score Boost** — +2-3 crowd surge pts in sim game for rivalry matchups
- [x] **v14.0 GM: FA Bidding War Enhancement** — faBid modal shows cap space vs bid needed with color indicator
- [x] **v14.0 GM: Scouting Combine Grade** — combGrade (A+/A/B/C/D) on prospects; colored badge in draft tab
- [x] **v14.0 GM: Player Conduct Fine** — 3%/wk for OVR≥80; $0.5M fine; morale -3; conductEvent state
- [x] **P86: Flea Flicker** — new play; handoff → pitch back → deep; 42-88% catch; 12-28 yds; 10% INT risk
- [x] **P87: End Around** — new play; WR motions to snap; SPD-based 3-18 yds; sweep animation
- [x] **P88: QB Sneak** — 4th down short yardage button (toGo≤2); STR-based 1-4 yds; QB dive tween
- [x] **P89: Blitz Package** — defensive 🚀 BLITZ btn; +15% INT chance on AI pass; _blitzPackage flag
- [x] **PlayCallScene layout** — panelH 310→380, btnH 46→38, gap 5→3; fits 14 plays (6 run, 8 pass)

## Done (v19.0 — 2026-03-26) — Audit Priority Fixes

- [x] **v19 GM: Onboarding Checklist** — preseason wk0 panel; 4 steps auto-detect; dismiss button
- [x] **v19 GM: Auto-Save Indicator** — 💾 saves to localStorage autosave key + `lastSaved` timestamp shown
- [x] **v19 GM: Mobile Scroll** — `overflow-y:auto` on body + flexWrap tabs + min-height on #root
- [x] **v19 GM: Text Play-by-Play Log** — drive log generated per simWk user game; `simGameLog{}` state; 📋 Log button in schedule
- [x] **v19 GM: Season History Browser** — `seasonHistory[]` state archived in newSeason; shown in log tab as Season Archive
- [x] **v19 GM: Consequence Memory Press Conf** — `ownerPromises[]` state; Q7 references prior promises + winning/losing context

## Backlog — Wave 2 (from Audit Innovation List)

- [ ] **v20 GM: Player Comparison Tool** — side-by-side 2-player stat modal from PlayerTable; any two players
- [ ] **v20 GM: Franchise Legacy Score** — single 0-1000 score from wins/champs/playoff apps/gmRep; shown in log tab
- [ ] **v20 GM: Draft Night Live Ticker** — scrolling AI picks ticker at bottom of draft tab during draft
- [ ] **v20 GM: Social Media Feed (Mock)** — 8-10 generated fan/media posts per week in log tab
- [ ] **v20 GM: Player Backstory Generator** — 2-sentence auto-bio on draft prospects using city/trait arrays
- [ ] **v20 GM: Salary Arbitration Panel** — 3-round contract dispute when mid-season extension declined; mediator splits
- [ ] **v20 GM: Ownership Pressure Personality** — owner gets personality (patient/demanding/meddling) at game start; impacts hiring/firing
- [ ] **v20 GM: Franchise Share Code** — 6-char base64 encode of dynasty stats; decode/display on splash screen

## Backlog — Wave 3 (Big Swings)

- [ ] **v21 GM: Playbook Designer** — pick 3 route combos in coaching tab; becomes live Phaser play call options
- [ ] **v21 GM: Multi-Team Trade Desk** — 3-way trade UI; pending offer queue; AI logic
- [ ] **v21 GM: Fan Cam / Stadium Atmosphere** — separate `stadiumAtmosphere` 0-100 affecting FA willingness
- [ ] **v21 GM: AI GM Personality Voice** — each AI team's GM has name + message style on trade offers
- [ ] **v21 Play: Defensive Mini-Game** — user calls Man/Zone/Blitz/Prevent before AI offensive drives
- [ ] **v21 Play: Timeout Management** — explicit TIMEOUT button (3/half); stops clock; triggers 4th-down modal
- [ ] **v21 Play: Replay Engine** — REPLAY button after big plays; re-animates last 3s via stored trail pts
- [ ] **v21 Play: Injury Replay** — red flash + cart animation when player injured in live game

## Backlog — Infrastructure

- [ ] Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
- [ ] Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
