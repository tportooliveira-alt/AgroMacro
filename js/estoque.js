// ====== MÓDULO: ESTOQUE DE INSUMOS (com Categorias) ======
// CATEGORIAS: racao_sal | remedios | obras
window.estoque = {
    currentFilter: 'todos',

    // Product suggestions by category
    suggestions: {
        racao_sal: [
            { name: 'Sal Mineral', unit: 'kg' },
            { name: 'Sal Proteinado', unit: 'kg' },
            { name: 'Sal Branco (Comum)', unit: 'kg' },
            { name: 'Ração Engorda', unit: 'kg' },
            { name: 'Ração Recria', unit: 'kg' },
            { name: 'Ração Cria', unit: 'kg' },
            { name: 'Farelo de Soja', unit: 'kg' },
            { name: 'Milho Grão', unit: 'kg' },
            { name: 'Silagem', unit: 'kg' },
            { name: 'Feno', unit: 'fardo' },
            { name: 'Ureia Pecuária', unit: 'kg' },
            { name: 'Caroço de Algodão', unit: 'kg' },
            { name: 'Polpa Cítrica', unit: 'kg' }
        ],
        remedios: [
            { name: 'Vacina Aftosa', unit: 'doses' },
            { name: 'Vacina Brucelose', unit: 'doses' },
            { name: 'Vacina Raiva', unit: 'doses' },
            { name: 'Vacina Clostridiose', unit: 'doses' },
            { name: 'Vermífugo Ivermectina', unit: 'ml' },
            { name: 'Vermífugo Albendazol', unit: 'ml' },
            { name: 'Carrapaticida', unit: 'litro' },
            { name: 'Bernicida (Mata-Bicheira)', unit: 'frasco' },
            { name: 'Antibiótico', unit: 'frasco' },
            { name: 'Anti-inflamatório', unit: 'frasco' },
            { name: 'Ocitocina', unit: 'frasco' },
            { name: 'Anestésico Local', unit: 'frasco' },
            { name: 'Cicatrizante Spray', unit: 'lata' },
            { name: 'Brinco/Identificador', unit: 'un' },
            { name: 'Seringa Descartável', unit: 'un' },
            { name: 'Agulha Descartável', unit: 'un' }
        ],
        obras: [
            { name: 'Arame Farpado', unit: 'metros' },
            { name: 'Arame Liso', unit: 'metros' },
            { name: 'Estacas de Madeira', unit: 'un' },
            { name: 'Mourão', unit: 'un' },
            { name: 'Cimento', unit: 'sacos' },
            { name: 'Areia', unit: 'm³' },
            { name: 'Brita', unit: 'm³' },
            { name: 'Pregos', unit: 'kg' },
            { name: 'Grampos', unit: 'kg' },
            { name: 'Parafusos', unit: 'caixa' },
            { name: 'Furadeira', unit: 'un' },
            { name: 'Serrote', unit: 'un' },
            { name: 'Martelo', unit: 'un' },
            { name: 'Alicate', unit: 'un' },
            { name: 'Telha', unit: 'un' },
            { name: 'Madeira / Caibro', unit: 'peça' },
            { name: 'Cocho de Sal', unit: 'un' },
            { name: 'Bebedouro', unit: 'un' },
            { name: 'Tábua', unit: 'peça' },
            { name: 'Dobradiça', unit: 'un' }
        ]
    },

    init: function () {
        console.log('Estoque Module Ready');
        this.bindForm();
        this.onCategoryChange();
    },

    // Returns array of {name, qty, unit, category} — used by Manejo and Obras
    getStockItems: function () {
        if (!window.data) return [];
        var stock = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'ESTOQUE_ENTRADA') {
                var key = (ev.desc || '').toLowerCase().trim();
                if (!key) return;
                if (!stock[key]) stock[key] = { name: ev.desc, qty: 0, unit: ev.unit || 'un', category: ev.category || '' };
                stock[key].qty += (ev.qty || 0);
            }
            if (ev.type === 'SAIDA_ESTOQUE' && ev.items) {
                ev.items.forEach(function (item) {
                    var key = (item.name || '').toLowerCase().trim();
                    if (stock[key]) stock[key].qty -= (item.qty || 0);
                });
            }
            if (ev.type === 'OBRA_REGISTRO' && ev.materials) {
                ev.materials.forEach(function (mat) {
                    var key = (mat.name || '').toLowerCase().trim();
                    if (stock[key]) stock[key].qty -= (mat.qty || 0);
                });
            }
        });
        var items = [];
        Object.keys(stock).forEach(function (key) {
            if (stock[key].qty > 0) items.push(stock[key]);
        });
        return items.sort(function (a, b) { return a.name.localeCompare(b.name); });
    },

    // Returns stock items filtered by category
    getStockByCategory: function (category) {
        return this.getStockItems().filter(function (item) {
            return item.category === category;
        });
    },

    // Populate sal/ração dropdowns for Lotes form
    populateLoteNutrition: function () {
        var salSelect = document.getElementById('lote-sal');
        var racaoSelect = document.getElementById('lote-racao');

        var items = this.getStockByCategory('racao_sal');
        if (!items.length) items = this.getStockItems().filter(function (i) {
            return i.name.toLowerCase().indexOf('sal') >= 0 || i.name.toLowerCase().indexOf('racao') >= 0 || i.name.toLowerCase().indexOf('ração') >= 0;
        });

        if (salSelect) {
            var salHTML = '<option value="">Nenhum</option>';
            items.forEach(function (i) {
                if (i.name.toLowerCase().indexOf('sal') >= 0 || i.name.toLowerCase().indexOf('mineral') >= 0 || i.name.toLowerCase().indexOf('proteinado') >= 0) {
                    salHTML += '<option value="' + i.name + '">' + i.name + ' (' + i.qty + ' ' + i.unit + ')</option>';
                }
            });
            // Also add all racao_sal items as options
            items.forEach(function (i) {
                if (salHTML.indexOf(i.name) < 0) {
                    salHTML += '<option value="' + i.name + '">' + i.name + ' (' + i.qty + ' ' + i.unit + ')</option>';
                }
            });
            salSelect.innerHTML = salHTML;
        }

        if (racaoSelect) {
            var racaoHTML = '<option value="">Nenhuma</option>';
            items.forEach(function (i) {
                racaoHTML += '<option value="' + i.name + '">' + i.name + ' (' + i.qty + ' ' + i.unit + ')</option>';
            });
            racaoSelect.innerHTML = racaoHTML;
        }
    },

    // Renders checkboxes for materials in a container
    renderMaterialCheckboxes: function (containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var items = this.getStockItems();
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum material no estoque. Cadastre insumos em Estoque primeiro.</div>';
            return;
        }
        var html = items.map(function (item) {
            var catIcon = item.category === 'racao_sal' ? '🧂' : item.category === 'remedios' ? '💊' : item.category === 'obras' ? '🔨' : '📦';
            return '<div class="material-item">'
                + '<label class="checkbox-label"><input type="checkbox" data-mat-name="' + item.name + '"> '
                + catIcon + ' ' + item.name + ' <small style="color:var(--text-light)">(' + item.qty + ' ' + item.unit + ')</small></label>'
                + '<div class="qty-input"><input type="number" data-mat-qty="' + item.name + '" placeholder="0" min="0" max="' + item.qty + '">'
                + '<span>' + item.unit + '</span></div>'
                + '</div>';
        }).join('');
        container.innerHTML = html;
    },

    // Collects checked materials from a container
    getSelectedMaterials: function (containerId) {
        var container = document.getElementById(containerId);
        if (!container) return [];
        var materials = [];
        container.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
            var name = cb.getAttribute('data-mat-name');
            var qtyInput = container.querySelector('input[data-mat-qty="' + name + '"]');
            var qty = qtyInput ? parseFloat(qtyInput.value) || 0 : 0;
            if (name && qty > 0) materials.push({ name: name, qty: qty });
        });
        return materials;
    },

    onCategoryChange: function () {
        var catSelect = document.getElementById('est-categoria');
        var sugSelect = document.getElementById('est-produto-sugestao');
        if (!catSelect || !sugSelect) return;

        var cat = catSelect.value;
        var items = this.suggestions[cat] || [];
        var html = '<option value="">— Selecionar ou digitar abaixo —</option>';
        items.forEach(function (item) {
            html += '<option value="' + item.name + '" data-unit="' + item.unit + '">' + item.name + ' (' + item.unit + ')</option>';
        });
        sugSelect.innerHTML = html;
    },

    onSuggestionSelect: function () {
        var sugSelect = document.getElementById('est-produto-sugestao');
        var prodInput = document.getElementById('est-produto');
        var unitInput = document.getElementById('est-unit');
        if (!sugSelect || !prodInput) return;

        var val = sugSelect.value;
        if (val) {
            prodInput.value = val;
            var opt = sugSelect.options[sugSelect.selectedIndex];
            if (opt && opt.dataset.unit && unitInput) {
                unitInput.value = opt.dataset.unit;
            }
        }
    },

    filterBy: function (category) {
        this.currentFilter = category;
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.classList.remove('active');
            if (btn.textContent.indexOf(category === 'todos' ? 'Todos' : category === 'racao_sal' ? 'Ração' : category === 'remedios' ? 'Remédios' : 'Obras') >= 0) {
                btn.classList.add('active');
            }
        });
        this.render();
    },

    bindForm: function () {
        var form = document.getElementById('form-estoque');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.estoque.saveEntrada();
            });
        }
    },

    calcTotal: function () {
        var qty = parseFloat(document.getElementById('est-qty').value) || 0;
        var valorUnit = parseFloat(document.getElementById('est-valor').value) || 0;
        var total = qty * valorUnit;
        var preview = document.getElementById('est-total-preview');
        if (preview) {
            if (qty > 0 && valorUnit > 0) {
                preview.style.display = 'block';
                preview.textContent = 'Total: R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            } else {
                preview.style.display = 'none';
            }
        }
    },

    saveEntrada: function () {
        var produto = document.getElementById('est-produto').value;
        var qty = parseFloat(document.getElementById('est-qty').value) || 0;
        var unit = document.getElementById('est-unit').value;
        var valorUnit = parseFloat(document.getElementById('est-valor').value) || 0;
        var categoria = document.getElementById('est-categoria').value;
        var valorTotal = qty * valorUnit;

        if (!produto || !qty) {
            window.app.showToast('Preencha o produto e a quantidade.', 'error');
            return;
        }

        var ev = {
            type: 'ESTOQUE_ENTRADA',
            desc: produto,
            qty: qty,
            unit: unit || 'un',
            valorUnitario: valorUnit,
            value: valorTotal,
            category: categoria,
            date: new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);
        var msg = '✅ ' + qty + ' ' + (unit || 'un') + ' de ' + produto;
        if (valorTotal > 0) msg += ' — R$ ' + valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        window.app.showToast(msg);
        document.getElementById('form-estoque').reset();
        document.getElementById('est-total-preview').style.display = 'none';
        this.onCategoryChange();
        this.render();
    },

    render: function () {
        var container = document.getElementById('estoque-list');
        if (!container || !window.data) return;

        var events = window.data.events;
        var currentFilter = this.currentFilter;

        // Calculate stock balances
        var stock = {};

        events.forEach(function (ev) {
            if (ev.type === 'ESTOQUE_ENTRADA') {
                var key = (ev.desc || '').toLowerCase().trim();
                if (!key) return;
                if (!stock[key]) stock[key] = { name: ev.desc, qty: 0, unit: ev.unit || 'un', totalSpent: 0, category: ev.category || '' };
                stock[key].qty += (ev.qty || 0);
                stock[key].totalSpent += (ev.value || 0);
            }

            if (ev.type === 'SAIDA_ESTOQUE' && ev.items) {
                ev.items.forEach(function (item) {
                    var key = (item.name || '').toLowerCase().trim();
                    if (stock[key]) stock[key].qty -= (item.qty || 0);
                });
            }

            if (ev.type === 'OBRA_REGISTRO' && ev.materials) {
                ev.materials.forEach(function (mat) {
                    var key = (mat.name || '').toLowerCase().trim();
                    if (stock[key]) stock[key].qty -= (mat.qty || 0);
                });
            }
        });

        var keys = Object.keys(stock);

        // Apply filter
        if (currentFilter !== 'todos') {
            keys = keys.filter(function (key) {
                return stock[key].category === currentFilter;
            });
        }

        if (keys.length === 0) {
            var filterMsg = currentFilter !== 'todos' ? ' nesta categoria' : '';
            container.innerHTML = '<div class="empty-state">Nenhum insumo' + filterMsg + '. Use o formulário para registrar.</div>';
            return;
        }

        var catIcons = { racao_sal: '🧂', remedios: '💊', obras: '🔨' };

        // Stock table
        var html = '<table class="stock-table">'
            + '<thead><tr><th></th><th>Produto</th><th>Saldo</th><th>Unid</th><th>Investido</th></tr></thead>'
            + '<tbody>';

        keys.sort().forEach(function (key) {
            var item = stock[key];
            var saldoClass = item.qty <= 0 ? ' text-red' : '';
            var icon = catIcons[item.category] || '📦';
            html += '<tr>'
                + '<td>' + icon + '</td>'
                + '<td><strong>' + item.name + '</strong></td>'
                + '<td class="' + saldoClass + '">' + item.qty + '</td>'
                + '<td>' + item.unit + '</td>'
                + '<td>R$ ' + (item.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</td>'
                + '</tr>';
        });

        html += '</tbody></table>';

        // Recent movements
        var movements = events.filter(function (ev) {
            return ev.type === 'ESTOQUE_ENTRADA' || ev.type === 'SAIDA_ESTOQUE';
        });

        if (currentFilter !== 'todos') {
            movements = movements.filter(function (ev) {
                return ev.category === currentFilter;
            });
        }

        movements = movements.slice(-10).reverse();

        if (movements.length > 0) {
            html += '<div class="section-title" style="margin-top:16px;">Últimas Movimentações</div>';
            movements.forEach(function (ev) {
                var isEntrada = ev.type === 'ESTOQUE_ENTRADA';
                html += '<div class="history-card">'
                    + '<div class="history-card-header">'
                    + '  <span class="badge ' + (isEntrada ? 'badge-green' : 'badge-red') + '">'
                    + (isEntrada ? '📥 ENTRADA' : '📤 SAÍDA') + '</span>'
                    + '  <span class="date">' + (ev.date || '').split('T')[0] + '</span>'
                    + '</div>'
                    + '<div class="history-card-body">'
                    + '  <strong>' + (ev.desc || '--') + '</strong>'
                    + '  <span class="detail">' + (ev.qty || 0) + ' ' + (ev.unit || 'un') + '</span>'
                    + '</div>'
                    + '</div>';
            });
        }

        container.innerHTML = html;
    }
};
