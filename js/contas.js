// ====== MODULO: FINANCEIRO AVANCADO v3 (Contas a Pagar, Preco Arroba, Valor Rebanho) ======
window.contas = {

    init: function () {
        console.log('Contas v3 Ready');
    },

    abrirContaPagar: function () {
        var html = '<div class="modal-overlay" id="modal-conta">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>Nova Conta a Pagar</h3>'
            + '<button onclick="window.contas.fecharModal(\'modal-conta\')" class="modal-close">X</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label>Descricao</label>'
            + '<input type="text" id="conta-desc" placeholder="Ex: Racao do mes"></div>'
            + '<div class="form-group"><label>Valor (R$)</label>'
            + '<input type="number" id="conta-valor" step="0.01" placeholder="1500.00"></div>'
            + '<div class="form-group"><label>Vencimento</label>'
            + '<input type="date" id="conta-vencimento"></div>'
            + '<div class="form-group"><label>Categoria</label>'
            + '<select id="conta-cat">'
            + '<option value="nutricao">Nutricao</option>'
            + '<option value="sanidade">Sanidade</option>'
            + '<option value="mao_obra">Mao de Obra</option>'
            + '<option value="infraestrutura">Infraestrutura</option>'
            + '<option value="impostos">Impostos/Taxas</option>'
            + '<option value="combustivel">Combustivel</option>'
            + '<option value="gado">Compra Gado</option>'
            + '<option value="outro">Outro</option></select></div>'
            + '<div class="form-group"><label>Forma de Pagamento</label>'
            + '<select id="conta-forma-pgto">'
            + '<option value="dinheiro">Dinheiro</option>'
            + '<option value="transferencia">Transferencia/PIX</option>'
            + '<option value="cheque">Cheque</option>'
            + '<option value="boleto">Boleto</option>'
            + '<option value="cartao">Cartao</option></select></div>'
            + '<div class="form-group"><label>Recorrente?</label>'
            + '<select id="conta-recorrente">'
            + '<option value="nao">Nao</option>'
            + '<option value="mensal">Mensal</option>'
            + '<option value="semanal">Semanal</option></select></div>'
            + '<div class="form-group"><label>Status</label>'
            + '<select id="conta-status">'
            + '<option value="pendente">Pendente</option>'
            + '<option value="pago">Ja Pago</option></select></div>'
            + '<button class="submit-btn" onclick="window.contas.salvarConta()">Salvar Conta</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    salvarConta: function () {
        var desc = document.getElementById('conta-desc').value;
        var valor = parseFloat(document.getElementById('conta-valor').value) || 0;
        var vencimento = document.getElementById('conta-vencimento').value;
        var categoria = document.getElementById('conta-cat').value;
        var formaPgto = document.getElementById('conta-forma-pgto') ? document.getElementById('conta-forma-pgto').value : 'dinheiro';
        var recorrente = document.getElementById('conta-recorrente').value;
        var statusEl = document.getElementById('conta-status');
        var status = statusEl ? statusEl.value : 'pendente';

        if (!desc || !valor) {
            window.app.showToast('Preencha descricao e valor.', 'error');
            return;
        }

        var ev = {
            type: 'CONTA_PAGAR',
            desc: desc,
            nome: desc,
            value: valor,
            vencimento: vencimento,
            categoria: categoria,
            formaPagamento: formaPgto,
            recorrente: recorrente,
            status: status,
            pago: status === 'pago',
            date: new Date().toISOString().split('T')[0]
        };

        if (status === 'pago') {
            ev.dataPagamento = new Date().toISOString().split('T')[0];
        }

        window.data.saveEvent(ev);

        this.fecharModal('modal-conta');
        window.app.showToast('Conta registrada: ' + desc);
        this.renderContasPagar();
    },

    pagarConta: function (contaId) {
        if (!window.data) return;
        window.data.events.forEach(function (ev) {
            if (ev.id === contaId && ev.type === 'CONTA_PAGAR') {
                ev.status = 'pago';
                ev.pago = true;
                ev.dataPagamento = new Date().toISOString().split('T')[0];
            }
        });
        window.data.save();
        window.app.showToast('Conta marcada como paga!');
        this.renderContasPagar();
    },

    renderContasPagar: function () {
        var container = document.getElementById('contas-pagar-content');
        if (!container || !window.data) return;

        var contas = window.data.events.filter(function (ev) {
            return ev.type === 'CONTA_PAGAR' && !ev.estornado;
        });

        var pendentes = contas.filter(function (c) { return c.status === 'pendente' && !c.pago; });
        var pagas = contas.filter(function (c) { return c.pago || c.status === 'pago'; });

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

        var vencidas30d = 0;
        var proximas30d = 0;
        var hoje = new Date();
        var em30dias = new Date();
        em30dias.setDate(em30dias.getDate() + 30);
        pendentes.forEach(function (c) {
            if (!c.vencimento) return;
            var venc = new Date(c.vencimento);
            if (venc < hoje) vencidas30d += (c.value || 0);
            else if (venc <= em30dias) proximas30d += (c.value || 0);
        });

        if (vencidas30d > 0 || proximas30d > 0) {
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">';
            if (vencidas30d > 0) {
                html += '<div style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:10px;padding:10px;text-align:center;">'
                    + '<div style="font-size:10px;font-weight:700;color:#DC2626;text-transform:uppercase;">Vencidas</div>'
                    + '<div style="font-size:16px;font-weight:800;color:#DC2626;">' + fmt(vencidas30d) + '</div>'
                    + '</div>';
            }
            if (proximas30d > 0) {
                html += '<div style="background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:10px;padding:10px;text-align:center;">'
                    + '<div style="font-size:10px;font-weight:700;color:#D97706;text-transform:uppercase;">Proximos 30d</div>'
                    + '<div style="font-size:16px;font-weight:800;color:#D97706;">' + fmt(proximas30d) + '</div>'
                    + '</div>';
            }
            html += '</div>';
        }

        if (pendentes.length > 0) {
            html += '<div class="section-title">Contas Pendentes</div>';
            pendentes.forEach(function (c) {
                var venc = c.vencimento ? new Date(c.vencimento) : null;
                var vencida = venc && venc < hoje;
                var catIcons = { nutricao: '🧂', sanidade: '💊', mao_obra: '👷', infraestrutura: '🔨', impostos: '🏛️', combustivel: '⛽', gado: '🐄', outro: '📌', estoque: '📦' };
                var vencStr = c.vencimento || 'Sem data';
                if (c.vencimento) {
                    var dp = c.vencimento.split('-');
                    if (dp.length === 3) vencStr = dp[2] + '/' + dp[1] + '/' + dp[0];
                }

                html += '<div class="history-card" style="' + (vencida ? 'border-left:3px solid #ef4444;' : '') + '">'
                    + '<div class="history-card-header">'
                    + '<span class="badge ' + (vencida ? 'badge-red' : 'badge-yellow') + '">'
                    + (catIcons[c.categoria] || '📌') + ' ' + (c.desc || c.nome || '--') + '</span>'
                    + '<span class="date">' + vencStr + '</span></div>'
                    + '<div class="history-card-body">'
                    + '<strong class="text-red">' + fmt(c.value) + '</strong>'
                    + (c.formaPagamento ? '<span style="font-size:10px;color:#64748B;margin-left:8px;">' + c.formaPagamento + '</span>' : '')
                    + '<div style="display:flex;gap:6px;margin-top:4px;">'
                    + '<button class="btn-sm" onclick="window.contas.pagarConta(\'' + c.id + '\')">Pagar</button>'
                    + '<button class="btn-sm" style="background:#64748B;" onclick="window.contas.estornarConta(\'' + c.id + '\')">Estornar</button>'
                    + '</div>'
                    + '</div></div>';
            });
        }

        if (pagas.length > 0) {
            html += '<div class="section-title" style="margin-top:16px;opacity:0.7;">Pagas (' + pagas.length + ')</div>';
            pagas.slice(-10).reverse().forEach(function (c) {
                var dateStr = c.dataPagamento || c.date || '';
                if (dateStr) {
                    var dp = dateStr.split('-');
                    if (dp.length === 3) dateStr = dp[2] + '/' + dp[1] + '/' + dp[0];
                }
                html += '<div class="history-card" style="opacity:0.6;">'
                    + '<div class="history-card-header">'
                    + '<span class="badge badge-green">' + (c.desc || c.nome || '--') + '</span>'
                    + '<span class="date">' + dateStr + '</span></div>'
                    + '<div class="history-card-body"><strong>' + fmt(c.value) + '</strong>'
                    + (c.formaPagamento ? '<span style="font-size:10px;color:#64748B;margin-left:8px;">' + c.formaPagamento + '</span>' : '')
                    + '</div></div>';
            });
        }

        html += '<button class="fab" onclick="window.contas.abrirContaPagar()">+</button>';

        container.innerHTML = html;
    },

    setPrecoArroba: function (preco) {
        localStorage.setItem('agromacro_preco_arroba', preco);
        window.app.showToast('Preco da @ atualizado: R$ ' + parseFloat(preco).toFixed(2));
    },

    getPrecoArroba: function () {
        return parseFloat(localStorage.getItem('agromacro_preco_arroba')) || 0;
    },

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

        var arrobasTotais = pesoTotal / 30;
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
            + '<div class="kpi-title">Valor do Rebanho em Pe</div>'
            + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">'
            + '<label style="font-size:13px;white-space:nowrap;">Preco @:</label>'
            + '<input type="number" id="input-preco-arroba" step="0.01" placeholder="280.00" '
            + 'value="' + (info.precoArroba || '') + '" '
            + 'style="flex:1;padding:8px;border:1px solid var(--border-subtle);border-radius:6px;font-size:14px;background:var(--bg-1);color:var(--text-0);" '
            + 'onchange="window.contas.setPrecoArroba(this.value); window.contas.renderCotacaoRebanho();">'
            + '</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Cabecas</div>'
            + '<div class="kpi-value">' + info.totalAnimais + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Medio</div>'
            + '<div class="kpi-value">' + info.pesoMedio.toFixed(0) + ' kg</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Total @</div>'
            + '<div class="kpi-value">' + info.arrobasTotais.toFixed(1) + '</div></div>'
            + '<div class="kpi-card" style="grid-column:span 2;"><div class="kpi-label">Valor Total do Rebanho</div>'
            + '<div class="kpi-value positive" style="font-size:24px;">' + fmt(info.valorRebanho) + '</div></div>'
            + '</div></div>';

        container.innerHTML = html;
    },

    estornarConta: function (contaId) {
        if (window.financeiro && window.financeiro.estornar) {
            window.financeiro.estornar(contaId);
            this.renderContasPagar();
        } else {
            window.app.showToast('Modulo financeiro nao disponivel.', 'error');
        }
    },

    fecharModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
};
