# 🧠 PESQUISA COMPLETA — BASE DE CONHECIMENTO IA AGROMACRO
## Genética, Genômica, Acasalamento Dirigido, Mercado e Inteligência do Mascote

> **Objetivo:** Este documento é a BASE DE CONHECIMENTO que alimenta a IA do AgroMacro.
> Toda informação aqui será usada pelo Mascote para dar pareceres, alertas proativos e recomendações.
> Última atualização: Fevereiro 2026

---

## PARTE 1: MAPA DO ECOSSISTEMA AGROMACRO

### 1.1. Arquitetura de Módulos (25 arquivos JS)

```
┌──────────────────────────────────────────────────────────────┐
│                    AgroMacro — Ecossistema                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📦 CAMADA DE DADOS                                          │
│  ├── data.js ............. Persistência (localStorage)       │
│  ├── seed-data.js ........ Dados iniciais de teste           │
│  └── app.js .............. Controller, navegação, config     │
│                                                              │
│  🐄 CAMADA DE PRODUÇÃO                                       │
│  ├── rebanho.js .......... Cadastro individual/lote          │
│  ├── cabecas.js .......... Ficha individual do animal        │
│  ├── lotes.js ............ Gestão de lotes (CENTRAL!)        │
│  │   ├── Nutrição (sal, ração, previsão consumo)             │
│  │   ├── Troca de pasto                                      │
│  │   ├── Juntar lotes                                        │
│  │   ├── Abastecer cocho                                     │
│  │   ├── calcGMD() ........ Ganho Médio Diário               │
│  │   ├── calcCustoNutricao() .... Custo acumulado            │
│  │   └── calcCustoTotalLote() ... CUSTO TOTAL DO LOTE        │
│  ├── manejo.js ........... Vacinas, vermífugos, GTA          │
│  ├── nutricao.js ......... Leitura de cocho (escores 0-4)    │
│  ├── balanca.js .......... Pesagens (entrada/saída)          │
│  └── pastos.js + pasto-mgmt.js . Gestão de pastagens        │
│                                                              │
│  💰 CAMADA FINANCEIRA                                        │
│  ├── financeiro.js ....... Compra/Venda + DRE                │
│  ├── contas.js ........... Contas a pagar, preço @, rebanho  │
│  ├── indicadores.js ...... KPIs (10 indicadores!)            │
│  │   ├── 1. Custo/Cabeça/Dia                                 │
│  │   ├── 2. Custo/@ Produzida                                │
│  │   ├── 3. Margem/@                                         │
│  │   ├── 4. Ponto de Equilíbrio                              │
│  │   ├── 5. GMD Automático                                   │
│  │   ├── 6. Conversão Alimentar                              │
│  │   ├── 7. Previsão de Abate                                │
│  │   ├── 8. Dias de Cocho                                    │
│  │   ├── 9. Projeção de Receita                              │
│  │   └── 10. Custo por Lote (breakdown)                      │
│  └── estoque.js .......... Insumos (ração, remédios, obras)  │
│                                                              │
│  🧬 CAMADA CIENTÍFICA                                        │
│  ├── genetica.js ......... Consultor Genético + Acasalamento │
│  └── touros-catalogo.js .. Catálogo 14 touros, 6 raças      │
│                                                              │
│  🏗️ CAMADA DE INFRAESTRUTURA                                 │
│  ├── obras.js ............ Construções (usa funcionários)     │
│  ├── funcionarios.js ..... Cadastro de trabalhadores         │
│  └── clima.js ............ Pluviometria                      │
│                                                              │
│  📊 CAMADA DE UX/RELATÓRIOS                                  │
│  ├── relatorio.js ........ PDF / Relatórios                  │
│  ├── graficos.js ......... Gráficos                          │
│  ├── calendario.js ....... Calendário sanitário              │
│  ├── rastreabilidade.js .. SISBOV/GTA                        │
│  ├── blockchain.js ....... Passaporte blockchain             │
│  └── icons.js ............ Sistema de ícones SVG             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.2. Fluxo Financeiro — Como o Custo Chega ao Animal

```
COMPRA do Gado (financeiro.js → COMPRA event)
    ↓
