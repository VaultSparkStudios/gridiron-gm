// The NFL's career records (regular season, through 2025): Brady's passing yards, Emmitt Smith's
// rushing, Jerry Rice's receiving, Bruce Smith's sacks, Paul Krause's interceptions. A real player's
// career counts what he really did before the league began (2004-2025, every club) and everything
// he does in it; a league-era player counts his league career. Each week the book is checked: a
// player who passes the mark takes it, and keeps raising it as he goes.
import { TEAM_CAREER_BASE, TEAM_CAREER_KEYS } from "./data/teamCareerBase.js";
import { careerTotals, normName } from "./history.js";
import { everyone } from "./records.js";
import { NFL_CAREER_LEADERS } from "./data/nflCareerLeaders.js";
import { posTag } from "./dline.js";

const QB = ["QB"], RUSH = ["RB", "QB", "WR", "FB"], CATCH = ["WR", "TE", "RB", "FB"];
const OFF = new Set(["QB", "RB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "OL", "K", "P"]);
// pos: who a stat counts for (two real players can share a name: Buffalo's Josh Allen throws, Jacksonville's rushes the passer)
export const CAREER_DEFS = [
  { key: "passYds", label: "Passing yards", pos: QB, nfl: { val: 89214, name: "Tom Brady", team: "NE/TB", yrs: "2000–2022" } },
  { key: "passTD", label: "Passing touchdowns", pos: QB, nfl: { val: 649, name: "Tom Brady", team: "NE/TB", yrs: "2000–2022" } },
  { key: "rushYds", label: "Rushing yards", pos: RUSH, nfl: { val: 18355, name: "Emmitt Smith", team: "DAL/ARI", yrs: "1990–2004" } },
  { key: "rushTD", label: "Rushing touchdowns", pos: RUSH, nfl: { val: 164, name: "Emmitt Smith", team: "DAL/ARI", yrs: "1990–2004" } },
  { key: "rec", label: "Receptions", pos: CATCH, nfl: { val: 1549, name: "Jerry Rice", team: "SF/LV/SEA", yrs: "1985–2004" } },
  { key: "recYds", label: "Receiving yards", pos: CATCH, nfl: { val: 22895, name: "Jerry Rice", team: "SF/LV/SEA", yrs: "1985–2004" } },
  { key: "recTD", label: "Receiving touchdowns", pos: CATCH, nfl: { val: 197, name: "Jerry Rice", team: "SF/LV/SEA", yrs: "1985–2004" } },
  { key: "sacks", label: "Sacks", def: true, nfl: { val: 200, name: "Bruce Smith", team: "BUF/WAS", yrs: "1985–2003" } },
  { key: "ints", label: "Interceptions", def: true, nfl: { val: 81, name: "Paul Krause", team: "WAS/MIN", yrs: "1964–1979" } },
];
const counts = (d, pos) => (d.def ? !OFF.has(pos) : d.pos.includes(pos));

// His real totals before the league (every club, summed), by normalized name.
let before = null;
function preLeague(name) {
  if (!before) {
    before = new Map();
    for (const [k, v] of Object.entries(TEAM_CAREER_BASE)) {
      const n = k.split("|")[0], sum = before.get(n) || TEAM_CAREER_KEYS.map(() => 0);
      v.forEach((x, i) => { sum[i] += x || 0; });
      before.set(n, sum);
    }
  }
  return before.get(normName(name));
}
const isReal = (p) => !(p?.draftYr >= 2026);

// His NFL career in one stat: before the league (real players) plus the league so far.
export function nflCareer(p, key) {
  const d = CAREER_DEFS.find((x) => x.key === key);
  if (!d || !counts(d, p.pos)) return 0;
  const pre = isReal(p) ? preLeague(p.name)?.[TEAM_CAREER_KEYS.indexOf(key)] || 0 : 0;
  return pre + (careerTotals(p)[key] || 0);
}

export const newCareerBook = () => Object.fromEntries(CAREER_DEFS.map((d) => [d.key, { ...d.nfl, nfl: true }]));

// After a week: has anyone passed an NFL career mark? Returns { book, broken: [{ career: true,
// key, label, name, pid, pos, team, ti, val, yr, prev }] } (a holder adding to his own mark isn't news).
export function updateNflCareer(book, teams, yr) {
  const career = { ...newCareerBook(), ...(book.career || {}) };
  const history = [...(book.history || [])];
  const broken = [];
  for (const d of CAREER_DEFS) {
    let top = null;
    teams.forEach((t, ti) => everyone(t).forEach((p) => { const v = nflCareer(p, d.key); if (v > 0 && (!top || v > top.v)) top = { p, t, ti, v }; }));
    const cur = career[d.key];
    if (!top || top.v <= cur.val) continue;
    if (cur.pid === top.p.id) { career[d.key] = { ...cur, val: top.v, team: top.t.ab }; continue; }
    const prev = { val: cur.val, name: cur.name, team: cur.team, yr: cur.yrs || cur.yr };
    career[d.key] = { val: top.v, name: top.p.name, pid: top.p.id, pos: posTag(top.p), team: top.t.ab, yr, prev };
    const e = { career: true, key: d.key, label: d.label, name: top.p.name, pid: top.p.id, pos: posTag(top.p), team: top.t.ab, ti: top.ti, val: top.v, yr, prev };
    broken.push(e); history.push(e);
  }
  return { book: { ...book, career, history }, broken };
}

// The closest active players to each mark (not the holder himself): { key: { name, pid, team, v } }.
export function careerChasers(book, teams) {
  const out = {};
  for (const d of CAREER_DEFS) {
    const holder = book.career?.[d.key]?.pid;
    let top = null;
    teams.forEach((t) => everyone(t).forEach((p) => { if (p.id === holder) return; const v = nflCareer(p, d.key); if (v > 0 && (!top || v > top.v)) top = { name: p.name, pid: p.id, team: t.ab, v }; }));
    if (top) out[d.key] = top;
  }
  return out;
}

// Career milestones (the real career, so a veteran's start counts): round numbers worth a line in
// the log. Each is news once, the week he passes it.
export const MILESTONES = {
  passYds: [20000, 30000, 40000, 50000, 60000, 70000, 80000], passTD: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600],
  rushYds: [5000, 7500, 10000, 12500, 15000, 17500], rushTD: [50, 75, 100, 125, 150],
  rec: [500, 750, 1000, 1250, 1500], recYds: [5000, 7500, 10000, 12500, 15000, 17500, 20000], recTD: [50, 75, 100, 125, 150, 175],
  sacks: [50, 75, 100, 125, 150, 175], ints: [25, 40, 50, 60, 70],
};
// The milestones he has passed this season and not yet been told about: from where he stood when
// the season began (so a veteran's old milestones never come up) to now. p.ms keeps the ones
// already announced ("passYds:50000").
export function newMilestones(p) {
  const out = [];
  for (const d of CAREER_DEFS) {
    const now = nflCareer(p, d.key), start = now - (counts(d, p.pos) ? p.ss?.[d.key] || 0 : 0);
    for (const m of MILESTONES[d.key] || []) if (start < m && now >= m && !(p.ms || []).includes(`${d.key}:${m}`)) out.push({ key: d.key, label: d.label, m, val: now });
  }
  return out;
}

// Where his career stands all-time, for the stats his position is about: [{ key, label, val, rank,
// next, toList }]. The real top 25 (StatMuse) with everyone in your league counted at his live total
// instead of the real list's number (a real player's entry is replaced by him). rank: his place, when
// he's at least the real #25's total (below it, players outside the list could be ahead: toList is
// how far he has to go). next: the man just above him. league: every player in the league (active,
// free agents, retired cards).
// [his position's own stats, others shown only when he ranks in them]
const SHOW = { QB: [["passYds", "passTD"], ["rushYds", "rushTD"]], RB: [["rushYds", "rushTD"], ["rec", "recYds"]], FB: [["rushYds"], ["recYds"]], WR: [["rec", "recYds", "recTD"], []], TE: [["rec", "recYds", "recTD"], []], CB: [["ints"], ["sacks"]], S: [["ints"], ["sacks"]] };
export function careerStanding(p, league = []) {
  if (!p) return [];
  const [main, extra] = SHOW[p.pos] || (OFF.has(p.pos) ? [[], []] : [["sacks"], ["ints"]]), keys = [...main, ...extra];
  const me = normName(p.name), others = league.filter((q) => q && q.id !== p.id && normName(q.name) !== me);
  const live = new Set([me, ...others.map((q) => normName(q.name))]);
  const out = [];
  for (const key of keys) {
    const val = nflCareer(p, key);
    if (!(val > 0)) continue;
    const real = NFL_CAREER_LEADERS[key] || [], v25 = real.length ? real[real.length - 1].v : Infinity;
    const board = [...real.filter((r) => !live.has(normName(r.n))).map((r) => ({ name: r.n, v: r.v })), ...others.map((q) => ({ name: q.name, v: nflCareer(q, key) })).filter((r) => r.v > 0)];
    const above = board.filter((r) => r.v > val).sort((a, b) => a.v - b.v);
    const rank = val >= v25 ? above.length + 1 : null;
    if (!rank && !main.includes(key)) continue;
    out.push({ key, label: CAREER_DEFS.find((d) => d.key === key).label, val, rank, next: rank && rank > 1 ? above[0] : null, toList: rank ? 0 : v25 - val });
  }
  return out;
}
