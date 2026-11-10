// Players of the Week: after every regular-season week, the best offensive and defensive game in each
// conference, from that week's box scores. A win counts a little extra, like the real voting.
const OFF = (l) => (l.passYds || 0) * 0.04 + (l.passTD || 0) * 4 - (l.passInt || 0) * 3 + (l.rushYds || 0) * 0.1 + (l.rushTD || 0) * 6 + (l.recYds || 0) * 0.1 + (l.recTD || 0) * 6 + (l.rec || 0) * 0.5 - (l.fum || 0) * 2;
const DEF = (l) => (l.sacks || 0) * 5 + (l.ints || 0) * 6 + (l.ff || 0) * 4 + (l.tfl || 0) * 1.5 + (l.pd || 0) * 1.5 + (l.tkl || 0) * 0.5 + (l.ast || 0) * 0.25;
const OFF_POS = new Set(["QB", "RB", "WR", "TE"]);
const DEF_POS = new Set(["DL", "EDGE", "DT", "LB", "CB", "S"]);

// "26/35, 342 yds, 4 TD" / "2.5 sacks, 1 FF, 7 tkl"
export function statLine(l) {
  const bits = [];
  if (l.att) bits.push(`${l.comp || 0}/${l.att}, ${l.passYds || 0} yds${l.passTD ? `, ${l.passTD} TD` : ""}${l.passInt ? `, ${l.passInt} INT` : ""}`);
  if ((l.rushYds || 0) >= 20 || l.rushTD) bits.push(`${l.rushYds || 0} rush yds${l.rushTD ? `, ${l.rushTD} TD` : ""}`);
  if (l.rec) bits.push(`${l.rec} rec, ${l.recYds || 0} yds${l.recTD ? `, ${l.recTD} TD` : ""}`);
  if (l.sacks) bits.push(`${l.sacks} sack${l.sacks === 1 ? "" : "s"}`);
  if (l.ints) bits.push(`${l.ints} INT`);
  if (l.ff) bits.push(`${l.ff} FF`);
  if (l.tkl && !OFF_POS.has(l.pos)) bits.push(`${l.tkl + (l.ast || 0)} tkl`);
  return bits.join(", ");
}

// games: this week's played games ({ h, a, hs, as, boxH, boxA }); teams carry c ("AFC"/"NFC").
// Returns [{ conf, side: "O"|"D", pid, name, pos, team, line, score }], AFC offense first.
export function playersOfWeek(games, teams) {
  const best = {};
  for (const g of games || []) for (const [box, ti, us, them] of [[g.boxH, g.h, g.hs, g.as], [g.boxA, g.a, g.as, g.hs]]) {
    const conf = teams[ti]?.c;
    if (!conf) continue;
    const win = us > them ? 1.15 : 1;
    for (const [pid, l] of Object.entries(box || {})) {
      for (const [side, ok, f] of [["O", OFF_POS, OFF], ["D", DEF_POS, DEF]]) {
        if (!ok.has(l.pos)) continue;
        const score = f(l) * win, k = conf + side;
        if (score > 0 && (!best[k] || score > best[k].score)) best[k] = { conf, side, pid, name: l.name, pos: l.pos, team: ti, line: statLine(l), score };
      }
    }
  }
  return ["AFCO", "AFCD", "NFCO", "NFCD"].map((k) => best[k]).filter(Boolean);
}

export const potwLabel = (w) => `${w.conf} ${w.side === "O" ? "Offensive" : "Defensive"} Player of the Week`;
