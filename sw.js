```javascript
const CACHE_NAME = 'plan-financeiro-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest'
];

// Evento de Instalação: Salva em cache os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cache aberto com sucesso.');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Ativa o Service Worker imediatamente
  self.skipWaiting();
});

// Evento de Ativação: Limpa caches antigos, se houver
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Cache-First: Tenta buscar do cache, senão vai para a rede e atualiza
self.addEventListener('fetch', (event) => {
  // Ignora chamadas de APIs externas dinâmicas ou não-estáticas (como envio de analíticos)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdn') && !event.request.url.includes('unpkg')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna o cache de forma ultra rápida
        return cachedResponse;
      }

      // Se não estiver em cache, busca na internet
      return fetch(event.request).then((networkResponse) => {
        // Valida se a resposta é válida antes de colocar em cache
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Duplica a resposta para salvar uma cópia em cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Caso falhe tudo (offline e sem cache), podemos redirecionar ou servir index.html
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});

```
