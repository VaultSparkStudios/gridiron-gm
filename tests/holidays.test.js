// Holiday games: the right weeks, Detroit and Dallas host on Thanksgiving, three Christmas games.
import test from "node:test";
import assert from "node:assert/strict";
import { holidayWeeks, tagHolidays, kickoff } from "../src/holidays.js";

test("holiday weeks follow the calendar", () => {
  assert.deepEqual(holidayWeeks(2026), { halloween: 8, thanksgiving: 12, christmas: 16, newyear: 17 });
  assert.equal(new Date(kickoff(2026)).toISOString().slice(0, 10), "2026-09-10");
});

test("tagging a generated schedule", () => {
  const AB = Array.from({ length: 32 }, (_, i) => (i === 3 ? "DET" : i === 9 ? "DAL" : `T${i}`));
  const sched = [];
  for (let wk = 1; wk <= 18; wk++) for (let i = 0; i < 16; i++) sched.push({ wk, h: (i * 2 + wk) % 32, a: (i * 2 + 1 + wk) % 32 });
  const teams = AB.map(() => ({ roster: [] }));
  const out = tagHolidays(sched, 2027, teams, (i) => AB[i]);
  const w = holidayWeeks(2027);
  const tg = out.filter((g) => g.holiday === "thanksgiving");
  assert.ok(tg.every((g) => g.wk === w.thanksgiving));
  assert.ok(tg.some((g) => AB[g.h] === "DET") && tg.some((g) => AB[g.h] === "DAL"));
  assert.equal(out.filter((g) => g.holiday === "christmas").length, 3);
  assert.equal(out.filter((g) => g.holiday === "halloween").length, 1);
  const homes = (t, s) => s.filter((g) => g.h === t).length;
  assert.ok(Math.abs(homes(3, out) - homes(3, sched)) <= 1);
});

test("New Year's: Eve and Day in the week of January 1; tagging again adds nothing", async () => {
  const AB = Array.from({ length: 32 }, (_, i) => (i === 3 ? "DET" : i === 9 ? "DAL" : `T${i}`));
  const sched = [];
  for (let wk = 1; wk <= 18; wk++) for (let i = 0; i < 16; i++) sched.push({ wk, h: (i * 2 + wk) % 32, a: (i * 2 + 1 + wk) % 32 });
  const teams = AB.map(() => ({ roster: [] }));
  const once = tagHolidays(sched, 2027, teams, (i) => AB[i]);
  const w = holidayWeeks(2027);
  assert.deepEqual(once.filter((g) => g.holiday === "nye" || g.holiday === "nyd").map((g) => [g.wk, g.holiday]), [[w.newyear, "nye"], [w.newyear, "nyd"]].sort((a, b) => once.findIndex((g) => g.holiday === a[1]) - once.findIndex((g) => g.holiday === b[1])));
  const twice = tagHolidays(once, 2027, teams, (i) => AB[i]);
  assert.equal(twice.filter((g) => g.holiday).length, once.filter((g) => g.holiday).length);
});
