// The big moments, each its own full-screen card in your team's colors: clinching a playoff spot,
// the division or the top seed; one of your players breaking a record; signing a star in free
// agency; a blockbuster trade; and the season kickoff preview. One look for all of them, like the Super Bowl's.
import React from "react";
import { HolidayResult } from "./Atmosphere.jsx";
import { TeamLogo, Face, Bdg, T, S, txt } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import goldJacket from "./assets/gold-jacket.webp";
import lombardiArt from "./assets/lombardi.webp";
import mvpArt from "./assets/mvp.webp";
import sbmvpArt from "./assets/sbmvp.webp";
import opoyArt from "./assets/opoy.webp";
import dpoyArt from "./assets/dpoy.webp";
import oroyArt from "./assets/oroy.webp";
import droyArt from "./assets/droy.webp";
import { Jersey } from "./Jersey.jsx";
import ChampionRing from "./ChampionRing.jsx";
import Spotlight, { BLOCK } from "./Spotlight.jsx";
import { jerseyNum } from "./playerArt.js";

const CONFETTI = Array.from({ length: 42 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 0.13) % 2.4, dur: 2.6 + ((i * 7) % 10) / 10, rot: (i * 47) % 360, size: 6 + (i % 4) * 2 }));
const CSS = `
@keyframes mmFall { 0% { transform: translateY(-40px) rotate(0deg); opacity: 0 } 8% { opacity: 1 } 100% { transform: translateY(105vh) rotate(540deg); opacity: .9 } }
@keyframes mmIn { from { transform: translateY(18px) scale(.97); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes mmShine { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes mmPulse { 0%, 100% { box-shadow: 0 0 0 0 var(--mm-glow) } 50% { box-shadow: 0 0 40px 6px var(--mm-glow) } }
.mm-title { background: linear-gradient(100deg, #fff 30%, #fde68a 50%, #fff 70%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: mmShine 3.2s linear infinite; }
`;

// a caption's words in sentence case ("RING OF HONOR" from older saves reads "Ring of honor")
const sentence = (k) => (typeof k === "string" && k === k.toUpperCase() && /[A-Z]{3}/.test(k) ? k.charAt(0) + k.slice(1).toLowerCase() : k);
// dark text on a light button, white on a dark one
const ink = (hex) => { const h = String(hex || "").replace("#", ""); if (h.length < 6) return "#0b1220"; const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b1220" : "#fff"; };
const CTA = { borderRadius: 14, padding: "14px 0", fontSize: T.md, fontWeight: 900, border: 0, width: "100%", cursor: "pointer" };

function Confetti({ colors }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {CONFETTI.map((c, i) => <span key={i} style={{ position: "absolute", top: 0, left: `${c.left}%`, width: c.size, height: c.size * 1.6, background: colors[i % colors.length], borderRadius: 2, transform: `rotate(${c.rot}deg)`, animation: `mmFall ${c.dur}s ${c.delay}s linear infinite` }} />)}
    </div>
  );
}

const Line = ({ k, v, tone }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: S[3], padding: `${S[2]}px 0`, borderBottom: "1px solid #ffffff10" }}>
    <span style={{ ...txt.caption, minWidth: MOBILE ? 92 : 128 }}>{sentence(k)}</span>
    <span style={{ fontSize: T.md, fontWeight: 700, color: tone || "#fff" }}>{v}</span>
  </div>
);

