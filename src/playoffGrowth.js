// Big playoff nights pay off: each standout game a player has in the postseason is remembered on him
// (p.po), and the Super Bowl MVP is marked too. At the next league year they turn into a small
// rating boost, on top of honors and awards.
export const BIG = 22, HUGE = 32;
// The same yardstick as the Super Bowl MVP pick: what one stat line is worth.
export const playoffScore = (l) => (l.passYds || 0) / 25 + (l.passTD || 0) * 4 - (l.passInt || 0) * 3 + (l.rushYds || 0) / 10 + (l.recYds || 0) / 10 + ((l.rushTD || 0) + (l.recTD || 0)) * 6 + (l.sacks || 0) * 5 + (l.ints || 0) * 6 + (l.tkl || 0) * 0.5;

// Players with a big game in this box score: [{ pid, s }] (pid as a string, the box's key).
export function playoffStandouts(box) {
  return Object.entries(box || {}).map(([pid, l]) => ({ pid, s: Math.round(playoffScore(l)) })).filter((x) => x.s >= BIG);
}

// One round's results stamped on the rosters: standout games, and the Super Bowl MVP when given.
export function stampPlayoffs(teams, games, yr, rd, sbmvpPid) {
  const hit = new Map();
  for (const g of games) for (const b of [g.boxH, g.boxA]) for (const x of playoffStandouts(b)) hit.set(x.pid, x.s);
  return teams.map((t) => {
    if (!t.roster.some((p) => hit.has(String(p.id)) || String(p.id) === sbmvpPid)) return t;
    return { ...t, roster: t.roster.map((p) => {
      const id = String(p.id), s = hit.get(id), mvp = id === sbmvpPid;
      if (s == null && !mvp) return p;
      return { ...p, po: [...(p.po || []), { yr, rd, s: s ?? BIG, ...(mvp ? { mvp: true } : {}) }].slice(-30) };
    }) };
  });
}

// What a postseason earns him next year: +2 for Super Bowl MVP, +1 for each huge game, +1 for two or
// more big ones (or one in a conference title game or the Super Bowl); three at most. Veterans past their prime keep it smaller (one point).
export function playoffBoost(p, yr, pastPrime = false) {
  const games = (p.po || []).filter((g) => g.yr === yr);
  if (!games.length) return { ovr: 0, notes: [] };
  const notes = [];
  let ovr = 0;
  if (games.some((g) => g.mvp)) { ovr += 2; notes.push("Super Bowl MVP"); }
  const huge = games.filter((g) => g.s >= HUGE).length;
  if (huge) { ovr += huge; notes.push(huge > 1 ? `${huge} huge playoff games` : "a huge playoff game"); }
  else if (games.length >= 2 || games.some((g) => g.rd >= 3)) { ovr += 1; notes.push(games.length >= 2 ? `${games.length} big playoff games` : "a big game on the biggest stage"); }
  if (!notes.length) notes.push("a big playoff game");
  return { ovr: Math.min(pastPrime ? 1 : 3, ovr), notes };
}
