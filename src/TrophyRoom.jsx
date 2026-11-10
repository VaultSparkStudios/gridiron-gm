// The trophy room: lit wooden shelves holding every Super Bowl the franchise has ever won (real
// history plus this league), and the MVP / Offensive / Defensive Player of the Year trophies your
// players win while you're the GM. Each trophy is drawn in layers and turns slowly in 3D; hover
// (or tap) one to see who won it and when.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LombardiStill } from "./Lombardi.jsx";
import { C, TeamLogo, Hero, Chips } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { SUPER_BOWLS, sbName, sbNumber } from "./data/superbowls.js";
import opoyArt from "./assets/opoy.webp";
import dpoyArt from "./assets/dpoy.webp";
import mvpArt from "./assets/mvp.webp";
import sbmvpArt from "./assets/sbmvp.webp";
import oroyArt from "./assets/oroy.webp";
import droyArt from "./assets/droy.webp";

// The real trophies, as artwork: MVP, Offensive and Defensive Player of the Year (the NFL Honors
// trophy) and the Super Bowl MVP football.
const TROPHY_ART = { mvp: mvpArt, opoy: opoyArt, dpoy: dpoyArt, sbmvp: sbmvpArt, oroy: oroyArt, droy: droyArt };
import { TEAM_HISTORY } from "./data/teamHistory.js";
import { Rafters, GoldJackets, RingOfHonor, RecordsWall } from "./LegacyHall.jsx";
import { posTag } from "./dline.js";

const AWARDS = [["mvp", "MVP", "Most Valuable Player"], ["opoy", "OPOY", "Offensive Player of the Year"], ["dpoy", "DPOY", "Defensive Player of the Year"], ["oroy", "OROY", "Offensive Rookie of the Year"], ["droy", "DROY", "Defensive Rookie of the Year"], ["sbmvp", "SB MVP", "Super Bowl MVP"]];

// Shared gradients, defined once for every trophy on the page.
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <radialGradient id="tr-silverBall" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".3" stopColor="#e5e7eb" /><stop offset=".7" stopColor="#9ca3af" /><stop offset="1" stopColor="#4b5563" /></radialGradient>
        <linearGradient id="tr-silver" x1="0" x2="1"><stop offset="0" stopColor="#64748b" /><stop offset=".35" stopColor="#f8fafc" /><stop offset=".55" stopColor="#cbd5e1" /><stop offset=".8" stopColor="#64748b" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
        <linearGradient id="tr-standL" x1="0" x2="1"><stop offset="0" stopColor="#64748b" /><stop offset="1" stopColor="#f1f5f9" /></linearGradient>
        <linearGradient id="tr-standR" x1="0" x2="1"><stop offset="0" stopColor="#e2e8f0" /><stop offset="1" stopColor="#475569" /></linearGradient>
        <linearGradient id="tr-gold" x1="0" x2="1"><stop offset="0" stopColor="#7c5a10" /><stop offset=".35" stopColor="#fde68a" /><stop offset=".55" stopColor="#d4a017" /><stop offset=".85" stopColor="#8a6212" /><stop offset="1" stopColor="#fcd34d" /></linearGradient>
        <radialGradient id="tr-goldBall" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fff7cc" /><stop offset=".3" stopColor="#fbbf24" /><stop offset=".75" stopColor="#a16207" /><stop offset="1" stopColor="#5b3a06" /></radialGradient>
        <linearGradient id="tr-base" x1="0" x2="1"><stop offset="0" stopColor="#0b0f19" /><stop offset=".45" stopColor="#374151" /><stop offset="1" stopColor="#0b0f19" /></linearGradient>
      </defs>
    </svg>
  );
}

const Plinth = ({ label, band }) => (
  <>
    <rect x="20" y="204" width="60" height="32" rx="2" fill="url(#tr-base)" />
    <rect x="20" y="204" width="60" height="3" fill={band} />
    <rect x="33" y="214" width="34" height="12" rx="1.5" fill="url(#tr-gold)" />
    <text x="50" y="223" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#3b2a05" fontFamily="Georgia, serif">{label}</text>
  </>
);