// m: { kind: clinch | record | signing | kickoff, team, ... } (a record or a signing goes to the spotlight) (see App for each one's fields)
// The Hall of Fame: him in his uniform on the gold stage, the gold jacket at his side, Canton welcomes him.
// What he retires with (history.js careerHaul): his trophies on a shelf, each with how many he won,
// the honors counted up, and where he ranks in his clubs' history. (The Super Bowl MVP football is
// wide, so it stands shorter to look the same size as the rest.)
const TROPHY = { sb: [lombardiArt, "Super Bowl"], mvp: [mvpArt, "MVP"], sbmvp: [sbmvpArt, "SB MVP"], opoy: [opoyArt, "OPOY"], dpoy: [dpoyArt, "DPOY"], oroy: [oroyArt, "OROY"], droy: [droyArt, "DROY"] };
const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
function CareerHaul({ haul, tone = "#fde68a" }) {
  if (!haul) return null;
  const { trophies = [], honors = [], ranks = [] } = haul;
  if (!trophies.length && !honors.length && !ranks.length) return null;
  const h = MOBILE ? 56 : 84;
  return (
    <div style={{ marginTop: 12, maxWidth: 560 }}>
      {trophies.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: MOBILE ? 6 : 12, alignItems: "flex-end" }}>
          {trophies.map(({ k, n }) => (
            <div key={k} style={{ textAlign: "center", minWidth: h }}>
              <div style={{ position: "relative", height: h, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <img src={TROPHY[k][0]} alt={TROPHY[k][1]} style={{ height: k === "sbmvp" ? h * 0.6 : h, objectFit: "contain", filter: "drop-shadow(0 6px 10px #000a)" }} />
                {n > 1 && <span style={{ position: "absolute", right: -4, bottom: 0, background: "#0b1220", border: `1.5px solid ${tone}`, color: tone, borderRadius: 999, padding: "0 4px", fontSize: MOBILE ? 9.5 : 11, lineHeight: 1.35, fontWeight: 900 }}>×{n}</span>}
              </div>
              <div style={{ ...txt.caption, marginTop: S[1] }}>{TROPHY[k][1]}</div>
            </div>
          ))}
        </div>
      )}
      {honors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {honors.map(({ label, n }) => <span key={label} style={{ fontSize: T.xs, fontWeight: 800, color: "#e2e8f0", background: "#ffffff14", borderRadius: 999, padding: `${S[1]}px ${S[3]}px` }}><b style={{ color: tone }}>{n}×</b> {label}</span>)}
        </div>
      )}
      {ranks.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {ranks.slice(0, 4).map((r) => (
            <div key={r.ab + r.key} style={{ fontSize: T.sm, fontWeight: 700, color: "#e2e8f0", padding: `${S[1]}px 0` }}>
              <b style={{ color: tone }}>{ord(r.rank)}</b> in {r.team || r.ab} franchise {r.label.replace(/^\w/, (c) => c.toLowerCase())} <span style={{ color: "#94a3b8" }}>({r.v.toLocaleString()})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HofCeremony({ m, onClose }) {
  const t = m.team;
  return (
    <Spotlight p={m.p} team={t} gold smoke kicker={`Pro Football Hall of Fame · Class of ${m.cls}`} title={m.p.name} bg="HOF" confetti={["#fbbf24", "#fde68a", "#d4a017", "#ffffff"]} cta="Welcome to Canton →" onNext={onClose} label="Hall of Fame"
      side={<img src={goldJacket} alt="The gold jacket" style={{ width: "100%", maxHeight: MOBILE ? 130 : "44vh", objectFit: "contain", filter: "drop-shadow(0 12px 28px #000c) drop-shadow(0 0 22px #fbbf2455)" }} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bdg pos={m.p.pos} /><TeamLogo t={t} sz={24} /><span style={{ color: "#e7cf8a" }}>{m.tagline || `${t.city} ${t.name}`}</span></div>
      {m.sub && <div style={{ fontSize: T.md, color: "#e2e8f0", marginTop: S[3], lineHeight: 1.5, fontStyle: "italic" }}>{m.sub}</div>}
      {m.lines?.length > 0 && <div style={{ marginTop: 10, maxWidth: 520 }}>{m.lines.map(([k, v, tone]) => <Line key={k} k={k} v={v} tone={tone || "#fde68a"} />)}</div>}
      <CareerHaul haul={m.haul} />
    </Spotlight>
  );
}

// Jersey night: his number goes up to the rafters (or his name onto the Ring of Honor) under the lights.
function RaftersNight({ m, onClose }) {
  const t = m.team, ring = m.kind === "ring";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2600, background: `radial-gradient(ellipse at 50% 0%, ${t.clr || "#1e3a8a"}cc, #02040af5 65%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{CSS + "@keyframes raise{0%{transform:translateY(160px) scale(.9);opacity:0}70%{transform:translateY(-6px)}100%{transform:none;opacity:1}} @keyframes beam{0%,100%{opacity:.35}50%{opacity:.7}}"}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "conic-gradient(from 160deg at 20% -5%, transparent 0deg, #ffffff22 12deg, transparent 26deg), conic-gradient(from 174deg at 80% -5%, transparent 0deg, #ffffff22 12deg, transparent 26deg)", animation: "beam 4s ease-in-out infinite" }} />
      <div role="dialog" aria-label={ring ? "Ring of Honor" : "Jersey retirement"} onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(560px, 100%)", textAlign: "center", color: "#fff", animation: "mmIn .45s ease-out" }}>
        <div style={{ fontSize: T.sm, fontWeight: 800, color: t.ac === "#ffffff" ? "#fde68a" : (t.ac || "#fde68a") }}>{ring ? "Ring of Honor" : "Jersey retirement night"}</div>
        <div style={{ ...txt.muted, color: "#cbd5e1", marginTop: 2 }}>{t.city} {t.name} · {m.yr}</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 6px", animation: "raise 1.6s cubic-bezier(.2,.8,.3,1) both" }}>
          {ring ? (
            <div style={{ borderRadius: 18, background: `linear-gradient(180deg, ${t.clr}, #0b1220)`, padding: `${S[4]}px ${S[5]}px`, boxShadow: "0 10px 40px #000c" }}>
              <div style={{ ...txt.caption, color: "#fde68a" }}>{t.name} Ring of Honor</div>
              <div style={{ fontSize: T.xl, fontWeight: 900, letterSpacing: 1 }}>{m.p.name.toUpperCase()}</div>
              <div style={{ ...txt.muted, color: "#cbd5e1" }}>{m.p.pos}{m.p.num ? ` · #${m.p.num}` : ""}</div>
            </div>
          ) : (
            <div style={{ position: "relative", padding: `${S[3]}px ${S[4]}px ${S[1]}px`, borderRadius: "18px 18px 50% 50% / 18px 18px 18% 18%", background: `linear-gradient(180deg, ${t.clr}, #0b1220)`, boxShadow: "0 12px 50px #000c" }}>
              <Jersey team={t} name={m.p.name} num={m.p.num} size={MOBILE ? 150 : 190} />
              <div style={{ fontSize: T.sm, fontWeight: 800, color: "#fde68a", paddingBottom: S[3] }}>No one will wear #{m.p.num} again</div>
            </div>
          )}
        </div>
        <div className="mm-title" style={{ ...txt.title, fontSize: MOBILE ? T.xl : T.xxl, marginTop: S[2] }}>{m.p.name}</div>
        {m.sub && <div style={{ ...txt.body, marginTop: S[2] }}>{m.sub}</div>}
        {m.lines?.length > 0 && <div style={{ marginTop: S[3], textAlign: "left", background: "#ffffff0d", borderRadius: 18, padding: `${S[1]}px ${S[4]}px` }}>{m.lines.map(([k, v, tone]) => <Line key={k} k={k} v={v} tone={tone} />)}</div>}
        <button onClick={onClose} style={{ ...CTA, marginTop: S[4], background: t.ac || "#fde68a", color: ink(t.ac || "#fde68a") }}>Continue →</button>
      </div>
    </div>
  );
}

// Each team's own ring art (public/rings/{AB}.webp); falls back to the drawn ring if a file is missing.
function TeamRing({ t, yr, titles, size }) {
  const [bad, setBad] = React.useState(false);
  if (bad || !t?.ab) return <ChampionRing t={t} yr={yr} titles={titles} size={size} />;
  return <img src={`${import.meta.env.BASE_URL}rings/${String(t.ab).toUpperCase()}.webp`} alt={`${t.city || ""} ${t.name || t.ab} championship ring`.trim()} width={size} height={size} onError={() => setBad(true)} style={{ display: "block", objectFit: "contain", filter: "drop-shadow(0 18px 26px #000d) drop-shadow(0 0 34px #fbbf2440)" }} />;
}

// Ring night: before the home opener the champions get their rings and the banner goes up.
function RingNight({ m, onClose }) {
  const t = m.team;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2600, background: "radial-gradient(ellipse at 50% 30%, #3b2a0acc, #02040af5 70%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{CSS + "@keyframes ringSpin{0%{transform:rotateY(80deg) scale(.6);opacity:0}100%{transform:none;opacity:1}}"}</style>
      <Confetti colors={[t.clr || "#1e3a8a", "#e8c45a", "#fde68a", "#ffffff"]} />
      <div role="dialog" aria-label="Ring night" onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(600px, 100%)", textAlign: "center", color: "#fff", background: "linear-gradient(170deg,#1c1206,#0b0703 70%)", borderRadius: 22, padding: MOBILE ? `${S[5]}px ${S[4]}px` : `${S[5]}px ${S[6]}px`, boxShadow: "0 30px 80px #000c, 0 0 80px #d4a01733", animation: "mmIn .45s ease-out" }}>
        <div style={{ fontSize: T.sm, fontWeight: 800, color: "#d4a017" }}>Ring night · {m.yr + 1} home opener</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8, perspective: 600 }}><div style={{ animation: "ringSpin 1.3s cubic-bezier(.2,.8,.3,1) both" }}><TeamRing t={t} yr={m.yr} titles={m.titles} size={MOBILE ? 230 : 290} /></div></div>
        <div className="mm-title" style={{ ...txt.title, fontSize: MOBILE ? T.xl : T.xxl, marginTop: S[1] }}>{m.sbName || `${m.yr} world champions`}</div>
        <div style={{ ...txt.body, marginTop: S[2] }}>{m.score ? <>Champions by {m.score}{m.opp ? <> over the {m.opp}</> : null}. </> : null}The {t.city} {t.name} raise the banner and hand out the rings before the {m.yr + 1} opener.</div>
        {m.names?.length > 0 && <div style={{ marginTop: S[3], background: "#ffffff0d", borderRadius: 18, padding: `${S[3]}px ${S[4]}px`, textAlign: "left" }}>
          <div style={{ ...txt.caption, color: "#d4a017", marginBottom: S[1] }}>Getting their rings</div>
          <div style={{ fontSize: T.sm, color: "#fde68a", lineHeight: 1.6 }}>{m.names.join(" · ")}</div>
        </div>}
        <button onClick={onClose} style={{ ...CTA, marginTop: S[4], background: "linear-gradient(90deg,#b45309,#fbbf24,#b45309)", color: "#1c1206" }}>Defend the title →</button>
      </div>
    </div>
  );
}

