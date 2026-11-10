// Desktop Home, broadcast style: the week's game as one big TV promo (both clubs' colors, their
// stars standing toward the middle, Play right on it), then three quiet cards under it: what needs
// you, the game plan, and the top story. The rest of the game is one click away in the bar above.
import React, { useEffect, useState } from "react";
import { C, TeamLogo, LogoMark, kickoff, Sheet } from "./ui.jsx";
import PlayerArt from "./PlayerArt.jsx";
import { LombardiStill } from "./Lombardi.jsx";
import { featuredPlayer, headline } from "./BroadcastMatchup.jsx";
import { BLOCK, FONT_CSS } from "./Spotlight.jsx";
import { HOLIDAYS } from "./holidays.js";

const card = { background: "#ffffff0d", borderRadius: 18, padding: "16px 18px", minWidth: 0 };
const h2 = { fontSize: 20, fontWeight: 900, margin: "0 0 6px", display: "flex", alignItems: "baseline", gap: 8 };
const tag = { fontSize: 14, fontWeight: 800, color: "#fff", background: "#00000066", borderRadius: 999, padding: "6px 12px", whiteSpace: "nowrap" };
const rec = (t) => `${t.w ?? 0}-${t.l ?? 0}${t.t ? `-${t.t}` : ""}`;
const TONE = { urgent: C.rd, action: C.gd, info: "#60a5fa" };

// one club's side: logo, name, record, and its star (the best healthy player, his position, and
// where he ranks this season), like the old promo
function Side({ t, rating, right, star, teams }) {
  const line = headline(star, teams);
  return (
    <div style={{ position: "absolute", top: "18%", [right ? "right" : "left"]: 56, textAlign: right ? "right" : "left", zIndex: 2, maxWidth: "30%" }}>
      <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}><TeamLogo t={t} sz={104} glow /></div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: "#ffffffb3", marginTop: 14, textTransform: "uppercase" }}>{t.city}</div>
      <div style={{ fontFamily: BLOCK, fontSize: 52, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", textShadow: "0 4px 24px #0009" }}>{t.name}</div>
      <div style={{ fontSize: 20, color: "#ffffffcc", marginTop: 6 }}>{rec(t)}{Number.isFinite(rating?.ovr) ? ` · ${Math.round(rating.ovr)} OVR` : ""}</div>
      {star && <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: BLOCK, fontSize: 28, fontWeight: 700, lineHeight: 1.05, textTransform: "uppercase" }}>{star.name}</div>
        <div style={{ fontSize: 16, color: "#ffffffcc", marginTop: 2 }}>{star.pos} · {star.ovr} OVR</div>
        {line && <div style={{ fontSize: 14, fontWeight: 800, color: "#fde68a", marginTop: 6 }}>{line}</div>}
      </div>}
    </div>
  );
}

// The phase's hero when there's no game: your club's colors and mark, what time of year it is, a
// few numbers that matter now, and the buttons that move the year on.
function PhaseHero({ me, eyebrow, title, sub, stats = [], primary = [] }) {
  return (
    <div data-tour="promo" style={{ position: "relative", minHeight: 300, borderRadius: 22, overflow: "hidden", padding: "34px 44px", background: `radial-gradient(120% 140% at 0% 0%, ${me.clr}, ${me.clr}33 55%, #0b1120 100%)` }}>
      <LogoMark t={me} sz={420} opacity={0.09} style={{ right: -40, top: -50 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 26 }}>
        <TeamLogo t={me} sz={112} glow />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.8, color: "#ffffffcc", textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontFamily: BLOCK, fontSize: 64, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", marginTop: 6, textShadow: "0 4px 24px #0009" }}>{title}</div>
          {sub && <div style={{ fontSize: 20, color: "#ffffffcc", marginTop: 8 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 34, marginTop: 30, flexWrap: "wrap" }}>
        {stats.map(([l, v, c]) => <div key={l}><div style={{ fontSize: 28, fontWeight: 900, color: c || "#fff", lineHeight: 1 }}>{v}</div><div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.3, color: "#ffffffb3", marginTop: 6, textTransform: "uppercase" }}>{l}</div></div>)}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {primary.map((b, i) => <button key={b.label} onClick={b.onClick} style={{ minHeight: 52, padding: "0 26px", borderRadius: 14, border: 0, background: i === 0 ? C.gn : "#ffffff24", color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: i === 0 ? "0 8px 24px #0008" : "none" }}>{b.label.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "")}</button>)}
        </div>
      </div>
    </div>
  );
}

