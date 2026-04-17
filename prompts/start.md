<!-- template-version: 3.3 -->
<!-- synced-from: studio-ops/docs/SESSION_PROTOCOL.md § 1 @ Session 101 (2026-04-17) -->
<!-- v3.3 changes: token-lean start — context-meter first, startup brief ONLY (no raw file reads), LATEST_HANDOFF auto-trim at closeout -->
# START

Executed when the user says only `start`.

---

## 1 · Session Lock  *(mandatory first action)*

Write session lock via Bash (avoids Write tool "file not read" guard on new files):
```bash
echo "locked_by: agent-session
session_start: $(date -u +%Y-%m-%dT%H:%M:%SZ)
project: <slug>" > context/.session-lock
```
Overwrite if a stale lock exists. Lock is auto-cleared by the global Stop hook; also cleared manually at closeout.

**Active Session Beacon** *(runs if `.claude/beacon.env` exists — silently skips otherwise)*

```bash
[ -f .claude/beacon.env ] && source .claude/beacon.env && \
  printf '{"active":[{"project":"%s","agent":"claude-code","since":"%s"}]}' \
    "$BEACON_PROJECT_ID" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" | \
  gh gist edit "$BEACON_GIST_ID" -f active.json --filename active.json \
  2>/dev/null || true
```

Setup: create `.claude/beacon.env` (gitignored) with:
```
BEACON_GIST_ID=<gist-id-from-hub-settings>
BEACON_PROJECT_ID=<project-id-from-studioRegistry.js>
```
Get values from Hub Settings → "Active Session Beacon". The Stop hook clears the beacon on session end.

**Session mode (v3.1 — auto-detected):**

Run the mode detector immediately after the session lock:
```bash
node scripts/detect-session-mode.mjs --explain
```
It classifies the session as BUILDER (this-project) or FOUNDER (portfolio-wide) by heuristic on TASK_BOARD scope + LATEST_HANDOFF content + any passed-in user messages. If the classification would flip the current mode, it auto-updates `context/PROJECT_STATUS.json` → `sessionMode`. Re-run mid-session if the user issues a cross-project directive.

| Mode | Trigger | Focus |
|---|---|---|
| **BUILDER** | Default / single-project scope | This project only |
| **FOUNDER** | Detected: portfolio-wide scope, cross-project refs, `portfolio/STUDIO_BRAIN.md` or `STUDIO_PULSE.md` referenced | Cross-project strategy; read `portfolio/STUDIO_BRAIN.md` + `STUDIO_PULSE.md` first |

**v3.1 secrets discovery rule (mandatory):** Before labeling any item "Human Action Required" or "human-blocked", run:
```bash
node scripts/check-secrets.mjs --for <capability>
```
If the capability is READY, proceed autonomously using `scripts/lib/secrets.mjs` `getSecret(key, capability)`. The phantom-blocker pattern is forbidden.

**v3.2 blocker preflight rule (mandatory):** After secrets discovery, agents must try the blocker with elevated/admin access before leaving it as human-blocked:
```bash
node scripts/ops.mjs blocker-preflight
```
If the blocker is agent-attemptable, attempt it first. Human escalation is the last step, not the first.

---

## 2 · Initiation Type

Check `context/SELF_IMPROVEMENT_LOOP.md`:

| Condition | Type | Action |
|---|---|---|
| File missing or no dated entries | **A — Bootstrap** | Follow `prompts/initiate.md` — stop here |
| 1 "Bootstrap/Foundation Baseline" entry; core files still template-only | **B — Foundation** | Follow `prompts/initiate.md` §B — stop here |
| 2+ dated entries with real scores | **C — Returning** | Continue below |

---

## 3 · Context-meter preflight  *(v1.3 — runs BEFORE loading any files)*

```bash
node scripts/context-meter.mjs --json
```

- `CONTINUE` → proceed to step 4.
- `CONSIDER_CLOSEOUT` → warn: *"Context N% used before /start. Recommend fresh terminal."* Proceed only on explicit founder confirmation.
- `CLOSEOUT` → **stop immediately.** Show cached genius list from `.cache/genius-list.json` if available. Prompt for `/closeout`. This terminal is exhausted — no context files should be loaded.

---

## 4 · Initiation type check  *(lightweight)*

Check `context/SELF_IMPROVEMENT_LOOP.md` has ≥2 dated entries (`^## YYYY-MM-DD`) — grep only, do NOT read the full file:

| Condition | Action |
|---|---|
| File missing or 0–1 dated entries | Follow `prompts/initiate.md` — stop here |
| 2+ dated entries with real scores | Continue below |

---

## 5 · Load startup brief — SOLE CONTEXT SOURCE  *(v1.3)*

**Do NOT read raw context files at session start.** The startup brief synthesizes all of them.

```bash
node scripts/render-startup-brief.mjs   # skip if docs/STARTUP_BRIEF.md < 24h old
node scripts/validate-brief-format.mjs docs/STARTUP_BRIEF.md
```

