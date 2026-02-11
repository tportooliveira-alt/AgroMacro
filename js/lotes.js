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

    // ====== RENDER LIST ======
    renderList: function () {
        var container = document.getElementById('lotes-list');
        if (!container) return;

        var allLotes = this.getLotes();

        if (allLotes.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum lote cadastrado. Crie seu primeiro lote!</div>';
            return;
        }

        // Summary KPIs
        var totalAnimais = 0;
        allLotes.forEach(function (l) { totalAnimais += (l.qtdAnimais || 0); });

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value positive">' + allLotes.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Total Animais</div><div class="kpi-value">' + totalAnimais + '</div></div>'
            + '</div>';

        // Juntar Lotes button
        if (allLotes.length >= 2) {
            html += '<button class="action-btn" onclick="window.lotes.abrirJuntarLotes()" style="margin-bottom:16px;width:100%;">🔗 Juntar Lotes</button>';
        }

        // Category labels
        var catLabels = {
            'cria': '🐮 Cria',
            'recria': '🐂 Recria',
            'engorda': '🥩 Engorda',
            'matrizes': '🐄 Matrizes',
            'touros': '🐃 Touros'
        };

        var self = this;

        // Lot cards
        html += allLotes.slice().reverse().map(function (l) {
            // Nutrition info
            var nutri = [];
            if (l.salMineral) nutri.push('🧂 ' + l.salMineral + (l.salConsumo ? ' (' + l.salConsumo + 'g/cab/dia)' : ''));
            if (l.racao) nutri.push('🌾 ' + l.racao + (l.racaoConsumo ? ' (' + l.racaoConsumo + 'kg/cab/dia)' : ''));

            // Duration info
            var duracao = self.calcDuracaoNutricao(l);
            var duracaoHtml = '';
            if (duracao.sal) {
                var corSal = duracao.sal.diasRestantes <= 3 ? '#D32F2F' : duracao.sal.diasRestantes <= 7 ? '#FF8F00' : '#2E7D32';
                duracaoHtml += '<div class="duracao-badge" style="color:' + corSal + '">🧂 Sal: <strong>' + duracao.sal.diasRestantes + ' dias restantes</strong></div>';
            }
            if (duracao.racao) {
                var corRacao = duracao.racao.diasRestantes <= 3 ? '#D32F2F' : duracao.racao.diasRestantes <= 7 ? '#FF8F00' : '#2E7D32';
                duracaoHtml += '<div class="duracao-badge" style="color:' + corRacao + '">🌾 Ração: <strong>' + duracao.racao.diasRestantes + ' dias restantes</strong></div>';
            }

            var nutriLine = nutri.length > 0 ? '<div style="font-size:12px; color:var(--text-light); margin-top:4px;">' + nutri.join(' • ') + '</div>' : '';

            // Race line
            var racaLine = l.raca ? '<span class="detail">🐄 ' + l.raca + '</span>' : '';

            // Action buttons
            var actions = '<div class="lote-actions">'
                + '<button class="lote-action-btn" onclick="window.lotes.trocarPasto(\'' + l.nome.replace(/'/g, "\\'") + '\')" title="Trocar Pasto">🔄</button>';

            if (l.salMineral) {
                actions += '<button class="lote-action-btn" onclick="window.lotes.abrirAbastecer(\'' + l.nome.replace(/'/g, "\\'") + '\', \'sal\')" title="Abastecer Sal">🧂</button>';
            }
            if (l.racao) {
                actions += '<button class="lote-action-btn" onclick="window.lotes.abrirAbastecer(\'' + l.nome.replace(/'/g, "\\'") + '\', \'racao\')" title="Abastecer Ração">🌾</button>';
            }

            actions += '<button class="lote-action-btn" onclick="window.lotes.manejoRapido(\'' + l.nome.replace(/'/g, "\\'") + '\', \'vacinacao\')" title="Vacinar">💉</button>'
                + '<button class="lote-action-btn" onclick="window.lotes.manejoRapido(\'' + l.nome.replace(/'/g, "\\'") + '\', \'pesagem\')" title="Pesar">⚖️</button>'
                + '</div>';

            return '<div class="history-card lote-card">'
                + '<div class="history-card-header">'
                + '  <span class="badge badge-green">' + (catLabels[l.categoria] || '📋') + ' ' + l.nome + '</span>'
                + '  <span class="date">' + (l.status === 'ATIVO' ? '🟢 Ativo' : '⚪ Inativo') + '</span>'
                + '</div>'
                + '<div class="history-card-body">'
                + '  <strong>' + l.qtdAnimais + ' cabeças</strong>'
                + '  <span class="detail">' + (l.pesoMedio ? l.pesoMedio + ' kg médio' : '') + '</span>'
                + '  <span class="detail">' + (l.pasto ? '📍 ' + l.pasto : 'Sem pasto') + '</span>'
                + racaLine
                + nutriLine
                + duracaoHtml
                + '</div>'
                + actions
                + '</div>';
        }).join('');

        container.innerHTML = html;
    }
};
