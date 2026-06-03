#!/usr/bin/env node
/**
 * paste-credential.mjs — .txt → .env credential intake wrapper (S63e item #1).
 *
 * Canonizes the S63d pattern: founder pastes raw credential blob into
 * `secrets/<capability>-paste.txt`, this script extracts the required env
 * vars (per CAPABILITY_MAP.json), writes `secrets/<capability-family>.env`,
 * redacts the source file to a hash receipt, and stamps CAPABILITY_MAP.
 *
 * Accepts:
 *   - `KEY=value` lines
 *   - `KEY: value` lines
 *   - Loose blob with a single token (maps to first required key)
 *   - JSON blob with provider-named fields (stripe publishable/secret/webhook)
 *
 * Usage:
 *   node scripts/paste-credential.mjs <capability>               # reads secrets/<cap>-paste.txt
 *   node scripts/paste-credential.mjs <capability> --source <path>
 *   node scripts/paste-credential.mjs <capability> --json
 *   node scripts/paste-credential.mjs <capability> --dry-run     # parse + report, do not write
 *   node scripts/paste-credential.mjs --list                     # list capabilities not yet READY
 *
 * CANON S63d: NEVER ask the founder to edit `.env` by hand. This is the canonical
 * intake flow.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SECRETS_DIR = path.join(ROOT, 'secrets');
const CAP_MAP = path.join(SECRETS_DIR, 'CAPABILITY_MAP.json');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const DRY_RUN = args.includes('--dry-run');
const LIST = args.includes('--list');
const sourceIdx = args.indexOf('--source');
const SOURCE_OVERRIDE = sourceIdx >= 0 ? args[sourceIdx + 1] : null;
const CAP = args.find(a => !a.startsWith('--') && a !== SOURCE_OVERRIDE);

function readJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } }
function exitWith(obj, code = 0) { if (JSON_MODE) console.log(JSON.stringify(obj, null, 2)); else console.log(obj.message || obj); process.exit(code); }

const capMap = readJson(CAP_MAP, { capabilities: {} });

if (LIST) {
  // List capabilities that are not READY. Reuse existing resolveCapability logic inline.
  const mergedEnv = mergeEnvFiles();
  const rows = Object.entries(capMap.capabilities).map(([cap, def]) => {
    const required = def.env || [];
    const missing = required.filter(k => !mergedEnv[k]);
    return { cap, ok: missing.length === 0, missing, signupUiOnly: !!def.signupUiOnly };
  }).filter(r => !r.ok);
  if (JSON_MODE) { console.log(JSON.stringify(rows, null, 2)); process.exit(0); }
  console.log(`Capabilities not yet READY (${rows.length}):`);
  for (const r of rows) {
    const tag = r.signupUiOnly ? ' [signupUiOnly]' : '';
    console.log(`  · ${r.cap.padEnd(28)} missing: ${r.missing.join(', ')}${tag}`);
  }
  console.log(`\nTo intake one: 1) paste raw text into secrets/<cap>-paste.txt  2) node scripts/paste-credential.mjs <cap>`);
  process.exit(0);
}

if (!CAP) exitWith({ ok: false, message: 'usage: paste-credential <capability> [--source <path>] [--dry-run] [--json]  |  --list' }, 1);

const def = capMap.capabilities[CAP];
if (!def) exitWith({ ok: false, message: `unknown capability "${CAP}" — add it to secrets/CAPABILITY_MAP.json first` }, 1);
const required = def.env || [];
if (!required.length) exitWith({ ok: false, message: `capability "${CAP}" has no required env vars declared` }, 1);

// Source file: secrets/<cap>-paste.txt by default; accept secrets/<cap>.txt as fallback.
const candidateSources = SOURCE_OVERRIDE ? [SOURCE_OVERRIDE] : [
  path.join(SECRETS_DIR, `${CAP}-paste.txt`),
  path.join(SECRETS_DIR, `${CAP}.txt`),
  path.join(SECRETS_DIR, `${CAP.replace(/\./g, '-')}-paste.txt`),
  path.join(SECRETS_DIR, `${CAP.replace(/\./g, '-')}.txt`),
];
const source = candidateSources.find(p => fs.existsSync(p));
if (!source) {
  exitWith({
    ok: false,
    message: `no paste source found. Create one of:\n  ${candidateSources.map(p => `· ${p}`).join('\n  ')}\nThen re-run: node scripts/paste-credential.mjs ${CAP}`,
  }, 1);
}

const raw = fs.readFileSync(source, 'utf8').trim();
if (!raw) exitWith({ ok: false, message: `${source} is empty` }, 1);

const extracted = extractKeys(raw, required, CAP);
const missing = required.filter(k => !extracted[k]);

if (missing.length) {
  exitWith({
    ok: false,
    capability: CAP,
    required,
    extracted: Object.keys(extracted),
    missing,
    message: `Could not extract all required keys. Missing: ${missing.join(', ')}\nTried source: ${source}\nHint: add explicit KEY=value lines, or KEY: value, or a JSON block with matching fields.`,
  }, 1);
}

// Target env file: derive family from capability (prefix before first dot).
const family = CAP.split('.')[0];
const envTarget = path.join(SECRETS_DIR, `${family}.env`);

// Merge with existing values (preserve unrelated keys).
const existing = fs.existsSync(envTarget) ? parseEnv(fs.readFileSync(envTarget, 'utf8')) : {};
const merged = { ...existing, ...extracted };
const body = Object.entries(merged)
  .map(([k, v]) => `${k}=${quoteIfNeeded(v)}`)
  .join('\n') + '\n';

// Backup existing env (once per day) before overwriting.
let backup = null;
if (fs.existsSync(envTarget)) {
  backup = envTarget + '.' + new Date().toISOString().slice(0, 10) + '.bak';
  if (!fs.existsSync(backup) && !DRY_RUN) fs.copyFileSync(envTarget, backup);
}

// Redact source into a receipt: hash of content + keys extracted, no raw values.
const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
const receipt = [
  `# paste-credential receipt · ${new Date().toISOString()}`,
  `# capability: ${CAP}`,
  `# target env: ${path.relative(ROOT, envTarget)}`,
  `# keys written: ${Object.keys(extracted).join(', ')}`,
  `# source hash (sha256/16): ${hash}`,
  `# raw paste redacted. Replace with a fresh paste to re-intake.`,
  '',
].join('\n');

if (DRY_RUN) {
  exitWith({
    ok: true,
    dryRun: true,
    capability: CAP,
    source,
    envTarget,
    keysWritten: Object.keys(extracted),
    message: `DRY RUN: would write ${Object.keys(extracted).length} keys → ${envTarget}\nkeys: ${Object.keys(extracted).join(', ')}`,
  });
}

// Write env + redact source
fs.mkdirSync(SECRETS_DIR, { recursive: true });
fs.writeFileSync(envTarget, body);
try { fs.chmodSync(envTarget, 0o600); } catch { /* windows no-op */ }
fs.writeFileSync(source, receipt);

