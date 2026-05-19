# AgroMacro — Sistema de Gestão Pecuária

> **Gestão completa da fazenda na palma da mão.**
> Controle de rebanho, lotes, pastos, finanças, estoque de insumos, manejo sanitário e muito mais — tudo offline, direto no celular.

---

## 📋 Visão Geral

AgroMacro é um sistema web progressivo (PWA) para gestão de pecuária de corte, projetado para funcionar 100% offline. Todo dado é salvo no dispositivo via `localStorage`, sem necessidade de internet ou servidores.

### Stack Técnica
- **Frontend**: HTML5 + CSS3 + JavaScript puro (Vanilla)
- **Armazenamento**: LocalStorage (event-sourcing pattern)
- **Ícones**: SVG stroke-based system (30+ ícones profissionais)
- **Design**: Mobile-first, dark mode, agritech-inspired color palette
- **Servidor local**: `npx http-server` (desenvolvimento)

---

## 🎯 Módulos Implementados

### Rebanho
| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Cabeças Individuais** | Cadastro por brinco, nome, raça, peso, ficha individual, pesagem | ✅ Novo |
| **Cadastro de Rebanho** | Individual ou em lote, com sexo, raça, peso, observações | ✅ |
| **Gestão de Lotes** | Criação de lotes por categoria (cria/recria/engorda/matrizes/touros) | ✅ |
| **Cadastro de Pastos** | Tipo de capim, área, capacidade, status | ✅ |
| **Manejo Sanitário** | Vacinação, pesagem, movimentação, mortalidade, com dedução do estoque | ✅ |
| **Calendário Sanitário** | Agenda de vacinas e alertas de vencimento | ✅ |
| **Trocar Pasto** | Mover lote entre pastos | ✅ |
| **Juntar Lotes** | Fusão de lotes | ✅ |

### Financeiro
| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Compra de Gado** | Registro de entrada com peso em @ e valor | ✅ |
| **Venda de Gado** | Registro de saída com cálculo de lucro | ✅ |
| **Fluxo de Caixa** | Entradas e saídas com filtros por período | ✅ |
| **Balanço / DRE** | Resultado operacional com receitas, custos e margem | ✅ |
| **Contas a Pagar** | Agendamento de pagamentos futuros | ✅ |
| **Cotação do Rebanho** | Valor do rebanho em pé baseado na cotação da @ | ✅ |
| **Indicadores Financeiros** | Custo por cabeça/dia, custo por @ produzida, margem por @ | ✅ |

### Operações
| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Estoque de Insumos** | Ração, sal mineral, remédios, materiais de obra | ✅ |
| **Obras** | Registro de construções com materiais do estoque | ✅ |
| **Funcionários** | Cadastro de peões, vaqueiros, tratoristas, etc. | ✅ |
| **Nutrição do Lote** | Sal, ração e consumo/cab/dia por lote | ✅ |

### Indicadores Produtivos
| Indicador | Descrição | Status |
|-----------|-----------|--------|
| **GMD (Ganho Médio Diário)** | Cálculo automático entre pesagens | ✅ |
| **Conversão Alimentar** | kg de ração por kg de ganho | ✅ |
| **Previsão de Abate** | Estimativa baseada no GMD atual | ✅ |
| **Dias de Cocho** | Contagem automática de dias em confinamento | ✅ |

### Configurações
| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| **Identidade da Fazenda** | Nome, proprietário, cidade, estado, área | ✅ Novo |
| **Exportar Dados** | Download completo em JSON para backup | ✅ Novo |
| **Resetar Dados** | Limpeza total com confirmação | ✅ |

---

## 🚀 Como Rodar

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/AgroMacro.git
cd AgroMacro

# Inicie o servidor local
npx -y http-server . -p 3333 -c-1

