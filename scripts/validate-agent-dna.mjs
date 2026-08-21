#!/usr/bin/env node
/**
 * scripts/validate-agent-dna.mjs — AgentDNA schema validator
 *
 * Validates every agents/dna/*.json file against
 * docs/templates/project-system/agent-dna.schema.json.
 *
 * Also enforces cross-cutting rules not expressible in JSON Schema:
 *   - call_sign must be unique across all DNA files
 *   - vorn_public=true requires vorn_profile.bio_public free of strategy keywords
 *   - trust_tier=autopilot requires guardrails.confirmation_required non-empty
 *   - scope_cap_per_run <= 50 (soft ceiling, warning above 20)
 *
 * Usage:
 *   node scripts/validate-agent-dna.mjs              # validate all
 *   node scripts/validate-agent-dna.mjs <file>       # single file
 *   node scripts/validate-agent-dna.mjs --json       # machine output
 *
 * Exit 0 = all conformant. Exit 1 = any failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGENT_DNA_STRATEGY_KEYWORDS as STRATEGY_KEYWORDS } from './lib/shared-policies.mjs';
import { validateJsonSchema } from './lib/json-schema-lite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DNA_DIR = path.join(REPO_ROOT, 'agents', 'dna');
const SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'templates', 'project-system', 'agent-dna.schema.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function enforceCrossRules(dnaList) {
  const errs = [];
  const callSigns = new Map();
  const handles = new Map();
  for (const { file, dna } of dnaList) {
    const cs = dna?.identity?.call_sign;
    if (cs) {
      if (callSigns.has(cs)) errs.push(`${file}: duplicate call_sign '${cs}' (also in ${callSigns.get(cs)})`);
      else callSigns.set(cs, file);
    }
    if (dna?.vorn_public) {
      const h = dna?.vorn_profile?.handle;
      if (h) {
        if (handles.has(h)) errs.push(`${file}: duplicate vorn handle '${h}' (also in ${handles.get(h)})`);
        else handles.set(h, file);
      }
      const bio = dna?.vorn_profile?.bio_public?.toLowerCase() || '';
      for (const kw of STRATEGY_KEYWORDS) {
        if (bio.includes(kw)) errs.push(`${file}: vorn_profile.bio_public contains strategy keyword '${kw}' — sanitize before public publish`);
      }
    }
    if (dna?.trust_tier === 'autopilot') {
      const cr = dna?.guardrails?.confirmation_required || [];
      if (cr.length === 0) errs.push(`${file}: trust_tier=autopilot requires at least one guardrails.confirmation_required entry`);
    }
    const cap = dna?.guardrails?.scope_cap_per_run;
    if (cap && cap > 50) errs.push(`${file}: scope_cap_per_run=${cap} exceeds hard ceiling 50`);
  }
  return errs;
}

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const target = args.find(a => !a.startsWith('--'));
  const schema = loadJson(SCHEMA_PATH);

  let files;
  if (target) {
    files = [path.resolve(target)];
  } else if (!fs.existsSync(DNA_DIR)) {
    console.log(`No DNA directory at ${path.relative(REPO_ROOT, DNA_DIR)} — nothing to validate.`);
    process.exit(0);
  } else {
    files = fs.readdirSync(DNA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(DNA_DIR, f));
  }

  const results = [];
  const dnaList = [];
  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    try {
      const dna = loadJson(file);
      const errs = validateJsonSchema(dna, schema);
      results.push({ file: rel, ok: errs.length === 0, errors: errs });
      dnaList.push({ file: rel, dna });
    } catch (e) {
      results.push({ file: rel, ok: false, errors: [`parse error: ${e.message}`] });
    }
  }

  const crossErrs = enforceCrossRules(dnaList);

  const failCount = results.filter(r => !r.ok).length + (crossErrs.length > 0 ? 1 : 0);

  if (jsonOut) {
    console.log(JSON.stringify({ results, crossErrors: crossErrs, ok: failCount === 0 }, null, 2));
  } else {
    for (const r of results) {
      if (r.ok) console.log(`✓ ${r.file}`);
      else {
        console.log(`✗ ${r.file}`);
        for (const e of r.errors) console.log(`    ${e}`);
      }
    }
    if (crossErrs.length) {
      console.log('\nCross-file errors:');
      for (const e of crossErrs) console.log(`  ✗ ${e}`);
    }
    console.log(`\n${failCount === 0 ? '✓' : '✗'} validate-agent-dna · ${results.length} files · ${failCount} failures`);
  }

  process.exit(failCount === 0 ? 0 : 1);
}

main();