// The Vince Lombardi Trophy: a football in kicking position on a tapering three-sided stand.
const LombardiSvg = ({ label }) => (
  <svg viewBox="0 0 100 240" width="100%" height="100%">
    <g transform="translate(-10.6 0) rotate(-20 50 58)">
      <ellipse cx="50" cy="56" rx="19" ry="31" fill="url(#tr-silverBall)" />
      <path d="M50 25 C40 42 40 70 50 87" stroke="#9ca3af" strokeWidth="1" fill="none" opacity=".7" />
      <path d="M50 25 C60 42 60 70 50 87" stroke="#6b7280" strokeWidth=".8" fill="none" opacity=".5" />
      <path d="M50 38 L50 68" stroke="#6b7280" strokeWidth="1.6" />
      {[41, 46, 51, 56, 61, 66].map((y) => <path key={y} d={`M46.5 ${y} L53.5 ${y}`} stroke="#6b7280" strokeWidth="1.2" />)}
    </g>
    <ellipse cx="50" cy="87" rx="5" ry="1.8" fill="#cbd5e1" />
    <path d="M45.5 87 C44 146 37 182 29 204 L50 204 L50 87 Z" fill="url(#tr-standL)" />
    <path d="M54.5 87 C56 146 63 182 71 204 L50 204 L50 87 Z" fill="url(#tr-standR)" />
    <path d="M50 87 L50 206" stroke="#fff" strokeWidth=".7" opacity=".6" />
    <rect x="25" y="199" width="50" height="7" rx="1.5" fill="url(#tr-silver)" />
    <Plinth label={label} band="url(#tr-silver)" />
  </svg>
);

// MVP: a gold football on a fluted gold column.
const Mvp = () => (
  <svg viewBox="0 0 100 240" width="100%" height="100%">
    <ellipse cx="50" cy="84" rx="30" ry="17" fill="url(#tr-goldBall)" />
    <path d="M22 84 C34 72 66 72 78 84" stroke="#a16207" strokeWidth="1" fill="none" opacity=".7" />
    <path d="M38 77 L62 77" stroke="#7c5a10" strokeWidth="1.6" />
    {[41, 45, 49, 53, 57, 61].map((x) => <path key={x} d={`M${x} 74 L${x} 80`} stroke="#7c5a10" strokeWidth="1.1" />)}
    <path d="M42 106 L58 106 L54 100 L46 100 Z" fill="url(#tr-gold)" />
    <rect x="41" y="106" width="18" height="90" fill="url(#tr-gold)" />
    {[45, 50, 55].map((x) => <path key={x} d={`M${x} 110 L${x} 192`} stroke="#7c5a10" strokeWidth=".8" opacity=".55" />)}
    <ellipse cx="50" cy="106" rx="9" ry="2.4" fill="#fde68a" />
    <polygon points="50,138 53,146 61,146 55,151 57,159 50,154 43,159 45,151 39,146 47,146" fill="#fff7cc" stroke="#a16207" strokeWidth=".8" />
    <path d="M34 204 L66 204 L60 194 L40 194 Z" fill="url(#tr-gold)" />
    <Plinth label="MVP" band="url(#tr-gold)" />
  </svg>
);

// Player of the Year: a helmet on a pedestal (silver with a blue stripe for offense, gold with a
// red stripe for defense, facing the other way).
const Helmet = ({ shell, stripe, mask, label, flip }) => (
  <svg viewBox="0 0 100 240" width="100%" height="100%">
    <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined}>
      <path d="M16 104 C8 70 28 42 56 42 C78 42 90 62 88 84 L86 98 L70 100 L66 112 L38 114 C26 114 19 110 16 104 Z" fill={shell} />
      <path d="M24 58 C38 45 60 42 76 50" stroke={stripe} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M30 66 C30 56 40 50 50 50" stroke="#fff" strokeWidth="2" fill="none" opacity=".45" strokeLinecap="round" />
      <circle cx="50" cy="92" r="3.2" fill="#1f2937" />
      <path d="M84 80 L96 82 L96 104 L80 106 M86 92 L96 93 M70 100 L80 106 M88 82 L88 104" stroke={mask} strokeWidth="2.6" fill="none" strokeLinejoin="round" />
    </g>
    <rect x="30" y="116" width="40" height="6" rx="1" fill={shell === "url(#tr-goldBall)" ? "url(#tr-gold)" : "url(#tr-silver)"} />
    <rect x="37" y="122" width="26" height="74" fill="url(#tr-base)" />
    <rect x="37" y="150" width="26" height="3" fill={stripe} />
    <path d="M30 204 L70 204 L64 196 L36 196 Z" fill="url(#tr-base)" />
    <Plinth label={label} band={stripe} />
  </svg>
);

