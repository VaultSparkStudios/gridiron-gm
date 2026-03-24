# Task Board

## In Progress

- Apply Studio OS full structure to gridiron-gm repo
  - [x] Fix vite.config.js base path
  - [x] Create scripts/postbuild-pages.mjs
  - [x] Create AGENTS.md
  - [x] Create context/ files (PROJECT_BRIEF, BRAIN, SOUL, CURRENT_STATE, DECISIONS, TASK_BOARD, OPEN_QUESTIONS, LATEST_HANDOFF, PORTFOLIO_CARD, PROJECT_STATUS.json)
  - [ ] Create logs/WORK_LOG.md
  - [ ] Create docs/ files (GAME_LOOP, SYSTEMS, CONTENT_PLAN, LIVE_OPS, CREATIVE_DIRECTION_RECORD, deployment docs)
  - [ ] Create docs/templates/
  - [ ] Create prompts/start.md, prompts/closeout.md
  - [ ] Update .github/workflows/ (ci.yml + deploy-pages.yml, replace deploy.yml)
  - [ ] Create CODEX_HANDOFF_2026-03-24.md
  - [ ] Verify build passes
  - [ ] Create PR

## Backlog — Gameplay Features

- Position filter on scouting/draft prospect boards (currently only roster + FA have it)
- Live sim player stats written back to `.ss` season stats
- Coach/staff system (hireable coordinators affecting team ratings)
- Contract extensions (re-sign players before they enter FA)
- Injury depth chart (backup auto-promotion)
- Export/import save state (JSON)

## Backlog — Infrastructure

- Analytics/telemetry (privacy-safe, no PII)
- OG image for social sharing at `public/images/cover.png`
- Mobile layout improvements

## Done (recent)

- v3.2: Sim Draft, Enhanced Roster Table, FA Table Overhaul, Clickable Box Scores, Live Sim with SVG field
- Three bug fixes: live sim commit, operator precedence, simWk/simAll guard
- GitHub Pages deployment working from game repo