LOTE criado (lotes.js → LOTE event)
    ↓
┌─────────────────────────────────────────────────┐
│  CUSTOS ACUMULADOS DO LOTE (calcCustoTotalLote) │
│                                                 │
│  1. custoCompra ═══════ valor pago pelo gado    │
│  2. custoNutricao ═════ sal + ração × dias      │
│  3. custoManejo ═══════ vacinas, vermífugos     │
│  4. custoInsumos ══════ abastecimentos alocados │
│                                                 │
│  → custoTotal = soma(1+2+3+4)                   │
│  → custoPorCab = custoTotal / qtdAnimais        │
│  → custoPorArroba = custoTotal / arrobasProduz  │
│                                                 │
│  ARROBAS PRODUZIDAS = (ganhoTotal × qtd) / 15   │
│  ganhoTotal = calcGMD() → gmd × dias × qtd      │
└─────────────────────────────────────────────────┘
    ↓
VENDA do Gado (financeiro.js → VENDA event)
    ↓
RESULTADO = receitaVenda - custoTotal
```

**Fontes de custo FORA do lote que impactam o lucro:**

| Fonte | Módulo | Impacto |
|-------|--------|---------|
| Funcionários | funcionarios.js | Diária × dias trabalhados |
| Obras | obras.js | Material (estoque) + mão de obra |
| Contas a Pagar | contas.js | Custos fixos (energia, água, arrendamento) |

### 1.3. Fluxo do Estoque → Nutrição → Custo

```
estoque.js (ESTOQUE_ENTRADA) → preço/kg registrado
    ↓
lotes.js (save) → lote recebe salMineral e/ou ração com consumo/dia
    ↓
calcCustoNutricao(lote):
    → busca preço unitário no estoque (ESTOQUE_ENTRADA)
    → consumoDiario × preçoUnit × diasNoLote = custoAcumulado
    ↓
calcCustoTotalLote(lote):
    → soma custoNutricao + custoCompra + custoManejo + custoInsumos
