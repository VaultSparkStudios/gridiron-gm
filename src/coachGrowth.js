// AI coordinators grow the way yours do. Every game gives each coordinator experience (3 for a
// win, 1 for a loss; every 20 is +1 to his rating, up to 95), exactly as for your staff. Each
// off-season most clubs also put their coordinators through the development work you can buy for
// yours (+5, once a year), and now and then one takes on a specialty that fits his scheme (+3).
export const ROLES = ["oc", "dc", "st"];
export const XP_WIN = 3, XP_LOSS = 1, XP_LEVEL = 20, CAP = 95;
export const AI_DEV_ODDS = 0.6, AI_SPEC_ODDS = 0.25;
const SPEC_FOR = {
  oc: { "Power Run": "Run Game", "West Coast": "Play-Action", "Air Raid": "Spread", Spread: "Spread" },
  dc: { "3-4": "Run Stop", "4-3": "Press", "Cover 2": "Zone Cov", "Zone Blitz": "Blitz Pkg" },
  st: {},
};
const ST_SPECS = ["Kick Return", "Coverage", "Block FG"];

// One game's experience for a coordinator; returns the levels he gained.
export function coachXP(c, won) {
  if (!c) return 0;
  c.xp = (c.xp || 0) + (won ? XP_WIN : XP_LOSS);
  let up = 0;
  while (c.xp >= XP_LEVEL) { c.xp -= XP_LEVEL; if ((c.rating || 70) < CAP) { c.rating = (c.rating || 70) + 1; up++; } }
  return up;
}

// A week's games: every AI club's coordinators gain their experience (yours are handled with the
// level-up messages in the app). Ties count as losses, as they do for yours.
export function aiCoachWeek(teams, games, ui) {
  for (const g of games) {
    if (!g.played) continue;
    for (const [ti, won] of [[g.h, g.hs > g.as], [g.a, g.as > g.hs]]) {
      if (ti === ui) continue;
      const co = teams[ti]?.coach;
      if (co) for (const r of ROLES) coachXP(co[r], won);
    }
  }
}

// The off-season: development work (+5) for most AI coordinators, and the odd specialty (+3).
export function aiCoachOffseason(teams, ui, yr, rand = Math.random) {
  teams.forEach((t, i) => {
    if (i === ui) return;
    for (const r of ROLES) {
      const c = t.coach?.[r];
      if (!c) continue;
      if ((c.rating || 70) < CAP && c.aiDevYr !== yr && rand() < AI_DEV_ODDS) { c.aiDevYr = yr; c.rating = Math.min(CAP, (c.rating || 70) + 5); }
      if (!c.spec && rand() < AI_SPEC_ODDS) { c.spec = SPEC_FOR[r][c.scheme] || ST_SPECS[Math.floor(rand() * ST_SPECS.length)]; c.rating = Math.min(99, (c.rating || 70) + 3); }
    }
  });
}
