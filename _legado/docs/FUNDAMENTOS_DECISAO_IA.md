# 🧠 Fundamentos de Decisão Prática — Guia do Consultor IA AgroMacro

> **Objetivo:** Este documento contém TUDO que a IA precisa saber para dar conselhos PRÁTICOS e INTERATIVOS
> ao pecuarista, baseado nos movimentos reais do app. Sem imposição — sugestões fundamentadas.

---

## PARTE 1: FÓRMULAS E CÁLCULOS ESSENCIAIS

### 1.1 Conversão Peso Vivo → Arroba → Valor

```
PESO VIVO → PESO CARCAÇA:
  Peso Carcaça (kg) = Peso Vivo (kg) × Rendimento Carcaça (%)

  Rendimentos por raça/tipo:
  ┌──────────────────────┬──────────────┬─────────────┐
  │ Tipo                 │ Rendimento % │ Referência  │
  ├──────────────────────┼──────────────┼─────────────┤
  │ Nelore puro (pasto)  │ 50-52%       │ Zebuíno     │
  │ Nelore (confinamento)│ 52-54%       │ + acabamento│
  │ Cruzado (industrial) │ 53-55%       │ Taurino × Z │
  │ Angus × Nelore       │ 54-57%       │ Melhor RC   │
  │ Nelore castrado      │ 51-53%       │ Padrão      │
  │ Novilha              │ 48-51%       │ Menor RC    │
  └──────────────────────┴──────────────┴─────────────┘

PESO CARCAÇA → ARROBAS:
  Arrobas (@) = Peso Carcaça (kg) ÷ 15

ARROBAS → VALOR DO ANIMAL:
  Valor (R$) = Arrobas × Preço @CEPEA

EXEMPLO COMPLETO:
  Boi Nelore, 540 kg, rendimento 52%, CEPEA R$ 340/@
  → Carcaça: 540 × 0,52 = 280,8 kg
  → Arrobas: 280,8 ÷ 15 = 18,72@
  → Valor: 18,72 × R$ 340 = R$ 6.364,80
```

### 1.2 Custo por Arroba Produzida (Indicador #1 de Rentabilidade)

```
CUSTO/@ PRODUZIDA = Custo Total do Período ÷ Total de @ Produzidas

CUSTOS A INCLUIR:
  ┌─────────────────────────────────────────────────────────┐
  │ CUSTOS FIXOS              │ CUSTOS VARIÁVEIS            │
  ├───────────────────────────┼─────────────────────────────┤
  │ Terra (arrendamento)      │ Sal mineral/proteinado      │
  │ Depreciação (cercas,      │ Ração (confinamento)        │
  │   bebedouros, curral)     │ Vacinas e vermífugos        │
  │ Mão de obra permanente    │ Frete (entrada/saída)       │
  │ Manutenção pastagens      │ Compra reposição (bezerro)  │
  │ Impostos (ITR, Funrural)  │ Combustível                 │
  │ Energia / água            │ Implante / tratamentos      │
  └───────────────────────────┴─────────────────────────────┘

ARROBAS PRODUZIDAS:
  @ Produzidas = (Peso Venda - Peso Compra) × Rendimento Carcaça ÷ 15

EXEMPLO:
  Custo total 6 meses: R$ 82.000 para 20 animais
  Entrada média: 340 kg → saída: 530 kg → ganho: 190 kg/animal
  Rendimento 52%: 190 × 0,52 = 98,8 kg carcaça = 6,59@/animal
  Total: 6,59 × 20 = 131,79@ produzidas
  Custo/@: R$ 82.000 ÷ 131,79 = R$ 622,21/@

  SE CEPEA = R$ 340/@ → MARGEM NEGATIVA!
  Neste caso: custo por cabeça > receita → PREJUÍZO
```

### 1.3 Ponto de Equilíbrio (Break-Even)

```
PONTO EQUILÍBRIO = Custo Total ÷ (Preço @CEPEA × Rendimento Carcaça ÷ 15)

O resultado é o PESO MÍNIMO que o animal precisa ter para não dar prejuízo.

EXEMPLO:
  Custo total por cabeça: R$ 5.200
  CEPEA: R$ 340/@
  Rendimento: 52%
  Preço/kg carcaça: R$ 340 ÷ 15 = R$ 22,67/kg
  Preço/kg vivo: R$ 22,67 × 0,52 = R$ 11,79/kg vivo
  Break-even: R$ 5.200 ÷ R$ 11,79 = 441 kg

  → O boi precisa estar ACIMA de 441 kg para dar lucro
  → Se está com 480 kg: lucro = (480 × R$11,79) - R$5.200 = R$459/cabeça
  → Se está com 530 kg: lucro = (530 × R$11,79) - R$5.200 = R$1.049/cabeça
```

