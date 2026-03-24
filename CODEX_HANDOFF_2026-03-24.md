# Codex Handoff — 2026-03-24

Deployment-focused operational handoff for Gridiron GM.

## Repo

- GitHub: `VaultSparkStudios/Gridiron-GM`
- Branch: `main`
- Local: `C:\Users\p4cka\documents\development\gridiron-gm\`

## Public frontend

- URL: `https://vaultsparkstudios.com/gridiron-gm/`
- Deployment: GitHub Pages, direct from this repo
- Source: `GitHub Actions` (Settings → Pages → Source)

## Backend origins

- Not configured — game is 100% client-side
- Future gameplay origin: `https://play-gridiron-gm.vaultsparkstudios.com`
- Future API origin: `https://api-gridiron-gm.vaultsparkstudios.com`

## Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | push/PR to main | Build verification |
| `.github/workflows/deploy-pages.yml` | push to main (src changes) or manual | Deploy to GitHub Pages |

## Build commands

```bash
npm run build         # standard Vite build
npm run build:pages   # Vite build + generates dist/404.html fallback
```

## Required GitHub settings

- Settings → Pages → Source: `GitHub Actions` ✓

## Optional GitHub variables (not currently set)

- `GAME_SERVICE_ORIGIN` — set when backend is live
- `API_DOMAIN` — set when backend is live

## Vite config

- Base path: `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"`
- `deploy-pages.yml` sets `VITE_APP_BASE_PATH=/gridiron-gm/` in CI env

## SPA fallback

- `scripts/postbuild-pages.mjs` copies `dist/index.html` → `dist/404.html`
- Run automatically by `npm run build:pages`

## Known issues

- No persistent save — game state is session-only
- Live sim stats not written to player .ss season stats (box score / POG only)
- No position filter on draft/scouting prospect board

## Last validation

- Date: 2026-03-24
- Build: `npm run build` — passes
- Deploy: GitHub Pages workflow running via push to main
