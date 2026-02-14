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
        var foto = this._fotoBase64 || '';

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
            foto: foto,
            status: 'ativo',
            historico: []
        };

        window.data.saveEvent(ev);
        window.app.showToast('Animal ' + brinco + ' cadastrado!', 'success');

        // Reset form
        document.getElementById('form-cabeca').reset();
        this._fotoBase64 = '';
        var preview = document.getElementById('cab-foto-preview');
        if (preview) preview.style.display = 'none';
        this.renderList();
    },

    _fotoBase64: '',

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
            container.innerHTML = '<div class="empty-state">'
                + '<span class="empty-state-icon">🐄</span>'
                + '<div class="empty-state-title">Nenhum animal encontrado</div>'
                + '<div class="empty-state-text">Cadastre animais individuais usando o formulário acima para acompanhar seu rebanho.</div>'
                + '</div>';
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

            var fotoThumb = a.foto ? '<img src="' + a.foto + '" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:8px;">' : '';

            html += '<div class="animal-card">' +
                '<div class="animal-card-header">' +
                '<div class="animal-id" style="display:flex;align-items:center;">' +
                fotoThumb +
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
                '<button class="btn-sm" onclick="window.cabecas.openFicha(\'' + a.id + '\')">📋 Ficha</button>' +
                '<button class="btn-sm" onclick="window.cabecas.registrarPesagem(\'' + a.id + '\')">⚖️ Pesagem</button>' +
                '<button class="btn-sm" onclick="window.cabecas.editCabeca(\'' + a.id + '\')">✏️ Editar</button>' +
                '<button class="danger-btn-sm" onclick="window.cabecas.remover(\'' + a.id + '\')">🗑️ Remover</button>' +
                '</div>' +
                '</div>';
        });

        container.innerHTML = html;
    },

    // ── Edit animal (pre-fill form) ──
    editCabeca: function (animalId) {
        var animal = window.data.events.find(function (e) { return e.id === animalId; });
        if (!animal) return;

        // Pre-fill form fields
        var fields = {
            'cab-brinco': animal.brinco || '',
            'cab-nome': animal.nome || '',
            'cab-sexo': animal.sexo || 'macho',
            'cab-raca': animal.raca || '',
            'cab-peso': animal.peso || '',
            'cab-nascimento': animal.dataNasc || '',
            'cab-lote': animal.lote || '',
            'cab-pasto': animal.pasto || '',
            'cab-obs': animal.obs || ''
        };

        for (var key in fields) {
            var el = document.getElementById(key);
            if (el) el.value = fields[key];
        }

        // Show photo preview if exists
        if (animal.foto) {
            this._fotoBase64 = animal.foto;
            var preview = document.getElementById('cab-foto-preview');
            if (preview) {
                preview.src = animal.foto;
                preview.style.display = 'block';
            }
        }

        // Remove old animal so re-save won't duplicate
        animal.status = 'removido';
        window.data.save();

        // Scroll to form
        var form = document.getElementById('form-cabeca');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        window.app.showToast('✏️ Editando ' + animal.brinco + ' — altere e salve.', 'info');
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

        // Show photo if exists
        if (animal.foto) {
            html += '<div style="text-align:center;margin:12px 0;"><img src="' + animal.foto + '" style="max-width:200px;border-radius:12px;border:2px solid var(--green);"></div>';
        }

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

    // Photo preview handler
    var fotoInput = document.getElementById('cab-foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;

            // Resize for storage efficiency (max 200px)
            var reader = new FileReader();
            reader.onload = function (evt) {
                var img = new Image();
                img.onload = function () {
                    var canvas = document.createElement('canvas');
                    var maxSize = 200;
                    var w = img.width, h = img.height;
                    if (w > h) { h = h * (maxSize / w); w = maxSize; }
                    else { w = w * (maxSize / h); h = maxSize; }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    var base64 = canvas.toDataURL('image/jpeg', 0.7);
                    window.cabecas._fotoBase64 = base64;

                    var preview = document.getElementById('cab-foto-preview');
                    if (preview) {
                        preview.src = base64;
                        preview.style.display = 'block';
                    }
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
});
