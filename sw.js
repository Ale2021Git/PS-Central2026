const CACHE_NAME = 'ps-central-v2026-v1';
const ASSETS = [
  '/PS-Central2026/',
  '/PS-Central2026/index.html',
  '/PS-Central2026/manifest.json',
  '/PS-Central2026/maskable_icon_x192.png',
  '/PS-Central2026/maskable_icon_x512.png'
];

// Instalação: Salva arquivos no cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos e assume o controle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Serve os arquivos do cache quando offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

