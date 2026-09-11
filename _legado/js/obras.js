// ====== MODULO: OBRAS / INFRAESTRUTURA v3 (Status Pagamento, Rastreabilidade, Centro de Custo) ======
window.obras = {
    init: function () {
        console.log('Obras v3 Ready');
        this.bindForm();
    },

    bindForm: function () {
        var form = document.getElementById('form-obra');
        if (form && !form.dataset.boundObras) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                window.obras.salvar();
            });
            form.dataset.boundObras = '1';
        }
    },

    STATUS: {
        PLANEJADA: { label: 'Planejada', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
        EM_EXECUCAO: { label: 'Em Execucao', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
        CONCLUIDA: { label: 'Concluida', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
        CANCELADA: { label: 'Cancelada', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' }
    },

    CATEGORIAS: [
        { id: 'cercas', label: 'Cercas e Porteiras', icon: '🔲' },
        { id: 'agua', label: 'Agua / Bebedouros', icon: '💧' },
        { id: 'curral', label: 'Curral / Mangueira', icon: '🏗️' },
        { id: 'cochos', label: 'Cochos / Abrigos', icon: '🏚️' },
        { id: 'acesso', label: 'Vias de Acesso', icon: '🛤️' },
        { id: 'energia', label: 'Energia', icon: '⚡' },
        { id: 'manutencao', label: 'Manutencao Geral', icon: '🔧' },
        { id: 'outro', label: 'Outro', icon: '📋' }
    ],

    abrirForm: function () {
        var catOptions = '';
        this.CATEGORIAS.forEach(function (c) {
            catOptions += '<option value="' + c.id + '">' + c.icon + ' ' + c.label + '</option>';
        });

        var funcOptions = '<option value="">Nenhum</option>';
        if (window.data) {
            var _esc = window.data.escapeHtml;
            var funcs = window.data.events.filter(function (ev) {
                return (ev.type === 'FUNCIONARIO_CADASTRO' || ev.type === 'FUNCIONARIO') && !ev.estornado && ev.status !== 'INATIVO';
            });
            var seen = {};
            funcs.forEach(function (f) {
                var nome = f.nome || f.name || '';
                if (nome && !seen[nome]) {
                    funcOptions += '<option value="' + _esc(nome) + '">' + _esc(nome) + '</option>';
                    seen[nome] = true;
                }
            });
        }

        var html = '<div class="modal-overlay" id="modal-obra">'
            + '<div class="modal-content">'
            + '<div class="modal-header"><h3>Registrar Obra</h3>'
            + '<button onclick="window.obras.fecharModal()" class="modal-close">X</button></div>'
            + '<div class="modal-body">'
            + '<form id="form-obra" onsubmit="event.preventDefault(); window.obras.salvar();">'
            + '<div class="form-group"><label>Nome da Obra</label>'
            + '<input type="text" id="obra-nome" placeholder="Ex: Cerca pasto 3"></div>'
            + '<div class="form-group"><label>Categoria</label>'
            + '<select id="obra-cat">' + catOptions + '</select></div>'
            + '<div class="form-group"><label>Descricao</label>'
            + '<textarea id="obra-desc" rows="2" placeholder="Detalhes da obra..."></textarea></div>'
            + '<div class="form-group"><label>Custo Estimado (R$)</label>'
            + '<input type="number" id="obra-custo-estimado" step="0.01" placeholder="5000.00"></div>'
            + '<div class="form-group"><label>Custo Pago (R$)</label>'
            + '<input type="number" id="obra-custo-pago" step="0.01" placeholder="0.00"></div>'
            + '<div class="form-group"><label>Status</label>'
            + '<select id="obra-status">'
            + '<option value="PLANEJADA">Planejada</option>'
            + '<option value="EM_EXECUCAO">Em Execucao</option>'
            + '<option value="CONCLUIDA">Concluida</option></select></div>'
            + '<div class="form-group"><label>Trabalhador</label>'
            + '<select id="obra-worker">' + funcOptions + '</select></div>'
            + '<div class="form-group"><label>Diaria (R$)</label>'
            + '<input type="number" id="obra-diaria" step="0.01" placeholder="150.00"></div>'
            + '<div class="form-group"><label>Dias Trabalhados</label>'
            + '<input type="number" id="obra-dias" step="1" placeholder="5"></div>'
            + '<div class="form-group"><label>Data Inicio</label>'
            + '<input type="date" id="obra-data" value="' + new Date().toISOString().split('T')[0] + '"></div>'
            + '<div class="form-group"><label>Materiais (do estoque)</label>'
            + '<div id="obra-materiais-list"></div>'
            + '<button type="button" class="btn-sm" onclick="window.obras.addMaterial()">+ Material</button></div>'
            + '<button type="submit" class="submit-btn">Registrar Obra</button>'
            + '</form></div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    addMaterial: function () {
        var container = document.getElementById('obra-materiais-list');
        if (!container) return;

        var suggestions = '';
        if (window.estoque) {
            window.estoque.getStockItems().forEach(function (item) {
                if (item.categoria === 'obras' || item.categoria === 'outros') {
                    suggestions += '<option value="' + window.data.escapeHtml(item.nome || '') + '">';
                }
            });
        }

        var idx = container.children.length;
        var html = '<div style="display:flex;gap:4px;margin-bottom:4px;" id="obra-mat-row-' + idx + '">'
            + '<input type="text" class="obra-mat-nome" placeholder="Material" list="obra-mat-list-' + idx + '" style="flex:2;">'
            + '<datalist id="obra-mat-list-' + idx + '">' + suggestions + '</datalist>'
            + '<input type="number" class="obra-mat-qty" placeholder="Qtd" step="0.01" style="flex:1;">'
            + '<button type="button" style="background:#DC2626;color:#fff;border:none;border-radius:4px;padding:0 8px;cursor:pointer;" onclick="document.getElementById(\'obra-mat-row-' + idx + '\').remove()">X</button>'
            + '</div>';
        container.insertAdjacentHTML('beforeend', html);
    },

    salvar: function () {
        var nome = document.getElementById('obra-nome') ? document.getElementById('obra-nome').value : '';
        var categoriaEl = document.getElementById('obra-cat');
        var categoria = categoriaEl ? categoriaEl.value : 'outro';
        var descEl = document.getElementById('obra-desc') || document.getElementById('obra-obs');
        var desc = descEl ? descEl.value : '';
        var custoEstimadoEl = document.getElementById('obra-custo-estimado') || document.getElementById('obra-empreiteiro-valor');
        var custoEstimado = parseFloat(custoEstimadoEl ? custoEstimadoEl.value : '') || 0;
        var custoPagoEl = document.getElementById('obra-custo-pago');
        var custoPago = parseFloat(custoPagoEl ? custoPagoEl.value : '') || 0;
        var statusEl = document.getElementById('obra-status');
        var statusObra = statusEl ? statusEl.value : 'PLANEJADA';
        var workerEl = document.getElementById('obra-worker');
        var worker = workerEl ? workerEl.value : '';
        var diariaEl = document.getElementById('obra-diaria');
        var diaria = parseFloat(diariaEl ? diariaEl.value : '') || 0;
        var diasEl = document.getElementById('obra-dias');
        var dias = parseInt(diasEl ? diasEl.value : '', 10) || 0;
        var dataEl = document.getElementById('obra-data') || document.getElementById('obra-inicio');
        var data = dataEl ? dataEl.value : '';
        var pastoEl = document.getElementById('obra-pasto');
        var pasto = pastoEl ? pastoEl.value : '';

        if (!nome) {
            window.app.showToast('Preencha o nome da obra.', 'error');
            return;
        }

        var workers = [];
        if (worker && diaria > 0) {
            workers.push({ nome: worker, diaria: diaria, dias: dias || 1 });
        }
        document.querySelectorAll('#workers-list input[type="checkbox"]:checked').forEach(function (checkbox) {
            var nomeWorker = checkbox.value || '';
            var diariaWorker = parseFloat(checkbox.getAttribute('data-diaria') || '0') || 0;
            var diasInput = document.querySelector('.worker-days-input[data-worker="' + nomeWorker.replace(/"/g, '\\"') + '"]');
            var diasWorker = parseInt(diasInput ? diasInput.value : '', 10) || 1;
            if (nomeWorker && diariaWorker > 0) {
                workers.push({ nome: nomeWorker, diaria: diariaWorker, dias: diasWorker });
            }
        });

        var custoMaoDeObra = 0;
        workers.forEach(function (w) { custoMaoDeObra += (w.diaria * w.dias); });

        var materiaisUsados = [];
        var matNomes = document.querySelectorAll('.obra-mat-nome');
        var matQtds = document.querySelectorAll('.obra-mat-qty');
        for (var i = 0; i < matNomes.length; i++) {
            var matNome = matNomes[i].value;
            var matQty = parseFloat(matQtds[i].value) || 0;
            if (matNome && matQty > 0) {
                materiaisUsados.push({ name: matNome, qty: matQty });
            }
        }

        var custoTotalObra = custoEstimado + custoMaoDeObra;

        var obraEvent = window.data.saveEvent({
            type: 'OBRA_REGISTRO',
            nome: nome,
            desc: desc,
            categoria: categoria,
            pasto: pasto,
            custoEstimado: custoEstimado,
            custoPago: custoPago,
            custoRestante: Math.max(0, custoEstimado - custoPago),
            custoMaoDeObra: custoMaoDeObra,
            value: custoTotalObra,
            statusObra: statusObra,
            workers: workers,
            materiaisUsados: materiaisUsados,
            centerCost: 'INFRAESTRUTURA',
            date: data || new Date().toISOString().split('T')[0]
        });

        if (custoTotalObra > 0) {
            var statusPgto = custoPago >= custoTotalObra ? 'pago' : 'pendente';
            var contaEvent = window.data.saveEvent({
                type: 'CONTA_PAGAR',
                nome: 'Obra: ' + nome,
                desc: desc || nome,
                value: custoTotalObra,
                categoria: 'infraestrutura',
                centerCost: 'INFRAESTRUTURA',
                status: statusPgto,
                pago: statusPgto === 'pago',
                linkedEventIds: [obraEvent.id],
                date: data || new Date().toISOString().split('T')[0]
            });
            window.data.linkEvents(obraEvent.id, contaEvent.id);
        }

        materiaisUsados.forEach(function (mat) {
            if (window.estoque) {
                window.estoque.registrarSaida(mat.name, mat.qty, '', 'Obra: ' + nome, obraEvent.id, 'INFRAESTRUTURA', 'obras');
            }
        });

        if (materiaisUsados.length > 0) {
            window.app.showToast('Obra registrada: ' + nome + ' — ' + materiaisUsados.length + ' material(is) baixado(s) do almoxarifado.');
        } else {
            window.app.showToast('Obra registrada: ' + nome);
        }
        this.fecharModal();
        this.render();
    },

    getObras: function () {
        if (!window.data) return [];
        var obrasEvents = window.data.events.filter(function (ev) { return ev.type === 'OBRA_REGISTRO' && !ev.estornado; });

        var obrasMap = {};
        obrasEvents.forEach(function (ev) {
            obrasMap[ev.id] = ev;
        });

        var result = [];
        for (var id in obrasMap) {
            if (obrasMap.hasOwnProperty(id)) {
                result.push(obrasMap[id]);
            }
        }

        result.sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        return result;
    },

    render: function () {
        var container = document.getElementById('obras-history') || document.getElementById('obras-content');
        if (!container) return;

        var obras = this.getObras();
        var fmt = function (v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };

        var custoTotalObras = 0;
        var custoTotalPago = 0;
        var custoTotalPendente = 0;
        obras.forEach(function (o) {
            custoTotalObras += (o.value || 0);
            custoTotalPago += (o.custoPago || 0);
            custoTotalPendente += (o.custoRestante || 0);
        });

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Total Obras</div><div class="kpi-value">' + obras.length + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Custo Total</div><div class="kpi-value">' + fmt(custoTotalObras) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pago</div><div class="kpi-value positive">' + fmt(custoTotalPago) + '</div></div>';

        if (custoTotalPendente > 0) {
            html += '<div class="kpi-card"><div class="kpi-label">Pendente</div><div class="kpi-value negative">' + fmt(custoTotalPendente) + '</div></div>';
        }
        html += '</div>';

        var self = this;
        var _esc = window.data.escapeHtml;

        if (obras.length === 0) {
            html += '<div class="empty-state"><span class="empty-state-icon">🔨</span>'
                + '<div class="empty-state-title">Sem Obras Registradas</div>'
                + '<div class="empty-state-text">Registre obras e manutencoes da fazenda.</div></div>';
        } else {
            obras.forEach(function (obra) {
                var st = self.STATUS[obra.statusObra] || self.STATUS.PLANEJADA;
                var catObj = null;
                self.CATEGORIAS.forEach(function (c) { if (c.id === obra.categoria) catObj = c; });
                var catIcon = catObj ? catObj.icon : '📋';
                var catLabel = catObj ? catObj.label : obra.categoria;

                var dateStr = obra.date || '';
                if (dateStr) {
                    var dp = dateStr.split('-');
                    if (dp.length === 3) dateStr = dp[2] + '/' + dp[1] + '/' + dp[0];
                }

                html += '<div style="background:' + st.bg + ';border-left:4px solid ' + st.color + ';border-radius:10px;padding:12px;margin-bottom:8px;">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<div><span style="font-size:18px;">' + catIcon + '</span> '
                    + '<span style="font-size:14px;font-weight:700;color:#1E293B;">' + _esc(obra.nome || '') + '</span></div>'
                    + '<span style="font-size:9px;font-weight:800;background:' + st.color + ';color:#fff;padding:2px 6px;border-radius:4px;">' + st.label + '</span>'
                    + '</div>';

                if (obra.desc) {
                    html += '<div style="font-size:12px;color:#64748B;margin-top:4px;">' + _esc(obra.desc) + '</div>';
                }

                html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;">'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Estimado</div>'
                    + '<div style="font-size:13px;font-weight:700;">' + fmt(obra.custoEstimado || obra.value) + '</div></div>'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Pago</div>'
                    + '<div style="font-size:13px;font-weight:700;color:#059669;">' + fmt(obra.custoPago) + '</div></div>'
                    + '<div style="text-align:center;"><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Pendente</div>'
                    + '<div style="font-size:13px;font-weight:700;color:#DC2626;">' + fmt(obra.custoRestante) + '</div></div>'
                    + '</div>';

                if (obra.workers && obra.workers.length > 0) {
                    html += '<div style="margin-top:6px;padding:4px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">';
                    obra.workers.forEach(function (w) {
                        html += '<span style="font-size:11px;color:#64748B;">👷 ' + _esc(w.nome || '') + ' - ' + w.dias + ' dia(s) x ' + fmt(w.diaria) + '</span>';
                    });
                    html += '</div>';
                }

                if (obra.materiaisUsados && obra.materiaisUsados.length > 0) {
                    html += '<div style="margin-top:4px;padding:4px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">';
                    obra.materiaisUsados.forEach(function (m) {
                        html += '<span style="font-size:11px;color:#64748B;">📦 ' + _esc(m.name || '') + ': ' + m.qty + ' | </span>';
                    });
                    html += '</div>';
                }

                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">'
                    + '<span style="font-size:10px;color:#94A3B8;">' + dateStr + '</span>'
                    + '<button class="btn-sm" style="background:#64748B;" onclick="window.financeiro.estornar(\'' + _esc(obra.id || '') + '\')">Estornar</button>'
                    + '</div>';

                html += '</div>';
            });
        }

        html += '<button class="fab" onclick="window.obras.abrirForm()">+</button>';
        container.innerHTML = html;
    },

    renderHistory: function () {
        this.render();
    },

    fecharModal: function () {
        var el = document.getElementById('modal-obra');
        if (el) el.remove();
    }
};
