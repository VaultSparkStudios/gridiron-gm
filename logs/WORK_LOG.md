# Work Log

Append entries. Do not edit historical entries.

---

## 2026-03-25 (session 18 — v11.0)

- Session: v11.0 — 10 GM features + P74–P78 Phaser features
- IR Auto-Return (irReturnWk countdown, auto-roster in simWk)
- Player Personality (p.personality, badges, Leader/Loner/Hothead/Grinder effects)
- Rival Game Boost (RIVALRY WEEK banner, +4 teamStr)
- Scout Network Tiers (scoutTier 1-3, combine/trueOvr unlocks, SP upgrades)
- Cap Rollover (capRollover, unused cap carries max $10M)
- Veteran Minimum (VET MIN $0.5M/1yr for OVR≤65)
- Coaching Hot Seat (hotSeat state, auto-fire at streak≤-4)
- Player Suspension (suspensionEvent, 2%/wk, Handle/Release modal)
- Draft Board (draftBoard ordered pids, MY BOARD section, ↑/↓)
- Preseason Injury Risk (preseasonRisk toggle, 8% per starter)
- P74: DB Bump Coverage; P75: Scramble Slide; P76: Red Zone Run Choice
- P77: Penalty Accept/Decline; P78: Two-Minute Warning Timeout
- Both builds clean; committed; context updated

---

## 2026-03-25 (session 17 — v10.0)

- Session: v10.0 — 10 GM features + P69–P73 Phaser features
- Salary Cap Floor (CAP_FLOOR=150, auto-sign FA, roster banner)
- Player Option Years (p.playerOption, 60% opt-out, OPT badge)
- PUP/NFI Designations (p.irType, PUP/NFI/IR, colored badges)
- Coaching Tree Legacy (coachLegacy, 20% protege +3 on hire)
- Draft Pick Compensation (compPickQueue, gmRep≥60 + lost FA → comp pick)
- Franchise QB Mode (franchiseQB state, FQB badge, +5 teamStr, 1SP/season)
- Depth Chart Battles (Battle 1SP preseason, winner +1 OVR, battlesDone)
- Trade History Feed (tradeHistory, user + AI-AI trades, collapsible trade tab)
- Breakout Alert (breakoutAlerts, +2 OVR → BREAKOUT banner)
- Scout Accuracy Decay (scoutTimestamps, freshness bar FRESH/AGING/STALE)
- P69: Pass Interference (12% deep incomplete, +15yds auto 1st down)
- P70: Hurry-Up Defense (PREVENT/AGGRESSIVE modal Q4 AI score)
- P71: Motion Pre-Snap (MOTION button, WR1 tween, comp mod)
- P72: Third Down Tracker (HUD, momentum burst at 50%)
- P73: Sideline Route (PlayCallScene new play, clock stops)
- Both builds clean; committed; context files updated

---

## 2026-03-25 (session 16 — v9.0)

- Session: v9.0 — 10 GM features
- Offseason Extensions (Extend 2SP in PlayerModal, +2yr 15% raise, p.offsznExt)
- Practice Squad Poaching (psPoachAttempt state, 15%/wk, Block 1SP / Let Go modal)
- Coaching XP (coach.xp, +3/win +1/loss, level up at 20 XP +5 rating, XP bar in coaching tab)
- Injury Prone Flag (p.injCount, p.fragile at ≥2, ⚠️ badge in PlayerTable + modal)
- Trade Deadline Urgency (deadlineUrgency state, wk10 check, CONTEND/SELL modal, gmRep +1)
- Gem Scout (gemScout state, Scout Gem 1SP in draft, R4+ pot boost to 85+, ⭐ GEM banner)
- UDFA Pool (udfaPool state, 8 UDFAs after R7, Sign to PS max 5)
- Holdout Escalation (holdoutWks{} state, 2+ wk → morale -3 gmRep -1)
- Rookie Wage Scale (rookieSlot() helper, R1 fixed salary, shown in draft + log)
- Expansion Draft (expansionMode/expansionProtected state, yr≥3, protect 15, Las Vegas Aces)
- Both builds clean; committed; context files updated

---

## 2026-03-25 (session 9 — batch 8)

