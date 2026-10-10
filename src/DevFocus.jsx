// The Development Focus card on the dashboard.
import React from "react";
import { C, oC, pC } from "./ui.jsx";
import { devOf, DEV_TRAITS } from "./scouting.js";
import { OFFENSE, DEFENSE, focusChance, perSeason } from "./development.js";
import { DevChip } from "./ScoutingUI.jsx";

const initials = (n) => String(n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function FocusSlot({ label, side, players, focus, setFocus, setSel }) {
  const p = players.find((x) => x.id === focus?.[side]);
  const options = [...players].sort((a, b) => focusChance(b) - focusChance(a) || b.ovr - a.ovr);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.mt, marginBottom: 6 }}>{label}</div>
      {p ? (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #8a6d1d", marginBottom: 6, cursor: "pointer" }} onClick={() => setSel(p)}>
          <div style={{ background: "linear-gradient(135deg,#0b1a3a,#13244a)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: "2px solid #dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>{initials(p.name)}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: pC(p.pos), borderRadius: 4, padding: "2px 7px" }}>{p.pos}</span>
            <span style={{ marginLeft: "auto", fontSize: 30, fontWeight: 900, fontStyle: "italic", color: oC(p.ovr) }}>{p.ovr}</span>
          </div>
          <div style={{ background: "#f5c5420d", padding: "8px 12px" }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
              <span>Age {p.age}</span><DevChip dev={devOf(p)} /><span>${(p.salary || 0).toFixed(1)}M · {p.contract}y</span>
              <span style={{ color: "#fbbf24" }}>{p.labGains ? `+${p.labGains} OVR from the lab` : "in the lab this week"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ border: `1px dashed ${C.bd}`, borderRadius: 10, padding: "14px 12px", color: C.mt, fontSize: 13, marginBottom: 6 }}>Nobody in the lab. Pick a player below.</div>
      )}
      <select value={p?.id || ""} onChange={(e) => setFocus((f) => ({ ...f, [side]: e.target.value || null }))} aria-label={`${label} development focus`} style={{ width: "100%", background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
        <option value="">— choose {label.toLowerCase()} —</option>
        {options.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.pos}, {x.ovr} OVR, {(DEV_TRAITS[devOf(x)]?.name || "Normal").toUpperCase()}) · ~{perSeason(x)}/season</option>)}
      </select>
    </div>
  );
}

export default function DevFocusCard({ roster, focus, setFocus, setSel }) {
  return (
    <div style={{ background: C.cd, borderRadius: 8, padding: "12px 14px", border: `1px solid ${C.bd}` }}>
      <div style={{ fontSize: 11, color: C.mt, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>DEVELOPMENT FOCUS</div>
      <FocusSlot label="Offense" side="off" players={roster.filter((p) => OFFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      <FocusSlot label="Defense" side="def" players={roster.filter((p) => DEFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      <div style={{ fontSize: 12, color: C.mt }}>Each regular-season week a focused player can gain a point. Young + high development trait = faster gains.</div>
    </div>
  );
}
