// Your career as a GM, looked back on when you retire: seasons, record, titles, the best players you
// drafted, the records your teams set, and a legacy score you can rank against the greats.

// The legacy score: titles count most, then playoff trips, winning, staying power and the players
// you found in the draft (Hall of Famers and All-Pro seasons) and the records they set.
export function legacyScore({ seasons = 0, w = 0, l = 0, titles = 0, playoffs = 0, hof = 0, allPro = 0, records = 0 }) {
  return Math.max(0, Math.round(titles * 100 + playoffs * 15 + (w - l) * 2 + seasons * 4 + hof * 25 + allPro * 6 + records * 3));
}

// The greatest general managers in NFL history, scored the same way. Their numbers are
// approximate totals for the years they ran a club's football operation.
export const GREATS = [
  { name: "Bill Belichick", club: "Patriots", yrs: "2000–2023", seasons: 24, w: 266, l: 121, titles: 6, playoffs: 19, hof: 0, allPro: 15, note: "Six rings building and rebuilding around Tom Brady, a sixth-round pick." },
  { name: "Tex Schramm", club: "Cowboys", yrs: "1960–1988", seasons: 29, w: 250, l: 162, titles: 2, playoffs: 18, hof: 9, allPro: 40, note: "Built America's Team from an expansion club, with scouting decades ahead of its time." },
  { name: "Bill Polian", club: "Bills, Panthers, Colts", yrs: "1986–2011", seasons: 24, w: 245, l: 139, titles: 1, playoffs: 19, hof: 5, allPro: 30, note: "Super Bowl runs in Buffalo and Indianapolis; drafted Thurman Thomas and Peyton Manning." },
  { name: "Ozzie Newsome", club: "Ravens", yrs: "1996–2018", seasons: 23, w: 199, l: 168, titles: 2, playoffs: 12, hof: 3, allPro: 30, note: "His first draft brought Jonathan Ogden and Ray Lewis; Ed Reed came later." },
  { name: "Kevin Colbert", club: "Steelers", yrs: "2000–2021", seasons: 22, w: 230, l: 121, titles: 2, playoffs: 14, hof: 1, allPro: 20, note: "Two titles with Ben Roethlisberger and Troy Polamalu, both his first-round picks." },
  { name: "Bobby Beathard", club: "Commanders, Chargers", yrs: "1978–1999", seasons: 21, w: 190, l: 146, titles: 2, playoffs: 10, hof: 4, allPro: 15, note: "Found Art Monk and Darrell Green, then took San Diego to its first Super Bowl." },
  { name: "George Young", club: "Giants", yrs: "1979–1997", seasons: 19, w: 155, l: 135, titles: 2, playoffs: 8, hof: 2, allPro: 15, note: "Drafted Lawrence Taylor and Phil Simms, and hired Bill Parcells." },
  { name: "John Schneider", club: "Seahawks", yrs: "2010–2025", seasons: 16, w: 160, l: 104, titles: 2, playoffs: 11, hof: 0, allPro: 15, note: "The Legion of Boom out of the middle rounds, and Russell Wilson in the third." },
  { name: "Brett Veach", club: "Chiefs", yrs: "2017–2025", seasons: 9, w: 104, l: 48, titles: 3, playoffs: 8, hof: 0, allPro: 6, note: "Three titles in five years around Patrick Mahomes." },
  { name: "Ron Wolf", club: "Packers", yrs: "1991–2001", seasons: 10, w: 102, l: 58, titles: 1, playoffs: 6, hof: 0, allPro: 8, note: "Traded for Brett Favre and signed Reggie White to bring Green Bay back." },
].map((g) => ({ ...g, score: legacyScore(g) })).sort((a, b) => b.score - a.score);

const honorsOf = (p) => (Array.isArray(p?.honors) ? p.honors : p?.card?.honors || []);

// The whole career, from what the save keeps.
//   seasons: [{ yr, w, l, champion }] finished seasons (newest first is fine); current: this season's
//   { yr, w, l } if it's been played; titles: years you won it all; draftHistory: { yr: [picks] };
//   people: every player you can still find (rosters, free agents, retired entries) by id;
//   records: franchise and league records your teams' players set.
export function gmCareer({ seasons = [], current = null, titles = [], playoffApps = 0, draftHistory = {}, mine = () => false, people = [], records = [] }) {
  const all = [...seasons, ...(current && (current.w || current.l) ? [current] : [])].filter((s) => s && s.yr != null);
  const w = all.reduce((a, s) => a + (s.w || 0), 0), l = all.reduce((a, s) => a + (s.l || 0), 0);
  const byId = new Map(people.filter(Boolean).map((p) => [String(p.id), p]));
  const draftees = [];
  for (const [yr, picks] of Object.entries(draftHistory || {})) for (const e of picks || []) {
    if (!e || e.id == null || !mine(e.owner, +yr)) continue;
    const p = byId.get(String(e.id));
    const h = honorsOf(p);
    draftees.push({ id: e.id, name: e.name, pos: e.pos, yr: +yr, rd: e.rd, overall: e.overall, peak: Math.max(p?.peak || 0, p?.ovr || 0, e.ovr || 0), ap: h.filter((x) => x.k === "ap1" || x.k === "ap2").length, pb: h.filter((x) => x.k === "pb").length, hof: !!p?.hof });
  }
  draftees.sort((a, b) => b.hof - a.hof || b.ap * 3 + b.pb - (a.ap * 3 + a.pb) || b.peak - a.peak);
  const best = all.length ? [...all].sort((a, b) => (b.w - b.l) - (a.w - a.l) || b.yr - a.yr)[0] : null;
  const c = {
    seasons: all.length, w, l, pct: w + l ? w / (w + l) : 0, titles: [...titles].sort((a, b) => a - b), playoffs: playoffApps,
    best: best && { yr: best.yr, w: best.w, l: best.l }, draftees: draftees.slice(0, 8),
    hof: draftees.filter((d) => d.hof).length, allPro: draftees.reduce((a, d) => a + d.ap, 0), records: records.slice(0, 12), recordCount: records.length,
  };
  c.score = legacyScore({ ...c, titles: c.titles.length, records: records.length });
  return c;
}

// Where a score lands among the greats: 1 = the best ever.
export const legacyRank = (score) => GREATS.filter((g) => g.score > score).length + 1;
// Below the honors, a short run reads as one; a long run that never got going reads as a long rebuild.
export const legacyTier = (score, seasons = 0) => (score >= 1400 ? "Greatest of All Time" : score >= 900 ? "Hall of Fame GM" : score >= 600 ? "Legendary Builder" : score >= 350 ? "Respected Executive" : score >= 150 ? "Solid Steward" : seasons >= 6 ? "The Long Rebuild" : "Short Tenure");
