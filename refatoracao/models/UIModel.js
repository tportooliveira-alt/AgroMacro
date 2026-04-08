// ====== UIModel.js — Modelo para Interface do Usuário ======
window.UIModel = (function() {
    'use strict';

    function formatCurrency(value) {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    function fromEntity(entity) {
        const base = {
            id: entity.id,
            type: entity.type,
            timestamp: entity.timestamp,
            date: entity.date,
            centerCost: entity.centerCost,
            value: entity.value,
            formattedValue: formatCurrency(entity.value),
            formattedDate: formatDate(entity.date),
            estornado: entity.estornado
        };

        switch (entity.type) {
            case EventTypes.COMPRA:
            case EventTypes.VENDA:
                return Object.assign(base, { qty: entity.payload.qty, weight: entity.payload.weight });
            case EventTypes.LOTE:
                return Object.assign(base, { nome: entity.payload.nome, categoria: entity.payload.categoria });
            case EventTypes.CONTA_PAGAR:
                return Object.assign(base, { descricao: entity.payload.descricao, status: entity.payload.status });
            default:
                return base;
        }
    }

    function listFromEntities(entities) {
        return entities.map(fromEntity);
    }

    return { fromEntity: fromEntity, listFromEntities: listFromEntities, formatCurrency: formatCurrency, formatDate: formatDate };
})();