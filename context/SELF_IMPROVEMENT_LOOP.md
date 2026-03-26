# Self-Improvement Loop

This file is the living audit and improvement engine for the project.
Append a new entry every closeout. Never delete prior entries.

---

## Scoring rubric

Rate 0–10 per category at each closeout:

| Category | What it measures |
|---|---|
| **Dev Health** | Code quality, CI status, test coverage, technical debt level |
| **Creative Alignment** | Adherence to SOUL.md and CDR — are builds matching the vision? |
| **Momentum** | Commit frequency, feature velocity, milestone progress |
| **Engagement** | Community, player, or user feedback signals |
| **Process Quality** | Handoff freshness, Studio OS compliance, context file accuracy |

---

## Loop protocol

### At closeout (mandatory)

1. Score all 5 categories (0–10 each, 50 max)
2. Compare to prior session scores — note trajectory (↑ ↓ →) per category
3. Identify 1 top win and 1 top gap
4. Brainstorm 3–5 innovative solutions, features, or improvements
5. Commit 1–2 brainstorm items to `context/TASK_BOARD.md` — label them `[SIL]`
6. Append an entry to this file using the format below

### At start (mandatory read)

- Read this file after `context/LATEST_HANDOFF.md`
- Note open brainstorm items not yet actioned
- Check whether prior `[SIL]` TASK_BOARD commitments were completed
- If a committed item was skipped 2+ sessions in a row, escalate it to **Now** on TASK_BOARD

---

## Entries

### 2026-03-26 — Studio OS onboarding

**Scores**

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | — | — | Baseline — not yet assessed |
| Creative Alignment | — | — | Baseline — not yet assessed |
| Momentum | — | — | Baseline — not yet assessed |
| Engagement | — | — | Baseline — not yet assessed |
| Process Quality | 5 | — | Studio OS files bootstrapped |
| **Total** | **5 / 50** | | |

**Top win:** Studio OS context files bootstrapped — project now has agent continuity

**Top gap:** All context files need project-specific content filled in

**Innovative Solutions Brainstorm**

1. Fill out PROJECT_BRIEF.md with a compelling pitch — what makes this project worth playing/using?
2. Define 3 core SOUL non-negotiables that will guide every creative decision
3. Identify the single highest-leverage next feature that would most increase engagement
4. Set up CI/CD so Dev Health can be properly measured
5. Create a milestone tracker so Momentum score can be tracked over time

**Committed to TASK_BOARD this session**

- [SIL] Fill out all context files with project-specific content
- [SIL] Define first concrete milestone for Momentum tracking

---

### 2026-03-26 — v23.0 / P116 (Full audit response — GM I1-I10 + Play P1/P8 + I11-I13/I17-I19)

**Scores**

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | 7 | ↑ | 4 critical Play bugs fixed (TDZ, UI leak, ghost els, flag scatter); 2 inline comment bugs resolved; save version bumped. Known debt: 1,714-line single file, 183 looping timers not all stored. No tests. |
| Creative Alignment | 8 | ↑ | AI personality, rival drama, owner arc, HOF ballot, QB streak, disguise defense all reinforce "feel real" franchise + play vision from SOUL.md. High alignment. |
| Momentum | 9 | ↑ | 6 commits across 2 repos. v22→v23, P110→P116. 10 GM features + 4 bug fixes + 6 Play features in one session. Exceptional velocity. |
| Engagement | 5 | → | Product live on GitHub Pages. No new external signals. No analytics endpoint wired yet. Cannot measure actual user engagement. |
| Process Quality | 7 | ↑ | LATEST_HANDOFF, CURRENT_STATE, memory all updated. SIL required user prompt — process gap noted. TASK_BOARD [SIL] items committed. |
| **Total** | **36 / 50** | ↑ from 5 | First full dev session score |

**Top win:** Full audit execution — 10 GM innovations + 4 critical Play engine bugs + 6 Play innovations all shipped and committed in a single session. `_resetPlayFlags()` centralizes 20+ scattered flag resets going forward.

