# Live Ops

## Current operational state

- Deployment: GitHub Pages, direct from `VaultSparkStudios/Gridiron-GM` repo
- Frontend URL: `https://vaultsparkstudios.com/gridiron-gm/`
- Backend: None — 100% client-side, browser-local state only
- Persistence: `gm_autosave` localStorage key (auto-save on every week/phase advance)
- Analytics: PostHog (requires `VITE_POSTHOG_KEY` in .env.local to activate)
- PWA: manifest.json + sw.js service worker — installable on mobile + desktop

## Deployment workflow

- Trigger: Push to `main` branch, or manual `workflow_dispatch`
- Workflow: `.github/workflows/deploy-pages.yml`
- Build command: `npm run build:pages` (Vite build + 404.html copy)
- Deploy target: GitHub Pages from same repo
- Build time: ~30 seconds

## Monitoring

- No automated monitoring configured
- Manual check: visit `https://vaultsparkstudios.com/gridiron-gm/` after deploy
- PostHog dashboard: check after `VITE_POSTHOG_KEY` is configured

## PWA / Service Worker

- `public/sw.js` — registered from `src/main.jsx` on window load
- Caches: `/gridiron-gm/`, `/gridiron-gm/index.html`, manifest, cover.png, icon.svg
- Strategy: cache-first for HTML/static; network-first for `/assets/` JS/CSS chunks
- Activate: clears old caches automatically on SW update
- Icon files: `public/images/icon.svg`, `icon-192.svg`, `icon-512.svg`
- Manifest: `public/manifest.json` — `start_url: /gridiron-gm/`, `scope: /gridiron-gm/`

## Known operational constraints

- No backend: all computation is client-side
- No multiplayer: single-player only
- No cloud save: localStorage only — clearing browser data resets progress

## Distribution presence

- GitHub Pages: `https://vaultsparkstudios.com/gridiron-gm/`
- itch.io: listing copy written — pending publish
- Reddit: post copy written — pending publish to r/footballgames + r/WebGames

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
