// ====== MÓDULO: FUNCIONÁRIOS (Cadastro de Trabalhadores) ======
window.funcionarios = {
    init: function () {
        console.log('Funcionários Module Ready');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-funcionario');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.funcionarios.save();
            });
        }
    },

    // Get all active employees from events
    getAll: function () {
        if (!window.data) return [];
        var funcs = {};
        window.data.events.forEach(function (ev) {
            if (ev.type === 'FUNCIONARIO_CADASTRO') {
                funcs[ev.nome.toLowerCase().trim()] = {
                    nome: ev.nome,
                    funcao: ev.funcao || '',
                    telefone: ev.telefone || '',
                    diaria: ev.diaria || 0,
                    ativo: ev.ativo !== false,
                    date: ev.date
                };
            }
            if (ev.type === 'FUNCIONARIO_INATIVAR') {
                var key = (ev.nome || '').toLowerCase().trim();
                if (funcs[key]) funcs[key].ativo = false;
            }
        });
        var list = [];
        Object.keys(funcs).forEach(function (key) {
            list.push(funcs[key]);
        });
        return list.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    },

    // Get only active employees
    getAtivos: function () {
        return this.getAll().filter(function (f) { return f.ativo; });
    },

    save: function () {
        var nome = document.getElementById('func-nome').value.trim();
        var funcao = document.getElementById('func-funcao').value.trim();
        var telefone = document.getElementById('func-telefone').value.trim();
        var diaria = parseFloat(document.getElementById('func-diaria').value) || 0;

        if (!nome) {
            window.app.showToast('Preencha o nome do funcionário.', 'error');
            return;
        }

        var ev = {
            type: 'FUNCIONARIO_CADASTRO',
            nome: nome,
            funcao: funcao,
            telefone: telefone,
            diaria: diaria,
            ativo: true,
            date: new Date().toISOString().split('T')[0]
        };

        window.data.saveEvent(ev);
        window.app.showToast('✅ ' + nome + ' cadastrado!');
        document.getElementById('form-funcionario').reset();
        this.render();
    },

    inativar: function (nome) {
        if (!confirm('Inativar ' + nome + '?')) return;
        var ev = {
            type: 'FUNCIONARIO_INATIVAR',
            nome: nome,
            date: new Date().toISOString().split('T')[0]
        };
        window.data.saveEvent(ev);
        window.app.showToast('⚠️ ' + nome + ' inativado.');
        this.render();
    },

    render: function () {
        var container = document.getElementById('funcionarios-list');
        if (!container) return;

        var funcs = this.getAll();
        if (funcs.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum funcionário cadastrado.</div>';
            return;
        }

        var html = funcs.map(function (f) {
            var initials = f.nome.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2);
            var statusClass = f.ativo ? 'badge-green' : 'badge-red';
            var statusText = f.ativo ? 'Ativo' : 'Inativo';
            return '<div class="funcionario-card' + (f.ativo ? '' : ' inativo') + '">'
                + '<div class="func-avatar">' + initials + '</div>'
                + '<div class="func-info">'
                + '  <strong>' + f.nome + '</strong>'
                + (f.funcao ? '<span class="func-role">👷 ' + f.funcao + '</span>' : '')
                + (f.telefone ? '<span class="func-phone">📱 ' + f.telefone + '</span>' : '')
                + (f.diaria ? '<span class="func-pay">💰 R$ ' + f.diaria.toFixed(2) + '/dia</span>' : '')
                + '</div>'
                + '<div class="func-actions">'
                + '  <span class="badge ' + statusClass + '">' + statusText + '</span>'
                + (f.ativo ? '  <button class="btn-sm btn-danger" onclick="window.funcionarios.inativar(\'' + f.nome.replace(/'/g, "\\'") + '\')">Inativar</button>' : '')
                + '</div>'
                + '</div>';
        }).join('');

        container.innerHTML = html;
    },

    // Populate workers in the Obras form using registered employees
    renderWorkersForObra: function () {
        var container = document.getElementById('workers-list');
        if (!container) return;

        var funcs = this.getAtivos();
        if (funcs.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum funcionário cadastrado. <a href="#" onclick="window.app.navigate(\'funcionarios\')">Cadastrar →</a></div>';
            return;
        }

        container.innerHTML = funcs.map(function (f) {
            var initials = f.nome.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2);
            return '<div class="worker-card">'
                + '<div class="worker-avatar">' + initials + '</div>'
                + '<label class="worker-name"><input type="checkbox" value="' + f.nome + '" data-diaria="' + (f.diaria || 0) + '"> ' + f.nome
                + (f.funcao ? ' <small style="color:var(--text-light)">(' + f.funcao + ')</small>' : '')
                + '</label>'
                + '<div class="worker-days"><input type="number" min="0" placeholder="0" class="worker-days-input" data-worker="' + f.nome + '"> <small>dias</small></div>'
                + '</div>';
        }).join('');
    }
};
