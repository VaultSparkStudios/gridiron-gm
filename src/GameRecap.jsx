// Game-day presentation: a broadcast score bug, the win-probability chart, the drive chart, the
// key plays and the game's top three performers, plus a box score that reads on a phone.
import React from "react";
import { C, Bdg, TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { winProb } from "./gameday.js";

// A team color that shows up on a dark background: very dark primaries fall back to the accent.
const lum = (hex) => { const h = String(hex || "").replace("#", ""); if (h.length < 6) return 0.5; const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const vivid = (t) => (lum(t?.clr) < 0.16 ? (lum(t?.ac) > 0.16 ? t.ac : "#94a3b8") : t?.clr);

const qLabel = (q) => (q >= 5 ? "OT" : `Q${q}`);
const clk = (c) => `${Math.floor((c || 0) / 60)}:${String(Math.max(0, Math.round(c || 0) % 60)).padStart(2, "0")}`;

// The score bug, broadcast style: each team on its own color panel (angled into the clock box in
// the middle), its logo traced in a thin white line so it reads on its own color, a big score,
// timeouts left under the name, then a strip with the down, distance and ball spot and a
// win-probability line along the bottom. live: { q, clock, poss, down, toGo, yard, to } while a
// game is on (yard: the offense's yard line; to: { h, a } timeouts left), else FINAL.
const TRACE = "drop-shadow(0 0 0.8px #ffffffd9) drop-shadow(0 0 0.5px #ffffffb3) drop-shadow(0 3px 5px #000a)";
export function ScoreBug({ home, away, hs, as, live, final = true, label }) {
  const on = live && !final;
  const side = (t, pts, me, left) => {
    const ball = on && live.poss === me, to = live?.to?.[me];
    return (
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: MOBILE ? 6 : 10, padding: MOBILE ? "6px 10px" : "8px 16px", flexDirection: left ? "row" : "row-reverse", background: `linear-gradient(${left ? 90 : 270}deg, ${t.clr}, ${t.clr}dd 60%, ${t.clr}99)`, clipPath: left ? "polygon(0 0,100% 0,96% 100%,0 100%)" : "polygon(4% 0,100% 0,100% 100%,0 100%)" }}>
        <span style={{ display: "inline-flex", flexShrink: 0, filter: `${TRACE}${ball ? " drop-shadow(0 0 3px #fbbf2466)" : ""}` }}><TeamLogo t={t} sz={MOBILE ? 28 : 38} plain /></span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: left ? "flex-start" : "flex-end", lineHeight: 1, minWidth: 0 }}>
          <b style={{ color: "#fff", fontSize: MOBILE ? 15 : 20, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{t.ab}{ball && <i aria-label="has the ball" style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "#fbbf24", boxShadow: "0 0 6px #fbbf24", margin: "0 0 3px 8px", verticalAlign: "middle" }} />}</b>
          {on && to != null && <span style={{ display: "inline-flex", gap: 3, marginTop: 4 }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: MOBILE ? 8 : 12, height: 3, borderRadius: 2, background: i < to ? "#fbbf24" : "#ffffff30" }} />)}</span>}
        </div>
        <span style={{ [left ? "marginLeft" : "marginRight"]: "auto", /* clear of the slanted edge and the italic overhang, even at 2 digits */ [left ? "paddingRight" : "paddingLeft"]: MOBILE ? 12 : 32, color: "#fff", fontWeight: 900, fontStyle: "italic", fontSize: MOBILE ? 28 : 40, textShadow: "0 3px 8px #0009", fontVariantNumeric: "tabular-nums" }}>{pts}</span>
      </div>
    );
  };
  // the situation strip and the win-probability line (home's share on the right)
  const offT = on && (live.poss === "h" ? home : away), defT = on && (live.poss === "h" ? away : home);
  const spot = on && live.yard != null ? (live.yard === 50 ? "the 50" : live.yard > 50 ? `${defT.ab} ${100 - live.yard}` : `${offT.ab} ${live.yard}`) : null;
  const secs = on ? (live.q >= 5 ? Math.max(1, live.clock) * 0.25 : (4 - live.q) * 900 + (live.clock || 0)) : 0;
  const wpH = on ? winProb(hs - as, secs, live.poss, live.yard ?? 25) : hs > as ? 1 : hs < as ? 0 : 0.5;
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px #000a", border: "1px solid #ffffff1f", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "stretch", background: "#020617" }}>
        {side(away, as, "a", true)}
        <div style={{ width: MOBILE ? 72 : 112, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#0f172a,#020617)" }}>
          {on ? (<>
            <b style={{ color: "#fff", fontSize: MOBILE ? 15 : 20, fontVariantNumeric: "tabular-nums" }}>{clk(live.clock)}</b>
            <span style={{ color: "#94a3b8", fontSize: MOBILE ? 10 : 12, fontWeight: 800, letterSpacing: 2 }}>{qLabel(live.q)}</span>
          </>) : <b style={{ color: "#fff", fontSize: MOBILE ? 12 : 14, letterSpacing: 2 }}>{label || "FINAL"}</b>}
        </div>
        {side(home, hs, "h", false)}
      </div>
      {on && live.down ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#0b1220", padding: "4px 10px", fontSize: MOBILE ? 11 : 13, fontWeight: 800 }}>
          <span style={{ color: "#fbbf24" }}>{["", "1st", "2nd", "3rd", "4th"][live.down]} & {live.yard != null && live.yard + live.toGo >= 100 ? "Goal" : live.toGo}</span>
          {spot && <><span style={{ color: "#64748b" }}>·</span><span style={{ color: "#cbd5e1" }}>Ball on {spot}</span></>}
        </div>
      ) : null}
      <div style={{ height: 4, display: "flex" }}><i style={{ width: `${(1 - wpH) * 100}%`, background: vivid(away), transition: "width .6s" }} /><i style={{ flex: 1, background: vivid(home) }} /></div>
    </div>
  );
}

