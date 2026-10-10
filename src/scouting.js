// Scouting: your scouting staff (two major and two minor scouts), what they can tell you about
// draft prospects, the consensus big board, the NFL Combine, development traits, and the
// analysts' instant grades on draft day.
//
// Reads that must not change between renders (a scout's general idea of a prospect, the
// report he files) draw from keyed streams, so the same prospect always reads the same way.

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
export const COMBINE_INVITES = 180;
export const COMBINE_INTERVIEWS = 4;

// ---------- Scouting staff ----------

export const SCOUT_GROUPS = { QB: "Quarterbacks", RB: "Running backs", REC: "Receivers & tight ends", OL: "Offensive line", DL: "Defensive line", LB: "Linebackers", DB: "Defensive backs", ST: "Specialists" };
const HIRE_GROUPS = ["QB", "RB", "REC", "OL", "DL", "LB", "DB"];
const OL = new Set(["LT", "LG", "C", "RG", "RT"]);
export const scoutGroup = (pos) =>
  pos === "QB" ? "QB" : pos === "RB" ? "RB" : pos === "WR" || pos === "TE" ? "REC" : OL.has(pos) ? "OL" : pos === "DL" ? "DL" : pos === "LB" ? "LB" : pos === "CB" || pos === "S" ? "DB" : "ST";

const MAJOR_DESC = "Covers one position group in depth: sharp reports, exact ratings after a full workup, and development traits.";
const MINOR_DESC = "Covers a group more loosely: a general idea of every prospect there and rougher reports. No development traits.";
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
  projector: { name: "Projector", desc: "Spots development traits a step earlier." },
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

// Scouts looking for work: two for each position group.
export function refreshScoutPool(sc, year, faceFn) {
  const n = (sc.poolN || 0) + 1;
  const pool = [...HIRE_GROUPS, ...HIRE_GROUPS].map((g, i) => makeScout(`${year}|${n}|pool|${i}`, g, i < HIRE_GROUPS.length ? 75 : 68, faceFn));
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
  // Scouts can share a group: more eyes read it sharper and leave more of the class to the front office.
  const same = SCOUT_SLOTS.filter((k) => k !== role && sc[k]?.group === s.group).length;
  const old = sc[role];
  const pool = sc.pool.filter((x) => x.id !== s.id);
  if (old) pool.push(old);
  const msg = `${s.name} is your new ${SCOUT_ROLES[role].name.toLowerCase()} (${SCOUT_GROUPS[s.group].toLowerCase()}).${same ? ` ${same + 1} of your scouts now work ${SCOUT_GROUPS[s.group].toLowerCase()}: sharper reads there, and fewer groups covered.` : ""}`;
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
  return { ok: true, msg: "Your major and minor scouts have switched roles.", sc: { ...sc, major: sc.minor || null, minor: sc.major || null, major2: sc.minor2 || null, minor2: sc.major2 || null } };
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
  return { ...sc, pts, rpts: (sc.rpts ?? RPTS_START) + (wk - paid) * RPTS_WEEKLY, wkPaid: wk };
}

// A new season: points left over from last year's class expire.
export const startScoutingYear = (sc, year) => ({ ...sc, pts: SCOUT_PTS_START, rpts: RPTS_START, regions: {}, regionsYr: year, wkPaid: 0, interviewsLeft: 0, list: { yr: year, ids: [] } });

// ---------- Regional scouting ----------
// Your area scouts work conferences, not players. Every trip to a region gives you a rough read
// on every prospect from there; more trips sharpen it, and from the third trip on they start
// seeing through the board to that region's sleepers. It's volume, not depth: individual reports
// and full workups are still your position scouts' job (and your regular scouting points).
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
export function draftCollege(rand = Math.random) {
  let x = rand() * 100;
  for (const [k, w] of REGION_WEIGHT) { if ((x -= w) <= 0) { const list = k === "OTH" ? FCS_SCHOOLS : REGIONS[k].schools; return list[Math.floor(rand() * list.length)]; } }
  return REGIONS.SEC.schools[0];
}
export const regionOf = (p) => REGION_OF[p?.bio?.college] || "OTH";
export const regionName = (k) => REGIONS[k]?.name || "Independents & FCS";
// About 32 area points a season (16 trips): four of the six regions inside out, so where you
// send them is still a real choice.
export const RPTS_START = 6, RPTS_WEEKLY = 1, RPTS_COMBINE = 8, RTRIP_COST = 2, MAX_TRIPS = 4;
const TRIP_SD = [Infinity, 6, 4.5, 3.2, 2.4];

