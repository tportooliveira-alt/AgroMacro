/**
 * AgroMacro — Cloudflare Worker: IA Proxy + WhatsApp Webhook
 * 
 * ROTAS:
 *   POST /          → Proxy IA (app web)
 *   GET  /whatsapp  → Verificação webhook Meta
 *   POST /whatsapp  → Recebe mensagens WhatsApp → Gemini → responde
 * 
 * SECRETS (wrangler secret put):
 *   GEMINI_API_KEY       → Google AI Studio
 *   WHATSAPP_TOKEN       → Meta Cloud API access token
 *   WHATSAPP_VERIFY_TOKEN → Token customizado para verificação webhook
 *   WHATSAPP_PHONE_ID    → Phone Number ID do Meta
 * 
 * CUSTO: R$ 0/mês (100k req/dia grátis no Cloudflare)
 */

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ══ ROTA: WhatsApp Webhook ══
        if (url.pathname === '/whatsapp') {
            if (request.method === 'GET') {
                return this.handleWhatsAppVerify(url, env);
            }
            if (request.method === 'POST') {
                return this.handleWhatsAppMessage(request, env);
            }
        }

        // ══ ROTA: Health check ══
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                whatsapp: !!env.WHATSAPP_TOKEN,
                gemini: !!env.GEMINI_API_KEY,
                timestamp: new Date().toISOString()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ══ ROTA: Proxy IA (app web) — POST / ══
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Use POST' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            const body = await request.json();
            const { messages, context } = body;

            if (!messages || !messages.length) {
                return new Response(JSON.stringify({ error: 'Mensagem vazia' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const reply = await this.callGemini(messages, context, env);

            return new Response(JSON.stringify({ reply }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (err) {
            // Rate limit / cota excedida
            if (err.message && err.message.includes('RATE_LIMIT')) {
                return new Response(JSON.stringify({
                    error: 'Cota excedida',
                    reply: '⚠️ Limite de consultas atingido. Tente novamente em alguns minutos. Se persistir, considere um plano pago do Gemini.'
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ error: 'Erro interno', detail: err.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },

    // ══════════════════════════════════════════════════
    // GEMINI — Chamada centralizada (usada por app + WhatsApp)
    // ══════════════════════════════════════════════════
    async callGemini(messages, context, env) {
        const systemPrompt = `Você é o AgroIA, secretária e consultor pecuário digital do app AgroMacro.
Trabalha para uma fazenda de bovinocultura de corte no Brasil.

REGRAS:
1. Responda SEMPRE em português brasileiro
2. Seja DIRETO e PRÁTICO — como um veterinário/zootecnista falaria no campo
3. Use os DADOS REAIS da fazenda quando disponíveis
4. NUNCA invente dados — diga "não tenho informação suficiente"
5. Para saúde animal, recomende veterinário presencial
6. Use emojis e tópicos curtos (celular)
7. Máximo 300 palavras
8. NUNCA diga "não tenho acesso a dados em tempo real"
9. Cite fontes de preços (CEPEA, B3, Scot)

DADOS DA FAZENDA:
${context || 'Nenhum dado disponível.'}`;

        const geminiContents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido! Sou o AgroIA, pronto para ajudar. Como posso ajudar?' }] },
        ];

        for (const msg of messages) {
            geminiContents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

        const model = 'gemini-2.0-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Detectar pergunta de mercado → ativar Google Search
        const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
        const marketWords = ['mercado', 'arroba', 'preço', 'cotação', 'cepea', 'b3', 'boi gordo',
            'exportação', 'dólar', 'china', 'frigorífico', 'abate', 'bezerro', 'novilha',
            'vaca', 'milho', 'soja', 'quanto tá', 'tendência', 'safra', 'entressafra'];
        const useSearch = marketWords.some(w => lastMsg.includes(w));

        const bodyPayload = {
            contents: geminiContents,
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        if (useSearch) {
            bodyPayload.tools = [{ googleSearch: {} }];
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 429 || errText.includes('RESOURCE_EXHAUSTED')) {
                throw new Error('RATE_LIMIT: ' + errText);
            }
            throw new Error('Gemini API error: ' + errText);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta.';
    },

    // ══════════════════════════════════════════════════
    // WHATSAPP — Verificação do Webhook (GET)
    // ══════════════════════════════════════════════════
    handleWhatsAppVerify(url, env) {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === (env.WHATSAPP_VERIFY_TOKEN || 'agromacro2026')) {
            console.log('[WhatsApp] Webhook verified!');
            return new Response(challenge, { status: 200 });
        }

        return new Response('Forbidden', { status: 403 });
    },

    // ══════════════════════════════════════════════════
    // WHATSAPP — Processar mensagem recebida (POST)
    // ══════════════════════════════════════════════════
    async handleWhatsAppMessage(request, env) {
        try {
            const body = await request.json();

            // Meta envia status updates (delivered, read) — ignorar
            const entry = body?.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages || value.messages.length === 0) {
                return new Response('OK', { status: 200 });
            }

            const msg = value.messages[0];
            const from = msg.from; // Número do remetente (ex: 5577999990000)
            const text = msg.text?.body || '';
            const contactName = value.contacts?.[0]?.profile?.name || 'Usuário';

            if (!text) {
                return new Response('OK', { status: 200 });
            }

            console.log(`[WhatsApp] Msg de ${contactName} (${from}): ${text}`);

            // Processar com Gemini
            let reply;
            try {
                reply = await this.callGemini(
                    [{ role: 'user', content: text }],
                    `Mensagem via WhatsApp de: ${contactName}. Responda de forma concisa (máximo 500 caracteres).`,
                    env
                );

                // WhatsApp tem limite visual, truncar se muito longo
                if (reply.length > 4000) {
                    reply = reply.substring(0, 3900) + '\n\n... (resposta truncada, pergunte pelo app para ver completa)';
                }
            } catch (err) {
                if (err.message.includes('RATE_LIMIT')) {
                    reply = '⚠️ Opa! O AgroIA atingiu o limite de consultas gratuitas por agora.\n\n'
                        + '⏰ Tente novamente em 1-2 minutos.\n'
                        + '💡 Dica: pergunte pelo app (AgroMacro) que usa outro provedor como fallback.';
                } else {
                    reply = '❌ Erro ao processar sua mensagem. Tente novamente.\n\nSe persistir, use o app AgroMacro diretamente.';
                    console.error('[WhatsApp] Gemini error:', err.message);
                }
            }

            // Enviar resposta via WhatsApp API
            if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID) {
                await this.sendWhatsAppReply(from, reply, env);
            } else {
                console.warn('[WhatsApp] WHATSAPP_TOKEN ou PHONE_ID não configurados. Resposta não enviada.');
            }

            return new Response('OK', { status: 200 });

        } catch (err) {
            console.error('[WhatsApp] Error:', err.message);
            // Sempre retornar 200 pro Meta não reenviar
            return new Response('OK', { status: 200 });
        }
    },

    // ══════════════════════════════════════════════════
    // WHATSAPP — Enviar resposta
    // ══════════════════════════════════════════════════
    async sendWhatsAppReply(to, text, env) {
        const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[WhatsApp] Send failed:', errText);

            // Se token expirado, logar aviso claro
            if (response.status === 401) {
                console.error('[WhatsApp] ⚠️ TOKEN EXPIRADO! Gere novo em developers.facebook.com');
            }
        } else {
            console.log(`[WhatsApp] ✅ Resposta enviada para ${to}`);
        }
    }
};
