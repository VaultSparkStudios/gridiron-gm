// Contract negotiation. Every player has an asking price you can see and a minimum you can't
// (86-98% of the ask, fixed per player and season). Offer at or above the minimum and he signs;
// get close and he counters; lowball him and he loses patience. Three strikes, or one insulting
// offer, and he walks. In free agency, good players often have another club bidding too: if
// their offer beats yours, he signs there.
import { askingPrice, careerAge } from "./offseason.js";

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const r1 = (x) => Math.round(x * 10) / 10;

// Per-year price for a deal of `yrs` years: veterans want more to commit long, young players
// take a little less for security.
// mode "resign" or "extend": his own team is negotiating, so his last season counts. A big year
// raises the ask; after a down year he takes less on a long deal, or bets on himself with a
// one-year "prove it" deal near his full price. In free agency (mode "fa") the market goes by
// his rating again.
export const perfFactor = (p, yrs, mode) => {
  const f = (mode === "resign" || mode === "extend") && p.perf?.f ? p.perf.f : 1;
  return f < 1 && yrs === 1 ? 1 - (1 - f) * 0.25 : f;
};
// A loyal player (three seasons with your club) gives you a hometown discount to stay: 10% off.
export const loyalDiscount = (p, mode) => (p.loyal && (mode === "resign" || mode === "extend") ? 0.9 : 1);
export const yearlyAsk = (p, yrs, mode) => r1(askingPrice(p) * (1 + (yrs - 2) * (p.age >= 30 ? 0.06 : -0.03)) * perfFactor(p, yrs, mode) * loyalDiscount(p, mode));
export const maxYears = (p) => { const a = careerAge(p); return a >= 33 ? 1 : a >= 30 ? 3 : 5; }; // quarterbacks and kickers play longer

// What a player wants besides money. Every player weighs four things: the money, playing time,
// a scheme that suits him, and a winner. Young and fringe players chase snaps, veterans chase
// rings, the rest lean one way or another (fixed per player). A club that offers what he values
// can sign him for less than a bigger offer elsewhere (Isaiah Likely taking less to start for the
// Giants), and a backup you want to keep wants paying more to stay one.
export const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 3, S: 2, K: 1, P: 1 };
const OFF = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT"];
// which positions each scheme leans on (it features them, so they play more and look better)
export const SCHEME_LIKES = { "Air Raid": ["QB", "WR"], Spread: ["QB", "WR", "RB"], "West Coast": ["QB", "TE", "RB", "WR"], "Power Run": ["RB", "TE", "LT", "LG", "C", "RG", "RT"], "3-4": ["LB", "EDGE"], "4-3": ["DL"], "Cover 2": ["S", "CB"], "Zone Blitz": ["LB", "S"] };
const PROFILES = [
  { key: "money", label: "the biggest contract", role: 0.15, scheme: 0.1, win: 0.1 },
  { key: "role", label: "a starting job", role: 0.5, scheme: 0.2, win: 0.1 },
  { key: "scheme", label: "the right scheme", role: 0.25, scheme: 0.5, win: 0.1 },
  { key: "win", label: "a winner", role: 0.2, scheme: 0.1, win: 0.5 },
];
export function priorities(p) {
  const h = hash(`${p.id}:wants`);
  if (p.age >= 31 && h < 0.6) return PROFILES[3];
  if (p.ovr < 78 && h < 0.6) return PROFILES[1];
  return PROFILES[Math.floor(h * 4) % 4];
}
// How a club looks to him: would he start (role 1), be the first backup (0.45) or sit (0.15);
// does the coordinator's scheme feature his position; and how they did last season.
export function teamFit(p, team) {
  if (!team) return null;
  const pos = p.pos, n = STARTERS[pos] || 1;
  const ahead = (team.roster || []).filter((x) => x.id !== p.id && x.pos === pos && !x.injured && x.ovr > p.ovr).length;
  const role = ahead < n ? 1 : ahead < n + 1 ? 0.45 : 0.15;
  const c = (team.coach || {})[OFF.includes(pos) ? "oc" : "dc"];
  const likes = SCHEME_LIKES[c?.scheme] || [];
  const scheme = !c ? 0.5 : likes.includes(pos) || (p.mpos === "EDGE" && likes.includes("EDGE")) ? 1 : 0.35;
  const g = (team.w || 0) + (team.l || 0) + (team.t || 0);
  const win = g ? ((team.w || 0) + (team.t || 0) / 2) / g : 0.5;
  return { role, scheme, win, schemeName: c?.scheme || null, roleLabel: role === 1 ? "starter" : role > 0.3 ? "first backup" : "deep backup" };
}
// how much better (or worse) an offer from this club is worth to him than the money alone
export const fitPull = (prio, fit) => (!prio || !fit ? 0 : prio.role * (fit.role - 0.5) * 0.36 + prio.scheme * (fit.scheme - 0.5) * 0.24 + prio.win * (fit.win - 0.5) * 0.24);
// the plain-English reason a club appeals to him more than another
export function whyBetter(prio, a, b) {
  if (!prio || !a || !b) return "";
  const r = [];
  if (a.role > b.role && prio.role >= 0.2) r.push(a.role === 1 ? "he'd start there" : "more snaps there");
  if (a.scheme > b.scheme && prio.scheme >= 0.2) r.push(`their ${a.schemeName} fits him`);
  if (a.win > b.win + 0.1 && prio.win >= 0.2) r.push("they win more");
  return r.join(", ");
}

