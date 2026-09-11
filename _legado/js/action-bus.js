// ====== ACTION-BUS.JS - Execucao segura das acoes de agentes ======
window.actionBus = {
    STORAGE_KEY: 'agromacro_agent_action_bus',
    _handlers: {},
    _pending: {},

    init: function () {
        this._registerDefaultHandlers();
        console.log('ActionBus ready - ' + Object.keys(this._handlers).length + ' handlers');
    },

    registerHandler: function (actionType, handler, meta) {
        this._handlers[actionType] = {
            run: handler,
            meta: meta || {}
        };
    },

    canHandle: function (actionType) {
        return !!this._handlers[actionType];
    },

    getRegisteredActions: function () {
        return Object.keys(this._handlers).sort();
    },

    requestConfirmation: function (action, meta) {
        var requestId = 'pending_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        this._pending[requestId] = {
            action: action,
            meta: meta || {},
            createdAt: new Date().toISOString()
        };

        this._writeAudit({
            type: 'PENDING',
            requestId: requestId,
            actionType: action && action.tipo,
            agentName: meta && meta.agentName
        });

        return {
            ok: true,
            pending: true,
            requestId: requestId,
            message: 'Acao pendente de confirmacao: ' + (action && action.tipo ? action.tipo : 'DESCONHECIDA')
        };
    },

    confirm: function (requestId, meta) {
        var pending = this._pending[requestId];
        if (!pending) {
            return { ok: false, message: 'Acao pendente nao encontrada.' };
        }

        delete this._pending[requestId];
        return this.execute(pending.action, this._mergeMeta(pending.meta, meta));
    },

    cancel: function (requestId, meta) {
        var pending = this._pending[requestId];
        if (!pending) {
            return { ok: false, message: 'Acao pendente nao encontrada.' };
        }

        delete this._pending[requestId];
        this._writeAudit({
            type: 'CANCELLED',
            requestId: requestId,
            actionType: pending.action && pending.action.tipo,
            agentName: (meta && meta.agentName) || (pending.meta && pending.meta.agentName)
        });

        return { ok: true, message: 'Acao cancelada.' };
    },

    execute: function (action, meta) {
        if (!action || !action.tipo) {
            return { ok: false, message: 'Acao invalida.' };
        }

        var handlerEntry = this._handlers[action.tipo];
        if (!handlerEntry) {
            return { ok: false, message: 'Acao nao suportada: ' + action.tipo };
        }

        try {
            var result = handlerEntry.run.call(this, action, meta || {});
            this._writeAudit({
                type: result && result.ok === false ? 'ERROR' : 'EXECUTED',
                actionType: action.tipo,
                agentName: meta && meta.agentName,
                message: result && result.message ? result.message : ''
            });
            return result || { ok: true, message: 'Acao executada.' };
        } catch (error) {
            this._writeAudit({
                type: 'ERROR',
                actionType: action.tipo,
                agentName: meta && meta.agentName,
                message: error.message || String(error)
            });
            return { ok: false, message: 'Erro ao executar ' + action.tipo + ': ' + (error.message || error) };
        }
    },

    recordEvent: function (eventData, meta) {
        var payload = this._clone(eventData);
        payload.agentMeta = {
            source: 'actionBus',
            agentName: meta && meta.agentName ? meta.agentName : 'unknown',
            actorType: meta && meta.actorType ? meta.actorType : 'agent',
            requestedBy: meta && meta.requestedBy ? meta.requestedBy : 'user'
        };

        if (window.data && typeof window.data.saveEvent === 'function') {
            return window.data.saveEvent(payload);
        }

        if (window.data && Array.isArray(window.data.events)) {
            window.data.events.push(payload);
            if (typeof window.data.save === 'function') window.data.save();
        }

        return payload;
    },

    _registerDefaultHandlers: function () {
        this.registerHandler('REGISTRAR_LOTE', function (action, meta) {
            var data = action.dados || {};
            var loteEvent = this.recordEvent({
                type: 'LOTE',
                nome: data.nome || ('Lote ' + new Date().toLocaleDateString('pt-BR')),
                qtdAnimais: parseInt(data.qtdAnimais, 10) || 0,
                categoria: data.categoria || 'engorda',
                pasto: data.pasto || '',
                pesoMedio: parseFloat(data.pesoMedio) || 0,
                raca: data.raca || 'Nelore',
                status: 'ATIVO',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Lote "' + loteEvent.nome + '" criado com ' + loteEvent.qtdAnimais + ' cabecas.' };
        });

        this.registerHandler('REGISTRAR_COMPRA', function (action, meta) {
            var data = action.dados || {};
            var value = parseFloat(data.valor) || 0;
            var compraEvent = this.recordEvent({
                type: 'COMPRA',
                qtd: parseInt(data.qtd, 10) || 0,
                value: value,
                valor: value,
                valorTotal: value,
                pesoMedio: parseFloat(data.pesoMedio) || 0,
                desc: data.descricao || 'Compra via agente',
                fornecedor: data.fornecedor || '',
                lote: data.lote || '',
                pasto: data.pasto || '',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Compra registrada: ' + compraEvent.qtd + ' cab, R$ ' + value.toLocaleString('pt-BR') + '.' };
        });

        this.registerHandler('REGISTRAR_VENDA', function (action, meta) {
            var data = action.dados || {};
            var value = parseFloat(data.valor) || 0;
            var vendaEvent = this.recordEvent({
                type: 'VENDA',
                qtd: parseInt(data.qtd, 10) || 0,
                value: value,
                valor: value,
                valorTotal: value,
                pesoMedio: parseFloat(data.pesoMedio) || 0,
                desc: data.descricao || 'Venda via agente',
                comprador: data.comprador || '',
                lote: data.lote || '',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Venda registrada: ' + vendaEvent.qtd + ' cab, R$ ' + value.toLocaleString('pt-BR') + '.' };
        });

        this.registerHandler('MOVER_LOTE', function (action, meta) {
            var data = action.dados || {};
            var lote = this._findLote(data.lote);
            if (!lote) return { ok: false, message: 'Lote nao encontrado: ' + (data.lote || '') };

            lote.pasto = data.pastoPara || lote.pasto || '';
            if (window.data && typeof window.data.save === 'function') window.data.save();

            this.recordEvent({
                type: 'MOVIMENTACAO',
                lote: lote.nome,
                loteId: lote.id,
                pastoDe: data.pastoDe || '',
                pastoPara: data.pastoPara || '',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Lote "' + lote.nome + '" movido para ' + (data.pastoPara || 'destino nao informado') + '.' };
        });

        this.registerHandler('REGISTRAR_MORTE', function (action, meta) {
            var data = action.dados || {};
            var lote = this._findLote(data.lote);
            var qtd = parseInt(data.qtd, 10) || 1;
            if (!lote) return { ok: false, message: 'Lote nao encontrado: ' + (data.lote || '') };

            lote.qtdAnimais = Math.max(0, (lote.qtdAnimais || 0) - qtd);
            if (window.data && typeof window.data.save === 'function') window.data.save();

            this.recordEvent({
                type: 'MORTE',
                lote: lote.nome,
                loteId: lote.id,
                qtd: qtd,
                motivo: data.motivo || 'Nao informado',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Morte registrada: ' + qtd + ' cab em "' + lote.nome + '".' };
        });

        this.registerHandler('REGISTRAR_NASCIMENTO', function (action, meta) {
            var data = action.dados || {};
            var lote = this._findLote(data.lote);
            var qtd = parseInt(data.qtd, 10) || 1;
            if (!lote) return { ok: false, message: 'Lote nao encontrado: ' + (data.lote || '') };

            lote.qtdAnimais = (lote.qtdAnimais || 0) + qtd;
            if (window.data && typeof window.data.save === 'function') window.data.save();

            this.recordEvent({
                type: 'NASCIMENTO',
                lote: lote.nome,
                loteId: lote.id,
                qtd: qtd,
                sexo: data.sexo || 'indefinido',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Nascimento registrado: +' + qtd + ' cab em "' + lote.nome + '".' };
        });

        this.registerHandler('REGISTRAR_PESAGEM', function (action, meta) {
            var data = action.dados || {};
            var lote = this._findLote(data.lote);
            var peso = parseFloat(data.pesoMedio) || 0;
            if (!lote) return { ok: false, message: 'Lote nao encontrado: ' + (data.lote || '') };

            lote.pesoMedio = peso;
            if (window.data && typeof window.data.save === 'function') window.data.save();

            this.recordEvent({
                type: 'PESAGEM',
                lote: lote.nome,
                loteId: lote.id,
                pesoMedio: peso,
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Pesagem registrada: ' + peso + ' kg em "' + lote.nome + '".' };
        });

        this.registerHandler('REGISTRAR_CONTA', function (action, meta) {
            var data = action.dados || {};
            var value = parseFloat(data.valor) || 0;
            this.recordEvent({
                type: 'CONTA',
                desc: data.descricao || 'Conta via agente',
                value: value,
                valor: value,
                vencimento: data.vencimento || new Date(Date.now() + (30 * 86400000)).toISOString().split('T')[0],
                pago: false,
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Conta registrada: "' + (data.descricao || 'Conta via agente') + '".' };
        });

        this.registerHandler('REGISTRAR_ESTOQUE', function (action, meta) {
            var data = action.dados || {};
            var qty = parseFloat(data.quantidade) || 0;
            var unitPrice = parseFloat(data.valorUnitario) || 0;
            var total = parseFloat(data.valorTotal) || 0;
            var category = data.categoria || 'racao_sal';
            if (window.estoque && typeof window.estoque.inferCategory === 'function') {
                category = window.estoque.inferCategory(data.nome || '') || category;
            }
            if (!total && unitPrice && qty) total = unitPrice * qty;

            this.recordEvent({
                type: 'ENTRADA',
                product: data.nome || 'Produto via agente',
                qty: qty,
                unit: data.unidade || 'kg',
                category: category,
                unitPrice: unitPrice,
                total: total,
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Estoque registrado: +' + qty + ' ' + (data.unidade || 'kg') + ' de "' + (data.nome || 'Produto via agente') + '".' };
        });

        this.registerHandler('REGISTRAR_MANEJO', function (action, meta) {
            var data = action.dados || {};
            var lote = this._findLote(data.lote);
            if (!lote) return { ok: false, message: 'Lote nao encontrado: ' + (data.lote || '') };

            this.recordEvent({
                type: 'MANEJO',
                lote: lote.nome,
                loteId: lote.id,
                tipoManejo: data.tipoManejo || 'sanitario',
                produtos: data.produtos || '',
                obs: data.observacao || 'Manejo via agente',
                qtdAnimais: lote.qtdAnimais || 0,
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Manejo "' + (data.tipoManejo || 'sanitario') + '" registrado em "' + lote.nome + '".' };
        });

        this.registerHandler('TRACAR_META', function (action, meta) {
            var data = action.dados || {};
            var qtyArrobas = parseFloat(data.qtdArrobas) || 0;
            if (!qtyArrobas) {
                qtyArrobas = this._calculateEstimatedArrobas();
            }

            var price = parseFloat(data.precoAlvo) || 0;
            this.recordEvent({
                type: 'META_MERCADO',
                tipoMeta: data.tipo || 'venda',
                precoAlvo: price,
                dataLimite: data.dataLimite || '',
                modalidade: data.modalidade || 'spot',
                lote: data.lote || '',
                qtdArrobas: qtyArrobas,
                obs: data.observacao || '',
                status: 'ATIVA',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Meta registrada: R$ ' + price.toFixed(2) + '/@ para ' + qtyArrobas + '@.' };
        });

        this.registerHandler('BAIXAR_ESTOQUE', function (action, meta) {
            var data = action.dados || {};
            var stock = this._getStockBalances();
            var item = this._findStockItem(stock, data.nome || '');
            var qty = parseFloat(data.quantidade) || 1;
            if (!item) return { ok: false, message: 'Produto nao encontrado no estoque: ' + (data.nome || '') };

            this.recordEvent({
                type: 'SAIDA',
                product: item.nome,
                qty: qty,
                unit: item.unidade,
                motivo: data.motivo || 'Uso via agente',
                date: new Date().toISOString()
            }, meta);

            return { ok: true, message: 'Saida registrada: -' + qty + ' ' + item.unidade + ' de "' + item.nome + '".' };
        });
    },

    _findLote: function (loteName) {
        var normalized = this._normalizeText(loteName || '');
        var activeLotes = ((window.data && window.data.events) || []).filter(function (eventItem) {
            return eventItem.type === 'LOTE' && !eventItem.estornado;
        });

        for (var index = 0; index < activeLotes.length; index++) {
            var lote = activeLotes[index];
            if (this._normalizeText(lote.nome || '').indexOf(normalized) >= 0 || normalized.indexOf(this._normalizeText(lote.nome || '')) >= 0) {
                return lote;
            }
        }

        return null;
    },

    _calculateEstimatedArrobas: function () {
        return ((window.data && window.data.events) || []).filter(function (eventItem) {
            return eventItem.type === 'LOTE' && !eventItem.estornado;
        }).reduce(function (accumulator, lote) {
            return accumulator + Math.round(((lote.pesoMedio || 0) * (lote.qtdAnimais || 0)) / 30);
        }, 0);
    },

    _getStockBalances: function () {
        var balances = {};
        ((window.data && window.data.events) || []).forEach(function (eventItem) {
            var type = eventItem.type;
            var key = (eventItem.product || eventItem.nome || '').toLowerCase();
            if (!key) return;

            if (!balances[key]) {
                balances[key] = {
                    nome: eventItem.product || eventItem.nome || '--',
                    qtd: 0,
                    unidade: eventItem.unit || eventItem.unidade || 'un'
                };
            }

            if ((type === 'ENTRADA' || type === 'ESTOQUE_ITEM') && !eventItem.estornado) {
                balances[key].qtd += Number(eventItem.qty || eventItem.qtd || 0);
            }

            if (type === 'SAIDA' && !eventItem.estornado) {
                balances[key].qtd -= Number(eventItem.qty || eventItem.qtd || 0);
            }
        });

        return balances;
    },

    _findStockItem: function (balances, itemName) {
        var normalized = this._normalizeText(itemName || '');
        var keys = Object.keys(balances);

        for (var index = 0; index < keys.length; index++) {
            var key = keys[index];
            if (key.indexOf(normalized) >= 0 || normalized.indexOf(key) >= 0) {
                return balances[key];
            }
        }

        return null;
    },

    _normalizeText: function (value) {
        var text = String(value || '').toLowerCase();
        if (typeof text.normalize === 'function') {
            text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return text;
    },

    _mergeMeta: function (baseMeta, nextMeta) {
        var merged = this._clone(baseMeta || {});
        var extra = nextMeta || {};
        Object.keys(extra).forEach(function (key) {
            merged[key] = extra[key];
        });
        return merged;
    },

    _writeAudit: function (entry) {
        try {
            var list = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            list.push({
                timestamp: new Date().toISOString(),
                entry: entry
            });
            if (list.length > 300) list = list.slice(-300);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (error) {
            console.warn('ActionBus audit failed:', error);
        }
    },

    _clone: function (value) {
        return JSON.parse(JSON.stringify(value || {}));
    }
};
