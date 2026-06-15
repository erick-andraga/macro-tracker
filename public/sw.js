// Service worker for Macro Tracker.
// VERSION is stamped with the git SHA at deploy time so each release produces a
// byte-different file, which is what triggers the browser's update flow.
const VERSION = "__BUILD_ID__";
const CACHE = `mt-${VERSION}`;

self.addEventListener("install", () => {
  // Stay in "waiting" until the user accepts the update (see message handler).
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin — never intercept Supabase / external requests.
  if (url.origin !== self.location.origin) return;

  // Network-first for page navigations so new deploys show up immediately.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(req)) || (await caches.match("./"));
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for same-origin assets (hashed JS/CSS/icons).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE).then((c) => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
