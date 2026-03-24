# Live Ops

## Current operational state

- Deployment: GitHub Pages, direct from `VaultSparkStudios/Gridiron-GM` repo
- Frontend URL: `https://vaultsparkstudios.com/gridiron-gm/`
- Backend: None — 100% client-side, browser-local state only
- Persistence: Browser session only (no save/load yet)
- Analytics: None configured

## Deployment workflow

- Trigger: Push to `main` branch, or manual `workflow_dispatch`
- Workflow: `.github/workflows/deploy-pages.yml`
- Build command: `npm run build:pages` (Vite build + 404.html copy)
- Deploy target: GitHub Pages from same repo
- Build time: ~30 seconds

## Monitoring

- No automated monitoring configured
- Manual check: visit `https://vaultsparkstudios.com/gridiron-gm/` after deploy

## Known operational constraints

- No persistent save: reloading the page resets all game state
- No multiplayer: single-player only
- No backend: all computation is client-side

## Future ops plan

If backend is ever added:
- Gameplay origin: `https://play-gridiron-gm.vaultsparkstudios.com`
- API origin: `https://api-gridiron-gm.vaultsparkstudios.com`
- See `docs/STUDIO_BACKEND_PLAN.md` for infrastructure pattern

## Incident response

For build failures:
1. Check `.github/workflows/deploy-pages.yml` run logs
2. Run `npm run build:pages` locally to reproduce
3. Fix in `src/App.jsx` or config files
4. Push fix to `main` — deploy re-runs automatically

For live site issues:
1. Check Pages deployment status in GitHub repo Settings → Pages
2. Verify `vite.config.js` base path is `process.env.VITE_APP_BASE_PATH || "/gridiron-gm/"`
3. Verify `dist/404.html` was generated (SPA deep-link fallback)