// Win probability for the home side (wp: percents), drawn in both teams' colors.
export function WinProbChart({ wp, home, away, height = 110, live = false }) {
  if (!wp || wp.length < 2) return null;
  // one point per 50 seconds of game clock: 72 for regulation, more in overtime
  const W = 400, H = height, n = Math.max(72, wp.length - 1);
  const hc = vivid(home), ac = vivid(away);
  const X = (i) => (i / n) * W, Y = (v) => H - (v / 100) * H;
  const path = wp.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const last = wp[wp.length - 1];
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.mt, marginBottom: 4 }}>
        <span>WIN PROBABILITY</span><span><span style={{ color: hc }}>■</span> {home.ab} <span style={{ color: ac }}>■</span> {away.ab}</span>
      </div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <clipPath id="wp-top"><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
            <clipPath id="wp-bot"><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
          </defs>
          {[1, 2, 3, 4].map((q) => <line key={q} x1={(q * 18 / n) * W} x2={(q * 18 / n) * W} y1="0" y2={H} stroke="#ffffff14" strokeDasharray="3 4" />)}
          <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="#ffffff33" />
          <path d={`${path} L${X(wp.length - 1)} ${H / 2} L0 ${H / 2} Z`} fill={hc} opacity=".45" clipPath="url(#wp-top)" />
          <path d={`${path} L${X(wp.length - 1)} ${H / 2} L0 ${H / 2} Z`} fill={ac} opacity=".45" clipPath="url(#wp-bot)" />
          <path d={path} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div style={{ position: "absolute", left: 4, top: 2, fontSize: 10, color: "#fffa" }}>{home.ab} 100%</div>
        <div style={{ position: "absolute", left: 4, bottom: 2, fontSize: 10, color: "#fffa" }}>{away.ab} 100%</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.mt, marginTop: 2 }}><span>Kickoff</span><span>Q2</span><span>Half</span><span>Q4</span><span>{live ? "Now" : "Final"} · {last >= 50 ? home.ab : away.ab} {Math.max(last, 100 - last)}%</span></div>
    </div>
  );
}

