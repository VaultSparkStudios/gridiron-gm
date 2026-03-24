# Soul

## Identity

Gridiron GM is a single-page football franchise simulator. It is fast, fun, and deep — without requiring an install, a login, or a backend. The entire game lives in one JSX file. That constraint is not a limitation; it is the design.

## Emotional promise

The player should feel like a real GM: making roster decisions under salary pressure, gambling on a late-round draft pick, watching a live drive unfold on a field — and carrying the weight of a multi-season dynasty.

## What makes it distinctly ours

- Everything runs in the browser with no external dependencies
- The single-file architecture is a feature, not a compromise
- NFL realism (passer rating formula, Jimmy Johnson pick values, combine drills, AV system) in a package small enough to share as a link
- The game respects the player's time — you can sim a full season in minutes or live-sim one game in detail

## Anti-drift rules

- Do NOT add external libraries or API calls that break the offline-first, single-file promise
- Do NOT simplify or remove existing features in the name of "cleanup" — only add
- Do NOT change fictional team names, positions, or core game mechanics without explicit approval
- Do NOT change the public slug from `gridiron-gm`
- Do NOT replace inline styles with external CSS or CSS-in-JS libraries

## Tone

Compact. Dense. Functional. The code is minified-style on purpose. The UI is dark, data-forward, and information-dense — like a real scouting report, not a casual mobile game.