export function scoutRegion(sc, sp, region, classYr, draftYr) {
  if (classYr !== draftYr || sp === "freeagency" || sp === "draft") return { ok: false, msg: "Area scouts work the upcoming class, before the draft.", sc };
  const regions = sc.regionsYr === classYr ? sc.regions || {} : {};
  const trips = regions[region] || 0;
  if (trips >= MAX_TRIPS) return { ok: false, msg: `Your area scouts already know ${regionName(region)} inside out.`, sc };
  const rp = sc.rpts ?? RPTS_START;
  if (rp < RTRIP_COST) return { ok: false, msg: `Not enough area-scout points (a trip takes ${RTRIP_COST}; you earn ${RPTS_WEEKLY} a week).`, sc };
  return { ok: true, msg: `Area scouts went through ${regionName(region)} (trip ${trips + 1} of ${MAX_TRIPS}).`, sc: { ...sc, rpts: rp - RTRIP_COST, regions: { ...regions, [region]: trips + 1 }, regionsYr: classYr } };
}
export const tripsTo = (sc, p) => (sc?.regionsYr === p.draftYear ? sc.regions?.[regionOf(p)] || 0 : 0);

// What your area scouts think of a prospect from a region they've worked (null if they haven't).
export function regionRead(sc, p) {
  const t = Math.min(MAX_TRIPS, tripsTo(sc, p));
  if (!t) return null;
  const sd = TRIP_SD[t];
  const see = t >= 4 ? 0.6 : t === 3 ? 0.35 : 0;
  const pot = seenPot(p, see) + clamp(stream(`${p.id}|reg|${t}`).gauss(0, sd), -1.6 * sd, 1.6 * sd);
  const hunch = !!p.gem && t >= 2 && stream(`${p.id}|reghunch`).next() < 0.2 * t;
  const flag = !!p.bust && t >= 3 && stream(`${p.id}|regflag`).next() < (t >= 4 ? 0.7 : 0.4);
  // After the fourth trip they've seen enough of him to put a number on him today too.
  const ovr = t >= MAX_TRIPS ? Math.round(clamp(p.trueOvr + clamp(stream(`${p.id}|regovr`).gauss(0, 2), -3, 3), 30, 99)) : null;
  return { pot, sd, trips: t, ovr, grade: potGrade(pot), tier: projection(p.pos, pot), hunch, flag, sleeper: hunch && t >= 4, region: regionOf(p), who: `Your area scouts (${regionName(regionOf(p))})` };
}

// ---------- What your scouts know ----------

const OFFICE_EVAL = 60;

// Which of your scouts covers a prospect: "major", "minor", or "office" (nobody, so the front
// office's generalists handle it). With several scouts on one group the best major scout leads and
// the rest are second opinions (`second` is the next one, `others` all of them).
export function coverage(sc, p) {
  const g = scoutGroup(p.pos);
  const on = SCOUT_SLOTS.filter((k) => sc?.[k]?.group === g).map((k) => ({ kind: slotKind(k), scout: sc[k] }))
    .sort((a, b) => (a.kind === b.kind ? b.scout.eval - a.scout.eval : a.kind === "major" ? -1 : 1));
  if (!on.length) return { role: "office", scout: null };
  const others = on.slice(1).map((x) => x.scout);
  return { role: on[0].kind, scout: on[0].scout, ...(others.length ? { second: others[0], others } : {}) };
}

