// Screens loaded on first open. When the game updates while it's open, the old build's files are
// gone from the server, so loading a screen fails ("Failed to fetch dynamically imported module").
// Then the page reloads once to pick up the new version (the autosave keeps your league); if it
// still fails right after a reload, the error goes to the screen's error panel as usual.
import React from "react";

const KEY = "gm_chunk_reload";
export function lazyScreen(load) {
  return React.lazy(() =>
    load().then(
      (m) => { try { sessionStorage.removeItem(KEY); } catch { /* private mode */ } return m; },
      (err) => {
        let last = 0;
        try { last = +sessionStorage.getItem(KEY) || 0; } catch { /* private mode */ }
        if (Date.now() - last > 30000) {
          try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
          window.location.reload();
          return new Promise(() => {}); // keep showing "Loading…" until the reload
        }
        throw err;
      },
    ),
  );
}
