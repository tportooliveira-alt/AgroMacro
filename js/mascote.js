// ====== MÓDULO: MASCOTE IA — "BOTECO" ======
// Assistente inteligente embutido no AgroMacro
// 100% offline — regras inteligentes + dados do app
// Módulos: Financeiro, Genética, Estoque, Glossário, Guia, Relatório
window.mascote = {
    chatAberto: false,
    mensagens: [],
    alertasAtivos: [],

    // ════════════════════════════════════════
    // INIT — Scanner de alertas + Mount UI
    // ════════════════════════════════════════
    init: function () {
        console.log('🤖 Boteco — Mascote IA Ready');
        this.montarUI();
        // Roda scanner após 2s pra dar tempo dos módulos carregarem
        var self = this;
        setTimeout(function () {
            self.alertasAtivos = self.getAlertasProativos();
            self.atualizarBadge();
            // Mensagem de boas vindas
            self.mensagens.push({
                de: 'boteco',
                texto: self.saudacao(),
                hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        }, 2000);
    },

    saudacao: function () {
        var h = new Date().getHours();
        var periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
        var alertas = this.alertasAtivos.length;
        var msg = '🐂 ' + periodo + ', patrão! Aqui é o Boteco, seu capataz digital.\n\n';
        if (alertas > 0) {
            msg += '📢 Tenho ' + alertas + ' alerta' + (alertas > 1 ? 's' : '') + ' pra você. Digite "alertas" pra ver.\n\n';
        }
        msg += 'Me pergunte qualquer coisa:\n';
        msg += '• "custo" — análise financeira\n';
        msg += '• "touro" — catálogo genético\n';
        msg += '• "estoque" — situação dos insumos\n';
        msg += '• "o que é GMD" — glossário agro\n';
        msg += '• "como cadastrar lote" — guia do app\n';
        msg += '• "resumo" — relatório geral';
        return msg;
    },

    // ════════════════════════════════════════
    // UI — Montar Chat Flutuante
    // ════════════════════════════════════════
    montarUI: function () {
        // CSS do mascote
        var style = document.createElement('style');
        style.id = 'mascote-styles';
        style.textContent = ''
            // FAB Button
            + '#mascote-fab {'
            + '  position: fixed; bottom: 20px; right: 20px; z-index: 9999;'
            + '  width: 60px; height: 60px; border-radius: 50%;'
            + '  background: linear-gradient(135deg, #10B981, #059669);'
            + '  border: 3px solid #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.4);'
            + '  display: flex; align-items: center; justify-content: center;'
            + '  cursor: pointer; transition: all 0.3s ease;'
            + '  font-size: 28px; animation: mascote-pulse 2s infinite;'
            + '}'
            + '#mascote-fab:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(16,185,129,0.6); }'
            + '#mascote-fab:active { transform: scale(0.95); }'
            + '#mascote-badge {'
            + '  position: absolute; top: -4px; right: -4px;'
            + '  background: #EF4444; color: #fff; font-size: 11px; font-weight: bold;'
            + '  min-width: 20px; height: 20px; border-radius: 10px;'
            + '  display: none; align-items: center; justify-content: center;'
            + '  border: 2px solid #fff; padding: 0 4px;'
            + '}'
            + '@keyframes mascote-pulse {'
            + '  0%, 100% { box-shadow: 0 4px 20px rgba(16,185,129,0.4); }'
            + '  50% { box-shadow: 0 4px 30px rgba(16,185,129,0.7); }'
            + '}'
            // Chat Panel
            + '#mascote-chat {'
            + '  position: fixed; bottom: 90px; right: 16px; z-index: 9998;'
            + '  width: 340px; max-width: calc(100vw - 32px); height: 480px; max-height: 70vh;'
            + '  background: #0F172A; border-radius: 16px;'
            + '  box-shadow: 0 10px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);'
            + '  display: none; flex-direction: column; overflow: hidden;'
            + '  animation: mascote-slideup 0.3s ease;'
            + '}'
            + '@keyframes mascote-slideup {'
            + '  from { opacity: 0; transform: translateY(20px); }'
            + '  to { opacity: 1; transform: translateY(0); }'
            + '}'
            // Header
            + '#mascote-chat .mc-header {'
            + '  background: linear-gradient(135deg, #10B981, #059669);'
            + '  padding: 14px 16px; display: flex; align-items: center; gap: 10px;'
            + '}'
            + '#mascote-chat .mc-header-avatar {'
            + '  font-size: 26px; width: 40px; height: 40px; background: rgba(255,255,255,0.2);'
            + '  border-radius: 50%; display: flex; align-items: center; justify-content: center;'
            + '}'
            + '#mascote-chat .mc-header-info { flex: 1; }'
            + '#mascote-chat .mc-header-info h4 {'
            + '  margin: 0; color: #fff; font-size: 15px; font-weight: 700;'
            + '}'
            + '#mascote-chat .mc-header-info small {'
            + '  color: rgba(255,255,255,0.8); font-size: 11px;'
            + '}'
            + '#mascote-chat .mc-close {'
            + '  background: none; border: none; color: #fff; font-size: 20px;'
            + '  cursor: pointer; opacity: 0.7; padding: 4px;'
            + '}'
            + '#mascote-chat .mc-close:hover { opacity: 1; }'
            // Messages
            + '#mascote-msgs {'
            + '  flex: 1; overflow-y: auto; padding: 12px;'
            + '  display: flex; flex-direction: column; gap: 8px;'
            + '}'
            + '.mc-msg {'
            + '  max-width: 90%; padding: 10px 14px; border-radius: 12px;'
            + '  font-size: 13px; line-height: 1.5; word-wrap: break-word;'
            + '  white-space: pre-line;'
            + '}'
            + '.mc-msg-boteco {'
            + '  background: #1E293B; color: #E2E8F0; align-self: flex-start;'
            + '  border-bottom-left-radius: 4px;'
            + '}'
            + '.mc-msg-user {'
            + '  background: #10B981; color: #fff; align-self: flex-end;'
            + '  border-bottom-right-radius: 4px;'
            + '}'
            + '.mc-msg-time {'
            + '  font-size: 10px; opacity: 0.5; margin-top: 4px; text-align: right;'
            + '}'
            // Input
            + '#mascote-chat .mc-input-area {'
            + '  padding: 10px; border-top: 1px solid rgba(255,255,255,0.1);'
            + '  display: flex; gap: 8px; background: #1E293B;'
            + '}'
            + '#mascote-chat .mc-input {'
            + '  flex: 1; border: 1px solid rgba(255,255,255,0.15); background: #0F172A;'
            + '  color: #E2E8F0; border-radius: 20px; padding: 10px 16px;'
            + '  font-size: 13px; outline: none;'
            + '}'
            + '#mascote-chat .mc-input::placeholder { color: #64748B; }'
            + '#mascote-chat .mc-input:focus { border-color: #10B981; }'
            + '#mascote-chat .mc-send {'
            + '  background: #10B981; border: none; color: #fff; width: 38px; height: 38px;'
            + '  border-radius: 50%; cursor: pointer; font-size: 16px;'
            + '  display: flex; align-items: center; justify-content: center;'
            + '  transition: all 0.2s;'
            + '}'
            + '#mascote-chat .mc-send:hover { background: #059669; transform: scale(1.05); }'
            // Quick buttons
            + '.mc-quick-btns { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; }'
            + '.mc-quick-btn {'
            + '  background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3);'
            + '  border-radius: 16px; padding: 5px 12px; font-size: 11px; cursor: pointer;'
            + '  transition: all 0.2s;'
            + '}'
            + '.mc-quick-btn:hover { background: rgba(16,185,129,0.3); }';

        document.head.appendChild(style);

        // HTML
        var html = ''
            + '<div id="mascote-fab" onclick="window.mascote.toggleChat()">'
            + '  <span>🐂</span>'
            + '  <div id="mascote-badge"></div>'
            + '</div>'
            + '<div id="mascote-chat">'
            + '  <div class="mc-header">'
            + '    <div class="mc-header-avatar">🐂</div>'
            + '    <div class="mc-header-info">'
            + '      <h4>Boteco</h4>'
            + '      <small>🟢 Seu capataz digital</small>'
            + '    </div>'
            + '    <button class="mc-close" onclick="window.mascote.toggleChat()">✕</button>'
            + '  </div>'
            + '  <div id="mascote-msgs"></div>'
            + '  <div class="mc-quick-btns">'
            + '    <button class="mc-quick-btn" onclick="window.mascote.enviar(\'alertas\')">📢 Alertas</button>'
            + '    <button class="mc-quick-btn" onclick="window.mascote.enviar(\'resumo\')">📊 Resumo</button>'
            + '    <button class="mc-quick-btn" onclick="window.mascote.enviar(\'custo\')">💰 Custos</button>'
            + '    <button class="mc-quick-btn" onclick="window.mascote.enviar(\'estoque\')">📦 Estoque</button>'
            + '    <button class="mc-quick-btn" onclick="window.mascote.enviar(\'touro\')">🐂 Touros</button>'
            + '  </div>'
            + '  <div class="mc-input-area">'
            + '    <input type="text" class="mc-input" id="mascote-input" placeholder="Fala comigo, patrão..." '
            + '           onkeypress="if(event.key===\'Enter\')window.mascote.enviarInput()">'
            + '    <button class="mc-send" onclick="window.mascote.enviarInput()">➤</button>'
            + '  </div>'
            + '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    toggleChat: function () {
        var chat = document.getElementById('mascote-chat');
        this.chatAberto = !this.chatAberto;
        chat.style.display = this.chatAberto ? 'flex' : 'none';
        if (this.chatAberto) {
            this.renderMensagens();
            document.getElementById('mascote-input').focus();
        }
    },

    atualizarBadge: function () {
        var badge = document.getElementById('mascote-badge');
        if (!badge) return;
        var n = this.alertasAtivos.length;
        if (n > 0) {
            badge.textContent = n;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    enviarInput: function () {
        var input = document.getElementById('mascote-input');
        var texto = (input.value || '').trim();
        if (!texto) return;
        input.value = '';
        this.enviar(texto);
    },

    enviar: function (texto) {
        var hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Mensagem do usuário
        this.mensagens.push({ de: 'user', texto: texto, hora: hora });

        // Processar resposta
        var resposta = this.processarMensagem(texto);

        // Mensagem do Boteco (com delay pra parecer natural)
        var self = this;
        setTimeout(function () {
            self.mensagens.push({ de: 'boteco', texto: resposta, hora: hora });
            self.renderMensagens();
        }, 400);

        this.renderMensagens();
    },

    renderMensagens: function () {
        var container = document.getElementById('mascote-msgs');
        if (!container) return;

        container.innerHTML = this.mensagens.map(function (m) {
            var cls = m.de === 'boteco' ? 'mc-msg-boteco' : 'mc-msg-user';
            return '<div class="mc-msg ' + cls + '">'
                + m.texto
                + '<div class="mc-msg-time">' + m.hora + '</div>'
                + '</div>';
        }).join('');

        container.scrollTop = container.scrollHeight;
    },

    // ════════════════════════════════════════
    // MOTOR DE IA — Identificar Intenção
    // ════════════════════════════════════════
    processarMensagem: function (texto) {
        var t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        // Alertas
        if (t.match(/alerta/)) return this.mostrarAlertas();

        // Resumo geral
        if (t.match(/resumo|balanco|como (ta|esta|vai)|situacao|geral/)) return this.resumoGeral();

        // Financeiro
        if (t.match(/custo|arroba|margem|lucro|preco|financ|dinheiro|gast|caro|barato/)) return this.analisarFinanceiro();

        // Genética
        if (t.match(/touro|acasala|cruza|dep|genetica|raca|semen|insemina|parentesco|consang/)) return this.analisarGenetica();

        // Estoque
        if (t.match(/estoque|racao|vacina|remedio|sal|mineral|acabando|insumo|falta/)) return this.analisarEstoque();

        // Lotes
        if (t.match(/lote|gmd|peso|engorda|confin|pasto|cocho|abate|dias/)) return this.analisarLotes();

        // Glossário — "o que é X", "explica X", "significa X"
        if (t.match(/o que e |explica|significa|defin/)) return this.explicarTermo(t);

        // Guia do App
        if (t.match(/como (faco|faz|cadastr|registr|lanc)|onde (fica|tem|esta)|tutorial|ajuda|ensina/)) return this.guiarUso(t);

        // Saudação
        if (t.match(/^(oi|ola|eai|fala|bom dia|boa tarde|boa noite|hey|hi)/)) {
            return '🐂 Fala, patrão! Tô aqui pra te ajudar.\n\nMe diz o que precisa:\n• "custo" — ver custos\n• "resumo" — visão geral\n• "alertas" — ver pendências\n• "o que é GMD" — tirar dúvida';
        }

        // Agradecimento
        if (t.match(/obrigad|valeu|vlw|thanks|brigad/)) {
            return '🐂 Tamo junto, patrão! É nóis! 🤠\n\nSe precisar de mais alguma coisa, só chamar.';
        }

        // Não entendeu
        return '🤔 Não entendi bem, patrão. Tenta de outro jeito:\n\n'
            + '💰 "custo" — análise financeira\n'
            + '🧬 "touro" — catálogo genético\n'
            + '📦 "estoque" — situação insumos\n'
            + '📊 "resumo" — relatório geral\n'
            + '📢 "alertas" — ver pendências\n'
            + '📖 "o que é [termo]" — glossário agro\n'
            + '🗺️ "como cadastrar [algo]" — guia do app';
    },

    // ════════════════════════════════════════
    // MÓDULO 1: ALERTAS PROATIVOS
    // ════════════════════════════════════════
    getAlertasProativos: function () {
        var alertas = [];

        // 1. Nutrição acabando
        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            lotes.forEach(function (lote) {
                var nut = window.lotes.calcDuracaoNutricao(lote);
                if (nut && nut.diasPrevistos !== undefined && nut.diasPrevistos <= 7 && nut.diasPrevistos >= 0) {
                    alertas.push({
                        tipo: 'NUTRICAO',
                        icone: '🔴',
                        msg: 'Ração do lote "' + lote.nome + '" acaba em ' + nut.diasPrevistos + ' dias!'
                    });
                }
            });
        }

        // 2. Estoque baixo
        if (window.estoque) {
            var items = window.estoque.getStockItems();
            items.forEach(function (item) {
                if (item.qty <= 0) {
                    alertas.push({
                        tipo: 'ESTOQUE',
                        icone: '📦',
                        msg: item.name + ' zerou no estoque!'
                    });
                }
            });
        }

        // 3. Leitura de cocho ruim
        if (window.nutricao && window.lotes) {
            var lotes2 = window.lotes.getLotes();
            lotes2.forEach(function (lote) {
                var leitura = window.nutricao.getUltimaLeitura(lote.nome);
                if (leitura && leitura.nota >= 3) {
                    alertas.push({
                        tipo: 'COCHO',
                        icone: '🍽️',
                        msg: 'Cocho do lote "' + lote.nome + '" com sobra excessiva (nota ' + leitura.nota + '). Reduzir trato em ' + leitura.ajuste
                    });
                }
            });
        }

        // 4. Custo por arroba alto
        if (window.lotes && window.contas) {
            var precoArroba = window.contas.getPrecoArroba() || 340;
            var lotes3 = window.lotes.getLotes();
            lotes3.forEach(function (lote) {
                var custos = window.lotes.calcCustoTotalLote(lote);
                if (custos && custos.custoPorArroba > 0 && custos.custoPorArroba > precoArroba * 0.85) {
                    alertas.push({
                        tipo: 'FINANCEIRO',
                        icone: '💸',
                        msg: 'Lote "' + lote.nome + '": custo/@ = R$' + custos.custoPorArroba.toFixed(0) + '. Arroba a R$' + precoArroba.toFixed(0) + '. Margem perigosa!'
                    });
                }
            });
        }

        // 5. Contas a pagar vencendo
        if (window.data) {
            var hoje = new Date();
            window.data.events.forEach(function (ev) {
                if (ev.type === 'CONTA_PAGAR' && !ev.pago && ev.vencimento) {
                    var venc = new Date(ev.vencimento);
                    var diff = Math.floor((venc - hoje) / (1000 * 60 * 60 * 24));
                    if (diff <= 7 && diff >= -30) {
                        alertas.push({
                            tipo: 'CONTA',
                            icone: '📋',
                            msg: (diff < 0 ? 'VENCIDA! ' : '') + 'Conta "' + ev.descricao + '" ' + (diff < 0 ? 'venceu há ' + Math.abs(diff) : 'vence em ' + diff) + ' dia(s). R$' + (ev.valor || 0).toFixed(2)
                        });
                    }
                }
            });
        }

        return alertas;
    },

    mostrarAlertas: function () {
        // Refresh
        this.alertasAtivos = this.getAlertasProativos();
        this.atualizarBadge();

        if (this.alertasAtivos.length === 0) {
            return '✅ Tudo tranquilo, patrão! Nenhum alerta no momento.\n\n🐂 O gado tá bem, o estoque tá cheio, e as contas em dia!';
        }

        var msg = '📢 ALERTAS ATIVOS (' + this.alertasAtivos.length + '):\n\n';
        this.alertasAtivos.forEach(function (a, i) {
            msg += (i + 1) + '. ' + a.icone + ' ' + a.msg + '\n\n';
        });
        msg += '💡 Quer que eu explique algum deles? Me diz o número.';
        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 2: ANÁLISE FINANCEIRA
    // ════════════════════════════════════════
    analisarFinanceiro: function () {
        var msg = '💰 ANÁLISE FINANCEIRA\n\n';

        // Preço da arroba
        var precoArroba = 0;
        if (window.contas) {
            precoArroba = window.contas.getPrecoArroba() || 0;
        }
        msg += '📈 Arroba configurada: R$' + (precoArroba > 0 ? precoArroba.toFixed(2) : '— (não definida)') + '\n';
        msg += '📊 Ref. mercado fev/2026: R$340 (SP)\n\n';

        // Valor rebanho em pé
        if (window.contas && precoArroba > 0) {
            var rebanho = window.contas.calcValorRebanhoEmPe();
            if (rebanho) {
                msg += '🐄 Rebanho em pé: R$' + (rebanho.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '\n';
                msg += '   ' + (rebanho.totalCabecas || 0) + ' cabeças × ' + (rebanho.pesoMedio || 0).toFixed(0) + 'kg médio\n\n';
            }
        }

        // Custos por lote
        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            if (lotes.length > 0) {
                msg += '📋 CUSTOS POR LOTE:\n';
                lotes.forEach(function (lote) {
                    var custos = window.lotes.calcCustoTotalLote(lote);
                    var gmd = window.lotes.calcGMD(lote);
                    if (custos) {
                        msg += '\n• ' + lote.nome + ' (' + (lote.qtdAnimais || 0) + ' cab)\n';
                        msg += '  Custo total: R$' + custos.custoTotal.toFixed(2) + '\n';
                        msg += '  Custo/cab: R$' + custos.custoPorCab.toFixed(2) + '\n';
                        if (custos.custoPorArroba > 0) {
                            msg += '  Custo/@: R$' + custos.custoPorArroba.toFixed(2);
                            if (precoArroba > 0) {
                                var margem = ((precoArroba - custos.custoPorArroba) / precoArroba * 100);
                                msg += ' → Margem: ' + margem.toFixed(1) + '%';
                                msg += margem > 15 ? ' ✅' : margem > 5 ? ' ⚠️' : ' 🔴';
                            }
                            msg += '\n';
                        }
                        if (gmd && gmd.gmd > 0) {
                            msg += '  GMD: ' + gmd.gmd.toFixed(3) + ' kg/dia\n';
                        }
                    }
                });
            } else {
                msg += '⚠️ Nenhum lote cadastrado ainda.';
            }
        }

        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 3: ANÁLISE GENÉTICA
    // ════════════════════════════════════════
    analisarGenetica: function () {
        var msg = '🧬 CATÁLOGO GENÉTICO\n\n';

        if (!window.catalogoTouros || window.catalogoTouros.length === 0) {
            return msg + '⚠️ Catálogo de touros não carregado.';
        }

        // Contar por raça
        var racas = {};
        window.catalogoTouros.forEach(function (t) {
            racas[t.raca] = (racas[t.raca] || 0) + 1;
        });

        msg += '📚 ' + window.catalogoTouros.length + ' touros disponíveis:\n';
        Object.keys(racas).forEach(function (r) {
            msg += '  • ' + r + ': ' + racas[r] + ' touro(s)\n';
        });

        // Top 3 por iABCZ/MGTe
        msg += '\n🏆 TOP 3 POR ÍNDICE:\n';
        var sorted = window.catalogoTouros.slice().sort(function (a, b) {
            var ia = a.depsReais ? (a.depsReais.iABCZ || a.depsReais.MGTe || 0) : 0;
            var ib = b.depsReais ? (b.depsReais.iABCZ || b.depsReais.MGTe || 0) : 0;
            return ib - ia;
        });

        sorted.slice(0, 3).forEach(function (t, i) {
            var idx = t.depsReais ? (t.depsReais.iABCZ || t.depsReais.MGTe || '—') : '—';
            msg += (i + 1) + '. ' + t.nome + ' (' + t.raca + ') — Índice: ' + idx + '\n';
        });

        msg += '\n💡 Me diz o nome da raça pra filtrar, ou "acasalamento" pra ir pra tela de acasalamento.';
        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 4: ANÁLISE DE ESTOQUE
    // ════════════════════════════════════════
    analisarEstoque: function () {
        var msg = '📦 SITUAÇÃO DO ESTOQUE\n\n';

        if (!window.estoque) {
            return msg + '⚠️ Módulo de estoque não disponível.';
        }

        var items = window.estoque.getStockItems();
        if (items.length === 0) {
            return msg + '📭 Estoque vazio. Nenhum insumo registrado.\n\n💡 Vá em Estoque → clique + pra cadastrar.';
        }

        var categorias = { racao_sal: [], remedios: [], obras: [], outros: [] };
        items.forEach(function (item) {
            var cat = item.category || 'outros';
            if (!categorias[cat]) categorias[cat] = [];
            categorias[cat].push(item);
        });

        var nomes = { racao_sal: '🌾 Ração e Sal', remedios: '💊 Remédios', obras: '🔧 Materiais', outros: '📦 Outros' };

        Object.keys(categorias).forEach(function (cat) {
            var lista = categorias[cat];
            if (lista.length === 0) return;
            msg += nomes[cat] + ':\n';
            lista.forEach(function (item) {
                var status = item.qty <= 0 ? '🔴' : item.qty <= 10 ? '🟡' : '🟢';
                msg += '  ' + status + ' ' + item.name + ': ' + item.qty + ' ' + (item.unit || '') + '\n';
            });
            msg += '\n';
        });

        var zerados = items.filter(function (i) { return i.qty <= 0; });
        if (zerados.length > 0) {
            msg += '⚠️ ' + zerados.length + ' item(ns) ZERADO(S)! Reabastecer urgente.';
        } else {
            msg += '✅ Estoque em dia!';
        }

        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 5: ANÁLISE DE LOTES
    // ════════════════════════════════════════
    analisarLotes: function () {
        var msg = '🐄 ANÁLISE DOS LOTES\n\n';

        if (!window.lotes) return msg + '⚠️ Módulo de lotes não disponível.';

        var lotes = window.lotes.getLotes();
        if (lotes.length === 0) {
            return msg + '📭 Nenhum lote ativo.\n\n💡 Vá em Lotes → clique + pra criar.';
        }

        msg += '📊 ' + lotes.length + ' lote(s) ativo(s):\n\n';

        lotes.forEach(function (lote) {
            msg += '═══ ' + lote.nome + ' ═══\n';
            msg += '🐂 ' + (lote.qtdAnimais || 0) + ' cabeças | ' + (lote.raca || 'Misto') + '\n';
            msg += '🏕️ Pasto: ' + (lote.pasto || '—') + '\n';

            var gmd = window.lotes.calcGMD(lote);
            if (gmd && gmd.gmd > 0) {
                msg += '📈 GMD: ' + gmd.gmd.toFixed(3) + ' kg/dia';
                if (gmd.gmd >= 0.8) msg += ' ✅ Excelente!';
                else if (gmd.gmd >= 0.5) msg += ' 🟡 Bom';
                else msg += ' 🔴 Baixo! Revisar nutrição';
                msg += '\n';
                msg += '📏 Peso: ' + (gmd.pesoEntrada || 0).toFixed(0) + 'kg → ' + (gmd.pesoAtual || 0).toFixed(0) + 'kg';
                msg += ' (+' + (gmd.ganhoTotal || 0).toFixed(1) + 'kg em ' + (gmd.dias || 0) + ' dias)\n';
            }

            var nut = window.lotes.calcDuracaoNutricao(lote);
            if (nut && nut.diasPrevistos !== undefined) {
                msg += '🌾 Nutrição: ' + nut.diasPrevistos + ' dias restantes';
                msg += nut.diasPrevistos <= 7 ? ' 🔴 URGENTE!' : nut.diasPrevistos <= 15 ? ' 🟡' : ' 🟢';
                msg += '\n';
            }

            msg += '\n';
        });

        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 6: GLOSSÁRIO AGRO
    // ════════════════════════════════════════
    glossario: {
        'arroba': '📏 ARROBA (@): Unidade de peso do gado. 1@ = 15 kg de peso vivo. É assim que se negocia boi no Brasil. Pra calcular quantas arrobas tem: peso vivo ÷ 30.',
        'gmd': '📈 GMD (Ganho Médio Diário): Quanto o boi ganha de peso por dia, em kg. Referência: pasto = 0.4-0.8 kg/dia. Confinamento = 1.2+ kg/dia. É o principal indicador de desempenho produtivo.',
        'dep': '🧬 DEP (Diferença Esperada na Progênie): Estimativa do valor genético de um animal em relação à média da raça. Ex: DEP P210 = +12 kg significa que os filhos dele vão pesar 12 kg a mais na desmama.',
        'desmama': '🍼 DESMAMA: Separar o bezerro da vaca com 7-8 meses (~210 dias). Fase crítica que define o futuro do animal. P210 é a DEP de peso à desmama.',
        'sobreano': '📅 SOBREANO: Animal entre desmama e 18 meses. É a fase de recria, quando o bezerro vira garrote. P450 é a DEP dessa fase.',
        'f1': '🔬 F1: Primeira geração de cruzamento entre duas raças (ex: Nelore × Angus). Tem 50% de cada raça e a máxima HETEROSE (vigor híbrido). F2 = filho de F1 × F1.',
        'heterose': '💪 HETEROSE (Vigor Híbrido): O mestiço é melhor que a média dos pais puros. Nelore × Angus F1 = +15% crescimento, +25 kg aos 365 dias, melhor carcaça.',
        'acabamento': '🥩 ACABAMENTO: Camada de gordura na carcaça. O ideal é 3-6mm. Pouca gordura = carne escurece rápido. Muita = frigorífico desconta.',
        'marmoreio': '✨ MARMOREIO: Gordura DENTRO do músculo (intramuscular). Faz a carne macia, suculenta e saborosa. Angus tem naturalmente mais que Nelore.',
        'aol': '💪 AOL (Área de Olho de Lombo): Medida do tamanho do "bife" no lombo, em cm². Quanto maior, mais carne. Medido entre a 12ª e 13ª costela.',
        'egs': '📏 EGS (Espessura de Gordura Subcutânea): Gordura sob a pele, em mm. Protege a carcaça no resfriamento. Ideal: 3-6mm.',
        'mocho': '🦌 MOCHO: Animal que nasce sem chifre naturalmente. Vantagem: menos acidente no curral, menos estresse, melhor manejo.',
        'sisbov': '📋 SISBOV: Sistema Brasileiro de Identificação e Certificação de Bovinos. Obrigatório pra vender gado pro mercado externo (UE, China).',
        'gta': '🚚 GTA (Guia de Trânsito Animal): Documento obrigatório pra transportar gado de uma propriedade a outra. Emitido pela defesa agropecuária.',
        'iatf': '💉 IATF (Inseminação Artificial em Tempo Fixo): Técnica que sincroniza o cio das vacas com hormônios, permitindo inseminar todas no mesmo dia.',
        'repasse': '🐂 REPASSE: Touro que cobre naturalmente as vacas que não emprenaram na inseminação artificial. "Limpa" o que a IA não pegou.',
        'ciclo completo': '🔄 CICLO COMPLETO: Fazenda que faz TUDO — cria (nasce o bezerro), recria (cresce) e engorda (engorda pro abate). Produz da vaca ao boi gordo.',
        'conversao alimentar': '📊 CONVERSÃO ALIMENTAR: Quantos kg de ração o boi come pra ganhar 1 kg de peso. Referência: 6-8 kg ração/kg ganho (zebu), 5-7 (cruzado).',
        'precocidade': '⚡ PRECOCIDADE: Animal que atinge peso de abate e maturidade sexual mais cedo. F1 Angus×Nelore abate 4 meses antes do Nelore puro.',
        'rendimento carcaca': '🥩 RENDIMENTO DE CARCAÇA: Peso da carcaça ÷ peso vivo × 100. Nelore: 50-55%. F1 Angus×Nelore: 53-58%. Angus puro: 58-62%.',
        'consanguinidade': '⚠️ CONSANGUINIDADE: Acasalar parentes próximos. Causa depressão endogâmica: menos fertilidade, mais doenças, bezerros fracos. Coeficiente F > 6.25% = NÃO ACASALAR.',
        'deca': '🏅 DECA: Classificação da ABCZ de 1 a 10. DECA 1 = top 10% da raça (elite). DECA 5 = média. DECA 10 = inferior.',
        'pmgz': '📊 PMGZ: Programa de Melhoramento Genético de Zebuínos da ABCZ. Avalia DEPs de Nelore, Guzerá, Tabapuã, Brahman e Sindi.',
        'snp': '🔬 SNP (Single Nucleotide Polymorphism): Variação em UMA letra do DNA. O chip bovino analisa 50.000 SNPs pra prever genética do animal sem esperar os filhos nascerem.',
        'gebv': '🧪 GEBV: Valor genético estimado pela genômica. Mais preciso que a DEP tradicional. Permite selecionar reprodutor ao nascer.',
        'confinamento': '🏗️ CONFINAMENTO: Sistema intensivo onde o gado fica no cocho. GPD de 1.2-1.6 kg/dia. Custo@prod (fev/2026): R$236-269.',
        'suplementacao': '🥣 SUPLEMENTAÇÃO: Dar complemento nutricional no pasto (proteinado, energético). Melhora GPD de 0.4 pra 0.6-0.8 kg/dia.'
    },

    explicarTermo: function (texto) {
        // Extrair o termo após "o que é", "explica", etc
        var match = texto.match(/(?:o que e |explica |significa |defin\w* )(.+)/);
        var termo = match ? match[1].trim() : texto.replace(/o que e|explica|significa|defin\w*/g, '').trim();

        // Buscar no glossário
        var self = this;
        var melhor = null;
        var melhorScore = 0;
        Object.keys(this.glossario).forEach(function (key) {
            var keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (termo.indexOf(keyNorm) !== -1 || keyNorm.indexOf(termo) !== -1) {
                var score = keyNorm === termo ? 100 : keyNorm.indexOf(termo) !== -1 ? 50 : 30;
                if (score > melhorScore) {
                    melhorScore = score;
                    melhor = key;
                }
            }
        });

        if (melhor) {
            return '📖 ' + this.glossario[melhor] + '\n\n💡 Quer saber mais algum termo? Digita "o que é [termo]".';
        }

        // Lista todos os termos disponíveis
        var termos = Object.keys(this.glossario).join(', ');
        return '🤔 Não encontrei "' + termo + '" no glossário.\n\nTermos disponíveis:\n' + termos + '\n\n💡 Digita "o que é [termo]" pra eu explicar.';
    },

    // ════════════════════════════════════════
    // MÓDULO 7: GUIA DO APP
    // ════════════════════════════════════════
    guias: {
        'lote': '🐄 COMO CADASTRAR UM LOTE:\n\n1. Toque em "Lotes" no menu\n2. Clique no botão + (Novo Lote)\n3. Preencha:\n   • Nome do lote (ex: "Engorda 1")\n   • Quantidade de animais\n   • Raça\n   • Pasto onde vai ficar\n   • Sal mineral e ração (opcional)\n   • Consumo/dia em kg\n4. Toque em "Salvar"\n\n💡 Depois de criar, você pode pesar, trocar de pasto e abastecer o cocho!',
        'pesagem': '⚖️ COMO REGISTRAR PESAGEM:\n\n1. Vá em "Lotes"\n2. No card do lote, toque em "Manejar"\n3. Selecione "Pesagem"\n4. Informe o peso médio do lote\n\nOu use o módulo "Balança Inteligente":\n1. Toque no menu "Balança"\n2. Adicione peso por peso de cada animal\n3. O app calcula média e GMD automaticamente!',
        'compra': '🛒 COMO REGISTRAR COMPRA:\n\n1. Vá em "Financeiro"\n2. Toque na aba "Compras"\n3. Preencha:\n   • Fornecedor\n   • Quantidade de cabeças\n   • Valor total\n   • Vinculado ao lote\n4. Salvar\n\n💡 O custo da compra entra no cálculo de custo/@!',
        'venda': '💰 COMO REGISTRAR VENDA:\n\n1. Vá em "Financeiro"\n2. Toque na aba "Vendas"\n3. Preencha:\n   • Comprador/Frigorífico\n   • Quantidade de cabeças\n   • Peso total ou por @\n   • Valor\n4. Salvar\n\n💡 O app calcula automaticamente o resultado (lucro/prejuízo)!',
        'estoque': '📦 COMO CADASTRAR ESTOQUE:\n\n1. Vá em "Estoque"\n2. Toque no botão + (Nova Entrada)\n3. Escolha a categoria: Ração/Sal, Remédios ou Obras\n4. Selecione o produto (tem sugestões!)\n5. Informe: quantidade, unidade, valor pago\n6. Salvar\n\n💡 O estoque desconta automaticamente quando você usa no lote!',
        'manejo': '💉 COMO REGISTRAR MANEJO:\n\n1. Vá em "Manejo"\n2. Toque em "+ Novo Manejo"\n3. Selecione o lote\n4. Tipo: Vacina, Vermífugo, Pesagem, etc\n5. Produto usado (puxa do estoque)\n6. Salvar\n\n💡 O calendário sanitário ajuda a lembrar as datas!',
        'acasalamento': '🧬 COMO FAZER ACASALAMENTO DIRIGIDO:\n\n1. Vá em "Genética" no menu\n2. Na aba "Acasalamento Dirigido"\n3. Selecione a vaca (dropdown)\n4. Filtre touros por raça\n5. Clique "Analisar" num touro\n6. O sistema cruza DEPs e sugere a melhor combinação\n\n💡 Ou clique "🤖 Sugerir Touros" pra sugestão automática!',
        'funcionario': '👷 COMO CADASTRAR FUNCIONÁRIO:\n\n1. Vá em "Funcionários"\n2. Toque em + (Novo)\n3. Preencha: Nome, Função, Telefone, Diária\n4. Salvar\n\n💡 Os funcionários aparecem automaticamente no módulo Obras!',
        'obra': '🏗️ COMO REGISTRAR OBRA:\n\n1. Vá em "Obras"\n2. Toque em + (Nova Obra)\n3. Nome da obra, data início/fim\n4. Selecione funcionários e dias trabalhados\n5. Selecione materiais do estoque\n6. Salvar\n\n💡 O custo da obra entra no DRE!',
        'pasto': '🌿 COMO CADASTRAR PASTO:\n\n1. Vá em "Pastos"\n2. Toque em + (Novo Pasto)\n3. Informe: Nome, área em hectares, tipo de capim\n4. Salvar\n\n💡 O sistema calcula taxa de lotação e recuperação!',
        'arroba': '💲 COMO DEFINIR PREÇO DA ARROBA:\n\n1. Vá em "Financeiro"\n2. Role até "Cotação & Rebanho"\n3. Informe o preço atual da @\n4. O app calcula o valor do rebanho em pé automaticamente!'
    },

    guiarUso: function (texto) {
        var self = this;
        var melhor = null;
        var melhorScore = 0;

        Object.keys(this.guias).forEach(function (key) {
            if (texto.indexOf(key) !== -1) {
                var score = key.length;
                if (score > melhorScore) {
                    melhorScore = score;
                    melhor = key;
                }
            }
        });

        if (melhor) {
            return this.guias[melhor];
        }

        // Lista geral
        var msg = '🗺️ GUIA DO APP — Telas disponíveis:\n\n';
        msg += '• "como cadastrar lote" — Criar lotes\n';
        msg += '• "como registrar pesagem" — Pesar gado\n';
        msg += '• "como registrar compra" — Comprar gado\n';
        msg += '• "como registrar venda" — Vender gado\n';
        msg += '• "como cadastrar estoque" — Insumos\n';
        msg += '• "como registrar manejo" — Vacinas etc\n';
        msg += '• "como fazer acasalamento" — Genética\n';
        msg += '• "como cadastrar funcionário" — Equipe\n';
        msg += '• "como registrar obra" — Construções\n';
        msg += '• "como cadastrar pasto" — Pastagens\n';
        msg += '• "como definir arroba" — Preço @\n';
        msg += '\n💡 Me diz qual tela quer saber!';
        return msg;
    },

    // ════════════════════════════════════════
    // MÓDULO 8: RESUMO GERAL
    // ════════════════════════════════════════
    resumoGeral: function () {
        var msg = '📊 RESUMO GERAL — AgroMacro\n';
        msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        // Rebanho
        var totalCab = 0;
        if (window.lotes) {
            var lotes = window.lotes.getLotes();
            lotes.forEach(function (l) { totalCab += (l.qtdAnimais || 0); });
            msg += '🐄 Rebanho: ' + totalCab + ' cabeças em ' + lotes.length + ' lote(s)\n';
        }

        // Funcionários
        if (window.funcionarios) {
            var funcs = window.funcionarios.getAtivos();
            msg += '👷 Equipe: ' + funcs.length + ' funcionário(s) ativo(s)\n';
        }

        // Estoque
        if (window.estoque) {
            var items = window.estoque.getStockItems();
            var zerados = items.filter(function (i) { return i.qty <= 0; });
            msg += '📦 Estoque: ' + items.length + ' itens';
            if (zerados.length > 0) msg += ' (' + zerados.length + ' zerado!)';
            msg += '\n';
        }

        // Pastos
        if (window.data) {
            var pastos = window.data.events.filter(function (ev) { return ev.type === 'PASTO'; });
            msg += '🌿 Pastos: ' + pastos.length + ' cadastrado(s)\n';
        }

        // Catálogo
        if (window.catalogoTouros) {
            msg += '🧬 Touros: ' + window.catalogoTouros.length + ' no catálogo\n';
        }

        // Valor rebanho
        if (window.contas) {
            var preco = window.contas.getPrecoArroba();
            if (preco > 0) {
                var val = window.contas.calcValorRebanhoEmPe();
                if (val && val.valorTotal > 0) {
                    msg += '\n💰 Valor rebanho em pé: R$' + val.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                    msg += '\n📈 Arroba: R$' + preco.toFixed(2);
                }
            }
        }

        // Alertas
        msg += '\n\n📢 Alertas: ' + this.alertasAtivos.length;
        if (this.alertasAtivos.length > 0) {
            msg += ' — Digite "alertas" pra ver';
        } else {
            msg += ' — Tudo tranquilo! ✅';
        }

        return msg;
    }
};
