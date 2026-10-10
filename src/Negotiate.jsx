// The negotiation table: pick the years, set the money, make an offer, and read his answer.
// Used for re-signing your own players and for free agents.
import React, { useState } from "react";
import { C, oC, Bdg, Btn, Face } from "./ui.jsx";
import { yearlyAsk, maxYears, respond, interest } from "./negotiation.js";
import { EXT_BONUS, extStructure } from "./extensions.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const r1 = (x) => Math.round(x * 10) / 10;

export default function Negotiate({ p, mode, cap, nowRoom = Infinity, t, talk = {}, onResult, onClose, rivalName, note }) {
  const [share, setShare] = useState(0);
  const ext = mode === "extend";
  const shape = (amount) => (ext ? extStructure(amount, yrs, share) : { hit: amount, nowAdd: 0, pr: 0, bonus: 0 });
  const fits = (amount) => cap - shape(amount).hit >= 0 && nowRoom - shape(amount).nowAdd >= 0;
  const [yrs, setYrs] = useState(Math.min(2, maxYears(p)));
  const ask = yearlyAsk(p, yrs, mode);
  const f = p.perf?.f ?? 1;
  const perfNote = mode !== "fa" && Math.abs(f - 1) >= 0.05 ? (f > 1 ? `Coming off a big season: he's asking about ${Math.round((f - 1) * 100)}% more than his rating alone would get.` : `Coming off a down season: he'd take about ${Math.round((1 - f) * 100)}% less on a multi-year deal, or bet on himself with a 1-year prove-it deal near full price.`) : null;
  const [sal, setSal] = useState(r1(ask * 0.9));
  const done = talk.walked || talk.signed;
  const last = talk.last;
  const offer = (amount) => {
    const s = shape(r1(amount));
    const o = { sal: r1(amount), yrs, ...(ext ? { hit: s.hit, pr: s.pr, bonus: s.bonus } : {}) };
    onResult(respond(p, o, t, talk), o);
  };
  const step = (d) => setSal((s) => Math.max(0.8, r1(s + d)));
  const mood = interest(talk);
  const cur = shape(sal);
  const after = cap - cur.hit;
  const tone = { accept: C.gn, counter: C.gd, reject: "#f97316", walk: C.rd, lost: C.rd };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 14, padding: 20, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <Face s={p.face} sz={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: C.mt }}>{mode === "resign" ? "RE-SIGN" : mode === "extend" ? "CONTRACT EXTENSION" : "FREE AGENT"}</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{p.name}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: "#cbd5e1" }}><Bdg pos={p.pos} /> Age {p.age}{(mode === "resign" || mode === "extend") && p.salary ? ` · now ${money(p.salary)}${mode === "extend" ? ` · ${p.contract} yr${p.contract === 1 ? "" : "s"} left` : ""}` : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 32, fontWeight: 900, color: oC(p.ovr), lineHeight: 1 }}>{p.ovr}</div><div style={{ fontSize: 12, color: C.mt }}>OVR</div></div>
        </div>

        {perfNote && <div style={{ fontSize: 13, color: f > 1 ? "#fcd34d" : "#93c5fd", background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{f > 1 ? "📈 " : "📉 "}{perfNote}</div>}
        {note && <div style={{ fontSize: 13, color: "#cbd5e1", background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{note}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: C.mt, fontWeight: 700 }}>Interest</span>
          <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 4 }}><div style={{ width: `${mood}%`, height: "100%", borderRadius: 4, background: mood > 60 ? C.gn : mood > 30 ? C.gd : C.rd }} /></div>
          {t.rival && mode === "fa" && !done && <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700 }}>Other teams are interested</span>}
        </div>

        {last && (
          <div style={{ background: C.bg, border: `1px solid ${tone[last.result] || C.bd}`, borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 16, fontWeight: 700, color: tone[last.result] || "#fff" }}>
            {last.result === "lost" ? `Signed with ${rivalName?.(last.team) || "another team"} — $${last.sal}M a year.` : last.msg}
          </div>
        )}

        {!done && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: C.mt, marginBottom: 6 }}>YEARS</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((y) => (
                <button key={y} disabled={y > maxYears(p)} onClick={() => { setYrs(y); setSal(r1(yearlyAsk(p, y, mode) * 0.9)); }} style={{ flex: 1, padding: "9px 0", fontSize: 16, fontWeight: 800, borderRadius: 8, cursor: y > maxYears(p) ? "not-allowed" : "pointer", opacity: y > maxYears(p) ? 0.3 : 1, background: yrs === y ? C.bl : C.bg, color: "#fff", border: `1px solid ${yrs === y ? C.bl : C.bd}` }}>{y}</button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: C.mt, marginBottom: 6 }}>YOUR OFFER PER YEAR <span style={{ fontWeight: 600, letterSpacing: 0, color: "#cbd5e1" }}>· he's asking {money(ask)}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Btn onClick={() => step(-0.5)} bg={C.bd} c="#e2e8f0" style={{ fontSize: 20, padding: "6px 16px" }}>−</Btn>
              <div style={{ flex: 1, textAlign: "center", fontSize: 30, fontWeight: 900 }}>{money(sal)}</div>
              <Btn onClick={() => step(0.5)} bg={C.bd} c="#e2e8f0" style={{ fontSize: 20, padding: "6px 16px" }}>+</Btn>
            </div>
            <input type="range" min={Math.max(0.8, r1(ask * 0.5))} max={r1(ask * 1.4 + 1)} step={0.1} value={sal} onChange={(e) => setSal(+e.target.value)} aria-label="Offer per year" style={{ width: "100%", accentColor: C.bl, marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.mt, marginBottom: 14 }}>
              <span>Total <b style={{ color: "#fff" }}>{money(sal * yrs)}</b> over {yrs} yr{yrs > 1 ? "s" : ""}</span>
              <span>{mode === "extend" ? "Next year's cap after" : "Cap after"} <b style={{ color: after >= 0 ? C.gn : C.rd }}>{money(after)}</b></span>
            </div>
            {ext && <>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: C.mt, marginBottom: 6 }}>SIGNING BONUS <span style={{ fontWeight: 600, letterSpacing: 0, color: "#cbd5e1" }}>· spread over {Math.min(5, yrs + 1)} years from this season</span></div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {EXT_BONUS.map((b) => <button key={b} onClick={() => setShare(b)} style={{ flex: 1, padding: "8px 0", fontSize: 15, fontWeight: 800, borderRadius: 8, cursor: "pointer", background: share === b ? C.bl : C.bg, color: "#fff", border: `1px solid ${share === b ? C.bl : C.bd}` }}>{b ? `${Math.round(b * 100)}%` : "None"}</button>)}
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 14, lineHeight: 1.5 }}>
                Cap hit each new year: <b style={{ color: "#fff" }}>{money(cur.hit)}</b>{share ? <> (vs {money(sal)} with no bonus) · this season's hit goes up <b style={{ color: nowRoom - cur.nowAdd >= 0 ? C.gd : C.rd }}>{money(cur.nowAdd)}</b>{nowRoom !== Infinity ? ` (room now ${money(nowRoom)})` : ""} · bonus {money(cur.bonus)}, dead money if he's cut</> : <>. A signing bonus lowers it, so the deal fits next year's cap.</>}
              </div>
            </>}
          </>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={onClose} bg={C.bd} c="#cbd5e1" style={{ flex: "1 1 100px", fontSize: 16, padding: "11px 0" }}>{done ? "Close" : "Not now"}</Btn>
          {!done && last?.result === "counter" && <Btn onClick={() => offer(last.counter)} disabled={!fits(last.counter)} bg={C.gd} c="#000" style={{ flex: "2 1 160px", fontSize: 16, padding: "11px 0", fontWeight: 900 }}>Accept {money(last.counter)}</Btn>}
          {!done && <Btn onClick={() => offer(sal)} disabled={!fits(sal)} bg={C.gn} style={{ flex: "2 1 160px", fontSize: 16, padding: "11px 0", fontWeight: 900 }}>{fits(sal) ? "Make offer" : after < 0 ? (ext && share < EXT_BONUS[EXT_BONUS.length - 1] ? "Not enough cap: add a bonus" : "Not enough cap") : "Not enough room this season"}</Btn>}
        </div>
      </div>
    </div>
  );
}
