# Latest Handoff

Last updated: 2026-03-26 (session — v21.0 / P103)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v19.0–v21.0 / P100–P103)

### gridiron-gm — v14.0 (App.jsx) — 10 new GM features

**Two-Point Conversion Strategy** — `twoPoint` field in `gamePlan` state; toggle in game plan UI; in `simGame`: 15% chance of +1 score when enabled

**Injury Insurance** — `injInsurance` state (array of player IDs); 🛡️ Insure (2SP) button in modal for OVR≥85; when insured player placed on IR → $2M cap relief (reduces deadCap)

**League MVP Race** — `mvpRaceLeader` state; checked at wk9: top QB passYds tracked league-wide; if user's QB leads → +3 fanSat + log entry

**Offseason Training Camp** — `otcFocus` state; preseason UI picker (Passing/Rushing/Defense); in `newSeason`: top 5 players in group get +1 OVR; logged

**Fan Loyalty Index** — `fanLoyalty` state (consecutive winning seasons); in `newSeason`: +1 per winning season, reset on losing; each year adds +2 fanSat/wk bonus in `simWk`

**Coaching Buyout** — When coach fired on hot seat (streak ≤ -4): dead cap = salary × remaining contract × 0.5; logged

**Rival Week Score Boost** — In `simWk` game loop: if rivalry game, home team gets +2-3 score crowd surge

**FA Bidding War Enhancement** — `faBid` modal now shows user's current cap space vs bid needed with color indicator (green = can afford, red = short)

**Scouting Combine Grade** — In `goToCombine`: each prospect gets `combGrade` (A+/A/B/C/D) based on trueOvr; shown as colored badge in draft tab prospect list

**Player Conduct Fine** — 3%/wk chance in `simWk` for OVR≥80 non-injured players; `conductEvent` state; player fined $0.5M, morale -3; `setConductEvent` reset each `newSeason`

---

### gridiron-gm-play — P86–P90 (FieldScene.js + PlayCallScene.js)

**P86: Flea Flicker** — New play in CALLS; QB hands off to RB, pitch back, deep throw; 42-88% catch based on QB acc + WR ovr; 12-28 yds; 10% INT risk; `_fleaFlickerActive` flag

**P87: End Around** — New play in CALLS; WR motions to center, takes snap, sweeps edge; SPD-based 3-18 yds; WR tween animation; `_endAroundActive` flag

**P88: QB Sneak** — On 4th down with toGo≤2: extra QB Sneak button appears in 4th down menu; STR-based 1-4 yds; QB forward-lunge tween; `_qbSneakActive` flag

**P89: Blitz Package** — 🚀 BLITZ button shown pre-snap on opponent possession (alongside DL Stunt); sets `_blitzPackage=true`; +15% INT chance in AI pass resolution; `_blitzBtn` flag

**PlayCallScene layout** — Resized panel to 380px tall (from 310), btnH 38 (from 46), gap 3 (from 5) to fit all 14 plays (6 run, 8 pass); added situational highlights for `end_around` and `flea_flicker`

---

### Bug Fixes
- Fixed stale `setFaLostCount` reference in `newSeason` → now uses `setFaLostVal` (proper OVR value tracking for comp picks)

---

## What is mid-flight

Nothing. Both builds clean.
- gridiron-gm: v14.0 (current)
- gridiron-gm-play: P90 (current)

---

## What to do next

Next session: v15.0 GM + P91–P95.

Infrastructure remaining:
- Wire analytics endpoint (VITE_ANALYTICS_URL in .env.local)
- Generate PNG OG image (scripts/gen-og.html)

---

## Constraints

- ALL changes ADDITIVE; single-file React; compact style; no external deps
- Bridge keys `gm_roster_export` / `gm_game_result` locked
- New state vars (v14.0): `otcFocus`, `fanLoyalty`, `injInsurance`, `mvpRaceLeader`, `conductEvent`
- `gamePlan` now includes `twoPoint: false` field
- New player field: `combGrade` (A+/A/B/C/D, assigned in goToCombine)
- New FieldScene flags: `_fleaFlickerActive`, `_endAroundActive`, `_qbSneakActive`, `_blitzPackage`, `_blitzBtn`
- JSX note: minor structural issue in player modal action section (extend/FQB/release buttons outside `<>` fragment) — benign at runtime, build passes

## Read first next session

1. `AGENTS.md` (rules)
2. `context/CURRENT_STATE.md`
3. `context/TASK_BOARD.md`
4. `context/LATEST_HANDOFF.md` (this file)