- Session: salary cap penalties, coaching contract expiry, P28 red zone fade route
- gridiron-gm: cap penalty check at simWk start (>$200M → +$5M dead cap + 3rd-round pick forfeit for user; CPU silent); red warning banner in roster tab; `genCoach()` adds `contract:R(1,3)`; `newSeason` decrements + auto-fires expired coaches to faCoaches; CoachCard shows Nyr left (red≤1); `reSignCoach(role)` preseason 1SP +2yr; Re-sign button on card when contract≤1; v5.7
- gridiron-gm-play: P28 — `_onPlayCalled` intercepts pass_* inside yardLine≤15; `_showFadeOption()` 2-button modal with 3s auto-dismiss; `_startFadeRoute()` WR+CB endzone corner, ball arc 1100ms, CATCH! button at 900ms; `_resolveFade()` WR vs CB OVR (40-85%), TD or incomplete; _noHuddleActive guard; P28
- State: both builds clean; gridiron-gm v5.7 / gridiron-gm-play P28

---

## 2026-03-25 (session 8 — batch 7)

- Session: player morale events, injury severity tiers, P27 pass rush mini-game
- gridiron-gm: 3 morale events per team/week (trade request 5%, holdout 4%, leadership boost 7%); injSev+injRecWks fields; simGame rolls severity (40% minor 1-2wk / 40% moderate 3-5wk / 20% major 6-8wk); major auto-placed on IR in simWk; recovery countdown via injWk; modal shows type+sev+weeks; newSeason clears severity; v5.6
- gridiron-gm-play: P27 — ⚡ BLITZ button on _startAIPass (720ms window); _activatePassRush() reschedules to 1500ms; _passRushMode speeds up userDef +12px/s; _checkRushResult() sack if dist<22; _passRushCoverBreak lowers INT threshold -20 on miss; P27
- State: both builds clean; gridiron-gm v5.6 / gridiron-gm-play P27

---

## 2026-03-25 (session 7 — batch 6)

- Session: P26 two-point conversion mini-game, coaching staff upgrades, waiver wire system
- gridiron-gm: `upgradeCoach(role)` (2 SP → +5 rating, max 95, ⬆ button on CoachCard); `waivers[]` state + saveGame/loadGame; `releaseP` sends to waivers during regular season; `simWk` processes waivers (CPU worst-first, 60% claim, unclaimed→FA); waiver wire UI in freeagency tab (amber header, Claim button); `setWaivers([])` in startGame/newSeason; v5.5
- gridiron-gm-play: P26 — `_startTwoPointPlay()` launched from PATChoice GO FOR 2; qb/wr1/dl positioned at yards 5/3/8; WASD QB, DL pursues 55px/s, 3.5s countdown; `_resolveTwoPoint(success,reason)` awards pts, post-PAT flow; `two_point` phase in update(); P26
- State: both builds clean; gridiron-gm v5.5 / gridiron-gm-play P26

---

## 2026-03-25 (session 6 — batch 5)

- Session: P25 hurry-up defense, scout report depth, mid-season contract extension
- gridiron-gm: `scGrade(ovr)` helper A+→F; top-5 scouted prospects panel per position in scouting tab (scoutLvl≥1, shows above filter row, only when scout hired); `extendContract(pid,addYrs)` (regular season, 1 scPts, +1yr/+2yr buttons in player modal, salary flat, logged); v5.4
- gridiron-gm-play: P25 — `_aiHurryUp` flag; triggers when Q4 + state.score.opp−state.score.team≥7; skips _showDefCall, flash banner, pass chance 0.65, _aiRunSpeed×1.08; flag resets each drive; P25
- State: both builds clean; gridiron-gm v5.4 / gridiron-gm-play P25

---

## 2026-03-25 (session 5 — batch 4)

- Session: depth chart auto-fill, trade surge, coaching hot seat, draft grades, cap forecast, preseason games, rookie dev camp, P22 muffed punt, P23 no-huddle, P24 goal line stand
- gridiron-gm: `⚡ Auto-Fill by OVR` button in depth chart; trade surge (wk 8-10 probability 0.22→0.44) + surge banner; coaching hot seat (wk≥12, ≤3W, 25% fire OC/DC); `gradePick()` A+→F grade helper logged on pick; cap forecast panel (yr+1/yr+2 projected space + expiring count); `preseasonGames` state + Sim Preseason button (2 exhibitions, no W/L, depth standout); dev camp panel (preseason, 3 SP → +3 OVR for rookie ≤23); v5.3
- gridiron-gm-play: P22 — 5% muff in `_launchPuntReturn`, `_launchMuffedPunt(catchYard)`, `muffed_punt` update phase, proximity recovery; P23 — `_lastPlayGainedFirstDown` flag, `_showNoHuddleOption()` modal, CB/LB displacement; P24 — `_showGoalLineStand()` triggers when yardLine≤3, 6 defenders, user LB, STR-scaled AI RB, 4s timer, `goal_line` phase; P24
- State: both builds clean; gridiron-gm v5.3 / gridiron-gm-play P24

---

## 2026-03-25 (session 3)

