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

### 2026-03-24 — Depth chart, save/load, 4th-down UI (v3.7)

- Status: Complete
- Context: Backlog clearance session — all remaining GM gameplay backlog items
- Decision: Depth chart as a toggle on the Roster tab (not a separate page); save/load as JSON Blob; 4th-down as a pre-play decision panel blocking the call grid
- Why: Single-file constraint means no routing; JSON download is zero-infrastructure; blocking panel matches the real decision moment before a play clock
- Follow-up: `saveGame` JSON includes full `teams`, `sched`, `picks`, `season`, `user`, `week`, `phase` — all state needed to restore a session

---

### 2026-03-24 — vite.config.js base path fix

- Status: Complete
- Context: Base was hardcoded to `/Gridiron-GM/` (wrong case)
- Decision: Changed to `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"` — lowercase slug, env-overridable
- Why this was chosen: Studio standard requires lowercase slugs; env override allows CI to inject the correct value
- Follow-up: deploy-pages.yml sets `VITE_APP_BASE_PATH=/gridiron-gm/`

---

### 2026-03-26 — No backend planned (permanent client-side architecture)

- Status: Decided
- Context: OPEN_QUESTIONS listed backend rollout as open since v3.x
- Decision: Gridiron GM remains 100% client-side + localStorage. No backend unless DAU > 1000 or leaderboard feature is explicitly prioritized.
- Why: Zero-infrastructure is a core studio value for this project; client-side ensures the game works with no server costs and no outage risk

---

### 2026-03-26 — HANDOFF.md dual-file kept (not merged)

- Status: Decided
- Context: Two handoff files existed — root HANDOFF.md (architecture ref) and context/LATEST_HANDOFF.md (session handoff)
- Decision: Keep both. HANDOFF.md = permanent game architecture reference. context/LATEST_HANDOFF.md = rolling session state.
- Why: They serve different readers at different timescales; merging would lose the clean separation

---

### 2026-03-26 — ErrorBoundary added to main.jsx (v28.0)

- Status: Complete
- Context: A JSX crash anywhere in the 1878-line App.jsx would destroy the session with no recovery UI
- Decision: Added React class ErrorBoundary wrapping GridironGM in main.jsx; shows "Your save is safe in localStorage. Reload to recover." with reload button
- Why: localStorage persistence means saves survive crashes; the boundary converts a white screen into a recoverable state

---

### 2026-03-26 — Analytics events: live_game_start / live_game_finish / champion (v28.0)

- Status: Complete
- Context: `track()` helper existed but only 4 funnel events were wired; live game and champion events were missing
- Decision: Added track('live_game_start') in startLiveSim(), track('live_game_finish') on live sim completion, track('champion') on playoff win
- Why: Full funnel coverage — start → weekly sim → draft → live game → victory — gives meaningful engagement data without personal information

---

### 2026-03-26 — Share Card modal + Onboarding intro modal (v28.0)

- Status: Complete
- Context: Share was a plain-text copy button; no first-launch wizard existed
- Decision: Share Card = team-branded visual modal (W-L, champion badge, top performer, copyable string). Onboarding = 3-tip first-launch modal stored in localStorage gm_intro_shown.
- Why: Visual share cards drive more social sharing than text-only; first-launch tip modals reduce early drop-off by surfacing Draft picks / Sim Week / SP mechanics immediately
