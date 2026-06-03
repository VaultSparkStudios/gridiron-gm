#!/usr/bin/env node
/**
 * probe-capability.mjs — live-provider capability acceptance tests (S63e #2).
 *
 * `check-secrets.mjs` tells us whether the .env file contains the required
 * variables. It does NOT prove the credential actually authenticates with the
 * provider — a fat-fingered paste or a revoked key still presents as READY.
 *
 * This script closes that gap by issuing a lightweight, non-destructive API
 * call per capability and recording the outcome:
 *
 *   ok          — provider responded 2xx (credential authenticated)
 *   auth-error  — provider responded 401/403 (credential invalid/revoked)
 *   unreachable — network error / timeout / 5xx
 *   skipped     — capability not yet READY, or no probe implemented
 *
 * Results append to `portfolio/ops/capability-probes.ndjson` and refresh the
 * `lastProbeAt` / `lastProbeStatus` fields on `secrets/CAPABILITY_MAP.json`.
 *
 * Probes are defined inline per capability so the script has zero surprise
 * dependencies. Every probe:
 *   - uses a READ-ONLY endpoint (no mutation)
 *   - has an 8-second timeout
 *   - redacts the credential from all output
 *
 * Usage:
 *   node scripts/probe-capability.mjs --all
 *   node scripts/probe-capability.mjs --for claude.api
 *   node scripts/probe-capability.mjs --all --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCapability, getSecret, redact } from './lib/secrets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CAP_MAP_PATH = path.join(ROOT, 'secrets', 'CAPABILITY_MAP.json');
const LEDGER = path.join(ROOT, 'portfolio', 'ops', 'capability-probes.ndjson');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const ALL = args.includes('--all');
const forIdx = args.indexOf('--for');
const FILTER = forIdx >= 0 ? args[forIdx + 1] : null;
const TIMEOUT_MS = 8000;

if (!ALL && !FILTER) {
  console.log('usage: probe-capability --all  |  --for <capability>  [--json]');
  process.exit(1);
}

// ── Probe registry ────────────────────────────────────────────────────────
// Each entry returns { ok, status, detail } after calling the provider.
const PROBES = {
  'claude.api': async () => {
    const key = getSecret('ANTHROPIC_API_KEY', 'claude.api');
    const r = await httpFetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
    return interpret(r);
  },
  'stripe.checkout': async () => {
    const key = getSecret('STRIPE_SECRET_KEY', 'stripe.checkout');
    const r = await httpFetch('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'cloudflare.deploy': async () => {
    const key = getSecret('CLOUDFLARE_API_TOKEN', 'cloudflare.deploy');
    const r = await httpFetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'cloudflare.dns': async () => {
    const key = getSecret('CLOUDFLARE_DNS_TOKEN', 'cloudflare.dns');
    const r = await httpFetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'cloudflare.r2': async () => {
    // R2 S3-compat endpoint requires AWS SigV4 — probe via account metadata instead.
    const token = getSecret('CLOUDFLARE_API_TOKEN', 'cloudflare.deploy') || getSecret('CLOUDFLARE_DNS_TOKEN', 'cloudflare.dns');
    if (!token) return { ok: false, status: 'skipped', detail: 'no CF token to verify R2 account' };
    const accountId = getSecret('R2_ACCOUNT_ID', 'cloudflare.r2');
    if (!accountId) return { ok: false, status: 'auth-error', detail: 'R2_ACCOUNT_ID missing' };
    const r = await httpFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: { Authorization: `Bearer ${token}` } });
    return interpret(r);
  },
  'resend.email': async () => {
    const key = getSecret('RESEND_API_KEY', 'resend.email');
    const r = await httpFetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'github.api': async () => {
    const key = getSecret('GITHUB_TOKEN', 'github.api') || getSecret('GH_TOKEN', 'github.api');
    const r = await httpFetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'vaultspark-probe' } });
    return interpret(r);
  },
  'openai.api': async () => {
    const key = getSecret('OPENAI_API_KEY', 'openai.api');
    const r = await httpFetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'supabase.admin': async () => {
    const url = getSecret('SUPABASE_URL', 'supabase.admin');
    const key = getSecret('SUPABASE_SERVICE_KEY', 'supabase.admin') || getSecret('SUPABASE_ANON_KEY', 'supabase.admin');
    if (!url || !key) return { ok: false, status: 'auth-error', detail: 'SUPABASE_URL or key missing' };
    const r = await httpFetch(`${url.replace(/\/$/, '')}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'posthog.api': async () => {
    const key = getSecret('POSTHOG_PERSONAL_API_KEY', 'posthog.api') || getSecret('POSTHOG_API_KEY', 'posthog.api');
    const r = await httpFetch('https://app.posthog.com/api/users/@me/', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'hetzner.cloud': async () => {
    const key = getSecret('HETZNER_API_TOKEN', 'hetzner.cloud');
    const r = await httpFetch('https://api.hetzner.cloud/v1/locations', { headers: { Authorization: `Bearer ${key}` } });
    return interpret(r);
  },
  'brevo.email': async () => {
    const key = getSecret('BREVO_API_KEY', 'brevo.email');
    const r = await httpFetch('https://api.brevo.com/v3/account', { headers: { 'api-key': key } });
    return interpret(r);
  },
  'namecheap.api': async () => {
    return { ok: false, status: 'skipped', detail: 'Namecheap API requires per-call IP allowlist — probe not safe' };
  },
  'google.gmail': async () => {
    // OAuth flow not probable without interactive consent.
    return { ok: false, status: 'skipped', detail: 'OAuth bearer; probed via scripts/test-gmail-send.mjs' };
  },
  'google.calendar': async () => {
    return { ok: false, status: 'skipped', detail: 'OAuth bearer; probed via scripts/test-calendar-read.mjs' };
  },
  'google.drive': async () => {
    return { ok: false, status: 'skipped', detail: 'OAuth bearer; probed via scripts/test-drive-read.mjs' };
  },
};

async function httpFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await r.text().catch(() => '');
    return { status: r.status, ok: r.ok, bodyPreview: text.slice(0, 200) };
  } catch (e) {
    return { status: 0, ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(to); }
}

function interpret(r) {
  if (r.error) return { ok: false, status: 'unreachable', detail: r.error };
  if (r.status === 401 || r.status === 403) return { ok: false, status: 'auth-error', detail: `HTTP ${r.status}` };
  if (r.status >= 500) return { ok: false, status: 'unreachable', detail: `HTTP ${r.status}` };
  if (r.status >= 200 && r.status < 300) return { ok: true, status: 'ok', detail: `HTTP ${r.status}` };
  return { ok: false, status: 'auth-error', detail: `HTTP ${r.status}` };
}

// ── Main ────────────────────────────────────────────────────────────────
const capMap = JSON.parse(fs.readFileSync(CAP_MAP_PATH, 'utf8'));
const caps = FILTER ? [FILTER] : Object.keys(capMap.capabilities);

const results = [];
for (const cap of caps) {
  const resolved = resolveCapability(cap);
  if (!resolved.ok) {
    results.push({ cap, status: 'skipped', detail: `missing env: ${resolved.missing.join(', ')}`, checkedAt: new Date().toISOString() });
    continue;
  }
  const probe = PROBES[cap];
  if (!probe) {
    results.push({ cap, status: 'skipped', detail: 'no probe implemented', checkedAt: new Date().toISOString() });
    continue;
  }
  let result;
  try {
    result = await probe();
  } catch (e) {
    result = { ok: false, status: 'unreachable', detail: e.message };
  }
  const entry = { cap, status: result.status, ok: result.ok, detail: redact(result.detail || ''), checkedAt: new Date().toISOString() };
  results.push(entry);
  // Stamp capability map
  capMap.capabilities[cap].lastProbeAt = entry.checkedAt;
  capMap.capabilities[cap].lastProbeStatus = entry.status;
}

// Persist
try {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  for (const r of results) fs.appendFileSync(LEDGER, JSON.stringify(r) + '\n');
} catch { /* non-fatal */ }
try { fs.writeFileSync(CAP_MAP_PATH, JSON.stringify(capMap, null, 2) + '\n'); } catch { /* non-fatal */ }

if (JSON_MODE) { console.log(JSON.stringify(results, null, 2)); process.exit(0); }

const counts = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
console.log(`probe-capability · ${results.length} probed`);
console.log('─'.repeat(72));
for (const r of results) {
  const badge = { ok: '✓ ok        ', 'auth-error': '⛔ auth-error', unreachable: '⚠ unreachable', skipped: '= skipped   ' }[r.status] || r.status;
  console.log(`  ${badge} ${r.cap.padEnd(28)} ${r.detail}`);
}
console.log('─'.repeat(72));
console.log('summary:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' · '));
