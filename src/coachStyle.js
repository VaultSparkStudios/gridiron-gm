// A head coach's 4th-down and two-point style: 0.6 (by the book) to 1.45 (goes for it). Coaches
// known for it get their real reputation; everyone else gets a fixed style from his name, so the
// same coach always calls the game the same way.
const KNOWN = {
  "Dan Campbell": 1.45, "Ben Johnson": 1.35, "Nick Sirianni": 1.35, "John Harbaugh": 1.3,
  "Kevin O'Connell": 1.2, "Sean McVay": 1.15, "Andy Reid": 1.1, "Brian Daboll": 1.15,
  "Mike McDaniel": 1.2, "Jim Harbaugh": 1.05, "Sean Payton": 0.95, "Kyle Shanahan": 0.85,
  "Mike Tomlin": 0.8, "Zac Taylor": 1.0, "Kevin Stefanski": 1.05, "Dave Canales": 1.1,
};
const hash = (s) => { let h = 2166136261; for (const c of String(s || "")) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

export function coachAggression(hc) {
  if (!hc) return 1;
  if (typeof hc.agg === "number") return hc.agg;
  if (KNOWN[hc.name] != null) return KNOWN[hc.name];
  return Math.round((0.75 + hash(hc.name) * 0.55) * 100) / 100; // 0.75 .. 1.30
}
export const styleLabel = (a) => (a >= 1.25 ? "Aggressive" : a >= 1.08 ? "Leans aggressive" : a > 0.92 ? "Balanced" : a > 0.8 ? "Leans conservative" : "Conservative");
