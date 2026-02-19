// ====== MÓDULO: FINANCEIRO (Compra/Venda + Fluxo de Caixa + Estorno) ======
// AUDITADO: Inclui CONTA_PAGAR, OBRA_REGISTRO, MANEJO_SANITARIO, FUNCIONARIO
window.financeiro = {
    init: function () {
        console.log('Financeiro Module Ready');
        this.bindForms();
    },

    bindForms: function () {
        var formCompra = document.getElementById('form-compra');
        if (formCompra) {
            formCompra.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveCompra();
            });
        }

        var formVenda = document.getElementById('form-venda');
        if (formVenda) {
            formVenda.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveVenda();
            });
        }
    },

    saveCompra: function () {
        var qty = parseInt(document.getElementById('compra-qty').value) || 0;
        var peso = parseFloat(document.getElementById('compra-peso').value) || 0;
        var valor = parseFloat(document.getElementById('compra-valor').value) || 0;
        var desc = document.getElementById('compra-desc').value;
        var fornecedor = document.getElementById('compra-fornecedor').value;
        var lote = document.getElementById('compra-lote').value;
        var data = document.getElementById('compra-data').value;

        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }

        var custoCabeca = qty > 0 ? (valor / qty) : 0;
        var pesoArroba = peso > 0 ? (peso / 30) : 0;
        var custoArroba = pesoArroba > 0 ? (custoCabeca / pesoArroba) : 0;

        var ev = {
            type: 'COMPRA',
            qty: qty,
            cabecas: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabeças'),
            nome: desc || (qty + ' cabeças compradas'),
            fornecedor: fornecedor,
            lote: lote,
            custoCabeca: custoCabeca,
            custoArroba: custoArroba,
            date: data || new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);

        // ══ AUTO-CRIAR / ATUALIZAR LOTE ══
        if (lote && window.lotes) {
            var loteExistente = window.lotes.getLoteByNome(lote);
            if (loteExistente) {
                // Incrementar quantidade no lote existente
                window.data.saveEvent({
                    type: 'LOTE', nome: lote, categoria: loteExistente.categoria, raca: loteExistente.raca,
                    qtdAnimais: (loteExistente.qtdAnimais || 0) + qty,
                    pesoMedio: peso || loteExistente.pesoMedio,
                    pasto: loteExistente.pasto, status: 'ATIVO',
                    dataEntrada: loteExistente.dataEntrada,
                    salMineral: loteExistente.salMineral, salConsumo: loteExistente.salConsumo
                });
                window.app.showToast('✅ Compra registrada! +' + qty + ' cab em ' + lote + ' | R$ ' + custoCabeca.toFixed(2) + '/cab');
            } else {
                // Criar novo lote
                window.data.saveEvent({
                    type: 'LOTE', nome: lote, categoria: 'engorda', raca: '',
                    qtdAnimais: qty, pesoMedio: peso, pasto: '', status: 'ATIVO',
                    dataEntrada: data || new Date().toISOString().split('T')[0]
                });
                window.app.showToast('✅ Compra + Novo lote: ' + lote + ' (' + qty + ' cab) | R$ ' + custoCabeca.toFixed(2) + '/cab');
            }
        } else {
            window.app.showToast('✅ Compra registrada! R$ ' + custoCabeca.toFixed(2) + '/cab');
        }

        document.getElementById('form-compra').reset();
    },

    saveVenda: function () {
        var lote = document.getElementById('venda-lote').value;
        var qty = parseInt(document.getElementById('venda-qty').value) || 0;
        var peso = parseFloat(document.getElementById('venda-peso').value) || 0;
        var valor = parseFloat(document.getElementById('venda-valor').value) || 0;
        var comprador = document.getElementById('venda-comprador').value;
        var desc = document.getElementById('venda-desc').value;
        var data = document.getElementById('venda-data').value;

        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }

        // ══ VERIFICAÇÃO DE CARÊNCIA SANITÁRIA ══
        if (lote && window.calendario && window.calendario.verificarCarenciaVenda) {
            if (!window.calendario.verificarCarenciaVenda(lote)) {
                window.app.showToast('❌ Venda cancelada — período de carência ativo.', 'error');
                return;
            }
        }

        var precoArroba = 0;
        if (peso > 0) {
            var totalArrobas = (qty * peso) / 30;
            precoArroba = valor / totalArrobas;
        }

        var ev = {
            type: 'VENDA',
            qty: qty,
            cabecas: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabeças vendidas'),
            nome: desc || (qty + ' cab vendidas'),
            comprador: comprador,
            lote: lote,
            precoArroba: precoArroba,
            date: data || new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);

        // ══ AUTO-REDUZIR LOTE ══
        if (lote && window.lotes) {
            var loteObj = window.lotes.getLoteByNome(lote);
            if (loteObj) {
                var novaQtd = Math.max(0, (loteObj.qtdAnimais || 0) - qty);
                window.data.saveEvent({
                    type: 'LOTE', nome: lote, categoria: loteObj.categoria, raca: loteObj.raca,
                    qtdAnimais: novaQtd, pesoMedio: loteObj.pesoMedio,
                    pasto: loteObj.pasto, status: novaQtd > 0 ? 'ATIVO' : 'INATIVO',
                    dataEntrada: loteObj.dataEntrada,
                    salMineral: loteObj.salMineral, salConsumo: loteObj.salConsumo
                });
            }
        }

        window.app.showToast('✅ Venda registrada! R$ ' + precoArroba.toFixed(2) + '/@');
        document.getElementById('form-venda').reset();
    },

    // ══════════════════════════════════════════════
    // ESTORNO — Reverter lançamento errado
    // ══════════════════════════════════════════════
    estornar: function (eventId) {
        if (!window.data) return;

        var evento = null;
        var idx = -1;
        for (var i = 0; i < window.data.events.length; i++) {
            if (window.data.events[i].id === eventId) {
                evento = window.data.events[i];
                idx = i;
                break;
            }
        }

        if (!evento) {
            window.app.showToast('Evento não encontrado.', 'error');
            return;
        }

        if (evento.estornado) {
            window.app.showToast('Este lançamento já foi estornado.', 'error');
            return;
        }

        var tipoLabel = {
            'COMPRA': 'Compra', 'VENDA': 'Venda', 'ESTOQUE_ENTRADA': 'Entrada Estoque',
            'MANEJO_SANITARIO': 'Manejo', 'CONTA_PAGAR': 'Conta', 'OBRA_REGISTRO': 'Obra'
        };
        var label = tipoLabel[evento.type] || evento.type;
        var valor = evento.value || evento.custo || evento.cost || 0;

        if (!confirm('⚠️ Estornar "' + label + '"?\n\n' +
            (evento.desc || evento.nome || '--') + '\n' +
            'Valor: R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n\n' +
            'Isso criará um contra-lançamento e marcará o original como estornado.')) {
            return;
        }

        // Marcar original como estornado
        window.data.events[idx].estornado = true;
        window.data.events[idx].dataEstorno = new Date().toISOString();

        // Criar contra-evento
        var contra = {
            type: 'ESTORNO',
            eventoOriginalId: eventId,
            tipoOriginal: evento.type,
            desc: '🔄 ESTORNO: ' + (evento.desc || evento.nome || label),
            nome: '🔄 ESTORNO: ' + (evento.desc || evento.nome || label),
            value: valor,
            date: new Date().toISOString().split('T')[0]
        };
        window.data.saveEvent(contra);

        // ══ Reverter efeito no lote se COMPRA/VENDA ══
        if (evento.type === 'COMPRA' && evento.lote && window.lotes) {
            var lote = window.lotes.getLoteByNome(evento.lote);
            if (lote) {
                var newQtd = Math.max(0, (lote.qtdAnimais || 0) - (evento.qty || evento.cabecas || 0));
                window.data.saveEvent({
                    type: 'LOTE', nome: evento.lote, categoria: lote.categoria, raca: lote.raca,
                    qtdAnimais: newQtd, pesoMedio: lote.pesoMedio,
                    pasto: lote.pasto, status: newQtd > 0 ? 'ATIVO' : 'INATIVO',
                    dataEntrada: lote.dataEntrada
                });
            }
        }

        if (evento.type === 'VENDA' && evento.lote && window.lotes) {
            var loteV = window.lotes.getLoteByNome(evento.lote);
            if (loteV) {
                window.data.saveEvent({
                    type: 'LOTE', nome: evento.lote, categoria: loteV.categoria, raca: loteV.raca,
                    qtdAnimais: (loteV.qtdAnimais || 0) + (evento.qty || evento.cabecas || 0),
                    pesoMedio: loteV.pesoMedio,
                    pasto: loteV.pasto, status: 'ATIVO',
                    dataEntrada: loteV.dataEntrada
                });
            }
        }

        // ══ Reverter estoque se ESTOQUE_ENTRADA ══
        if (evento.type === 'ESTOQUE_ENTRADA' && evento.produto && window.estoque) {
            try {
                var produtos = window.estoque.getProdutos ? window.estoque.getProdutos() : [];
                for (var p = 0; p < produtos.length; p++) {
                    if (produtos[p].nome === evento.produto || produtos[p].name === evento.produto) {
                        var qtdOriginal = evento.qty || evento.qtdSacos || 0;
                        produtos[p].qty = Math.max(0, (produtos[p].qty || 0) - qtdOriginal);
                        break;
                    }
                }
            } catch (e) { /* best effort */ }
        }

        // ══ Reverter materiais se MANEJO ══
        if ((evento.type === 'MANEJO_SANITARIO' || evento.type === 'MANEJO') && evento.materials && window.estoque) {
            try {
                var produtosM = window.estoque.getProdutos ? window.estoque.getProdutos() : [];
                evento.materials.forEach(function (mat) {
                    for (var pm = 0; pm < produtosM.length; pm++) {
                        if (produtosM[pm].nome === mat.name || produtosM[pm].name === mat.name) {
                            produtosM[pm].qty = (produtosM[pm].qty || 0) + (mat.qty || 0);
                            break;
                        }
                    }
                });
            } catch (e) { /* best effort */ }
        }

        window.data.save();
        window.app.showToast('🔄 Estorno realizado com sucesso!');
        this.updateFluxoUI();
    },

    // ══════════════════════════════════════════════
    // FLUXO DE CAIXA — COMPLETO
    // ══════════════════════════════════════════════
    updateFluxoUI: function () {
        var container = document.getElementById('fluxo-content');
        if (!container || !window.data) return;

        var events = window.data.events;
        var totalEntradas = 0;
        var totalSaidas = 0;
        var allTransactions = [];

        events.forEach(function (ev) {
            if (ev.estornado) return; // Ignorar estornados

            var valor = ev.value || ev.custo || ev.cost || 0;

            if (ev.type === 'VENDA') {
                totalEntradas += valor;
                allTransactions.push({ type: 'VENDA', valor: valor, desc: ev.desc || ev.nome || 'Venda', date: ev.date, id: ev.id, isEntrada: true });
            } else if (ev.type === 'COMPRA') {
                totalSaidas += valor;
                allTransactions.push({ type: 'COMPRA', valor: valor, desc: ev.desc || ev.nome || 'Compra', date: ev.date, id: ev.id, isEntrada: false });
            } else if (ev.type === 'ESTOQUE_ENTRADA' && valor > 0) {
                totalSaidas += valor;
                allTransactions.push({ type: 'ESTOQUE_ENTRADA', valor: valor, desc: ev.name || ev.nome || ev.desc || 'Insumo', date: ev.date, id: ev.id, isEntrada: false });
            } else if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && (ev.cost || ev.custo)) {
                var mCusto = ev.cost || ev.custo || 0;
                totalSaidas += mCusto;
                allTransactions.push({ type: 'MANEJO', valor: mCusto, desc: (ev.tipo || 'Manejo') + ' — ' + (ev.produto || ev.desc || ''), date: ev.date, id: ev.id, isEntrada: false });
            } else if (ev.type === 'CONTA_PAGAR' && ev.pago) {
                totalSaidas += valor;
                allTransactions.push({ type: 'CONTA_PAGAR', valor: valor, desc: ev.nome || ev.desc || 'Conta', date: ev.date, id: ev.id, isEntrada: false });
            } else if (ev.type === 'OBRA_REGISTRO' && valor > 0) {
                totalSaidas += valor;
                allTransactions.push({ type: 'OBRA_REGISTRO', valor: valor, desc: ev.nome || ev.desc || 'Obra', date: ev.date, id: ev.id, isEntrada: false });
            } else if (ev.type === 'ESTORNO') {
                // Estornos são contra-lançamentos
                if (ev.tipoOriginal === 'VENDA') {
                    totalEntradas -= valor;
                } else {
                    totalSaidas -= valor;
                }
                allTransactions.push({ type: 'ESTORNO', valor: valor, desc: ev.desc || ev.nome || 'Estorno', date: ev.date, id: ev.id, isEntrada: ev.tipoOriginal !== 'VENDA' });
            }
        });

        var saldo = totalEntradas - totalSaidas;

        // Summary cards
        var saldoColor = saldo >= 0 ? '#059669' : '#DC2626';
        var saldoBg = saldo >= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)';

        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">'
            + '<div style="background:linear-gradient(135deg, #059669, #10B981);border-radius:14px;padding:14px 16px;color:#fff;">'
            + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">💰 Entradas</div>'
            + '<div style="font-size:22px;font-weight:800;margin-top:4px;">R$ ' + totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>'
            + '<div style="background:linear-gradient(135deg, #DC2626, #EF4444);border-radius:14px;padding:14px 16px;color:#fff;">'
            + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">📉 Saídas</div>'
            + '<div style="font-size:22px;font-weight:800;margin-top:4px;">R$ ' + totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>'
            + '</div>'
            + '<div style="background:' + saldoBg + ';border:2px solid ' + saldoColor + ';border-radius:14px;padding:14px 16px;text-align:center;margin-bottom:16px;">'
            + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:' + saldoColor + ';">📊 SALDO</div>'
            + '<div style="font-size:28px;font-weight:800;color:' + saldoColor + ';margin-top:4px;">' + (saldo >= 0 ? '+' : '') + 'R$ ' + saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
            + '</div>';

        // Indicadores de Gado de Corte
        var compras = events.filter(function (e) { return e.type === 'COMPRA' && !e.estornado; });
        var vendas = events.filter(function (e) { return e.type === 'VENDA' && !e.estornado; });
        var totalArrobasCompradas = 0;
        var totalArrobasVendidas = 0;
        compras.forEach(function (c) { if (c.peso && c.qty) totalArrobasCompradas += (c.qty * c.peso / 30); });
        vendas.forEach(function (v) { if (v.peso && v.qty) totalArrobasVendidas += (v.qty * v.peso / 30); });

        var custoMedioArroba = totalArrobasCompradas > 0 ? (totalSaidas / totalArrobasCompradas) : 0;
        var precoMedioVenda = totalArrobasVendidas > 0 ? (totalEntradas / totalArrobasVendidas) : 0;
        var margemArroba = precoMedioVenda - custoMedioArroba;

        html += '<div class="kpi-section" style="margin-top:16px;">'
            + '<div class="kpi-title">Indicadores de Corte</div>'
            + '<div class="kpi-grid">'
            + '  <div class="kpi-card"><div class="kpi-label">Custo Médio /@</div><div class="kpi-value">R$ ' + custoMedioArroba.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">Preço Venda /@</div><div class="kpi-value positive">R$ ' + precoMedioVenda.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">Margem /@</div><div class="kpi-value ' + (margemArroba >= 0 ? 'positive' : 'negative') + '">R$ ' + margemArroba.toFixed(2) + '</div></div>'
            + '  <div class="kpi-card"><div class="kpi-label">@ Vendidas</div><div class="kpi-value">' + totalArrobasVendidas.toFixed(1) + '</div></div>'
            + '</div></div>';

        // Movimentações — com botão de ESTORNO
        html += '<div class="section-title" style="margin-top:16px;">Movimentações Recentes</div>';

        allTransactions.sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        var txConfig = {
            'VENDA': { icon: '📈', label: 'VENDA', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            'COMPRA': { icon: '🐄', label: 'COMPRA GADO', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
            'ESTOQUE_ENTRADA': { icon: '📦', label: 'INSUMO', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            'MANEJO': { icon: '💉', label: 'MANEJO', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
            'CONTA_PAGAR': { icon: '📝', label: 'CONTA PAGA', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
            'OBRA_REGISTRO': { icon: '🔨', label: 'OBRA', color: '#795548', bg: 'rgba(121,85,72,0.08)' },
            'ESTORNO': { icon: '🔄', label: 'ESTORNO', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
        };

        if (allTransactions.length === 0) {
            html += '<div class="empty-state">'
                + '<span class="empty-state-icon">💰</span>'
                + '<div class="empty-state-title">Sem Movimentações</div>'
                + '<div class="empty-state-text">Registre compras e vendas para visualizar o fluxo de caixa.</div>'
                + '</div>';
        } else {
            allTransactions.slice(0, 40).forEach(function (tx) {
                var cfg = txConfig[tx.type] || { icon: '📝', label: 'OUTRO', color: '#64748B', bg: 'rgba(100,116,139,0.08)' };
                var dateStr = (tx.date || '').split('T')[0];
                var dp = dateStr.split('-');
                var df = dp.length === 3 ? dp[2] + '/' + dp[1] : dateStr;

                html += '<div style="background:' + cfg.bg + ';border-left:4px solid ' + cfg.color + ';border-radius:10px;padding:10px 12px;margin-bottom:8px;">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<span style="font-size:10px;font-weight:700;text-transform:uppercase;color:' + cfg.color + ';">' + cfg.icon + ' ' + cfg.label + '</span>'
                    + '<span style="font-size:10px;color:#94A3B8;">📅 ' + df + '</span>'
                    + '</div>'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">'
                    + '<div style="font-size:13px;font-weight:600;color:#1E293B;flex:1;">' + (tx.desc || '--') + '</div>'
                    + '<div style="font-size:14px;font-weight:800;color:' + cfg.color + ';white-space:nowrap;margin-left:8px;">' + (tx.isEntrada ? '+' : '-') + ' R$ ' + tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>'
                    + '</div>';

                // Botão ESTORNO (não mostra para estornos ou itens sem id)
                if (tx.type !== 'ESTORNO' && tx.id) {
                    html += '<div style="margin-top:6px;text-align:right;">'
                        + '<button onclick="window.financeiro.estornar(\'' + tx.id + '\')" '
                        + 'style="background:none;border:1px solid #CBD5E1;color:#64748B;font-size:9px;font-weight:700;padding:3px 10px;border-radius:6px;cursor:pointer;">'
                        + '🔄 ESTORNAR</button>'
                        + '</div>';
                }

                html += '</div>';
            });
        }

        container.innerHTML = html;
    },

    // ====== BALANÇO GERAL / DRE ======
    renderBalanco: function () {
        var container = document.getElementById('balanco-content');
        if (!container || !window.data) return;

        var events = window.data.events.filter(function (e) { return !e.estornado; });

        // ─── 1. RECEITAS ───
        var receitaGado = 0;
        var vendas = events.filter(function (ev) { return ev.type === 'VENDA'; });
        vendas.forEach(function (v) { receitaGado += (v.value || 0); });

        var totalArrobasVendidas = 0;
        vendas.forEach(function (v) {
            if (v.peso && v.qty) totalArrobasVendidas += (v.qty * v.peso / 30);
        });

        // ─── 2. CUSTOS VARIÁVEIS ───
        var custoReposicao = 0;
        var compras = events.filter(function (ev) { return ev.type === 'COMPRA'; });
        compras.forEach(function (c) { custoReposicao += (c.value || 0); });

        var totalArrobasCompradas = 0;
        compras.forEach(function (c) {
            if (c.peso && c.qty) totalArrobasCompradas += (c.qty * c.peso / 30);
        });

        // 2b. Nutrição — usar name OU nome, category OU categoria
        var custoNutricao = 0;
        var estoqueNutricao = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || ev.categoria || '').toLowerCase();
            var name = (ev.name || ev.nome || ev.desc || '').toLowerCase();
            return cat === 'racao_sal' || name.indexOf('sal') >= 0 || name.indexOf('ração') >= 0
                || name.indexOf('racao') >= 0 || name.indexOf('milho') >= 0
                || name.indexOf('silagem') >= 0 || name.indexOf('farelo') >= 0
                || name.indexOf('proteinado') >= 0;
        });
        estoqueNutricao.forEach(function (ev) { custoNutricao += (ev.value || 0); });

        // 2c. Sanidade
        var custoSanidade = 0;
        var estoqueRemedios = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || ev.categoria || '').toLowerCase();
            var name = (ev.name || ev.nome || ev.desc || '').toLowerCase();
            return cat === 'remedios' || name.indexOf('vacina') >= 0
                || name.indexOf('ivermectina') >= 0 || name.indexOf('antibiótico') >= 0
                || name.indexOf('vermifugo') >= 0 || name.indexOf('vermífugo') >= 0;
        });
        estoqueRemedios.forEach(function (ev) { custoSanidade += (ev.value || 0); });

        // Manejo costs (check both cost and custo)
        var manejoCosts = events.filter(function (ev) {
            return (ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && (ev.cost || ev.custo);
        });
        manejoCosts.forEach(function (ev) { custoSanidade += (ev.cost || ev.custo || 0); });

        // ─── 3. CUSTOS FIXOS / INFRAESTRUTURA ───
        var custoInfra = 0;
        // Estoque de obras
        var estoqueObras = events.filter(function (ev) {
            if (ev.type !== 'ESTOQUE_ENTRADA') return false;
            var cat = (ev.category || ev.categoria || '').toLowerCase();
            return cat === 'obras';
        });
        estoqueObras.forEach(function (ev) { custoInfra += (ev.value || 0); });

        // Obras registradas
        var obrasRegistro = events.filter(function (ev) { return ev.type === 'OBRA_REGISTRO'; });
        obrasRegistro.forEach(function (ob) { custoInfra += (ob.value || ob.custo || 0); });

        // Mão de Obra (obras com workers + funcionários)
        var custoMaoDeObra = 0;
        var obras = events.filter(function (ev) { return ev.type === 'OBRA'; });
        obras.forEach(function (ob) {
            if (ob.workers && Array.isArray(ob.workers)) {
                ob.workers.forEach(function (w) {
                    custoMaoDeObra += ((w.diaria || 0) * (w.dias || 1));
                });
            }
        });

        // Funcionários (salários como custo mensal)
        var funcionarios = events.filter(function (ev) { return ev.type === 'FUNCIONARIO' && ev.status === 'ATIVO'; });
        var salariosMensais = 0;
        funcionarios.forEach(function (f) { salariosMensais += (f.salario || 0); });

        // Contas pagas
        var contasPagas = 0;
        events.filter(function (ev) { return ev.type === 'CONTA_PAGAR' && ev.pago; })
            .forEach(function (c) { contasPagas += (c.value || 0); });

        // ─── TOTAIS ───
        var custoVariavelTotal = custoReposicao + custoNutricao + custoSanidade;
        var custoFixoTotal = custoInfra + custoMaoDeObra + salariosMensais + contasPagas;
        var custoOperacionalTotal = custoVariavelTotal + custoFixoTotal;
        var resultadoBruto = receitaGado - custoReposicao;
        var resultadoLiquido = receitaGado - custoOperacionalTotal;

        // ─── INDICADORES ZOOTÉCNICOS ───
        var totalAnimaisAtivos = 0;
        var totalLotesAtivos = 0;
        var pesoMedioRebanho = 0;
        var somaGMD = 0;
        var countGMD = 0;

        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            totalLotesAtivos = lotes.length;
            lotes.forEach(function (l) {
                totalAnimaisAtivos += (l.qtdAnimais || 0);
                pesoMedioRebanho += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
                var gmd = window.lotes.calcGMD(l);
                if (gmd && gmd.gmd > 0) {
                    somaGMD += gmd.gmd;
                    countGMD++;
                }
            });
            if (totalAnimaisAtivos > 0) pesoMedioRebanho = pesoMedioRebanho / totalAnimaisAtivos;
        }

        var gmdMedio = countGMD > 0 ? somaGMD / countGMD : 0;

        var custoPorCabeca = totalAnimaisAtivos > 0 ? custoOperacionalTotal / totalAnimaisAtivos : 0;
        var arrobasTotais = totalAnimaisAtivos * pesoMedioRebanho / 30;
        var custoPorArroba = arrobasTotais > 0 ? custoOperacionalTotal / arrobasTotais : 0;
        var precoMedioVendaArroba = totalArrobasVendidas > 0 ? receitaGado / totalArrobasVendidas : 0;
        var margemPorArroba = precoMedioVendaArroba - custoPorArroba;

        var valorRebanho = 0;
        if (precoMedioVendaArroba > 0 && totalAnimaisAtivos > 0) {
            valorRebanho = arrobasTotais * precoMedioVendaArroba;
        }

        var custoDiarioFazenda = 0;
        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                var c = window.lotes.calcCustoNutricao(l);
                if (c) custoDiarioFazenda += c.custoDiaTotal;
            });
        }

        // ─── RENDER HTML ───
        var fmt = function (v) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

        var html = '';

        // ══ INDICADORES ZOOTÉCNICOS ══
        html += '<div class="kpi-section">'
            + '<div class="kpi-title">📊 Indicadores Zootécnicos</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Rebanho Ativo</div><div class="kpi-value positive">' + totalAnimaisAtivos + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">GMD Médio</div><div class="kpi-value ' + (gmdMedio >= 0.8 ? 'positive' : gmdMedio >= 0.5 ? '' : 'negative') + '">' + gmdMedio.toFixed(3) + ' kg/dia</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedioRebanho.toFixed(0) + ' kg</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">@ no Rebanho</div><div class="kpi-value">' + arrobasTotais.toFixed(0) + ' @</div></div>'
            + '</div></div>';

        // ══ INDICADORES ECONÔMICOS ══
        html += '<div class="kpi-section" style="margin-top:12px;">'
            + '<div class="kpi-title">💰 Indicadores Econômicos</div>'
            + '<div class="kpi-grid">'
            + '<div class="kpi-card"><div class="kpi-label">Custo/Cabeça</div><div class="kpi-value">' + fmt(custoPorCabeca) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo/@ Total</div><div class="kpi-value">' + fmt(custoPorArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Preço Venda/@</div><div class="kpi-value positive">' + fmt(precoMedioVendaArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Margem/@</div><div class="kpi-value ' + (margemPorArroba >= 0 ? 'positive' : 'negative') + '">' + fmt(margemPorArroba) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo Diário Fazenda</div><div class="kpi-value">' + fmt(custoDiarioFazenda) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Folha Mensal</div><div class="kpi-value">' + fmt(salariosMensais) + '</div></div>'
            + '</div></div>';

        // ══ DRE ══
        html += '<div class="dre-section" style="margin-top:16px;">'
            + '<div class="kpi-title">📋 DRE — Demonstrativo de Resultado</div>'
            + '<div class="dre-table">';

        html += '<div class="dre-header">RECEITAS</div>'
            + '<div class="dre-row"><span>Venda de Gado</span><span class="text-green">' + fmt(receitaGado) + '</span></div>'
            + '<div class="dre-row"><span class="dre-sub">@ Vendidas: ' + totalArrobasVendidas.toFixed(1) + ' | Vendas: ' + vendas.length + '</span><span></span></div>'
            + '<div class="dre-total"><span>TOTAL RECEITAS</span><span class="text-green">' + fmt(receitaGado) + '</span></div>';

        html += '<div class="dre-header" style="margin-top:12px;">CUSTOS VARIÁVEIS</div>'
            + '<div class="dre-row"><span>🐄 Reposição de Gado</span><span class="text-red">' + fmt(custoReposicao) + '</span></div>'
            + '<div class="dre-row"><span>🧂 Nutrição (Ração/Sal/Silagem)</span><span class="text-red">' + fmt(custoNutricao) + '</span></div>'
            + '<div class="dre-row"><span>💊 Sanidade (Vacinas/Remédios/Manejo)</span><span class="text-red">' + fmt(custoSanidade) + '</span></div>'
            + '<div class="dre-total"><span>TOTAL VARIÁVEIS</span><span class="text-red">' + fmt(custoVariavelTotal) + '</span></div>';

        html += '<div class="dre-resultado ' + (resultadoBruto >= 0 ? 'positivo' : 'negativo') + '">'
            + '<span>RESULTADO BRUTO</span><span>' + fmt(resultadoBruto) + '</span></div>';

        html += '<div class="dre-header" style="margin-top:12px;">CUSTOS FIXOS / ESTRUTURAIS</div>'
            + '<div class="dre-row"><span>🔨 Infraestrutura (Obras/Materiais)</span><span class="text-red">' + fmt(custoInfra) + '</span></div>'
            + '<div class="dre-row"><span>👷 Mão de Obra</span><span class="text-red">' + fmt(custoMaoDeObra) + '</span></div>'
            + '<div class="dre-row"><span>💼 Folha de Pagamento</span><span class="text-red">' + fmt(salariosMensais) + '</span></div>'
            + '<div class="dre-row"><span>📝 Contas Pagas</span><span class="text-red">' + fmt(contasPagas) + '</span></div>'
            + '<div class="dre-total"><span>TOTAL FIXOS</span><span class="text-red">' + fmt(custoFixoTotal) + '</span></div>';

        html += '<div class="dre-resultado ' + (resultadoLiquido >= 0 ? 'positivo' : 'negativo') + '" style="font-size:16px;">'
            + '<span>📊 RESULTADO LÍQUIDO</span><span>' + fmt(resultadoLiquido) + '</span></div>';

        html += '</div></div>';

        // ══ PROJEÇÃO ══
        if (valorRebanho > 0) {
            var resultadoPotencial = valorRebanho - custoOperacionalTotal + receitaGado;
            html += '<div class="kpi-section" style="margin-top:16px;">'
                + '<div class="kpi-title">🔮 Projeção de Resultado</div>'
                + '<div class="kpi-grid">'
                + '<div class="kpi-card"><div class="kpi-label">Valor est. Rebanho</div><div class="kpi-value positive">' + fmt(valorRebanho) + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Custos Acumulados</div><div class="kpi-value negative">' + fmt(custoOperacionalTotal) + '</div></div>'
                + '<div class="kpi-card"><div class="kpi-label">Resultado Potencial</div><div class="kpi-value ' + (resultadoPotencial >= 0 ? 'positive' : 'negative') + '">' + fmt(resultadoPotencial) + '</div></div>'
                + '</div></div>';
        }

        // ══ COMPOSIÇÃO DE CUSTOS ══
        var custoItems = [
            { label: '🐄 Reposição', valor: custoReposicao, cor: '#E91E63' },
            { label: '🧂 Nutrição', valor: custoNutricao, cor: '#FF9800' },
            { label: '💊 Sanidade', valor: custoSanidade, cor: '#2196F3' },
            { label: '🔨 Infraestrutura', valor: custoInfra, cor: '#795548' },
            { label: '👷 Mão de Obra', valor: custoMaoDeObra, cor: '#9C27B0' },
            { label: '💼 Folha Pgto', valor: salariosMensais, cor: '#00BCD4' },
            { label: '📝 Contas Pagas', valor: contasPagas, cor: '#607D8B' }
        ];

        var maxCusto = Math.max.apply(null, custoItems.map(function (c) { return c.valor; }));

        if (custoOperacionalTotal > 0) {
            html += '<div class="kpi-section" style="margin-top:16px;">'
                + '<div class="kpi-title">📈 Composição de Custos</div>';

            custoItems.forEach(function (item) {
                if (item.valor <= 0) return;
                var pct = custoOperacionalTotal > 0 ? (item.valor / custoOperacionalTotal * 100) : 0;
                var barWidth = maxCusto > 0 ? (item.valor / maxCusto * 100) : 0;
                html += '<div style="margin-bottom:8px;">'
                    + '<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">'
                    + '<span>' + item.label + '</span>'
                    + '<span style="font-weight:700;">' + fmt(item.valor) + ' (' + pct.toFixed(1) + '%)</span>'
                    + '</div>'
                    + '<div style="background:rgba(0,0,0,0.06); border-radius:4px; height:12px; overflow:hidden;">'
                    + '<div style="background:' + item.cor + '; height:100%; width:' + barWidth + '%; border-radius:4px; transition:width 0.5s;"></div>'
                    + '</div></div>';
            });

            html += '</div>';
        }

        container.innerHTML = html;
    }
};