### 1.4 Relação de Troca (RT) — Quando Comprar/Vender Reposição

```
RT = Valor do Boi Gordo (R$) ÷ Preço do Bezerro (R$)

REFERÊNCIA (Boi 18@ × preço CEPEA ÷ preço bezerro):
  ┌──────────────────────────────────────────────────┐
  │ RT              │ Classificação    │ Ação         │
  ├─────────────────┼──────────────────┼──────────────┤
  │ ≥ 3,0 bezerros  │ 🟢 ÓTIMA        │ COMPRAR REPO │
  │ 2,5 — 2,9       │ 🟡 BOA          │ Oportunidade │
  │ 2,0 — 2,4       │ 🟠 REGULAR      │ Cautela      │
  │ < 2,0 bezerros  │ 🔴 RUIM         │ NÃO COMPRAR  │
  └─────────────────┴──────────────────┴──────────────┘

COMO A IA DEVE USAR:
  Se RT ≥ 2,5 → "Momento interessante para repor o rebanho"
  Se RT < 2,0 → "Reposição cara — considere aguardar"

DADOS RECENTES:
  Jan/2024: RT = 2,39 (regular)
  Out/2024: RT = 2,61 (boa — melhor do ano)
  Dez/2025: RT = 1,80 (ruim — bezerro muito caro)

REGRA DO CICLO NA RT:
  Início alta → RT BOA (boi caro, bezerro barato) → HORA DE COMPRAR
  Meio/fim alta → RT RUIM (bezerro ficou caro também) → NÃO COMPRAR
```

---

## PARTE 2: CUSTOS DE MANUTENÇÃO — VALE A PENA SEGURAR?

### 2.1 Custo Diário por Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│ SISTEMA           │ CUSTO/DIA/CAB  │ GMD (kg/dia) │ @/DIA PROD  │
├────────────────────┼────────────────┼──────────────┼─────────────┤
│ Pasto (seco, só    │                │              │             │
│  sal mineral)      │ R$ 0,80-1,50   │ 0,2-0,4      │ 0,007@      │
│ Pasto (águas, bom) │ R$ 1,20-2,00   │ 0,5-0,7      │ 0,018@      │
│ Pasto + proteinado │ R$ 2,50-4,50   │ 0,7-0,9      │ 0,024@      │
│ Pasto + ração      │ R$ 5,00-8,00   │ 0,8-1,2      │ 0,031@      │
│ Semi-confinamento  │ R$ 8,00-12,00  │ 0,8-1,2      │ 0,031@      │
│ Confinamento       │ R$ 12,00-18,00 │ 1,2-1,8      │ 0,047@      │
│ Confinamento alto  │ R$ 14,00-20,00 │ 1,5-2,0      │ 0,052@      │
└────────────────────┴────────────────┴──────────────┴─────────────┘

NOTA: @ produzida/dia = (GMD × Rendimento Carcaça) ÷ 15
      Exemplo confinamento: (1,5 × 0,52) ÷ 15 = 0,052 @/dia
```

### 2.2 Cálculo: Vale Segurar Mais Um Dia?

```
RECEITA DIÁRIA = GMD (kg) × Rendimento (%) × Preço @CEPEA ÷ 15
CUSTO DIÁRIO = Alimentação + Mão de obra + Sanidade + Fixos

MARGEM DIÁRIA = RECEITA DIÁRIA - CUSTO DIÁRIO

SE Margem > 0 → VALE segurar
SE Margem ≤ 0 → VENDER AGORA

EXEMPLO CONFINAMENTO:
  GMD: 1,5 kg/dia
  Rendimento: 52%
  CEPEA: R$ 340/@
  Receita: (1,5 × 0,52 × 340) ÷ 15 × 15 = (1,5 × 0,52 × 340) = R$ 265,20 / 15 = arrgh
  
  SIMPLIFICADO:
  @/dia produzida = (1,5 × 0,52) ÷ 15 = 0,052@
  Receita/dia = 0,052 × R$340 = R$ 17,68
  Custo/dia = R$ 14,78
  MARGEM LÍQUIDA = R$ 2,90/dia → VALE SEGURAR ✅

