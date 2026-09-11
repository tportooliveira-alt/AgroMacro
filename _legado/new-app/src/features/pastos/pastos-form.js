import { actionsBus } from '../../core/actions-bus/index.js';
import { createEvent, EventTypes } from '../../core/event-factory.js';
import { LocalStorageStore } from '../../data/localstorage/store.js';
import { indexedDBAdapter } from '../../data/indexeddb/index.js';

const localStore = new LocalStorageStore('new-app-pastos');

function saveToIndexedDB(pastoRecord) {
    return indexedDBAdapter.upsert('lotes', pastoRecord);
}

function renderFields(container) {
    container.innerHTML = `
        <form id="pasto-form" class="pasto-form">
            <div class="pasto-form-row">
                <label>Nome do pasto</label>
                <input type="text" id="pasto-nome" placeholder="Ex: Talhão 01" required/>
            </div>
            <div class="pasto-form-row">
                <label>Área em hectares</label>
                <input type="number" id="pasto-area" min="0" step="0.1" placeholder="0.0" required/>
            </div>
            <div class="pasto-form-row">
                <label>Categoria</label>
                <select id="pasto-categoria">
                    <option value="engorda">Engorda</option>
                    <option value="recria">Recria</option>
                    <option value="produzao">Produção</option>
                    <option value="descanso">Descanso</option>
                </select>
            </div>
            <div class="pasto-form-row">
                <label>Situação</label>
                <select id="pasto-situacao">
                    <option value="livre">Livre</option>
                    <option value="em-uso">Em uso</option>
                    <option value="em-rotacao">Em rotação</option>
                    <option value="bloqueado">Bloqueado (carência)</option>
                </select>
            </div>
            <div class="pasto-form-row">
                <label>Observações</label>
                <textarea id="pasto-obs" rows="2" placeholder="Solo, potencial, notas"></textarea>
            </div>
            <button type="submit" class="pasto-form-submit">Salvar cadastro</button>
        </form>
        <div id="pasto-feedback" class="pasto-feedback"></div>
    `;
}

export async function initPastosFeature(container) {
    renderFields(container);
    const form = document.getElementById('pasto-form');
    const feedback = document.getElementById('pasto-feedback');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const pasto = {
            id: `pasto_${Date.now()}`,
            nome: form['pasto-nome'].value.trim(),
            area: Number(form['pasto-area'].value) || 0,
            categoria: form['pasto-categoria'].value,
            situacao: form['pasto-situacao'].value,
            observacoes: form['pasto-obs'].value.trim(),
            criadoEm: new Date().toISOString()
        };
        try {
            localStore.add(pasto);
            await saveToIndexedDB(pasto);
            const event = createEvent(EventTypes.MANEJO, {
                lote_id: pasto.id,
                quantidade: pasto.area,
                valor: 0,
                origem: 'pasto-cadastro'
            });
            actionsBus.emit('pasto:salvo', { pasto, event });
            feedback.textContent = 'Cadastro salvo. Histórico atualizado.';
            form.reset();
        } catch (error) {
            console.error(error);
            feedback.textContent = 'Erro ao salvar. Veja o console.';
        }
    });
}
