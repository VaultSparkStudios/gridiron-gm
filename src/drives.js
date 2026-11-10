// The play-by-play grouped into drives, for the live game's drive tracker (LiveDrives.jsx).
const SNAP = new Set(["run", "pass", "inc", "sack", "int", "fumble", "td", "fg", "fg_miss", "punt", "safety", "penalty", "kneel", "spike"]);
const RESULT = { td: ["Touchdown", "#22c55e"], fg: ["Field goal", "#eab308"], fg_miss: ["Missed FG", "#f97316"], punt: ["Punt", "#94a3b8"], int: ["Interception", "#ef4444"], fumble: ["Fumble", "#ef4444"], safety: ["Safety", "#ef4444"] };
const secs = (e) => (e.qtr === "OT" ? 5 : +e.qtr || 1) * 900 - (e.clock ?? 0);

// log entries: { qtr, clock, text, type, poss, yards? }. A drive is a run of snaps by one side.
export function drivesOf(log) {
  const out = [];
  let cur = null;
  for (const e of log || []) {
    if (!SNAP.has(e.type)) { if (e.type === "kickoff" || e.type === "pat") cur = null; continue; }
    if (!cur || cur.poss !== e.poss || cur.over) { cur = { poss: e.poss, plays: [], yds: 0, t0: secs(e), t1: secs(e), qtr: e.qtr }; out.push(cur); }
    cur.plays.push(e);
    if (["run", "pass", "sack", "td"].includes(e.type) && Number.isFinite(e.yards)) cur.yds += e.yards;
    cur.t1 = secs(e);
    const r = RESULT[e.type];
    if (r) { cur.result = r; cur.over = true; }
  }
  // a drive that ended without a kick, a score or a turnover changed hands on downs (or ran out the half)
  // a finished drive's time runs until the next one starts (the clock kept moving after its last snap)
  out.forEach((d, i) => { if (i < out.length - 1 && out[i + 1].t0 > d.t1) d.t1 = out[i + 1].t0; });
  out.forEach((d, i) => { if (!d.result && i < out.length - 1) d.result = d.qtr === out[i + 1].qtr || d.qtr === 2 ? ["Downs", "#f97316"] : ["End of half", "#94a3b8"]; });
  return out;
}
