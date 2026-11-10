// The trade finder: deals built around your biggest needs, one calm row each. The club, who you
// get, who you send, how much you overpay; "Open deal" puts it on the Make a trade tab to tweak.
import React, { useEffect } from "react";
import { C, Face, TeamLogo, oC, actBtn, card, cardTitle, fitH } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";

const m1 = (n) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(1)}M`;

function Who({ label, p, tone, onPlayer }) {
  return (
    <span onClick={(e) => { e.stopPropagation(); onPlayer(p); }} title={`${p.name}: his card`} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <Face s={p.face} sz={36} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 900, letterSpacing: 0.9, color: tone }}>{label}</span>
        <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} <b style={{ color: oC(p.ovr) }}>{p.ovr}</b></span>
        <span style={{ display: "block", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{posTag(p)} · {p.age} · {m1(p.salary || 0)} × {p.contract || 0}</span>
      </span>
    </span>
  );
}

// results: [{ team, get, send, rating, ratingColor }]
export default function TradeFinder({ results, needs = [], onRun, onLoad, onPlayer, capOf, myCap }) {
  useEffect(() => { if (!results.length) onRun(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // their room after the deal (they take on who you send and lose who you get)
  const after = (r) => (capOf ? capOf(r.team) - (r.send.salary || 0) + (r.get.salary || 0) : null);
  const mineAfter = (r) => (myCap != null ? myCap - (r.get.salary || 0) + (r.send.salary || 0) : null);
  return (
    <div style={{ ...card, padding: "14px 16px", ...(MOBILE ? null : { maxHeight: fitH.height, display: "flex", flexDirection: "column" }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", ...cardTitle }}>Deals for your needs</span>
          <span style={{ display: "block", fontSize: 14, color: "#94a3b8", marginTop: 1 }}>{needs.length ? `${needs.join(", ")} · ` : ""}every one is a deal they'd take</span>
        </span>
        <button onClick={onRun} style={actBtn("#e2e8f0")}>Find new deals</button>
      </div>
      {!results.length && <div style={{ color: "#94a3b8", fontSize: 15, padding: "16px 4px" }}>No fair deals right now. Your roster may be balanced, or nobody has what you need at a price that works.</div>}
      <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -8px" }}>
        {results.map((r, i) => {
          const a = after(r), mine = mineAfter(r);
          const club = (
            <span title={`${r.team.city} ${r.team.name}${a != null ? ` · their cap space after: ${m1(a)}` : ""}`} style={{ display: "flex", alignItems: "center", gap: 10, width: MOBILE ? "auto" : 170, flexShrink: 0, minWidth: 0 }}>
              <TeamLogo t={r.team} sz={30} glow />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.team.name}</span>
                <span style={{ display: "block", fontSize: 13, color: a != null && a < 0 ? "#fca5a5" : "#64748b" }}>{r.team.w}-{r.team.l}{a != null && a < 0 ? " · over the cap after" : ""}</span>
              </span>
            </span>
          );
          const tag = <span style={{ fontSize: 13, fontWeight: 800, color: r.ratingColor, whiteSpace: "nowrap", textTransform: "capitalize" }}>{String(r.rating).toLowerCase()}</span>;
          if (MOBILE) return (
            <div key={i} style={{ padding: "12px 8px", borderTop: i ? "1px solid #ffffff10" : 0 }}>
              {/* the club, how fair it is and the button on one line, then the two players */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{club}<span style={{ marginLeft: "auto" }}>{tag}</span><button onClick={() => onLoad(r)} style={{ ...actBtn("#fff"), minHeight: 40 }}>Open deal</button></div>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}><Who label="YOU GET" p={r.get} tone="#86efac" onPlayer={onPlayer} /><Who label="YOU SEND" p={r.send} tone="#fca5a5" onPlayer={onPlayer} /></div>
            </div>
          );
          return (
            <div key={i} className="calm-row" onClick={() => onLoad(r)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 10px", cursor: "pointer" }}>
              {club}
              <Who label="YOU GET" p={r.get} tone="#86efac" onPlayer={onPlayer} />
              <Who label="YOU SEND" p={r.send} tone="#fca5a5" onPlayer={onPlayer} />
              <span style={{ width: 120, flexShrink: 0, textAlign: "right" }}>
                {tag}
                {mine != null && <span title="Your cap space after this trade" style={{ display: "block", fontSize: 13, color: mine < 0 ? "#fca5a5" : "#64748b" }}>you {m1(mine)} after</span>}
              </span>
              <span className="calm-act" style={{ ...actBtn("#7dd3fc"), flexShrink: 0 }}>Open deal</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
