// ====== MÓDULO: CALENDÁRIO SANITÁRIO + REPRODUTIVO ======
// Features 16-18: Calendário Sanitário, Protocolo Reprodutivo, Ficha Sanitária
window.calendario = {

    init: function () {
        console.log('Calendário Module Ready');
    },

    // ====== 16. CALENDÁRIO SANITÁRIO ======
    // Define protocolos de vacinas com intervalos
    protocolos: [
        { vacina: 'Aftosa', intervalo: 180, lembrete: 15 },
        { vacina: 'Brucelose', intervalo: 365, lembrete: 30 },
        { vacina: 'Raiva', intervalo: 365, lembrete: 30 },
        { vacina: 'Clostridiose', intervalo: 180, lembrete: 15 },
        { vacina: 'Vermifugação', intervalo: 90, lembrete: 7 },
        { vacina: 'Carrapato', intervalo: 60, lembrete: 7 }
    ],

    getProximasVacinas: function () {
        if (!window.data) return [];
        var self = this;
        var lotes = window.lotes ? window.lotes.getLotes() : [];
        var alertas = [];

        lotes.forEach(function (lote) {
            self.protocolos.forEach(function (proto) {
                // Find last application
                var ultimaAplicacao = null;
                window.data.events.forEach(function (ev) {
                    if (ev.type === 'MANEJO' && ev.lote === lote.nome) {
                        var desc = (ev.desc || '' + ev.tipoManejo || '').toLowerCase();
                        if (desc.indexOf(proto.vacina.toLowerCase()) >= 0) {
                            var d = new Date(ev.date || ev.timestamp);
                            if (!ultimaAplicacao || d > ultimaAplicacao) ultimaAplicacao = d;
                        }
                    }
                });

                var proximaData = null;
                var diasRestantes = 999;
                var status = 'pendente';

                if (ultimaAplicacao) {
                    proximaData = new Date(ultimaAplicacao);
                    proximaData.setDate(proximaData.getDate() + proto.intervalo);
                    diasRestantes = Math.ceil((proximaData - new Date()) / 86400000);

                    if (diasRestantes <= 0) status = 'vencida';
                    else if (diasRestantes <= proto.lembrete) status = 'alerta';
                    else status = 'ok';
                }

                alertas.push({
                    lote: lote.nome,
                    vacina: proto.vacina,
                    ultimaAplicacao: ultimaAplicacao ? ultimaAplicacao.toLocaleDateString('pt-BR') : 'Nunca',
                    proximaData: proximaData ? proximaData.toLocaleDateString('pt-BR') : 'Aplicar',
                    diasRestantes: diasRestantes,
                    status: status,
                    qtdAnimais: lote.qtdAnimais
                });
            });
        });

        // Sort by urgency
        alertas.sort(function (a, b) { return a.diasRestantes - b.diasRestantes; });
        return alertas;
    },

    renderCalendarioSanitario: function () {
        var container = document.getElementById('calendario-content');
        if (!container) return;

        var alertas = this.getProximasVacinas();

        if (alertas.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum lote ativo.</div>';
            return;
        }

        var statusColors = {
            'vencida': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', badge: '🚨 VENCIDA' },
            'alerta': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', badge: '⚠️ ALERTA' },
            'ok': { bg: '#dcfce7', border: '#22c55e', text: '#166534', badge: '✅ OK' },
            'pendente': { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', badge: '📋 PENDENTE' }
        };

        var html = '<div class="kpi-section"><div class="kpi-title">🗓️ Calendário Sanitário</div>';

        // Urgentes primeiro
        var urgentes = alertas.filter(function (a) { return a.status === 'vencida' || a.status === 'alerta'; });
        var normais = alertas.filter(function (a) { return a.status !== 'vencida' && a.status !== 'alerta'; });

        if (urgentes.length > 0) {
            html += '<div class="kpi-grid" style="margin-bottom:12px;"><div class="kpi-card" style="background:#fee2e2;"><div class="kpi-label">Pendências</div><div class="kpi-value negative">' + urgentes.length + '</div></div></div>';
        }

        var allItems = urgentes.concat(normais);
        allItems.forEach(function (a) {
            var colors = statusColors[a.status] || statusColors.pendente;
            html += '<div style="background:' + colors.bg + ';border:1px solid ' + colors.border + ';border-radius:8px;padding:10px;margin-bottom:8px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<div><strong style="color:' + colors.text + ';">' + a.vacina + '</strong>'
                + '<div style="font-size:12px;color:' + colors.text + ';">' + a.lote + ' (' + a.qtdAnimais + ' cab)</div></div>'
                + '<div style="text-align:right;">'
                + '<div style="font-size:11px;font-weight:700;">' + colors.badge + '</div>'
                + '<div style="font-size:11px;color:' + colors.text + ';">Próx: ' + a.proximaData + '</div>'
                + '</div></div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // ====== 17. PROTOCOLO REPRODUTIVO ======
    registrarProtocolo: function (loteNome, tipo) {
        // IATF, monta natural, prenhez, parto
        var html = '<div class="modal-overlay" id="modal-repro">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🐄 Protocolo Reprodutivo</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-repro\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Lote: <strong>' + loteNome + '</strong></label></div>'
            + '<div class="form-group"><label>Tipo de Protocolo</label>'
            + '<select id="repro-tipo">'
            + '<option value="iatf">IATF (Inseminação)</option>'
            + '<option value="monta">Monta Natural</option>'
            + '<option value="prenhez">Diagnóstico de Prenhez</option>'
            + '<option value="parto">Previsão de Parto</option></select></div>'
            + '<div class="form-group"><label>Data</label>'
            + '<input type="date" id="repro-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Qtd de Matrizes</label>'
            + '<input type="number" id="repro-qty" min="1" placeholder="20"></div>'
            + '<div class="form-group"><label>Taxa de Prenhez (%)</label>'
            + '<input type="number" id="repro-taxa" min="0" max="100" step="1" placeholder="85"></div>'
            + '<div class="form-group"><label>Observação</label>'
            + '<input type="text" id="repro-obs" placeholder="Touro, sêmen, etc."></div>'
            + '<button class="submit-btn" onclick="window.calendario.confirmarProtocolo(\'' + loteNome + '\')">✅ Registrar</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarProtocolo: function (loteNome) {
        var tipo = document.getElementById('repro-tipo').value;
        var data = document.getElementById('repro-data').value;
        var qty = parseInt(document.getElementById('repro-qty').value) || 0;
        var taxa = parseFloat(document.getElementById('repro-taxa').value) || 0;
        var obs = document.getElementById('repro-obs').value;

        window.data.saveEvent({
            type: 'REPRODUCAO', lote: loteNome, tipoProtocolo: tipo,
            date: data, qtdMatrizes: qty, taxaPrenhez: taxa, obs: obs
        });

        this.fecharModal('modal-repro');
        var labels = { iatf: 'IATF', monta: 'Monta Natural', prenhez: 'Diagnóstico', parto: 'Previsão Parto' };
        window.app.showToast('✅ ' + (labels[tipo] || tipo) + ' registrado — ' + qty + ' matrizes');
    },

    // ====== 18. FICHA SANITÁRIA POR LOTE ======
    renderFichaSanitaria: function (loteNome) {
        if (!window.data) return;

        var manejos = window.data.events.filter(function (ev) {
            return (ev.type === 'MANEJO' || ev.type === 'REPRODUCAO') && ev.lote === loteNome;
        });

        manejos.sort(function (a, b) {
            return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
        });

        var html = '<div class="modal-overlay" id="modal-ficha">'
            + '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">'
            + '<div class="modal-header"><h3>📋 Ficha Sanitária: ' + loteNome + '</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-ficha\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">';

        if (manejos.length === 0) {
            html += '<div class="empty-state">Nenhum manejo registrado.</div>';
        } else {
            html += '<table style="width:100%;font-size:13px;border-collapse:collapse;">'
                + '<thead><tr style="border-bottom:2px solid var(--border-subtle);">'
                + '<th style="text-align:left;padding:6px;">Data</th>'
                + '<th style="text-align:left;padding:6px;">Tipo</th>'
                + '<th style="text-align:left;padding:6px;">Descrição</th>'
                + '<th style="text-align:right;padding:6px;">Custo</th></tr></thead><tbody>';

            manejos.forEach(function (m) {
                var tipoLabel = m.tipoManejo || m.tipoProtocolo || m.type;
                html += '<tr style="border-bottom:1px solid var(--border-subtle);">'
                    + '<td style="padding:6px;">' + (m.date || '').split('T')[0] + '</td>'
                    + '<td style="padding:6px;">' + tipoLabel + '</td>'
                    + '<td style="padding:6px;">' + (m.desc || m.obs || '--') + '</td>'
                    + '<td style="padding:6px;text-align:right;">' + (m.cost ? 'R$ ' + m.cost.toFixed(2) : '--') + '</td></tr>';
            });

            html += '</tbody></table>';
        }

        html += '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    },

    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
