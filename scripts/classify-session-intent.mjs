#!/usr/bin/env node
/**
 * classify-session-intent.mjs — per-session intent classifier (S63e).
 *
 * Routing has been tier-only (coarse — one model per repo). This script refines
 * routing by reading the top 3 TASK_BOARD items (Now bucket) plus the declared
 * Session Intent from LATEST_HANDOFF and classifying the session into:
 *
 *   planning     — architecture, spec, new feature, redesign. Prefers opusplan.
 *   execution    — well-specced implementation, migration, propagation. Prefers
 *                  sonnet (or opus straight, if tier=T3).
 *   exploration  — research, debugging, discovery. Prefers opus + thinking.
 *   ops          — closeout, propagation, audit, routine maintenance. Prefers
 *                  sonnet/haiku.
 *
 * Signals are lexical — cheap, deterministic, overridable. Output feeds
 * detect-session-mode (`intentModel` field) which layers on top of tier
 * defaults.
 *
 * Usage:
 *   node scripts/classify-session-intent.mjs
 *   node scripts/classify-session-intent.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

// Pull Now bucket (top 3 lines under "## Now")
function extractNow(md) {
  const parts = md.split(/^## /m);
  const now = parts.find(p => /^Now\b/i.test(p));
  if (!now) return '';
  return now.split('\n').slice(1, 30).join('\n');
}

// Scoring dictionaries
const PLANNING = [
  'design', 'architect', 'architecture', 'spec ', 'specify', 'redesign',
  'plan ', 'blueprint', 'scope ', 'strategy', 'approach', 'rfc',
  'propose', 'proposal', 'new feature', 'migrat', 'schema change',
];
const EXECUTION = [
  'implement', 'ship ', 'wire ', 'build out', 'apply ', 'propagate',
  'rollout', 'roll out', 'integrate', 'complete task', 'finish',
  'port ', 'add endpoint', 'add route', 'write script',
];
const EXPLORATION = [
  'debug', 'investigate', 'research', 'explore', 'diagnose',
  'reproduce', 'root cause', 'why does', 'trace ', 'bisect',
  'figure out', 'understand ',
];
const OPS = [
  'closeout', 'audit', 'cleanup', 'clean up', 'refresh', 'propagate template',
  'rescore', 'lint', 'format', 'update docs', 'sanitize', 'prune',
  'housekeeping', 'chores',
];

export function classifyIntent(rootDir = process.cwd()) {
  const taskboard = readText(path.join(rootDir, 'context', 'TASK_BOARD.md'));
  const handoff = readText(path.join(rootDir, 'context', 'LATEST_HANDOFF.md'));
  const nowBucket = extractNow(taskboard);
  const intentBlock = (handoff.match(/## Session Intent[\s\S]*?(?=\n## |$)/i) || [''])[0];
  const sample = [intentBlock, nowBucket].join('\n').toLowerCase();
  const score = (dict) => dict.reduce((a, kw) => a + (sample.split(kw).length - 1), 0);
  const scores = {
    planning:    score(PLANNING),
    execution:   score(EXECUTION),
    exploration: score(EXPLORATION),
    ops:         score(OPS),
  };
  const order = ['execution', 'planning', 'ops', 'exploration'];
  let intent = order.reduce((best, k) => (scores[k] > scores[best] ? k : best), 'execution');
  if (scores[intent] === 0) intent = 'execution';
  const modelByIntent = { planning: 'opusplan', execution: 'sonnet', exploration: 'opus', ops: 'sonnet' };
  return { intent, intentModel: modelByIntent[intent], scores, sampleChars: sample.length };
}

// CLI wrapper — only when invoked directly.
const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  const JSON_MODE = process.argv.slice(2).includes('--json');
  const result = classifyIntent();
  if (JSON_MODE) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
  console.log(`classify-session-intent · ${result.intent.toUpperCase()} · prefers ${result.intentModel}`);
  console.log(`  scores: planning=${result.scores.planning} execution=${result.scores.execution} exploration=${result.scores.exploration} ops=${result.scores.ops}`);
}
