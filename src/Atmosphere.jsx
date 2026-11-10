// Atmosphere for special games: the sky behind the whole game screen (rain or snow falling, and
// the holiday's own touches: autumn leaves on Thanksgiving, lights and snow on Christmas, bats
// and a full moon on Halloween), the holiday intro before kickoff, and the holiday result card.
import React from "react";
import { TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { HOLIDAYS, themeOf } from "./holidays.js";
import { wxOf } from "./weather.js";
import Spotlight, { BLOCK, FONT_CSS } from "./Spotlight.jsx";

// The holiday art (public/holiday/): a frame around the field, trim for the scoreboard, and four
// stickers per holiday (halloween: pumpkin, bat, ghost, candy corn; thanksgiving: turkey, pie,
// cornucopia, football; christmas: snowman, ornament, gift, candy cane; newyear: champagne,
// midnight clock, party hat, starburst).
const BASE = import.meta.env?.BASE_URL ?? "/";
export const holArt = (holiday, piece) => (HOLIDAYS[holiday] ? `${BASE}holiday/${themeOf(holiday)}_${piece}.webp` : null);
const sticker = (holiday, i) => holArt(holiday, `s${i}`);
// which stickers each look uses: the intro's hero, the two that keep the corners, and the touchdown one
const ART = { halloween: { hero: 0, corners: [0, 2], td: 0, side: [1, 3] }, thanksgiving: { hero: 0, corners: [0, 2], td: 3, side: [1, 2] }, christmas: { hero: 0, corners: [0, 2], td: 1, side: [1, 3] }, newyear: { hero: 0, corners: [0, 1], td: 3, side: [2, 3] } };
const artOf = (holiday) => ART[themeOf(holiday)] || ART.christmas;

const rnd = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 24634.6345; return x - Math.floor(x); };
const CSS = `
@keyframes atRain { from { transform: translate(0, -12vh) } to { transform: translate(-8vh, 112vh) } }
@keyframes atPour { from { transform: translate(0, -14vh) rotate(18deg) } to { transform: translate(-16vh, 114vh) rotate(18deg) } }
@keyframes atBlizzard { 0% { transform: translate(0, -6vh) } 50% { transform: translate(-12vw, 50vh) } 100% { transform: translate(-24vw, 108vh) } }
@keyframes atSnow { 0% { transform: translate(0, -6vh) } 50% { transform: translate(3vw, 50vh) } 100% { transform: translate(-2vw, 108vh) } }
@keyframes atLeaf { 0% { transform: translate(0, -8vh) rotate(0) } 25% { transform: translate(6vw, 22vh) rotate(120deg) } 50% { transform: translate(-3vw, 50vh) rotate(220deg) } 75% { transform: translate(5vw, 78vh) rotate(320deg) } 100% { transform: translate(0, 110vh) rotate(420deg) } }
@keyframes atBat { 0% { transform: translate(-10vw, 0) scaleY(1) } 25% { transform: translate(25vw, -4vh) scaleY(.6) } 50% { transform: translate(55vw, 3vh) scaleY(1) } 75% { transform: translate(85vw, -3vh) scaleY(.6) } 100% { transform: translate(115vw, 0) scaleY(1) } }
@keyframes atTwinkle { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
@keyframes atGlow { 0%,100% { opacity: .55 } 50% { opacity: .85 } }
@keyframes atIn { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes atInL { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: none } }
@keyframes atInR { from { opacity: 0; transform: translateX(28px) } to { opacity: 1; transform: none } }
@keyframes atFade { 0% { opacity: 0 } 8% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0 } }
@keyframes atBurst { 0% { transform: scale(.05); opacity: 0 } 10% { opacity: 1 } 60% { opacity: .9 } 100% { transform: scale(1); opacity: 0 } }
@keyframes atConf { 0% { transform: translate(0, -8vh) rotate(0) } 100% { transform: translate(4vw, 110vh) rotate(900deg) } }
@keyframes atCount { 0% { transform: scale(2.2); opacity: 0 } 15% { transform: scale(1); opacity: 1 } 75% { opacity: 1 } 100% { transform: scale(.6); opacity: 0 } }
@keyframes atBob { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-10px) rotate(3deg) } }
@keyframes atDrift { 0%,100% { transform: translate(0, 0) rotate(-4deg) } 50% { transform: translate(-14px, -18px) rotate(5deg) } }
@keyframes atLightsGlow { 0%,100% { filter: drop-shadow(0 0 4px #fbbf2466) brightness(1) } 50% { filter: drop-shadow(0 0 12px #fbbf24cc) brightness(1.2) } }
@keyframes atFlicker { 0%,100% { filter: drop-shadow(0 0 6px #f9731655) brightness(1) } 45% { filter: drop-shadow(0 0 3px #f9731633) brightness(.85) } 50% { filter: drop-shadow(0 0 10px #f97316aa) brightness(1.1) } 55% { filter: brightness(.92) } }
@keyframes atShimmer { 0%,100% { filter: drop-shadow(0 0 3px #fde68a55) brightness(1) } 50% { filter: drop-shadow(0 0 10px #fde68acc) brightness(1.15) } }
@keyframes atWarm { 0%,100% { filter: drop-shadow(0 0 4px #f59e0b44) } 50% { filter: drop-shadow(0 0 9px #f59e0b88) } }
@keyframes atPop { 0% { transform: translate(-50%, -50%) scale(.2) rotate(-25deg); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(1.15) rotate(8deg); opacity: 1 } 30% { transform: translate(-50%, -50%) scale(1) rotate(0) } 75% { opacity: 1 } 100% { transform: translate(-50%, -80%) scale(.9); opacity: 0 } }
@keyframes atHero { 0% { transform: scale(.4) rotate(-12deg); opacity: 0 } 60% { transform: scale(1.08) rotate(4deg); opacity: 1 } 100% { transform: scale(1) rotate(0); opacity: 1 } }
@keyframes atSlideL { from { transform: translateX(-60px) rotate(-20deg); opacity: 0 } to { transform: rotate(-10deg); opacity: 1 } }
@keyframes atSlideR { from { transform: translateX(60px) rotate(20deg); opacity: 0 } to { transform: rotate(10deg); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .at-sky *, .at-deco { animation: none !important } }
@media (max-width: 700px) { .hol-corner { display: none } }
`;

