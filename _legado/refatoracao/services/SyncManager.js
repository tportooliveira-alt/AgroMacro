// ====== SyncManager.js — Gerenciador de Sincronização Automática ======
window.SyncManager = (function() {
    'use strict';

    const SYNC_CONFIG_KEY = 'agromacro_sync_config';
    const SYNC_STATUS_KEY = 'agromacro_sync_status';

    let isOnline = navigator.onLine;
    let syncConfig = null;
    let syncStatus = null;
    let isSyncing = false;

    const DEFAULT_CONFIG = { enabled: false, endpoint: '', apiKey: '', syncInterval: 300000, autoSync: true, shareOnOnline: true, batchSize: 50 };
    const SYNC_STATUS = Object.freeze({ IDLE: 'idle', SYNCING: 'syncing', SUCCESS: 'success', ERROR: 'error', OFFLINE: 'offline' });

    function loadConfig() {
        try { var raw = localStorage.getItem(SYNC_CONFIG_KEY); syncConfig = raw ? Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw)) : Object.assign({}, DEFAULT_CONFIG); }
        catch (e) { syncConfig = Object.assign({}, DEFAULT_CONFIG); }
    }

    function saveConfig() { try { localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig)); } catch (e) {} }

    function loadSyncStatus() {
        try { var raw = localStorage.getItem(SYNC_STATUS_KEY); syncStatus = raw ? JSON.parse(raw) : { status: SYNC_STATUS.IDLE, lastSync: null, eventsSynced: 0 }; }
        catch (e) { syncStatus = { status: SYNC_STATUS.IDLE, lastSync: null, eventsSynced: 0 }; }
    }

    function saveSyncStatus() { try { localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus)); } catch (e) {} }

    function updateStatus(status, error) {
        syncStatus.status = status;
        if (error) syncStatus.lastError = { message: error.message, timestamp: new Date().toISOString() };
        if (status === SYNC_STATUS.SUCCESS) syncStatus.lastSync = new Date().toISOString();
        saveSyncStatus();
    }

    function performSync() {
        if (!syncConfig.enabled || !syncConfig.endpoint || isSyncing) return Promise.resolve();
        isSyncing = true;
        updateStatus(SYNC_STATUS.SYNCING);

        var eventsToSync = window.EventRepository ? window.EventRepository.getAllEvents() : [];

        return fetch(syncConfig.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + syncConfig.apiKey },
            body: JSON.stringify({ events: eventsToSync, metadata: { deviceId: getDeviceId(), timestamp: new Date().toISOString() } })
        }).then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            syncStatus.eventsSynced += eventsToSync.length;
            updateStatus(SYNC_STATUS.SUCCESS);
            if (window.AuditLog) window.AuditLog.logOperation('SYNC_COMPLETED', { events: eventsToSync.length });
        }).catch(function(error) {
            updateStatus(SYNC_STATUS.ERROR, error);
        }).finally(function() { isSyncing = false; });
    }

    function getDeviceId() {
        var deviceId = localStorage.getItem('agromacro_device_id');
        if (!deviceId) { deviceId = 'device-' + Date.now().toString(36); localStorage.setItem('agromacro_device_id', deviceId); }
        return deviceId;
    }

    function handleOnline() { isOnline = true; console.log('Online - sincronizando'); if (syncConfig.shareOnOnline) setTimeout(performSync, 2000); }
    function handleOffline() { isOnline = false; updateStatus(SYNC_STATUS.OFFLINE); }

    function startAutoSync() {
        if (syncConfig.autoSync && syncConfig.syncInterval > 0) {
            setInterval(function() { if (isOnline && !isSyncing) performSync(); }, syncConfig.syncInterval);
        }
    }

    return {
        init: function() {
            loadConfig(); loadSyncStatus();
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            startAutoSync();
            console.log('SyncManager inicializado:', syncConfig.enabled ? 'habilitado' : 'desabilitado');
        },
        configure: function(config) { syncConfig = Object.assign(syncConfig, config); saveConfig(); if (config.enabled && isOnline) performSync(); return syncConfig; },
        getConfig: function() { return Object.assign({}, syncConfig); },
        getStatus: function() { return Object.assign({}, syncStatus); },
        syncNow: function() { if (!isOnline) throw new Error('Offline'); return performSync(); },
        enableAutoSync: function(enabled) { syncConfig.autoSync = enabled; syncConfig.shareOnOnline = enabled; saveConfig(); return syncConfig; },
        isOnline: function() { return isOnline; },
        isEnabled: function() { return syncConfig.enabled; },
        _testConnection: function() {
            return fetch(syncConfig.endpoint + '/ping', { method: 'GET', headers: { 'Authorization': 'Bearer ' + syncConfig.apiKey } }).then(function(r) { return r.ok; }).catch(function() { return false; });
        }
    };
})();