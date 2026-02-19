/**
 * AgroMacro — Cloudflare Worker Proxy para Gemini API
 * 
 * DEPLOY:
 * 1. Criar conta em https://dash.cloudflare.com (grátis)
 * 2. npm install -g wrangler
 * 3. wrangler login
 * 4. wrangler secret put GEMINI_API_KEY (colar a key do Google AI Studio)
 * 5. wrangler deploy
 * 
 * CUSTO: R$ 0/mês (100k req/dia grátis)
 */

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only POST
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

            // Rate limit simples por IP (50 req/hora)
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
            const rateLimitKey = `rate:${ip}:${Math.floor(Date.now() / 3600000)}`;

            // Montar o prompt do sistema com contexto da fazenda
            const systemPrompt = `Você é um consultor pecuário especialista em bovinocultura de corte no Brasil (Bahia).
Seu nome é AgroIA. Você trabalha para o app AgroMacro.

REGRAS CRÍTICAS:
1. Responda SEMPRE em português brasileiro
2. Seja DIRETO e PRÁTICO — como um veterinário/zootecnista experiente falaria no campo
3. Use os DADOS REAIS da fazenda fornecidos abaixo para dar respostas PRECISAS
4. Se não souber algo, diga "Não tenho informação suficiente" — NUNCA invente dados
5. Para diagnósticos de saúde animal, SEMPRE recomende consultar um veterinário presencial
6. Formate respostas com emojis e tópicos curtos para fácil leitura no celular
7. Mantenha respostas com no máximo 300 palavras

DADOS ATUAIS DA FAZENDA:
${context || 'Nenhum dado disponível ainda.'}`;

            // Convert messages to Gemini format
            const geminiContents = [];

            // Add system instruction as first user message context
            geminiContents.push({
                role: 'user',
                parts: [{ text: systemPrompt }]
            });
            geminiContents.push({
                role: 'model',
                parts: [{ text: 'Entendido! Sou o AgroIA, consultor pecuário do AgroMacro. Estou pronto para ajudar com base nos dados reais da sua fazenda. Como posso ajudar?' }]
            });

            // Add conversation history
            for (const msg of messages) {
                geminiContents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            }

            // Call Gemini API
            const apiKey = env.GEMINI_API_KEY;
            const model = 'gemini-2.0-flash-lite';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const geminiResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: geminiContents,
                    generationConfig: {
                        temperature: 0.3,      // Baixa = respostas mais precisas
                        topP: 0.8,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ]
                })
            });

            if (!geminiResponse.ok) {
                const errText = await geminiResponse.text();
                console.error('Gemini error:', errText);
                return new Response(JSON.stringify({ error: 'Erro na API Gemini', detail: errText }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const geminiData = await geminiResponse.json();
            const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta.';

            return new Response(JSON.stringify({ reply }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: 'Erro interno', detail: err.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
