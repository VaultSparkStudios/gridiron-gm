#!/usr/bin/env node
/**
 * render-startup-brief.mjs  (v2.8)
 *
 * Pre-renders the next session's startup brief to docs/STARTUP_BRIEF.md.
 * v2.8: genome dimension alert, entropy signal, velocity history bar.
 * v2.7: box-drawing UI, SIL category bars, CDR gap detection,
 *       protocol version drift detection, revenue freshness signal,
 *       embedded genius hit list (calls generate-genius-list.mjs --brief).
 *
 * Usage:
 *   node scripts/render-startup-brief.mjs
 *   node scripts/ops.mjs startup-brief
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { renderTitleHeader, renderLastCompleted, renderTestItNow } from './lib/brief-blocks.mjs';
import { parseUnifiedItems } from './lib/task-board.mjs';
import { loadPortfolioTaskBoards } from './lib/cross-repo-tasks.mjs';
import { loadIgnisInsight } from './lib/ignis-insight.mjs';
import { contextWindowForAgent } from './lib/model-router.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'docs', 'STARTUP_BRIEF.md');
const node = process.execPath;

// ── Constants ─────────────────────────────────────────────────────────────────
const W  = 62; // inner box width (content between ║  and  ║)
const BW = W + 4; // total line width including ║  prefix/suffix

// ── Helpers ───────────────────────────────────────────────────────────────────
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function readJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } }
function daysBetween(a, b) { try { return Math.floor((new Date(b) - new Date(a)) / 86400000); } catch { return 999; } }
function bytesOf(rel) { try { return fs.statSync(path.join(root, rel)).size; } catch { return 0; } }
function lockValue(key) {
  const lock = readText(path.join(root, 'context', '.session-lock'));
  return lock.match(new RegExp(`^${key}:\\s*(\\S+)`, 'm'))?.[1] ?? '';
}

// ── Parallel file loader (performance: all reads in one Promise.all tick) ─────
async function loadAllFiles(filePaths) {
  return Promise.all(
    filePaths.map(({ key, path: p, json: isJson }) =>
      new Promise(resolve => {
        fs.readFile(p, 'utf8', (err, data) => {
          if (err || !data) { resolve({ key, value: isJson ? {} : '' }); return; }
          if (isJson) {
            try { resolve({ key, value: JSON.parse(data) }); }
            catch { resolve({ key, value: {} }); }
          } else {
            resolve({ key, value: data });
          }
        });
      })
    )
  );
}

const FILE_MANIFEST = [
  { key: 'status',    path: path.join(root, 'context', 'PROJECT_STATUS.json'),        json: true  },
  { key: 'sil',       path: path.join(root, 'context', 'SELF_IMPROVEMENT_LOOP.md'),   json: false },
  { key: 'taskBoard', path: path.join(root, 'context', 'TASK_BOARD.md'),              json: false },
  { key: 'handoff',   path: path.join(root, 'context', 'LATEST_HANDOFF.md'),          json: false },
  { key: 'genome',    path: path.join(root, 'context', 'GENOME_HISTORY.json'),        json: true  },
  { key: 'state',     path: path.join(root, 'context', 'STATE_VECTOR.json'),          json: true  },
  { key: 'cdr',       path: path.join(root, 'docs', 'CREATIVE_DIRECTION_RECORD.md'),  json: false },
  { key: 'sessionPlan', path: path.join(root, 'docs', 'SESSION_PLAN.md'),             json: false },
  { key: 'startMd',  path: path.join(root, 'prompts', 'start.md'),                    json: false },
  { key: 'startTpl', path: path.join(root, 'docs', 'templates', 'project-system', 'START_PROMPT.template.md'), json: false },
  { key: 'registry', path: path.join(root, 'portfolio', 'PROJECT_REGISTRY.json'),    json: true  },
  { key: 'revSig',   path: path.join(root, 'portfolio', 'REVENUE_SIGNALS.md'),       json: false },
  { key: 'doctorOut', path: path.join(root, 'context', 'PROJECT_STATUS.json'),       json: true  }, // same as status, reuse
];

// Load all files in parallel
const startMs = Date.now();
const loaded = await loadAllFiles(FILE_MANIFEST);
const fileCache = Object.fromEntries(loaded.map(({ key, value }) => [key, value]));
process.stderr.write(`  ⚡ Parallel file load: ${Date.now() - startMs}ms\n`);

function extractBetween(content, start, end) {
  const s = content.indexOf(start); const e = content.indexOf(end);
  if (s === -1 || e === -1 || e <= s) return '';
  return content.slice(s + start.length, e).trim();
}
function extractSection(content, heading) {
  const parts = content.split(/^## /m);
  const match = parts.find(p => p.startsWith(heading));
  if (!match) return '';
  const nl = match.indexOf('\n');
  return nl === -1 ? '' : match.slice(nl + 1);
}

// ── Box-drawing helpers ───────────────────────────────────────────────────────
function pad(s, w) { const str = String(s ?? ''); return str.length >= w ? str.slice(0, w) : str + ' '.repeat(w - str.length); }
function row(content) { return `║  ${pad(content, W)}  ║`; }
function blank() { return `║  ${' '.repeat(W)}  ║`; }
function top(title) {
  const t = title ? `══ ${title} ` : '';
  return '╔' + t + '═'.repeat(Math.max(1, W + 2 - t.length)) + '╗';
}
function mid(title) {
  const t = title ? `══ ${title} ` : '';
  return '╠' + t + '═'.repeat(Math.max(1, W + 2 - t.length)) + '╣';
}
function bot() { return '╚' + '═'.repeat(W + 2) + '╝'; }

// Progress bar: score /100 → 20 chars  █░
function bar20(score) {
  const n = Math.min(20, Math.max(0, Math.round(score / 5)));
  return '█'.repeat(n) + '░'.repeat(20 - n);
}
// 10-char proportional bar for category rows (score 0-100 → 0-10 blocks).
function bar10(score) {
  const n = Math.min(10, Math.max(0, Math.round((score ?? 0) / 10)));
  return '█'.repeat(n) + '░'.repeat(10 - n);
}
// Progress bar: total / silMax → 24 chars  █░  (SIL v3.0 default 1000)
function bar24(total, max = 1000) {
  const n = Math.min(24, Math.max(0, Math.floor((total ?? 0) / max * 24)));
  return '█'.repeat(n) + '░'.repeat(24 - n);
}

// ── Load source files ─────────────────────────────────────────────────────────
const status      = readJson(path.join(root, 'context', 'PROJECT_STATUS.json'), {});
const taskBoard   = readText(path.join(root, 'context', 'TASK_BOARD.md'));
const handoff     = readText(path.join(root, 'context', 'LATEST_HANDOFF.md'));
const sil         = readText(path.join(root, 'context', 'SELF_IMPROVEMENT_LOOP.md'));
const truth       = readText(path.join(root, 'context', 'TRUTH_AUDIT.md'));
const csmd        = readText(path.join(root, 'context', 'CURRENT_STATE.md'));
const sessionPlan = readText(path.join(root, 'docs', 'SESSION_PLAN.md'));
const cdr         = readText(path.join(root, 'docs', 'CREATIVE_DIRECTION_RECORD.md'));
const revSig      = readText(path.join(root, 'portfolio', 'REVENUE_SIGNALS.md'));
const complianceHistory = readJson(path.join(root, 'context', 'COMPLIANCE_HISTORY.json'), { snapshots: [] });
const intentPlan  = readText(path.join(root, 'context', 'SESSION_INTENT_PLAN.md'));
const humanPressure = readJson(path.join(root, 'portfolio', 'compiled', 'HUMAN_ACTION_PRESSURE.json'), { items: [] });

const meterAgent = lockValue('agent') || 'unknown';
const meterLimit = contextWindowForAgent(meterAgent);
const meterBytes = [
  'AGENTS.md', 'CLAUDE.md', 'context/PROJECT_BRIEF.md', 'context/SOUL.md',
  'context/BRAIN.md', 'context/CURRENT_STATE.md', 'context/DECISIONS.md',
  'context/TASK_BOARD.md', 'context/LATEST_HANDOFF.md',
  'context/SELF_IMPROVEMENT_LOOP.md', 'context/TRUTH_AUDIT.md',
].reduce((sum, file) => sum + bytesOf(file), 0);
const meterUsed = Math.round(meterBytes / 4);
const meterRemaining = Math.max(0, meterLimit - meterUsed);
const meterRemainingPct = Math.round((meterRemaining / meterLimit) * 100);
const estimatedItemsFit = Math.max(0, Math.floor(meterRemaining / 100000));

// ── Parse Rolling Status ──────────────────────────────────────────────────────
const silHeader = extractBetween(sil, '<!-- rolling-status-start -->', '<!-- rolling-status-end -->');

const silTotalMatch = silHeader.match(/Total:\s*(\d+)\/(\d+)/);
const silTotal      = parseInt(silTotalMatch?.[1] ?? '') || 0;
const silMax        = parseInt(silTotalMatch?.[2] ?? '') || status.silMax || 1000;
const velocity      = parseInt(silHeader.match(/Velocity:\s*(\d+)/)?.[1] ?? '') || 0;
const sparkline     = silHeader.match(/Sparkline[^:]*:\s*([▁▂▃▄▅▆▇█ ]+)/)?.[1]?.trim() ?? '';
const avg3Raw       = parseFloat(silHeader.match(/Avgs — 3:\s*([\d.]+)/)?.[1] ?? '') || null;
const runwayRaw     = silHeader.match(/[Mm]omentum runway:\s*([^|]+)/)?.[1]?.trim()
                   ?? silHeader.match(/Runway:\s*([^|]+)/)?.[1]?.trim()
                   ?? 'unknown';
const intentRate    = silHeader.match(/Intent rate:\s*([^\n|]+)/)?.[1]?.trim() ?? 'unknown';
const lastSessionStr = silHeader.match(/Last session:\s*(.+)/)?.[1]?.trim() ?? '';
const debtRaw       = silHeader.match(/Debt:\s*([↑↓→])/)?.[1] ?? '→';
const velTrend      = silHeader.match(/Velocity trend:\s*([↑↓→])/)?.[1] ?? '';

// Per-category 3-session avgs
const cat3 = {};
const cat3Match = silHeader.match(/3-session:\s*Dev ([\d.]+)\s*\|\s*Align ([\d.]+)\s*\|\s*Momentum ([\d.]+)\s*\|\s*Engage ([\d.]+)\s*\|\s*Process ([\d.]+)/);
if (cat3Match) {
  cat3.dev = parseFloat(cat3Match[1]);
  cat3.align = parseFloat(cat3Match[2]);
  cat3.momentum = parseFloat(cat3Match[3]);
  cat3.engage = parseFloat(cat3Match[4]);
  cat3.process = parseFloat(cat3Match[5]);
}

// Last session scores (from most recent SIL entry — use last match)
const allSilEntries  = [...sil.matchAll(/## \d{4}-\d{2}-\d{2} — Session \d+[^\n]*\n([\s\S]*?)(?=\n## \d{4}-\d{2}-\d{2}|$)/g)];
const lastEntry      = allSilEntries.length > 0 ? (allSilEntries[0][1] ?? '') : '';
function parseScore(label) {
  const m = lastEntry.match(new RegExp(`\\|\\s*${label}\\s*\\|\\s*(\\d+)`, 'i'));
  return m ? parseInt(m[1]) : null;
}
const lastDev      = parseScore('Dev Health') ?? cat3.dev ?? 0;
const lastAlign    = parseScore('Creative Alignment') ?? cat3.align ?? 0;
const lastMomentum = parseScore('Momentum') ?? cat3.momentum ?? 0;
const lastEngage   = parseScore('Engagement') ?? cat3.engage ?? 0;
const lastProcess  = parseScore('Process Quality') ?? cat3.process ?? 0;

// Trend arrows per category (compare last to avg3)
function trend(last, avg) {
  if (!last || !avg) return '→';
  const delta = last - avg;
  return delta >= 2 ? '↑' : delta <= -2 ? '↓' : '→';
}

// ── v4.0: Per-category sparkline history (last N sessions) ────────────────────
// Parse all SIL entries for each of the 5 v2 categories. v3 categories come from
// PROJECT_STATUS.json silCategoriesV3 (single snapshot) + any future append-only history.
function parseCategoryHistory(label) {
  const series = [];
  for (const match of allSilEntries) {
    const body = match[1] ?? '';
    const m = body.match(new RegExp(`\\|\\s*${label}\\s*\\|\\s*(\\d+)`, 'i'));
    if (m) series.push(parseInt(m[1], 10));
  }
  return series.reverse().slice(-8);  // oldest → newest, last 8
}
function spark(values, max = 100) {
  if (!values || values.length === 0) return '—';
  const chars = '▁▂▃▄▅▆▇█';
  return values.map(v => {
    const n = Math.min(7, Math.max(0, Math.floor((v / max) * 7)));
    return chars[n];
  }).join('');
}
const catHistory = {
  dev:      parseCategoryHistory('Dev Health'),
  align:    parseCategoryHistory('Creative Alignment'),
  momentum: parseCategoryHistory('Momentum'),
  engage:   parseCategoryHistory('Engagement'),
  process:  parseCategoryHistory('Process Quality'),
};
// v3 categories — single-point snapshot (will grow as new sessions score v3)
const v3Cats = status.silCategoriesV3 || {};
const lastCoherence  = v3Cats.crossRepoCoherence ?? 0;
const lastSecurity   = v3Cats.securityPosture ?? 0;
const lastEcosystem  = v3Cats.ecosystemIntegration ?? 0;
const lastCapital    = v3Cats.capitalEfficiency ?? 0;
const lastAutomation = v3Cats.automationCoverage ?? 0;

// ── v4.0: Session voice — pull a distinctive line from SOUL.md (or BRAIN.md) ──
function extractSessionVoice() {
  const candidates = [
    path.join(root, 'context', 'SOUL.md'),
    path.join(root, 'context', 'BRAIN.md'),
    path.join(root, 'context', 'PROJECT_BRIEF.md'),
    path.join(root, 'context', 'CURRENT_STATE.md'),
  ];
  // Reject boilerplate template lines: they all describe the template itself or have placeholder syntax.
  const TEMPLATE_MARKERS = [
    /describe the (emotional|creative|mission|promise)/i,
    /must always be true/i, /audience should feel/i, /quality bar/i,
    /must never drift/i, /cheap imitation/i, /tonal failure mode/i,
    /how this project wins/i, /^<.*>$/, /^\[.*\]$/,
    /template|placeholder|fill in|TODO/i,
  ];
  // Require real content: a verb or structural word that indicates lived description.
  const SUBSTANTIVE = /\b(is|are|ships?|builds?|must|always|every|never|powered|operates?|tracks?|runs?|orchestrat|manag|serves?|coordinat|enforces?|protocol|canon|rubric|audit|pipeline|portfolio)\b/i;

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const lines = src.split('\n');
    for (const line of lines) {
      if (/^#/.test(line) || !line.trim()) continue;
      const bulletMatch = line.match(/^\s*[-*]\s+(.{25,140}?)(?:\s*\.|$)/);
      const proseMatch = line.match(/^(?!\s*[-*#])(.{40,140}?)\.\s*$/);
      let text = (bulletMatch?.[1] || proseMatch?.[1] || '').trim();
      // Strip markdown artifacts: bold/italic, backticks, link brackets.
      text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (!text || text.endsWith(':')) continue;
      if (TEMPLATE_MARKERS.some(re => re.test(text))) continue;
      if (!SUBSTANTIVE.test(text)) continue;
      return { text, source: path.basename(p) };
    }
  }
  return null;
}
const sessionVoice = extractSessionVoice();

// ── v4.0: Momentum meter — velocity streak + intent + cost ────────────────────
function momentumStreak() {
  // Parse last 8 SIL entries; count consecutive sessions where intent was "achieved"
  let streak = 0;
  for (const match of allSilEntries.slice(0, 10)) {
    const body = match[1] ?? '';
    if (/Classification:.*(Achieved|achieved)|Intent outcome:.*(Achieved|achieved|✓)/i.test(body)) streak++;
    else break;
  }
  return streak;
}
const streak = momentumStreak();
const intentPct = parseFloat(intentRate.match(/(\d+)%/)?.[1] ?? '0');
const cacheLedger = readJson(path.join(root, 'portfolio', 'compiled', 'CACHE_HIT_LEDGER.json'), {});
const cacheHitPct = typeof cacheLedger.avgHitRate === 'number' ? Math.round(cacheLedger.avgHitRate * 100) : null;
const weeklyCost = cacheLedger.weeklyCostUsd ?? null;

// ── v4.0: Genius-list autonomy cue (agent-owned vs human-blocked) ─────────────
function autonomyCue(item) {
  if (!item) return '  ';
  const status = (item.status || '').toLowerCase();
  if (status.includes('human') || status.includes('founder')) return '🔒';
  if (status.includes('blocked') || status.includes('locked')) return '⏳';
  return '⚡';
}

// ── Parse TASK_BOARD ──────────────────────────────────────────────────────────
const unifiedItems   = parseUnifiedItems(taskBoard);
const openNow        = unifiedItems.filter((item) => item.status === 'unblocked');
const openNext       = openNow.slice(3);
const openBlocked    = unifiedItems.filter((item) =>
  ['human-blocked', 'cross-repo-locked', 'externally-blocked', 'blocked-on-hub'].includes(item.status)
);

function taskLabel(item, maxLen = 54) {
  const text = typeof item === 'string'
    ? item
    : `${item.rank} · ${item.category} · ${item.title}`;
  return text.replace(/\*\*/g, '').replace(/`[^`]+`/g, m => m.replace(/`/g, '')).slice(0, maxLen);
}

