// Portrait bank for fictional players: 48 media-day photos (public/portraits), eight per build
// group (QB, WR, OL, DL, LB, DB). A generated player's name and face are chosen together, so they
// fit each other: the portrait first (spread across the league, weighted toward each position's
// real makeup), then a name from the name pools that go with it. A fictional player already in a
// save keeps his name and gets the portrait that fits it best. Either way the portrait id is saved
// on his face (face.pid) once and never changes: not on a trade, a position change or a new season.
//
// Real people never get one: real players show their ESPN photo (headshots.js), and a real player
// or prospect without a photo keeps the drawn face. A fictional photo never stands in for a real man.

// Each portrait: its group and the heritage(s) its subject was described with (GENERATION_NOTES).
export const PORTRAITS = [
  ["WR_01", "black"], ["WR_02", "white"], ["WR_03", "black latino"], ["WR_04", "asian"], ["WR_05", "black"], ["WR_06", "latino"], ["WR_07", "white"], ["WR_08", "black"],
  ["QB_01", "white"], ["QB_02", "black"], ["QB_03", "latino"], ["QB_04", "black white"], ["QB_05", "white"], ["QB_06", "pacific"], ["QB_07", "asian"], ["QB_08", "black"],
  ["OL_01", "white"], ["OL_02", "black"], ["OL_03", "pacific"], ["OL_04", "latino"], ["OL_05", "white"], ["OL_06", "black"], ["OL_07", "asian white"], ["OL_08", "white"],
  ["DL_01", "black"], ["DL_02", "white"], ["DL_03", "pacific"], ["DL_04", "black"], ["DL_05", "latino"], ["DL_06", "black white"], ["DL_07", "white"], ["DL_08", "black"],
  ["LB_01", "black"], ["LB_02", "white"], ["LB_03", "latino"], ["LB_04", "black asian"], ["LB_05", "pacific"], ["LB_06", "white"], ["LB_07", "black"], ["LB_08", "mena"],
  ["DB_01", "black"], ["DB_02", "white"], ["DB_03", "latino"], ["DB_04", "black"], ["DB_05", "black white"], ["DB_06", "asian"], ["DB_07", "black"], ["DB_08", "white"],
].map(([id, h]) => ({ id, group: id.slice(0, 2), tags: h.split(" ") }));
const BY_ID = Object.fromEntries(PORTRAITS.map((p) => [p.id, p]));

// Which build groups suit each position (the bank's own mapping).
const POOLS = {
  QB: ["QB"], WR: ["WR", "DB"], RB: ["WR", "DB", "LB"], FB: ["LB", "DL"], TE: ["LB", "WR"],
  LT: ["OL"], LG: ["OL"], C: ["OL"], RG: ["OL"], RT: ["OL"], OL: ["OL"],
  DL: ["DL"], EDGE: ["DL", "LB"], DT: ["DL"], LE: ["DL"], RE: ["DL"],
  LB: ["LB"], CB: ["DB"], S: ["DB"], K: ["QB", "WR"], P: ["QB", "WR"],
};
// Roughly how each build group's players break down in the NFL, so a generated league looks like
// one (the bank itself has every look in every group; these weight how often each comes up).
const MAKEUP = {
  WR: { black: 0.74, white: 0.14, latino: 0.05, asian: 0.02, pacific: 0.03, mena: 0.02 },
  DB: { black: 0.76, white: 0.13, latino: 0.04, asian: 0.02, pacific: 0.03, mena: 0.02 },
  QB: { white: 0.5, black: 0.36, latino: 0.05, pacific: 0.05, asian: 0.04 },
  OL: { white: 0.48, black: 0.33, pacific: 0.11, latino: 0.05, asian: 0.03 },
  DL: { black: 0.6, white: 0.18, pacific: 0.13, latino: 0.06, mena: 0.03 },
  LB: { black: 0.55, white: 0.24, pacific: 0.1, latino: 0.05, mena: 0.03, asian: 0.03 },
};
// each portrait's weight: its look's share of the group, split among the portraits with that look
const WEIGHT = (() => {
  const w = {};
  for (const g of Object.keys(MAKEUP)) {
    const inG = PORTRAITS.filter((p) => p.group === g), key = (p) => p.tags.join(" ");
    const share = (p) => p.tags.reduce((t, h) => t + (MAKEUP[g][h] || 0.01), 0) / p.tags.length / (p.tags.length > 1 ? 2 : 1);
    for (const p of inG) w[p.id] = share(p) / inG.filter((q) => key(q) === key(p)).length;
  }
  return w;
})();