// Each drive as a bar across the field, in the offense's color, with how it ended.
// rows: during a live game, the height of that many drives is kept so the chart never jumps.
export function DriveChart({ drives, home, away, max = 24, rows = null }) {
  if (!drives?.length) return null;
  const RES = { Live: "#38bdf8", TD: "#22c55e", FG: "#eab308", "Missed FG": "#f97316", Punt: "#64748b", INT: "#ef4444", FUM: "#ef4444", Safety: "#a855f7", "Downs/End": "#94a3b8" };
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.mt, marginBottom: 6 }}>DRIVE CHART</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minHeight: rows ? rows * 15 - 3 : undefined }}>
        {drives.slice(0, max).map((d, i) => {
          const t = d.p === "h" ? home : away;
          const tc = vivid(t);
          // field from the home end zone (left) to the away end zone (right)
          const a = d.p === "h" ? d.start : 100 - d.start, b = d.p === "h" ? d.end : 100 - d.end;
          const lo = Math.min(a, b), hi = Math.max(a, b);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 30, fontSize: 10, color: C.mt }}>{qLabel(d.q)}</span>
              <b style={{ width: 34, fontSize: 11 }}>{t.ab}</b>
              <div style={{ position: "relative", flex: 1, height: 12, background: "repeating-linear-gradient(90deg,#14532d 0 9.9%,#166534 9.9% 10%)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: `${lo}%`, width: `${Math.max(1.5, hi - lo)}%`, top: 2, bottom: 2, background: tc, border: "1px solid #fff8", borderRadius: 2 }} />
              </div>
              <span style={{ width: 66, fontSize: 11, fontWeight: 800, color: RES[d.res] || C.mt, textAlign: "right" }}>{d.res}</span>
              <span style={{ width: 54, fontSize: 10, color: C.mt, textAlign: "right" }}>{d.plays} pl, {d.yds}y</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KeyPlays({ keys, home, away }) {
  if (!keys?.length) return null;
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.mt, marginBottom: 6 }}>KEY PLAYS</div>
      {keys.map((k, i) => {
        const fav = k.sw >= 0 ? home : away;
        return (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", borderTop: i ? `1px solid ${C.bd}55` : "none" }}>
            <span style={{ fontSize: 11, color: C.mt, width: 54, flex: "0 0 auto" }}>{qLabel(k.q)} {clk(k.c)}</span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.35 }}>{k.td ? "" : k.to ? "" : ""}{k.x}</span>
            <span style={{ flex: "0 0 auto", fontSize: 11, fontWeight: 900, padding: "1px 6px", borderRadius: 4, background: `${vivid(fav)}55`, color: "#fff" }}>{fav.ab} +{Math.abs(k.sw)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function TopPerformers({ top, home, away }) {
  if (!top?.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.mt, marginBottom: 6 }}>TOP PERFORMERS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
        {top.map((t, i) => {
          const tm = t.side === "h" ? home : away;
          return (
            <div key={t.id} style={{ background: `linear-gradient(160deg, ${tm.clr}55, ${C.bg} 70%)`, border: `1px solid ${tm.clr}88`, borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 18, fontWeight: 900, color: ["#fde68a", "#e5e7eb", "#d6a36a"][i] }}>{i + 1}</span><TeamLogo t={tm} sz={20} /><Bdg pos={t.pos} /></div>
              <div style={{ fontWeight: 900, fontSize: 15, marginTop: 3 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.35 }}>{t.line}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GameRecap({ gd, home, away }) {
  if (!gd) return null;
  return (<>
    <TopPerformers top={gd.top} home={home} away={away} />
    <WinProbChart wp={gd.wp} home={home} away={away} />
    <KeyPlays keys={gd.keys} home={home} away={away} />
    <DriveChart drives={gd.drives} home={home} away={away} />
  </>);
}

// The box score by category, both teams; columns stack on a phone.
const CATS = [
  ["PASSING", (s) => s.att, [["C/ATT", (s) => `${s.comp || 0}/${s.att || 0}`], ["YDS", (s) => s.passYds || 0], ["TD", (s) => s.passTD || 0], ["INT", (s) => s.passInt || 0]]],
  ["RUSHING", (s) => s.rushAtt || s.rushYds, [["CAR", (s) => s.rushAtt || 0], ["YDS", (s) => s.rushYds || 0], ["TD", (s) => s.rushTD || 0]]],
  ["RECEIVING", (s) => s.rec, [["REC", (s) => s.rec || 0], ["YDS", (s) => s.recYds || 0], ["TD", (s) => s.recTD || 0]]],
  // every defender who did something: pressures and pass breakups count too, so a rusher who lived
  // in the backfield or a safety who broke up passes shows up even without many tackles
  ["DEFENSE", (s) => s.tkl || s.sacks || s.ints || s.pres || s.pd, [["TKL", (s) => s.tkl || 0], ["SK", (s) => s.sacks || 0], ["PRES", (s) => s.pres || 0], ["PD", (s) => s.pd || 0], ["INT", (s) => s.ints || 0]]],
  ["KICKING", (s) => s.fgA || s.xpA, [["FG", (s) => `${s.fgM || 0}/${s.fgA || 0}`], ["XP", (s) => `${s.xpM || 0}/${s.xpA || 0}`]]],
];
const sortKey = { PASSING: (s) => s.passYds || 0, RUSHING: (s) => s.rushYds || 0, RECEIVING: (s) => s.recYds || 0, DEFENSE: (s) => (s.tkl || 0) + (s.sacks || 0) * 3 + (s.pres || 0) + (s.pd || 0) * 1.5 + (s.ints || 0) * 4, KICKING: (s) => s.fgM || 0 };
const SHOW = { PASSING: 3, RUSHING: 4, RECEIVING: 5, DEFENSE: 8, KICKING: 2 };
export function BoxScore({ boxH, boxA, home, away }) {
  const td = { padding: "3px 4px", fontSize: 12, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };
  const team = (box, t) => (
    <div style={{ background: C.bg, borderRadius: 10, padding: "8px 10px", minWidth: 0, borderTop: `3px solid ${t.clr}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><TeamLogo t={t} sz={18} /><b style={{ fontSize: 13 }}>{t.city} {t.name}</b></div>
      {CATS.map(([cat, has, cols]) => {
        const rows = Object.values(box || {}).filter((s) => has(s)).sort((a, b) => sortKey[cat](b) - sortKey[cat](a)).slice(0, SHOW[cat]);
        if (!rows.length) return null;
        return (
          <table key={cat} style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
            <thead><tr><th style={{ ...td, textAlign: "left", fontSize: 10, color: C.mt, letterSpacing: 1 }}>{cat}</th>{cols.map(([h]) => <th key={h} style={{ ...td, fontSize: 10, color: C.mt }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((s, i) => <tr key={i} style={{ borderTop: `1px solid ${C.bd}44` }}><td style={{ ...td, textAlign: "left", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}{s.pos && <span style={{ color: C.mt, fontSize: 10, marginLeft: 5 }}>{s.pos}</span>}</td>{cols.map(([h, f]) => <td key={h} style={td}>{f(s)}</td>)}</tr>)}</tbody>
          </table>
        );
      })}
    </div>
  );
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 8 }}>{team(boxA, away)}{team(boxH, home)}</div>;
}
