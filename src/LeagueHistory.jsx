// League history: every Super Bowl champion, the award winners year by year, career leaders
// since the league began, and the Hall of Fame.
import React, { useState } from "react";
import { C, TeamLogo, Bdg } from "./ui.jsx";
import { CAREER_STATS, careerLeaders } from "./history.js";
import { sbName, sbNumber } from "./data/superbowls.js";

const AW = [["mvp", "MVP"], ["opoy", "OPOY"], ["dpoy", "DPOY"], ["oroy", "OROY"], ["droy", "DROY"], ["sbmvp", "SB MVP"]];
const num = (v) => (Number.isInteger(v) ? v.toLocaleString("en-US") : (+v).toFixed(1));

export default function LeagueHistory({ teams, champs = [], awards = [], retired = [], yr, ui, setSel, findPlayer }) {
  const [stat, setStat] = useState("passYds");
  const panel = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 14, marginBottom: 12 };
  const head = { fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#fcd34d", marginBottom: 10 };
  const open = (pid) => { const p = pid && findPlayer(pid); if (p) setSel(p); };
  const titles = champs.filter((c) => typeof c === "object" && c.yr).sort((a, b) => b.yr - a.yr);
  const years = [...new Set(awards.map((a) => a.yr))].sort((a, b) => b - a);
  const leaders = careerLeaders(teams, retired, stat, 10);
  const hof = retired.filter((r) => r.hof).sort((a, b) => b.hofClass - a.hofClass || b.legacy - a.legacy);
  const notable = retired.filter((r) => !r.hof).sort((a, b) => b.retYr - a.retYr || b.legacy - a.legacy).slice(0, 12);
  const team = (ab) => teams.find((t) => t.ab === ab);
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ fontSize: 26, fontWeight: 900 }}>League History</div>
      <div style={{ fontSize: 14, color: C.mt, marginBottom: 12 }}>Champions, award winners, career leaders and the Hall of Fame since your league began in 2026.</div>

      <div style={panel}>
        <div style={head}>🏆 SUPER BOWL CHAMPIONS</div>
        {titles.map((c) => (
          <div key={c.yr} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.bd}66`, background: c.ti === ui ? "#22c55e12" : "transparent" }}>
            <b style={{ width: 44 }}>{c.yr}</b>
            {teams[c.ti] && <TeamLogo t={teams[c.ti]} sz={28} />}
            <div style={{ flex: 1, minWidth: 0, fontSize: 15 }}><b>{c.t}</b>{c.opp != null && teams[c.opp] ? <span style={{ color: C.mt }}> beat the {teams[c.opp].name}{c.score ? ` ${c.score}` : ""}</span> : null}</div>
            <span style={{ fontSize: 12, color: C.mt }}>{sbName(sbNumber(c.yr))}</span>
          </div>
        ))}
        {!titles.length && <div style={{ fontSize: 14, color: C.mt }}>No Super Bowl has been played in your league yet.</div>}
      </div>

      <div style={panel}>
        <div style={head}>🏅 AWARD WINNERS</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 13 }}>
            <thead><tr><th style={{ textAlign: "left", color: C.mt, padding: 4 }}>YEAR</th>{AW.map(([, l]) => <th key={l} style={{ textAlign: "left", color: C.mt, padding: 4 }}>{l}</th>)}</tr></thead>
            <tbody>
              {years.map((y) => { const a = awards.find((x) => x.yr === y) || {}; return (
                <tr key={y} style={{ borderTop: `1px solid ${C.bd}66` }}>
                  <td style={{ padding: "6px 4px", fontWeight: 800 }}>{y}</td>
                  {AW.map(([k]) => <td key={k} style={{ padding: "6px 4px" }}>{a[k] ? <span onClick={() => open(a[k].pid)} style={{ cursor: "pointer" }}><b>{a[k].name}</b> <span style={{ color: C.mt }}>{a[k].pos} · {teams[a[k].ti]?.ab || a[k].team || ""}</span></span> : <span style={{ color: C.mt }}>—</span>}</td>)}
                </tr>); })}
            </tbody>
          </table>
          {!years.length && <div style={{ fontSize: 14, color: C.mt }}>Awards are handed out after the Super Bowl.</div>}
        </div>
      </div>

      <div style={panel}>
        <div style={{ ...head, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>📊 CAREER LEADERS <span style={{ color: C.mt, fontWeight: 600, letterSpacing: 0 }}>(in your league)</span>
          <select value={stat} onChange={(e) => setStat(e.target.value)} style={{ marginLeft: "auto", background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "4px 8px", fontSize: 13 }}>
            {CAREER_STATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        {leaders.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.bd}66` }}>
            <b style={{ width: 24, color: C.mt }}>{i + 1}</b>
            {team(r.team) ? <TeamLogo t={team(r.team)} sz={22} /> : <span style={{ width: 22 }} />}
            <Bdg pos={r.pos} />
            <span onClick={() => r.active && open(r.id)} style={{ flex: 1, fontWeight: 800, cursor: r.active ? "pointer" : "default" }}>{r.name}{!r.active && <span style={{ fontSize: 11, color: C.mt, fontWeight: 600 }}> · retired {r.retYr}</span>}</span>
            <b style={{ fontSize: 16 }}>{num(r.v)}</b>
          </div>
        ))}
        {!leaders.length && <div style={{ fontSize: 14, color: C.mt }}>Career totals start counting with your league's first games.</div>}
      </div>

      <div style={{ ...panel, borderColor: "#d4a01788" }}>
        <div style={head}>🏛️ HALL OF FAME</div>
        {hof.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.bd}66` }}>
            <span style={{ width: 92, fontSize: 12, fontWeight: 800, color: r.hofClass <= yr ? "#fcd34d" : C.mt }}>{r.hofClass <= yr ? `Class of ${r.hofClass}` : `Enshrined ${r.hofClass}`}</span>
            <Bdg pos={r.pos} />
            <div style={{ flex: 1, minWidth: 0 }}><b>{r.name}</b> <span style={{ color: C.mt, fontSize: 13 }}>{r.team} · retired {r.retYr} at {r.age} · peak {r.peak} OVR</span>
              <div style={{ fontSize: 12, color: "#cbd5e1" }}>{[...Object.entries(r.won || {}).map(([k, ys]) => `${ys.length}× ${(AW.find((a) => a[0] === k) || [k, k.toUpperCase()])[1]}`), ...CAREER_STATS.filter((c) => (r.career?.[c.key] || 0) >= c.per * 2).map((c) => `${num(r.career[c.key])} ${c.label.toLowerCase()}`)].join(" · ") || "A legendary career"}</div>
            </div>
            <b style={{ color: "#fcd34d" }}>{r.legacy}</b>
          </div>
        ))}
        {!hof.length && <div style={{ fontSize: 14, color: C.mt }}>Nobody has been elected yet. Great careers earn a place when the player retires (legacy 60+), enshrined five years later.</div>}
      </div>

      {notable.length > 0 && (
        <div style={panel}>
          <div style={head}>👋 NOTABLE RETIREMENTS</div>
          {notable.map((r) => <div key={r.id} style={{ fontSize: 14, padding: "5px 0", borderBottom: `1px solid ${C.bd}66` }}><b>{r.retYr}</b> · {r.name} <span style={{ color: C.mt }}>({r.pos}, {r.team}) · {r.seasons} season{r.seasons > 1 ? "s" : ""} in the league · peak {r.peak} · legacy {r.legacy}</span></div>)}
        </div>
      )}
    </div>
  );
}
