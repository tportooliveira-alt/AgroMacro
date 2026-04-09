// ====== APP.JS — AgroMacro Controller ======
window.app = {
    currentPage: 'home',
    PERFIL_KEY: 'agromacro_perfil',
    PERFIS_VALIDOS: ['peao', 'admin', 'dono'],

    _escapeHtml: function (str) {
        return ('' + (str == null ? '' : str))
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    normalizePerfil: function (perfil) {
        if (!perfil) return 'admin';
        var p = ('' + perfil).toLowerCase();
        if (p === 'campo') return 'peao';
        if (p === 'gerencia') return 'admin';
        if (this.PERFIS_VALIDOS.indexOf(p) >= 0) return p;
        return 'admin';
    },

    _configureBottomNavByPerfil: function (perfil) {
        var navOperacoes = document.getElementById('nav-operacoes');
        var navRebanho = document.getElementById('nav-rebanho');
        var navIA = document.getElementById('nav-ia-chefa');
        var iconOperacoes = document.getElementById('nav-icon-obra');
        var iconRebanho = document.getElementById('nav-icon-rebanho');
        var labelIA = document.getElementById('nav-label-ia');
        var labelRebanho = document.getElementById('nav-label-rebanho');

        if (!navOperacoes || !navRebanho) return;

        if (perfil === 'peao') {
            navOperacoes.setAttribute('onclick', "app.navigate('pastos')");
            navRebanho.setAttribute('onclick', "app.navigate('manejo')");
            if (iconOperacoes) iconOperacoes.textContent = 'grass';
            if (iconRebanho) iconRebanho.textContent = 'vaccines';
            var opLabel = navOperacoes.querySelector('span:last-child');
            if (opLabel) opLabel.textContent = 'Pastos';
            if (labelRebanho) labelRebanho.textContent = 'Manejo';
            if (navIA) navIA.style.display = 'none';
        } else {
            navOperacoes.setAttribute('onclick', "app.navigate('obras')");
            navRebanho.setAttribute('onclick', "app.navigate('lotes')");
            if (iconOperacoes) iconOperacoes.textContent = 'precision_manufacturing';
            if (iconRebanho) iconRebanho.textContent = 'pets';
            var opLabel2 = navOperacoes.querySelector('span:last-child');
            if (opLabel2) opLabel2.textContent = 'Operações';
            if (labelRebanho) labelRebanho.textContent = 'Rebanho';
            if (navIA) navIA.style.display = '';
            if (labelIA) labelIA.textContent = 'Clara';
        }
    },

    // Toast notification system
    showToast: function (msg, type) {
        var toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;color:white;box-shadow:0 4px 20px rgba(0,0,0,0.25);max-width:90%;text-align:center;animation:toast-in 0.3s var(--ease-out) forwards;';
            document.body.appendChild(toast);
        }
        var bgColor = type === 'error' ? '#D32F2F' : type === 'warning' ? '#FF8F00' : '#2E7D32';
        toast.style.background = bgColor;
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.animation = 'toast-in 0.3s var(--ease-out) forwards';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(function () {
            toast.style.animation = 'toast-out 0.3s var(--ease-out) forwards';
        }, 3000);
    },

    init: function () {
        console.log('AgroMacro v3.1');

        // Load theme immediately for instant visual
        this.loadTheme();
        // Data layer first (localStorage — always available)
        if (window.data) window.data.init();

        // Inicializar nova arquitetura refatorada
        if (window.AuditLog) window.AuditLog.init();
        if (window.WorkManager) window.WorkManager.init();
        if (window.SyncManager) {
            window.SyncManager.init();
            this.setupSyncStatusUpdates();
        }

        // ══ PWA: Registrar Service Worker ══
        this.registerServiceWorker();

        // ══ PWA: Capturar prompt de instalação ══
        var self = this;
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            self._installPrompt = e;
            self.showInstallBanner();
        });

        // Init Firebase Sync — this handles the auth gate
        // After auth, it calls _initModules() via _showApp()
        if (window.firebaseSync) {
            window.firebaseSync.init();
        } else {
            // No Firebase — go straight to app
            this._initModules();
        }
    },

    // Called by firebaseSync._showApp() after auth gate passes
    _initModules: function () {
        if (this._modulesInitialized) return;
        this._modulesInitialized = true;
        [
            'rebanho', 'pastos', 'lotes', 'financeiro', 'estoque', 'manejo', 'obras',
            'funcionarios', 'rebanhoOps', 'pastoMgmt', 'clima', 'nutricao',
            'nutricaoIA', 'zooIndices', 'formulacaoRacao', 'balanca', 'safebeef',
            'calendario', 'contas', 'rastreabilidade', 'indicadores', 'graficos',
            'fotos', 'mapa', 'iaConsultor', 'uxHelpers', 'resultados', 'iaAuditoria'
        ].forEach(function (moduleName) {
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
                window[moduleName].init();
            }
        });

        this.loadConfig();
        this.applyPerfil();
        this.navigate('home');

        setTimeout(function () {
            if (window.iaAuditoria && window.iaAuditoria.executarAuditoria) {
                try {
                    window.iaAuditoria.executarAuditoria();
                } catch (e) { console.warn('[Auto-Auditoria] Erro:', e); }
            }
        }, 3000);
    },

    // ══ PWA — Service Worker Registration ══
    registerServiceWorker: function () {
        if ('serviceWorker' in navigator) {
            var refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', function () {
                if (!refreshing) {
                    refreshing = true;
                    console.log('[PWA] Nova versão! Recarregando...');
                    window.location.reload();
                }
            });
            navigator.serviceWorker.register('./sw.js').then(function (reg) {
                console.log('✅ Service Worker registrado:', reg.scope);
                setInterval(function () { reg.update().catch(function () { }); }, 60000);
                reg.update().catch(function () { });
            }).catch(function (err) {
                console.warn('⚠️ SW falhou:', err);
            });
        }
    },

    // ══ PWA — Install Banner ══
    showInstallBanner: function () {
        // Não mostrar se já foi descartado recentemente
        var dismissed = localStorage.getItem('agromacro_install_dismissed');
        if (dismissed) {
            var diasDesde = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (diasDesde < 7) return;
        }

        var banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.style.cssText = 'position:fixed;bottom:70px;left:12px;right:12px;z-index:9990;'
            + 'background:linear-gradient(135deg,#0F766E,#115E59);border-radius:16px;padding:16px 18px;'
            + 'box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:14px;'
            + 'animation:slideUpBanner 0.4s ease;';

        banner.innerHTML = '<div style="font-size:32px;">📲</div>'
            + '<div style="flex:1;">'
            + '<div style="color:#fff;font-weight:700;font-size:14px;">Instalar AgroMacro</div>'
            + '<div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:2px;">Acesse offline, direto da tela inicial</div>'
            + '</div>'
            + '<button id="pwa-install-btn" style="background:#fff;color:#0F766E;border:none;border-radius:10px;'
            + 'padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;">Instalar</button>'
            + '<button id="pwa-dismiss-btn" style="background:none;border:none;color:rgba(255,255,255,0.6);'
            + 'font-size:20px;cursor:pointer;padding:4px 8px;">✕</button>';

        document.body.appendChild(banner);

        var self = this;
        document.getElementById('pwa-install-btn').addEventListener('click', function () {
            if (self._installPrompt) {
                self._installPrompt.prompt();
                self._installPrompt.userChoice.then(function (result) {
                    console.log('PWA install:', result.outcome);
                    self._installPrompt = null;
                });
            }
            banner.remove();
        });

        document.getElementById('pwa-dismiss-btn').addEventListener('click', function () {
            localStorage.setItem('agromacro_install_dismissed', Date.now().toString());
            banner.remove();
        });
    },


    navigate: function (pageId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(function (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Show target
        var target = document.getElementById('view-' + pageId);
        if (!target) {
            console.error('View not found: view-' + pageId);
            return;
        }

        target.classList.remove('hidden');
        target.classList.add('active');
        this.currentPage = pageId;
        window.scrollTo(0, 0);

        // Update bottom nav active state
        ['nav-home', 'nav-operacoes', 'nav-ia-chefa', 'nav-financeiro', 'nav-rebanho', 'nav-config'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        var navMap = {
            'home': 'nav-home',
            // Rebanho sub-views → nav-rebanho
            'lotes': 'nav-rebanho', 'pastos': 'nav-rebanho',
            'manejo': 'nav-rebanho', 'calendario': 'nav-rebanho', 'rebanho': 'nav-rebanho', 'cabecas': 'nav-rebanho', 'mapa': 'nav-rebanho',
            // Financeiro sub-views → nav-financeiro
            'financeiro': 'nav-financeiro', 'compra': 'nav-financeiro',
            'venda': 'nav-financeiro', 'fluxo': 'nav-financeiro', 'balanco': 'nav-financeiro', 'contas': 'nav-financeiro', 'auditoria': 'nav-financeiro',
            // Operações sub-views → nav-operacoes
            'operacoes': 'nav-operacoes', 'estoque': 'nav-operacoes', 'obras': 'nav-operacoes', 'funcionarios': 'nav-operacoes', 'rastreabilidade': 'nav-operacoes', 'balanca': 'nav-operacoes',
            // Config
            'config': 'nav-config'
        };

        var perfilAtual = this.getPerfil();
        if (perfilAtual === 'peao') {
            navMap.pastos = 'nav-operacoes';
            navMap.estoque = 'nav-operacoes';
            navMap.obras = 'nav-operacoes';
            navMap.manejo = 'nav-rebanho';
        }
        var activeNav = navMap[pageId] || 'nav-home';
        var navEl = document.getElementById(activeNav);
        if (navEl) navEl.classList.add('active');

        // Block views by access profile
        var blockedForPeao = ['financeiro', 'compra', 'venda', 'fluxo', 'balanco', 'contas', 'config'];
        var blockedForAdmin = [];
        if ((perfilAtual === 'peao' && blockedForPeao.indexOf(pageId) >= 0) ||
            (perfilAtual === 'admin' && blockedForAdmin.indexOf(pageId) >= 0)) {
            this.showToast('Acesso restrito ao seu perfil', 'warning');
            return;
        }

        // Render data-driven views
        // ── IA: Update contextual tooltip for this page ──
        if (window.iaConsultor && window.iaConsultor.atualizarContextoTela) {
            window.iaConsultor.atualizarContextoTela(pageId);
        }

        switch (pageId) {
            case 'home':
                this._renderHomeForPerfil();
                this.renderKPIs();
                this.renderAlerts();
                this.renderAtividadeRecente();
                if (window.contas) window.contas.renderCotacaoRebanho();
                if (window.graficos) window.graficos.renderGraficosHome();
                if (window.clima) window.clima.carregarPrevisao();
                if (window.resultados) window.resultados.renderDashboard();
                // IA: Buscar briefing de mercado e gerar insights
                if (window.iaConsultor && window.iaConsultor.buscarBriefingDiario) {
                    window.iaConsultor.buscarBriefingDiario();
                }
                break;
            case 'rebanho':
                if (window.rebanho) window.rebanho.renderList();
                if (window.lotes) {
                    window.lotes.populateSelect('reb-lote');
                    window.lotes.populateSelect('reb-lote-destino');
                }
                break;
            case 'lotes':
                if (window.lotes) window.lotes.renderList();
                this.populatePastosSelect('lote-pasto');
                if (window.estoque) window.estoque.populateLoteNutrition();
                if (window.indicadores) window.indicadores.renderIndicadoresProdutivos();
                break;
            case 'pastos':
                if (window.pastos) window.pastos.renderList();
                break;
            case 'estoque':
                if (window.estoque) window.estoque.render();
                break;
            case 'fluxo':
                if (window.financeiro) window.financeiro.updateFluxoUI();
                if (window.indicadores) window.indicadores.renderIndicadoresFinanceiros();
                break;
            case 'manejo':
                if (window.manejo) window.manejo.renderHistory();
                if (window.lotes) window.lotes.populateSelect('manejo-lote');
                this.populatePastosSelect('manejo-pasto');
                if (window.estoque) window.estoque.renderMaterialCheckboxes('manejo-materials-list', null);
                if (window.estoque) window.estoque.populateManejoProducts();
                break;
            case 'compra':
                if (window.lotes) {
                    window.lotes.populateSelect('compra-lote');
                    window.lotes.populatePastoSelect('compra-pasto');
                }
                break;
            case 'venda':
                if (window.lotes) window.lotes.populateSelect('venda-lote');
                if (window.financeiro && window.financeiro.syncVendaContext) window.financeiro.syncVendaContext();
                break;
            case 'obras':
                if (window.obras) window.obras.renderHistory();
                if (window.estoque) window.estoque.renderMaterialCheckboxes('obra-materials-list', null);
                if (window.funcionarios) window.funcionarios.renderWorkersForObra();
                this.populatePastosSelect('obra-pasto');
                break;
            case 'funcionarios':
                if (window.funcionarios) window.funcionarios.render();
                break;
            case 'balanco':
                if (window.financeiro) window.financeiro.renderBalanco();
                break;
            case 'calendario':
                if (window.calendario) window.calendario.renderCalendarioSanitario();
                break;
            case 'contas':
                if (window.contas) window.contas.renderContasPagar();
                break;
            case 'cabecas':
                if (window.cabecas) window.cabecas.renderList();
                if (window.cabecas) window.cabecas.populateLoteFilter();
                if (window.lotes) window.lotes.populateSelect('cab-lote');
                this.populatePastosSelect('cab-pasto');
                break;
            case 'mapa':
                if (window.mapa) {
                    window.mapa.updateDashboard();
                    window.mapa.renderMap();
                }
                break;
            case 'config':
                this.loadConfig();
                this.loadArrobaPrice();
                if (window.firebaseSync) window.firebaseSync.renderSyncUI('sync-container');
                break;
            case 'auditoria':
                if (window.iaAuditoria) window.iaAuditoria.renderView();
                break;
        }
    },

    populatePastosSelect: function (selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;

        var pastos = [];
        var seen = {};

        // 1. Pastos do mapa (FAZENDA_PASTOS do KML) — prioridade
        if (window.FAZENDA_PASTOS && Array.isArray(window.FAZENDA_PASTOS)) {
            window.FAZENDA_PASTOS.forEach(function (p) {
                var nome = p.nome || '';
                if (nome && !seen[nome.toLowerCase()]) {
                    pastos.push({ nome: nome, area: 0 });
                    seen[nome.toLowerCase()] = true;
                }
            });
        }

        // 2. Pastos do módulo pastos (cadastrados via eventos)
        if (window.pastos && window.pastos.getPastos) {
            window.pastos.getPastos().forEach(function (p) {
                var nome = p.nome || '';
                if (nome && !seen[nome.toLowerCase()]) {
                    pastos.push({ nome: nome, area: p.area || 0 });
                    seen[nome.toLowerCase()] = true;
                }
            });
        }

        // 3. Pastos dos lotes existentes (caso tenha algum não mapeado)
        if (window.lotes && window.lotes.getLotes) {
            window.lotes.getLotes().forEach(function (l) {
                var pasto = l.pasto || '';
                if (pasto && !seen[pasto.toLowerCase()]) {
                    pastos.push({ nome: pasto, area: 0 });
                    seen[pasto.toLowerCase()] = true;
                }
            });
        }

        // 4. Pastos manuais (localStorage)
        try {
            var manuais = JSON.parse(localStorage.getItem('agromacro_pastos_manuais') || '[]');
            manuais.forEach(function (nome) {
                if (nome && !seen[nome.toLowerCase()]) {
                    pastos.push({ nome: nome, area: 0 });
                    seen[nome.toLowerCase()] = true;
                }
            });
        } catch (e) { }

        // Ordenar por nome
        pastos.sort(function (a, b) { return a.nome.localeCompare(b.nome); });

        var _esc = this._escapeHtml;
        var html = '<option value="">Selecionar Pasto...</option>';
        pastos.forEach(function (p) {
            var n = _esc(p.nome);
            html += '<option value="' + n + '">' + n + (p.area > 0 ? ' (' + p.area + ' ha)' : '') + '</option>';
        });
        html += '<option value="__novo__">➕ Novo pasto...</option>';
        select.innerHTML = html;
    },

    renderKPIs: function () {
        var container = document.getElementById('kpi-grid');
        if (!container || !window.data) return;

        var events = window.data.events;

        // Get active lotes (use last event per lote name)
        var lotesMap = {};
        var totalPastos = 0;
        var pastosSet = {};

        events.forEach(function (ev) {
            if (ev.type === 'LOTE') {
                lotesMap[ev.nome] = ev;
            }
            if (ev.type === 'PASTO' && !pastosSet[ev.nome]) {
                pastosSet[ev.nome] = true;
                totalPastos++;
            }
        });

        var totalAnimais = 0;
        var totalLotes = 0;
        var pesoTotal = 0;
        var pesados = 0;

        for (var nome in lotesMap) {
            var lote = lotesMap[nome];
            if (lote.status === 'ATIVO') {
                totalLotes++;
                var qtd = lote.qtdAnimais || 0;
                totalAnimais += qtd;
                if (lote.pesoMedio && qtd > 0) {
                    pesoTotal += lote.pesoMedio * qtd;
                    pesados += qtd;
                }
            }
        }

        var pesoMedio = pesados > 0 ? (pesoTotal / pesados).toFixed(0) : '--';
        // 1@ vivo = 30 kg (15 kg só após abate)
        var pesoArrobas = pesados > 0 ? (pesoTotal / pesados / 30).toFixed(1) : '--';
        var totalArrobas = pesoTotal > 0 ? (pesoTotal / 30) : 0;

        // Valor do rebanho em pé (@ total × preço da @)
        var precoArroba = window.contas ? window.contas.getPrecoArroba() : 0;
        var valorRebanho = totalArrobas * precoArroba;

        // Get projeção summary
        var projStr = '';
        if (window.indicadores && window.indicadores.calcProjecaoReceita) {
            try {
                var proj = window.indicadores.calcProjecaoReceita();
                if (proj.totalReceita > 0) {
                    projStr = '<div class="kpi-card"><div class="kpi-label">📈 Receita Proj.</div><div class="kpi-value positive">R$ ' + proj.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '</div></div>'
                        + '<div class="kpi-card"><div class="kpi-label">' + (proj.totalLucro >= 0 ? '✅' : '🚨') + ' Lucro Proj.</div><div class="kpi-value ' + (proj.totalLucro >= 0 ? 'positive' : 'negative') + '">R$ ' + proj.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '</div></div>';
                }
            } catch (e) { /* ignore */ }
        }

        container.innerHTML = ''
            + '<div class="kpi-card"><div class="kpi-label">Rebanho</div><div class="kpi-value positive">' + totalAnimais + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value">' + totalLotes + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pastos</div><div class="kpi-value">' + totalPastos + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedio + ' kg</div><div style="font-size:11px;color:var(--text-2,#6B7280);font-weight:600;margin-top:2px;">@ ' + pesoArrobas + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">@ Total Rebanho</div><div class="kpi-value">' + totalArrobas.toFixed(0) + ' @</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">💰 Valor Rebanho</div><div class="kpi-value ' + (valorRebanho > 0 ? 'positive' : '') + '">' + (valorRebanho > 0 ? 'R$ ' + valorRebanho.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Definir @ em Config') + '</div></div>'
            + projStr;
    },

    renderAlerts: function () {
        var container = document.getElementById('alerts-list');
        if (!container || !window.data) return;

        var alerts = [];
        var events = window.data.events;
        var hoje = new Date().toISOString().split('T')[0];

        // ══ 1. Animais sem lote ══
        var semLote = events.filter(function (ev) {
            return ev.type === 'ANIMAL' && ev.status !== 'VENDIDO' && !ev.lote;
        }).length;
        if (semLote > 0) alerts.push({ icon: '🐄', msg: semLote + ' animais sem lote atribuído', type: 'warning' });

        // ══ 2. Pastos em descanso ══
        var descanso = events.filter(function (ev) {
            return ev.type === 'PASTO' && ev.statusPasto === 'descanso';
        }).length;
        if (descanso > 0) alerts.push({ icon: '🌾', msg: descanso + ' pastos em descanso', type: 'info' });

        // ══ 3. Estoque acabando (< 20% do último registro) ══
        if (window.estoque && window.estoque.getSaldos) {
            try {
                var saldos = window.estoque.getSaldos();
                if (saldos && typeof saldos === 'object') {
                    Object.keys(saldos).forEach(function (item) {
                        var s = saldos[item];
                        if (s && s.saldo !== undefined && s.saldo <= 10 && s.saldo >= 0) {
                            alerts.push({ icon: '📦', msg: item + ' — estoque baixo: ' + s.saldo.toFixed(1) + ' kg', type: 'danger' });
                        }
                    });
                }
            } catch (e) { /* ignore */ }
        }

        // ══ 3b. Pasto superlotado (UA/ha > 3.0) ══
        if (window.pastos && window.pastos.getPastos) {
            try {
                var pastosData = window.pastos.getPastos();
                var lotesMap = {};
                events.forEach(function (ev) {
                    if (ev.type === 'LOTE' && ev.status === 'ATIVO') lotesMap[ev.nome] = ev;
                });
                pastosData.forEach(function (p) {
                    if (!p.area || p.area <= 0) return;
                    var animaisNoPasto = 0;
                    for (var nome in lotesMap) {
                        if (lotesMap[nome].pasto === p.nome) {
                            animaisNoPasto += (lotesMap[nome].qtdAnimais || 0);
                        }
                    }
                    if (animaisNoPasto > 0) {
                        var ua = animaisNoPasto * 0.75; // Estimativa: 1 cabeça ≈ 0.75 UA
                        var uaHa = ua / p.area;
                        if (uaHa > 3.0) {
                            alerts.push({ icon: '🚨', msg: p.nome + ' superlotado: ' + uaHa.toFixed(1) + ' UA/ha (máx 3.0)', type: 'danger' });
                        }
                    }
                });
            } catch (e) { /* ignore */ }
        }

        // ══ 4. Contas vencidas ══
        var contasVencidas = events.filter(function (ev) {
            return ev.type === 'CONTA_PAGAR' && !ev.pago && ev.vencimento && ev.vencimento < hoje;
        });
        if (contasVencidas.length > 0) {
            var totalVencido = 0;
            contasVencidas.forEach(function (c) { totalVencido += (c.value || 0); });
            alerts.push({ icon: '💸', msg: contasVencidas.length + ' contas vencidas (R$ ' + totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ')', type: 'danger' });
        }

        // ══ 5. Vacinas vencidas / próximas ══
        if (window.calendario && window.calendario.getProximasVacinas) {
            try {
                var vacinas = window.calendario.getProximasVacinas();
                var vencidas = 0;
                var proximaSemana = 0;
                vacinas.forEach(function (v) {
                    if (v.status === 'vencida') vencidas++;
                    else if (v.status === 'alerta') proximaSemana++;
                });
                if (vencidas > 0) alerts.push({ icon: '💉', msg: vencidas + ' vacinas VENCIDAS — ação imediata!', type: 'danger' });
                if (proximaSemana > 0) alerts.push({ icon: '💉', msg: proximaSemana + ' vacinas próximas do vencimento', type: 'warning' });
            } catch (e) { /* ignore */ }
        }

        // ══ 6. Carência ativa (lotes com restrição de venda) ══
        if (window.calendario && window.calendario.getCarenciaAtiva) {
            try {
                var lotes = window.lotes ? window.lotes.getLotes() : [];
                lotes.forEach(function (l) {
                    var carencia = window.calendario.getCarenciaAtiva(l.nome || l.name);
                    if (carencia) {
                        alerts.push({ icon: '🚫', msg: (l.nome || l.name) + ' em carência até ' + carencia.dataLiberacao + ' (' + carencia.produto + ')', type: 'danger' });
                    }
                });
            } catch (e) { /* ignore */ }
        }

        // ══ 7. Tarefas IATF do dia ══
        if (window.calendario && window.calendario.getTarefasDoDia) {
            try {
                var tarefas = window.calendario.getTarefasDoDia();
                if (tarefas.length > 0) {
                    alerts.push({ icon: '🧬', msg: tarefas.length + ' tarefa(s) IATF para hoje!', type: 'warning' });
                }
            } catch (e) { /* ignore */ }
        }

        // ══ 8. Lotes sem pesagem recente (>60 dias) ══
        if (window.lotes) {
            try {
                var lotesAtivos = window.lotes.getLotes();
                lotesAtivos.forEach(function (l) {
                    var loteNome = l.nome || l.name;
                    var pesagens = events.filter(function (ev) {
                        return ev.type === 'PESAGEM' && ev.lote === loteNome;
                    });
                    if (pesagens.length > 0) {
                        var ultima = pesagens.sort(function (a, b) { return new Date(b.date) - new Date(a.date); })[0];
                        var dias = Math.floor((new Date() - new Date(ultima.date)) / (1000 * 60 * 60 * 24));
                        if (dias > 60) {
                            alerts.push({ icon: '⚖️', msg: loteNome + ' sem pesagem há ' + dias + ' dias', type: 'warning' });
                        }
                    }
                });
            } catch (e) { /* ignore */ }
        }

        // ══ 9. Produtos vencidos / vencendo ══
        if (window.estoque && window.estoque.getVencimentos) {
            try {
                var vencimentos = window.estoque.getVencimentos();
                vencimentos.forEach(function (v) {
                    if (v.vencido) {
                        alerts.push({ icon: '⏰', msg: v.nome + ' — VENCIDO em ' + new Date(v.dataStr + 'T00:00:00').toLocaleDateString('pt-BR'), type: 'danger' });
                    } else if (v.diasRestantes <= 7) {
                        alerts.push({ icon: '⏰', msg: v.nome + ' — vence em ' + v.diasRestantes + ' dia(s)!', type: 'danger' });
                    } else {
                        alerts.push({ icon: '⏰', msg: v.nome + ' — vence em ' + v.diasRestantes + ' dias (' + new Date(v.dataStr + 'T00:00:00').toLocaleDateString('pt-BR') + ')', type: 'warning' });
                    }
                });
            } catch (e) { /* ignore */ }
        }

        // ══ 10. Anomalias de auditoria pendentes ══
        if (window.iaAuditoria) {
            try {
                var anomalias = events.filter(function (ev) {
                    return ev.type === 'ANOMALIA' && ev.status === 'PENDENTE';
                });
                if (anomalias.length > 0) {
                    var altas = anomalias.filter(function (a) { return a.severidade === 'ALTA'; }).length;
                    var medias = anomalias.filter(function (a) { return a.severidade === 'MEDIA'; }).length;
                    var baixas = anomalias.filter(function (a) { return a.severidade !== 'ALTA' && a.severidade !== 'MEDIA'; }).length;
                    var partes = [];
                    if (altas > 0) partes.push(altas + ' alta(s)');
                    if (medias > 0) partes.push(medias + ' media(s)');
                    if (baixas > 0) partes.push(baixas + ' baixa(s)');
                    alerts.push({
                        icon: '🛡',
                        msg: anomalias.length + ' anomalia(s) pendente(s) na auditoria: ' + partes.join(', '),
                        type: altas > 0 ? 'danger' : 'warning',
                        onclick: "window.app.navigate('auditoria')"
                    });
                }
            } catch (e) { }
        }

        // ══ Sem alertas ══
        if (alerts.length === 0) {
            alerts.push({ icon: '✅', msg: 'Tudo em dia! Nenhum alerta no momento.', type: 'ok' });
        }

        // ══ Render ══
        var typeColors = {
            danger: 'var(--accent-red, #EF4444)',
            warning: 'var(--accent-yellow, #FBBF24)',
            info: 'var(--accent-blue, #3B82F6)',
            ok: 'var(--accent-green, #22C55E)'
        };

        container.innerHTML = alerts.map(function (a) {
            var borderColor = typeColors[a.type] || typeColors.info;
            var clickAttr = a.onclick ? ' onclick="' + a.onclick + '" style="border-left:3px solid ' + borderColor + ';cursor:pointer;"' : ' style="border-left:3px solid ' + borderColor + ';"';
            return '<div class="alert-item"' + clickAttr + '>' +
                '<span class="alert-icon">' + a.icon + '</span>' +
                '<span>' + a.msg + '</span>' +
                '</div>';
        }).join('');
    },

    // ── Atividade Recente (Feed na Home) ──
    renderAtividadeRecente: function () {
        var container = document.getElementById('atividade-recente');
        if (!container || !window.data) return;

        var events = window.data.events.slice().reverse().slice(0, 8);
        if (events.length === 0) {
            container.innerHTML = '';
            return;
        }

        var typeMap = {
            'COMPRA': { icon: '🛒', label: 'Compra', color: '#0F766E' },
            'VENDA': { icon: '💵', label: 'Venda', color: '#059669' },
            'CABECA': { icon: '🐄', label: 'Animal', color: '#2563EB' },
            'LOTE': { icon: '🏷️', label: 'Lote', color: '#7C3AED' },
            'PASTO': { icon: '🌿', label: 'Pasto', color: '#16A34A' },
            'MANEJO': { icon: '💉', label: 'Manejo', color: '#DC2626' },
            'MANEJO_SANITARIO': { icon: '💊', label: 'Manejo', color: '#DC2626' },
            'ESTOQUE_ENTRADA': { icon: '📦', label: 'Estoque', color: '#D97706' },
            'OBRA_REGISTRO': { icon: '🔨', label: 'Obra', color: '#92400E' },
            'CONTA_PAGAR': { icon: '📋', label: 'Conta', color: '#EF4444' },
            'PESAGEM': { icon: '⚖️', label: 'Pesagem', color: '#0EA5E9' },
            'CHUVA': { icon: '🌧️', label: 'Chuva', color: '#3B82F6' }
        };

        var fmt = function (d) {
            if (!d) return '--';
            var parts = d.split('T')[0].split('-');
            return parts.length === 3 ? parts[2] + '/' + parts[1] : d;
        };

        var html = '<div class="kpi-title">Atividade Recente</div>';
        events.forEach(function (ev) {
            var info = typeMap[ev.type] || { icon: '📌', label: ev.type, color: '#64748B' };
            var desc = ev.nome || ev.name || ev.desc || ev.brinco || ev.tipo || '';
            var val = '';
            if (ev.value) val = 'R$ ' + parseFloat(ev.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            else if (ev.qty) val = ev.qty + ' ' + (ev.unit || 'un');
            else if (ev.peso) val = ev.peso + ' kg';
            else if (ev.cabecas) val = ev.cabecas + ' cab';

            html += '<div class="history-card" style="border-left:3px solid ' + info.color + ';">' +
                '<div class="history-card-header">' +
                '<span style="font-size:13px;font-weight:600;">' + info.icon + ' ' + (desc || info.label) + '</span>' +
                '<span class="date">' + fmt(ev.date) + '</span>' +
                '</div>' +
                (val ? '<div class="history-card-body"><span style="font-size:12px;color:var(--text-2);">' + info.label + '</span><strong style="font-size:13px;">' + val + '</strong></div>' : '') +
                '</div>';
        });

        container.innerHTML = html;
    },

    resetData: function () {
        if (confirm('Tem certeza que deseja APAGAR todos os dados?\n\nEsta ação não pode ser desfeita.')) {
            if (window.data) {
                window.data.resetAll();
                window.app.showToast('Dados apagados com sucesso!', 'success');
                location.reload();
            }
        }
    },

    // ══ PERFIL DE ACESSO (Peão / Admin / Dono) ══
    getPerfil: function () {
        try {
            return this.normalizePerfil(localStorage.getItem(this.PERFIL_KEY) || 'admin');
        } catch (e) { return 'admin'; }
    },

    setPerfil: function (perfil) {
        var perfilNormalizado = this.normalizePerfil(perfil);
        try {
            localStorage.setItem(this.PERFIL_KEY, perfilNormalizado);
        } catch (e) { /* ignore */ }
        this.applyPerfil();
        this.navigate('home');
        var msg = perfilNormalizado === 'peao'
            ? 'Modo Peao ativado'
            : perfilNormalizado === 'dono'
                ? 'Modo Dono ativado'
                : 'Modo Admin ativado';
        this.showToast(msg, 'success');
    },

    applyPerfil: function () {
        var body = document.body;
        body.classList.remove('perfil-gerencia', 'perfil-campo', 'perfil-peao', 'perfil-admin', 'perfil-dono');

        // Check Firebase profile first
        var perfil = 'admin';
        if (window.firebaseSync && window.firebaseSync.user) {
            perfil = this.normalizePerfil(window.firebaseSync.getUserPerfil());

            // Load async to update if needed
            var self = this;
            window.firebaseSync.loadUserPerfil(function (asyncPerfil) {
                var perfilAsync = self.normalizePerfil(asyncPerfil);
                if (perfilAsync !== perfil) {
                    self._enforceProfile(perfilAsync);
                }
            });
        }

        this._enforceProfile(perfil);
    },

    _enforceProfile: function (perfil) {
        perfil = this.normalizePerfil(perfil);
        var body = document.body;
        body.classList.remove('perfil-gerencia', 'perfil-campo', 'perfil-peao', 'perfil-admin', 'perfil-dono');
        body.classList.add('perfil-' + perfil);

        // Backward-compat CSS classes
        if (perfil === 'peao') {
            body.classList.add('perfil-campo');
        } else if (perfil === 'admin') {
            body.classList.add('perfil-gerencia');
        }

        this._configureBottomNavByPerfil(perfil);

        // ░░ Manage home visibility for 3 perfis ░░
        var homePeao = document.getElementById('home-peao');
        var homeAdmin = document.getElementById('home-admin');
        var homeDono = document.getElementById('home-dono');

        // Hide all homes first
        if (homePeao) homePeao.style.display = 'none';
        if (homeAdmin) homeAdmin.style.display = 'none';
        if (homeDono) homeDono.style.display = 'none';

        // Show the correct home based on perfil
        if (perfil === 'peao') {
            if (homePeao) homePeao.style.display = 'block';
            // Para peões mantemos os cards visíveis, o restante segue o layout do home peão.
        } else if (perfil === 'admin') {
            if (homeAdmin) homeAdmin.style.display = 'block';
            // Show all elements for admin
            document.querySelectorAll('.gerencia-only').forEach(function (el) {
                el.style.display = '';
            });
        } else if (perfil === 'dono') {
            if (homeDono) homeDono.style.display = 'block';
            // Show all elements for dono (total control)
            document.querySelectorAll('.gerencia-only').forEach(function (el) {
                el.style.display = '';
            });
        }

        // Update greeting for specific homes
        this._updateGreetingsForPerfil(perfil);
    },

    _updateGreetingsForPerfil: function (perfil) {
        var now = new Date();
        var hour = now.getHours();
        var greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
        var weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        var dayName = weekDays[now.getDay()];
        var date = now.getDate();
        var months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        var month = months[now.getMonth()];
        var dateStr = dayName + ', ' + date + ' de ' + month;

        if (perfil === 'peao') {
            var peaoGreet = document.getElementById('peao-greeting-text');
            var peaoDate = document.getElementById('peao-greeting-date');
            if (peaoGreet) peaoGreet.textContent = greeting;
            if (peaoDate) peaoDate.textContent = dateStr;
        } else if (perfil === 'admin') {
            var adminGreet = document.getElementById('admin-greeting-text');
            var adminDate = document.getElementById('admin-greeting-date');
            if (adminGreet) adminGreet.textContent = greeting + ', Gerente!';
            if (adminDate) adminDate.textContent = dateStr;
        } else if (perfil === 'dono') {
            var donoGreet = document.getElementById('dono-greeting-text');
            var donoDate = document.getElementById('dono-greeting-date');
            if (donoGreet) donoGreet.textContent = greeting + ', Proprietário';
            if (donoDate) donoDate.textContent = dateStr;
        }
    },

    // ── Config persistence ──
    CONFIG_KEY: 'agromacro_config',

    saveConfig: function () {
        var config = {
            nomeFazenda: document.getElementById('config-nome-fazenda') ? document.getElementById('config-nome-fazenda').value : '',
            proprietario: document.getElementById('config-proprietario') ? document.getElementById('config-proprietario').value : '',
            cidade: document.getElementById('config-cidade') ? document.getElementById('config-cidade').value : '',
            estado: document.getElementById('config-estado') ? document.getElementById('config-estado').value : '',
            area: document.getElementById('config-area') ? document.getElementById('config-area').value : ''
        };
        try {
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));

            // Sync config to Firestore
            if (window.firebaseSync && window.firebaseSync.db && window.firebaseSync.fazendaId) {
                window.firebaseSync.db.collection('fazendas').doc(window.firebaseSync.fazendaId).update({
                    config: config,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(function (e) { console.warn('[Config] Firestore sync failed:', e); });
            }
        } catch (e) {
            console.error('Erro ao salvar config:', e);
        }
    },

    // ── Arroba price persistence ──
    saveArrobaPrice: function () {
        var input = document.getElementById('config-preco-arroba');
        if (!input) return;
        var preco = parseFloat(input.value) || 0;
        try {
            localStorage.setItem('agromacro_preco_arroba', preco);
            // Also save in config for indicadores.js compatibility
            var config = JSON.parse(localStorage.getItem(this.CONFIG_KEY) || '{}');
            config.precoArroba = preco;
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
        } catch (e) { console.error('Erro ao salvar arroba:', e); }
        this.showToast('✅ Preço da @ atualizado: R$ ' + preco.toFixed(2));
    },

    _renderHomeForPerfil: function () {
        var perfil = this.getPerfil();
        
        // Render peão-specific home alerts
        if (perfil === 'peao') {
            var alertsList = document.getElementById('peao-alerts-list');
            if (alertsList && window.data && window.data.alerts) {
                var criticalAlerts = window.data.alerts.filter(function (a) {
                    return a.type === 'warning' || a.type === 'error';
                }).slice(0, 4);
                
                alertsList.innerHTML = criticalAlerts.length > 0
                    ? criticalAlerts.map(function (a) {
                        var icon = a.type === 'error' ? '❌' : '⚠️';
                        return '<div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;border-radius:6px;padding:8px 10px;font-size:12px;">' +
                            '<span style="font-weight:700;">' + icon + ' ' + (a.msg || 'Alerta') + '</span>' +
                            '</div>';
                    }).join('')
                    : '<div style="text-align:center;color:var(--text-3);font-size:12px;padding:10px;">✓ Nenhum alerta crítico</div>';
            }
        }
        
        // Render dono-specific dashboard
        if (perfil === 'dono') {
            // KPIs for dono
            var donoKpis = document.getElementById('dono-kpis');
            if (donoKpis && window.data) {
                var kpiData = {
                    'Membros': (window.data.membros || []).length,
                    'Fazendas': 1,
                    'Rentabilidade': '----',
                    'Status': '✓ OK'
                };
                donoKpis.innerHTML = Object.keys(kpiData).map(function (key) {
                    return '<div class="dono-kpi-card">' +
                        '<span class="dono-kpi-value">' + kpiData[key] + '</span>' +
                        '<span class="dono-kpi-label">' + key + '</span>' +
                        '</div>';
                }).join('');
            }
            
            // Recent activities for dono
            var donoActivities = document.getElementById('dono-recent-activities');
            if (donoActivities && window.data) {
                var recentEvents = window.data.events.slice().reverse().slice(0, 6);
                donoActivities.innerHTML = recentEvents.length > 0
                    ? recentEvents.map(function (ev) {
                        var fmt = function (d) { 
                            if (!d) return '--'; 
                            var parts = d.split('T')[0].split('-');
                            return parts.length === 3 ? parts[2] + '/' + parts[1] : d;
                        };
                        return '<div class="dono-activity-item">' +
                            '<div style="font-weight:600;">' + (ev.nome || ev.desc || 'Atividade') + '</div>' +
                            '<span class="dono-activity-time">' + fmt(ev.date) + '</span>' +
                            '</div>';
                    }).join('')
                    : '<div style="text-align:center;color:var(--text-3);font-size:12px;padding:10px;">Sem atividades</div>';
            }
        }
    },

    // ══ Theme System ══
    THEME_KEY: 'agromacro_theme',

    normalizeTheme: function (mode) {
        var value = (mode || '').toLowerCase();
        if (value === 'dark') return 'escuro';
        if (value === 'light') return 'claro';
        if (value === 'auto') return 'claro';
        if (value === 'branco' || value === 'claro' || value === 'escuro') return value;
        return 'claro';
    },

    setTheme: function (mode) {
        // mode: 'branco', 'claro', 'escuro'
        var normalized = this.normalizeTheme(mode);
        localStorage.setItem(this.THEME_KEY, normalized);
        this._applyTheme(normalized);
        this._updateThemeToggleUI(normalized);
        this.showToast(
            normalized === 'escuro'
                ? '🌙 Tema escuro ativado'
                : normalized === 'branco'
                    ? '🤍 Tema branco ativado'
                    : '☀️ Tema claro ativado'
        );
    },

    loadTheme: function () {
        var mode = this.normalizeTheme(localStorage.getItem(this.THEME_KEY) || 'claro');
        this._applyTheme(mode);
        // Update toggle UI after DOM is ready
        var self = this;
        setTimeout(function () { self._updateThemeToggleUI(mode); }, 200);
    },

    _applyTheme: function (mode) {
        var normalized = this.normalizeTheme(mode);
        var html = document.documentElement;
        html.setAttribute('data-theme', normalized);

        // Update theme-color meta for mobile browser chrome
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            if (normalized === 'escuro') meta.content = '#000000';
            else if (normalized === 'branco') meta.content = '#FFFFFF';
            else meta.content = '#F2F2F7';
        }
    },

    _updateThemeToggleUI: function (mode) {
        var btns = document.querySelectorAll('#theme-toggle .theme-opt');
        btns.forEach(function (btn) {
            var isActive = btn.getAttribute('data-theme') === mode;
            btn.style.background = isActive ? 'var(--primary)' : 'transparent';
            btn.style.color = isActive ? 'white' : 'var(--text-2)';
            btn.style.borderRadius = 'var(--radius-xs)';
        });
    },

    loadArrobaPrice: function () {
        var input = document.getElementById('config-preco-arroba');
        if (!input) return;
        var preco = parseFloat(localStorage.getItem('agromacro_preco_arroba')) || 0;
        if (preco > 0) input.value = preco;
    },

    loadConfig: function () {
        try {
            var raw = localStorage.getItem(this.CONFIG_KEY);
            if (!raw) return;
            var config = JSON.parse(raw);

            var fields = {
                'config-nome-fazenda': config.nomeFazenda,
                'config-proprietario': config.proprietario,
                'config-cidade': config.cidade,
                'config-estado': config.estado,
                'config-area': config.area
            };

            for (var id in fields) {
                var el = document.getElementById(id);
                if (el && fields[id]) el.value = fields[id];
            }

            // Update header with farm name
            if (config.nomeFazenda) {
                var h1 = document.querySelector('.top-header h1');
                if (h1) h1.textContent = config.nomeFazenda;
            }
        } catch (e) {
            console.error('Erro ao carregar config:', e);
        }
    },

    exportData: function () {
        var allData = {
            config: {},
            events: window.data ? window.data.events : [],
            exportDate: new Date().toISOString(),
            version: 'AgroMacro v2.0'
        };

        try {
            var raw = localStorage.getItem(this.CONFIG_KEY);
            if (raw) allData.config = JSON.parse(raw);
        } catch (e) { }

        var blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'agromacro_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('📤 Dados exportados com sucesso!', 'success');
    },

    importData: function (event) {
        var self = this;
        var file = event.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var imported = JSON.parse(e.target.result);

                // Validar
                if (!imported.events && !imported.config) {
                    self.showToast('❌ Arquivo inválido. Use um backup do AgroMacro.', 'error');
                    return;
                }

                var numEvents = imported.events ? imported.events.length : 0;
                var msg = '📥 Importar ' + numEvents + ' registros?\n\nIsso vai SUBSTITUIR todos os dados atuais neste dispositivo.\n\nData do backup: ' + (imported.exportDate || 'desconhecida');

                if (!confirm(msg)) {
                    self.showToast('Importação cancelada.', 'error');
                    return;
                }

                // Importar config
                if (imported.config) {
                    localStorage.setItem(self.CONFIG_KEY, JSON.stringify(imported.config));
                }

                // Importar eventos
                if (imported.events && window.data) {
                    window.data.events = imported.events;
                    window.data.save();
                }

                // Importar config IA se existir
                if (imported.iaConfig) {
                    localStorage.setItem('agromacro_ia_config', JSON.stringify(imported.iaConfig));
                }

                self.showToast('✅ ' + numEvents + ' registros importados com sucesso!', 'success');

                // Recarregar a página para aplicar tudo
                setTimeout(function () {
                    location.reload();
                }, 1500);

            } catch (err) {
                self.showToast('❌ Erro ao ler arquivo: ' + err.message, 'error');
            }
        };

        reader.readAsText(file);
        // Limpar input para poder selecionar o mesmo arquivo novamente
        event.target.value = '';
    },

    setupSyncStatusUpdates: function() {
        var self = this;
        var updateSyncStatus = function() {
            var statusElement = document.getElementById('sync-status-display');
            if (!statusElement) return;
            if (!window.SyncManager) { statusElement.textContent = 'SyncManager nao disponivel'; return; }
            var status = window.SyncManager.getStatus();
            var config = window.SyncManager.getConfig();
            var isOnline = window.SyncManager.isOnline();
            var statusText = 'Status: ' + (status.status || 'idle');
            if (!isOnline) statusText += ' (Offline)';
            if (config.enabled) statusText += ' | Habilitado';
            if (status.lastSync) statusText += ' | Ultima: ' + new Date(status.lastSync).toLocaleString();
            if (status.eventsSynced > 0) statusText += ' | Eventos: ' + status.eventsSynced;
            statusElement.textContent = statusText;
        };
        updateSyncStatus();
        setInterval(updateSyncStatus, 30000);
        window.addEventListener('online', updateSyncStatus);
        window.addEventListener('offline', updateSyncStatus);
    },
};

document.addEventListener('DOMContentLoaded', function () {
    window.app.init();
});
