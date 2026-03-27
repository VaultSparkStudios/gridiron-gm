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

## Done (v31.0 — 2026-03-26)

- [x] **v31 GM: GM Rep Bar always visible** — persistent XP progress strip between header and message bar; tier (ROOKIE→LEGEND), progress bar, threshold display
- [x] **v31 GM: Stats Hub tab** — new "hub" tab; 5 sections: Season Leaders grid, Franchise History/Dynasty, Roster Grades by position group, AI Storylines, Pro GM
- [x] **v31 GM: Trade Finder auto-suggest** — `runTradeFinder()` scans 31 teams; top 5 proposals with FAIR/UNEVEN/LOPSIDED badge + "Load →" pre-fill
- [x] **v31 GM: Season Recap Card** — 480×270 canvas download; auto-triggers at `simAll()` season end + manual 📊 header button; Download + Copy Text
- [x] **v31 GM: Mobile Responsive layout** — `isMobile` state (window.innerWidth<640) + resize listener; tab bar, main content, header conditional sizing
- [x] **v31 GM: AI Storyline Engine** — offline template mode live in Hub > AI Storylines; Claude proxy mode scaffolded (VITE_CLAUDE_PROXY_URL); `genAIStoryline()`
- [x] **v31 GM: Pro GM stub UI** — Hub > Pro tab with feature list + subscribe button; `docs/PRO_GM_SETUP.md` Stripe integration guide
- [x] **v31 Docs: Project Audit** — `context/AUDIT_v30.md` overall 81/100 (B+); 10 category scores; 30 innovation items ranked
- [x] **v31 Docs: Competitive Analysis** — `docs/COMPETITIVE_ANALYSIS_FOOTBALL_GM_2026.html` vs Football-GM/ZenGM
- [x] **v31 Docs: Ceiling Feature Guides** — PHASER_60MIN, REAL_ROSTER_MODE, CLAUDE_AI_STORYLINE, MULTIPLAYER, PRO_GM setup docs

## Done (v32.0 — 2026-03-26)

- [x] **v32 GM: God Mode / Commissioner Layer** — ⚡GOD tab; godSetOvr() per player, godForceWin(), godAddSP(), godMaxRoster(); team selector; toggle via header ⚡ button
- [x] **v32 GM: GM Contract / Fire System** — evaluateGmContract() at season end; fire risk increments on missed targets; GM Fire modal (lame duck or exit)
- [x] **v32 GM: Urgent Trade Offer popup** — auto-triggers wk4/wk8; 45s countdown; accept or pass; cost: 3rd-round pick
- [x] **v32 GM: Offseason Grade Report Card** — calcOffszGrades(); Draft/FA/Cap/Overall letter grades; auto-opens at newSeason()
- [x] **v32 GM: Today's Challenge splash card** — seed-based weekly challenge (7-pool); shown on splash + generated on mount
- [x] **v32 GM: Draft Lottery Animation** — genDraftLottery(); visual 5-team draw with team colors; God Mode tab button
- [x] **v32 GM: Local Leaderboard** — saveToLeaderboard() at newSeason(); top 10 in localStorage; 🏅 header + splash button
- [x] **v32 GM: Trophy Room modal** — 🏆 header button; achievements + milestones + championship years
- [x] **v32 GM: Multiplayer stub modal** — 👥 header; coming-soon feature list + Supabase docs reference
- [x] **v32 GM: Real Roster Mode stub** — loadRealRosters() fetches /rosters/nfl-2025.json; 5-team stub created
- [x] **v32 Asset: public/rosters/nfl-2025.json** — 5-team community stub (BUF/NE/KC/DAL/SF) with format spec

## Done (v33.0 — 2026-03-27)