```

---

## PARTE 2: GENÉTICA E GENÔMICA — ESTUDO COMPLETO

### 2.1. O que são DEPs (Diferença Esperada na Progênie)

DEPs são estimativas do valor genético de um animal, expressas em unidades da característica.
Exemplo: se um touro tem DEP P210 = +12 kg, significa que os filhos dele, em média,
nascerão 12 kg mais pesados aos 210 dias do que a média da raça.

**DEPs principais para gado de corte:**

| Sigla | Nome | O que mede | Por que importa |
|-------|------|-----------|-----------------|
| PN | Peso ao Nascer | Facilidade de parto | PN alto = parto difícil. Ideal: negativo ou próximo de zero |
| P120 | Peso Direto Desmama | Genética direta do bezerro | Quanto ele cresce por conta própria |
| P210 | Peso Desmama | Peso aos 210 dias | Inclui efeito materno + direto |
| MP210 | Habilidade Materna | Leite e cuidado da mãe | Alto = vaca que cria bezerro pesado |
| P365 | Peso ao Ano | Crescimento pós-desmama | Mede recria |
| P450 | Peso Sobreano | Peso aos 450 dias | Engorda e confinamento |
| GPD | Ganho Peso Diário | Gramas/dia de ganho genético | Eficiência de engorda |
| PE | Perímetro Escrotal | Precocidade sexual | Alto = touro fértil mais jovem |
| IPP | Idade 1º Parto | Precocidade reprodutiva | Negativo = pare mais cedo |
| AOL | Área Olho de Lombo | Músculo no lombo (cm²) | Mais AOL = mais carne no bife |
| EGS | Espessura Gordura | Gordura subcutânea (mm) | Acabamento de carcaça |
| MS | Marmoreio | Gordura intramuscular | Maciez e sabor da carne |
| PAC | Peso Adulto Contemporâneo | Tamanho adulto | Container do animal |
| P3P | Prob. Parto 3ª Cria | Permanência no rebanho | Longevidade da vaca |

### 2.2. DECA (Decil Classificatório ABCZ)

O DECA divide os animais em 10 faixas de classificação:

| DECA | Percentil | Significado |
|------|-----------|-------------|
| 1 | Top 10% | Elite genética |
| 2 | 10-20% | Muito bom |
| 3 | 20-30% | Bom |
| 4 | 30-40% | Acima da média |
| 5 | 40-50% | Médio superior |
| 6 | 50-60% | Médio |
| 7 | 60-70% | Abaixo da média |
| 8 | 70-80% | Fraco |
| 9 | 80-90% | Muito fraco |
| 10 | 90-100% | Inferior |

### 2.3. iABCZ vs MGTe — Os Dois Índices

| Índice | Programa | O que mede |
|--------|----------|-----------|
| **iABCZ** | PMGZ (ABCZ) | Índice total que combina DEPs de crescimento + reprodução. Quanto maior, melhor |
| **MGTe** | ANCP (Geneplus) | Mérito Genético Total econômico. Peso com valor econômico de cada DEP |

### 2.4. Seleção Genômica — Além das DEPs Tradicionais

A seleção genômica é a revolução da pecuária moderna:

**Como funciona:**
1. Coleta de amostra biológica (pelo, sangue, sêmen)
2. Extração do DNA
3. Genotipagem usando SNP chip (50K = 50.000 marcadores)
4. Cada SNP é uma variação em UMA base do DNA (A, T, C ou G)
5. O chip "lê" quais variantes o animal carrega
6. Algoritmo calcula GEBV (Genomic Estimated Breeding Value)

**SNP Chip Bovino:**
- Placa com ~50.000 pontos microscópicos
- Cada ponto detecta uma variação genética
- Resultado: perfil genômico completo do animal
- Permite prever mérito genético ANTES de medir desempenho

**Vantagens da Genômica:**
- Prediz valor genético ao NASCER (sem esperar progênie)
- Acurácia >70% vs ~30% da DEP parental
- Identifica genes para eficiência alimentar, resistência a carrapato
- Permite seleção para maciez, marmoreio, longevidade
- Controla consanguinidade pelo DNA real (não só pelo pedigree)

### 2.5. Consanguinidade — O Perigo Silencioso

**O que é:** Acasalamento entre animais com ancestrais em comum.

**Coeficiente de Endogamia (F):**
- F = probabilidade de homozigose idêntica por descendência
- F do filho = metade do parentesco entre os pais

**Graus de parentesco e risco:**

| Relação | Genes em Comum | F do Filho | Risco |
|---------|---------------|-----------|-------|
| Pai × Filha | 50% | 25% | ❌ EXTREMO |
| Meio-irmão × Meia-irmã | 25% | 12.5% | ❌ ALTO |
| Avô × Neta | 25% | 12.5% | ❌ ALTO |
| Primos 1º grau | 12.5% | 6.25% | ⚠️ LIMITE |
| Primos 2º grau | 6.25% | 3.125% | 🟡 ACEITÁVEL |
| Sem parentesco comum | 0% | 0% | ✅ IDEAL |

**Regra de ouro:** F > 6.25% = NÃO ACASALAR!

**Efeitos da depressão consanguínea (a cada 10% de F):**
- Perda de 25-100 kg de leite por lactação
- Aumento de mortalidade embrionária
- Redução do peso ao nascer
- Menor fertilidade (mais serviços/concepção)
- Aumento do intervalo entre partos
- Maior susceptibilidade a doenças
- Redução do vigor geral

**Fórmula para verificar 3 gerações:**
```
Pai da vaca == Touro? → F = 25% → BLOQUEIO
Avô da vaca == Touro? → F = 12.5% → BLOQUEIO
Bisavô da vaca == Touro? → F = 6.25% → ALERTA
Pai do touro == Pai da vaca? → F = 12.5% → BLOQUEIO
Mãe do touro == Mãe da vaca? → F = 12.5% → ALERTA
```

### 2.6. Acasalamento Dirigido — Estratégias

**Compensatório (o mais usado):**
- Identificar pontos fracos da vaca (DEPs baixas)
- Buscar touro forte exatamente nesses pontos
- Resultado: filho "corrigido" — pega o melhor de cada um

**Complementar:**
- Vaca boa de cria (alta MP210, boa fertilidade)
- Touro forte de engorda (alto AOL, EGS, P450)
- Resultado: equilíbrio entre maternidade e carcaça

**Cruzamento Industrial:**
- Base zebuína (Nelore) × taurino (Angus)
- Explora HETEROSE (vigor híbrido)
- F1 = 100% de heterose = ganho máximo

### 2.7. Heterose — O Poder do Cruzamento

**O que é:** Superioridade do mestiço sobre a média dos pais.
Quanto mais distantes geneticamente (zebu × taurino), maior a heterose.

**Ganhos comprovados do F1 Nelore × Angus:**

| Característica | Ganho F1 vs Nelore Puro |
|---------------|------------------------|
| Peso aos 365 dias | +25.9 kg |
| Peso aos 550 dias | +34.8 kg |
| Velocidade de crescimento | +15% |
| GPD em confinamento | +10-20% |
| Precocidade de acabamento | -4 meses |
| Habilidade materna (F1 fêmea) | Significativamente superior |
| Marmoreio | Visivelmente superior |
| Mérito de carcaça | +0.7% |

**Rendimento de carcaça por genotype:**

| Genótipo | GPD Pasto (kg/dia) | GPD Confin (kg/dia) | Rendimento Carcaça |
|----------|-------------------|--------------------|--------------------|
| Nelore puro | 0.4-0.8 | 1.15-1.42 | 50-55% |
| F1 Angus×Nelore | 0.46-0.80 | 1.28-1.44 | 53-58% |
| Angus puro | 0.7-1.0 | 1.4-1.6 | 58-62% |

---

## PARTE 3: DADOS DE MERCADO — FEVEREIRO 2026

### 3.1. Preço da Arroba do Boi Gordo

| Praça | À Vista | A Prazo | Tendência |
|-------|---------|---------|-----------|
| **São Paulo** | R$ 336-342 | R$ 340-350 | 📈 Alta |
| **Minas Gerais** | R$ 311-332 | R$ 315-332 | 📈 Alta |
| **Bahia** (Feira Santana) | R$ 306-330 | R$ 310-330 | 📈 Alta +3.13% |
| **Cepea/Esalq** | R$ 341.90 | — | 📈 Alta |
| **Boi-China (SP)** | R$ 342 | — | 📈 Premium |

### 3.2. Preço do Bezerro

| Praça | Preço Médio | Observação |
|-------|------------|------------|
| São Paulo | R$ 3.334,08 | Em alta > boi gordo |
| Minas Gerais | R$ 3.200,07 | Valorização acumulada |
| Mato Grosso Sul | R$ 3.159,04 | Cepea/Esalq |

### 3.3. Preço da Vaca Gorda

| Praça | À Vista | A Prazo |
|-------|---------|---------|
| São Paulo | R$ 311-315/@ | R$ 315+ |
| Minas Gerais | R$ 294-301/@ | R$ 301+ |
| Bahia | R$ 281-286/@ | R$ 286+ |

### 3.4. Custo de Confinamento

| Indicador | Valor | Fonte |
|-----------|-------|-------|
| Custo/@ produzida (SP - média) | R$ 269 | Canal Rural |
| Custo/@ produzida (SP - grande) | R$ 261 | Canal Rural |
| Custo/@ produzida (GO) | R$ 236 | Canal Rural |
| Margem de lucro (média BR) | ~15% | AgFeed |
| Margem de lucro (PR) | ~19.6% | AgFeed |
| Alimentação (% do custo total) | 70-85% | Referência |

### 3.5. Índices Zootécnicos de Referência

| Indicador | Nelore Pasto | Nelore Confin | F1 Confin |
|-----------|-------------|---------------|-----------|
| GPD (kg/dia) | 0.4-0.8 | 1.15-1.42 | 1.28-1.44 |
| Rendimento carcaça | 50-55% | 52-55% | 53-58% |
| Conversão alimentar | — | 6-8 kg MS/kg PV | 5-7 kg MS/kg PV |
| Dias de cocho (ideal) | — | 90-120 | 70-100 |
| Peso abate (ideal) | 18@+ | 20-22@ | 18-20@ |

---

## PARTE 4: LÓGICA DO MASCOTE IA — ALERTAS PROATIVOS

### 4.1. Alertas de Custo × Genética

```javascript
// LÓGICA: Se custo ração subiu E GPD genético é baixo → alerta vermelho
SE (custoNutricao/dia SUBIU >10% no último mês)
  E (DEP.GPD do touro usado no lote < 30 g/dia)
  → ALERTA: "⚠️ Custo de ração subiu mas o lote tem genética de baixo ganho.
     Considerar trocar genética ou reduzir dias de cocho."

