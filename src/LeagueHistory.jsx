// League history, one section at a time: the Super Bowl champions, the award winners year by year,
// career leaders since the league began, the Hall of Fame and notable retirements.
import React, { useState } from "react";
import { C, TeamLogo, Face, oC, Pills, card as cardBase } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { CAREER_STATS, careerLeaders, retiredCard } from "./history.js";
import { sbName, sbNumber } from "./data/superbowls.js";
import { posTag } from "./dline.js";

const AW = [["mvp", "Most Valuable Player"], ["opoy", "Offensive Player"], ["dpoy", "Defensive Player"], ["oroy", "Offensive Rookie"], ["droy", "Defensive Rookie"], ["cpoy", "Comeback Player"], ["coy", "Coach of the Year"], ["sbmvp", "Super Bowl MVP"]];
const AW_SHORT = { mvp: "MVP", opoy: "OPOY", dpoy: "DPOY", oroy: "OROY", droy: "DROY", cpoy: "CPOY", coy: "COY", sbmvp: "SB MVP" };
const num = (v) => (Number.isInteger(v) ? v.toLocaleString("en-US") : (+v).toFixed(1));
const SECTIONS = [["champs", "Champions"], ["awards", "Awards"], ["leaders", "Career leaders"], ["hof", "Hall of Fame"], ["retired", "Retirements"]];

