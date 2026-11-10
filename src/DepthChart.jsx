// The depth chart drawn on a field: every starter where he lines up, the offense in the personnel
// grouping you pick to look at (11, 12, 21...), the defense with its SAM, MIKE and WILL and the
// nickel back, and the kicker. Tap a spot to choose who starts there.
import React, { useState } from "react";
import { C, oC, pC, Btn, Face, Segments, Sheet, Row, Chips, quietPill } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { DL_SLOTS, slotKind, dlOvrAt, naturalDL, posTag } from "./dline.js";

export { STARTERS, byDepth, depthOrderFor, depthSlots } from "./depth.js";
import { STARTERS as STARTERS0, depthOrderFor } from "./depth.js";
import { retRating } from "./special.js";
import { positionSnaps, snapBudget } from "./snaps.js";
import { ROLE_SLOTS, roleOvr, naturalRole, ROLE_WANTS, ROLE_NAME, roleKind } from "./roles.js";
import { pickFB } from "./gamesim.js";
import { viewFor, DEF_SETS } from "./personnel.js";

// The field view opens on what your team lines up in most (viewFor) and keeps the grouping you
// last looked at until you change your identity or lean in Strategy.
let VIEW = { key: null, form: "11", pkg: "nickel" };

// Kick and punt returners: any receiver, back or defensive back, rated as a returner.
const RET = { KR: "kick returner", PR: "punt returner" };
const STARTERS = { ...STARTERS0, KR: 1, PR: 1 };
const shown = (p, pos) => (RET[pos] ? retRating(p) : p.ovr);

// Spots on the field (x, y in % of the field). Offense drives up the screen; the defense faces it.
// A spot (circle, badge and name) is about 68px tall, so spots in the same column sit at least
// 17% apart and keep clear of the edges; every grouping and package is laid out that way.
const LINE = [["LT", 0, 33, 36], ["LG", 0, 41.5, 36], ["C", 0, 50, 36], ["RG", 0, 58.5, 36], ["RT", 0, 67, 36]];
// The offense in each personnel grouping (FB: the back the fullback role goes to).
const FORMS = {
  11: [["WR", 0, 5, 36], ["TE", 0, 77, 37], ["WR", 2, 86, 53], ["WR", 1, 95, 36], ["QB", 0, 50, 55], ["RB", 0, 63, 55]],
  12: [["WR", 0, 5, 36], ["TE", 1, 23, 37], ["TE", 0, 77, 37], ["WR", 1, 95, 36], ["QB", 0, 50, 55], ["RB", 0, 63, 55]],
  21: [["WR", 0, 5, 36], ["TE", 0, 77, 37], ["WR", 1, 95, 36], ["QB", 0, 50, 54], ["FB", 0, 40, 71], ["RB", 0, 50, 88]],
  10: [["WR", 0, 5, 36], ["WR", 3, 15, 53], ["WR", 2, 85, 53], ["WR", 1, 95, 36], ["QB", 0, 50, 55], ["RB", 0, 63, 55]],
  13: [["WR", 0, 5, 36], ["TE", 1, 23, 37], ["TE", 0, 77, 37], ["TE", 2, 86, 53], ["QB", 0, 50, 55], ["RB", 0, 63, 55]],
};
// The defense in each package: base (3 linebackers), nickel (the SAM off, a nickel back on), dime
// (one linebacker, two extra defensive backs). The front four, the outside corners and the safeties
// are the same in all three.
const DEF_CORE = [["CB", 0, 6, 62], ["DL", 0, 35, 62], ["DL", 1, 45, 62], ["DL", 2, 55, 62], ["DL", 3, 65, 62], ["CB", 1, 94, 62], ["S", 0, 46, 13], ["S", 1, 74, 27]]; // FS deep in the middle, SS rolled down on the strong (SAM) side
const DEF_FORMS = {
  base: [["LB", 0, 70, 39], ["LB", 1, 50, 37], ["LB", 2, 30, 39]],
  nickel: [["LB", 1, 58, 38], ["LB", 2, 38, 38], ["CB", 2, 82, 44]],
  dime: [["LB", 1, 50, 38], ["CB", 2, 82, 44], ["CB", 3, 18, 44]],
};
const SETS = {
  offense: { label: "Offense", los: 36, spots: [...FORMS[11], ...LINE] },
  defense: { label: "Defense", los: 62, spots: [...DEF_CORE, ...DEF_FORMS.base, ["CB", 2, 82, 44]] },
  special: { label: "Special teams", los: 46, spots: [["K", 0, 40, 70], ["P", 0, 60, 70], ["KR", 0, 35, 18], ["PR", 0, 65, 18]] },
};

