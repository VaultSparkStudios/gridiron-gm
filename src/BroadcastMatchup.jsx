// The week's matchup on the home screen, like a TV game promo: each club's half in its colors, its
// star standing large toward the middle (his number is on his jersey: a big one behind each man read
// as one long number across the two halves), the club's record and ratings on the outside, AT
// between them. Prime-time and rivalry games dress up; the holiday trim
// goes around it (HolidayCard). The phone keeps its compact card (HomeScreen CompactMatchup).
import React, { useState } from "react";
import { TeamLogo } from "./ui.jsx";
import PlayerArt, { usePlayerArt } from "./PlayerArt.jsx";
import { BLOCK, FONT_CSS } from "./Spotlight.jsx";
import "./broadcast-matchup.css";
import { posTag } from "./dline.js";

// The face of the club for the promo: its best healthy player who isn't an offensive lineman, kicker
// or punter (a 99 tackle would headline over the quarterback; a pass rusher who wrecks games is the
// draw he should be), leaning to the quarterback, then a receiver (a QB counts 6 OVR better, a WR 3).
// Anyone at all if the club has nobody else.
const NOT_FEATURED = new Set(["LT", "LG", "C", "RG", "RT", "OL", "K", "P"]);
const LEAN = { QB: 6, WR: 3 };
export function featuredPlayer(team) {
  const roster = (team?.roster || []).filter((p) => Number.isFinite(p?.ovr));
  const pool = roster.filter((p) => !NOT_FEATURED.has(p.pos) && !p.injured && !p.holdout);
  const score = (p) => p.ovr + (LEAN[p.pos] || 0);
  return (pool.length ? pool : roster).reduce((best, p) => (!best || score(p) > score(best) ? p : best), null);
}

// His line on the promo: where he ranks in the league this season in the stat his position is
// about, the best of them ("Leads the NFL in touchdown passes (24)", "3rd in the NFL in sacks
// (9.5)"). Nowhere near the top of anything: where he ranks by rating at his position if that's
// top 10 ("The NFL's top-rated QB"), else his season so far ("971 receiving yards this season"),
// else nothing.
const STATS = {
  QB: [["passTD", "touchdown passes"], ["passYds", "passing yards"], ["rushYds", "rushing yards"]],
  RB: [["rushYds", "rushing yards"], ["rushTD", "rushing touchdowns"], ["recYds", "receiving yards"]],
  WR: [["recYds", "receiving yards"], ["rec", "catches"], ["recTD", "touchdown catches"]],
  TE: [["recYds", "receiving yards"], ["rec", "catches"], ["recTD", "touchdown catches"]],
  DL: [["sacks", "sacks"], ["pres", "pressures"], ["tfl", "tackles for loss"]],
  LB: [["tkl", "tackles"], ["sacks", "sacks"], ["ints", "interceptions"]],
  CB: [["ints", "interceptions"], ["pd", "passes defended"]],
  S: [["ints", "interceptions"], ["tkl", "tackles"], ["pd", "passes defended"]],
};
const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
const val = (s, k) => (k === "tkl" ? (s?.tkl || 0) + (s?.ast || 0) : s?.[k] || 0);
const fmt = (k, v) => (k === "sacks" ? String(Math.round(v * 2) / 2) : Math.round(v).toLocaleString("en-US"));
export function headline(p, teams = []) {
  if (!p) return "";
  const all = teams.flatMap((t) => [...(t.roster || []), ...(t.ir || [])]);
  let best = null;
  for (const [k, label] of STATS[p.pos] || []) {
    const mine = val(p.ss, k);
    if (!(mine > 0)) continue;
    const rank = 1 + all.filter((q) => val(q.ss, k) > mine).length;
    if (!best || rank < best.rank) best = { k, label, rank, mine };
  }
  if (best && best.rank <= 15) return best.rank === 1 ? `Leads the NFL in ${best.label} (${fmt(best.k, best.mine)})` : `${ord(best.rank)} in the NFL in ${best.label} (${fmt(best.k, best.mine)})`;
  const r = 1 + all.filter((q) => posTag(q) === posTag(p) && (q.ovr || 0) > (p.ovr || 0)).length;
  if (r <= 10) return r === 1 ? `The NFL's top-rated ${posTag(p)}` : `The NFL's ${ord(r)}-rated ${posTag(p)}`;
  const [k, label] = (STATS[p.pos] || []).find(([key]) => val(p.ss, key) > 0) || [];
  return k ? `${fmt(k, val(p.ss, k))} ${label} this season` : "";
}

