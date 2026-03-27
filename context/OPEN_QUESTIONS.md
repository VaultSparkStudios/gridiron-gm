# Open Questions

---

### Should live sim stats write back to player .ss season stats?

- Why it matters: Currently `liveStats` tracks per-game stats in the live sim but they are NOT written to player `.ss` season stats. Only the live box score and POG use them. This means live-simmed games show different totals in the stats tab vs. sim-simmed games.
- Decision owner: User
- What would answer it: A decision on whether to implement the write-back and whether it should replace or add to the existing simGame stat path
- Latest status: **RESOLVED (v29.0)** — live stat write-back implemented in `useEffect([liveDone])` via `addS(p.ss, liveStats[userSide][pid])`. Season stats now include live game contributions. Question closed.

---

### Should the draft prospect board get a position filter?

- Why it matters: Roster and FA tables both have position filters but the scouting/draft board does not. Consistency suggests it should.
- Decision owner: User
- What would answer it: User confirming it's a wanted feature; then implement same `posFilter` pattern as PlayerTable
- Latest status: **RESOLVED** — `drPosF` state + filter buttons are already implemented at App.jsx lines ~1444 and ~1457. This feature exists. Question can be closed.

---

### What is the backend rollout plan for gridiron-gm?

- Why it matters: Gridiron GM is currently 100% client-side (no backend). Future features like persistent cloud saves or leaderboards would require a backend. The studio standard defines `play-gridiron-gm.vaultsparkstudios.com` as the future gameplay origin.
- Decision owner: User
- What would answer it: A decision on whether to ever add a backend, and if so, what the triggering milestone is
- Latest status: **DECIDED** — No backend planned. Client-side + localStorage is the permanent architecture. v32 implemented local leaderboard via localStorage. Multiplayer stub UI added; Supabase backend deferred until DAU > 1000 or explicit user request.

---

### Should HANDOFF.md be replaced by context/LATEST_HANDOFF.md?

- Why it matters: `HANDOFF.md` at repo root is the legacy game-dev handoff. `context/LATEST_HANDOFF.md` is the new Studio OS handoff. They serve related but different purposes.
- Decision owner: User
- What would answer it: Decision on whether to migrate HANDOFF.md content into context/ or keep both
- Latest status: **DECIDED** — Keep both. `HANDOFF.md` = game architecture reference (permanent). `context/LATEST_HANDOFF.md` = active session handoff (updated each session). No migration needed.

---

### v34.0 pending manual actions (cannot be automated)

| # | Action | Status |
|---|--------|--------|
| 1 | Add `VITE_POSTHOG_KEY` to `.env.local` | PostHog project API key needed |
| 2 | Fill `VITE_ANALYTICS_URL` | Placeholder in .env.local — needs endpoint |
| 3 | Deploy Claude proxy Worker | `VITE_CLAUDE_PROXY_URL` — see `docs/CLAUDE_AI_STORYLINE_SETUP.md` |
| 4 | Stripe Pro GM integration | See `docs/PRO_GM_SETUP.md` — stub UI exists |
| 5 | Supabase multiplayer backend | See `docs/MULTIPLAYER_SETUP.md` — stub UI exists |
| 6 | Phaser full 60-min game | `docs/PHASER_60MIN_GAME_SETUP.md` — gridiron-gm-play major work |

---
