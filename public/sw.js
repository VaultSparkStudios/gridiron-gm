const CACHE = 'gridiron-gm-v1';
const STATIC = [
  '/gridiron-gm/',
  '/gridiron-gm/index.html',
  '/gridiron-gm/manifest.json',
  '/gridiron-gm/images/cover.png',
  '/gridiron-gm/images/icon.svg',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle same-origin GET requests
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for JS/CSS chunks (versioned), cache-first for everything else
  const isChunk = url.pathname.includes('/assets/');
  if (isChunk) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const rc = r.clone(); caches.open(CACHE).then(c => c.put(e.request, rc)); return r; })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
