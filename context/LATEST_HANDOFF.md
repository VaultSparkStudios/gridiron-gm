# Latest Handoff

Last updated: 2026-03-25 (session — v13.1 / P85)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v13.1 / P85)

### gridiron-gm — v13.1 (App.jsx) — Compensatory Pick overhaul

**NFL-Style Compensatory Picks** — Replaced flavor-text `COND_POOL` / `condition` field on picks with a proper NFL compensatory pick formula:
- `faLostVal` state: accumulates `OVR × contract` for OVR≥70 players released to FA (non-regular-season)
- `faGainedVal` state: accumulates `OVR × contract` for OVR≥70 players signed from FA
- In `newSeason`: net = faLostVal − faGainedVal; awards R3 (net≥150), R4 (net≥100), R5 (net≥60), R6 (net≥30), R7 (net≥10)
- `COND_POOL` constant and `condition` pick field removed from `initPicks`
- `saveGame` / `loadGame` updated to persist `faLostVal` + `faGainedVal`

### gridiron-gm — v13.0 (App.jsx) — 10 new GM features (prior session)

**International Series Game** — `intlGameWk` state; one home game wk 7-10 marked `intl:true` in startGame + newSeason; ✈️ INTL badge in schedule; win grants +8 fanSat

**Player Endorsement Deals** — `endorsed` field (OVR≥82, 30% chance); 💰 badge in PlayerTable; every 4 wks simWk: +1SP per 2 active endorsed players

**Franchise Milestones** — `milestones` state; checks in newSeason: first_season/50wins/100wins/first_title/dynasty; SP rewards 2-8 each; 🏅 section in log tab

**Scheme Clash Modifier** — `SCHEME_CLASH` constant; applied in simGame to adjust scores ±1-2 based on OC vs opponent DC scheme (Air Raid vs Cover 2, Power Run vs 4-3, etc.)

**Restricted Free Agency (RFA)** — `rfaTenders` state; RFA Tender button in modal for preseason OVR 65-77 contract=1 players; flat salary ~$1.5M; RFA badge; resets each newSeason

**Player Role Assignment** — `role:'rotation'` default in genPlayer; Core/Rotation/Depth toggle in modal; CORE badge in PlayerTable; core players add +0.5 to teamStr

**League-Wide Cap Forecast** — `capOutlookOpen` state; collapsible 💰 LEAGUE CAP OUTLOOK in standings tab; shows next-yr cap space for all 32 teams color-coded

**Draft War Room** — Panel in draft tab showing top 6 positional needs with best available prospect at each position

**Player Career Milestones** — In newSeason: checks 20K pass yds (QB), 5K scrimmage (RB/WR/TE), 30 career TDs; each milestone earns +1SP; `p.milestoneFlags[]` tracks earned

---

### gridiron-gm-play — P81–P85 (FieldScene.js + PlayCallScene.js)

**P81: TE Seam Route** — New play in PlayCallScene; TE animates 180px upfield; 50-70% catch based on OVR vs LB/S; 8-18 yd gain; `_teSeamActive` flag

**P82: DL Stunts** — `_showDLStuntBtn()` on opponent possession pre-snap; sets `_dlStunt=true`; +8% INT on opponent passes; resets each play

**P83: WR Crack Block** — `_tryCrackBlock()` on non-scramble runs (20% chance); WR tween blocks CB; +2-4 yd bonus; `_crackBlock` flag

**P84: Pump Fake** — `_showPumpFakeBtn()` 800ms on pass plays; QB fake throw animation; CB pauses 200ms; +10% comp chance via `_pumpFakeBonus`

**P85: Wildcat Package** — New play in PlayCallScene; KEEP (RB runs, STR bonus, 1-7 yds) or PASS (40% comp, 8-20 yds); 4s auto-timeout; `_wildcatActive` flag

---

## What is mid-flight

Nothing. Both builds clean.
- gridiron-gm: v13.1 (current)
- gridiron-gm-play: `91baff5`

---

## What to do next

All backlogs cleared. Next session: v14.0 GM + P86–P90.

Infrastructure remaining:
- Wire analytics endpoint (VITE_ANALYTICS_URL in .env.local)
- Generate PNG OG image (scripts/gen-og.html)

---

## Constraints

- ALL changes ADDITIVE; single-file React; compact style; no external deps
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- New state vars (v13.0): `milestones`, `rfaTenders`, `intlGameWk`, `capOutlookOpen`
- New state vars (v13.1): `faLostVal`, `faGainedVal` (replace `faLostCount`)
- New player fields: `endorsed`, `role`, `milestoneFlags[]`
- Pick field `condition` REMOVED (was flavor-text only; replaced by proper comp pick formula)
- New FieldScene flags: `_teSeamActive`, `_dlStunt`, `_crackBlock`, `_pumpFakeBonus`, `_wildcatActive`
- JSX note: minor structural issue in player modal action section (extend/FQB/release buttons outside `<>` fragment) — benign at runtime, build passes

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
