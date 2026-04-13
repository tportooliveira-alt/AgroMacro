# Nova base "Pastos em movimento"

## Contexto
- A estrutura une o layout moderno do AgroMacro com o motor de eventos e IndexedDB do FarmManager.  
- O `index.html` expõe cards e o painel de conteúdo; os módulos de cadastro ficam dentro de `src/features`, e a camada de dados é híbrida (`src/data/localstorage` + `src/data/indexeddb`).  
- O núcleo aponta para um bus de ações (`src/core/actions-bus`), fábrica de eventos (`src/core/event-factory`) e roteamento simples (`src/core/navigation`).

## O que já existe
1. Layout base (`new-app/index.html`) e estilo (`new-app/styles.css`).  
2. Formulário de cadastro de pastos (`src/features/pastos/pastos-form.js`) que grava no `LocalStorageStore`, atualiza IndexedDB e dispara evento `pasto:salvo`.  
3. Adaptadores de dados (localStorage e IndexedDB) prontos para receber eventos.  
4. Setup inicial (`src/main.js`) com registro de views, navegação por cards e log de eventos.

## Passos seguintes
1. Implementar os outros módulos (`manejo`, `estoque`, `financeiro`) dentro de `src/features` e conectar ao `actionsBus` (feito, veja `src/features/{manejo,estoque,financeiro}`).  
2. Expandir `index.html`/`styles.css` com o painel “Pastos em movimento” e descrições dinâmicas ( painel agora renderiza status/alertas via `src/features/pastos/dashboard.js`).  
3. Substituir o form de cadastro de pastos por um componente reutilizável (cards + listagem) e alimentar o histórico/ações a partir dos eventos criados.  
4. Certificar que cada evento (pasto salvo, manejo registrado, financeiro registrado) alimenta o painel/resumo e está persistido no localStorage + IndexedDB.

## Plano de testes
- Validar que o formulário de pastos salva no localStorage e torna o item disponível via IndexedDB (abra devtools > Application).  
- Confirmar que `actionsBus` dispara `pasto:salvo` ao enviar o formulário.  
- Verificar na nova página (`new-app/index.html`) que os cards realmente disparam `navigateTo`.

## Próximo prompt sugerido
> “Baseado nesse scaffold, implemente o módulo financeiro em `src/features/financeiro`, garanta que compras e vendas atualizem histórico/estoque/caixa (localStorage + IndexedDB) usando `actionsBus`, e documente os testes (inputs inválidos, saldo, histórico) antes de seguir para IA/insights.”
