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
  assert.ok(tag >= 40, `tag ${tag} is at least the top-5 average`);
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