// LÓGICA: Lote com GMD real abaixo da DEP genética
SE (calcGMD(lote).gmd < DEP.GPD do touro × 0.6)
  → ALERTA: "🔴 Lote {nome} está ganhando peso 40% abaixo do potencial genético.
     Verificar: nutrição, sanidade, estresse térmico."

// LÓGICA: Custo/@ produzida acima do mercado
SE (custoPorArroba > precoArroba × 0.85)
  → ALERTA: "⚠️ Custo de produção está comendo a margem! Custo/@ = R${custo},
     preço venda esperado = R${preco}. Margem < 15%."
```

### 4.2. Alertas de Estoque e Nutrição

```javascript
// LÓGICA: Nutrição vai acabar
SE (calcDuracaoNutricao(lote).diasPrevistos < 7)
  → ALERTA: "🔴 Ração do lote {nome} acaba em {dias} dias! Abastecer urgente."

// LÓGICA: Leitura de cocho ruim
SE (ultimaLeitura.nota >= 3 por 2 dias seguidos)
  → ALERTA: "⚠️ Sobra excessiva no cocho do {lote}. Reduzir trato em {ajuste}."

// LÓGICA: Estoque de vacina baixo
SE (estoqueVacina < nº cabeças no rebanho)
  → ALERTA: "⚠️ Vacina Aftosa: {estoque} doses disponíveis para {cabeças} animais."
