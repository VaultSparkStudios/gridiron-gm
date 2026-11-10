// Health check (npm run health): plays SEASONS (default 10) seasons through the real game and\n// prints league numbers after each one. Based on the smoke test:\n// Smoke test: build output served locally, opened in a real (headless) browser, and played from a
// new game through a full season, the playoffs and the whole off-season into season two. It fails
// on any page error, any crash panel, or a save that didn't move forward. Run with `npm run smoke`
// (after `npm run build`), or `npm run check` for tests + build + smoke.
//
// Chromium: CHROMIUM_PATH if set, else the Playwright browsers under PLAYWRIGHT_BROWSERS_PATH or
// /opt/pw-browsers, else Playwright's default.
import fs from "node:fs";
import path from "node:path";
import { preview } from "vite";
import { chromium } from "playwright-core";
import LZ from "lz-string";
import { capFor, setLeagueYear, setCapPhase } from "../src/cap.js";
import { capSpace } from "../src/league.js";
import { checkSeason, watchRun, flagText, matchedClubs, matchedSeason, matchedRun } from "../src/balanceWatch.js";

const findChromium = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean)) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      for (const dir of ["chrome-linux", "chrome-linux64"]) {
        const exe = path.join(root, d, dir, "chrome");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return undefined;
};

const steps = [];
const log = (s) => { steps.push(s); console.log(`  ✓ ${s}`); };
const fail = (msg) => { throw new Error(msg); };

const server = await preview({ preview: { port: 4199, strictPort: false }, logLevel: "silent" });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
await page.addInitScript(() => { localStorage.setItem("gm_nofire", "1"); localStorage.setItem("gm_intro_shown", "1"); sessionStorage.setItem("gm_preview", "1"); });

// Close full-screen overlays (result cards, popups) by clicking the backdrop corner.
async function dismiss() {
  for (let i = 0; i < 6; i++) {
    for (const t of ["READ ALL ABOUT IT", "NEXT AWARD", "THE LEAGUE'S AWARDS", "WELCOME TO CANTON", "INTO THE RECORD BOOK", "Close the paper", "Close (offers expire", "Standard", "Meet Demands", "STAY CALM", "Let Go (coach departs)", "Decide later", "Later", "Play On"]) {
      const b = page.locator("button", { hasText: t });
      if (await b.count()) { await b.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(150); }
    }
    const overlay = await page.evaluate(() => [...document.querySelectorAll("div")].some((d) => { const s = getComputedStyle(d); return s.position === "fixed" && d.offsetWidth >= innerWidth - 2 && d.offsetHeight >= innerHeight - 2 && +s.zIndex >= 100; }));
    if (!overlay) return;
    await page.mouse.click(3, 897);
    await page.waitForTimeout(250);
  }
}
async function click(text, wait = 1000) {
  await dismiss();
  const b = page.locator("button", { hasText: text });
  if (!(await b.count())) return false;
  await b.first().click();
  await page.waitForTimeout(wait);
  return true;
}
async function must(text, wait) { if (!(await click(text, wait))) fail(`no "${text}" button`); }
async function save() {
  await page.waitForTimeout(2000);
  const raw = await page.evaluate(() => localStorage.getItem("gm_autosave"));
  if (!raw) fail("no autosave");
  return JSON.parse(raw.startsWith("lz1:") ? LZ.decompressFromUTF16(raw.slice(4)) : raw);
}
async function healthy(where) {
  const crashed = await page.evaluate(() => /Something went wrong|This screen ran into a problem/i.test(document.body.innerText));
  if (crashed) fail(`crash panel showing (${where})`);
  if (errors.length) fail(`page error (${where}): ${errors[0]}`);
}


