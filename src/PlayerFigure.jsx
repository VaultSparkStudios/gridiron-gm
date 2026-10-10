// A team's star, standing beside its logo on the home screen: an animated SVG player in his
// team's uniform (colors at home, white on the road) with his own gear. The loadout (sleeves,
// arm tape, wristbands, gloves, eye black, visor, towel, socks, cleats, neck roll, facemask) is
// rolled once from his id, so he looks the same every week and every season.
import React from "react";

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return h >>> 0; };
const roller = (seed) => { let x = hash(seed) || 1; return () => ((x = Math.imul(x ^ (x >>> 13), 0x5bd1e995) ^ (x >>> 15)) >>> 0) / 4294967296; };
const BIG = new Set(["LT", "LG", "C", "RG", "RT", "DL"]);
const SKILL = new Set(["WR", "CB", "S", "RB"]);

// His gear, the same every time for the same player.
export function gearFor(p) {
  const r = roller(`${p?.id}|gear`);
  const pick = (opts) => { let x = r() * opts.reduce((s, [, w]) => s + w, 0); for (const [v, w] of opts) { x -= w; if (x <= 0) return v; } return opts[0][0]; };
  const pos = p?.pos || "WR", qb = pos === "QB", big = BIG.has(pos);
  return {
    sleeves: pick([["none", 45], ["one", 20], ["both", 35]]),
    sleeveClr: pick([["#f8fafc", 4], ["#111827", 4], ["team", 3]]),
    armTape: r() < (big ? 0.6 : 0.35),
    wristbands: r() < 0.6,
    bandClr: pick([["#f8fafc", 5], ["#111827", 3], ["team", 3]]),
    gloves: qb ? (r() < 0.3 ? "one" : "none") : "both",
    gloveClr: pick([["team", 5], ["#111827", 4], ["#f8fafc", 2]]),
    eyeBlack: pick([["none", 45], ["stripes", 40], ["sticker", 15]]),
    visor: pick([["none", 55], ["clear", 25], ["smoke", 12], ["iridescent", 8]]),
    towel: r() < (qb ? 0.6 : SKILL.has(pos) ? 0.4 : 0.15),
    socks: pick([["high", 60], ["low", 40]]),
    cleats: pick([["#f8fafc", 4], ["#111827", 4], ["team", 3], ["#d4a017", 0.4]]),
    neckRoll: big && r() < 0.35,
    mask: qb || pos === "K" || pos === "P" ? "open" : big ? "cage" : pos === "LB" || pos === "TE" || pos === "RB" ? "bar3" : "bar2",
    sway: Math.round(r() * 1000) / 1000,
  };
}

export const jerseyNum = (p) => p?.num ?? (hash(`${p?.id}|num`) % 89) + 10;

