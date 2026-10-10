// The depth chart drawn on a field: every starter where he lines up, offense (11 personnel),
// a 4-3 defense, and the kicker. Tap a spot to choose who starts there.
import React, { useState } from "react";
import { C, oC, pC, Btn, Face } from "./ui.jsx";
import { DL_SLOTS, slotKind, dlOvrAt, naturalDL } from "./dline.js";

export { STARTERS, byDepth, depthOrderFor, depthSlots } from "./depth.js";
import { STARTERS as STARTERS0, depthOrderFor } from "./depth.js";
import { retRating } from "./special.js";

// Kick and punt returners: any receiver, back or defensive back, rated as a returner.
const RET = { KR: "kick returner", PR: "punt returner" };
const STARTERS = { ...STARTERS0, KR: 1, PR: 1 };
const shown = (p, pos) => (RET[pos] ? retRating(p) : p.ovr);

// Spots on the field (x, y in % of the field). Offense drives up the screen; the defense faces it.
const SETS = {
  offense: {
    label: "Offense",
    los: 46,
    spots: [
      ["WR", 0, 5, 46], ["LT", 0, 33, 46], ["LG", 0, 41.5, 46], ["C", 0, 50, 46], ["RG", 0, 58.5, 46], ["RT", 0, 67, 46],
      ["TE", 0, 76, 47], ["WR", 2, 85, 55], ["WR", 1, 95, 46], ["QB", 0, 50, 64], ["RB", 0, 50, 82],
    ],
  },
  defense: {
    label: "Defense",
    los: 62,
    spots: [
      ["CB", 0, 6, 57], ["DL", 0, 37, 57], ["DL", 1, 45.5, 57], ["DL", 2, 54.5, 57], ["DL", 3, 63, 57], ["CB", 1, 94, 57],
      ["LB", 0, 30, 38], ["LB", 1, 50, 36], ["LB", 2, 70, 38], ["S", 0, 33, 14], ["S", 1, 67, 14],
    ],
  },
  special: { label: "Special teams", los: 46, spots: [["K", 0, 40, 70], ["P", 0, 60, 70], ["KR", 0, 35, 10], ["PR", 0, 65, 10]] },
};