**Top gap:** SIL not run without user prompt — must be habitual at every closeout, not reactive. Also: QB streak (I12) has no persistent HUD indicator; user has no running visual of streak state between broadcast banners.

**Innovative Solutions Brainstorm**

1. QB streak HUD icon — 🔥/❄️ badge next to pass comp% in HudScene, live-updating → makes streak system visible mid-drive
2. Play: I14-I16/I20 — all 4 remaining agent-mapped innovations have exact line numbers ready; low-risk session to knock out
3. Performance pass — store `addEvent({loop:true})` handles in a `_loopTimers[]` array in `create()`; `_resetPlayFlags()` removes them; prevents timer accumulation across plays
4. GM Architecture — extract holdout modal, HOF ballot, and docCard into inline helper render functions (`renderHoldoutModal`, etc.) to reduce cognitive load of the 1,750-line file without violating single-file constraint
5. Analytics endpoint — wire `VITE_ANALYTICS_URL` so Engagement score can actually be measured next session

**Committed to TASK_BOARD this session**

- [SIL] Play: I14/I15/I16/I20 — remaining agent-mapped innovations (all locations known)
- [SIL] Play: QB streak HUD indicator in HudScene

---

### 2026-03-26 — v28.0 / P125 (Full audit + top 5 innovations + bug fixes)

**Scores**

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | 8 | ↑ | ErrorBoundary added — crashes now show recovery UI instead of white screen. Build clean 29 modules, 358kB. No regressions. Single-file constraint maintained. |
| Creative Alignment | 8 | → | Share card and onboarding intro reinforce franchise identity. Analytics events complete the funnel. All aligned with SOUL. |
| Momentum | 8 | ↓ | 4 GM innovations shipped (analytics, error boundary, share card, onboarding). Context files fully audited and corrected. No Play engine work this session — 2 repos needed separate sessions. |
| Engagement | 7 | ↑ | Analytics now covers full funnel: start → weekly sim → draft → live game → champion. Share card visual modal improves social share quality. Onboarding intro reduces early drop-off. |
| Process Quality | 9 | ↑ | BRAIN.md stale v3.2 ref fixed. All 4 OPEN_QUESTIONS resolved. DECISIONS.md updated with 4 new architectural decisions. LATEST_HANDOFF, CURRENT_STATE, SIL all updated. Memory index fixed. |
| **Total** | **40 / 50** | ↑ from 36 | |

**Top win:** Process quality overhaul — BRAIN.md was 24 versions stale, OPEN_QUESTIONS had 2 already-resolved items, DECISIONS.md had no entries since v3.x. All corrected this session. Also: ErrorBoundary is the most impactful single-file change for player trust.

**Top gap:** OG social image — cover.png still doesn't exist (gen-og.html requires manual browser step, never completed in 28 versions). Social shares point to a 404 image. This is the highest-priority remaining issue.

**Innovative Solutions Brainstorm**

1. **cover.png generation** — open `scripts/gen-og.html` in browser, click "Download GM cover.png", save to `public/images/` — 2-minute manual step with direct Engagement score impact (social cards render properly)
2. **Live stat write-back** — wire liveStats from live sim into player `.ss` season stats; resolves the last open question; stat tab accuracy improves
3. **Analytics dashboard stub** — even a `console.table()` dump of tracked events in DEV tab would let us see engagement data without a backend endpoint
4. **Snap-count milestone badge** — when p.snaps hits 48 (LOYAL), fire a toast notification; reinforces the loyalty mechanic discovery
5. **Season summary card** — at championship closeout, auto-show a full-season stat leader card (pass yds, rush yds, sacks) alongside the trophy; natural share moment

**Committed to TASK_BOARD this session**

- [SIL] Manual: open scripts/gen-og.html → download cover.png → save to public/images/ (highest priority — social image is 404)
- [SIL] Live stat write-back: wire liveStats into player .ss season stats at live sim commit
