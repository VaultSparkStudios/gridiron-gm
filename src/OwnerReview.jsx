// The owner's season review: one sheet when a new season starts, with his verdict, how his
// patience moved, the year you had against his targets, the mandate he's holding you to and what
// he expects next. (It used to be a toast that came and went in a few seconds.)
import React from "react";
import { C, Btn, CloseX, sheetWrap, sheetBox, SheetGrip, TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";

const TONE = { fine: C.gn, warning: C.gd, ultimatum: C.rd, fired: C.rd };
const HEAD = { fine: "PLEASED", warning: "UNEASY", ultimatum: "ULTIMATUM", fired: "FIRED" };
// a quiet year reads as steady, not pleased, when his patience slipped
const head = (r) => r.verdict !== "fine" ? HEAD[r.verdict] || "REVIEW" : r.champ ? "THRILLED" : r.playoffs ? "PLEASED" : r.after >= r.before ? "SATISFIED" : "STEADY";

function Patience({ before, after }) {
  const col = (v) => (v >= 60 ? C.gn : v >= 35 ? C.gd : C.rd);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mt, fontWeight: 800, letterSpacing: 1 }}>
        <span>Owner patience</span><span><span style={{ color: col(before) }}>{before}</span> → <b style={{ color: col(after) }}>{after}</b> / 100</span>
      </div>
      <div style={{ position: "relative", height: 10, background: "#0b1220", borderRadius: 5, marginTop: 5, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${Math.max(before, after)}%`, background: after < before ? `${C.rd}55` : `${C.gn}55` }} />
        <div style={{ position: "absolute", inset: 0, width: `${Math.min(before, after)}%`, background: col(after) }} />
      </div>
    </div>
  );
}

const Row = ({ label, value, ok }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.bd}` }}>
    <span style={{ width: 22, textAlign: "center", fontSize: 16 }}>{ok == null ? "•" : ok ? "✓" : "✕"}</span>
    <span style={{ flex: 1, fontSize: 14, color: "#cbd5e1" }}>{label}</span>
    <b style={{ fontSize: 14, textAlign: "right" }}>{value}</b>
  </div>
);

export default function OwnerReview({ r, team, onClose }) {
  const tone = TONE[r.verdict] || C.gn;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.86)", zIndex: 2300, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, ...sheetWrap(MOBILE) }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Owner's review" style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: "#0b1220", border: `2px solid ${tone}`, borderRadius: 16, ...sheetBox(MOBILE) }}>
        {MOBILE && <SheetGrip onClose={onClose} />}
        <CloseX onClick={onClose} />
        <div style={{ padding: "16px 56px 12px 18px", background: `linear-gradient(135deg, ${tone}33, #0b1220)` }}>
          <div style={{fontSize: 13, fontWeight: 800, color: tone }}>Owner's review · {r.yr} · {head(r)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {team && <TeamLogo t={team} sz={40} />}
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{r.msg}</div>
          </div>
        </div>
        <div style={{ padding: "12px 18px 16px" }}>
          <Patience before={r.before} after={r.after} />
          <div style={{ marginTop: 12 }}>
            <Row label="Record" value={r.rec} ok={null} />
            <Row label="Playoffs" value={r.champ ? "Won the Super Bowl" : r.playoffs ? (r.division ? "Division champs" : "Made it") : "Missed"} ok={r.playoffs} />
            {r.goal && <Row label={`Owner's target: ${r.goal.wins}+ wins`} value={r.goal.met ? "Met" : `Missed by ${r.goal.wins - r.wins}`} ok={r.goal.met} />}
            {r.arc && <Row label={`Mandate: ${r.arc.demand}`} value={r.arc.met ? "Done" : r.arc.failed ? "Failed" : "In progress"} ok={r.arc.met ? true : r.arc.failed ? false : null} />}
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#ffffff08", border: "1px solid #ffffff10", fontSize: 14, color: "#e2e8f0" }}>
            <b style={{ color: C.gd }}>Next season:</b> he wants at least <b>{r.nextWins} wins</b>.{r.verdict === "ultimatum" ? " Miss it and you're likely gone." : ""}
          </div>
          <Btn onClick={onClose} bg={C.gn} style={{ width: "100%", marginTop: 14, fontSize: 16, padding: "11px 0", fontWeight: 900 }}>Got it</Btn>
        </div>
      </div>
    </div>
  );
}
