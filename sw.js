/* Math Quest service worker - makes the app work with no internet.
   Strategy (from math-kids-offline-context.md):
   - app files: cache-first, in a versioned cache
   - content/index.json: network-first, falls back to the saved copy
   - lesson files: stale-while-revalidate (show saved now, refresh in the background)
   - anything else / failed page load: offline.html
   Bump VERSION on every release. Old caches are deleted when the new one activates. */
const VERSION = 'mathquest-v7';

const SHELL = [
  'index.html',
  'offline.html',
  'privacy.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/storage.js',
  'js/audio.js',
  'js/subjects.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // 'reload' skips the browser's own cache so we never save an old copy by mistake
    await Promise.all(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    // Lesson files are small, so save them all now. A missing one never blocks the install.
    try {
      const res = await fetch('content/index.json', { cache: 'reload' });
      await cache.put('content/index.json', res.clone());
      const index = await res.json();
      const files = ['content/facts.json'].concat(index.weeks.map((w) => 'content/' + w.file));
      await Promise.all(files.map((f) => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    } catch (e) { /* offline during install: the app will retry on the next visit */ }
    // Class levels (Pre-School to Class 4) for offline practice and mock tests
    try {
      const lres = await fetch('content/levels/index.json', { cache: 'reload' });
      await cache.put('content/levels/index.json', lres.clone());
      const lidx = await lres.json();
      await Promise.all(lidx.levels.map((l) => cache.add(new Request('content/' + l.file, { cache: 'reload' })).catch(() => {})));
    } catch (e) { /* retried on a later visit */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('mathquest-') && n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;            // never touch POST or anything with personal data
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(pageLoad(req));
    return;
  }
  if (url.pathname.endsWith('/content/index.json')) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (url.pathname.indexOf('/content/') !== -1) {
    // the app asks for a fresh copy with cache:'reload' when it knows new content exists
    if (req.cache === 'reload' || req.cache === 'no-cache') event.respondWith(networkFirst(req));
    else event.respondWith(staleWhileRevalidate(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});

async function pageLoad(req) {
  const cache = await caches.open(VERSION);
  const saved = (await cache.match(req, { ignoreSearch: true })) || (await cache.match('index.html'));
  if (saved) return saved;
  try { return await fetch(req); }
  catch (e) { return (await cache.match('offline.html')) || Response.error(); }
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match('offline.html')) || Response.error();
  }
}

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const refresh = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (hit) return hit;
  const fresh = await refresh;
  return fresh || Response.error();
}
