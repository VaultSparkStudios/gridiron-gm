// The record book: the NFL's single-season records, and any your league breaks. Records count
// regular-season games only (playoff stats live elsewhere). Each week the book is checked; a
// player who passes a record takes it (and keeps raising it as his season goes on), and Record
// Watch writes a story about anyone on pace to break one.

export const RECORD_DEFS = [
  { key: "passYds", label: "Passing yards", pos: ["QB"], nfl: { val: 5477, name: "Peyton Manning", team: "DEN", yr: 2013 } },
  { key: "passTD", label: "Passing touchdowns", pos: ["QB"], nfl: { val: 55, name: "Peyton Manning", team: "DEN", yr: 2013 } },
  { key: "rushYds", label: "Rushing yards", pos: ["RB", "QB", "WR"], nfl: { val: 2105, name: "Eric Dickerson", team: "LAR", yr: 1984 } },
  { key: "rushTD", label: "Rushing touchdowns", pos: ["RB", "QB"], nfl: { val: 28, name: "LaDainian Tomlinson", team: "LAC", yr: 2006 } },
  { key: "rec", label: "Receptions", pos: ["WR", "TE", "RB"], nfl: { val: 149, name: "Michael Thomas", team: "NO", yr: 2019 } },
  { key: "recYds", label: "Receiving yards", pos: ["WR", "TE", "RB"], nfl: { val: 1964, name: "Calvin Johnson", team: "DET", yr: 2012 } },
  { key: "recTD", label: "Receiving touchdowns", pos: ["WR", "TE", "RB"], nfl: { val: 23, name: "Randy Moss", team: "NE", yr: 2007 } },
  { key: "sacks", label: "Sacks", pos: ["DL", "LB", "CB", "S"], nfl: { val: 22.5, name: "Michael Strahan & T.J. Watt", team: "NYG/PIT", yr: "2001, 2021" } },
  { key: "ints", label: "Interceptions", pos: ["CB", "S", "LB", "DL"], nfl: { val: 14, name: "Night Train Lane", team: "LAR", yr: 1952 } },
];
export const GAMES = 17;

// A fresh book: the NFL's marks.
export function newRecordBook() {
  const best = {};
  for (const d of RECORD_DEFS) best[d.key] = { ...d.nfl, nfl: true };
  return { best, history: [] };
}

// Saves from before the record book (or missing a stat added later) get the NFL marks.
export function loadRecordBook(book) {
  const fresh = newRecordBook();
  if (!book?.best) return fresh;
  return { best: { ...fresh.best, ...book.best }, history: book.history || [] };
}

// Sacks come in halves (a shared sack); every other stat is a whole number.
const fmt = (k, v) => (k === "sacks" ? String(Math.round(+v * 2) / 2) : Math.round(v).toLocaleString("en-US"));
export const recordValue = fmt;

// After a week (or the season): who now holds each record. teams: every club; yr: the season.
// Returns { book, broken: [{ key, label, name, team, val, prev }] } with only records newly
// taken this time (a player adding to his own record isn't news again).
export function updateRecords(book, teams, yr) {
  const best = { ...book.best };
  const history = [...book.history];
  const broken = [];
  for (const d of RECORD_DEFS) {
    let top = null;
    teams.forEach((t) => (t.roster || []).forEach((p) => {
      const v = p.ss?.[d.key] || 0;
      if (v > 0 && (!top || v > top.v)) top = { p, t, v };
    }));
    const cur = best[d.key];
    if (!top || top.v <= cur.val) continue;
    const same = cur.pid === top.p.id && cur.yr === yr;
    best[d.key] = { val: top.v, name: top.p.name, pid: top.p.id, pos: top.p.pos, team: top.t.ab, yr };
    if (!same) {
      const prev = cur.prev && cur.yr === yr && !cur.nfl ? cur.prev : { val: cur.val, name: cur.name, team: cur.team, yr: cur.yr };
      best[d.key].prev = prev;
      const e = { key: d.key, label: d.label, name: top.p.name, pid: top.p.id, team: top.t.ab, val: top.v, yr, prev };
      broken.push(e);
      history.push(e);
    } else best[d.key].prev = cur.prev;
  }
  return { book: { best, history }, broken };
}

// Record Watch: players on pace to break a record. gamesPlayed: the team's games so far.
// Returns [{ key, label, name, pid, team, ti, val, pace, record }], closest first.
export function recordWatch(book, teams, { minGames = 5, margin = 0.95 } = {}) {
  const out = [];
  for (const d of RECORD_DEFS) {
    const rec = book.best[d.key];
    teams.forEach((t, ti) => {
      const g = (t.w || 0) + (t.l || 0) + (t.t || 0);
      if (g < minGames || g >= GAMES) return;
      for (const p of t.roster || []) {
        const v = p.ss?.[d.key] || 0;
        if (!v) continue;
        const pace = (v / g) * GAMES;
        if (pace >= rec.val * margin && v < rec.val) out.push({ key: d.key, label: d.label, name: p.name, pid: p.id, team: t.ab, ti, val: v, pace, record: rec });
      }
    });
  }
  return out.sort((a, b) => b.pace / b.record.val - a.pace / a.record.val);
}

// Top-story items for the home screen: records broken this week, then the closest chases.
export function recordStories({ broken = [], watch = [], teams, yr, wk }) {
  const teamIdx = (ab) => teams.findIndex((t) => t.ab === ab);
  const s = [];
  for (const b of broken) {
    s.push({ id: `rec-${yr}-${wk}-${b.key}`, kind: "record", team: teamIdx(b.team), head: `🏆 NEW RECORD: ${b.name} sets the single-season ${b.label.toLowerCase()} mark`,
      text: `${b.name} (${b.team}) now has ${fmt(b.key, b.val)} ${b.label.toLowerCase()}, passing ${b.prev.name}'s ${fmt(b.key, b.prev.val)} from ${b.prev.yr}${wk && wk < GAMES + 1 ? `, and there's still football left` : ""}.` });
  }
  for (const w of watch.slice(0, 2)) {
    s.push({ id: `pace-${yr}-${wk}-${w.key}-${w.pid}`, kind: "pace", team: w.ti, head: `📈 Record watch: ${w.name} on pace for ${fmt(w.key, w.pace)} ${w.label.toLowerCase()}`,
      text: `${w.name} (${w.team}) has ${fmt(w.key, w.val)} so far. The record is ${fmt(w.key, w.record.val)}, set by ${w.record.name} in ${w.record.yr}.` });
  }
  return s;
}
