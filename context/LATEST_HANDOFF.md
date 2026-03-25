# Latest Handoff

Last updated: 2026-03-25 (session 18 — v11.0 / P78)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v11.0 / P74–P78)

### gridiron-gm — v11.0 (App.jsx) — 10 new GM features

**IR Auto-Return** — `irReturnWk` countdown shown in IR section; simWk auto-moves player to roster at return week; logged

**Player Personality Types** — `p.personality` (Leader/Loner/Hothead/Grinder); colored pill in PlayerModal; single-letter badge in PlayerTable; Loner skips LKR conf effects; Grinder +10% dev chance; Hothead 10% extra morale hit/wk

**Rival Game Boost** — `⚔️ RIVALRY WEEK` banner in schedule tab when next game is vs rivalry team; +4 teamStr applied in simWk for that game

**Scout Network Tiers** — `scoutTier` state (1–3); Tier 2 (3SP) unlocks combine on scoutLvl≥1; Tier 3 (6SP) reveals trueOvr on scoutLvl≥1; upgrade buttons in scouting tab

**Salary Cap Rollover** — `capRollover` state; at newSeason: min(10, unused/2) carries over; "+ $XM rollover" shown green in cap header

**Veteran Minimum Contracts** — VET MIN button for OVR≤65 in FA tab + waiver wire; $0.5M/1yr; VET MIN badge

**Coaching Hot Seat** — `hotSeat` state; streak≤-3 → all coordinators on hot seat (🔥 badge); streak≤-4 → auto-fire worst rated; clears on win

**Player Suspension Event** — `suspensionEvent` state; 2%/wk random player suspended; modal: Handle Internally (1SP, 1wk, gmRep-1) or Release (gmRep-2); `p.suspended` flag excludes from teamStr

**Draft Board Rankings** — `draftBoard` state (ordered pid array); MY BOARD section in draft tab; Add/↑/↓/Remove; gold rank badges; visible during combine/draft phases

**Preseason Injury Risk Toggle** — `preseasonRisk` state (default true); ON/OFF toggle in preseason block; 8% injury chance per top-22 starter when ON; logs injuries

---

### gridiron-gm-play — P78 (FieldScene.js) — 5 new Phaser features

**P74: DB Bump Coverage** — BUMP! button 1.2s window on AI pass plays; CB tween forward; comp% -15%, INT +6%; `_bumpActive` flag

**P75: Scramble Slide** — SLIDE button during QB scramble inside own 20 (yardLine≤20); 2s window; 2-5yd gain, no fumble/injury; `_slid` flag

**P76: Red Zone Run Choice** — DIVE/SWEEP 2s choice on user runs at yardLine≥80; DIVE=0-3yd/88%/no fumble; SWEEP=4-12yd/55%/normal fumble; `_rzRunChoice`

**P77: Penalty Accept/Decline** — modal after any flag; ACCEPT (apply yards) / DECLINE (revert); 3s auto-ACCEPT; wraps existing penalty logic

**P78: Two-Minute Warning Timeout** — fires at clock≤120s in Q2/Q4; "⏱ TWO-MINUTE WARNING" overlay; FREE TIMEOUT button +15s; `_twoMinWarningFired{}` per quarter

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
- Import line: `import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";`
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- New state vars (v11.0): `scoutTier`, `capRollover`, `hotSeat`, `suspensionEvent`, `draftBoard`, `preseasonRisk`
- New player fields: `personality`, `suspended`
- New FieldScene flags: `_bumpActive`, `_slid`, `_rzRunChoice`, `_twoMinWarningFired`

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
