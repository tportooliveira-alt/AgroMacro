# Orquestracao de Agentes e Subagentes

Data: 2026-04-11
Projeto: agromacro-novo
Objetivo: acelerar migracao do legado para operacao real de campo, com controle financeiro confiavel.

## 1. Papel do Orquestrador

Responsavel: Copilot (orquestrador principal)

Responsabilidades:
- Definir prioridade de entrega (P0 -> P1 -> P2)
- Distribuir tarefas por agente/subagente
- Aprovar criterio de aceite por fase
- Integrar resultados no codigo final
- Rodar validacao tecnica (build + erros + teste de fluxo)

## 2. Agentes e Funcoes

### Agent 1 - Explore
Missao:
- Mapear gaps entre legado e novo
- Localizar regras de negocio faltantes no codigo
- Priorizar backlog tecnico (P0/P1/P2)

Entradas:
- Legado em /js
- Novo app em /agromacro-novo/src

Saidas esperadas:
- Lista de funcionalidades ausentes
- Lista de integracoes quebradas
- Riscos de consistencia de dados
- Ordem recomendada de implementacao

### Agent 2 - financial-qa-livestock
Missao:
- Validar calculos e modelagem financeira pecuaria
- Definir eventos obrigatorios de lancamento financeiro
- Revisar centros de custo e DRE minimo

Entradas:
- Fluxos de lotes, pastos, manejo, obras e funcionarios
- Motor financeiro atual do novo app

Saidas esperadas:
- Checklist de regras financeiras obrigatorias
- Erros de calculo a evitar
- Modelo de reconciliacao (rebanho/estoque/financeiro)

### Agent 3 - agent-explainer (sob demanda)
Missao:
- Explicar para time/usuario o fluxo e as decisoes
- Traduzir regras tecnicas para linguagem operacional

Quando usar:
- Duvida de uso
- onboarding de equipe
- validacao de entendimento de regra

## 3. Quadro de Execucao por Fase

## Fase A (P0) - Base Operacional
Dono: Copilot + Explore

Tarefas:
1. Implementar troca de pasto com historico completo
2. Garantir integracao lote <-> pasto sem inconsistencias
3. Fortalecer cadastro de funcionarios (validacao + ciclo ativo/inativo)
4. Fortalecer cadastro de lotes (alocacao, status, movimentacao)

Criterio de aceite:
- Cada troca de pasto atualiza lote e pasto
- Historico de movimentacao visivel
- Nenhum lote aponta para pasto invalido

## Fase B (P0/P1) - Operacoes com Impacto Financeiro
Dono: Copilot + financial-qa-livestock

Tarefas:
1. Criar eventos financeiros por manejo
2. Criar eventos financeiros por obra
3. Criar eventos financeiros por funcionario (pagamento/provisao)
4. Criar centros de custo minimos

Centros de custo minimos:
- GADO_CORTE
- NUTRICAO
- SANIDADE
- MAO_DE_OBRA
- INFRAESTRUTURA
- ADMINISTRATIVO

Criterio de aceite:
- Toda acao operacional com custo gera lancamento financeiro rastreavel
- Sem duplicidade de contabilizacao

## Fase C (P1) - Reconciliacao e DRE
Dono: financial-qa-livestock + Copilot

Tarefas:
1. Reconciliar rebanho (saldo inicial + entradas - saidas - perdas)
2. Reconciliar estoque (entradas - consumos - perdas)
3. Fechar DRE simplificado por periodo
4. Exibir KPI: custo por cabeca e custo por arroba

Criterio de aceite:
- Fechamento mensal sem inconsistencia critica
- KPI consistente com eventos do periodo

## Fase D (P1/P2) - Inteligencia e Escala
Dono: Explore + Copilot

Tarefas:
1. Relatorios operacionais por lote e pasto
2. Alertas de risco (lotacao, custo anomalo, funcionario inativo em acao)
3. Integracoes avancadas (mapa visual, IA consultiva, compliance)

Criterio de aceite:
- Operacao diaria suportada com rastreabilidade ponta a ponta

## 4. Dependencias

- Nao iniciar DRE antes de eventos financeiros obrigatorios estarem prontos.
- Nao iniciar relatorio avancado antes de reconciliacao basica.
- Nao iniciar IA consultiva antes de dados base estarem consistentes.

## 5. Cadencia de Trabalho

- Sprint tecnico curto: 2 dias por bloco funcional
- Ao fim de cada bloco:
  1) build
  2) verificacao de erros
  3) teste de fluxo real
  4) checklist de aceite

## 6. Backlog Imediato (proxima entrega)

1. Troca de pasto com origem/destino/responsavel obrigatorios
2. Registro de historico de movimentacao de lote
3. Atualizacao sincronizada de estado de lote e pasto
4. Gatilho de lancamento financeiro para manejo e obra

## 7. Regra de Governanca

- Toda tarefa precisa indicar:
  - requisito que atende
  - impacto em dados
  - teste de validacao
- Sem isso, tarefa nao fecha.
