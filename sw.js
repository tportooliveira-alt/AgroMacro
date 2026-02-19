// ====== SERVICE WORKER — AgroMacro PWA Offline ======
var CACHE_NAME = 'agromacro-v24';
var TILE_CACHE = 'agromacro-tiles-v1';
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
    '/js/fazenda-data.js',
    '/js/mapa.js',
    '/js/ia-consultor.js',
    '/js/ux-helpers.js',
    '/js/resultados.js'
];

// Domínios de tiles para cachear offline
var TILE_DOMAINS = [
    'server.arcgisonline.com',   // Esri satellite
    'tile.openstreetmap.org'     // OSM fallback
];

// Install — cache all assets
self.addEventListener('install', function (event) {
    console.log('[SW] Installing v20...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[SW] Caching assets');
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// Activate — clean old caches (keep tile cache)
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating v20...');
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME && key !== TILE_CACHE;
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

// Helper: check if URL is a map tile
function isTileRequest(url) {
    for (var i = 0; i < TILE_DOMAINS.length; i++) {
        if (url.indexOf(TILE_DOMAINS[i]) > -1) return true;
    }
    return false;
}

// Fetch handler
self.addEventListener('fetch', function (event) {
    var url = event.request.url;

    // ══ MAP TILES: Stale-while-revalidate (offline-first) ══
    // Tiles já vistos ficam em cache para uso offline
    if (isTileRequest(url)) {
        event.respondWith(
            caches.open(TILE_CACHE).then(function (cache) {
                return cache.match(event.request).then(function (cached) {
                    var fetchPromise = fetch(event.request).then(function (response) {
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(function () {
                        return cached; // Offline: usa cache
                    });
                    return cached || fetchPromise; // Cache primeiro, atualiza em background
                });
            })
        );
        return;
    }

    // ══ CDN Resources (Chart.js, Leaflet): Network-first, cache fallback ══
    if (url.indexOf('cdn.jsdelivr.net') > -1 || url.indexOf('unpkg.com') > -1 ||
        url.indexOf('cdnjs.cloudflare.com') > -1) {
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

    // ══ Local assets: Network-first, cache fallback ══
    event.respondWith(
        fetch(event.request).then(function (response) {
            if (response.status === 200) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, clone);
                });
            }
            return response;
        }).catch(function () {
            return caches.match(event.request).then(function (cached) {
                if (cached) return cached;
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

