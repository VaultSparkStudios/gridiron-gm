// Re-sign week: between the Combine and free agency you get exclusive rights to your own
// expiring players. Anyone you don't re-sign hits free agency, where other clubs can bid.
import React from "react";
import { C, oC, Bdg, Btn, Face, TeamLogo } from "./ui.jsx";
import { yearlyAsk } from "./negotiation.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;

// tagFor(p) / optionFor(p): the one-year price, or null when it isn't available.
export default function Resign({ team, yr, nextSpace, talkFor, onNegotiate, setSel, tagFor = () => null, optionFor = () => null, onTag, onOption, tagUsed }) {
  const list = team.roster.filter((p) => p.contract === 1 || p.resigned?.yr === yr).sort((a, b) => b.ovr - a.ovr);
  const td = { padding: "10px 6px", borderBottom: `1px solid ${C.bd}55`, fontSize: 15, textAlign: "center" };
  const done = list.filter((p) => p.resigned?.yr === yr).length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px 18px", flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><TeamLogo t={team} sz={44} /><span style={{ fontSize: 24, fontWeight: 900 }}>Re-sign Week</span></span>
        <span style={{ fontSize: 15, color: C.mt }}>{yr + 1} cap space <b style={{ fontSize: 20, color: nextSpace >= 0 ? C.gn : C.rd }}>{money(nextSpace)}</b></span>
        <span style={{ fontSize: 15, color: C.mt }}>Re-signed <b style={{ fontSize: 20, color: "#fff" }}>{done}</b>/{list.length}</span>
      </div>
      <div style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.5 }}>These contracts run out after the season. Only you can talk to them this week. Anyone you don't re-sign becomes a free agent, and other teams can outbid you. Lowball a player and he may refuse to talk again.</div>
      <div style={{ fontSize: 14, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.5, background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "8px 12px" }}>
        <b style={{ color: "#fcd34d" }}>🏷️ Franchise tag</b> keeps any expiring player one more year at the average of the top five salaries at his position, no negotiation. One tag a year{tagUsed ? " (used)" : ""}.{" "}
        <b style={{ color: "#c4b5fd" }}>5️⃣ Fifth-year option</b>: first-round picks finishing year four of their rookie deal can be kept one more year at a set price.
      </div>
      <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: 12, overflowX: "auto" }}>
        <style>{"@media (max-width: 640px) { .rs-hide { display: none } }"}</style>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["PLAYER", "POS", "AGE", "OVR", "NOW", "ASKING", ""].map((h, i) => <th key={i} className={h === "AGE" || h === "NOW" ? "rs-hide" : undefined} style={{ padding: "8px 6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.mt, borderBottom: `1px solid ${C.bd}`, textAlign: i === 0 ? "left" : "center" }}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map((p) => {
              const talk = talkFor(p);
              const signed = p.resigned?.yr === yr;
              return (
                <tr key={p.id}>
                  <td style={{ ...td, textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Face s={p.face} sz={28} />
                      <span><span onClick={() => setSel(p)} style={{ fontWeight: 700, cursor: "pointer" }}>{p.name}</span>
                        {signed && <span style={{ display: "block", fontSize: 13, color: C.gn, fontWeight: 700 }}>{p.resigned.how === "tag" ? "Franchise tagged" : p.resigned.how === "option" ? "Fifth-year option picked up" : "Re-signed"} · {p.resigned.yrs} yr{p.resigned.yrs > 1 ? "s" : ""}, {money(p.resigned.sal)}/yr</span>}
                        {!signed && talk.walked && <span style={{ display: "block", fontSize: 13, color: C.rd, fontWeight: 700 }}>Walked away — he'll test free agency</span>}
                        {!signed && !talk.walked && talk.last && <span style={{ display: "block", fontSize: 13, color: C.gd }}>{talk.last.result === "counter" ? `Countered at $${talk.last.counter}M` : "Talks ongoing"}</span>}
                      </span>
                    </span>
                  </td>
                  <td style={td}><Bdg pos={p.pos} /></td>
                  <td className="rs-hide" style={{ ...td, color: "#cbd5e1" }}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 900, fontSize: 18, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td className="rs-hide" style={{ ...td, color: "#cbd5e1" }}>{signed ? "—" : money(p.salary)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{money(yearlyAsk(p, 2, "resign"))}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {!signed && optionFor(p) != null && <Btn onClick={() => onOption(p)} bg="#7c3aed" c="#ede9fe" style={{ fontSize: 13, padding: "6px 10px" }} title="Fifth-year option: one more year at a set price">5th-yr option {money(optionFor(p))}</Btn>}
                      {!signed && !tagUsed && tagFor(p) != null && <Btn onClick={() => onTag(p)} bg="#b45309" c="#fef3c7" style={{ fontSize: 13, padding: "6px 10px" }} title="Franchise tag: one more year, no negotiation">Tag {money(tagFor(p))}</Btn>}
                      {!signed && !talk.walked && <Btn onClick={() => onNegotiate(p)} bg={C.gn} style={{ fontSize: 14, padding: "6px 14px" }}>Negotiate</Btn>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <div style={{ padding: 16, fontSize: 15, color: C.mt }}>No contracts are expiring. Head to free agency.</div>}
      </div>
    </div>
  );
}
