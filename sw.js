const CACHE_NAME = 'escala-dr-armando-v3'; // Versão atualizada

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './maskable_icon_x192.png', // Adicionado
  './maskable_icon_x512.png', // Adicionado
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos map para tentar cachear um por um e não quebrar tudo se um falhar
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.error('Falha ao cachear:', url, err));
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação (Limpeza)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch (Cache First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Só faz cache dinâmico de requests GET seguros
          if (event.request.url.startsWith('http') && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});

