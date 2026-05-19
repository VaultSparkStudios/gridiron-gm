# Project Agent Guide

## Session Protocol (agent-neutral — applies to Claude Code, Codex, any agent)

The canonical execution protocol for every Studio OS session lives in **`docs/SESSION_PROTOCOL.md`** in this repo (propagated from studio-ops).

It covers the 3-command rhythm (`/start` → `/go` → `/closeout`), full protocol for 15 commands, and agent-specific notes for Claude Code + Codex. Both agents execute the same instructions; per-agent branching is flagged explicitly with `IF agent = claude-code:` / `IF agent = codex:`.

See `docs/SKILL_MAP.md` for the one-page command cheatsheet.

This public repository contains deployable project code and public-safe documentation.

Public-safe rule:
- keep deployable code and browser-safe configuration in this repo
- keep internal operating procedures, private planning, secret-handling workflows, and detailed studio process docs in the private Studio OS / ops repository

## IP and Licensing (CANON-008)

All VaultSpark Studios code, content, assets, and designs are **proprietary by default**. All rights are reserved by VaultSpark Studios LLC unless a license is explicitly declared and approved by the Studio Owner.

**Agent rules:**
- Never add a `LICENSE` file with open-source terms unless explicitly instructed by the Studio Owner
- Never label a page, readme, or doc as "open source" for VaultSpark-original work
- Attribution/compliance pages on public sites must use proprietary-first language
- `docs/RIGHTS_PROVENANCE.md` default: `License: Proprietary — All Rights Reserved, VaultSpark Studios LLC`

**Exceptions (legal obligations — not discretionary):**
Any project forked from a copyleft-licensed upstream must declare its license in `context/DECISIONS.md` and `docs/RIGHTS_PROVENANCE.md`. Check `docs/RIGHTS_PROVENANCE.md` for this project's obligations.

Full decision: `vaultspark-studio-ops/docs/STUDIO_CANON.md` → CANON-008

---

---

<!-- studio-os:universal-sections-start -->
<!-- Source: vaultspark-studio-ops/docs/templates/project-system/AGENTS_universal_sections.md -->
<!-- DO NOT EDIT — re-run `node scripts/propagate-agents-sections.mjs --apply` from studio-ops to refresh -->

<!-- Universal AGENTS.md sections — propagate to every Studio repo via scripts/run-template-propagation.mjs -->
<!-- Owner: Studio Ops · Source: docs/templates/project-system/AGENTS_universal_sections.md -->
<!-- Last revised: 2026-04-30 (Session 70 — adds Capabilities Index + Secrets + Sitemap pointers) -->

## Skill & Capability Discovery (CANON-012)

If you (Claude / Codex / subagent / managed agent) need to do something and don't know the right command, **check the Studio capabilities index first** before declaring the task blocked or unknown.

- **Master index:** `vaultspark-studio-ops/docs/AGENT_CAPABILITIES.md` — every skill, script, agent role, MCP tool, and credential capability available studio-wide. Auto-regenerated nightly + on closeout.
- **Natural-language lookup:** `node ../vaultspark-studio-ops/scripts/ops.mjs cap "<intent>"` — describe what you need ("send an email", "deploy to Cloudflare", "check uptime") and it returns the matching capability.
- **Slash-command list (Claude):** `~/.claude/skills/`. **Codex:** `~/.agents/skills/`.
- **Cheatsheet:** `vaultspark-studio-ops/docs/SKILL_MAP.md`.

If nothing matches, **file an innovation candidate** (it goes into the next genius list) — do not surface as a human-blocker until you've checked the index and run the elevated-probe step.

---

## Secrets Discovery (CANON-012)

All Studio credentials live in **`vaultspark-studio-ops/secrets/`**. Every project, every agent, every script reads from here. Never read `.env` directly in subprocesses; never assume `process.env.X` is set.

**Before declaring any task "Human Action Required":**

```bash
node ../vaultspark-studio-ops/scripts/check-secrets.mjs --for <capability>
```

If the capability returns READY → proceed autonomously. If MISSING → check `vaultspark-studio-ops/secrets/CAPABILITY_MAP.json` for the canonical env var names, then run `/intake-credentials` if the founder needs to supply them. The "phantom blocker" pattern (labeling something human-blocked when the credential is already present) is forbidden by canon.

**Resolving a secret in code:**

```js
import { getSecret, resolveCapability, redact } from 'vaultspark-studio-ops/scripts/lib/secrets.mjs';
const key = await getSecret('STRIPE_SECRET_KEY', 'stripe.checkout');
console.log(redact(`Using ${key}`));
```

**Stripe Agent Payments** (autonomous spend on behalf of agents — ad spend, domain renewal, infra top-up): use capability `stripe.agent-payments` with built-in spend-cap. Reference: https://stripe.com/blog/giving-agents-the-ability-to-pay · Audit log: `secrets/.payments.log`.

