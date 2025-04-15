// Service Worker für den Balancetest Calculator
const CACHE_NAME = 'balancetest-calc-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Installation - Cache alle Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung - Lösche alte Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch-Strategie: Cache First, dann Netzwerk
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache Hit - return response
        if (response) {
          return response;
        }

        // Cache Miss - hole vom Netzwerk
        return fetch(event.request)
          .then(response => {
            // Prüfe ob gültige Antwort
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Klone die Antwort, da sie nur einmal verwendet werden kann
            const responseToCache = response.clone();

            // Speichere im Cache für zukünftige Offline-Nutzung
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Wenn Netzwerk fehlschlägt und wir eine HTML-Anfrage haben,
            // liefere die Offline-Seite aus dem Cache
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});