// Rookie of the Year: a rising star on a slim column (silver and blue for offense, gold and red
// for defense).
const starPts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r : R; return `${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`; }).join(" ");
const RookieStar = ({ fill, metal, accent, label }) => (
  <svg viewBox="0 0 100 240" width="100%" height="100%">
    <polygon points={starPts(50, 74, 30, 13)} fill={fill} stroke={accent} strokeWidth="1.6" strokeLinejoin="round" />
    <polygon points={starPts(50, 74, 15, 6.5)} fill="#ffffff" opacity=".35" />
    <circle cx="50" cy="74" r="4" fill={accent} />
    <path d="M44 104 L56 104 L53 98 L47 98 Z" fill={metal} />
    <rect x="45" y="104" width="10" height="90" fill={metal} />
    <rect x="45" y="140" width="10" height="4" fill={accent} />
    <path d="M36 204 L64 204 L58 194 L42 194 Z" fill={metal} />
    <Plinth label={label} band={accent} />
  </svg>
);

const SHAPES = {
  lombardi: (t) => <LombardiSvg label={t.short} />,
  mvp: () => <Mvp />,
  opoy: () => <Helmet shell="url(#tr-silverBall)" stripe="#2563eb" mask="#94a3b8" label="OPOY" />,
  dpoy: () => <Helmet shell="url(#tr-goldBall)" stripe="#dc2626" mask="#7c5a10" label="DPOY" flip />,
  oroy: () => <RookieStar fill="url(#tr-silverBall)" metal="url(#tr-silver)" accent="#2563eb" label="OROY" />,
  droy: () => <RookieStar fill="url(#tr-goldBall)" metal="url(#tr-gold)" accent="#dc2626" label="DROY" />,
};
const LAYERS = [-3, -2, -1, 0, 1, 2, 3];

// A trophy's card floats over the page (not inside the shelf, which clips it): above the trophy when
// there's room, below it when not, and never off the sides of the screen.
function FloatTip({ anchor, children }) {
  const tip = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect(), t = tip.current;
      if (!a || !t) return;
      const w = t.offsetWidth, h = t.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
      const left = Math.max(8, Math.min(vw - w - 8, a.left + a.width / 2 - w / 2));
      const above = a.top - h - 6;
      const top = above >= 8 ? above : Math.min(vh - h - 8, a.bottom + 6);
      setPos({ left, top, font: getComputedStyle(anchor.current).fontFamily });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [anchor]);
  return createPortal(<div ref={tip} className="tr-tip" role="tooltip" style={{ position: "fixed", left: pos?.left ?? -9999, top: pos?.top ?? -9999, fontFamily: pos?.font, bottom: "auto", transform: "none", zIndex: 3000 }}>{children}</div>, document.body);
}

