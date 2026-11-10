// Stage smoke for the spotlight: two smoke cannons fire up either side of him as the screen opens,
// then a low fog keeps rolling across the floor. Soft puffs drawn on a canvas, lit faintly in his
// team's color. front: the thin layer of floor fog in front of his feet (the rest sits behind him).
// A player who asked for less motion gets the fog without the cannons, standing still.
import React, { useEffect, useRef } from "react";

// a few lumpy puff shapes, made once
let PUFFS = null;
function puffs() {
  if (PUFFS) return PUFFS;
  PUFFS = Array.from({ length: 4 }, (_, k) => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d");
    let s = 1 + k * 97;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const r = 18 + rnd() * 52, cx = 128 + (rnd() - 0.5) * 140, cy = 128 + (rnd() - 0.5) * 100;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,.13)"); g.addColorStop(0.6, "rgba(255,255,255,.04)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    return c;
  });
  return PUFFS;
}

const hex = (h) => { const s = String(h || "#888").replace("#", ""); const n = parseInt(s.length === 3 ? [...s].map((c) => c + c).join("") : s.slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

// at: where he stands (share of the width), so the cannons flank him
export default function SpotlightSmoke({ color = "#94a3b8", at = 0.68, front = false, cannons = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d"), P = puffs();
    // smoke is mostly grey-white, a quarter his color
    const [r, g, b] = hex(color), tint = `rgb(${Math.round(190 + (r - 190) * 0.28)},${Math.round(196 + (g - 196) * 0.28)},${Math.round(206 + (b - 206) * 0.28)})`;
    const tinted = P.map((p) => { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.drawImage(p, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = tint; x.fillRect(0, 0, 256, 256); return c; });
    let W = 0, H = 0, raf = 0, last = performance.now();
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener("resize", size);
    const parts = [];
    // a puff: x, y, speed, growth, life (ms), how thick
    const add = (o) => parts.push({ age: 0, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.0003, img: tinted[(Math.random() * 4) | 0], ...o });
    const fog = (age = 0) => add({ x: Math.random() * W, y: H * (front ? 1.02 : 0.96) - Math.random() * H * (front ? 0.03 : 0.08), vx: (Math.random() - 0.5) * 0.01 + 0.006, vy: -0.001 - Math.random() * 0.002, s0: H * (front ? 0.09 : 0.14), grow: 0.00003, life: 9000 + Math.random() * 6000, peak: front ? 0.18 : 0.45, age });
    // the cannons: a burst straight up each side of him, then it hangs and spreads
    if (cannons && !still && !front) for (const side of [-1, 1]) for (let i = 0; i < 44; i++) {
      add({ x: W * at + side * W * 0.16 + (Math.random() - 0.5) * 18, y: H + 10, vx: side * 0.02 + (Math.random() - 0.5) * 0.09, vy: -(0.45 + Math.random() * 0.6), drag: 0.0017, sway: Math.random() * 6.28, s0: H * (0.03 + Math.random() * 0.035), grow: 0.00032, life: 2000 + Math.random() * 1500, peak: 0.7, delay: i * 16 + Math.random() * 60 + (side > 0 ? 90 : 0) });
    }
    for (let i = 0; i < (front ? 8 : 14); i++) fog(Math.random() * 8000);
    const frame = (now) => {
      const dt = Math.min(50, now - last); last = now;
      ctx.clearRect(0, 0, W, H);
      if (parts.filter((p) => !p.delay && p.vy > -0.02).length < (front ? 8 : 14)) fog();
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.delay) { p.delay = Math.max(0, p.delay - dt); continue; }
        p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        if (p.drag) { p.vy *= 1 - p.drag * dt; p.vx *= 1 - p.drag * dt * 0.5; }
        p.x += p.vx * dt + (p.sway != null ? Math.sin(p.sway + p.age / 520) * 0.04 * dt : 0); p.y += p.vy * dt; p.rot += p.vr * dt;
        const k = p.age / p.life, a = p.peak * (k < 0.1 ? k / 0.1 : Math.pow(1 - (k - 0.1) / 0.9, 1.6)), s = p.s0 * (1 + p.grow * p.age * 4);
        ctx.globalAlpha = Math.max(0, a); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(p.img, -s, -s, s * 2, s * 2); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [color, at, front, cannons]);
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
