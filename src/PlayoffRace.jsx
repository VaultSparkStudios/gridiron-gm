// The playoff race, beside the division tables: a conference's seven seeds as they stand, then the
// teams in the hunt, each with its clinch mark (z: No. 1 seed, y: division, x: playoff spot) or e
// once it can't catch the last seed. Your conference shows first.
import React, { useState } from "react";
import { C, TeamLogo, Pills } from "./ui.jsx";
import { nflSeeds } from "./playoffs.js";
import { clinchStatus } from "./clinch.js";

const left = (sched, id) => sched.filter((g) => !g.played && typeof g.wk === "number" && g.wk <= 18 && (g.h === id || g.a === id)).length;
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;

export default function PlayoffRace({ teams, sched, ui }) {
  const [conf, setConf] = useState(teams[ui]?.c || "AFC");
  const seeds = nflSeeds(teams, conf);
  const last = teams[seeds[6]];
  const played = teams.some((t) => t.w + t.l > 0);
  const hunt = teams.filter((t) => t.c === conf && !seeds.includes(t.id)).sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa)).slice(0, 4);
  const mark = (id) => {
    if (!played) return null;
    const st = clinchStatus(teams, sched, id);
    if (st.top) return ["z", C.gd];
    if (st.div) return ["y", "#38bdf8"];
    if (st.berth) return ["x", C.gn];
    if (last && (teams[id].w + left(sched, id)) < last.w) return ["e", C.rd];
    return null;
  };
  const row = (id, seed) => {
    const t = teams[id], m = mark(id), me = id === ui;
    const gb = !seed && last ? (last.w - t.w + (t.l - last.l)) / 2 : null;
    return (
      <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 6px", borderRadius: 6, background: me ? `${C.gn}14` : "transparent", opacity: m?.[0] === "e" ? 0.5 : 1 }}>
        <span style={{ width: 20, fontSize: 12, fontWeight: 900, color: seed ? (seed <= 4 ? C.gd : "#cbd5e1") : C.mt, textAlign: "right" }}>{seed || "–"}</span>
        <TeamLogo t={t} sz={20} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: me ? 900 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
        {m && <span title={{ z: "Clinched the No. 1 seed", y: "Clinched the division", x: "Clinched a playoff spot", e: "Eliminated" }[m[0]]} style={{ fontSize: 11, fontWeight: 900, color: m[1], border: `1px solid ${m[1]}88`, borderRadius: 4, padding: "0 5px" }}>{m[0]}</span>}
        <span style={{ fontSize: 13.5, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>{rec(t)}</span>
        <span style={{ fontSize: 12, color: C.mt, minWidth: 34, textAlign: "right" }}>{gb != null ? (gb > 0 ? `${gb} GB` : "—") : ""}</span>
      </div>
    );
  };
  return (
    <div style={{ background: "#ffffff0d", borderRadius: 18, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", flex: 1 }}>Playoff race{played ? "" : " · preseason"}</span>
        <Pills items={[["AFC", "AFC"], ["NFC", "NFC"]]} value={conf} onChange={setConf} label="Conference" />
      </div>
      {seeds.map((id, i) => row(id, i + 1))}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.mt, margin: "6px 6px 1px" }}>In the hunt</div>
      {hunt.map((t) => row(t.id, null))}
    </div>
  );
}
