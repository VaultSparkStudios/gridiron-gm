// Contract negotiation. Every player has an asking price you can see and a minimum you can't
// (86-98% of the ask, fixed per player and season). Offer at or above the minimum and he signs;
// get close and he counters; lowball him and he loses patience. Three strikes, or one insulting
// offer, and he walks. In free agency, good players often have another club bidding too: if
// their offer beats yours, he signs there.
import { askingPrice } from "./offseason.js";

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
export const yearlyAsk = (p, yrs, mode) => r1(askingPrice(p) * (1 + (yrs - 2) * (p.age >= 30 ? 0.06 : -0.03)) * perfFactor(p, yrs, mode));
export const maxYears = (p) => (p.age >= 33 ? 1 : p.age >= 30 ? 3 : 5);

// The hidden side of a negotiation. loyalty (0-1) shaves up to 6% off for your own players
// when the team is winning and happy. rivals: AI clubs that could bid in free agency.
export function terms(p, { yr, mode, loyalty = 0, rivals = [] }) {
  // An extension costs a little more: he gives up testing free agency.
  const minF = 0.86 + hash(`${p.id}:${yr}:min`) * 0.12 - (mode === "resign" || mode === "extend" ? 0.06 * loyalty : 0) + (mode === "extend" ? 0.03 : 0);
  let rival = null;
  if (mode === "fa" && rivals.length && p.ovr >= 68 && hash(`${p.id}:${yr}:rival`) < Math.min(0.85, (p.ovr - 62) / 25)) {
    rival = { team: rivals[Math.floor(hash(`${p.id}:${yr}:who`) * rivals.length)], f: 0.88 + hash(`${p.id}:${yr}:bid`) * 0.24 };
  }
  return { minF, rival, mode };
}

// The player's answer to `offer` ({ sal, yrs }). state: { tries } so far with this player.
export function respond(p, offer, t, state = {}) {
  const ask = yearlyAsk(p, offer.yrs, t.mode);
  const need = r1(ask * t.minF);
  const tries = (state.tries || 0) + 1;
  const rivalSal = t.rival ? r1(yearlyAsk(p, Math.min(maxYears(p), 3)) * t.rival.f) : 0;
  if (offer.sal >= need) {
    // He'd take yours, unless another club is paying clearly more.
    if (t.rival && rivalSal > offer.sal * 1.05) return { result: "lost", team: t.rival.team, sal: rivalSal, tries, msg: `He took a better offer: $${rivalSal}M a year.` };
    return { result: "accept", tries, msg: offer.sal >= ask ? "Done deal — he's thrilled." : "He accepts. Welcome aboard." };
  }
  const insult = offer.sal < need * 0.7;
  if (insult || tries >= 3) return { result: "walk", tries, msg: insult ? "He's insulted and ends talks." : "He's done negotiating with you." };
  if (offer.sal >= need * 0.85) {
    const counter = r1(Math.max(need, (offer.sal + ask) / 2));
    return { result: "counter", counter, tries, msg: `He'd sign for $${counter}M a year.` };
  }
  return { result: "reject", tries, msg: "Not even close. He wants a lot more." };
}

// How warm he is to you right now, 0-100, for a mood meter.
export const interest = (state = {}) => (state.walked ? 0 : Math.max(10, 100 - (state.tries || 0) * 30));
