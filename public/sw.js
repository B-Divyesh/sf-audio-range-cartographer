const VERSION = 'arc-v2';
const SHELL = [
  '/', '/index.html', '/offline.html', '/privacy/', '/terms/', '/manifest.webmanifest', '/icon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  '/assets/range-landscape-768.webp', '/assets/range-landscape-1200.webp',
  '/assets/range-landscape-768.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      const cacheKey = url.pathname === '/' ? '/index.html' : event.request;
      caches.open(VERSION).then((cache) => cache.put(cacheKey, copy));
      return response;
    }).catch(async () => (await caches.match(event.request)) || (url.pathname === '/' ? caches.match('/index.html') : null) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && ['style', 'script', 'image', 'font'].includes(event.request.destination)) {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