Full protocol: `vaultspark-studio-ops/docs/SECRETS_PROTOCOL.md`.

---

## Sitemap Standard (CANON-011 · public-facing projects only)

If this project's `audience` is `public-*`, every page in `docs/PROJECT_SITEMAP_STANDARD.md` must exist and pass the quality bars (LCP <1.8s · CWV green · CSP strict · `/agents.json` · `/.well-known/llms.txt` · sitemap.xml). Reference exemplars: vaultsparkstudios.com · vorn.app · mindframe.app.

Audit: `node ../vaultspark-studio-ops/scripts/check-sitemap-compliance.mjs --project <slug>`.

Project must score ≥8/10 before flipping to SPARKED. `app-release-gate` enforces.

---

## CANON-019 — Founder-Action Discipline (CDR-S126.1, MANDATORY)

**Problem this canon fixes:** agents repeatedly label tasks as "Founder Action Required" or "Human Blocker" when the work is actually agent-attemptable. Pattern observed across multiple repos and sessions. **Default behavior MUST flip: try first, label blocked only after evidence of attempt.**

**Hard gate — before any task is labeled `Human Action Required`, `[BLOCKER]`, `FOUNDER ACTION`, or `human-blocked`, you MUST have run AND logged:**

```bash
# 1. Secrets discovery (always)
node ../vaultspark-studio-ops/scripts/check-secrets.mjs --for <capability>

# 2. Elevated/admin probe (always)
node ../vaultspark-studio-ops/scripts/ops.mjs blocker-preflight

# 3. If credential is READY → execute the action yourself using the secrets gateway
# 4. If admin probe reveals agent-attemptable path → execute it
```

**Reserve `Human Action Required` ONLY for:** hardware key enrollment · provider dashboard signup · billing/payment confirmation · destructive ops explicitly gated by CANON (force-push to main, npm publish, prod DB drop).

**Everything else is agent work.** This includes: applying migrations · running deploys (`wrangler deploy`, `vercel deploy`, `gcloud run deploy`) · setting secrets in providers (`wrangler secret put`, `gh secret set`, `gcloud secrets versions add`) · creating workflows · scaffolding files · running `--apply` flags on scripted migrations · enrolling in API allowlists via API calls.

**Closeout enforcement (CANON-019):** every `/closeout` runs:
```bash
node ../vaultspark-studio-ops/scripts/enforce-blocker-discipline.mjs
```
Verdict `discipline-gap` → warns founder + lists violating items. With `--strict` flag → blocks closeout. Log persisted to `portfolio/BLOCKER_DISCIPLINE_LOG.ndjson`.

**The phantom-blocker pattern is forbidden.** If you find yourself typing `FOUNDER ACTION` or `human-blocked` without two commits showing `check-secrets` + `blocker-preflight` evidence in the last hour, **STOP and try the action yourself.**

---

## Elevated-access protocol (S113 — apply migrations yourself)

When a sprint deliverable lists "Founder action needed" steps that are **scripted** (`wrangler deploy`, `wrangler secret put`, `gh workflow run`, `node scripts/migrate-*.mjs --apply`, `hcloud …`, `gcloud …`, etc.), the agent **must execute them itself** using the relevant gateway capability — not leave them for the founder.

**Reserve "Human Action Required" only for:**
- Hardware key enrollment (FIDO2, Yubikey)
- Provider dashboard signup / account creation
- Billing / payment confirmation
- Destructive operations explicitly gated by CANON (force-push to main, npm publish, etc.)

Safe scripted migrations are agent work, not founder work. The founder-twin auto-approves the safe patterns; deny patterns still gate at the founder. Use `node scripts/twin-ask.mjs <Tool> <input>` for cross-agent verdict (Codex) or rely on the PreToolUse hook (Claude Code).

---

## Founder-Twin auto-approval (S113 — cross-agent)

Both Claude Code and Codex consult one shared auto-approval model. Same brain, same history, same audit trail — patterns learned by one agent benefit every agent.

**Codex usage** (no native PreToolUse hook — call explicitly before risky commands):

```bash
node ../vaultspark-studio-ops/scripts/twin-ask.mjs Bash "<command>"
# exit 0 = approve · exit 1 = ask · exit 2 = deny
```

**Claude Code:** wired automatically via `~/.claude/settings.json` → `hooks.PreToolUse`.

Disable per-session: `export TWIN_DISABLED=1`. Full spec: `vaultspark-studio-ops/docs/TWIN_PROTOCOL.md`.

---

## Universal `/audit` + `/implement` (S113)

Two project-agnostic skills for both agents:

