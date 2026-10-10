import test from "node:test";
import assert from "node:assert/strict";
import { openFreeAgency, aiSignings, fillRosters, ROSTER_MIN, ROSTER_TARGET } from "../src/offseason.js";
import { leagueCap } from "../src/cap.js";

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const POS = Object.keys(ROSTER_MIN);
let id = 0;
function league() {
  return Array.from({ length: 32 }, (_, i) => ({
    id: i,
    roster: POS.flatMap((pos) => Array.from({ length: ROSTER_MIN[pos] + 1 }, () => ({ id: `p${id++}`, pos, ovr: 50 + Math.floor(rand() * 45), age: 22 + Math.floor(rand() * 14), contract: 1 + Math.floor(rand() * 4), salary: 2 }))),
  }));
}
const capSpace = (t) => leagueCap() - t.roster.reduce((s, p) => s + p.salary, 0);

test("free agency: contracts lose a year, expiring players re-sign, retire or hit the market", () => {
  const teams = league();
  const before = teams.flatMap((t) => t.roster).length;
  const r = openFreeAgency(teams, 0, 2026, rand);
  const after = r.teams.flatMap((t) => t.roster);
  assert.equal(after.length + r.pool.length + r.retired.length, before, "nobody appears or vanishes");
  assert.ok(after.every((p) => p.contract >= 1 && p.cy === 2027));
  assert.ok(r.pool.every((p) => p.contract === 0 && p.formerTeam != null));
  assert.ok(r.resigned.every(({ team }) => team !== 0), "only AI clubs auto-re-sign");
  assert.deepEqual(r.mine.map((p) => p.id).sort(), r.pool.filter((p) => p.formerTeam === 0).map((p) => p.id).sort());
});

test("signings and roster fill only use players from the pool", () => {
  const teams = league();
  const r = openFreeAgency(teams, 0, 2026, rand);
  const ids = new Set(r.pool.map((p) => p.id));
  const kept = new Set(r.teams.flatMap((t) => t.roster).map((p) => p.id));
  const s1 = aiSignings(r.teams, r.pool, 0, { capSpace, cy: 2027, skip: (p) => p.formerTeam === 0, rand });
  assert.ok(s1.length > 0);
  assert.ok(s1.every(({ p, from }) => ids.has(p.id) && from !== 0));
  const s2 = fillRosters(r.teams, r.pool, 0, { capSpace, cy: 2027, rand });
  assert.ok([...s1, ...s2].every(({ p }) => ids.has(p.id)), "no invented players");
  for (const [i, t] of r.teams.entries()) {
    assert.equal(new Set(t.roster.map((p) => p.id)).size, t.roster.length, "no duplicates");
    if (i !== 0 && r.pool.length) assert.ok(t.roster.length >= ROSTER_TARGET || (t.roster.length >= 48 && capSpace(t) < 15), `team ${i}: ${t.roster.length} players, cap space ${capSpace(t)}`); // full, or trimmed to fit the cap
    assert.ok(t.roster.every((p) => kept.has(p.id) || ids.has(p.id)));
  }
});

test("the best free agents sign where they'd start; cut-down day trims AI clubs to 53", async () => {
  const { starterSignings } = await import("../src/offseason.js");
  const teams = league();
  const r = openFreeAgency(teams, 0, 2026, rand);
  r.pool.unshift({ id: "star", pos: "QB", ovr: 99, age: 27, salary: 5, contract: 0 });
  const s = starterSignings(r.teams, r.pool, 0, { capSpace, cy: 2027, rand });
  assert.ok(s.some(({ p }) => p.id === "star"), "a 99 QB gets signed");
  r.teams[1].roster.push(...Array.from({ length: 20 }, (_, k) => ({ id: `x${k}`, pos: "WR", ovr: 40, age: 25, contract: 2, salary: 1 })));
  fillRosters(r.teams, r.pool, 0, { capSpace, cy: 2027, rand });
  // 53 each, unless a club had to trim to get back under the cap (never below 48).
  assert.ok(r.teams.slice(1).every((t) => t.roster.length === ROSTER_TARGET || (t.roster.length >= 48 && capSpace(t) < 15)));
  assert.ok(r.teams.slice(1).every((t) => t.roster.length <= ROSTER_TARGET), "never more than 53");
});

