// The playoff race card on Home, weeks 13-18: what this week can clinch (or end) for you, and the
// other games that matter with who to root for.
import React, { useMemo } from "react";
import { C, TeamLogo } from "./ui.jsx";
import { raceWatch } from "./race.js";

export default function RaceWatch({ teams, sched, ui, wk, mobile }) {
  const r = useMemo(() => raceWatch(teams, sched, ui, wk), [teams, sched, ui, wk]);
  if (!r) return null;
  const good = r.lines.some((l) => /clinch|locked|won the division|in the playoffs/.test(l));
  const tone = r.out ? C.mt : good ? C.gn : C.gd;
  return (
    <div style={{ marginTop: 8, background: "#00000040", border: `1px solid ${tone}55`, borderLeft: `4px solid ${tone}`, borderRadius: 10, padding: "9px 12px" }}>
      <div style={{fontSize: 13, fontWeight: 800, color: tone, marginBottom: 3 }}>Playoff race · week {wk}</div>
      {r.lines.map((l, i) => <div key={i} style={{ fontSize: i ? 13.5 : 15, fontWeight: i ? 600 : 800, color: i ? "#cbd5e1" : "#fff", lineHeight: 1.35 }}>{l}</div>)}
      {r.games.length > 0 && <>
        <div style={{fontSize: 13, fontWeight: 800, color: C.mt, margin: "8px 0 3px" }}>Games to watch</div>
        {r.games.map(({ g, root, why }) => {
          const a = teams[g.a], h = teams[g.h], rt = teams[root];
          return (
            <div key={`${g.h}-${g.a}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 13.5, flexWrap: mobile ? "wrap" : "nowrap" }}>
              <TeamLogo t={a} sz={20} /><b style={{ minWidth: 30 }}>{a.ab}</b><span style={{ color: C.mt }}>@</span><TeamLogo t={h} sz={20} /><b style={{ minWidth: 30 }}>{h.ab}</b>
              <span style={{ marginLeft: mobile ? 0 : 6, color: "#cbd5e1", flex: 1, minWidth: 0 }}>Root for the <b style={{ color: C.gn }}>{rt.name}</b>: the {why}.</span>
            </div>
          );
        })}
      </>}
    </div>
  );
}