const show = (v) => (Number.isFinite(v) ? Math.round(v) : "–");
function Ratings({ mine = {}, other = {} }) {
  return (
    <div className="bm-ratings">
      {["ovr", "off", "def"].map((k) => {
        const ahead = Number.isFinite(mine[k]) && Number.isFinite(other[k]) && mine[k] >= other[k];
        return <div key={k} className={`bm-rating${ahead ? " bm-rating--ahead" : ""}`}><b>{show(mine[k])}</b><span>{k.toUpperCase()}</span></div>;
      })}
    </div>
  );
}

// art: show his picture (both men's are ready). late: they weren't when the card opened, so they ease in.
function Half({ team, player, rating, other, home, teams, art, late }) {
  const line = headline(player, teams);
  return (
    <div className={`bm-half${home ? " bm-half--home" : ""}`}>
      {player && art && <div className={`bm-art${late ? " bm-art--late" : ""}`}><PlayerArt p={player} ab={team.ab} width={200} crop={0.92} /></div>}
      <div className="bm-info">
        <div className="bm-logo"><TeamLogo t={team} sz={46} glow /></div>
        <div className="bm-city">{team.city}</div>
        <div className="bm-name">{team.name}</div>
        <div className="bm-record">{team.w ?? 0}-{team.l ?? 0}{team.t ? `-${team.t}` : ""}</div>
        {player && <>
          <div className="bm-star">{player.name}</div>
          <div className="bm-pos">{player.pos} · {player.ovr} OVR</div>
          {line && <div className="bm-line">{line}</div>}
        </>}
        <Ratings mine={rating} other={other} />
      </div>
    </div>
  );
}

// away, home: the clubs. awayRating, homeRating: { ovr, off, def }. label: the week. kickoff, venue,
// weather ({ kind, icon, label, note }): the game. prime: the night slot's name. rivalry: a division
// rival. compact: a shorter card (a small laptop screen, so the home screen fits without scrolling).
// scale: drawn this much bigger (a tall window with room to spare under it).
// Both stars appear together and only once their pictures are made (Home makes next week's ahead
// of time, so after a sim they're usually there the moment the card is).
export default function BroadcastMatchup({ away, home, teams, awayRating, homeRating, label, kickoff, venue, weather = null, prime = null, rivalry = false, compact = false, scale = 1 }) {
  const pa = featuredPlayer(away), ph = featuredPlayer(home);
  const sa = usePlayerArt(pa, away?.ab), sh = usePlayerArt(ph, home?.ab);
  const art = (!pa || sa !== undefined) && (!ph || sh !== undefined);
  const [late] = useState(() => !art);
  if (!away || !home) return null;
  const cls = `bm-card keep-dark${compact ? " bm-compact" : ""}${prime ? " bm-prime" : ""}${rivalry ? " bm-rival" : ""}`;
  return (
    <article className={cls} aria-label={`${away.city} ${away.name} at ${home.city} ${home.name}`}>
      <style>{FONT_CSS}</style>
      <header className="bm-head">
        <span>{label}</span>
        {rivalry && <span className="bm-badge bm-badge--rival">RIVALRY WEEK</span>}
        {prime && <span className="bm-badge bm-badge--prime">★ {prime.toUpperCase()}</span>}
        <span className="bm-when">{[kickoff, venue].filter(Boolean).join(" · ")}</span>
      </header>
      <div className="bm-body" style={{ "--bm-font": BLOCK, "--bm-a": away.clr || "#334155", "--bm-h": home.clr || "#334155", "--bm-k": scale }}>
        <Half team={away} player={pa} rating={awayRating} other={homeRating} teams={teams} art={art} late={late} />
        <Half team={home} player={ph} rating={homeRating} other={awayRating} teams={teams} art={art} late={late} home />
        <div className="bm-at">AT</div>
        {weather && <div className={`bm-wx bm-wx--${weather.kind}`}><b>{weather.label}</b>{weather.note ? ` · ${weather.note}` : ""}</div>}
      </div>
    </article>
  );
}
