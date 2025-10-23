const CACHE_NAME = "gastroelite-cache-v1";
const urlsToCache = [
  "/",
  "/login",
  "/register",
  "/recipes",
  "/account",
  "/add",
  "/company",
  "/admin",
  "/manifest.json",
  "/favicon.svg",
  "/logo.svg"
];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("Service Worker: Cache failed", error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log("Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log("Service Worker: Serving from cache", event.request.url);
          return response;
        }

        console.log("Service Worker: Fetching from network", event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page for navigation requests
            if (event.request.destination === "document") {
              return caches.match("/");
            }
          });
      })
  );
});

// Handle background sync
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag);
  // Handle background sync tasks here if needed
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received");
  // Handle push notifications here if needed
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification click received");
  event.notification.close();
  // Handle notification clicks here if needed
});







