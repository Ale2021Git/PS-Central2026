const CACHE_NAME = 'escala-2026-v1';

// Ativos que devem ser instalados imediatamente
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './maskable_icon_x192.png',
  './maskable_icon_x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap',
  'https://fonts.symbols.google.com/css?family=Material+Symbols+Outlined'
];

// Instalação: Salva os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Abrindo cache e armazenando ativos estáticos');
      return Promise.all(
        PRE_CACHE_ASSETS.map(url => {
          return cache.add(url).catch(err => console.error('Falha ao cachear:', url, err));
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação: Limpa caches antigos de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia Cache-First (Tenta cache, se não tiver, busca na rede)
self.addEventListener('fetch', (event) => {
  // Ignora métodos que não sejam GET (como POST de formulários)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se encontrar no cache, retorna ele
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não, busca na rede
      return fetch(event.request).then((networkResponse) => {
        // Valida se a resposta é útil para ser salva
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
          return networkResponse;
        }

        // Clona a resposta para salvar uma cópia no cache dinâmico
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se a rede falhar e for uma navegação de página, retorna o index.html (Offline Fallback)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

