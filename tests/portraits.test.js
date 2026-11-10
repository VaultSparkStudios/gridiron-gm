import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PORTRAITS, genIdentity, pickPortrait, nameFit, portraitSave, resetPortraitUse } from "../src/portraits.js";

const tagsOf = (pid) => PORTRAITS.find((p) => p.id === pid).tags;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test("every portrait in the bank has its image", () => {
  assert.equal(PORTRAITS.length, 48);
  for (const p of PORTRAITS) assert.ok(fs.existsSync(new URL(`../public/portraits/${p.id}.webp`, import.meta.url)), p.id);
});

test("a generated player's name fits his portrait", () => {
  resetPortraitUse();
  for (const pos of ["QB", "RB", "WR", "TE", "LT", "DL", "LB", "CB", "S", "K"]) for (let i = 0; i < 60; i++) {
    const { pid, name } = genIdentity(pos, { rand });
    const fit = nameFit(name);
    assert.ok(tagsOf(pid).some((h) => fit[h] > 0), `${name} on ${pid} (${tagsOf(pid)})`);
  }
});

test("an existing fictional name gets a portrait that fits it", () => {
  resetPortraitUse();
  const cases = [["Jarvarius Jackson", "WR", "black"], ["Connor Sullivan", "QB", "white"], ["Mateo Rivera", "LB", "latino"], ["Sione Fifita", "DL", "pacific"], ["Kenji Tanaka", "CB", "asian"], ["Omar Haddad", "LB", "mena"], ["DeShawn Gaines", "LT", "black"], ["Garrett Mueller", "S", "white"]];
  for (const [name, pos, h] of cases) for (let i = 0; i < 5; i++) assert.ok(tagsOf(pickPortrait(pos, { name })).includes(h), `${name} (${pos})`);
});

test("a league looks like the NFL: mostly Black receivers and corners, more white quarterbacks and linemen", () => {
  resetPortraitUse();
  const share = (pos, h, n = 600) => { let k = 0; for (let i = 0; i < n; i++) if (tagsOf(genIdentity(pos, { rand }).pid).includes(h)) k++; return k / n; };
  const wr = share("WR", "black"), cb = share("CB", "black"), ol = share("LG", "white");
  assert.ok(wr > 0.55 && cb > 0.55, `WR ${wr}, CB ${cb}`);
  assert.ok(ol > 0.35, `OL white ${ol}`);
});

test("only fictional players get a bank portrait, once; real players and prospects keep theirs", () => {
  const fic = { id: "f", name: "Jaylen Banks", pos: "WR", face: { sk: "#000" } };
  const madden = { id: "m", name: "Real Guy", pos: "WR", src: "m27", face: { sk: "#000" } };
  const prospect = { id: "r", name: "Real Prospect", pos: "WR", real: 1, face: { sk: "#000" } };
  const espn = { id: "e", name: "Photo Guy", pos: "WR", face: { espn: 123 } };
  const d = { teams: [{ roster: [fic, madden, espn] }], dc: { 2027: [prospect] } };
  portraitSave(d);
  assert.ok(fic.face.pid && tagsOf(fic.face.pid).includes("black"));
  assert.ok(!madden.face.pid && !prospect.face.pid && !espn.face.pid);
  const was = fic.face.pid;
  portraitSave(d);
  assert.equal(fic.face.pid, was, "never reassigned");
});

test("real draft prospects show their real (college) photo, in new classes and in saves from before", async () => {
  const { genRealDC } = await import("../src/league.js");
  const { headshotSave } = await import("../src/headshots.js");
  const cls = genRealDC(2026);
  const js = cls.find((p) => p.name === "Jeremiah Smith");
  assert.equal(js.face.espn, 5079720);
  assert.equal(js.face.cfb, 1);
  assert.ok(!js.face.pid, "never a bank portrait");
  const real = cls.filter((p) => p.real);
  assert.ok(real.filter((p) => p.face?.espn).length >= real.length - 5, "nearly every real prospect has a photo");
  assert.ok(cls.filter((p) => !p.real).every((p) => p.face?.pid), "the made-up rest of the class gets bank portraits");
  // an older save: the prospect drafted onto a roster with a drawn face
  const old = { ...js, face: { sk: "#000" }, draftYear: undefined, draftYr: 2026 };
  headshotSave({ teams: [{ roster: [old] }] });
  assert.equal(old.face.espn, 5079720);
});
