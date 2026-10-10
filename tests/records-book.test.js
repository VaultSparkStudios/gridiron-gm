import { test } from "node:test";
import assert from "node:assert/strict";
import { newRecordBook, loadRecordBook, updateRecords, recordWatch, recordStories } from "../src/records.js";

const team = (ab, players, w = 0, l = 0) => ({ ab, w, l, roster: players });
const rb = (id, rushYds) => ({ id, name: id, pos: "RB", ss: { rushYds } });

test("the book starts with the NFL's records", () => {
  const b = newRecordBook();
  assert.equal(b.best.rushYds.val, 2105);
  assert.equal(b.best.rushYds.name, "Eric Dickerson");
  assert.equal(b.best.passTD.val, 55);
  assert.equal(loadRecordBook(undefined).best.sacks.val, 22.5);
});

test("breaking a record is news once; adding to your own record just raises it", () => {
  let b = newRecordBook();
  let r = updateRecords(b, [team("DET", [rb("gibbs", 2000)])], 2027);
  assert.equal(r.broken.length, 0, "short of the record");
  r = updateRecords(r.book, [team("DET", [rb("gibbs", 2150)])], 2027);
  assert.equal(r.broken.length, 1);
  assert.equal(r.book.best.rushYds.name, "gibbs");
  assert.equal(r.broken[0].prev.name, "Eric Dickerson");
  r = updateRecords(r.book, [team("DET", [rb("gibbs", 2240)])], 2027);
  assert.equal(r.broken.length, 0, "his own record going up isn't a new record");
  assert.equal(r.book.best.rushYds.val, 2240);
  // Years later someone else passes him.
  r = updateRecords(r.book, [team("ATL", [rb("bijan", 2300)])], 2031);
  assert.equal(r.broken.length, 1);
  assert.equal(r.broken[0].prev.name, "gibbs");
  assert.equal(r.book.history.length, 2);
});

test("record watch: on pace with games left, closest first; stories for breaks and chases", () => {
  const b = newRecordBook();
  const teams = [team("DET", [rb("gibbs", 1200)], 7, 2), team("ATL", [rb("bijan", 900)], 5, 4)];
  const w = recordWatch(b, teams);
  assert.equal(w.length, 1);
  assert.equal(w[0].name, "gibbs");
  assert.ok(w[0].pace > 2105);
  const s = recordStories({ broken: [], watch: w, teams, yr: 2027, wk: 9 });
  assert.ok(s[0].head.includes("Record watch") && s[0].team === 0);
});
