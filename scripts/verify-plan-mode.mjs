#!/usr/bin/env node
/**
 * verify-plan-mode.mjs — runtime detector for /model opusplan activation (S63e).
 *
 * In T2 repos, `.claude/settings.json` can only pin a concrete model ("opus"),
 * because `opusplan` is a runtime-only slash-command mode. This script decides
 * whether plan-mode actually fired in the CURRENT session and surfaces
 * ACTIVE / MISSING / NOT_REQUIRED for the brief + grade-routing.
 *
 * Detection strategy (best-effort, three signals, any one wins):
 *   1. Session-lock hint: context/.session-lock contains `plan_mode_confirmed: true`
 *      (written by `mark-plan-mode.mjs` — founder can self-attest).
 *   2. Transcript scan: tail Claude Code's session JSONL under
 *      ~/.claude/projects/<encoded-cwd>/*.jsonl since session_start for any
 *      `/model opusplan` user message or assistant slash-command echo.
 *   3. PROJECT_STATUS.json already carries a recent `planModeLastActivatedAt`
 *      within this session window (persisted from a prior verify pass).
 *
 * Stamps result into:
 *   - context/.session-lock     `plan_mode_detected: <active|missing|not_required>`
 *   - context/PROJECT_STATUS.json  `planModeDetected`, `planModeCheckedAt`
 *
 * Usage:
 *   node scripts/verify-plan-mode.mjs           # human output
 *   node scripts/verify-plan-mode.mjs --json    # machine output
 *   node scripts/verify-plan-mode.mjs --quiet   # silent unless MISSING
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const QUIET = args.includes('--quiet');

function readJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } }
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

const lockPath = path.join(ROOT, 'context', '.session-lock');
const statusPath = path.join(ROOT, 'context', 'PROJECT_STATUS.json');
const lockText = readText(lockPath);
const status = readJson(statusPath, {});

let sessionStart = Date.now() - 3600_000;
const m = lockText.match(/session_start:\s*(\S+)/);
if (m) sessionStart = new Date(m[1]).getTime();

const planModeRequired = !!status.modelPlanMode;
const tier = status.modelTier || null;

if (!planModeRequired) {
  emit({ status: 'not_required', tier, reason: 'tier does not require plan-mode' });
  process.exit(0);
}

// Signal 1: explicit founder self-attest in lock
const sig1 = /plan_mode_confirmed:\s*true/i.test(lockText);

// Signal 2: transcript scan
const encoded = ROOT.replace(/[:\\/]/g, '-').replace(/^-+/, '');
const projectsDir = path.join(os.homedir(), '.claude', 'projects');
let sig2 = false;
let sig2SourceLine = null;
try {
  if (fs.existsSync(projectsDir)) {
    // Find the directory whose name matches the current cwd (encoded).
    const dirs = fs.readdirSync(projectsDir).filter(d => d.includes('vaultspark-studio-ops') || d.includes(path.basename(ROOT)));
    for (const d of dirs) {
      const full = path.join(projectsDir, d);
      let files = [];
      try { files = fs.readdirSync(full).filter(f => f.endsWith('.jsonl')); } catch { continue; }
      for (const f of files) {
        const fp = path.join(full, f);
        let st; try { st = fs.statSync(fp); } catch { continue; }
        if (st.mtimeMs < sessionStart) continue;
        let text;
        try { text = fs.readFileSync(fp, 'utf8'); } catch { continue; }
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line) continue;
          // Cheap pre-filter
          if (!/opusplan/i.test(line)) continue;
          try {
            const e = JSON.parse(line);
            const ts = e.timestamp ? new Date(e.timestamp).getTime() : 0;
            if (ts && ts < sessionStart) continue;
            // look for /model opusplan in user or assistant content
            const content = JSON.stringify(e.message || e).toLowerCase();
            if (/\/model\s+opusplan/.test(content) || /"model":\s*"opusplan"/.test(content)) {
              sig2 = true; sig2SourceLine = f;
              break;
            }
          } catch { /* skip */ }
        }
        if (sig2) break;
      }
      if (sig2) break;
    }
  }
} catch { /* best-effort */ }

// Signal 3: prior pass stamped activation in this session
const sig3 = !!(status.planModeLastActivatedAt && new Date(status.planModeLastActivatedAt).getTime() >= sessionStart);

const active = sig1 || sig2 || sig3;
const result = {
  status: active ? 'active' : 'missing',
  tier,
  sessionStart: new Date(sessionStart).toISOString(),
  signals: { lockAttest: sig1, transcriptScan: sig2, priorStamp: sig3 },
  sig2SourceLine,
  reminder: active ? null : `Run /model opusplan to activate Opus-plans-Sonnet-executes. Then: node scripts/mark-plan-mode.mjs`,
};

// Stamp status + lock
try {
  status.planModeDetected = result.status;
  status.planModeCheckedAt = new Date().toISOString();
  if (active) status.planModeLastActivatedAt = status.planModeLastActivatedAt || new Date().toISOString();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
} catch { /* non-fatal */ }
try {
  if (fs.existsSync(lockPath)) {
    const updated = lockText.includes('plan_mode_detected:')
      ? lockText.replace(/plan_mode_detected:\s*\S+/, `plan_mode_detected: ${result.status}`)
      : lockText.trimEnd() + `\nplan_mode_detected: ${result.status}\n`;
    fs.writeFileSync(lockPath, updated);
  }
} catch { /* non-fatal */ }

function emit(r) {
  if (JSON_MODE) { console.log(JSON.stringify(r, null, 2)); return; }
  if (QUIET && r.status !== 'missing') return;
  const tag = { active: '✓ ACTIVE', missing: '⚠ MISSING', not_required: '= N/A' }[r.status] || r.status;
  console.log(`verify-plan-mode · ${tag} · tier=${r.tier || '?'}`);
  if (r.signals) {
    const sigs = Object.entries(r.signals).filter(([, v]) => v).map(([k]) => k);
    console.log(`  signals: ${sigs.join(', ') || '(none)'}`);
  }
  if (r.reminder) console.log(`  → ${r.reminder}`);
}
emit(result);