- [x] **v33 GM: Auto-Save / Continue** — debounced autoSave() on wk/sp/teams; gm_autosave localStorage; splash "▶ CONTINUE" button shows yr/wk/record
- [x] **v33 GM: Dead Cap Warning modal** — releaseP() gates on dead cap ≥ $2M; shows dead hit, contract, OVR; confirm or cancel
- [x] **v33 GM: Trade Deadline Frenzy** — genDeadlineFrenzy() at wk9; up to 4 AI expiring-contract players; Accept (cost 3rd pick) or Pass
- [x] **v33 GM: Enhanced AI Storylines** — 8 rich offline templates using QB stats, injuries, cap, morale, veteran count, rookies, gmRep, streak, standings; contextually selects 4 best-fit stories
- [x] **v33 GM: Web Share API** — shareViaWebAPI() on Season Recap, Offseason Grade, Trophy Room; native share on mobile / clipboard fallback on desktop
- [x] **v33 GM: Enhanced Multiplayer modal** — 6-item feature list; Supabase setup link; copy game link button
- [x] **v33 Asset: public/rosters/nfl-2025.json** — expanded from 5-team stub to all 32 NFL teams with full key-player rosters

## Backlog (v33 audit brainstorm — unimplemented)

- [ ] **GM: Player Trade Demand system** — players request trades when morale < 30 for 3+ weeks; front office must respond within 2 weeks or face gmRep penalty
- [ ] **GM: Coaching Upgrade tree** — spend SP on OC/DC specific traits (run-heavy, spread, blitz-heavy) beyond current scheme
- [ ] **GM: Rival Week markers** — designate 1 rival per team; weekly game shows rivalry card; win adds +3 fanSat + gmRep
- [ ] **GM: Playoff seeding UI** — visual bracket showing current seeds + win-in scenarios after wk14+
- [ ] **GM: Contract Year Boost** — players in final year get +2 OVR boost for motivation; shown with ⭐ badge
- [ ] **GM: Pre-game Press Conference** — 3-question modal before each game; boost/penalty to morale based on answer tone
- [ ] **GM: Halftime Adjustment** — live sim pause at half; 3 buttons (run-heavy, pass-heavy, blitz); modifier applied to 2nd half
- [ ] **GM: Practice Squad Development** — PS players gain +1 OVR per 3 weeks automatically (currently static)
- [ ] **GM: Fan Satisfaction Events** — fanSat reacts to specific events: record-setting game, star player injury, big FA signing
- [ ] **GM: Advanced Draft Board filters** — filter by age range, pot tier, pos need score, combine grade
- [ ] **GM: Scouting Department Expansion** — hire up to 3 scouts with different specialties (OL, DB, skill players)
- [ ] **GM: Season-End Awards modal** — MVP, DPOY, OPOY, Rookie of Year, Coach of Year; auto-calculated from sim stats
- [ ] **GM: Division Power Rankings sidebar** — live division standings mini-widget in schedule tab header
- [ ] **GM: Injury Prone player flag** — players with 3+ injuries in history get ⚠️ badge; affects FA signing interest
- [ ] **GM: Weather-aware game plan** — if gridiron-gm-play has weather flag, suggest run-heavy plan vs bad weather
- [ ] **Play: Full 60-min game clock** — possession tracking, 4 quarters, game-ending scenarios (see docs/PHASER_60MIN_GAME_SETUP.md)
- [ ] **Play: 2-point conversion plays** — dedicated play type after TD; risk/reward decision; affects sim bridge
- [ ] **Play: Onside kick** — low-success-rate kickoff variant; available when trailing in 4th Q
- [ ] **Play: Field goal range indicator** — kicker OVR → max reliable range shown on field during play call
- [ ] **Play: Pass rush counter-moves** — swim move, spin, bull rush variants in pass rush mini-game
- [ ] **Infrastructure: Cloudflare Worker analytics** — fill VITE_ANALYTICS_URL; events: game_start, season_end, trade_accepted, playoff_win
- [ ] **Infrastructure: Claude proxy for AI storylines** — deploy proxy Worker; set VITE_CLAUDE_PROXY_URL (see docs/CLAUDE_AI_STORYLINE_SETUP.md)
- [ ] **Infrastructure: Stripe Pro GM** — Stripe Checkout + webhook; unlocks Pro features (see docs/PRO_GM_SETUP.md)
- [ ] **Infrastructure: Supabase multiplayer** — schema + realtime sync (see docs/MULTIPLAYER_SETUP.md)
- [ ] **Content: Reddit/Discord community launch** — r/FootballGames, r/webgames post; Discord server setup

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

