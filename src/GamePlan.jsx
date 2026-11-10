// Schemes: your coordinators' offensive and defensive schemes (with how well each
// one fits the roster you have), your personnel, and coaching specializations.
// The same panel sits on the depth chart and on the coaching screen.
import React from "react";
import { C, Sheet } from "./ui.jsx";
import { MOBILE } from "./mobile.js";

export const SCHEME_INFO = {
  "Air Raid": "Spread the field and throw it: about 28% runs. Built for a quarterback rated 71+.",
  "West Coast": "Short, timed passes and a balanced run game: about 42% runs. Fits a quarterback rated 66+.",
  Spread: "Space and tempo with a mobile quarterback: about 35% runs. Fits a QB with 71+ speed.",
  "Power Run": "Downhill football: about 60% runs. Built around a running back rated 71+.",
  "3-4": "Three down linemen and four linebackers. Built around a linebacker rated 71+.",
  "4-3": "Four down linemen and three linebackers. Built around a defensive lineman rated 71+.",
  "Cover 2": "Two deep safeties and zone underneath. Doesn't need a specific star.",
  "Zone Blitz": "Pressure from anywhere with zone behind it. Fits a linebacker rated 66+.",
};
const SPECS = [{ role: "oc", lbl: "Offensive coordinator", specs: ["Run Game", "Play-Action", "Spread"], clr: "#22c55e" }, { role: "dc", lbl: "Defensive coordinator", specs: ["Blitz Pkg", "Zone Cov", "Press", "Run Stop"], clr: "#ef4444" }, { role: "st", lbl: "Special teams", specs: ["Kick Return", "Coverage", "Block FG"], clr: "#f59e0b" }];

const card = { background: "#ffffff0d", borderRadius: 18, padding: "14px 16px" };
const head = { fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 };