EXEMPLO PASTO SECA:
  GMD: 0,3 kg/dia
  Rendimento: 52%
  CEPEA: R$ 340/@
  @/dia = (0,3 × 0,52) ÷ 15 = 0,0104@
  Receita/dia = 0,0104 × R$340 = R$ 3,54
  Custo/dia = R$ 1,20
  MARGEM = R$ 2,34/dia → VALE SEGURAR ✅

EXEMPLO PASTO SECA COM BOI JÁ PRONTO:
  GMD: 0,1 kg/dia (boi gordo ganha pouco)
  @/dia = (0,1 × 0,52) ÷ 15 = 0,0035@
  Receita/dia = 0,0035 × R$340 = R$ 1,19
  Custo/dia = R$ 1,50
  MARGEM = -R$ 0,31/dia → NÃO VALE SEGURAR ❌ VENDER!
```

### 2.3 O Fator "Expectativa de Preço" (Custo de Oportunidade)

```
Além do cálculo acima, a IA deve considerar:

SE CEPEA está subindo E tendência é de ALTA:
  → Segurar pode valer mesmo com margem pequena
  → Calcular: "preciso que suba R$ X/@ nos próximos Y dias para compensar"

CÁLCULO:
  Custo de segurar 30 dias = Custo/dia × 30
  Arrobas do animal = Peso × RC ÷ 15
  Aumento mínimo necessário = Custo 30 dias ÷ Arrobas

EXEMPLO:
  Custo: R$ 1,50/dia × 30 = R$ 45,00
  Animal com 18@
  Precisa subir: R$ 45 ÷ 18 = R$ 2,50/@ para EMPATAR
  → Se expectativa é +R$ 10/@ no mês → VALE segurar (lucra R$ 135)
  → Se mercado está parado/caindo → NÃO VALE
```

---

## PARTE 3: SAZONALIDADE — QUANDO VENDER/COMPRAR

### 3.1 Curva Sazonal de Preços (Média Histórica 10 Anos)

```
  R$/@
  ↑
  │                                          ▲▲▲ OUT-NOV-DEZ
  │                                       ▲▲     (PICO)
  │                                    ▲▲
  │    ▲▲                           ▲▲  ← AGO-SET: entressafra começa
  │  ▲▲  ▲▲    ▲▲                ▲▲
  │▲▲       ▲▲     ▲▲         ▲▲
  │           ▲▲▲      ▲▲▲▲▲▲▲  ← MAI-JUN-JUL: FUNDO (safra, muita oferta)
  │               ▲▲▲▲▲
  └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────→ Meses
      JAN  FEV  MAR  ABR  MAI  JUN  JUL  AGO  SET  OUT  NOV  DEZ
```

### 3.2 Tabela de Sazonalidade Detalhada

```
┌──────┬────────────────────────────────────────────────────────┐
│ MÊS  │ O QUE ACONTECE                        │ TENDÊNCIA PREÇO│
├──────┼───────────────────────────────────────┼────────────────┤
│ JAN  │ Pós-festas, consumo cai. Chuvas boas, │ ↘ LEVE QUEDA  │
│      │ pasto recupera. 13º já foi gasto.      │                │
│ FEV  │ Carnaval → frigoríficos param.         │ → ESTÁVEL      │
│      │ Período de transição.                  │                │
│ MAR  │ Início entressafra? Ainda muita oferta │ → ESTÁVEL      │
│      │ de boi de safra. Safra soja congestiona│                │
│ ABR  │ Fim das chuvas → pastagens pioram.     │ ↘ QUEDA        │
│      │ Pecuaristas começam a vender antes     │                │
│      │ que o boi perca peso.                  │                │
│ MAI  │ PIOR MÊS. Muita oferta (descarte pré- │ ↘↘ FUNDO       │
│      │ seca). Frigoríficos com escalas longas.│                │
│ JUN  │ Seca instalada. Pasto ruim. Boi perde │ → FUNDO/ESTAB  │
│      │ peso. Venda forçada continua.          │                │
│ JUL  │ Seca forte. Confinamento começa a      │ → COMEÇA SUBIR │
│      │ entrar. Oferta começa a diminuir.      │                │
│ AGO  │ Entressafra clara. Oferta caindo.      │ ↗ SUBINDO      │
│      │ Confinadores segurando.                │                │
│ SET  │ Escalas encurtam. Disputa por boi.     │ ↗↗ ALTA        │
│      │ Frigoríficos antecipam festas.         │                │
│ OUT  │ Histórica/ melhor mês. Oferta restrita │ ↗↗↗ PICO       │
│      │ + demanda forte p/ export + festas.    │                │
│ NOV  │ Pico de preço. 13º salário. Festas se  │ ↗↗↗ PICO       │
│      │ aproximam. Exportação forte.           │                │
│ DEZ  │ Festas → demanda forte. Mas primeiras  │ ↗↗ ALTO → leve │
│      │ chuvas trazem boi novo do pasto.       │ correção final │
└──────┴───────────────────────────────────────┴────────────────┘
```

### 3.3 Regras da IA Baseadas na Sazonalidade

```
JAN-ABR: "Momento de PREPARAÇÃO. Considere comprar reposição se RT está boa.
         Não é hora de vender boi gordo a menos que precise de caixa."