// Name pools by heritage. COMMON names are shared by Black and white players (and are usual first
// names for Asian American players too).
const COMMON_FIRST = ["Jordan", "Cameron", "Brandon", "Michael", "Daniel", "David", "James", "Robert", "William", "Chris", "Ryan", "Justin", "Aaron", "Josh", "Isaiah", "Elijah", "Micah", "Nick", "Chase", "Devin", "Kenneth", "Brian", "Christian", "Jonah", "Dylan", "Kyle", "Eric", "Kevin", "Jason", "Anthony", "Nathan", "Adam", "Tony", "Danny", "Joe", "Sam"];
const COMMON_LAST = ["Smith", "Brown", "Jones", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "White", "Martin", "Thompson", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Hill", "Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Roberts", "Turner", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris", "Reed", "Bell", "Cooper", "Howard", "Ward", "Gray", "Watson", "Brooks", "Sanders", "Price", "Ross", "Perry", "Powell", "Long", "Butler", "Foster", "Bryant", "Russell", "Griffin", "Hayes", "Ford", "Graham", "Wallace", "Cole", "Owens", "Ellis", "Gibson", "Marshall", "Murray", "Wells", "Tucker", "Porter", "Hunter", "Henry", "Mason", "Warren", "Dixon", "Gordon", "Shaw", "Holmes", "Grant", "Hart", "Knight", "Lane", "Lawrence", "Little", "Miles", "Oliver", "Page", "Sharp", "Strong", "Todd", "Woods", "Lee"];
export const NAMES = {
  black: {
    first: ["Jaylen", "Malik", "DeShawn", "Darius", "Devonte", "Lamar", "Jalen", "DeAndre", "Khalil", "Tyreek", "Davante", "Rashawn", "Dameon", "Jaire", "Trevon", "Marlon", "Derwin", "Amari", "Javon", "Rashan", "Tremaine", "Terrance", "Raheem", "Treylon", "Shemar", "Mykel", "Savion", "Keenan", "Jabari", "Kendrick", "Desmond", "Cordell", "Diontae", "Mekhi", "Karon", "Tavion", "Reggie", "Jerome", "Cedric", "Antoine", "Terrell", "Dwayne", "Reginald", "Kareem", "Jamarcus", "Jarvarius", "Demarcus", "Keshawn", "Tyrique", "Zaire", "Deion", "Trayvon", "Xavier", "Marcus", "Andre", "Darnell", "Jamal", "Quentin", "Tre", "Zion", "Dorian", "Dante", "Kenyon", "Jaquan", "Tyshawn", "Lamarcus", "Montez"],
    last: ["Jackson", "Washington", "Robinson", "Williams", "Johnson", "Harris", "Coleman", "Jenkins", "Gaines", "Glover", "Booker", "Mack", "McDaniel", "McKinney", "Singleton", "Tillman", "Ware", "Pittman", "Boyd", "Freeman", "Banks", "Jefferson", "Simmons", "Hawkins", "Watkins", "Crawford", "Flowers", "Floyd", "Haynes", "Hines", "Moss", "Dorsey", "Hollins", "Okafor", "Adebayo", "Mensah", "Odom", "Toney", "Battle", "Whitfield", "Gaskins", "Burrell", "Mayfield", "Darby"],
  },
  white: {
    first: ["Tyler", "Caleb", "Travis", "Bryce", "Carter", "Aiden", "Cooper", "Kyler", "Garrett", "Trent", "Austin", "Jake", "Evan", "Matt", "Brock", "Grady", "Colston", "Clay", "Flynn", "Gage", "Holt", "Jett", "Kane", "Nash", "Ryker", "Trace", "Wyatt", "Logan", "Declan", "Landon", "Colton", "Reid", "Connor", "Liam", "Owen", "Ethan", "Blake", "Luke", "Erik", "Hunter", "Cade", "Brady", "Tanner", "Hayden", "Garrison", "Beau", "Cole", "Drew", "Sawyer", "Brett", "Chandler"],
    last: ["Miller", "Sullivan", "McCarthy", "Weber", "Swanson", "Murphy", "Kelly", "Fitzgerald", "Herman", "Wolf", "Potter", "Lambert", "Norris", "Sutton", "Bennett", "Hughes", "Schmidt", "Kowalski", "Olsen", "Larson", "Mueller", "Erickson", "Hansen", "Brennan", "Novak", "Gallagher", "Becker", "Lindqvist", "O'Connor", "Callahan", "Hartman", "Kramer", "Brandt", "Doyle", "Keller", "Lynch", "McLean", "Fischer", "Walsh", "Bauer"],
  },
  latino: {
    first: ["Mateo", "Diego", "Alejandro", "Carlos", "Luis", "Javier", "Adrian", "Marco", "Andres", "Rafael", "Eduardo", "Julian", "Gabriel", "Santiago", "Emilio", "Ricardo", "Manuel", "Victor", "Angel", "Joaquin", "Cristian", "Esteban", "Hector", "Fernando"],
    last: ["Rivera", "Flores", "Reyes", "Diaz", "Padilla", "Pena", "Romero", "Salazar", "Sanchez", "Soto", "Torres", "Gonzalez", "Hernandez", "Ramirez", "Castillo", "Vargas", "Morales", "Ortiz", "Delgado", "Mendoza", "Cruz", "Gutierrez", "Herrera", "Medina", "Aguilar"],
  },
  asian: {
    first: ["Kenji", "Kai", "Jun", "Ryo", "Min", "Hiro", "Tai", "Shin"],
    last: ["Wong", "Chan", "Kim", "Park", "Nguyen", "Tran", "Chen", "Liu", "Nakamura", "Tanaka", "Yamamoto", "Wu", "Cho", "Huang", "Lee"],
  },
  pacific: {
    first: ["Penei", "Vita", "Kalani", "Keoni", "Mosiah", "Sione", "Tevita", "Manase", "Viliami", "Malakai", "Ioane", "Taulia", "Kaimana", "Noa", "Isileli"],
    last: ["Fifita", "Tupou", "Fonoti", "Taufa", "Vainikolo", "Mauga", "Leiataua", "Faalele", "Pouha", "Havili", "Kaufusi", "Latu", "Moala", "Aumavae", "Tuiasosopo"],
  },
  mena: {
    first: ["Omar", "Karim", "Ahmad", "Tariq", "Rashid", "Abdul", "Nasir", "Yousef", "Sami", "Elias", "Rami", "Khalil", "Hakeem"],
    last: ["Haddad", "Nassar", "Khalil", "Saleh", "Mansour", "Aziz", "Farah", "Hamdan", "Darwish", "Kassem", "Bazzi"],
  },
};
// how often a generated player of each heritage takes a common first or last name
const COMMON_P = { black: [0.3, 0.55], white: [0.35, 0.55], asian: [0.75, 0], latino: [0.2, 0], pacific: [0.15, 0], mena: [0.25, 0] };

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z']/g, "");
const SETS = Object.fromEntries(Object.entries(NAMES).map(([h, v]) => [h, { first: new Set(v.first.map(norm)), last: new Set(v.last.map(norm)) }]));
const COMMON = { first: new Set(COMMON_FIRST.map(norm)), last: new Set(COMMON_LAST.map(norm)) };

