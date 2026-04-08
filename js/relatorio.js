// ====== MÓDULO: RELATÓRIO PDF / IMPRESSÃO — Todos os Módulos ======
window.relatorio = {
    init: function () {
        console.log('Relatorio Module Ready');
    },

    // ══ ESTILOS BASE DO RELATÓRIO ══
    _baseStyles: function () {
        return 'body { font-family: "Inter", "Segoe UI", sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 13px; }' +
            'h1 { color: #0F766E; border-bottom: 3px solid #0F766E; padding-bottom: 8px; font-size: 22px; }' +
            'h2 { color: #1E3A5F; margin-top: 24px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }' +
            '.header-info { display: flex; justify-content: space-between; margin: 8px 0 20px; font-size: 12px; color: #666; }' +
            'table { width: 100%; border-collapse: collapse; margin: 10px 0; }' +
            'th { background: #0F766E; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }' +
            'td { padding: 6px 10px; border-bottom: 1px solid #eee; }' +
            'tr:nth-child(even) { background: #f8f9fa; }' +
            '.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }' +
            '.kpi { background: #f1f5f9; border-radius: 8px; padding: 10px; text-align: center; }' +
            '.kpi-label { font-size: 10px; color: #666; text-transform: uppercase; }' +
            '.kpi-value { font-size: 18px; font-weight: 700; color: #0F766E; margin-top: 4px; }' +
            '.dre-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }' +
            '.dre-total { display: flex; justify-content: space-between; padding: 8px 0; font-weight: 700; border-top: 2px solid #333; margin-top: 4px; }' +
            '.positive { color: #16a34a; }' +
            '.negative { color: #dc2626; }' +
            '.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }' +
            '.badge-green { background: #dcfce7; color: #166534; }' +
            '.badge-red { background: #fee2e2; color: #991b1b; }' +
            '.badge-yellow { background: #fef9c3; color: #854d0e; }' +
            '.badge-blue { background: #dbeafe; color: #1e40af; }' +
            '.footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }' +
            '.no-print { margin: 15px 0; }' +
            '.btn-print { background: #0F766E; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-right: 8px; }' +
            '.btn-print:hover { background: #115E59; }' +
            '@media print { .no-print { display: none !important; } body { padding: 0; } }';
    },

    // ══ CABEÇALHO PADRÃO ══
    _header: function (titulo) {
        var config = JSON.parse(localStorage.getItem('agromacro_config') || '{}');
        var nomeFazenda = config.nomeFazenda || 'Fazenda';
        var proprietario = config.proprietario || '';
        var cidade = config.cidade || '';
        var estado = config.estado || '';
        var hoje = new Date();
        var dataRelatorio = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<title>' + titulo + ' - ' + nomeFazenda + '</title>' +
            '<style>' + this._baseStyles() + '</style></head><body>';
        html += '<h1>📊 ' + nomeFazenda + ' — ' + titulo + '</h1>';
        html += '<div class="header-info">';
        html += '<span>' + (proprietario ? proprietario + ' | ' : '') + (cidade ? cidade + '/' + estado : '') + '</span>';
        html += '<span>Emitido em: ' + dataRelatorio + '</span>';
        html += '</div>';
        return html;
    },

    // ══ FOOTER ══
    _footer: function () {
        return '<div class="footer">AgroMacro — Sistema de Gestão Pecuária | Gerado automaticamente</div></body></html>';
    },

    // ══ FORMATAR VALOR ══
    _fmt: function (v) {
        return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ══ ABRIR EM NOVA JANELA (modo = 'print' ou 'pdf') ══
    _abrir: function (html, modo) {
        var win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            if (modo === 'print') {
                setTimeout(function () { win.print(); }, 500);
            }
            // modo === 'pdf' → apenas abre a janela para o usuário salvar manualmente via Ctrl+P → Salvar como PDF
        } else {
            window.app.showToast('⚠️ Pop-up bloqueado. Libere pop-ups para gerar o relatório.', 'error');
        }
    },

    // ═══════════════════════════════════════════════════════
    // 1. RELATÓRIO GERAL (Balanço / DRE)
    // ═══════════════════════════════════════════════════════
    gerarRelatorio: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório Gerencial');

        // Dados do rebanho
        var totalAnimais = 0, totalLotes = 0, pesoMedio = 0, arrobas = 0;
        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            totalLotes = lotes.length;
            lotes.forEach(function (l) {
                totalAnimais += (l.qtdAnimais || 0);
                pesoMedio += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
            });
            if (totalAnimais > 0) pesoMedio = pesoMedio / totalAnimais;
            arrobas = totalAnimais * pesoMedio / 30;
        }

        // Dados financeiros
        var events = window.data ? window.data.events : [];
        var receitaGado = 0, custoReposicao = 0, custoNutricao = 0, custoSanidade = 0, custoInfra = 0, custoMaoDeObra = 0;
        var vendas = 0, compras = 0;
        events.forEach(function (ev) {
            if (ev.type === 'VENDA') { receitaGado += (ev.value || 0); vendas++; }
            else if (ev.type === 'COMPRA') { custoReposicao += (ev.value || 0); compras++; }
            else if (ev.type === 'ESTOQUE_ENTRADA') {
                var cat = (ev.category || '').toLowerCase();
                var name = (ev.name || '').toLowerCase();
                if (cat === 'racao_sal' || name.indexOf('sal') >= 0 || name.indexOf('ração') >= 0 || name.indexOf('racao') >= 0) custoNutricao += (ev.value || 0);
                else if (cat === 'remedios' || name.indexOf('vacina') >= 0) custoSanidade += (ev.value || 0);
                else if (cat === 'obras') custoInfra += (ev.value || 0);
            }
            else if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && (ev.value || ev.cost)) custoSanidade += (ev.value || ev.cost);
            else if (ev.type === 'OBRA' && ev.workers) ev.workers.forEach(function (w) { custoMaoDeObra += ((w.diaria || 0) * (w.dias || 1)); });
        });
        var custoTotal = custoReposicao + custoNutricao + custoSanidade + custoInfra + custoMaoDeObra;
        var resultado = receitaGado - custoTotal;

        // KPIs
        html += '<h2>🐄 Resumo do Rebanho</h2>';
        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Cabeças</div><div class="kpi-value">' + totalAnimais + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Lotes</div><div class="kpi-value">' + totalLotes + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedio.toFixed(0) + ' kg</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Arrobas</div><div class="kpi-value">' + arrobas.toFixed(0) + ' @</div></div>';
        html += '</div>';

        // Lotes ativos
        if (window.lotes) {
            var lotesArr = window.lotes.getLotes();
            if (lotesArr.length > 0) {
                html += '<h2>📋 Lotes Ativos</h2>';
                html += '<table><thead><tr><th>Lote</th><th>Cabeças</th><th>Peso</th><th>GMD</th><th>Categoria</th></tr></thead><tbody>';
                lotesArr.forEach(function (l) {
                    var gmd = window.lotes.calcGMD ? window.lotes.calcGMD(l) : null;
                    var gmdVal = gmd && gmd.gmd ? gmd.gmd.toFixed(3) : '--';
                    html += '<tr><td>' + (l.nome || l.name) + '</td><td>' + (l.qtdAnimais || 0) + '</td><td>' + (l.pesoMedio || 0).toFixed(0) + ' kg</td><td>' + gmdVal + ' kg/dia</td><td>' + (l.categoria || '--') + '</td></tr>';
                });
                html += '</tbody></table>';
            }
        }

        // DRE
        html += '<h2>💰 Demonstrativo de Resultado</h2>';
        html += '<div class="dre-row"><span>📈 Receita de Vendas (' + vendas + ')</span><span class="positive">' + self._fmt(receitaGado) + '</span></div>';
        html += '<div class="dre-row"><span>🐄 Reposição de Gado (' + compras + ')</span><span class="negative">' + self._fmt(custoReposicao) + '</span></div>';
        html += '<div class="dre-row"><span>🧂 Nutrição</span><span class="negative">' + self._fmt(custoNutricao) + '</span></div>';
        html += '<div class="dre-row"><span>💊 Sanidade</span><span class="negative">' + self._fmt(custoSanidade) + '</span></div>';
        html += '<div class="dre-row"><span>🔨 Infraestrutura</span><span class="negative">' + self._fmt(custoInfra) + '</span></div>';
        html += '<div class="dre-row"><span>👷 Mão de Obra</span><span class="negative">' + self._fmt(custoMaoDeObra) + '</span></div>';
        html += '<div class="dre-total"><span>RESULTADO LÍQUIDO</span><span class="' + (resultado >= 0 ? 'positive' : 'negative') + '">' + self._fmt(resultado) + '</span></div>';

        // Cotação
        var precoArroba = parseFloat(localStorage.getItem('agromacro_preco_arroba') || '0');
        if (precoArroba > 0) {
            var valorRebanho = arrobas * precoArroba;
            html += '<h2>🔮 Valor Estimado do Rebanho</h2>';
            html += '<div class="kpi-row">';
            html += '<div class="kpi"><div class="kpi-label">Preço /@</div><div class="kpi-value">' + self._fmt(precoArroba) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Total @</div><div class="kpi-value">' + arrobas.toFixed(0) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Valor em Pé</div><div class="kpi-value">' + self._fmt(valorRebanho) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Resultado + Rebanho</div><div class="kpi-value">' + self._fmt(valorRebanho + resultado) + '</div></div>';
            html += '</div>';
        }

        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 2. RELATÓRIO DE LOTES
    // ═══════════════════════════════════════════════════════
    relatorioLotes: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório de Lotes');

        if (!window.lotes) { html += '<p>Módulo de lotes não disponível.</p>' + self._footer(); self._abrir(html, modo); return; }
        var lotes = window.lotes.getLotes();
        var totalAnimais = 0;
        lotes.forEach(function (l) { totalAnimais += (l.qtdAnimais || 0); });

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Total de Lotes</div><div class="kpi-value">' + lotes.length + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Total Cabeças</div><div class="kpi-value">' + totalAnimais + '</div></div>';
        html += '</div>';

        html += '<h2>📋 Detalhamento por Lote</h2>';
        html += '<table><thead><tr><th>Lote</th><th>Categoria</th><th>Cabeças</th><th>Peso Médio</th><th>Raça</th><th>Pasto</th></tr></thead><tbody>';
        lotes.forEach(function (l) {
            html += '<tr><td>' + (l.nome || l.name || '--') + '</td>';
            html += '<td>' + (l.categoria || '--') + '</td>';
            html += '<td>' + (l.qtdAnimais || 0) + '</td>';
            html += '<td>' + (l.pesoMedio || 0).toFixed(0) + ' kg</td>';
            html += '<td>' + (l.raca || '--') + '</td>';
            html += '<td>' + (l.pasto || '--') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 3. RELATÓRIO DE PASTOS
    // ═══════════════════════════════════════════════════════
    relatorioPastos: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório de Pastos');

        if (!window.pastos) { html += '<p>Módulo de pastos não disponível.</p>' + self._footer(); self._abrir(html, modo); return; }
        var pastos = window.pastos.getPastos();
        var areaTotal = 0;
        pastos.forEach(function (p) { areaTotal += (p.area || 0); });

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Pastos</div><div class="kpi-value">' + pastos.length + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Área Total</div><div class="kpi-value">' + areaTotal.toFixed(1) + ' ha</div></div>';
        html += '</div>';

        html += '<h2>🌿 Detalhamento por Pasto</h2>';
        html += '<table><thead><tr><th>Pasto</th><th>Área (ha)</th><th>Capacidade</th><th>Capim</th><th>Status</th></tr></thead><tbody>';
        pastos.forEach(function (p) {
            var statusMap = { disponivel: '🟢 Disponível', ocupado: '🔴 Ocupado', descanso: '🟡 Descanso', manutencao: '🔧 Manutenção' };
            html += '<tr><td>' + (p.nome || p.name || '--') + '</td>';
            html += '<td>' + (p.area || 0) + '</td>';
            html += '<td>' + (p.capacidade || '--') + ' cab</td>';
            html += '<td>' + (p.tipo || p.tipoCapim || '--') + '</td>';
            html += '<td>' + (statusMap[p.status] || p.status || '--') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 4. RELATÓRIO DE ESTOQUE
    // ═══════════════════════════════════════════════════════
    relatorioEstoque: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório de Estoque');

        if (!window.estoque) { html += '<p>Módulo de estoque não disponível.</p>' + self._footer(); self._abrir(html, modo); return; }
        var items = (window.estoque.getStockItems || window.estoque.getItems).call(window.estoque);
        var valorTotal = 0;
        items.forEach(function (item) { valorTotal += (item.valorTotal || (item.qty || 0) * (item.valor || 0)); });

        var catNames = { racao_sal: '🧂 Ração / Sal', remedios: '💊 Remédios', obras: '🔨 Obras' };
        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Itens</div><div class="kpi-value">' + items.length + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Valor Total</div><div class="kpi-value">' + self._fmt(valorTotal) + '</div></div>';
        html += '</div>';

        html += '<h2>📦 Itens em Estoque</h2>';
        html += '<table><thead><tr><th>Produto</th><th>Categoria</th><th>Qtd</th><th>Peso</th><th>Valor Unit.</th><th>Total</th></tr></thead><tbody>';
        items.forEach(function (item) {
            var vt = item.valorTotal || (item.qty || 0) * (item.valor || 0);
            html += '<tr><td>' + (item.nome || item.produto || '--') + '</td>';
            html += '<td>' + (catNames[item.categoria] || item.categoria || '--') + '</td>';
            html += '<td>' + (item.qty || 0) + ' ' + (item.unit || 'un') + '</td>';
            html += '<td>' + (item.pesoSaco || '--') + ' kg</td>';
            html += '<td>' + self._fmt(item.valor || 0) + '</td>';
            html += '<td>' + self._fmt(vt) + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 5. RELATÓRIO DE MANEJO
    // ═══════════════════════════════════════════════════════
    relatorioManejo: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório de Manejos');

        var events = window.data ? window.data.events.filter(function (e) {
            return e.type === 'MANEJO' || e.type === 'MANEJO_SANITARIO' || e.type === 'PESAGEM';
        }) : [];

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Total de Manejos</div><div class="kpi-value">' + events.length + '</div></div>';
        html += '</div>';

        html += '<h2>🩺 Histórico de Manejos</h2>';
        html += '<table><thead><tr><th>Data</th><th>Tipo</th><th>Lote</th><th>Descrição</th><th>Qtd</th><th>Custo</th></tr></thead><tbody>';
        events.sort(function (a, b) { return new Date(b.date || b.data) - new Date(a.date || a.data); });
        events.forEach(function (ev) {
            var d = ev.date || ev.data || '--';
            if (d !== '--') { var dt = new Date(d); d = dt.toLocaleDateString('pt-BR'); }
            var tipoMap = { vacinacao: '🩺 Vacinação', pesagem: '⚖️ Pesagem', movimentacao: '🔄 Movimentação', mortalidade: '⚠️ Mortalidade', outro: '📝 Outro' };
            html += '<tr><td>' + d + '</td>';
            html += '<td>' + (tipoMap[ev.subtype || ev.tipoManejo] || ev.subtype || ev.type || '--') + '</td>';
            html += '<td>' + (ev.lote || ev.loteName || '--') + '</td>';
            html += '<td>' + (ev.desc || ev.description || ev.produto || '--') + '</td>';
            html += '<td>' + (ev.qtd || ev.qtdAnimais || '--') + '</td>';
            html += '<td>' + (ev.cost ? self._fmt(ev.cost) : '--') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 6. RELATÓRIO DO CALENDÁRIO SANITÁRIO
    // ═══════════════════════════════════════════════════════
    relatorioCalendario: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Calendário Sanitário');

        var events = window.data ? window.data.events.filter(function (e) {
            return e.type === 'CALENDARIO' || e.type === 'MANEJO_SANITARIO' || e.type === 'IATF';
        }) : [];

        html += '<h2>📅 Eventos do Calendário</h2>';
        if (events.length === 0) {
            html += '<p>Nenhum evento sanitário registrado.</p>';
        } else {
            html += '<table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Lote</th><th>Status</th></tr></thead><tbody>';
            events.sort(function (a, b) { return new Date(a.date || a.data) - new Date(b.date || b.data); });
            events.forEach(function (ev) {
                var d = ev.date || ev.data || '--';
                if (d !== '--') { var dt = new Date(d); d = dt.toLocaleDateString('pt-BR'); }
                html += '<tr><td>' + d + '</td>';
                html += '<td>' + (ev.subtype || ev.tipo || '--') + '</td>';
                html += '<td>' + (ev.desc || ev.description || '--') + '</td>';
                html += '<td>' + (ev.lote || ev.loteName || '--') + '</td>';
                html += '<td>' + (ev.status || 'Pendente') + '</td></tr>';
            });
            html += '</tbody></table>';
        }
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 7. RELATÓRIO DE FLUXO DE CAIXA
    // ═══════════════════════════════════════════════════════
    relatorioFluxo: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Fluxo de Caixa');

        var events = window.data ? window.data.events.filter(function (ev) { return !ev.estornado; }) : [];
        var entradas = 0, saidas = 0;
        var rows = [];

        events.forEach(function (ev) {
            if (ev.type === 'VENDA') { entradas += (ev.value || 0); rows.push({ date: ev.date || ev.data, desc: '📈 Venda: ' + (ev.desc || ev.description || '--'), valor: ev.value || 0, tipo: 'entrada' }); }
            else if (ev.type === 'COMPRA') { saidas += (ev.value || 0); rows.push({ date: ev.date || ev.data, desc: '🐄 Compra: ' + (ev.desc || ev.description || '--'), valor: ev.value || 0, tipo: 'saida' }); }
            else if (ev.type === 'ESTOQUE_ENTRADA' && ev.value) { saidas += ev.value; rows.push({ date: ev.date || ev.data, desc: '📦 Estoque: ' + (ev.name || '--'), valor: ev.value, tipo: 'saida' }); }
            else if (ev.type === 'FLUXO_ENTRADA') { entradas += (ev.value || 0); rows.push({ date: ev.date || ev.data, desc: '💰 ' + (ev.desc || '--'), valor: ev.value || 0, tipo: 'entrada' }); }
            else if (ev.type === 'FLUXO_SAIDA') { saidas += (ev.value || 0); rows.push({ date: ev.date || ev.data, desc: '💸 ' + (ev.desc || '--'), valor: ev.value || 0, tipo: 'saida' }); }
        });

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Entradas</div><div class="kpi-value positive">' + self._fmt(entradas) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Saídas</div><div class="kpi-value negative">' + self._fmt(saidas) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-value ' + (entradas - saidas >= 0 ? 'positive' : 'negative') + '">' + self._fmt(entradas - saidas) + '</div></div>';
        html += '</div>';

        html += '<h2>📊 Movimentações</h2>';
        rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
        html += '<table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>';
        rows.forEach(function (r) {
            var d = r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '--';
            html += '<tr><td>' + d + '</td><td>' + r.desc + '</td>';
            html += '<td class="' + (r.tipo === 'entrada' ? 'positive' : 'negative') + '">' + (r.tipo === 'saida' ? '- ' : '+ ') + self._fmt(r.valor) + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 8. RELATÓRIO DE CONTAS A PAGAR
    // ═══════════════════════════════════════════════════════
    relatorioContas: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Contas a Pagar');

        var contas = window.data ? window.data.events.filter(function (e) { return e.type === 'CONTA_PAGAR' && !e.estornado; }) : [];
        var totalPendente = 0, totalPago = 0;
        contas.forEach(function (c) {
            if (c.pago || c.status === 'pago') totalPago += (c.value || c.valor || 0);
            else totalPendente += (c.value || c.valor || 0);
        });

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Total Contas</div><div class="kpi-value">' + contas.length + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Pendente</div><div class="kpi-value negative">' + self._fmt(totalPendente) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Pago</div><div class="kpi-value positive">' + self._fmt(totalPago) + '</div></div>';
        html += '</div>';

        html += '<h2>📋 Lista de Contas</h2>';
        html += '<table><thead><tr><th>Vencimento</th><th>Descrição</th><th>Valor</th><th>Status</th></tr></thead><tbody>';
        contas.sort(function (a, b) { return new Date(a.vencimento || a.date) - new Date(b.vencimento || b.date); });
        contas.forEach(function (c) {
            var d = (c.vencimento || c.date) ? new Date(c.vencimento || c.date).toLocaleDateString('pt-BR') : '--';
            html += '<tr><td>' + d + '</td>';
            html += '<td>' + (c.nome || c.desc || c.descricao || '--') + '</td>';
            html += '<td>' + self._fmt(c.value || c.valor || 0) + '</td>';
            html += '<td><span class="badge ' + ((c.pago || c.status === 'pago') ? 'badge-green' : 'badge-red') + '">' + ((c.pago || c.status === 'pago') ? 'Pago' : 'Pendente') + '</span></td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    // ═══════════════════════════════════════════════════════
    // 9. RELATÓRIO DE FUNCIONÁRIOS
    // ═══════════════════════════════════════════════════════
    relatorioFuncionarios: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Relatório de Funcionários');

        var funcionarios = window.data ? window.data.events.filter(function (e) {
            return (e.type === 'FUNCIONARIO_CADASTRO' || e.type === 'FUNCIONARIO') && !e.estornado && e.status !== 'INATIVO';
        }) : [];

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">' + funcionarios.length + '</div></div>';
        html += '</div>';

        html += '<h2>👷 Equipe</h2>';
        html += '<table><thead><tr><th>Nome</th><th>Função</th><th>Diária</th><th>Telefone</th></tr></thead><tbody>';
        funcionarios.forEach(function (f) {
            html += '<tr><td>' + (f.nome || '--') + '</td>';
            html += '<td>' + (f.funcao || '--') + '</td>';
            html += '<td>' + self._fmt(f.diaria || 0) + '</td>';
            html += '<td>' + (f.telefone || '--') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += self._footer();
        self._abrir(html, modo);
    },

    relatorioLivroCaixa: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Livro Caixa Digital');

        var events = window.data ? window.data.events.filter(function (ev) { return !ev.estornado; }) : [];
        var movs = [];
        var saldoAcumulado = 0;

        events.forEach(function (ev) {
            var valor = ev.value || ev.cost || ev.custo || 0;
            if (valor <= 0 && ev.type !== 'ESTORNO') return;
            var isEntrada = ev.type === 'VENDA';
            var isEstorno = ev.type === 'ESTORNO';
            if (isEstorno) {
                isEntrada = ev.tipoOriginal !== 'VENDA';
            }
            var isSaida = !isEntrada && (ev.type === 'COMPRA' || ev.type === 'ESTOQUE_ENTRADA'
                || ev.type === 'OBRA_REGISTRO' || (ev.type === 'CONTA_PAGAR' && (ev.pago || ev.status === 'pago'))
                || ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO');

            if (!isEntrada && !isSaida) return;

            var centerLabel = ev.centerCost || 'OUTROS';
            var desc = ev.nome || ev.desc || ev.type;

            movs.push({
                date: ev.date || '',
                tipo: isEntrada ? 'ENTRADA' : 'SAIDA',
                desc: desc,
                centerCost: centerLabel,
                valor: valor,
                categoria: ev.type
            });
        });

        movs.sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });

        html += '<h2>Movimentacoes por Data</h2>';
        html += '<table><thead><tr><th>Data</th><th>E/S</th><th>Descricao</th><th>Centro Custo</th><th>Valor</th><th>Saldo</th></tr></thead><tbody>';
        movs.forEach(function (m) {
            if (m.tipo === 'ENTRADA') saldoAcumulado += m.valor;
            else saldoAcumulado -= m.valor;
            var d = m.date ? new Date(m.date).toLocaleDateString('pt-BR') : '--';
            html += '<tr><td>' + d + '</td>';
            html += '<td><span class="badge ' + (m.tipo === 'ENTRADA' ? 'badge-green' : 'badge-red') + '">' + (m.tipo === 'ENTRADA' ? 'E' : 'S') + '</span></td>';
            html += '<td>' + m.desc + '</td>';
            html += '<td>' + m.centerCost + '</td>';
            html += '<td class="' + (m.tipo === 'ENTRADA' ? 'positive' : 'negative') + '">' + self._fmt(m.valor) + '</td>';
            html += '<td class="' + (saldoAcumulado >= 0 ? 'positive' : 'negative') + '">' + self._fmt(saldoAcumulado) + '</td></tr>';
        });
        html += '</tbody></table>';
        html += '<div class="dre-total"><span>SALDO FINAL</span><span class="' + (saldoAcumulado >= 0 ? 'positive' : 'negative') + '">' + self._fmt(saldoAcumulado) + '</span></div>';
        html += self._footer();
        self._abrir(html, modo);
    },

    relatorioProjecaoFluxo: function (modo) {
        modo = modo || 'print';
        var self = this;
        var html = self._header('Projecao de Fluxo de Caixa');

        var pendentes = window.data ? window.data.getContasPendentes() : [];
        var total30 = 0, total60 = 0, total90 = 0, totalAlem = 0;
        var hoje = new Date();
        var d30 = new Date(); d30.setDate(d30.getDate() + 30);
        var d60 = new Date(); d60.setDate(d60.getDate() + 60);
        var d90 = new Date(); d90.setDate(d90.getDate() + 90);

        pendentes.forEach(function (c) {
            var v = c.value || 0;
            var venc = c.vencimento ? new Date(c.vencimento) : hoje;
            if (venc <= d30) total30 += v;
            else if (venc <= d60) total60 += v;
            else if (venc <= d90) total90 += v;
            else totalAlem += v;
        });

        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Proximo 30d</div><div class="kpi-value negative">' + self._fmt(total30) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">30-60d</div><div class="kpi-value negative">' + self._fmt(total60) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">60-90d</div><div class="kpi-value negative">' + self._fmt(total90) + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Alem 90d</div><div class="kpi-value negative">' + self._fmt(totalAlem) + '</div></div>';
        html += '</div>';

        html += '<h2>Contas Pendentes por Vencimento</h2>';
        html += '<table><thead><tr><th>Vencimento</th><th>Descricao</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>';
        pendentes.sort(function (a, b) { return new Date(a.vencimento || '2099-01-01') - new Date(b.vencimento || '2099-01-01'); });
        pendentes.forEach(function (c) {
            var d = c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : 'Sem data';
            var venc = c.vencimento ? new Date(c.vencimento) : null;
            var vencida = venc && venc < hoje;
            html += '<tr style="' + (vencida ? 'background:#fee2e2;' : '') + '">';
            html += '<td>' + d + (vencida ? ' ⚠️' : '') + '</td>';
            html += '<td>' + (c.nome || c.desc || '--') + '</td>';
            html += '<td>' + (c.categoria || '--') + '</td>';
            html += '<td class="negative">' + self._fmt(c.value || 0) + '</td></tr>';
        });
        html += '</tbody></table>';

        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            var projecoes = [];
            lotes.forEach(function (l) {
                if (window.lotes.projecaoAbate) {
                    var proj = window.lotes.projecaoAbate(l, 550);
                    if (proj) {
                        var arrobas = (l.qtdAnimais || 0) * 550 / 30;
                        var precoArr = parseFloat(localStorage.getItem('agromacro_preco_arroba') || '0');
                        projecoes.push({
                            lote: l.nome,
                            cabecas: l.qtdAnimais,
                            dias: proj.dias,
                            data: proj.dataEstimada,
                            arrobas: arrobas,
                            valorEstimado: arrobas * precoArr
                        });
                    }
                }
            });

            if (projecoes.length > 0) {
                html += '<h2>Projecao de Receitas (Vendas Futuras)</h2>';
                html += '<table><thead><tr><th>Lote</th><th>Cabecas</th><th>Dias p/ Abate</th><th>Data Est.</th><th>Arrobas</th><th>Valor Est.</th></tr></thead><tbody>';
                projecoes.forEach(function (p) {
                    html += '<tr><td>' + p.lote + '</td>';
                    html += '<td>' + p.cabecas + '</td>';
                    html += '<td>' + (p.dias || '--') + '</td>';
                    html += '<td>' + (p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '--') + '</td>';
                    html += '<td>' + p.arrobas.toFixed(0) + '</td>';
                    html += '<td class="positive">' + self._fmt(p.valorEstimado) + '</td></tr>';
                });
                html += '</tbody></table>';
            }
        }

        html += self._footer();
        self._abrir(html, modo);
    }
};
