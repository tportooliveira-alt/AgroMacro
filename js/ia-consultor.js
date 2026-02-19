// ====== MÓDULO: IA CONSULTOR PECUÁRIO (Multi-Provedor) ======
// Cascata: Gemini Flash-Lite → Flash → Groq → Cerebras → OpenRouter
// Custo: R$ 0/mês (free tier de todos os provedores)
window.iaConsultor = {

    // ══ CONFIGURAÇÃO MULTI-PROVEDOR ══
    WORKER_URL: '',
    API_KEY: '',       // Google Gemini
    GROQ_KEY: '',      // Groq (Llama 3.3)
    CEREBRAS_KEY: '',  // Cerebras (Llama 3.3)
    OPENROUTER_KEY: '', // OpenRouter (modelos grátis)

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
            if (config.cerebrasKey) this.CEREBRAS_KEY = config.cerebrasKey;
            if (config.openrouterKey) this.OPENROUTER_KEY = config.openrouterKey;
        } catch (e) { }

        var provCount = this._contarProvedores();
        console.log('IA Consultor Ready — ' + provCount + ' provedor(es) configurado(s)');

        // Populate config fields
        var self = this;
        setTimeout(function () {
            var fields = {
                'config-api-key': self.API_KEY,
                'config-groq-key': self.GROQ_KEY,
                'config-cerebras-key': self.CEREBRAS_KEY,
                'config-openrouter-key': self.OPENROUTER_KEY
            };
            Object.keys(fields).forEach(function (id) {
                var el = document.getElementById(id);
                if (el && fields[id]) el.value = fields[id];
            });
            self._atualizarStatusProvedores();
        }, 300);
    },

    _temConexao: function () {
        return !!(this.WORKER_URL || this.API_KEY || this.GROQ_KEY || this.CEREBRAS_KEY || this.OPENROUTER_KEY);
    },

    _contarProvedores: function () {
        var c = 0;
        if (this.API_KEY) c++;
        if (this.GROQ_KEY) c++;
        if (this.CEREBRAS_KEY) c++;
        if (this.OPENROUTER_KEY) c++;
        return c;
    },

    _atualizarStatusProvedores: function () {
        var el = document.getElementById('ia-providers-status');
        if (!el) return;
        var items = [
            { name: 'Gemini', key: this.API_KEY, color: '#2563EB' },
            { name: 'Groq', key: this.GROQ_KEY, color: '#D97706' },
            { name: 'Cerebras', key: this.CEREBRAS_KEY, color: '#7C3AED' },
            { name: 'OpenRouter', key: this.OPENROUTER_KEY, color: '#059669' }
        ];
        var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
        items.forEach(function (p) {
            var on = !!p.key;
            html += '<span style="font-size:10px;padding:3px 8px;border-radius:12px;font-weight:600;'
                + (on ? 'background:' + p.color + '15;color:' + p.color : 'background:#F1F5F9;color:#94A3B8;text-decoration:line-through')
                + ';">' + (on ? '✅' : '⬜') + ' ' + p.name + '</span>';
        });
        html += '</div>';
        el.innerHTML = html;
    },

    // ══ Salvar TODAS as chaves ══
    salvarTodasChaves: function () {
        var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        this.API_KEY = get('config-api-key');
        this.GROQ_KEY = get('config-groq-key');
        this.CEREBRAS_KEY = get('config-cerebras-key');
        this.OPENROUTER_KEY = get('config-openrouter-key');
        localStorage.setItem('agromacro_ia_config', JSON.stringify({
            apiKey: this.API_KEY,
            groqKey: this.GROQ_KEY,
            cerebrasKey: this.CEREBRAS_KEY,
            openrouterKey: this.OPENROUTER_KEY
        }));
        this._atualizarStatusProvedores();
        var count = this._contarProvedores();
        window.app.showToast('🔑 ' + count + ' provedor(es) configurado(s)!', 'success');
    },

    // Backward compat
    salvarChaveConfig: function () { this.salvarTodasChaves(); },

    // ══ Testar conexão IA ══
    testarChave: function () {
        var key = (document.getElementById('config-api-key').value || '').trim();
        if (!key) {
            window.app.showToast('Cole sua chave API primeiro.', 'error');
            return;
        }
        this.API_KEY = key;
        localStorage.setItem('agromacro_ia_config', JSON.stringify({ apiKey: key }));

        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + key;
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
        var models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
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

            + '═══ SKILLS ANALÍTICAS (USE SEMPRE QUE RELEVANTE) ═══\n\n'

            + '▸ SKILL 1: HORA DE VENDER?\n'
            + 'Quando perguntarem "devo vender agora?":\n'
            + '  1. Pegue peso atual dos lotes → calcule arrobas (peso÷30×rendimento 52%)\n'
            + '  2. Calcule valor bruto: arrobas × preço arroba mercado\n'
            + '  3. Subtraia custos acumulados (compra + alimentação + sanidade + frete)\n'
            + '  4. Compare: margem atual vs margem se esperar +30/60/90 dias\n'
            + '  5. Considere: estamos em safra (mar-mai=preço cai) ou entressafra (set-nov=preço sobe)?\n'
            + '  6. Verifique escalas de abate: curtas(4-6 dias)=bom pra vender, longas=espere\n'
            + '  7. CONCLUSÃO: "Venda agora" ou "Espere X dias porque..."\n\n'

            + '▸ SKILL 2: CUSTO DE PRODUÇÃO DA ARROBA\n'
            + 'Quando perguntarem sobre custo/lucro:\n'
            + '  1. Some TODOS custos: compra + alimentação + sanidade + mão-de-obra + depreciação\n'
            + '  2. Calcule arrobas PRODUZIDAS: (peso final - peso compra) ÷ 15\n'
            + '  3. Custo por arroba = custo total ÷ arrobas produzidas\n'
            + '  4. Compare com preço arroba mercado → margem por arroba\n'
            + '  5. ROI = (receita - custo total) ÷ custo total × 100\n'
            + '  6. Benchmark: custo bom <R$180/@, médio R$180-200, ruim >R$200\n'
            + '  7. Se custo > preço mercado: ALERTA, analisar onde cortar\n\n'

            + '▸ SKILL 3: VIABILIDADE DE CONFINAMENTO\n'
            + 'Se perguntarem sobre confinar:\n'
            + '  1. Entrada: peso entrada, preço compra (R$/@)\n'
            + '  2. Diária-boi: R$11-13/cab/dia (alimentação 70%+, sanidade, mão-de-obra)\n'
            + '  3. GMD esperado: 1,2-1,8 kg/dia (depende da dieta)\n'
            + '  4. Dias estimados: (peso desejado - peso entrada) ÷ GMD\n'
            + '  5. Custo total: (diária × dias) + compra\n'
            + '  6. Arrobas na saída: peso saída × rendimento 52% ÷ 15\n'
            + '  7. Receita bruta: arrobas × preço futuro (B3 ou estimativa)\n'
            + '  8. Lucro: receita - custo total | ROI: lucro ÷ custo × 100\n'
            + '  9. VIÁVEL se ROI > 8% e margem > R$150/cab\n\n'

            + '▸ SKILL 4: COMPRA DE BEZERRO/REPOSIÇÃO\n'
            + 'Se perguntarem sobre comprar gado:\n'
            + '  1. Relação de troca: preço bezerro ÷ preço arroba boi gordo\n'
            + '  2. Relação BOA: <8 arrobas por bezerro | RUIM: >10\n'
            + '  3. Calcule custo total até venda: bezerro + recria + terminação\n'
            + '  4. Tempo estimado: bezerro→boi gordo = 18-24 meses (pasto) ou 12-15 (semi-confine)\n'
            + '  5. Verifique sazonalidade: bezerro mais barato na safra (abr-jun)\n'
            + '  6. Considere: fêmeas retendo = bezerro caro agora = oferta apertada futura\n'
            + '  7. Cruze com dados da fazenda: tem pasto? Tem capim?\n\n'

            + '▸ SKILL 5: ANÁLISE DE PASTO E ROTAÇÃO\n'
            + 'Se perguntarem sobre pasto/lotação:\n'
            + '  1. UA/ha: peso vivo ÷ 450 = Unidade Animal | Lotação = UAs ÷ hectares\n'
            + '  2. Lotação ideal a pasto: 1,2-2,0 UA/ha (depende do capim e chuva)\n'
            + '  3. Cruze com chuva acumulada 30d: <50mm = seca, deslotar\n'
            + '  4. Rotação: mínimo 30 dias descanso por piquete (mais na seca)\n'
            + '  5. Se lotação > 2 UA/ha E chuva < 50mm: ALERTA superpastejo\n'
            + '  6. Calcule capacidade: total ha × lotação ideal = quantos animais cabem\n'
            + '  7. Use dados dos pastos da fazenda + dados pluviométricos\n\n'

            + '▸ SKILL 6: SAÚDE FINANCEIRA DA FAZENDA\n'
            + 'Se perguntarem "como estou financeiramente?":\n'
            + '  1. Receita total: soma vendas + valor estimado do rebanho atual\n'
            + '  2. Valor rebanho: total arrobas × preço arroba\n'
            + '  3. Custos acumulados: compras + contas pagas + contas a pagar\n'
            + '  4. Margem operacional: (receita - custos) ÷ receita × 100\n'
            + '  5. Contas vencidas: ALERTAR se tiver!\n'
            + '  6. Patrimônio em estoque: valor itens de estoque\n'
            + '  7. Fluxo de caixa: entrada prevista (vendas futuras) vs saída (contas a vencer)\n\n'

            + '▸ SKILL 7: GENÉTICA E REPRODUÇÃO\n'
            + 'Se perguntarem sobre genética/cria:\n'
            + '  1. Taxa de prenhez ideal: >80% (IATF) ou >60% (monta natural)\n'
            + '  2. Custo IATF: ~R$35-50/vaca (sêmen + protocolo + mão-de-obra)\n'
            + '  3. Relação touro:vacas = 1:25 (monta) ou eliminado com IATF\n'
            + '  4. DEP (Diferença Esperada na Progênie): avaliar touros\n'
            + '  5. Cruzamento industrial: Nelore ♀ × Angus ♂ = novilho precoce\n'
            + '  6. Sêmen sexado: mais caro mas garante fêmeas para reposição\n'
            + '  7. ROI genética: bezerro cruzado vale 15-20% mais que puro Nelore\n\n'

            + '▸ SKILL 8: ANÁLISE COMPLETA DE MERCADO\n'
            + 'Se perguntarem "como está o mercado?":\n'
            + '  1. OFERTA: abate de machos + fêmeas, escala de abate, confinamento\n'
            + '  2. DEMANDA: exportação (China!), consumo interno, sazonalidade\n'
            + '  3. PREÇO: tendência arroba últimos meses, B3 futuro\n'
            + '  4. MACRO: dólar (exportação), Selic (crédito), inflação\n'
            + '  5. CICLO: fase atual (retenção/descarte), perspectiva 6-12 meses\n'
            + '  6. IMPACTO NA FAZENDA: cruze com dados reais — quanto vale seu rebanho agora?\n'
            + '  7. RECOMENDAÇÃO: ação concreta baseada na posição da fazenda\n\n'

            + '▸ SKILL 9: VENDA A TERMO (CONTRATO COM FRIGORÍFICO)\n'
            + 'Se perguntarem sobre venda a termo/contrato antecipado:\n'
            + '  COMO FUNCIONA:\n'
            + '  1. Acordo direto entre pecuarista e frigorífico para data futura\n'
            + '  2. Fixa-se preço da arroba HOJE para entrega em 30/60/90/120 dias\n'
            + '  3. Animal: boi gordo, macho castrado, 450-550 kg, máx 42 meses\n'
            + '  4. Frigorífico cuida da burocracia — mais simples que B3\n'
            + '  5. Em algumas modalidades: se mercado subir, produtor recebe o maior valor!\n'
            + '  VANTAGENS:\n'
            + '  ✅ Preço garantido — sabe exatamente quanto vai receber\n'
            + '  ✅ Sem necessidade de conta em corretora\n'
            + '  ✅ Sem ajuste diário (diferente do futuro na B3)\n'
            + '  ✅ Foco na produção, não na bolsa\n'
            + '  ✅ Planejamento financeiro seguro\n'
            + '  DESVANTAGENS E RISCOS:\n'
            + '  ❌ Se arroba subir muito, pode perder a alta (depende do contrato)\n'
            + '  ❌ Risco do frigorífico não pagar (avaliar solidez financeira!)\n'
            + '  ❌ Frigoríficos podem reduzir ofertas em períodos de incerteza\n'
            + '  ❌ Precisa conhecer bem seu custo pra não travar preço ruim\n'
            + '  QUANDO USAR: quando precisa de previsibilidade, tem custos fixos altos\n\n'

            + '▸ SKILL 10: CPR — CÉDULA DE PRODUTO RURAL\n'
            + 'Se perguntarem sobre CPR/financiamento/banco/antecipação:\n'
            + '  O QUE É:\n'
            + '  1. Título de crédito: promessa de entrega futura de boi gordo\n'
            + '  2. Emite a CPR → banco compra → recebe dinheiro antecipado\n'
            + '  3. Na data futura: entrega o boi (CPR Física) ou paga em dinheiro (CPR Financeira)\n'
            + '  TIPOS:\n'
            + '  • CPR FÍSICA: compromete entregar o gado (em arrobas) — venda antecipada\n'
            + '  • CPR FINANCEIRA: paga o valor em reais no vencimento — é um empréstimo\n'
            + '  ONDE FAZER:\n'
            + '  • Banco do Brasil, Sicredi, Sicoob, bancos privados, cooperativas\n'
            + '  • Prazo: 20 a 360 dias\n'
            + '  • Desde 2024: obrigatório registrar na B3 (mais segurança)\n'
            + '  GARANTIAS EXIGIDAS:\n'
            + '  • Penhor pecuário (os próprios animais), hipoteca ou alienação fiduciária\n'
            + '  VANTAGENS:\n'
            + '  ✅ Antecipa receita — capital de giro IMEDIATO\n'
            + '  ✅ CPR Financeira: ISENTA de IOF!\n'
            + '  ✅ Menos burocracia que empréstimo tradicional\n'
            + '  ✅ Pode usar para comprar insumos, pagar contas, investir\n'
            + '  ✅ Não precisa esperar o boi ficar gordo para ter dinheiro\n'
            + '  DESVANTAGENS E RISCOS:\n'
            + '  ❌ Juros embutidos (banco desconta spread na compra)\n'
            + '  ❌ Se preço subir muito, já vendeu barato\n'
            + '  ❌ Garantia real obrigatória (animais ficam penhorados)\n'
            + '  ❌ Se não entregar/pagar: execução judicial\n'
            + '  QUANDO USAR: quando precisa de capital de giro urgente\n\n'

            + '▸ SKILL 11: HEDGE NA B3 (TRAVAR PREÇO NA BOLSA)\n'
            + 'Se perguntarem sobre hedge/travar/bolsa/opções/PUT/CALL:\n'
            + '  CONTRATO FUTURO (BGI):\n'
            + '  1. Cada contrato = 330 arrobas (~18-20 animais)\n'
            + '  2. Pecuarista VENDE contrato futuro → trava preço mínimo\n'
            + '  3. Código: BGI + letra do mês + ano (ex: BGIV26 = outubro 2026)\n'
            + '  4. Liquidação FINANCEIRA (não entrega boi, só recebe/paga diferença)\n'
            + '  5. TEM ajuste diário: se mercado subir, paga margem (custo!)\n'
            + '  6. Se mercado cai: recebe a diferença, compensando perda no físico\n'
            + '  OPÇÃO DE VENDA (PUT) — O SEGURO DO PECUARISTA:\n'
            + '  1. Compra PUT = garante preço MÍNIMO (strike) para suas arrobas\n'
            + '  2. Paga um "prêmio" (custo do seguro) — esse é seu risco máximo\n'
            + '  3. Se mercado CAIR abaixo do strike: exerce a opção, recebe o mínimo\n'
            + '  4. Se mercado SUBIR acima do strike: NÃO exerce, vende no mercado à vista\n'
            + '  5. MELHOR DOS DOIS MUNDOS: piso de preço + participa da alta!\n'
            + '  6. SEM ajuste diário, sem chamada de margem\n'
            + '  PASSO A PASSO:\n'
            + '  1. Conheça seu custo de produção (crucial!)\n'
            + '  2. Abra conta em corretora (XP, Genial, BTG, etc)\n'
            + '  3. Escolha vencimento que bate com sua venda planejada\n'
            + '  4. Decida: futuro (trava rígida) ou PUT (trava com flexibilidade)\n'
            + '  5. Calcule quantos contratos: total arrobas ÷ 330\n'
            + '  6. Execute e acompanhe\n'
            + '  VANTAGENS:\n'
            + '  ✅ Proteção profissional contra queda de preço\n'
            + '  ✅ PUT permite participar da alta\n'
            + '  ✅ Liquidez diária (pode encerrar a qualquer momento)\n'
            + '  ✅ Transparência (preços públicos da B3)\n'
            + '  DESVANTAGENS:\n'
            + '  ❌ Futuro tem ajuste diário (precisa de caixa)\n'
            + '  ❌ Lote mínimo: 330 arrobas (não serve para rebanhos muito pequenos)\n'
            + '  ❌ Precisa de corretora e algum conhecimento\n'
            + '  ❌ Prêmio da PUT é custo perdido se mercado subir\n'
            + '  QUANDO USAR: quando tem volume significativo e quer proteção profissional\n\n'

            + '▸ SKILL 12: COMPARATIVO — QUAL MODALIDADE USAR?\n'
            + 'Se perguntarem "qual o melhor caminho pra vender?":\n'
            + '  VENDA NORMAL (spot): vende no dia, preço do dia. Simples, sem proteção.\n'
            + '  VENDA A TERMO: trava preço com frigorífico. Bom pra quem quer simplicidade.\n'
            + '  CPR: antecipa dinheiro. Bom pra quem precisa de capital agora.\n'
            + '  FUTURO B3: trava preço na bolsa. Bom pra volumes maiores, tem ajuste diário.\n'
            + '  PUT B3: seguro de preço. MELHOR opção pra quem pode pagar o prêmio.\n'
            + '  REGRA DE OURO:\n'
            + '  • Rebanho <100 cab → venda a termo com frigorífico\n'
            + '  • Rebanho 100-500 cab → CPR para capital + venda a termo\n'
            + '  • Rebanho >500 cab → hedge na B3 (futuro ou PUT)\n'
            + '  • Precisa de dinheiro AGORA → CPR Financeira com banco\n'
            + '  • Quer preço mínimo SEM perder alta → compra PUT\n'
            + '  • Quer previsibilidade total → vende futuro na B3\n'
            + '  SEMPRE calcule: custo total + margem desejada = preço mínimo aceitável\n\n'

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

                    // Se ambos Gemini falharam com rate limit, tenta próximo provedor
                    if (isRateLimit && model === fallbackModel) {
                        console.log('IA: Ambos Gemini com rate limit, tentando próximo provedor...');
                        self._chamarProximoFallback('gemini', messages, context);
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
                // Se ambos falharam, tenta próximo
                console.log('IA: Ambos Gemini falharam, tentando próximo...');
                self._chamarProximoFallback('gemini', messages, context);
            });
    },

    // ══ CASCATA: decide próximo provedor após falha ══
    _chamarProximoFallback: function (falhou, messages, context) {
        var ordem = ['gemini', 'groq', 'cerebras', 'openrouter'];
        var idx = ordem.indexOf(falhou);

        // Tenta cada provedor após o que falhou
        for (var i = idx + 1; i < ordem.length; i++) {
            var prov = ordem[i];
            if (prov === 'groq' && this.GROQ_KEY) {
                console.log('IA Cascata → Groq');
                this._chamarGroqFallback(messages, context);
                return;
            }
            if (prov === 'cerebras' && this.CEREBRAS_KEY) {
                console.log('IA Cascata → Cerebras');
                this._chamarCerebrasFallback(messages, context);
                return;
            }
            if (prov === 'openrouter' && this.OPENROUTER_KEY) {
                console.log('IA Cascata → OpenRouter');
                this._chamarOpenRouterFallback(messages, context);
                return;
            }
        }

        // Nenhum provedor disponível
        this._mostrarDigitando(false);
        var count = this._contarProvedores();
        this.historico.push({
            role: 'model',
            content: '🕐 Todos os ' + count + ' provedor(es) atingiram o limite.\n\n'
                + '💡 **Soluções:**\n'
                + '• Aguarde 1 minuto e tente novamente\n'
                + '• Configure mais provedores em ⚙️ Configurações\n'
                + '• Provedores grátis: Gemini, Groq, Cerebras, OpenRouter',
            time: Date.now()
        });
        this._salvarHistorico();
        this._renderMensagens();
    },

    // ══ Prompt base para APIs OpenAI-compatíveis ══
    _buildOpenAIMessages: function (messages, context) {
        var sysMsg = [{
            role: 'system',
            content: 'Você é o AgroIA, o melhor analista pecuário do Brasil. Responda em português brasileiro, '
                + 'usando dados reais da fazenda fornecidos. Seja direto, prático, use emojis. Máximo 400 palavras.\n\nDADOS DA FAZENDA:\n' + context
        }];
        messages.forEach(function (m) {
            sysMsg.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content });
        });
        return sysMsg;
    },

    // ══ FALLBACK 1: Groq API (14.400 req/dia grátis) ══
    _chamarGroqFallback: function (messages, context) {
        var self = this;
        if (!this.GROQ_KEY) {
            this._chamarProximoFallback('groq', messages, context);
            return;
        }

        var groqMessages = this._buildOpenAIMessages(messages, context);

        fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.GROQ_KEY
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
                if (data.choices && data.choices[0]) {
                    self._mostrarDigitando(false);
                    self.historico.push({ role: 'model', content: data.choices[0].message.content, time: Date.now() });
                    self._salvarHistorico();
                    self._renderMensagens();
                } else {
                    console.log('IA: Groq falhou, tentando próximo...', data.error);
                    self._chamarProximoFallback('groq', messages, context);
                }
            })
            .catch(function () {
                console.log('IA: Groq erro de rede, tentando próximo...');
                self._chamarProximoFallback('groq', messages, context);
            });
    },

    // ══ FALLBACK 2: Cerebras API (1M tokens/dia grátis) ══
    _chamarCerebrasFallback: function (messages, context) {
        var self = this;
        if (!this.CEREBRAS_KEY) {
            this._chamarProximoFallback('cerebras', messages, context);
            return;
        }

        var cbrMessages = this._buildOpenAIMessages(messages, context);

        fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.CEREBRAS_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b',
                messages: cbrMessages,
                temperature: 0.3,
                max_tokens: 1500
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.choices && data.choices[0]) {
                    self._mostrarDigitando(false);
                    self.historico.push({ role: 'model', content: data.choices[0].message.content, time: Date.now() });
                    self._salvarHistorico();
                    self._renderMensagens();
                } else {
                    console.log('IA: Cerebras falhou, tentando próximo...', data.error);
                    self._chamarProximoFallback('cerebras', messages, context);
                }
            })
            .catch(function () {
                console.log('IA: Cerebras erro de rede, tentando próximo...');
                self._chamarProximoFallback('cerebras', messages, context);
            });
    },

    // ══ FALLBACK 3: OpenRouter API (modelos grátis) ══
    _chamarOpenRouterFallback: function (messages, context) {
        var self = this;
        if (!this.OPENROUTER_KEY) {
            this._chamarProximoFallback('openrouter', messages, context);
            return;
        }

        var orMessages = this._buildOpenAIMessages(messages, context);

        fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.OPENROUTER_KEY,
                'HTTP-Referer': window.location.href,
                'X-Title': 'AgroMacro'
            },
            body: JSON.stringify({
                model: 'google/gemma-3-4b-it:free',
                messages: orMessages,
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
                    reply = '⚠️ Todos os provedores falharam. Verifique suas chaves em Configurações.';
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
