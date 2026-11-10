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
      for (const dir of ["chrome-linux", "chrome-linux64"]) {
        const exe = path.join(root, d, dir, "chrome");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return undefined;
};

const TEAM = process.env.SMOKE_TEAM || "Giants";
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
    for (const t of ["READ ALL ABOUT IT", "NEXT AWARD", "THE LEAGUE'S AWARDS", "WELCOME TO CANTON", "INTO THE RECORD BOOK", "Close the paper", "Continue to the awards", "CONTINUE →", "To the Legacy Hall", "Close (offers expire", "Standard", "Meet Demands", "STAY CALM", "Let Go (coach departs)", "Let him go", "Decide later", "Later", "Got it", "Keep simming"]) {
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
// Leaving an offseason week asks first: press the button, then confirm in the dialog.
async function advance(text, wait = 1500) {
  await must(text, 400);
  const yes = page.locator("button", { hasText: "Yes, go to" });
  if (!(await yes.count())) fail(`no confirm after "${text}"`);
  await yes.first().click(); await page.waitForTimeout(wait);
}
// Starting the season without opening training camp asks first: start anyway.
async function startSeason() {
  await must("Start Season", 600);
  const go = page.locator("button", { hasText: "Start the season anyway" });
  if (await go.count()) { await go.first().click(); await page.waitForTimeout(1200); }
}
// Sim several weeks: the game plays them one at a time and pauses when a decision needs you.
// Press the button, answer anything that comes up, and press again until `done` holds.
async function simUntil(text, done, where) {
  for (let i = 0; i < 12; i++) {
    if (await page.evaluate(done)) return;
    await dismiss();
    let b = page.locator("button:visible", { hasText: text });
    // the trade deadline and the end of the season live in the "Sim to…" menu next to Sim Week
    if (!(await b.count())) { const m = page.locator("button:visible", { hasText: "Sim to…" }); if (await m.count()) { await m.first().click(); await page.waitForTimeout(200); } b = page.locator("button:visible", { hasText: text }); }
    if (await b.count()) await b.first().click({ timeout: 3000 }).catch(() => {});
    // a scouting checkpoint pauses the sim: Keep simming carries it on without pressing Sim again
    for (let t = 0; t < 60 && !(await page.evaluate(done)); t++) { const k = page.locator("button:visible", { hasText: "Keep simming" }); if (await k.count()) await k.first().click().catch(() => {}); await page.waitForTimeout(500); }
  }
  if (!(await page.evaluate(done))) fail(`${where}: never finished`);
}
async function must(text, wait) { if (!(await click(text, wait))) fail(`no "${text}" button`); }
async function save() {
  // wait until the autosave settles (a slow machine is still writing the week after a fixed wait)
  let raw = null;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(i ? 700 : 2000);
    const now = await page.evaluate(() => localStorage.getItem("gm_autosave"));
    if (now && now === raw) break;
    raw = now;
  }
  if (!raw) fail("no autosave");
  return JSON.parse(raw.startsWith("lz1:") ? LZ.decompressFromUTF16(raw.slice(4)) : raw);
}
async function healthy(where) {
  const crashed = await page.evaluate(() => /Something went wrong|This screen ran into a problem/i.test(document.body.innerText));
  if (crashed) fail(`crash panel showing (${where})`);
  if (errors.length) fail(`page error (${where}): ${errors[0]}`);
}

async function reloadCheck(where) {
  // Save, reload the page, press Continue: everything in the save must come back exactly. (The
  // automatic save once left out the coach pool, franchise tag, owner goals and more.)
    const before = await save();
    await page.reload(); await page.waitForTimeout(1500);
    const cont = page.locator("button", { hasText: "CONTINUE" });
    if (!(await cont.count())) fail("no Continue button after reload");
    await cont.first().click(); await page.waitForTimeout(1500); await healthy(`continue after reload (${where})`);
    const after = await save();
    const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x)); // key order doesn't matter
    const lost = Object.keys(before).filter((k) => canon(before[k]) !== canon(after[k]));
    const diff = (a, b, path = "") => { if (canon(a) === canon(b)) return []; if (a && b && typeof a === "object" && typeof b === "object") return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) => diff(a[k], b[k], `${path}.${k}`)); return [`${path}: ${JSON.stringify(a)?.slice(0, 80)} -> ${JSON.stringify(b)?.slice(0, 80)}`]; };
    if (lost.length) { for (const k of lost) console.log(diff(before[k], after[k], k).slice(0, 8).join("\n")); fail(`reload + Continue (${where}) changed: ${lost.join(", ")}`); }
    log(`reload + Continue (${where}) keeps all ${Object.keys(before).length} saved fields`);
}


