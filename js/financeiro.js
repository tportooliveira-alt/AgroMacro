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
        var pesoArroba = peso > 0 ? (peso / 15) : 0; // 1 arroba = 15kg
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

        var precoArroba = 0;
        if (peso > 0) {
            var totalArrobas = (qty * peso) / 15;
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
            if (c.peso && c.qty) totalArrobasCompradas += (c.qty * c.peso / 15);
        });
        vendas.forEach(function (v) {
            if (v.peso && v.qty) totalArrobasVendidas += (v.qty * v.peso / 15);
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
    }
};