// A number climbing from zero to its value (the record moments).
function CountUp({ value, ms = 1700 }) {
  const m = String(value).match(/[\d,]+(\.\d+)?/);
  const target = m ? +m[0].replace(/,/g, "") : null, dec = m?.[1] ? m[1].length - 1 : 0;
  const [v, setV] = React.useState(target == null ? null : 0);
  React.useEffect(() => {
    if (target == null) return;
    let raf, t0;
    const step = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / ms); setV(target * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  if (target == null) return value;
  const shown = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return String(value).replace(m[0], shown);
}

// A record, in the spotlight: him standing in his uniform, the number counting up, the old mark struck.
function RecordSpot({ m, onClose }) {
  const t = m.team;
  return (
    <Spotlight p={m.p} team={t} gold={m.nfl} kicker={m.nfl ? (m.career ? "★ New NFL career record ★" : "★ New NFL record ★") : m.career ? `${t.name} all-time record` : `New ${t.name} record`} title={m.p.name} bg={jerseyNum(m.p) != null ? `#${jerseyNum(m.p)}` : null}
      confetti={m.nfl ? ["#fbbf24", "#fde68a", "#d4a017", t.clr, "#ffffff"] : [t.clr, t.ac, "#fde68a", "#ffffff"]} cta={m.nfl ? "Into the record book →" : "Continue →"} onNext={onClose} label={m.nfl ? "New NFL record" : "New franchise record"}>
      <style>{"@keyframes rsStrike{from{width:0}to{width:100%}}"}</style>
      <div>{m.p.pos} · {t.city} {t.name}{m.yr ? ` · ${m.yr}` : ""}</div>
      <div style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 52 : 88, lineHeight: 1, color: "#fde68a", marginTop: MOBILE ? 8 : 14, fontVariantNumeric: "tabular-nums" }}><CountUp value={m.value} /></div>
      <div style={{ fontSize: T.md, fontWeight: 800, color: "#d4a017" }}>{m.nfl ? `The most ${m.label} in league history` : m.label}</div>
      {m.prev && <div style={{ display: "inline-block", position: "relative", marginTop: S[3], fontSize: T.md, color: "#94a3b8" }}>
        <span style={{ ...txt.caption, color: "#78716c", marginRight: S[2] }}>Old record</span>{m.prev}
        <span aria-hidden style={{ position: "absolute", left: 0, top: "52%", height: 2, background: "#ef4444", animation: "rsStrike .7s 1.9s ease-out both" }} />
      </div>}
      {m.sub && <div style={{ fontSize: T.md, color: "#cbd5e1", marginTop: S[3], fontStyle: "italic" }}>{m.sub}</div>}
    </Spotlight>
  );
}

