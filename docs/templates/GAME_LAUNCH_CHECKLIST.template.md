# __GAME_NAME__ Launch Checklist

Use this checklist before publishing a new VaultSpark Studios game.

Replace:

- `__GAME_NAME__` with the branded game name
- `__GAME_SLUG__` with the lowercase public slug

## Identity

- [ ] Repo name is finalized as `__GAME_SLUG__`
- [ ] Public slug is finalized as `__GAME_SLUG__`
- [ ] Public URL is set to `https://vaultsparkstudios.com/__GAME_SLUG__/`
- [ ] Credits/attribution/license review is complete
- [ ] README and CREDITS reflect the final public branding

## Frontend

- [ ] App base path supports `/{slug}/`
- [ ] Canonical URL is set correctly
- [ ] OG image URL is set correctly
- [ ] Manifest `start_url` and `id` are subpath-safe if used
- [ ] SPA fallback `404.html` is generated from `index.html`
- [ ] Deep links reload correctly under the Pages subpath
- [ ] Share URLs/copy URLs use the correct subpath
- [ ] Pages bundle deploys directly from this repo

## Backend

- [ ] Gameplay/socket origin is finalized:
  - `https://play-__GAME_SLUG__.vaultsparkstudios.com`
- [ ] API origin is finalized:
  - `https://api-__GAME_SLUG__.vaultsparkstudios.com`
- [ ] Backend runtime plan reviewed in `docs/STUDIO_BACKEND_PLAN.md`
- [ ] Docker runtime template copied or adapted:
  - `docs/templates/deploy-backend.docker-compose.template.yml`
- [ ] Caddy runtime template copied or adapted:
  - `docs/templates/Caddyfile.studio-backend.template`
- [ ] DNS exists for gameplay/socket origin
- [ ] DNS exists for API origin
- [ ] SSL is valid on both backend origins
- [ ] CORS allows `https://vaultsparkstudios.com`
- [ ] Auth redirects/callbacks are verified if applicable

## GitHub Configuration

- [ ] Settings -> Pages -> Source is `GitHub Actions`
- [ ] Repo variable `GAME_SERVICE_ORIGIN` is set if the frontend points to a live gameplay origin
- [ ] Repo variable `API_DOMAIN` is set if the frontend points to a live API origin
- [ ] `deploy-pages.yml` is configured for `__GAME_SLUG__`
- [ ] Optional backend deploy workflow is configured

## Studio Site Integration

- [ ] Latest `VaultSparkStudios.github.io` remote state has been fetched
- [ ] Live landing page or current upstream `index.html` has been checked before editing
- [ ] `Vault-Forged` card has been added or updated in `VaultSparkStudios.github.io`
- [ ] Card copy follows the standard:
  - status
  - one-sentence pitch
  - three meta tags
  - one CTA
- [ ] Card links to `/__GAME_SLUG__/`
- [ ] Card visual treatment matches the existing section pattern

## Validation

- [ ] typecheck passes if the repo has a typecheck step
- [ ] lint passes if the repo has a lint step
- [ ] test suite passes
- [ ] production Pages build passes
- [ ] mobile smoke test passes
- [ ] desktop smoke test passes
- [ ] hard-refresh deep-link test passes
- [ ] one real manual gameplay/session pass is complete

## Launch

- [ ] Pages deploy completed successfully from this repo
- [ ] Public URL loads correctly
- [ ] Studio homepage changes are pushed if card work was part of the launch
- [ ] Core gameplay/API connectivity is live if backend-linked mode is enabled
- [ ] Any analytics/telemetry checks are green

## Post-launch

- [ ] `CODEX_HANDOFF_YYYY-MM-DD.md` updated with:
  - public URL
  - backend origins
  - workflow names
  - required settings/variables
  - known issues
- [ ] First-launch issues logged for follow-up
