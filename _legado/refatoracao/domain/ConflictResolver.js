// ====== ConflictResolver.js — Resolução Automática de Conflitos ======
window.ConflictResolver = (function() {
    'use strict';

    const STRATEGIES = Object.freeze({ LAST_WRITE_WINS: 'LAST_WRITE_WINS', MERGE: 'MERGE', USER_CHOICE: 'USER_CHOICE' });
    const RESOLUTION_RESULTS = Object.freeze({ LOCAL_WINS: 'LOCAL_WINS', REMOTE_WINS: 'REMOTE_WINS', MERGED: 'MERGED', CONFLICT_UNRESOLVED: 'CONFLICT_UNRESOLVED' });

    function resolveConflict(localEvent, remoteEvent, strategy) {
        strategy = strategy || STRATEGIES.LAST_WRITE_WINS;

        const conflict = {
            eventId: localEvent.id,
            type: localEvent.type,
            local: localEvent,
            remote: remoteEvent,
            strategy: strategy,
            resolved: false,
            result: null,
            timestamp: new Date().toISOString()
        };

        switch (strategy) {
            case STRATEGIES.LAST_WRITE_WINS:
                conflict.result = resolveLastWriteWins(localEvent, remoteEvent);
                break;
            case STRATEGIES.MERGE:
                conflict.result = resolveMerge(localEvent, remoteEvent);
                break;
            default:
                conflict.result = { result: RESOLUTION_RESULTS.CONFLICT_UNRESOLVED };
        }

        conflict.resolved = conflict.result.result !== RESOLUTION_RESULTS.CONFLICT_UNRESOLVED;
        return conflict;
    }

    function resolveLastWriteWins(localEvent, remoteEvent) {
        const localTime = new Date(localEvent.timestamp).getTime();
        const remoteTime = new Date(remoteEvent.timestamp).getTime();

        if (localTime > remoteTime) {
            return { result: RESOLUTION_RESULTS.LOCAL_WINS, winner: 'local', event: localEvent };
        } else if (remoteTime > localTime) {
            return { result: RESOLUTION_RESULTS.REMOTE_WINS, winner: 'remote', event: remoteEvent };
        }
        return { result: RESOLUTION_RESULTS.LOCAL_WINS, winner: 'local', event: localEvent };
    }

    function resolveMerge(localEvent, remoteEvent) {
        const merged = { ...localEvent };
        Object.keys(remoteEvent).forEach(function(key) {
            if (key !== 'id' && key !== 'timestamp' && !merged[key]) {
                merged[key] = remoteEvent[key];
            }
        });
        return { result: RESOLUTION_RESULTS.MERGED, winner: 'merged', event: merged };
    }

    return {
        resolveConflict: resolveConflict,
        resolveConflicts: function(localEvents, remoteEvents, strategy) {
            const localMap = new Map(localEvents.map(function(e) { return [e.id, e]; }));
            const remoteMap = new Map(remoteEvents.map(function(e) { return [e.id, e]; }));
            const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
            const resolved = [];

            allIds.forEach(function(eventId) {
                const localEvent = localMap.get(eventId);
                const remoteEvent = remoteMap.get(eventId);
                if (localEvent && remoteEvent) {
                    resolved.push(resolveConflict(localEvent, remoteEvent, strategy));
                } else if (localEvent) {
                    resolved.push({ eventId: eventId, result: { result: RESOLUTION_RESULTS.LOCAL_WINS, event: localEvent } });
                } else if (remoteEvent) {
                    resolved.push({ eventId: eventId, result: { result: RESOLUTION_RESULTS.REMOTE_WINS, event: remoteEvent } });
                }
            });

            return { resolved: resolved, finalEvents: resolved.map(function(r) { return r.result.event; }) };
        },
        STRATEGIES: STRATEGIES,
        RESOLUTION_RESULTS: RESOLUTION_RESULTS
    };
})();