- Validator exits 0 → read `docs/STARTUP_BRIEF.md` (~3K tokens). This synthesizes: PROJECT_BRIEF · SOUL · BRAIN · CURRENT_STATE · DECISIONS · TASK_BOARD · LATEST_HANDOFF · SIL rolling header · TRUTH_AUDIT · STUDIO_BRAIN (Founder Mode). **Do not read any of those raw files additionally.**
- Validator exits 1 → run `node scripts/ops.mjs onboard --repair --write`, re-render, re-validate.
- Renderer or brief missing → run `node scripts/ops.mjs onboard --repair --write` first.

Raw context files are available on-demand during work — they are not loaded at session start.

---

## 5.5 · SIL escalation check  *(from the brief — no extra reads)*

- Note sparkline trajectory and lowest SCORE block category.
- List unactioned `[SIL]` items from the brief's GENIUS HIT LIST block.
- Any `[SIL:2⛔]` item → escalate to top of sprint plan immediately.

---

## 5.6 · Startup rules

- **Raw context files are NOT read at startup.** The startup brief synthesizes them — load raw files on-demand only.
- **Context-meter runs first.** CLOSEOUT verdict = stop immediately, no exceptions.
- Repo files > chat memory. `PROJECT_STATUS.json` > derived Markdown.
- No code edits during startup unless the founder immediately requests one.
- `context/LATEST_HANDOFF.md` is the active handoff; all other handoff docs are historical.
- **Execution-first:** top action is in the brief's GENIUS HIT LIST — start there, don't re-diagnose.

---

## 6 · Output — Startup Brief  *(v3.3 visual format — canonical renderer MANDATORY)*

**MUST use the canonical renderer.** Do not improvise a prose brief. Steps:

1. Run `node scripts/render-startup-brief.mjs`. This writes `docs/STARTUP_BRIEF.md`.
2. Run `node scripts/validate-brief-format.mjs docs/STARTUP_BRIEF.md`.
3. Exit 0 → display the brief as-is to the user.
4. Exit 1 → brief has drifted. Run `node scripts/ops.mjs onboard --repair --write`, re-render, re-validate. Never display a non-conformant brief.
5. If `render-startup-brief.mjs` is missing → `ops onboard --repair --write` ships it.

Non-canonical sections (product-specific prose blocks like "Contradiction Sentinel", "Executive Focus", "Evidence Gaps", "Today" buckets) are **forbidden in the shared startup brief**. They belong in tool-specific surfaces. The box-drawing format (project title · WHERE WE LEFT OFF · SCORE · SIGNALS · HUMAN PRESSURE · GENIUS HIT LIST) is load-bearing for multi-agent continuity — Claude Code and Codex must both render the same format so sessions can hand off without losing signal.

The template below documents the canonical shape for reference only. **Do not hand-render it** — run the canonical renderer.

**Score bars:** `/100` categories → 20-char bar, 1 █ per 5 pts · `/500` total → 24-char bar, 1 █ per ~21 pts
**Trend arrows:** compare last session score vs 3-session avg: ↑ (+2 or more) · ↓ (−2 or more) · → (stable)

```
╔══════════════════════════════════════════════════════════════════╗
║  STARTUP BRIEF  ·  {Project Name}                               ║
║  {YYYY-MM-DD}  ·  Session {N}  ·  BUILDER MODE                  ║
║  {type}  ·  {lifecycle}/{audience}  ·  {owner}                  ║
╚══════════════════════════════════════════════════════════════════╝

╔══ SCORE ══════════════════════════════════════════════════════════╗
║                                                                    ║
║  {total}/500   ████████████████████████░░░░   {pct}%              ║
║  Trend  {sparkline}  {↑↓→}  ·  Avg3: {avg3}  ·  Days since: {N} ║
║                                                                    ║
║  Dev Health    {nn}  ████████████████████░░░  {↑↓→}              ║
║  Alignment     {nn}  ████████████████████░░░  {↑↓→}              ║
║  Momentum      {nn}  ████████████████░░░░░░░  {↑↓→}              ║
║  Engagement    {nn}  ████████████████████░░░  {↑↓→}              ║
║  Process Qual  {nn}  ████████████████████░░░  {↑↓→}              ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

╔══ WHERE WE LEFT OFF  ·  Session {N-1} ════════════════════════════╗
║  Shipped:  {N items across N groups — group1, group2}              ║
║  Tests:    {N passing · delta: ±N}  ·  Deploy: {status}           ║
╚════════════════════════════════════════════════════════════════════╝

╔══ SIGNALS ════════════════════════════════════════════════════════╗
║  {✓/⚠/⛔}  Tests        {N passing · delta ±N}                   ║
║  {✓/⚠/⛔}  Velocity     {N ↑↓→}  ·  Debt: {↑↓→}  Runway: {N.N} ║
║  {✓/⚠/⛔}  Context age  {N}d old                                  ║
║  {✓/⚠/⛔}  IGNIS        {score} {TIER}  ·  {N}d old              ║
║  {✓/⚠/⛔}  Truth        {status}  ·  Genome: {n}/25               ║
║  {✓/⚠}    Genome dims  {all stable / drop: dim X→Y}              ║
║  {✓/⚠/⛔}  Entropy      {score}  ({healthy/elevated/high})         ║
║  {✓/⚠}    CDR          {no gap / gap: N sessions}                 ║
║  {✓/⚠}    Templates    {v2.9 aligned / drift detected}            ║
║  {✓/⚠/⛔}  Revenue sig. {N}d old  {✓ fresh / ⚠ stale}            ║
╚════════════════════════════════════════════════════════════════════╝

╔══ PREDICTION  ·  SESSION_PLAN.md ════════════════════════════════╗  ← omit if > 48h
║  Session {N}:  {range}/500  {trend}  ·  Scope cap: {N} tasks     ║
╚════════════════════════════════════════════════════════════════════╝

╔══ GENIUS HIT LIST  ·  Session {N} ════════════════════════════════╗
║  Fresh synthesis · all categories · ranked by impact              ║
║                                                                    ║
║  🔥 1  [CAT]  {title}                                             ║
║         {one-line rationale}                                       ║
║         ↳ {command if applicable}                                  ║
║                                                                    ║
║  ⚡ 2  [CAT]  {title}                                             ║
║  ...                                                               ║
╚════════════════════════════════════════════════════════════════════╝
```

