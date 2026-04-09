window.iaAuditoria = (function () {
    'use strict';

    var SCHEMA_VERSION = 1;
    var STORAGE_KEY = 'agromacro_anomalias_v' + SCHEMA_VERSION;

    function _media(arr) {
        if (!arr.length) return 0;
        return arr.reduce(function (s, v) { return s + v; }, 0) / arr.length;
    }

    function _desvioPadrao(arr) {
        if (arr.length < 2) return 0;
        var m = _media(arr);
        var soma = arr.reduce(function (s, v) { return s + Math.pow(v - m, 2); }, 0);
        return Math.sqrt(soma / arr.length);
    }

    function _extrairValor(ev) {
        var v = ev.totalValue || ev.value || ev.valor || ev.custoTotal || 0;
        return typeof v === 'string' ? parseFloat(v.replace(/[^\d.\-]/g, '')) || 0 : (v || 0);
    }

    function _formatarData(iso) {
        if (!iso) return '-';
        var d = new Date(iso);
        return d.toLocaleDateString('pt-BR');
    }

    function _formatarMoeda(v) {
        return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    var COT_CONFIG = {
        VALOR_ATIPICO: {
            causa: 'Valor monetario fora da faixa estatistica esperada (>2 desvios-padrao)',
            recomendacao: 'Verificar nota fiscal e confrontar com contratos vigentes'
        },
        GMD_ANOMALO: {
            causa: 'Ganho Medio Diario fora da faixa biologicamente viavel (0.3-2.5 kg/dia)',
            recomendacao: 'Revisar pesagens, verificar balanca e manejo nutricional'
        },
        CONTA_VENCIDA: {
            causa: 'Conta a pagar vencida ha mais de 30 dias sem baixa',
            recomendacao: 'Verificar com financeiro, priorizar pagamento ou renegociar'
        },
        ESTORNO_ALTO: {
            causa: 'Estorno ou cancelamento de valor elevado (>R$5.000)',
            recomendacao: 'Auditar motivo do estorno, verificar autorizacao'
        },
        MARGEM_NEGATIVA: {
            causa: 'Margem por arroba zerada ou negativa',
            recomendacao: 'Revisar custos de producao e preco de venda'
        },
        FORNECEDOR_CONCENTRADO: {
            causa: 'Mais de 80% das compras concentradas em um unico fornecedor',
            recomendacao: 'Diversificar fornecedores para reduzir risco'
        },
        ESTOQUE_EXCESSIVO: {
            causa: 'Item em estoque sem movimentacao ha mais de 12 meses',
            recomendacao: 'Avaliar destino do material: venda, doacao ou descarte'
        }
    };

    function _gerarCoT(anomalia) {
        var config = COT_CONFIG[anomalia.indicador] || {};
        return {
            passos: [
                '1. Identificar o evento: ' + (anomalia.tipo || anomalia.indicador),
                '2. Contexto: ' + (anomalia.descricao || ''),
                '3. Causa provavel: ' + (config.causa || 'A investigar'),
                '4. Severidade: ' + (anomalia.severidade || 'MEDIA'),
                '5. Recomendacao: ' + (config.recomendacao || 'Revisar manualmente')
            ],
            causa: config.causa || 'A investigar',
            recomendacao: config.recomendacao || 'Revisar manualmente'
        };
    }

    function _anomaliasGlobais(events) {
        var anomalias = [];
        var tipos = ['COMPRA', 'VENDA', 'CONTA_PAGAR', 'CONTA_RECEBER', 'OBRA_REGISTRO', 'ESTOQUE_ENTRADA'];

        tipos.forEach(function (tipo) {
            var evs = events.filter(function (e) { return e.type === tipo; });
            if (evs.length < 5) return;

            var valores = evs.map(_extrairValor).filter(function (v) { return v > 0; });
            if (valores.length < 5) return;

            var media = _media(valores);
            var dp = _desvioPadrao(valores);
            if (dp === 0) return;

            evs.forEach(function (ev) {
                var val = _extrairValor(ev);
                if (val > 0 && Math.abs(val - media) > 2 * dp) {
                    var desvios = ((val - media) / dp).toFixed(1);
                    anomalias.push({
                        id: 'AG-' + ev.id,
                        eventoId: ev.id,
                        tipo: tipo,
                        indicador: 'VALOR_ATIPICO',
                        severidade: Math.abs(val - media) > 3 * dp ? 'ALTA' : 'MEDIA',
                        descricao: tipo + ' de ' + _formatarMoeda(val) + ' (' + desvios + 'σ da media ' + _formatarMoeda(media) + ')',
                        valor: val,
                        media: media,
                        desvios: parseFloat(desvios),
                        data: ev.date || ev.timestamp,
                        status: 'PENDENTE',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });

        return anomalias;
    }

    function _anomaliasLocais(events) {
        var anomalias = [];

        var pesagens = events.filter(function (e) { return e.type === 'PESAGEM'; });
        pesagens.forEach(function (ev) {
            var gmd = ev.gmd || ev.GMD || 0;
            if (gmd > 0 && (gmd < 0.3 || gmd > 2.5)) {
                anomalias.push({
                    id: 'AL-GMD-' + ev.id,
                    eventoId: ev.id,
                    tipo: 'PESAGEM',
                    indicador: 'GMD_ANOMALO',
                    severidade: (gmd < 0 || gmd > 3) ? 'ALTA' : 'MEDIA',
                    descricao: 'GMD de ' + gmd.toFixed(2) + ' kg/dia (lote: ' + (ev.lote || '?') + ')',
                    valor: gmd,
                    data: ev.date || ev.timestamp,
                    status: 'PENDENTE',
                    timestamp: new Date().toISOString()
                });
            }
        });

        var hoje = new Date();
        var contas = events.filter(function (e) {
            return e.type === 'CONTA_PAGAR' && e.status !== 'PAGO' && e.status !== 'pago';
        });
        contas.forEach(function (ev) {
            var venc = ev.dueDate || ev.vencimento;
            if (!venc) return;
            var dVenc = new Date(venc);
            var diasAtraso = Math.floor((hoje - dVenc) / 86400000);
            if (diasAtraso > 30) {
                anomalias.push({
                    id: 'AL-VENC-' + ev.id,
                    eventoId: ev.id,
                    tipo: 'CONTA_PAGAR',
                    indicador: 'CONTA_VENCIDA',
                    severidade: diasAtraso > 90 ? 'ALTA' : 'MEDIA',
                    descricao: 'Conta vencida ha ' + diasAtraso + ' dias — ' + (ev.description || ev.descricao || '') + ' ' + _formatarMoeda(_extrairValor(ev)),
                    valor: _extrairValor(ev),
                    data: venc,
                    status: 'PENDENTE',
                    timestamp: new Date().toISOString()
                });
            }
        });

        var estornos = events.filter(function (e) {
            return (e.type === 'ESTORNO' || e.type === 'CANCELAMENTO') && _extrairValor(e) > 5000;
        });
        estornos.forEach(function (ev) {
            anomalias.push({
                id: 'AL-EST-' + ev.id,
                eventoId: ev.id,
                tipo: ev.type,
                indicador: 'ESTORNO_ALTO',
                severidade: 'ALTA',
                descricao: 'Estorno de ' + _formatarMoeda(_extrairValor(ev)) + ' — ' + (ev.description || ev.descricao || ''),
                valor: _extrairValor(ev),
                data: ev.date || ev.timestamp,
                status: 'PENDENTE',
                timestamp: new Date().toISOString()
            });
        });

        if (window.indicadores && window.indicadores.calcMargemArroba) {
            try {
                var margem = window.indicadores.calcMargemArroba();
                if (margem !== null && margem <= 0) {
                    anomalias.push({
                        id: 'AL-MARG-' + Date.now(),
                        eventoId: null,
                        tipo: 'INDICADOR',
                        indicador: 'MARGEM_NEGATIVA',
                        severidade: 'ALTA',
                        descricao: 'Margem por arroba: ' + _formatarMoeda(margem),
                        valor: margem,
                        data: new Date().toISOString(),
                        status: 'PENDENTE',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (e) { }
        }

        var compras = events.filter(function (e) { return e.type === 'COMPRA' || e.type === 'ESTOQUE_ENTRADA'; });
        if (compras.length >= 10) {
            var fornecedores = {};
            compras.forEach(function (e) {
                var f = e.fornecedor || e.supplier || 'desconhecido';
                fornecedores[f] = (fornecedores[f] || 0) + 1;
            });
            var total = compras.length;
            Object.keys(fornecedores).forEach(function (f) {
                var pct = (fornecedores[f] / total) * 100;
                if (pct > 80) {
                    anomalias.push({
                        id: 'AL-FORN-' + Date.now() + '-' + f.substr(0, 5),
                        eventoId: null,
                        tipo: 'COMPRA',
                        indicador: 'FORNECEDOR_CONCENTRADO',
                        severidade: 'MEDIA',
                        descricao: 'Fornecedor "' + f + '" concentra ' + pct.toFixed(0) + '% das compras (' + fornecedores[f] + '/' + total + ')',
                        valor: pct,
                        data: new Date().toISOString(),
                        status: 'PENDENTE',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }

        var estoqueEvs = events.filter(function (e) { return e.type === 'ESTOQUE_ENTRADA'; });
        var saidaEvs = events.filter(function (e) { return e.type === 'ESTOQUE_SAIDA' || e.type === 'ESTOQUE_USO'; });
        var itensEntrada = {};
        estoqueEvs.forEach(function (e) {
            var item = e.item || e.product || e.produto || '';
            if (item) {
                if (!itensEntrada[item]) itensEntrada[item] = { ultima: e.date || e.timestamp };
                itensEntrada[item].ultima = e.date || e.timestamp;
            }
        });
        saidaEvs.forEach(function (e) {
            var item = e.item || e.product || e.produto || '';
            if (item && itensEntrada[item]) {
                itensEntrada[item].usou = true;
            }
        });
        var limite12m = new Date();
        limite12m.setMonth(limite12m.getMonth() - 12);
        Object.keys(itensEntrada).forEach(function (item) {
            var info = itensEntrada[item];
            if (!info.usou && new Date(info.ultima) < limite12m) {
                anomalias.push({
                    id: 'AL-ESTQ-' + Date.now() + '-' + item.substr(0, 5),
                    eventoId: null,
                    tipo: 'ESTOQUE',
                    indicador: 'ESTOQUE_EXCESSIVO',
                    severidade: 'BAIXA',
                    descricao: 'Item "' + item + '" sem movimentacao desde ' + _formatarData(info.ultima),
                    valor: 0,
                    data: info.ultima,
                    status: 'PENDENTE',
                    timestamp: new Date().toISOString()
                });
            }
        });

        return anomalias;
    }

    function _carregarAnomalias() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) { return []; }
    }

    function _salvarAnomalia(anomalia) {
        var existentes = _carregarAnomalias();
        var idx = -1;
        for (var i = 0; i < existentes.length; i++) {
            if (existentes[i].id === anomalia.id) { idx = i; break; }
        }
        if (idx >= 0) {
            existentes[idx] = anomalia;
        } else {
            existentes.push(anomalia);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existentes));

        if (window.data) {
            var jaSalvaNoData = window.data.events.some(function (e) {
                return e.type === 'ANOMALIA' && e.anomaliaId === anomalia.id;
            });
            if (!jaSalvaNoData) {
                window.data.saveEvent({
                    type: 'ANOMALIA',
                    anomaliaId: anomalia.id,
                    indicador: anomalia.indicador,
                    severidade: anomalia.severidade,
                    descricao: anomalia.descricao,
                    status: anomalia.status,
                    valor: anomalia.valor,
                    date: anomalia.data
                });
            }
        }
    }

    function _jaSalva(id) {
        var existentes = _carregarAnomalias();
        return existentes.some(function (a) { return a.id === id; });
    }

    function _calcularIndicadores(events) {
        var hoje = new Date();
        var mesAtual = hoje.getMonth();
        var anoAtual = hoje.getFullYear();

        var receitaMes = 0, despesaMes = 0, contasPendentes = 0;

        events.forEach(function (ev) {
            var d = new Date(ev.date || ev.timestamp);
            var val = _extrairValor(ev);
            if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
                if (ev.type === 'VENDA' || ev.type === 'CONTA_RECEBER') receitaMes += val;
                if (ev.type === 'COMPRA' || ev.type === 'CONTA_PAGAR' || ev.type === 'ESTOQUE_ENTRADA' || ev.type === 'OBRA_REGISTRO') despesaMes += val;
            }
            if (ev.type === 'CONTA_PAGAR' && ev.status !== 'PAGO' && ev.status !== 'pago') contasPendentes++;
        });

        var saldo = receitaMes - despesaMes;
        var margem = receitaMes > 0 ? ((saldo / receitaMes) * 100) : 0;

        return {
            receitaMes: receitaMes,
            despesaMes: despesaMes,
            saldo: saldo,
            margem: margem,
            contasPendentes: contasPendentes
        };
    }

    function _renderKPIs(kpis) {
        var el = document.getElementById('auditoria-kpis');
        if (!el) return;
        el.innerHTML =
            '<div class="audit-kpi-grid">' +
                '<div class="audit-kpi-card">' +
                    '<div class="audit-kpi-label">Receita (mes)</div>' +
                    '<div class="audit-kpi-value" style="color:#22C55E;">' + _formatarMoeda(kpis.receitaMes) + '</div>' +
                '</div>' +
                '<div class="audit-kpi-card">' +
                    '<div class="audit-kpi-label">Despesa (mes)</div>' +
                    '<div class="audit-kpi-value" style="color:#EF4444;">' + _formatarMoeda(kpis.despesaMes) + '</div>' +
                '</div>' +
                '<div class="audit-kpi-card">' +
                    '<div class="audit-kpi-label">Saldo</div>' +
                    '<div class="audit-kpi-value" style="color:' + (kpis.saldo >= 0 ? '#22C55E' : '#EF4444') + ';">' + _formatarMoeda(kpis.saldo) + '</div>' +
                '</div>' +
                '<div class="audit-kpi-card">' +
                    '<div class="audit-kpi-label">Margem</div>' +
                    '<div class="audit-kpi-value">' + kpis.margem.toFixed(1) + '%</div>' +
                '</div>' +
            '</div>';
    }

    function _renderCard(anomalia) {
        var cot = _gerarCoT(anomalia);
        var corSev = { ALTA: '#EF4444', MEDIA: '#FBBF24', BAIXA: '#3B82F6' };
        var cor = corSev[anomalia.severidade] || '#888';
        var statusLabel = anomalia.status === 'APROVADO' ? '✅ Aprovado' :
                          anomalia.status === 'REJEITADO' ? '❌ Rejeitado' : '⏳ Pendente';

        var botoes = '';
        if (anomalia.status === 'PENDENTE') {
            botoes =
                '<div class="audit-card-actions">' +
                    '<button class="audit-btn audit-btn-approve" onclick="window.iaAuditoria.aprovarAnomalia(\'' + anomalia.id + '\')">✅ Aprovar</button>' +
                    '<button class="audit-btn audit-btn-reject" onclick="window.iaAuditoria.rejeitarAnomalia(\'' + anomalia.id + '\')">❌ Rejeitar</button>' +
                    '<button class="audit-btn audit-btn-ia" onclick="window.iaAuditoria.analisarComIA(\'' + anomalia.id + '\')">🤖 Analisar com IA</button>' +
                '</div>';
        }

        return '<div class="audit-card" style="border-left:4px solid ' + cor + ';">' +
            '<div class="audit-card-header">' +
                '<span class="audit-badge" style="background:' + cor + ';">' + anomalia.severidade + '</span>' +
                '<span class="audit-card-date">' + _formatarData(anomalia.data) + '</span>' +
                '<span class="audit-card-status">' + statusLabel + '</span>' +
            '</div>' +
            '<div class="audit-card-indicator">' + anomalia.indicador.replace(/_/g, ' ') + '</div>' +
            '<div class="audit-card-desc">' + anomalia.descricao + '</div>' +
            '<details class="audit-cot">' +
                '<summary>Ver raciocinio (Chain-of-Thought)</summary>' +
                '<ol class="audit-cot-steps">' +
                    cot.passos.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
                '</ol>' +
                '<div class="audit-cot-rec"><strong>Recomendacao:</strong> ' + cot.recomendacao + '</div>' +
            '</details>' +
            botoes +
        '</div>';
    }

    function executarAuditoria() {
        var events = (window.data && window.data.events) || [];
        if (events.length === 0) return;

        var globais = _anomaliasGlobais(events);
        var locais = _anomaliasLocais(events);
        var todas = globais.concat(locais);

        var novas = 0;
        todas.forEach(function (a) {
            if (!_jaSalva(a.id)) {
                _salvarAnomalia(a);
                novas++;
            }
        });

        renderView();

        if (window.app && window.app.showToast) {
            if (novas > 0) {
                window.app.showToast(novas + ' nova(s) anomalia(s) detectada(s)', 'warning');
            } else if (todas.length === 0) {
                window.app.showToast('Nenhuma anomalia encontrada', 'success');
            }
        }
    }

    function renderView() {
        var listaEl = document.getElementById('auditoria-lista');
        if (!listaEl) return;

        var events = (window.data && window.data.events) || [];
        var kpis = _calcularIndicadores(events);
        _renderKPIs(kpis);

        var anomalias = _carregarAnomalias();
        anomalias.sort(function (a, b) {
            var ordem = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
            var statusOrdem = { PENDENTE: 0, APROVADO: 1, REJEITADO: 2 };
            var sa = statusOrdem[a.status] || 0;
            var sb = statusOrdem[b.status] || 0;
            if (sa !== sb) return sa - sb;
            return (ordem[a.severidade] || 2) - (ordem[b.severidade] || 2);
        });

        var statusEl = document.getElementById('auditoria-status');
        if (statusEl) {
            var pendentes = anomalias.filter(function (a) { return a.status === 'PENDENTE'; }).length;
            var aprovados = anomalias.filter(function (a) { return a.status === 'APROVADO'; }).length;
            var rejeitados = anomalias.filter(function (a) { return a.status === 'REJEITADO'; }).length;
            statusEl.innerHTML =
                '<div class="audit-status-bar">' +
                    '<span>Total: <strong>' + anomalias.length + '</strong></span>' +
                    '<span style="color:#FBBF24;">⏳ ' + pendentes + ' pendente(s)</span>' +
                    '<span style="color:#22C55E;">✅ ' + aprovados + ' aprovado(s)</span>' +
                    '<span style="color:#EF4444;">❌ ' + rejeitados + ' rejeitado(s)</span>' +
                '</div>';
        }

        if (anomalias.length === 0) {
            listaEl.innerHTML =
                '<div class="audit-empty">' +
                    '<div class="audit-empty-icon">🛡</div>' +
                    '<p>Nenhuma anomalia encontrada.</p>' +
                    '<p class="audit-empty-sub">Os dados financeiros estao dentro dos parametros esperados.</p>' +
                '</div>';
            return;
        }

        listaEl.innerHTML = anomalias.map(_renderCard).join('');
    }

    function _atualizarStatus(id, novoStatus) {
        var anomalias = _carregarAnomalias();
        for (var i = 0; i < anomalias.length; i++) {
            if (anomalias[i].id === id) {
                anomalias[i].status = novoStatus;
                anomalias[i].revisadoEm = new Date().toISOString();
                anomalias[i].revisadoPor = (window.firebaseSync && window.firebaseSync.user) ? window.firebaseSync.user.email : 'offline';
                break;
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(anomalias));

        if (window.data) {
            var evAnomalia = window.data.events.filter(function (e) {
                return e.type === 'ANOMALIA' && e.anomaliaId === id;
            });
            evAnomalia.forEach(function (e) { e.status = novoStatus; });
            window.data.save();
        }

        renderView();
        if (window.app) window.app.renderAlerts();
    }

    function aprovarAnomalia(id) { _atualizarStatus(id, 'APROVADO'); }
    function rejeitarAnomalia(id) { _atualizarStatus(id, 'REJEITADO'); }

    function analisarComIA(id) {
        var anomalias = _carregarAnomalias();
        var anomalia = null;
        for (var i = 0; i < anomalias.length; i++) {
            if (anomalias[i].id === id) { anomalia = anomalias[i]; break; }
        }
        if (!anomalia) return;

        var cot = _gerarCoT(anomalia);
        var prompt =
            'Analise esta anomalia financeira detectada na auditoria automatica:\n\n' +
            'Indicador: ' + anomalia.indicador + '\n' +
            'Severidade: ' + anomalia.severidade + '\n' +
            'Descricao: ' + anomalia.descricao + '\n' +
            'Valor: ' + _formatarMoeda(anomalia.valor) + '\n' +
            'Data: ' + _formatarData(anomalia.data) + '\n\n' +
            'Raciocinio (CoT):\n' + cot.passos.join('\n') + '\n\n' +
            'Recomendacao inicial: ' + cot.recomendacao + '\n\n' +
            'Por favor, analise esta anomalia e forneca:\n' +
            '1. Se voce concorda que e uma anomalia real\n' +
            '2. Possiveis causas adicionais\n' +
            '3. Acoes recomendadas';

        if (window.iaConsultor && window.iaConsultor.abrirChat) {
            window.iaConsultor.abrirChat(prompt);
        } else if (window.app) {
            window.app.showToast('IA Consultor nao disponivel', 'warning');
        }
    }

    return {
        SCHEMA_VERSION: SCHEMA_VERSION,
        init: function () { console.log('[IA Auditoria] Modulo inicializado'); },
        executarAuditoria: executarAuditoria,
        renderView: renderView,
        aprovarAnomalia: aprovarAnomalia,
        rejeitarAnomalia: rejeitarAnomalia,
        analisarComIA: analisarComIA
    };
})();
