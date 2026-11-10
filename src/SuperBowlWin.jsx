// The moment you win the Super Bowl, before the newspaper: fireworks over the stadium, confetti in
// your colors and gold, the final score, the Lombardi Trophy rising into the spotlight, and the
// words every franchise plays for. One button on to the morning paper. (The Super Bowl MVP waits
// for the paper and the awards, so this screen doesn't give him away.)
import React from "react";
import { TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import Lombardi from "./Lombardi.jsx";
import { sbName, sbNumber } from "./data/superbowls.js";

const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const CONF = Array.from({ length: 90 }, (_, i) => ({ l: (i * 37) % 100, d: (i * 0.11) % 3.2, t: 3 + ((i * 7) % 12) / 5, r: (i * 47) % 360, w: 6 + (i % 4) * 2, s: i % 3 }));
const BURSTS = [[18, 22, 0], [80, 18, 0.7], [50, 12, 1.4], [30, 30, 2.1], [70, 32, 2.8], [12, 40, 3.5], [88, 38, 4.2]];
const CSS = `
@keyframes swFall { 0% { transform: translateY(-6vh) rotate(0) } 100% { transform: translateY(108vh) rotate(720deg) } }
@keyframes swSway { 0%,100% { margin-left: 0 } 50% { margin-left: 22px } }
@keyframes swBurst { 0% { transform: scale(.1); opacity: 0 } 12% { opacity: 1 } 70% { opacity: .9 } 100% { transform: scale(1.25); opacity: 0 } }
@keyframes swRise { 0% { transform: translateY(80px) scale(.6); opacity: 0; filter: brightness(.4) } 60% { opacity: 1 } 100% { transform: none; opacity: 1; filter: none } }
@keyframes swIn { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes swShine { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes swSpot { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
.sw-title { background: linear-gradient(100deg, #fff 30%, #fde68a 50%, #fff 70%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: swShine 3s linear infinite; }
`;

// Falling confetti; used here and over the championship paper (pointer-events off, so it never blocks).
export function ConfettiRain({ colors, count = 90, z = 1 }) {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: z }}>
      <style>{CSS}</style>
      {CONF.slice(0, count).map((c, i) => (
        <span key={i} style={{ position: "absolute", top: -20, left: `${c.l}%`, width: c.w, height: c.s === 2 ? c.w : c.w * 1.7, borderRadius: c.s === 2 ? "50%" : 2, background: colors[i % colors.length], transform: `rotate(${c.r}deg)`, animation: `swFall ${c.t}s ${c.d}s linear infinite, swSway ${1.6 + (i % 5) * 0.3}s ease-in-out infinite`, opacity: 0.95 }} />
      ))}
    </div>
  );
}

function Burst({ x, y, delay, color }) {
  return (
    <div aria-hidden style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 0, height: 0, pointerEvents: "none" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <span key={i} style={{ position: "absolute", left: 0, top: 0, width: 4, height: 4, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, transform: `translate(${Math.cos(a) * 70}px, ${Math.sin(a) * 70}px)`, animation: `swBurst 2.2s ${delay}s ease-out infinite`, transformOrigin: `${-Math.cos(a) * 70}px ${-Math.sin(a) * 70}px` }} />;
      })}
    </div>
  );
}

// show: { yr, champ, opp, score }; titles: the franchise's Super Bowl count with this one;
// streak: titles in a row.
export default function SuperBowlWin({ show, teams, titles = 1, streak = 1, onNext }) {
  const t = teams[show.champ] || {}, o = show.opp != null ? teams[show.opp] : null;
  const clr = t.clr || "#1e3a8a", ac = t.ac || "#f59e0b";
  const sb = sbName(sbNumber(show.yr));
  const what = streak >= 3 ? `${streak} straight. A dynasty.` : streak === 2 ? "Back-to-back champions." : titles <= 1 ? "The first Super Bowl title in franchise history." : `The ${ORD[titles] || `${titles}th`} Super Bowl title in franchise history.`;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: `radial-gradient(ellipse at 50% 30%, ${clr}, #050507 72%)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{CSS}</style>
      {BURSTS.map(([x, y, d], i) => <Burst key={i} x={x} y={y} delay={d} color={[ac, "#fde68a", "#ffffff", "#fbbf24"][i % 4]} />)}
      <div aria-hidden style={{ position: "absolute", top: 0, left: "50%", width: 520, marginLeft: -260, height: "100%", background: "radial-gradient(ellipse at 50% 0%, #fff7d688, transparent 62%)", animation: "swSpot 3s ease-in-out infinite", pointerEvents: "none" }} />
      <ConfettiRain colors={[clr, ac, "#fbbf24", "#fde68a", "#ffffff"]} z={0} />
      <div role="dialog" aria-label="Super Bowl champions" style={{ position: "relative", zIndex: 1, width: "min(680px, 100%)", maxHeight: "calc(var(--vh, 100vh) - 32px)", overflowY: "auto", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 5, color: "#fde68a", animation: "swIn .5s ease-out both" }}>FINAL · {sb.toUpperCase()}</div>
        {o && show.score && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: MOBILE ? 10 : 18, marginTop: 8, animation: "swIn .6s .2s ease-out both" }}>
          <TeamLogo t={t} sz={MOBILE ? 36 : 48} glow />
          <span style={{ fontSize: MOBILE ? 30 : 44, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{show.score}</span>
          <TeamLogo t={o} sz={MOBILE ? 30 : 40} />
        </div>}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6, animation: "swRise 1.6s .5s cubic-bezier(.2,.8,.3,1) both", filter: "drop-shadow(0 0 40px #fbbf24aa)" }}><Lombardi size={MOBILE ? 150 : 200} /></div>
        <div className="sw-title" style={{ fontSize: MOBILE ? 34 : 56, fontWeight: 900, fontStyle: "italic", lineHeight: 1, letterSpacing: 1, marginTop: 4, animation: "swIn .7s 1.3s ease-out both" }}>WORLD CHAMPIONS</div>
        <div style={{ fontSize: MOBILE ? 20 : 28, fontWeight: 900, letterSpacing: 2, marginTop: 6, color: "#fff", textShadow: `0 0 24px ${ac}`, animation: "swIn .7s 1.6s ease-out both" }}>{`THE ${(t.city || "").toUpperCase()} ${(t.name || "").toUpperCase()}`}</div>
        <div style={{ fontSize: MOBILE ? 14 : 16, color: "#fde68a", marginTop: 6, fontStyle: "italic", animation: "swIn .7s 1.9s ease-out both" }}>{what}</div>
        <div style={{ animation: "swIn .7s 2.5s ease-out both" }}>
          <button onClick={onNext} style={{ marginTop: 18, width: "min(420px, 100%)", background: "linear-gradient(90deg,#b45309,#fbbf24,#b45309)", color: "#1c1206", border: 0, borderRadius: 12, padding: "14px 0", fontSize: 17, fontWeight: 900, letterSpacing: 2, cursor: "pointer", boxShadow: "0 8px 30px #fbbf2455" }}>READ ALL ABOUT IT →</button>
        </div>
      </div>
    </div>
  );
}
