// The morning paper after each of your playoff games, played live or simmed: the story of the game,
// its star, and for the loser what went wrong and where to build in the off-season.
import { teamNeeds, needName } from "./needs.js";
import { playoffScore } from "./playoffGrowth.js";
import { sbName, sbNumber } from "./data/superbowls.js";
import { playoffHeadline } from "./gazetteBank.js";

export const PAPER_ROUNDS = ["", "Wild Card", "Divisional Round", "Conference Championship", "Super Bowl"];
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const n2w = (n) => NUM[n] || String(n);
const last = (n) => (n || "").split(" ").slice(1).join(" ") || n;

// A side's totals from its box score.
export function boxTotals(box) {
  const t = { pass: 0, rush: 0, td: 0, ints: 0, fum: 0, sacks: 0, takeaways: 0 };
  for (const l of Object.values(box || {})) {
    t.pass += l.passYds || 0; t.rush += l.rushYds || 0;
    t.td += (l.passTD || 0) + (l.rushTD || 0);
    t.ints += l.passInt || 0; t.fum += l.fum || 0;
    t.sacks += l.sacks || 0; t.takeaways += l.ints || 0;
  }
  t.giveaways = t.ints + t.fum;
  return t;
}
const best = (box) => Object.values(box || {}).map((l) => ({ ...l, s: playoffScore(l) })).sort((a, b) => b.s - a.s)[0] || null;
// "24 of 33 for 291 yards and two touchdowns", in newspaper words
export function lineProse(l) {
  if (!l) return "";
  if (l.att) return `${l.comp || 0} of ${l.att} for ${l.passYds || 0} yards${l.passTD ? ` and ${n2w(l.passTD)} touchdown${l.passTD > 1 ? "s" : ""}` : ""}`;
  if (l.rushYds >= (l.recYds || 0) && l.rushYds) return `${l.rushYds} rushing yards${l.rushTD ? ` and ${n2w(l.rushTD)} score${l.rushTD > 1 ? "s" : ""}` : ""}`;
  if (l.recYds) return `${l.rec || 0} catches for ${l.recYds} yards${l.recTD ? ` and ${n2w(l.recTD)} touchdown${l.recTD > 1 ? "s" : ""}` : ""}`;
  if (l.sacks) return `${l.sacks} sack${l.sacks > 1 ? "s" : ""}${l.tkl ? ` among ${l.tkl} tackles` : ""}`;
  if (l.ints) return `${n2w(l.ints)} interception${l.ints > 1 ? "s" : ""}`;
  return l.tkl ? `${l.tkl} tackles` : "";
}

