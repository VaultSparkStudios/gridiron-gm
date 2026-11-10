# Gridiron-GM

Football GM is a realistic football general manager simulation game based off the National Football League (NFL).

**Live Site:** [D'Amours Unlimited](https://evandamours.github.io/27_Gridiron_GM)

**Repository:** [github.com/EvanDAmours/27_Gridiron_GM](https://github.com/EvanDAmours/27_Gridiron_GM)

## Development

```bash
npm install
npm run dev            # local dev server
npm test               # unit tests (game engine, contracts, trades, scouting, ...)
npm run smoke          # after a build: plays a full season + off-season in a headless browser
npm run check          # tests + build + smoke test
npm run publish:pages  # publishes desktop + mobile builds, only if `check` passes
```

Code layout: `src/App.jsx` is the game's screens and state; the engine is plain JavaScript in
`src/league.js` (players, schedules, the game wrapper, injuries, cap), `src/playsim.js` (the
play-by-play engine), `src/depth.js` (depth charts) and the topic modules next to them
(`offseason.js`, `contracts.js`, `aiTrades.js`, `deadline.js`, `scouting.js`, ...). Engine modules
don't import React, so the tests run them directly in Node.
