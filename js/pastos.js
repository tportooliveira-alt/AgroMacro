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

    startOperacaoPasto: function (pastoNome, acao) {
        try {
            localStorage.setItem('agromacro_operacao_pasto', pastoNome || '');
            localStorage.setItem('agromacro_operacao_acao', acao || '');
        } catch (e) { }

        if (acao === 'troca') {
            if (window.lotes && window.lotes.trocarPasto) {
                window.lotes.trocarPasto(pastoNome);
                return;
            }
            window.app.showToast('Abra o modulo de lotes para trocar pasto.', 'warning');
            return;
        }

        window.app.navigate('manejo');
        setTimeout(function () {
            var pastoSel = document.getElementById('manejo-pasto');
            if (pastoSel && pastoNome) pastoSel.value = pastoNome;

            var tipoSel = document.getElementById('manejo-tipo');
            if (tipoSel) {
                tipoSel.value = acao === 'insumo' ? 'nutricao' : 'vacina';
                if (window.manejo && window.manejo.onTipoChange) window.manejo.onTipoChange();
            }
        }, 120);
    },

    // ═══ NOVO: Card 3-em-1 Inline — Operação Rápida do Pasto ═══
    renderCard3em1: function (pastoNome) {
        var tabAtiva = localStorage.getItem('card3em1_tab') || 'manejo';
        var html = '<div id="card-operacao-' + pastoNome + '" style="margin-top:10px;padding:12px;border:2px solid #2E7D32;border-radius:12px;background:linear-gradient(135deg,#F8FBF7,#FFFFFF);box-shadow:0 4px 12px rgba(46,125,50,0.15);">'
            + '<div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1B5E20;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><span>⚡</span> OPERAÇÃO RÁPIDA — SEM SAIR DAQUI</div>'
            + '<div style="display:flex;gap:6px;margin-bottom:10px;border-bottom:2px solid #E8F5E9;padding-bottom:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;">'
            + '<button class="tab-btn-op" data-tab="manejo" style="padding:6px 14px;border:none;border-radius:8px;background:' + (tabAtiva === 'manejo' ? '#2E7D32' : '#E8F5E9') + ';color:' + (tabAtiva === 'manejo' ? '#fff' : '#1B5E20') + ';font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;" onclick="window.pastos.switchTab3em1(\'' + pastoNome + '\',\'manejo\')">💉 Manejo</button>'
            + '<button class="tab-btn-op" data-tab="insumo" style="padding:6px 14px;border:none;border-radius:8px;background:' + (tabAtiva === 'insumo' ? '#2E7D32' : '#E8F5E9') + ';color:' + (tabAtiva === 'insumo' ? '#fff' : '#1B5E20') + ';font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;" onclick="window.pastos.switchTab3em1(\'' + pastoNome + '\',\'insumo\')">📦 Insumo</button>'
            + '<button class="tab-btn-op" data-tab="troca" style="padding:6px 14px;border:none;border-radius:8px;background:' + (tabAtiva === 'troca' ? '#2E7D32' : '#E8F5E9') + ';color:' + (tabAtiva === 'troca' ? '#fff' : '#1B5E20') + ';font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;" onclick="window.pastos.switchTab3em1(\'' + pastoNome + '\',\'troca\')">🔄 Troca</button>'
            + '<button class="tab-btn-op" data-tab="obra" style="padding:6px 14px;border:none;border-radius:8px;background:' + (tabAtiva === 'obra' ? '#2E7D32' : '#E8F5E9') + ';color:' + (tabAtiva === 'obra' ? '#fff' : '#1B5E20') + ';font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;" onclick="window.pastos.switchTab3em1(\'' + pastoNome + '\',\'obra\')">🔨 Obra</button>'
            + '</div>'
            + '<div id="tab-content-3em1">'
            + this.renderTabContent3em1(pastoNome, tabAtiva)
            + '</div>'
            + '</div>';
        return html;
    },

    switchTab3em1: function (pastoNome, tab) {
        try { localStorage.setItem('card3em1_tab', tab); } catch (e) { }
        var container = document.getElementById('card-operacao-' + pastoNome);
        if (container) {
            container.querySelector('#tab-content-3em1').innerHTML = this.renderTabContent3em1(pastoNome, tab);
        }
    },

    renderTabContent3em1: function (pastoNome, tab) {
        var html = '';
        
        if (tab === 'manejo') {
            html += '<div style="padding:10px 0;">'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Tipo de Manejo</label>'
                + '<select id="op-manejo-tipo" style="width:100%;padding:8px 8px;border:1px solid #2E7D32;border-radius:6px;font-size:13px;margin-bottom:8px;" onchange="window.pastos.updateManejoFields()">'
                + '<option value="vacinacao">💉 Vacinação / Tratamento</option>'
                + '<option value="nutricao">🌾 Alimentação / Suplementação</option>'
                + '<option value="pesagem">⚖️ Pesagem</option>'
                + '</select>'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Produto / Descrição</label>'
                + '<input id="op-manejo-descricao" type="text" placeholder="Ex: Vacina da febre" style="width:100%;padding:8px;border:1px solid #2E7D32;border-radius:6px;font-size:12px;margin-bottom:8px;" />'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;" id="op-manejo-lote-label">Lote</label>'
                + '<input id="op-manejo-lote" type="text" placeholder="Opcional" style="width:100%;padding:8px;border:1px solid #2E7D32;border-radius:6px;font-size:12px;margin-bottom:8px;" />'
                + '<button style="width:100%;padding:10px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;" onclick="window.pastos.salvarManejoRapido(\'' + pastoNome + '\')">✅ Registrar Manejo</button>'
                + '</div>';
        } else if (tab === 'insumo') {
            html += '<div style="padding:10px 0;">'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Insumo do Estoque</label>'
                + '<select id="op-insumo-produto" style="width:100%;padding:8px 8px;border:1px solid #2E7D32;border-radius:6px;font-size:13px;margin-bottom:8px;">'
                + '<option value="">-- Selecione um insumo --</option>'
                + (window.estoque ? window.estoque.getStockItems().map(function(i) { return '<option value="' + (i.nome || i.descricao || '') + '">' + (i.nome || i.descricao || '') + ' (' + (i.saldo || 0) + ' ' + (i.unidade || 'un') + ')</option>'; }).join('') : '')
                + '</select>'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Quantidade</label>'
                + '<input id="op-insumo-qtd" type="number" placeholder="0" style="width:100%;padding:8px;border:1px solid #2E7D32;border-radius:6px;font-size:12px;margin-bottom:8px;" />'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Obs / Aplicação</label>'
                + '<input id="op-insumo-obs" type="text" placeholder="Ex: Aplicado ao amanhecer" style="width:100%;padding:8px;border:1px solid #2E7D32;border-radius:6px;font-size:12px;margin-bottom:8px;" />'
                + '<button style="width:100%;padding:10px;background:#1B5E20;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;" onclick="window.pastos.salvarInsumoRapido(\'' + pastoNome + '\')">✅ Usar Insumo</button>'
                + '</div>';
        } else if (tab === 'troca') {
            html += '<div style="padding:10px 0;">'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Pasto Destino</label>'
                + '<select id="op-pasto-destino" style="width:100%;padding:8px 8px;border:1px solid #2E7D32;border-radius:6px;font-size:13px;margin-bottom:8px;">'
                + '<option value="">-- Selecione destino --</option>'
                + (window.pastos ? window.pastos.getPastos().filter(function(p) { return p.nome !== pastoNome; }).map(function(p) { return '<option value="' + p.nome + '">' + p.nome + '</option>'; }).join('') : '')
                + '</select>'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Lotes a Mover</label>'
                + '<div id="op-lotes-movimentacao" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;max-height:120px;overflow-y:auto;">'
                + '</div>'
                + '<button style="width:100%;padding:10px;background:#0F766E;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;" onclick="window.pastos.salvarTrocaPastorRapido(\'' + pastoNome + '\')">✅ Trocar de Pasto</button>'
                + '</div>';
        } else if (tab === 'obra') {
            html += '<div style="padding:10px 0;">'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Problema / Tarefa</label>'
                + '<select id="op-obra-tipo" style="width:100%;padding:8px 8px;border:1px solid #2E7D32;border-radius:6px;font-size:13px;margin-bottom:8px;">'
                + '<option value="conserto">🔧 Conserto de cerca/cocho</option>'
                + '<option value="limpeza">🧹 Limpeza de área</option>'
                + '<option value="abastecimento">💧 Abastecimento de água</option>'
                + '<option value="outro">📝 Outro</option>'
                + '</select>'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Descrição Rápida</label>'
                + '<input id="op-obra-descricao" type="text" placeholder="O que precisa ser feito?" style="width:100%;padding:8px;border:1px solid #2E7D32;border-radius:6px;font-size:12px;margin-bottom:8px;" />'
                + '<label style="display:block;font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:4px;">Prioridade</label>'
                + '<select id="op-obra-prioridade" style="width:100%;padding:8px 8px;border:1px solid #2E7D32;border-radius:6px;font-size:13px;margin-bottom:8px;">'
                + '<option value="media">Média</option>'
                + '<option value="alta">🔴 Alta</option>'
                + '<option value="baixa">Baixa</option>'
                + '</select>'
                + '<button style="width:100%;padding:10px;background:#FF6B35;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;" onclick="window.pastos.salvarObraRapida(\'' + pastoNome + '\')">✅ Registrar Obra</button>'
                + '</div>';
        }
        
        return html;
    },

    salvarManejoRapido: function (pastoNome) {
        var tipo = document.getElementById('op-manejo-tipo').value;
        var descricao = document.getElementById('op-manejo-descricao').value;
        var lote = document.getElementById('op-manejo-lote').value;
        
        if (!descricao) {
            window.app.showToast('Informe a descrição do manejo.', 'error');
            return;
        }
        
        var manejo = {
            type: 'MANEJO',
            tipoManejo: tipo,
            descricao: descricao,
            lote: lote || '--',
            pastoOrigem: pastoNome,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        window.data.saveEvent(manejo);
        window.app.showToast('✅ Manejo registrado para ' + pastoNome, 'success');
        document.getElementById('op-manejo-descricao').value = '';
        document.getElementById('op-manejo-lote').value = '';
        this.renderList();
    },

    salvarInsumoRapido: function (pastoNome) {
        var produto = document.getElementById('op-insumo-produto').value;
        var qtd = parseFloat(document.getElementById('op-insumo-qtd').value) || 0;
        var obs = document.getElementById('op-insumo-obs').value;
        
        if (!produto || qtd <= 0) {
            window.app.showToast('Selecione produto e informe quantidade.', 'error');
            return;
        }
        
        // Baixar do estoque
        if (window.estoque && window.estoque.baixarEstoque) {
            window.estoque.baixarEstoque(produto, qtd);
        }
        
        var insumo = {
            type: 'ESTOQUE_SAIDA',
            produto: produto,
            quantidade: qtd,
            pastoDestino: pastoNome,
            obs: obs,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        window.data.saveEvent(insumo);
        window.app.showToast('✅ ' + qtd + ' un de ' + produto + ' registrado em ' + pastoNome, 'success');
        document.getElementById('op-insumo-qtd').value = '';
        document.getElementById('op-insumo-obs').value = '';
        this.renderList();
    },

    salvarTrocaPastorRapido: function (pastoNome) {
        var destino = document.getElementById('op-pasto-destino').value;
        
        if (!destino) {
            window.app.showToast('Selecione o pasto destino.', 'error');
            return;
        }
        
        var troca = {
            type: 'TROCA_PASTO',
            pastoOrigem: pastoNome,
            pastoDestino: destino,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        window.data.saveEvent(troca);
        window.app.showToast('✅ Troca de pasto registrada: ' + pastoNome + ' → ' + destino, 'success');
        document.getElementById('op-pasto-destino').value = '';
        this.renderList();
    },

    salvarObraRapida: function (pastoNome) {
        var tipo = document.getElementById('op-obra-tipo').value;
        var descricao = document.getElementById('op-obra-descricao').value;
        var prioridade = document.getElementById('op-obra-prioridade').value;
        
        if (!descricao) {
            window.app.showToast('Descreva a tarefa.', 'error');
            return;
        }
        
        var obra = {
            type: 'OBRA_REGISTRO',
            tipoObra: tipo,
            descricao: descricao,
            local: pastoNome,
            prioridade: prioridade,
            status: 'ativa',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        window.data.saveEvent(obra);
        window.app.showToast('✅ Obra leve registrada: ' + descricao, 'success');
        document.getElementById('op-obra-descricao').value = '';
        this.renderList();
    },

    updateManejoFields: function () {
        var tipo = document.getElementById('op-manejo-tipo').value;
        var loteLabel = document.getElementById('op-manejo-lote-label');
        if (loteLabel) {
            loteLabel.textContent = tipo === 'pesagem' ? 'Lote' : 'Lote (opcional)';
        }
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
                // Card simplificado para operacao do peao
                + (window.app && window.app.getPerfil && window.app.getPerfil() === 'peao'
                    ? window.pastos.renderCard3em1(p.nome)
                    : '')
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