// String lights: a sagging wire with bulbs in red, green and gold, twinkling out of step.
function Lights({ top = 0 }) {
  const n = MOBILE ? 14 : 26;
  return (
    <svg viewBox="0 0 1000 60" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, top, width: "100%", height: 46 }}>
      <path d={`M0 6 ${[...Array(n)].map((_, i) => `Q ${(i + 0.5) * (1000 / n)} 34 ${(i + 1) * (1000 / n)} 6`).join(" ")}`} fill="none" stroke="#1f2937" strokeWidth="2" />
      {[...Array(n)].map((_, i) => {
        const x = (i + 0.5) * (1000 / n), c = ["#ef4444", "#22c55e", "#facc15", "#3b82f6"][i % 4];
        return <g key={i} style={{ animation: `atTwinkle ${1.4 + (i % 3) * 0.5}s ${-(i % 5) * 0.3}s ease-in-out infinite` }}><ellipse cx={x} cy="26" rx="5" ry="8" fill={c} /><ellipse cx={x} cy="26" rx="11" ry="14" fill={c} opacity=".25" /></g>;
      })}
    </svg>
  );
}

// Fireworks: rings of sparks bursting at spots across the sky, out of step, in gold, silver and color.
function Fireworks({ n = 7 }) {
  return [...Array(n)].map((_, i) => {
    const c = ["#fbbf24", "#e5e7eb", "#f472b6", "#60a5fa", "#fde68a", "#a78bfa", "#34d399"][i % 7], size = 90 + rnd(i, 31) * 120, dur = 2.2 + rnd(i, 32) * 1.6;
    return (
      <div key={`f${i}`} style={{ position: "absolute", left: `${8 + rnd(i, 33) * 84}%`, top: `${6 + rnd(i, 34) * 42}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, animation: `atBurst ${dur}s ${-rnd(i, 35) * dur}s ease-out infinite` }}>
        {[...Array(16)].map((__, k) => { const a = (k / 16) * Math.PI * 2; return <span key={k} style={{ position: "absolute", left: "50%", top: "50%", width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, transform: `translate(${Math.cos(a) * size / 2}px, ${Math.sin(a) * size / 2}px)` }} />; })}
      </div>
    );
  });
}

// wx: weather key; holiday: holidays.js key; z: stacking (0 behind the screen's panels).
export function Sky({ wx, holiday, z = 0, density = 1, corners = false, contained = false, calm = false }) {
  // calm (the live game): the weather and the holiday's light, but nothing floating over the screen
  const w = wxOf(wx), h = HOLIDAYS[holiday], th = themeOf(holiday);
  const heavy = (w.rain || w.snow) === 2;
  const snow = w.snow || (!calm && th === "christmas");
  // as heavy as what's on the field: a drizzle or a downpour, flurries or a blizzard
  const nSnow = Math.round((w.snow ? (heavy ? 260 : 55) : 35) * density), nRain = Math.round((heavy ? 260 : 30) * density);
  return (
    <>
    <div className="at-sky" aria-hidden style={{ position: contained ? "absolute" : "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: z, borderRadius: contained ? "inherit" : undefined }}>
      <style>{CSS}</style>
      {h && <div style={{ position: "absolute", inset: 0, background: th === "newyear" ? "radial-gradient(ellipse at 50% 120%, #fbbf2418, transparent 60%)" : th === "halloween" ? "radial-gradient(ellipse at 50% 120%, #7c3aed33, transparent 60%)" : th === "thanksgiving" ? "radial-gradient(ellipse at 50% 110%, #d9770624, transparent 60%)" : "radial-gradient(ellipse at 50% 110%, #15803d26, transparent 60%)" }} />}
      {th === "newyear" && !calm && <><div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -10%, #fbbf2422, transparent 55%)" }} /><Fireworks n={Math.round(7 * density)} />{[...Array(Math.round(50 * density))].map((_, i) => <span key={`c${i}`} style={{ position: "absolute", top: 0, left: `${rnd(i, 41) * 100}%`, width: 5, height: 9, borderRadius: 1, background: ["#fbbf24", "#e5e7eb", "#fde68a", "#cbd5e1"][i % 4], opacity: 0.85, animation: `atConf ${5 + rnd(i, 42) * 5}s ${-rnd(i, 43) * 10}s linear infinite` }} />)}</>}
      {th === "halloween" && !contained && <div style={{ position: "absolute", right: "6vw", top: "6vh", width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #fff7d6, #fde68a 55%, #f59e0b 100%)", boxShadow: "0 0 60px 20px #fde68a44", animation: "atGlow 5s ease-in-out infinite" }} />}
      {th === "christmas" && !contained && <Lights />}
      {heavy && (w.rain || w.snow) && <div style={{ position: "absolute", inset: 0, background: w.snow ? "#e2e8f0" : "#64748b", opacity: w.snow ? 0.05 : 0.08 }} />}
      {w.rain && [...Array(nRain)].map((_, i) => heavy
        ? <span key={`r${i}`} style={{ position: "absolute", top: 0, left: `${rnd(i, 1) * 125}%`, width: 1.6 + rnd(i, 5) * 0.8, height: 30 + rnd(i, 2) * 26, background: "linear-gradient(#cbd5e100, #cbd5e1bb)", animation: `atPour ${0.38 + rnd(i, 3) * 0.22}s ${-rnd(i, 4)}s linear infinite` }} />
        : <span key={`r${i}`} style={{ position: "absolute", top: 0, left: `${rnd(i, 1) * 110}%`, width: 1, height: 8 + rnd(i, 2) * 6, background: "linear-gradient(#cbd5e100, #cbd5e177)", transform: "rotate(10deg)", animation: `atRain ${0.9 + rnd(i, 3) * 0.5}s ${-rnd(i, 4)}s linear infinite` }} />)}
      {snow && [...Array(nSnow)].map((_, i) => { const big = i % 6 === 0, bz = w.snow === 2, sz = bz ? (big ? 9 : 3 + rnd(i, 6) * 4) : big ? 6 : 2.5 + rnd(i, 6) * 2.5, dur = bz ? 2.4 + rnd(i, 7) * 2.4 : 7 + rnd(i, 7) * 6; return <span key={`s${i}`} style={{ position: "absolute", top: 0, left: `${rnd(i, 5) * (bz ? 130 : 100)}%`, width: sz, height: sz, borderRadius: "50%", background: "#fff", opacity: big ? 0.5 : 0.78, filter: big ? "blur(1.5px)" : undefined, animation: `${bz ? "atBlizzard" : "atSnow"} ${dur}s ${-rnd(i, 8) * dur}s linear infinite` }} />; })}
      {th === "thanksgiving" && !calm && [...Array(Math.round(18 * density))].map((_, i) => <span key={`l${i}`} style={{ position: "absolute", top: 0, left: `${rnd(i, 9) * 100}%`, width: 10 + rnd(i, 10) * 9, height: 7 + rnd(i, 10) * 6, borderRadius: "0 80% 0 80%", background: ["#c2410c", "#d97706", "#92400e"][i % 3], opacity: 0.8, animation: `atLeaf ${9 + rnd(i, 11) * 7}s ${-rnd(i, 12) * 16}s linear infinite` }} />)}
      {th === "halloween" && !calm && [...Array(Math.round(7 * density))].map((_, i) => <img key={`b${i}`} alt="" src={sticker(holiday, 1)} style={{ position: "absolute", left: 0, top: `${8 + rnd(i, 13) * 40}%`, width: 34 + rnd(i, 14) * 34, animation: `atBat ${11 + rnd(i, 15) * 8}s ${-rnd(i, 16) * 18}s linear infinite` }} />)}
    </div>
      {/* two of the holiday's stickers keep the bottom corners, bobbing gently */}
          {corners && !calm && h && artOf(holiday).corners.map((t, i) => <img key={`k${i}`} alt="" src={sticker(holiday, t)} className="at-deco" style={{ position: "fixed", zIndex: 40, pointerEvents: "none", bottom: MOBILE ? 64 : 10, [i ? "right" : "left"]: MOBILE ? 4 : 14, width: MOBILE ? 64 : 112, filter: "drop-shadow(0 8px 16px #000a)", animation: `${i ? "atDrift" : "atBob"} ${4.5 + i}s ease-in-out infinite` }} />)}
    </>
  );
}

// Before kickoff of a holiday game you play: a title card. The day's name in block letters over its
// sky, one of its pieces floating above, and the two clubs, each in a wash of its own color.
// Tap anywhere to go straight to kickoff.
export function HolidayIntro({ holiday, home, away, wx, onDone }) {
  const h = HOLIDAYS[holiday];
  if (!h) return null;
  const ny = themeOf(holiday) === "newyear", late = ny ? 1.5 : 0;
  const tradition = holiday === "thanksgiving" && home?.ab === "DET" ? "A Detroit tradition since 1934" : holiday === "thanksgiving" && home?.ab === "DAL" ? "A Dallas tradition since 1966" : null;
  const club = (t, side) => (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, animation: `${side ? "atInR" : "atInL"} .8s ${late + 0.55}s cubic-bezier(.2,.8,.2,1) both` }}>
      <TeamLogo t={t} sz={MOBILE ? 64 : 96} glow />
      <div>
        <div style={{ fontSize: MOBILE ? 11 : 13, fontWeight: 800, letterSpacing: 3, color: "#ffffffa0", textTransform: "uppercase" }}>{t?.city}</div>
        <div style={{ fontFamily: BLOCK, fontSize: MOBILE ? 24 : 36, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.05 }}>{t?.name}</div>
      </div>
    </div>
  );
  return (
    <div role="dialog" aria-label={h.name} onClick={onDone} style={{ position: "fixed", inset: 0, zIndex: 2500, overflow: "hidden", color: "#fff", textAlign: "center", cursor: "pointer", fontFamily: "'Segoe UI', system-ui, sans-serif", animation: `atFade ${ny ? 5.6 : 4.6}s ease forwards`,
      background: `radial-gradient(ellipse at 18% 75%, ${away?.clr || "#334155"}55, transparent 45%), radial-gradient(ellipse at 82% 75%, ${home?.clr || "#334155"}55, transparent 45%), radial-gradient(ellipse at 50% 30%, ${h.bg}, #020308 80%)` }}>
      <style>{CSS + FONT_CSS}</style>
      <Sky wx={wx} holiday={holiday} z={0} density={0.7} />
      {ny && <div aria-hidden style={{ position: "absolute", top: "42%", left: 0, right: 0, height: 0 }}>{[3, 2, 1].map((n, i) => <div key={n} style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: BLOCK, fontSize: MOBILE ? 120 : 180, fontWeight: 300, color: "#fde68a", textShadow: "0 0 50px #fbbf2499", opacity: 0, animation: `atCount .5s ${i * 0.5}s ease-out both`, transform: "translateY(-50%)" }}>{n}</div>)}</div>}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: MOBILE ? 14 : 18 }}>
        <img alt="" src={sticker(holiday, artOf(holiday).hero)} style={{ width: MOBILE ? 84 : 120, filter: `drop-shadow(0 0 28px ${h.c1}55) drop-shadow(0 12px 20px #000b)`, animation: `atHero .9s ${late}s cubic-bezier(.2,.9,.3,1.1) both, atBob 5s ${late + 1}s ease-in-out infinite` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, animation: `atIn .7s ${late + 0.15}s ease-out both` }}>
          <span style={{ width: MOBILE ? 28 : 56, height: 1, background: `linear-gradient(90deg, transparent, ${h.c1})` }} />
          <span style={{ fontSize: MOBILE ? 11 : 13, fontWeight: 800, letterSpacing: 4, color: h.c1, textTransform: "uppercase" }}>{tradition || "Holiday game"}</span>
          <span style={{ width: MOBILE ? 28 : 56, height: 1, background: `linear-gradient(90deg, ${h.c1}, transparent)` }} />
        </div>
        <div style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 52 : 104, lineHeight: 0.95, letterSpacing: 1, textTransform: "uppercase", textShadow: `0 0 40px ${h.c1}44, 0 6px 30px #000a`, animation: `atIn .8s ${late + 0.25}s ease-out both` }}>{h.name}</div>
        <div style={{ display: "flex", alignItems: "center", width: "min(720px, 100%)", marginTop: MOBILE ? 10 : 18, gap: MOBILE ? 8 : 20 }}>
          {club(away, 0)}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: `atIn .7s ${late + 0.7}s ease-out both` }}>
            <span style={{ width: 1, height: MOBILE ? 30 : 46, background: `linear-gradient(transparent, ${h.c1}99)` }} />
            <span style={{ fontFamily: BLOCK, fontSize: MOBILE ? 16 : 20, letterSpacing: 3, color: h.c1 }}>AT</span>
            <span style={{ width: 1, height: MOBILE ? 30 : 46, background: `linear-gradient(${h.c1}99, transparent)` }} />
          </div>
          {club(home, 1)}
        </div>
        <div style={{ fontSize: MOBILE ? 14 : 17, color: "#e2e8f0cc", maxWidth: 520, lineHeight: 1.5, marginTop: MOBILE ? 6 : 10, animation: `atIn .7s ${late + 1}s ease-out both` }}>{h.line}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(22px + env(safe-area-inset-bottom))", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#ffffff66", textTransform: "uppercase", animation: `atIn .6s ${late + 1.4}s ease-out both` }}>Tap for kickoff</div>
    </div>
  );
}

