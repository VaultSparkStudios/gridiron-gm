// The Front Office's contract list on a computer: one calm row per deal (the Big Board's look).
// Face, name and position; what he costs this year, how long he's signed, what cutting him would
// leave behind; and the one move that's open (extend or restructure), quiet until you hover.
import React from "react";
import { Face, oC, Pills, actBtn, card, fitH } from "./ui.jsx";
import { posTag } from "./dline.js";

const $ = (v) => `$${(+v || 0).toFixed(1)}M`;
const COLS = [["ovr", "OVR", 56], ["cap", "Cap hit", 96], ["yrs", "Signed", 92], ["dead", "Dead if cut", 104]];

export default function ContractsDesk({ shown, filters, filter, setFilter, sort, setSort, setSel, canExt, holdout, onExtend, onRestructure, yr }) {
  const head = (k, l, w) => (
    <button key={k} onClick={() => setSort(k)} style={{ width: w, textAlign: "right", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: sort === k ? "#fff" : "#64748b", flexShrink: 0 }}>{l.toUpperCase()}{sort === k ? " ▾" : ""}</button>
  );
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Pills items={filters} value={filter} onChange={setFilter} label="Show" />
        <span style={{ fontSize: 14, color: "#64748b" }}>Extend in a deal's last two years; restructure to turn salary into bonus.</span>
      </div>
      <div style={{ ...card, padding: "10px 12px", ...fitH, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 12px 8px" }}>
          <button onClick={() => setSort("pos")} style={{ flex: 1, textAlign: "left", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: sort === "pos" ? "#fff" : "#64748b" }}>PLAYER{sort === "pos" ? " ▾" : ""}</button>
          {COLS.map(([k, l, w]) => head(k, l, w))}
          <span style={{ width: 170, flexShrink: 0 }} />
        </div>
        <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
          {shown.map(({ p, yl, pr, dm, rp }) => {
            const ext = canExt(p), ho = holdout(p);
            return (
              <div key={p.id} className="calm-row" onClick={() => setSel(p)} title={`Signing bonus counts ${$(pr)} a year against the cap`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 12px", borderRadius: 14, cursor: "pointer" }}>
                <Face s={p.face} sz={38} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 13, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {posTag(p)} · {p.age}
                    {ho && <b style={{ color: "#fbbf24", fontWeight: 800 }}> · holding out</b>}
                    {p.injured && <span style={{ color: "#fca5a5" }}> · injured</span>}
                    {p.ext && <span style={{ color: "#c4b5fd" }}> · extended {$(p.ext.sal)} × {p.ext.yrs} from {yr + p.contract}</span>}
                  </span>
                </span>
                <span style={{ width: 56, textAlign: "right", fontSize: 17, fontWeight: 900, color: oC(p.ovr), flexShrink: 0 }}>{p.ovr}</span>
                <span style={{ width: 96, textAlign: "right", fontSize: 16, fontWeight: 800, color: "#f8fafc", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{$(p.salary)}</span>
                <span style={{ width: 92, textAlign: "right", fontSize: 14, fontWeight: 700, color: yl <= 1 ? "#fbbf24" : "#cbd5e1", flexShrink: 0 }}>{yl <= 1 ? "Final year" : `${yl} years`}</span>
                <span style={{ width: 104, textAlign: "right", fontSize: 14, color: dm.total >= 5 ? "#fca5a5" : "#64748b", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{$(dm.total)}</span>
                <span className="calm-act" style={{ width: 170, textAlign: "right", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {ext && !ho ? <button onClick={() => onExtend(p)} style={actBtn("#c4b5fd")}>Extend</button>
                    : rp ? <button onClick={() => onRestructure(p)} title={`Turns ${$(rp.convert)} of salary into bonus`} style={actBtn("#7dd3fc")}>Restructure · +{$(rp.saved)}</button> : null}
                </span>
              </div>
            );
          })}
          {!shown.length && <div style={{ fontSize: 15, color: "#94a3b8", padding: 14 }}>No contracts here.</div>}
        </div>
      </div>
    </div>
  );
}
