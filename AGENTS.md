# Project Agent Guide

## Studio OS

This project runs under the VaultSpark Studio OS.
Local path: `C:\Users\p4cka\documents\development\vaultspark-studio-ops`
GitHub: https://github.com/VaultSparkStudios/vaultspark-studio-ops

Read `vaultspark-studio-ops/docs/templates/` for canonical templates and conventions.
Read `vaultspark-studio-ops/portfolio/PROJECT_REGISTRY.md` for all active studio projects.
Read `vaultspark-studio-ops/docs/STUDIO_HUB_ONBOARDING.md` for hub acceptance requirements.

## Read order

1. `context/PROJECT_BRIEF.md`
2. `context/SOUL.md`
3. `context/BRAIN.md`
4. `context/CURRENT_STATE.md`
5. `context/DECISIONS.md`
6. `context/TASK_BOARD.md`
7. `context/LATEST_HANDOFF.md`
8. `context/SELF_IMPROVEMENT_LOOP.md`

## Required Studio OS files

Every session should confirm these files exist and are current:

| File | When to update |
|---|---|
| `context/LATEST_HANDOFF.md` | Every closeout — primary handoff |
| `context/CURRENT_STATE.md` | When shipped behavior changes |
| `context/TASK_BOARD.md` | When tasks complete or new ones are added |
| `context/DECISIONS.md` | When a meaningful decision is made |
| `context/PROJECT_BRIEF.md` | When scope or purpose changes |
| `context/SELF_IMPROVEMENT_LOOP.md` | Every closeout — append audit + brainstorm entry |
| `docs/CREATIVE_DIRECTION_RECORD.md` | Every time the human gives creative direction (ADDITIVE ONLY) |
| `logs/WORK_LOG.md` | Every closeout — append session entry |

## Closeout write-back (mandatory)

After any meaningful session, write back in this order:
1. `context/CURRENT_STATE.md`
2. `context/TASK_BOARD.md`
3. `context/LATEST_HANDOFF.md`
4. `logs/WORK_LOG.md`
5. `context/DECISIONS.md` (if decisions made)
6. `context/SELF_IMPROVEMENT_LOOP.md` — score, brainstorm, commit 1–2 items to TASK_BOARD
7. `docs/CREATIVE_DIRECTION_RECORD.md` — append if human gave any creative direction this session

## Self-Improvement Loop (mandatory)

Every closeout MUST include a Self-Improvement Loop entry in `context/SELF_IMPROVEMENT_LOOP.md`:

1. Score project across 5 categories (Dev Health / Creative Alignment / Momentum / Engagement / Process Quality)
2. Compare to prior scores — note ↑ ↓ → per category
3. Name 1 top win and 1 top gap
4. Brainstorm 3–5 innovative solutions or features
5. Commit 1–2 brainstorm items to TASK_BOARD labeled `[SIL]`

At session start, read `context/SELF_IMPROVEMENT_LOOP.md` and check if prior `[SIL]` commitments were actioned. If a `[SIL]` item has been skipped 2+ sessions, escalate it to **Now** on TASK_BOARD.

## Creative Direction Record (mandatory enforcement)

`docs/CREATIVE_DIRECTION_RECORD.md` is ADDITIVE ONLY.

**Agents MUST append an entry whenever the human provides:**
- Any creative direction (features, feel, scope)
- Feature assignments or explicit goals
- Brand, tone, visual, or quality guidance
- Canon-affecting decisions
- Explicit "do this / don't do this" instruction

**Agents MUST NOT:**
- Add CDR entries autonomously without human input
- Modify or delete existing CDR entries
- Skip CDR even for "small" directions — every human direction counts

## Studio Hub integration

This project is tracked in the VaultSpark Studio Hub at `vaultsparkstudios.com/studio-hub/`.
The hub reads `context/PROJECT_STATUS.json` from this repo via GitHub API.

For hub visibility, keep `context/PROJECT_STATUS.json` current with:
- `status` — incubating / active / live / maintained / archived
- `health` — green / yellow / red
- `currentFocus` — one-line description of active work
- `nextMilestone` — next concrete deliverable
- `blockers` — array of blocking items (empty if none)
- `lastUpdated` — ISO date of last update

## Active Session Beacon

To show an active session indicator in the Studio Hub, add these hooks to your `CLAUDE.md`:

```bash
# On session start — replace PROJECT_ID and GIST_ID:
gh gist edit GIST_ID -f active.json <<EOF
{"active":[{"project":"PROJECT_ID","agent":"claude-code","since":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}]}
EOF

# On session end:
gh gist edit GIST_ID -f active.json <<EOF
{"active":[]}
EOF
```

Get the Gist ID from Hub Settings → "Active Session Beacon — GitHub Gist ID".
Get PROJECT_ID from the project's `id` field in `src/data/studioRegistry.js`.

## Session aliases

If the user says only `start`, follow `prompts/start.md`.

If the user says only `closeout`, follow `prompts/closeout.md`.

## Escalate before changing

- canon
- public promises
- rights or provenance
- launch dates
- security or data handling
