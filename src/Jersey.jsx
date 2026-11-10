import React from "react";

// A club jersey: club colors, the name across the back and the number. Held up on draft night,
// raised to the rafters when a number is retired.
export { rookieNum } from "./rookieNum.js";
export function Jersey({ team, name, num, size = 96 }) {
  const last = String(name || "").split(" ").slice(-1)[0].toUpperCase();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ filter: "drop-shadow(0 8px 14px #000a)" }}>
      <path d="M30 8 L42 4 Q50 12 58 4 L70 8 L92 22 L84 42 L74 36 L74 94 L26 94 L26 36 L16 42 L8 22 Z" fill={team.clr || "#1e3a8a"} stroke={team.ac || "#fff"} strokeWidth="2.5" />
      <path d="M8 22 L16 42 L26 36 L26 30 Z M92 22 L84 42 L74 36 L74 30 Z" fill={team.ac || "#fff"} opacity=".55" />
      <text x="50" y="30" textAnchor="middle" fontSize={last.length > 9 ? 7 : 9} fontWeight="900" fill="#fff" fontFamily="system-ui" letterSpacing=".5">{last}</text>
      <text x="50" y="72" textAnchor="middle" fontSize="36" fontWeight="900" fill="#fff" stroke={team.ac || "#000"} strokeWidth="1.2" fontFamily="'Arial Black', Arial, sans-serif">{num}</text>
    </svg>
  );
}

