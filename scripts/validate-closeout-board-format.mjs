#!/usr/bin/env node
/**
 * validate-closeout-board-format.mjs
 *
 * Canonical-format gate for closeout status-board output. Accepts a file path
 * or stdin so both generated artifacts and assistant-produced output can be
 * checked against the shared Studio OS closeout shape.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const STDIN_MODE = args.includes('--stdin');
const positional = args.filter((a) => !a.startsWith('--'));
const targetPath = positional[0] || path.join(ROOT, 'docs', 'CLOSEOUT_STATUS_BOARD.md');

const REQUIRED_BLOCKS = [
  { label: 'SESSION CLOSEOUT header', pattern: /SESSION CLOSEOUT/ },
  { label: 'WHAT SHIPPED block', pattern: /WHAT SHIPPED/ },
  { label: 'SCORES block', pattern: /SCORES/ },
  { label: 'WRITE-BACK STATUS block', pattern: /WRITE-BACK STATUS/ },
  { label: 'GIT STATUS block', pattern: /GIT STATUS/ },
  { label: 'POST-SESSION SIGNALS block', pattern: /POST-SESSION SIGNALS/ },
  { label: 'NEXT SESSION block', pattern: /NEXT SESSION/ },
];

function looksLikeBoxBoard(body) {
  const boxChars = (body.match(/[╔╗╚╝║═╠╣]/g) || []).length;
  return boxChars >= 40;
}

export function validateCloseoutBoard(body) {
  const missingRequired = REQUIRED_BLOCKS.filter((block) => !block.pattern.test(body)).map((block) => block.label);
  const bodyShape = looksLikeBoxBoard(body)
    ? null
    : 'closeout output does not contain box-drawing characters — likely not the canonical status board';
  return {
    ok: missingRequired.length === 0 && bodyShape === null,
    missingRequired,
    bodyShape,
  };
}

async function readTarget() {
  if (STDIN_MODE) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(chunk));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      process.stdin.on('error', reject);
    });
  }
  if (!fs.existsSync(targetPath)) {
    throw new Error(`closeout board not found: ${targetPath}`);
  }
  return fs.readFileSync(targetPath, 'utf8');
}

async function main() {
  let body;
  try {
    body = await readTarget();
  } catch (err) {
    if (JSON_MODE) {
      process.stdout.write(JSON.stringify({ ok: false, error: err.message, source: targetPath }, null, 2) + '\n');
    } else {
      console.error(`✗ ${err.message}`);
    }
    process.exit(2);
  }

  const result = validateCloseoutBoard(body);
  const { missingRequired, bodyShape } = result;
  const fail = !result.ok;

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({
      ok: result.ok,
      source: STDIN_MODE ? '<stdin>' : targetPath,
      missingRequired,
      bodyShape,
    }, null, 2) + '\n');
  } else {
    const label = STDIN_MODE ? '<stdin>' : path.relative(process.cwd(), targetPath);
    console.log(`validate-closeout-board-format · ${label}`);
    console.log('─'.repeat(56));
    if (bodyShape) console.log(`  ⛔  ${bodyShape}`);
    if (missingRequired.length > 0) {
      console.log('  ⛔  missing required blocks:');
      for (const block of missingRequired) {
        console.log(`       - ${block}`);
      }
    }
    if (!fail) {
      console.log('  ✓   conformant — all required canonical closeout blocks present');
    } else {
      console.log('');
      console.log('  Repair path: regenerate the closeout status board in canonical box-drawing format.');
    }
  }

  process.exit(fail ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
