// Offer sheets: sign another club's franchise-tagged player. If his club doesn't match, he's yours
// and they get your first-round picks this year and next.
import React, { useState } from "react";
import { C, oC, Bdg, Btn, Face, TeamLogo } from "./ui.jsx";
import Negotiate from "./Negotiate.jsx";
import { taggedPlayers, sheetCompensation } from "./contractDepth.js";
import { posTag } from "./dline.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;

export default function OfferSheets({ teams, ui, yr, picks, futures, cap, termsFor, talkFor, onSheet }) {
  const [open, setOpen] = useState(null);
  const list = taggedPlayers(teams, ui, yr);
  const comp = sheetCompensation(picks, futures, ui, yr);
  if (!list.length) return null;
  return (
    <div style={{ background: C.cd, border: "1px solid #b4530966", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
      <div style={{fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>Offer sheets</div>
      <div style={{ fontSize: 13, color: C.mt, margin: "2px 0 8px" }}>Franchise-tagged players can sign an offer sheet. If his club doesn't match, he's yours and they get your first-round picks in the {yr} and {yr + 1} drafts.{!comp.ok && <b style={{ color: C.rd }}> {comp.why}</b>}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 8 }}>
        {list.map(({ p, ti }) => (
          <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
            <Face s={p.face} sz={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
              <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12, color: C.mt }}><Bdg pos={posTag(p)} /><b style={{ color: oC(p.ovr) }}>{p.ovr}</b><TeamLogo t={teams[ti]} sz={16} />{teams[ti].ab} · tag {money(p.salary)}</div>
            </div>
            {talkFor(p).walked || talkFor(p).signed ? <span style={{ fontSize: 12, color: C.mt }}>Done</span> : <Btn onClick={() => setOpen({ p, ti })} disabled={!comp.ok} bg="#b45309" style={{ fontSize: 13, padding: "5px 10px" }}>Offer sheet</Btn>}
          </div>
        ))}
      </div>
      {open && <Negotiate team={teams[ui]} cy={yr + 1} p={open.p} mode="fa" cap={cap} t={{ ...termsFor(open.p, "fa"), rival: null }} talk={talkFor(open.p)} note={`Offer sheet: if he signs it, the ${teams[open.ti].city} ${teams[open.ti].name} can match and keep him. If they don't, he's yours and they get your ${yr} and ${yr + 1} first-round picks.`} onResult={(r, o) => onSheet(open.p, open.ti, r, o)} onClose={() => setOpen(null)} />}
    </div>
  );
}
