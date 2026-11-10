// League history: retirements, legacies and the Hall of Fame, plus career leaders.
//
// Career totals count games in this league (regular season). A retiring player's legacy adds up
// his career here (seasons at his peak, stats, awards, records) and, for the real players on the
// opening rosters, the career he already had: years before 2026 at the level he started at, or
// for the established greats, what they'd already won. A legacy of 60 or more puts him in the
// Hall of Fame, enshrined five years after he retires, like the NFL.

import { DRAFT_PEDIGREE, pedigreeKey } from "./data/draftPedigree.js";
import { FRANCHISE_CAREER } from "./data/franchiseCareer.js";
import { TEAM_CAREER_BASE, TEAM_CAREER_KEYS } from "./data/teamCareerBase.js";
import { bestLabel } from "./honors.js";
import { posTag } from "./dline.js";

// Canton, about six a year like the real Hall: a league-era player needs a legacy of 100 and a peak of
// 92 (a 20-season playtest found 88 let in eleven or twelve a year once the real veterans were gone);
// the real veterans who opened the league get in at 80 on the strength of what they did before it.
export const HOF_LINE = 100;
export const HOF_PEAK = 92;
export const HOF_PRE = 40;
export const HOF_PRE_LINE = 80;
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
const AWARD_PTS = { mvp: 25, opoy: 15, dpoy: 15, sbmvp: 10, oroy: 5, droy: 5, cpoy: 5 };
const level = (ovr) => (ovr >= 95 ? 4 : ovr >= 90 ? 3 : ovr >= 85 ? 2 : ovr >= 80 ? 1 : 0);

// Where a player was drafted: { yr, rd, pk, tm } (tm: the club's abbreviation), or { undrafted, yr }.
// Drafts in this league come from the player (or the draft history); real players from the real
// draft record. Prospects not yet drafted get null.
export function draftPedigree(p, { draftHistory = {}, teams = [] } = {}) {
  if (!p) return null;
  if (p.draftPk > 0) {
    const h = (draftHistory[p.draftYr] || draftHistory[String(p.draftYr)] || []).find((x) => x.id === p.id);
    return { yr: p.draftYr, rd: p.draftRd || h?.rd || Math.ceil(p.draftPk / 32), pk: p.draftPk, tm: p.draftTm || (h ? teams[h.owner]?.ab : null) };
  }
  const real = DRAFT_PEDIGREE[pedigreeKey(p.name, p.bio?.college || p.college)];
  if (real) return { yr: real[0], rd: real[1], pk: real[2], tm: real[3] };
  if (p.undrafted || p.src === "m27") return { undrafted: true, yr: p.undrafted ? p.draftYr : null };
  return null;
}

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
  // The best at his position for a season counts 8.
  const honorPts = (p.honors || []).reduce((s, h) => s + ({ ap1: 6, ap2: 3, pb: 2, best: 8 }[h.k] || 0), 0);
  const legacy = Math.round(pre + seasonsHere * level(peak) + stats + awardPts + records + honorPts);
  return { legacy, career, won, peak, seasonsHere, pre: Math.round(pre) };
}

