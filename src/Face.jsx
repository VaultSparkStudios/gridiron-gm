// Player and coach portraits: a head-and-shoulders bust in a round frame, drawn from the face
// numbers every player carries (skin, hair color and style, jaw, eyes, nose, mouth, brow). The
// same numbers always draw the same face; a beard or goatee comes from them too.
import React from "react";
import { headshotUrl } from "./headshots.js";
import { portraitSrc } from "./portraits.js";
import { COACH_HEADSHOTS } from "./data/coachHeadshots.js";

// A real coach's photo (his club's staff page, cropped to the face; or ESPN's), by name.
export const coachPhoto = (name, w = 160) => {
  const p = COACH_HEADSHOTS[name];
  if (!p) return null;
  if (p.startsWith("espn:")) return `https://a.espncdn.com/i/headshots/nfl/coaches/${p.slice(5)}`;
  const [type, path] = [p.slice(0, p.indexOf("/")), p.slice(p.indexOf("/") + 1)];
  return `https://static.clubs.nfl.com/image/${type}/c_thumb,g_face,w_${w},h_${w}/f_auto/${path}`;
};

// photos that wouldn't load (offline, or none on file): drawn faces from then on
const BAD = new Set();

// Darken or lighten a #rrggbb color by f (-1..1).
function shade(hex, f) {
  const n = parseInt(String(hex || "#888888").slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `#${[ch(n >> 16), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

let uid = 0;
// coach: a coach's name; a real coach shows his photo instead of the drawn face.
export const Face = ({ s: se, sz = 40, jersey, coach }) => {
  const id = React.useMemo(() => `fc${++uid}`, []);
  const [, setBad] = React.useState(0);
  const cp = coach && !BAD.has(`c:${coach}`) && coachPhoto(coach, sz > 90 ? 320 : 160);
  if (cp) return (
    <span style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", display: "inline-block", flexShrink: 0, verticalAlign: "middle", background: "radial-gradient(circle at 50% 30%, #64748b, #1f2937 72%)" }}>
      <img src={cp} alt="" loading="lazy" draggable="false" onError={() => { BAD.add(`c:${coach}`); setBad((x) => x + 1); }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
  if (!se) return null;
  // a real player: his ESPN headshot (a prospect's college one), in the same round frame
  if (se.espn && !BAD.has(se.espn)) return (
    <span style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", display: "inline-block", flexShrink: 0, verticalAlign: "middle", background: "radial-gradient(circle at 50% 30%, #64748b, #1f2937 72%)", boxShadow: jersey ? `inset 0 0 0 2px ${jersey}` : undefined }}>
      <img src={headshotUrl(se.espn, sz > 90 ? 320 : 160, !!se.cfb)} alt="" loading="lazy" draggable="false" onError={() => { BAD.add(se.espn); setBad((x) => x + 1); }} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", display: "block" }} />
    </span>
  );
  // a fictional player: his photo from the portrait bank (portraits.js), whole, on a team-color circle
  const ps = se.pid && !BAD.has(se.pid) && portraitSrc(se.pid);
  if (ps) return (
    <span style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", display: "inline-block", flexShrink: 0, verticalAlign: "middle", background: `radial-gradient(circle at 50% 35%, ${jersey ? shade(jersey, 0.25) : "#64748b"}, ${jersey ? shade(jersey, -0.55) : "#1f2937"} 75%)` }}>
      <img src={ps} alt="" loading="lazy" draggable="false" onError={() => { BAD.add(se.pid); setBad((x) => x + 1); }} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    </span>
  );
  const cx = 50;
  const W = 30 + ((se.jw ?? 21) - 18) * 1.1; // head width
  const L = W / 2;
  const chin = 66 + ((se.fh ?? 31) - 28) * 0.9; // chin height
  const skin = se.sk || "#c68642", dark = shade(skin, -0.22), hair = se.hr || "#1a1a1a";
  const style = (se.hs ?? 1) % 6;
  const seed = ((se.ew ?? 4) * 7 + (se.eh ?? 3) * 3 + (se.nw ?? 5) * 5 + (se.mw ?? 8) + (se.jw ?? 21) + (se.er ?? 3)) % 6;
  const beard = seed === 0 ? "full" : seed === 1 ? "goatee" : seed === 2 ? "stubble" : null;
  const shirt = jersey || "#334155";
  const head = `M${cx - L} 44 C${cx - L} 27 ${cx - L + 5} 20 ${cx} 20 C${cx + L - 5} 20 ${cx + L} 27 ${cx + L} 44 C${cx + L} 56 ${cx + L * 0.55} ${chin} ${cx} ${chin} C${cx - L * 0.55} ${chin} ${cx - L} 56 ${cx - L} 44 Z`;
  // the hair cap: covers the top of the skull down to a hairline at about y=31
  const cap = (top = 17, line = 31, side = 42) => `M${cx - L - 1} ${side} C${cx - L - 2} 25 ${cx - L + 5} ${top} ${cx} ${top} C${cx + L - 5} ${top} ${cx + L + 2} 25 ${cx + L + 1} ${side} C${cx + L - 1} 35 ${cx + L - 4} ${line + 1} ${cx + L * 0.45} ${line} Q${cx} ${line - 2} ${cx - L * 0.45} ${line} C${cx - L + 4} ${line + 1} ${cx - L + 1} 35 ${cx - L - 1} ${side} Z`;
  const eyeY = 44, eyeDx = 7 + ((se.jw ?? 21) - 18) * 0.15;
  const browY = 39.5 - (se.bh ?? 2) * 0.5;
  const mouthW = 4 + (se.mw ?? 8) * 0.35, mouthY = chin - 8;
  const noseW = 1.8 + (se.nw ?? 5) * 0.25;
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} aria-hidden="true">
      <defs><clipPath id={id}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect width="100" height="100" fill="#1f2937" />
        <g transform="translate(50 54) scale(1.14) translate(-50 -50)">
        {/* shoulders and jersey */}
        <path d={`M4 100 C6 84 26 77 50 77 C74 77 94 84 96 100 Z`} fill={shirt} />
        <path d={`M${cx - 9} 77 L${cx} 86 L${cx + 9} 77 Z`} fill={shade(shirt, -0.35)} />
        {/* neck */}
        <path d={`M${cx - L * 0.5} ${chin - 8} L${cx - L * 0.5} 79 Q${cx} 84 ${cx + L * 0.5} 79 L${cx + L * 0.5} ${chin - 8} Z`} fill={dark} />
        {/* ears */}
        <ellipse cx={cx - L + 0.5} cy="46" rx={2.6 + (se.er ?? 3) * 0.3} ry="5" fill={skin} />
        <ellipse cx={cx + L - 0.5} cy="46" rx={2.6 + (se.er ?? 3) * 0.3} ry="5" fill={skin} />
        {/* locs hang behind the head */}
        {style === 4 && [-1, 1].map((d) => [0, 1, 2].map((k) => <rect key={`${d}${k}`} x={cx + d * (L - 1 + k * 1.2) - 1.6} y={30 + k * 2} width="3.2" height={20 - k * 3} rx="1.6" fill={hair} />))}
        <path d={head} fill={skin} />
        {/* jaw shadow */}
        <path d={`M${cx - L * 0.7} ${chin - 6} Q${cx} ${chin + 2} ${cx + L * 0.7} ${chin - 6} Q${cx} ${chin - 1} ${cx - L * 0.7} ${chin - 6} Z`} fill={dark} opacity=".35" />
        {/* hair */}
        {style === 1 && <path d={cap(19, 30, 38)} fill={hair} opacity=".55" />}
        {style === 2 && <path d={cap(17, 31, 42)} fill={hair} />}
        {style === 3 && <><path d={cap(17, 31, 41)} fill={hair} /><rect x={cx - L + 3} y="10" width={W - 6} height="13" rx="6.5" fill={hair} /></>}
        {style === 4 && <path d={cap(16, 31, 43)} fill={hair} />}
        {style === 5 && <><path d={cap(16, 30, 43)} fill={hair} /><path d={`M${cx - L - 1} 30 Q${cx - 4} 14 ${cx + L + 1} 27 Q${cx + 2} 22 ${cx - L - 1} 30 Z`} fill={shade(hair, 0.12)} /></>}
        {style === 0 && <ellipse cx={cx - L * 0.35} cy="25" rx="5" ry="2.2" fill="#fff" opacity=".12" />}
        {/* brows */}
        <path d={`M${cx - eyeDx - 4} ${browY + 0.6} Q${cx - eyeDx} ${browY - 1.2} ${cx - eyeDx + 4} ${browY + 0.4}`} stroke={shade(hair, -0.1)} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d={`M${cx + eyeDx - 4} ${browY + 0.4} Q${cx + eyeDx} ${browY - 1.2} ${cx + eyeDx + 4} ${browY + 0.6}`} stroke={shade(hair, -0.1)} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        {/* eyes */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <ellipse cx={cx + d * eyeDx} cy={eyeY} rx={2.6 + (se.ew ?? 4) * 0.15} ry={1.5 + (se.eh ?? 3) * 0.15} fill="#f8fafc" />
            <circle cx={cx + d * eyeDx} cy={eyeY + 0.1} r="1.45" fill="#24170f" />
            <circle cx={cx + d * eyeDx + 0.5} cy={eyeY - 0.4} r=".45" fill="#fff" />
          </g>
        ))}
        {/* nose */}
        <path d={`M${cx - 0.6} ${eyeY + 2} Q${cx - 1.2} ${eyeY + 7} ${cx - noseW} ${eyeY + 9} Q${cx} ${eyeY + 10.6} ${cx + noseW} ${eyeY + 9}`} stroke={dark} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        {/* beard (drawn before the mouth so the lips sit on top) */}
        {beard === "full" && <path d={`M${cx - L + 0.5} 47 C${cx - L + 1} 58 ${cx - L * 0.5} ${chin + 1.5} ${cx} ${chin + 1.5} C${cx + L * 0.5} ${chin + 1.5} ${cx + L - 1} 58 ${cx + L - 0.5} 47 C${cx + L - 3} 54 ${cx + 6} ${mouthY - 3} ${cx} ${mouthY - 3.5} C${cx - 6} ${mouthY - 3} ${cx - L + 3} 54 ${cx - L + 0.5} 47 Z`} fill={hair} opacity=".92" />}
        {beard === "goatee" && <><path d={`M${cx - mouthW / 2 - 1.5} ${mouthY - 2.5} Q${cx} ${mouthY - 4.5} ${cx + mouthW / 2 + 1.5} ${mouthY - 2.5} L${cx + mouthW / 2 + 1} ${mouthY - 1.2} Q${cx} ${mouthY - 2.6} ${cx - mouthW / 2 - 1} ${mouthY - 1.2} Z`} fill={hair} /><path d={`M${cx - 4} ${mouthY + 2.5} Q${cx} ${chin + 1.5} ${cx + 4} ${mouthY + 2.5} Q${cx} ${mouthY + 4} ${cx - 4} ${mouthY + 2.5} Z`} fill={hair} /></>}
        {beard === "stubble" && <path d={`M${cx - L + 1.5} 50 C${cx - L + 2} 58 ${cx - L * 0.5} ${chin} ${cx} ${chin} C${cx + L * 0.5} ${chin} ${cx + L - 2} 58 ${cx + L - 1.5} 50 C${cx + L - 4} 56 ${cx + 6} ${mouthY - 2} ${cx} ${mouthY - 2.5} C${cx - 6} ${mouthY - 2} ${cx - L + 4} 56 ${cx - L + 1.5} 50 Z`} fill={hair} opacity=".28" />}
        {/* mouth */}
        <path d={`M${cx - mouthW / 2} ${mouthY} Q${cx} ${mouthY + 1.8} ${cx + mouthW / 2} ${mouthY}`} stroke={shade(skin, -0.5)} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
};
