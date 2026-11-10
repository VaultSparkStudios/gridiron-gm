// Game-day numbers from a recorded game: the win-probability line, the drive chart, the key plays
// (the biggest swings) and the top three performers. Built from g.pl, the play log the engine
// keeps when a game is created with { rec: true }.
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

// Home win probability (0-1). margin: home minus away; secs: regulation seconds left;
// poss: "h" | "a"; yard: the offense's yard line (own goal = 0); edge: home points edge.
export function winProb(margin, secs, poss, yard, edge = 1.5) {
  const ep = poss ? (poss === "h" ? 1 : -1) * (0.06 * (yard ?? 25) - 1.2) : 0;
  const frac = Math.max(0, secs) / 3600;
  if (secs <= 0) return margin > 0 ? 1 : margin < 0 ? 0 : 0.5;
  const sd = 13.5 * Math.sqrt(frac) + 0.6;
  return Math.min(0.995, Math.max(0.005, phi((margin + ep + edge * frac) / sd)));
}
const secsLeft = (q, clock) => (q >= 5 ? Math.max(1, clock) * 0.25 : (4 - q) * 900 + clock);
const elapsed = (e) => (e.q >= 5 ? 3600 + (600 - e.c) : 3600 - secsLeft(e.q, e.c));

// One compact entry per play (kept small: only your games are recorded).
export function recPlay(g, ev) {
  if (!ev) return;
  g.pl.push({ q: ev.qtr, c: ev.clock, p: ev.poss, y: ev.yard, d: ev.down, tg: ev.toGo, t: ev.type || "", yd: ev.yards || 0, td: !!ev.td, to: !!ev.turnover, s: [g.score.h, g.score.a], x: String(ev.text || "").slice(0, 110) });
}

// final: { h, a } the score that went in the books (may differ by a crowd bonus).
export function summarize(g, final = g.score, box = g.box) {
  const pl = g.pl || [];
  const wp = [winProb(0, 3600, null, 25)];
  let prev = wp[0];
  const swings = [];
  pl.forEach((e, i) => {
    const nxt = pl[i + 1];
    const v = nxt ? winProb(e.s[0] - e.s[1], secsLeft(nxt.q, nxt.c), nxt.p, nxt.y) : (final.h > final.a ? 1 : final.h < final.a ? 0 : 0.5);
    wp.push(v);
    swings.push({ i, d: v - prev, e });
    prev = v;
  });
  // the line on a game clock (one point every 50 seconds; overtime runs past 3600), so a game
  // in progress fills the chart from the left
  const t = [0, ...pl.map((e, i) => { const n = pl[i + 1]; return n ? elapsed(n) : g.done ? Math.max(3600, elapsed(e)) : elapsed(e); })];
  const end = t[t.length - 1];
  const line = [];
  for (let s = 0, k = 0; s <= end + 1e-6; s += 50) { while (k + 1 < t.length && t[k + 1] <= s) k++; line.push(Math.round(wp[k] * 100)); }
  if (g.done) line.push(Math.round(wp[wp.length - 1] * 100));
  const keys = swings.filter((s) => s.e.x && Math.abs(s.d) >= 0.04).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5).sort((a, b) => a.i - b.i)
    .map((s) => ({ q: s.e.q, c: s.e.c, p: s.e.p, x: s.e.x, sw: Math.round(s.d * 100), td: s.e.td, to: s.e.to }));
  // drives
  const drives = [];
  let cur = null;
  for (const e of pl) {
    if (e.t === "kickoff") continue; // the kickoff that opens a half isn't a drive
    if (!cur || cur.p !== e.p) {
      if (cur) drives.push(cur);
      cur = { p: e.p, q: e.q, start: e.y, end: e.y, plays: 0, yds: 0, res: "" };
    }
    cur.plays++;
    cur.yds += e.t === "punt" || e.t === "fg" || e.t === "fg_miss" ? 0 : e.yd || 0;
    cur.end = Math.min(100, Math.max(0, e.y + (e.yd || 0)));
    cur.res = e.td ? "TD" : e.t === "int" ? "INT" : e.t === "fumble" ? "FUM" : e.t === "punt" ? "Punt" : e.t === "fg" ? "FG" : e.t === "fg_miss" ? "Missed FG" : e.t === "safety" ? "Safety" : "";
  }
  if (cur) drives.push(cur);
  for (const d of drives) if (!d.res) d.res = "Downs/End";
  if (!g.done && drives.length && !drives[drives.length - 1].res.match(/TD|FG|Punt|INT|FUM|Safety/)) drives[drives.length - 1].res = "Live";
  // what each defense called (playsim.js defStyle): blitzes, loaded boxes, coverage, out of its snaps;
  // the personnel each offense played (11, 12...) and the packages each defense answered with
  const calls = Object.fromEntries(["h", "a"].map((k) => { const d = g.stats?.[k] || {}, o = g.stats?.[k === "h" ? "a" : "h"] || {}; return [k, { blitz: d.blitz || 0, box: d.box || 0, cover: d.cover || 0, snaps: (o.passAtt || 0) + (o.rushAtt || 0) + (o.sacks || 0), pers: g.stats?.[k]?.pers || {}, pkg: d.pkg || {} }]; }));
  return { wp: line, live: !g.done, keys, drives: drives.slice(0, 30), top: topPerformers(box), calls };
}

// A rough game score for a box-score line.
export function gameScore(s) {
  return (s.passYds || 0) / 25 + (s.passTD || 0) * 4 - (s.passInt || 0) * 2 + (s.rushYds || 0) / 10 + (s.rushTD || 0) * 6
    + (s.recYds || 0) / 10 + (s.recTD || 0) * 6 + (s.rec || 0) * 0.5 + (s.sacks || 0) * 4 + (s.ints || 0) * 5 + (s.tkl || 0) * 0.6 + (s.ff || 0) * 3 + (s.pd || 0) * 1 + (s.fgM || 0) * 2;
}
export function statLine(s) {
  const out = [];
  if (s.att) out.push(`${s.comp || 0}/${s.att}, ${s.passYds || 0} yds, ${s.passTD || 0} TD${s.passInt ? `, ${s.passInt} INT` : ""}`);
  if (s.rushAtt || s.rushYds) out.push(`${s.rushAtt || 0} car, ${s.rushYds || 0} yds${s.rushTD ? `, ${s.rushTD} TD` : ""}`);
  if (s.rec) out.push(`${s.rec} rec, ${s.recYds || 0} yds${s.recTD ? `, ${s.recTD} TD` : ""}`);
  if (s.tkl || s.sacks || s.ints) out.push([s.tkl && `${s.tkl} tkl`, s.sacks && `${s.sacks} sk`, s.ints && `${s.ints} INT`].filter(Boolean).join(", "));
  if (s.fgA) out.push(`${s.fgM || 0}/${s.fgA} FG`);
  return out.join(" · ");
}
export function topPerformers(box, n = 3) {
  const rows = [];
  for (const side of ["h", "a"]) for (const [id, s] of Object.entries(box?.[side] || {})) rows.push({ id, side, name: s.name, pos: s.pos, sc: gameScore(s), line: statLine(s) });
  return rows.sort((a, b) => b.sc - a.sc).slice(0, n).map(({ sc, ...r }) => ({ ...r, sc: Math.round(sc * 10) / 10 }));
}