// ── Derived values ─────────────────────────────────────────────────────────────
const today          = new Date().toISOString().slice(0, 10);
const currentSession = (status.currentSession || 62) + 1;
const ctxUpdated     = csmd.match(/^Last updated:\s*(\d{4}-\d{2}-\d{2})/m)?.[1] ?? null;
const ctxAge         = ctxUpdated ? daysBetween(ctxUpdated, today) : '?';
const scopeCap       = velocity > 0 ? Math.floor(velocity * 1.5) : null;

// ── Last active (freshest of: SIL closeout, lastUpdated, lastHandoffDate) ────
// "Days since last" was previously SIL-only, which lied when sessions shipped without
// running /closeout. Now takes the newest signal across all three sources.
const lastSilDateMatch = lastSessionStr.match(/(\d{4}-\d{2}-\d{2})/);
const lastSilDate = lastSilDateMatch?.[1] || null;
const candidateDates = [
  lastSilDate,
  status.lastUpdated,
  status.lastHandoffDate,
  status.silLastSession,
].filter(Boolean);
const freshestDate = candidateDates.length > 0
  ? candidateDates.sort().slice(-1)[0]  // max lex-sorted date
  : null;
const daysSinceActive = freshestDate ? daysBetween(freshestDate, today) : '?';
const daysSinceClosedOut = lastSilDate ? daysBetween(lastSilDate, today) : '?';
// Keep daysSinceLast alias for any downstream reader, but prefer the new honest value.
const daysSinceLast = daysSinceActive;

