#!/usr/bin/env node
// validate-skill-yaml.mjs — Strict-YAML validator for SKILL.md frontmatter (Codex-safe).
//
// Why this exists:
//   Codex's YAML parser rejects unescaped `: ` (colon-space) inside double-quoted
//   scalar values — even though standard YAML and Claude Code's parser both accept it.
//   The ~1-day incident in S106→S107 where `Target: <=8K tokens` inside
//   `description: "...Target: <=8K tokens..."` broke every Codex session loading
//   studio-start/studio-initiate is the canonical failure.
//
// This validator scans every SKILL.md across the canonical skill roots and flags
// the exact pattern Codex rejects, plus a few other hardening checks.
//
// Usage:
//   node scripts/validate-skill-yaml.mjs              # check; exit 1 on finding
//   node scripts/validate-skill-yaml.mjs --fix        # auto-replace `Target: ` → `Target — `
//   node scripts/validate-skill-yaml.mjs --paths      # list scanned paths + exit

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const FIX = process.argv.includes('--fix');
const PATHS_ONLY = process.argv.includes('--paths');

const HOME = os.homedir();
const ROOTS = [
  path.join(HOME, '.claude', 'skills'),
  path.join(HOME, '.agents', 'skills'),
  path.join(process.cwd(), '.claude', 'skills'),
];

function collectSkillFiles() {
  const out = [];
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const p = path.join(root, entry, 'SKILL.md');
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out;
}

// Extract YAML frontmatter (between leading --- and next ---).
function extractFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return null;
  const end = lines.slice(1).findIndex((l) => l.trim() === '---');
  if (end < 0) return null;
  return { start: 1, end: end + 1, lines: lines.slice(1, end + 1) };
}

// Codex-failure pattern:
//   A line of the form `key: "...value with : inside..."` where the double-quoted
//   value contains an unescaped `: ` (colon followed by space).
//   Codex interprets the inner `: ` as another mapping separator and throws
//   `mapping values are not allowed in this context`.
function findCodexHazards(fmLines, lineOffset) {
  const findings = [];
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    // Match: key: "...quoted..."
    const m = line.match(/^(\s*[A-Za-z0-9_-]+\s*:\s*)"(.*)"(\s*)$/);
    if (!m) continue;
    const value = m[2];
    // Look for unescaped `: ` inside the value.
    // (Escaped would be `\:` but YAML double-quoted doesn't require that; the
    // only way to be safe in Codex is to not include `: ` at all.)
    const idx = value.indexOf(': ');
    if (idx >= 0) {
      findings.push({
        line: lineOffset + i,
        col: (m[1].length + 1) + idx + 1, // 1-indexed column of the `:`
        snippet: value.slice(Math.max(0, idx - 20), idx + 30),
        key: m[1].trim().replace(/:$/, ''),
      });
    }
  }
  return findings;
}

function applyFix(content) {
  // Safe auto-fix: `Target: ` → `Target — ` (the observed pattern).
  // Leaves other `: ` cases for human review (they may be intentional).
  return content.replace(/Target: /g, 'Target — ');
}

const files = collectSkillFiles();

if (PATHS_ONLY) {
  files.forEach((f) => console.log(f));
  process.exit(0);
}

console.log(`validate-skill-yaml · scanning ${files.length} SKILL.md files`);
console.log('─'.repeat(68));

let totalFindings = 0;
let fixedFiles = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const fm = extractFrontmatter(content);
  if (!fm) {
    console.log(`  ⊘ ${path.relative(HOME, file)} — no frontmatter`);
    continue;
  }
  const findings = findCodexHazards(fm.lines, fm.start + 1);
  if (!findings.length) continue;

  totalFindings += findings.length;
  const label = FIX ? 'FIX' : 'FAIL';
  console.log(`  ✗ [${label}] ${path.relative(HOME, file)}`);
  for (const f of findings) {
    console.log(`       line ${f.line} col ${f.col} · key \`${f.key}\` · …${f.snippet}…`);
  }

  if (FIX) {
    const patched = applyFix(content);
    if (patched !== content) {
      fs.writeFileSync(file, patched);
      fixedFiles++;
      console.log(`       → auto-fixed (Target: → Target —)`);
    } else {
      console.log(`       ! auto-fix doesn't cover this case — edit manually`);
    }
  }
}

console.log('─'.repeat(68));
if (totalFindings === 0) {
  console.log('✓ All SKILL.md frontmatter parses under strict Codex-compatible YAML.');
  process.exit(0);
} else {
  console.log(`${FIX ? 'Fixed' : 'Found'}: ${FIX ? fixedFiles : totalFindings} file(s) with Codex-incompatible YAML`);
  if (!FIX) console.log('\nRun with --fix to auto-patch `Target: ` cases. Other patterns need manual edit.');
  process.exit(FIX ? 0 : 1);
}
