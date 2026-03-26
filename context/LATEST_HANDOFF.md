# Latest Handoff

Last updated: 2026-03-26 (session — v27.0 / P125)

This is the authoritative active handoff for Gridiron GM.

## What was completed this session (v27.0 / P125)

### Backfill — lost audit items (I27/I33-I35/I37-I38/I42-I43/I45/I50)

**Play Engine (gridiron-gm-play)** — commit `711ffdc` on `master`:
- **I27**: Turnover celebration flash — gold "TURNOVER!" 800ms pulse on INT/fumble
- **I33**: Pocket collapse tween — each OL dot tweens 25% toward QB when beaten (220ms)
- **I34**: Blitz telegraph — first 2 pocket dots nudge 15px forward pre-snap on blitz call
- **I35**: First-down conversion flash — bright green LOS line overlay 400ms on conversion
- **I37**: AI red zone tendency — yardLine≥90: passCh -= 0.25 (forces ~65%+ run rate)
- **I38**: Field position penalty — drives starting at yardLine≤10 get -4% compCh

**GM App (gridiron-gm)** — commit `e2e96e9` on `main`:
- **I42**: Trade value tag in player modal (TV = OVR×1.5 + (30-age)×2 + contract×5 - salary/3)
- **I43**: Conference power index — AFC/NFC top 3 W-L cards in standings tab
- **I45**: Bye week strategy panel — REST (fragile clears, injury risk -) or FOCUS (+1 OVR top player)
- **I50**: Pre-draft rumor mill — 3 AI team position buzz cards generated at combine

### New v27.0 innovations

**GM App**:
- **MLE signing**: Mid-Level Exception — once/season, FA OVR 72-79 max $6M/yr, LOYAL discount
- **Player loyalty**: `p.snaps` tracked weekly; `p.loyal=true` at 48 snaps; LOYAL badge in table + modal; TV shows "LOYAL discount eligible"
- **Snap count tracker**: `p.snaps` in player modal (⚡ X snaps)
- **PS promotion race**: wk10 — top-2 PS players race; winner promoted free
- **Post-game locker room speech modal**: 50% chance after user game; 3 choices (Inspire/Challenge/Calm) with morale/chem/fanSat effects

**Play Engine**:
- **P120**: Extended jump route — LATE JUMP 2nd window 300ms after first closes; +_coverageAssignMod -7 (vs +22 for first jump)
- **P121**: Pocket shuffle step — ↔ SHUFFLE button during pass_wait; QB sidesteps ±8px; +8% comp once
- **P122**: Personal foul — 8% chance on AI run >8yds; +15yds, auto 1st down; flag visual
- **P123**: WR double move SHAKE! — button during pass_wait; +15% comp on next throw
- **P124**: Fresh DL sub — once/half pre-snap button in def call panel; +12% AI run speed (= sack bonus)
- **P125**: OT defeat card — overlay on overtime loss in GameOverScene; clears at 2.2s

### Supporting work
- `state._isOT = true` set on OT start for GameOverScene access
- CURRENT_STATE.md updated to v27.0 / P125

### Both repositories pushed
- `gridiron-gm`: `e2e96e9` → `origin/main` ✅
- `gridiron-gm-play`: `711ffdc` → `origin/master` ✅

---

## What is mid-flight

Nothing. Both builds clean.
- gridiron-gm: v27.0 — commit `e2e96e9`
- gridiron-gm-play: v27.0 — commit `711ffdc`

---

## What to do next

- **OG Image** — manual: open `scripts/gen-og.html` in browser → download → save as `public/images/cover.png`
- **Analytics endpoint** — set `VITE_ANALYTICS_URL=<your endpoint>` in `.env.local` then `npm run build`
- **Architecture pass** — GM: consider extracting modal helpers or custom hooks; Play: `_resetPlayFlags()` for cleaner per-play cleanup
- **Remaining backlog** — I27/I33-I35/I37-I38/I42-I43/I45/I50 now completed ✅

---

## Session score

**Productivity: 9/10** — Full v27.0 innovation batch (10 GM + 6 Play backfill + P120-P125 new features) implemented across both repos. Context compaction mid-session; recovered cleanly from handoff. Both builds verified, committed, and pushed. No blockers remaining.
