#!/usr/bin/env node
// context-meter.mjs — Session context-pressure + continuation-cost estimator
//
// Answers: "Is it cheaper to continue in this session or start a fresh one?"
//
// Heuristic (no provider API needed — all locally observable):
//
//   used_tokens        ≈ sum of bytes(context-read) + bytes(tool-outputs) + bytes(assistant-text) / 4
//   remaining_tokens   ≈ model_limit - used_tokens
//   continue_cost      ≈ used_tokens × marginal_factor (re-sent on every turn w/o cache hit)
//   fresh_cost         ≈ base_session_bootstrap + current_task_tokens
//   break_even         ≈ number of remaining turns where continue wins
//
// Inputs collected:
//   - .claude/metrics/session-{id}.jsonl     (if written by a hook — optional)
//   - context/.session-lock                  (session age + agent)
//   - logs/WORK_LOG.md tail                  (current session turn count)
//   - git diff --stat                        (working-tree churn as proxy)
//   - prompt cache stats                     (portfolio/ops/cache-cockpit.json if present)
//
// Use:
//   node scripts/context-meter.mjs           (human summary + recommendation)
//   node scripts/context-meter.mjs --json
//   node scripts/context-meter.mjs --warn-threshold=0.75

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
// Inline context window sizes — keeps this script self-contained for propagation to all project repos.
// Update here if new models are added to the studio fleet.
function contextWindowForAgent(agent) {
  if (agent === 'codex') return 1_000_000;
  if (agent === 'claude-code') return 200_000;
  return 200_000; // safe default (sonnet-200k)
}

const ROOT = process.cwd();
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const thrArg = args.find((a) => a.startsWith('--warn-threshold='));
const WARN_AT = thrArg ? parseFloat(thrArg.split('=')[1]) : 0.75;

// 1 token ≈ 4 bytes of English text. Adjust if content is dense.
const BYTES_PER_TOKEN = 4;

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function bytesOf(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
}

// --- Session identity
const lockPath = path.join(ROOT, 'context/.session-lock');
let sessionStart = Date.now();
let agent = 'unknown';
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, 'utf8');
  const m = lock.match(/session_start:\s*(\S+)/);
  const a = lock.match(/agent:\s*(\S+)/);
  if (m) sessionStart = new Date(m[1]).getTime();
  if (a) agent = a[1];
}
const limit = contextWindowForAgent(agent);
const model = agent === 'claude-code' ? (process.env.CLAUDE_CONTEXT_LIMIT === '1000000' ? 'opus-1m' : 'sonnet-200k') : agent === 'codex' ? 'codex-1m' : 'default';

// --- Used-tokens estimate (ADVISORY — heuristic only, not a real token count)
//
// Philosophy: this meter is a GUIDE, not enforcement. Agents should use
// CONSIDER_CLOSEOUT as a prompt to wrap up, not a hard stop. Only CLOSEOUT
// (≥95%) should halt work.
//
// Estimation approach:
//   Baseline  = STARTUP_BRIEF.md (sole file read at session start per v1.3)
//   Hot files = 15% of each file modified after session start — partial read proxy
//   Churn     = git diff lines × 80 bytes — tool-output volume proxy
//
// 15% weight: a file being written/updated doesn't mean it was fully re-read.
// Agents typically read targeted sections, not full files on every edit.

const HOT_FILE_WEIGHT = 0.15;
const STARTUP_BASELINE = bytesOf(path.join(ROOT, 'docs/STARTUP_BRIEF.md'));

