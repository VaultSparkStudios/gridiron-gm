import { test } from "node:test";
import assert from "node:assert/strict";
import { franchiseBoard, teamCareer, updateCareerRecords, franchiseRanks } from "../src/history.js";
import { FRANCHISE_CAREER } from "../src/data/franchiseCareer.js";

test("every club has real all-time career leaders through 2025", () => {
  assert.equal(Object.keys(FRANCHISE_CAREER).length, 32);
  for (const [ab, recs] of Object.entries(FRANCHISE_CAREER)) for (const k of ["passYds", "rushYds", "recYds", "sacks", "ints"]) assert.ok(recs[k]?.length >= 5, `${ab} ${k}`);
  assert.equal(FRANCHISE_CAREER.NYG.passYds[0].n, "Eli Manning");
});

test("a real player's club career starts from what he did there before 2026", () => {
  const dart = { id: "d", name: "Jaxson Dart", pos: "QB", ss: { passYds: 3000 } };
  const c = teamCareer(dart, "NYG", "NYG");
  assert.ok(c.passYds > 3000, "his 2025 Giants yards count");
  // a player drafted in the league has no real past
  assert.equal(teamCareer({ ...dart, draftYr: 2027 }, "NYG", "NYG").passYds, 3000);
});

test("a young quarterback isn't the Giants' all-time leader; passing Eli is news", () => {
  const dart = { id: "d", name: "Jaxson Dart", pos: "QB", ss: { passYds: 3000 } };
  const nyg = { ab: "NYG", roster: [dart], ir: [] };
  const board = franchiseBoard("NYG", "passYds", { teams: [nyg] });
  assert.equal(board[0].name, "Eli Manning");
  assert.ok(franchiseRanks(dart, "NYG", { teams: [nyg] }).every((r) => r.key !== "passYds" || r.rank > 1));
  let { broken } = updateCareerRecords({}, [nyg]);
  assert.equal(broken.filter((b) => b.key === "passYds").length, 0);
  dart.sh = [{ y: 2030, tm: "NYG", passYds: 60000 }];
  ({ broken } = updateCareerRecords({}, [nyg]));
  const b = broken.find((x) => x.key === "passYds");
  assert.equal(b.name, "Jaxson Dart");
  assert.equal(b.prev.name, "Eli Manning");
});
