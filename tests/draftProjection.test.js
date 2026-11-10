import test from "node:test";
import assert from "node:assert/strict";
import { reprojectPicks, slotsFor } from "../src/draftProjection.js";
import { draftOrder } from "../src/playoffs.js";

const teams = Array.from({ length: 32 }, (_, i) => ({ id: i, c: i < 16 ? "AFC" : "NFC", d: ["East", "North", "South", "West"][(i >> 2) % 4], w: 0, l: 0, pf: 0, pa: 0 }));
const picks = () => { const out = []; for (let rd = 1; rd <= 7; rd++) for (let i = 0; i < 32; i++) out.push({ id: `${rd}-${i}`, rd, num: i + 1, overall: (rd - 1) * 32 + i + 1, orig: i, owner: i, yr: 2027 }); out.push({ id: "c1", rd: 7, comp: true, orig: 5, owner: 5, yr: 2027, overall: 225 }); return out; };

test("before any games the picks keep the order set at the start of the season", () => {
  const p = picks();
  assert.equal(reprojectPicks(p, teams, null, 2027), p);
});

test("mid-season every pick follows the standings, worst record first, owners unchanged", () => {
  const ts = teams.map((t) => ({ ...t, w: t.id % 10, l: 10 - (t.id % 10), pf: 200 + t.id, pa: 200 }));
  const p = picks(); p[3] = { ...p[3], owner: 9 }; // a traded first
  const np = reprojectPicks(p, ts, null, 2027);
  const order = draftOrder(ts, null);
  for (const pk of np.filter((x) => !x.comp)) assert.equal(pk.overall, (pk.rd - 1) * 32 + order.indexOf(pk.orig) + 1);
  assert.equal(np.find((x) => x.id === "1-3").owner, 9);
  assert.equal(np.find((x) => x.comp).overall, 225);
  assert.equal(new Set(np.map((x) => x.overall)).size, np.length);
  assert.equal(reprojectPicks(np, ts, null, 2027), np, "no change, same array");
});

test("after the playoffs the champion picks last and the runner-up 31st", () => {
  const ts = teams.map((t) => ({ ...t, w: 10, l: 7, pf: 300 + t.id, pa: 300 }));
  const pb = { ch: 0, res: [{ rd: 4, h: 0, a: 20, w: 0 }, { rd: 3, h: 1, a: 0, w: 0 }] };
  const np = reprojectPicks(picks(), ts, pb, 2027);
  assert.equal(np.find((x) => x.rd === 1 && x.orig === 0).overall, 32);
  assert.equal(np.find((x) => x.rd === 1 && x.orig === 20).overall, 31);
  assert.deepEqual(slotsFor(np, 0, 2027).slice(0, 2), [32, 64]);
  assert.deepEqual(slotsFor(np, 0, 2027, [np.find((x) => x.rd === 1 && x.orig === 0).id])[0], 64);
});

test("compensatory picks sit at the end of their own round, and the rest renumber after them", async () => {
  const { inDraftOrder } = await import("../src/draftProjection.js");
  const p = picks().filter((x) => !x.comp);
  const out = inDraftOrder([...p, { id: "cA", rd: 3, comp: true, owner: 4, orig: 4 }, { id: "cB", rd: 3, comp: true, owner: 9, orig: 9 }]);
  const a = out.find((x) => x.id === "cA");
  assert.equal(a.overall, 97);
  assert.equal(a.num, 33);
  assert.equal(out.find((x) => x.id === "cB").overall, 98);
  assert.equal(out.find((x) => x.rd === 4 && x.num === 1).overall, 99, "round 4 starts after the comps");
  assert.deepEqual(out.map((x) => x.overall), out.map((_, i) => i + 1));
});

test("mid-playoffs, a team knocked out picks ahead of every team still alive", () => {
  const ts = teams.map((t) => ({ ...t, w: t.id % 17, l: 17 - (t.id % 17), pf: 300, pa: 300 }));
  const seeds = { AFC: [31, 30, 29, 28, 27, 26, 25], NFC: [24, 23, 22, 21, 20, 19, 18] };
  const pb = { rd: 2, seeds, ch: null, res: [{ rd: 1, h: 30, a: 25, w: 30 }] }; // 25 is out in the Wild Card round
  const order = draftOrder(ts, pb);
  const alive = [...seeds.AFC, ...seeds.NFC].filter((id) => id !== 25);
  assert.ok(alive.every((id) => order.indexOf(id) > order.indexOf(25)), "every live playoff club picks after the team that just lost");
  assert.ok(order.indexOf(25) > order.indexOf(0), "and after every non-playoff club");
});
