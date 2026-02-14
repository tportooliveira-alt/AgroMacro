// ====== SERVICE WORKER — AgroMacro PWA Offline ======
var CACHE_NAME = 'agromacro-v8';
var ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/js/data.js',
    '/js/lotes.js',
    '/js/financeiro.js',
    '/js/estoque.js',
    '/js/manejo.js',
    '/js/pastos.js',
    '/js/rebanho.js',
    '/js/obras.js',
    '/js/funcionarios.js',
    '/js/icons.js',
    '/js/indicadores.js',
    '/js/rebanho-ops.js',
    '/js/pasto-mgmt.js',
    '/js/calendario.js',
    '/js/contas.js',
    '/js/cabecas.js',
    '/js/graficos.js',
    '/js/relatorio.js',
    '/js/clima.js',
    '/js/nutricao.js',
    '/js/balanca.js',
    '/js/blockchain.js',
    '/js/rastreabilidade.js',
    '/js/fotos.js',
    '/seed-data.js'
];

// Install — cache all assets
self.addEventListener('install', function (event) {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[SW] Caching assets');
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// Activate — clean old caches
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME;
                }).map(function (key) {
                    console.log('[SW] Removing old cache:', key);
                    return caches.delete(key);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Fetch — cache-first for app assets, network-first for external (Chart.js CDN)
self.addEventListener('fetch', function (event) {
    var url = event.request.url;

    // Network-first for CDN resources (Chart.js)
    if (url.indexOf('cdn.jsdelivr.net') > -1) {
        event.respondWith(
            fetch(event.request).then(function (response) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(function () {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Cache-first for local assets
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) return cached;
            return fetch(event.request).then(function (response) {
                // Cache successful responses
                if (response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        }).catch(function () {
            // Fallback for navigation requests
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
