const CACHE = 'dragon-v1';
const MANIFEST = '/dragon-shield-manifest.json';

self.addEventListener('install', e => e.waitUntil(skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(res => res || fetch(e.request))
    )
  );
});

/*  Rule-update flow  */
self.addEventListener('message', async e => {
  if (e.data.type !== 'CHECK_SHIELD') return;
  const manifest = await fetch(MANIFEST).then(r => r.json());
  const expected = await (await fetch('https://dragontools.eth/link/shield')).text();
  if (manifest.hash !== expected) {
    clients.matchAll().then(clients => clients.forEach(c => c.postMessage({type:'SHIELD_MISMATCH'})));
  }
});
