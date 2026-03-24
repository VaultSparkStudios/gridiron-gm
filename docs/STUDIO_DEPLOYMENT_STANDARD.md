# VaultSpark Studios Deployment Standard

This document defines the default deployment structure for all VaultSpark
Studios games.

It exists to keep launches consistent across:

- repository naming
- public URL structure
- GitHub Pages deployment
- backend domain naming
- landing-page integration
- handoff and operational documentation

## Core model

Use a hub-and-spoke structure.

- Hub:
  - `vaultsparkstudios.com`
  - studio landing page
  - shared brand/navigation/discovery
- Spokes:
  - one repo per game
  - one static frontend deployment per game repo
  - optional dedicated backend per game

The studio site is the presentation and discovery layer.
Each game repo is the product and deployment layer for that game.
Each backend service is the runtime layer.

Do not collapse those roles into one repository.

Each game repo must still remain self-sufficient.

That means every game repo should carry enough local documentation to explain:

- the studio-wide URL and backend naming standards
- the backend runtime hosting pattern
- the GitHub Pages deployment pattern
- the studio-site integration pattern
- the current game's public URL and backend origins
- the required variables, settings, and workflows

The studio repo is canonical, but no game repo should rely on chat history or
external tribal knowledge to understand the studio deployment model.

## Repository standard

Keep one repo per game plus one studio-site repo.

- Studio site repo:
  - `VaultSparkStudios.github.io`
- Game repos:
  - `vaultfront`
  - `dunescape`
  - `call-of-doodie`
  - `gridiron-gm`

Rules:

- game repo names are lowercase with hyphens
- repo name and public slug are identical
- do not use the studio-site repo as the gameplay source repo
- every game repo must keep local copies of the studio deployment standard,
  templates, and handoff references so the repo remains self-sufficient

## Public URL standard

Every game gets a lowercase slug.

Examples:

- `vaultfront`
- `dunescape`
- `call-of-doodie`
- `gridiron-gm`

Public URLs:

- studio root:
  - `https://vaultsparkstudios.com/`
- game paths:
  - `https://vaultsparkstudios.com/vaultfront/`
  - `https://vaultsparkstudios.com/dunescape/`
  - `https://vaultsparkstudios.com/call-of-doodie/`

Rules:

- use lowercase
- use hyphens, not underscores
- keep the slug stable once launched
- treat the slug as the canonical public identifier
- repo name and path slug must match

## Backend domain standard

Use per-game backend subdomains once a game is live or operationally distinct.

Recommended pattern:

- gameplay/socket origin:
  - `https://play-{slug}.vaultsparkstudios.com`
- API origin:
  - `https://api-{slug}.vaultsparkstudios.com`

Examples:

- `https://play-vaultfront.vaultsparkstudios.com`
- `https://api-vaultfront.vaultsparkstudios.com`
- `https://play-dunescape.vaultsparkstudios.com`
- `https://api-dunescape.vaultsparkstudios.com`

Rules:

- use one naming convention across all games
- do not mix `vaultfront-api` for one project and `api-vaultfront` for another
- split gameplay/socket traffic from general API traffic unless there is a strong reason not to

## Frontend deployment standard

Every game frontend must build correctly under a subpath.

Required production values:

- `VITE_APP_BASE_PATH=/{slug}/`
- `VITE_CANONICAL_URL=https://vaultsparkstudios.com/{slug}/`
- `VITE_OG_IMAGE_URL=https://vaultsparkstudios.com/{slug}/images/cover.png`
- `VITE_DOMAIN=vaultsparkstudios.com`

Optional backend-linked values:

- `VITE_GAME_SERVICE_ORIGIN=https://play-{slug}.vaultsparkstudios.com`
- `API_DOMAIN=api-{slug}.vaultsparkstudios.com`

Rules:

