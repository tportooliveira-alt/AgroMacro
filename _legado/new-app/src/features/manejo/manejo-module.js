import { actionsBus } from '../../core/actions-bus/index.js';
import { createEvent, EventTypes } from '../../core/event-factory.js';
import { LocalStorageStore } from '../../data/localstorage/store.js';

const manejosStore = new LocalStorageStore('new-app-manejos');

function renderManejoForm(container) {
    container.innerHTML = `
        <form id="manejo-form" class="pasto-form">
            <div class="pasto-form-row">
                <label>Lote / Pasto</label>
                <input id="manejo-lote" type="text" placeholder="Talhão 01" required />
            </div>
            <div class="pasto-form-row">
                <label>Item aplicado</label>
                <input id="manejo-item" type="text" placeholder="Vacina / Defensivo" required />
            </div>
            <div class="pasto-form-row">
                <label>Quantidade</label>
                <input id="manejo-qtd" type="number" min="0" step="0.1" placeholder="0" required />
            </div>
            <div class="pasto-form-row">
                <label>Carência (dias)</label>
                <input id="manejo-carencia" type="number" min="0" step="1" value="0" />
            </div>
            <button type="submit" class="pasto-form-submit">Registrar manejo</button>
        </form>
        <div id="manejo-feedback" class="pasto-feedback"></div>
    `;
}

export function initManejo(container) {
    renderManejoForm(container);
    const form = document.getElementById('manejo-form');
    const feedback = document.getElementById('manejo-feedback');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const record = {
            id: `manejo_${Date.now()}`,
            lote: form['manejo-lote'].value.trim(),
            item: form['manejo-item'].value.trim(),
            quantidade: Number(form['manejo-qtd'].value) || 0,
            carencia: Number(form['manejo-carencia'].value) || 0,
            criadoEm: new Date().toISOString()
        };
        manejosStore.add(record);
        const eventLog = createEvent(EventTypes.SAIDA_ESTOQUE, {
            item_id: record.item,
            quantidade: record.quantidade,
            valor: 0,
            origem: 'manejo-form'
        });
        actionsBus.emit('manejo:registrado', { record, event: eventLog });
        feedback.textContent = 'Manejo registrado e estoque atualizado.';
        form.reset();
    });
}
