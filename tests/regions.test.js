import { test } from "node:test";
import assert from "node:assert/strict";
import { genDC } from "../src/league.js";
import { scoutRegion, regionOf, prospectRead, regionRead, creditWeeks, startScoutingYear, RTRIP_COST, MAX_TRIPS, RPTS_START, RPTS_WEEKLY, RPTS_COMBINE } from "../src/scouting.js";

const cls = genDC(2030);
const sec = cls.filter((p) => regionOf(p) === "SEC");

test("a trip gives a rough read on every prospect in the region, and only there", () => {
  let sc = startScoutingYear({}, 2030);
  assert.ok(sec.every((p) => prospectRead(sc, p).pot === "??"));
  const r = scoutRegion(sc, "regular", "SEC", 2030, 2030);
  assert.ok(r.ok); sc = r.sc;
  assert.equal(sc.rpts, RPTS_START - RTRIP_COST);
  assert.ok(sec.every((p) => prospectRead(sc, p).pot !== "??" && prospectRead(sc, p).regional));
  assert.ok(cls.filter((p) => regionOf(p) === "B1G").every((p) => prospectRead(sc, p).pot === "??"));
});

test("more trips sharpen the reads and find the region's sleepers", () => {
  const err = (t) => { const sc = { regionsYr: 2030, regions: { SEC: t, B1G: t, ACC: t, B12: t, PAC: t, G5: t } }; const ps = cls.filter((p) => regionRead(sc, p)); return ps.reduce((s, p) => s + Math.abs(regionRead(sc, p).pot - p.truePot), 0) / ps.length; };
  assert.ok(err(1) > err(MAX_TRIPS) + 1.5, `${err(1)} vs ${err(MAX_TRIPS)}`);
  let gems = 0, found = 0;
  for (let y = 0; y < 10; y++) for (const p of genDC(2100 + y)) if (p.gem && regionOf(p) !== "OTH") { gems++; const r = regionRead({ regionsYr: p.draftYear, regions: { [regionOf(p)]: MAX_TRIPS } }, p); if (r.hunch) found++; }
  assert.ok(found / gems > 0.5, `${found}/${gems}`);
});

test("area points come in weekly, trips are limited, and nothing after the draft starts", () => {
  let sc = creditWeeks(startScoutingYear({}, 2030), 6);
  assert.equal(sc.rpts, RPTS_START + 6 * RPTS_WEEKLY);
  for (let i = 0; i < MAX_TRIPS; i++) sc = scoutRegion(sc, "regular", "ACC", 2030, 2030).sc;
  assert.ok(!scoutRegion(sc, "regular", "ACC", 2030, 2030).ok);
  assert.ok(!scoutRegion(sc, "draft", "SEC", 2030, 2030).ok);
});

import { myBoard, csRank } from "../src/scouting.js";
test("your scouts' board moves the sleepers they've found up, and follows the consensus elsewhere", () => {
  let up = 0, gems = 0;
  for (let y = 0; y < 8; y++) {
    const c = genDC(2200 + y);
    const sc = { regionsYr: 2200 + y, regions: { SEC: 4, B1G: 4, ACC: 4, B12: 4, PAC: 4, G5: 4 } };
    const mine = myBoard(sc, c);
    assert.equal(mine.size, c.length);
    for (const p of c.filter((x) => x.gem && regionOf(x) !== "OTH")) { gems++; if (mine.get(p.id) < csRank(p) - 10) up++; }
    // With no scouting at all, your board is the consensus board.
    const none = myBoard({}, c);
    assert.ok(c.every((p) => Math.abs(none.get(p.id) - csRank(p)) <= 1));
  }
  assert.ok(up / gems > 0.6, `${up}/${gems} gems moved up`);
});

test("four trips to a region show every prospect's current rating there too", () => {
  const c = genDC(2300);
  const p = c.find((x) => regionOf(x) === "SEC" && !x.scout?.lvl);
  assert.equal(prospectRead({ regionsYr: 2300, regions: { SEC: 3 } }, p).ovr, "??");
  const r = prospectRead({ regionsYr: 2300, regions: { SEC: 4 } }, p);
  assert.match(r.ovr, /^~\d+$/);
  assert.ok(Math.abs(r.ovrV - p.trueOvr) <= 3);
});

test("a season's area points cover four regions fully, not the whole country", () => {
  const season = RPTS_START + 18 * RPTS_WEEKLY + RPTS_COMBINE;
  const trips = Math.floor(season / RTRIP_COST);
  assert.ok(trips >= 4 * MAX_TRIPS && trips < 5 * MAX_TRIPS, `${trips} trips a season`);
});