const shade = (hex, f) => {
  const n = parseInt((hex || "#888888").replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const ch = (v) => Math.round(Math.max(0, Math.min(255, f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

// A broadcast-graphic style athlete: realistic proportions (helmet about a seventh of his height),
// muscular arms and legs, shoulder pads under the jersey, a real helmet shape with ear hole, chin
// strap and facemask, and every surface shaded (light from the upper left, a rim light on the right).
export default function PlayerFigure({ p, t, away = false, h = 180, label = true }) {
  if (!p || !t) return null;
  const g = gearFor(p);
  const clr = t.clr || "#334155", ac = t.ac || "#e2e8f0";
  const tc = (c) => (c === "team" ? clr : c);
  const skin = p.face?.sk || "#a86b3c";
  const J = away ? "#eef1f5" : clr, trim = away ? clr : ac;
  const pants = away ? clr : "#e6e9ee", stripe = away ? "#eef1f5" : ac;
  const sock = away ? clr : "#eef1f5";
  const big = BIG.has(p.pos), skill = SKILL.has(p.pos);
  const w = big ? 1.1 : skill ? 0.95 : 1;
  const id = `pf${hash(p.id) % 100000}`;
  const u = (k) => `url(#${id}${k})`;
  const num = String(jerseyNum(p)).slice(0, 2);
  const delay = `${(-g.sway * 4).toFixed(2)}s`;
  // horizontal shading across a limb or panel: shadow edge, lit side, base, darker far edge
  const lin = (k, c, x1 = 0, x2 = 1) => (
    <linearGradient id={`${id}${k}`} x1={x1} x2={x2} y1="0" y2="0">
      <stop offset="0" stopColor={shade(c, -0.42)} /><stop offset=".22" stopColor={shade(c, 0.12)} /><stop offset=".5" stopColor={shade(c, 0.04)} /><stop offset=".82" stopColor={shade(c, -0.18)} /><stop offset="1" stopColor={shade(c, -0.45)} />
    </linearGradient>
  );
  const sleeve = (side) => g.sleeves === "both" || (g.sleeves === "one" && side === "R");
  const glove = (side) => g.gloves === "both" || (g.gloves === "one" && side === "R");
  const armFill = (side) => (sleeve(side) ? u("sl") : u("sk"));
  // one arm (left side as drawn); the right one is mirrored
  const Arm = ({ side }) => {
    const m = side === "R" ? "translate(200 0) scale(-1 1)" : undefined;
    return (
      <g transform={m}><g className={`${id}${side}`} style={{ transformOrigin: "46px 104px" }}>
        <path d="M33 104 C25 126 26 148 31 168 C28 188 30 208 35 224 L52 224 C55 208 56 190 53 171 C58 150 60 128 56 106 Z" fill={armFill(side)} />
        <path d="M33 104 C25 126 26 148 31 168 C28 188 30 208 35 224 L39 224 C35 206 33 188 36 170 C31 148 31 128 37 106 Z" fill="#000" opacity=".18" />
        {g.armTape && !sleeve(side) && <><path d="M32 192 L54 192 L54 196 L32 196 Z" fill="#f4f6f8" /><path d="M32 200 L54 200 L54 203 L32 203 Z" fill="#f4f6f8" /></>}
        {g.wristbands && <rect x="33" y="210" width="21" height="10" rx="3" fill={tc(g.bandClr)} />}
        <path d="M34 222 C30 232 31 244 37 250 C43 255 52 252 55 244 C57 236 55 228 53 222 Z" fill={glove(side) ? u("gl") : u("sk")} />
        <path d="M37 236 C40 246 46 250 52 246" stroke="#000" strokeOpacity=".25" strokeWidth="1.2" fill="none" />
        {/* jersey sleeve over the pad */}
        <path d="M28 98 C30 88 44 84 58 88 L60 120 C50 124 38 124 30 120 Z" fill={u("je")} />
        <path d="M30 114 C40 118 50 118 60 115 L60 119 C50 122 40 122 30 118 Z" fill={trim} />
      </g></g>
    );
  };
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
      <svg viewBox="0 0 200 400" width={h / 2} height={h} role="img" aria-label={`${p.name}, #${num}`} style={{ overflow: "visible" }}>
        <style>{`
          .${id} { animation: ${id}b 4s ease-in-out infinite; animation-delay: ${delay}; transform-origin: 100px 380px; }
          .${id}c { animation: ${id}c 4s ease-in-out infinite; animation-delay: ${delay}; transform-origin: 100px 200px; }
          .${id}L, .${id}R { animation: ${id}a 4s ease-in-out infinite; animation-delay: ${delay}; }
          @keyframes ${id}b { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(0.7deg); } }
          @keyframes ${id}c { 0%,100% { transform: scale(1, 1); } 50% { transform: scale(1.012, 1.008); } }
          @keyframes ${id}a { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(1.6deg); } }
          @media (prefers-reduced-motion: reduce) { .${id}, .${id}c, .${id}L, .${id}R { animation: none; } }
        `}</style>
        <defs>
          {lin("sk", skin)}{lin("sl", tc(g.sleeveClr))}{lin("je", J)}{lin("pa", pants)}{lin("so", sock)}{lin("gl", tc(g.gloveClr))}{lin("cl", tc(g.cleats))}
          <radialGradient id={`${id}hm`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor={shade(clr, 0.55)} /><stop offset=".35" stopColor={shade(clr, 0.08)} /><stop offset=".75" stopColor={shade(clr, -0.25)} /><stop offset="1" stopColor={shade(clr, -0.55)} /></radialGradient>
          <radialGradient id={`${id}fc`} cx=".45" cy=".45" r=".7"><stop offset="0" stopColor={shade(skin, 0.1)} /><stop offset=".7" stopColor={skin} /><stop offset="1" stopColor={shade(skin, -0.35)} /></radialGradient>
          <linearGradient id={`${id}vi`} x1="0" x2="1"><stop offset="0" stopColor="#f59e0b" /><stop offset=".5" stopColor="#a855f7" /><stop offset="1" stopColor="#22d3ee" /></linearGradient>
          <linearGradient id={`${id}rim`} x1="0" x2="1"><stop offset=".8" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".28" /></linearGradient>
        </defs>
        <ellipse cx="100" cy="382" rx="58" ry="8" fill="#000" opacity=".4" />
        <g className={id}>
          <g transform={`translate(100 0) scale(${w} 1) translate(-100 0)`}>
            {/* legs: thighs, knee pads, calves, socks, cleats */}
            {[0, 1].map((i) => (
              <g key={i} transform={i ? "translate(200 0) scale(-1 1)" : undefined}>
                <path d="M64 194 C58 236 62 274 66 300 L96 300 C98 270 100 232 100 198 Z" fill={u("pa")} />
                <path d="M68 202 C64 240 66 272 69 298" stroke={stripe} strokeWidth="4" fill="none" />
                <path d="M66 278 C70 270 92 270 96 278 L96 302 C90 308 72 308 66 302 Z" fill={u("pa")} />
                <path d="M66 300 C61 322 63 346 70 362 L91 362 C96 342 98 320 96 300 Z" fill={g.socks === "high" ? u("so") : u("sk")} />
                {g.socks === "low" && <path d="M68 340 L94 340 L92 364 L70 364 Z" fill={u("so")} />}
                <path d="M64 358 C60 368 62 378 70 380 L98 380 C102 378 102 370 96 362 Z" fill={u("cl")} />
                <path d="M66 377 L99 377" stroke="#000" strokeOpacity=".35" strokeWidth="2" />
              </g>
            ))}
            <path d="M96 200 L104 200 L102 246 L98 246 Z" fill="#000" opacity=".22" />
            {/* arms behind the torso */}
            <Arm side="L" /><Arm side="R" />
            <g className={`${id}c`}>
              {g.neckRoll && <path d="M72 66 C80 58 120 58 128 66 L126 78 L74 78 Z" fill={away ? clr : "#e6e9ee"} />}
              {/* neck */}
              <path d="M86 56 L114 56 L118 80 L82 80 Z" fill={u("sk")} />
              <path d="M86 70 L114 70 L118 80 L82 80 Z" fill="#000" opacity=".2" />
              {/* torso over shoulder pads */}
              <path d="M40 98 C44 80 62 72 82 74 L118 74 C138 72 156 80 160 98 L144 196 Q100 206 56 196 Z" fill={u("je")} />
              <path d="M40 98 C44 80 62 72 82 74 L118 74 C138 72 156 80 160 98 L144 196 Q100 206 56 196 Z" fill={u("rim")} />
              <path d="M58 112 L142 112 L140 124 Q100 130 60 124 Z" fill="#000" opacity=".14" />
              <path d="M56 196 L50 120 L58 116 L64 196 Z" fill={trim} opacity=".9" />
              <path d="M144 196 L150 120 L142 116 L136 196 Z" fill={trim} opacity=".9" />
              <path d="M82 74 Q100 86 118 74" fill="none" stroke={trim} strokeWidth="5" />
              <text x="100" y="170" textAnchor="middle" fontSize="52" fontWeight="900" fontFamily="'Arial Black', Impact, sans-serif" fill={away ? clr : "#f8fafc"} stroke={away ? ac : trim} strokeWidth="2.6" paintOrder="stroke" letterSpacing="-1">{num}</text>
              <path d="M56 190 Q100 200 144 190 L144 204 Q100 212 56 204 Z" fill="#161b24" />
              {g.towel && <path d="M108 204 L122 204 L120 246 Q115 250 110 246 Z" fill="#f4f6f8" />}
            </g>
            {/* helmet */}
            <path d="M68 44 C66 12 92 2 106 4 C126 6 136 22 134 46 L132 60 C126 66 116 66 112 62 L88 62 C82 66 72 64 68 58 Z" fill={u("hm")} />
            <path d="M100 4.5 C103 22 103 40 100 60" stroke={ac} strokeWidth="6" fill="none" />
            <ellipse cx="80" cy="18" rx="10" ry="5" fill="#fff" opacity=".4" transform="rotate(-30 80 18)" />
            <circle cx="71" cy="44" r="3.4" fill="#0b0f16" opacity=".7" />
            {/* face in the opening */}
            <path d="M82 34 C82 26 118 26 118 34 L118 54 C116 66 106 72 100 72 C94 72 84 66 82 54 Z" fill={u("fc")} />
            <path d="M82 34 C88 30 112 30 118 34 L118 38 C112 35 88 35 82 38 Z" fill="#000" opacity=".45" />
            <path d="M87 41 Q92 38 96 41" stroke="#1b1410" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M104 41 Q108 38 113 41" stroke="#1b1410" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <ellipse cx="92" cy="43.5" rx="2.6" ry="1.6" fill="#1b1410" /><ellipse cx="108" cy="43.5" rx="2.6" ry="1.6" fill="#1b1410" />
            <path d="M100 44 L98 53 L102 53" stroke="#000" strokeOpacity=".25" strokeWidth="1.4" fill="none" />
            <path d="M94 60 Q100 62 106 60" stroke="#3a2418" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {g.eyeBlack === "stripes" && <><rect x="87" y="47" width="10" height="3" rx="1.4" fill="#0b0b0b" /><rect x="103" y="47" width="10" height="3" rx="1.4" fill="#0b0b0b" /></>}
            {g.eyeBlack === "sticker" && <><rect x="86" y="46.5" width="11" height="4.5" rx="1" fill="#0b0b0b" /><rect x="103" y="46.5" width="11" height="4.5" rx="1" fill="#0b0b0b" /></>}
            {g.visor !== "none" && <path d="M80 36 L120 36 L119 48 Q100 51 81 48 Z" fill={g.visor === "iridescent" ? `url(#${id}vi)` : g.visor === "smoke" ? "#0b1220" : "#dbeafe"} opacity={g.visor === "clear" ? 0.35 : 0.9} />}
            {/* facemask and chin strap */}
            <g stroke="#c9ced6" strokeWidth="3.2" fill="none" strokeLinecap="round">
              <path d="M74 50 Q100 60 126 50" />
              {g.mask !== "open" && <path d="M76 58 Q100 68 124 58" />}
              {(g.mask === "bar3" || g.mask === "cage") && <path d="M80 65 Q100 73 120 65" />}
              {g.mask === "cage" && <><path d="M100 52 L100 72" /><path d="M89 53 L88 69" /><path d="M111 53 L112 69" /></>}
              <path d="M74 50 L72 60" /><path d="M126 50 L128 60" />
            </g>
            <path d="M86 70 Q100 78 114 70" stroke="#e5e7eb" strokeWidth="2.6" fill="none" />
          </g>
        </g>
      </svg>
      {label && <div style={{ fontSize: Math.max(10, Math.round(h / 15)), fontWeight: 800, color: "#e2e8f0", marginTop: 2, whiteSpace: "nowrap", textAlign: "center" }}>{(p.name || "").split(" ").slice(1).join(" ") || p.name} <span style={{ color: "#94a3b8", fontWeight: 700 }}>{p.pos} {p.ovr}</span></div>}
    </div>
  );
}

// A club's best healthy player (kickers and punters aside).
export const starOf = (t) => [...(t?.roster || [])].filter((p) => !p.injured && !p.holdout && p.pos !== "K" && p.pos !== "P").sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0] || null;
