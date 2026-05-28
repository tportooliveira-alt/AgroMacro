# Nova Arquitetura Unificada — AgroMacro + FarmManager

## 1. Visão Geral
- Objetivo: fundir a cobertura funcional rica do AgroMacro (rebanho completo, finanças, indicadores, IA, eventos) com a organização modular e offline-first do FarmManager (módulos isolados, IndexedDB, UX intuitiva) em um app offline-first coerente.
- Resultado esperado: uma estrutura única `src/` com componentes/UI separados, um entrypoint claro em `index.html` + `styles.css`, e uma camada de dados híbrida (`localStorage`, `IndexedDB` e adaptações futuras de sync/Firebase).

## 2. Matriz de Funcionalidades Prioritárias

| Domínio | AgroMacro (atual) | FarmManager (modelo) | Integração proposta |
|---------|-------------------|---------------------|---------------------|
| Navegação | SPA com tabs home/rebanho/financeiro/operações/config | Home com cards e telas dedicadas (manejo, estoque, compra/venda, caixa, config) | Home grid com cards navegando para telas internas; usar back button e header como nos dois |
| Manejo | Cabecas, rebanho, lotes, pastos, manejo sanitário, nutricionais, calendário | Manejo por lote com aplicação de itens, históricos, bloqueios | Migrar módulos de manejo para `src/features/manejo`, mantendo controles de históricos e alertas |
| Financeiro | Compras, vendas, fluxo, balanço, contas, indicadores financeiros, IA/analista | Módulo financeiro completo (compras automatizadas, vendas com margem, dashboard caixa) | Refatorar `js/financeiro.js` com processos de FarmManager (calculos automáticos) e adicionar indicadores do AgroMacro |
| Estoque / Operações | Estoque, obras, funcionários, formulador, IA, etc. | Controle de estoque com alertas e imagens, módulos de sincronização | Estruturar `src/features/estoque` e `src/features/operacoes`, reutilizando `balanca`, `obras`, `funcionarios` do AgroMacro e sensores de FarmManager |
| Dados | Event-sourcing em `localStorage`, modules de IA e sync (Firebase) | IndexedDB com 7 stores, estrutura de repositorio/firbase | Criar adaptador `src/data/localstorage` e `src/data/indexeddb`, podendo trocar por `SyncManager` futuro |
| IA / Insights | IA Auditoria, IA Consultor, nutrição, formuladores, indicadores visuais | Dashboards simples com calculos | Preservar IA em `src/features/insights`, mas desacoplar da UI principal |

## 3. Arquitetura Proposta

- `index.html`: única shell com container `#app`, header e cards de navegação (home + telas internas). Inspire-se nas telas do FarmManager e nos padrões do app.js do AgroMacro (navegação via `data-target` e `back-btn`).
- `styles.css`: design system unificado com tokens `:root`, temas (light/brutalismo), e componentes utilitários; remover dependências extras (brutalismo-premium.css).
- `src/`
  - `core/` — serviços compartilhados (navegação, event bus, actions, helpers).
  - `features/`
    * `manejo/` — módulos de manejo (cabecas, lotes, pastos, manejo sanitário, calendário).
    * `financeiro/` — compras, vendas, fluxo, balanço, indicadores e dashboards.
    * `estoque/` — almoxarifado, alertas, obras, funcionários.
    * `insights/` — IA consultor, dashboards, indicadores e aprendizado (IA Auditoria, Nutrição IA).
    * `operacoes/` — formulários, sync managers, QR code (leitor-cocho, qrcode module).
  - `data/`
    * `localstorage.js` — exports de event sourcing atual.
    * `indexeddb.js` — adaptador com stores (almoxarifado, lotes, historico, parceiros, compras, vendas, animais) baseado em `farm-manager/src/js/data/`.
    * `sync/` — placeholder para futuro SyncManager/Firebase.
  - `ui/` — componentes visuais reutilizáveis (cards, badges, modais).

## 4. Fluxo Inicial de Navegação

1. `index.html` abre em `home`: cards para `manejo`, `estoque`, `compra-venda`, `caixa`, `config`.
2. Cada card carrega view com header e conteúdo via `js/app.js` (semelhante ao FarmManager).
3. `features/*` exportam `render(targetEl)` e `init(context)` para registrar callbacks (mantém `window.funcionarios` e `window.iaConsultor`).
4. `core/actions-bus` coordena fluxos (navegação, sync, analytics).

## 5. Próximos Passos Imediatos

1. **Criar base visual**: atualizar `index.html` e `styles.css` para o novo layout de cards + navegação (usar backlog do FarmManager para estrutura).
2. **Mover código existente**: 
   - Importar `src/js/modules/financeiro.js` e `estoque.js` como referência para `src/features`.
   - Preservar `js/ia-consultor.js`, `context-builder.js`, `learning-store.js` dentro de `src/features/insights`.
3. **Montar camadas de dados**: copiar/adaptar `farm-manager/src/js/data/repository.js` e `firebase.js` para `src/data/indexeddb.js` e `src/data/localstorage.js`.
4. **Documentar**: criar README/guia de navegação novo e anotar dependências (ex: `localStorage`, `IndexedDB`, `IA`).

## 6. Documentação Viva

- Registrar decisões e fluxos no novo arquivo `REORGANIZACAO-ROADMAP.md` (ex.: lista de módulos/mapeamentos).  
- Usar `FIGMA-README` e `figma-project-spec.json` atuais como referência de telas futuras.

> Quer que eu continue com a primeira etapa, começando pelo novo `index.html` + `styles.css` esqueleto descrito acima?