// Signing day: the new man in your uniform for the first time, and the deal.
function SigningSpot({ m, onClose }) {
  const t = m.team;
  return (
    <Spotlight p={m.p} team={t} num={m.num} kicker={`Signing day · Welcome to ${t.city}`} title={m.p.name} bg={m.num != null ? `#${m.num}` : null} onNext={onClose} label={`${m.p.name} signs`}>
      <div>{m.p.pos} · {m.p.ovr} OVR · age {m.p.age}</div>
      <div style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 34 : 54, lineHeight: 1.05, color: "#fde68a", marginTop: MOBILE ? 8 : 14 }}>{m.yrs} {m.yrs === 1 ? "YEAR" : "YEARS"} · ${(+m.sal).toFixed(1)}M A YEAR</div>
      {m.sub && <div style={{ fontSize: T.md, color: "#cbd5e1", marginTop: S[3] }}>{m.sub}</div>}
      {m.lines?.length > 0 && <div style={{ marginTop: S[3], maxWidth: 520 }}>{m.lines.map(([k, v, tone]) => <Line key={k} k={k} v={v} tone={tone} />)}</div>}
    </Spotlight>
  );
}

export default function Moment({ m, onClose }) {
  if (!m?.team) return null;
  if (m.kind === "signing" && m.p) return <SigningSpot m={m} onClose={onClose} />;
  if (m.kind === "record" && m.p) return <RecordSpot m={m} onClose={onClose} />;
  if (m.kind === "hof") return <HofCeremony m={m} onClose={onClose} />;
  if (m.kind === "holiday") return <HolidayResult m={m} onClose={onClose} />;
  if (m.kind === "jersey" || m.kind === "ring") return <RaftersNight m={m} onClose={onClose} />;
  if (m.kind === "rings") return <RingNight m={m} onClose={onClose} />;
  const t = m.team;
  const clr = t.clr || "#1e3a8a", ac = t.ac || "#f59e0b";
  const party = m.kind === "clinch";
  const kicker = m.kind === "clinch" ? (m.level === "top" ? "No. 1 seed clinched" : m.level === "div" ? "Division clinched" : "Playoff berth clinched")
    : m.kind === "record" ? (m.nfl ? "New NFL record" : "New franchise record")
    : m.kind === "signing" ? "Signing day" : m.kind === "trade" ? "Breaking · blockbuster trade" : m.kind === "legend" ? "A franchise legend retires" : `The ${m.yr} season`;
  const title = m.kind === "clinch" ? (m.level === "top" ? `The road goes through ${t.city}` : m.level === "div" ? `${t.c || ""} ${t.d || ""} champions`.trim() : `The ${t.name} are playoff bound`)
    : m.kind === "record" ? m.p.name
    : m.kind === "signing" ? `Welcome to ${t.city}`
    : m.kind === "legend" ? m.p.name
    : m.kind === "trade" ? (m.got ? `The ${t.name} land ${m.p.name.split(" ").slice(-1)[0]}` : `${m.p.name.split(" ").slice(-1)[0]} traded`)
    : `${t.city} ${t.name}`;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2600, background: `radial-gradient(ellipse at 50% 20%, ${clr}cc, #030712f2 70%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{CSS}</style>
      {party && <Confetti colors={[clr, ac, "#fde68a", "#ffffff"]} />}
      <div role="dialog" aria-label={kicker} onClick={(e) => e.stopPropagation()} style={{ "--mm-glow": `${ac}55`, position: "relative", width: "min(660px, 100%)", maxHeight: "calc(var(--vh, 100vh) - 32px)", overflowY: "auto", background: `radial-gradient(120% 90% at 0% 0%, ${clr}, #0b1220 68%)`, borderRadius: 22, padding: MOBILE ? `${S[5]}px ${S[4]}px` : `${S[6]}px ${S[6]}px`, color: "#fff", animation: "mmIn .45s ease-out", boxShadow: "0 30px 80px #000c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: S[4] }}>
          <TeamLogo t={t} sz={MOBILE ? 56 : 76} glow />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: T.sm, fontWeight: 800, color: ac === "#ffffff" ? "#fde68a" : ac }}>{kicker}</div>
            <div className="mm-title" style={{ ...txt.title, fontSize: MOBILE ? T.xl : T.xxl, lineHeight: 1.05 }}>{title}</div>
          </div>
        </div>
        {m.sub && <div style={{ ...txt.body, marginTop: S[3] }}>{m.sub}</div>}

        {m.kind === "legend" && (
          <div style={{ display: "flex", alignItems: "center", gap: S[4], marginTop: S[4], background: "#ffffff0d", borderRadius: 18, padding: `${S[4]}px ${S[4]}px` }}>
            <div style={{ borderRadius: "50%", padding: 3, background: "linear-gradient(135deg,#fde68a,#b45309)" }}><Face s={m.p.face} sz={MOBILE ? 72 : 96} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bdg pos={m.p.pos} /><span style={{ fontSize: T.sm, color: "#fde68a", fontWeight: 800 }}>Thank you, {m.p.name.split(" ").slice(-1)[0]}.</span></div>
              <div style={{ fontSize: T.xxl, fontWeight: 900, lineHeight: 1, color: "#fde68a", marginTop: S[1] }}>{m.p.peak || m.p.ovr}<span style={{ fontSize: T.sm, color: "#cbd5e1", marginLeft: S[2] }}>peak OVR</span></div>
            </div>
          </div>
        )}
        {m.kind === "trade" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: S[4], marginTop: S[4], background: "#ffffff0d", borderRadius: 18, padding: `${S[4]}px ${S[4]}px` }}>
            <TeamLogo t={m.got ? m.other : t} sz={MOBILE ? 44 : 60} />
            <div style={{ textAlign: "center" }}>
              <Face s={m.p.face} sz={MOBILE ? 64 : 84} />
              <div style={{ fontSize: T.lg, fontWeight: 900, marginTop: S[1] }}>{m.p.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Bdg pos={m.p.pos} /><span style={{ fontSize: T.sm, color: "#cbd5e1" }}>{m.p.ovr} OVR · age {m.p.age}</span></div>
            </div>
            <span style={{ fontSize: 28, color: "#fde68a", fontWeight: 900 }}>→</span>
            <TeamLogo t={m.got ? t : m.other} sz={MOBILE ? 44 : 60} />
          </div>
        )}
        {m.lines?.length > 0 && <div style={{ marginTop: S[4] }}>{m.lines.map(([k, v, tone]) => <Line key={k} k={k} v={v} tone={tone} />)}</div>}
        {m.kind === "legend" && <CareerHaul haul={m.haul} />}
        {m.note && <div style={{ ...txt.muted, color: "#cbd5e1", marginTop: S[3], fontStyle: "italic" }}>{m.note}</div>}
        <button onClick={onClose} style={{ ...CTA, marginTop: S[5], background: ac, color: ink(ac) }}>{m.kind === "kickoff" ? "Let's go →" : "Continue →"}</button>
      </div>
    </div>
  );
}
