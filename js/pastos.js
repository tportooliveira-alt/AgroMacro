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

        // ═══ KPIs Globais ═══
        var totalArea = 0;
        var totalCap = 0;
        var totalAnimaisAlocados = 0;
        var totalUA = 0;

        pastos.forEach(function (p) {
            totalArea += (p.area || 0);
            totalCap += (p.capacidade || 0);
            if (window.pastoMgmt) {
                var lot = window.pastoMgmt.calcLotacao(p);
                totalAnimaisAlocados += lot.animais;
                totalUA += lot.ua;
            }
        });

        var ocupacaoPct = totalCap > 0 ? Math.round((totalAnimaisAlocados / totalCap) * 100) : 0;
        var uahaGlobal = totalArea > 0 ? (totalUA / totalArea).toFixed(2) : '0';

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Piquetes</div><div class="kpi-value positive">' + pastos.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Área Total</div><div class="kpi-value">' + totalArea.toFixed(1) + ' ha</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Ocupação</div><div class="kpi-value" style="color:' + (ocupacaoPct > 90 ? '#e74c3c' : ocupacaoPct > 70 ? '#f39c12' : '#27ae60') + '">' + ocupacaoPct + '%</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">UA/ha Média</div><div class="kpi-value">' + uahaGlobal + '</div></div>'
            + '</div>';

        // ═══ Cards de Pasto ═══
        var statusLabels = {
            'disponivel': '🟢 Disponível',
            'ocupado': '🔴 Ocupado',
            'descanso': '🟡 Em Descanso',
            'manutencao': '🔧 Manutenção'
        };

        html += pastos.slice().reverse().map(function (p) {
            // Calcular lotação
            var lotacao = window.pastoMgmt ? window.pastoMgmt.calcLotacao(p) : { uaha: 0, animais: 0, status: 'vazio', lotesNoPasto: [] };
            var lotacaoBadge = window.pastoMgmt ? window.pastoMgmt.getLotacaoBadge(lotacao.status, lotacao.uaha) : '';

            // Avaliação
            var avalBadge = window.pastoMgmt ? window.pastoMgmt.getAvaliacaoBadge(p.nome) : '';

            // Lotes neste pasto
            var lotesHtml = '';
            if (lotacao.lotesNoPasto && lotacao.lotesNoPasto.length > 0) {
                lotesHtml = '<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,.08)">'
                    + '<div style="font-size:11px; color:rgba(255,255,255,.5); margin-bottom:4px">LOTES NESTE PASTO</div>';
                lotacao.lotesNoPasto.forEach(function (l) {
                    lotesHtml += '<div style="display:flex; justify-content:space-between; font-size:13px; padding:2px 0">'
                        + '<span>🐄 ' + (l.nome || 'Sem nome') + '</span>'
                        + '<span style="color:rgba(255,255,255,.7)">' + (l.qtdAnimais || 0) + ' cab · ' + (l.pesoMedio || 0) + 'kg</span>'
                        + '</div>';
                });
                lotesHtml += '</div>';
            } else {
                lotesHtml = '<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,.08)">'
                    + '<div style="font-size:12px; color:rgba(255,255,255,.35); font-style:italic">Nenhum lote alocado</div></div>';
            }

            // Dias de descanso
            var descansoHtml = '';
            if (window.pastoMgmt) {
                var dias = window.pastoMgmt.getDiasDescanso(p.nome);
                if (dias !== null && lotacao.animais === 0) {
                    descansoHtml = '<div style="margin-top:6px; font-size:12px; color:#3498db">🔄 ' + dias + ' dias em descanso</div>';
                }
            }

            return '<div class="history-card" style="margin-bottom:12px">'
                + '<div class="history-card-header">'
                + '  <span class="badge badge-green">🌾 ' + p.nome + '</span>'
                + '  <span class="date">' + (statusLabels[p.statusPasto] || p.statusPasto || '') + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                // Linha 1: Área + Capacidade + Tipo
                + '  <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:6px">'
                + '    <span><strong>' + (p.area ? p.area + ' ha' : '--') + '</strong></span>'
                + '    <span class="detail">Cap: ' + (p.capacidade || '--') + ' cab</span>'
                + '    <span class="detail">' + (p.tipoPasto || p.tipoCapim || '') + '</span>'
                + '  </div>'
                // Linha 2: Lotação UA/ha
                + '  <div style="margin-bottom:6px">' + lotacaoBadge + '</div>'
                // Linha 3: Animais + UA
                + '  <div style="display:flex; gap:16px; font-size:13px; margin-bottom:4px">'
                + '    <span>🐄 <strong>' + lotacao.animais + '</strong> cab alocados</span>'
                + '    <span>📊 <strong>' + lotacao.ua.toFixed(1) + '</strong> UA</span>'
                + '  </div>'
                // Linha 4: Avaliação
                + '  <div style="margin-bottom:4px">🌿 ' + avalBadge + '</div>'
                // Descanso
                + descansoHtml
                // Lotes neste pasto
                + lotesHtml
                + '</div>'
                // Botões
                + '<div style="margin-top:10px; padding:8px 12px; display:flex; gap:6px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,.08)">'
                + '  <button class="btn-sm" onclick="event.stopPropagation(); window.pastoMgmt.abrirAvaliacao(\'' + p.nome + '\')">🌿 Avaliar</button>'
                + '  <button class="btn-sm" onclick="event.stopPropagation(); window.lotes.trocarPasto && window.lotes.trocarPasto(\'' + (p.nome) + '\')">🔄 Rotacionar</button>'
                + '</div>'
                + '</div>';
        }).join('');

        // ═══ Histórico de Rotação ═══
        if (window.pastoMgmt) {
            var rotacaoHtml = window.pastoMgmt.renderRotacao();
            if (rotacaoHtml) {
                html += rotacaoHtml;
            }
        }

        container.innerHTML = html;
    },

    getPastos: function () {
        return window.data.events.filter(function (ev) {
            return ev.type === 'PASTO';
        });
    }
};
