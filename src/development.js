// Development focus: one player on each side of the ball gets extra coaching every week.
// Young players with high development traits gain the most.
import { devOf } from "./scouting.js";

export const OFFENSE = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT"];
export const DEFENSE = ["DL", "LB", "CB", "S"];
const DEV_MULT = { generational: 2.2, superstar: 1.7, star: 1.3, normal: 1 };

// Chance each week that a focused player gains a point of OVR.
export function focusChance(p) {
  const d = devOf(p);
  const dev = d === "late" ? (p.age >= 23 ? 1.3 : 0.8) : DEV_MULT[d] || 1;
  const age = p.age <= 23 ? 1.3 : p.age <= 26 ? 1 : p.age <= 29 ? 0.6 : 0.25;
  const ceiling = p.ovr >= 97 ? 0.3 : p.ovr >= 93 ? 0.6 : 1; // the last few points come hard
  return Math.min(0.6, 0.1 * dev * age * ceiling);
}
// Expected OVR gained over a regular season (17 games).
export const perSeason = (p) => Math.round(focusChance(p) * 17 * 10) / 10;

// One week in the lab for each focused player on the roster. Mutates players; returns gains.
export function runFocusWeeks(roster, focus, weeks) {
  const out = [];
  for (const side of ["off", "def"]) {
    const p = roster.find((x) => focus?.[side] != null && String(x.id) === String(focus[side]));
    if (!p) continue;
    let g = 0;
    for (let w = 0; w < weeks; w++) {
      if (p.ovr >= 99 || p.injured) break;
      if (Math.random() < focusChance(p)) {
        p.ovr += 1;
        p.trueOvr = p.ovr;
        if (p.pot < p.ovr) p.pot = p.truePot = p.ovr;
        g++;
      }
    }
    if (g) {
      p.labGains = (p.labGains || 0) + g;
      out.push({ p, g });
    }
  }
  return out;
}

// ---------- Playing time and milestones ----------

// Share of his team's snaps a player took this season, 0-1 (applyGame adds each game's % to ss.snp).
export const seasonSnapShare = (p, games = 17) => Math.min(1, (p.ss?.snp || 0) / (games * 100));

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));

// The off-season OVR change from age and playing time. Young players who start grow far faster
// than the same player on the bench (about 1.4x the growth at a full share, 0.4x with no snaps);
// a prime-age starter can still tick up, and a veteran who sat gets a little rusty.
// The last age of a player's prime, by position: running backs wear down first, then receivers,
// corners and linebackers around 30; linemen and tight ends last longer, quarterbacks into their
// mid-30s and kickers longest.
export const PRIME_END = { RB: 27, WR: 29, CB: 29, LB: 29, S: 30, DL: 30, TE: 30, LT: 32, LG: 32, C: 32, RG: 32, RT: 32, QB: 34, K: 36, P: 36 };
export const primeEnd = (p) => PRIME_END[p.pos] ?? 30;
// Years past his prime (negative while he's in or before it).
export const yearsPastPrime = (p, age = p.age) => age - agingEnd(p);

// Development traits and aging. The great ones last: a generational talent (a Brady, an Aaron
// Donald, a Randy Moss) keeps his prime three years longer and declines at half the usual pace;
// a superstar two years longer, at 85%. A Star develops fast but ages like everyone else.
export const PRIME_BONUS = { generational: 3, superstar: 2 };
const DECLINE_PACE = { generational: 0.5, superstar: 0.85 };
export const agingEnd = (p, trait = devOf(p)) => primeEnd(p) + (PRIME_BONUS[trait] || 0);
// The wall: from 33 on, most players' bodies give out and the explosiveness goes. Quarterbacks,
// kickers and punters, high-quality offensive linemen and generational talents escape it; a
// superstar meets a softer one a year later.
export const WALL_AGE = 33;
const OL = new Set(["LT", "LG", "C", "RG", "RT"]);
const exempt = (p) => p.pos === "QB" || p.pos === "K" || p.pos === "P" || (OL.has(p.pos) && (p.ovr || 0) >= 85);
export const hitsTheWall = (p, trait = devOf(p)) => !exempt(p) && trait !== "generational" && trait !== "superstar";
// the wall's toll this off-season (age: the season just played)
export function wallToll(p, trait = devOf(p), rand = Math.random) {
  const next = p.age + 1;
  if (hitsTheWall(p, trait) && next >= WALL_AGE) return ri(rand, 2, 4);
  if (trait === "superstar" && !exempt(p) && next >= WALL_AGE + 1) return ri(rand, 1, 2);
  return 0;
}

