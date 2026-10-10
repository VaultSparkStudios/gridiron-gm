// All-Pro and Pro Bowl teams, picked at the end of each regular season from what players did
// (season stats) and how good they are (rating), position by position like the real ballots.
// Making a team is worth a little OVR in the off-season and counts toward a player's legacy.
import { naturalDL } from "./dline.js";

// Spots on the All-Pro team (each of the first and second teams) and on each conference's Pro Bowl roster.
export const SLOTS = [
  { key: "QB", label: "QB", all: 1, pb: 3, of: (p) => p.pos === "QB" },
  { key: "RB", label: "RB", all: 1, pb: 3, of: (p) => p.pos === "RB" },
  { key: "WR", label: "WR", all: 3, pb: 4, of: (p) => p.pos === "WR" },
  { key: "TE", label: "TE", all: 1, pb: 2, of: (p) => p.pos === "TE" },
  { key: "T", label: "T", all: 2, pb: 3, of: (p) => p.pos === "LT" || p.pos === "RT" },
  { key: "G", label: "G", all: 2, pb: 3, of: (p) => p.pos === "LG" || p.pos === "RG" },
  { key: "C", label: "C", all: 1, pb: 2, of: (p) => p.pos === "C" },
  { key: "EDGE", label: "EDGE", all: 2, pb: 3, of: (p) => p.pos === "DL" && naturalDL(p) === "EDGE" },
  { key: "DT", label: "DT", all: 2, pb: 3, of: (p) => p.pos === "DL" && naturalDL(p) === "DT" },
  { key: "LB", label: "LB", all: 3, pb: 4, of: (p) => p.pos === "LB" },
  { key: "CB", label: "CB", all: 2, pb: 4, of: (p) => p.pos === "CB" },
  { key: "S", label: "S", all: 2, pb: 3, of: (p) => p.pos === "S" },
  { key: "K", label: "K", all: 1, pb: 1, of: (p) => p.pos === "K" },
  { key: "P", label: "P", all: 1, pb: 1, of: (p) => p.pos === "P" },
];

// OVR the next off-season for making each team (the best honor counts, not all of them).
export const HONOR_BOOST = { ap1: 2, ap2: 1, pb: 1 };
// The boost tapers for players already near the top (95+ gain nothing; 92-94 at most +1).
export const honorBoost = (k, ovr) => (ovr >= 95 ? 0 : ovr >= 92 ? Math.min(1, HONOR_BOOST[k]) : HONOR_BOOST[k]);
export const HONOR_LABEL = { ap1: "First-team All-Pro", ap2: "Second-team All-Pro", pb: "Pro Bowl" };

const s = (p, k) => p.ss?.[k] || 0;
// What a player did this season, on a scale where a great season is about 100.
export function production(p) {
  switch (p.pos) {
    case "QB": return s(p, "passYds") / 50 + s(p, "passTD") * 1.6 - s(p, "passInt") * 2 + s(p, "rushYds") / 25;
    case "RB": return s(p, "rushYds") / 15 + s(p, "rushTD") * 3 + s(p, "recYds") / 25;
    case "WR": case "TE": return s(p, "recYds") / 15 + s(p, "recTD") * 3 + s(p, "rec") / 4;
    case "DL": case "LB": return s(p, "sacks") * 5 + s(p, "tkl") / 3 + s(p, "tfl") * 1.5 + s(p, "ff") * 3 + s(p, "ints") * 4;
    case "CB": case "S": return s(p, "ints") * 9 + s(p, "pd") * 2.5 + s(p, "tkl") / 3;
    case "K": return s(p, "fgM") * 2.5 - (s(p, "fgA") - s(p, "fgM")) * 3;
    case "P": return s(p, "punts") ? (s(p, "puntYds") / s(p, "punts")) * 1.5 + s(p, "in20") : 0;
    default: return 0; // offensive linemen: no stats, judged on their play (rating)
  }
}
const OL = new Set(["LT", "LG", "C", "RG", "RT"]);
// Ballot score: production and rating, each as a spread above or below the position's field.
function ballot(field) {
  const z = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1; return (x) => (x - m) / sd; };
  const zo = z(field.map((x) => x.p.ovr || 0)), zp = z(field.map((x) => production(x.p)));
  return field.map((x) => ({ ...x, score: OL.has(x.p.pos) ? zo(x.p.ovr) + (x.team.w || 0) * 0.04 : zp(production(x.p)) * 0.65 + zo(x.p.ovr) * 0.35 }));
}

// teams: the league at the end of the regular season. Returns { ap1, ap2, pb: { AFC, NFC } },
// each a list of { pid, name, pos, slot, ti, team }.
export function seasonHonors(teams) {
  const entry = (x, slot) => ({ pid: x.p.id, name: x.p.name, pos: x.p.pos, slot, ti: x.ti, team: x.team.ab });
  const out = { ap1: [], ap2: [], pb: { AFC: [], NFC: [] } };
  for (const sl of SLOTS) {
    const field = [];
    teams.forEach((t, ti) => (t.roster || []).forEach((p) => { if (sl.of(p) && s(p, "gp") >= 10) field.push({ p, ti, team: t }); }));
    if (!field.length) continue;
    const ranked = ballot(field).sort((a, b) => b.score - a.score);
    ranked.slice(0, sl.all).forEach((x) => out.ap1.push(entry(x, sl.key)));
    ranked.slice(sl.all, sl.all * 2).forEach((x) => out.ap2.push(entry(x, sl.key)));
    for (const conf of ["AFC", "NFC"]) ranked.filter((x) => x.team.c === conf).slice(0, sl.pb).forEach((x) => out.pb[conf].push(entry(x, sl.key)));
  }
  return out;
}

// The best honor each player earned: id -> "ap1" | "ap2" | "pb".
export function honorsById(h) {
  const out = {};
  if (!h) return out;
  for (const e of [...(h.pb?.AFC || []), ...(h.pb?.NFC || [])]) out[e.pid] = "pb";
  for (const e of h.ap2 || []) out[e.pid] = "ap2";
  for (const e of h.ap1 || []) out[e.pid] = "ap1";
  return out;
}

// How a player's season compares with his rating: where his production ranks among players at
// his spot, against where his OVR ranks. Stamped at the end of the regular season as p.perf =
// { yr, f }: f above 1 means he outplayed his rating (a big contract year), below 1 a down year.
// Offensive linemen have no stats, so they're judged on their rating alone (f = 1).
export function stampPerformance(teams, yr) {
  for (const sl of SLOTS) {
    const field = [];
    teams.forEach((t) => (t.roster || []).forEach((p) => { if (sl.of(p) && s(p, "gp") >= 8) field.push(p); }));
    if (field.length < 4) continue;
    const pct = (key) => { const sorted = [...field].sort((a, b) => key(a) - key(b)); return (p) => sorted.indexOf(p) / (sorted.length - 1); };
    const prod = pct(production), rate = pct((p) => p.ovr || 0);
    for (const p of field) {
      const f = OL.has(p.pos) ? 1 : Math.max(0.72, Math.min(1.22, 1 + (prod(p) - rate(p)) * 0.5));
      p.perf = { yr, f: Math.round(f * 100) / 100 };
    }
  }
}