```

### 4.3. Alertas de Mercado

```javascript
// LÓGICA: Arroba subiu — hora de vender lotes prontos
SE (precoArroba SUBIU >5% na semana)
  E (existem lotes com peso >= 18@)
  → ALERTA: "💰 Arroba subiu pra R${preco}! Lote {nome} com {peso}@ está pronto.
     Projeção: receita de R${receita} com margem de {margem}%."

// LÓGICA: Bezerro caro — segurar fêmeas
SE (precoBezerro > R$ 3.200)
  → ALERTA: "📈 Bezerro a R${preco}! Considerar reter novilhas pra reposição
     em vez de comprar. Genética interna pode ser mais barata."
```

### 4.4. Alertas Genéticos

```javascript
// LÓGICA: Consanguinidade detectada
SE (verificarParentesco(vaca, touro).coeficiente > 6.25%)
  → BLOQUEIO: "🚫 CONSANGUINIDADE! {vaca} e {touro} têm parentesco de {grau}.
     Coeficiente F = {F}%. NÃO ACASALAR."

// LÓGICA: Vaca sem touro compensatório
SE (vaca.pontosFracos.length > 2)
  E (nenhumTouro compensa todos os pontos)
  → ALERTA: "⚠️ {vaca} tem {n} pontos fracos sem correção no catálogo.
     Considerar buscar touro específico para: {fracos}."
```

### 4.5. Alertas Sanitários (Calendário)

```javascript
// LÓGICA: Vacinação próxima
SE (proximaVacinacao < 15 dias)
  → ALERTA: "📅 Vacinação de {tipo} em {dias} dias! {cabeças} animais.
     Estoque atual: {doses} doses."

// LÓGICA: GTA vencendo
SE (GTAValidade < 30 dias)
  → ALERTA: "📋 GTA do lote {nome} vence em {dias} dias. Renovar no SISBOV."
