# GRIDIRON GM — Complete Handoff Document
## For Claude Code Terminal Session Continuation

---

## 1. PROJECT OVERVIEW

**Gridiron GM** is a single-file React football management simulation game. The user builds and manages a fictional NFL franchise across multiple seasons with full roster management, trading, scouting, drafts, and game simulation.

**Current working file:** `src/App.jsx` (~650 lines) — this is the live source
**Stable backup:** `gridiron-gm-v3.1-stable.jsx` (629 lines, original v3.1)
**Format:** Single React JSX file with default export, Vite project
**Framework:** React with hooks (useState, useCallback, useMemo, useEffect, useRef)
**Styling:** All inline styles, no external CSS
**External deps:** None — pure React, no imports beyond React itself
**Build:** `npm run build` → `dist/`

---

## 2. CRITICAL USER RULE

> **"All additive changes with nothing explicitly removed without asking me."**

All future changes must be ADDITIVE. Do NOT remove, replace, or simplify any existing feature.

---

## 3. VERSION HISTORY

| Version | File | Lines | Key Features Added |
|---------|------|-------|--------------------|
| v1 | gridiron-gm.jsx | ~400 | Core game: roster, schedule, sim, standings, draft, FA, playoffs, multi-season |
| v2 | gridiron-gm-v2.jsx | ~600 | NFL-calibrated stats, PFR templates, real passer rating, AV system, SVG faces, trading |
| v3 | gridiron-gm-v3.jsx | ~800 | NFL Combine drills, scouting department, hireable scouts, 3-year draft lookahead, hidden attributes, position-specific skills |
| v3.1 | gridiron-gm-v3.1-stable.jsx | 629 | Full NFL Draft (7 rounds, 224 picks), sequential phase locking, tradeable draft picks (Jimmy Johnson chart), AI auto-pick, 2-min timer, combine + pro day, college stats, clickable names everywhere, younger age distribution |
| v3.2 | src/App.jsx | ~650 | All features below added |

---

## 4. WHAT WAS IMPLEMENTED IN v3.2 (current src/App.jsx)

All 5 planned features from the prior HANDOFF were already coded when this session began. Three bugs were found and fixed:

### Features present:
- **Sim Draft** (`⏭ Sim Draft` button) + **Pause/Resume** (`⏸/▶`) — `simEntireDraft()`, `draftPaused` state
- **Enhanced Roster Table** — `PlayerTable` component with ACC/JMP/END columns, position filter bar (`rPosF` state)
- **FA Table Overhaul** — same `PlayerTable` component, `faSc`/`faSd`/`faPosF` separate state, `showSign` prop with Sign button
- **Clickable Box Scores** — `BoxModal` component, `boxH`/`boxA` stored on sched entries, `simGame()` returns both, `📊 Box` button on played games
- **Live Sim with SVG Field** — `genLivePlay()`, `FieldViz` SVG component, `advanceLivePlay()` state machine, `⚡ Live Sim` button on unplayed user games, Player of the Game (`livePOG`), team recap, play-by-play log, pause/resume

### Bugs fixed this session (2026-03-10):
1. **Live sim didn't commit results** — added `useEffect([liveDone])` that writes scores to `sched`, updates team W/L and PF/PA, appends log entry
2. **Operator precedence bug** in `advanceLivePlay` TD stat tracking — `||(play.type==="td"&&!play.passer)` parentheses added
3. **simWk/simAll re-simulated live-played games** — added `&&!g.played` guard to both filters

---

## 5. ARCHITECTURE — CODE MAP (v3.2, src/App.jsx)

### Lines 1-10: Utilities
```
R(a,b)       — Random int [a,b]
Rf(a,b)      — Random float [a,b)
pick(arr)    — Random array element
cl(v,lo,hi)  — Clamp
uid()        — Random 7-char ID
G(m,s)       — Gaussian random (Box-Muller)
Gc(m,s,lo,hi) — Clamped gaussian int
htS(inches)  — Height string "6'2""
fm(v)        — Format number
```

### Lines 11-63: Static Data
```
FN[]         — 120 first names
LN[]         — 120 last names
COL[]        — 53 colleges
POS[]        — 10 positions: QB,RB,WR,TE,OL,DL,LB,CB,S,K
PP{}         — Physical profiles per position (height/weight gaussian params)
CA{}         — Combine averages per position
TEAMS[]      — 32 fictional teams with city, name, abbreviation, conference, division, colors
PA{}         — 8 position-specific attributes per position
STRS{}       — Strengths text per position
WKNS{}       — Weaknesses text per position
FACTS[]      — 21 random player facts
PICK_VAL[]   — 224-value Jimmy Johnson draft pick value chart
```

