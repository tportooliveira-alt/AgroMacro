import { registerView, navigateTo } from './core/navigation.js';
import { initPastosFeature } from './features/pastos/pastos-form.js';
import { initPastoDashboard } from './features/pastos/dashboard.js';
import { initManejo } from './features/manejo/manejo-module.js';
import { initEstoque } from './features/estoque/estoque-module.js';
import { initFinanceiro } from './features/financeiro/financeiro-module.js';
import { actionsBus } from './core/actions-bus/index.js';

registerView('pastos', initPastosFeature);
registerView('manejo', () => {
    const container = document.getElementById('feature-container');
    initManejo(container);
});
registerView('estoque', () => {
    const container = document.getElementById('feature-container');
    initEstoque(container);
});
registerView('financeiro', () => {
    const container = document.getElementById('feature-container');
    initFinanceiro(container);
});
registerView('mapa', () => {
    const container = document.getElementById('feature-container');
    container.innerHTML = '<p>Mapa interativo será carregado aqui.</p>';
});

const cards = document.querySelectorAll('.home-card');
const container = document.getElementById('feature-container');
const dashboardRoot = document.getElementById('pasto-dashboard');

if (dashboardRoot) {
    initPastoDashboard(dashboardRoot);
}

cards.forEach(card => {
    card.addEventListener('click', () => {
        const view = card.dataset.view;
        navigateTo(view, container);
    });
});

actionsBus.on('pasto:salvo', ({ pasto }) => {
    console.info('Novo pasto salvo:', pasto.nome);
});

navigateTo('pastos', container);
