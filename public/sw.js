const CACHE_NAME = 'moyo-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
];

// Installation — mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — stratégie Network First (toujours les données fraîches)
// Si pas de réseau → fallback sur le cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes Supabase (toujours en ligne)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les assets statiques réussis
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → retourner depuis le cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback sur la page principale
          return caches.match('/');
        });
      })
  );
});
