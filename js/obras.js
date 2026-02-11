// ====== MÓDULO: OBRAS (Construção e Infra Rural) ======
window.obras = {
    workers: ['João Silva', 'Pedro Santos', 'Carlos Oliveira'],

    init: function () {
        console.log('Obras Module Ready');
        this.bindForm();
        this.renderWorkers();
    },

    bindForm: function () {
        var form = document.getElementById('form-obra');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.obras.save();
            });
        }
    },

    renderWorkers: function () {
        var container = document.getElementById('workers-list');
        if (!container) return;

        container.innerHTML = this.workers.map(function (name) {
            var initials = name.split(' ').map(function (w) { return w[0]; }).join('');
            return '<div class="worker-card">'
                + '<div class="worker-avatar">' + initials + '</div>'
                + '<label class="worker-name"><input type="checkbox" value="' + name + '"> ' + name + '</label>'
                + '</div>';
        }).join('');
    },

    addWorker: function () {
        var nome = prompt('Nome do Funcionário:');
        if (nome && nome.trim()) {
            this.workers.push(nome.trim());
            this.renderWorkers();
        }
    },

    save: function () {
        var nome = document.getElementById('obra-nome').value;
        var inicio = document.getElementById('obra-inicio').value;
        var fim = document.getElementById('obra-fim').value;
        var obs = document.getElementById('obra-obs').value;

        if (!nome || !inicio) {
            alert('Preencha o nome e a data de início.');
            return;
        }

        // Get selected workers
        var selectedWorkers = [];
        document.querySelectorAll('#workers-list input[type="checkbox"]:checked').forEach(function (cb) {
            selectedWorkers.push(cb.value);
        });

        // Get materials from dynamic estoque checkboxes
        var materials = [];
        if (window.estoque) {
            materials = window.estoque.getSelectedMaterials('obra-materials-list');
        }

        var ev = {
            type: 'OBRA_REGISTRO',
            nome: nome,
            inicio: inicio,
            fim: fim,
            obs: obs,
            workers: selectedWorkers,
            materials: materials,
            date: inicio
        };

        window.data.saveEvent(ev);

        window.app.showToast('✅ Obra ' + nome + ' registrada!');
        document.getElementById('form-obra').reset();
        this.renderWorkers();
    }
};
