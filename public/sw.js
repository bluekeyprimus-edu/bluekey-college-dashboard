const CACHE_NAME = "bluekey-dashboard-v2";
// Only these are worth caching for offline PWA installability — static,
// never change per-user, never contain student data.
const STATIC_CACHE_PATHS = [
  "/manifest.json",
  "/favicon-32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE_PATHS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// This is a live data dashboard — every page intentionally fetches fresh,
// per-counselor-scoped data on every request (force-dynamic). Earlier this
// handler intercepted and cache-wrote EVERY GET request, including the
// dozens of background RSC prefetch requests Next.js fires for every link
// on a page. That extra cache-write round trip on every single request
// (visible in DevTools as hundreds of ms, some over a second, all
// attributed to sw.js) was the main cause of the app feeling slow.
//
// Now the service worker only touches the small static asset list above
// (cache-first, for offline installability) and otherwise doesn't call
// respondWith at all — every page load, RSC prefetch, and data fetch goes
// straight to the network untouched.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_CACHE_PATHS.includes(url.pathname)) return;

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
