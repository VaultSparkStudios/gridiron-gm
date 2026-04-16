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

