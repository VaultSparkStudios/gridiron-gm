#!/usr/bin/env node
/**
 * mark-plan-mode.mjs — founder self-attest that /model opusplan was run.
 *
 * Claude Code transcripts may be located outside the detection scope (e.g.
 * running from a nested worktree). This tiny script stamps the session lock
 * with `plan_mode_confirmed: true` so verify-plan-mode.mjs can flip ACTIVE
 * without fragile transcript scraping.
 *
 * Usage:
 *   node scripts/mark-plan-mode.mjs           # stamp active
 *   node scripts/mark-plan-mode.mjs --unset   # clear
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const lockPath = path.join(ROOT, 'context', '.session-lock');
const unset = process.argv.includes('--unset');

if (!fs.existsSync(lockPath)) {
  console.error('no session lock found — run /start first');
  process.exit(1);
}

let text = fs.readFileSync(lockPath, 'utf8');
if (unset) {
  text = text.replace(/plan_mode_confirmed:\s*\S+\n?/g, '');
} else if (/plan_mode_confirmed:\s*\S+/.test(text)) {
  text = text.replace(/plan_mode_confirmed:\s*\S+/, 'plan_mode_confirmed: true');
} else {
  text = text.trimEnd() + `\nplan_mode_confirmed: true\nplan_mode_confirmed_at: ${new Date().toISOString()}\n`;
}
fs.writeFileSync(lockPath, text);
console.log(unset ? 'plan-mode mark cleared' : 'plan-mode confirmed in session lock — verify-plan-mode will report ACTIVE');
