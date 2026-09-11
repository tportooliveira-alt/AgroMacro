// ====== MÓDULO: ÍNDICES ZOOTÉCNICOS — AgroMacro ======
// Feature 1: Índices reprodutivos e produtivos (prenhez, natalidade, desmama, mortalidade)
// Feature 2: Diagnóstico de prenhez + Calendário de partos (DPP)
// Feature 3: Custo real da arroba produzida por lote (detalhado)
// Benchmarks: Embrapa / Anualpec / Scot Consultoria 2025
// =======================================================

window.zooIndices = {

    _abaAtiva: 'indices',

    // ─── BENCHMARKS ────────────────────────────────────────────────
    BENCHMARKS: {
        prenhez:      { bom: 78,  otimo: 85,  label: 'Taxa de Prenhez (%)',       unidade: '%' },
        natalidade:   { bom: 70,  otimo: 80,  label: 'Taxa de Natalidade (%)',     unidade: '%' },
        desmama:      { bom: 65,  otimo: 75,  label: 'Taxa de Desmama (%)',        unidade: '%' },
        mortalidade:  { bom: 3,   otimo: 1.5, label: 'Taxa de Mortalidade (%)',    unidade: '%', inverso: true },
        intervParto:  { bom: 14,  otimo: 12,  label: 'Intervalo entre Partos (meses)', unidade: 'meses', inverso: true },
        gmd:          { bom: 0.8, otimo: 1.2, label: 'GMD (kg/dia)',               unidade: 'kg/dia' },
        custo_arroba: { bom: 200, otimo: 186, label: 'Custo/@ produzida (R$)',     unidade: 'R$/@', inverso: true }
    },

    // DPP por raça (dias de gestação)
    GESTACAO: { nelore: 283, cruzado: 285, angus: 280, simmental: 285, gir: 290, generico: 283 },

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────
    _events: function () { return window.data ? window.data.events : []; },
    _today: function () { return new Date().toISOString().split('T')[0]; },
    _daysBetween: function (d1, d2) {
        return Math.round((new Date(d2) - new Date(d1)) / 86400000);
    },
    _addDays: function (dateStr, n) {
        var d = new Date(dateStr);
        d.setDate(d.getDate() + n);
        return d.toISOString().split('T')[0];
    },
    _formatDate: function (dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    },
    _semaforo: function (val, bench, inverso) {
        if (inverso) {
            if (val <= bench.otimo) return { cor: '#16A34A', label: 'Ótimo' };
            if (val <= bench.bom)   return { cor: '#CA8A04', label: 'Bom' };
            return { cor: '#DC2626', label: 'Atenção' };
        }
        if (val >= bench.otimo) return { cor: '#16A34A', label: 'Ótimo' };
        if (val >= bench.bom)   return { cor: '#CA8A04', label: 'Bom' };
        return { cor: '#DC2626', label: 'Atenção' };
    },
    _getRebanhoTotal: function () {
        var lotes = this._getLotesAtivos();
        return lotes.reduce(function (s, l) { return s + (l.qtdAnimais || 0); }, 0);
    },
    _getLotesAtivos: function () {
        var map = {};
        this._events().forEach(function (e) { if (e.type === 'LOTE') map[e.nome] = e; });
        return Object.values(map).filter(function (l) { return l.status === 'ATIVO'; });
    },
    _getLotesCategoria: function (categorias) {
        return this._getLotesAtivos().filter(function (l) {
            return categorias.indexOf(l.categoria || '') >= 0;
        });
    },
    _getPrecoArroba: function () {
        var cfg = {}; try { cfg = JSON.parse(localStorage.getItem('agromacro_config') || '{}'); } catch (e) {}
        if (cfg.precoArroba > 0) return parseFloat(cfg.precoArroba);
        var vendas = this._events().filter(function (e) { return e.type === 'VENDA' && e.peso && e.qty; });
        if (vendas.length > 0) {
            var last = vendas[vendas.length - 1];
            return (last.value || 0) / ((last.qty * last.peso) / 30 || 1);
        }
        return 350; // fallback
    },

    // ─────────────────────────────────────────────────────────────
    // FEATURE 1 — ÍNDICES ZOOTÉCNICOS
    // ─────────────────────────────────────────────────────────────

    calcTaxaPrenhez: function () {
        var diags = this._events().filter(function (e) { return e.type === 'DIAGNOSTICO_PRENHEZ'; });
        if (diags.length === 0) return { taxa: null, prenhes: 0, total: 0, msg: 'Sem diagnósticos registrados' };
        var total = diags.reduce(function (s, d) { return s + (d.qtdTotal || 0); }, 0);
        var prenhes = diags.reduce(function (s, d) { return s + (d.qtdPrenh || 0); }, 0);
        return { taxa: total > 0 ? +(prenhes / total * 100).toFixed(1) : 0, prenhes: prenhes, total: total, nDiags: diags.length };
    },

    calcTaxaNatalidade: function () {
        var nascimentos = this._events().filter(function (e) { return e.type === 'NASCIMENTO'; });
        var matrizes = this._getLotesCategoria(['matrizes', 'vacas', 'cria']);
        var totalMatrizes = matrizes.reduce(function (s, l) { return s + (l.qtdAnimais || 0); }, 0);
        // Fallback: total herd * 0.45 (typical cow ratio in Brazilian herds)
        if (totalMatrizes === 0) totalMatrizes = Math.round(this._getRebanhoTotal() * 0.45);
        var totalNasc = nascimentos.reduce(function (s, n) { return s + (n.qty || 0); }, 0);
        return {
            taxa: totalMatrizes > 0 ? +(totalNasc / totalMatrizes * 100).toFixed(1) : null,
            nascimentos: totalNasc, matrizes: totalMatrizes,
            msg: totalMatrizes === 0 ? 'Cadastre lotes de matrizes' : null
        };
    },

    calcTaxaDesmama: function () {
        var desmamas = this._events().filter(function (e) { return e.type === 'DESMAMA'; });
        var nasc = this.calcTaxaNatalidade();
        if (desmamas.length === 0) {
            // Estimate: natalidade * 0.92 (8% mortality pre-weaning avg Brazil)
            var est = nasc.taxa !== null ? +(nasc.taxa * 0.92).toFixed(1) : null;
            return { taxa: est, estimado: true, msg: 'Estimado (92% da natalidade). Registre desmazas para cálculo real.' };
        }
        var totalDesm = desmamas.reduce(function (s, d) { return s + (d.qty || 0); }, 0);
        var base = nasc.matrizes || 1;
        return { taxa: +(totalDesm / base * 100).toFixed(1), desmamados: totalDesm, matrizes: base, estimado: false };
    },

    calcTaxaMortalidade: function () {
        var mortes = this._events().filter(function (e) { return e.type === 'MORTALIDADE'; });
        var rebanho = this._getRebanhoTotal();
        if (rebanho === 0) return { taxa: null, msg: 'Sem rebanho cadastrado' };
        var totalMortes = mortes.reduce(function (s, m) { return s + (m.qty || 0); }, 0);
        return {
            taxa: +(totalMortes / rebanho * 100).toFixed(2),
            mortes: totalMortes, rebanho: rebanho,
            detalhes: this._resumoMortalidade(mortes)
        };
    },

    _resumoMortalidade: function (mortes) {
        var motivos = {};
        mortes.forEach(function (m) {
            var k = m.motivo || 'outro';
            motivos[k] = (motivos[k] || 0) + (m.qty || 0);
        });
        return Object.entries(motivos).map(function (e) { return { motivo: e[0], qty: e[1] }; })
            .sort(function (a, b) { return b.qty - a.qty; });
    },

    calcGMDMedio: function () {
        var lotes = this._getLotesAtivos().filter(function (l) { return l.categoria === 'engorda' || l.categoria === 'recria'; });
        if (lotes.length === 0) return { gmd: null, msg: 'Sem lotes de engorda/recria' };
        var gmds = [];
        lotes.forEach(function (l) {
            if (window.lotes && window.lotes.calcGMD) {
                var g = window.lotes.calcGMD(l);
                if (g && g.gmd > 0) gmds.push(g.gmd);
            }
        });
        if (gmds.length === 0) return { gmd: null, msg: 'Sem pesagens registradas' };
        var media = gmds.reduce(function (s, g) { return s + g; }, 0) / gmds.length;
        return { gmd: +media.toFixed(3), lotes: gmds.length };
    },

    calcIndicesCompletos: function () {
        return {
            prenhez:    this.calcTaxaPrenhez(),
            natalidade: this.calcTaxaNatalidade(),
            desmama:    this.calcTaxaDesmama(),
            mortalidade:this.calcTaxaMortalidade(),
            gmd:        this.calcGMDMedio(),
            rebanho:    this._getRebanhoTotal()
        };
    },

    // ─────────────────────────────────────────────────────────────
    // FEATURE 2 — DIAGNÓSTICO DE PRENHEZ + CALENDÁRIO DE PARTOS
    // ─────────────────────────────────────────────────────────────

    // Salva diagnóstico de prenhez vinculado a um protocolo IATF (ou manual)
    registrarDiagnostico: function (protoId, lote, dataInsem, qtdTotal, qtdPrenh, tecnico, obs, raca) {
        qtdPrenh = parseInt(qtdPrenh) || 0;
        qtdTotal = parseInt(qtdTotal) || 0;
        var qtdVazia = qtdTotal - qtdPrenh;
        var diasGestacao = this.GESTACAO[raca || 'nelore'] || 283;
        var dpp = this._addDays(dataInsem, diasGestacao);
        var taxa = qtdTotal > 0 ? +(qtdPrenh / qtdTotal * 100).toFixed(1) : 0;

        window.data.saveEvent({
            type: 'DIAGNOSTICO_PRENHEZ',
            protoId: protoId || '',
            lote: lote,
            dataInseminacao: dataInsem,
            dataInsem: dataInsem, // compat
            qtdTotal: qtdTotal,
            qtdPrenh: qtdPrenh,
            qtdVazia: qtdVazia,
            taxaPrenhez: taxa,
            dpp: dpp,
            diasGestacao: diasGestacao,
            raca: raca || 'nelore',
            tecnico: tecnico || '',
            obs: obs || '',
            date: this._today(),
            timestamp: new Date().toISOString()
        });

        // Marcar etapa D40 do protocolo IATF como concluída
        if (protoId && window.data) {
            window.data.events.forEach(function (ev) {
                if (ev.type === 'TAREFA_IATF' && ev.protocoloId === protoId && ev.tipoEtapa === 'DIAGNOSTICO') {
                    ev.status = 'CONCLUIDO';
                    ev.dataConclusao = new Date().toISOString();
                    ev.resultado = { qtdPrenh: qtdPrenh, qtdVazia: qtdVazia, taxa: taxa };
                }
            });
            window.data.save();
        }

        window.app.showToast('✅ Diagnóstico registrado — ' + qtdPrenh + '/' + qtdTotal + ' prenhes (' + taxa + '%)');
        this._renderAbaAtiva();
    },

    getCalendarioPartos: function () {
        var self = this;
        var hoje = new Date();
        var diags = this._events().filter(function (e) {
            return e.type === 'DIAGNOSTICO_PRENHEZ' && e.qtdPrenh > 0;
        });

        var partos = diags.map(function (d) {
            var dppDate = new Date(d.dpp + 'T12:00:00');
            var diasAte = self._daysBetween(self._today(), d.dpp);
            var status;
            if (diasAte < 0) status = 'realizado';
            else if (diasAte <= 15) status = 'urgente';
            else if (diasAte <= 30) status = 'proximo';
            else if (diasAte <= 90) status = 'previsto';
            else status = 'futuro';

            // Janela de parto: DPP ± 14 dias
            var dppInicio = self._addDays(d.dpp, -14);
            var dppFim    = self._addDays(d.dpp, 14);

            return {
                lote: d.lote,
                dataInseminacao: d.dataInseminacao || d.dataInsem,
                dpp: d.dpp,
                dppInicio: dppInicio,
                dppFim: dppFim,
                diasAte: diasAte,
                qtdPrenh: d.qtdPrenh,
                taxaPrenhez: d.taxaPrenhez,
                raca: d.raca,
                status: status,
                id: d.id || d.timestamp
            };
        }).filter(function (p) { return p.status !== 'realizado' || p.diasAte > -60; })
          .sort(function (a, b) { return new Date(a.dpp) - new Date(b.dpp); });

        return partos;
    },

    // Retorna protocolos IATF que já passaram do D40 e não têm diagnóstico
    getProtocolosPendenteDiag: function () {
        var self = this;
        var protos = this._events().filter(function (e) { return e.type === 'PROTOCOLO_IATF'; });
        var diagsIds = new Set(this._events()
            .filter(function (e) { return e.type === 'DIAGNOSTICO_PRENHEZ'; })
            .map(function (e) { return e.protoId; }));

        return protos.filter(function (p) {
            if (diagsIds.has(p.id)) return false;
            // Verificar se D40 já passou
            var d40 = self._addDays(p.dataInicio, 43); // D10 insem + 40 diag = D50 aprox
            return self._daysBetween(d40, self._today()) >= 0;
        });
    },

    // ─────────────────────────────────────────────────────────────
    // FEATURE 3 — CUSTO REAL DA ARROBA POR LOTE
    // ─────────────────────────────────────────────────────────────

    calcCustoRealLote: function (lote) {
        var self = this;
        var events = this._events();
        var nome = lote.nome;
        var qtd = lote.qtdAnimais || 1;

        // ── 1. Custo de Compra ──
        var custoCompra = 0;
        events.forEach(function (e) {
            if (e.type === 'COMPRA' && e.lote === nome) custoCompra += (e.value || 0);
        });

        // ── 2. Custo de Nutrição ──
        var custoNutricao = 0;
        // 2a. Manejos com tipo nutricao e custo explícito
        events.forEach(function (e) {
            if ((e.type === 'MANEJO' || e.type === 'MANEJO_SANITARIO') && e.lote === nome) {
                var tipo = (e.tipoManejo || e.tipo || '').toLowerCase();
                if (tipo === 'nutricao' || tipo === 'alimentacao') custoNutricao += (e.cost || 0);
            }
        });
        // 2b. Custo diário estimado pela configuração do lote (sal + ração × preço)
        var dias = this._getDiasCocho(lote);
        if (lote.salConsumo && qtd && dias) {
            var precoSal = this._getPrecoProduto('sal') || 1.80; // R$/kg fallback
            custoNutricao += (lote.salConsumo || 0) * qtd * dias * precoSal;
        }
        if (lote.racaoConsumo && qtd && dias) {
            var precoRacao = this._getPrecoProduto('racao') || 1.50;
            custoNutricao += (lote.racaoConsumo || 0) * qtd * dias * precoRacao;
        }

        // ── 3. Custo Sanitário ──
        var custoSanidade = 0;
        events.forEach(function (e) {
            if ((e.type === 'MANEJO' || e.type === 'MANEJO_SANITARIO') && e.lote === nome) {
                var tipo = (e.tipoManejo || e.tipo || '').toLowerCase();
                if (tipo !== 'nutricao' && tipo !== 'alimentacao' && tipo !== 'pesagem') {
                    custoSanidade += (e.cost || 0);
                }
            }
        });

        // ── 4. Overhead proporcional (obras + mão de obra) ──
        var custoOverhead = this._calcOverheadProporcional(qtd);

        // ── 5. Totais ──
        var custoTotal = custoCompra + custoNutricao + custoSanidade + custoOverhead;
        var custoCabeca = custoTotal / qtd;

        // ── 6. Arrobas produzidas ──
        var pesoEntrada = this._getPesoEntrada(lote);
        var pesoAtual = this._getPesoAtual(lote);
        var ganhoKg = Math.max(0, pesoAtual - pesoEntrada);
        var ganhoArrobas = (ganhoKg * qtd) / 30; // em pé

        // ── 7. Custo por arroba ──
        var custoArroba = ganhoArrobas > 0 ? custoTotal / ganhoArrobas : null;

        // ── 8. ROI projetado ──
        var precoArroba = this._getPrecoArroba();
        var arrobasTotais = (pesoAtual * qtd) / 30;
        var receitaProjetada = arrobasTotais * precoArroba;
        var roi = custoTotal > 0 ? +((receitaProjetada - custoTotal) / custoTotal * 100).toFixed(1) : null;
        var lucro = receitaProjetada - custoTotal;

        return {
            lote: nome, qtd: qtd, dias: dias,
            pesoEntrada: pesoEntrada, pesoAtual: pesoAtual,
            ganhoKg: +ganhoKg.toFixed(1),
            ganhoArrobas: +ganhoArrobas.toFixed(1),
            arrobasTotais: +arrobasTotais.toFixed(1),
            custoCompra: +custoCompra.toFixed(2),
            custoNutricao: +custoNutricao.toFixed(2),
            custoSanidade: +custoSanidade.toFixed(2),
            custoOverhead: +custoOverhead.toFixed(2),
            custoTotal: +custoTotal.toFixed(2),
            custoCabeca: +custoCabeca.toFixed(2),
            custoArroba: custoArroba ? +custoArroba.toFixed(2) : null,
            receitaProjetada: +receitaProjetada.toFixed(2),
            lucro: +lucro.toFixed(2),
            roi: roi,
            precoArroba: precoArroba,
            benchmarkArroba: 186
        };
    },

    calcCustoTodosLotes: function () {
        var self = this;
        return this._getLotesAtivos()
            .filter(function (l) { return l.categoria === 'engorda' || l.categoria === 'recria' || l.categoria === 'cria'; })
            .map(function (l) { return self.calcCustoRealLote(l); })
            .sort(function (a, b) { return (b.custoArroba || 0) - (a.custoArroba || 0); });
    },

    _getDiasCocho: function (lote) {
        var inicio = lote.dataEntrada || lote.date;
        if (!inicio) return 30; // fallback
        return Math.max(1, this._daysBetween(inicio, this._today()));
    },

    _getPesoEntrada: function (lote) {
        var compras = this._events().filter(function (e) { return e.type === 'COMPRA' && e.lote === lote.nome; });
        if (compras.length > 0 && compras[0].peso && compras[0].qty) {
            return compras[0].peso / compras[0].qty;
        }
        return lote.pesoEntrada || (lote.pesoMedio ? lote.pesoMedio * 0.75 : 0);
    },

    _getPesoAtual: function (lote) {
        var pesagens = this._events().filter(function (e) {
            return (e.type === 'MANEJO' || e.type === 'MANEJO_SANITARIO') &&
                e.lote === lote.nome && e.tipoManejo === 'pesagem' && e.pesoMedio;
        });
        if (pesagens.length > 0) return pesagens[pesagens.length - 1].pesoMedio;
        return lote.pesoMedio || 0;
    },

    _getPrecoProduto: function (tipo) {
        var entradas = this._events().filter(function (e) {
            return e.type === 'ESTOQUE_ENTRADA' && e.valorUnitario > 0;
        });
        var match = entradas.filter(function (e) {
            return (e.nome || e.name || '').toLowerCase().indexOf(tipo) >= 0;
        });
        if (match.length > 0) return match[match.length - 1].valorUnitario;
        return null;
    },

    _calcOverheadProporcional: function (qtdLote) {
        var totalRebanho = this._getRebanhoTotal() || 1;
        var proporcao = qtdLote / totalRebanho;
        var totalObras = this._events()
            .filter(function (e) { return e.type === 'OBRA_REGISTRO'; })
            .reduce(function (s, e) { return s + (e.custoTotal || 0); }, 0);
        // Estimar custo de mão de obra (funcionários × diária × 365 × proporção)
        var totalMaoObra = this._events()
            .filter(function (e) { return e.type === 'FUNCIONARIO_CADASTRO' && e.ativo !== false; })
            .reduce(function (s, f) { return s + ((f.diaria || 0) * 365 * 0.6); }, 0); // 60% do ano trabalhado
        return (totalObras + totalMaoObra) * proporcao;
    },

    // ─────────────────────────────────────────────────────────────
    // UI — Modal com 3 abas
    // ─────────────────────────────────────────────────────────────

    init: function () {
        console.log('ZooIndices Ready — Índices Zootécnicos, Prenhez, Custo/@');
    },

    abrirModal: function (aba) {
        this._abaAtiva = aba || 'indices';
        if (document.getElementById('modal-zoo')) return;
        this._injetarEstilos();

        var html = '<div id="modal-zoo" class="zoo-overlay">'
            + '<div class="zoo-modal">'
            + '<div class="zoo-header">'
            + '<div class="zoo-title">📈 Índices Zootécnicos</div>'
            + '<button class="zoo-close" onclick="window.zooIndices.fecharModal()">✕</button>'
            + '</div>'
            + '<div class="zoo-tabs">'
            + '<button class="zoo-tab" id="zoo-tab-indices"   onclick="window.zooIndices.abrirAba(\'indices\')">📊 Índices</button>'
            + '<button class="zoo-tab" id="zoo-tab-prenhez"  onclick="window.zooIndices.abrirAba(\'prenhez\')">🐄 Prenhez & Partos</button>'
            + '<button class="zoo-tab" id="zoo-tab-custo"    onclick="window.zooIndices.abrirAba(\'custo\')">💰 Custo/@</button>'
            + '</div>'
            + '<div id="zoo-body" class="zoo-body"></div>'
            + '</div>'
            + '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
        this.abrirAba(this._abaAtiva);
    },

    fecharModal: function () {
        var el = document.getElementById('modal-zoo');
        if (el) el.remove();
    },

    abrirAba: function (aba) {
        this._abaAtiva = aba;
        ['indices', 'prenhez', 'custo'].forEach(function (t) {
            var el = document.getElementById('zoo-tab-' + t);
            if (el) el.classList.toggle('ativa', t === aba);
        });
        var body = document.getElementById('zoo-body');
        if (!body) return;
        if (aba === 'indices')  body.innerHTML = this._renderIndices();
        else if (aba === 'prenhez') body.innerHTML = this._renderPrenhez();
        else if (aba === 'custo')   body.innerHTML = this._renderCusto();
    },

    _renderAbaAtiva: function () {
        var body = document.getElementById('zoo-body');
        if (!body) return;
        this.abrirAba(this._abaAtiva);
    },

    // ── ABA ÍNDICES ──
    _renderIndices: function () {
        var idx = this.calcIndicesCompletos();
        var self = this;

        var cards = [
            {
                key: 'prenhez', val: idx.prenhez.taxa, suf: '%',
                detalhe: idx.prenhez.prenhes + ' prenhes / ' + idx.prenhez.total + ' expostas',
                msg: idx.prenhez.msg
            },
            {
                key: 'natalidade', val: idx.natalidade.taxa, suf: '%',
                detalhe: idx.natalidade.nascimentos + ' bezerros / ' + idx.natalidade.matrizes + ' matrizes',
                msg: idx.natalidade.msg
            },
            {
                key: 'desmama', val: idx.desmama.taxa, suf: '%',
                detalhe: idx.desmama.estimado ? '(estimado)' : (idx.desmama.desmamados + ' desmamados'),
                msg: idx.desmama.msg
            },
            {
                key: 'mortalidade', val: idx.mortalidade.taxa, suf: '%',
                detalhe: idx.mortalidade.mortes + ' mortes / ' + idx.mortalidade.rebanho + ' cab',
                msg: idx.mortalidade.msg
            },
            {
                key: 'gmd', val: idx.gmd.gmd, suf: ' kg/dia',
                detalhe: idx.gmd.lotes ? idx.gmd.lotes + ' lote(s) com pesagem' : '',
                msg: idx.gmd.msg
            }
        ];

        var html = '<div class="zoo-pad">';
        html += '<div class="zoo-subtitle">Rebanho total: <strong>' + idx.rebanho + ' cabeças</strong></div>';
        html += '<div class="zoo-cards">';

        cards.forEach(function (c) {
            var bench = self.BENCHMARKS[c.key];
            var semaf = c.val !== null ? self._semaforo(c.val, bench, bench.inverso) : null;
            html += '<div class="zoo-card">';
            if (c.val !== null && semaf) {
                html += '<div class="zoo-card-val" style="color:' + semaf.cor + '">' + c.val + c.suf + '</div>';
                html += '<div class="zoo-card-status" style="color:' + semaf.cor + '">' + semaf.label + '</div>';
            } else {
                html += '<div class="zoo-card-val" style="color:#94A3B8">—</div>';
                html += '<div class="zoo-card-status" style="color:#94A3B8">' + (c.msg ? 'Sem dados' : '—') + '</div>';
            }
            html += '<div class="zoo-card-title">' + bench.label + '</div>';
            html += '<div class="zoo-card-det">' + (c.detalhe || '') + '</div>';
            html += '<div class="zoo-bench">Meta: ' + (bench.inverso ? '≤' : '≥') + bench.bom + bench.unidade + ' | Ótimo: ' + (bench.inverso ? '≤' : '≥') + bench.otimo + bench.unidade + '</div>';
            html += '</div>';
        });

        html += '</div>';

        // Mortalidade por motivo
        if (idx.mortalidade.detalhes && idx.mortalidade.detalhes.length > 0) {
            html += '<div class="zoo-section-title">Mortalidade por Motivo</div>';
            html += '<div class="zoo-lista">';
            idx.mortalidade.detalhes.forEach(function (d) {
                html += '<div class="zoo-lista-row"><span>' + d.motivo.replace('_', ' ') + '</span><strong>' + d.qty + ' cab</strong></div>';
            });
            html += '</div>';
        }

        // Protocolos IATF pendentes de diagnóstico
        var pendentes = this.getProtocolosPendenteDiag();
        if (pendentes.length > 0) {
            html += '<div class="zoo-alerta">⚠️ ' + pendentes.length + ' protocolo(s) IATF aguardando diagnóstico de prenhez.'
                + ' <button class="zoo-link" onclick="window.zooIndices.abrirAba(\'prenhez\')">Registrar →</button></div>';
        }

        html += '</div>';
        return html;
    },

    // ── ABA PRENHEZ & PARTOS ──
    _renderPrenhez: function () {
        var self = this;
        var partos = this.getCalendarioPartos();
        var pendentes = this.getProtocolosPendenteDiag();

        // Opções de protocolos para o select
        var optsProto = '<option value="">Diagnóstico avulso (sem protocolo)</option>';
        pendentes.forEach(function (p) {
            optsProto += '<option value="' + (p.id || '') + '">' + p.lote + ' — IATF ' + self._formatDate(p.dataInicio) + '</option>';
        });

        // Opções de lotes
        var optsLote = '<option value="">Selecionar lote...</option>';
        this._getLotesAtivos().forEach(function (l) {
            if (l.categoria === 'matrizes' || l.categoria === 'vacas' || l.categoria === 'cria') {
                optsLote += '<option value="' + l.nome + '">' + l.nome + ' (' + l.qtdAnimais + ' cab)</option>';
            }
        });
        if (optsLote === '<option value="">Selecionar lote...</option>') {
            this._getLotesAtivos().forEach(function (l) {
                optsLote += '<option value="' + l.nome + '">' + l.nome + ' (' + (l.categoria || '') + ')</option>';
            });
        }

        var html = '<div class="zoo-pad">';

        // Formulário de diagnóstico
        html += '<div class="zoo-form-box">';
        html += '<div class="zoo-section-title">+ Registrar Diagnóstico de Prenhez</div>';
        html += '<div class="zoo-form-row">';
        html += '<div class="zoo-f"><label>Protocolo IATF</label><select id="zp-proto">' + optsProto + '</select></div>';
        html += '<div class="zoo-f"><label>Lote de Matrizes</label><select id="zp-lote">' + optsLote + '</select></div>';
        html += '</div>';
        html += '<div class="zoo-form-row">';
        html += '<div class="zoo-f"><label>Data Inseminação (D10)</label><input type="date" id="zp-data-insem" value="' + this._today() + '"></div>';
        html += '<div class="zoo-f"><label>Total Inseminadas</label><input type="number" id="zp-total" min="1" placeholder="ex: 50"></div>';
        html += '<div class="zoo-f"><label>Confirmadas Prenhes</label><input type="number" id="zp-prenh" min="0" placeholder="ex: 42"></div>';
        html += '</div>';
        html += '<div class="zoo-form-row">';
        html += '<div class="zoo-f"><label>Raça (para gestação)</label><select id="zp-raca">';
        html += '<option value="nelore">Nelore (283 dias)</option>';
        html += '<option value="cruzado">Cruzado (285 dias)</option>';
        html += '<option value="angus">Angus (280 dias)</option>';
        html += '<option value="gir">Gir (290 dias)</option>';
        html += '<option value="generico">Genérico (283 dias)</option>';
        html += '</select></div>';
        html += '<div class="zoo-f"><label>Técnico</label><input type="text" id="zp-tecnico" placeholder="Inseminador ou Médico Vet."></div>';
        html += '</div>';
        html += '<button class="zoo-btn-primary" onclick="window.zooIndices._salvarDiagnostico()">Salvar Diagnóstico</button>';
        html += '</div>';

        // Pré-preencher lote se há protocolo pendente
        if (pendentes.length > 0) {
            var self2 = this;
            setTimeout(function () {
                var sel = document.getElementById('zp-proto');
                if (sel && pendentes[0]) {
                    sel.value = pendentes[0].id || '';
                    self2._preencherProtocolo();
                }
            }, 50);
        }

        // Calendário de partos
        html += '<div class="zoo-section-title" style="margin-top:16px">📅 Calendário de Partos</div>';

        if (partos.length === 0) {
            html += '<div class="zoo-vazio">Nenhum parto previsto. Registre um diagnóstico de prenhez para gerar o calendário.</div>';
        } else {
            var statusCores = { urgente: '#DC2626', proximo: '#CA8A04', previsto: '#2563EB', futuro: '#64748B', realizado: '#16A34A' };
            var statusLabel = { urgente: '🚨 Urgente', proximo: '⚠️ Em breve', previsto: '📅 Previsto', futuro: '🔵 Futuro', realizado: '✅ Realizado' };
            partos.forEach(function (p) {
                html += '<div class="zoo-parto-card">';
                html += '<div class="zoo-parto-header">';
                html += '<span class="zoo-parto-lote">' + p.lote + '</span>';
                html += '<span style="color:' + statusCores[p.status] + ';font-weight:700;font-size:12px">' + statusLabel[p.status] + '</span>';
                html += '</div>';
                html += '<div class="zoo-parto-body">';
                html += '<div class="zoo-parto-stat"><span>' + p.qtdPrenh + ' crias</span><small>prenhes</small></div>';
                html += '<div class="zoo-parto-stat"><span>' + self._formatDate(p.dpp) + '</span><small>DPP</small></div>';
                html += '<div class="zoo-parto-stat"><span>' + (p.diasAte >= 0 ? p.diasAte + 'd' : Math.abs(p.diasAte) + 'd atrás') + '</span><small>dias</small></div>';
                html += '<div class="zoo-parto-stat"><span>' + p.taxaPrenhez + '%</span><small>prenhez</small></div>';
                html += '</div>';
                html += '<div style="font-size:11px;color:#64748B;margin-top:4px">Janela: ' + self._formatDate(p.dppInicio) + ' até ' + self._formatDate(p.dppFim) + '</div>';
                html += '</div>';
            });
        }

        html += '</div>';
        return html;
    },

    _preencherProtocolo: function () {
        var sel = document.getElementById('zp-proto');
        if (!sel || !sel.value) return;
        var proto = this._events().find(function (e) { return e.type === 'PROTOCOLO_IATF' && (e.id || '') === sel.value; });
        if (!proto) return;
        var loteEl = document.getElementById('zp-lote');
        if (loteEl && proto.lote) loteEl.value = proto.lote;
        // D10 = dataInicio + 10 dias
        var d10 = this._addDays(proto.dataInicio, 10);
        var dataEl = document.getElementById('zp-data-insem');
        if (dataEl) dataEl.value = d10;
        // Buscar qtd animais do lote
        var lote = window.lotes ? window.lotes.getLoteByNome(proto.lote) : null;
        if (lote) {
            var totalEl = document.getElementById('zp-total');
            if (totalEl) totalEl.value = lote.qtdAnimais || '';
        }
    },

    _salvarDiagnostico: function () {
        var protoId = (document.getElementById('zp-proto') || {}).value || '';
        var lote    = (document.getElementById('zp-lote') || {}).value;
        var dataI   = (document.getElementById('zp-data-insem') || {}).value;
        var total   = parseInt((document.getElementById('zp-total') || {}).value) || 0;
        var prenh   = parseInt((document.getElementById('zp-prenh') || {}).value) || 0;
        var raca    = (document.getElementById('zp-raca') || {}).value || 'nelore';
        var tecnico = (document.getElementById('zp-tecnico') || {}).value || '';

        if (!lote || !dataI || !total) {
            window.app.showToast('Preencha lote, data e total inseminadas.', 'error'); return;
        }
        if (prenh > total) {
            window.app.showToast('Prenhes não pode ser maior que o total.', 'error'); return;
        }
        this.registrarDiagnostico(protoId, lote, dataI, total, prenh, tecnico, '', raca);
    },

    // ── ABA CUSTO DA ARROBA ──
    _renderCusto: function () {
        var lotes = this.calcCustoTodosLotes();
        var precoArroba = this._getPrecoArroba();

        var html = '<div class="zoo-pad">';
        html += '<div class="zoo-subtitle">Preço arroba atual: <strong>R$ ' + precoArroba.toFixed(2) + '/@</strong> &nbsp;|&nbsp; Benchmark custo: <strong>R$ 186/@</strong> (Scot 2025)</div>';

        if (lotes.length === 0) {
            html += '<div class="zoo-vazio">Nenhum lote de engorda/recria ativo.</div>';
            html += '</div>'; return html;
        }

        lotes.forEach(function (r) {
            var statusArroba = r.custoArroba !== null
                ? (r.custoArroba <= 186 ? { cor: '#16A34A', label: 'Abaixo do benchmark ✅' }
                    : r.custoArroba <= 220 ? { cor: '#CA8A04', label: 'Acima do benchmark ⚠️' }
                    : { cor: '#DC2626', label: 'Muito alto ⚠️' })
                : null;
            var roiCor = !r.roi ? '#64748B' : r.roi >= 10 ? '#16A34A' : r.roi >= 0 ? '#CA8A04' : '#DC2626';

            html += '<div class="zoo-custo-card">';
            html += '<div class="zoo-custo-header">';
            html += '<span class="zoo-custo-lote">' + r.lote + '</span>';
            html += '<span style="font-size:12px;color:#64748B">' + r.qtd + ' cab · ' + r.dias + ' dias</span>';
            html += '</div>';

            // Custo/@ destaque
            html += '<div class="zoo-custo-destaque">';
            if (r.custoArroba !== null) {
                html += '<div style="text-align:center">';
                html += '<div style="font-size:28px;font-weight:800;color:' + statusArroba.cor + '">R$ ' + r.custoArroba.toFixed(2) + '</div>';
                html += '<div style="font-size:11px;font-weight:600;color:' + statusArroba.cor + '">/ @ produzida &nbsp;' + statusArroba.label + '</div>';
                html += '</div>';
            } else {
                html += '<div style="color:#94A3B8;font-size:13px">Sem pesagens — custo/@ indisponível</div>';
            }
            html += '<div style="text-align:center">';
            html += '<div style="font-size:20px;font-weight:700;color:' + roiCor + '">' + (r.roi !== null ? (r.roi > 0 ? '+' : '') + r.roi + '%' : '—') + '</div>';
            html += '<div style="font-size:11px;color:' + roiCor + '">ROI projetado</div>';
            html += '</div>';
            html += '</div>';

            // Breakdown de custos
            html += '<div class="zoo-custo-break">';
            var itens = [
                { label: '🐄 Compra de gado', val: r.custoCompra },
                { label: '🌾 Nutrição (sal + ração)', val: r.custoNutricao },
                { label: '💉 Sanidade', val: r.custoSanidade },
                { label: '🔧 Overhead (obras/pessoal)', val: r.custoOverhead }
            ];
            itens.forEach(function (i) {
                if (i.val <= 0) return;
                var pct = r.custoTotal > 0 ? (i.val / r.custoTotal * 100).toFixed(0) : 0;
                html += '<div class="zoo-break-row">';
                html += '<span>' + i.label + '</span>';
                html += '<div style="display:flex;align-items:center;gap:8px">';
                html += '<div style="width:60px;height:6px;background:#E2E8F0;border-radius:3px"><div style="width:' + pct + '%;height:100%;background:#2563EB;border-radius:3px"></div></div>';
                html += '<span style="font-size:12px;font-weight:600">R$ ' + i.val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' (' + pct + '%)</span>';
                html += '</div></div>';
            });
            html += '</div>';

            // Resumo financeiro
            html += '<div class="zoo-custo-resumo">';
            html += '<div class="zoo-custo-stat"><span>R$ ' + r.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><small>Custo total</small></div>';
            html += '<div class="zoo-custo-stat"><span>R$ ' + r.custoCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><small>Custo/cabeça</small></div>';
            html += '<div class="zoo-custo-stat"><span>' + r.ganhoArrobas.toFixed(1) + '@</span><small>@ produzidas</small></div>';
            html += '<div class="zoo-custo-stat" style="color:' + (r.lucro >= 0 ? '#16A34A' : '#DC2626') + '"><span>R$ ' + r.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '</span><small>Lucro projetado</small></div>';
            html += '</div>';

            // Peso
            if (r.pesoEntrada > 0) {
                html += '<div style="font-size:11px;color:#64748B;padding:6px 0">Peso entrada: ' + r.pesoEntrada.toFixed(0) + ' kg → atual: ' + r.pesoAtual.toFixed(0) + ' kg (ganho: +' + r.ganhoKg.toFixed(1) + ' kg)</div>';
            }
            html += '</div>'; // zoo-custo-card
        });

        html += '</div>';
        return html;
    },

    // ─────────────────────────────────────────────────────────────
    // ESTILOS
    // ─────────────────────────────────────────────────────────────
    _injetarEstilos: function () {
        if (document.getElementById('zoo-styles')) return;
        var s = document.createElement('style');
        s.id = 'zoo-styles';
        s.textContent = `
.zoo-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9200;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.zoo-overlay{align-items:center}}
.zoo-modal{background:#fff;width:100%;max-width:680px;max-height:92vh;border-radius:16px 16px 0 0;display:flex;flex-direction:column;overflow:hidden}
@media(min-width:600px){.zoo-modal{border-radius:16px;max-height:88vh}}
.zoo-header{display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #E2E8F0;background:#EFF6FF}
.zoo-title{font-weight:700;font-size:16px;color:#1D4ED8;flex:1}
.zoo-close{background:none;border:none;font-size:20px;cursor:pointer;color:#64748B;padding:0 4px}
.zoo-tabs{display:flex;border-bottom:1px solid #E2E8F0;background:#F8FAFC;overflow-x:auto}
.zoo-tab{flex:1;min-width:80px;padding:10px 6px;border:none;background:none;font-size:11px;font-weight:600;color:#64748B;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
.zoo-tab.ativa{color:#1D4ED8;border-bottom-color:#1D4ED8;background:#fff}
.zoo-body{flex:1;overflow-y:auto}
.zoo-pad{padding:14px}
.zoo-subtitle{font-size:12px;color:#64748B;margin-bottom:12px}
.zoo-section-title{font-weight:700;font-size:12px;color:#374151;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 6px;border-top:1px solid #E2E8F0;margin-top:4px}
.zoo-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:500px){.zoo-cards{grid-template-columns:repeat(3,1fr)}}
.zoo-card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center}
.zoo-card-val{font-size:22px;font-weight:800;line-height:1.1}
.zoo-card-status{font-size:10px;font-weight:700;margin:2px 0}
.zoo-card-title{font-size:11px;font-weight:600;color:#374151;margin-top:4px}
.zoo-card-det{font-size:10px;color:#64748B;margin-top:2px}
.zoo-bench{font-size:10px;color:#94A3B8;margin-top:4px;padding-top:4px;border-top:1px solid #E2E8F0}
.zoo-alerta{background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:10px 12px;font-size:13px;margin-top:12px;color:#92400E}
.zoo-link{background:none;border:none;color:#1D4ED8;font-weight:700;cursor:pointer;font-size:12px;padding:0}
.zoo-lista{border:1px solid #E2E8F0;border-radius:8px;overflow:hidden}
.zoo-lista-row{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #F1F5F9;font-size:13px}
.zoo-vazio{text-align:center;padding:30px 16px;color:#94A3B8;font-size:13px}
.zoo-form-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;margin-bottom:4px}
.zoo-form-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.zoo-f{flex:1;min-width:120px;display:flex;flex-direction:column;gap:3px}
.zoo-f label{font-size:11px;font-weight:600;color:#374151}
.zoo-f input,.zoo-f select{padding:7px 9px;border:1px solid #E2E8F0;border-radius:7px;font-size:13px}
.zoo-btn-primary{background:#1D4ED8;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;margin-top:4px}
.zoo-parto-card{border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;margin-bottom:8px}
.zoo-parto-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.zoo-parto-lote{font-weight:700;font-size:14px}
.zoo-parto-body{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.zoo-parto-stat{text-align:center;background:#F8FAFC;border-radius:6px;padding:5px}
.zoo-parto-stat span{display:block;font-size:13px;font-weight:700;color:#1E293B}
.zoo-parto-stat small{font-size:10px;color:#64748B}
.zoo-custo-card{border:1px solid #E2E8F0;border-radius:12px;padding:12px;margin-bottom:12px}
.zoo-custo-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.zoo-custo-lote{font-weight:700;font-size:15px}
.zoo-custo-destaque{display:flex;justify-content:space-around;background:#F8FAFC;border-radius:8px;padding:12px;margin-bottom:10px}
.zoo-custo-break{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.zoo-break-row{display:flex;justify-content:space-between;align-items:center;font-size:12px}
.zoo-custo-resumo{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
@media(min-width:400px){.zoo-custo-resumo{grid-template-columns:repeat(4,1fr)}}
.zoo-custo-stat{background:#F8FAFC;border-radius:7px;padding:7px;text-align:center}
.zoo-custo-stat span{display:block;font-size:13px;font-weight:700;color:#1E293B}
.zoo-custo-stat small{font-size:10px;color:#64748B}
        `;
        document.head.appendChild(s);
    }
};
