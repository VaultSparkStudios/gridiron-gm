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

---

## 2026-04-01 — Vault the game (password gate)

- Direction: Too many glitches — lock the game and prevent public access; add a password gate to both gridiron-gm and gridiron-gm-play
- Outcome: JS password overlay on both index.html files; code vsgm2026; sessionStorage unlock; styled dark/on-brand
- Canon impact: None — infrastructure; game itself unchanged

---

## 2026-04-01 — Cap space starting over budget

- Direction: Fix cap space — starting a league was $50M over the cap
- Outcome: genPlayer salary multiplier changed from Rf(2,18) to Rf(1,9); average roster now ~$165M vs ~$312M
- Canon impact: Roster construction feel — teams now start with realistic cap headroom

---

## 2026-04-01 — Position skills display (readable labels)

- Direction: Position skills read like code (armStr, throwPow etc.) — fix the labels; no both arm strength and throw power as separate stats
- Outcome: PA_LABELS map added for all 50+ camelCase keys; throwPow removed from QB posAttrs (redundant with armStr); display now uses readable names
- Canon impact: armStr is the canonical QB arm power stat; throwPow is retired

---

## 2026-04-01 — Cleaner stat tables

- Direction: Stat tables can be cleaner
- Outcome: Grid cells widened (44→52px), padding increased, font size bumped, zero-value stats filtered from display
- Canon impact: None — visual polish only

---

## 2026-04-01 — Live sim scroll

- Direction: The live sim feature forces the screen to go down to the plays — fix this
- Outcome: scrollIntoView replaced with in-container scroll; play-by-play log now auto-scrolls internally without moving the page
- Canon impact: None — UX fix

---

## 2026-04-01 — Website vault update

- Direction: Update the landing page and all info on vaultsparkstudios.com to reflect that Gridiron GM is currently vaulted/not released
- Outcome: Game page status → Vaulted, CTAs → Join The Vault, games grid card updated, studioRegistry updated, PROJECT_STATUS.json updated
- Canon impact: Public-facing status is now "Vaulted — Returning Soon" across all surfaces
