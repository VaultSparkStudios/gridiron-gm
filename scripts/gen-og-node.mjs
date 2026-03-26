// Node.js OG image generator — generates cover.png for both repos
// Run: node scripts/gen-og-node.mjs
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function drawGM(ctx) {
  ctx.clearRect(0, 0, 1200, 630);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#f59e0b'; ctx.fillRect(0, 0, 1200, 4); ctx.fillRect(0, 626, 1200, 4);
  for (let x = 0; x < 1200; x += 80) { ctx.fillStyle = '#1e293b'; ctx.fillRect(x, 0, 2, 630); }
  ctx.font = 'bold 96px monospace'; ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center';
  ctx.fillText('GRIDIRON GM', 600, 240);
  ctx.font = '32px monospace'; ctx.fillStyle = '#475569';
  ctx.fillText('MANAGE  \u2726  PLAY  \u2726  WIN', 600, 310);
  ctx.font = '22px monospace'; ctx.fillStyle = '#1e3a5f';
  ctx.fillText('VAULTSPARK STUDIOS', 600, 560);
  ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#334155';
  ctx.fillText('vaultsparkstudios.com/gridiron-gm', 600, 590);
}

function drawPlay(ctx) {
  ctx.clearRect(0, 0, 1200, 630);
  ctx.fillStyle = '#0a0f1a'; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#f59e0b'; ctx.fillRect(0, 0, 1200, 4); ctx.fillRect(0, 626, 1200, 4);
  for (let x = 0; x < 1200; x += 80) { ctx.fillStyle = '#0d1424'; ctx.fillRect(x, 0, 2, 630); }
  ctx.font = 'bold 86px monospace'; ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center';
  ctx.fillText('GRIDIRON GM', 600, 220);
  ctx.font = 'bold 28px monospace'; ctx.fillStyle = '#3b82f6';
  ctx.fillText('\u2014 PLAY \u2014', 600, 275);
  ctx.font = '26px monospace'; ctx.fillStyle = '#475569';
  ctx.fillText('REAL-TIME FOOTBALL ENGINE', 600, 330);
  ctx.font = '22px monospace'; ctx.fillStyle = '#1e3a5f';
  ctx.fillText('VAULTSPARK STUDIOS', 600, 560);
  ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#334155';
  ctx.fillText('vaultsparkstudios.com/gridiron-gm-play', 600, 590);
}

const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// GM image
drawGM(ctx);
const gmDir = join(root, 'public', 'images');
mkdirSync(gmDir, { recursive: true });
writeFileSync(join(gmDir, 'cover.png'), canvas.toBuffer('image/png'));
console.log('✅ gridiron-gm/public/images/cover.png written');

// Play image — write to gridiron-gm-play repo if it exists
drawPlay(ctx);
const playDir = join(root, '..', 'gridiron-gm-play', 'public', 'images');
try {
  mkdirSync(playDir, { recursive: true });
  writeFileSync(join(playDir, 'cover.png'), canvas.toBuffer('image/png'));
  console.log('✅ gridiron-gm-play/public/images/cover.png written');
} catch (e) {
  console.log('⚠️  gridiron-gm-play not found — skipped Play image');
}
