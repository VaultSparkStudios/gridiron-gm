import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, wireFromLog, wireFromSignings, addToWire, WIRE_MAX } from "../src/transactions.js";

const teams = [{ name: "Bills", ab: "BUF" }, { name: "Eagles", ab: "PHI" }, { name: "Buccaneers", ab: "TB" }];

test("log lines are sorted into the right kind, and chatter is left out", () => {
  assert.equal(classify("📡 DEADLINE DEAL: The Tampa Bay Buccaneers acquire Elijah Griffin from the Philadelphia Eagles"), "trade");
  assert.equal(classify("🤝 The Buffalo Bills hire Ezekiel Marshall as special teams coordinator, rated 86."), "coach");
  assert.equal(classify("✍️ Signed Joe Smith (WR 71)"), "sign");
  assert.equal(classify("Released Joe Smith"), "release");
  assert.equal(classify("👋 Spencer Brown (RT, BUF) retires after 11 seasons, age 33"), "retire");
  assert.equal(classify("🎖️ Josh Allen (QB, 91 OVR) retires at 38. A franchise legend."), "retire");
  assert.equal(classify("👋 Joe Nobody (WR, free agent) retires, age 34"), null, "unsigned veterans aren't news");
  assert.equal(classify("🏈 Week 7 results are in"), null);
});

test("wire entries carry the season, the week and the clubs named", () => {
  const [e] = wireFromLog(["📡 DEADLINE DEAL: The Tampa Bay Buccaneers acquire Elijah Griffin from the Philadelphia Eagles"], { yr: 2030, sp: "regular", wk: 9, teams, ui: 0 });
  assert.equal(e.k, "trade");
  assert.equal(e.y, 2030);
  assert.equal(e.when, "Wk 9");
  assert.deepEqual(e.tm.sort(), [1, 2]);
  assert.ok(e.t.startsWith("DEADLINE DEAL"), "the emoji is stripped");
});

test("free-agency waves add the signings worth noticing", () => {
  const out = wireFromSignings([{ p: { name: "A", pos: "WR", ovr: 80, contract: 3, salary: 12 }, team: 0, from: 1 }, { p: { name: "B", pos: "LB", ovr: 58 }, team: 2 }], { yr: 2030, sp: "freeagency", wk: 0, teams });
  assert.equal(out.length, 1);
  assert.match(out[0].t, /A \(WR 80\) signs with the Bills: 3 yrs, \$12\.0M a year, leaving the Eagles/);
  assert.deepEqual(out[0].tm, [0, 1]);
});

test("newest first, and the wire keeps years of moves but not forever", () => {
  const w = addToWire([{ t: "old" }], [{ t: "new" }]);
  assert.deepEqual(w.map((e) => e.t), ["new", "old"]);
  assert.equal(addToWire(Array.from({ length: WIRE_MAX }, () => ({})), [{}]).length, WIRE_MAX);
});
