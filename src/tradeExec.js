// Carrying out a trade between two clubs. Kept out of the screen code so it can be tested: these
// steps once handed you another club's players while yours had already left your roster, and
// edited the live rosters in place.
//
// a and b: club indexes. a sends aPlayers and aPicks to b; b sends bPlayers and bPicks to a.
// Picks this year are in `picks` (owner changes); future picks (pk.future) are recorded in
// `futures` (see draftTrade.js). ctx: { yr, sp } for the dead money each club keeps.
import { tradeAway } from "./bonus.js";
import { moveFuture } from "./draftTrade.js";

// Is every piece still where the offer says? Returns null if so, or what's wrong.
export function swapProblem(teams, picks, { a, b, aPlayers = [], bPlayers = [], aPicks = [], bPicks = [] }) {
  const has = (ti, id) => (teams[ti]?.roster || []).some((p) => p.id === id);
  const owns = (pk, ti) => pk.future || (picks || []).some((x) => x.id === pk.id && x.owner === ti);
  if (teams[a] == null || teams[b] == null || a === b) return "Pick a club to trade with";
  if (!aPlayers.length && !aPicks.length) return "You have to send something";
  if (!bPlayers.length && !bPicks.length) return "You have to get something back";
  if (aPlayers.some((p) => !has(a, p.id)) || bPlayers.some((p) => !has(b, p.id))) return "A player in this deal has moved";
  if (aPicks.some((pk) => !owns(pk, a)) || bPicks.some((pk) => !owns(pk, b))) return "A pick in this deal has moved";
  return null;
}

// Salary club `ti` takes on in the deal (incoming minus outgoing).
export const addedSalary = (sends, gets) => gets.reduce((s, p) => s + (p.salary || 0), 0) - sends.reduce((s, p) => s + (p.salary || 0), 0);

// Do the swap. Returns new { teams, picks, futures } (the arrays passed in are not changed).
export function executeSwap(teams, picks, futures, { a, b, aPlayers = [], bPlayers = [], aPicks = [], bPicks = [] }, ctx = {}) {
  const nt = teams.map((t, i) => (i === a || i === b ? { ...t, roster: [...t.roster] } : t));
  const move = (from, to, list, extra = {}) => {
    for (const p of list) {
      const i = nt[from].roster.findIndex((r) => r.id === p.id);
      if (i < 0) continue;
      const [rm] = nt[from].roster.splice(i, 1);
      nt[to].roster.push({ ...tradeAway(rm, nt[from], ctx), onBlock: false, ...extra });
    }
  };
  move(a, b, aPlayers);
  move(b, a, bPlayers);
  const own = new Map([...aPicks.map((pk) => [pk.id, b]), ...bPicks.map((pk) => [pk.id, a])]);
  const np = (picks || []).map((pk) => (own.has(pk.id) ? { ...pk, owner: own.get(pk.id) } : pk));
  let fu = futures || [];
  for (const pk of aPicks.filter((x) => x.future)) fu = moveFuture(fu, pk, b);
  for (const pk of bPicks.filter((x) => x.future)) fu = moveFuture(fu, pk, a);
  return { teams: nt, picks: np, futures: fu };
}

// A three-club rotation (or any set of one-way legs): legs = [{ from, to, players }]. Every player
// must still be with his club. Returns { teams } or { error }.
export function executeLegs(teams, legs, ctx = {}) {
  for (const l of legs) if (!l.players.every((p) => (teams[l.from]?.roster || []).some((x) => x.id === p.id))) return { error: "Someone in this deal has moved. Pick again." };
  const touched = new Set(legs.flatMap((l) => [l.from, l.to]));
  const nt = teams.map((t, i) => (touched.has(i) ? { ...t, roster: [...t.roster] } : t));
  for (const l of legs) for (const p of l.players) {
    const i = nt[l.from].roster.findIndex((x) => x.id === p.id);
    const [pl] = nt[l.from].roster.splice(i, 1);
    nt[l.to].roster.push({ ...tradeAway(pl, nt[l.from], ctx), onBlock: false });
  }
  return { teams: nt };
}
