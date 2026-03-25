# Current State

## Snapshot

- Date: 2026-03-24
- Overall status: Live on GitHub Pages, active development
- Current version: v3.7 + Track 2 (Phaser Play module live)
- Studio OS: Fully compliant

## What exists

### Franchise simulation (gridiron-gm)

- Full roster management (OL sub-positions: LT/LG/C/RG/RT replacing generic OL)
- NFL Draft — 7 rounds, 224 picks, Jimmy Johnson pick values, 2-min timer, AI auto-pick, Sim Draft, Pause/Resume
- Free agency — sign/release, salary/contract, sortable/filterable table
- Scouting — hireable scouts, 3-year draft lookahead, hidden attributes
- Trading — players + picks, fairness evaluation via Jimmy Johnson chart
- Live Sim — play-by-play with SVG field, Player of the Game, team recap, box scores
- Game simulation — per-player stats, passer rating, AV, season/career tracking
- Player modal — full profile: combine, pro day, college stats, scouting, season stats
- Coaching & scheme system (OC/DC/ST, fit bonuses, schemeRunPct)
- Salary cap ($200M hard ceiling, capHit/capSpace, dead cap, contract extensions)
- QTE interactive gameplay (pre-snap reads, receiver targeting, run timing bar)
- GM Bridge: exportGameToPlay() + importPlayResult() — full round-trip with gridiron-gm-play
- **Depth chart view** — Roster tab toggle; ST/BK/INJ labels per position with injury indicator
- **Save/load state** — JSON download (💾 header button) + upload (splash + header 📂 button)
- **4th-down decision UI** — Punt / FG (range-gated, kicker OVR shown) / Go For It panel in live sim

### POS system (updated)
- `POS = ["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"]`
- Each OL sub-position has individual PP, CA, PA, STRS, WKNS data
- genRoster: `{LT:2,LG:2,C:1,RG:2,RT:2,...}` — 9 OL spots per roster
- teamStr counts 5 individual OL starters
- genLivePlay: OL avg ovr reduces sack chance

### Phaser Play module (gridiron-gm-play companion repo)
- 5-man OL (LT/LG/C/RG/RT) with individual ovr-weighted pocket hold times
- Full run/pass/defense gameplay
- Per-player stat tracking exported back to GM franchise

## Important paths

- `src/App.jsx` — all game code (~800+ lines, v3.6+)
- `vite.config.js` — Vite config (base path env var)
- `.github/workflows/` — ci.yml + deploy-pages.yml
- `context/` — Studio OS project memory
- `gridiron-gm-play/` — companion gameplay repo (separate directory)

## In progress

- (nothing blocked)

## Next 3 moves

1. OG image `public/images/cover.png` for social sharing
2. Special teams in Phaser (gridiron-gm-play)
3. Mobile layout improvements
