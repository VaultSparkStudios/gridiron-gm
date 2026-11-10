import { test } from "node:test";
import assert from "node:assert/strict";
import { genDC } from "../src/league.js";
import { regionOf, prospectRead, coverage, areasOf, assignArea, uncovered, areaCap, AREA_KEYS, myBoard, csRank, scoutProspect, SCOUT_CHECKPOINTS } from "../src/scouting.js";
import { TRADE_DEADLINE_WEEK } from "../src/aiTrades.js";

const mk = (id, ev, trait = null) => ({ id, name: id, eval: ev, trait });
const staff = (ev, areas) => ({ major: mk("a", ev), major2: mk("b", ev), minor: mk("c", ev), minor2: mk("d", ev), ...(areas ? { areas } : {}) });
const classes = (n, y0) => Array.from({ length: n }, (_, i) => genDC(y0 + i));

test("major scouts work two regions, minor scouts one, and by default the six are all covered", () => {
  const ar = areasOf(staff(70));
  assert.equal(ar.major.length, 2); assert.equal(ar.minor.length, 1);
  assert.deepEqual(new Set(Object.values(ar).flat()), new Set(AREA_KEYS));
  assert.deepEqual(uncovered(staff(70)), []);
  assert.equal(areaCap("minor2"), 1);
});

test("assignments: only before the season, within the job's cap, and they can double up", () => {
  const sc = staff(70);
  assert.equal(assignArea(sc, "regular", "major", 0, "G5").ok, false, "scouts are on the road");
  assert.equal(assignArea(sc, "preseason", "minor", 1, "SEC").ok, false, "a minor scout has one region");
  const r = assignArea(sc, "preseason", "minor", 0, "SEC");
  assert.ok(r.ok);
  assert.deepEqual(areasOf(r.sc).minor, ["SEC"]);
  assert.ok(uncovered(r.sc).length === 1, "doubling up leaves a region to the front office");
  assert.match(r.msg, /Nobody covers/);
  // picking a major scout's other region swaps his two
  const ar = areasOf(sc).major;
  const s2 = assignArea(sc, "freeagency", "major", 0, ar[1]).sc;
  assert.deepEqual(areasOf(s2).major, [ar[1], ar[0]]);
});

test("coverage follows the region: an uncovered region and FCS schools go to the office", () => {
  const cls = genDC(2030);
  const sec = cls.find((p) => regionOf(p) === "SEC"), fcs = cls.find((p) => regionOf(p) === "OTH");
  const sc = staff(70, { major: ["SEC", "B1G"], major2: ["ACC", "B12"], minor: ["G5"], minor2: ["G5"] });
  assert.equal(coverage(sc, sec).role, "major");
  assert.equal(coverage(sc, cls.find((p) => regionOf(p) === "G5")).others.length, 1);
  assert.equal(coverage(sc, cls.find((p) => regionOf(p) === "PAC")).role, "office");
  if (fcs) assert.equal(prospectRead(sc, fcs).pot, "??");
  assert.match(prospectRead(sc, sec).pot, /^[A-D]/);
});

test("a better scout reads closer, finds more sleepers and spots more special development traits", () => {
  const cs = classes(8, 2100);
  const stat = (ev) => {
    const sc = staff(ev);
    let err = 0, n = 0, gems = 0, slept = 0, stars = 0, spotted = 0;
    for (const c of cs) for (const p of c) {
      const r = prospectRead(sc, p);
      if (r.potV == null) continue;
      err += Math.abs(r.potV - p.truePot); n++;
      if (p.gem) { gems++; if (r.sleeper || r.hunch) slept++; }
      if (["generational", "superstar", "star"].includes(p.dev)) { stars++; if (r.dev) spotted++; }
    }
    return { err: err / n, sleep: slept / gems, dev: spotted / stars };
  };
  const lo = stat(58), hi = stat(92);
  assert.ok(hi.err < lo.err - 1, `error ${hi.err.toFixed(2)} vs ${lo.err.toFixed(2)}`);
  assert.ok(hi.sleep > lo.sleep + 0.25, `sleepers ${hi.sleep.toFixed(2)} vs ${lo.sleep.toFixed(2)}`);
  assert.ok(hi.dev > 0.3 && lo.dev === 0, `dev spotted ${hi.dev.toFixed(2)} vs ${lo.dev.toFixed(2)}`);
});

test("a good major scout often reads the development trait on the first report", () => {
  const cs = classes(3, 2400);
  const seen = (ev) => {
    const sc = { ...staff(ev), pts: 999 };
    let s = 0, n = 0;
    for (const c of cs) for (const p of c.filter((x) => coverage(sc, x).role === "major").slice(0, 60)) { n++; if (scoutProspect(sc, "regular", p, [], p.draftYear, p.draftYear).p.scout.dev) s++; }
    return s / n;
  };
  assert.ok(seen(90) > 0.7 && seen(58) < 0.05, `${seen(90)} vs ${seen(58)}`);
});