## Done (v20.0 — Wave 2 — 2026-03-26)

- [x] **v20 GM: Player Comparison Tool** — CompareModal; ⚖ button in PlayerTable; side-by-side stats
- [x] **v20 GM: Franchise Legacy Score** — 0-1000 metric in log tab (wins/champs/playoff apps/gmRep)
- [x] **v20 GM: Draft Night Live Ticker** — draftTicker state; scrolling AI picks in draft tab
- [x] **v20 GM: Social Media Feed (Mock)** — socialFeed state; generated per simWk; 6 posts in log tab
- [x] **v20 GM: Player Backstory Generator** — BSTORY arrays; p.bio.backstory in genDC; shown in player modal
- [x] **v20 GM: Salary Arbitration Panel** — arbModal state; 3-round dispute from re-sign; Arb button OVR≥70
- [x] **v20 GM: Ownership Pressure Personality** — ownerPersonality (patient/demanding/meddling); header badge
- [x] **v20 GM: Franchise Share Code** — btoa dynasty stats; copy button in log tab

## Done (v21.0 — Wave 3 — 2026-03-26)

- [x] **v21 GM: Playbook Designer** — PLAYS_POOL; pick 3 in coaching tab; playbook state; saved/loaded
- [x] **v21 GM: Multi-Team Trade Desk** — 3-way trade UI in trade tab; tradeDeskOpen toggle; execute button
- [x] **v21 GM: Fan Cam / Stadium Atmosphere** — stadiumAtm 0-100; atm bar in standings; FA willingness modifier
- [x] **v21 GM: AI GM Personality Voice** — AI_GM_NAMES + AI_GM_VOICE arrays; trade offer banner quote
- [x] **v21 Play: Defensive Mini-Game (P100)** — Man/Zone/Blitz/Prevent before AI drives; covB/sackB bonuses
- [x] **v21 Play: Timeout Management (P101)** — TO(3) button; clock stop; 4th-down modal
- [x] **v21 Play: Replay Engine (P102)** — REPLAY button after plays; ball tween from origin to result
- [x] **v21 Play: Injury Flash (P103)** — red screen flash + cart tween on player injury

## Done (Polish Pass — 2026-03-26)

- [x] **Bug: startGame missing state resets** — added setStadiumAtm(50)/setPlaybook([])/setArbModal(null)/setCompareSlots([])
- [x] **Bug: playbook had zero gameplay effect** — wired into simGame via _uPlan; +1 score for full 3-play book
- [x] **Bug: FieldScene _defMiniGameUsed/replayStore not in create()** — added P100-P103 flag init block
- [x] **Bug: replayStore/replayBtn leaking between plays** — cleared at presnap reset each play

## Done (v22.0 — Polish + Wave 4 + Wave 5 — 2026-03-26)

### Polish Pass Bug Fixes
- [x] **Bug: startGame missing resets** — setStadiumAtm/setPlaybook/setArbModal/setCompareSlots added
- [x] **Bug: playbook no gameplay effect** — wired into simGame (+1 score for full 3-play book)
- [x] **Bug: FieldScene P100-P103 flags not in create()** — added full init block
- [x] **Bug: replayStore/replayBtn leaking** — cleared at presnap reset each play

