import { LocalStorageStore } from '../../data/localstorage/store.js';
import { createEvent, EventTypes } from '../../core/event-factory.js';
import { actionsBus } from '../../core/actions-bus/index.js';

const caixaStore = new LocalStorageStore('new-app-caixa');

function renderFinanceiroForm(container) {
    container.innerHTML = `
        <form id="financeiro-form" class="pasto-form">
            <div class="pasto-form-row">
                <label>Descrição</label>
                <input id="financeiro-descricao" type="text" required placeholder="Compra de insumo" />
            </div>
            <div class="pasto-form-row">
                <label>Valor (R$)</label>
                <input id="financeiro-valor" type="number" step="0.01" required placeholder="0,00" />
            </div>
            <div class="pasto-form-row">
                <label>Tipo</label>
                <select id="financeiro-tipo">
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                </select>
            </div>
            <button type="submit" class="pasto-form-submit">Registrar evento</button>
        </form>
        <div id="financeiro-feedback" class="pasto-feedback"></div>
    `;
}

export function initFinanceiro(container) {
    renderFinanceiroForm(container);
    const form = document.getElementById('financeiro-form');
    const feedback = document.getElementById('financeiro-feedback');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const descricao = form['financeiro-descricao'].value.trim();
        const valor = Number(form['financeiro-valor'].value) || 0;
        const tipo = form['financeiro-tipo'].value;
        const registro = {
            id: `financeiro_${Date.now()}`,
            descricao,
            valor,
            tipo,
            criadoEm: new Date().toISOString()
        };
        caixaStore.add(registro);
        const eventType = tipo === 'entrada' ? EventTypes.VENDA_ANIMAL : EventTypes.COMPRA_ANIMAL;
        const log = createEvent(eventType, {
            valor,
            quantidade: 0,
            origem: 'financeiro-form'
        });
        actionsBus.emit('financeiro:registrado', { registro, event: log });
        feedback.textContent = `Evento ${tipo} registrado.`;
        form.reset();
    });
}
