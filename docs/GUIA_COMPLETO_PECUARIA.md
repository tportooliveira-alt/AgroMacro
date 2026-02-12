# 📖 GUIA COMPLETO DE GESTÃO DE PECUÁRIA DE CORTE
## AgroMacro — Manual de Referência Técnica v1.0

> **Objetivo:** Este documento é a base de conhecimento definitiva para o desenvolvimento do AgroMacro.
> Compilado a partir de fontes técnicas (Embrapa, SENAR, Rehagro, universidades), fóruns de produtores,
> canais do YouTube especializados (Rehagro, Canal Rural, BeefPoint) e análise dos concorrentes líderes
> (JetBov, iRancho, Farmbov). Cada capítulo inclui como o AgroMacro deve implementar o tema.

---

## SUMÁRIO

1. [Ciclo Completo: Cria, Recria e Engorda](#1-ciclo-completo-cria-recria-e-engorda)
2. [Gestão de Lotes e Categorias](#2-gestão-de-lotes-e-categorias)
3. [Controle Individual de Animais](#3-controle-individual-de-animais)
4. [Manejo Sanitário e Calendário de Vacinas](#4-manejo-sanitário-e-calendário-de-vacinas)
5. [Reprodução e Protocolos IATF](#5-reprodução-e-protocolos-iatf)
6. [Nutrição e Suplementação](#6-nutrição-e-suplementação)
7. [Gestão de Pastagens](#7-gestão-de-pastagens)
8. [Indicadores Zootécnicos (KPIs Produtivos)](#8-indicadores-zootécnicos-kpis-produtivos)
9. [Gestão Financeira Completa](#9-gestão-financeira-completa)
10. [Compra, Venda e Mercado](#10-compra-venda-e-mercado)
11. [Rastreabilidade e Documentação](#11-rastreabilidade-e-documentação)
12. [Melhoramento Genético](#12-melhoramento-genético)
13. [Estoque e Insumos](#13-estoque-e-insumos)
14. [Obras e Infraestrutura](#14-obras-e-infraestrutura)
15. [Funcionários e Equipe](#15-funcionários-e-equipe)
16. [Análise dos Concorrentes](#16-análise-dos-concorrentes)
17. [Mapa de Funcionalidades AgroMacro](#17-mapa-de-funcionalidades-agromacro)

---

## 1. CICLO COMPLETO: CRIA, RECRIA E ENGORDA

### 1.1 O Que É o Ciclo Completo
O ciclo completo integra as três fases de produção de carne bovina em uma mesma propriedade:
produz bezerros (cria), desenvolve os animais (recria) e termina para abate (engorda).
A vantagem é a captura de valor em todas as etapas, mas requer gestão precisa de cada fase.

### 1.2 Fase de CRIA (Nascimento → Desmama)

**Período:** 0 a 6–8 meses de idade

**O que gerenciar:**
- Estação de monta e diagnóstico de gestação
- Data de nascimento, peso ao nascer, pai e mãe
- Acompanhamento do ganho de peso do bezerro
- Vacinas de bezerro (clostridioses, brucelose em fêmeas 3-8 meses)
- Desmama planejada (5-7 meses para manejo intensivo)

**Indicadores-chave:**
| Indicador | Meta |
|-----------|------|
| Taxa de prenhez | > 85% |
| Taxa de desmama | > 80% |
| Peso à desmama | 180-220 kg (Nelore), 220-260 kg (cruzado) |
| Intervalo entre partos | < 13 meses |
| Taxa de mortalidade até desmama | < 3% |

**No AgroMacro:** Módulo Cabecas (cadastro individual) + Calendário (IATF/Monta) + Lotes (matéria)

### 1.3 Fase de RECRIA (Desmama → Terminação)

**Período:** 8 a 18-24 meses

**O que gerenciar:**
- Formação de lotes por sexo, peso e categoria
- Pesagens mensais ou bimensais para acompanhar GMD
- Suplementação estratégica (seca e águas)
- Manejo de pastagens com rotação de piquetes
- Separação dos animais para venda ou terminação

**Indicadores-chave:**
| Indicador | Meta |
|-----------|------|
| GMD (Ganho Médio Diário) | 0,4-0,8 kg/dia (pasto) |
| Peso ao final da recria | 360-420 kg (12-14@) |
| Lotação | 2-4 UA/ha (intensivo) |
| Conversão alimentar | 8-12 kg MS / kg ganho |

**No AgroMacro:** Módulo Lotes + Manejo (pesagem) + Indicadores (GMD, conversão) + Pastos

### 1.4 Fase de ENGORDA / TERMINAÇÃO (→ Abate)

**Período:** 18-36 meses (precoce: 18-24 meses)

**O que gerenciar:**
- Dieta de terminação (alto grão ou pasto adubado)
- Acabamento de carcaça (gordura de cobertura)
- Previsão de data de abate com base no GMD
- Negociação de venda e trava de preço
- Escala de abate do frigorífico

**Metas de abate por categoria:**
| Categoria | Idade | Peso Vivo | Arrobas |
|-----------|-------|-----------|---------|
| Superprecoce | 13-15 meses | 440-500 kg | 15-17@ |
| Precoce | 24-26 meses | 480-540 kg | 16-18@ |
| Boi Convencional | 30-48 meses | 450-600 kg | 15-20@ |

**Rendimento de Carcaça:**
- Fórmula: `(Peso Carcaça / Peso Vivo) × 100`
- Nelore a pasto: 50-52%
- Cruzado confinamento: 53-56%
- Angus puro confinamento: 55-58%

**No AgroMacro:** Projeção de Receita + Venda + Indicadores Financeiros

---

## 2. GESTÃO DE LOTES E CATEGORIAS

### 2.1 Categorias de Lote
Todo rebanho de corte deve ser dividido em lotes com categorias definidas:

| Categoria | Descrição | Emoji |
|-----------|-----------|-------|
| **Cria** | Matrizes com bezerro ao pé | 🐮 |
| **Recria** | Machos/fêmeas pós-desmama em desenvolvimento | 🐄 |
| **Engorda** | Animais em terminação para abate | 🥩 |
| **Matrizes** | Vacas parideiras selecionadas | 👑 |
| **Touros** | Reprodutores ativos | 🐂 |
| **Descarte** | Animais para venda imediata | 💰 |

### 2.2 Informações Essenciais por Lote
Cada lote deve registrar:
- **Nome/Identificação** (ex: "Lote Engorda 01")
- **Categoria** (cria, recria, engorda, matrizes)
- **Quantidade de animais**
- **Peso médio do lote**
- **Data de entrada** (para calcular dias de cocho)
- **Pasto atribuído** (para controle de lotação)
- **Raça predominante**
- **Protocolo nutricional ativo**

### 2.3 Movimentações de Lote
Operações que alteram o lote:
- **Transferência:** Mover animais entre lotes
- **Desmama:** Separar bezerros das matrizes
- **Venda parcial:** Retirar parte do lote
- **Divisão/Consolidação:** Dividir ou unir lotes
- **Morte:** Registrar baixa com motivo

**No AgroMacro:** `lotes.js` + `rebanho-ops.js` (transferência, desmama, morte, venda)

---

## 3. CONTROLE INDIVIDUAL DE ANIMAIS

### 3.1 Por Que Controle Individual?
O controle individualizado permite:
- Rastreabilidade completa (exigência SISBOV)
- Seleção de animais superiores
- Descarte preciso de animais improdutivos
- Histórico sanitário por animal
- Documentação para programas de melhoramento

### 3.2 Ficha do Animal
Cada animal deve ter registrado:

**Identificação:**
- Número de brinco (eletrônico RFID)
- Nome/apelido (opcional)
- Data de nascimento
- Sexo
- Raça
- Pai e Mãe (genealogia)
- Lote atual
- Foto

**Dados Zootécnicos:**
- Histórico de pesagens (data + peso)
- GMD calculado automaticamente
- Histórico de manejos sanitários
- Histórico reprodutivo (fêmeas)
- Escore de condição corporal (1-5)

**Dados Financeiros:**
- Valor de compra
- Custos acumulados (alimentação, sanidade)
- Projeção de valor para venda

**No AgroMacro:** `cabecas.js` (cadastro individual com foto, brinco, raça, lote, pasto, sexo, pesagem)

---

## 4. MANEJO SANITÁRIO E CALENDÁRIO DE VACINAS

### 4.1 Vacinas Obrigatórias (Brasil)

| Vacina | Quando | Quem | Observações |
|--------|--------|------|-------------|
| **Febre Aftosa** | Semestral (maio e novembro) | Todos os bovinos | Obrigatória e fiscalizada |
| **Brucelose (B19)** | Dose única | Fêmeas 3-8 meses | Obrigatória por lei |
| **Raiva** | Anual | Todo rebanho | Obrigatória em áreas endêmicas |

### 4.2 Vacinas Recomendadas

| Vacina | 1ª dose | Reforço | Revacinação |
|--------|---------|---------|-------------|
| **Clostridioses** (carbúnculo, botulismo) | 2-3 meses | 30 dias após | Anual |
| **Leptospirose** | 4-6 meses | 4 semanas após | Semestral |
| **IBR/BVD/PI3** | Conforme protocolo | 30 dias | Anual |
| **Pneumoenterites** | Vacas no 8º mês gestação | Bezerros 15 e 30 dias | Conforme necessidade |

### 4.3 Vermifugação Estratégica

**Protocolo Embrapa (4 doses):**
1. **Abril/Maio** — Coincide com vacinação de Aftosa
2. **Julho** — Primeira quinzena
3. **Agosto/Setembro** — Segunda quinzena
4. **Dezembro** — Primeira quinzena (pode ser suspensa com bom controle)

**Protocolo 5-8-11 (Zoetis/UFMS):**
- Maio, Agosto, Novembro (mais simples, 3 doses)

**Regras importantes:**
- Vermifugar bezerros a partir de 2-3 meses, a cada 60-90 dias até desmama
- Usar dosagem correta (pesar os animais!)
- Não trocar vermífugo com frequência
- Quarentenar animais novos antes de soltar no pasto

### 4.4 Controle de Ectoparasitas
- **Carrapatos:** Tratamento com banho ou pour-on, rotação de princípios ativos
- **Mosca-do-chifre:** Brincos inseticidas, pour-on
- **Berne/Bicheira:** Tratamento tópico individual

### 4.5 Período de Carência
Cada medicamento possui um período de carência (dias entre aplicação e abate permitido):
- Ivermectina: 28-35 dias
- Doramectina: 21 dias
- Antibióticos: 15-30 dias (varia por produto)

> ⚠️ **REGRA CRÍTICA:** Animal em carência NÃO pode ser vendido para abate!

**No AgroMacro:** `calendario.js` (calendário sanitário, alertas de carência, IATF) + `manejo.js` (registro de aplicações)

---

## 5. REPRODUÇÃO E PROTOCOLOS IATF

### 5.1 Estação de Monta
- **Duração ideal:** 60-90 dias (concentra partos e facilita manejo)
- **Relação touro:vaca:** 1:25 a 1:40 (monta natural)
- **Condição corporal mínima:** Escore 3 (escala 1-5)
- **Idade mínima novilha:** 14-16 meses com 60-65% do peso adulto

### 5.2 IATF — Inseminação Artificial em Tempo Fixo

**O que é:** Protocolo hormonal que sincroniza o cio das fêmeas, permitindo inseminação sem necessidade de detecção de cio.

**Vantagens:**
- Concentra partos em período programado
- Permite uso de genética superior (sêmen selecionado)
- Aumenta taxa de prenhez comparado a monta natural
- Antecipa a prenhez no início da estação

**Protocolo Padrão (Progesterona + Estradiol):**

| Dia | Ação | Produtos |
|-----|------|----------|
| D0 | Inserir dispositivo vaginal + BE | Progesterona (CIDR/DIB) + Benzoato de Estradiol |
| D8 | Retirar dispositivo + PGF2α + eCG | Prostaglandina + Gonadotrofina |
| D9 | Aplicar indutor de ovulação | Benzoato de Estradiol ou GnRH |
| D10 | **INSEMINAÇÃO** | 16-20h após a última aplicação |

**Protocolo Ovsynch (sem dispositivo):**
- D0: GnRH → D7: PGF2α → D9: GnRH → D10: IA

**Diagnóstico de Gestação:**
- Ultrassom 30 dias após IA
- Palpação retal 45-60 dias após IA
- Animais vazios voltam ao protocolo ou vão para monta natural

**Indicadores Reprodutivos:**
| Indicador | Meta |
|-----------|------|
| Taxa de concepção 1ª IA | 50-60% |
| Taxa de prenhez final (com repasse touro) | > 85% |
| Taxa de aborto | < 2% |
| Intervalo entre partos | < 13 meses |

**No AgroMacro:** `calendario.js` (getProximasVacinas, getCarenciaAtiva, getTarefasDoDia para IATF)

---

## 6. NUTRIÇÃO E SUPLEMENTAÇÃO

### 6.1 Categorias de Suplementação

| Tipo | Consumo | Quando | Finalidade |
|------|---------|--------|------------|
| **Sal mineral** | 30-80 g/dia | Ano todo | Reposição de minerais essenciais |
| **Sal proteinado** | 1-2 g/kg PV | Seca (abril-setembro) | Manter peso na seca |
| **Suplemento energético** | 3-5 g/kg PV | Águas e transição | Acelerar ganho |
| **Ração de confinamento** | À vontade | Terminação | Máximo ganho de peso |
| **Creep feeding** | À vontade para bezerro | Cria | Peso extra na desmama |

### 6.2 Nutrição no Pasto (Extensivo e Semi-intensivo)

**Período das Águas (outubro-março):**
- Pasto de boa qualidade = base da dieta
- Sal mineral à vontade
- Suplementação energética opcional (GMD +0,2-0,4 kg/dia extra)

**Período da Seca (abril-setembro):**
- Pasto seco = baixa proteína e energia
- **Sal proteinado obrigatório** (mantém GMD próximo de 0)
- **Sem suplementação:** Animal perde 0,2-0,5 kg/dia!
- **Com proteinado de baixo consumo:** GMD +0,1-0,3 kg/dia
- **Com suplementação energético-proteica:** GMD +0,3-0,5 kg/dia

### 6.3 Confinamento

**Estrutura da dieta:**
- 60% concentrado + 40% volumoso (proporção típica)
- **Volumosos:** Silagem de milho, sorgo, cana-de-açúcar, capim
- **Concentrados:** Milho grão, farelo de soja, farelo de algodão, DDG, caroço de algodão
- **Aditivos:** Monensina (melhora conversão), virginiamicina (controle acidose), ureia

**Metas de desempenho no confinamento:**
| Parâmetro | Meta |
|-----------|------|
| GMD | 1,2-1,8 kg/dia |
| Consumo MS | 2-2,5% do PV |
| Conversão alimentar | 5-7 kg MS / kg ganho |
| Duração | 80-120 dias |
| Custo da diária | R$ 12-18 / cab / dia |

**Cuidados:**
- Adaptação gradual (14-21 dias aumentando concentrado)
- Leitura de cocho diária (evitar sobras > 5%)
- Espaço de cocho: 40-50 cm lineares por animal
- Água limpa e fresca sempre disponível

### 6.4 Custo da Nutrição
O custo de nutrição representa 60-70% do custo total de produção.
Controlar esse custo é ESSENCIAL para a rentabilidade.

**Fórmula: Custo Diário por Animal**
```
Custo Nutrição/Dia = (kg MS consumidos × R$/kg da dieta)
Custo Nutrição/@ produzida = Custo total nutrição / Arrobas ganhas
```

**No AgroMacro:** `estoque.js` (controle de insumos) + `indicadores.js` (calcCustoCabDia, calcCustoNutricao) + `lotes.js` (protocolo nutricional)

---

## 7. GESTÃO DE PASTAGENS

### 7.1 Conceitos Fundamentais

**UA (Unidade Animal):** 1 UA = 450 kg de peso vivo
- 1 vaca Nelore adulta ≈ 1 UA
- 1 bezerro desmamado ≈ 0,4 UA
- 1 boi em terminação ≈ 1,1-1,2 UA

**Taxa de Lotação:** Número de UAs por hectare
- Extensivo degradado: 0,3-0,5 UA/ha
- Extensivo razoável: 0,8-1,2 UA/ha
- Semi-intensivo: 2-4 UA/ha
- Intensivo (irrigado, adubado): 5-15 UA/ha

### 7.2 Pastejo Rotacionado

**Como funciona:**
A pastagem é dividida em piquetes. Os animais pastam um piquete por vez,
enquanto os demais descansam e se recuperam.

**Dimensionamento:**
```
Nº de piquetes = (Período de descanso / Período de ocupação) + 1

Exemplo: 30 dias descanso / 3 dias ocupação + 1 = 11 piquetes
```

**Período de descanso por espécie:**
| Capim | Descanso (águas) | Descanso (seca) | Entrada (cm) | Saída (cm) |
|-------|-------------------|-----------------|---------------|------------|
| **Mombaça** | 24-35 dias | 40-50 dias | 85-90 cm | 45-50 cm |
| **Tanzânia** | 24-30 dias | 40 dias | 65-70 cm | 30-35 cm |
| **Brachiaria brizantha** | 25-35 dias | 45-60 dias | 35-40 cm | 15-20 cm |
| **Brachiaria decumbens** | 25-35 dias | 45-60 dias | 25-30 cm | 10-15 cm |
| **Tifton 85** | 21-28 dias | 35-42 dias | 25-30 cm | 10-12 cm |
| **Capim-elefante** | 35-50 dias | 60+ dias | 1,70-1,80 m | 0,80-0,90 m |

### 7.3 Avaliação do Pasto
Informações que o pecuarista deve registrar por piquete:

- **Altura do pasto** (usar régua graduada)
- **Cobertura de solo** (% de solo exposto)
- **Presença de invasoras** (alto/médio/baixo)
- **Disponibilidade de forragem** (kg MS/ha)
- **Status:** Em uso / Descanso / Vedado / Reforma

### 7.4 Adubação e Reforma
- **Adubação de manutenção:** NPK anual com base na análise de solo
- **Calagem:** Correção do pH para 5,5-6,0
- **Reforma de pasto degradado:** Gradagem + semeadura + adubação de formação
- **Sobressemeadura:** Plantar braquiária sobre pasto degradado com plantio direto

**No AgroMacro:** `pastos.js` + `pasto-mgmt.js` (cadastro de pastos, lotação UA/ha, status, vinculação com lotes)

---

## 8. INDICADORES ZOOTÉCNICOS (KPIs PRODUTIVOS)

### 8.1 Indicadores de Peso e Ganho

| Indicador | Fórmula | Interpretação |
|-----------|---------|---------------|
| **GMD** (Ganho Médio Diário) | (Peso final - Peso inicial) / Nº dias | Meta: >0,5 kg/dia (pasto), >1,2 kg/dia (confin.) |
| **GP** (Ganho de Peso Total) | Peso final - Peso inicial | Arrobas produzidas por animal |
| **Conversão Alimentar** | kg MS consumida / kg ganho | Menor = melhor. Meta: <7 (confin.) |
| **Eficiência Alimentar** | kg ganho / kg MS consumida | Maior = melhor |
| **Arrobas Produzidas** | GP total / 30 | 1 arroba em pé = 30 kg (vivo) |

> **ATENÇÃO:** 1 arroba comercial = 15 kg de carcaça (rendimento ~50%).
> Mas no campo, calcula-se "arroba em pé" = 30 kg de peso vivo = 15 kg de carcaça.

### 8.2 Indicadores de Pastagem

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| **Lotação** (UA/ha) | Total UA / Área total de pastos | Varia por sistema |
| **Kg de PV/ha** | Peso vivo total / Área | >500 kg/ha (intensivo) |
| **Arrobas/ha/ano** | Total @ produzidas / Área | >15@/ha/ano (bom) |
| **Taxa de desfrute** | Animal vendido / Rebanho total × 100 | >20% (bom) |

### 8.3 Indicadores Reprodutivos

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| **Taxa de prenhez** | Prenhas / Expostas × 100 | >85% |
| **Taxa de desmama** | Desmamados / Nascidos × 100 | >80% |
| **Taxa de natalidade** | Nascidos / Matrizes × 100 | >80% |
| **Intervalo entre partos** | Média de dias entre partos | <13 meses |
| **Idade ao 1º parto** | Idade da novilha no 1º parto | <30 meses |

### 8.4 Indicadores Sanitários

| Indicador | Meta |
|-----------|------|
| Taxa de mortalidade geral | < 2% |
| Mortalidade de bezerros | < 3% |
| Cobertura vacinal | 100% |
| Animais tratados / Total | O menor possível |

**No AgroMacro:** `indicadores.js` (calcGMD, calcConversaoAlimentar, diasCocho, calcEficiencia, calcCustoCabDia, etc.)

---

## 9. GESTÃO FINANCEIRA COMPLETA

### 9.1 Estrutura de Custos

**Custos Fixos** (não variam com a produção):
- Depreciação de instalações e equipamentos
- Salários fixos (funcionários permanentes)
- IPVA, IPTU, ITR
- Seguros
- Custo da terra (custo de oportunidade)
- Manutenção de cercas e aguadas

**Custos Variáveis** (variam com a produção):
- Nutrição (60-70% do custo total!)
- Medicamentos e vacinas
- Combustível e transporte
- Comissões de venda
- Frete do gado
- Mão de obra temporária

### 9.2 Indicadores Financeiros Essenciais

| Indicador | Fórmula | O que revela |
|-----------|---------|--------------|
| **Custo por Arroba Produzida** | Custo total / @s produzidas | Eficiência de produção |
| **Custo por Cabeça por Dia** | Custo total do lote / (Nº animais × Dias) | Gasto diário médio |
| **Margem por Arroba** | Preço venda/@ - Custo produção/@ | Lucro bruto por @ |
| **Ponto de Equilíbrio** | Custos fixos / (Preço/@ - Custo variável/@) | Nº de @ para empatar |
| **ROI** | (Receita - Custo total) / Capital investido × 100 | Retorno do investimento |
| **Margem Líquida** | (Receita - Todos os custos) / Receita × 100 | Saúde financeira |

### 9.3 Regra de Ouro: Separar Contas
🏦 **NUNCA misture conta pessoal com conta da fazenda!**
- Tenha conta bancária separada para a fazenda
- Registre TODA entrada e saída
- Pague-se um pró-labore fixo mensal

### 9.4 Projeção de Receita
Para projetar a receita futura do rebanho:

```
Peso Projetado = Peso Atual + (GMD × Dias Restantes)
Arrobas Projetadas = (Peso Projetado × Nº Animais) / 30
Receita Projetada = Arrobas Projetadas × Preço da Arroba
Lucro Projetado = Receita Projetada - Custo Total (atual + futuro)
```

### 9.5 Trava de Preço (Hedge)
Proteger a margem de lucro fixando o preço da arroba antecipadamente:
- **Mercado futuro (B3):** Vender contratos de boi gordo (330@/contrato)
- **Opções de venda (Put):** Comprar proteção sem obrigação de venda
- **Contratos a termo:** Acordo direto com frigorífico para preço fixo

### 9.6 Fluxo de Caixa
O fluxo de caixa deve registrar:
- **Entradas:** Vendas de gado, recebíveis, subprodutos
- **Saídas:** Compras de gado, insumos, salários, contas
- **Saldo:** Permite visualizar meses de aperto e planejar

**No AgroMacro:** `financeiro.js` (fluxo de caixa, balanço) + `indicadores.js` (todos os KPIs financeiros) + `contas.js` (contas a pagar)

---

## 10. COMPRA, VENDA E MERCADO

### 10.1 Compra de Gado

**O que avaliar:**
- Condição corporal do animal
- Saúde aparente (olhos, pelo, aprumos)
- Peso real (balança, não olhômetro!)
- Documentação (GTA, certificado de vacinação)
- Histórico sanitário da fazenda de origem
- Quarentena de 30 dias antes de misturar

**Onde comprar:**
- Leilões presenciais e virtuais
- Vizinhos e conhecidos (relação de confiança)
- Corretores especializados
- Feiras agropecuárias

### 10.2 Venda de Gado Gordo

**Modalidades de venda:**
- **Direto ao frigorífico:** Negociação por arroba, pagamento em 30 dias
- **Leilão:** Maior exposição, pode conseguir prêmio
- **Exportação:** Exige SISBOV e habilitação sanitária
- **Venda em pé:** Por cabeça, comum para bezerros e reprodutores

**Cálculo do valor de venda:**
```
Peso vivo × Rendimento carcaça (%) × 2 = Arrobas de carcaça
Arrobas de carcaça × Preço da arroba = Valor bruto

Exemplo: 540 kg × 52% rendimento = 280,8 kg carcaça
280,8 / 15 = 18,72 arrobas
18,72 × R$ 345 = R$ 6.458 por animal
```

### 10.3 Cotações de Referência
As principais referências de preço da arroba no Brasil:
- **CEPEA/Esalq:** Indicador diário (referência para contratos futuros)
- **Scot Consultoria:** Cotações por praça
- **B3:** Contratos futuros (projeção de preços)

**No AgroMacro:** Módulo de Compra e Venda + Cotação Rebanho + Projeção de Receita

---

## 11. RASTREABILIDADE E DOCUMENTAÇÃO

### 11.1 GTA (Guia de Trânsito Animal)
- **Obrigatória** para qualquer movimentação de bovinos
- Emitida pelo órgão estadual de defesa agropecuária
- Contém: Origem, destino, quantidade, finalidade, dados sanitários
- **Sem GTA = crime ambiental!**

### 11.2 SISBOV (Sistema Brasileiro de Identificação)
- Sistema oficial do MAPA para rastreabilidade individual
- Exigido para exportação à União Europeia
- Requer identificação individual (brinco oficial)
- Registro de todas as movimentações em banco de dados nacional
- Confere prêmio no preço da arroba

### 11.3 Escrituração Zootécnica
Registro sistemático de todos os dados do rebanho:
- Nascimentos, mortes, compras, vendas
- Pesagens periódicas
- Vacinas e tratamentos aplicados
- Coberturas e diagnósticos de gestação
- Movimentações entre pastos e lotes

> 📝 **O AgroMacro é, essencialmente, uma ferramenta de escrituração zootécnica digital.**

### 11.4 Brinco Eletrônico (RFID)
- Identificação única de 15 dígitos
- Leitura por bastão RFID (sem necessidade de contenção prolongada)
- Integração com balança eletrônica
- Base para rastreabilidade completa

**No AgroMacro:** `cabecas.js` (nº brinco, ficha individual) + `rebanho-ops.js` (movimentações)

---

## 12. MELHORAMENTO GENÉTICO

### 12.1 Conceitos Fundamentais

**DEP (Diferença Esperada na Progênie):**
Prediz a superioridade genética dos filhos de um touro em relação à média da população.

**Exemplo:** Se um touro tem DEP de Peso à Desmama = +12 kg, significa que os filhos dele vão pesar, em média, 12 kg a mais na desmama que a média da raça.

**Acurácia:** Mede a confiabilidade da DEP (0 a 1). Quanto maior, mais confiável.

### 12.2 Principais Raças de Corte no Brasil

| Raça | Tipo | Características |
|------|------|----------------|
| **Nelore** | Zebu | 80% do rebanho BR. Rústico, tolerante ao calor |
| **Angus** | Taurino | Precocidade, qualidade de carne, acabamento |
| **Hereford** | Taurino | Rusticidade, docilidade, boa carne |
| **Brahman** | Zebu | Vigor, porte grande, bom para cruzamento |
| **Senepol** | Taurino adaptado | Tolerante ao calor, sem chifre, boa carne |
| **Tabapuã** | Zebu | Adaptado ao BR, sem chifre |

### 12.3 Cruzamento Industrial
Combinação de duas ou mais raças para obter heterose (vigor híbrido).

**Cruzamento mais comum:** Nelore × Angus
- Vaca Nelore (rústica, adaptada) × Touro Angus (precoce, boa carne)
- Resultado F1: Animal equilibrado, ganho de peso superior (+15-20%)

**Seleção de touros para cruzamento:**
- DEP de altura: moderada (evitar bezerros muito grandes no parto)
- DEP de gordura: positiva (acabamento de carcaça a passo)
- DEP de peso: alta, mas compatível com facilidade de parto

### 12.4 Programas de Melhoramento no Brasil
- **ANCP** (Associação Nacional de Criadores e Pesquisadores)
- **ABCZ** (Associação Brasileira de Criadores de Zebu)
- **DeltaGen** (Programa privado)
- **Qualitas** (Avaliação genômica)
- **GenePlus** (Embrapa)

**No AgroMacro:** Ficha individual com pai, mãe, raça + Dados de pesagem para cálculo de DEP

---

## 13. ESTOQUE E INSUMOS

### 13.1 Categorias de Estoque

| Categoria | Exemplos |
|-----------|----------|
| **Nutrição** | Sal mineral, proteinado, ração, caroço algodão, DDG |
| **Medicamentos** | Vermífugos, vacinas, antibióticos, anti-inflamatórios |
| **Reprodução** | Sêmen, dispositivos CIDR/DIB, hormônios |
| **Obras** | Arame, postes, moirões, cimento, telhas |
| **Maquinário** | Combustível, peças, óleos |

### 13.2 Controle de Estoque
Para cada item registrar:
- **Entradas:** Data, quantidade, preço unitário, fornecedor
- **Saídas:** Data, quantidade, destino (lote/pasto/obra)
- **Saldo atual**
- **Alerta de estoque baixo** (quantidade mínima)

### 13.3 Custeio por Lote
Vincular cada consumo de insumo ao lote específico:
- Quanto de ração o Lote Engorda 01 consumiu?
- Quanto de medicamento foi gasto com o Lote Matrizes?
- Qual o custo de nutrição por cabeça por dia naquele lote?

**No AgroMacro:** `estoque.js` (entradas, saídas, saldos, alertas, populateLoteNutrition)

---

## 14. OBRAS E INFRAESTRUTURA

### 14.1 Infraestrutura Essencial

| Item | Descrição |
|------|-----------|
| **Curral com tronco e brete** | Contenção para manejo sanitário e pesagem |
| **Balança** | Pesagem individual ou de lote |
| **Embarcadouro** | Carregamento de animais para transporte |
| **Cercas** | Divisão de pastos e piquetes |
| **Bebedouros** | Água limpa e fresca para os animais |
| **Cochos** | Fornecimento de sal mineral e ração |
| **Galpão** | Armazenamento de insumos e equipamentos |
| **Silos** | Armazenamento de silagem |

### 14.2 Registro de Obras
Para cada obra ou melhoria:
- Descrição e categoria
- Custo estimado vs. real
- Materiais utilizados (vincular ao estoque)
- Mão de obra (vincular a funcionários)
- Data de início e término
- Status (pendente, em andamento, concluída)

**No AgroMacro:** `obras.js` (cadastro de obras com materiais e trabalhadores)

---

## 15. FUNCIONÁRIOS E EQUIPE

### 15.1 Cargos Típicos

| Cargo | Função |
|-------|--------|
| **Vaqueiro** | Manejo diário do gado, ronda, verificação |
| **Tratorista** | Preparo de alimento, distribuição, adubação |
| **Capataz** | Coordenação da equipe, decisões de campo |
| **Veterinário** | Saúde animal, protocolos sanitários e reprodutivos |
| **Zootecnista** | Nutrição, genética, indicadores de desempenho |
| **Gerente** | Gestão financeira e administrativa |

### 15.2 Registro por Funcionário
- Nome, função, data de admissão
- Salário e forma de pagamento
- Tarefas atribuídas
- Custo total (salário + encargos)

**No AgroMacro:** `funcionarios.js` (cadastro, vinculação com obras)

---

## 16. ANÁLISE DOS CONCORRENTES

### 16.1 Comparativo: AgroMacro vs. Mercado

| Funcionalidade | JetBov | iRancho | Farmbov | **AgroMacro** |
|----------------|--------|---------|---------|---------------|
| **Offline (PWA)** | ✅ | ✅ | ✅ | ✅ |
| **Controle individual** | ✅ | ✅ | ✅ | ✅ |
| **Foto do animal** | ❌ | ✅ (com áudio) | ❌ | ✅ |
| **Gestão sanitária** | ✅ | ✅ | ✅ | ✅ |
| **Gestão reprodutiva (IATF)** | ✅ | ✅ | Básico | ✅ |
| **Nutrição/Estoque** | ✅ | ✅ | Básico | ✅ |
| **Gestão de pastagem** | ✅ (app separado) | Básico | ✅ | ✅ |
| **Financeiro completo** | ✅ | ✅ | Básico | ✅ |
| **Projeção de receita** | ✅ | ❌ | ❌ | ✅ |
| **Custo por lote (breakdown)** | ✅ | ❌ | ❌ | ✅ |
| **Indicadores produtivos** | ✅ | ✅ | ✅ | ✅ |
| **Gráficos/Dashboard** | ✅ | Básico | Básico | ✅ (Chart.js) |
| **Relatório PDF** | ✅ | ✅ | ✅ | ✅ |
| **Alertas inteligentes** | ✅ | ✅ | ❌ | ✅ (8 tipos) |
| **Melhoramento genético** | ❌ | ✅ (ANCP, ABCZ) | ❌ | 🔜 (futuro) |
| **Integração brinco RFID** | ✅ | ✅ | ❌ | 🔜 (futuro) |
| **IA / Assistente** | ✅ (Jay) | ❌ | ❌ | 🔜 (futuro) |
| **Obras e funcionários** | ❌ | ❌ | ❌ | ✅ |
| **Contas a pagar** | Básico | ❌ | ❌ | ✅ |
| **Calendário sanitário visual** | ❌ | Básico | ❌ | ✅ |
| **Preço** | R$ 150-500/mês | R$ 200-600/mês | R$ 49-199/mês | **GRATUITO** |

### 16.2 Diferenciais Exclusivos do AgroMacro
1. **100% Gratuito e Offline** — PWA que funciona sem internet
2. **Obras e Funcionários** — Nenhum concorrente oferece
3. **8 tipos de alerta inteligente** (vacinas, estoque baixo, contas, carência, etc.)
4. **Projeção de receita por lote** com breakdown financeiro
5. **Custo por lote** detalhado (nutrição, manejo, compra)
6. **Dashboard com KPIs** na tela inicial
7. **Gráficos** com evolução temporal (Chart.js)
8. **Calendário IATF** com tarefas do dia

### 16.3 O Que Falta Para Ser o Melhor

**Funcionalidades a implementar (prioridade):**
1. 🎨 Visual Overhaul — Cards premium em todas as telas
2. 📊 Mais gráficos — Evolução de peso por lote, fluxo de caixa mensal
3. 🧬 Dados de pai/mãe — Registro genealógico básico
4. 📈 Cotação online — Preço da arroba atualizado (API CEPEA)
5. 🗺️ Mapa de pastos — Visualização georreferenciada
6. 🤖 IA básica — Sugestão de manejo com base nos dados
7. 📱 Compartilhamento de dados — Export/Import entre dispositivos
8. 🏷️ Multi-fazenda — Gerenciar mais de uma propriedade

---

## 17. MAPA DE FUNCIONALIDADES AGROMACRO

### 17.1 Arquitetura de Módulos

```
AgroMacro PWA
├── 🏠 HOME (Dashboard)
│   ├── KPIs (rebanho, lotes, pastos, peso, projeção)
│   ├── Alertas inteligentes (8 tipos)
│   ├── Cotação do rebanho
│   └── Gráficos Chart.js
│
├── 🐄 REBANHO HUB
│   ├── Lotes (cadastro, cards, indicadores produtivos)
│   ├── Pastos (cadastro, lotação UA/ha, status)
│   ├── Manejo (pesagem, sanitário, reprodutivo)
│   ├── Cabeças (ficha individual com foto)
│   └── Calendário (sanitário, IATF, carência)
│
├── 💰 FINANCEIRO HUB
│   ├── Compra (registro de aquisição de gado)
│   ├── Venda (registro de venda, arrobas)
│   ├── Fluxo de Caixa (entradas × saídas)
│   ├── Balanço (resumo financeiro)
│   ├── Contas a Pagar (vencimento, alertas)
│   └── Indicadores (custo/@, margem, projeção receita, custo/lote)
│
├── 🔧 OPERAÇÕES HUB
│   ├── Estoque (entradas, saídas, saldos, alertas)
│   ├── Obras (materiais, trabalhadores, status)
│   └── Funcionários (cadastro, salários)
│
└── ⚙️ CONFIGURAÇÃO
    ├── Dados da fazenda
    ├── Exportar/Importar dados
    └── Resetar dados
```

### 17.2 Inventário de Arquivos

| Arquivo | Módulo | Linhas | Responsabilidade |
|---------|--------|--------|-----------------|
| `app.js` | Controller | ~440 | Navegação, KPIs, alertas, config |
| `data.js` | Dados | ~60 | LocalStorage, eventos |
| `lotes.js` | Lotes | ~350 | CRUD lotes, nutrição, cards |
| `pastos.js` | Pastos | ~200 | CRUD pastos, lotação |
| `pasto-mgmt.js` | Pastos | ~150 | Operações avançadas |
| `rebanho-ops.js` | Rebanho | ~250 | Transferência, desmama, morte, venda |
| `cabecas.js` | Individual | ~325 | Ficha animal, foto, histórico |
| `manejo.js` | Manejo | ~300 | Pesagem, sanitário, reprodutivo |
| `calendario.js` | Calendário | ~250 | Sanitário, IATF, carência |
| `financeiro.js` | Financeiro | ~400 | Fluxo, balanço, compra, venda |
| `indicadores.js` | KPIs | ~500 | GMD, custo, margem, projeção |
| `estoque.js` | Estoque | ~350 | Entradas, saídas, saldos |
| `obras.js` | Obras | ~200 | Registro de melhorias |
| `funcionarios.js` | RH | ~200 | Cadastro de trabalhadores |
| `contas.js` | Contas | ~200 | Contas a pagar, cotação |
| `graficos.js` | Dashboard | ~300 | Gráficos Chart.js |
| `index.html` | Interface | ~1200 | Toda a estrutura HTML |
| `styles.css` | Estilo | ~2500 | Design visual completo |
| `sw.js` | PWA | ~50 | Service Worker offline |
| `manifest.json` | PWA | ~30 | Configuração PWA |

---

## REFERÊNCIAS E FONTES

### Livros e Publicações
1. **Embrapa Gado de Corte** — Sistemas de Produção, Boletins Técnicos
2. **SENAR** — Coleção de cartilhas sobre manejo, sanitário e financeiro
3. **Rehagro** — Artigos técnicos e cursos de gestão pecuária
4. **Marcos Fava Neves** — "Planejamento e Gestão Estratégica do Sistema Agroindustrial da Carne Bovina"

### Sites e Portais
5. BeefPoint (beefpoint.com.br) — Portal de pecuária de corte
6. Canal Rural (canalrural.com.br) — Notícias e cotações
7. Scot Consultoria — Referência em cotações de gado
8. CEPEA/Esalq (cepea.esalq.usp.br) — Indicador de preço da arroba
9. iRancho (irancho.com.br) — Software gestão pecuária
10. JetBov (jetbov.com) — Software gestão pecuária com IA
11. Farmbov (farmbov.com) — Software gestão pecuária mobile

### YouTube (Canais Recomendados)
12. Rehagro TV — Gestão financeira e indicadores
13. Canal Rural — Mercado e cotações
14. JetBov — Demos e tutoriais
15. Pecuária Brasil — Manejo prático
16. Agropecuária do Futuro — Nutrição e suplementação

### Órgãos Oficiais
17. MAPA (gov.br/agricultura) — Regulamentação SISBOV
18. IAGRO/IDAF/IMA — Órgãos estaduais de defesa
19. ABCZ (abcz.org.br) — Melhoramento genético zebuíno
20. ANCP (ancp.org.br) — Avaliação genética

---

> 📌 **Este documento deve ser consultado sempre que iniciar uma nova funcionalidade no AgroMacro.**
> Ele garante que cada módulo implementado esteja alinhado com as melhores práticas da pecuária de corte brasileira.
>
> **Última atualização:** 12/02/2026
> **Autor:** Assistente AI compilando fontes técnicas
> **Versão:** 1.0
