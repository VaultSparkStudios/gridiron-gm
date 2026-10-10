// End-of-regular-season awards from everyone's season stats: MVP, Offensive and Defensive Player
// of the Year, and the two Rookie of the Year awards. Winning teams help an MVP case.
const s = (p, k) => p.ss?.[k] || 0;

const qbScore = (p) => s(p, "passYds") / 20 + s(p, "passTD") * 5 - s(p, "passInt") * 4 + s(p, "rushYds") / 10 + s(p, "rushTD") * 6;
const skillScore = (p) => (s(p, "rushYds") + s(p, "recYds")) / 10 + (s(p, "rushTD") + s(p, "recTD")) * 6;
const offScore = (p) => (p.pos === "QB" ? qbScore(p) : skillScore(p) * 1.25);
const defScore = (p) => s(p, "sacks") * 5 + s(p, "ints") * 6 + s(p, "tkl") * 0.3 + s(p, "ff") * 4 + s(p, "pd") * 1.2 + s(p, "tfl") * 1.5;

const statLine = (p) => {
  if (p.pos === "QB") return `${s(p, "passYds")} yds · ${s(p, "passTD")} TD · ${s(p, "passInt")} INT`;
  if (["RB", "WR", "TE"].includes(p.pos)) {
    const ry = s(p, "rushYds"), cy = s(p, "recYds"), td = s(p, "rushTD") + s(p, "recTD");
    return ry >= cy ? `${ry} rush yds · ${td} TD` : `${s(p, "rec")} rec · ${cy} yds · ${td} TD`;
  }
  const bits = [];
  if (s(p, "sacks")) bits.push(`${s(p, "sacks")} sacks`);
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
    return b && { pid: b.p.id, name: b.p.name, pos: b.p.pos, ti: b.ti, team: teams[b.ti].ab, stat: statLine(b.p) };
  };
  const off = all.filter((x) => ["QB", "RB", "WR", "TE"].includes(x.p.pos));
  const def = all.filter((x) => ["DL", "LB", "CB", "S"].includes(x.p.pos));
  const mvp = pick(off, (x) => offScore(x.p) * (x.p.pos === "QB" ? 1 : 0.8) + x.w * 8);
  const opoy = pick(off.filter((x) => x.p.id !== mvp?.pid), (x) => offScore(x.p));
  const dpoy = pick(def, (x) => defScore(x.p));
  const rookie = (x) => rookieSeason(x.p) === yr;
  const oroy = pick(off.filter(rookie), (x) => offScore(x.p));
  const droy = pick(def.filter(rookie), (x) => defScore(x.p));
  return { yr, mvp, opoy, dpoy, oroy, droy };
}
