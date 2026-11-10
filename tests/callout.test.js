// The live field's banner for the big results: a missed kick and a stop on fourth down get called out.
import test from "node:test";
import assert from "node:assert/strict";
import { calloutOf } from "../src/callout.js";

test("big plays get a banner on the field; ordinary ones don't", () => {
  assert.equal(calloutOf({ type: "fg_miss", text: "Kicker's 52-yard try is NO GOOD." }).t, "NO GOOD!");
  assert.match(calloutOf({ type: "fg_miss", text: "Kicker's 52-yard try is NO GOOD." }).s, /52-yard field goal missed/);
  assert.equal(calloutOf({ type: "fg", text: "Kicker's 41-yard field goal is GOOD." }).t, "IT'S GOOD!");
  assert.equal(calloutOf({ type: "run", downs: true, text: "Up the middle for 1. Turnover on downs." }).t, "TURNOVER ON DOWNS");
  assert.equal(calloutOf({ type: "pass", td: true }).t, "TOUCHDOWN!");
  assert.equal(calloutOf({ type: "run", text: "Up the middle for 4." }), null);
  assert.equal(calloutOf({ type: "punt", text: "Punt, 44 yards." }), null);
});