export function seasonGrowth(p, share, rand = Math.random) {
  const g = baseGrowth(p, share, rand);
  const toll = wallToll(p, devOf(p), rand);
  return toll ? Math.min(g, 0) - toll : g;
}
function baseGrowth(p, share, rand) {
  // his real ceiling drives growth, whatever the club believes it is (see scoutMiss.js)
  const ovr = p.ovr, pot = p.truePot ?? p.pot ?? ovr;
  const trait = devOf(p), end = agingEnd(p, trait);
  if (p.age < Math.min(27, end - 2)) {
    let g = ri(rand, -1, Math.round((pot - ovr) / 4) + 2);
    if (g > 0) g = Math.round(g * (0.4 + share));
    if (share >= 0.75 && ovr < pot && rand() < 0.5) g += 1;
    if (share < 0.1 && rand() < 0.3) g -= 1;
    // At his ceiling he only creeps past it now and then (development traits and awards are the
    // real way through).
    if (ovr >= pot && g > 0) g = rand() < 0.25 ? 1 : 0;
    return g;
  }
  if (p.age <= end) {
    let g = ri(rand, -2, 2);
    // a starter still short of his ceiling keeps improving; one at it holds steady
    if (share >= 0.75 && ovr < pot && rand() < 0.35) g += 1;
    if (share < 0.1 && rand() < 0.35) g -= 1;
    if (g > 0 && ovr >= pot && rand() < 0.5) g -= 1;
    // The last few points come hard: an elite player in his prime rarely climbs further.
    if (g > 0 && ovr >= 93) g = rand() < (ovr >= 96 ? 0.15 : 0.35) ? 1 : 0;
    return g;
  }
  // Past his prime: the decline speeds up the further past it he is.
  const over = p.age - end;
  const g = -ri(rand, over >= 3 ? 2 : 1, over >= 4 ? 5 : over >= 2 ? 4 : 3);
  return DECLINE_PACE[trait] ? Math.round(g * DECLINE_PACE[trait]) : g;
}

// Development-trait growth, scaled by playing time (a generational talent still needs the field).
export const traitGrowthScale = (share) => 0.5 + share * 0.5;

// Big statistical seasons. Each one reached is worth +1 OVR (two at most).
export const MILESTONES = [
  { key: "passYds", pos: ["QB"], at: 4500, label: "4,500 passing yards" },
  { key: "passTD", pos: ["QB"], at: 35, label: "35 TD passes" },
  { key: "rushYds", pos: ["RB", "QB"], at: 1400, label: "1,400 rushing yards" },
  { key: "rushTD", pos: ["RB"], at: 14, label: "14 rushing TDs" },
  { key: "recYds", pos: ["WR"], at: 1400, label: "1,400 receiving yards" },
  { key: "recYds", pos: ["TE"], at: 1000, label: "1,000 receiving yards" },
  { key: "recTD", pos: ["WR", "TE"], at: 12, label: "12 TD catches" },
  { key: "sacks", pos: ["DL", "LB"], at: 10, label: "10 sacks" },
  { key: "tkl", pos: ["LB", "S"], at: 130, label: "130 tackles" },
  { key: "ints", pos: ["CB", "S", "LB"], at: 6, label: "6 interceptions" },
];
// League leaders. Leading the NFL in one of these earns a development-trait upgrade (or +1 OVR
// once a player is past the age where traits matter). gap: how far ahead of the next man a lead
// has to be (and at least a fifth more) to count as a landslide.
export const LEADERS = [
  { key: "passYds", label: "passing yards", gap: 450 }, { key: "passTD", label: "TD passes", gap: 6 },
  { key: "rushYds", label: "rushing yards", gap: 250 }, { key: "rushTD", label: "rushing TDs", gap: 4 },
  { key: "recYds", label: "receiving yards", gap: 250 }, { key: "rec", label: "receptions", gap: 18 }, { key: "recTD", label: "TD catches", gap: 4 },
  { key: "sacks", label: "sacks", gap: 4 }, { key: "ints", label: "interceptions", gap: 3 }, { key: "tkl", label: "tackles", gap: 25 },
];
const NEXT_TRAIT = { late: "star", normal: "star", star: "superstar" };
export const isLandslide = (l, best, next) => best - next >= l.gap && best >= next * 1.2;