// team: your team; fit(team, role): the fit bonus (0-2) for its current schemes; schemes: { oc: [...], dc: [...] }
export default function GamePlan({ team, sp, fit, schemes, onScheme, coachSpec = {}, onSpecialize, compact, strip, personnel }) {
  // strip: under the depth chart, a one-line summary; each part opens on its own when you want it
  const [open, setOpen] = React.useState(null);
  const [armed, setArmed] = React.useState(null); // phones: a spend waiting for its second tap
  React.useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(null), 3000); return () => clearTimeout(t); }, [armed]);
  const spend = (key, fn) => () => { if (MOBILE && armed !== key) { setArmed(key); return; } setArmed(null); fn(); };
  const coach = team.coach || {};
  const trans = team._schemeTransWks || 0;
  const SchemeCard = ({ role, title }) => {
    const c = coach[role];
    const with_ = (s) => fit({ ...team, coach: { ...coach, [role]: { ...c, scheme: s } } }, role);
    return (
      <div style={card}>
        <div style={head}>{title}</div>
        {!c ? <div style={{ color: C.mt, fontSize: 14 }}>No coordinator. Hire one on the coaching screen to run a scheme.</div> : <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{c.scheme}</span>
            <span style={{ fontSize: 13, color: C.mt }}>run by {c.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: fit(team, role) > 0 ? C.gn : C.mt }}>{fit(team, role) > 0 ? `Fits your roster · +${fit(team, role)}` : "No roster fit bonus"}</span>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 10px", lineHeight: 1.45 }}>{SCHEME_INFO[c.scheme]}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.mt, marginBottom: 6 }}>Switch schemes for 2 SP. The team plays about 2 points a game worse for 2 games while it's installed.</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${compact ? 140 : 170}px,1fr))`, gap: 6 }}>
            {schemes[role].filter((s) => s !== c.scheme).map((s) => {
              const f = with_(s), ok = sp >= 2;
              return (
                <button key={s} onClick={ok ? spend(`s:${role}:${s}`, () => onScheme(role, s)) : undefined} disabled={!ok} title={SCHEME_INFO[s]} style={{ textAlign: "left", background: armed === `s:${role}:${s}` ? "#78350f55" : C.bg, border: `1px solid ${armed === `s:${role}:${s}` ? "#f59e0b" : f > 0 ? "#22c55e66" : C.bd}`, borderRadius: MOBILE ? 12 : 8, padding: MOBILE ? "10px 12px" : "8px 10px", minHeight: MOBILE ? 56 : undefined, color: C.tx, cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.55 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{armed === `s:${role}:${s}` ? "Tap again · 2 SP" : s}</div>
                  <div style={{ fontSize: 12, color: f > 0 ? C.gn : C.mt, fontWeight: 700 }}>{armed === `s:${role}:${s}` ? `Switch to ${s}` : f > 0 ? `Would fit · +${f}` : "No fit bonus"}</div>
                </button>
              );
            })}
          </div>
        </>}
      </div>
    );
  };
    // the strip (phone and desktop): a few quiet rows, each opening its part in a sheet
  if (strip) {
    const rowS = { display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 54, background: "transparent", border: 0, padding: 0, color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 16 };
    const rows = [
      ["schemes", "Offense", <>{coach.oc?.scheme || "—"}{coach.oc && fit(team, "oc") > 0 && <span style={{ color: C.gn }}> +{fit(team, "oc")}</span>}</>],
      ["schemes", "Defense", <>{coach.dc?.scheme || "—"}{coach.dc && fit(team, "dc") > 0 && <span style={{ color: C.gn }}> +{fit(team, "dc")}</span>}</>],
      personnel && ["pers", "Personnel", <>{({ auto: "Auto", balanced: "Balanced", spread: "Spread", twoTE: "Two TE", fullback: "Fullback", heavy: "Heavy" })[team.personnel || "auto"]} / {({ auto: "Auto", match: "Match", base: "Base", nickel: "Nickel" })[team.defPkg || "auto"]}</>],
      onSpecialize && ["spec", "Coaching specialties", <>{Object.values(coachSpec).filter(Boolean).length || "None"}</>],
    ].filter(Boolean);
    const title = { schemes: "Schemes", pers: "Personnel", spec: "Coaching specialties" };
    return (
      <div style={{ background: MOBILE ? "#ffffff0f" : "#ffffff0d", borderRadius: 18, padding: "0 14px" }}>
        {!MOBILE && <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", padding: "12px 0 2px" }}>Game plan</div>}
        {trans > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", padding: "10px 0 2px" }}>New scheme installing: {trans} game{trans > 1 ? "s" : ""} to go</div>}
        {rows.map(([k, l, v], i) => <button key={l} onClick={() => setOpen(k)} style={{ ...rowS, borderTop: i ? "1px solid #ffffff10" : 0 }}><span style={{ color: "#94a3b8" }}>{l}</span><b style={{ marginLeft: "auto" }}>{v}</b><span style={{ fontSize: 20, color: "#64748b" }}>›</span></button>)}
        {open && <Sheet title={title[open]} onClose={() => setOpen(null)}>
          {open === "pers" && personnel}
          {open === "schemes" && <div style={{ display: "grid", gap: 10 }}><SchemeCard role="oc" title="Offensive scheme" /><SchemeCard role="dc" title="Defensive scheme" /></div>}
          {open === "spec" && <div style={{ display: "grid", gap: 8 }}>{SPECS.map(({ role, lbl, specs, clr }) => { const c = coach[role]; if (!c) return null; const cur = coachSpec[role]; return (
            <div key={role} style={{ background: C.bg, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: clr }}>{lbl}: {c.name}</div>
              <div style={{ fontSize: 12, color: C.mt, marginTop: 2 }}>{cur ? `Specialized in ${cur}` : "5 SP · +3 to his rating"}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{specs.map((sx) => { const ok = sp >= 5 && cur !== sx, k = `c:${role}:${sx}`; return <button key={sx} onClick={ok ? spend(k, () => onSpecialize(role, sx)) : undefined} disabled={!ok} style={{ minHeight: 40, background: armed === k ? "#78350f55" : cur === sx ? `${clr}33` : "transparent", color: armed === k ? "#fde68a" : cur === sx ? clr : ok ? "#cbd5e1" : C.mt, border: `1px solid ${armed === k ? "#f59e0b" : cur === sx ? clr : C.bd}`, borderRadius: 10, padding: "0 12px", fontSize: 14, fontWeight: 700 }}>{armed === k ? "Tap again · 5 SP" : sx}</button>; })}</div>
            </div>
          ); })}</div>}
          <div style={{ height: 8 }} />
        </Sheet>}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {personnel && personnel}
      {trans > 0 && <div style={{ ...card, color: "#fca5a5", fontSize: 14, fontWeight: 700 }}>A new scheme is still being installed: {trans} game{trans > 1 ? "s" : ""} to go.</div>}
      {<div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(${compact ? 280 : 300}px,1fr))`, gap: 10 }}>
        <SchemeCard role="oc" title="Offensive scheme" />
        <SchemeCard role="dc" title="Defensive scheme" />
      </div>}
      {onSpecialize && (
        <div style={card}>
          <div style={head}>Coaching specialization <span style={{ fontSize: 13, color: C.mt, fontWeight: 600 }}>5 SP each · +3 to that coach's rating</span></div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(${compact ? 240 : 260}px,1fr))`, gap: 8 }}>
            {SPECS.map(({ role, lbl, specs, clr }) => {
              const c = coach[role]; if (!c) return null;
              const cur = coachSpec[role];
              return (
                <div key={role} style={{ background: "#ffffff0a", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: clr }}>{lbl}: {c.name}</div>
                  {cur && <div style={{ fontSize: 12, color: C.mt, marginTop: 2 }}>Specialized in {cur}</div>}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {specs.map((s) => { const ok = sp >= 5 && cur !== s, k = `c:${role}:${s}`; return <button key={s} onClick={ok ? spend(k, () => onSpecialize(role, s)) : undefined} disabled={!ok} style={{ background: armed === k ? "#78350f55" : cur === s ? `${clr}33` : "transparent", color: armed === k ? "#fde68a" : cur === s ? clr : ok ? "#cbd5e1" : C.mt, border: `1px solid ${armed === k ? "#f59e0b" : cur === s ? clr : C.bd}`, borderRadius: MOBILE ? 10 : 6, padding: MOBILE ? "9px 12px" : "5px 9px", fontSize: 13, fontWeight: 700, cursor: ok ? "pointer" : "default" }}>{armed === k ? "Tap again · 5 SP" : s}</button>; })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
