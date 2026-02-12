// ====== MÓDULO: INDICADORES (KPIs Financeiros + Produtivos) ======
// Features 1-8: Custo/Cab/Dia, Custo/@Prod, Margem/@, Ponto Equilíbrio,
//               GMD, Conversão Alimentar, Previsão Abate, Dias de Cocho
window.indicadores = {

    init: function () {
        console.log('Indicadores Module Ready');
    },

    // ====== HELPERS ======

    // Get all active lotes (latest version per name)
    getActiveLotes: function () {
        if (!window.data) return [];
        var map = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'LOTE') map[ev.nome] = ev;
        });
        var result = [];
        for (var k in map) {
            if (map[k].status === 'ATIVO') result.push(map[k]);
        }
        return result;
    },

    // Days between two dates
    daysBetween: function (d1, d2) {
        var a = new Date(d1), b = new Date(d2);
        return Math.max(1, Math.round((b - a) / 86400000));
    },

    // Today string
    today: function () {
        return new Date().toISOString().split('T')[0];
    },

    // Format currency
    fmt: function (v) {
        return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    },

    // ====== 1. CUSTO POR CABEÇA/DIA ======
    // Soma todos os custos do lote (nutrição + manejo + insumos alocados) / qtd animais / dias
    calcCustoCabDia: function (lote) {
        if (!window.data || !lote) return { custoCabDia: 0, custoTotal: 0, dias: 0 };

        var events = window.data.events;
        var dias = this.daysBetween(lote.dataEntrada || lote.date, this.today());
        var qtd = lote.qtdAnimais || 1;
        var custoTotal = 0;

        events.forEach(function (ev) {
            // Custos de manejo deste lote
            if (ev.type === 'MANEJO' && ev.lote === lote.nome && ev.cost) {
                custoTotal += ev.cost;
            }
            // Custos de abastecimento (sal/ração) deste lote
            if (ev.type === 'ABASTECIMENTO' && ev.lote === lote.nome) {
                // Find cost of this supply
                var custoProduto = 0;
                events.forEach(function (e2) {
                    if (e2.type === 'ESTOQUE_ENTRADA' && e2.name && ev.produto &&
                        e2.name.toLowerCase().indexOf(ev.produto) >= 0 && e2.valorUnitario) {
                        custoProduto = e2.valorUnitario; // custo/kg
                    }
                });
                custoTotal += (ev.qtdKg || 0) * custoProduto;
            }
        });

        // Add proportional nutrition cost from lote config
        if (window.lotes && window.lotes.calcCustoNutricao) {
            var nutri = window.lotes.calcCustoNutricao(lote);
            if (nutri && nutri.custoDiarioTotal) {
                custoTotal += nutri.custoDiarioTotal * dias;
            }
        }

        var custoCabDia = (custoTotal / qtd / dias) || 0;
        return { custoCabDia: custoCabDia, custoTotal: custoTotal, dias: dias, qtd: qtd };
    },

    // ====== 2. CUSTO POR ARROBA PRODUZIDA ======
    // Custo total / arrobas de ganho (peso atual - peso entrada) / 30 (em pé)
    calcCustoArrobaProduzida: function (lote) {
        if (!lote) return 0;
        var pesoEntrada = lote.pesoEntrada || lote.pesoMedio || 0;
        var pesoAtual = lote.pesoMedio || 0;

        // Get latest weight from pesagem events
        var pesagens = (window.data ? window.data.events : []).filter(function (ev) {
            return ev.type === 'MANEJO' && ev.tipoManejo === 'pesagem' && ev.lote === lote.nome;
        });
        if (pesagens.length > 0) {
            pesoAtual = pesagens[pesagens.length - 1].pesoMedio || pesoAtual;
        }
        // Get entry weight from COMPRA
        var compras = (window.data ? window.data.events : []).filter(function (ev) {
            return ev.type === 'COMPRA' && ev.lote === lote.nome;
        });
        if (compras.length > 0) {
            pesoEntrada = compras[0].peso || pesoEntrada;
        }

        var ganhoKg = Math.max(0, pesoAtual - pesoEntrada);
        var ganhoArrobas = (ganhoKg * (lote.qtdAnimais || 1)) / 30; // Em pé = /30

        var custoInfo = this.calcCustoCabDia(lote);
        return ganhoArrobas > 0 ? custoInfo.custoTotal / ganhoArrobas : 0;
    },

    // ====== 3. MARGEM POR ARROBA ======
    // Preço médio de venda/@ - custo médio de produção/@
    calcMargemArroba: function () {
        if (!window.data) return { margem: 0, precoVenda: 0, custoProd: 0 };

        var events = window.data.events;
        var totalVendaValor = 0, totalVendaArrobas = 0;
        var totalCustoValor = 0, totalCustoArrobas = 0;

        events.forEach(function (ev) {
            if (ev.type === 'VENDA' && ev.peso && ev.qty) {
                totalVendaValor += (ev.value || 0);
                totalVendaArrobas += (ev.qty * ev.peso / 30); // em pé /30
            }
            if (ev.type === 'COMPRA' && ev.peso && ev.qty) {
                totalCustoValor += (ev.value || 0);
                totalCustoArrobas += (ev.qty * ev.peso / 30); // em pé /30
            }
        });

        // Add insumos + manejo to custo
        events.forEach(function (ev) {
            if (ev.type === 'ESTOQUE_ENTRADA') totalCustoValor += (ev.value || 0);
            if (ev.type === 'MANEJO' && ev.cost) totalCustoValor += ev.cost;
        });

        var precoVenda = totalVendaArrobas > 0 ? totalVendaValor / totalVendaArrobas : 0;
        var custoProd = totalCustoArrobas > 0 ? totalCustoValor / totalCustoArrobas : 0;

        return {
            margem: precoVenda - custoProd,
            precoVenda: precoVenda,
            custoProd: custoProd,
            arrobasVendidas: totalVendaArrobas
        };
    },

    // ====== 4. PONTO DE EQUILÍBRIO ======
    // Quantas arrobas precisa vender pra cobrir todos os custos
    calcPontoEquilibrio: function () {
        if (!window.data) return 0;
        var events = window.data.events;
        var totalCustos = 0;

        events.forEach(function (ev) {
            if (ev.type === 'COMPRA') totalCustos += (ev.value || 0);
            if (ev.type === 'ESTOQUE_ENTRADA') totalCustos += (ev.value || 0);
            if (ev.type === 'MANEJO' && ev.cost) totalCustos += ev.cost;
        });

        // Use sale price per arroba
        var margemInfo = this.calcMargemArroba();
        var precoVenda = margemInfo.precoVenda;
        if (precoVenda <= 0) return 0;

        return totalCustos / precoVenda;
    },

    // ====== 5. GMD AUTOMÁTICO ======
    calcGMD: function (lote) {
        if (window.lotes && window.lotes.calcGMD) {
            return window.lotes.calcGMD(lote);
        }
        return { gmd: 0, msg: 'Sem dados de pesagem' };
    },

    // ====== 6. CONVERSÃO ALIMENTAR ======
    // Kg de ração consumida / kg de ganho de peso
    calcConversaoAlimentar: function (lote) {
        if (!window.data || !lote) return { conversao: 0, racaoKg: 0, ganhoKg: 0 };

        var events = window.data.events;
        var racaoKg = 0;

        // Sum all feed supply to this lot
        events.forEach(function (ev) {
            if (ev.type === 'ABASTECIMENTO' && ev.lote === lote.nome && ev.produto === 'racao') {
                racaoKg += (ev.qtdKg || 0);
            }
        });

        // Also add calculated daily consumption × days
        if (lote.racaoConsumo && lote.qtdAnimais) {
            var dias = this.daysBetween(lote.dataEntrada || lote.date, this.today());
            var consumoDiario = (lote.racaoConsumo || 0) * (lote.qtdAnimais || 0) / 1000; // g to kg
            racaoKg = Math.max(racaoKg, consumoDiario * dias);
        }

        // Get weight gain
        var gmdInfo = this.calcGMD(lote);
        var dias2 = this.daysBetween(lote.dataEntrada || lote.date, this.today());
        var ganhoKg = (gmdInfo.gmd || 0) * dias2 * (lote.qtdAnimais || 1);

        return {
            conversao: ganhoKg > 0 ? racaoKg / ganhoKg : 0,
            racaoKg: racaoKg,
            ganhoKg: ganhoKg
        };
    },

    // ====== 7. PREVISÃO DE ABATE ======
    // Calcula quando o lote atinge peso alvo baseado no GMD atual
    previsaoAbate: function (lote, pesoAlvo) {
        pesoAlvo = pesoAlvo || 540; // Default: 540kg = ~18@ em pé
        if (!lote) return { diasRestantes: 0, dataPrevisao: '--' };

        var pesoAtual = lote.pesoMedio || 0;
        var pesagens = (window.data ? window.data.events : []).filter(function (ev) {
            return ev.type === 'MANEJO' && ev.tipoManejo === 'pesagem' && ev.lote === lote.nome;
        });
        if (pesagens.length > 0) {
            pesoAtual = pesagens[pesagens.length - 1].pesoMedio || pesoAtual;
        }

        var gmdInfo = this.calcGMD(lote);
        var gmd = gmdInfo.gmd || 0;

        if (gmd <= 0 || pesoAtual >= pesoAlvo) {
            return {
                diasRestantes: pesoAtual >= pesoAlvo ? 0 : 999,
                dataPrevisao: pesoAtual >= pesoAlvo ? 'Pronto!' : 'Sem GMD',
                pesoAtual: pesoAtual,
                pesoAlvo: pesoAlvo,
                gmd: gmd
            };
        }

        var kgFalta = pesoAlvo - pesoAtual;
        var diasRestantes = Math.ceil(kgFalta / gmd);
        var dataPrevisao = new Date();
        dataPrevisao.setDate(dataPrevisao.getDate() + diasRestantes);

        return {
            diasRestantes: diasRestantes,
            dataPrevisao: dataPrevisao.toLocaleDateString('pt-BR'),
            pesoAtual: pesoAtual,
            pesoAlvo: pesoAlvo,
            gmd: gmd,
            kgFalta: kgFalta
        };
    },

    // ====== 8. DIAS DE COCHO ======
    diasCocho: function (lote) {
        if (!lote || !lote.dataEntrada) return 0;
        return this.daysBetween(lote.dataEntrada || lote.date, this.today());
    },

    // ====== RENDER: Indicadores Financeiros (for Fluxo de Caixa view) ======
    renderIndicadoresFinanceiros: function () {
        var container = document.getElementById('indicadores-financeiros');
        if (!container) return;

        var margemInfo = this.calcMargemArroba();
        var pontoEq = this.calcPontoEquilibrio();

        // Custo/cab/dia médio de todos os lotes
        var lotes = this.getActiveLotes();
        var sumCustoCab = 0, countLotes = 0;
        var self = this;
        lotes.forEach(function (l) {
            var info = self.calcCustoCabDia(l);
            sumCustoCab += info.custoCabDia;
            countLotes++;
        });
        var mediaCustoCab = countLotes > 0 ? sumCustoCab / countLotes : 0;

        var html = '<div class="kpi-section">'
            + '<div class="kpi-title">📊 Indicadores Financeiros</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">💰 Custo/Cab/Dia</div>'
            + '<div class="kpi-value">' + this.fmt(mediaCustoCab) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">📈 Preço Venda/@</div>'
            + '<div class="kpi-value positive">' + this.fmt(margemInfo.precoVenda) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">📉 Custo Prod./@</div>'
            + '<div class="kpi-value">' + this.fmt(margemInfo.custoProd) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">' + (margemInfo.margem >= 0 ? '✅' : '🚨') + ' Margem/@</div>'
            + '<div class="kpi-value ' + (margemInfo.margem >= 0 ? 'positive' : 'negative') + '">' + this.fmt(margemInfo.margem) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">🎯 Ponto Eq.</div>'
            + '<div class="kpi-value">' + pontoEq.toFixed(1) + ' @</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">🥩 @ Vendidas</div>'
            + '<div class="kpi-value">' + margemInfo.arrobasVendidas.toFixed(1) + '</div></div>'
            + '</div></div>';

        container.innerHTML = html;
    },

    // ====== RENDER: Indicadores Produtivos (for each Lote card) ======
    getLoteKPIs: function (lote) {
        var gmdInfo = this.calcGMD(lote);
        var dias = this.diasCocho(lote);
        var previsao = this.previsaoAbate(lote);
        var conversao = this.calcConversaoAlimentar(lote);
        var custoCab = this.calcCustoCabDia(lote);

        return {
            gmd: gmdInfo.gmd || 0,
            gmdMsg: gmdInfo.msg || '',
            diasCocho: dias,
            pesoAtual: previsao.pesoAtual || lote.pesoMedio || 0,
            previsaoAbate: previsao.dataPrevisao || '--',
            diasParaAbate: previsao.diasRestantes || 0,
            conversaoAlimentar: conversao.conversao || 0,
            custoCabDia: custoCab.custoCabDia || 0
        };
    },

    // ====== RENDER: Indicadores Produtivos Panel ======
    renderIndicadoresProdutivos: function () {
        var container = document.getElementById('indicadores-produtivos');
        if (!container) return;

        var lotes = this.getActiveLotes();
        if (lotes.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum lote ativo para indicadores.</div>';
            return;
        }

        var self = this;
        var html = '<div class="kpi-section">'
            + '<div class="kpi-title">⚖️ Indicadores Produtivos por Lote</div>';

        lotes.forEach(function (lote) {
            var kpis = self.getLoteKPIs(lote);
            var catEmoji = { 'cria': '🐮', 'recria': '🐄', 'engorda': '🥩', 'matrizes': '👑' };
            var emoji = catEmoji[lote.categoria] || '🐂';

            html += '<div class="premium-card" style="margin-bottom:12px;padding:14px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
                + '<strong style="font-size:14px;">' + emoji + ' ' + lote.nome + '</strong>'
                + '<span style="font-size:12px;color:var(--text-2);">' + kpis.diasCocho + ' dias</span>'
                + '</div>'
                + '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;">'
                + '<div class="kpi-card" style="padding:8px;"><div class="kpi-label" style="font-size:10px;">GMD</div>'
                + '<div class="kpi-value" style="font-size:14px;' + (kpis.gmd > 0 ? 'color:var(--green)' : '') + '">'
                + (kpis.gmd > 0 ? kpis.gmd.toFixed(2) + ' kg' : '--') + '</div></div>'
                + '<div class="kpi-card" style="padding:8px;"><div class="kpi-label" style="font-size:10px;">Peso Atual</div>'
                + '<div class="kpi-value" style="font-size:14px;">' + kpis.pesoAtual.toFixed(0) + ' kg</div></div>'
                + '<div class="kpi-card" style="padding:8px;"><div class="kpi-label" style="font-size:10px;">Custo/Cab/Dia</div>'
                + '<div class="kpi-value" style="font-size:14px;">' + self.fmt(kpis.custoCabDia) + '</div></div>';

            if (kpis.conversaoAlimentar > 0) {
                html += '<div class="kpi-card" style="padding:8px;"><div class="kpi-label" style="font-size:10px;">Conv. Alim.</div>'
                    + '<div class="kpi-value" style="font-size:14px;">' + kpis.conversaoAlimentar.toFixed(1) + ':1</div></div>';
            }

            html += '<div class="kpi-card" style="padding:8px;"><div class="kpi-label" style="font-size:10px;">Prev. Abate</div>'
                + '<div class="kpi-value" style="font-size:12px;' + (kpis.diasParaAbate === 0 ? 'color:var(--green)' : '') + '">'
                + kpis.previsaoAbate + '</div></div>';

            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }
};