# Abra no navegador
# http://localhost:3333
```

---

## 📂 Estrutura do Projeto

```
AgroMacro/
├── index.html              # App shell — todas as views/seções
├── styles.css              # Design system completo (1400+ linhas)
├── app.js                  # Controller: navegação, KPIs, config
├── js/
│   ├── data.js             # Camada de persistência (event-sourcing)
│   ├── icons.js            # 30+ ícones SVG profissionais
│   ├── cabecas.js          # Gestão individual de animais
│   ├── rebanho.js          # Cadastro de rebanho
│   ├── lotes.js            # Gestão de lotes
│   ├── pastos.js           # Cadastro de pastos
│   ├── manejo.js           # Manejo sanitário e pesagem
│   ├── financeiro.js       # Compra, venda, fluxo de caixa, balanço
│   ├── estoque.js          # Estoque de insumos
│   ├── obras.js            # Registro de obras
│   ├── funcionarios.js     # Cadastro de funcionários
│   ├── rebanho-ops.js      # Operações avançadas (trocar pasto, juntar lotes)
│   ├── pasto-mgmt.js       # Gestão avançada de pastos
│   ├── calendario.js       # Calendário sanitário
│   ├── contas.js           # Contas a pagar + cotação do rebanho
│   └── indicadores.js      # Indicadores financeiros e produtivos
└── manifest.json           # PWA manifest
```

---

## 🏗️ Arquitetura

### Event-Sourcing
Todos os dados são armazenados como eventos imutáveis no `localStorage`:
```javascript
{
    type: 'COMPRA' | 'VENDA' | 'MANEJO' | 'LOTE' | 'CABECA' | ...,
    id: 'E1707234567890-a1b2',
    timestamp: '2026-02-12T00:00:00.000Z',
    // ... dados específicos do tipo
}
```

### Navegação
Single Page App com 5 tabs no bottom nav:
- **Home** → Dashboard com KPIs, ações rápidas, cotação, alertas
- **Rebanho** → Hub com 6 sub-módulos (lotes, pastos, cabeças, manejo, calendário, cadastro)
- **Financeiro** → Hub com 4 sub-módulos (compra, venda, fluxo, balanço)
- **Operações** → Hub com 3 sub-módulos (estoque, obras, funcionários)
- **Config** → Identidade da fazenda, export, reset

### Design System
- Paleta agritech: deep greens, teal, navy, amber/earth tones
- SVG stroke-based icons (sem emojis — visual enterprise-grade)
- Mobile-first, dark mode, glassmorphism no nav
- Cards com gradientes escuros profissionais

---

## 📊 Pesquisa de Mercado — Apps Concorrentes

Analisamos os TOP apps de gestão pecuária:

| App | Destaque |
|-----|----------|
| **JetBov** | IA que analisa maturidade da fazenda e sugere ações |
| **iRancho** | Foco em rentabilidade e custo por cabeça |
| **Farmbov** | Offline, rotação de piquetes, evolução de pasto |
| **Semper Corte** | Integração com balança e brinco eletrônico |
| **BR-Corte** | IA para formulação de dieta ideal |

---

## 🗺️ Roadmap — Próximas Funcionalidades

### Fase 3 — Gestão Avançada de Rebanho
- [ ] Transferência Parcial de Lote (mover N animais entre lotes)
- [ ] Registro de Mortalidade/Baixa com motivo
- [ ] Registro de Nascimentos (matrizes)
- [ ] Histórico/Timeline por Lote completo

### Fase 4 — Gestão de Pasto
- [ ] Lotação por Hectare (UA/ha) automática
- [ ] Rotação de Piquetes com calendário
- [ ] Avaliação de Pastagem (ótimo/bom/ruim/degradado)

### Fase 5 — Manejo Avançado
- [ ] Protocolo Reprodutivo (IATF, touros, prenhez)
- [ ] Ficha Sanitária por Lote detalhada

### Fase 6 — UX Premium
- [ ] Dashboard com Gráficos (Chart.js)
- [ ] Relatório PDF mensal
- [ ] Notificações/Alertas inteligentes
- [ ] Foto do Animal/Lote

### Fase 7 — Financeiro Avançado
- [ ] Ponto de Equilíbrio (break-even)
- [ ] Projeção de Receita

---

## 📱 Screenshots

> Screenshots serão adicionados após finalização do redesign visual.

---

## 📝 Licença

Projeto privado — uso comercial. Todos os direitos reservados.
