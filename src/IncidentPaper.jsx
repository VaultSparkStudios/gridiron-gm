// An off-field incident as the morning paper tells it: masthead, headline, the story, and a
// "What it means" box (games, pay, the legal case, his job and value).
import React from "react";
import { incidentArticle } from "./drama.js";
import { MOBILE } from "./mobile.js";

const serif = "Georgia, 'Times New Roman', serif";
export default function IncidentPaper({ inc, onClose, onPlayer }) {
  const a = incidentArticle(inc);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 2650, display: "flex", alignItems: "center", justifyContent: "center", padding: MOBILE ? 8 : 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Newspaper story" className="keep-light" style={{ background: "#f4efe1", color: "#1c1917", maxWidth: 640, width: "100%", maxHeight: "92vh", overflowY: "auto", borderRadius: 4, padding: MOBILE ? "14px 14px 18px" : "20px 28px 24px", fontFamily: serif, boxShadow: "0 20px 60px #000c", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 8, right: 10, background: "transparent", border: 0, fontSize: 22, color: "#57534e", cursor: "pointer" }}>✕</button>
        <div style={{ textAlign: "center", borderBottom: "3px double #1c1917", paddingBottom: 6 }}>
          <div style={{ fontSize: MOBILE ? 26 : 34, fontWeight: 900, letterSpacing: 1, fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', Georgia, serif" }}>The {inc.city} Ledger</div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#57534e", fontFamily: "system-ui", fontWeight: 700 }}>{a.dateline} · SPORTS · FINAL EDITION</div>
        </div>
        <div style={{ fontSize: MOBILE ? 28 : 38, fontWeight: 900, lineHeight: 1.05, margin: "12px 0 6px", textTransform: "uppercase" }}>{a.head}</div>
        <div style={{ fontSize: MOBILE ? 16 : 19, fontStyle: "italic", color: "#44403c", marginBottom: 10, lineHeight: 1.3 }}>{a.dek}</div>
        <div style={{ fontSize: 12, fontFamily: "system-ui", color: "#57534e", borderTop: "1px solid #a8a29e", borderBottom: "1px solid #a8a29e", padding: "4px 0", marginBottom: 10 }}>
          <span onClick={onPlayer} style={{ fontWeight: 800, color: "#1c1917", cursor: onPlayer ? "pointer" : "default", textDecoration: onPlayer ? "underline" : "none" }}>{inc.name}</span> · {inc.pos} · Age {inc.age} · {inc.ovr} OVR · {inc.club}
        </div>
        <div style={{ columnCount: MOBILE ? 1 : 2, columnGap: 22, fontSize: 15, lineHeight: 1.55, textAlign: "justify" }}>
          {a.body.map((t, i) => <p key={i} style={{ margin: "0 0 10px", textIndent: i ? 14 : 0 }}>{i === 0 && <span style={{ float: "left", fontSize: 44, lineHeight: 0.85, fontWeight: 900, marginRight: 5, marginTop: 4 }}>{t[0]}</span>}{i === 0 ? t.slice(1) : t}</p>)}
        </div>
        <div style={{ background: "#e7dfc9", border: "1px solid #a8a29e", padding: "10px 14px", marginTop: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: "system-ui", marginBottom: 6 }}>WHAT IT MEANS</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>{a.fallout.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
