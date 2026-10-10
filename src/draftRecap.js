// Draft recap: every pick of a draft with what he really is (true ratings and development trait
// revealed), how he compares with where he went, and a grade for each team's class.
import { devOf } from "./scouting.js";

const DEV_PTS = { generational: 4, superstar: 3, star: 2, late: 1, normal: 0 };

// A draft log entry ({ rd, overall, owner, player, ... }) reduced to what the recap keeps.
export const recapEntry = (e) => ({
  rd: e.rd, overall: e.overall, owner: e.owner, id: e.player?.id, name: e.player?.name, pos: e.player?.pos,
  age: e.player?.age, ovr: e.player?.trueOvr ?? e.player?.ovr, pot: e.player?.truePot ?? e.player?.pot, dev: e.player ? devOf(e.player) : "normal", gem: !!e.player?.gem, bust: !!e.player?.bust,
});

// Verdict on each pick: his trait, and his ceiling against where he went (potRank: where his
// potential ranks in the class; a pick 32+ spots later than that is real value, 48+ earlier a reach).
export function gradePicks(entries) {
  const rows = entries.filter((e) => e && e.id != null).map((e) => ({ ...e }));
  [...rows].sort((a, b) => (b.pot || 0) - (a.pot || 0) || (b.ovr || 0) - (a.ovr || 0)).forEach((r, i) => { r.potRank = i + 1; });
  for (const r of rows) {
    const value = r.overall - r.potRank;
    r.value = value;
    r.score = DEV_PTS[r.dev] + (value >= 32 ? 1 : value <= -48 && r.rd <= 3 ? -1 : 0) + (r.gem ? 1 : 0) - (r.bust ? 2 : 0);
    r.verdict = r.bust ? "bust" : r.gem ? "gem" : r.dev === "generational" || r.dev === "superstar" ? "jackpot"
      : r.dev === "star" ? "hit"
      : r.dev === "late" ? "wait"
      : value >= 32 ? "value"
      : value <= -48 && r.rd <= 3 ? "miss"
      : "solid";
  }
  return rows.sort((a, b) => a.overall - b.overall);
}

export const VERDICT = {
  bust: ["🚩 Bust", "#ef4444"], gem: ["💎 Hidden gem", "#f472b6"], jackpot: ["⭐ Jackpot", "#f5c542"], hit: ["✅ Hit", "#22c55e"], value: ["💰 Value", "#22c55e"],
  wait: ["⏳ Late bloomer", "#c4b5fd"], solid: ["Solid", "#94a3b8"], miss: ["❌ Miss", "#ef4444"],
};

// Each team's class: picks, hits (star or better), score and a letter grade on a curve.
export function classGrades(rows, nTeams = 32) {
  const by = Array.from({ length: nTeams }, (_, ti) => ({ ti, picks: [], score: 0, hits: 0 }));
  for (const r of rows) {
    const t = by[r.owner];
    if (!t) continue;
    t.picks.push(r);
    t.score += r.score;
    if (["gem", "jackpot", "hit"].includes(r.verdict)) t.hits++;
  }
  // Per pick, so a team with extra picks isn't graded on volume alone, plus a little for volume.
  for (const t of by) t.rating = t.picks.length ? t.score / t.picks.length + t.score * 0.05 : 0;
  const order = [...by].sort((a, b) => b.rating - a.rating);
  order.forEach((t, i) => {
    t.rank = i + 1;
    const q = i / Math.max(1, order.length - 1);
    t.grade = q < 0.1 ? "A" : q < 0.3 ? "B+" : q < 0.5 ? "B" : q < 0.7 ? "C+" : q < 0.88 ? "C" : "D";
  });
  return by;
}

export const devCounts = (rows) => rows.reduce((m, r) => ({ ...m, [r.dev]: (m[r.dev] || 0) + 1 }), {});
