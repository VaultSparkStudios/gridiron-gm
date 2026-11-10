// The season's retirement class: everyone who hung it up when the season ended, best careers first.
// Your own players are marked; tap a name with a saved card to open it.
import React, { useState } from "react";
import { C, Face, Bdg, CloseX, sheetWrap, sheetBox, SheetGrip, oC } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";

export default function RetirementClass({ cls, onClose, cardFor }) {
  const [mineOnly, setMineOnly] = useState(false);
  const list = (cls?.list || []).filter((x) => !mineOnly || x.mine);
  const yours = (cls?.list || []).filter((x) => x.mine).length;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.86)", zIndex: 2200, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, ...sheetWrap(MOBILE) }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Retirement class" style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", borderRadius: 16, background: "#0b1220", border: "1px solid #ffffff10", padding: 14, color: C.tx, fontFamily: C.f, ...sheetBox(MOBILE) }}>
        {MOBILE && <SheetGrip onClose={onClose} />}
        <CloseX onClick={onClose} />
        <div style={{fontSize: 13, fontWeight: 800, color: C.gd }}>Retirement class of {cls?.yr}</div>
        <div style={{ fontSize: MOBILE ? 19 : 23, fontWeight: 900, marginBottom: 2 }}>{cls?.n} player{cls?.n === 1 ? "" : "s"} hang it up</div>
        <div style={{ fontSize: 13, color: C.mt, marginBottom: 8 }}>Best careers first. Free agents unsigned for two straight seasons retire too.</div>
        {yours > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[[false, `Everyone (${cls.n})`], [true, `Yours (${yours})`]].map(([v, l]) => <button key={l} onClick={() => setMineOnly(v)} style={{ background: mineOnly === v ? `${C.gn}22` : "transparent", color: mineOnly === v ? C.gn : C.mt, border: `1px solid ${mineOnly === v ? C.gn : C.bd}`, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{l}</button>)}
        </div>}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {list.map((x) => {
            const card = cardFor?.(x.id);
            return <div key={x.id} onClick={card ? () => card() : undefined} title={card ? "Open his card" : undefined} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 6px", borderBottom: `1px solid ${C.bd}66`, cursor: card ? "pointer" : "default", background: x.mine ? `${C.gn}10` : "transparent", borderRadius: 6 }}>
              <Face s={x.face} sz={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}{x.mine && <span style={{ fontSize: 11, color: C.gn, fontWeight: 900, marginLeft: 6 }}>YOURS</span>}</div>
                <div style={{ fontSize: 12, color: C.mt, display: "flex", gap: 6, alignItems: "center" }}><Bdg pos={posTag(x)} /> {x.team === "FA" ? (x.stale ? "free agent, unsigned two seasons" : "free agent") : x.team} · age {x.age} · {x.seasons} season{x.seasons === 1 ? "" : "s"}</div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 900, color: oC(x.peak) }}>{x.peak}</div><div style={{ fontSize: 10, color: C.mt, fontWeight: 800 }}>PEAK</div></div>
            </div>;
          })}
          {!list.length && <div style={{ color: C.mt, padding: 10 }}>Nobody retired.</div>}
        </div>
      </div>
    </div>
  );
}
