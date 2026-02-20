# 📋 PLANO DE AÇÃO COMPLETO — AgroMacro

**Última atualização:** 20/02/2026 16:49 BRT  
**Status:** App funcional, em fase de polimento e turbinagem

---

## ✅ CONCLUÍDO

- [x] 26+ funcionalidades implementadas
- [x] Firebase Hosting: [fazenda-antares.web.app](https://fazenda-antares.web.app)
- [x] GitHub: `tportooliveira-alt/AgroMacro`
- [x] IA Boteco (Gemini 2.0 Flash) + cascata multi-provedor
- [x] Mapa com 49 pastos KML + cores únicas
- [x] Perfil Gerência/Campo com bloqueio financeiro
- [x] Hubs organizados: Home (peão), Financeiro (5 botões), Operações (5 botões)
- [x] Dashboard de Resultados, Clima, KPIs, Alertas
- [x] 30 módulos JS funcionais

---

## 🔴 FASE 0 — BANCO DE DADOS + LOGIN (~2h) ← PRIORIDADE MÁXIMA

### 0.1 Migrar localStorage → Firebase Firestore
**Problema:** Dados ficam no navegador. Se limpar cache, perde tudo.
- [ ] Criar coleções no Firestore: `lotes`, `eventos`, `estoque`, `contas`, `config`
- [ ] Migrar `data.js` para salvar/ler do Firestore
- [ ] Manter fallback offline (dados locais sincronizam quando tem internet)
- [ ] Dados seguros na nuvem, acessíveis de qualquer dispositivo

### 0.2 Login com Usuário e Senha
**Problema:** App aberto, qualquer um acessa tudo.
- [ ] Firebase Authentication (email/senha)
- [ ] Tela de login na abertura do app
- [ ] Perfil Gerência: acesso total (financeiro, config, dados)
- [ ] Perfil Peão: só operacional (manejo, estoque, mapa)
- [ ] Logout no Config
- [ ] Cada fazenda = 1 conta, múltiplos usuários

### 0.3 Limpeza de código
- [ ] Remover estilos inline → classes CSS
- [ ] Remover código morto e comentários antigos
- [ ] Padronizar estrutura dos módulos

---

## 🚀 FASE 1 — TURBINAR A IA (~1h30)

### 1.1 Ensinar ações novas ao Boteco
**Arquivo:** `js/ia-consultor.js`

Hoje o Boteco só faz:
- ✅ REGISTRAR_CONTA (financeiro)
- ✅ Responder perguntas gerais

Precisa aprender:
- [ ] `REGISTRAR_ESTOQUE` — "Comprei 50 sacos de sal mineral"
- [ ] `CONSULTAR_ESTOQUE` — "Quanto tenho de ração?"
- [ ] `BAIXAR_ESTOQUE` — "Usei 5 sacos de ração hoje"
- [ ] `REGISTRAR_MANEJO` — "Vacinei o lote recria com Ivermectina"
- [ ] `MOVER_LOTE` — "Mover lote engorda pro pasto 12"
- [ ] `CONSULTAR_LOTES` — "Quantas cabeças no lote recria?"
- [ ] `CONSULTAR_PASTOS` — "Quais pastos estão vazios?"
- [ ] `REGISTRAR_PESO` — "Pesei lote engorda, média 380kg"
- [ ] `RESUMO_DIA` — "Me dê o resumo do dia"

### 1.2 Barra de comandos inteligente na Home
- [ ] Input de texto + botão microfone acima dos atalhos
- [ ] Ao digitar, IA interpreta e executa ação direto
- [ ] Respostas inline (card/toast) sem abrir chat completo
- [ ] Sugestões de autocomplete baseadas no contexto

### 1.3 Interface do chat Boteco
- [ ] Botão com animação pulse (respiração)
- [ ] Avatar temático do Boteco (vaqueiro)
- [ ] Chips de sugestão rápida: "Resumo", "Estoque", "Alertas"
- [ ] Indicador "pensando..." animado
- [ ] Respostas com cards formatados (não só texto)
- [ ] Histórico de conversa persistente

---

## 🎨 FASE 2 — POLIMENTO VISUAL (~1h)

### 2.1 Responsividade Mobile
- [ ] Testar TODOS os hubs no celular (touch-friendly)
- [ ] Boteco não sobrepor botões importantes
- [ ] Mapa: pinch/zoom suave no celular
- [ ] Formulários com teclado numérico automático
- [ ] Scroll snap nos cards de KPI

### 2.2 Animações e Micro-interações
- [ ] Transição suave entre telas (slide left/right)
- [ ] Skeleton loading nos cards enquanto carrega
- [ ] Pull-to-refresh na Home
- [ ] Haptic feedback nos botões (vibração sutil)
- [ ] Toast com animação de entrada/saída

### 2.3 Empty States e Onboarding
- [ ] Telas bonitas quando não há dados ("Nenhum lote cadastrado")
- [ ] Tutorial de primeiro uso (3 slides de explicação)
- [ ] Tooltips nos botões para novos usuários

### 2.4 Modo Escuro
- [ ] Toggle no Config
- [ ] CSS variables para cores dinâmicas
- [ ] Mapa adapta tema automaticamente

---

## 🔧 FASE 3 — MELHORIAS ESTRUTURAIS (~2h)

### 3.1 CSS — Limpar estilos inline
**Problema:** Os hubs de Operações e Financeiro usam estilos inline extensos
- [ ] Criar classes CSS reutilizáveis para os cards de menu
- [ ] Padronizar gradientes e sombras em variáveis CSS
- [ ] Reduzir duplicação de código visual

### 3.2 Navegação — Botões "Voltar" inteligentes
**Problema:** Botões ← voltam sempre para Home
- [ ] Compra/Venda/Fluxo/Contas/Balanço → voltar para hub Financeiro
- [ ] Estoque/Obras/Funcionários/Rastreabilidade → voltar para hub Operações
- [ ] Navegação com histórico (pilha de telas)

### 3.3 Dados — Persistência robusta
- [ ] Migrar localStorage → IndexedDB (mais espaço e confiável)
- [ ] Backup automático diário para Firebase/Firestore
- [ ] Importar/Exportar dados como arquivo .json
- [ ] Sincronização entre dispositivos (mesmo login)

### 3.4 Performance
- [ ] Lazy load de módulos JS (não carregar tudo no boot)
- [ ] Cache do Service Worker para assets estáticos
- [ ] Comprimir imagens dos ícones/SVGs
- [ ] Debounce nos inputs de pesquisa

---

## 📊 FASE 4 — RELATÓRIOS E GRÁFICOS (~1h)

- [ ] Gráfico de evolução de peso por lote (Chart.js)
- [ ] Gráfico receita vs despesa mensal
- [ ] Relatórios PDF com gráficos embutidos
- [ ] Export para Excel (.xlsx)
- [ ] Dashboard comparativo mês a mês
- [ ] Indicadores de tendência (↑↓) nos KPIs
- [ ] Relatório de custo por cabeça/lote

---

## 📸 FASE 5 — FUNCIONALIDADES NOVAS (~3h)

- [ ] Upload de fotos de animais (câmera do celular)
- [ ] Balança Bluetooth funcional (Modo Pesagem)
- [ ] Alertas push proativos (vacinação, contas vencendo)
- [ ] QR Code para identificação individual
- [ ] Módulo reprodutivo (IATF, touro, prenhez, parição)
- [ ] Calendário visual de manejos programados
- [ ] Mapa de calor de ocupação dos pastos
- [ ] Registro de mortalidade com motivo e foto
- [ ] Controle de combustível (máquinas/tratores)

---

## 🌐 FASE 6 — WHATSAPP E INTEGRAÇÕES (~1h)

- [ ] Token permanente no Cloudflare
- [ ] Verificação Meta Business
- [ ] Número real da fazenda no WhatsApp
- [ ] Comandos WhatsApp: "estoque", "alertas", "resumo"
- [ ] Notificações WhatsApp automáticas (vacina vencendo, conta vencida)

---

## 🔒 FASE 7 — SEGURANÇA (~1h)

- [ ] Login com senha para perfil Gerência
- [ ] Logs de auditoria (quem fez o quê, quando)
- [ ] Criptografia de dados sensíveis
- [ ] Blockchain para rastreabilidade SISBOV

---

## 📁 INVENTÁRIO DOS 30 MÓDULOS

| # | Módulo | Arquivo | Status |
|---|---|---|---|
| 1 | Controller | `app.js` | ✅ Completo |
| 2 | Rebanho | `rebanho.js` | ✅ |
| 3 | Rebanho Ops | `rebanho-ops.js` | ✅ |
| 4 | Lotes | `lotes.js` | ✅ |
| 5 | Cabeças | `cabecas.js` | ✅ |
| 6 | Pastos | `pastos.js` | ✅ |
| 7 | Pasto Mgmt | `pasto-mgmt.js` | ✅ |
| 8 | Manejo | `manejo.js` | ✅ |
| 9 | Estoque | `estoque.js` | ✅ |
| 10 | Financeiro | `financeiro.js` | ✅ |
| 11 | Contas | `contas.js` | ✅ |
| 12 | Nutrição | `nutricao.js` | ✅ |
| 13 | Obras | `obras.js` | ✅ |
| 14 | Funcionários | `funcionarios.js` | ✅ |
| 15 | Rastreabilidade | `rastreabilidade.js` | ✅ |
| 16 | Balança | `balanca.js` | 🔧 Interface básica |
| 17 | Clima | `clima.js` | ✅ |
| 18 | Mapa | `mapa.js` | ✅ |
| 19 | Fazenda Data | `fazenda-data.js` | ✅ |
| 20 | Gráficos | `graficos.js` | ✅ |
| 21 | Indicadores | `indicadores.js` | ✅ |
| 22 | Resultados | `resultados.js` | ✅ |
| 23 | Relatórios | `relatorio.js` | ✅ |
| 24 | IA Boteco | `ia-consultor.js` | 🔧 Precisa ações novas |
| 25 | Fotos | `fotos.js` | 🔧 Estrutura pronta |
| 26 | Blockchain | `blockchain.js` | 🔧 Estrutura pronta |
| 27 | Calendário | `calendario.js` | ✅ |
| 28 | Firebase Sync | `firebase-sync.js` | ✅ |
| 29 | Ícones | `icons.js` | ✅ |
| 30 | UX Helpers | `ux-helpers.js` | ✅ |

---

## ⏱️ ESTIMATIVA TOTAL

| Fase | Tempo | Prioridade |
|---|---|---|
| Fase 1 — Turbinar IA | ~1h30 | 🔴 ALTA |
| Fase 2 — Polimento Visual | ~1h | 🟠 ALTA |
| Fase 3 — Estruturais | ~2h | 🟡 MÉDIA |
| Fase 4 — Relatórios | ~1h | 🟡 MÉDIA |
| Fase 5 — Funcionalidades | ~3h | 🟢 BAIXA |
| Fase 6 — WhatsApp | ~1h | 🟢 BAIXA |
| Fase 7 — Segurança | ~1h | 🟢 BAIXA |
| **TOTAL** | **~10h30** | |

---

## 📊 STACK TÉCNICA

| Componente | Tecnologia | URL |
|---|---|---|
| Frontend | HTML/JS/CSS (PWA) | [fazenda-antares.web.app](https://fazenda-antares.web.app) |
| Hosting | Firebase | Console Firebase |
| Backend IA | Cloudflare Worker | steep-glitter-59ba.tportooliveira.workers.dev |
| IA | Gemini 2.0 Flash | Google AI Studio |
| WhatsApp | Meta Cloud API v22.0 | developers.facebook.com |
| Repositório | GitHub | tportooliveira-alt/AgroMacro |

---

## 🔑 CREDENCIAIS (não compartilhar!)

| Secret | Onde está |
|---|---|
| GEMINI_API_KEY | Cloudflare Worker + App |
| WHATSAPP_TOKEN | Cloudflare Worker |
| WHATSAPP_PHONE_ID | 1014854568378749 |
| WHATSAPP_VERIFY_TOKEN | agromacro2026 |
| Firebase | .firebaserc (fazenda-antares) |