- every game must support GitHub Pages subpath hosting
- every game must generate SPA deep-link fallback `404.html`
- every game must avoid hardcoding `/` as the production client root
- every game deploys Pages directly from its own repo using GitHub Actions

## GitHub workflow standard

Each game repo should have:

1. `ci.yml`
   - typecheck
   - lint
   - tests

2. `deploy-pages.yml`
   - build static client for `/{slug}/`
   - copy `index.html` to `404.html`
   - upload the built artifact to GitHub Pages
   - deploy Pages directly from the same repo

3. `deploy-backend.yml` if the game has a dedicated runtime/backend

Rules:

- frontend deploy and backend deploy must be separate workflows
- do not couple Pages publishing to backend rollout
- enable Settings -> Pages -> Source = `GitHub Actions` in each game repo

## Temporary clone safety standard

When a temporary clone of another repo is created inside a game repo for
inspection or patching, it must not be staged into the parent game repo.

Rules:

- never use `git add .` blindly in a dirty multi-repo workspace
- add temporary clone paths to `.git/info/exclude` in the parent repo
- commit temporary clones only from within their own repo context
- treat temporary clone directories as operational scratch space, not project files

## GitHub variables and secrets standard

Per game repo, keep names consistent.

Optional repo variables for games with a backend:

- `GAME_SERVICE_ORIGIN`
- `API_DOMAIN`

Secrets:

- backend deploy credentials
- game-specific API/auth secrets

Rules:

- GitHub Pages deployment itself does not require a token secret
- keep variable names identical across all game repos
- only values should change per game

## Landing-page integration standard

Every launched game gets a card in the `Vault-Forged` section of the studio site.

Required card fields:

- title
- status
- one-sentence pitch
- three meta tags
- one primary CTA
- canonical path slug
- card-art theme class

Rules:

- reuse the existing `Vault-Forged` card template
- keep the CTA singular and clear
- keep copy concise
- do not introduce per-game bespoke card markup unless the entire section is being redesigned
- before committing studio-site changes, fetch the latest remote state and
  verify the live landing page or current upstream `index.html` so changes are
  applied against the real current site, not a stale clone

## Per-game launch checklist

Before launch, every game must have:

1. subpath-safe frontend
2. canonical URL configured
3. OG image under the game path
4. SPA fallback
5. GitHub Pages enabled from the game repo via `GitHub Actions`
6. studio-site card
7. backend origins configured if needed
8. legal/attribution reviewed
9. analytics verified
10. mobile smoke test
11. hard-refresh deep-link test
12. studio-site remote/live verification completed before homepage changes are committed

Reusable template:

- `docs/templates/GAME_LAUNCH_CHECKLIST.template.md`
- `docs/STUDIO_BACKEND_PLAN.md`
- `docs/templates/deploy-backend.docker-compose.template.yml`
- `docs/templates/Caddyfile.studio-backend.template`

## Handoff standard

Each game repo should maintain:

- `CODEX_HANDOFF_YYYY-MM-DD.md`

It should include:

- deployment status
- repo remotes
- public frontend URL
- backend origins
- workflow names
- required settings and variables
- known issues
- last validation commands

Rules:

- update the handoff after deployment-related changes
- treat the handoff as operational memory, not marketing copy
- record any temporary clone paths or staging-exclusion safeguards if they were
  needed during deployment work

## Future-game defaults

For a new game with slug `shadow-rift`:

- repo:
  - `shadow-rift`
- public URL:
  - `https://vaultsparkstudios.com/shadow-rift/`
- gameplay origin:
  - `https://play-shadow-rift.vaultsparkstudios.com`
- API origin:
  - `https://api-shadow-rift.vaultsparkstudios.com`

## Non-negotiable governance rules

- one studio site
- one repo per game
- one stable slug per game
- one direct Pages deployment per game repo
- one backend origin pair per game
- one reusable deployment workflow pattern across all games
- one self-sufficient documentation set per game repo

This is the default unless there is a specific technical reason to deviate.
