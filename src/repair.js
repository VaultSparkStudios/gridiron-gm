// Repairs a loaded save so one bad entry can't crash every screen: drops empty slots from
// rosters and the free-agent pool, clears development traits the game doesn't know, and fills
// in fields every screen expects. Mutates and returns the save; reports what it fixed.
import { DEV_TRAITS } from "./scouting.js";

const okPlayer = (p) => p && typeof p === "object" && p.id != null && typeof p.pos === "string";

function fixPlayer(p, fixes) {
  if (p.dev && !DEV_TRAITS[p.dev]) { delete p.dev; fixes.push(`unknown trait on ${p.name || p.id}`); }
  if (typeof p.name !== "string" || !p.name) { p.name = "Unknown Player"; fixes.push(`nameless player ${p.id}`); }
  if (typeof p.ovr !== "number" || Number.isNaN(p.ovr)) { p.ovr = 50; fixes.push(`rating on ${p.name}`); }
  if (typeof p.age !== "number") p.age = 25;
  if (!p.ss || typeof p.ss !== "object") p.ss = {};
  if (!Array.isArray(p.gl)) p.gl = [];
  return p;
}

function fixList(list, fixes, where) {
  if (!Array.isArray(list)) return [];
  const out = list.filter(okPlayer);
  if (out.length !== list.length) fixes.push(`${list.length - out.length} empty slot(s) in ${where}`);
  const seen = new Set();
  return out.filter((p) => (seen.has(p.id) ? (fixes.push(`duplicate ${p.name} in ${where}`), false) : seen.add(p.id))).map((p) => fixPlayer(p, fixes));
}

export function repairSave(d) {
  const fixes = [];
  if (!d || !Array.isArray(d.teams)) return { d, fixes };
  d.teams.forEach((t, i) => {
    if (!t) return;
    t.roster = fixList(t.roster, fixes, `${t.ab || i} roster`);
    t.ps = fixList(t.ps, fixes, `${t.ab || i} practice squad`);
    t.ir = fixList(t.ir, fixes, `${t.ab || i} injured reserve`);
  });
  d.fa = fixList(d.fa, fixes, "free agents");
  // The log is lines of text; an old farewell feature put records in it, which can't be drawn.
  if (Array.isArray(d.log)) {
    const bad = d.log.filter((l) => typeof l !== "string").length;
    if (bad) {
      d.log = d.log.map((l) => (typeof l === "string" ? l : l && typeof l.msg === "string" ? `🎖️ ${l.msg}` : null)).filter(Boolean);
      fixes.push(`${bad} log entries`);
    }
  }
  if (Array.isArray(d.sched)) d.sched = d.sched.filter((g) => g && typeof g === "object");
  if (Array.isArray(d.draftPicks)) d.draftPicks = d.draftPicks.filter((pk) => pk && typeof pk === "object");
  return { d, fixes };
}