### Wave 4: Play Expansion (P104–P110)
- [x] **P104: KO Return Lane Choice** — LEFT/MIDDLE/RIGHT modal pre-return; shuffled yard bonuses; 4s auto
- [x] **P105: 2-Min Drill Spike** — SPIKE button shown when state._drillMode; clock-stop incomplete
- [x] **P106: No-Look Pump Fake** — NO LOOK button at 250ms into pass_wait; CB bites WR1; +14% comp
- [x] **P107: Crossing Route** — new play; TE crosses field; THROW! at 500ms; 62%+ comp; LB INT risk
- [x] **P108: Defensive Strip-Sack** — STRIP! button when DL within 35px; 22% forced fumble
- [x] **P109: WR Bubble Screen** — new play; WR flat; 3-cut choice (IN/STRAIGHT/OUT); comp by SPD/CB
- [x] **P110: Directional Onside** — LEFT/CENTER/RIGHT pick before tap game; shuffled hidden recovery % mods

### Wave 5: GM Polish + Monetization
- [x] **v22 GM: Dynasty End Screen** — every 5 seasons; full overlay recap card; 6-stat grid; legacy tier; copy recap
- [x] **v22 GM: Share Season CTA** — post-wk18 copy-to-clipboard tweet template in log tab
- [x] **v22 Analytics** — already wired; VITE_ANALYTICS_URL env var; track() calls on key events

- [x] **v23 GM: I1–I10** — AI GM dialogue, comeback arc, draft buzz, owner arc, live ticker, HOF ballot, rival trash talk, holdout mini-game, documentary card, cap arbitrage
- [x] **P111-P116 Play: Bug fixes + I11-I13/I17-I19** — TDZ fix, nlPumpEls leak, noHuddle dismiss, _resetPlayFlags, star banners, QB streak, disguise defense, AI personality, grade summary, victory screen

## Done (v24.0 — SIL closeout — 2026-03-26)

- [x] **[SIL] Play: I14** — play-clock pressure escalation (≤5s: camera shake + clock pulse)
- [x] **[SIL] Play: I15** — trick play consequence memory (2nd trick = coverage penalty `_trickPlayMem`)
- [x] **[SIL] Play: I16** — comeback tracking overlay (🔥 COMEBACK! banner when ≥7-pt deficit erased for TD)
- [x] **[SIL] Play: I20** — weather escalation in 2nd half (fumble/hold ×1.25 rain / ×1.40 snow)
- [x] **[SIL] Play: QB streak HUD indicator** — 🔥 HOT / ❄️ COLD badge in HudScene (streakTxt)
- [x] **GM: fix stray JSX `}` in player modal RFA badge** (line 979 — esbuild warning cleared)

## Done (v25.0 — Audit I21–I50 — 2026-03-26)

### Play Engine (gridiron-gm-play) — commit cf35d8e
- [x] **I21** — AI down & distance logic matrix (3rd & short = run power, 3rd & long = pass, RZ run-heavy)
- [x] **I22** — Safety pursuit on gains ≥8 yards — boosts fumble pressure via S speed/RNG check
- [x] **I23** — Route visualization pre-snap — blue arcs per receiver fade to 0 at snap (360ms tween)
- [x] **I24** — Timer registry / scene cleanup — `_regTimer()` wraps 5 loop `addEvent` calls; `shutdown()` clears all
- [x] **I25** — Streak difficulty nudge — `_dynNudge = clamp(streak*0.012, ±0.06)` applied to `_diffMod`
- [x] **I26** — Zone coverage visual — Cover2/Prevent shows dual ellipse arcs (blue/purple, 900ms)
- [x] **I28** — FG trajectory arc — animated ball circle tweens parabolic path to uprights (green/red by result)
- [x] **I30** — Receiver separation dot — green/yellow/red dot above each receiver 200ms post-snap
- [x] **I31** — AI 2-min urgency — inter-play delay 700ms (vs 1800ms) when AI trailing in drill mode
- [x] **I32** — Fatigue visual — runner alpha dim + orange stroke ring when `_fatigue > 60`

