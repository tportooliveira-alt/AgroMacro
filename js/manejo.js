// ====== MÓDULO: MANEJO (Sanitário, Pesagem, Movimentação) ======
window.manejo = {
    filterTipo: 'todos',

    init: function () {
        console.log('Manejo Module Ready');
        this.bindForm();
    },

    setFilterTipo: function (tipo) {
        this.filterTipo = tipo;
        this.renderHistory();
    },

    bindForm: function () {
        var form = document.getElementById('form-manejo');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.manejo.save();
            });
        }
    },

    save: function () {
        var tipo = document.getElementById('manejo-tipo').value;
        var lote = document.getElementById('manejo-lote') ? document.getElementById('manejo-lote').value : '';
        var produtoSelect = document.getElementById('manejo-produto');
        var produtoVal = produtoSelect ? produtoSelect.value : '';
        var desc = '';
        if (produtoVal === '__outro__' || produtoVal === '') {
            var customDesc = document.getElementById('manejo-desc-custom');
            desc = customDesc ? customDesc.value : '';
        } else {
            desc = produtoVal;
        }
        if (!desc && produtoVal === '') {
            // fallback: try hidden field
            desc = document.getElementById('manejo-desc') ? document.getElementById('manejo-desc').value : '';
        }
        var qtd = parseInt(document.getElementById('manejo-qtd').value) || 0;
        var data = document.getElementById('manejo-data').value;
        var custo = parseFloat(document.getElementById('manejo-custo').value) || 0;

        if (!desc) {
            window.app.showToast('Selecione um produto ou preencha a descrição.', 'error');
            return;
        }

        // Get selected materials from dynamic checkboxes
        var materials = [];
        if (window.estoque) {
            materials = window.estoque.getSelectedMaterials('manejo-materials-list');
        }

        // Save manejo event
        var ev = {
            type: 'MANEJO',
            tipoManejo: tipo,
            lote: lote,
            desc: desc,
            qtdAnimais: qtd,
            cost: custo,
            materiaisUsados: materials,
            date: data || new Date().toISOString().split('T')[0]
        };
        window.data.saveEvent(ev);

        // For each material used, save stock deduction (two-event rule)
        if (materials.length > 0) {
            var saida = {
                type: 'SAIDA_ESTOQUE',
                desc: 'Manejo: ' + desc,
                items: materials,
                motivo: 'Manejo: ' + desc,
                date: data || new Date().toISOString().split('T')[0]
            };
            window.data.saveEvent(saida);
        }

        window.app.showToast('✅ Manejo registrado: ' + desc);
        document.getElementById('form-manejo').reset();
        this.renderHistory();
    },

    renderHistory: function () {
        var container = document.getElementById('manejo-history');
        if (!container || !window.data) return;

        var manejos = window.data.getByType('MANEJO');
        var self = this;

        // Filter bar
        var tipoConfig = {
            'vacinacao': { icon: '💉', label: 'Vacinação', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            'pesagem': { icon: '⚖️', label: 'Pesagem', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            'movimentacao': { icon: '🔄', label: 'Movimentação', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
            'mortalidade': { icon: '⚠️', label: 'Mortalidade', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
            'outro': { icon: '📝', label: 'Outro', color: '#64748B', bg: 'rgba(100,116,139,0.08)' }
        };

        // Filter buttons
        var filterHtml = '<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;overflow-x:auto;">';
        var filterActive = self.filterTipo || 'todos';
        var activeStyle = 'background:#1E293B;color:white;border:none;';
        var inactiveStyle = 'background:#F1F5F9;color:#475569;border:1px solid #E2E8F0;';

        filterHtml += '<button style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;' + (filterActive === 'todos' ? activeStyle : inactiveStyle) + '" onclick="window.manejo.setFilterTipo(\'todos\')">📋 Todos</button>';

        Object.keys(tipoConfig).forEach(function (key) {
            var cfg = tipoConfig[key];
            var isActive = filterActive === key;
            filterHtml += '<button style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;' + (isActive ? activeStyle : inactiveStyle) + '" onclick="window.manejo.setFilterTipo(\'' + key + '\')">' + cfg.icon + ' ' + cfg.label + '</button>';
        });
        filterHtml += '</div>';

        // Apply filter
        if (self.filterTipo && self.filterTipo !== 'todos') {
            manejos = manejos.filter(function (ev) {
                return ev.tipoManejo === self.filterTipo;
            });
        }

        if (manejos.length === 0 && self.filterTipo === 'todos') {
            container.innerHTML = filterHtml + '<div class="empty-state">Nenhum manejo registrado.</div>';
            return;
        }

        if (manejos.length === 0) {
            container.innerHTML = filterHtml + '<div class="empty-state">Nenhum manejo do tipo "' + (tipoConfig[self.filterTipo] || {}).label + '" encontrado.</div>';
            return;
        }

        var html = filterHtml + manejos.slice().reverse().map(function (ev) {
            var cfg = tipoConfig[ev.tipoManejo] || tipoConfig['outro'];
            var dateStr = (ev.date || '').split('T')[0];
            var dateParts = dateStr.split('-');
            var dateFormatted = dateParts.length === 3 ? dateParts[2] + '/' + dateParts[1] : dateStr;

            var cardStyle = 'background:' + cfg.bg + ';border-left:4px solid ' + cfg.color + ';border-radius:12px;padding:12px 14px;margin-bottom:10px;transition:all 0.2s ease;';
            var iconStyle = 'font-size:22px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:' + cfg.color + '15;border-radius:10px;flex-shrink:0;';
            var labelStyle = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:' + cfg.color + ';';
            var descStyle = 'font-size:14px;font-weight:600;color:#1E293B;margin:2px 0;';
            var detailStyle = 'font-size:11px;color:#64748B;';
            var dateStyle = 'font-size:11px;font-weight:600;color:#94A3B8;white-space:nowrap;';
            var costStyle = 'font-size:12px;font-weight:700;color:#DC2626;margin-top:4px;';

            return '<div style="' + cardStyle + '">'
                + '<div style="display:flex;gap:12px;align-items:flex-start;">'
                + '<div style="' + iconStyle + '">' + cfg.icon + '</div>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<span style="' + labelStyle + '">' + cfg.label + '</span>'
                + '<span style="' + dateStyle + '">📅 ' + dateFormatted + '</span>'
                + '</div>'
                + '<div style="' + descStyle + '">' + (ev.desc || '--') + '</div>'
                + '<div style="display:flex;gap:12px;flex-wrap:wrap;">'
                + (ev.qtdAnimais ? '<span style="' + detailStyle + '">🐄 ' + ev.qtdAnimais + ' cab</span>' : '')
                + (ev.lote ? '<span style="' + detailStyle + '">📋 ' + ev.lote + '</span>' : '')
                + '</div>'
                + (ev.cost ? '<div style="' + costStyle + '">💰 R$ ' + ev.cost.toFixed(2) + '</div>' : '')
                + '</div>'
                + '</div>'
                + '</div>';
        }).join('');

        container.innerHTML = html;
    }
};
