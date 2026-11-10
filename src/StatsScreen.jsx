// Stats: league leaders and full stat tables for the whole league, a conference, a division or a
// single team. Pick a team and you get its leader at every position; click a column to sort.
import Select from "./Select.jsx";
import React, { useMemo, useState } from "react";
import { C, Bdg, Face, TeamLogo, Hero, Section, Chips, Sheet, Row, Pills } from "./ui.jsx";
import { awardRaces } from "./awards.js";
import { olLine, OL_POS } from "./olStats.js";
import { gradesOf, gradeColor } from "./grades.js";
import { posTag } from "./dline.js";

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "–");
const avg = (a, b) => (b ? (a / b).toFixed(1) : "–");
const n = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)) : v ?? 0);

// Each table: who's in it, its columns ([label, value(ss, player), sort?]) and the default sort column.
const gr = (s, p) => gradesOf(s, p.pos);
const fac = (k) => [k === "pb" ? "PASS BLK" : k === "rb" ? "RUN BLK" : { qb: "PASS", rc: "RECV", ru: "RUSH", pr: "PASS RUSH", cv: "COV", rd: "RUN D" }[k], (s, p) => gr(s, p)?.facets[k] ?? "–", (s, p) => gr(s, p)?.facets[k] ?? -1];
const TABLES = {
  Passing: { has: (s) => (s.att || 0) >= 10, sort: "YDS", cols: [["CMP", (s) => s.comp || 0], ["ATT", (s) => s.att || 0], ["PCT", (s) => pct(s.comp || 0, s.att || 0), (s) => (s.att ? s.comp / s.att : 0)], ["YDS", (s) => s.passYds || 0], ["TD", (s) => s.passTD || 0], ["INT", (s) => s.passInt || 0], ["RATE", (s) => s.rate || 0]] },
  Rushing: { has: (s) => (s.rushAtt || 0) > 0, sort: "YDS", cols: [["ATT", (s) => s.rushAtt || 0], ["YDS", (s) => s.rushYds || 0], ["AVG", (s) => avg(s.rushYds || 0, s.rushAtt || 0), (s) => (s.rushAtt ? s.rushYds / s.rushAtt : 0)], ["TD", (s) => s.rushTD || 0], ["FUM", (s) => s.fum || 0]] },
  Receiving: { has: (s) => (s.rec || 0) > 0, sort: "YDS", cols: [["TGT", (s) => s.tgt || 0], ["REC", (s) => s.rec || 0], ["YDS", (s) => s.recYds || 0], ["AVG", (s) => avg(s.recYds || 0, s.rec || 0), (s) => (s.rec ? s.recYds / s.rec : 0)], ["TD", (s) => s.recTD || 0]] },
  Defense: { has: (s) => (s.tkl || 0) + (s.ast || 0) + (s.sacks || 0) + (s.ints || 0) + (s.pd || 0) > 0, sort: "TKL", cols: [["TKL", (s) => (s.tkl || 0) + (s.ast || 0)], ["SCK", (s) => s.sacks || 0], ["PRES", (s) => s.pres || 0], ["TFL", (s) => s.tfl || 0], ["INT", (s) => s.ints || 0], ["PD", (s) => s.pd || 0], ["FF", (s) => s.ff || 0]] },
  // the line: what each man gave up and how he blocked (olStats.js), and his grade
  "O-Line": { has: (s, p) => OL_POS.has(p.pos) && olLine(s), sort: "GRADE", cols: [["GS", (s) => s.gs || 0], ["SK ALW", (s) => s.sackA || 0], ["PRES ALW", (s) => s.presA || 0], ["PB WIN%", (s, p) => olLine(s, p.pos)?.pbPct ?? "–", (s, p) => olLine(s, p.pos)?.pbPct ?? 0], ["PASS BLK", (s, p) => olLine(s, p.pos)?.passGrade ?? "–", (s, p) => olLine(s, p.pos)?.passGrade ?? 0], ["RUN BLK", (s, p) => olLine(s, p.pos)?.runGrade ?? "–", (s, p) => olLine(s, p.pos)?.runGrade ?? 0], ["GRADE", (s, p) => gr(s, p)?.overall ?? "–", (s, p) => gr(s, p)?.overall ?? 0]] },
  // every player's grade (grades.js): his own play against an average player in the same spot
  Grades: { has: (s, p) => !!gr(s, p), sort: "GRADE", cols: [["GRADE", (s, p) => gr(s, p)?.overall ?? "–", (s, p) => gr(s, p)?.overall ?? 0], ...["qb", "rc", "ru", "pr", "rd", "cv", "pb", "rb"].map(fac)] },
  Kicking: { has: (s) => (s.fgA || 0) + (s.xpA || 0) > 0, sort: "PTS", cols: [["FGM", (s) => s.fgM || 0], ["FGA", (s) => s.fgA || 0], ["FG%", (s) => pct(s.fgM || 0, s.fgA || 0), (s) => (s.fgA ? s.fgM / s.fgA : 0)], ["XPM", (s) => s.xpM || 0], ["LNG", (s) => s.lng || 0], ["PTS", (s) => s.pts || (s.fgM || 0) * 3 + (s.xpM || 0)]] },
  Punting: { has: (s) => (s.punts || 0) > 0, sort: "AVG", cols: [["PUNTS", (s) => s.punts || 0], ["YDS", (s) => s.puntYds || 0], ["AVG", (s) => avg(s.puntYds || 0, s.punts || 0), (s) => (s.punts ? s.puntYds / s.punts : 0)], ["IN20", (s) => s.in20 || 0]] },
  Returns: { has: (s) => (s.kr || 0) + (s.pr || 0) + (s.krYds || 0) + (s.prYds || 0) > 0, sort: "KR YDS", cols: [["KR", (s) => s.kr || 0], ["KR YDS", (s) => s.krYds || 0], ["KR TD", (s) => s.krTD || 0], ["PR", (s) => s.pr || 0], ["PR YDS", (s) => s.prYds || 0], ["PR TD", (s) => s.prTD || 0]] },
};

