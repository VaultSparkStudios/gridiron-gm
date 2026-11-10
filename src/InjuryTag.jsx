// The injury report tag: Q (questionable, playing hurt), D (doubtful), OUT, or IR.
import React from "react";
import { injStatus, backText } from "./injuries.js";

export function InjTag({ p, st, ir = false, wk = 0, showNote = false, style }) {
  const s = st || injStatus(p, { ir, wk });
  if (!s) return null;
  const when = s.back ? ` · back ${backText(s.back)}` : "";
  return (
    <span title={`${s.label}: ${s.note}${when}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 6, ...style }}>
      <span style={{ background: `${s.color}26`, color: s.color, border: `1px solid ${s.color}66`, borderRadius: 4, padding: "0 5px", fontSize: 11, fontWeight: 900, letterSpacing: 0.5, lineHeight: "16px" }}>{s.tag}</span>
      {showNote && <span style={{ fontSize: 12, color: s.color }}>{s.note.replace(/ \(.*\)$/, "")}{when}</span>}
    </span>
  );
}
