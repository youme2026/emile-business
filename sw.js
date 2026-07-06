// EMILE BUSINESS - Service Worker v2
// Gestion hors ligne complète

const CACHE_NAME = 'emile-business-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Installation - mettre en cache les assets
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, {mode: 'no-cors'});
        })).catch(err => console.log('Cache error:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activation - nettoyer anciens caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('SW: Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => clients.claim())
  );
});

// Fetch - stratégie Network First avec fallback cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes Supabase (pas de cache)
  if (event.request.url.includes('supabase.co')) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Hors ligne - utiliser le cache
        return caches.match(event.request)
          .then(cached => {
            if (cached) {
              // Notifier l'app qu'on est hors ligne
              self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({type: 'OFFLINE'}));
              });
              return cached;
            }
            // Page de fallback hors ligne
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Message depuis l'app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});