// second: another scout (or a list of them) on the same group. More eyes read better than the
// best one alone, and anyone's specialty counts.
export function scoutEval(scout, p, second) {
  if (!scout) return OFFICE_EVAL;
  const more = [].concat(second || []);
  let e = more.length ? Math.max(scout.eval, ...more.map((x) => x.eval)) + 6 + 2 * (more.length - 1) : scout.eval;
  const has = (t) => scout.trait === t || more.some((x) => x.trait === t);
  if (has("sharp")) e += 8;
  if (has("smallschool") && isSmallSchool(p)) e += 12;
  return clamp(e, 40, 99);
}

// How far off a read on POT can be (OVR reads are a bit tighter). Level 0 is the passive
// "general idea" a scout has of everyone in his group; 1 is a scouting report; 2 is a full
// workup. Nobody but the major scout gets to exact numbers.
export function readSd(role, lvl, ev) {
  const a = (100 - ev) / 50;
  if (role === "major") return lvl >= 2 ? 0 : lvl === 1 ? 0.9 + 1.6 * a : 2.2 + 2.6 * a;
  if (role === "minor") return lvl >= 2 ? 1 + 1.4 * a : lvl === 1 ? 1.8 + 2.4 * a : 3.2 + 3 * a;
  return lvl >= 2 ? 2.6 : lvl === 1 ? 4.2 : Infinity;
}

export function scoutCost(p) {
  const l = p?.scout?.lvl || 0;
  return l === 0 ? 1 : l === 1 ? 2 : 0;
}

