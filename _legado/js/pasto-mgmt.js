// ====== MÓDULO: GESTÃO AVANÇADA DE PASTO ======
// Features 13-15: Lotação UA/ha, Rotação de Piquetes, Avaliação de Pastagem
window.pastoMgmt = {

    init: function () {
        console.log('Pasto Management Module Ready');
    },

    // ====== 13. LOTAÇÃO POR HECTARE (UA/ha) ======
    // 1 UA = 450kg (convenção brasileira)
    calcLotacao: function (pasto) {
        var ha = pasto ? (pasto.hectares || pasto.area || 0) : 0;
        if (!pasto || ha === 0) return { uaha: 0, ua: 0, animais: 0, pesoMedio: 0, hectares: 0, status: 'vazio', lotesNoPasto: [] };

        var animaisNoPasto = 0;
        var pesoTotal = 0;
        var lotesNoPasto = [];

        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                if ((l.pasto || l.pastoAtual) === pasto.nome) {
                    animaisNoPasto += (l.qtdAnimais || 0);
                    pesoTotal += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
                    lotesNoPasto.push(l);
                }
            });
        }

        var pesoMedio = animaisNoPasto > 0 ? pesoTotal / animaisNoPasto : 0;
        var ua = pesoTotal / 450; // Unidades Animais
        var uaha = ha > 0 ? ua / ha : 0;

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
            hectares: ha,
            status: status,
            lotesNoPasto: lotesNoPasto
        };
    },

    // Indicador colorido de lotação
    getLotacaoBadge: function (status, uaha) {
        var badges = {
            'superlotado': '<span class="badge" style="background:#e74c3c;color:#fff">🔴 Superlotado ' + uaha.toFixed(2) + ' UA/ha</span>',
            'alto': '<span class="badge" style="background:#f39c12;color:#fff">🟡 Lotação Alta ' + uaha.toFixed(2) + ' UA/ha</span>',
            'ideal': '<span class="badge" style="background:#27ae60;color:#fff">🟢 Ideal ' + uaha.toFixed(2) + ' UA/ha</span>',
            'subutilizado': '<span class="badge" style="background:#3498db;color:#fff">🔵 Subutilizado ' + uaha.toFixed(2) + ' UA/ha</span>',
            'vazio': '<span class="badge" style="background:#95a5a6;color:#fff">⚪ Vazio</span>'
        };
        return badges[status] || badges['vazio'];
    },

    // Badge da avaliação
    getAvaliacaoBadge: function (pastoNome) {
        var aval = this.getUltimaAvaliacao(pastoNome);
        if (!aval) return '<span class="detail" style="color:#95a5a6">Sem avaliação</span>';

        var notas = {
            'otimo': '🟢 Ótima',
            'bom': '🟡 Boa',
            'regular': '🟠 Regular',
            'ruim': '🔴 Ruim',
            'degradado': '⚫ Degradada'
        };
        var label = notas[aval.nota] || aval.nota;
        var altura = aval.alturaCapim ? ' · ' + aval.alturaCapim + 'cm' : '';
        return '<span class="detail">' + label + altura + ' <small style="opacity:.6">(' + (aval.date || '').split('T')[0] + ')</small></span>';
    },

    // Dias de descanso de um pasto
    getDiasDescanso: function (pastoNome) {
        if (!window.data) return null;
        var trocas = window.data.events.filter(function (ev) {
            return (ev.type === 'TROCA_PASTO' || ev.type === 'MOVIMENTACAO_PASTO') && ev.pastoAnterior === pastoNome;
        });
        if (trocas.length === 0) return null;
        trocas.sort(function (a, b) { return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp); });
        var ultimaSaida = new Date(trocas[0].date || trocas[0].timestamp);
        var hoje = new Date();
        return Math.floor((hoje - ultimaSaida) / (1000 * 60 * 60 * 24));
    },

    // ====== INTEGRAÇÃO CLIMA (JETBOV FEATURE) ======
    getRecuperacaoAjustada: function (diasDescanso) {
        if (!window.clima) return { status: 'normal', diasRestantes: 0, fator: 1 };

        var chuva30d = window.clima.getAcumulado30Dias();
        var fator = 1.0;
        var msg = 'Normal';

        // Se choveu muito (>100mm), recupera 30% mais rápido
        if (chuva30d > 100) { fator = 1.3; msg = 'Acelerada (Chuva)'; }
        else if (chuva30d > 50) { fator = 1.15; msg = 'Boa'; }
        else if (chuva30d < 10) { fator = 0.8; msg = 'Lenta (Seca)'; }

        // Exemplo: Braquiária precisa de 28 dias. Com chuva, precisa de 28/1.3 = 21 dias.
        var diasPadrao = 28;
        var diasNecessarios = Math.round(diasPadrao / fator);
        var diasRestantes = Math.max(0, diasNecessarios - diasDescanso);

        return {
            status: msg,
            diasRestantes: diasRestantes,
            diasPadrao: diasPadrao,
            chuva: chuva30d
        };
    },

    getClimaBadge: function (diasDescanso) {
        var rec = this.getRecuperacaoAjustada(diasDescanso);
        if (rec.status === 'Normal') return '';

        var color = rec.fator > 1 ? '#27ae60' : '#e74c3c';
        var icon = rec.fator > 1 ? '🌧️' : '☀️';
        return '<span class="badge" style="background:' + color + '30; color:' + color + '; border:1px solid ' + color + '">'
            + icon + ' Recup. ' + rec.status + '</span>';
    },

    // ====== 14. ROTAÇÃO DE PIQUETES ======
    renderRotacao: function () {
        if (!window.data) return '';
        var trocas = window.data.events.filter(function (ev) {
            return ev.type === 'TROCA_PASTO' || ev.type === 'MOVIMENTACAO_PASTO';
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
