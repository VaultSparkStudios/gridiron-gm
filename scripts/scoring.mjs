// Scoring check: whole regular seasons on the real game engine (real rosters, coaches, game-day
// modifiers and weather), measured against the NFL. `node scripts/scoring.mjs [seasons]`.
import { initTeams, genSched, simGame, calibrateLeague } from "../src/league.js";

const N = +(process.argv[2] || 4);
const rows = [];
const stat = { passYds: 0, rushYds: 0, comp: 0, att: 0, passTD: 0, rushTD: 0, passInt: 0, sacks: 0, fum: 0, fgM: 0, fgA: 0, punts: 0 };
const pts = [], games = [], drives = [], plays = [], tm = [];
for (let s = 0; s < N; s++) {
  const teams = initTeams(-1);
  calibrateLeague(teams);
  const sched = genSched(teams, null, 2026, s ? teams : null);
  const season = {};
  for (const g of sched) {
    const r = simGame(teams[g.h], teams[g.a], null, null, null, { dry: true });
    pts.push(r.hsc, r.asc); games.push([r.hsc, r.asc]);
    const G = r.game; for (const sd of ["h", "a"]) { const st = G.stats[sd]; drives.push(st.drives); plays.push(st.passAtt + st.rushAtt + st.sacks); const ti = sd === "h" ? g.h : g.a; const t = (tm[s * 32 + ti] ||= { pf: 0, py: 0, pa: 0, gp: 0, w: 0 }); t.pf += G.score[sd]; const o2 = sd === "h" ? "a" : "h"; t.w += G.score[sd] > G.score[o2] ? 1 : G.score[sd] === G.score[o2] ? 0.5 : 0; t.py += st.passYds; t.pa += st.passAtt; t.gp++; }
    for (const [box, ti] of [[r.boxH, g.h], [r.boxA, g.a]]) for (const l of Object.values(box)) {
      for (const k of Object.keys(stat)) stat[k] += l[k === "sacks" ? "sacks" : k] || 0;
      const key = `${ti}|${l.name}`; const a = (season[key] ||= { name: l.name, pos: l.pos }); for (const [k, v] of Object.entries(l)) if (typeof v === "number") a[k] = (a[k] || 0) + v;
    }
  }
  const all = Object.values(season), top = (k) => { const p = all.sort((a, b) => (b[k] || 0) - (a[k] || 0))[0]; return `${p.name} ${Math.round(p[k] || 0)}`; };
  rows.push({ passYds: top("passYds"), passTD: top("passTD"), rushYds: top("rushYds"), recYds: top("recYds"), rec: top("rec"), sacks: top("sacks"), ints: top("ints") });
}
const n = pts.length, mean = pts.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(pts.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
const pct = (f) => +((100 * games.filter(f).length) / games.length).toFixed(1);
const per = (k) => +(stat[k] / n).toFixed(2);
console.log(JSON.stringify({
  seasons: N, ppg: +mean.toFixed(1), sd: +sd.toFixed(1), max: Math.max(...pts),
  t40pct: +((100 * pts.filter((x) => x >= 40).length) / n).toFixed(1), t50perSeason: +(pts.filter((x) => x >= 50).length / N).toFixed(1), t45perSeason: +(pts.filter((x) => x >= 45).length / N).toFixed(1), shutoutsPerSeason: +(pts.filter((x) => x === 0).length / N).toFixed(1),
  under10pct: +((100 * pts.filter((x) => x < 10).length) / n).toFixed(1),
  marginSD: +Math.sqrt(games.reduce((a, [h, b]) => a + (h - b) ** 2, 0) / games.length).toFixed(1), winSD: +Math.sqrt(tm.filter(Boolean).reduce((a, t) => a + ((t.w / t.gp) * 17 - 8.5) ** 2, 0) / tm.filter(Boolean).length).toFixed(2),
  oneScore: pct(([h, a]) => Math.abs(h - a) <= 8), blowout28: pct(([h, a]) => Math.abs(h - a) >= 28), homeWin: pct(([h, a]) => h > a), totalPts: +(mean * 2).toFixed(1),
  drives: +(drives.reduce((a, b) => a + b, 0) / drives.length).toFixed(1), ptsPerDrive: +(pts.reduce((a, b) => a + b, 0) / drives.reduce((a, b) => a + b, 0)).toFixed(2), plays: +(plays.reduce((a, b) => a + b, 0) / plays.length).toFixed(1),
  bestOff: +Math.max(...tm.filter(Boolean).map((t) => t.pf / t.gp)).toFixed(1), worstOff: +Math.min(...tm.filter(Boolean).map((t) => t.pf / t.gp)).toFixed(1), topPassYpg: +Math.max(...tm.filter(Boolean).map((t) => t.py / t.gp)).toFixed(0), topAttPg: +Math.max(...tm.filter(Boolean).map((t) => t.pa / t.gp)).toFixed(1),
  passYds: per("passYds"), rushYds: per("rushYds"), compPct: +((100 * stat.comp) / stat.att).toFixed(1), passTD: per("passTD"), rushTD: per("rushTD"), ints: per("passInt"), sacks: per("sacks"), fgM: per("fgM"), fgPct: +((100 * stat.fgM) / stat.fgA).toFixed(1), punts: per("punts"),
}, null, 0));
for (const r of rows) console.log(JSON.stringify(r));
const avgLead = (k) => Math.round(rows.reduce((a, r) => a + +r[k].split(" ").pop(), 0) / rows.length);
console.log("avg leaders", JSON.stringify(Object.fromEntries(["passYds", "passTD", "rushYds", "recYds", "rec", "sacks", "ints"].map((k) => [k, avgLead(k)]))));