*(Followed by IGNIS INSIGHT and CANON CHECK as plain text below the box)*

### Brief sources  *(all from files already loaded — no extra reads)*

| Field | Source |
|---|---|
| Score bar · per-category bars · sparkline · Avgs | `SELF_IMPROVEMENT_LOOP.md` Rolling Status header + last entry scores |
| Days since | `Last session:` date vs today |
| IGNIS score | `context/PROJECT_STATUS.json` → `ignisScore`, `ignisGrade`, `ignisLastComputed` |
| Truth / Genome | `context/TRUTH_AUDIT.md` → `context/PROJECT_STATUS.json` |
| Context age | `Last updated:` in `context/CURRENT_STATE.md` vs today |
| CDR Gap | Last `YYYY-MM-DD` entry in `docs/CREATIVE_DIRECTION_RECORD.md` vs `Last updated:` in `context/LATEST_HANDOFF.md` |
| Templates | Compare `template-version:` in `prompts/start.md` vs `START_PROMPT.template.md` |
| Revenue signals | `Generated:` date in `portfolio/REVENUE_SIGNALS.md` vs today |
| Prediction | `docs/SESSION_PLAN.md` `generated-at` comment; include only if < 48h old |
| Genius Hit List | `docs/GENIUS_LIST.md` if present; else call `scripts/generate-genius-list.mjs --brief` |

**Signal thresholds:**
- Tests: ✓ passing + delta ≥0 · ⚠ delta <0 · ⛔ failing
- Velocity: ✓ ≥2 · ⚠ 1 · ⛔ 0
- Runway: ✓ >4 · ⚠ 2–4 · ⛔ ≤2
- Context age: ✓ ≤7d · ⚠ 8–14d · ⛔ >14d
- IGNIS: ✓ <7d · ⚠ 7–14d · ⛔ >14d  ← re-score via `node ../vaultspark-studio-ops/scripts/ops.mjs rescore`
- Genome dims: ✓ no drops vs prior snapshot · ⚠ any dimension dropped
- Entropy: ✓ <0.3 (healthy) · ⚠ 0.3–0.6 (elevated) · ⛔ >0.6 (high)
- CDR Gap: ✓ last CDR date ≥ LATEST_HANDOFF date · ⚠ CDR predates LATEST_HANDOFF
- Templates: ✓ versions match · ⚠ drift
- Revenue: ✓ ≤7d · ⚠ 8–14d · ⛔ >14d

**IGNIS INSIGHT:** Read project section in `portfolio/IGNIS_CORE.md`. One synthesised observation. Label stale if `ignisLastComputed` older than IGNIS_CORE.md. Write `UNTRACKED` if no entry.

**CANON CHECK:** `docs/STUDIO_CANON.md` — at most 1–2 relevant decisions. Omit if no protocol work planned.

---

## 7 · Session Intent

If the user did not provide a session goal, ask:

> **"What is the primary goal for this session?"** (one sentence)

Log the declared intent in `context/LATEST_HANDOFF.md` under `Session Intent:`.

**Scope check** — immediately after logging intent:
- Count open Now items + work implied by the declared intent
- Compare to avg velocity in Rolling Status header
- Compute **sessionScopeCap** = `floor(lastVelocity × 1.5)` where `lastVelocity` = `Velocity: N` from Rolling Status header
- If declared scope > 2× recent avg velocity → flag: "⚠ Scope may exceed one session (velocity avg: {N}). Consider splitting or tracking as partial intent."
- If declared scope items > sessionScopeCap → note: "Scope cap: {cap} items. Items beyond cap: {list — lowest priority first}. Recommend deferring to Next or a follow-up session."
- If avg velocity = 0 → note: "No recent velocity baseline — scope is uncertain; track partial completion explicitly."
