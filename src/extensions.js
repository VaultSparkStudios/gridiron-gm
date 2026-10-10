// Contract extensions during the season. You can extend a player in the last two years of his
// deal (preseason through the Combine); the new contract starts when his current one runs out,
// at the start of a new league year (re-sign week), so it has to fit under next season's cap.
import { capFor } from "./cap.js";
import { freshDeal } from "./bonus.js";

const r1 = (x) => Math.round((+x || 0) * 10) / 10;
export const EXT_PHASES = new Set(["preseason", "regular", "playoffs", "combine"]);
export const canExtend = (p, sp) => EXT_PHASES.has(sp) && (p.contract || 0) >= 1 && p.contract <= 2 && !p.ext;

// Money already on next season's books: deals still running then, extensions that start then,
// and dead money pushed to next year.
export function nextYearCommitted(t) {
  let s = t.deadNext || 0;
  for (const p of [...(t.roster || []), ...(t.ir || [])]) {
    if ((p.contract || 0) >= 2) s += (p.salary || 0) + (p.baseBack || 0);
    else if (p.ext) s += p.ext.sal;
  }
  return r1(s);
}
export const nextYearRoom = (t, yr) => r1(capFor(yr + 1) - nextYearCommitted(t));
// Room for this player's new deal (a player with two years left is already counted next year).
export const extRoom = (t, p, yr) => r1(nextYearRoom(t, yr) + ((p.contract || 0) >= 2 ? (p.salary || 0) + (p.baseBack || 0) : 0));

// How an extension is paid, like real deals: part of the new money as a signing bonus, spread
// over up to five years starting this season. The bonus lowers every new year's cap hit (so the
// deal fits next season's cap) at the cost of a little room now and dead money if he's cut.
// sal: average per new year; share: part of the new money paid as bonus.
export const EXT_BONUS = [0, 0.25, 0.4, 0.55];
export function extStructure(sal, yrs, share = 0) {
  const bonus = r1(sal * yrs * share), n = Math.min(5, yrs + 1), pr = r1(bonus / n);
  return { bonus, n, pr, hit: r1(sal - bonus / yrs + pr), nowAdd: pr };
}

// New league year: extensions whose old deal just ran out take over. Mutates the teams.
export function applyExtensions(teams, yr) {
  const done = [];
  for (const t of teams) {
    if (!t?.roster) continue;
    t.roster = t.roster.map((p) => {
      if (!p.ext || p.contract !== 1) return p;
      done.push(p);
      const { ext, ...rest } = p;
      // contract counts the season about to end too (it ticks down after the draft)
      return { ...freshDeal(rest), salary: ext.sal, ...(ext.sb ? { sb: ext.sb } : {}), contract: ext.yrs + 1, resigned: { yr, sal: ext.apy ?? ext.sal, yrs: ext.yrs, how: "extension" } };
    });
  }
  return done;
}
