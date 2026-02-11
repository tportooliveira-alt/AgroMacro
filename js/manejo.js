// ====== MÓDULO: MANEJO (Sanitário, Pesagem, Movimentação) ======
window.manejo = {
    init: function () {
        console.log('Manejo Module Ready');
        this.bindForm();
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

        if (manejos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum manejo registrado.</div>';
            return;
        }

        var tipoLabels = {
            'vacinacao': '🩺 Vacinação',
            'pesagem': '⚖️ Pesagem',
            'movimentacao': '🔄 Movimentação',
            'mortalidade': '⚠️ Mortalidade',
            'outro': '📝 Outro'
        };

        var html = manejos.slice().reverse().map(function (ev) {
            return '<div class="history-card">'
                + '<div class="history-card-header">'
                + '  <span class="badge badge-green">' + (tipoLabels[ev.tipoManejo] || '📝') + '</span>'
                + '  <span class="date">' + (ev.date || '').split('T')[0] + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                + '  <strong>' + (ev.desc || '--') + '</strong>'
                + '  <span class="detail">' + (ev.qtdAnimais ? ev.qtdAnimais + ' cab' : '') + '</span>'
                + '  <span class="detail">' + (ev.lote ? '📋 ' + ev.lote : '') + '</span>'
                + (ev.cost ? '<span class="detail cost text-red">R$ ' + ev.cost.toFixed(2) + '</span>' : '')
                + '</div>'
                + '</div>';
        }).join('');

        container.innerHTML = html;
    }
};
