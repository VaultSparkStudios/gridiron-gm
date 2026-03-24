# VaultSpark Studios Backend Infrastructure Plan

This document defines the default backend/runtime plan for VaultSpark Studios
games.

It is the backend counterpart to `docs/STUDIO_DEPLOYMENT_STANDARD.md`.

## Goal

Provide one scalable studio-wide hosting pattern that:

- works for `vaultfront` now
- scales to future games without redesigning the whole stack
- preserves per-game isolation
- keeps operational complexity low

## Default architecture

Start with one shared studio backend host.

- one Linux VPS
- Docker and Docker Compose
- Caddy as the reverse proxy
- one shared Postgres server instance
- one shared Redis server instance
- one pair of per-game services:
  - `play-{slug}`
  - `api-{slug}`

Frontend hosting stays separate:

- studio landing page:
  - `https://vaultsparkstudios.com/`
- per-game GitHub Pages frontends deployed from each game repo:
  - `https://vaultsparkstudios.com/{slug}/`
- runtime/backend:
  - `https://play-{slug}.vaultsparkstudios.com`
  - `https://api-{slug}.vaultsparkstudios.com`

## Recommended starting infrastructure

Use one VPS with roughly:

- Ubuntu 24.04 LTS
- 4 vCPU
- 8 GB RAM
- 100 GB SSD

Good providers:

- Hetzner
- DigitalOcean
- Vultr

This is the default starting point. Move a single game to its own host only
after actual load justifies it.

## DNS and domain model

Use Namecheap for registration and Cloudflare for DNS/TLS/proxy.

Per game, create:

- `play-{slug}.vaultsparkstudios.com`
- `api-{slug}.vaultsparkstudios.com`

For `vaultfront`:

- `play-vaultfront.vaultsparkstudios.com`
- `api-vaultfront.vaultsparkstudios.com`

Default DNS behavior:

- `api-*`: proxied through Cloudflare
- `play-*`: start proxied, but switch to `DNS only` if websocket behavior is
  unstable

## Service model

Shared infrastructure services:

- `caddy`
- `postgres`
- `redis`

Per game runtime services:

- `{slug}-play`
- `{slug}-api`

For example:

- `vaultfront-play`
- `vaultfront-api`
- `dunescape-play`
- `dunescape-api`

## Data model standard

Default database rule:

- one Postgres database per game

Examples:

- `vaultfront_db`
- `dunescape_db`

Do not share a single schema/database across all games unless there is a strong
technical reason.

Redis may be shared, but use per-game key prefixes.

Examples:

- `vaultfront:*`
- `dunescape:*`

## Reverse proxy standard

Caddy should route by hostname:

- `play-vaultfront.vaultsparkstudios.com` -> `vaultfront-play`
- `api-vaultfront.vaultsparkstudios.com` -> `vaultfront-api`

This preserves stable public URLs even if the underlying services move to new
hosts later.

## Security baseline

Minimum required:

- SSH key auth only
- disable password SSH login
- non-root deploy/admin user
- firewall for:
  - `22`
  - `80`
  - `443`
- automatic OS security updates where practical
- automatic TLS via Caddy
- backup policy for Postgres and important volumes
- secret injection through GitHub Actions and server env files

## Monitoring baseline

Minimum required:

- container restart policy
- disk space monitoring
- memory monitoring
- access/error logs retained
- nightly Postgres backup

Recommended next step after launch:

- uptime check on:
  - `https://vaultsparkstudios.com/vaultfront/`
  - `https://play-vaultfront.vaultsparkstudios.com/health`
  - `https://api-vaultfront.vaultsparkstudios.com/health`

## Deployment pattern

Frontend deployment:

- per-game GitHub Pages workflow deploys the built static artifact directly from
  that game repo

Backend deployment:

- per-game backend workflow builds and deploys `{slug}-play` and `{slug}-api`
  containers to the shared VPS

Do not couple frontend Pages publishing to backend rollout.

## VaultFront initial rollout checklist

1. Provision VPS
2. Install Docker and Docker Compose
3. Install Caddy
4. Create Postgres and Redis containers
5. Add Cloudflare DNS:
   - `play-vaultfront`
   - `api-vaultfront`
6. Deploy:
   - `vaultfront-play`
   - `vaultfront-api`
7. Add GitHub repo variables in `vaultfront` if backend-linked frontend config is needed:
   - `GAME_SERVICE_ORIGIN=https://play-vaultfront.vaultsparkstudios.com`
   - `API_DOMAIN=api-vaultfront.vaultsparkstudios.com`
8. Enable Settings -> Pages -> Source = `GitHub Actions`
9. Run `deploy-pages.yml`
10. Verify CORS and websocket behavior from:
   - `https://vaultsparkstudios.com/vaultfront/`

## Scaling path

Phase 1:

- one VPS for all games

Phase 2:

- move a hot game to its own host
- keep the same public DNS names
- repoint reverse proxy or DNS as needed

Phase 3:

- managed Postgres
- separate Redis
- centralized monitoring/logging

## Required repo artifacts

Every game repo should carry local copies of:

- `docs/STUDIO_DEPLOYMENT_STANDARD.md`
- `docs/STUDIO_BACKEND_PLAN.md`
- `docs/DEPLOY_PAGES.md`
- `docs/templates/deploy-pages.template.yml`
- `docs/templates/deploy-backend.docker-compose.template.yml`
- `docs/templates/Caddyfile.studio-backend.template`
- `docs/templates/GAME_LAUNCH_CHECKLIST.template.md`

The studio repo remains canonical, but each game repo must still be
self-sufficient.
