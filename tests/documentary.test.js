import test from "node:test";
import assert from "node:assert/strict";
import { buildDocumentary, pastEras } from "../src/documentary.js";

test("the documentary tells the era: record, titles, highs and lows, its faces", () => {
  const seasons = [{ yr: 2026, w: 5, l: 12 }, { yr: 2027, w: 9, l: 8 }, { yr: 2028, w: 14, l: 3 }, { yr: 2029, w: 12, l: 5 }, { yr: 2030, w: 11, l: 6 }, { yr: 2031, w: 2, l: 15 }];
  const roster = [
    { name: "A", pos: "QB", honors: [{ yr: 2028, k: "ap1" }, { yr: 2029, k: "pb" }] },
    { name: "B", pos: "CB", honors: [{ yr: 2025, k: "ap1" }] }, // before the era
    { name: "C", pos: "WR", honors: [{ yr: 2030, k: "pb" }] },
  ];
  const d = buildDocumentary({ seasons, titles: [2028, 2033], roster, team: { city: "New York", name: "Giants" }, from: 2026, to: 2030 });
  assert.equal(d.w, 51); assert.equal(d.l, 34); // only this era's seasons
  assert.deepEqual(d.titles, [2028]); assert.equal(d.tier, "Champion");
  assert.equal(d.best.yr, 2028);
  assert.deepEqual(d.faces.map((f) => f.name), ["A", "C"]);
  assert.ok(d.chapters.some((c) => c.includes("low point: 2026, 5-12")));
  assert.ok(d.chapters[0].startsWith("2026–2030: New York Giants went 51-34"));
});

test("eras for older saves", () => {
  assert.deepEqual(pastEras(2026, 2035), [[2026, 2030], [2031, 2035]]);
  assert.deepEqual(pastEras(2026, 2029), []);
});