function Field({ los, children }) {
  const lines = [];
  for (let i = 0; i <= 10; i++) lines.push(<div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i * 10}%`, borderTop: `1px solid rgba(255,255,255,${i % 2 ? 0.08 : 0.16})` }} />);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ position: "relative", minWidth: 640, aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", border: "2px solid #14532d", background: "repeating-linear-gradient(180deg,#166534 0 10%,#15803d 10% 20%)" }}>
        {lines}
        {[25, 75].map((x) => <div key={x} style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, borderLeft: "2px dashed rgba(255,255,255,0.12)" }} />)}
        <div title="Line of scrimmage" style={{ position: "absolute", left: 0, right: 0, top: `${los + 4.5}%`, borderTop: "2px solid #60a5fa" }} />
        {children}
      </div>
    </div>
  );
}

function Spot({ p: p0, pos, idx, x, y, on, onClick }) {
  const label = pos === "DL" ? DL_SLOTS[idx] : STARTERS[pos] > 1 ? `${pos}${idx + 1}` : pos;
  // A lineman shows his rating at this spot (edge or tackle).
  const p = p0 && pos === "DL" ? { ...p0, ovr: dlOvrAt(p0, slotKind(idx)) } : p0 && RET[pos] ? { ...p0, ovr: retRating(p0) } : p0;
  return (
    <button onClick={onClick} title={p ? `${label}: ${p.name} (${p.ovr})` : `${label}: empty`} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: 0, cursor: "pointer", padding: 0, width: 74 }}>
      <span style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: p ? "#0b1220" : "#0b122099", border: `3px solid ${on ? "#facc15" : p?.injured ? C.rd : pC(pos)}`, boxShadow: on ? "0 0 0 3px #facc1566" : "0 2px 6px #0008", color: p ? oC(p.ovr) : C.mt, fontWeight: 900, fontSize: 15 }}>{p ? p.ovr : "—"}</span>
      <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: pC(pos), borderRadius: 3, padding: "0 4px", lineHeight: "14px" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #000", maxWidth: 74, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p ? p.name.split(" ").slice(1).join(" ") || p.name : "Empty"}</span>
    </button>
  );
}

// Tackles and guards play either side: LT and RT share one pool, LG and RG another.
export const PARTNER = { LT: "RT", RT: "LT", LG: "RG", RG: "LG" };

// Corners and safeties can change position: a corner listed under a safety spot moves to safety
// (his rating is re-figured for the new spot) and starts there.
// Players from these positions can be moved into a spot (re-rated for it): corners and safeties,
// and tackles, guards and centers along the line (left/right swaps go through PARTNER instead).
const CROSS = { CB: ["S"], S: ["CB"], LT: ["LG", "RG", "C"], RT: ["LG", "RG", "C"], LG: ["LT", "RT", "C"], RG: ["LT", "RT", "C"], C: ["LG", "RG", "LT", "RT"] };

export default function DepthChart({ roster, depthOrder, setDepthOrder, setSel, onAutoFill, setPositions, snaps, setSnaps, onMovePos, previewPos }) {
  const [side, setSide] = useState("offense");
  const [pick, setPick] = useState(null); // [pos, idx]
  const set = SETS[side];
  const order = (pos) => depthOrderFor(roster, depthOrder, pos, snaps);
  // Choosing a starter here is your call: it clears snap shares you set at that position, so
  // the new order takes over.
  const clearSnaps = (...ps) => setSnaps && setSnaps((s) => { const n = { ...s }; for (const pos of ps) for (const p of roster) if (p.pos === pos) delete n[p.id]; return n; });
  const place = (pos, idx, player) => {
    const ids = order(pos).map((p) => p.id);
    const from = ids.indexOf(player.id);
    [ids[idx], ids[from]] = [ids[from], ids[idx]];
    setDepthOrder((d) => ({ ...d, [pos]: ids }));
    clearSnaps(pos);
  };
  // Start a lineman from the other side here: he flips over, and the starter he
  // replaces takes his old spot on the other side.
  const switchSide = (pos, player) => {
    const other = PARTNER[pos];
    const cur = order(pos)[0];
    const here = order(pos).map((p) => p.id).filter((id) => id !== cur?.id);
    const there = order(other).map((p) => (p.id === player.id ? cur?.id : p.id)).filter(Boolean);
    setPositions({ [player.id]: pos, ...(cur ? { [cur.id]: other } : {}) });
    setDepthOrder((d) => ({ ...d, [pos]: [player.id, ...here], [other]: there }));
    clearSnaps(pos, other);
  };
  // Move a corner to safety (or back) and start him at this spot.
  const moveIn = (pos, idx, player) => {
    const from = player.pos;
    onMovePos(player.id, pos);
    const ids = order(pos).map((p) => p.id);
    ids.splice(Math.min(idx, ids.length), 0, player.id);
    setDepthOrder((d) => ({ ...d, [pos]: ids, [from]: (d[from] || []).filter((id) => id !== player.id) }));
    clearSnaps(pos, from);
  };
  const rowLabel = (pos, i) => (pos === "DL" && i < 4 ? DL_SLOTS[i] : i < STARTERS[pos] ? (STARTERS[pos] > 1 ? `${pos}${i + 1}` : `${pos}1`) : `${pos} #${i + 1}`);
  // Everyone who could line up here: for tackles and guards, both sides of the line.
  const chosen = pick && [...order(pick[0]).map((p, i) => ({ p, at: pick[0], i })), ...(PARTNER[pick[0]] && setPositions ? order(PARTNER[pick[0]]).map((p, i) => ({ p, at: PARTNER[pick[0]], i })) : []),
    ...(CROSS[pick[0]] && onMovePos ? CROSS[pick[0]].flatMap((x) => order(x).map((p, i) => ({ p, at: x, i, move: true }))) : [])];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {Object.entries(SETS).map(([k, s]) => (
          <button key={k} onClick={() => { setSide(k); setPick(null); }} style={{ background: side === k ? C.bl : "transparent", color: side === k ? "#fff" : "#94a3b8", border: `1px solid ${side === k ? C.bl : C.bd}`, borderRadius: 6, padding: "6px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{s.label}</button>
        ))}
        <span style={{ marginLeft: "auto" }}><Btn onClick={onAutoFill} bg={`${C.gn}22`} c={C.gn} style={{ fontSize: 13 }}>Auto-fill by OVR</Btn></span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 560px", minWidth: 0 }}>
          <Field los={set.los}>
            {set.spots.map(([pos, idx, x, y]) => (
              <Spot key={`${pos}${idx}`} p={order(pos)[idx]} pos={pos} idx={idx} x={x} y={y} on={pick && pick[0] === pos && pick[1] === idx} onClick={() => setPick([pos, idx])} />
            ))}
          </Field>
          <div style={{ fontSize: 12, color: C.mt, marginTop: 6 }}>Tap a spot to choose who starts there. Red rings are injured starters.</div>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 0, background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 8, padding: 10 }}>
          {!pick ? (
            <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>Pick a spot on the field to see everyone at that position and change the starter.</div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{pick[0] === "DL" ? DL_SLOTS[pick[1]] : STARTERS[pick[0]] > 1 ? `${pick[0]}${pick[1] + 1}` : pick[0]} <span style={{ fontSize: 12, color: C.mt, fontWeight: 600 }}>· {pick[0] === "DL" ? (slotKind(pick[1]) === "EDGE" ? "edge rusher" : "defensive tackle") : RET[pick[0]] ? RET[pick[0]] : `${STARTERS[pick[0]]} starter${STARTERS[pick[0]] > 1 ? "s" : ""}`}</span></div>
              {!chosen.length && <div style={{ color: C.mt, fontSize: 13 }}>Nobody on the roster plays {pick[0]}.</div>}
              {PARTNER[pick[0]] && setPositions && <div style={{ fontSize: 12, color: C.mt, marginBottom: 4 }}>Tackles and guards play either side. Starting a {PARTNER[pick[0]]} here swaps the two.</div>}
              {RET[pick[0]] && <div style={{ fontSize: 12, color: C.mt, marginBottom: 4 }}>Any receiver, back or defensive back can return. The number is his return rating (speed, acceleration, agility and a knack for it). A great returner flips field position and breaks a long one now and then, and it doesn't have to be a starter: a fast backup is a weapon here.</div>}
              {pick[0] === "DL" && <div style={{ fontSize: 12, color: C.mt, marginBottom: 4 }}>Any lineman can play {slotKind(pick[1]) === "EDGE" ? "edge" : "tackle"} here. The number is his rating at this spot; edge rushers lose some inside and run stuffers lose some outside (his natural rating after the slash).</div>}
              {CROSS[pick[0]] && onMovePos && <div style={{ fontSize: 12, color: C.mt, marginBottom: 4 }}>{["CB", "S"].includes(pick[0]) ? "Corners and safeties can switch." : "Linemen can move along the line."} Moving a player here changes his position; the Move button shows his rating at {pick[0]}. Moving him back restores his old rating.</div>}
              {chosen.map(({ p, at, i, move }) => {
                const here = at === pick[0] && i === pick[1];
                const starter = i < STARTERS[at];
                return (
                  <div key={`${at}${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: `1px solid ${C.bd}`, background: here ? "#facc1514" : "transparent" }}>
                    <span style={{ width: 44, fontSize: 12, fontWeight: 800, color: starter ? C.gn : C.mt }}>{at === pick[0] && !starter ? `#${i + 1}` : rowLabel(at, i)}</span>
                    <Face s={p.face} sz={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => setSel(p)}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.mt }}>{RET[pick[0]] && <b style={{ marginRight: 4 }}>{p.pos} {p.ovr}</b>}{p.pos === "DL" && <b style={{ color: naturalDL(p) === "DT" ? "#fb923c" : "#f472b6", marginRight: 4 }}>{naturalDL(p)}</b>}Age {p.age}{p.injured ? <span style={{ color: C.rd, fontWeight: 700 }}> · injured</span> : ""}</div>
                    </div>
                    {(() => { const v = p.pos === "DL" && pick[0] === "DL" ? dlOvrAt(p, slotKind(pick[1])) : shown(p, pick[0]); return <b title={RET[pick[0]] ? `Return rating (${p.pos} ${p.ovr} OVR)` : v !== p.ovr ? `${p.ovr} at his natural spot` : undefined} style={{ fontSize: 16, color: oC(v), minWidth: 26, textAlign: "right" }}>{v}{v !== p.ovr && !RET[pick[0]] && <span style={{ fontSize: 10, color: C.mt, fontWeight: 600 }}> /{p.ovr}</span>}</b>; })()}
                    {move ? <Btn onClick={() => moveIn(pick[0], pick[1], p)} bg="#7c3aed" c="#ede9fe" style={{ fontSize: 11, padding: "3px 6px", width: 56 }} title={`Move him to ${pick[0]}: ${previewPos ? previewPos(p, pick[0]) : "?"} OVR there`}>Move {previewPos ? previewPos(p, pick[0]) : ""}</Btn>
                      : here ? <span style={{ fontSize: 11, color: "#facc15", fontWeight: 700, width: 56, textAlign: "center" }}>Here</span>
                      : <Btn onClick={() => (at === pick[0] ? place(pick[0], pick[1], p) : switchSide(pick[0], p))} bg={C.bl} style={{ fontSize: 11, padding: "3px 8px", width: 56 }}>Start</Btn>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
