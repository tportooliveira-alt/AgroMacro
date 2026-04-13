# 🎨 AgroMacro no Figma — Kit Completo

## 📦 O Que Você Recebeu

### 📋 Documentação
1. **FIGMA-GUIA-CRIACAO.md** ← LEIA PRIMEIRO
   - Passo-a-passo detalhado (60 min total)
   - Setup Design System
   - Criação de 10+ componentes
   - 8 telas principais
   - Prototyping + interactions

2. **figma-project-spec.json**
   - Especificação técnica em JSON
   - Cores, tipografia, components, telas

### 🎨 Referências Visuais
1. **brutalismo-preview.html**
   - Preview interativo de todos os componentes
   - Abra no navegador para visualizar
   - Use como referência enquanto cria no Figma

2. **figma-wireframes.html**
   - Wireframes das 8 telas principais
   - Grid responsivo, alta fidelidade
   - Veja como deve ficar cada tela

3. **agromacro-logo-topografia.svg**
   - Logo topográfico Nelore
   - Pronto para usar no Figma
   - Versions: 192px, 512px, favicon

### 🖌️ Design System CSS
1. **brutalismo-premium.css** (500+ linhas)
   - Variáveis CSS completas
   - Componentes prontos
   - Espaçamento, tipografia, cores

2. **figma-design-spec.md**
   - Especificação de design
   - Paleta, tipografia, componentes

---

## 🚀 Como Usar — Roadmap de Criação

### FASE 1: Setup (5 min)
```
[ ] Abra figma.com
[ ] Crie novo Design File: "AgroMacro — Brutalismo Premium"
[ ] Setup Workspace
[ ] Importe/crie 6 cores base
[ ] Crie 7 estilos de tipografia
```

### FASE 2: Components (15 min)
Seguindo o FIGMA-GUIA-CRIACAO.md, crie:
```
[ ] Button/Primary (5 variants)
[ ] Button/Secondary (3 variants)
[ ] Card (4 variants)
[ ] KPI Card (3 variants)
[ ] Input Field (5 variants)
[ ] Badge (4 variants)
[ ] Alert Box (4 variants)
[ ] Navigation
```

### FASE 3: Wireframes (30 min)
Seguindo figma-wireframes.html, crie:
```
[ ] 1. Splash Screen
[ ] 2. Home - Dashboard
[ ] 3. Rebanho - Hub
[ ] 4. Rebanho - Lotes
[ ] 5. Financeiro - Hub
[ ] 6. Financeiro - Compra/Venda
[ ] 7. Operações - Hub
[ ] 8. Config
```

### FASE 4: Prototyping (10 min)
```
[ ] Conectar Home → Rebanho Hub
[ ] Conectar Home → Financeiro Hub
[ ] Conectar Home → Operações Hub
[ ] Conectar Home → Config
[ ] Conectar botões de ação
[ ] Adicionar animações básicas (fade, scale)
```

### FASE 5: Documentation (5 min)
```
[ ] Criar page "Design System"
[ ] Criar page "README"
[ ] Exportar assets (SVGs, PNGs)
[ ] Gerar link compartilhável
```

---

## 📊 Design System Overview

### Paleta (6 cores principais)
- **Preto Titânio** #0F1318 — fundo
- **Terra Roxa** #8B4513 — CTAs/alertas
- **Branco Osso** #FFFEF0 — texto
- **Verde Titânio** #00796B — sucesso
- **Vermelho Alerta** #DC2626 — erros
- **Âmbar Cautela** #B45309 — avisos

### Tipografia (7 estilos)
- Display (32px) — headings grandes
- Heading 1 (24px) — títulos principais
- Heading 2 (20px) — subtítulos
- Body (14px) — texto padrão
- Small (12px) — labels
- Mono (14px) — dados técnicos
- KPI (28-42px) — números grandes

### Components (28 variantes)
- Buttons (10 variantes)
- Cards (7 variantes)
- Inputs (5 variantes)
- Badges (4 variantes)
- Alerts (4 variantes)
- Navigation (2 variantes)
- Misc (6 variantes)

---

## 🎯 8 Telas Implementadas

| # | Tela | Descrição | Frames |
|---|------|-----------|--------|
| 1 | Splash | Logo + loading | 1 |
| 2 | Home - Dashboard | KPIs + alertas + ações | 1 |
| 3 | Rebanho Hub | 6 botões de módulos | 1 |
| 4 | Rebanho Lotes | Lista lotes + forms | 2 |
| 5 | Financeiro Hub | 4 botões de módulos | 1 |
| 6 | Financeiro Compra/Venda | Forms + lista | 2 |
| 7 | Operações Hub | 3 botões de módulos | 1 |
| 8 | Config | Formulários configurações | 1 |

**Total: 10 frames + Design System page**

---

## 🛠️ Recursos Disponíveis

```
AgroMacro/
├── FIGMA-GUIA-CRIACAO.md          ← LEIA PRIMEIRO (passo-a-passo)
├── FIGMA-README.md                 ← Este arquivo
├── figma-project-spec.json         ← Especificação técnica
├── figma-design-spec.md            ← Design system specs
│
├── brutalismo-preview.html         ← Preview interativo dos componentes
├── figma-wireframes.html           ← Preview das 8 wireframes
│
├── brutalismo-premium.css          ← CSS design system completo
├── agromacro-logo-topografia.svg   ← Logo topográfico
│
└── icons/
    └── agromacro-logo-topografia.svg
```

