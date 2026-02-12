// ====== MÓDULO: FINANCEIRO (Compra/Venda de Gado + Fluxo de Caixa) ======
// Exclusivamente GADO DE CORTE — sem categoria animal/material
window.financeiro = {
    init: function () {
        console.log('Financeiro Module Ready');
        this.bindForms();
    },

    bindForms: function () {
        var formCompra = document.getElementById('form-compra');
        if (formCompra) {
            formCompra.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveCompra();
            });
        }

        var formVenda = document.getElementById('form-venda');
        if (formVenda) {
            formVenda.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveVenda();
            });
        }
    },

    saveCompra: function () {
        var qty = parseInt(document.getElementById('compra-qty').value) || 0;
        var peso = parseFloat(document.getElementById('compra-peso').value) || 0;
        var valor = parseFloat(document.getElementById('compra-valor').value) || 0;
        var desc = document.getElementById('compra-desc').value;
        var fornecedor = document.getElementById('compra-fornecedor').value;
        var lote = document.getElementById('compra-lote').value;
        var data = document.getElementById('compra-data').value;

        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }

        // Custo por cabeça e por arroba
        var custoCabeca = qty > 0 ? (valor / qty) : 0;
        var pesoArroba = peso > 0 ? (peso / 30) : 0; // 1 arroba em pé = 30kg
        var custoArroba = pesoArroba > 0 ? (custoCabeca / pesoArroba) : 0;

        var ev = {
            type: 'COMPRA',
            qty: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabeças'),
            fornecedor: fornecedor,
            lote: lote,
            custoCabeca: custoCabeca,
            custoArroba: custoArroba,
            date: data || new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);
        window.app.showToast('✅ Compra registrada! R$ ' + custoCabeca.toFixed(2) + '/cab');
        document.getElementById('form-compra').reset();
    },

    saveVenda: function () {
        var lote = document.getElementById('venda-lote').value;
        var qty = parseInt(document.getElementById('venda-qty').value) || 0;
        var peso = parseFloat(document.getElementById('venda-peso').value) || 0;
        var valor = parseFloat(document.getElementById('venda-valor').value) || 0;
        var comprador = document.getElementById('venda-comprador').value;
        var desc = document.getElementById('venda-desc').value;
        var data = document.getElementById('venda-data').value;

        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }

        // ══ VERIFICAÇÃO DE CARÊNCIA SANITÁRIA ══
        if (lote && window.calendario && window.calendario.verificarCarenciaVenda) {
            if (!window.calendario.verificarCarenciaVenda(lote)) {
                window.app.showToast('❌ Venda cancelada — período de carência ativo.', 'error');
                return;
            }
        }

        var precoArroba = 0;
        if (peso > 0) {
            var totalArrobas = (qty * peso) / 30; // em pé /30
            precoArroba = valor / totalArrobas;
        }

        var ev = {
            type: 'VENDA',
            qty: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabeças vendidas'),
            comprador: comprador,
            lote: lote,
            precoArroba: precoArroba,
            date: data || new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);
        window.app.showToast('✅ Venda registrada! R$ ' + precoArroba.toFixed(2) + '/@');
        document.getElementById('form-venda').reset();
    },

    updateFluxoUI: function () {
        var container = document.getElementById('fluxo-content');
        if (!container || !window.data) return;

        var events = window.data.events;
        var totalEntradas = 0;
        var totalSaidas = 0;
        var compras = [];
        var vendas = [];

        events.forEach(function (ev) {
            if (ev.type === 'VENDA') {
                totalEntradas += (ev.value || 0);
                vendas.push(ev);
            } else if (ev.type === 'COMPRA') {
                totalSaidas += (ev.value || 0);
                compras.push(ev);
            } else if (ev.type === 'ESTOQUE_ENTRADA') {
                totalSaidas += (ev.value || 0);
            } else if (ev.type === 'MANEJO' && ev.cost) {
                totalSaidas += ev.cost;
            }
        });

        var saldo = totalEntradas - totalSaidas;

        // Summary cards
        var html = '<div class="fluxo-cards">'
            + '<div class="fluxo-card entrada">'
            + '  <div class="fluxo-label">💰 Entradas (Vendas)</div>'
            + '  <div class="fluxo-value text-green">R$ ' + totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>'
            + '<div class="fluxo-card saida">'
            + '  <div class="fluxo-label">📉 Saídas (Compras + Insumos + Manejo)</div>'
            + '  <div class="fluxo-value text-red">R$ ' + totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>'
            + '<div class="fluxo-card ' + (saldo >= 0 ? 'positivo' : 'negativo') + '">'
            + '  <div class="fluxo-label">📊 Saldo</div>'
            + '  <div class="fluxo-value ' + (saldo >= 0 ? 'text-green' : 'text-red') + '">R$ ' + saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>'
            + '</div>';

        // Indicadores de Gado de Corte
        var totalArrobasCompradas = 0;
        var totalArrobasVendidas = 0;
        compras.forEach(function (c) {
            if (c.peso && c.qty) totalArrobasCompradas += (c.qty * c.peso / 30); // em pé /30
        });
        vendas.forEach(function (v) {
            if (v.peso && v.qty) totalArrobasVendidas += (v.qty * v.peso / 30); // em pé /30
        });

        var custoMedioArroba = totalArrobasCompradas > 0 ? (totalSaidas / totalArrobasCompradas) : 0;
        var precoMedioVenda = totalArrobasVendidas > 0 ? (totalEntradas / totalArrobasVendidas) : 0;
        var margemArroba = precoMedioVenda - custoMedioArroba;

        html += '<div class="kpi-section" style="margin-top:16px;">'
            + '<div class="kpi-title">Indicadores de Corte</div>'
            + '<div class="kpi-grid">'
            + '  <div class="kpi-card"><div class="kpi-label">Custo Médio /@</div><div class="kpi-value">R$ ' + custoMedioArroba.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">Preço Venda /@</div><div class="kpi-value positive">R$ ' + precoMedioVenda.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">Margem /@</div><div class="kpi-value ' + (margemArroba >= 0 ? 'positive' : 'negative') + '">R$ ' + margemArroba.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">@ Vendidas</div><div class="kpi-value">' + totalArrobasVendidas.toFixed(1) + '</div></div>'
            + '</div></div>';

        // Recent transactions — include stock entries and manejo costs
        html += '<div class="section-title" style="margin-top:16px;">Movimentações Recentes</div>';

        var estoqueEntradas = events.filter(function (ev) { return ev.type === 'ESTOQUE_ENTRADA' && ev.value; });
        var manejoCosts = events.filter(function (ev) { return ev.type === 'MANEJO' && ev.cost; });
        var allTransactions = compras.concat(vendas).concat(estoqueEntradas).concat(manejoCosts);
        allTransactions.sort(function (a, b) {
            return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
        });

        if (allTransactions.length === 0) {
            html += '<div class="empty-state">Nenhuma movimentação registrada.</div>';
        } else {
            allTransactions.slice(0, 30).forEach(function (ev) {
                var isEntrada = ev.type === 'VENDA';
                var badgeClass = isEntrada ? 'badge-green' : 'badge-red';
                var icon = '📉';
                var label = 'COMPRA';
                var valor = ev.value || ev.cost || 0;

                if (ev.type === 'VENDA') { icon = '📈'; label = 'VENDA'; }
                else if (ev.type === 'COMPRA') { icon = '🐄'; label = 'COMPRA GADO'; }
                else if (ev.type === 'ESTOQUE_ENTRADA') { icon = '📦'; label = 'INSUMO'; }
                else if (ev.type === 'MANEJO') { icon = '💉'; label = 'MANEJO'; }

                html += '<div class="history-card">'
                    + '<div class="history-card-header">'
                    + '  <span class="badge ' + badgeClass + '">'
                    + icon + ' ' + label + '</span>'
                    + '  <span class="date">' + (ev.date || '').split('T')[0] + '</span>'
                    + '</div>'
                    + '<div class="history-card-body">'
                    + '  <strong>' + (ev.desc || '--') + '</strong>'
                    + '  <span class="detail cost ' + (isEntrada ? 'text-green' : 'text-red') + '">'
                    + (isEntrada ? '+' : '-') + ' R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</span>'
                    + '</div>'
                    + '</div>';
            });
        }

        container.innerHTML = html;
    },

    // ====== BALANÇO GERAL / DRE ======
    renderBalanco: function () {
        var container = document.getElementById('balanco-content');
        if (!container || !window.data) return;

        var events = window.data.events;

        // ─── 1. RECEITAS ───
        var receitaGado = 0;
        var vendas = events.filter(function (ev) { return ev.type === 'VENDA'; });
        vendas.forEach(function (v) { receitaGado += (v.value || 0); });

        var totalArrobasVendidas = 0;
        vendas.forEach(function (v) {
            if (v.peso && v.qty) totalArrobasVendidas += (v.qty * v.peso / 30); // em pé /30
        });

        // ─── 2. CUSTOS VARIÁVEIS ───
        // 2a. Compra de Gado (Reposição)
        var custoReposicao = 0;
        var compras = events.filter(function (ev) { return ev.type === 'COMPRA'; });
        compras.forEach(function (c) { custoReposicao += (c.value || 0); });

        var totalArrobasCompradas = 0;
        compras.forEach(function (c) {
            if (c.peso && c.qty) totalArrobasCompradas += (c.qty * c.peso / 30); // em pé /30
        });

        // 2b. Nutrição (Ração + Sal + Silagem + Milho...)
        var custoNutricao = 0;
        var estoqueNutricao = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || '').toLowerCase();
            var name = (ev.name || '').toLowerCase();
            return cat === 'racao_sal' || name.indexOf('sal') >= 0 || name.indexOf('ração') >= 0 || name.indexOf('racao') >= 0 || name.indexOf('milho') >= 0 || name.indexOf('silagem') >= 0 || name.indexOf('farelo') >= 0;
        });
        estoqueNutricao.forEach(function (ev) { custoNutricao += (ev.value || 0); });

        // 2c. Sanidade (Vacinas + Remédios + Manejo)
        var custoSanidade = 0;
        var estoqueRemedios = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || '').toLowerCase();
            var name = (ev.name || '').toLowerCase();
            return cat === 'remedios' || name.indexOf('vacina') >= 0 || name.indexOf('ivermectina') >= 0 || name.indexOf('antibiótico') >= 0 || name.indexOf('vermifugo') >= 0;
        });
        estoqueRemedios.forEach(function (ev) { custoSanidade += (ev.value || 0); });

        // Add manejo costs
        var manejoCosts = events.filter(function (ev) { return (ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && ev.cost; });
        manejoCosts.forEach(function (ev) { custoSanidade += (ev.cost || 0); });

        // ─── 3. CUSTOS FIXOS / INFRAESTRUTURA ───
        var custoInfra = 0;
        var estoqueObras = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || '').toLowerCase();
            return cat === 'obras';
        });
        estoqueObras.forEach(function (ev) { custoInfra += (ev.value || 0); });

        // 3b. Mão de Obra
        var custoMaoDeObra = 0;
        var obras = events.filter(function (ev) { return ev.type === 'OBRA'; });
        obras.forEach(function (ob) {
            if (ob.workers && Array.isArray(ob.workers)) {
                ob.workers.forEach(function (w) {
                    custoMaoDeObra += ((w.diaria || 0) * (w.dias || 1));
                });
            }
        });

        // ─── TOTAIS ───
        var custoVariavelTotal = custoReposicao + custoNutricao + custoSanidade;
        var custoFixoTotal = custoInfra + custoMaoDeObra;
        var custoOperacionalTotal = custoVariavelTotal + custoFixoTotal;
        var resultadoBruto = receitaGado - custoReposicao;
        var resultadoLiquido = receitaGado - custoOperacionalTotal;

        // ─── INDICADORES ZOOTÉCNICOS ───
        var totalAnimaisAtivos = 0;
        var totalLotesAtivos = 0;
        var pesoMedioRebanho = 0;
        var somaGMD = 0;
        var countGMD = 0;

        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            totalLotesAtivos = lotes.length;
            lotes.forEach(function (l) {
                totalAnimaisAtivos += (l.qtdAnimais || 0);
                pesoMedioRebanho += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
                var gmd = window.lotes.calcGMD(l);
                if (gmd && gmd.gmd > 0) {
                    somaGMD += gmd.gmd;
                    countGMD++;
                }
            });
            if (totalAnimaisAtivos > 0) pesoMedioRebanho = pesoMedioRebanho / totalAnimaisAtivos;
        }

        var gmdMedio = countGMD > 0 ? somaGMD / countGMD : 0;

        // Custo por cabeça e por arroba
        var custoPorCabeca = totalAnimaisAtivos > 0 ? custoOperacionalTotal / totalAnimaisAtivos : 0;
        var arrobasTotais = totalAnimaisAtivos * pesoMedioRebanho / 30; // em pé /30
        var custoPorArroba = arrobasTotais > 0 ? custoOperacionalTotal / arrobasTotais : 0;
        var precoMedioVendaArroba = totalArrobasVendidas > 0 ? receitaGado / totalArrobasVendidas : 0;
        var margemPorArroba = precoMedioVendaArroba - custoPorArroba;

        // Valor estimado do rebanho (cabeças × peso × preço/@)
        var valorRebanho = 0;
        if (precoMedioVendaArroba > 0 && totalAnimaisAtivos > 0) {
            valorRebanho = arrobasTotais * precoMedioVendaArroba;
        }

        // Custo diário da fazenda (nutrição dos lotes ativos)
        var custoDiarioFazenda = 0;
        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                var c = window.lotes.calcCustoNutricao(l);
                if (c) custoDiarioFazenda += c.custoDiaTotal;
            });
        }

        // ─── RENDER HTML ───
        var fmt = function (v) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

        var html = '';

        // ══ INDICADORES ZOOTÉCNICOS ══
        html += '<div class="kpi-section">'
            + '<div class="kpi-title">📊 Indicadores Zootécnicos</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Rebanho Ativo</div><div class="kpi-value positive">' + totalAnimaisAtivos + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">GMD Médio</div><div class="kpi-value ' + (gmdMedio >= 0.8 ? 'positive' : gmdMedio >= 0.5 ? '' : 'negative') + '">' + gmdMedio.toFixed(3) + ' kg/dia</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedioRebanho.toFixed(0) + ' kg</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">@ no Rebanho</div><div class="kpi-value">' + arrobasTotais.toFixed(0) + ' @</div></div>'
            + '</div></div>';

        // ══ INDICADORES ECONÔMICOS ══
        html += '<div class="kpi-section" style="margin-top:12px;">'
            + '<div class="kpi-title">💰 Indicadores Econômicos</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Custo/Cabeça</div><div class="kpi-value">' + fmt(custoPorCabeca) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo/@ Total</div><div class="kpi-value">' + fmt(custoPorArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Preço Venda/@</div><div class="kpi-value positive">' + fmt(precoMedioVendaArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Margem/@</div><div class="kpi-value ' + (margemPorArroba >= 0 ? 'positive' : 'negative') + '">' + fmt(margemPorArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo Diário Fazenda</div><div class="kpi-value">' + fmt(custoDiarioFazenda) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo Mensal Fazenda</div><div class="kpi-value">' + fmt(custoDiarioFazenda * 30) + '</div></div>'
            + '</div></div>';

        // ══ DRE — DEMONSTRATIVO DE RESULTADO ══
        html += '<div class="dre-section" style="margin-top:16px;">'
            + '<div class="kpi-title">📋 DRE — Demonstrativo de Resultado</div>'
            + '<div class="dre-table">';

        // RECEITAS
        html += '<div class="dre-header">RECEITAS</div>'
            + '<div class="dre-row"><span>Venda de Gado</span><span class="text-green">' + fmt(receitaGado) + '</span></div>'
            + '<div class="dre-row"><span class="dre-sub">@ Vendidas: ' + totalArrobasVendidas.toFixed(1) + ' | Vendas: ' + vendas.length + '</span><span></span></div>'
            + '<div class="dre-total"><span>TOTAL RECEITAS</span><span class="text-green">' + fmt(receitaGado) + '</span></div>';

        // CUSTOS VARIÁVEIS
        html += '<div class="dre-header" style="margin-top:12px;">CUSTOS VARIÁVEIS</div>'
            + '<div class="dre-row"><span>🐄 Reposição de Gado</span><span class="text-red">' + fmt(custoReposicao) + '</span></div>'
            + '<div class="dre-row"><span>🧂 Nutrição (Ração/Sal/Silagem)</span><span class="text-red">' + fmt(custoNutricao) + '</span></div>'
            + '<div class="dre-row"><span>💊 Sanidade (Vacinas/Remédios/Manejo)</span><span class="text-red">' + fmt(custoSanidade) + '</span></div>'
            + '<div class="dre-total"><span>TOTAL VARIÁVEIS</span><span class="text-red">' + fmt(custoVariavelTotal) + '</span></div>';

        // RESULTADO BRUTO
        html += '<div class="dre-resultado ' + (resultadoBruto >= 0 ? 'positivo' : 'negativo') + '">'
            + '<span>RESULTADO BRUTO</span><span>' + fmt(resultadoBruto) + '</span></div>';

        // CUSTOS FIXOS
        html += '<div class="dre-header" style="margin-top:12px;">CUSTOS FIXOS / ESTRUTURAIS</div>'
            + '<div class="dre-row"><span>🔨 Infraestrutura (Obras/Materiais)</span><span class="text-red">' + fmt(custoInfra) + '</span></div>'
            + '<div class="dre-row"><span>👷 Mão de Obra</span><span class="text-red">' + fmt(custoMaoDeObra) + '</span></div>'
            + '<div class="dre-total"><span>TOTAL FIXOS</span><span class="text-red">' + fmt(custoFixoTotal) + '</span></div>';

        // RESULTADO LÍQUIDO
        html += '<div class="dre-resultado ' + (resultadoLiquido >= 0 ? 'positivo' : 'negativo') + '" style="font-size:16px;">'
            + '<span>📊 RESULTADO LÍQUIDO</span><span>' + fmt(resultadoLiquido) + '</span></div>';

        html += '</div></div>';

        // ══ PROJEÇÃO / VALOR DO REBANHO ══
        if (valorRebanho > 0) {
            var resultadoPotencial = valorRebanho - custoOperacionalTotal + receitaGado;
            html += '<div class="kpi-section" style="margin-top:16px;">'
                + '<div class="kpi-title">🔮 Projeção de Resultado</div>'
                + '<div class="kpi-grid">'
                + '<div class="kpi-card"><div class="kpi-label">Valor est. Rebanho</div><div class="kpi-value positive">' + fmt(valorRebanho) + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Custos Acumulados</div><div class="kpi-value negative">' + fmt(custoOperacionalTotal) + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Resultado Potencial</div><div class="kpi-value ' + (resultadoPotencial >= 0 ? 'positive' : 'negative') + '">' + fmt(resultadoPotencial) + '</div></div>'
                + '</div></div>';
        }

        // ══ COMPOSIÇÃO DE CUSTOS (GRÁFICO VISUAL) ══
        var custoItems = [
            { label: '🐄 Reposição', valor: custoReposicao, cor: '#E91E63' },
            { label: '🧂 Nutrição', valor: custoNutricao, cor: '#FF9800' },
            { label: '💊 Sanidade', valor: custoSanidade, cor: '#2196F3' },
            { label: '🔨 Infraestrutura', valor: custoInfra, cor: '#795548' },
            { label: '👷 Mão de Obra', valor: custoMaoDeObra, cor: '#9C27B0' }
        ];

        var maxCusto = Math.max.apply(null, custoItems.map(function (c) { return c.valor; }));

        if (custoOperacionalTotal > 0) {
            html += '<div class="kpi-section" style="margin-top:16px;">'
                + '<div class="kpi-title">📈 Composição de Custos</div>';

            custoItems.forEach(function (item) {
                var pct = custoOperacionalTotal > 0 ? (item.valor / custoOperacionalTotal * 100) : 0;
                var barWidth = maxCusto > 0 ? (item.valor / maxCusto * 100) : 0;
                html += '<div style="margin-bottom:8px;">'
                    + '<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">'
                    + '<span>' + item.label + '</span>'
                    + '<span style="font-weight:700;">' + fmt(item.valor) + ' (' + pct.toFixed(1) + '%)</span>'
                    + '</div>'
                    + '<div style="background:rgba(0,0,0,0.06); border-radius:4px; height:12px; overflow:hidden;">'
                    + '<div style="background:' + item.cor + '; height:100%; width:' + barWidth + '%; border-radius:4px; transition:width 0.5s;"></div>'
                    + '</div></div>';
            });

            html += '</div>';
        }

        container.innerHTML = html;
    }
};
