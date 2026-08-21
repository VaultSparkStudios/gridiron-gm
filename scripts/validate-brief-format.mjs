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
    staleBrief: null,
  };

  // S142 audit item 2 — brief integrity self-assertion. The renderer stamps
  // `<!-- brief-coherent: true|false -->` after a three-way check (SIL log vs
  // PROJECT_STATUS vs rendered headline). false → the brief is showing stale or
  // unparseable state and /start must NOT proceed on it.
  const coherentMatch = body.match(/<!--\s*brief-coherent:\s*(true|false)\s*-->/i);
  if (coherentMatch && coherentMatch[1].toLowerCase() === 'false') {
    findings.staleBrief = 'brief-coherent: false — renderer detected stale/unparseable SIL state (see ⛔ STALE BRIEF banner). Re-render before /start.';
  }

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
      && findings.bodyShape === null
      && findings.staleBrief === null,
    ...findings,
  };
}

// ── S154 audit #4 ([SIL:2 S150 #2]) — per-tile byte budgets ─────────────────
// Bloat must fail at the SOURCE tile, not only at total brief size. Budgets
// sized from healthy S153 measurements + headroom. Tiles not listed get the
// default. Shared by render-startup-brief.mjs (trim at write time) and this
// validator (report) so producer and gate cannot drift (S153 lesson).
export const TILE_BUDGETS = {
  'GENIUS HIT LIST': 3200,   // measured 2.5KB healthy — the #1 bloat magnet
  'SCORE': 2500,             // measured 2.26KB
  'SIGNALS': 1800,           // measured 1.53KB
  'ORCHESTRATOR': 1100,
  'PORTFOLIO TASK BOARDS': 900,
  'IGNIS INSIGHT': 1100,
  'FOUNDER UNLOCKS': 700,
  'ROUTER SUGGESTS': 600,
  'SIL CATEGORY GAPS': 900,
  DEFAULT: 1400,
};

export function tileBudgetFor(title) {
  // GENIUS box renders its title on line 2 → briefBlockSizes sees UNTITLED.
  if (title === 'UNTITLED') return TILE_BUDGETS['GENIUS HIT LIST'];
  const key = Object.keys(TILE_BUDGETS).find(k => k !== 'DEFAULT' && title.toUpperCase().startsWith(k));
  return key ? TILE_BUDGETS[key] : TILE_BUDGETS.DEFAULT;
}

/**
 * Check every box-drawing tile against its budget.
 * Returns { overBudget: [{title, bytes, budget, pct}], worst }.
 */
export function checkTileBudgets(body) {
  const overBudget = [];
  for (const b of briefBlockSizes(body)) {
    const budget = tileBudgetFor(b.title);
    if (b.bytes > budget) {
      overBudget.push({ title: b.title, bytes: b.bytes, budget, pct: Math.round((b.bytes / budget) * 100) });
    }
  }
  overBudget.sort((a, b) => b.pct - a.pct);
  return { overBudget, worst: overBudget[0] || null };
}

/**
 * Trim overflowing tiles at the source: keeps the tile's header + as many
 * content lines as fit, then inserts an explicit '· trimmed (tile budget)'
 * marker before the closing line. Never trims silently (CANON-031).
 */
export function enforceTileBudgets(body) {
  const trimmed = [];
  const out = body.replace(/(╔[^\n]*\n)([\s\S]*?)(╚[^\n]*╝)/g, (whole, head, mid, tail) => {
    const title = whole.match(/^╔[═\s]*([^═╗]+?)(?:\s*═|╗)/m)?.[1]?.trim() || 'UNTITLED';
    const budget = tileBudgetFor(title);
    if (Buffer.byteLength(whole, 'utf8') <= budget) return whole;
    const lines = mid.split('\n');
    const overhead = Buffer.byteLength(head + tail, 'utf8') + 80; // marker allowance
    let used = 0;
    const kept = [];
    for (const line of lines) {
      const lb = Buffer.byteLength(line + '\n', 'utf8');
      if (used + lb > budget - overhead) break;
      kept.push(line);
      used += lb;
    }
    const dropped = lines.length - kept.length;
    if (dropped <= 0) return whole;
    trimmed.push({ title, dropped, budget });
    return head + kept.join('\n') + `\n║  · ${dropped} line(s) trimmed (tile budget ${(budget / 1024).toFixed(1)}KB)\n` + tail;
  });
  return { body: out, trimmed };
}

