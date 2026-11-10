import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeSide, createGame, playGame, boxOf } from "../src/playsim.js";
import { teamSnaps } from "../src/snaps.js";

const d = JSON.parse(fs.readFileSync(new URL("../src/data/madden27.json", import.meta.url)));
const team = (ab) => { const t = d.teams.find((x) => x.ab === ab); return { ...t, roster: t.roster.map((p, i) => ({ ...p, id: `${ab}${i}`, posAttrs: p.attrs })) }; };
const side = (t, over = {}, season = 2026) => { const ord = (pos) => t.roster.filter((p) => p.pos === pos).sort((a, b) => (a.dk ?? 99) - (b.dk ?? 99) || b.ovr - a.ovr); return makeSide({ team: t, order: ord, snaps: teamSnaps(ord, over), season }); };

test("a back on 100% of the snaps has workhorse seasons; a record one only now and then", () => {
  // a fixed seed: the same games every run, so the test never fails on a lucky season
  let seed = 11; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const atl = team("ATL");
  const bijan = atl.roster.find((p) => p.name === "Bijan Robinson");
  const seasons = [];
  for (let season = 2026; season < 2034; season++) {
    let att = 0, yds = 0;
    for (const o of d.teams.filter((x) => x.ab !== "ATL").slice(0, 17)) {
      const g = createGame(side(atl, { [bijan.id]: 100 }, season), side(team(o.ab), {}, season), { rand });
      playGame(g);
      att += boxOf(g).h[bijan.id]?.rushAtt || 0; yds += boxOf(g).h[bijan.id]?.rushYds || 0;
    }
    seasons.push({ att, yds });
  }
  const med = (k) => [...seasons].map((x) => x[k]).sort((a, b) => a - b)[seasons.length >> 1];
  assert.ok(med("att") >= 280 && med("att") <= 390, `median ${med("att")} carries`);
  assert.ok(seasons.every((x) => x.att <= 430), "never far past the carries record");
  assert.ok(seasons.filter((x) => x.yds > 2105).length <= 3, `record seasons: ${seasons.map((x) => x.yds).join(", ")}`);
});

test("season form: fixed per player and season, mostly small, now and then a career year", async () => {
  const { seasonForm } = await import("../src/playsim.js");
  assert.equal(seasonForm("p1", 2026), seasonForm("p1", 2026));
  const f = Array.from({ length: 4000 }, (_, i) => seasonForm(`p${i}`, 2027));
  const small = f.filter((x) => Math.abs(x) <= 3).length / f.length;
  const big = f.filter((x) => x >= 6).length / f.length;
  assert.ok(small > 0.65, `most players play to their rating (${small})`);
  assert.ok(big > 0.01 && big < 0.08, `career years are rare (${big})`);
  assert.ok(Math.max(...f) <= 8 && Math.min(...f) >= -8);
});

test("franchise records: every club starts with its real marks, and a player who passes his club's mark takes it", async () => {
  const { newRecordBook, updateFranchiseRecords, franchiseWatch, loadRecordBook } = await import("../src/records.js");
  const book = newRecordBook();
  assert.equal(Object.keys(book.franchise).length, 32);
  assert.equal(book.franchise.NYG.sacks.val, 22.5);
  const nyg = { ab: "NYG", w: 10, l: 6, roster: [{ id: "a", name: "Abdul Carter", ss: { sacks: 23 } }] };
  const r = updateFranchiseRecords(book, [nyg], 2026);
  assert.equal(r.broken.length, 1);
  assert.equal(r.book.franchise.NYG.sacks.name, "Abdul Carter");
  assert.equal(r.book.franchise.NYG.sacks.prev.name, "Michael Strahan");
  // adding to his own record isn't news again
  nyg.roster[0].ss.sacks = 24;
  assert.equal(updateFranchiseRecords(r.book, [nyg], 2026).broken.length, 0);
  // on pace for one
  const watch = franchiseWatch(newRecordBook(), { ab: "NYG", w: 5, l: 3, roster: [{ id: "b", name: "Malik Nabers", ss: { rec: 60 } }] });
  assert.ok(watch.some((x) => x.key === "rec"));
  // old saves get the franchise marks
  assert.equal(loadRecordBook({ best: {}, history: [] }).franchise.DET.recYds.val, 1964);
});

