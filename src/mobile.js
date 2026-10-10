// Mobile mode: the same game laid out for phones (compact header, bottom tab bar, a "More"
// sheet for everything else). On for the mobile build (VITE_MOBILE=1, published at
// /27_Gridiron_GM/mobile/) or with ?mobile in the address.
export const MOBILE = import.meta.env?.VITE_MOBILE === "1" || (typeof location !== "undefined" && /[?&]mobile\b/.test(location.search));
export const DESKTOP_URL = "https://evandamours.github.io/27_Gridiron_GM/";
export const MOBILE_URL = "https://evandamours.github.io/27_Gridiron_GM/mobile/";

if (MOBILE && typeof document !== "undefined") {
  document.documentElement.classList.add("gm-mobile");
  const s = document.createElement("style");
  s.textContent = `
    html.gm-mobile, html.gm-mobile body { -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; }
    html.gm-mobile button, html.gm-mobile select { touch-action: manipulation; }
    html.gm-mobile input, html.gm-mobile select { font-size: 16px !important; } /* no zoom on focus (iOS) */
  `;
  document.head.appendChild(s);
}
