// Light mode. The app is drawn dark; light mode flips the page's lightness while keeping its
// hues (with softer contrast so it's easy on the eyes), then flips pictures back so team logos,
// player faces, the field and trophies keep their real colors. Saved per browser.
const KEY = "gm_theme";
const CSS = `
html { background: #080c14; }
html.light { filter: invert(1) hue-rotate(180deg) contrast(0.88) brightness(1.04); }
html.light img, html.light video, html.light canvas, html.light svg { filter: invert(1) hue-rotate(180deg); }
html.light svg svg, html.light svg img { filter: none; }
`;

export function getTheme() {
  try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch { return "dark"; }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  if (!document.getElementById("gm-theme-css")) {
    const s = document.createElement("style");
    s.id = "gm-theme-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  document.documentElement.classList.toggle("light", theme === "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#eef1f6" : "#080c14");
  try { localStorage.setItem(KEY, theme); } catch { /* private mode: just this visit */ }
}
