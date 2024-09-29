/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'farming-app-cache';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/index.html', '/icon.png', '/weather-api']);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
