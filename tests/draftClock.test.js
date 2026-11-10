import test from "node:test";
import assert from "node:assert/strict";
import { clockTick, DRAFT_SPEEDS } from "../src/league.js";

test("round 1 of the draft runs in real time at every speed; later rounds follow the setting", () => {
  for (const s of [...DRAFT_SPEEDS, "anything"]) assert.equal(clockTick(s, 1), 1000, s);
  assert.equal(clockTick("Slow", 4), 1000);
  assert.ok(clockTick("Normal", 2) < 1000 && clockTick("Fast", 2) < clockTick("Normal", 2));
});

test("your own pick always runs on real seconds, whatever the round or speed", () => {
  for (const s of [...DRAFT_SPEEDS, "anything"]) for (const rd of [1, 2, 5, 7]) assert.equal(clockTick(s, rd, true), 1000, `${s} round ${rd}`);
});
