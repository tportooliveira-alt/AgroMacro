// ====== MÓDULO: RELATÓRIO PDF (Impressão via window.print) ======
window.relatorio = {
    init: function () {
        console.log('Relatorio Module Ready');
    },

    // ══ GERAR RELATÓRIO MENSAL ══
    gerarRelatorio: function () {
        // Coleta dados
        var config = JSON.parse(localStorage.getItem('agromacro_config') || '{}');
        var nomeFazenda = config.nomeFazenda || 'Fazenda';
        var proprietario = config.proprietario || '';
        var cidade = config.cidade || '';
        var estado = config.estado || '';
        var hoje = new Date();
        var dataRelatorio = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

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
                if (cat === 'racao_sal' || name.indexOf('sal') >= 0 || name.indexOf('ração') >= 0 || name.indexOf('racao') >= 0) {
                    custoNutricao += (ev.value || 0);
                } else if (cat === 'remedios' || name.indexOf('vacina') >= 0) {
                    custoSanidade += (ev.value || 0);
                } else if (cat === 'obras') {
                    custoInfra += (ev.value || 0);
                }
            }
            else if ((ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') && ev.cost) {
                custoSanidade += ev.cost;
            }
            else if (ev.type === 'OBRA' && ev.workers) {
                ev.workers.forEach(function (w) { custoMaoDeObra += ((w.diaria || 0) * (w.dias || 1)); });
            }
        });

        var custoTotal = custoReposicao + custoNutricao + custoSanidade + custoInfra + custoMaoDeObra;
        var resultado = receitaGado - custoTotal;
        var fmt = function (v) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

        // Lotes ativos
        var lotesHTML = '';
        if (window.lotes) {
            window.lotes.getLotes().forEach(function (l) {
                var gmd = window.lotes.calcGMD(l);
                var gmdVal = gmd && gmd.gmd ? gmd.gmd.toFixed(3) : '--';
                lotesHTML += '<tr>' +
                    '<td>' + (l.nome || l.name) + '</td>' +
                    '<td>' + (l.qtdAnimais || 0) + '</td>' +
                    '<td>' + (l.pesoMedio || 0).toFixed(0) + ' kg</td>' +
                    '<td>' + gmdVal + ' kg/dia</td>' +
                    '<td>' + (l.categoria || '--') + '</td>' +
                    '</tr>';
            });
        }

        // Montar HTML do relatório
        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<title>Relatório - ' + nomeFazenda + '</title>' +
            '<style>' +
            'body { font-family: "Inter", "Segoe UI", sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 13px; }' +
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
            '.footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }' +
            '@media print { body { padding: 0; } }' +
            '</style></head><body>';

        // Cabeçalho
        html += '<h1>📊 ' + nomeFazenda + ' — Relatório Gerencial</h1>';
        html += '<div class="header-info">';
        html += '<span>' + (proprietario ? proprietario + ' | ' : '') + (cidade ? cidade + '/' + estado : '') + '</span>';
        html += '<span>Emitido em: ' + dataRelatorio + '</span>';
        html += '</div>';

        // KPIs
        html += '<h2>🐄 Resumo do Rebanho</h2>';
        html += '<div class="kpi-row">';
        html += '<div class="kpi"><div class="kpi-label">Cabeças</div><div class="kpi-value">' + totalAnimais + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Lotes</div><div class="kpi-value">' + totalLotes + '</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedio.toFixed(0) + ' kg</div></div>';
        html += '<div class="kpi"><div class="kpi-label">Arrobas</div><div class="kpi-value">' + arrobas.toFixed(0) + ' @</div></div>';
        html += '</div>';

        // Lotes
        if (lotesHTML) {
            html += '<h2>📋 Lotes Ativos</h2>';
            html += '<table><thead><tr><th>Lote</th><th>Cabeças</th><th>Peso</th><th>GMD</th><th>Categoria</th></tr></thead>';
            html += '<tbody>' + lotesHTML + '</tbody></table>';
        }

        // DRE
        html += '<h2>💰 Demonstrativo de Resultado</h2>';
        html += '<div class="dre-row"><span>📈 Receita de Vendas (' + vendas + ')</span><span class="positive">' + fmt(receitaGado) + '</span></div>';
        html += '<div class="dre-row"><span>🐄 Reposição de Gado (' + compras + ')</span><span class="negative">' + fmt(custoReposicao) + '</span></div>';
        html += '<div class="dre-row"><span>🧂 Nutrição</span><span class="negative">' + fmt(custoNutricao) + '</span></div>';
        html += '<div class="dre-row"><span>💊 Sanidade</span><span class="negative">' + fmt(custoSanidade) + '</span></div>';
        html += '<div class="dre-row"><span>🔨 Infraestrutura</span><span class="negative">' + fmt(custoInfra) + '</span></div>';
        html += '<div class="dre-row"><span>👷 Mão de Obra</span><span class="negative">' + fmt(custoMaoDeObra) + '</span></div>';
        html += '<div class="dre-total"><span>RESULTADO LÍQUIDO</span><span class="' + (resultado >= 0 ? 'positive' : 'negative') + '">' + fmt(resultado) + '</span></div>';

        // Cotação do rebanho
        var precoArroba = parseFloat(localStorage.getItem('agromacro_preco_arroba') || '0');
        if (precoArroba > 0) {
            var valorRebanho = arrobas * precoArroba;
            html += '<h2>🔮 Valor Estimado do Rebanho</h2>';
            html += '<div class="kpi-row">';
            html += '<div class="kpi"><div class="kpi-label">Preço /@</div><div class="kpi-value">' + fmt(precoArroba) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Total @</div><div class="kpi-value">' + arrobas.toFixed(0) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Valor em Pé</div><div class="kpi-value">' + fmt(valorRebanho) + '</div></div>';
            html += '<div class="kpi"><div class="kpi-label">Resultado + Rebanho</div><div class="kpi-value">' + fmt(valorRebanho + resultado) + '</div></div>';
            html += '</div>';
        }

        // Footer
        html += '<div class="footer">AgroMacro — Sistema de Gestão Pecuária | Gerado automaticamente</div>';
        html += '</body></html>';

        // Abrir em nova janela e imprimir
        var win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(function () { win.print(); }, 500);
        } else {
            window.app.showToast('⚠️ Pop-up bloqueado. Libere pop-ups para gerar o relatório.', 'error');
        }
    }
};
