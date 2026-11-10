// Contract depth: void years, incentives and offer sheets.
//
// Void years: extra years tacked onto a deal only to spread its signing bonus thinner. The player
// is gone when the real years end, and the bonus still sitting on the void years lands on the cap
// then as dead money (p.voidDead).
//
// Incentives: a bonus the player earns by hitting a target (1,000 yards, 10 sacks, a Pro Bowl).
// They're "not likely to be earned", so they don't count now: if he earns one, it's charged to
// next season's cap (t.incNext, which becomes t.incCharge in the new league year).
//
// Offer sheets: a club can offer a contract to another team's franchise-tagged player. His team
// matches it and keeps him, or lets him go for two first-round picks.
const r1 = (x) => Math.round(x * 10) / 10;

export const VOID_YEARS = [0, 1, 2];

// Incentive targets: label -> did he hit it? ctx: { honor, wins }.
const num = (s) => +String(s).replace(/,/g, "").match(/[\d.]+/)?.[0] || 0;
const stat = (k) => (label) => (p) => (p.ss?.[k] || 0) >= num(label);
const TESTS = [
  [/pass yds/, stat("passYds")], [/pass TD/, stat("passTD")], [/rush yds/, stat("rushYds")], [/rush TD/, stat("rushTD")],
  [/rec yds/, stat("recYds")], [/rec TD/, stat("recTD")], [/catches/, stat("rec")], [/sacks/, stat("sacks")],
  [/tackles/, stat("tkl")], [/INT/, stat("ints")], [/pass def/, stat("pd")], [/FG made/, stat("fgM")], [/starts/, stat("gs")],
  [/% on FGs/, (label) => (p) => (p.ss?.fgA || 0) >= 10 && (p.ss.fgM || 0) / p.ss.fgA >= num(label) / 100],
  [/yd avg/, (label) => (p) => (p.ss?.punts || 0) >= 20 && (p.ss.puntYds || 0) / p.ss.punts >= num(label)],
  [/wins/, (label) => (p, ctx) => (ctx.wins || 0) >= num(label)],
  [/All-Pro/, () => (p, ctx) => ctx.honor === "ap1" || ctx.honor === "ap2"],
  [/Pro Bowl/, () => (p, ctx) => !!ctx.honor],
];
export function incentiveMet(label, p, ctx = {}) {
  const t = TESTS.find(([re]) => re.test(label));
  return t ? !!t[1](label)(p, ctx) : false;
}

// What an incentive is worth to the player when he weighs an offer (he isn't sure he'll earn it).
export const incentiveWorth = (amt) => r1((amt || 0) * 0.4);
// The incentive sizes offered at the table: a share of the yearly salary.
export const INCENTIVE_SIZES = [0, 0.1, 0.2];

// End of the regular season: pay every earned incentive (charged to next season's cap). Mutates
// the teams. hon: player id -> honor. Returns [{ ti, p, label, amt }].
export function settleIncentives(teams, hon = {}, yr) {
  const paid = [];
  teams.forEach((t, ti) => {
    for (const p of t.roster || []) {
      if (!p.inc || p.inc.paidYr === yr || !(p.inc.amt > 0)) continue;
      if (!incentiveMet(p.inc.label, p, { honor: hon[p.id], wins: t.w })) continue;
      p.inc = { ...p.inc, paidYr: yr, earned: (p.inc.earned || 0) + 1 };
      t.incNext = r1((t.incNext || 0) + p.inc.amt);
      paid.push({ ti, p, label: p.inc.label, amt: p.inc.amt });
    }
  });
  return paid;
}

// A deal ending: the bonus left on its void years becomes dead money now. Mutates the team.
export function accelerateVoid(t, p) {
  if (!p?.voidDead) return 0;
  const d = p.voidDead;
  t.deadCap = r1((t.deadCap || 0) + d);
  delete p.voidDead;
  delete p.voidYrs;
  return d;
}

// Offer sheets. The players you can offer one to: other clubs' franchise-tagged players this year.
export const taggedPlayers = (teams, ui, yr) => teams.flatMap((t, ti) => (ti === ui ? [] : (t.roster || []).filter((p) => p.ftag && p.tagYr === yr && !p.sheetYr).map((p) => ({ p, ti }))));

// The compensation: your own first-round pick in this draft and next year's. Returns
// { ok, pick, why } (pick: this year's first-rounder you'd give up).
export function sheetCompensation(picks, futures, ui, yr) {
  const pick = (picks || []).filter((pk) => pk.owner === ui && pk.rd === 1 && (pk.yr ?? yr) === yr).sort((a, b) => (a.overall || 0) - (b.overall || 0))[0];
  const nextGone = (futures || []).some((f) => f.yr === yr + 1 && f.orig === ui && f.rd === 1);
  if (!pick) return { ok: false, why: "You need a first-round pick in this draft to sign an offer sheet." };
  if (nextGone) return { ok: false, why: "You've already traded next year's first-round pick." };
  return { ok: true, pick };
}

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
// Does his club match? More likely for a franchise player and when it can afford the deal; a big
// overpay makes it harder. Seeded on the player and the offer, so asking again doesn't re-roll.
export function clubMatches(p, team, offer, { ask, room, franchise }) {
  if (room < offer.sal - (p.salary || 0)) return false; // can't fit it
  const over = Math.max(0, offer.sal / Math.max(1, ask) - 1);
  const chance = (franchise ? 0.85 : 0.6) - over * 1.6 - (offer.yrs >= 5 ? 0.05 : 0);
  return hash(`${p.id}:${offer.sal}:${offer.yrs}`) < chance;
}
