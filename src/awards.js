// End-of-regular-season awards from everyone's season stats: MVP, Offensive and Defensive Player
// of the Year, the two Rookie of the Year awards, Comeback Player of the Year and Coach of the Year.
// Winning teams help an MVP case.
import { posTag } from "./dline.js";
import { gradesOf } from "./grades.js";
const s = (p, k) => p.ss?.[k] || 0;

const qbScore = (p) => s(p, "passYds") / 20 + s(p, "passTD") * 5 - s(p, "passInt") * 4 + s(p, "rushYds") / 10 + s(p, "rushTD") * 6;
const skillScore = (p) => (s(p, "rushYds") + s(p, "recYds")) / 10 + (s(p, "rushTD") + s(p, "recTD")) * 6;
const offScore = (p) => (p.pos === "QB" ? qbScore(p) : skillScore(p) * 1.25);
// Sacks carry Defensive Player of the Year, like the real award (pass rushers win most years); at 0.3 a
// tackle, a 155-tackle linebacker outscored an 18-sack edge and linebackers won 19 years out of 20. A
// linebacker still wins with a monster season (double-digit sacks on top of his tackles).
// Defense: the box score, plus what it misses: pressures (a rusher who's always in the quarterback's
// face), and how well he played over the season (his grade, which rates every snap he took), so a
// dominant player isn't out-voted by a teammate-aided stat line or a couple of lucky fumbles.
const defScore = (p) => {
  const g = gradesOf(p.ss, p.pos)?.overall;
  return s(p, "sacks") * 8 + s(p, "ints") * 5 + s(p, "tkl") * 0.1 + s(p, "ff") * 4 + s(p, "pd") * 1 + s(p, "tfl") * 1 + s(p, "pres") * 0.35 + (g != null ? (g - 65) * 2 : 0);
};

const statLine = (p) => {
  if (p.pos === "QB") return `${s(p, "passYds")} yds · ${s(p, "passTD")} TD · ${s(p, "passInt")} INT`;
  if (["RB", "WR", "TE"].includes(p.pos)) {
    const ry = s(p, "rushYds"), cy = s(p, "recYds"), td = s(p, "rushTD") + s(p, "recTD");
    return ry >= cy ? `${ry} rush yds · ${td} TD` : `${s(p, "rec")} rec · ${cy} yds · ${td} TD`;
  }
  const bits = [];
  if (s(p, "sacks")) bits.push(`${s(p, "sacks")} sack${s(p, "sacks") === 1 ? "" : "s"}`);
  if (s(p, "ints")) bits.push(`${s(p, "ints")} INT`);
  bits.push(`${s(p, "tkl")} tkl`);
  return bits.join(" · ");
};

// The season a player is a rookie. rkYr is stamped when he joins the league; older saves fall back
// to the draft year (players drafted in this league were picked the off-season before their first season).
export function rookieSeason(p) {
  if (p.rkYr != null) return p.rkYr;
  if (p.draftPk > 0 && p.draftYr > 0) return p.draftYr + 1;
  return p.draftYr > 0 ? p.draftYr : null;
}

// Stamp rkYr on every player who lacks it. realYears: "name|pos" -> rookie season for the real
// players in the Madden data (the 2026 rookies are 2026), so saves made before the real rookies
// were marked still find them.
export function tagRookieYears(teams, realYears = {}) {
  const tag = (p) => {
    if (!p || p.rkYr != null) return p;
    if (!(p.draftPk > 0)) {
      const ry = realYears[`${p.name}|${p.pos}`];
      if (ry != null) return { ...p, draftYr: ry, rkYr: ry };
    }
    const r = rookieSeason(p);
    return r != null ? { ...p, rkYr: r } : p;
  };
  return (teams || []).map((t) => ({ ...t, roster: (t.roster || []).map(tag), ...(t.ir ? { ir: t.ir.map(tag) } : {}) }));
}

// Rookie awards for a season that already rolled over: a player's first season is all his career
// stats hold until the next one ends, so last year's rookies can still be judged from them.
export function pastRookieAwards(teams, yr) {
  const asCareer = teams.map((t) => ({ ...t, roster: (t.roster || []).filter((p) => rookieSeason(p) === yr).map((p) => ({ ...p, ss: p.cs || {} })) }));
  const w = seasonAwardWinners(asCareer, yr);
  return { oroy: w.oroy, droy: w.droy };
}

