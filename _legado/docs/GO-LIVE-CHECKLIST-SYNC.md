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

## 9) Plano de execucao (1 semana)

Objetivo da semana: fechar G2 e G3 com evidencias e assinar go-live operacional.

### D1 - Desbloqueio de autenticacao

- Escopo:
	- Adicionar dominios `localhost` e `127.0.0.1` em Firebase Authentication
	- Validar login Google em 2 sessoes independentes
- Responsavel:
	- Infra/Auth + Product Owner
- Criterio de aceite:
	- Duas contas autenticam com sucesso no mesmo build
	- Sem erro `auth/unauthorized-domain`

### D2 - Preparacao do teste G2

- Escopo:
	- Garantir ambas contas na mesma fazenda
	- Confirmar sincronizacao basica (evento simples A -> aparece em B)
- Responsavel:
	- Operacao + QA
- Criterio de aceite:
	- Evento criado em A aparece em B sem duplicidade
	- `sync-dot` em estado sincronizado nas duas sessoes

### D3 - Conflito offline controlado (G2 parte 1)

- Escopo:
	- Executar roteiro de conflito offline em duas contas
	- Editar mesmo contexto com valores diferentes
- Responsavel:
	- QA + Operacao
- Criterio de aceite:
	- Reconciliacao deterministica por timestamp/papel/deviceId
	- Sem perda de dados

### D4 - Reconciliacao final e evidencias (G2 parte 2)

- Escopo:
	- Repetir teste de conflito para reprodutibilidade
	- Coletar 4 evidencias do roteiro (offline A/B, reconexao A, reconexao B, merge log)
- Responsavel:
	- QA
- Criterio de aceite:
	- Resultado final identico nas duas contas
	- `agromacro_sync_merge_log` com decisao registrada

### D5 - Validacao financeira ponta a ponta (G3 parte 1)

- Escopo:
	- Rodar ciclo compra -> manejo -> venda
	- Verificar lancamentos linked e centers of cost
- Responsavel:
	- Dono/Admin + Financeiro
- Criterio de aceite:
	- Sem duplicidade de contas/eventos
	- DRE/fluxo coerentes com os eventos do ciclo

### D6 - Auditoria de consistencia (G3 parte 2)

- Escopo:
	- Revisar totais do financeiro apos estornos e reconciliares
	- Verificar dashboards e relatorios
- Responsavel:
	- Dono/Admin + QA
- Criterio de aceite:
	- Totais batendo entre fluxo, balanco e relatorio
	- Nenhuma divergencia de saldo por duplicidade

### D7 - Assinatura de go-live

- Escopo:
	- Revisao final dos gates
	- Registro formal de aprovacao operacional
- Responsavel:
	- Product Owner + Dono/Admin
- Criterio de aceite:
	- G2 e G3 marcados como concluidos
	- Checklist de secoes 1-3 em conformidade
