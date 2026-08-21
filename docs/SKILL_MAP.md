<!-- generated-by: scripts/propagate-skill-map.mjs -->
<!-- canonical-source: VaultSparkStudios/vaultspark-studio-ops/docs/templates/project-system/SKILL_MAP.template.md -->

# Skill Map — Studio OS Slash Commands

This is the cheatsheet for every slash command (`/name`) available in any Claude Code session opened in a VaultSpark project repo. Skills are personal-scope (`~/.claude/skills/`) — they live-reload across all 28 repos; this doc just explains when to use each.

## The 3-command rhythm

Muscle memory: **`/start` → `/go` or `/goal` → `/closeout`**. Everything else routes itself.

| Command | When |
|---|---|
| **`/start`** | Begin every session. Detects mode (BUILDER vs FOUNDER), loads context, renders the startup brief with SIGNALS + GENIUS HIT LIST + HUMAN PRESSURE. |
| **`/go`** | Right after `/start`. Refreshes the Unified Genius List (IGNIS-fueled, 12 items), syncs items into TASK_BOARD, captures memory patterns, executes unblocked items at quality bar with risk gating. Proactively suggests a specialty skill if the project type warrants one. |
| **`/goal`** | Durable Codex objective for one bounded long-running Studio task. Uses the top unblocked Now/Genius item unless you provide an exact goal, works in checkpoints, and stops only when verified, blocked, or approval-sensitive. |
| **`/closeout`** | End every session. Write-back in canonical order → score 5 categories → commit + push via autopilot with confirmation. |

## When you don't know the right command

**`/ask <plain-English intent>`** — the router. Takes "is voidfall ready to ship?", "check this novel chapter for canon drift", "what should I do next?" etc. Reads the live skill registry and either invokes the best match or surfaces ranked options.

Example: `/ask is voidfall ready to ship?` → routes to `/app-release-gate`.

## Specialty commands (agent-invoked, but you can call them directly)

You rarely need to type these — `/go` proactively suggests them based on project type. But they're here when you want them.

### Creative / design

| Command | Use for | Project types |
|---|---|---|
| `/game-loop-review` | Game loop tightness, progression, retention, soul fidelity | `game` |
| `/novel-continuity-check` | Canon + continuity scan across chapters | `novel` |
| `/soul-interview` | Define or refresh a project's SOUL.md creative identity | any |

### Release / ops

| Command | Use for | Project types |
|---|---|---|
| `/app-release-gate` | Go/no-go checklist before SPARKED or public launch | `app`, `web-app`, `saas` |
| `/infra-debt-sweep` | Technical debt audit, stale scripts, divergent renderers | `infrastructure`, `internal-ops` |
| `/security-check` | One-pass sweep: sanitize settings + scan secrets + audit gateway | any |
| `/package-trust` | Obelisk gate to rank packages/downloads before install and avoid malicious artifacts | any |

### Studio-wide (run from any repo — operate on the portfolio)

| Command | Use for |
|---|---|
| `/studio-status` | Multi-session state across all 28 repos — active sessions, conflicts, stale locks |
| `/studio-review` | Monthly cross-portfolio strategic review — 6 categories, strategic bets |
| `/studio-genius-refresh` | Refresh Unified Genius List + Studio Pulse + Founder Queue mid-session |
| `/initiate` or `/initiate <name>` | Autonomous new-project onboarding — 60-second target |

### Credentials

| Command | Use for |
|---|---|
| `/intake-credentials` | Structured wizard to capture missing API keys. Each credential validated via API ping before write. |

## Claude Code built-ins (available everywhere)

| Command | Use for |
|---|---|
| `/init` | Initialize a new CLAUDE.md in a fresh repo |
| `/review` | Review a pull request |
| `/security-review` | Code-level security review of pending changes (different from `/security-check` which sweeps for leaked secrets) |
| `/insights` | Report analyzing Claude Code session usage |
| `/help` | Help |

## Decision tree — "what should I type?"

```
Opening a repo?
  ├─ fresh repo, no context/ files   → /initiate
  └─ existing repo                   → /start

After /start brief?
  ├─ want an autonomous sprint       → /go
  ├─ want one durable long-run task  → /goal
  ├─ know exactly what to do         → type that command or say it in natural language
  └─ don't know what to do           → /ask what should I do next?

About to push?
  └─ always                          → /security-check (or let /closeout autopilot do it)

Adding a package or download?
  └─ always                          → /package-trust before install/download

End of session?
  └─ always                          → /closeout
```

## Gotchas

- **`/go` requires `/start` first.** If there's no session lock or loaded context, `/go` aborts and points you at `/start` (or `/initiate` for fresh repos).
- **`/goal` is Codex-first.** It uses Codex's native durable goals when enabled, but approval policy and sandbox mode still come from Codex config or startup flags.
- **Skills are personal-scope** — edited at `~/.claude/skills/<name>/SKILL.md`. One edit updates all 28 repos instantly.
- **Slash commands are also personal-scope** — at `~/.claude/commands/<name>.md`. These are thin shims that invoke the underlying skill.
- **`/security-review` vs `/security-check`**: `/security-review` is a Claude Code built-in that does code-level vulnerability review; `/security-check` is the Studio OS sweep for leaked credentials + sanitize local configs. They complement each other.
- **Natural language works too.** You don't have to type `/start` — "start" or "begin session" route the same way via the agent's skill-description matching.

## Cloudflare (D-S267.1 — adopted vendor surface)

Any Cloudflare question → search the **`cloudflare-docs` MCP server** (public, no auth) before trusting pre-trained knowledge — limits/pricing/API shapes drift. `cloudflare:*` skills auto-load for wrangler, Workers best practices, Durable Objects (free-tier SQLite DOs = real-time/multiplayer), web-perf/CWV audits, Turnstile, and email. Registry: `vaultspark-studio-ops/docs/INTERNAL_TOOLS.md` → "Official agent-setup surfaces".

## Claude Code vs Codex routing

Not sure whether a task belongs to Claude Code or Codex Cloud? See `docs/AGENT_ROUTING.md` for the routing decision table and the division-of-labor rationale. Short rule: Claude Code for protocol/canon/judgment/secrets; Codex for bounded parallelizable coding across many repos.

## Feedback / suggestions

Found a command that's missing, confusing, or near-duplicate? Add it to `TASK_BOARD.md` in this repo (or `vaultspark-studio-ops/context/TASK_BOARD.md` for Studio OS itself) under Unified Genius List, tagged `[UX]`.

---

*Canonical source: `vaultspark-studio-ops/docs/templates/project-system/SKILL_MAP.template.md`*
*Propagated by `scripts/propagate-skill-map.mjs` — do not hand-edit per-repo copies.*
