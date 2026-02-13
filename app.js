// ====== APP.JS — AgroMacro Controller ======
window.app = {
    currentPage: 'home',

    // Toast notification system
    showToast: function (msg, type) {
        var toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;color:white;box-shadow:0 4px 20px rgba(0,0,0,0.25);transition:opacity 0.3s,transform 0.3s;max-width:90%;text-align:center;';
            document.body.appendChild(toast);
        }
        var bgColor = type === 'error' ? '#D32F2F' : type === 'warning' ? '#FF8F00' : '#2E7D32';
        toast.style.background = bgColor;
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 3000);
    },

    init: function () {
        console.log('AgroMacro v2.0');

        // Data layer first
        if (window.data) window.data.init();

        // Feature modules
        if (window.rebanho) window.rebanho.init();
        if (window.pastos) window.pastos.init();
        if (window.lotes) window.lotes.init();
        if (window.financeiro) window.financeiro.init();
        if (window.estoque) window.estoque.init();
        if (window.manejo) window.manejo.init();
        if (window.obras) window.obras.init();
        if (window.funcionarios) window.funcionarios.init();
        if (window.rebanhoOps) window.rebanhoOps.init();
        if (window.pastoMgmt) window.pastoMgmt.init();
        if (window.clima) window.clima.init();
        if (window.nutricao) window.nutricao.init();
        if (window.balanca) window.balanca.init();
        if (window.safebeef) window.safebeef.init();
        if (window.calendario) window.calendario.init();
        if (window.contas) window.contas.init();
        if (window.rastreabilidade) window.rastreabilidade.init();
        if (window.indicadores) window.indicadores.init();
        if (window.genetica) window.genetica.init();

        this.loadConfig();
        this.navigate('home');
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
        document.querySelectorAll('.bottom-nav .nav-item').forEach(function (btn) {
            btn.classList.remove('active');
        });
        var navMap = {
            'home': 'nav-home',
            // Rebanho hub + sub-views
            'rebanho-hub': 'nav-rebanho', 'lotes': 'nav-rebanho', 'pastos': 'nav-rebanho',
            'manejo': 'nav-rebanho', 'calendario': 'nav-rebanho', 'rebanho': 'nav-rebanho', 'cabecas': 'nav-rebanho',
            'genetica': 'nav-rebanho',
            // Financeiro hub + sub-views
            'financeiro-hub': 'nav-financeiro', 'financeiro': 'nav-financeiro', 'compra': 'nav-financeiro',
            'venda': 'nav-financeiro', 'fluxo': 'nav-financeiro', 'balanco': 'nav-financeiro', 'contas': 'nav-financeiro',
            // Operações hub + sub-views
            'operacoes-hub': 'nav-operacoes', 'estoque': 'nav-operacoes', 'obras': 'nav-operacoes', 'funcionarios': 'nav-operacoes',
            // Config
            'config': 'nav-config'
        };
        var activeNav = navMap[pageId] || 'nav-home';
        var navEl = document.getElementById(activeNav);
        if (navEl) navEl.classList.add('active');

        // Render data-driven views
        switch (pageId) {
            case 'home':
                this.renderKPIs();
                this.renderAlerts();
                if (window.contas) window.contas.renderCotacaoRebanho();
                if (window.graficos) window.graficos.renderGraficosHome();
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
                if (window.estoque) window.estoque.renderMaterialCheckboxes('manejo-materials-list', 'remedios');
                if (window.estoque) window.estoque.populateManejoProducts();
                break;
            case 'compra':
                if (window.lotes) window.lotes.populateSelect('compra-lote');
                break;
            case 'venda':
                if (window.lotes) window.lotes.populateSelect('venda-lote');
                break;
            case 'obras':
                if (window.estoque) window.estoque.renderMaterialCheckboxes('obra-materials-list', 'obras');
                if (window.funcionarios) window.funcionarios.renderWorkersForObra();
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
            case 'config':
                this.loadConfig();
                break;
            case 'genetica':
                if (window.genetica) window.genetica.render();
                break;
        }
    },

    populatePastosSelect: function (selectId) {
        var select = document.getElementById(selectId);
        if (!select || !window.pastos) return;
        var pastosData = window.pastos.getPastos();
        var html = '<option value="">Selecionar...</option>';
        pastosData.forEach(function (p) {
            html += '<option value="' + p.nome + '">' + p.nome + ' (' + (p.area || 0) + ' ha)</option>';
        });
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

        // Get projeção summary
        var projStr = '';
        if (window.indicadores && window.indicadores.calcProjecaoReceita) {
            try {
                var proj = window.indicadores.calcProjecaoReceita();
                if (proj.totalReceita > 0) {
                    projStr = '<div class="kpi-card"><div class="kpi-label">📈 Receita Proj.</div><div class="kpi-value positive">R$ ' + (proj.totalReceita / 1000).toFixed(0) + 'k</div></div>'
                        + '<div class="kpi-card"><div class="kpi-label">' + (proj.totalLucro >= 0 ? '✅' : '🚨') + ' Lucro Proj.</div><div class="kpi-value ' + (proj.totalLucro >= 0 ? 'positive' : 'negative') + '">R$ ' + (proj.totalLucro / 1000).toFixed(0) + 'k</div></div>';
                }
            } catch (e) { /* ignore */ }
        }

        container.innerHTML = ''
            + '<div class="kpi-card"><div class="kpi-label">Rebanho</div><div class="kpi-value positive">' + totalAnimais + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value">' + totalLotes + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pastos</div><div class="kpi-value">' + totalPastos + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedio + ' kg</div></div>'
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
            return '<div class="alert-item" style="border-left:3px solid ' + borderColor + ';">' +
                '<span class="alert-icon">' + a.icon + '</span>' +
                '<span>' + a.msg + '</span>' +
                '</div>';
        }).join('');
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
        } catch (e) {
            console.error('Erro ao salvar config:', e);
        }
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
        this.showToast('Dados exportados com sucesso!', 'success');
    }
};

document.addEventListener('DOMContentLoaded', function () {
    window.app.init();
});