test("AI clubs keep their young stars; veterans and cap-strapped stars reach the market", async () => {
  const { keepChance } = await import("../src/offseason.js");
  assert.ok(keepChance({ pos: "DL", ovr: 94, age: 24 }) >= 0.95, "Will Anderson-type stays");
  assert.ok(keepChance({ pos: "TE", ovr: 99, age: 26 }) >= 0.95, "Trey McBride-type stays");
  assert.ok(keepChance({ pos: "QB", ovr: 92, age: 30 }) >= 0.95, "QBs age later");
  assert.ok(keepChance({ pos: "DL", ovr: 95, age: 35 }) <= 0.25, "aging stars often hit the market");
  // A young star on a club right at the cap: the club makes cap casualties to keep him.
  const star = { id: "s", pos: "DL", ovr: 95, age: 24, contract: 1, salary: 5 };
  const filler = Array.from({ length: 50 }, (_, k) => ({ id: `f${k}`, pos: "WR", ovr: 70, age: 27, contract: 3, salary: 5 }));
  let kept = 0;
  for (let n = 0; n < 50; n++) {
    const r = openFreeAgency([{ id: 0, roster: [] }, { id: 1, roster: [star, ...filler.map((f) => ({ ...f }))] }], 0, 2026, rand, { cap: 301.2 });
    if (r.teams[1].roster.some((p) => p.id === "s")) kept++;
  }
  assert.ok(kept >= 45, `kept ${kept}/50`);
  // Truly cap-strapped (every dollar committed to non-stars): a very good player who isn't a
  // franchise player reaches the market; a franchise player never does.
  const good = { id: "g", pos: "DL", ovr: 88, age: 28, contract: 1, salary: 5 };
  const broke = openFreeAgency([{ id: 0, roster: [] }, { id: 1, roster: [good, ...filler.map((f) => ({ ...f, salary: 5.9 }))] }], 0, 2026, rand, { cap: 301.2 });
  assert.ok(broke.pool.some((p) => p.id === "g"));
  const brokeStar = openFreeAgency([{ id: 0, roster: [] }, { id: 1, roster: [star, ...filler.map((f) => ({ ...f, salary: 5.9 }))] }], 0, 2026, rand, { cap: 301.2 });
  assert.ok(brokeStar.teams[1].roster.some((p) => p.id === "s"));
});

test("AI clubs never let a franchise player walk, even when cap-strapped", async () => {
  const { openFreeAgency, isFranchisePlayer } = await import("../src/offseason.js");
  const chase = { id: "chase", name: "Ja'Marr Chase", pos: "WR", ovr: 99, age: 27, salary: 40, contract: 1 };
  assert.ok(isFranchisePlayer(chase));
  assert.ok(!isFranchisePlayer({ pos: "WR", ovr: 99, age: 31 }), "an aging star can hit the market");
  // A club with almost no room: a pricey QB and a dozen mid-priced vets.
  const roster = [chase, { id: "qb", pos: "QB", ovr: 92, age: 29, salary: 60, contract: 3 }, ...Array.from({ length: 45 }, (_, i) => ({ id: `v${i}`, pos: "LB", ovr: 70 + (i % 9), age: 28, salary: 4.5, contract: 2 }))];
  for (let seed = 1; seed < 40; seed++) {
    let x = seed; const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    const r = openFreeAgency([{ roster: [] }, { roster }], 0, 2026, rand, { cap: 250 });
    assert.ok(r.teams[1].roster.some((p) => p.id === "chase"), "Chase stays");
    assert.ok(!r.pool.some((p) => p.id === "chase"));
  }
});