// Headline leader boards: [title, value(ss), unit, who qualifies]
const BOARDS = [
  ["Passing yards", (s) => s.passYds || 0, "yds", (p) => p.pos === "QB"],
  ["Passing TDs", (s) => s.passTD || 0, "TD", (p) => p.pos === "QB"],
  ["Rushing yards", (s) => s.rushYds || 0, "yds", () => true],
  ["Receiving yards", (s) => s.recYds || 0, "yds", () => true],
  ["Sacks", (s) => s.sacks || 0, "sk", () => true],
  ["Pressures", (s) => s.pres || 0, "pres", () => true],
  ["Tackles", (s) => (s.tkl || 0) + (s.ast || 0), "tkl", () => true],
  ["Interceptions", (s) => s.ints || 0, "INT", () => true],
];

// The stat that makes a player his position's leader on a team, and the line shown for him.
const POS_LEAD = [
  ["QB", (s) => s.passYds || 0, (s) => `${n(s.passYds || 0)} yds · ${s.passTD || 0} TD · ${s.passInt || 0} INT · ${(s.rate || 0).toFixed(1)} rate`],
  ["RB", (s) => (s.rushYds || 0) + (s.recYds || 0), (s) => `${n(s.rushYds || 0)} rush yds · ${s.rushTD || 0} TD · ${s.rec || 0} rec`],
  ["WR", (s) => s.recYds || 0, (s) => `${s.rec || 0} rec · ${n(s.recYds || 0)} yds · ${s.recTD || 0} TD`],
  ["TE", (s) => s.recYds || 0, (s) => `${s.rec || 0} rec · ${n(s.recYds || 0)} yds · ${s.recTD || 0} TD`],
  ["DL", (s) => (s.sacks || 0) * 4 + (s.tkl || 0) + (s.tfl || 0), (s) => `${n(s.sacks || 0)} sk · ${(s.tkl || 0) + (s.ast || 0)} tkl · ${s.tfl || 0} TFL`],
  ["LB", (s) => (s.tkl || 0) + (s.ast || 0) + (s.sacks || 0) * 3, (s) => `${(s.tkl || 0) + (s.ast || 0)} tkl · ${n(s.sacks || 0)} sk · ${s.ints || 0} INT`],
  ["CB", (s) => (s.ints || 0) * 5 + (s.pd || 0) * 2 + (s.tkl || 0), (s) => `${s.ints || 0} INT · ${s.pd || 0} PD · ${(s.tkl || 0) + (s.ast || 0)} tkl`],
  ["S", (s) => (s.ints || 0) * 5 + (s.pd || 0) * 2 + (s.tkl || 0), (s) => `${(s.tkl || 0) + (s.ast || 0)} tkl · ${s.ints || 0} INT · ${s.pd || 0} PD`],
  ["K", (s) => s.fgM || 0, (s) => `${s.fgM || 0}/${s.fgA || 0} FG · ${s.xpM || 0} XP · long ${s.lng || 0}`],
  ["P", (s) => s.punts || 0, (s) => `${s.punts || 0} punts · ${avg(s.puntYds || 0, s.punts || 0)} avg · ${s.in20 || 0} in 20`],
];

