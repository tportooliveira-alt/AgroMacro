// ====== EventRepository.js — Camada de Persistência Abstrata ======
window.EventRepository = (function() {
    'use strict';

    const STORAGE_KEY = 'agromacro_events_v2';
    const BACKUP_KEY = 'agromacro_events_backup';
    const SNAPSHOT_KEY = 'agromacro_snapshot_v1';
    const VERSION = 3;

    let events = [];
    let saveCount = 0;
    let snapshot = null;

    const CENTER_COSTS = {
        COMPRA: 'GADO_CORTE', VENDA: 'GADO_CORTE',
        ESTOQUE_ENTRADA: function(ev) {
            var cat = (ev.category || ev.categoria || '').toLowerCase();
            if (cat === 'racao_sal') return 'NUTRICAO';
            if (cat === 'remedios') return 'SANIDADE';
            if (cat === 'obras') return 'INFRAESTRUTURA';
            var name = (ev.name || ev.nome || ev.desc || '').toLowerCase();
            if (name.indexOf('sal') >= 0 || name.indexOf('racao') >= 0) return 'NUTRICAO';
            if (name.indexOf('vacina') >= 0 || name.indexOf('verm') >= 0) return 'SANIDADE';
            if (name.indexOf('arame') >= 0 || name.indexOf('cimento') >= 0) return 'INFRAESTRUTURA';
            return 'OUTROS';
        },
        SAIDA_ESTOQUE: 'OPERACIONAL', LOTE: 'GADO_CORTE',
        MANEJO: function(ev) {
            var tipo = (ev.tipoManejo || '').toLowerCase();
            if (tipo === 'nutricao') return 'NUTRICAO';
            if (tipo === 'vacinacao' || tipo === 'vermifugacao') return 'SANIDADE';
            return 'OPERACIONAL';
        },
        MANEJO_SANITARIO: 'SANIDADE', OBRA_REGISTRO: 'INFRAESTRUTURA',
        CONTA_PAGAR: function(ev) {
            var cat = (ev.categoria || '').toLowerCase();
            if (cat === 'nutricao') return 'NUTRICAO';
            if (cat === 'sanidade') return 'SANIDADE';
            if (cat === 'obras' || cat === 'infraestrutura') return 'INFRAESTRUTURA';
            if (cat === 'mao_obra' || cat === 'salario') return 'ADMINISTRACAO';
            return 'ADMINISTRACAO';
        },
        CONTA_RECEBER: 'GADO_CORTE',
        FUNCIONARIO_CADASTRO: 'ADMINISTRACAO',
        FUNCIONARIO: 'ADMINISTRACAO',
        ABASTECIMENTO: 'NUTRICAO', ESTORNO: 'OPERACIONAL',
        MOVIMENTACAO_PASTO: 'OPERACIONAL', JUNCAO_LOTES: 'OPERACIONAL',
        ANIMAL: 'GADO_CORTE', ANIMAL_LOTE: 'GADO_CORTE'
    };

    function generateId() { return 'E' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6); }

    function normalizeValueField(ev) {
        if (!ev) return false;
        if (ev.valor !== undefined && ev.value === undefined) { ev.value = ev.valor; return true; }
        if (ev.cost !== undefined && ev.value === undefined) { ev.value = ev.cost; return true; }
        if (ev.custo !== undefined && ev.value === undefined) { ev.value = ev.custo; return true; }
        return false;
    }

    function resolveCenterCost(ev) {
        if (!ev.type) return null;
        var resolver = CENTER_COSTS[ev.type];
        if (typeof resolver === 'function') return resolver(ev);
        if (typeof resolver === 'string') return resolver;
        return null;
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
            saveCount++;
            if (saveCount % 50 === 0) { autoBackup(); createSnapshot(); }
        } catch (e) { console.error('Erro ao salvar dados:', e); }
    }

    function createSnapshot() {
        var snapshotData = {
            version: VERSION,
            createdAt: new Date().toISOString(),
            eventCount: events.length,
            lastEventTimestamp: events.length > 0 ? events[events.length - 1].timestamp : null,
            totals: getTotals(),
            contas: { pendentes: getContasPendentes().length, pagas: getContasPagas().length }
        };
        try {
            localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshotData));
            snapshot = snapshotData;
            if (window.AuditLog) window.AuditLog.logSnapshotCreation(snapshotData);
        } catch (e) { console.error('Erro ao salvar snapshot:', e); }
    }

    function restoreSnapshot() {
        try {
            var raw = localStorage.getItem(SNAPSHOT_KEY);
            if (!raw) return false;
            snapshot = JSON.parse(raw);
            if (snapshot.version !== VERSION) { snapshot = null; return false; }
            return true;
        } catch (e) { snapshot = null; return false; }
    }

    function autoBackup() {
        try {
            var backup = { version: VERSION, date: new Date().toISOString(), count: events.length, data: JSON.stringify(events) };
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
        } catch (e) { console.error('Erro no backup:', e); }
    }

    function removeDuplicates(eventList) {
        var seen = {};
        return eventList.filter(function(ev) {
            var key = ev.id || JSON.stringify({ t: ev.type, n: ev.nome, d: ev.date, v: ev.value });
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function migrateEvent(ev) {
        var changed = false;
        if (!ev.id) { ev.id = generateId(); changed = true; }
        if (!ev.timestamp) { ev.timestamp = ev.date ? new Date(ev.date).toISOString() : new Date().toISOString(); changed = true; }
        if (normalizeValueField(ev)) changed = true;
        if (!ev.linkedEventIds) { ev.linkedEventIds = []; changed = true; }
        if (!ev.centerCost && ev.type) { var cc = resolveCenterCost(ev); if (cc) { ev.centerCost = cc; changed = true; } }
        return changed;
    }

    return {
        init: function() { this.load(); this.migrate(); restoreSnapshot(); console.log('EventRepository: ' + events.length + ' eventos'); },

        load: function() {
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                events = raw ? JSON.parse(raw) : [];
                var before = events.length;
                events = removeDuplicates(events);
                if (events.length < before) { console.log('Removidos ' + (before - events.length) + ' duplicados'); this.save(); }
            } catch (e) { console.error('Erro ao carregar:', e); events = []; }
        },

        migrate: function() {
            var changed = false;
            events.forEach(function(ev) { if (migrateEvent(ev)) changed = true; });
            if (changed) this.save();
        },

        save: function() { saveToStorage(); },

        saveEvent: function(ev) {
            if (window.EventValidator) {
                var validation = window.EventValidator.validateEvent(ev);
                if (!validation.valid) { console.error('Evento inválido:', validation.errors); throw new Error('Evento inválido'); }
            }
            var isNew = !ev.id;
            if (!ev.id) ev.id = generateId();
            if (!ev.timestamp) ev.timestamp = new Date().toISOString();
            if (!ev.date) ev.date = new Date().toISOString().split('T')[0];
            if (!ev.linkedEventIds) ev.linkedEventIds = [];
            normalizeValueField(ev);
            if (!ev.centerCost && ev.type) { var cc = resolveCenterCost(ev); if (cc) ev.centerCost = cc; }
            events.push(ev);
            this.save();
            if (window.AuditLog) window.AuditLog.logEventCreation(ev.id, ev.type, ev);
            return ev;
        },

        getById: function(id) { for (var i = 0; i < events.length; i++) if (events[i].id === id) return events[i]; return null; },
        getByType: function(type) { return events.filter(function(ev) { return ev.type === type; }); },
        getByCenter: function(cc) { return events.filter(function(ev) { return ev.centerCost === cc; }); },
        getLinked: function(eventId) { var ev = this.getById(eventId); if (!ev || !ev.linkedEventIds) return []; return ev.linkedEventIds.map(function(lid) { return this.getById(lid); }.bind(this)).filter(Boolean); },

        getFinanceiro: function(filters) {
            filters = filters || {};
            var tipos = ['COMPRA', 'VENDA', 'ESTOQUE_ENTRADA', 'MANEJO', 'MANEJO_SANITARIO', 'CONTA_PAGAR', 'CONTA_RECEBER', 'OBRA_REGISTRO', 'ESTORNO'];
            return events.filter(function(ev) {
                if (ev.estornado) return false;
                if (tipos.indexOf(ev.type) < 0) return false;
                if (filters.type && ev.type !== filters.type) return false;
                if (filters.centerCost && ev.centerCost !== filters.centerCost) return false;
                return true;
            });
        },

        getTotals: function(dateFrom, dateTo) {
            if (!dateFrom && !dateTo && snapshot) return snapshot.totals;
            var result = { entradas: 0, saidas: 0, saldo: 0, porCentro: {}, porTipo: {} };
            var filtered = this.getFinanceiro({ dateFrom: dateFrom, dateTo: dateTo });
            filtered.forEach(function(ev) {
                var valor = ev.value || 0;
                var cc = ev.centerCost || 'OUTROS';
                if (!result.porCentro[cc]) result.porCentro[cc] = { entradas: 0, saidas: 0 };
                if (!result.porTipo[ev.type]) result.porTipo[ev.type] = { entradas: 0, saidas: 0 };
                if (ev.type === 'VENDA') { result.entradas += valor; result.porCentro[cc].entradas += valor; result.porTipo[ev.type].entradas += valor; }
                else if (valor > 0) { result.saidas += valor; result.porCentro[cc].saidas += valor; result.porTipo[ev.type].saidas += valor; }
            });
            result.saldo = result.entradas - result.saidas;
            return result;
        },

        getContasPendentes: function() { return events.filter(function(ev) { return ev.type === 'CONTA_PAGAR' && !ev.estornado && ev.status === 'pendente' && !ev.pago; }); },
        getContasPagas: function() { return events.filter(function(ev) { return ev.type === 'CONTA_PAGAR' && !ev.estornado && (ev.pago || ev.status === 'pago'); }); },
        restoreBackup: function() { try { var raw = localStorage.getItem(BACKUP_KEY); if (!raw) return false; var backup = JSON.parse(raw); events = JSON.parse(backup.data); this.save(); return true; } catch (e) { return false; } },
        resetAll: function() { autoBackup(); events = []; localStorage.removeItem(STORAGE_KEY); },
        getAllEvents: function() { return [...events]; },
        getEventCount: function() { return events.length; },
        getSnapshotStats: function() { return snapshot ? { eventCount: snapshot.eventCount, createdAt: snapshot.createdAt, isValid: true } : null; }
    };
})();