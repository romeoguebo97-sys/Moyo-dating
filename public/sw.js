const CACHE_NAME = 'moyo-v15';
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

// ── Réception d'une notification PUSH (fonctionne même app fermée) ──
// Le serveur (Edge Function Supabase) envoie un payload JSON : { title, body, url, icon }
self.addEventListener('push', (event) => {
  let data = {
    title: 'Moyo',
    body: 'Vous avez une nouvelle notification.',
    url: '/',
    icon: '/favicon.png',
  };
  try {
    if (event.data) {
      const payload = event.data.json();
      data = Object.assign(data, payload);
    }
  } catch (e) {
    // Si le payload n'est pas du JSON, on l'utilise comme simple texte
    try { if (event.data) data.body = event.data.text(); } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.png',
      badge: '/favicon.png',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

// ── Clic sur la notification : réactiver l'app ou l'ouvrir ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre Moyo est déjà ouverte, on la met au premier plan
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl !== '/') {
            try { client.navigate(targetUrl); } catch (_) {}
          }
          return;
        }
      }
      // Sinon on ouvre une nouvelle fenêtre
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
