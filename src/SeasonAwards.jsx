// The season's honors, shown the moment the Super Bowl ends: the champion, the Super Bowl MVP and
// the regular-season awards (MVP, OPOY, DPOY and both Rookies of the Year).
import React from "react";
import { C, TeamLogo, Btn, Bdg } from "./ui.jsx";
import { sbName, sbNumber } from "./data/superbowls.js";

// The Super Bowl MVP: the best line on the winning side of the box score.
export function superBowlMvp(box, ti) {
  const score = (l) => (l.passYds || 0) / 25 + (l.passTD || 0) * 4 - (l.passInt || 0) * 3 + (l.rushYds || 0) / 10 + (l.recYds || 0) / 10 + ((l.rushTD || 0) + (l.recTD || 0)) * 6 + (l.sacks || 0) * 5 + (l.ints || 0) * 6 + (l.tkl || 0) * 0.5;
  const best = Object.entries(box || {}).map(([pid, l]) => ({ pid, l })).sort((a, b) => score(b.l) - score(a.l))[0];
  if (!best) return null;
  const l = best.l, bits = [];
  if (l.att) bits.push(`${l.comp || 0}/${l.att}, ${l.passYds || 0} yds, ${l.passTD || 0} TD`);
  if (l.rushYds) bits.push(`${l.rushYds} rush yds${l.rushTD ? `, ${l.rushTD} TD` : ""}`);
  if (l.recYds) bits.push(`${l.rec || 0} rec, ${l.recYds} yds${l.recTD ? `, ${l.recTD} TD` : ""}`);
  if (l.sacks) bits.push(`${l.sacks} sacks`);
  if (l.ints) bits.push(`${l.ints} INT`);
  if (!bits.length && l.tkl) bits.push(`${l.tkl} tackles`);
  return { pid: best.pid, name: l.name, pos: l.pos, ti, stat: bits.slice(0, 2).join(" · ") };
}

const ROWS = [["mvp", "Most Valuable Player"], ["opoy", "Offensive Player of the Year"], ["dpoy", "Defensive Player of the Year"], ["oroy", "Offensive Rookie of the Year"], ["droy", "Defensive Rookie of the Year"]];

function Row({ label, w, teams, ui, big }) {
  const t = w ? teams[w.ti] : null;
  const mine = w && w.ti === ui;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: big ? "12px 14px" : "10px 12px", borderRadius: 10, background: mine ? `${C.gn}1c` : "#ffffff08", border: `1px solid ${mine ? C.gn : "#ffffff14"}` }}>
      {t ? <TeamLogo t={t} sz={big ? 40 : 32} /> : <span style={{ width: 32 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#fcd34d" }}>{label.toUpperCase()}</div>
        {w ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: big ? 19 : 17, fontWeight: 800 }}>{w.pos && <Bdg pos={w.pos} />}<span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>{mine && <span style={{ fontSize: 11, fontWeight: 900, color: C.gn }}>YOUR TEAM</span>}</div>
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>{t ? `${t.city} ${t.name}` : ""}{w.stat ? ` · ${w.stat}` : ""}</div>
          </>
        ) : <div style={{ fontSize: 15, color: C.mt }}>Not awarded</div>}
      </div>
    </div>
  );
}

export default function SeasonAwards({ show, teams, ui, onClose, cta = "Continue" }) {
  const { yr, champ, opp, score, sbmvp, awards = {} } = show;
  const ct = teams[champ], ot = opp != null ? teams[opp] : null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.88)", zIndex: 2300, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Season awards" style={{ width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", borderRadius: 16, background: "#0b1220", border: "2px solid #d4a017", boxShadow: "0 0 70px #d4a01744" }}>
        <div style={{ padding: "18px 20px 14px", textAlign: "center", background: `linear-gradient(135deg, ${ct?.clr || "#1e3a5f"}dd, #0b1220)` }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: "#fde68a" }}>{yr} SEASON AWARDS</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
            {ct && <TeamLogo t={ct} sz={64} />}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffffb0" }}>{sbName(sbNumber(yr))} champions</div>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{ct ? `${ct.city} ${ct.name}` : "—"}</div>
              {ot && score && <div style={{ fontSize: 14, color: "#e2e8f0" }}>Beat the {ot.name} {score}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Row label="Super Bowl MVP" w={sbmvp} teams={teams} ui={ui} big />
          {ROWS.map(([k, l]) => <Row key={k} label={l} w={awards[k]} teams={teams} ui={ui} />)}
          {awards.honors && (() => {
            const h = awards.honors, mineAP = [...h.ap1, ...h.ap2].filter((e) => e.ti === ui), minePB = [...h.pb.AFC, ...h.pb.NFC].filter((e) => e.ti === ui);
            return (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#ffffff08", border: "1px solid #ffffff14" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: "#fde68a", marginBottom: 6 }}>FIRST-TEAM ALL-PRO</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "3px 10px", fontSize: 13 }}>
                  {h.ap1.map((e) => <div key={e.pid} style={{ color: e.ti === ui ? "#86efac" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><b style={{ color: "#94a3b8", fontSize: 11, marginRight: 4 }}>{e.slot}</b>{e.name} <span style={{ color: "#64748b" }}>{e.team}</span></div>)}
                </div>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 8 }}>Your team: <b>{mineAP.length}</b> All-Pro{mineAP.length === 1 ? "" : "s"}{mineAP.length ? ` (${mineAP.map((e) => e.name).join(", ")})` : ""} · <b>{minePB.length}</b> Pro Bowler{minePB.length === 1 ? "" : "s"}{minePB.length ? ` (${minePB.map((e) => e.name).join(", ")})` : ""}. Each earns OVR in the off-season (+2 first-team All-Pro, +1 second team or Pro Bowl).</div>
              </div>
            );
          })()}
          <Btn onClick={onClose} bg={C.gn} style={{ width: "100%", marginTop: 6, fontSize: 16, padding: "10px 0", fontWeight: 900 }}>{cta}</Btn>
        </div>
      </div>
    </div>
  );
}