export default function LeagueHistory({ teams, champs = [], awards = [], retired = [], yr, ui, setSel, findPlayer }) {
  const [sec, setSec] = useState("champs");
  const [stat, setStat] = useState("passYds");
  const years = [...new Set(awards.map((a) => a.yr))].sort((a, b) => b - a);
  const [awYr, setAwYr] = useState(years[0]);
  const card = cardBase;
  const team = (ab) => teams.find((t) => t.ab === ab);
  const retiredById = new Map(retired.map((r) => [r.id, r]));
  // a player wherever he is now: on a roster, or retired (his saved card)
  const who = (pid) => { const p = pid != null && findPlayer(pid); if (p) return p; const r = retiredById.get(pid); return r ? retiredCard(r) : null; };
  const open = (pid) => { const p = who(pid); if (p && setSel) setSel(p); };
  const titles = champs.filter((c) => typeof c === "object" && c.yr).sort((a, b) => b.yr - a.yr);
  const myTitles = titles.filter((c) => c.ti === ui).length;
  const hof = retired.filter((r) => r.hof).sort((a, b) => b.hofClass - a.hofClass || b.legacy - a.legacy);
  const notable = retired.filter((r) => !r.hof).sort((a, b) => b.retYr - a.retYr || b.legacy - a.legacy).slice(0, 40);
  const empty = (t) => <div style={{ ...card, textAlign: "center", color: C.mt, fontSize: 14, padding: 28 }}>{t}</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        {MOBILE && <div style={{ fontSize: 28, fontWeight: 900 }}>League History</div>}
        <div style={{ fontSize: 14, color: C.mt }}>Since your league began in 2026 · {titles.length} Super Bowl{titles.length === 1 ? "" : "s"} played{myTitles ? ` · ${myTitles} yours` : ""} · {hof.length} Hall of Famer{hof.length === 1 ? "" : "s"}</div>
      </div>
      <Pills big items={SECTIONS} value={sec} onChange={setSec} label="League history" style={{ margin: "10px 0 12px" }} />

      {sec === "champs" && (titles.length ? <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
        {titles.map((c) => { const t = teams[c.ti], o = c.opp != null ? teams[c.opp] : null, mine = c.ti === ui; return (
          <div key={c.yr} style={{ ...card, display: "flex", alignItems: "center", gap: 12, background: mine ? "linear-gradient(135deg,#78350f55,#111827)" : "#111827" }}>
            {t && <TeamLogo t={t} sz={48} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fcd34d" }}>{sbName(sbNumber(c.yr))} · {c.yr}</div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{c.t}</div>
              <div style={{ fontSize: 14, color: C.mt }}>{o ? `beat the ${o.name}` : ""}{c.score ? ` ${c.score}` : ""}{mine ? " · yours" : ""}</div>
            </div>
          </div>); })}
      </div> : empty("No Super Bowl has been played in your league yet."))}

      {sec === "awards" && (years.length ? <>
        <Pills quiet items={years.map((y) => [y, String(y)])} value={awYr} onChange={setAwYr} label="Season" style={{ marginBottom: 10 }} />
        {(() => { const a = awards.find((x) => x.yr === awYr) || {}; return (
          <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 10 }}>
            {AW.map(([k, l]) => { const w = a[k], p = w && who(w.pid), t = w && teams[w.ti]; return (
              <div key={k} onClick={w ? () => open(w.pid) : undefined} style={{ ...card, display: "flex", alignItems: "center", gap: 12, cursor: w && p ? "pointer" : "default", background: w?.ti === ui ? "linear-gradient(135deg,#14532d55,#111827)" : "#111827" }}>
                {p ? <Face s={p.face} sz={52} /> : <div style={{ width: 52 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: k === "sbmvp" ? "#fcd34d" : "#7dd3fc" }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w ? w.name : "—"}</div>
                  {w && <div style={{ fontSize: 14, color: C.mt }}>{posTag(w)}{t ? ` · ${t.city} ${t.name}` : ""}{w.stat ? ` · ${w.stat}` : ""}</div>}
                </div>
                {t && <TeamLogo t={t} sz={30} />}
              </div>); })}
          </div>); })()}
      </> : empty("Awards are handed out after the Super Bowl."))}

      {sec === "leaders" && <>
        <Pills quiet items={CAREER_STATS.map((c) => [c.key, c.label])} value={stat} onChange={setStat} label="Stat" style={{ marginBottom: 10 }} />
        {(() => { const leaders = careerLeaders(teams, retired, stat, 10); return leaders.length ? <div style={card}>
          {leaders.map((r, i) => { const p = who(r.id), t = team(r.team); return (
            <div key={r.id} onClick={p ? () => open(r.id) : undefined} className="calm-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px", cursor: p ? "pointer" : "default" }}>
              <b style={{ width: 24, fontSize: 16, color: i < 3 ? "#fcd34d" : C.mt }}>{i + 1}</b>
              {p ? <Face s={p.face} sz={34} /> : <span style={{ width: 34 }} />}
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800 }}>{r.name}</div><div style={{ fontSize: 12, color: C.mt, display: "flex", gap: 6, alignItems: "center" }}>{posTag(r)} · {r.active ? `active · ${r.team}` : `retired ${r.retYr} · ${r.team}`}</div></div>
              {t && <TeamLogo t={t} sz={24} glow />}
              <b style={{ fontSize: 20, minWidth: 70, textAlign: "right" }}>{num(r.v)}</b>
            </div>); })}
        </div> : empty("Career totals start counting with your league's first games."); })()}
      </>}

      {sec === "hof" && (hof.length ? <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
        {hof.map((r) => { const c = retiredCard(r), in_ = r.hofClass <= yr; return (
          <div key={r.id} onClick={setSel ? () => setSel(c) : undefined} title="Open his player card" style={{ ...card, cursor: "pointer", background: in_ ? "linear-gradient(160deg,#3b2a0a,#111827 70%)" : "#111827" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Face s={c.face} sz={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: in_ ? "#fcd34d" : C.mt }}>{in_ ? `Class of ${r.hofClass}` : `Enshrined ${r.hofClass}`}</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.mt, display: "flex", gap: 6, alignItems: "center" }}>{posTag(r)} · {r.team} · retired {r.retYr} at {r.age}</div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 900, color: oC(r.peak) }}>{r.peak}</div><div style={{ fontSize: 12, color: C.mt, fontWeight: 700 }}>peak</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>{[...Object.entries(r.won || {}).map(([k, ys]) => `${ys.length}× ${AW_SHORT[k] || k.toUpperCase()}`), ...CAREER_STATS.filter((s) => (r.career?.[s.key] || 0) >= s.per * 2).map((s) => `${num(r.career[s.key])} ${s.label.toLowerCase()}`)].join(" · ") || "A legendary career"}</div>
          </div>); })}
      </div> : empty("Nobody has been elected yet. Great careers earn a place when the player retires (legacy 60+), and he's enshrined five years later."))}

      {sec === "retired" && (notable.length ? <div style={card}>
        {notable.map((r, i) => { const c = retiredCard(r); return (
          <div key={r.id} onClick={setSel ? () => setSel(c) : undefined} className="calm-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px", cursor: "pointer" }}>
            <b style={{ width: 44, color: C.mt }}>{r.retYr}</b>
            <Face s={c.face} sz={34} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800 }}>{r.name}</div><div style={{ fontSize: 12, color: C.mt, display: "flex", gap: 6, alignItems: "center" }}>{posTag(r)} · {r.team} · {r.seasons} season{r.seasons > 1 ? "s" : ""} in the league · legacy {r.legacy}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 900, color: oC(r.peak) }}>{r.peak}</div><div style={{ fontSize: 12, color: C.mt, fontWeight: 700 }}>peak</div></div>
          </div>); })}
      </div> : empty("No notable retirements yet."))}
    </div>
  );
}
