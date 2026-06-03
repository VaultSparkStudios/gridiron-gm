/**
 * model-router.mjs
 *
 * Centralised Claude model selection for all Studio Ops scripts.
 * Prevents hardcoded model IDs scattered across scripts and enables
 * studio-wide model upgrades in one place.
 *
 * Rules:
 *   COMPLEX  → claude-opus-4-6    (strategy, deep analysis, extended thinking)
 *   MODERATE → claude-sonnet-4-6  (implementation, code, Q&A, most work)
 *   SIMPLE   → claude-haiku-4-5-20251001  (validations, lookups, quick checks)
 *
 * Usage:
 *   import { selectModel, MODELS, buildCacheHeaders } from './lib/model-router.mjs';
 *   const model = selectModel('complex');
 *
 * This file is the SINGLE allowed chokepoint for Anthropic API access.
 * The `studio-os-enforcer.yml` CI workflow greps `scripts/` for direct
 * `api.anthropic.com` / `@anthropic-ai/sdk` / hardcoded claude-* model IDs
 * and fails the build if they appear in any file other than this one.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_DEFAULT = path.resolve(__dirname, '..', '..', 'docs', 'cache-ledger.ndjson');

export const MODELS = {
  opus:   'claude-opus-4-7',
  sonnet: 'claude-sonnet-4-6',
  haiku:  'claude-haiku-4-5-20251001',
};

/**
 * Context window sizes (tokens), keyed by resolved model ID or agent name.
 * Kept here — alongside MODELS — so the chokepoint remains the single place
 * that knows anything model-specific. Consumers (e.g. scripts/context-meter.mjs)
 * import this instead of hardcoding their own map.
 */
export const CONTEXT_WINDOWS = {
  [MODELS.opus]:   200_000,
  [MODELS.sonnet]: 200_000,
  [MODELS.haiku]:  200_000,
  'opus-1m':       1_000_000,
  'codex-1m':      1_000_000,
  default:         200_000,
};

export function contextWindowForAgent(agent) {
  // Env override: CLAUDE_CONTEXT_LIMIT=1000000 for Max/extended-context plans
  if (process.env.CLAUDE_CONTEXT_LIMIT) return parseInt(process.env.CLAUDE_CONTEXT_LIMIT, 10);
  // Studio Ops founder runs Opus 4.7 (1M context) exclusively across Claude Code sessions.
  // Set CLAUDE_CONTEXT_LIMIT=200000 to pin to the legacy 200K window.
  if (agent === 'claude-code') return CONTEXT_WINDOWS['opus-1m'];
  if (agent === 'codex') return CONTEXT_WINDOWS['codex-1m'];
  return CONTEXT_WINDOWS.default;
}

/**
 * Anthropic list-price per 1M tokens, keyed by resolved model ID.
 * Kept here — alongside MODELS — so the chokepoint remains the single place
 * in scripts/ that references claude-* model IDs verbatim.
 */
export const PRICING_PER_MTOK = {
  [MODELS.opus]:   { input: 15.00, cacheWrite: 18.75, cacheRead: 1.50, output: 75.00 },
  [MODELS.sonnet]: { input:  3.00, cacheWrite:  3.75, cacheRead: 0.30, output: 15.00 },
  [MODELS.haiku]:  { input:  1.00, cacheWrite:  1.25, cacheRead: 0.10, output:  5.00 },
};
// Batch API pricing: 50% discount on input/output (cache pricing unchanged)
export const BATCH_PRICING_PER_MTOK = Object.fromEntries(
  Object.entries(PRICING_PER_MTOK).map(([model, p]) => [
    model,
    { ...p, input: p.input * 0.5, output: p.output * 0.5 },
  ])
);
export const FALLBACK_PRICE = PRICING_PER_MTOK[MODELS.sonnet];

/**
 * Short human-friendly name for a model ID ("opus" / "sonnet" / "haiku").
 */
export function shortModelName(id) {
  if (id?.startsWith('claude-opus'))   return 'opus';
  if (id?.startsWith('claude-sonnet')) return 'sonnet';
  if (id?.startsWith('claude-haiku'))  return 'haiku';
  return id || 'unknown';
}

/**
 * Select model by task complexity tier.
 * @param {'complex'|'moderate'|'simple'} complexity
 * @returns {string} model ID
 */
export function selectModel(complexity = 'moderate') {
  switch (complexity) {
    case 'complex':  return MODELS.opus;
    case 'moderate': return MODELS.sonnet;
    case 'simple':   return MODELS.haiku;
    default:         return MODELS.sonnet;
  }
}

