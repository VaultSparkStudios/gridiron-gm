// obelisk-passport — themed login component (generated, type=game).
// Drop into your app; render at your unauthenticated route. Dependency-free
// (plain DOM + the Obelisk client script). Works in any React/Vite SPA.
import { useEffect, useRef } from "react";
const IDP = "https://obeliskgate.com";
export function ObeliskLogin({ project = "Gridiron GM", tier = "T4", returnUrl }) {
  const ref = useRef(null);
  useEffect(() => {
    const ret = returnUrl || (location.origin + "/auth/callback");
    const s = document.createElement("script");
    s.src = IDP + "/auth-client.js";
    s.dataset.obeliskIdp = IDP; s.dataset.obeliskProject = project;
    s.dataset.obeliskTier = tier; s.dataset.obeliskReturn = ret;
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [project, tier, returnUrl]);
  return (
    <div ref={ref} className="obelisk-passport" style={{ maxWidth: 380, margin: "0 auto", padding: 28, borderRadius: 16, background: "#0b0f17", color: "#e6edf3", textAlign: "center" }}>
      <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", opacity: .6 }}>{project}</div>
      <h1 style={{ fontSize: 22, margin: "10px 0 6px" }}>Play — Sign in</h1>
      <p style={{ opacity: .7, fontSize: 14, margin: "0 0 22px" }}>One account. Every VaultSpark game. Your progress, carried.</p>
      <button data-obelisk-signin style={{ width: "100%", padding: 13, border: 0, borderRadius: 10, background: "#f5c542", color: "#001018", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Play — Sign in</button>
      <button data-obelisk-signup style={{ width: "100%", padding: 12, marginTop: 10, border: "1px solid #ff5d8f", borderRadius: 10, background: "transparent", color: "inherit", fontSize: 14, cursor: "pointer" }}>Create your player account</button>
      <button data-obelisk-recover style={{ marginTop: 14, border: 0, background: "none", color: "inherit", opacity: .6, fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>Can't sign in? Recover access</button>
      <div style={{ marginTop: 14, fontSize: 11, opacity: .45 }}>Secured by Obelisk · passwordless · lost your device? recover with a backup code</div>
    </div>
  );
}