test("your scouts' board moves the sleepers they've found up, and follows the consensus elsewhere", () => {
  let up = 0, gems = 0;
  for (const c of classes(8, 2200)) {
    const mine = myBoard(staff(90), c);
    assert.equal(mine.size, c.length);
    for (const p of c.filter((x) => x.gem && regionOf(x) !== "OTH")) { gems++; if (mine.get(p.id) < csRank(p) - 10) up++; }
    // With no scouts at all, your board is the consensus board.
    const none = myBoard({}, c);
    assert.ok(c.every((p) => Math.abs(none.get(p.id) - csRank(p)) <= 1));
  }
  assert.ok(up / gems > 0.5, `${up}/${gems} gems moved up`);
});

test("two scouting checkpoints a season: the trade deadline and the end of the regular season", () => {
  assert.deepEqual(SCOUT_CHECKPOINTS, [TRADE_DEADLINE_WEEK, 18]);
});

import { effEval, regionTilt, regionReport, scoutGroup } from "../src/scouting.js";
test("a scout reads his specialty sharpest: a great scout on the wrong position group won't find your cornerbacks", () => {
  const cs = classes(6, 2500);
  const err = (group) => {
    const sc = { major: { id: "a", name: "a", eval: 88, group }, major2: { id: "b", name: "b", eval: 88, group }, minor: { id: "c", name: "c", eval: 88, group }, minor2: { id: "d", name: "d", eval: 88, group } };
    let e = 0, n = 0, gems = 0, found = 0;
    for (const c of cs) for (const p of c.filter((x) => scoutGroup(x.pos) === "DB")) { const r = prospectRead(sc, p); if (r.potV == null) continue; e += Math.abs(r.potV - p.truePot); n++; if (p.gem) { gems++; if (r.sleeper) found++; } }
    return { e: e / n, found, gems };
  };
  const spec = err("DB"), off = err("QB");
  assert.ok(off.e > spec.e + 0.8, `off-specialty error ${off.e.toFixed(2)} vs ${spec.e.toFixed(2)}`);
  assert.ok(spec.found >= off.found);
  assert.equal(effEval({ eval: 80, group: "DB" }, { pos: "CB" }), 84);
  assert.equal(effEval({ eval: 80, group: "DB" }, { pos: "QB" }), 66);
});

test("every class leans: each conference is deep at one group and thin at another, and the board shows it", () => {
  let hits = 0, tot = 0;
  for (let y = 2600; y < 2608; y++) {
    const t = regionTilt(y), rep = regionReport(genDC(y));
    assert.equal(new Set(Object.values(t).map((x) => x.up)).size, 6, "six different strengths");
    for (const k of ["SEC", "B1G", "ACC", "B12"]) { tot++; if (rep[k].strong.g === t[k].up) hits++; }
  }
  assert.ok(hits / tot > 0.6, `${hits}/${tot} strengths show on the board`);
});

import { setRegionScout } from "../src/scouting.js";
test("region dropdowns: one scout per region, a full scout gives up his first region, nobody leaves it open", () => {
  const sc = staff(70);
  const r = setRegionScout(sc, "preseason", "PAC", "major", 2030);
  assert.ok(r.ok);
  const ar = areasOf(r.sc);
  assert.ok(ar.major.includes("PAC") && ar.major.length === 2);
  assert.equal(Object.values(ar).flat().filter((x) => x === "PAC").length, 1, "only one scout covers a region");
  const n = setRegionScout(r.sc, "preseason", "PAC", null, 2030).sc;
  assert.equal(areasOf(n).major.length, 1, "an open slot stays open (1/2)");
  assert.ok(uncovered(n).includes("PAC"));
  assert.equal(setRegionScout(sc, "regular", "PAC", "major", 2030).ok, false);
});

import { scoutReportCard, fileReportCard } from "../src/scouting.js";
test("scout report card: a sharp specialist grades better than a weak scout on the same ground", () => {
  let good = 0, bad = 0;
  for (const c of classes(6, 2700)) {
    const mk2 = (ev, group) => ({ major: { id: "a", name: "A", eval: ev, group }, major2: { id: "b", name: "B", eval: ev, group }, minor: { id: "c", name: "C", eval: ev, group }, minor2: { id: "d", name: "D", eval: ev, group } });
    const hi = scoutReportCard(mk2(92), c), lo = scoutReportCard(mk2(56), c);
    for (const k of ["major", "major2"]) { if (hi[k].grade) good += hi[k].score; if (lo[k].grade) bad += lo[k].score; }
  }
  assert.ok(good > bad + 40, `${good} vs ${bad}`);
  const c = genDC(2800), sc = staff(70);
  const f = fileReportCard(sc, c, 2800);
  assert.ok(f.reports[2800].major.grade);
  assert.equal(fileReportCard(f, c, 2800), f, "graded once per class");
});
