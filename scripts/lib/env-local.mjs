// env-local.mjs — Load .env.local into process.env without overwriting existing values.
//
// Why: IGNIS_MCP_URL and other runtime config live in `.env.local` but scripts
// that read `process.env.X` at module-load time didn't see them unless the
// founder prefixed the command. This helper ensures .env.local values are
// present in process.env for any script that imports it.
//
// Usage:
//   import './lib/env-local.mjs';   // side-effect: loads .env.local on import
//
// Design:
//   - No dependency on dotenv (studio-ops has no package.json).
//   - Does not overwrite vars already present in the shell environment.
//   - Silent if .env.local is missing.

import fs from 'node:fs';
import path from 'node:path';

function findEnvLocal() {
  // Walk up from cwd to find .env.local — supports running scripts from any
  // subdir within a repo.
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const p = path.join(dir, '.env.local');
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envPath = findEnvLocal();
if (envPath) {
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch { /* silent */ }
}
