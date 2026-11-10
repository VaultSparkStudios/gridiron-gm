// The inbox: everything that needs your attention in one list (trade offers, expiring deals,
// injuries, unspent scouting points, messages), instead of popups. An item opens the screen or
// the decision it's about.
import React from "react";
import { C, Btn, CloseX } from "./ui.jsx";

const TONE = { urgent: C.rd, action: C.gd, info: "#38bdf8" };

// items: [{ key, icon, title, sub, tone: "urgent" | "action" | "info", cta, onOpen, onDismiss, dismissLabel }]
const RANK = { urgent: 0, action: 1, info: 2 };
export default function Inbox({ items: raw, onClose, mobile }) {
  // urgent first, then decisions, then information (stable within each)
  const items = raw.map((it, i) => ({ it, i })).sort((a, b) => (RANK[a.it.tone] ?? 3) - (RANK[b.it.tone] ?? 3) || a.i - b.i).map((x) => x.it);
  const urgent = items.filter((i) => i.tone === "urgent").length;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1200, background: mobile ? C.bg : "#0007", display: "flex", justifyContent: mobile ? "stretch" : "flex-end", alignItems: "flex-start", padding: mobile ? 0 : "56px 14px 14px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: mobile ? "100%" : 440, maxHeight: mobile ? "100vh" : "80vh", overflowY: "auto", background: mobile ? C.cd : "#0d1424", border: 0, borderRadius: mobile ? 0 : 22, boxShadow: "0 18px 40px #000b", padding: mobile ? "14px 14px 96px" : 14 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 900 }}>Inbox</span>
          <span style={{ marginLeft: 8, fontSize: 13, color: C.mt }}>{items.length ? `${items.length} item${items.length === 1 ? "" : "s"}${urgent ? ` · ${urgent} urgent` : ""}` : "All caught up"}</span>
          <CloseX onClick={onClose} style={{ position: "static", marginLeft: "auto" }} />
        </div>
        {!items.length && <div style={{ color: C.mt, fontSize: 14, padding: "20px 4px", textAlign: "center" }}>Nothing needs your attention right now.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <div key={it.key} style={{ display: "flex", gap: 12, alignItems: "center", background: "#ffffff0d", borderRadius: 16, padding: "12px 14px" }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: TONE[it.tone] || "#64748b" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{it.title}</div>
                {it.sub && <div title={it.sub} style={{ fontSize: 12, color: C.mt, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.sub}</div>}
                {it.actions?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>{it.actions.map((a) => <button key={a.label} onClick={a.onClick} style={{ background: "#ffffff12", border: 0, color: "#e2e8f0", borderRadius: 999, padding: "4px 11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>{a.label}</button>)}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                {it.onOpen && <Btn onClick={it.onOpen} bg={it.tone === "urgent" ? "#dc2626" : "#ffffff17"} c="#fff" style={{ fontSize: 13, padding: "7px 14px", whiteSpace: "nowrap", borderRadius: 999 }}>{it.cta || "Open"}</Btn>}
                {it.onDismiss && <button onClick={it.onDismiss} style={it.dismissLabel ? { background: "transparent", border: 0, borderRadius: 999, padding: "3px 8px", color: "#94a3b8", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" } : { background: "transparent", border: 0, color: C.mt, fontSize: 11, cursor: "pointer" }}>{it.dismissLabel || "Dismiss"}</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
