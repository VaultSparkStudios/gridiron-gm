// Offline play. On install it saves every file the game needs (listed in offline.json at build
// time: code, data, logos, icons), so after one visit the game runs with no connection at all.
// The page comes from the network first (a new version is picked up as soon as it's deployed) and
// falls back to the saved copy offline. Built files are versioned by name, so the saved copy is
// used straight away. Matchup portraits are saved as they're shown.
const BASE = new URL('./', self.registration.scope).pathname;
// one store per build (the phone build lives under /mobile/ on the same site)
const CACHE = `gridiron-gm-v3 ${BASE}`;

// Save everything in offline.json. Reports progress to open pages: { type: 'offline', done, total }.
async function saveAll() {
  const res = await fetch(`${BASE}offline.json`, { cache: 'no-store' });
  if (!res.ok) return;
  const { version, files } = await res.json();
  const cache = await caches.open(CACHE);
  const urls = [BASE, ...files.map((f) => BASE + f)];
  let done = 0;
  const tell = async (extra = {}) => { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage({ type: 'offline', done, total: urls.length, version, ...extra }); };
  // a few at a time; skip what's already saved (built files never change under the same name)
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const u = queue.shift();
      const isAsset = u.includes('/assets/');
      if (!(isAsset && await cache.match(u))) {
        try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await cache.put(u, r); } catch { /* try again next visit */ }
      }
      done++;
      if (done % 10 === 0) await tell();
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  await cache.put(`${BASE}__offline-ready`, new Response(JSON.stringify({ version, at: Date.now(), total: urls.length })));
  await tell({ ready: true });
  // drop built files from older versions
  const keep = new Set(urls);
  for (const req of await cache.keys()) if (req.url.includes('/assets/') && !keep.has(new URL(req.url).pathname) && !keep.has(req.url)) await cache.delete(req);
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(saveAll().catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('gridiron-gm') && k !== CACHE && (k.endsWith(` ${BASE}`) || !k.includes(' '))).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// The page can ask for a fresh save (the "Get ready for offline" button) or extra files (your
// team's matchup portraits).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'save-all') e.waitUntil(saveAll().catch(() => {}));
  if (e.data?.type === 'save-urls') e.waitUntil(caches.open(CACHE).then((c) => Promise.all((e.data.urls || []).map((u) => c.match(u).then((hit) => hit || fetch(u).then((r) => r.ok && c.put(u, r)).catch(() => {}))))));
});

const networkFirst = (req) => fetch(req)
  .then((r) => { if (r.ok) { const rc = r.clone(); caches.open(CACHE).then((c) => c.put(req, rc)); } return r; })
  .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match(BASE)));
const cacheFirst = (req) => caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
  if (r.ok) { const rc = r.clone(); caches.open(CACHE).then((c) => c.put(req, rc)); }
  return r;
}));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (!BASE.endsWith('/mobile/') && url.pathname.startsWith(`${BASE}mobile/`)) return; // the phone build's own worker handles it
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === BASE;
  if (isPage || url.pathname.endsWith('offline.json') || url.pathname.endsWith('manifest.json')) e.respondWith(networkFirst(e.request));
  else e.respondWith(cacheFirst(e.request));
});