---

## 💡 Dicas Figma Pro

1. **Use Auto Layout**
   - Buttons e cards ficam responsivos automaticamente
   - Melhor para ajustes futuros

2. **Components + Variants**
   - Crie 1 component principal
   - Use variants para estados (hover, disabled, etc)
   - Economia de espaço e consistência

3. **Constraints para Mobile**
   - Left/Right: Stretch (quebra de linha)
   - Top: Fixed (não move)
   - Melhor responsividade

4. **Shared Library**
   - Se trabalhar em time, ative Shared Library
   - Components reutilizáveis entre arquivos

5. **Dev Mode + Inspect**
   - Devs conseguem copiar specs direto (CSS, valores)
   - Acelera handoff

6. **Prototyping**
   - Conecte frames com "smart animate"
   - Preview no Figma Viewer para testar fluxo

7. **Grid & Guides**
   - Setup grid 4-12 colunas (mobile a desktop)
   - Ajuda com alinhamento

---

## 📱 Responsividade (3 Breakpoints)

```
Mobile:   390px (iPhone)
Tablet:   768px
Desktop:  1200px
```

Use **Constraints** no Figma para garantir adaptação:
- Elementos fluem com grid
- Tipografia escala com breakpoints
- Componentes adaptam padding/gap

---

## ✅ Checklist Rápido

### Antes de Começar
- [ ] Você tem conta Figma? (gratuita é ok)
- [ ] Leu FIGMA-GUIA-CRIACAO.md?
- [ ] Tem os recursos abaixo abertos:
  - figma-wireframes.html (em browser para referência)
  - brutalismo-preview.html (em browser para componentes)

### Enquanto Cria
- [ ] Setup design tokens primeiro (cores + tipografia)
- [ ] Crie components reutilizáveis (não copie/cole)
- [ ] Nomeie frames consistentemente
- [ ] Use Auto Layout para tudo
- [ ] Teste responsive com diferentes resolutions

### Depois de Terminar
- [ ] Criar page "Design System" com documentação
- [ ] Gerar link público compartilhável
- [ ] Exportar assets (logo, icons, etc)
- [ ] Documentar breakpoints + specs

---

## 🎨 Visual Identity Checklist

- ✅ Paleta "Brutalismo Premium" (6 cores)
- ✅ Tipografia (Inter + JetBrains Mono)
- ✅ Logo topográfico Nelore
- ✅ Components (buttons, cards, inputs, badges)
- ✅ Icons (30+ SVG já existem no projeto)
- ✅ Spacing/Grid system
- ✅ Shadow/elevation levels
- ✅ State variations (hover, focus, disabled, error)
- ✅ Responsive design (mobile-first)
- ✅ Dark mode (padrão do AgroMacro)

---

## 🚀 Próximos Passos

### Imediatamente (Agora)
1. **Abra** figma-wireframes.html no navegador
2. **Leia** FIGMA-GUIA-CRIACAO.md completamente
3. **Crie** novo arquivo Figma

### Curto Prazo (Hoje/Amanhã)
1. Setup design system (5 min)
2. Crie components (15 min)
3. Desenhe 8 telas (30 min)
4. Prototyping + animations (10 min)

### Médio Prazo (Esta Semana)
1. Validar com stakeholders
2. Refinamentos baseado em feedback
3. Exportar assets
4. Documentar para devs

### Longo Prazo (Integração)
1. Usar CSS `brutalismo-premium.css` no app
2. Adaptar HTML/components para design
3. Deploy com nova visual
4. Coletar feedback real

---

## 📞 Suporte & Troubleshooting

### Problema: "Não lembro como criar components"
→ Veja FIGMA-GUIA-CRIACAO.md, seção 3.1-3.6

### Problema: "Como faz responsividade?"
→ Leia dica "Constraints para Mobile" acima

### Problema: "Cores não ficam iguais"
→ Use as cores do FIGMA-GUIA-CRIACAO.md exatamente (hex codes)

### Problema: "Componentes ficam grandes demais"
→ Use Auto Layout + Size constraints properly

---

## 📈 Métricas de Sucesso

- [x] Design system criado e documentado
- [x] 8 telas principais wireframed
- [x] 28+ component variants criados
- [x] Prototyping conectado
- [ ] ← Você conseguindo seguir o guia sem dúvidas
- [ ] ← Figma pronto para compartilhar
- [ ] ← Feedback e refinamentos
- [ ] ← CSS integrado no app

---

## 🎁 Bônus: Código Pronto para Usar

Todos esses arquivos já existem:
- ✅ `brutalismo-premium.css` — basta usar no index.html
- ✅ `agromacro-logo-topografia.svg` — basta importar no Figma
- ✅ `figma-wireframes.html` — referência visual 100% completa

**Você não precisa criar do zero — use essas referências!**

---

**Bora criar? 🚀 Abra o FIGMA-GUIA-CRIACAO.md e comece!**
