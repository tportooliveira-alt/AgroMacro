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
            window.app.showToast('Informe o nome do pasto.', 'error');
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
        window.app.showToast('✅ Pasto ' + nome + ' cadastrado!');
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

        var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">'
            + '<button class="btn-sm" onclick="var p=prompt(\'Quantos mm de chuva?\'); if(p) window.clima.registrarChuva(p); window.pastos.renderList();" style="background:#2563EB;color:white;">🌧️ Registrar Chuva</button>'
            + '</div>'
            + '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Piquetes</div><div class="kpi-value positive">' + pastos.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Área Total</div><div class="kpi-value">' + totalArea.toFixed(1) + ' ha</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Ocupação</div><div class="kpi-value" style="color:' + (ocupacaoPct > 90 ? '#e74c3c' : ocupacaoPct > 70 ? '#f39c12' : '#27ae60') + '">' + ocupacaoPct + '%</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">UA/ha Média</div><div class="kpi-value">' + uahaGlobal + '</div></div>'
            + '</div>';

        // ═══ Cards de Pasto ═══
        var statusConfig = {
            'disponivel': { label: 'DISPONÍVEL', icon: '🟢', gradient: 'linear-gradient(135deg, #059669, #10B981)', dot: '#10B981' },
            'ocupado': { label: 'OCUPADO', icon: '🔴', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)', dot: '#EF4444' },
            'descanso': { label: 'EM DESCANSO', icon: '🟡', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', dot: '#F59E0B' },
            'manutencao': { label: 'MANUTENÇÃO', icon: '🔧', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)', dot: '#3B82F6' }
        };

        html += pastos.slice().reverse().map(function (p) {
            // Calcular lotação
            var lotacao = window.pastoMgmt ? window.pastoMgmt.calcLotacao(p) : { uaha: 0, animais: 0, status: 'vazio', lotesNoPasto: [] };
            var lotacaoBadge = window.pastoMgmt ? window.pastoMgmt.getLotacaoBadge(lotacao.status, lotacao.uaha) : '';

            // Avaliação
            var avalBadge = window.pastoMgmt ? window.pastoMgmt.getAvaliacaoBadge(p.nome) : '';

            // Dias de descanso
            var dias = window.pastoMgmt ? window.pastoMgmt.getDiasDescanso(p.nome) : null;
            var climaBadge = (window.pastoMgmt && dias !== null) ? window.pastoMgmt.getClimaBadge(dias) : '';

            // Status config
            var st = statusConfig[p.statusPasto] || statusConfig['disponivel'];

            // Capacidade usage bar
            var capPct = p.capacidade > 0 ? Math.min(100, Math.round((lotacao.animais / p.capacidade) * 100)) : 0;
            var capColor = capPct > 90 ? '#DC2626' : capPct > 70 ? '#D97706' : '#059669';

            // Lotes neste pasto
            var lotesHtml = '';
            if (lotacao.lotesNoPasto && lotacao.lotesNoPasto.length > 0) {
                lotesHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #E2E8F0;">'
                    + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;margin-bottom:6px;">LOTES NESTE PASTO</div>';
                lotacao.lotesNoPasto.forEach(function (l) {
                    lotesHtml += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:4px 8px;background:#F8FAFC;border-radius:8px;margin-bottom:4px;">'
                        + '<span style="font-weight:600;color:#1E293B;">🐄 ' + (l.nome || 'Sem nome') + '</span>'
                        + '<span style="color:#64748B;">' + (l.qtdAnimais || 0) + ' cab · ' + (l.pesoMedio || 0) + 'kg</span>'
                        + '</div>';
                });
                lotesHtml += '</div>';
            } else {
                lotesHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #E2E8F0;">'
                    + '<div style="font-size:12px;color:#CBD5E1;font-style:italic;text-align:center;padding:8px 0;">Nenhum lote alocado</div></div>';
            }

            // Dias de descanso HTML
            var descansoHtml = '';
            if (dias !== null && lotacao.animais === 0) {
                descansoHtml = '<div style="margin-top:6px;font-size:12px;color:#2563EB;font-weight:600;display:flex;align-items:center;gap:6px;">'
                    + '<span>🔄 ' + dias + ' dias em descanso</span>'
                    + climaBadge
                    + '</div>';
            }

            // Card header style
            var headerStyle = 'background:' + st.gradient + ';color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;';

            return '<div style="overflow:hidden;border-radius:16px;margin-bottom:14px;border:1px solid #E2E8F0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">'
                // Header com gradiente por status
                + '<div style="' + headerStyle + '">'
                + '<div style="font-size:15px;font-weight:800;color:#fff;">🌾 ' + p.nome + '</div>'
                + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:3px 10px;border-radius:10px;background:rgba(255,255,255,0.25);color:#fff;">' + st.label + '</span>'
                + '</div>'
                // Body
                + '<div style="padding:14px 16px;">'
                // Stats grid
                + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">'
                + '<div style="text-align:center;padding:8px;background:#F8FAFC;border-radius:10px;">'
                + '<div style="font-size:10px;color:#94A3B8;font-weight:600;">ÁREA</div>'
                + '<div style="font-size:16px;font-weight:800;color:#1E293B;">' + (p.area ? p.area + '<span style="font-size:11px;font-weight:600;color:#94A3B8;"> ha</span>' : '--') + '</div>'
                + '</div>'
                + '<div style="text-align:center;padding:8px;background:#F8FAFC;border-radius:10px;">'
                + '<div style="font-size:10px;color:#94A3B8;font-weight:600;">CAPACIDADE</div>'
                + '<div style="font-size:16px;font-weight:800;color:#1E293B;">' + (p.capacidade || '--') + '<span style="font-size:11px;font-weight:600;color:#94A3B8;"> cab</span></div>'
                + '</div>'
                + '<div style="text-align:center;padding:8px;background:#F8FAFC;border-radius:10px;">'
                + '<div style="font-size:10px;color:#94A3B8;font-weight:600;">UA/ha</div>'
                + '<div style="font-size:16px;font-weight:800;color:#1E293B;">' + lotacao.uaha.toFixed(1) + '</div>'
                + '</div>'
                + '</div>'
                // Capacity bar
                + '<div style="margin-bottom:8px;">'
                + '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
                + '<span style="font-size:10px;color:#64748B;">Ocupação: ' + lotacao.animais + '/' + (p.capacidade || '?') + ' cab</span>'
                + '<span style="font-size:10px;font-weight:700;color:' + capColor + ';">' + capPct + '%</span>'
                + '</div>'
                + '<div style="height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;">'
                + '<div style="height:100%;width:' + capPct + '%;background:' + capColor + ';border-radius:3px;transition:width 0.8s ease;"></div>'
                + '</div>'
                + '</div>'
                // Tipo capim + Avaliação
                + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px;">'
                + (p.tipoPasto || p.tipoCapim ? '<span style="font-size:11px;padding:3px 8px;background:#ECFDF5;color:#059669;border-radius:8px;font-weight:600;">🌿 ' + (p.tipoPasto || p.tipoCapim) + '</span>' : '')
                + (avalBadge ? '<span style="font-size:11px;">' + avalBadge + '</span>' : '')
                + '</div>'
                // Descanso
                + descansoHtml
                // Lotes
                + lotesHtml
                // Botões
                + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #E2E8F0;display:flex;gap:6px;flex-wrap:wrap;">'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.pastoMgmt.abrirAvaliacao(\'' + p.nome + '\')">🌿 Avaliar</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.lotes.trocarPasto && window.lotes.trocarPasto(\'' + (p.nome) + '\')">🔄 Rotacionar</button>'
                + '<button class="btn-sm" style="background:#2563EB;" onclick="event.stopPropagation(); window.pastos.editPasto(\'' + p.nome + '\')">✏️ Editar</button>'
                + '<button class="btn-sm" style="background:#DC2626;" onclick="event.stopPropagation(); window.pastos.excluirPasto(\'' + p.nome + '\')">🗑️ Excluir</button>'
                + '</div>'
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
    },

    // ====== EDITAR PASTO ======
    editPasto: function (pastoNome) {
        var pastos = this.getPastos();
        var pasto = null;
        for (var i = pastos.length - 1; i >= 0; i--) {
            if (pastos[i].nome === pastoNome) { pasto = pastos[i]; break; }
        }
        if (!pasto) return;

        window.app.navigate('pastos');

        setTimeout(function () {
            var el = function (id) { return document.getElementById(id); };
            if (el('pasto-nome')) el('pasto-nome').value = pasto.nome || '';
            if (el('pasto-area')) el('pasto-area').value = pasto.area || '';
            if (el('pasto-capacidade')) el('pasto-capacidade').value = pasto.capacidade || '';
            if (el('pasto-tipo')) el('pasto-tipo').value = pasto.tipoPasto || '';
            if (el('pasto-status')) el('pasto-status').value = pasto.statusPasto || '';
            if (el('pasto-obs')) el('pasto-obs').value = pasto.obs || '';

            var form = document.getElementById('form-pasto');
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });

            window.app.showToast('📝 Editando pasto: ' + pastoNome + '. Altere e clique em Cadastrar.');
        }, 200);
    },

    // ====== EXCLUIR PASTO ======
    excluirPasto: function (pastoNome) {
        if (!confirm('Excluir o pasto "' + pastoNome + '"?\n\nDados serão removidos.')) return;

        // Remove all PASTO events with this name
        window.data.events = window.data.events.filter(function (ev) {
            return !(ev.type === 'PASTO' && ev.nome === pastoNome);
        });
        window.data.save();

        window.app.showToast('🗑️ Pasto "' + pastoNome + '" excluído.');
        this.renderList();
    }
};