test("your roster is never filled for you, and AI clubs keep their young starting QB", async () => {
  const { fillRosters, shortGaps, openFreeAgency } = await import("../src/offseason.js");
  const mine = { roster: [{ id: "q1", pos: "QB", ovr: 80, age: 28, salary: 30 }] };
  const ai = { roster: [] };
  const pool = [{ id: "jd", name: "Jayden Daniels", pos: "QB", ovr: 84, age: 25 }, { id: "q9", pos: "QB", ovr: 60, age: 30 }];
  fillRosters([mine, ai], pool, 0, { capSpace: () => 100, cy: 2027 });
  assert.equal(mine.roster.length, 1, "nothing signed to your team");
  assert.ok(shortGaps(mine).some((g) => g.pos === "QB" && g.have === 1));
  // An AI club's young starter with an expiring deal stays, even with no cap room.
  const qb = { id: "jd", pos: "QB", ovr: 82, age: 25, contract: 1, salary: 5 };
  const filler = Array.from({ length: 50 }, (_, k) => ({ id: `f${k}`, pos: "WR", ovr: 70, age: 27, contract: 3, salary: 5.9 }));
  const r = openFreeAgency([{ roster: [] }, { roster: [qb, ...filler] }], 0, 2026, () => 0.99, { cap: 301.2 });
  assert.ok(r.teams[1].roster.some((p) => p.id === "jd"));
});

import { fillDepth, keepBackups, DEPTH_MIN, PS_SIZE } from "../src/offseason.js";
test("every club fills its 53 on minimum deals with a backup everywhere, then its practice squad", () => {
  const mk = (pos, ovr, i) => ({ id: `${pos}${i}${ovr}`, name: `${pos}${i}`, pos, ovr, age: 25, salary: 5, contract: 2 });
  const teams = [0, 1].map((t) => ({ roster: [mk("QB", 80, t), mk("C", 75, t), mk("K", 70, t), mk("P", 70, t)], ps: [mk("C", 60, 9 + t)] }));
  const pool = [];
  for (const pos of Object.keys(DEPTH_MIN)) for (let i = 0; i < 30; i++) pool.push(mk(pos, 50 + (i % 20), i));
  pool.sort((a, b) => b.ovr - a.ovr);
  const log = fillDepth(teams, pool, { ui: 0, minSal: 1 });
  for (const t of teams) {
    assert.equal(t.roster.length, 53);
    for (const [pos, min] of Object.entries(DEPTH_MIN)) assert.ok(t.roster.filter((p) => p.pos === pos).length >= min, pos);
    assert.equal(t.ps.length, PS_SIZE);
  }
  assert.ok(teams[0].roster.some((p) => p.name === "C9"), "the practice-squad center was promoted first");
  assert.ok(log.length > 0);
});

test("a spot without a healthy backup promotes from the practice squad and signs a fringe player", () => {
  const t = { roster: [{ id: 1, name: "Starter", pos: "TE", ovr: 80 }, { id: 2, name: "Hurt", pos: "TE", ovr: 70, injured: true }], ps: [{ id: 3, name: "PS TE", pos: "TE", ovr: 62 }] };
  const fa = [{ id: 4, name: "Fringe TE", pos: "TE", ovr: 64 }, { id: 5, name: "Good TE", pos: "TE", ovr: 78 }];
  const log = keepBackups([t], fa, { ui: 0, minSal: 1 });
  assert.ok(t.roster.some((p) => p.name === "PS TE"));
  assert.ok(t.ps.some((p) => p.name === "Fringe TE"), "a fringe (<70) player refills the squad");
  assert.equal(fa.length, 1);
  assert.equal(log.length, 1);
});

test("an in-season promotion never takes a club past 53", async () => {
  const { keepBackups } = await import("../src/offseason.js");
  const mk = (pos, i, ovr = 70) => ({ id: `${pos}${i}`, name: `${pos}${i}`, pos, ovr, age: 27, salary: 1, contract: 1 });
  const roster = [mk("QB", 1, 85), { ...mk("QB", 2, 70), injured: true }];
  const fill = ["RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S"];
  for (let i = 0; roster.length < 53; i++) roster.push(mk(fill[i % fill.length], i, 60 + (i % 20)));
  const t = { roster, ps: [mk("QB", 9, 64)] };
  keepBackups([t], [], { ui: 0 });
  assert.equal(t.roster.length, 53);
  assert.ok(t.roster.some((p) => p.id === "QB9"), "the backup quarterback came up");
});
