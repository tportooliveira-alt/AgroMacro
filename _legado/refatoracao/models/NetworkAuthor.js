// ====== NetworkAuthor.js — Modelo para Serialização de Rede ======
window.NetworkAuthor = (function() {
    'use strict';

    function fromEntity(entity) {
        return {
            id: entity.id,
            type: entity.type,
            timestamp: entity.timestamp,
            date: entity.date,
            centerCost: entity.centerCost,
            linkedEventIds: entity.linkedEventIds,
            value: entity.value,
            estornado: entity.estornado,
            payload: entity.payload
        };
    }

    function toEntity(networkModel) {
        return window.AuthorEntity.fromEvent(networkModel);
    }

    function serialize(entity) {
        return JSON.stringify(fromEntity(entity));
    }

    function deserialize(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return toEntity(data);
        } catch (e) {
            console.error('Erro ao desserializar NetworkAuthor:', e);
            return null;
        }
    }

    return { fromEntity: fromEntity, toEntity: toEntity, serialize: serialize, deserialize: deserialize };
})();