```

---

## PARTE 5: RAÇAS NO CATÁLOGO — REFERÊNCIA RÁPIDA

### 5.1. Nelore (5 touros no catálogo)
- **Origem:** Índia (Ongole) — adaptado ao Brasil
- **Vantagens:** Rusticidade, resistência a ectoparasitas, fertilidade em ambiente tropical
- **Peso adulto:** Touros 800-1000 kg / Vacas 450-550 kg
- **GPD pasto:** 0.4-0.8 kg/dia | **Confin:** 1.15-1.42 kg/dia
- **RC:** 50-55%
- **Programas:** PMGZ/ABCZ, ANCP/Geneplus
- **Selo:** Base do rebanho brasileiro (>80% do rebanho de corte)

### 5.2. Angus (2 touros)
- **Origem:** Escócia — raça taurina
- **Vantagens:** Precocidade, marmoreio, maciez, rendimento de carcaça
- **GPD confin:** 1.4-1.6 kg/dia
- **RC:** 58-62%
- **Uso no Brasil:** Cruzamento industrial com Nelore → F1 premium
- **Bonificação frigorífico:** Sim, carne certificada Angus paga prêmio

### 5.3. Brahman (1 touro)
- **Origem:** EUA (seleção de zebuínos indianos)
- **Vantagens:** Rusticidade extrema, adaptação ao calor e umidade
- **Uso:** Regiões difíceis (Pantanal, Norte, Nordeste)
- **Selo:** Rústico

### 5.4. Guzerá (2 touros)
- **Origem:** Índia (Gujarat/Rajasthan) — raça zebuína
- **Aptidão:** DUPLA — Corte + Leite
- **Peso adulto:** Touros 800-1000 kg / Vacas 500-600 kg
- **Leite:** 3.000-4.000 litros/lactação
- **Vantagem principal:** Habilidade materna excepcional (MP210 alto)
- **Uso estratégico:** Vaca Guzerá × touro Nelore ou Angus = F1 com leite
- **Programas:** PMGZ/ABCZ, Embrapa (TDTJ), CBMG
- **Centrais:** CRV, Central Bela Vista, 3A Genética

### 5.5. Tabapuã (2 touros)
- **Origem:** Brasil (seleção nacional Guzerá/Nelore)
- **Aptidão:** Corte (mocho, dócil, precoce)
- **Peso adulto:** Touros 900-1200 kg / Vacas 500-650 kg
- **Vantagens:** Precocidade, docilidade, musculatura, mocho natural
- **GPD:** Similar ao Nelore, com melhor docilidade
- **Programas:** PMGZ/ABCZ, ANCP
- **Centrais:** ABS Pecplan, CRV, 3A, Alta, Semex

### 5.6. Sindi (2 touros)
- **Origem:** Índia (região de Sindh) — raça de porte médio
- **Aptidão:** DUPLA — Corte + Leite (foco semiárido)
- **Peso desmama:** Machos ~160 kg / Fêmeas ~148 kg
- **Peso sobreano:** Machos ~303 kg / Fêmeas ~244 kg
- **Leite:** 1.500-2.500 litros/lactação (alto teor gordura 5%+)
- **Vantagem principal:** RUSTICIDADE EXTREMA — sobrevive em semiárido
- **Programas:** PMGZ/ABCZ (corte e leite)
- **Uso:** Nordeste, semiárido, propriedades com pouca água/pasto

---

## PARTE 6: FÓRMULAS E CONSTANTES PARA A IA

### 6.1. Conversões Essenciais

```
1 arroba = 15 kg (peso vivo)
1 arroba = 30 kg (peso vivo total / para cálculo de rendimento)
Rendimento Carcaça = peso carcaça / peso vivo × 100
Arrobas em pé = peso vivo / 30
Arrobas de ganho = (peso atual - peso entrada) / 30
```

### 6.2. Fórmulas Financeiras

```
Custo/Cab/Dia = (custoNutricao + custoManejo + custoInsumos) / qtdAnimais / diasNoLote
Custo/@Prod = custoTotal / arrobasProduzidas
Margem/@ = preçoVenda/@ - custo/@Prod
Ponto Equilíbrio = custosFixosTotais / margem/@
Valor Rebanho em Pé = totalCabeças × pesoMédio / 30 × preço/@
```

### 6.3. Fórmulas Zootécnicas

```
GMD = (pesoAtual - pesoEntrada) / diasNoLote (kg/dia)
Conversão Alimentar = kgRaçãoConsumida / kgGanhoPeso
Previsão Abate = (pesoAlvo - pesoAtual) / GMD (dias)
Eficiência Nutricional = GMD / consumoMS × 100
```

### 6.4. Fórmulas Genéticas

```
DEP média do filho = (DEP_pai + DEP_mae) / 2
Coeficiente Endogamia F = parentesco(pai,mae) / 2
Parentesco diminui 50% a cada geração
Heterose F1 = 100% (máxima no primeiro cruzamento)
Heterose F2 = 50% (cai pela metade)
Heterose retrocruzamento = 50%
```

---

## PARTE 7: PREPARAÇÃO MULTI-FAZENDA

### 7.1. Arquitetura Proposta

```javascript
// Cada fazenda tem seu namespace no localStorage
window.agromacro = {
    fazendaAtual: 'fazenda_thiago_704',
    fazendas: {
        'fazenda_thiago_704': {
            nome: 'Fazenda Thiago 704',
            dono: 'Thiago',
            localidade: 'Vitória da Conquista - BA',
            events: [...],
            config: {...}
        },
        'fazenda_cliente_002': {
            nome: 'Fazenda Dois Irmãos',
            dono: 'João Cliente',
            localidade: 'Itapetinga - BA',
            events: [...],
            config: {...}
        }
    }
};

