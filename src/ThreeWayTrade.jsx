// The 3-way trade desk: a rotation. You send players to Team B, Team B sends players to Team C,
// and Team C sends players to you. Each club has to get back about as much value as it gives
// (within 10%), and the trade deadline applies.
import React, { useState } from "react";
import Select from "./Select.jsx";
import { C, Btn, Bdg, oC } from "./ui.jsx";
import { executeLegs } from "./tradeExec.js";
import { posTag } from "./dline.js";

const value = (ps) => ps.reduce((s, p) => s + (p.tradeVal || 0), 0);

// closed: the deadline has passed. onDone(teams, logLine): the trade went through.
export default function ThreeWayTrade({ teams, ui, closed, ctx, mobile, sm, onDone, onCancel }) {
  const [b, setB] = useState(-1);
  const [c, setC] = useState(-1);
  const [sel, setSel] = useState({ you: [], b: [], c: [] }); // you → B, B → C, C → you
  const toggle = (k, p) => setSel((s) => ({ ...s, [k]: s[k].some((x) => x.id === p.id) ? s[k].filter((x) => x.id !== p.id) : [...s[k], p] }));
  const cols = [
    { k: "you", lbl: "YOU (send to B)", id: ui, clr: C.gn },
    { k: "b", lbl: "TEAM B (sends to C)", id: b, clr: "#38bdf8", set: (v) => { setB(v); setSel((s) => ({ ...s, b: [] })); } },
    { k: "c", lbl: "TEAM C (sends to you)", id: c, clr: "#f59e0b", set: (v) => { setC(v); setSel((s) => ({ ...s, c: [] })); } },
  ];
  const names = (ps) => ps.map((p) => p.name).join(", ");

  const execute = () => {
    if (b < 0 || c < 0 || b === c) return sm("Pick two different clubs for B and C");
    if (closed) return sm("Trade deadline passed — Week 10!");
    if (!sel.you.length || !sel.b.length || !sel.c.length) return sm("Each club has to send at least one player");
    if (value(sel.you) < value(sel.b) * 0.9) return sm(`${teams[b].name} want more for what they send`);
    if (value(sel.b) < value(sel.c) * 0.9) return sm(`${teams[c].name} want more for what they send`);
    const r = executeLegs(teams, [{ from: ui, to: b, players: sel.you }, { from: b, to: c, players: sel.b }, { from: c, to: ui, players: sel.c }], ctx);
    if (r.error) { sm(r.error); setSel({ you: [], b: [], c: [] }); return; }
    const t = r.teams;
    onDone(t, `3-WAY TRADE: ${t[ui].ab} → ${t[b].ab}: ${names(sel.you)} · ${t[b].ab} → ${t[c].ab}: ${names(sel.b)} · ${t[c].ab} → ${t[ui].ab}: ${names(sel.c)}`);
    sm("3-Way trade executed!");
  };

  return (
    <div style={{ background: "#ffffff0d", borderRadius: 18, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ fontSize: 15, color: C.mt, marginBottom: 10 }}>Three clubs, one deal: you send to team B, team B sends to team C, and team C sends to you. Each club has to get back about as much value as it gives.</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {cols.map(({ k, lbl, id, clr, set }) => (
          <div key={k} style={{ flex: mobile ? "1 1 100%" : "1 1 200px", minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: clr, marginBottom: 5 }}>{lbl}</div>
            {set && (
              <Select value={id} onChange={(e) => set(+e.target.value)} style={{ width: "100%", fontSize: 14, padding: "7px 10px", marginBottom: 6 }}>
                <option value={-1}>— Select Team —</option>
                {teams.filter((t) => t.id !== ui).map((t) => <option key={t.id} value={t.id}>{t.ab} {t.name}</option>)}
              </Select>
            )}
            {id >= 0 && (
              <div style={{ maxHeight: mobile ? 230 : 200, overflowY: "auto", border: 0, borderRadius: 12, background: "#ffffff08" }}>
                {(teams[id]?.roster || []).filter((p) => p.ovr >= 65).sort((a, z) => z.ovr - a.ovr).slice(0, 20).map((p) => {
                  const on = sel[k].some((x) => x.id === p.id);
                  return (
                    <div key={p.id} onClick={() => toggle(k, p)} style={{ display: "flex", alignItems: "center", gap: 8, padding: mobile ? "9px 10px" : "6px 9px", fontSize: 14, cursor: "pointer", borderBottom: `1px solid ${C.bd}55`, background: on ? `${clr}26` : "transparent" }}>
                      <input type="checkbox" readOnly checked={on} style={{ width: 17, height: 17, accentColor: clr, pointerEvents: "none" }} />
                      <Bdg pos={posTag(p)} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: oC(p.ovr), fontWeight: 800 }}>{p.ovr}</span>
                      <span style={{ color: "#fbbf24", fontSize: 12, width: 30, textAlign: "right" }}>{p.tradeVal}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ background: "#0a0f1a", borderRadius: 8, padding: "9px 11px", fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
        {sel.you.length > 0 && <div style={{ color: C.gn, marginBottom: 2 }}>YOU → B: {names(sel.you)}</div>}
        {sel.b.length > 0 && <div style={{ color: "#38bdf8", marginBottom: 2 }}>B → C: {names(sel.b)}</div>}
        {sel.c.length > 0 && <div style={{ color: "#f59e0b" }}>C → YOU: {names(sel.c)}</div>}
        <div style={{ color: C.mt, marginTop: 2 }}>Each club has to get back about as much value as it gives.</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn style={{ flex: 1, fontSize: 15, padding: "10px 14px" }} onClick={execute} bg={C.gn}>Execute Trade</Btn>
        <Btn style={{ fontSize: 15, padding: "10px 14px" }} onClick={onCancel} bg={C.bd}>Cancel</Btn>
      </div>
    </div>
  );
}
