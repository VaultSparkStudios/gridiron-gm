import { test } from "node:test";
import assert from "node:assert/strict";
import { drivesOf } from "../src/drives.js";

test("plays group into drives with yards, time and how they ended", () => {
  const log = [
    { qtr: 1, clock: 900, type: "kickoff", poss: "a", text: "kick" },
    { qtr: 1, clock: 895, type: "run", poss: "h", yards: 6, text: "" },
    { qtr: 1, clock: 860, type: "pass", poss: "h", yards: 20, text: "" },
    { qtr: 1, clock: 820, type: "td", poss: "h", yards: 30, text: "" },
    { qtr: 1, clock: 815, type: "kickoff", poss: "h", text: "" },
    { qtr: 1, clock: 810, type: "run", poss: "a", yards: 2, text: "" },
    { qtr: 1, clock: 780, type: "punt", poss: "a", text: "" },
    { qtr: 1, clock: 770, type: "run", poss: "h", yards: 1, text: "" },
    { qtr: 1, clock: 760, type: "inc", poss: "h", text: "" },
    { qtr: 1, clock: 750, type: "run", poss: "a", yards: 4, text: "" },
  ];
  const d = drivesOf(log);
  assert.equal(d.length, 4);
  assert.deepEqual([d[0].poss, d[0].plays.length, d[0].yds, d[0].result[0]], ["h", 3, 56, "Touchdown"]);
  assert.equal(d[0].t1 - d[0].t0, 85, "until the next drive starts");
  assert.equal(d[1].result[0], "Punt");
  assert.equal(d[2].result[0], "Downs");
  assert.equal(d[3].result, undefined, "the drive on the field has no result yet");
});
