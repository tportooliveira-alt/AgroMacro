# 🐂 AgroMacro — Mapa de Progresso do Projeto

> **Referência permanente** — Consultar antes de cada implementação.
> Última atualização: 2026-02-12

---

## 📊 Visão Geral

```
PROGRESSO TOTAL: ████████████████████████████████████████████████████████████████████████████████░░░░░░░░░░ 40/50 (80%)

FUNCIONAL:       ████████████████████████████████████████████████ 38/38 (100%) ✅
VISUAL:          ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1/8  (13%)
COMERCIAL:       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/5  (futuro)
```

---

## 🗺️ Fluxograma do Projeto

```mermaid
graph TD
    subgraph "✅ FASE 1 — Estrutura (PRONTA)"
        NAV["5 Tabs + 3 Hubs ✅"]
        ICONS["30+ SVG Icons ✅"]
        DARK["Dark Mode ✅"]
        CFG["Config/Export/Reset ✅"]
    end

    subgraph "✅ FASE 2 — Módulos Core (PRONTOS)"
        LOT["📋 Lotes ✅"]
        CAB["🐮 Cabeças ✅"]
        PAS["🌿 Pastos ✅"]
        MAN["💉 Manejo ✅"]
        EST["📦 Estoque ✅"]
        OBR["🔨 Obras ✅"]
        FUN["👷 Funcionários ✅"]
    end

    subgraph "✅ FASE 3 — Rebanho Avançado (PRONTA)"
        TRANS["↔️ Transferência Parcial ✅"]
        MORT["💀 Mortalidade/Baixa ✅"]
        NASC["🐣 Nascimentos ✅"]
        TIME["📜 Timeline/Lote ✅"]
    end

    subgraph "✅ FASE 4 — Pasto Avançado (PRONTA)"
        UAHA["UA/ha Automático ✅"]
        ROT["Rotação Piquetes ✅"]
        AVAL["Avaliação Pastagem ✅"]
    end

    subgraph "✅ FASE 5 — Manejo Avançado (PRONTA)"
        IATF["IATF Protocolo ✅"]
        FSAN["Ficha Sanitária ✅"]
        CAL["Calendário Sanitário ✅"]
    end

    subgraph "✅ FASE 6 — Financeiro Core (PRONTA)"
        COMP["Compra/Venda ✅"]
        FLUX["Fluxo de Caixa ✅"]
        BAL["Balanço/DRE ✅"]
        CONT["Contas a Pagar ✅"]
        COT["Cotação Rebanho ✅"]
    end

    subgraph "✅ FASE 7 — Indicadores (PRONTOS)"
        KPI1["Custo/Cab/Dia ✅"]
        KPI2["Custo/@Prod ✅"]
        KPI3["Margem/@ ✅"]
        KPI4["Ponto Equilíbrio ✅"]
        KPI5["GMD ✅"]
        KPI6["Conversão Alimentar ✅"]
        KPI7["Previsão Abate ✅"]
        KPI8["Dias de Cocho ✅"]
    end

    subgraph "✅ FASE 8 — UX Premium (5/5)"
        GRA["📊 Gráficos Chart.js ✅"]
        PDF["📑 Relatório PDF ✅"]
        ALE["🔔 Alertas ✅"]
        PWA["📱 PWA Offline ✅"]
        FOT["📸 Foto Animal ✅"]
    end

    subgraph "✅ FASE 9 — Financeiro Avançado (3/3)"
        PE["Ponto Equilíbrio ✅"]
        PRO["📈 Projeção Receita ✅"]
        FLR["🔗 Fluxo→Rebanho ✅"]
    end

    subgraph "❌ FASE 10 — Visual Overhaul (1/8)"
        VL1["Lotes Cards ⏳"]
        VL2["Manejo Timeline ❌"]
        VL3["Estoque Progress ❌"]
        VL4["Pastos Grid ❌"]
        VL5["Financial Summary ❌"]
        VL6["Micro-animações ❌"]
        VL7["Loading Shimmer ❌"]
        VL8["Page Transitions ❌"]
    end

    subgraph "🔮 FASE 11 — Comercial (Futuro)"
        FIR["Firebase + Login"]
        SEL["Self-service"]
        IA["IA Assistente"]
        MAS["Mascote Boizinho"]
        SUB["Plano Assinatura"]
    end

    NAV --> LOT --> TRANS
    CAB --> FOT
    PAS --> UAHA
    MAN --> IATF
    COMP --> PE --> PRO
    GRA --> VL1
```

---

## ✅ Checklist por Sprint

### Sprint 1 — 📸 Foto (PRONTO ✅ já existia no código)
- [x] Input câmera/galeria no cadastro
- [x] Compressão Canvas 200px
- [x] Salvar Base64 no localStorage
- [x] Thumbnail na lista e ficha

### Sprint 2 — 💰 Financeiro Avançado (PRONTO ✅)
- [x] `calcProjecaoReceita()` — projeta ganho por GMD
- [x] Card de Projeção na Home + Fluxo
- [x] `getCustoPorLote()` breakdown nutrição/manejo/compra
- [x] Custo por Lote renderizado no Fluxo

### Sprint 3 — 🎨 Visual (Lotes + Manejo + Estoque)
- [ ] Cards premium com gradientes nos Lotes
- [ ] Timeline cards no Manejo
- [ ] Progress bars no Estoque

### Sprint 4 — 🎨 Visual (Pastos + Financeiro + Animações)
- [ ] Grid visual nos Pastos
- [ ] Summary cards no Financeiro
- [ ] Micro-animações + shimmer + transitions

### Sprint 5 — 🐄 Melhorias Pesquisa
- [ ] Campo touro/mãe nos nascimentos
- [ ] GTA na transferência
- [ ] Altura capim entrada/saída
- [ ] Template IATF novilhas

---

## 📋 Arquivos do Projeto

| Arquivo | Linhas | Função |
|---------|:------:|--------|
| `app.js` | 432 | Controller principal, nav, KPIs |
| `index.html` | ~1200 | Todas as views HTML |
| `styles.css` | ~900 | Estilos dark mode |
| `js/lotes.js` | 780 | CRUD de lotes |
| `js/cabecas.js` | 350 | Animais individuais |
| `js/financeiro.js` | 449 | Compra/Venda/Fluxo/Balanço |
| `js/calendario.js` | 608 | IATF + Sanitário + Carência |
| `js/indicadores.js` | 369 | 8 KPIs financeiros/produtivos |
| `js/estoque.js` | 560 | Insumos + Nutrição |
| `js/rebanho-ops.js` | 300 | Transfer/Mortalidade/Nascimento |
| `js/pastos.js` | 210 | CRUD pastos |
| `js/pasto-mgmt.js` | 200 | UA/ha + Rotação |
| `js/graficos.js` | 312 | 4 gráficos Chart.js |
| `js/relatorio.js` | 163 | PDF via window.print |
| `js/contas.js` | 270 | Contas a Pagar + Cotação |
| `sw.js` | 104 | Service Worker PWA |
| `manifest.json` | 29 | PWA Manifest |
| `seed-data.js` | ~700 | Dados de demonstração |

---

> 🎯 **OBJETIVO FINAL**: App 100% offline, mobile-first, premium, que compete com JetBov e iRancho mas sem mensalidade.
