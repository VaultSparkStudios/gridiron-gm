// Training camp (preseason): games and camp focus up top, battles and rookie camp always open, then
// training focus and extensions showing their top 5 (the rest behind Show all).
import Select from "./Select.jsx";
import React, { useState } from "react";
import { C, oC, Bdg, Btn, Face, Hero, Section, Chips, Sheet, Pills } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { yearlyAsk } from "./negotiation.js";
import { posTag } from "./dline.js";

const panel = { background: "#ffffff0d", borderRadius: 18, padding: "14px 16px", minWidth: 0 };
const row = { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#ffffff08", borderRadius: 12, fontSize: 14, minWidth: 0 };
const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const ATTRS = [["ovr", "Overall"], ["spd", "Speed"], ["str", "Strength"], ["agi", "Agility"], ["acc", "Acceleration"]];
// The player picker: grouped by position (offense, then defense, then specialists), best first.
const PICK_ORDER = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "EDGE", "DL", "DT", "LB", "CB", "S", "K", "P"];
const POS_NAME = { QB: "Quarterbacks", RB: "Running backs", WR: "Wide receivers", TE: "Tight ends", LT: "Left tackles", LG: "Left guards", C: "Centers", RG: "Right guards", RT: "Right tackles", EDGE: "Edge rushers", DL: "Defensive line", DT: "Defensive tackles", LB: "Linebackers", CB: "Cornerbacks", S: "Safeties", K: "Kickers", P: "Punters" };
const groupByPos = (ps) => {
  const m = new Map();
  for (const p of ps) { if (!m.has(p.pos)) m.set(p.pos, []); m.get(p.pos).push(p); }
  const rank = (pos) => { const i = PICK_ORDER.indexOf(pos); return i < 0 ? 99 : i; };
  return [...m.entries()].sort((a, b) => rank(a[0]) - rank(b[0])).map(([pos, list]) => [pos, list.sort((a, b) => (b.ovr || 0) - (a.ovr || 0))]);
};
const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];

