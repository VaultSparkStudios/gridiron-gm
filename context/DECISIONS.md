# Decisions

Append new entries. Do not erase historical reasoning unless it is wrong.

---

### 2026-03-04 — Single-file React architecture

- Status: Permanent constraint
- Context: Initial project setup
- Decision: All game code lives in `src/App.jsx`. No component files, no external CSS, no external runtime deps beyond React.
- Why this was chosen: Simplicity, shareability, and zero-infrastructure deployment. The game works as a single browser request.
- Follow-up: Enforce this in AGENTS.md and SOUL.md

---

### 2026-03-10 — v3.2 feature set

- Status: Complete
- Context: Session to add 5 new features
- Decision: Sim Draft + Pause/Resume, Enhanced Roster Table (PlayerTable), FA Table Overhaul, Clickable Box Scores (BoxModal), Live Sim with SVG field
- Why this was chosen: Most-requested feature improvements identified in prior session handoff
- Follow-up: Three bugs fixed in same session (live sim commit, operator precedence, simWk/simAll guard)

---

### 2026-03-10 — Live sim result commit via useEffect

- Status: Complete
- Context: Live sim was playing through but not updating sched/teams
- Decision: Added `useEffect([liveDone])` that writes scores to sched entry, updates team W/L and PF/PA, appends log entry when `liveDone` becomes true
- Why this was chosen: Reactive commit pattern matches React model; avoids mutation inside the sim tick
- Follow-up: Verified simWk/simAll skip `g.played` games to prevent double-sim

---

### 2026-03-24 — Studio OS migration

- Status: In progress
- Context: Gridiron GM repo audited against Studio OS standards; multiple compliance gaps found
- Decision: Apply full Studio OS structure — AGENTS.md, context/, logs/, docs/, prompts/, updated workflows
- Why this was chosen: Studio standard requires all projects to be self-sufficient with full memory/handoff structure
- Follow-up: PR to push to GitHub after local structure is complete

---

### 2026-03-24 — Track 2: gridiron-gm-play dual-repo architecture

- Status: Complete
- Context: User requested real-time gameplay tied to franchise state
- Decision: Separate Phaser 3 repo (`gridiron-gm-play`) connected to GM app via localStorage bridge
- Why: Keeps GM app as a pure single-file React app (no Phaser dep); Phaser app can evolve independently; localStorage is zero-infrastructure IPC between browser tabs
- Bridge: `gm_roster_export` (GM→Play) and `gm_game_result` (Play→GM); `gameId` = `"{wk}-{h}-{a}"` to match schedule
- Follow-up: Both repos must be updated in the same session if bridge contract changes

---

### 2026-03-24 — OL sub-positions: LT/LG/C/RG/RT

- Status: Complete
- Context: User requested NFL-accurate OL positions tying back to front office
- Decision: Replace generic `OL` in POS with 5 named positions; full PP/CA/PA/STRS/WKNS data per position; LT emphasizes passBlock, LG/RG runBlock, C awareness; genRoster {LT:2,LG:2,C:1,RG:2,RT:2}; Phaser gets 5 individual OL dots; beat timer scales with individual ovr
- Why: LT vs DE is one of the most important matchups in football; drafting a quality LT should feel different from drafting a RG; Phaser pocket hold time now reflects your roster choices
- Follow-up: sack chance in genLivePlay also reduced by avg OL ovr; both repos updated in same session

---

### 2026-03-24 — vite.config.js base path fix

- Status: Complete
- Context: Base was hardcoded to `/Gridiron-GM/` (wrong case)
- Decision: Changed to `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"` — lowercase slug, env-overridable
- Why this was chosen: Studio standard requires lowercase slugs; env override allows CI to inject the correct value
- Follow-up: deploy-pages.yml sets `VITE_APP_BASE_PATH=/gridiron-gm/`
