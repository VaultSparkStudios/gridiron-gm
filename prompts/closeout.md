<!-- template-version: 2.5 -->
<!-- synced-from: studio-ops/prompts/closeout.md @ Session 58 (2026-04-12) -->
# CLOSEOUT

Executed when the user says only `closeout`.

---

## Step 0 · Intent Check

Compare actual work to the declared intent in `context/LATEST_HANDOFF.md → Session Intent:`.

Classify: **Achieved** · **Partial** *(note scope drift)* · **Redirected** *(log reason)*

**Bypass audit:** If any commit this session bypassed safety hooks (`--no-verify`, `--no-gpg-sign`), log in `context/DECISIONS.md`: date · what hook was bypassed · reason · follow-up task to fix root cause. Add that follow-up to `context/TASK_BOARD.md` under Now. Normalizing hook bypasses erodes the safety net.

---

## Write-Back Order  *(if meaningful work happened)*

1. `context/CURRENT_STATE.md`
2. `context/TASK_BOARD.md`
3. `context/LATEST_HANDOFF.md` — include **Where We Left Off** block
4. `logs/WORK_LOG.md`
5. `context/DECISIONS.md` — when reasoning changed
6. `context/SELF_IMPROVEMENT_LOOP.md` — **mandatory**
7. `docs/CREATIVE_DIRECTION_RECORD.md` — **mandatory if human gave creative direction**
8. `context/TRUTH_AUDIT.md` — when source-of-truth, schemas, prompts/templates, or derived surfaces changed
9. Any repo-specific files whose truth changed
10. **Delete `context/.session-lock`** — mandatory last step

### Where We Left Off  *(write to top of LATEST_HANDOFF.md)*

```markdown
## Where We Left Off (Session N)
- Shipped: {N improvements across N groups — group1, group2 ...}
- Tests: {N passing (N core / N server / N client) · delta: +N}  or  N/A
- Deploy: {deployed to {env} / pending / N/A}
```

Count concrete shipped items and group by type (auth, content, DX, observability, etc.). If protocol/infra only: "0 code changes — protocol/infra session." Tests delta = this session total minus prior session total. Deploy: "deployed to {env}" if live, "pending" if committed but unconfirmed, "N/A" if pre-deploy.

---

## Self-Improvement Loop

> **Protocol closeout shortcut** — use when all three are true: velocity = 0 AND no human creative direction AND no schema/template changes
> - **Step 5** (Brainstorm): 1 idea minimum instead of 3–5
> - **Step 8** (Audit JSON): optional — note "audit JSON skipped — protocol-only session" in output
> - **Step 8.5** (IGNIS): may be skipped — note "IGNIS score not refreshed — protocol-only session"
>
> Full closeout is required for all other sessions. When in doubt, use the full path.

---

### Step 1 · Rolling Data  *(calculate before scoring)*

**Velocity:** Count Now → Done tasks this session. Exclude `[SIL]` meta-tasks. → integer `Velocity: N`

**Debt delta:** `↑` net new `[DEBT]` added · `↓` net resolved · `→` unchanged or none

**Rolling averages** — look back at SIL entries in `context/SELF_IMPROVEMENT_LOOP.md`:

| Window | Compute |
|---|---|
| 3 / 5 / 10 / 25 / all | `sum(Total scores in window) / count` — 1 decimal. Mark `[N=n]` if insufficient entries. Omit windows where N < 3. |
| 3-session only | Also compute per-category avgs: Dev · Align · Momentum · Engage · Process |

**Sparkline** — map last 5 totals (oldest → newest) using: `▁ <100` · `▂ <200` · `▃ <300` · `▄ <350` · `▅ <400` · `▆ <450` · `▇ <480` · `█ 480–500`

---

### Step 2 · Overwrite Rolling Status Header

Overwrite the block between `<!-- rolling-status-start -->` and `<!-- rolling-status-end -->` markers in `context/SELF_IMPROVEMENT_LOOP.md`:

