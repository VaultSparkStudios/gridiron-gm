// The weekly injury report: everything about your club's health from the week's game in one card
// (it replaces the separate toast, starter-down alert and rehab pop-ups). Out this week with who
// steps in, IR placements with a rehab plan to pick, players playing through a knock, and who's back.
import React from "react";
import { C, Btn, Bdg, CloseX } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";

export const REHAB = [
  { id: "aggressive", lbl: "Aggressive", desc: "back 2 weeks early, 15% re-injury risk", wkBonus: -2, risk: 0.15 },
  { id: "standard", lbl: "Standard", desc: "normal timeline, low risk", wkBonus: 0, risk: 0.05 },
  { id: "cautious", lbl: "Cautious", desc: "1 week longer, almost no risk", wkBonus: 1, risk: 0.01 },
];

const Section = ({ label, color, children }) => (
  <div style={{ marginTop: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.3, color, marginBottom: 4 }}>{label}</div>
    {children}
  </div>
);

// rep: { wk, out: [{ id, name, pos, type, wks, ir, starter, nextUp }], hurt: [{ name, pos, type, pen }], back: [name] }
// rehab: { [id]: true } IR players still waiting on a plan. onPick(id): choose who starts; onRehab(id, opt).
export default function InjuryReport({ rep, rehab = {}, onPick, onRehab, onClose }) {
  if (!rep) return null;
  const { out = [], hurt = [], back = [] } = rep;
  return (
    <div role="dialog" aria-label="Injury report" style={{ position: "fixed", zIndex: 1200, ...(MOBILE ? { left: 8, right: 8, bottom: "calc(72px + env(safe-area-inset-bottom))" } : { left: 16, bottom: 16, width: 380 }), maxHeight: "70vh", overflowY: "auto", background: C.cd, border: `1px solid ${C.rd}55`, borderRadius: 14, padding: 14, boxShadow: "0 14px 40px #000b" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{fontSize: 13, fontWeight: 800, color: "#fca5a5" }}>Injury report</div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Week {rep.wk}{out.length ? ` · ${out.length} out` : ""}{hurt.length ? ` · ${hurt.length} banged up` : ""}{back.length ? ` · ${back.length} back` : ""}</div>
        </div>
        <CloseX onClick={onClose} />
      </div>
      {out.length > 0 && (
        <Section label="OUT" color={C.rd}>
          {out.map((p) => (
            <div key={p.id} style={{ padding: "7px 0", borderTop: `1px solid ${C.bd}66` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bdg pos={posTag(p)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.mt }}>{p.type || "Injury"} · {p.ir ? "injured reserve" : `${p.wks} week${p.wks === 1 ? "" : "s"}`}{p.starter && p.nextUp ? <> · next up <b style={{ color: "#e2e8f0" }}>{p.nextUp}</b></> : ""}</div>
                </div>
                {p.starter && <Btn onClick={() => onPick(p.id)} bg={C.bd} c="#e2e8f0" style={{ fontSize: 12, padding: "5px 10px" }}>Change</Btn>}
              </div>
              {p.ir && rehab[p.id] && (
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {REHAB.map((o) => <button key={o.id} onClick={() => onRehab(p.id, o)} title={o.desc} style={{ flex: 1, background: "#1e293b", color: "#e2e8f0", border: "1px solid #3341552e", borderRadius: 6, padding: "5px 4px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{o.lbl}</button>)}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
      {hurt.length > 0 && (
        <Section label="PLAYING THROUGH IT" color={C.gd}>
          {hurt.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}><Bdg pos={posTag(p)} /><b>{p.name}</b><span style={{ color: C.mt }}>{p.type} · −{p.pen} OVR next game</span></div>)}
        </Section>
      )}
      {back.length > 0 && (
        <Section label="BACK" color={C.gn}>
          <div style={{ fontSize: 13, color: "#e2e8f0" }}>{back.join(", ")}</div>
        </Section>
      )}
      <div style={{ fontSize: 11.5, color: C.mt, marginTop: 10, lineHeight: 1.4 }}>Starters you don't change are replaced by the next man on your depth chart.</div>
    </div>
  );
}
