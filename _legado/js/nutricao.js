// ====== MÓDULO: NUTRIÇÃO & LEITURA DE COCHO ======
// Feature: Ajuste fino de trato baseado em sobras
window.nutricao = {
    init: function () {
        console.log('Nutrição Module Ready');
    },

    // Escores de Cocho (0 a 4)
    escores: {
        0: { label: '0 - Cocho Limpo (Lambido)', ajuste: '+5%', icon: '🟢' },
        1: { label: '1 - < 5% de Sobra (Farelo)', ajuste: 'Manter', icon: '🟢' },
        2: { label: '2 - 5% a 10% de Sobra', ajuste: '-5%', icon: '🟡' },
        3: { label: '3 - 10% a 25% de Sobra', ajuste: '-15%', icon: '🟠' },
        4: { label: '4 - > 25% de Sobra (Cheio)', ajuste: '-30%', icon: '🔴' }
    },

    abrirLeitura: function (loteNome) {
        var html = '<div class="modal-overlay" id="modal-leitura">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🍽️ Leitura de Cocho: ' + loteNome + '</h3>'
            + '<button onclick="window.nutricao.fecharModal(\'modal-leitura\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Como estava o cocho antes do trato?</label></div>'
            + '<div class="grid-options">';

        for (var i = 0; i <= 4; i++) {
            var sc = this.escores[i];
            html += '<button class="option-btn" onclick="window.nutricao.confirmarLeitura(\'' + loteNome + '\', ' + i + ')">'
                + '<div style="font-size:24px;">' + sc.icon + '</div>'
                + '<div><strong>Nota ' + i + '</strong></div>'
                + '<div style="font-size:11px;opacity:0.8;">' + sc.label.split('-')[1] + '</div>'
                + '<div style="font-size:10px;font-weight:bold;color:#2563EB;margin-top:4px;">Ajuste: ' + sc.ajuste + '</div>'
                + '</button>';
        }

        html += '</div></div></div></div>';

        // Add styles for grid options if not exists
        if (!document.getElementById('style-nutricao')) {
            var style = document.createElement('style');
            style.id = 'style-nutricao';
            style.innerHTML = '.grid-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } '
                + '.option-btn { border: 1px solid #E2E8F0; background: #F8FAFC; border-radius: 8px; padding: 12px; text-align: center; cursor: pointer; transition: all 0.2s; } '
                + '.option-btn:hover { background: #EEF2FF; border-color: #2563EB; transform: translateY(-2px); } '
                + '.option-btn:active { transform: scale(0.98); }';
            document.head.appendChild(style);
        }

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarLeitura: function (loteNome, nota) {
        var event = {
            type: 'LEITURA_COCHO',
            lote: loteNome,
            nota: nota,
            ajuste: this.escores[nota].ajuste,
            date: new Date().toISOString()
        };
        window.data.saveEvent(event);

        this.fecharModal('modal-leitura');
        window.app.showToast('✅ Leitura nota ' + nota + ' registrada!');
        if (window.lotes) window.lotes.renderList(); // Refresh lotes UI
    },

    getUltimaLeitura: function (loteNome) {
        if (!window.data) return null;
        var leituras = window.data.events.filter(function (ev) {
            return ev.type === 'LEITURA_COCHO' && ev.lote === loteNome;
        });
        return leituras.length > 0 ? leituras[leituras.length - 1] : null;
    },

    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