// "Michael Schmidt Jr" -> "Schmidt": the name that fits under a spot
// "John Michael Schmitz Jr" -> "Schmitz", but "Amon-Ra St. Brown" -> "St. Brown"
const lastName = (n) => { const w = String(n || "").split(" ").filter((x) => !/^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(x)); if (w.length < 2) return w[0] || ""; const k = w.length - 2; return k >= 1 && /^(st\.?|de|del|la|le|van|von|da|di)$/i.test(w[k]) ? w.slice(k).join(" ") : w[w.length - 1]; };
const narrow = () => typeof window !== "undefined" && window.innerWidth < 700;
function Field({ los, children }) {
  const lines = [];
  for (let i = 0; i <= 10; i++) lines.push(<div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i * 10}%`, borderTop: `1px solid rgba(255,255,255,${i % 2 ? 0.08 : 0.16})` }} />);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 540, margin: "0 auto", minWidth: narrow() ? 340 : 0, aspectRatio: MOBILE ? "1 / 0.84" : narrow() ? "1 / 1.08" : "16 / 11", borderRadius: 10, overflow: "hidden", border: "1px solid #14532d2e", background: "repeating-linear-gradient(180deg,#166534 0 10%,#15803d 10% 20%)" }}>
        {lines}
        {[25, 75].map((x) => <div key={x} style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, borderLeft: "2px dashed rgba(255,255,255,0.12)" }} />)}
        <div title="Line of scrimmage" style={{ position: "absolute", left: 0, right: 0, top: `${los + 4.5}%`, borderTop: "2px solid #60a5fa" }} />
        {children}
      </div>
    </div>
  );
}

// The name of a spot: LE/DT1, SAM/MIKE/WILL, CB1/CB2/NB, X/Z/SLOT, else WR4, TE2...
export const spotName = (pos, idx) => (pos === "DL" && idx < 4 ? DL_SLOTS[idx] : ROLE_SLOTS[pos]?.[idx] ? ROLE_SLOTS[pos][idx] : pos === "FB" ? "FB" : STARTERS[pos] > 1 || idx > 0 ? `${pos}${idx + 1}` : pos);
// His rating at a spot: linemen as edge or tackle, linebackers, corners and receivers at their role.
export const spotOvr = (p, pos, idx) => (!p ? null : pos === "DL" && idx < 4 ? dlOvrAt(p, slotKind(idx)) : ROLE_SLOTS[pos]?.[idx] ? roleOvr(p, ROLE_SLOTS[pos][idx]) : RET[pos] ? retRating(p) : p.ovr);
function Spot({ p: p0, pos, idx, x, y, on, onClick }) {
  const sm = narrow();
  const label = spotName(pos, idx);
  const p = p0 ? { ...p0, ovr: spotOvr(p0, pos, idx) } : p0;
  return (
    <button onClick={onClick} title={p ? `${label}: ${p.name} (${p.ovr})` : `${label}: empty`} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: 0, cursor: "pointer", padding: 0, width: sm ? 52 : 70 }}>
      <span style={{ width: sm ? 30 : 36, height: sm ? 30 : 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: p ? "#0b1220" : "#0b122099", border: `3px solid ${on ? "#facc15" : p?.injured ? C.rd : pC(pos)}`, boxShadow: on ? "0 0 0 3px #facc1566" : "0 2px 6px #0008", color: p ? oC(p.ovr) : C.mt, fontWeight: 900, fontSize: sm ? 12 : 14 }}>{p ? p.ovr : "—"}</span>
      <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: pC(pos), borderRadius: 3, padding: "0 4px", lineHeight: "14px" }}>{label}</span>
      {!(sm && ["LT", "LG", "C", "RG", "RT", "DL"].includes(pos)) && <span style={{ fontSize: sm ? 9 : ["LT", "LG", "C", "RG", "RT"].includes(pos) ? 10 : 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #000", maxWidth: sm ? 52 : ["LT", "LG", "C", "RG", "RT"].includes(pos) ? 46 : 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p ? lastName(p.name) : "Empty"}</span>}
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

export default function DepthChart({ roster, depthOrder, setDepthOrder, setSel, onAutoFill, setPositions, snaps, setSnaps, onMovePos, previewPos, gamePlan, shape, personnel, team, onList, viewToggle }) {
  const leanKey = `${team?.personnel || "auto"}|${team?.defPkg || "auto"}|${team?.coach?.oc?.scheme}|${team?.coach?.dc?.scheme}`;
  if (VIEW.key !== leanKey) VIEW = { key: leanKey, ...viewFor(team) };
  const [side, setSide] = useState("offense");
  const [pick, setPick] = useState(null); // [pos, idx]
  const [opts, setOpts] = useState(false); // phones: the ⋯ sheet (auto-fill, formation, game plan)
  const [form, setForm0] = useState(VIEW.form);
  const setForm = (k) => { VIEW.form = k; setForm0(k); }; // the personnel grouping the offense field shows
  const set0 = SETS[side] || SETS.offense;
  const [pkg, setPkg0] = useState(VIEW.pkg);
  const setPkg = (k) => { VIEW.pkg = k; setPkg0(k); };
  // you changed your identity or lean in Strategy (or a coordinator changed): show that
  const [vk, setVk] = useState(leanKey);
  if (vk !== leanKey) { setVk(leanKey); setForm0(VIEW.form); setPkg0(VIEW.pkg); } // the package the defense field shows
  const set = side === "offense" ? { ...set0, spots: [...FORMS[form], ...LINE] } : side === "defense" ? { ...set0, spots: [...DEF_CORE, ...DEF_FORMS[pkg]] } : set0;
  // snap shares at a position, the way game day will hand them out (your personnel decides the shape)
  const shares = (pos) => positionSnaps(pos, depthList(pos).filter((p) => !p.injured), snaps || {}, shape);
  const setShare = (pos, p, v) => { if (!setSnaps) return; const others = depthList(pos).filter((x) => x.id !== p.id && !x.injured && snaps?.[x.id] != null).reduce((t, x) => t + snaps[x.id], 0); setSnaps((sn) => ({ ...sn, [p.id]: Math.max(0, Math.min(v, 100, snapBudget(pos, shape) - others)) })); };
  const resetShares = (pos) => clearSnaps(pos);
  const sidePositions = [...new Set(set.spots.map(([pos]) => (pos === "FB" ? "RB" : pos)))];
  const order0 = (pos) => depthOrderFor(roster, depthOrder, pos, snaps);
  // the fullback spot shows the back the 21 grouping would use
  const order = (pos) => { if (pos !== "FB") return order0(pos); const rb = order0("RB"), fb = pickFB(rb.slice(1)); return fb ? [fb] : []; };
  // The pick list keeps the depth chart's order while you drag a snap slider (the list view does the
  // same): ordered by snaps, the rows re-sorted under your finger and the slider jumped to someone else.
  const depthList = (pos) => depthOrderFor(roster, depthOrder, pos);
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
  const rowLabel = (pos, i) => (pos === "DL" && i < 4 ? DL_SLOTS[i] : ROLE_SLOTS[pos]?.[i] ? ROLE_SLOTS[pos][i] : i < STARTERS[pos] ? (STARTERS[pos] > 1 ? `${pos}${i + 1}` : `${pos}1`) : `${pos} #${i + 1}`);
  // Everyone who could line up here: for tackles and guards, both sides of the line.
  // who's in the spot you opened (fixed when you open it, so dragging a slider doesn't move "Here")
  const pickedRef = React.useRef(null);
  if (!pick) pickedRef.current = null;
  else if (!pickedRef.current || pickedRef.current.key !== `${pick[0]}:${pick[1]}`) pickedRef.current = { key: `${pick[0]}:${pick[1]}`, id: order(pick[0])[pick[1]]?.id };
  const pickedId = pickedRef.current?.id;
  // who starts on game day (snap shares included), for the row labels
  const startsNow = (at) => new Set(order(at).slice(0, STARTERS[at] || 1).map((p) => p.id));
  const chosen = pick && [...depthList(pick[0]).map((p, i) => ({ p, at: pick[0], i })), ...(PARTNER[pick[0]] && setPositions ? order(PARTNER[pick[0]]).map((p, i) => ({ p, at: PARTNER[pick[0]], i })) : []),
    ...(CROSS[pick[0]] && onMovePos ? CROSS[pick[0]].flatMap((x) => order(x).map((p, i) => ({ p, at: x, i, move: true }))) : []),
    // tight ends can split out to receiver (and come back): a lineup choice, not a position change
    ...(pick[0] === "WR" ? order0("TE").map((p, i) => ({ p, at: "TE", i, wide: true })) : []),
    ...(pick[0] === "TE" ? order0("WR").filter((p) => p.pos === "TE").map((p) => ({ p, at: "WR", i: order0("WR").indexOf(p), back: true })) : [])];
  // Split a tight end out to this receiver spot; the receiver there moves down one.
  const splitOut = (idx, player) => {
    const ids = order0("WR").map((p) => p.id);
    ids.splice(Math.min(idx, ids.length), 0, player.id);
    setDepthOrder((d) => ({ ...d, WR: ids, TE: (d.TE || []).filter((id) => id !== player.id) }));
    clearSnaps("WR", "TE");
  };
  // Bring a split-out tight end back to the tight end spot.
  const backToTE = (idx, player) => {
    const ids = order0("TE").map((p) => p.id);
    ids.splice(Math.min(idx, ids.length), 0, player.id);
    setDepthOrder((d) => ({ ...d, WR: order0("WR").map((p) => p.id).filter((id) => id !== player.id), TE: ids }));
    clearSnaps("WR", "TE");
  };
  const pickView = pick ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{spotName(pick[0], pick[1])} <span style={{ fontSize: 12, color: C.mt, fontWeight: 600 }}>· {pick[0] === "DL" ? (slotKind(pick[1]) === "EDGE" ? "edge rusher" : "defensive tackle") : ROLE_SLOTS[pick[0]]?.[pick[1]] ? ROLE_NAME[ROLE_SLOTS[pick[0]][pick[1]]] : RET[pick[0]] ? RET[pick[0]] : `${STARTERS[pick[0]]} starter${STARTERS[pick[0]] > 1 ? "s" : ""}`}</span></div>
              {ROLE_SLOTS[pick[0]]?.[pick[1]] && <div style={{ fontSize: 12, color: "#cbd5e1", background: C.bg, borderRadius: 6, padding: "5px 8px", marginBottom: 6, lineHeight: 1.4 }}><b style={{ color: C.gd }}>Wants:</b> {ROLE_WANTS[roleKind(ROLE_SLOTS[pick[0]][pick[1]])]} The number is each player's rating here (his natural rating after the slash; ★ = his natural role).{pick[0] === "LB" && pick[1] === 0 ? " Plays in base only (against two tight ends or a fullback)." : pick[0] === "CB" && pick[1] === 2 ? " Plays in nickel and dime: most of the snaps in today's NFL." : pick[0] === "CB" && pick[1] === 0 ? " Follows the other team's best outside receiver." : ""}</div>}
              {!chosen.length && <div style={{ color: C.mt, fontSize: 13 }}>Nobody on the roster plays {pick[0]}.</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px", flexWrap: "wrap" }}>
                <button onClick={() => setPick(null)} style={{ background: "transparent", border: 0, color: "#7dd3fc", fontSize: 13, cursor: "pointer", padding: 0 }}>← All positions</button>
                {!RET[pick[0]] && setSnaps && order(pick[0]).some((p) => snaps?.[p.id] != null) && <button onClick={() => resetShares(pick[0])} style={{ background: "transparent", border: "1px solid #ffffff10", color: "#cbd5e1", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>Reset snaps to auto</button>}
                <details style={{ marginLeft: "auto", fontSize: 12, color: C.mt }}><summary style={{ cursor: "pointer", color: "#94a3b8" }}>How this works</summary><div style={{ marginTop: 4, maxWidth: 420 }}>
              {PARTNER[pick[0]] && setPositions && <div style={{ marginBottom: 4 }}>Tackles and guards play either side. Starting a {PARTNER[pick[0]]} here swaps the two.</div>}
              {RET[pick[0]] && <div style={{ marginBottom: 4 }}>Any receiver, back or defensive back can return. The number is his return rating (speed, acceleration, agility and a knack for it). A great returner flips field position and breaks a long one now and then, and it doesn't have to be a starter: a fast backup is a weapon here.</div>}
              {pick[0] === "DL" && <div style={{ marginBottom: 4 }}>Any lineman can play {slotKind(pick[1]) === "EDGE" ? "edge" : "tackle"} here. The number is his rating at this spot; edge rushers lose some inside and run stuffers lose some outside (his natural rating after the slash).</div>}
              {CROSS[pick[0]] && onMovePos && <div style={{ marginBottom: 4 }}>{["CB", "S"].includes(pick[0]) ? "Corners and safeties can switch." : "Linemen can move along the line."} Moving a player here changes his position; the Move button shows his rating at {pick[0]}. Moving him back restores his old rating.</div>}
                  {!RET[pick[0]] && setSnaps && <div>Snap shares fill by depth on their own; drag a slider to set one yourself (it turns yellow).</div>}
                </div></details>
              </div>
              {chosen.map(({ p, at, i, move, wide, back }) => {
                const here = at === pick[0] && p.id === pickedId;
                const starter = startsNow(at).has(p.id);
                return (
                  <React.Fragment key={`${at}${p.id}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 4px", borderBottom: `1px solid ${C.bd}`, background: here ? "#facc1514" : "transparent", flexWrap: "wrap" }}>
                    <span style={{ width: 40, fontSize: 12, fontWeight: 800, color: starter ? C.gn : C.mt }}>{at === pick[0] && !starter ? `#${i + 1}` : rowLabel(at, i)}</span>
                    <Face s={p.face} sz={22} />
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onClick={() => setSel(p)}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.mt }}>{RET[pick[0]] && <b style={{ marginRight: 4 }}>{posTag(p)} {p.ovr}</b>}{!RET[pick[0]] && p.pos === "TE" && pick[0] === "WR" && <b style={{ color: "#67e8f9", marginRight: 4 }}>TE {p.ovr}{at === "WR" ? " · split out" : ""}</b>}{back && <b style={{ color: "#67e8f9", marginRight: 4 }}>playing WR</b>}{p.pos === "DL" && <b style={{ color: naturalDL(p) === "DT" ? "#fb923c" : "#f472b6", marginRight: 4 }}>{naturalDL(p)}</b>}{ROLE_SLOTS[p.pos] && p.posAttrs && <b style={{ color: "#a5b4fc", marginRight: 4 }}>{({ OUT: "OUTSIDE", NB: "NICKEL" })[naturalRole(p)] || naturalRole(p)}{ROLE_SLOTS[pick[0]]?.[pick[1]] && roleKind(ROLE_SLOTS[pick[0]][pick[1]]) === naturalRole(p) ? " ★" : ""}</b>}Age {p.age}{p.injured ? <span style={{ color: C.rd, fontWeight: 700 }}> · injured</span> : ""}</div>
                    </div>
                    {(() => { const v = (p.pos === pick[0] || (pick[0] === "WR" && p.pos === "TE" && !back)) && (pick[0] === "DL" || ROLE_SLOTS[pick[0]]) ? spotOvr(p, pick[0], pick[1]) : shown(p, pick[0]); return <b title={RET[pick[0]] ? `Return rating (${posTag(p)} ${p.ovr} OVR)` : v !== p.ovr ? `${p.ovr} at his natural spot` : undefined} style={{ fontSize: 16, color: oC(v), minWidth: 26, textAlign: "right" }}>{v}{v !== p.ovr && !RET[pick[0]] && <span style={{ fontSize: 10, color: C.mt, fontWeight: 600 }}> /{p.ovr}</span>}</b>; })()}
                    {at === pick[0] && !RET[pick[0]] && setSnaps && !p.injured && (() => { const v = shares(pick[0])[p.id] ?? 0; const set_ = snaps?.[p.id] != null; return (
                      <span title={set_ ? "Snap share you set" : "Snap share (automatic, by depth)"} style={{ display: "inline-flex", alignItems: "center", gap: 4, width: 128 }}>
                        <input type="range" min={0} max={100} step={5} value={v} onChange={(e) => setShare(pick[0], p, +e.target.value)} aria-label={`${p.name} snap share`} style={{ width: 84, accentColor: v >= 70 ? C.gn : v >= 30 ? "#f59e0b" : "#64748b" }} />
                        <span style={{ fontSize: 12, fontWeight: 800, minWidth: 34, textAlign: "right", color: set_ ? "#fde68a" : "#cbd5e1" }}>{v}%</span>
                      </span>); })()}
                    {wide ? <Btn onClick={() => splitOut(pick[1], p)} bg="#0e7490" c="#cffafe" style={{ fontSize: 11, padding: "3px 6px", width: 56 }} title={`Split him out wide: ${spotOvr(p, "WR", pick[1])} at ${spotName("WR", pick[1])} (he leaves the tight end chart until you move him back)`}>Split {spotOvr(p, "WR", pick[1])}</Btn>
                      : back ? <Btn onClick={() => backToTE(pick[1], p)} bg="#0e7490" c="#cffafe" style={{ fontSize: 11, padding: "3px 6px", width: 56 }} title="Bring him back in as a tight end">Back TE</Btn>
                      : move ? <Btn onClick={() => moveIn(pick[0], pick[1], p)} bg="#7c3aed" c="#ede9fe" style={{ fontSize: 11, padding: "3px 6px", width: 56 }} title={`Move him to ${pick[0]}: ${previewPos ? previewPos(p, pick[0]) : "?"} OVR there`}>Move {previewPos ? previewPos(p, pick[0]) : ""}</Btn>
                      : here ? <span style={{ fontSize: 11, color: "#facc15", fontWeight: 700, width: 56, textAlign: "center" }}>Here</span>
                      : <Btn onClick={() => (at === pick[0] ? place(pick[0], pick[1], p) : switchSide(pick[0], p))} bg={C.bl} style={{ fontSize: 11, padding: "3px 8px", width: 56 }}>Start</Btn>}
                  </div>
                  </React.Fragment>
                );
              })}
            </>
  ) : null;
  return (
    <div>
      {MOBILE && <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}><Segments items={Object.entries(SETS).map(([k, st]) => [k, st.label])} value={side} onChange={(k) => { setSide(k); setPick(null); }} /></div>
        <button onClick={() => setOpts(true)} aria-label="Depth chart options" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: 0, background: "#ffffff0f", color: "#e2e8f0", fontSize: 20, fontWeight: 900, cursor: "pointer" }}>⋯</button>
      </div>}
      {!MOBILE && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <Chips items={Object.entries(SETS).map(([k, st]) => [k, st.label])} value={side} onChange={(k) => { setSide(k); setPick(null); }} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>{viewToggle}<button onClick={onAutoFill} style={{ minHeight: 38, borderRadius: 999, border: 0, padding: "0 16px", background: "#ffffff12", color: "#e2e8f0", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Auto-fill by overall</button></span>
      </div>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 480px", minWidth: 0, maxWidth: 640 }}>
          {side === "offense" && !MOBILE && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.mt, marginRight: 2 }}>Personnel</span>
            {Object.keys(FORMS).map((k) => <button key={k} onClick={() => { setForm(k); setPick(null); }} title={{ 11: "1 back, 1 tight end, 3 receivers", 12: "1 back, 2 tight ends, 2 receivers", 21: "2 backs (a fullback), 1 tight end, 2 receivers", 10: "1 back, 4 receivers", 13: "1 back, 3 tight ends, 1 receiver" }[k]} style={quietPill(form === k)}>{k}</button>)}
            {personnel && <span style={{ marginLeft: "auto", fontSize: 12, color: C.mt }}>Your identity: <b style={{ color: "#e2e8f0" }}>{personnel}</b></span>}
          </div>}
          {side === "defense" && !MOBILE && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.mt, marginRight: 2 }}>Package</span>
            {Object.keys(DEF_FORMS).map((k) => <button key={k} onClick={() => { setPkg(k); setPick(null); }} title={{ base: "3 linebackers: against heavy sets", nickel: "2 linebackers and a nickel back: against 3 receivers", dime: "1 linebacker and 2 extra defensive backs: passing downs" }[k]} style={{ ...quietPill(pkg === k), textTransform: "capitalize" }}>{k}</button>)}
            {team && <span style={{ marginLeft: "auto", fontSize: 12, color: C.mt }}>Your lean: <b style={{ color: "#e2e8f0" }}>{(DEF_SETS.find((d) => d.key === (team.defPkg || "auto")) || DEF_SETS[0]).label}</b></span>}
          </div>}
          <Field los={set.los}>
            {set.spots.map(([pos, idx, x, y]) => (
              <Spot key={`${pos}${idx}`} p={order(pos)[idx]} pos={pos} idx={idx} x={x} y={y} on={pick && pick[0] === pos && pick[1] === idx} onClick={() => setPick(pos === "FB" ? ["RB", Math.max(1, order0("RB").indexOf(order("FB")[0]))] : [pos, idx])} />
            ))}
          </Field>
          {!MOBILE && <div style={{ fontSize: 12, color: C.mt, marginTop: 6, textAlign: "center" }}>{side === "defense" ? "The SAM plays in base (against heavy sets), the nickel back (NB) in nickel and dime. " : ""}Tap a spot to change the starter and set snap shares. Red rings are injured starters.</div>}
        </div>
        <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: MOBILE ? "#ffffff0f" : "#111827", borderRadius: MOBILE ? 18 : 20, padding: MOBILE ? "12px 14px" : "14px 16px" }}>
          {!pick || MOBILE ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Who plays</div>
              {sidePositions.map((pos) => {
                const o = order(pos), sh = RET[pos] ? {} : shares(pos), n = STARTERS[pos] || 1;
                const rot = o.filter((p, i) => i >= n && (sh[p.id] || 0) > 0);
                return (
                  <button key={pos} onClick={() => setPick([pos, 0])} style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "flex-start", gap: 8, padding: "8px 4px", background: "transparent", border: 0, borderBottom: "1px solid #ffffff0f", color: C.tx, cursor: "pointer" }}>
                    <span style={{ minWidth: 30, fontSize: 11, fontWeight: 900, color: "#fff", background: pC(pos === "KR" || pos === "PR" ? "WR" : pos), borderRadius: 4, textAlign: "center", padding: "1px 0" }}>{pos}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                      {o.slice(0, n).map((p, i) => <span key={p.id} style={{ display: "inline-block", marginRight: 8, color: p.injured ? C.rd : "#e2e8f0", fontWeight: 700 }}>{(ROLE_SLOTS[pos] || pos === "DL") && <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, marginRight: 3 }}>{spotName(pos, i)}</span>}{lastName(p.name)} <span style={{ color: oC(spotOvr(p, pos, i)) }}>{spotOvr(p, pos, i)}</span>{!RET[pos] && <span style={{ color: C.mt, fontWeight: 600 }}> {sh[p.id] ?? 0}%</span>}</span>)}
                      {rot.length > 0 && <span style={{ display: "block", fontSize: 12, color: C.mt }}>Rotation: {rot.map((p) => `${lastName(p.name)} ${sh[p.id]}%`).join(" · ")}</span>}
                    </span>
                  </button>
                );
              })}
            </>
          ) : pickView}
        </div>
        {/* the schemes and personnel sit beside the field, under the players they're built for */}
        {gamePlan && !MOBILE && gamePlan}
        </div>
      </div>
      {MOBILE && pick && <Sheet onClose={() => setPick(null)}>{pickView}<div style={{ height: 8 }} /></Sheet>}
      {MOBILE && opts && (
        <Sheet title="Depth chart options" onClose={() => setOpts(false)}>
          <Row first label="Auto-fill by overall" onClick={() => { onAutoFill(); setOpts(false); }} />
          {onList && <Row label="Show as a list" onClick={() => { setOpts(false); onList(); }} />}
          {side === "offense" && <><div style={{fontSize: 13, fontWeight: 800, color: C.mt, margin: "14px 2px 6px" }}>Formation on the field{personnel ? ` · YOUR IDENTITY: ${personnel.toUpperCase()}` : ""}</div><Segments items={Object.keys(FORMS).map((k) => [k, k])} value={form} onChange={(k) => { setForm(k); setPick(null); }} /></>}
          {side === "defense" && <><div style={{fontSize: 13, fontWeight: 800, color: C.mt, margin: "14px 2px 6px" }}>Package on the field</div><Segments items={Object.keys(DEF_FORMS).map((k) => [k, k[0].toUpperCase() + k.slice(1)])} value={pkg} onChange={(k) => { setPkg(k); setPick(null); }} /></>}
          {gamePlan && <div style={{ marginTop: 10 }}>{gamePlan}</div>}
          <div style={{ height: 8 }} />
        </Sheet>
      )}
    </div>
  );
}
