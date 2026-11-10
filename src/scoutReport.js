// The week's scouting report on the opponent: how he lines up (his personnel identity and how
// often his defense plays base, nickel and dime), which of your offensive identities and defensive
// leans fare best against what he actually fields, and the matchups to go after: a weak nickel
// back against your slot receiver, a linebacker who'll be covering your tight end, the corner
// opposite his No. 1.
//
// Every judgment runs through the same unit ratings the game engine plays with (gamesim.js), each
// player at the role he plays (roles.js), so the report is right about what will happen.
import { offUnits, defUnits, lbCover } from "./gamesim.js";
import { teamPersonnel, LEAGUE } from "./playsim.js";
import { PERS_LEAN, OFF_SETS, DEF_SETS, PKGS, pkgOdds, pkgShare, defTilt } from "./personnel.js";
import { roleOvr } from "./roles.js";

const z = (v, k) => (v - LEAGUE[k][0]) / LEAGUE[k][1];
const PASS_PREMIUM = 1.5; // a throw is worth more than a run on its own (as in the auto personnel pick)
// a last name for a tight line, skipping suffixes ("Trevon Diggs II" -> "Diggs")
const last = (n) => { const w = String(n || "").split(" ").filter((x) => !/^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(x)); return w[w.length - 1] || ""; };
// how much one choice beats another, in words (the values are small: a few hundredths is noise)
export const edgeWord = (gap) => (gap < 0.03 ? "about even" : gap < 0.08 ? "a slight edge" : "a clear edge");
const pct = (x) => Math.round(x * 100);

// How an offense does in one grouping against a defense that answers with its packages (tilt:
// that defense's lean). Higher is better for the offense.
export function persValue(offOrd, defOrd, pers, tilt) {
  const u = offUnits(offOrd, pers), odds = pkgOdds(pers, tilt), pl = 0.58 + PERS_LEAN[pers];
  return PKGS.reduce((t, k, i) => {
    if (!odds[i]) return t;
    const d = defUnits(defOrd, k);
    return t + odds[i] * (pl * (PASS_PREMIUM + z(u.pass, "pass") - z(d.passD, "passD")) + (1 - pl) * (z(u.run, "run") - z(d.runD, "runD")));
  }, 0);
}
const mixValue = (mix, val) => Object.entries(mix).reduce((t, [p, w]) => t + w * val(p), 0);

// me / opp: the two clubs; myOrd / oppOrd: their players in depth order (pos -> list).
export function scoutReport(me, opp, myOrd, oppOrd) {
  const theirs = teamPersonnel(opp, oppOrd), mine = teamPersonnel(me, myOrd);
  // your offense: every identity against his defense (each grouping valued once, then mixed)
  const persV = {};
  const val = (p) => (persV[p] ??= persValue(myOrd, oppOrd, p, theirs.tilt));
  const off = OFF_SETS.filter((s) => s.mix).map((s) => ({ key: s.key, label: s.label, icon: s.icon, v: mixValue(s.mix, val) })).sort((a, b) => b.v - a.v);
  const curOff = me.personnel && me.personnel !== "auto" ? me.personnel : mine.auto;
  // your defense: each lean against his offense's identity (lower is better for you)
  const sam = myOrd("LB")[0], nb = myOrd("CB")[2];
  const samR = sam ? roleOvr(sam, "SAM") : 60, nbR = nb ? roleOvr(nb, "NB") : 60;
  const def = DEF_SETS.filter((s) => s.shift != null).map((s) => {
    const tilt = defTilt({ ...me, defPkg: s.key }, samR, nbR), pv = {};
    return { key: s.key, label: s.label, icon: s.icon, v: mixValue(theirs.mix, (p) => (pv[p] ??= persValue(oppOrd, myOrd, p, tilt))) };
  }).sort((a, b) => a.v - b.v);
  const curDef = me.defPkg && me.defPkg !== "auto" ? me.defPkg : null;

  // his tendencies
  const heavy = (theirs.mix[12] || 0) + (theirs.mix[13] || 0) + (theirs.mix[21] || 0), light = (theirs.mix[10] || 0) + (theirs.mix[11] || 0);
  const pk = pkgShare(theirs.tilt);
  const setName = OFF_SETS.find((s) => s.key === theirs.offSet)?.label || "Balanced";
  // the matchups worth going after (and the ones to worry about), biggest first
  const notes = [];
  const add = (score, text, tone = "attack") => notes.push({ score, text, tone });
  const theirNB = oppOrd("CB")[2], mySlot = myOrd("WR")[2];
  if (theirNB && mySlot) { const a = roleOvr(mySlot, "SLOT"), b = roleOvr(theirNB, "NB"); if (a - b >= 5) add(a - b, `Their nickel ${last(theirNB.name)} (${b}) against your slot ${last(mySlot.name)} (${a}): attack the slot.`); }
  const theirSam = oppOrd("LB")[0], myTE = myOrd("TE")[0];
  if (theirSam && myTE && pk.base >= 0.25) { const c = Math.round(lbCover(theirSam)); if (myTE.ovr - c >= 10) add((myTE.ovr - c) * 0.8, `In base (${pct(pk.base)}% of snaps) their SAM ${last(theirSam.name)} (coverage ${c}) has your tight end ${last(myTE.name)} (${myTE.ovr}): two tight ends pull him onto the field.`); }
  const theirCB2 = oppOrd("CB")[1], myWR = myOrd("WR").slice(0, 2).sort((a, b) => b.ovr - a.ovr);
  if (theirCB2 && myWR[1]) { const d = myWR[1].ovr - theirCB2.ovr; if (d >= 5) add(d * 0.9, `Their CB1 follows ${last(myWR[0].name)}; ${last(myWR[1].name)} (${myWR[1].ovr}) gets CB2 ${last(theirCB2.name)} (${theirCB2.ovr}).`); }
  if (pk.nickel + pk.dime >= 0.72) add(6, `They stay light (nickel or dime ${pct(pk.nickel + pk.dime)}% of the time): heavy sets run on them.`);
  else if (pk.base >= 0.4) add(5, `A base-heavy defense (${pct(pk.base)}% base): three receivers put a linebacker on your slot man.`);
  // what's coming at you
  if (heavy >= 0.42) add(5.5, `They live in heavy sets (12/13/21 ${pct(heavy)}%): your SAM ${sam ? `${last(sam.name)} (${samR})` : "spot"} will play a lot.`, "watch");
  else if (light >= 0.75) add(5.5, `They spread you out (11/10 ${pct(light)}%): your nickel ${nb ? `${last(nb.name)} (${nbR})` : "spot"} will be tested.`, "watch");
  const theirTop = [...oppOrd("WR").slice(0, 3), ...oppOrd("TE").slice(0, 1)].sort((a, b) => b.ovr - a.ovr)[0];
  if (theirTop && theirTop.ovr >= 85) add(4, `${theirTop.name} (${theirTop.pos} ${theirTop.ovr}) is the one to stop${theirTop.pos === "WR" ? `: your CB1 ${last(myOrd("CB")[0]?.name)} follows him` : ""}.`, "watch");
  notes.sort((a, b) => b.score - a.score);

  return {
    opp: { set: setName, offSet: theirs.offSet, mix: theirs.mix, pk, heavy, light },
    off, bestOff: off[0], curOff, offGap: off[0].v - (off.find((x) => x.key === curOff)?.v ?? off[0].v),
    def, bestDef: def[0], curDef, defGap: curDef ? (def.find((x) => x.key === curDef)?.v ?? def[0].v) - def[0].v : 0,
    notes: notes.slice(0, 4),
  };
}
