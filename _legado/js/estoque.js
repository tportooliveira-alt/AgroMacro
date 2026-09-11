// ====== MODULO: ESTOQUE / ALMOXARIFADO v3 (Linked Events, Alertas, Rastreabilidade) ======
window.estoque = {
    currentFilter: 'todos',

    init: function () {
        console.log('Estoque v3 Ready');
        this.bindForm();
        this.onCategoryChange();
        this.calcTotal();
    },

    bindForm: function () {
        var form = document.getElementById('form-estoque');
        if (form && !form.dataset.boundEstoque) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.estoque.saveEntrada();
            });
            form.dataset.boundEstoque = '1';
        }
    },

    getElement: function (id) {
        return document.getElementById(id);
    },

    getValue: function (ids) {
        for (var index = 0; index < ids.length; index++) {
            var element = this.getElement(ids[index]);
            if (element && element.value !== undefined && element.value !== '') {
                return element.value;
            }
        }
        return '';
    },

    getNumberValue: function (ids) {
        var raw = this.getValue(ids);
        return parseFloat(raw) || 0;
    },

    getCategorySuggestions: function (categoria) {
        var catalog = {
            racao_sal: ['Sal Mineral', 'Proteinado', 'Racao Engorda', 'Racao Confinamento', 'Nucleo Mineral'],
            remedios: ['Vermifugo', 'Vacina Aftosa', 'Ivermectina', 'Antibiotico', 'Carrapaticida'],
            obras: ['Arame', 'Cimento', 'Estaca', 'Prego', 'Telha', 'Madeira'],
            outros: ['Lubrificante', 'Combustivel', 'Ferramenta']
        };
        return catalog[categoria] || catalog.outros;
    },

    updateSuggestionOptions: function (categoria) {
        var select = this.getElement('est-produto-sugestao');
        if (!select) return;

        var suggestions = this.getCategorySuggestions(categoria);
        var html = '<option value="">— Selecionar ou digitar abaixo —</option>';
        suggestions.forEach(function (item) {
            html += '<option value="' + item + '">' + item + '</option>';
        });
        select.innerHTML = html;
    },

    onCategoryChange: function () {
        var categoria = this.getValue(['est-categoria']) || 'racao_sal';
        this.updateSuggestionOptions(categoria);
        this.calcTotal();
    },

    onSuggestionSelect: function () {
        var suggestion = this.getValue(['est-produto-sugestao']);
        var productInput = this.getElement('est-produto');
        if (productInput && suggestion) productInput.value = suggestion;
    },

    calcTotal: function () {
        var preview = this.getElement('est-total-preview');
        if (!preview) return;

        var qty = this.getNumberValue(['est-qty-sacos', 'est-qty']);
        var pesoSaco = this.getNumberValue(['est-peso-saco']) || 1;
        var valorUnitario = this.getNumberValue(['est-valor']);
        var custoTotal = this.getNumberValue(['est-custo']);
        var totalKg = qty * pesoSaco;

        if (!custoTotal && valorUnitario > 0 && qty > 0) {
            custoTotal = valorUnitario * qty;
        }

        if (!qty && !valorUnitario && !custoTotal) {
            preview.style.display = 'none';
            preview.innerHTML = '';
            return;
        }

        preview.style.display = '';
        preview.innerHTML = '<strong>Total:</strong> ' + qty.toFixed(1) + ' saco(s) | '
            + totalKg.toFixed(1) + ' kg | '
            + 'R$ ' + custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        this.bindForm();

        var produto = this.getValue(['est-produto']).trim();
        var qtdSacos = this.getNumberValue(['est-qty-sacos', 'est-qty']);
        var pesoSaco = this.getNumberValue(['est-peso-saco']) || 1;
        var custoTotal = this.getNumberValue(['est-custo']);
        var valorUnitario = this.getNumberValue(['est-valor']);
        if (!custoTotal && valorUnitario > 0 && qtdSacos > 0) {
            custoTotal = valorUnitario * qtdSacos;
        }
        var catSelect = this.getElement('est-categoria');
        var categoria = catSelect ? catSelect.value : 'outros';
        var data = this.getValue(['est-data']) || new Date().toISOString().split('T')[0];

        var statusPgto = 'pago';
        var statusEl = this.getElement('est-pago');
        if (statusEl) {
            statusPgto = statusEl.checked ? 'pago' : 'pendente';
        }

        var qtdMinima = 0;
        var qtdMinimaEl = this.getElement('est-qty-minima');
        if (qtdMinimaEl) qtdMinima = parseFloat(qtdMinimaEl.value) || 0;

        var fornecedor = '';
        var fornEl = this.getElement('est-fornecedor');
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

        var form = this.getElement('form-estoque');
        if (form) form.reset();

        this.onCategoryChange();
        this.calcTotal();

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
                    qtdEntrada: 0,   // total de entradas (para CMP correto)
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
            products[key].qtdEntrada += qty;  // acumula total de entradas separadamente
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
                var saldoReal = p.qtdTotal; // pode ser negativo = erro de dados
                if (saldoReal < 0) {
                    console.warn('[Estoque] Saldo negativo em "' + p.nome + '": ' + saldoReal + '. Verifique lançamentos.');
                }
                p.saldoNegativo = saldoReal < 0;
                p.qtdTotal = Math.max(0, saldoReal);
                // CMP correto: custo total de ENTRADAS / quantidade total de entradas (não divide pelo saldo restante)
                p.custoMedioPonderado = p.qtdEntrada > 0 ? p.custoTotal / p.qtdEntrada : 0;
                p.valorEstoque = p.qtdTotal * p.custoMedioPonderado; // valor atual em estoque
                p.alertaBaixo = p.qtdTotal < p.qtdMinima;
                p.name = p.nome;
                p.qty = p.qtdTotal;
                p.unit = 'kg';

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
        var container = document.getElementById('estoque-content') || document.getElementById('estoque-list');
        if (!container) return;

        var items = this.getStockItems();
        if (this.currentFilter && this.currentFilter !== 'todos') {
            items = items.filter(function (item) {
                return item.categoria === window.estoque.currentFilter;
            });
        }
        if (!Array.isArray(items)) items = [];

        var fmt = function (v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
        var _esc = window.data.escapeHtml;

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
                    + '<div style="font-size:14px;font-weight:700;color:#1E293B;">' + _esc(item.nome) + '</div>'
                    + '<div style="font-size:10px;color:#64748B;">' + _esc(item.categoria || 'outros') + '</div>'
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
        this.updateFilterButtons();
    },

    updateFilterButtons: function () {
        document.querySelectorAll('#view-estoque .filter-btn').forEach(function (button) {
            button.classList.remove('active');
        });

        var map = {
            todos: 0,
            racao_sal: 1,
            remedios: 2,
            obras: 3
        };

        var buttons = document.querySelectorAll('#view-estoque .filter-btn');
        var index = map[this.currentFilter || 'todos'];
        if (buttons[index]) buttons[index].classList.add('active');
    },

    filterBy: function (categoria) {
        this.currentFilter = categoria || 'todos';
        this.render();
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
        var _esc = window.data.escapeHtml;
        var html = '';
        items.forEach(function (item) {
            html += '<option value="' + _esc(item.nome) + '">';
        });
        return html;
    },

    fecharModal: function () {
        var el = document.getElementById('modal-estoque');
        if (el) el.remove();
    },

    registrarSaida: function (productName, qty, loteId, motivo, linkedEventId, centerCost, categoria) {
        var ev = window.data.saveEvent({
            type: 'SAIDA_ESTOQUE',
            desc: motivo || 'Saida: ' + productName,
            items: [{ name: productName, qty: qty }],
            motivo: motivo || 'Uso operacional',
            lote: loteId || '',
            centerCost: centerCost || 'OPERACIONAL',
            categoria: categoria || 'outros',
            linkedEventIds: linkedEventId ? [linkedEventId] : [],
            date: new Date().toISOString().split('T')[0]
        });
        if (linkedEventId) window.data.linkEvents(linkedEventId, ev.id);
        return ev;
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
    },

    getStockByCategory: function (categoria) {
        return this.getStockItems().filter(function (item) {
            return item.categoria === categoria;
        });
    },

    populateManejoProducts: function () {
        var select = document.getElementById('manejo-produto');
        if (!select) return;

        var items = this.getStockItems();
        var _esc = window.data.escapeHtml;
        var html = '<option value="">Selecionar do Estoque...</option>';
        items.forEach(function (item) {
            var n = _esc(item.nome || '');
            html += '<option value="' + n + '">' + n + ' (' + item.qtdTotal.toFixed(1) + ' kg)</option>';
        });
        html += '<option value="__outro__">📝 Outro (digitar)</option>';
        select.innerHTML = html;
    },

    renderMaterialCheckboxes: function (containerId, categoria) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var items = this.getStockItems().filter(function (item) {
            if (!categoria) return true;
            return item.categoria === categoria;
        });

        if (!items.length) {
            container.innerHTML = '<div class="empty-state">Nenhum material disponivel no estoque.</div>';
            return;
        }

        var html = items.map(function (item, index) {
            var inputId = containerId + '-item-' + index;
            var nomeEsc = window.data.escapeHtml(item.nome || '');
            var catEsc = window.data.escapeHtml(item.categoria || '');
            return '<label for="' + inputId + '" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(148,163,184,0.25);border-radius:8px;margin-bottom:6px;">'
                + '<input type="checkbox" id="' + inputId + '" data-material-name="' + nomeEsc + '" data-material-category="' + catEsc + '">'
                + '<span style="flex:1;">' + nomeEsc + ' <small style="color:#64748B;">(' + item.qtdTotal.toFixed(1) + ' kg)</small></span>'
                + '<input type="number" step="0.1" min="0" placeholder="Qtd" class="material-qty-input" data-material-name="' + nomeEsc + '" style="width:84px;">'
                + '</label>';
        }).join('');

        container.innerHTML = html;
    },

    getSelectedMaterials: function (containerId) {
        var container = document.getElementById(containerId);
        if (!container) return [];

        var selected = [];
        container.querySelectorAll('input[type="checkbox"][data-material-name]:checked').forEach(function (checkbox) {
            var name = checkbox.getAttribute('data-material-name') || '';
            var qtyInput = container.querySelector('.material-qty-input[data-material-name="' + name.replace(/"/g, '\\"') + '"]');
            var qty = parseFloat(qtyInput ? qtyInput.value : '') || 0;
            if (name && qty > 0) {
                selected.push({ name: name, qty: qty });
            }
        });

        return selected;
    },

    populateLoteNutrition: function () {
        var select = document.getElementById('manejo-produto');
        if (!select) return;
        this.populateManejoProducts();
    }
};
