const CACHE_NAME = 'uruexplorer-cache-v4.54';
const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './app.js',
  './destinos.js',
  './eventos.js',
  './logo.png',
  './favicon.png',
  './icono uruexplorer.png'
];

// Install Event: Cache app shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network falling back to Cache (except for Google Sheets dynamic data)
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  
  // Bypass cache for dynamic Google Sheets scripts / API requests
  if (url.includes('docs.google.com') || url.includes('google-analytics.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For other requests: Cache-First falling back to Network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Only cache successful GET responses for assets
        if (e.request.method === 'GET' && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback offline handler if needed
      });
    })
  );
});