// Who earned what this season across the league: id -> { hits: [labels], leads: [labels], landslides: [labels] }.
export function seasonAwards(teams) {
  const all = teams.flatMap((t) => t.roster || []);
  const out = {};
  const get = (p) => (out[p.id] ||= { hits: [], leads: [], landslides: [] });
  for (const m of MILESTONES) for (const p of all) if (m.pos.includes(p.pos) && (p.ss?.[m.key] || 0) >= m.at) get(p).hits.push(m.label);
  for (const l of LEADERS) {
    let best = null, next = 0;
    for (const p of all) {
      const v = p.ss?.[l.key] || 0;
      if (v > (best?.ss?.[l.key] || 0)) { if (best) next = best.ss[l.key]; best = p; } else if (v > next) next = v;
    }
    if (!best) continue;
    const v = best.ss[l.key];
    if (isLandslide(l, v, next)) get(best).landslides.push(`led the NFL in ${l.label} by a landslide (${v}, next best ${next})`);
    else get(best).leads.push(`led the NFL in ${l.label} (${v})`);
  }
  return out;
}

// What a player's season earns him. devTrait: his trait now (devOf). Returns { ovr, boost, pot,
// dev, notes }: ovr counts toward the usual taper at the top; boost (a landslide season) is added
// on top of it, since a season like that is earned; pot raises his ceiling.
// A landslide makes a cornerstone: +3 OVR, a higher ceiling and a better development trait for any
// player still short of 30 (a Superstar or better gets another point instead).
export function awardGrowth(p, award, devTrait) {
  if (!award) return { ovr: 0, boost: 0, pot: 0, dev: null, notes: [] };
  let ovr = Math.min(2, award.hits.length), boost = 0, pot = 0, dev = null;
  const notes = [...award.hits];
  const ls = award.landslides || [];
  if (ls.length) {
    notes.push(...ls, ...award.leads);
    boost = 3;
    pot = 4;
    if (p.age <= 29 && NEXT_TRAIT[devTrait]) dev = NEXT_TRAIT[devTrait];
    else boost += 1;
  } else if (award.leads.length) {
    notes.push(...award.leads);
    if (p.age <= 26 && NEXT_TRAIT[devTrait]) dev = NEXT_TRAIT[devTrait];
    else ovr += 1;
  }
  return { ovr, boost, pot, dev, notes };
}

// League drift: how many points a position's starters sit above (or below) the real 2026 league
// (shift from leagueShift in offseason.js). Ordinary growth leans against it, so the league keeps
// its shape over the seasons: above the baseline a point of growth is sometimes lost (or, with no
// growth, a point of rating), below it a
// starter-level player sometimes gains one. Earned boosts (honors, big seasons) are left alone.
export function driftCorrection(gain, shift, rand = Math.random) {
  if (!shift) return gain;
  if (shift > 0.2 && gain > 0) {
    const p = Math.min(0.8, 0.2 + shift * 0.35);
    let g = gain;
    for (let i = 0; i < gain; i++) if (rand() < p) g--;
    return g;
  }
  // a season without growth costs a point now and then, so the top doesn't fill up with veterans
  if (shift > 0.2 && rand() < Math.min(0.3, shift * 0.15)) return gain - 1;
  if (shift < -0.2 && gain >= 0 && rand() < Math.min(0.4, -shift * 0.12)) return gain + 1;
  return gain;
}

