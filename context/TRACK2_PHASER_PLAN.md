# Track 2 — Phaser.js Live Gameplay Module

## Overview

Separate browser game built in Phaser.js. User controls their Gridiron GM franchise team in real-time football gameplay. Connects to the GM layer via exported roster/stats JSON.

## Tech Stack

- **Framework**: Phaser 3 (CDN or npm)
- **Language**: JavaScript (ES modules)
- **Rendering**: WebGL (canvas fallback)
- **Host**: GitHub Pages under `vaultsparkstudios.com/gridiron-gm-play/`
- **Repo**: `VaultSparkStudios/gridiron-gm-play`

## Architecture

### Scenes
1. `BootScene` — load assets, import roster JSON from GM layer
2. `HudScene` — overlay: score, clock, down & distance, play call menu
3. `FieldScene` — main gameplay: top-down 2D field, player sprites, ball
4. `PlayCallScene` — modal overlay: formation picker, run/pass options
5. `ResultScene` — play result card, next down state
6. `GameOverScene` — final score, stat export back to GM layer

### Game Loop (per play)
1. PlayCallScene activates → user picks formation + play
2. FieldScene: pre-snap — offense and defense line up in formation
3. User presses SPACE to snap
4. Gameplay phase (varies by play type — see below)
5. Play resolves → ResultScene flash → next down or turnover

### Play Types & Mechanics
- **Inside Run**: QB hands off, control RB — arrow keys to dodge defenders
- **Outside Run**: RB sweeps edge — higher speed, open field, bigger risk
- **Quick Pass**: QB auto-throws on snap — click/tap receiver icon to catch
- **Deep Pass**: QB drops back (auto), select receiver icon before window closes
- **QB Scramble**: Control QB directly with WASD — avoid DL, reach first down

### Player Representation
- Offense: 5 colored dots (skill positions) + QB
- Defense: dots that read and react to play type
- Ball: white dot with trail
- Animations: sprite sheets for idle/run/catch (simple 2-4 frame pixel art)

### AI Defense
- Defenders have speed/awareness stats pulled from GM roster
- Run plays: DL converge on ball carrier by position rating
- Pass plays: DBs run coverage routes based on DC scheme (zone = zone drop, man = follow WR dot)

### GM Integration
- **Import**: `roster.json` exported from Gridiron GM — player names, OVR, SPD, STR
- **Export**: `game_result.json` — final score, per-player stat deltas → import back to GM season stats
- **Stat sync**: rushing yards, receiving yards, passing yards, TDs, fumbles from Phaser game write back to `.ss` season stats in App.jsx

## Milestones

| Phase | Scope | Est. Sessions |
|---|---|---|
| P1 — Field + QB | Field scene, QB movement, snap mechanic | 1-2 |
| P2 — Run game | RB handoff, dodge mechanic, tackle collision | 1-2 |
| P3 — Pass game | Receiver routes, throw window, DB coverage | 2-3 |
| P4 — AI defense | Scheme-aware defenders, formation pre-snap | 1-2 |
| P5 — GM bridge | Import roster, export stats, session linking | 1 |
| P6 — Polish | Animations, sound FX, HUD, mobile touch | 1-2 |

## Files & Repo Structure

```
gridiron-gm-play/
├── index.html
├── src/
│   ├── main.js          — Phaser.Game config
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── FieldScene.js
│   │   ├── HudScene.js
│   │   ├── PlayCallScene.js
│   │   └── GameOverScene.js
│   ├── entities/
│   │   ├── Player.js    — sprite + stats wrapper
│   │   ├── Ball.js
│   │   └── AIDefender.js
│   └── data/
│       └── roster.json  — imported from GM layer
├── assets/
│   ├── sprites/
│   └── audio/
└── .github/workflows/deploy-pages.yml
```

## Open Questions

- Single HTML file (like GM) or proper multi-file Phaser project? → Multi-file, Phaser requires it
- Touch controls for mobile? → P6 stretch goal
- Multiplayer? → Out of scope for now; GM async league (v3.7) handles that
- Sound? → Simple SFX only (whistle, crowd, tackle impact)

## Status

- [ ] Repo created
- [ ] P1 scaffolded
- [ ] P2 run game
- [ ] P3 pass game
- [ ] P4 AI defense
- [ ] P5 GM bridge
- [ ] P6 polish
