// ====== DATA.JS — Camada de Persistencia v3 (Schema + Linked Events + Centro de Custo) ======
window.data = {
    events: [],
    STORAGE_KEY: 'agromacro_events_v2',
    BACKUP_KEY: 'agromacro_events_backup',
    VERSION: 3,
    _saveCount: 0,

    CENTER_COSTS: {
        COMPRA: 'GADO_CORTE',
        VENDA: 'GADO_CORTE',
        ESTOQUE_ENTRADA: function (ev) {
            var cat = (ev.category || ev.categoria || '').toLowerCase();
            if (cat === 'racao_sal') return 'NUTRICAO';
            if (cat === 'remedios') return 'SANIDADE';
            if (cat === 'obras') return 'INFRAESTRUTURA';
            var name = (ev.name || ev.nome || ev.desc || '').toLowerCase();
            if (name.indexOf('sal') >= 0 || name.indexOf('racao') >= 0 || name.indexOf('ração') >= 0 || name.indexOf('milho') >= 0 || name.indexOf('silagem') >= 0 || name.indexOf('farelo') >= 0 || name.indexOf('proteinado') >= 0) return 'NUTRICAO';
            if (name.indexOf('vacina') >= 0 || name.indexOf('verm') >= 0 || name.indexOf('antibio') >= 0 || name.indexOf('remedio') >= 0) return 'SANIDADE';
            if (name.indexOf('arame') >= 0 || name.indexOf('cimento') >= 0 || name.indexOf('estaca') >= 0 || name.indexOf('telha') >= 0 || name.indexOf('madeira') >= 0) return 'INFRAESTRUTURA';
            return 'OUTROS';
        },
        SAIDA_ESTOQUE: 'OPERACIONAL',
        LOTE: 'GADO_CORTE',
        MANEJO: function (ev) {
            var tipo = (ev.tipoManejo || '').toLowerCase();
            if (tipo === 'nutricao') return 'NUTRICAO';
            if (tipo === 'vacinacao' || tipo === 'vermifugacao') return 'SANIDADE';
            return 'OPERACIONAL';
        },
        MANEJO_SANITARIO: 'SANIDADE',
        OBRA_REGISTRO: 'INFRAESTRUTURA',
        CONTA_PAGAR: function (ev) {
            var cat = (ev.categoria || '').toLowerCase();
            if (cat === 'nutricao') return 'NUTRICAO';
            if (cat === 'sanidade') return 'SANIDADE';
            if (cat === 'obras' || cat === 'infraestrutura') return 'INFRAESTRUTURA';
            if (cat === 'mao_obra' || cat === 'salario') return 'ADMINISTRACAO';
            if (cat === 'estoque') {
                var nome = (ev.nome || ev.desc || '').toLowerCase();
                if (nome.indexOf('sal') >= 0 || nome.indexOf('racao') >= 0 || nome.indexOf('ração') >= 0) return 'NUTRICAO';
                if (nome.indexOf('vacina') >= 0 || nome.indexOf('remedio') >= 0) return 'SANIDADE';
                return 'OPERACIONAL';
            }
            return 'ADMINISTRACAO';
        },
        CONTA_RECEBER: 'GADO_CORTE',
        FUNCIONARIO_CADASTRO: 'ADMINISTRACAO',
        FUNCIONARIO_INATIVAR: 'ADMINISTRACAO',
        FUNCIONARIO: 'ADMINISTRACAO',
        ABASTECIMENTO: 'NUTRICAO',
        ESTORNO: 'OPERACIONAL',
        MOVIMENTACAO_PASTO: 'OPERACIONAL',
        JUNCAO_LOTES: 'OPERACIONAL',
        ANIMAL: 'GADO_CORTE',
        ANIMAL_LOTE: 'GADO_CORTE'
    },

    REQUIRED_FIELDS: {
        COMPRA: ['qty', 'value'],
        VENDA: ['qty', 'value'],
        ESTOQUE_ENTRADA: ['name'],
        LOTE: ['nome'],
        MANEJO: ['desc'],
        OBRA_REGISTRO: ['nome'],
        CONTA_PAGAR: ['value'],
        FUNCIONARIO_CADASTRO: ['nome']
    },

    init: function () {
        this.load();
        this.migrate();
        console.log('Data v3: ' + this.events.length + ' eventos carregados.');
    },

    normalizeValueField: function (ev) {
        if (!ev) return false;
        if (ev.valor !== undefined && ev.value === undefined) {
            ev.value = ev.valor;
            return true;
        }
        if (ev.cost !== undefined && ev.value === undefined) {
            ev.value = ev.cost;
            return true;
        }
        if (ev.custo !== undefined && ev.value === undefined) {
            ev.value = ev.custo;
            return true;
        }
        return false;
    },

    generateId: function () {
        var ts = Date.now().toString(36);
        var rnd = Math.random().toString(36).substr(2, 6);
        return 'E' + ts + '-' + rnd;
    },

    load: function () {
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            this.events = raw ? JSON.parse(raw) : [];
            var seen = {};
            var before = this.events.length;
            this.events = this.events.filter(function (ev) {
                var key = ev.id || JSON.stringify({ t: ev.type, n: ev.nome, d: ev.date, v: ev.value });
                if (seen[key]) return false;
                seen[key] = true;
                return true;
            });
            if (this.events.length < before) {
                console.log('Removidos ' + (before - this.events.length) + ' eventos duplicados');
                this.save();
            }
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            this.events = [];
        }
    },

    migrate: function () {
        var changed = false;
        var self = this;
        this.events.forEach(function (ev) {
            if (!ev.id) {
                ev.id = self.generateId();
                changed = true;
            }
            if (!ev.timestamp) {
                ev.timestamp = ev.date ? new Date(ev.date).toISOString() : new Date().toISOString();
                changed = true;
            }
            if (self.normalizeValueField(ev)) changed = true;
            if (!ev.linkedEventIds) {
                ev.linkedEventIds = [];
                changed = true;
            }
            if (!ev.centerCost && ev.type) {
                var resolver = self.CENTER_COSTS[ev.type];
                if (typeof resolver === 'function') {
                    ev.centerCost = resolver(ev);
                } else if (typeof resolver === 'string') {
                    ev.centerCost = resolver;
                }
                if (ev.centerCost) changed = true;
            }
            if (ev.type === 'CONTA_PAGAR') {
                if (ev.status === 'pago' && ev.pago === undefined) {
                    ev.pago = true;
                    changed = true;
                }
                if (ev.pago === true && ev.status !== 'pago') {
                    ev.status = 'pago';
                    changed = true;
                }
                if (self.normalizeValueField(ev)) changed = true;
            }
        });
        if (changed) this.save();
    },

    save: function () {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
            this._saveCount++;
            if (this._saveCount % 50 === 0) this.autoBackup();
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
        }
    },

    saveEvent: function (ev) {
        if (!ev.id) ev.id = this.generateId();
        if (!ev.timestamp) ev.timestamp = new Date().toISOString();
        if (!ev.date) ev.date = new Date().toISOString().split('T')[0];
        if (!ev.linkedEventIds) ev.linkedEventIds = [];

        this.normalizeValueField(ev);

        if (!ev.centerCost && ev.type) {
            var resolver = this.CENTER_COSTS[ev.type];
            if (typeof resolver === 'function') {
                ev.centerCost = resolver(ev);
            } else if (typeof resolver === 'string') {
                ev.centerCost = resolver;
            }
        }

        this.events.push(ev);
        this.save();
        return ev;
    },

    linkEvents: function (eventId1, eventId2) {
        var ev1 = this.getById(eventId1);
        var ev2 = this.getById(eventId2);
        if (ev1 && ev2) {
            if (!ev1.linkedEventIds) ev1.linkedEventIds = [];
            if (!ev2.linkedEventIds) ev2.linkedEventIds = [];
            if (ev1.linkedEventIds.indexOf(eventId2) < 0) ev1.linkedEventIds.push(eventId2);
            if (ev2.linkedEventIds.indexOf(eventId1) < 0) ev2.linkedEventIds.push(eventId1);
            this.save();
        }
    },

    getById: function (id) {
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].id === id) return this.events[i];
        }
        return null;
    },

    getByType: function (type) {
        return this.events.filter(function (ev) { return ev.type === type; });
    },

    getByCenter: function (centerCost) {
        return this.events.filter(function (ev) { return ev.centerCost === centerCost; });
    },

    getLinked: function (eventId) {
        var ev = this.getById(eventId);
        if (!ev || !ev.linkedEventIds || ev.linkedEventIds.length === 0) return [];
        var self = this;
        return ev.linkedEventIds.map(function (lid) { return self.getById(lid); }).filter(Boolean);
    },

    getFinanceiro: function (filters) {
        filters = filters || {};
        var tiposFinanceiros = ['COMPRA', 'VENDA', 'ESTOQUE_ENTRADA', 'MANEJO', 'MANEJO_SANITARIO', 'CONTA_PAGAR', 'CONTA_RECEBER', 'OBRA_REGISTRO', 'ESTORNO'];
        return this.events.filter(function (ev) {
            if (ev.estornado) return false;
            if (tiposFinanceiros.indexOf(ev.type) < 0) return false;
            if (filters.type && ev.type !== filters.type) return false;
            if (filters.centerCost && ev.centerCost !== filters.centerCost) return false;
            if (filters.dateFrom) {
                var evDate = (ev.date || '').split('T')[0];
                if (evDate < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                var evDateTo = (ev.date || '').split('T')[0];
                if (evDateTo > filters.dateTo) return false;
            }
            return true;
        });
    },

    getTotals: function (dateFrom, dateTo) {
        var result = {
            entradas: 0,
            saidas: 0,
            saldo: 0,
            porCentro: {},
            porTipo: {}
        };
        var events = this.getFinanceiro({ dateFrom: dateFrom, dateTo: dateTo });
        events.forEach(function (ev) {
            var valor = ev.value || ev.custo || ev.cost || ev.valor || 0;
            var cc = ev.centerCost || 'OUTROS';
            if (!result.porCentro[cc]) result.porCentro[cc] = { entradas: 0, saidas: 0 };
            if (!result.porTipo[ev.type]) result.porTipo[ev.type] = { entradas: 0, saidas: 0 };

            if (ev.type === 'VENDA') {
                result.entradas += valor;
                result.porCentro[cc].entradas += valor;
                result.porTipo[ev.type].entradas += valor;
            } else if (ev.type === 'ESTORNO') {
                if (ev.tipoOriginal === 'VENDA') {
                    result.entradas -= valor;
                } else {
                    result.saidas -= valor;
                }
            } else if (valor > 0) {
                if (ev.type === 'CONTA_PAGAR' && !ev.pago && ev.status !== 'pago') {
                    return;
                }
                result.saidas += valor;
                result.porCentro[cc].saidas += valor;
                result.porTipo[ev.type].saidas += valor;
            }
        });
        result.saldo = result.entradas - result.saidas;
        return result;
    },

    getContasPendentes: function () {
        return this.events.filter(function (ev) {
            return ev.type === 'CONTA_PAGAR' && !ev.estornado && ev.status === 'pendente' && !ev.pago;
        });
    },

    getContasPagas: function () {
        return this.events.filter(function (ev) {
            return ev.type === 'CONTA_PAGAR' && !ev.estornado && (ev.pago || ev.status === 'pago');
        });
    },

    autoBackup: function () {
        try {
            var backup = {
                version: this.VERSION,
                date: new Date().toISOString(),
                count: this.events.length,
                data: JSON.stringify(this.events)
            };
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
            console.log('Backup automatico: ' + this.events.length + ' eventos');
        } catch (e) {
            console.error('Erro no backup:', e);
        }
    },

    restoreBackup: function () {
        try {
            var raw = localStorage.getItem(this.BACKUP_KEY);
            if (!raw) return false;
            var backup = JSON.parse(raw);
            this.events = JSON.parse(backup.data);
            this.save();
            console.log('Backup restaurado: ' + this.events.length + ' eventos de ' + backup.date);
            return true;
        } catch (e) {
            console.error('Erro ao restaurar backup:', e);
            return false;
        }
    },

    resetAll: function () {
        this.autoBackup();
        this.events = [];
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Todos os dados apagados. Backup salvo.');
    }
};
