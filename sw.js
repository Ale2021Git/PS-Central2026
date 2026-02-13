// Service Worker - Escala PS Central 2026
// Versão: 3.0
const CACHE_NAME = 'escala-ps-central-v3';

// Assets para cachear na instalação
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-192x192.png',
  './icon-384x384.png',
  './icon-512x512.png',
  './maskable_icon_x192.png',
  './maskable_icon_x512.png'
];

// URLs externas (Google Fonts)
const EXTERNAL_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

// ===== INSTALAÇÃO =====
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando versão:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        
        // Cachear assets locais
        const localPromises = ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn('[Service Worker] Falha ao cachear:', url, err);
          });
        });
        
        // Cachear URLs externas (Google Fonts)
        const externalPromises = EXTERNAL_URLS.map(url => {
          return fetch(url, { mode: 'no-cors' })
            .then(response => cache.put(url, response))
            .catch(err => {
              console.warn('[Service Worker] Falha ao cachear fonte:', url, err);
            });
        });
        
        return Promise.all([...localPromises, ...externalPromises]);
      })
      .then(() => {
        console.log('[Service Worker] Todos os assets foram cacheados');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] Erro na instalação:', err);
      })
  );
});

// ===== ATIVAÇÃO =====
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando versão:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove caches antigos
              return cacheName.startsWith('escala-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Cache antigo removido');
        return self.clients.claim();
      })
      .catch(err => {
        console.error('[Service Worker] Erro na ativação:', err);
      })
  );
});

// ===== FETCH - ESTRATÉGIA CACHE FIRST =====
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se encontrou no cache, retorna
        if (cachedResponse) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return cachedResponse;
        }
        
        // Se não encontrou, busca na rede
        console.log('[Service Worker] Buscando da rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Só cachear respostas válidas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }
            
            // Cachear apenas requisições GET
            if (event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Adicionado ao cache:', event.request.url);
              });
            }
            
            return networkResponse;
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Erro no fetch:', error);
        
        // Fallback para navegação offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        
        // Para outros tipos de requisição, retorna uma resposta de erro
        return new Response('Offline - Recurso não disponível no cache', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// ===== MENSAGENS =====
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache limpo');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('[Service Worker] Script carregado');
