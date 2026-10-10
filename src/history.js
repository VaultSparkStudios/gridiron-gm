// League history: retirements, legacies and the Hall of Fame, plus career leaders.
//
// Career totals count games in this league (regular season). A retiring player's legacy adds up
// his career here (seasons at his peak, stats, awards, records) and, for the real players on the
// opening rosters, the career he already had: years before 2026 at the level he started at, or
// for the established greats, what they'd already won. A legacy of 60 or more puts him in the
// Hall of Fame, enshrined five years after he retires, like the NFL.

export const HOF_LINE = 60;
export const HOF_WAIT = 5;

// What the established greats had already done before 2026 (MVPs, titles, All-Pro years), as
// legacy points. Everyone else on the opening rosters is credited by years and level instead.
export const PRE_LEAGUE_RESUME = {
  "Aaron Rodgers": 75, "Aaron Donald": 75, "Patrick Mahomes": 70, "Travis Kelce": 62, "Von Miller": 62, "Lamar Jackson": 50,
  "Khalil Mack": 45, "Calais Campbell": 45, "Derrick Henry": 45, "Chris Jones": 45, "T.J. Watt": 45,
  "Trent Williams": 45, "Matthew Stafford": 40, "Myles Garrett": 40, "Davante Adams": 40, "Mike Evans": 40,
  "Lane Johnson": 35, "Jalen Ramsey": 35, "Christian McCaffrey": 35, "Josh Allen": 35, "Cameron Jordan": 30,
  "Justin Jefferson": 30, "Saquon Barkley": 30, "Joe Burrow": 25, "Stefon Diggs": 20, "DeMarcus Lawrence": 20,
};

export const CAREER_STATS = [
  { key: "passYds", label: "Passing yards", per: 4000 }, { key: "passTD", label: "Passing TDs", per: 30 },
  { key: "rushYds", label: "Rushing yards", per: 1500 }, { key: "rushTD", label: "Rushing TDs", per: 12 },
  { key: "rec", label: "Receptions", per: 100 }, { key: "recYds", label: "Receiving yards", per: 1500 },
  { key: "recTD", label: "Receiving TDs", per: 10 }, { key: "sacks", label: "Sacks", per: 12 },
  { key: "ints", label: "Interceptions", per: 6 },
];
const AWARD_PTS = { mvp: 25, opoy: 15, dpoy: 15, sbmvp: 10, oroy: 5, droy: 5 };
const level = (ovr) => (ovr >= 95 ? 4 : ovr >= 90 ? 3 : ovr >= 85 ? 2 : ovr >= 80 ? 1 : 0);

// Career totals in this league: past seasons plus the one in progress.
export function careerTotals(p) {
  const out = {};
  for (const { key } of CAREER_STATS) out[key] = (p.cs?.[key] || 0) + (p.ss?.[key] || 0);
  out.gp = (p.cs?.gp || 0) + (p.ss?.gp || 0);
  return out;
}

// Awards he won in this league: { mvp: [2027, ...], ... }.
export function awardsOf(pid, awards = []) {
  const out = {};
  for (const a of awards) for (const k of Object.keys(AWARD_PTS)) if (a?.[k]?.pid === pid) (out[k] ||= []).push(a.yr);
  return out;
}

// startYr: the league's first season. startOvr: his rating when the league began (real players).
export function legacyOf(p, { awards = [], book = null, yr, startYr = 2026, startOvr } = {}) {
  const career = careerTotals(p);
  const won = awardsOf(p.id, awards);
  const peak = Math.max(p.peak || 0, p.ovr || 0);
  const firstYr = p.draftYr > 0 ? Math.max(startYr, p.draftPk > 0 ? p.draftYr + 1 : p.draftYr) : startYr;
  const seasonsHere = Math.max(1, yr - firstYr + 1);
  const pre = p.draftPk > 0 ? 0 : PRE_LEAGUE_RESUME[p.name] ?? Math.max(0, startYr - (p.draftYr || startYr)) * level(startOvr ?? p.ovr) * 0.75;
  const stats = CAREER_STATS.reduce((s, c) => s + (career[c.key] || 0) / c.per, 0) * 4;
  const awardPts = Object.entries(won).reduce((s, [k, ys]) => s + AWARD_PTS[k] * ys.length, 0);
  const records = book ? Object.values(book.best).filter((r) => r.pid === p.id).length * 10 : 0;
  // All-Pro and Pro Bowl selections in this league (first team 6, second team 3, Pro Bowl 2).
  const honorPts = (p.honors || []).reduce((s, h) => s + ({ ap1: 6, ap2: 3, pb: 2 }[h.k] || 0), 0);
  const legacy = Math.round(pre + seasonsHere * level(peak) + stats + awardPts + records + honorPts);
  return { legacy, career, won, peak, seasonsHere, pre: Math.round(pre) };
}

// A player hanging it up. Returns his history entry (or null if he isn't notable enough to keep).
export function retireEntry(p, team, yr, opts = {}) {
  const L = legacyOf(p, { ...opts, yr });
  const hof = L.legacy >= HOF_LINE;
  if (!hof && L.legacy < 12) return null;
  return {
    id: p.id, name: p.name, pos: p.pos, team: team?.ab || p.formerTeam || "FA", age: p.age, retYr: yr,
    peak: L.peak, legacy: L.legacy, career: L.career, won: L.won, seasons: L.seasonsHere,
    hof, hofClass: hof ? yr + HOF_WAIT : null,
  };
}

// Career leaders in this league: active players (with this season so far) and retired ones.
export function careerLeaders(teams, retired = [], key, n = 10) {
  const rows = [];
  teams.forEach((t) => (t.roster || []).forEach((p) => { const v = careerTotals(p)[key]; if (v) rows.push({ id: p.id, name: p.name, pos: p.pos, team: t.ab, v, active: true }); }));
  for (const r of retired) { const v = r.career?.[key]; if (v) rows.push({ id: r.id, name: r.name, pos: r.pos, team: r.team, v, active: false, retYr: r.retYr }); }
  const seen = new Set();
  return rows.sort((a, b) => b.v - a.v).filter((r) => (seen.has(r.id) ? false : seen.add(r.id))).slice(0, n);
}
