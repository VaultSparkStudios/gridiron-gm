// Contract-year drama. Before the season, your good players in the last year of their deals want
// to know where they stand: extend them now (at today's price) or let them play it out. A player
// who plays it out is betting on himself: he works harder (a chance to gain a point or two of OVR
// during the season), and his asking price follows the year he has (the contract-year stats system), so a
// big season costs you more in re-sign week. A star playing out his deal on a losing team gets
// restless: there's a chance he asks out.
const pct = (t) => (t.w + 0.5 * (t.t || 0)) / Math.max(1, t.w + t.l + (t.t || 0));

export const CY_MIN_OVR = 78;
export const CY_DECIDE_BY = 4; // week the "talk to him" window closes

// Your contract-year players still waiting to hear from you.
export function contractYearAsks(team, yr) {
  return (team?.roster || []).filter((p) => (p.contract || 0) === 1 && (p.ovr || 0) >= CY_MIN_OVR && !p.ext && !p.holdout && !(p.cyr?.yr === yr && p.cyr.choice))
    .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
}

// He plays it out. Returns the updated player.
export const playItOut = (p, yr) => ({ ...p, cyr: { yr, choice: "bet", gain: 0, asked: false } });

// One regular-season week for your club's contract-year bets. Mutates the players and the team.
// Returns news lines.
export function contractYearWeek(team, yr, wk, rand = Math.random) {
  const news = [];
  for (const p of team.roster || []) {
    const c = p.cyr;
    if (!c || c.yr !== yr || c.choice !== "bet" || (p.contract || 0) !== 1 || p.injured) continue;
    // playing for his next deal
    if ((c.gain || 0) < 2 && rand() < 0.08) {
      p.ovr = Math.min(99, p.ovr + 1);
      if (p.trueOvr != null) p.trueOvr = Math.max(p.trueOvr, p.ovr);
      c.gain = (c.gain || 0) + 1;
      news.push(`CONTRACT YEAR: ${p.name} (${p.pos}) is playing for his next deal: +1 OVR → ${p.ovr}`);
    }
    // a star betting on himself on a losing team gets restless
    const games = team.w + team.l + (team.t || 0);
    if (!c.asked && (p.ovr || 0) >= 85 && wk >= 7 && games >= 6 && pct(team) <= 0.4 && rand() < 0.12) {
      c.asked = true;
      p.tradeRequest = true;
      news.push(`CONTRACT YEAR: ${p.name} (${p.pos}), playing out his deal on a ${team.w}-${team.l} team, wants out. He's asked for a trade.`);
    }
  }
  return news;
}
