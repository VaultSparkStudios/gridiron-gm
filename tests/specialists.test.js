import test from "node:test";
import assert from "node:assert/strict";
import { fillDepth, keepBackups } from "../src/offseason.js";

const pl = (id, pos, ovr) => ({ id, name: id, pos, ovr, age: 27, salary: 1, contract: 2 });
const club = (id, extra = []) => ({ roster: [pl(`${id}k`, "K", 75), ...extra], ps: [] });

test("a club hoarding punters lets the extras go, so a club with none can sign one", () => {
  const hoarder = club("A", [pl("p1", "P", 80), pl("p2", "P", 76), pl("p3", "P", 72)]);
  const without = club("B");
  const teams = [club("U", [pl("up", "P", 70)]), hoarder, without];
  const pool = [];
  fillDepth(teams, pool, { ui: 0, minSal: 1 });
  assert.equal(hoarder.roster.filter((p) => p.pos === "P").length, 1);
  assert.equal(hoarder.roster.find((p) => p.pos === "P").id, "p1", "keeps his best");
  assert.equal(without.roster.filter((p) => p.pos === "P").length, 1, "the club without one signs one");
  assert.ok(teams.every((t, i) => i === 0 || t.roster.filter((p) => p.pos === "K").length === 1));
});

test("in season, an AI club with no punter signs the best free agent punter; yours is left to you", () => {
  const ai = club("A"), mine = club("U");
  const fa = [pl("f1", "P", 74), pl("f2", "P", 79)];
  keepBackups([mine, ai], fa, { ui: 0, minSal: 1 });
  assert.equal(ai.roster.find((p) => p.pos === "P")?.id, "f2");
  assert.ok(!mine.roster.some((p) => p.pos === "P"));
});
