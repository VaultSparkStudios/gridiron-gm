// Display size: the whole game scaled to fit the screen. Auto picks by the window (laptops a bit
// smaller so screens fit without scrolling, big desktops a bit larger so nothing looks tiny);
// Laptop and Desktop force one. Phones are never scaled. Stored per device.
const KEY = "gm_display";
export const DISPLAYS = [["auto", "Auto"], ["laptop", "Laptop"], ["desktop", "Desktop"]];
const ZOOM = { laptop: 0.9, desktop: 1.2 };

export function getDisplay() {
  try { const v = localStorage.getItem(KEY); return ZOOM[v] ? v : "auto"; } catch { return "auto"; }
}
// the scale a setting means on this window
export function displayZoom(d, w = window.innerWidth, h = window.innerHeight) {
  if (w < 900) return 1;
  if (ZOOM[d]) return ZOOM[d];
  if (w >= 1800 && h >= 1000) return 1.15;
  if (w <= 1600 && h < 860) return 0.92;
  return 1;
}
export function applyDisplay(d) {
  if (typeof document === "undefined") return;
  const z = displayZoom(d);
  document.documentElement.style.zoom = z === 1 ? "" : String(z);
  // fill the window at any scale: 100vh means the unscaled window, so divide it back out
  document.documentElement.style.setProperty("--vh", `${100 / z}vh`);
  try { localStorage.setItem(KEY, d); } catch { /* private mode: just this visit */ }
}