### GM App (gridiron-gm) — commit cf17bf4
- [x] **I39** — `defaultSaveState()` factory (canonical v:3 shape; all saves merge against it)
- [x] **I40** — Reactive owner events post-game (comeback win / shutout / walkoff → owner message + gmRep)
- [x] **I41** — Trade partner intelligence ("FIND TRADE" button scans AI teams for your top 2 position needs)
- [x] **I44** — League-wide simulated transactions feed (1–2 AI-AI moves per simWk in LEAGUE WIRE log)
- [x] **I46** — Difficulty presets at new game (Casual / Standard / Hardcore with cap/SP/fire modifiers)
- [x] **I47** — Week preview card in schedule tab (weather + injury report + opponent strength + headline)
- [x] **I48** — Player career trajectory sparkline (last 4 seasons OVR trend in player modal)
- [x] **I49** — Draft war room live clock (90s countdown per pick, auto-draft BPA on expire)

### Play Scene Fixes (gridiron-gm-play)
- [x] **I36** — Drive chart timeline in HudScene — colored segment bar per play (green/grey/gold/red)
- [x] **I29** — Play call history sidebar in PlayCallScene — last 5 calls with yards/result
- [x] **GameOverScene** — MVP badge, drive chart cap (6 rows/side), overlap bug fixes
- [x] **BootScene** — difficulty badge top-right, streak/weather overlap fix
- [x] **sound.js** — bigPlay, fumble, fg, penalty, crowd SFX methods

## Done (v26.0 — Audit I51–I80 — 2026-03-26)

### Play Engine (gridiron-gm-play)
- [x] **I51** — User-controlled Safety dot during AI drives — WASD movement; tackles aiRunner on collision
- [x] **I52** — Half-time adjustment cards — 3 coaching picks: Quick Strikes / Tighten Up / Run First; apply to 2nd half
- [x] **I53** — Formation shift tween on audible — OL/WR/TE/RB shift 12-14px (220ms yoyo) when audible called
- [x] **I54** — Penalty flag arc animation — yellow rectangle tweens from QB to midfield on any flag
- [x] **I55** — Highlight reel on GameOver — bestPlay dot tween animation + label 800ms post-load
- [x] **I56** — Mid-game weather progression — 25% chance weather worsens at Q3 (clear→rain, rain→snow)
- [x] **I57** — Coach headset quote ticker — situational quote in PlayCallScene below down/distance
- [x] **I58** — End zone celebration tween — runner spins 360° + gold circle arcs upward on user TD
- [x] **I59** — Practice drill mode — PRACTICE button in BootScene; rookie/drillMode state; unlimited plays
- [x] **I60** — Crowd reaction meter — score-delta-driven bar below HUD (green/amber/red)
- [x] **I61** — AI no-repeat rule — `_aiCallLog` prevents 3 consecutive same call type; forces alternation
- [x] **I62** — Run hole reading visual — green/red triangles between OL gaps at snap (300ms life)
- [x] **I63** — Night game dark mode — dark grass for rival matchups (50% chance, 0x0a1f12/0x0c2818)
- [x] **I64** — Defensive pressure ring — shrinking red ring toward AI QB; BLITZ at close range = +15% sack
- [x] **I65** — Snap count fake visual — QB count 1→2→3 text on draw plays before handoff
- [x] **I76** — Volume/settings overlay in BootScene — gear icon → SFX vol slider ±10% steps; persisted localStorage
- [x] **I78** — Cross-play personal records — best pass/rush/TD per game persisted, shown on GameOver
- [x] **I79** — Bridge validation indicator — ● GM LIVE / GM STALE / DEFAULT ROSTER badge in BootScene