### Lines 64-66: SVG Face Generator
```
genFace()    — Returns face descriptor object
Face({s,sz}) — SVG component rendering a face
```

### Lines 68-211: Core Simulation Functions
```
qbRate()           — Real NFL passer rating formula
calcAV()           — Approximate Value calculation
genCombine()       — Generate combine drill results
genProDay()        — Generate pro day results
combToPhys()       — Convert combine to physical attrs (spd,str,agi,jmp,acc,end)
genPAttrs()        — Generate position-specific skill attributes
emptySS()          — Empty season stats object for position
genColStats()      — Generate college career stats
prospectAge()      — Weighted random 20-24
genPlayer()        — Full player generator
genFA()            — Generate 30 free agents
genDC()            — Generate draft class (240 prospects)
initPicks()        — Generate 7×32=224 draft pick objects
getTeamNeed()      — Calculate positional needs
aiBestPick()       — AI draft pick logic
genRoster()        — Generate full 42-man roster
initTeams()        — Initialize 32 teams
genSched()         — Generate 17-week schedule (stores boxH:null, boxA:null)
simPG()            — Simulate one player's per-game stats
addS()             — Accumulate stats
teamStr()          — Calculate team overall strength
simGame()          — Simulate full game; returns {hsc, asc, boxH, boxA}; mutates player .ss/.gl
genLivePlay()      — Live sim play generator (lines 174-211)
```

### Lines 213-237: Colors, Labels, UI Primitives
```
C{}          — Color palette
oC(ovr)      — OVR to color
pC(pos)      — Position to color
sL(key)      — Stat key to label
Bdg({pos})   — Position badge component
Btn({...})   — Button component
PN({p,setSel}) — Clickable player name
FieldViz     — SVG football field component (lines 223-237)
```

### Lines 239-269: PlayerTable Component
```
PlayerTable({players, setSel, sortCol, sortDir, onSort, posFilter, setPosFilter, showSign, onSign})
— Shared table for Roster AND Free Agency
— Columns: Face, Name, Pos, Age, OVR, POT, SPD, STR, AGI, ACC, JMP, END, AV, $M, Yr (or Sign)
— Position filter bar (ALL + 10 positions)
— Sortable by any column
```

### Lines 271-416: Main App State + Logic
```
State variables (key additions in v3.2):
  draftPaused    — pause/resume draft
  rPosF/faPosF   — roster/FA position filters
  faSc/faSd      — FA sort column/direction
  liveSim        — active live sim game object
  liveScore/liveQtr/liveYard/livePoss/liveDown/liveToGo/livePlay
  liveDone/livePaused/livePOG/liveStats/lastLivePlay
  boxView        — game object for box score modal

useEffects:
  [draftActive, sp, draftPaused]    — draft timer interval
  [draftIdx, draftActive, ...]      — AI auto-pick / user BPA fallback
  [liveSim, liveDone, livePaused, livePlay] — live sim ticker (1100ms interval)
  [liveLog]                         — auto-scroll play-by-play
  [liveDone]                        — COMMIT live sim result to sched/teams/log

Key functions:
  advanceLivePlay()   — runs one play, updates all live sim state
  qb_id()             — get starting QB id from team roster
  startLiveSim()      — initialize and start live sim
  aiPick()/makePick() — draft pick execution
  simEntireDraft()    — instant-sim remaining picks
  startGame()         — new game init
  simWk()             — sim one week (skips !g.played games)
  simAll()            — sim all remaining weeks (skips !g.played games)
  simPR()             — sim one playoff round
  goToCombine()       — generate combine/pro day for all prospects
  startDraft()        — initialize draft with correct order
  newSeason()         — full year transition
  signP()/releaseP()  — free agent signing/release
  scoutPlayer()       — spend scout points
  evalTr()/execTr()   — trade evaluation/execution
```

### Lines 393-415: Modals
```
PM({p, onClose})         — Player modal (full profile: attrs, combine, pro day, college, scouting, season stats)
BoxModal({g, onClose})   — Box score modal (per-player stats for both teams)
```

### Lines 417-648: Render / UI
```
Splash screen
Team selection (32 team grid)
Main game UI:
  - Top bar: team info, phase indicator, action buttons
    (includes ⏸ Pause / ▶ Resume and ⏭ Sim Draft when in draft)
  - Tab bar: roster, standings, schedule, stats, scouting, trade, draft, FA, playoffs, log
    (⚡LIVE tab auto-appended when liveSim is active)
  Tabs:
    roster      — PlayerTable with ACC/JMP/END, position filter
    standings   — W-L-PF-PA table
    schedule    — 17 weeks; played games show score + 📊 Box button;
                  unplayed user games show ⚡ Live Sim button
    stats       — leaderboards (passing/rushing/receiving/defense/kicking)
    scouting    — scout management + 3-year draft class view
    trade       — player + pick trade interface with fairness eval
    draft       — live draft (timer, prospect board, log) or pre-draft viewer
    freeagency  — PlayerTable with Sign button
    playoffs    — bracket display
    log         — game event log
    livesim     — score, Q/time, field viz, POG, team recap, live box, play-by-play
```

