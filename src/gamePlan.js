// The weekly game plan: how you attack this opponent and how you defend him. Each plan is worth
// something only against the right opponent: running is the call when your run game has a bigger
// edge on their run defense than your passing has on their coverage; stacking the box when
// their run game is the bigger threat; blitzing when your pass rush beats their line. Every
// club, yours included, goes into the week with the plan that suits the matchup best unless you
// pick one for this week yourself. A pick lasts one week.
//
// mine / theirs: unitRatings() from gamesim.js (pass, run, passD, runD, rush, ol).

export const OFF_PLANS = [
  { key: "run_heavy", label: "Run heavy", icon: "" },
  { key: "balanced", label: "Balanced", icon: "" },
  { key: "pass_heavy", label: "Pass heavy", icon: "" },
];
export const DEF_PLANS = [
  { key: "run_stop", label: "Stack the box", icon: "" },
  { key: "balanced", label: "Balanced", icon: "" },
  { key: "aggressive", label: "Blitz", icon: "" },
  { key: "coverage", label: "Drop into coverage", icon: "" },
];
// older saves' defensive plans
const OLD_DEF = { conservative: "coverage", prevent: "coverage" };
export const defKey = (k) => OLD_DEF[k] || k;

const clamp = (v, a = -1.5, b = 1.5) => Math.max(a, Math.min(b, v));
const r0 = (v) => Math.round(v);
// a hedge: never the best call, never a bad one
const HEDGE = 0.25;

// Every option with its value this week (in points the offense gains, or the opponent loses) and why.
export function planOptions(mine, theirs) {
  const runEdge = mine.run - theirs.runD, passEdge = mine.pass - theirs.passD;
  const runThreat = theirs.run - mine.runD, passThreat = theirs.pass - mine.passD;
  const rushEdge = mine.rush - theirs.ol;
  const off = {
    run_heavy: { v: clamp((runEdge - passEdge) * 0.15), why: `your run game (${r0(mine.run)}) against their run defense (${r0(theirs.runD)})` },
    balanced: { v: HEDGE, why: "mixes it up; no big edge either way" },
    pass_heavy: { v: clamp((passEdge - runEdge) * 0.15), why: `your passing (${r0(mine.pass)}) against their coverage (${r0(theirs.passD)})` },
  };
  const def = {
    run_stop: { v: clamp((runThreat - passThreat) * 0.15), why: `their run game (${r0(theirs.run)}) against your front (${r0(mine.runD)})` },
    balanced: { v: HEDGE, why: "sound against anything; no big gamble" },
    aggressive: { v: clamp(rushEdge * 0.12 - 0.4), why: `your pass rush (${r0(mine.rush)}) against their line (${r0(theirs.ol)})${rushEdge < 0 ? "; risky, they'll pick it up" : ""}` },
    coverage: { v: clamp((passThreat - runThreat) * 0.15), why: `their passing (${r0(theirs.pass)}) against your secondary (${r0(mine.passD)})` },
  };
  return { off, def };
}

const bestOf = (opts) => Object.entries(opts).sort((a, b) => b[1].v - a[1].v)[0][0];
export function bestPlan(mine, theirs) {
  const o = planOptions(mine, theirs);
  return { off: bestOf(o.off), def: bestOf(o.def) };
}

// The plan a club takes into this game. plan: your saved choice ({ off, def, wk, auto }); it only
// counts in the week it was made for. wk: this game's week. Anything else: the best fit.
export function resolvePlan(plan, mine, theirs, wk) {
  const best = bestPlan(mine, theirs);
  const set = plan && !plan.auto && plan.wk != null && plan.wk === wk;
  return { ...(plan || {}), off: set ? plan.off : best.off, def: set ? defKey(plan.def) : best.def, auto: !set };
}

// What the chosen plans are worth to each offense, in points (hMod / aMod in gameSetup).
export function planEdge(hPlan, aPlan, hU, aU) {
  const h = planOptions(hU, aU), a = planOptions(aU, hU);
  const off = (o, k) => o.off[k]?.v ?? 0, def = (o, k) => o.def[defKey(k)]?.v ?? 0;
  return { h: off(h, hPlan.off) - def(a, aPlan.def), a: off(a, aPlan.off) - def(h, hPlan.def) };
}

// A letter for how well a plan suits the matchup (for the screen).
export const planGrade = (v) => (v >= 1 ? "A" : v >= 0.5 ? "B" : v >= 0.1 ? "C" : v >= -0.4 ? "D" : "F");
