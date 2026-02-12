// ====== CABECAS.JS — Gestão Individual de Animais ======
window.cabecas = {

    // ── Save individual animal ──
    save: function () {
        var brinco = document.getElementById('cab-brinco').value.trim();
        var nome = document.getElementById('cab-nome').value.trim();
        var sexo = document.getElementById('cab-sexo').value;
        var raca = document.getElementById('cab-raca').value.trim();
        var peso = parseFloat(document.getElementById('cab-peso').value) || 0;
        var dataNasc = document.getElementById('cab-nascimento').value;
        var lote = document.getElementById('cab-lote').value;
        var pasto = document.getElementById('cab-pasto').value;
        var obs = document.getElementById('cab-obs').value.trim();

        if (!brinco) {
            window.app.showToast('Informe o número do brinco', 'error');
            return;
        }

        // Check for duplicate brinco
        var existentes = window.data.getByType('CABECA');
        var duplicado = existentes.find(function (e) {
            return e.brinco === brinco && !e.removido;
        });
        if (duplicado) {
            window.app.showToast('Brinco "' + brinco + '" já cadastrado!', 'error');
            return;
        }

        var ev = {
            type: 'CABECA',
            brinco: brinco,
            nome: nome || ('Animal ' + brinco),
            sexo: sexo,
            raca: raca,
            peso: peso,
            dataNasc: dataNasc,
            lote: lote,
            pasto: pasto,
            obs: obs,
            status: 'ativo',
            historico: []
        };

        window.data.saveEvent(ev);
        window.app.showToast('Animal ' + brinco + ' cadastrado!', 'success');

        // Reset form
        document.getElementById('form-cabeca').reset();
        this.renderList();
    },

    // ── Get all active animals ──
    getAtivos: function () {
        return window.data.getByType('CABECA').filter(function (e) {
            return e.status !== 'removido';
        });
    },

    // ── Search / Filter ──
    filterText: '',
    filterSexo: 'todos',
    filterLote: 'todos',

    setFilter: function (type, value) {
        if (type === 'text') this.filterText = value.toLowerCase();
        if (type === 'sexo') this.filterSexo = value;
        if (type === 'lote') this.filterLote = value;
        this.renderList();
    },

    // ── Render list ──
    renderList: function () {
        var container = document.getElementById('cabecas-list');
        if (!container) return;

        var animais = this.getAtivos();
        var self = this;

        // Apply filters
        if (this.filterText) {
            animais = animais.filter(function (a) {
                return (a.brinco && a.brinco.toLowerCase().indexOf(self.filterText) >= 0) ||
                    (a.nome && a.nome.toLowerCase().indexOf(self.filterText) >= 0) ||
                    (a.raca && a.raca.toLowerCase().indexOf(self.filterText) >= 0);
            });
        }
        if (this.filterSexo !== 'todos') {
            animais = animais.filter(function (a) { return a.sexo === self.filterSexo; });
        }
        if (this.filterLote !== 'todos') {
            animais = animais.filter(function (a) { return a.lote === self.filterLote; });
        }

        // Stats
        var statsEl = document.getElementById('cabecas-stats');
        if (statsEl) {
            var total = this.getAtivos().length;
            var machos = this.getAtivos().filter(function (a) { return a.sexo === 'macho'; }).length;
            var femeas = this.getAtivos().filter(function (a) { return a.sexo === 'femea'; }).length;
            statsEl.innerHTML =
                '<div class="stat-row">' +
                '<div class="stat-item"><span class="stat-value">' + total + '</span><span class="stat-label">Total</span></div>' +
                '<div class="stat-item"><span class="stat-value">' + machos + '</span><span class="stat-label">Machos</span></div>' +
                '<div class="stat-item"><span class="stat-value">' + femeas + '</span><span class="stat-label">Fêmeas</span></div>' +
                '<div class="stat-item"><span class="stat-value">' + animais.length + '</span><span class="stat-label">Filtrados</span></div>' +
                '</div>';
        }

        if (animais.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Nenhum animal encontrado</p><p style="font-size:12px;color:var(--text-3);margin-top:4px;">Cadastre animais individualmente usando o formulário acima</p></div>';
            return;
        }

        var html = '';
        animais.forEach(function (a) {
            var idadeStr = '';
            if (a.dataNasc) {
                var nasc = new Date(a.dataNasc);
                var hoje = new Date();
                var meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
                if (meses >= 12) {
                    idadeStr = Math.floor(meses / 12) + 'a ' + (meses % 12) + 'm';
                } else {
                    idadeStr = meses + ' meses';
                }
            }

            var loteNome = '';
            if (a.lote && window.lotes) {
                var lotes = window.data.getByType('LOTE');
                var loteObj = lotes.find(function (l) { return l.id === a.lote; });
                if (loteObj) loteNome = loteObj.nome;
            }

            html += '<div class="animal-card">' +
                '<div class="animal-card-header">' +
                '<div class="animal-id">' +
                '<span class="brinco-badge">' + a.brinco + '</span>' +
                '<strong>' + (a.nome || '') + '</strong>' +
                '</div>' +
                '<span class="sexo-badge ' + a.sexo + '">' + (a.sexo === 'macho' ? 'M' : 'F') + '</span>' +
                '</div>' +
                '<div class="animal-card-body">' +
                (a.raca ? '<span class="animal-tag">Raça: ' + a.raca + '</span>' : '') +
                (a.peso ? '<span class="animal-tag">Peso: ' + a.peso + ' kg</span>' : '') +
                (idadeStr ? '<span class="animal-tag">Idade: ' + idadeStr + '</span>' : '') +
                (loteNome ? '<span class="animal-tag">Lote: ' + loteNome + '</span>' : '') +
                (a.pasto ? '<span class="animal-tag">Pasto: ' + a.pasto + '</span>' : '') +
                '</div>' +
                '<div class="animal-card-actions">' +
                '<button class="btn-sm" onclick="window.cabecas.openFicha(\'' + a.id + '\')">Ficha</button>' +
                '<button class="btn-sm" onclick="window.cabecas.registrarPesagem(\'' + a.id + '\')">Pesagem</button>' +
                '<button class="btn-sm danger-btn-sm" onclick="window.cabecas.remover(\'' + a.id + '\')">Remover</button>' +
                '</div>' +
                '</div>';
        });

        container.innerHTML = html;
    },

    // ── Open detailed ficha (inline expand) ──
    openFicha: function (animalId) {
        var animal = window.data.events.find(function (e) { return e.id === animalId; });
        if (!animal) return;

        // Get all manejo events related to this animal
        var manejos = window.data.getByType('MANEJO').filter(function (m) {
            return m.lote === animal.lote;
        });

        var pesagens = window.data.getByType('PESAGEM_INDIVIDUAL').filter(function (p) {
            return p.animalId === animalId;
        });

        var html = '<div class="ficha-modal">' +
            '<div class="ficha-header">' +
            '<h3>Ficha — ' + animal.brinco + '</h3>' +
            '<button class="btn-sm" onclick="this.closest(\'.ficha-modal\').remove()">Fechar</button>' +
            '</div>' +
            '<div class="ficha-body">' +
            '<div class="ficha-info">' +
            '<p><strong>Nome:</strong> ' + (animal.nome || '—') + '</p>' +
            '<p><strong>Sexo:</strong> ' + (animal.sexo === 'macho' ? 'Macho' : 'Fêmea') + '</p>' +
            '<p><strong>Raça:</strong> ' + (animal.raca || '—') + '</p>' +
            '<p><strong>Peso Atual:</strong> ' + (animal.peso || 0) + ' kg</p>' +
            '<p><strong>Data Nasc.:</strong> ' + (animal.dataNasc || '—') + '</p>' +
            '<p><strong>Observações:</strong> ' + (animal.obs || '—') + '</p>' +
            '</div>';

        if (pesagens.length > 0) {
            html += '<div class="section-title" style="margin-top:12px;">Histórico de Pesagens</div>';
            pesagens.forEach(function (p) {
                html += '<div class="history-item">' +
                    '<span>' + new Date(p.timestamp).toLocaleDateString('pt-BR') + '</span>' +
                    '<strong>' + p.peso + ' kg</strong>' +
                    '</div>';
            });
        }

        html += '</div></div>';

        // Find the animal card and append the ficha below it
        var existing = document.querySelector('.ficha-modal');
        if (existing) existing.remove();

        var container = document.getElementById('cabecas-list');
        container.insertAdjacentHTML('beforeend', html);
    },

    // ── Register weighing for individual animal ──
    registrarPesagem: function (animalId) {
        var peso = prompt('Informe o peso atual (kg):');
        if (!peso || isNaN(parseFloat(peso))) return;

        peso = parseFloat(peso);

        // Update the animal's current weight
        var animal = window.data.events.find(function (e) { return e.id === animalId; });
        if (animal) {
            animal.peso = peso;
            window.data.save();
        }

        // Save pesagem event
        window.data.saveEvent({
            type: 'PESAGEM_INDIVIDUAL',
            animalId: animalId,
            brinco: animal ? animal.brinco : '',
            peso: peso
        });

        window.app.showToast('Pesagem registrada: ' + peso + ' kg', 'success');
        this.renderList();
    },

    // ── Remove animal (mark as removed) ──
    remover: function (animalId) {
        if (!confirm('Remover este animal do rebanho?')) return;

        var animal = window.data.events.find(function (e) { return e.id === animalId; });
        if (animal) {
            animal.status = 'removido';
            window.data.save();
            window.app.showToast('Animal removido', 'success');
            this.renderList();
        }
    },

    // ── Populate lote filter select ──
    populateLoteFilter: function () {
        var select = document.getElementById('cab-filter-lote');
        if (!select) return;

        var lotes = window.data.getByType('LOTE');
        var html = '<option value="todos">Todos os Lotes</option>';
        lotes.forEach(function (l) {
            html += '<option value="' + l.id + '">' + l.nome + '</option>';
        });
        select.innerHTML = html;
    }
};

// Init form listener
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('form-cabeca');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            window.cabecas.save();
        });
    }
});
