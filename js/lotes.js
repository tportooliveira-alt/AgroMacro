// ====== MÓDULO: GESTÃO DE LOTES ======
window.lotes = {
    init: function () {
        console.log('Lotes Module Ready');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-lote');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.lotes.save();
            });
        }
    },

    save: function () {
        var nome = document.getElementById('lote-nome').value;
        var categoria = document.getElementById('lote-categoria').value;
        var qtdAnimais = parseInt(document.getElementById('lote-qtd').value) || 0;
        var pesoMedio = parseFloat(document.getElementById('lote-peso-medio').value) || 0;
        var pasto = document.getElementById('lote-pasto').value;
        var dataEntrada = document.getElementById('lote-data-entrada').value;
        var salMineral = document.getElementById('lote-sal').value;
        var salConsumo = parseFloat(document.getElementById('lote-sal-consumo').value) || 0;
        var racao = document.getElementById('lote-racao').value;
        var racaoConsumo = parseFloat(document.getElementById('lote-racao-consumo').value) || 0;
        var obs = document.getElementById('lote-obs').value;

        if (!nome || !qtdAnimais) {
            window.app.showToast('Preencha nome e quantidade.', 'error');
            return;
        }

        var lote = {
            type: 'LOTE',
            nome: nome,
            categoria: categoria,
            qtdAnimais: qtdAnimais,
            pesoMedio: pesoMedio,
            pasto: pasto,
            dataEntrada: dataEntrada,
            salMineral: salMineral,
            salConsumo: salConsumo,
            racao: racao,
            racaoConsumo: racaoConsumo,
            obs: obs,
            status: 'ATIVO',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        window.data.saveEvent(lote);
        window.app.showToast('✅ Lote ' + nome + ' cadastrado!');
        document.getElementById('form-lote').reset();
        this.renderList();
    },

    renderList: function () {
        var container = document.getElementById('lotes-list');
        if (!container) return;

        var allLotes = window.data.events.filter(function (ev) {
            return ev.type === 'LOTE';
        });

        if (allLotes.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum lote cadastrado. Crie seu primeiro lote!</div>';
            return;
        }

        // Summary KPIs
        var totalAnimais = 0;
        var lotesAtivos = allLotes.filter(function (l) { return l.status === 'ATIVO'; });
        lotesAtivos.forEach(function (l) { totalAnimais += (l.qtdAnimais || 0); });

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value positive">' + lotesAtivos.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Total Animais</div><div class="kpi-value">' + totalAnimais + '</div></div>'
            + '</div>';

        // Category labels
        var catLabels = {
            'cria': '🐮 Cria',
            'recria': '🐂 Recria',
            'engorda': '🥩 Engorda',
            'matrizes': '🐄 Matrizes',
            'touros': '🐃 Touros'
        };

        // Lot cards
        html += lotesAtivos.slice().reverse().map(function (l) {
            // Nutrition line
            var nutri = [];
            if (l.salMineral) nutri.push('🧂 ' + l.salMineral + (l.salConsumo ? ' (' + l.salConsumo + 'g/cab/dia)' : ''));
            if (l.racao) nutri.push('🌾 ' + l.racao + (l.racaoConsumo ? ' (' + l.racaoConsumo + 'kg/cab/dia)' : ''));
            var nutriLine = nutri.length > 0 ? '<div style="font-size:12px; color:var(--text-light); margin-top:4px;">' + nutri.join(' • ') + '</div>' : '';

            return '<div class="history-card">'
                + '<div class="history-card-header">'
                + '  <span class="badge badge-green">' + (catLabels[l.categoria] || '📋') + ' ' + l.nome + '</span>'
                + '  <span class="date">' + (l.status === 'ATIVO' ? '🟢 Ativo' : '⚪ Inativo') + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                + '  <strong>' + l.qtdAnimais + ' cabeças</strong>'
                + '  <span class="detail">' + (l.pesoMedio ? l.pesoMedio + ' kg médio' : '') + '</span>'
                + '  <span class="detail">' + (l.pasto ? '📍 ' + l.pasto : 'Sem pasto') + '</span>'
                + nutriLine
                + '</div>'
                + '</div>';
        }).join('');

        container.innerHTML = html;
    },

    getLotes: function () {
        return window.data.events.filter(function (ev) {
            return ev.type === 'LOTE' && ev.status === 'ATIVO';
        });
    },

    // Populate lote dropdown in other forms
    populateSelect: function (selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;

        var lotes = this.getLotes();
        var html = '<option value="">Selecionar Lote...</option>';
        lotes.forEach(function (l) {
            html += '<option value="' + l.nome + '">' + l.nome + ' (' + l.qtdAnimais + ' cab)</option>';
        });
        select.innerHTML = html;
    }
};
