// What a club needs, one answer for the whole game: your scouts and their shortlist, the draft
// room, free agency, the trade screens and the AI clubs' drafts and trades all read it.
//
// A position is a need when its starters are below par now, or soon will be: a starter in his
// last contract year or past the age his position declines at counts for less, since he may not
// be there (or as good) next season. A thin bench (no real backup) adds a little. The defensive
// line is two needs, edge rushers and interior tackles, since a club can be set at one and bare
// at the other.
import { posTag } from "./dline.js";

// The position a player fills when weighing needs (a DL is an EDGE or a DT).
export const needGroup = (p) => (p?.pos === "DL" ? posTag(p) : p?.pos);
export const NEED_STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, EDGE: 2, DT: 2, LB: 3, CB: 3, S: 2, K: 1, P: 1 };
// the age a position starts to slide (see the aging curves in league.js)
const DECLINE = { QB: 35, RB: 29, WR: 31, TE: 31, LT: 33, LG: 33, C: 33, RG: 33, RT: 33, EDGE: 31, DT: 31, LB: 30, CB: 30, S: 31, K: 38, P: 38 };
// starters you'd want an able backup behind
const BENCH = { QB: 1, RB: 1, WR: 1, TE: 1, LT: 1, EDGE: 1, DT: 1, LB: 1, CB: 1, S: 1 };
const NAME = { QB: "quarterback", RB: "running back", WR: "receiver", TE: "tight end", LT: "left tackle", LG: "left guard", C: "center", RG: "right guard", RT: "right tackle", EDGE: "edge rusher", DT: "defensive tackle", LB: "linebacker", CB: "cornerback", S: "safety", K: "kicker", P: "punter" };
export const needName = (g) => NAME[g] || g;
const clamp = (v) => Math.max(0, Math.min(1, v));
const PAR = 82, SPAN = 16;

// A club's personnel identity changes how many it needs at a spot: a two-tight-end offense starts
// two tight ends and two receivers (a third receiver barely plays), a fullback team two receivers.
const PERS_STARTERS = { twoTE: { WR: 2, TE: 2 }, heavy: { WR: 2, TE: 2 }, fullback: { WR: 2 } };

// roster: the club's 53 (injured players out for the season don't count now, but do next year).
// personnel: its offensive identity, if it set one (personnel.js).
// Returns { score: { [group]: 0..1 }, list: [{ pos, score, why }] neediest first }.
export function teamNeeds(roster, personnel) {
  const by = {};
  for (const p of roster || []) { const g = needGroup(p); if (g in NEED_STARTERS) (by[g] ||= []).push(p); }
  const score = {}, list = [];
  for (const [g, n] of Object.entries({ ...NEED_STARTERS, ...(PERS_STARTERS[personnel] || {}) })) {
    const all = [...(by[g] || [])].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    const healthy = all.filter((p) => !(p.injured && (p.injWk || 0) > 8));
    const starters = healthy.slice(0, n);
    const now = avg(pad(starters.map((p) => p.ovr || 0), n));
    // next season: expiring deals and aging starters count for less
    const later = avg(pad(all.slice(0, n).map((p) => (p.ovr || 0) - ((p.contract ?? 2) <= 1 ? 10 : 0) - ((p.age || 26) >= DECLINE[g] ? 5 + 2 * ((p.age || 26) - DECLINE[g]) : 0)), n));
    const backup = healthy[n]?.ovr ?? 45;
    let s = 0.55 * clamp((PAR - now) / SPAN) + 0.35 * clamp((PAR - later) / SPAN) + (BENCH[g] ? 0.1 * clamp((66 - backup) / 16) : 0);
    const why = [];
    if (starters.length < n) why.push(starters.length ? `only ${starters.length} healthy starter${starters.length > 1 ? "s" : ""}` : `no ${needName(g)}`);
    else if (now < 74) why.push(`starter${n > 1 ? "s" : ""} rated ${Math.round(now)}`);
    const old = all.slice(0, n).filter((p) => (p.age || 26) >= DECLINE[g]);
    const exp = all.slice(0, n).filter((p) => (p.contract ?? 2) <= 1);
    if (old.length) why.push(`${old[0].name} is ${old[0].age}`);
    if (exp.length) why.push(`${exp[0].name}'s deal is up`);
    if (BENCH[g] && backup < 60 && starters.length >= n) why.push("no real backup");
    // nothing stood out on its own: still say who's there, so every need reads with a reason
    if (!why.length) why.push(starters.length ? (n > 1 ? `starters rated ${Math.round(now)}` : `${starters[0].name} rated ${starters[0].ovr}`) : `no ${needName(g)}`);
    // a real starting quarterback (not near the end, not leaving) means no quarterback need
    if (g === "QB") {
      const q = all[0], next = all[1];
      if (q && q.ovr >= 76 && (q.age || 27) <= 33 && (q.contract ?? 2) > 1) s = Math.min(s, 0.1);
      // near the end or leaving, with nobody ready behind him: time to find the quarterback of the future
      else if (q && ((q.age || 27) >= 34 || (q.contract ?? 2) <= 1) && !(next && next.ovr >= 74 && (next.age || 27) <= 30)) { s = Math.max(s, 0.45); why.push("no quarterback of the future"); }
    }
    if (g === "K" || g === "P") s *= 0.5; // easy to fill, never a premium need
    score[g] = +s.toFixed(3);
    list.push({ pos: g, score: score[g], why });
  }
  list.sort((a, b) => b.score - a.score);
  return { score, list };
}
const pad = (xs, n) => { const o = xs.slice(0, n); while (o.length < n) o.push(50); return o; };
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

// The positions a club needs most (only real needs; up to n).
export const topNeeds = (roster, n = 3, min = 0.2) => teamNeeds(roster).list.filter((x) => x.score >= min).slice(0, n).map((x) => x.pos);
// Does this player fill one of these needs?
export const fillsNeed = (needs, p) => needs.includes(needGroup(p));