// IGNIS freshness
const ignisAge = status.ignisLastComputed ? daysBetween(status.ignisLastComputed, today) : '?';

// ── SESSION_PLAN prediction ───────────────────────────────────────────────────
const planGenAt  = sessionPlan.match(/<!-- generated-at: (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
const planAge    = planGenAt ? daysBetween(planGenAt, today) : null;
const planFresh  = planAge !== null && planAge < 2;
const planPredSIL = planFresh ? sessionPlan.match(/Predicted SIL:\s*([^\n(]+)/)?.[1]?.trim() : null;
const planTrend  = planFresh ? sessionPlan.match(/Trend:\s*([^\n]+)/)?.[1]?.trim() : null;
const planCap    = planFresh ? sessionPlan.match(/Scope cap:\s*([\d]+)/)?.[1] ?? null : null;
const intentLine = intentPlan.match(/- \*\*Intent:\*\* (.+)/)?.[1] ?? null;
const repoTouchLine = intentPlan.match(/- \*\*Repo touch set:\*\* (.+)/)?.[1] ?? null;
const yieldLine = intentPlan.match(/- \*\*Expected yield:\*\* (.+)/)?.[1] ?? null;
const topPressure = Array.isArray(humanPressure.items) && humanPressure.items.length > 0 ? humanPressure.items[0] : null;

// ── CDR gap detection ─────────────────────────────────────────────────────────
const cdrEntryDates  = [...cdr.matchAll(/\*\*(2\d{3}-\d{2}-\d{2})\*\*/g)].map(m => m[1]);
const lastCdrDate    = cdrEntryDates.length > 0 ? cdrEntryDates[cdrEntryDates.length - 1] : null;
const handoffDate    = handoff.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
const cdrGapDays     = lastCdrDate && handoffDate ? daysBetween(lastCdrDate, handoffDate) : 0;
const cdrGap         = cdrGapDays > 0;

// ── Protocol version drift ────────────────────────────────────────────────────
function extractVersion(p) { return readText(path.join(root, p)).match(/template-version: ([\d.]+)/)?.[1] ?? null; }
const startVer    = extractVersion('prompts/start.md');
const startTplVer = extractVersion('docs/templates/project-system/START_PROMPT.template.md');
const closVer     = extractVersion('prompts/closeout.md');
const closTplVer  = extractVersion('docs/templates/project-system/CLOSEOUT_PROMPT.template.md');
const versionDrift = (startVer && startTplVer && startVer !== startTplVer) ||
                     (closVer  && closTplVer  && closVer  !== closTplVer);

// ── Revenue signals freshness ─────────────────────────────────────────────────
const revGenDate  = revSig.match(/Generated:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
const revAge      = revGenDate ? daysBetween(revGenDate, today) : 999;

// ── Truth status ──────────────────────────────────────────────────────────────
const truthStatus = truth.match(/^Overall status:\s*(.+)$/m)?.[1] ?? status.truthAuditStatus ?? 'unknown';

// ── Pattern-memory (S85 pattern-memory auto-writer surfacing) ─────────────────
// Reads `project_pattern_*.md` entries from the Studio Ops Claude memory root
// and surfaces recurring genius-list categories (e.g. "PROTOCOL top-5 × 3").
// Falls back to reading portfolio/compiled/GENIUS_HISTORY.json when the memory
// root isn't present (CI, fresh clone, different user).
function loadPatternMemory() {
  const patterns = [];
  const memoryRoot = path.join(
    os.homedir(),
    '.claude',
    'projects',
    'C--Users-p4cka-documents-development-vaultspark-studio-ops',
    'memory'
  );

  try {
    if (fs.existsSync(memoryRoot)) {
      const files = fs.readdirSync(memoryRoot)
        .filter(f => /^project_pattern_.+\.md$/.test(f));
      for (const file of files) {
        const body = fs.readFileSync(path.join(memoryRoot, file), 'utf8');
        const name = body.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? '';
        const nameMatch = name.match(/Recurring\s+(\S+)\s+pressure\s*\((\d+)\s*sessions\)/i);
        if (!nameMatch) continue;
        const windowMatch = body.match(/\((S\d+(?:,\s*S\d+)+)\)/);
        patterns.push({
          category: nameMatch[1].toUpperCase(),
          sessions: parseInt(nameMatch[2], 10),
          window: windowMatch?.[1] ?? '',
          source: 'memory',
        });
      }
    }
  } catch { /* fall through to history fallback */ }

  if (patterns.length === 0) {
    // Fallback: recompute from GENIUS_HISTORY.json (same logic as pattern-memory.mjs).
    // Skip if the most recent history entry is older than 14 days — a frozen history
    // would otherwise produce phantom carry-forward pressure long after the pattern cleared.
    const hist = readJson(path.join(root, 'portfolio', 'compiled', 'GENIUS_HISTORY.json'), null);
    const entries = Array.isArray(hist?.entries) ? hist.entries : [];
    const latest = entries[entries.length - 1];
    const histAgeDays = latest?.date ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000) : 999;
    if (histAgeDays > 3) return patterns;  // stale — memory-based detection is canonical; frozen history produces phantom pressure
    const THRESH = 3;
    if (entries.length >= THRESH) {
      const window = entries.slice(-THRESH);
      const counts = new Map();
      for (const e of window) {
        const seen = new Set();
        for (const cat of e.topCategories ?? []) {
          if (seen.has(cat)) continue;
          seen.add(cat);
          counts.set(cat, (counts.get(cat) ?? 0) + 1);
        }
      }
      for (const [cat, n] of counts) {
        if (n >= THRESH) {
          patterns.push({
            category: cat.toUpperCase(),
            sessions: n,
            window: window.map(e => `S${e.session}`).join(', '),
            source: 'history',
          });
        }
      }
    }
  }

  patterns.sort((a, b) => b.sessions - a.sessions);
  return patterns;
}
const patternMemory = loadPatternMemory();
const sigPatterns = patternMemory.length > 0 ? '⚠' : '✓';
const patternsDetail = patternMemory.length === 0
  ? 'no recurring pressure detected'
  : patternMemory.length === 1
    ? `${patternMemory[0].category} top-5 × ${patternMemory[0].sessions} sessions — carry-forward`
    : `${patternMemory[0].category} × ${patternMemory[0].sessions} · +${patternMemory.length - 1} more — carry-forward`;

// ── Genome history (dimension alert) ─────────────────────────────────────────
const genomeData   = readJson(path.join(root, 'context', 'GENOME_HISTORY.json'), { snapshots: [] });
const genSnaps     = genomeData.snapshots ?? [];
const genLast      = genSnaps.length > 0 ? (genSnaps[genSnaps.length - 1]?.dimensions ?? {}) : {};
const genPrev      = genSnaps.length >= 2 ? (genSnaps[genSnaps.length - 2]?.dimensions ?? {}) : {};
const droppedDims  = Object.entries(genLast)
  .filter(([k, v]) => genPrev[k] != null && v < genPrev[k])
  .map(([k, v]) => ({ dim: k.replace(/_/g, '-'), from: genPrev[k], to: v }));
const sigGenome    = droppedDims.length > 0 ? '⚠' : '✓';
const genomeDetail = droppedDims.length > 0
  ? `drop: ${droppedDims.map(d => `${d.dim} ${d.from}→${d.to}`).join(' · ')}`
  : `all stable  (${genSnaps.length > 0 ? genSnaps[genSnaps.length - 1].total : '?'}/25)`;

// ── Deploy gaps ──────────────────────────────────────────────────────────────
let sigDeploy = '✓';
let deployLabel = 'no gaps (run: ops deploy-gaps)';
try {
  const gapsPath = path.join(root, 'portfolio', 'DEPLOY_GAPS.json');
  if (fs.existsSync(gapsPath)) {
    const gaps = JSON.parse(fs.readFileSync(gapsPath, 'utf8'));
    if (gaps.flaggedCount > 0) {
      sigDeploy = gaps.flaggedCount >= 3 ? '⛔' : '⚠';
      const top = (gaps.results || []).filter(r => r.flagged).slice(0, 2).map(r => r.slug).join(', ');
      deployLabel = `${gaps.flaggedCount}/${gaps.sparkedCount} SPARKED flagged (${top}${gaps.flaggedCount > 2 ? '…' : ''})`;
    } else if (gaps.sparkedCount > 0) {
      deployLabel = `0/${gaps.sparkedCount} gaps — all SPARKED shipped through`;
    }
  }
} catch { /* keep defaults */ }

// ── Doctor score ─────────────────────────────────────────────────────────────
const doctorScore  = status.doctorScore ?? null;
const sigDoctor    = !doctorScore ? '⚠' : doctorScore.failing === 0 ? (doctorScore.warning > 0 ? '⚠' : '✓') : '⛔';
const doctorDetail = doctorScore
  ? `${doctorScore.passing}/${doctorScore.total} (${doctorScore.score}%)  ·  ${doctorScore.date}${doctorScore.failing > 0 ? `  ·  ${doctorScore.failing} failing` : doctorScore.warning > 0 ? `  ·  ${doctorScore.warning} warning` : '  ✓'}`
  : 'not yet tracked — run: node scripts/ops.mjs doctor --update-json';

// ── Entropy ───────────────────────────────────────────────────────────────────
const entropy      = status.entropyScore ?? null;
const sigEntropy   = entropy === null ? '⚠' : entropy < 0.3 ? '✓' : entropy < 0.6 ? '⚠' : '⛔';
const entropyLabel = entropy !== null
  ? `${entropy.toFixed(3)}  ${entropy < 0.3 ? '(healthy)' : entropy < 0.6 ? '(elevated)' : '(high)'}`
  : 'not computed';

// ── Velocity history (last 5 session velocities from SIL entries) ──────────
const velEntries  = [...sil.matchAll(/## \d{4}-\d{2}-\d{2} — Session \d+[^\n]* Velocity:\s*(\d+)/g)].map(m => parseInt(m[1])).reverse();
const velLast5    = velEntries.slice(-5);
const velBar      = v => v === 0 ? '▁' : v <= 2 ? '▂' : v <= 5 ? '▄' : v <= 8 ? '▆' : v <= 12 ? '▇' : '█';
const velHistBar  = velLast5.length > 0 ? velLast5.map(velBar).join('') : sparkline;

// ── Handoff "shipped" line ────────────────────────────────────────────────────
const handoffBlock = handoff.match(/^## Where We Left Off \([^)]+\)\n([\s\S]*?)(?=\n---|\n## )/m)?.[1]?.trim() ?? '';
const shippedLine  = handoffBlock.match(/^- Shipped:\s*(.+)$/m)?.[1] ?? 'see LATEST_HANDOFF.md';

// ── Signal thresholds ─────────────────────────────────────────────────────────
function sig(val, green, warn) {
  // green fn, warn fn — if green(val) → ✓, if warn(val) → ⚠, else ⛔
  if (green(val)) return '✓';
  if (warn(val))  return '⚠';
  return '⛔';
}
// Runway is qualitative ("strong"/"healthy") OR quantitative ("~3 sessions"). Never match embedded version numbers like "v1.3".
const runwayQualitative = /\b(strong|healthy|robust)\b/i.test(runwayRaw);
const runwayWeak = /\b(weak|low|critical|depleted|empty)\b/i.test(runwayRaw);
const runwayNumMatch = runwayRaw.match(/~\s*([\d.]+)\s*(?:session|sprint|run)/i);
const runwayNum = runwayNumMatch ? parseFloat(runwayNumMatch[1])
                : runwayQualitative ? 9
                : runwayWeak ? 1
                : 5;
// Prefer explicit pass/total from run-tests; fall back to testsTotal only; then exempt; else warn.
const testsExempt = !status.testsTotal && (status.audience === 'internal' || status.type === 'infrastructure' || status.type === 'internal-ops') && !status.testsPassing;
let sigTests, testsLabel;
if (typeof status.testsPassing === 'number' && typeof status.testsTotal === 'number' && status.testsTotal > 0) {
  const allPass = status.testsPassing === status.testsTotal;
  const mostlyPass = status.testsPassing / status.testsTotal >= 0.9;
  sigTests = allPass ? '✓' : mostlyPass ? '⚠' : '⛔';
  testsLabel = `${status.testsPassing}/${status.testsTotal} passing` + (status.testsLastRun ? ` (${status.testsLastRun})` : '');
} else if (testsExempt) {
  sigTests = '✓';
  testsLabel = 'N/A (protocol repo)';
} else {
  sigTests = '⚠';
  testsLabel = `${status.testsTotal ?? '?'}/? passing`;
}
const sigVel    = sig(velocity, v => v >= 2, v => v === 1);
const sigRun    = sig(runwayNum, v => v > 4, v => v >= 2);
const sigCtx    = sig(typeof ctxAge === 'number' ? ctxAge : 99, v => v <= 7, v => v <= 14);
const sigIgnis  = sig(typeof ignisAge === 'number' ? ignisAge : 99, v => v < 7, v => v < 14);
const sigCdr    = cdrGap ? '⚠' : '✓';
const sigVer    = versionDrift ? '⚠' : '✓';
const sigRev    = revAge <= 7 ? '✓' : revAge <= 14 ? '⚠' : '⛔';
const sigTruth  = truthStatus === 'green' ? '✓' : truthStatus === 'yellow' ? '⚠' : '⛔';
const complianceSnapshots = Array.isArray(complianceHistory.snapshots) ? complianceHistory.snapshots : [];
const complianceLatest = complianceSnapshots[complianceSnapshots.length - 1] ?? null;
const compliancePrev = complianceSnapshots[complianceSnapshots.length - 2] ?? null;
const complianceTrend = complianceLatest && compliancePrev
  ? complianceLatest.score - compliancePrev.score >= 2 ? '↑' : compliancePrev.score - complianceLatest.score >= 2 ? '↓' : '→'
  : '→';
const complianceSpark = complianceSnapshots.slice(-8).map(s => {
  const score = Number(s.score || 0);
  if (score >= 100) return '█';
  if (score >= 95) return '▇';
  if (score >= 85) return '▆';
  if (score >= 70) return '▄';
  if (score >= 50) return '▂';
  return '▁';
}).join('') || '—';
const sigCompliance = !complianceLatest ? '⚠' : complianceLatest.score >= 100 ? '✓' : complianceLatest.score >= 95 ? '⚠' : '⛔';
const complianceDetail = complianceLatest
  ? `${complianceLatest.passed}/${complianceLatest.total} (${complianceLatest.score}%) ${complianceTrend} ${complianceSpark}`
  : 'not tracked — run: node scripts/ops.mjs compliance-velocity';

function buildGeniusBoxFromMarkdown(markdown) {
  const entries = [];
  const regex = /##\s+([^\n]+)\n\n\*\*Tier:\*\*.*?\n\n([^\n]+)(?:\n\n```bash\n([^\n]+)\n```)?/g;
  let match;
  while ((match = regex.exec(markdown)) !== null && entries.length < 5) {
    entries.push({
      title: match[1].trim(),
      summary: match[2].trim(),
      command: match[3]?.trim() || null,
    });
  }
  if (entries.length === 0) return '';

  const out = [top('GENIUS HIT LIST')];
  for (const entry of entries) {
    out.push(row(entry.title.slice(0, W)));
    out.push(row(entry.summary.slice(0, W)));
    if (entry.command) out.push(row(`↳ ${entry.command}`.slice(0, W)));
    out.push(blank());
  }
  out.push(bot());
  return out.join('\n');
}

// ── Cross-repo TASK_BOARD aggregation ─────────────────────────────────────────
let portfolioTasks = null;
try { portfolioTasks = loadPortfolioTaskBoards({ studioRoot: root, currentRepoPath: root }); } catch { /* best-effort */ }

function buildPortfolioBoxLines() {
  if (!portfolioTasks?.byProject?.length) return null;
  const t = portfolioTasks.totals;
  const out = [top('PORTFOLIO TASK BOARDS')];
  out.push(row(`Total: ${t.remaining} open · ${t.unblocked} unblocked · ${t.blocked} blocked`));
  out.push(row(`Crit ${t.critical} · High ${t.high} · ${portfolioTasks.projectsWithWork}/${portfolioTasks.projectsScanned} repos active`));
  out.push(blank());
  const active = portfolioTasks.byProject.filter(p => p.present && p.remaining > 0).slice(0, 8);
  for (const p of active) {
    const marker = p.isCurrent ? '>' : ' ';
    const nm = (p.name || p.slug || '').slice(0, 24).padEnd(24);
    const line = `${marker} ${nm} ${String(p.remaining).padStart(3)} open · ${String(p.unblocked).padStart(2)} unblk · C${String(p.critical).padStart(2)} H${String(p.high).padStart(2)}`;
    out.push(row(line.slice(0, W)));
  }
  const hidden = portfolioTasks.byProject.filter(p => p.present && p.remaining > 0).length - active.length;
  if (hidden > 0) out.push(row(`  … +${hidden} more — run: node scripts/lib/cross-repo-tasks.mjs`));
  out.push(bot());
  return out.join('\n');
}

// ── FOUNDER UNLOCKS — outstanding human actions that reopen sprint surface ───
import { ensureAges, daysSince } from './lib/human-action-ages.mjs';
function buildFounderUnlocksBox() {
  const humanSection = (() => {
    const parts = taskBoard.split(/^## /m);
    const m = parts.find(p => p.startsWith('Human Action Required'));
    if (!m) return '';
    const nl = m.indexOf('\n');
    return nl === -1 ? '' : m.slice(nl + 1);
  })();
  const items = humanSection.split(/\r?\n/).filter(l => /^- \[ \]/.test(l)).slice(0, 6);
  if (items.length === 0) return null;
  // Backfill first-seen dates so items without ~N sessions notation still age.
  const ledger = ensureAges(taskBoard, { root });
  const out = [top('FOUNDER UNLOCKS')];
  out.push(row('Single founder actions that reopen sprint surface:'));
  out.push(blank());
  for (const line of items) {
    const clean = line.replace(/^- \[ \]\s*/, '').replace(/\*\*/g, '');
    const ageMatch = clean.match(/~?(\d+)\s*sessions/);
    const title = clean.split(/\s+—\s+/)[0];
    let age;
    if (ageMatch) {
      age = `${ageMatch[1]}s`;
    } else if (ledger[title]?.firstSeen) {
      const d = daysSince(ledger[title].firstSeen);
      age = d === 0 ? 'today' : `${d}d`;
    } else {
      age = 'new';
    }
    out.push(row(`${age.padStart(5)} · ${title.slice(0, W - 12)}`));
  }
  out.push(bot());
  return out.join('\n');
}

// ── IGNIS INSIGHT summary ─────────────────────────────────────────────────────
const ignisInsight = (() => { try { return loadIgnisInsight({ studioRoot: root }); } catch { return { present: false }; } })();

function buildIgnisInsightBox() {
  if (!ignisInsight?.present) return null;
  const out = [top('IGNIS INSIGHT')];
  if (ignisInsight.generated) out.push(row(`Synth:    ${ignisInsight.generated} (${ignisInsight.daysSinceSynth}d old) · ${ignisInsight.phase || ''}`.slice(0, W)));
  if (ignisInsight.avgIq) out.push(row(`Avg IQ:   ${ignisInsight.avgIq}`.slice(0, W)));
  if (ignisInsight.coverage) out.push(row(`Coverage: ${ignisInsight.coverage}`.slice(0, W)));
  if (ignisInsight.topProject) out.push(row(`Top:      ${ignisInsight.topProject}`.slice(0, W)));
  if (ignisInsight.topRisk) out.push(row(`Top risk: ${ignisInsight.topRisk}`.slice(0, W)));
  if (ignisInsight.truthMix) out.push(row(`Truth:    ${ignisInsight.truthMix}`.slice(0, W)));
  if (ignisInsight.firstAction) out.push(row(`Do next:  ${ignisInsight.firstAction}`.slice(0, W)));
  if (ignisInsight.summaryLead) out.push(row(`Summary:  ${ignisInsight.summaryLead}`.slice(0, W)));
  out.push(bot());
  return out.join('\n');
}

// ── External signal summary ──────────────────────────────────────────────────
function buildExternalSignalsBox() {
  const log = readText(path.join(root, 'portfolio', 'EXTERNAL_SIGNAL_LOG.md'));
  if (!log) return null;
  const entries = log.split(/^### /m).slice(1);
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1];
  const title = latest.split(/\r?\n/)[0]?.trim() || 'latest signal';
  const body = latest.split(/\r?\n/).slice(1).join(' ').replace(/\s+/g, ' ').trim();
  const out = [top('EXTERNAL SIGNALS')];
  out.push(row(`${entries.length} logged · latest: ${title}`.slice(0, W)));
  if (body) out.push(row(body.slice(0, W)));
  out.push(bot());
  return out.join('\n');
}

// ── Genius list: call generate-genius-list.mjs --brief ────────────────────────
let geniusBlock = '';
try {
  const res = spawnSync(node, [path.join(root, 'scripts', 'generate-genius-list.mjs'), '--brief'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
  });
  geniusBlock = (res.stdout ?? '').trim();
} catch { /* fallback below */ }
if (!geniusBlock) {
  geniusBlock = buildGeniusBoxFromMarkdown(readText(path.join(root, 'docs', 'GENIUS_LIST.md')));
}
if (!geniusBlock) {
  geniusBlock = [top('GENIUS HIT LIST'), row('Run `node scripts/ops.mjs genius-list` to generate fresh recommendations.'), bot()].join('\n');
}

// ── Build the brief ───────────────────────────────────────────────────────────
const pct = silTotal > 0 ? `${Math.round(silTotal / silMax * 100)}%` : '?%';

const lines = [
  `<!-- generated-by: scripts/render-startup-brief.mjs v3.1 -->`,
  `<!-- generated-at: ${today} (Session ${currentSession - 1} closeout) -->`,
  `<!-- fast-boot-valid-until: next session if within 24h -->`,
  ``,
  `# Startup Brief — ${status.name || 'Studio Ops'}`,
  ``,
  `> **Fast-boot brief** — generated at Session ${currentSession - 1} closeout · ${today}.`,
  `> Valid for next session if started within 24h. For sessions >24h later, load context files fresh (start.md §3).`,
  ``,
  `---`,
  ``,
  `\`\`\``,
  renderTitleHeader({
    name: status.name || 'Studio Ops',
    type: status.type,
    lifecycle: status.lifecycle,
    audience: status.audience,
    vaultStatus: status.vaultStatus || 'FORGE',
    session: currentSession,
    date: today,
    mode: (status.sessionMode || 'builder').toUpperCase(),
    owner: status.owner,
  }),
  ``,
  renderLastCompleted(status.lastSessionSummary),
  ``,
  renderTestItNow({ name: status.name || 'Studio Ops', testingSurfaces: status.testingSurfaces || [] }),
  ``,
  // ── SCORE box (v4.0 — 10-category breakdown + sparklines) ──────────────────
  top('SCORE'),
  blank(),
  row(`  ${silTotal}/${silMax}   ${bar24(silTotal, silMax)}   ${pct}`),
  row(`  SIL v3.0  ·  Avg3: ${avg3Raw ?? '?'}  ·  Velocity ${velocity}${velTrend || '→'}`),
  row(`  Last active: ${daysSinceActive}d  ·  Last closeout: ${daysSinceClosedOut}d  ·  (active = newest of SIL/status/handoff)`),
  row(`  Trend  ${velHistBar || sparkline}  ${velTrend || '→'}  (last ${(velLast5 || []).length || 5} sessions)`),
  blank(),
  row(`  Category         Score  Bar        Spark   Δ`),
  row(`  ─────────────── ────── ────────── ──────── ─`),
  // Original 5 — with multi-session sparkline
  row(`  Dev Health       ${String(lastDev).padStart(3)}    ${bar10(lastDev)}  ${spark(catHistory.dev).padEnd(8)} ${trend(lastDev, cat3.dev)}`),
  row(`  Alignment        ${String(lastAlign).padStart(3)}    ${bar10(lastAlign)}  ${spark(catHistory.align).padEnd(8)} ${trend(lastAlign, cat3.align)}`),
  row(`  Momentum         ${String(lastMomentum).padStart(3)}    ${bar10(lastMomentum)}  ${spark(catHistory.momentum).padEnd(8)} ${trend(lastMomentum, cat3.momentum)}`),
  row(`  Engagement       ${String(lastEngage).padStart(3)}    ${bar10(lastEngage)}  ${spark(catHistory.engage).padEnd(8)} ${trend(lastEngage, cat3.engage)}`),
  row(`  Process Qual     ${String(lastProcess).padStart(3)}    ${bar10(lastProcess)}  ${spark(catHistory.process).padEnd(8)} ${trend(lastProcess, cat3.process)}`),
  // v3.0 new categories — single snapshot for now, sparkline builds as history accrues
  row(`  Coherence        ${String(lastCoherence).padStart(3)}    ${bar10(lastCoherence)}  ${'·'.repeat(8)} →`),
  row(`  Security         ${String(lastSecurity).padStart(3)}    ${bar10(lastSecurity)}  ${'·'.repeat(8)} →`),
  row(`  Ecosystem        ${String(lastEcosystem).padStart(3)}    ${bar10(lastEcosystem)}  ${'·'.repeat(8)} →`),
  row(`  Capital          ${String(lastCapital).padStart(3)}    ${bar10(lastCapital)}  ${'·'.repeat(8)} →`),
  row(`  Automation       ${String(lastAutomation).padStart(3)}    ${bar10(lastAutomation)}  ${'·'.repeat(8)} →`),
  blank(),
  bot(),
  ``,
  // ── WHERE WE LEFT OFF ──────────────────────────────────────────────────────
  top(`WHERE WE LEFT OFF  ·  Session ${currentSession - 1}`),
  row(`Shipped:  ${shippedLine.slice(0, W - 10)}`),
  row(`Tests:    ${status.testsTotal ?? '?'} passing  ·  Deploy: ${status.lastDeployStatus || 'N/A'}`),
  bot(),
  ``,
  // ── SIGNALS ────────────────────────────────────────────────────────────────
  top('SIGNALS'),
  row(`${sigTests}  Tests         ${testsLabel}`),
  row(`${sigVel}  Velocity      ${velocity} ${velTrend}  ·  Debt: ${debtRaw}`),
  row(`${sigRun}  Runway        ${runwayRaw}`),
  row(`✓  Headroom      ${meterRemainingPct}% remaining · ~${estimatedItemsFit} large item(s) fit`),
  row(`${sigCtx}  Context age   ${ctxAge}d`),
  row(`${sigIgnis}  IGNIS         ${status.ignisScore ?? '?'} ${status.ignisGrade || ''}  ·  ${ignisAge}d old`),
  row(`${sigTruth}  Truth         ${truthStatus}  ·  Genome: ${status.truthGenome || '?'}`),
  row(`${sigCompliance}  Compliance   ${complianceDetail}`),
  row(`${sigGenome}  Genome dims   ${genomeDetail}`),
  row(`${sigEntropy}  Entropy       ${entropyLabel}`),
  row(`${sigCdr}  CDR           ${cdrGap ? `gap detected (${cdrGapDays}d)  — recover at closeout` : 'no gap detected'}`),
  row(`${sigPatterns}  Patterns      ${patternsDetail}`),
  row(`${sigVer}  Templates     ${versionDrift ? `version drift (start: ${startVer} vs tpl: ${startTplVer})` : `v${startVer || '?'} aligned`}`),
  row(`${sigRev}  Revenue sig.  ${revGenDate ? `${revAge}d old (${revGenDate})` : 'not found'}${revAge > 7 ? '  ⚠ stale' : ''}`),
  row(`${sigDeploy}  Deploy gaps   ${deployLabel}`),
  row(`${sigDoctor}  Doctor        ${doctorDetail}`),
  bot(),
  ``,
  // ── IGNIS INSIGHT ──────────────────────────────────────────────────────────
  ...(buildIgnisInsightBox() ? [buildIgnisInsightBox(), ``] : []),
  // ── EXTERNAL SIGNALS ───────────────────────────────────────────────────────
  ...(buildExternalSignalsBox() ? [buildExternalSignalsBox(), ``] : []),
  // ── FOUNDER UNLOCKS ────────────────────────────────────────────────────────
  ...(buildFounderUnlocksBox() ? [buildFounderUnlocksBox(), ``] : []),
  // ── PORTFOLIO TASK BOARDS ──────────────────────────────────────────────────
  ...(buildPortfolioBoxLines() ? [buildPortfolioBoxLines(), ``] : []),
  // ── PREDICTION ─────────────────────────────────────────────────────────────
  ...(planFresh && planPredSIL ? [
    top('PREDICTION  ·  SESSION_PLAN.md'),
    row(`Next session:  ${planPredSIL}${planTrend ? `  ·  ${planTrend}` : ''}`),
    row(`Scope cap:     ${planCap ?? scopeCap ?? '?'} tasks`),
    bot(),
    ``,
  ] : []),
  ...(intentLine ? [
    top('EXECUTION PLAN'),
    row(`Intent:        ${intentLine.slice(0, W - 15)}`),
    ...(repoTouchLine ? [row(`Repo touch:    ${repoTouchLine.slice(0, W - 15)}`)] : []),
    ...(yieldLine ? [row(`Expected:      ${yieldLine.slice(0, W - 15)}`)] : []),
    bot(),
    ``,
  ] : []),
  // Now/Next/Blocked buckets removed — Unified Genius List is the single
  // recommendation surface. Blocked count surfaces in SIGNALS + GENIUS LIST.
  ...(topPressure ? [
    top('HUMAN PRESSURE'),
    row(`Top item:      ${topPressure.title.slice(0, W - 15)}`),
    row(`Pressure:      ${topPressure.pressureScore} · ${topPressure.pressureBand}`),
    row(`Next action:   ${topPressure.nextAgentAction.slice(0, W - 15)}`),
    bot(),
    ``,
  ] : []),
  // ── v4.0: SESSION VOICE (personable cue) ────────────────────────────────────
  ...(sessionVoice ? [
    top('SESSION VOICE'),
    row(`"${sessionVoice.text.slice(0, W - 6)}"`),
    row(`  — from ${sessionVoice.source}`),
    bot(),
    ``,
  ] : []),
  // ── v4.0: MOMENTUM METER (velocity + intent + streak + cost) ────────────────
  top('MOMENTUM METER'),
  row(`Velocity:   ${velHistBar || '—'}  ${velocity}${velTrend || '→'}  (last 5 sessions)`),
  row(`Intent:     ${intentPct || '?'}% achieved last 5`),
  row(`Streak:     ${streak > 0 ? `✓ ${streak} consecutive achieved-intent session${streak > 1 ? 's' : ''}` : '— (last intent not achieved)'}`),
  ...(cacheHitPct !== null ? [row(`Cache hit:  ${cacheHitPct}%  ${cacheHitPct >= 60 ? '✓ meeting target' : '⚠ below 60% target'}`)] : []),
  ...(weeklyCost !== null ? [row(`Weekly spend: $${weeklyCost.toFixed(2)}`)] : []),
  bot(),
  ``,
  // ── GENIUS HIT LIST ────────────────────────────────────────────────────────
  geniusBlock,
  ``,
  `\`\`\``,
  ``,
  `---`,
  ``,
  `*Generated by \`scripts/render-startup-brief.mjs v3.1\` · Session ${currentSession - 1} closeout · ${today}*`,
  `*Run \`node scripts/ops.mjs doctor\` for live health check · \`node scripts/ops.mjs genius-list\` to refresh hit list*`,
];

fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`✓ Startup brief → docs/STARTUP_BRIEF.md  (v3.2)`);
console.log(`  Session ${currentSession} · SIL ${silTotal}/${silMax} · ${pct} · Unblocked ${openNow.length} / Blocked ${openBlocked.length}`);
console.log(`  Signals: tests ${sigTests}  velocity ${sigVel}  runway ${sigRun}  genome ${sigGenome}  entropy ${sigEntropy}  cdr ${sigCdr}  patterns ${sigPatterns}  templates ${sigVer}  revenue ${sigRev}`);
