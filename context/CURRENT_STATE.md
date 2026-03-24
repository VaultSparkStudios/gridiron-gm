# Current State

## Snapshot

- Date: 2026-03-24
- Overall status: Live on GitHub Pages, active development
- Current phase: Gameplay feature expansion (differentiation from VaultSpark Football GM)
- Current version: v3.3 (in PR #4, pending merge)

## What exists

- systems:
  - Full franchise simulation (roster, schedule, standings, playoffs, multi-season)
  - NFL Draft — 7 rounds, 224 picks, Jimmy Johnson pick values, 2-min timer, AI auto-pick, Sim Draft, Pause/Resume
  - Free agency — sign/release, salary/contract, sortable/filterable table
  - Scouting — hireable scouts, 3-year draft lookahead, hidden attributes
  - Trading — players + picks, fairness evaluation via Jimmy Johnson chart
  - Live Sim — play-by-play with SVG field, Player of the Game, team recap, box scores
  - Interactive Play-Calling (v3.3) — 🎮 toggle, 8-call menu per user drive (Inside Run, Outside Run, Screen, Scramble, Quick Pass, Medium, Deep Shot, RPO), per-call risk/reward modifiers
  - Game simulation — per-player stats, passer rating, AV, season/career tracking
  - Player modal — full profile: combine, pro day, college stats, scouting, season stats

- assets:
  - `src/App.jsx` — live source, v3.3, ~720 lines
  - `gridiron-gm-v3.1-stable.jsx` — stable backup
  - `HANDOFF.md` — full game architecture doc

- important paths:
  - `src/App.jsx` — all game code
  - `.github/workflows/ci.yml` + `deploy-pages.yml` — CI/deploy
  - `context/` — Studio OS project memory

## In progress

- PR #4 open on branch `claude/studio-os-integration-20260324` — Studio OS + v3.3 play-calling

## Blockers

- None

## Next 3 moves

1. Coaching/scheme system (v3.4) — hire OC/DC/ST, assign schemes, affect sim outcomes
2. Contract/salary cap depth (v3.5)
3. Narrative season events (v3.6)
