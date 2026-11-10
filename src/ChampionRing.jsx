// The Super Bowl ring, drawn as the real thing in three-quarter view: a polished gold band with the
// club, the game and the year engraved around it, a raised crown with a pavé diamond border, the club's colors in enamel,
// its logo in a diamond halo between two Lombardi trophies, and light running across the metal.
import React, { useId } from "react";
import { logoUrl } from "./ui.jsx";
import { sbName, sbNumber } from "./data/superbowls.js";

// A rounded square (a superellipse), traced finely.
const trace = (cx, cy, a, b, n, e = 4) => Array.from({ length: n }, (_, i) => {
  const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
  return [cx + a * Math.sign(c) * Math.abs(c) ** (2 / e), cy + b * Math.sign(s) * Math.abs(s) ** (2 / e)];
});
// n points evenly spaced along it, for setting stones.
function around(cx, cy, a, b, n, e = 4) {
  const pts = trace(cx, cy, a, b, 720, e), d = [0];
  for (let i = 1; i <= pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]));
  const len = d[d.length - 1];
  let j = 0;
  return Array.from({ length: n }, (_, k) => { const want = (k / n) * len; while (d[j + 1] < want) j++; return pts[j]; });
}
const squircle = (cx, cy, a, b, e = 4) => trace(cx, cy, a, b, 96, e).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("") + "Z";

function Lombardi({ x, y, s = 1, id }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-5,26 L5,26 L4,22 L1.6,20 L1.2,4 C4.5,1 6.5,-3 6,-8 L-6,-8 C-6.5,-3 -4.5,1 -1.2,4 L-1.6,20 L-4,22 Z" fill={`url(#${id}-gold)`} stroke="#5a420f" strokeWidth=".5" />
      <ellipse cx="0" cy="-12" rx="4.6" ry="5.2" fill={`url(#${id}-dia)`} stroke="#fff" strokeWidth=".4" transform="rotate(-25 0 -12)" />
      <path d="M-2.2,-14.5 L2.4,-9.6 M-3,-11.5 L1.6,-8.2" stroke="#94a3b8" strokeWidth=".5" />
    </g>
  );
}

