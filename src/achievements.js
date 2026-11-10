// GM achievements: milestones a long career chases, earned once per save and kept with the year
// you earned them. Each one checks the career (gmCareer) and the season-by-season record.
import { GREATS } from "./gmLegacy.js";

// ctx: { career: gmCareer(...), seasons: [{ yr, w, l, champion }] (any order), titles: [years] }
export const ACHIEVEMENTS = [
  { id: "first-win", icon: "", name: "Opening Statement", desc: "Win your first game.", test: ({ career }) => career.w >= 1 },
  { id: "winning", icon: "", name: "Above .500", desc: "Finish a season with a winning record.", test: ({ seasons }) => seasons.some((s) => s.w > s.l) },
  { id: "twelve", icon: "", name: "Juggernaut", desc: "Win 12 or more games in a season.", test: ({ seasons }) => seasons.some((s) => s.w >= 12) },
  { id: "perfect", icon: "", name: "Perfection", desc: "Go undefeated in the regular season.", test: ({ seasons }) => seasons.some((s) => s.l === 0 && s.w >= 17) },
  { id: "turnaround", icon: "", name: "Worst to First", desc: "Win 6 more games than the season before.", test: ({ seasons }) => { const s = [...seasons].sort((a, b) => a.yr - b.yr); return s.some((x, i) => i > 0 && x.w - s[i - 1].w >= 6); } },
  { id: "division", icon: "", name: "Division Champs", desc: "Win your division.", test: ({ seasons }) => seasons.some((s) => s.div) },
  { id: "playoffs", icon: "", name: "Postseason Bound", desc: "Make the playoffs.", test: ({ career }) => career.playoffs >= 1 },
  { id: "champ", icon: "", name: "World Champions", desc: "Win the Super Bowl.", test: ({ titles }) => titles.length >= 1 },
  { id: "repeat", icon: "", name: "Repeat", desc: "Win back-to-back Super Bowls.", test: ({ titles }) => titles.some((y) => titles.includes(y - 1)) },
  { id: "dynasty", icon: "", name: "Dynasty", desc: "Win three Super Bowls.", test: ({ titles }) => titles.length >= 3 },
  { id: "decade", icon: "", name: "Ten Years In", desc: "Run the club for 10 seasons.", test: ({ career }) => career.seasons >= 10 },
  { id: "hundred", icon: "", name: "Century Mark", desc: "Win 100 games as GM.", test: ({ career }) => career.w >= 100 },
  { id: "allpro", icon: "", name: "Talent Scout", desc: "A player you drafted makes an All-Pro team.", test: ({ career }) => career.allPro >= 1 },
  { id: "hof", icon: "", name: "Canton Pipeline", desc: "A player you drafted makes the Hall of Fame.", test: ({ career }) => career.hof >= 1 },
  { id: "record", icon: "", name: "Record Breaker", desc: "One of your players sets a franchise or league record.", test: ({ career }) => (career.recordCount || 0) >= 1 },
  { id: "greats", icon: "", name: "Among the Greats", desc: "Pass a top-10 GM of all time in legacy score.", test: ({ career }) => career.score > GREATS[GREATS.length - 1].score },
];

// earned: { [id]: year } already earned. Returns the ids newly earned now.
export function newAchievements(ctx, earned = {}) {
  const c = { career: { w: 0, seasons: 0, playoffs: 0, allPro: 0, hof: 0, score: 0, ...(ctx.career || {}) }, seasons: (ctx.seasons || []).filter((s) => s && s.yr != null), titles: ctx.titles || [] };
  return ACHIEVEMENTS.filter((a) => !earned[a.id] && a.test(c)).map((a) => a.id);
}
