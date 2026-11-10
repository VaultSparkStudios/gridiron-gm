// Week Prep: everything for this week's game on one screen. On the left, the game plan with the
// scouting report on the opponent (GamePlanCard, opened). On the right, a ready check (hurt
// starters still to replace, whether your identity and lean fit this opponent and your
// coordinators, the game plan), your situational packages, and the buttons to play or sim it.
import React from "react";
import { C } from "./ui.jsx";
import { SITUATIONS, OFF_SETS, DEF_SETS, coordFit } from "./personnel.js";
import { edgeWord } from "./scoutReport.js";

const H = { fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 };
const card = { background: "#ffffff0d", borderRadius: 18, padding: "14px 16px" };
const lbl = (sets, k) => sets.find((s) => s.key === k)?.label || k;

// team: your club; opp; report: scoutReport; planEl: the GamePlanCard (opened); injuries: the
// starter-down calls still open; onInjury(call); onSet(field, value) for personnel / defPkg / sit;
// onPlay / onSim (null when there's no game to play); planSet: you picked this week's plan.
export default function WeekHub({ team, opp, wk, report, planEl, injuries = [], onInjury, onSet, onPlay, onSim, onClose, planSet, mobile }) {
  const narrow = mobile || (typeof window !== "undefined" && window.innerWidth < 820);
  const cf = coordFit(team, report?.curOff);
  const checks = [];
  for (const c of injuries) checks.push({ ok: false, text: `${c.name} (${c.pos}) is out ${c.wks} week${c.wks > 1 ? "s" : ""}: pick who starts.`, act: ["Choose", () => onInjury(c)] });
  if (!injuries.length) checks.push({ ok: true, text: "No starters waiting on a replacement." });
  if (report) {
    const offBad = report.offGap >= 0.03, defBad = report.defGap >= 0.03;
    checks.push(offBad
      ? { ok: false, text: `${report.bestOff.label} has ${edgeWord(report.offGap)} over your ${lbl(OFF_SETS, report.curOff)} against them.`, act: ["Use it", () => onSet("personnel", report.bestOff.key)] }
      : { ok: true, text: `Your offense (${lbl(OFF_SETS, report.curOff)}) fits this matchup.` });
    checks.push(defBad
      ? { ok: false, text: `A ${report.bestDef.label.toLowerCase()} lean has ${edgeWord(report.defGap)} against their sets.`, act: ["Use it", () => onSet("defPkg", report.bestDef.key)] }
      : { ok: true, text: `Your defensive lean (${lbl(DEF_SETS, team.defPkg || "auto")}) fits.` });
  }
  if (cf.ocWants) checks.push(cf.off > 0 ? { ok: true, text: `Your OC is running a set he believes in.` } : { ok: false, text: `Your OC (${team.coach?.oc?.scheme}) wants ${lbl(OFF_SETS, cf.ocWants)}: this set costs about half a point.` });
  if (cf.dcWants) checks.push(cf.def > 0 ? { ok: true, text: `Your DC likes the lean.` } : { ok: false, text: `Your DC (${team.coach?.dc?.scheme}) wants ${lbl(DEF_SETS, cf.dcWants)}.` });
  checks.push({ ok: true, text: planSet ? "Game plan: your call for this game." : "Game plan: your coaches' best fit." });
  const open = checks.filter((c) => !c.ok).length;
  const sit = team.sit || {};
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3200, background: "rgba(0,0,0,.86)", display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", padding: mobile ? 0 : 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1424", border: 0, boxShadow: "0 30px 80px #000c", borderRadius: mobile ? "16px 16px 0 0" : 22, width: "100%", maxWidth: 1180, maxHeight: mobile ? "92vh" : "94vh", overflowY: "auto", padding: mobile ? 12 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.mt }}>Week {wk} prep</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>vs {opp.city} {opp.name} <span style={{ fontSize: 15, color: C.mt, fontWeight: 700 }}>({opp.w || 0}-{opp.l || 0}{opp.t ? `-${opp.t}` : ""})</span></div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: open ? "#fbbf24" : C.gn }}>{open ? `${open} to look at` : "✓ Ready"}</span>
          <button onClick={onClose} aria-label="Close" style={{ background: "#ffffff12", border: 0, color: "#e2e8f0", borderRadius: 20, fontSize: 18, width: 38, height: 38, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: narrow ? "minmax(0,1fr)" : "minmax(0,1.45fr) minmax(0,1fr)", gap: 12, alignItems: "start" }}>
          <div>{planEl}</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={card}>
              <div style={H}>Ready check</div>
              {checks.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i ? `1px solid ${C.bd}55` : "none" }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: "center", color: c.ok ? C.gn : "#fbbf24" }}>{c.ok ? "✓" : "!"}</span>
                  <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: c.ok ? "#cbd5e1" : C.tx }}>{c.text}</span>
                  {c.act && <button onClick={c.act[1]} style={{ fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 7, cursor: "pointer", background: `${C.bl}22`, color: "#93c5fd", border: `1px solid ${C.bl}` }}>{c.act[0]}</button>}
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={H}>Situations</div>
              {SITUATIONS.map((x) => (
                <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: x.side === "off" ? C.tx : "#fca5a5", flex: "1 1 150px", minWidth: 0 }}>{x.label}</span>
                  {x.opts.map((o) => {
                    const on = (sit[x.key] || "auto") === o;
                    return <button key={o} onClick={() => onSet("sit", { ...sit, [x.key]: o })} style={{ fontSize: 11, fontWeight: 800, padding: "3px 7px", borderRadius: 6, cursor: "pointer", background: on ? `${C.bl}33` : C.cd, color: on ? C.tx : C.mt, border: `1px solid ${on ? C.bl : C.bd}` }}>{o === "auto" ? "Auto" : /^\d/.test(o) ? o : o[0].toUpperCase() + o.slice(1)}</button>;
                  })}
                </div>
              ))}
            </div>
            {(onPlay || onSim) && (
              <div style={{ display: "flex", gap: 8 }}>
                {onPlay && <button onClick={onPlay} style={{ flex: 1, fontSize: 15, fontWeight: 900, padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer", background: C.gn, color: "#052e16" }}>▶ Play Week {wk}</button>}
                {onSim && <button onClick={onSim} style={{ flex: 1, fontSize: 15, fontWeight: 900, padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer", background: C.bl, color: "#fff" }}>Sim Week</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