export default function ChampionRing({ t, yr, size = 210, titles = 1 }) {
  const id = "cr" + (t?.ab || "") + useId().replace(/[^a-zA-Z0-9]/g, "");
  const clr = t?.clr || "#1e3a8a", ac = t?.ac || "#e8c45a";
  const sb = sbName(sbNumber(yr)).toUpperCase();
  const CX = 130, BY = 98; // crown center
  const pave = around(CX, BY, 67, 51, 44);
  const halo = Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2; return [CX + Math.cos(a) * 29, BY + Math.sin(a) * 29]; });
  const sparkles = [pave[3], pave[17], pave[26], halo[15], pave[35]];
  const crown = squircle(CX, BY, 77, 61);
  const bandText = `${t?.ab || ""}  ✦  ${sb}  ✦  ${yr}`;
  return (
    <svg viewBox="0 0 260 260" width={size} height={size} role="img" aria-label={`${yr} championship ring`} style={{ overflow: "visible", filter: "drop-shadow(0 18px 26px #000d) drop-shadow(0 0 34px #fbbf2440)" }}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a420f" /><stop offset=".12" stopColor="#c99a2e" /><stop offset=".26" stopColor="#fff1b8" /><stop offset=".4" stopColor="#b8891f" />
          <stop offset=".55" stopColor="#f3d374" /><stop offset=".7" stopColor="#8a6418" /><stop offset=".85" stopColor="#ecc95e" /><stop offset="1" stopColor="#4a360c" />
        </linearGradient>
        <linearGradient id={`${id}-goldv`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3c4" /><stop offset=".3" stopColor="#e2b647" /><stop offset=".75" stopColor="#8a6418" /><stop offset="1" stopColor="#3d2c08" /></linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a87a1c" /><stop offset=".45" stopColor="#f0cf6a" /><stop offset="1" stopColor="#5a420f" /></linearGradient>
        <radialGradient id={`${id}-dia`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#ffffff" /><stop offset=".3" stopColor="#eef6ff" /><stop offset=".65" stopColor="#b6c6dc" /><stop offset="1" stopColor="#64748b" /></radialGradient>
        <radialGradient id={`${id}-enamel`} cx=".4" cy=".3" r=".85"><stop offset="0" stopColor={clr} stopOpacity=".75" /><stop offset=".55" stopColor={clr} /><stop offset="1" stopColor="#000" stopOpacity=".9" /></radialGradient>
        <radialGradient id={`${id}-pearl`} cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#e9eef5" /><stop offset="1" stopColor="#a8b4c6" /></radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id={`${id}-hole`}><rect width="260" height="260" fill="#fff" /><ellipse cx={CX} cy="176" rx="60" ry="27" fill="#000" /></mask>
        <clipPath id={`${id}-metal`}><path d={crown} /><ellipse cx={CX} cy="182" rx="80" ry="42" /></clipPath>
        <path id={`${id}-arc`} d={`M${CX - 74},190 A74,34 0 0 0 ${CX + 74},190`} />
        <symbol id={`${id}-stone`} viewBox="-5 -5 10 10">
          <circle r="4.6" fill={`url(#${id}-dia)`} stroke="#7a5a14" strokeWidth=".7" />
          <path d="M-3.2,0 L0,-3.2 L3.2,0 L0,3.2 Z" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".45" />
          <circle cx="-1.4" cy="-1.5" r=".9" fill="#fff" />
        </symbol>
      </defs>

      {/* the band: its edge, then the polished face, with the hole cut through */}
      <g mask={`url(#${id}-hole)`}>
        <ellipse cx={CX} cy="190" rx="80" ry="42" fill="#3d2c08" />
        <ellipse cx={CX} cy="182" rx="80" ry="42" fill={`url(#${id}-gold)`} />
        <ellipse cx={CX} cy="182" rx="73" ry="36" fill="none" stroke="#fff6d0" strokeOpacity=".35" strokeWidth="1" />
      </g>
      {/* the inside of the band, in shadow at the back */}
      <path d={`M${CX - 60},176 A60,27 0 0 1 ${CX + 60},176 A60,22 0 0 0 ${CX - 60},176 Z`} fill="#2a1e05" opacity=".85" />
      <text fontSize="10" fontWeight="900" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing=".6" fill="#3d2c08">
        <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">{bandText}</textPath>
      </text>

      {/* shoulders rising into the crown */}
      <path d={`M${CX - 80},178 C${CX - 84},150 ${CX - 76},128 ${CX - 60},116 L${CX - 40},132 C${CX - 52},146 ${CX - 58},160 ${CX - 60},176 Z`} fill={`url(#${id}-goldv)`} stroke="#5a420f" strokeWidth=".6" />
      <path d={`M${CX + 80},178 C${CX + 84},150 ${CX + 76},128 ${CX + 60},116 L${CX + 40},132 C${CX + 52},146 ${CX + 58},160 ${CX + 60},176 Z`} fill={`url(#${id}-goldv)`} stroke="#5a420f" strokeWidth=".6" />

      {/* the crown: its side wall, the gold table, the pavé border, the enamel field */}
      <path d={squircle(CX, BY + 14, 77, 61)} fill={`url(#${id}-wall)`} stroke="#3d2c08" strokeWidth=".8" />
      <text x={CX} y={BY + 72} textAnchor="middle" fontSize="8.5" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="2.4" fill="#2a1e05">WORLD CHAMPIONS</text>
      <path d={crown} fill={`url(#${id}-gold)`} stroke="#5a420f" strokeWidth=".8" />
      <path d={squircle(CX, BY, 72, 56)} fill="none" stroke="#fff6d0" strokeOpacity=".5" strokeWidth=".8" />
      {pave.map(([x, y], i) => <use key={i} href={`#${id}-stone`} x={x - 5} y={y - 5} width="10" height="10" />)}
      <path d={squircle(CX, BY, 59, 43)} fill={`url(#${id}-goldv)`} />
      <path d={squircle(CX, BY, 56, 40)} fill={`url(#${id}-enamel)`} stroke={ac} strokeOpacity=".6" strokeWidth=".8" />
      <ellipse cx={CX - 18} cy={BY - 22} rx="30" ry="10" fill="#fff" opacity=".12" />
      <circle cx={CX} cy={BY} r="33" fill="#00000055" />
      {halo.map(([x, y], i) => <use key={i} href={`#${id}-stone`} x={x - 3.4} y={y - 3.4} width="6.8" height="6.8" />)}
      <circle cx={CX} cy={BY} r="25" fill={`url(#${id}-pearl)`} stroke="#7a5a14" strokeWidth="1" />
      <image href={logoUrl(t?.ab)} x={CX - 20} y={BY - 20} width="40" height="40" preserveAspectRatio="xMidYMid meet" />
      <Lombardi id={id} x={CX - 44} y={BY - 6} s={0.95} />
      <Lombardi id={id} x={CX + 44} y={BY - 6} s={0.95} />
      {titles > 1 && <text x={CX} y={BY + 36} textAnchor="middle" fontSize="7" fontWeight="900" fill="#fde68a" fontFamily="Georgia, serif" letterSpacing="1">{"✦".repeat(Math.min(titles, 8))}</text>}

      {/* light running across the metal, and stones catching it */}
      <g clipPath={`url(#${id}-metal)`} style={{ mixBlendMode: "screen" }}>
        <rect x="-120" y="0" width="70" height="260" fill={`url(#${id}-shine)`} transform="skewX(-22)">
          <animate attributeName="x" values="-120;380;380" keyTimes="0;.45;1" dur="4.2s" repeatCount="indefinite" />
        </rect>
      </g>
      {sparkles.map(([x, y], i) => (
        <path key={i} d={`M${x},${y - 7} L${x + 1.2},${y - 1.2} L${x + 7},${y} L${x + 1.2},${y + 1.2} L${x},${y + 7} L${x - 1.2},${y + 1.2} L${x - 7},${y} L${x - 1.2},${y - 1.2} Z`} fill="#fff" opacity="0">
          <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.12;.3;1" dur="3s" begin={`${0.5 + i * 0.55}s`} repeatCount="indefinite" />
        </path>
      ))}
    </svg>
  );
}