// Would this report on the prospect reveal his development trait?
function seesDev(cov, lvl) {
  if (cov.role === "major") return lvl >= 2 || [cov.scout, ...(cov.others || [])].some((x) => x.trait === "projector");
  if (cov.role === "minor") return lvl >= 2 && cov.scout.trait === "projector";
  return false;
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
    dev: seesDev(cov, lvl) ? devOf(p) : prev.dev || null,
    skills,
    notes: p.bust ? { ...notesFor(p, skills, r), flag: `🚩 Red flag: ${p.bust.why}. ${cov.role === "office" ? "Our people" : "Your scout"} sees a high bust risk.` } : p.gem ? { ...notesFor(p, skills, r), gem: `💎 Sleeper: ${p.gem.why}. ${cov.role === "office" ? "Our people think" : "Your scout thinks"} he's much better than where the board has him.` } : notesFor(p, skills, r),
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

// The general idea your scouts have of every prospect in their group, without a report. One
// scout has the public read of a sleeper and now and then a hunch. A deep, sharp crew on one
// group (several good scouts all working it) sees through the board: it flags that group's
// sleepers and spots the special development traits early, before you spend a point.
export function crewOf(sc, p) {
  const cov = coverage(sc, p);
  if (cov.role === "office") return null;
  const n = 1 + (cov.others?.length || 0), ev = scoutEval(cov.scout, p, cov.others);
  return { cov, n, ev, see: clamp((ev - 75) / 24, 0, 1) * Math.min(1, 0.25 + 0.25 * n) };
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
  const knack = Math.min(0.97, (cov.role === "major" ? 0.5 : 0.3) + 0.12 * (n - 1) + clamp((ev - 80) / 50, 0, 0.3) + (staffHas(sc, "smallschool") && isSmallSchool(p) ? 0.3 : 0) + (staffHas(sc, "sharp") ? 0.1 : 0));
  const hunch = p.gem ? h < knack : (p.cons?.mid ?? 0) > 90 && h < 0.02 / n;
  // A red flag before a report: a deep crew sometimes catches what the board missed.
  const flag = !!p.bust && see >= 0.4 && stream(`${p.id}|${cov.scout.id}|flag`).next() < knack;
  // A crew that sees through the board says so outright: "he's a sleeper".
  const sleeper = !!p.gem && hunch && see >= 0.5;
  // Special development traits, spotted early by a deep crew (two or more scouts on the group).
  const d = devOf(p);
  const spot = n >= 2 && ["generational", "superstar", "star"].includes(d) && stream(`${p.id}|crew|dev`).next() < clamp((ev - 80) / 19, 0, 1) * Math.min(0.95, 0.2 + 0.22 * n);
  return { pot, grade: potGrade(pot), tier: projection(p.pos, pot), by: cov.role, who: n > 1 ? `Your ${n} scouts on ${SCOUT_GROUPS[scoutGroup(p.pos)].toLowerCase()}` : cov.scout.name, hunch, sleeper, flag, dev: spot ? d : null, crew: n };
}

// Everything the UI shows about a prospect, from your point of view.
export function prospectRead(sc, p) {
  const s = p.scout || { lvl: 0 };
  const cov = coverage(sc, p);
  const has = s.lvl > 0 && s.eOvr != null;
  const gen0 = has ? null : generalIdea(sc, p);
  const reg = has ? null : regionRead(sc, p);
  // The sharper of your position scouts' general idea and your area scouts' regional read.
  const genSd = gen0 ? readSd(cov.role, 0, scoutEval(cov.scout, p, cov.others)) : Infinity;
  const gen = gen0 && reg ? (reg.sd < genSd ? { ...gen0, pot: reg.pot, grade: reg.grade, tier: reg.tier, who: reg.who, hunch: gen0.hunch || reg.hunch, sleeper: gen0.sleeper || reg.sleeper, flag: gen0.flag || reg.flag } : { ...gen0, hunch: gen0.hunch || reg.hunch, sleeper: gen0.sleeper || reg.sleeper, flag: gen0.flag || reg.flag }) : gen0 || (reg && { ...reg, by: "region", dev: null });
  const potV = has ? s.ePot : gen ? gen.pot : null;
  const regOvr = !has && reg?.ovr != null ? reg.ovr : null;
  return {
    lvl: s.lvl || 0,
    cov: cov.role,
    trips: reg?.trips || 0,
    region: regionOf(p),
    regional: !!reg && (gen?.by === "region" || gen?.who === reg.who),
    scout: cov.scout,
    second: cov.second || null,
    others: cov.others || [],
    ovr: has ? (s.exact ? `${s.eOvr}` : `~${s.eOvr}`) : regOvr != null ? `~${regOvr}` : "??",
    pot: has ? (s.exact ? `${s.ePot}` : `~${s.ePot}`) : gen ? gen.grade : "??",
    ovrV: has ? s.eOvr : regOvr,
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

const LETTERS = [[92, "A+"], [88, "A"], [85, "A-"], [82, "B+"], [79, "B"], [76, "B-"], [73, "C+"], [70, "C"], [67, "C-"], [-Infinity, "D"]];
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
  power: ["Booming punts that flip the field", "Short punts give up field position"],
  coffin: ["Pins returners inside the 10", "Sails punts into the end zone"],
};
const KICKER_NOTES = { accuracy: ["Splits the uprights consistently", "Sprays kicks from mid-range"] };
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
export function rollDev(id, pot = 75) {
  const x = stream(`${id}|dev`).next();
  const lift = clamp((pot - 78) / 100, -0.06, 0.1);
  if (x < 0.006 + lift * 0.08) return "generational";
  if (x < 0.04 + lift * 0.4) return "superstar";
  if (x < 0.2 + lift) return "star";
  if (x < 0.38 + lift) return "late";
  return "normal";
}
export const devOf = (p) => p.dev || rollDev(p.id, p.truePot ?? p.pot);

// Extra growth in the off-season from a young player's development trait (age is his age
// during the season just finished).
export function devGrowth(p, age) {
  const d = devOf(p);
  if (age > 26) return { ovr: 0, pot: 0 };
  if (d === "generational") return { ovr: rint(2, 3), pot: rint(1, 3) };
  if (d === "superstar") return { ovr: rint(1, 2), pot: rint(0, 2) };
  if (d === "star") return { ovr: rint(0, 1), pot: rint(0, 1) };
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
  [...cls].sort((a, b) => b.cons.score - a.cons.score).forEach((p, i) => (p.cons.mid = i + 1));
  return sortByRank(cls);
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
  const n = 3 + (r.chance(0.5) ? 1 : 0) + (r.chance(0.25) ? 1 : 0);
  const pool = cls.filter((p) => !p.gem && !(p.scout?.lvl > 0) && (p.cons?.mid ?? 999) <= 70 && p.pos !== "K" && p.pos !== "P");
  for (let i = 0; i < n && pool.length; i++) {
    const p = pool.splice(Math.floor(r.next() * pool.length), 1)[0];
    const target = p.truePot - r.int(8, 15);
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
export const csRank = (p) => p.cons?.final ?? p.cons?.mid ?? 999;
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
export function runCombine(sc, cls, { quiet = false } = {}) {
  rankClass(cls);
  plantGems(cls);
  plantBusts(cls);
  const invited = cls.filter((p) => p.combine);
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
    p.cons.fscore = p.cons.score + (p.combine ? (p.combPct - 0.5) * 2.6 : -0.4) + (p.newsDelta || 0) + stream(`${p.id}|final`).gauss(0, 0.9);
  }
  [...cls].sort((a, b) => b.cons.fscore - a.cons.fscore).forEach((p, i) => (p.cons.final = i + 1));
  sortByRank(cls);
  const bonus = quiet ? 0 : SCOUT_PTS_COMBINE + (staffHas(sc, "combine") ? 3 : 0);
  const interviews = COMBINE_INTERVIEWS + (staffHas(sc, "character") ? 2 : 0);
  // Pro days and all-star games: one more round of area trips before the draft.
  return { sc: { ...sc, pts: (sc.pts || 0) + bonus, rpts: (sc.rpts ?? RPTS_START) + (quiet ? 0 : RPTS_COMBINE), interviewsLeft: interviews }, buzz: combineBuzz(cls, invited, events), events, bonus, interviews };
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

// A sit-down at the Combine: a read on his work ethic, which tends to go with how fast he develops.
export function interviewProspect(sc, sp, p) {
  if (sp !== "combine") return { ok: false, msg: "Interviews happen at the Combine, before the draft starts.", sc, p };
  if (!p.combine) return { ok: false, msg: "He wasn't invited to the Combine.", sc, p };
  if (p.scout?.intv) return { ok: false, msg: "You've already interviewed him.", sc, p };
  if ((sc.interviewsLeft ?? 0) <= 0) return { ok: false, msg: "You've used all your interview slots.", sc, p };
  const r = stream(`${p.id}|intv`);
  const char = p.bust?.kind === "character";
  const v = ({ generational: 94, superstar: 90, star: 85, normal: 77, late: 73 }[devOf(p)] ?? 77) + r.gauss(0, 3.5) - (char ? 14 : 0);
  const intv = { grade: potGrade(v), note: r.pick(INTERVIEW_NOTES[v >= 85 ? "high" : v >= 77 ? "mid" : "low"]), ...(char ? { flag: `🚩 Red flag from the interview: ${p.bust.why}.` } : {}) };
  return { ok: true, msg: `Interview with ${p.name}: work ethic ${intv.grade}.`, sc: { ...sc, interviewsLeft: sc.interviewsLeft - 1 }, p: { ...p, scout: { ...(p.scout || { lvl: 0 }), intv } } };
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
      if (sc.minor?.group === group) sc.minor = { ...sc.minor, group: group === "DB" ? "DL" : "DB" };
    }
    const wk = d.sp === "regular" ? d.wk || 0 : d.sp === "preseason" ? 0 : 18;
    sc = { ...sc, pts: SCOUT_PTS_START, wkPaid: 0 };
    sc = creditWeeks(sc, wk);
  }
  // Saves from the two-scout days get a second major and a second minor scout on groups nobody covers yet.
  if (!("major2" in sc) && !("minor2" in sc)) {
    const free = HIRE_GROUPS.filter((g) => !staffOf(sc).some((x) => x.group === g));
    const salt = `${d.yr || 2026}|staff2|${sc.poolN || 0}`;
    sc = { ...sc, major2: makeScout(`${salt}|major2`, free[0] || "DL", 68, faceFn), minor2: makeScout(`${salt}|minor2`, free[1] || "REC", 62, faceFn) };
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
