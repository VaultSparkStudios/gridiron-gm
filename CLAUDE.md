# Studio OS — Agent Instructions

This project is **Gridiron GM** and runs on the VaultSpark Studio OS.
Type: game

## Session aliases (mandatory)

When the user says only `start`, read and execute `prompts/start.md` exactly.
When the user says only `closeout`, read and execute `prompts/closeout.md` exactly.

Do NOT ask "what would you like to work on" — execute the prompt.

## Required reading

@AGENTS.md

## Project structure

- `context/` — Live project state (CURRENT_STATE, TASK_BOARD, LATEST_HANDOFF, etc.)
- `prompts/` — Session protocols (start, closeout)
- `audits/` — Session audit JSONs

## Build and test

- Build: N/A — browser game
- Test: N/A — no test suite

## Key rules

- Never edit prior entries in DECISIONS.md, SELF_IMPROVEMENT_LOOP.md, or CREATIVE_DIRECTION_RECORD.md — append only
- LATEST_HANDOFF.md is the authoritative handoff source
- context/PROJECT_STATUS.json must stay current — Studio Hub reads it via GitHub API
