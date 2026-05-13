/**
 * CCC Bible Tracker — Service Worker
 * Version: 3.0
 *
 * Strategy: Cache-first for all app assets (app works fully offline).
 * On activation, old cache versions are purged automatically.
 */

const CACHE_NAME = 'ccc-bible-tracker-v3.0';

const PRECACHE_ASSETS = [
  './CCC_Bible_Tracker_V3.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-167.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
];

// ── Install: pre-cache all assets ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

// ── Activate: purge stale caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())  // take control of open tabs immediately
  );
});

// ── Fetch: cache-first, network fallback ───────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests; skip non-http(s) schemes (chrome-extension://, etc.)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!['http:', 'https:'].includes(url.protocol)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then(response => {
        // Only cache valid same-origin responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      });
    }).catch(() => {
      // Offline and not cached — return the main HTML as fallback
      return caches.match('./CCC_Bible_Tracker_V3.html');
    })
  );
});
