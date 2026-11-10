// The franchise documentary: every five seasons, the story of your club's last era on film.
// Built from what the save keeps (the season log, your titles and your players' honors), so it
// can be watched again from Franchise History at any time.

const pct = (w, l) => (w + l ? w / (w + l) : 0);
const HONOR_RANK = { ap1: 3, ap2: 2, pb: 1 };

// seasons: [{ yr, w, l }] (any order); titles: years you won it all; roster: players with
// honors [{ yr, k }]; team: { city, name }; from..to: the era (inclusive).
export function buildDocumentary({ seasons = [], titles = [], roster = [], team = {}, from, to }) {
  const era = seasons.filter((s) => s.yr >= from && s.yr <= to).sort((a, b) => a.yr - b.yr);
  const w = era.reduce((a, s) => a + (s.w || 0), 0), l = era.reduce((a, s) => a + (s.l || 0), 0);
  const won = titles.filter((y) => y >= from && y <= to).sort((a, b) => a - b);
  const byPct = [...era].sort((a, b) => pct(b.w, b.l) - pct(a.w, a.l) || b.yr - a.yr);
  const best = byPct[0] || null, worst = byPct[byPct.length - 1] || null;
  const p = pct(w, l);
  const tier = won.length >= 2 ? "Dynasty" : won.length ? "Champion" : p >= 0.6 ? "Contender" : p >= 0.45 ? "Competitive" : "Building";
  // the faces of the era: your players honored most in these seasons
  const faces = roster
    .map((x) => {
      const h = (x.honors || []).filter((o) => o.yr >= from && o.yr <= to);
      return { name: x.name, pos: x.pos, ap: h.filter((o) => o.k === "ap1" || o.k === "ap2").length, pb: h.filter((o) => o.k === "pb").length, score: h.reduce((a, o) => a + (HONOR_RANK[o.k] || 0), 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const club = [team.city, team.name].filter(Boolean).join(" ") || "the franchise";
  const rec = (s) => `${s.w}-${s.l}`;
  const chapters = [];
  chapters.push(`${from}–${to}: ${club} went ${w}-${l} (${(p * 100).toFixed(0)}%).`);
  if (won.length) chapters.push(won.length > 1 ? `Champions ${won.length} times: ${won.join(", ")}.` : `Champions in ${won[0]}. Nobody can take that away.`);
  else chapters.push("No title yet. The ring is still out there.");
  if (best && best !== worst) chapters.push(`The high point: ${best.yr}, ${rec(best)}.`);
  if (worst && worst !== best && worst.w < worst.l) chapters.push(`The low point: ${worst.yr}, ${rec(worst)}.`);
  if (faces.length) chapters.push(`The faces of the era: ${faces.map((f) => `${f.name} (${f.pos}${f.ap ? `, ${f.ap}× All-Pro` : ""}${f.pb ? `, ${f.pb}× Pro Bowl` : ""})`).join("; ")}.`);
  chapters.push({ Dynasty: "A dynasty, built to be remembered.", Champion: "A champion's era. The banner hangs forever.", Contender: "Always in the hunt; the next era has to finish the job.", Competitive: "Good, not great. The pieces are there.", Building: "The building years. Every great franchise has them." }[tier]);
  return { yrs: `${from}–${to}`, from, to, w, l, champs: won.length, titles: won, best: best && { yr: best.yr, w: best.w, l: best.l }, faces, tier, chapters };
}

// Every finished five-season era, for saves made before documentaries were kept.
export function pastEras(startYr, lastDone) {
  const out = [];
  for (let a = startYr; a + 4 <= lastDone; a += 5) out.push([a, a + 4]);
  return out;
}
