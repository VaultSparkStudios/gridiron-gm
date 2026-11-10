import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeSide, createGame, playGame } from "../src/playsim.js";
import { teamSnaps } from "../src/snaps.js";
import { gradesOf } from "../src/grades.js";

// One season of the real league, every club once a week, each player's season line summed.
const M = JSON.parse(readFileSync(new URL("../src/data/madden27.json", import.meta.url)));
const SP = JSON.parse(readFileSync(new URL("../src/data/special.json", import.meta.url)));
const who = {};
const sides = M.teams.map((t, ti) => {
  const roster = [...t.roster, ...SP.punters.filter((p) => p.team === t.ab).slice(0, 1)].map((p, i) => ({ ...p, id: `${ti}-${i}`, ...(p.pos === "P" ? { posAttrs: p.attrs } : {}) }));
  roster.forEach((p) => (who[p.id] = p));
  const order = (pos) => roster.filter((p) => p.pos === pos).sort((a, b) => (a.dk ?? 99) - (b.dk ?? 99) || b.ovr - a.ovr);
  return makeSide({ team: t, order, snaps: teamSnaps(order, {}) });
});
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const lines = {};
for (let wk = 0; wk < 17; wk++) {
  const ring = [0, ...Array.from({ length: 31 }, (_, i) => 1 + ((i + wk) % 31))];
  for (let i = 0; i < 16; i++) {
    const g = playGame(createGame(sides[ring[i]], sides[ring[31 - i]], { rand }));
    for (const s of ["h", "a"]) for (const [id, l] of Object.entries(g.box[s])) { const o = (lines[id] ||= {}); for (const [k, v] of Object.entries(l)) if (typeof v === "number") o[k] = (o[k] || 0) + v; }
  }
}
const graded = (pos) => Object.entries(lines).filter(([id]) => who[id]?.pos === pos).map(([id, s]) => ({ p: who[id], s, g: gradesOf(s, pos) })).filter((r) => r.g);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const corr = (x, y) => { const mx = x.reduce((a, b) => a + b) / x.length, my = y.reduce((a, b) => a + b) / y.length; let n = 0, sx = 0, sy = 0; x.forEach((v, i) => { n += (v - mx) * (y[i] - my); sx += (v - mx) ** 2; sy += (y[i] - my) ** 2; }); return n / Math.sqrt(sx * sy); };

test("grades read like PFF's: an average regular in the 60s, a few elite", () => {
  for (const pos of ["QB", "WR", "RB", "DL", "LB", "CB", "LT"]) {
    const g = graded(pos).map((r) => r.g.overall);
    assert.ok(g.length >= 20 || pos === "QB" || pos === "LT", `${pos}: ${g.length} graded`);
    const m = median(g);
    assert.ok(m >= 57 && m <= 76, `${pos} median ${m}`);
    assert.ok(Math.max(...g) >= 78, `${pos} best ${Math.max(...g)}`);
  }
});

test("a grade says how good he is: better players grade higher", () => {
  for (const pos of ["WR", "RB", "DL", "CB"]) {
    const r = graded(pos).filter((x) => Object.values(x.g.facets).length);
    const c = corr(r.map((x) => x.p.ovr), r.map((x) => x.g.overall));
    // a lineman's season is noisier (r runs about 0.35-0.45 across seeds), so his floor is lower
    assert.ok(c > (pos === "DL" ? 0.3 : 0.35), `${pos} grade vs rating r=${c.toFixed(2)}`);
  }
});

test("pressures: a team gets 150-300 a season; the best rushers 60-130", () => {
  const team = {}; const top = [];
  for (const [id, s] of Object.entries(lines)) { const t = id.split("-")[0]; team[t] = (team[t] || 0) + (s.pres || 0); if (who[id]?.pos === "DL") top.push(s.pres || 0); }
  const m = Object.values(team).reduce((a, b) => a + b) / 32;
  assert.ok(m >= 150 && m <= 300, `team pressures ${m}`);
  const best = Math.max(...top);
  assert.ok(best >= 60 && best <= 130, `best rusher ${best}`);
});

test("no grade on a handful of snaps", () => {
  assert.equal(gradesOf({ rcG: 3, rcN: 4 }, "WR"), null);
  assert.equal(gradesOf(null, "WR"), null);
});
