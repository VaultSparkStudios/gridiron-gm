#!/usr/bin/env node
/**
 * check-secrets.mjs — Secrets discovery CLI (v3.1)
 *
 * Agents MUST run this (or call `resolveCapability` from lib/secrets.mjs)
 * before labeling a task "Human Action Required". AGENTS.md v3.1 rule.
 *
 * Usage:
 *   node scripts/check-secrets.mjs                        # list all capabilities
 *   node scripts/check-secrets.mjs --for <capability>     # check one
 *   node scripts/check-secrets.mjs --json                 # machine output
 *   node scripts/check-secrets.mjs --for claude.api --json
 */

import { listCapabilities, resolveCapability } from './lib/secrets.mjs';

const args = process.argv.slice(2);
const capArg = args.includes('--for') ? args[args.indexOf('--for') + 1] : null;
const json = args.includes('--json');

function render(rows) {
  if (json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return;
  }
  const cols = [
    ['Capability', 32],
    ['Status',      10],
    ['Keys present', 42],
  ];
  const line = cols.map(([h, w]) => h.padEnd(w)).join(' ');
  const sep  = cols.map(([, w]) => '─'.repeat(w)).join(' ');
  console.log('\n' + line);
  console.log(sep);
  for (const r of rows) {
    const status = r.ok ? '✓ READY   ' : (r.found.length ? '⚠ PARTIAL ' : '⛔ MISSING ');
    const keys = r.ok
      ? `${r.found.length}/${r.required.length} all present`
      : r.missing.length > 3
        ? `missing ${r.missing.length}: ${r.missing.slice(0, 2).join(', ')}…`
        : `missing: ${r.missing.join(', ')}`;
    console.log(
      r.capability.padEnd(32) + ' ' +
      status.padEnd(10) + ' ' +
      keys.padEnd(42)
    );
  }
  console.log('');
  const ready = rows.filter(r => r.ok).length;
  console.log(`${ready}/${rows.length} capabilities ready. Missing → see docs/STUDIO_CANON.md + TASK_BOARD Human Action Required.`);
  console.log('');
}

if (capArg) {
  const result = resolveCapability(capArg);
  render([{ capability: capArg, ...result }]);
  process.exit(result.ok ? 0 : 1);
} else {
  const rows = listCapabilities();
  render(rows);
  process.exit(0);
}
