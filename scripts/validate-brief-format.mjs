#!/usr/bin/env node
/**
 * validate-brief-format.mjs — canonical-format gate for docs/STARTUP_BRIEF.md (S87).
 *
 * Why this exists:
 *   Studio OS briefs must have a consistent canonical format across all 27 repos
 *   so that both Claude Code and Codex can hand off to each other mid-project
 *   without losing multi-agent continuity signal. A MindFrame Codex session (2026-04-16)
 *   improvised a prose brief with sections like "Contradiction Sentinel" and
 *   "Executive Focus", skipped the canonical box-drawing SCORE / SIGNALS /
 *   GENIUS HIT LIST blocks, and re-introduced deprecated "Now / Today" buckets.
 *   This validator catches that class of drift at every /start and in CI.
 *
 * What it checks:
 *   1. Required canonical block headers are present (box-drawing format).
 *   2. Deprecated bucket markers (Now / Next / Blocked / Today as headings) are absent.
 *   3. Known-drift non-canonical section headers (MindFrame-style prose) are absent.
 *
 * Usage:
 *   node scripts/validate-brief-format.mjs                     # default path docs/STARTUP_BRIEF.md
 *   node scripts/validate-brief-format.mjs <path>              # custom path
 *   node scripts/validate-brief-format.mjs --json              # JSON output
 *   node scripts/validate-brief-format.mjs --stdin             # read from stdin
 *
 * Exit codes:
 *   0 — conformant
 *   1 — drift detected (specific issues listed)
 *   2 — file missing / unreadable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IS_DIRECT_RUN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const STDIN_MODE = args.includes('--stdin');
const positional = args.filter((a) => !a.startsWith('--'));
const targetPath = positional[0] || path.join(ROOT, 'docs', 'STARTUP_BRIEF.md');

// ── Canonical blocks that MUST appear ───────────────────────────────────────
// Each entry: { label, pattern, severity }
// Severity: 'required' — brief is non-conformant if missing.
//           'recommended' — logged as warning but not a fail.
const REQUIRED_BLOCKS = [
  {
    label: 'SCORE box',
    pattern: /╔══\s*SCORE\s*═/,
    severity: 'required',
  },
  {
    label: 'SIGNALS box',
    pattern: /╔══\s*SIGNALS\s*═/,
    severity: 'required',
  },
  {
    label: 'WHERE WE LEFT OFF block',
    pattern: /╔══\s*WHERE WE LEFT OFF/,
    severity: 'required',
  },
  {
    label: 'GENIUS HIT LIST box',
    pattern: /╔═+\s*GENIUS HIT LIST|║\s*GENIUS HIT LIST/,
    severity: 'required',
  },
  {
    label: 'Project title header (Studio OS box)',
    pattern: /╔═+╗[\s\S]{0,400}?FORGE|SPARKED|VAULTED/,
    severity: 'recommended',
  },
  {
    label: 'HUMAN PRESSURE block',
    pattern: /╔══\s*HUMAN PRESSURE/,
    severity: 'recommended',
  },
];

// ── Drift markers that MUST NOT appear ──────────────────────────────────────
// Deprecated since S81 (unified genius list is the sole recommendation surface)
// plus known non-canonical MindFrame-style prose sections.
const FORBIDDEN_PATTERNS = [
  {
    label: 'Deprecated "Now bucket" heading',
    pattern: /^##\s+Now\s+[Bb]ucket\s*$/m,
    reason: 'Deprecated since S81 — Unified Genius List replaces Now/Next/Blocked buckets.',
  },
  {
    label: 'Deprecated "Next bucket" heading',
    pattern: /^##\s+Next\s+[Bb]ucket\s*$/m,
    reason: 'Deprecated since S81 — Unified Genius List replaces Now/Next/Blocked buckets.',
  },
  {
    label: 'Deprecated "Today" bucket heading',
    pattern: /^##\s+Today\s*$/m,
    reason: 'Never a canonical bucket — improvised by non-studio-ops agents.',
  },
  {
    label: 'Non-canonical "Contradiction Sentinel" section',
    pattern: /^##\s+Contradiction\s+Sentinel\s*$/mi,
    reason: 'MindFrame product concept — not a Studio OS brief section. Canonical brief uses SIGNALS + GENIUS HIT LIST.',
  },
  {
    label: 'Non-canonical "Executive Focus" section',
    pattern: /^##\s+Executive\s+Focus\s*$/mi,
    reason: 'Non-canonical prose — canonical brief uses WHERE WE LEFT OFF + GENIUS HIT LIST.',
  },
  {
    label: 'Non-canonical "Evidence Gaps" section',
    pattern: /^##\s+Evidence\s+Gaps\s*$/mi,
    reason: 'Non-canonical — canonical brief uses SIGNALS block for data-quality flags.',
  },
  {
    label: 'Non-canonical "Decision Memory" section',
    pattern: /^##\s+Decision\s+Memory\s*$/mi,
    reason: 'Non-canonical — canonical brief uses WHERE WE LEFT OFF + SIGNALS, and memory lives in ~/.claude/projects/ (Claude) or ~/.codex/memories/ (Codex).',
  },
  {
    label: 'Non-canonical "Leverage" top-level section',
    pattern: /^##\s+Leverage\s*$/mi,
    reason: 'Non-canonical prose — if present as H2 alone. Leverage signal belongs inside GENIUS HIT LIST ranking, not a separate section.',
  },
];

// ── Body check: must look like a box-drawing brief, not raw prose ───────────
function looksLikeBoxBrief(body) {
  const boxChars = (body.match(/[╔╗╚╝║═╠╣]/g) || []).length;
  return boxChars >= 40; // any real rendered brief has hundreds of box chars
}

export function validateStartupBrief(body) {
  const findings = {
    missingRequired: [],
    missingRecommended: [],
    forbiddenHits: [],
    bodyShape: null,
  };

  for (const block of REQUIRED_BLOCKS) {
    if (!block.pattern.test(body)) {
      if (block.severity === 'required') {
        findings.missingRequired.push(block.label);
      } else {
        findings.missingRecommended.push(block.label);
      }
    }
  }

  for (const forbid of FORBIDDEN_PATTERNS) {
    if (forbid.pattern.test(body)) {
      findings.forbiddenHits.push({ label: forbid.label, reason: forbid.reason });
    }
  }

  if (!looksLikeBoxBrief(body)) {
    findings.bodyShape = 'brief does not contain box-drawing characters — likely an improvised prose brief rather than the canonical renderer output';
  }

  return {
    ok: findings.missingRequired.length === 0
      && findings.forbiddenHits.length === 0
      && findings.bodyShape === null,
    ...findings,
  };
}

async function readTarget() {
  if (STDIN_MODE) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      process.stdin.on('data', (c) => chunks.push(c));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      process.stdin.on('error', reject);
    });
  }
  if (!fs.existsSync(targetPath)) {
    throw new Error(`brief not found: ${targetPath}`);
  }
  return fs.readFileSync(targetPath, 'utf8');
}

if (IS_DIRECT_RUN) {
  let body;
  try {
    body = await readTarget();
  } catch (err) {
    if (JSON_MODE) {
      process.stdout.write(JSON.stringify({ ok: false, error: err.message, source: targetPath }, null, 2) + '\n');
    } else {
      console.error(`✗ ${err.message}`);
    }
    process.exit(2);
  }

  const result = validateStartupBrief(body);
  const fail = !result.ok;

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({
      ok: result.ok,
      source: STDIN_MODE ? '<stdin>' : targetPath,
      missingRequired: result.missingRequired,
      missingRecommended: result.missingRecommended,
      forbiddenHits: result.forbiddenHits,
      bodyShape: result.bodyShape,
    }, null, 2) + '\n');
  } else {
    const header = `validate-brief-format · ${STDIN_MODE ? '<stdin>' : path.relative(process.cwd(), targetPath)}`;
    console.log(header);
    console.log('─'.repeat(Math.min(72, header.length + 8)));
    if (result.bodyShape) {
      console.log(`  ⛔  ${result.bodyShape}`);
    }
    if (result.missingRequired.length > 0) {
      console.log(`  ⛔  missing required blocks:`);
      for (const m of result.missingRequired) console.log(`       - ${m}`);
    }
    if (result.missingRecommended.length > 0) {
      console.log(`  ⚠   missing recommended blocks:`);
      for (const m of result.missingRecommended) console.log(`       - ${m}`);
    }
    if (result.forbiddenHits.length > 0) {
      console.log(`  ⛔  drift markers present (must be removed):`);
      for (const h of result.forbiddenHits) {
        console.log(`       - ${h.label}`);
        console.log(`         reason: ${h.reason}`);
      }
    }
    if (!fail) {
      console.log(`  ✓   conformant — all required canonical blocks present, no drift markers`);
    } else {
      console.log('');
      console.log(`  Repair path: node scripts/ops.mjs onboard --repair --write`);
      console.log(`  Then re-render: node scripts/render-startup-brief.mjs`);
    }
    console.log('');
  }

  process.exit(fail ? 1 : 0);
}