/**
 * Infer complexity from question/task text.
 * @param {string} text
 * @returns {'complex'|'moderate'|'simple'}
 */
export function inferComplexity(text) {
  const lower = text.toLowerCase();
  if (/\b(design|architect|strategy|refactor|plan|analyse|analyze|review|compare|synthesize|cross-project|portfolio|predict)\b/.test(lower)) {
    return 'complex';
  }
  if (/\b(validate|check|verify|status|list|count|is there|does it|find|show)\b/.test(lower)) {
    return 'simple';
  }
  return 'moderate';
}

/**
 * Build extended thinking config for Opus calls.
 * @param {number} budgetTokens — max thinking tokens (default 8000)
 * @returns {object} thinking config block
 */
export function buildThinkingConfig(budgetTokens = 8000) {
  return { type: 'enabled', budget_tokens: budgetTokens };
}

/**
 * Add cache_control to a content block (for prompt caching).
 * Minimum cacheable block is 1024 tokens. Mark the LAST large block in a
 * multi-block system prompt to cache everything up to and including it.
 *
 * @param {object} block - message content block
 * @param {object} [opts]
 * @param {'5m'|'1h'} [opts.ttl='5m'] - cache TTL; 1h uses extended-cache-ttl beta
 * @returns {object} block with cache_control added
 */
export function withCache(block, opts = {}) {
  const ttl = opts.ttl || '5m';
  const cc = ttl === '1h'
    ? { type: 'ephemeral', ttl: '1h' }
    : { type: 'ephemeral' };
  return { ...block, cache_control: cc };
}

/**
 * Shorthand for 1-hour cached blocks (stable context that rarely changes).
 */
export function withLongCache(block) { return withCache(block, { ttl: '1h' }); }

/**
 * Build standard API request headers (no SDK required).
 * @param {string} apiKey
 * @param {object} [opts]
 * @param {boolean} [opts.useThinking=false] - include extended thinking beta
 * @param {boolean} [opts.longCache=false]   - include extended-cache-ttl-2025-04-11 beta
 * @param {boolean} [opts.files=false]       - include files-api-2025-04-14 beta
 * @returns {object} headers
 */
export function buildHeaders(apiKey, { useThinking = false, longCache = false, files = false } = {}) {
  const headers = {
    'Content-Type':       'application/json',
    'x-api-key':          apiKey,
    'anthropic-version':  '2023-06-01',
  };
  const betas = [];
  if (useThinking) betas.push('interleaved-thinking-2025-05-14');
  if (longCache)  betas.push('extended-cache-ttl-2025-04-11');
  if (files)      betas.push('files-api-2025-04-14');
  if (betas.length) headers['anthropic-beta'] = betas.join(',');
  return headers;
}

/**
 * Make a Claude API messages call via raw https (no SDK dependency).
 * Returns the parsed response or throws on error.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {number} opts.maxTokens
 * @param {string|Array} opts.system
 * @param {Array} opts.messages
 * @param {object} [opts.thinking] - extended thinking config
 * @returns {Promise<object>} parsed API response
 */