---

## 6. SEASON PHASE FLOW

```
PRESEASON → "Start Season"
  ↓
REGULAR (17 weeks) → "Sim Week" / "Sim All" / "⚡ Live Sim" (user games only)
  ↓ (week 17 complete)
PLAYOFFS → "Sim Round" (QF → SF → Finals)
  ↓ (champion crowned)
COMBINE → "→ Combine"
  ↓
DRAFT → "→ Draft" (7 rounds, 224 picks, 2-min timer; ⏸ Pause / ⏭ Sim Draft available)
  ↓ (all picks done)
FREE AGENCY → "→ Next Season"
  ↓
PRESEASON (new year, aged players, new draft class, new schedule)
```

---

## 7. PLAYER DATA OBJECT SHAPE

```javascript
{
  id, name, pos, age, ovr, pot, ht_, wt,
  spd, str, agi, acc, jmp, end,       // physical attrs (all present)
  posAttrs: {armStr, accuracy, ...},   // 8 position-specific skills
  salary, contract, injured, injWk, injType,
  bio: {strengths, weaknesses, fact, college},
  combine: {fortyYd, bench, vert, broad, threeCone, shuttle} | null,
  proDay: {...} | null,
  face: {sk, hr, hs, ew, eh, nw, mw, jw, bh, er, fh},
  draftYr, draftPk, ss: {...season stats}, cs: {...career stats}, gl: [...],
  av, tradeVal, scoutLvl (0|1|2), trueOvr, truePot, scoutedOvr, scoutedPot,
  colStats: {...}, colYrs, draftYear
}
```

---

## 8. KNOWN ISSUES / QUIRKS

1. **Btn `c` prop**: destructures `c:co` for text color — pass `c={color}` not `co={color}`
2. **simGame mutates rosters**: adds to `.ss`, pushes to `.gl` directly
3. **Live sim player stats**: `liveStats` tracks `{passYds, rushYds, recYds, td, comp, att, rec, tkl, sack, int, rushAtt}` — these are NOT written back to player `.ss` season stats (only the live box score and POG use them)
4. **Live sim game object**: `liveSim` is the raw sched entry `{wk, h, a, played, hs, as, boxH, boxA}` — the commit useEffect finds it by `wk+h+a` to mark played
5. **No position filter on scouting/draft prospect boards** (only roster and FA have filters)

---

## 9. PAUSED WORK — STUDIO DEPLOYMENT STANDARDS COMPLIANCE

**This task was interrupted and needs to be completed in the next session.**

### What was discovered:
The `gridiron-gm` repo was audited against `VaultSparkStudios.github.io/STUDIO_DEPLOYMENT_STANDARD.md` and `VaultSparkStudios.github.io/AGENTS.md`. Multiple compliance gaps were identified.

### Repo identity (confirmed correct values):
| Field | Value |
|---|---|
| GitHub repo | `VaultSparkStudios/Gridiron-GM` |
| Canonical slug | `gridiron-gm` |
| Public URL | `https://vaultsparkstudios.com/gridiron-gm/` |
| Gameplay origin | `https://play-gridiron-gm.vaultsparkstudios.com` |
| API origin | `https://api-gridiron-gm.vaultsparkstudios.com` |

### Gaps found (must fix before PR):

#### 1. `vite.config.js` — wrong base path casing
```js
// CURRENT (wrong):
base: "/Gridiron-GM/",
// REQUIRED (slug must be lowercase):
base: process.env.VITE_APP_BASE_PATH || "/gridiron-gm/",
```

#### 2. Missing `AGENTS.md`
The repo has NO `AGENTS.md`. Needs to be created with `gridiron-gm` slug values (not the old `vaultspark-football-gm` slug from the `VaultSpark Football GM` folder — that is a different/older local copy).

#### 3. Missing `context/` directory (Studio System Template requirement)
Required files:
- `context/PROJECT_BRIEF.md`
- `context/CURRENT_STATE.md`
- `context/DECISIONS.md`
- `context/TASK_BOARD.md`

#### 4. Missing `handoffs/LATEST_HANDOFF.md`

