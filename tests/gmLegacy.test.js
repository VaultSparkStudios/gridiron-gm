import test from "node:test";
import assert from "node:assert/strict";
import { GREATS, legacyScore, gmCareer, legacyRank } from "../src/gmLegacy.js";

test("the greats are ranked by the same score", () => {
  assert.equal(GREATS.length, 10);
  for (let i = 1; i < GREATS.length; i++) assert.ok(GREATS[i - 1].score >= GREATS[i].score);
  assert.equal(GREATS[0].name, "Bill Belichick");
  assert.equal(GREATS[0].score, legacyScore(GREATS[0]));
});

test("a GM career: record, titles, draftees and records", () => {
  const c = gmCareer({
    seasons: [{ yr: 2026, w: 12, l: 5 }, { yr: 2027, w: 14, l: 3 }], current: { yr: 2028, w: 3, l: 1 }, titles: [2027], playoffApps: 2,
    draftHistory: { 2026: [{ id: 7, name: "A", pos: "QB", rd: 1, overall: 10, owner: 3 }, { id: 8, name: "B", pos: "WR", rd: 2, owner: 5 }] },
    mine: (o) => o === 3, people: [{ id: 7, ovr: 88, honors: [{ yr: 2027, k: "ap1" }] }], records: [{ yr: 2027, name: "A", label: "Passing yards", val: "5,400" }],
  });
  assert.equal(c.seasons, 3);
  assert.equal(c.w, 29);
  assert.equal(c.draftees.length, 1);
  assert.equal(c.allPro, 1);
  assert.equal(c.score, legacyScore({ seasons: 3, w: 29, l: 9, titles: 1, playoffs: 2, allPro: 1, records: 1 }));
});

test("rank among the greats", () => {
  assert.equal(legacyRank(99999), 1);
  assert.equal(legacyRank(0), 11);
});
