// The transactions wire: every trade, signing, release, coaching move and notable retirement in the
// league, kept with the season and week it happened. Most of them already go to the league log as
// they happen; wireFromLog() picks those lines out (the log only keeps its latest 150, the wire keeps
// years of them), and the off-season signing waves that never reach the log are added directly.
// Entry: { y: season, when: "Wk 7" | "Free agency" | ..., k: kind, t: text, tm: [team indexes] }.

export const WIRE_MAX = 3000;
export const KINDS = [
  ["trade", "Trades"],
  ["sign", "Signings"],
  ["release", "Releases"],
  ["coach", "Coaches"],
  ["retire", "Retirements"],
];

// What kind of transaction a log line records, or null if it isn't one. Reads the words (older saves
// led each line with an emoji, so that's dropped first).
const LEAD = /^(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}0-9]|\u{200D})+\s*/u;
export function classify(text) {
  const raw = String(text || "");
  const s = /^\d/.test(raw) && !/^\d\u{FE0F}?\u{20E3}/u.test(raw) ? raw : raw.replace(LEAD, "");
  if (/^(DEADLINE DEAL|DRAFT-DAY TRADE|URGENT TRADE|Trade with )/.test(s)) return "trade";
  if (/^The .* hire |^The .* fire |^.* (head coach|coordinator|special teams coach) .* retires at|^The .* sign head coach |^.* head coach .* says .* last season/.test(s)) return "coach";
  if (/^(Signed|Re-signed|VET MIN|Franchise tagged|Picked up the fifth-year option|OFFER SHEET)|^.* signs with /.test(s)) return "sign";
  if (/^Released |→ WAIVERS/.test(s)) return "release";
  if (/ retires (after|at) /.test(s) && !/free agent\) retires/.test(s)) return "retire";
  return null;
}

// The clubs a line names (by nickname or abbreviation), as team indexes.
export function teamsIn(text, teams) {
  const s = String(text || "");
  const out = [];
  (teams || []).forEach((t, i) => {
    if (!t) return;
    if ((t.name && s.includes(t.name)) || (t.ab && new RegExp(`\\b${t.ab}\\b`).test(s))) out.push(i);
  });
  return out;
}

// When it happened, in words.
export const whenLabel = (sp, wk) => (sp === "regular" ? `Wk ${Math.max(1, wk)}` : { preseason: "Preseason", playoffs: "Playoffs", combine: "Combine", resign: "Re-sign week", freeagency: "Free agency", draft: "Draft" }[sp] || "Off-season");

// New wire entries from the lines just added to the log (newest first, as the log keeps them).
export function wireFromLog(lines, { yr, sp, wk, teams, ui }) {
  const out = [];
  for (const t of lines) {
    const k = classify(t);
    if (!k) continue;
    const tm = teamsIn(t, teams);
    // your own moves (signings, releases) don't always name your club; they're yours
    if (!tm.length && ui != null && (k === "sign" || k === "release")) tm.push(ui);
    out.push({ y: yr, when: whenLabel(sp, wk), k, t: String(t).replace(/^\S+\s/, (m) => (/^[A-Za-z]/.test(m) ? m : "")), tm });
  }
  return out;
}

// Signings from an AI free-agency wave ({ p, team, from }), as wire entries.
// Depth signings under 65 OVR are left off: the wire is for moves people notice.
export function wireFromSignings(signed, { yr, sp, wk, teams }) {
  return (signed || []).filter(({ p }) => (p.ovr || 0) >= 65).map(({ p, team, from }) => {
    const t = teams[team], old = from != null ? teams[from] : null;
    return { y: yr, when: whenLabel(sp, wk), k: "sign", t: `${p.name} (${p.pos} ${p.ovr}) signs with the ${t?.name || "?"}: ${p.contract || 1} yr${(p.contract || 1) > 1 ? "s" : ""}, $${(+p.salary || 0).toFixed(1)}M a year${old && old !== t ? `, leaving the ${old.name}` : ""}`, tm: [team, ...(from != null && from !== team ? [from] : [])] };
  });
}

// Newest first, trimmed to WIRE_MAX.
export const addToWire = (wire, entries) => (entries.length ? [...entries, ...(wire || [])].slice(0, WIRE_MAX) : wire || []);
