// The trade screen, laid out like the original Gridiron GM: pick a team, tick players and
// picks on two big roster tables, and the summary tells you plainly whether they'd take it.
import Select from "./Select.jsx";
import React, { useState } from "react";
import { C, oC, Bdg, Face, TeamLogo, Section, Chips, Segments, Pills, pill, actBtn, card, cardTitle, field } from "./ui.jsx";
import RoleTag from "./RoleTag.jsx";
import { deadMoney, proration, yearsLeft } from "./bonus.js";
import { getCapPhase } from "./cap.js";

// Years left on his deal as of now (in the off-season his contract count hasn't ticked down yet).
const yrsLeft = (p) => { const { yr, sp } = getCapPhase(); return yearsLeft(p, yr, sp); };
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";
import { topNeeds, needGroup, needName } from "./needs.js";

// the defensive line is two positions here: edge rushers and interior tackles
const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "EDGE", "DT", "LB", "CB", "S", "K", "P"];
// Ways to order a roster (-1 = biggest first).
const SORTS = {
  ovr: { label: "Overall", key: (p) => p.ovr, dir: -1 },
  salary: { label: "Salary", key: (p) => +p.salary || 0, dir: -1 },
  years: { label: "Years left", key: (p) => yrsLeft(p), dir: -1 },
  val: { label: "Trade value", key: (p) => +p.tradeVal || 0, dir: -1 },
  age: { label: "Age", key: (p) => p.age, dir: 1 },
};
const money = (n) => `$${(+n || 0).toFixed(1)}M`;

