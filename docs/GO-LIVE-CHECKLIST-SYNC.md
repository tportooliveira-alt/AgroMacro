# Go-Live Checklist - Sync, Multi-Tenant e Offline

Data: 13/04/2026
Escopo: Sprint 2 (P0.1, P0.3, P0.4)

## 1) Infra e seguranca

- [ ] Confirmar que `.env.local` existe apenas no ambiente local
- [ ] Confirmar que nao existem chaves reais em arquivos versionados
- [ ] Validar `firestore.rules` publicado no projeto correto
- [ ] Validar isolamento por fazenda (`fazendas/{fazendaId}/events/{eventId}`)
- [ ] Confirmar usuarios sem permissao nao acessam fazenda alheia

## 2) Inicializacao e configuracao

- [ ] `config-loader.js` carregado antes de `firebase-sync.js`
- [ ] `window.agromacroConfig` inicializado no boot
- [ ] IA recebe chaves via `iaConsultor.init(iaConfig)`
- [ ] fallback local funciona quando credenciais IA estao vazias

## 3) Sincronizacao

- [ ] Upload em lotes ativo (batchSize <= 500)
- [ ] Guard de concorrencia ativo (`_isSyncing`)
- [ ] Todos eventos enviados com `fazendaId`
- [ ] Eventos com `_syncUpdatedAt`, `_syncDeviceId`, `_syncUserPerfil`
- [ ] Merge deterministico ativo (timestamp -> role -> deviceId)
- [ ] Merge log gravando em `agromacro_sync_merge_log`

## 4) Fluxos criticos de negocio

- [ ] Compra -> Conta pagar -> Lote linked sem duplicidade
- [ ] Venda -> Conta receber linked sem duplicidade
- [ ] Manejo nutricao gera `centerCost=NUTRICAO`
- [ ] Manejo sanitario gera `centerCost=SANIDADE`
- [ ] Obra gera `centerCost=INFRAESTRUTURA`
- [ ] Saida de estoque herdando categoria/centerCost em manejo e obras

## 5) Offline-first

- [ ] Operar offline por >= 10 min com novos eventos
- [ ] Reconeccao sincroniza backlog sem erro
- [ ] Sem perda de dados apos reload
- [ ] Sem regressao visual apos sync (telas renderizam)

## 6) Observabilidade minima

- [ ] Console sem erros fatais em boot
- [ ] Erros de rede de APIs externas nao quebram fluxo principal
- [ ] Alertas de sync exibidos para usuario

## 7) Gate de aprovacao

Liberar go-live somente se:
- Todos os itens das secoes 1-3 estiverem OK
- Pelo menos 1 rodada de teste manual com 2 contas (documentada)
- Dono/admin aprovarem reconciliacao financeira do ciclo compra->venda

## 8) Resultado atual (13/04)

- Validado tecnicamente em ambiente controlado: PASS
- G1 concluido: firestore.rules publicado no projeto `fazenda-antares`
- G4 concluido: console limpo em boot nas telas principais (home/lotes/estoque/financeiro)
- G5 concluido: protecao de `.env.local` e logs de debug no `.gitignore`
- G6 concluido: ambiente 8090 atualizado e sincronizado

### O que falta ser feito

- G2: executar teste manual com 2 contas autenticadas e registrar evidencias
- G3: validar reconciliacao financeira completa (compra -> manejo -> venda) por dono/admin
- Firebase Auth: adicionar dominios autorizados em Authentication > Settings:
	- `localhost`
	- `127.0.0.1`
