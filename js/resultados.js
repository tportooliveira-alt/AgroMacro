// ====== MÓDULO: RESULTADOS DA FAZENDA ======
// Painel de resultado direto na HOME — o que dá dinheiro e o que gasta
// Puxa dados de indicadores.js, financeiro.js, lotes.js
window.resultados = {

    init: function () {
        console.log('Resultados module ready');
    },

    // Renderizar o painel de resultados na home
    renderDashboard: function () {
        var container = document.getElementById('resultados-dashboard');
        if (!container) return;
        if (!window.indicadores || !window.data) {
            container.innerHTML = '';
            return;
        }

        var lotes = window.indicadores.getActiveLotes();
        if (lotes.length === 0) {
            container.innerHTML = '<div class="res-empty">Cadastre lotes para ver resultados da fazenda</div>';
            return;
        }

        var html = '';

        // ══════════════════════════════════════════════════════
        // 1) PREVISÃO DE ABATE — Quando cada lote atinge peso ideal
        // ══════════════════════════════════════════════════════
        html += '<div class="res-section">';
        html += '<div class="res-section-title">🎯 Previsão de Venda</div>';

        var temPrevisao = false;
        lotes.forEach(function (lote) {
            var prev = window.indicadores.previsaoAbate(lote, 480); // 480kg = boi gordo
            if (prev && prev.diasRestantes !== null && prev.diasRestantes !== undefined) {
                temPrevisao = true;
                var pesoAtual = lote.pesoMedio || 0;
                var progresso = Math.min(100, Math.round((pesoAtual / 480) * 100));
                var urgencia = prev.diasRestantes <= 30 ? 'res-urgent' : prev.diasRestantes <= 90 ? 'res-soon' : '';
                var dataAbate = prev.dataEstimada ? new Date(prev.dataEstimada).toLocaleDateString('pt-BR') : '—';

                html += '<div class="res-lot-card ' + urgencia + '">';
                html += '<div class="res-lot-header">';
                html += '<span class="res-lot-name">🐂 ' + (lote.nome || 'Lote') + '</span>';
                html += '<span class="res-lot-qty">' + (lote.qtdAnimais || 0) + ' cab</span>';
                html += '</div>';

                // Barra de progresso de peso
                html += '<div class="res-progress-container">';
                html += '<div class="res-progress-bar" style="width:' + progresso + '%"></div>';
                html += '</div>';
                html += '<div class="res-progress-labels">';
                html += '<span>' + pesoAtual.toFixed(0) + ' kg</span>';
                html += '<span>Meta: 480 kg</span>';
                html += '</div>';

                // Info cards
                html += '<div class="res-lot-info">';
                if (prev.diasRestantes <= 0) {
                    html += '<div class="res-info-item res-ready"><span class="res-info-value">PRONTO!</span><span class="res-info-label">P/ VENDA</span></div>';
                } else {
                    html += '<div class="res-info-item"><span class="res-info-value">' + prev.diasRestantes + ' dias</span><span class="res-info-label">p/ venda</span></div>';
                }
                html += '<div class="res-info-item"><span class="res-info-value">' + dataAbate + '</span><span class="res-info-label">Estimativa</span></div>';

                var gmd = window.indicadores.calcGMD(lote);
                var gmdVal = typeof gmd === 'number' ? gmd : (gmd && typeof gmd.valor === 'number' ? gmd.valor : parseFloat(gmd) || 0);
                if (gmdVal) {
                    html += '<div class="res-info-item"><span class="res-info-value">' + gmdVal.toFixed(3) + '</span><span class="res-info-label">GMD kg/dia</span></div>';
                }
                html += '</div>';
                html += '</div>';
            }
        });

        if (!temPrevisao) {
            html += '<div class="res-no-data">Informe peso médio e data de entrada dos lotes para ver projeções</div>';
        }
        html += '</div>';

        // ══════════════════════════════════════════════════════
        // 2) CUSTO POR ARROBA — O quanto custa produzir cada @
        // ══════════════════════════════════════════════════════
        html += '<div class="res-section">';
        html += '<div class="res-section-title">💰 Custo Real por Arroba</div>';

        var temCusto = false;
        lotes.forEach(function (lote) {
            var custoArr = window.indicadores.calcCustoArrobaProduzida(lote);
            if (custoArr && custoArr > 0) {
                temCusto = true;
                var margem = window.indicadores.calcMargemArroba();
                var custoTotal = window.indicadores.getCustoPorLote(lote);
                var custoCab = window.indicadores.calcCustoCabDia(lote);

                html += '<div class="res-cost-card">';
                html += '<div class="res-lot-header">';
                html += '<span class="res-lot-name">🐂 ' + (lote.nome || 'Lote') + '</span>';
                html += '</div>';
                html += '<div class="res-cost-grid">';
                html += '<div class="res-cost-item">';
                html += '<span class="res-cost-value">R$ ' + custoArr.toFixed(2) + '</span>';
                html += '<span class="res-cost-label">Custo/@</span>';
                html += '</div>';
                if (custoCab) {
                    html += '<div class="res-cost-item">';
                    html += '<span class="res-cost-value">R$ ' + custoCab.toFixed(2) + '</span>';
                    html += '<span class="res-cost-label">Custo/cab/dia</span>';
                    html += '</div>';
                }
                if (custoTotal && custoTotal.total > 0) {
                    html += '<div class="res-cost-item">';
                    html += '<span class="res-cost-value">R$ ' + (custoTotal.total / 1000).toFixed(1) + 'k</span>';
                    html += '<span class="res-cost-label">Gasto total</span>';
                    html += '</div>';
                }
                html += '</div>';

                // Breakdown de custos
                if (custoTotal && custoTotal.total > 0) {
                    html += '<div class="res-breakdown">';
                    var cats = [
                        { label: 'Nutrição', val: custoTotal.nutricao || 0, color: '#10B981' },
                        { label: 'Sanitário', val: custoTotal.sanitario || 0, color: '#3B82F6' },
                        { label: 'Insumos', val: custoTotal.insumos || 0, color: '#F59E0B' },
                        { label: 'Outros', val: custoTotal.outros || 0, color: '#8B5CF6' }
                    ];
                    cats.forEach(function (c) {
                        if (c.val > 0) {
                            var pct = Math.round((c.val / custoTotal.total) * 100);
                            html += '<div class="res-break-item">';
                            html += '<div class="res-break-bar" style="width:' + pct + '%;background:' + c.color + '"></div>';
                            html += '<span class="res-break-label">' + c.label + ' ' + pct + '%</span>';
                            html += '</div>';
                        }
                    });
                    html += '</div>';
                }
                html += '</div>';
            }
        });

        if (!temCusto) {
            // Show general cost summary
            var margem = window.indicadores.calcMargemArroba();
            if (margem) {
                html += '<div class="res-cost-card">';
                html += '<div class="res-cost-grid">';
                html += '<div class="res-cost-item">';
                html += '<span class="res-cost-value">R$ ' + margem.custoMedio.toFixed(2) + '</span>';
                html += '<span class="res-cost-label">Custo médio/@</span>';
                html += '</div>';
                html += '<div class="res-cost-item">';
                html += '<span class="res-cost-value">R$ ' + margem.precoVenda.toFixed(2) + '</span>';
                html += '<span class="res-cost-label">Preço venda/@</span>';
                html += '</div>';
                html += '<div class="res-cost-item ' + (margem.margem >= 0 ? 'res-positive' : 'res-negative') + '">';
                html += '<span class="res-cost-value">R$ ' + margem.margem.toFixed(2) + '</span>';
                html += '<span class="res-cost-label">Margem/@</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            } else {
                html += '<div class="res-no-data">Registre compras e vendas para ver custo por arroba</div>';
            }
        }
        html += '</div>';

        // ══════════════════════════════════════════════════════
        // 3) PROJEÇÃO DE RECEITA — Quanto vai faturar
        // ══════════════════════════════════════════════════════
        var projecao = window.indicadores.calcProjecaoReceita();
        if (projecao && projecao.lotes && projecao.lotes.length > 0) {
            html += '<div class="res-section">';
            html += '<div class="res-section-title">📈 Projeção de Receita</div>';
            html += '<div class="res-revenue-card">';
            html += '<div class="res-revenue-total">';
            html += '<span class="res-revenue-value">R$ ' + (projecao.totalProjetado / 1000).toFixed(0) + ' mil</span>';
            html += '<span class="res-revenue-label">Receita projetada total</span>';
            html += '</div>';
            html += '<div class="res-revenue-details">';
            projecao.lotes.forEach(function (l) {
                html += '<div class="res-rev-item">';
                html += '<span>' + l.nome + '</span>';
                html += '<span class="res-rev-val">R$ ' + (l.receitaProjetada / 1000).toFixed(0) + 'k</span>';
                html += '</div>';
            });
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }

        // ══════════════════════════════════════════════════════
        // 4) RESUMO FINANCEIRO RÁPIDO
        // ══════════════════════════════════════════════════════
        var events = window.data.events;
        var totalCompras = 0, totalVendas = 0, totalDespesas = 0;
        events.forEach(function (ev) {
            if (ev.estornado) return;
            if (ev.type === 'COMPRA') totalCompras += (ev.value || 0);
            if (ev.type === 'VENDA') totalVendas += (ev.value || 0);
            if (ev.type === 'CONTA_PAGAR' && ev.pago) totalDespesas += (ev.value || 0);
            if (ev.type === 'ESTOQUE_ENTRADA') totalDespesas += (ev.value || 0);
            if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && (ev.cost || ev.custo)) totalDespesas += (ev.cost || ev.custo || 0);
            if (ev.type === 'OBRA_REGISTRO') totalDespesas += (ev.value || ev.custo || 0);
        });

        if (totalCompras > 0 || totalVendas > 0) {
            var resultado = totalVendas - totalCompras - totalDespesas;
            html += '<div class="res-section">';
            html += '<div class="res-section-title">📊 Resultado Financeiro</div>';
            html += '<div class="res-finance-card">';
            html += '<div class="res-fin-row"><span>Vendas</span><span class="res-positive">+ R$ ' + (totalVendas / 1000).toFixed(1) + 'k</span></div>';
            html += '<div class="res-fin-row"><span>Compras</span><span class="res-negative">- R$ ' + (totalCompras / 1000).toFixed(1) + 'k</span></div>';
            if (totalDespesas > 0) {
                html += '<div class="res-fin-row"><span>Despesas</span><span class="res-negative">- R$ ' + (totalDespesas / 1000).toFixed(1) + 'k</span></div>';
            }
            html += '<div class="res-fin-total ' + (resultado >= 0 ? 'res-positive' : 'res-negative') + '">';
            html += '<span>Resultado</span><span>R$ ' + (resultado / 1000).toFixed(1) + 'k</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }

        container.innerHTML = html;
    }
};