### GM App (gridiron-gm)
- [x] **I66** — Salary cap bar chart — stacked position group visualization in roster tab (QB/OL/WR/TE/RB/DEF/K)
- [x] **I67** — Franchise timeline — horizontal season strip in log tab (record, playoff, champion crown)
- [x] **I68** — Trade deadline countdown — "X WEEKS" widget in schedule tab from week 8–10
- [x] **I69** — Roster health dashboard — 14-position color-coded dot grid in roster tab
- [x] **I70** — AI GM reactive trade quotes — personality-driven voice line (rebuilder/win-now/analytics) on offers
- [x] **I71** — Achievement system — 10 milestones, earned badges in log tab, unlock tracking in save state
- [x] **I72** — Sim game progress bar — animated loading bar during simWk (400ms async wrapper)
- [x] **I73** — Player morale timeline — conf sparkline (last 6 weeks) in player modal
- [x] **I74** — Positional needs matrix — A-F gap grade grid in trade/draft tabs
- [x] **I75** — Live injury toasts — fixed-position toast stack during simWk (3s auto-dismiss)
- [x] **I77** — Veteran farewell event — special card for OVR 80+ retirees + fanSat boost for OVR 85+
- [x] **I80** — Draft scouting report cards — top 5 prospect visual card strip in draft tab

## Done (v27.0 — 2026-03-26 — Backfill + New Wave)

- [x] **I27** — Turnover celebration flash — gold "TURNOVER!" 800ms pulse on INT/fumble
- [x] **I33** — Pocket collapse tween — each OL dot tweens 25% toward QB when beaten (220ms)
- [x] **I34** — Blitz telegraph — first 2 pocket dots nudge 15px forward pre-snap on blitz call
- [x] **I35** — First-down conversion flash — bright green LOS line overlay 400ms on conversion
- [x] **I37** — AI red zone tendency — yardLine≥90: passCh -= 0.25 (forces ~65%+ run rate)
- [x] **I38** — Field position penalty — drives starting at yardLine≤10 get -4% compCh
- [x] **I42** — Trade value tag (TV formula) in player modal
- [x] **I43** — Conference power index (AFC/NFC top 3) in standings
- [x] **I45** — Bye week strategy panel (REST/FOCUS)
- [x] **I50** — Pre-draft rumor mill (3 AI team position buzz cards)
- [x] **MLE signing** — Mid-Level Exception FA once/season, max $6M/yr, LOYAL discount
- [x] **Player loyalty** — p.snaps tracked weekly; LOYAL badge after 48 snaps; TV discount
- [x] **Snap count tracker** — p.snaps displayed in player modal (⚡ X snaps)
- [x] **PS promotion race** — wk10 top-2 PS players compete; winner promoted free
- [x] **Post-game locker room speech modal** — 3 choices (Inspire/Challenge/Calm) after user game
- [x] **P120** — Extended jump route — LATE JUMP 2nd window 300ms after first closes
- [x] **P121** — Pocket shuffle step — ↔ SHUFFLE button during pass_wait; QB sidesteps ±8px
- [x] **P122** — Personal foul — 8% chance on AI run >8yds; +15yds auto 1st down; flag visual
- [x] **P123** — WR double move SHAKE! — button during pass_wait; +15% comp on next throw
- [x] **P124** — Fresh DL sub — once/half pre-snap button; +12% AI run speed
- [x] **P125** — OT defeat card — overlay on overtime loss in GameOverScene

## Done (v28.0 — 2026-03-26 — Audit + Engagement Polish)

- [x] **I-A: Analytics funnel** — live_game_start / live_game_finish / champion events wired
- [x] **I-B: Share Card modal** — visual team-branded W-L + champion badge + copyable share string
- [x] **I-C: Onboarding Intro modal** — 3-tip first-launch wizard (localStorage gm_intro_shown)
- [x] **I-D: ErrorBoundary** — main.jsx crash recovery UI; localStorage save survives
- [x] **BRAIN.md** — stale v3.2 reference corrected to v27.0/v28.0
- [x] **OPEN_QUESTIONS** — all 4 questions resolved and closed
- [x] **DECISIONS.md** — 4 new architectural decisions appended

