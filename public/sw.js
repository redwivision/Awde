// Awde Service Worker — weak-wifi / offline friendliness.
//
// Strategy:
//   - CACHE (app shell): index.html + manifest + favicon, cached on install.
//   - Documents: handle via a network-first with cache fallback so the SPA
//     still opens from cache when the user is offline.
//   - Static assets (hashed JS/CSS): cache-first, so repeat visits are instant
//     on weak connections. Unknown / API requests are never cached (left to the
//     browser's normal behavior) except assets we can safely cache.
//
// The app's AI endpoints are server-side and can't work truly offline, but the
// UI shell and your latest lesson state (localStorage) remain usable.

const SHELL_CACHE = 'awde-shell-v2';
const ASSET_CACHE = 'awde-assets-v2';
const SHELL_URLS = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin (e.g. Gemini API, Google Fonts).
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  // Never try to cache the API endpoints.
  if (url.pathname.startsWith('/api/')) return;

  // App documents (SPA navigations): network-first, cache fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('./index.html', clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache-first (fast repeat loads on weak wifi).
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((res) => {
          if (res.ok && url.pathname.includes('/assets/')) {
            const clone = res.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
    )
  );
});