// ====== MÓDULO: FINANCEIRO AVANÇADO ======
// Features 24-26: Contas a Pagar, Preço Arroba, Valor Rebanho em Pé
window.contas = {

    init: function () {
        console.log('Contas Module Ready');
    },

    // ====== 24. CONTAS A PAGAR ======
    abrirContaPagar: function () {
        var html = '<div class="modal-overlay" id="modal-conta">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>📋 Nova Conta a Pagar</h3>'
            + '<button onclick="window.contas.fecharModal(\'modal-conta\')" class="modal-close">✕</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Descrição</label>'
            + '<input type="text" id="conta-desc" placeholder="Ex: Ração do mês"></div>'
            + '<div class="form-group"><label>Valor (R$)</label>'
            + '<input type="number" id="conta-valor" step="0.01" placeholder="1500.00"></div>'
            + '<div class="form-group"><label>Vencimento</label>'
            + '<input type="date" id="conta-vencimento"></div>'
            + '<div class="form-group"><label>Categoria</label>'
            + '<select id="conta-cat">'
            + '<option value="nutricao">🧂 Nutrição</option>'
            + '<option value="sanidade">💊 Sanidade</option>'
            + '<option value="mao_obra">👷 Mão de Obra</option>'
            + '<option value="infraestrutura">🔨 Infraestrutura</option>'
            + '<option value="impostos">🏛️ Impostos/Taxas</option>'
            + '<option value="combustivel">⛽ Combustível</option>'
            + '<option value="outro">📌 Outro</option></select></div>'
            + '<div class="form-group"><label>Recorrente?</label>'
            + '<select id="conta-recorrente">'
            + '<option value="nao">Não</option>'
            + '<option value="mensal">Mensal</option>'
            + '<option value="semanal">Semanal</option></select></div>'
            + '<button class="submit-btn" onclick="window.contas.salvarConta()">💾 Salvar Conta</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    salvarConta: function () {
        var desc = document.getElementById('conta-desc').value;
        var valor = parseFloat(document.getElementById('conta-valor').value) || 0;
        var vencimento = document.getElementById('conta-vencimento').value;
        var categoria = document.getElementById('conta-cat').value;
        var recorrente = document.getElementById('conta-recorrente').value;

        if (!desc || !valor) {
            window.app.showToast('Preencha descrição e valor.', 'error');
            return;
        }

        window.data.saveEvent({
            type: 'CONTA_PAGAR', desc: desc, value: valor,
            vencimento: vencimento, categoria: categoria,
            recorrente: recorrente, status: 'pendente',
            date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-conta');
        window.app.showToast('✅ Conta registrada: ' + desc);
        this.renderContasPagar();
    },

    pagarConta: function (contaId) {
        if (!window.data) return;
        window.data.events.forEach(function (ev) {
            if (ev.id === contaId && ev.type === 'CONTA_PAGAR') {
                ev.status = 'pago';
                ev.dataPagamento = new Date().toISOString().split('T')[0];
            }
        });
        window.data.save();
        window.app.showToast('✅ Conta marcada como paga!');
        this.renderContasPagar();
    },

    renderContasPagar: function () {
        var container = document.getElementById('contas-pagar-content');
        if (!container || !window.data) return;

        var contas = window.data.events.filter(function (ev) {
            return ev.type === 'CONTA_PAGAR';
        });

        var pendentes = contas.filter(function (c) { return c.status === 'pendente'; });
        var pagas = contas.filter(function (c) { return c.status === 'pago'; });

        // Sort by due date
        pendentes.sort(function (a, b) {
            return new Date(a.vencimento || '2099-01-01') - new Date(b.vencimento || '2099-01-01');
        });

        var totalPendente = 0;
        pendentes.forEach(function (c) { totalPendente += (c.value || 0); });

        var totalPago = 0;
        pagas.forEach(function (c) { totalPago += (c.value || 0); });

        var fmt = function (v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Pendente</div>'
            + '<div class="kpi-value negative">' + fmt(totalPendente) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pago</div>'
            + '<div class="kpi-value positive">' + fmt(totalPago) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Qtd Pendente</div>'
            + '<div class="kpi-value">' + pendentes.length + '</div></div></div>';

        // List pending bills
        if (pendentes.length > 0) {
            html += '<div class="section-title">📋 Contas Pendentes</div>';
            var self = this;
            pendentes.forEach(function (c) {
                var venc = c.vencimento ? new Date(c.vencimento) : null;
                var hoje = new Date();
                var vencida = venc && venc < hoje;
                var catIcons = { nutricao: '🧂', sanidade: '💊', mao_obra: '👷', infraestrutura: '🔨', impostos: '🏛️', combustivel: '⛽', outro: '📌' };

                html += '<div class="history-card" style="' + (vencida ? 'border-left:3px solid #ef4444;' : '') + '">'
                    + '<div class="history-card-header">'
                    + '<span class="badge ' + (vencida ? 'badge-red' : 'badge-yellow') + '">'
                    + (catIcons[c.categoria] || '📌') + ' ' + (c.desc || '--') + '</span>'
                    + '<span class="date">' + (c.vencimento || 'Sem data') + '</span></div>'
                    + '<div class="history-card-body">'
                    + '<strong class="text-red">' + fmt(c.value) + '</strong>'
                    + '<button class="btn-sm" onclick="window.contas.pagarConta(\'' + c.id + '\')">✅ Pagar</button>'
                    + '</div></div>';
            });
        }

        // List paid (collapsed)
        if (pagas.length > 0) {
            html += '<div class="section-title" style="margin-top:16px;opacity:0.7;">✅ Pagas (' + pagas.length + ')</div>';
            pagas.slice(-5).forEach(function (c) {
                html += '<div class="history-card" style="opacity:0.6;">'
                    + '<div class="history-card-header">'
                    + '<span class="badge badge-green">✅ ' + (c.desc || '--') + '</span>'
                    + '<span class="date">' + (c.dataPagamento || c.date || '') + '</span></div>'
                    + '<div class="history-card-body"><strong>' + fmt(c.value) + '</strong></div></div>';
            });
        }

        // FAB
        html += '<button class="fab" onclick="window.contas.abrirContaPagar()">+</button>';

        container.innerHTML = html;
    },

    // ====== 25. PREÇO DA ARROBA AO VIVO ======
    setPrecoArroba: function (preco) {
        localStorage.setItem('agromacro_preco_arroba', preco);
        window.app.showToast('💲 Preço da @ atualizado: R$ ' + parseFloat(preco).toFixed(2));
    },

    getPrecoArroba: function () {
        return parseFloat(localStorage.getItem('agromacro_preco_arroba')) || 0;
    },

    // ====== 26. VALOR DO REBANHO EM PÉ ======
    // Total cab × peso médio / 30 × preço @
    calcValorRebanhoEmPe: function () {
        var precoArroba = this.getPrecoArroba();
        var totalAnimais = 0;
        var pesoTotal = 0;

        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                totalAnimais += (l.qtdAnimais || 0);
                pesoTotal += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
            });
        }

        var arrobasTotais = pesoTotal / 30; // Em pé = /30
        var valorRebanho = arrobasTotais * precoArroba;

        return {
            totalAnimais: totalAnimais,
            pesoTotal: pesoTotal,
            pesoMedio: totalAnimais > 0 ? pesoTotal / totalAnimais : 0,
            arrobasTotais: arrobasTotais,
            precoArroba: precoArroba,
            valorRebanho: valorRebanho
        };
    },

    renderCotacaoRebanho: function () {
        var container = document.getElementById('cotacao-rebanho');
        if (!container) return;

        var info = this.calcValorRebanhoEmPe();
        var fmt = function (v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };

        var html = '<div class="kpi-section">'
            + '<div class="kpi-title">💲 Valor do Rebanho em Pé</div>'
            + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">'
            + '<label style="font-size:13px;white-space:nowrap;">Preço @:</label>'
            + '<input type="number" id="input-preco-arroba" step="0.01" placeholder="280.00" '
            + 'value="' + (info.precoArroba || '') + '" '
            + 'style="flex:1;padding:8px;border:1px solid var(--border-subtle);border-radius:6px;font-size:14px;background:var(--bg-1);color:var(--text-0);" '
            + 'onchange="window.contas.setPrecoArroba(this.value); window.contas.renderCotacaoRebanho();">'
            + '</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Cabeças</div>'
            + '<div class="kpi-value">' + info.totalAnimais + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div>'
            + '<div class="kpi-value">' + info.pesoMedio.toFixed(0) + ' kg</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Total @</div>'
            + '<div class="kpi-value">' + info.arrobasTotais.toFixed(1) + '</div></div>'
            + '<div class="kpi-card" style="grid-column:span 2;"><div class="kpi-label">💰 Valor Total do Rebanho</div>'
            + '<div class="kpi-value positive" style="font-size:24px;">' + fmt(info.valorRebanho) + '</div></div>'
            + '</div></div>';

        container.innerHTML = html;
    },

    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
