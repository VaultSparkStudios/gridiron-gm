import { test } from "node:test";
import assert from "node:assert/strict";
import LZString from "lz-string";
import { packSave, unpackSave, saveFileName } from "../src/saveTransfer.js";

const save = { v: 3, yr: 2031, wk: 7, sp: "regular", ui: 0, teams: [{ ab: "NYG", roster: [{ id: 1, name: "Ünïcode Ñame", ovr: 99 }] }] };

test("a save survives the round trip through a file", async () => {
  const bytes = await packSave(save);
  assert.ok(bytes.length > 0);
  assert.deepEqual(await unpackSave(bytes), save);
});

test("old plain-JSON saves and LZ text saves still import", async () => {
  assert.deepEqual(await unpackSave(new TextEncoder().encode(JSON.stringify(save))), save);
  assert.deepEqual(await unpackSave(new TextEncoder().encode("FGMLZ1:" + LZString.compressToBase64(JSON.stringify(save)))), save);
});

test("anything else is refused", async () => {
  await assert.rejects(() => unpackSave(new TextEncoder().encode("hello")));
  await assert.rejects(() => unpackSave(new TextEncoder().encode(JSON.stringify({ foo: 1 }))));
});

test("the file is named for the team and the week", () => {
  assert.equal(saveFileName(save, "NYG"), "Football-GM-NYG-2031-wk7.gmsave");
  assert.equal(saveFileName({ ...save, sp: "draft" }, "NYG"), "Football-GM-NYG-2031-draft.gmsave");
});
