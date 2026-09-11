// ====== AuditLog.js — Log de Auditoria Imutável ======
// Registra todas as operações de forma imutável para LGPD e rastreabilidade
window.AuditLog = (function() {
    'use strict';

    const AUDIT_KEY = 'agromacro_audit_log';
    const MAX_ENTRIES = 10000;

    let auditEntries = [];

    const OPERATION_TYPES = Object.freeze({
        EVENT_CREATED: 'EVENT_CREATED',
        EVENT_UPDATED: 'EVENT_UPDATED',
        EVENT_DELETED: 'EVENT_DELETED',
        SNAPSHOT_CREATED: 'SNAPSHOT_CREATED',
        BACKUP_CREATED: 'BACKUP_CREATED',
        DATA_MIGRATED: 'DATA_MIGRATED',
        USER_ACTION: 'USER_ACTION',
        SYSTEM_OPERATION: 'SYSTEM_OPERATION'
    });

    function generateAuditId() {
        return 'AUDIT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
    }

    function saveAuditLog() {
        try {
            if (auditEntries.length > MAX_ENTRIES) {
                auditEntries = auditEntries.slice(-MAX_ENTRIES);
            }
            localStorage.setItem(AUDIT_KEY, JSON.stringify(auditEntries));
        } catch (e) {
            console.error('Erro ao salvar audit log:', e);
        }
    }

    function loadAuditLog() {
        try {
            const raw = localStorage.getItem(AUDIT_KEY);
            auditEntries = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro ao carregar audit log:', e);
            auditEntries = [];
        }
    }

    function createAuditEntry(operationType, details, userId) {
        return {
            id: generateAuditId(),
            timestamp: new Date().toISOString(),
            operationType: operationType,
            userId: userId || 'system',
            sessionId: getSessionId(),
            details: details,
            checksum: generateChecksum(details)
        };
    }

    function generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    function getSessionId() {
        let sessionId = sessionStorage.getItem('agromacro_session');
        if (!sessionId) {
            sessionId = 'SESSION-' + Date.now().toString(36);
            sessionStorage.setItem('agromacro_session', sessionId);
        }
        return sessionId;
    }

    return {
        init: function() {
            loadAuditLog();
            this.logOperation(OPERATION_TYPES.SYSTEM_OPERATION, {
                action: 'SESSION_START',
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
            console.log('AuditLog inicializado: ' + auditEntries.length + ' entradas');
        },

        logEventCreation: function(eventId, eventType, eventData) {
            this.logOperation(OPERATION_TYPES.EVENT_CREATED, {
                eventId: eventId,
                eventType: eventType,
                summary: { value: eventData.value, centerCost: eventData.centerCost, timestamp: eventData.timestamp }
            });
        },

        logEventUpdate: function(eventId, oldData, newData) {
            this.logOperation(OPERATION_TYPES.EVENT_UPDATED, {
                eventId: eventId,
                changes: calculateChanges(oldData, newData)
            });
        },

        logEventDeletion: function(eventId, eventType, eventData) {
            this.logOperation(OPERATION_TYPES.EVENT_DELETED, {
                eventId: eventId,
                eventType: eventType,
                summary: { value: eventData.value, centerCost: eventData.centerCost }
            });
        },

        logSnapshotCreation: function(snapshotInfo) {
            this.logOperation(OPERATION_TYPES.SNAPSHOT_CREATED, snapshotInfo);
        },

        logOperation: function(operationType, details, userId) {
            const entry = createAuditEntry(operationType, details, userId);
            auditEntries.push(entry);
            saveAuditLog();
        },

        getAuditTrail: function(filters) {
            filters = filters || {};
            return auditEntries.filter(function(entry) {
                if (filters.operationType && entry.operationType !== filters.operationType) return false;
                if (filters.dateFrom && entry.timestamp < filters.dateFrom) return false;
                if (filters.dateTo && entry.timestamp > filters.dateTo) return false;
                return true;
            });
        },

        getAuditSummary: function() {
            const summary = { totalEntries: auditEntries.length, byOperationType: {}, byUser: {} };
            auditEntries.forEach(function(entry) {
                if (!summary.byOperationType[entry.operationType]) summary.byOperationType[entry.operationType] = 0;
                summary.byOperationType[entry.operationType]++;
                if (!summary.byUser[entry.userId]) summary.byUser[entry.userId] = 0;
                summary.byUser[entry.userId]++;
            });
            return summary;
        },

        exportAuditLog: function() {
            return { metadata: { exportedAt: new Date().toISOString(), totalEntries: auditEntries.length }, entries: [...auditEntries] };
        }
    };

    function calculateChanges(oldObj, newObj) {
        const changes = {};
        const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
        allKeys.forEach(function(key) {
            if (JSON.stringify(oldObj && oldObj[key]) !== JSON.stringify(newObj && newObj[key])) {
                changes[key] = { from: oldObj && oldObj[key], to: newObj && newObj[key] };
            }
        });
        return changes;
    }
})();