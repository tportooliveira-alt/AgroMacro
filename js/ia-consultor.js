// ====== MÓDULO: IA CONSULTOR PECUÁRIO (Gemini API Real) ======
// Usa Google Gemini Flash-Lite via Cloudflare Worker proxy
// Custo: R$ 0/mês (free tier: 1000 req/dia)
window.iaConsultor = {

    // ══ CONFIGURAÇÃO ══
    // Opção 1: URL do Cloudflare Worker (produção — API key protegida)
    // Opção 2: API key direto (desenvolvimento/teste local)
    WORKER_URL: '', // Preencher após deploy: 'https://agromacro-ia.SEU-USUARIO.workers.dev'
    API_KEY: '',    // Apenas para teste local — NÃO usar em produção

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
        } catch (e) { }

        console.log('IA Consultor Ready' + (this._temConexao() ? ' (conectada)' : ' (sem config)'));
    },

    _temConexao: function () {
        return !!(this.WORKER_URL || this.API_KEY);
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
            // Via API direta (teste local)
            this._chamarGeminiDireto(mensagensRecentes, contexto);
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

    _chamarGeminiDireto: function (messages, context) {
        var self = this;

        var systemPrompt = 'Você é um consultor pecuário especialista em bovinocultura de corte no Brasil (Bahia).\n'
            + 'Seu nome é AgroIA. Você trabalha para o app AgroMacro.\n\n'
            + 'REGRAS CRÍTICAS:\n'
            + '1. Responda SEMPRE em português brasileiro\n'
            + '2. Seja DIRETO e PRÁTICO — como um veterinário/zootecnista experiente falaria no campo\n'
            + '3. Use os DADOS REAIS da fazenda fornecidos abaixo para dar respostas PRECISAS\n'
            + '4. Se não souber algo, diga "Não tenho informação suficiente" — NUNCA invente dados\n'
            + '5. Para diagnósticos de saúde animal, SEMPRE recomende consultar um veterinário presencial\n'
            + '6. Formate respostas com emojis e tópicos curtos para fácil leitura no celular\n'
            + '7. Mantenha respostas com no máximo 300 palavras\n\n'
            + 'DADOS ATUAIS DA FAZENDA:\n' + context;

        var contents = [];
        contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        contents.push({ role: 'model', parts: [{ text: 'Entendido! Sou o AgroIA, seu consultor pecuário. Tenho acesso aos dados reais da sua fazenda. Como posso ajudar?' }] });

        messages.forEach(function (m) {
            contents.push({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            });
        });

        var model = 'gemini-2.0-flash-lite';
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + this.API_KEY;

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.8,
                    maxOutputTokens: 1024
                }
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                self._mostrarDigitando(false);
                var reply = '';
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    reply = data.candidates[0].content.parts[0].text;
                } else if (data.error) {
                    reply = '⚠️ Erro da API: ' + data.error.message;
                } else {
                    reply = '⚠️ Resposta inesperada da IA.';
                }
                self.historico.push({ role: 'model', content: reply, time: Date.now() });
                self._salvarHistorico();
                self._renderMensagens();
            })
            .catch(function (err) {
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
            + '<div class="ia-welcome-sub">Para usar a IA real, você precisa de uma API key gratuita do Google.</div>'
            + '<div class="ia-config-steps">'
            + '<p><strong>Passo 1:</strong> Acesse <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563EB;">aistudio.google.com/apikey</a></p>'
            + '<p><strong>Passo 2:</strong> Clique em "Create API key" (é grátis)</p>'
            + '<p><strong>Passo 3:</strong> Cole a key abaixo:</p>'
            + '</div>'
            + '<div class="form-group" style="margin-top:12px;">'
            + '<input type="text" id="ia-config-key" placeholder="Cole sua API key aqui..." style="font-size:14px;">'
            + '</div>'
            + '<button class="submit-btn" onclick="window.iaConsultor._salvarConfig()" style="margin-top:8px;">✅ Ativar IA</button>'
            + '<p style="margin-top:12px;font-size:11px;color:#636366;">💡 A key fica salva apenas no seu celular. Custo: R$ 0/mês (1000 consultas/dia grátis).</p>'
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

        this.API_KEY = key;
        localStorage.setItem('agromacro_ia_config', JSON.stringify({ apiKey: key }));
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
