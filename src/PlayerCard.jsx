// The player card: a header in his team's colors with his number and an OVR ring, rating bars by
// skill group, a career OVR graph, season-by-season stats, a contract timeline and his honors.
import React, { useEffect, useState } from "react";
import { C, oC, Bdg, Face } from "./ui.jsx";
import { posTag, dlOvrAt, naturalDL } from "./dline.js";
import { roleCard, naturalRole, roleKind } from "./roles.js";
import { gradesOf, GRADE_KEYS } from "./grades.js";
import { olLine } from "./olStats.js";

const r1 = (x) => Math.round(x * 10) / 10;
const money = (n) => `$${r1(+n || 0).toFixed(1)}M`;

export function OvrRing({ ovr, size = 70, label = "OVR" }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, ((ovr || 0) - 40) / 59));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "0 0 auto" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="#0008" stroke="#ffffff22" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={oC(ovr)} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dy={size * 0.04} textAnchor="middle" fontSize={size * 0.34} fontWeight="900" fill="#fff" fontFamily="system-ui">{ovr}</text>
      <text x="50%" y="50%" dy={size * 0.26} textAnchor="middle" fontSize={size * 0.12} fontWeight="800" fill="#fffa" fontFamily="system-ui">{label}</text>
    </svg>
  );
}

