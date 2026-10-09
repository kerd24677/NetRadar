const CACHE_NAME = "netradar-shell-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event: Pre-cache core application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("NetRadar SW pre-cache partial warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first with cache fallback for shell assets.
// CRITICAL: NEVER cache diagnostics queries, API calls, or DoH resolver responses!
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Never intercept or cache non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // 2. Never cache NetRadar API endpoints (/api/*)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 3. Never cache external probes or DoH resolver queries
  if (url.origin !== self.location.origin) {
    return;
  }

  // 4. Never cache diagnostic cache-busting requests
  if (url.searchParams.has("_netradar_t")) {
    return;
  }

  // Handle navigation and static assets
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/").then((response) => {
          return response || fetch(event.request);
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for static local assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