test("records: a player who sets a mark and lands on injured reserve still holds it, and the next man to pass it passes him", async () => {
  const { newRecordBook, updateFranchiseRecords, updateRecords, loadRecordBook } = await import("../src/records.js");
  // Nabers is hurt in the game that takes him to 110: he's on IR when the week is checked
  const nyg = { ab: "NYG", w: 9, l: 7, roster: [{ id: "cc", name: "Cam Coleman", ss: { rec: 80 } }], ir: [{ id: "mn", name: "Malik Nabers", ss: { rec: 110 } }] };
  let book = updateFranchiseRecords(updateRecords(newRecordBook(), [nyg], 2026).book, [nyg], 2026).book;
  assert.equal(book.franchise.NYG.rec.name, "Malik Nabers");
  assert.equal(book.franchise.NYG.rec.val, 110);
  // a save and reload later, the next season: Coleman passes Nabers's 110, not the old 109
  book = loadRecordBook(JSON.parse(JSON.stringify(book)));
  const nyg2 = { ab: "NYG", w: 12, l: 3, roster: [{ id: "cc", name: "Cam Coleman", ss: { rec: 114 } }], ir: [] };
  const r = updateFranchiseRecords(book, [nyg2], 2027);
  assert.equal(r.broken[0].prev.name, "Malik Nabers");
  assert.equal(r.broken[0].prev.val, 110);
  assert.equal(r.broken[0].prev.yr, 2026);
});

test("player accolades: rings from the champion's roster, awards and honors with years", async () => {
  const { accoladesOf } = await import("../src/history.js");
  const p = { id: "x", sh: [{ y: 2027, tm: "NYG" }, { y: 2026, tm: "DAL" }], ss: { gp: 16 } };
  const teams = []; teams[17] = { ab: "NYG" }; teams[8] = { ab: "DAL" };
  const awards = [{ yr: 2026, honors: { pb: { NFC: [{ pid: "x" }], AFC: [] } } }, { yr: 2027, dpoy: { pid: "x" }, honors: { ap1: [{ pid: "x" }], pb: { NFC: [{ pid: "x" }] } } }, { yr: 2028, honors: { pb: { NFC: [{ pid: "x" }] } } }];
  const champs = [{ yr: 2026, ti: 17 }, { yr: 2027, ti: 17 }, { yr: 2028, ti: 17 }];
  const a = Object.fromEntries(accoladesOf(p, { awards, champs, teams, yr: 2028, teamAb: "NYG" }).map((x) => [x.k, x.years]));
  assert.deepEqual(a.sb, [2027, 2028], "a ring for each title he was on the roster for (not 2026, when he was in Dallas)");
  assert.deepEqual(a.dpoy, [2027]);
  assert.deepEqual(a.ap1, [2027]);
  assert.deepEqual(a.pb, [2026, 2027, 2028]);
});

test("draft pedigree: real players from the real draft, league picks with the team that made them", async () => {
  const { draftPedigree } = await import("../src/history.js");
  assert.deepEqual(draftPedigree({ name: "Josh Allen", src: "m27", bio: { college: "Wyoming" } }), { yr: 2018, rd: 1, pk: 7, tm: "BUF" });
  assert.deepEqual(draftPedigree({ name: "Arvell Reese", src: "m27", bio: { college: "Ohio State" } }), { yr: 2026, rd: 1, pk: 5, tm: "NYG" });
  const teams = []; teams[17] = { ab: "NYG" };
  assert.deepEqual(draftPedigree({ id: "a", draftYr: 2027, draftPk: 40 }, { draftHistory: { 2027: [{ id: "a", rd: 2, owner: 17 }] }, teams }), { yr: 2027, rd: 2, pk: 40, tm: "NYG" });
  assert.equal(draftPedigree({ name: "Nobody Real", src: "m27", bio: { college: "Nowhere" } }).undrafted, true);
});
