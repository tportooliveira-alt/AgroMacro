// ====== AuthorEntity.js — Modelo de Entidade Autoritativa ======
window.AuthorEntity = (function() {
    'use strict';

    function fromEvent(event) {
        return Object.freeze({
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            date: event.date,
            centerCost: event.centerCost,
            linkedEventIds: event.linkedEventIds ? [...event.linkedEventIds] : [],
            value: event.value,
            estornado: event.estornado || false,
            payload: { ...event }
        });
    }

    function validate(entity) {
        if (!entity.id || typeof entity.id !== 'string') return false;
        if (!entity.type || !window.EventTypes[entity.type]) return false;
        if (!entity.timestamp) return false;
        if (!entity.date) return false;
        return true;
    }

    return { fromEvent: fromEvent, validate: validate };
})();