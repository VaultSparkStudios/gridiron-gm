#!/usr/bin/env node
/**
 * render-closeout-board.mjs (v1.0)
 *
 * Renders docs/CLOSEOUT_STATUS_BOARD.md — the canonical end-of-session board
 * checked by validate-closeout-board-format.mjs. Composed from live state:
 *   - PROJECT_STATUS.json (session, SIL category scores)
 *   - LATEST_HANDOFF.md (latest "Where We Left Off" / shipped bullets)
 *   - git status (write-back coverage + uncommitted summary)
 *   - context/PROJECT_STATUS.json doctor block + tests
 *   - .cache/genius-list.json (next session's #1 hit)
 *
 * Produces 7 mandatory blocks: SESSION CLOSEOUT, WHAT SHIPPED, SCORES,
 * WRITE-BACK STATUS, GIT STATUS, POST-SESSION SIGNALS, NEXT SESSION.
 *
 * Usage:
 *   node scripts/render-closeout-board.mjs              # write file
 *   node scripts/render-closeout-board.mjs --stdout     # write to stdout instead
 *   node scripts/ops.mjs closeout-board
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATUS_PATH = path.join(ROOT, 'context', 'PROJECT_STATUS.json');
const HANDOFF_PATH = path.join(ROOT, 'context', 'LATEST_HANDOFF.md');
const REGISTRY_PATH = path.join(ROOT, 'portfolio', 'PROJECT_REGISTRY.json');
const GENIUS_CACHE = path.join(ROOT, '.cache', 'genius-list.json');
const OUT_PATH = path.join(ROOT, 'docs', 'CLOSEOUT_STATUS_BOARD.md');

const STDOUT_MODE = process.argv.includes('--stdout');

const W = 62;
const pad = (s, w = W) => {
  const str = String(s ?? '');
  return str.length >= w ? str.slice(0, w) : str + ' '.repeat(w - str.length);
};
const row = (s) => `║  ${pad(s)}  ║`;
const blank = () => `║  ${' '.repeat(W)}  ║`;
const top = (title) => {
  const t = title ? `══ ${title} ` : '';
  return '╔' + t + '═'.repeat(Math.max(1, W + 2 - t.length)) + '╗';
};
const bottom = () => '╚' + '═'.repeat(W + 2) + '╝';

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function sh(cmd) {
  const r = spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
  return { out: r.stdout || '', err: r.stderr || '', code: r.status ?? -1 };
}

function projectName() {
  const status = readJson(STATUS_PATH);
  if (status?.name) return status.name;
  const reg = readJson(REGISTRY_PATH);
  const slug = path.basename(ROOT);
  const entry = reg?.projects?.find((p) => p.slug === slug || p.localPath?.endsWith(slug));
  return entry?.name || 'Studio Ops';
}

function parseShippedFromHandoff() {
  const body = readText(HANDOFF_PATH);
  if (!body) return [];
  const match = body.match(/^##\s+Where We Left Off[\s\S]*?(?=^##\s|\Z)/m)
    || body.match(/^#\s+(?:S\d+\s+|Session\s+\d+\s+).*?\n([\s\S]*?)(?=^#\s|\Z)/m);
  const segment = match ? match[0] : body.slice(0, 4000);
  const bullets = segment
    .split('\n')
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, '').trim())
    .filter((l) => l.length > 4)
    .slice(0, 5);
  return bullets;
}

function silCategoryRows(status) {
  const SIL_CATS = [
    ['Dev Health',     'devHealth'],
    ['Alignment',      'creativeAlignment'],
    ['Momentum',       'momentum'],
    ['Engagement',     'engagement'],
    ['Process Qual',   'processQuality'],
    ['Coherence',      'crossRepoCoherence'],
    ['Security',       'securityPosture'],
    ['Ecosystem',      'ecosystemIntegration'],
    ['Capital',        'capitalEfficiency'],
    ['Automation',     'automationCoverage'],
  ];
  const cats = status?.silCategoriesV3 || status?.silCategories || {};
  return SIL_CATS.map(([label, key]) => {
    const v = cats[key];
    const score = typeof v === 'number' ? v : (typeof v?.score === 'number' ? v.score : null);
    if (score == null) return `  ${pad(label, 18)} —`;
    const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
    return `  ${pad(label, 18)} ${pad(String(score), 4)} ${bar}`;
  });
}

function gitChangeSummary() {
  const s = sh('git status --short');
  const lines = s.out.split('\n').filter((l) => l.trim());
  const counts = { M: 0, A: 0, D: 0, R: 0, '??': 0 };
  for (const ln of lines) {
    const code = ln.slice(0, 2).trim() || '??';
    if (code in counts) counts[code]++;
    else counts.M++;
  }
  return { lines, counts, total: lines.length };
}

function writeBackCoverage() {
  const TARGETS = [
    'context/CURRENT_STATE.md',
    'context/TASK_BOARD.md',
    'context/LATEST_HANDOFF.md',
    'logs/WORK_LOG.md',
    'context/DECISIONS.md',
    'context/SELF_IMPROVEMENT_LOOP.md',
    'docs/CREATIVE_DIRECTION_RECORD.md',
    'context/TRUTH_AUDIT.md',
    'context/PROJECT_STATUS.json',
  ];
  const s = sh('git status --short');
  const touched = new Set();
  for (const ln of s.out.split('\n')) {
    const fileMatch = ln.match(/^.{2,3}\s+(.+)$/);
    if (!fileMatch) continue;
    const file = fileMatch[1].replace(/\\/g, '/').replace(/^"|"$/g, '');
    for (const t of TARGETS) {
      if (file.endsWith(t)) touched.add(t);
    }
  }
  return TARGETS.map((t) => ({ file: t, touched: touched.has(t) }));
}

function daysSinceISO(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86400000));
}

function postSessionSignals(status) {
  const doctor = status?.doctorScore && typeof status.doctorScore === 'object'
    ? `${status.doctorScore.passing ?? '?'}/${status.doctorScore.total ?? '?'}`
    : (typeof status?.doctorScore === 'number' ? String(status.doctorScore) : '—');
  const tests = status?.testsPassing != null && status?.testsTotal != null
    ? `${status.testsPassing}/${status.testsTotal}`
    : '—';
  const ignisDays = daysSinceISO(status?.ignisLastComputed);
  const ignisLabel = ignisDays == null ? '—' : `${ignisDays}d ago`;
  const truth = status?.truthAuditStatus || status?.truthGenome?.status || '—';
  return {
    doctor,
    compliance: status?.complianceScore != null
      ? `${status.complianceScore}/${status.complianceTotal ?? 27}`
      : '—',
    tests,
    ignis: ignisLabel,
    truth,
    sanitization: status?.sanitizationLastCleared
      ? `${daysSinceISO(status.sanitizationLastCleared) ?? '—'}d ago`
      : '—',
  };
}

function nextSessionHint() {
  const cache = readJson(GENIUS_CACHE);
  const top = cache?.list?.ranked?.[0];
  if (!top) return null;
  return {
    title: top.title || top.id,
    rationale: top.rationale || '',
    cmd: top.command || null,
  };
}

function render() {
  const status = readJson(STATUS_PATH) || {};
  const session = status.currentSession ?? status.lastSession ?? '?';
  const sil = status.silScore ?? '?';
  const silMax = status.silMax ?? 1000;
  const date = new Date().toISOString().slice(0, 10);
  const name = projectName();

  const shipped = parseShippedFromHandoff();
  const silRows = silCategoryRows(status);
  const wb = writeBackCoverage();
  const git = gitChangeSummary();
  const sig = postSessionSignals(status);
  const next = nextSessionHint();

  const lines = [];

  // 1. SESSION CLOSEOUT header
  lines.push(top(`SESSION CLOSEOUT · ${name} · S${session}`));
  const vel = status.silVelocity ?? status.velocity;
  const velLabel = vel != null ? `${vel}${status.silDebt ? ' ' + status.silDebt : ''}` : '—';
  lines.push(row(`Date: ${date}  ·  SIL: ${sil}/${silMax}  ·  Velocity: ${velLabel}`));
  lines.push(row(`Mode: ${(status.sessionMode || 'FOUNDER').toUpperCase()}  ·  Agent: ${status.lastAgent || 'claude-code'}`));
  lines.push(bottom());

  // 2. WHAT SHIPPED
  lines.push(top('WHAT SHIPPED'));
  if (shipped.length === 0) {
    lines.push(row('(no shipped bullets parsed from LATEST_HANDOFF — see git log)'));
  } else {
    for (const b of shipped) lines.push(row(`✓ ${b.slice(0, W - 2)}`));
  }
  lines.push(bottom());

  // 3. SCORES
  lines.push(top(`SCORES · SIL ${sil}/${silMax}`));
  for (const r of silRows) lines.push(row(r));
  lines.push(bottom());

  // 4. WRITE-BACK STATUS
  lines.push(top('WRITE-BACK STATUS'));
  for (const w of wb) {
    const icon = w.touched ? '✓' : '·';
    const label = w.file.replace(/^.+\//, '');
    lines.push(row(`${icon} ${pad(w.file, W - 2)}`));
  }
  lines.push(bottom());

  // 5. GIT STATUS
  lines.push(top('GIT STATUS'));
  lines.push(row(`Changes: ${git.total} files  ·  M:${git.counts.M} A:${git.counts.A} D:${git.counts.D} ?:${git.counts['??']}`));
  const aheadRes = sh('git rev-list --count @{u}..HEAD').out.trim();
  const behindRes = sh('git rev-list --count HEAD..@{u}').out.trim();
  lines.push(row(`Ahead: ${aheadRes || '?'}  ·  Behind: ${behindRes || '?'}`));
  const branch = sh('git branch --show-current').out.trim();
  lines.push(row(`Branch: ${branch || '?'}`));
  lines.push(bottom());

  // 6. POST-SESSION SIGNALS
  lines.push(top('POST-SESSION SIGNALS'));
  lines.push(row(`Doctor:        ${sig.doctor}`));
  lines.push(row(`Compliance:    ${sig.compliance}`));
  lines.push(row(`Tests:         ${sig.tests}`));
  lines.push(row(`IGNIS:         ${sig.ignis}`));
  lines.push(row(`Truth:         ${sig.truth}`));
  lines.push(row(`Sanitization:  ${sig.sanitization}`));
  lines.push(bottom());

  // 7. NEXT SESSION
  lines.push(top('NEXT SESSION'));
  if (next) {
    lines.push(row(`#1: ${(next.title || '').slice(0, W - 4)}`));
    if (next.rationale) lines.push(row(`    ${next.rationale.slice(0, W - 4)}`));
    if (next.cmd) lines.push(row(`    ↳ ${next.cmd.slice(0, W - 6)}`));
  } else {
    lines.push(row('(no genius cache — run `node scripts/cache-genius-list.mjs`)'));
  }
  lines.push(bottom());

  const header = `<!-- generated-by: scripts/render-closeout-board.mjs v1.0 -->\n<!-- generated-at: ${date} (Session ${session} closeout) -->\n\n# Closeout Status Board — ${name}\n\n\`\`\`\n`;
  const footer = '\n```\n\n*Generated by `scripts/render-closeout-board.mjs v1.0`*\n';

  return header + lines.join('\n') + footer;
}

const out = render();
if (STDOUT_MODE) {
  process.stdout.write(out);
} else {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, out);
  const sessionTag = (readJson(STATUS_PATH) || {}).currentSession ?? '?';
  console.log(`✓ Closeout board → docs/CLOSEOUT_STATUS_BOARD.md  (Session ${sessionTag})`);
}
