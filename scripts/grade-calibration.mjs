// Grade calibration (src/grades.js CAL): plays SEASONS (default 4) seasons of the real league, every club
// once a week, and prints each player-season's line as JSON. Then:
//   node scripts/grade-calibration.mjs 4 > /tmp/cal.json && python3 scripts/grade-calibration.py /tmp/cal.json
// prints, per position and facet, the per-snap mean, spread and a regular's snaps (the CAL numbers), with
// how well the grade tracks the rating and itself year to year.
import { readFileSync } from "node:fs";
import * as NEW from "../src/playsim.js";
import { teamSnaps } from "../src/snaps.js";
const M = JSON.parse(readFileSync(new URL("../src/data/madden27.json", import.meta.url)));
const SP = JSON.parse(readFileSync(new URL("../src/data/special.json", import.meta.url)));
const ROS = {};
const T = M.teams.map((t, ti) => {
  const roster = [...t.roster, ...SP.punters.filter((p) => p.team === t.ab).slice(0, 1)].map((p, i) => ({ ...p, id: `${ti}-${i}`, ...(p.pos === "P" ? { posAttrs: p.attrs } : {}) }));
  roster.forEach((p) => (ROS[p.id] = { ...p, team: t.ab }));
  const order = (pos) => roster.filter((p) => p.pos === pos).sort((a, b) => (a.dk ?? 99) - (b.dk ?? 99) || b.ovr - a.ovr);
  return NEW.makeSide({ team: t, order, snaps: teamSnaps(order, {}) });
});
const lcg = (s) => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
const SEASONS = +(process.argv[2] || 1);
const tot = {};
let gi = 0;
// round robin by the circle method: every club once a week
for (let s = 0; s < SEASONS; s++) for (let wk = 0; wk < 17; wk++) {
  const ring = [0, ...Array.from({ length: 31 }, (_, i) => 1 + ((i + wk + s * 5) % 31))];
  for (let i = 0; i < 16; i++) {
    const h = ring[i], a = ring[31 - i];
    const g = NEW.playGame(NEW.createGame(T[h], T[a], { rand: lcg(++gi * 977) }));
    for (const side of ["h", "a"]) for (const [id, l] of Object.entries(g.box[side])) { const o = (tot[`${id}|${s}`] ||= {}); for (const [k, v] of Object.entries(l)) if (typeof v === "number") o[k] = (o[k] || 0) + v; }
  }
}
const out = Object.entries(tot).map(([key, s]) => { const [id, yr] = key.split("|"); return { id, yr: +yr, ...ROS[id], s }; });
console.log(JSON.stringify(out));