#### 5. Missing `docs/` directory with local copies:
- `docs/STUDIO_DEPLOYMENT_STANDARD.md` — copy from studio root, update gridiron-gm slug values
- `docs/STUDIO_BACKEND_PLAN.md` — copy from `VaultSpark Football GM/docs/`
- `docs/DEPLOY_PAGES.md` — copy from `VaultSpark Football GM/docs/`
- `docs/templates/deploy-pages.template.yml`
- `docs/templates/deploy-backend.docker-compose.template.yml`
- `docs/templates/Caddyfile.studio-backend.template`
- `docs/templates/GAME_LAUNCH_CHECKLIST.template.md`

#### 6. Missing `CODEX_HANDOFF_2026-03-10.md` (deployment-focused, separate from this game-dev HANDOFF.md)

#### 7. `.github/workflows/deploy.yml` — needs audit
Current workflow deploys direct GitHub Pages from the game repo itself. The standard requires syncing the bundle into `VaultSparkStudios.github.io/gridiron-gm/` via `STUDIO_SITE_TOKEN`. The workflow also needs `ci.yml` separation (typecheck/lint/build) from deploy.

#### 8. Missing SPA fallback (`404.html`)
Standard requires copying `dist/index.html` → `dist/404.html` post-build.

#### 9. Missing `scripts/postbuild-pages.mjs`
The postbuild script that does the `404.html` copy.

### Source of truth for template files:
All template source files exist at:
`C:\Users\p4cka\documents\development\VaultSpark Football GM\docs\` and `\docs\templates\`

Read those to copy into this repo — do NOT reference the `vaultspark-football-gm` slug values, use `gridiron-gm` everywhere.

### What to do next (in order):
1. Fix `vite.config.js` base path
2. Create `scripts/postbuild-pages.mjs`
3. Create `AGENTS.md`
4. Create `context/PROJECT_BRIEF.md`, `context/CURRENT_STATE.md`, `context/DECISIONS.md`, `context/TASK_BOARD.md`
5. Create `handoffs/LATEST_HANDOFF.md`
6. Create `docs/STUDIO_DEPLOYMENT_STANDARD.md` (gridiron-gm values)
7. Copy `docs/STUDIO_BACKEND_PLAN.md`, `docs/DEPLOY_PAGES.md`
8. Copy all `docs/templates/` files
9. Create `CODEX_HANDOFF_2026-03-10.md`
10. Audit/update `.github/workflows/` (ci.yml + deploy-pages.yml)
11. Verify build still passes
12. Create PR

---

## 10. STYLE GUIDE

- **Color palette**: Dark theme, `C{}` constant — bg:#080c14, cd:#111827, bd:#1e293b, tx:#e0e6f0, mt:#64748b, gn:#22c55e, bl:#3b82f6, gd:#eab308, rd:#ef4444
- **OVR coloring**: `oC()` — 80+:green, 68+:lime, 55+:yellow, 42+:orange, below:red
- **Position colors**: `pC()` — QB:red, RB:blue, WR:orange, TE:purple, OL:teal, DL:amber, LB:green, CB:pink, S:cyan, K:brown
- **Font**: 'Segoe UI', system-ui, sans-serif
- **Font sizes**: 8-11px for data, 12-15px for headers, 20+ for player names in modals
- **All player names are clickable** (PN component) opening the player modal

---

## 11. TESTING CHECKLIST

After any code change, verify:
- [ ] `npm run build` passes with zero errors
- [ ] Game starts and reaches team selection
- [ ] Season simulation works (Sim Week, Sim All)
- [ ] Playoffs sim to championship
- [ ] Combine generates drill results
- [ ] Draft runs with timer, AI picks, user can pick
- [ ] Sim Draft instantly completes draft
- [ ] Pause/Resume stops and restarts draft
- [ ] Roster table shows ACC, JMP, END columns + position filter
- [ ] FA table matches roster format, is sortable, Sign button works
- [ ] Clicking played game shows box score modal
- [ ] Live Sim button appears on unplayed user games
- [ ] Live sim plays through with visual field, POG, play-by-play
- [ ] Live sim result updates sched + team W/L when game ends
- [ ] Trade system still works (players + picks)
- [ ] Scouting still works
- [ ] Season transition (new year) works properly
- [ ] Player modal still shows all info

---

## 12. FILE LOCATIONS (LOCAL)

```
C:\Users\p4cka\documents\development\gridiron-gm\          ← THIS REPO (working directory)
  src/App.jsx                                               ← Live source (v3.2)
  gridiron-gm-v3.1-stable.jsx                              ← v3.1 backup
  HANDOFF.md                                               ← This file

C:\Users\p4cka\documents\development\VaultSpark Football GM\  ← OLD local copy, different slug
  docs/                                                     ← Source for template files to copy
  docs/templates/                                           ← Template files to copy into gridiron-gm/docs/
```