// The hidden side of a negotiation. loyalty (0-1) shaves up to 6% off for your own players
// when the team is winning and happy. rivals: AI clubs that could bid in free agency.
export function terms(p, { yr, mode, loyalty = 0, rivals = [], culture = 0, myTeam = null, teamById = null }) {
  // An extension costs a little more: he gives up testing free agency.
  const minF = 0.86 + hash(`${p.id}:${yr}:min`) * 0.12 - (mode === "resign" || mode === "extend" ? 0.06 * loyalty : 0) + (mode === "extend" ? 0.03 : 0) - culture;
  let rival = null;
  if (mode === "fa" && rivals.length && p.ovr >= 68 && hash(`${p.id}:${yr}:rival`) < Math.min(0.85, (p.ovr - 62) / 25)) {
    rival = { team: rivals[Math.floor(hash(`${p.id}:${yr}:who`) * rivals.length)], f: 0.88 + hash(`${p.id}:${yr}:bid`) * 0.24 };
  }
  const prio = myTeam ? priorities(p) : null;
  if (rival && teamById) rival.fit = teamFit(p, teamById(rival.team));
  // how far his gut can lean toward the other club when it's close (fixed, never shown)
  const edge = hash(`${p.id}:${yr}:edge`) * 0.06;
  return { minF, rival, mode, prio, fitMe: myTeam ? teamFit(p, myTeam) : null, edge };
}

// The player's answer to `offer` ({ sal, yrs }). state: { tries } so far with this player.
import { incentiveWorth } from "./contractDepth.js";

export function respond(p, offer, t, state = {}) {
  const ask = yearlyAsk(p, offer.yrs, t.mode);
  const need = r1(ask * t.minF);
  const tries = (state.tries || 0) + 1;
  // guaranteed money up front makes an offer worth a little more to him
  // and an incentive he might earn is worth something too
  const money_ = r1(offer.sal * (1 + 0.06 * (offer.share || 0)) + incentiveWorth(offer.inc?.amt));
  // what your offer is worth to him: the money, plus or minus how well you fit what he wants
  const pullMe = fitPull(t.prio, t.fitMe);
  const v = r1(money_ * (1 + pullMe));
  const rYrs = Math.min(maxYears(p), 3);
  const rivalSal = t.rival ? r1(yearlyAsk(p, rYrs) * t.rival.f) : 0;
  if (v >= need) {
    if (t.rival) {
      const uR = rivalSal * (1 + fitPull(t.prio, t.rival.fit));
      const why = whyBetter(t.prio, t.rival.fit, t.fitMe);
      const base = { team: t.rival.team, sal: rivalSal, yrs: rYrs, why, tries };
      // First time he'd rather go there, his agent uses the other offer as leverage: here's what
      // they're paying, give him a reason. Beating that number is no guarantee: it's his call.
      if (!state.last?.rivalBid && uR > v * (t.fitMe ? 1.02 : 1.05)) return { ...base, result: "counter", rivalBid: true, counter: r1(Math.max(offer.sal + 0.5, uR / (1 + pullMe) / (1 + 0.06 * (offer.share || 0)) + 0.3)), msg: `He has $${rivalSal}M a year for ${rYrs} year${rYrs === 1 ? "" : "s"} elsewhere. Give him a reason to pick you.` };
      if (state.last?.rivalBid && uR * (1 + (t.edge || 0)) > v) return { ...base, result: "lost", msg: `He took the other offer: $${rivalSal}M a year.` };
      if (rivalSal > money_) { const w = whyBetter(t.prio, t.fitMe, t.rival.fit); return { result: "accept", tries, msg: `He took less to sign with you${w ? `: ${w.replace(/there/g, "here").replace("their", "your")}` : ""}.` }; }
    }
    return { result: "accept", tries, msg: money_ >= ask ? "Done deal — he's thrilled." : "He accepts. Welcome aboard." };
  }
  const insult = v < need * 0.7;
  if (insult || tries >= 3) return { result: "walk", tries, msg: insult ? "He's insulted and ends talks." : "He's done negotiating with you." };
  if (v >= need * 0.85) {
    const counter = r1(Math.max(need, (offer.sal + ask) / 2));
    return { result: "counter", counter, tries, msg: `He'd sign for $${counter}M a year.` };
  }
  return { result: "reject", tries, msg: "Not even close. He wants a lot more." };
}

// How warm he is to you right now, 0-100, for a mood meter.
export const interest = (state = {}) => (state.walked ? 0 : Math.max(10, 100 - (state.tries || 0) * 30));
