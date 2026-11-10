// "Start from the current week": a new 2026 league picks up where the real NFL season is. Every
// week that's been played for real is filled in with the real scores (records, points, streaks)
// and every player's real season stats so far. The data comes from src/data/live2026.json, which
// scripts/fetch-nfl-results.py refreshes after each week's games.
import { emptySS } from "./league.js";

// How names are compared between ESPN's box scores and the Madden rosters.
export const normName = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[.'’]/g, "").replace(/-/g, " ").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/\s+/g, " ").trim();
// Players ESPN lists under a different first name than Madden does.
const ALIAS = { "andy borregales": "andres borregales", "cam bynum": "camryn bynum", "jaylahn tuimoloau": "jt tuimoloau",
  "hollywood brown": "marquise brown", "nicholas singleton": "nick singleton", "ben yurosek": "benjamin yurosek", "gabriel rubio": "gabe rubio" };
const key = (n) => { const k = normName(n); return ALIAS[k] || k; };

const qbRate = (c, a, y, td, i) => {
  if (!a) return 0;
  const cl = (x) => Math.max(0, Math.min(2.375, x));
  return +(((cl((c / a - 0.3) * 5) + cl((y / a - 3) * 0.25) + cl((td / a) * 20) + cl(2.375 - (i / a) * 25)) / 6) * 100).toFixed(1);
};

// The real injury report (with injuries on): everyone ESPN lists as Questionable plays hurt,
// Doubtful misses the next game, Out and Injured Reserve miss until their expected return date
// (or the season, for IR with no date), and a suspended player sits out his games.
const DAY = 86400000;
export function weeksUntil(ret, asOf) {
  if (!ret) return null;
  const d = (Date.parse(`${ret}T12:00:00Z`) - Date.parse(asOf || Date.now())) / DAY;
  return Number.isFinite(d) ? Math.max(1, Math.ceil(d / 7)) : null;
}
export function applyLiveInjuries(teams, live) {
  const list = live?.injuries || [];
  if (!list.length) return { injured: 0, unmatched: 0 };
  const byTeam = new Map(), byName = new Map();
  teams.forEach((t) => (t.roster || []).forEach((p) => { byTeam.set(`${t.ab}|${key(p.name)}`, p); if (!byName.has(key(p.name))) byName.set(key(p.name), p); }));
  let injured = 0, unmatched = 0;
  for (const x of list) {
    const p = byTeam.get(`${x.team}|${key(x.name)}`) || byName.get(key(x.name));
    if (!p) { unmatched++; continue; }
    const wks = weeksUntil(x.ret, live.updated);
    const type = x.type && x.type !== "Suspension" ? x.type : "Injury";
    if (x.status === "Questionable") p.hurt = { wks: 1, pen: 3, type };
    else if (x.status === "Doubtful") Object.assign(p, { injured: true, injWk: 1, injRecWks: 1, injType: type, injSev: "Doubtful" });
    else if (x.status === "Out") Object.assign(p, { injured: true, injWk: wks || 1, injRecWks: wks || 1, injType: type, injSev: "Out" });
    else if (x.status === "Injured Reserve" || x.status === "Reserve-Ret") Object.assign(p, { injured: true, injWk: wks || 30, injRecWks: wks || 30, injType: x.status === "Reserve-Ret" ? "Reserve/retired" : type });
    else if (x.status === "Suspension") Object.assign(p, { suspended: true, suspWksLeft: wks || 1 });
    else continue;
    injured++;
  }
  return { injured, unmatched };
}

// teams: the league's teams (index = team id); sched: the season's games ({wk, h, a} as team ids).
// Every final game in the file is applied, including those of a week still in progress (a Sunday
// slate played, Monday night not yet): those stay settled and only the unplayed ones can be simmed.
// Changes both in place. Returns { wk: weeks completed, games, players, unmatched, injured }.
// injuries: also apply the real injury report.
export function applyLiveSeason(teams, sched, live, { injuries = false } = {}) {
  if (!live?.games?.length) return { wk: 0, games: 0, players: 0, unmatched: 0 };
  const through = live.throughWeek || 0;
  const id = Object.fromEntries(teams.map((t, i) => [t.ab, i]));
  let games = 0;
  for (const r of live.games) {
    const h = id[r.h], a = id[r.a];
    const g = sched.find((x) => x.wk === r.wk && x.h === h && x.a === a) || sched.find((x) => x.wk === r.wk && x.h === a && x.a === h);
    if (!g || g.played) continue;
    const hs = g.h === h ? r.hs : r.as, as = g.h === h ? r.as : r.hs;
    Object.assign(g, { played: true, hs, as, real: true, ot: !!r.ot });
    const H = teams[g.h], A = teams[g.a];
    H.pf += hs; H.pa += as; A.pf += as; A.pa += hs;
    if (hs > as) { H.w++; A.l++; } else if (as > hs) { A.w++; H.l++; } else { H.t = (H.t || 0) + 1; A.t = (A.t || 0) + 1; }
    for (const [t, won, lost] of [[H, hs > as, as > hs], [A, as > hs, hs > as]]) t.streak = won ? Math.max(0, t.streak || 0) + 1 : lost ? Math.min(0, t.streak || 0) - 1 : 0;
    games++;
  }
  // Real stats: matched on team and name first, then on name alone (players who've moved).
  const byTeam = new Map(), byName = new Map();
  teams.forEach((t) => [...t.roster, ...(t.ps || []), ...(t.ir || [])].forEach((p) => { byTeam.set(`${t.ab}|${key(p.name)}`, p); if (!byName.has(key(p.name))) byName.set(key(p.name), p); }));
  let players = 0, unmatched = 0;
  for (const [k, st] of Object.entries(live.stats || {})) {
    const [ab, name] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)];
    const p = byTeam.get(`${ab}|${key(name)}`) || byName.get(key(name));
    if (!p) { unmatched++; continue; }
    const ss = { ...emptySS(p.pos), ...st };
    if (ss.att) ss.rate = qbRate(ss.comp || 0, ss.att, ss.passYds || 0, ss.passTD || 0, ss.passInt || 0);
    p.ss = ss; players++;
  }
  const inj = injuries ? applyLiveInjuries(teams, live) : { injured: 0 };
  return { wk: through, games, players, unmatched, injured: inj.injured };
}
