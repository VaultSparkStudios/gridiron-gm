<!-- template-version: 2.0 -->
<!-- synced-from: studio-ops/prompts/closeout.md @ Session 19 (2026-03-28) -->
# Closeout Protocol

Use this when the user says only `closeout`.

---

## Step 0 — Session Intent Check

Before writing any files, compare the session's actual work against the declared intent logged in
`context/LATEST_HANDOFF.md` under `Session Intent:`. Classify the outcome:

- **Achieved** — worked as planned
- **Partial** — some scope drifted; note what and why
- **Redirected** — focus changed significantly; log the reason

This outcome is included in the closeout output and the `logs/WORK_LOG.md` entry.

---

## Required write-back

If meaningful work happened, update in this order:

1. `context/CURRENT_STATE.md`
2. `context/TASK_BOARD.md`
3. `context/LATEST_HANDOFF.md` — include **Where We Left Off** block (see below)
4. `logs/WORK_LOG.md`
5. `context/DECISIONS.md` — when reasoning changed
6. `context/SELF_IMPROVEMENT_LOOP.md` — MANDATORY (see below)
7. `docs/CREATIVE_DIRECTION_RECORD.md` — MANDATORY if human gave any creative direction this session
8. Any project-type or repo-specific files whose truth changed
9. **Delete `context/.session-lock`** — MANDATORY last step. Removing the lock signals to studio-ops and other cross-repo agents that this project is safe to write to again.

### Where We Left Off — write to LATEST_HANDOFF.md

At the top of `context/LATEST_HANDOFF.md`, maintain a `## Where We Left Off` block.
This is read directly into the startup brief next session.

```markdown
## Where We Left Off (Session N)
- Shipped: {N improvements across N groups — group1, group2 ...}
  {or: "N tasks completed" if no improvement group breakdown applies}
- Tests: {N passing (N core / N server / N client) · delta: +N this session}
  {or: "N/A — no test suite"}
- Deploy: {deployed to {env} / pending / N/A}
```

Rules:
- **Improvements / groups** — count concrete shipped items (features, fixes, improvements). Group by type (e.g. auth, content, DX, observability). Use whatever groups make sense for the project. If it was a process/protocol session with no shipped code, write "0 code changes — protocol/infra session."
- **Tests** — total passing count + breakdown by type if the project has a test suite. Delta = this session's total minus last session's total from the prior audit JSON. Write "N/A" for projects without test suites.
- **Deploy** — "deployed to {env}" if a deploy happened this session or was already live; "pending" if commit exists but deploy not confirmed; "N/A" for pre-deploy projects.

---

## Self-Improvement Loop — closeout (mandatory)

### Step 1 — Calculate rolling data (do this before scoring)

**Velocity count:**
Count TASK_BOARD items that moved from Now → Done this session.
Exclude `[SIL]` meta-tasks. Record as integer: `Velocity: N`

**Debt delta:**
- `↑` if net new `[DEBT]` items were added to TASK_BOARD this session
- `↓` if net `[DEBT]` items were resolved this session
- `→` if debt was unchanged or no `[DEBT]` items exist

**Rolling averages (3 / 5 / 10 / 25 / all):**
Look back at the SIL entries in `context/SELF_IMPROVEMENT_LOOP.md` and compute:

For each window (3, 5, 10, 25, all):
- **Total avg** = sum of Total scores in window / count — round to 1 decimal
- If fewer entries than the window size exist, use all available and mark with `[N=n]`
- Omit windows where N < 3 (not enough data to be meaningful)

For the **3-session window only**, also compute per-category averages:
- `Avg Dev Health` = (score1 + score2 + score3) / 3 — round to 1 decimal
- Same calculation for all 5 categories
- This is the only window with per-category breakdown (token efficiency)

**Sparkline:**
Collect the Total scores from the last 5 SIL entries (including this session). Map each to a bar:

| Range | Bar |
|---|---|
| 0–9 | ▁ |
| 10–19 | ▂ |
| 20–29 | ▃ |
| 30–34 | ▄ |
| 35–39 | ▅ |
| 40–44 | ▆ |
| 45–47 | ▇ |
| 48–50 | █ |

Write oldest → newest: e.g. `▃▅▆▇█`
If fewer than 5 sessions, use only available data.

---

### Step 2 — Overwrite the SIL Rolling Status header

The top of `context/SELF_IMPROVEMENT_LOOP.md` contains a `## Rolling Status` block between
`<!-- rolling-status-start -->` and `<!-- rolling-status-end -->` markers.
**Overwrite** this block (do not append) with fresh values:

```
<!-- rolling-status-start -->
## Rolling Status (auto-updated each closeout)
Sparkline (last 5 totals): ▃▅▆▇█
Avgs — 3: XX.X | 5: XX.X | 10: XX.X | 25: — | all: XX.X  (— = insufficient data)
  └ 3-session: Dev X.X | Align X.X | Momentum X.X | Engage X.X | Process X.X
Velocity trend: ↑↓→  |  Protocol velocity: ↑↓→  |  Debt: ↑↓→
Last session: YYYY-MM-DD | Session N | Total: XX/50 | Velocity: N | protocolVelocity: N
─────────────────────────────────────────────────────────────────────
<!-- rolling-status-end -->
```

---

### Step 3 — Score this session

Rate each category 0–10:

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | | ↑↓→ | code quality, CI, debt |
| Creative Alignment | | ↑↓→ | adherence to SOUL.md + CDR |
| Momentum | | ↑↓→ | velocity, milestone progress |
| Engagement | | ↑↓→ | community / user signals |
| Process Quality | | ↑↓→ | handoff freshness, Studio OS compliance |
| **Total** | **/ 50** | | |

---

### Step 3.5 — IGNIS note

After scoring, record one sentence for IGNIS to learn from this session.

**IGNIS note:** [What made this session distinctive, what would you do differently,
what pattern is emerging — one sentence max]

This is written into the `ignisNote` field of the audit JSON in Step 8.

---

### Step 3.6 — Momentum Runway (PROPOSAL-006, accepted 2026-03-27)

After scoring, compute the Momentum Runway estimate:

```
momentumRunway = open_Now_items / silAvg_velocity_last3
```

- Count open (incomplete) items currently in the `## Now` bucket of TASK_BOARD
- Use the rolling 3-session velocity average (from Step 1)
- If velocity average is 0 (architecture phase): write "N/A — architecture phase; pre-load TASK_BOARD recommended before next implementation sprint"
- If runway <= 2 sessions: **flag** — "Low momentum runway. Add items to Now before next session."

**Output:** "Momentum runway: ~N sessions at current velocity" (include in closeout summary)

This data does not go into the audit JSON — it is for the closeout summary and IGNIS synthesis only.

---

### Step 4 — Reflect

- **Top win this session:**
- **Top gap this session:**
- **Session intent outcome:** [Achieved / Partial / Redirected — one sentence reason]

---

### Step 4.5 — Human Action Required

Scan the full session for any items that require human (not agent) action before the next session
can proceed. This includes: external service setup (hosting, DNS, API keys, secrets), manual
approvals (affiliate programs, legal, app stores), financial actions, decisions only the Studio
Owner can make, or any "blocked on human" items discovered this session.

**If items exist:**
1. Write a `## Human Action Required` section in `context/LATEST_HANDOFF.md` listing each item
   with enough context to act on it immediately
2. Add items to `context/TASK_BOARD.md` under a `## Human Action Required` bucket (separate from
   `## Blocked` — blocked = agent-resolvable; human-required = only the Studio Owner can act)

**If no items exist:** write "No human action required this session." in the closeout output.

**Format for each item:**
```
- [ ] **{Item}** — {what is needed, who/where to do it, why it unblocks the project}
```

This step is **mandatory** — never skip by assuming no human-required items exist. Always confirm
explicitly either way.

---

### Step 5 — Brainstorm

Generate 3–5 innovative solutions, features, or improvements. Push past the obvious. Consider:
- What would make this 10x more engaging?
- What's the one thing players/users keep asking for?
- What technical debt is silently costing velocity?
- What creative direction has drifted from the SOUL?
- What competitive move would surprise and delight?

**Brainstorm item format (standardized — Session 9):**
Each brainstorm item must include:
1. **One-sentence synopsis** — what the idea is
2. **Implementation path** — concrete first step (one sentence)
3. **Execution probability** — High / Medium / Low (based on current phase and available time)

Items rated **Low** execution probability go to the **IGNIS Parking Lot** in `context/IGNIS_PROTOCOL.md` — not to TASK_BOARD. Items rated **High** or **Medium** are eligible for commitment.

**Infrastructure projects (Studio Ops, Studio Hub, etc.):** Dev-category items are Low by default unless execution path is clear within 2 sessions. Process/protocol items can be High/Medium.

---

### Step 6 — Commit

Pick 1–2 brainstorm items. Add them to `context/TASK_BOARD.md` labeled `[SIL]`.

---

### Step 7 — Append SIL entry (APPEND ONLY — never edit prior entries)

Use this exact format:

```markdown
## YYYY-MM-DD — Session N | Total: XX/50 | Velocity: N | Debt: →
Avgs — 3: XX.X | 5: XX.X | 10: XX.X | 25: — | all: XX.X
  └ 3-session: Dev X.X | Align X.X | Momentum X.X | Engage X.X | Process X.X

| Category | Score | vs Last | Notes |
|---|---|---|---|
| Dev Health | | ↑↓→ | |
| Creative Alignment | | ↑↓→ | |
| Momentum | | ↑↓→ | |
| Engagement | | ↑↓→ | |
| Process Quality | | ↑↓→ | |
| **Total** | **/50** | | |

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

### Step 8 — Write session audit record

Create `audits/YYYY-MM-DD.json`. If today's file already exists (multiple sessions in one day),
suffix with `-2`, `-3`, etc. (e.g. `audits/2026-03-26-2.json`).

This is the machine-readable complement to the Markdown SIL entry. It enables the Studio Hub
and Studio Review agent to aggregate scores programmatically without parsing Markdown.

```json
{
  "schemaVersion": "1.3",
  "project": "{slug from context/PROJECT_STATUS.json}",
  "date": "YYYY-MM-DD",
  "session": N,
  "sessionType": "implementation",
  "label": "{entry label, e.g. 'Bootstrap Baseline', or null}",
  "calibration": true,
  "scores": {
    "devHealth": N,
    "creativeAlignment": N,
    "momentum": N,
    "engagement": N,
    "processQuality": N
  },
  "total": N,
  "maxScore": 50,
  "velocity": N,
  "protocolVelocity": null,
  "durationMinutes": null,
  "debt": "→",
  "rollingAvg3": {
    "devHealth": null,
    "creativeAlignment": null,
    "momentum": null,
    "engagement": null,
    "processQuality": null,
    "total": null
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

Use `null` for any score that could not be assessed (bootstrap/calibration sessions).
Set `"calibration": false` once the project is past Session 3.

**ignisFlags** — choose from: `high-velocity`, `low-velocity`, `creative-drift`, `debt-spike`, `debt-clear`, `intent-achieved`, `intent-redirected`, `compacted-resume`, `cdr-gap-recovered`, `blocker-cleared`, `sil-escalation`. Leave `[]` if none apply.

**intentOutcome** — IGNIS Loop A tracks this field (PROPOSAL-011). Use: `"Achieved"` / `"Partial"` / `"Redirected"`. Be accurate — this feeds the `intentCompletionRate` metric. Also add `"intent-achieved"` or `"intent-redirected"` flag to `ignisFlags` accordingly.

**ignisNote** — the sentence written in Step 3.5. Copy it here verbatim.

**durationMinutes** — estimate the session duration in minutes based on context (number of files touched, complexity of work, conversation length). Ranges: short sprint = 30–45 min; focused session = 60–90 min; deep architecture session = 120–180 min; marathon = 180+. Use `null` if unable to estimate. (PROPOSAL-004, accepted 2026-03-27)

Also update `context/PROJECT_STATUS.json` SIL fields to match this session:
- `silScore` → this session's `total`
- `silAvg3` → `rollingAvg3.total` (or `null` during calibration)
- `silVelocity` → `velocity`
- `silDebt` → `debt`
- `silLastSession` → `date`

---

## Creative Direction Record — closeout (mandatory)

Review the full session for any human direction given. This step is required at every closeout.

**If this session was picked up from a prior compacted/interrupted session (i.e. the conversation
started with a summary rather than a fresh `start`), also review the summary for direction from
that prior session. CDR entries must be written for ALL human direction — not just the current
session window.**

Append an entry to `docs/CREATIVE_DIRECTION_RECORD.md` for each of the following that occurred:
- Creative direction of any kind (features, feel, scope, priorities)
- Feature assignments or explicit goals set by the human
- Brand, tone, visual, or quality guidance
- Canon-affecting decisions
- Any "do this / don't do this" instruction

**ADDITIVE ONLY — never edit or delete existing entries.**

If no direction was given this session, do not add a blank entry — simply confirm in the closeout
output that CDR was reviewed and no new entries were needed.

---

## Required closeout output

Reply with a concise `Session Closeout` containing:

1. **Intent outcome** — Achieved / Partial / Redirected (one sentence)
2. **Completed** — what was done
3. **Files changed**
4. **Validation status**
5. **SIL summary** — scores, rolling avg, sparkline, velocity, debt delta, top win, top gap, committed items
6. **CDR** — direction recorded or "no new entries"
7. **Open problems**
8. **Recommended next action**
9. **Read first next session** — exact file list in order