// How well a name fits each heritage, from the game's own name pools (fictional names only).
export function nameFit(name) {
  const parts = String(name || "").replace(/\b(jr|sr|ii|iii|iv|v)\.?$/i, "").trim().split(/\s+/);
  const f = norm(parts[0]), l = norm(parts[parts.length - 1]), out = {};
  for (const [h, s] of Object.entries(SETS)) {
    let v = (s.first.has(f) ? 1 : 0) + (s.last.has(l) ? 1.5 : 0);
    if (h === "black" || h === "white") v += (COMMON.first.has(f) ? 0.3 : 0) + (COMMON.last.has(l) ? 0.4 : 0);
    if (h === "asian") v += COMMON.first.has(f) && s.last.has(l) ? 0.3 : 0;
    if (v) out[h] = v;
  }
  return out;
}

// League-wide and per-team use of each portrait, to spread them out.
const usage = new Map(), teamUse = new Map();
export function resetPortraitUse() { usage.clear(); teamUse.clear(); }
function countUse(pid, team) {
  usage.set(pid, (usage.get(pid) || 0) + 1);
  if (team != null) { const m = teamUse.get(team) || new Map(); m.set(pid, (m.get(pid) || 0) + 1); teamUse.set(team, m); }
}

// The portrait for a player at pos: the best fit for his name (if any), else by the group's
// makeup; among equals, the one seen least on his team, then in the league. rand: 0-1 source.
export function pickPortrait(pos, { name, team, rand = Math.random } = {}) {
  const groups = POOLS[String(pos).toUpperCase()] || ["LB"];
  const cands = PORTRAITS.filter((p) => groups.includes(p.group));
  const fit = name ? nameFit(name) : {};
  const fitOf = (p) => { const v = p.tags.map((h) => fit[h] || 0); return Math.max(...v) + (p.tags.length > 1 ? Math.min(...v) * 0.25 : 0); };
  const best = Math.max(0, ...cands.map(fitOf));
  const pool = best > 0 ? cands.filter((p) => fitOf(p) >= best - 0.01) : cands;
  const tm = teamUse.get(team) || new Map();
  // least used per unit of weight (so the league ends up near the makeup), with a little noise
  const score = (p) => (tm.get(p.id) || 0) * 10 + ((usage.get(p.id) || 0) + 1) / (WEIGHT[p.id] || 0.05) * (0.85 + rand() * 0.3);
  const pick = pool.reduce((a, b) => (score(b) < score(a) ? b : a));
  countUse(pick.id, team);
  return pick.id;
}

