// The franchise hub, laid out like Madden's: a menu on the left, this week's matchup in the
// middle (both logos, team ratings), and top stories on the right.
import React, { useEffect, useState } from "react";
import { C, TeamLogo, Btn, kickoff, Bdg, oC, Sheet, Segments } from "./ui.jsx";
import { unitRatings } from "./gamesim.js";
import { depthOrderFor } from "./DepthChart.jsx";
import { ROUND_NAMES } from "./playoffs.js";
import { InjTag } from "./InjuryTag.jsx";
import { injuryReport } from "./injuries.js";
import { featuredPlayer } from "./BroadcastMatchup.jsx";
import { primeArt } from "./playerArt.js";
import { pointSpread } from "./MatchupStakes.jsx";
import { teamNeeds, needName } from "./needs.js";
import { primeSlot } from "./seasonPreview.js";
import { HOLIDAYS } from "./holidays.js";
import { gameWeather, wxOf } from "./weather.js";
import { rosterPlan } from "./rosterPlan.js";
import { posTag } from "./dline.js";
import DeskHome from "./DeskHome.jsx";

const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const PHASE = { preseason: "Preseason", combine: "Offseason: NFL Combine", resign: "Offseason: Re-sign Week", freeagency: "Offseason: Free Agency", draft: "Offseason: NFL Draft" };

// Madden-style team ratings from each club's healthy starters (yours by your depth chart and snaps).
export function teamRatings(t, depthOrder, snaps) {
  const healthy = (t.roster || []).filter((p) => !p.injured && !p.holdout);
  const u = unitRatings((pos) => depthOrderFor(healthy, depthOrder, pos, snaps));
  const off = Math.round(u.pass * 0.6 + u.run * 0.4), def = Math.round(u.passD * 0.6 + u.runD * 0.4);
  return { ovr: Math.round(off * 0.5 + def * 0.5), off, def };
}