export default function TrainingCamp({ team, yr, sp, scPts, games, risk, onRisk, onSimGame, onReport, onDevCamp, onTrain, onAutoTrain, battlesDone, onBattle, onBattleAll, otcFocus, onOtc, onExtend, setSel }) {
  const roster = team.roster;
  const [pick, setPick] = useState("");
  const [attr, setAttr] = useState("ovr");
  const [allExt, setAllExt] = useState(false);
  const rookies = roster.filter((p) => p.age <= 23 && (p.draftYr === yr || p.draftYr === yr - 1)).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
  const campUsed = team.devCampYr === yr;
  const trainable = roster.filter((p) => !p.trainedThisCamp);
  const trained = roster.filter((p) => p.trainedThisCamp);
  const expiring = roster.filter((p) => p.contract === 1 || p.ext || p.resigned?.yr === yr).sort((a, b) => b.ovr - a.ovr);
  const extDone = expiring.filter((p) => p.ext || p.resigned?.yr === yr).length;
  const battles = POS.map((pos) => [pos, roster.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, 2)]).filter(([, t]) => t.length >= 2);
  const openB = battles.filter(([pos]) => !battlesDone.includes(pos)).map(([pos]) => pos);
  const pre = sp === "preseason";
  // the best uses of a training rep: young players furthest from their ceiling, then the best players
  const trainTop = [...trainable].sort((a, b) => ((b.age <= 25 ? (b.pot || b.ovr) - b.ovr : 0) - (a.age <= 25 ? (a.pot || a.ovr) - a.ovr : 0)) || b.ovr - a.ovr);
  const attrName = ATTRS.find(([k]) => k === attr)[1];
  const head = (t, s, extra) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 16, fontWeight: 800 }}>{t}</span>
      {s && <span style={{ fontSize: 13, color: C.mt, flex: 1, minWidth: 160 }}>{s}</span>}
      {extra}
    </div>
  );
  if (MOBILE) return <PhoneCamp {...{ team, yr, scPts, games, risk, onRisk, onSimGame, onReport, onDevCamp, onTrain, onAutoTrain, battlesDone, onBattle, onBattleAll, otcFocus, onOtc, onExtend, setSel, roster, rookies, campUsed, trainable, trained, expiring, extDone, battles, openB, pre, trainTop, attr, setAttr, attrName }} />;
  const more = (open, set, n) => n > 5 && <button onClick={() => set((v) => !v)} style={{ marginTop: 8, background: "#ffffff12", border: 0, color: "#e2e8f0", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{open ? "Top 5 only" : `Show all ${n}`}</button>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!pre && <div style={{ ...panel, flex: "1 1 100%", color: "#fcd34d", fontWeight: 700 }}>Camp is closed for this year.</div>}
        <div style={{ ...panel, flex: "1.3 1 440px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Preseason games {games.length}/4</span>
            <span style={{ fontSize: 13, color: C.mt }}>Starters playing risks injuries.</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {games.map((g, i) => <span key={i} style={{ fontSize: 13, fontWeight: 800, padding: "5px 10px", borderRadius: 999, background: g.us > g.them ? "#14532d55" : "#7f1d1d55", color: g.us > g.them ? C.gn : "#fca5a5" }}>{g.us > g.them ? "W" : "L"} {g.us}–{g.them} {g.opp}</span>)}
            <Btn onClick={onSimGame} disabled={!pre || games.length >= 4} bg={C.gn} style={{ fontSize: 13.5, padding: "7px 14px", borderRadius: 999 }}>▶ Play game</Btn>
            <Btn onClick={onRisk} bg={risk ? "#7f1d1d" : "#ffffff12"} c={risk ? "#fca5a5" : "#cbd5e1"} style={{ fontSize: 13.5, padding: "7px 14px", borderRadius: 999 }}>Starters play: {risk ? "yes" : "no"}</Btn>
            {games.length > 0 && <Btn onClick={onReport} bg="#ffffff12" c="#e2e8f0" style={{ fontSize: 13.5, padding: "7px 14px", borderRadius: 999 }}>Practice report</Btn>}
          </div>
        </div>
        <div style={{ ...panel, flex: "1 1 360px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Camp focus</span>
            <span style={{ fontSize: 13, color: C.mt }}>Top 5 in the group gain +1 OVR at season's end.</span>
          </div>
          <Pills full items={[["passing", "Passing"], ["rushing", "Run game & line"], ["defense", "Defense"]]} value={otcFocus} onChange={(k) => pre && onOtc(otcFocus === k ? null : k)} label="Camp focus" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
        <div style={{ ...panel, flex: "1.2 1 480px" }}>
          {head(`Position battles · ${battles.length - openB.length}/${battles.length}`, "1 SP each. The top two compete; the winner gains +1 OVR.",
            onBattleAll && openB.length > 0 && (() => { const n = Math.min(openB.length, scPts); return <Btn onClick={() => onBattleAll(openB)} disabled={!pre || n < 1} bg="#ffffff12" c="#e2e8f0" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 999 }}>Run {n < openB.length ? `${n} of ${openB.length}` : `all ${openB.length}`} · {n} SP</Btn>; })())}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 6 }}>
            {battles.map(([pos, top2]) => {
              const done = battlesDone.includes(pos);
              return (
                <button key={pos} disabled={!pre || done || scPts < 1} onClick={() => onBattle(pos)} style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: "7px 10px", borderRadius: 12, cursor: !pre || done ? "default" : "pointer", background: done ? "#22c55e14" : "#ffffff08", border: 0, color: "#e2e8f0", opacity: done ? 0.7 : 1, minWidth: 0 }}>
                  <Bdg pos={pos} />
                  <span style={{ fontSize: 13, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{top2[0].name.split(" ").slice(-1)[0]} <span style={{ color: C.mt }}>vs</span> {top2[1].name.split(" ").slice(-1)[0]}</span>
                  {done && <span style={{ color: C.gn, fontWeight: 800, fontSize: 13 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ ...panel, flex: "1 1 440px" }}>
          {head("Rookie camp · 3 SP", campUsed ? <b style={{ color: C.gn }}>✓ Used{team.devCampPid ? ` on ${roster.find((p) => p.id === team.devCampPid)?.name || "a rookie"}` : ""}</b> : "Once per preseason: one rookie gains up to +3 OVR.")}
          {!rookies.length && <div style={{ fontSize: 13.5, color: C.mt }}>No rookies or second-year players on the roster.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 5 }}>
            {rookies.map((p) => (
              <div key={p.id} style={row}>
                <Face s={p.face} sz={22} /><span onClick={() => setSel(p)} style={{ flex: 1, minWidth: 0, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span><Bdg pos={posTag(p)} />
                <span style={{ fontWeight: 900, color: oC(p.ovr) }}>{p.ovr}</span>
                <span style={{ fontSize: 11.5, color: C.mt, whiteSpace: "nowrap" }}>/{p.pot || p.ovr}</span>
                <Btn onClick={() => onDevCamp(p)} disabled={!pre || campUsed || scPts < 3 || p.ovr >= (p.pot || p.ovr)} bg={C.bl} style={{ fontSize: 12.5, padding: "4px 12px" , borderRadius: 999 }}>{p.ovr >= (p.pot || p.ovr) ? "Max" : "Boost"}</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ ...panel, flex: "1 1 520px" }}>
          {head(`Training focus · 2 SP`, <Pills quiet items={ATTRS.map(([k, l]) => [k, l === "Acceleration" ? "Accel" : l, `+1 ${l}, once per player each camp`])} value={attr} onChange={setAttr} label="Training focus" />,
            onAutoTrain && (() => { const n = Math.min(5, trainable.length, Math.floor(scPts / 2)); return <Btn onClick={() => onAutoTrain(5)} disabled={!pre || n < 1} bg="#ffffff12" c="#e2e8f0" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 999 }} title="Picks players at random: young players under their ceiling work on overall, the rest on a physical tool">Auto-pick {n > 0 ? `${n} · ${n * 2} SP` : ""}</Btn>; })())}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {trainTop.slice(0, 5).map((p) => (
              <div key={p.id} style={row}>
                <span onClick={() => setSel(p)} style={{ flex: 1, minWidth: 0, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} <span style={{ fontSize: 12, color: C.mt, fontWeight: 400 }}>{p.age}</span></span><Bdg pos={posTag(p)} />
                <span style={{ fontWeight: 900, color: oC(p.ovr) }}>{p.ovr}</span>
                <span style={{ fontSize: 11.5, color: C.mt, minWidth: 30 }}>/{p.pot || p.ovr}</span>
                <Btn onClick={() => onTrain(p, attr)} disabled={!pre || scPts < 2} bg={C.gn} style={{ fontSize: 12.5, padding: "4px 12px", whiteSpace: "nowrap" , borderRadius: 999 }}>+1 {attrName}</Btn>
              </div>
            ))}
          </div>
          {trainTop.length > 5 && <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Player to train" style={{ flex: 1, minWidth: 0, background: "#ffffff0a", color: C.tx, border: 0, borderRadius: 12, padding: "7px 12px", fontSize: 13 }}>
              <option value="">Someone else…</option>
              {groupByPos(trainTop.slice(5)).map(([pos, ps]) => (
                <optgroup key={pos} label={POS_NAME[pos] || pos}>
                  {ps.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.ovr}{p.age <= 23 ? " · young" : ""}</option>)}
                </optgroup>
              ))}
            </Select>
            <Btn onClick={() => { const p = roster.find((x) => x.id === pick); if (p) { onTrain(p, attr); setPick(""); } }} disabled={!pre || !pick || scPts < 2} bg={C.gn} style={{ fontSize: 12.5, padding: "4px 12px", whiteSpace: "nowrap" , borderRadius: 999 }}>+1 {attrName}</Btn>
          </div>}
          {trained.length > 0 && <div style={{ fontSize: 12.5, color: C.mt, marginTop: 6 }}>Trained: {trained.map((p) => p.name).join(", ")}</div>}
        </div>
        <div style={{ ...panel, flex: "1 1 520px" }}>
          {head(`Extensions · ${extDone}/${expiring.length}`, "The new deal starts next season, so it has to fit next year's cap.")}
          {!expiring.length && <div style={{ fontSize: 13.5, color: C.mt }}>Nobody is in a contract year.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {(allExt ? expiring : expiring.slice(0, 5)).map((p) => (
              <div key={p.id} style={row}>
                <span onClick={() => setSel(p)} style={{ flex: 1, minWidth: 0, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} <span style={{ fontSize: 12, color: C.mt, fontWeight: 400 }}>{p.age}</span></span><Bdg pos={posTag(p)} />
                <span style={{ fontWeight: 900, color: oC(p.ovr) }}>{p.ovr}</span>
                {p.ext ? <span style={{ fontSize: 12.5, color: C.gn, fontWeight: 700, whiteSpace: "nowrap" }}>✓ {p.ext.yrs}y · {money(p.ext.apy ?? p.ext.sal)}</span>
                  : p.resigned?.yr === yr ? <span style={{ fontSize: 12.5, color: C.gn, fontWeight: 700, whiteSpace: "nowrap" }}>✓ {p.resigned.yrs}y · {money(p.resigned.sal)}</span>
                  : <><span style={{ fontSize: 12, color: C.mt, whiteSpace: "nowrap" }}>asks {money(yearlyAsk(p, 2, "extend"))}</span><Btn onClick={() => onExtend(p)} bg={C.gn} style={{ fontSize: 12.5, padding: "4px 12px" , borderRadius: 999 }}>Negotiate</Btn></>}
              </div>
            ))}
          </div>
          {more(allExt, setAllExt, expiring.length)}
        </div>
      </div>
    </div>
  );
}

// Phones: camp in the Home screen's look. A hero with your points, then each part of camp as a section
// of clean rows. Anything that spends points has its own button (never the whole row, so a scroll
// can't spend them), and the once-a-camp rookie boost asks first.
function PhoneCamp({ team, yr, scPts, games, risk, onRisk, onSimGame, onReport, onDevCamp, onTrain, onAutoTrain, battlesDone, onBattle, onBattleAll, otcFocus, onOtc, onExtend, setSel, roster, rookies, campUsed, trainable, trained, expiring, extDone, battles, openB, pre, trainTop, attr, setAttr, attrName }) {
  const [allTrain, setAllTrain] = useState(false), [allExt, setAllExt] = useState(false), [boost, setBoost] = useState(null);
  const soft = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
  const line = { display: "flex", alignItems: "center", gap: 10, minHeight: 58, padding: "6px 0" };
  const act = (on, primary) => ({ minHeight: 40, minWidth: 64, padding: "0 12px", borderRadius: 12, border: 0, background: on ? (primary ? C.gn : `${C.bl}33`) : "#ffffff0d", color: on ? (primary ? "#fff" : "#bfdbfe") : "#64748b", fontSize: 14, fontWeight: 900, cursor: on ? "pointer" : "default", whiteSpace: "nowrap", flexShrink: 0 });
  const who = (p, sub) => (
    <span onClick={() => setSel(p)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
      <span style={{ display: "block", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12, color: C.mt }}><Bdg pos={posTag(p)} /><b style={{ color: oC(p.ovr), fontSize: 13 }}>{p.ovr}</b>{sub}</span>
    </span>
  );
  const runN = Math.min(openB.length, scPts), autoN = Math.min(5, trainable.length, Math.floor(scPts / 2));
  return (
    <div>
      <Hero clr={team.clr} logo={team} eyebrow={pre ? "Preseason" : "Camp is closed"} title="Training Camp" sub={pre ? "Get the roster ready for week 1" : "It opens again next preseason"}
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: "#93c5fd" }}>{scPts}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>POINTS</div></div>} />

      <Section title={`Preseason games · ${games.length}/4`} action={games.length ? "Report" : null} onAction={onReport} style={{ marginTop: 18 }}>
        {games.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{games.map((g, i) => <span key={i} style={{ fontSize: 14, fontWeight: 800, padding: "6px 10px", borderRadius: 10, background: g.us > g.them ? "#14532d55" : "#7f1d1d55", color: g.us > g.them ? C.gn : "#fca5a5" }}>{g.us > g.them ? "W" : "L"} {g.us}–{g.them} {g.opp}</span>)}</div>}
        <button onClick={onSimGame} disabled={!pre || games.length >= 4} style={{ width: "100%", minHeight: 52, borderRadius: 14, border: 0, background: pre && games.length < 4 ? C.gn : "#ffffff12", color: pre && games.length < 4 ? "#fff" : "#64748b", fontSize: 17, fontWeight: 900, cursor: "pointer" }}>{games.length >= 4 ? "All four played" : "Play a preseason game"}</button>
        <div style={{ ...soft, marginTop: 10 }}>
          <div style={{ ...line, minHeight: 54 }}>
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>Starters play</span><span style={{ display: "block", fontSize: 12, color: C.mt }}>Sharper, but they can get hurt</span></span>
            <button onClick={onRisk} aria-pressed={risk} style={{ width: 56, height: 32, borderRadius: 16, border: 0, background: risk ? "#dc2626" : "#475569", position: "relative", cursor: "pointer", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: risk ? 27 : 3, width: 26, height: 26, borderRadius: 13, background: "#fff", transition: "left .15s" }} /></button>
          </div>
        </div>
      </Section>

      <Section title="Camp focus">
        <Pills full items={[["passing", "Passing"], ["rushing", "Run game"], ["defense", "Defense"]]} value={otcFocus} onChange={(k) => pre && onOtc(otcFocus === k ? null : k)} label="Camp focus" />
        <div style={{ fontSize: 13, color: C.mt, margin: "6px 2px 0" }}>The top five in that group gain +1 at season's end.</div>
      </Section>

      <Section title={`Position battles · ${battles.length - openB.length}/${battles.length}`} action={onBattleAll && openB.length > 0 && pre && runN > 0 ? `Run ${runN} · ${runN} SP` : null} onAction={() => onBattleAll(openB)}>
        <div style={soft}>
          {battles.map(([pos, top2], i) => { const done = battlesDone.includes(pos); return (
            <div key={pos} style={{ ...line, borderTop: i ? "1px solid #ffffff10" : 0 }}>
              <span style={{ width: 42, flexShrink: 0 }}><Bdg pos={pos} /></span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{top2[0].name.split(" ").slice(-1)[0]} <span style={{ color: C.mt, fontWeight: 600 }}>vs</span> {top2[1].name.split(" ").slice(-1)[0]}</span>
              {done ? <span style={{ color: C.gn, fontWeight: 900, fontSize: 15, minWidth: 64, textAlign: "center" }}>Done</span> : <button disabled={!pre || scPts < 1} onClick={() => onBattle(pos)} style={act(pre && scPts >= 1)}>Run · 1</button>}
            </div>
          ); })}
        </div>
      </Section>

      <Section title="Rookie camp · 3 SP">
        <div style={soft}>
          {campUsed && <div style={{ ...line, color: C.gn, fontWeight: 800 }}>Used{team.devCampPid ? ` on ${roster.find((p) => p.id === team.devCampPid)?.name || "a rookie"}` : ""}</div>}
          {!rookies.length && <div style={{ ...line, color: C.mt }}>No rookies or second-year players.</div>}
          {rookies.map((p, i) => { const max = p.ovr >= (p.pot || p.ovr), ok = pre && !campUsed && scPts >= 3 && !max; return (
            <div key={p.id} style={{ ...line, borderTop: i || campUsed ? "1px solid #ffffff10" : 0 }}>
              <Face s={p.face} sz={36} />
              {who(p, <>to {p.pot || p.ovr}</>)}
              <button disabled={!ok} onClick={() => setBoost(p)} style={act(ok)}>{max ? "Max" : "Boost"}</button>
            </div>
          ); })}
        </div>
      </Section>

      <Section title="Training · 2 SP" action={onAutoTrain && pre && autoN > 0 ? `Auto-pick ${autoN}` : null} onAction={() => onAutoTrain(5)}>
        <Chips items={ATTRS.map(([k, l]) => [k, l === "Acceleration" ? "Accel" : l])} value={attr} onChange={setAttr} />
        <div style={{ ...soft, marginTop: 10 }}>
          {(allTrain ? trainTop : trainTop.slice(0, 5)).map((p, i) => (
            <div key={p.id} style={{ ...line, borderTop: i ? "1px solid #ffffff10" : 0 }}>
              <Face s={p.face} sz={36} />
              {who(p, <>age {p.age} · to {p.pot || p.ovr}</>)}
              <button disabled={!pre || scPts < 2} onClick={() => onTrain(p, attr)} style={act(pre && scPts >= 2, true)}>+1</button>
            </div>
          ))}
        </div>
        {trainTop.length > 5 && <button onClick={() => setAllTrain((v) => !v)} style={{ width: "100%", minHeight: 44, marginTop: 8, borderRadius: 12, border: 0, background: "transparent", color: "#7dd3fc", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{allTrain ? "Top five only" : `Everyone (${trainTop.length})`}</button>}
        {trained.length > 0 && <div style={{ fontSize: 13, color: C.mt, margin: "4px 2px 0" }}>+1 {attrName} done for {trained.length} player{trained.length > 1 ? "s" : ""} this camp</div>}
      </Section>

      <Section title={`Extensions · ${extDone}/${expiring.length}`}>
        <div style={soft}>
          {!expiring.length && <div style={{ ...line, color: C.mt }}>Nobody is in a contract year.</div>}
          {(allExt ? expiring : expiring.slice(0, 5)).map((p, i) => (
            <div key={p.id} style={{ ...line, borderTop: i ? "1px solid #ffffff10" : 0 }}>
              <Face s={p.face} sz={36} />
              {who(p, p.ext ? <span style={{ color: C.gn }}>signed {p.ext.yrs}y · {money(p.ext.apy ?? p.ext.sal)}</span> : p.resigned?.yr === yr ? <span style={{ color: C.gn }}>signed {p.resigned.yrs}y · {money(p.resigned.sal)}</span> : <>asks {money(yearlyAsk(p, 2, "extend"))}</>)}
              {!p.ext && p.resigned?.yr !== yr && <button onClick={() => onExtend(p)} style={act(true)}>Talk</button>}
            </div>
          ))}
        </div>
        {expiring.length > 5 && <button onClick={() => setAllExt((v) => !v)} style={{ width: "100%", minHeight: 44, marginTop: 8, borderRadius: 12, border: 0, background: "transparent", color: "#7dd3fc", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{allExt ? "Top five only" : `Everyone (${expiring.length})`}</button>}
      </Section>

      {boost && (
        <Sheet title="Rookie camp" onClose={() => setBoost(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><Face s={boost.face} sz={52} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 20, fontWeight: 900 }}>{boost.name}</div><div style={{ fontSize: 14, color: "#94a3b8" }}>{posTag(boost)} · {boost.ovr} now, ceiling {boost.pot || boost.ovr}</div></div></div>
          <div style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.45, marginBottom: 12 }}>He gains up to +3. It's once a camp, so it can't go to anyone else this year.</div>
          <button onClick={() => { onDevCamp(boost); setBoost(null); }} style={{ width: "100%", minHeight: 54, borderRadius: 14, border: 0, background: C.gn, color: "#fff", fontSize: 17, fontWeight: 900, cursor: "pointer" }}>Boost him · 3 SP</button>
          <div style={{ height: 8 }} />
        </Sheet>
      )}
    </div>
  );
}
