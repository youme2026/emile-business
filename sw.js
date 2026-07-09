// EMILE BUSINESS GESTION - Service Worker - NO CACHE
const CACHE = 'ebg-v7';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Supprimer TOUS les anciens caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // TOUJOURS aller chercher sur le réseau - jamais de cache
  if (!e.request.url.startsWith('http')) return;
  if (e.request.url.includes('supabase.co')) return;
  
  e.respondWith(
    fetch(e.request).catch(() => {
      // Seulement si hors ligne, essayer le cache
      return caches.match(e.request);
    })
  );
});