// Phones: built as an app screen, not a shrunk desktop page. A full-bleed hero for the next game
// in both clubs' colors, the week's to-dos as cards you swipe, shortcut
// tiles for everything else (each opens a bottom sheet), and the top story. The record and cap
// room already sit in the app header; the week's big button is the action bar above the tab bar.
const ORD = ["", "1st", "2nd", "3rd", "4th"];
// to-do labels carry a leading emoji for the desktop list; the phone cards don't need it
const plain = (s) => (typeof s === "string" ? s.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "") : s);
const TONE = { urgent: [C.rd, "Needs you"], action: [C.gd, "To do"], info: ["#38bdf8", "Heads up"] };
const ICON = {
  plan: "M9 3h6v3H9zM9 4.5H6V21h12V4.5h-3M9 11h6M9 15h4",
  hurt: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v8M8 12h8",
  dev: "M4 17l5-5 4 4 7-7M15 9h5v5",
  table: "M5 20v-8M12 20V5M19 20v-5",
  roster: "M9 11a3 3 0 100-6 3 3 0 000 6zM3.5 20a5.5 5.5 0 0111 0M16 5.2a3 3 0 010 5.6M17.5 14.6A5.5 5.5 0 0120.5 20",
  needs: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 11.2a.8.8 0 100 1.6.8.8 0 000-1.6z",
};
const Icon = ({ k, c }) => (
  <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 17, background: `${c}22`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[k]} /></svg>
  </span>
);
const clamp = (n) => ({ display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" });
const eyebrow = { fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: "#ffffffb3" };

function PhoneHome({ me, teams, ui, sp, yr, wk, pb, game, away, home, ra, rh, forecast, menu, side, planCard, rest, stories, news, onStory, onNav, fa, capRoom, onFa, sched, rivalId, devFocus }) {
  const [sheet, setSheet] = useState(null);
  const [panel, setPanel] = useState("stories");
  const close = () => setSheet(null);
  const then = (fn) => (...a) => { close(); fn?.(...a); };
  const news2 = (k) => { setPanel(k); setSheet("news"); };
  // the to-do list and the inbox open Home's sheets from anywhere (development focus, injuries)
  useEffect(() => {
    const f = (e) => { if (e.detail === "dev") setSheet("dev"); if (e.detail === "injuries") { setPanel("injuries"); setSheet("news"); } };
    window.addEventListener("gm:home", f); window.__gmPhoneHome = true;
    return () => { window.removeEventListener("gm:home", f); window.__gmPhoneHome = false; };
  }, []);
  const pct = (t) => (t.w + (t.t || 0) / 2) / Math.max(1, t.w + t.l + (t.t || 0));
  const rank = teams.filter((t) => t.c === me.c && t.d === me.d).sort((a, b) => pct(b) - pct(a) || b.w - a.w).indexOf(me) + 1;
  const hurt = injuryReport(me, wk).length;
  const oppId = game && (game.h === ui ? game.a : game.h), opp = game && teams[oppId];
  const playoff = sp === "playoffs";
  const neutral = !!game?.neutral || (playoff && pb?.rd === 4);
  const plan = ["combine", "resign", "freeagency", "draft"].includes(sp) && onFa ? rosterPlan(me.roster, fa, { nextYear: sp === "combine" || sp === "resign" }) : null;
  const need = !game && sp !== "regular" ? teamNeeds(me.roster, me.personnel).list[0] : null;
  const focused = [devFocus?.off, devFocus?.def].filter(Boolean).length;

  // the hero's lines: when, what kind of game, and the betting line
  let hero = null;
  if (game) {
    const sameDiv = opp.c === me.c && opp.d === me.d;
    const tags = [sp === "preseason" ? "Season opener" : playoff ? ROUND_NAMES[pb?.rd] || "Playoffs" : `Week ${game.wk ?? wk + 1}`, !playoff && primeSlot(game), sameDiv && "Division", rivalId != null && oppId === rivalId && "Rivalry"].filter(Boolean);
    const [day, time] = (game.date ? kickoff(game) : "").split(" · ");
    const sp2 = ra && rh ? pointSpread(ra, rh, neutral) : null;
    hero = { tags, day, time: time ? time.replace(" ET", "") : "TBD", line: sp2 ? (sp2.pts ? `${(sp2.home ? home : away).ab} −${sp2.pts}` : "Pick'em") : null };
  }
  const nextGame = !game && sp === "regular" ? sched.find((g) => g.wk > wk + 1 && (g.h === ui || g.a === ui)) : null;

  const Team = ({ t }) => (
    <div style={{ minWidth: 0, textAlign: "center" }}>
      <div style={{ display: "inline-flex" }}><TeamLogo t={t} sz={84} glow /></div>
      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
      <div style={{ fontSize: 14, color: "#ffffffb3" }}>{rec(t)}</div>
    </div>
  );
  const todos = menu.slice(0, 3);
  const tiles = [
    game && (sp === "regular" || playoff) && planCard && { k: "plan", icon: "plan", c: "#a78bfa", label: "Game plan", value: `vs ${opp.name}` },
    need && { k: "needs", icon: "needs", c: C.gd, label: "Biggest need", value: needName(need.pos).replace(/^./, (x) => x.toUpperCase()) },
    plan && { k: "build", icon: "roster", c: plan.open ? C.gd : C.gn, label: "Build your 53", value: `${plan.count} of ${plan.target}` },
    { k: "hurt", icon: "hurt", c: hurt ? C.rd : C.gn, label: "Injuries", value: hurt ? `${hurt} out` : "All healthy" },
    // a focused player only grows in regular-season weeks
    side && (sp === "preseason" || sp === "regular") && { k: "dev", icon: "dev", c: "#38bdf8", label: "Development", value: focused === 2 ? "Both set" : focused ? "1 of 2 set" : "Not set", tour: "devfocus" },
    // in season and at the combine Standings is already a tab in the bottom bar
    sp !== "regular" && sp !== "combine" && { k: "table", icon: "table", c: "#94a3b8", label: "Standings", value: `${ORD[rank] || rank} in ${me.c} ${me.d}`, tour: "strip" },
  ].filter(Boolean);
  const tap = (k) => (k === "hurt" ? news2("injuries") : k === "table" ? onNav("standings") : setSheet(k));
  const lead = stories[0], leadT = lead && teams[lead.team];
  const leadText = lead ? lead.head : news[0]?.text;
  const sec = { padding: "0 16px", marginTop: 26 };
  const h2 = { fontSize: 20, fontWeight: 900 };
  const link = { background: "transparent", border: 0, color: "#7dd3fc", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "6px 0" };
  const heroBg = game
    ? `linear-gradient(180deg, transparent 45%, ${C.bg} 100%), linear-gradient(100deg, ${away.clr}d9 0%, ${away.clr}33 46%, ${home.clr}33 54%, ${home.clr}d9 100%)`
    : `linear-gradient(180deg, transparent 40%, ${C.bg} 100%), radial-gradient(120% 90% at 50% 0%, ${me.clr}cc, ${me.clr}22 70%)`;

  return (
    <div className="keep-dark" style={{ margin: "-6px -8px calc(-150px - env(safe-area-inset-bottom))", paddingBottom: "calc(170px + env(safe-area-inset-bottom))", background: C.bg, color: "#fff", minHeight: "calc(var(--vh, 100vh) - 60px)" }}>
      {/* hero */}
      {game ? (
        <div style={{ background: heroBg, padding: "22px 14px 20px", textAlign: "center" }}>
          <div style={{ ...eyebrow, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {hero.tags.join("  ·  ")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginTop: 18 }}>
            <Team t={away} />
            <div style={{ padding: "0 4px", minWidth: 92 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffffb3" }}>{hero.day || "Kickoff"}</div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, whiteSpace: "nowrap" }}>{hero.time}</div>
              {hero.line && <div style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: "#fff", background: "#00000055", borderRadius: 999, padding: "3px 9px", marginTop: 8, whiteSpace: "nowrap" }}>{hero.line}</div>}
            </div>
            <Team t={home} />
          </div>
          {/* the day it's played on and the weather it's played in, big enough to plan around */}
          {(HOLIDAYS[game.holiday] || (forecast && forecast.kind !== "clear")) && <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {HOLIDAYS[game.holiday] && (() => { const h = HOLIDAYS[game.holiday]; return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 900, color: "#fff", background: `linear-gradient(90deg, ${h.c2}, ${h.c1})`, borderRadius: 999, padding: "6px 14px" }}>{h.name}</span>; })()}
            {forecast && forecast.kind !== "clear" && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: "#fff", background: "#00000059", borderRadius: 999, padding: "6px 14px" }}>{forecast.label}</span>}
          </div>}
          {forecast?.note && <div style={{ fontSize: 14, color: "#ffffffb3", marginTop: 8 }}>{forecast.note.replace(/^./, (x) => x.toUpperCase())}</div>}
        </div>
      ) : (
        <div style={{ background: heroBg, padding: "30px 16px 22px", textAlign: "center" }}>
          <div style={{ display: "inline-flex" }}><TeamLogo t={me} sz={96} glow /></div>
          <div style={{ ...eyebrow, marginTop: 14 }}>{sp === "regular" ? `${yr} · Week ${wk + 1}` : `${yr} · ${playoff ? "Playoffs" : "Offseason"}`}</div>
          <div style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, marginTop: 4 }}>{sp === "regular" ? "Bye week" : playoff ? "Season over" : PHASE[sp]?.replace("Offseason: ", "") || "Season complete"}</div>
          <div style={{ fontSize: 14, color: "#ffffffb3", marginTop: 6 }}>{nextGame ? `Next: Week ${nextGame.wk} ${nextGame.h === ui ? "vs" : "at"} ${teams[nextGame.h === ui ? nextGame.a : nextGame.h].name}` : `${me.city} ${me.name} · ${rec(me)}`}</div>
        </div>
      )}

      {rest && (
        <div style={{ ...sec, marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, background: rest.on ? "#0c4a6e66" : "#ffffff0d", padding: "12px 14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>No. 1 seed clinched</div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>{rest.on ? "Starters are resting until the playoffs" : "Rest starters to keep them healthy"}</div>
            </div>
            <button onClick={rest.toggle} style={{ minHeight: 40, borderRadius: 999, border: 0, padding: "0 16px", background: rest.on ? "#334155" : "#0284c7", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{rest.on ? "Play them" : "Rest"}</button>
          </div>
        </div>
      )}

      {/* to-dos: swipe through */}
      {todos.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", padding: "0 16px", marginBottom: 10 }}>
            <span style={h2}>{game && sp !== "playoffs" ? "Before kickoff" : "This week"}</span>
            {menu.length > 3 && <button onClick={() => setSheet("todo")} style={{ ...link, marginLeft: "auto" }}>See all {menu.length}</button>}
          </div>
          <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", scrollPaddingLeft: 16, padding: "0 16px 4px", WebkitOverflowScrolling: "touch" }}>
            {todos.map((m, i) => {
              const [c, word] = i === 0 ? ["#fff", "This week"] : TONE[m.tone] || TONE.info;
              return (
                <button key={m.label} onClick={m.onClick} style={{ flex: `0 0 ${todos.length === 1 ? "100%" : "78%"}`, minWidth: 0, scrollSnapAlign: "start", minHeight: 118, display: "flex", flexDirection: "column", textAlign: "left", whiteSpace: "normal", borderRadius: 18, border: 0, padding: 16, color: "#fff", cursor: "pointer", background: i === 0 ? `linear-gradient(140deg, ${me.clr}, ${me.clr}55)` : "#ffffff0f" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: i === 0 ? "#ffffffcc" : c }}>{i > 0 && <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />}{word}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, marginTop: 8, ...clamp(2) }}>{plain(m.label)}</span>
                  {m.sub && <span style={{ fontSize: 14, color: "#ffffffb3", marginTop: 4, lineHeight: 1.35, ...clamp(2) }}>{m.sub}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* shortcuts */}
      <div style={{ ...sec, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* an odd one out runs the full width, laid on its side */}
        {tiles.map((t, i) => { const wide = i === tiles.length - 1 && tiles.length % 2 === 1; return (
          <button key={t.k} data-tour={t.tour} onClick={() => tap(t.k)} style={{ gridColumn: wide ? "span 2" : undefined, minHeight: 64, display: "flex", flexDirection: "row", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 18, border: 0, background: "#ffffff0f", padding: "10px 12px", color: "#fff", cursor: "pointer" }}>
            {/* one compact line each: icon, what it is, where it stands */}
            <Icon k={t.icon} c={t.c} />
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, maxWidth: "100%" }}>
              <span style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
              <span style={{ fontSize: 13, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.value}</span>
            </span>
            {wide && <span style={{ fontSize: 20, color: "#64748b" }}>›</span>}
          </button>
        ); })}
      </div>

      {/* the top story */}
      {leadText && (
        <div style={sec}>
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 10 }}>
            <span style={h2}>Top story</span>
            <button onClick={() => news2("stories")} style={{ ...link, marginLeft: "auto" }}>All news</button>
          </div>
          <button onClick={() => (lead && (lead.inc || lead.retire) ? onStory?.(lead) : news2("stories"))} style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left", whiteSpace: "normal", borderRadius: 18, border: 0, padding: 16, color: "#fff", cursor: "pointer", background: leadT ? `linear-gradient(135deg, ${leadT.clr}cc, #ffffff0f 75%)` : "#ffffff0f" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {lead?.breaking && <div style={{fontSize: 14, fontWeight: 800, color: "#fca5a5", marginBottom: 4 }}>Breaking</div>}
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, ...clamp(3) }}>{leadText}</div>
            </div>
            {(leadT || news[0]?.team) && <TeamLogo t={leadT || news[0].team} sz={40} glow />}
          </button>
        </div>
      )}

      {sheet === "todo" && (
        <Sheet title="This week" onClose={close}>
          {menu.map((m, i) => {
            const [c] = i === 0 ? [me.clr] : TONE[m.tone] || TONE.info;
            return (
              <button key={m.label} onClick={then(m.onClick)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 56, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff14" : 0, padding: "8px 2px", color: "#fff", cursor: "pointer" }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: c, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{plain(m.label)}</span>
                  {i === 0 && m.sub && <span style={{ display: "block", fontSize: 14, color: "#94a3b8" }}>{m.sub}</span>}
                </span>
                <span style={{ fontSize: 20, color: "#64748b" }}>›</span>
              </button>
            );
          })}
        </Sheet>
      )}
      {sheet === "plan" && <Sheet title="Game plan" onClose={close}>{planCard}<div style={{ height: 8 }} /></Sheet>}
      {sheet === "needs" && <Sheet title="Your offseason" onClose={close}><OffseasonBoard me={me} sp={sp} onNav={then(onNav)} /><div style={{ height: 8 }} /></Sheet>}
      {sheet === "build" && <Sheet title="Build your 53" onClose={close}><RosterChecklist me={me} sp={sp} fa={fa} capRoom={capRoom} onFa={then(onFa)} mobile /></Sheet>}
      {sheet === "news" && (
        <Sheet title="Around the league" onClose={close}>
          <Segments items={[["stories", "Top Stories"], ["injuries", "Injury Report"]]} value={panel} onChange={setPanel} />
          {panel === "stories" ? <Stories stories={stories} news={news} teams={teams} onStory={then(onStory)} /> : <Injuries teams={teams} ui={ui} onNav={then(onNav)} wk={wk} />}
        </Sheet>
      )}
      {sheet === "dev" && <Sheet title="Development focus" onClose={close}>{side}<div style={{ height: 8 }} /></Sheet>}
    </div>
  );
}

// This week's top stories (written after every week), with the league wire as a fallback.
function Stories({ stories, news, teams, onStory }) {
  if (!stories.length && !news.length) return <div style={{ fontSize: 14, color: "#cbd5e1" }}>Quiet around the league so far. Stories arrive after every week.</div>;
  if (!stories.length) return news.map((n, i) => (
    <div key={i} style={{ background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      {n.team && <div style={{ marginBottom: 6 }}><TeamLogo t={n.team} sz={28} /></div>}
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{n.text}</div>
    </div>
  ));
  // a short list (the off-season's retirement story) tops up from the league wire
  const wire = stories.length < 3 ? news.slice(0, 3 - stories.length).map((n, i) => (
    <div key={`w${i}`} style={{ background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      {n.team && <div style={{ marginBottom: 6 }}><TeamLogo t={n.team} sz={28} /></div>}
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{n.text}</div>
    </div>
  )) : [];
  return [...stories.map((st, i) => {
    const t = teams[st.team];
    return (
      <div key={st.id} onClick={(st.inc || st.retire) && onStory ? () => onStory(st) : undefined} title={st.inc ? "Read the full story" : st.retire ? "See everyone who retired" : undefined} style={{ cursor: (st.inc || st.retire) && onStory ? "pointer" : "default", background: i === 0 ? `linear-gradient(135deg, ${t?.clr || "#1e3a5f"}cc, #0b1220)` : "#ffffff0d", border: `1px solid ${st.mine ? "#f97316" : "#ffffff1a"}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {t && <TeamLogo t={t} sz={i === 0 ? 40 : 26} />}
          {st.breaking && <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#fff", background: "#dc2626", borderRadius: 4, padding: "2px 6px" }}>BREAKING</span>}
          {st.mine && <span style={{fontSize: 14, fontWeight: 800, color: "#fdba74" }}>Your team</span>}
        </div>
        <div style={{ fontSize: i === 0 ? 16 : 14, fontWeight: 800, lineHeight: 1.3 }}>{st.head}</div>
        <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.45, marginTop: 4 }}>{st.text}</div>
        {(st.inc || st.retire) && onStory && <div style={{ fontSize: 12, fontWeight: 800, color: "#7dd3fc", marginTop: 6 }}>{st.retire ? "See the whole retirement class →" : "Read the full story →"}</div>}
      </div>
    );
  }), ...wire];
}

// Your injured players, then the biggest names out around the league.
function Injuries({ teams, ui, onNav, wk }) {
  const mine = injuryReport(teams[ui], wk);
  const league = teams.flatMap((t, i) => (i === ui ? [] : injuryReport(t, wk).filter(({ p, st }) => p.ovr >= 78 && st.tag !== "Q").map(({ p, st }) => ({ p, t, st })))).sort((a, b) => b.p.ovr - a.p.ovr).slice(0, 8);
  const row = (p, t, st) => (
    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #ffffff14" }}>
      {t && <TeamLogo t={t} sz={22} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} <span style={{ color: "#94a3b8", fontWeight: 600 }}>{posTag(p)} {p.ovr}</span></div>
        <div style={{ fontSize: 12, display: "flex", alignItems: "center" }}><InjTag st={st} showNote style={{ marginLeft: 0 }} /></div>
      </div>
    </div>
  );
  return (
    <>
      <div style={{fontSize: 14, fontWeight: 800, color: "#94a3b8", margin: "2px 0 4px" }}>Your team · {mine.length}</div>
      {mine.length ? mine.map(({ p, st }) => row(p, null, st)) : <div style={{ fontSize: 14, color: C.gn, padding: "6px 0 10px" }}>Fully healthy.</div>}
      <div style={{fontSize: 14, fontWeight: 800, color: "#94a3b8", margin: "14px 0 4px" }}>Around the league</div>
      {league.length ? league.map(({ p, t, st }) => row(p, t, st)) : <div style={{ fontSize: 14, color: "#cbd5e1", padding: "6px 0" }}>No big names out.</div>}
      {mine.length > 0 && <button onClick={() => onNav("roster")} style={{ marginTop: 10, background: "transparent", border: 0, color: "#7dd3fc", fontSize: 14, cursor: "pointer", padding: 0 }}>Manage roster →</button>}
    </>
  );
}

// The off-season (and bye weeks) has no matchup: the middle shows the club's needs and the
// players whose futures are on the table, each a shortcut to the screen where you act on it.
function OffseasonBoard({ me, sp, onNav }) {
  const needs = teamNeeds(me.roster, me.personnel).list.filter((x) => x.score >= 0.2).slice(0, 4);
  const expiring = me.roster.filter((p) => (p.contract ?? 2) <= 1).sort((a, b) => b.ovr - a.ovr).slice(0, 5);
  const young = me.roster.filter((p) => (p.age || 30) <= 24).sort((a, b) => b.ovr - a.ovr).slice(0, 5);
  const keep = sp === "combine" || sp === "resign" || sp === "regular";
  const list = keep && expiring.length ? expiring : young;
  const box = { background: "#00000040", border: "1px solid #ffffff1a", borderRadius: 10, padding: "10px 12px", minWidth: 0, flex: "1 1 260px" };
  const head = { fontSize: 14, fontWeight: 800, color: "#94a3b8", marginBottom: 6 };
  const go = sp === "freeagency" ? "freeagency" : sp === "draft" ? "draft" : sp === "combine" ? "scouting" : "contracts";
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
      <div style={box}>
        <div style={head}>Biggest needs</div>
        {needs.length ? needs.map((n) => (
          <button key={n.pos} onClick={() => onNav(go)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "transparent", border: 0, borderBottom: "1px solid #ffffff10", padding: "5px 0", color: "#fff", cursor: "pointer" }}>
            <Bdg pos={n.pos} /><b style={{ fontSize: 14, textTransform: "capitalize" }}>{needName(n.pos)}</b>
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.why[0] || ""}</span>
          </button>
        )) : <div style={{ fontSize: 14, color: "#cbd5e1" }}>No glaring holes. Build depth and stay young.</div>}
      </div>
      <div style={box}>
        <div style={head}>{list === expiring ? "DEALS ENDING" : "YOUR YOUNG CORE"}</div>
        {list.map((p) => (
          <button key={p.id} onClick={() => onNav(list === expiring ? (sp === "resign" ? "freeagency" : "contracts") : "roster")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "transparent", border: 0, borderBottom: "1px solid #ffffff10", padding: "5px 0", color: "#fff", cursor: "pointer" }}>
            <Bdg pos={posTag(p)} /><span style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{p.age}</span>
            <b style={{ color: oC(p.ovr), minWidth: 22, textAlign: "right" }}>{p.ovr}</b>
          </button>
        ))}
        {!list.length && <div style={{ fontSize: 14, color: "#cbd5e1" }}>Nobody yet.</div>}
      </div>
    </div>
  );
}

// Build your 53: every position group with how many you have against a typical roster, and the best
// free agent still out there at each. A tap opens free agency filtered to that spot.
const money = (n) => `$${(+n || 0).toFixed(1)}M`;
function RosterChecklist({ me, sp, fa, capRoom, onFa, mobile }) {
  const plan = rosterPlan(me.roster, fa, { nextYear: sp === "combine" || sp === "resign" });
  const pct = Math.min(100, (100 * plan.count) / plan.target);
  const tone = (r) => (r.have === 0 ? C.rd : r.short ? C.gd : C.gn);
  return (
    <div style={{ background: "#00000040", border: "1px solid #ffffff1a", borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>Build your 53</span>
        <b style={{ fontSize: 14, color: plan.open ? C.gd : C.gn }}>{plan.count}/{plan.target}</b>
        <div style={{ flex: "1 1 80px", height: 6, borderRadius: 3, background: "#ffffff14", overflow: "hidden", minWidth: 60 }}><div style={{ width: `${pct}%`, height: "100%", background: plan.open ? C.gd : C.gn }} /></div>
        <span style={{ fontSize: 12, color: "#cbd5e1" }}>{plan.open ? `${plan.open} spot${plan.open > 1 ? "s" : ""} to fill` : "Full roster"}{sp === "combine" || sp === "resign" ? " next season" : ""} · <b style={{ color: capRoom >= 0 ? C.gn : C.rd }}>{money(capRoom)}</b> cap space</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", columnGap: 14 }}>
        {plan.rows.map((r) => (
          <button key={r.key} onClick={() => onFa(r.pos)} title={r.best ? `Best free agent: ${r.best.name} (${r.best.pos} ${r.best.ovr}), asking about ${money(r.ask)} a year` : "Nobody left on the market here"} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0, textAlign: "left", background: "transparent", border: 0, borderBottom: "1px solid #ffffff10", padding: "4px 0", color: "#fff", cursor: "pointer" }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: tone(r), flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, width: mobile ? 112 : 104, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
            <b style={{ fontSize: 14, color: tone(r), width: 34, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{r.have}/{r.want}</b>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: r.short ? "#e2e8f0" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
              {r.best ? <>{r.best.name} <b style={{ color: oC(r.best.ovr) }}>{r.best.ovr}</b> · {money(r.ask)}</> : "market empty"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ rest = null, fa = [], capRoom = 0, onFa, mobile, teams, ui, depthOrder, playingTime, sched, wk, sp, yr, pb, byeMap, news, stories = [], messages, menu, primary, onNav, side, planCard, onStory, rivalId, h2h, devFocus, devStrip }) {
  const me = teams[ui];
  const [panel, setPanel] = useState("stories");
  const nextWk = sp === "preseason" ? 1 : wk + 1;
  // This week's game (or the next playoff game).
  let game = null, label = PHASE[sp] || `${yr} Week ${nextWk}: Gameday`;
  if (sp === "regular") { game = sched.find((g) => g.wk === nextWk && (g.h === ui || g.a === ui)); label = `${yr} Week ${nextWk}: ${game ? "Gameday" : "Bye Week"}`; }
  if (sp === "preseason") { game = sched.find((g) => g.wk === 1 && (g.h === ui || g.a === ui)); label = `${yr} Preseason`; }
  if (sp === "playoffs" && pb) {
    const m = pb.ch == null && pb.m.find(([h, a]) => h === ui || a === ui);
    if (m) game = { h: m[0], a: m[1] };
    label = pb.ch != null ? `${yr} Season Complete` : `${yr} Playoffs: ${ROUND_NAMES[pb.rd]}`;
  }
  // Next week's promo stars, made now while this week sits on screen, so after the sim their
  // pictures are ready the moment the new card opens (none on a phone: its card has no art).
  const after = sp === "regular" || sp === "preseason" ? sched.find((g) => g.wk === nextWk + 1 && (g.h === ui || g.a === ui)) : null;
  useEffect(() => {
    if (mobile || !after) return;
    for (const t of [teams[after.a], teams[after.h]]) primeArt(featuredPlayer(t), t?.ab);
  }, [mobile, after?.a, after?.h, after?.wk]); // eslint-disable-line react-hooks/exhaustive-deps
  const away = game && teams[game.a], home = game && teams[game.h];
  const mine = (t) => (t === me ? [depthOrder, playingTime] : []);
  const ra = away && teamRatings(away, ...mine(away)), rh = home && teamRatings(home, ...mine(home));
  // the forecast: the weather this game is played in (weather.js), and what it means for it
  const forecast = (() => {
    if (!game || !home || (sp === "playoffs" && pb?.rd === 4)) return null;
    const k = gameWeather(sp === "playoffs" ? { ...game, wk: game.wk ?? 18 + (pb?.rd || 1) } : game, yr, home.ab), w = wxOf(k);
    const kind = w.snow ? "snow" : w.rain ? "rain" : k === "wind" ? "wind" : w.cold ? "cold" : "clear";
    const note = w.snow === 2 || w.rain === 2 ? "expect a ground game and a loose ball" : w.snow || w.rain ? "a slick ball: more runs, fewer completions" : k === "wind" ? "tough day to throw deep or kick long" : w.cold ? "a hard, cold ball: tougher to throw, hold and kick" : null;
    return { kind, icon: w.icon, label: w.label, note };
  })();
  if (mobile) return <PhoneHome {...{ me, teams, ui, sp, yr, wk, pb, game, away, home, ra, rh, forecast, menu, side, planCard, rest, stories, news, onStory, onNav, fa, capRoom, onFa, sched, rivalId, devFocus }} />;
  // desktop game weeks: the broadcast Home (DeskHome); no game this week gets DeskHome's phase hero
  if (game && away && home) {
    const playoff = sp === "playoffs", neutral = !!game.neutral || (playoff && pb?.rd === 4);
    const opp = teams[game.h === ui ? game.a : game.h];
    const eyebrow = [sp === "preseason" ? "Season opener" : playoff ? ROUND_NAMES[pb?.rd] || "Playoffs" : `Week ${game.wk ?? nextWk}`, !playoff && primeSlot(game), opp && opp.c === me.c && opp.d === me.d && "Division", rivalId != null && opp?.id === rivalId && "Rivalry"].filter(Boolean).join(" · ");
    const sp2 = ra && rh ? pointSpread(ra, rh, neutral) : null;
    const spread = sp2 ? (sp2.pts ? `${(sp2.home ? home : away).ab} −${sp2.pts}` : "Pick'em") : null;
    const restEl = rest && (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, padding: "12px 16px", borderRadius: 16, background: rest.on ? "#0c4a6e55" : "#ffffff0d" }}>
        <div style={{ flex: 1, fontSize: 14, color: "#e2e8f0" }}><b style={{ color: "#7dd3fc" }}>No. 1 seed clinched.</b> {rest.on ? "Your starters are resting until the playoffs." : "Rest your starters to keep them healthy for the playoffs."}</div>
        <Btn onClick={rest.toggle} bg={rest.on ? "#334155" : "#0284c7"} style={{ fontSize: 14, fontWeight: 900, padding: "9px 16px", borderRadius: 10 }}>{rest.on ? "Play starters" : "Rest starters"}</Btn>
      </div>
    );
    return <DeskHome {...{ devStrip, yr, away, home, ra, rh, game, eyebrow, forecast, spread, primary: primary.slice(0, 2), menu, planCard, stories, news, teams, onStory, side, rest: restEl, injuries: <Injuries teams={teams} ui={ui} onNav={onNav} wk={wk} />, onInbox: () => onNav("inbox") }} />;
  }
  // desktop with no game this week (a bye, the off-season, a season that's over): the same Home,
  // a hero for the time of year in place of the promo, your biggest needs in the middle card
  {
    const titles = { combine: "The Combine", resign: "Re-sign week", freeagency: "Free agency", draft: "NFL Draft", playoffs: "Season over", regular: "Bye week" };
    const nxt = sp === "regular" ? sched.find((g) => g.wk > nextWk && (g.h === ui || g.a === ui)) : null;
    const nOpp = nxt && teams[nxt.h === ui ? nxt.a : nxt.h];
    const sub = sp === "regular" ? (nOpp ? `Next: Week ${nxt.wk} ${nxt.h === ui ? "vs" : "at"} the ${nOpp.name}` : "") : `${me.city} ${me.name} · ${rec(me)}`;
    const hurt = injuryReport(me, wk).length;
    const stats = [["Record", rec(me)], ["Cap space", `$${(+capRoom || 0).toFixed(1)}M`, capRoom < 0 ? C.rd : C.gn], ["Roster", `${me.roster.length}/53`, me.roster.length < 46 ? C.gd : "#fff"], ...(sp === "regular" ? [["Injured", hurt ? `${hurt} out` : "None", hurt ? C.gd : "#fff"]] : [])];
    const needs = teamNeeds(me.roster, me.personnel).list.filter((x) => x.score >= 0.2).slice(0, 4);
    const goNeed = sp === "freeagency" ? "freeagency" : sp === "draft" ? "draft" : sp === "combine" ? "scouting" : sp === "resign" ? "freeagency" : "roster";
    const middle = { title: "Biggest needs", body: needs.length ? needs.map((n, i) => (
      <button key={n.pos} onClick={() => (onFa && (sp === "freeagency" || sp === "resign") ? onFa(n.pos) : onNav(goNeed))} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 50, background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff14" : 0, color: "#fff", textAlign: "left", cursor: "pointer", padding: 0 }}>
        <Bdg pos={n.pos} /><b style={{ fontSize: 14, textTransform: "capitalize" }}>{needName(n.pos)}</b>
        <span style={{ marginLeft: "auto", fontSize: 14, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55%" }}>{n.why[0] || ""}</span>
      </button>
    )) : <div style={{ fontSize: 14, color: "#94a3b8" }}>No glaring holes. Build depth and stay young.</div> };
    const below = ["combine", "resign", "freeagency", "draft"].includes(sp) && onFa ? <div style={{ marginTop: 14 }}><RosterChecklist me={me} sp={sp} fa={fa} capRoom={capRoom} onFa={onFa} mobile={false} /></div> : null;
    // the to-do list's first row is the phase's main job; on this Home the hero's buttons do it
    return <DeskHome {...{ devStrip, primary: primary.slice(0, 2), menu, stories, news, teams, onStory, side, rest: below, injuries: <Injuries teams={teams} ui={ui} onNav={onNav} wk={wk} />, onInbox: () => onNav("inbox"), middle, phase: { me, eyebrow: sp === "regular" ? `${yr} · Week ${nextWk}` : sp === "playoffs" ? `${yr} season` : `${yr} offseason`, title: titles[sp] || label, sub, stats } }} />;
  }
}