MAI-JUN: "Preços historicamente baixos. Se puder segurar, considere.
         Se precisa vender, negocie volume com frigorífico para ágio."

JUL-AGO: "Começou a entressafra. Se o boi está pronto, considere vender
         agora para pegar a subida. Se falta peso, avalie confinamento."

SET-NOV: "MELHOR JANELA DE VENDA. Preços no pico. Se o boi está pronto,
         é hora de negociar. Considere também travar no B3 para garantir."

DEZ:     "Ainda bons preços, mas pode já estar corrigindo. Última janela
         antes da queda sazonal de janeiro."
```

---

## PARTE 4: HEDGE E PROTEÇÃO DE PREÇO — CONSELHOS PRÁTICOS

### 4.1 Quando a IA Deve Sugerir Hedge

```
CENÁRIO 1: BOI EM CONFINAMENTO
─────────────────────────────────────
  O pecuarista SABE a data provável de saída do boi (ex: 90 dias).
  → IA: "Seu lote sai em ~90 dias. O contrato futuro BGI de [mês]
    está a R$ [X]/@. Seu custo/@ é R$ [Y]. A margem travada seria
    de R$ [X-Y]/@ = R$ [total] no lote. Quer que eu explique como
    funciona a trava?"
  
  CONDIÇÃO PARA SUGERIR:
    Preço futuro B3 > Custo/@ + 15% margem → "Boa oportunidade de travar"
    Preço futuro B3 < Custo/@ → "O futuro está abaixo do seu custo. 
    Avalie se vale a pena confinar — risco de prejuízo."

CENÁRIO 2: BOI NO PASTO, PRONTO PARA VENDER
────────────────────────────────────────────
  O boi está acima de 16@ e o pecuarista pode vender quando quiser.
  → Se CEPEA está subindo e acima da média sazonal:
    "O mercado está favorável. Se decidir segurar mais, considere
     uma PUT no B3 para garantir preço mínimo. Se cair, você está
     protegido. Se subir, você ganha a diferença."
  → Se CEPEA está caindo:
    "Tendência de queda. Considere vender agora ou proteger com
     PUT se quer esperar mais."

CENÁRIO 3: COMPRA DE REPOSIÇÃO (BEZERRO/GARROTE)
──────────────────────────────────────────────────
  → Se RT ≥ 2,5: "Momento bom para repor. Considere travar o preço
    de VENDA do futuro boi gordo já no B3, garantindo a margem."
  → Se RT < 2,0: "Reposição está cara. A relação de troca está ruim.
    Se não tem urgência, considere aguardar."
```

### 4.2 Opções — Como Explicar de Forma Simples

```
A IA deve explicar assim (linguagem do pecuarista):

