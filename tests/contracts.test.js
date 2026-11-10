import { test } from "node:test";
import assert from "node:assert/strict";
import { tagPrice, optionPrice, optionEligible } from "../src/contracts.js";
import { openFreeAgency } from "../src/offseason.js";

const team = (salaries, pos = "WR") => ({ roster: salaries.map((s, i) => ({ id: `${pos}${s}-${i}`, pos, ovr: 80, age: 27, salary: s })) });

test("fifth-year options: first-round picks finishing their fourth season only", () => {
  assert.ok(optionEligible({ pk: 13, rkYr: 2024 }, 2027), "Bowers after 2027");
  assert.ok(!optionEligible({ pk: 13, rkYr: 2024 }, 2026), "not after year three");
  assert.ok(!optionEligible({ pk: 40, rkYr: 2024 }, 2027), "second-rounders have no option");
  assert.ok(optionEligible({ draftPk: 5, draftYr: 2026, rkYr: 2027 }, 2030), "drafted in this league");
  assert.ok(!optionEligible({ pk: 5, rkYr: 2024, opt5: true }, 2027), "only once");
});

test("tag and option prices come from the league's salaries at his position", () => {
  const teams = [team([50, 45, 40, 35, 30, 10, 8, 6, 4, 2, 1, 1, 1])];
  const p = { pos: "WR", ovr: 84, salary: 3 };
  const tag = tagPrice(teams, p, 301.2);
  assert.ok(tag >= 30 && tag < 40, `tag ${tag} is about three quarters of the top-5 average`);
  assert.ok(optionPrice(teams, p, 301.2) < tag, "a regular option is cheaper than the tag");
  assert.ok(optionPrice(teams, { ...p, ovr: 90 }, 301.2) > optionPrice(teams, p, 301.2), "a star's option costs more");
  assert.ok(tagPrice(teams, { ...p, salary: 60 }, 301.2) >= 72, "120% of his pay if that's more");
});

test("AI clubs pick up options on first-rounders who became starters", () => {
  const rookie = { id: "r1", pos: "TE", ovr: 82, age: 24, pk: 13, rkYr: 2024, contract: 1, salary: 4 };
  const bust = { id: "b1", pos: "TE", ovr: 64, age: 24, pk: 20, rkYr: 2024, contract: 1, salary: 3 };
  const r = openFreeAgency([{ roster: [] }, { roster: [rookie, bust, ...team([10, 9, 8]).roster] }], 0, 2027, () => 0.99, { cap: 301.2 });
  const kept = r.teams[1].roster.find((p) => p.id === "r1");
  assert.ok(kept?.opt5 && kept.contract === 1);
  assert.ok(!r.teams[1].roster.some((p) => p.id === "b1" && p.opt5));
});

test("asking prices follow the real market by league rank", async () => {
  const { askingPrice, marketShare, faYears } = await import("../src/offseason.js");
  const { maxYears } = await import("../src/negotiation.js");
  const cap = 279.2; // the 2025 cap the market table is in
  const ask = (pos, ovr, x = {}) => askingPrice({ pos, ovr, age: 26, ...x }, cap);
  // the best at each position asks about what the best is paid
  assert.ok(Math.abs(ask("QB", 99) - 60) < 4, `QB ${ask("QB", 99)}`);
  assert.ok(ask("WR", 99) > 36 && ask("WR", 99) < 44, `WR ${ask("WR", 99)}`); // a slot receiver is paid a little less
  assert.ok(Math.abs(ask("DL", 99, { mpos: "EDGE" }) - 46.5) < 3, "an elite pass rusher");
  assert.ok(ask("DL", 96, { mpos: "DT" }) < ask("DL", 96, { mpos: "EDGE" }), "an interior lineman is paid less than a pass rusher");
  assert.ok(ask("RB", 98) < 22 && ask("K", 87) < 8, "running backs and kickers stay cheap");
  // a 10th-best receiver earns real WR1 money, a backup the minimum
  assert.ok(ask("WR", 91) > 26, `WR #10 ${ask("WR", 91)}`);
  assert.ok(ask("WR", 62) <= 1, "depth plays for the minimum");
  // never down as the rating goes up
  for (const pos of ["QB", "WR", "LT", "LG", "CB", "S", "TE"]) for (let o = 55; o < 99; o++) assert.ok(marketShare(o + 1, pos) >= marketShare(o, pos), `${pos} ${o}`);
  // kickers and quarterbacks age later
  assert.ok(ask("K", 85, { age: 34 }) === ask("K", 85, { age: 26 }), "a 34-year-old kicker is in his prime");
  assert.equal(maxYears({ pos: "QB", age: 33 }), 3);
  assert.equal(maxYears({ pos: "WR", age: 33 }), 1);
  // a star in his prime signs long
  assert.ok(faYears({ ovr: 90, age: 26 }, () => 0) >= 4);
});

test("the franchise tag groups offensive linemen together, as the real one does", () => {
  const ol = { roster: [["LT", 30], ["LT", 28], ["RT", 27], ["LT", 26], ["RT", 25], ["LG", 15], ["RG", 14], ["C", 12]].map(([pos, s], i) => ({ id: `o${i}`, pos, ovr: 85, age: 27, salary: s })) };
  const g = { pos: "LG", ovr: 84, age: 27, salary: 4 };
  assert.ok(tagPrice([ol], g, 301.2) >= 19, `a guard's tag is the OL tag (${tagPrice([ol], g, 301.2)})`);
});
