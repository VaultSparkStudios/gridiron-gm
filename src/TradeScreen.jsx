// The trade screen, laid out like the original Gridiron GM: pick a team, tick players and
// picks on two big roster tables, and the summary tells you plainly whether they'd take it.
import React, { useState } from "react";
import { C, oC, Bdg, Btn, Face, TeamLogo } from "./ui.jsx";
import { deadMoney, proration } from "./bonus.js";

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const sel = { background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "8px 10px", fontSize: 15 };

function Side({ title, color, team, players, picks, chosen, chosenPk, toggle, togglePk, pickVal, setSel }) {
  const [pos, setPos] = useState("ALL");
  const rows = [...(players || [])].filter((p) => pos === "ALL" || p.pos === pos).sort((a, b) => b.ovr - a.ovr);
  const th = { padding: "6px 6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.mt, borderBottom: `1px solid ${C.bd}`, textAlign: "center", position: "sticky", top: 0, background: C.cd };
  const td = { padding: "8px 6px", borderBottom: `1px solid ${C.bd}55`, textAlign: "center", fontSize: 15 };
  return (
    <div style={{ flex: "1 1 420px", minWidth: 0, background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <TeamLogo t={team} sz={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color }}>{title}</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{team.city} {team.name} <span style={{ fontSize: 14, color: C.mt, fontWeight: 600 }}>{team.w}-{team.l}{team.t ? `-${team.t}` : ""}</span></div>
        </div>
        <select value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Position" style={{ ...sel, padding: "6px 8px", fontSize: 14 }}>
          {["ALL", ...POS].map((x) => <option key={x} value={x}>{x === "ALL" ? "All positions" : x}</option>)}
        </select>
      </div>
      <div style={{ maxHeight: 460, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}></th><th style={{ ...th, textAlign: "left" }}>PLAYER</th><th style={th}>POS</th><th className="tr-hide" style={th}>AGE</th><th style={th}>OVR</th><th className="tr-hide" style={th}>CONTRACT</th><th style={th}>VALUE</th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const on = chosen.some((x) => x.id === p.id);
              return (
                <tr key={p.id} onClick={() => toggle(p)} style={{ cursor: "pointer", background: on ? `${color}26` : "transparent" }}>
                  <td style={{ ...td, width: 30 }}><input type="checkbox" readOnly checked={on} style={{ width: 18, height: 18, accentColor: color, pointerEvents: "none" }} /></td>
                  <td style={{ ...td, textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Face s={p.face} sz={26} />
                      <span onClick={(e) => { e.stopPropagation(); setSel(p); }} style={{ fontWeight: 700, color: "#f1f5f9", textDecoration: "underline", textDecorationColor: "#334155", textUnderlineOffset: 3 }}>{p.name}</span>
                      {p.xf && <span title={`X-Factor: ${p.xf}`} style={{ fontSize: 11, fontWeight: 900, color: "#f472b6" }}>XF</span>}
                      {p.injured && <span title="Injured" style={{ fontSize: 12, color: C.rd, fontWeight: 900 }}>+</span>}
                    </span>
                  </td>
                  <td style={td}><Bdg pos={p.pos} /></td>
                  <td className="tr-hide" style={{ ...td, color: "#cbd5e1" }}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 900, fontSize: 17, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td className="tr-hide" style={{ ...td, color: "#cbd5e1", whiteSpace: "nowrap", fontSize: 14 }}>{money(p.salary)} · {p.contract}y</td>
                  <td style={{ ...td, fontWeight: 800, color: "#fbbf24" }}>{p.tradeVal}</td>
                </tr>
              );
            })}
            {picks.length > 0 && <tr><td colSpan={7} style={{ padding: "12px 6px 4px", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.gd }}>DRAFT PICKS</td></tr>}
            {picks.map((pk) => {
              const on = chosenPk.some((x) => x.id === pk.id);
              return (
                <tr key={pk.id} onClick={() => togglePk(pk)} style={{ cursor: "pointer", background: on ? `${C.gd}26` : "transparent" }}>
                  <td style={{ ...td, width: 30 }}><input type="checkbox" readOnly checked={on} style={{ width: 18, height: 18, accentColor: C.gd, pointerEvents: "none" }} /></td>
                  <td style={{ ...td, textAlign: "left", fontWeight: 700 }} colSpan={2}>{pk.yr || ""} Round {pk.rd}{pk.overall ? ` · #${pk.overall}` : ""}{pk.orig !== team.id ? <span style={{ color: C.mt, fontWeight: 400 }}> (via {pk.origAb})</span> : null}</td>
                  <td className="tr-hide" style={td}></td><td style={td}></td><td className="tr-hide" style={td}></td>
                  <td style={{ ...td, fontWeight: 800, color: "#fbbf24" }}>{Math.round(pickVal(pk))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TradeScreen({ teams, ui, trTm, setTrTm, trOff, setTrOff, draftPicks, pickVal, evalTr, execTr, setSel, capSpace, closed, modes, yr, sp }) {
  const me = teams[ui];
  const them = trTm != null ? teams[trTm] : null;
  const withAb = (pk) => ({ ...pk, origAb: teams[pk.orig]?.ab });
  const flip = (key, x) => setTrOff((o) => ({ ...o, [key]: o[key].some((y) => y.id === x.id) ? o[key].filter((y) => y.id !== x.id) : [...o[key], x] }));
  const any = trOff.g.length + trOff.r.length + trOff.gPk.length + trOff.rPk.length > 0;
  const ev = any ? evalTr() : { gv: 0, rv: 0, ask: 0, gap: 0, accept: false, over: false, nextWeight: 1 };
  const accept = ev.accept;
  // Players you send leave their signing bonus behind as dead money; players you get arrive on their base salary.
  const dead = trOff.g.reduce((s, p) => { const d = deadMoney(p, { yr, sp }); return { now: s.now + d.now, next: s.next + d.next }; }, { now: 0, next: 0 });
  const salOut = trOff.g.reduce((s, p) => s + (p.salary || 0), 0), salIn = trOff.r.reduce((s, p) => s + (p.salary || 0) - proration(p), 0);
  const capAfter = capSpace(me) + salOut - salIn - dead.now;

  // Balance the deal: add the smallest asset of yours that covers what they still want, or, if
  // you're overpaying, the best extra piece of theirs that keeps it acceptable.
  const balance = () => {
    if (!them) return;
    if (ev.gap > 0) {
      // Their GM counts your next piece at a discount, so it has to cover gap / weight.
      const need = ev.gap; // checked per asset below: picks count in full, players at nextWeight
      const mine = [
        ...me.roster.filter((p) => !trOff.g.some((x) => x.id === p.id)).map((p) => ({ k: "g", x: p, v: p.tradeVal })),
        ...draftPicks.filter((pk) => pk.owner === ui && !trOff.gPk.some((x) => x.id === pk.id)).map((pk) => ({ k: "gPk", x: pk, v: pickVal(pk) })),
      ].sort((a, b) => a.v - b.v);
      const counts = (a) => (a.k === "g" ? a.v * ev.nextWeight : a.v);
      const fit = mine.find((a) => counts(a) >= need) || mine[mine.length - 1];
      if (fit) flip(fit.k, fit.x);
    } else if (ev.over) {
      const room = (ev.gv - ev.ask) / 1.25; // what they could add and still come out ahead
      const theirs = them.roster.filter((p) => !trOff.r.some((x) => x.id === p.id) && p.tradeVal <= room).sort((a, b) => b.tradeVal - a.tradeVal);
      if (theirs[0]) flip("r", theirs[0]);
    }
  };

  const verdict = !any ? null
    : !(trOff.g.length || trOff.gPk.length) ? ["Add something you'll send", C.mt]
    : !(trOff.r.length || trOff.rPk.length) ? ["Add something you want back", C.mt]
    : accept ? [ev.over ? "They'd accept — but you're overpaying" : "They'd accept this trade", C.gn]
    : [`They want about ${ev.gap} more value`, C.rd];
  const chip = (x, key, label, color) => (
    <span key={x.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bg, border: `1px solid ${color}55`, borderRadius: 8, padding: "5px 8px", fontSize: 14 }}>
      {label}<button onClick={() => flip(key, x)} aria-label="Remove" style={{ background: "transparent", border: 0, color: C.mt, cursor: "pointer", fontSize: 15, padding: 0 }}>✕</button>
    </span>
  );
  const pkLabel = (pk) => `${pk.yr || ""} Rd ${pk.rd}${pk.overall ? ` #${pk.overall}` : ""}`;
  // Left of centre: short of what they ask. Right: comfortably over it.
  const meter = Math.max(-1, Math.min(1, (ev.gv - ev.ask) / Math.max(40, ev.ask)));

  return (
    <div>
      <style>{"@media (max-width: 640px) { .tr-hide { display: none } }"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 900 }}>Trade with</span>
        <select value={trTm ?? ""} onChange={(e) => { setTrTm(e.target.value === "" ? null : +e.target.value); setTrOff({ g: [], r: [], gPk: [], rPk: [] }); }} aria-label="Trade partner" style={{ ...sel, fontSize: 17, fontWeight: 700, minWidth: 240 }}>
          <option value="">Choose a team…</option>
          {teams.filter((t) => t.id !== ui).sort((a, b) => a.city.localeCompare(b.city)).map((t) => <option key={t.id} value={t.id}>{t.city} {t.name} ({t.w}-{t.l}){modes?.[t.id] === "buyer" ? " · buying" : modes?.[t.id] === "seller" ? " · selling" : ""}</option>)}
        </select>
        <span style={{ fontSize: 14, color: C.mt }}>Your cap space: <b style={{ color: capSpace(me) >= 0 ? C.gn : C.rd }}>{money(capSpace(me))}</b></span>
      </div>

      {them && (
        <div style={{ background: C.cd, border: `1px solid ${verdict ? verdict[1] : C.bd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.rd, marginBottom: 6 }}>YOU SEND · worth {ev.gv} to them</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trOff.g.map((p) => chip(p, "g", <><Bdg pos={p.pos} /> <b>{p.name}</b> <span style={{ color: oC(p.ovr) }}>{p.ovr}</span></>, C.rd))}
                {trOff.gPk.map((pk) => chip(pk, "gPk", <b>{pkLabel(pk)}</b>, C.gd))}
                {!trOff.g.length && !trOff.gPk.length && <span style={{ color: C.mt, fontSize: 14 }}>Tick players or picks on your side</span>}
              </div>
            </div>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.gn, marginBottom: 6 }}>YOU RECEIVE · value {ev.rv}{ev.ask > ev.rv ? ` · they ask ${ev.ask}` : ""}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trOff.r.map((p) => chip(p, "r", <><Bdg pos={p.pos} /> <b>{p.name}</b> <span style={{ color: oC(p.ovr) }}>{p.ovr}</span></>, C.gn))}
                {trOff.rPk.map((pk) => chip(pk, "rPk", <b>{pkLabel(pk)}</b>, C.gd))}
                {!trOff.r.length && !trOff.rPk.length && <span style={{ color: C.mt, fontSize: 14 }}>Tick players or picks on their side</span>}
              </div>
            </div>
          </div>
          {any && (
            <>
              <div style={{ position: "relative", height: 10, background: C.bg, borderRadius: 5, margin: "14px 0 6px" }}>
                <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 2, background: C.mt }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 5, background: meter >= 0 ? C.gn : C.rd, left: meter >= 0 ? "50%" : `${50 + meter * 50}%`, width: `${Math.abs(meter) * 50}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mt }}><span>Not enough</span><span>Their asking price</span><span>More than enough</span></div>
            </>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {verdict && <span style={{ fontSize: 20, fontWeight: 900, color: verdict[1], flex: "1 1 240px" }}>{verdict[0]}{ev.why && !accept && <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#fca5a5" }}>{ev.why}</span>}</span>}
            {any && <span style={{ fontSize: 14, color: C.mt }}>Cap space after: <b style={{ color: capAfter >= 0 ? C.gn : C.rd }}>{money(capAfter)}</b>{dead.now + dead.next > 0.05 && <span style={{ display: "block", fontSize: 12 }}>incl. {money(dead.now)} dead money{dead.next > 0.05 ? ` (+${money(dead.next)} next year)` : ""}</span>}</span>}
            {any && <Btn onClick={balance} bg={C.bd} c="#e2e8f0" style={{ fontSize: 15, padding: "9px 14px" }}>What would make this work?</Btn>}
            {any && <Btn onClick={() => setTrOff({ g: [], r: [], gPk: [], rPk: [] })} bg="transparent" c={C.mt} style={{ fontSize: 15, padding: "9px 12px", border: `1px solid ${C.bd}` }}>Clear</Btn>}
            <Btn onClick={execTr} disabled={!accept || closed} bg={C.gn} style={{ fontSize: 16, padding: "10px 20px", fontWeight: 900 }}>{closed ? "Trade deadline passed" : "Propose trade"}</Btn>
          </div>
        </div>
      )}

      {them ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Side title="YOUR TEAM" color={C.rd} team={me} players={me.roster} picks={draftPicks.filter((pk) => pk.owner === ui).map(withAb)} chosen={trOff.g} chosenPk={trOff.gPk} toggle={(p) => flip("g", p)} togglePk={(pk) => flip("gPk", pk)} pickVal={pickVal} setSel={setSel} />
          <Side title="THEIR TEAM" color={C.gn} team={them} players={them.roster} picks={draftPicks.filter((pk) => pk.owner === trTm).map(withAb)} chosen={trOff.r} chosenPk={trOff.rPk} toggle={(p) => flip("r", p)} togglePk={(pk) => flip("rPk", pk)} pickVal={pickVal} setSel={setSel} />
        </div>
      ) : (
        <div style={{ background: C.cd, border: `1px dashed ${C.bd}`, borderRadius: 10, padding: 24, textAlign: "center", fontSize: 16, color: C.mt }}>Choose a team above to see both rosters side by side.</div>
      )}
    </div>
  );
}
