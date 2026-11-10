// Offline play: the game saves itself on this device (see public/sw.js) so it runs with no
// connection, like on a plane. This panel shows whether it's ready, saves it on demand (plus your
// team's field sprites), and explains how to install it as an app.
import React, { useEffect, useState } from "react";
import { C, Btn } from "./ui.jsx";

const BASE = import.meta.env.BASE_URL;
const CACHE = `gridiron-gm-v3 ${BASE}`;

// The browser's "install this app" offer (Chrome, Edge, Android) is caught early in main.jsx.
const installPrompt = () => window.__installPrompt || null;
const isInstalled = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}

// A small "Offline" tag for the top bar.
export function OfflineChip() {
  const on = useOnline();
  if (on) return null;
  return <span title="No connection. Everything works; your game saves on this device." style={{ fontSize: 12, fontWeight: 800, color: "#fde68a", background: "#78350f66", border: "1px solid #b453092e", borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap" }}>Offline</span>;
}

async function readyInfo() {
  try {
    if (!("caches" in window)) return null;
    const hit = await caches.match(`${BASE}__offline-ready`, { cacheName: CACHE });
    return hit ? await hit.json() : null;
  } catch { return null; }
}

export default function OfflinePanel({ teamAb, mobile }) {
  const online = useOnline();
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator && "caches" in window;
  const [ready, setReady] = useState(null); // { version, at, total } once saved
  const [latest, setLatest] = useState(null); // the version on the site now
  const [prog, setProg] = useState(null); // { done, total } while saving
  const [canInstall, setCanInstall] = useState(!!installPrompt());

  useEffect(() => {
    readyInfo().then(setReady);
    if (navigator.onLine) fetch(`${BASE}offline.json`, { cache: "no-store" }).then((r) => r.ok && r.json()).then((d) => d && setLatest(d.version)).catch(() => {});
    const onMsg = (e) => {
      if (e.data?.type !== "offline") return;
      setProg(e.data.ready ? null : { done: e.data.done, total: e.data.total });
      if (e.data.ready) readyInfo().then(setReady);
    };
    const onPrompt = () => setCanInstall(true);
    navigator.serviceWorker?.addEventListener("message", onMsg);
    window.addEventListener("gm-install-ready", onPrompt);
    return () => { navigator.serviceWorker?.removeEventListener("message", onMsg); window.removeEventListener("gm-install-ready", onPrompt); };
  }, []);

  const saveNow = async () => {
    if (!supported) return;
    setProg({ done: 0, total: 1 });
    const reg = await navigator.serviceWorker.register(`${BASE}sw.js`).catch(() => null);
    const sw = (await navigator.serviceWorker.ready.catch(() => reg))?.active;
    if (!sw) { setProg(null); return; }
    sw.postMessage({ type: "save-all" });
    // your own team's player art and field sprites (the rest is saved as it's shown)
    if (teamAb) sw.postMessage({ type: "save-urls", urls: [`${BASE}sprites/${teamAb}.webp`] });
  };
  // every club's player art too (about 60 MB), so every screen shows its art offline
  const [artDone, setArtDone] = useState(false);
  const saveArt = async () => {
    const d = await fetch(`${BASE}offline.json`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    const sw = (await navigator.serviceWorker.ready.catch(() => null))?.active;
    if (!d?.art?.length || !sw) return;
    sw.postMessage({ type: "save-urls", urls: d.art.map((f) => BASE + f) });
    setArtDone(true);
  };
  const install = async () => {
    const p = installPrompt();
    if (!p) return;
    p.prompt();
    try { await p.userChoice; } catch { /* dismissed */ }
    window.__installPrompt = null; setCanInstall(false);
  };

  const current = ready && (!latest || ready.version === latest);
  const box = { background: "#ffffff0d", borderRadius: 18, padding: mobile ? 12 : 16, marginBottom: 14 };
  const step = { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.45, marginTop: 8 };
  const n = (x) => <span style={{ flex: "0 0 22px", height: 22, borderRadius: 11, background: "#1e3a5f", color: "#93c5fd", fontWeight: 900, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{x}</span>;

  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.mt }}>Offline play</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {!supported ? "This browser can't keep the game for offline play" : prog ? `Saving the game to this device… ${Math.round((prog.done / Math.max(1, prog.total)) * 100)}%` : current ? "✓ Ready to play with no connection" : ready ? "Saved, but there's a newer version: save it again" : "Not saved for offline yet"}
          </div>
        </div>
        {supported && online && !prog && <Btn onClick={saveNow} bg={current ? "#1e293b" : C.gn} c={current ? "#cbd5e1" : "#fff"} style={{ fontSize: 14, padding: "8px 14px" }}>{current ? "Save again" : "Get ready for offline"}</Btn>}
      </div>
      {prog && <div style={{ height: 6, background: "#ffffff14", borderRadius: 3, marginTop: 10 }}><div style={{ width: `${(prog.done / Math.max(1, prog.total)) * 100}%`, height: "100%", background: C.gn, borderRadius: 3, transition: "width .3s" }} /></div>}
      {supported && <div style={{ marginTop: 10, color: "#cbd5e1" }}>
        <div style={step}>{n(1)}<span>While you're online, open the game once (that's it on most browsers: it saves itself), or press <b>Get ready for offline</b> to be sure. It's about 10 MB, plus your team's players on the field.</span></div>
        <div style={step}>{n(2)}<span>{isInstalled() ? "It's installed as an app on this device. Open it from your home screen or app list." : canInstall ? <>Install it as an app so it opens like one, even in airplane mode: <Btn onClick={install} bg={C.bl} style={{ fontSize: 14, padding: "4px 10px", marginLeft: 4 }}>Install app</Btn></> : isIOS() ? <>On iPhone or iPad: tap Safari's <b>Share</b> button, then <b>Add to Home Screen</b>. Open it from there.</> : <>Install it as an app: in Chrome or Edge, use the install icon in the address bar (or the menu: <b>Install Football GM</b>). On Android: menu ⋮ → <b>Add to Home screen</b>.</>}</span></div>
        <div style={step}>{n(3)}<span>Offline, open the game from that icon (or the same web address in the same browser). Your saves live on this device and keep working; export a save file from the Saves screen to back one up or move it to another device.</span></div>
        <div style={{ fontSize: 12, color: "#fde68a", marginTop: 10 }}>Added it to your home screen before version 2.58 and the icon opens a GitHub 404 page? That older icon points to an address the game no longer uses. Delete it from your home screen and add it again from this page.</div>
        <div style={{ fontSize: 12, color: C.mt, marginTop: 10 }}>Offline you'll miss only the online extras: the global leaderboard and sharing. Player artwork shows once it has been seen online (a team badge or face stands in until then){online && ready ? <> — or <button onClick={saveArt} disabled={artDone} style={{ background: "none", border: "none", color: artDone ? C.gn : "#93c5fd", textDecoration: artDone ? "none" : "underline", cursor: artDone ? "default" : "pointer", font: "inherit", padding: 0 }}>{artDone ? "saving every team's artwork ✓" : "save every team's artwork now (about 60 MB)"}</button></> : null}.</div>
      </div>}
    </div>
  );
}