- `/audit` — genius-level 9-axis project audit → writes `docs/AUDIT_<date>.md`
- `/implement` — read latest `AUDIT_*.md` and ship every item in optimal-efficiency order

Project-type aware via `portfolio/PROJECT_REGISTRY.json` → `type`. Personal-scope canonical at `~/.claude/skills/` (Claude) and `~/.agents/skills/` (Codex mirror, auto-synced).

---

## Studio Website Reference Scaffold (D-S119.3)

Before scaffolding any public-facing website page (home, auth, dashboard, marketing, legal, etc), agent MUST consult the canonical catalog at:

- `vaultspark-studio-ops/portfolio/STUDIO_WEBSITE_SCAFFOLD/catalog.json` — live catalog (auto-refreshed nightly)
- `vaultspark-studio-ops/portfolio/STUDIO_WEBSITE_SCAFFOLD/patterns.json` — derived consensus patterns
- `vaultspark-studio-ops/docs/STUDIO_WEBSITE_SCAFFOLD_PLAN.md` — architecture + rationale

**Workflow.** (1) Read `catalog.json` — see how vaultsparkstudios.com, joinvorn.com, usemindframe.com (and others) handle menu, auth, footer, page list. (2) Read `patterns.json` — use the consensus pattern unless this project's `context/SOUL.md` justifies a deviation. (3) If deviating, log it in `context/DECISIONS.md` with rationale. (4) For ANY public signup flow, wire the **Vault SSO contract** (see `docs/VAULT_SSO_CONTRACT.md`). Free Studio membership is auto-granted on signup unless user opts out.

**Enforcements (non-negotiable for public projects):** branding line per type (CANON-006), footer copyright `© 2026 VaultSpark Studios LLC. All rights reserved.`, required legal pages `/privacy` + `/terms`, Vault SSO call on signup-success when `vault.sso` capability is provisioned.

Refresh manually: `node vaultspark-studio-ops/scripts/scrape-studio-websites.mjs`.

---

## Max Plan First (CANON-015 · CDR-S120.1)

Default to **Claude Max Plan** for every new Claude-using feature. Direct Anthropic **API** calls require:
1. **Feasibility check** — confirm Max Plan can't deliver this (e.g. true rate-limit, automation-only context).
2. **Cost estimate** — projected monthly $ with usage assumptions.
3. **Founder approval** logged in `context/DECISIONS.md` with `[API]` tag.

**Enforcement.** Every script making direct Anthropic HTTP calls (`api.anthropic.com`, `@anthropic-ai/sdk`, or model-router bypass) must appear in `portfolio/APPROVED_API_SCRIPTS.json`. Doctor probe `api-allowlist` greps `scripts/` for direct usage and fails on unregistered callers.

**Existing API code is grandfathered** — only new adoption requires approval.

---

## Free-Build Bias (CANON-017 · CDR-S120.1)

Default integration choices live in `docs/INTEGRATION_PREFERENCES.md`. Before adopting any **new** SaaS that isn't the canonical free choice, fill `docs/templates/BUILD_VS_BUY.md` and get founder sign-off. Lock-in score ≥6 requires explicit founder override.

**Doctor probe `build-vs-buy-discipline`** fails when a `[INTEGRATION]` decision in `DECISIONS.md` doesn't link a `BUILD_VS_BUY` record.

---

## Studio Ark — Cross-Repo Transport (CANON-018)

Every Studio repo's `/start` automatically drains the Studio Ark inbox (step 1.8). Cargo addressed to this repo's `slug` (or `*` broadcast) appears in `.cache/ark-inbox.json`; the `╔══ ARK STATUS ══╗` tile in the startup brief surfaces depth + sig health.

**Sending cargo:**

```bash
# Share a learned pattern with the fleet
node scripts/ark.mjs ship --type pattern-share --to '*' \
  --payload '{"pattern":"win-spawn-quirk","context":"node child_process on Windows","solution":"use absolute paths","tags":["windows","node"]}'

# Ask another repo a question
node scripts/ark.mjs ship --type repo-question --to mindframe \
  --payload '{"question":"how do you handle X","context":"working on similar feature","replyTo":"my-slug"}'

# Hand off intent + context to another repo's agent
node scripts/ark.mjs ship --type agent-handoff --to vorn \
  --payload '{"intent":"finish auth refactor","openFiles":["src/auth.ts"],"recentDecisions":["use vault-sso"]}'
```

**Rules:**
- Never write directly to another repo's files. Ship cargo instead (CANON-018).
- Receipts are auto-emitted on drain — don't ship them manually.
- Producer allowlist enforced in `portfolio/ark/MANIFEST.json`. Most types are open; `canon-update` + `phantom-blocker-fix` are studio-ops only.
- Full design: `vaultspark-studio-ops/docs/STUDIO_ARK.md`.

---

<!-- studio-os:universal-sections-end -->
