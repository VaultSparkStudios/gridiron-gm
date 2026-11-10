// Franchise at a glance: the numbers that run a team (record and division place, cap room, roster
// health, owner and locker room), always at the top of Home, each one a shortcut to the screen
// where you fix it. Anything waiting on you comes first, full width; when nothing is, it's gone.
// Desktop: one row. Phone: one compact row you swipe sideways.
import React from "react";
import { C } from "./ui.jsx";

function Tile({ label, value, sub, tone = C.tx, onClick, accent, wide, mobile }) {
  // desktop: a slim tile, the value and its detail on one line
  return (
    <button onClick={onClick} title={sub || undefined} style={{ flex: mobile ? (wide ? "0 0 210px" : "0 0 136px") : wide ? "1.4 0 220px" : "1 0 150px", scrollSnapAlign: mobile ? "start" : undefined, minWidth: 0, textAlign: "left", background: wide ? `${tone}14` : C.cd, border: `1px solid ${wide ? `${tone}66` : C.bd}`, borderTop: `${mobile ? 3 : 2}px solid ${wide ? tone : accent || C.bd}`, borderRadius: mobile ? 10 : 8, padding: mobile ? "8px 10px" : "5px 10px", cursor: onClick ? "pointer" : "default", color: C.tx }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.1, color: wide ? tone : C.mt }}>{label}</div>
      {mobile ? <>
        <div style={{ fontSize: 18, fontWeight: 900, color: tone, lineHeight: 1.15, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </> : <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: tone, lineHeight: 1.2, flex: "0 0 auto" }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{sub}</span>}
      </div>}
    </button>
  );
}

// tiles: [{ label, value, sub, tone, onClick, wide }]; accent: the team color for the top edge
export default function FranchiseStrip({ tiles, accent, mobile }) {
  return (
    <div data-tour="strip" className={mobile ? "pill-row" : undefined} style={mobile ? { display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", paddingBottom: 2 } : { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      {tiles.map((t) => <Tile key={t.label} {...t} accent={accent} mobile={mobile} />)}
    </div>
  );
}
