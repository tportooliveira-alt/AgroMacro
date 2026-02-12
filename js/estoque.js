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

    // Infers category from product name by matching against known suggestion lists
    inferCategory: function (name) {
        if (!name) return '';
        var lower = name.toLowerCase();
        var cats = this.suggestions;
        for (var cat in cats) {
            for (var i = 0; i < cats[cat].length; i++) {
                if (cats[cat][i].name.toLowerCase() === lower) return cat;
            }
        }
        // Keyword-based fallback
        if (lower.indexOf('vacina') >= 0 || lower.indexOf('verm') >= 0 || lower.indexOf('antibio') >= 0
            || lower.indexOf('anti-infla') >= 0 || lower.indexOf('carrapati') >= 0 || lower.indexOf('bernicida') >= 0
            || lower.indexOf('ocitocina') >= 0 || lower.indexOf('aneste') >= 0 || lower.indexOf('cicatri') >= 0
            || lower.indexOf('seringa') >= 0 || lower.indexOf('agulha') >= 0 || lower.indexOf('remedio') >= 0
            || lower.indexOf('medicamento') >= 0 || lower.indexOf('brinco') >= 0) return 'remedios';
        if (lower.indexOf('sal ') >= 0 || lower.indexOf('mineral') >= 0 || lower.indexOf('ra') >= 0 && lower.indexOf('ão') >= 0
            || lower.indexOf('racao') >= 0 || lower.indexOf('farelo') >= 0 || lower.indexOf('milho') >= 0
            || lower.indexOf('silagem') >= 0 || lower.indexOf('feno') >= 0 || lower.indexOf('ureia') >= 0
            || lower.indexOf('proteinado') >= 0 || lower.indexOf('polpa') >= 0 || lower.indexOf('algod') >= 0) return 'racao_sal';
        if (lower.indexOf('arame') >= 0 || lower.indexOf('estaca') >= 0 || lower.indexOf('mour') >= 0
            || lower.indexOf('cimento') >= 0 || lower.indexOf('areia') >= 0 || lower.indexOf('brita') >= 0
            || lower.indexOf('prego') >= 0 || lower.indexOf('grampo') >= 0 || lower.indexOf('parafuso') >= 0
            || lower.indexOf('telha') >= 0 || lower.indexOf('madeira') >= 0 || lower.indexOf('cocho') >= 0
            || lower.indexOf('bebedouro') >= 0 || lower.indexOf('dobrad') >= 0 || lower.indexOf('tabua') >= 0
            || lower.indexOf('caibro') >= 0 || lower.indexOf('furadeira') >= 0 || lower.indexOf('serrote') >= 0
            || lower.indexOf('martelo') >= 0 || lower.indexOf('alicate') >= 0) return 'obras';
        return '';
    },
    // Normalizes a string key removing accents to avoid duplicates like Mourão/Mourao
    normalizeKey: function (str) {
        return (str || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    // Returns array of {name, qty, unit, category} — used by Manejo and Obras
    getStockItems: function () {
        if (!window.data) return [];
        var self = this;
        var stock = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'ESTOQUE_ENTRADA') {
                var prodName = ev.name || ev.desc || '';
                var key = self.normalizeKey(prodName);
                if (!key) return;
                var cat = ev.category || self.inferCategory(prodName);
                if (!stock[key]) stock[key] = { name: prodName, qty: 0, unit: ev.unit || 'un', category: cat };
                stock[key].qty += (ev.qty || 0);
            }
            if (ev.type === 'SAIDA_ESTOQUE' && ev.items) {
                ev.items.forEach(function (item) {
                    var key = self.normalizeKey(item.name);
                    if (stock[key]) stock[key].qty -= (item.qty || 0);
                });
            }
            if (ev.type === 'OBRA_REGISTRO' && ev.materials) {
                ev.materials.forEach(function (mat) {
                    var key = self.normalizeKey(mat.name);
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

    // Populates the manejo-produto dropdown with remedios from stock
    populateManejoProducts: function () {
        var select = document.getElementById('manejo-produto');
        if (!select) return;
        var items = this.getStockByCategory('remedios');
        var html = '<option value="">Selecionar do Estoque...</option>';
        items.forEach(function (item) {
            html += '<option value="' + item.name + '">💊 ' + item.name + ' (' + item.qty + ' ' + item.unit + ')</option>';
        });
        html += '<option value="__outro__">📝 Outro (digitar)</option>';
        select.innerHTML = html;
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
    // categoryFilter: 'remedios' for Manejo, 'obras' for Obras, null for all
    renderMaterialCheckboxes: function (containerId, categoryFilter) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var items = this.getStockItems();
        // Filter by category if specified
        if (categoryFilter) {
            items = items.filter(function (item) {
                return item.category === categoryFilter;
            });
        }
        if (items.length === 0) {
            var catName = categoryFilter === 'remedios' ? ' (Remédios/Vacinas)' : categoryFilter === 'obras' ? ' (Obras)' : '';
            container.innerHTML = '<div class="empty-state">Nenhum material' + catName + ' no estoque.</div>';
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
        var qtdSacos = parseFloat(document.getElementById('est-qty').value) || 0;
        var pesoSaco = parseFloat(document.getElementById('est-peso-saco').value) || 0;
        var valorSaco = parseFloat(document.getElementById('est-valor').value) || 0;
        var totalKg = qtdSacos * pesoSaco;
        var custoTotal = qtdSacos * valorSaco;
        var custoKg = totalKg > 0 ? custoTotal / totalKg : 0;
        var preview = document.getElementById('est-total-preview');
        if (preview) {
            if (qtdSacos > 0 && (pesoSaco > 0 || valorSaco > 0)) {
                var html = '<div style="background:var(--bg-3);border:1px solid var(--border-subtle);border-radius:var(--radius-xs);padding:12px;margin:8px 0;">';
                html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-2);font-size:12px;">Total Kg</span><strong style="font-size:16px;color:var(--green);">' + totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + ' kg</strong></div>';
                if (custoTotal > 0) {
                    html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-2);font-size:12px;">Custo Total</span><strong style="font-size:16px;color:var(--text-0);">R$ ' + custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</strong></div>';
                    html += '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-2);font-size:12px;">Custo por Kg</span><strong style="font-size:16px;color:var(--gold);">R$ ' + custoKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/kg</strong></div>';
                }
                html += '</div>';
                preview.innerHTML = html;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }
    },

    saveEntrada: function () {
        var produto = document.getElementById('est-produto').value;
        var qtdSacos = parseFloat(document.getElementById('est-qty').value) || 0;
        var pesoSaco = parseFloat(document.getElementById('est-peso-saco').value) || 0;
        var unit = document.getElementById('est-unit').value;
        var valorSaco = parseFloat(document.getElementById('est-valor').value) || 0;
        var categoria = document.getElementById('est-categoria').value;
        var totalKg = qtdSacos * pesoSaco;
        var custoTotal = qtdSacos * valorSaco;
        var custoKg = totalKg > 0 ? custoTotal / totalKg : 0;

        if (!produto || !qtdSacos) {
            window.app.showToast('Preencha o produto e a quantidade.', 'error');
            return;
        }

        var ev = {
            type: 'ESTOQUE_ENTRADA',
            name: produto,
            desc: produto,
            qty: qtdSacos,
            totalKg: totalKg,
            pesoSaco: pesoSaco,
            unit: unit || 'sacos',
            valorUnitario: custoKg,
            valorSaco: valorSaco,
            value: custoTotal,
            category: categoria,
            date: new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);
        var msg = '✅ ' + qtdSacos + ' sacos de ' + produto + ' (' + totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) + 'kg)';
        if (custoTotal > 0) msg += ' — R$ ' + custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (R$' + custoKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/kg)';
        window.app.showToast(msg);
        document.getElementById('form-estoque').reset();
        document.getElementById('est-peso-saco').value = '25';
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

        var self = this;
        events.forEach(function (ev) {
            if (ev.type === 'ESTOQUE_ENTRADA') {
                var prodName = ev.name || ev.desc || '';
                var key = self.normalizeKey(prodName);
                if (!key) return;
                var cat = ev.category || self.inferCategory(prodName);
                if (!stock[key]) stock[key] = { name: prodName, qty: 0, unit: ev.unit || 'un', totalSpent: 0, category: cat, maxQty: 0 };
                stock[key].qty += (ev.qty || 0);
                stock[key].totalSpent += (ev.value || 0);
                if (stock[key].qty > stock[key].maxQty) stock[key].maxQty = stock[key].qty;
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

        var catConfig = {
            'racao_sal': { icon: '🧂', label: 'Ração/Sal', color: '#D97706', bg: 'rgba(217,119,6,0.06)' },
            'remedios': { icon: '💊', label: 'Remédios', color: '#7C3AED', bg: 'rgba(124,58,237,0.06)' },
            'obras': { icon: '🔨', label: 'Materiais', color: '#2563EB', bg: 'rgba(37,99,235,0.06)' }
        };

        // Stock cards with progress bars
        var html = '';
        keys.sort().forEach(function (key) {
            var item = stock[key];
            var cfg = catConfig[item.category] || { icon: '📦', label: 'Geral', color: '#64748B', bg: 'rgba(100,116,139,0.06)' };
            var maxQ = item.maxQty > 0 ? item.maxQty : Math.max(item.qty, 100);
            var pct = Math.max(0, Math.min(100, Math.round((item.qty / maxQ) * 100)));
            var barColor = pct > 50 ? '#059669' : pct > 20 ? '#D97706' : '#DC2626';
            var unitPrice = item.qty > 0 ? (item.totalSpent / item.qty) : 0;

            var cardStyle = 'background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);';
            var iconBoxStyle = 'width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:' + cfg.bg + ';border-radius:10px;font-size:20px;flex-shrink:0;border:1px solid ' + cfg.color + '20;';
            var barBg = 'height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;margin-top:8px;';
            var barFill = 'height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:4px;transition:width 0.8s cubic-bezier(0.25,1,0.5,1);';

            html += '<div style="' + cardStyle + '">'
                + '<div style="display:flex;gap:12px;align-items:flex-start;">'
                + '<div style="' + iconBoxStyle + '">' + cfg.icon + '</div>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<div style="font-size:14px;font-weight:700;color:#1E293B;">' + item.name + '</div>'
                + '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:' + cfg.color + ';">' + cfg.label + '</div>'
                + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;">'
                + '<div style="font-family:monospace;font-size:18px;font-weight:800;color:' + barColor + ';">' + item.qty + ' <span style="font-size:12px;font-weight:600;color:#94A3B8;">' + item.unit + '</span></div>'
                + '<div style="font-size:11px;color:#64748B;">' + (unitPrice > 0 ? 'R$ ' + unitPrice.toFixed(2) + '/' + item.unit : '') + '</div>'
                + '</div>'
                + '<div style="' + barBg + '"><div style="' + barFill + '"></div></div>'
                + '<div style="display:flex;justify-content:space-between;margin-top:4px;">'
                + '<span style="font-size:10px;color:#94A3B8;">' + pct + '% do máximo</span>'
                + '<span style="font-size:10px;font-weight:600;color:#64748B;">Investido: R$ ' + (item.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</span>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';
        });

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
                var moveColor = isEntrada ? '#059669' : '#DC2626';
                var moveBg = isEntrada ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)';
                var moveIcon = isEntrada ? '📥' : '📤';
                var moveLabel = isEntrada ? 'ENTRADA' : 'SAÍDA';
                var dateStr = (ev.date || '').split('T')[0];
                var dp = dateStr.split('-');
                var df = dp.length === 3 ? dp[2] + '/' + dp[1] : dateStr;

                html += '<div style="background:' + moveBg + ';border-left:4px solid ' + moveColor + ';border-radius:10px;padding:10px 12px;margin-bottom:8px;">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<span style="font-size:10px;font-weight:700;text-transform:uppercase;color:' + moveColor + ';">' + moveIcon + ' ' + moveLabel + '</span>'
                    + '<span style="font-size:10px;color:#94A3B8;">📅 ' + df + '</span>'
                    + '</div>'
                    + '<div style="font-size:13px;font-weight:600;color:#1E293B;margin-top:2px;">' + (ev.desc || ev.name || '--') + '</div>'
                    + '<div style="font-size:11px;color:#64748B;">' + (ev.qty || 0) + ' ' + (ev.unit || 'un')
                    + (ev.value ? ' · R$ ' + ev.value.toFixed(2) : '') + '</div>'
                    + '</div>';
            });
        }

        container.innerHTML = html;
    }
};