// data.js modificado para usar namespace
window.data.save = function () {
    var key = 'agromacro_' + window.agromacro.fazendaAtual;
    localStorage.setItem(key, JSON.stringify(window.data.events));
};
```

### 7.2. Benefícios Multi-Fazenda

- Cada cliente tem dados isolados
- Um app, múltiplos rebanhos
- Exportação individual por fazenda
- Comparativo entre fazendas (benchmarking)
- Preparação para venda como SaaS

---

## PARTE 8: GLOSSÁRIO AGRO (Pro Mascote explicar)

| Termo | Explicação do Capataz |
|-------|----------------------|
| **Arroba (@)** | Unidade de peso: 15 kg de peso vivo ou 30 kg de boi inteiro. É assim que se negocia gado |
| **GMD** | Quanto o boi ganha de peso por dia. Bom GMD em pasto = 0.6 kg/dia. No cocho = 1.2+ kg/dia |
| **Desmama** | Separar o bezerro da vaca com 7-8 meses (~210 dias) |
| **Sobreano** | Animal entre desmama e 18 meses. Fase de recria |
| **Novilha** | Fêmea jovem, antes do primeiro parto |
| **Multípara** | Vaca que já pariu mais de uma vez. Mais segura pra touro pesado |
| **F1** | Primeira geração de cruzamento. 50% de cada raça. Máxima heterose |
| **Heterose** | Vigor híbrido. O mestiço é melhor que a média dos pais |
| **Acabamento** | Gordura na carcaça. 3-6mm é ideal pra frigorífico |
| **Marmoreio** | Gordura DENTRO do músculo. Faz a carne macia e saborosa |
| **AOL** | Área do olho de lombo. Medida do "bife". Quanto maior, mais carne |
| **EGS** | Espessura de gordura subcutânea. Proteção da carcaça no resfriamento |
| **Mocho** | Animal sem chifre naturalmente. Menos acidente no curral |
| **SISBOV** | Sistema Brasileiro de Identificação e Certificação de Bovinos |
| **GTA** | Guia de Trânsito Animal. Documento obrigatório pra transportar gado |
| **IATF** | Inseminação Artificial em Tempo Fixo. Sincroniza o cio das vacas |
| **Repasse** | Touro que cobre as vacas que não emprenaram na IA |
| **Ciclo Completo** | Fazenda que faz cria + recria + engorda. Produz da vaca ao boi gordo |

---

> **Este documento é a "memória" da IA do AgroMacro.**
> Toda decisão do Mascote deve ser baseada nos dados aqui + nos dados do app.
> Atualizar com novos preços de mercado a cada trimestre.