// ── Franchise careers ──
// A club's all-time leaders count everything a player did for it: real players' seasons there
// before the league began (through 2025), every league season he finished there, and this season
// if he's there now. The real record books (through 2025) fill in everyone who played before.
export const normName = (name) => String(name || "").toLowerCase().replace(/[.'’]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z]+/g, " ").trim();
const isReal = (p) => !(p?.draftYr >= 2026);
let clubsByName = null;
export const clubsOf = (name) => {
  if (!clubsByName) { clubsByName = new Map(); for (const k of Object.keys(TEAM_CAREER_BASE)) { const [n, ab] = k.split("|"); (clubsByName.get(n) || clubsByName.set(n, []).get(n)).push(ab); } }
  return clubsByName.get(normName(name)) || [];
};
// His totals with club ab. curAb: the club he's on now (his season so far counts there).
export function teamCareer(p, ab, curAb) {
  const out = {};
  const base = isReal(p) ? TEAM_CAREER_BASE[`${normName(p.name)}|${ab}`] : null;
  TEAM_CAREER_KEYS.forEach((k, i) => { out[k] = base?.[i] || 0; });
  for (const s of p.sh || []) if (s.tm === ab) for (const k of TEAM_CAREER_KEYS) out[k] += s[k] || 0;
  if (curAb === ab) for (const k of TEAM_CAREER_KEYS) out[k] += p.ss?.[k] || 0;
  return out;
}
// Every club he has numbers with: { ab: { stat: total } }.
export function teamCareers(p, curAb) {
  const clubs = new Set([...(isReal(p) ? clubsOf(p.name) : []), ...(p.sh || []).map((s) => s.tm), ...(curAb ? [curAb] : [])]);
  const out = {};
  for (const ab of clubs) { if (!ab) continue; const c = teamCareer(p, ab, curAb); if (TEAM_CAREER_KEYS.some((k) => c[k] > 0)) out[ab] = c; }
  return out;
}
// The club's all-time top n in one stat: { name, v, active, pid, team, real }. teams: every club;
// others: free agents and the like; retired: league history entries (their tc holds club careers).
export function franchiseBoard(ab, key, { teams = [], others = [], retired = [] } = {}, n = 10) {
  const rows = [];
  const seen = new Set();
  const add = (row) => { const k = normName(row.name); if (row.v > 0 && !seen.has(k)) { seen.add(k); rows.push(row); } };
  const league = [];
  for (const t of teams) for (const p of [...(t.roster || []), ...(t.ir || []), ...(t.ps || [])]) league.push({ p, cur: t.ab });
  for (const p of others) league.push({ p, cur: null });
  for (const { p, cur } of league) { const v = teamCareer(p, ab, cur)[key]; if (v > 0) add({ name: p.name, pid: p.id, v, active: true, team: cur }); }
  for (const r of retired) { const v = r.tc?.[ab]?.[key] ?? (r.team === ab && !r.tc ? r.career?.[key] : 0); if (v > 0) add({ name: r.name, pid: r.id, v, active: false, retYr: r.retYr }); }
  for (const r of FRANCHISE_CAREER[ab]?.[key] || []) add({ name: r.n, v: r.v, active: false, real: true });
  return rows.sort((a, b) => b.v - a.v).slice(0, n);
}
// Where he stands in his club's history: [{ key, label, rank, v }] for every stat where he's top 10.
export function franchiseRanks(p, ab, ctx) {
  if (!ab) return [];
  const out = [];
  for (const c of CAREER_STATS) {
    const mine = teamCareer(p, ab, ab)[c.key];
    if (!(mine > 0)) continue;
    const board = franchiseBoard(ab, c.key, ctx, 10);
    const i = board.findIndex((r) => normName(r.name) === normName(p.name));
    if (i >= 0) out.push({ key: c.key, label: c.label, rank: i + 1, v: mine });
  }
  return out;
}
// The 10th-best real mark in a stat (anyone past it belongs in the club's history).
const tenth = (ab, key) => { const l = FRANCHISE_CAREER[ab]?.[key] || []; return l.length >= 10 ? l[9].v : 1; };

// A player hanging it up. Returns his history entry (or null if he isn't notable enough to keep).
export function retireEntry(p, team, yr, opts = {}) {
  const L = legacyOf(p, { ...opts, yr });
  const hof = (L.legacy >= HOF_LINE && L.peak >= HOF_PEAK) || (L.legacy >= HOF_PRE_LINE && L.pre >= HOF_PRE);
  const tc = teamCareers(p, team?.ab);
  // a top-10 career with a club keeps him in the books even without a big legacy
  const clubGreat = Object.entries(tc).some(([ab, c]) => CAREER_STATS.some(({ key }) => c[key] >= tenth(ab, key)));
  if (!hof && L.legacy < 12 && !clubGreat) return null;
  const from = clubOf(p, team, opts.teams);
  return {
    id: p.id, name: p.name, pos: posTag(p), num: p.num, team: from || "FA", age: p.age, retYr: yr,
    peak: L.peak, legacy: L.legacy, career: L.career, won: L.won, seasons: L.seasonsHere, tc,
    // Super Bowls he won (on the champion's roster that season)
    rings: (accoladesOf(p, { awards: opts.awards || [], champs: opts.champs || [], teams: opts.teams || [], yr, teamAb: team?.ab }).find((a) => a.k === "sb")?.years || []).length,
    hof, hofClass: hof ? yr + HOF_WAIT : null,
    // his player card (ratings, bio, every season), so clicking him in the books shows the real thing
    card: cardOf(p, team, yr, opts.teams),
  };
}
// The club he last played for: the one he retired from, or (an unsigned free agent) his last one.
// formerTeam is a club's index; an abbreviation is kept as is. null: he never had one.
const clubOf = (p, team, teams) => team?.ab || (typeof p.formerTeam === "number" ? teams?.[p.formerTeam]?.ab : p.formerTeam) || null;

// What a retired player's card keeps: ratings, bio, his rating history and every season's stats
// (the last one, still on his ss when he retires, becomes a line of its own); nothing about a
// contract, injury or this week.
const GONE = ["ss", "pss", "gl", "cyr", "perf", "tradeVal", "hurt", "injured", "injWk", "injType", "injSev", "injRecWks", "holdout", "holdoutStone", "onBlock", "psCallUp", "av", "dk", "ext", "inc", "voidYrs", "voidDead", "sb", "baseBack", "restructures", "restructured", "confHistory", "trainedThisCamp", "cy", "ftag", "opt5"];
export function cardOf(p, team, yr, teams) {
  const c = { ...p, contract: 0, salary: 0, retiredYr: yr, retiredFrom: clubOf(p, team, teams) };
  if (p.ss?.gp) {
    const line = { y: yr, tm: team?.ab || "" };
    for (const [k, v] of Object.entries(p.ss)) if (typeof v === "number" && v) line[k] = v;
    c.sh = [...(p.sh || []).filter((x) => x.y !== yr), line];
    c.oh = [...(p.oh || []).filter((x) => x.y !== yr), { y: yr, o: p.ovr }];
  }
  for (const k of GONE) delete c[k];
  return c;
}
// A card for a retired-player entry (one saved before cards were kept: what the entry knows).
export const retiredCard = (r) => (r.card ? { ...r.card, hof: r.hof, hofClass: r.hofClass, career: r.career } : { id: r.id, name: r.name, pos: r.pos, num: r.num, age: r.age, ovr: r.peak, pot: r.peak, retiredYr: r.retYr, retiredFrom: r.team, hof: r.hof, hofClass: r.hofClass, career: r.career });

// Career leaders in this league: active players (with this season so far) and retired ones.
export function careerLeaders(teams, retired = [], key, n = 10) {
  const rows = [];
  teams.forEach((t) => (t.roster || []).forEach((p) => { const v = careerTotals(p)[key]; if (v) rows.push({ id: p.id, name: p.name, pos: posTag(p), team: t.ab, v, active: true }); }));
  for (const r of retired) { const v = r.career?.[key]; if (v) rows.push({ id: r.id, name: r.name, pos: r.pos, team: r.team, v, active: false, retYr: r.retYr }); }
  const seen = new Set();
  return rows.sort((a, b) => b.v - a.v).filter((r) => (seen.has(r.id) ? false : seen.add(r.id))).slice(0, n);
}

// A club's Ring of Honor candidates: players who retired with it, Hall of Famers or a legacy of
// 20+, not yet inducted. Best first.
// Ring of Honor candidates: this club's retired greats (a Hall of Famer, or a real legacy built over
// three or more seasons here), minus anyone you've inducted or passed on.
export const ringCandidates = (retired, team, hall) => (retired || []).filter((r) => r.team === team?.ab && !(hall?.ring || []).includes(r.id) && !(hall?.pass || []).includes(r.id) && (r.hof || (r.legacy >= 20 && (r.seasons ?? 3) >= 3))).sort((a, b) => b.legacy - a.legacy);

// A player's accolades in this league, each with the years: Super Bowls (on the champion's roster
// that season), MVP and the other awards, All-Pro and Pro Bowl selections. teams: today's clubs
// (champs carry the club's index); yr: the current season (its stats aren't in his season lines yet).
const ACCOLADES = [
  ["sb", "", "Super Bowl"], ["mvp", "", "MVP"], ["sbmvp", "", "Super Bowl MVP"], ["opoy", "", "Off. Player of the Year"],
  ["dpoy", "", "Def. Player of the Year"], ["oroy", "", "Off. Rookie of the Year"], ["droy", "", "Def. Rookie of the Year"], ["cpoy", "", "Comeback Player of the Year"],
  ["best", "", "Best at his position"], ["ap1", "", "First-team All-Pro"], ["ap2", "", "Second-team All-Pro"], ["pb", "", "Pro Bowl"], ["potw", "", "Player of the Week"],
];
export function accoladesOf(p, { awards = [], champs = [], teams = [], yr, teamAb } = {}) {
  if (!p) return [];
  const got = {};
  const add = (k, y) => { if (y != null && !(got[k] ||= []).includes(y)) got[k].push(y); };
  const slots = {};   // the position(s) he was the best at
  for (const a of awards) {
    for (const k of ["mvp", "sbmvp", "opoy", "dpoy", "oroy", "droy", "cpoy"]) if (a?.[k]?.pid === p.id) add(k, a.yr);
    // a list, or split by conference ({ AFC: [...], NFC: [...] } for the Pro Bowl)
    const flat = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v).flat() : []);
    for (const k of ["ap1", "ap2", "pb"]) if (flat(a?.honors?.[k]).some((h) => h?.pid === p.id)) add(k, a.yr);
    const b = (a?.honors?.best || []).find((h) => h?.pid === p.id);
    if (b) { add("best", a.yr); slots[b.slot] = (slots[b.slot] || 0) + 1; }
  }
  for (const h of Array.isArray(p.honors) ? p.honors : []) if (h?.k && h.yr) { if (h.k === "best" && h.slot && !got.best?.includes(h.yr)) slots[h.slot] = (slots[h.slot] || 0) + 1; add(h.k, h.yr); }
  // Player of the Week: every week counts, so each one is its own entry ("2027 wk 5")
  for (const w of Array.isArray(p.potw) ? p.potw : []) if (w?.y) (got.potw ||= []).push(`${w.y} wk ${w.w}`);
  // rings: his club in each season (his season lines), and this season's club
  const clubIn = new Map((p.sh || []).map((s) => [s.y, s.tm]));
  if (teamAb && (p.ss?.gp || 0) > 0) clubIn.set(yr, teamAb);
  for (const c of champs) { const ab = teams[c.ti]?.ab; if (ab && clubIn.get(c.yr) === ab) add("sb", c.yr); }
  const slot = Object.entries(slots).sort((a, b) => b[1] - a[1])[0]?.[0];
  return ACCOLADES.filter(([k]) => got[k]?.length).map(([k, icon, label]) => ({ k, icon, label: k === "best" && slot ? bestLabel(slot) : label, years: k === "potw" ? got[k] : got[k].sort((a, b) => a - b) }));
}

