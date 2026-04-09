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
        renderDashboardHistorico();
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

    function exportarRelatorio(modo) {
        modo = modo || 'print';
        var anomalias = _carregarAnomalias();
        var events = (window.data && window.data.events) || [];
        var kpis = _calcularIndicadores(events);

        var config = JSON.parse(localStorage.getItem('agromacro_config') || '{}');
        var nomeFazenda = config.nomeFazenda || 'Fazenda';
        var proprietario = config.proprietario || '';
        var cidade = config.cidade || '';
        var estado = config.estado || '';
        var hoje = new Date();
        var dataRelatorio = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        var pendentes = anomalias.filter(function (a) { return a.status === 'PENDENTE'; });
        var aprovados = anomalias.filter(function (a) { return a.status === 'APROVADO'; });
        var rejeitados = anomalias.filter(function (a) { return a.status === 'REJEITADO'; });

        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<title>Relatorio de Auditoria - ' + nomeFazenda + '</title>' +
            '<style>' +
            'body{font-family:"Inter","Segoe UI",sans-serif;color:#1a1a1a;max-width:800px;margin:0 auto;padding:20px;font-size:13px;}' +
            'h1{color:#7C3AED;border-bottom:3px solid #7C3AED;padding-bottom:8px;font-size:22px;}' +
            'h2{color:#1E3A5F;margin-top:24px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:4px;}' +
            '.header-info{display:flex;justify-content:space-between;margin:8px 0 20px;font-size:12px;color:#666;}' +
            '.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0;}' +
            '.kpi{background:#f1f5f9;border-radius:8px;padding:10px;text-align:center;}' +
            '.kpi-label{font-size:10px;color:#666;text-transform:uppercase;}' +
            '.kpi-value{font-size:18px;font-weight:700;margin-top:4px;}' +
            'table{width:100%;border-collapse:collapse;margin:10px 0;}' +
            'th{background:#7C3AED;color:white;padding:8px 10px;text-align:left;font-size:12px;}' +
            'td{padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;}' +
            'tr:nth-child(even){background:#f8f9fa;}' +
            '.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;}' +
            '.badge-alta{background:#fee2e2;color:#991b1b;}' +
            '.badge-media{background:#fef9c3;color:#854d0e;}' +
            '.badge-baixa{background:#dbeafe;color:#1e40af;}' +
            '.positive{color:#16a34a;}.negative{color:#dc2626;}' +
            '.summary-box{background:#f8f7ff;border:1px solid #e9e5f5;border-radius:8px;padding:12px;margin:10px 0;}' +
            '.cot-section{background:#f9fafb;border-left:3px solid #7C3AED;padding:8px 12px;margin:6px 0;font-size:11px;}' +
            '.footer{margin-top:30px;text-align:center;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px;}' +
            '.no-print{margin:15px 0;}' +
            '.btn-print{background:#7C3AED;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px;}' +
            '.btn-print:hover{background:#6D28D9;}' +
            '@media print{.no-print{display:none !important;}body{padding:0;}}' +
            '</style></head><body>';

        html += '<h1>🛡 ' + nomeFazenda + ' — Relatorio de Auditoria</h1>';
        html += '<div class="header-info">';
        html += '<span>' + (proprietario ? proprietario + ' | ' : '') + (cidade ? cidade + '/' + estado : '') + '</span>';
        html += '<span>Emitido em: ' + dataRelatorio + '</span>';
        html += '</div>';

        html += '<div class="no-print">';
        html += '<button class="btn-print" onclick="window.print()">🖨 Imprimir</button>';
        html += '<button class="btn-print" style="background:#059669;" onclick="window.iaAuditoria._exportarJSON()">📥 Exportar JSON</button>';
        html += '</div>';

        html += '<h2>Indicadores do Mes</h2>';
        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Receita</div><div class="kpi-value positive">' + _formatarMoeda(kpis.receitaMes) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Despesa</div><div class="kpi-value negative">' + _formatarMoeda(kpis.despesaMes) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-value ' + (kpis.saldo >= 0 ? 'positive' : 'negative') + '">' + _formatarMoeda(kpis.saldo) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-value">' + kpis.margem.toFixed(1) + '%</div></div>';
        html += '</div>';

        html += '<div class="summary-box">';
        html += '<strong>Resumo da Auditoria:</strong> ' + anomalias.length + ' anomalia(s) detectada(s) — ';
        html += pendentes.length + ' pendente(s), ' + aprovados.length + ' aprovada(s), ' + rejeitados.length + ' rejeitada(s)';
        html += '</div>';

        if (anomalias.length > 0) {
            html += '<h2>Anomalias Detectadas</h2>';
            html += '<table><thead><tr>';
            html += '<th>Sev.</th><th>Indicador</th><th>Descricao</th><th>Valor</th><th>Data</th><th>Status</th><th>Revisor</th>';
            html += '</tr></thead><tbody>';

            anomalias.forEach(function (a) {
                var badgeClass = a.severidade === 'ALTA' ? 'badge-alta' : a.severidade === 'MEDIA' ? 'badge-media' : 'badge-baixa';
                html += '<tr>';
                html += '<td><span class="badge ' + badgeClass + '">' + a.severidade + '</span></td>';
                html += '<td>' + a.indicador.replace(/_/g, ' ') + '</td>';
                html += '<td>' + a.descricao + '</td>';
                html += '<td>' + _formatarMoeda(a.valor) + '</td>';
                html += '<td>' + _formatarData(a.data) + '</td>';
                html += '<td>' + a.status + '</td>';
                html += '<td>' + (a.revisadoPor || '-') + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';

            html += '<h2>Raciocinio por Anomalia (Chain-of-Thought)</h2>';
            anomalias.forEach(function (a, idx) {
                var cot = _gerarCoT(a);
                html += '<div class="cot-section">';
                html += '<strong>' + (idx + 1) + '. ' + a.indicador.replace(/_/g, ' ') + '</strong><br>';
                cot.passos.forEach(function (p) { html += p + '<br>'; });
                html += '<em>Recomendacao: ' + cot.recomendacao + '</em>';
                html += '</div>';
            });
        }

        var auditLog = (window.data && window.data.getAuditLog) ? window.data.getAuditLog() : [];
        if (auditLog.length > 0) {
            html += '<h2>Trilha de Auditoria (ultimos 50 eventos)</h2>';
            html += '<table><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Evento ID</th><th>Usuario</th></tr></thead><tbody>';
            auditLog.slice(-50).reverse().forEach(function (log) {
                html += '<tr>';
                html += '<td>' + _formatarData(log.timestamp) + '</td>';
                html += '<td>' + (log.tipo || '-') + '</td>';
                html += '<td style="font-family:monospace;font-size:10px;">' + (log.eventoId || '-') + '</td>';
                html += '<td>' + (log.usuario || 'offline') + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        }

        html += '<div class="footer">AgroMacro — Auditoria Automatizada com IA | Gerado em ' + dataRelatorio + '</div>';
        html += '</body></html>';

        var win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.iaAuditoria = { _exportarJSON: _exportarJSON };
            if (modo === 'print') {
                setTimeout(function () { win.print(); }, 500);
            }
        } else if (window.app) {
            window.app.showToast('Pop-up bloqueado. Libere pop-ups para gerar o relatorio.', 'error');
        }
    }

    function _exportarJSON() {
        var anomalias = _carregarAnomalias();
        var auditLog = (window.data && window.data.getAuditLog) ? window.data.getAuditLog() : [];
        var events = (window.data && window.data.events) || [];
        var kpis = _calcularIndicadores(events);

        var payload = {
            versao: SCHEMA_VERSION,
            geradoEm: new Date().toISOString(),
            fazenda: JSON.parse(localStorage.getItem('agromacro_config') || '{}').nomeFazenda || 'Fazenda',
            indicadores: kpis,
            anomalias: anomalias,
            auditLog: auditLog.slice(-200)
        };

        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'auditoria_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function renderDashboardHistorico() {
        var listaEl = document.getElementById('auditoria-lista');
        if (!listaEl) return;

        var anomalias = _carregarAnomalias();
        if (anomalias.length === 0) return;

        var porMes = {};
        anomalias.forEach(function (a) {
            var d = new Date(a.timestamp || a.data);
            var chave = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            if (!porMes[chave]) porMes[chave] = { total: 0, alta: 0, media: 0, baixa: 0, aprovados: 0, rejeitados: 0, pendentes: 0 };
            porMes[chave].total++;
            if (a.severidade === 'ALTA') porMes[chave].alta++;
            else if (a.severidade === 'MEDIA') porMes[chave].media++;
            else porMes[chave].baixa++;
            if (a.status === 'APROVADO') porMes[chave].aprovados++;
            else if (a.status === 'REJEITADO') porMes[chave].rejeitados++;
            else porMes[chave].pendentes++;
        });

        var meses = Object.keys(porMes).sort();
        var maxTotal = Math.max.apply(null, meses.map(function (m) { return porMes[m].total; }));

        var porIndicador = {};
        anomalias.forEach(function (a) {
            var ind = a.indicador || 'OUTRO';
            porIndicador[ind] = (porIndicador[ind] || 0) + 1;
        });

        var indicadores = Object.keys(porIndicador).sort(function (a, b) { return porIndicador[b] - porIndicador[a]; });
        var coresIndicador = {
            VALOR_ATIPICO: '#EF4444', GMD_ANOMALO: '#F59E0B', CONTA_VENCIDA: '#8B5CF6',
            ESTORNO_ALTO: '#EC4899', MARGEM_NEGATIVA: '#DC2626', FORNECEDOR_CONCENTRADO: '#F97316',
            ESTOQUE_EXCESSIVO: '#6366F1'
        };

        var html = '<div style="margin-top:16px;margin-bottom:16px;">';
        html += '<h3 style="font-size:15px;color:var(--text-0);margin:0 0 12px;">Historico de Anomalias</h3>';

        html += '<div style="display:flex;gap:4px;align-items:flex-end;height:120px;margin-bottom:8px;">';
        meses.forEach(function (m) {
            var d = porMes[m];
            var h = maxTotal > 0 ? Math.round((d.total / maxTotal) * 100) : 0;
            var cor = d.alta > 0 ? '#EF4444' : d.media > 0 ? '#FBBF24' : '#3B82F6';
            html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">';
            html += '<span style="font-size:10px;font-weight:600;color:var(--text-1);">' + d.total + '</span>';
            html += '<div style="width:100%;height:' + Math.max(h, 4) + 'px;background:' + cor + ';border-radius:4px 4px 0 0;"></div>';
            html += '<span style="font-size:9px;color:var(--text-2);">' + m.split('-')[1] + '/' + m.split('-')[0].substr(2) + '</span>';
            html += '</div>';
        });
        html += '</div>';

        html += '<h3 style="font-size:15px;color:var(--text-0);margin:16px 0 8px;">Por Tipo de Anomalia</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:6px;">';
        indicadores.forEach(function (ind) {
            var count = porIndicador[ind];
            var pct = Math.round((count / anomalias.length) * 100);
            var cor = coresIndicador[ind] || '#64748B';
            html += '<div style="display:flex;align-items:center;gap:8px;">';
            html += '<span style="font-size:11px;color:var(--text-1);min-width:140px;">' + ind.replace(/_/g, ' ') + '</span>';
            html += '<div style="flex:1;height:16px;background:var(--bg-0);border-radius:4px;overflow:hidden;">';
            html += '<div style="width:' + pct + '%;height:100%;background:' + cor + ';border-radius:4px;"></div>';
            html += '</div>';
            html += '<span style="font-size:11px;font-weight:600;color:var(--text-0);min-width:30px;text-align:right;">' + count + '</span>';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';

        var existingDash = document.getElementById('auditoria-dashboard');
        if (existingDash) {
            existingDash.innerHTML = html;
        } else {
            var dashDiv = document.createElement('div');
            dashDiv.id = 'auditoria-dashboard';
            dashDiv.innerHTML = html;
            listaEl.parentNode.insertBefore(dashDiv, listaEl);
        }
    }

    function syncAuditLogToFirestore() {
        if (!window.firebaseSync || !window.firebaseSync.db || !window.firebaseSync.fazendaId || !window.firebaseSync.user) return;

        var auditLog = (window.data && window.data.getAuditLog) ? window.data.getAuditLog() : [];
        if (auditLog.length === 0) return;

        var db = window.firebaseSync.db;
        var fazendaId = window.firebaseSync.fazendaId;
        var ref = db.collection('fazendas').doc(fazendaId).collection('audit_log');

        var batch = db.batch();
        var ultimos = auditLog.slice(-100);

        ultimos.forEach(function (log) {
            var docId = 'AL-' + (log.eventoId || Date.now()) + '-' + (log.timestamp || '').replace(/[^0-9]/g, '').substr(0, 14);
            batch.set(ref.doc(docId), log, { merge: true });
        });

        batch.commit().then(function () {
            console.log('[Auditoria] AuditLog sincronizado com Firestore (' + ultimos.length + ' registros)');
        }).catch(function (err) {
            console.warn('[Auditoria] Falha ao sincronizar AuditLog:', err);
        });

        var anomalias = _carregarAnomalias();
        if (anomalias.length > 0) {
            var refAnom = db.collection('fazendas').doc(fazendaId).collection('anomalias');
            var batchAnom = db.batch();
            anomalias.forEach(function (a) {
                batchAnom.set(refAnom.doc(a.id), a, { merge: true });
            });
            batchAnom.commit().then(function () {
                console.log('[Auditoria] Anomalias sincronizadas com Firestore (' + anomalias.length + ')');
            }).catch(function (err) {
                console.warn('[Auditoria] Falha ao sincronizar anomalias:', err);
            });
        }
    }

    function limparAnomalias() {
        if (!confirm('Tem certeza que deseja limpar todas as anomalias? Esta acao nao pode ser desfeita.')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderView();
        if (window.app && window.app.showToast) {
            window.app.showToast('Anomalias limpas com sucesso', 'success');
        }
    }

    return {
        SCHEMA_VERSION: SCHEMA_VERSION,
        init: function () { console.log('[IA Auditoria] Modulo inicializado'); },
        executarAuditoria: executarAuditoria,
        renderView: renderView,
        aprovarAnomalia: aprovarAnomalia,
        rejeitarAnomalia: rejeitarAnomalia,
        analisarComIA: analisarComIA,
        exportarRelatorio: exportarRelatorio,
        _exportarJSON: _exportarJSON,
        renderDashboardHistorico: renderDashboardHistorico,
        syncAuditLogToFirestore: syncAuditLogToFirestore,
        limparAnomalias: limparAnomalias
    };
})();
