// ====== MÓDULO: GESTÃO DE LOTES (Turbinado) ======
// Raça, Nutrição com previsão, Trocar Pasto, Juntar Lotes, Abastecer Cocho
window.lotes = {
    init: function () {
        console.log('Lotes Module Ready (v2)');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-lote');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.lotes.save();
            });
        }
    },

    save: function () {
        var nome = document.getElementById('lote-nome').value;
        var categoria = document.getElementById('lote-categoria').value;
        var raca = document.getElementById('lote-raca') ? document.getElementById('lote-raca').value : '';
        var qtdAnimais = parseInt(document.getElementById('lote-qtd').value) || 0;
        var pesoMedio = parseFloat(document.getElementById('lote-peso-medio').value) || 0;
        var pasto = document.getElementById('lote-pasto').value;
        var dataEntrada = document.getElementById('lote-data-entrada').value;
        var salMineral = document.getElementById('lote-sal').value;
        var salConsumo = parseFloat(document.getElementById('lote-sal-consumo').value) || 0;
        var racao = document.getElementById('lote-racao').value;
        var racaoConsumo = parseFloat(document.getElementById('lote-racao-consumo').value) || 0;
        var obs = document.getElementById('lote-obs').value;

        if (!nome || !qtdAnimais) {
            window.app.showToast('Preencha nome e quantidade.', 'error');
            return;
        }

        var lote = {
            type: 'LOTE',
            nome: nome,
            categoria: categoria,
            raca: raca,
            qtdAnimais: qtdAnimais,
            pesoMedio: pesoMedio,
            pasto: pasto,
            dataEntrada: dataEntrada,
            salMineral: salMineral,
            salConsumo: salConsumo,
            racao: racao,
            racaoConsumo: racaoConsumo,
            obs: obs,
            status: 'ATIVO',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        window.data.saveEvent(lote);
        window.app.showToast('✅ Lote ' + nome + ' cadastrado!');
        document.getElementById('form-lote').reset();
        this.renderList();
    },

    // ====== GET LOTES ATIVOS ======
    getLotes: function () {
        var lotesMap = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'LOTE') {
                lotesMap[ev.nome] = ev;
            }
        });
        var result = [];
        for (var key in lotesMap) {
            if (lotesMap[key].status === 'ATIVO') result.push(lotesMap[key]);
        }
        return result;
    },

    // Get latest version of a lot (handles updates)
    getLoteByNome: function (nome) {
        var lotes = window.data.events.filter(function (ev) {
            return ev.type === 'LOTE' && ev.nome === nome;
        });
        return lotes.length > 0 ? lotes[lotes.length - 1] : null;
    },

    // ====== NUTRIÇÃO: Calcular Duração ======
    calcDuracaoNutricao: function (lote) {
        var result = { sal: null, racao: null };

        // Find last abastecimento for this lote
        var abastecimentos = window.data.events.filter(function (ev) {
            return ev.type === 'ABASTECIMENTO' && ev.lote === lote.nome;
        });

        abastecimentos.forEach(function (ab) {
            var consumoDiarioTotal = 0;
            var qtdKg = ab.qtdKg || 0;

            if (ab.produto === 'sal' && lote.salConsumo && lote.qtdAnimais) {
                // salConsumo is in g/cab/dia, convert to kg
                consumoDiarioTotal = (lote.salConsumo / 1000) * lote.qtdAnimais;
                if (consumoDiarioTotal > 0) {
                    var diasTotal = qtdKg / consumoDiarioTotal;
                    var dataAb = new Date(ab.date);
                    var hoje = new Date();
                    var diasPassados = Math.floor((hoje - dataAb) / (1000 * 60 * 60 * 24));
                    var diasRestantes = Math.max(0, Math.round(diasTotal - diasPassados));
                    result.sal = { diasTotal: Math.round(diasTotal), diasRestantes: diasRestantes, qtdKg: qtdKg, dataAbastecimento: ab.date };
                }
            }

            if (ab.produto === 'racao' && lote.racaoConsumo && lote.qtdAnimais) {
                // racaoConsumo is in kg/cab/dia
                consumoDiarioTotal = lote.racaoConsumo * lote.qtdAnimais;
                if (consumoDiarioTotal > 0) {
                    var diasTotalR = qtdKg / consumoDiarioTotal;
                    var dataAbR = new Date(ab.date);
                    var hojeR = new Date();
                    var diasPassadosR = Math.floor((hojeR - dataAbR) / (1000 * 60 * 60 * 24));
                    var diasRestantesR = Math.max(0, Math.round(diasTotalR - diasPassadosR));
                    result.racao = { diasTotal: Math.round(diasTotalR), diasRestantes: diasRestantesR, qtdKg: qtdKg, dataAbastecimento: ab.date };
                }
            }
        });

        return result;
    },

    // ====== TROCAR PASTO ======
    trocarPasto: function (loteNome) {
        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        var modal = document.getElementById('modal-trocar-pasto');
        if (!modal) return;

        document.getElementById('modal-tp-lote').textContent = loteNome;
        document.getElementById('modal-tp-atual').textContent = lote.pasto || 'Nenhum';

        // Populate pastos dropdown
        var select = document.getElementById('modal-tp-novo-pasto');
        var pastos = window.pastos ? window.pastos.getPastos() : [];
        var html = '<option value="">Selecionar...</option>';
        pastos.forEach(function (p) {
            if (p.nome !== lote.pasto) {
                html += '<option value="' + p.nome + '">' + p.nome + ' (' + (p.area || 0) + ' ha)</option>';
            }
        });
        select.innerHTML = html;

        modal.classList.add('active');
    },

    confirmarTrocaPasto: function () {
        var loteNome = document.getElementById('modal-tp-lote').textContent;
        var novoPasto = document.getElementById('modal-tp-novo-pasto').value;

        if (!novoPasto) {
            window.app.showToast('Selecione o novo pasto.', 'error');
            return;
        }

        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        var pastoAntigo = lote.pasto;

        // Save movimentacao event
        window.data.saveEvent({
            type: 'MOVIMENTACAO_PASTO',
            lote: loteNome,
            pastoAnterior: pastoAntigo,
            pastoNovo: novoPasto,
            qtdAnimais: lote.qtdAnimais,
            date: new Date().toISOString().split('T')[0]
        });

        // Update the lot with new pasto
        lote.pasto = novoPasto;
        window.data.save();

        this.fecharModal('modal-trocar-pasto');
        window.app.showToast('🔄 Lote ' + loteNome + ' movido para ' + novoPasto + '!');
        this.renderList();
    },

    // ====== JUNTAR LOTES ======
    abrirJuntarLotes: function () {
        var modal = document.getElementById('modal-juntar-lotes');
        if (!modal) return;

        var lotes = this.getLotes();
        var container = document.getElementById('modal-jl-lista');
        container.innerHTML = lotes.map(function (l) {
            return '<label class="checkbox-item">'
                + '<input type="checkbox" value="' + l.nome + '"> '
                + '<strong>' + l.nome + '</strong> (' + l.qtdAnimais + ' cab, ' + (l.pesoMedio || 0) + 'kg)'
                + '</label>';
        }).join('');

        document.getElementById('modal-jl-novo-nome').value = '';
        modal.classList.add('active');
    },

    confirmarJuntarLotes: function () {
        var novoNome = document.getElementById('modal-jl-novo-nome').value;
        if (!novoNome) {
            window.app.showToast('Informe o nome do novo lote.', 'error');
            return;
        }

        var checkboxes = document.querySelectorAll('#modal-jl-lista input[type="checkbox"]:checked');
        if (checkboxes.length < 2) {
            window.app.showToast('Selecione pelo menos 2 lotes.', 'error');
            return;
        }

        var lotesParaJuntar = [];
        var self = this;
        checkboxes.forEach(function (cb) {
            var lote = self.getLoteByNome(cb.value);
            if (lote) lotesParaJuntar.push(lote);
        });

        // Calculate merged values
        var totalAnimais = 0;
        var somaPeso = 0;
        var racas = {};
        var categorias = {};

        lotesParaJuntar.forEach(function (l) {
            totalAnimais += (l.qtdAnimais || 0);
            somaPeso += (l.qtdAnimais || 0) * (l.pesoMedio || 0);
            if (l.raca) racas[l.raca] = (racas[l.raca] || 0) + (l.qtdAnimais || 0);
            if (l.categoria) categorias[l.categoria] = (categorias[l.categoria] || 0) + (l.qtdAnimais || 0);
        });

        var pesoMedio = totalAnimais > 0 ? Math.round(somaPeso / totalAnimais) : 0;

        // Find most common raca
        var racaPredominante = '';
        var maxRaca = 0;
        for (var r in racas) {
            if (racas[r] > maxRaca) { maxRaca = racas[r]; racaPredominante = r; }
        }

        // Find most common category
        var categoriaPredominante = '';
        var maxCat = 0;
        for (var c in categorias) {
            if (categorias[c] > maxCat) { maxCat = categorias[c]; categoriaPredominante = c; }
        }

        // Inactivate old lots
        lotesParaJuntar.forEach(function (l) {
            l.status = 'INATIVO';
        });
        window.data.save();

        // Create new merged lot
        var novoLote = {
            type: 'LOTE',
            nome: novoNome,
            categoria: categoriaPredominante,
            raca: racaPredominante,
            qtdAnimais: totalAnimais,
            pesoMedio: pesoMedio,
            pasto: lotesParaJuntar[0].pasto || '',
            salMineral: lotesParaJuntar[0].salMineral || '',
            salConsumo: lotesParaJuntar[0].salConsumo || 0,
            racao: lotesParaJuntar[0].racao || '',
            racaoConsumo: lotesParaJuntar[0].racaoConsumo || 0,
            obs: 'Junção de: ' + lotesParaJuntar.map(function (l) { return l.nome; }).join(', '),
            status: 'ATIVO',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            lotesOrigem: lotesParaJuntar.map(function (l) { return l.nome; })
        };

        window.data.saveEvent(novoLote);

        // Save merge event
        window.data.saveEvent({
            type: 'JUNCAO_LOTES',
            lotesOrigem: lotesParaJuntar.map(function (l) { return l.nome; }),
            loteNovo: novoNome,
            totalAnimais: totalAnimais,
            pesoMedio: pesoMedio,
            date: new Date().toISOString().split('T')[0]
        });

        this.fecharModal('modal-juntar-lotes');
        window.app.showToast('🔗 ' + lotesParaJuntar.length + ' lotes unidos em "' + novoNome + '" (' + totalAnimais + ' cab, ' + pesoMedio + 'kg médio)');
        this.renderList();
    },

    // ====== ABASTECER COCHO ======
    abrirAbastecer: function (loteNome, produto) {
        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        var modal = document.getElementById('modal-abastecer');
        if (!modal) return;

        document.getElementById('modal-ab-lote').textContent = loteNome;
        var isProdSal = (produto === 'sal');
        document.getElementById('modal-ab-tipo').textContent = isProdSal ? '🧂 Sal: ' + (lote.salMineral || 'Sal') : '🌾 Ração: ' + (lote.racao || 'Ração');
        document.getElementById('modal-ab-produto').value = produto;

        // Show consumption info
        var consumoInfo = '';
        if (isProdSal && lote.salConsumo && lote.qtdAnimais) {
            var consumoDia = (lote.salConsumo / 1000) * lote.qtdAnimais;
            consumoInfo = 'Consumo: ' + lote.salConsumo + 'g/cab/dia × ' + lote.qtdAnimais + ' cab = ' + consumoDia.toFixed(1) + ' kg/dia';
        } else if (!isProdSal && lote.racaoConsumo && lote.qtdAnimais) {
            var consumoDiaR = lote.racaoConsumo * lote.qtdAnimais;
            consumoInfo = 'Consumo: ' + lote.racaoConsumo + 'kg/cab/dia × ' + lote.qtdAnimais + ' cab = ' + consumoDiaR.toFixed(1) + ' kg/dia';
        }
        document.getElementById('modal-ab-consumo-info').textContent = consumoInfo;

        document.getElementById('modal-ab-sacos').value = '';
        document.getElementById('modal-ab-kg-saco').value = '25';
        document.getElementById('modal-ab-previsao').textContent = '';

        modal.classList.add('active');
    },

    calcPrevisaoAbastecimento: function () {
        var sacos = parseInt(document.getElementById('modal-ab-sacos').value) || 0;
        var kgSaco = parseFloat(document.getElementById('modal-ab-kg-saco').value) || 25;
        var loteNome = document.getElementById('modal-ab-lote').textContent;
        var produto = document.getElementById('modal-ab-produto').value;
        var lote = this.getLoteByNome(loteNome);
        if (!lote || sacos === 0) {
            document.getElementById('modal-ab-previsao').textContent = '';
            return;
        }

        var totalKg = sacos * kgSaco;
        var consumoDia = 0;

        if (produto === 'sal' && lote.salConsumo && lote.qtdAnimais) {
            consumoDia = (lote.salConsumo / 1000) * lote.qtdAnimais;
        } else if (produto === 'racao' && lote.racaoConsumo && lote.qtdAnimais) {
            consumoDia = lote.racaoConsumo * lote.qtdAnimais;
        }

        if (consumoDia > 0) {
            var dias = Math.round(totalKg / consumoDia);
            document.getElementById('modal-ab-previsao').innerHTML =
                '<strong>' + sacos + ' sacos × ' + kgSaco + 'kg = ' + totalKg + 'kg</strong><br>'
                + '📅 Dura aproximadamente <strong style="color:var(--primary);font-size:18px;">' + dias + ' dias</strong>';
        } else {
            document.getElementById('modal-ab-previsao').textContent = sacos + ' sacos × ' + kgSaco + 'kg = ' + totalKg + 'kg';
        }
    },

    confirmarAbastecimento: function () {
        var loteNome = document.getElementById('modal-ab-lote').textContent;
        var produto = document.getElementById('modal-ab-produto').value;
        var sacos = parseInt(document.getElementById('modal-ab-sacos').value) || 0;
        var kgSaco = parseFloat(document.getElementById('modal-ab-kg-saco').value) || 25;

        if (sacos === 0) {
            window.app.showToast('Informe a quantidade de sacos.', 'error');
            return;
        }

        var totalKg = sacos * kgSaco;

        window.data.saveEvent({
            type: 'ABASTECIMENTO',
            lote: loteNome,
            produto: produto,
            sacos: sacos,
            kgPorSaco: kgSaco,
            qtdKg: totalKg,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        });

        var lote = this.getLoteByNome(loteNome);
        var consumoDia = 0;
        var label = produto === 'sal' ? 'Sal' : 'Ração';
        if (produto === 'sal' && lote && lote.salConsumo && lote.qtdAnimais) {
            consumoDia = (lote.salConsumo / 1000) * lote.qtdAnimais;
        } else if (produto === 'racao' && lote && lote.racaoConsumo && lote.qtdAnimais) {
            consumoDia = lote.racaoConsumo * lote.qtdAnimais;
        }

        var diasMsg = '';
        if (consumoDia > 0) {
            diasMsg = ' → dura ' + Math.round(totalKg / consumoDia) + ' dias';
        }

        this.fecharModal('modal-abastecer');
        window.app.showToast('🧂 ' + label + ' abastecido: ' + sacos + ' sacos (' + totalKg + 'kg)' + diasMsg);
        this.renderList();
    },

    // ====== MANEJO RÁPIDO ======
    manejoRapido: function (loteNome, tipo) {
        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        // Navigate to manejo and pre-fill
        window.app.navigate('manejo');

        setTimeout(function () {
            var selectTipo = document.getElementById('manejo-tipo');
            var selectLote = document.getElementById('manejo-lote');
            var inputQtd = document.getElementById('manejo-qtd');

            if (selectTipo) selectTipo.value = tipo;
            if (selectLote) selectLote.value = loteNome;
            if (inputQtd) inputQtd.value = lote.qtdAnimais || '';
        }, 200);
    },

    // ====== MODAL HELPERS ======
    fecharModal: function (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    },

    // ====== POPULATE SELECT ======
    populateSelect: function (selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;

        var lotes = this.getLotes();
        var html = '<option value="">Selecionar Lote...</option>';
        lotes.forEach(function (l) {
            html += '<option value="' + l.nome + '">' + l.nome + ' (' + l.qtdAnimais + ' cab)</option>';
        });
        select.innerHTML = html;
    },

    // ====== GMD — Ganho Médio Diário ======
    calcGMD: function (lote) {
        if (!window.data) return null;

        // Get all pesagem events for this lot, sorted by date
        var pesagens = window.data.events.filter(function (ev) {
            return ev.type === 'MANEJO' && ev.tipoManejo === 'pesagem' && ev.lote === lote.nome && ev.pesoMedio;
        }).sort(function (a, b) {
            return new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp);
        });

        // Use lot creation as initial weight if no pesagem exists
        var pesoInicial = lote.pesoMedio || 0;
        var dataInicial = lote.dataEntrada || lote.date;

        if (!pesoInicial || !dataInicial) return null;

        var pesoAtual = pesoInicial;
        var dataAtual = dataInicial;

        if (pesagens.length > 0) {
            var ultima = pesagens[pesagens.length - 1];
            pesoAtual = ultima.pesoMedio;
            dataAtual = ultima.date || ultima.timestamp;
        }

        var d1 = new Date(dataInicial);
        var d2 = pesagens.length > 0 ? new Date(dataAtual) : new Date();
        var diasConfinamento = Math.max(1, Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));

        var ganhoTotal = pesoAtual - pesoInicial;
        var gmd = ganhoTotal / diasConfinamento;

        // Previsão: dias para atingir peso de abate (480kg)
        var pesoAbate = 480;
        var diasParaAbate = null;
        if (gmd > 0 && pesoAtual < pesoAbate) {
            diasParaAbate = Math.ceil((pesoAbate - pesoAtual) / gmd);
        }

        return {
            gmd: gmd,
            pesoInicial: pesoInicial,
            pesoAtual: pesoAtual,
            ganhoTotal: ganhoTotal,
            diasConfinamento: diasConfinamento,
            pesagens: pesagens.length,
            diasParaAbate: diasParaAbate,
            pesoAbate: pesoAbate,
            ultimaPesagem: pesagens.length > 0 ? dataAtual : null
        };
    },

    // ====== CUSTO NUTRIÇÃO POR LOTE ======
    calcCustoNutricao: function (lote) {
        if (!window.data) return null;

        var custoSalDia = 0;
        var custoRacaoDia = 0;

        // Find unit price from latest ESTOQUE_ENTRADA for each product
        function getPrecoUnitario(produtoNome) {
            if (!produtoNome) return 0;
            var lower = produtoNome.toLowerCase();
            var entradas = window.data.events.filter(function (ev) {
                return ev.type === 'ESTOQUE_ENTRADA' && (ev.name || '').toLowerCase().indexOf(lower) >= 0 && ev.valorUnitario;
            });
            if (entradas.length === 0) return 0;
            return entradas[entradas.length - 1].valorUnitario || 0;
        }

        // Sal: consumo em g/cab/dia → kg/dia total
        if (lote.salMineral && lote.salConsumo && lote.qtdAnimais) {
            var precoSalKg = getPrecoUnitario(lote.salMineral);
            var salKgDia = (lote.salConsumo / 1000) * lote.qtdAnimais;
            custoSalDia = salKgDia * precoSalKg;
        }

        // Ração: consumo em kg/cab/dia
        if (lote.racao && lote.racaoConsumo && lote.qtdAnimais) {
            var precoRacaoKg = getPrecoUnitario(lote.racao);
            var racaoKgDia = lote.racaoConsumo * lote.qtdAnimais;
            custoRacaoDia = racaoKgDia * precoRacaoKg;
        }

        var custoDiaTotal = custoSalDia + custoRacaoDia;
        var custoCabDia = lote.qtdAnimais > 0 ? custoDiaTotal / lote.qtdAnimais : 0;

        // Dias de confinamento
        var dataEntrada = lote.dataEntrada || lote.date;
        var diasConf = dataEntrada ? Math.max(1, Math.floor((new Date() - new Date(dataEntrada)) / (1000 * 60 * 60 * 24))) : 1;

        var custoAcumulado = custoDiaTotal * diasConf;

        // Custo por arroba produzida (usando GMD)
        var gmdData = this.calcGMD(lote);
        var custoArrobaProduzida = 0;
        if (gmdData && gmdData.gmd > 0 && lote.qtdAnimais > 0) {
            // Arrobas produzidas por dia (total do lote): GMD × qtd / 30 (1@ vivo = 30kg)
            var arrobasDia = (gmdData.gmd * lote.qtdAnimais) / 30;
            custoArrobaProduzida = arrobasDia > 0 ? custoDiaTotal / arrobasDia : 0;
        }

        // Custo mensal
        var custoMensal = custoDiaTotal * 30;

        return {
            custoSalDia: custoSalDia,
            custoRacaoDia: custoRacaoDia,
            custoDiaTotal: custoDiaTotal,
            custoCabDia: custoCabDia,
            custoMensal: custoMensal,
            custoAcumulado: custoAcumulado,
            custoArrobaProduzida: custoArrobaProduzida,
            diasConfinamento: diasConf
        };
    },

    // ====== CUSTO TOTAL POR LOTE (Fluxo Conectado ao Rebanho) ======
    calcCustoTotalLote: function (lote) {
        if (!window.data) return null;

        var nome = lote.nome;
        var events = window.data.events;

        // 1. COMPRA — valor total da compra vinculada ao lote
        var custoCompra = 0;
        events.forEach(function (ev) {
            if (ev.type === 'COMPRA' && ev.lote === nome) {
                custoCompra += (ev.value || 0);
            }
        });

        // 2. NUTRIÇÃO — custo acumulado (sal + ração) usando calcCustoNutricao
        var custoNutricao = 0;
        var nutData = this.calcCustoNutricao(lote);
        if (nutData) {
            custoNutricao = nutData.custoAcumulado || 0;
        }

        // 3. MANEJO — custo de vacinas, vermífugos etc vinculados ao lote
        var custoManejo = 0;
        events.forEach(function (ev) {
            if (ev.type === 'MANEJO' && ev.lote === nome && ev.cost) {
                custoManejo += ev.cost;
            }
        });

        // 4. INSUMOS de ESTOQUE usados no lote (abastecimentos com custo)
        var custoInsumos = 0;
        events.forEach(function (ev) {
            if (ev.type === 'ABASTECIMENTO' && ev.lote === nome && ev.custo) {
                custoInsumos += ev.custo;
            }
        });

        // 5. VENDA — receita do lote
        var receitaVenda = 0;
        events.forEach(function (ev) {
            if (ev.type === 'VENDA' && ev.lote === nome) {
                receitaVenda += (ev.value || 0);
            }
        });

        // TOTAIS
        var custoTotal = custoCompra + custoNutricao + custoManejo + custoInsumos;
        var custoPorCab = lote.qtdAnimais > 0 ? custoTotal / lote.qtdAnimais : 0;

        // Custo por arroba produzida
        var custoPorArroba = 0;
        var gmdData = this.calcGMD(lote);
        if (gmdData && gmdData.ganhoTotal > 0 && lote.qtdAnimais > 0) {
            var arrobasProduzidas = (gmdData.ganhoTotal * lote.qtdAnimais) / 30;
            custoPorArroba = arrobasProduzidas > 0 ? custoTotal / arrobasProduzidas : 0;
        }

        // Resultado (receita - custo)
        var resultado = receitaVenda - custoTotal;

        return {
            custoCompra: custoCompra,
            custoNutricao: custoNutricao,
            custoManejo: custoManejo,
            custoInsumos: custoInsumos,
            custoTotal: custoTotal,
            custoPorCab: custoPorCab,
            custoPorArroba: custoPorArroba,
            receitaVenda: receitaVenda,
            resultado: resultado
        };
    },

    // ====== EDITAR LOTE ======
    editLote: function (loteNome) {
        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        // Scroll to form and fill fields
        window.app.navigate('lotes');

        setTimeout(function () {
            var el = function (id) { return document.getElementById(id); };
            if (el('lote-nome')) el('lote-nome').value = lote.nome || '';
            if (el('lote-categoria')) el('lote-categoria').value = lote.categoria || '';
            if (el('lote-raca')) el('lote-raca').value = lote.raca || '';
            if (el('lote-qtd')) el('lote-qtd').value = lote.qtdAnimais || '';
            if (el('lote-peso-medio')) el('lote-peso-medio').value = lote.pesoMedio || '';
            if (el('lote-pasto')) el('lote-pasto').value = lote.pasto || '';
            if (el('lote-data-entrada')) el('lote-data-entrada').value = lote.dataEntrada || '';
            if (el('lote-sal')) el('lote-sal').value = lote.salMineral || '';
            if (el('lote-sal-consumo')) el('lote-sal-consumo').value = lote.salConsumo || '';
            if (el('lote-racao')) el('lote-racao').value = lote.racao || '';
            if (el('lote-racao-consumo')) el('lote-racao-consumo').value = lote.racaoConsumo || '';
            if (el('lote-obs')) el('lote-obs').value = lote.obs || '';

            // Scroll to form
            var form = document.getElementById('form-lote');
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });

            window.app.showToast('📝 Editando lote: ' + loteNome + '. Altere e clique em Cadastrar.');
        }, 200);
    },

    // ====== EXCLUIR / INATIVAR LOTE ======
    excluirLote: function (loteNome) {
        if (!confirm('Tem certeza que deseja inativar o lote "' + loteNome + '"?\n\nOs dados históricos serão mantidos.')) return;

        var lote = this.getLoteByNome(loteNome);
        if (!lote) return;

        lote.status = 'INATIVO';
        window.data.save();

        window.app.showToast('🗑️ Lote "' + loteNome + '" inativado.');
        this.renderList();
    },

    // ====== RENDER LIST ======
    renderList: function () {
        var container = document.getElementById('lotes-list');
        if (!container) return;

        var allLotes = this.getLotes();

        if (allLotes.length === 0) {
            container.innerHTML = '<div class="empty-state">🐄 Nenhum lote cadastrado. Crie seu primeiro lote!</div>';
            return;
        }

        // Summary KPIs
        var totalAnimais = 0;
        var pesoMedio = 0;
        var idadeMedia = 0;
        var self = this;

        allLotes.forEach(function (l) {
            totalAnimais += (l.qtdAnimais || 0);
            pesoMedio += (l.pesoMedio || 0) * (l.qtdAnimais || 0);
            idadeMedia += (l.idadeMedia || 0) * (l.qtdAnimais || 0);
        });

        if (totalAnimais > 0) {
            pesoMedio = pesoMedio / totalAnimais;
            idadeMedia = idadeMedia / totalAnimais;
        }

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value positive">' + allLotes.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Total Animais</div><div class="kpi-value">' + totalAnimais + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + Math.round(pesoMedio) + ' kg</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Idade Média</div><div class="kpi-value">' + Math.round(idadeMedia) + ' m</div></div>'
            + '</div>';

        // Lot cards
        html += allLotes.slice().reverse().map(function (l) {
            var pastoAtual = l.pastoAtual || 'Sem pasto';
            var categoria = l.categoria || 'Não definida';

            // Category emoji
            var catEmoji = {
                'cria': '🐮',
                'recria': '🐂',
                'engorda': '🥩',
                'matrizes': '🐄',
                'touros': '🐃'
            }[categoria] || '📦';

            // Get KPIs if available
            var gmdText = '--';
            var diasText = '--';
            if (window.indicadores) {
                var kpis = window.indicadores.getLoteKPIs(l);
                if (kpis.gmd > 0) gmdText = kpis.gmd.toFixed(2) + ' kg/d';
                if (kpis.diasCocho > 0) diasText = kpis.diasCocho + 'd';
            }

            // Custo total por lote (Fluxo Conectado)
            var custoData = self.calcCustoTotalLote(l);
            var custoTotalText = '--';
            var custoCabText = '--';
            var custoArrobaText = '--';
            var resultadoHtml = '';
            if (custoData && custoData.custoTotal > 0) {
                custoTotalText = 'R$ ' + custoData.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                custoCabText = 'R$ ' + custoData.custoPorCab.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                if (custoData.custoPorArroba > 0) {
                    custoArrobaText = 'R$ ' + custoData.custoPorArroba.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '/@';
                }
                // Mini breakdown
                var parts = [];
                if (custoData.custoCompra > 0) parts.push('🐄 Compra: R$ ' + custoData.custoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
                if (custoData.custoNutricao > 0) parts.push('🧂 Nutrição: R$ ' + custoData.custoNutricao.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
                if (custoData.custoManejo > 0) parts.push('💉 Manejo: R$ ' + custoData.custoManejo.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
                if (parts.length > 0) {
                    resultadoHtml = '<div class="lot-cost-breakdown" style="margin-top:6px;padding:8px 10px;background:rgba(0,0,0,0.15);border-radius:8px;font-size:11px;line-height:1.6;">'
                        + '<div style="font-weight:700;margin-bottom:2px;font-size:12px;">💰 Custo Total: ' + custoTotalText + '</div>'
                        + parts.join(' · ')
                        + (custoData.receitaVenda > 0 ? '<div style="margin-top:4px;font-weight:700;color:' + (custoData.resultado >= 0 ? '#22C55E' : '#EF4444') + ';">📊 Resultado: R$ ' + custoData.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '</div>' : '')
                        + '</div>';
                }
            }

            var catLabel = {
                'cria': 'CRIA', 'recria': 'RECRIA', 'engorda': 'ENGORDA',
                'matrizes': 'MATRIZES', 'touros': 'TOUROS'
            }[categoria] || '';

            var catGradient = {
                'cria': 'linear-gradient(135deg, #D97706, #F59E0B)',
                'recria': 'linear-gradient(135deg, #2563EB, #3B82F6)',
                'engorda': 'linear-gradient(135deg, #DC2626, #EF4444)',
                'matrizes': 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                'touros': 'linear-gradient(135deg, #059669, #10B981)'
            }[categoria] || 'linear-gradient(135deg, #0F766E, #14B8A6)';

            var headerStyle = 'background:' + catGradient + ';color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;';

            // Leitura de Cocho
            var leituraHtml = '';
            if (window.nutricao) {
                var ultLeitura = window.nutricao.getUltimaLeitura(l.nome);
                if (ultLeitura) {
                    var corAjuste = ultLeitura.ajuste.includes('-') ? '#DC2626' : ultLeitura.ajuste.includes('+') ? '#059669' : '#2563EB';
                    leituraHtml = '<div style="margin-top:8px; display:flex; gap:6px; align-items:center;">'
                        + '<span style="font-size:11px; font-weight:600; padding:2px 6px; background:#F1F5F9; border-radius:4px;">🍽️ Cocho Nota ' + ultLeitura.nota + '</span>'
                        + '<span style="font-size:11px; font-weight:700; color:' + corAjuste + ';">Ajuste: ' + ultLeitura.ajuste + '</span>'
                        + '</div>';
                }
            }

            // Determine badge for category
            var badge = '';
            if (catLabel) {
                badge = '<span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;margin-right:6px;">' + catLabel + '</span>';
            }

            return '<div class="lot-card" onclick="window.lotes.abrirDetalhes(\'' + l.nome + '\')">'
                + '<div class="lot-card-header" style="' + headerStyle + '">'
                + '<div class="lot-title">' + catEmoji + ' ' + (l.nome || 'Lote Sem Nome') + '</div>'
                + '<div class="lot-badges">'
                + badge
                + '<span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;">' + (l.qtdAnimais || 0) + ' cab</span>'
                + (window.fotos ? window.fotos.badge(l.nome) : '')
                + '</div>'
                + '</div>'
                + '<div class="lot-card-body">'
                + '<div class="lot-info-grid">'
                + '<div><span class="label">Pasto</span><span class="value">' + (l.pastoAtual || 'Sem pasto') + '</span></div>'
                + '<div><span class="label">Peso Médio</span><span class="value">' + (l.pesoMedio || 0) + ' kg</span></div>'
                + '<div><span class="label">GMD</span><span class="value text-green">' + gmdText + '</span></div>'
                + '<div><span class="label">R$/cab</span><span class="value">' + custoCabText + '</span></div>'
                + '<div><span class="label">R$/@</span><span class="value">' + custoArrobaText + '</span></div>'
                + '<div><span class="label">Dias</span><span class="value">' + diasText + '</span></div>'
                + '</div>'
                + resultadoHtml
                + leituraHtml
                + '<div class="lot-actions">'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.lotes.abrirManejo(\'' + l.nome + '\')">💉 Manejo</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.lotes.trocarPasto(\'' + l.nome + '\')">🔄 Mover</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.nutricao.abrirLeitura(\'' + l.nome + '\')">🍽️ Cocho</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.lotes.abrirAbastecer(\'' + l.nome + '\', \'sal\')">🧂 Abastecer</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.rebanhoOps.abrirTransferencia(\'' + l.nome + '\')">🔄 Transferir</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.rebanhoOps.abrirMortalidade(\'' + l.nome + '\')">💀 Baixa</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.rebanhoOps.abrirNascimento(\'' + l.nome + '\')">🐣 Nasc.</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.rebanhoOps.abrirTimeline(\'' + l.nome + '\')">📜 Hist.</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.calendario && window.calendario.registrarProtocolo(\'' + l.nome + '\')">🐄 Reprod.</button>'
                + '<button class="btn-sm" onclick="event.stopPropagation(); window.calendario && window.calendario.renderFichaSanitaria(\'' + l.nome + '\')">📋 Ficha</button>'
                + (window.fotos ? '<button class="btn-sm" onclick="event.stopPropagation(); window.fotos.abrirCaptura(\'' + l.nome + '\', \'lote\', \'' + (l.nome || '').replace(/'/g, "\\'") + '\')">📸 Foto</button>' : '')
                + '<button class="btn-sm" style="background:#2563EB;" onclick="event.stopPropagation(); window.lotes.editLote(\'' + l.nome + '\')">✏️ Editar</button>'
                + '<button class="btn-sm" style="background:#DC2626;" onclick="event.stopPropagation(); window.lotes.excluirLote(\'' + l.nome + '\')">🗑️ Excluir</button>'
                + '</div>'
                + '</div>'
                + '</div>';
        }).join('');

        // FAB button
        html += '<button class="fab" onclick="window.app.navigate(\'rebanho\'); setTimeout(function(){ document.getElementById(\'reb-lote-nome\').focus(); }, 100);">+</button>';

        container.innerHTML = html;
    }
};
