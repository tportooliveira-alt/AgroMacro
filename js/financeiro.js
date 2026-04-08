// ====== MODULO: FINANCEIRO UNIFICADO v4 ======
window.financeiro = {
    filters: {
        area: 'geral',
        type: '',
        counterpart: '',
        lote: '',
        pasto: '',
        status: '',
        paymentType: '',
        centerCost: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    },

    init: function () {
        console.log('Financeiro v4 Ready');
        this.bindForms();
        this.ensureDefaultDates();
        this.syncVendaContext();
    },

    bindForms: function () {
        var formCompra = document.getElementById('form-compra');
        if (formCompra && !formCompra.dataset.boundFinanceiro) {
            formCompra.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveCompra();
            });
            formCompra.dataset.boundFinanceiro = '1';
        }

        var formVenda = document.getElementById('form-venda');
        if (formVenda && !formVenda.dataset.boundFinanceiro) {
            formVenda.addEventListener('submit', function (e) {
                e.preventDefault();
                window.financeiro.saveVenda();
            });
            formVenda.dataset.boundFinanceiro = '1';
        }

        var vendaLote = document.getElementById('venda-lote');
        if (vendaLote && !vendaLote.dataset.boundFinanceiro) {
            vendaLote.addEventListener('change', function () {
                window.financeiro.syncVendaContext();
            });
            vendaLote.dataset.boundFinanceiro = '1';
        }
    },

    ensureDefaultDates: function () {
        var today = new Date().toISOString().split('T')[0];
        var ids = [
            'compra-data', 'venda-data', 'compra-vencimento', 'compra-vencimento-parcial',
            'venda-vencimento', 'venda-vencimento-parcial'
        ];
        ids.forEach(function (id) {
            var input = document.getElementById(id);
            if (input && !input.value) input.value = today;
        });
    },

    el: function (id) {
        return document.getElementById(id);
    },

    escapeHtml: function (value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    fmtMoney: function (value) {
        return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    fmtDate: function (value) {
        if (!value) return '--';
        var date = String(value).split('T')[0].split('-');
        if (date.length !== 3) return value;
        return date[2] + '/' + date[1] + '/' + date[0];
    },

    setFilter: function (key, value) {
        this.filters[key] = value || '';
        this.updateFluxoUI();
    },

    setArea: function (area) {
        this.filters.area = area || 'geral';
        this.updateFluxoUI();
    },

    resetFilters: function () {
        this.filters = {
            area: this.filters.area || 'geral',
            type: '',
            counterpart: '',
            lote: '',
            pasto: '',
            status: '',
            paymentType: '',
            centerCost: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        this.updateFluxoUI();
    },

    togglePrazoFields: function (prefix) {
        var select = this.el(prefix + '-forma-pagamento');
        if (!select) return;

        var prazoFields = this.el(prefix + '-prazo-fields');
        var parcialFields = this.el(prefix + '-parcial-fields');
        var mode = select.value || 'avista';

        if (prazoFields) prazoFields.style.display = mode === 'prazo' ? '' : 'none';
        if (parcialFields) parcialFields.style.display = mode === 'parcial' ? '' : 'none';
    },

    ensureManualPasto: function (selectId) {
        var select = this.el(selectId);
        if (!select) return '';
        var value = select.value || '';
        if (value !== '__novo__') return value;

        var novoPasto = prompt('Nome do novo pasto:') || '';
        novoPasto = novoPasto.trim();
        if (!novoPasto) return '';

        try {
            var manuais = JSON.parse(localStorage.getItem('agromacro_pastos_manuais') || '[]');
            if (manuais.indexOf(novoPasto) < 0) manuais.push(novoPasto);
            localStorage.setItem('agromacro_pastos_manuais', JSON.stringify(manuais));
        } catch (e) {
            console.warn('Nao foi possivel salvar pasto manual:', e);
        }

        if (window.lotes && window.lotes.populatePastoSelect) {
            window.lotes.populatePastoSelect(selectId);
            select.value = novoPasto;
        }

        return novoPasto;
    },

    getLoteAtual: function (nome) {
        if (!nome) return null;
        if (window.lotes && window.lotes.getLoteByNome) {
            return window.lotes.getLoteByNome(nome);
        }
        return null;
    },

    syncVendaContext: function () {
        var loteNome = this.el('venda-lote') ? this.el('venda-lote').value : '';
        var lote = this.getLoteAtual(loteNome);
        var pasto = lote && lote.pasto ? lote.pasto : '';
        var info = this.el('venda-pasto-info');
        if (info) info.value = pasto || 'Sem pasto definido';
        var hidden = this.el('venda-pasto-hidden');
        if (hidden) hidden.value = pasto || '';

        var qtyInput = this.el('venda-qty');
        if (qtyInput && lote && lote.qtdAnimais) {
            qtyInput.max = lote.qtdAnimais;
            qtyInput.placeholder = 'Max: ' + lote.qtdAnimais;
        }
    },

    getPaymentBreakdown: function (prefix, totalValue) {
        var paymentType = this.el(prefix + '-forma-pagamento');
        var mode = paymentType ? paymentType.value || 'avista' : 'avista';
        var paidNow = 0;
        var dueDate = '';

        if (mode === 'avista') {
            paidNow = totalValue;
        } else if (mode === 'prazo') {
            dueDate = this.el(prefix + '-vencimento') ? this.el(prefix + '-vencimento').value : '';
        } else if (mode === 'parcial') {
            if (prefix === 'compra') {
                paidNow = parseFloat(this.el('compra-valor-pago') ? this.el('compra-valor-pago').value : '') || 0;
                dueDate = this.el('compra-vencimento-parcial') ? this.el('compra-vencimento-parcial').value : '';
            } else {
                paidNow = parseFloat(this.el('venda-valor-recebido') ? this.el('venda-valor-recebido').value : '') || 0;
                dueDate = this.el('venda-vencimento-parcial') ? this.el('venda-vencimento-parcial').value : '';
            }
            if (paidNow > totalValue) paidNow = totalValue;
        }

        return {
            mode: mode,
            paidNow: paidNow,
            outstanding: Math.max(0, totalValue - paidNow),
            dueDate: dueDate
        };
    },

    saveCompra: function () {
        var qty = parseInt(this.el('compra-qty') ? this.el('compra-qty').value : '', 10) || 0;
        var peso = parseFloat(this.el('compra-peso') ? this.el('compra-peso').value : '') || 0;
        var valor = parseFloat(this.el('compra-valor') ? this.el('compra-valor').value : '') || 0;
        var desc = this.el('compra-desc') ? this.el('compra-desc').value.trim() : '';
        var fornecedor = this.el('compra-fornecedor') ? this.el('compra-fornecedor').value.trim() : '';
        var lote = this.el('compra-lote') ? this.el('compra-lote').value.trim() : '';
        var pasto = this.ensureManualPasto('compra-pasto');
        var data = this.el('compra-data') ? this.el('compra-data').value : '';

        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }

        if (!lote) {
            lote = desc || ('Compra ' + (data || new Date().toISOString().split('T')[0]));
        }

        var payment = this.getPaymentBreakdown('compra', valor);
        var custoCabeca = qty > 0 ? valor / qty : 0;
        var arrobasPorCabeca = peso > 0 ? peso / 30 : 0;
        var custoArroba = arrobasPorCabeca > 0 ? custoCabeca / arrobasPorCabeca : 0;

        var compraEvent = window.data.saveEvent({
            type: 'COMPRA',
            qty: qty,
            cabecas: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabecas'),
            nome: desc || (qty + ' cabecas compradas'),
            fornecedor: fornecedor,
            lote: lote,
            pasto: pasto,
            custoCabeca: custoCabeca,
            custoArroba: custoArroba,
            formaPagamento: payment.mode,
            valorPagoAgora: payment.paidNow,
            valorEmAberto: payment.outstanding,
            pagamentoStatus: payment.outstanding > 0 ? (payment.paidNow > 0 ? 'parcial' : 'pendente') : 'pago',
            centerCost: 'GADO_CORTE',
            date: data || new Date().toISOString().split('T')[0]
        });

        if (payment.mode === 'avista') {
            var contaCompraPaga = window.data.saveEvent({
                type: 'CONTA_PAGAR',
                nome: 'Compra Gado: ' + (desc || qty + ' cab'),
                desc: qty + ' cabecas - ' + (fornecedor || 'sem fornecedor'),
                value: valor,
                categoria: 'gado',
                centerCost: 'GADO_CORTE',
                status: 'pago',
                pago: true,
                formaPagamento: payment.mode,
                linkedEventIds: [compraEvent.id],
                date: compraEvent.date
            });
            window.data.linkEvents(compraEvent.id, contaCompraPaga.id);
        } else if (payment.outstanding > 0) {
            var contaCompra = window.data.saveEvent({
                type: 'CONTA_PAGAR',
                nome: 'Compra Gado: ' + (desc || qty + ' cab'),
                desc: qty + ' cabecas - ' + (fornecedor || 'sem fornecedor'),
                value: payment.outstanding,
                categoria: 'gado',
                centerCost: 'GADO_CORTE',
                status: 'pendente',
                pago: false,
                formaPagamento: payment.mode,
                vencimento: payment.dueDate || compraEvent.date,
                linkedEventIds: [compraEvent.id],
                date: compraEvent.date
            });
            window.data.linkEvents(compraEvent.id, contaCompra.id);
        }

        if (window.lotes) {
            var loteExistente = window.lotes.getLoteByNome ? window.lotes.getLoteByNome(lote) : null;
            var loteEvent = window.data.saveEvent({
                type: 'LOTE',
                nome: lote,
                categoria: loteExistente ? loteExistente.categoria : 'engorda',
                raca: loteExistente ? loteExistente.raca : '',
                qtdAnimais: (loteExistente && loteExistente.qtdAnimais ? loteExistente.qtdAnimais : 0) + qty,
                pesoMedio: peso || (loteExistente ? loteExistente.pesoMedio : 0),
                pasto: pasto || (loteExistente ? loteExistente.pasto : ''),
                status: 'ATIVO',
                dataEntrada: loteExistente ? loteExistente.dataEntrada : compraEvent.date,
                salMineral: loteExistente ? loteExistente.salMineral : 0,
                salConsumo: loteExistente ? loteExistente.salConsumo : 0,
                racao: loteExistente ? loteExistente.racao : 0,
                racaoConsumo: loteExistente ? loteExistente.racaoConsumo : 0,
                centerCost: 'GADO_CORTE',
                date: compraEvent.date
            });
            window.data.linkEvents(compraEvent.id, loteEvent.id);
        }

        window.app.showToast('Compra registrada em Gado e Financeiro.');
        if (this.el('form-compra')) this.el('form-compra').reset();
        this.ensureDefaultDates();
        this.togglePrazoFields('compra');
        if (window.lotes && window.lotes.populatePastoSelect) window.lotes.populatePastoSelect('compra-pasto');
        if (window.iaConsultor && window.iaConsultor.notificarPosAcao) {
            window.iaConsultor.notificarPosAcao('compra', { qtd: qty, valor: valor, peso: peso, lote: lote, pasto: pasto });
        }
        setTimeout(function () {
            window.app.navigate('fluxo');
        }, 200);
    },

    saveVenda: function () {
        var lote = this.el('venda-lote') ? this.el('venda-lote').value.trim() : '';
        var loteAtual = this.getLoteAtual(lote);
        var qty = parseInt(this.el('venda-qty') ? this.el('venda-qty').value : '', 10) || 0;
        var peso = parseFloat(this.el('venda-peso') ? this.el('venda-peso').value : '') || 0;
        var valor = parseFloat(this.el('venda-valor') ? this.el('venda-valor').value : '') || 0;
        var comprador = this.el('venda-comprador') ? this.el('venda-comprador').value.trim() : '';
        var desc = this.el('venda-desc') ? this.el('venda-desc').value.trim() : '';
        var data = this.el('venda-data') ? this.el('venda-data').value : '';
        var pastoOrigem = loteAtual && loteAtual.pasto ? loteAtual.pasto : (this.el('venda-pasto-hidden') ? this.el('venda-pasto-hidden').value : '');

        if (!lote || !loteAtual) {
            window.app.showToast('Selecione um lote valido para venda.', 'error');
            return;
        }
        if (!qty || !valor) {
            window.app.showToast('Preencha quantidade e valor.', 'error');
            return;
        }
        if (qty > (loteAtual.qtdAnimais || 0)) {
            window.app.showToast('Quantidade maior que o saldo do lote.', 'error');
            return;
        }
        if (window.calendario && window.calendario.verificarCarenciaVenda && !window.calendario.verificarCarenciaVenda(lote)) {
            window.app.showToast('Venda cancelada - periodo de carencia ativo.', 'error');
            return;
        }

        var payment = this.getPaymentBreakdown('venda', valor);
        var totalArrobas = peso > 0 ? (qty * peso) / 30 : 0;
        var precoArroba = totalArrobas > 0 ? valor / totalArrobas : 0;

        var vendaEvent = window.data.saveEvent({
            type: 'VENDA',
            qty: qty,
            cabecas: qty,
            peso: peso,
            value: valor,
            desc: desc || (qty + ' cabecas vendidas'),
            nome: desc || (qty + ' cab vendidas'),
            comprador: comprador,
            lote: lote,
            pasto: pastoOrigem,
            precoArroba: precoArroba,
            totalArrobas: totalArrobas,
            formaPagamento: payment.mode,
            valorRecebidoAgora: payment.paidNow,
            valorEmAberto: payment.outstanding,
            recebimentoStatus: payment.outstanding > 0 ? (payment.paidNow > 0 ? 'parcial' : 'pendente') : 'pago',
            centerCost: 'GADO_CORTE',
            date: data || new Date().toISOString().split('T')[0]
        });

        if (payment.outstanding > 0 || payment.mode === 'avista') {
            var contaReceber = window.data.saveEvent({
                type: 'CONTA_RECEBER',
                nome: 'Venda Gado: ' + (desc || qty + ' cab'),
                desc: qty + ' cabecas - ' + (comprador || 'sem comprador'),
                value: payment.outstanding > 0 ? payment.outstanding : valor,
                categoria: 'gado',
                centerCost: 'GADO_CORTE',
                status: payment.outstanding > 0 ? 'pendente' : 'pago',
                pago: payment.outstanding <= 0,
                formaPagamento: payment.mode,
                vencimento: payment.dueDate || vendaEvent.date,
                linkedEventIds: [vendaEvent.id],
                date: vendaEvent.date
            });
            window.data.linkEvents(vendaEvent.id, contaReceber.id);
        }

        var novaQtd = Math.max(0, (loteAtual.qtdAnimais || 0) - qty);
        var loteEvent = window.data.saveEvent({
            type: 'LOTE',
            nome: lote,
            categoria: loteAtual.categoria,
            raca: loteAtual.raca,
            qtdAnimais: novaQtd,
            pesoMedio: loteAtual.pesoMedio,
            pasto: loteAtual.pasto,
            status: novaQtd > 0 ? 'ATIVO' : 'INATIVO',
            dataEntrada: loteAtual.dataEntrada,
            salMineral: loteAtual.salMineral,
            salConsumo: loteAtual.salConsumo,
            racao: loteAtual.racao,
            racaoConsumo: loteAtual.racaoConsumo,
            centerCost: 'GADO_CORTE',
            date: vendaEvent.date
        });
        window.data.linkEvents(vendaEvent.id, loteEvent.id);

        window.app.showToast('Venda registrada em Gado e Financeiro.');
        if (this.el('form-venda')) this.el('form-venda').reset();
        this.ensureDefaultDates();
        this.togglePrazoFields('venda');
        this.syncVendaContext();
        if (window.iaConsultor && window.iaConsultor.notificarPosAcao) {
            window.iaConsultor.notificarPosAcao('venda', { qtd: qty, valor: valor, arrobas: totalArrobas, lote: lote, pasto: pastoOrigem });
        }
        setTimeout(function () {
            window.app.navigate('fluxo');
        }, 200);
    },

    getLinkedEvents: function (ev) {
        if (!window.data || !ev || !ev.linkedEventIds) return [];
        return ev.linkedEventIds.map(function (id) {
            return window.data.getById(id);
        }).filter(Boolean);
    },

    normalizeCounterpart: function (ev) {
        if (!ev) return '';
        return ev.fornecedor || ev.comprador || ev.empreiteiro || ev.nomeEmpreiteiro || ev.nome || ev.desc || '';
    },

    isLinkedAccount: function (ev) {
        var linked = this.getLinkedEvents(ev);
        for (var index = 0; index < linked.length; index++) {
            if (['COMPRA', 'VENDA', 'ESTOQUE_ENTRADA', 'OBRA_REGISTRO', 'MANEJO', 'MANEJO_SANITARIO'].indexOf(linked[index].type) >= 0) {
                return true;
            }
        }
        return false;
    },

    getMovementFromEvent: function (ev) {
        if (!ev || ev.estornado) return null;

        var base = {
            id: ev.id,
            eventId: ev.id,
            type: ev.type,
            date: (ev.date || '').split('T')[0],
            value: Number(ev.value || ev.cost || ev.custo || ev.valor || 0),
            lote: ev.lote || '',
            pasto: ev.pasto || '',
            centerCost: ev.centerCost || '',
            paymentType: ev.formaPagamento || '',
            raw: ev,
            excludeFromTotals: false
        };

        if (ev.type === 'COMPRA') {
            base.area = 'gado';
            base.direction = 'saida';
            base.status = ev.pagamentoStatus || 'pago';
            base.counterpart = ev.fornecedor || 'Sem fornecedor';
            base.title = 'Compra de Gado';
            base.subtitle = ev.desc || ev.nome || ((ev.qty || ev.cabecas || 0) + ' cabecas');
            base.searchText = [base.title, base.counterpart, base.lote, base.pasto, ev.desc, ev.nome].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'VENDA') {
            base.area = 'gado';
            base.direction = 'entrada';
            base.status = ev.recebimentoStatus || 'pago';
            base.counterpart = ev.comprador || 'Sem comprador';
            base.title = 'Venda de Gado';
            base.subtitle = ev.desc || ev.nome || ((ev.qty || 0) + ' cabecas vendidas');
            if (!base.pasto && base.lote) {
                var loteAtual = this.getLoteAtual(base.lote);
                if (loteAtual && loteAtual.pasto) base.pasto = loteAtual.pasto;
            }
            base.searchText = [base.title, base.counterpart, base.lote, base.pasto, ev.desc, ev.nome].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'ESTOQUE_ENTRADA') {
            base.area = 'insumos';
            base.direction = 'saida';
            base.status = 'pago';
            base.counterpart = ev.fornecedor || 'Sem fornecedor';
            base.title = 'Entrada de Insumo';
            base.subtitle = (ev.name || ev.nome || 'Insumo') + ' - ' + (ev.category || ev.categoria || 'outros');
            base.subcategory = ev.category || ev.categoria || 'outros';
            base.searchText = [base.title, base.counterpart, base.subcategory, ev.name, ev.nome, ev.desc].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'OBRA_REGISTRO') {
            base.area = 'obras';
            base.direction = 'saida';
            base.status = ev.custoRestante > 0 ? 'parcial' : 'pago';
            base.counterpart = ev.nome || 'Obra';
            base.title = 'Obra';
            base.subtitle = (ev.nome || 'Obra') + (ev.categoria ? ' - ' + ev.categoria : '');
            base.pasto = ev.pasto || '';
            base.searchText = [base.title, base.counterpart, base.subtitle, base.pasto, ev.desc].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'MANEJO' || ev.type === 'MANEJO_SANITARIO') {
            base.area = (ev.centerCost === 'NUTRICAO' || ev.centerCost === 'SANIDADE') ? 'insumos' : 'manejo';
            base.direction = 'saida';
            base.status = 'pago';
            base.counterpart = ev.lote || ev.pasto || 'Manejo';
            base.title = 'Manejo';
            base.subtitle = (ev.tipoManejo || ev.tipo || 'Manejo') + (ev.desc ? ' - ' + ev.desc : '');
            base.searchText = [base.title, base.counterpart, base.subtitle, ev.produto, ev.desc].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'FUNCIONARIO_CADASTRO') {
            if (!base.value) return null;
            base.area = 'funcionarios';
            base.direction = 'saida';
            base.status = 'referencia';
            base.counterpart = ev.nome || 'Funcionario';
            base.title = 'Cadastro de Funcionario';
            base.subtitle = (ev.funcao || 'Sem funcao') + ' - base de valor';
            base.searchText = [base.title, base.counterpart, base.subtitle].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'CONTA_PAGAR' || ev.type === 'CONTA_RECEBER') {
            base.area = 'contas';
            base.direction = ev.type === 'CONTA_RECEBER' ? 'entrada' : 'saida';
            base.status = (ev.pago || ev.status === 'pago') ? 'pago' : 'pendente';
            base.counterpart = this.normalizeCounterpart(ev);
            base.title = ev.type === 'CONTA_RECEBER' ? 'Conta a Receber' : 'Conta a Pagar';
            base.subtitle = ev.nome || ev.desc || base.title;
            base.subcategory = ev.categoria || '';
            base.excludeFromTotals = this.isLinkedAccount(ev);
            base.searchText = [base.title, base.counterpart, base.subtitle, base.subcategory].join(' ').toLowerCase();
            return base;
        }

        if (ev.type === 'ESTORNO') {
            base.area = 'ajustes';
            base.direction = ev.tipoOriginal === 'VENDA' ? 'saida' : 'entrada';
            base.status = 'ajuste';
            base.counterpart = ev.tipoOriginal || 'Estorno';
            base.title = 'Estorno';
            base.subtitle = ev.desc || ev.nome || 'Estorno';
            base.searchText = [base.title, base.counterpart, base.subtitle].join(' ').toLowerCase();
            return base;
        }

        return null;
    },

    getMovements: function () {
        if (!window.data || !window.data.events) return [];
        var self = this;
        return window.data.events.map(function (ev) {
            return self.getMovementFromEvent(ev);
        }).filter(Boolean).sort(function (a, b) {
            return new Date((b.date || '1970-01-01')) - new Date((a.date || '1970-01-01'));
        });
    },

    applyFilters: function (movements) {
        var filters = this.filters;
        return movements.filter(function (movement) {
            if (filters.area && filters.area !== 'geral') {
                if (filters.area === 'operacional') {
                    if (['obras', 'funcionarios', 'manejo', 'contas', 'ajustes'].indexOf(movement.area) < 0) return false;
                } else if (movement.area !== filters.area) {
                    return false;
                }
            }
            if (filters.type && movement.type !== filters.type) return false;
            if (filters.counterpart && movement.counterpart !== filters.counterpart) return false;
            if (filters.lote && movement.lote !== filters.lote) return false;
            if (filters.pasto && movement.pasto !== filters.pasto) return false;
            if (filters.status && movement.status !== filters.status) return false;
            if (filters.paymentType && movement.paymentType !== filters.paymentType) return false;
            if (filters.centerCost && movement.centerCost !== filters.centerCost) return false;
            if (filters.dateFrom && movement.date < filters.dateFrom) return false;
            if (filters.dateTo && movement.date > filters.dateTo) return false;
            if (filters.search && movement.searchText.indexOf(filters.search.toLowerCase()) < 0) return false;
            return true;
        });
    },

    getFilterOptions: function (movements) {
        var options = {
            type: {},
            counterpart: {},
            lote: {},
            pasto: {},
            status: {},
            paymentType: {},
            centerCost: {}
        };

        movements.forEach(function (movement) {
            if (movement.type) options.type[movement.type] = true;
            if (movement.counterpart) options.counterpart[movement.counterpart] = true;
            if (movement.lote) options.lote[movement.lote] = true;
            if (movement.pasto) options.pasto[movement.pasto] = true;
            if (movement.status) options.status[movement.status] = true;
            if (movement.paymentType) options.paymentType[movement.paymentType] = true;
            if (movement.centerCost) options.centerCost[movement.centerCost] = true;
        });

        Object.keys(options).forEach(function (key) {
            options[key] = Object.keys(options[key]).sort();
        });

        return options;
    },

    renderSelect: function (field, label, options, placeholder) {
        var self = this;
        var current = this.filters[field] || '';
        var html = '<label style="display:flex;flex-direction:column;gap:4px;min-width:150px;">'
            + '<span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">' + label + '</span>'
            + '<select onchange="window.financeiro.setFilter(\'' + field + '\', this.value)" style="padding:8px;border:1px solid var(--border-subtle,#CBD5E1);border-radius:8px;background:var(--bg-1,#fff);color:var(--text-0,#0F172A);">'
            + '<option value="">' + this.escapeHtml(placeholder) + '</option>';

        options.forEach(function (option) {
            html += '<option value="' + self.escapeHtml(option) + '"' + (option === current ? ' selected' : '') + '>'
                + self.escapeHtml(option) + '</option>';
        });

        html += '</select></label>';
        return html;
    },

    renderQuickAreas: function () {
        var self = this;
        var items = [
            { id: 'geral', label: 'Geral' },
            { id: 'gado', label: 'Gado' },
            { id: 'insumos', label: 'Insumos' },
            { id: 'operacional', label: 'Operacional' },
            { id: 'contas', label: 'Contas' },
            { id: 'ajustes', label: 'Ajustes' }
        ];

        return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">'
            + items.map(function (item) {
                var active = self.filters.area === item.id;
                return '<button type="button" class="filter-btn' + (active ? ' active' : '') + '" '
                    + 'style="' + (active ? 'background:#0F766E;color:#fff;border-color:#0F766E;' : '') + '" '
                    + 'onclick="window.financeiro.setArea(\'' + item.id + '\')">' + item.label + '</button>';
            }).join('')
            + '</div>';
    },

    renderSummaryCards: function (movements) {
        var totalEntradas = 0;
        var totalSaidas = 0;
        var pendencias = 0;
        var receivables = 0;

        movements.forEach(function (movement) {
            if (!movement.excludeFromTotals) {
                if (movement.direction === 'entrada') totalEntradas += movement.value;
                else totalSaidas += movement.value;
            }

            if (movement.area === 'contas' && movement.status === 'pendente') {
                if (movement.direction === 'saida') pendencias += movement.value;
                else receivables += movement.value;
            }
        });

        var saldo = totalEntradas - totalSaidas;
        return '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Entradas</div><div class="kpi-value positive">' + this.fmtMoney(totalEntradas) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Saidas</div><div class="kpi-value negative">' + this.fmtMoney(totalSaidas) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Saldo</div><div class="kpi-value ' + (saldo >= 0 ? 'positive' : 'negative') + '">' + this.fmtMoney(saldo) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pendencias</div><div class="kpi-value">' + this.fmtMoney(pendencias + receivables) + '</div></div>'
            + '</div>';
    },

    renderMovementCard: function (movement) {
        var amountClass = movement.direction === 'entrada' ? 'positive' : 'negative';
        var sign = movement.direction === 'entrada' ? '+' : '-';
        var meta = [];
        if (movement.counterpart) meta.push('Com: ' + this.escapeHtml(movement.counterpart));
        if (movement.lote) meta.push('Lote: ' + this.escapeHtml(movement.lote));
        if (movement.pasto) meta.push('Pasto: ' + this.escapeHtml(movement.pasto));
        if (movement.centerCost) meta.push('Centro: ' + this.escapeHtml(movement.centerCost));

        return '<div class="history-card" style="margin-bottom:8px;">'
            + '<div class="history-card-header">'
            + '<span class="badge badge-blue">' + this.escapeHtml(movement.title) + '</span>'
            + '<span class="date">' + this.fmtDate(movement.date) + '</span></div>'
            + '<div class="history-card-body">'
            + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">'
            + '<div style="flex:1;min-width:0;">'
            + '<div style="font-weight:700;color:var(--text-0,#0F172A);">' + this.escapeHtml(movement.subtitle || movement.title) + '</div>'
            + '<div style="font-size:12px;color:#64748B;margin-top:4px;">' + meta.join(' | ') + '</div>'
            + '<div style="font-size:11px;color:#94A3B8;margin-top:4px;">Status: ' + this.escapeHtml(movement.status || '--') + (movement.paymentType ? ' | Pgto: ' + this.escapeHtml(movement.paymentType) : '') + '</div>'
            + '</div>'
            + '<div style="text-align:right;white-space:nowrap;">'
            + '<div class="' + amountClass + '" style="font-size:16px;font-weight:800;">' + sign + ' ' + this.fmtMoney(movement.value) + '</div>'
            + (movement.type !== 'ESTORNO' ? '<button class="btn-sm" style="margin-top:8px;background:#64748B;" onclick="window.financeiro.estornar(\'' + movement.id + '\')">Estornar</button>' : '')
            + '</div>'
            + '</div></div></div>';
    },

    renderMovementSections: function (movements) {
        if (!movements.length) {
            return '<div class="empty-state"><span class="empty-state-icon">💸</span><div class="empty-state-title">Sem lancamentos</div><div class="empty-state-text">Nenhum movimento encontrado com os filtros atuais.</div></div>';
        }

        if (this.filters.area && this.filters.area !== 'geral') {
            return movements.map(this.renderMovementCard.bind(this)).join('');
        }

        var groups = { gado: [], insumos: [], obras: [], funcionarios: [], manejo: [], contas: [], ajustes: [] };
        movements.forEach(function (movement) {
            if (!groups[movement.area]) groups[movement.area] = [];
            groups[movement.area].push(movement);
        });

        var titles = {
            gado: 'Area reservada: Compra e Venda de Gado',
            insumos: 'Area reservada: Insumos e Almoxarifado',
            obras: 'Area reservada: Obras',
            funcionarios: 'Area reservada: Funcionarios',
            manejo: 'Area reservada: Manejo',
            contas: 'Contas e Pendencias',
            ajustes: 'Estornos e Ajustes'
        };

        var html = '';
        Object.keys(groups).forEach(function (key) {
            if (!groups[key] || !groups[key].length) return;
            html += '<div class="section-title" style="margin:18px 0 8px;">' + titles[key] + '</div>';
            html += groups[key].map(window.financeiro.renderMovementCard.bind(window.financeiro)).join('');
        });
        return html;
    },

    updateFluxoUI: function () {
        var container = this.el('fluxo-content');
        if (!container || !window.data) return;

        this.bindForms();
        this.ensureDefaultDates();

        var allMovements = this.getMovements();
        var filtered = this.applyFilters(allMovements);
        var options = this.getFilterOptions(allMovements);

        var html = this.renderQuickAreas();
        html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:flex-end;">'
            + this.renderSelect('type', 'Tipo', options.type, 'Todos os tipos')
            + this.renderSelect('counterpart', 'Com Quem', options.counterpart, 'Todas as partes')
            + this.renderSelect('lote', 'Lote', options.lote, 'Todos os lotes')
            + this.renderSelect('pasto', 'Pasto', options.pasto, 'Todos os pastos')
            + this.renderSelect('status', 'Status', options.status, 'Todos os status')
            + this.renderSelect('paymentType', 'Pagamento', options.paymentType, 'Todas as formas')
            + this.renderSelect('centerCost', 'Centro', options.centerCost, 'Todos os centros')
            + '<label style="display:flex;flex-direction:column;gap:4px;min-width:150px;"><span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">De</span><input type="date" value="' + this.escapeHtml(this.filters.dateFrom) + '" onchange="window.financeiro.setFilter(\'dateFrom\', this.value)" style="padding:8px;border:1px solid var(--border-subtle,#CBD5E1);border-radius:8px;background:var(--bg-1,#fff);color:var(--text-0,#0F172A);"></label>'
            + '<label style="display:flex;flex-direction:column;gap:4px;min-width:150px;"><span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Ate</span><input type="date" value="' + this.escapeHtml(this.filters.dateTo) + '" onchange="window.financeiro.setFilter(\'dateTo\', this.value)" style="padding:8px;border:1px solid var(--border-subtle,#CBD5E1);border-radius:8px;background:var(--bg-1,#fff);color:var(--text-0,#0F172A);"></label>'
            + '<label style="display:flex;flex-direction:column;gap:4px;min-width:220px;flex:1;"><span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Buscar</span><input type="text" value="' + this.escapeHtml(this.filters.search) + '" placeholder="item, fornecedor, comprador, lote..." oninput="window.financeiro.setFilter(\'search\', this.value)" style="padding:8px;border:1px solid var(--border-subtle,#CBD5E1);border-radius:8px;background:var(--bg-1,#fff);color:var(--text-0,#0F172A);"></label>'
            + '<button type="button" class="btn-sm" style="height:38px;align-self:flex-end;" onclick="window.financeiro.resetFilters()">Limpar</button>'
            + '</div>';

        html += this.renderSummaryCards(filtered);
        html += '<div class="section-title">Visao atual: ' + this.escapeHtml(this.filters.area === 'geral' ? 'Todas as despesas e receitas' : this.filters.area) + ' (' + filtered.length + ' lancamento(s))</div>';
        html += this.renderMovementSections(filtered);
        container.innerHTML = html;
    },

    renderBalanco: function () {
        var container = this.el('balanco-content');
        if (!container) return;

        var movements = this.getMovements();
        var totals = {
            receitas: 0,
            gado: 0,
            insumos: 0,
            obras: 0,
            funcionarios: 0,
            manejo: 0,
            contas: 0,
            ajustes: 0
        };

        movements.forEach(function (movement) {
            if (movement.excludeFromTotals) return;
            if (movement.direction === 'entrada') {
                totals.receitas += movement.value;
            } else if (totals[movement.area] !== undefined) {
                totals[movement.area] += movement.value;
            }
        });

        var despesasOperacionais = totals.insumos + totals.obras + totals.funcionarios + totals.manejo + totals.contas;
        var resultado = totals.receitas - totals.gado - despesasOperacionais + totals.ajustes;

        var html = '<div class="kpi-grid" style="margin-bottom:16px;">'
            + '<div class="kpi-card"><div class="kpi-label">Receitas</div><div class="kpi-value positive">' + this.fmtMoney(totals.receitas) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Compra de Gado</div><div class="kpi-value negative">' + this.fmtMoney(totals.gado) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Insumos</div><div class="kpi-value negative">' + this.fmtMoney(totals.insumos) + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Resultado</div><div class="kpi-value ' + (resultado >= 0 ? 'positive' : 'negative') + '">' + this.fmtMoney(resultado) + '</div></div>'
            + '</div>';

        html += '<div class="section-title">Composicao das despesas</div>'
            + '<div class="history-card"><div class="history-card-body">'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
            + '<div><strong>Gado:</strong> ' + this.fmtMoney(totals.gado) + '</div>'
            + '<div><strong>Insumos:</strong> ' + this.fmtMoney(totals.insumos) + '</div>'
            + '<div><strong>Obras:</strong> ' + this.fmtMoney(totals.obras) + '</div>'
            + '<div><strong>Funcionarios:</strong> ' + this.fmtMoney(totals.funcionarios) + '</div>'
            + '<div><strong>Manejo:</strong> ' + this.fmtMoney(totals.manejo) + '</div>'
            + '<div><strong>Contas:</strong> ' + this.fmtMoney(totals.contas) + '</div>'
            + '</div>'
            + '<div style="margin-top:10px;font-size:13px;color:#64748B;">Visao consolidada para separar gasto com gado, insumos e despesas operacionais dentro do financeiro.</div>'
            + '</div></div>';

        container.innerHTML = html;
    },

    estornar: function (eventId) {
        if (!window.data) return;
        var evento = window.data.getById ? window.data.getById(eventId) : null;
        if (!evento) {
            window.app.showToast('Evento nao encontrado.', 'error');
            return;
        }
        if (evento.estornado) {
            window.app.showToast('Este lancamento ja foi estornado.', 'error');
            return;
        }

        var valor = Number(evento.value || evento.cost || evento.custo || evento.valor || 0);
        evento.estornado = true;
        evento.dataEstorno = new Date().toISOString();

        var linked = this.getLinkedEvents(evento);
        linked.forEach(function (linkedEvent) {
            if (linkedEvent.type === 'CONTA_PAGAR' || linkedEvent.type === 'CONTA_RECEBER') {
                linkedEvent.estornado = true;
                linkedEvent.dataEstorno = new Date().toISOString();
            }
        });

        if ((evento.type === 'COMPRA' || evento.type === 'VENDA') && evento.lote && window.lotes && window.lotes.getLoteByNome) {
            var loteAtual = window.lotes.getLoteByNome(evento.lote);
            if (loteAtual) {
                var delta = Number(evento.qty || evento.cabecas || 0);
                if (evento.type === 'COMPRA') delta = -delta;
                var novaQtd = Math.max(0, (loteAtual.qtdAnimais || 0) + delta);
                window.data.saveEvent({
                    type: 'LOTE',
                    nome: loteAtual.nome,
                    categoria: loteAtual.categoria,
                    raca: loteAtual.raca,
                    qtdAnimais: novaQtd,
                    pesoMedio: loteAtual.pesoMedio,
                    pasto: loteAtual.pasto,
                    status: novaQtd > 0 ? 'ATIVO' : 'INATIVO',
                    dataEntrada: loteAtual.dataEntrada,
                    centerCost: 'GADO_CORTE',
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }

        var estorno = window.data.saveEvent({
            type: 'ESTORNO',
            eventoOriginalId: eventId,
            tipoOriginal: evento.type,
            desc: 'ESTORNO: ' + (evento.desc || evento.nome || evento.type),
            nome: 'ESTORNO: ' + (evento.desc || evento.nome || evento.type),
            value: valor,
            linkedEventIds: [eventId],
            centerCost: evento.centerCost || 'OPERACIONAL',
            date: new Date().toISOString().split('T')[0]
        });
        window.data.linkEvents(eventId, estorno.id);
        window.data.save();

        window.app.showToast('Lancamento estornado.');
        this.updateFluxoUI();
        this.renderBalanco();
        if (window.contas && window.contas.renderContasPagar) window.contas.renderContasPagar();
    }
};