// away and home are drawn left and right, like the score bug. primary: [{ label, onClick }] for
// this week (Play, Sim). spread: "NYG −3" or "Pick'em". eyebrow: what kind of game it is.
// No game this week (a bye, or the off-season): phase = { me, eyebrow, title, sub, stats: [[label, value, color]] }
// takes the promo's place, and middle = { title, body } the game plan's.
const roman = (n) => [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((out, [v, r]) => { while (n >= v) { out += r; n -= v; } return out; }, "");
export default function DeskHome({ away, home, ra, rh, game, eyebrow, forecast, spread, primary = [], menu = [], planCard, stories = [], news = [], teams, onStory, side, rest, extra, injuries, onInbox, phase, middle, devStrip, yr }) {
  const [devOpen, setDevOpen] = useState(false);
  const [injOpen, setInjOpen] = useState(false);
  // the to-do list (and the inbox) open these sheets from anywhere in the app
  useEffect(() => {
    const f = (e) => { if (e.detail === "dev") setDevOpen(true); if (e.detail === "injuries") setInjOpen(true); };
    window.addEventListener("gm:home", f); window.__gmDeskHome = true;
    return () => { window.removeEventListener("gm:home", f); window.__gmDeskHome = false; };
  }, []);
  const pa = away && featuredPlayer(away), ph = home && featuredPlayer(home);
  const hol = HOLIDAYS[game?.holiday];
  // the to-do list: the week's main job is the Play button now, so the list starts after it
  const todo = menu.slice(1).filter((m) => !/more to do$/.test(m.label));
  const moreTodo = menu.find((m) => /more to do$/.test(m.label));
  const lead = stories[0], leadT = lead && teams[lead.team];
  const plan = planCard && React.cloneElement(planCard, { bare: true });
  // the Super Bowl gets its own look: the Lombardi between the two stars, a gold glow and a gold edge
  const sb = /^Super Bowl/.test(eyebrow || "");
  const sbNum = sb && yr ? roman(yr - 1965) : null;
  return (
    <div className="keep-dark" style={{ color: "#fff" }}>
      <style>{FONT_CSS}</style>
      {phase && <PhaseHero {...phase} primary={primary} />}
      {/* the promo */}
      {!phase && <div data-tour="promo" style={{ position: "relative", height: "clamp(380px, calc(var(--vh, 100vh) - 470px), 560px)", borderRadius: 22, overflow: "hidden", boxShadow: sb ? "inset 0 0 0 1px #e8c56a40" : "none", background: `linear-gradient(100deg, ${away.clr} 0%, ${away.clr}33 46%, ${home.clr}33 54%, ${home.clr} 100%)` }}>
        {/* the Super Bowl: the trophy as a tall, soft silhouette behind the two stars, fading into the night */}
        {sb && <div style={{ position: "absolute", left: "50%", top: 40, transform: "translateX(-50%)", opacity: 0.32, filter: "grayscale(0.3) brightness(1.15) blur(0.4px)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 45%, transparent 92%)", maskImage: "linear-gradient(180deg, #000 0%, #000 45%, transparent 92%)", pointerEvents: "none" }}><LombardiStill size={190} /></div>}
        {sb && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 55% at 50% 30%, #f5c5420f, transparent 70%)", pointerEvents: "none" }} />}
        {pa && <div style={{ position: "absolute", left: "23%", bottom: -20 }}><PlayerArt p={pa} ab={away.ab} width={300} style={{ filter: "drop-shadow(0 20px 30px #000a)" }} /></div>}
        {ph && <div style={{ position: "absolute", right: "23%", bottom: -20 }}><PlayerArt p={ph} ab={home.ab} width={300} style={{ filter: "drop-shadow(0 20px 30px #000a)" }} /></div>}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 52%, ${C.bg} 100%)` }} />
        {sb ? <div style={{ position: "absolute", top: 22, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, zIndex: 2 }}>
          <span style={{ width: 70, height: 1, background: "linear-gradient(90deg, transparent, #e8c56a)" }} />
          <span style={{ fontFamily: BLOCK, fontSize: 26, fontWeight: 700, letterSpacing: 4, color: "#f1d48a", textTransform: "uppercase", lineHeight: 1 }}>Super Bowl {sbNum}</span>
          <span style={{ width: 70, height: 1, background: "linear-gradient(90deg, #e8c56a, transparent)" }} />
        </div> : <div style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center", fontSize: sb ? 15 : 14, fontWeight: 900, letterSpacing: sb ? 3 : 1.8, color: sb ? "#f5c542" : "#ffffffcc", textTransform: "uppercase", zIndex: 2 }}>{[sb && sbNum ? `Super Bowl ${sbNum}` : eyebrow, game?.date ? kickoff(game).replace(" ET", "") : null].filter(Boolean).join(" · ")}</div>}
        <Side t={away} rating={ra} star={pa} teams={teams} />
        <Side t={home} rating={rh} star={ph} teams={teams} right />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 28, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, zIndex: 2 }}>
          {hol && <span style={{ ...tag, background: `linear-gradient(90deg, ${hol.c2}, ${hol.c1})` }}>{hol.name}</span>}
          {spread && <span style={tag}>{spread}</span>}
          {forecast && <span style={tag} title={forecast.note || undefined}>{forecast.label}</span>}
          {primary.map((b, i) => <button key={b.label} onClick={b.onClick} style={{ marginLeft: i === 0 ? 12 : 0, minHeight: 52, padding: "0 26px", borderRadius: 14, border: 0, background: i === 0 ? C.gn : "#ffffff24", color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: i === 0 ? "0 8px 24px #0008" : "none" }}>{b.label}</button>)}
        </div>
      </div>}
      {extra}
      {/* three quiet cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
        <div data-tour="todo" style={card}>
          <div style={h2}>To do{todo.length > 0 && <span style={{ fontSize: 14, color: C.mt }}>{todo.length + (moreTodo ? Number(moreTodo.label.match(/\d+/)?.[0] || 0) : 0)}</span>}</div>
          {todo.slice(0, 3).map((m, i) => (
            <button key={m.label} onClick={m.onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 50, background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff14" : 0, color: "#fff", textAlign: "left", cursor: "pointer", padding: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: TONE[m.tone] || "#64748b" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "")}</span>
              <span style={{ fontSize: 20, color: "#64748b" }}>›</span>
            </button>
          ))}
          {!todo.length && <div style={{ fontSize: 14, color: "#94a3b8", padding: "10px 0" }}>Nothing needs you this week.</div>}
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            {(todo.length > 3 || moreTodo) && <button onClick={onInbox || moreTodo?.onClick} style={{ background: "transparent", border: 0, padding: "6px 0", color: "#7dd3fc", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>See all</button>}
          </div>
        </div>
        <div style={card}>
          <div style={h2}>{middle ? middle.title : "Game plan"}</div>
          {middle ? middle.body : plan || <div style={{ fontSize: 14, color: "#94a3b8" }}>Your coaches set it before every game.</div>}
        </div>
        <div style={{ ...card, cursor: lead && (lead.inc || lead.retire) && onStory ? "pointer" : "default" }} onClick={lead && (lead.inc || lead.retire) && onStory ? () => onStory(lead) : undefined}>
          <div style={h2}>Top story</div>
          {lead ? <>
            {/* the club's logo beside the headline, and no emoji leading it */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {leadT && <span style={{ flexShrink: 0, marginTop: 2 }}><TeamLogo t={leadT} sz={34} glow /></span>}
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25 }}>{String(lead.head || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")}</div>
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.45, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{lead.text}</div>
          </> : news[0] ? <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{news[0].text}</div> : <div style={{ fontSize: 14, color: "#94a3b8" }}>Quiet around the league so far. Stories arrive after every week.</div>}
        </div>
      </div>
      {devStrip}
      {rest}
      {devOpen && <Sheet title="Development focus" onClose={() => setDevOpen(false)}>{side}<div style={{ height: 10 }} /></Sheet>}
      {injOpen && injuries && <Sheet title="Injury report" onClose={() => setInjOpen(false)}>{injuries}<div style={{ height: 10 }} /></Sheet>}
    </div>
  );
}

// Desktop: the header every section opens on (Team, Season, Draft, Trades & FA, Front Office), in
// Home's style: the club's colors and faint mark, the section's name, a few numbers that matter
// there, and its screens as tabs along the bottom. tabs: [[label, key, on]]; onTab(key).
export function SectionHero({ me, title, sub, stats = [], tabs = [], onTab, right, slim }) {
  // one row: the title, the section's tabs beside it (underlined on the hero's bottom edge), and
  // its numbers on the right. Compact, so the screen below gets the room.
  const tabbed = tabs.length > 1;
  // slim: a thin bar for screens that need every pixel (the live draft)
  if (slim) return (
    <div className="keep-dark" style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 10, padding: "0 20px", color: "#fff", background: `radial-gradient(120% 220% at 0% 0%, ${me.clr}c0, ${me.clr}26 55%, #0b1120 100%)` }}>
      <style>{FONT_CSS}</style>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, minHeight: 46 }}>
        <span style={{ fontFamily: BLOCK, fontSize: 22, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{title}</span>
        {sub && <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: "#ffffffa6", textTransform: "uppercase", whiteSpace: "nowrap" }}>{sub}</span>}
        {tabbed && <div style={{ display: "flex", gap: 2, alignSelf: "stretch" }}>
          {tabs.map(([l, k, on]) => <button key={k} onClick={() => onTab(k)} style={{ background: "transparent", border: 0, borderBottom: `3px solid ${on ? "#fff" : "transparent"}`, color: on ? "#fff" : "#ffffffa6", padding: "0 12px", fontSize: 14, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>)}
        </div>}
        <div style={{ display: "flex", gap: 20, marginLeft: "auto", alignItems: "baseline" }}>
          {stats.map(([l, v, c]) => <span key={l} style={{ whiteSpace: "nowrap" }}><b style={{ fontSize: 17, fontWeight: 900, color: c || "#fff" }}>{v}</b> <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.1, color: "#ffffffa6", textTransform: "uppercase" }}>{l}</span></span>)}
          {right}
        </div>
      </div>
    </div>
  );
  return (
    <div className="keep-dark" style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 14, padding: `16px 26px ${tabbed ? 0 : 16}px`, color: "#fff", background: `radial-gradient(120% 160% at 0% 0%, ${me.clr}d9, ${me.clr}26 55%, #0b1120 100%)` }}>
      <style>{FONT_CSS}</style>
      <LogoMark t={me} sz={260} style={{ right: -30, top: -70 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 28, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, paddingBottom: tabbed ? 14 : 0 }}>
          {sub && <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.8, color: "#ffffffb3", textTransform: "uppercase" }}>{sub}</div>}
          <div style={{ fontFamily: BLOCK, fontSize: 38, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", marginTop: 4 }}>{title}</div>
        </div>
        {tabbed && <div style={{ display: "flex", gap: 2, alignSelf: "flex-end" }}>
          {tabs.map(([l, k, on]) => <button key={k} onClick={() => onTab(k)} style={{ background: "transparent", border: 0, borderBottom: `3px solid ${on ? "#fff" : "transparent"}`, color: on ? "#fff" : "#ffffffa6", padding: "8px 14px 12px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>)}
        </div>}
        <div style={{ display: "flex", gap: 28, marginLeft: "auto", alignItems: "flex-end", paddingBottom: tabbed ? 14 : 0 }}>
          {stats.map(([l, v, c]) => <div key={l} style={{ textAlign: "right" }}><div style={{ fontSize: 26, fontWeight: 900, color: c || "#fff", lineHeight: 1 }}>{v}</div><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 5, textTransform: "uppercase" }}>{l}</div></div>)}
          {right}
        </div>
      </div>
    </div>
  );
}
