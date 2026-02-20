// ====== SERVICE WORKER — AgroMacro (Online-only, PWA install only) ======
// Sem cache offline — app requer internet para IA e dados em tempo real

var CACHE_NAME = 'agromacro-v33';

// Install — limpa caches antigos e ativa imediatamente
self.addEventListener('install', function (event) {
    console.log('[SW] Instalando v33 (online-only)...');
    event.waitUntil(self.skipWaiting());
});

// Activate — limpa TODOS os caches antigos
self.addEventListener('activate', function (event) {
    console.log('[SW] Ativando v33 — limpando caches offline...');
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.map(function (key) {
                    console.log('[SW] Removendo cache:', key);
                    return caches.delete(key);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Fetch — passa tudo direto para a rede (sem cache)
self.addEventListener('fetch', function (event) {
    event.respondWith(fetch(event.request));
});