const GRADE_C = { "A+": "#f59e0b", A: "#22c55e", B: "#60a5fa", C: "#94a3b8", D: "#f97316", F: "#ef4444" };

// The award races: the top five for each award, by the awards' own scoring, as the season goes.
const RACES = [["mvp", "MVP"], ["opoy", "Offensive Player"], ["dpoy", "Defensive Player"], ["oroy", "Offensive Rookie"], ["droy", "Defensive Rookie"]];
function AwardRaces({ teams, ui, yr, onPlayer, mobile }) {
  const r = useMemo(() => awardRaces(teams, yr), [teams, yr]);
  const find = (e) => teams[e.ti]?.roster.find((p) => p.id === e.pid);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${mobile ? 280 : 300}px,1fr))`, gap: 8, marginBottom: 16 }}>
      {RACES.map(([k, l]) => (
        <div key={k} style={{ background: "#ffffff0d", borderRadius: 18, padding: "14px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{l}</div>
          {r[k].length ? r[k].map((e, i) => (
            <div key={e.pid} onClick={() => { const p = find(e); if (p) onPlayer(p); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid #ffffff10" : "none", cursor: "pointer" }}>
              <span style={{ width: 16, fontSize: 14, fontWeight: 900, color: i ? C.mt : "#fcd34d" }}>{i + 1}</span>
              <TeamLogo t={teams[e.ti]} sz={20} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: e.ti === ui ? "#86efac" : "#e2e8f0" }}>{e.name} <span style={{ fontSize: 12, color: C.mt, fontWeight: 700 }}>{posTag(e)}</span></div>
                <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.stat}</div>
              </div>
            </div>
          )) : <div style={{ fontSize: 14, color: C.mt }}>No games yet.</div>}
        </div>
      ))}
    </div>
  );
}

// A club's personnel season (league.js addPersonnelStats): its offense in each grouping and its
// defense against each package: how often, yards a snap, and the share of successful snaps, each
// beside the league's rate so the good and the bad stand out.
const PERS_NAME = { 10: "1 RB · 4 WR", 11: "1 RB · 1 TE · 3 WR", 12: "1 RB · 2 TE · 2 WR", 13: "1 RB · 3 TE · 1 WR", 21: "2 RB · 1 TE · 2 WR" };
function PersonnelStats({ team, teams, mobile }) {
  const st = team.persSt;
  if (!st || !Object.keys(st.off || {}).length) return null;
  const league = (side) => { const o = {}; for (const t of teams) if (t.persSt?.yr === st.yr) for (const [k, r] of Object.entries(t.persSt[side] || {})) { const d = (o[k] ||= { n: 0, yds: 0, ok: 0 }); d.n += r.n; d.yds += r.yds; d.ok += r.ok; } return o; };
  const L = { off: league("off"), def: league("def") };
  const Table = ({ side, title, keys, name, good }) => {
    const rows = keys.filter((k) => st[side][k]?.n), tot = rows.reduce((t, k) => t + st[side][k].n, 0);
    const cell = (v, lg, hi) => { const d = v - lg, c = Math.abs(d) < (hi ? 0.03 : 0.25) ? "#e2e8f0" : (d > 0) === good ? "#4ade80" : "#f87171"; return <span style={{ color: c, fontWeight: 800 }}>{hi ? `${Math.round(v * 100)}%` : v.toFixed(1)}</span>; };
    const th = { fontSize: 11, fontWeight: 900, letterSpacing: 0.8, color: C.mt, textAlign: "right", padding: "4px 6px" };
    return (
      <div style={{ background: "#ffffff0d", borderRadius: 18, padding: "14px 16px", minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{title}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>{side === "off" ? "GROUPING" : "PACKAGE"}</th><th style={th}>SNAPS</th><th style={th}>YDS/PLAY</th><th style={th}>SUCCESS</th></tr></thead>
          <tbody>{rows.map((k) => { const r = st[side][k], lg = L[side][k] || r; return (
            <tr key={k}><td style={{ padding: "5px 6px", fontSize: 14, fontWeight: 800 }}>{side === "off" ? k : k[0].toUpperCase() + k.slice(1)}{!mobile && side === "off" && <span style={{ fontSize: 11, color: C.mt, fontWeight: 600, marginLeft: 6 }}>{name[k]}</span>}</td>
              <td style={{ padding: "5px 6px", fontSize: 14, textAlign: "right" }}>{Math.round((r.n / tot) * 100)}%</td>
              <td style={{ padding: "5px 6px", fontSize: 14, textAlign: "right" }}>{cell(r.yds / r.n, lg.yds / lg.n, false)} <span style={{ fontSize: 11, color: C.mt }}>/ {(lg.yds / lg.n).toFixed(1)}</span></td>
              <td style={{ padding: "5px 6px", fontSize: 14, textAlign: "right" }}>{cell(r.ok / r.n, lg.ok / lg.n, true)} <span style={{ fontSize: 11, color: C.mt }}>/ {Math.round((lg.ok / lg.n) * 100)}%</span></td></tr>); })}</tbody>
        </table>
      </div>
    );
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, color: C.mt, marginBottom: 6 }}>Personnel this season: the club's numbers, then the league's (after the slash). Success: a snap that gains 40% of the yards needed on first down, 60% on second, all of them on third and fourth.</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(${mobile ? 280 : 360}px,1fr))`, gap: 8 }}>
        <Table side="off" title="Offense by grouping" keys={["11", "12", "21", "13", "10"]} name={PERS_NAME} good />
        <Table side="def" title="Defense by package (allowed)" keys={["base", "nickel", "dime"]} name={{}} good={false} />
      </div>
    </div>
  );
}

