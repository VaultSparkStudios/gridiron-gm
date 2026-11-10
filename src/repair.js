// Repairs a loaded save so one bad entry can't crash every screen: drops empty slots from
// rosters and the free-agent pool, clears development traits the game doesn't know, and fills
// in fields every screen expects. Mutates and returns the save; reports what it fixed.
import { DEV_TRAITS } from "./scouting.js";
import { REAL_STAFF, HC_RATING, HC_TRAIT } from "./data/realCoaches.js";
import { applyRosterUpdates } from "./rosterUpdates.js";
import { brokenReadDef, readDefOf } from "./qbiq.js";

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
    // Saves from before real head coaches: give each club its real 2026 head coach.
    if (t.coach && !t.coach.hc && REAL_STAFF[t.ab]) { const n = REAL_STAFF[t.ab][0]; t.coach.hc = { id: `hc-${t.ab}`, name: n, face: null, role: "HC", rating: HC_RATING[n] ?? 74, trait: HC_TRAIT[n], real: true }; }
    if (t.coach?.hc && !t.coach.hc.trait && HC_TRAIT[t.coach.hc.name]) t.coach.hc.trait = HC_TRAIT[t.coach.hc.name];
    // Gambling bans used to be "99 weeks" (and only ran down in season): now a full 17 games at most.
    for (const p of [...t.roster, ...t.ps, ...t.ir]) if (p.suspended && p.suspWksLeft > 17) p.suspWksLeft = 17;
  });
  d.fa = fixList(d.fa, fixes, "free agents");
  // The log is lines of text; an old farewell feature put records in it, which can't be drawn.
  if (Array.isArray(d.log)) {
    const bad = d.log.filter((l) => typeof l !== "string").length;
    if (bad) {
      d.log = d.log.map((l) => (typeof l === "string" ? l : l && typeof l.msg === "string" ? `${l.msg}` : null)).filter(Boolean);
      fixes.push(`${bad} log entries`);
    }
  }
  if (Array.isArray(d.sched)) d.sched = d.sched.filter((g) => g && typeof g === "object");
  if (Array.isArray(d.draftPicks)) d.draftPicks = d.draftPicks.filter((pk) => pk && typeof pk === "object");
  // QB Read Def used to come from Madden's Play Recognition (a defender's rating: QBs sat at 10-30).
  // Rebuild it everywhere a QB lives: rosters, free agents, waivers and the draft classes.
  {
    let n = 0;
    const fix = (p) => { if (p?.pos === "QB" && brokenReadDef(p.posAttrs)) { p.posAttrs = { ...p.posAttrs, readDef: readDefOf(p.posAttrs) }; n++; } };
    for (const t of d.teams) for (const p of [...(t?.roster || []), ...(t?.ps || []), ...(t?.ir || [])]) fix(p);
    for (const p of [...(Array.isArray(d.fa) ? d.fa : []), ...(Array.isArray(d.waivers) ? d.waivers : [])]) fix(p);
    for (const cls of Object.values(d.dc || {})) if (Array.isArray(cls)) cls.forEach(fix);
    if (n) fixes.push(`rebuilt Read Def for ${n} quarterback${n === 1 ? "" : "s"}`);
  }
  // in-season roster updates (rosterUpdates.js), once each
  fixes.push(...applyRosterUpdates(d));
  return { d, fixes };
}
