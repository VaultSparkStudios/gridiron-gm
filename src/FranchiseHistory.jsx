// Your franchise's story at a glance: the record, the titles, your GM legacy, the documentaries and
// every season you've run the club.
import React from "react";
import { C, TeamLogo, actBtn, card as cardBase, fitH } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { legacyRank, legacyTier } from "./gmLegacy.js";
import { sbName, sbNumber } from "./data/superbowls.js";

const card = { ...cardBase, marginBottom: 12 };
// section titles are plain white now; the color argument is kept so callers don't change
const head = () => ({ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 });

export default function FranchiseHistory({ team, seasons = [], current, titles = [], champs = [], teams = [], playoffs = 0, docs = [], career, gmRetired, onLegacy, onWatch, onShare }) {
  const rows = [...seasons.filter((s) => s.yr !== current?.yr), ...(current && (current.w || current.l) ? [current] : [])].sort((a, b) => b.yr - a.yr);
  const w = rows.reduce((a, s) => a + (s.w || 0), 0), l = rows.reduce((a, s) => a + (s.l || 0), 0);
  const pct = w + l ? ((w / (w + l)) * 100).toFixed(1) : "0.0";
  const won = new Set(titles.map((c) => c.yr));
  const rank = career ? legacyRank(career.score) : null;
  const best = Math.max(1, ...rows.map((s) => (s.w || 0) + (s.l || 0)));
  return (
    <div>
      <div style={{ display: MOBILE || onShare ? "flex" : "none", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {MOBILE && <TeamLogo t={team} sz={44} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {MOBILE ? <><div style={{ fontSize: 20, fontWeight: 900 }}>Franchise History</div>
          <div style={{ fontSize: 14, color: C.mt }}>{team.city} {team.name} · since you took over</div></> : <div style={{ fontSize: 14, color: C.mt }}>{team.city} {team.name} since you took over</div>}
        </div>
        {onShare && <button onClick={onShare} style={actBtn()}>Share</button>}
      </div>
      <div style={MOBILE ? undefined : { display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, ...fitH, height: undefined, maxHeight: fitH.height }}>
      <div style={MOBILE ? undefined : { minWidth: 0, overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "repeat(3,1fr)" : "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {[["Record", `${w}-${l}`], ["Win %", `${pct}%`], ["Super Bowls", titles.length, titles.length ? "#fbbf24" : null], ["Playoff trips", playoffs], ["Seasons", rows.length || 1], ["GM legacy", career?.score ?? 0, "#fde68a"]].map(([k, v, c]) => (
          <div key={k} style={{ ...card, marginBottom: 0, textAlign: "center", padding: "10px 6px" }}><div style={{ fontSize: 20, fontWeight: 900, color: c || C.tx }}>{v}</div><div style={{ fontSize: 14, fontWeight: 700, color: C.mt }}>{k}</div></div>
        ))}
      </div>
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "linear-gradient(135deg,#78350f44,#111827)" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={head("#fcd34d")}>Your GM legacy</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{gmRetired ? `Retired after ${gmRetired.yr}` : career ? legacyTier(career.score, career.seasons) : "Just getting started"}{rank && rank <= 10 ? ` · #${rank} all time` : ""}</div>
          <div style={{ fontSize: 14, color: "#cbd5e1" }}>{gmRetired ? "Your career is in the books. Look back on it, or come out of retirement." : "Your whole career, a legacy score, and where you rank among the greatest GMs ever."}</div>
        </div>
        <button onClick={onLegacy} style={{ ...actBtn("#fde68a"), padding: "9px 16px" }}>{gmRetired ? "View career" : "Career & retire"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={head("#fbbf24")}>Super Bowl titles</div>
          {titles.length ? titles.slice().sort((a, b) => b.yr - a.yr).map((c) => { const o = c.opp != null ? teams[c.opp] : null; return (
            <div key={c.yr} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.bd}66` }}>
              <b style={{ width: 44, color: "#fde68a" }}>{c.yr}</b>
              <span style={{ flex: 1, fontSize: 14 }}>{sbName(sbNumber(c.yr))}{o ? <span style={{ color: C.mt }}> · beat the {o.name}{c.score ? ` ${c.score}` : ""}</span> : null}</span>
              {o && <TeamLogo t={o} sz={22} />}
            </div>); }) : <div style={{ fontSize: 14, color: C.mt }}>No titles yet. The ring is still out there.</div>}
        </div>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={head("#f59e0b")}>Franchise documentaries</div>
          {docs.length ? docs.map((d) => (
            <div key={d.yrs} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.bd}66` }}>
              <span style={{ flex: 1, fontSize: 14 }}><b>The {d.yrs} Era</b> <span style={{ color: C.mt }}>· {d.w}-{d.l} · {d.tier}</span></span>
              <button onClick={() => onWatch(d)} style={actBtn("#fde68a")}>Watch</button>
            </div>
          )) : <div style={{ fontSize: 14, color: C.mt }}>Every five seasons your club gets a documentary. The first comes out after the 2030 season.</div>}
        </div>
      </div>
      </div>
      <div style={{ ...card, ...(MOBILE ? { marginTop: 12 } : { marginBottom: 0, overflowY: "auto", minHeight: 0 }) }}>
        <div style={head()}>Season by season</div>
        {rows.map((s) => { const g = (s.w || 0) + (s.l || 0), wp = g ? s.w / g : 0, champ = won.has(s.yr); return (
          <div key={s.yr} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: `1px solid ${C.bd}55` }}>
            <b style={{ width: 44, color: C.mt }}>{s.yr}</b>
            <b style={{ width: 48, fontSize: 14, color: s.w > s.l ? C.gn : s.w < s.l ? C.rd : C.gd }}>{s.w}-{s.l}</b>
            <div style={{ flex: 1, height: 8, background: "#ffffff10", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${(g / best) * wp * 100}%`, height: "100%", background: champ ? "#f59e0b" : wp >= 0.6 ? C.gn : wp >= 0.45 ? "#84cc16" : C.rd }} /></div>
            <span style={{ width: MOBILE ? 90 : 180, fontSize: 14, color: champ ? "#fcd34d" : C.mt, fontWeight: champ ? 800 : 500, textAlign: "right" }}>{champ ? "Super Bowl champions" : s.yr === current?.yr ? "In progress" : ""}</span>
          </div>); })}
      </div>
      </div>
    </div>
  );
}
