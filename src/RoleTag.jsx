// A player's natural role as a small tag (SAM, NICKEL, SLOT...), green when it's a role your
// lineup needs (roleNeeds.js). The needs are set once per render by the app (roleNeedsRef).
import React from "react";
import { naturalRole, ROLE_PAY } from "./roles.js";
import { ROLE_TAG } from "./roleNeeds.js";

export const roleNeedsRef = { cur: null };
export default function RoleTag({ p }) {
  const k = ["LB", "CB", "S", "WR"].includes(p?.pos) ? naturalRole(p) : null;
  if (!k) return null;
  const need = roleNeedsRef.cur?.[k] || 0, big = need >= 0.25;
  return <span title={`${big ? `Natural ${ROLE_TAG[k].toLowerCase()}: a role your lineup needs` : `Natural role: ${ROLE_TAG[k].toLowerCase()}`}${(ROLE_PAY[k] ?? 1) < 1 ? `. The market pays this role about ${Math.round((1 - ROLE_PAY[k]) * 100)}% less.` : ""}`} style={{ display: "inline-block", fontSize: 10, fontWeight: 900, letterSpacing: 0.5, lineHeight: "15px", padding: "0 5px", borderRadius: 4, marginLeft: 4, verticalAlign: "middle", whiteSpace: "nowrap", color: big ? "#052e16" : "#c7d2fe", background: big ? "#4ade80" : "#312e81", border: `1px solid ${big ? "#22c55e" : "#4338ca"}` }}>{ROLE_TAG[k]}{big ? " · NEED" : ""}{(ROLE_PAY[k] ?? 1) < 0.9 ? " · $" : ""}</span>;
}