// The holiday result card (Moment kind "holiday"), on the spotlight stage: the player of the game in
// his uniform under the holiday's sky, the score behind him. m = { team (yours), holiday, won, us,
// them, opp, pog: { name, line, p }, home, wx }.
const WIN = { thanksgiving: "Thanksgiving\nto remember", christmas: "Christmas\ncame early", xmaseve: "The best gift\ncame early", halloween: "All treat,\nno trick", nye: "Ringing in\nthe new year", nyd: "Starting the\nyear right" };
const LOSS = { thanksgiving: "A tough day\nto give thanks", christmas: "Coal in\nthe stocking", xmaseve: "Coal on\nChristmas Eve", halloween: "Tricked on\nHalloween", nye: "Not how we wanted\nto end the year", nyd: "Not the resolution\nwe wanted" };
const AWARD = { thanksgiving: "The turkey leg goes to" };
export function HolidayResult({ m, onClose }) {
  const h = HOLIDAYS[m.holiday];
  if (!h) return null;
  const pp = m.pog?.p;
  const hero = <img alt="" src={sticker(m.holiday, artOf(m.holiday).hero)} style={{ width: MOBILE ? 170 : "min(34vw, 380px)", margin: MOBILE ? "40px auto 0" : "0 0 18vh", display: "block", filter: `drop-shadow(0 0 40px ${h.c1}66) drop-shadow(0 20px 30px #000c)`, animation: "atBob 5s ease-in-out infinite" }} />;
  return (
    <Spotlight p={pp} team={m.team} kicker={`${h.name} · Final`} title={(m.won ? WIN : LOSS)[m.holiday]} bg={`${m.us}-${m.them}`} confetti={m.won ? [h.c1, h.c2, "#fff", "#fde68a"] : null} onNext={onClose} label={`${h.name} final`}
      art={pp ? null : hero} backdrop={<><style>{CSS}</style><Sky wx={m.wx} holiday={m.holiday} contained density={0.6} z={0} /></>}>
      <div style={{ display: "flex", alignItems: "center", gap: MOBILE ? 12 : 16, margin: "4px 0 10px" }}>
        <TeamLogo t={m.team} sz={MOBILE ? 40 : 54} glow />
        <span style={{ fontFamily: BLOCK, fontSize: MOBILE ? 38 : 56, fontWeight: 600, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.us}<span style={{ color: "#ffffff55", margin: "0 8px" }}>–</span>{m.them}</span>
        <TeamLogo t={m.opp} sz={MOBILE ? 34 : 46} />
      </div>
      <div>{m.won ? "Beat" : "Lost to"} the {m.opp?.city} {m.opp?.name} {m.home ? "at home" : "on the road"}.</div>
      {m.pog && <div style={{ marginTop: MOBILE ? 12 : 18, paddingTop: MOBILE ? 10 : 14, borderTop: `1px solid ${h.c1}55`, maxWidth: 460 }}>
        <div style={{ fontSize: MOBILE ? 11 : 12, fontWeight: 800, letterSpacing: 3, color: h.c1, textTransform: "uppercase" }}>{AWARD[m.holiday] || "Player of the game"}</div>
        <div style={{ fontFamily: BLOCK, fontSize: MOBILE ? 24 : 32, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{m.pog.name}</div>
        <div style={{ fontSize: MOBILE ? 14 : 16, color: "#cbd5e1" }}>{m.pog.line}</div>
      </div>}
    </Spotlight>
  );
}

export function HolidayBadge({ holiday, style }) {
  const h = HOLIDAYS[holiday];
  if (!h) return null;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 900, letterSpacing: 0.5, color: "#fff", background: `linear-gradient(90deg, ${h.c2}, ${h.c1})`, borderRadius: 999, padding: "2px 9px 2px 4px", whiteSpace: "nowrap", ...style }}><img alt="" src={sticker(holiday, artOf(holiday).hero)} style={{ width: 18, height: 18, objectFit: "contain" }} />{h.name}</span>;
}

// The frame around the live field (the art's 2400 x 1080 window sits exactly over the field; its
// border hangs 100 art pixels outside every edge). The lights glow, Halloween flickers, the New
// Year's gold shimmers. Children: the field.
const FRAME_ANIM = { christmas: "atLightsGlow 2.6s ease-in-out infinite", halloween: "atFlicker 3.2s ease-in-out infinite", newyear: "atShimmer 3s ease-in-out infinite", thanksgiving: "atWarm 4s ease-in-out infinite" };
// maxW: the field's own width cap (it can stop short of the full width), so the frame hugs it.
export function HolidayFrame({ holiday, children, tdKey, maxW }) {
  if (!HOLIDAYS[holiday]) return children;
  return (
    <div style={{ maxWidth: maxW && `calc(${maxW} / 0.912)`, margin: "0 auto" }}>
    <div style={{ position: "relative", padding: MOBILE ? "3.6% 4.4%" : "3.4% 4.4%" }}>
      <style>{CSS}</style>
      <div style={{ position: "relative" }}>
        {children}
        {/* New Year's art is just corner flourishes: a fine gold double rule joins them */}
        {themeOf(holiday) === "newyear" && <div className="at-deco" style={{ position: "absolute", inset: "-2.2% -1.1%", border: "1px solid #d4af372e", borderRadius: 12, boxShadow: "0 0 0 4px #0b122000, 0 0 0 5px #d4af3766, 0 0 18px #fbbf2455, inset 0 0 18px #fbbf2422", pointerEvents: "none", zIndex: 2, animation: "atShimmer 3s ease-in-out infinite" }} />}
        <img alt="" src={holArt(holiday, "frame")} className="at-deco" style={{ position: "absolute", left: "-4.1667%", top: "-9.259%", width: "108.333%", height: "118.52%", pointerEvents: "none", zIndex: 3, animation: FRAME_ANIM[themeOf(holiday)] }} />
      </div>
    </div>
    </div>
  );
}

// Trim on the scoreboard: the art's two ends perch on its top corners, above the logos, so the
// names and scores stay clear. Children: the scoreboard.
export function HolidayScoreTrim({ holiday, children }) {
  if (!HOLIDAYS[holiday]) return children;
  const h = MOBILE ? 26 : 32;
  return (
    <div style={{ position: "relative", paddingTop: Math.round(h * 0.72) }}>
      {children}
      {["L", "R"].map((side) => <BarCorner key={side} holiday={holiday} side={side} h={h} top={0} />)}
    </div>
  );
}

// The week's gameday card on a holiday: a glow in the holiday's colors, the scoreboard trim along
// its top, the holiday's characters on two corners, its weather (snow, leaves, bats, confetti)
// drifting across the card, and the holiday's name. Children: the card.
// One end of the score-bar art, cut out and pinned to a card corner at a fixed size, so it sits
// on the corner however wide the card is. BAR_ENDS: each end's box in the 1800 x 120 art; drop:
// how much of the piece hangs above the card's top edge (New Year's bows hang from the knot).
const BAR_ENDS = { newyear: { L: [144, 306], R: [1493, 1655], drop: 0.3 }, christmas: { L: [91, 357], R: [1442, 1706] }, halloween: { L: [140, 308], R: [1493, 1656] }, thanksgiving: { L: [72, 377], R: [1424, 1724] } };
function BarCorner({ holiday, side, h, top }) {
  const e = BAR_ENDS[themeOf(holiday)];
  if (!e) return null;
  const [x0, x1] = e[side], y0 = 4, k = h / (86 - y0), w = (x1 - x0 + 1) * k;
  return (
    <div className="at-deco" style={{ position: "absolute", top: top ?? -h * (e.drop ?? 0.5), [side === "L" ? "left" : "right"]: -h * 0.12, width: w, height: h, overflow: "hidden", pointerEvents: "none", zIndex: 3 }}>
      <img alt="" src={holArt(holiday, "bar")} style={{ position: "absolute", left: -x0 * k, top: -y0 * k, width: 1800 * k, height: 120 * k, maxWidth: "none" }} />
    </div>
  );
}

export function HolidayCard({ holiday, children }) {
  const h = HOLIDAYS[holiday];
  if (!h) return children;
  const a = artOf(holiday);
  return (
    <div style={{ position: "relative", marginTop: MOBILE ? 18 : 22 }}>
      <style>{CSS}</style>
      <div style={{ position: "relative", borderRadius: 16, boxShadow: `0 0 0 1px ${h.c1}88, 0 0 30px ${h.c1}44`, animation: themeOf(holiday) === "christmas" ? "atLightsGlow 2.6s ease-in-out infinite" : undefined }}>
        {children}
        <Sky holiday={holiday} contained density={0.45} z={2} />
      </div>
      {["L", "R"].map((side) => <BarCorner key={side} holiday={holiday} side={side} h={MOBILE ? 34 : 64} />)}
      {!MOBILE && <img alt="" src={sticker(holiday, a.hero)} className="at-deco hol-corner" style={{ position: "absolute", left: MOBILE ? -8 : -22, bottom: MOBILE ? -12 : -18, width: MOBILE ? 56 : 92, transform: "rotate(-8deg)", filter: "drop-shadow(0 8px 14px #000b)", pointerEvents: "none", zIndex: 3, animation: "atBob 4.5s ease-in-out infinite" }} />}
      {!MOBILE && <img alt="" src={sticker(holiday, a.side[1])} className="at-deco hol-corner" style={{ position: "absolute", right: MOBILE ? -6 : -18, bottom: MOBILE ? -10 : -16, width: MOBILE ? 46 : 74, transform: "rotate(10deg)", filter: "drop-shadow(0 8px 14px #000b)", pointerEvents: "none", zIndex: 3, animation: "atDrift 5.5s ease-in-out infinite" }} />}
      <div style={{ position: "absolute", left: "50%", top: 0, transform: "translate(-50%, -55%)", zIndex: 4 }}><HolidayBadge holiday={holiday} style={{ fontSize: MOBILE ? 12 : 14, padding: "4px 12px 4px 6px", boxShadow: `0 4px 14px ${h.c1}66` }} /></div>
    </div>
  );
}
