// Lint: catches the mistakes that slip through tests (App.jsx isn't imported by any test, so a
// typo'd name or a broken hook there only shows up here or at build). Run: npm run lint
import reactHooks from "eslint-plugin-react-hooks";

const globals = { window:"readonly", document:"readonly", localStorage:"readonly", sessionStorage:"readonly", navigator:"readonly", location:"readonly", console:"readonly", setTimeout:"readonly", clearTimeout:"readonly", setInterval:"readonly", clearInterval:"readonly", requestAnimationFrame:"readonly", cancelAnimationFrame:"readonly", fetch:"readonly", URL:"readonly", Blob:"readonly", FileReader:"readonly", getComputedStyle:"readonly", innerWidth:"readonly", innerHeight:"readonly", alert:"readonly", confirm:"readonly", prompt:"readonly", performance:"readonly", Image:"readonly", HTMLElement:"readonly", Event:"readonly", structuredClone:"readonly", process:"readonly", queueMicrotask:"readonly", AbortController:"readonly", TextEncoder:"readonly", TextDecoder:"readonly", crypto:"readonly", atob:"readonly", btoa:"readonly", matchMedia:"readonly", ResizeObserver:"readonly", IntersectionObserver:"readonly", MutationObserver:"readonly", history:"readonly", screen:"readonly", globalThis:"readonly", Intl:"readonly", CustomEvent:"readonly", KeyboardEvent:"readonly", MouseEvent:"readonly", DOMParser:"readonly", XMLSerializer:"readonly", self:"readonly", caches:"readonly", indexedDB:"readonly", Worker:"readonly", WebSocket:"readonly", Audio:"readonly", AudioContext:"readonly", speechSynthesis:"readonly", SpeechSynthesisUtterance:"readonly", open:"readonly", scrollTo:"readonly", devicePixelRatio:"readonly", visualViewport:"readonly", Notification:"readonly", FormData:"readonly", Headers:"readonly", Response:"readonly", Request:"readonly", addEventListener:"readonly", removeEventListener:"readonly", ImageData:"readonly", OffscreenCanvas:"readonly", Buffer:"readonly", CompressionStream:"readonly", DecompressionStream:"readonly", File:"readonly" };

export default [
  { ignores: ["dist/**", "dist-mobile/**", "node_modules/**"] },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    plugins: { "react-hooks": reactHooks },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } }, globals },
    rules: {
      "no-undef": "error", "no-dupe-keys": "error", "no-unreachable": "error", "no-self-assign": "error",
      "no-self-compare": "error", "use-isnan": "error", "no-dupe-else-if": "error", "no-unsafe-optional-chaining": "error",
      "no-duplicate-case": "error", "no-cond-assign": "error", "no-const-assign": "error", "no-func-assign": "error",
      "no-import-assign": "error", "no-dupe-args": "error", "no-unused-private-class-members": "error",
      "react-hooks/rules-of-hooks": "error",
      // missing hook dependencies: a ratchet (npm run lint allows only the reviewed ones that exist today:
      // timer effects for the draft clock, the live game and autosave that must not restart on every change)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
