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

### 2026-03-24 — vite.config.js base path fix

- Status: Complete
- Context: Base was hardcoded to `/Gridiron-GM/` (wrong case)
- Decision: Changed to `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"` — lowercase slug, env-overridable
- Why this was chosen: Studio standard requires lowercase slugs; env override allows CI to inject the correct value
- Follow-up: deploy-pages.yml sets `VITE_APP_BASE_PATH=/gridiron-gm/`