- Session: 18-week season, NFL stat calibration, stage tracker, per-game stats, DEV tab
- gridiron-gm: `genByeWeeks` assigns 1 bye/team in wks 5-14; `genSched(teams,byes)` 18-week schedule; `byeMap` state; `simPG` rewritten to NFL targets (QB ~255 yds, WR ~85, TE ~56, LB ~9 tkl); `simGame` base G(22); schedule tab 17→18 + bye week row; stats tab shows `X.X/g` per-game averages; league stage tracker (stage strip: PRE→SEASON×18→PLAYOFFS→COMBINE→DRAFT→FA, bye week `B` boxes in purple); DEV tab shows per-position stat simulation vs NFL targets; v4.5
- State: gridiron-gm v4.5 build clean (326kB); gridiron-gm-play unchanged (P18)

---

## 2026-03-25 (session 2)

- Session: player confidence, locker room events, GM reputation, P18 kickoff return blocking
- gridiron-gm: Added `conf` (0-100) field to genPlayer (shown in player modal CONF slot); `LKR_EVENTS` (8 types) fire 15%/week in simWk — shift conf for up to 40% of roster + morale, logged to game log; `gmRep` (0-100) on teams, persists across seasons — gains: +1/win +2/re-sign +1/trade +1/draft pick; tiers ROOKIE→LEGEND; perks: RESPECTED(60+) +1 SP/wk, ELITE(75+) 10% re-sign discount; header + roster cap bar display; v4.4
- gridiron-gm-play: P18 — 3 BLK wedge blockers spawned in `_launchKickoffReturn`, lerp ahead of runner; coverage dot within 20px → `_engagedCvg.add()` → 1800ms freeze; `_aiRushers` skips engaged; hidden on `_tackled()`/`_endPlay()`
- State: both builds clean; gridiron-gm v4.4 / gridiron-gm-play P18

---

## 2026-03-25

- Session: picks in trades, contract re-signing, in-game injuries bridge, weekly game plan, weather system
- gridiron-gm: Modern analytics PICK_VAL chart (4000→60); genTradeOffer 3 offer types (player+pick sweetener, picks-only); acceptTrade picks transfer; reSign(pid,yrs) + RES_MAX + preseason RE-SIGN WINDOW panel; importPlayResult reads injuries[]; gamePlan state + simGame(hPlan,aPlan) modifiers; Schedule tab Game Plan UI
- gridiron-gm-play: P14 injuries (tackle ~7%RB/4%QB, sack ~5%QB → state.injuries[] → gm_game_result); GameOver injury display; P15 weather (clear/rain/snow roll in BootScene, tint+animated drops, pass/fumble gameplay effects)
- State: both builds clean; gridiron-gm v4.1 / gridiron-gm-play P15

---

## 2026-03-10

- Session: v3.2 feature implementation and bug fixes
- Implemented: Sim Draft + Pause/Resume, Enhanced Roster Table (PlayerTable), FA Table Overhaul, Clickable Box Scores (BoxModal), Live Sim with SVG field and Player of the Game
- Fixed: Live sim result commit via useEffect([liveDone]), operator precedence bug in advanceLivePlay TD tracking, simWk/simAll re-sim guard
- State: src/App.jsx ~650 lines, all features working, npm run build passes

---

## 2026-03-24

- Session: Studio OS migration
- Applied full VaultSpark Studio OS structure to gridiron-gm repo
- Fixed vite.config.js base path from `/Gridiron-GM/` to `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"`
- Added `build:pages` script and `scripts/postbuild-pages.mjs` for SPA 404.html fallback
- Created AGENTS.md with project identity, read order, non-negotiable rules
- Created full context/ structure: PROJECT_BRIEF, BRAIN, SOUL, CURRENT_STATE, DECISIONS, TASK_BOARD, OPEN_QUESTIONS, LATEST_HANDOFF, PORTFOLIO_CARD, PROJECT_STATUS.json
- Created logs/WORK_LOG.md (this file)
- Created docs/ files: GAME_LOOP, SYSTEMS, CONTENT_PLAN, LIVE_OPS, CREATIVE_DIRECTION_RECORD, STUDIO_DEPLOYMENT_STANDARD, STUDIO_BACKEND_PLAN, DEPLOY_PAGES
- Created docs/templates/ directory with studio deployment templates
- Created prompts/start.md and prompts/closeout.md
- Updated .github/workflows/: replaced deploy.yml with ci.yml + deploy-pages.yml per studio standard
- Created CODEX_HANDOFF_2026-03-24.md
- State: Build passes, repo is now fully Studio OS compliant

---