export function briefBlockSizes(body) {
  const blocks = [];
  const re = /(╔[^\n]*\n[\s\S]*?╚[^\n]*╝)/g;
  for (const match of body.matchAll(re)) {
    const block = match[1];
    const title = block.match(/^╔[═\s]*([^═╗]+?)(?:\s*═|╗)/m)?.[1]?.trim() || 'UNTITLED';
    blocks.push({
      title,
      bytes: Buffer.byteLength(block, 'utf8'),
      lines: block.split(/\r?\n/).length,
    });
  }
  return blocks.sort((a, b) => b.bytes - a.bytes);
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
  let fail = !result.ok;

  // S124 #8 — Token-budget enforcer. Brief is the only canonical /start
  // surface — bloat = re-introducing the 100KB pre-v4 tax. Persist size to
  // .cache/brief-size.json for doctor probe.
  // S153 re-baseline: the 13/15KB budget predated the augment layer (S118
  // R-H5/R-H12) and the S121–S142 tile additions (PROPAGATION · ARK · ARK
  // PRIORITY · CASCADE · ANALYTICA · OBELISK · SIL GAPS · ROUTER — ~5.7KB of
  // deliberate, individually-shipped surface). A fresh render+augment measured
  // 20.9KB and hard-failed every /start deterministically. 24KB ≈ 5.2K tokens
  // — still inside the v1.3 token-lean target (≤8K at session start).
  // Trim-first rule stands: no-data boxes are skipped (augment S153).
  const sizeBytes = Buffer.byteLength(body, 'utf8');
  const topBlocks = briefBlockSizes(body).slice(0, 5);
  const BUDGET_WARN = 18_432; // 18KB
  const BUDGET_FAIL = 24_576; // 24KB
  const budgetStatus = sizeBytes > BUDGET_FAIL ? 'fail' : sizeBytes > BUDGET_WARN ? 'warn' : 'pass';
  try {
    const fs2 = await import('node:fs');
    const path2 = await import('node:path');
    const cacheDir = path2.join(path2.dirname(targetPath || '.'), '..', '.cache');
    fs2.mkdirSync(cacheDir, { recursive: true });
    fs2.writeFileSync(path2.join(cacheDir, 'brief-size.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      sizeBytes,
      budgetWarn: BUDGET_WARN,
      budgetFail: BUDGET_FAIL,
      status: budgetStatus,
      topBlocks,
      overBudgetTiles: checkTileBudgets(body).overBudget, // S154 #4
    }, null, 2));
  } catch {}
  if (budgetStatus === 'fail') fail = true;
  // S154 #4 — per-tile attribution: name the offending tile, don't just say "too big".
  // S248 [audit #10] — tile-budget hard contract: the per-tile check existed since
  // S154 but was advisory-only, so a tile could run over budget every render with
  // nothing gating the bloat (SIGNALS sat at 102% for sessions). Contract: >110%
  // of a tile's budget FAILS validation; 100–110% stays a warning. The sanctioned
  // escape hatch is enforceTileBudgets' explicit '· trimmed (tile budget)' marker
  // — trim the tile at the renderer, never widen the contract silently.
  const TILE_HARD_FAIL_PCT = 110;
  const tileCheck = checkTileBudgets(body);
  if (!JSON_MODE && tileCheck.overBudget.length) {
    for (const t of tileCheck.overBudget.slice(0, 4)) {
      const hard = t.pct > TILE_HARD_FAIL_PCT;
      console.log(`  ${hard ? '⛔' : '⚠'}  tile over budget: ${t.title} ${t.bytes}B > ${t.budget}B (${t.pct}%)${hard ? ' — HARD FAIL (>110%) · trim the tile at the renderer' : ''}`);
    }
  }
  if (tileCheck.overBudget.some((t) => t.pct > TILE_HARD_FAIL_PCT)) fail = true;
  if (!JSON_MODE && budgetStatus !== 'pass') {
    console.log(`  ${budgetStatus === 'fail' ? '⛔' : '⚠'}  brief size ${sizeBytes}B ${budgetStatus === 'fail' ? `> ${BUDGET_FAIL}B (HARD FAIL — trim tiles)` : `> ${BUDGET_WARN}B (warn — approaching budget)`}`);
    if (topBlocks.length) {
      console.log('  top brief blocks by size:');
      for (const block of topBlocks.slice(0, 3)) {
        console.log(`    - ${block.title}: ${block.bytes}B · ${block.lines} lines`);
      }
    }
  }

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({
      ok: result.ok,
      source: STDIN_MODE ? '<stdin>' : targetPath,
      missingRequired: result.missingRequired,
      missingRecommended: result.missingRecommended,
      forbiddenHits: result.forbiddenHits,
      bodyShape: result.bodyShape,
      staleBrief: result.staleBrief,
      budget: {
        sizeBytes,
        warnBytes: BUDGET_WARN,
        failBytes: BUDGET_FAIL,
        status: budgetStatus,
        topBlocks,
      },
    }, null, 2) + '\n');
  } else {
    const header = `validate-brief-format · ${STDIN_MODE ? '<stdin>' : path.relative(process.cwd(), targetPath)}`;
    console.log(header);
    console.log('─'.repeat(Math.min(72, header.length + 8)));
    if (result.staleBrief) {
      console.log(`  ⛔  STALE BRIEF: ${result.staleBrief}`);
    }
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
