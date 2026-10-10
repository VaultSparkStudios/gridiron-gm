// Smoke test: build output served locally, opened in a real (headless) browser, and played from a
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
await page.addInitScript(() => { localStorage.setItem("gm_intro_shown", "1"); sessionStorage.setItem("gm_preview", "1"); });

// Close full-screen overlays (result cards, popups) by clicking the backdrop corner.
async function dismiss() {
  for (let i = 0; i < 6; i++) {
    for (const t of ["Continue to the awards", "To the Trophy Room", "Close (offers expire", "Standard", "Meet Demands", "STAY CALM", "Let Go (coach departs)", "Decide later", "Later"]) {
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

let code = 0;
try {
  console.log(`Smoke test on ${url}`);
  await page.goto(url);
  await page.waitForTimeout(1200);
  await must("NEW GAME");
  await page.locator("button", { hasText: "Giants" }).first().click();
  await page.waitForTimeout(1200);
  await healthy("new game"); log("new game");
  { const d0 = await save(); const real = (d0.dc?.[2026] || []).filter((p) => p.real); if (real.length < 100 || !real.some((p) => p.name === "Jeremiah Smith")) fail("new game didn't load the real 2027 draft class"); log(`real draft class (${real.length} real prospects)`); }
  const seen = [];
  for (const tab of ["Roster+", "Depth Chart", "Contracts", "Schedule+", "Standings", "Playoffs", "Draft+", "Draft Recap", "League+", "Stats", "Trophy Room", "Record Book", "League History", "Trade", "Free Agency", "Game Info", "Home"]) {
    await dismiss();
    let t = page.locator(`button:text-is("${tab}")`);
    if (!(await t.count())) t = page.getByText(tab, { exact: true });
    if (await t.count()) { await t.first().click(); await page.waitForTimeout(400); await healthy(tab); seen.push(tab); }
  }
  for (const want of ["Roster+", "Contracts", "Schedule+", "Standings", "Draft+", "League+"]) if (!seen.includes(want)) fail(`couldn't open ${want}`);
  log("every main screen opens");
  await dismiss(); await page.getByText("Draft+", { exact: true }).first().click(); await page.waitForTimeout(400); await page.locator('button:text-is("Scouting")').first().click(); await page.waitForTimeout(500);
  await must("Regions", 500); await must("Send area scouts", 600); await healthy("regional scouting");
  if (!(await page.evaluate(() => /trip 1 of|●/.test(document.body.innerText)))) fail("regional trip didn't register");
  log("regional scouting");
  await must("Big Board", 400); await must("Your scouts", 600); await healthy("your scouts' board"); log("your scouts' board");
  await must("Start Season", 1500);
  await must("Sim Week", 1500); await healthy("sim week"); log("sim week");
  await must("Sim to Deadline", 3500); await healthy("sim to deadline");
  if (!(await page.evaluate(() => document.body.innerText.includes("TRADE DEADLINE DAY")))) fail("deadline day didn't open");
  await must("Advance to", 800); await must("Sim to 4:00 PM", 800); await must("Back to the season", 800); log("trade deadline day");
  await must("Sim All", 4000); await healthy("sim all");
  let d = await save();
  if (d.sp !== "playoffs" || d.wk !== 18) fail(`expected playoffs after Sim All, got ${d.sp} wk ${d.wk}`);
  log("regular season");
  for (let i = 0; i < 5; i++) { await click("Sim Round", 1000); const c = page.locator("button", { hasText: /^Continue$/ }); if (await c.count()) await c.first().click(); }
  await healthy("playoffs");
  d = await save();
  if (!d.awards?.some((a) => a.yr === 2026 && a.mvp)) fail("no 2026 season awards after the Super Bowl");
  log("playoffs and season awards");
  await must("→ Combine"); await must("→ Re-sign Week"); await must("→ Free Agency", 2500); await healthy("free agency"); log("combine, re-sign week, free agency");
  await must("→ Draft", 1500);
  await click("Sim Draft", 3000);
  const cont = page.locator("button", { hasText: "Continue the draft" });
  if (await cont.count()) await cont.click();
  await click("Sim Draft", 3000);
  await healthy("draft");
  if (!(await page.evaluate(() => /Draft Recap/.test(document.body.innerText) && /YOUR CLASS|EVERY PICK/.test(document.body.innerText)))) fail("draft recap didn't open after the draft");
  if (process.env.SMOKE_SHOTS) await page.screenshot({ path: `${process.env.SMOKE_SHOTS}/recap.png`, fullPage: true });
  log("draft and draft recap");
  await must("→ Next Season", 3000); await healthy("next season");
  d = await save();
  if (d.yr !== 2027) fail(`expected 2027 after Next Season, got ${d.yr}`);
  const short = d.teams.filter((t, i) => i !== d.ui && t.roster.length < 45).map((t) => `${t.ab} ${t.roster.length}`);
  if (short.length) fail(`AI rosters short after the off-season: ${short.join(", ")}`);
  log("next season (2027)");
  await must("Start Season", 1500); await must("Sim Week", 1500); await healthy("season two"); log("season two week 1");
  console.log(`\nSMOKE PASSED (${steps.length} steps)`);
} catch (e) {
  code = 1;
  console.error(`\nSMOKE FAILED after: ${steps.at(-1) || "start"}\n  ${e.message}`);
  try { await page.screenshot({ path: "smoke-failure.png" }); console.error("  screenshot: smoke-failure.png"); } catch {}
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
process.exit(code);
