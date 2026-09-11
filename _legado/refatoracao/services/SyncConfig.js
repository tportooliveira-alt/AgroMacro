// ====== SyncConfig.js — Interface de Configuração de Sincronização ======
window.SyncConfig = (function() {
    'use strict';

    function showConfigDialog() {
        if (!window.SyncManager) { alert('SyncManager não disponível'); return; }

        var config = window.SyncManager.getConfig();
        var status = window.SyncManager.getStatus();

        var html = '<div id="sync-config-dialog" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;">' +
            '<div style="background:white;padding:20px;border-radius:8px;max-width:400px;width:90%;">' +
            '<h3 style="margin:0 0 15px;">Compartilhamento Automático</h3>' +
            '<div style="margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:4px;">' +
            '<div>Status: <strong>' + getStatusText(status.status) + '</strong></div>' +
            (status.lastSync ? '<div style="font-size:12px;color:#666;">Última: ' + new Date(status.lastSync).toLocaleString() + '</div>' : '') +
            '</div>' +
            '<label style="display:block;margin:10px 0;"><input type="checkbox" id="sync-enabled" ' + (config.enabled ? 'checked' : '') + '> Habilitar sincronização</label>' +
            '<label style="display:block;margin:10px 0;"><input type="checkbox" id="sync-auto" ' + (config.autoSync ? 'checked' : '') + '> Sincronização automática</label>' +
            '<label style="display:block;margin:10px 0;"><input type="checkbox" id="sync-online" ' + (config.shareOnOnline ? 'checked' : '') + '> Compartilhar ao conectar</label>' +
            '<div style="margin:10px 0;"><label style="display:block;font-size:12px;">Endpoint:</label><input type="url" id="sync-endpoint" value="' + config.endpoint + '" style="width:100%;padding:8px;"></div>' +
            '<div style="margin:10px 0;"><label style="display:block;font-size:12px;">Chave API:</label><input type="password" id="sync-api-key" value="' + config.apiKey + '" style="width:100%;padding:8px;"></div>' +
            '<div style="margin:10px 0;"><label style="display:block;font-size:12px;">Intervalo (min):</label><input type="number" id="sync-interval" value="' + (config.syncInterval / 60000) + '" min="1" style="width:100%;padding:8px;"></div>' +
            '<div style="display:flex;gap:10px;margin-top:15px;">' +
            '<button onclick="SyncConfig.saveConfig()" style="flex:1;padding:10px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;">Salvar</button>' +
            '<button onclick="SyncConfig.hideDialog()" style="flex:1;padding:10px;background:#6b7280;color:white;border:none;border-radius:4px;cursor:pointer;">Cancelar</button>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function hideDialog() {
        var dialog = document.getElementById('sync-config-dialog');
        if (dialog) dialog.remove();
    }

    function saveConfig() {
        var newConfig = {
            enabled: document.getElementById('sync-enabled').checked,
            autoSync: document.getElementById('sync-auto').checked,
            shareOnOnline: document.getElementById('sync-online').checked,
            endpoint: document.getElementById('sync-endpoint').value.trim(),
            apiKey: document.getElementById('sync-api-key').value.trim(),
            syncInterval: parseInt(document.getElementById('sync-interval').value) * 60000
        };
        window.SyncManager.configure(newConfig);
        alert('Configuração salva!');
        hideDialog();
        if (window.AuditLog) window.AuditLog.logOperation('SYNC_CONFIG_UPDATED', { enabled: newConfig.enabled });
    }

    function getStatusText(status) {
        switch (status) { case 'success': return 'Sucesso'; case 'error': return 'Erro'; case 'syncing': return 'Sincronizando'; case 'offline': return 'Offline'; default: return 'Ocioso'; }
    }

    return { showConfigDialog: showConfigDialog, hideDialog: hideDialog, saveConfig: saveConfig };
})();