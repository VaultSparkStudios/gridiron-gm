# Latest Handoff

Last updated: 2026-03-25 (session 17 — v10.0 / P73)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v10.0 / P69–P73)

### gridiron-gm — v10.0 (App.jsx) — 10 new GM features

**Salary Cap Floor** — CAP_FLOOR=150; auto-sign cheapest FA at simWk if under floor; red "⚠ Cap Floor" banner in roster tab

**Player Option Years** — `p.playerOption` bool on genPlayer; OVR≥80 25% chance; 60% opt-out at contract=1 in newSeason; purple OPT badge in salary column

**PUP/NFI Designations** — `p.irType` field set in moveToIR (wk<4: 30%PUP/20%NFI/50%IR); PUP no return until wk9; NFI season-ending (injRecWks=99); colored badge in IR list

**Coaching Tree Legacy** — `coachLegacy` state; stored on fireCoach; 20% protege +3 rating bonus on hire from coachMarket; logged

**Draft Pick Compensation** — `compPickQueue` state; gmRep≥60 + faLostCount>0 → comp pick R3–R5 in newSeason; "Add to Pool" button in draft tab; `faLostCount` incremented when AI signs user's FAs

**Franchise QB Mode** — `franchiseQB` state; "Set FQB (1SP)" in QB PlayerModal; gold FQB badge; trade/release blocked; +5 teamStr bonus; 1SP deducted per newSeason if set

**Preseason Depth Chart Battles** — "Battle (1SP)" per position in preseason roster tab; top 2 by OVR compete; 60% higher wins; winner +1 OVR; `battlesDone[]` tracks completed; reset in newSeason

**League Trade History Feed** — `tradeHistory` state; push on acceptTrade/acceptAiOffer; 10% AI-AI fake trades per simWk; collapsible TRADE HISTORY section in trade tab (last 20)

**Player Breakout Alert** — `breakoutAlerts` state; +2 OVR dev gains push to list; orange BREAKOUT banner in log tab with dismiss

**Scouting Accuracy Decay** — `scoutTimestamps` state; freshness = 100-(wk-scoutWk)*5; green FRESH / yellow AGING / red STALE bar in scouting list

---

### gridiron-gm-play — P73 (FieldScene.js + PlayCallScene.js) — 5 new Phaser features

**P69: Pass Interference Call** — 12% roll on deep incomplete; "🚩 FLAG — PASS INTERFERENCE!" overlay; +15yds auto first down; `_piChecked` flag

**P70: Hurry-Up Defense** — AI scores Q4 within 8pts: 3s PREVENT D / AGGRESSIVE D modal; `_hurryUpDef {covMod,sackMod}`; applied to next AI pass drive; auto-PREVENT on timeout

**P71: Motion Pre-Snap** — MOTION button 2s before pass snaps; WR1 tween left 30px; -8% coverage +10% comp; `_motionActive` flag; auto-dismiss

**P72: Third Down Tracker** — `_thirdDownAtt/_thirdDownConv` in create(); HUD "3RD: X/Y"; momentum +20 at ≥50% rate ≥4 att; "3RD DOWN MACHINE! ⚡" flash

**P73: Sideline Route** — "SIDELINE" added to PlayCallScene; WR tween right 60px at 500ms; 78%/15%/7% outcomes; all stop clock; "OUT OF BOUNDS — CLOCK STOPS" text

---

## What is mid-flight

Nothing. Both builds clean.

---

## What to do next

All backlogs cleared. Next session: propose next 10 GM + 5 Phaser features.

Infrastructure remaining:
- Wire analytics endpoint (VITE_ANALYTICS_URL in .env.local)
- Generate PNG OG image (scripts/gen-og.html)

---

## Constraints

- ALL changes ADDITIVE; single-file React; compact style; no external deps
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- New state vars (v10.0): `compPickQueue`, `faLostCount`, `franchiseQB`, `battlesDone`, `tradeHistory`, `breakoutAlerts`, `scoutTimestamps`, `coachLegacy`
- New player fields: `playerOption`, `irType`
- New FieldScene flags: `_piChecked`, `_hurryUpDef`, `_motionActive`, `_thirdDownAtt`, `_thirdDownConv`

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
