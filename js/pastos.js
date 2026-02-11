// ====== MÓDULO: CADASTRO DE PASTOS (Piquetes) ======
window.pastos = {
    init: function () {
        console.log('Pastos Module Ready');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-pasto');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.pastos.save();
            });
        }
    },

    save: function () {
        var nome = document.getElementById('pasto-nome').value;
        var area = parseFloat(document.getElementById('pasto-area').value) || 0;
        var capacidade = parseInt(document.getElementById('pasto-capacidade').value) || 0;
        var tipo = document.getElementById('pasto-tipo').value;
        var status = document.getElementById('pasto-status').value;
        var obs = document.getElementById('pasto-obs').value;

        if (!nome) {
            alert('Informe o nome do pasto.');
            return;
        }

        var pasto = {
            type: 'PASTO',
            nome: nome,
            area: area,
            capacidade: capacidade,
            tipoPasto: tipo,
            statusPasto: status,
            obs: obs,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        window.data.saveEvent(pasto);
        alert('Pasto cadastrado com sucesso!');
        document.getElementById('form-pasto').reset();
        this.renderList();
    },

    renderList: function () {
        var container = document.getElementById('pastos-list');
        if (!container) return;

        var pastos = window.data.events.filter(function (ev) {
            return ev.type === 'PASTO';
        });

        if (pastos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum pasto cadastrado. Registre seu primeiro piquete!</div>';
            return;
        }

        // Summary
        var totalArea = 0;
        var totalCap = 0;
        pastos.forEach(function (p) {
            totalArea += (p.area || 0);
            totalCap += (p.capacidade || 0);
        });

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Piquetes</div><div class="kpi-value positive">' + pastos.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Área Total</div><div class="kpi-value">' + totalArea.toFixed(1) + ' ha</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Capacidade</div><div class="kpi-value">' + totalCap + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Ocupação</div><div class="kpi-value">--</div></div>'
            + '</div>';

        // Pasture list
        var statusLabels = {
            'disponivel': '🟢 Disponível',
            'ocupado': '🔴 Ocupado',
            'descanso': '🟡 Em Descanso',
            'manutencao': '🔧 Manutenção'
        };

        html += pastos.slice().reverse().map(function (p) {
            return '<div class="history-card">'
                + '<div class="history-card-header">'
                + '  <span class="badge badge-green">🌾 ' + p.nome + '</span>'
                + '  <span class="date">' + (statusLabels[p.statusPasto] || p.statusPasto) + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                + '  <strong>' + (p.area ? p.area + ' ha' : '--') + '</strong>'
                + '  <span class="detail">Cap: ' + (p.capacidade || '--') + ' cab</span>'
                + '  <span class="detail">' + (p.tipoPasto || '') + '</span>'
                + '</div>'
                + '</div>';
        }).join('');

        container.innerHTML = html;
    },

    getPastos: function () {
        return window.data.events.filter(function (ev) {
            return ev.type === 'PASTO';
        });
    }
};