```
<!-- rolling-status-start -->
## Rolling Status (auto-updated each closeout)
Sparkline (last 5 totals): ▃▅▆▇█
Avgs — 3: XXX.X | 5: XXX.X | 10: XXX.X | 25: — | all: XXX.X
  └ 3-session: Dev XX.X | Align XX.X | Momentum XX.X | Engage XX.X | Process XX.X
Velocity trend: ↑↓→  |  Protocol velocity: ↑↓→  |  Debt: ↑↓→
Momentum runway: ~N.N sessions  |  Intent rate: NN% (last 5)
Last session: YYYY-MM-DD | Session N | Total: XXX/500 | Velocity: N | protocolVelocity: N
─────────────────────────────────────────────────────────────────────
<!-- rolling-status-end -->
```

---

### Step 3 · Score This Session  *(0–100 per category)*

#### Dev Health /100
| Sub-score | Max | Measures |
|---|---:|---|
| CI / Test Status | 30 | Workflows green; tests passing; delta ≥0 |
| Technical Debt | 20 | Debt trending ↓; known issues being addressed |
| Architecture Quality | 30 | Clean structure, intentional abstractions. Infra: protocol structure + schema coherence |
| Data Integrity | 20 | Schemas valid; machine-readable files current; no stale derived surfaces |

#### Creative Alignment /100
| Sub-score | Max | Measures |
|---|---:|---|
| Soul Fidelity | 30 | Session work matches SOUL.md; creative identity intact |
| CDR Compliance | 20 | All human creative directions captured in CDR |
| Direction Clarity | 20 | Vision clear enough to guide future agents without human input |
| Ecosystem Contribution | 30 | Work benefits multiple projects/portfolio. Studio Ops: template propagation, compliance rollouts |

#### Momentum /100
| Sub-score | Max | Measures |
|---|---:|---|
| Velocity | 30 | Meaningful tasks completed; task board moving |
| Intent Completion | 30 | % of declared session intents achieved |
| Blocker Resolution | 20 | Net blocker delta (resolved − created) |
| Direction Progress | 20 | Getting closer to next milestone; strategic direction preserved |

#### Engagement /100

**Infrastructure** (`infrastructure` / `internal-ops`):
| Sub-score | Max | Measures |
|---|---:|---|
| Session Frequency | 25 | How often is the Studio Owner active in this project? |
| Proposal Acceptance Rate | 25 | % of agent proposals/brainstorm items accepted |
| Output Consumption | 25 | Are STUDIO_BRAIN / IGNIS_CORE being read and acted on? |
| Feedback Loop Health | 25 | Brainstorm items reviewed; CDR entry rate; decisions logged |

**Product** (games, apps, live products):
| Sub-score | Max | Measures |
|---|---:|---|
| Stakeholder Velocity | 25 | Growth rate, retention, activation |
| Community Engagement | 25 | Feedback quality, response rate, content engagement |
| Feedback Incorporation | 25 | % of user feedback acted on |
| Feedback Loop Health | 25 | Issue response rate; CDR activity; proposal acceptance |

#### Process Quality /100
| Sub-score | Max | Measures |
|---|---:|---|
| Handoff Continuity | 20 | LATEST_HANDOFF accurate; intent logged + resolved; cold-start ready |
| Studio OS Compliance | 15 | Required files present; prompts at canonical version; no enforcer violations |
| Context Freshness | 20 | CURRENT_STATE, TASK_BOARD, LATEST_HANDOFF updated and accurate this session |
| Documentation Coherence | 20 | SOUL/BRAIN/PROJECT_BRIEF semantically accurate AND actively consulted — not just present |
| Intelligence Fidelity | 20 | IGNIS current; truth audit green; founder surfaces accurate; contradictions ≤0 |
| CDR Accuracy | 5 | All human directions captured; no CDR gaps from prior sessions |

#### Score Table

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | | ↑↓→ | |
| Creative Alignment | | ↑↓→ | |
| Momentum | | ↑↓→ | |
| Engagement | | ↑↓→ | |
| Process Quality | | ↑↓→ | |
| **Total** | **/500** | | |

---

### Step 3.5 · IGNIS Note

One sentence — what made this session distinctive, what you'd do differently, what pattern is emerging. Copied verbatim into the audit JSON `ignisNote` field (Step 8).

---

### Step 3.6 · Momentum Runway

```
momentumRunway = open_Now_items / silAvg_velocity_last3
```

