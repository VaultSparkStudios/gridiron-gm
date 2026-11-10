// Mobile mode: the same game laid out for phones (compact header, bottom tab bar, a "More"
// sheet for everything else). On for the mobile build (VITE_MOBILE=1, published at
// /27_Gridiron_GM/mobile/) or with ?mobile in the address.
export const MOBILE = import.meta.env?.VITE_MOBILE === "1" || (typeof location !== "undefined" && /[?&]mobile\b/.test(location.search));
export const DESKTOP_URL = "https://evandamours.github.io/27_Gridiron_GM/";
export const MOBILE_SCALE = 0.9;
export const MOBILE_URL = "https://evandamours.github.io/27_Gridiron_GM/mobile/";

if (MOBILE && typeof document !== "undefined") {
  document.documentElement.classList.add("gm-mobile");
  const s = document.createElement("style");
  s.textContent = `
    html.gm-mobile, html.gm-mobile body { -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; }
    html.gm-mobile button, html.gm-mobile select { touch-action: manipulation; }
    html.gm-mobile input, html.gm-mobile select { font-size: 18px !important; } /* 16px+ once scaled: no zoom on focus (iOS) */
    /* a soft press on every button, so a tap always feels it landed */
    html.gm-mobile button { -webkit-tap-highlight-color: transparent; transition: transform .12s ease, filter .12s ease; }
    html.gm-mobile button:active:not(:disabled) { transform: scale(.97); filter: brightness(1.15); }
    /* screens fade in (opacity only: a transform would unpin the fixed bars inside) */
    @keyframes gmIn { from { opacity: 0 } to { opacity: 1 } }
    html.gm-mobile .gm-sheet { max-height: 86vh; max-height: 86dvh; }
    html.gm-mobile .gm-in { animation: gmIn .22s ease-out; }
  `;
  document.head.appendChild(s);
  // Draw the whole game at 90% on phones, so screens hold a bit more and feel less crowded.
  // The browser widens the page to match (390px phone = 433px of layout), so every size scales
  // together instead of each screen being shrunk by hand.
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute("content", `width=device-width, initial-scale=${MOBILE_SCALE}, viewport-fit=cover`);
}