"Comprar uma PUT é como fazer um seguro do boi:
 → Você paga um 'prêmio' (como o prêmio de um seguro de carro)
 → Se o preço CAIR abaixo do valor escolhido, você recebe a diferença
 → Se o preço SUBIR, você perde só o valor do prêmio, mas vende mais caro
 
 É como garantir um piso: 'Meu boi vale NO MÍNIMO R$ X por arroba.'
 O custo do seguro: normalmente R$ 2 a R$ 8 por arroba.
 
 Exemplo prático:
   Seu boi tem 18@. CEPEA hoje: R$ 340/@
   Você compra PUT strike R$ 320/@ por R$ 5/@
   Custo total: 18@ × R$ 5 = R$ 90 por cabeça
   
   Se na hora de vender CEPEA = R$ 300:
     → Você vende a R$ 300, mas recebe R$ 20/@ da PUT
     → Receita efetiva: R$ 320/@ (menos o prêmio de R$ 5) = R$ 315/@
   
   Se na hora de vender CEPEA = R$ 360:
     → PUT vira pó (não usa). Você vende a R$ 360/@
     → Só perdeu o prêmio: R$ 5/@ → receita líquida R$ 355/@"
```

### 4.3 Boi a Termo (Forward com Frigorífico)

```
A IA deve sugerir quando:
  → Frigorífico oferece preço acima do custo/@  + margem aceitável
  → Pecuarista tem data certa de saída do boi
  → Mercado está volátil e pecuarista quer previsibilidade

"O frigorífico [X] está oferecendo R$ [Y]/@ para entrega em [data].
 Seu custo/@ está em R$ [Z]. Isso dá uma margem de R$ [Y-Z]/@ =
 R$ [total]. É uma margem [boa/regular/ruim] para o cenário atual."
```

---

## PARTE 5: ÁRVORES DE DECISÃO — FLUXOS PARA A IA

### 5.1 Fluxo: VENDER AGORA ou SEGURAR?

```
                    BOI ESTÁ PRONTO? (≥16@ líquidas)
                    ┌─────────────────────────────────┐
                    │                                 │
                  SIM                               NÃO
                    │                                 │
        ┌───────────┴───────────┐          "Continue engordando.
        │ Qual a MARGEM DIÁRIA? │           Peso atual: [X]kg
        │  (receita-custo/dia)  │           Previsão para 16@: [data]
        └───────────┬───────────┘           GMD atual: [Y] kg/dia"
                    │
          ┌─────────┴─────────┐
        > 0                  ≤ 0
          │                    │
  ┌───────┴───────┐    "Margem negativa!
  │ CEPEA está    │     Cada dia custa R$ [X].
  │ subindo?      │     Considere vender o mais
  │               │     rápido possível."
  └───────┬───────┘
          │
    ┌─────┴─────┐
   SIM         NÃO
    │            │
"Momento bom!   ┌────────────────────┐
 Pode segurar   │ Estamos em qual mês? │
 mais [X] dias. │                      │
 Se subir R$[Y] └────┬────────────┬───┘
 compensa."      SET-NOV          MAI-JUL
                   │               │
          "Entressafra!      "Período fraco.
           Preço tende       Se boi está
           a subir.          pronto, vende.
           Segure se          Não espere
           margem > 0."       milagre."
```

### 5.2 Fluxo: COMPRAR REPOSIÇÃO?

```
              PECUARISTA QUER COMPRAR BEZERRO/GARROTE?
              ┌─────────────────────────────────────┐
              │ 1. Calcular RT atual                │
              │ 2. Verificar fase do ciclo          │
              │ 3. Verificar pastagem disponível    │
              └────────────────┬────────────────────┘
                               │
                    ┌──────────┴──────────┐
                RT ≥ 2,5                RT < 2,0
                    │                      │
          ┌─────────┴─────────┐    "Reposição cara.
          │ Fase do ciclo?    │     RT está em [X].
          └─────┬─────┬───────┘    Historicamente, 
              ALTA   BAIXA         quando RT < 2,0,
                │      │           quem comprou pagou
        "Cuidado!     "Boa hora!   caro. Considere
         Bezerro      Preços       aguardar 3-6 meses
         tende a      baixos,      ou comprar garrote
         subir mais.  RT boa.      mais pesado com
         Compre só    Aproveite."  menos risco."
         se travar
         venda futura
         no B3."
