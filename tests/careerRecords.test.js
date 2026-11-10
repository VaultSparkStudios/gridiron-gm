import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams } from "../src/league.js";
import { nflCareer, updateNflCareer, careerChasers } from "../src/careerRecords.js";
import { newRecordBook, loadRecordBook } from "../src/records.js";

const teams = initTeams(0);
const find = (n) => teams.flatMap((t) => t.roster).find((p) => p.name === n);

test("real players start from their real NFL careers, by position", () => {
  const rodgers = find("Aaron Rodgers");
  if (rodgers) assert.ok(nflCareer(rodgers, "passYds") > 60000);
  const qb = find("Josh Allen") && teams.flatMap((t) => t.roster).find((p) => p.name === "Josh Allen" && p.pos === "QB");
  if (qb) assert.equal(nflCareer(qb, "sacks"), 0, "the Bills' Josh Allen doesn't get the Jaguars' Josh Allen's sacks");
});

test("nobody in the opening league holds a career record; the chasers are real", () => {
  const { broken } = updateNflCareer(newRecordBook(), teams, 2026);
  assert.equal(broken.length, 0);
  const c = careerChasers(newRecordBook(), teams);
  assert.ok(c.passYds?.v > 40000, JSON.stringify(c.passYds));
});

test("passing the mark takes the record once, then it grows quietly", () => {
  const t2 = teams.map((t) => ({ ...t, roster: t.roster.map((p) => ({ ...p })) }));
  const qb = t2.flatMap((t) => t.roster).find((p) => p.pos === "QB");
  qb.cs = { ...(qb.cs || {}), passYds: 90000 };
  const a = updateNflCareer(newRecordBook(), t2, 2030);
  assert.equal(a.broken.length, 1);
  assert.equal(a.book.career.passYds.prev.name, "Tom Brady");
  qb.ss = { ...(qb.ss || {}), passYds: 300 };
  const b = updateNflCareer(a.book, t2, 2030);
  assert.equal(b.broken.length, 0);
  assert.ok(b.book.career.passYds.val > a.book.career.passYds.val);
  assert.deepEqual(loadRecordBook(b.book).career, b.book.career);
});

import { newMilestones } from "../src/careerRecords.js";
test("milestones: only ones passed this season, each once; a veteran's old ones never come up", () => {
  const qb = { ...teams.flatMap((t) => t.roster).find((p) => p.name === "Aaron Rodgers") };
  if (!qb.name) return;
  qb.ss = { passYds: 0 };
  assert.equal(newMilestones(qb).length, 0, "66K real yards, no news before he plays");
  qb.ss = { passYds: 4000 };   // 66,267 + 4,000: past 70,000 this season
  const m = newMilestones(qb);
  assert.deepEqual(m.map((x) => `${x.key}:${x.m}`), ["passYds:70000"]);
  qb.ms = ["passYds:70000"];
  assert.equal(newMilestones(qb).length, 0, "told once");
  const rook = { pos: "WR", draftYr: 2030, ss: { recYds: 1200 }, cs: { recYds: 4000 } };
  assert.deepEqual(newMilestones(rook).map((x) => x.m), [5000]);
});
