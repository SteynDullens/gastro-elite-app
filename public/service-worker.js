/**
 * Legacy URL: browsers may still request /service-worker.js after unregister.
 * This worker never caches HTML or JS bundles — network-only — so stale deploy
 * chunks cannot occur if anything registers it by mistake.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;
  event.respondWith(fetch(event.request));
});
