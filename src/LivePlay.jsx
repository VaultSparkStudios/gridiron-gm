// A play acted out on the live field (livePlays.js picks which ones): the camera pushes in on the
// ball, the snap, routes, the throw or the handoff, the chase and the tackle, all from the engine's
// result (playScript.js), so it can't play out any other way than the play-by-play says. Drawn
// inside the field's camera group; the KEY PLAY banner and the result card sit over the field
// (LiveField draws them, told which part of the play it's in by onPhase).
import React, { useEffect, useMemo, useRef, useState } from "react";
import TeamSprite, { teamSpriteHeight, ActionSprite, hasActionSprites, BALL_POSES } from "./pixel/TeamSprite.jsx";
import { buildPlay } from "./playScript.js";

// banner: how long the field holds at the snap under the KEY PLAY banner; card: how long the final
// picture holds under the result (longer for a headline)
const BANNER = 1100, LEAD_IN = 450, CARD = 1700, CARD_SHORT = 800;

// anim: { ev, key, id, card }; slots: the 22 men at the snap (LiveField), with the team, side and
// uniform each wears; X, Y: yards to field units; cam: the camera group (a ref); W, H: the field;
// zoom: how far the camera pushes in; speed: play speed (1 normal); onPhase("play" | "card");
// onDone: the play's over.
// paused: the game's paused, so the play holds where it is
// mir: the play is drawn mirrored (the offense driving right to left), so the camera aims at the mirrored spot
export default function LivePlay({ anim, slots, X, Y, cam, W, H, zoom = 2.1, speed = 1, paused = false, mir = false, onPhase, onDone }) {
  const sc = useMemo(() => buildPlay(anim.ev, slots, anim.id * 7919 + 13), [anim.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [t, setT] = useState(0);
  const done = useRef(onDone), phase = useRef(onPhase), hold = useRef(paused);
  done.current = onDone; phase.current = onPhase; hold.current = paused;
  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lead = anim.key ? BANNER : LEAD_IN, cardMs = anim.card?.head ? CARD : CARD_SHORT;
    const playMs = (sc.T * 1000) / speed;
    let raf = 0, start = performance.now(), last = start, said = "";
    const c = { x: W / 2, y: H / 2, k: 1 };
    const tell = (p) => { if (said !== p) { said = p; phase.current?.(p); } };
    const frame = (now) => {
      if (hold.current) { start += now - last; last = now; raf = requestAnimationFrame(frame); return; }
      const ms = now - start, dt = Math.min(0.05, (now - last) / 1000); last = now;
      const tt = still ? sc.T : Math.max(0, ((ms - lead) / 1000) * speed);
      setT(Math.min(tt, sc.T));
      if (ms >= lead) tell(ms >= lead + playMs ? "card" : "play");
      // the camera follows the ball, a little ahead of it, and never shows past the edge of the field
      const b = ballAt(sc, Math.min(tt, sc.T));
      const k = zoom, tx = mir ? W - X(b.x) - 30 : X(b.x) + 30, ty = Y(b.y);
      const a = ms < lead ? 1 - Math.exp(-dt * 7) : 1 - Math.exp(-dt * 4.5);
      c.k += (k - c.k) * a; c.x += (tx - c.x) * a; c.y += (ty - c.y) * a;
      const hw = W / (2 * c.k), hh = H / (2 * c.k);
      const cx = Math.max(hw, Math.min(W - hw, c.x)), cy = Math.max(hh, Math.min(H - hh, c.y));
      if (cam.current) { cam.current.style.transition = "none"; cam.current.style.transform = `translate(${W / 2 - c.k * cx}px, ${H / 2 - c.k * cy}px) scale(${c.k})`; }
      if (ms >= lead + playMs + cardMs) { done.current?.(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [anim.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ball = ballAt(sc, t);
  const men = slots.map((s) => {
    const [x, y] = sc.f[s.key](t), [px, py] = sc.f[s.key](Math.max(0, t - 0.06));
    const vx = x - px, speed = Math.hypot(vx, y - py) / 0.06, moving = speed > 1.3;
    const h = teamSpriteHeight(s.team, s.pos) || 30;
    // running flat out the other way (a return, a corner turning to run with his man) turns him
    // around; backpedalling (a dropback, pass protection, a linebacker's drop) doesn't
    const facing = Math.abs(vx) > 0.25 ? (vx > 0 ? "right" : "left") : s.side === "off" ? "right" : "left";
    // the club's action frames when it has them; its stance (tipping over when he's down) when not
    const pose = hasActionSprites(s.team) ? poseOf(sc, s, t, speed, ball.held === s.key) : null;
    const fall = !pose && sc.down[s.key] != null ? Math.max(0, Math.min(1, (t - sc.down[s.key]) / 0.22)) : 0;
    const hop = sc.hop?.key === s.key && t > sc.hop.at ? Math.abs(Math.sin((t - sc.hop.at) * 9)) * 6 : 0;
    const bob = moving && !fall && !pose ? Math.abs(Math.sin(t * 19 + s.y)) * 1.6 : 0;
    return { s, sx: X(x), sy: Y(y) - bob - hop, h, facing, fall, pose };
  }).sort((a, b) => a.sy - b.sy);
  const holder = ball.held ? men.find((m) => m.s.key === ball.held) : null;
  // his frame already has the football in his hands: don't draw a second one. The quarterback's
  // stance has it in his hands too, so before the snap (the ball's still the center's) the drawn
  // one waits until he's out of it
  const qbStance = men.find((m) => m.s.pos === "QB" && !m.pose);
  const ballInArt = holder ? (holder.pose ? BALL_POSES.has(holder.pose) : holder.s.pos === "QB") : !sc.m?.special && t <= 0.05 && !!qbStance;
  // a carried ball stays tucked in his arm: when he goes down, it goes down with him (only a fumble
  // puts it on the turf)
  let bx = holder ? holder.sx + (holder.facing === "right" ? 3 : -3) : X(ball.x);
  let by = holder ? holder.sy + (holder.pose === "b1" ? -holder.h * 0.6 : 1) : Y(ball.y) + (1.2 - ball.h) * 12;
  if (holder?.fall) {
    const a = ((holder.facing === "right" ? 1 : -1) * holder.fall * 78 * Math.PI) / 180, px = holder.sx, py = holder.sy + holder.h * 0.5;
    const dx = bx - px, dy = by - py;
    bx = px + dx * Math.cos(a) - dy * Math.sin(a); by = py + dx * Math.sin(a) + dy * Math.cos(a);
  }
  return (
    <g pointerEvents="none">
      {!holder && <ellipse cx={X(ball.x)} cy={Y(ball.y) + 16} rx="3.2" ry="1.3" fill="#000" opacity={0.3 / (1 + ball.h * 0.4)} />}
      {men.map(({ s, sx, sy, h, facing, fall, pose }) => (
        <g key={s.key} transform={`translate(${sx} ${sy})${fall ? ` rotate(${(facing === "right" ? 1 : -1) * fall * 78} 0 ${h * 0.5})` : ""}`}>
          {pose ? <ActionSprite y={Math.round(h * 0.5)} team={s.team} pose={pose} away={s.away} facing={facing} /> : <TeamSprite y={Math.round(h * 0.5)} team={s.team} pos={s.pos} away={s.away} facing={facing} />}
        </g>
      ))}
      {!ballInArt && <g transform={`translate(${bx} ${by}) rotate(${holder ? 0 : -18})`}>
        <ellipse rx="3.6" ry="2.2" fill="#7c3f12" stroke="#2b1405" strokeWidth=".6" />
        <line x1="-1.4" y1="0" x2="1.4" y2="0" stroke="#fff" strokeWidth=".6" />
      </g>}
      {/* a flag on the play: the yellow hanky lands at his feet */}
      {sc.flag && t > sc.flag.at && (() => {
        const [fx, fy] = sc.f[sc.flag.key](sc.flag.at), u = Math.min(1, (t - sc.flag.at) / 0.35);
        const x = X(fx) + 9, y = Y(fy) + 14 - (1 - u) * 34;
        return <g transform={`translate(${x} ${y}) rotate(${(1 - u) * 200 - 12})`}><rect x="-6" y="-4" width="12" height="8" rx="1.4" fill="#facc15" stroke="#fff" strokeWidth="1.4" paintOrder="stroke" /><rect x="-6" y="-4" width="12" height="8" rx="1.4" fill="none" stroke="#713f12" strokeWidth=".5" /><circle cx="-2.5" cy="0" r="1.6" fill="#fef9c3" /></g>;
      })()}
      {/* the names that matter on this play, over their heads (and over him once he's down) */}
      {men.filter((m) => sc.stars.includes(m.s.key) && (sc.who[m.s.key] || m.s.p)).map(({ s, sx, sy, h, facing, fall }) => {
        const full = (sc.who[s.key] || s.p).name, nm = full.split(" ").slice(1).join(" ") || full;
        return <text key={`n${s.key}`} x={sx + (facing === "right" ? 1 : -1) * fall * h * 0.55} y={sy - h * 0.5 - 4 + fall * h * 0.75} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" stroke="#000b" strokeWidth="2.2" paintOrder="stroke" fontFamily="system-ui">{nm}</text>;
      })}
    </g>
  );
}

// Which action frame a player is in at time t (null: his stance), from what he's doing on this
// play (sc.m: who threw, caught, carried, made the tackle, and when). speed: yards a second;
// ball: he's carrying it. The frames are the club's action sheets (a1-c8, TeamSprite.jsx).
const LINE = new Set(["LT", "LG", "C", "RG", "RT", "DL"]);
function poseOf(sc, s, t, speed, ball) {
  const m = sc.m, k = s.key;
  if (!m || t <= 0.05) return null; // set at the snap
  const stride = Math.floor(t / 0.14) % 2;
  const sp = m.special;
  if (sp) {
    // the snap, the hold and the kick; the punt and the catch
    if (k === sp.snapper && t < 0.28) return "c5";
    if (sp.k === "fg") {
      if (k === sp.holder) return t >= 0.3 && t < sp.tKick ? "c4" : null;
      if (k === sp.kicker) return t < 0.4 ? null : t < 0.85 ? (stride ? "c2" : "c1") : t < sp.tKick ? "c2" : t < sp.tKick + 0.6 ? "c3" : null;
    } else {
      // the kickoff: his run-up, the plant and the boot off the tee
      if (sp.k === "ko" && k === sp.kicker && t >= 0.3 && t < sp.tKick + 0.55) return t < sp.tKick - 0.2 ? (stride ? "a6" : "a5") : t < sp.tKick ? "c2" : "c3";
      if (sp.kneelAt != null && k === sp.returner && t > sp.kneelAt) return "a4"; // touchback: down on a knee in the end zone
      if (k === sp.punter) return t >= 0.5 && t < sp.tKick ? "c6" : t >= sp.tKick && t < sp.tKick + 0.55 ? "c7" : null;
      if (k === sp.returner && sp.catches && t > sp.tLand - 0.3 && (t < sp.tLand + 0.15 || k !== m.carrier) && !(sc.down[k] != null && t >= sc.down[k])) return "c8";
    }
  }
  const down = sc.down[k];
  // the finish: the ball carrier takes the hit and goes down; the tackler dives in and lands
  if (down != null && t >= down) {
    if (k === m.carrier) return t < down + 0.28 ? "b4" : "b5";
    if (k === m.tackler) return t < down + 0.3 ? "b3" : "b5";
    return "b5";
  }
  if (k === m.recov && m.recovT != null && t > m.recovT - 0.5) return "b3"; // diving on a fumble
  // a kickoff's blocks: once the wall meets the coverage, the two lock up
  if (sp?.pairs?.[k] != null && t > sp.pairs[k] && k !== m.carrier && k !== m.tackler) return "b6";
  if (k === m.tackler && m.carrier && !m.td && t > m.tEnd - 0.32) return "b3";
  if (k === m.carrier && m.td && t > m.tEnd) return "b7";
  if (m.k === "kneel" && k === m.qb) return t > 0.3 ? "a4" : null; // victory formation: down on a knee
  if (k === m.qb && m.k !== "run") {
    if (m.tThrow != null) {
      if (t > m.tThrow - 0.38 && t <= m.tThrow) return "a7";
      if (t > m.tThrow && t < m.tThrow + 0.4) return "a8";
    }
    if (m.tThrow != null ? t < m.tThrow : true) return null; // in the pocket with the ball
  }
  // the handoff: he holds it out until the back takes it (then only the back has the ball)
  if (k === m.qb && m.handoff != null && t > m.handoff - 0.3 && t < m.handoff) return "a3";
  if (m.tC != null && t > m.tC - 0.25 && t < m.tC + 0.15) {
    if (k === m.tgt && m.k !== "int") return "b1"; // hands up for the ball
    if (k === m.carrier && m.k === "int") return "b1"; // the pick
  }
  if (k === m.swat && m.tC != null && t > m.tC - 0.22 && t < m.tC + 0.35) return "b8";
  // the lines come out of their stance and lock up: only the man making the play gets loose
  // (once the ball's past them, the defensive linemen who peel off to chase run after it)
  if (LINE.has(s.pos) && k !== m.tackler && k !== m.carrier && (!sp || t < sp.release)) {
    if (t < 0.18) return null;
    if (!(s.side === "def" && m.tE != null && t > m.tE + 0.15 && speed > 1.6)) return "b6";
  }
  if (speed > 1.6) return ball ? (stride ? "a2" : "a1") : stride ? "a6" : "a5";
  // his stance has a football in his hands: once he's handed it off or thrown it (or before it
  // reaches him), the quarterback stays in frames with empty hands
  if (s.pos === "QB" && !ball && !sp) return speed > 0.3 ? (stride ? "a6" : "a5") : m.tThrow != null && t > m.tThrow ? "a8" : "a5";
  return null;
}

// the ball at time t: in someone's hands (held: his key) or loose / in the air (x, y, h yards)
function ballAt(sc, t) {
  const b = sc.ball(t);
  if (!b.held) return b;
  const [x, y] = sc.f[b.held](t);
  return { x, y, h: 1.2, held: b.held };
}
