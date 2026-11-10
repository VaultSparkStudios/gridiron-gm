// Standings on phones, in the Home screen's look: a hero with where you stand, one conference at a
// time (yours first), each division as a soft card with you highlighted. The playoff picture follows.
import React, { useState } from "react";
import { C, TeamLogo, Hero, Segments } from "./ui.jsx";

const ORD = ["1st", "2nd", "3rd", "4th"];
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;

export default function PhoneStandings({ teams, ui, yr, confOf, divOf, extra }) {
  const me = teams[ui];
  const [conf, setConf] = useState(confOf(me) || "AFC");
  const divs = {};
  teams.forEach((t) => { (divs[`${confOf(t)} ${divOf(t)}`] ||= []).push(t); });
  Object.values(divs).forEach((d) => d.sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa)));
  const mine = divs[`${confOf(me)} ${divOf(me)}`] || [];
  const place = mine.indexOf(me);
  return (
    <div>
      <Hero clr={me.clr} logo={me} eyebrow={`${yr} standings`} title={`${ORD[place] || `${place + 1}th`} in the ${confOf(me)} ${divOf(me)}`}
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{rec(me)}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>RECORD</div></div>} />
      <div style={{ margin: "12px 0 10px" }}><Segments items={[["AFC", "AFC"], ["NFC", "NFC"]]} value={conf} onChange={setConf} /></div>
      {["East", "North", "South", "West"].map((d) => { const list = divs[`${conf} ${d}`]; if (!list) return null; return (
        <div key={d} style={{ background: "#ffffff0f", borderRadius: 18, padding: "2px 14px 4px", marginBottom: 10 }}>
          <div style={{ display: "flex", fontSize: 12, fontWeight: 900, letterSpacing: 1.3, color: "#94a3b8", padding: "8px 0 2px" }}><span style={{ flex: 1 }}>{conf} {d.toUpperCase()}</span><span style={{ width: 52, textAlign: "right" }}>W-L</span><span style={{ width: 52, textAlign: "right" }}>DIFF</span></div>
          {list.map((t, i) => { const diff = t.pf - t.pa, you = t.id === ui; return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, borderTop: i ? "1px solid #ffffff10" : 0, background: you ? `${C.gn}14` : "transparent", margin: you ? "0 -14px" : 0, padding: you ? "0 14px" : 0 }}>
              <span style={{ width: 14, fontSize: 14, fontWeight: 800, color: C.mt }}>{i + 1}</span>
              <TeamLogo t={t} sz={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: you ? C.gn : "#f1f5f9" }}>{t.name}</span>
              <b style={{ width: 52, textAlign: "right", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{rec(t)}</b>
              <span style={{ width: 52, textAlign: "right", fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: diff > 0 ? C.gn : diff < 0 ? C.rd : C.mt }}>{diff > 0 ? "+" : ""}{diff}</span>
            </div>
          ); })}
        </div>
      ); })}
      {extra}
    </div>
  );
}