// Every player stays somewhere (a roster, practice squad, IR, free agency or retirement): nobody
// under contract and in his prime may vanish between phases.
let prevC = null;
async function census(where) {
  const d = await save();
  const m = new Map();
  d.teams.forEach((t) => { for (const k of ["roster", "ps", "ir"]) for (const p of t[k] || []) m.set(p.id, p); });
  for (const p of [...(d.fa || []), ...(d.waivers || []), ...(d.retired || [])]) if (!m.has(p.id)) m.set(p.id, p);
  for (const x of d.exits || []) if (!m.has(x.id)) m.set(x.id, x); // retired (most aren't in the record book)
  if (prevC) {
    const gone = [...prevC.values()].filter((p) => !m.has(p.id) && (p.contract || 0) >= 2 && (p.age || 30) <= 30);
    if (gone.length) fail(`${gone.length} players under contract vanished (${where}): ${gone.slice(0, 5).map((p) => `${p.name} ${p.pos} age ${p.age}`).join(", ")}`);
  }
  prevC = m;
  invariants(d, where);
}

// Things that must always hold in a save (each once broke): nobody in two places at once, every
// draft pick exactly once with a real owner, and no money that isn't a number.
function invariants(d, where) {
  const seen = new Map(), dups = [];
  const put = (p, w) => { if (p?.id == null) return; if (seen.has(p.id)) dups.push(`${p.name}: ${seen.get(p.id)} + ${w}`); else seen.set(p.id, w); };
  d.teams.forEach((t) => { for (const k of ["roster", "ps", "ir"]) for (const p of t[k] || []) put(p, `${t.ab}/${k}`); });
  for (const k of ["fa", "waivers", "udfaPool"]) for (const p of d[k] || []) put(p, k);
  if (dups.length) fail(`players in two places (${where}): ${dups.slice(0, 5).join(" | ")}`);
  const pk = new Map(), badOwner = [];
  for (const p of [...(d.draftPicks || []), ...(d.futurePicks || [])]) {
    const k = `${p.yr}-${p.rd}-${p.orig}${p.comp ? "-c" + (p.id ?? p.overall) : ""}`;
    pk.set(k, (pk.get(k) || 0) + 1);
    if (!(Number.isInteger(p.owner) && p.owner >= 0 && p.owner < d.teams.length)) badOwner.push(k);
  }
  const pdup = [...pk].filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`);
  if (pdup.length) fail(`draft picks listed twice (${where}): ${pdup.slice(0, 6).join(", ")}`);
  if (badOwner.length) fail(`draft picks with no owner (${where}): ${badOwner.slice(0, 6).join(", ")}`);
  const ids = new Map(); for (const p of d.draftPicks || []) if (p.id != null) ids.set(p.id, (ids.get(p.id) || 0) + 1);
  const idDup = [...ids].filter(([, n]) => n > 1);
  if (idDup.length) fail(`draft pick ids repeated (${where}): ${idDup.slice(0, 6).map(([k]) => k).join(", ")}`);
  const bad = [];
  const num = (v, what) => { if (v != null && !Number.isFinite(+v)) bad.push(`${what}=${v}`); };
  d.teams.forEach((t) => {
    num(t.deadCap, `${t.ab} deadCap`);
    for (const k of ["roster", "ps", "ir"]) for (const p of t[k] || []) { num(p.salary, `${p.name} salary`); num(p.contract, `${p.name} contract`); if ((+p.salary || 0) < 0) bad.push(`${p.name} salary ${p.salary}`); }
  });
  if (bad.length) fail(`money that isn't a number (${where}): ${bad.slice(0, 6).join(", ")}`);
}
let code = 0;
try {
  console.log(`Smoke test on ${url} as the ${TEAM}`);
  await page.goto(url);
  await page.waitForTimeout(1200);
  await must("NEW GAME");
  await page.locator("button", { hasText: TEAM }).first().click(); // SMOKE_TEAM=Chiefs npm run smoke: any club
  await page.locator("button", { hasText: "START YOUR" }).first().click(); // the career setup: Week 1, injuries on
  await page.waitForTimeout(1200);
  await healthy("new game"); log("new game"); await census("start");
  { const d0 = await save(); const real = (d0.dc?.[2026] || []).filter((p) => p.real); if (real.length < 100 || !real.some((p) => p.name === "Jeremiah Smith")) fail("new game didn't load the real 2027 draft class"); log(`real draft class (${real.length} real prospects)`); }
  const seen = [];
  // the top bar has six sections (Home, Team, Season, Draft, Trades & FA, Front Office; the League
  // screens and the Legacy Hall sit under Front Office); each section's
  // screens are tabs under it, so open the section first and then its screen
  for (const tab of ["Team", "Depth Chart", "Roster", "Coaching", "Season", "Schedule", "Standings", "Playoffs", "Stats", "Front Office", "League", "Franchise History", "Record Book", "League History", "Transactions", "Legacy Hall", "Draft", "Scouting", "Draft Recap", "Trades & FA", "Trade", "Free Agency", "Home"]) {
    await dismiss();
    let t = page.locator(`button:text-is("${tab}")`);
    if (!(await t.count())) t = page.getByText(tab, { exact: true });
    if (await t.count()) { await t.first().click(); await page.waitForTimeout(400); await healthy(tab); seen.push(tab); }
  }
  for (const want of ["Depth Chart", "Front Office", "Schedule", "Standings", "Draft", "League"]) if (!seen.includes(want)) fail(`couldn't open ${want}`);
  log("every main screen opens");
  await dismiss(); await page.locator(`button:text-is("Draft")`).first().click(); await page.waitForTimeout(400); await page.locator('button:text-is("Scouting")').first().click(); await page.waitForTimeout(500);
  // preseason: send a scout to a region (Scouts → Regions) and lock the assignments in
  await must("Scouts", 400); await must("Regions", 500);
  // each scout has a picker per region slot; free the slot that holds the SEC
  const reg = page.locator('button[aria-label*=": region "]').filter({ hasText: /^SEC/ });
  if (!(await reg.count())) fail("no scout slot holds the SEC");
  await reg.first().click(); await page.waitForTimeout(200);
  await page.locator('[role="option"]').filter({ hasText: /^Nobody/ }).first().click(); await page.waitForTimeout(300);
  await healthy("scout regions");
  { const ar = (await save()).scouting?.areas || {}; if (Object.values(ar).some((x) => (x || []).includes("SEC"))) fail("region assignment didn't save"); }
  await must("Scouts", 400); await must("Regions", 500); await healthy("regions view");
  log("scout regions");
  await must("Big Board", 400); await must("Your scouts", 600); await healthy("your scouts' board"); log("your scouts' board");
  await startSeason();
  await must("Sim Week", 1500); await healthy("sim week"); log("sim week");
  await reloadCheck("mid-season");
  await simUntil(": trade deadline", () => document.body.innerText.includes("TRADE DEADLINE DAY"), "sim to deadline"); await healthy("sim to deadline");
  if (!(await page.evaluate(() => document.body.innerText.includes("TRADE DEADLINE DAY")))) fail("deadline day didn't open");
  await must("Advance to", 800); await must("Sim to 4:00 PM", 800); await must("Back to the season", 800); log("trade deadline day");
  await simUntil(": end of season", () => ((t) => !/Sim to…/.test(t) && /Sim Round/.test(t))([...document.querySelectorAll("button")].map((b) => b.innerText).join(" ")), "sim all"); await page.waitForTimeout(2500); await healthy("sim all");
  let d = await save();
  for (let i = 0; i < 60 && d.sp !== "playoffs"; i++) { await page.waitForTimeout(1000); d = await save(); } // a slow machine is still playing out the last weeks
  if (d.sp !== "playoffs" || d.wk !== 18) fail(`expected playoffs after Sim All, got ${d.sp} wk ${d.wk}`);
  log("regular season"); await census("regular season");
  for (let i = 0; i < 5; i++) { await click("Sim Round", 1000); const c = page.locator("button", { hasText: /^Continue$/ }); if (await c.count()) await c.first().click(); }
  await healthy("playoffs");
  d = await save();
  if (!d.awards?.some((a) => a.yr === 2026 && a.mvp)) fail("no 2026 season awards after the Super Bowl");
  log("playoffs and season awards");
  await must("→ Combine"); await advance("Finish Combine →"); await advance("Finish Re-signing →", 2500); await healthy("free agency"); log("combine, re-sign week, free agency");
  // finishing free agency plays out the rest of the market first (a few seconds): wait until the
  // save says the draft is open before reloading
  await advance("Finish Free Agency →", 500);
  for (let i = 0; i < 40 && (await save()).sp !== "draft"; i++) await page.waitForTimeout(500);
  await reloadCheck("draft day");
  if (!(await page.locator("button", { hasText: "Sim Draft" }).count())) fail("the draft can't go on after reload + Continue");
  await click("Sim Draft", 3000);
  const cont = page.locator("button", { hasText: "Continue the draft" });
  if (await cont.count()) await cont.click();
  await click("Sim Draft", 3000);
  await healthy("draft");
  if (!(await page.evaluate(() => /Draft Recap/.test(document.body.innerText) && /YOUR CLASS|Your class|EVERY PICK|Every pick/.test(document.body.innerText)))) fail("draft recap didn't open after the draft");
  if (process.env.SMOKE_SHOTS) await page.screenshot({ path: `${process.env.SMOKE_SHOTS}/recap.png`, fullPage: true });
  log("draft and draft recap"); await census("draft");
  await must("→ Next Season", 3000); await healthy("next season");
  d = await save();
  if (d.yr !== 2027) fail(`expected 2027 after Next Season, got ${d.yr}`);
  const short = d.teams.filter((t, i) => i !== d.ui && t.roster.length < 45).map((t) => `${t.ab} ${t.roster.length}`);
  if (short.length) fail(`AI rosters short after the off-season: ${short.join(", ")}`);
  log("next season (2027)"); await census("next season"); log("nobody under contract vanished in a full season and off-season");
  await startSeason(); await must("Sim Week", 1500); await healthy("season two"); log("season two week 1");
  // the phone build: a new game at 390 wide opens Home with the game hero and its shortcut tiles,
  // and a tile's bottom sheet opens
  {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const perr = [];
    phone.on("pageerror", (e) => perr.push(e.message));
    await phone.addInitScript(() => { localStorage.setItem("gm_intro_shown", "1"); sessionStorage.setItem("gm_preview", "1"); });
    await phone.goto(`${url}?mobile=1`); await phone.waitForTimeout(1200);
    await phone.locator("button", { hasText: "NEW GAME" }).first().click(); await phone.waitForTimeout(600);
    // phones list one conference at a time: switch if the team is in the other one
    if (!(await phone.locator("button", { hasText: TEAM }).count())) await phone.locator("button", { hasText: /^NFC$/ }).first().click();
    await phone.locator("button", { hasText: TEAM }).first().click();
    await phone.locator("button", { hasText: "START YOUR" }).first().click(); await phone.waitForTimeout(1500);
    const txt = await phone.evaluate(() => document.body.innerText);
    if (/Something went wrong|This screen ran into a problem/i.test(txt)) fail("crash panel on the phone Home");
    for (const want of ["Before kickoff", "Injuries", "Start Season"]) if (!txt.includes(want)) fail(`phone Home has no "${want}"`);
    await phone.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.startsWith("Injuries"))?.click()); await phone.waitForTimeout(500);
    if (!(await phone.locator('[role="dialog"]', { hasText: "Injury Report" }).count())) fail("phone Home's injuries sheet didn't open");
    if (perr.length) fail(`page error on the phone Home: ${perr[0]}`);
    await phone.close();
    log("phone Home (390 wide)");
  }
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