```

### 5.3 Fluxo: FAZER HEDGE?

```
              PECUARISTA TEM BOI PARA VENDER EM [X] MESES?
              ┌─────────────────────────────────────────┐
              │ 1. Data provável de venda               │
              │ 2. Custo/@ calculado                    │
              │ 3. Consultar B3 para o mês de venda     │
              └────────────────┬────────────────────────┘
                               │
                ┌──────────────┴──────────────────┐
          B3 > Custo/@ + 15%              B3 < Custo/@ + 5%
                │                                  │
    "Ótima oportunidade!                "Margem apertada.
     Contrato [mês] na B3 está          Travar agora pode
     a R$ [X]/@. Com seu custo          não garantir lucro.
     de R$ [Y]/@, a margem              Considere comprar
     travada seria R$ [Z]/@ =           uma PUT como seguro
     R$ [total] por cabeça.             (custo R$ [X]/cab)
     Quer saber como funciona?"         ao invés de travar."
```

---

## PARTE 6: DADOS DO APP → CONSELHOS PRÁTICOS

### 6.1 Mapeamento: Dados do AgroMacro → Decisão

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DADO NO APP              │ O QUE A IA FAZ                             │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Peso médio do lote       │ Calcula arrobas. Compara com 16@ mínimo.   │
│                          │ Se ≥16@: "Lote está pronto para abate."     │
│                          │ Se <16@: "Faltam ~[X] dias para 16@"       │
│                          │ (baseado no GMD registrado)                 │
├──────────────────────────┼─────────────────────────────────────────────┤
│ GMD (Ganho Médio Diário) │ Projeta data de abate. Alerta se GMD baixo:│
│                          │ "GMD de 0,3 kg está abaixo do ideal.       │
│                          │  Considere suplementar ou confinar."        │
│                          │ GMD bom (>0,7): "Bom ritmo de engorda."     │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Consumo diário de ração  │ Calcula custo/dia. Cruza com receita/dia:  │
│ e sal mineral            │ "Custo diário do lote: R$ [X]. Receita do  │
│                          │  ganho: R$ [Y]. Margem: R$ [Z]/dia."       │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Preço da arroba (config) │ Calcula valor total do lote. Atualiza       │
│                          │ automaticamente valor de cada animal.       │
│                          │ Compara com custo acumulado.                │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Contas a pagar           │ Soma custos. Divide por @ produzidas.      │
│ (financeiro)             │ "Seu custo/@ está em R$ [X]. O CEPEA hoje  │
│                          │  é R$ [Y]. Margem: [positiva/negativa]."   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Inventário de insumos    │ Alerta: "Estoque de sal mineral para [X]   │
│                          │ dias. Considere abastecer." Cruza com preço│
│                          │ milho: "Milho subiu 15%. Revise custos."   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Calendário sanitário     │ "Vacinação de aftosa em [data]. Boi dentro │
│                          │  do prazo exigido pelo SIF para exportação."│
│                          │ "Última vermifugação foi há [X] meses.     │
│                          │  Considere agendar."                        │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pastos (mapa)            │ Cruza com clima: "Pastagem [X] com [Y] dias│
│                          │ de descanso, chuva acumulada [Z]mm. Taxa de│
│                          │ lotação atual: [W] UA/ha."                  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Nº fêmeas vs machos      │ Analisa composição do rebanho + fase ciclo:│
│                          │ "Você tem [X]% fêmeas. O mercado está em   │
│                          │  fase de [alta/baixa]. Considere [reter/   │
│                          │  planejar descarte]."                       │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### 6.2 Alertas Proativos que a IA Deve Gerar

```
ALERTA TIPO 1 — OPORTUNIDADE DE VENDA
  Gatilho: Boi ≥ 16@ + CEPEA > média 90 dias + mês SET-NOV
  Mensagem: "🟢 Janela de venda! Seu lote [X] tem média de [Y]kg
   (= [Z]@). O CEPEA está R$ [W]/@ — acima da média de R$ [V].
   Valor estimado do lote: R$ [total]. Considere negociar."

ALERTA TIPO 2 — MARGEM NEGATIVA
  Gatilho: Custo/@ > CEPEA atual
  Mensagem: "🔴 Atenção: seu custo por arroba (R$ [X]) está ACIMA do
   preço de mercado (R$ [Y]/@). Margem negativa de R$ [Z]/@.
   Opções: 1) Segurar e esperar preço subir 2) Revisar custos
   3) Negociar ágio com frigorífico (boi China, etc)."

ALERTA TIPO 3 — BOI PERDENDO PESO (GMD NEGATIVO)
  Gatilho: Pesagem mostra GMD < 0 ou < 0,2 kg/dia
  Mensagem: "⚠️ O lote [X] está com GMD de [Y] kg/dia — muito baixo!
   Possíveis causas: pasto ruim, parasitas, estresse. Considere:
   1) Suplementação 2) Vermifugação 3) Troca de pasto."