## 2026-03-24 (continued) — v3.6+ dual-repo work

- Session: OL sub-positions + Studio OS for both repos
- App.jsx: Replaced OL with 5 positions (LT/LG/C/RG/RT) across POS, PP, CA, PA, STRS, WKNS, genRoster, teamStr, getTeamNeed, genDC, newSeason rm, pC colors, genLivePlay sack formula
- gridiron-gm-play FieldScene: 5-man OL dots (this.lt/lg/c/rg/rt), this.oLine array, formation at LOS, 5-man pocket, individual beat timers, independent run blocking
- gridiron-gm-play defaultRoster: Named OL starters (Trent Williams, Q. Nelson, etc.)
- gridiron-gm-play Studio OS: Created full structure — AGENTS.md, context/, logs/, docs/, prompts/
- gridiron-gm context: Updated CURRENT_STATE, TASK_BOARD, DECISIONS, LATEST_HANDOFF to v3.6+ state
- State: Both repos build, 5-man OL working, Studio OS compliant in both repos

---

## 2026-03-24 (continued) — v3.7 backlog clearance

- Session: Complete all backlog items in one session
- gridiron-gm App.jsx: Injury depth chart (DepthChartView + DC_S + Roster tab toggle), save/load JSON state (saveGame/loadGame + 💾/📂 buttons), 4th-down decision UI (punt/fg/goforit panel before play call)
- gridiron-gm-play FieldScene: Defense sub-position labels (DE/DT/MLB/OLB/FS), drive tracking for team and AI possessions
- gridiron-gm-play gameState: Added drives[]/currentDrive to state and resetState
- gridiron-gm-play GameOverScene: Drive chart with two-column layout, color-coded result
- gridiron-gm-play: ci.yml GitHub Actions workflow
- Both builds clean: gridiron-gm 303kB, gridiron-gm-play 1240kB (Phaser bundle, pre-existing warning)
- State: Both repos committed (not yet pushed)

---

## 2026-03-24 (continued) — P7/P8/mobile/progression/AI FA/fumbles

- Session: Continued from context compaction; completed all remaining backlog and additional features
- gridiron-gm-play: P7 (4th-down panel, PAT choice, FG handler, punt, position string fixes), P8 (kickoff return mini-game — opening kick, user/AI returns after each score), mobile (Scale.FIT, user-scalable=no, D-pad sz=44) — committed master b410796
- gridiron-gm App.jsx: Player progression visibility (⬆ DEV badge in PlayerTable, dev report in game log, expFAs to FA market) — committed main 4553108
- gridiron-gm App.jsx: AI FA signings on season rollover (CPU teams claim expFAs to fill holes, filtered out of user pool), fixed setLog spread bug — committed main a9d82d7
- gridiron-gm-play FieldScene: Fumble mechanic on tackle (~4% base rate, RB str-weighted, possession flip, red flash, drive chart FUM) — committed master 7a52c14
- Both builds clean: gridiron-gm 305kB, gridiron-gm-play 1247kB
- State: All committed; nothing mid-flight


## 2026-03-24 — Season awards + P10

### gridiron-gm (be4c860)
- Season awards computed in `newSeason()`: MVP (QB passer RTG), OPOY (RB/WR/TE yds+TDs), DPOY (DL/LB/CB/S sacks+tkl+ints)
- Three award log lines prepend the `--- NS Season ---` block

### gridiron-gm-play (a713645)
- `_showHalftime()`: full-screen overlay with score + stats; fires Q3+ first play; 4s then 2nd-half kickoff return
- `_showTwoMinWarning()`: banner overlay + whistle SFX; fires at plays 14 (Q2) and 38 (Q4)
- `gameState.js`: `_halfShown`, `_twoMin1`, `_twoMin2` added to `resetState()`

## 2026-03-24 — P11: Scramble + OG image + Analytics

### gridiron-gm (722fb81)
- `track()` beacon function in App.jsx — VITE_ANALYTICS_URL, no PII
- Events: franchise_start, season_simmed, draft_started, play_exported, play_imported
- OG+Twitter meta tags in index.html
- public/images/cover.svg (1200×630 dark theme)
- scripts/gen-og.html — canvas PNG generator for both repos
- .env.example with VITE_ANALYTICS_URL

### gridiron-gm-play (57bdae1)
- _sack(): 22% scramble — QB WASD run with _startOLBlocker + _aiRushers + _aiCBsSupport
- _tackled(): fumble uses runner pos (QB or RB)
- src/utils/analytics.js: sendBeacon tracker
- BootScene: track game_boot; GameOverScene: track game_complete
- OG+Twitter meta tags; public/images/cover.svg; .env.example
