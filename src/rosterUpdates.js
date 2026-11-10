// In-season roster updates: real players whose play has outrun their ratings. Each is applied once
// to a save in the season it's made for (a franchise already past it keeps what it has), and only
// raises a player's overall: one who has grown past the update keeps his own numbers. New franchises get the
// same ratings from data/madden27.json.
export const ROSTER_UPDATES = [
  {
    // PFF had him a top-30 corner (coverage top-25) through Week 7, near the league lead in passes
    // defensed, winning in press-man against the opponent's best receiver (Nico Collins: 2 catches).
    id: "2026-10-banks", yr: 2026, name: "Deonte Banks", pos: "CB",
    ovr: 82, pot: 90, dev: "star",
    posAttrs: { manCov: 86, zoneCov: 73, press: 92, ballSkills: 78, tackling: 62, recovery: 95, footwork: 91, playRec: 77 },
  },
];

const DEV_RANK = { late: 0, normal: 1, star: 2, superstar: 3, generational: 4 };

export function applyRosterUpdates(d, list = ROSTER_UPDATES) {
  const done = [];
  if (!d || !Array.isArray(d.teams)) return done;
  for (const u of list) {
    if (d.yr != null && d.yr !== u.yr) continue;
    for (const t of d.teams) for (const p of [...(t?.roster || []), ...(t?.ps || []), ...(t?.ir || [])]) {
      if (!p || p.name !== u.name || p.pos !== u.pos || (p.upd || []).includes(u.id)) continue;
      p.upd = [...(p.upd || []), u.id];
      const behind = (p.ovr || 0) <= u.ovr;
      if (behind) { p.ovr = u.ovr; p.trueOvr = u.ovr; }
      if ((p.truePot ?? p.pot ?? 0) < u.pot) { p.pot = Math.max(p.pot || 0, u.pot); p.truePot = u.pot; }
      if ((DEV_RANK[p.dev] ?? 1) < (DEV_RANK[u.dev] ?? 1)) p.dev = u.dev;
      // the reworked skill profile (what kind of player he is), unless he's already grown past it
      if (u.posAttrs && behind) p.posAttrs = { ...(p.posAttrs || {}), ...u.posAttrs };
      if (u.arch) p.arch = u.arch;
      done.push(`${u.name} (${u.pos}) updated to ${p.ovr} OVR`);
    }
  }
  return done;
}
