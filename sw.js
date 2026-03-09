const CACHE_NAME = 'ps-central-v13';

// Ativos que devem ser instalados imediatamente
const PRE_CACHE_ASSETS = [
  'index.html',
  'manifest.json',
  'maskable_icon_x192.png',
  'maskable_icon_x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cacheando ativos essenciais...');
      return Promise.all(
        PRE_CACHE_ASSETS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) return cache.put(url, response);
            throw new Error(`Falha ao baixar ${url}`);
          }).catch(err => console.warn('Erro no pre-cache:', url, err));
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação: Limpa versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Ignora Google Analytics para não dar erro offline
  if (event.request.url.includes('google-analytics') || event.request.url.includes('gtag')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se estiver offline e tentar navegar, entrega o index.html
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});

