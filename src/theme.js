// Light mode. The app is drawn dark with inline styles, so light mode re-maps the dark palette:
// every element using one of the app's dark surfaces gets the light equivalent, and the light
// text colors become dark ones (pale accents become their deeper shade) wherever they sit on a
// light surface. Pictures, team colors and colored buttons are left alone, and panels meant to stay
// dark (the team header, the home hero, the matchup card, banners) are marked .keep-dark.
// Saved per browser.
const KEY = "gm_theme";

// React writes inline colors as rgb()/rgba(), so that's what the selectors look for.
const rgb = (hex) => { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", "); };
// dark surface -> light surface
const SURFACES = {
  "#080c14": "#eef1f6", "#111827": "#ffffff", "#0f172a": "#f4f6fa", "#0b1220": "#ffffff", "#1e293b": "#e7ebf1",
  "#0d1424": "#f4f6fa", "#0a1520": "#f2f6fa", "#0a0f1a": "#f4f6fa", "#1e3a5f": "#dbeafe", "#0d1a2d": "#eef4fb",
  "#0d1020": "#f2f2fb", "#0d1a0d": "#effaf0", "#0d1824": "#f0f6fb", "#1a1a2e": "#f3f3f8", "#0a0f00": "#fbf8ee",
  "#080f1e": "#e9edf4", "#0d1a2a": "#eef4fb", "#13261d": "#e6f6ec",
};
// light text -> dark text
const TEXT = {
  "#e0e6f0": "#0f172a", "#e2e8f0": "#1e293b", "#cbd5e1": "#334155", "#94a3b8": "#475569", "#f1f5f9": "#0f172a", "#ffffff": "#0f172a",
  "#eab308": "#a16207", "#f59e0b": "#b45309", "#fde68a": "#a16207", "#fbbf24": "#b45309", "#fcd34d": "#a16207", "#facc15": "#a16207",
  "#22c55e": "#15803d", "#86efac": "#15803d", "#fca5a5": "#b91c1c", "#f87171": "#dc2626", "#fecaca": "#b91c1c",
  "#7dd3fc": "#0369a1", "#38bdf8": "#0284c7", "#60a5fa": "#2563eb", "#93c5fd": "#1d4ed8", "#bfdbfe": "#1d4ed8",
  "#a78bfa": "#6d28d9", "#c4b5fd": "#6d28d9", "#ddd6fe": "#6d28d9", "#e9d5ff": "#6d28d9", "#fdba74": "#c2410c", "#fef3c7": "#92400e",
};
const BORDERS = ["#1e293b", "#334155", "#1e3a5f"];
const L = "html.light";
const free = ":not(.keep-dark *):not(.keep-dark)";

function buildCss() {
  const out = [`html { background: #080c14; }`, `${L} { background: #eef1f6; color-scheme: light; }`, `${L} .keep-dark { color: #e0e6f0; color-scheme: dark; }`];
  // remapped dark surfaces, plus any see-through tint (over a light page it reads light too)
  const surf = [...Object.keys(SURFACES).flatMap((h) => [`background: rgb(${rgb(h)})`, `background-color: rgb(${rgb(h)})`]), "background: rgba(", "background-color: rgba(", "background: transparent"];
  for (const [d, l] of Object.entries(SURFACES)) {
    const r = rgb(d);
    out.push(`${L} [style*="background: rgb(${r})"]${free}, ${L} [style*="background-color: rgb(${r})"]${free} { background: ${l} !important; }`);
  }
  // text: on elements with no background of their own, or with one of the remapped surfaces
  for (const [d, l] of Object.entries(TEXT)) {
    const sel = `[style*="color: rgb(${rgb(d)})"]`;
    const list = [`${L} ${sel}:not([style*="background"])${free}`, ...surf.map((s) => `${L} ${sel}[style*="${s}"]${free}`)];
    out.push(`${list.join(", ")} { color: ${l} !important; }`);
  }
  // the page's own text color is set once at the root and inherited
  out.push(`${L} [style*="color: rgb(${rgb("#e0e6f0")})"]${free} { color: #0f172a !important; }`);
  // hairline borders in the dark slate shades (accent edges stay as they are)
  const accent = ':not([style*="border-left: 3px"]):not([style*="border-left: 4px"]):not([style*="border-top: 3px"])';
  for (const b of BORDERS) {
    const r = rgb(b);
    for (const side of ["border", "border-top", "border-bottom", "border-left", "border-right"]) {
      const prop = side === "border" ? "border-color" : `${side}-color`;
      out.push(`${L} [style*="${side}: 1px solid rgb(${r})"]${accent}${free}, ${L} [style*="${side}: 1px solid rgba(${r},"]${accent}${free}, ${L} [style*="${side}: 2px solid rgb(${r})"]${accent}${free} { ${prop}: #d3d9e2 !important; }`);
    }
  }
  // form controls
  out.push(`${L} select${free}, ${L} input${free} { background: #fff !important; color: #0f172a !important; border-color: #cbd2dc !important; }`);
  return out.join("\n");
}

export function getTheme() {
  try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch { return "dark"; }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  if (!document.getElementById("gm-theme-css")) {
    const s = document.createElement("style");
    s.id = "gm-theme-css";
    s.textContent = buildCss();
    document.head.appendChild(s);
  }
  document.documentElement.classList.toggle("light", theme === "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#eef1f6" : "#080c14");
  try { localStorage.setItem(KEY, theme); } catch { /* private mode: just this visit */ }
}
