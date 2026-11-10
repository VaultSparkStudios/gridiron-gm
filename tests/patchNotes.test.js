import { test } from "node:test";
import assert from "node:assert/strict";
import { PATCH_NOTES } from "../src/patchNotes.js";

test("patch notes: every entry has a version, date, title and notes, in order", () => {
  assert.ok(PATCH_NOTES.length > 10);
  const num = (v) => v.split(".").map(Number);
  PATCH_NOTES.forEach((p, i) => {
    assert.match(p.v, /^\d+\.\d+$/, `v at ${i}`);
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.title && Array.isArray(p.notes) && p.notes.length && p.notes.every((n) => typeof n === "string" && n.length > 10), p.v);
    if (i) { const [a, b] = num(PATCH_NOTES[i - 1].v), [c, d] = num(p.v); assert.ok(c > a || (c === a && d > b), `${PATCH_NOTES[i - 1].v} before ${p.v}`); }
  });
});