function hotFilesBytes() {
  const dirs = ['context', 'docs', 'logs', 'portfolio'];
  let total = 0;
  for (const dir of dirs) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    try {
      for (const entry of fs.readdirSync(dirPath)) {
        const fp = path.join(dirPath, entry);
        try {
          const stat = fs.statSync(fp);
          if (stat.isFile() && stat.mtimeMs > sessionStart) {
            total += Math.round(stat.size * HOT_FILE_WEIGHT);
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }
  return total;
}

let ctxBytes = STARTUP_BASELINE + hotFilesBytes();

// Working-tree churn = proxy for tool-output volume this session
const diffStat = sh('git diff --shortstat').trim();
const churnMatch = diffStat.match(/(\d+) insertions.*?(\d+) deletions/);
const churnBytes = churnMatch ? (parseInt(churnMatch[1], 10) + parseInt(churnMatch[2], 10)) * 80 : 0;

// (c) hook-observed turns (optional)
const metricsDir = path.join(ROOT, '.claude/metrics');
let observedBytes = 0;
let turnCount = 0;
if (fs.existsSync(metricsDir)) {
  const files = fs.readdirSync(metricsDir).filter((f) => f.endsWith('.jsonl'));
  for (const f of files) {
    const events = readJsonl(path.join(metricsDir, f));
    for (const e of events) {
      observedBytes += e.bytes || 0;
      if (e.kind === 'turn') turnCount += 1;
    }
  }
}

const usedBytes = ctxBytes + churnBytes + observedBytes;
const usedTokens = Math.round(usedBytes / BYTES_PER_TOKEN);
const remaining = limit - usedTokens;
const pctUsed = usedTokens / limit;

// --- Continuation vs fresh comparison
// Continuation cost per turn: fully re-reads used context if cache miss.
// With cache hit (assume 0.5 hit rate), continuation cost ≈ usedTokens × (1 - hitRate).
const cachePath = path.join(ROOT, 'portfolio/ops/cache-cockpit.json');
let cacheHitRate = 0.5;
if (fs.existsSync(cachePath)) {
  try {
    const c = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    cacheHitRate = c.recentHitRate ?? c.hitRate ?? 0.5;
  } catch { /* keep default */ }
}

const continueCostPerTurn = Math.round(usedTokens * (1 - cacheHitRate));
// Fresh-session bootstrap: read full context stack once (roughly ctxBytes).
const freshBootstrap = Math.round(ctxBytes / BYTES_PER_TOKEN);
// Turns until fresh session pays itself off:
const breakEvenTurns = continueCostPerTurn > 0 ? Math.ceil(freshBootstrap / continueCostPerTurn) : Infinity;

// --- Recommendation
let recommendation;
let reason;
if (pctUsed >= 0.95) {
  recommendation = 'CLOSEOUT';
  reason = 'context effectively exhausted — continuation risks truncation';
} else if (pctUsed >= WARN_AT) {
  recommendation = 'CONSIDER_CLOSEOUT';
  reason = `context ${(pctUsed * 100).toFixed(0)}% used — fresh session saves ~${continueCostPerTurn} tokens/turn after ${breakEvenTurns} turns`;
} else if (pctUsed >= 0.50 && breakEvenTurns <= 3) {
  recommendation = 'CONTINUE';
  reason = `fresh would pay off after ${breakEvenTurns} turns but you\'re only at ${(pctUsed * 100).toFixed(0)}% — keep going`;
} else {
  recommendation = 'CONTINUE';
  reason = `${(pctUsed * 100).toFixed(0)}% used · ${remaining.toLocaleString()} tokens remaining`;
}

const out = {
  agent,
  model,
  limit,
  usedTokens,
  remainingTokens: remaining,
  pctUsed: +(pctUsed * 100).toFixed(1),
  turnCountObserved: turnCount,
  cacheHitRate: +cacheHitRate.toFixed(2),
  continueCostPerTurn,
  freshSessionBootstrap: freshBootstrap,
  breakEvenTurns: Number.isFinite(breakEvenTurns) ? breakEvenTurns : null,
  recommendation,
  reason,
  warnThreshold: WARN_AT,
};

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`context-meter · ${agent} (${model})`);
  console.log(`  used:        ${out.usedTokens.toLocaleString()} / ${limit.toLocaleString()} tokens (${out.pctUsed}%)`);
  console.log(`  remaining:   ${out.remainingTokens.toLocaleString()} tokens`);
  console.log(`  continue:    ~${out.continueCostPerTurn.toLocaleString()} tokens/turn (cache hit ${(cacheHitRate * 100).toFixed(0)}%)`);
  console.log(`  fresh:       ~${out.freshSessionBootstrap.toLocaleString()} tokens bootstrap`);
  console.log(`  break-even:  ${out.breakEvenTurns ?? '∞'} turns`);
  console.log(`  verdict:     ${out.recommendation} — ${out.reason}`);
}

// Exit 0 on CONTINUE, 2 on CONSIDER_CLOSEOUT, 3 on CLOSEOUT — lets hooks/skills route.
const exits = { CONTINUE: 0, CONSIDER_CLOSEOUT: 2, CLOSEOUT: 3 };
process.exit(exits[recommendation] ?? 0);
