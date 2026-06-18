// obelisk-passport — server-side session verifier (generated, dependency-free).
// Verifies a returned ?obelisk_session token at the IdP. The project holds NO
// secret; the IdP (https://obeliskgate.com) is the only holder of the signing key.
const IDP = process.env.OBELISK_IDP || "https://obeliskgate.com";

export async function verifyObeliskSession(token) {
  if (!token) return { ok: false, reason: "missing-token" };
  try {
    const res = await fetch(IDP.replace(/\/$/, "") + "/auth/verify-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return { ok: false, reason: "idp-" + res.status };
    return await res.json(); // { ok, identityId, identifier }
  } catch (e) {
    return { ok: false, reason: "idp-unreachable:" + e.message };
  }
}
