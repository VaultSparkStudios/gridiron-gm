// NFL playoffs: 7 seeds per conference (4 division winners by record, then 3 wild cards),
// the #1 seed on a bye in the Wild Card round, reseeding after it, then the conference
// championships and the Super Bowl. Matchups list the home team first.
export const ROUND_NAMES = ["", "Wild Card", "Divisional Round", "Conference Championship", "Super Bowl"];

const pct = (t) => (t.w + (t.t || 0) * 0.5) / Math.max(1, t.w + t.l + (t.t || 0));
const better = (a, b) => pct(b) - pct(a) || (b.pf - b.pa) - (a.pf - a.pa) || b.pf - a.pf;

// teams: [{ id, c, d, w, l, t, pf, pa }]. Returns 7 team ids, #1 first.
export function nflSeeds(teams, conf) {
  const ct = teams.filter((t) => t.c === conf);
  const divs = {};
  for (const t of ct) (divs[t.d] ||= []).push(t);
  const winners = Object.values(divs).map((d) => [...d].sort(better)[0]).sort(better);
  const wild = ct.filter((t) => !winners.includes(t)).sort(better).slice(0, 3);
  return [...winners, ...wild].map((t) => t.id);
}

export function makeBracket(afc, nfc) {
  const wc = (s) => [[s[1], s[6]], [s[2], s[5]], [s[3], s[4]]];
  return { rd: 1, seeds: { AFC: afc, NFC: nfc }, m: [...wc(afc), ...wc(nfc)], res: [], ch: null };
}

// After a round: winners -> the next round's matchups (or the champion).
export function nextRound(pb, results) {
  const res = [...pb.res, ...results.map((r) => ({ ...r, rd: pb.rd }))];
  const winners = results.map((r) => r.w);
  const seedOf = (id) => { for (const c of ["AFC", "NFC"]) { const i = pb.seeds[c].indexOf(id); if (i >= 0) return { c, s: i }; } return { c: "?", s: 9 }; };
  if (pb.rd === 4) return { ...pb, res, m: [], ch: winners[0] };
  const m = [];
  if (pb.rd === 3) {
    const afc = winners.find((id) => seedOf(id).c === "AFC"), nfc = winners.find((id) => seedOf(id).c === "NFC");
    m.push([afc, nfc]);
  } else {
    for (const c of ["AFC", "NFC"]) {
      const alive = winners.filter((id) => seedOf(id).c === c);
      if (pb.rd === 1) alive.push(pb.seeds[c][0]); // the #1 seed comes off the bye
      alive.sort((a, b) => seedOf(a).s - seedOf(b).s);
      if (alive.length === 4) m.push([alive[0], alive[3]], [alive[1], alive[2]]);
      else m.push([alive[0], alive[1]]);
    }
  }
  return { ...pb, rd: pb.rd + 1, m, res };
}

export const seedLabel = (pb, id) => {
  for (const c of ["AFC", "NFC"]) { const i = pb?.seeds?.[c]?.indexOf(id); if (i >= 0) return `${c} #${i + 1}`; }
  return "";
};
