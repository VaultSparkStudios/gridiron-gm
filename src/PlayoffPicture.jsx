// The playoff picture during the season: who'd be in if the season ended today (seven seeds per
// conference, the #1 seed's bye, division leaders and wild cards), who's chasing the last spot and
// how far back, and the bracket those seeds would make.
import { MOBILE } from "./mobile.js";
import React from "react";
import { C, TeamLogo } from "./ui.jsx";
import { nflSeeds, makeBracket } from "./playoffs.js";
import PlayoffBracket from "./PlayoffBracket.jsx";

const pct = (t) => (t.w + (t.t || 0) * 0.5) / Math.max(1, t.w + t.l + (t.t || 0));
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const back = (lead, t) => ((lead.w - t.w) + (t.l - lead.l)) / 2;

function Conference({ conf, teams, ui }) {
  const seeds = nflSeeds(teams, conf).map((id) => teams[id]);
  const last = seeds[6];
  const hunt = teams.filter((t) => t.c === conf && !seeds.includes(t)).sort((a, b) => pct(b) - pct(a) || (b.pf - b.pa) - (a.pf - a.pa)).slice(0, 4);
  const Row = ({ t, seed, tag, gb }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: t.id === ui ? "#22c55e14" : "transparent", border: `1px solid ${t.id === ui ? "#22c55e66" : "transparent"}` }}>
      <span style={{ width: 22, textAlign: "right", fontWeight: 900, color: seed ? C.gd : C.mt, fontSize: 14 }}>{seed || ""}</span>
      <TeamLogo t={t} sz={26} glow />
      <span style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 14, color: t.id === ui ? C.gn : C.tx, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.city} {t.name}</span>
      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 44, textAlign: "right" }}>{rec(t)}</span>
      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.8, minWidth: 64, textAlign: "right", color: tag === "BYE" ? C.gd : tag === "DIV" ? "#38bdf8" : tag === "WC" ? "#a78bfa" : C.mt }}>{gb != null ? (gb <= 0 ? "TIED" : `${gb} GB`) : tag}</span>
    </div>
  );
  return (
    <div style={{ flex: "1 1 360px", minWidth: 0, background: "#ffffff0d", borderRadius: 18, padding: "14px 14px 8px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{conf}</div>
      {seeds.map((t, i) => <Row key={t.id} t={t} seed={i + 1} tag={i === 0 ? "BYE" : i < 4 ? "DIV" : "WC"} />)}
      <div style={{ fontSize: 14, fontWeight: 700, color: C.mt, margin: "10px 0 2px 8px" }}>In the hunt</div>
      {hunt.map((t) => <Row key={t.id} t={t} gb={back(last, t)} />)}
    </div>
  );
}

export default function PlayoffPicture({ teams, ui, wk, onBox }) {
  if (teams.length < 32) return null;
  const pb = makeBracket(nflSeeds(teams, "AFC"), nflSeeds(teams, "NFC"));
  const mine = [...pb.seeds.AFC, ...pb.seeds.NFC].indexOf(ui);
  const me = teams[ui];
  return (
    <div>
      {/* phones keep the title (on a computer the Season header names the screen) */}
      {MOBILE && <div style={{ fontSize: 24, fontWeight: 900, margin: "4px 2px 4px" }}>Playoff picture</div>}
      <div style={{ fontSize: 15, color: C.mt, marginBottom: 12 }}>If the season ended today{wk ? ` (after Week ${wk})` : ""}. Seeds 1-4 are division leaders, 5-7 wild cards; the #1 seed gets the only bye.
        {me && <b style={{ color: mine >= 0 ? C.gn : C.rd }}> The {me.name} are {mine >= 0 ? `the ${me.c} #${(mine % 7) + 1} seed` : "out right now"}.</b>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Conference conf="AFC" teams={teams} ui={ui} />
        <Conference conf="NFC" teams={teams} ui={ui} />
      </div>
      <PlayoffBracket pb={pb} teams={teams} ui={ui} onBox={onBox} title="The bracket these seeds would make" />
    </div>
  );
}
