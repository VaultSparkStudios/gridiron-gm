// The roster table, in the same clean style as trades and free agency: one row per player,
// large type, grouped by position in depth-chart order, with every column sortable.
import React, { useState } from "react";
import { naturalDL } from "./dline.js";
import { C, oC, Bdg, Face } from "./ui.jsx";
import { DevChip } from "./ScoutingUI.jsx";

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
const GROUPS = { ALL: null, OFF: ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT"], DEF: ["DL", "LB", "CB", "S"], ST: ["K", "P"] };
const sel = { background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "8px 10px", fontSize: 15 };
const DEV_RANK = { generational: 4, superstar: 3, star: 2, normal: 1, late: 0 };

export default function RosterTable({ players, depth, setSel, devOf }) {
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(["pos", 1]);
  const slot = (p) => depth?.[p.id];
  const depthNum = (p) => { const l = slot(p)?.label || ""; const m = l.match(/(\d+)$/); return m ? +m[1] : 99; };
  const key = {
    pos: (p) => POS.indexOf(p.pos) * 100 + depthNum(p),
    name: (p) => p.name, age: (p) => p.age, ovr: (p) => p.ovr, pot: (p) => p.pot || p.ovr,
    dev: (p) => DEV_RANK[devOf(p)] ?? 1, sal: (p) => p.salary || 0,
  };
  const rows = players
    .filter((p) => filter === "ALL" || (GROUPS[filter] ? GROUPS[filter].includes(p.pos) : p.pos === filter))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = key[sort[0]](a), y = key[sort[0]](b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort[1] || b.ovr - a.ovr; });
  const th = (k, label, opts = {}) => (
    <th className={opts.hide ? "ro-hide" : undefined} onClick={() => setSort(([s, d]) => [k, s === k ? -d : ["pos", "name"].includes(k) ? 1 : -1])} style={{ padding: "8px 6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: sort[0] === k ? "#fff" : C.mt, borderBottom: `1px solid ${C.bd}`, textAlign: opts.left ? "left" : "center", cursor: "pointer", whiteSpace: "nowrap", position: "sticky", top: 0, background: C.cd }}>
      {label}{sort[0] === k ? (sort[1] < 0 ? " ▼" : " ▲") : ""}
    </th>
  );
  const td = { padding: "9px 6px", borderBottom: `1px solid ${C.bd}55`, textAlign: "center", fontSize: 15 };
  let lastPos = null;
  return (
    <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: 12 }}>
      <style>{"@media (max-width: 640px) { .ro-hide { display: none } }"}</style>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Position" style={sel}>
          <option value="ALL">All positions</option><option value="OFF">Offense</option><option value="DEF">Defense</option><option value="ST">Special teams</option>
          {POS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" aria-label="Search roster" style={{ ...sel, flex: "1 1 160px" }} />
      </div>
      <div style={{ maxHeight: "72vh", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{th("name", "PLAYER", { left: true })}{th("pos", "POS")}{th("pos", "DEPTH", { hide: true })}{th("age", "AGE")}{th("ovr", "OVR")}{th("pot", "POT", { hide: true })}{th("dev", "DEV", { hide: true })}{th("sal", "CONTRACT", { hide: true })}</tr></thead>
          <tbody>
            {rows.map((p) => {
              const s = slot(p);
              const groupStart = sort[0] === "pos" && p.pos !== lastPos;
              lastPos = p.pos;
              return (
                <tr key={p.id} onClick={() => setSel(p)} style={{ cursor: "pointer", borderTop: groupStart ? `2px solid ${C.bd}` : undefined }} onMouseOver={(e) => (e.currentTarget.style.background = "#1e293b66")} onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...td, textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Face s={p.face} sz={28} />
                      <span>
                        <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{p.name}</span>
                        {p.xf && <span title={`X-Factor: ${p.xf}`} style={{ marginLeft: 6, fontSize: 11, fontWeight: 900, color: "#f472b6" }}>XF</span>}
                        {p.injured && <span title={p.injType || "Injured"} style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, color: p.injSev === "major" ? C.rd : "#f97316" }}>🏥 {p.injType || "Injured"}</span>}
                        {p.holdout && <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, color: C.gd }}>Holdout</span>}
                      </span>
                    </span>
                  </td>
                  <td style={td}><Bdg pos={p.pos} />{p.pos === "DL" && <span title={naturalDL(p) === "DT" ? "Defensive tackle by trade" : "Edge rusher by trade"} style={{ display: "block", fontSize: 10, fontWeight: 800, color: naturalDL(p) === "DT" ? "#fb923c" : "#f472b6" }}>{naturalDL(p)}</span>}</td>
                  <td className="ro-hide" style={{ ...td, fontWeight: 800, color: s?.starter ? C.gn : "#64748b", whiteSpace: "nowrap" }}>{s?.label || "—"}</td>
                  <td style={{ ...td, color: "#cbd5e1" }}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 900, fontSize: 18, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td className="ro-hide" style={{ ...td, color: oC(p.pot || p.ovr) }}>{p.pot || p.ovr}</td>
                  <td className="ro-hide" style={td}><DevChip dev={devOf(p)} /></td>
                  <td className="ro-hide" style={{ ...td, color: "#cbd5e1", whiteSpace: "nowrap", fontSize: 14 }}>${(p.salary || 0).toFixed(1)}M · {p.contract}y</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div style={{ padding: 16, color: C.mt, fontSize: 15 }}>Nobody matches.</div>}
      </div>
    </div>
  );
}
