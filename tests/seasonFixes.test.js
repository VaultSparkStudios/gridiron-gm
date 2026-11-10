import { test } from "node:test";
import assert from "node:assert/strict";
import { draftOrder } from "../src/playoffs.js";
import { applyFutures } from "../src/draftTrade.js";

test("draft order: non-playoff clubs first, then by playoff exit, champion last", () => {
  const t = [{ id: 0, w: 14, l: 3, pf: 1, pa: 0 }, { id: 1, w: 10, l: 7, pf: 0, pa: 0 }, { id: 2, w: 3, l: 14, pf: 0, pa: 0 }, { id: 3, w: 12, l: 5, pf: 0, pa: 0 }];
  const pb = { ch: 1, res: [{ h: 0, a: 3, w: 3, rd: 1 }, { h: 3, a: 1, w: 1, rd: 4 }] };
  assert.deepEqual(draftOrder(t, pb), [2, 0, 3, 1]);
});

test("a compensatory pick becomes a real pick at the end of the draft", () => {
  const order = [0, 1, 2];
  const picks = applyFutures(order, 2027, [{ yr: 2027, rd: 7, orig: 1, owner: 1, comp: true }]);
  assert.equal(picks.length, 22);
  const comp = picks[picks.length - 1];
  assert.equal(comp.comp, true);
  assert.equal(comp.owner, 1);
  // the club's own 7th-rounder is untouched
  assert.equal(picks.filter((p) => p.rd === 7 && p.orig === 1 && !p.comp)[0].owner, 1);
});

import { newRecordBook, updateRecords, updateFranchiseRecords } from "../src/records.js";
test("the league record pass keeps franchise records in the book", () => {
  let book = newRecordBook();
  const team = (yds) => [{ ab: "BUF", roster: [{ id: "a", name: "QB", pos: "QB", ss: { passYds: yds } }] }];
  book = updateFranchiseRecords(updateRecords(book, team(9000), 2026).book, team(9000), 2026).book;
  const fr = JSON.stringify(book.franchise || {});
  const after = updateRecords(book, team(9100), 2026).book;
  assert.ok(after.franchise, "franchise records dropped");
  assert.equal(JSON.stringify(after.franchise), fr);
});
