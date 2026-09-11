import { LocalStorageStore } from '../../data/localstorage/store.js';
import { actionsBus } from '../../core/actions-bus/index.js';

const store = new LocalStorageStore('new-app-pastos');
const alertHistory = [];
const MAX_HISTORY = 3;

function buildStatusStats(pastos) {
    const stats = {
        total: pastos.length,
        bloqueados: pastos.filter(p => p.situacao === 'bloqueado').length,
        emRotacao: pastos.filter(p => p.situacao === 'em-rotacao').length,
        livres: pastos.filter(p => p.situacao === 'livre').length
    };
    return stats;
}

function render(root) {
    const pastos = store.getAll();
    const stats = buildStatusStats(pastos);
    root.innerHTML = `
        <div class="panel-header">
            <div>
                <p class="panel-title">Painel rápido de pastos</p>
                <p style="font-size:12px; color:#4f5b53;">Cadastros e alertas em tempo real</p>
            </div>
            <div class="panel-chip">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div class="panel-summary">
            <span class="panel-chip">Total: ${stats.total}</span>
            <span class="panel-chip">Livres: ${stats.livres}</span>
            <span class="panel-chip">Rotação: ${stats.emRotacao}</span>
            <span class="panel-chip">Bloqueados: ${stats.bloqueados}</span>
        </div>
        <div>
            <p style="margin:0 0 6px;font-weight:600;">Histórico recente</p>
            <ul class="panel-alerts">
                ${alertHistory.map(item => `<li>${item}</li>`).join('') || '<li class="empty">Nenhum alerta ainda.</li>'}
            </ul>
        </div>
        <div style="margin-top:12px;">
            <p style="margin:0 0 6px;font-weight:600;">Últimos cadastros</p>
            <ul class="panel-list">
                ${pastos.slice(-3).reverse().map(p => `<li>${p.nome} · ${p.situacao} · ${p.area} ha</li>`).join('') || '<li class="empty">Cadastre um pasto para iniciar.</li>'}
            </ul>
        </div>
    `;
}

function pushAlert(text) {
    alertHistory.unshift(text);
    if (alertHistory.length > MAX_HISTORY) {
        alertHistory.pop();
    }
}

export function initPastoDashboard(root) {
    if (!root) return;
    render(root);
    actionsBus.on('pasto:salvo', ({ pasto }) => {
        pushAlert(`Pasto salvo: ${pasto.nome}`);
        render(root);
    });
    actionsBus.on('manejo:registrado', ({ record }) => {
        pushAlert(`Manejo em ${record.lote} (${record.quantidade})`);
        render(root);
    });
    actionsBus.on('financeiro:registrado', ({ registro }) => {
        pushAlert(`Financeiro: ${registro.tipo} de R$ ${registro.valor.toFixed(2)}`);
        render(root);
    });
}