## Done (v29.0 — 2026-03-26 — Backlog Closeout)

- [x] **[SIL] OG cover.png** — generated via scripts/gen-og-node.mjs (node-canvas); both repos cover.png in public/images/
- [x] **[SIL] Live stat write-back** — addS(p.ss, liveStats[userSide][pid]) in useEffect([liveDone]); +gp:1; QB rate recalc
- [x] **Analytics .env.local** — .env.local created in both repos; VITE_ANALYTICS_URL ready to fill in
- [x] **Season summary card** — auto-opens showSeasonSummary modal on championship; stat leaders + copy/share
- [x] **Snap-count milestone toast** — _newLoyalPlayers collected at wk snap loop; ❤️ LOYAL toast via injToasts on first hit

## Done (v30.0 — 2026-03-26 — 35 Innovations + Audit Fixes)

### GM App (gridiron-gm) — commit 30eb5fa
- [x] **Beat Reporter** — weekly AI reporter generates post-game write-ups in log tab
- [x] **Save Slots** — 3 save slots in dev tab; switch active save mid-session
- [x] **Legacy Records** — franchise records (most wins/TDs/etc.) tracked and displayed in log tab
- [x] **DDA (Dynamic Difficulty Adjustment)** — ddaAdj state; window._gmDDA global; simGame reads modifier; ±0.06 nudge per streak
- [x] **Parade Screen** — championship confetti overlay with parade route and fan celebration
- [x] **Draft Day Animation** — animated pick card reveal with team logo flash on draft day
- [x] **Cap Restructuring** — convert guaranteed money to voidable years; prorated cap hit tool
- [x] **AI GM DMs** — rival GM direct message panel; personality-driven negotiations
- [x] **Player Arc System** — players have narrative arcs (breakout/decline/redemption) shown in modal
- [x] **Speedrun Mode** — dev tab toggle; compresses week sim timing for rapid testing
- [x] **Coaching Specialization** — OC/DC have specialty slot (red zone, 3rd down, etc.) with bonuses
- [x] **Trade War Room Timer** — 90s countdown on AI trade offers; auto-decline on expire
- [x] **Custom Team Creator** — name/city/abbreviation/colors at new-game setup
- [x] **Injury Rehab Decisions** — weekly rehab choice modal (rest/push/therapy) for injured players
- [x] **Power Rankings Broadcast** — weekly power rankings overlay card shown post-simWk
- [x] **Historical Challenges** — unlock/play scenarios based on real historical game setups
- [x] **Chemistry Graph** — team chemistry visualization toggle in roster tab
- [x] **Media Week Pressure** — storyline pressure cards before big games; affects gmRep
- [x] **Franchise Sale** — sell franchise option in owner tab; triggers dynasty end + legacy score
- [x] **SIL Score Badge** — dev tab shows current SIL score breakdown
- [x] **Newspaper Modal** — weekly newspaper front page generated from sim events
- [x] **FA Combine Showcase** — pre-FA scouting combine mini-event with measurables
- [x] **AI Spectator Mode** — "Watch" button auto-plays live game without user interaction
- [x] **PWA manifest** — public/manifest.json + index.html meta tags; installable as app

### Play Engine (gridiron-gm-play) — commit c4487ce
- [x] **I-30 Web Speech Commentary** — _speak() helper; zero-cost TTS on user TD / INT / sack / FG / game end
- [x] **Commentary Toggle** — COMMENTARY ON/OFF in BootScene settings overlay; persisted localStorage
- [x] **I-4 Game Plan Bridge** — gamePlan field in gm_roster_export; BootScene extracts → window._gmGamePlan; FieldScene applies ±0.12 passCh modifier
- [x] **I-7 Highlight Card Download** — 400×225 canvas card in GameOverScene; score, MVP stats, watermark; "📷 HIGHLIGHT CARD" button
- [x] **Analytics: user_td event** — track('user_td', {yardLine, quarter}) on user touchdown
