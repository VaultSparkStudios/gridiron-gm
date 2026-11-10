// Re-sign week: between the Combine and free agency you get exclusive rights to your own
// expiring players. Anyone you don't re-sign hits free agency, where other clubs can bid.
import React from "react";
import { C, oC, Bdg, Btn, Face } from "./ui.jsx";
import { yearlyAsk } from "./negotiation.js";
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;

// tagFor(p) / optionFor(p): the one-year price, or null when it isn't available.
export default function Resign({ team, yr, nextSpace, talkFor, onNegotiate, setSel, tagFor = () => null, optionFor = () => null, onTag, onOption, tagUsed }) {
  const list = team.roster.filter((p) => p.contract === 1 || p.resigned?.yr === yr).sort((a, b) => b.ovr - a.ovr);
  const td = { padding: "10px 6px", borderBottom: "1px solid #ffffff0a", fontSize: 15, textAlign: "center" };
  const done = list.filter((p) => p.resigned?.yr === yr).length;
  // the tag is for a cornerstone, so it's only offered on your best few expiring players
  const tagIds = new Set(list.filter((p) => p.resigned?.yr !== yr).slice(0, 3).map((p) => p.id));
  const status = (p, talk, signed) => <>
    {signed && <span style={{ display: "block", fontSize: 13, color: C.gn, fontWeight: 700 }}>{p.resigned.how === "tag" ? "Franchise tagged" : p.resigned.how === "option" ? "Fifth-year option picked up" : "Re-signed"} · {p.resigned.yrs} yr{p.resigned.yrs > 1 ? "s" : ""}, {money(p.resigned.sal)}/yr</span>}
    {!signed && talk.walked && <span style={{ display: "block", fontSize: 13, color: C.rd, fontWeight: 700 }}>Walked away — he'll test free agency</span>}
    {!signed && !talk.walked && talk.last && <span style={{ display: "block", fontSize: 13, color: C.gd }}>{talk.last.result === "counter" ? `Countered at $${talk.last.counter}M` : "Talks ongoing"}</span>}
  </>;
  const actions = (p, talk, signed, sm) => { const b = sm ? { fontSize: 13, padding: "4px 10px", minHeight: 34 } : null; return <>
    {!signed && optionFor(p) != null && <Btn onClick={() => onOption(p)} bg="#7c3aed26" c="#c4b5fd" style={{ ...(b || { fontSize: 13, padding: "6px 12px" }), borderRadius: 999 }} title="Fifth-year option: one more year at a set price">5th-yr option {money(optionFor(p))}</Btn>}
    {!signed && !tagUsed && tagIds.has(p.id) && tagFor(p) != null && <Btn onClick={() => onTag(p)} bg="#f59e0b1f" c="#fcd34d" style={{ ...(b || { fontSize: 13, padding: "6px 12px" }), borderRadius: 999 }} title="Franchise tag: one more year, no negotiation">Tag {money(tagFor(p))}</Btn>}
    {!signed && !talk.walked && <Btn onClick={() => onNegotiate(p)} bg="#22c55e1f" c="#4ade80" style={{ ...(b ? { ...b, padding: "4px 14px" } : { fontSize: 14, padding: "6px 14px" }), border: "1px solid #22c55e55", borderRadius: 999 }}>Negotiate</Btn>}
  </>; };
  return (
    <div>
      {/* one quiet line: the week, the room and how many are done; the rules fold away */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px 20px", flexWrap: "wrap", marginBottom: 6 }}>
        {/* desktop: the section header already says Re-sign week */}{MOBILE && <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Re-sign week</span>}
        <span style={{ fontSize: 15, color: C.mt }}>{yr + 1} cap space <b style={{ color: nextSpace >= 0 ? C.gn : C.rd }}>{money(nextSpace)}</b></span>
        <span style={{ fontSize: 15, color: C.mt }}>Re-signed <b style={{ color: "#fff" }}>{done}</b> of {list.length}</span>
      </div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>Only you can talk to these players this week. Anyone you don't re-sign becomes a free agent. Lowball one and he may stop talking.{" "}
        <details style={{ display: "inline" }}><summary style={{ display: "inline", cursor: "pointer", color: "#cbd5e1", fontWeight: 700 }}>Tag and fifth-year option</summary>
          <div style={{ marginTop: 6, background: "#ffffff0d", borderRadius: 14, padding: "10px 14px", color: "#cbd5e1" }}><b style={{ color: "#fcd34d" }}>Franchise tag</b>: one of your top three expiring players for one more year at the average of the top five salaries at his position, no talks. One a year{tagUsed ? " (used)" : ""}. <b style={{ color: "#c4b5fd" }}>Fifth-year option</b>: a first-round pick finishing year four of his rookie deal, one more year at a set price.</div>
        </details>
      </div>
      {MOBILE ? (
        <div style={{ display: "grid", gap: 8 }}>
          {list.map((p) => {
            const talk = talkFor(p);
            const signed = p.resigned?.yr === yr;
            return (
              <div key={p.id} style={{ background: signed ? "#22c55e12" : "#ffffff0f", borderRadius: 18, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Face s={p.face} sz={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div onClick={() => setSel(p)} style={{ fontWeight: 800, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8" }}><Bdg pos={posTag(p)} /> Age {p.age}</div>
                    {status(p, talk, signed)}
                  </div>
                  <b style={{ fontSize: 20, color: oC(p.ovr) }}>{p.ovr}</b>
                </div>
                {!signed && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", marginRight: "auto" }}>Asking <b style={{ fontSize: 14, color: "#e2e8f0" }}>{money(yearlyAsk(p, 2, "resign"))}</b></span>
                  {actions(p, talk, signed, true)}
                </div>}
              </div>
            );
          })}
          {!list.length && <div style={{ padding: 16, fontSize: 15, color: C.mt }}>No contracts are expiring. Head to free agency.</div>}
        </div>
      ) : (
      <div style={{ background: "#ffffff0d", borderRadius: 18, padding: "6px 14px", overflowX: "auto" }}>
        <style>{"@media (max-width: 640px) { .rs-hide { display: none } }"}</style>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["PLAYER", "POS", "AGE", "OVR", "NOW", "ASKING", ""].map((h, i) => <th key={i} className={h === "AGE" || h === "NOW" ? "rs-hide" : undefined} style={{ padding: "8px 6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.mt, borderBottom: "1px solid #ffffff14", textAlign: i === 0 ? "left" : "center" }}>{h}</th>)}</tr></thead>
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
                        {status(p, talk, signed)}
                      </span>
                    </span>
                  </td>
                  <td style={td}><Bdg pos={posTag(p)} /></td>
                  <td className="rs-hide" style={{ ...td, color: "#cbd5e1" }}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 900, fontSize: 18, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td className="rs-hide" style={{ ...td, color: "#cbd5e1" }}>{signed ? "—" : money(p.salary)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{money(yearlyAsk(p, 2, "resign"))}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {actions(p, talk, signed)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <div style={{ padding: 16, fontSize: 15, color: C.mt }}>No contracts are expiring. Head to free agency.</div>}
      </div>
      )}
    </div>
  );
}
