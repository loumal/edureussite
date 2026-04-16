// ÉduRéussite — Service Worker
// Cache les assets statiques pour un chargement instantané et un usage hors-ligne partiel.

const CACHE_NAME = "edureussite-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Installation : mise en cache des assets essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network-first pour les pages, Cache-first pour les assets statiques
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes API, tRPC ou auth
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/trpc/") ||
    url.pathname.startsWith("/_next/") ||
    request.method !== "GET"
  ) {
    return;
  }

  // Assets statiques (_next/static, fonts, images) → Cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Pages HTML → Network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
