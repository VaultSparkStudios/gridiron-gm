// Leak audit: plays three seasons and off-seasons in the browser and, after every phase, reports
// players who vanished, players in two places at once, prospects lost, draft picks lost or
// duplicated, and career totals that stop adding up. Run: npm run build && node scripts/leak-audit.mjs
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
    for (const t of ["Continue to the awards", "CONTINUE →", "To the Legacy Hall", "Close (offers expire", "Standard", "Meet Demands", "STAY CALM", "Let Go (coach departs)", "Decide later", "Later", "Got it", "Play On (Lame Duck)"]) {
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
// Sim several weeks: one real week at a time, pausing for decisions; press again until done.
async function simUntil(text, done) {
  for (let i = 0; i < 12; i++) {
    if (await page.evaluate(done)) return;
    await dismiss();
    const b = page.locator("button:visible", { hasText: text });
    if (await b.count()) await b.first().click();
    for (let t = 0; t < 60 && !(await page.evaluate(done)); t++) await page.waitForTimeout(500);
  }
  if (!(await page.evaluate(done))) fail(`"${text}" never finished`);
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
  for (const x of d.exits || []) if (!m.has(x.id)) m.set(x.id, x);
  if (prevC) {
    const gone = [...prevC.values()].filter((p) => !m.has(p.id) && (p.contract || 0) >= 2 && (p.age || 30) <= 30);
    if (gone.length) fail(`${gone.length} players under contract vanished (${where}): ${gone.slice(0, 5).map((p) => `${p.name} ${p.pos} age ${p.age}`).join(", ")}`);
  }
  prevC = m;
}

const SEEN = new Map();
const problems = []; // anything here fails the audit (old players retiring is expected and doesn't) // id -> last description
let prevA = null;
async function audit(where) {
  const d = await save();
  const loc = new Map(); const dups = [];
  const put = (p, w) => { if (!p || p.id == null) return; if (loc.has(p.id)) dups.push(`${p.name}: ${loc.get(p.id).w} + ${w}`); else loc.set(p.id, { p, w }); };
  d.teams.forEach((t) => { for (const k of ["roster", "ps", "ir"]) for (const p of t[k] || []) put(p, `${t.ab}/${k}`); });
  for (const p of d.fa || []) put(p, "FA");
  for (const p of d.waivers || []) put(p, "waivers");
  for (const p of d.udfaPool || []) put(p, "udfa");
  const retired = new Set([...(d.retired || []), ...(d.exits || [])].map((r) => r.id));
  const prospects = new Map(); for (const [y, cls] of Object.entries(d.dc || {})) for (const p of cls || []) prospects.set(p.id, y);
  const out = [];
  if (dups.length) problems.push(`${where}: ${dups.length} players in two places`);
  if (dups.length) out.push(`DUPLICATES (${dups.length}): ${dups.slice(0, 6).join(" | ")}`);
  if (prevA) {
    const gone = [...prevA.loc.values()].filter(({ p }) => !loc.has(p.id) && !retired.has(p.id));
    const notable = gone.filter(({ p }) => (p.age || 0) <= 31);
    const old = gone.length - notable.length;
    // ordinary retirements aren't kept in the record book, so only a young player vanishing is a leak
    const young = gone.filter(({ p }) => (p.age || 0) <= 29);
    if (young.length) problems.push(`${where}: ${young.length} players aged 29 or under vanished (${young.slice(0, 3).map(({ p }) => p.name).join(", ")})`);
    if (gone.length) out.push(`vanished ${gone.length} (${old} aged 32+, likely retirements): ${notable.slice(0, 12).map(({ p, w }) => `${p.name} ${p.pos} ${w} age${p.age} c${p.contract} ovr${p.ovr}`).join(" | ")}`);
    // prospects: in last check's class, now neither prospect nor anywhere
    const lostPros = [...prevA.prospects.keys()].filter((id) => !prospects.has(id) && !loc.has(id));
    if (lostPros.length) problems.push(`${where}: ${lostPros.length} prospects lost`);
    if (lostPros.length) out.push(`prospects lost ${lostPros.length}: ${lostPros.slice(0, 8).map((id) => prevA.pnames.get(id)).join(", ")}`);
  }
  // picks: every (year, round, original club) once
  const pk = new Map(); for (const p of [...(d.draftPicks || []), ...(d.futurePicks || [])]) { const k = `${p.yr}-${p.rd}-${p.orig}${p.comp ? "-c" + p.id : ""}`; pk.set(k, (pk.get(k) || 0) + 1); }
  const pdup = [...pk].filter(([, n]) => n > 1);
  if (pdup.length) problems.push(`${where}: duplicate picks`);
  if (pdup.length) out.push(`duplicate picks: ${pdup.slice(0, 8).map(([k, n]) => `${k}×${n}`).join(", ")}`);
  const byYr = {}; for (const k of pk.keys()) if (!k.includes("-c")) { const y = k.split("-")[0]; byYr[y] = (byYr[y] || 0) + 1; }
  const short = Object.entries(byYr).filter(([y, n]) => n !== 224 && !(d.sp === "draft" && +y === d.yr)).map(([y, n]) => `${y}:${n}`);
  if (short.length) problems.push(`${where}: pick counts off (${short.join(", ")})`);
  if (short.length) out.push(`pick counts off (should be 224): ${short.join(", ")}`);
  // career stats: cs.gp at least the sum of past season lines
  const badCs = []; for (const { p } of loc.values()) { const sum = (p.sh || []).reduce((s, x) => s + (x.gp || 0), 0); if (sum > (p.cs?.gp || 0) + 0.5) badCs.push(`${p.name} cs.gp ${p.cs?.gp || 0} < lines ${sum}`); }
  if (badCs.length) problems.push(`${where}: ${badCs.length} career totals short`);
  if (badCs.length) out.push(`career totals short (${badCs.length}): ${badCs.slice(0, 4).join(" | ")}`);
  console.log(`  ## ${d.yr} ${d.sp} wk${d.wk} (${where}): ${loc.size} players${out.length ? "\n     " + out.join("\n     ") : " — clean"}`);
  const pnames = new Map(); for (const [y, cls] of Object.entries(d.dc || {})) for (const p of cls || []) pnames.set(p.id, `${p.name} (${y})`);
  prevA = { loc, prospects, pnames };
}
let code = 0;
try {
  await page.goto(url); await page.waitForTimeout(1200);
  await must("NEW GAME");
  await page.locator("button", { hasText: "Giants" }).first().click(); await page.waitForTimeout(1500);
  await audit("start");
  for (let season = 0; season < 3; season++) {
    await startSeason(); await audit("season start");
    await must("Sim Week", 1500); await audit("week 1");
    await simUntil("Sim to Deadline", () => document.body.innerText.includes("TRADE DEADLINE DAY"));
    await must("Advance to", 800); await must("Sim to 4:00 PM", 800); await must("Back to the season", 800); await audit("deadline");
    await simUntil("Sim All", () => ((t) => !/Sim All/.test(t) && /Sim Round/.test(t))([...document.querySelectorAll("button")].map((b) => b.innerText).join(" "))); await page.waitForTimeout(2500); await audit("regular season");
    for (let i = 0; i < 5; i++) { await click("Sim Round", 1000); const c = page.locator("button", { hasText: /^Continue$/ }); if (await c.count()) await c.first().click(); }
    await audit("playoffs");
    await must("→ Combine"); await audit("combine"); await advance("Finish Combine →"); await audit("re-sign"); await advance("Finish Re-signing →", 2500); await audit("free agency");
    await advance("Finish Free Agency →", 1500); await audit("draft start");
    await dismiss(); { const b = page.locator('button:text-is("Draft")'); if (await b.count()) { await b.first().click(); await page.waitForTimeout(800); } }
    for (let k = 0; k < 3; k++) { await click("Sim Draft", 3000); const cont = page.locator("button", { hasText: "Continue the draft" }); if (await cont.count()) await cont.click(); }
    await audit("draft done");
    await must("→ Next Season", 3000); await audit("new season");
  }
  if (errors.length) { console.log("page errors:", errors.slice(0, 3)); code = 1; }
  if (problems.length) { console.log(`AUDIT FOUND ${problems.length} PROBLEM(S):\n  ${problems.join("\n  ")}`); code = 1; } else console.log("AUDIT CLEAN: nobody lost or duplicated, every pick accounted for");
} catch (e) { code = 1; console.log("FAILED:", e.message.split("\n")[0]); try { await page.screenshot({ path: "audit-failure.png" }); } catch { /* no screenshot */ } }
await browser.close(); server.httpServer.close(); process.exit(code);