export function callClaude({ apiKey, model, maxTokens, system, messages, thinking, longCache = false, logAs = null }, httpsModule) {
  const body = { model, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  if (thinking) body.thinking = thinking;

  // Auto-detect 1h cache usage in system/messages to flip the beta header on
  const detectLong = (blocks) => Array.isArray(blocks) && blocks.some(b => b?.cache_control?.ttl === '1h');
  const autoLong = longCache || detectLong(system) || detectLong(messages?.flatMap?.(m => m?.content || []) || []);

  const useThinking = !!thinking;
  const headers = buildHeaders(apiKey, { useThinking, longCache: autoLong });
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const https = httpsModule;
    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(`API error: ${parsed.error.message}`));
          else {
            // Auto-log to ledger. Script identifier from explicit logAs,
            // then env (OPS_SCRIPT_NAME), else 'unknown'. Never throws.
            try {
              logMetrics({
                script: logAs || process.env.OPS_SCRIPT_NAME || 'unknown',
                model,
                usage: parsed.usage,
                mode: useThinking ? 'think' : (autoLong ? 'long-cache' : null),
              });
            } catch { /* metrics must never break callers */ }
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Call Claude with Haiku-first escalation.
 *
 * Token-reduction pattern (v3.1): start at Haiku for ~10-15x cost savings;
 * if the response contains the user-provided `escalationSignal` (e.g. "UNCERTAIN"),
 * retry with Sonnet. A second retry with Opus is possible for extended tasks.
 *
 * Cheaper than picking Opus upfront for tasks where Haiku would have sufficed.
 *
 * @param {object} opts - same shape as callClaude plus:
 * @param {string} [opts.escalationSignal='UNCERTAIN'] - text Haiku should emit when out of depth
 * @param {string} [opts.ceiling='sonnet'] - max model to escalate to: 'sonnet' | 'opus'
 * @param {function} [opts.onEscalate] - callback(model) when escalation triggers
 * @returns {Promise<{response, escalated: boolean, finalModel: string}>}
 */
export async function callWithEscalation(opts, httpsModule) {
  const { escalationSignal = 'UNCERTAIN', ceiling = 'sonnet', onEscalate } = opts;
  const order = ceiling === 'opus' ? ['haiku', 'sonnet', 'opus'] : ['haiku', 'sonnet'];

  let last;
  for (let i = 0; i < order.length; i++) {
    const model = MODELS[order[i]];
    const resp = await callClaude({ ...opts, model }, httpsModule);
    const text = resp.content?.map(c => c.text || '').join('') || '';
    last = { response: resp, escalated: i > 0, finalModel: model };
    if (!text.includes(escalationSignal) || i === order.length - 1) return last;
    if (onEscalate) onEscalate(order[i + 1]);
  }
  return last;
}

/**
 * Semantic response cache — dedupes repeat calls with identical system+user hash.
 * Stored under `.ops-cache/semantic/<sha256>.json` (gitignored).
 * Returns cached response if hash matches and is under `ttlSec` old.
 */
export function semanticCacheKey(system, messages, model) {
  const normalized = JSON.stringify({ m: model, s: typeof system === 'string' ? system : JSON.stringify(system), u: messages });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function loadSemanticCache(key, ttlSec = 3600) {
  const cacheDir = path.resolve(__dirname, '..', '..', '.ops-cache', 'semantic');
  const file = path.join(cacheDir, `${key}.json`);
  try {
    const stat = fs.statSync(file);
    if ((Date.now() - stat.mtimeMs) / 1000 > ttlSec) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}

export function storeSemanticCache(key, response) {
  const cacheDir = path.resolve(__dirname, '..', '..', '.ops-cache', 'semantic');
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(path.join(cacheDir, `${key}.json`), JSON.stringify(response));
  } catch { /* cache never breaks callers */ }
}

/**
 * Upload a file to the Anthropic Files API; returns file_id.
 * Use for static context that's re-sent across many calls (SOUL.md, CANON, rubrics).
 *
 * NOTE: requires `anthropic-beta: files-api-2025-04-14` and multipart/form-data.
 * Minimal implementation below uses raw https; pass `filename`, `content`, `mimeType`.
 */
export function uploadFile({ apiKey, filename, content, mimeType = 'text/plain' }, httpsModule) {
  const boundary = '----studio-ops-' + Date.now();
  const payloadParts = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    '',
    content,
    `--${boundary}--`,
    '',
  ];
  const payload = payloadParts.join('\r\n');
  const headers = {
    ...buildHeaders(apiKey, { files: true }),
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(payload),
  };
  // Files API doesn't use x-api-key; it uses anthropic-version + auth via key in the same header style
  return new Promise((resolve, reject) => {
    const req = httpsModule.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/files',
      method:   'POST',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Session budget tracker — lightweight dollar cap per session.
 * Writes running total to `.ops-cache/session-budget.json` (gitignored).
 * Returns `{ spent, remaining, overBudget }`.
 */
export function trackSessionBudget({ usage, model, cap = 5.0 }) {
  const price = PRICING_PER_MTOK[model] || FALLBACK_PRICE;
  const cost =
    (usage.input_tokens || 0)                 * price.input       / 1_000_000 +
    (usage.output_tokens || 0)                * price.output      / 1_000_000 +
    (usage.cache_read_input_tokens || 0)      * price.cacheRead   / 1_000_000 +
    (usage.cache_creation_input_tokens || 0)  * price.cacheWrite  / 1_000_000;

  const file = path.resolve(__dirname, '..', '..', '.ops-cache', 'session-budget.json');
  let state;
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = { session: null, spent: 0, cap }; }
  state.spent = (state.spent || 0) + cost;
  state.cap = cap;
  state.lastUpdated = new Date().toISOString();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state, null, 2));
  } catch { /* budget never breaks callers */ }
  return { spent: state.spent, remaining: cap - state.spent, overBudget: state.spent > cap };
}

/**
 * Append a single NDJSON metrics line for a Claude call.
 *
 * Writes to `docs/cache-ledger.ndjson` by default. Override with the
 * `OPS_CACHE_LEDGER` env var or the `logPath` option. Silently no-ops on
 * filesystem errors — metrics must never break a primary API call path.
 *
 * @param {object} opts
 * @param {string} opts.script    - caller identifier (e.g. "ask-protocol")
 * @param {string} opts.model     - resolved model ID
 * @param {object} opts.usage     - parsed.usage from Claude response
 * @param {string} [opts.mode]    - optional sub-mode (e.g. "think", "search")
 * @param {string} [opts.logPath] - override path
 */
export function logMetrics({ script, model, usage, mode = null, logPath = null }) {
  if (!usage) return;
  const target = logPath || process.env.OPS_CACHE_LEDGER || LEDGER_DEFAULT;
  const entry = {
    ts:           new Date().toISOString(),
    script,
    mode,
    model,
    input:        usage.input_tokens               ?? 0,
    output:       usage.output_tokens              ?? 0,
    cache_read:   usage.cache_read_input_tokens    ?? 0,
    cache_create: usage.cache_creation_input_tokens ?? 0,
  };
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.appendFileSync(target, JSON.stringify(entry) + '\n');
  } catch { /* metrics must never break callers */ }
}

