// ====== MÓDULO: RASTREABILIDADE (SISBOV / GTA) ======
window.rastreabilidade = {
    init: function () {
        console.log('Rastreabilidade Module Ready');
        this.bindEvents();
    },

    bindEvents: function () {
        // Event listeners for the specific view
        var btnEmitir = document.getElementById('btn-emitir-gta');
        if (btnEmitir) {
            btnEmitir.addEventListener('click', this.emitirGTASimulada);
        }
    },

    render: function () {
        var container = document.getElementById('rastreabilidade-content');
        if (!container) return;

        var lotes = window.lotes.getLotes();
        var totalAnimais = lotes.reduce((acc, l) => acc + (l.qtdAnimais || 0), 0);
        var identificados = 0; // Simulação: 80% identificados
        var brincos = window.data.events.filter(ev => ev.type === 'BRINCO_SISBOV');
        identificados = brincos.length > 0 ? brincos.length : Math.round(totalAnimais * 0.8);

        var html = '<div class="kpi-section">'
            + '<div class="kpi-title">📋 Status SISBOV (PNIB)</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Rebanho Total</div><div class="kpi-value">' + totalAnimais + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Identificados</div><div class="kpi-value positive">' + identificados + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pendentes</div><div class="kpi-value negative">' + (totalAnimais - identificados) + '</div></div>'
            + '</div></div>';

        html += '<div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">'
            + '<button id="btn-emitir-gta" class="submit-btn" style="background:#2563EB; display:flex; justify-content:center; align-items:center; gap:8px;">'
            + '📄 Emitir GTA'
            + '</button>'
            + '<button onclick="window.rastreabilidade.consultarPassaporte()" class="submit-btn" style="background:#0F172A; display:flex; justify-content:center; align-items:center; gap:8px;">'
            + '⛓️ Blockchain'
            + '</button>'
            + '</div>';

        html += '<div class="section-title" style="margin-top:24px;">Histórico de GTAs Emitidas</div>'
            + '<div id="gta-history" style="margin-top:12px;">';

        var gtas = window.data.events.filter(ev => ev.type === 'GTA_EMITIDA').reverse();

        if (gtas.length === 0) {
            html += '<div class="empty-state">Nenhuma GTA emitida recentemente</div>';
        } else {
            gtas.forEach(function (gta) {
                html += '<div class="history-card" style="border-left:4px solid #2563EB;">'
                    + '<div class="history-card-header">'
                    + '<span class="badge badge-green">e-GTA</span>'
                    + '<span class="date">' + new Date(gta.date).toLocaleDateString() + '</span>'
                    + '</div>'
                    + '<div class="history-card-body">'
                    + '<strong>Destino: ' + (gta.destino || 'Frigorífico') + '</strong>'
                    + '<span class="detail">' + gta.qtd + ' animais · Série ' + gta.serie + '</span>'
                    + '<div style="margin-top:8px; font-size:11px; color:#64748B;">Autenticação: ' + gta.hash.substring(0, 16) + '...</div>'
                    + '</div>'
                    + '</div>';
            });
        }

        html += '</div>';

        container.innerHTML = html;
        this.bindEvents(); // Re-bind events for new buttons if needed
    },

    consultarPassaporte: function () {
        var brinco = prompt("Informe o brinco do animal (Ex: 9812):");
        if (brinco && window.safebeef) {
            window.safebeef.gerarPassaporte(brinco);
        } else if (!window.safebeef) {
            alert("Módulo Blockchain não carregado.");
        }
    },

    emitirGTASimulada: function () {
        var destino = prompt("Informe o destino (Ex: Frigorífico Boi Gordo):", "Frigorífico Local");
        if (!destino) return;

        var qtd = parseInt(prompt("Quantidade de animais:", "15"));
        if (!qtd) return;

        var gta = {
            type: 'GTA_EMITIDA',
            destino: destino,
            qtd: qtd,
            serie: 'BA-' + Math.floor(Math.random() * 1000000),
            hash: 'Authentic-' + Date.now() + '-' + Math.random().toString(36).substring(7),
            date: new Date().toISOString()
        };

        window.data.saveEvent(gta);
        window.rastreabilidade.render();
        alert("✅ e-GTA Simulada emitida com sucesso!\nSérie: " + gta.serie);
    }
};
