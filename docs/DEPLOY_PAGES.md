# Gridiron GM — Pages Deployment

This repo builds and deploys its own GitHub Pages site directly at:

- `https://vaultsparkstudios.com/gridiron-gm/`

The Pages bundle is 100% client-side. There is no server-backed runtime — the game
runs entirely in the browser using React and local state.

Backend/runtime deployment is separate if ever needed. The default studio runtime
plan lives in:

- `docs/STUDIO_BACKEND_PLAN.md`

## Required GitHub setup

In `VaultSparkStudios/Gridiron-GM`:

- Settings → Pages → Source: `GitHub Actions`

## Optional GitHub variables

Set these only if the published client should point at a live backend (not currently needed):

- `GAME_SERVICE_ORIGIN`
  - `https://play-gridiron-gm.vaultsparkstudios.com`
- `API_DOMAIN`
  - `api-gridiron-gm.vaultsparkstudios.com`

No secret is required for GitHub Pages deployment.

## What the workflow does

`.github/workflows/deploy-pages.yml`:

1. Sets `VITE_APP_BASE_PATH=/gridiron-gm/`
2. Builds the static client with `npm run build:pages`
3. `build:pages` runs Vite build then `scripts/postbuild-pages.mjs` which copies `dist/index.html` → `dist/404.html` for SPA deep-link fallback
4. Uploads the built `dist/` artifact to GitHub Pages
5. Deploys the artifact directly from this repo

Local validation commands:

- `npm run build:pages`
- Then inspect `dist/404.html` to verify the fallback was generated

## CI workflow

`.github/workflows/ci.yml`:

1. Runs on every push and PR to `main`
2. Installs dependencies
3. Runs `npm run build` to verify the build passes

## Current scope

No backend. Published Pages artifacts run in browser/local-storage mode.
If `GAME_SERVICE_ORIGIN` or `API_DOMAIN` is configured later, the build can
point the client at that backend.

## Studio site follow-up

The studio site repo is the landing page and discovery layer. Homepage card
changes are separate content work:

- Fetch the latest `VaultSparkStudios.github.io` remote state first
- Verify the live or upstream landing page before editing
- Keep the card link pointed at `/gridiron-gm/`
