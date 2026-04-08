// ====== MODULO: ESTOQUE / ALMOXARIFADO v3 (Linked Events, Alertas, Rastreabilidade) ======
window.estoque = {
    init: function () {
        console.log('Estoque v3 Ready');
    },

    getCategories: function () {
        return [
            { id: 'racao_sal', label: 'Racao / Sal Mineral', icon: '🧂', centerCost: 'NUTRICAO' },
            { id: 'remedios', label: 'Remedios / Vacinas', icon: '💊', centerCost: 'SANIDADE' },
            { id: 'obras', label: 'Material de Obra', icon: '🔨', centerCost: 'INFRAESTRUTURA' },
            { id: 'outros', label: 'Outros', icon: '📦', centerCost: 'OPERACIONAL' }
        ];
    },

    getCenterCost: function (categoria) {
        var cats = this.getCategories();
        for (var i = 0; i < cats.length; i++) {
            if (cats[i].id === categoria) return cats[i].centerCost;
        }
        return 'OPERACIONAL';
    },

    saveEntrada: function () {
        var produto = document.getElementById('est-produto').value;
        var qtdSacos = parseFloat(document.getElementById('est-qty-sacos').value) || 0;
        var pesoSaco = parseFloat(document.getElementById('est-peso-saco').value) || 0;
        var custoTotal = parseFloat(document.getElementById('est-custo').value) || 0;
        var catSelect = document.getElementById('est-categoria');
        var categoria = catSelect ? catSelect.value : 'outros';
        var data = document.getElementById('est-data').value || new Date().toISOString().split('T')[0];

        var statusPgto = 'pago';
        var statusEl = document.getElementById('est-pago');
        if (statusEl) {
            statusPgto = statusEl.checked ? 'pago' : 'pendente';
        }

        var qtdMinima = 0;
        var qtdMinimaEl = document.getElementById('est-qty-minima');
        if (qtdMinimaEl) qtdMinima = parseFloat(qtdMinimaEl.value) || 0;

        var fornecedor = '';
        var fornEl = document.getElementById('est-fornecedor');
        if (fornEl) fornecedor = fornEl.value;

        if (!produto || !qtdSacos) {
            window.app.showToast('Preencha produto e quantidade.', 'error');
            return;
        }

        var totalKg = qtdSacos * (pesoSaco || 1);
        var custoUnitario = totalKg > 0 ? custoTotal / totalKg : 0;
        var centerCost = this.getCenterCost(categoria);

        var entradaEvent = window.data.saveEvent({
            type: 'ESTOQUE_ENTRADA',
            name: produto,
            nome: produto,
            desc: qtdSacos + ' sacos de ' + produto + ' (' + totalKg + 'kg)',
            qty: qtdSacos,
            qtdKg: totalKg,
            pesoSaco: pesoSaco,
            value: custoTotal,
            custoUnitario: custoUnitario,
            category: categoria,
            categoria: categoria,
            centerCost: centerCost,
            qtdMinima: qtdMinima,
            fornecedor: fornecedor,
            date: data
        });

        var contaEvent = null;
        if (custoTotal > 0) {
            contaEvent = window.data.saveEvent({
                type: 'CONTA_PAGAR',
                nome: 'Compra Estoque: ' + produto,
                desc: qtdSacos + ' sacos de ' + produto + ' (' + totalKg + 'kg)',
                value: custoTotal,
                categoria: 'estoque',
                centerCost: centerCost,
                status: statusPgto,
                pago: statusPgto === 'pago',
                fornecedor: fornecedor,
                linkedEventIds: [entradaEvent.id],
                date: data
            });

            window.data.linkEvents(entradaEvent.id, contaEvent.id);
        }

        window.app.showToast('Entrada registrada: ' + produto + ' (' + totalKg + 'kg) ' + (statusPgto === 'pago' ? '- PAGO' : '- PENDENTE'));

        var form = document.getElementById('form-estoque');
        if (form) form.reset();

        this.render();
    },

    getStockItems: function () {
        if (!window.data) return [];
        var entradas = window.data.events.filter(function (ev) { return ev.type === 'ESTOQUE_ENTRADA' && !ev.estornado; });
        var saidas = window.data.events.filter(function (ev) { return ev.type === 'SAIDA_ESTOQUE' && !ev.estornado; });
        var consumos = window.data.events.filter(function (ev) { return ev.type === 'CONSUMO_ESTOQUE' && !ev.estornado; });

        var products = {};

        entradas.forEach(function (ev) {
            var name = ev.name || ev.nome || ev.desc || '';
            if (!name) return;
            var key = name.toLowerCase().trim();
            if (!products[key]) {
                products[key] = {
                    nome: name,
                    qtdTotal: 0,
                    custoTotal: 0,
                    categoria: ev.category || ev.categoria || 'outros',
                    qtdMinima: ev.qtdMinima || 10,
                    ultimaEntrada: ev.date,
                    movimentacoes: [],
                    centerCost: ev.centerCost || 'OPERACIONAL'
                };
            }
            var qty = ev.qtdKg || ev.qty || 0;
            products[key].qtdTotal += qty;
            products[key].custoTotal += (ev.value || 0);
            if (ev.qtdMinima && ev.qtdMinima > products[key].qtdMinima) {
                products[key].qtdMinima = ev.qtdMinima;
            }
            if (ev.date > products[key].ultimaEntrada) {
                products[key].ultimaEntrada = ev.date;
            }
            products[key].movimentacoes.push({
                tipo: 'ENTRADA', date: ev.date, qty: qty, value: ev.value || 0, id: ev.id
            });
        });

        saidas.forEach(function (ev) {
            var items = ev.items || [];
            items.forEach(function (item) {
                var name = item.name || item.nome || '';
                var key = name.toLowerCase().trim();
                if (products[key]) {
                    var qty = item.qty || 0;
                    products[key].qtdTotal -= qty;
                    products[key].movimentacoes.push({
                        tipo: 'SAIDA', date: ev.date, qty: qty, motivo: ev.motivo || '', id: ev.id
                    });
                }
            });
        });

        consumos.forEach(function (ev) {
            var name = ev.name || ev.nome || '';
            var key = name.toLowerCase().trim();
            if (products[key]) {
                var qty = ev.qty || 0;
                products[key].qtdTotal -= qty;
                products[key].movimentacoes.push({
                    tipo: 'CONSUMO', date: ev.date, qty: qty, lote: ev.lote || '', id: ev.id
                });
            }
        });

        var result = [];
        for (var key in products) {
            if (products.hasOwnProperty(key)) {
                var p = products[key];
                p.qtdTotal = Math.max(0, p.qtdTotal);
                p.custoMedioPonderado = p.qtdTotal > 0 ? p.custoTotal / p.qtdTotal : 0;
                p.alertaBaixo = p.qtdTotal < p.qtdMinima;

                var consumoDiario = 0;
                var consumosRecentes = p.movimentacoes.filter(function (m) {
                    return (m.tipo === 'CONSUMO' || m.tipo === 'SAIDA');
                });
                if (consumosRecentes.length >= 2) {
                    var primeiro = consumosRecentes[0];
                    var ultimo = consumosRecentes[consumosRecentes.length - 1];
                    var diasDiff = (new Date(ultimo.date) - new Date(primeiro.date)) / (1000 * 60 * 60 * 24);
                    var totalConsumido = 0;
                    consumosRecentes.forEach(function (c) { totalConsumido += c.qty; });
                    if (diasDiff > 0) consumoDiario = totalConsumido / diasDiff;
                }

                p.consumoDiario = consumoDiario;
                p.diasRestantes = consumoDiario > 0 ? Math.round(p.qtdTotal / consumoDiario) : null;
                result.push(p);
            }
        }

        result.sort(function (a, b) {
            if (a.alertaBaixo && !b.alertaBaixo) return -1;
            if (!a.alertaBaixo && b.alertaBaixo) return 1;
            return a.nome.localeCompare(b.nome);
        });

        return result;
    },

    getAlertasEstoque: function () {
        return this.getStockItems().filter(function (item) { return item.alertaBaixo; });
    },

    getValorTotalEstoque: function () {
        var total = 0;
        this.getStockItems().forEach(function (item) {
            total += (item.custoMedioPonderado * item.qtdTotal);
        });
        return total;
    },

    render: function () {
        var container = document.getElementById('estoque-content');
        if (!container) return;

        var items = this.getStockItems();
        var fmt = function (v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };

        var valorTotal = 0;
        var itensAlerta = 0;
        items.forEach(function (item) {
            valorTotal += (item.custoMedioPonderado * item.qtdTotal);
            if (item.alertaBaixo) itensAlerta++;
        });

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Itens</div><div class="kpi-value">' + items.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Valor Total</div><div class="kpi-value">' + fmt(valorTotal) + '</div></div>';

        if (itensAlerta > 0) {
            html += '<div class="kpi-card" style="border:1px solid rgba(220,38,38,0.3);"><div class="kpi-label" style="color:#DC2626;">Estoque Baixo</div><div class="kpi-value negative">' + itensAlerta + ' item(ns)</div></div>';
        }
        html += '</div>';

        var catIcons = { racao_sal: '🧂', remedios: '💊', obras: '🔨', outros: '📦' };

        if (items.length === 0) {
            html += '<div class="empty-state"><span class="empty-state-icon">📦</span>'
                + '<div class="empty-state-title">Almoxarifado Vazio</div>'
                + '<div class="empty-state-text">Registre a primeira entrada de insumo.</div></div>';
        } else {
            items.forEach(function (item) {
                var icon = catIcons[item.categoria] || '📦';
                var statusColor = item.alertaBaixo ? '#DC2626' : '#059669';
                var statusBg = item.alertaBaixo ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)';
                var statusLabel = item.alertaBaixo ? 'BAIXO' : 'OK';

                html += '<div style="background:' + statusBg + ';border-left:4px solid ' + statusColor + ';border-radius:10px;padding:12px;margin-bottom:8px;">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<div style="display:flex;align-items:center;gap:8px;">'
                    + '<span style="font-size:20px;">' + icon + '</span>'
                    + '<div>'
                    + '<div style="font-size:14px;font-weight:700;color:#1E293B;">' + item.nome + '</div>'
                    + '<div style="font-size:10px;color:#64748B;">' + (item.categoria || 'outros') + '</div>'
                    + '</div></div>'
                    + '<span style="font-size:9px;font-weight:800;background:' + statusColor + ';color:#fff;padding:2px 6px;border-radius:4px;">' + statusLabel + '</span>'
                    + '</div>';

                html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;">'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Estoque</div>'
                    + '<div style="font-size:16px;font-weight:800;color:' + statusColor + ';">' + item.qtdTotal.toFixed(1) + ' kg</div></div>'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Custo/kg</div>'
                    + '<div style="font-size:14px;font-weight:700;">' + fmt(item.custoMedioPonderado) + '</div></div>'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Valor</div>'
                    + '<div style="font-size:14px;font-weight:700;">' + fmt(item.custoMedioPonderado * item.qtdTotal) + '</div></div>'
                    + '</div>';

                if (item.diasRestantes !== null) {
                    var diasColor = item.diasRestantes <= 7 ? '#DC2626' : item.diasRestantes <= 30 ? '#D97706' : '#059669';
                    html += '<div style="margin-top:6px;padding:4px 8px;background:rgba(0,0,0,0.04);border-radius:6px;text-align:center;">'
                        + '<span style="font-size:10px;color:#64748B;">Consumo diario: ' + item.consumoDiario.toFixed(1) + ' kg | </span>'
                        + '<span style="font-size:11px;font-weight:700;color:' + diasColor + ';">~' + item.diasRestantes + ' dias restantes</span>'
                        + '</div>';
                }

                if (item.alertaBaixo) {
                    html += '<div style="margin-top:6px;padding:4px 8px;background:rgba(220,38,38,0.1);border-radius:6px;text-align:center;">'
                        + '<span style="font-size:11px;font-weight:700;color:#DC2626;">ALERTA: Estoque abaixo do minimo (' + item.qtdMinima + ' kg)</span>'
                        + '</div>';
                }

                html += '</div>';
            });
        }

        html += '<button class="fab" onclick="window.estoque.abrirFormEntrada()">+</button>';
        container.innerHTML = html;
    },

    abrirFormEntrada: function () {
        var cats = this.getCategories();
        var catOptions = '';
        cats.forEach(function (c) {
            catOptions += '<option value="' + c.id + '">' + c.icon + ' ' + c.label + '</option>';
        });

        var html = '<div class="modal-overlay" id="modal-estoque">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>Nova Entrada de Estoque</h3>'
            + '<button onclick="window.estoque.fecharModal()" class="modal-close">X</button></div>'
            + '<div class="modal-body">'
            + '<form id="form-estoque" onsubmit="event.preventDefault(); window.estoque.saveEntrada();">'
            + '<div class="form-group"><label>Produto</label>'
            + '<input type="text" id="est-produto" placeholder="Ex: Sal Mineral" list="est-produtos-list">'
            + '<datalist id="est-produtos-list">' + this.getProductSuggestions() + '</datalist></div>'
            + '<div class="form-group"><label>Quantidade (sacos/un)</label>'
            + '<input type="number" id="est-qty-sacos" step="0.01" placeholder="10"></div>'
            + '<div class="form-group"><label>Peso por saco (kg)</label>'
            + '<input type="number" id="est-peso-saco" step="0.01" placeholder="25"></div>'
            + '<div class="form-group"><label>Custo Total (R$)</label>'
            + '<input type="number" id="est-custo" step="0.01" placeholder="500.00"></div>'
            + '<div class="form-group"><label>Categoria</label>'
            + '<select id="est-categoria">' + catOptions + '</select></div>'
            + '<div class="form-group"><label>Fornecedor</label>'
            + '<input type="text" id="est-fornecedor" placeholder="Nome do fornecedor"></div>'
            + '<div class="form-group"><label>Data</label>'
            + '<input type="date" id="est-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Estoque Minimo (kg)</label>'
            + '<input type="number" id="est-qty-minima" step="0.01" placeholder="50" value="10"></div>'
            + '<div class="form-group" style="display:flex;align-items:center;gap:8px;">'
            + '<input type="checkbox" id="est-pago" checked>'
            + '<label for="est-pago" style="margin:0;">Ja foi pago?</label></div>'
            + '<button type="submit" class="submit-btn">Registrar Entrada</button>'
            + '</form></div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    getProductSuggestions: function () {
        var items = this.getStockItems();
        var html = '';
        items.forEach(function (item) {
            html += '<option value="' + item.nome + '">';
        });
        return html;
    },

    fecharModal: function () {
        var el = document.getElementById('modal-estoque');
        if (el) el.remove();
    },

    registrarSaida: function (productName, qty, loteId, motivo) {
        window.data.saveEvent({
            type: 'SAIDA_ESTOQUE',
            desc: motivo || 'Saida: ' + productName,
            items: [{ name: productName, qty: qty }],
            motivo: motivo || 'Uso operacional',
            lote: loteId || '',
            date: new Date().toISOString().split('T')[0]
        });
    },

    registrarConsumo: function (productName, qty, loteId) {
        window.data.saveEvent({
            type: 'CONSUMO_ESTOQUE',
            name: productName,
            nome: productName,
            desc: 'Consumo: ' + productName + ' para lote ' + (loteId || 'geral'),
            qty: qty,
            lote: loteId || '',
            centerCost: 'NUTRICAO',
            date: new Date().toISOString().split('T')[0]
        });
    },

    getEstoqueByProduct: function (productName) {
        var items = this.getStockItems();
        var key = productName.toLowerCase().trim();
        for (var i = 0; i < items.length; i++) {
            if (items[i].nome.toLowerCase().trim() === key) return items[i];
        }
        return null;
    }
};
