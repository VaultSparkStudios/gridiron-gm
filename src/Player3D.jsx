// A club's star in real 3D, standing beside his team's logo on the home screen: sculpted limbs,
// shoulder pads under a fabric jersey with his number, a glossy clearcoat helmet with the team logo,
// a facemask built bar by bar, and his own gear (sleeves, tape, wristbands, gloves, eye black, visor,
// towel, cleats), which comes from his id so it never changes week to week. three.js loads only when
// this mounts, lit by a studio environment with a rim light in the team's accent color.
import React, { useEffect, useRef } from "react";
import { gearFor, jerseyNum } from "./PlayerFigure.jsx";
import { logoUrl } from "./ui.jsx";

const BIG = new Set(["LT", "LG", "C", "RG", "RT", "DL", "DT", "DE"]);
const lum = (hex) => { const n = parseInt((hex || "#888").replace("#", "").padEnd(6, "0").slice(0, 6), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export default function Player3D({ p, t, away = false, flip = false, h = 180, label = true }) {
  const ref = useRef(null);
  const w = Math.round(h * 0.6);
  const key = `${p?.id}|${t?.ab}|${away}|${flip}|${h}`;
  useEffect(() => {
    if (!p || !t) return;
    let stop = false, cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const el = ref.current;
      if (!el || stop) return;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.42;
      const camera = new THREE.PerspectiveCamera(23, w / h, 0.1, 50);
      camera.position.set(0, 0.5, 6.3); // a low hero angle, looking up at him
      camera.lookAt(0, 1.06, 0);
      const disposables = [];
      const keep = (x) => { disposables.push(x); return x; };

      // ---- colors and gear
      const g = gearFor(p);
      const clr = t.clr || "#334155", ac = t.ac || "#e2e8f0";
      const tc = (c) => (c === "team" ? clr : c);
      const J = away ? "#eef1f5" : clr;
      const numFill = away ? clr : lum(clr) > 0.7 ? clr : "#f8fafc";
      const numEdge = ac;
      const pantsC = away ? "#e6e9ee" : lum(ac) > 0.85 || lum(ac) < 0.12 ? "#e6e9ee" : ac;
      const sockC = away ? "#eef1f5" : clr;
      const skinC = p.face?.sk || "#a86b3c";
      const big = BIG.has(p.pos);
      // his build, from his real size: height sets how tall he stands, weight for his height sets how
      // wide he is, strength how much muscle he carries, and real size (300+) puts a gut on a lineman
      const ht = p.ht_ || p.ht || 74, wt = p.wt || 225, str = p.str ?? 75;
      const HS = Math.max(0.9, Math.min(1.1, ht / 75));
      const W = Math.max(0.76, Math.min(1.28, Math.pow((wt / (ht * ht)) / (225 / 5625), 0.95)));
      const M = 0.55 + Math.max(40, Math.min(99, str)) / 100; // muscle definition
      const gut = Math.max(0, Math.min(1, (wt - 290) / 60));

      // seeded grit, so his dirt and scuffs are his own and never change
      let sd = [...`${p.id}|${p.name}|grit`].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
      const rnd = () => ((sd = Math.imul(sd ^ (sd >>> 15), 0x2c1b3c6d) + 0x6d2b79f5 >>> 0) / 4294967296);
      const dirt = (big ? 0.7 : 0.45) + rnd() * 0.4;
      const canvas = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
      const tex = (c, srgb = true) => { const t2 = keep(new THREE.CanvasTexture(c)); if (srgb) t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 4; t2.wrapS = THREE.RepeatWrapping; return t2; };
      const smudge = (x, w, h, n, colors, a, sx = 1, sy = 1, y0 = 0, y1 = 1) => {
        for (let i = 0; i < n; i++) {
          const cx0 = rnd() * w, cy0 = h * (y0 + rnd() * (y1 - y0)), r = (12 + rnd() * 40) * sx;
          const gr = x.createRadialGradient(cx0, cy0, 1, cx0, cy0, r);
          const c = colors[Math.floor(rnd() * colors.length)];
          gr.addColorStop(0, `rgba(${c},${a * (0.5 + rnd() * 0.5)})`); gr.addColorStop(1, `rgba(${c},0)`);
          x.fillStyle = gr; x.save(); x.translate(cx0, cy0); x.scale(1, sy * (0.4 + rnd())); x.translate(-cx0, -cy0); x.fillRect(cx0 - r, cy0 - r, 2 * r, 2 * r); x.restore();
        }
      };
      const GRASS = ["58,92,38", "74,104,44", "88,72,44", "70,52,34"], DIRT = ["92,70,48", "60,46,34", "40,32,26"];
      const noise = (x, w, h, n, a, sz = 2) => { for (let i = 0; i < n; i++) { const v = rnd() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${a})`; x.fillRect(rnd() * w, rnd() * h, sz, sz); } };

      const mat = (c, o = {}) => keep(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c), roughness: 0.6, metalness: 0, ...o }));
      // skin: pores, a few veins, and a sweat sheen
      const skinBump = tex(canvas(512, 512, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); noise(x, w, h, 26000, 0.25, 1.5);
        x.strokeStyle = "rgba(255,255,255,0.55)"; x.lineWidth = 3; for (let i = 0; i < 7; i++) { x.beginPath(); let px = rnd() * w; x.moveTo(px, h * 0.55); for (let y = h * 0.55; y < h; y += 18) { px += (rnd() - 0.5) * 22; x.lineTo(px, y); } x.stroke(); } }), false);
      const skin = mat(skinC, { roughness: 0.5, bumpMap: skinBump, bumpScale: 1.2, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.12, sheenColor: new THREE.Color("#ffe8dc") });
      // pants: shiny stretch fabric, grass and dirt ground into the knees and thighs
      const pantsTex = tex(canvas(512, 512, (x, w, h) => { x.fillStyle = pantsC; x.fillRect(0, 0, w, h);
        smudge(x, w, h, Math.round(18 * dirt), GRASS, 0.7 * dirt, 1, 0.6, 0.55, 1); smudge(x, w, h, Math.round(8 * dirt), DIRT, 0.45 * dirt, 0.8, 0.5, 0.2, 1); }));
      const pantsBump = tex(canvas(256, 256, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); x.filter = "blur(3px)"; for (let i = 0; i < 12; i++) { x.strokeStyle = `rgba(${rnd() < 0.5 ? "0,0,0" : "255,255,255"},0.18)`; x.lineWidth = 3 + rnd() * 4; x.beginPath(); const y = rnd() * h; x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 10, w, y + (rnd() - 0.5) * 20); x.stroke(); } }), false);
      const pantsM = mat("#ffffff", { map: pantsTex, bumpMap: pantsBump, bumpScale: 0.35, roughness: 0.42, sheen: 1, sheenRoughness: 0.3, sheenColor: new THREE.Color("#ffffff"), clearcoat: 0.12 });
      const sockBump = tex(canvas(256, 64, (x, w, h) => { for (let i = 0; i < w; i += 4) { x.fillStyle = i % 8 ? "#5a5a5a" : "#b0b0b0"; x.fillRect(i, 0, 4, h); } }), false);
      const sockM = mat(sockC, { roughness: 0.9, bumpMap: sockBump, bumpScale: 1.2 });
      const white = mat("#eceae4", { roughness: 0.85 });
      const black = mat("#121418", { roughness: 0.5 });
      const sleeveM = mat(tc(g.sleeveClr), { roughness: 0.3, sheen: 0.5, bumpMap: sockBump, bumpScale: 0.4 });
      const gloveM = mat(tc(g.gloveClr), { roughness: 0.45, clearcoat: 0.3, bumpMap: pantsBump, bumpScale: 1 });
      const bandM = mat(tc(g.bandClr), { roughness: 0.95, bumpMap: sockBump, bumpScale: 1 });
      const cleatM = mat(tc(g.cleats), { roughness: 0.3, clearcoat: 0.6 });
      // helmet: glossy paint with a season's worth of scuffs, scratches and other teams' paint
      const helmTex = tex(canvas(1024, 512, (x, w, h) => { x.fillStyle = clr; x.fillRect(0, 0, w, h);
        const others = ["#c8102e", "#0b2265", "#ffb612", "#f8fafc", "#203731", "#97233f", "#fb4f14", "#69be28", "#d50a0a"];
        for (let i = 0; i < 6 + dirt * 10; i++) { x.strokeStyle = others[Math.floor(rnd() * others.length)]; x.globalAlpha = 0.35 + rnd() * 0.45; x.lineWidth = 2 + rnd() * 7; x.beginPath(); const sx0 = rnd() * w, sy0 = h * (0.15 + rnd() * 0.6); x.moveTo(sx0, sy0); x.lineTo(sx0 + (rnd() - 0.5) * 120, sy0 + (rnd() - 0.5) * 30); x.stroke(); }
        x.globalAlpha = 1; for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(255,255,255,${0.15 + rnd() * 0.3})`; x.lineWidth = 0.8 + rnd(); x.beginPath(); const sx0 = rnd() * w, sy0 = rnd() * h * 0.85; x.moveTo(sx0, sy0); x.lineTo(sx0 + (rnd() - 0.5) * 60, sy0 + (rnd() - 0.5) * 14); x.stroke(); }
        smudge(x, w, h, Math.round(5 * dirt), DIRT, 0.25, 0.7, 0.5, 0.3, 0.9); }));
      const helmetM = mat("#ffffff", { map: helmTex, roughness: 0.2, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 });
      const maskM = mat(lum(ac) < 0.2 ? "#2a2d33" : ac, { roughness: 0.4, metalness: 0.3, clearcoat: 0.5 });
      const trimM = mat(away ? clr : ac, { roughness: 0.7 });

      // the jersey: mesh fabric over pads, number front and back, collar trim, grass stains and sweat
      const jerseyC = canvas(1024, 512, (cx, cw, ch) => {
        cx.fillStyle = J; cx.fillRect(0, 0, cw, ch);
        cx.fillStyle = away ? clr : ac; cx.fillRect(0, 0, cw, 34); // collar
        const num = String(jerseyNum(p)).slice(0, 2);
        cx.font = "900 230px 'Arial Black', Impact, sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.lineJoin = "round";
        for (const x0 of [512, 0, 1024]) { cx.save(); cx.translate(x0, 250); cx.scale(0.82, 1); cx.lineWidth = 18; cx.strokeStyle = numEdge; cx.strokeText(num, 0, 0); cx.fillStyle = numFill; cx.fillText(num, 0, 0); cx.restore(); }
        // folds where the jersey stretches over the pads and bunches at the belt
        for (let i = 0; i < 26; i++) { const x0 = rnd() * cw, y0 = ch * (0.55 + rnd() * 0.45), gr = cx.createLinearGradient(x0 - 14, 0, x0 + 14, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.5, "rgba(0,0,0,0.16)"); gr.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = gr; cx.fillRect(x0 - 14, y0, 28, ch - y0); }
        smudge(cx, cw, ch, Math.round(10 * dirt), GRASS, 0.45 * dirt, 1.2, 0.7, 0.5, 1);
        smudge(cx, cw, ch, Math.round(6 * dirt), DIRT, 0.4 * dirt, 1, 0.5, 0.15, 0.9);
      });
      // a fine knit: rows of tiny V stitches, softened, tiled small so it reads as cloth, not texture
      const jerseyBump = tex(canvas(128, 128, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); x.filter = "blur(0.6px)"; x.strokeStyle = "#c4c4c4"; x.lineWidth = 1.3;
        for (let yy = 0; yy < h; yy += 4) { x.beginPath(); for (let xx = 0; xx <= w; xx += 4) { x.moveTo(xx, yy); x.lineTo(xx + 2, yy + 3); x.lineTo(xx + 4, yy); } x.stroke(); } }), false);
      jerseyBump.repeat.set(14, 7); jerseyBump.wrapT = THREE.RepeatWrapping;
      const jersey = mat("#ffffff", { map: tex(jerseyC), bumpMap: jerseyBump, bumpScale: 0.18, roughness: 0.62, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color("#ffffff") });

      // ---- geometry helpers
      const Y = new THREE.Vector3(0, 1, 0);
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      // a sculpted limb from a to b: tapered, with a muscle bulge, rounded ends
      const limb = (a, b, r1, r2, bulge, m, peak = 0.4) => {
        const dir = b.clone().sub(a), len = dir.length();
        const pts = [];
        for (let k = 0; k <= 6; k++) { const th = -Math.PI / 2 + (k / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(r1 * Math.cos(th) + 1e-4, r1 * Math.sin(th))); }
        for (let k = 1; k < 14; k++) { const s = k / 14; const bump = bulge * Math.pow(Math.sin(Math.PI * Math.min(1, s / (2 * peak))), 1.4) * (s < 2 * peak ? 1 : 0); pts.push(new THREE.Vector2(r1 + (r2 - r1) * s + bump, s * len)); }
        for (let k = 0; k <= 6; k++) { const th = (k / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(r2 * Math.cos(th) + 1e-4, len + r2 * Math.sin(th))); }
        const mesh = new THREE.Mesh(keep(new THREE.LatheGeometry(pts, 28)), m);
        mesh.position.copy(a); mesh.quaternion.setFromUnitVectors(Y, dir.normalize());
        return mesh;
      };
      const ball = (r, m, sx = 1, sy = 1, sz = 1) => { const s = new THREE.Mesh(keep(new THREE.SphereGeometry(r, 32, 24)), m); s.scale.set(sx, sy, sz); return s; };
      const band = (a, b, t0, t1, r, m) => { const p0 = a.clone().lerp(b, t0), p1 = a.clone().lerp(b, t1); return limb(p0, p1, r, r, 0, m); };
      const tube = (pts, r, m) => new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 8)), m);

      const body = new THREE.Group();
      const S = (x) => x * W; // width scaled by build

      // ---- legs
      for (const s of [-1, 1]) {
        const hip = V(s * S(0.1), 0.95, 0), knee = V(s * S(0.135), 0.53, 0.03), ankle = V(s * S(0.15), 0.1, -0.005);
        body.add(limb(hip, knee, S(0.1), S(0.07), S(0.02) * M, pantsM, 0.35));
        body.add(ball(S(0.064), pantsM, 1, 0.9, 1.05).translateX(knee.x).translateY(knee.y + 0.01).translateZ(knee.z + 0.012)); // knee pad
        body.add(tube([V(s * S(0.195), 0.93, 0), V(s * S(0.2), 0.72, 0.01), V(s * S(0.195), 0.5, 0.03)], 0.009, trimM)); // pants stripe
        body.add(limb(knee, ankle, S(0.064), 0.046 * Math.sqrt(W), S(0.018) * M, sockM, 0.3));
        if (g.socks === "low") body.add(band(knee, ankle, 0.45, 1.02, 0.05 * Math.sqrt(W), white));
        else body.add(band(knee, ankle, 0.1, 0.18, S(0.068), white));
        const shoe = ball(0.06, cleatM, 1.05, 0.62, 2.1); shoe.position.set(ankle.x, 0.045, 0.06); body.add(shoe);
        const sole = new THREE.Mesh(keep(new THREE.BoxGeometry(0.11, 0.02, 0.25)), black); sole.position.set(ankle.x, 0.012, 0.06); body.add(sole);
        const swoosh = ball(0.012, white, 3, 0.6, 3); swoosh.position.set(ankle.x + s * 0.06, 0.05, 0.06); body.add(swoosh);
      }
      const pelvis = ball(S(0.15), pantsM, 1.18, 0.6, 0.8 + gut * 0.15); pelvis.position.set(0, 0.97, 0); body.add(pelvis);
      const belt = new THREE.Mesh(keep(new THREE.TorusGeometry(S(0.19) * (1 + gut * 0.12), 0.016, 8, 40)), black); belt.rotation.x = Math.PI / 2; belt.scale.set(1.02, 0.72 + gut * 0.12, 1); belt.position.y = 1.03; body.add(belt);

      // ---- torso: a lathe of the jersey over pads, wider than deep; big men carry a belly
      const prof = [[0.0, 0.16 + gut * 0.03], [0.08, 0.165 + gut * 0.045], [0.2, 0.185 + gut * 0.04], [0.3, 0.21], [0.4, 0.225], [0.48, 0.22], [0.54, 0.19], [0.58, 0.11], [0.6, 0.08]];
      const torso = new THREE.Mesh(keep(new THREE.LatheGeometry(prof.map(([yy, r]) => new THREE.Vector2(r, yy)), 48, -Math.PI, Math.PI * 2)), jersey);
      torso.position.y = 0.99; torso.scale.set(S(1.25), 1, 0.68 + gut * 0.14);
      const chest = new THREE.Group(); chest.add(torso);
      for (const s of [-1, 1]) {
        const pad = ball(0.145, jersey, S(1.08), 0.62, 1.02); pad.position.set(s * S(0.215), 1.5, 0); chest.add(pad);
        const cap = ball(0.115, jersey, 0.9, 0.95, 0.95); cap.position.set(s * S(0.3), 1.45, 0); chest.add(cap);
        const st = new THREE.Mesh(keep(new THREE.TorusGeometry(0.094, 0.012, 8, 32)), trimM); st.position.set(s * S(0.33), 1.39, 0); st.rotation.set(0, Math.PI / 2, s * 0.6); chest.add(st);
      }
      chest.add(limb(V(0, 1.5, 0), V(0, 1.66, 0.01), 0.07 * Math.sqrt(W) * M * 0.9, 0.062 * Math.sqrt(W), 0, skin)); // neck
      for (const s of [-1, 1]) { const trap = ball(0.07 * M, skin, 1.3, 0.55, 0.8); trap.position.set(s * 0.07, 1.57, -0.02); trap.rotation.z = s * -0.5; chest.add(trap); }
      if (g.neckRoll) { const nr = new THREE.Mesh(keep(new THREE.TorusGeometry(0.1, 0.035, 12, 32)), jersey); nr.rotation.x = Math.PI / 2; nr.position.y = 1.56; chest.add(nr); }

      // ---- arms hang at his sides, fists clenched; size and definition from his build and strength
      const armGear = (s, sh, el, wr, hand, sleeveOn) => {
        const aw = Math.sqrt(W);
        chest.add(limb(sh, el, 0.07 * aw, 0.054 * aw, 0.022 * aw * M, sleeveOn ? sleeveM : skin, 0.42));
        chest.add(limb(el, wr, 0.056 * aw, 0.039 * aw, 0.017 * aw * M, sleeveOn ? sleeveM : skin, 0.25));
        if (g.armTape) chest.add(band(el, wr, 0.55, 0.85, 0.046 * aw, white));
        if (g.wristbands) chest.add(band(el, wr, 0.86, 1.0, 0.046 * aw, bandM));
        const gloved = g.gloves === "both" || (g.gloves === "one" && s === 1);
        const hm = ball(0.05, gloved ? gloveM : skin, 0.95, 1.12, 0.95); // a clenched fist
        hm.position.copy(hand); chest.add(hm);
      };
      const sleeveFor = (s) => g.sleeves === "both" || (g.sleeves === "one" && s === -1);
      for (const s of [-1, 1]) {
        const sx = S(0.31);
        armGear(s, V(s * sx, 1.43, 0), V(s * (sx + 0.07), 1.17, -0.03), V(s * (sx + 0.09), 0.96, 0.04), V(s * (sx + 0.095), 0.9, 0.05), sleeveFor(s));
      }

      // towel tucked in the waistband
      if (g.towel) {
        const tw = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.1, 0.22, 2, 6)), mat("#f2f0ea", { roughness: 1, side: THREE.DoubleSide, bumpMap: pantsBump, bumpScale: 2 }));
        const pos = tw.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.02 * Math.sin((pos.getY(i) + 0.11) * 9));
        tw.position.set(-S(0.08), 0.92, S(0.14) * (1 + gut * 0.2)); tw.rotation.set(-0.1, 0, 0.08); chest.add(tw);
      }

      // ---- head and helmet
      const head = new THREE.Group(); head.position.set(0, 1.76, 0.02); head.rotation.x = 0.16; // chin tucked
      const shade = mat(new THREE.Color(skinC).multiplyScalar(0.12), { roughness: 0.7 }); // what little shows below the visor sits in shadow
      const face = ball(0.1, shade, 0.9, 1.08, 1); face.position.set(0, -0.025, 0.02); head.add(face);
      const R = 0.145;
      const inner = mat("#15171b", { side: THREE.BackSide, roughness: 0.9 });
      const shellTop = new THREE.Mesh(keep(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.4)), helmetM);
      const gap = 0.62; // the face opening
      const shellLow = new THREE.Mesh(keep(new THREE.SphereGeometry(R, 48, 16, Math.PI / 2 + gap, Math.PI * 2 - 2 * gap, Math.PI * 0.4, Math.PI * 0.27)), helmetM);
      const shellIn = new THREE.Mesh(keep(new THREE.SphereGeometry(R * 0.985, 32, 16, Math.PI / 2 + gap, Math.PI * 2 - 2 * gap, 0, Math.PI * 0.67)), inner);
      const shell = new THREE.Group(); shell.add(shellTop, shellLow, shellIn); shell.scale.set(0.93, 1, 1.1); shell.position.set(0, 0.02, -0.005); head.add(shell);
      // center stripe
      head.add(tube(Array.from({ length: 9 }, (_, i) => { const a = -0.25 + (i / 8) * 1.75; return V(0, 0.02 + Math.cos(a) * R * 1.005, -0.005 + Math.sin(a) * R * 1.1 * 1.005); }), 0.01, trimM));
      // jaw pads and ear holes
      for (const s of [-1, 1]) {
        const jaw = ball(0.05, helmetM, 0.5, 0.9, 1.1); jaw.position.set(s * 0.115, -0.065, 0.045); head.add(jaw);
        const ear = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 16)), black); ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.134, -0.005, -0.005); head.add(ear);
      }
      // facemask, bar by bar
      const arc = (y, rr, a0, a1, zc = 0.02) => Array.from({ length: 11 }, (_, i) => { const a = a0 + (i / 10) * (a1 - a0); return V(Math.sin(a) * rr, y, zc + Math.cos(a) * rr * 1.08); });
      head.add(tube(arc(0.0, 0.142, -1.15, 1.15), 0.0075, maskM));
      if (g.mask !== "open") head.add(tube(arc(-0.055, 0.135, -1.0, 1.0), 0.0075, maskM));
      if (g.mask === "bar3" || g.mask === "cage") head.add(tube(arc(-0.105, 0.115, -0.85, 0.85), 0.0075, maskM));
      if (g.mask === "cage") { head.add(tube([V(0, 0.005, 0.175), V(0, -0.05, 0.168), V(0, -0.11, 0.143)], 0.007, maskM)); for (const s of [-1, 1]) head.add(tube([V(s * 0.05, 0.002, 0.168), V(s * 0.05, -0.055, 0.155), V(s * 0.045, -0.108, 0.13)], 0.007, maskM)); }
      for (const s of [-1, 1]) head.add(tube([V(s * 0.13, 0.0, 0.08), V(s * 0.125, -0.06, 0.09), V(s * 0.1, -0.11, 0.08)], 0.007, maskM));
      // chin strap
      head.add(tube(arc(-0.13, 0.08, -1.2, 1.2, 0.0), 0.009, white));
      // a dark visor on every helmet: no faces, just a black eye shield (an iridescent one catches a little color)
      {
        const vm = mat("#05070a", { transparent: true, opacity: 0.97, roughness: 0.04, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: g.visor === "iridescent" ? 0.9 : 0, iridescenceIOR: 1.6 });
        const vis = new THREE.Mesh(keep(new THREE.SphereGeometry(R * 0.985, 40, 10, Math.PI / 2 - gap * 1.02, gap * 2.04, Math.PI * 0.42, Math.PI * 0.2)), vm);
        vis.scale.set(0.93, 1, 1.1); vis.position.set(0, 0.02, -0.005); head.add(vis);
      }
      // team logo decals on both sides of the helmet
      new THREE.TextureLoader().setCrossOrigin("anonymous").load(logoUrl(t.ab), (tex) => {
        if (stop) return tex.dispose();
        keep(tex); tex.colorSpace = THREE.SRGBColorSpace;
        const lm = mat("#ffffff", { map: tex, transparent: true, roughness: 0.25, clearcoat: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
        for (const s of [-1, 1]) {
          const d = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.105, 0.105)), lm);
          d.position.set(s * 0.137, 0.035, -0.01); d.rotation.y = s * Math.PI / 2; if (s < 0) d.scale.x = -1;
          head.add(d);
        }
      }, undefined, () => {});
      chest.add(head);
      body.add(chest);

      // contact shadow
      const sc = document.createElement("canvas"); sc.width = sc.height = 128;
      const sx = sc.getContext("2d"); const gr = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
      const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.8, 0.5)), keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(sc)), transparent: true, depthWrite: false })));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002;
      scene.add(shadow);

      const turn = flip ? -0.5 : 0.5;
      body.rotation.y = turn; body.scale.setScalar(HS);
      scene.add(body);

      // lights: warm key, cool fill, a rim in the team's accent color
      scene.add(new THREE.HemisphereLight(0xc8d4ff, 0x0a0c10, 0.28));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.9); keyL.position.set(flip ? -2.5 : 2.5, 6, 3); scene.add(keyL); // hard top light: shadowed eyes
      const rimC = new THREE.Color(lum(ac) < 0.15 ? "#9fb4ff" : ac);
      const rim = new THREE.DirectionalLight(rimC, 4.2); rim.position.set(flip ? 3 : -3, 2.5, -3.5); scene.add(rim);
      const rim2 = new THREE.DirectionalLight(0xffffff, 2.2); rim2.position.set(flip ? -3 : 3, 2, -4); scene.add(rim2);
      // a team-color glow behind him
      const gc = document.createElement("canvas"); gc.width = gc.height = 128;
      const gx = gc.getContext("2d"), gg = gx.createRadialGradient(64, 64, 2, 64, 64, 64);
      gg.addColorStop(0, `${lum(clr) < 0.12 ? ac : clr}cc`); gg.addColorStop(0.45, `${lum(clr) < 0.12 ? ac : clr}40`); gg.addColorStop(0.8, `${clr}00`); gg.addColorStop(1, `${clr}00`); gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
      const glow = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: keep(new THREE.CanvasTexture(gc)), transparent: true, depthWrite: false, opacity: 0.55 })));
      glow.scale.set(1.7, 2.3, 1); glow.position.set(0, 1.2, -1.2); scene.add(glow);

      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      let raf = 0; const t0 = performance.now(), ph = g.sway * 6.28;
      const loop = (now) => {
        const s = (now - t0) / 1000;
        if (!reduce) {
          const br = Math.sin(s * 1.6 + ph);
          chest.position.y = br * 0.004; chest.scale.set(1 + br * 0.006, 1, 1 + br * 0.008);
          body.rotation.y = turn + Math.sin(s * 0.45 + ph) * 0.12;
          head.rotation.y = Math.sin(s * 0.7 + ph * 1.3) * 0.08; head.rotation.x = 0.16 + Math.sin(s * 0.5 + ph) * 0.02;
        }
        renderer.render(scene, camera);
        if (!reduce && !document.hidden) raf = requestAnimationFrame(loop); else if (!reduce) raf = setTimeout(() => requestAnimationFrame(loop), 500);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => { cancelAnimationFrame(raf); clearTimeout(raf); disposables.forEach((d) => d.dispose?.()); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    })();
    return () => { stop = true; cleanup(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p || !t) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <div ref={ref} role="img" aria-label={`${p.name}, ${t.name} ${p.pos}`} style={{ width: w, height: h }} />
      {label && <div style={{ fontSize: Math.max(10, Math.round(h / 15)), fontWeight: 800, color: "#e2e8f0", marginTop: 2, whiteSpace: "nowrap", textAlign: "center" }}>{(p.name || "").split(" ").slice(1).join(" ") || p.name} <span style={{ color: "#94a3b8", fontWeight: 700 }}>{p.pos} {p.ovr}</span></div>}
    </div>
  );
}
