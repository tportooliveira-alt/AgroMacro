// ====== MÓDULO: OPERAÇÕES DE REBANHO ======
// Features 9-11: Transferência Parcial, Mortalidade/Baixa, Nascimentos
window.rebanhoOps = {

    init: function () {
        console.log('Rebanho Ops Module Ready');
    },

    // ====== 9. TRANSFERÊNCIA PARCIAL DE LOTE ======
    abrirTransferencia: function (loteNome) {
        var lote = window.lotes ? window.lotes.getLoteByNome(loteNome) : null;
        if (!lote) return;

        var lotes = window.lotes.getLotes();
        var optionsHtml = '<option value="">— Selecionar destino —</option>';
        lotes.forEach(function (l) {
            if (l.nome !== loteNome) {
                optionsHtml += '<option value="' + l.nome + '">' + l.nome + ' (' + l.qtdAnimais + ' cab)</option>';
            }
        });
        optionsHtml += '<option value="__NOVO__">+ Criar novo lote</option>';

        var html = '<div class="modal-overlay" id="modal-transferencia">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🔄 Transferir Animais</h3>'
            + '<button onclick="window.rebanhoOps.fecharModal(\'modal-transferencia\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>De: <strong>' + loteNome + '</strong> (' + lote.qtdAnimais + ' cab)</label></div>'
            + '<div class="form-group"><label>Quantidade a Transferir</label>'
            + '<input type="number" id="transf-qty" min="1" max="' + lote.qtdAnimais + '" placeholder="Ex: 10"></div>'
            + '<div class="form-group"><label>Lote Destino</label>'
            + '<select id="transf-destino">' + optionsHtml + '</select></div>'
            + '<div class="form-group" id="transf-novo-grupo" style="display:none;">'
            + '<label>Nome do Novo Lote</label><input type="text" id="transf-novo-nome" placeholder="Nome"></div>'
            + '<button class="submit-btn" onclick="window.rebanhoOps.confirmarTransferencia(\'' + loteNome + '\')">✅ Confirmar Transferência</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('transf-destino').addEventListener('change', function () {
            var novoGrupo = document.getElementById('transf-novo-grupo');
            novoGrupo.style.display = this.value === '__NOVO__' ? 'block' : 'none';
        });
    },

    confirmarTransferencia: function (loteOrigem) {
        var qty = parseInt(document.getElementById('transf-qty').value) || 0;
        var destino = document.getElementById('transf-destino').value;
        var lote = window.lotes.getLoteByNome(loteOrigem);

        if (!qty || qty <= 0 || qty > lote.qtdAnimais) {
            window.app.showToast('Quantidade inválida.', 'error');
            return;
        }
        if (!destino) {
            window.app.showToast('Selecione o lote destino.', 'error');
            return;
        }

        // Criar novo lote se necessário
        if (destino === '__NOVO__') {
            destino = document.getElementById('transf-novo-nome').value;
            if (!destino) {
                window.app.showToast('Digite o nome do novo lote.', 'error');
                return;
            }
            window.data.saveEvent({
                type: 'LOTE', nome: destino, categoria: lote.categoria, raca: lote.raca,
                qtdAnimais: qty, pesoMedio: lote.pesoMedio, pasto: '', status: 'ATIVO',
                dataEntrada: new Date().toISOString().split('T')[0],
                salMineral: lote.salMineral, salConsumo: lote.salConsumo
            });
        } else {
            // Adicionar ao lote destino
            var loteDest = window.lotes.getLoteByNome(destino);
            if (loteDest) {
                window.data.saveEvent({
                    type: 'LOTE', nome: destino, categoria: loteDest.categoria, raca: loteDest.raca,
                    qtdAnimais: (loteDest.qtdAnimais || 0) + qty, pesoMedio: loteDest.pesoMedio,
                    pasto: loteDest.pasto, status: 'ATIVO', dataEntrada: loteDest.dataEntrada,
                    salMineral: loteDest.salMineral, salConsumo: loteDest.salConsumo
                });
            }
        }

        // Reduzir lote origem
        window.data.saveEvent({
            type: 'LOTE', nome: loteOrigem, categoria: lote.categoria, raca: lote.raca,
            qtdAnimais: lote.qtdAnimais - qty, pesoMedio: lote.pesoMedio,
            pasto: lote.pasto, status: (lote.qtdAnimais - qty) > 0 ? 'ATIVO' : 'INATIVO',
            dataEntrada: lote.dataEntrada, salMineral: lote.salMineral, salConsumo: lote.salConsumo
        });

        // Registro da transferência
        window.data.saveEvent({
            type: 'TRANSFERENCIA', loteOrigem: loteOrigem, loteDestino: destino,
            qty: qty, date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-transferencia');
        window.app.showToast('✅ ' + qty + ' animais transferidos para ' + destino);
        if (window.lotes) window.lotes.renderList();
        if (window.indicadores) window.indicadores.renderIndicadoresProdutivos();
    },

    // ====== 10. MORTALIDADE / BAIXA ======
    abrirMortalidade: function (loteNome) {
        var lote = window.lotes ? window.lotes.getLoteByNome(loteNome) : null;
        if (!lote) return;

        var html = '<div class="modal-overlay" id="modal-mortalidade">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>💀 Registrar Baixa</h3>'
            + '<button onclick="window.rebanhoOps.fecharModal(\'modal-mortalidade\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Lote: <strong>' + loteNome + '</strong> (' + lote.qtdAnimais + ' cab)</label></div>'
            + '<div class="form-group"><label>Quantidade de Baixas</label>'
            + '<input type="number" id="mort-qty" min="1" max="' + lote.qtdAnimais + '" value="1"></div>'
            + '<div class="form-group"><label>Motivo</label>'
            + '<select id="mort-motivo">'
            + '<option value="morte_natural">Morte Natural</option>'
            + '<option value="doenca">Doença</option>'
            + '<option value="acidente">Acidente</option>'
            + '<option value="predador">Ataque de Predador</option>'
            + '<option value="descarte">Descarte</option>'
            + '<option value="outro">Outro</option></select></div>'
            + '<div class="form-group"><label>Observação</label>'
            + '<input type="text" id="mort-obs" placeholder="Detalhes"></div>'
            + '<button class="submit-btn" onclick="window.rebanhoOps.confirmarMortalidade(\'' + loteNome + '\')">⚠️ Registrar Baixa</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarMortalidade: function (loteNome) {
        var qty = parseInt(document.getElementById('mort-qty').value) || 0;
        var motivo = document.getElementById('mort-motivo').value;
        var obs = document.getElementById('mort-obs').value;
        var lote = window.lotes.getLoteByNome(loteNome);

        if (!qty || qty <= 0 || qty > lote.qtdAnimais) {
            window.app.showToast('Quantidade inválida.', 'error');
            return;
        }

        // Atualizar lote
        window.data.saveEvent({
            type: 'LOTE', nome: loteNome, categoria: lote.categoria, raca: lote.raca,
            qtdAnimais: lote.qtdAnimais - qty, pesoMedio: lote.pesoMedio,
            pasto: lote.pasto, status: (lote.qtdAnimais - qty) > 0 ? 'ATIVO' : 'INATIVO',
            dataEntrada: lote.dataEntrada, salMineral: lote.salMineral, salConsumo: lote.salConsumo
        });

        // Evento de mortalidade
        window.data.saveEvent({
            type: 'MORTALIDADE', lote: loteNome, qty: qty, motivo: motivo,
            obs: obs, date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-mortalidade');
        window.app.showToast('⚠️ ' + qty + ' baixa(s) registrada(s) — ' + motivo);
        if (window.lotes) window.lotes.renderList();
    },

    // ====== 11. NASCIMENTOS ======
    abrirNascimento: function (loteNome) {
        var lote = window.lotes ? window.lotes.getLoteByNome(loteNome) : null;
        if (!lote) return;

        var html = '<div class="modal-overlay" id="modal-nascimento">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>🐣 Registrar Nascimentos</h3>'
            + '<button onclick="window.rebanhoOps.fecharModal(\'modal-nascimento\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Matrizes: <strong>' + loteNome + '</strong></label></div>'
            + '<div class="form-group"><label>Quantidade de Crias</label>'
            + '<input type="number" id="nasc-qty" min="1" value="1"></div>'
            + '<div class="form-group"><label>Peso Médio (kg)</label>'
            + '<input type="number" id="nasc-peso" step="0.5" value="35" placeholder="35"></div>'
            + '<div class="form-group"><label>Sexo Predominante</label>'
            + '<select id="nasc-sexo">'
            + '<option value="misto">Misto</option>'
            + '<option value="macho">Machos</option>'
            + '<option value="femea">Fêmeas</option></select></div>'
            + '<div class="form-group"><label>Destino dos Bezerros</label>'
            + '<select id="nasc-destino">'
            + '<option value="mesmo">Manter no mesmo lote</option>'
            + '<option value="novo">Criar lote de cria</option></select></div>'
            + '<button class="submit-btn" onclick="window.rebanhoOps.confirmarNascimento(\'' + loteNome + '\')">🐣 Registrar Nascimento</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmarNascimento: function (loteNome) {
        var qty = parseInt(document.getElementById('nasc-qty').value) || 0;
        var peso = parseFloat(document.getElementById('nasc-peso').value) || 35;
        var sexo = document.getElementById('nasc-sexo').value;
        var destino = document.getElementById('nasc-destino').value;
        var lote = window.lotes.getLoteByNome(loteNome);

        if (!qty || qty <= 0) {
            window.app.showToast('Informe a quantidade.', 'error');
            return;
        }

        if (destino === 'mesmo') {
            window.data.saveEvent({
                type: 'LOTE', nome: loteNome, categoria: lote.categoria, raca: lote.raca,
                qtdAnimais: (lote.qtdAnimais || 0) + qty, pesoMedio: lote.pesoMedio,
                pasto: lote.pasto, status: 'ATIVO', dataEntrada: lote.dataEntrada,
                salMineral: lote.salMineral, salConsumo: lote.salConsumo
            });
        } else {
            var novoNome = 'Bezerros ' + loteNome + ' ' + new Date().getFullYear();
            window.data.saveEvent({
                type: 'LOTE', nome: novoNome, categoria: 'cria', raca: lote.raca,
                qtdAnimais: qty, pesoMedio: peso, pasto: lote.pasto, status: 'ATIVO',
                dataEntrada: new Date().toISOString().split('T')[0]
            });
        }

        window.data.saveEvent({
            type: 'NASCIMENTO', lote: loteNome, qty: qty, pesoMedio: peso,
            sexo: sexo, date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-nascimento');
        window.app.showToast('🐣 ' + qty + ' nascimento(s) registrado(s)!');
        if (window.lotes) window.lotes.renderList();
    },

    // ====== 12. HISTÓRICO / TIMELINE POR LOTE ======
    abrirTimeline: function (loteNome) {
        if (!window.data) return;

        var events = window.data.events.filter(function (ev) {
            return ev.lote === loteNome || ev.nome === loteNome ||
                ev.loteOrigem === loteNome || ev.loteDestino === loteNome;
        });

        events.sort(function (a, b) {
            return new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp);
        });

        var typeLabels = {
            'LOTE': { icon: '📋', label: 'Cadastro' },
            'COMPRA': { icon: '🐄', label: 'Compra' },
            'VENDA': { icon: '💰', label: 'Venda' },
            'MANEJO': { icon: '💉', label: 'Manejo' },
            'ABASTECIMENTO': { icon: '🧂', label: 'Abastecimento' },
            'TRANSFERENCIA': { icon: '🔄', label: 'Transferência' },
            'MORTALIDADE': { icon: '💀', label: 'Baixa' },
            'NASCIMENTO': { icon: '🐣', label: 'Nascimento' },
            'PESAGEM': { icon: '⚖️', label: 'Pesagem' }
        };

        var timelineHtml = '';
        events.forEach(function (ev) {
            var info = typeLabels[ev.type] || { icon: '📌', label: ev.type };
            var detail = ev.desc || ev.obs || '';
            if (ev.type === 'MANEJO') detail = (ev.tipoManejo || '') + ' — ' + (ev.desc || '');
            if (ev.type === 'TRANSFERENCIA') detail = ev.qty + ' cab → ' + (ev.loteDestino || '');
            if (ev.type === 'MORTALIDADE') detail = ev.qty + ' baixa(s) — ' + (ev.motivo || '');
            if (ev.type === 'NASCIMENTO') detail = ev.qty + ' cria(s) — ' + (ev.pesoMedio || '') + 'kg';
            if (ev.type === 'COMPRA' || ev.type === 'VENDA') detail = ev.qty + ' cab — R$ ' + (ev.value || 0).toLocaleString('pt-BR');
            if (ev.type === 'ABASTECIMENTO') detail = ev.qtdKg + 'kg ' + (ev.produto || '');

            var dateStr = (ev.date || '').split('T')[0];

            timelineHtml += '<div class="timeline-item">'
                + '<div class="timeline-dot" style="background:var(--gold);"></div>'
                + '<div class="timeline-content">'
                + '<div class="timeline-date">' + dateStr + '</div>'
                + '<div class="timeline-title">' + info.icon + ' ' + info.label + '</div>'
                + '<div class="timeline-detail">' + detail + '</div>'
                + '</div></div>';
        });

        if (events.length === 0) {
            timelineHtml = '<div class="empty-state">Nenhum evento registrado para este lote.</div>';
        }

        var html = '<div class="modal-overlay" id="modal-timeline">'
            + '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">'
            + '<div class="modal-header"><h3>📜 Histórico: ' + loteNome + '</h3>'
            + '<button onclick="window.rebanhoOps.fecharModal(\'modal-timeline\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body"><div class="timeline">' + timelineHtml + '</div></div>'
            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    // ====== MODAL HELPERS ======
    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
