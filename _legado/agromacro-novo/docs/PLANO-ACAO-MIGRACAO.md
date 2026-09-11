# Plano de Acao - Migracao AgroMacro (Legado -> Novo)

Data: 2026-04-11
Projeto alvo: agromacro-novo
Objetivo: sair do estado "funcional porem superficial" para operacao de campo completa, confiavel e rastreavel.

## 1) Diagnostico Comparativo (Resumo)

### Ja existe no novo (base pronta)
- Autenticacao (com fallback local)
- Dashboard por cards
- Pastos por card, historico de acoes, rebanho no card
- Importacao de poligonos legados e calculo de area
- Cadastro basico de lotes e funcionarios
- Fluxo online-first com fila local minima

### Gap principal em relacao ao legado
- Regras operacionais incompletas entre modulos (lote <-> pasto <-> manejo <-> financeiro)
- Falta de rastreabilidade completa por entidade (timeline por lote, por pasto, por funcionario)
- Financeiro ainda sem profundidade de DRE/custos por centro
- Operacoes (estoque/obras/manejo) ainda sem encadeamento forte
- Ausencia de rotinas obrigatorias de validacao e testes E2E do fluxo de campo

## 2) Escopo Priorizado (MVP Operacional Real)

Prioridade P0 (critico para uso diario)
- Troca de pasto com regra de negocio completa
- Cadastro de lotes robusto
- Cadastro de funcionarios robusto
- Manejo e obra com responsavel, custo e impacto real
- Amarracao com financeiro minimo obrigatorio

Prioridade P1 (confiabilidade e controle)
- Timeline por lote e por pasto
- Alertas de inconsistencias (lote duplicado, pasto lotado, funcionario inativo em acao)
- Relatorios operacionais diarios/semanais

Prioridade P2 (escala e inteligencia)
- Rotacao planejada de pastos
- Indicadores zootecnicos e economicos avancados
- Automacoes e recomendacoes

## 3) Plano Passo a Passo

## Fase 0 - Congelamento de Escopo (1 dia)
1. Fechar lista final de telas obrigatorias de campo.
2. Definir dicionario de dados unico (lote, pasto, funcionario, acao, custo).
3. Definir criterios de aceite por fluxo (entrada -> processamento -> saida).

Entregavel:
- Checklist funcional validado.

## Fase 1 - Lotes e Troca de Pasto (2-3 dias)
1. Tornar lote entidade central de movimentacao.
2. Implementar troca de pasto com validacoes:
- lote ativo obrigatorio
- pasto destino obrigatorio
- bloqueio quando destino em obra (regra configuravel)
- registro automatico de origem/destino/data/responsavel
3. Atualizar estado de ambos os lados:
- lote.pastoAtual
- pasto.loteAtual/status
4. Registrar evento de movimentacao para auditoria.

Entregavel:
- Fluxo completo "Mover lote" funcionando ponta a ponta.

## Fase 2 - Funcionarios (2 dias)
1. Validacao forte no cadastro:
- CPF unico
- telefone padrao
- funcao obrigatoria
2. Ciclo de vida:
- ativo/inativo/reativado
- bloqueio de atribuicao em operacao quando inativo
3. Vincular funcionario em toda acao operacional (troca, manejo, obra).

Entregavel:
- Cadastro de equipe pronto para uso diario e auditoria.

## Fase 3 - Manejo e Obras com impacto real (3 dias)
1. Manejo:
- tipo, descricao padronizada, responsavel, data
- opcao de anexar lote(s) afetado(s)
2. Obra:
- local/pasto, descricao, responsavel, status, custo
- impacto no status do pasto (em_obra/disponivel)
3. Integracao minima com financeiro:
- toda obra/manejo com custo gera lancamento automatico opcional

Entregavel:
- Operacoes deixam de ser anotacao superficial e viram dado transacional.

## Fase 4 - Financeiro Operacional (3-4 dias)
1. Centros de custo minimos:
- manejo
- obras
- equipe
- insumos
2. Relatorios basicos:
- custo por lote
- custo por pasto
- custo diario por cabeca
3. DRE simplificado da operacao.

Entregavel:
- Fechamento minimo mensal confiavel.

## Fase 5 - Rastreabilidade e Relatorios (2 dias)
1. Timeline por lote (movimentacoes, manejo, custos).
2. Timeline por pasto (ocupacao, obra, manejo, rotacao).
3. Exportacao JSON/CSV para conferencia.

Entregavel:
- Historico completo para conferencia e tomada de decisao.

## Fase 6 - Qualidade e Implantacao (2 dias)
1. Testes de fluxo critico:
- cadastrar funcionario
- cadastrar lote
- mover lote entre pastos
- registrar manejo e obra
- conferir impacto no financeiro
2. Homologacao guiada com checklist de campo.
3. Ajustes finais e publicacao.

Entregavel:
- Versao pronta para rotina de fazenda.

## 4) Checklist de Nao Esquecer (Controle Diario)

### Fluxos criticos
- [ ] Cadastrar funcionario completo
- [ ] Inativar/reativar funcionario
- [ ] Cadastrar lote completo
- [ ] Alocar lote em pasto
- [ ] Trocar lote de pasto com historico
- [ ] Registrar manejo com responsavel
- [ ] Registrar obra com custo
- [ ] Gerar lancamento financeiro da operacao

### Qualidade de dados
- [ ] CPF duplicado bloqueado
- [ ] Lote inativo nao movimenta
- [ ] Funcionario inativo nao registra operacao
- [ ] Pasto em obra bloqueia ocupacao (ou regra definida)
- [ ] Area de pasto vem do poligono real quando existir

### Confiabilidade
- [ ] Funcionamento online
- [ ] Fallback offline minimo validado
- [ ] Re-sincronizacao sem duplicar dados
- [ ] Build sem erro

## 5) Mapeamento Rapido Legado -> Novo

Rebanho/lotes/pastos
- Legado: amplo e maduro
- Novo: base pronta, precisa reforco de regras e rastreabilidade

Funcionarios
- Legado: cadastro operacional completo
- Novo: precisa validacoes, estados e vinculo em todas as acoes

Manejo e obras
- Legado: processos mais ricos
- Novo: existente, ainda superficial

Financeiro
- Legado: fluxo, balanço, indicadores
- Novo: modulo inicial, precisa centros de custo e DRE simplificado

## 6) Sequencia Recomendada de Execucao (ordem pratica)
1. Fechar Fase 1 (troca de pasto real)
2. Fechar Fase 2 (funcionarios robustos)
3. Fechar Fase 3 (manejo/obra transacional)
4. Fechar Fase 4 (financeiro operacional)
5. Fechar Fase 5 e 6 (rastreabilidade, testes e implantacao)

## 7) Regra de Trabalho para nao perder nada
- Cada fase so fecha com checklist de aceite completo.
- Nada de abrir 4 modulos ao mesmo tempo: foco em 1 fase por vez.
- Todo ajuste novo precisa apontar qual item de checklist resolve.
- A cada fim de fase: build + validacao de tela + teste rapido de fluxo.

---

## Proxima acao sugerida (imediata)
Iniciar Fase 1 e implementar fluxo completo de troca de pasto com:
- selecao de lote existente
- selecao de pasto origem/destino
- responsavel obrigatorio
- atualizacao simultanea lote/pasto
- registro de historico da movimentacao
