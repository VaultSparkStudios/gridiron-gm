// Real NFL headshots: real players (the Madden 27 rosters and real free agents) carry their ESPN id
// on their face, and the portrait shows ESPN's photo instead of the drawn face. Generated players
// keep the drawn face, and so does anyone whose photo won't load (offline, or no photo).
import { ESPN_IDS } from "./data/headshots.js";
import { PROSPECT_PHOTOS } from "./data/collegeHeadshots.js";

const GROUP = { QB: "QB", RB: "RB", WR: "WR", TE: "TE", LT: "OL", LG: "OL", C: "OL", RG: "OL", RT: "OL", DL: "DL", LB: "LB", CB: "DB", S: "DB", K: "SPEC", P: "SPEC" };
const norm = (n) => String(n || "").toLowerCase().replace(/[.'’]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z]+/g, " ").trim();

export function espnIdOf(p) {
  if (!p || p.src !== "m27") return null;
  const n = norm(p.name);
  return ESPN_IDS[`${n}|${GROUP[p.pos]}`] ?? Object.entries(ESPN_IDS).find(([k]) => k.startsWith(`${n}|`))?.[1] ?? null;
}
// Stamps the photo id on a real player's face (once).
export function withHeadshot(p) {
  if (!p || p.face?.espn || p.src !== "m27") return p;
  const id = espnIdOf(p);
  if (id) p.face = { ...(p.face || {}), espn: id };
  return p;
}
// A real draft prospect's photo (his college one, or his NFL one once he's in the league), by
// name and draft class; kept on his face, so it follows him onto your roster.
export function prospectPhoto(p) {
  if (!p?.real || p.face?.espn) return p;
  const hit = PROSPECT_PHOTOS[`${norm(p.name)}|${p.draftYear ?? p.draftYr}`];
  if (hit) p.face = { ...(p.face || {}), espn: hit[0], ...(hit[1] === "c" ? { cfb: 1 } : {}) };
  return p;
}
const withPhoto = (p) => prospectPhoto(withHeadshot(p));
// Every player in a save: rosters, practice squads, IR, free agents, waivers, draft classes, retired players' cards.
export function headshotSave(d) {
  for (const t of d?.teams || []) for (const k of ["roster", "ps", "ir"]) (t[k] || []).forEach(withPhoto);
  for (const k of ["fa", "waivers"]) (d?.[k] || []).forEach(withPhoto);
  for (const cls of Object.values(d?.dc || {})) (cls || []).forEach(withPhoto);
  for (const r of d?.retired || []) if (r.card) withHeadshot(r.card);
  return d;
}
export const headshotUrl = (id, w = 160, college = false) => `https://a.espncdn.com/combiner/i?img=/i/headshots/${college ? "college-football" : "nfl"}/players/full/${id}.png&w=${w}&h=${Math.round(w * 0.725)}`;
