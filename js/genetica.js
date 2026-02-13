// ====== MÓDULO: AVALIAÇÃO GENÉTICA — Consultor de Melhoramento ======
// Analisa DEPs de PMGZ, ANCP e Embrapa Geneplus
// Traduz siglas técnicas em "Notas de Aptidão" em linguagem simples
window.genetica = {

    init: function () {
        console.log('Genética Module Ready');
    },

    // ════════════════════════════════════════════════════════
    // REFERÊNCIAS DE DEPs (valores medianos para Nelore)
    // Usados como base para calcular percentil
    // ════════════════════════════════════════════════════════
    REFS: {
        PN: { media: 0.5, desvio: 1.2, melhor: 'baixo', unidade: 'kg', nome: 'Peso ao Nascer' },
        P210: { media: 8.0, desvio: 5.0, melhor: 'alto', unidade: 'kg', nome: 'Peso Desmama (210d)' },
        P365: { media: 10.0, desvio: 7.0, melhor: 'alto', unidade: 'kg', nome: 'Peso ao Ano (365d)' },
        P450: { media: 12.0, desvio: 8.0, melhor: 'alto', unidade: 'kg', nome: 'Peso Sobreano (450d)' },
        GPD: { media: 30.0, desvio: 20.0, melhor: 'alto', unidade: 'g/dia', nome: 'Ganho Peso Diário' },
        MP210: { media: 3.0, desvio: 3.0, melhor: 'alto', unidade: 'kg', nome: 'Habilidade Materna' },
        PE: { media: 1.5, desvio: 2.0, melhor: 'alto', unidade: 'cm', nome: 'Perímetro Escrotal' },
        IPP: { media: -2.0, desvio: 5.0, melhor: 'baixo', unidade: 'dias', nome: 'Idade 1º Parto' },
        P3P: { media: 5.0, desvio: 8.0, melhor: 'alto', unidade: '%', nome: 'Parto Precoce (3P)' },
        PAC: { media: 3.0, desvio: 4.0, melhor: 'alto', unidade: 'kg', nome: 'Produtividade Acumulada' },
        AOL: { media: 2.0, desvio: 3.0, melhor: 'alto', unidade: 'cm²', nome: 'Área Olho de Lombo' },
        EGS: { media: 0.3, desvio: 0.5, melhor: 'alto', unidade: 'mm', nome: 'Acabamento (Gordura)' },
        MD: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Musculatura Desmame' },
        MS: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Musculatura Sobreano' },
        PS: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Precocidade' }
    },

    // ════════════════════════════════════════════════════════
    // PESOS POR APTIDÃO — quanto cada DEP influencia em cada nota
    // ════════════════════════════════════════════════════════
    PESOS: {
        cria: {
            PN: 20, MP210: 25, IPP: 15, P3P: 15, PAC: 15, PE: 10
        },
        engorda: {
            GPD: 20, P450: 20, AOL: 20, EGS: 15, MS: 15, PS: 10
        },
        reposicao: {
            PE: 15, IPP: 15, MD: 15, MP210: 20, P3P: 15, P210: 10, PAC: 10
        }
    },

    // ════════════════════════════════════════════════════════
    // FRASES DE RESULTADO — sem siglas, linguagem do pecuarista
    // ════════════════════════════════════════════════════════
    FRASES: {
        cria: {
            excelente: '🌟 Excelente pra Cria! Vai te dar bezerrada pesada e vacas com muito leite. Os partos vão ser tranquilos e as crias vão crescer rápido no pé da mãe.',
            otimo: '👍 Ótimo pra Cria! Bezerros vão nascer com bom peso sem dar trabalho no parto. As filhas dele vão ser boas de leite.',
            bom: '✅ Bom pra Cria. Adequado pra produzir matrizes e bezerros saudáveis. Pode melhorar a parte de leite materno.',
            regular: '⚠️ Regular pra Cria. Os bezerros vão nascer bem, mas as filhas podem não ser as melhores mães. Considere cruzar com fêmeas fortes em maternidade.',
            fraco: '❌ Fraco pra Cria. Não é um touro indicado pra esse objetivo. Melhor usar ele pra engorda.'
        },
        engorda: {
            excelente: '🌟 Excelente pra Engorda! Vai fechar a carcaça rápido, com carne de qualidade e bom acabamento de gordura. Frigorífico vai pagar prêmio!',
            otimo: '👍 Ótimo pra Engorda! Bom ganho de peso e musculatura. Vai dar boi gordo em menos tempo no cocho.',
            bom: '✅ Bom pra Engorda. Vai produzir animais precoces com carcaça aceitável. Rendimento de carcaça no padrão.',
            regular: '⚠️ Regular pra Engorda. Vai engordar, mas vai demorar mais no pasto ou no cocho. Custo de produção pode ser maior.',
            fraco: '❌ Fraco pra Engorda. Esse touro é melhor usado pra cria ou reposição, não pra terminação.'
        },
        reposicao: {
            excelente: '🌟 Ideal pra Reposição! As filhas vão emprenhar cedo, ser precoces e ter excelente estrutura. Segura todas no plantel!',
            otimo: '👍 Ótimo pra Reposição! Vai produzir novilhas com boa fertilidade e boa estrutura. Raça forte no rebanho.',
            bom: '✅ Bom pra Reposição. Fêmeas com estrutura adequada e fertilidade razoável. Bom custo-benefício.',
            regular: '⚠️ Regular pra Reposição. As filhas podem demorar pra emprenhar. Melhor usar pra produzir boi gordo.',
            fraco: '❌ Fraco pra Reposição. Não indicado pra segurar fêmeas. Foque em engorda com esse genético.'
        }
    },

    // ════════════════════════════════════════════════════════
    // FUNÇÕES CORE
    // ════════════════════════════════════════════════════════

    // Normaliza DEP para score 0-100 com base na referência
    _normalizar: function (sigla, valor) {
        var ref = this.REFS[sigla];
        if (!ref) return 50;

        var desvios = (valor - ref.media) / ref.desvio;

        // Para PN e IPP, menor é melhor (invertemos)
        if (ref.melhor === 'baixo') desvios = -desvios;

        // Converter desvios para 0-100 (sigmoid-like)
        var score = 50 + (desvios * 20);
        return Math.max(0, Math.min(100, Math.round(score)));
    },

    // Calcula nota de aptidão (0-100) com base nos pesos
    _calcularNota: function (deps, aptidao) {
        var pesos = this.PESOS[aptidao];
        if (!pesos) return 0;

        var somaNotas = 0;
        var somaPesos = 0;
        var self = this;

        for (var sigla in pesos) {
            if (deps[sigla] !== undefined && deps[sigla] !== '' && deps[sigla] !== null) {
                var score = self._normalizar(sigla, parseFloat(deps[sigla]));
                somaNotas += score * pesos[sigla];
                somaPesos += pesos[sigla];
            }
        }

        if (somaPesos === 0) return -1; // sem dados suficientes
        return Math.round(somaNotas / somaPesos);
    },

    // Traduz nota em nível
    _nivel: function (nota) {
        if (nota >= 80) return 'excelente';
        if (nota >= 65) return 'otimo';
        if (nota >= 50) return 'bom';
        if (nota >= 35) return 'regular';
        return 'fraco';
    },

    // Cor por nível
    _cor: function (nivel) {
        var cores = {
            excelente: '#22C55E',
            otimo: '#3B82F6',
            bom: '#F59E0B',
            regular: '#F97316',
            fraco: '#EF4444'
        };
        return cores[nivel] || '#6B7280';
    },

    // Rótulo por nível
    _rotulo: function (nivel) {
        var rotulos = {
            excelente: 'EXCELENTE',
            otimo: 'ÓTIMO',
            bom: 'BOM',
            regular: 'REGULAR',
            fraco: 'FRACO'
        };
        return rotulos[nivel] || 'SEM DADOS';
    },

    // ════════════════════════════════════════════════════════
    // PARECER COMPLETO — Texto detalhado como um consultor
    // ════════════════════════════════════════════════════════
    _gerarParecer: function (res) {
        var deps = res.deps;
        var notas = res.notas;
        var self = this;
        var sexoLabel = res.sexo === 'macho' ? 'touro' : 'matriz';
        var sexoArtigo = res.sexo === 'macho' ? 'Este' : 'Esta';
        var sexoPronome = res.sexo === 'macho' ? 'ele' : 'ela';
        var filhosLabel = res.sexo === 'macho' ? 'seus filhos' : 'suas crias';
        var paragrafos = [];

        // ── 1. INTRODUÇÃO ──
        var melhorApt = 'cria';
        var melhorNota = notas.cria || 0;
        if ((notas.engorda || 0) > melhorNota) { melhorApt = 'engorda'; melhorNota = notas.engorda; }
        if ((notas.reposicao || 0) > melhorNota) { melhorApt = 'reposicao'; melhorNota = notas.reposicao; }
        var melhorTexto = { cria: 'produção de bezerros e matrizes', engorda: 'terminação e abate', reposicao: 'reposição de fêmeas no plantel' };

        paragrafos.push('📝 <strong>PARECER TÉCNICO — ' + res.nome + '</strong><br>'
            + sexoArtigo + ' ' + sexoLabel + ' da raça <strong>' + res.raca + '</strong> foi avaliado com base nos dados genéticos informados. '
            + 'De forma geral, ' + sexoPronome + ' se destaca mais para <strong>' + melhorTexto[melhorApt] + '</strong>, '
            + 'com nota ' + melhorNota + ' de 100 nessa aptidão.');

        // ── 2. CRESCIMENTO ──
        var temCrescimento = deps.PN !== undefined || deps.P210 !== undefined || deps.P365 !== undefined || deps.P450 !== undefined || deps.GPD !== undefined;
        if (temCrescimento) {
            var textoCrescimento = '📏 <strong>Sobre o Crescimento:</strong> ';

            if (deps.PN !== undefined) {
                var pnScore = self._normalizar('PN', deps.PN);
                if (pnScore >= 65) {
                    textoCrescimento += 'O peso ao nascer é favorável — os bezerros vão nascer com tamanho adequado, sem risco de parto difícil. Isso é ótimo pra quem usa ' + sexoPronome + ' em novilhas de primeira cria. ';
                } else if (pnScore >= 40) {
                    textoCrescimento += 'O peso ao nascer é mediano. Os bezerros devem nascer num tamanho razoável, mas convém ficar de olho nas novilhas mais jovens. ';
                } else {
                    textoCrescimento += '⚠️ Atenção: o peso ao nascer é elevado. Pode dar problema de parto em novilhas. Recomendado usar apenas em vacas já paridas. ';
                }
            }

            if (deps.P210 !== undefined) {
                var p210Score = self._normalizar('P210', deps.P210);
                if (p210Score >= 65) {
                    textoCrescimento += 'Na desmama, ' + filhosLabel + ' vão se destacar — bezerros mais pesados que a média, o que significa mais arrobas na hora de vender a desmama. ';
                } else if (p210Score >= 40) {
                    textoCrescimento += 'O peso à desmama é razoável, dentro da média da raça. ';
                } else {
                    textoCrescimento += 'O peso à desmama pode ficar abaixo da média, então ' + filhosLabel + ' vão precisar de boa nutrição pra compensar. ';
                }
            }

            if (deps.P450 !== undefined || deps.P365 !== undefined) {
                var pesoSobre = deps.P450 !== undefined ? deps.P450 : deps.P365;
                var siglaUsada = deps.P450 !== undefined ? 'P450' : 'P365';
                var pesoScore = self._normalizar(siglaUsada, pesoSobre);
                if (pesoScore >= 65) {
                    textoCrescimento += 'No sobreano, os animais vão ser pesados — ' + sexoPronome + ' transmite genética forte pra ganho de peso pós-desmama. Vai ter boi grande no pasto. ';
                } else if (pesoScore < 40) {
                    textoCrescimento += 'O peso no sobreano fica um pouco atrás da média. Pode precisar de mais tempo no pasto pra atingir peso de abate. ';
                }
            }

            if (deps.GPD !== undefined) {
                var gpdScore = self._normalizar('GPD', deps.GPD);
                if (gpdScore >= 70) {
                    textoCrescimento += 'O ganho de peso diário é <strong>excelente</strong> — ' + filhosLabel + ' vão converter pasto e ração em carne de forma eficiente. Menos dias no cocho = menos custo. ';
                } else if (gpdScore >= 50) {
                    textoCrescimento += 'O ganho de peso diário é bom, dentro do esperado pra raça. ';
                } else {
                    textoCrescimento += 'O ganho de peso pode ser mais lento que o ideal, o que aumenta o custo de produção na engorda. ';
                }
            }

            paragrafos.push(textoCrescimento);
        }

        // ── 3. MATERNIDADE E REPRODUÇÃO ──
        var temReprod = deps.MP210 !== undefined || deps.PE !== undefined || deps.IPP !== undefined || deps.P3P !== undefined || deps.PAC !== undefined;
        if (temReprod) {
            var textoReprod = '🐄 <strong>Sobre Maternidade e Reprodução:</strong> ';

            if (deps.MP210 !== undefined) {
                var mpScore = self._normalizar('MP210', deps.MP210);
                if (mpScore >= 70) {
                    textoReprod += 'A habilidade materna é um ponto forte — as filhas desse ' + sexoLabel + ' vão ser <strong>excelentes mães</strong>, com bastante leite pra criar bezerros pesados. Isso impacta direto no peso da desmama do rebanho. ';
                } else if (mpScore >= 45) {
                    textoReprod += 'A habilidade materna é adequada. As filhas vão dar leite suficiente pra criar bezerros no padrão. ';
                } else {
                    textoReprod += 'A habilidade materna é um ponto fraco. Se o objetivo é produzir matrizes, considere cruzar com fêmeas que tenham forte herança leiteira. ';
                }
            }

            if (deps.PE !== undefined) {
                var peScore = self._normalizar('PE', deps.PE);
                if (peScore >= 65) {
                    textoReprod += 'O perímetro escrotal é acima da média, o que indica boa fertilidade e precocidade sexual. As filhas tendem a emprenhar mais cedo. ';
                } else if (peScore < 40) {
                    textoReprod += 'O perímetro escrotal está abaixo do ideal, o que pode indicar menor fertilidade. Vale avaliar junto com exame andrológico. ';
                }
            }

            if (deps.IPP !== undefined) {
                var ippScore = self._normalizar('IPP', deps.IPP);
                if (ippScore >= 65) {
                    textoReprod += 'As filhas vão ter tendência a emprenhar cedo — <strong>precocidade sexual acima da média</strong>. Isso significa novilhas entrando na reprodução mais jovens, gerando receita antes. ';
                } else if (ippScore < 40) {
                    textoReprod += 'A precocidade sexual das filhas pode ser um pouco tardia. Novilhas podem demorar mais pra pegar cria. ';
                }
            }

            if (deps.P3P !== undefined) {
                var p3pScore = self._normalizar('P3P', deps.P3P);
                if (p3pScore >= 65) {
                    textoReprod += 'A probabilidade de parto precoce é alta — ótimo indicador de que as fêmeas vão ser produtivas desde jovens. ';
                }
            }

            if (deps.PAC !== undefined) {
                var pacScore = self._normalizar('PAC', deps.PAC);
                if (pacScore >= 65) {
                    textoReprod += 'A produtividade acumulada é excelente — as filhas vão se manter produtivas por muitos anos, desmamando bezerros pesados safra após safra. <strong>Genética de vaca que paga a conta.</strong> ';
                } else if (pacScore < 40) {
                    textoReprod += 'A produtividade acumulada está abaixo da média. As fêmeas podem ter intervalos entre partos mais longos. ';
                }
            }

            paragrafos.push(textoReprod);
        }

        // ── 4. CARCAÇA E QUALIDADE DA CARNE ──
        var temCarcaca = deps.AOL !== undefined || deps.EGS !== undefined || deps.MD !== undefined || deps.MS !== undefined || deps.PS !== undefined;
        if (temCarcaca) {
            var textoCarcaca = '🥩 <strong>Sobre a Carcaça e Qualidade da Carne:</strong> ';

            if (deps.AOL !== undefined) {
                var aolScore = self._normalizar('AOL', deps.AOL);
                if (aolScore >= 65) {
                    textoCarcaca += 'A área de olho de lombo é <strong>acima da média</strong> — os filhos vão ter boa musculatura na carcaça. Isso significa mais carne aproveitável e melhor rendimento no frigorífico. Os açougues e frigoríficos pagam mais por esse tipo de carcaça. ';
                } else if (aolScore >= 40) {
                    textoCarcaca += 'A musculatura da carcaça está dentro do padrão. Rendimento de carcaça aceitável. ';
                } else {
                    textoCarcaca += 'A musculatura da carcaça pode ficar abaixo do ideal. Os animais podem precisar de mais tempo pra desenvolver carne. ';
                }
            }

            if (deps.EGS !== undefined) {
                var egsScore = self._normalizar('EGS', deps.EGS);
                if (egsScore >= 65) {
                    textoCarcaca += 'O acabamento de gordura é bom — os animais vão ter capa de gordura adequada na hora do abate. Isso é fundamental pra <strong>evitar desconto no frigorífico</strong> e garantir carne macia e suculenta. A gordura protege a carcaça na câmara fria. ';
                } else if (egsScore >= 40) {
                    textoCarcaca += 'O acabamento de gordura é mediano. Pode precisar de uns dias a mais no pasto pra cobrir bem a carcaça. ';
                } else {
                    textoCarcaca += '⚠️ O acabamento de gordura é baixo. Os animais podem ir pro abate sem gordura suficiente, o que gera desconto no preço. Considere cruzar com fêmeas de boa deposição de gordura. ';
                }
            }

            if (deps.MD !== undefined || deps.MS !== undefined) {
                var muscScore = deps.MS !== undefined ? self._normalizar('MS', deps.MS) : self._normalizar('MD', deps.MD);
                if (muscScore >= 65) {
                    textoCarcaca += 'A musculatura visual é forte — animais com volume muscular acima da média, boa conformação e boa distribuição de carne nos quartos traseiros. ';
                } else if (muscScore < 40) {
                    textoCarcaca += 'A musculatura visual fica um pouco abaixo. Os animais podem ter conformação mais estreita. ';
                }
            }

            if (deps.PS !== undefined) {
                var psScore = self._normalizar('PS', deps.PS);
                if (psScore >= 65) {
                    textoCarcaca += 'A precocidade de terminação é boa — os animais vão estar prontos pro abate mais cedo, com menos dias no pasto ou no cocho. Isso reduz custo de produção e acelera o giro do capital. ';
                } else if (psScore < 40) {
                    textoCarcaca += 'A precocidade de terminação pode ser mais lenta. Os animais podem precisar de mais tempo pra atingir ponto de abate. ';
                }
            }

            paragrafos.push(textoCarcaca);
        }

        // ── 5. RECOMENDAÇÃO FINAL ──
        var textoFinal = '🎯 <strong>Recomendação Final:</strong> ';

        if (melhorNota >= 80) {
            textoFinal += sexoArtigo + ' é um <strong>animal excepcional</strong>. ';
        } else if (melhorNota >= 65) {
            textoFinal += sexoArtigo + ' é um <strong>bom animal</strong> com genética acima da média. ';
        } else if (melhorNota >= 50) {
            textoFinal += sexoArtigo + ' tem genética dentro da média da raça. ';
        } else {
            textoFinal += sexoArtigo + ' tem genética abaixo da média em alguns pontos importantes. ';
        }

        // Recomendação de uso
        if (melhorApt === 'cria') {
            textoFinal += 'O melhor uso é como <strong>reprodutor de cria</strong> — cobrir matrizes pra produzir bezerros de qualidade e fêmeas de reposição. ';
            if (notas.engorda >= 60) textoFinal += 'Também serve bem pra engorda, já que os filhos vão ter boa capacidade de crescimento. ';
        } else if (melhorApt === 'engorda') {
            textoFinal += 'O melhor uso é na <strong>produção de boi gordo</strong> — os filhos vão terminar rápido e dar boa carcaça no frigorífico. ';
            if (notas.cria >= 60) textoFinal += 'As filhas também servem pra reposição, pois têm boa estrutura maternal. ';
        } else {
            textoFinal += 'O melhor uso é na <strong>produção de fêmeas de reposição</strong> — vai dar novilhas precoces, férteis e com boa estrutura pro plantel. ';
        }

        // Dica de acasalamento
        var pontosFracos = [];
        if (notas.cria < 50) pontosFracos.push('maternidade');
        if (notas.engorda < 50) pontosFracos.push('terminação');
        if (notas.reposicao < 50) pontosFracos.push('fertilidade');

        if (pontosFracos.length > 0) {
            textoFinal += '<br><br>💡 <strong>Dica de acasalamento:</strong> Pra compensar os pontos mais fracos (' + pontosFracos.join(', ') + '), cruze com fêmeas que se destaquem nessas áreas. A complementaridade genética é a chave pra produzir bezerros equilibrados.';
        } else {
            textoFinal += '<br><br>💡 <strong>Dica:</strong> Animal equilibrado em todas as aptidões. Pode ser usado em qualquer categoria de fêmea com bons resultados.';
        }

        paragrafos.push(textoFinal);

        return paragrafos;
    },

    // ════════════════════════════════════════════════════════
    // ANÁLISE PRINCIPAL
    // ════════════════════════════════════════════════════════
    analisar: function () {
        var deps = {};
        var siglas = Object.keys(this.REFS);
        var temDados = false;

        // Ler valores do formulário
        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el && el.value !== '') {
                deps[siglas[i]] = parseFloat(el.value);
                temDados = true;
            }
        }

        if (!temDados) {
            if (window.app) window.app.showToast('Preencha pelo menos 3 DEPs para analisar', 'warning');
            return;
        }

        // Nome do animal
        var nomeEl = document.getElementById('gen-nome');
        var nomeAnimal = nomeEl ? nomeEl.value.trim() || 'Sem nome' : 'Sem nome';

        // Raça
        var racaEl = document.getElementById('gen-raca');
        var raca = racaEl ? racaEl.value || 'Nelore' : 'Nelore';

        // Sexo
        var sexoEl = document.getElementById('gen-sexo');
        var sexo = sexoEl ? sexoEl.value || 'macho' : 'macho';

        // Calcular as 3 notas
        var notaCria = this._calcularNota(deps, 'cria');
        var notaEngorda = this._calcularNota(deps, 'engorda');
        var notaReposicao = this._calcularNota(deps, 'reposicao');

        var resultado = {
            nome: nomeAnimal,
            raca: raca,
            sexo: sexo,
            deps: deps,
            notas: {
                cria: notaCria,
                engorda: notaEngorda,
                reposicao: notaReposicao
            },
            timestamp: new Date().toISOString()
        };

        // Renderizar resultado
        this._renderResultado(resultado);

        // Salvar no histórico
        this._salvar(resultado);

        // Toast
        if (window.app) window.app.showToast('✅ Análise genética concluída!', 'success');
    },

    // ════════════════════════════════════════════════════════
    // RENDERIZAR RESULTADO
    // ════════════════════════════════════════════════════════
    _renderResultado: function (res) {
        var container = document.getElementById('gen-resultado');
        if (!container) return;

        var self = this;
        var aptidoes = [
            { key: 'cria', emoji: '🐮', titulo: 'Aptidão para Cria' },
            { key: 'engorda', emoji: '🥩', titulo: 'Aptidão para Engorda' },
            { key: 'reposicao', emoji: '🐄', titulo: 'Aptidão para Reposição' }
        ];

        // Melhor aptidão
        var melhorApt = 'cria';
        var melhorNota = res.notas.cria;
        if (res.notas.engorda > melhorNota) { melhorApt = 'engorda'; melhorNota = res.notas.engorda; }
        if (res.notas.reposicao > melhorNota) { melhorApt = 'reposicao'; melhorNota = res.notas.reposicao; }

        var melhorLabel = { cria: 'CRIA', engorda: 'ENGORDA', reposicao: 'REPOSIÇÃO' };

        var html = '<div style="text-align:center;margin-bottom:16px;">'
            + '<div style="font-size:22px;font-weight:800;">🧬 ' + res.nome + '</div>'
            + '<div style="color:#9CA3AF;margin-top:4px;">' + res.raca + ' • ' + (res.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea') + '</div>'
            + '<div style="margin-top:8px;display:inline-block;padding:4px 16px;border-radius:20px;background:' + self._cor(self._nivel(melhorNota)) + '20;color:' + self._cor(self._nivel(melhorNota)) + ';font-weight:700;font-size:13px;">🏆 MELHOR PARA: ' + melhorLabel[melhorApt] + '</div>'
            + '</div>';

        // Cards de aptidão
        aptidoes.forEach(function (apt) {
            var nota = res.notas[apt.key];
            if (nota < 0) {
                html += '<div class="card" style="padding:16px;margin-bottom:12px;opacity:0.5;">'
                    + '<div style="font-weight:700;">' + apt.emoji + ' ' + apt.titulo + '</div>'
                    + '<div style="color:#9CA3AF;font-size:13px;margin-top:4px;">Dados insuficientes — preencha mais DEPs</div>'
                    + '</div>';
                return;
            }

            var nivel = self._nivel(nota);
            var cor = self._cor(nivel);
            var frase = self.FRASES[apt.key][nivel];

            html += '<div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid ' + cor + ';">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
                + '<div style="font-weight:700;font-size:15px;">' + apt.emoji + ' ' + apt.titulo + '</div>'
                + '<div style="font-weight:800;font-size:18px;color:' + cor + ';">' + nota + '<span style="font-size:12px;font-weight:400;">/100</span></div>'
                + '</div>'
                // Barra de progresso
                + '<div style="background:rgba(255,255,255,0.1);border-radius:10px;height:10px;overflow:hidden;margin-bottom:10px;">'
                + '<div style="width:' + nota + '%;height:100%;background:' + cor + ';border-radius:10px;transition:width 1s ease;"></div>'
                + '</div>'
                // Badge de nível
                + '<div style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:' + cor + '20;color:' + cor + ';margin-bottom:8px;">' + self._rotulo(nivel) + '</div>'
                // Frase amigável
                + '<div style="font-size:14px;line-height:1.5;color:#E5E7EB;">' + frase + '</div>'
                + '</div>';
        });

        // ── PARECER COMPLETO (Texto Detalhado) ──
        var parecer = self._gerarParecer(res);
        if (parecer.length > 0) {
            html += '<div class="card" style="padding:18px;margin-top:12px;border-left:4px solid #7C3AED;">'
                + '<div style="font-weight:800;font-size:16px;margin-bottom:12px;color:#A78BFA;">📝 Parecer do Consultor</div>';
            parecer.forEach(function (p) {
                html += '<div style="font-size:14px;line-height:1.7;color:#E5E7EB;margin-bottom:14px;">' + p + '</div>';
            });
            html += '</div>';
        }

        // Detalhes dos DEPs informados
        var depsInfo = Object.keys(res.deps);
        if (depsInfo.length > 0) {
            html += '<div class="card" style="padding:16px;margin-top:8px;">'
                + '<div style="font-weight:700;margin-bottom:10px;">📊 DEPs Informados</div>';

            depsInfo.forEach(function (sigla) {
                var ref = self.REFS[sigla];
                var valor = res.deps[sigla];
                var score = self._normalizar(sigla, valor);
                var cor = self._cor(self._nivel(score));

                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
                    + '<div style="font-size:13px;">' + (ref ? ref.nome : sigla) + '</div>'
                    + '<div style="display:flex;align-items:center;gap:8px;">'
                    + '<span style="font-weight:700;color:' + cor + ';">' + valor + (ref ? ' ' + ref.unidade : '') + '</span>'
                    + '<span style="font-size:11px;padding:1px 6px;border-radius:8px;background:' + cor + '20;color:' + cor + ';">' + score + '</span>'
                    + '</div></div>';
            });

            html += '</div>';
        }

        container.innerHTML = html;
        container.style.display = 'block';

        // Scroll to result
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ════════════════════════════════════════════════════════
    // SALVAR ANÁLISE
    // ════════════════════════════════════════════════════════
    _salvar: function (resultado) {
        window.data.saveEvent({
            type: 'ANALISE_GENETICA',
            nome: resultado.nome,
            raca: resultado.raca,
            sexo: resultado.sexo,
            deps: resultado.deps,
            notas: resultado.notas,
            date: new Date().toISOString().split('T')[0]
        });
    },

    // ════════════════════════════════════════════════════════
    // RENDER — Chamado pelo app.navigate
    // ════════════════════════════════════════════════════════
    render: function () {
        this._renderHistorico();
    },

    // ════════════════════════════════════════════════════════
    // HISTÓRICO DE ANÁLISES
    // ════════════════════════════════════════════════════════
    _renderHistorico: function () {
        var container = document.getElementById('gen-historico');
        if (!container) return;

        var analises = window.data.events.filter(function (ev) {
            return ev.type === 'ANALISE_GENETICA';
        }).reverse();

        if (analises.length === 0) {
            container.innerHTML = '<div class="empty-state">🧬 Nenhuma análise realizada ainda. Preencha os DEPs acima e clique em "Analisar Touro".</div>';
            return;
        }

        var self = this;
        var html = '<div style="font-weight:700;font-size:16px;margin-bottom:10px;">📋 Histórico de Análises</div>';

        analises.forEach(function (an) {
            var melhorApt = 'cria';
            var melhorNota = an.notas.cria || 0;
            if ((an.notas.engorda || 0) > melhorNota) { melhorApt = 'engorda'; melhorNota = an.notas.engorda; }
            if ((an.notas.reposicao || 0) > melhorNota) { melhorApt = 'reposicao'; melhorNota = an.notas.reposicao; }

            var melhorLabel = { cria: '🐮 Cria', engorda: '🥩 Engorda', reposicao: '🐄 Reposição' };
            var cor = self._cor(self._nivel(melhorNota));
            var emoji = an.sexo === 'macho' ? '♂' : '♀';

            html += '<div class="card" style="padding:14px;margin-bottom:8px;cursor:pointer;" onclick="window.genetica._reexibir(\'' + an.timestamp + '\')">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<div>'
                + '<div style="font-weight:700;">' + emoji + ' ' + an.nome + '</div>'
                + '<div style="font-size:12px;color:#9CA3AF;">' + an.raca + ' • ' + (an.date || '').substring(0, 10) + '</div>'
                + '</div>'
                + '<div style="text-align:right;">'
                + '<div style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + cor + '20;color:' + cor + ';font-weight:700;">' + melhorLabel[melhorApt] + '</div>'
                + '<div style="font-size:18px;font-weight:800;color:' + cor + ';margin-top:2px;">' + melhorNota + '</div>'
                + '</div></div></div>';
        });

        container.innerHTML = html;
    },

    // Re-exibir análise anterior
    _reexibir: function (timestamp) {
        var analise = window.data.events.find(function (ev) {
            return ev.type === 'ANALISE_GENETICA' && ev.timestamp === timestamp;
        });

        if (analise) {
            this._renderResultado({
                nome: analise.nome,
                raca: analise.raca,
                sexo: analise.sexo,
                deps: analise.deps,
                notas: analise.notas
            });
        }
    },

    // ════════════════════════════════════════════════════════
    // LIMPAR FORMULÁRIO
    // ════════════════════════════════════════════════════════
    limpar: function () {
        var siglas = Object.keys(this.REFS);
        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el) el.value = '';
        }
        var nomeEl = document.getElementById('gen-nome');
        if (nomeEl) nomeEl.value = '';

        var resultadoEl = document.getElementById('gen-resultado');
        if (resultadoEl) { resultadoEl.innerHTML = ''; resultadoEl.style.display = 'none'; }
    },

    // ════════════════════════════════════════════════════════
    // EXEMPLO — Preencher DEPs de um touro top
    // ════════════════════════════════════════════════════════
    preencherExemplo: function () {
        var exemplo = {
            nome: 'TOURO DEMONSTRAÇÃO CFM',
            raca: 'Nelore',
            sexo: 'macho',
            deps: {
                PN: -0.5, P210: 14.2, P365: 18.5, P450: 22.8,
                GPD: 55, MP210: 6.8, PE: 3.2, IPP: -8.5,
                P3P: 12.5, PAC: 8.2, AOL: 4.5, EGS: 0.8,
                MD: 0.5, MS: 0.6, PS: 0.4
            }
        };

        var nomeEl = document.getElementById('gen-nome');
        if (nomeEl) nomeEl.value = exemplo.nome;

        var racaEl = document.getElementById('gen-raca');
        if (racaEl) racaEl.value = exemplo.raca;

        var sexoEl = document.getElementById('gen-sexo');
        if (sexoEl) sexoEl.value = exemplo.sexo;

        var siglas = Object.keys(exemplo.deps);
        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el) el.value = exemplo.deps[siglas[i]];
        }

        if (window.app) window.app.showToast('📋 Dados do touro exemplo preenchidos!', 'info');
    }
};
