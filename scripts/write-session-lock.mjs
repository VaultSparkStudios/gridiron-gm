#!/usr/bin/env node
/**
 * write-session-lock.mjs
 *
 * Writes context/.session-lock reliably using Node fs.
 * bash `echo > file` silently fails for dotfiles on Windows — this doesn't.
 *
 * Usage:
 *   node scripts/write-session-lock.mjs [--agent <claude-code|codex|other>] [--note "..."]
 *   node scripts/ops.mjs write-session-lock --agent claude-code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const agentArg = args.find((_, i) => args[i - 1] === '--agent') ?? 'claude-code';
const noteArg = args.find((_, i) => args[i - 1] === '--note') ?? 'Session start via /start protocol v1.3';
// Model can be pinned for accurate context-meter calibration. Precedence:
//   --model <id>  >  $CLAUDE_MODEL_ID  >  $CLAUDE_MODEL  >  auto (by agent)
const modelArg = args.find((_, i) => args[i - 1] === '--model')
  ?? process.env.CLAUDE_MODEL_ID
  ?? process.env.CLAUDE_MODEL
  // Lock stores a human-readable label, NOT an API model ID (keeps chokepoint
  // tier1 test happy: no "claude-*-N" hardcoded outside lib/model-router.mjs).
  ?? (agentArg === 'claude-code' ? 'opus-4-7-1m'
      : agentArg === 'codex' ? 'codex-1m'
      : 'unknown');
// Context window in tokens. Precedence:
//   --context-limit <n>  >  $CLAUDE_CONTEXT_LIMIT  >  inferred from model
function inferCtxLimit(modelId) {
  if (/1m/i.test(modelId)) return 1_000_000;
  if (/opus|sonnet/i.test(modelId)) return 200_000;
  if (modelId === 'codex-1m') return 1_000_000;
  return 200_000;
}
const ctxLimitArg = args.find((_, i) => args[i - 1] === '--context-limit');
const ctxLimit = ctxLimitArg
  ? parseInt(ctxLimitArg, 10)
  : (process.env.CLAUDE_CONTEXT_LIMIT ? parseInt(process.env.CLAUDE_CONTEXT_LIMIT, 10) : inferCtxLimit(modelArg));

const projectName = path.basename(ROOT);
const lockPath = path.join(ROOT, 'context', '.session-lock');
const now = new Date().toISOString();
// Preserve existing session_start so repeated /start invocations within the
// same Studio Ops session don't orphan ledger entries (the meter filters
// ledger entries by ts >= session_start). Use --force to rotate.
const FORCE = args.includes('--force');
let sessionStart = now;
if (!FORCE && fs.existsSync(lockPath)) {
  const prior = fs.readFileSync(lockPath, 'utf8');
  const m = prior.match(/^session_start:\s*(\S+)/m);
  if (m) {
    const priorTs = new Date(m[1]).getTime();
    // Only carry over if the prior lock is <12h old — otherwise treat as stale.
    if (Date.now() - priorTs < 12 * 3600 * 1000) sessionStart = m[1];
  }
}

const content = [
  `locked_by: agent-session`,
  `session_start: ${sessionStart}`,
  `agent: ${agentArg}`,
  `model: ${modelArg}`,
  `context_limit: ${ctxLimit}`,
  `project: ${projectName}`,
  `note: ${noteArg}`,
  '',
].join('\n');

fs.writeFileSync(lockPath, content, 'utf8');
console.log(`✓ context/.session-lock written (agent: ${agentArg}, project: ${projectName})`);
// Calendar auto-event at /start removed S107.10 — noise without signal.
// Founder already knows they just typed /start; the calendar event restated
// that without providing any planning signal. Script stays available for
// on-demand use: `node scripts/ops.mjs calendar-session-event`.