// The league's best at one position (other clubs' players): pick one and he's loaded into a trade
// with his team.
function BestAt({ teams, ui, pos, setPos, onPick, setSel }) {
  const rows = teams.flatMap((t) => (t.id === ui ? [] : (t.roster || []).filter((p) => posTag(p) === pos).map((p) => ({ t, p })))).sort((a, b) => b.p.ovr - a.p.ovr || a.p.age - b.p.age).slice(0, 15);
  return (
    <div style={{ ...card, padding: "12px 14px" }}>
      <Pills quiet items={POS.map((x) => [x, x])} value={pos} onChange={setPos} label="Position" style={{ marginBottom: 8 }} />
      {rows.map(({ t, p }, i) => (
        <div key={p.id} className="calm-row" onClick={() => onPick(t, p)} title={`Trade for ${p.name}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 10px", cursor: "pointer" }}>
          <span style={{ width: 20, textAlign: "right", fontSize: 14, fontWeight: 800, color: "#64748b" }}>{i + 1}</span>
          <Face s={p.face} sz={38} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span onClick={(e) => { e.stopPropagation(); setSel(p); }} style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8" }}><TeamLogo t={t} sz={16} glow />{t.ab} · {p.age} · {money(p.salary)} × {yrsLeft(p)}</span>
          </span>
          <span title="Trade value" style={{ width: 60, textAlign: "right", fontSize: 14, color: "#94a3b8" }}>{p.tradeVal}</span>
          <b style={{ width: 36, textAlign: "right", fontSize: 18, color: oC(p.ovr) }}>{p.ovr}</b>
          <span className="calm-act" style={actBtn("#7dd3fc")}>Trade for him</span>
        </div>
      ))}
      {!rows.length && <div style={{ fontSize: 15, color: "#94a3b8", padding: 8 }}>No players at {pos} elsewhere in the league.</div>}
    </div>
  );
}

// One club's side of the deal: its players as calm rows (tap to add or take off), its picks last.
function Side({ title, color, team, players, picks, chosen, chosenPk, toggle, togglePk, pickVal, setSel }) {
  const [pos, setPos] = useState("ALL");
  const [sort, setSort] = useState("ovr");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const rows = [...(players || [])]
    .filter((p) => (pos === "ALL" || posTag(p) === pos) && (!needle || p.name.toLowerCase().includes(needle)))
    .sort((a, b) => SORTS[sort].dir * (SORTS[sort].key(a) - SORTS[sort].key(b)) || b.ovr - a.ovr);
  const tick = (on, c) => <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, border: on ? 0 : "2px solid #475569", background: on ? c : "transparent", color: "#fff", fontSize: 13, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{on ? "✓" : ""}</span>;
  return (
    <div style={{ ...card, padding: "14px 14px 8px", minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <TeamLogo t={team} sz={36} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: "#94a3b8" }}>{title}</span>
          <span style={{ display: "block", ...cardTitle, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{team.city} {team.name} <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>{team.w}-{team.l}{team.t ? `-${team.t}` : ""}</span></span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search players" style={{ ...field, flex: "1 1 100px", minWidth: 0 }} />
        <Select value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Position" style={field}>
          {["ALL", ...POS].map((x) => <option key={x} value={x}>{x === "ALL" ? "All positions" : x}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by" style={field}>
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>
      <div style={{ display: "flex", gap: 12, padding: "2px 8px 4px 2px", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, color: "#64748b" }}><span style={{ flex: 1 }} /><span style={{ width: 44, textAlign: "right" }} title="What he's worth in a trade">VALUE</span><span style={{ width: 30, textAlign: "right" }}>OVR</span></div>
      <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -6px" }}>
        {rows.map((p) => {
          const on = chosen.some((x) => x.id === p.id);
          return (
            <div key={p.id} className="calm-row" onClick={() => toggle(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 8px", cursor: "pointer", background: on ? `${color}1a` : undefined }}>
              {tick(on, color)}
              <Face s={p.face} sz={34} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span onClick={(e) => { e.stopPropagation(); setSel(p); }} style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}{p.injured && <span style={{ color: "#fca5a5", fontWeight: 700 }}> · hurt</span>}</span>
                <span style={{ display: "block", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{posTag(p)} · {p.age} · {money(p.salary)} × {yrsLeft(p)}</span>
              </span>
              <span title="Trade value" style={{ width: 44, textAlign: "right", fontSize: 14, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{p.tradeVal}</span>
              <b style={{ width: 30, textAlign: "right", fontSize: 17, color: oC(p.ovr) }}>{p.ovr}</b>
            </div>
          );
        })}
        {!rows.length && <div style={{ fontSize: 14, color: "#94a3b8", padding: 10 }}>{needle ? `No one named "${q.trim()}"` : "No players"}</div>}
        {!needle && pos === "ALL" && picks.length > 0 && <div style={{ ...cardTitle, fontSize: 15, padding: "12px 8px 4px" }}>Draft picks</div>}
        {!needle && pos === "ALL" && picks.map((pk) => {
          const on = chosenPk.some((x) => x.id === pk.id);
          return (
            <div key={pk.id} className="calm-row" onClick={() => togglePk(pk)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px", cursor: "pointer", background: on ? `${C.gd}1a` : undefined }}>
              {tick(on, C.gd)}
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800 }}>{pk.yr || ""} round {pk.rd}{pk.overall ? <span style={{ color: "#94a3b8", fontWeight: 600 }}> · #{pk.overall}</span> : null}{pk.orig !== team.id ? <span style={{ color: "#64748b", fontWeight: 600 }}> · via {pk.origAb}</span> : null}</span>
              <span title="Trade value" style={{ fontSize: 14, color: "#94a3b8" }}>{Math.round(pickVal(pk))}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TradeScreen({ teams, ui, trTm, setTrTm, trOff, setTrOff, draftPicks: thisDraft, futurePicks = [], pickVal, evalTr, execTr, setSel, capSpace, closed, modes, yr, sp }) {
  const me = teams[ui];
  // this year's picks, then the next three drafts'
  const draftPicks = [...thisDraft, ...futurePicks];
  const [view, setView] = useState("teams");
  const [bpos, setBpos] = useState("QB");
  const [side, setSide] = useState("them"), [tpos, setTpos] = useState("NEEDS"); // phones
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
    : accept && ev.close ? [`A little short, but they'd take it${ev.close.length ? `: ${ev.close.join("; ")}` : ""}`, C.gd]
    : accept ? [ev.over ? "They'd accept — but you're overpaying" : "They'd accept this trade", C.gn]
    : [`They want about ${ev.gap} more value`, C.rd];
  const pick = (id) => { setTrTm(id); setTrOff({ g: [], r: [], gPk: [], rPk: [] }); };
  const pkLabel = (pk) => `${pk.yr || ""} Rd ${pk.rd}${pk.overall ? ` #${pk.overall}` : ""}`;
  // Left of centre: short of what they ask. Right: comfortably over it.
  const meter = Math.max(-1, Math.min(1, (ev.gv - ev.ask) / Math.max(40, ev.ask)));

  if (MOBILE) {
    const open = (t, p) => { setTrTm(t.id); setTrOff({ g: [], r: p ? [p] : [], gPk: [], rPk: [] }); setSide("them"); };
    if (!them) {
      const needs = topNeeds(me.roster, 3);
      const targets = teams.filter((t) => t.id !== ui).flatMap((t) => t.roster.filter((p) => !p.injured && (tpos === "NEEDS" ? needs.includes(needGroup(p)) : posTag(p) === tpos)).map((p) => ({ p, t }))).sort((a, b) => b.p.ovr - a.p.ovr || a.p.age - b.p.age).slice(0, 8);
      return (
        <div>
          {/* no hero: the section's chips and the deadline bar already head the screen; the cap space rides on the first title */}
          <Section title={<span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>Targets<span style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>{money(capSpace(me))} in cap space</span></span>} style={{ marginTop: 4 }}>
            <Chips items={[["NEEDS", "Your needs"], ...POS.map((x) => [x, x])]} value={tpos} onChange={setTpos} />
            <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", margin: "12px -8px 0", padding: "0 8px 4px", scrollPaddingLeft: 8 }}>
              {targets.map(({ p, t }) => (
                <button key={p.id} onClick={() => open(t, p)} style={{ flex: "0 0 70%", minWidth: 0, scrollSnapAlign: "start", background: "#ffffff0f", border: 0, borderRadius: 18, padding: 12, textAlign: "left", color: "#fff", cursor: "pointer", whiteSpace: "normal" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Face s={p.face} sz={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#94a3b8", marginTop: 2 }}><TeamLogo t={t} sz={18} />{t.ab} · Age {p.age}</div>
                    </div>
                    <b style={{ fontSize: 28, color: oC(p.ovr) }}>{p.ovr}</b>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}><Bdg pos={posTag(p)} /><RoleTag p={p} /><span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: "#cbd5e1" }}>{money(p.salary)} · {yrsLeft(p)}y</span></div>
                </button>
              ))}
              {!targets.length && <div style={{ color: C.mt, fontSize: 14, padding: "8px 2px" }}>Nobody to show.</div>}
            </div>
          </Section>
          <Section title="Pick a team">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {teams.filter((t) => t.id !== ui).sort((a, b) => a.city.localeCompare(b.city)).map((t) => { const m = modes?.[t.id]; return (
                <button key={t.id} onClick={() => open(t)} aria-label={`Trade with the ${t.city} ${t.name}`} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0 7px", background: m === "buyer" ? "#22c55e14" : m === "seller" ? "#eab30814" : "#ffffff0f", border: 0, borderRadius: 16, color: "#e2e8f0", cursor: "pointer" }}>
                  <TeamLogo t={t} sz={30} /><b style={{ fontSize: 13 }}>{t.ab}</b>
                  {/* buying or selling in words under the club, so you can tell at a glance */}
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.6, color: m === "buyer" ? C.gn : m === "seller" ? C.gd : "#64748b" }}>{m === "buyer" ? "BUYING" : m === "seller" ? "SELLING" : `${t.w}-${t.l}`}</span>
                </button>
              ); })}
            </div>
            {modes && Object.values(modes).some((v) => v !== "neutral") && <div style={{ fontSize: 14, color: C.mt, marginTop: 10, textAlign: "center" }}>Buyers want win-now help; sellers will move veterans for picks.</div>}
          </Section>
        </div>
      );
    }
    const pill = (x, key, label, clr) => <button key={x.id} onClick={() => flip(key, x)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", minHeight: 36, background: "transparent", border: 0, padding: 0, color: "#fff", fontSize: 14, cursor: "pointer", textAlign: "left" }}><span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span><span style={{ color: clr, fontSize: 14 }}>✕</span></button>;
    const list = (ps, pks, key, pkKey, clr, empty) => <>{ps.map((p) => pill(p, key, <><b>{p.name.split(" ").slice(-1)[0]}</b> <span style={{ color: oC(p.ovr) }}>{p.ovr}</span></>, clr))}{pks.map((pk) => pill(pk, pkKey, <b>{pkLabel(pk)}</b>, clr))}{!ps.length && !pks.length && <div style={{ fontSize: 14, color: C.mt, padding: "6px 0" }}>{empty}</div>}</>;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 14px" }}>
          <button onClick={() => pick(null)} aria-label="All teams" style={{ width: 40, height: 40, borderRadius: 20, border: 0, background: "#ffffff0f", color: "#fff", fontSize: 20, cursor: "pointer" }}>‹</button>
          <TeamLogo t={them} sz={36} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 20, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{them.name}</div><div style={{ fontSize: 14, color: C.mt }}>{them.w}-{them.l}{modes?.[them.id] ? ` · ${modes[them.id] === "buyer" ? "buying" : "selling"}` : ""}</div></div>
        </div>
        <Segments items={[["them", `${them.ab} players`], ["me", "Your players"]]} value={side} onChange={setSide} />
        {side === "them"
          ? <PhoneSide key="them" team={them} players={them.roster} picks={draftPicks.filter((pk) => pk.owner === trTm).map(withAb)} chosen={trOff.r} chosenPk={trOff.rPk} toggle={(p) => flip("r", p)} togglePk={(pk) => flip("rPk", pk)} pickVal={pickVal} color={C.gn} />
          : <PhoneSide key="me" team={me} players={me.roster} picks={draftPicks.filter((pk) => pk.owner === ui).map(withAb)} chosen={trOff.g} chosenPk={trOff.gPk} toggle={(p) => flip("g", p)} togglePk={(pk) => flip("gPk", pk)} pickVal={pickVal} color={C.rd} />}
        <div style={{ height: 150 }} />
        {/* the deal, pinned by your thumb while you browse the rosters */}
        <div className="keep-dark" style={{ position: "fixed", left: 0, right: 0, bottom: "calc(58px + env(safe-area-inset-bottom))", zIndex: 396, background: "#0d1424", borderTop: "1px solid #ffffff14", padding: "12px 14px 10px", boxShadow: "0 -10px 30px #0008" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ minWidth: 0 }}><div style={{fontSize: 14, fontWeight: 800, color: "#fca5a5" }}>You send</div>{list(trOff.g, trOff.gPk, "g", "gPk", "#fca5a5", "Tap your players")}</div>
            <div style={{ minWidth: 0 }}><div style={{fontSize: 14, fontWeight: 800, color: "#86efac" }}>You get</div>{list(trOff.r, trOff.rPk, "r", "rPk", "#86efac", "Tap their players")}</div>
          </div>
          {any && <div style={{ position: "relative", height: 6, background: "#ffffff14", borderRadius: 3, margin: "8px 0 0" }}>
            <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 2, background: "#94a3b8" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 3, background: meter >= 0 ? C.gn : C.rd, left: meter >= 0 ? "50%" : `${50 + meter * 50}%`, width: `${Math.abs(meter) * 50}%` }} />
          </div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: verdict ? verdict[1] : C.mt, lineHeight: 1.25 }}>{verdict ? verdict[0] : "Build a deal"}</div>
              {any && !accept && <button onClick={balance} style={{ background: "transparent", border: 0, padding: 0, marginTop: 2, color: "#7dd3fc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>What would make this work?</button>}
              {any && accept && <div style={{ fontSize: 12, color: C.mt, marginTop: 2 }}>Cap after: {money(capAfter)}</div>}
            </div>
            <button onClick={execTr} disabled={!accept || closed} style={{ minHeight: 48, padding: "0 20px", borderRadius: 14, border: 0, background: accept && !closed ? C.gn : "#ffffff14", color: accept && !closed ? "#fff" : "#64748b", fontSize: 16, fontWeight: 900, cursor: accept && !closed ? "pointer" : "default", whiteSpace: "nowrap" }}>{closed ? "Closed" : "Propose"}</button>
          </div>
        </div>
      </div>
    );
  }
  const chip = (x, key, label) => (
    <span key={x.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ffffff0f", borderRadius: 99, padding: "4px 6px 4px 12px", fontSize: 13.5 }}>
      {label}<button onClick={() => flip(key, x)} aria-label="Remove" style={{ width: 22, height: 22, borderRadius: 11, background: "#ffffff14", border: 0, color: "#cbd5e1", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
    </span>
  );
  const plabel = (p) => <><b>{p.name}</b> <span style={{ color: "#94a3b8" }}>{posTag(p)}</span> <b style={{ color: oC(p.ovr) }}>{p.ovr}</b></>;
  return (
    <div>
      {them ? <>
        {/* the deal: what goes, what comes, whether they'd take it, and the one button */}
        <div style={{ ...card, padding: "12px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <button onClick={() => pick(null)} title="Pick a different team" style={{ ...pill(false), color: "#94a3b8", background: "#ffffff0d" }}>‹ All teams</button>
            <span style={{ ...cardTitle, flex: 1 }}>The deal</span>
            <span style={{ fontSize: 14, color: "#94a3b8" }}>Cap space <b style={{ color: capSpace(me) >= 0 ? "#86efac" : "#fca5a5" }}>{money(capSpace(me))}</b>{any && <> · after <b style={{ color: capAfter >= 0 ? "#86efac" : "#fca5a5" }}>{money(capAfter)}</b>{dead.now + dead.next > 0.05 && <span title={`${money(dead.now)} dead money${dead.next > 0.05 ? `, ${money(dead.next)} next year` : ""}`}> (incl. {money(dead.now)} dead)</span>}</>}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: "#fca5a5", marginBottom: 6 }}>YOU SEND <span style={{ color: "#64748b" }}>· worth {ev.gv} to them</span></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trOff.g.map((p) => chip(p, "g", plabel(p)))}
                {trOff.gPk.map((pk) => chip(pk, "gPk", <b>{pkLabel(pk)}</b>))}
                {!trOff.g.length && !trOff.gPk.length && <span style={{ color: "#64748b", fontSize: 14 }}>Pick players or picks from your side</span>}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: "#86efac", marginBottom: 6 }}>YOU GET <span style={{ color: "#64748b" }}>· worth {ev.rv}{ev.ask > ev.rv ? `, they ask ${ev.ask}` : ""}</span></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trOff.r.map((p) => chip(p, "r", plabel(p)))}
                {trOff.rPk.map((pk) => chip(pk, "rPk", <b>{pkLabel(pk)}</b>))}
                {!trOff.r.length && !trOff.rPk.length && <span style={{ color: "#64748b", fontSize: 14 }}>Pick players or picks from their side</span>}
              </div>
            </div>
          </div>
          {any && <div title="Left of the line: short of their asking price. Right: more than enough." style={{ position: "relative", height: 6, background: "#ffffff12", borderRadius: 3, margin: "12px 0 0" }}>
            <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "#94a3b8" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 3, background: meter >= 0 ? C.gn : C.rd, left: meter >= 0 ? "50%" : `${50 + meter * 50}%`, width: `${Math.abs(meter) * 50}%` }} />
          </div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: verdict ? verdict[1] : "#94a3b8" }}>{verdict ? verdict[0] : `Build a deal with the ${them.name}`}</span>
              {(ev.why && !accept) || ev.notes?.length > 0 ? <span style={{ display: "block", fontSize: 13, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={[ev.why, ...(ev.notes || [])].filter(Boolean).join("; ")}>{ev.why && !accept ? ev.why : `How they see it: ${ev.notes.slice(0, 3).join("; ")}.`}</span> : null}
            </span>
            {any && !accept && <button onClick={balance} style={actBtn("#7dd3fc")}>What would make this work?</button>}
            {any && <button onClick={() => setTrOff({ g: [], r: [], gPk: [], rPk: [] })} style={actBtn("#94a3b8")}>Clear</button>}
            <button onClick={execTr} disabled={!accept || closed} style={{ ...actBtn(C.gn, accept && !closed), padding: "8px 20px", fontSize: 14.5, ...(accept && !closed ? null : { color: "#64748b", cursor: "default" }) }}>{closed ? "Trade deadline passed" : "Propose trade"}</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, height: "calc(100vh - 360px)", minHeight: 380 }}>
          <Side title="YOU SEND" color={C.rd} team={me} players={me.roster} picks={draftPicks.filter((pk) => pk.owner === ui).map(withAb)} chosen={trOff.g} chosenPk={trOff.gPk} toggle={(p) => flip("g", p)} togglePk={(pk) => flip("gPk", pk)} pickVal={pickVal} setSel={setSel} />
          <Side title="YOU GET" color={C.gn} team={them} players={them.roster} picks={draftPicks.filter((pk) => pk.owner === trTm).map(withAb)} chosen={trOff.r} chosenPk={trOff.rPk} toggle={(p) => flip("r", p)} togglePk={(pk) => flip("rPk", pk)} pickVal={pickVal} setSel={setSel} />
        </div>
      </> : (<>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Pills items={[["teams", "Pick a club"], ["best", "League's best by position"]]} value={view} onChange={setView} label="Browse" />
          <span style={{ marginLeft: "auto", fontSize: 14, color: "#94a3b8" }}>Your cap space <b style={{ color: capSpace(me) >= 0 ? "#86efac" : "#fca5a5" }}>{money(capSpace(me))}</b></span>
        </div>
        {view === "best" ? <BestAt teams={teams} ui={ui} pos={bpos} setPos={setBpos} onPick={(t, p) => { setTrTm(t.id); setTrOff({ g: [], r: [p], gPk: [], rPk: [] }); }} setSel={setSel} /> : <>
          {/* a grid of logos beats a 31-line dropdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}>
            {teams.filter((t) => t.id !== ui).sort((a, b) => a.city.localeCompare(b.city)).map((t) => {
              const m = modes?.[t.id], cs = capSpace(t);
              return (
                <button key={t.id} className="calm-row" onClick={() => pick(t.id)} title={`${t.city} ${t.name} · ${cs < 0 ? "over the cap" : `${money(cs)} in cap space`}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "9px 4px 8px", background: C.cd, border: 0, borderRadius: 16, color: "#e2e8f0", cursor: "pointer" }}>
                  <TeamLogo t={t} sz={30} glow />
                  <b style={{ fontSize: 14 }}>{t.ab} <span style={{ color: "#64748b", fontWeight: 600 }}>{t.w}-{t.l}</span></b>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m === "buyer" ? "#86efac" : m === "seller" ? "#fde68a" : "#64748b" }}>{m === "buyer" ? "Buying" : m === "seller" ? "Selling" : cs < 0 ? "Over the cap" : money(cs)}</span>
                </button>
              );
            })}
          </div>
          {(() => {
            // under the logos: the best players around the league at the spots you need most
            const needs = topNeeds(me.roster, 3);
            if (!needs.length) return null;
            return (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${needs.length}, minmax(0, 1fr))`, gap: 14, marginTop: 16 }}>
                {needs.map((pos) => {
                  const list = teams.filter((t) => t.id !== ui).flatMap((t) => t.roster.filter((p) => needGroup(p) === pos && !p.injured).map((p) => ({ p, t }))).sort((a, b) => b.p.ovr - a.p.ovr).slice(0, 4);
                  return (
                    <div key={pos} style={{ ...card, padding: "14px 16px" }}>
                      <div style={{ ...cardTitle, marginBottom: 6, textTransform: "capitalize" }}>{needName(pos)}</div>
                      {list.map(({ p, t }) => (
                        <div key={p.id} className="calm-row" onClick={() => { setTrTm(t.id); setTrOff({ g: [], r: [p], gPk: [], rPk: [] }); }} title={`Open a trade with the ${t.name} for ${p.name}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", margin: "0 -8px", cursor: "pointer" }}>
                          <Face s={p.face} sz={30} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#94a3b8" }}><TeamLogo t={t} sz={14} />{t.ab} · {p.age} · {money(p.salary)}</span>
                          </span>
                          <b style={{ fontSize: 17, color: oC(p.ovr) }}>{p.ovr}</b>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>}
      </>)}
    </div>
  );
}

// Phones: one roster at a time as clean rows; a tap adds him to the deal (or takes him off). Picks
// come last.
function PhoneSide({ team, players, picks, chosen, chosenPk, toggle, togglePk, pickVal, color }) {
  const [pos, setPos] = useState("ALL");
  const rows = [...(players || [])].filter((p) => pos === "ALL" || posTag(p) === pos).sort((a, b) => b.ovr - a.ovr);
  const tick = (on) => <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, border: on ? 0 : "2px solid #475569", background: on ? color : "transparent", color: "#fff", fontSize: 14, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{on ? "✓" : ""}</span>;
  return (
    <div>
      <Chips items={[["ALL", "All"], ...POS.map((x) => [x, x])]} value={pos} onChange={setPos} />
      <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px", marginTop: 10 }}>
        {rows.map((p, i) => { const on = chosen.some((x) => x.id === p.id); return (
          <button key={p.id} onClick={() => toggle(p)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 62, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: "8px 0", color: C.tx, cursor: "pointer", whiteSpace: "normal" }}>
            {tick(on)}
            <Face s={p.face} sz={36} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f1f5f9" }}>{p.name}{p.injured && <span style={{ color: C.rd, marginLeft: 6 }}>+</span>}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12, color: "#94a3b8" }}><Bdg pos={posTag(p)} /><RoleTag p={p} />{money(p.salary)} · {yrsLeft(p)}y</span>
            </span>
            <b style={{ fontSize: 20, color: oC(p.ovr) }}>{p.ovr}</b>
          </button>
        ); })}
        {!rows.length && <div style={{ padding: "16px 0", color: C.mt, fontSize: 14 }}>Nobody here.</div>}
      </div>
      {pos === "ALL" && picks.length > 0 && <>
        <div style={{ fontSize: 20, fontWeight: 900, margin: "22px 2px 10px" }}>Draft picks</div>
        <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px" }}>
          {picks.map((pk, i) => { const on = chosenPk.some((x) => x.id === pk.id); return (
            <button key={pk.id} onClick={() => togglePk(pk)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 54, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, color: C.tx, cursor: "pointer" }}>
              {tick(on)}
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800 }}>{pk.yr || ""} Round {pk.rd}{pk.overall ? ` · #${pk.overall}` : ""}{pk.orig !== team.id && <span style={{ color: C.mt, fontWeight: 600, fontSize: 14 }}> via {pk.origAb}</span>}</span>
            </button>
          ); })}
        </div>
      </>}
    </div>
  );
}
