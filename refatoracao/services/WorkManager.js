// ====== WorkManager.js — Gerenciador de Tarefas em Background ======
window.WorkManager = (function() {
    'use strict';

    const STORAGE_KEY = 'agromacro_work_queue';
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1000;

    let queue = [];
    let isProcessing = false;
    let networkStatus = navigator.onLine;

    const TASK_TYPES = Object.freeze({ SYNC_EVENT: 'SYNC_EVENT', BACKUP: 'BACKUP', EXPORT: 'EXPORT', CALCULATE_INDICATORS: 'CALCULATE_INDICATORS' });
    const TASK_STATUS = Object.freeze({ PENDING: 'pending', PROCESSING: 'processing', COMPLETED: 'completed', FAILED: 'failed', RETRY: 'retry' });

    function generateTaskId() { return 'T' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4); }
    function calculateBackoff(retryCount) { return BASE_DELAY * Math.pow(2, retryCount); }
    function saveQueue() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); } catch (e) { console.error('Erro:', e); } }
    function loadQueue() { try { var raw = localStorage.getItem(STORAGE_KEY); queue = raw ? JSON.parse(raw) : []; } catch (e) { queue = []; } }

    function processTask(task) {
        return new Promise(function(resolve) {
            task.status = TASK_STATUS.PROCESSING;
            task.startedAt = new Date().toISOString();
            saveQueue();
            setTimeout(function() {
                task.attempts++;
                if (task.attempts < MAX_RETRIES) {
                    task.status = TASK_STATUS.RETRY;
                    task.nextRetry = Date.now() + calculateBackoff(task.attempts);
                } else {
                    task.status = TASK_STATUS.FAILED;
                    task.completedAt = new Date().toISOString();
                }
                saveQueue();
                resolve();
            }, 100);
        });
    }

    function processQueue() {
        if (isProcessing) return;
        isProcessing = true;
        var now = Date.now();
        var task = queue.find(function(t) { return t.status === TASK_STATUS.PENDING || (t.status === TASK_STATUS.RETRY && t.nextRetry <= now); });
        if (task) { processTask(task).then(function() { isProcessing = false; processQueue(); }); }
        else { isProcessing = false; }
    }

    function setupNetworkListeners() {
        window.addEventListener('online', function() { networkStatus = true; console.log('Online - processando fila'); processQueue(); });
        window.addEventListener('offline', function() { networkStatus = false; console.log('Offline'); });
    }

    return {
        init: function() { loadQueue(); setupNetworkListeners(); processQueue(); console.log('WorkManager: ' + queue.length + ' tarefas'); },
        enqueue: function(type, payload) {
            var task = { id: generateTaskId(), type: type, payload: payload, status: TASK_STATUS.PENDING, attempts: 0, createdAt: new Date().toISOString() };
            queue.push(task);
            saveQueue();
            if (networkStatus) processQueue();
            return task.id;
        },
        getStatus: function(taskId) { return queue.find(function(t) { return t.id === taskId; }) || null; },
        cancelTask: function(taskId) { var idx = queue.findIndex(function(t) { return t.id === taskId; }); if (idx >= 0) { queue.splice(idx, 1); saveQueue(); return true; } return false; },
        getQueueStats: function() { return { total: queue.length, pending: queue.filter(function(t) { return t.status === TASK_STATUS.PENDING; }).length }; },
        isOnline: function() { return networkStatus; },
        TASK_TYPES: TASK_TYPES,
        TASK_STATUS: TASK_STATUS
    };
})();