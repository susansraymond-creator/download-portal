// Minimal service worker for koreandramalink.
// Chrome/Edge/Android require a registered service worker with a fetch
// handler before they fire the beforeinstallprompt event, which the
// install pill relies on. This worker is intentionally tiny and safe:
// it never caches HTML/API responses, so admins always see fresh data.
const CACHE = "kdl-static-v1";
const PRECACHE = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  event.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GETs.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache HTML or API/admin traffic — always go to network so
  // content changes and admin edits are always fresh.
  const isHtml =
    event.request.headers.get("accept")?.includes("text/html") || event.request.mode === "navigate";
  if (isHtml || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) {
    return;
  }

  // Cache-first for static assets only (icons, fonts, build chunks).
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
