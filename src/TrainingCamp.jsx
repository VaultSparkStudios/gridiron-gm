// Training camp (preseason): every camp tool in one clean screen of large cards.
import React, { useState } from "react";
import { C, oC, Bdg, Btn, Face } from "./ui.jsx";
import { yearlyAsk } from "./negotiation.js";

const card = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, flex: "1 1 420px", minWidth: 0 };
const title = (t, sub) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 18, fontWeight: 900 }}>{t}</div>
    {sub && <div style={{ fontSize: 14, color: C.mt, marginTop: 2 }}>{sub}</div>}
  </div>
);
const row = { display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", borderBottom: `1px solid ${C.bd}55`, fontSize: 15 };
const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const ATTRS = [["ovr", "Overall"], ["spd", "Speed"], ["str", "Strength"], ["agi", "Agility"], ["acc", "Acceleration"]];
const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];

export default function TrainingCamp({ team, yr, sp, scPts, games, risk, onRisk, onSimGame, onReport, onDevCamp, onTrain, battlesDone, onBattle, otcFocus, onOtc, onExtend, setSel }) {
  const roster = team.roster;
  const [pick, setPick] = useState("");
  const [attr, setAttr] = useState("ovr");
  const rookies = roster.filter((p) => p.age <= 23 && (p.draftYr === yr || p.draftYr === yr - 1)).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
  const campUsed = team.devCampYr === yr;
  const trainable = roster.filter((p) => !p.trainedThisCamp).sort((a, b) => b.ovr - a.ovr).slice(0, 25);
  const trained = roster.filter((p) => p.trainedThisCamp);
  const expiring = roster.filter((p) => p.contract === 1 || p.resigned?.yr === yr).sort((a, b) => b.ovr - a.ovr);
  const pre = sp === "preseason";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px 18px", flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 900 }}>Training Camp</span>
        <span style={{ fontSize: 15, color: C.mt }}>Season points <b style={{ fontSize: 20, color: C.bl }}>{scPts} SP</b></span>
        {!pre && <span style={{ fontSize: 15, color: C.gd }}>Camp is closed until next preseason.</span>}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={card}>
          {title(`Preseason games (${games.length}/4)`, "Tune-ups before the season. Starters playing risks injuries.")}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {games.map((g, i) => <span key={i} style={{ fontSize: 15, fontWeight: 800, padding: "5px 10px", borderRadius: 8, background: g.us > g.them ? "#14532d55" : "#7f1d1d55", color: g.us > g.them ? C.gn : "#fca5a5" }}>{g.us > g.them ? "W" : "L"} {g.us}–{g.them} {g.opp}</span>)}
            {!games.length && <span style={{ fontSize: 15, color: C.mt }}>None played yet.</span>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={onSimGame} disabled={!pre || games.length >= 4} bg={C.gn} style={{ fontSize: 15, padding: "8px 14px" }}>▶ Play preseason game</Btn>
            <Btn onClick={onRisk} bg={risk ? "#7f1d1d" : C.bd} c={risk ? "#fca5a5" : "#cbd5e1"} style={{ fontSize: 15, padding: "8px 14px" }}>Starters play: {risk ? "Yes" : "No"}</Btn>
            {games.length > 0 && <Btn onClick={onReport} bg={C.bd} c="#7dd3fc" style={{ fontSize: 15, padding: "8px 14px" }}>Practice report</Btn>}
          </div>
        </div>

        <div style={card}>
          {title("Camp focus", "Pick one group. Its top 5 players gain +1 OVR when the season ends.")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["passing", "Passing game"], ["rushing", "Run game & line"], ["defense", "Defense"]].map(([k, l]) => (
              <button key={k} disabled={!pre} onClick={() => onOtc(otcFocus === k ? null : k)} style={{ flex: "1 1 120px", padding: "12px 10px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: pre ? "pointer" : "default", background: otcFocus === k ? `${C.bl}33` : C.bg, color: otcFocus === k ? "#fff" : "#cbd5e1", border: `2px solid ${otcFocus === k ? C.bl : C.bd}` }}>{otcFocus === k ? "✓ " : ""}{l}</button>
            ))}
          </div>
        </div>

        <div style={card}>
          {title("Rookie dev camp · 3 SP", "Once per preseason, one rookie gains up to +3 OVR — never past his potential.")}
          {campUsed && <div style={{ fontSize: 15, color: C.gn, fontWeight: 700, marginBottom: 6 }}>✓ Used this preseason{team.devCampPid ? ` on ${roster.find((p) => p.id === team.devCampPid)?.name || "a rookie"}` : ""}.</div>}
          {!rookies.length && <div style={{ fontSize: 15, color: C.mt }}>No rookies or second-year players on the roster.</div>}
          {rookies.map((p) => (
            <div key={p.id} style={row}>
              <Face s={p.face} sz={28} /><span onClick={() => setSel(p)} style={{ flex: 1, fontWeight: 700, cursor: "pointer" }}>{p.name}</span><Bdg pos={p.pos} />
              <span style={{ fontWeight: 900, color: oC(p.ovr), minWidth: 28, textAlign: "center" }}>{p.ovr}</span>
              <span style={{ fontSize: 13, color: C.mt, minWidth: 54 }}>POT {p.pot || p.ovr}</span>
              <Btn onClick={() => onDevCamp(p)} disabled={!pre || campUsed || scPts < 3 || p.ovr >= (p.pot || p.ovr)} bg={C.bl} style={{ fontSize: 14, padding: "6px 12px" }}>{p.ovr >= (p.pot || p.ovr) ? "At ceiling" : "Boost"}</Btn>
            </div>
          ))}
        </div>

        <div style={card}>
          {title("Training focus · 2 SP", "Give one player extra reps: +1 to one attribute. Once per player each camp.")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Player to train" style={{ flex: "1 1 220px", background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "9px 10px", fontSize: 15 }}>
              <option value="">Choose a player…</option>
              {trainable.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.pos} {p.ovr}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {ATTRS.map(([k, l]) => <button key={k} onClick={() => setAttr(k)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", background: attr === k ? `${C.bl}33` : C.bg, color: attr === k ? "#fff" : "#cbd5e1", border: `1px solid ${attr === k ? C.bl : C.bd}` }}>{l}</button>)}
          </div>
          <Btn onClick={() => { const p = roster.find((x) => x.id === pick); if (p) { onTrain(p, attr); setPick(""); } }} disabled={!pre || !pick || scPts < 2} bg={C.gn} style={{ fontSize: 15, padding: "8px 14px" }}>Train (+1 {ATTRS.find(([k]) => k === attr)[1]})</Btn>
          {trained.length > 0 && <div style={{ fontSize: 14, color: C.mt, marginTop: 8 }}>Trained: {trained.map((p) => p.name).join(", ")}</div>}
        </div>

        <div style={card}>
          {title("Position battles · 1 SP each", "The top two at a spot compete; the winner (usually the better player) gains +1 OVR.")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
            {POS.map((pos) => {
              const top2 = roster.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, 2);
              if (top2.length < 2) return null;
              const done = battlesDone.includes(pos);
              return (
                <button key={pos} disabled={!pre || done || scPts < 1} onClick={() => onBattle(pos)} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, cursor: !pre || done ? "default" : "pointer", background: C.bg, border: `1px solid ${done ? C.gn + "66" : C.bd}`, color: "#e2e8f0", opacity: done ? 0.7 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Bdg pos={pos} />{done && <span style={{ marginLeft: "auto", color: C.gn, fontWeight: 800, fontSize: 13 }}>✓ Done</span>}</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{top2[0].name.split(" ").slice(-1)[0]} <span style={{ color: C.mt }}>vs</span> {top2[1].name.split(" ").slice(-1)[0]}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={card}>
          {title("Contract extensions", "Extend players heading into the last year of their deals — a real negotiation, same as re-sign week.")}
          {!expiring.length && <div style={{ fontSize: 15, color: C.mt }}>Nobody is in a contract year.</div>}
          {expiring.map((p) => (
            <div key={p.id} style={row}>
              <span onClick={() => setSel(p)} style={{ flex: 1, fontWeight: 700, cursor: "pointer" }}>{p.name} <span style={{ fontSize: 13, color: C.mt, fontWeight: 400 }}>{p.age}</span></span><Bdg pos={p.pos} />
              <span style={{ fontWeight: 900, color: oC(p.ovr), minWidth: 28, textAlign: "center" }}>{p.ovr}</span>
              {p.resigned?.yr === yr ? <span style={{ fontSize: 14, color: C.gn, fontWeight: 700 }}>Extended {p.resigned.yrs}y · {money(p.resigned.sal)}</span>
                : <><span style={{ fontSize: 14, color: C.mt, whiteSpace: "nowrap" }}>asks {money(yearlyAsk(p, 2, "extend"))}</span><Btn onClick={() => onExtend(p)} bg={C.gn} style={{ fontSize: 14, padding: "6px 12px" }}>Negotiate</Btn></>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
