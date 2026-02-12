// ====== MÓDULO: GESTÃO AVANÇADA DE PASTO ======
// Features 13-15: Lotação UA/ha, Rotação de Piquetes, Avaliação de Pastagem
window.pastoMgmt = {

    init: function () {
        console.log('Pasto Management Module Ready');
    },

    // ====== 13. LOTAÇÃO POR HECTARE (UA/ha) ======
    // 1 UA = 450kg (convenção brasileira)
    calcLotacao: function (pasto) {
        if (!pasto || !pasto.hectares) return { uaha: 0, lotacao: 'N/A' };

        var animaisNoPasto = 0;
        var pesoTotal = 0;

        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                if ((l.pasto || l.pastoAtual) === pasto.nome) {
                    animaisNoPasto += (l.qtdAnimais || 0);
                    pesoTotal += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
                }
            });
        }

        var pesoMedio = animaisNoPasto > 0 ? pesoTotal / animaisNoPasto : 0;
        var ua = pesoTotal / 450; // Unidades Animais
        var uaha = pasto.hectares > 0 ? ua / pasto.hectares : 0;

        // Classificação (ideal: 0.8-1.2 UA/ha para pasto tropical)
        var status = 'ideal';
        if (uaha > 1.5) status = 'superlotado';
        else if (uaha > 1.2) status = 'alto';
        else if (uaha < 0.5 && animaisNoPasto > 0) status = 'subutilizado';
        else if (animaisNoPasto === 0) status = 'vazio';

        return {
            uaha: uaha,
            ua: ua,
            animais: animaisNoPasto,
            pesoMedio: pesoMedio,
            hectares: pasto.hectares,
            status: status
        };
    },

    // ====== 14. ROTAÇÃO DE PIQUETES ======
    renderRotacao: function () {
        if (!window.data) return '';
        var trocas = window.data.events.filter(function (ev) {
            return ev.type === 'TROCA_PASTO';
        });

        trocas.sort(function (a, b) {
            return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
        });

        if (trocas.length === 0) return '<div class="empty-state">Nenhuma troca de pasto registrada.</div>';

        var html = '<div class="section-title" style="margin-top:16px;">🔄 Histórico de Rotação</div>';
        trocas.slice(0, 20).forEach(function (t) {
            html += '<div class="history-card">'
                + '<div class="history-card-header">'
                + '<span class="badge badge-blue">🔄 Rotação</span>'
                + '<span class="date">' + (t.date || '').split('T')[0] + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                + '<strong>' + (t.lote || '') + '</strong>'
                + '<span class="detail">' + (t.pastoAnterior || '?') + ' → ' + (t.pastoNovo || '?') + '</span>'
                + '</div></div>';
        });

        return html;
    },

    // ====== 15. AVALIAÇÃO DE PASTAGEM ======
    abrirAvaliacao: function (pastoNome) {
        var html = '<div class="modal-overlay" id="modal-avaliacao">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🌿 Avaliar Pastagem</h3>'
            + '<button onclick="window.pastoMgmt.fecharModal(\'modal-avaliacao\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Pasto: <strong>' + pastoNome + '</strong></label></div>'
            + '<div class="form-group"><label>Condição da Pastagem</label>'
            + '<select id="aval-nota">'
            + '<option value="otimo">🟢 Ótima</option>'
            + '<option value="bom">🟡 Boa</option>'
            + '<option value="regular">🟠 Regular</option>'
            + '<option value="ruim">🔴 Ruim</option>'
            + '<option value="degradado">⚫ Degradada</option></select></div>'
            + '<div class="form-group"><label>Altura do Capim (cm)</label>'
            + '<input type="number" id="aval-altura" step="1" placeholder="30"></div>'
            + '<div class="form-group"><label>Observação</label>'
            + '<input type="text" id="aval-obs" placeholder="Detalhes"></div>'
            + '<button class="submit-btn" onclick="window.pastoMgmt.confirmarAvaliacao(\'' + pastoNome + '\')">✅ Salvar Avaliação</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarAvaliacao: function (pastoNome) {
        var nota = document.getElementById('aval-nota').value;
        var altura = parseFloat(document.getElementById('aval-altura').value) || 0;
        var obs = document.getElementById('aval-obs').value;

        window.data.saveEvent({
            type: 'AVALIACAO_PASTO', pasto: pastoNome, nota: nota,
            alturaCapim: altura, obs: obs,
            date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-avaliacao');
        window.app.showToast('✅ Avaliação registrada para ' + pastoNome);
        if (window.pastos) window.pastos.renderList();
    },

    // Get last evaluation for a pasto
    getUltimaAvaliacao: function (pastoNome) {
        if (!window.data) return null;
        var avaliacoes = window.data.events.filter(function (ev) {
            return ev.type === 'AVALIACAO_PASTO' && ev.pasto === pastoNome;
        });
        return avaliacoes.length > 0 ? avaliacoes[avaliacoes.length - 1] : null;
    },

    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