// After a week: has anyone taken over his club's all-time lead in a stat? book.cc holds the league
// players who hold a club career record ({ ab: { stat: { name, pid, v } } }); until one does, the
// real record (through 2025) stands. Returns { book, broken: [{ key, label, name, pid, team, ti, v, prev }] }.
export function updateCareerRecords(book, teams) {
  const cc = { ...(book.cc || {}) };
  const broken = [];
  teams.forEach((t, ti) => {
    const recs = { ...(cc[t.ab] || {}) };
    for (const c of CAREER_STATS) {
      let top = null;
      for (const p of [...(t.roster || []), ...(t.ir || [])]) { const v = teamCareer(p, t.ab, t.ab)[c.key]; if (v > 0 && (!top || v > top.v)) top = { p, v }; }
      if (!top) continue;
      const real = FRANCHISE_CAREER[t.ab]?.[c.key]?.[0];
      const cur = recs[c.key] || (real ? { name: real.n, v: real.v } : null);
      if (cur && top.v <= cur.v) continue;
      const same = cur && (cur.pid === top.p.id || normName(cur.name) === normName(top.p.name));
      recs[c.key] = { name: top.p.name, pid: top.p.id, v: top.v };
      if (!same) broken.push({ key: c.key, label: c.label, name: top.p.name, pid: top.p.id, team: t.ab, ti, v: top.v, prev: cur });
    }
    cc[t.ab] = recs;
  });
  return { book: { ...book, cc }, broken };
}

