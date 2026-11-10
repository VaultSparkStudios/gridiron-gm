// A player on the live field from his club's own sprite sheet: eight snap poses (quarterback,
// back, receiver, tight end, lineman, defensive lineman, linebacker, defensive back) drawn in the
// club's home and road uniforms (public/sprites/<team>.webp, cut from the sheets by
// tools/slice.py; where each pose sits in the sheet is in teamSprites.json). Nothing is repainted
// in the game. Offense faces right, defense left (the art is mirrored).
import React, { memo } from "react";
import SHEETS from "./teamSprites.json";
import ACTS from "./actionSprites.json";
import { teamKey } from "../teamUniforms.js";

const BASE = `${import.meta.env?.BASE_URL ?? "/"}sprites/`;
const POSE = { QB: "qb", RB: "rb", HB: "rb", FB: "rb", WR: "wr", TE: "te", LT: "ol", LG: "ol", C: "ol", RG: "ol", RT: "ol", OL: "ol", DL: "dl", DE: "dl", DT: "dl", NT: "dl", LE: "dl", RE: "dl", EDGE: "dl", LB: "lb", MLB: "lb", OLB: "lb", ILB: "lb" };
// a standing quarterback is this tall in the field's units; every pose keeps its size relative to him
const QB_H = 41;

export const hasTeamSprites = (team) => !!SHEETS[teamKey(team)];
export const poseOf = (pos) => POSE[String(pos || "").toUpperCase()] || "db";

// How tall he stands, in field units (a lineman in his stance is shorter than a quarterback).
export function teamSpriteHeight(team, pos) {
  const s = SHEETS[teamKey(team)]; if (!s) return 0;
  return (s.home[poseOf(pos)][3] / s.home.qb[3]) * QB_H;
}

// x, y: where his cleats touch the turf.
function TeamSprite({ x = 0, y = 0, team, pos, away = false, facing = "right", title }) {
  const k = teamKey(team), s = SHEETS[k];
  if (!s) return null;
  const [cx, cy, cw, ch] = s[away ? "away" : "home"][poseOf(pos)], [aw, ah] = s.size;
  const sc = QB_H / s.home.qb[3], w = cw * sc, h = ch * sc;
  return (
    <g transform={`translate(${x} ${y})${facing === "left" ? " scale(-1 1)" : ""}`}>
      {title && <title>{title}</title>}
      <ellipse cx="0" cy="-1" rx={w * 0.4} ry={Math.max(2, h * 0.06)} fill="#000" opacity=".28" />
      <svg x={-w / 2} y={-h} width={w} height={h} viewBox={`${cx} ${cy} ${cw} ${ch}`} overflow="hidden">
        <image href={`${BASE}${k}.webp`} width={aw} height={ah} />
      </svg>
    </g>
  );
}
export default memo(TeamSprite);

// The action frames (running, the handoff and the throw, catches, hits, blocks, kicks), cut from
// each club's action sheets by tools/slice_actions.py into public/sprites/act/<team>.webp. Poses:
// a1-a8, b1-b8, c1-c8 as in the sheets (actionSprites.json). A quarterback releasing a pass (a8)
// stands as tall as one in his stance, which sets the scale for the rest.
const ACT_BASE = `${BASE}act/`;
export const hasActionSprites = (team) => !!ACTS[teamKey(team)];
// the poses drawn with the football in his hands (the field doesn't draw a second one)
export const BALL_POSES = new Set(["a1", "a2", "a3", "a4", "a7", "b2", "b4", "b5", "b7", "c4", "c5", "c6"]);
export function actionHeight(team, pose) {
  const s = ACTS[teamKey(team)]; if (!s?.home[pose]) return 0;
  return (s.home[pose][3] / s.home.a8[3]) * QB_H;
}
export function ActionSprite({ x = 0, y = 0, team, pose, away = false, facing = "right" }) {
  const k = teamKey(team), s = ACTS[k];
  const r = s?.[away ? "away" : "home"]?.[pose];
  if (!r) return null;
  const [cx, cy, cw, ch] = r, [aw, ah] = s.size, sc = QB_H / s.home.a8[3], w = cw * sc, h = ch * sc;
  return (
    <g transform={`translate(${x} ${y})${facing === "left" ? " scale(-1 1)" : ""}`}>
      <ellipse cx="0" cy="-1" rx={w * 0.38} ry={Math.max(2, h * 0.06)} fill="#000" opacity=".26" />
      <svg x={-w / 2} y={-h} width={w} height={h} viewBox={`${cx} ${cy} ${cw} ${ch}`} overflow="hidden">
        <image href={`${ACT_BASE}${k}.webp`} width={aw} height={ah} />
      </svg>
    </g>
  );
}
