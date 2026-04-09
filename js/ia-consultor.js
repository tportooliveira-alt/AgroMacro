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
    MERCADO_CACHE_KEY: 'agromacro_mercado',
    MERCADO_CACHE_HORAS: 12,
    MAX_HISTORICO: 20,
    historico: [],
    aberto: false,
    _tooltipTimer: null,
    _badgeCount: 0,
    _telaAtual: 'home',

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
        // Só atualiza se o campo tiver valor (não apaga chave existente quando campo vazio)
        var gemini = get('config-api-key') || this.API_KEY || '';
        var groq = get('config-groq-key') || this.GROQ_KEY || '';
        var cerebras = get('config-cerebras-key') || this.CEREBRAS_KEY || '';
        var openrouter = get('config-openrouter-key') || this.OPENROUTER_KEY || '';

        this.API_KEY = gemini;
        this.GROQ_KEY = groq;
        this.CEREBRAS_KEY = cerebras;
        this.OPENROUTER_KEY = openrouter;

        localStorage.setItem('agromacro_ia_config', JSON.stringify({
            apiKey: gemini,
            groqKey: groq,
            cerebrasKey: cerebras,
            openrouterKey: openrouter
        }));
        this._atualizarStatusProvedores();
        var count = this._contarProvedores();
        window.app.showToast('🔑 ' + count + ' provedor(es) configurado(s)!', 'success');
    },

    // Backward compat
    salvarChaveConfig: function () { this.salvarTodasChaves(); },

    // ══ Testar conexão IA ══
    testarChave: function () {
        // Salvar TODAS as chaves primeiro (não sobrescrever!)
        this.salvarTodasChaves();

        if (!this._temConexao()) {
            window.app.showToast('Cole pelo menos uma chave API.', 'error');
            return;
        }

        var self = this;
        var resultados = [];

        // Testar cada provedor configurado
        if (this.API_KEY) {
            resultados.push(this._testarProvedor('Gemini',
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + this.API_KEY,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Diga apenas: OK' }] }], generationConfig: { maxOutputTokens: 10 } }) },
                function (data) { return !!(data.candidates); }
            ));
        }
        if (this.GROQ_KEY) {
            resultados.push(this._testarProvedor('Groq',
                'https://api.groq.com/openai/v1/chat/completions',
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.GROQ_KEY }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Diga apenas: OK' }], max_tokens: 10 }) },
                function (data) { return !!(data.choices); }
            ));
        }
        if (this.CEREBRAS_KEY) {
            resultados.push(this._testarProvedor('Cerebras',
                'https://api.cerebras.ai/v1/chat/completions',
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.CEREBRAS_KEY }, body: JSON.stringify({ model: 'llama3.3-70b', messages: [{ role: 'user', content: 'Diga apenas: OK' }], max_tokens: 10 }) },
                function (data) { return !!(data.choices); }
            ));
        }
        if (this.OPENROUTER_KEY) {
            resultados.push(this._testarProvedor('OpenRouter',
                'https://openrouter.ai/api/v1/chat/completions',
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.OPENROUTER_KEY, 'HTTP-Referer': window.location.href, 'X-Title': 'AgroMacro' }, body: JSON.stringify({ model: 'google/gemma-3-4b-it:free', messages: [{ role: 'user', content: 'Diga apenas: OK' }], max_tokens: 10 }) },
                function (data) { return !!(data.choices); }
            ));
        }

        window.app.showToast('🧪 Testando ' + resultados.length + ' provedor(es)...', 'success');

        Promise.all(resultados).then(function (results) {
            var ok = results.filter(function (r) { return r.ok; });
            var falhas = results.filter(function (r) { return !r.ok; });
            if (ok.length > 0) {
                var nomes = ok.map(function (r) { return r.name; }).join(', ');
                window.app.showToast('✅ ' + ok.length + '/' + results.length + ' conectado(s): ' + nomes, 'success');
            }
            if (falhas.length > 0) {
                falhas.forEach(function (f) {
                    console.warn('IA Teste falhou: ' + f.name + ' — ' + f.erro);
                });
                if (ok.length === 0) {
                    window.app.showToast('❌ Nenhum provedor conectou. Verifique as chaves.', 'error');
                }
            }
        });
    },

    _testarProvedor: function (nome, url, fetchOptions, checkOk) {
        return fetch(url, fetchOptions)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (checkOk(data)) {
                    return { name: nome, ok: true };
                } else {
                    var errMsg = data.error ? (data.error.message || JSON.stringify(data.error)) : 'Resposta inesperada';
                    return { name: nome, ok: false, erro: errMsg };
                }
            })
            .catch(function (err) {
                return { name: nome, ok: false, erro: err.message || 'Sem resposta' };
            });
    },



    // ══ COLETA CONTEXTO REAL DA FAZENDA ══
    getContextoFazenda: function () {
        var ctx = [];
        try {
            var events = window.data ? window.data.events : [];

            // Localização Geográfica
            if (window.clima && window.clima.LAT) {
                ctx.push('📍 LOCALIZAÇÃO: Lat ' + window.clima.LAT.toFixed(4) + ', Lon ' + window.clima.LON.toFixed(4));
            }

            // Rebanho
            var lotes = events.filter(function (e) { return e.type === 'LOTE' && e.status === 'ATIVO'; });
            var totalCabecas = lotes.reduce(function (a, l) { return a + (l.qtdAnimais || 0); }, 0);
            ctx.push('📊 REBANHO: ' + totalCabecas + ' cabeças em ' + lotes.length + ' lotes');

            lotes.forEach(function (l) {
                ctx.push('  • Lote "' + l.nome + '": ' + (l.qtdAnimais || 0) + ' cab, categoria: ' + (l.categoria || '—') + ', pasto: ' + (l.pasto || '—'));
                if (l.pesoMedio) ctx.push('    Peso médio: ' + l.pesoMedio + ' kg');
            });

            // Pastos e Lotação Macro
            if (window.pastos && window.pastos.getPastos) {
                var pastosData = window.pastos.getPastos();
                var totalHa = pastosData.reduce(function (a, p) { return a + (p.area || 0); }, 0);

                // Cálculo de UA (Unidade Animal = 450kg)
                var pesoVivoTotal = lotes.reduce(function (a, l) {
                    return a + ((l.qtdAnimais || 0) * (l.pesoMedio || 0));
                }, 0);
                var totalUA = pesoVivoTotal / 450;
                var lotacaoGeral = totalHa > 0 ? (totalUA / totalHa) : 0;

                ctx.push('\n🌿 PASTAS EÁREA TOTAL: ' + totalHa.toFixed(1) + ' ha');
                ctx.push('⚖️ LOTAÇÃO GERAL DA FAZENDA: ' + lotacaoGeral.toFixed(2) + ' UA/ha (Total: ' + totalUA.toFixed(1) + ' UA)');

                ctx.push('\nDetalhamento por Piquete:');
                pastosData.forEach(function (p) {
                    var ha = p.area || 0;
                    ctx.push('  • ' + p.nome + ': ' + ha.toFixed(1) + ' ha, status: ' + (p.status || 'ativo'));
                });
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

            // ── Dados de mercado (cache) ──
            var mercado = this.getMercado();
            if (mercado) {
                ctx.push('\n📊 MERCADO ATUALIZADO (' + (mercado.data || 'cache') + '):');
                if (mercado.arrobaSP) ctx.push('  Arroba CEPEA/SP: R$ ' + Number(mercado.arrobaSP).toFixed(2));
                if (mercado.arrobaBA) ctx.push('  Arroba BA: R$ ' + Number(mercado.arrobaBA).toFixed(2));
                if (mercado.arrobaGO) ctx.push('  Arroba GO: R$ ' + Number(mercado.arrobaGO).toFixed(2));
                if (mercado.arrobaMT) ctx.push('  Arroba MT: R$ ' + Number(mercado.arrobaMT).toFixed(2));
                if (mercado.arrobaMS) ctx.push('  Arroba MS: R$ ' + Number(mercado.arrobaMS).toFixed(2));
                if (mercado.tendencia) ctx.push('  Tendência: ' + mercado.tendencia + ' (' + (mercado.variacao7d || '') + ' na semana)');
                if (mercado.bezerro) ctx.push('  Bezerro: R$ ' + Number(mercado.bezerro).toFixed(2));
                if (mercado.rt) ctx.push('  Relação de Troca: ' + mercado.rt.toFixed(1) + ' @/bezerro');
                if (mercado.dolar) ctx.push('  Dólar: R$ ' + Number(mercado.dolar).toFixed(2));
                if (mercado.milho60kg) ctx.push('  Milho 60kg: R$ ' + Number(mercado.milho60kg).toFixed(2));
                if (mercado.escalas) ctx.push('  Escalas de abate: ' + mercado.escalas);
                if (mercado.exportacao) ctx.push('  Exportação: ' + mercado.exportacao);
                if (mercado.noticias && mercado.noticias.length > 0) {
                    ctx.push('  NOTÍCIAS:');
                    mercado.noticias.forEach(function (n) {
                        ctx.push('    • ' + n.titulo + ': ' + n.resumo);
                    });
                }
                if (mercado.analise) ctx.push('  ANÁLISE: ' + mercado.analise);
            }

            // ── Metas estratégicas ativas ──
            var metas = events.filter(function (e) {
                return e.type === 'META_MERCADO' && e.status === 'ATIVA' && !e.estornado;
            });
            if (metas.length > 0) {
                ctx.push('\n🎯 METAS ESTRATÉGICAS ATIVAS:');
                var precoRef = mercado ? (mercado.arrobaBA || mercado.arrobaSP || 0) : 0;
                metas.forEach(function (m) {
                    var pct = precoRef > 0 ? ((precoRef / m.precoAlvo) * 100).toFixed(0) : '--';
                    ctx.push('  • ' + (m.tipoMeta || 'venda').toUpperCase() + ': R$ ' + (m.precoAlvo || 0).toFixed(2) + '/@'
                        + ' | ' + (m.qtdArrobas || 0) + '@ | ' + (m.modalidade || 'spot')
                        + ' | Progresso: ' + pct + '%'
                        + (m.dataLimite ? ' | Limite: ' + m.dataLimite : ''));
                });
            }

            if (window.iaAuditoria) {
                try {
                    var anomalias = (window.data && window.data.events || []).filter(function (e) {
                        return e.type === 'ANOMALIA' && e.status === 'PENDENTE';
                    });
                    if (anomalias.length > 0) {
                        ctx.push('\n🛡 AUDITORIA — ' + anomalias.length + ' ANOMALIA(S) PENDENTE(S):');
                        anomalias.slice(0, 5).forEach(function (a, i) {
                            ctx.push('  ' + (i + 1) + '. [' + (a.severidade || '?') + '] ' + (a.indicador || '') + ': ' + (a.descricao || ''));
                        });
                        if (anomalias.length > 5) {
                            ctx.push('  ... e mais ' + (anomalias.length - 5) + ' anomalia(s)');
                        }
                        ctx.push('\n📋 PASSOS DE RACIOCÍNIO (Chain-of-Thought):');
                        ctx.push('  1. Verificar totais por centro de custo');
                        ctx.push('  2. Comparar com medias historicas (ultimos 90 dias)');
                        ctx.push('  3. Isolar eventos fora de 2 desvios-padrao');
                        ctx.push('  4. Classificar por gravidade: ALTA / MEDIA / BAIXA');
                        ctx.push('  5. Apresentar recomendacao pratica ao gestor');
                    }
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
            // Via API direta Gemini
            this._chamarGeminiDireto(mensagensRecentes, contexto);
        } else if (this.GROQ_KEY || this.CEREBRAS_KEY || this.OPENROUTER_KEY) {
            // Sem Gemini, mas tem outro provedor — cascateia direto
            this._chamarProximoFallback('gemini', mensagensRecentes, contexto);
        } else {
            this._mostrarDigitando(false);
            this.historico.push({ role: 'model', content: '⚙️ IA não configurada. Vá em Configurações e insira pelo menos uma chave API.', time: Date.now() });
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
        var models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
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
            + '7. Quando cruzar dados da fazenda, mostre cálculos e raciocínio\n'
            + '8. NUNCA diga "não tenho acesso a dados em tempo real" — quando Google Search estiver ativo, USE os dados reais. Quando não estiver, use os dados de referência abaixo e diga a fonte.\n'
            + '9. Para preços, SEMPRE cite a fonte (CEPEA, Datagro, B3, Scot) e a data do dado\n\n'

            + '═══ CONSCIÊNCIA GEOGRÁFICA ═══\n'
            + '• Você sabe a localização exata da fazenda (Lat/Lon e Região).\n'
            + '• Use os dados de Localização para ler o clima e mercado regional com mais precisão.\n'
            + '• Ao usar Google Search, foque em notícias pecuárias da região específica da fazenda.\n\n'

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

            + '▸ SKILL 5: MANEJO CIENTÍFICO DE PASTO E ROTAÇÃO\n'
            + 'REGRAS CIÊNTIFICAS (EMBRAPA/ACADEMIA):\n'
            + '  1. PRIORIDADE MACRO: A Lotação Geral (< 0.8 UA/ha) indica folga global. 1 UA = 450kg.\n'
            + '  2. ALTURA DE MANEJO: Fundamental para rebrote.\n'
            + '     • Brachiaria: Entrada 30-40cm | Saída 20-25cm.\n'
            + '     • Panicum (Mombaça): Entrada 80-90cm | Saída 40-50cm.\n'
            + '  3. TEMPO DE DESCANSO: Essencial 21-35 dias (águas) para a planta se recuperar.\n'
            + '  4. TEMPO DE OCUPAÇÃO: Ideal 1-3 dias. Máximo 7 dias. Passar disso degrada o pasto.\n'
            + '  5. ALERTA DE CHUVA (REGRA DE OURO): Se Chuva Acumulada 30 dias < 50mm, o capim PARA de crescer. Alerte para reduzir carga (deslotar).\n'
            + '  6. ANÁLISE CONTEXTUAL: Lotação momentânea alta (> 3 UA/ha) é ACEITÁVEL se for por apenas 1-3 dias e a Lotação Geral da fazenda for baixa.\n'
            + '  7. SÓ EMITA ALERTA DE SUPERPASTEJO SE: (Lotação Geral > 1.8 UA/ha) OU (Ocupação > 10 dias) OU (Chuva < 30mm e carga alta).\n\n'

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

            + '▸ SKILL 14: METAS ESTRATÉGICAS DE MERCADO\n'
            + 'Quando o usuário pedir para TRAÇAR META, DEFINIR ESTRATÉGIA ou PLANEJAR VENDA:\n'
            + '  1. Pergunte: qual o PREÇO ALVO da arroba? (ex: R$340/@)\n'
            + '  2. Pergunte: qual a DATA LIMITE? (ex: até junho 2026)\n'
            + '  3. Pergunte: qual MODALIDADE? (spot, a termo, futuro B3, PUT)\n'
            + '  4. Calcule: com o rebanho atual, quantas arrobas tem disponível?\n'
            + '  5. Calcule: receita estimada a preço alvo vs preço atual\n'
            + '  6. Analise: contexto do ciclo pecuário — estamos subindo ou descendo?\n'
            + '  7. Recomende: janela ideal de venda baseada em sazonalidade\n'
            + '  8. SALVE A META com TRACAR_META para acompanhamento futuro\n'
            + '  9. A cada consulta futura, compare preço atual vs meta e avise progresso\n\n'
            + '  EXEMPLO DE META SALVA:\n'
            + '  {tipo:"venda", precoAlvo:340, dataLimite:"2026-06-30", modalidade:"a_termo",\n'
            + '   lote:"engorda", qtdArrobas:500, observacao:"Esperar entressafra"}\n\n'
            + '  QUANDO CONSULTAR MERCADO, SEMPRE cruze com metas ativas:\n'
            + '  • Se preço atual >= meta → "🎯 META ATINGIDA! Hora de executar!"\n'
            + '  • Se preço 90-99% da meta → "📈 Quase lá! Preço a X% da meta"\n'
            + '  • Se preço < 80% da meta → "⏳ Mercado ainda não chegou. Acompanhe."\n\n'

            + '═══ SKILL 13: SECRETÁRIA — EXECUTAR AÇÕES NO APP ═══\n'
            + 'Você também é a SECRETÁRIA da fazenda. Quando o usuário pedir para REGISTRAR, CADASTRAR, ADICIONAR ou MOVER algo, '
            + 'você EXECUTA a ação incluindo um bloco JSON no final da sua resposta.\n\n'
            + 'FORMATO OBRIGATÓRIO (coloque no FINAL da resposta, após o texto normal):\n'
            + '```json_action\n'
            + '[{"tipo": "TIPO_ACAO", "dados": {...}}]\n'
            + '```\n\n'
            + 'AÇÕES DISPONÍVEIS:\n'
            + '═ REGISTRO (criam/modificam dados) ═\n'
            + '• REGISTRAR_LOTE — dados: {nome, qtdAnimais, categoria("engorda"/"cria"/"recria"), pasto, pesoMedio, raca}\n'
            + '• REGISTRAR_COMPRA — dados: {qtd, valor, pesoMedio, descricao, fornecedor, lote, pasto}\n'
            + '• REGISTRAR_VENDA — dados: {qtd, valor, pesoMedio, descricao, comprador, lote}\n'
            + '• MOVER_LOTE — dados: {lote, pastoDe, pastoPara}\n'
            + '• REGISTRAR_MORTE — dados: {lote, qtd, motivo}\n'
            + '• REGISTRAR_NASCIMENTO — dados: {lote, qtd, sexo}\n'
            + '• REGISTRAR_PESAGEM — dados: {lote, pesoMedio}\n'
            + '• REGISTRAR_CONTA — dados: {descricao, valor, vencimento}\n'
            + '• REGISTRAR_ESTOQUE — dados: {nome, quantidade, unidade("kg"/"saco"/"litro"/"dose"/"un"), valorUnitario, valorTotal, categoria}\n'
            + '• BAIXAR_ESTOQUE — dados: {nome, quantidade, motivo}\n'
            + '• REGISTRAR_MANEJO — dados: {lote, tipoManejo("sanitario"/"reprodutivo"/"pesagem"/"vermifugacao"), produtos, observacao}\n'
            + '• TRACAR_META — dados: {tipo("venda"/"compra"), precoAlvo, dataLimite, modalidade("spot"/"a_termo"/"futuro"/"put"), lote, qtdArrobas, observacao}\n\n'
            + '═ CONSULTA (só leitura, retornam dados no chat) ═\n'
            + '• CONSULTAR_ESTOQUE — dados: {} (mostra estoque atual)\n'
            + '• CONSULTAR_LOTES — dados: {} (mostra lotes e cabeças)\n'
            + '• CONSULTAR_PASTOS — dados: {} (mostra pastos e ocupação)\n'
            + '• CONSULTAR_MERCADO — dados: {} (mostra preços atuais + progresso das metas)\n'
            + '• RESUMO_DIA — dados: {} (resumo geral do dia: eventos, alertas, KPIs)\n\n'
            + 'REGRAS DA SECRETÁRIA:\n'
            + '1. Se o usuário não informar TODOS os dados obrigatórios, PERGUNTE antes de executar\n'
            + '2. Dados obrigatórios mínimos: REGISTRAR_LOTE(nome,qtdAnimais), REGISTRAR_COMPRA(qtd,valor), REGISTRAR_VENDA(qtd,valor)\n'
            + '3. SEMPRE confirme o que vai fazer ANTES de incluir o json_action\n'
            + '4. Após executar, mostre um resumo do que foi registrado\n'
            + '5. Use os nomes dos pastos que existem na fazenda (dados abaixo)\n'
            + '6. Para valor de venda, se o usuário informar "arroba" calcule: qtd × pesoMedio ÷ 30 × valorArroba\n'
            + '7. NUNCA execute ação sem que o usuário tenha dado os dados suficientes\n'
            + '8. Se o usuário disser "registra 20 cabeças no pasto X", crie um lote com nome baseado no pasto\n'
            + '9. Para CONSULTAS (CONSULTAR_*), NÃO peça confirmação — execute direto e mostre os dados\n'
            + '10. Para BAIXAR_ESTOQUE, o nome do produto deve corresponder ao que já existe no estoque\n'
            + '11. Para REGISTRAR_ESTOQUE, se o user diz "comprei 50 sacos de sal", use: nome="Sal Mineral", quantidade=50, unidade="saco"\n'
            + '12. Para RESUMO_DIA, compile tudo: lotes, estoque baixo, contas vencendo, manejos pendentes\n'
            + '13. Para TRACAR_META, precisa de pelo menos precoAlvo. Use dados do rebanho para calcular arrobas automaticamente\n'
            + '14. Para CONSULTAR_MERCADO, mostre preços atuais E compare com metas ativas. Use Google Search para dados frescos\n\n'

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

        // Detectar se pergunta é sobre mercado → ativar Google Search
        var ultimaPergunta = (messages.length > 0 ? messages[messages.length - 1].content : '').toLowerCase();
        var palavrasMercado = ['mercado', 'arroba', 'preço', 'preco', 'cotação', 'cotacao', 'cepea', 'b3', 'boi gordo',
            'exportação', 'exportacao', 'dólar', 'dolar', 'china', 'frigorífico', 'frigorifico', 'abate',
            'bezerro', 'novilha', 'vaca', 'milho', 'soja', 'quanto tá', 'quanto ta', 'quanto está',
            'vender agora', 'hora de vender', 'tendência', 'tendencia', 'safra', 'entressafra'];
        var usarGoogleSearch = palavrasMercado.some(function (p) { return ultimaPergunta.indexOf(p) >= 0; });

        var bodyPayload = {
            contents: contents,
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 1500
            }
        };
        if (usarGoogleSearch) {
            bodyPayload.tools = [{ googleSearch: {} }];
            console.log('IA: Google Search ativado — pergunta sobre mercado detectada');
        }

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var reply = '';
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    reply = data.candidates[0].content.parts[0].text;
                } else if (data.error) {
                    var errMsg = data.error.message || '';
                    var errStatus = (data.error.status || '').toUpperCase();

                    // Qualquer erro do Gemini: tenta cascata!
                    var isRecoverable = errMsg.indexOf('quota') >= 0 || errMsg.indexOf('rate') >= 0 || errMsg.indexOf('exceeded') >= 0 || errStatus === 'RESOURCE_EXHAUSTED' || errMsg.indexOf('API key not valid') >= 0 || errStatus === 'PERMISSION_DENIED' || errMsg.indexOf('leaked') >= 0;
                    var fallbackModel = models[1];

                    if (isRecoverable && model !== fallbackModel) {
                        console.log('IA: Gemini erro em ' + model + ' (' + errStatus + '), tentando ' + fallbackModel + '...');
                        self._chamarGeminiDireto(messages, context, fallbackModel);
                        return;
                    }

                    // Se ambos Gemini falharam, tenta próximo provedor
                    if (isRecoverable) {
                        console.log('IA: Ambos Gemini falharam, cascateando para próximo provedor...');
                        self._chamarProximoFallback('gemini', messages, context);
                        return;
                    }

                    // Erro não-recuperável (raro)
                    reply = '⚠️ Erro Gemini: ' + errMsg;
                } else {
                    reply = '⚠️ Resposta inesperada da IA.';
                }
                self._processarResposta(reply);
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
            content: 'Você é o AgroIA, o melhor analista pecuário do Brasil e SECRETÁRIA da fazenda. '
                + 'Responda em português brasileiro, usando dados reais da fazenda. Seja direto, prático, use emojis. Máximo 400 palavras.\n\n'
                + 'SECRETÁRIA: Quando o usuário pedir para REGISTRAR/CADASTRAR/ADICIONAR/MOVER/LANÇAR/CONSULTAR algo, '
                + 'inclua no FINAL da resposta um bloco:\n'
                + '```json_action\n[{"tipo":"TIPO","dados":{...}}]\n```\n'
                + 'REGISTRO: REGISTRAR_LOTE(nome,qtdAnimais,categoria,pasto,pesoMedio,raca), '
                + 'REGISTRAR_COMPRA(qtd,valor,pesoMedio,descricao,fornecedor,lote,pasto), '
                + 'REGISTRAR_VENDA(qtd,valor,pesoMedio,descricao,comprador,lote), '
                + 'MOVER_LOTE(lote,pastoDe,pastoPara), REGISTRAR_MORTE(lote,qtd,motivo), '
                + 'REGISTRAR_NASCIMENTO(lote,qtd,sexo), REGISTRAR_PESAGEM(lote,pesoMedio), '
                + 'REGISTRAR_CONTA(descricao,valor,vencimento), '
                + 'REGISTRAR_ESTOQUE(nome,quantidade,unidade,categoria,valorUnitario,valorTotal), '
                + 'BAIXAR_ESTOQUE(nome,quantidade,motivo), '
                + 'TRACAR_META(tipo,precoAlvo,dataLimite,modalidade,lote,qtdArrobas,observacao), '
                + 'REGISTRAR_MANEJO(lote,tipoManejo,produtos,observacao).\n'
                + 'CONSULTA: CONSULTAR_ESTOQUE({}), CONSULTAR_LOTES({}), CONSULTAR_PASTOS({}), CONSULTAR_MERCADO({}), RESUMO_DIA({}).\n'
                + 'Para CONSULTAS não peça confirmação, execute direto. Para REGISTROS, confirme antes se faltam dados.\n\n'
                + 'DADOS DA FAZENDA:\n' + context
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
                    self._processarResposta(data.choices[0].message.content);
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
                model: 'llama3.3-70b',
                messages: cbrMessages,
                temperature: 0.3,
                max_tokens: 1500
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.choices && data.choices[0]) {
                    self._processarResposta(data.choices[0].message.content);
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
                if (data.choices && data.choices[0]) {
                    self._processarResposta(data.choices[0].message.content);
                } else {
                    self._processarResposta('⚠️ Todos os provedores falharam. Verifique suas chaves em Configurações.');
                }
            })
            .catch(function () {
                self._processarResposta('📴 Sem conexão. Verifique sua internet.');
            });
    },

    // ══════════════════════════════════════════════════════╡
    // ║  SECRETÁRIA — PROCESSAR RESPOSTA E EXECUTAR AÇÕES  ║
    // ╚════════════════════════════════════════════════════╝

    _processarResposta: function (reply) {
        var self = this;
        self._mostrarDigitando(false);

        // Extrair json_action se existir
        var acoes = null;
        var textoLimpo = reply;
        var regex = /```json_action\s*([\s\S]*?)```/;
        var match = reply.match(regex);

        if (match) {
            try {
                acoes = JSON.parse(match[1].trim());
                textoLimpo = reply.replace(regex, '').trim();
            } catch (e) {
                console.warn('IA Secretária: JSON inválido', e, match[1]);
            }
        }

        // Salvar texto no histórico
        self.historico.push({ role: 'model', content: textoLimpo, time: Date.now() });
        self._salvarHistorico();
        self._renderMensagens();

        // Se tem ações, pedir confirmação
        if (acoes && Array.isArray(acoes) && acoes.length > 0) {
            self._pedirConfirmacaoAcoes(acoes);
        }
    },

    _pedirConfirmacaoAcoes: function (acoes) {
        var self = this;

        // Separate read-only CONSULTA actions from write actions
        var consultaTypes = ['CONSULTAR_ESTOQUE', 'CONSULTAR_LOTES', 'CONSULTAR_PASTOS', 'CONSULTAR_MERCADO', 'RESUMO_DIA'];
        var consultas = acoes.filter(function (a) { return consultaTypes.indexOf(a.tipo) >= 0; });
        var registros = acoes.filter(function (a) { return consultaTypes.indexOf(a.tipo) < 0; });

        // Execute CONSULTA actions immediately (read-only, no confirmation needed)
        if (consultas.length > 0) {
            self._executarAcoes(consultas);
        }

        // If no write actions remain, we're done
        if (registros.length === 0) return;

        var resumo = registros.map(function (a) {
            switch (a.tipo) {
                case 'REGISTRAR_LOTE': return '🐂 Criar lote "' + (a.dados.nome || '?') + '" com ' + (a.dados.qtdAnimais || '?') + ' cab';
                case 'REGISTRAR_COMPRA': return '🛒 Compra: ' + (a.dados.qtd || '?') + ' cab por R$ ' + (a.dados.valor || '?');
                case 'REGISTRAR_VENDA': return '💰 Venda: ' + (a.dados.qtd || '?') + ' cab por R$ ' + (a.dados.valor || '?');
                case 'MOVER_LOTE': return '🚚 Mover "' + (a.dados.lote || '?') + '" → ' + (a.dados.pastoPara || '?');
                case 'REGISTRAR_MORTE': return '💀 Morte: ' + (a.dados.qtd || '?') + ' cab (' + (a.dados.motivo || '?') + ')';
                case 'REGISTRAR_NASCIMENTO': return '🐣 Nascimento: ' + (a.dados.qtd || '?') + ' cab';
                case 'REGISTRAR_PESAGEM': return '⚖️ Pesagem: ' + (a.dados.pesoMedio || '?') + ' kg em "' + (a.dados.lote || '?') + '"';
                case 'REGISTRAR_CONTA': return '📋 Conta: ' + (a.dados.descricao || '?') + ' R$ ' + (a.dados.valor || '?');
                case 'REGISTRAR_ESTOQUE': return '📦 Estoque: +' + (a.dados.quantidade || '?') + ' ' + (a.dados.unidade || 'un') + ' de ' + (a.dados.nome || '?');
                case 'BAIXAR_ESTOQUE': return '📦 Saída: -' + (a.dados.quantidade || '?') + ' de ' + (a.dados.nome || '?');
                case 'TRACAR_META': return '🎯 Meta: ' + (a.dados.tipo || 'venda') + ' a R$ ' + (a.dados.precoAlvo || '?') + '/@';
                case 'REGISTRAR_MANEJO': return '💉 Manejo: ' + (a.dados.tipoManejo || '?') + ' em "' + (a.dados.lote || '?') + '"';
                default: return '❓ ' + a.tipo;
            }
        }).join('\n');

        // Inserir confirmação no chat
        var confirmId = 'ia-confirm-' + Date.now();
        self.historico.push({
            role: 'model',
            content: '🤖 **Confirma estas ações?**\n\n' + resumo,
            time: Date.now(),
            isConfirm: true,
            confirmId: confirmId,
            acoes: registros
        });
        self._salvarHistorico();
        self._renderMensagens();

        // Adicionar botões de confirmação
        setTimeout(function () {
            var chatBody = document.getElementById('ia-chat-body');
            if (!chatBody) return;
            var lastMsg = chatBody.lastElementChild;
            if (!lastMsg) return;

            var btnWrap = document.createElement('div');
            btnWrap.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

            var btnSim = document.createElement('button');
            btnSim.textContent = '✅ Executar';
            btnSim.style.cssText = 'padding:6px 16px;border:none;border-radius:6px;background:#22c55e;color:#fff;cursor:pointer;font-weight:600;';
            btnSim.onclick = function () {
                btnWrap.remove();
                self._executarAcoes(registros);
            };

            var btnNao = document.createElement('button');
            btnNao.textContent = '❌ Cancelar';
            btnNao.style.cssText = 'padding:6px 16px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-weight:600;';
            btnNao.onclick = function () {
                btnWrap.remove();
                self.historico.push({ role: 'model', content: '❌ Ações canceladas pelo usuário.', time: Date.now() });
                self._salvarHistorico();
                self._renderMensagens();
            };

            btnWrap.appendChild(btnSim);
            btnWrap.appendChild(btnNao);
            lastMsg.appendChild(btnWrap);
        }, 100);
    },

    _executarAcoes: function (acoes) {
        var self = this;
        var resultados = [];

        acoes.forEach(function (acao) {
            try {
                var d = acao.dados || {};
                switch (acao.tipo) {
                    case 'REGISTRAR_LOTE':
                        if (window.lotes && window.lotes.salvar) {
                            // Preencher campos e salvar
                            var loteEvt = {
                                type: 'LOTE',
                                nome: d.nome || 'Lote ' + new Date().toLocaleDateString('pt-BR'),
                                qtdAnimais: parseInt(d.qtdAnimais) || 0,
                                categoria: d.categoria || 'engorda',
                                pasto: d.pasto || '',
                                pesoMedio: parseFloat(d.pesoMedio) || 0,
                                raca: d.raca || 'Nelore',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            window.data.events.push(loteEvt);
                            window.data.save();
                            resultados.push('✅ Lote "' + loteEvt.nome + '" criado com ' + loteEvt.qtdAnimais + ' cabeças');
                        } else {
                            resultados.push('⚠️ Módulo de lotes não disponível');
                        }
                        break;

                    case 'REGISTRAR_COMPRA':
                        if (window.financeiro && window.financeiro.saveCompra) {
                            var compraEvt = {
                                type: 'COMPRA',
                                qtd: parseInt(d.qtd) || 0,
                                value: parseFloat(d.valor) || 0,
                                pesoMedio: parseFloat(d.pesoMedio) || 0,
                                desc: d.descricao || 'Compra via IA',
                                fornecedor: d.fornecedor || '',
                                lote: d.lote || '',
                                pasto: d.pasto || '',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            window.data.events.push(compraEvt);
                            window.data.save();
                            resultados.push('✅ Compra registrada: ' + compraEvt.qtd + ' cab — R$ ' + compraEvt.value.toLocaleString('pt-BR'));
                        } else {
                            resultados.push('⚠️ Módulo financeiro não disponível');
                        }
                        break;

                    case 'REGISTRAR_VENDA':
                        if (window.financeiro) {
                            var vendaEvt = {
                                type: 'VENDA',
                                qtd: parseInt(d.qtd) || 0,
                                value: parseFloat(d.valor) || 0,
                                pesoMedio: parseFloat(d.pesoMedio) || 0,
                                desc: d.descricao || 'Venda via IA',
                                comprador: d.comprador || '',
                                lote: d.lote || '',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            window.data.events.push(vendaEvt);
                            window.data.save();
                            resultados.push('✅ Venda registrada: ' + vendaEvt.qtd + ' cab — R$ ' + vendaEvt.value.toLocaleString('pt-BR'));
                        } else {
                            resultados.push('⚠️ Módulo financeiro não disponível');
                        }
                        break;

                    case 'MOVER_LOTE':
                        // Encontrar lote e atualizar pasto
                        var lotes = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        });
                        var loteAlvo = lotes.find(function (l) {
                            return (l.nome || '').toLowerCase().indexOf((d.lote || '').toLowerCase()) >= 0;
                        });
                        if (loteAlvo) {
                            var moveEvt = {
                                type: 'MOVIMENTACAO',
                                lote: loteAlvo.nome,
                                loteId: loteAlvo.id,
                                pastoDe: d.pastoDe || loteAlvo.pasto || '',
                                pastoPara: d.pastoPara || '',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            loteAlvo.pasto = d.pastoPara;
                            window.data.events.push(moveEvt);
                            window.data.save();
                            resultados.push('✅ Lote "' + loteAlvo.nome + '" movido para ' + d.pastoPara);
                        } else {
                            resultados.push('⚠️ Lote "' + (d.lote || '') + '" não encontrado');
                        }
                        break;

                    case 'REGISTRAR_MORTE':
                        var loteMorte = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        }).find(function (l) {
                            return (l.nome || '').toLowerCase().indexOf((d.lote || '').toLowerCase()) >= 0;
                        });
                        if (loteMorte) {
                            var morteEvt = {
                                type: 'MORTE',
                                lote: loteMorte.nome,
                                loteId: loteMorte.id,
                                qtd: parseInt(d.qtd) || 1,
                                motivo: d.motivo || 'Não informado',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            loteMorte.qtdAnimais = Math.max(0, (loteMorte.qtdAnimais || 0) - morteEvt.qtd);
                            window.data.events.push(morteEvt);
                            window.data.save();
                            resultados.push('✅ Morte registrada: ' + morteEvt.qtd + ' cab em "' + loteMorte.nome + '"');
                        } else {
                            resultados.push('⚠️ Lote "' + (d.lote || '') + '" não encontrado');
                        }
                        break;

                    case 'REGISTRAR_NASCIMENTO':
                        var loteNasc = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        }).find(function (l) {
                            return (l.nome || '').toLowerCase().indexOf((d.lote || '').toLowerCase()) >= 0;
                        });
                        if (loteNasc) {
                            var nascEvt = {
                                type: 'NASCIMENTO',
                                lote: loteNasc.nome,
                                loteId: loteNasc.id,
                                qtd: parseInt(d.qtd) || 1,
                                sexo: d.sexo || 'indefinido',
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            loteNasc.qtdAnimais = (loteNasc.qtdAnimais || 0) + nascEvt.qtd;
                            window.data.events.push(nascEvt);
                            window.data.save();
                            resultados.push('✅ Nascimento: +' + nascEvt.qtd + ' cab em "' + loteNasc.nome + '"');
                        } else {
                            resultados.push('⚠️ Lote "' + (d.lote || '') + '" não encontrado');
                        }
                        break;

                    case 'REGISTRAR_PESAGEM':
                        var lotePesagem = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        }).find(function (l) {
                            return (l.nome || '').toLowerCase().indexOf((d.lote || '').toLowerCase()) >= 0;
                        });
                        if (lotePesagem) {
                            var pesagemEvt = {
                                type: 'PESAGEM',
                                lote: lotePesagem.nome,
                                loteId: lotePesagem.id,
                                pesoMedio: parseFloat(d.pesoMedio) || 0,
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            lotePesagem.pesoMedio = pesagemEvt.pesoMedio;
                            window.data.events.push(pesagemEvt);
                            window.data.save();
                            resultados.push('✅ Pesagem: ' + pesagemEvt.pesoMedio + ' kg em "' + lotePesagem.nome + '"');
                        } else {
                            resultados.push('⚠️ Lote "' + (d.lote || '') + '" não encontrado');
                        }
                        break;

                    case 'REGISTRAR_CONTA':
                        if (window.financeiro) {
                            var contaEvt = {
                                type: 'CONTA',
                                desc: d.descricao || 'Conta via IA',
                                value: parseFloat(d.valor) || 0,
                                vencimento: d.vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                                pago: false,
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            window.data.events.push(contaEvt);
                            window.data.save();
                            resultados.push('✅ Conta registrada: "' + contaEvt.desc + '" R$ ' + contaEvt.value.toLocaleString('pt-BR'));
                        } else {
                            resultados.push('⚠️ Módulo financeiro não disponível');
                        }
                        break;

                    case 'REGISTRAR_ESTOQUE':
                        if (window.estoque) {
                            var cat = 'racao_sal';
                            if (window.estoque.inferCategory) {
                                cat = window.estoque.inferCategory(d.nome || '') || d.categoria || 'racao_sal';
                            }
                            var estoqueEvt = {
                                type: 'ENTRADA',
                                product: d.nome || 'Produto via IA',
                                qty: parseFloat(d.quantidade) || 0,
                                unit: d.unidade || 'kg',
                                category: cat,
                                unitPrice: parseFloat(d.valorUnitario) || 0,
                                total: parseFloat(d.valorTotal) || 0,
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            if (!estoqueEvt.total && estoqueEvt.unitPrice && estoqueEvt.qty) {
                                estoqueEvt.total = estoqueEvt.unitPrice * estoqueEvt.qty;
                            }
                            window.data.events.push(estoqueEvt);
                            window.data.save();
                            resultados.push('✅ Estoque: +' + estoqueEvt.qty + ' ' + estoqueEvt.unit + ' de "' + estoqueEvt.product + '" (R$ ' + (estoqueEvt.total || 0).toLocaleString('pt-BR') + ')');
                        } else {
                            resultados.push('⚠️ Módulo de estoque não disponível');
                        }
                        break;

                    case 'REGISTRAR_MANEJO':
                        var loteManejo = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        }).find(function (l) {
                            return (l.nome || '').toLowerCase().indexOf((d.lote || '').toLowerCase()) >= 0;
                        });
                        if (loteManejo) {
                            var manejoEvt = {
                                type: 'MANEJO',
                                lote: loteManejo.nome,
                                loteId: loteManejo.id,
                                tipoManejo: d.tipoManejo || 'sanitario',
                                produtos: d.produtos || '',
                                obs: d.observacao || 'Manejo via IA',
                                qtdAnimais: loteManejo.qtdAnimais || 0,
                                date: new Date().toISOString(),
                                id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                            };
                            window.data.events.push(manejoEvt);
                            window.data.save();
                            resultados.push('✅ Manejo "' + manejoEvt.tipoManejo + '" registrado em "' + loteManejo.nome + '"');
                        } else {
                            resultados.push('⚠️ Lote "' + (d.lote || '') + '" não encontrado');
                        }
                        break;

                    case 'TRACAR_META':
                        var metaEvt = {
                            type: 'META_MERCADO',
                            tipoMeta: d.tipo || 'venda',
                            precoAlvo: parseFloat(d.precoAlvo) || 0,
                            dataLimite: d.dataLimite || '',
                            modalidade: d.modalidade || 'spot',
                            lote: d.lote || '',
                            qtdArrobas: parseFloat(d.qtdArrobas) || 0,
                            obs: d.observacao || '',
                            status: 'ATIVA',
                            date: new Date().toISOString(),
                            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                        };
                        // Auto-calculate arrobas from herd if not provided
                        if (!metaEvt.qtdArrobas) {
                            var lotesCalc = (window.data.events || []).filter(function (e) {
                                return e.type === 'LOTE' && !e.estornado;
                            });
                            var totalPeso = 0;
                            lotesCalc.forEach(function (l) {
                                if (l.pesoMedio && l.qtdAnimais) totalPeso += l.pesoMedio * l.qtdAnimais;
                            });
                            metaEvt.qtdArrobas = Math.round(totalPeso / 30);
                        }
                        window.data.events.push(metaEvt);
                        window.data.save();
                        var receitaEst = metaEvt.qtdArrobas * metaEvt.precoAlvo;
                        resultados.push('🎯 Meta traçada: ' + metaEvt.tipoMeta.toUpperCase()
                            + '\n  💲 Preço alvo: R$ ' + metaEvt.precoAlvo.toFixed(2) + '/@'
                            + '\n  📦 Arrobas: ' + metaEvt.qtdArrobas + '@'
                            + '\n  💰 Receita estimada: R$ ' + receitaEst.toLocaleString('pt-BR')
                            + (metaEvt.dataLimite ? '\n  📅 Até: ' + metaEvt.dataLimite : '')
                            + '\n  📋 Modalidade: ' + metaEvt.modalidade);
                        break;

                    case 'CONSULTAR_MERCADO':
                        var mercadoTxt = '📊 **Mercado Atual:**\n\n';
                        var mercadoData = self.getMercado ? self.getMercado() : null;
                        if (mercadoData) {
                            if (mercadoData.arrobaSP) mercadoTxt += '• Arroba CEPEA/SP: **R$ ' + Number(mercadoData.arrobaSP).toFixed(2) + '**\n';
                            if (mercadoData.arrobaBA) mercadoTxt += '• Arroba BA: **R$ ' + Number(mercadoData.arrobaBA).toFixed(2) + '**\n';
                            if (mercadoData.arrobaGO) mercadoTxt += '• Arroba GO: **R$ ' + Number(mercadoData.arrobaGO).toFixed(2) + '**\n';
                            if (mercadoData.arrobaMT) mercadoTxt += '• Arroba MT: **R$ ' + Number(mercadoData.arrobaMT).toFixed(2) + '**\n';
                            if (mercadoData.arrobaMS) mercadoTxt += '• Arroba MS: **R$ ' + Number(mercadoData.arrobaMS).toFixed(2) + '**\n';
                            if (mercadoData.tendencia) mercadoTxt += '• Tendência: **' + mercadoData.tendencia + '** (' + (mercadoData.variacao7d || '') + ')\n';
                            if (mercadoData.bezerro) mercadoTxt += '• Bezerro: R$ ' + Number(mercadoData.bezerro).toFixed(2) + '\n';
                            if (mercadoData.dolar) mercadoTxt += '• Dólar: R$ ' + Number(mercadoData.dolar).toFixed(2) + '\n';
                            if (mercadoData.milho60kg) mercadoTxt += '• Milho 60kg: R$ ' + Number(mercadoData.milho60kg).toFixed(2) + '\n';
                            if (mercadoData.escalas) mercadoTxt += '• Escalas: ' + mercadoData.escalas + '\n';
                            mercadoTxt += '\n_Última atualização: ' + (mercadoData.data || 'cache') + '_\n';
                        } else {
                            mercadoTxt += '⚠️ Dados de mercado não disponíveis no cache.\n';
                            mercadoTxt += '💡 Pergunte "como está o mercado?" para buscar dados atualizados via Google.\n';
                        }

                        // Check active metas
                        var metasAtivas = (window.data.events || []).filter(function (e) {
                            return e.type === 'META_MERCADO' && e.status === 'ATIVA' && !e.estornado;
                        });
                        if (metasAtivas.length > 0) {
                            mercadoTxt += '\n🎯 **Metas Ativas:**\n\n';
                            var precoRef = mercadoData ? (mercadoData.arrobaBA || mercadoData.arrobaSP || 0) : 0;
                            metasAtivas.forEach(function (m) {
                                var pct = precoRef > 0 ? ((precoRef / m.precoAlvo) * 100).toFixed(0) : '--';
                                var statusMeta = '';
                                if (precoRef >= m.precoAlvo) {
                                    statusMeta = '🎯 **META ATINGIDA!** Hora de executar!';
                                } else if (precoRef >= m.precoAlvo * 0.9) {
                                    statusMeta = '📈 Quase lá! Preço a ' + pct + '% da meta';
                                } else {
                                    statusMeta = '⏳ Mercado a ' + pct + '% da meta';
                                }
                                mercadoTxt += '• ' + (m.tipoMeta || 'venda').toUpperCase() + ': R$ ' + (m.precoAlvo || 0).toFixed(2) + '/@ | ' + statusMeta + '\n';
                                if (m.dataLimite) mercadoTxt += '  📅 Limite: ' + m.dataLimite + '\n';
                                if (m.qtdArrobas) mercadoTxt += '  📦 ' + m.qtdArrobas + '@ | Receita alvo: R$ ' + (m.qtdArrobas * m.precoAlvo).toLocaleString('pt-BR') + '\n';
                            });
                        }
                        resultados.push(mercadoTxt);
                        break;

                    case 'BAIXAR_ESTOQUE':
                        if (window.estoque) {
                            var nomeItem = (d.nome || '').toLowerCase();
                            var estoqueItems = (window.data.events || []).filter(function (e) {
                                return (e.type === 'ENTRADA' || e.type === 'ESTOQUE_ITEM') && !e.estornado;
                            });
                            // Find matching item
                            var itemAlvo = null;
                            var saldos = {};
                            estoqueItems.forEach(function (e) {
                                var key = (e.product || e.nome || '').toLowerCase();
                                if (!saldos[key]) saldos[key] = { nome: e.product || e.nome, qtd: 0, unidade: e.unit || e.unidade || 'un' };
                                saldos[key].qtd += (e.qty || e.qtd || 0);
                            });
                            // Check saídas
                            (window.data.events || []).filter(function (e) {
                                return e.type === 'SAIDA' && !e.estornado;
                            }).forEach(function (e) {
                                var key = (e.product || e.nome || '').toLowerCase();
                                if (saldos[key]) saldos[key].qtd -= (e.qty || e.qtd || 0);
                            });

                            var keys = Object.keys(saldos);
                            var matched = keys.find(function (k) { return k.indexOf(nomeItem) >= 0 || nomeItem.indexOf(k) >= 0; });
                            if (matched && saldos[matched]) {
                                var qtdBaixar = parseFloat(d.quantidade) || 1;
                                var saidaEvt = {
                                    type: 'SAIDA',
                                    product: saldos[matched].nome,
                                    qty: qtdBaixar,
                                    unit: saldos[matched].unidade,
                                    motivo: d.motivo || 'Uso via IA',
                                    date: new Date().toISOString(),
                                    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                                };
                                window.data.events.push(saidaEvt);
                                window.data.save();
                                var saldoFinal = Math.max(0, saldos[matched].qtd - qtdBaixar);
                                resultados.push('✅ Saída: -' + qtdBaixar + ' ' + saldos[matched].unidade + ' de "' + saldos[matched].nome + '" (saldo: ' + saldoFinal + ')');
                            } else {
                                resultados.push('⚠️ Produto "' + (d.nome || '') + '" não encontrado no estoque');
                            }
                        } else {
                            resultados.push('⚠️ Módulo de estoque não disponível');
                        }
                        break;

                    case 'CONSULTAR_ESTOQUE':
                        var estoqueAll = (window.data.events || []);
                        var saldosEst = {};
                        estoqueAll.filter(function (e) {
                            return (e.type === 'ENTRADA' || e.type === 'ESTOQUE_ITEM') && !e.estornado;
                        }).forEach(function (e) {
                            var key = (e.product || e.nome || '').toLowerCase();
                            if (!saldosEst[key]) saldosEst[key] = { nome: e.product || e.nome, qtd: 0, unidade: e.unit || e.unidade || 'un' };
                            saldosEst[key].qtd += (e.qty || e.qtd || 0);
                        });
                        estoqueAll.filter(function (e) {
                            return e.type === 'SAIDA' && !e.estornado;
                        }).forEach(function (e) {
                            var key = (e.product || e.nome || '').toLowerCase();
                            if (saldosEst[key]) saldosEst[key].qtd -= (e.qty || e.qtd || 0);
                        });
                        var estKeys = Object.keys(saldosEst);
                        if (estKeys.length > 0) {
                            var estTxt = '📦 **Estoque Atual:**\n\n';
                            estKeys.forEach(function (k) {
                                var s = saldosEst[k];
                                var alerta = s.qtd <= 0 ? ' ⚠️ ZERADO!' : (s.qtd < 10 ? ' ⚠️ BAIXO' : '');
                                estTxt += '• ' + s.nome + ': **' + Math.max(0, s.qtd) + ' ' + s.unidade + '**' + alerta + '\n';
                            });
                            resultados.push(estTxt);
                        } else {
                            resultados.push('📦 Estoque vazio — nenhum item cadastrado');
                        }
                        break;

                    case 'CONSULTAR_LOTES':
                        var lotesAtivos = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        });
                        if (lotesAtivos.length > 0) {
                            var totalCab = 0;
                            var lotesTxt = '🐄 **Lotes Ativos:**\n\n';
                            lotesAtivos.forEach(function (l) {
                                var cab = l.qtdAnimais || 0;
                                totalCab += cab;
                                lotesTxt += '• **' + (l.nome || 'Sem nome') + '**: ' + cab + ' cab';
                                if (l.categoria) lotesTxt += ' | ' + l.categoria;
                                if (l.pasto) lotesTxt += ' | 📍 ' + l.pasto;
                                if (l.pesoMedio) lotesTxt += ' | ⚖️ ' + l.pesoMedio + 'kg';
                                lotesTxt += '\n';
                            });
                            lotesTxt += '\n**Total: ' + totalCab + ' cabeças em ' + lotesAtivos.length + ' lotes**';
                            resultados.push(lotesTxt);
                        } else {
                            resultados.push('🐄 Nenhum lote ativo cadastrado');
                        }
                        break;

                    case 'CONSULTAR_PASTOS':
                        var pastosTxt = '🌿 **Pastos da Fazenda:**\n\n';
                        var temPastos = false;
                        if (window.pastos && window.pastos.getPastos) {
                            var pastosData = window.pastos.getPastos();
                            if (pastosData.length > 0) {
                                temPastos = true;
                                var totalHa = 0;
                                // Get lotes for occupancy
                                var lotesP = (window.data.events || []).filter(function (e) {
                                    return e.type === 'LOTE' && !e.estornado;
                                });
                                pastosData.forEach(function (p) {
                                    var ha = p.area || 0;
                                    totalHa += ha;
                                    var ocupacao = lotesP.filter(function (l) {
                                        return (l.pasto || '').toLowerCase() === (p.nome || '').toLowerCase();
                                    });
                                    var nCab = ocupacao.reduce(function (a, l) { return a + (l.qtdAnimais || 0); }, 0);
                                    var status = nCab > 0 ? '🟢 ' + nCab + ' cab' : '⚪ Vazio';
                                    pastosTxt += '• **' + p.nome + '**: ' + ha.toFixed(1) + ' ha | ' + status + '\n';
                                });
                                pastosTxt += '\n**Total: ' + totalHa.toFixed(1) + ' ha em ' + pastosData.length + ' pastos**';
                            }
                        }
                        if (!temPastos) {
                            pastosTxt += 'Nenhum pasto cadastrado';
                        }
                        resultados.push(pastosTxt);
                        break;

                    case 'RESUMO_DIA':
                        var hoje = new Date();
                        var hojeStr = hoje.toISOString().split('T')[0];
                        var resumo = '📋 **Resumo do Dia — ' + hoje.toLocaleDateString('pt-BR') + '**\n\n';

                        // Events today
                        var eventosHoje = (window.data.events || []).filter(function (e) {
                            return e.date && e.date.indexOf(hojeStr) === 0;
                        });
                        if (eventosHoje.length > 0) {
                            resumo += '📌 **Movimentações hoje:** ' + eventosHoje.length + '\n';
                            eventosHoje.forEach(function (e) {
                                resumo += '  • ' + (e.type || '?') + ': ' + (e.desc || e.product || e.nome || e.lote || '--') + '\n';
                            });
                            resumo += '\n';
                        } else {
                            resumo += '📌 Nenhuma movimentação registrada hoje\n\n';
                        }

                        // Rebanho KPIs
                        var lotesR = (window.data.events || []).filter(function (e) {
                            return e.type === 'LOTE' && !e.estornado;
                        });
                        var totalR = lotesR.reduce(function (a, l) { return a + (l.qtdAnimais || 0); }, 0);
                        resumo += '🐄 **Rebanho:** ' + totalR + ' cabeças em ' + lotesR.length + ' lotes\n';

                        // Contas vencidas
                        var contasV = (window.data.events || []).filter(function (e) {
                            return e.type === 'CONTA' && !e.pago && e.vencimento && e.vencimento <= hojeStr;
                        });
                        if (contasV.length > 0) {
                            resumo += '\n⚠️ **' + contasV.length + ' conta(s) vencida(s):**\n';
                            contasV.forEach(function (c) {
                                resumo += '  • ' + (c.desc || 'Conta') + ' — R$ ' + (c.value || 0).toLocaleString('pt-BR') + '\n';
                            });
                        }

                        // Estoque baixo
                        var saldosR = {};
                        (window.data.events || []).filter(function (e) {
                            return (e.type === 'ENTRADA' || e.type === 'ESTOQUE_ITEM') && !e.estornado;
                        }).forEach(function (e) {
                            var key = (e.product || e.nome || '').toLowerCase();
                            if (!saldosR[key]) saldosR[key] = { nome: e.product || e.nome, qtd: 0 };
                            saldosR[key].qtd += (e.qty || e.qtd || 0);
                        });
                        (window.data.events || []).filter(function (e) {
                            return e.type === 'SAIDA' && !e.estornado;
                        }).forEach(function (e) {
                            var key = (e.product || e.nome || '').toLowerCase();
                            if (saldosR[key]) saldosR[key].qtd -= (e.qty || e.qtd || 0);
                        });
                        var baixos = Object.keys(saldosR).filter(function (k) { return saldosR[k].qtd <= 5; });
                        if (baixos.length > 0) {
                            resumo += '\n📦 **Estoque baixo:**\n';
                            baixos.forEach(function (k) {
                                resumo += '  • ' + saldosR[k].nome + ': ' + Math.max(0, saldosR[k].qtd) + '\n';
                            });
                        }

                        // Clima
                        if (window.clima) {
                            var acum = window.clima.getAcumulado30Dias();
                            resumo += '\n🌧️ **Chuva 30d:** ' + acum.toFixed(0) + ' mm';
                        }

                        resultados.push(resumo);
                        break;

                    default:
                        resultados.push('⚠️ Ação desconhecida: ' + acao.tipo);
                }
            } catch (err) {
                console.error('IA Secretária erro:', acao.tipo, err);
                resultados.push('❌ Erro ao executar ' + acao.tipo + ': ' + err.message);
            }
        });

        // Mostrar resultado no chat
        var msg = '🤖 **Ações executadas:**\n\n' + resultados.join('\n');
        self.historico.push({ role: 'model', content: msg, time: Date.now() });
        self._salvarHistorico();
        self._renderMensagens();

        // ══ CONFIRMAÇÃO VISUAL — Toast individual para cada ação ══
        if (window.app && window.app.showToast) {
            resultados.forEach(function (resultado, i) {
                setTimeout(function () {
                    window.app.showToast(resultado, resultado.indexOf('❌') >= 0 ? 'error' : 'success');
                }, i * 1200); // Espaça os toasts para o usuário ver cada um
            });
        }

        // ══ BANNER FIXO NO TOPO — Sem sumir, fica até o usuário fechar ══
        var oldBanner = document.getElementById('ia-actions-banner');
        if (oldBanner) oldBanner.remove();

        var banner = document.createElement('div');
        banner.id = 'ia-actions-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;'
            + 'background:linear-gradient(135deg,#1E40AF,#3B82F6);color:#fff;'
            + 'padding:12px 16px;font-size:13px;font-weight:600;'
            + 'box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:slideDown 0.4s ease;';

        var bannerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<span>🤖 IA executou ' + resultados.length + ' ação(ões):</span>'
            + '<button onclick="this.parentNode.parentNode.remove()" '
            + 'style="background:rgba(255,255,255,0.2);border:none;color:#fff;'
            + 'font-size:18px;width:28px;height:28px;border-radius:50%;cursor:pointer;'
            + 'display:flex;align-items:center;justify-content:center;">✕</button>'
            + '</div>'
            + '<div style="margin-top:6px;font-size:12px;opacity:0.95;">';

        resultados.forEach(function (r) {
            bannerHTML += '<div style="padding:2px 0;">' + r + '</div>';
        });
        bannerHTML += '</div>';
        banner.innerHTML = bannerHTML;
        document.body.appendChild(banner);

        // Auto-remover banner após 12 segundos
        setTimeout(function () {
            var b = document.getElementById('ia-actions-banner');
            if (b) {
                b.style.transition = 'opacity 0.5s, transform 0.5s';
                b.style.opacity = '0';
                b.style.transform = 'translateY(-100%)';
                setTimeout(function () { if (b.parentNode) b.remove(); }, 500);
            }
        }, 12000);

        // Refresh UI
        if (window.app && window.app.renderCurrentView) {
            setTimeout(function () { window.app.renderCurrentView(); }, 300);
        }
    },

    // ══ UI — Botão Flutuante ══
    _criarBotao: function () {
        var btn = document.getElementById('ia-fab');
        if (btn) return; // Já existe

        btn = document.createElement('button');
        btn.id = 'ia-fab';
        btn.className = 'ia-fab';
        btn.innerHTML = '<img src="img/boteco-avatar.png" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--primary);"><span id="ia-badge" class="ia-badge" style="display:none;">0</span>';
        btn.title = 'Boteco — Sua Secretária IA';
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

    // ══ VOZ — Speech Recognition ══
    _vozAtiva: false,
    _recognition: null,

    _toggleVoz: function () {
        var self = this;
        var btn = document.getElementById('ia-mic-btn');

        // Check support
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (window.app && window.app.showToast) {
                window.app.showToast('🎙️ Seu navegador não suporta reconhecimento de voz. Use Chrome.', 'error');
            }
            return;
        }

        if (self._vozAtiva && self._recognition) {
            // Parar gravação
            self._recognition.stop();
            return;
        }

        // Iniciar gravação
        self._recognition = new SpeechRecognition();
        self._recognition.lang = 'pt-BR';
        self._recognition.continuous = false;
        self._recognition.interimResults = true;
        self._recognition.maxAlternatives = 1;

        self._vozAtiva = true;
        if (btn) btn.classList.add('recording');

        var input = document.getElementById('ia-input');

        self._recognition.onresult = function (event) {
            var transcript = '';
            for (var i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (input) input.value = transcript;

            // Se resultado final, envia
            if (event.results[event.results.length - 1].isFinal) {
                setTimeout(function () {
                    self._enviarDoInput();
                }, 300);
            }
        };

        self._recognition.onend = function () {
            self._vozAtiva = false;
            if (btn) btn.classList.remove('recording');
            self._recognition = null;
        };

        self._recognition.onerror = function (event) {
            console.warn('Voz erro:', event.error);
            self._vozAtiva = false;
            if (btn) btn.classList.remove('recording');
            if (event.error === 'not-allowed') {
                if (window.app && window.app.showToast) {
                    window.app.showToast('🎙️ Permita o microfone nas configurações do navegador.', 'error');
                }
            }
        };

        self._recognition.start();
        if (window.app && window.app.showToast) {
            window.app.showToast('🎙️ Ouvindo... fale agora!', 'info');
        }
    },

    // ══ RENDER MENSAGENS (C5: Contextual Welcome + C7: Dynamic Suggestions) ══
    _renderMensagens: function () {
        var container = document.getElementById('ia-messages');
        if (!container) return;

        if (this.historico.length === 0) {
            // ── C5: Contextual welcome based on current page + data ──
            var mercado = this.getMercado();
            var events = window.data ? window.data.events : [];
            var lotesAtivos = [];
            var lotesMap = {};
            events.forEach(function (ev) { if (ev.type === 'LOTE') lotesMap[ev.nome] = ev; });
            for (var n in lotesMap) { if (lotesMap[n].status === 'ATIVO') lotesAtivos.push(lotesMap[n]); }
            var totalCab = 0, pesoT = 0, pesados = 0;
            lotesAtivos.forEach(function (l) {
                totalCab += (l.qtdAnimais || 0);
                if (l.pesoMedio && (l.qtdAnimais || 0) > 0) { pesoT += l.pesoMedio * l.qtdAnimais; pesados += l.qtdAnimais; }
            });
            var pesoMed = pesados > 0 ? (pesoT / pesados).toFixed(0) : '--';
            var arrobas = pesoT > 0 ? (pesoT / 30).toFixed(0) : '--';

            var welcomeMsg = '';
            if (mercado && mercado.arrobaSP && totalCab > 0) {
                var precoArr = mercado.arrobaBA || mercado.arrobaSP;
                var valorReb = (pesoT / 30) * precoArr;
                welcomeMsg = '📊 Seu rebanho: <strong>' + totalCab + ' cab</strong>, peso médio ' + pesoMed + 'kg (' + arrobas + '@)<br>'
                    + '💰 CEPEA: <strong>R$ ' + Number(mercado.arrobaSP).toFixed(2) + '/@</strong> (' + (mercado.tendencia || '—') + ')<br>'
                    + '🐂 Valor em pé: <strong>R$ ' + valorReb.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + '</strong>';
            } else if (totalCab > 0) {
                welcomeMsg = '📊 Seu rebanho: <strong>' + totalCab + ' cab</strong> em ' + lotesAtivos.length + ' lotes, peso médio ' + pesoMed + 'kg';
            } else {
                welcomeMsg = 'Consultor pecuário com IA real.<br>Usa os dados da sua fazenda para respostas precisas.';
            }

            var introHtml = '<div class="ia-intro-banner">'
                + '<img src="img/boteco-intro.png" class="ia-intro-img">'
                + '<div class="ia-intro-text">Olá! Eu sou sua Secretária Digital. Como posso ajudar com a fazenda hoje?</div>'
                + '</div>';

            var welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'ia-message ia-message-bot';
            welcomeDiv.innerHTML = introHtml + '<div>' + welcomeMsg + '</div>';
            container.appendChild(welcomeDiv);
            // Data-driven suggestions
            if (mercado && mercado.arrobaSP) {
                suggestions.push({ icon: '📈', text: 'Como está o mercado hoje?', q: 'Como está o mercado da arroba hoje? Analise tendência, escalas e me aconselhe.' });
            }
            var temLotePronto = lotesAtivos.some(function (l) { return l.pesoMedio && l.pesoMedio / 30 >= 16; });
            if (temLotePronto) {
                suggestions.push({ icon: '💰', text: 'Devo vender meu lote pronto?', q: 'Tenho lote pronto (≥16@). Analise o mercado e me diga se devo vender agora ou esperar.' });
            }
            var hoje = new Date().toISOString().split('T')[0];
            var vencidas = events.filter(function (e) { return e.type === 'CONTA_PAGAR' && !e.pago && e.vencimento && e.vencimento < hoje; });
            if (vencidas.length > 0) {
                suggestions.push({ icon: '⚠️', text: vencidas.length + ' contas vencidas!', q: 'Tenho ' + vencidas.length + ' contas vencidas. Me ajude a priorizar pagamentos.' });
            }

            // Financial education — always available
            suggestions.push({ icon: '🔒', text: 'Como TRAVAR preço na B3? (Hedge)', q: 'Explique de forma clara e passo a passo como funciona o hedge na B3 para pecuarista. O que é contrato futuro BGI? Como funciona a PUT (opção de venda)? Quanto custa? Qual o lote mínimo? Me explique como se eu nunca tivesse ouvido falar disso.' });
            suggestions.push({ icon: '🏦', text: 'O que é CPR? (Antecipar dinheiro)', q: 'Explique de forma clara o que é CPR (Cédula de Produto Rural). Como funciona a CPR Física e a Financeira? Onde faço (bancos)? Quais garantias pedem? Quanto custa? Vantagens e riscos? Me explique passo a passo.' });
            suggestions.push({ icon: '📝', text: 'Venda a Termo (Contrato com Frigorífico)', q: 'Explique de forma clara como funciona a Venda a Termo com frigorífico. Como travo o preço? Quais as vantagens e riscos? Quando devo usar? Compare com hedge na B3 e CPR.' });
            suggestions.push({ icon: '🔄', text: 'Qual melhor caminho pra vender?', q: 'Compare as modalidades de venda: spot (à vista), venda a termo, CPR, futuro B3 e PUT. Para o tamanho do meu rebanho, qual é a melhor opção? Me explique cada uma de forma simples.' });

            // General
            suggestions.push({ icon: '📊', text: 'Resumo completo da fazenda', q: 'Dê um resumo completo da minha fazenda: rebanho, custos, receitas, estoque, pastos e manejos pendentes.' });

            var sugHtml = '';
            suggestions.forEach(function (s) {
                sugHtml += '<button class="ia-suggest-btn" onclick="window.iaConsultor.enviarPergunta(\'' + s.q.replace(/'/g, "\\'") + '\')">' + s.icon + ' ' + s.text + '</button>';
            });

            container.innerHTML = '<div class="ia-welcome">'
                + '<div class="ia-welcome-icon">🤖</div>'
                + '<div class="ia-welcome-title">AgroIA</div>'
                + '<div class="ia-welcome-sub">' + welcomeMsg + '</div>'
                + '<div class="ia-suggestions">' + sugHtml + '</div>'
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
            + '<div class="ia-welcome-sub">Configure suas chaves API (todas gratuitas!).</div>'
            + '<div class="ia-config-steps">'
            + '<p><strong>Cascata:</strong> Gemini → Groq → Cerebras → OpenRouter</p>'
            + '<p style="font-size:11px;color:#636366;">Se um provedor falhar, o próximo assume automaticamente.</p>'
            + '</div>'
            // Gemini
            + '<div class="form-group" style="margin-top:12px;">'
            + '<label style="font-size:12px;font-weight:700;color:#059669;">🟢 Gemini (principal)</label>'
            + '<p style="font-size:10px;color:#636366;margin:2px 0 6px;">Crie em <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563EB;">aistudio.google.com/apikey</a></p>'
            + '<input type="text" id="ia-config-key" placeholder="Cole a API key Gemini..." style="font-size:14px;" value="' + (this.API_KEY || '') + '">'
            + '</div>'
            // Groq
            + '<div class="form-group" style="margin-top:10px;">'
            + '<label style="font-size:12px;font-weight:700;color:#F97316;">🟠 Groq (backup 1)</label>'
            + '<p style="font-size:10px;color:#636366;margin:2px 0 6px;">Crie em <a href="https://console.groq.com/keys" target="_blank" style="color:#2563EB;">console.groq.com/keys</a> — 14.400 req/dia</p>'
            + '<input type="text" id="ia-config-groq" placeholder="Chave Groq (opcional)" style="font-size:14px;" value="' + (this.GROQ_KEY || '') + '">'
            + '</div>'
            // Cerebras
            + '<div class="form-group" style="margin-top:10px;">'
            + '<label style="font-size:12px;font-weight:700;color:#8B5CF6;">🟣 Cerebras (backup 2)</label>'
            + '<p style="font-size:10px;color:#636366;margin:2px 0 6px;">Crie em <a href="https://cloud.cerebras.ai/" target="_blank" style="color:#2563EB;">cloud.cerebras.ai</a> — 1M tokens/dia</p>'
            + '<input type="text" id="ia-config-cerebras" placeholder="Chave Cerebras (opcional)" style="font-size:14px;" value="' + (this.CEREBRAS_KEY || '') + '">'
            + '</div>'
            // OpenRouter
            + '<div class="form-group" style="margin-top:10px;">'
            + '<label style="font-size:12px;font-weight:700;color:#2563EB;">🔵 OpenRouter (backup 3)</label>'
            + '<p style="font-size:10px;color:#636366;margin:2px 0 6px;">Crie em <a href="https://openrouter.ai/keys" target="_blank" style="color:#2563EB;">openrouter.ai/keys</a> — modelos grátis</p>'
            + '<input type="text" id="ia-config-openrouter" placeholder="Chave OpenRouter (opcional)" style="font-size:14px;" value="' + (this.OPENROUTER_KEY || '') + '">'
            + '</div>'
            + '<button class="submit-btn" onclick="window.iaConsultor._salvarConfig()" style="margin-top:12px;">✅ Salvar Todas as Chaves</button>'
            + '<p style="margin-top:12px;font-size:11px;color:#636366;">💡 Keys ficam salvas apenas no seu dispositivo.</p>'
            + '</div>';
    },

    _salvarConfig: function () {
        var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };

        var key = get('ia-config-key');
        var groqKey = get('ia-config-groq');
        var cerebrasKey = get('ia-config-cerebras');
        var openrouterKey = get('ia-config-openrouter');

        if (!key && !groqKey && !cerebrasKey && !openrouterKey) {
            window.app.showToast('Cole pelo menos uma API key', 'error');
            return;
        }

        this.API_KEY = key;
        this.GROQ_KEY = groqKey;
        this.CEREBRAS_KEY = cerebrasKey;
        this.OPENROUTER_KEY = openrouterKey;

        localStorage.setItem('agromacro_ia_config', JSON.stringify({
            apiKey: key,
            groqKey: groqKey,
            cerebrasKey: cerebrasKey,
            openrouterKey: openrouterKey
        }));

        var count = this._contarProvedores();
        window.app.showToast('🔑 ' + count + ' provedor(es) configurado(s)!', 'success');

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
    },

    // ══════════════════════════════════════════════════════════════
    //  C0: BRIEFING DIÁRIO DE MERCADO — Busca dados reais via Gemini
    // ══════════════════════════════════════════════════════════════
    buscarBriefingDiario: function (forceRefresh) {
        var self = this;
        // Check cache first
        if (!forceRefresh) {
            var cached = this.getMercado();
            if (cached && cached._timestamp) {
                var horasPassadas = (Date.now() - cached._timestamp) / (1000 * 60 * 60);
                if (horasPassadas < this.MERCADO_CACHE_HORAS) {
                    console.log('IA Mercado: usando cache (' + horasPassadas.toFixed(1) + 'h)');
                    this.gerarInsightsProativos();
                    this._atualizarBadge();
                    return;
                }
            }
        }

        if (!this._temConexao()) {
            console.log('IA Mercado: sem API key, usando cache antigo');
            this.gerarInsightsProativos();
            return;
        }

        console.log('IA Mercado: buscando briefing diário...');

        var prompt = 'Busque informações ATUAIS e REAIS do mercado pecuário brasileiro de HOJE. '
            + 'Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem explicação, SÓ o JSON:\n'
            + '{\n'
            + '  "data": "YYYY-MM-DD",\n'
            + '  "arrobaSP": 0.00,\n'
            + '  "arrobaBA": 0.00,\n'
            + '  "arrobaGO": 0.00,\n'
            + '  "arrobaMT": 0.00,\n'
            + '  "arrobaMS": 0.00,\n'
            + '  "tendencia": "alta ou estavel ou queda",\n'
            + '  "variacao7d": "+X.X%",\n'
            + '  "bezerro": 0.00,\n'
            + '  "novilha": 0.00,\n'
            + '  "vaca": 0.00,\n'
            + '  "rt": 0.00,\n'
            + '  "dolar": 0.00,\n'
            + '  "milho60kg": 0.00,\n'
            + '  "soja60kg": 0.00,\n'
            + '  "escalas": "X dias",\n'
            + '  "exportacao": "forte ou normal ou fraca",\n'
            + '  "noticias": [\n'
            + '    {"titulo": "...", "resumo": "..."},\n'
            + '    {"titulo": "...", "resumo": "..."},\n'
            + '    {"titulo": "...", "resumo": "..."}\n'
            + '  ],\n'
            + '  "analise": "Resumo em 2 frases da situação do mercado hoje"\n'
            + '}\n'
            + 'Use dados do CEPEA, B3, Canal Rural, BeefPoint, Scot Consultoria. Preços em R$.';

        var apiKey = this.API_KEY;
        if (!apiKey) {
            console.log('IA Mercado: sem chave Gemini, pulando briefing (requer Google Search)');
            this.gerarInsightsProativos();
            return;
        }
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;

        var body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
            tools: [{ googleSearch: {} }]
        };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                try {
                    var text = data.candidates[0].content.parts[0].text;
                    // Clean markdown wrapping if present
                    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                    var mercado = JSON.parse(text);
                    mercado._timestamp = Date.now();
                    localStorage.setItem(self.MERCADO_CACHE_KEY, JSON.stringify(mercado));
                    console.log('IA Mercado: briefing atualizado!', mercado);
                    self.gerarInsightsProativos();
                    self._atualizarBadge();
                } catch (e) {
                    console.warn('IA Mercado: erro ao parsear JSON', e);
                    self.gerarInsightsProativos(); // usa cache antigo
                }
            })
            .catch(function (err) {
                console.warn('IA Mercado: erro na API', err);
                self.gerarInsightsProativos(); // usa cache antigo
            });
    },

    getMercado: function () {
        try {
            return JSON.parse(localStorage.getItem(this.MERCADO_CACHE_KEY) || 'null');
        } catch (e) { return null; }
    },

    // ══════════════════════════════════════════════════════════════
    //  C1: PAINEL DE INSIGHTS NA HOME — Cruza mercado + fazenda
    // ══════════════════════════════════════════════════════════════
    gerarInsightsProativos: function () {
        var container = document.getElementById('ia-insights-home');
        if (!container) return;

        var mercado = this.getMercado();
        var insights = [];
        var events = window.data ? window.data.events : [];

        // ── Dados internos da fazenda ──
        var lotesMap = {};
        events.forEach(function (ev) {
            if (ev.type === 'LOTE') lotesMap[ev.nome] = ev;
        });
        var lotesAtivos = [];
        for (var n in lotesMap) {
            if (lotesMap[n].status === 'ATIVO') lotesAtivos.push(lotesMap[n]);
        }
        var totalCabecas = 0;
        var pesoTotal = 0;
        var pesados = 0;
        lotesAtivos.forEach(function (l) {
            var qtd = l.qtdAnimais || 0;
            totalCabecas += qtd;
            if (l.pesoMedio && qtd > 0) {
                pesoTotal += l.pesoMedio * qtd;
                pesados += qtd;
            }
        });
        var pesoMedio = pesados > 0 ? pesoTotal / pesados : 0;
        var totalArrobas = pesoTotal > 0 ? pesoTotal / 30 : 0;

        // ── Preço da arroba (mercado real ou config) ──
        var precoArroba = 0;
        if (mercado && mercado.arrobaBA) {
            precoArroba = mercado.arrobaBA;
        } else if (mercado && mercado.arrobaSP) {
            precoArroba = mercado.arrobaSP;
        } else if (window.contas && window.contas.getPrecoArroba) {
            precoArroba = window.contas.getPrecoArroba() || 0;
        }

        // ── INSIGHT 1: Cotação do dia ──
        if (mercado && mercado.arrobaSP) {
            var icone = mercado.tendencia === 'alta' ? '📈' : mercado.tendencia === 'queda' ? '📉' : '➡️';
            var cor = mercado.tendencia === 'alta' ? '#16a34a' : mercado.tendencia === 'queda' ? '#dc2626' : '#ca8a04';
            insights.push({
                icon: icone,
                title: 'Arroba Hoje (CEPEA/SP)',
                value: 'R$ ' + Number(mercado.arrobaSP).toFixed(2),
                sub: (mercado.variacao7d || '') + ' na semana | Tendência: ' + (mercado.tendencia || '—'),
                color: cor,
                action: 'Como está o mercado da arroba hoje? Analise tendências e me aconselhe.'
            });
        }

        // ── INSIGHT 2: Valor do rebanho ──
        if (totalArrobas > 0 && precoArroba > 0) {
            var valorRebanho = totalArrobas * precoArroba;
            insights.push({
                icon: '🐂',
                title: 'Valor do Rebanho em Pé',
                value: 'R$ ' + valorRebanho.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
                sub: totalCabecas + ' cab × ' + pesoMedio.toFixed(0) + 'kg = ' + totalArrobas.toFixed(0) + '@ × R$' + precoArroba.toFixed(0),
                color: '#2563eb',
                action: 'Analise o valor do meu rebanho e me diga se é hora de vender algum lote.'
            });
        }

        // ── INSIGHT 3: Lote pronto pra venda ──
        var lotePronto = null;
        lotesAtivos.forEach(function (l) {
            if (l.pesoMedio && l.pesoMedio / 30 >= 16) {
                if (!lotePronto || l.pesoMedio > lotePronto.pesoMedio) lotePronto = l;
            }
        });
        if (lotePronto && precoArroba > 0) {
            var arrobasLote = (lotePronto.pesoMedio / 30) * (lotePronto.qtdAnimais || 0);
            var valorLote = arrobasLote * precoArroba;
            var tendMsg = '';
            if (mercado && mercado.tendencia === 'alta') tendMsg = ' | Mercado em ALTA!';
            else if (mercado && mercado.tendencia === 'queda') tendMsg = ' | ⚠️ Mercado caindo';
            insights.push({
                icon: '💰',
                title: 'Lote Pronto: ' + lotePronto.nome,
                value: 'R$ ' + valorLote.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
                sub: (lotePronto.qtdAnimais || 0) + ' cab × ' + (lotePronto.pesoMedio / 30).toFixed(1) + '@ = ' + arrobasLote.toFixed(0) + '@' + tendMsg,
                color: '#16a34a',
                action: 'Analise o lote "' + lotePronto.nome + '" com ' + (lotePronto.qtdAnimais || 0) + ' cabeças a ' + lotePronto.pesoMedio + 'kg. Devo vender agora?'
            });
        }

        // ── INSIGHT 4: Relação de Troca ──
        if (mercado && mercado.rt) {
            var rtStatus = mercado.rt < 8 ? 'BOA' : mercado.rt > 10 ? 'RUIM' : 'Regular';
            var rtCor = mercado.rt < 8 ? '#16a34a' : mercado.rt > 10 ? '#dc2626' : '#ca8a04';
            insights.push({
                icon: '🔄',
                title: 'Relação de Troca (RT)',
                value: mercado.rt.toFixed(1) + ' arrobas/bezerro',
                sub: rtStatus + ' — ' + (mercado.rt < 8 ? 'Bom momento pra repor!' : mercado.rt > 10 ? 'Reposição cara, cuidado!' : 'Dentro do normal'),
                color: rtCor,
                action: 'A relação de troca está em ' + mercado.rt + '. É bom momento pra comprar reposição?'
            });
        }

        // ── INSIGHT 5: Notícias do mercado ──
        if (mercado && mercado.noticias && mercado.noticias.length > 0) {
            var noticia = mercado.noticias[0];
            insights.push({
                icon: '📰',
                title: noticia.titulo,
                value: '',
                sub: noticia.resumo,
                color: '#6d28d9',
                action: 'Me fale mais sobre: "' + noticia.titulo + '" e como afeta minha fazenda.'
            });
        }

        // ── INSIGHT 6: Custos x Mercado ──
        if (window.indicadores && precoArroba > 0) {
            try {
                var margem = window.indicadores.calcMargemArroba ? window.indicadores.calcMargemArroba() : null;
                if (margem && margem.custoMedio > 0) {
                    var margemValor = precoArroba - margem.custoMedio;
                    var margemOk = margemValor > 0;
                    insights.push({
                        icon: margemOk ? '✅' : '🚨',
                        title: 'Margem por Arroba',
                        value: 'R$ ' + margemValor.toFixed(2) + '/@',
                        sub: 'Custo: R$' + margem.custoMedio.toFixed(0) + '/@ | Mercado: R$' + precoArroba.toFixed(0) + '/@ | ' + (margemOk ? 'Positiva!' : 'NEGATIVA!'),
                        color: margemOk ? '#16a34a' : '#dc2626',
                        action: 'Meu custo de produção é R$' + margem.custoMedio.toFixed(0) + '/@ e a arroba está R$' + precoArroba.toFixed(0) + '. Analise minha margem.'
                    });
                }
            } catch (e) { }
        }

        // ── INSIGHT 7: Estoque baixo ──
        if (window.estoque && window.estoque.getStockItems) {
            var estoqueItems = window.estoque.getStockItems();
            var baixos = estoqueItems.filter(function (e) { return e.qty <= (e.min || 0); });
            if (baixos.length > 0) {
                var nomes = baixos.slice(0, 3).map(function (b) { return b.name; }).join(', ');
                insights.push({
                    icon: '📦',
                    title: 'Estoque Baixo: ' + baixos.length + ' itens',
                    value: '',
                    sub: nomes + (baixos.length > 3 ? ' e mais ' + (baixos.length - 3) : ''),
                    color: '#ea580c',
                    action: 'Tenho ' + baixos.length + ' itens com estoque baixo. Quais priorizar?'
                });
            }
        }

        // ── INSIGHT 8: Sazonalidade ──
        var mes = new Date().getMonth(); // 0-11
        var sazonMsg = '';
        if (mes >= 8 && mes <= 10) sazonMsg = '📈 Set-Nov: ENTRESSAFRA — preços em ALTA historicamente!';
        else if (mes >= 2 && mes <= 4) sazonMsg = '📉 Mar-Mai: SAFRA de capim — preços tendem a cair';
        else if (mes >= 5 && mes <= 7) sazonMsg = '⚖️ Jun-Ago: Período de transição — atenção ao clima';
        else sazonMsg = '🎄 Dez-Fev: Demanda forte (festas + verão)';

        if (sazonMsg) {
            insights.push({
                icon: '📅',
                title: 'Sazonalidade',
                value: '',
                sub: sazonMsg,
                color: '#0891b2',
                action: 'Estamos em qual fase do ciclo pecuário? O que devo fazer nos próximos 3 meses?'
            });
        }

        // ── INSIGHT 9: Insumos (milho, soja) ──
        if (mercado && mercado.milho60kg) {
            insights.push({
                icon: '🌽',
                title: 'Insumos',
                value: 'Milho: R$ ' + Number(mercado.milho60kg).toFixed(2) + '/sc',
                sub: (mercado.soja60kg ? 'Soja: R$ ' + Number(mercado.soja60kg).toFixed(2) + '/sc | ' : '') + 'Dólar: R$ ' + (mercado.dolar || '—'),
                color: '#d97706',
                action: 'Analise os preços dos insumos (milho, soja) e como afetam meu custo de confinamento.'
            });
        }

        // ── RENDER ──
        if (insights.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Limit display to max 4, but keep all for scrolling
        var html = '<div class="ia-insights-section">'
            + '<div class="ia-insights-header">'
            + '<span class="ia-insights-icon">🤖</span>'
            + '<span class="ia-insights-title">AgroIA — Análise do Dia</span>'
            + (mercado && mercado.data ? '<span class="ia-insights-date">' + mercado.data + '</span>' : '')
            + '</div>'
            + '<div class="ia-insights-grid">';

        insights.forEach(function (ins) {
            html += '<div class="ia-insight-card" style="border-left: 4px solid ' + ins.color + ';" '
                + 'onclick="window.iaConsultor._abrirComPergunta(\'' + ins.action.replace(/'/g, "\\'") + '\')">'
                + '<div class="ia-insight-top">'
                + '<span class="ia-insight-emoji">' + ins.icon + '</span>'
                + '<span class="ia-insight-card-title">' + ins.title + '</span>'
                + '</div>'
                + (ins.value ? '<div class="ia-insight-value" style="color:' + ins.color + ';">' + ins.value + '</div>' : '')
                + '<div class="ia-insight-sub">' + ins.sub + '</div>'
                + '<div class="ia-insight-action">Saber mais →</div>'
                + '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    },

    _abrirComPergunta: function (pergunta) {
        this.toggle();
        var self = this;
        setTimeout(function () {
            self.enviarPergunta(pergunta);
        }, 400);
    },

    // ══════════════════════════════════════════════════════════════
    //  C2: TOOLTIP CONTEXTUAL NO FAB — Muda por tela
    // ══════════════════════════════════════════════════════════════
    _tooltipMap: {
        'home': { msg: '📊 Como estão meus resultados?', q: 'Como estão os resultados da minha fazenda? Analise KPIs e me dê sugestões.' },
        'lotes': { msg: '🐄 Qual lote devo vender primeiro?', q: 'Analise meus lotes e me diga qual tem melhor margem e deve ser vendido primeiro.' },
        'pastos': { msg: '🌿 Meus pastos estão bem lotados?', q: 'Analise a lotação dos meus pastos com base na chuva e número de animais.' },
        'rebanho': { msg: '📋 Resumo do meu rebanho', q: 'Dê um resumo completo do meu rebanho com análise.' },
        'compra': { msg: '💡 É hora boa pra comprar?', q: 'Analise o mercado atual e me diga se é bom momento para comprar gado de reposição.' },
        'venda': { msg: '💰 Devo vender agora ou esperar?', q: 'Analise o mercado e meus lotes. Devo vender agora ou esperar? Considere sazonalidade e tendência.' },
        'estoque': { msg: '📦 Quanto tempo meu estoque dura?', q: 'Analise meu estoque de insumos e me diga quanto tempo cada item dura no consumo atual.' },
        'fluxo': { msg: '💸 Como está minha saúde financeira?', q: 'Analise meu fluxo de caixa, contas a pagar e receitas projetadas. Como está minha saúde financeira?' },
        'manejo': { msg: '💉 Próximos manejos recomendados?', q: 'Quais manejos sanitários devo fazer esta semana? Verifique vacinas e carências.' },
        'mapa': { msg: '🗺️ Análise de lotação dos pastos', q: 'Analise a distribuição dos animais nos pastos e sugira rotação ideal.' },
        'calendario': { msg: '📅 Vacinas e carências pendentes?', q: 'Quais vacinas estão pendentes? Há carências ativas que preciso observar?' },
        'contas': { msg: '📋 Resumo das contas a pagar', q: 'Analise minhas contas a pagar, vencidas e futuras. O que priorizar?' },
        'config': { msg: '⚙️ Precisa de ajuda?', q: 'Me ajude a configurar o app AgroMacro corretamente.' },
        'cabecas': { msg: '🐂 Análise individual do rebanho', q: 'Analise os dados individuais do meu rebanho.' },
        'balanco': { msg: '📈 Explicar meu balanço', q: 'Explique meu balanço financeiro de forma simples. O que está bom e o que precisa melhorar?' },
        'obras': { msg: '🔨 Custos de infraestrutura', q: 'Analise os custos de obras e infraestrutura da fazenda.' },
        'funcionarios': { msg: '👷 Gestão da equipe', q: 'Analise os custos com funcionários e produtividade da equipe.' },
        'rastreabilidade': { msg: '📋 GTA e SISBOV em dia?', q: 'Analise a rastreabilidade do meu rebanho. GTAs e SISBOV estão em dia?' }
    },

    atualizarContextoTela: function (pageId) {
        this._telaAtual = pageId;
        var self = this;

        // Clear previous tooltip
        if (this._tooltipTimer) {
            clearTimeout(this._tooltipTimer);
            this._tooltipTimer = null;
        }
        var oldTooltip = document.getElementById('ia-tooltip');
        if (oldTooltip) oldTooltip.remove();

        var mapEntry = this._tooltipMap[pageId];
        if (!mapEntry) return;

        // Add market data to tooltip if available
        var msg = mapEntry.msg;
        var mercado = this.getMercado();
        if (pageId === 'home' && mercado && mercado.arrobaSP) {
            var icone = mercado.tendencia === 'alta' ? '↑' : mercado.tendencia === 'queda' ? '↓' : '→';
            msg = '📊 CEPEA: R$' + Number(mercado.arrobaSP).toFixed(0) + '/@ ' + icone;
        } else if (pageId === 'venda' && mercado && mercado.tendencia) {
            msg = mercado.tendencia === 'alta' ? '📈 Mercado em ALTA — bom momento!' : mercado.tendencia === 'queda' ? '📉 Mercado caindo — analise antes' : '➡️ Mercado estável';
        } else if (pageId === 'compra' && mercado && mercado.rt) {
            msg = '🔄 RT: ' + mercado.rt.toFixed(1) + ' — ' + (mercado.rt < 8 ? 'Bom pra comprar!' : 'Caro!');
        }

        // Show tooltip after short delay
        setTimeout(function () {
            var fab = document.getElementById('ia-fab');
            if (!fab) return;

            var tooltip = document.createElement('div');
            tooltip.id = 'ia-tooltip';
            tooltip.className = 'ia-tooltip';
            tooltip.innerHTML = '<span>' + msg + '</span>';
            tooltip.onclick = function () {
                tooltip.remove();
                self._abrirComPergunta(mapEntry.q);
            };
            document.body.appendChild(tooltip);

            // Auto-hide after 6s
            self._tooltipTimer = setTimeout(function () {
                if (tooltip.parentNode) {
                    tooltip.classList.add('ia-tooltip-hide');
                    setTimeout(function () { if (tooltip.parentNode) tooltip.remove(); }, 500);
                }
            }, 6000);
        }, 800);
    },

    // ══════════════════════════════════════════════════════════════
    //  C4: BADGE DE NOTIFICAÇÃO NO FAB
    // ══════════════════════════════════════════════════════════════
    _atualizarBadge: function () {
        var count = 0;
        var mercado = this.getMercado();
        var events = window.data ? window.data.events : [];

        // Boi pronto + mercado em alta
        var lotesMap = {};
        events.forEach(function (ev) { if (ev.type === 'LOTE') lotesMap[ev.nome] = ev; });
        for (var n in lotesMap) {
            var l = lotesMap[n];
            if (l.status === 'ATIVO' && l.pesoMedio && l.pesoMedio / 30 >= 16) {
                count++;
                break; // count once
            }
        }

        // Mercado trending
        if (mercado && (mercado.tendencia === 'alta' || mercado.tendencia === 'queda')) count++;

        // Contas vencidas
        var hoje = new Date().toISOString().split('T')[0];
        var vencidas = events.filter(function (e) {
            return e.type === 'CONTA_PAGAR' && !e.pago && e.vencimento && e.vencimento < hoje;
        });
        if (vencidas.length > 0) count++;

        // Estoque baixo
        if (window.estoque && window.estoque.getStockItems) {
            var baixos = window.estoque.getStockItems().filter(function (e) { return e.qty <= (e.min || 0); });
            if (baixos.length > 0) count++;
        }

        // Notícias novas
        if (mercado && mercado.noticias && mercado.noticias.length > 0) count++;

        this._badgeCount = count;
        var badge = document.getElementById('ia-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    // ══════════════════════════════════════════════════════════════
    //  C6: PÓS-AÇÃO INTELIGENTE — Sugestão após registrar dados
    // ══════════════════════════════════════════════════════════════
    notificarPosAcao: function (tipo, dados) {
        var mercado = this.getMercado();
        var msg = '';
        var pergunta = '';

        switch (tipo) {
            case 'compra':
                msg = '🤖 Compra registrada! ';
                if (mercado && mercado.rt) {
                    msg += 'RT atual: ' + mercado.rt.toFixed(1) + '. ';
                }
                msg += 'Quer que eu analise?';
                pergunta = 'Registrei uma compra de ' + (dados.qtd || '?') + ' cabeças por R$ ' + (dados.valor || '?') + '. Analise a relação de troca e se foi bom negócio.';
                break;
            case 'venda':
                msg = '🤖 Venda registrada! ';
                if (mercado && mercado.arrobaSP) {
                    msg += 'CEPEA: R$' + Number(mercado.arrobaSP).toFixed(0) + '/@. ';
                }
                msg += 'Quer análise da margem?';
                pergunta = 'Registrei uma venda de ' + (dados.qtd || '?') + ' cabeças por R$ ' + (dados.valor || '?') + '. Calcule a margem por arroba e me diga se foi bom preço.';
                break;
            case 'pesagem':
                msg = '🤖 Peso atualizado! ';
                if (dados.gmd) msg += 'GMD: ' + dados.gmd.toFixed(3) + ' kg/dia. ';
                msg += 'Quer projeção de abate?';
                pergunta = 'Atualizei o peso do lote "' + (dados.lote || '') + '" para ' + (dados.peso || '?') + ' kg (GMD: ' + (dados.gmd || '?') + '). Quando atinge 16@? Qual o custo estimado até lá?';
                break;
            case 'estoque':
                msg = '📦 ' + (dados.nome || 'Item') + ' atualizado. ';
                if (dados.diasRestantes) msg += 'Dura ~' + dados.diasRestantes + ' dias.';
                pergunta = 'Atualizei o estoque de ' + (dados.nome || 'um item') + '. Analise meu estoque e me diga o que priorizar para compra.';
                break;
            default:
                return;
        }

        // Show toast with IA suggestion
        this._mostrarToastIA(msg, pergunta);
    },

    // ══════════════════════════════════════════════════════════════
    //  SMART NAVIGATION — Navega pra tela certa + abre chat com pergunta
    // ══════════════════════════════════════════════════════════════
    _abrirComPergunta: function (pergunta, telaDestino) {
        var self = this;

        // Smart navigation: detect the right screen from the question context
        if (!telaDestino) {
            var q = (pergunta || '').toLowerCase();
            if (q.indexOf('lote') >= 0 || q.indexOf('peso') >= 0 || q.indexOf('gmd') >= 0 || q.indexOf('arroba') >= 0) {
                telaDestino = 'lotes';
            } else if (q.indexOf('estoque') >= 0 || q.indexOf('sal ') >= 0 || q.indexOf('insumo') >= 0) {
                telaDestino = 'estoque';
            } else if (q.indexOf('venda') >= 0 || q.indexOf('compra') >= 0 || q.indexOf('fluxo') >= 0 || q.indexOf('financ') >= 0 || q.indexOf('margem') >= 0 || q.indexOf('custo') >= 0) {
                telaDestino = 'fluxo';
            } else if (q.indexOf('pasto') >= 0 || q.indexOf('rotação') >= 0 || q.indexOf('lotação') >= 0) {
                telaDestino = 'pastos';
            } else if (q.indexOf('mercado') >= 0 || q.indexOf('cepea') >= 0 || q.indexOf('b3') >= 0 || q.indexOf('hedge') >= 0 || q.indexOf('cpr') >= 0 || q.indexOf('travar') >= 0) {
                telaDestino = 'home';
            } else if (q.indexOf('mapa') >= 0) {
                telaDestino = 'mapa';
            } else if (q.indexOf('resultado') >= 0 || q.indexOf('balanço') >= 0 || q.indexOf('dre') >= 0) {
                telaDestino = 'resultados';
            }
        }

        // Navigate to the target screen first
        if (telaDestino && window.app && window.app.navigate) {
            window.app.navigate(telaDestino);
        }

        // Open chat and send the question
        setTimeout(function () {
            if (!self.aberto) {
                self.toggle();
            }
            // Wait for chat UI to render, then inject the question
            setTimeout(function () {
                var input = document.getElementById('ia-input');
                if (input) {
                    input.value = pergunta;
                    // Trigger send
                    self._enviarDoInput();
                }
            }, 300);
        }, 200);
    },

    _mostrarToastIA: function (msg, pergunta) {
        var existing = document.getElementById('ia-toast');
        if (existing) existing.remove();

        var self = this;
        var toast = document.createElement('div');
        toast.id = 'ia-toast';
        toast.className = 'ia-toast';
        toast.innerHTML = '<div class="ia-toast-text">' + msg + '</div>'
            + '<button class="ia-toast-btn" onclick="window.iaConsultor._abrirComPergunta(\'' + pergunta.replace(/'/g, "\\'") + '\'); this.parentNode.remove();">Analisar</button>'
            + '<button class="ia-toast-close" onclick="this.parentNode.remove();">✕</button>';
        document.body.appendChild(toast);

        // Auto-hide after 10s
        setTimeout(function () {
            if (toast.parentNode) {
                toast.classList.add('ia-toast-hide');
                setTimeout(function () { if (toast.parentNode) toast.remove(); }, 500);
            }
        }, 10000);
    }
};