- Velocity avg = 0 → write "N/A — architecture phase; pre-load TASK_BOARD recommended"
- Runway ≤ 2 → flag: "Low momentum runway. Add items to Now before next session."

**Intent completion rate:** `count(intentOutcome == "Achieved") / last-5 sessions` → flag if < 70%.

Write both into the Rolling Status header (Step 2).

---

### Step 4 · Reflect

- **Top win this session:**
- **Top gap this session:**
- **Intent outcome:** Achieved / Partial / Redirected — brief reason

---

### Step 4.5 · Human Action Required  *(mandatory — never skip)*

Scan the full session for items only the Studio Owner can resolve: external service setup, manual approvals, financial actions, legal, decisions only the human can make.

**If items exist:** write a `## Human Action Required` section in `context/LATEST_HANDOFF.md` and add to `context/TASK_BOARD.md` under `## Human Action Required` (separate from `## Blocked` — blocked = agent-resolvable).

**If none:** confirm "No human action required this session." in closeout output.

```
- [ ] **{Item}** — {what's needed · where/how to do it · why it unblocks the project}
```

---

### Step 4.6 · Truth Audit Refresh

If this session changed `PROJECT_STATUS.json`, registry JSON, derived founder-facing Markdown, prompts/templates, or any contradiction from the prior truth audit — update `context/TRUTH_AUDIT.md`:

- `Last reviewed` · `Overall status` · `Protocol Genome` · `Drift Heatmap` · `Recommended Actions`

Also update `context/PROJECT_STATUS.json`: `truthAuditStatus` + `truthAuditLastRun`.

---

### Step 4.7 · Next-Session Pre-load  *(mandatory)*

Ensure the next session starts with a ready runway:

1. Count open (unchecked) items in `## Now` after marking this session's completions.
2. If fewer than 2 items remain in Now → move 2–3 actionable, unblocked items from `## Next` into `## Now`.
3. If fewer than 2 items remain in Next → pull from `## Later`.
4. Target: **Now bucket has ≥ 2 items at closeout.** Never leave it empty.

*Rationale:* An empty Now bucket causes cold starts — the next session wastes its first moves on pre-loading. This step takes < 2 minutes and eliminates that tax.

---

### Step 5 · Brainstorm

Generate 3–5 innovative solutions, features, or improvements. Push past the obvious. Consider: what makes this 10× more useful? What technical debt is costing velocity? What's drifting from SOUL?

Each item must include:
1. **One-sentence synopsis**
2. **Implementation path** — concrete first step (one sentence)
3. **Execution probability** — High / Medium / Low

> Low probability → **IGNIS Parking Lot** in `context/IGNIS_PROTOCOL.md` — not TASK_BOARD.
> Infrastructure projects: Dev-category items are Low by default unless path is clear within 2 sessions.

---

### Step 6 · Commit

Pick 1–2 brainstorm items. Add to `context/TASK_BOARD.md` labeled `[SIL]`.

**[SIL:N] skip counter protocol:**
- New items are added as `[SIL]` (no suffix = 0 skips)
- At each closeout: for every unactioned `[SIL]` item still in Now or Next, increment its counter — `[SIL]` → `[SIL:1]` → `[SIL:2⛔]`
- Items in `## Blocked` or explicitly noted as externally blocked are exempt from incrementing
- `[SIL:2⛔]` items **must** be moved to Now at next session start (Step 4 escalation check)

---

### Step 7 · Append SIL Entry  *(append-only — never edit prior entries)*

```markdown
## YYYY-MM-DD — Session N | Total: XXX/500 | Velocity: N | Debt: →
Avgs — 3: XXX.X | 5: XXX.X | 10: XXX.X | 25: — | all: XXX.X
  └ 3-session: Dev XX.X | Align XX.X | Momentum XX.X | Engage XX.X | Process XX.X

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | | ↑↓→ | |
| Creative Alignment | | ↑↓→ | |
| Momentum | | ↑↓→ | |
| Engagement | | ↑↓→ | |
| Process Quality | | ↑↓→ | |
| **Total** | **/500** | | |

**Top win:** [one sentence]
**Top gap:** [one sentence]
**Intent outcome:** [Achieved / Partial / Redirected — brief reason]

**Brainstorm**
1. [idea]
2. [idea]
3. [idea]

**Committed to TASK_BOARD:** [SIL item 1] · [SIL item 2]
```

