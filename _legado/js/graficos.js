// ====== MÓDULO: GRÁFICOS (Dashboard Home — Chart.js) ======
window.graficos = {
    charts: {},

    init: function () {
        console.log('Graficos Module Ready');
    },

    // ══ RENDER GRÁFICOS NA HOME ══
    renderGraficosHome: function () {
        var container = document.getElementById('graficos-home');
        if (!container || !window.data) return;

        var events = window.data.events;

        // ─── Montar dados ───
        var lotes = window.lotes ? window.lotes.getLotes() : [];
        var vendas = events.filter(function (ev) { return ev.type === 'VENDA'; });
        var compras = events.filter(function (ev) { return ev.type === 'COMPRA'; });

        // ─── HTML dos canvas ───
        container.innerHTML =
            '<div class="graficos-grid">' +
            '  <div class="grafico-card">' +
            '    <div class="grafico-title">📊 Peso Médio por Lote</div>' +
            '    <canvas id="chart-peso-lotes" height="200"></canvas>' +
            '  </div>' +
            '  <div class="grafico-card">' +
            '    <div class="grafico-title">💰 Receitas vs Custos Mensal</div>' +
            '    <canvas id="chart-receitas-custos" height="200"></canvas>' +
            '  </div>' +
            '  <div class="grafico-card">' +
            '    <div class="grafico-title">🥧 Composição de Custos</div>' +
            '    <canvas id="chart-composicao" height="200"></canvas>' +
            '  </div>' +
            '  <div class="grafico-card">' +
            '    <div class="grafico-title">📈 GMD por Lote</div>' +
            '    <canvas id="chart-gmd" height="200"></canvas>' +
            '  </div>' +
            '</div>';

        // ─── Defaults do Chart.js ───
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#94A3B8';
            Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
            Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
            Chart.defaults.font.size = 11;
            Chart.defaults.plugins.legend.labels.boxWidth = 12;
            Chart.defaults.plugins.legend.labels.padding = 8;
        } else {
            container.innerHTML = '<div class="empty-state">⚠️ Chart.js não carregou. Verifique a internet.</div>';
            return;
        }

        this.renderChartPesoLotes(lotes);
        this.renderChartReceitasCustos(events);
        this.renderChartComposicao(events);
        this.renderChartGMD(lotes);
    },

    // ─── Gráfico 1: Peso Médio por Lote (barras horizontais) ───
    renderChartPesoLotes: function (lotes) {
        var ctx = document.getElementById('chart-peso-lotes');
        if (!ctx || lotes.length === 0) return;

        var labels = [];
        var data = [];
        var colors = [];
        var palette = ['#22D3EE', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB923C', '#38BDF8', '#4ADE80'];

        lotes.slice(0, 8).forEach(function (l, i) {
            labels.push(l.nome || l.name || 'Lote ' + (i + 1));
            data.push(l.pesoMedio || 0);
            colors.push(palette[i % palette.length]);
        });

        this.destroyChart('chart-peso-lotes');
        this.charts['chart-peso-lotes'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Peso Médio (kg)',
                    data: data,
                    backgroundColor: colors.map(function (c) { return c + '99'; }),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { callback: function (v) { return v + ' kg'; } } },
                    y: { grid: { display: false } }
                }
            }
        });
    },

    // ─── Gráfico 2: Receitas vs Custos por Mês (barras agrupadas) ───
    renderChartReceitasCustos: function (events) {
        var ctx = document.getElementById('chart-receitas-custos');
        if (!ctx) return;

        // Agrupar por mês
        var meses = {};
        events.forEach(function (ev) {
            if (!ev.date) return;
            var mesKey = ev.date.substring(0, 7); // YYYY-MM
            if (!meses[mesKey]) meses[mesKey] = { receitas: 0, custos: 0 };

            if (ev.type === 'VENDA') {
                meses[mesKey].receitas += (ev.value || 0);
            } else if (ev.type === 'COMPRA' || ev.type === 'ESTOQUE_ENTRADA') {
                meses[mesKey].custos += (ev.value || 0);
            } else if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && ev.cost) {
                meses[mesKey].custos += ev.cost;
            }
        });

        var keys = Object.keys(meses).sort().slice(-6); // últimos 6 meses
        if (keys.length === 0) return;

        var labels = keys.map(function (k) {
            var parts = k.split('-');
            var nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return nomes[parseInt(parts[1]) - 1] + '/' + parts[0].substring(2);
        });

        this.destroyChart('chart-receitas-custos');
        this.charts['chart-receitas-custos'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: keys.map(function (k) { return meses[k].receitas; }),
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: '#22C55E',
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Custos',
                        data: keys.map(function (k) { return meses[k].custos; }),
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: '#EF4444',
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: 'rgba(148,163,184,0.08)' },
                        ticks: {
                            callback: function (v) {
                                if (v >= 1000) return 'R$' + (v / 1000).toFixed(0) + 'k';
                                return 'R$' + v;
                            }
                        }
                    }
                }
            }
        });
    },

    // ─── Gráfico 3: Composição de Custos (donut) ───
    renderChartComposicao: function (events) {
        var ctx = document.getElementById('chart-composicao');
        if (!ctx) return;

        var custoReposicao = 0, custoNutricao = 0, custoSanidade = 0, custoInfra = 0, custoMaoDeObra = 0;

        events.forEach(function (ev) {
            if (ev.type === 'COMPRA') {
                custoReposicao += (ev.value || 0);
            } else if (ev.type === 'ESTOQUE_ENTRADA') {
                var cat = (ev.category || '').toLowerCase();
                var name = (ev.name || '').toLowerCase();
                if (cat === 'racao_sal' || name.indexOf('sal') >= 0 || name.indexOf('ração') >= 0 || name.indexOf('racao') >= 0 || name.indexOf('milho') >= 0 || name.indexOf('silagem') >= 0) {
                    custoNutricao += (ev.value || 0);
                } else if (cat === 'remedios' || name.indexOf('vacina') >= 0 || name.indexOf('ivermectina') >= 0 || name.indexOf('vermifugo') >= 0) {
                    custoSanidade += (ev.value || 0);
                } else if (cat === 'obras') {
                    custoInfra += (ev.value || 0);
                }
            } else if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && ev.cost) {
                custoSanidade += ev.cost;
            } else if (ev.type === 'OBRA' && ev.workers) {
                ev.workers.forEach(function (w) {
                    custoMaoDeObra += ((w.diaria || 0) * (w.dias || 1));
                });
            }
        });

        var total = custoReposicao + custoNutricao + custoSanidade + custoInfra + custoMaoDeObra;
        if (total === 0) return;

        var items = [
            { label: 'Reposição', valor: custoReposicao, cor: '#E91E63' },
            { label: 'Nutrição', valor: custoNutricao, cor: '#FF9800' },
            { label: 'Sanidade', valor: custoSanidade, cor: '#2196F3' },
            { label: 'Infraestrutura', valor: custoInfra, cor: '#795548' },
            { label: 'Mão de Obra', valor: custoMaoDeObra, cor: '#9C27B0' }
        ].filter(function (i) { return i.valor > 0; });

        this.destroyChart('chart-composicao');
        this.charts['chart-composicao'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: items.map(function (i) { return i.label; }),
                datasets: [{
                    data: items.map(function (i) { return i.valor; }),
                    backgroundColor: items.map(function (i) { return i.cor + 'CC'; }),
                    borderColor: items.map(function (i) { return i.cor; }),
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 12 } },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                var pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return ctx.label + ': R$ ' + ctx.parsed.toLocaleString('pt-BR') + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    },

    // ─── Gráfico 4: GMD por Lote (barras verticais) ───
    renderChartGMD: function (lotes) {
        var ctx = document.getElementById('chart-gmd');
        if (!ctx || lotes.length === 0 || !window.lotes) return;

        var labels = [];
        var data = [];
        var colors = [];

        lotes.slice(0, 8).forEach(function (l, i) {
            var gmd = window.lotes.calcGMD(l);
            var val = gmd && gmd.gmd ? gmd.gmd : 0;
            labels.push(l.nome || l.name || 'Lote ' + (i + 1));
            data.push(parseFloat(val.toFixed(3)));

            // Cor baseada no GMD: verde ≥0.8, amarelo ≥0.5, vermelho <0.5
            if (val >= 0.8) colors.push('#22C55E');
            else if (val >= 0.5) colors.push('#FBBF24');
            else colors.push('#EF4444');
        });

        this.destroyChart('chart-gmd');
        this.charts['chart-gmd'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'GMD (kg/dia)',
                    data: data,
                    backgroundColor: colors.map(function (c) { return c + '99'; }),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: 'rgba(148,163,184,0.08)' },
                        ticks: { callback: function (v) { return v.toFixed(1) + ' kg'; } },
                        suggestedMin: 0,
                        suggestedMax: 1.5
                    }
                }
            }
        });
    },

    // ─── Destroy helper ───
    destroyChart: function (id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
        }
    }
};
