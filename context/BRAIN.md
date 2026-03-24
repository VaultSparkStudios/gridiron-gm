# Brain

## Strategic thinking

### Architecture heuristic

The single-file constraint drives every technical decision. Before adding a new feature, ask: can this be expressed as a new state variable + new render block + new helper function, all within `src/App.jsx`? If yes, do it. If it requires external deps or a second file, question whether it belongs.

### Feature addition heuristic

Every feature addition follows the same pattern:
1. New state (useState/useRef)
2. New logic (function or useEffect)
3. New render block (JSX within the existing tab system)
4. New button to trigger it (added to the top bar or tab)

This keeps features composable and reversible.

### Simulation philosophy

Sim functions should be fast (synchronous, no async), deterministic from seeded randomness, and produce plausible NFL-calibrated outputs. Use real formulas where they exist (passer rating, AV). Fake what cannot be real (player names, team names) using tables and gaussian distributions.

### UI philosophy

The UI is a data dashboard, not a game UI. Dense tables, small fonts, sortable columns, position filters. Show the data; let the player derive the story. The SVG field in Live Sim is the one exception — it is visual because a live drive needs spatial context.

## Mental models

- **Phase locking**: The game enforces a linear phase sequence (PRESEASON → REGULAR → PLAYOFFS → COMBINE → DRAFT → FREE AGENCY → next PRESEASON). Features are only available in the right phase. This prevents state corruption.
- **Additive state**: Player objects grow over time (stats accumulate, career log appends). Nothing is ever deleted from a player object — only added.
- **Tab as viewport**: The tab system is the entire UI. Each tab is a self-contained view of one aspect of the franchise. New features get a new tab or extend an existing one.

## Priorities

1. Game stability — `npm run build` must always pass
2. Feature completeness — all planned features from HANDOFF.md §10 are implemented
3. Studio compliance — Studio OS structure, deployment standard, slug correctness
4. Polish — visual improvements, UX smoothing

## Current best understanding

The codebase is in a good state (v3.2). All five major v3.2 features work. The main outstanding work is Studio OS compliance (docs, context, workflows) and potential new gameplay features.
