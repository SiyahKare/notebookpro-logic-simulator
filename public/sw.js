const CACHE_NAME = 'notebookpro-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-72.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const CACHEABLE_PATH_PREFIXES = [
  '/assets/',
  '/icons/',
  '/screenshots/'
];

const CACHEABLE_EXACT_PATHS = new Set([
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-72.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]);

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  const isCacheableAsset =
    CACHEABLE_EXACT_PATHS.has(url.pathname) ||
    CACHEABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

  if (!isCacheableAsset) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      const networkResponse = await fetch(event.request);

      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        }).catch(() => {});
      }

      return cachedResponse || networkResponse;
    }).catch((err) => {
      console.error(`SW fetch failed for: ${event.request.url}`, err);
      return caches.match(event.request);
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Yeni bildiriminiz var',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'NotebookPro', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