// A new fictional player's look and name, chosen together: { pid, name }.
export function genIdentity(pos, { team, rand = Math.random } = {}) {
  const pid = pickPortrait(pos, { team, rand });
  const tags = BY_ID[pid].tags, pick = (a) => a[Math.floor(rand() * a.length)];
  const ht = (i) => tags[Math.min(i, tags.length - 1)];
  const hf = ht(rand() < 0.5 ? 0 : 1), hl = tags.length > 1 ? tags.find((h) => h !== hf) : hf;
  const first = rand() < COMMON_P[hf][0] ? pick(COMMON_FIRST) : pick(NAMES[hf].first);
  const last = rand() < COMMON_P[hl][1] ? pick(COMMON_LAST) : pick(NAMES[hl].last);
  return { pid, name: `${first} ${last}` };
}

// Who gets a bank portrait: fictional players only (not Madden's real players, real draft
// prospects or anyone with a photo).
export const isFictional = (p) => !!p && p.src !== "m27" && !p.real && !p.face?.espn;
// Give every fictional player in a save a portrait that fits his name, once (face.pid). Counts the
// ones already given first so new ones spread around them.
export function portraitSave(d) {
  resetPortraitUse();
  const all = [];
  (d?.teams || []).forEach((t, ti) => { for (const k of ["roster", "ps", "ir"]) for (const p of t[k] || []) all.push([p, ti]); });
  for (const k of ["fa", "waivers"]) for (const p of d?.[k] || []) all.push([p, null]);
  for (const cls of Object.values(d?.dc || {})) for (const p of cls || []) all.push([p, null]);
  for (const [p, ti] of all) if (p.face?.pid && BY_ID[p.face.pid]) countUse(p.face.pid, ti);
  for (const [p, ti] of all) if (isFictional(p) && !(p.face?.pid && BY_ID[p.face.pid])) p.face = { ...(p.face || {}), pid: pickPortrait(p.pos, { name: p.name, team: ti }) };
  return d;
}
export const portraitSrc = (pid) => (BY_ID[pid] ? `${import.meta.env?.BASE_URL ?? "/"}portraits/${pid}.webp` : null);
