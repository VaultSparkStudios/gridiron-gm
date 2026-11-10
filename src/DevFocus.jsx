// The Development Focus card on the dashboard.
import Select from "./Select.jsx";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { C, oC, pC, Bdg, CloseX, Segments, Pills } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { devOf, DEV_TRAITS } from "./scouting.js";
import { OFFENSE, DEFENSE, focusChance, perSeason } from "./development.js";
import { DevChip } from "./ScoutingUI.jsx";
import { posTag } from "./dline.js";

// The order positions are listed in the picker.
const POS_ORDER = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "OL", "EDGE", "DL", "DT", "LB", "CB", "S", "K", "P"];
const posRank = (pos) => { const i = POS_ORDER.indexOf(pos); return i < 0 ? 99 : i; };
const initials = (n) => String(n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Phones: a full-screen picker (search, players grouped by position, big rows) instead of a
// tiny dropdown.
function Picker({ label, groups, current, onPick, onClose, by, setBy }) {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  // drawn on the page itself: opened from inside a sheet, the sheet's slide-in would otherwise pin
  // this "full screen" picker inside the sheet, half off the screen
  return createPortal(
    <div className="keep-dark" style={{ position: "fixed", inset: 0, zIndex: 3200, background: C.bg, color: C.tx, fontFamily: C.f, display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div style={{ position: "relative", padding: "calc(12px + env(safe-area-inset-top)) 14px 10px", borderBottom: `1px solid ${C.bd}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{label} development focus</div>
        <CloseX onClick={onClose} style={{ top: "calc(8px + env(safe-area-inset-top))" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your roster" aria-label="Search" style={{ width: "100%", boxSizing: "border-box", minHeight: 44, background: C.cd, color: C.tx, border: "1px solid #ffffff10", borderRadius: 10, padding: "8px 12px", fontSize: 16 }} />
        {setBy && <div style={{ marginTop: 10 }}><Segments items={[["pos", "By position"], ["growth", "Fastest growth"]]} value={by} onChange={setBy} /></div>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px calc(20px + env(safe-area-inset-bottom))" }}>
        {current && <button onClick={() => onPick(null)} style={{ width: "100%", minHeight: 48, margin: "4px 0 8px", background: "transparent", border: `1px dashed ${C.bd}`, borderRadius: 10, color: C.mt, fontSize: 15, cursor: "pointer" }}>Nobody in the lab</button>}
        {groups.map(([pos, list]) => {
          const rows = list.filter((x) => !n || x.name.toLowerCase().includes(n));
          if (!rows.length) return null;
          return (
            <div key={pos} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: C.mt, margin: "8px 4px 4px" }}>{pos}</div>
              {rows.map((x) => (
                <button key={x.id} onClick={() => onPick(x.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 56, marginBottom: 4, background: String(current) === String(x.id) ? `${C.gn}22` : C.cd, border: `1px solid ${String(current) === String(x.id) ? C.gn : C.bd}`, borderRadius: 10, padding: "6px 12px", color: C.tx, textAlign: "left", cursor: "pointer" }}>
                  <Bdg pos={posTag(x)} />
                  <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block", fontSize: 15 }}>{x.name}</b><span style={{ fontSize: 12, color: C.mt }}>Age {x.age} · {(DEV_TRAITS[devOf(x)]?.name || "Normal")} · ~{perSeason(x)}/season</span></span>
                  <b style={{ fontSize: 20, color: oC(x.ovr) }}>{x.ovr}</b>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

function FocusSlot({ label, side, players, focus, setFocus, setSel }) {
  const p = players.find((x) => focus?.[side] != null && String(x.id) === String(focus[side]));
  const [by, setBy] = useState("pos"); // "pos": grouped by position; "growth": fastest growers first
  const [picking, setPicking] = useState(false);
  const best = (a, b) => focusChance(b) - focusChance(a) || b.ovr - a.ovr;
  const options = [...players].sort(best);
  const groups = [...new Set(players.map((x) => x.pos))].sort((a, b) => posRank(a) - posRank(b)).map((pos) => [pos, options.filter((x) => x.pos === pos)]);
  const opt = (x) => <option key={x.id} value={x.id}>{x.name} ({posTag(x)}, {x.ovr} OVR, {(DEV_TRAITS[devOf(x)]?.name || "Normal").toUpperCase()}) · ~{perSeason(x)}/season</option>;
  // phones: one clean row per side (who's in the lab, or a prompt); the sort lives in the picker
  if (MOBILE) return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: "#94a3b8", margin: "0 2px 8px" }}>{label.toUpperCase()}</div>
      <button onClick={() => setPicking(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "0 14px", borderRadius: 18, border: 0, background: p ? "#f5c54214" : "#ffffff0f", color: "#fff", textAlign: "left", cursor: "pointer" }}>
        {p ? <>
          <Bdg pos={posTag(p)} />
          <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block", fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</b><span style={{ display: "block", fontSize: 13, color: "#fbbf24", marginTop: 2 }}>{(DEV_TRAITS[devOf(p)]?.name || "Normal")} · {p.labGains ? `+${p.labGains} OVR from the lab` : `~${perSeason(p)}/season`}</span></span>
          <b style={{ fontSize: 24, color: oC(p.ovr) }}>{p.ovr}</b>
        </> : <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#cbd5e1" }}>Choose a player</span>}
        <span style={{ fontSize: 20, color: "#64748b" }}>›</span>
      </button>
      {picking && <Picker label={label} by={by} setBy={setBy} groups={by === "pos" ? groups : [["Fastest growers first", options]]} current={p?.id} onClose={() => setPicking(false)} onPick={(id) => { setFocus((f) => ({ ...f, [side]: id })); setPicking(false); }} />}
    </div>
  );
  return (
    <div style={{ marginBottom: MOBILE ? 12 : 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.mt }}>{label.toUpperCase()}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.mt }}>Sort</span>
        <Pills quiet items={[["pos", "Position"], ["growth", "Growth"]]} value={by} onChange={setBy} label="Sort" />
      </div>
      {p && !MOBILE ? (
        // desktop: one slim row so Home fits on one screen
        <div onClick={() => setSel(p)} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, border: "1px solid #8a6d1d2e", background: "#f5c5420d", padding: "6px 10px", marginBottom: 6, cursor: "pointer", minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: pC(p.pos), borderRadius: 4, padding: "2px 6px" }}>{posTag(p)}</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "#fbbf24", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Age {p.age} · {(DEV_TRAITS[devOf(p)]?.name || "Normal")} · {p.labGains ? `+${p.labGains} OVR from the lab` : "in the lab this week"}</span>
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: oC(p.ovr) }}>{p.ovr}</span>
        </div>
      ) : p ? (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #8a6d1d2e", marginBottom: 6, cursor: "pointer" }} onClick={() => setSel(p)}>
          <div style={{ background: "linear-gradient(135deg,#0b1a3a,#13244a)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #dc26262e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>{initials(p.name)}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: pC(p.pos), borderRadius: 4, padding: "2px 7px" }}>{posTag(p)}</span>
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
      ) : !MOBILE ? null : (
        <div style={{ border: `1px dashed ${C.bd}`, borderRadius: 10, padding: "14px 12px", color: C.mt, fontSize: 13, marginBottom: 6 }}>Nobody in the lab. Pick a player below.</div>
      )}
      {MOBILE && <button onClick={() => setPicking(true)} style={{ width: "100%", minHeight: 46, background: C.bg, color: C.tx, border: "1px solid #ffffff10", borderRadius: 10, padding: "8px 12px", fontSize: 15, fontWeight: 700, textAlign: "left", cursor: "pointer" }}>{p ? `Change ${label.toLowerCase()} player ›` : `Choose ${label.toLowerCase()} player ›`}</button>}
      {MOBILE && picking && <Picker label={label} groups={by === "pos" ? groups : [["Fastest growers first", options]]} current={p?.id} onClose={() => setPicking(false)} onPick={(id) => { setFocus((f) => ({ ...f, [side]: id })); setPicking(false); }} />}
      {!MOBILE && <Select value={p?.id || ""} onChange={(e) => setFocus((f) => ({ ...f, [side]: e.target.value || null }))} aria-label={`${label} development focus`} style={{ width: "100%", background: C.bg, color: C.tx, border: "1px solid #ffffff10", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
        <option value="">— choose {label.toLowerCase()} —</option>
        {by === "pos" ? groups.map(([pos, list]) => <optgroup key={pos} label={pos}>{list.map(opt)}</optgroup>) : options.map(opt)}
      </Select>}
    </div>
  );
}

export default function DevFocusCard({ roster, focus, setFocus, setSel }) {
  if (MOBILE) return (
    <div>
      <FocusSlot label="Offense" side="off" players={roster.filter((p) => OFFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      <FocusSlot label="Defense" side="def" players={roster.filter((p) => DEFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.45, margin: "4px 2px 8px" }}>Each regular-season week a focused player can gain a point. Young players with a high development trait grow fastest.</div>
    </div>
  );
  return (
    <div style={{ background: C.cd, borderRadius: 8, padding: "12px 14px", border: "1px solid #ffffff10" }}>
      <div title="Each regular-season week a focused player can gain a point. Young + high development trait = faster gains." style={{ fontSize: 11, color: C.mt, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>DEVELOPMENT FOCUS{!MOBILE && <span style={{ letterSpacing: 0, fontWeight: 600, marginLeft: 6, cursor: "help" }}>ⓘ</span>}</div>
      <FocusSlot label="Offense" side="off" players={roster.filter((p) => OFFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      <FocusSlot label="Defense" side="def" players={roster.filter((p) => DEFENSE.includes(p.pos))} focus={focus} setFocus={setFocus} setSel={setSel} />
      {MOBILE && <div style={{ fontSize: 12, color: C.mt }}>Each regular-season week a focused player can gain a point. Young + high development trait = faster gains.</div>}
    </div>
  );
}
