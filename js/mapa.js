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
        if (!savedCenter && this.drawnItems.getLayers().length === 0) {
            this.geolocate();
        }

        // Fix rendering issue + garantir centralização nos pastos
        setTimeout(function () {
            if (self.map) {
                self.map.invalidateSize();
                // Sempre centraliza nos polígonos (prioridade sobre savedCenter)
                self.fitBounds();
            }
        }, 400);
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

        var color = '#8B95A5'; // cinza azulado = vazio
        var fillColor = '#9CA3AF';
        var fillOpacity = 0.15;
        var weight = 2;
        var dashArray = '5, 5';

        if (info.emObra && info.totalAnimais > 0) {
            // Laranja forte = obra + gado
            color = '#F59E0B';
            fillColor = '#FBBF24';
            fillOpacity = 0.35;
            weight = 3;
            dashArray = null;
        } else if (info.emObra) {
            // Laranja = em obra
            color = '#F97316';
            fillColor = '#FB923C';
            fillOpacity = 0.30;
            weight = 3;
            dashArray = '8, 4';
        } else if (info.totalAnimais > 0) {
            // Verde vibrante = com gado
            color = '#16A34A';
            fillColor = '#22C55E';
            fillOpacity = 0.30;
            weight = 3;
            dashArray = null;
        }

        layer.setStyle({
            color: color,
            weight: weight,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            dashArray: dashArray
        });
    },

    // ── Popup com informações do pasto ──
    bindPopup: function (layer) {
        var self = this;
        layer.on('click', function () {
            var nome = layer.pastoNome || 'Sem nome';
            var info = self.getPastoInfo(nome);
            var perfil = window.app ? window.app.getPerfil() : 'gerencia';
            var area = self.calcArea(layer);

            // Status badge
            var statusBadge = '';
            var statusColor = '';
            if (info.emObra && info.totalAnimais > 0) {
                statusBadge = '🔨🐄 Obra + Gado';
                statusColor = '#F59E0B';
            } else if (info.emObra) {
                statusBadge = '🔨 Em Obra';
                statusColor = '#F97316';
            } else if (info.totalAnimais > 0) {
                statusBadge = '🐄 Com Gado';
                statusColor = '#16A34A';
            } else {
                statusBadge = '🌿 Vazio / Descanso';
                statusColor = '#8B95A5';
            }

            var nomeDisplay = self.capitalize(nome);

            var html = '<div style="min-width:240px;max-width:300px;font-family:system-ui,-apple-system,sans-serif;">' +
                '<div style="padding-bottom:8px;border-bottom:2px solid ' + statusColor + ';margin-bottom:8px;">' +
                '<div style="font-weight:800;font-size:16px;color:#1a1a2e;line-height:1.2;">' + nomeDisplay + '</div>' +
                '<div style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;color:white;background:' + statusColor + ';">' + statusBadge + '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">' +
                '<div style="background:#F0F4FF;border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:10px;color:#6B7280;font-weight:600;">📐 ÁREA</div>' +
                '<div style="font-size:14px;font-weight:800;color:#1E40AF;">' + area + ' ha</div>' +
                '</div>' +
                '<div style="background:' + (info.totalAnimais > 0 ? '#ECFDF5' : '#F9FAFB') + ';border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:10px;color:#6B7280;font-weight:600;">🐄 ANIMAIS</div>' +
                '<div style="font-size:14px;font-weight:800;color:' + (info.totalAnimais > 0 ? '#059669' : '#9CA3AF') + ';">' + info.totalAnimais + ' cab</div>' +
                '</div>' +
                '</div>';

            if (info.lotes.length > 0) {
                html += '<div style="background:#F5F3FF;border-radius:8px;padding:8px;margin-bottom:6px;">' +
                    '<div style="font-size:10px;color:#7C3AED;font-weight:700;">🏷️ LOTES</div>' +
                    '<div style="font-size:12px;color:#374151;font-weight:500;margin-top:2px;">' + info.lotes.join(', ') + '</div>' +
                    '</div>';
            }

            if (info.emObra) {
                html += '<div style="background:#FFF7ED;border-radius:8px;padding:8px;margin-bottom:6px;border:1px solid #FED7AA;">' +
                    '<div style="font-size:10px;color:#EA580C;font-weight:700;">🔨 OBRA EM ANDAMENTO</div>' +
                    '<div style="font-size:12px;color:#374151;font-weight:600;margin-top:2px;">' + info.obraNome + '</div>' +
                    '</div>';
            }

            if (perfil === 'gerencia' && info.custoTotal > 0) {
                html += '<div style="background:#FEF2F2;border-radius:8px;padding:8px;margin-bottom:6px;">' +
                    '<div style="font-size:10px;color:#DC2626;font-weight:700;">💰 CUSTOS ACUMULADOS</div>' +
                    '<div style="font-size:13px;color:#991B1B;font-weight:800;margin-top:2px;">R$ ' + info.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>' +
                    '</div>';
            }

            // ── Botões de ação ──
            var layerId = L.stamp(layer);
            html += '<div style="display:flex;gap:4px;margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">' +
                '<button onclick="window.mapa.renamePasto(' + layerId + ')" style="flex:1;padding:6px;border:none;border-radius:6px;background:#3B82F6;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">✏️ Renomear</button>' +
                '<button onclick="window.mapa.editShape(' + layerId + ')" style="flex:1;padding:6px;border:none;border-radius:6px;background:#8B5CF6;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">🔧 Editar</button>' +
                '<button onclick="window.mapa.deletePasto(' + layerId + ')" style="flex:1;padding:6px;border:none;border-radius:6px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">🗑️ Excluir</button>' +
                '</div>';

            html += '</div>';
            layer.bindPopup(html, { maxWidth: 320, className: 'mapa-popup-premium' }).openPopup();
        });
    },

    // ── Renomear pasto ──
    renamePasto: function (layerId) {
        var layer = this.drawnItems.getLayer(layerId);
        if (!layer) return;
        var nomeAtual = layer.pastoNome || 'Sem nome';
        var novoNome = prompt('Novo nome para o pasto:', nomeAtual);
        if (!novoNome || novoNome.trim() === '' || novoNome === nomeAtual) return;

        layer.pastoNome = novoNome.trim();
        this.map.closePopup();

        // Atualizar label
        var self = this;
        this.drawnItems.eachLayer(function (l) {
            if (l instanceof L.Marker && l.options && l.options.icon &&
                l.options.icon.options && l.options.icon.options.html &&
                l.options.icon.options.html.indexOf(self.capitalize(nomeAtual)) >= 0) {
                self.drawnItems.removeLayer(l);
            }
        });
        this.addLabel(layer);
        this.stylePolygon(layer);
        this.saveAllPolygons();

        // Atualizar pasto no sistema
        if (window.data && window.data.events) {
            window.data.events.forEach(function (e) {
                if (e.type === 'PASTO' && e.nome && e.nome.toLowerCase() === nomeAtual.toLowerCase()) {
                    e.nome = novoNome.trim();
                }
            });
            window.data.save();
        }

        if (window.app && window.app.showToast) {
            window.app.showToast('✅ Pasto renomeado: ' + novoNome.trim());
        }
    },

    // ── Editar forma do pasto (ativar edição) ──
    editShape: function (layerId) {
        var layer = this.drawnItems.getLayer(layerId);
        if (!layer || !layer.editing) return;

        this.map.closePopup();
        var self = this;

        if (layer.editing._enabled) {
            // Desativar edição
            layer.editing.disable();
            this.saveAllPolygons();
            if (window.app && window.app.showToast) {
                window.app.showToast('✅ Forma salva');
            }
        } else {
            // Ativar edição
            layer.editing.enable();
            if (window.app && window.app.showToast) {
                window.app.showToast('🔧 Arraste os vértices para ajustar. Clique novamente em EDITAR para salvar.');
            }

            // Auto-salvar ao finalizar edição
            layer.on('edit', function () {
                self.saveAllPolygons();
                // Reposicionar label
                self.drawnItems.eachLayer(function (l) {
                    if (l instanceof L.Marker && l.options && l.options.icon &&
                        l.options.icon.options && l.options.icon.options.html &&
                        l.options.icon.options.html.indexOf(self.capitalize(layer.pastoNome || '')) >= 0) {
                        self.drawnItems.removeLayer(l);
                    }
                });
                self.addLabel(layer);
            });
        }
    },

    // ── Excluir pasto ──
    deletePasto: function (layerId) {
        var layer = this.drawnItems.getLayer(layerId);
        if (!layer) return;
        var nome = layer.pastoNome || 'Sem nome';

        if (!confirm('⚠️ Excluir o pasto "' + nome + '"?\n\nIsso removerá o polígono do mapa.\nDados de gado e obras NÃO serão excluídos.')) return;

        this.map.closePopup();
        var self = this;

        // Remover label
        this.drawnItems.eachLayer(function (l) {
            if (l instanceof L.Marker && l.options && l.options.icon &&
                l.options.icon.options && l.options.icon.options.html &&
                l.options.icon.options.html.indexOf(self.capitalize(nome)) >= 0) {
                self.drawnItems.removeLayer(l);
            }
        });

        this.drawnItems.removeLayer(layer);
        this.saveAllPolygons();

        if (window.app && window.app.showToast) {
            window.app.showToast('🗑️ Pasto "' + nome + '" excluído do mapa');
        }
    },

    // ── Capitalizar nome ──
    capitalize: function (str) {
        return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
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
            var nomeLower = nomePasto.toLowerCase().trim();

            // Buscar lotes neste pasto (pegar o mais recente por nome)
            var lotesMap = {};
            (data.events || []).forEach(function (e) {
                if (e.type === 'LOTE' && e.pasto && e.pasto.toLowerCase().trim() === nomeLower) {
                    lotesMap[e.nome] = e; // último evento prevalece
                }
            });

            for (var loteNome in lotesMap) {
                var lt = lotesMap[loteNome];
                if (lt.status === 'ATIVO') {
                    var qtd = lt.qtdAnimais || lt.quantidade || lt.cabecas || 0;
                    info.totalAnimais += qtd;
                    info.lotes.push(loteNome);
                }
            }

            // Cabeças individuais neste pasto
            var cabecas = (data.events || []).filter(function (e) {
                return e.type === 'CABECA' && e.pasto && e.pasto.toLowerCase().trim() === nomeLower && e.status !== 'VENDIDO';
            });
            info.totalAnimais += cabecas.length;

            // Obras neste pasto (buscar por nome e obs)
            (data.events || []).forEach(function (e) {
                if (e.type !== 'OBRA_REGISTRO' && e.type !== 'OBRA') return;
                var obraNome = (e.nome || '').toLowerCase();
                var obsText = (e.obs || '').toLowerCase();
                var obraPasto = (e.pasto || '').toLowerCase().trim();
                if (obraPasto === nomeLower || obraNome.indexOf(nomeLower) >= 0 || obsText.indexOf(nomeLower) >= 0) {
                    if (!e.dataFim || e.dataFim === '') {
                        info.emObra = true;
                        info.obraNome = e.nome || 'Obra';
                    }
                    info.ultimaObra = e.nome || '';
                    info.custoTotal += parseFloat(e.custo || e.value || 0);
                }
            });

            // Manejos (custos associados a lotes neste pasto)
            (data.events || []).forEach(function (e) {
                if ((e.type === 'MANEJO' || e.type === 'MANEJO_SANITARIO') && e.custo && lotesMap[e.lote]) {
                    info.custoTotal += parseFloat(e.custo || 0);
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
        // Coletar nomes existentes para evitar duplicidade
        var existingNames = {};
        this.drawnItems.eachLayer(function (layer) {
            if (layer.pastoNome) {
                existingNames[layer.pastoNome.toLowerCase()] = true;
            }
        });

        var parser = new DOMParser();
        var doc = parser.parseFromString(kmlText, 'text/xml');
        var placemarks = doc.querySelectorAll('Placemark');
        var self = this;
        var count = 0;
        var skipped = 0;

        placemarks.forEach(function (pm) {
            var name = pm.querySelector('name');
            var coords = pm.querySelector('coordinates');
            if (!coords) return;

            var nome = name ? name.textContent.trim() : 'Pasto ' + (self.drawnItems.getLayers().length + 1);
            var coordText = coords.textContent.trim();

            // Verificar duplicidade por nome
            if (existingNames[nome.toLowerCase()]) {
                skipped++;
                return;
            }

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
                self.addLabel(polygon);
                count++;
            }
        });

        if (count > 0) {
            this.saveAllPolygons();
            this.syncPastosToApp();
            this.fitBounds();
            window.app.showToast('✅ ' + count + ' pasto(s) importado(s) do KML');
        }
        if (skipped > 0) {
            window.app.showToast('⚠️ ' + skipped + ' pasto(s) já existentes foram ignorados', 'warning');
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
        var self = this;
        var loaded = false;

        // 1. Tentar carregar do localStorage primeiro
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                if (data && data.length > 0) {
                    data.forEach(function (p) {
                        if (p.coords && p.coords.length >= 3) {
                            var polygon = L.polygon(p.coords);
                            polygon.pastoNome = p.nome;
                            self.drawnItems.addLayer(polygon);
                            self.bindPopup(polygon);
                            self.stylePolygon(polygon);
                            self.addLabel(polygon);
                        }
                    });
                    loaded = true;
                }
            }
        } catch (e) {
            console.error('Erro ao carregar polígonos salvos:', e);
        }

        // 2. Se não tem dados salvos, carregar os embutidos do KML
        if (!loaded && window.FAZENDA_PASTOS && window.FAZENDA_PASTOS.length > 0) {
            console.log('🗺️ Carregando ' + window.FAZENDA_PASTOS.length + ' pastos embutidos da fazenda...');
            window.FAZENDA_PASTOS.forEach(function (p) {
                if (p.coords && p.coords.length >= 3) {
                    var polygon = L.polygon(p.coords);
                    polygon.pastoNome = p.nome;
                    self.drawnItems.addLayer(polygon);
                    self.bindPopup(polygon);
                    self.stylePolygon(polygon);
                    self.addLabel(polygon);
                }
            });
            // Salvar no localStorage para próximas vezes
            this.saveAllPolygons();
            // Registrar pastos no sistema do app
            this.syncPastosToApp();
            loaded = true;
        }

        if (loaded) {
            this.fitBounds();
        }
    },

    // ── Adicionar label com nome do pasto no centro do polígono ──
    addLabel: function (layer) {
        try {
            var center = layer.getBounds().getCenter();
            var nome = layer.pastoNome || '';
            if (!nome) return;

            var nomeDisplay = this.capitalize(nome);
            var info = this.getPastoInfo(nome);
            var badge = info.totalAnimais > 0 ? ' <span style="background:#16A34A;color:#fff;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:800;">' + info.totalAnimais + '🐄</span>' : '';

            var label = L.divIcon({
                className: 'mapa-pasto-label',
                html: '<span>' + nomeDisplay + badge + '</span>',
                iconSize: [160, 28],
                iconAnchor: [80, 14]
            });
            var marker = L.marker(center, { icon: label, interactive: false });
            this.drawnItems.addLayer(marker);
        } catch (e) { /* ignore label error */ }
    },

    // ── Sincronizar pastos do KML com o sistema de pastos do app ──
    syncPastosToApp: function () {
        if (!window.data || !window.data.events) return;

        var existingPastos = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'PASTO') existingPastos[ev.nome.toLowerCase()] = true;
        });

        var count = 0;
        var self = this;
        this.drawnItems.eachLayer(function (layer) {
            if (!layer.pastoNome) return;
            var nome = layer.pastoNome;
            if (existingPastos[nome.toLowerCase()]) return;

            // Calcular área
            var area = self.calcArea(layer);

            // Registrar pasto no sistema
            window.data.events.push({
                type: 'PASTO',
                nome: nome,
                area: parseFloat(area) || 0,
                capacidade: '',
                tipoPasto: 'nativo',
                statusPasto: 'ativo',
                obs: 'Importado do mapa KML',
                date: new Date().toISOString()
            });
            count++;
        });

        if (count > 0) {
            window.data.save();
            console.log('✅ ' + count + ' pastos registrados no sistema');
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
            if (layer.setStyle) self.stylePolygon(layer);
        });
    }
};
