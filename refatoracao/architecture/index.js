// ====== architecture/index.js — API Unificada ======
window.Arch = (function() {
    'use strict';

    return {
        EventTypes: window.EventTypes,
        EventValidator: window.EventValidator,
        AuditLog: window.AuditLog,
        ConflictResolver: window.ConflictResolver,
        AuthorEntity: window.AuthorEntity,
        NetworkAuthor: window.NetworkAuthor,
        UIModel: window.UIModel,
        Repository: window.EventRepository,
        WorkManager: window.WorkManager,
        SyncManager: window.SyncManager,
        SyncConfig: window.SyncConfig,

        Application: {
            saveEvent: function(eventData) { return window.EventRepository.saveEvent(eventData); },
            getEventsByType: function(type) { return window.EventRepository.getByType(type); },
            getFinancialSummary: function(filters) { return window.EventRepository.getTotals(filters && filters.dateFrom, filters && filters.dateTo); },
            createTask: function(type, payload) { return window.WorkManager.enqueue(type, payload); },
            getTaskStatus: function(taskId) { return window.WorkManager.getStatus(taskId); },
            isOnline: function() { return window.WorkManager.isOnline(); },
            validateEvent: function(eventData) { return window.EventValidator.validateEvent(eventData); }
        },

        info: { version: '1.0.0', name: 'AgroMacro Architecture', offlineFirst: true, layers: ['Domain', 'Models', 'Repository', 'Services', 'Application'], created: '2025-04-08' }
    };
})();

console.log('AgroMacro Architecture v' + window.Arch.info.version + ' loaded');