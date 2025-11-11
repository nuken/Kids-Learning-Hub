// sw.js (a minimal service worker)
self.addEventListener('fetch', (event) => {
  // You can add caching logic here later
  event.respondWith(fetch(event.request));
});