// teams: every club (players carry .ss season stats). yr: the season. Returns { yr, mvp, opoy,
// dpoy, oroy, droy }, each { pid, name, pos, ti, team, stat } or null.
export function seasonAwardWinners(teams, yr) {
  const all = [];
  teams.forEach((t, ti) => (t.roster || []).forEach((p) => { if (s(p, "gp") >= 8) all.push({ p, ti, w: t.w || 0 }); }));
  const pick = (list, score) => {
    const b = list.reduce((x, c) => (!x || score(c) > score(x) ? c : x), null);
    return b && { pid: b.p.id, name: b.p.name, pos: posTag(b.p), ti: b.ti, team: teams[b.ti].ab, stat: statLine(b.p) };
  };
  const off = all.filter((x) => ["QB", "RB", "WR", "TE"].includes(x.p.pos));
  const def = all.filter((x) => ["DL", "LB", "CB", "S"].includes(x.p.pos));
  const mvp = pick(off, (x) => offScore(x.p) * (x.p.pos === "QB" ? 1 : 0.8) + x.w * 8);
  // Offensive Player of the Year goes to the best non-quarterback most years, as it does in the NFL: a
  // quarterback has to outdo the top back or receiver by a lot (a quarterback won 13 of 20 at full weight)
  const opoy = pick(off.filter((x) => x.p.id !== mvp?.pid), (x) => offScore(x.p) * (x.p.pos === "QB" ? 0.7 : 1));
  const dpoy = pick(def, (x) => defScore(x.p));
  const rookie = (x) => rookieSeason(x.p) === yr;
  const oroy = pick(off.filter(rookie), (x) => offScore(x.p));
  const droy = pick(def.filter(rookie), (x) => defScore(x.p));
  // Comeback Player of the Year: eight games or fewer last season (hurt or benched), a big one now.
  const lostLast = (p) => { const l = (p.sh || []).find((x) => x.y === yr - 1); return !!l && (l.gp || 0) <= 8; };
  const back = (x) => (["QB", "RB", "WR", "TE"].includes(x.p.pos) ? offScore(x.p) * (x.p.pos === "QB" ? 0.6 : 1) : defScore(x.p) * 1.6);
  const cpoy = pick([...off, ...def].filter((x) => s(x.p, "gp") >= 12 && lostLast(x.p) && x.p.id !== mvp?.pid), back);
  // Coach of the Year: the head coach whose club won the most, with a big jump from last season (lw)
  // counting extra, the way the real voting rewards turnarounds.
  let coy = null, best = -1e9;
  teams.forEach((t, ti) => {
    const hc = t.coach?.hc;
    if (!hc) return;
    const w = t.w || 0, jump = t.lw != null ? w - t.lw : 0, sc = w + jump * 0.8;
    if (sc > best) { best = sc; coy = { pid: hc.id, name: hc.name, pos: "HC", ti, team: t.ab, stat: `${w}-${t.l || 0}${t.t ? `-${t.t}` : ""}${t.lw != null && jump > 0 ? `, up from ${t.lw} wins` : ""}` }; }
  });
  return { yr, mvp, opoy, dpoy, oroy, droy, cpoy, coy };
}

// The award races during the season: the top n for each award by the same scoring as the awards
// themselves (no minimum games yet, so a hot start shows up). { mvp: [...], opoy, dpoy, oroy, droy },
// each entry { pid, name, pos, ti, team, stat }.
export function awardRaces(teams, yr, n = 5) {
  const all = [];
  teams.forEach((t, ti) => (t.roster || []).forEach((p) => { if (s(p, "gp") >= 1) all.push({ p, ti, w: t.w || 0 }); }));
  const top = (list, score) => [...list].sort((a, b) => score(b) - score(a)).slice(0, n).map((b) => ({ pid: b.p.id, name: b.p.name, pos: posTag(b.p), ti: b.ti, team: teams[b.ti].ab, stat: statLine(b.p) }));
  const off = all.filter((x) => ["QB", "RB", "WR", "TE"].includes(x.p.pos));
  const def = all.filter((x) => ["DL", "LB", "CB", "S"].includes(x.p.pos));
  const rookie = (x) => rookieSeason(x.p) === yr;
  const mvp = top(off, (x) => offScore(x.p) * (x.p.pos === "QB" ? 1 : 0.8) + x.w * 8);
  return {
    mvp,
    // like the award, the MVP front-runner isn't in this race too
    opoy: top(off.filter((x) => x.p.id !== mvp[0]?.pid), (x) => offScore(x.p) * (x.p.pos === "QB" ? 0.7 : 1)),
    dpoy: top(def, (x) => defScore(x.p)),
    oroy: top(off.filter(rookie), (x) => offScore(x.p)),
    droy: top(def.filter(rookie), (x) => defScore(x.p)),
  };
}