---

### Step 8 · Write Audit JSON

Create `audits/YYYY-MM-DD.json`. Multiple sessions same day: suffix `-2`, `-3`, etc.

```json
{
  "schemaVersion": "1.3",
  "project": "{slug}",
  "date": "YYYY-MM-DD",
  "session": N,
  "sessionType": "implementation",
  "label": null,
  "calibration": false,
  "scores": {
    "devHealth": N, "creativeAlignment": N, "momentum": N,
    "engagement": N, "processQuality": N
  },
  "total": N,
  "maxScore": 500,
  "velocity": N,
  "protocolVelocity": null,
  "durationMinutes": null,
  "debt": "→",
  "rollingAvg3": {
    "devHealth": null, "creativeAlignment": null, "momentum": null,
    "engagement": null, "processQuality": null, "total": null
  },
  "rollingAvgTotals": { "3": null, "5": null, "10": null, "25": null, "all": null },
  "topWin": "...",
  "topGap": "...",
  "intentOutcome": "Achieved",
  "improvementsShipped": null,
  "improvementGroups": {},
  "testsTotal": null,
  "testsByType": {},
  "testsDelta": null,
  "deployStatus": "not-applicable",
  "ignisFlags": [],
  "ignisNote": null
}
```

**Field notes:**
- `calibration`: `true` for sessions 1–3; `false` thereafter. Use `null` for unassessable scores during calibration.
- `ignisFlags`: `high-velocity` · `low-velocity` · `creative-drift` · `debt-spike` · `debt-clear` · `intent-achieved` · `intent-redirected` · `compacted-resume` · `cdr-gap-recovered` · `blocker-cleared` · `sil-escalation`
- `intentOutcome`: `"Achieved"` / `"Partial"` / `"Redirected"` — add matching flag to `ignisFlags`
- `durationMinutes`: short sprint 30–45 · focused 60–90 · deep architecture 120–180 · marathon 180+
- `ignisNote`: copy from Step 3.5 verbatim

**Also update `context/PROJECT_STATUS.json`:** `silScore` · `silAvg3` · `silVelocity` · `silDebt` · `silLastSession` · `currentSession` (increment by 1)

---

### Step 8.5 · IGNIS Score Refresh  *(mandatory when SIL total changed ≥10 pts or protocol files changed)*

Refresh this project's IGNIS score so `ignisScore` never goes stale after a meaningful session.

```bash
# From IGNIS repo root (adjust path as needed):
npx tsx "<ignis-local-path>/cli.ts" score "<project-local-path>"
```

After running:
- Update `context/PROJECT_STATUS.json` → `ignisScore`, `ignisGrade`, `ignisLastComputed` if the score changed.
- If score changed by ≥500 IQ points, note it in the closeout output and in the SIL entry brainstorm.

**Skip this step if:** IGNIS repo unavailable (CI/remote), or velocity = 0 AND no protocol edits AND SIL total unchanged vs prior session. Do NOT skip when SIL total changed ≥10 pts — IGNIS reads the SIL score. Note "IGNIS score not refreshed — [reason]" in closeout output when skipped.

---

## Creative Direction Record  *(mandatory)*

Review the full session for any human direction. If resuming from a compacted/interrupted session, also review the prior session summary — CDR must cover ALL sessions.

Append to `docs/CREATIVE_DIRECTION_RECORD.md` for any: creative direction (features, feel, scope, priorities), brand/tone/quality guidance, canon-affecting decisions, or explicit "do/don't do this" instructions.

**ADDITIVE ONLY — never edit or delete existing entries.**

No direction this session → confirm "CDR reviewed — no new entries" in closeout output.

---

## Closeout Output

Reply with a concise **Session Closeout** containing:

1. **Intent outcome** — Achieved / Partial / Redirected + one sentence
2. **Completed** — what was done
3. **Files changed**
4. **Validation status**
5. **SIL summary** — scores, rolling avg, sparkline, velocity, debt, top win, top gap, committed items
6. **CDR** — direction recorded or "no new entries"
7. **Open problems**
8. **Recommended next action**
9. **Read first next session** — file list in order
