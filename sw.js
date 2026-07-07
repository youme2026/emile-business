// EMILE BUSINESS GESTION - Service Worker v4
const CACHE = 'ebg-v4';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(ASSETS.map(url => c.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Ignorer les extensions et protocoles non-http
  if (!e.request.url.startsWith('http')) return;
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('unpkg.com')) return;
  if (e.request.url.includes('chrome-extension')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          try {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
          } catch(err) {}
        }
        return response;
      }).catch(() => cached || new Response('Hors ligne', {status: 503}));
      return cached || fetchPromise;
    })
  );
});
