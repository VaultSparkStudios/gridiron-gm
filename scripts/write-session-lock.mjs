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

const projectName = path.basename(ROOT);
const now = new Date().toISOString();

const content = [
  `locked_by: agent-session`,
  `session_start: ${now}`,
  `agent: ${agentArg}`,
  `project: ${projectName}`,
  `note: ${noteArg}`,
  '',
].join('\n');

const lockPath = path.join(ROOT, 'context', '.session-lock');
fs.writeFileSync(lockPath, content, 'utf8');
console.log(`✓ context/.session-lock written (agent: ${agentArg}, project: ${projectName})`);
