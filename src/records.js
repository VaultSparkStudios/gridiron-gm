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
// A club's players for the record book: the active roster and injured reserve (a player hurt in
// the game that set a record goes to IR before the week's check, and the record is still his).
export const everyone = (t) => [...(t?.roster || []), ...(t?.ir || [])];
import { FRANCHISE_RECORDS } from "./data/franchiseRecords.js";
import { posTag } from "./dline.js";

// Each club's real franchise records (club abbreviation -> stat -> { val, name, yr, real }).
const freshFranchise = () => Object.fromEntries(Object.entries(FRANCHISE_RECORDS).map(([ab, recs]) => [ab, Object.fromEntries(Object.entries(recs).map(([k, r]) => [k, { ...r, real: true }]))]));

// A fresh book: the NFL's marks, and every club's own.
export function newRecordBook() {
  const best = {};
  for (const d of RECORD_DEFS) best[d.key] = { ...d.nfl, nfl: true };
  return { best, history: [], franchise: freshFranchise(), fhistory: [], career: {} };
}

// Saves from before the record book (or missing a stat or the franchise records added later) get
// the real marks.
export function loadRecordBook(book) {
  const fresh = newRecordBook();
  if (!book?.best) return fresh;
  const franchise = { ...fresh.franchise };
  for (const [ab, recs] of Object.entries(book.franchise || {})) franchise[ab] = { ...franchise[ab], ...recs };
  return { best: { ...fresh.best, ...book.best }, history: book.history || [], franchise, fhistory: book.fhistory || [], cc: book.cc || {}, career: book.career || {} };
}

// After a week: each club's own records. A player passes his club's mark with the stats he's put up
// this season (his season totals, wherever he started it). Returns { book, broken } with
// broken: [{ fr: true, key, label, name, pid, team, ti, val, yr, prev }] for marks newly taken.
export function updateFranchiseRecords(book, teams, yr) {
  const franchise = { ...(book.franchise || freshFranchise()) };
  const fhistory = [...(book.fhistory || [])];
  const broken = [], tied = [];
  teams.forEach((t, ti) => {
    const recs = { ...(franchise[t.ab] || {}) };
    for (const d of RECORD_DEFS) {
      let top = null;
      for (const p of everyone(t)) { const v = p.ss?.[d.key] || 0; if (v > 0 && (!top || v > top.v)) top = { p, v }; }
      const cur = recs[d.key];
      // matching the mark: he shares it (once a season), and the book says so
      if (top && cur && top.v === cur.val && top.p.id !== cur.pid && !(cur.ties || []).some((x) => x.pid === top.p.id && x.yr === yr)) {
        const e = { fr: true, tie: true, key: d.key, label: d.label, name: top.p.name, pid: top.p.id, team: t.ab, ti, val: top.v, yr, prev: { val: cur.val, name: cur.name, yr: cur.yr } };
        recs[d.key] = { ...cur, ties: [...(cur.ties || []).filter((x) => x.yr !== yr || x.pid !== top.p.id), { name: top.p.name, pid: top.p.id, yr }] };
        tied.push(e); fhistory.push(e);
        continue;
      }
      if (!top || (cur && top.v <= cur.val)) continue;
      const same = cur && cur.pid === top.p.id && cur.yr === yr;
      const prev = same ? cur.prev : cur ? { val: cur.val, name: cur.name, yr: cur.yr } : null;
      recs[d.key] = { val: top.v, name: top.p.name, pid: top.p.id, yr, prev };
      if (!same) { const e = { fr: true, key: d.key, label: d.label, name: top.p.name, pid: top.p.id, team: t.ab, ti, val: top.v, yr, prev }; broken.push(e); fhistory.push(e); }
    }
    franchise[t.ab] = recs;
  });
  return { book: { ...book, franchise, fhistory }, broken, tied };
}

