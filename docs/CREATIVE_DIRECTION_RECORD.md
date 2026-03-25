# Creative Direction Record

Additive record of human-guided creative decisions. Append only. Do not rewrite.

---

## 2026-03-04 — Project inception

- Direction: Build a single-file browser-native NFL franchise simulator
- Outcome: Core game established — roster, schedule, sim, standings, draft, FA, playoffs, multi-season
- Canon impact: Established 32 fictional teams, 10 positions, salary/contract model, season phase flow

---

## 2026-03-04 — v2 simulation calibration

- Direction: Calibrate stats to real NFL numbers using Pro Football Reference templates
- Outcome: Real passer rating formula, AV system, PFR-calibrated stat ranges
- Canon impact: passer rating and AV are now canonical sim metrics

---

## 2026-03-04 — v3 scouting system

- Direction: Add hidden attributes, hireable scouts, combine drills, 3-year draft lookahead
- Outcome: Full scouting department system with position-specific skills, pro day, college stats
- Canon impact: All players have hidden truOvr/truPot; scouting reveals them incrementally

---

## 2026-03-10 — Live Sim visual design

- Direction: Live sim should show a football field with ball position, not just text
- Outcome: SVG FieldViz component with yard markers, end zones, animated ball position
- Canon impact: Live sim is the premium game mode — the one time the UI goes visual

---

## 2026-03-24 — Studio OS adoption

- Direction: Incorporate Studio OS fully into gridiron-gm repo structure
- Outcome: Full context/, logs/, docs/, prompts/ structure applied; AGENTS.md created; deployment standard compliance
- Canon impact: None — infrastructure change only

---

## 2026-03-24 — NFL OL sub-positions

- Direction: "There should be 5 offensive lineman with specific positions. All of this should tie back to the Front office mode."
- Outcome: Generic OL replaced with LT/LG/C/RG/RT across all data (POS, PP, CA, PA, STRS, WKNS, genRoster, teamStr). Phaser engine shows 5 labeled OL dots at LOS; each lineman's ovr from GM export controls their individual pocket hold time
- Canon impact: LT is the blind-side protector (passBlock emphasis); LG/RG are run blockers (runBlock/pulling); C is the quarterback of the line (awareness/snapping); RT is the right-side protector. genRoster produces {LT:2,LG:2,C:1,RG:2,RT:2}. Sack chance in genLivePlay now scales with avg OL ovr.

---

## 2026-03-24 — Dual-repo Studio OS compliance

- Direction: "Incorporate the Studio OS in both repos to be compliant. Make sure the agent updates both games/repos/local file folders in tandem."
- Outcome: gridiron-gm-play received full Studio OS structure (AGENTS.md, context/, logs/, docs/, prompts/). Both repos document the dual-repo bridge contract. Agents starting any session now have self-sufficient context in whichever repo they land in.
- Canon impact: The gridiron-gm + gridiron-gm-play combined product is now the canonical delivery unit for Gridiron GM. Neither repo can be worked in isolation without breaking the bridge.

---

## 2026-03-24 — Position filter on draft/scouting boards

- Direction: Backlog item from TASK_BOARD.md — "Position filter on scouting/draft prospect boards"
- Outcome: scPosF and drPosF state added; position filter bar appears on scouting and draft tabs (both active-draft and pre-draft views); all 14 positions including LT/LG/C/RG/RT available as filters
- Canon impact: None — UI improvement only
