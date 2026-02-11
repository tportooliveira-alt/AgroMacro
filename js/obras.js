// ====== MÓDULO: OBRAS (Construção e Infra Rural) ======
window.obras = {

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
        if (window.funcionarios) {
            window.funcionarios.renderWorkersForObra();
        }
    },

    addWorker: function () {
        window.app.navigate('funcionarios');
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

        // Get selected workers with days
        var selectedWorkers = [];
        document.querySelectorAll('#workers-list input[type="checkbox"]:checked').forEach(function (cb) {
            var workerName = cb.value;
            var diaria = parseFloat(cb.getAttribute('data-diaria')) || 0;
            var daysInput = document.querySelector('.worker-days-input[data-worker="' + workerName + '"]');
            var dias = parseInt(daysInput ? daysInput.value : 0) || 0;
            selectedWorkers.push({
                nome: workerName,
                dias: dias,
                diaria: diaria,
                subtotal: dias * diaria
            });
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
