// Contracts on phones, in the Home screen's look: filters as chips, every deal as a clean row
// (position, name, cap hit and years, overall), and a tap opens the deal in a sheet with what you
// can do about it (extend, restructure, talk to his agent).
import React, { useState } from "react";
import { C, oC, Bdg, Face, Sheet, Row, Chips } from "./ui.jsx";
import { posTag } from "./dline.js";

const $ = (v) => `$${(+v || 0).toFixed(1)}M`;
const SORTS = [["cap", "Cap hit"], ["ovr", "Overall"], ["age", "Age"], ["yrs", "Years left"], ["dead", "Dead money if cut"], ["pos", "Position"]];

export default function PhoneContracts({ shown, filters, filter, setFilter, sort, setSort, setSel, canExt, holdout, onExtend, onRestructure, yr }) {
  const [sortOpen, setSortOpen] = useState(false);
  const [pick, setPick] = useState(null);
  const r = pick && shown.find((x) => x.p.id === pick);
  return (
    <div>
      <div style={{ marginTop: 16 }}><Chips items={filters} value={filter} onChange={setFilter} /></div>
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "8px 2px 6px" }}>
        <button onClick={() => setSortOpen(true)} style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>Sorted: {(SORTS.find(([k]) => k === sort) || SORTS[0])[1]} ▾</button>
      </div>
      <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px" }}>
        {shown.map(({ p, yl, rp }, i) => (
          <button key={p.id} onClick={() => setPick(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 54, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: "6px 0", color: C.tx, cursor: "pointer", whiteSpace: "normal" }}>
            <span style={{ width: 42, flexShrink: 0 }}><Bdg pos={posTag(p)} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f1f5f9" }}>{p.name}{p.holdout && <span style={{ color: "#f59e0b", fontSize: 12, marginLeft: 6 }}>holdout</span>}</span>
              <span style={{ display: "block", fontSize: 14, color: "#94a3b8", marginTop: 2 }}><b style={{ color: C.gd }}>{$(p.salary)}</b> · <span style={{ color: yl <= 1 ? "#f59e0b" : "#94a3b8" }}>{yl} yr{yl === 1 ? "" : "s"} left</span>{/* only the calls worth making now (the filters above list everyone who could) */}{canExt(p) && yl <= 1 ? <span style={{ color: "#c4b5fd" }}> · extend now</span> : rp && p.salary >= 8 ? <span style={{ color: "#7dd3fc" }}> · can restructure</span> : ""}</span>
            </span>
            <b style={{ fontSize: 20, color: oC(p.ovr) }}>{p.ovr}</b>
          </button>
        ))}
        {!shown.length && <div style={{ padding: "18px 0", color: C.mt, fontSize: 14 }}>Nobody fits that filter.</div>}
      </div>
      {sortOpen && <Sheet title="Sort" onClose={() => setSortOpen(false)}>{SORTS.map(([k, l], i) => <Row key={k} first={i === 0} label={l} value={sort === k ? "✓" : ""} tone={C.gn} onClick={() => { setSort(k); setSortOpen(false); }} />)}<div style={{ height: 8 }} /></Sheet>}
      {r && (
        <Sheet onClose={() => setPick(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, paddingRight: 40 }}>
            <Face s={r.p.face} sz={60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{r.p.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}><Bdg pos={posTag(r.p)} /><span style={{ fontSize: 14, color: "#94a3b8" }}>Age {r.p.age}</span></div>
            </div>
            <b style={{ fontSize: 40, color: oC(r.p.ovr) }}>{r.p.ovr}</b>
          </div>
          {[["Cap hit", $(r.p.salary), C.gd], ["Years left", `${r.yl}`, r.yl <= 1 ? "#f59e0b" : "#fff"], ["Bonus a year", $(r.pr), "#fff"], ["Dead money if cut", $(r.dm.total), r.dm.total ? C.rd : C.mt], ...(r.p.ext ? [["Extension", `${$(r.p.ext.sal)} × ${r.p.ext.yrs} from ${yr + r.p.contract}`, "#c4b5fd"]] : [])].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", minHeight: 44, borderTop: "1px solid #ffffff14", fontSize: 16 }}><span style={{ color: "#94a3b8" }}>{l}</span><b style={{ marginLeft: "auto", color: c }}>{v}</b></div>
          ))}
          {holdout(r.p) ? <button onClick={() => { onExtend(r.p); setPick(null); }} style={{ width: "100%", minHeight: 52, marginTop: 12, borderRadius: 14, border: 0, background: "#78350f", color: "#fcd34d", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>Talk to his agent</button>
            : canExt(r.p) && <button onClick={() => { onExtend(r.p); setPick(null); }} style={{ width: "100%", minHeight: 52, marginTop: 12, borderRadius: 14, border: 0, background: "#7c3aed", color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>Extend his deal</button>}
          {r.rp && <button onClick={() => { onRestructure(r.p); setPick(null); }} style={{ width: "100%", minHeight: 50, marginTop: 8, borderRadius: 14, border: 0, background: "#0c4a6e", color: "#bae6fd", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>Restructure · frees {$(r.rp.saved)}</button>}
          <button onClick={() => { setSel(r.p); setPick(null); }} style={{ width: "100%", minHeight: 48, marginTop: 8, borderRadius: 14, border: 0, background: "transparent", color: "#7dd3fc", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Player card</button>
          <div style={{ height: 8 }} />
        </Sheet>
      )}
    </div>
  );
}
