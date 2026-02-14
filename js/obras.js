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
            window.app.showToast('Preencha o nome e a data de início.', 'error');
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
        this.renderHistory();
    },

    renderHistory: function () {
        var container = document.getElementById('obras-history');
        if (!container) return;

        var obras = window.data.events.filter(function (ev) {
            return ev.type === 'OBRA_REGISTRO' || ev.type === 'OBRA';
        });

        if (obras.length === 0) {
            container.innerHTML = '<div class="empty-state">'
                + '<span class="empty-state-icon">🔨</span>'
                + '<div class="empty-state-title">Nenhuma Obra Registrada</div>'
                + '<div class="empty-state-text">Cadastre projetos de construção e infraestrutura da fazenda.</div>'
                + '</div>';
            return;
        }

        var html = obras.slice().reverse().map(function (ob) {
            var startDate = (ob.inicio || ob.date || '').split('T')[0];
            var endDate = ob.fim ? ob.fim.split('T')[0] : '';
            var fmtDate = function (d) {
                var p = d.split('-');
                return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d;
            };

            // Workers cost
            var workersCost = 0;
            var workersHtml = '';
            if (ob.workers && ob.workers.length > 0) {
                ob.workers.forEach(function (w) {
                    var subtotal = (w.dias || 0) * (w.diaria || 0);
                    workersCost += subtotal;
                    workersHtml += '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;">'
                        + '<span>👷 ' + w.nome + (w.funcao ? ' (' + w.funcao + ')' : '') + '</span>'
                        + '<span>' + (w.dias || 0) + 'd × R$ ' + (w.diaria || 0).toFixed(0) + ' = <strong>R$ ' + subtotal.toFixed(2) + '</strong></span>'
                        + '</div>';
                });
            }

            // Materials
            var materialsHtml = '';
            if (ob.materials && ob.materials.length > 0) {
                ob.materials.forEach(function (m) {
                    materialsHtml += '<div style="font-size:12px;padding:2px 0;">📦 ' + m.name + ' × ' + m.qty + '</div>';
                });
            }

            var statusColor = ob.status === 'concluido' ? '#059669' : '#D97706';
            var statusLabel = ob.status === 'concluido' ? '✅ Concluída' : '🔨 Em Andamento';

            return '<div class="card" style="margin-bottom:12px;padding:14px;border-left:4px solid ' + statusColor + ';">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
                + '<strong style="font-size:15px;">' + (ob.nome || 'Obra') + '</strong>'
                + '<span class="badge" style="background:' + statusColor + '20;color:' + statusColor + ';font-size:11px;padding:3px 8px;border-radius:6px;">' + statusLabel + '</span>'
                + '</div>'
                + '<div style="font-size:12px;color:#64748B;margin-bottom:8px;">'
                + '📅 ' + fmtDate(startDate) + (endDate ? ' → ' + fmtDate(endDate) : ' (em aberto)')
                + '</div>'
                + (ob.obs ? '<div style="font-size:13px;color:#475569;margin-bottom:8px;">' + ob.obs + '</div>' : '')
                + (workersHtml ? '<div style="margin-bottom:6px;padding:8px;background:rgba(37,99,235,0.05);border-radius:8px;">'
                    + '<div style="font-size:11px;font-weight:700;color:#2563EB;margin-bottom:4px;">EQUIPE</div>'
                    + workersHtml
                    + '<div style="border-top:1px solid #E2E8F0;margin-top:4px;padding-top:4px;font-size:12px;font-weight:700;text-align:right;">Total Mão de Obra: R$ ' + workersCost.toFixed(2) + '</div>'
                    + '</div>' : '')
                + (materialsHtml ? '<div style="padding:8px;background:rgba(217,119,6,0.05);border-radius:8px;">'
                    + '<div style="font-size:11px;font-weight:700;color:#D97706;margin-bottom:4px;">MATERIAIS</div>'
                    + materialsHtml
                    + '</div>' : '')
                + '</div>';
        }).join('');

        container.innerHTML = html;
    }
};
