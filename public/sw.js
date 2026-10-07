// JabangStore service worker
//
// Scope: caches the app shell (HTML/JS/CSS/icons) ONLY, so the app can
// install as a PWA and still load its own UI while offline. It never
// touches Supabase (auth/REST/storage/realtime) or any other cross-origin
// request -- those always go straight to the network untouched, so the
// app's own offline-sale-queueing logic (already built into the app)
// keeps working exactly as before. This worker does not know or care
// about POS, sales, or any app data; it only serves static files.

const CACHE_VERSION = 'jabangstore-shell-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      try {
        await cache.addAll(APP_SHELL);

        // Vite's JS/CSS bundle filenames are content-hashed and unknown
        // ahead of time, so they can't be hardcoded above. Fetch the
        // current index.html fresh and pull the real asset URLs out of
        // it, so the actual bundle is cached from the very first visit
        // instead of relying on the browser's separate HTTP cache (which
        // may not be warm on a different device, or may get evicted).
        const htmlResponse = await fetch('/index.html', { cache: 'no-store' });
        const html = await htmlResponse.text();
        const assetUrls = Array.from(
          html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)
        ).map((match) => match[1]);

        if (assetUrls.length) {
          await cache.addAll(assetUrls);
        }
      } catch {
        // A slow/offline first install shouldn't block registration --
        // the runtime cache-and-store logic in the fetch handler below
        // will still pick these assets up the next time they're fetched.
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept anything cross-origin (Supabase auth/REST/storage,
  // Google Fonts, etc.) or any non-GET request. This is the critical
  // safety boundary: POS checkout, auth, and all Supabase calls always
  // go straight to the network, completely untouched by this worker.
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  // Full-page navigations (typing a URL, reloading, opening the installed
  // app): try the network first so users get the latest build when
  // online, but fall back to the cached app shell when offline so the
  // app still opens instead of showing a browser error page. The app's
  // own online/offline UI takes over from there.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (hashed JS/CSS bundles, icons, manifest): cache-first,
  // and cache whatever we fetch from the network so the next offline
  // load has it too. Vite's bundle filenames change per build, so this
  // runtime approach picks them up automatically without hardcoding
  // hashed names into the service worker.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
