// ====== MÓDULO: CADASTRO DE REBANHO ======
// Suporta cadastro Individual e em Lote
window.rebanho = {
    init: function () {
        console.log('Rebanho Module Ready');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-rebanho');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.rebanho.save();
            });
        }
        var formLote = document.getElementById('form-rebanho-lote');
        if (formLote) {
            formLote.addEventListener('submit', function (e) {
                e.preventDefault();
                window.rebanho.saveLote();
            });
        }
    },

    switchTab: function (tabName, btn) {
        // Toggle tab buttons
        document.querySelectorAll('#view-rebanho .tab-btn').forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Toggle tab content
        document.querySelectorAll('#view-rebanho .tab-content').forEach(function (tc) {
            if (tc.dataset.tab === tabName) {
                tc.style.display = '';
                tc.classList.add('active');
            } else {
                tc.style.display = 'none';
                tc.classList.remove('active');
            }
        });

        // Populate lote dropdowns for batch tab
        if (tabName === 'lote' && window.lotes) {
            window.lotes.populateSelect('reb-lote-destino');
        }
    },

    save: function () {
        var brinco = document.getElementById('reb-brinco').value;
        var raca = document.getElementById('reb-raca').value;
        var sexo = document.getElementById('reb-sexo').value;
        var peso = parseFloat(document.getElementById('reb-peso').value) || 0;
        var nascimento = document.getElementById('reb-nascimento').value;
        var origem = document.getElementById('reb-origem').value;
        var lote = document.getElementById('reb-lote').value;
        var obs = document.getElementById('reb-obs').value;

        if (!brinco || !raca) {
            window.app.showToast('Preencha brinco e raça.', 'error');
            return;
        }

        var animal = {
            type: 'ANIMAL',
            brinco: brinco,
            raca: raca,
            sexo: sexo,
            peso: peso,
            nascimento: nascimento,
            origem: origem,
            lote: lote,
            obs: obs,
            cadastroTipo: 'individual',
            status: 'ATIVO',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        window.data.saveEvent(animal);
        window.app.showToast('✅ Animal ' + brinco + ' cadastrado!');
        document.getElementById('form-rebanho').reset();
        this.renderList();
    },

    saveLote: function () {
        var nome = document.getElementById('reb-lote-nome').value;
        var qtd = parseInt(document.getElementById('reb-lote-qtd').value) || 0;
        var raca = document.getElementById('reb-lote-raca').value;
        var peso = parseFloat(document.getElementById('reb-lote-peso').value) || 0;
        var idade = parseInt(document.getElementById('reb-lote-idade').value) || 0;
        var sexo = document.getElementById('reb-lote-sexo').value;
        var origem = document.getElementById('reb-lote-origem').value;
        var loteDestino = document.getElementById('reb-lote-destino').value;
        var obs = document.getElementById('reb-lote-obs').value;

        if (!nome || !qtd) {
            window.app.showToast('Preencha nome e quantidade.', 'error');
            return;
        }

        var loteAnimal = {
            type: 'ANIMAL_LOTE',
            nome: nome,
            qtdAnimais: qtd,
            raca: raca,
            pesoMedio: peso,
            idadeMedia: idade,
            sexo: sexo,
            origem: origem,
            loteDestino: loteDestino,
            obs: obs,
            status: 'ATIVO',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        window.data.saveEvent(loteAnimal);
        window.app.showToast('✅ ' + qtd + ' animais cadastrados — ' + nome);
        document.getElementById('form-rebanho-lote').reset();
        this.renderList();
    },

    renderList: function () {
        var container = document.getElementById('rebanho-list');
        if (!container) return;

        var individuais = window.data.events.filter(function (ev) {
            return ev.type === 'ANIMAL' && ev.status !== 'VENDIDO';
        });

        var lotes = window.data.events.filter(function (ev) {
            return ev.type === 'ANIMAL_LOTE' && ev.status !== 'VENDIDO';
        });

        var totalIndividuais = individuais.length;
        var totalLote = 0;
        lotes.forEach(function (l) { totalLote += (l.qtdAnimais || 0); });
        var totalGeral = totalIndividuais + totalLote;

        // Count sexes
        var machos = individuais.filter(function (a) { return a.sexo === 'macho'; }).length;
        var femeas = individuais.filter(function (a) { return a.sexo === 'femea'; }).length;

        if (totalGeral === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum animal cadastrado. Registre pelo modo Individual ou Por Lote!</div>';
            return;
        }

        // KPIs
        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Rebanho Total</div><div class="kpi-value positive">' + totalGeral + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Individuais</div><div class="kpi-value">' + totalIndividuais + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Em Lote</div><div class="kpi-value">' + totalLote + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Raças</div><div class="kpi-value">' + this.countRacas(individuais.concat(lotes)) + '</div></div>'
            + '</div>';

        // Lot batches first
        if (lotes.length > 0) {
            html += '<div class="section-title" style="margin-top:8px;">Lotes Cadastrados</div>';
            html += lotes.slice().reverse().map(function (l) {
                var sexoLabel = l.sexo === 'macho' ? '♂ Machos' : l.sexo === 'femea' ? '♀ Fêmeas' : '⚤ Misto';
                return '<div class="history-card">'
                    + '<div class="history-card-header">'
                    + '  <span class="badge badge-green">📋 ' + (l.nome || '--') + '</span>'
                    + '  <span class="date">' + (l.raca || '') + '</span>'
                    + '</div>'
                    + '<div class="history-card-body">'
                    + '  <strong>' + l.qtdAnimais + ' cabeças</strong>'
                    + '  <span class="detail">' + sexoLabel + '</span>'
                    + '  <span class="detail">' + (l.pesoMedio ? l.pesoMedio + ' kg médio' : '') + '</span>'
                    + '  <span class="detail">' + (l.idadeMedia ? '~' + l.idadeMedia + ' meses' : '') + '</span>'
                    + '  <span class="detail">' + (l.loteDestino ? 'Lote: ' + l.loteDestino : '') + '</span>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }

        // Individual animals
        if (individuais.length > 0) {
            html += '<div class="section-title" style="margin-top:8px;">Animais Individuais</div>';
            html += individuais.slice().reverse().map(function (a) {
                return '<div class="history-card">'
                    + '<div class="history-card-header">'
                    + '  <span class="badge badge-green">🐄 ' + (a.brinco || '--') + '</span>'
                    + '  <span class="date">' + (a.raca || '') + '</span>'
                    + '</div>'
                    + '<div class="history-card-body">'
                    + '  <strong>' + (a.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea') + '</strong>'
                    + '  <span class="detail">' + (a.peso ? a.peso + ' kg' : '') + '</span>'
                    + '  <span class="detail">' + (a.lote ? 'Lote: ' + a.lote : 'Sem lote') + '</span>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }

        container.innerHTML = html;
    },

    countRacas: function (animais) {
        var racas = {};
        animais.forEach(function (a) { if (a.raca) racas[a.raca] = true; });
        return Object.keys(racas).length;
    },

    getAnimais: function () {
        return window.data.events.filter(function (ev) {
            return (ev.type === 'ANIMAL' || ev.type === 'ANIMAL_LOTE') && ev.status !== 'VENDIDO';
        });
    }
};
