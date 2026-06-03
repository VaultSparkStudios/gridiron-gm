#!/usr/bin/env node
/**
 * compact-handoff.mjs — LATEST_HANDOFF compactor + trimmer (v3.2)
 *
 * Two modes:
 *
 * DEFAULT: Summarize `context/LATEST_HANDOFF.md` to ≤500 tokens using Haiku.
 *   Caches result 1h in `.ops-cache/handoff-digest.json`.
 *   Read the digest at session start instead of the full file (~94% token savings).
 *
 * --trim: Archive all sessions beyond the newest 2 to `context/HANDOFF_ARCHIVE.md`.
 *   Keeps LATEST_HANDOFF.md at ≤2 sessions (~5-8K tokens max).
 *   Run automatically at closeout to prevent unbounded file growth.
 *   Idempotent — re-running when already ≤2 sessions is a no-op.
 *
 * Usage:
 *   node scripts/compact-handoff.mjs           # digest cache (default)
 *   node scripts/compact-handoff.mjs --force   # force re-digest
 *   node scripts/compact-handoff.mjs --trim    # archive old sessions
 *   node scripts/compact-handoff.mjs --trim --dry-run  # preview only
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { MODELS, callClaude, withLongCache, logMetrics } from './lib/model-router.mjs';
import { getSecret } from './lib/secrets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HANDOFF = path.join(ROOT, 'context', 'LATEST_HANDOFF.md');
const CACHE   = path.join(ROOT, '.ops-cache', 'handoff-digest.json');
const OUT     = path.join(ROOT, 'context', 'LATEST_HANDOFF.compact.md');

const force   = process.argv.includes('--force');
const trim    = process.argv.includes('--trim');
const dryRun  = process.argv.includes('--dry-run');

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

// ── TRIM MODE ────────────────────────────────────────────────────────────────
if (trim) {
  const ARCHIVE = path.join(ROOT, 'context', 'HANDOFF_ARCHIVE.md');
  const raw = readText(HANDOFF);
  if (!raw) { console.error('No LATEST_HANDOFF.md found.'); process.exit(1); }

  // Split on "## Where We Left Off" session boundaries (robust to \r\n + \n)
  const normalized = raw.replace(/\r\n/g, '\n');
  const sections = normalized.split(/\n(?=## Where We Left Off)/);
  const header   = sections[0].trimStart().startsWith('## Where We Left Off') ? '' : sections.shift();
  const sessions = sections; // each starts with "## Where We Left Off ..."

  const KEEP = 2;
  if (sessions.length <= KEEP) {
    console.log(`= LATEST_HANDOFF.md already has ${sessions.length} session(s) — no trim needed.`);
    process.exit(0);
  }

  const toKeep    = sessions.slice(0, KEEP);
  const toArchive = sessions.slice(KEEP);

  console.log(`✂ Trimming LATEST_HANDOFF.md: keeping ${KEEP} sessions, archiving ${toArchive.length}`);
  toArchive.forEach(s => {
    const firstLine = s.split('\n')[0].replace('## Where We Left Off', '').trim();
    console.log(`  → archive: ${firstLine}`);
  });

  if (!dryRun) {
    // Append archived sessions to HANDOFF_ARCHIVE.md
    const archiveHeader = `\n\n---\n<!-- archived: ${new Date().toISOString().slice(0, 10)} -->\n\n`;
    fs.appendFileSync(ARCHIVE, archiveHeader + toArchive.join(''));
    // Rewrite LATEST_HANDOFF with just the keeper sections
    fs.writeFileSync(HANDOFF, header + toKeep.join(''));
    console.log(`✓ LATEST_HANDOFF.md trimmed (${toKeep.length} sessions kept)`);
    console.log(`✓ ${toArchive.length} session(s) appended to context/HANDOFF_ARCHIVE.md`);
  } else {
    console.log(`(dry-run) would rewrite LATEST_HANDOFF.md + append ${toArchive.length} to HANDOFF_ARCHIVE.md`);
  }
  process.exit(0);
}

// ── DIGEST MODE (default) ─────────────────────────────────────────────────────
const handoff = readText(HANDOFF);
if (!handoff) { console.error('No LATEST_HANDOFF.md found.'); process.exit(1); }

const hash = crypto.createHash('sha256').update(handoff).digest('hex');
let cached = null;
try { cached = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch {}

const stillFresh = cached && cached.hash === hash && (Date.now() - (cached.ts || 0)) < 3_600_000;
if (stillFresh && !force) {
  fs.writeFileSync(OUT, cached.digest);
  console.log(`✓ Compact handoff (cached) → context/LATEST_HANDOFF.compact.md  (${cached.digest.length} chars)`);
  process.exit(0);
}

const apiKey = getSecret('ANTHROPIC_API_KEY', 'claude.api');
if (!apiKey) {
  // Fallback: crude first-1500-chars truncation
  const truncated = handoff.split(/\n/).slice(0, 40).join('\n');
  fs.writeFileSync(OUT, `<!-- fallback truncation (no API key) -->\n\n${truncated}`);
  console.log(`⚠ No ANTHROPIC_API_KEY — wrote truncated handoff (first 40 lines).`);
  process.exit(0);
}

const systemStable = withLongCache({
  type: 'text',
  text: `You are a handoff compressor. Given a LATEST_HANDOFF.md, produce a ≤500-token summary that a new agent can read cold. Preserve: session number, what shipped, current intent, top 3 Now-bucket items, top 3 blockers, human-blocked items with age. Drop: narrative, historical sessions, praise. Use terse bulleted sections with headers. No emojis, no markdown bold. End with a one-line next-session pointer.`,
});

const resp = await callClaude({
  apiKey,
  model: MODELS.haiku,
  maxTokens: 1200,
  system: [systemStable],
  messages: [{ role: 'user', content: handoff.slice(0, 40000) }],
}, https);

logMetrics({ script: 'compact-handoff', model: MODELS.haiku, usage: resp.usage, mode: 'compact' });

const digest = resp.content?.map(c => c.text || '').join('') || '';
const out = `<!-- generated-by: scripts/compact-handoff.mjs v3.1 -->\n<!-- source-hash: ${hash.slice(0, 12)} -->\n<!-- generated-at: ${new Date().toISOString()} -->\n\n# LATEST_HANDOFF (compact)\n\n${digest}\n`;

fs.writeFileSync(OUT, out);
fs.mkdirSync(path.dirname(CACHE), { recursive: true });
fs.writeFileSync(CACHE, JSON.stringify({ hash, digest: out, ts: Date.now() }, null, 2));

console.log(`✓ Compact handoff → context/LATEST_HANDOFF.compact.md  (${out.length} chars, cached 1h)`);
console.log(`  Tokens: input ${resp.usage?.input_tokens || 0}  output ${resp.usage?.output_tokens || 0}  cache_read ${resp.usage?.cache_read_input_tokens || 0}`);
