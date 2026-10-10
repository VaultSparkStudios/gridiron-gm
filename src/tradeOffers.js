// The trade calls AI clubs make to you during the season. A club only calls about a player who
// fits where it is: a rebuilding club wants youth, not a 32-year-old, and an aging quarterback
// only interests a winning club looking for a cheap backup. It never pays more than the player
// is worth (a first-round pick is not on the table for a backup).

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
export const MAX_OVERPAY = 1.15; // the most an offer can be worth, as a multiple of your player
const MIN_FAIR = 0.75; // and the least

// Where a club is: "rebuild" (losing, or built that way and not winning), "contend" (winning),
// or "middle".
export function clubMode(t) {
  const g = (t.w || 0) + (t.l || 0);
  if (g >= 3 && (t.w || 0) / g < 0.4) return "rebuild";
  if (t.gmStyle === "rebuilder" && (t.w || 0) <= (t.l || 0)) return "rebuild";
  if (g >= 3 && (t.w || 0) > (t.l || 0)) return "contend";
  return "middle";
}

// Would this club trade for him at all?
export function wantsPlayer(t, p) {
  const mode = clubMode(t);
  const old = p.pos === "QB" ? 31 : p.pos === "K" || p.pos === "P" ? 34 : 29;
  if (mode === "rebuild") return p.age <= (p.pos === "QB" ? 27 : 26);
  // A veteran quarterback is a contender's backup plan; nobody else calls about one.
  if (p.pos === "QB" && p.age >= old) return mode === "contend";
  return p.age <= old + 2;
}

// Picks (best first) adding up to between MIN_FAIR and MAX_OVERPAY of the target value: one pick
// if one fits, else two. Returns null when nothing fits.
export function fairPicks(pks, value, pkV) {
  const lo = value * MIN_FAIR, hi = value * MAX_OVERPAY;
  const ok = (v) => v >= lo && v <= hi;
  const one = pks.filter((pk) => ok(pkV(pk))).sort((a, b) => Math.abs(pkV(a) - value) - Math.abs(pkV(b) - value))[0];
  if (one) return [one];
  let best = null;
  for (let i = 0; i < pks.length; i++) for (let j = i + 1; j < pks.length; j++) {
    const v = pkV(pks[i]) + pkV(pks[j]);
    if (ok(v) && (!best || Math.abs(v - value) < best.d)) best = { d: Math.abs(v - value), pks: [pks[i], pks[j]] };
  }
  return best ? best.pks : null;
}

// One club's call about one of your players, or null. rand: () => [0, 1).
// What one club would offer for one of your players: an even player swap, a player plus a pick or
// two, or picks alone, worth MIN_FAIR to MAX_OVERPAY of him. null if it can't build a fair one.
function buildOffer(teams, fromTm, want, picks, pkV, rand) {
  const aiT = teams[fromTm], wv = want.tradeVal || 0, wPos = want.pos;
  const aiPks = (picks || []).filter((pk) => pk.owner === fromTm);
  const roll = rand();
  if (roll < 0.35) {
    const give = aiT.roster.filter((p) => p.tradeVal >= wv * MIN_FAIR && p.tradeVal <= wv * MAX_OVERPAY && p.pos !== wPos).sort((a, b) => Math.abs(a.tradeVal - wv) - Math.abs(b.tradeVal - wv))[0];
    if (give) return { fromTm, give, want, givePicks: [], wantPicks: [] };
  }
  if (roll < 0.75) {
    const give = aiT.roster.filter((p) => p.tradeVal >= wv * 0.35 && p.tradeVal < wv * 0.85 && p.pos !== wPos).sort((a, b) => b.tradeVal - a.tradeVal)[0];
    if (give) {
      const gap = wv - give.tradeVal;
      const pks = fairPicks(aiPks, gap, pkV);
      if (pks) return { fromTm, give, want, givePicks: pks, wantPicks: [] };
    }
  }
  const pks = fairPicks(aiPks, wv, pkV);
  return pks ? { fromTm, give: null, want, givePicks: pks, wantPicks: [] } : null;
}

// One club's call about one of your players, or null. Players you've put on the trade block draw
// most of the calls (from clubs thin at his position or chasing a title); otherwise a club asks
// about depth you can spare. rand: () => [0, 1).
export function genTradeOffer(teams, ui, picks, pkV, rand = Math.random) {
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const usT = teams[ui];
  const block = (usT?.roster || []).filter((p) => p.onBlock && !p.ftag && !p.injured);
  if (block.length && rand() < 0.8) {
    const want = block[ri(0, block.length - 1)];
    const fits = teams.map((t, i) => i).filter((i) => i !== ui && wantsPlayer(teams[i], want)).filter((i) => {
      const best = Math.max(0, ...teams[i].roster.filter((p) => p.pos === want.pos).map((p) => p.ovr));
      return best < want.ovr || clubMode(teams[i]) === "contend";
    });
    for (let k = fits.length - 1; k > 0; k--) { const j = ri(0, k); [fits[k], fits[j]] = [fits[j], fits[k]]; }
    for (const fromTm of fits.slice(0, 6)) { const o = buildOffer(teams, fromTm, want, picks, pkV, rand); if (o) return o; }
  }
  const aiIdxs = teams.map((_, i) => i).filter((i) => i !== ui);
  const fromTm = aiIdxs[ri(0, aiIdxs.length - 1)];
  const aiT = teams[fromTm];
  const needs = POS.filter((pos) => aiT.roster.filter((p) => p.pos === pos && p.ovr >= 65).length < 2 && usT.roster.filter((p) => p.pos === pos && p.ovr >= 70).length >= 3);
  if (!needs.length) return null;
  const wPos = needs[ri(0, needs.length - 1)];
  const want = usT.roster.filter((p) => p.pos === wPos && p.ovr >= 70 && !p.ftag && wantsPlayer(aiT, p)).sort((a, b) => a.tradeVal - b.tradeVal)[0];
  return want ? buildOffer(teams, fromTm, want, picks, pkV, rand) : null;
}