// Franchise Record Watch for one club: its players on pace for a club record.
export function franchiseWatch(book, team, { minGames = 4, margin = 0.97 } = {}) {
  const g = (team.w || 0) + (team.l || 0) + (team.t || 0);
  if (g < minGames || g >= GAMES) return [];
  const recs = book.franchise?.[team.ab] || {};
  const out = [];
  for (const d of RECORD_DEFS) {
    const rec = recs[d.key];
    if (!rec) continue;
    for (const p of team.roster || []) {
      const v = p.ss?.[d.key] || 0;
      const pace = (v / g) * GAMES;
      if (v && v < rec.val && pace >= rec.val * margin) out.push({ key: d.key, label: d.label, name: p.name, pid: p.id, val: v, pace, record: rec });
    }
  }
  return out.sort((a, b) => b.pace / b.record.val - a.pace / a.record.val);
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
  const broken = [], tied = [];
  for (const d of RECORD_DEFS) {
    let top = null;
    teams.forEach((t) => everyone(t).forEach((p) => {
      const v = p.ss?.[d.key] || 0;
      if (v > 0 && (!top || v > top.v)) top = { p, t, v };
    }));
    const cur = best[d.key];
    // matching the mark: a share of the record, written in the book (once per player a season)
    if (top && top.v === cur.val && top.p.id !== cur.pid && !(cur.ties || []).some((x) => x.pid === top.p.id && x.yr === yr)) {
      const e = { tie: true, key: d.key, label: d.label, name: top.p.name, pid: top.p.id, team: top.t.ab, val: top.v, yr, prev: { val: cur.val, name: cur.name, team: cur.team, yr: cur.yr } };
      best[d.key] = { ...cur, ties: [...(cur.ties || []), { name: top.p.name, pid: top.p.id, team: top.t.ab, yr }] };
      tied.push(e); history.push(e);
      continue;
    }
    if (!top || top.v <= cur.val) continue;
    const same = cur.pid === top.p.id && cur.yr === yr;
    best[d.key] = { val: top.v, name: top.p.name, pid: top.p.id, pos: posTag(top.p), team: top.t.ab, yr };
    if (!same) {
      const prev = cur.prev && cur.yr === yr && !cur.nfl ? cur.prev : { val: cur.val, name: cur.name, team: cur.team, yr: cur.yr };
      best[d.key].prev = prev;
      const e = { key: d.key, label: d.label, name: top.p.name, pid: top.p.id, team: top.t.ab, val: top.v, yr, prev };
      broken.push(e);
      history.push(e);
    } else best[d.key].prev = cur.prev;
  }
  return { book: { ...book, best, history }, broken, tied }; // keep the franchise records riding along in the book
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
export function recordStories({ broken = [], tied = [], watch = [], franchise = [], fwatch = [], myTi = -1, teams, yr, wk }) {
  const teamIdx = (ab) => teams.findIndex((t) => t.ab === ab);
  const s = [];
  for (const b of tied) {
    s.push({ id: `tie-${yr}-${wk}-${b.team}-${b.key}-${b.pid}`, kind: "record", team: teamIdx(b.team), head: `RECORD TIED: ${b.name} matches the ${b.fr ? `${b.team} ` : ""}single-season ${b.label.toLowerCase()} mark`,
      text: `${b.name} (${b.team}) has ${fmt(b.key, b.val)} ${b.label.toLowerCase()}, level with ${b.prev.name}${b.prev.yr ? ` (${b.prev.yr})` : ""}. One more and it's his alone.` });
  }
  for (const b of broken) {
    s.push({ id: `rec-${yr}-${wk}-${b.key}`, kind: "record", team: teamIdx(b.team), head: `NEW RECORD: ${b.name} sets the single-season ${b.label.toLowerCase()} mark`,
      text: `${b.name} (${b.team}) now has ${fmt(b.key, b.val)} ${b.label.toLowerCase()}, passing ${b.prev.name}'s ${fmt(b.key, b.prev.val)} from ${b.prev.yr}${wk && wk < GAMES + 1 ? `, and there's still football left` : ""}.` });
  }
  for (const f of franchise) {
    s.push({ id: `frec-${yr}-${wk}-${f.team}-${f.key}`, kind: "record", team: teamIdx(f.team), head: `FRANCHISE RECORD: ${f.name} owns the ${f.team} single-season ${f.label.toLowerCase()} mark`,
      text: `${f.name} is up to ${fmt(f.key, f.val)} ${f.label.toLowerCase()}${f.prev ? `, past ${f.prev.name}'s ${fmt(f.key, f.prev.val)}${f.prev.yr ? ` from ${f.prev.yr}` : ""}` : ""}.` });
  }
  for (const w of fwatch.slice(0, 1)) {
    s.push({ id: `fpace-${yr}-${wk}-${w.key}-${w.pid}`, kind: "pace", team: myTi, head: `Franchise watch: ${w.name} on pace for ${fmt(w.key, w.pace)} ${w.label.toLowerCase()}`,
      text: `He has ${fmt(w.key, w.val)} so far. The club record is ${fmt(w.key, w.record.val)}, held by ${w.record.name}${w.record.yr ? ` (${w.record.yr})` : ""}.` });
  }
  for (const w of watch.slice(0, 2)) {
    s.push({ id: `pace-${yr}-${wk}-${w.key}-${w.pid}`, kind: "pace", team: w.ti, head: `Record watch: ${w.name} on pace for ${fmt(w.key, w.pace)} ${w.label.toLowerCase()}`,
      text: `${w.name} (${w.team}) has ${fmt(w.key, w.val)} so far. The record is ${fmt(w.key, w.record.val)}, set by ${w.record.name} in ${w.record.yr}.` });
  }
  return s;
}
