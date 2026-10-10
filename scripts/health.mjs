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

const findChromium = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean)) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      const exe = path.join(root, d, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) return exe;
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
    for (const t of ["Close (offers expire", "Standard", "Meet Demands", "STAY CALM", "Let Go (coach departs)", "Decide later", "Later", "Play On"]) {
      const b = page.locator("button", { hasText: t });
      if (await b.count()) { await b.first().click(); await page.waitForTimeout(150); }
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
    overCap: ai.filter((t) => capOf(t) > (d.capCur || 1e9)).length, avgDead: +mean(ai.map((t) => t.deadCap || 0)).toFixed(1), maxDead: +Math.max(...ai.map((t) => t.deadCap || 0)).toFixed(1),
    thinTeams: thin, olDepth: +olDepth.toFixed(1), noP: ai.filter((t) => !t.roster.some((p) => p.pos === "P")).length,
    rookieSnapPct: { r1: byRd(1), r2: byRd(2), r3: byRd(3), r4_7: (() => { const xs = rk.filter((p) => p.draftPk > 96).map((p) => p.cs?.snp || 0); return xs.length ? Math.round(mean(xs) / 17) : null; })() },
    records: (d.recordBook?.history || d.recordBook?.broken || []).length,
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
let code = 0;
try {
  await page.goto(url); await page.waitForTimeout(1200);
  await must("NEW GAME"); await page.locator("button", { hasText: "Giants" }).first().click(); await page.waitForTimeout(1500);
  for (let s = 0; s < N; s++) {
    await must("Start Season", 1500);
    await must("Sim All", 6000);
    if (await page.evaluate(() => document.body.innerText.includes("TRADE DEADLINE DAY"))) { await must("Sim to 4:00 PM", 800); await must("Back to the season", 800); await must("Sim All", 6000); }
    if (process.env.SCORING) { let r = await save(); for (let w = 0; w < 6 && r.sp !== "playoffs"; w++) r = await save(); console.log("SCORING " + JSON.stringify(scoring(r))); }
    for (let i = 0; i < 6; i++) { await click("Sim Round", 1000); const c = page.locator("button", { hasText: /^Continue$/ }); if (await c.count()) await c.first().click(); }
    await must("→ Combine"); await must("→ Re-sign Week"); await must("→ Free Agency", 2500); await must("→ Draft", 1500);
    for (let k = 0; k < 3; k++) { await click("Sim Draft", 3000); const cont = page.locator("button", { hasText: "Continue the draft" }); if (await cont.count()) await cont.click(); }
    await must("→ Next Season", 3000); await healthy(`season ${s + 1}`);
    let d = await save();
    for (let w = 0; w < 6 && d.yr !== 2027 + s; w++) d = await save();
    if (d.yr !== 2027 + s) fail(`expected ${2027 + s}, got ${d.yr}`);
    const m = measure(d); rows.push(m); console.log(JSON.stringify(m));
  }
} catch (e) {
  code = 1; console.error(`HEALTH FAILED after ${rows.length} seasons: ${e.message}`);
  try { await page.screenshot({ path: "health-failure.png" }); } catch {}
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
process.exit(code);