function Trophy({ t, i, on, setOn, small, spot }) {
  const ref = useRef(null);
  useEffect(() => { if (spot) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400); }, [spot]);
  if (t.kind === "lombardi") return (
    <div ref={ref} className={`tr-slot tr-lom${spot ? " tr-spot" : ""}`} onMouseEnter={() => setOn(t.key)} onMouseLeave={() => setOn(null)} onClick={() => setOn(on ? null : t.key)}>
      {on && <FloatTip anchor={ref}><div style={{ fontSize: 15, fontWeight: 900, color: "#fde68a" }}>{t.title}</div>{t.lines.filter(Boolean).map((l, k) => <div key={k} style={{ fontSize: 13, color: k ? "#cbd5e1" : "#fff", marginTop: 2 }}>{l}</div>)}</FloatTip>}
      {spot && <><div className="tr-beam" /><div className="tr-new">NEW</div></>}
      <div className="tr-pop" style={{ animationDelay: `${Math.min(i, 20) * 90}ms` }}>
        <div className="tr-lift"><LombardiStill size={spot ? (small ? 84 : 120) : small ? 74 : 100} /></div>
      </div>
      <div className="tr-plaque">{t.short}</div>
      <div className="tr-glow" />
    </div>
  );
  const shape = (SHAPES[t.kind] || SHAPES.mvp)(t);
  const layered = (
    <div className="tr-spin" style={{ animationDelay: `${-((i * 1.7) % 6)}s` }}>
      {LAYERS.map((z) => (
        <div key={z} className="tr-layer" style={{ transform: `translateZ(${z * 1.3}px)`, filter: z === 3 ? "none" : `brightness(${0.45 + (z + 3) * 0.08})` }}>{shape}</div>
      ))}
    </div>
  );
  // the real-looking 3D trophy, with the drawn one as a fallback when WebGL isn't available
  return (
    <div ref={ref} className="tr-slot tr-lom" onMouseEnter={() => setOn(t.key)} onMouseLeave={() => setOn(null)} onClick={() => setOn(on ? null : t.key)}>
      {on && (
        <FloatTip anchor={ref}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#fde68a" }}>{t.title}</div>
          {t.lines.filter(Boolean).map((l, k) => <div key={k} style={{ fontSize: 13, color: k ? "#cbd5e1" : "#fff", marginTop: 2 }}>{l}</div>)}
        </FloatTip>
      )}
      <div className="tr-pop" style={{ animationDelay: `${Math.min(i, 20) * 90}ms` }}>
        <div className="tr-lift">{TROPHY_ART[t.kind] ? <img src={TROPHY_ART[t.kind]} alt={t.title} style={t.kind === "sbmvp" ? { width: small ? 74 : 104, height: "auto", display: "block", margin: "0 auto", filter: "drop-shadow(0 8px 10px #000b)" } : { height: small ? 140 : 190, width: "auto", display: "block", margin: "0 auto", filter: "drop-shadow(0 8px 10px #000b)" }} /> : <div style={{ width: small ? 74 : 100, height: small ? 150 : 200 }}>{layered}</div>}</div>
      </div>
      <div className="tr-plaque">{t.plaque || t.kind.toUpperCase()}</div>
      <div className="tr-glow" />
    </div>
  );
}

const useWidth = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w;
};

function Shelf({ title, items, empty, perRow, on, setOn, start = 0, small, spot }) {
  const rows = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  if (!rows.length) rows.push([]);
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{title}</span>
        <span style={{ fontSize: 15, color: "#fde68a", fontWeight: 800 }}>{items.length || ""}</span>
      </div>
      <div className="tr-wall keep-dark">
        {rows.map((row, r) => (
          <div key={r} className="tr-row">
            <div className="tr-items">
              {!row.length && <div style={{ alignSelf: "center", color: "#a8a29e", fontSize: 15, padding: "40px 10px", textAlign: "center" }}>{empty}</div>}
              {row.map((t, k) => <Trophy key={t.key} t={t} i={start + r * perRow + k} on={on === t.key} setOn={setOn} small={small} spot={spot === t.key} />)}
            </div>
            <div className="tr-board" />
          </div>
        ))}
      </div>
    </div>
  );
}

