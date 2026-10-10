// Keeps one broken screen from taking down the whole game: the error shows in place of that
// screen, with what went wrong, and the rest of the app (menu, tabs, saves) keeps working.
import React from "react";

export const errorDetails = (err, info) => `${err?.name || "Error"}: ${err?.message || err}\n${(err?.stack || "").split("\n").slice(1, 4).join("\n")}${info?.componentStack ? `\nIn:${info.componentStack.split("\n").slice(1, 4).join("\n")}` : ""}`;

export default class ScreenBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null, info: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Screen crash:", err, info); this.setState({ info }); }
  render() {
    if (!this.state.err) return this.props.children;
    const details = errorDetails(this.state.err, this.state.info);
    return (
      <div role="alert" style={{ margin: "24px auto", maxWidth: 560, background: "#111827", border: "1px solid #ef4444", borderRadius: 12, padding: 20, color: "#e2e8f0" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#f87171", marginBottom: 6 }}>This screen ran into a problem</div>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 10 }}>Your franchise is fine. Head back to Home and keep playing; if it happens again, send the details below.</div>
        <pre style={{ fontSize: 12, background: "#0b1220", border: "1px solid #1e293b", borderRadius: 8, padding: 10, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#fca5a5", maxHeight: 160, overflow: "auto" }}>{details}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => { this.setState({ err: null }); this.props.onHome?.(); }} style={{ background: "#22c55e", color: "#fff", border: 0, borderRadius: 6, padding: "8px 16px", fontWeight: 800, cursor: "pointer" }}>Back to Home</button>
          <button onClick={() => navigator.clipboard?.writeText(details)} style={{ background: "#1e293b", color: "#e2e8f0", border: 0, borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>Copy details</button>
        </div>
        {this.props.onGo && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Or go to:</span>
            {[["roster", "Roster"], ["schedule", "Schedule"], ["standings", "Standings"], ["draft", "Draft"], ["freeagency", "Free Agency"], ["trade", "Trades"]].map(([k, l]) => (
              <button key={k} onClick={() => { this.setState({ err: null }); this.props.onGo(k); }} style={{ background: "transparent", color: "#7dd3fc", border: "1px solid #1e3a5f", borderRadius: 6, padding: "5px 10px", fontSize: 13, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        )}
      </div>
    );
  }
}
