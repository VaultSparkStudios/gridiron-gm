# Task Board

## Done (recent)

- [x] v3.2: Sim Draft, Enhanced Roster Table, FA Table Overhaul, Clickable Box Scores, Live Sim with SVG field
- [x] v3.3: Interactive play-calling (8 call types, QTE toggle)
- [x] v3.4: Coaching & scheme system (OC/DC/ST, fit bonuses, schemeRunPct)
- [x] v3.5: Salary cap ($200M hard ceiling, capHit/capSpace, dead cap, contract extensions)
- [x] v3.6: QTE interactive gameplay (pre-snap reads, receiver targeting, run timing bar)
- [x] Track 2 (Phaser): Full gridiron-gm-play module live — P1–P5 complete
- [x] GM Bridge: exportGameToPlay() + importPlayResult() — full round-trip loop
- [x] importPlayResult: marks schedule game played with correct H/A score
- [x] Boot screen: week/records/scheme display
- [x] Studio OS migration: AGENTS.md, context/, logs/, docs/, prompts/, updated workflows
- [x] OL sub-positions: LT/LG/C/RG/RT replacing generic OL in POS, PP, CA, PA, STRS, WKNS, genRoster, teamStr
- [x] genLivePlay: OL avg ovr reduces sack chance
- [x] Injury depth chart: Roster tab toggle with ST/BK/INJ labels per position
- [x] Export/import save state: JSON download/upload via 💾/📂 buttons
- [x] 4th-down decision UI: Punt / FG (range+kicker gated) / Go For It panel
- [x] Defense sub-positions: DE/DT, MLB/OLB, FS in gridiron-gm-play
- [x] Drive chart in GameOverScene (gridiron-gm-play)
- [x] ci.yml workflow for gridiron-gm-play
- [x] P7: Fix DE/MLB/FS position lookups in FieldScene, BootScene, defaultRoster (was stale DL/LB/S)
- [x] P7: 4th-down decision in PlayCallScene (Punt / FG range-gated / Go For It)
- [x] P7: PAT choice after user TD (Kick PAT +1 97% / Go for 2 +2 45%)
- [x] P7: FG attempt handler — distance-based success, possession flip, drive chart 'FG' entry
- [x] P7: Punt handler — possession flip in FieldScene
- [x] BootScene matchup card (was already live since P5; fixed DE lookup now corrected)

## In Progress

- (none)

## Backlog — Gameplay

- [ ] Analytics/telemetry (privacy-safe, no PII)
- [ ] Season awards: MVP, OPOY, DPOY banner on season end in gridiron-gm

## Backlog — gridiron-gm-play (companion repo)

- [x] P8: Kickoff return mini-game — user returns kick (WASD, 7 coverage defenders), AI returns after user score, opening kickoff at game start
- [x] P9: Fumble mechanic on run tackle (~4%, RB str-weighted, red flash, drive chart FUM)
- [ ] P9 candidates: halftime scene, two-minute warning indicator, scramble / broken play

## Backlog — Infrastructure

- [ ] OG image: `public/images/cover.png` (social sharing)
- [x] Mobile layout improvements (gridiron-gm-play: Scale.FIT, user-scalable=no, D-pad sz 44)
- [x] Player progression visibility: dev report in game log, expired players enter FA pool, ⬆ DEV badge in PlayerTable (age≤24, pot-ovr≥12)
- [x] AI FA signings: CPU teams fill roster holes from expFA pool before user market opens