// Stamp CAPABILITY_MAP with lastIntakeAt.
try {
  if (capMap.capabilities[CAP]) {
    capMap.capabilities[CAP].lastIntakeAt = new Date().toISOString();
    fs.writeFileSync(CAP_MAP, JSON.stringify(capMap, null, 2) + '\n');
  }
} catch { /* non-fatal */ }

exitWith({
  ok: true,
  capability: CAP,
  source,
  envTarget,
  backup,
  keysWritten: Object.keys(extracted),
  message: `✓ Intake complete for ${CAP}\n  → wrote ${Object.keys(extracted).length} key(s) to ${path.relative(ROOT, envTarget)}\n  → redacted source ${path.relative(ROOT, source)}${backup ? `\n  → backup ${path.relative(ROOT, backup)}` : ''}\n  Run: node scripts/check-secrets.mjs --for ${CAP}  to verify.`,
});

// ── helpers ────────────────────────────────────────────────────────────────

function mergeEnvFiles() {
  const out = {};
  if (!fs.existsSync(SECRETS_DIR)) return out;
  for (const f of fs.readdirSync(SECRETS_DIR)) {
    if (!f.endsWith('.env') || f.startsWith('.')) continue;
    Object.assign(out, parseEnv(fs.readFileSync(path.join(SECRETS_DIR, f), 'utf8')));
  }
  return out;
}

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

function quoteIfNeeded(v) {
  if (/[\s"'#]/.test(v)) return '"' + v.replace(/"/g, '\\"') + '"';
  return v;
}

// Known provider aliases: if a paste uses provider-vocabulary instead of our env names.
const ALIAS_MAP = {
  'stripe.checkout': {
    'sk_live': 'STRIPE_SECRET_KEY', 'sk_test': 'STRIPE_SECRET_KEY',
    'pk_live': 'STRIPE_PUBLISHABLE_KEY', 'pk_test': 'STRIPE_PUBLISHABLE_KEY',
    'whsec_': 'STRIPE_WEBHOOK_SECRET',
    'Secret key': 'STRIPE_SECRET_KEY',
    'Publishable key': 'STRIPE_PUBLISHABLE_KEY',
    'Signing secret': 'STRIPE_WEBHOOK_SECRET',
  },
  'resend.email': { 're_': 'RESEND_API_KEY', 'API key': 'RESEND_API_KEY' },
  'claude.api':    { 'sk-ant-': 'ANTHROPIC_API_KEY' },
};

function extractKeys(raw, required, cap) {
  const out = {};

  // 1. Try JSON first
  try {
    const j = JSON.parse(raw);
    for (const k of required) {
      if (j[k]) out[k] = String(j[k]);
      // case-insensitive variants
      const found = Object.entries(j).find(([kk]) => kk.toLowerCase() === k.toLowerCase());
      if (found && !out[k]) out[k] = String(found[1]);
    }
  } catch { /* not JSON */ }

  // 2. KEY=value / KEY: value lines
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z][A-Z0-9_]+)\s*[:=]\s*(.+)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (required.includes(m[1])) out[m[1]] = val;
  }

  // 3. Provider-label lines (e.g. "Secret key: sk_live_...")
  const aliases = ALIAS_MAP[cap] || {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    for (const [labelOrPrefix, targetKey] of Object.entries(aliases)) {
      if (out[targetKey]) continue;
      if (line.toLowerCase().startsWith(labelOrPrefix.toLowerCase()) && /[:=]/.test(line)) {
        const val = line.split(/[:=]/).slice(1).join(':').trim();
        if (val) out[targetKey] = val;
      }
    }
  }

  // 4. Token-prefix inference on whole tokens (last resort)
  const tokens = raw.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    for (const [prefix, targetKey] of Object.entries(aliases)) {
      if (out[targetKey]) continue;
      if (tok.startsWith(prefix)) out[targetKey] = tok;
    }
  }

  // 5. Single-token fallback: if paste is ONE token and exactly one key is required
  if (required.length === 1 && !out[required[0]]) {
    const single = raw.trim();
    if (!/\s/.test(single) && single.length >= 8) out[required[0]] = single;
  }

  return out;
}