// team: your club. champs: this league's champions. awards: season award winners by year.
export default function TrophyRoom({ team, ui, champs = [], awards = [], teams = [], spotlight = null, retired = [], yr = 2026, book = null, onInduct, onRetireNum, onRetired, onPass, papers = [], onPaper }) {
  const [on, setOn] = useState(null);
  const [sec, setSec] = useState(spotlight === "ring" ? "ring" : spotlight != null ? "trophies" : "banners");
  useEffect(() => { if (spotlight === "ring") setSec("ring"); else if (spotlight != null) setSec("trophies"); }, [spotlight]);
  const width = useWidth();
  const full = `${team.city} ${team.name}`;
  const lombardis = [
    ...SUPER_BOWLS.filter(([, , ab]) => ab === team.ab).map(([n, season, , as]) => ({
      key: `sb${n}`, kind: "lombardi", short: sbName(n).replace("Super Bowl ", ""), title: sbName(n),
      lines: [`${season} season · played ${season + 1}`, as ? `Won as the ${as}` : full],
    })),
    ...champs.filter((c) => (c.ti != null ? c.ti === ui : c.t === full)).map((c) => {
      const n = sbNumber(c.yr), opp = c.opp != null ? teams[c.opp] : null;
      return {
        key: `sb${n}`, kind: "lombardi", short: sbName(n).replace("Super Bowl ", ""), title: sbName(n),
        lines: [`${c.yr} season · played ${c.yr + 1}`, opp && c.score ? `Beat the ${opp.city} ${opp.name} ${c.score}` : full, c.gm === ui ? "Won with you as GM" : null],
      };
    }),
  ];
  const mine = [];
  for (const a of awards) {
    if (a.gm != null && a.gm !== ui) continue; // only what your players won with you running the team
    for (const [k, , name] of AWARDS) {
      const w = a[k];
      if (w && (w.ti != null ? w.ti === ui : w.team === team.ab)) mine.push({ key: `${k}${a.yr}`, kind: k, plaque: `${AWARDS.find((x) => x[0] === k)[1]} ${a.yr}`, title: `${a.yr} ${name}`, lines: [`${w.name}${w.pos ? ` · ${posTag(w)}` : ""}`, w.stat] });
    }
  }
  const perRow = Math.max(3, Math.floor(Math.min(width, 1300) / 132));
  const retiredHere = retired.filter((r) => r.team === team.ab);
  const hall = { ring: [], nums: [], pass: [], numPass: [], ...(team.legacyHall || {}) }; // pass / numPass: the ones you said no to
  const count = (k) => mine.filter((t) => t.kind === k).length;
  return (
    <div className="tr-room">
      <Defs />
      <style>{CSS}</style>
      {/* phones: a hero with the trophy count, the awards on one line, and the sections as chips */}
      {MOBILE && <>
        <Hero clr={team.clr} logo={team} eyebrow="Legacy Hall" title={team.name} sub={[["MVP", count("mvp")], ["OPOY", count("opoy")], ["DPOY", count("dpoy")], ["OROY", count("oroy")], ["DROY", count("droy")]].filter(([, v]) => v).map(([l, v]) => `${v} ${l}`).join(" · ") || "Banners, trophies and the Ring of Honor"}
          right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: lombardis.length ? "#fde68a" : "#fff" }}>{lombardis.length}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>SUPER BOWLS</div></div>} />
        <div style={{ position: "sticky", top: 0, zIndex: 5, background: C.bg, padding: "12px 0 10px", marginBottom: 6 }}>
          <Chips items={[["banners", "Banners"], ["trophies", "Trophies"], ["jackets", "Gold Jackets"], ["ring", "Ring of Honor"], ["records", "Records"], ...(onPaper ? [["gazette", "Gazette"]] : [])]} value={sec} onChange={setSec} />
        </div>
      </>}
      {/* desktop: the Season header already names the screen, so just the sections and a one-line tally */}
      {!MOBILE && <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16, position: "sticky", top: 0, zIndex: 5, background: C.bg, padding: "6px 0" }}>
        <div style={{ flex: 1, minWidth: 0 }}><Chips items={[["banners", "Banners"], ["trophies", "Trophies"], ["jackets", "Gold Jackets"], ["ring", "Ring of Honor"], ["records", "Records"], ...(onPaper ? [["gazette", "Gazette"]] : [])]} value={sec} onChange={setSec} /></div>
        <div style={{ fontSize: 15, color: C.mt, fontWeight: 700 }}>{[["Super Bowl", lombardis.length], ["MVP", count("mvp")], ["OPOY", count("opoy")], ["DPOY", count("dpoy")], ["OROY", count("oroy")], ["DROY", count("droy")]].filter(([, v]) => v).map(([l, v]) => <span key={l} style={{ marginLeft: 14 }}><b style={{ color: "#fde68a" }}>{v}</b> {l}{l === "Super Bowl" && v > 1 ? "s" : ""}</span>)}</div>
      </div>}
      {sec === "banners" && (() => {
        // real history before 2026, then everything won in this league
        const h = TEAM_HISTORY[team.ab] || { d: [], c: [], l: [] };
        const mine = (c) => (c.ti != null ? c.ti === ui : c.t === full);
        const sbs = [...SUPER_BOWLS.filter(([, , ab]) => ab === team.ab).map(([n, season]) => ({ yr: season, n })), ...champs.filter(mine).map((c) => ({ yr: c.yr }))];
        const confs = [...h.c, ...champs.filter((c) => mine(c) || c.opp === ui).map((c) => [c.yr, team.c])];
        const divs = [...h.d, ...(team.divTitles || []).map((y) => [y, `${team.c} ${team.d}`])];
        return <Rafters team={team} sbs={sbs} titles={h.l} confs={confs} divs={divs} />;
      })()}
      {sec === "trophies" && <><Shelf title="Super Bowl Championships" items={lombardis} empty="No Super Bowls yet. Win one and the Lombardi Trophy goes here." perRow={perRow} on={on} setOn={setOn} small={width <= 640} spot={spotlight != null && spotlight !== "ring" ? `sb${sbNumber(spotlight)}` : null} />
      <Shelf title="Player Awards" items={mine} empty="Win MVP, Offensive or Defensive Player of the Year, Super Bowl MVP or a Rookie of the Year award with you as GM and the trophy goes here." perRow={perRow} on={on} setOn={setOn} start={lombardis.length} small={width <= 640} /></>}
      {sec === "jackets" && <GoldJackets team={team} hofers={retiredHere.filter((r) => r.hof)} yr={yr} onOpen={onRetired} />}
      {sec === "ring" && <RingOfHonor team={team} retired={retiredHere} hall={hall} onInduct={onInduct || (() => {})} onRetireNum={onRetireNum || (() => {})} onOpen={onRetired} onPass={onPass} />}
      {sec === "records" && <RecordsWall team={team} retired={retiredHere} book={book} teams={teams} allRetired={retired} />}
      {sec === "gazette" && <GazetteArchive papers={papers} onOpen={onPaper} />}
    </div>
  );
}

