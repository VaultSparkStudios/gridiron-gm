// Head to head: your record against each club while you've been GM, and the last time you met,
// shown in the weekly matchup preview. Kept as { [opp]: { w, l, t, last: { y, wk, us, them, po } },
// seen: ["yr-wk-opp", ...], seenYr } so a week's games are counted once.

// Count any of your played games not counted yet. Returns the same object when nothing changed.
export function recordH2H(h2h, sched, ui, yr) {
  const cur = h2h || {};
  const seen = new Set(cur.seenYr === yr ? cur.seen || [] : []);
  let out = null;
  for (const g of sched || []) {
    if (!g.played || (g.h !== ui && g.a !== ui) || g.h === g.a) continue;
    const opp = g.h === ui ? g.a : g.h, key = `${yr}-${g.wk}-${opp}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out ||= { ...cur };
    const us = g.h === ui ? g.hs : g.as, them = g.h === ui ? g.as : g.hs;
    const r = { ...(out[opp] || { w: 0, l: 0, t: 0 }) };
    if (us > them) r.w++; else if (us < them) r.l++; else r.t++;
    r.last = { y: yr, wk: g.wk, us, them, po: g.wk > 18 || !!g.playoff };
    out[opp] = r;
  }
  if (!out) return cur;
  out.seen = [...seen];
  out.seenYr = yr;
  return out;
}

// "You're 3-1 against the Cowboys. Last time: W 27-20 (2028)." or null before you've met.
export function h2hLine(rec, oppName) {
  if (!rec || !(rec.w + rec.l + rec.t)) return null;
  const { last } = rec;
  const res = last.us > last.them ? "W" : last.us < last.them ? "L" : "T";
  return `You're ${rec.w}-${rec.l}${rec.t ? `-${rec.t}` : ""} against the ${oppName} as GM. Last time: ${res} ${last.us}-${last.them} (${last.y}${last.po ? " playoffs" : `, week ${last.wk}`}).`;
}