/**
 * Generic Anthropic REST call (non-messages endpoints: vaults, sessions, files, etc.)
 * Keeps api.anthropic.com confined to the chokepoint for all endpoint families.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.method     - GET | POST | DELETE | PATCH
 * @param {string} opts.path       - e.g. '/v1/vaults'
 * @param {object} [opts.body]     - JSON body (omit for GET/DELETE)
 * @param {string} [opts.betaHeader] - extra anthropic-beta value(s)
 * @returns {Promise<{ status: number, body: object }>}
 */
export function callAnthropicRaw({ apiKey, method, path, body = null, betaHeader = null }, httpsModule) {
  const headers = buildHeaders(apiKey);
  if (betaHeader) headers['anthropic-beta'] = betaHeader;
  const payload = body ? JSON.stringify(body) : null;
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

  return new Promise((resolve, reject) => {
    const req = httpsModule.request(
      { hostname: 'api.anthropic.com', path, method, headers },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}\nRaw: ${data.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Submit a Messages Batch (50% cost discount, async).
 * Returns batch object with id for polling.
 */
export function submitBatch(apiKey, requests, httpsModule) {
  const payload = JSON.stringify({ requests });
  const headers = buildHeaders(apiKey);

  return new Promise((resolve, reject) => {
    const https = httpsModule;
    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages/batches',
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Batch submit parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Poll batch status until complete.
 * Returns results array when done.
 */
export async function pollBatch(apiKey, batchId, httpsModule, { pollIntervalMs = 10000, maxWaitMs = 600000 } = {}) {
  const headers = buildHeaders(apiKey);
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await new Promise((resolve, reject) => {
      const https = httpsModule;
      const req = https.request({
        hostname: 'api.anthropic.com',
        path:     `/v1/messages/batches/${batchId}`,
        method:   'GET',
        headers,
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.end();
    });

    if (status.processing_status === 'ended') {
      return status;
    }
    process.stderr.write(`  Batch ${batchId}: ${status.processing_status} (${status.request_counts?.processing ?? '?'} processing)...\n`);
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`Batch ${batchId} timed out after ${maxWaitMs / 1000}s`);
}

/**
 * Fetch all results for a completed batch (streams NDJSON from results endpoint).
 * Returns array of { custom_id, result: { type, message } | { type, error } }.
 */
export function fetchBatchResults(apiKey, batchId, httpsModule) {
  const headers = buildHeaders(apiKey);
  return new Promise((resolve, reject) => {
    const req = httpsModule.request({
      hostname: 'api.anthropic.com',
      path:     `/v1/messages/batches/${batchId}/results`,
      method:   'GET',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        const results = raw
          .split('\n')
          .filter(Boolean)
          .map(line => { try { return JSON.parse(line); } catch { return null; } })
          .filter(Boolean);
        resolve(results);
      });
    });
    req.on('error', reject);
    req.end();
  });
}
