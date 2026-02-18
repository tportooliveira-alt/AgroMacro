// ====== MAPA.JS — Mapa Interativo de Pastos (Leaflet + Esri) ======
window.mapa = {
    map: null,
    polygons: [],
    drawControl: null,
    drawnItems: null,
    STORAGE_KEY: 'agromacro_mapa_pastos',

    init: function () {
        // Will be initialized when view-mapa is shown
    },

    // ── Inicializar o mapa Leaflet ──
    renderMap: function () {
        var container = document.getElementById('mapa-container');
        if (!container) return;

        // Se já existe, destruir e recriar
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Coordenada padrão: centro do Brasil (será ajustada quando tiver polígonos)
        var defaultLat = -14.235;
        var defaultLng = -51.925;
        var defaultZoom = 5;

        // Tenta pegar localização do usuário
        var savedCenter = this.getSavedCenter();
        if (savedCenter) {
            defaultLat = savedCenter.lat;
            defaultLng = savedCenter.lng;
            defaultZoom = savedCenter.zoom || 15;
        }

        this.map = L.map('mapa-container', {
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLat, defaultLng], defaultZoom);

        // Controle de zoom no canto direito
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // ── Camadas de mapa ──
        var esriSatellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { maxZoom: 19 }
        );

        var esriLabels = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            { maxZoom: 19, opacity: 0.6 }
        );

        var osm = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { maxZoom: 19 }
        );

        // Padrão: satélite + labels
        esriSatellite.addTo(this.map);
        esriLabels.addTo(this.map);

        // Controle de camadas
        var baseMaps = {
            'Satélite': esriSatellite,
            'Mapa': osm
        };
        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(this.map);

        // ── Camada de desenho ──
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        // Controle Leaflet.draw (apenas polígono)
        this.drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polygon: {
                    allowIntersection: false,
                    shapeOptions: {
                        color: '#34C759',
                        weight: 3,
                        fillOpacity: 0.25
                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            }
        });
        this.map.addControl(this.drawControl);

        // ── Evento: novo polígono desenhado ──
        var self = this;
        this.map.on(L.Draw.Event.CREATED, function (e) {
            var layer = e.layer;
            self.promptNomePasto(layer);
        });

        // ── Evento: polígono deletado ──
        this.map.on(L.Draw.Event.DELETED, function (e) {
            self.saveAllPolygons();
            window.app.showToast('Pasto removido do mapa');
        });

        // ── Carregar polígonos salvos ──
        this.loadPolygons();

        // ── Tentar geolocalização se sem polígonos ──
        if (!savedCenter && this.polygons.length === 0) {
            this.geolocate();
        }

        // Fix rendering issue
        setTimeout(function () {
            if (self.map) self.map.invalidateSize();
        }, 300);
    },

    // ── Geolocalização GPS ──
    geolocate: function () {
        var self = this;
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function (pos) {
                if (self.map) {
                    self.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
                    self.saveCenter(pos.coords.latitude, pos.coords.longitude, 16);
                }
            }, function () { /* ignore errors */ }, { enableHighAccuracy: true });
        }
    },

    // ── Salvar/restaurar centro do mapa ──
    saveCenter: function (lat, lng, zoom) {
        try {
            localStorage.setItem('agromacro_mapa_center', JSON.stringify({ lat: lat, lng: lng, zoom: zoom }));
        } catch (e) { /* ignore */ }
    },

    getSavedCenter: function () {
        try {
            var raw = localStorage.getItem('agromacro_mapa_center');
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    },

    // ── Prompt para nome do pasto ──
    promptNomePasto: function (layer) {
        var self = this;
        var nome = prompt('Nome deste pasto:');
        if (!nome || !nome.trim()) {
            window.app.showToast('Pasto não salvo — nome obrigatório', 'warning');
            return;
        }

        layer.pastoNome = nome.trim();
        this.drawnItems.addLayer(layer);
        this.bindPopup(layer);
        this.stylePolygon(layer);
        this.saveAllPolygons();
        this.fitBounds();
        window.app.showToast('✅ Pasto "' + nome.trim() + '" adicionado!');
    },

    // ── Estilizar polígono por status ──
    stylePolygon: function (layer) {
        var nome = layer.pastoNome || '';
        var info = this.getPastoInfo(nome);

        var color = '#6B7280'; // cinza = vazio
        var fillOpacity = 0.2;

        if (info.emObra) {
            color = '#FF9500'; // amarelo = em obra
            fillOpacity = 0.3;
        } else if (info.totalAnimais > 0) {
            color = '#34C759'; // verde = com gado
            fillOpacity = 0.25;
        }

        layer.setStyle({
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: fillOpacity
        });
    },

    // ── Popup com informações do pasto ──
    bindPopup: function (layer) {
        var self = this;
        layer.on('click', function () {
            var nome = layer.pastoNome || 'Sem nome';
            var info = self.getPastoInfo(nome);
            var perfil = window.app.getPerfil();

            var area = self.calcArea(layer);

            var html = '<div class="mapa-popup">';
            html += '<div class="mapa-popup-title">🌿 ' + nome + '</div>';
            html += '<div class="mapa-popup-area">' + area + ' ha</div>';

            if (info.totalAnimais > 0) {
                html += '<div class="mapa-popup-stat ok">🐄 ' + info.totalAnimais + ' cabeças</div>';
                if (info.lotes.length > 0) {
                    html += '<div class="mapa-popup-detail">Lotes: ' + info.lotes.join(', ') + '</div>';
                }
            } else {
                html += '<div class="mapa-popup-stat empty">Sem gado</div>';
            }

            if (info.emObra) {
                html += '<div class="mapa-popup-stat obra">🔨 Em obra: ' + info.obraNome + '</div>';
            }

            if (info.ultimaObra && !info.emObra) {
                html += '<div class="mapa-popup-detail">Última obra: ' + info.ultimaObra + '</div>';
            }

            // Valores financeiros só para gerência
            if (perfil === 'gerencia' && info.custoTotal > 0) {
                html += '<div class="mapa-popup-valor">💰 Custo total: R$ ' + info.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>';
            }

            html += '</div>';

            layer.bindPopup(html, { className: 'mapa-popup-container', maxWidth: 260 }).openPopup();
        });
    },

    // ── Calcular área do polígono em hectares ──
    calcArea: function (layer) {
        try {
            var latlngs = layer.getLatLngs()[0];
            if (!latlngs || latlngs.length < 3) return '0.00';
            var area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(latlngs) : 0;
            if (!area) {
                // Cálculo manual de área geodésica
                area = this.geodesicArea(latlngs);
            }
            return (area / 10000).toFixed(2); // m² → hectares
        } catch (e) {
            return '0.00';
        }
    },

    // ── Cálculo geodésico de área (Shoelace) ──
    geodesicArea: function (latlngs) {
        var d2r = Math.PI / 180;
        var area = 0;
        var len = latlngs.length;
        for (var i = 0; i < len; i++) {
            var j = (i + 1) % len;
            var xi = latlngs[i].lng * d2r;
            var yi = latlngs[i].lat * d2r;
            var xj = latlngs[j].lng * d2r;
            var yj = latlngs[j].lat * d2r;
            area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
        }
        area = Math.abs(area * 6378137 * 6378137 / 2);
        return area;
    },

    // ── Obter info do pasto a partir dos dados do app ──
    getPastoInfo: function (nomePasto) {
        var info = {
            totalAnimais: 0,
            lotes: [],
            emObra: false,
            obraNome: '',
            ultimaObra: '',
            custoTotal: 0
        };

        try {
            var data = window.data;
            if (!data) return info;

            // Buscar lotes neste pasto
            var lotes = (data.events || []).filter(function (e) {
                return e.type === 'LOTE' && e.pasto && e.pasto.toLowerCase() === nomePasto.toLowerCase();
            });

            var lotesMap = {};
            lotes.forEach(function (lt) {
                lotesMap[lt.nome] = lt;
                info.totalAnimais += (lt.quantidade || 0);
                info.lotes.push(lt.nome);
            });

            // Cabeças individuais neste pasto
            var cabecas = (data.events || []).filter(function (e) {
                return e.type === 'CABECA' && e.pasto && e.pasto.toLowerCase() === nomePasto.toLowerCase();
            });
            info.totalAnimais += cabecas.length;

            // Obras neste pasto
            var obras = (data.events || []).filter(function (e) {
                return e.type === 'OBRA';
            });

            obras.forEach(function (obra) {
                var obraNome = (obra.nome || '').toLowerCase();
                var obsText = (obra.obs || '').toLowerCase();
                if (obraNome.indexOf(nomePasto.toLowerCase()) >= 0 || obsText.indexOf(nomePasto.toLowerCase()) >= 0) {
                    if (!obra.dataFim || obra.dataFim === '') {
                        info.emObra = true;
                        info.obraNome = obra.nome;
                    }
                    info.ultimaObra = obra.nome;
                    info.custoTotal += (obra.custo || 0);
                }
            });

            // Manejos neste pasto
            var manejos = (data.events || []).filter(function (e) {
                return e.type === 'MANEJO' && e.custo;
            });
            // custos de manejo podem ser associados a lotes neste pasto
            manejos.forEach(function (m) {
                if (lotesMap[m.lote]) {
                    info.custoTotal += (m.custo || 0);
                }
            });

        } catch (e) {
            console.error('Erro ao obter info do pasto:', e);
        }

        return info;
    },

    // ── Importar KML ──
    importKML: function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.kml,.kmz';
        var self = this;

        input.onchange = function (e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    self.parseKML(ev.target.result);
                    window.app.showToast('✅ KML importado com sucesso!');
                } catch (err) {
                    console.error('Erro KML:', err);
                    window.app.showToast('Erro ao importar KML', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    // ── Parser KML simples ──
    parseKML: function (kmlText) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(kmlText, 'text/xml');
        var placemarks = doc.querySelectorAll('Placemark');
        var self = this;
        var count = 0;

        placemarks.forEach(function (pm) {
            var name = pm.querySelector('name');
            var coords = pm.querySelector('coordinates');
            if (!coords) return;

            var nome = name ? name.textContent.trim() : 'Pasto ' + (self.drawnItems.getLayers().length + 1);
            var coordText = coords.textContent.trim();
            var latlngs = [];

            coordText.split(/\s+/).forEach(function (pair) {
                var parts = pair.split(',');
                if (parts.length >= 2) {
                    var lng = parseFloat(parts[0]);
                    var lat = parseFloat(parts[1]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        latlngs.push([lat, lng]);
                    }
                }
            });

            if (latlngs.length >= 3) {
                var polygon = L.polygon(latlngs);
                polygon.pastoNome = nome;
                self.drawnItems.addLayer(polygon);
                self.bindPopup(polygon);
                self.stylePolygon(polygon);
                count++;
            }
        });

        if (count > 0) {
            this.saveAllPolygons();
            this.fitBounds();
            window.app.showToast('✅ ' + count + ' pasto(s) importado(s) do KML');
        }
    },

    // ── Salvar todos os polígonos ──
    saveAllPolygons: function () {
        var data = [];
        this.drawnItems.eachLayer(function (layer) {
            if (layer.getLatLngs) {
                var coords = layer.getLatLngs()[0].map(function (ll) {
                    return [ll.lat, ll.lng];
                });
                data.push({
                    nome: layer.pastoNome || 'Sem nome',
                    coords: coords
                });
            }
        });

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Erro ao salvar polígonos:', e);
        }

        // Salvar centro atual
        if (this.map) {
            var c = this.map.getCenter();
            this.saveCenter(c.lat, c.lng, this.map.getZoom());
        }
    },

    // ── Carregar polígonos salvos ──
    loadPolygons: function () {
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            var self = this;

            data.forEach(function (p) {
                if (p.coords && p.coords.length >= 3) {
                    var polygon = L.polygon(p.coords);
                    polygon.pastoNome = p.nome;
                    self.drawnItems.addLayer(polygon);
                    self.bindPopup(polygon);
                    self.stylePolygon(polygon);
                }
            });

            if (data.length > 0) {
                this.fitBounds();
            }
        } catch (e) {
            console.error('Erro ao carregar polígonos:', e);
        }
    },

    // ── Ajustar zoom para mostrar todos os polígonos ──
    fitBounds: function () {
        if (this.drawnItems.getLayers().length > 0 && this.map) {
            this.map.fitBounds(this.drawnItems.getBounds().pad(0.1));
        }
    },

    // ── Atualizar cores de todos polígonos ──
    refreshStyles: function () {
        var self = this;
        this.drawnItems.eachLayer(function (layer) {
            self.stylePolygon(layer);
        });
    }
};