export default function StatsScreen({ teams, ui, yr, onPlayer, grade, mobile }) {
  const me = teams[ui];
  const [scope, setScope] = useState("league"); // league | AFC | NFC | div | team:<id>
  const [cat, setCat] = useState("Passing");
  const [sort, setSort] = useState(null);
  const [gpos, setGpos] = useState("All"); // the Grades table's position
  const [dv, setDv] = useState("leaders"); // computers: the leaders, or one full table
  const teamId = scope.startsWith("team:") ? +scope.slice(5) : null;
  const inScope = (t) => scope === "league" || (scope === "AFC" || scope === "NFC" ? t.c === scope : scope === "div" ? t.c === me.c && t.d === me.d : t.id === teamId);
  const players = useMemo(() => {
    const out = [];
    teams.forEach((t, ti) => { if (!inScope(t)) return; [...t.roster, ...(t.ir || [])].forEach((p) => { if (p.ss && (p.ss.gp || 0) > 0) out.push({ p, t, ti }); }); });
    return out;
  }, [teams, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const T = TABLES[cat];
  const col = T.cols.find((c) => c[0] === (sort || T.sort)) || T.cols[0];
  const sv = (x) => (col[2] || col[1])(x.p.ss, x.p);
  const posOk = (p) => cat !== "Grades" || gpos === "All" || (gpos === "OL" ? OL_POS.has(p.pos) : p.pos === gpos);
  const rows = players.filter((x) => posOk(x.p) && T.has(x.p.ss, x.p)).sort((a, b) => sv(b) - sv(a)).slice(0, teamId != null ? 60 : 40);
  // the Grades table shows only the columns its players have (a QB table isn't nine columns of dashes)
  const cols = cat === "Grades" ? T.cols.filter(([l, f], i) => i === 0 || rows.some((x) => f(x.p.ss, x.p) !== "–")) : T.cols;
  const team = teamId != null ? teams[teamId] : null;
  const th = { padding: "10px 8px", fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: C.mt, textAlign: "right", borderBottom: "1px solid #ffffff14", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", position: "sticky", top: 0, background: "#111827", zIndex: 1 };
  if (mobile) return <PhoneStats {...{ teams, ui, yr, me, scope, setScope, cat, setCat, sort, setSort, gpos, setGpos, players, rows, cols, col, team, teamId, onPlayer }} />;
  const td = { padding: "8px 8px", fontSize: 14, textAlign: "right", borderBottom: "1px solid #ffffff0a", whiteSpace: "nowrap" };

  return (
    <div>
      {/* phones: each row of chips is one swipeable line instead of wrapping onto two */}
      <div style={{ display: "flex", gap: 6, flexWrap: mobile ? "nowrap" : "wrap", overflowX: mobile ? "auto" : undefined, alignItems: "center", marginBottom: 12, paddingBottom: mobile ? 2 : 0 }}>
        <Pills items={[["league", "League"], ["AFC", "AFC"], ["NFC", "NFC"], ["div", `${me.c} ${me.d}`], [`team:${ui}`, mobile ? me.ab : `My team (${me.ab})`], ["races", "Award races"]]} value={scope} onChange={setScope} label="Scope" />
        <Select value={teamId != null && teamId !== ui ? scope : ""} onChange={(e) => e.target.value && setScope(e.target.value)} style={{ background: teamId != null && teamId !== ui ? "#fff" : "#ffffff12", color: teamId != null && teamId !== ui ? "#0b1220" : C.tx, border: 0, borderRadius: 999, padding: "8px 12px", fontSize: 14, fontWeight: 700, flex: "0 0 auto" }}>
          <option value="">{mobile ? "Other team…" : "Another team…"}</option>
          {teams.map((t, i) => ({ t, i })).sort((a, b) => a.t.city.localeCompare(b.t.city)).map(({ t, i }) => <option key={i} value={`team:${i}`}>{t.city} {t.name}</option>)}
        </Select>
      </div>

      {scope !== "races" && <Pills items={[["__lead", "Leaders"], ...Object.keys(TABLES).map((k) => [k, k])]} value={dv === "leaders" ? "__lead" : cat} onChange={(k) => { if (k === "__lead") setDv("leaders"); else { setDv("tables"); setCat(k); setSort(null); } }} label="Category" style={{ marginBottom: 12 }} />}
      {scope === "races" ? <AwardRaces teams={teams} ui={ui} yr={yr} onPlayer={onPlayer} mobile={mobile} /> : dv !== "leaders" ? null : team ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <TeamLogo t={team} sz={40} glow />
            <div><div style={{ fontSize: 20, fontWeight: 900 }}>{team.city} {team.name}</div><div style={{ fontSize: 14, color: C.mt }}>Leader at every position · {team.w}-{team.l}{team.t ? `-${team.t}` : ""}</div></div>
          </div>
          <PersonnelStats team={team} teams={teams} mobile={mobile} />
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${mobile ? 260 : 300}px,1fr))`, gap: 8, marginBottom: 16 }}>
            {POS_LEAD.map(([pos, val, line]) => {
              const best = players.filter((x) => x.p.pos === pos && val(x.p.ss) > 0).sort((a, b) => val(b.p.ss) - val(a.p.ss))[0];
              return (
                <div key={pos} onClick={() => best && onPlayer(best.p)} style={{ display: "flex", gap: 10, alignItems: "center", background: "#ffffff0d", borderRadius: 14, padding: "10px 14px", cursor: best ? "pointer" : "default" }}>
                  <Bdg pos={pos} />
                  {best ? <>
                    <Face s={best.p.face} sz={30} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{best.p.name}{grade && teamId === ui && <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 900, color: GRADE_C[grade(best.p)] || C.mt }}>{grade(best.p)}</span>}</div>
                      <div style={{ fontSize: 14, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line(best.p.ss)}</div>
                    </div>
                  </> : <span style={{ color: C.mt, fontSize: 14 }}>No stats yet</span>}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${mobile ? 250 : 270}px,1fr))`, gap: 10, marginBottom: 16 }}>
          {BOARDS.map(([title, val, unit, ok]) => {
            const top = players.filter((x) => ok(x.p) && val(x.p.ss) > 0).sort((a, b) => val(b.p.ss) - val(a.p.ss)).slice(0, 3);
            return (
              <div key={title} style={{ background: "#111827", borderRadius: 20, padding: "14px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8", marginBottom: 8 }}>{title}</div>
                {!top.length && <div style={{ fontSize: 14, color: C.mt }}>No stats yet</div>}
                {top.map((x, i) => (
                  <div key={x.p.id} onClick={() => onPlayer(x.p)} style={{ display: "grid", gridTemplateColumns: i ? "18px 1fr auto" : "18px 30px 1fr auto", alignItems: "center", gap: 8, padding: i ? "5px 0" : "2px 0 8px", borderTop: i ? "1px solid #ffffff10" : "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 12, color: C.mt, fontWeight: 800 }}>{i + 1}</span>
                    {!i && <Face s={x.p.face} sz={30} />}
                    <div style={{ minWidth: 0 }}>
                      <div title={x.p.name} style={{ fontSize: i ? 14 : 16, fontWeight: i ? 600 : 900, color: i ? "#cbd5e1" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{!i && x.p.name.length > 13 ? `${x.p.name[0]}. ${x.p.name.split(" ").slice(1).join(" ")}` : x.p.name}</div>
                      <div style={{ fontSize: 11, color: x.ti === ui ? C.gn : C.mt, fontWeight: 700 }}>{x.t.ab} · {x.p.pos}</div>
                    </div>
                    <span style={{ fontSize: i ? 14 : 20, fontWeight: 900, color: i ? "#cbd5e1" : "#fff" }}>{n(val(x.p.ss))}<span style={{ fontSize: 11, color: C.mt, fontWeight: 700, marginLeft: 3 }}>{unit}</span></span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {scope !== "races" && dv === "tables" && <>
      {cat === "Grades" && <div style={{ display: "flex", gap: 5, flexWrap: mobile ? "nowrap" : "wrap", overflowX: mobile ? "auto" : undefined, alignItems: "center", marginBottom: 8 }}>
        <Pills quiet wrap={!mobile} items={["All", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S"].map((k) => [k, k])} value={gpos} onChange={setGpos} label="Position" />
        {!mobile && <span title="Graded play by play against an average player in the same spot: how well he played, not how good his team is." style={{ fontSize: 13, color: C.mt, marginLeft: 6 }}>90+ elite · 80s high quality · 70s above average · 60s average</span>}
      </div>}
      <div style={{ overflow: "auto", background: "#111827", borderRadius: 20, padding: "4px 8px", maxHeight: cat === "Grades" ? "calc(100vh - 340px)" : "calc(100vh - 300px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ ...th, textAlign: "left", position: "sticky", left: 0, zIndex: 2, cursor: "default" }}>PLAYER</th>
            {cols.map(([l]) => <th key={l} onClick={() => setSort(l)} style={{ ...th, color: l === col[0] ? "#fff" : C.mt }}>{l}{l === col[0] ? " ▼" : ""}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={x.p.id} style={{ background: x.ti === ui ? "#22c55e10" : "transparent" }}>
                <td onClick={() => onPlayer(x.p)} style={{ ...td, textAlign: "left", position: "sticky", left: 0, background: x.ti === ui ? "#13261d" : "#111827", cursor: "pointer", minWidth: mobile ? 150 : 220 }}>
                  <span style={{ color: C.mt, fontSize: 12, marginRight: 8, display: "inline-block", minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontWeight: 700 }}>{x.p.name}</span>
                  <span style={{ marginLeft: 6, fontSize: 12, color: C.mt }}>{x.p.pos} · {x.t.ab}</span>
                </td>
                {cols.map(([l, f]) => { const v = f(x.p.ss, x.p), g = l === "GRADE" || (cat === "Grades" && typeof v === "number"); return <td key={l} style={{ ...td, fontWeight: l === col[0] ? 900 : 500, color: g && typeof v === "number" ? gradeColor(v) : l === col[0] ? "#fff" : "#cbd5e1" }}>{n(v)}</td>; })}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={cols.length + 1} style={{ ...td, textAlign: "center", color: C.mt }}>No {cat.toLowerCase()} stats yet.</td></tr>}
          </tbody>
        </table>
      </div>
      </>}
    </div>
  );
}

// Phones: its own screen in the Home screen's look. Who you're looking at as chips, the leaders as
// cards you swipe (your team: its leader at every position), then the stat tables as clean rows: the
// stat you sort by big on the right, the rest on one line under the name.
function PhoneStats({ teams, ui, yr, me, scope, setScope, cat, setCat, sort, setSort, gpos, setGpos, players, rows, cols, col, team, teamId, onPlayer }) {
  const [shown, setShown] = useState(15); // a screenful of a table, then more on a tap
  const [sortOpen, setSortOpen] = useState(false);
  const soft = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
  const races = useMemo(() => (scope === "races" ? awardRaces(teams, yr) : null), [scope, teams, yr]);
  const card = { flex: "0 0 78%", scrollSnapAlign: "start", background: "#ffffff0f", borderRadius: 18, padding: "12px 14px 6px", minWidth: 0 };
  const strip = (kids) => <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", margin: "0 -8px", padding: "0 8px 4px", scrollPaddingLeft: 8 }}>{kids}</div>;
  const line = (i, onClick, face, name, sub, big, unit, you) => (
    <button key={i} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 52, background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: 0, color: "#fff", cursor: "pointer", textAlign: "left" }}>
      {face}
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: you ? C.gn : "#f1f5f9" }}>{name}</span><span style={{ display: "block", fontSize: 12, color: C.mt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span></span>
      <span style={{ textAlign: "right" }}><b style={{ display: "block", fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{big}</b>{unit && <span style={{ fontSize: 10, fontWeight: 800, color: C.mt }}>{unit}</span>}</span>
    </button>
  );
  const scopes = [["league", "League"], ["AFC", "AFC"], ["NFC", "NFC"], ["div", `${me.c} ${me.d}`], [`team:${ui}`, me.name], ["races", "Award races"]];
  return (
    <div>
      <Hero clr={teamId != null ? teams[teamId].clr : "#013369"} logo={teamId != null ? teams[teamId] : null} eyebrow={`${yr} season`} title="Stats" sub={(scopes.find(([k]) => k === scope) || [null, team ? team.name : ""])[1]} />
      <div style={{ marginTop: 16 }}><Chips items={scopes} value={scope} onChange={(k) => { setScope(k); setSort(null); }} /></div>
      {scope === "races" ? (
        <Section title="Award races" style={{ marginTop: 18 }}>
          {strip(RACES.map(([k, l]) => (
            <div key={k} style={card}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: "#fcd34d", marginBottom: 2 }}>{l.toUpperCase()}</div>
              {races[k].length ? races[k].slice(0, 5).map((e, i) => line(i, () => { const p = teams[e.ti]?.roster.find((x) => x.id === e.pid); if (p) onPlayer(p); }, <TeamLogo t={teams[e.ti]} sz={26} />, `${i + 1}. ${e.name}`, e.stat, "", null, e.ti === ui)) : <div style={{ fontSize: 14, color: C.mt, padding: "10px 0" }}>No games yet.</div>}
            </div>
          )))}
        </Section>
      ) : (<>
        {team ? (
          <Section title="Leader at every spot" style={{ marginTop: 18 }}>
            <div style={soft}>
              {POS_LEAD.map(([pos, val, ln], i) => { const best = players.filter((x) => x.p.pos === pos && val(x.p.ss) > 0).sort((a, b) => val(b.p.ss) - val(a.p.ss))[0]; return (
                <div key={pos} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 56, borderTop: i ? "1px solid #ffffff10" : 0, cursor: best ? "pointer" : "default" }} onClick={() => best && onPlayer(best.p)}>
                  <span style={{ width: 34, flexShrink: 0 }}><Bdg pos={pos} /></span>
                  {best ? <><Face s={best.p.face} sz={34} /><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{best.p.name}</span><span style={{ display: "block", fontSize: 12, color: C.mt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ln(best.p.ss)}</span></span></> : <span style={{ color: C.mt, fontSize: 14 }}>No stats yet</span>}
                </div>
              ); })}
            </div>
          </Section>
        ) : (() => { const boards = BOARDS.map(([title, val, unit, ok]) => ({ title, val, unit, top: players.filter((x) => ok(x.p) && val(x.p.ss) > 0).sort((a, b) => val(b.p.ss) - val(a.p.ss)).slice(0, 3) })).filter((b) => b.top.length); return boards.length ? (
          <Section title="Leaders" style={{ marginTop: 18 }}>
            {strip(boards.map((b) => (
              <div key={b.title} style={card}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: "#94a3b8", marginBottom: 2 }}>{b.title.toUpperCase()}</div>
                {b.top.map((x, i) => line(i, () => onPlayer(x.p), <Face s={x.p.face} sz={32} />, x.p.name, `${x.t.ab} · ${x.p.pos}`, n(b.val(x.p.ss)), b.unit.toUpperCase(), x.ti === ui))}
              </div>
            )))}
          </Section>
        ) : null; })()}
        <Section title="Stat tables" action={`Sorted: ${col[0]} ▾`} onAction={() => setSortOpen(true)}>
          <Chips items={Object.keys(TABLES).map((k) => [k, k])} value={cat} onChange={(k) => { setCat(k); setSort(null); setShown(15); }} />
          {cat === "Grades" && <div style={{ marginTop: 8 }}><Chips items={["All", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S"].map((k) => [k, k])} value={gpos} onChange={setGpos} /></div>}
          <div style={{ ...soft, marginTop: 10 }}>
            {rows.slice(0, shown).map((x, i) => { const rest = cols.filter((c) => c[0] !== col[0]).slice(0, 4).map(([l, f]) => `${l} ${n(f(x.p.ss, x.p))}`).join(" · "); const v = col[1](x.p.ss, x.p); return (
              <button key={x.p.id} onClick={() => onPlayer(x.p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 50, background: x.ti === ui ? "#22c55e10" : "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: "6px 0", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 22, fontSize: 14, fontWeight: 800, color: C.mt }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: x.ti === ui ? C.gn : "#f1f5f9" }}>{x.p.name} <span style={{ fontSize: 12, color: C.mt, fontWeight: 700 }}>{x.t.ab} · {x.p.pos}</span></span><span style={{ display: "block", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{rest}</span></span>
                <span style={{ textAlign: "right" }}><b style={{ display: "block", fontSize: 20, fontVariantNumeric: "tabular-nums", color: typeof v === "number" && (col[0] === "GRADE" || cat === "Grades") ? gradeColor(v) : "#fff" }}>{n(v)}</b><span style={{ fontSize: 10, fontWeight: 800, color: C.mt }}>{col[0]}</span></span>
              </button>
            ); })}
            {!rows.length && <div style={{ padding: "18px 0", color: C.mt, fontSize: 14 }}>No {cat.toLowerCase()} stats yet.</div>}
          </div>
          {rows.length > shown && <button onClick={() => setShown(shown + 15)} style={{ width: "100%", minHeight: 46, marginTop: 10, borderRadius: 14, border: 0, background: "#ffffff0f", color: "#cbd5e1", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Show more · {rows.length - shown} left</button>}
        </Section>
      </>)}
      {sortOpen && <Sheet title="Sort by" onClose={() => setSortOpen(false)}>{cols.map(([l], i) => <Row key={l} first={i === 0} label={l} value={l === col[0] ? "✓" : ""} tone={C.gn} onClick={() => { setSort(l); setSortOpen(false); }} />)}<div style={{ height: 8 }} /></Sheet>}
    </div>
  );
}
