// ====== MAPA.JS — Mapa Interativo de Pastos (Leaflet + Esri) ======
// v2.0 — Dashboard, Filtros, Busca, Tabela, Dias de Descanso
window.mapa = {
    map: null,
    polygons: [],
    drawControl: null,
    drawnItems: null,
    STORAGE_KEY: 'agromacro_mapa_pastos',
    tableVisible: false,
    activeFilter: 'todos',

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
                        color: '#22C55E',
                        weight: 3,
                        fillOpacity: 0.35
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
            self.updateDashboard();
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
                self.fitBounds();
                self.updateDashboard();
            }
        }, 400);
    },

    // ══════════════════════════════════════════════
    //  DASHBOARD — Totais no topo
    // ══════════════════════════════════════════════
    getDashboardStats: function () {
        var stats = { totalPastos: 0, totalCabecas: 0, ocupados: 0, vazios: 0 };
        var self = this;
        if (!this.drawnItems) return stats;

        this.drawnItems.eachLayer(function (layer) {
            if (!layer.pastoNome) return;
            stats.totalPastos++;
            var info = self.getPastoInfo(layer.pastoNome);
            stats.totalCabecas += info.totalAnimais;
            if (info.totalAnimais > 0) {
                stats.ocupados++;
            } else {
                stats.vazios++;
            }
        });
        return stats;
    },

    updateDashboard: function () {
        var stats = this.getDashboardStats();
        var el = function (id) { return document.getElementById(id); };
        if (el('dash-total-pastos')) el('dash-total-pastos').textContent = stats.totalPastos;
        if (el('dash-total-cabecas')) el('dash-total-cabecas').textContent = stats.totalCabecas;
        if (el('dash-ocupados')) el('dash-ocupados').textContent = stats.ocupados;
        if (el('dash-vazios')) el('dash-vazios').textContent = stats.vazios;
    },

    // ══════════════════════════════════════════════
    //  FILTROS — Mostrar/esconder polígonos por status
    // ══════════════════════════════════════════════
    filterMap: function (tipo, btn) {
        this.activeFilter = tipo;
        var self = this;

        // Atualizar botão ativo
        if (btn) {
            document.querySelectorAll('.mapa-filter-btn').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        }

        if (!this.drawnItems) return;

        this.drawnItems.eachLayer(function (layer) {
            if (!layer.pastoNome) return; // skip labels
            var info = self.getPastoInfo(layer.pastoNome);
            var show = false;

            if (tipo === 'todos') {
                show = true;
            } else if (tipo === 'gado' && info.totalAnimais > 0) {
                show = true;
            } else if (tipo === 'obra' && info.emObra) {
                show = true;
            } else if (tipo === 'vazio' && info.totalAnimais === 0 && !info.emObra) {
                show = true;
            }

            if (layer.setStyle) {
                layer.setStyle({ opacity: show ? 1 : 0.08, fillOpacity: show ? 0.40 : 0.03 });
            }
            // Toggle label visibility
            if (layer instanceof L.Marker) {
                var el = layer.getElement && layer.getElement();
                if (el) el.style.opacity = show ? '1' : '0.1';
            }
        });

        // Also filter label markers associated with pastos
        this.drawnItems.eachLayer(function (layer) {
            if (!(layer instanceof L.Marker)) return;
            if (!layer.options || !layer.options.icon || !layer.options.icon.options) return;
            var html = layer.options.icon.options.html || '';
            // Find which pasto this label belongs to
            var found = false;
            self.drawnItems.eachLayer(function (poly) {
                if (!poly.pastoNome || !poly.setStyle) return;
                var cap = self.capitalize(poly.pastoNome);
                if (html.indexOf(cap) >= 0) {
                    var info = self.getPastoInfo(poly.pastoNome);
                    var show = tipo === 'todos' ||
                        (tipo === 'gado' && info.totalAnimais > 0) ||
                        (tipo === 'obra' && info.emObra) ||
                        (tipo === 'vazio' && info.totalAnimais === 0 && !info.emObra);
                    var el = layer.getElement && layer.getElement();
                    if (el) el.style.opacity = show ? '1' : '0.1';
                    found = true;
                }
            });
        });
    },

    // ══════════════════════════════════════════════
    //  BUSCA — Centralizar no pasto pelo nome
    // ══════════════════════════════════════════════
    searchPasto: function (query) {
        if (!query || !query.trim() || !this.drawnItems) return;
        var q = query.toLowerCase().trim();
        var self = this;

        this.drawnItems.eachLayer(function (layer) {
            if (!layer.pastoNome) return;
            if (layer.pastoNome.toLowerCase().indexOf(q) >= 0) {
                if (layer.getBounds) {
                    self.map.fitBounds(layer.getBounds().pad(0.3));
                    // Simular click para abrir popup
                    layer.fire('click');
                }
            }
        });
    },

    // ══════════════════════════════════════════════
    //  DIAS DE DESCANSO — Dias sem gado no pasto
    // ══════════════════════════════════════════════
    getRestDays: function (nomePasto) {
        try {
            var data = window.data;
            if (!data || !data.events) return -1;
            var nomeLower = nomePasto.toLowerCase().trim();
            var info = this.getPastoInfo(nomePasto);

            // Se tem gado, não está descansando
            if (info.totalAnimais > 0) return 0;

            // Procurar a data mais recente de movimentação DE SAÍDA deste pasto
            var lastDate = null;
            data.events.forEach(function (e) {
                if (e.type === 'MANEJO' && e.manejoTipo === 'movimentacao') {
                    var pastoOrigem = (e.pastoOrigem || e.pasto || '').toLowerCase().trim();
                    if (pastoOrigem === nomeLower && e.date) {
                        var d = new Date(e.date);
                        if (!lastDate || d > lastDate) lastDate = d;
                    }
                }
                // Também verificar trocas de pasto dos lotes
                if (e.type === 'TROCA_PASTO') {
                    var pastoAnt = (e.pastoAnterior || '').toLowerCase().trim();
                    if (pastoAnt === nomeLower && e.date) {
                        var d2 = new Date(e.date);
                        if (!lastDate || d2 > lastDate) lastDate = d2;
                    }
                }
            });

            if (!lastDate) return -1; // nunca teve gado
            var diff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            return diff;
        } catch (e) {
            return -1;
        }
    },

    // ══════════════════════════════════════════════
    //  TABELA — Visão planilha de todos os pastos
    // ══════════════════════════════════════════════
    toggleTable: function () {
        this.tableVisible = !this.tableVisible;
        var tableEl = document.getElementById('mapa-table-container');
        var mapEl = document.getElementById('mapa-container');
        var btn = document.getElementById('btn-toggle-table');

        if (this.tableVisible) {
            tableEl.classList.remove('hidden');
            mapEl.style.display = 'none';
            if (btn) btn.innerHTML = '🗺️ Mapa';
            this.renderTable();
        } else {
            tableEl.classList.add('hidden');
            mapEl.style.display = '';
            if (btn) btn.innerHTML = '📋 Tabela';
            if (this.map) {
                setTimeout(function () { window.mapa.map.invalidateSize(); }, 200);
            }
        }
    },

    renderTable: function () {
        var container = document.getElementById('mapa-table-container');
        if (!container) return;

        var rows = [];
        var self = this;
        this.drawnItems.eachLayer(function (layer) {
            if (!layer.pastoNome) return;
            var info = self.getPastoInfo(layer.pastoNome);
            var area = self.calcArea(layer);
            var restDays = self.getRestDays(layer.pastoNome);
            var uaHa = area > 0 ? (info.totalAnimais * 1.0 / parseFloat(area)).toFixed(2) : '—';
            var status = info.emObra ? '🔨 Obra' : (info.totalAnimais > 0 ? '🐄 Ocupado' : '🌿 Vazio');
            var restDisplay = restDays > 0 ? restDays + 'd' : (restDays === 0 ? 'Em uso' : '—');

            rows.push({
                nome: self.capitalize(layer.pastoNome),
                area: area,
                cabecas: info.totalAnimais,
                lotes: info.lotes.join(', ') || '—',
                status: status,
                descanso: restDisplay,
                uaHa: uaHa,
                restDays: restDays
            });
        });

        // Ordenar por nome
        rows.sort(function (a, b) { return a.nome.localeCompare(b.nome); });

        var html = '<div class="mapa-table-wrap">' +
            '<table class="mapa-table">' +
            '<thead><tr>' +
            '<th>Nome</th>' +
            '<th>Área (ha)</th>' +
            '<th>Cabeças</th>' +
            '<th>Lotes</th>' +
            '<th>Status</th>' +
            '<th>Descanso</th>' +
            '<th>UA/ha</th>' +
            '</tr></thead><tbody>';

        if (rows.length === 0) {
            html += '<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:24px;">Nenhum pasto cadastrado no mapa</td></tr>';
        }

        rows.forEach(function (r) {
            var descansoColor = r.restDays > 30 ? '#16A34A' : (r.restDays > 14 ? '#F59E0B' : (r.restDays > 0 ? '#EF4444' : '#9CA3AF'));
            html += '<tr>' +
                '<td style="font-weight:700;">' + r.nome + '</td>' +
                '<td>' + r.area + '</td>' +
                '<td style="font-weight:700;color:' + (r.cabecas > 0 ? '#059669' : '#9CA3AF') + ';">' + r.cabecas + '</td>' +
                '<td style="font-size:11px;">' + r.lotes + '</td>' +
                '<td>' + r.status + '</td>' +
                '<td style="font-weight:700;color:' + descansoColor + ';">' + r.descanso + '</td>' +
                '<td>' + r.uaHa + '</td>' +
                '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },

    // ══════════════════════════════════════════════
    //  MOVER GADO — Botão no popup para trocar pasto
    // ══════════════════════════════════════════════
    moveCattleFromMap: function (pastoNome) {
        // Fechar popup do mapa
        if (this.map) this.map.closePopup();

        // Procurar lotes neste pasto
        var info = this.getPastoInfo(pastoNome);
        if (info.lotes.length === 0) {
            if (window.app && window.app.showToast) {
                window.app.showToast('Nenhum lote neste pasto para mover', 'warning');
            }
            return;
        }

        // Se só tem 1 lote, abrir direto o modal de troca
        if (info.lotes.length === 1) {
            if (window.lotes && window.lotes.abrirTrocaPasto) {
                window.lotes.abrirTrocaPasto(info.lotes[0]);
            }
        } else {
            // Múltiplos lotes — mostrar escolha
            var msg = 'Qual lote deseja mover?\n\n';
            info.lotes.forEach(function (l, i) { msg += (i + 1) + '. ' + l + '\n'; });
            var escolha = prompt(msg + '\nDigite o número:');
            if (escolha) {
                var idx = parseInt(escolha) - 1;
                if (idx >= 0 && idx < info.lotes.length && window.lotes && window.lotes.abrirTrocaPasto) {
                    window.lotes.abrirTrocaPasto(info.lotes[idx]);
                }
            }
        }
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
        this.addLabel(layer);
        this.saveAllPolygons();
        this.fitBounds();
        this.updateDashboard();
        window.app.showToast('✅ Pasto "' + nome.trim() + '" adicionado!');
    },

    // ══════════════════════════════════════════════
    //  ESTILIZAR — Cores VIBRANTES por status
    // ══════════════════════════════════════════════
    stylePolygon: function (layer) {
        var nome = layer.pastoNome || '';
        var info = this.getPastoInfo(nome);
        var restDays = this.getRestDays(nome);

        // Cores vibrantes para fácil visualização no campo
        var color = '#64748B';       // cinza azulado = vazio
        var fillColor = '#94A3B8';
        var fillOpacity = 0.20;
        var weight = 2;
        var dashArray = '6, 4';

        if (info.emObra && info.totalAnimais > 0) {
            // AMARELO FORTE = obra + gado
            color = '#EAB308';
            fillColor = '#FDE047';
            fillOpacity = 0.45;
            weight = 4;
            dashArray = null;
        } else if (info.emObra) {
            // LARANJA VIBRANTE = em obra
            color = '#F97316';
            fillColor = '#FB923C';
            fillOpacity = 0.40;
            weight = 3;
            dashArray = '8, 4';
        } else if (info.totalAnimais > 0) {
            // VERDE VIBRANTE = com gado
            color = '#16A34A';
            fillColor = '#4ADE80';
            fillOpacity = 0.40;
            weight = 4;
            dashArray = null;
        } else if (restDays > 30) {
            // VERDE CLARO = bem descansado
            color = '#065F46';
            fillColor = '#6EE7B7';
            fillOpacity = 0.30;
            weight = 2;
            dashArray = '4, 4';
        } else if (restDays > 0) {
            // AZUL = descansando há pouco
            color = '#1D4ED8';
            fillColor = '#93C5FD';
            fillOpacity = 0.25;
            weight = 2;
            dashArray = '4, 4';
        }

        layer.setStyle({
            color: color,
            weight: weight,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            dashArray: dashArray
        });
    },

    // ══════════════════════════════════════════════
    //  POPUP — Informações detalhadas com botão Mover
    // ══════════════════════════════════════════════
    bindPopup: function (layer) {
        var self = this;
        layer.on('click', function () {
            var nome = layer.pastoNome || 'Sem nome';
            var info = self.getPastoInfo(nome);
            var perfil = window.app ? window.app.getPerfil() : 'gerencia';
            var area = self.calcArea(layer);
            var restDays = self.getRestDays(nome);
            var uaHa = parseFloat(area) > 0 ? (info.totalAnimais / parseFloat(area)).toFixed(2) : '—';

            // Status badge
            var statusBadge = '';
            var statusColor = '';
            if (info.emObra && info.totalAnimais > 0) {
                statusBadge = '🔨🐄 Obra + Gado';
                statusColor = '#EAB308';
            } else if (info.emObra) {
                statusBadge = '🔨 Em Obra';
                statusColor = '#F97316';
            } else if (info.totalAnimais > 0) {
                statusBadge = '🐄 Com Gado';
                statusColor = '#16A34A';
            } else {
                statusBadge = '🌿 Vazio / Descanso';
                statusColor = '#64748B';
            }

            var nomeDisplay = self.capitalize(nome);

            var html = '<div style="min-width:250px;max-width:320px;font-family:system-ui,-apple-system,sans-serif;">' +
                '<div style="padding-bottom:8px;border-bottom:3px solid ' + statusColor + ';margin-bottom:8px;">' +
                '<div style="font-weight:800;font-size:17px;color:#1a1a2e;line-height:1.2;">' + nomeDisplay + '</div>' +
                '<div style="display:inline-block;margin-top:4px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;color:white;background:' + statusColor + ';">' + statusBadge + '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">' +
                '<div style="background:#F0F4FF;border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:10px;color:#6B7280;font-weight:600;">📐 ÁREA</div>' +
                '<div style="font-size:14px;font-weight:800;color:#1E40AF;">' + area + ' ha</div>' +
                '</div>' +
                '<div style="background:' + (info.totalAnimais > 0 ? '#ECFDF5' : '#F9FAFB') + ';border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:10px;color:#6B7280;font-weight:600;">🐄 ANIMAIS</div>' +
                '<div style="font-size:14px;font-weight:800;color:' + (info.totalAnimais > 0 ? '#059669' : '#9CA3AF') + ';">' + info.totalAnimais + ' cab</div>' +
                '</div>' +
                '<div style="background:#EFF6FF;border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:10px;color:#6B7280;font-weight:600;">📊 UA/ha</div>' +
                '<div style="font-size:14px;font-weight:800;color:#1E40AF;">' + uaHa + '</div>' +
                '</div>' +
                '</div>';

            // Dias de descanso
            if (restDays > 0) {
                var restColor = restDays > 30 ? '#059669' : (restDays > 14 ? '#D97706' : '#DC2626');
                var restLabel = restDays > 30 ? 'Bem descansado ✅' : (restDays > 14 ? 'Descansando...' : 'Pouco descanso ⚠️');
                html += '<div style="background:#F0FDF4;border-radius:8px;padding:8px;margin-bottom:6px;border:1px solid #BBF7D0;">' +
                    '<div style="font-size:10px;color:#059669;font-weight:700;">🌿 DIAS DE DESCANSO</div>' +
                    '<div style="font-size:18px;font-weight:900;color:' + restColor + ';margin-top:2px;">' + restDays + ' dias</div>' +
                    '<div style="font-size:10px;color:#6B7280;">' + restLabel + '</div>' +
                    '</div>';
            }

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
            var nomeEscaped = nome.replace(/'/g, "\\'");
            html += '<div style="display:flex;gap:4px;margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">' +
                '<button onclick="window.mapa.renamePasto(' + layerId + ')" style="flex:1;padding:6px;border:none;border-radius:6px;background:#3B82F6;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">✏️ Renomear</button>' +
                '<button onclick="window.mapa.deletePasto(' + layerId + ')" style="flex:1;padding:6px;border:none;border-radius:6px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">🗑️ Excluir</button>' +
                '</div>';

            // Botão mover gado (se tem lotes)
            if (info.lotes.length > 0) {
                html += '<button onclick="window.mapa.moveCattleFromMap(\'' + nomeEscaped + '\')" ' +
                    'style="width:100%;margin-top:6px;padding:8px;border:none;border-radius:6px;background:linear-gradient(135deg,#059669,#10B981);color:#fff;font-size:11px;font-weight:700;cursor:pointer;">' +
                    '🔄 Mover Gado para Outro Pasto</button>';
            }

            html += '</div>';
            layer.bindPopup(html, { maxWidth: 340, className: 'mapa-popup-premium' }).openPopup();
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
        this.updateDashboard();

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

    // editShape removido — edição do contorno é feita no Google Earth

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
        this.updateDashboard();

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
                area = this.geodesicArea(latlngs);
            }
            return (area / 10000).toFixed(2);
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

            // Buscar lotes neste pasto
            var lotesMap = {};
            (data.events || []).forEach(function (e) {
                if (e.type === 'LOTE' && e.pasto && e.pasto.toLowerCase().trim() === nomeLower) {
                    lotesMap[e.nome] = e;
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

            // Obras neste pasto
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

            // Manejos
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
            this.updateDashboard();
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

        if (this.map) {
            var c = this.map.getCenter();
            this.saveCenter(c.lat, c.lng, this.map.getZoom());
        }
    },

    // ── Carregar polígonos salvos ──
    loadPolygons: function () {
        var self = this;
        var loaded = false;

        // Deduplicate helper: track loaded names
        var loadedNames = {};

        // 1. Tentar carregar do localStorage primeiro
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                // Deduplicate localStorage data before loading
                if (data && data.length > 0) {
                    var deduped = [];
                    var seen = {};
                    data.forEach(function (p) {
                        var key = (p.nome || '').toLowerCase().trim();
                        if (!seen[key] && p.coords && p.coords.length >= 3) {
                            seen[key] = true;
                            deduped.push(p);
                        }
                    });

                    // If deduplication removed items, log it
                    if (deduped.length < data.length) {
                        console.log('🧹 Removidos ' + (data.length - deduped.length) + ' pastos duplicados do localStorage');
                    }

                    deduped.forEach(function (p) {
                        var polygon = L.polygon(p.coords);
                        polygon.pastoNome = p.nome;
                        self.drawnItems.addLayer(polygon);
                        self.bindPopup(polygon);
                        self.stylePolygon(polygon);
                        self.addLabel(polygon);
                        loadedNames[(p.nome || '').toLowerCase().trim()] = true;
                    });

                    // Save the deduplicated version back
                    if (deduped.length < data.length) {
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(deduped));
                    }

                    loaded = true;
                }
            }
        } catch (e) {
            console.error('Erro ao carregar polígonos salvos:', e);
        }

        // 2. Se não tem dados salvos, carregar os embutidos do KML
        if (!loaded && window.FAZENDA_PASTOS && window.FAZENDA_PASTOS.length > 0) {
            console.log('🗺️ Carregando ' + window.FAZENDA_PASTOS.length + ' pastos embutidos da fazenda...');
            var uniquePastos = [];
            var seenEmbed = {};

            window.FAZENDA_PASTOS.forEach(function (p) {
                var key = (p.nome || '').toLowerCase().trim();
                if (!seenEmbed[key] && p.coords && p.coords.length >= 3) {
                    seenEmbed[key] = true;
                    uniquePastos.push(p);
                }
            });

            if (uniquePastos.length < window.FAZENDA_PASTOS.length) {
                console.log('🧹 Ignorados ' + (window.FAZENDA_PASTOS.length - uniquePastos.length) + ' pastos duplicados dos dados embutidos');
            }

            uniquePastos.forEach(function (p) {
                var polygon = L.polygon(p.coords);
                polygon.pastoNome = p.nome;
                self.drawnItems.addLayer(polygon);
                self.bindPopup(polygon);
                self.stylePolygon(polygon);
                self.addLabel(polygon);
            });

            this.saveAllPolygons();
            this.syncPastosToApp();
            loaded = true;
        }

        if (loaded) {
            this.fitBounds();
        }
    },

    // ══════════════════════════════════════════════
    //  LABEL — Nome visível e grande no centro do pasto
    // ══════════════════════════════════════════════
    addLabel: function (layer) {
        try {
            var center = layer.getBounds().getCenter();
            var nome = layer.pastoNome || '';
            if (!nome) return;

            var nomeDisplay = this.capitalize(nome);
            var info = this.getPastoInfo(nome);
            var restDays = this.getRestDays(nome);

            // Badge de animais
            var badge = '';
            if (info.totalAnimais > 0) {
                badge = ' <span style="background:#16A34A;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px;font-weight:900;vertical-align:middle;">' + info.totalAnimais + ' 🐄</span>';
            }

            // Badge de descanso
            var restBadge = '';
            if (restDays > 0) {
                var restCol = restDays > 30 ? '#059669' : (restDays > 14 ? '#D97706' : '#EF4444');
                restBadge = '<br><span style="background:' + restCol + ';color:#fff;border-radius:8px;padding:1px 6px;font-size:9px;font-weight:700;">🌿 ' + restDays + 'd</span>';
            }

            // Badge de obra
            var obraBadge = '';
            if (info.emObra) {
                obraBadge = ' <span style="background:#F97316;color:#fff;border-radius:8px;padding:1px 6px;font-size:9px;font-weight:700;">🔨</span>';
            }

            var label = L.divIcon({
                className: 'mapa-pasto-label',
                html: '<span>' + nomeDisplay + badge + obraBadge + restBadge + '</span>',
                iconSize: [180, 40],
                iconAnchor: [90, 20]
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

            var area = self.calcArea(layer);

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
        if (this.drawnItems && this.drawnItems.getLayers().length > 0 && this.map) {
            this.map.fitBounds(this.drawnItems.getBounds().pad(0.1));
        }
    },

    // ── Atualizar cores e labels de todos polígonos ──
    refreshStyles: function () {
        var self = this;
        this.drawnItems.eachLayer(function (layer) {
            if (layer.setStyle) self.stylePolygon(layer);
        });
        this.updateDashboard();
    }
};
