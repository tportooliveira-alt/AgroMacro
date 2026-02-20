# 📋 PLANO DE AÇÃO — AgroMacro

**Última atualização:** 20/02/2026 16:40 BRT

---

## ✅ CONCLUÍDO

- [x] App AgroMacro completo (26+ funcionalidades)
- [x] Firebase Hosting: [fazenda-antares.web.app](https://fazenda-antares.web.app)
- [x] GitHub atualizado: `tportooliveira-alt/AgroMacro`
- [x] IA Consultor Boteco (Gemini 2.0 Flash) funcionando
- [x] Cascata multi-provedor (Gemini → Groq → Cerebras → OpenRouter)
- [x] Cloudflare Worker deployado
- [x] Mapa com 49 pastos KML + cores únicas por pasto
- [x] Módulos: Rebanho, Lotes, Financeiro, Estoque, Manejo, Nutrição, Obras, Clima, Indicadores
- [x] Dashboard de Resultados na Home
- [x] Previsão do tempo com coordenadas da fazenda
- [x] Reorganização da navegação:
  - Home limpa (só Manejo Rápido + Abastecer Estoque)
  - Hub Financeiro (Compra, Venda, Fluxo, Contas, Balanço)
  - Hub Operações (Rastreabilidade, Pesagem, Estoque, Obras, Funcionários)
- [x] Perfil Gerência/Campo — financeiro bloqueado para peões
- [x] Cotação da arroba + detalhes do lote

---

## 🚀 PRÓXIMAS MELHORIAS (por prioridade)

### 1. 🤖 IA — Comandos por Voz/Texto na Tela Principal
**Prioridade:** ALTA | **Esforço:** Médio

**O que:** Ao invés de só o botão flutuante do Boteco, criar uma barra de comandos rápidos na Home onde o usuário digita ou fala e a IA executa ações diretamente.

**Exemplos de comandos:**
- "Vacinar lote recria" → abre manejo com lote pré-selecionado
- "Quanto temos de ração?" → responde direto o estoque
- "Mover lote engorda para pasto 12" → executa movimentação
- "Quanto gastei esse mês?" → mostra resumo financeiro

**Implementação:**
- Barra de input com microfone na Home (acima dos atalhos)
- Parser de intenções na IA que chama funções do app
- Respostas inline (sem abrir o chat completo)

---

### 2. 🎨 IA — Melhorar Interface do Boteco
**Prioridade:** ALTA | **Esforço:** Médio

**O que:** O botão flutuante do Boteco pode ser mais intuitivo e a interface do chat mais bonita.

**Melhorias propostas:**
- [ ] Botão com animação de "respiração" (pulse) pra chamar atenção
- [ ] Avatar do Boteco mais bonito e temático (vaqueiro/boi)
- [ ] Sugestões rápidas no chat (chips clicáveis): "Resumo do dia", "Alertas", "Estoque baixo"
- [ ] Indicador de "pensando..." com animação
- [ ] Histórico de conversa persistente (localStorage)
- [ ] Respostas com cards formatados (não só texto)
- [ ] Modo escuro para o chat
- [ ] Som de notificação quando Boteco responde

---

### 3. 📱 UX — Melhorias Visuais Gerais
**Prioridade:** MÉDIA | **Esforço:** Baixo-Médio

- [ ] Animações de transição entre telas (slide)
- [ ] Skeleton loading nos cards enquanto carrega
- [ ] Pull-to-refresh na Home
- [ ] Haptic feedback nos botões (vibração sutil)
- [ ] Empty states bonitos (quando não há dados)
- [ ] Tutorial de primeiro uso (onboarding)
- [ ] Ícone de notificação com badge de alertas pendentes
- [ ] Modo escuro global

---

### 4. 📊 Dados — Relatórios e Gráficos
**Prioridade:** MÉDIA | **Esforço:** Médio

- [ ] Gráficos de evolução de peso por lote (Chart.js)
- [ ] Gráfico de receita vs despesa mensal
- [ ] Relatórios PDF melhorados com gráficos embutidos
- [ ] Export para Excel (planilhas)
- [ ] Dashboard comparativo mês a mês
- [ ] Indicadores de tendência (↑↓) nos KPIs

---

### 5. 📸 Funcionalidades Novas
**Prioridade:** MÉDIA | **Esforço:** Alto

- [ ] Upload de fotos dos animais (câmera do celular)
- [ ] Integração com balança Bluetooth (Modo Pesagem funcional)
- [ ] Alertas proativos push (vacinação, contas vencendo)
- [ ] Calendário visual de manejos programados
- [ ] QR Code/RFID para identificação individual
- [ ] Módulo de manejo reprodutivo (IATF, touro, prenhez)

---

### 6. 🌐 WhatsApp — Integração Completa
**Prioridade:** BAIXA (quando sair do modo teste) | **Esforço:** Baixo

- [ ] Atualizar `WHATSAPP_TOKEN` no Cloudflare com token permanente
- [ ] Verificação Meta Business (documentos da empresa)
- [ ] Adicionar número real da fazenda
- [ ] Comandos WhatsApp: "estoque", "alertas", "resumo"

---

### 7. 🔒 Segurança e Dados
**Prioridade:** BAIXA | **Esforço:** Médio

- [ ] Backup automático para Firebase/Firestore
- [ ] Login com senha para perfil Gerência
- [ ] Logs de auditoria (quem fez o quê)
- [ ] Blockchain para rastreabilidade SISBOV

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
| GEMINI_API_KEY | Cloudflare Worker + App (localStorage) |
| WHATSAPP_TOKEN | Cloudflare Worker |
| WHATSAPP_PHONE_ID | 1014854568378749 |
| WHATSAPP_VERIFY_TOKEN | agromacro2026 |
| Firebase | .firebaserc (fazenda-antares) |

---

## 📁 MÓDULOS DO APP (30 arquivos JS)

| Módulo | Arquivo | Status |
|---|---|---|
| Controller | `app.js` | ✅ |
| Rebanho | `rebanho.js` + `rebanho-ops.js` | ✅ |
| Lotes | `lotes.js` | ✅ |
| Cabeças Individual | `cabecas.js` | ✅ |
| Pastos | `pastos.js` + `pasto-mgmt.js` | ✅ |
| Manejo | `manejo.js` | ✅ |
| Estoque | `estoque.js` | ✅ |
| Financeiro | `financeiro.js` + `contas.js` | ✅ |
| Nutrição | `nutricao.js` | ✅ |
| Obras | `obras.js` | ✅ |
| Funcionários | `funcionarios.js` | ✅ |
| Rastreabilidade | `rastreabilidade.js` | ✅ |
| Balança | `balanca.js` | 🔧 Interface básica |
| Clima | `clima.js` | ✅ |
| Mapa | `mapa.js` + `fazenda-data.js` | ✅ |
| Gráficos | `graficos.js` | ✅ |
| Indicadores | `indicadores.js` + `resultados.js` | ✅ |
| Relatórios | `relatorio.js` | ✅ |
| IA Boteco | `ia-consultor.js` | ✅ |
| Fotos | `fotos.js` | 🔧 Estrutura pronta |
| Blockchain | `blockchain.js` | 🔧 Estrutura pronta |
| Calendário | `calendario.js` | ✅ |
| Firebase Sync | `firebase-sync.js` | ✅ |
| Ícones | `icons.js` | ✅ |
| UX Helpers | `ux-helpers.js` | ✅ |
| Dados | `data.js` | ✅ |