// A career in one look, for his farewell (Canton, or a legend's goodbye): the trophies he won, each
// once with how many (trophies: [{ k, n }], art in Moment.jsx), the honors counted (honors: [{ label, n }])
// and where he stands in each club's history (ranks: [{ ab, label, rank, v }], best first; top 5 only).
// p: the player (or a retired entry's card), with his season lines. ctx: { awards, champs, teams,
// retired, yr }; abs: the clubs to rank him with (his own first).
const TROPHY_KEYS = ["sb", "mvp", "sbmvp", "opoy", "dpoy", "oroy", "droy"];
export function careerHaul(p, abs, ctx = {}) {
  const acc = accoladesOf(p, { awards: ctx.awards || [], champs: ctx.champs || [], teams: ctx.teams || [], yr: ctx.yr, teamAb: abs?.[0] });
  const trophies = TROPHY_KEYS.map((k) => ({ k, n: acc.find((a) => a.k === k)?.years.length || 0 })).filter((t) => t.n);
  const honors = acc.filter((a) => !TROPHY_KEYS.includes(a.k) && a.k !== "potw").map((a) => ({ label: a.label, n: a.years.length }));
  const ranks = [];
  for (const ab of [...new Set((abs || []).filter(Boolean))]) {
    const mine = teamCareer(p, ab, ab);
    for (const c of CAREER_STATS) {
      const v = mine[c.key];
      if (!(v > 0)) continue;
      // him against everyone else in the club's books (he may already be off the roster)
      const ahead = franchiseBoard(ab, c.key, ctx, 10).filter((r) => normName(r.name) !== normName(p.name) && r.v > v).length;
      if (ahead < 5) ranks.push({ ab, key: c.key, label: c.label, rank: ahead + 1, v });
    }
  }
  ranks.sort((a, b) => a.rank - b.rank || b.v - a.v);
  return { trophies, honors, ranks };
}
