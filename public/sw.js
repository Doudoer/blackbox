// Minimal Service Worker for PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // basic fetch pass-through to allow PWA installability
    event.respondWith(fetch(event.request));
});
