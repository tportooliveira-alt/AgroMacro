// ====== MÓDULO: CONSULTOR DE MELHORAMENTO GENÉTICO — Ciclo Completo ======
// "Zootecnista Sênior com 30 anos de experiência"
// Analisa DEPs de PMGZ, ANCP e Embrapa Geneplus
// Tom: capataz experiente falando com o patrão
window.genetica = {

    init: function () {
        console.log('🧬 Consultor Genético — Ciclo Completo — Ready');
    },

    // ════════════════════════════════════════════════════════
    // REFERÊNCIAS DE DEPs (valores medianos para Nelore de referência)
    // ════════════════════════════════════════════════════════
    REFS: {
        PN: { media: 0.5, desvio: 1.2, melhor: 'baixo', unidade: 'kg', nome: 'Peso ao Nascer', grupo: 'parto' },
        P120: { media: 5.0, desvio: 3.5, melhor: 'alto', unidade: 'kg', nome: 'Peso Direto Desmama (120d)', grupo: 'crescimento' },
        P210: { media: 8.0, desvio: 5.0, melhor: 'alto', unidade: 'kg', nome: 'Peso Desmama (210d)', grupo: 'crescimento' },
        P365: { media: 10.0, desvio: 7.0, melhor: 'alto', unidade: 'kg', nome: 'Peso ao Ano (365d)', grupo: 'crescimento' },
        P450: { media: 12.0, desvio: 8.0, melhor: 'alto', unidade: 'kg', nome: 'Peso Sobreano (450d)', grupo: 'crescimento' },
        GPD: { media: 30.0, desvio: 20.0, melhor: 'alto', unidade: 'g/dia', nome: 'Ganho Peso Diário', grupo: 'crescimento' },
        MP210: { media: 3.0, desvio: 3.0, melhor: 'alto', unidade: 'kg', nome: 'Habilidade Materna (Leite)', grupo: 'maternidade' },
        PE: { media: 1.5, desvio: 2.0, melhor: 'alto', unidade: 'cm', nome: 'Perímetro Escrotal', grupo: 'reproducao' },
        IPP: { media: -2.0, desvio: 5.0, melhor: 'baixo', unidade: 'dias', nome: 'Idade 1º Parto', grupo: 'reproducao' },
        P3P: { media: 5.0, desvio: 8.0, melhor: 'alto', unidade: '%', nome: 'Parto Precoce (3P)', grupo: 'reproducao' },
        PAC: { media: 3.0, desvio: 4.0, melhor: 'alto', unidade: 'kg', nome: 'Produtividade Acumulada', grupo: 'maternidade' },
        AOL: { media: 2.0, desvio: 3.0, melhor: 'alto', unidade: 'cm²', nome: 'Área Olho de Lombo', grupo: 'carcaca' },
        EGS: { media: 0.3, desvio: 0.5, melhor: 'alto', unidade: 'mm', nome: 'Acabamento (Gordura)', grupo: 'carcaca' },
        MD: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Musculatura Desmame', grupo: 'carcaca' },
        MS: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Musculatura Sobreano', grupo: 'carcaca' },
        PS: { media: 0.2, desvio: 0.3, melhor: 'alto', unidade: 'score', nome: 'Precocidade de Acabamento', grupo: 'carcaca' }
    },

    // ════════════════════════════════════════════════════════
    // PESOS POR APTIDÃO — Ciclo Completo
    // ════════════════════════════════════════════════════════
    PESOS: {
        cria: {
            PN: 20, MP210: 25, IPP: 15, P3P: 15, PAC: 15, PE: 10
        },
        engorda: {
            GPD: 20, P450: 15, P365: 5, AOL: 20, EGS: 15, MS: 15, PS: 10
        },
        reposicao: {
            PE: 15, IPP: 15, MD: 15, MP210: 20, P3P: 15, P210: 10, PAC: 10
        }
    },

    // ════════════════════════════════════════════════════════
    // NORMALIZAÇÃO: DEP → Score 0-100
    // ════════════════════════════════════════════════════════
    _normalizar: function (sigla, valor) {
        var ref = this.REFS[sigla];
        if (!ref) return 50;
        var desvios = (valor - ref.media) / ref.desvio;
        if (ref.melhor === 'baixo') desvios = -desvios;
        var score = 50 + (desvios * 20);
        return Math.max(0, Math.min(100, Math.round(score)));
    },

    // ════════════════════════════════════════════════════════
    // CÁLCULO DE NOTA POR APTIDÃO (0-100)
    // ════════════════════════════════════════════════════════
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
        if (somaPesos === 0) return -1;
        return Math.round(somaNotas / somaPesos);
    },

    _nivel: function (nota) {
        if (nota >= 80) return 'excelente';
        if (nota >= 65) return 'otimo';
        if (nota >= 50) return 'bom';
        if (nota >= 35) return 'regular';
        return 'fraco';
    },

    _cor: function (nivel) {
        var cores = { excelente: '#22C55E', otimo: '#3B82F6', bom: '#F59E0B', regular: '#F97316', fraco: '#EF4444' };
        return cores[nivel] || '#6B7280';
    },

    _rotulo: function (nivel) {
        var rotulos = { excelente: 'EXCELENTE', otimo: 'ÓTIMO', bom: 'BOM', regular: 'REGULAR', fraco: 'FRACO' };
        return rotulos[nivel] || 'SEM DADOS';
    },

    // ════════════════════════════════════════════════════════
    // PARECER DO CAPATAZ — Linguagem direta pra quem entende de gado
    // "Zootecnista com 30 anos de campo"
    // ════════════════════════════════════════════════════════
    _gerarParecer: function (res) {
        var deps = res.deps;
        var notas = res.notas;
        var self = this;
        var isMacho = res.sexo === 'macho';
        var bicho = isMacho ? 'touro' : 'vaca';
        var Bicho = isMacho ? 'Touro' : 'Vaca';
        var ele = isMacho ? 'ele' : 'ela';
        var Ele = isMacho ? 'Ele' : 'Ela';
        var filhos = isMacho ? 'os filhos' : 'as crias';
        var Filhos = isMacho ? 'Os filhos' : 'As crias';
        var filhas = 'as filhas';
        var paragrafos = [];

        // ── Melhor aptidão ──
        var melhorApt = 'cria';
        var melhorNota = notas.cria || 0;
        if ((notas.engorda || 0) > melhorNota) { melhorApt = 'engorda'; melhorNota = notas.engorda; }
        if ((notas.reposicao || 0) > melhorNota) { melhorApt = 'reposicao'; melhorNota = notas.reposicao; }

        // ════════════════════════════════════
        // 1. DIAGNÓSTICO GERAL — "Resumo pro Patrão"
        // ════════════════════════════════════
        var intro = '🤠 <strong>DIAGNÓSTICO DO ' + Bicho.toUpperCase() + ' — ' + res.nome + '</strong><br>';
        intro += '<em>Raça: ' + res.raca + ' • ';
        if (res.iabcz) intro += 'iABCZ: ' + res.iabcz + ' • ';
        if (res.mgte) intro += 'MGTe: ' + res.mgte + ' • ';
        intro += '</em><br><br>';

        if (melhorNota >= 80) {
            intro += 'Patrão, esse ' + bicho + ' é <strong>de primeira linha</strong>. ';
            if (melhorApt === 'cria') intro += 'Pode botar nas vacas sem medo — vai te dar bezerrada pesada e vacas com muito leite. O rebanho agradece!';
            else if (melhorApt === 'engorda') intro += 'Nasceu pra fazer boi gordo. Vai fechar carcaça rápido, com bife largo e gordura no ponto. O frigorífico vai querer pagar prêmio!';
            else intro += 'Perfeito pra segurar fêmeas no plantel. Vai te dar novilhas que emprenham cedo e produzem por muitos anos.';
        } else if (melhorNota >= 65) {
            intro += 'Esse ' + bicho + ' é <strong>bom de serviço</strong>. Não é o top de leilão, mas dá conta do recado. ';
            if (melhorApt === 'cria') intro += 'Pra cria, vai entregar bezerros saudáveis e filhas com leite razoável.';
            else if (melhorApt === 'engorda') intro += 'Pra engorda, os filhos vão ganhar peso bem e dar carcaça decente no frigorífico.';
            else intro += 'Pra reposição, vai produzir novilhas com boa estrutura e fertilidade adequada.';
        } else if (melhorNota >= 50) {
            intro += 'Patrão, esse ' + bicho + ' é <strong>mediano</strong>. Serve pra manter rebanho comercial, mas não espere milagre. ';
            intro += 'Se o bolso apertar, pode usar. Mas se tiver opção melhor, eu iria no outro.';
        } else if (melhorNota >= 35) {
            intro += 'Ó, vou ser sincero: esse ' + bicho + ' <strong>vai te dar trabalho</strong>. ';
            intro += 'A genética não é ruim de tudo, mas tem pontos fracos que vão pesar no bolso. Pense duas vezes antes de investir.';
        } else {
            intro += '⚠️ Patrão, <strong>esse aqui é pra passar adiante</strong>. ';
            intro += 'Vai te dar trabalho no parto, bezerro leve e carcaça fraca no frigorífico. O prejuízo vem em 2-3 anos quando ' + filhos + ' forem pro gancho.';
        }

        paragrafos.push(intro);

        // ════════════════════════════════════
        // 2. FACILIDADE DE PARTO — PN
        // ════════════════════════════════════
        if (deps.PN !== undefined) {
            var pnScore = self._normalizar('PN', deps.PN);
            var textoParto = '🐣 <strong>Facilidade de Parto:</strong> ';

            if (pnScore >= 75) {
                textoParto += 'Nota dez! Peso ao nascer controlado (<strong>' + deps.PN + ' kg de DEP</strong>). O bezerro vai nascer sem dar trabalho pra vaca. ';
                textoParto += 'Pode usar ' + ele + ' tranquilo em novilha de primeira cria. Vai nascer ligeiro e já sai mamando.';
            } else if (pnScore >= 55) {
                textoParto += 'Peso ao nascer dentro do aceitável (' + deps.PN + ' kg). Vai ter parto normal na maioria das vacas. ';
                textoParto += 'Mas eu não usaria ' + ele + ' em novilha muito nova ou estreita — aí pede atenção.';
            } else if (pnScore >= 40) {
                textoParto += 'Atenção: o peso ao nascer tá <strong>medio pra alto</strong> (' + deps.PN + ' kg). ';
                textoParto += 'Use só em vacas adultas já paridas. Em novilha, vai dar problema — distócia, bezerro enganchado, pode perder a vaca.';
            } else {
                textoParto += '🚨 <strong>Cuidado!</strong> Peso ao nascer pesado demais (' + deps.PN + ' kg). ';
                textoParto += 'Esse ' + bicho + ' vai te dar bezerro gigante que entala no canal. Novilha nem pensar! ';
                textoParto += 'Se for usar, só em vaca multípara gorda e com bacia larga.';
            }

            paragrafos.push(textoParto);
        }

        // ════════════════════════════════════
        // 3. HABILIDADE MATERNA — Leite
        // ════════════════════════════════════
        if (deps.MP210 !== undefined || deps.PAC !== undefined) {
            var textoMaterno = '🍼 <strong>Habilidade Materna (Leite e Produtividade):</strong> ';

            if (deps.MP210 !== undefined) {
                var mpScore = self._normalizar('MP210', deps.MP210);
                if (mpScore >= 70) {
                    textoMaterno += 'Aqui é o ponto forte! As filhas desse ' + bicho + ' vão ser <strong>excelentes mães</strong> — muito leite pro bezerro mamar. ';
                    textoMaterno += 'Bezerro que mama bem desmama pesado, e bezerro pesado na desmama é o <strong>primeiro termômetro de lucro</strong> da fazenda. ';
                    textoMaterno += 'Se a vaca não tem leite, não adianta o touro ser bom de peso — a genética não vai se expressar no bezerro. ';
                    textoMaterno += 'Esse ' + bicho + ' resolve isso (<strong>' + deps.MP210 + ' kg de DEP materna</strong>).';
                } else if (mpScore >= 50) {
                    textoMaterno += 'Leite materno dentro da média (' + deps.MP210 + ' kg). ' + Filhos + ' vão desmamar com peso aceitável. ';
                    textoMaterno += 'Mas se você cruzar com vaca que já é fraca de leite, o bezerro pode desmamar leve.';
                } else {
                    textoMaterno += '<strong>Ponto fraco.</strong> O leite das filhas vai ser pouco (' + deps.MP210 + ' kg de DEP). ';
                    textoMaterno += 'Bezerro vai desmamar leve, e aí precisa gastar mais na recria pra compensar. ';
                    textoMaterno += 'Se o objetivo é melhorar maternidade do rebanho, <strong>esse não é o ' + bicho + ' certo</strong>.';
                }
            }

            if (deps.PAC !== undefined) {
                var pacScore = self._normalizar('PAC', deps.PAC);
                textoMaterno += '<br><br>';
                if (pacScore >= 65) {
                    textoMaterno += '📊 <strong>Produtividade Acumulada excelente</strong> (' + deps.PAC + ' kg). ' + Ele + ' produz vaca que desmama bezerro pesado safra após safra. ';
                    textoMaterno += 'É genética de <strong>vaca que paga a conta</strong> — aquela que não falta na estação e ainda produz bem por 10-12 estações.';
                } else if (pacScore < 40) {
                    textoMaterno += '⚠️ Produtividade acumulada baixa (' + deps.PAC + ' kg). As filhas podem dar intervalo entre partos maior. Vaca que pula estação é prejuízo.';
                }
            }

            paragrafos.push(textoMaterno);
        }

        // ════════════════════════════════════
        // 4. CRESCIMENTO — Desmama, Recria, GPD
        // ════════════════════════════════════
        var temCresc = deps.P120 !== undefined || deps.P210 !== undefined || deps.P365 !== undefined || deps.P450 !== undefined || deps.GPD !== undefined;
        if (temCresc) {
            var textoCresc = '📈 <strong>Eficiência no Crescimento (Recria e Engorda):</strong> ';

            if (deps.P120 !== undefined || deps.P210 !== undefined) {
                var pesoDesmama = deps.P120 !== undefined ? deps.P120 : deps.P210;
                var siglaDesmama = deps.P120 !== undefined ? 'P120' : 'P210';
                var desmamaScore = self._normalizar(siglaDesmama, pesoDesmama);

                if (desmamaScore >= 70) {
                    textoCresc += '<strong>Desmama pesada!</strong> (' + pesoDesmama + ' kg de DEP). Bezerro que desmama pesado economiza tempo de pasto na recria. ';
                    textoCresc += 'É dinheiro que entra mais cedo no bolso — vende desmama a R$ 12-15 por kg, cada kg a mais é lucro direto.';
                } else if (desmamaScore >= 45) {
                    textoCresc += 'Peso de desmama na média (' + pesoDesmama + ' kg). Não vai impressionar na balança, mas não prejudica.';
                } else {
                    textoCresc += 'Desmama leve (' + pesoDesmama + ' kg de DEP). ' + Filhos + ' vão precisar de mais tempo no pasto pra compensar. Custo sobe.';
                }
            }

            if (deps.GPD !== undefined) {
                var gpdScore = self._normalizar('GPD', deps.GPD);
                textoCresc += '<br><br>';
                if (gpdScore >= 70) {
                    textoCresc += '🚀 <strong>Ganho de peso sensacional</strong> (' + deps.GPD + ' g/dia de DEP). ' + Filhos + ' vão converter pasto e ração em carne que é uma beleza. ';
                    textoCresc += 'Menos dias no cocho = <strong>menos custo de diária = mais margem</strong>. É isso que separa o pecuarista que ganha dinheiro do que empata.';
                } else if (gpdScore >= 50) {
                    textoCresc += 'Ganho de peso bom (' + deps.GPD + ' g/dia). Dentro do esperado pra ra raça. Vai engordar no tempo normal.';
                } else {
                    textoCresc += '⚠️ Ganho de peso abaixo do ideal (' + deps.GPD + ' g/dia). Vai demorar pra terminar no pasto. ';
                    textoCresc += 'Se o plano é confinamento, o custo de diária vai comer a margem.';
                }
            }

            if (deps.P450 !== undefined || deps.P365 !== undefined) {
                var pesoSobre = deps.P450 !== undefined ? deps.P450 : deps.P365;
                var siglaS = deps.P450 !== undefined ? 'P450' : 'P365';
                var sobreScore = self._normalizar(siglaS, pesoSobre);
                textoCresc += '<br><br>';
                if (sobreScore >= 65) {
                    textoCresc += 'No sobreano, vai ter <strong>boi de boa ossatura e peso</strong> (' + pesoSobre + ' kg de DEP). O tipo de animal que chama atenção na mangueira.';
                } else if (sobreScore < 40) {
                    textoCresc += 'No sobreano, o peso fica devendo (' + pesoSobre + ' kg de DEP). Pode precisar de mais uns meses pra atingir peso de abate.';
                }
            }

            paragrafos.push(textoCresc);
        }

        // ════════════════════════════════════
        // 5. VISÃO DE ABATE — AOL, EGS, Musculatura, Precocidade
        // ════════════════════════════════════
        var temCarcaca = deps.AOL !== undefined || deps.EGS !== undefined || deps.MD !== undefined || deps.MS !== undefined || deps.PS !== undefined;
        if (temCarcaca) {
            var textoCarcaca = '🥩 <strong>Visão de Abate (o que o Frigorífico vai ver):</strong> ';

            if (deps.AOL !== undefined) {
                var aolScore = self._normalizar('AOL', deps.AOL);
                if (aolScore >= 70) {
                    textoCarcaca += '<strong>Bife largo!</strong> Área de Olho de Lombo acima da média (' + deps.AOL + ' cm² de DEP). ';
                    textoCarcaca += 'Isso é a DEP do açougue — mais carne na carcaça, melhor rendimento no gancho. ';
                    textoCarcaca += 'Frigorífico paga prêmio por esse tipo de animal. No ciclo completo, é aqui que o investimento genético vira dinheiro.';
                } else if (aolScore >= 45) {
                    textoCarcaca += 'Musculatura de carcaça dentro do padrão (' + deps.AOL + ' cm²). Rendimento aceitável no frigorífico.';
                } else {
                    textoCarcaca += '<strong>Carcaça fraca.</strong> Área de lombo abaixo da média (' + deps.AOL + ' cm²). ';
                    textoCarcaca += 'No gancho, vai dar menos carne aproveitável. O frigorífico não vai pagar bem. ';
                    textoCarcaca += 'Se o foco é terminação, <strong>esse ' + bicho + ' melhora o desmame mas estraga a carcaça.</strong>';
                }
            }

            if (deps.EGS !== undefined) {
                var egsScore = self._normalizar('EGS', deps.EGS);
                textoCarcaca += '<br><br>';
                if (egsScore >= 65) {
                    textoCarcaca += '✅ <strong>Acabamento de gordura no ponto</strong> (' + deps.EGS + ' mm de DEP). ';
                    textoCarcaca += 'Touros com DEP alta aqui geram animais que colocam gordura mais cedo — ideal pra novilhas precoces. ';
                    textoCarcaca += 'A gordura protege a carcaça na câmara fria, e carne sem gordura de cobertura <strong>leva desconto pesado</strong> no frigorífico. ';
                    textoCarcaca += 'Esse ' + bicho + ' resolve isso.';
                } else if (egsScore >= 40) {
                    textoCarcaca += 'Acabamento mediano (' + deps.EGS + ' mm). Vai precisar de uns dias a mais no pasto pra cobrir bem a carcaça antes do abate.';
                } else {
                    textoCarcaca += '🚨 <strong>Acabamento ruim</strong> (' + deps.EGS + ' mm de DEP). ';
                    textoCarcaca += 'Os animais vão pro abate "chupados" — sem gordura de cobertura, o frigorífico desconta R$ 3-5 por arroba. ';
                    textoCarcaca += 'Ao longo de 100 bois, isso são milhares de reais jogados fora. <strong>Cuidado sério.</strong>';
                }
            }

            if (deps.MS !== undefined || deps.MD !== undefined) {
                var muscDep = deps.MS !== undefined ? deps.MS : deps.MD;
                var muscSigla = deps.MS !== undefined ? 'MS' : 'MD';
                var muscScore = self._normalizar(muscSigla, muscDep);
                textoCarcaca += '<br><br>';
                if (muscScore >= 65) {
                    textoCarcaca += 'Musculatura visual forte (' + muscDep + ' de score). Animal com volume, quartos traseiros cheios, boa conformação. O tipo que enche os olhos na mangueira.';
                } else if (muscScore < 40) {
                    textoCarcaca += 'Musculatura fraca (' + muscDep + '). Animal vai ter conformação estreita, quartos traseiros vazios. Não é o perfil que o mercado valoriza.';
                }
            }

            if (deps.PS !== undefined) {
                var psScore = self._normalizar('PS', deps.PS);
                if (psScore >= 65) {
                    textoCarcaca += ' Boa precocidade de acabamento — vai estar pronto pro abate mais cedo, com menos dias no pasto. <strong>Giro rápido do capital.</strong>';
                } else if (psScore < 40) {
                    textoCarcaca += ' Precocidade baixa — vai demorar pra "fechar" a carcaça. Mais custo no pasto.';
                }
            }

            paragrafos.push(textoCarcaca);
        }

        // ════════════════════════════════════
        // 6. FERTILIDADE E PRECOCIDADE SEXUAL
        // ════════════════════════════════════
        var temFertilidade = deps.PE !== undefined || deps.IPP !== undefined || deps.P3P !== undefined;
        if (temFertilidade) {
            var textoFert = '🔄 <strong>Fertilidade e Precocidade Sexual:</strong> ';

            if (deps.PE !== undefined) {
                var peScore = self._normalizar('PE', deps.PE);
                if (peScore >= 65) {
                    textoFert += 'Perímetro escrotal acima da média (' + deps.PE + ' cm). Sinal de boa fertilidade e precocidade. ';
                    textoFert += 'As filhas vão emprenhar mais cedo — novilha que chega na estação com 14-15 meses e já pega cria. <strong>Isso é dinheiro!</strong>';
                } else if (peScore < 40) {
                    textoFert += '⚠️ Perímetro escrotal baixo (' + deps.PE + ' cm). Pode indicar fertilidade abaixo do ideal. ';
                    textoFert += 'Faz exame andrológico detalhado antes de comprar. As filhas podem demorar pra emprenhar.';
                }
            }

            if (deps.IPP !== undefined) {
                var ippScore = self._normalizar('IPP', deps.IPP);
                textoFert += '<br>';
                if (ippScore >= 65) {
                    textoFert += 'Filhas com tendência a emprenhar cedo (' + deps.IPP + ' dias de DEP) — <strong>precocidade sexual acima da média</strong>. ';
                    textoFert += 'Novilha que entra na reprodução mais jovem gera receita antes e tem mais estações produtivas na vida.';
                } else if (ippScore < 40) {
                    textoFert += 'As filhas podem demorar pra emprenhar (' + deps.IPP + ' dias de DEP). Novilha que atrasa é custo de manutenção sem retorno.';
                }
            }

            if (deps.P3P !== undefined) {
                var p3pScore = self._normalizar('P3P', deps.P3P);
                if (p3pScore >= 65) {
                    textoFert += ' Probabilidade de parto precoce alta (' + deps.P3P + '%) — as fêmeas vão ser produtivas desde jovens.';
                }
            }

            paragrafos.push(textoFert);
        }

        // ════════════════════════════════════
        // 7. ÍNDICES BIOECONÔMICOS — iABCZ / MGTe
        // ════════════════════════════════════
        if (res.iabcz || res.mgte) {
            var textoIndice = '📊 <strong>Índices Bioeconômicos (Filtro Rápido):</strong> ';

            if (res.iabcz) {
                var iabczVal = parseFloat(res.iabcz);
                if (iabczVal >= 10) {
                    textoIndice += 'iABCZ de <strong>' + res.iabcz + '</strong> — animal <strong>Top</strong>. Esse índice é o "filtro rápido" pra saber se o animal é equilibrado. ';
                    textoIndice += 'Um valor acima de 10 mostra que não é "fogo de palha" — a genética é consistente em todos os critérios.';
                } else if (iabczVal >= 5) {
                    textoIndice += 'iABCZ de ' + res.iabcz + ' — acima da média, animal com boa genética geral.';
                } else if (iabczVal >= 0) {
                    textoIndice += 'iABCZ de ' + res.iabcz + ' — mediano. Não é ruim, mas não se destaca. Avalie os pontos fortes individuais.';
                } else {
                    textoIndice += '⚠️ iABCZ de ' + res.iabcz + ' — abaixo da média. O índice mostra desequilíbrio genético. Cuidado.';
                }
            }

            if (res.mgte) {
                var mgteVal = parseFloat(res.mgte);
                textoIndice += '<br>';
                if (mgteVal >= 10) {
                    textoIndice += 'MGTe de <strong>' + res.mgte + '</strong> — mérito genético total excelente. Animal equilibrado e produtivo em todas as fases.';
                } else if (mgteVal >= 0) {
                    textoIndice += 'MGTe de ' + res.mgte + ' — adequado. Genética geral dentro da média.';
                } else {
                    textoIndice += 'MGTe de ' + res.mgte + ' — abaixo. Mérito genético total comprometido.';
                }
            }

            paragrafos.push(textoIndice);
        }

        // ════════════════════════════════════
        // 8. RECOMENDAÇÃO DE ACASALAMENTO DIRIGIDO
        // ════════════════════════════════════
        var textoAcasalamento = '🎯 <strong>Recomendação de Uso e Acasalamento:</strong><br>';

        // Pontos fortes e fracos
        var pontosFortes = [];
        var pontosFracos = [];

        // Checar cada grupo de DEPs
        var grupoScores = {};
        for (var sigla in deps) {
            if (self.REFS[sigla]) {
                var sc = self._normalizar(sigla, deps[sigla]);
                var grupo = self.REFS[sigla].grupo;
                if (!grupoScores[grupo]) grupoScores[grupo] = [];
                grupoScores[grupo].push({ sigla: sigla, score: sc, nome: self.REFS[sigla].nome });
            }
        }

        // Identificar DEPs individuais fortes e fracas
        for (var sig in deps) {
            if (self.REFS[sig]) {
                var score = self._normalizar(sig, deps[sig]);
                if (score >= 70) pontosFortes.push(self.REFS[sig].nome);
                else if (score <= 35) pontosFracos.push(self.REFS[sig].nome);
            }
        }

        if (pontosFortes.length > 0) {
            textoAcasalamento += '<br>✅ <strong>Pontos Fortes:</strong> ' + pontosFortes.join(', ') + '.';
        }
        if (pontosFracos.length > 0) {
            textoAcasalamento += '<br>❌ <strong>Pontos Fracos:</strong> ' + pontosFracos.join(', ') + '.';
        }

        // Recomendação de uso
        textoAcasalamento += '<br><br>';
        if (melhorApt === 'cria') {
            textoAcasalamento += '👉 <strong>Melhor uso: Reprodutor de Cria.</strong> Bote ' + ele + ' nas vacas pra produzir bezerros de qualidade e matrizes de reposição.';
        } else if (melhorApt === 'engorda') {
            textoAcasalamento += '👉 <strong>Melhor uso: Produção de Boi Gordo.</strong> ' + Filhos + ' vão terminar rápido e dar boa carcaça no frigorífico.';
        } else {
            textoAcasalamento += '👉 <strong>Melhor uso: Reposição de Fêmeas.</strong> Vai te dar novilhas precoces, férteis e produtivas por muitos anos.';
        }

        // Acasalamento compensatório
        if (pontosFracos.length > 0) {
            textoAcasalamento += '<br><br>💡 <strong>Acasalamento Dirigido (Compensação):</strong> ';
            textoAcasalamento += 'Pra tirar o melhor desse ' + bicho + ', cruze com fêmeas que sejam <strong>fortes exatamente onde ' + ele + ' é fraco</strong>. ';

            // Recomendações específicas por grupo fraco
            for (var sig2 in deps) {
                if (self.REFS[sig2]) {
                    var sc2 = self._normalizar(sig2, deps[sig2]);
                    if (sc2 <= 35) {
                        var nomeRef = self.REFS[sig2].nome;
                        textoAcasalamento += '<br>  • ' + nomeRef + ' está fraco → busque fêmeas que sejam <strong>Top 5% em ' + nomeRef + '</strong> pra compensar.';
                    }
                }
            }

            textoAcasalamento += '<br><br>A <strong>complementaridade genética</strong> é a chave pra produzir bezerros equilibrados. Nunca junte duas genéticas fracas no mesmo ponto.';
        } else {
            textoAcasalamento += '<br><br>💡 Animal equilibrado em todas as DEPs informadas. Pode ser usado em qualquer categoria de fêmea com bons resultados. Genética segura.';
        }

        paragrafos.push(textoAcasalamento);

        // ════════════════════════════════════
        // 9. VISÃO DE FUTURO — Conexão com o negócio
        // ════════════════════════════════════
        var textoFuturo = '📅 <strong>Visão de Negócio (2-3 Anos):</strong><br>';
        textoFuturo += 'O ' + bicho + ' que você compra hoje vai refletir no <strong>rendimento do gancho daqui a 2-3 anos</strong>. ';

        if (notas.engorda >= 65 && notas.cria >= 60) {
            textoFuturo += 'Esse ' + bicho + ' entrega nas duas pontas — bezerro pesado na desmama e boi gordo no frigorífico. ';
            textoFuturo += 'É o <strong>investimento que se paga duas vezes</strong>: na venda da desmama e na bonificação do abate.';
        } else if (notas.engorda >= 65) {
            textoFuturo += 'Foco na terminação — daqui a 2 anos, ' + filhos + ' vão dar boa carcaça. ';
            textoFuturo += 'Mas lembre: se as vacas não têm leite, o ganho genético pode não aparecer no bezerro.';
        } else if (notas.cria >= 65) {
            textoFuturo += 'O retorno vem na qualidade das matrizes — daqui a 3-4 anos, as filhas vão estar parindo e dando leite acima da média. ';
            textoFuturo += 'É investimento de longo prazo que constrói rebanho forte.';
        } else {
            textoFuturo += 'Com essa genética, o retorno vai ser modesto. Considere se o preço de compra justifica o resultado esperado.';
        }

        paragrafos.push(textoFuturo);

        return paragrafos;
    },

    // ════════════════════════════════════════════════════════
    // ANÁLISE PRINCIPAL
    // ════════════════════════════════════════════════════════
    analisar: function () {
        var deps = {};
        var siglas = Object.keys(this.REFS);
        var temDados = false;

        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el && el.value !== '') {
                deps[siglas[i]] = parseFloat(el.value);
                temDados = true;
            }
        }

        if (!temDados) {
            if (window.app) window.app.showToast('Preencha pelo menos 3 DEPs pra eu poder avaliar', 'warning');
            return;
        }

        var nomeEl = document.getElementById('gen-nome');
        var nomeAnimal = nomeEl ? nomeEl.value.trim() || 'Sem nome' : 'Sem nome';

        var racaEl = document.getElementById('gen-raca');
        var raca = racaEl ? racaEl.value || 'Nelore' : 'Nelore';

        var sexoEl = document.getElementById('gen-sexo');
        var sexo = sexoEl ? sexoEl.value || 'macho' : 'macho';

        // Índices bioeconômicos
        var iabczEl = document.getElementById('gen-iabcz');
        var iabcz = iabczEl ? iabczEl.value.trim() : '';

        var mgteEl = document.getElementById('gen-mgte');
        var mgte = mgteEl ? mgteEl.value.trim() : '';

        var notaCria = this._calcularNota(deps, 'cria');
        var notaEngorda = this._calcularNota(deps, 'engorda');
        var notaReposicao = this._calcularNota(deps, 'reposicao');

        var resultado = {
            nome: nomeAnimal,
            raca: raca,
            sexo: sexo,
            iabcz: iabcz,
            mgte: mgte,
            deps: deps,
            notas: {
                cria: notaCria,
                engorda: notaEngorda,
                reposicao: notaReposicao
            },
            timestamp: new Date().toISOString()
        };

        this._renderResultado(resultado);
        this._salvar(resultado);

        if (window.app) window.app.showToast('🤠 Análise completa! Leia o parecer do consultor.', 'success');
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

        // Frases curtas de destaque (tom de capataz)
        var frasesDestaque = {
            cria: {
                excelente: '🏆 Bezerrada pesada e vacas com muito leite! Esse é de primeira!',
                otimo: '👍 Bom pra cria — bezerro saudável e filha com leite.',
                bom: '✅ Serve pra cria. Não é mágico, mas dá conta.',
                regular: '⚠️ Pode dar cria, mas não espere bezerrada campeã.',
                fraco: '❌ Esse não é pra cria, patrão. Vai te dar trabalho.'
            },
            engorda: {
                excelente: '🏆 Ótimo pra confinamento! Vai fechar carcaça rápido com bife largo!',
                otimo: '👍 Bom de engorda — carne de qualidade no tempo certo.',
                bom: '✅ Engorda razoável. Vai pro gancho, mas sem prêmio.',
                regular: '⚠️ Vai engordar devagar. Custo sobe.',
                fraco: '❌ Não é pra engorda. Vai dar carcaça fraca no frigorífico.'
            },
            reposicao: {
                excelente: '🏆 Ideal pra segurar as fêmeas no plantel! Novilha precoce e fértil!',
                otimo: '👍 Boas fêmeas de reposição — vão emprenhar e produzir.',
                bom: '✅ Reposição aceitável. Novilhas com estrutura adequada.',
                regular: '⚠️ Cuidado, as filhas podem demorar pra emprenhar.',
                fraco: '❌ Não segure fêmeas desse. Foque en engorda.'
            }
        };

        var html = '<div style="text-align:center;margin-bottom:16px;">'
            + '<div style="font-size:22px;font-weight:800;">🧬 ' + res.nome + '</div>'
            + '<div style="color:#9CA3AF;margin-top:4px;">' + res.raca + ' • ' + (res.sexo === 'macho' ? '♂ Touro' : '♀ Matriz');
        if (res.iabcz) html += ' • iABCZ: ' + res.iabcz;
        if (res.mgte) html += ' • MGTe: ' + res.mgte;
        html += '</div>'
            + '<div style="margin-top:8px;display:inline-block;padding:4px 16px;border-radius:20px;background:' + self._cor(self._nivel(melhorNota)) + '20;color:' + self._cor(self._nivel(melhorNota)) + ';font-weight:700;font-size:13px;">🏆 MELHOR PARA: ' + melhorLabel[melhorApt] + '</div>'
            + '</div>';

        // Cards de aptidão (compactos)
        aptidoes.forEach(function (apt) {
            var nota = res.notas[apt.key];
            if (nota < 0) {
                html += '<div class="card" style="padding:14px;margin-bottom:8px;opacity:0.5;">'
                    + '<div style="font-weight:700;">' + apt.emoji + ' ' + apt.titulo + '</div>'
                    + '<div style="color:#9CA3AF;font-size:13px;margin-top:4px;">Dados insuficientes — preencha as DEPs dessa área</div>'
                    + '</div>';
                return;
            }

            var nivel = self._nivel(nota);
            var cor = self._cor(nivel);
            var frase = frasesDestaque[apt.key][nivel];

            html += '<div class="card" style="padding:14px;margin-bottom:8px;border-left:4px solid ' + cor + ';">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
                + '<div style="font-weight:700;font-size:15px;">' + apt.emoji + ' ' + apt.titulo + '</div>'
                + '<div style="font-weight:800;font-size:18px;color:' + cor + ';">' + nota + '<span style="font-size:12px;font-weight:400;">/100</span></div>'
                + '</div>'
                + '<div style="background:rgba(255,255,255,0.1);border-radius:10px;height:8px;overflow:hidden;margin-bottom:8px;">'
                + '<div style="width:' + nota + '%;height:100%;background:' + cor + ';border-radius:10px;transition:width 1s ease;"></div>'
                + '</div>'
                + '<div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:' + cor + '20;color:' + cor + ';margin-bottom:6px;">' + self._rotulo(nivel) + '</div>'
                + '<div style="font-size:13px;line-height:1.4;color:#D1D5DB;">' + frase + '</div>'
                + '</div>';
        });

        // ── PARECER COMPLETO DO CAPATAZ ──
        var parecer = self._gerarParecer(res);
        if (parecer.length > 0) {
            html += '<div class="card" style="padding:18px;margin-top:14px;border-left:4px solid #7C3AED;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(109,40,217,0.05));">'
                + '<div style="font-weight:800;font-size:17px;margin-bottom:14px;color:#A78BFA;">🤠 Parecer do Consultor</div>';
            parecer.forEach(function (p) {
                html += '<div style="font-size:14px;line-height:1.75;color:#E5E7EB;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(167,139,250,0.1);">' + p + '</div>';
            });
            html += '</div>';
        }

        // Tabela de DEPs informados
        var depsInfo = Object.keys(res.deps);
        if (depsInfo.length > 0) {
            html += '<div class="card" style="padding:16px;margin-top:10px;">'
                + '<div style="font-weight:700;margin-bottom:10px;">📊 DEPs Informados</div>';

            depsInfo.forEach(function (sigla) {
                var ref = self.REFS[sigla];
                var valor = res.deps[sigla];
                var score = self._normalizar(sigla, valor);
                var cor = self._cor(self._nivel(score));

                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
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
            iabcz: resultado.iabcz || '',
            mgte: resultado.mgte || '',
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
    // HISTÓRICO
    // ════════════════════════════════════════════════════════
    _renderHistorico: function () {
        var container = document.getElementById('gen-historico');
        if (!container) return;

        var analises = window.data.events.filter(function (ev) {
            return ev.type === 'ANALISE_GENETICA';
        }).reverse();

        if (analises.length === 0) {
            container.innerHTML = '<div class="empty-state">🤠 Nenhuma análise ainda, patrão. Preencha os dados do touro acima e clique em "Analisar".</div>';
            return;
        }

        var self = this;
        var html = '<div style="font-weight:700;font-size:16px;margin-bottom:10px;">📋 Análises Anteriores</div>';

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

    _reexibir: function (timestamp) {
        var analise = window.data.events.find(function (ev) {
            return ev.type === 'ANALISE_GENETICA' && ev.timestamp === timestamp;
        });

        if (analise) {
            this._renderResultado({
                nome: analise.nome,
                raca: analise.raca,
                sexo: analise.sexo,
                iabcz: analise.iabcz || '',
                mgte: analise.mgte || '',
                deps: analise.deps,
                notas: analise.notas
            });
        }
    },

    // ════════════════════════════════════════════════════════
    // LIMPAR
    // ════════════════════════════════════════════════════════
    limpar: function () {
        var siglas = Object.keys(this.REFS);
        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el) el.value = '';
        }
        ['gen-nome', 'gen-iabcz', 'gen-mgte'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });

        var resultadoEl = document.getElementById('gen-resultado');
        if (resultadoEl) { resultadoEl.innerHTML = ''; resultadoEl.style.display = 'none'; }
    },

    // ════════════════════════════════════════════════════════
    // EXEMPLO — Touro top de leilão
    // ════════════════════════════════════════════════════════
    preencherExemplo: function () {
        var exemplo = {
            nome: 'TOURO IMPERADOR FIV DA CFM',
            raca: 'Nelore',
            sexo: 'macho',
            iabcz: '12.5',
            mgte: '8.7',
            deps: {
                PN: -0.5, P120: 8.2, P210: 14.2, P365: 18.5, P450: 22.8,
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

        var iabczEl = document.getElementById('gen-iabcz');
        if (iabczEl) iabczEl.value = exemplo.iabcz;

        var mgteEl = document.getElementById('gen-mgte');
        if (mgteEl) mgteEl.value = exemplo.mgte;

        var siglas = Object.keys(exemplo.deps);
        for (var i = 0; i < siglas.length; i++) {
            var el = document.getElementById('gen-' + siglas[i].toLowerCase());
            if (el) el.value = exemplo.deps[siglas[i]];
        }

        if (window.app) window.app.showToast('📋 Dados do IMPERADOR FIV preenchidos!', 'info');
    },

    // ═══════════════════════════════════════════════════════════════
    // ACASALAMENTO DIRIGIDO — Análise de Compensação
    // ═══════════════════════════════════════════════════════════════

    /**
     * Analisa o cruzamento entre uma vaca e um touro.
     * Retorna parecer com compensações, alertas e projeção FrigoGest.
     */
    analisarAcasalamento: function (fichaVaca, fichaTouro) {
        var self = this;
        var parecer = [];

        // ── Verificação de consanguinidade ──
        var alerta_consanguinidade = false;
        if (fichaVaca.pai && fichaTouro.nome && fichaVaca.pai === fichaTouro.nome) {
            alerta_consanguinidade = true;
        }
        if (fichaVaca.linhagem && fichaTouro.linhagem) {
            var linVaca = fichaVaca.linhagem.toLowerCase().split(' x ');
            var linTouro = fichaTouro.linhagem.toLowerCase().split(' x ');
            for (var i = 0; i < linVaca.length; i++) {
                for (var j = 0; j < linTouro.length; j++) {
                    if (linVaca[i].trim() === linTouro[j].trim()) {
                        alerta_consanguinidade = true;
                    }
                }
            }
        }

        // ── Cabeçalho ──
        var header = '🧬 <strong>ACASALAMENTO DIRIGIDO</strong><br>';
        header += '🐄 Vaca: <strong>' + fichaVaca.nome + '</strong> (Brinco ' + fichaVaca.brinco + ')<br>';
        header += '🐂 Touro: <strong>' + (fichaTouro.nome || 'Catálogo') + '</strong>';
        if (fichaTouro.registro) header += ' (' + fichaTouro.registro + ')';
        header += '<br>';
        if (fichaTouro.centrais && fichaTouro.centrais.length > 0) {
            var c = fichaTouro.centrais[0];
            header += '📍 Disponível: <strong>' + c.nome + '</strong> — ' + c.cidade + ' — R$ ' + c.preco.toFixed(2) + '/dose';
        }
        parecer.push(header);

        // ── Alerta de consanguinidade ──
        if (alerta_consanguinidade) {
            parecer.push('🚨 <strong style="color:#EF4444;">ATENÇÃO — RISCO DE CONSANGUINIDADE!</strong><br>' +
                'Patrão, essas linhagens se cruzam. Filho de parente dá problema: ' +
                'bezerro fraco, fertilidade baixa, prejuízo certo. ' +
                '<strong>Recomendo trocar o touro.</strong>');
        }

        // ── Análise de compensação por DEP ──
        var compensacoes = [];
        var preocupacoes = [];
        var depsCruzadas = {};
        var depsVaca = fichaVaca.deps || {};
        var depsTouro = (fichaTouro.deps || fichaTouro.deps) || {};

        var siglas = ['PN', 'P210', 'MP210', 'PAC', 'AOL', 'EGS', 'GPD', 'P450', 'IPP', 'P3P', 'PE', 'MS', 'PS'];
        siglas.forEach(function (sigla) {
            if (self.REFS[sigla]) {
                var scoreVaca = depsVaca[sigla] !== undefined && depsVaca[sigla] !== null ? self._normalizar(sigla, depsVaca[sigla]) : null;
                var scoreTouro = depsTouro[sigla] !== undefined && depsTouro[sigla] !== null ? self._normalizar(sigla, depsTouro[sigla]) : null;

                if (scoreVaca !== null && scoreTouro !== null) {
                    var media = (scoreVaca + scoreTouro) / 2;
                    depsCruzadas[sigla] = { vaca: scoreVaca, touro: scoreTouro, media: media };

                    if (scoreVaca <= 35 && scoreTouro >= 65) {
                        compensacoes.push({
                            sigla: sigla,
                            nome: self.REFS[sigla].nome,
                            scoreVaca: scoreVaca,
                            scoreTouro: scoreTouro
                        });
                    } else if (scoreVaca <= 35 && scoreTouro <= 45) {
                        preocupacoes.push({
                            sigla: sigla,
                            nome: self.REFS[sigla].nome,
                            scoreVaca: scoreVaca,
                            scoreTouro: scoreTouro
                        });
                    }
                }
            }
        });

        // ── Compensações encontradas ──
        if (compensacoes.length > 0) {
            var txt = '✅ <strong>COMPENSAÇÕES POSITIVAS:</strong><br>';
            txt += 'Esse touro corrige os pontos fracos da vaca:<br>';
            compensacoes.forEach(function (comp) {
                txt += '• <strong>' + comp.nome + '</strong> — Vaca fraca (' + Math.round(comp.scoreVaca) + '/100) → Touro forte (' + Math.round(comp.scoreTouro) + '/100). ';
                if (comp.sigla === 'AOL') txt += 'Vai melhorar a carcaça dos filhos pro FrigoGest! 🥩';
                else if (comp.sigla === 'MP210') txt += 'Filhas vão ser vacas com leite de verdade! 🥛';
                else if (comp.sigla === 'EGS') txt += 'Acabamento melhor = abate mais cedo = giro rápido! 💰';
                txt += '<br>';
            });
            parecer.push(txt);
        }

        // ── Preocupações ──
        if (preocupacoes.length > 0) {
            var alertTxt = '⚠️ <strong style="color:#F59E0B;">ATENÇÃO — PONTO NÃO CORRIGIDO:</strong><br>';
            preocupacoes.forEach(function (preo) {
                alertTxt += '• <strong>' + preo.nome + '</strong> — Vaca fraca E touro também não ajuda (' + Math.round(preo.scoreTouro) + '/100). ';
                alertTxt += 'Filhos vão herdar essa deficiência.<br>';
            });
            alertTxt += 'Considere outro touro se essa característica for prioridade.';
            parecer.push(alertTxt);
        }

        // ── Projeção de Filhos ──
        var projecao = '📊 <strong>PROJEÇÃO DOS FILHOS:</strong><br>';
        var depsProjeto = {};
        for (var sig in depsCruzadas) {
            depsProjeto[sig] = depsCruzadas[sig].media;
        }

        // Aptidões projetadas
        var aptCria = depsProjeto.MP210 || 50;
        var aptEngorda = ((depsProjeto.AOL || 50) + (depsProjeto.GPD || 50) + (depsProjeto.EGS || 50)) / 3;
        var aptRepo = ((depsProjeto.IPP || 50) + (depsProjeto.P3P || 50) + (depsProjeto.MP210 || 50)) / 3;

        if (aptCria >= 65) projecao += '🐮 <strong>Cria:</strong> Bezerrada boa — filhas vão dar leite e desmamar pesado.<br>';
        else if (aptCria >= 50) projecao += '🐮 <strong>Cria:</strong> Razoável — não vai ser referência, mas serve.<br>';
        else projecao += '🐮 <strong>Cria:</strong> Fraco — filhas vão secar cedo. Bezerro desmama leve.<br>';

        if (aptEngorda >= 65) projecao += '🥩 <strong>Engorda (FrigoGest):</strong> Boi vai fechar carcaça rápido com bife largo. Premium no gancho!<br>';
        else if (aptEngorda >= 50) projecao += '🥩 <strong>Engorda (FrigoGest):</strong> Mediano — vai vender, mas sem prêmio especial.<br>';
        else projecao += '🥩 <strong>Engorda (FrigoGest):</strong> Fraco — carcaça magra, risco de desconto no frigorifico.<br>';

        if (aptRepo >= 65) projecao += '🔄 <strong>Reposição:</strong> Fêmeas excelentes pra segurar no plantel.';
        else if (aptRepo >= 50) projecao += '🔄 <strong>Reposição:</strong> Pode segurar algumas, não todas.';
        else projecao += '🔄 <strong>Reposição:</strong> Melhor vender as fêmeas. Não serve pra reposição.';

        parecer.push(projecao);

        // ── Visão de Negócio FrigoGest ──
        var visao = '💰 <strong>VISÃO DE NEGÓCIO (2-3 anos):</strong><br>';
        var aolMedia = depsCruzadas.AOL ? depsCruzadas.AOL.media : 50;
        var egsMedia = depsCruzadas.EGS ? depsCruzadas.EGS.media : 50;
        var p450Media = depsCruzadas.P450 ? depsCruzadas.P450.media : 50;

        if (aolMedia >= 65 && egsMedia >= 55) {
            visao += 'Se usar esse touro nas vacas do plantel, em <strong>2-3 anos</strong> os filhos vão pro abate com:<br>';
            visao += '• Carcaça acima da média — loin eye area do bom.<br>';
            visao += '• Acabamento adequado — sem desconto por falta de gordura.<br>';
            visao += '• Estimativa: <strong>18-20 arrobas</strong> com acabamento uniforme.<br>';
            visao += '🏆 <strong>Investimento que se paga no gancho!</strong>';
        } else if (aolMedia >= 50) {
            visao += 'Resultado esperado: carcaça regular. Vai vender, mas sem prêmio especial. ';
            visao += 'Pra melhorar o retorno no FrigoGest, considere touro mais forte em AOL e EGS.';
        } else {
            visao += 'Patrão, com esse cruzamento a carcaça vai ser fraca. ';
            visao += 'Risco de desconto no frigorífico. Recomendo repensar o acasalamento.';
        }
        parecer.push(visao);

        // ── Veredicto final ──
        var veredicto = '';
        if (alerta_consanguinidade) {
            veredicto = '❌ <strong style="color:#EF4444;">NÃO RECOMENDO.</strong> Risco de consanguinidade. Troque o touro.';
        } else if (compensacoes.length >= 2 && preocupacoes.length === 0) {
            veredicto = '✅ <strong style="color:#22C55E;">ACASALAMENTO EXCELENTE!</strong> Touro compensa os pontos fracos da vaca. Manda ver, patrão!';
        } else if (compensacoes.length >= 1 && preocupacoes.length <= 1) {
            veredicto = '👍 <strong style="color:#3B82F6;">BOM ACASALAMENTO.</strong> Tem compensação, mas poderia ser melhor. Pode usar com segurança.';
        } else if (preocupacoes.length >= 2) {
            veredicto = '⚠️ <strong style="color:#F59E0B;">ACASALAMENTO ARRISCADO.</strong> Touro não corrige os problemas da vaca. Procure outra opção.';
        } else {
            veredicto = '🤔 <strong>ACASALAMENTO NEUTRO.</strong> Não prejudica, mas também não brilha. Pra melhor resultado, busque touro mais específico.';
        }
        parecer.push(veredicto);

        return {
            parecer: parecer,
            compensacoes: compensacoes,
            preocupacoes: preocupacoes,
            consanguinidade: alerta_consanguinidade,
            depsCruzadas: depsCruzadas,
            aptidoesProjetadas: { cria: aptCria, engorda: aptEngorda, reposicao: aptRepo }
        };
    },

    /**
     * Busca os melhores touros do catálogo para compensar os pontos fracos de uma vaca.
     */
    buscarTourosParaVaca: function (fichaVaca) {
        if (!window.catalogoTouros || !window.catalogoTouros.buscarCompensacao) {
            return [];
        }
        return window.catalogoTouros.buscarCompensacao(fichaVaca.deps || {});
    },

    /**
     * Retorna todas as fichas genéticas salvas no sistema.
     */
    getFichas: function (sexo) {
        var fichas = window.data.getByType('FICHA_GENETICA');
        if (sexo) {
            return fichas.filter(function (f) { return f.sexo === sexo; });
        }
        return fichas;
    },

    /**
     * Busca uma ficha genética pelo brinco.
     */
    getFichaPorBrinco: function (brinco) {
        var fichas = window.data.getByType('FICHA_GENETICA');
        for (var i = 0; i < fichas.length; i++) {
            if (fichas[i].brinco === brinco) return fichas[i];
        }
        return null;
    }
};
