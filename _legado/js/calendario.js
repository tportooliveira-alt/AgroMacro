// ====== MÓDULO: CALENDÁRIO SANITÁRIO + REPRODUTIVO (PLANO 5) ======
// Motor IATF, Ficha Sanitária Detalhada, Carência, Timeline
window.calendario = {

    init: function () {
        console.log('Calendário Module v3 (IATF + Sanidade Avançada) Ready');
    },

    // ====== TEMPLATES IATF ======
    IATF_TEMPLATES: {
        'IATF_3_MANEJOS': {
            nome: 'IATF Padrão (3 Manejos)',
            etapas: [
                { dia: 0, label: 'D0 — Implante + BE', desc: 'Inserir Implante P4 + Benzoato de Estradiol 2ml', tipo: 'IMPLANTE' },
                { dia: 8, label: 'D8 — Retirada + PGF + CE', desc: 'Retirar Implante + Prostaglandina 2ml + Cipionato 0.6ml + eCG (opcional)', tipo: 'RETIRADA' },
                { dia: 10, label: 'D10 — Inseminação (IA)', desc: 'Inseminação Artificial', tipo: 'INSEMINACAO' },
                { dia: 40, label: 'D40 — Diagnóstico Prenhez', desc: 'Ultrassom / Toque retal', tipo: 'DIAGNOSTICO' }
            ]
        },
        'IATF_4_MANEJOS': {
            nome: 'IATF Longo (4 Manejos + Repasse)',
            etapas: [
                { dia: 0, label: 'D0 — Implante + BE', desc: 'Inserir Implante P4 + Benzoato de Estradiol 2ml', tipo: 'IMPLANTE' },
                { dia: 7, label: 'D7 — PGF', desc: 'Aplicar Prostaglandina (PGF2a) 2ml', tipo: 'HORMONIO' },
                { dia: 9, label: 'D9 — Retirada + CE + eCG', desc: 'Retirar Implante + Cipionato 0.6ml + eCG 1.5ml', tipo: 'RETIRADA' },
                { dia: 11, label: 'D11 — Inseminação (IA)', desc: 'Inseminação Artificial', tipo: 'INSEMINACAO' },
                { dia: 41, label: 'D41 — Diagnóstico', desc: 'Ultrassom / Toque retal', tipo: 'DIAGNOSTICO' }
            ]
        }
    },

    // ====== PROTOCOLOS SANITÁRIOS ======
    protocolos: [
        { vacina: 'Aftosa', intervalo: 180, lembrete: 15 },
        { vacina: 'Brucelose', intervalo: 365, lembrete: 30 },
        { vacina: 'Raiva', intervalo: 365, lembrete: 30 },
        { vacina: 'Clostridiose', intervalo: 180, lembrete: 15 },
        { vacina: 'Vermifugação', intervalo: 90, lembrete: 7 },
        { vacina: 'Carrapato', intervalo: 60, lembrete: 7 },
        { vacina: 'IBR/BVD (Reprodutiva)', intervalo: 180, lembrete: 30 },
        { vacina: 'Leptospirose', intervalo: 180, lembrete: 30 }
    ],

    // ====== INICIAR PROTOCOLO IATF ======
    iniciarProtocolo: function (loteNome, templateKey, dataInicio, touro, inseminador) {
        var tmpl = this.IATF_TEMPLATES[templateKey];
        if (!tmpl || !window.data) return;

        var protoId = 'iatf_' + Date.now();
        var d0 = new Date(dataInicio);

        // Salvar protocolo pai
        window.data.saveEvent({
            type: 'PROTOCOLO_IATF',
            id: protoId,
            lote: loteNome,
            template: templateKey,
            templateNome: tmpl.nome,
            dataInicio: dataInicio,
            touro: touro || '',
            inseminador: inseminador || '',
            status: 'EM_ANDAMENTO',
            date: dataInicio,
            timestamp: new Date().toISOString()
        });

        // Gerar etapas como tarefas futuras
        var self = this;
        tmpl.etapas.forEach(function (etapa) {
            var dataEtapa = new Date(d0);
            dataEtapa.setDate(dataEtapa.getDate() + etapa.dia);

            window.data.saveEvent({
                type: 'TAREFA_IATF',
                protocoloId: protoId,
                lote: loteNome,
                diaProtocolo: etapa.dia,
                label: etapa.label,
                desc: etapa.desc,
                tipoEtapa: etapa.tipo,
                date: dataEtapa.toISOString().split('T')[0],
                status: etapa.dia === 0 ? 'CONCLUIDO' : 'PENDENTE',
                timestamp: new Date().toISOString()
            });
        });

        return protoId;
    },

    // ====== TAREFAS DO DIA (IATF) ======
    getTarefasDoDia: function () {
        if (!window.data) return [];
        var hoje = new Date().toISOString().split('T')[0];
        return window.data.events.filter(function (ev) {
            return ev.type === 'TAREFA_IATF' && ev.date === hoje && ev.status === 'PENDENTE';
        });
    },

    getTarefasPendentes: function () {
        if (!window.data) return [];
        var hoje = new Date();
        return window.data.events.filter(function (ev) {
            return ev.type === 'TAREFA_IATF' && ev.status === 'PENDENTE';
        }).sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });
    },

    concluirTarefa: function (protocoloId, diaProtocolo) {
        if (!window.data) return;
        window.data.events.forEach(function (ev) {
            if (ev.type === 'TAREFA_IATF' && ev.protocoloId === protocoloId && ev.diaProtocolo === diaProtocolo) {
                ev.status = 'CONCLUIDO';
                ev.dataConclusao = new Date().toISOString();
            }
        });
        window.data.save();
        this.renderCalendarioSanitario();
        window.app.showToast('✅ Etapa concluída!');
    },

    // ====== PROTOCOLOS ATIVOS ======
    getProtocolosIATF: function () {
        if (!window.data) return [];
        return window.data.events.filter(function (ev) {
            return ev.type === 'PROTOCOLO_IATF';
        }).sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
    },

    getEtapasProtocolo: function (protoId) {
        if (!window.data) return [];
        return window.data.events.filter(function (ev) {
            return ev.type === 'TAREFA_IATF' && ev.protocoloId === protoId;
        }).sort(function (a, b) { return a.diaProtocolo - b.diaProtocolo; });
    },

    // ====== CARÊNCIA SANITÁRIA ======
    getCarenciaAtiva: function (loteNome) {
        if (!window.data) return null;
        var hoje = new Date();
        var carencias = [];
        window.data.events.forEach(function (ev) {
            if (ev.type === 'MANEJO_SANITARIO' && ev.lote === loteNome && ev.carenciaDias > 0) {
                var dataApp = new Date(ev.date);
                var dataLib = new Date(dataApp);
                dataLib.setDate(dataLib.getDate() + ev.carenciaDias);
                if (dataLib > hoje) {
                    var diasRestantes = Math.ceil((dataLib - hoje) / 86400000);
                    carencias.push({
                        produto: ev.produto || ev.desc,
                        dataAplicacao: ev.date,
                        dataLiberacao: dataLib.toISOString().split('T')[0],
                        diasRestantes: diasRestantes,
                        carenciaDias: ev.carenciaDias
                    });
                }
            }
        });
        return carencias.length > 0 ? carencias : null;
    },

    verificarCarenciaVenda: function (loteNome) {
        var carencias = this.getCarenciaAtiva(loteNome);
        if (!carencias) return true;
        var msgs = carencias.map(function (c) {
            return '• ' + c.produto + ' — libera em ' + c.dataLiberacao + ' (' + c.diasRestantes + ' dias)';
        });
        return confirm('⚠️ ALERTA DE CARÊNCIA SANITÁRIA!\n\nO lote "' + loteNome + '" possui produtos com período de carência ativo:\n\n' + msgs.join('\n') + '\n\nVender animais dentro da carência é PROIBIDO pela legislação sanitária.\n\nDeseja continuar mesmo assim?');
    },

    // ====== CALENDÁRIO SANITÁRIO (Vacinas) ======
    getProximasVacinas: function () {
        if (!window.data) return [];
        var self = this;
        var lotes = window.lotes ? window.lotes.getLotes() : [];
        var alertas = [];

        lotes.forEach(function (lote) {
            self.protocolos.forEach(function (proto) {
                var ultimaAplicacao = null;
                window.data.events.forEach(function (ev) {
                    if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && ev.lote === lote.nome) {
                        var desc = ((ev.desc || '') + (ev.tipoManejo || '') + (ev.produto || '')).toLowerCase();
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
                    lote: lote.nome, vacina: proto.vacina,
                    ultimaAplicacao: ultimaAplicacao ? ultimaAplicacao.toLocaleDateString('pt-BR') : 'Nunca',
                    proximaData: proximaData ? proximaData.toLocaleDateString('pt-BR') : 'Aplicar',
                    diasRestantes: diasRestantes, status: status, qtdAnimais: lote.qtdAnimais
                });
            });
        });

        alertas.sort(function (a, b) { return a.diasRestantes - b.diasRestantes; });
        return alertas;
    },

    // ====== RENDER PRINCIPAL ======
    renderCalendarioSanitario: function () {
        var container = document.getElementById('calendario-content');
        if (!container) return;

        var html = '';

        // ═══ SEÇÃO 0: TAREFAS DO DIA (IATF) ═══
        var tarefasHoje = this.getTarefasDoDia();
        var tarefasPend = this.getTarefasPendentes();
        if (tarefasHoje.length > 0 || tarefasPend.length > 0) {
            html += '<div class="kpi-section"><div class="kpi-title">🔔 Tarefas IATF</div>';
            if (tarefasHoje.length > 0) {
                html += '<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:12px;margin-bottom:10px;">';
                html += '<div style="font-weight:700;color:#92400e;margin-bottom:6px;">📌 HOJE (' + tarefasHoje.length + ' tarefa' + (tarefasHoje.length > 1 ? 's' : '') + ')</div>';
                tarefasHoje.forEach(function (t) {
                    html += '<div style="background:#fff;border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
                        + '<div style="font-weight:600;color:#1a1a1a;">' + t.label + '</div>'
                        + '<div style="font-size:12px;color:#666;">' + t.lote + ' — ' + t.desc + '</div>'
                        + '<button class="btn-sm" style="margin-top:6px;" onclick="window.calendario.concluirTarefa(\'' + t.protocoloId + '\',' + t.diaProtocolo + ')">✅ Concluir</button>'
                        + '</div>';
                });
                html += '</div>';
            }
            // Próximas tarefas
            var futuras = tarefasPend.filter(function (t) { return t.date > new Date().toISOString().split('T')[0]; }).slice(0, 5);
            if (futuras.length > 0) {
                html += '<div style="font-size:13px;font-weight:600;margin-bottom:6px;">📅 Próximas:</div>';
                futuras.forEach(function (t) {
                    var dias = Math.ceil((new Date(t.date) - new Date()) / 86400000);
                    html += '<div class="history-card"><div class="history-card-header">'
                        + '<span class="badge badge-blue">' + t.label + '</span>'
                        + '<span class="date">' + t.date + ' (' + dias + 'd)</span></div>'
                        + '<div class="history-card-body"><strong>' + t.lote + '</strong>'
                        + '<span class="detail">' + t.desc + '</span></div></div>';
                });
            }
            html += '</div>';
        }

        // ═══ SEÇÃO 1: PROTOCOLOS IATF ATIVOS ═══
        var protos = this.getProtocolosIATF();
        html += '<div class="kpi-section" style="margin-top:16px;"><div class="kpi-title">🧬 Protocolos IATF</div>';
        html += '<button class="submit-btn" style="margin-bottom:12px;font-size:13px;padding:10px;" onclick="window.calendario.abrirNovoIATF()">➕ Iniciar Novo Protocolo IATF</button>';

        if (protos.length === 0) {
            html += '<div class="empty-state">Nenhum protocolo IATF registrado.</div>';
        } else {
            var self = this;
            protos.forEach(function (p) {
                var etapas = self.getEtapasProtocolo(p.id);
                var concluidas = etapas.filter(function (e) { return e.status === 'CONCLUIDO'; }).length;
                var pct = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;

                html += '<div class="history-card" style="margin-bottom:12px;">';
                html += '<div class="history-card-header"><span class="badge badge-blue">🧬 ' + (p.templateNome || 'IATF') + '</span>';
                html += '<span class="date">' + (p.date || '').split('T')[0] + '</span></div>';
                html += '<div class="history-card-body">';
                html += '<strong>' + p.lote + '</strong>';
                if (p.touro) html += '<span class="detail">🐂 Touro: ' + p.touro + '</span>';
                if (p.inseminador) html += '<span class="detail">👨‍⚕️ Inseminador: ' + p.inseminador + '</span>';
                html += '<div style="margin-top:8px;">';
                // Progress bar
                html += '<div style="background:rgba(0,0,0,0.1);border-radius:6px;height:8px;overflow:hidden;">'
                    + '<div style="background:linear-gradient(90deg,#22c55e,#16a34a);height:100%;width:' + pct + '%;border-radius:6px;transition:width 0.3s;"></div></div>';
                html += '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;">' + concluidas + '/' + etapas.length + ' etapas (' + pct + '%)</div>';
                // Timeline visual
                html += '<div class="iatf-timeline">';
                etapas.forEach(function (e, i) {
                    var done = e.status === 'CONCLUIDO';
                    var isToday = e.date === new Date().toISOString().split('T')[0];
                    var nodeClass = done ? 'done' : (isToday ? 'today' : 'pending');
                    html += '<div class="iatf-node ' + nodeClass + '">';
                    html += '<div class="iatf-dot"></div>';
                    if (i < etapas.length - 1) html += '<div class="iatf-line"></div>';
                    html += '<div class="iatf-label">' + 'D' + e.diaProtocolo + '</div>';
                    html += '<div class="iatf-date">' + (e.date || '').substring(5) + '</div>';
                    html += '</div>';
                });
                html += '</div></div></div></div>';
            });
        }
        html += '</div>';

        // ═══ SEÇÃO 2: CALENDÁRIO SANITÁRIO ═══
        var alertas = this.getProximasVacinas();
        var statusColors = {
            'vencida': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', badge: '🚨 VENCIDA' },
            'alerta': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', badge: '⚠️ ALERTA' },
            'ok': { bg: '#dcfce7', border: '#22c55e', text: '#166534', badge: '✅ OK' },
            'pendente': { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', badge: '📋 PENDENTE' }
        };

        html += '<div class="kpi-section" style="margin-top:16px;"><div class="kpi-title">🗓️ Calendário Sanitário</div>';
        if (alertas.length === 0) {
            html += '<div class="empty-state">Nenhum lote ativo.</div>';
        } else {
            var urgentes = alertas.filter(function (a) { return a.status === 'vencida' || a.status === 'alerta'; });
            var okCount = alertas.filter(function (a) { return a.status === 'ok'; }).length;
            html += '<div class="kpi-grid" style="margin-bottom:12px;">'
                + '<div class="kpi-card"' + (urgentes.length > 0 ? ' style="background:#fee2e2;"' : '') + '><div class="kpi-label">Pendências</div><div class="kpi-value' + (urgentes.length > 0 ? ' negative' : ' positive') + '">' + urgentes.length + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Em Dia</div><div class="kpi-value positive">' + okCount + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Total</div><div class="kpi-value">' + alertas.length + '</div></div>'
                + '</div>';

            var allItems = urgentes.concat(alertas.filter(function (a) { return a.status !== 'vencida' && a.status !== 'alerta'; }));
            allItems.slice(0, 30).forEach(function (a) {
                var c = statusColors[a.status] || statusColors.pendente;
                html += '<div style="background:' + c.bg + ';border:1px solid ' + c.border + ';border-radius:8px;padding:10px;margin-bottom:8px;">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<div><strong style="color:' + c.text + ';">' + a.vacina + '</strong>'
                    + '<div style="font-size:12px;color:' + c.text + ';">' + a.lote + ' (' + a.qtdAnimais + ' cab)</div></div>'
                    + '<div style="text-align:right;">'
                    + '<div style="font-size:11px;font-weight:700;">' + c.badge + '</div>'
                    + '<div style="font-size:11px;color:' + c.text + ';">Próx: ' + a.proximaData + '</div>'
                    + '</div></div></div>';
            });
        }
        html += '</div>';

        // ═══ SEÇÃO 3: FICHA SANITÁRIA POR LOTE ═══
        var lotes = window.lotes ? window.lotes.getLotes() : [];
        if (lotes.length > 0) {
            html += '<div class="kpi-section" style="margin-top:16px;"><div class="kpi-title">📋 Ficha Sanitária por Lote</div>';
            var self = this;
            lotes.forEach(function (l) {
                var manejos = window.data ? window.data.events.filter(function (ev) {
                    return (ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO' || ev.type === 'REPRODUCAO') && ev.lote === l.nome;
                }) : [];
                var vacinacoes = manejos.filter(function (m) { return m.tipoManejo === 'vacinacao' || m.categoria === 'VACINA'; }).length;
                var pesagens = manejos.filter(function (m) { return m.tipoManejo === 'pesagem'; }).length;
                var vermifugacoes = manejos.filter(function (m) { return ((m.desc || '') + (m.produto || '')).toLowerCase().indexOf('vermif') >= 0 || ((m.desc || '') + (m.produto || '')).toLowerCase().indexOf('ivermec') >= 0; }).length;
                var ultimoManejo = manejos.length > 0 ? manejos[manejos.length - 1] : null;

                // Carência ativa?
                var carencias = self.getCarenciaAtiva(l.nome);
                var carenciaHtml = '';
                if (carencias) {
                    carenciaHtml = '<div class="carencia-alert">🚫 CARÊNCIA ATIVA: ' + carencias.map(function (c) { return c.produto + ' (' + c.diasRestantes + 'd)'; }).join(', ') + '</div>';
                }

                html += '<div class="history-card" style="cursor:pointer" onclick="window.calendario.renderFichaSanitaria(\'' + l.nome + '\')">'
                    + '<div class="history-card-header">'
                    + '<span class="badge badge-green">📋 ' + l.nome + '</span>'
                    + '<span class="date">' + (l.qtdAnimais || 0) + ' cab</span></div>'
                    + '<div class="history-card-body">'
                    + '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px;">'
                    + '<span>💉 ' + vacinacoes + ' vacinas</span>'
                    + '<span>⚖️ ' + pesagens + ' pesagens</span>'
                    + '<span>🪱 ' + vermifugacoes + ' vermífugos</span>'
                    + '<span>📝 ' + manejos.length + ' total</span></div>'
                    + carenciaHtml
                    + (ultimoManejo ? '<div style="font-size:12px;margin-top:4px;color:rgba(255,255,255,.5)">Último: ' + (ultimoManejo.desc || ultimoManejo.produto || ultimoManejo.tipoManejo || '') + ' (' + (ultimoManejo.date || '').split('T')[0] + ')</div>' : '')
                    + '<div style="margin-top:6px;display:flex;gap:6px;">'
                    + '<button class="btn-sm" onclick="event.stopPropagation(); window.calendario.abrirManejoSanitario(\'' + l.nome + '\')">💉 Registrar Manejo</button>'
                    + '</div>'
                    + '</div></div>';
            });
            html += '</div>';
        }

        container.innerHTML = html;
    },

    // ====== MODAL: NOVO IATF ======
    abrirNovoIATF: function () {
        var lotes = window.lotes ? window.lotes.getLotes() : [];
        var optLotes = lotes.map(function (l) {
            return '<option value="' + l.nome + '">' + l.nome + ' (' + l.qtdAnimais + ' cab)</option>';
        }).join('');

        var optTmpls = '';
        for (var key in this.IATF_TEMPLATES) {
            optTmpls += '<option value="' + key + '">' + this.IATF_TEMPLATES[key].nome + '</option>';
        }

        var html = '<div class="modal-overlay" id="modal-novo-iatf">'
            + '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">'
            + '<div class="modal-header"><h3>🧬 Iniciar Protocolo IATF</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-novo-iatf\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Lote</label><select id="iatf-lote">' + optLotes + '</select></div>'
            + '<div class="form-group"><label>Protocolo</label><select id="iatf-template">' + optTmpls + '</select></div>'
            + '<div class="form-group"><label>Data de Início (D0)</label><input type="date" id="iatf-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Touro / Sêmen</label><input type="text" id="iatf-touro" placeholder="Ex: Nelore Pintado 505"></div>'
            + '<div class="form-group"><label>Inseminador</label><input type="text" id="iatf-inseminador" placeholder="Nome do técnico"></div>'
            + '<button class="submit-btn" onclick="window.calendario.confirmarNovoIATF()">🚀 Iniciar Protocolo</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarNovoIATF: function () {
        var lote = document.getElementById('iatf-lote').value;
        var tmpl = document.getElementById('iatf-template').value;
        var data = document.getElementById('iatf-data').value;
        var touro = document.getElementById('iatf-touro').value;
        var inseminador = document.getElementById('iatf-inseminador').value;

        if (!lote || !data) {
            window.app.showToast('Preencha lote e data.', 'error');
            return;
        }

        this.iniciarProtocolo(lote, tmpl, data, touro, inseminador);
        this.fecharModal('modal-novo-iatf');
        window.app.showToast('🧬 Protocolo IATF iniciado para ' + lote + '!');
        this.renderCalendarioSanitario();
    },

    // ====== MODAL: MANEJO SANITÁRIO DETALHADO ======
    abrirManejoSanitario: function (loteNome) {
        var html = '<div class="modal-overlay" id="modal-manejo-san">'
            + '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">'
            + '<div class="modal-header"><h3>💉 Manejo Sanitário Detalhado</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-manejo-san\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Lote: <strong>' + loteNome + '</strong></label></div>'
            + '<div class="form-group"><label>Categoria</label><select id="san-categoria">'
            + '<option value="VACINA">💉 Vacina</option>'
            + '<option value="VERMIFUGO">🪱 Vermífugo</option>'
            + '<option value="HORMONIO">💊 Hormônio</option>'
            + '<option value="ANTIBIOTICO">💊 Antibiótico</option>'
            + '<option value="OUTRO">📝 Outro</option></select></div>'
            + '<div class="form-group"><label>Produto (Nome Comercial)</label><input type="text" id="san-produto" placeholder="Ex: Ivomec Gold, Bovigen Repro"></div>'
            + '<div class="form-group"><label>Fabricante / Laboratório</label><input type="text" id="san-fabricante" placeholder="Ex: Zoetis, Merial, Ourofino"></div>'
            + '<div class="form-group"><label>Lote do Produto (Partida)</label><input type="text" id="san-lote-produto" placeholder="Nº do lote no frasco"></div>'
            + '<div class="form-row"><div class="form-group"><label>Dose (ml/animal)</label><input type="number" id="san-dose" step="0.1" placeholder="2.0"></div>'
            + '<div class="form-group"><label>Via de Aplicação</label><select id="san-via">'
            + '<option value="SC">Subcutânea (SC)</option>'
            + '<option value="IM">Intramuscular (IM)</option>'
            + '<option value="PO">Pour-on</option>'
            + '<option value="ORAL">Oral</option></select></div></div>'
            + '<div class="form-row"><div class="form-group"><label>Data Aplicação</label><input type="date" id="san-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Carência (dias)</label><input type="number" id="san-carencia" placeholder="0" value="0"><div style="font-size:10px;color:#888;margin-top:2px;">Dias para liberação de abate</div></div></div>'
            + '<div class="form-group"><label>Custo Estimado (R$)</label><input type="number" id="san-custo" step="0.01" placeholder="0.00"></div>'
            + '<div class="form-group"><label>Observações</label><input type="text" id="san-obs" placeholder="Opcional"></div>'
            + '<button class="submit-btn" onclick="window.calendario.confirmarManejoSanitario(\'' + loteNome + '\')">✅ Registrar Manejo</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarManejoSanitario: function (loteNome) {
        var cat = document.getElementById('san-categoria').value;
        var produto = document.getElementById('san-produto').value;
        var fabricante = document.getElementById('san-fabricante').value;
        var loteProd = document.getElementById('san-lote-produto').value;
        var dose = parseFloat(document.getElementById('san-dose').value) || 0;
        var via = document.getElementById('san-via').value;
        var data = document.getElementById('san-data').value;
        var carencia = parseInt(document.getElementById('san-carencia').value) || 0;
        var custo = parseFloat(document.getElementById('san-custo').value) || 0;
        var obs = document.getElementById('san-obs').value;

        if (!produto) {
            window.app.showToast('Informe o produto.', 'error');
            return;
        }

        // Calcular data de liberação
        var dataLiberacao = null;
        if (carencia > 0) {
            var dl = new Date(data);
            dl.setDate(dl.getDate() + carencia);
            dataLiberacao = dl.toISOString().split('T')[0];
        }

        window.data.saveEvent({
            type: 'MANEJO_SANITARIO',
            lote: loteNome,
            categoria: cat,
            produto: produto,
            fabricante: fabricante,
            loteProduto: loteProd,
            dose: dose,
            via: via,
            date: data,
            carenciaDias: carencia,
            dataLiberacao: dataLiberacao,
            cost: custo,
            obs: obs,
            desc: cat + ': ' + produto + (dose > 0 ? ' ' + dose + 'ml' : ''),
            timestamp: new Date().toISOString()
        });

        this.fecharModal('modal-manejo-san');
        var carMsg = carencia > 0 ? ' (Carência: ' + carencia + 'd até ' + dataLiberacao + ')' : '';
        window.app.showToast('💉 ' + produto + ' registrado em ' + loteNome + carMsg);
        this.renderCalendarioSanitario();
    },

    // ====== PROTOCOLO REPRODUTIVO (legado compatível) ======
    registrarProtocolo: function (loteNome) {
        var html = '<div class="modal-overlay" id="modal-repro">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🐄 Protocolo Reprodutivo</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-repro\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Lote: <strong>' + loteNome + '</strong></label></div>'
            + '<div class="form-group"><label>Tipo de Protocolo</label><select id="repro-tipo">'
            + '<option value="iatf">IATF (Inseminação)</option>'
            + '<option value="monta">Monta Natural</option>'
            + '<option value="prenhez">Diagnóstico de Prenhez</option>'
            + '<option value="parto">Previsão de Parto</option></select></div>'
            + '<div class="form-group"><label>Data</label><input type="date" id="repro-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Qtd de Matrizes</label><input type="number" id="repro-qty" min="1" placeholder="20"></div>'
            + '<div class="form-group"><label>Taxa de Prenhez (%)</label><input type="number" id="repro-taxa" min="0" max="100" step="1" placeholder="85"></div>'
            + '<div class="form-group"><label>Observação</label><input type="text" id="repro-obs" placeholder="Touro, sêmen, etc."></div>'
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

    // ====== FICHA SANITÁRIA POR LOTE ======
    renderFichaSanitaria: function (loteNome) {
        if (!window.data) return;
        var manejos = window.data.events.filter(function (ev) {
            return (ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO' || ev.type === 'REPRODUCAO') && ev.lote === loteNome;
        });
        manejos.sort(function (a, b) { return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp); });

        var carencias = this.getCarenciaAtiva(loteNome);
        var carenciaHtml = '';
        if (carencias) {
            carenciaHtml = '<div class="carencia-alert" style="margin-bottom:12px;">🚫 CARÊNCIA ATIVA:<br>'
                + carencias.map(function (c) {
                    return '<strong>' + c.produto + '</strong> — libera em ' + c.dataLiberacao + ' (' + c.diasRestantes + ' dias restantes)';
                }).join('<br>') + '</div>';
        }

        var html = '<div class="modal-overlay" id="modal-ficha">'
            + '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">'
            + '<div class="modal-header"><h3>📋 Ficha Sanitária: ' + loteNome + '</h3>'
            + '<button onclick="window.calendario.fecharModal(\'modal-ficha\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">' + carenciaHtml;

        if (manejos.length === 0) {
            html += '<div class="empty-state">Nenhum manejo registrado.</div>';
        } else {
            html += '<table style="width:100%;font-size:12px;border-collapse:collapse;">'
                + '<thead><tr style="border-bottom:2px solid var(--border-subtle);">'
                + '<th style="text-align:left;padding:5px;">Data</th>'
                + '<th style="text-align:left;padding:5px;">Tipo</th>'
                + '<th style="text-align:left;padding:5px;">Produto</th>'
                + '<th style="text-align:left;padding:5px;">Fab.</th>'
                + '<th style="text-align:right;padding:5px;">Carência</th>'
                + '<th style="text-align:right;padding:5px;">R$</th></tr></thead><tbody>';

            manejos.forEach(function (m) {
                var tipoLabel = m.categoria || m.tipoManejo || m.tipoProtocolo || m.type;
                var prodLabel = m.produto || m.desc || m.obs || '--';
                var fabLabel = m.fabricante || '--';
                var carLabel = m.carenciaDias > 0 ? m.carenciaDias + 'd' : '--';
                var custoLabel = m.cost ? 'R$ ' + m.cost.toFixed(2) : '--';
                html += '<tr style="border-bottom:1px solid var(--border-subtle);">'
                    + '<td style="padding:5px;">' + (m.date || '').split('T')[0] + '</td>'
                    + '<td style="padding:5px;">' + tipoLabel + '</td>'
                    + '<td style="padding:5px;">' + prodLabel + '</td>'
                    + '<td style="padding:5px;">' + fabLabel + '</td>'
                    + '<td style="padding:5px;text-align:right;">' + carLabel + '</td>'
                    + '<td style="padding:5px;text-align:right;">' + custoLabel + '</td></tr>';
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
