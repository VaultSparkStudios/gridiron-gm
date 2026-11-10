// The injury report. Questionable players are playing hurt: they suit up at a reduced rating.
// Doubtful players miss the next game and are back the week after; Out players miss longer;
// injured reserve shows when a player can come back.
// wk: games played so far this season (the next game is wk + 1).
// The last week anyone plays: Week 18, then four playoff rounds (the Super Bowl is week 22). An
// injury that heals after that is season-ending: the report says so instead of "back wk 25".
export const SEASON_LAST_WK = 22;
// When he's back, in words: a regular-season week, or the playoff round (weeks 19-22) he returns for.
const ROUND_BACK = { 19: "for the Wild Card round", 20: "for the Divisional round", 21: "for the Conference Championship", 22: "for the Super Bowl" };
export const backText = (wk) => (wk == null ? "" : ROUND_BACK[wk] || `wk ${wk}`);
const seasonEnding = (st) => (st && st.back > SEASON_LAST_WK ? { ...st, back: null, seasonOver: true, label: `${st.label}: out for the season`, note: `${st.note} · out for the season` } : st);

export function injStatus(p, opts = {}) {
  return seasonEnding(injStatus0(p, opts));
}
function injStatus0(p, { ir = false, wk = 0 } = {}) {
  if (!p) return null;
  const back = (n) => wk + n + 1;
  if (ir) {
    const minBack = (p.irWk ?? wk) + 4 + 1;
    const healBack = p.injured ? back(p.injWk || 0) : wk + 1;
    const ret = p.irReturnWk || Math.max(minBack, healBack);
    return { tag: "IR", label: "Injured reserve", color: "#a855f7", back: ret, note: p.injured ? (p.injType || "Injured") : "Healthy: ready to activate" };
  }
  if (p.injured) {
    const n = p.injWk || 1;
    if (n <= 1 && p.injSev !== "Out") return { tag: "D", label: "Doubtful", color: "#f97316", back: back(1), note: p.injType || "Injured" };
    return { tag: "OUT", label: "Out", color: "#ef4444", back: back(n), note: p.injType || "Injured" };
  }
  if (p.hurt?.wks > 0) return { tag: "Q", label: "Questionable", color: "#eab308", back: null, pen: p.hurt.pen, note: `${p.hurt.type || "Banged up"}: playing hurt (−${p.hurt.pen} OVR)` };
  return null;
}

// The rating penalty a hurt player plays with.
export const hurtPen = (p) => (p?.hurt?.wks > 0 && !p.injured ? p.hurt.pen || 0 : 0);

// Every injury on a club, worst first: { p, st }.
export function injuryReport(team, wk) {
  const rows = [
    ...(team.roster || []).map((p) => ({ p, st: injStatus(p, { wk }) })),
    ...(team.ir || []).map((p) => ({ p, st: injStatus(p, { ir: true, wk }) })),
  ].filter((r) => r.st);
  const rank = { IR: 0, OUT: 1, D: 2, Q: 3 };
  return rows.sort((a, b) => rank[a.st.tag] - rank[b.st.tag] || (b.p.ovr || 0) - (a.p.ovr || 0));
}
