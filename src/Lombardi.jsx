// The Vince Lombardi Trophy, standing still and face on (artwork). Used on the main menu, the
// trophy shelves and the champions' newspaper. size: its width; it stands 1.9 times as tall.
import React from "react";
import lombardiArt from "./assets/lombardi.webp";

function Trophy({ size }) {
  return (
    <div role="img" aria-label="Vince Lombardi Trophy" style={{ width: size, height: Math.round(size * 1.9), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <img src={lombardiArt} alt="" style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 6px 10px #0009)" }} />
    </div>
  );
}

export default function Lombardi({ size = 120 }) { return <Trophy size={size} />; }
export const LombardiStill = ({ size = 100 }) => <Trophy size={size} />;
