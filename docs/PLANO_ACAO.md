# 📋 PLANO DE AÇÃO — AgroMacro

**Última atualização:** 20/02/2026 03:46 BRT

---

## ✅ CONCLUÍDO

- [x] App AgroMacro completo (26 funcionalidades)
- [x] Firebase Hosting: [fazenda-antares.web.app](https://fazenda-antares.web.app)
- [x] GitHub atualizado: `tportooliveira-alt/AgroMacro`
- [x] IA Consultor (Gemini) funcionando no app
- [x] Cascata multi-provedor (Gemini → Groq → Cerebras → OpenRouter)
- [x] Cloudflare Worker deployado: `steep-glitter-59ba.tportooliveira.workers.dev`
- [x] Webhook Meta verificado e assinado (campo "messages")
- [x] Token WhatsApp testado com sucesso (API retornou OK)
- [x] Mapa com KML da Fazenda Antares
- [x] Módulos: Rebanho, Lotes, Financeiro, Estoque, Manejo, Nutrição, Obras, Clima, Indicadores

---

## 🔧 PENDENTE (por prioridade)

### 1. 🟥 WhatsApp — Token no Cloudflare (2 min)
**O que:** Atualizar o `WHATSAPP_TOKEN` no Cloudflare com o token novo + colar código atualizado (v22.0).

**Como:**
1. Abrir [dash.cloudflare.com](https://dash.cloudflare.com) → steep-glitter-59ba → Configurações
2. Editar `WHATSAPP_TOKEN` → colar o token novo (começa com `EAAqDlwgvQ3UBQ9ZA8Jy...`)
3. Ir em Editor → colar o código de `worker/index.js` (versão v22.0 atualizada)
4. Reimplantar
5. Testar: mandar mensagem para +1 555 153 0824

### 2. 🟧 WhatsApp — Token Permanente (15 min)
**O que:** O token temporário expira em 24h. Criar um permanente.

**Como:**
1. [business.facebook.com/settings/system-users](https://business.facebook.com/settings/system-users)
2. AgroMacro Bot → Atribuir ativos (App + Conta WhatsApp) com Controle Total
3. Gerar token → selecionar `whatsapp_business_messaging` + `whatsapp_business_management`
4. Colar no Cloudflare como `WHATSAPP_TOKEN`
5. Este token NUNCA expira

### 3. 🟨 Verificação Meta Business (quando necessário)
**O que:** Para sair do modo teste e usar número próprio.

**Como:**
1. [business.facebook.com](https://business.facebook.com) → Verificação da empresa
2. Enviar documentos da empresa
3. Aguardar aprovação (1-3 dias úteis)
4. Depois: adicionar número de telefone real da fazenda

### 4. 🟩 Melhorias Futuras
- [ ] Gráficos de evolução de peso (Chart.js)
- [ ] Upload de fotos dos animais
- [ ] Alertas proativos (vacinação, contas vencendo)
- [ ] Relatórios PDF melhorados
- [ ] Integração com balança Bluetooth
- [ ] Blockchain para rastreabilidade

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
