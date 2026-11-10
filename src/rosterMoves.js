// Your roster moves: practice squad, injured reserve and releases. Each takes your club and
// returns a new club (never edits the one passed in) or { error } saying why it can't be done.
// Kept apart from the screens so the rules can be tested: these moves once wiped a $45M contract
// (practice squad and back), deleted a released practice-squad player, and edited live rosters.
import { chargeDead } from "./bonus.js";

export const PS_MAX = 10, IR_MAX = 8, ROSTER_MAX = 53;
const copy = (t) => ({ ...t, roster: [...(t.roster || [])], ps: [...(t.ps || [])], ir: [...(t.ir || [])] });

// Down to the practice squad: only players on near-minimum deals (minSal: the league minimum).
export function toPracticeSquad(team, pid, { minSal }) {
  const t = copy(team);
  const i = t.roster.findIndex((p) => p.id === pid);
  if (i < 0) return { error: "He isn't on the roster" };
  if (t.ps.length >= PS_MAX) return { error: `Practice squad full (${PS_MAX}/${PS_MAX})!` };
  const p = t.roster[i];
  if ((p.salary || 0) > minSal * 2) return { error: `${p.name} is on too big a contract for the practice squad` };
  t.roster.splice(i, 1);
  t.ps.push({ ...p, psSal: p.salary || 0, salary: 0 });
  return { team: t, player: p };
}

// Up to the 53: he gets his salary back (at least the minimum). capRoom: room under the cap now.
// callUp: a temporary call-up during the season (flags him to go back down).
export function fromPracticeSquad(team, pid, { minSal, capRoom = Infinity, callUp = null }) {
  const t = copy(team);
  const i = t.ps.findIndex((p) => p.id === pid);
  if (i < 0) return { error: "He isn't on the practice squad" };
  if (t.roster.length >= ROSTER_MAX) return { error: `Roster is full (${ROSTER_MAX}). Make room first.` };
  const p = t.ps[i];
  const salary = +Math.max(p.psSal || 0, minSal).toFixed(2);
  if (capRoom < salary) return { error: `Not enough cap space for ${p.name} ($${salary}M)` };
  t.ps.splice(i, 1);
  const { psSal: _drop, ...pp } = p;
  t.roster.push({ ...pp, salary, ...(callUp ? { psCallUp: true, callUpWk: callUp.wk } : {}) });
  return { team: t, player: p, salary };
}

// Cut from the practice squad: he's returned so he can go to free agency.
export function releaseFromPracticeSquad(team, pid) {
  const t = copy(team);
  const p = t.ps.find((x) => x.id === pid);
  if (!p) return { error: "He isn't on the practice squad" };
  t.ps = t.ps.filter((x) => x.id !== pid);
  const { psSal: _drop, ...pp } = p;
  return { team: t, player: pp };
}

// Injured reserve: injured players only. Early in the season a long injury can be PUP (back in
// week 9 at the earliest) or NFI (out for the year). rand: random 0-1 for that roll.
export function toInjuredReserve(team, pid, { wk, rand = Math.random }) {
  const t = copy(team);
  const i = t.roster.findIndex((p) => p.id === pid);
  if (i < 0) return { error: "He isn't on the roster" };
  const p = t.roster[i];
  if (!p.injured) return { error: "Only injured players can be placed on IR!" };
  if (t.ir.length >= IR_MAX) return { error: `IR full (${IR_MAX}/${IR_MAX})!` };
  let irType = "IR", irMin = 8, irReturnWk = wk + (p.injRecWks || 8);
  if (wk < 4) { const r = rand(); if (r < 0.3) { irType = "PUP"; irReturnWk = Math.max(irReturnWk, 9); } else if (r < 0.5) { irType = "NFI"; irMin = 99; irReturnWk = 999; } }
  t.roster.splice(i, 1);
  t.ir.push({ ...p, irWk: wk, irMin, irReturnWk, irType });
  return { team: t, player: p, irType };
}

// Back from IR, once his minimum stay is served and there's room on the 53.
export function fromInjuredReserve(team, pid, { wk }) {
  const t = copy(team);
  const p = t.ir.find((r) => r.id === pid);
  if (!p) return { error: "He isn't on IR" };
  if (t.roster.length >= ROSTER_MAX) return { error: "Roster full (53) — release someone first!" };
  const left = (p.irMin || 8) - (wk - (p.irWk || 0));
  if (left > 0) return { error: `IR minimum not met — ${left} wk(s) remaining` };
  t.ir = t.ir.filter((r) => r.id !== pid);
  t.roster.push({ ...p, injured: false, injWk: 0, injType: "" });
  return { team: t, player: p };
}

// Release from the 53. dm: his dead money (bonus.js deadMoney), charged to the club. june1: a
// post-June 1 designation (counted against the club's allowance).
export function releasePlayer(team, pid, { dm, june1 = false }) {
  const t = copy(team);
  const i = t.roster.findIndex((p) => p.id === pid);
  if (i < 0) return { error: "He isn't on the roster" };
  const [p] = t.roster.splice(i, 1);
  chargeDead(t, dm);
  if (june1) t.june1 = (t.june1 || 0) + 1;
  return { team: t, player: p };
}
