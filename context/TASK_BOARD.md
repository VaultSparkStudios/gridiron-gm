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

## Backlog — Infrastructure

- [ ] Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
- [ ] Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
