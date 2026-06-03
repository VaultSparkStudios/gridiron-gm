#!/usr/bin/env node
/**
 * blocker-preflight.mjs
 *
 * Mandatory preflight for anything that looks "human-blocked".
 * Converts vague blocker lists into a consistent attempt order:
 *   1. secrets discovery
 *   2. elevated/admin probe
 *   3. only then true human escalation
 *
 * Usage:
 *   node scripts/blocker-preflight.mjs
 *   node scripts/blocker-preflight.mjs --json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapability } from './lib/secrets.mjs';
import { classifyBlocker, summarizeAttemptOrder } from './lib/blocker-rules.mjs';
import { parseHumanItems } from './lib/task-board.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TASK_BOARD = path.join(ROOT, 'context', 'TASK_BOARD.md');
const jsonMode = process.argv.includes('--json');

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function resolveCapabilities(capabilities) {
  return capabilities.map((capability) => ({
    capability,
    ...resolveCapability(capability),
  }));
}

const items = parseHumanItems(readText(TASK_BOARD)).map((item) => {
  const info = classifyBlocker(`${item.title} ${item.description}`);
  const capabilityResults = resolveCapabilities(info.capabilities);
  const autoReady = capabilityResults.length > 0 && capabilityResults.every((entry) => entry.ok);
  // signupUiOnly: capability requires Studio Owner to register at a third-party
  // dashboard before keys exist. If the keys are MISSING AND signupUiOnly, the
  // agent cannot "try first" — the elevated-access rule doesn't apply.
  const signupUiOnly = Boolean(info.signupUiOnly);
  const capabilitiesMissing = capabilityResults.length > 0 && capabilityResults.some((entry) => !entry.ok);
  const effectivelyAttemptable = info.attemptable && !(signupUiOnly && capabilitiesMissing);

  return {
    ...item,
    category: info.category,
    attemptable: effectivelyAttemptable,
    signupUiOnly,
    elevatedProbe: info.elevatedProbe,
    probeCommands: info.probeCommands,
    capabilityResults,
    autoReady,
    attemptOrder: summarizeAttemptOrder(`${item.title} ${item.description}`),
  };
});

if (jsonMode) {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    items,
  }, null, 2));
  process.exit(0);
}

const lines = [
  `<!-- generated-by: scripts/blocker-preflight.mjs -->`,
  `<!-- generated-at: ${new Date().toISOString().slice(0, 10)} -->`,
  '',
  '# Blocker Preflight',
  '',
  '> Mandatory protocol: before labeling any item human-blocked, try secrets discovery first, then an elevated/admin probe where safe.',
  '',
  `Open Human Action Required items: **${items.length}**`,
  '',
  '---',
  '',
];

for (const item of items) {
  lines.push(`## ${item.autoReady ? '⚡' : item.attemptable ? '⚠' : '•'} ${item.title}`);
  lines.push('');
  lines.push(`- **Category:** ${item.category}`);
  lines.push(`- **Current classification:** ${item.autoReady ? 'agent-attemptable now' : item.attemptable ? 'agent should try first' : item.signupUiOnly ? 'true human-only (dashboard signup required)' : 'true human-only unless new access appears'}`);
  if (item.capabilityResults.length > 0) {
    lines.push(`- **Capabilities:** ${item.capabilityResults.map((entry) => `${entry.capability}=${entry.ok ? 'READY' : 'MISSING'}`).join(' · ')}`);
  } else {
    lines.push(`- **Capabilities:** none mapped`);
  }
  lines.push(`- **Elevated/admin probe:** ${item.elevatedProbe}`);
  if (item.probeCommands.length > 0) {
    lines.push('- **Probe commands:**');
    for (const command of item.probeCommands) {
      lines.push(`  - \`${command}\``);
    }
  }
  lines.push('- **Attempt order:**');
  for (const step of item.attemptOrder) {
    lines.push(`  - ${step}`);
  }
  lines.push('');
}

console.log(lines.join('\n'));
