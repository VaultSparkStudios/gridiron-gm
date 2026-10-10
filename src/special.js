// Special teams: who returns kicks and punts, and how good he is at it.
//
// Return rating: real players carry their Madden Kick Return rating (KaVontae Turpin 95, Marcus
// Jones 94...); real players Madden never used as returners are rated low. Everyone else (draft
// classes) is rated from his speed, acceleration and agility plus a knack for it that's his own,
// so a late-round receiver who can't run routes can still be a weapon on returns.
import SPECIAL from "./data/special.json" with { type: "json" };
import M27 from "./data/madden27.json" with { type: "json" };

export const RET_POS = ["WR", "RB", "CB", "S"];
export const RET_ROLES = ["KR", "PR"];
const REAL_KR = SPECIAL.kr || {};
const REAL = new Set([...(M27.teams || []).flatMap((t) => [...(t.roster || []), ...(t.ps || [])]), ...(M27.fa || [])].map((d) => `${d.name}|${d.pos}`));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A fixed bell-curve number per player (his knack for returning).
function knack(id) {
  let h = 2166136261;
  for (const c of `${id}|ret`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const u1 = ((h >>> 0) % 10007 + 1) / 10008, u2 = ((Math.imul(h, 2654435761) >>> 0) % 10007 + 1) / 10008;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function retRating(p) {
  if (!p) return 0;
  if (p.kr != null) return p.kr;
  for (const pos of [p.pos, p.posFrom?.pos].filter(Boolean)) {
    const key = `${p.name}|${pos}`;
    if (REAL_KR[key] != null) return REAL_KR[key];
    if (REAL.has(key)) return RET_POS.includes(pos) ? 35 : 15;
  }
  if (!RET_POS.includes(p.pos)) return 15;
  const base = 0.3 * (p.spd ?? 85) + 0.87 * (p.acc ?? 85) + 0.65 * (p.agi ?? 82) - 94;
  return Math.round(clamp(base + knack(p.id) * 12, 20, 95));
}

// Who returns: your choice first, then the best returners. Stars and starters are spared a bit
// (teams don't like exposing them), which is what gives a fast backup his job.
export function returnerOrder(roster, depthOrder, role) {
  const pool = roster.filter((p) => RET_POS.includes(p.pos));
  const chosen = ((depthOrder || {})[role] || []).map((id) => pool.find((p) => p.id === id)).filter(Boolean);
  const score = (p) => retRating(p) + (role === "PR" ? ((p.agi ?? 82) - 85) * 0.15 : 0) - (p.ovr >= 85 ? 6 : 0) - (p.dk === 0 ? 3 : 0);
  return [...chosen, ...pool.filter((p) => !chosen.includes(p)).sort((a, b) => score(b) - score(a))];
}