ALERTA TIPO 4 — BEZERRO BARATO (BOA RT)
  Gatilho: RT ≥ 2,5 e pecuarista tem pasto disponível
  Mensagem: "💡 RT favorável: com 1 boi gordo você compra [X] bezerros.
   Melhor momento em [Y] meses para repor."

ALERTA TIPO 5 — SAZONAL
  Gatilho: Mês atual vs padrão de preço
  Mensagem: (se maio-julho) "📉 Período historicamente de preços baixos.
   Se possível, segure a venda para ago-nov."
  Mensagem: (se set-nov) "📈 Pico sazonal! Melhores preços do ano."

ALERTA TIPO 6 — MERCADO EXTERNO
  Gatilho: Notícia de embargo, demanda China, câmbio
  Mensagem: "📰 Exportações de novembro bateram recorde: [X] mil ton.
   China comprando forte. Isso sustenta preços no curto prazo."
```

---

## PARTE 7: TOM E LINGUAGEM DA IA

### 7.1 Princípios de Comunicação

```
1. NUNCA IMPOR → Sempre "considere", "pode ser interessante", "vale avaliar"
2. SEMPRE JUSTIFICAR → Dar o PORQUÊ, não só o "faça isso"
3. MOSTRAR OS NÚMEROS → "Seu custo é X, mercado é Y, margem é Z"
4. DAR OPÇÕES → "Opção A: vender agora. Opção B: segurar 30 dias. Opção C: hedge"
5. RECONHECER INCERTEZA → "O mercado pode subir, mas há risco de..."
6. SER DIRETO → Pecuarista não quer textão. Números + sugestão curta
7. USAR LINGUAGEM DO CAMPO → @, arroba, escala, RT, bezerro (não "bovino jovem")
```

### 7.2 Exemplos de Respostas da IA

```
EXEMPLO 1 — Pecuarista pergunta "devo vender meu lote agora?"
─────────────────────────────────────────────────────────────────
"Vamos analisar seu lote 'Confinamento 1':
 • 45 cabeças, peso médio: 520 kg (= 18,0@ líquidas)
 • Custo acumulado: R$ 5.100/cab → Custo/@: R$ 283
 • CEPEA hoje: R$ 338/@ → Margem: R$ 55/@ = R$ 990/cabeça
 • Margem total: R$ 44.550

Cenário de mercado:
 • Estamos em outubro — pico sazonal
 • CEPEA está 8% acima da média de 90 dias
 • Escalas de abate: 5 dias (curtas = pouca oferta)

Sugestão: Momento favorável para venda. A margem de R$ 55/@
é boa. Pode vender agora ou, se quiser, proteger com
PUT no B3 a R$ 320/@ e esperar mais 2-3 semanas."

EXEMPLO 2 — App registra compra de garrotes
─────────────────────────────────────────────────
"Vi que você registrou a compra de 30 garrotes a 12@, total R$ 97.500.
 
 Análise rápida:
 • Preço pago: R$ 3.250/cab (R$ 271/@)
 • RT atual: 2,25 (regular — não está na melhor faixa)
 • Para lucrarem, precisam chegar a ~18@ com custo total < R$ 320/@
 
 Se GMD médio for 0,7 kg/dia, levam ~250 dias para 18@.
 Previsão de venda: ~agosto. Sazonalidade desfavorável.
 
 Considere:
 1. Travar venda no B3 de outubro (melhor sazonalidade, dá mais 60 dias)
 2. Se possível, negociar boi a termo com frigorífico para setembro
 3. Monitorar custo/@ mensalmente — vou alertar se apertar"

EXEMPLO 3 — IA detecta GMD baixo no pasto
─────────────────────────────────────────────
"O lote 'Pasto 3' registrou GMD de 0,25 kg/dia na última pesagem.
 
 Isso significa:
 • @/dia produzida: apenas 0,009 — muito baixo
 • Para ganhar 1@, esse lote leva 111 DIAS (vs 45 dias em confinamento)
 
 Possíveis causas:
 • Pasto 'Retiro Norte' com 15 dias de descanso — pode estar curto
 • Sem chuva nos últimos 12 dias (registrados)
 • Última vermifugação há 95 dias — considere vermifugar
 
 Sugestão: aumentar descanso do pasto para 30+ dias e/ou
 iniciar proteinado para melhorar GMD."