// Every Gazette front page from your seasons, newest first: championships, playoff games and the
// special editions (deadline day, the draft, the Hall of Fame). Tap one to read it again.
const KIND_TAG = { champ: ["CHAMPIONSHIP", "#b8860b"], deadline: ["DEADLINE", "#7c3aed"], draft: ["DRAFT EXTRA", "#0e7490"], hof: ["HALL OF FAME", "#a16207"], rival: ["RIVAL PAPER", "#b91c1c"] };
function GazetteArchive({ papers, onOpen }) {
  useEffect(() => {
    if (document.getElementById("gz-fonts")) return;
    const l = document.createElement("link"); l.id = "gz-fonts"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=IM+Fell+Double+Pica:ital@0;1&display=swap"; document.head.appendChild(l);
  }, []);
  if (!papers.length) return <div style={{ color: C.mt, fontSize: 15, padding: 20, textAlign: "center" }}>No papers yet. Playoff games, Trade Deadline Day, the draft and Hall of Fame classes all make the front page.</div>;
  const years = [...new Set(papers.map((p) => p.yr))].sort((a, b) => b - a);
  const order = (p) => (p.kind === "champ" ? 9 : p.kind ? { deadline: 1, draft: 7, hof: 8, rival: 2 }[p.kind] ?? 3 : 3 + (p.rd || 0) * 0.5);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {years.map((y) => (
        <div key={y}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{y} season</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 }}>
            {papers.filter((p) => p.yr === y).sort((a, b) => order(b) - order(a)).map((p, i) => {
              const [tag, clr] = KIND_TAG[p.kind] || [String(p.round || "PLAYOFFS").toUpperCase(), p.youWon ? "#15803d" : "#57534e"];
              return (
                <button key={i} onClick={() => onOpen(p)} style={{ textAlign: "left", cursor: "pointer", background: "#f3eddf", color: "#151310", border: p.kind === "champ" ? "2px solid #d4a017" : "1px solid #d6cdb8", borderRadius: 6, padding: "10px 12px 12px", boxShadow: "0 2px 8px #0006", fontFamily: "'IM Fell English', Georgia, serif" }}>
                  <div style={{ fontFamily: "'UnifrakturMaguntia', 'IM Fell English', serif", fontSize: 15, textAlign: "center", borderBottom: "1px solid #151310", paddingBottom: 3, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.mast || "The Gridiron Gazette"}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: clr, fontFamily: "system-ui, sans-serif" }}>{tag}</div>
                  <div style={{ fontSize: 16, lineHeight: 1.15, fontWeight: 700, marginTop: 2 }}>{p.head}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const CSS = `
.tr-wall { border-radius: 12px; overflow: visible; background: radial-gradient(ellipse at 50% -10%, #3b2f2433, transparent 60%), linear-gradient(180deg, #1c1613, #110d0b); border: 1px solid #2b211b; padding: 8px 12px 14px; }
.tr-row { position: relative; padding-top: 18px; }
.tr-row + .tr-row { margin-top: 10px; }
.tr-items { display: flex; justify-content: center; align-items: flex-end; gap: 14px; min-height: 150px; padding: 0 6px; position: relative; z-index: 1; }
.tr-board { height: 16px; margin: -4px -6px 0; border-radius: 3px; background: linear-gradient(180deg, #a06a35, #6b4420 45%, #3d2611); box-shadow: 0 12px 18px #000c, inset 0 1px 0 #d39a5c88; }
.tr-slot { position: relative; width: 104px; height: 218px; cursor: pointer; perspective: 600px; }
.tr-slot::before { content: ""; position: absolute; left: 50%; top: -18px; width: 150px; height: 240px; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 0%, #fff6d930, transparent 65%); pointer-events: none; }
.tr-pop { width: 100%; height: 100%; animation: trPop .7s cubic-bezier(.2,.9,.3,1.3) both; }
.tr-lift { width: 100%; height: 100%; transition: transform .3s ease; }
.tr-slot:hover .tr-lift { transform: translateY(-6px) scale(1.06); }
.tr-spin { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; animation: trSway 6s ease-in-out infinite alternate; }
.tr-layer { position: absolute; inset: 0; backface-visibility: visible; }
.tr-glow { position: absolute; left: 50%; bottom: -6px; width: 80%; height: 12px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(#000c, transparent 70%); }
.tr-slot:hover .tr-glow { background: radial-gradient(#fde68a55, transparent 70%); }
.tr-tip { position: absolute; z-index: 20; left: 50%; bottom: calc(100% + 4px); transform: translateX(-50%); width: 220px; padding: 10px 12px; border-radius: 10px; background: #0b1220f2; border: 1px solid #d4a017; box-shadow: 0 10px 24px #000b; text-align: center; pointer-events: none; }
@keyframes trSway { from { transform: rotateY(-24deg); } to { transform: rotateY(24deg); } }
@keyframes trPop { from { opacity: 0; transform: translateY(40px) scale(.3); } 65% { opacity: 1; transform: translateY(-6px) scale(1.05); } to { opacity: 1; transform: none; } }
@media (max-width: 640px) { .tr-slot { width: 78px; height: 164px; } .tr-items { gap: 8px; min-height: 120px; } .tr-tip { width: 180px; } }
.tr-lom { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 104px; height: 218px; }
.tr-lom .tr-pop { height: auto; display: flex; justify-content: center; }
.tr-plaque { margin-top: -6px; padding: 1px 8px; border-radius: 3px; font: 800 11px Georgia, serif; letter-spacing: 1px; color: #3b2a0a; background: linear-gradient(180deg, #f6dd8a, #b8892b); box-shadow: 0 1px 3px #000a; position: relative; z-index: 2; }
.tr-spot { width: 150px; height: 270px; }
.tr-beam { position: absolute; left: 50%; top: -60px; width: 260px; height: 340px; transform: translateX(-50%); background: conic-gradient(from 162deg at 50% 0%, transparent 0deg, #fff8dc40 12deg, #fff8dc2a 26deg, transparent 36deg); filter: blur(4px); pointer-events: none; animation: trBeam 2.4s ease-out both; }
.tr-spot .tr-glow { width: 120%; height: 22px; background: radial-gradient(#fde68a88, transparent 70%); }
.tr-new { position: absolute; top: 0; right: 0; z-index: 3; padding: 2px 8px; border-radius: 999px; font: 900 11px system-ui; letter-spacing: 1px; color: #1a1200; background: #fde68a; box-shadow: 0 0 14px #fde68aaa; }
@keyframes trBeam { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 640px) { .tr-lom { width: 78px; height: 164px; } .tr-spot { width: 110px; height: 200px; } .tr-beam { width: 190px; height: 250px; } }
@media (prefers-reduced-motion: reduce) { .tr-spin, .tr-pop { animation: none; } }
`;
