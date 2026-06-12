// What's Simmering? service worker — v1
// Strategies:
//   • App shell (navigations)  → network-first, fall back to cached /
//   • Static assets (.js/.css/.png/…) → cache-first
//   • /api/mains, /api/sides, /api/pantry → stale-while-revalidate (24 h)
//   • All other API calls → network only (never cache auth / plan mutations)

const CACHE = 'simmer-v1';
const API_SWR = ['/api/mains', '/api/sides', '/api/pantry', '/api/marketplace'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Only intercept same-origin GET
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Never intercept auth routes
  if (url.pathname.startsWith('/auth')) return;

  // Dish/pantry reads — stale-while-revalidate
  if (API_SWR.some(p => url.pathname.startsWith(p))) {
    e.respondWith(swrHandler(request));
    return;
  }

  // Skip other /api/ calls (plan mutations, grocery list POST, etc.)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests — network-first, fallback to shell
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => { putCache(request, res.clone()); return res; })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // Static assets — cache-first
  if (/\.(js|css|woff2?|png|svg|ico|webmanifest|json)$/.test(url.pathname)) {
    e.respondWith(cacheFirstHandler(request));
  }
});

async function swrHandler(request) {
  const cache  = await caches.open(CACHE);
  const cached = await cache.match(request);
  // Fire revalidation in background
  const fresh  = fetch(request)
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => null);
  return cached || await fresh;
}

async function cacheFirstHandler(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  putCache(request, res.clone());
  return res;
}

function putCache(request, response) {
  if (!response || !response.ok) return;
  caches.open(CACHE).then(c => c.put(request, response));
}