// The top end holds steady. The 2026 league has about 40 players at 95+; as its stars age out the
// tail used to thin (40 to under 30 in ten years) while the 90+ count held. When the league is short
// of 95s, young players near the top get an extra point now and then, more the thinner it is.
export const TOP_95 = 40;
// The same for the very top: the league starts with about eight 99s, and in long careers they thinned
// to three or four. When there are fewer than six, a young player at 96-98 gets the last step more often.
export const TOP_99 = 8;
export function topEndNudge(age, ovr, n95, rand = Math.random, n99 = TOP_99) {
  if (age > 29 || ovr < 88 || ovr >= 99) return ovr;
  const gap = (TOP_95 - n95) / TOP_95;
  if (gap > 0.05 && rand() < Math.min(0.5, gap * 1.6)) return ovr + 1;
  if (ovr >= 96 && n99 < 6 && rand() < (6 - n99) * 0.1) return ovr + 1;
  return ovr;
}

// Off-season taper at the top: any rise into the 90s has to be earned point by point (60% a
// point into the low 90s, 66% from 94 up). At 45% for the last three points the league's 99s aged
// out faster than new ones arrived (ten in year three, one or two by year ten), so the top end
// stays stocked at about the 2026 count instead.
// rising: a young player (27 or under) still short of his ceiling climbs from 93 up at 80% a point.
// Without it the league's young stars stalled in the low 90s and the 95+ club aged out (40 at the
// start, 27 twenty years on, only three of them 25 or under).
export function eliteTaper(before, after, rand = Math.random, rising = false) {
  if (after <= before || after <= 89) return after;
  let v = Math.max(before, 89);
  for (let x = v + 1; x <= after; x++) { if (rand() < (rising && x >= 93 ? 0.8 : x >= 94 ? 0.66 : 0.6)) v = x; else break; }
  return Math.max(before, v);
}

// ---------- The development plan (the Development screen) ----------

// Camp priority for the summer: the position room the coaching staff spends its extra time on.
// Everyone in that room gets about two-thirds of a point more growth next summer (or that much
// less decline). Balanced spreads the time evenly and gives no one extra.
export const CAMP_GROUPS = { QB: ["QB"], RB: ["RB"], WR: ["WR", "TE"], OL: ["LT", "LG", "C", "RG", "RT", "OL"], DL: ["DL", "EDGE", "DT", "LE", "RE"], LB: ["LB"], DB: ["CB", "S"] };
export const CAMP = { balanced: "Balanced", QB: "QB room", RB: "RB room", WR: "Receivers (WR and TE)", OL: "Offensive line", DL: "Defensive line", LB: "Linebackers", DB: "Defensive backs" };
export const inCamp = (pri, p) => !!CAMP_GROUPS[pri]?.includes(p.pos);
export function campBonus(pri, p, change, rand = Math.random) {
  return inCamp(pri, p) && rand() < 0.65 ? 1 : 0;
}

// How many of each position play every snap; the next man up rotates in.
const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
// His share of the snaps: this season's so far, or before the season his place on the depth chart.
export function projShare(p, roster, gamesPlayed = 0) {
  if (gamesPlayed > 0 && p.ss?.snp != null) return Math.min(1, p.ss.snp / (gamesPlayed * 100));
  const mates = roster.filter((x) => x.pos === p.pos && !x.injured).sort((a, b) => b.ovr - a.ovr);
  const i = mates.findIndex((x) => x.id === p.id), n = STARTERS[p.pos] ?? 1;
  return i < 0 ? 0 : i < n ? 0.9 : i < n + 1 ? 0.35 : 0.05;
}
export const roleOf = (share) => (share >= 0.6 ? "starter" : share >= 0.25 ? "rotation" : "backup");

// The expected OVR change next summer, averaged over many seeded rolls (so it doesn't jump about
// between visits): age, playing time and his ceiling, plus the camp priority and the weekly lab
// work for a focus player.
export function projGrowth(p, share, { camp = "balanced", focused = false, weeksLeft = 17 } = {}) {
  let s = 0x9e3779b9 ^ (Number(String(p.id).replace(/\D/g, "")) || 7);
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const N = 120;
  let tot = 0;
  for (let i = 0; i < N; i++) { const g = seasonGrowth(p, share, rand); tot += g + campBonus(camp, p, g, rand); }
  return Math.round((tot / N + (focused ? focusChance(p) * weeksLeft : 0)) * 10) / 10;
}
// Growing, at his peak, or on the way down.
export const trendOf = (g) => (g >= 0.8 ? "growing" : g <= -0.8 ? "declining" : "peak");