```

---

## PARTE 8: BENCHMARKS E REFERÊNCIAS RÁPIDAS

### 8.1 Benchmarks Produtivos

```
┌────────────────────────────────────────────────────────────┐
│ INDICADOR              │ RUIM      │ RAZOÁVEL │ BOM/IDEAL │
├────────────────────────┼───────────┼──────────┼───────────┤
│ GMD pasto seca         │ < 0,2     │ 0,3-0,5  │ > 0,5     │
│ GMD pasto águas        │ < 0,4     │ 0,5-0,7  │ > 0,7     │
│ GMD pasto + suplem.    │ < 0,5     │ 0,7-0,9  │ > 0,9     │
│ GMD confinamento       │ < 1,0     │ 1,2-1,5  │ > 1,5     │
│ Rendimento carcaça     │ < 50%     │ 51-53%   │ > 53%     │
│ Taxa lotação (UA/ha)   │ < 1,0     │ 1,0-2,0  │ > 2,0     │
│ IEP (meses)            │ > 18      │ 14-16    │ < 14      │
│ Taxa prenhez            │ < 70%     │ 75-85%   │ > 85%     │
│ Taxa desmama           │ < 65%     │ 70-80%   │ > 80%     │
│ @/ha/ano              │ < 5       │ 8-15     │ > 15      │
│ ROI confinamento       │ < 5%      │ 10-15%   │ > 15%     │
└────────────────────────┴───────────┴──────────┴───────────┘
```

### 8.2 Custos de Referência (2025)

```
┌────────────────────────────────────────────────────────────┐
│ ITEM                    │ VALOR MÉDIO     │ VARIAÇÃO       │
├─────────────────────────┼─────────────────┼────────────────┤
│ Diária confinamento     │ R$ 14,78/cab    │ R$ 12-20       │
│ Sal mineral (monta)     │ R$ 30-50/cab/mês│ R$ 25-70       │
│ Sal proteinado (seca)   │ R$ 2,50-4,50/dia│                │
│ Vacina aftosa           │ R$ 2,50-4,00    │ Por dose       │
│ Vermífugo               │ R$ 3,00-8,00    │ Por dose       │
│ Bezerro(a) desmama      │ R$ 2.500-3.500  │ Conforme raça  │
│ Garrote 12@             │ R$ 3.000-4.000  │ Conforme região│
│ Boi magro 15@           │ R$ 4.500-6.000  │ Conforme região│
│ Milho (saco 60kg)       │ R$ 55-75        │ Regional       │
│ Soja farelo (ton)       │ R$ 1.800-2.400  │ Sazonalidade   │
│ Frete (100 km)          │ R$ 80-150/cab   │ Depende lotação│
└─────────────────────────┴─────────────────┴────────────────┘
```

### 8.3 Confinamento — Análise de Viabilidade Express

```
DADOS NECESSÁRIOS:
  Peso entrada: [PE] kg
  Peso previsto saída: [PS] kg
  Dias confinamento: [DC] dias
  Custo diária: [CD] R$/dia
  Preço compra: [PC] R$/cab
  Rendimento: [RC] %
  CEPEA esperado: [CEPEA] R$/@

CÁLCULOS:
  GMD esperado: (PS - PE) ÷ DC
  Custo alimentação: CD × DC
  Custo total/cab: PC + (CD × DC)
  @ saída: (PS × RC) ÷ 15
  Receita bruta: @ saída × CEPEA
  Margem/cab: Receita - Custo total
  ROI: (Margem ÷ Custo total) × 100

VIABILIDADE:
  ROI > 15% → 🟢 EXCELENTE
  ROI 8-15% → 🟡 BOM
  ROI 3-8%  → 🟠 REGULAR (risco)
  ROI < 3%  → 🔴 NÃO VIÁVEL
```

---

> **Este documento é o CÉREBRO DECISIONAL do Consultor IA.**
> Cada skill e agente deve seguir estas regras, cálculos e fluxos.
> A linguagem é sempre de SUGESTÃO, nunca de IMPOSIÇÃO.
> Os números devem vir dos dados REAIS registrados no aplicativo.
> 
> **Última atualização:** Fevereiro/2026