// Health check: N seasons straight through the real game, measuring the league after each one.
const N = +(process.env.SEASONS || 10);
const rows = [];
const OL = ["LT", "LG", "C", "RG", "RT"];
function measure(d) {
  const all = d.teams.flatMap((t) => t.roster);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const starters = d.teams.flatMap((t) => [...t.roster].sort((a, b) => b.ovr - a.ovr).slice(0, 22));
  setLeagueYear(["resign", "freeagency", "draft"].includes(d.sp) ? d.yr + 1 : d.yr); setCapPhase(d.yr, d.sp);
  const ai = d.teams.filter((_, i) => i !== d.ui);
  const capOf = (t) => t.roster.reduce((a, p) => a + (p.salary || 0), 0) + (t.deadCap || 0);
  const thin = ai.filter((t) => ["QB", "C", "K", "P", ...OL].some((pos) => t.roster.filter((p) => p.pos === pos).length < (pos === "QB" ? 2 : 1))).length;
  const olDepth = mean(ai.map((t) => t.roster.filter((p) => OL.includes(p.pos)).length));
  // rookies from the draft just held: their snaps come next season, so report last class's snaps
  const rk = all.filter((p) => p.draftPk > 0 && p.draftYr === d.yr - 2);
  const byRd = (r) => { const xs = rk.filter((p) => Math.ceil(p.draftPk / 32) === r).map((p) => p.cs?.snp || 0); return xs.length ? Math.round(mean(xs) / 17) : null; };
  return {
    yr: d.yr, players: all.length, avgOvr: +mean(all.map((p) => p.ovr)).toFixed(1), starterOvr: +mean(starters.map((p) => p.ovr)).toFixed(1),
    n90: all.filter((p) => p.ovr >= 90).length, n95: all.filter((p) => p.ovr >= 95).length, n99: all.filter((p) => p.ovr >= 99).length,
    minRoster: Math.min(...ai.map((t) => t.roster.length)), maxRoster: Math.max(...ai.map((t) => t.roster.length)),
    overCap: ai.filter((t) => capSpace(t) < 0).length, maxOver: +Math.max(0, ...ai.map((t) => -capSpace(t))).toFixed(1), avgDead: +mean(ai.map((t) => t.deadCap || 0)).toFixed(1), maxDead: +Math.max(...ai.map((t) => t.deadCap || 0)).toFixed(1),
    thinTeams: thin, olDepth: +olDepth.toFixed(1), noP: ai.filter((t) => !t.roster.some((p) => p.pos === "P")).length,
    rookieSnapPct: { r1: byRd(1), r2: byRd(2), r3: byRd(3), r4_7: (() => { const xs = rk.filter((p) => p.draftPk > 96).map((p) => p.cs?.snp || 0); return xs.length ? Math.round(mean(xs) / 17) : null; })() },
    // how many players rate 80+ (more over time = rating inflation) and what an 80-84 WR is paid, as % of the cap
    n80: all.filter((p) => p.ovr >= 80).length,
    // roster ages (the NFL sits near 26.5) and the free-agent pool (it shouldn't grow without end)
    // finals never seen in NFL history, league-wide so far (the real NFL averages a few a season)
    scorigamis: (d.sgLog || []).length, sgLast: (d.sgLog || []).slice(-3).map((e) => `${e.s} (${e.yr} wk ${e.wk})`),
    avgAge: +mean(all.map((p) => p.age)).toFixed(2), n33: all.filter((p) => p.age >= 33).length, n24: all.filter((p) => p.age <= 24).length, faPool: (d.fa || []).length,
    // where the 80+ players are: young (24 and under), prime (25-29), veterans (30+); and this year's rookies
    n80Age: [[0, 24], [25, 29], [30, 99]].map(([a, b]) => all.filter((p) => p.ovr >= 80 && p.age >= a && p.age <= b).length), rook80: all.filter((p) => p.ovr >= 80 && p.draftYr === d.yr - 1).length,
    wr80: all.filter((p) => p.pos === "WR" && p.ovr >= 80).length,
    wr80Pct: (() => { const xs = all.filter((p) => p.pos === "WR" && p.ovr >= 80 && p.ovr <= 84 && (p.salary || 0) > 2).map((p) => p.salary).sort((a, b) => a - b); return xs.length ? +((100 * xs[Math.floor(xs.length / 2)]) / capFor(d.yr)).toFixed(1) : null; })(),
    records: (d.recordBook?.history || d.recordBook?.broken || []).length,
    // the market at the top: the five biggest salaries at a position, as % of the cap (2025 NFL: QB ~16%, DL/WR ~12%, CB ~9%)
    // skill shape at the top of each position (3.8: generated players kept fast and position-shaped)
    shape: (() => { const top = (pos, n) => all.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, n); const m = (xs, f) => Math.round(mean(xs.map(f).filter((v) => typeof v === "number"))); return { qbArm: m(top("QB", 32), (p) => p.posAttrs?.armStr), rbSpd: m(top("RB", 32), (p) => p.spd), wrSpd: m(top("WR", 96), (p) => p.spd), cbSpd: m(top("CB", 64), (p) => p.spd), olStr: m(top("LT", 32), (p) => p.str) }; })(),
    oldest: all.filter((p) => p.age >= 38 && !["QB", "K", "P"].includes(p.pos)).length,
    hofTotal: (d.retired || []).filter((r) => r.hof).length,
    // club payrolls as % of the cap: lowest, average, highest (real NFL clubs mostly spend 85-100%)
    payPct: (() => { const xs = ai.map((t) => (100 * capOf(t)) / capFor(d.yr)); return [Math.round(Math.min(...xs)), Math.round(mean(xs)), Math.round(Math.max(...xs))]; })(),
    top5Pct: Object.fromEntries(["QB", "DL", "WR", "CB", "LT"].map((pos) => [pos, +((100 * mean(all.filter((p) => p.pos === pos).map((p) => p.salary || 0).sort((x, y) => y - x).slice(0, 5))) / capFor(d.yr)).toFixed(1)])),
  };
}
// Game scoring for the regular season just played (read before the playoffs), against the NFL.
function scoring(d) {
  const gs = (d.sched || []).filter((g) => g.played);
  const pts = gs.flatMap((g) => [g.hs, g.as]), n = pts.length || 1;
  const mean = pts.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(pts.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const pct = (f) => +((100 * gs.filter(f).length) / Math.max(1, gs.length)).toFixed(1);
  const all = d.teams.flatMap((t) => [...t.roster, ...(t.ir || [])]);
  const tot = (k) => all.reduce((a, p) => a + (p.ss?.[k] || 0), 0);
  const top = (k) => { const p = [...all].sort((a, b) => (b.ss?.[k] || 0) - (a.ss?.[k] || 0))[0]; return p ? `${p.name} ${+(p.ss?.[k] || 0).toFixed(1)}` : "-"; };
  return {
    yr: d.yr, games: gs.length, ppg: +mean.toFixed(1), sd: +sd.toFixed(1), max: Math.max(...pts),
    t40: +((100 * pts.filter((x) => x >= 40).length) / n).toFixed(1), t50: pts.filter((x) => x >= 50).length, shutouts: pts.filter((x) => x === 0).length,
    oneScore: pct((g) => Math.abs(g.hs - g.as) <= 8), blowout28: pct((g) => Math.abs(g.hs - g.as) >= 28), homeWin: pct((g) => g.hs > g.as), ties: gs.filter((g) => g.hs === g.as).length,
    passYds: +(tot("passYds") / n).toFixed(0), rushYds: +(tot("rushYds") / n).toFixed(0), compPct: +((100 * tot("comp")) / Math.max(1, tot("att"))).toFixed(1),
    passTD: +(tot("passTD") / n).toFixed(2), rushTD: +(tot("rushTD") / n).toFixed(2), ints: +(tot("passInt") / n).toFixed(2), sacks: +(tot("sacks") / n).toFixed(2),
    lead: { passYds: top("passYds"), passTD: top("passTD"), rushYds: top("rushYds"), recYds: top("recYds"), rec: top("rec"), sacks: top("sacks"), ints: top("ints") },
  };
}
// Leaving an offseason week asks first: press the button, then confirm in the dialog.
async function advance(text, wait = 1500) {
  await must(text, 400);
  const yes = page.locator("button", { hasText: "Yes, go to" });
  if (await yes.count()) await yes.first().click();
  await page.waitForTimeout(wait);
}
let code = 0;
try {
  await page.goto(url); await page.waitForTimeout(1200);
  await must("NEW GAME"); await page.locator("button", { hasText: "Giants" }).first().click(); await page.locator("button", { hasText: "START YOUR" }).first().click(); await page.waitForTimeout(1500);
  // your club vs the AI clubs that started level with it (balanceWatch.js)
  let match = null; const vs = [];
  { const d0 = await save(); match = matchedClubs(d0.teams, d0.ui); console.log(`MATCHED: ${d0.teams[d0.ui].ab} vs ${match.map((i) => d0.teams[i].ab).join(", ")}`); }
  for (let s = 0; s < N; s++) {
    await must("Start Season", 1500);
    { const go = page.locator("button", { hasText: "Start the season anyway" }); if (await go.count()) { await go.first().click(); await page.waitForTimeout(1500); } }
    // Sim All plays one real week at a time and pauses for decisions: keep pressing until the playoffs
    for (let i = 0; i < 15; i++) {
      const done = () => ((t) => !/Sim All/.test(t) && /Sim Round/.test(t))([...document.querySelectorAll("button")].map((b) => b.innerText).join(" "));
      if (await page.evaluate(done)) break;
      for (const t of ["LET'S GO", "CONTINUE →", "INTO THE RECORD BOOK →", "Sim to 4:00 PM", "Back to the season", "Meet Demands", "Decide later", "Later", "Got it"]) { const b = page.locator("button:visible", { hasText: t }); if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(300); } }
      // Sim All lives in the ⏩ menu next to Sim Week
      let b = page.locator("button:visible", { hasText: "Sim All" });
      if (!(await b.count())) { const m = page.locator("button:visible", { hasText: "⏩" }); if (await m.count()) { await m.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(200); } b = page.locator("button:visible", { hasText: "Sim All" }); }
      if (await b.count()) await b.first().click({ timeout: 3000 }).catch(() => {});
      // a scouting checkpoint pauses the sim: Keep simming carries it on
      for (let t = 0; t < 80 && !(await page.evaluate(done)); t++) { const k = page.locator("button:visible", { hasText: "Keep simming" }); if (await k.count()) await k.first().click().catch(() => {}); await page.waitForTimeout(500); }
    }
    if (!(await page.evaluate(() => /Sim Round/.test([...document.querySelectorAll("button")].map((b) => b.innerText).join(" "))))) fail("Sim All never reached the playoffs");
    // scoring for the regular season just played (the balance watchdog reads it with the season's numbers)
    let sc = null;
    { let r = await save(); for (let w = 0; w < 6 && r.sp !== "playoffs"; w++) r = await save(); sc = scoring(r); if (process.env.SCORING) console.log("SCORING " + JSON.stringify(sc));
      if (match) { const v = { yr: r.yr, ...matchedSeason(r.teams, r.ui, match) }; vs.push(v); console.log(`  ⚖ USER vs MATCHED ${v.yr}: ${v.user} vs ${v.matched} (${v.gap >= 0 ? "+" : ""}${v.gap})`); } }
    for (let i = 0; i < 6; i++) { await click("Sim Round", 1000); const c = page.locator("button", { hasText: /^Continue$/ }); if (await c.count()) await c.first().click(); }
    await must("→ Combine"); await advance("Finish Combine →"); await advance("Finish Re-signing →", 2500); await advance("Finish Free Agency →", 1500);
    for (let k = 0; k < 3; k++) { await click("Sim Draft", 3000); const cont = page.locator("button", { hasText: "Continue the draft" }); if (await cont.count()) await cont.click(); }
    await must("→ Next Season", 3000); await healthy(`season ${s + 1}`);
    let d = await save();
    // a late-career save is ~9 MB and takes seconds to compress, so give the new year time to land
    for (let w = 0; w < 20 && d.yr !== 2027 + s; w++) d = await save();
    if (d.yr !== 2027 + s) fail(`expected ${2027 + s}, got ${d.yr}`);
    const m = { ...measure(d), ...(sc ? { ppg: sc.ppg, compPct: sc.compPct, passYds: sc.passYds, rushYds: sc.rushYds, homeWin: sc.homeWin, blowout28: sc.blowout28, ties: sc.ties } : {}) }; rows.push(m); console.log(JSON.stringify(m));
    // the balance watchdog: anything out of its NFL band this season
    for (const f of checkSeason(m, rows[0])) console.log(`  ⚠ BALANCE ${m.yr}: ${flagText(f)}`);
    // the franchise documentary (every five seasons): built, saved and waiting in the inbox
    if ((d.docs || []).length) console.log(`  🎬 documentaries: ${d.docs.map((x) => `${x.yrs} ${x.w}-${x.l} ${x.tier}`).join(" | ")}${d.docCard ? " (new one waiting)" : ""}`);
    // FULLSAVE=dir: the whole save after each season (save.json parsed, autosave.txt as stored, to load
    // into the browser later); a long run that dies late still leaves its last season behind
    if (process.env.FULLSAVE) { const fs = await import("node:fs"); fs.writeFileSync(`${process.env.FULLSAVE}/save.json`, JSON.stringify(d)); fs.writeFileSync(`${process.env.FULLSAVE}/autosave.txt`, await page.evaluate(() => localStorage.getItem("gm_autosave"))); }
    // DUMP=dir: keep each season's rosters for a closer look
    if (process.env.DUMP) (await import("node:fs")).writeFileSync(`${process.env.DUMP}/league-${d.yr}.json`, JSON.stringify({ fa: (d.fa || []).map(({ id, name, pos, age, ovr, draftYr, draftPk }) => ({ id, name, pos, age, ovr, draftYr, draftPk })), teams: d.teams.map((t) => t.roster.map(({ id, name, pos, age, ovr, pot, truePot, dev, honors, oh, draftYr, draftPk, contract, salary }) => ({ id, name, pos, age, ovr, pot, truePot, dev, honors, oh, draftYr, draftPk, contract, salary }))) }));
  }
  // a hard band broken two seasons running is drift that won't fix itself: the run fails
  const w = watchRun(rows);
  console.log(`BALANCE: ${w.seasons.reduce((t, x) => t + x.flags.length, 0)} warning(s) over ${rows.length} seasons, ${w.failures.length} failure(s)`);
  if (vs.length) { const mr = matchedRun(vs); console.log(`USER vs MATCHED: ${mr.gap >= 0 ? "+" : ""}${mr.gap} win rate (${mr.wins >= 0 ? "+" : ""}${mr.wins} wins a season)${mr.flag ? " ⚠ past the band: one side is favored" : ""}`); }
  if (w.failures.length) fail(`balance: ${w.failures.map((f) => `${f.yr} ${flagText(f)}`).join("; ")}`);
} catch (e) {
  code = 1; console.error(`HEALTH FAILED after ${rows.length} seasons: ${e.message}`);
  try { await page.screenshot({ path: "health-failure.png" }); } catch {}
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
process.exit(code);