// team: { clr, ac, city, name, ab } or null for a free agent.
export function CardHeader({ p, team, ovr, pot, sub, dev, label, ovrLabel }) {
  const bg = team?.clr || "#334155", ac = team?.ac || "#94a3b8";
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, margin: "-4px -4px 12px", background: `linear-gradient(120deg, ${bg} 0%, ${bg}cc 45%, #0b1220 100%)`, border: `1px solid ${ac}66` }}>
      <div style={{ position: "absolute", right: 74, top: -18, fontSize: 120, fontWeight: 900, color: "#ffffff14", fontFamily: "Georgia, serif", lineHeight: 1, pointerEvents: "none" }}>{p.num ?? ""}</div>
      <div style={{ height: 4, background: ac }} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ background: "#0006", borderRadius: 40, padding: 3 }}><Face s={p.face} sz={58} /></div>
          {p.num != null && <div style={{ position: "absolute", right: -6, bottom: -4, minWidth: 26, height: 22, padding: "0 4px", borderRadius: 6, background: "#fff", color: bg, fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${ac}` }}>#{p.num}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#fffb" }}>{(label || (team ? `${team.city} ${team.name}` : "FREE AGENT")).toUpperCase()}</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{p.name}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 3, fontSize: 13, color: "#fffd" }}><Bdg pos={posTag(p)} />{sub}{dev}</div>
        </div>
        <div style={{ textAlign: "center", marginRight: 34 }}>
          <OvrRing ovr={ovr} label={ovrLabel} />
          {pot != null && <div style={{ fontSize: 11, color: "#fffc", fontWeight: 700 }} title={p.potRev && p.potRev.stage < 3 ? "Your staff's current read. A young player's real ceiling becomes clear over his first two seasons." : undefined}>POT <b style={{ color: oC(pot) }}>{p.potRev && p.potRev.stage < 3 ? "~" : ""}{pot}</b></div>}
          {p.potRev && p.potRev.stage < 3 && <div style={{ fontSize: 10, color: "#fffa" }}>{p.potRev.stage === 0 ? "draft-day read" : "still unproven"}</div>}
        </div>
      </div>
    </div>
  );
}

// His rating at each role his position plays (roles.js; the line in dline.js), natural role starred.
const ROLE_LBL = { SAM: "SAM", MIKE: "MIKE", WILL: "WILL", OUT: "OUTSIDE CB", NB: "NICKEL", X: "X (OUTSIDE)", Z: "Z (FLANKER)", SLOT: "SLOT", EDGE: "EDGE", DT: "INSIDE (DT)" };
function roleRows(p) {
  if (p.pos === "DL" && p.posAttrs) { const nat = naturalDL(p); return ["EDGE", "DT"].map((k) => [`${ROLE_LBL[k]}${k === nat ? " ★" : ""}`, dlOvrAt(p, k)]).sort((a, b) => b[1] - a[1]); }
  const rc = p.posAttrs ? roleCard(p) : null, nat = rc && naturalRole(p);
  if (rc && p.pos === "TE") return rc.map(([k, v]) => [`WIDE: ${k}`, v]); // split out as a receiver
  // ↗: the role he grew into last off-season (he started there all year)
  const grew = p.grewAs && p.grewAs.age === p.age - 1 ? roleKind(p.grewAs.slot) : null;
  return rc ? rc.map(([k, v]) => [`${ROLE_LBL[k] || k}${k === nat ? " ★" : ""}${k === grew ? " ↗" : ""}`, v]) : null;
}
const GROUPS = [["PHYSICAL", [["SPD", "spd"], ["ACC", "acc"], ["AGI", "agi"], ["STR", "str"], ["JMP", "jmp"], ["END", "end"]]]];
// bare: just the cards (for a parent that lays them out, e.g. the player card's balanced columns)
// Position skills: his best three, the rest a tap away (a partial scouting read shows what it has).
export function RatingBars({ p, labels = {}, showPos = true, posLimit = 99, bare = false }) {
  const [allSkills, setAllSkills] = useState(false);
  const known = showPos && p.posAttrs ? Object.entries(p.posAttrs).slice(0, posLimit) : [];
  const ranked = posLimit >= 99 ? [...known].sort((a, b) => b[1] - a[1]) : known;
  const pos = allSkills ? ranked : ranked.slice(0, 3);
  const more = ranked.length - pos.length;
  const groups = [...GROUPS.map(([g, list]) => [g, list.map(([l, k]) => [l, p[k]]).filter(([, v]) => v != null)]), ...(pos.length ? [["POSITION SKILLS", pos.map(([k, v]) => [labels[k] || k, v])]] : []), ...(showPos && posLimit >= 99 && roleRows(p) ? [["ROLE FIT", roleRows(p)]] : []), ["MENTAL", [["CONFIDENCE", p.conf || 60]]]];
  const cards = groups.map(([g, rows]) => (
        <div key={g} style={{ background: C.bg, border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 12px", ...(bare ? { breakInside: "avoid", marginBottom: 12 } : {}) }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{g[0] + g.slice(1).toLowerCase()}</div>
          {rows.map(([l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "#cbd5e1", width: 78, flex: "0 0 auto", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</span>
              <div style={{ flex: 1, height: 7, background: "#ffffff12", borderRadius: 4 }}><div style={{ width: `${Math.max(3, Math.min(100, v))}%`, height: "100%", borderRadius: 4, background: oC(v) }} /></div>
              <b style={{ fontSize: 12, color: oC(v), width: 22, textAlign: "right" }}>{v}</b>
            </div>
          ))}
          {g === "POSITION SKILLS" && (more > 0 || allSkills) && <button onClick={() => setAllSkills((v) => !v)} style={{ marginTop: 4, background: "transparent", border: 0, color: "#7dd3fc", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>{allSkills ? "Top 3 only ▴" : `All ${ranked.length} skills ▾`}</button>}
        </div>
      ));
  if (bare) return cards;
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 12 }}>{cards}</div>;
}

// Career OVR, season by season (p.oh) plus now.
export function CareerOvrGraph({ p, yr }) {
  const pts = [...(p.oh || []).map((h) => ({ y: h.y, o: h.o })), { y: yr, o: p.ovr }].filter((x, i, a) => a.findIndex((z) => z.y === x.y) === i);
  if (pts.length < 2) return null;
  const W = 420, H = 120, lo = Math.min(...pts.map((x) => x.o)) - 3, hi = Math.max(...pts.map((x) => x.o)) + 3;
  const X = (i) => 16 + (i * (W - 32)) / (pts.length - 1), Y = (o) => H - 16 - ((o - lo) / Math.max(1, hi - lo)) * (H - 30);
  const path = pts.map((x, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(x.o).toFixed(1)}`).join(" ");
  return (
    <div style={{ background: C.bg, border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Career OVR</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxHeight: 150 }}>
        <path d={`${path} L${X(pts.length - 1)} ${H - 12} L${X(0)} ${H - 12} Z`} fill="#3b82f622" />
        <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {pts.map((x, i) => <g key={x.y}><circle cx={X(i)} cy={Y(x.o)} r="3.5" fill={oC(x.o)} /><text x={X(i)} y={Y(x.o) - 7} textAnchor="middle" fontSize="13" fontWeight="800" fill="#e2e8f0">{x.o}</text><text x={X(i)} y={H - 1} textAnchor="middle" fontSize="11" fill="#94a3b8">{x.y}</text></g>)}
      </svg>
    </div>
  );
}

// Columns that matter for his position.
export const COLS = {
  QB: [["CMP", "comp"], ["ATT", "att"], ["YDS", "passYds"], ["TD", "passTD"], ["INT", "passInt"], ["RUSH", "rushYds"]],
  RB: [["ATT", "rushAtt"], ["YDS", "rushYds"], ["TD", "rushTD"], ["REC", "rec"], ["REC YDS", "recYds"]],
  WR: [["REC", "rec"], ["YDS", "recYds"], ["TD", "recTD"]], TE: [["REC", "rec"], ["YDS", "recYds"], ["TD", "recTD"]],
  DL: [["TKL", "tkl"], ["SACK", "sacks"], ["PRES", "pres"], ["TFL", "tfl"], ["FF", "ff"]], LB: [["TKL", "tkl"], ["SACK", "sacks"], ["PRES", "pres"], ["INT", "ints"], ["PD", "pd"]],
  CB: [["TKL", "tkl"], ["INT", "ints"], ["PD", "pd"], ["TGT", "covT"], ["YDS ALW", "covY"]], S: [["TKL", "tkl"], ["INT", "ints"], ["PD", "pd"]],
  K: [["FGM", "fgM"], ["FGA", "fgA"], ["XPM", "xpM"]], P: [["PUNTS", "punts"], ["YDS", "puntYds"]],
};
// The line: sacks and pressures allowed, pass-block win rate and the block grades (olStats.js).
// (each spot graded against its own: tackles, guards and the center)
const OL_SPOTS = ["LT", "LG", "C", "RG", "RT"];
// every position's season grade (grades.js), last
for (const pos of Object.keys(COLS)) if (pos !== "K" && pos !== "P") COLS[pos] = [...COLS[pos], ["GRADE", (r) => gradesOf(r, pos)?.overall]];
for (const pos of OL_SPOTS) COLS[pos] = [["GS", "gs"], ["SK", "sackA"], ["PRES", "presA"], ["PB%", (r) => olLine(r, pos)?.pbPct], ["PASS", (r) => olLine(r, pos)?.passGrade], ["RUN", (r) => olLine(r, pos)?.runGrade], ["GRADE", (r) => gradesOf(r, pos)?.overall]];
export const SEASON_KEYS = ["gp", "gs", "comp", "att", "passYds", "passTD", "passInt", "rushAtt", "rushYds", "rushTD", "rec", "recYds", "recTD", "tkl", "sacks", "tfl", "ff", "ints", "pd", "fgM", "fgA", "xpM", "punts", "puntYds", "pbSnp", "sackA", "presA", "rbSnp", "rbWin", "rbStuff", "pres", "covT", "covC", "covY", ...GRADE_KEYS];
// A season's stats, trimmed to what the card shows (stored on the player at each rollover).
export const seasonLine = (ss, y, tm) => { const o = { y, tm }; for (const k of SEASON_KEYS) if (ss?.[k]) o[k] = ss[k]; return o; };

// Real players' NFL seasons before the league starts (nflverse), loaded once on first use.
let realSeasons = null, realLoad = null;
export const loadRealSeasons = () => (realLoad ||= import("./data/realSeasons.json").then((m) => (realSeasons = m.default || m)));
const normName = (n) => (n || "").toLowerCase().replace(/[.'’]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z]+/g, " ").trim();
const GROUP = { QB: "QB", RB: "RB", WR: "WR", TE: "TE", LT: "OL", LG: "OL", C: "OL", RG: "OL", RT: "OL", DL: "DL", LB: "LB", CB: "DB", S: "DB", K: "SPEC", P: "SPEC" };
export function realPast(p, data) {
  const list = p?.src === "m27" && data?.[normName(p.name)];
  if (!list?.length) return [];
  const gp = (e) => e.s.reduce((t, r) => t + (r.gp || 0), 0);
  const hit = list.length === 1 ? list[0] : list.find((e) => e.g === GROUP[p.pos]) || [...list].sort((x, y) => gp(y) - gp(x))[0];
  return hit.s.map((r) => ({ ...r, real: true }));
}

export function SeasonTable({ p, yr, teamAb }) {
  const [all, setAll] = useState(false);
  const [data, setData] = useState(realSeasons);
  useEffect(() => { if (!data && p?.src === "m27") loadRealSeasons().then(setData).catch(() => {}); }, [data, p?.src]);
  const cols = COLS[p.pos] || [["GS", "gs"]];
  const league = [...(p.sh || []), ...(p.ss?.gp ? [seasonLine(p.ss, yr, teamAb)] : [])];
  const first = league.length ? Math.min(...league.map((r) => r.y)) : yr;
  const rows = [...realPast(p, data).filter((r) => r.y < first), ...league];
  if (!rows.length) return null;
  const tot = {}; for (const r of rows) for (const k of SEASON_KEYS) if (r[k]) tot[k] = (tot[k] || 0) + r[k];
  const shown = all ? rows : rows.slice(-3);
  const td = { padding: "5px 6px", textAlign: "right", fontSize: 13, borderBottom: `1px solid ${C.bd}55`, whiteSpace: "nowrap" };
  const fmt = (v) => (v == null ? "–" : Number.isInteger(v) ? v.toLocaleString() : r1(v));
  return (
    <div style={{ background: C.bg, border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 12px", marginBottom: 12, overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", flex: 1 }}>Season by season</div>
        {rows.length > 3 && <button onClick={() => setAll(!all)} style={{ background: "transparent", border: "1px solid #ffffff10", color: C.mt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{all ? "Last 3 only ▴" : `All ${rows.length} seasons ▾`}</button>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["YEAR", "TM", "GP", ...cols.map(([l]) => l)].map((h, i) => <th key={h} style={{ ...td, textAlign: i < 2 ? "left" : "right", fontSize: 11, color: C.mt, fontWeight: 800 }}>{h}</th>)}</tr></thead>
        <tbody>
          {shown.map((r, i) => <tr key={i} style={r.real ? { color: "#cbd5e1" } : undefined}><td style={{ ...td, textAlign: "left" }} title={r.real ? "Real NFL season, before your league" : undefined}>{r.y}{r.real && <span style={{ color: C.mt, fontSize: 10, marginLeft: 3 }}>NFL</span>}</td><td style={{ ...td, textAlign: "left", color: C.mt }}>{r.tm || ""}</td><td style={td}>{fmt(r.gp)}</td>{cols.map(([l, k]) => <td key={l} style={td}>{fmt(typeof k === "function" ? k(r) : r[k])}</td>)}</tr>)}
          {rows.length > 1 && <tr style={{ fontWeight: 800 }}><td style={{ ...td, textAlign: "left" }} colSpan={2}>Career</td><td style={td}>{fmt(tot.gp)}</td>{cols.map(([l, k]) => <td key={l} style={td}>{fmt(typeof k === "function" ? k(tot) : tot[k])}</td>)}</tr>}
        </tbody>
      </table>
      {rows.some((r) => r.real) && <div style={{ fontSize: 10, color: C.mt, marginTop: 4 }}>NFL = real season before your league began</div>}
    </div>
  );
}

// Each year left on his deal: the cap hit split into base and bonus, plus what cutting him that
// year would leave as dead money. Void years show after the real ones.
export function ContractTimeline({ p, yr, yearsLeft, proration, deadNow }) {
  if (!yearsLeft || yearsLeft < 1) return null;
  const pr = proration || 0;
  const years = Array.from({ length: yearsLeft }, (_, i) => {
    const hit = i === 0 ? p.salary || 0 : (p.salary || 0) + (p.baseBack || 0);
    return { y: yr + i, hit: r1(hit), bonus: r1(Math.min(hit, pr)), dead: i === 0 ? deadNow : r1(pr * (yearsLeft - i) + (p.voidDead || 0)) };
  });
  const voids = Array.from({ length: p.voidYrs || 0 }, (_, i) => ({ y: yr + yearsLeft + i, void: true }));
  const max = Math.max(...years.map((x) => x.hit), 1);
  return (
    <div style={{ background: C.bg, border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Contract timeline <span style={{ fontWeight: 600, letterSpacing: 0 }}>· <span style={{ color: "#60a5fa" }}>■</span> base <span style={{ color: C.gd }}>■</span> bonus <span style={{ color: C.rd }}>■</span> dead money if cut</span></div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        {years.map((x) => (
          <div key={x.y} style={{ flex: "1 1 0", maxWidth: 110, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{money(x.hit)}</div>
            <div style={{ height: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ height: `${((x.hit - x.bonus) / max) * 66}px`, background: "#3b82f6", borderRadius: x.bonus ? "4px 4px 0 0" : 4 }} />
              <div style={{ height: `${(x.bonus / max) * 66}px`, background: C.gd, borderRadius: x.hit - x.bonus > 0 ? "0 0 4px 4px" : 4 }} />
            </div>
            <div style={{ fontSize: 11, color: C.mt }}>{x.y}</div>
            <div style={{ fontSize: 11, color: x.dead ? C.rd : C.mt }}>{x.dead ? `${money(x.dead)} dead` : "no dead $"}</div>
          </div>
        ))}
        {voids.map((x) => <div key={x.y} style={{ flex: "1 1 0", maxWidth: 110, minWidth: 0, textAlign: "center", opacity: 0.6 }}><div style={{ fontSize: 12 }}>void</div><div style={{ height: 70, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: 10, background: "repeating-linear-gradient(45deg,#7c3aed55 0 4px,transparent 4px 8px)", borderRadius: 3 }} /></div><div style={{ fontSize: 11, color: C.mt }}>{x.y}</div></div>)}
      </div>
      {p.ext && <div style={{ fontSize: 12, color: C.gn, marginTop: 6 }}>Extension: {money(p.ext.sal)} a year × {p.ext.yrs} from {yr + yearsLeft}</div>}
      {p.inc?.amt > 0 && <div style={{ fontSize: 12, color: "#67e8f9", marginTop: 4 }}>Incentive: {money(p.inc.amt)} for {p.inc.label}</div>}
    </div>
  );
}

