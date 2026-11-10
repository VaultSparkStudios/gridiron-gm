// The big result of the last play, in a banner across the field, so a missed kick or a stop on
// fourth down never looks like an ordinary change of possession.
export function calloutOf(p) {
  if (!p) return null;
  const yd = /(\d+)-yard/.exec(p.text || "")?.[1];
  if (p.td || p.type === "td") return { t: "TOUCHDOWN!", c: "#facc15" };
  if (p.type === "int") return { t: "INTERCEPTED!", c: "#ef4444" };
  if (p.type === "fumble") return { t: "FUMBLE!", c: "#ef4444", s: "Recovered by the defense" };
  if (p.type === "fg") return { t: "IT'S GOOD!", c: "#22c55e", s: yd ? `${yd}-yard field goal` : "Field goal" };
  if (p.type === "fg_miss") return { t: "NO GOOD!", c: "#f97316", s: yd ? `${yd}-yard field goal missed` : "Field goal missed" };
  if (p.downs) return { t: "TURNOVER ON DOWNS", c: "#f97316", s: "Stopped on fourth down" };
  if (p.type === "safety") return { t: "SAFETY!", c: "#ef4444", s: "Two points for the defense" };
  return null;
}
