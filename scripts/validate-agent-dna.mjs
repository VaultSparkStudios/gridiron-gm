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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DNA_DIR = path.join(REPO_ROOT, 'agents', 'dna');
const SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'templates', 'project-system', 'agent-dna.schema.json');

const STRATEGY_KEYWORDS = ['guardrail', 'trust_tier', 'scope_statement', 'budget_ceiling', 'studio-internal', 'confidential'];

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Minimal JSON-Schema checker — handles the subset we use in agent-dna.schema.json.
// Avoids pulling ajv for a repo-local 150-line schema. Good enough + zero deps.
function validateSchema(value, schema, pathPrefix = '') {
  const errs = [];
  if (schema.const !== undefined && value !== schema.const) {
    errs.push(`${pathPrefix || '/'} must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errs.push(`${pathPrefix || '/'} must be one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    if (!types.includes(actual) && !(types.includes('integer') && actual === 'number' && Number.isInteger(value))) {
      errs.push(`${pathPrefix || '/'} must be ${types.join('|')}, got ${actual}`);
      return errs;
    }
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errs.push(`${pathPrefix || '/'} must match /${schema.pattern}/`);
  }
  if (schema.format === 'uri' && typeof value === 'string' && !/^https?:\/\//.test(value)) {
    errs.push(`${pathPrefix || '/'} must be http(s) URI`);
  }
  if (schema.minLength !== undefined && typeof value === 'string' && value.length < schema.minLength) {
    errs.push(`${pathPrefix || '/'} shorter than minLength ${schema.minLength}`);
  }
  if (schema.maxLength !== undefined && typeof value === 'string' && value.length > schema.maxLength) {
    errs.push(`${pathPrefix || '/'} longer than maxLength ${schema.maxLength}`);
  }
  if (schema.minimum !== undefined && typeof value === 'number' && value < schema.minimum) {
    errs.push(`${pathPrefix || '/'} below minimum ${schema.minimum}`);
  }
  if (schema.maximum !== undefined && typeof value === 'number' && value > schema.maximum) {
    errs.push(`${pathPrefix || '/'} above maximum ${schema.maximum}`);
  }
  if (schema.maxItems !== undefined && Array.isArray(value) && value.length > schema.maxItems) {
    errs.push(`${pathPrefix || '/'} exceeds maxItems ${schema.maxItems}`);
  }
  if (schema.type === 'object' || (schema.properties && typeof value === 'object' && !Array.isArray(value))) {
    if (schema.required) {
      for (const k of schema.required) {
        if (!(k in (value || {}))) errs.push(`${pathPrefix}/${k} required`);
      }
    }
    if (schema.properties) {
      for (const [k, subSchema] of Object.entries(schema.properties)) {
        if (value && k in value) {
          errs.push(...validateSchema(value[k], subSchema, `${pathPrefix}/${k}`));
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties && value) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) errs.push(`${pathPrefix}/${k} additional property not allowed`);
      }
    }
  }
  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, i) => {
      errs.push(...validateSchema(item, schema.items, `${pathPrefix}[${i}]`));
    });
  }
  if (schema.allOf) {
    for (const sub of schema.allOf) {
      if (sub.if && sub.then) {
        const ifErrs = validateSchema(value, sub.if, pathPrefix);
        if (ifErrs.length === 0) {
          errs.push(...validateSchema(value, sub.then, pathPrefix));
        }
      }
    }
  }
  return errs;
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
      const errs = validateSchema(dna, schema);
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
