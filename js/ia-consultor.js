// ====== MÓDULO: IA CONSULTOR PECUÁRIO (Gemini API Real) ======
// Usa Google Gemini Flash-Lite via Cloudflare Worker proxy
// Custo: R$ 0/mês (free tier: 1000 req/dia)
window.iaConsultor = {

    // ══ CONFIGURAÇÃO ══
    // Opção 1: URL do Cloudflare Worker (produção — API key protegida)
    // Opção 2: API key direto (desenvolvimento/teste local)
    WORKER_URL: '',
    API_KEY: '',
    GROQ_KEY: '',

    CACHE_KEY: 'agromacro_ia_historico',
    MAX_HISTORICO: 20,
    historico: [],
    aberto: false,

    init: function () {
        this.historico = this._carregarHistorico();
        this._criarBotao();
        this._bindEventos();

        // Carregar config salva
        try {
            var config = JSON.parse(localStorage.getItem('agromacro_ia_config') || '{}');
            if (config.workerUrl) this.WORKER_URL = config.workerUrl;
            if (config.apiKey) this.API_KEY = config.apiKey;
            if (config.groqKey) this.GROQ_KEY = config.groqKey;
        } catch (e) { }

        console.log('IA Consultor Ready' + (this._temConexao() ? ' (conectada)' : ' (sem config)'));

        // Populate config fields if keys exist
        var configField = document.getElementById('config-api-key');
        if (configField && this.API_KEY) {
            configField.value = this.API_KEY;
        }
        var groqField = document.getElementById('config-groq-key');
        if (groqField && this.GROQ_KEY) {
            groqField.value = this.GROQ_KEY;
        }
    },

    _temConexao: function () {
        return !!(this.WORKER_URL || this.API_KEY);
    },

    // ══ Salvar chaves da tela de configuração ══
    salvarChaveConfig: function () {
        var key = (document.getElementById('config-api-key').value || '').trim();
        var groqKey = '';
        var groqField = document.getElementById('config-groq-key');
        if (groqField) groqKey = (groqField.value || '').trim();
        this.API_KEY = key;
        this.GROQ_KEY = groqKey;
        localStorage.setItem('agromacro_ia_config', JSON.stringify({ apiKey: key, groqKey: groqKey }));
        if (key || groqKey) {
            window.app.showToast('🔑 Chave(s) API salva(s)!', 'success');
        }
    },

    // ══ Testar conexão IA ══
    testarChave: function () {
        var key = (document.getElementById('config-api-key').value || '').trim();
        if (!key) {
            window.app.showToast('Cole sua chave API primeiro.', 'error');
            return;
        }
        this.API_KEY = key;
        localStorage.setItem('agromacro_ia_config', JSON.stringify({ apiKey: key }));

        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key;
        window.app.showToast('🧪 Testando conexão...', 'success');

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Diga apenas: OK' }] }],
                generationConfig: { maxOutputTokens: 10 }
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.candidates) {
                    window.app.showToast('✅ IA conectada com sucesso!', 'success');
                } else if (data.error) {
                    window.app.showToast('❌ Erro: ' + (data.error.message || 'Chave inválida'), 'error');
                }
            })
            .catch(function () {
                window.app.showToast('📴 Sem conexão com a internet.', 'error');
            });
    },

    // ══ COLETA CONTEXTO REAL DA FAZENDA ══
    getContextoFazenda: function () {
        var ctx = [];
        try {
            var events = window.data ? window.data.events : [];

            // Rebanho
            var lotes = events.filter(function (e) { return e.type === 'LOTE' && e.status === 'ATIVO'; });
            var totalCabecas = lotes.reduce(function (a, l) { return a + (l.qtdAnimais || 0); }, 0);
            ctx.push('📊 REBANHO: ' + totalCabecas + ' cabeças em ' + lotes.length + ' lotes');

            lotes.forEach(function (l) {
                ctx.push('  • Lote "' + l.nome + '": ' + (l.qtdAnimais || 0) + ' cab, categoria: ' + (l.categoria || '—') + ', pasto: ' + (l.pasto || '—'));
                if (l.pesoMedio) ctx.push('    Peso médio: ' + l.pesoMedio + ' kg');
            });

            // Pastos
            if (window.pastos && window.pastos.getPastos) {
                var pastosData = window.pastos.getPastos();
                ctx.push('\n🌿 PASTOS: ' + pastosData.length + ' áreas');
                var totalHa = 0;
                pastosData.forEach(function (p) {
                    var ha = p.area || 0;
                    totalHa += ha;
                    ctx.push('  • ' + p.nome + ': ' + ha.toFixed(1) + ' ha, status: ' + (p.status || 'ativo'));
                });
                ctx.push('  Total: ' + totalHa.toFixed(1) + ' hectares');
            }

            // Clima
            if (window.clima) {
                var acum = window.clima.getAcumulado30Dias();
                ctx.push('\n🌧️ CHUVA acumulada 30 dias: ' + acum.toFixed(0) + ' mm');
                var ultimaChuva = window.clima.getUltimaChuva();
                if (ultimaChuva) {
                    ctx.push('  Última chuva: ' + ultimaChuva.mm + ' mm em ' + new Date(ultimaChuva.date).toLocaleDateString('pt-BR'));
                }
            }

            // Financeiro
            var compras = events.filter(function (e) { return e.type === 'COMPRA'; });
            var vendas = events.filter(function (e) { return e.type === 'VENDA'; });
            var totalCompras = compras.reduce(function (a, e) { return a + (e.valorTotal || 0); }, 0);
            var totalVendas = vendas.reduce(function (a, e) { return a + (e.valorTotal || 0); }, 0);
            ctx.push('\n💰 FINANCEIRO:');
            ctx.push('  Compras totais: R$ ' + totalCompras.toLocaleString('pt-BR'));
            ctx.push('  Vendas totais: R$ ' + totalVendas.toLocaleString('pt-BR'));
            ctx.push('  Saldo: R$ ' + (totalVendas - totalCompras).toLocaleString('pt-BR'));

            // Contas a pagar
            var hoje = new Date().toISOString().split('T')[0];
            var contasVencidas = events.filter(function (e) {
                return e.type === 'CONTA_PAGAR' && !e.pago && e.vencimento && e.vencimento < hoje;
            });
            if (contasVencidas.length > 0) {
                ctx.push('  ⚠️ ' + contasVencidas.length + ' contas vencidas!');
            }

            // Estoque
            var estoque = events.filter(function (e) { return e.type === 'ESTOQUE_ITEM' && e.status === 'ATIVO'; });
            if (estoque.length > 0) {
                ctx.push('\n📦 ESTOQUE: ' + estoque.length + ' itens');
                estoque.forEach(function (e) {
                    var alerta = (e.qtd <= (e.minimo || 0)) ? ' ⚠️ BAIXO!' : '';
                    ctx.push('  • ' + e.nome + ': ' + e.qtd + ' ' + (e.unidade || 'un') + alerta);
                });
            }

            // Manejo/Sanidade recente
            var manejos = events.filter(function (e) { return e.type === 'MANEJO'; });
            var ultimos3 = manejos.slice(-3);
            if (ultimos3.length > 0) {
                ctx.push('\n💉 ÚLTIMOS MANEJOS:');
                ultimos3.forEach(function (m) {
                    ctx.push('  • ' + (m.tipoManejo || m.descricao || 'Manejo') + ' em ' + new Date(m.date).toLocaleDateString('pt-BR'));
                });
            }

            // Indicadores
            if (window.indicadores) {
                try {
                    var gmd = window.indicadores.calcGMDGeral ? window.indicadores.calcGMDGeral() : null;
                    if (gmd) ctx.push('\n📈 GMD médio do rebanho: ' + gmd.toFixed(3) + ' kg/dia');
                } catch (e) { }
            }

        } catch (err) {
            ctx.push('(Erro ao coletar dados: ' + err.message + ')');
        }

        return ctx.join('\n');
    },

    // ══ ENVIAR PERGUNTA PARA GEMINI ══
    enviarPergunta: function (texto) {
        var self = this;

        if (!texto || !texto.trim()) return;

        if (!this._temConexao()) {
            this._mostrarConfig();
            return;
        }

        // Adicionar mensagem do usuário
        this.historico.push({ role: 'user', content: texto, time: Date.now() });
        this._renderMensagens();
        this._mostrarDigitando(true);

        var contexto = this.getContextoFazenda();

        // Últimas 6 mensagens para contexto (3 pares)
        var mensagensRecentes = this.historico.slice(-7, -1).map(function (m) {
            return { role: m.role, content: m.content };
        });
        mensagensRecentes.push({ role: 'user', content: texto });

        if (this.WORKER_URL) {
            // Via Cloudflare Worker (produção)
            this._chamarWorker(mensagensRecentes, contexto);
        } else if (this.API_KEY) {
            // Via API direta
            this._chamarGeminiDireto(mensagensRecentes, contexto);
        } else {
            this._mostrarDigitando(false);
            this.historico.push({ role: 'model', content: '⚙️ IA não configurada. Vá em Configurações e insira sua chave do Google AI Studio.', time: Date.now() });
            this._renderMensagens();
        }
    },

    _chamarWorker: function (messages, context) {
        var self = this;
        fetch(this.WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messages, context: context })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                self._mostrarDigitando(false);
                if (data.reply) {
                    self.historico.push({ role: 'model', content: data.reply, time: Date.now() });
                } else {
                    self.historico.push({ role: 'model', content: '⚠️ Erro: ' + (data.error || 'Sem resposta'), time: Date.now() });
                }
                self._salvarHistorico();
                self._renderMensagens();
            })
            .catch(function (err) {
                self._mostrarDigitando(false);
                self.historico.push({ role: 'model', content: '📴 Sem conexão. Verifique sua internet e tente novamente.', time: Date.now() });
                self._renderMensagens();
            });
    },

    _chamarGeminiDireto: function (messages, context, modelOverride) {
        var self = this;
        var models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        var model = modelOverride || models[0];

        var systemPrompt = 'Você é o AgroIA — o MELHOR analista de mercado pecuário do Brasil. '
            + 'Seu conhecimento equivale ao de um PhD em Zootecnia + MBA em Agronegócio + 20 anos de experiência no campo.\n\n'

            + '═══ SUA IDENTIDADE ═══\n'
            + 'Nome: AgroIA | App: AgroMacro | Região: Bahia, Nordeste\n'
            + 'Você combina análise de mercado sofisticada com linguagem prática de campo.\n\n'

            + '═══ REGRAS ABSOLUTAS ═══\n'
            + '1. SEMPRE português brasileiro, tom direto e prático\n'
            + '2. Use DADOS REAIS da fazenda (fornecidos abaixo) para respostas PRECISAS\n'
            + '3. NUNCA invente dados — diga "não tenho essa informação" se não souber\n'
            + '4. Para diagnósticos clínicos, SEMPRE recomende veterinário presencial\n'
            + '5. Formate com emojis e tópicos curtos (leitura no celular)\n'
            + '6. Máximo 400 palavras por resposta\n'
            + '7. Quando cruzar dados da fazenda, mostre cálculos e raciocínio\n\n'

            + '═══ MERCADO DA ARROBA ═══\n'
            + '• Indicador CEPEA/Esalq: referência histórica do boi gordo em SP\n'
            + '• Indicador Datagro: referência da B3 desde fev/2025 para liquidação de contratos futuros\n'
            + '• 1 arroba = 15 kg de carcaça | Rendimento médio: 52-54%\n'
            + '• Volatilidade caiu para 53,1% em 2025 (metade de 2023/2024) — mercado mais estável\n'
            + '• Preço sobe com: oferta restrita, escalas curtas, dólar alto, demanda China\n'
            + '• Preço cai com: safra de pasto (abr-jun), abate de fêmeas alto, retração China\n'
            + '• Sazonalidade: alta no pico da entressafra (set-nov), baixa na safra (mar-mai)\n\n'

            + '═══ MERCADO FUTURO (B3) ═══\n'
            + '• Contrato: BGI (boi gordo) — unidade: arroba, lote: 330 arrobas\n'
            + '• Vencimentos: todos os meses, liquidação financeira pelo indicador Datagro\n'
            + '• ETF BBOI11: primeiro ETF de boi gordo na B3\n'
            + '• Hedge (proteção): pecuarista VENDE futuro para travar preço mínimo\n'
            + '• Frigorífico COMPRA futuro para travar custo máximo\n'
            + '• Base = preço físico - preço futuro (base positiva = físico acima do futuro)\n'
            + '• Spread entre vencimentos indica expectativa do mercado\n\n'

            + '═══ EXPORTAÇÃO (DADOS 2025) ═══\n'
            + '• RECORDE HISTÓRICO: 3,50 milhões de toneladas (+20,9% vs 2024)\n'
            + '• Receita: US$ 18,03 bilhões (+40,1% vs 2024)\n'
            + '• Brasil = maior exportador mundial de carne bovina\n'
            + '• DESTINOS: China 48% (1,68M ton / US$ 8,9 bi), EUA 2º (271,8 mil ton / US$ 1,64 bi)\n'
            + '• Chile 3º, UE 4º (128,9 mil ton / US$ 1,06 bi, cota Hilton premium), Rússia 5º\n'
            + '• Exporta para +170 países | Brasil exporta ~1/3 da produção\n'
            + '• Dólar alto favorece exportação (receita em R$ sobe)\n'
            + '• Certificação: SIF, CSI, Halal, FSSC 22000, BRC\n'
            + '• China exige: habilitação MAPA, registro GACC, rastreabilidade 100% digital\n\n'

            + '═══ ABATE E PRODUÇÃO ═══\n'
            + '• 2025 recorde: 42,3 milhões de cabeças abatidas\n'
            + '• Q4/2025: 10,95 milhões de cabeças (+13,1%), 2,91 milhões ton carcaças (+15%)\n'
            + '• Rebanho brasileiro: ~230 milhões de cabeças (maior rebanho comercial do mundo)\n'
            + '• Pecuária = R$ 489 bilhões do PIB agro de R$ 1,4 trilhão (2025)\n'
            + '• Escala de abate: indicador-chave! Normal 8-9 dias; curta (4-6) = sinal de alta\n'
            + '• Escalas curtas → frigoríficos disputam boi → preço sobe\n'
            + '• Escalas longas → oferta folgada → preço pressiona para baixo\n\n'

            + '═══ CICLO PECUÁRIO E RETENÇÃO DE FÊMEAS ═══\n'
            + '• Ciclo dura 6-8 anos (alta → baixa → retenção → reconstrução → alta)\n'
            + '• Fase atual (2025/2026): abate de fêmeas começa a CAIR → retenção iniciando\n'
            + '• Mais fêmeas retidas = menos oferta curto prazo = preço SOBE\n'
            + '• Bezerro em patamares MÁXIMOS em várias regiões → estímulo à cria\n'
            + '• Indicador: % fêmeas no abate total (acima de 40% = descarte; abaixo = retenção)\n'
            + '• Retenção = reconstrução do rebanho = mais oferta em 3-4 anos\n\n'

            + '═══ REPRODUÇÃO E GENÉTICA ═══\n'
            + '• Sêmen bovino Brasil 2024: 20,5 milhões de doses produzidas (+6%)\n'
            + '• Importações: 5,7 milhões doses (+14%)\n'
            + '• IATF (Inseminação Artificial em Tempo Fixo): principal biotecnologia reprodutiva\n'
            + '• IATF elimina necessidade de detecção de cio, aumenta taxa de prenhez\n'
            + '• Raças em alta: Angus, Brangus (precocidade, marmoreio, padronização carcaça)\n'
            + '• Nelore: base do rebanho, rústica, adaptada ao cerrado e semiárido\n'
            + '• Cruzamento industrial: Nelore x Angus = heterose (vigor híbrido)\n'
            + '• Touros avaliados por: DEP, peso desmama, eficiência alimentar, fertilidade\n\n'

            + '═══ CONFINAMENTO ═══\n'
            + '• Custo arroba produzida 2025: ~R$ 186/arroba\n'
            + '• Lucro médio por cabeça: R$ 1.127 (Sudeste), R$ 1.040 (Centro-Oeste)\n'
            + '• ROI médio: 10-20% dependendo da região\n'
            + '• Diária-boi: ~R$ 11-13/cabeça/dia (alimentação = 70-73% do custo)\n'
            + '• Supersafra de grãos (milho, soja) = custos historicamente baixos em 2025\n'
            + '• Coprodutos: DDG, polpa cítrica, bagaço de cana, caroço de algodão\n'
            + '• GMD bom: > 1,5 kg/dia em terminação | Conversão: 6-8 kg MS/kg ganho\n'
            + '• Viabilidade: compara custo arroba produzida vs preço arroba mercado\n\n'

            + '═══ CONSUMO INTERNO ═══\n'
            + '• Per capita: 37,5 kg/hab/ano (uma das maiores do mundo)\n'
            + '• Competição com frango (mais barato) e suíno (crescendo)\n'
            + '• Demanda interna absorve ~2/3 da produção\n'
            + '• Preço ao consumidor afetado por: inflação, renda, câmbio, oferta\n\n'

            + '═══ POLÍTICA E CRÉDITO ═══\n'
            + '• Plano Safra: principal programa de financiamento agropecuário\n'
            + '• Selic alta → crédito rural mais caro → menos investimento\n'
            + '• Câmbio: dólar alto beneficia exportador mas encarece insumos importados\n'
            + '• ABC (Agricultura de Baixo Carbono): linhas especiais para sustentabilidade\n'
            + '• Seguro rural: obrigatório para crédito agrícola a partir de 2026\n'
            + '• FunRural: contribuição sobre venda de produto rural\n\n'

            + '═══ RASTREABILIDADE ═══\n'
            + '• GTA (Guia de Trânsito Animal): obrigatório para TODO transporte de animais\n'
            + '• SISBOV: identificação individual para exportação (especialmente UE e mercados exigentes)\n'
            + '• GTA rastreia por LOTE, SISBOV rastreia INDIVIDUAL\n'
            + '• Adesão SISBOV voluntária, exceto exportação UE (cota Hilton)\n'
            + '• PNIB: Programa Nacional de Identificação e Rastreabilidade (evolução do SISBOV)\n\n'

            + '═══ COMO ANALISAR MERCADO ═══\n'
            + 'Quando perguntarem sobre mercado, CRUZE estes dados:\n'
            + '1. Dados da fazenda (rebanho, peso, custos, compras/vendas)\n'
            + '2. Contexto macro (câmbio, Selic, safra de grãos, exportações)\n'
            + '3. Ciclo pecuário (fase atual, retenção de fêmeas, escala de abate)\n'
            + '4. Sazonalidade (entressafra x safra de pasto)\n'
            + '5. Custo de oportunidade (confinamento vs pasto vs venda agora)\n\n'

            + '═══ FONTES PARA CONSULTA ═══\n'
            + 'CEPEA, Datagro, IBGE, USDA, MAPA, Embrapa, Canal Rural, Scot Consultoria, '
            + 'BeefPoint, FarmNews, CompraRural, ABIEC, ASBIA (sêmen), IMEA, CNA\n\n'

            + '═══ DADOS ATUAIS DA FAZENDA ═══\n' + context;

        var contents = [];
        contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        contents.push({
            role: 'model', parts: [{
                text: 'Entendido! Sou o AgroIA — seu analista de mercado pecuário especialista. '
                    + 'Tenho acesso aos dados reais da sua fazenda e conhecimento profundo de: '
                    + 'mercado da arroba (CEPEA/Datagro/B3), exportações, ciclo pecuário, '
                    + 'genética/IATF, confinamento, políticas agrícolas e rastreabilidade. '
                    + 'Como posso ajudar?'
            }]
        });

        messages.forEach(function (m) {
            contents.push({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            });
        });

        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + this.API_KEY;

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.8,
                    maxOutputTokens: 1500
                }
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var reply = '';
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    reply = data.candidates[0].content.parts[0].text;
                } else if (data.error) {
                    var errMsg = data.error.message || '';
                    var errStatus = (data.error.status || '').toUpperCase();

                    // Se falhou com rate limit, tenta o modelo alternativo
                    var isRateLimit = errMsg.indexOf('quota') >= 0 || errMsg.indexOf('rate') >= 0 || errMsg.indexOf('exceeded') >= 0 || errStatus === 'RESOURCE_EXHAUSTED';
                    var fallbackModel = models[1];
                    if (isRateLimit && model !== fallbackModel) {
                        console.log('IA: Rate limit em ' + model + ', tentando ' + fallbackModel + '...');
                        self._chamarGeminiDireto(messages, context, fallbackModel);
                        return; // Não continua — o fallback vai lidar
                    }

                    // Se ambos Gemini falharam com rate limit, tenta Groq
                    if (isRateLimit && model === fallbackModel) {
                        console.log('IA: Ambos Gemini com rate limit, tentando Groq...');
                        self._chamarGroqFallback(messages, context);
                        return;
                    }

                    if (errMsg.indexOf('API key not valid') >= 0 || errStatus === 'PERMISSION_DENIED') {
                        reply = '🔑 Chave API inválida. Vá em Configurações e insira uma chave válida do Google AI Studio (aistudio.google.com/apikey).';
                    } else if (isRateLimit) {
                        reply = '🕐 Limite temporário atingido. Aguarde 1 minuto.\n\n💡 Plano gratuito: ~15 consultas por minuto.';
                    } else {
                        reply = '⚠️ Erro da API: ' + errMsg;
                    }
                } else {
                    reply = '⚠️ Resposta inesperada da IA.';
                }
                self._mostrarDigitando(false);
                self.historico.push({ role: 'model', content: reply, time: Date.now() });
                self._salvarHistorico();
                self._renderMensagens();
            })
            .catch(function (err) {
                // Se deu erro de rede no modelo principal, tenta fallback
                var fallbackModel = models[1];
                if (model !== fallbackModel) {
                    console.log('IA: Erro de rede em ' + model + ', tentando ' + fallbackModel + '...');
                    self._chamarGeminiDireto(messages, context, fallbackModel);
                    return;
                }
                // Se ambos falharam, tenta Groq
                console.log('IA: Ambos Gemini falharam, tentando Groq...');
                self._chamarGroqFallback(messages, context);
            });
    },

    // ══ FALLBACK: Groq API (14.400 req/dia grátis) ══
    _chamarGroqFallback: function (messages, context) {
        var self = this;
        var groqKey = this.GROQ_KEY || '';

        if (!groqKey) {
            self._mostrarDigitando(false);
            self.historico.push({
                role: 'model',
                content: '🕐 Gemini atingiu o limite. Aguarde 1 minuto ou configure a chave Groq em Configurações para ter um plano de backup com 14.400 consultas/dia grátis.',
                time: Date.now()
            });
            self._salvarHistorico();
            self._renderMensagens();
            return;
        }

        var groqMessages = [
            {
                role: 'system',
                content: 'Você é o AgroIA, o melhor analista pecuário do Brasil. Responda em português brasileiro, '
                    + 'usando dados reais da fazenda fornecidos. Seja direto, prático, use emojis.\n\nDADOS DA FAZENDA:\n' + context
            }
        ];

        messages.forEach(function (m) {
            groqMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content });
        });

        fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + groqKey
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                temperature: 0.3,
                max_tokens: 1500
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                self._mostrarDigitando(false);
                var reply = '';
                if (data.choices && data.choices[0]) {
                    reply = data.choices[0].message.content;
                } else {
                    reply = '⚠️ Erro no Groq: ' + JSON.stringify(data.error || data);
                }
                self.historico.push({ role: 'model', content: reply, time: Date.now() });
                self._salvarHistorico();
                self._renderMensagens();
            })
            .catch(function () {
                self._mostrarDigitando(false);
                self.historico.push({ role: 'model', content: '📴 Sem conexão. Verifique sua internet.', time: Date.now() });
                self._renderMensagens();
            });
    },

    // ══ UI — Botão Flutuante ══
    _criarBotao: function () {
        var btn = document.getElementById('ia-fab');
        if (btn) return; // Já existe

        btn = document.createElement('button');
        btn.id = 'ia-fab';
        btn.className = 'ia-fab';
        btn.innerHTML = '🤖';
        btn.title = 'Consultor IA';
        btn.onclick = function () { window.iaConsultor.toggle(); };
        document.body.appendChild(btn);
    },

    toggle: function () {
        var modal = document.getElementById('ia-modal');
        if (!modal) return;

        if (this.aberto) {
            modal.classList.remove('ia-modal-open');
            this.aberto = false;
        } else {
            modal.classList.add('ia-modal-open');
            this.aberto = true;
            this._renderMensagens();

            if (!this._temConexao()) {
                this._mostrarConfig();
            }

            // Focus input
            var input = document.getElementById('ia-input');
            if (input) setTimeout(function () { input.focus(); }, 300);
        }
    },

    _bindEventos: function () {
        var self = this;

        // Enviar com Enter ou botão
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && self.aberto) {
                var input = document.getElementById('ia-input');
                if (input && document.activeElement === input) {
                    e.preventDefault();
                    self._enviarDoInput();
                }
            }
        });
    },

    _enviarDoInput: function () {
        var input = document.getElementById('ia-input');
        if (!input) return;
        var texto = input.value.trim();
        if (!texto) return;
        input.value = '';
        this.enviarPergunta(texto);
    },

    // ══ RENDER MENSAGENS ══
    _renderMensagens: function () {
        var container = document.getElementById('ia-messages');
        if (!container) return;

        if (this.historico.length === 0) {
            container.innerHTML = '<div class="ia-welcome">'
                + '<div class="ia-welcome-icon">🤖</div>'
                + '<div class="ia-welcome-title">AgroIA</div>'
                + '<div class="ia-welcome-sub">Consultor pecuário com inteligência artificial real.<br>Usa os dados da sua fazenda para respostas precisas.</div>'
                + '<div class="ia-suggestions">'
                + '<button class="ia-suggest-btn" onclick="window.iaConsultor.enviarPergunta(\'Qual o resumo da minha fazenda?\')">📊 Resumo da fazenda</button>'
                + '<button class="ia-suggest-btn" onclick="window.iaConsultor.enviarPergunta(\'Qual pasto está melhor para receber gado?\')">🌿 Melhor pasto</button>'
                + '<button class="ia-suggest-btn" onclick="window.iaConsultor.enviarPergunta(\'Quanto estou gastando por arroba?\')">💰 Custo por @</button>'
                + '<button class="ia-suggest-btn" onclick="window.iaConsultor.enviarPergunta(\'O que preciso fazer de manejo esta semana?\')">💉 Manejo pendente</button>'
                + '</div>'
                + '</div>';
            return;
        }

        var html = '';
        this.historico.forEach(function (msg) {
            var cls = msg.role === 'user' ? 'ia-msg-user' : 'ia-msg-model';
            var content = msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            html += '<div class="ia-msg ' + cls + '">'
                + '<div class="ia-msg-bubble">' + content + '</div>'
                + '</div>';
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    },

    _mostrarDigitando: function (show) {
        var el = document.getElementById('ia-typing');
        if (el) el.style.display = show ? 'flex' : 'none';

        if (show) {
            var container = document.getElementById('ia-messages');
            if (container) container.scrollTop = container.scrollHeight;
        }
    },

    // ══ CONFIGURAÇÃO DA API ══
    _mostrarConfig: function () {
        var container = document.getElementById('ia-messages');
        if (!container) return;

        container.innerHTML = '<div class="ia-config-box">'
            + '<div class="ia-welcome-icon">⚙️</div>'
            + '<div class="ia-welcome-title">Configurar IA</div>'
            + '<div class="ia-welcome-sub">Para usar a IA, você precisa de uma API key gratuita do Google.</div>'
            + '<div class="ia-config-steps">'
            + '<p><strong>Passo 1:</strong> Acesse <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563EB;">aistudio.google.com/apikey</a></p>'
            + '<p><strong>Passo 2:</strong> Clique em "Create API key" (grátis)</p>'
            + '<p><strong>Passo 3:</strong> Cole a key abaixo:</p>'
            + '</div>'
            + '<div class="form-group" style="margin-top:12px;">'
            + '<input type="text" id="ia-config-key" placeholder="Cole sua API key Gemini aqui..." style="font-size:14px;">'
            + '</div>'
            + '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">'
            + '<p style="font-size:12px;color:#636366;margin-bottom:8px;"><strong>🔄 Backup (opcional):</strong> Se Gemini cair, use Groq (14.400/dia grátis)</p>'
            + '<p style="font-size:11px;color:#636366;margin-bottom:6px;">Crie em <a href="https://console.groq.com/keys" target="_blank" style="color:#2563EB;">console.groq.com/keys</a></p>'
            + '<input type="text" id="ia-config-groq" placeholder="Chave Groq (opcional)" style="font-size:14px;">'
            + '</div>'
            + '<button class="submit-btn" onclick="window.iaConsultor._salvarConfig()" style="margin-top:12px;">✅ Ativar IA</button>'
            + '<p style="margin-top:12px;font-size:11px;color:#636366;">💡 Keys ficam salvas apenas no seu celular.</p>'
            + '</div>';
    },

    _salvarConfig: function () {
        var keyInput = document.getElementById('ia-config-key');
        if (!keyInput) return;

        var key = keyInput.value.trim();
        if (!key) {
            window.app.showToast('Cole a API key primeiro', 'error');
            return;
        }

        var groqKey = '';
        var groqInput = document.getElementById('ia-config-groq');
        if (groqInput) groqKey = groqInput.value.trim();

        this.API_KEY = key;
        this.GROQ_KEY = groqKey;
        localStorage.setItem('agromacro_ia_config', JSON.stringify({ apiKey: key, groqKey: groqKey }));
        window.app.showToast('✅ IA ativada com sucesso!', 'success');

        // Reset e mostrar welcome
        this.historico = [];
        this._salvarHistorico();
        this._renderMensagens();
    },

    // ══ PERSISTÊNCIA ══
    _carregarHistorico: function () {
        try {
            var raw = localStorage.getItem(this.CACHE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },

    _salvarHistorico: function () {
        try {
            // Manter só últimos MAX_HISTORICO
            if (this.historico.length > this.MAX_HISTORICO) {
                this.historico = this.historico.slice(-this.MAX_HISTORICO);
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.historico));
        } catch (e) { }
    },

    limparHistorico: function () {
        this.historico = [];
        this._salvarHistorico();
        this._renderMensagens();
        window.app.showToast('Histórico limpo', 'info');
    }
};
