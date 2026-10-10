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
    const p = roster.find((x) => x.id === focus?.[side]);
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
export const yearsPastPrime = (p, age = p.age) => age - primeEnd(p);

export function seasonGrowth(p, share, rand = Math.random) {
  const ovr = p.ovr, pot = p.pot ?? ovr;
  const end = primeEnd(p);
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
    if (share >= 0.75 && rand() < 0.35) g += 1;
    if (share < 0.1 && rand() < 0.35) g -= 1;
    // The last few points come hard: an elite player in his prime rarely climbs further.
    if (g > 0 && ovr >= 93) g = rand() < (ovr >= 96 ? 0.15 : 0.35) ? 1 : 0;
    return g;
  }
  // Past his prime: the decline speeds up the further past it he is.
  const over = p.age - end;
  return -ri(rand, over >= 3 ? 2 : 1, over >= 4 ? 5 : over >= 2 ? 4 : 3);
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
// once a player is past the age where traits matter).
export const LEADERS = [
  { key: "passYds", label: "passing yards" }, { key: "passTD", label: "TD passes" },
  { key: "rushYds", label: "rushing yards" }, { key: "rushTD", label: "rushing TDs" },
  { key: "recYds", label: "receiving yards" }, { key: "rec", label: "receptions" }, { key: "recTD", label: "TD catches" },
  { key: "sacks", label: "sacks" }, { key: "ints", label: "interceptions" }, { key: "tkl", label: "tackles" },
];
const NEXT_TRAIT = { late: "star", normal: "star", star: "superstar" };

// Who earned what this season across the league: id -> { hits: [labels], leads: [labels] }.
export function seasonAwards(teams) {
  const all = teams.flatMap((t) => t.roster || []);
  const out = {};
  const get = (p) => (out[p.id] ||= { hits: [], leads: [] });
  for (const m of MILESTONES) for (const p of all) if (m.pos.includes(p.pos) && (p.ss?.[m.key] || 0) >= m.at) get(p).hits.push(m.label);
  for (const l of LEADERS) {
    let best = null;
    for (const p of all) if ((p.ss?.[l.key] || 0) > (best?.ss?.[l.key] || 0)) best = p;
    if (best) get(best).leads.push(`led the NFL in ${l.label} (${best.ss[l.key]})`);
  }
  return out;
}

// What a player's season earns him. devTrait: his trait now (devOf). Returns { ovr, dev, notes }.
export function awardGrowth(p, award, devTrait) {
  if (!award) return { ovr: 0, dev: null, notes: [] };
  let ovr = Math.min(2, award.hits.length), dev = null;
  const notes = [...award.hits];
  if (award.leads.length) {
    notes.push(...award.leads);
    if (p.age <= 26 && NEXT_TRAIT[devTrait]) dev = NEXT_TRAIT[devTrait];
    else ovr += 1;
  }
  return { ovr, dev, notes };
}

// Off-season taper at the top: any rise into the 90s has to be earned point by point (60% a
// point into the low 90s and up to 96, a bit less after), so 90+, 95+ and 99 stay about as rare as today.
export function eliteTaper(before, after, rand = Math.random) {
  if (after <= before || after <= 89) return after;
  let v = Math.max(before, 89);
  for (let x = v + 1; x <= after; x++) { if (rand() < (x >= 97 ? 0.45 : x >= 94 ? 0.6 : 0.6)) v = x; else break; }
  return Math.max(before, v);
}
