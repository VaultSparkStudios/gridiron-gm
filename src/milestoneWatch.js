// Milestone watch for a live game: your players closing in on a season milestone (1,000 yards,
// 4,000 passing, 10 sacks...), counting what they've done so far today. ss: the season before this
// game; live: this game's lines by player id (liveView).
const DEFS = [
  ["passYds", "passYds", "passing yards", [3000, 4000, 5000], 350],
  ["rushYds", "rushYds", "rushing yards", [1000, 1500, 2000], 130],
  ["recYds", "recYds", "receiving yards", [1000, 1500, 2000], 130],
  ["sacks", "sack", "sacks", [10, 15, 20], 2],
];

// roster: your players; live: { [id]: line }. Returns { chase: [...], hit: [...] }, each
// { id, name, label, target, need }.
export function milestoneWatch(roster, live = {}) {
  const chase = [], hit = [];
  for (const p of roster || []) {
    for (const [sk, lk, label, targets, reach] of DEFS) {
      const before = p.ss?.[sk] || 0;
      const now = before + (live[p.id]?.[lk] || 0);
      const target = targets.find((t) => t > before);
      if (!target || before === 0) continue;
      const e = { id: p.id, name: p.name, label, target, need: Math.max(0, target - now) };
      if (now >= target) hit.push(e);
      else if (target - before <= reach) chase.push(e);
    }
  }
  chase.sort((a, b) => a.need / a.target - b.need / b.target);
  return { chase: chase.slice(0, 3), hit };
}

// Records falling in a live game: your players within reach of their club's single-season record
// (or the NFL's), counting today. [season stat, live stat, label, reach, positions that count].
// Touchdowns come in one live number: a quarterback's are mostly passing, a back's rushing, a
// receiver's receiving.
const REC = [
  ["passYds", "passYds", "passing yards", 400, ["QB"]],
  ["passTD", "td", "passing TDs", 4, ["QB"]],
  ["rushYds", "rushYds", "rushing yards", 150, ["RB", "QB", "WR"]],
  ["rushTD", "td", "rushing TDs", 3, ["RB"]],
  ["rec", "rec", "catches", 10, ["WR", "TE", "RB"]],
  ["recYds", "recYds", "receiving yards", 150, ["WR", "TE", "RB"]],
  ["recTD", "td", "receiving TDs", 3, ["WR", "TE"]],
  ["sacks", "sack", "sacks", 3, ["DL", "LB"]],
  ["ints", "int", "interceptions", 2, ["CB", "S", "LB"]],
];
// team: your club; live: { [id]: line }; book: the record book. Returns { chase, hit }, each
// { id, name, label, need, scope: "NFL" | club name, holder, val }; the NFL record first when both.
export function recordChase(team, live = {}, book = {}) {
  const chase = [], hit = [];
  const fr = book.franchise?.[team?.ab] || {};
  for (const p of team?.roster || []) {
    for (const [sk, lk, label, reach, pos] of REC) {
      if (!pos.includes(p.pos)) continue;
      const before = p.ss?.[sk] || 0, now = before + (live[p.id]?.[lk] || 0);
      if (!before && !now) continue;
      for (const [rec, scope] of [[book.best?.[sk], "NFL"], [fr[sk], team.name]]) {
        if (!rec || before > rec.val) continue;
        const e = { id: p.id, name: p.name, label, scope, holder: rec.name, val: rec.val, need: Math.max(0, Math.floor(rec.val - now) + 1) };
        if (now > rec.val) { hit.push(e); break; }
        if (rec.val - before <= reach) { chase.push(e); break; }
      }
    }
  }
  chase.sort((a, b) => a.need - b.need);
  return { chase: chase.slice(0, 2), hit };
}
