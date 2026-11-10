// Scouting: your scouting staff (two major and two minor scouts), what they can tell you about
// draft prospects, the consensus big board, the NFL Combine, development traits, and the
// analysts' instant grades on draft day.
//
// Reads that must not change between renders (a scout's general idea of a prospect, the
// report he files) draw from keyed streams, so the same prospect always reads the same way.
import { posTag } from "./dline.js";

// ---------- Keyed random streams ----------

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function stream(key) {
  let st = hashStr(String(key)) || 1;
  const next = () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let t = st;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (a, b) => Math.floor(next() * (b - a + 1)) + a,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    gauss: (mean = 0, sd = 1) => {
      let u = 0, v = 0;
      while (!u) u = next();
      while (!v) v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const gauss = (m = 0, s = 1) => {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ---------- Budget ----------

export const SCOUT_PTS_START = 8; // in the bank when the season starts
export const SCOUT_PTS_WEEKLY = 1; // earned each week of the regular season
export const SCOUT_PTS_COMBINE = 4; // extra budget at the Combine
// The sim stops for scouting twice a season: at the trade deadline (TRADE_DEADLINE_WEEK in
// aiTrades.js) and after the last week of the regular season. Points don't carry past the playoffs:
// whatever's left expires when the Combine opens, so they can't be hoarded for draft week.
export const SCOUT_CHECKPOINTS = [9, 18];
export const COMBINE_INVITES = 180;
export const COMBINE_INTERVIEWS = 4;

// ---------- Scouting staff ----------

export const SCOUT_GROUPS = { QB: "Quarterbacks", RB: "Running backs", REC: "Receivers & tight ends", OL: "Offensive line", DL: "Defensive line", LB: "Linebackers", DB: "Defensive backs", ST: "Specialists" };
export const SCOUT_GROUP_SHORT = { QB: "QB", RB: "RB", REC: "WR/TE", OL: "OL", DL: "DL", LB: "LB", DB: "DB", ST: "K/P" };
const HIRE_GROUPS = ["QB", "RB", "REC", "OL", "DL", "LB", "DB"];
const OL = new Set(["LT", "LG", "C", "RG", "RT"]);
export const scoutGroup = (pos) =>
  pos === "QB" ? "QB" : pos === "RB" ? "RB" : pos === "WR" || pos === "TE" ? "REC" : OL.has(pos) ? "OL" : pos === "DL" ? "DL" : pos === "LB" ? "LB" : pos === "CB" || pos === "S" ? "DB" : "ST";

const MAJOR_DESC = "Works two regions in depth: sharp reports, exact ratings after a full workup, and development traits. Sharpest at his specialty position group.";
const MINOR_DESC = "Works one region more loosely: a general idea of every prospect there and rougher reports. A good one can read development traits on a full workup, at his specialty.";
export const SCOUT_ROLES = {
  major: { name: "Major scout", short: "Major", desc: MAJOR_DESC },
  major2: { name: "Second major scout", short: "Major 2", desc: MAJOR_DESC },
  minor: { name: "Minor scout", short: "Minor", desc: MINOR_DESC },
  minor2: { name: "Second minor scout", short: "Minor 2", desc: MINOR_DESC },
};
// Your four jobs on the staff, and the kind of scout each one is.
export const SCOUT_SLOTS = ["major", "major2", "minor", "minor2"];
export const slotKind = (slot) => (slot.startsWith("major") ? "major" : "minor");
export const staffOf = (sc) => SCOUT_SLOTS.map((k) => sc?.[k]).filter(Boolean);
const staffHas = (sc, trait) => staffOf(sc).some((x) => x.trait === trait);

export const SCOUT_TRAITS = {
  workhorse: { name: "Road warrior", desc: "+1 scouting point every 4 weeks of the season." },
  sharp: { name: "Sharp eye", desc: "His reads are more accurate (+8 evaluation)." },
  projector: { name: "Projector", desc: "Reads development traits a step earlier." },
  combine: { name: "Combine guru", desc: "+3 scouting points at the Combine." },
  smallschool: { name: "Small-school finder", desc: "Far more accurate on prospects from Group of Five programs and the academies." },
  character: { name: "Character evaluator", desc: "+2 interview slots at the Combine." },
};

const SMALL_SCHOOLS = new Set(["Boise State", "San Diego State", "Fresno State", "Memphis", "Temple", "Tulane", "Liberty", "Coastal Carolina", "James Madison", "Sam Houston", "Troy", "Marshall", "Western Kentucky", "Northern Illinois", "Ball State", "Ohio", "Kent State", "Central Michigan", "Western Michigan", "Toledo", "Florida Atlantic", "Middle Tennessee", "UAB", "Southern Miss", "Charlotte", "Texas State", "Air Force", "Navy", "Army", "Rice", "UTSA", "UTEP", "Appalachian State", "Eastern Michigan", "Old Dominion"]);
export const isSmallSchool = (p) => SMALL_SCHOOLS.has(p?.bio?.college);

const SCOUT_FIRST = ["Bill", "Gil", "Ron", "Dave", "Jim", "Ernie", "Ozzie", "Tom", "Bobby", "Rick", "Dick", "Ted", "Phil", "Gary", "Joe", "Ray", "Marv", "Lou", "Chuck", "Andre", "Darnell", "Terry", "Glenn", "Kevin", "Monica", "Linda", "Sandra", "Pat", "Leon", "Curtis"];
const SCOUT_LAST = ["Hollis", "Brandt", "Whitfield", "Kowalczyk", "Rooney", "Accorsi", "Polian", "Banner", "Casserly", "Grier", "Mayhew", "Tobin", "Heckert", "Lynch", "Ballard", "Licht", "Rhodes", "Spytek", "Ward", "Pace", "Snead", "Dorsey", "Kelly", "Ruston", "Okafor", "Delgado", "Prescott", "Vance", "Harlow", "Stroud"];
const BACKGROUNDS = [
  (r) => `Former ${r.pick(["SEC", "Big Ten", "Big 12", "ACC", "Mountain West", "MAC"])} ${r.pick(["position coach", "recruiting coordinator", "defensive coordinator", "offensive coordinator"])}`,
  (r) => `Ex-NFL ${r.pick(["linebacker", "safety", "guard", "receiver", "quarterback", "defensive end", "cornerback"])}, ${r.int(2, 12)} seasons`,
  (r) => `${r.int(8, 31)} years as an area scout`,
  (r) => `Former ${r.pick(["BLESTO", "National Football Scouting"])} scout`,
  (r) => `Former ${r.pick(["CFL", "UFL", "Arena League"])} personnel director`,
  () => "Video coordinator turned scout",
  (r) => `Ex-college head coach (${r.pick(["Appalachian State", "Toledo", "Boise State", "James Madison", "Northern Illinois", "Troy"])})`,
  (r) => `Ex-${r.pick(["Senior Bowl", "East-West Shrine Bowl"])} personnel staffer`,
];

function makeScout(key, group, evalMean, faceFn) {
  const r = stream(key);
  return {
    id: `sc${hashStr(key).toString(36)}`,
    name: `${r.pick(SCOUT_FIRST)} ${r.pick(SCOUT_LAST)}`,
    age: r.int(34, 67),
    group,
    eval: clamp(Math.round(r.gauss(evalMean, 9)), 50, 95),
    trait: r.chance(0.55) ? r.pick(Object.keys(SCOUT_TRAITS)) : null,
    bg: r.pick(BACKGROUNDS)(r),
    face: faceFn ? faceFn() : null,
  };
}

// Scouts looking for work: two for each position group, one usually sharper than the other.
export function refreshScoutPool(sc, year, faceFn) {
  const n = (sc.poolN || 0) + 1;
  const pool = [...HIRE_GROUPS, ...HIRE_GROUPS].map((g, i) => makeScout(`${year}|${n}|pool|${i}`, g, i < HIRE_GROUPS.length ? 77 : 68, faceFn));
  return { ...sc, pool, poolN: n };
}

export function newScouting(year, faceFn, list = { yr: year, ids: [] }) {
  const sc = {
    major: makeScout(`${year}|staff|major|${Math.random()}`, "QB", 70, faceFn),
    major2: makeScout(`${year}|staff|major2|${Math.random()}`, "DL", 68, faceFn),
    minor: makeScout(`${year}|staff|minor|${Math.random()}`, "DB", 64, faceFn),
    minor2: makeScout(`${year}|staff|minor2|${Math.random()}`, "REC", 62, faceFn),
    pool: [],
    poolN: Math.floor(Math.random() * 1e6),
    pts: SCOUT_PTS_START,
    wkPaid: 0,
    list,
    interviewsLeft: 0,
  };
  return refreshScoutPool(sc, year, faceFn);
}

// Staff changes happen in the preseason and after the draft, not while the scouts are on the road.
export const staffWindowOpen = (sp) => sp === "preseason" || sp === "freeagency";
const ON_ROAD = "Your scouts are on the road. You can change your staff in free agency or the preseason.";

export function hireScout(sc, sp, scoutId, role) {
  if (!staffWindowOpen(sp)) return { ok: false, msg: ON_ROAD, sc };
  const s = (sc.pool || []).find((x) => x.id === scoutId);
  if (!s || !SCOUT_ROLES[role]) return { ok: false, msg: "That scout isn't available.", sc };
  // he takes over the job's regions
  const old = sc[role];
  const pool = sc.pool.filter((x) => x.id !== s.id);
  if (old) pool.push(old);
  const msg = `${s.name} (${SCOUT_GROUPS[s.group]?.toLowerCase() || "no specialty"}) is your new ${SCOUT_ROLES[role].name.toLowerCase()}, working ${areaList(areasOf(sc)[role])}.`;
  return { ok: true, msg, sc: { ...sc, [role]: s, pool } };
}

export function releaseScout(sc, sp, role) {
  if (!staffWindowOpen(sp)) return { ok: false, msg: ON_ROAD, sc };
  const old = sc[role];
  if (!old) return { ok: false, msg: "That job is already open.", sc };
  return { ok: true, msg: `${old.name} has been let go.`, sc: { ...sc, [role]: null, pool: [...(sc.pool || []), old] } };
}

export function swapScoutRoles(sc, sp) {
  if (!staffWindowOpen(sp)) return { ok: false, msg: ON_ROAD, sc };
  const ar = areasOf(sc);
  // each scout keeps his regions as far as the new job allows (a new major scout picks up a second one)
  const areas = { major: ar.minor, minor: ar.major.slice(0, 1), major2: ar.minor2, minor2: ar.major2.slice(0, 1) };
  return { ok: true, msg: "Your major and minor scouts have switched roles.", sc: { ...sc, major: sc.minor || null, minor: sc.major || null, major2: sc.minor2 || null, minor2: sc.major2 || null, areas } };
}

// ---------- Regions ----------
// Before the season you send each scout to his regions: a major scout works two, a minor scout
// one. Six regions, six assignments: spread them to see the whole class, or double up on the
// SEC for a second opinion there. The assignments stay put until you change them (in free agency
// or the preseason).
export const AREA_KEYS = ["SEC", "B1G", "ACC", "B12", "G5", "PAC"];
export const areaCap = (slot) => (slotKind(slot) === "major" ? 2 : 1);
const areaList = (rs) => rs.map(regionName).join(" and ");
// Each job's regions, with any it hasn't been given filled from the ones nobody covers yet.
export function areasOf(sc) {
  const out = {}, used = new Set();
  for (const k of SCOUT_SLOTS) {
    out[k] = [...new Set((sc?.areas?.[k] || []).filter((r) => REGIONS[r]))].slice(0, areaCap(k));
    out[k].forEach((r) => used.add(r));
  }
  // once you assign regions by hand, an open slot stays open (0/2, 1/2...)
  if (sc?.areasManual) return out;
  for (const k of SCOUT_SLOTS) {
    while (out[k].length < areaCap(k)) {
      const r = AREA_KEYS.find((x) => !used.has(x)) || AREA_KEYS.find((x) => !out[k].includes(x));
      out[k].push(r);
      used.add(r);
    }
  }
  return out;
}
// Regions none of your scouts work (their prospects get the front office's read).
export const uncovered = (sc) => {
  const ar = areasOf(sc);
  return AREA_KEYS.filter((r) => !SCOUT_SLOTS.some((k) => sc?.[k] && ar[k].includes(r)));
};
// The season an assignment is for: in free agency it's already next year's.
export const areaSeason = (sp, yr) => (sp === "freeagency" ? yr + 1 : yr);
export const lockAreas = (sc, sp, yr) => ({ ...sc, areas: areasOf(sc), areasYr: areaSeason(sp, yr) });
export function assignArea(sc, sp, slot, i, region, yr) {
  if (!staffWindowOpen(sp)) return { ok: false, msg: "Your scouts are already on the road. You can move them in free agency or the preseason.", sc };
  if (!SCOUT_ROLES[slot] || !REGIONS[region] || i < 0 || i >= areaCap(slot)) return { ok: false, msg: "That isn't a region he can work.", sc };
  const ar = areasOf(sc);
  const mine = [...ar[slot]];
  // picking his other region swaps the two
  const j = mine.indexOf(region);
  if (j >= 0 && j !== i) mine[j] = mine[i];
  mine[i] = region;
  const areas = { ...ar, [slot]: mine };
  const nsc = { ...sc, areas, areasYr: yr != null ? areaSeason(sp, yr) : sc.areasYr };
  const who = sc[slot]?.name || `Your ${SCOUT_ROLES[slot].name.toLowerCase()}`;
  const gap = uncovered(nsc);
  return { ok: true, msg: `${who} will work ${areaList(mine)}.${gap.length ? ` Nobody covers ${areaList(gap)} now.` : ""}`, sc: nsc };
}

// A point for every week of the regular season played up to `wk` (a sim that skips ahead
// still credits every week).
export function creditWeeks(sc, wk) {
  const paid = sc.wkPaid || 0;
  if (wk <= paid) return sc;
  const workhorse = staffHas(sc, "workhorse");
  let pts = sc.pts || 0;
  for (let w = paid + 1; w <= wk; w++) {
    pts += SCOUT_PTS_WEEKLY;
    if (workhorse && w % 4 === 0) pts++;
  }
  return { ...sc, pts, wkPaid: wk };
}

// A new season, a new class to scout.
export const startScoutingYear = (sc, year) => ({ ...sc, pts: SCOUT_PTS_START, wkPaid: 0, interviewsLeft: 0, list: { yr: year, ids: [] } });

// ---------- Regions ----------
// Where prospects play. Your scouts are assigned by region (see areasOf above).
export const REGIONS = {
  SEC: { name: "SEC", schools: ["Alabama", "Georgia", "LSU", "Florida", "Auburn", "Tennessee", "Texas A&M", "Ole Miss", "Arkansas", "Kentucky", "Missouri", "South Carolina", "Mississippi State", "Vanderbilt", "Texas", "Oklahoma"] },
  B1G: { name: "Big Ten", schools: ["Ohio State", "Michigan", "Penn State", "Wisconsin", "Iowa", "Minnesota", "Nebraska", "Maryland", "Purdue", "Michigan State", "Illinois", "Indiana", "Rutgers", "Northwestern", "USC", "UCLA", "Oregon", "Washington"] },
  B12: { name: "Big 12", schools: ["Baylor", "TCU", "Utah", "Colorado", "Arizona State", "Kansas State", "Oklahoma State", "BYU", "Houston", "Cincinnati", "UCF", "West Virginia", "Iowa State", "Texas Tech"] },
  ACC: { name: "ACC", schools: ["Clemson", "Notre Dame", "Florida State", "Miami", "NC State", "Pittsburgh", "North Carolina", "Syracuse", "SMU", "Virginia Tech", "Georgia Tech", "Wake Forest", "Virginia", "Duke", "Louisville", "Stanford"] },
  PAC: { name: "Pac-12 & Mountain West", schools: ["Boise State", "San Diego State", "Fresno State", "Air Force", "UTEP", "Texas State", "UTSA", "Rice"] },
  G5: { name: "AAC, Sun Belt, MAC & C-USA", schools: ["Tulane", "Memphis", "Temple", "Liberty", "Coastal Carolina", "James Madison", "Sam Houston", "Troy", "Marshall", "Western Kentucky", "Northern Illinois", "Ball State", "Ohio", "Kent State", "Central Michigan", "Western Michigan", "Toledo", "Florida Atlantic", "Middle Tennessee", "UAB", "Southern Miss", "Charlotte", "Navy", "Army", "Appalachian State", "Eastern Michigan", "Old Dominion"] },
};
const REGION_OF = Object.fromEntries(Object.entries(REGIONS).flatMap(([k, r]) => r.schools.map((s) => [s, k])));
// Where draft prospects come from, roughly like the real draft (the SEC and Big Ten produce the most).
export const FCS_SCHOOLS = ["North Dakota State", "South Dakota State", "Montana", "Montana State", "Villanova", "Delaware", "Furman", "Jackson State", "Sacramento State", "Illinois State"];
const REGION_WEIGHT = [["SEC", 26], ["B1G", 24], ["ACC", 15], ["B12", 14], ["PAC", 6], ["G5", 12], ["OTH", 3]];
// Each class leans: every conference is deep at one position group and thin at another, so where
// you send your scouts (and which specialists) depends on the year. Pass the prospect's year and
// position and his school follows the lean.
export function regionTilt(yr) {
  const r = stream(`tilt|${yr}`);
  const g = [...HIRE_GROUPS];
  for (let i = g.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
  return Object.fromEntries(AREA_KEYS.map((k, i) => [k, { up: g[i], down: g[(i + 3) % g.length] }]));
}
export function draftCollege(rand = Math.random, lean) {
  const tilt = lean?.yr != null ? regionTilt(lean.yr) : null, grp = lean?.pos ? scoutGroup(lean.pos) : null;
  const ws = REGION_WEIGHT.map(([k, w]) => [k, tilt?.[k] ? w * (tilt[k].up === grp ? 2.6 : tilt[k].down === grp ? 0.3 : 1) : w]);
  let x = rand() * ws.reduce((t, [, w]) => t + w, 0);
  for (const [k, w] of ws) { if ((x -= w) <= 0) { const list = k === "OTH" ? FCS_SCHOOLS : REGIONS[k].schools; return list[Math.floor(rand() * list.length)]; } }
  return REGIONS.SEC.schools[0];
}
export const regionOf = (p) => REGION_OF[p?.bio?.college] || "OTH";
// What each conference has this year, read off the class itself: among the board's top 160, the
// position group it has the most of (against its usual share) and the one it has the least of.
export function regionReport(cls) {
  const top = (cls || []).filter((p) => scoutGroup(p.pos) !== "ST").sort((a, b) => csRank(a) - csRank(b)).slice(0, 160);
  const N = top.length || 1, byG = {}, byR = {}, n = {};
  for (const p of top) { const g = scoutGroup(p.pos), r = regionOf(p); byG[g] = (byG[g] || 0) + 1; byR[r] = (byR[r] || 0) + 1; n[`${r}|${g}`] = (n[`${r}|${g}`] || 0) + 1; }
  return Object.fromEntries(AREA_KEYS.map((r) => {
    const z = HIRE_GROUPS.map((g) => { const have = n[`${r}|${g}`] || 0, exp = ((byR[r] || 0) * (byG[g] || 0)) / N; return { g, have, exp, z: (have - exp) / Math.sqrt(exp + 1) }; }).sort((a, b) => b.z - a.z);
    // too few of the top prospects to call a lean
    const few = (byR[r] || 0) < 8;
    return [r, { n: byR[r] || 0, strong: few || !z[0].have ? null : z[0], weak: few ? null : z[z.length - 1],
      // the full lists, best and worst first (what clearly stands out either way)
      ups: few ? [] : z.filter((x) => x.have && x.z > 0.6).slice(0, 3), downs: few ? [] : z.filter((x) => x.z < -0.6).reverse().slice(0, 3) }];
  }));
}
export const regionName = (k) => REGIONS[k]?.name || "Independents & FCS";
// ---------- What your scouts know ----------

const OFFICE_EVAL = 60;

// Which of your scouts covers a prospect: "major", "minor", or "office" (nobody works his region,
// so the front office's generalists handle it). With several scouts in one region the best major
// scout leads and the rest are second opinions (`second` is the next one, `others` all of them).
export function coverage(sc, p) {
  const reg = regionOf(p), ar = areasOf(sc);
  const on = SCOUT_SLOTS.filter((k) => sc?.[k] && ar[k].includes(reg)).map((k) => ({ kind: slotKind(k), scout: sc[k] }))
    .sort((a, b) => (a.kind === b.kind ? effEval(b.scout, p) - effEval(a.scout, p) : a.kind === "major" ? -1 : 1));
  if (!on.length) return { role: "office", scout: null };
  const others = on.slice(1).map((x) => x.scout);
  return { role: on[0].kind, scout: on[0].scout, ...(others.length ? { second: others[0], others } : {}) };
}

// second: another scout (or a list of them) in the same region. More eyes read better than the
// best one alone, and anyone's specialty counts.
// Every scout has a position group he knows best. There he reads a little sharper than his rating;
// outside it he's a generalist and reads a lot worse. A great scout on the wrong position won't
// find you your cornerback.
export const SPEC_BONUS = 4, OFF_SPEC = 14;
export const onSpec = (scout, p) => !!scout?.group && scout.group === scoutGroup(p.pos);
export const effEval = (scout, p) => scout.eval + (!scout.group ? 0 : onSpec(scout, p) ? SPEC_BONUS : -OFF_SPEC);
export function scoutEval(scout, p, second) {
  if (!scout) return OFFICE_EVAL;
  const more = [].concat(second || []);
  let e = more.length ? Math.max(effEval(scout, p), ...more.map((x) => effEval(x, p))) + 6 + 2 * (more.length - 1) : effEval(scout, p);
  const has = (t) => scout.trait === t || more.some((x) => x.trait === t);
  if (has("sharp")) e += 8;
  if (has("smallschool") && isSmallSchool(p)) e += 12;
  return clamp(e, 40, 99);
}

// How far off a read on POT can be (OVR reads are a bit tighter). Level 0 is the passive
// "general idea" a scout has of everyone in his regions; 1 is a scouting report; 2 is a full
// workup. Nobody but the major scout gets to exact numbers. Evaluation counts for a lot: a 90
// scout's general idea is about as close as a 60 scout's report.
export function readSd(role, lvl, ev) {
  const a = (100 - ev) / 40;
  if (role === "major") return lvl >= 2 ? 0 : lvl === 1 ? 0.9 + 1.6 * a : 2.2 + 2.6 * a;
  if (role === "minor") return lvl >= 2 ? 1 + 1.4 * a : lvl === 1 ? 1.8 + 2.4 * a : 3.2 + 3 * a;
  return lvl >= 2 ? 2.6 : lvl === 1 ? 4.2 : Infinity;
}

export function scoutCost(p) {
  const l = p?.scout?.lvl || 0;
  return l === 0 ? 1 : l === 1 ? 2 : 0;
}

// Would this report on the prospect reveal his development trait? A full workup from a major scout
// always does; a good major scout often sees it on the first report, and a good minor scout on a
// workup.
function seesDev(cov, lvl, ev, p) {
  if (cov.role === "office") return false;
  const proj = [cov.scout, ...(cov.others || [])].some((x) => x.trait === "projector");
  const r = stream(`${p.id}|${cov.scout.id}|devread`).next();
  if (cov.role === "major") return lvl >= 2 || proj || (lvl >= 1 && r < clamp((ev - 60) / 30, 0, 1));
  return (lvl >= 1 && proj) || (lvl >= 2 && r < clamp((ev - 55) / 30, 0, 1));
}

// File a report on a prospect. Returns a new prospect object; the caller swaps it into the class.
function fileReport(sc, p, lvl, teams) {
  const cov = coverage(sc, p);
  const ev = scoutEval(cov.scout, p, cov.others);
  const sd = readSd(cov.role, lvl, ev);
  const r = stream(`${p.id}|${cov.scout?.id || "office"}|${lvl}`);
  const n = (s) => (s ? clamp(r.gauss(0, s), -1.6 * s, 1.6 * s) : 0);
  const eOvr = clamp(Math.round(p.trueOvr + n(sd * 0.8)), 30, 99);
  const ePot = clamp(Math.max(eOvr + (sd ? 1 : 0), Math.round(p.truePot + n(sd))), eOvr, 99);
  const skills = skillReads(p, sd, ePot - eOvr, r);
  const prev = p.scout || {};
  const scout = {
    ...prev,
    lvl,
    eOvr,
    ePot,
    sd,
    exact: sd === 0,
    by: cov.role,
    who: cov.others ? [cov.scout, ...cov.others].map((x) => x.name).join(" & ") : cov.scout?.name || "Your front office",
    dev: seesDev(cov, lvl, ev, p) ? devOf(p) : prev.dev || null,
    skills,
    notes: p.bust ? { ...notesFor(p, skills, r), flag: `Red flag: ${p.bust.why}. ${cov.role === "office" ? "Our people" : "Your scout"} sees a high bust risk.` } : p.gem ? { ...notesFor(p, skills, r), gem: `Sleeper: ${p.gem.why}. ${cov.role === "office" ? "Our people think" : "Your scout thinks"} he's much better than where the board has him.` } : notesFor(p, skills, r),
    comp: comparable(teams, p, ePot),
  };
  // The older fields other screens read: scoutLvl 2 means "exact".
  return { ...p, scout, scoutLvl: scout.exact ? 2 : 1, scoutedOvr: eOvr, scoutedPot: ePot };
}

export function scoutProspect(sc, sp, p, teams, classYr, draftYr) {
  if (classYr !== draftYr || sp === "freeagency") return { ok: false, msg: sp === "freeagency" ? "The draft is over." : "You can only scout prospects in the upcoming draft.", sc, p };
  const cost = scoutCost(p);
  if (!cost) return { ok: false, msg: `${p.name} is already fully scouted.`, sc, p };
  if ((sc.pts || 0) < cost) return { ok: false, msg: `Not enough scouting points (that takes ${cost}).`, sc, p };
  const np = fileReport(sc, p, (p.scout?.lvl || 0) + 1, teams);
  return { ok: true, msg: `${np.scout.who} filed a ${np.scout.lvl >= 2 ? "full workup" : "scouting report"} on ${p.name}.`, sc: { ...sc, pts: sc.pts - cost }, p: np };
}

// The general idea your scouts have of every prospect in their regions, without a report. How
// much a scout sees through the public board is his evaluation: a sharp scout flags his regions'
// sleepers and red flags and spots the special development traits before you spend a point; a
// weak one mostly repeats the board. A second scout in the region helps.
export function crewOf(sc, p) {
  const cov = coverage(sc, p);
  if (cov.role === "office") return null;
  const n = 1 + (cov.others?.length || 0), ev = scoutEval(cov.scout, p, cov.others);
  return { cov, n, ev, see: clamp((ev - 62) / 30, 0, 1) * Math.min(1, 0.6 + 0.2 * n) };
}
export function generalIdea(sc, p) {
  const crew = crewOf(sc, p);
  if (!crew) return null;
  const { cov, n, ev, see } = crew;
  const sd = readSd(cov.role, 0, ev);
  const r = stream(`${p.id}|${cov.scout.id}|gen`);
  const pot = seenPot(p, see) + clamp(r.gauss(0, sd), -1.6 * sd, 1.6 * sd);
  // A hunch: your scouts think there's more to him than the board says (now and then they're wrong).
  const h = stream(`${p.id}|${cov.scout.id}|hunch`).next();
  const knack = Math.min(0.97, (cov.role === "major" ? 0.3 : 0.15) + clamp((ev - 60) / 35, 0, 0.55) + 0.1 * (n - 1) + (staffHas(sc, "smallschool") && isSmallSchool(p) ? 0.3 : 0) + (staffHas(sc, "sharp") ? 0.1 : 0));
  const hunch = p.gem ? h < knack : (p.cons?.mid ?? 0) > 90 && h < 0.02 / n;
  // A red flag before a report: a sharp scout sometimes catches what the board missed.
  const flag = !!p.bust && see >= 0.3 && stream(`${p.id}|${cov.scout.id}|flag`).next() < knack;
  // A scout who sees through the board says so outright: "he's a sleeper".
  const sleeper = !!p.gem && hunch && stream(`${p.id}|${cov.scout.id}|sleep`).next() < clamp((see - 0.1) / 0.6, 0, 1);
  // Special development traits, spotted early by a good scout (a major scout more often).
  const d = devOf(p);
  const spot = ["generational", "superstar", "star"].includes(d) && stream(`${p.id}|${cov.scout.id}|dev`).next() < Math.min(0.95, clamp((ev - 68) / 25, 0, 1) * (cov.role === "major" ? 0.75 : 0.45) + 0.12 * (n - 1));
  return { pot, grade: potGrade(pot), tier: projection(p.pos, pot), by: cov.role, who: n > 1 ? `Your ${n} scouts in the ${regionName(regionOf(p))}` : cov.scout.name, hunch, sleeper, flag, dev: spot ? d : null, crew: n };
}

// Everything the UI shows about a prospect, from your point of view.
export function prospectRead(sc, p) {
  const s = p.scout || { lvl: 0 };
  const cov = coverage(sc, p);
  const has = s.lvl > 0 && s.eOvr != null;
  const gen = has ? null : generalIdea(sc, p);
  const potV = has ? s.ePot : gen ? gen.pot : null;
  return {
    lvl: s.lvl || 0,
    cov: cov.role,
    region: regionOf(p),
    scout: cov.scout,
    second: cov.second || null,
    others: cov.others || [],
    ovr: has ? (s.exact ? `${s.eOvr}` : `~${s.eOvr}`) : "??",
    pot: has ? (s.exact ? `${s.ePot}` : `~${s.ePot}`) : gen ? gen.grade : "??",
    ovrV: has ? s.eOvr : null,
    potV,
    exact: !!s.exact,
    general: !!gen,
    hunch: !!gen?.hunch,
    sleeper: !!gen?.sleeper,
    flag: !!(s.notes?.flag || s.intv?.flag || gen?.flag),
    flagWhy: s.notes?.flag || s.intv?.flag || (gen?.flag ? `${p.bust?.why}.` : null),
    devEarly: !s.dev && !!gen?.dev,
    grade: potV != null ? potGrade(potV) : null,
    tier: potV != null ? projection(p.pos, potV) : null,
    dev: s.dev || gen?.dev || null,
    sd: has ? s.sd ?? null : null,
    by: s.by || null,
    who: s.who || gen?.who || null,
    cost: scoutCost(p),
  };
}

// ---------- Grades, projections and reports ----------

// the top of a class runs 90-99, so the A grades are split finely there
const LETTERS = [[95, "A+"], [92, "A"], [89, "A-"], [85, "B+"], [81, "B"], [77, "B-"], [73, "C+"], [70, "C"], [67, "C-"], [-Infinity, "D"]];
export function potGrade(v) {
  for (const [min, g] of LETTERS) if (v >= min) return g;
  return "D";
}
export const gradeTone = (g) => (!g ? "" : g[0] === "A" ? "a" : g[0] === "B" ? "b" : g[0] === "C" ? "c" : "d");

const NOUN = { RB: "running back", WR: "receiver", TE: "tight end", LT: "tackle", RT: "tackle", LG: "guard", RG: "guard", C: "center", DL: "defensive lineman", LB: "linebacker", CB: "cornerback", S: "safety" };
export function projection(pos, pot) {
  if (pos === "QB") return pot >= 90 ? "Franchise quarterback" : pot >= 84 ? "Starting quarterback" : pot >= 78 ? "Bridge starter" : pot >= 72 ? "Backup quarterback" : "Camp arm";
  if (pos === "K") return pot >= 88 ? "Pro Bowl kicker" : pot >= 78 ? "Starting kicker" : "Camp leg";
  if (pos === "P") return pot >= 86 ? "Pro Bowl punter" : pot >= 76 ? "Starting punter" : "Camp leg";
  const n = NOUN[pos] || "player";
  return pot >= 90 ? `Pro Bowl ${n}` : pot >= 84 ? "Day-one starter" : pot >= 78 ? `Starting ${n}` : pot >= 72 ? `Rotational ${n}` : pot >= 67 ? "Depth / special teams" : "Long shot";
}

export function riskLabel(eOvr, ePot) {
  const gap = ePot - eOvr;
  return eOvr >= 72 && gap < 10 ? "Pro-ready" : gap >= 14 ? "High-upside project" : eOvr < 64 ? "Developmental depth" : "Needs some development";
}

// What a scout writes when a tool stands out, good or bad.
const ATTR_NOTES = {
  armStr: ["Effortless arm strength to every level", "Ball dies on deep outs"],
  accuracy: ["Pinpoint ball placement", "Ball placement is erratic"],
  pocketAwr: ["Feels pressure and slides away from it", "Drifts into sacks"],
  decisions: ["Takes what the defense gives him", "Forces throws into coverage"],
  mobility: ["Extends plays with his legs", "Statue in the pocket"],
  touch: ["Throws with real touch over the linebackers", "Everything is a fastball"],
  readDef: ["Diagnoses coverages before the snap", "Locks onto his first read"],
  vision: ["Patient runner who finds the crease", "Misses cutback lanes"],
  elusiveness: ["Makes defenders miss in a phone booth", "Easy to bring down in space"],
  breakTkl: ["Runs through arm tackles", "Goes down on first contact"],
  passBlock: ["Stonewalls rushers in pass protection", "Pass protection is a liability"],
  receiving: ["Natural hands as a receiver", "Limited as a receiver"],
  burst: ["Explosive through the hole", "Lacks a second gear"],
  balance: ["Stays on his feet through contact", "Gets knocked off balance easily"],
  stiffArm: ["Violent stiff arm", "Doesn't use his off hand"],
  routeRun: ["Crisp, deceptive route runner", "Rounds off his routes"],
  catching: ["Reliable, strong hands", "Too many concentration drops"],
  separation: ["Creates easy separation", "Struggles to get open against man"],
  release: ["Beats press at the line", "Gets jammed at the line"],
  bodyCtrl: ["Acrobatic body control on the sideline", "Stiff adjusting to the ball"],
  yac: ["Dangerous with the ball in his hands", "Little after the catch"],
  deepSpd: ["Takes the top off a defense", "Not a vertical threat"],
  catchTraffic: ["Wins contested catches", "Loses 50-50 balls"],
  blocking: ["Willing, effective blocker", "Liability as a blocker"],
  redZone: ["Red-zone mismatch", "Disappears in the red zone"],
  seaming: ["Splits the safeties up the seam", "Can't threaten the seam"],
  toughness: ["Plays with a mean streak", "Can be pushed around"],
  footwork: ["Clean, quick footwork", "Footwork gets sloppy under pressure"],
  anchor: ["Anchors against power", "Anchor gives way on bull rushes"],
  awareness: ["Picks up stunts and blitzes", "Slow to pick up stunts"],
  handUse: ["Strong, accurate hands at the point of attack", "Hand placement gets too wide"],
  reach: ["Long arms keep rushers at bay", "Short arms; edge rushers get into his chest"],
  agility: ["Light feet for his size", "Struggles to redirect"],
  runBlock: ["Moves people in the run game", "Doesn't generate movement in the run game"],
  pulling: ["Fluid puller who finds his target", "Stiff on the move"],
  strength: ["Rare functional strength", "Needs to get stronger"],
  drive: ["Finishes blocks into the turf", "Doesn't sustain his blocks"],
  snapping: ["Clean, consistent snaps", "Shotgun snaps are inconsistent"],
  leadership: ["Runs the protection calls like a vet", "Quiet; doesn't take charge"],
  athleticism: ["Rare movement skills", "Limited athlete"],
  power: ["Overpowering at the point of attack", "Lacks pop in his hands"],
  passRush: ["Wins with a full pass-rush plan", "No plan as a pass rusher"],
  runStop: ["Stout against the run", "Gets washed out against the run"],
  motor: ["Relentless motor", "Motor runs hot and cold"],
  getOff: ["Explosive get-off at the snap", "Slow off the ball"],
  bullRush: ["Collapses the pocket with power", "Little power in his rush"],
  swim: ["Slippery swim move", "One-dimensional rusher"],
  spin: ["Devastating spin counter", "No counter when his first move fails"],
  tackling: ["Reliable, wrap-up tackler", "Misses too many tackles in space"],
  coverage: ["Comfortable in coverage", "Struggles to match up in coverage"],
  blitzing: ["Times his blitzes perfectly", "Rarely gets home as a blitzer"],
  runFit: ["Fills his gap with authority", "Overruns his run fits"],
  instincts: ["Always around the football", "Late to diagnose plays"],
  pursuit: ["Sideline-to-sideline range", "Takes poor pursuit angles"],
  shedBlock: ["Sheds blocks quickly", "Gets swallowed by blockers"],
  zoneAwr: ["Reads the quarterback's eyes in zone", "Loses track of receivers in zone"],
  manCov: ["Sticky in man coverage", "Gets beat in man coverage"],
  zoneCov: ["Smart zone defender", "Lost in zone coverage"],
  press: ["Physical press corner", "Can't jam at the line"],
  ballSkills: ["Elite ball skills", "Doesn't find the football"],
  recovery: ["Recovery speed erases mistakes", "Can't recover once beaten"],
  playRec: ["Recognizes routes early", "Bites on double moves"],
  range: ["Rangy centerfielder", "Limited range in deep coverage"],
  runSupport: ["Physical in run support", "Hesitant in run support"],
  ballHawk: ["Ball-hawk instincts", "Hands of stone on interceptions"],
  comms: ["Quarterbacks the secondary", "Communication breakdowns on the back end"],
  versatility: ["Plays deep, in the box or in the slot", "Pigeonholed to one role"],
  legStr: ["Booming leg", "Leg strength is average at best"],
  clutch: ["Ice water in his veins", "Has missed big kicks in big moments"],
  distance: ["Good from 55+", "Range tops out in the mid-40s"],
  hangTime: ["Great hang time on kickoffs", "Low, line-drive kicks"],
  consistency: ["Repeatable, consistent mechanics", "Inconsistent mechanics"],
  coldWx: ["Unbothered by cold and wind", "Struggles in bad weather"],
  pressure: ["Thrives under pressure", "Tightens up under pressure"],
  coffin: ["Pins returners inside the 10", "Sails punts into the end zone"],
};
// Kicking words for skills that share a name with a lineman's (a punter's "power" is his leg).
const KICKER_NOTES = { accuracy: ["Splits the uprights consistently", "Sprays kicks from mid-range"], power: ["Booming punts that flip the field", "Short punts give up field position"] };
const noteFor = (pos, k) => ((pos === "K" || pos === "P") && KICKER_NOTES[k]) || ATTR_NOTES[k] || [`Strong ${k}`, `Weak ${k}`];

// Tool grades, projected to his NFL ceiling: today's skill plus the growth the scout expects.
function skillReads(p, sd, growth, r) {
  const out = {};
  for (const [k, now] of Object.entries(p.posAttrs || {})) {
    const noise = sd ? clamp(r.gauss(0, sd * 0.9 + 0.8), -6, 6) : 0;
    const v = now + Math.max(0, growth) + noise;
    out[k] = { v: Math.round(v), g: potGrade(v) };
  }
  return out;
}

// His two best tools and his worst one, unless even the worst is good (or the best isn't).
function notesFor(p, skills, r) {
  const order = Object.keys(skills).sort((a, b) => skills[b].v - skills[a].v || (r.next() < 0.5 ? -1 : 1));
  const top = order.slice(0, 2).filter((k) => skills[k].v >= 70);
  const low = order.slice(-1).filter((k) => skills[k].v < 82);
  return {
    strengths: top.length ? top.map((k) => noteFor(p.pos, k)[0]) : ["Nothing jumps off the tape yet"],
    weaknesses: low.length ? low.map((k) => noteFor(p.pos, k)[1]) : ["Few holes in his game; mostly needs NFL reps"],
  };
}

// The NFL player whose game his most resembles, at about the level he projects to.
export function comparable(teams, p, ePot) {
  const keys = Object.keys(p.posAttrs || {});
  if (!keys.length) return null;
  const mean = (x) => avg(keys.map((k) => x.posAttrs?.[k] ?? 50));
  const mp = mean(p);
  for (const band of [[4, 3], [7, 6], [12, 10]]) {
    let best = null, bestD = Infinity, bestT = null;
    for (const t of teams || []) {
      for (const c of t.roster || []) {
        if (c.pos !== p.pos || !c.posAttrs || c.ovr < ePot - band[0] || c.ovr > ePot + band[1]) continue;
        const mc = mean(c);
        let d = 0;
        for (const k of keys) {
          const x = (p.posAttrs[k] ?? 50) - mp - ((c.posAttrs[k] ?? 50) - mc);
          d += x * x;
        }
        d += ((p.spd ?? 65) - (c.spd ?? 65)) ** 2 * 0.3;
        if (d < bestD) { bestD = d; best = c; bestT = t; }
      }
    }
    if (best) return { name: best.name, pid: best.id, ab: bestT.ab || "" };
  }
  return null;
}

// ---------- Development traits ----------

export const DEV_TRAITS = {
  generational: { name: "Generational", desc: "A once-in-a-generation talent: grows the fastest and keeps raising his ceiling." },
  superstar: { name: "Superstar", desc: "Develops very fast and often blows past his projected ceiling." },
  star: { name: "Star", desc: "Develops faster than most and tends to beat his projection." },
  normal: { name: "Normal", desc: "Develops on a typical curve." },
  late: { name: "Late bloomer", desc: "Slow as a rookie, then catches up fast in his mid-twenties." },
};

// A player's trait is fixed by who he is (his id), not by the main random stream.
// The odds follow his ceiling, as real classes do: a 90-ceiling prospect is a Superstar about 1 time
// in 16, a 78 about 1 in 50, a 65 almost never; Stars are about 1 in 5 at the top, 1 in 10 for a
// 75 and 1 in 20 at the bottom. A class of ~250 has a handful of Superstars, mostly early, and a
// Generational talent turns up only at the very top, about once every five drafts.
export function rollDev(id, pot = 75) {
  const x = stream(`${id}|dev`).next();
  const q = clamp((pot - 65) / 25, 0, 1);
  const gen = 0.02 * q ** 6, sup = gen + 0.004 + 0.06 * q * q, star = sup + 0.05 + 0.17 * q;
  if (x < gen) return "generational";
  if (x < sup) return "superstar";
  if (x < star) return "star";
  if (x < star + 0.18) return "late";
  return "normal";
}
export const devOf = (p) => p.dev || rollDev(p.id, p.truePot ?? p.pot);

// Extra growth in the off-season from a young player's development trait (age is his age
// during the season just finished).
export function devGrowth(p, age) {
  const d = devOf(p);
  if (age > 26) return { ovr: 0, pot: 0 };
  if (d === "generational") return { ovr: rint(2, 4), pot: rint(1, 3) };
  if (d === "superstar") return { ovr: rint(1, 3), pot: rint(0, 2) };
  if (d === "star") return { ovr: rint(0, 2), pot: rint(0, 1) };
  if (d === "late") return age <= 22 ? { ovr: -rint(0, 1), pot: 0 } : { ovr: rint(1, 2), pot: rint(0, 1) };
  return { ovr: 0, pot: 0 };
}

// ---------- Consensus big board ----------

// Kickers and punters: NFL teams almost never spend a premium pick on one (the highest since
// 2012 went 59th-70th, the next ~110th). Their draft value is squeezed toward the bottom of the
// board: a once-in-a-generation leg goes around the third round, a good one on day three, most
// late or undrafted.
export const SPECIALIST = (p) => p.pos === "K" || p.pos === "P";
export const kpValue = (p, v) => (SPECIALIST(p) ? 60 + (v - 60) * 0.38 : v);

// Preseason rankings come out with the class; final rankings after the Combine. The Big Board
// is always in this order, whatever your scouts find. Sorts the class in place.
export function rankClass(cls) {
  for (const p of cls) {
    p.dev ||= rollDev(p.id, p.truePot);
    p.aiNoise ??= gauss(0, 3.6);
    p.scout ||= { lvl: 0 };
    // Kickers rarely go early, however talented.
    p.cons ||= { score: kpValue(p, p.truePot * 0.78 + p.trueOvr * 0.22) + stream(`${p.id}|cs`).gauss(0, SPECIALIST(p) ? 1 : 3.4), kp: 1 };
  }
  // The preseason rank is set once, when the class comes out. Scores move afterwards (scouting, the
  // Combine), so re-ranking on every load would quietly reshuffle the board.
  if (cls.some((p) => p.cons.mid == null)) [...cls].sort((a, b) => b.cons.score - a.cons.score).forEach((p, i) => (p.cons.mid = i + 1));
  return sortByRank(cls);
}
// ---------- College stock watch ----------
// At each checkpoint the college season moves the public board: a handful of prospects rise or fall.
// Half the moves are real (toward what he truly is), half are hype or a bad stretch; only your
// scouts can tell which. The AI clubs lean on the board too, so a fake riser goes too early.
const RISE = ["a three-touchdown game against a ranked opponent", "a dominant stretch in conference play", "NFL scouts packing the stands for his last two games", "tape that has evaluators talking first round", "a breakout month after a slow start"];
const FALL = ["a quiet stretch against weak competition", "two missed games with a hamstring injury", "questions about his effort on film", "a rough outing in a rivalry game", "turnover problems that keep showing up"];
export function stockWatch(cls, yr, wk) {
  if ((cls || []).some((p) => p.cons?.moves?.some((m) => m.wk === wk))) return []; // this week's moves are in
  const r = stream(`${yr}|${wk}|stock`);
  const pool = (cls || []).filter((p) => !SPECIALIST(p) && (p.cons?.now ?? p.cons?.mid ?? 999) <= 160 && p.cons?.final == null);
  const news = [];
  for (let i = 0; i < 10 && pool.length; i++) {
    const p = pool.splice(Math.floor(r.next() * pool.length), 1)[0];
    const truth = kpValue(p, p.truePot * 0.78 + p.trueOvr * 0.22) - p.cons.score;
    const real = r.next() < 0.5;
    const dir = real ? (truth >= 0 ? 1 : -1) : r.next() < 0.5 ? 1 : -1;
    const mag = 1.6 + r.next() * 2.6;
    const before = p.cons.now ?? p.cons.mid;
    p.cons.score += dir * mag;
    p.cons.moves = [...(p.cons.moves || []), { wk, d: dir, real }];
    news.push({ p, dir, before, why: (dir > 0 ? RISE : FALL)[Math.floor(r.next() * 5)] });
  }
  // the board re-ranks (the preseason rank, cons.mid, stays as it was)
  [...(cls || [])].sort((a, b) => b.cons.score - a.cons.score).forEach((p, i) => (p.cons.now = i + 1));
  return news.map((n) => ({ pid: n.p.id, name: n.p.name, pos: n.p.pos, college: n.p.bio?.college, dir: n.dir, from: n.before, to: n.p.cons.now, why: n.why }));
}

// Who your scouts want eyes on at a checkpoint: prospects the board has near your pick (and fits for
// your needs, and this week's movers) that you haven't fully worked up.
export function scoutTargets(cls, { pick = 16, needs = [], movers = [], n = 4 } = {}) {
  const near = (p) => Math.abs((p.cons?.now ?? p.cons?.mid ?? 999) - pick);
  return (cls || []).filter((p) => !SPECIALIST(p) && (p.scout?.lvl || 0) < 2 && near(p) <= 24)
    .map((p) => ({ p, s: near(p) - (needs.includes(p.pos === "DL" ? posTag(p) : p.pos) ? 10 : 0) - (movers.includes(p.id) ? 8 : 0) - ((p.scout?.lvl || 0) === 0 ? 3 : 0) }))
    .sort((a, b) => a.s - b.s).slice(0, n).map((x) => x.p);
}

// ---------- Hidden gems ----------
// Every class has a few sleepers: players far better than anyone's board says (Brock Purdy,
// Davante Adams, Antonio Brown...). The consensus board and most AI teams see only what the
// public sees, so they slide to the middle and late rounds (or go undrafted). Your scouts find
// them with a real report; before that, a good scout sometimes has a hunch.
const GEM_WHY = {
  small: "Small-school star: nobody trusts numbers put up against that competition",
  size: "Undersized for the position, and teams worry he won't hold up",
  injury: "Missed most of his final season hurt, so there's little recent tape",
  raw: "Raw, with one year as a starter, but the flashes are special",
  workout: "Ran poorly at his pro day; on tape he plays much faster",
  qb: "Average arm and size, but he processes and throws with timing like a veteran",
};
export const gemGap = (p) => p.gem?.gap || 0;
export const bustGap = (p) => p.bust?.gap || 0;
// What the public (the board, the analysts, most AI teams) thinks his ceiling is.
export const publicPot = (p) => p.truePot - gemGap(p) + bustGap(p);
// Your read with the board seen through by `see` (0: the public read, 1: the truth).
const seenPot = (p, see) => p.truePot + (bustGap(p) - gemGap(p)) * (1 - see);

// ---------- Red flags (likely busts) ----------
// Every class also has a few prospects the board loves (first- and second-round grades, great
// tape and testing) who are much less than they look. The public never sees it; your scouts can
// red-flag them: a report always does, a deep crew or repeated area trips sometimes do before a
// report, and a Combine interview exposes the character cases.
const BUST_WHY = {
  character: "Character concerns: coaches question his work ethic and his love for the game",
  medical: "Medical red flag: a recurring injury his school kept quiet",
  oneyear: "One-year wonder: one great season against soft competition",
  system: "System player: his numbers come from the scheme, not from him",
  workout: "Workout warrior: tests off the charts, but it doesn't show up on tape",
};
export function plantBusts(cls, yr) {
  if (!cls?.length || cls.some((p) => p.bustChk)) return cls;
  const r = stream(`busts|${yr ?? cls[0]?.draftYear}|${cls.length}`);
  // A quarter to a third of the first round misses, like real drafts (with three to five busts a class
  // a 15-season playtest had 73% of first-rounders become 80+ players; with seven to ten spread over
  // the top 64, still 77%): seven to ten a class, all in the board's top 40, so nearly all go in the
  // first round. The board can't see them; a scouting report can.
  const n = 7 + (r.chance(0.5) ? 1 : 0) + (r.chance(0.5) ? 1 : 0) + (r.chance(0.25) ? 1 : 0);
  const pool = cls.filter((p) => !p.gem && !p.sure && !(p.scout?.lvl > 0) && (p.cons?.mid ?? 999) <= 40 && p.pos !== "K" && p.pos !== "P");
  for (let i = 0; i < n && pool.length; i++) {
    const p = pool.splice(Math.floor(r.next() * pool.length), 1)[0];
    const target = p.truePot - r.int(10, 18);
    // He isn't as good as he looks today either, when his ceiling drops below his current rating.
    if (target <= p.trueOvr) { p.trueOvr = Math.max(50, target - 2); if (p.ovr > p.trueOvr) p.ovr = p.trueOvr; }
    const kind = p.pos === "QB" && r.chance(0.5) ? "system" : r.pick(["character", "character", "medical", "oneyear", "workout"]);
    p.bust = { gap: p.truePot - target, why: BUST_WHY[kind], kind };
    if (p.pot === p.truePot) p.pot = target;
    p.truePot = target;
    p.dev = r.chance(0.3) ? "late" : "normal";
  }
  for (const p of cls) p.bustChk = 1;
  return cls;
}
// Plant this class's gems once (a class that already has them is left alone). Called after the
// consensus board is set, so the board never sees them.
export function plantGems(cls, yr) {
  if (!cls?.length || cls.some((p) => p.gemChk)) return cls;
  const r = stream(`gems|${yr ?? cls[0]?.draftYear}|${cls.length}`);
  const n = 4 + (r.chance(0.5) ? 1 : 0) + (r.chance(0.25) ? 1 : 0);
  const pool = cls.filter((p) => !(p.scout?.lvl > 0) && (p.cons?.mid ?? 0) > 72 && p.pos !== "K" && p.pos !== "P" && p.trueOvr >= 50 && p.truePot < 84);
  for (let i = 0; i < n && pool.length; i++) {
    const p = pool.splice(Math.floor(r.next() * pool.length), 1)[0];
    const target = clamp(Math.max(p.truePot + r.int(10, 17), r.int(82, 88)), 0, 95);
    const kind = p.pos === "QB" ? "qb" : r.pick(["small", "small", "size", "injury", "raw", "workout"]);
    if (kind === "small" && !isSmallSchool(p)) p.bio = { ...(p.bio || {}), college: r.pick([...SMALL_SCHOOLS]) };
    const x = r.next();
    p.dev = x < 0.06 ? "generational" : x < 0.32 ? "superstar" : x < 0.82 ? "star" : "late";
    p.gem = { gap: target - p.truePot, why: GEM_WHY[kind] };
    if (p.pot === p.truePot) p.pot = target;
    p.truePot = target;
  }
  for (const p of cls) p.gemChk = 1;
  return cls;
}
export const csRank = (p) => p.cons?.final ?? p.cons?.now ?? p.cons?.mid ?? 999;
// Your scouts' own board: everyone ranked on what your scouts think of him (their estimates,
// plus the development traits they've seen). Where they have no read, they go with the
// consensus. Returns Map id -> your rank.
const DEV_BUMP = { generational: 3, superstar: 2, star: 1, late: 0, normal: 0 };
export function myScore(sc, p) {
  const r = prospectRead(sc, p);
  if (r.potV == null) return csScore(p);
  const ovrE = r.ovrV ?? r.potV - 8;
  return kpValue(p, r.potV * 0.78 + ovrE * 0.22 + (DEV_BUMP[r.dev] || 0));
}
export function myBoard(sc, cls) {
  const ranked = [...(cls || [])].map((p) => [p, myScore(sc, p)]).sort((a, b) => b[1] - a[1]);
  return new Map(ranked.map(([p], i) => [p.id, i + 1]));
}
export const csScore = (p) => {
  const v = p.cons?.fscore ?? p.cons?.score ?? kpValue(p, p.truePot * 0.78 + p.trueOvr * 0.22);
  // Classes from older saves still carry a kicker's old board score; cap it at the specialist value.
  return SPECIALIST(p) && p.cons && !p.cons.kp ? Math.min(v, kpValue(p, p.truePot * 0.78 + p.trueOvr * 0.22) + 1.5) : v;
};
export const sortByRank = (cls) => cls.sort((a, b) => csRank(a) - csRank(b));

// ---------- The Combine ----------

export const COMBINE_TESTS = [
  { k: "fortyYd", name: "40-yard dash", short: "40", unit: "s", dp: 2, lowGood: true },
  { k: "bench", name: "Bench press (225 lb)", short: "Bench", unit: "reps", dp: 0 },
  { k: "vert", name: "Vertical jump", short: "Vert", unit: "in", dp: 0 },
  { k: "broad", name: "Broad jump", short: "Broad", unit: "in", dp: 0 },
  { k: "threeCone", name: "3-cone drill", short: "3-cone", unit: "s", dp: 2, lowGood: true },
  { k: "shuttle", name: "20-yard shuttle", short: "Shuttle", unit: "s", dp: 2, lowGood: true },
];
// Testing is graded against the same position (all offensive linemen together).
const combineGroup = (pos) => (OL.has(pos) ? "OL" : pos);
// Where a prospect's number ranks among the rest of his position group in the class (1 = best),
// counting everyone who tested, at the Combine or his pro day: { rank, n } or null.
// res: which of his results to rank (his pro day, say); everyone else counts their best-known number.
export function combineRank(cls, p, t, res) {
  const v = (x) => { const r = x.combine || x.proDay; return r && r[t.k] != null ? +r[t.k] : null; };
  const mine = res ? (res[t.k] != null ? +res[t.k] : null) : v(p);
  if (mine == null) return null;
  const g = combineGroup(p.pos);
  const vals = (cls || []).filter((x) => x.id !== p.id && combineGroup(x.pos) === g).map(v).filter((x) => x != null);
  const better = vals.filter((x) => (t.lowGood ? x < mine : x > mine)).length;
  return { rank: better + 1, n: vals.length + 1 };
}
// Green for the top of the group down to red for the bottom.
export const rankColor = ({ rank, n }) => { const f = n > 1 ? (rank - 1) / (n - 1) : 0; return f <= 0.2 ? "#22c55e" : f <= 0.4 ? "#84cc16" : f <= 0.6 ? "#eab308" : f <= 0.8 ? "#f97316" : "#ef4444"; };
const COMBINE_LETTERS = [[0.9, "A+"], [0.8, "A"], [0.7, "A-"], [0.6, "B+"], [0.5, "B"], [0.42, "B-"], [0.34, "C+"], [0.26, "C"], [0.18, "C-"], [-1, "D"]];

// The top of the preseason board gets a Combine invite; everyone else only has a pro day.
export function combineInvites(cls) {
  return new Set([...cls].sort((a, b) => (a.cons?.mid ?? 999) - (b.cons?.mid ?? 999)).slice(0, COMBINE_INVITES).map((p) => p.id));
}

const NEWS = {
  bomb: { label: "Rough Combine; scouts are concerned", delta: -2.6 },
  viral: { label: "Workout tape went viral; stock rising", delta: 2.2 },
  flag: { label: "Character concerns raised in interviews", delta: -3.2 },
  mvp: { label: "Senior Bowl MVP; buzz is building", delta: 2 },
};

// After the playoffs: grade the Combine results, publish the final rankings, hand out interview
// slots and bonus points. Prospects need their `combine` (invitees) and `proDay` results
// already; this mutates them and re-sorts the class.
// A bad day in Indianapolis: a few early names test poorly every year. For some it's real (the
// tape agrees: they're overrated, and their true ratings show it); for others it's a fluke (a tight
// hamstring, a slip at the start). The league can't tell which; your interviews and private
// workouts can. Marks p.combDip = "real" | "fluke" and worsens his numbers, once per class.
function plantCombineDips(invited) {
  if (!invited.length || invited.some((p) => p.combDip !== undefined)) return;
  const early = [...invited].sort((a, b) => (a.cons?.mid ?? 999) - (b.cons?.mid ?? 999)).slice(0, 64);
  const r = stream(`${invited[0].id}|dips`);
  // overrated: the consensus thinks more of him than his true ratings do
  const gap = (p) => csScore(p) - kpValue(p, (p.truePot ?? p.pot) * 0.78 + (p.trueOvr ?? p.ovr) * 0.22);
  const real = [...early].filter((p) => gap(p) > 1.2).sort((a, b) => gap(b) - gap(a)).slice(0, 2 + (r.next() < 0.5 ? 1 : 0));
  const rest = early.filter((p) => !real.includes(p) && gap(p) <= 0.5);
  const fluke = [];
  for (let k = 0; k < 2 + (r.next() < 0.4 ? 1 : 0) && rest.length; k++) fluke.push(rest.splice(Math.floor(r.next() * rest.length), 1)[0]);
  for (const p of invited) p.combDip = real.includes(p) ? "real" : fluke.includes(p) ? "fluke" : null;
  for (const p of [...real, ...fluke]) {
    const c = { ...p.combine };
    for (const t of COMBINE_TESTS) {
      if (c[t.k] == null) continue;
      c[t.k] = t.lowGood ? +(c[t.k] * (1.03 + r.next() * 0.02)).toFixed(t.dp) : t.dp ? +(c[t.k] * (0.84 + r.next() * 0.05)).toFixed(t.dp) : Math.round(c[t.k] * (0.84 + r.next() * 0.05));
    }
    p.combine = c;
  }
}

export function runCombine(sc, cls, { quiet = false } = {}) {
  rankClass(cls);
  plantGems(cls);
  plantBusts(cls);
  const invited = cls.filter((p) => p.combine);
  plantCombineDips(invited);
  const groups = {};
  for (const p of invited) (groups[combineGroup(p.pos)] ||= []).push(p);
  for (const ps of Object.values(groups)) {
    for (const t of COMBINE_TESTS) {
      const sorted = [...ps].sort((a, b) => (t.lowGood ? b.combine[t.k] - a.combine[t.k] : a.combine[t.k] - b.combine[t.k]));
      sorted.forEach((p, i) => ((p.combPcts ||= {})[t.k] = sorted.length > 1 ? i / (sorted.length - 1) : 0.5));
    }
  }
  for (const p of cls) {
    if (p.combine) {
      p.combPct = avg(Object.values(p.combPcts));
      p.combGrade = COMBINE_LETTERS.find(([min]) => p.combPct >= min)[1];
    } else {
      p.combPct = null;
      p.combGrade = null;
      p.combPcts = null;
    }
  }
  // A few prospects make news before the draft.
  const events = [];
  const newsPool = [...cls].filter((p) => p.cons.mid <= 120).sort(() => Math.random() - 0.5).slice(0, quiet ? 0 : 3);
  for (const p of newsPool) {
    const k = p.combine && p.combPct < 0.3 ? "bomb" : p.combine && p.combPct > 0.75 ? "viral" : Math.random() < 0.5 ? "flag" : "mvp";
    p.draftEvent = NEWS[k].label;
    p.newsDelta = NEWS[k].delta;
    events.push({ pid: p.id, name: p.name, label: NEWS[k].label });
  }
  for (const p of cls) {
    if (p.cons.final != null) continue;
    p.cons.fscore = p.cons.score + (p.combine ? (p.combPct - 0.5) * 2.6 : -0.4) + (p.combDip ? -2.6 : 0) + (p.newsDelta || 0) + stream(`${p.id}|final`).gauss(0, 0.9);
  }
  [...cls].sort((a, b) => b.cons.fscore - a.cons.fscore).forEach((p, i) => (p.cons.final = i + 1));
  sortByRank(cls);
  const bonus = quiet ? 0 : SCOUT_PTS_COMBINE + (staffHas(sc, "combine") ? 3 : 0);
  const interviews = COMBINE_INTERVIEWS + (staffHas(sc, "character") ? 2 : 0);
  // The season's points expire with the season: the Combine budget is all you take into the draft.
  const expired = quiet ? 0 : sc.pts || 0;
  return { sc: { ...sc, pts: quiet ? sc.pts || 0 : bonus, interviewsLeft: interviews, workoutsLeft: quiet ? 0 : PRIVATE_WORKOUTS }, buzz: combineBuzz(cls, invited, events), events, bonus, interviews, expired };
}

function combineBuzz(cls, invited, events) {
  const top = cls.filter((p) => p.cons.mid <= 150 || p.cons.final <= 110);
  const short = (p) => `${p.name} (${p.pos}, ${p.bio?.college || "?"})`;
  const up = [...top].sort((a, b) => b.cons.mid - b.cons.final - (a.cons.mid - a.cons.final)).slice(0, 5).filter((p) => p.cons.mid > p.cons.final);
  const down = [...top].sort((a, b) => a.cons.mid - a.cons.final - (b.cons.mid - b.cons.final)).slice(0, 4).filter((p) => p.cons.final > p.cons.mid);
  const buzz = [];
  for (const e of events) buzz.push({ kind: "news", pid: e.pid, text: `${short(cls.find((p) => p.id === e.pid))}: ${e.label}.` });
  for (const p of up) buzz.push({ kind: "up", pid: p.id, text: `${short(p)} climbs from #${p.cons.mid} to #${p.cons.final}${p.combine ? ` after ${p.combGrade[0] === "A" ? "an eye-opening" : "a solid"} Combine (${p.combGrade})` : ""}.` });
  for (const p of down) buzz.push({ kind: "down", pid: p.id, text: `${short(p)} slides from #${p.cons.mid} to #${p.cons.final}${p.combine ? `; his ${p.combGrade} Combine raised questions` : "; he wasn't invited to the Combine"}.` });
  for (const t of COMBINE_TESTS.slice(0, 4)) {
    const best = [...invited].sort((a, b) => (t.lowGood ? a.combine[t.k] - b.combine[t.k] : b.combine[t.k] - a.combine[t.k]))[0];
    if (best) buzz.push({ kind: "best", pid: best.id, text: `${short(best)} topped the ${t.name.toLowerCase()} (${best.combine[t.k].toFixed(t.dp)}${t.unit ? ` ${t.unit}` : ""}).` });
  }
  return buzz;
}

const INTERVIEW_NOTES = {
  high: ["Film junkie: asked for our playbook before he left.", "Already knows his weaknesses and has a plan for them.", "Mature beyond his years. Teammates rave about him.", "Best whiteboard session we saw all week."],
  mid: ["Polite, coachable, a little reserved.", "Says the right things; work habits look solid.", "Solid on the whiteboard; needs reps to make it stick."],
  low: ["Coaches question his consistency in practice.", "Needs to grow up away from the facility.", "Struggled on the whiteboard and didn't seem bothered.", "The talent is there; the habits aren't yet."],
};

// What stood out in the room, good and bad, by trait.
const INTERVIEW_GOOD = {
  ethic: ["First one in the building at school and the last one out.", "Talks about his offseason routine like it's a hobby.", "Already working with a trainer on his weakest drill."],
  iq: ["Drew up his college playbook from memory on the whiteboard.", "Walked us through three coverages he saw on film without notes.", "Picked up our terminology in one session."],
  lead: ["Two-time team captain; teammates follow him.", "Took over the group drill and had everyone lined up.", "Coaches say the locker room was his."],
  coach: ["Took a correction mid-drill and fixed it on the next rep.", "Asked what he could do better before we told him.", "Owned every mistake we showed him on tape."],
};
const INTERVIEW_BAD = {
  ethic: ["Admitted he coasted through his first two seasons.", "Vague about his offseason routine.", "Coaches question his consistency in practice."],
  iq: ["Struggled on the whiteboard once the questions got specific.", "Mixed up his own team's terminology.", "Didn't recognize a basic coverage on film."],
  lead: ["Quiet in the room; let others do the talking.", "Blamed teammates for a bad loss.", "Not someone the room seems to follow yet."],
  coach: ["Got defensive when we showed him his mistakes.", "Pushed back on a coaching point twice.", "Wants to do it his way."],
};

// A sit-down at the Combine: a read on his work ethic, which tends to go with how fast he develops.
// Private workouts: Combine week only, a handful of prospects brought in for a day. Each one is a
// full workup (exact ratings, and from a major scout his development trait) without the points.
export const PRIVATE_WORKOUTS = 3;
export function privateWorkout(sc, sp, p, teams) {
  if (sp !== "combine") return { ok: false, msg: "Private workouts happen during Combine week.", sc, p };
  if ((sc.workoutsLeft ?? 0) <= 0) return { ok: false, msg: "You've used all your private workouts.", sc, p };
  if ((p.scout?.lvl || 0) >= 2) return { ok: false, msg: `${p.name} is already fully scouted.`, sc, p };
  const np = fileReport(sc, p, 2, teams);
  return { ok: true, msg: `${p.name} came in for a private workout: ${np.scout.who} has the full read.`, sc: { ...sc, workoutsLeft: sc.workoutsLeft - 1 }, p: np };
}
export function interviewProspect(sc, sp, p) {
  if (sp !== "combine") return { ok: false, msg: "Interviews happen at the Combine, before the draft starts.", sc, p };
  if (!p.combine) return { ok: false, msg: "He wasn't invited to the Combine.", sc, p };
  if (p.scout?.intv) return { ok: false, msg: "You've already interviewed him.", sc, p };
  if ((sc.interviewsLeft ?? 0) <= 0) return { ok: false, msg: "You've used all your interview slots.", sc, p };
  const r = stream(`${p.id}|intv`);
  const char = p.bust?.kind === "character";
  const v = ({ generational: 94, superstar: 90, star: 85, normal: 77, late: 73 }[devOf(p)] ?? 77) + r.gauss(0, 3.5) - (char ? 14 : 0);
  // Four reads from the room. Work ethic tracks how fast he'll develop; the football IQ read leans on
  // how good he already is; leadership and coachability wander more, and a character case drags them.
  const smart = ["QB", "LB", "S", "C"].includes(p.pos) ? 3 : 0;
  const traits = [
    { k: "ethic", label: "Work ethic", v },
    { k: "iq", label: "Football IQ", v: 70 + ((p.trueOvr ?? p.ovr ?? 70) - 60) * 0.45 + smart + r.gauss(0, 5) },
    { k: "lead", label: "Leadership", v: v - 3 + r.gauss(0, 6) - (char ? 6 : 0) },
    { k: "coach", label: "Coachability", v: v + r.gauss(0, 5) - (char ? 8 : 0) },
  ].map((t) => ({ ...t, grade: potGrade(t.v) }));
  const sorted = [...traits].sort((x, y) => y.v - x.v);
  const good = sorted.filter((t) => t.v >= 82).slice(0, 2).map((t) => r.pick(INTERVIEW_GOOD[t.k]));
  const bad = sorted.filter((t) => t.v < 74).slice(-2).map((t) => r.pick(INTERVIEW_BAD[t.k]));
  if (!good.length && !bad.length) good.push(r.pick(INTERVIEW_NOTES.mid));
  // A bad Combine: in the room you find out whether it was real.
  if (p.combDip === "real") bad.unshift("About the Combine: the numbers match his tape. He isn't as explosive as his reputation.");
  if (p.combDip === "fluke") good.unshift("About the Combine: he tested with a tight hamstring; his pro day numbers were back to normal. The tape says he's fine.");
  const avg = traits.reduce((s2, t) => s2 + t.v, 0) / traits.length;
  const verdict = char || avg < 70 ? "Concerning" : avg >= 86 ? "Impressive" : avg >= 78 ? "Solid" : "Mixed";
  const intv = { grade: potGrade(v), overall: potGrade(avg), verdict, traits: traits.map(({ label, grade }) => ({ label, grade })), good, bad, note: r.pick(INTERVIEW_NOTES[v >= 85 ? "high" : v >= 77 ? "mid" : "low"]), ...(char ? { flag: `Red flag from the interview: ${p.bust.why}.` } : {}) };
    const msg = `Interview with ${p.name}: ${verdict.toLowerCase()} (${intv.overall}). ${p.combDip === "real" ? bad[0] : p.combDip === "fluke" ? good[0] : good[0] || bad[0] || ""}${char ? " Red flag raised." : ""} Full notes are on his profile.`;
  return { ok: true, msg, sc: { ...sc, interviewsLeft: sc.interviewsLeft - 1 }, p: { ...p, scout: { ...(p.scout || { lvl: 0 }), intv } } };
}

// ---------- Draft day ----------

// AI teams blend their own scouts' (noisy) read with the consensus board, so they mostly follow
// the board and the sleepers your scouts find can still be there.
const DEV_EYE = { generational: 2, superstar: 1.2, star: 0.6, late: -0.3 };
export function aiDraftScore(p, gmStyle) {
  const potW = gmStyle === "win-now" ? 0.6 : gmStyle === "rebuilder" ? 0.85 : 0.78;
  const seen = p.truePot - gemGap(p) * (gmStyle === "analytics" ? 0.78 : 0.95) + bustGap(p) * (gmStyle === "analytics" ? 0.75 : 0.95);
  const own = (seen + (p.aiNoise || 0)) * potW + p.trueOvr * (1 - potW) + (p.gem || p.bust ? 0 : DEV_EYE[devOf(p)] || 0) + (gmStyle === "rebuilder" && p.age <= 21 ? 0.6 : 0);
  const trust = gmStyle === "analytics" ? 0.65 : 0.5;
  return kpValue(p, own) * trust + csScore(p) * (1 - trust) + gauss(0, SPECIALIST(p) ? 0.6 : 1.2);
}

const GRADE_ORDER = ["D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

// The analysts' instant grade: where he went against where the consensus board had him.
export function pickGrade(overall, rank) {
  if (overall <= 3 && rank <= overall) return "A";
  const rel = (overall - rank) / Math.max(3, overall * 0.3);
  return rel >= 1.2 ? "A+" : rel >= 0.45 ? "A" : rel >= 0.1 ? "A-" : rel >= -0.25 ? "B+" : rel >= -0.6 ? "B" : rel >= -1 ? "B-" : rel >= -1.5 ? "C+" : rel >= -2.2 ? "C" : rel >= -3 ? "C-" : "D";
}

export function pickTake(grade, overall, rank) {
  if (grade === "A+") return `Steal. The consensus board had him #${rank}.`;
  if (grade === "A") return overall <= rank ? `The best player available (consensus #${rank}).` : `Great value at #${overall} (consensus #${rank}).`;
  if (grade === "A-" || grade === "B+") return `About where he was expected to go (consensus #${rank}).`;
  if (grade === "B" || grade === "B-") return `A bit of a reach, but there's plenty to like (consensus #${rank}).`;
  if (grade[0] === "C") return `A reach. Most boards had him around #${rank}.`;
  return `Head-scratcher. The consensus board ranked him #${rank}.`;
}

export function classGrade(grades) {
  const gs = grades.filter((g) => GRADE_ORDER.includes(g));
  if (!gs.length) return null;
  return GRADE_ORDER[clamp(Math.round(avg(gs.map((g) => GRADE_ORDER.indexOf(g)))), 0, GRADE_ORDER.length - 1)];
}
export const gradeRank = (g) => GRADE_ORDER.indexOf(g);

// ---------- Your list ----------

export const listIds = (sc, yr) => (sc?.list?.yr === yr ? sc.list.ids : []);
export function toggleList(sc, yr, pid) {
  const ids = listIds(sc, yr);
  return { ...sc, list: { yr, ids: ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid] } };
}
export function moveOnList(sc, yr, pid, dir) {
  const ids = [...listIds(sc, yr)];
  const i = ids.indexOf(pid);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return sc;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return { ...sc, list: { yr, ids } };
}

// Who you take when the clock runs out: the top of your list, else the top of the board.
// The top player still on your own list, or null if you haven't listed anyone available.
export function listedPick(sc, yr, cls) {
  const avail = new Map(cls.map((p) => [p.id, p]));
  for (const id of listIds(sc, yr)) if (avail.has(id)) return avail.get(id);
  return null;
}
export function autoPickFrom(sc, yr, cls) {
  const avail = new Map(cls.map((p) => [p.id, p]));
  for (const id of listIds(sc, yr)) if (avail.has(id)) return avail.get(id);
  return [...cls].sort((a, b) => csRank(a) - csRank(b))[0] || null;
}

// ---------- Old saves ----------

// Saves from before the scouting overhaul: build a staff from the old scout, rank every class,
// and keep what the old reports said.
const OLD_TRAIT_GROUP = { "Eye for QBs": "QB", "Defensive Specialist": "DL", "OL Whisperer": "OL" };
export function loadScouting(d, faceFn) {
  const dc = d.dc || {};
  for (const cls of Object.values(dc)) {
    if (!Array.isArray(cls)) continue;
    for (const p of cls) {
      if (p.scout) continue;
      p.scout = { lvl: 0 };
      if ((p.scoutLvl || 0) >= 1) {
        const exact = p.scoutLvl >= 2;
        Object.assign(p, fileReportQuiet(p, exact, d.teams));
      }
    }
    rankClass(cls);
  }
  let sc = d.scouting;
  if (!sc) {
    sc = newScouting(d.yr || 2026, faceFn);
    if (d.myScout) {
      const o = d.myScout;
      const group = OLD_TRAIT_GROUP[o.trait] || "QB";
      sc.major = { id: o.id || "scold", name: o.name, age: 50, group, eval: clamp(Math.round(((o.evaluation || 70) + (o.accuracy || 70)) / 2), 50, 95), trait: null, bg: "Holdover from the old front office", face: o.face || null };
    }
    const wk = d.sp === "regular" ? d.wk || 0 : d.sp === "preseason" ? 0 : 18;
    sc = { ...sc, pts: SCOUT_PTS_START, wkPaid: 0 };
    sc = creditWeeks(sc, wk);
  }
  // Saves from the two-scout days get a second major and a second minor scout.
  if (!("major2" in sc) && !("minor2" in sc)) {
    const salt = `${d.yr || 2026}|staff2|${sc.poolN || 0}`;
    const free = HIRE_GROUPS.filter((g) => !staffOf(sc).some((x) => x.group === g));
    sc = { ...sc, major2: makeScout(`${salt}|major2`, free[0] || "DL", 68, faceFn), minor2: makeScout(`${salt}|minor2`, free[1] || "REC", 62, faceFn) };
  }
  // Saves from 4.56: scouts without a specialty get one.
  const giveGroup = (x) => (x && !x.group ? { ...x, group: HIRE_GROUPS[hashStr(String(x.id)) % HIRE_GROUPS.length] } : x);
  sc = { ...sc, ...Object.fromEntries(SCOUT_SLOTS.map((k) => [k, giveGroup(sc[k])])), pool: (sc.pool || []).map(giveGroup) };
  // Saves from the area-trip days: the trips and their points are gone (scouts work regions now).
  if ("rpts" in sc || "regions" in sc || "lost" in sc) {
    const { rpts, regions, regionsYr, lost, ...rest } = sc; // eslint-disable-line no-unused-vars
    sc = rest;
  }
  sc = { major: null, major2: null, minor: null, minor2: null, pool: [], pts: 0, wkPaid: 0, interviewsLeft: 0, ...sc };
  if (!sc.list || sc.list.yr !== d.yr) sc.list = { yr: d.yr, ids: sc.list?.yr === d.yr ? sc.list.ids : [] };
  // Saved mid-Combine from before the overhaul: grade what's there and open the interviews.
  const cur = dc[d.yr];
  if ((d.sp === "combine" || d.sp === "draft") && Array.isArray(cur) && cur.some((p) => p.combine && p.combGrade && p.combPct === undefined)) {
    const r = runCombine(sc, cur, { quiet: true });
    if (d.sp === "combine") sc = r.sc;
  }
  return sc;
}

// What an old-style report becomes: exact for old full scouting, a front-office estimate otherwise.
function fileReportQuiet(p, exact, teams) {
  const office = {};
  const np = fileReport(office, p, exact ? 2 : 1, teams || []);
  if (exact) {
    np.scout = { ...np.scout, eOvr: p.trueOvr, ePot: p.truePot, sd: 0, exact: true };
    np.scoutedOvr = p.trueOvr;
    np.scoutedPot = p.truePot;
    np.scoutLvl = 2;
  }
  return np;
}

// Your scouts' Combine shortlist: who to interview and bring in for a private workout. They
// weigh three things, the way a real staff builds its visit list:
//  - where you pick: only prospects expected to be there (the board has them a little ahead of or
//    behind the slot). Stars long gone before you pick are left off unless you trade up.
//  - what you need: your thinnest positions first.
//  - what they think of him: a prospect your scouts grade above the others in that range (or a
//    sleeper they've spotted) is worth a closer look; one they grade below it isn't.
//  - what they don't know yet: before a premium pick (rounds 1-2) they want to know more about
//    anyone they've only got a rough read on, a red flag, a poor Combine, or a raw project.
//   slots: your remaining picks' overall numbers (projected from the standings before the order
//   is set); isNeed(p): one of your biggest needs. Returns [{ p, slot, why: [..], interview, workout }].
export function scoutsShortlist(sc, cls, slots, { isNeed = () => false, max = 8 } = {}) {
  const picks = [...new Set(slots)].filter((s) => s > 0).sort((a, b) => a - b).slice(0, 3);
  const out = [];
  const taken = new Set();
  picks.forEach((slot, k) => {
    const premium = slot <= 64;
    // a first-round pick looks a little ahead (someone may slide) and further behind (the board
    // isn't the league); later picks look wider
    const lo = Math.max(1, slot - (k === 0 ? 8 : 12)), hi = slot + (k === 0 ? 14 : 24);
    const near = cls.filter((p) => !p.drafted && !taken.has(p.id) && csRank(p) >= lo && csRank(p) <= hi).map((p) => ({ p, read: prospectRead(sc, p) }));
    const pots = near.map((x) => x.read.potV).filter((v) => v != null).sort((a, b) => a - b);
    const mid = pots.length ? pots[Math.floor(pots.length / 2)] : null;
    const pool = near.map(({ p, read }) => {
      const interview = !p.scout?.intv, workout = read.lvl < 2;
      const need = isNeed(p), dip = !!p.combDip, flag = read.flag && !p.scout?.intv;
      const rel = read.potV != null && mid != null ? read.potV - mid : 0; // how they grade him against the rest of the range
      const likes = read.sleeper || read.hunch || rel >= 3;
      const rough = read.lvl === 0, raw = read.potV != null && read.ovrV != null && read.potV - read.ovrV >= 14;
      const unsure = (rough ? 2 : read.lvl < 2 ? 1 : 0) + (flag ? 3 : 0) + (dip ? 2 : 0) + (raw ? 1 : 0);
      const score = (need ? 6 : 0) + Math.max(-4, Math.min(4, rel / 1.5)) + (read.sleeper ? 3 : read.hunch ? 2 : 0) + unsure * (premium ? 1.2 : 0.6) + (interview ? 1 : 0) - Math.abs(csRank(p) - slot) / 8;
      return { p, slot, read, interview, workout, need, dip, flag, likes, rel, rough, raw, premium, score };
    })
      .filter((x) => (x.interview || x.workout) && !(x.rel <= -4 && !x.need && !x.likes))
      .sort((a, b) => b.score - a.score)
      .slice(0, k === 0 ? 4 : 2);
    for (const x of pool) taken.add(x.p.id), out.push(x);
  });
  return out.slice(0, max).map(({ p, slot, read, interview, workout, need, dip, flag, likes, rel, rough, raw, premium }) => {
    const r = csRank(p);
    const why = [r <= slot - 3 ? `board #${r}: could slide to your #${slot}` : r >= slot + 6 ? `board #${r}: there at #${slot}, maybe later` : `board #${r}: right around your #${slot}`];
    if (need) why.push(`fills a need (${posTag(p)})`);
    if (read.sleeper) why.push("your scouts think he's a sleeper");
    else if (read.hunch) why.push("your scouts have a hunch about him");
    else if (likes && read.grade) why.push(`your scouts rate him above the others in this range (${read.grade})`);
    else if (rel <= -3 && read.grade) why.push(`your scouts are lukewarm (${read.grade})`);
    const pickWord = slot <= 32 ? "a 1st" : slot <= 64 ? "a 2nd" : "this pick";
    if (flag) why.push(`red flag: get the story before spending ${pickWord}`);
    else if (dip) why.push("tested poorly: a real concern or a bad day?");
    else if (rough && premium) why.push(`only a rough read so far: know more before spending ${pickWord}`);
    else if (raw && premium) why.push("a raw project: is the work ethic there?");
    else if (!interview) why.push("interviewed; a workout gets his exact ratings");
    return { p, slot, why, interview, workout };
  });
}

// The best-fit assignment: each scout goes where his specialty is a region's strength, best
// scouts first; whoever's left covers the regions nobody has yet (biggest first). rep is
// regionReport(cls). Returns areas in the shape areasOf gives.
export function suggestAreas(sc, rep) {
  const slots = SCOUT_SLOTS.filter((k) => sc?.[k]).sort((a, b) => sc[b].eval - sc[a].eval);
  const out = Object.fromEntries(SCOUT_SLOTS.map((k) => [k, []])), used = new Set();
  const bySize = [...AREA_KEYS].sort((a, b) => (rep?.[b]?.n || 0) - (rep?.[a]?.n || 0));
  for (const k of slots) for (let i = 0; i < areaCap(k); i++) {
    const fit = bySize.find((r) => !used.has(r) && rep?.[r]?.strong?.g === sc[k].group);
    if (fit) { out[k].push(fit); used.add(fit); }
  }
  for (const k of slots) while (out[k].length < areaCap(k)) {
    const r = bySize.find((x) => !used.has(x)) || bySize.find((x) => !out[k].includes(x));
    out[k].push(r); used.add(r);
  }
  return areasOf({ ...sc, areas: out, areasManual: false });
}

// Assign a region to one scout (slot), or to nobody (slot null). A region has one scout; a scout
// who is already full gives up his first region to make room.
export function setRegionScout(sc, sp, region, slot, yr) {
  if (!staffWindowOpen(sp)) return { ok: false, msg: "Your scouts are already on the road. You can move them in free agency or the preseason.", sc };
  if (!REGIONS[region] || (slot && !sc?.[slot])) return { ok: false, msg: "That scout isn't on your staff.", sc };
  const ar = areasOf(sc);
  const areas = Object.fromEntries(SCOUT_SLOTS.map((k) => [k, ar[k].filter((r) => r !== region)]));
  let dropped = null;
  if (slot) {
    if (areas[slot].length >= areaCap(slot)) dropped = areas[slot].shift();
    areas[slot].push(region);
  }
  const nsc = { ...sc, areas, areasManual: true, areasYr: yr != null ? areaSeason(sp, yr) : sc.areasYr };
  const msg = slot ? `${sc[slot].name} will cover the ${regionName(region)}.${dropped ? ` He leaves the ${regionName(dropped)}.` : ""}` : `Nobody covers the ${regionName(region)} now.`;
  return { ok: true, msg, sc: nsc };
}

// ---------- Scout report card ----------
// When the draft starts, each scout is graded on the prospects he led the reads on (his regions):
// how close his ceiling reads were, the sleepers and red flags he caught, the special development
// traits he called early, and the hunches that were wrong. Returns { [slot]: card } for this class.
const SPECIAL_DEV = ["generational", "superstar", "star"];
export const reportGrade = (s) => (s >= 93 ? "A+" : s >= 88 ? "A" : s >= 84 ? "A-" : s >= 80 ? "B+" : s >= 76 ? "B" : s >= 72 ? "B-" : s >= 68 ? "C+" : s >= 64 ? "C" : s >= 60 ? "C-" : "D");
export function scoutReportCard(sc, cls) {
  const top = [...(cls || [])].sort((a, b) => csRank(a) - csRank(b)).slice(0, 224);
  const out = {};
  for (const slot of SCOUT_SLOTS) {
    const x = sc?.[slot];
    if (!x) continue;
    const mine = top.filter((p) => coverage(sc, p).scout?.id === x.id);
    let err = 0, n = 0, gems = 0, found = 0, busts = 0, caught = 0, devs = 0, called = 0, wrong = 0;
    for (const p of mine) {
      const r = prospectRead(sc, p);
      if (r.potV != null) { err += Math.abs(r.potV - p.truePot); n++; }
      if (p.gem) { gems++; if (r.sleeper || r.hunch) found++; } else if (r.hunch || r.sleeper) wrong++;
      if (p.bust) { busts++; if (r.flag) caught++; }
      if (SPECIAL_DEV.includes(devOf(p))) { devs++; if (r.dev === devOf(p)) called++; }
    }
    if (!n) { out[slot] = { id: x.id, name: x.name, group: x.group, n: 0, grade: null }; continue; }
    const miss = err / n, rate = (a, b) => (b ? a / b : 0.5);
    const score = clamp(112 - 9 * miss + 12 * (rate(found, gems) - 0.5) + 10 * (rate(caught, busts) - 0.5) + 8 * (rate(called, devs) - 0.5) - 3 * wrong, 30, 100);
    out[slot] = { id: x.id, name: x.name, group: x.group, n, miss: +miss.toFixed(1), gems, found, busts, caught, devs, called, wrong, score: Math.round(score), grade: reportGrade(score) };
  }
  return out;
}
// Save this class's report card (once per draft year).
export const fileReportCard = (sc, cls, yr) => (sc?.reports?.[yr] ? sc : { ...sc, reports: { ...(sc?.reports || {}), [yr]: scoutReportCard(sc, cls) } });
