import { LocalStorageStore } from '../../data/localstorage/store.js';

const estoqueStore = new LocalStorageStore('new-app-estoque');

function renderEstoqueView(container) {
    const items = estoqueStore.getAll();
    container.innerHTML = `
        <div class="pasto-form-row">
            <h3>Estoque atual</h3>
        </div>
        <ul class="estoque-list">
            ${items.length === 0 ? '<li class="empty">Ainda não há itens cadastrados.</li>' : ''}
            ${items.map(it => `
                <li>
                    <strong>${it.nome}</strong>
                    <span>${it.quantidade} ${it.unidade || 'unidades'}</span>
                    <small>${it.observacoes || ''}</small>
                </li>`).join('')}
        </ul>
        <button id="estoque-refresh" class="pasto-form-submit">Atualizar lista</button>
    `;
}

export function initEstoque(container) {
    renderEstoqueView(container);
    const button = document.getElementById('estoque-refresh');
    button?.addEventListener('click', () => renderEstoqueView(container));
}
