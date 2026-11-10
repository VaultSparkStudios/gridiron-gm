import test from "node:test";
import assert from "node:assert/strict";
import { buildPlayoffPaper, boxTotals } from "../src/playoffPaper.js";

const team = (city, name, roster = []) => ({ city, name, ab: name.slice(0, 3).toUpperCase(), roster });
const teams = [team("Buffalo", "Bills"), team("Miami", "Dolphins", [{ name: "Old Star", pos: "DL", ovr: 85, age: 33, contract: 2 }, { name: "Free Agent", pos: "WR", ovr: 80, age: 27, contract: 1 }])];
const g = { h: 0, a: 1, hs: 31, as: 10, boxH: { 1: { name: "Jo Ace", pos: "QB", comp: 20, att: 28, passYds: 300, passTD: 3, sacks: 0 }, 2: { name: "Ed Rush", pos: "DL", sacks: 4 } }, boxA: { 3: { name: "Mo Miss", pos: "QB", comp: 15, att: 33, passYds: 140, passInt: 3, fum: 1 } } };

test("box totals add up a side", () => {
  const t = boxTotals(g.boxA);
  assert.equal(t.giveaways, 4);
  assert.equal(t.pass, 140);
});

test("a playoff paper: story, star, what went wrong and the loser's blueprint", () => {
  const p = buildPlayoffPaper({ g, rd: 2, yr: 2027, teams, ui: 1 });
  assert.match(p.head, /DOLPHINS/); // a rout headline from the bank (worded differently game to game)
  assert.equal(p.star.name, "Jo Ace");
  assert.equal(p.youWon, false);
  assert.ok(p.wrong.some((w) => /turnovers/.test(w)));
  assert.ok(p.wrong.some((w) => /sacked 4 times/.test(w)));
  assert.ok(p.build.some((b) => /Free Agent/.test(b)));
  assert.ok(p.build.some((b) => /Old Star/.test(b)));
  assert.equal(p.next, "the Conference Championship");
});

test("the Super Bowl paper names the game", () => {
  const p = buildPlayoffPaper({ g, rd: 4, yr: 2027, teams, ui: 0 });
  assert.match(p.head, /SUPER BOWL LXII/);
  assert.equal(p.next, null);
});

test("the Gazette's writers: the same season prints the same paper, different seasons read differently", async () => {
  const { writeGazette } = await import("../src/gazetteBank.js");
  const base = { t: { name: "Giants", city: "New York", ab: "NYG" }, o: { name: "Jaguars", city: "Jacksonville" }, us: 14, them: 10, titles: 3, streak: 1, sb: "Super Bowl LXVIII", mvp: { name: "Caleb Ramsey", pos: "RB", prose: "running for 100 yards", stat: "100 rush yds" }, rec: "16-1", games: [1, 2, 3], bye: true };
  const a = writeGazette({ ...base, yr: 2033 }), again = writeGazette({ ...base, yr: 2033 });
  assert.deepEqual(a, again);
  const papers = Array.from({ length: 12 }, (_, i) => writeGazette({ ...base, yr: 2030 + i }));
  assert.ok(new Set(papers.map((p) => p.head + p.lead[0])).size >= 9, "a dozen seasons, a dozen different front pages");
  assert.ok(new Set(papers.map((p) => p.format)).size === 3 && new Set(papers.map((p) => p.voice)).size >= 3);
  assert.equal(writeGazette({ ...base, yr: 2033, streak: 3 }).kind, "threepeat");
});
