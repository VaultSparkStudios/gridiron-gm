// Phone navigation: a bottom tab bar (Home, Roster, Scouting, whatever the season phase is
// about, More) and a full-screen "More" sheet with every other screen and the settings.
import React from "react";
import { C } from "./ui.jsx";

const PHASE_ITEM = {
  preseason: { icon: "🏋️", label: "Camp", tab: "roster", sub: "camp" },
  regular: { icon: "📊", label: "Standings", tab: "standings" },
  playoffs: { icon: "🏆", label: "Playoffs", tab: "playoffs" },
  combine: { icon: "📊", label: "Standings", tab: "standings" },
  resign: { icon: "✍️", label: "Re-sign", tab: "freeagency" },
  freeagency: { icon: "✍️", label: "Free Agency", tab: "freeagency" },
  draft: { icon: "🎯", label: "Draft", tab: "draft" },
};

export function MobileNav({ tab, sp, rosterView, go, onMore, moreOpen }) {
  const ph = PHASE_ITEM[sp] || PHASE_ITEM.regular;
  const items = [
    { icon: "🏠", label: "Home", tab: "dashboard" },
    { icon: "👥", label: "Roster", tab: "roster", sub: "players" },
    { icon: "🔎", label: "Scouting", tab: "scouting" },
    ph,
  ];
  return (
    <nav aria-label="Main" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 400, display: "flex", background: "#0b1220f7", borderTop: `1px solid ${C.bd}`, paddingBottom: "env(safe-area-inset-bottom)", backdropFilter: "blur(8px)" }}>
      {[...items, { icon: "☰", label: "More", more: true }].map((it) => {
        // Roster and Camp share a screen: Camp is lit only on its own view.
        const on = it.more ? moreOpen : !moreOpen && tab === it.tab && (it.tab !== "roster" || (it.sub === "camp") === (rosterView === "camp"));
        return (
          <button key={it.label} onClick={() => (it.more ? onMore() : go(it.tab, it.sub))} aria-current={on ? "page" : undefined} style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, padding: "8px 2px 7px", color: on ? "#fff" : "#94a3b8", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20, lineHeight: 1, filter: on ? "none" : "grayscale(0.4)", opacity: on ? 1 : 0.85 }}>{it.icon}</span>
            <span style={{ fontSize: 11, fontWeight: on ? 800 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{it.label}</span>
            <span style={{ width: 18, height: 3, borderRadius: 2, background: on ? C.gn : "transparent" }} />
          </button>
        );
      })}
    </nav>
  );
}

export function MoreSheet({ tabs, labels, tab, go, onClose, actions }) {
  return (
    <div role="dialog" aria-label="More" style={{ position: "fixed", inset: 0, zIndex: 390, background: C.bg, overflowY: "auto", padding: "14px 14px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 900 }}>More</span>
        <button onClick={onClose} aria-label="Close" style={{ marginLeft: "auto", background: C.cd, border: `1px solid ${C.bd}`, color: C.tx, borderRadius: 8, width: 38, height: 38, fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => go(t)} style={{ textAlign: "left", padding: "14px 12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", background: tab === t ? `${C.bl}33` : C.cd, color: tab === t ? "#fff" : C.tx, border: `1px solid ${tab === t ? C.bl : C.bd}` }}>{labels[t] || t}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: C.mt, margin: "4px 0 8px" }}>SETTINGS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} style={{ textAlign: "left", padding: "14px 12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", background: C.cd, color: C.tx, border: `1px solid ${C.bd}` }}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}
