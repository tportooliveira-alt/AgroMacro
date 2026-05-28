# 🎨 AgroMacro no Figma — Guia Completo de Criação

## Passo 1: Criar Novo Arquivo Figma

1. Abra [figma.com](https://figma.com)
2. Clique em **New Design File**
3. Nome: `AgroMacro — Brutalismo Premium`
4. Descrição: "Design System + Wireframes — PWA Gestão Pecuária"

---

## Passo 2: Setup Design Tokens (5 min)

### 2.1 Criar Paleta de Cores

No painel **Assets** → **Colors** → Criar:

```
🎨 CORES

Preto Titânio       #0F1318
Terra Roxa          #8B4513
Branco Osso         #FFFEF0
Verde Titânio       #00796B
Vermelho Alerta     #DC2626
Âmbar Cautela       #B45309

Grays:
Dark                #1A1A1A
Mid-Dark            #2A2A2A
Mid                 #3D3D3D
Light               #4A4A4A
Border              #5A5A5A
```

### 2.2 Criar Estilos de Tipografia

**Assets** → **Typography** → Criar:

```
📝 TIPOGRAFIA

Display (32px)
├─ Font: Inter Bold
├─ Size: 32px
├─ Weight: 700
└─ Line Height: 1.2

Heading 1 (24px)
├─ Font: Inter Bold
├─ Size: 24px
├─ Weight: 700
└─ Line Height: 1.3

Heading 2 (20px)
├─ Font: Inter Semi Bold
├─ Size: 20px
├─ Weight: 600
└─ Line Height: 1.3

Body (14px)
├─ Font: Inter Regular
├─ Size: 14px
├─ Weight: 400
└─ Line Height: 1.5

Small (12px)
├─ Font: Inter Regular
├─ Size: 12px
├─ Weight: 400
└─ Line Height: 1.4

Mono/KPI (28-42px)
├─ Font: JetBrains Mono Bold
├─ Size: 28-42px
├─ Weight: 700
└─ Line Height: 1
```

---

## Passo 3: Criar Component Library (15 min)

### 3.1 Button Components

**Create Component** — `Button/Primary`
- Size: 48px height
- Padding: 12px 24px
- Background: Terra Roxa (#8B4513)
- Text: Branco Osso (#FFFEF0)
- Border Radius: 6px
- Font: Body Style

**Variants:**
- State: Default, Hover, Active, Disabled
- Size: Default, Small

**Create Component** — `Button/Secondary`
- Background: Mid (#3D3D3D)
- Border: 1px Border (#5A5A5A)
- Rest igual ao Primary

### 3.2 Card Components

**Create Component** — `Card/Default`
- Background: Dark (#1A1A1A)
- Border: 1px Border (#3D3D3D)
- Border Radius: 8px
- Padding: 16px
- Gap internal: 12px

**Variants:**
- Style: Default, With Header, With Badge, Hover (lighter border)

### 3.3 KPI Card Component

**Create Component** — `KPI Card`
- Background: Dark (#1A1A1A)
- Border: 1px Border (#3D3D3D)
- Border Radius: 8px
- Min Height: 120px
- Display: Flex, Center, Column

**Children:**
- Label (Small style, uppercase)
- Value (Mono/KPI style, Terra Roxa)
- Unit (Small style, Light color)

### 3.4 Input Component

**Create Component** — `Input Field`
- Background: Mid-Dark (#2A2A2A)
- Border: 1px Light (#4A4A4A)
- Focus Border: Terra Roxa (#8B4513)
- Border Radius: 6px
- Padding: 12px 16px
- Font: Body

**Variants:**
- State: Default, Focused, Filled, Error, Disabled

### 3.5 Badge Component

**Create Component** — `Badge`
- Padding: 2px 8px
- Border Radius: 6px
- Font: Small, uppercase

**Variants:**
- Color: Terra, Verde, Alerta, Cautela

### 3.6 Alert Box Component

**Create Component** — `Alert`
- Border Left: 4px
- Padding: 16px
- Border Radius: 8px

**Variants:**
- Type: Info, Warning, Error, Success

---

## Passo 4: Criar Telas Principais (30 min)

### 4.1 Splash Screen

1. **Frame** — `1. Splash Screen` (iPhone 14 — 390x844)
2. Fundo: Preto Titânio (#0F1318)
3. Componentes:
   - Logo SVG topográfico (200x200, centrado)
   - Texto "AgroMacro" (Display style)
   - Subtexto "Gestão Pecuária Inteligente" (Body style)
   - Progress bar ou loading spinner (Terra Roxa)

### 4.2 Home — Dashboard

1. **Frame** — `2. Home - Dashboard` (390x844)
2. Layout:
   - Header (Olá, [Fazenda] | Data)
   - **KPI Grid** — 4 colunas:
     - GMD: 1.245 kg/dia
     - Arroba (@): 52.8 proj
     - Lotação: 2.8 UA/ha
     - Rebanho: 384 cabeças
   - **Alert Cards** (Estoque baixo, Contas vencidas, Superlotação)
   - **Previsão Climática** (Open-Meteo)
   - **Cotação Rebanho** (Valor total)
   - **Ações Rápidas** (+Compra | +Venda | +Manejo)
   - **Bottom Nav** (5 tabs)

### 4.3 Rebanho — Hub

1. **Frame** — `3. Rebanho - Hub` (390x844)
2. Header: "Rebanho"
3. **6 Card Buttons** (grid 2x3):
   - 📋 Lotes
   - 🐂 Cabeças Individuais
   - 💉 Manejo Sanitário
   - 📅 Calendário
   - 🌿 Pastos
   - 📊 Indicadores

### 4.4 Rebanho — Lotes

1. **Frame** — `4. Rebanho - Lotes` (390x844)
2. Header com botão "+Novo Lote"
3. **Lista de Lotes** (Cards alta densidade):
   ```
   Lote A1          | 24 cab | 380kg | 35d | ✅ ATIVO
   Lote B2          | 32 cab | 350kg | 28d | ✅ ATIVO
   Lote Matrizes    | 18 cab | 480kg | --  | ✅ ATIVO
   ```

### 4.5 Financeiro — Hub

1. **Frame** — `5. Financeiro - Hub` (390x844)
2. Header: "Financeiro"
3. **4 Card Buttons**:
   - 💰 Compra de Gado
   - 🏪 Venda de Gado
   - 📊 Fluxo de Caixa
   - 📈 Balanço (DRE)

### 4.6 Operações — Hub

1. **Frame** — `6. Operações - Hub` (390x844)
2. Header: "Operações"
3. **3 Card Buttons**:
   - 📦 Estoque
   - 🔨 Obras
   - 👥 Funcionários

### 4.7 Config

1. **Frame** — `7. Config` (390x844)
2. **Seções**:
   - **Identidade da Fazenda**: Nome, Proprietário, Cidade, Estado, Área
   - **Dados**: Botão Exportar | Botão Resetar
   - **Perfil**: Radio Peão | Gerência | Dono
   - **PWA**: Botão Instalar App

### 4.8 Compra/Venda Gado

1. **Frame** — `8. Compra Gado - Form` (390x844)
2. **Form Fields**:
   - Data (input date)
   - Quantidade (input number)
   - Valor (input currency)
   - Lote (select dropdown)
   - Observações (textarea)
3. **Botões**: Salvar (Primary) | Cancelar (Secondary)
4. **Lista abaixo** com transações recentes

---

## Passo 5: Design System Page (5 min)

1. **New Page** — "Design System"
2. Criar seções:
   - **Colors** — Grid 6 cores com hex codes
   - **Typography** — Exemplos de cada estilo
   - **Components** — Botões, cards, inputs, badges, alerts
   - **Icons** — Logos e ícones (topográfico, etc)
   - **Spacing** — Grid de espaçamento
   - **States** — Hover, focus, disabled, error

---

## Passo 6: Prototyping & Interactions (10 min)

1. **Prototype Tab**
2. Conectar telas:
   - Home → Rebanho Hub (clique nav)
   - Home → Financeiro Hub
   - Home → Operações Hub
   - Home → Config
   - Rebanho Hub → Rebanho Lotes
   - Rebanho Hub → Rebanho Cabeças
   - Botão "+Compra" → Compra Form
   - Bottom nav navegação circular

3. **Add Animations**:
   - Splash → Home (fade + slide up)
   - Hub cards → Telas (scale + fade)

---

## Passo 7: Export & Documentation

1. **Share Link** — Public link para view/feedback
2. **Export Assets**:
   - SVGs dos componentes
   - PNGs das telas (1x, 2x)
3. **Documentação no Figma**:
   - Page "README" com guia de uso
   - Grid system (4-12 colunas)
   - Shadow specs
   - Responsive breakpoints

---

## 🎯 Checklist Rápido

```
Design System
☐ 6 cores criadas
☐ 7 estilos de tipografia
☐ Button Primary + Secondary (5 variants cada)
☐ Card component (4 variants)
☐ KPI Card component (3 variants)
☐ Input Field (5 variants)
☐ Badge (4 variants)
☐ Alert Box (4 variants)

Wireframes
☐ Splash Screen
☐ Home - Dashboard (7 seções)
☐ Rebanho Hub + Lotes + Cabeças
☐ Financeiro Hub + Compra/Venda
☐ Operações Hub
☐ Config
☐ Telas secundárias (manejo, estoque, etc)

Docs
☐ Design System page
☐ Prototype connections
☐ Animations básicas
☐ README documentação
☐ Export assets
```

---

## 🚀 Tempo Estimado

- Setup: 5 min
- Components: 15 min
- Wireframes: 30 min
- Prototyping: 10 min
- **Total: ~60 minutos**

---

## 📚 Referências

- **Logo**: Verifique `/icons/agromacro-logo-topografia.svg`
- **Colors**: `/figma-design-spec.md`
- **CSS**: `/brutalismo-premium.css` (para confirmação de specs)
- **Preview**: `brutalismo-preview.html` (visual reference)

---

## 💡 Dicas Figma

1. **Usar Auto Layout** para buttons e cards (melhor responsividade)
2. **Constraints** para mobile-first (left/right stretch, top fixed)
3. **Components** com variants (melhor que múltiplas versões)
4. **Shared Library** se compartilhado com time
5. **Prototyping** → Preview no Figma Viewer para testar
6. **Dev Mode** → Gerar código/specs para devs

---

**Quando terminar, compartilhe o link Figma!** 🎉
