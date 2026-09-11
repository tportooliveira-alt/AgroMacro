// ====== LEARNING-STORE.JS — Aprendizado Contínuo por Feedback ======
// 100% offline — usa keyword matching, não LLM
window.learningStore = {
    STORAGE_KEY: 'agromacro_learned_patterns',
    MAX_PATTERNS: 100,
    MAX_AGE_DAYS: 90,

    init: function () {
        this._carregarPatterns();
        console.log('LearningStore ready');
    },

    _carregarPatterns: function () {
        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            // Limpar padrões antigos (>90 dias)
            var cutoff = Date.now() - (this.MAX_AGE_DAYS * 86400000);
            lista = lista.filter(function (p) {
                return new Date(p.timestamp).getTime() >= cutoff;
            });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
        } catch (e) {
            console.warn('LearningStore load error:', e);
        }
    },

    /**
     * Registrar uma ação bem-sucedida (quando usuário clica ✅ Executar)
     * @param {string} intent - Intenção original do usuário (ex: "vender 50 boi")
     * @param {array} acoes - Array de ações que foram executadas
     * @param {object} summary - Resumo do contexto (rebanho total, mercado, etc)
     */
    recordSuccess: function (intent, acoes, summary) {
        if (!intent || !acoes || acoes.length === 0) return;

        var pattern = {
            timestamp: new Date().toISOString(),
            intent: intent,
            keywords: this._extractKeywords(intent),
            acoes: acoes.map(function (a) {
                return {
                    tipo: a.tipo,
                    dadosKeys: Object.keys(a.dados || {})
                };
            }),
            context: {
                rebanhoTotal: summary ? summary.totalHeads : null,
                ativeLotes: summary ? summary.activeLotes : null,
                overdueAccounts: summary ? summary.overdueAccounts : null,
                lowInventory: summary ? summary.lowInventoryItems : null
            },
            rating: 5, // Usuário confirmou = 5 estrelas
            feedback: null
        };

        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            lista.push(pattern);

            // Manter últimas 100
            if (lista.length > this.MAX_PATTERNS) {
                lista = lista.slice(-this.MAX_PATTERNS);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
            console.log('📚 Padrão aprendido:', pattern.intent);
        } catch (e) {
            console.warn('LearningStore recordSuccess error:', e);
        }
    },

    /**
     * Obter padrões similares por keywords
     * @param {string} texto - Texto de entrada
     * @param {number} limit - Quantos padrões retornar (default 3)
     * @return {array} Padrões ordenados por relevância
     */
    getSimilarPatterns: function (texto, limit) {
        limit = limit || 3;

        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            if (lista.length === 0) return [];

            var keywords = this._extractKeywords(texto);
            if (keywords.length === 0) return [];

            // Score each pattern
            var scored = lista.map(function (p) {
                var score = 0;
                keywords.forEach(function (kw) {
                    if (p.keywords.indexOf(kw) >= 0) {
                        score += 2; // Keyword match
                    }
                    // Fuzzy: substring match
                    if (p.intent.toLowerCase().indexOf(kw) >= 0) {
                        score += 1;
                    }
                });
                return {
                    pattern: p,
                    score: score
                };
            })
            .filter(function (s) { return s.score > 0; })
            .sort(function (a, b) { return b.score - a.score; });

            return scored.slice(0, limit).map(function (s) { return s.pattern; });
        } catch (e) {
            console.warn('LearningStore getSimilarPatterns error:', e);
            return [];
        }
    },

    /**
     * Formatar padrões para incluir no prompt (few-shot examples)
     * @param {array} patterns - Array de padrões
     * @return {string} Texto formatado para prompt
     */
    formatPatternsAsPrompt: function (patterns) {
        if (!patterns || patterns.length === 0) {
            return '';
        }

        var linhas = ['\n═══ PADRÕES ANTERIORES BEM-SUCEDIDOS ═══'];
        linhas.push('O usuário já fez com sucesso:');

        patterns.forEach(function (p, idx) {
            linhas.push((idx + 1) + '. "' + p.intent + '"');
            linhas.push('   Ações: ' + p.acoes.map(function (a) { return a.tipo; }).join(', '));
        });

        linhas.push('\nConsidere padrões similares para esta pergunta.');
        return linhas.join('\n');
    },

    /**
     * Extrair keywords de um texto (simples, 100% offline)
     */
    _extractKeywords: function (texto) {
        if (!texto) return [];

        // Palavras-chave importantes de pecuária
        var agricKeywords = {
            vend: ['vender', 'venda', 'vend'],
            compr: ['compra', 'comprar', 'compr'],
            lote: ['lote', 'lotes'],
            pasto: ['pasto', 'pastos', 'pastagem'],
            rebanho: ['rebanho', 'gado', 'boi', 'bois', 'cabeca', 'cabecas'],
            mercado: ['mercado', 'preco', 'arroba', 'valor'],
            custos: ['custo', 'custs', 'despesa', 'gasto'],
            nutricao: ['racao', 'dieta', 'nutriente', 'cocho', 'comida'],
            manejo: ['manejo', 'tratamento', 'vacina', 'sanitario'],
            pesagem: ['peso', 'pesagem', 'pesar', 'kg'],
            meta: ['meta', 'alvo', 'objetivo', 'prazo']
        };

        var lower = texto.toLowerCase();
        var found = {};

        Object.keys(agricKeywords).forEach(function (key) {
            agricKeywords[key].forEach(function (word) {
                if (lower.indexOf(word) >= 0) {
                    found[key] = true;
                }
            });
        });

        return Object.keys(found);
    },

    /**
     * Obter estatísticas de padrões aprendidos
     */
    obterEstatisticas: function () {
        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');

            var porTipo = {};
            var porKeyword = {};

            lista.forEach(function (p) {
                p.acoes.forEach(function (a) {
                    porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
                });
                p.keywords.forEach(function (kw) {
                    porKeyword[kw] = (porKeyword[kw] || 0) + 1;
                });
            });

            return {
                totalPatterns: lista.length,
                topAcoes: Object.keys(porTipo)
                    .sort(function (a, b) { return porTipo[b] - porTipo[a]; })
                    .slice(0, 5)
                    .map(function (k) { return k + ' (' + porTipo[k] + ')'; }),
                topKeywords: Object.keys(porKeyword)
                    .sort(function (a, b) { return porKeyword[b] - porKeyword[a]; })
                    .slice(0, 5)
                    .map(function (k) { return k + ' (' + porKeyword[k] + ')'; })
            };
        } catch (e) {
            return { totalPatterns: 0, topAcoes: [], topKeywords: [] };
        }
    },

    /**
     * Debug: imprimir todos os padrões
     */
    debugPrintPatterns: function () {
        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            console.table(lista);
            return lista;
        } catch (e) {
            console.error('Debug error:', e);
            return [];
        }
    }
};