// g: { h, a, hs, as, w, boxH, boxA }; rd: 1-4; teams; ui (your club).
export function buildPlayoffPaper({ g, rd, yr, teams, ui }) {
  const wi = g.w ?? (g.hs > g.as ? g.h : g.a), li = wi === g.h ? g.a : g.h;
  const W = teams[wi], L = teams[li];
  const wBox = wi === g.h ? g.boxH : g.boxA, lBox = wi === g.h ? g.boxA : g.boxH;
  const ws = Math.max(g.hs, g.as), ls = Math.min(g.hs, g.as), m = ws - ls;
  const wt = boxTotals(wBox), lt = boxTotals(lBox);
  const star = best(wBox), goat = best(lBox);
  const round = PAPER_ROUNDS[rd] || "Playoffs";
  const sb = rd === 4 ? sbName(sbNumber(yr)) : null;
  const youWon = wi === ui;
  // the headline and the lede's verdict, from the paper's bank (a different one each game)
  const ph = playoffHeadline({ W, L, ws, ls, rd, yr });
  const head = rd === 4 ? `${W.name.toUpperCase()} WIN ${sb.toUpperCase()}` : ph.head;
  const next = rd < 4 ? (rd === 3 ? "the Super Bowl" : `the ${PAPER_ROUNDS[rd + 1]}`) : null;
  const deck = rd === 4 ? `${W.city} are champions; ${L.city}'s season ends one game short`
    : `${W.city} advance to ${next}; ${L.city}'s season is over`;
  const story = [
    `${W.city.toUpperCase()} — The ${W.name} beat the ${L.city} ${L.name}, ${ws}-${ls}, in the ${round}${sb ? ` (${sb})` : ""}, ${ph.how}.`,
    star ? `${star.name} led the way with ${lineProse(star)}.${wt.takeaways + lt.giveaways > 0 && lt.giveaways >= 2 ? ` The ${W.name} defense forced ${n2w(lt.giveaways)} turnovers.` : ""} The ${W.name} ran for ${wt.rush} yards and threw for ${wt.pass}.` : `It was a team win, built on ${wt.rush} rushing yards and ${wt.pass} through the air.`,
    goat ? `For the ${L.name}, ${goat.name} finished with ${lineProse(goat) || "a quiet afternoon"}, but it wasn't enough.` : `The ${L.name} never found their footing.`,
  ];
  // what went wrong for the loser, from the box score
  const wrong = [];
  if (lt.giveaways >= 2) wrong.push(`${n2w(lt.giveaways)} turnovers (${lt.ints} interception${lt.ints === 1 ? "" : "s"}, ${lt.fum} fumble${lt.fum === 1 ? "" : "s"}). You can't give a playoff team extra possessions.`);
  if (wt.rush - lt.rush >= 60) wrong.push(`Lost the ground game ${wt.rush}-${lt.rush}: the front couldn't stop the run or open holes.`);
  if (wt.sacks >= 3) wrong.push(`The quarterback was sacked ${wt.sacks} times. The protection broke down.`);
  if (lt.pass < 180) wrong.push(`Only ${lt.pass} passing yards. Nobody could get open, or the quarterback couldn't find them.`);
  if (ws >= 30) wrong.push(`Gave up ${ws} points. The defense had no answers.`);
  if (ls <= 13) wrong.push(`Scored just ${ls}. The offense never got going.`);
  wrong.forEach((x, i) => { wrong[i] = x[0].toUpperCase() + x.slice(1); });
  if (!wrong.length) wrong.push(m <= 3 ? "A coin-flip game that went the other way. A play here or there." : `Out-played across the board, ${ws}-${ls}.`);
  // where the loser builds next: real needs, plus aging starters and expiring deals
  const roster = L.roster || [];
  const needs = teamNeeds(roster).list.filter((x) => x.score >= 0.2).slice(0, 3).map((x) => `${needName(x.pos)}${x.why.length ? ` (${x.why[0]})` : ""}`);
  const aging = roster.filter((p) => p.ovr >= 78 && p.age >= 32).sort((a, b) => b.ovr - a.ovr).slice(0, 2).map((p) => `${p.name} (${p.pos}, ${p.age})`);
  const expiring = roster.filter((p) => p.ovr >= 75 && (p.contract ?? 2) <= 1).sort((a, b) => b.ovr - a.ovr).slice(0, 3).map((p) => `${p.name} (${p.pos} ${p.ovr})`);
  const build = [
    needs.length ? `Biggest needs: ${needs.join("; ")}.` : "No glaring holes: this roster needs depth, not a rebuild.",
    expiring.length ? `Decisions due: ${expiring.join(", ")} ${expiring.length > 1 ? "are" : "is"} up for a new deal.` : null,
    aging.length ? `Clock is ticking on ${aging.join(" and ")}.` : null,
  ].filter(Boolean);
  return {
    yr, rd, round, sb, head, deck, story, ws, ls, wi, li, youWon, mine: wi === ui || li === ui,
    star: star && { name: star.name, pos: star.pos, line: lineProse(star) },
    wrong, build, loser: L.name, winner: W.name, city: (youWon ? W : L).city,
    stats: [["Passing", wt.pass, lt.pass], ["Rushing", wt.rush, lt.rush], ["Turnovers", wt.giveaways, lt.giveaways], ["Sacks", wt.sacks, lt.sacks]],
    next,
  };
}
