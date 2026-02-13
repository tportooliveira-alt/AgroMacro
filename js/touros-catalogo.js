// ====== CATÁLOGO DE TOUROS PROVADOS — Base Inicial ======
// Fonte: PMGZ/ABCZ, ANCP, CRV, ABS, Alta Genetics, Semex
// Foco: Nelore + Angus + Brahman — Pecuária de Corte Ciclo Completo
// DEPs baseadas nos sumários públicos 2024/2025
window.catalogoTouros = [

    // ═══════════════════════════════════════
    // NELORE — Top Provados
    // ═══════════════════════════════════════

    {
        id: 'T001',
        nome: 'CFM IMPERADOR',
        registro: 'CFOR-1890',
        raca: 'Nelore',
        programa: 'PMGZ',
        linhagem: 'Karvadi x Godhavari',
        iabcz: 14.2,
        mgte: null,
        deca: 1,
        percentil: 1,
        deps: {
            PN: 0.2,
            P120: 6.5,
            P210: 12.8,
            P365: 16.5,
            P450: 20.1,
            GPD: 45,
            MP210: 5.2,
            PE: 2.8,
            IPP: -6.5,
            P3P: 10.2,
            PAC: 7.1,
            AOL: 3.8,
            EGS: 0.65,
            MS: 0.45,
            PS: 0.38
        },
        aptidoes: { cria: 78, engorda: 72, reposicao: 75 },
        selo: 'Elite Cria',
        centrais: [
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 24.80, tipo: 'convencional' },
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 48.00, tipo: 'sexado' }
        ],
        destaque: 'Palheta de Ouro CRV. Equilíbrio entre cria e engorda. Bezerros nascem fácil e crescem rápido.',
        indicacao: 'Uso geral — serve pra cria, engorda e reposição. Seguro pra novilha.'
    },

    {
        id: 'T002',
        nome: 'FAROESTE FIV JMP',
        registro: 'JMP-4417',
        raca: 'Nelore',
        programa: 'ANCP',
        linhagem: 'Fundador x Navegador',
        iabcz: null,
        mgte: 40.41,
        deca: 1,
        percentil: 0.1,
        deps: {
            PN: -0.3,
            P120: 9.8,
            P210: 18.5,
            P365: 24.2,
            P450: 29.8,
            GPD: 68,
            MP210: 4.8,
            PE: 3.5,
            IPP: -10.2,
            P3P: 15.8,
            PAC: 9.5,
            AOL: 7.84,
            EGS: 1.2,
            MS: 0.62,
            PS: 0.55
        },
        aptidoes: { cria: 72, engorda: 92, reposicao: 82 },
        selo: 'Elite Engorda',
        centrais: [
            { nome: 'ABS Pecplan', cidade: 'Uberaba-MG', preco: 38.00, tipo: 'convencional' }
        ],
        destaque: '#1 no ranking ANCP MGTe (Top 0.1%). AOL de 7.84 — o bife mais largo do sumário. Monstro de carcaça.',
        indicacao: 'Foco total em ENGORDA e carcaça pro FrigoGest. Vai dar boi gordo premium.'
    },

    {
        id: 'T003',
        nome: 'AVATAR DA MATINHA',
        registro: 'MATF-2245',
        raca: 'Nelore',
        programa: 'PMGZ',
        linhagem: 'Supremo x Fabuloso',
        iabcz: 16.8,
        mgte: null,
        deca: 1,
        percentil: 0.5,
        deps: {
            PN: 0.8,
            P120: 7.2,
            P210: 14.5,
            P365: 19.8,
            P450: 24.5,
            GPD: 52,
            MP210: 7.5,
            PE: 2.2,
            IPP: -5.0,
            P3P: 8.5,
            PAC: 8.8,
            AOL: 2.5,
            EGS: 0.45,
            MS: 0.35,
            PS: 0.30
        },
        aptidoes: { cria: 85, engorda: 65, reposicao: 78 },
        selo: 'Elite Cria',
        centrais: [
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 36.50, tipo: 'convencional' }
        ],
        destaque: 'Palheta de Ouro — +100 mil doses vendidas. Habilidade materna excepcional (MP210 = 7.5). Faz vaca boa.',
        indicacao: 'CRIA e REPOSIÇÃO. Filhas vão ser as melhores mães do rebanho. Leite de sobra.'
    },

    {
        id: 'T004',
        nome: 'REM USP',
        registro: 'GERA-5501',
        raca: 'Nelore',
        programa: 'PMGZ',
        linhagem: 'Remanso x Estouro',
        iabcz: 18.5,
        mgte: null,
        deca: 1,
        percentil: 0.5,
        deps: {
            PN: -0.1,
            P120: 8.5,
            P210: 16.2,
            P365: 22.0,
            P450: 27.5,
            GPD: 62,
            MP210: 5.8,
            PE: 3.1,
            IPP: -8.0,
            P3P: 12.0,
            PAC: 8.0,
            AOL: 5.2,
            EGS: 0.90,
            MS: 0.52,
            PS: 0.48
        },
        aptidoes: { cria: 76, engorda: 82, reposicao: 80 },
        selo: 'Equilibrado',
        centrais: [
            { nome: 'Alta Genetics', cidade: 'Uberaba-MG', preco: 32.00, tipo: 'convencional' },
            { nome: 'Alta Genetics', cidade: 'Uberaba-MG', preco: 58.00, tipo: 'sexado' }
        ],
        destaque: '+119 mil doses vendidas. Animal equilibrado — serve pra tudo. O "coringa" do plantel.',
        indicacao: 'USO GERAL. Equilíbrio perfeito entre cria, engorda e reposição. Genética segura.'
    },

    {
        id: 'T005',
        nome: 'LANDAU DA DI GENIO',
        registro: 'DIGN-3890',
        raca: 'Nelore',
        programa: 'PMGZ',
        linhagem: 'Karvadi x Taj Mahal',
        iabcz: 22.0,
        mgte: null,
        deca: 1,
        percentil: 0.1,
        deps: {
            PN: 1.5,
            P120: 10.2,
            P210: 20.5,
            P365: 28.0,
            P450: 35.2,
            GPD: 75,
            MP210: 3.2,
            PE: 4.0,
            IPP: -12.0,
            P3P: 18.0,
            PAC: 6.5,
            AOL: 6.8,
            EGS: 1.05,
            MS: 0.58,
            PS: 0.50
        },
        aptidoes: { cria: 55, engorda: 95, reposicao: 72 },
        selo: 'Elite Engorda',
        centrais: [
            { nome: 'Particular', cidade: 'Uberaba-MG', preco: 1600.00, tipo: 'convencional' }
        ],
        destaque: 'Lendário. iABCZ 22. Peso e carcaça excepcionais. Mas CUIDADO: peso ao nascer alto — só pra vaca adulta!',
        indicacao: '⚠️ SÓ ENGORDA. Bezerro nasce pesado — NÃO usar em novilha. Pra vaca multípara, é ouro no gancho.'
    },

    // ═══════════════════════════════════════
    // ANGUS — Cruzamento Industrial
    // ═══════════════════════════════════════

    {
        id: 'T006',
        nome: 'BALDRIDGE BRONC',
        registro: 'ANG-BB2048',
        raca: 'Angus',
        programa: 'Interbull',
        linhagem: 'USA Import',
        iabcz: null,
        mgte: null,
        deca: null,
        percentil: 5,
        deps: {
            PN: -1.8,
            P210: 22.0,
            P365: 32.0,
            P450: 38.0,
            GPD: 85,
            MP210: 8.0,
            AOL: 8.5,
            EGS: 1.8,
            MS: 0.70,
            PS: 0.65
        },
        aptidoes: { cria: 80, engorda: 95, reposicao: 60 },
        selo: 'Elite Engorda',
        centrais: [
            { nome: 'ABS Pecplan', cidade: 'Uberaba-MG', preco: 28.00, tipo: 'convencional' },
            { nome: 'Semex', cidade: 'Londrina-PR', preco: 25.00, tipo: 'convencional' }
        ],
        destaque: 'Angus top pra cruzamento industrial. Carcaça PREMIUM — marmoreio e acabamento superiores.',
        indicacao: 'CRUZAMENTO com vacas Nelore pra F1 de abate premium. O FrigoGest paga prêmio por esse bezerro.'
    },

    {
        id: 'T007',
        nome: 'BASIN PAYWEIGHT',
        registro: 'ANG-BP4055',
        raca: 'Angus',
        programa: 'Interbull',
        linhagem: 'USA Import',
        iabcz: null,
        mgte: null,
        deca: null,
        percentil: 2,
        deps: {
            PN: -2.5,
            P210: 18.0,
            P365: 28.0,
            P450: 34.0,
            GPD: 78,
            MP210: 9.0,
            AOL: 7.2,
            EGS: 1.5,
            MS: 0.60,
            PS: 0.55
        },
        aptidoes: { cria: 88, engorda: 85, reposicao: 65 },
        selo: 'Elite Cria',
        centrais: [
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 22.00, tipo: 'convencional' }
        ],
        destaque: 'Angus com peso nascer NEGATIVO — seguro pra novilha Nelore. Habilidade materna excepcional.',
        indicacao: 'CRUZAMENTO seguro. Bezerro F1 nasce fácil, desmama pesado, dá carcaça premium.'
    },

    // ═══════════════════════════════════════
    // BRAHMAN — Rusticidade
    // ═══════════════════════════════════════

    {
        id: 'T008',
        nome: 'JDH SIR LIBERTY MANSO',
        registro: 'BRM-LM5588',
        raca: 'Brahman',
        programa: 'ABCZ',
        linhagem: 'Manso x Liberty',
        iabcz: 10.5,
        mgte: null,
        deca: 1,
        percentil: 3,
        deps: {
            PN: 0.5,
            P210: 10.5,
            P365: 15.0,
            P450: 18.5,
            GPD: 38,
            MP210: 6.2,
            PE: 2.0,
            IPP: -4.0,
            AOL: 2.8,
            EGS: 0.50,
            MS: 0.40
        },
        aptidoes: { cria: 72, engorda: 58, reposicao: 70 },
        selo: 'Rustico',
        centrais: [
            { nome: 'Alta Genetics', cidade: 'Uberaba-MG', preco: 18.00, tipo: 'convencional' }
        ],
        destaque: 'Brahman manso e rústico. Ideal pra regiões difíceis com calor intenso e carrapato.',
        indicacao: 'RUSTICIDADE + CRIA. Pra quem precisa de gado que aguenta tudo e ainda produz.'
    },

    // ═══════════════════════════════════════
    // GUZERÁ — Dupla Aptidão (Corte + Leite)
    // ═══════════════════════════════════════

    {
        id: 'T009',
        nome: 'ESTEIO DA CENTROGEN',
        registro: 'CTGN-2280',
        raca: 'Guzerá',
        programa: 'PMGZ',
        linhagem: 'Rastro x Imperador GZ',
        iabcz: 12.8,
        mgte: null,
        deca: 1,
        percentil: 2,
        deps: {
            PN: 0.4,
            P120: 5.8,
            P210: 11.0,
            P365: 15.5,
            P450: 19.0,
            GPD: 40,
            MP210: 8.5,
            PE: 2.0,
            IPP: -4.5,
            P3P: 7.8,
            PAC: 6.5,
            AOL: 2.2,
            EGS: 0.40,
            MS: 0.32
        },
        aptidoes: { cria: 88, engorda: 58, reposicao: 82 },
        selo: 'Elite Cria',
        centrais: [
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 20.00, tipo: 'convencional' },
            { nome: 'Central Bela Vista', cidade: 'Uberaba-MG', preco: 18.50, tipo: 'convencional' }
        ],
        destaque: 'Guzerá com habilidade materna excepcional (MP210=8.5). Vaca Guzerá é "mãezona" — leite de sobra pro bezerro.',
        indicacao: 'CRIA + REPOSIÇÃO. Filhas vão ser as vacas mais leiteiras do rebanho. Ideal pra dupla aptidão.'
    },

    {
        id: 'T010',
        nome: 'AMADO FIV DA SM',
        registro: 'SMGZ-4150',
        raca: 'Guzerá',
        programa: 'PMGZ',
        linhagem: 'Ônix x Rastro',
        iabcz: 15.5,
        mgte: null,
        deca: 1,
        percentil: 1,
        deps: {
            PN: 0.8,
            P120: 7.5,
            P210: 14.2,
            P365: 19.8,
            P450: 24.5,
            GPD: 52,
            MP210: 6.0,
            PE: 2.5,
            IPP: -6.0,
            P3P: 10.0,
            PAC: 7.8,
            AOL: 3.5,
            EGS: 0.55,
            MS: 0.42
        },
        aptidoes: { cria: 75, engorda: 70, reposicao: 78 },
        selo: 'Equilibrado',
        centrais: [
            { nome: '3A Genética', cidade: 'Uberaba-MG', preco: 22.00, tipo: 'convencional' }
        ],
        destaque: 'Guzerá top em iABCZ (15.5). Bom peso E leite — o equilíbrio que poucos Guzerá têm.',
        indicacao: 'USO GERAL. Guzerá equilibrado entre peso e maternidade. Bom pra cruzamento com Nelore.'
    },

    // ═══════════════════════════════════════
    // TABAPUÃ — Precocidade e Carcaça
    // ═══════════════════════════════════════

    {
        id: 'T011',
        nome: 'FATOR DE TRIUNFO',
        registro: 'TRNF-3320',
        raca: 'Tabapuã',
        programa: 'PMGZ',
        linhagem: 'Rastro TB x Ônix TB',
        iabcz: 16.0,
        mgte: null,
        deca: 1,
        percentil: 1,
        deps: {
            PN: -0.2,
            P120: 8.0,
            P210: 15.5,
            P365: 21.0,
            P450: 26.0,
            GPD: 58,
            MP210: 5.5,
            PE: 3.0,
            IPP: -7.5,
            P3P: 11.0,
            PAC: 8.5,
            AOL: 5.8,
            EGS: 0.95,
            MS: 0.52,
            PS: 0.45
        },
        aptidoes: { cria: 72, engorda: 88, reposicao: 78 },
        selo: 'Elite Engorda',
        centrais: [
            { nome: 'ABS Pecplan', cidade: 'Uberaba-MG', preco: 26.00, tipo: 'convencional' },
            { nome: 'Alta Genetics', cidade: 'Uberaba-MG', preco: 24.00, tipo: 'convencional' }
        ],
        destaque: 'Tabapuã precoce com AOL de 5.8 — excelente rendimento de carcaça. Mocho e dócil = fácil de manejar.',
        indicacao: 'ENGORDA e CONFINAMENTO. Tabapuã top de carcaça. Mocho = sem chifre = menos acidente no curral.'
    },

    {
        id: 'T012',
        nome: 'MITO DA SS TABAPUÃ',
        registro: 'SSTB-1890',
        raca: 'Tabapuã',
        programa: 'ANCP',
        linhagem: 'Fundador TB x Predestinado',
        iabcz: null,
        mgte: 18.5,
        deca: 1,
        percentil: 3,
        deps: {
            PN: 0.1,
            P120: 6.8,
            P210: 13.0,
            P365: 18.0,
            P450: 22.5,
            GPD: 48,
            MP210: 7.0,
            PE: 2.2,
            IPP: -5.5,
            P3P: 9.5,
            PAC: 7.2,
            AOL: 3.2,
            EGS: 0.55,
            MS: 0.38
        },
        aptidoes: { cria: 82, engorda: 68, reposicao: 80 },
        selo: 'Elite Cria',
        centrais: [
            { nome: 'Semex', cidade: 'Londrina-PR', preco: 18.00, tipo: 'convencional' },
            { nome: 'CRV Lagoa', cidade: 'Uberaba-MG', preco: 20.00, tipo: 'convencional' }
        ],
        destaque: 'Tabapuã com habilidade materna de Guzerá (MP210=7.0). Mocho, dócil, filhas com leite. Raro!',
        indicacao: 'CRIA + REPOSIÇÃO. Tabapuã que faz fêmea boa. Ideal pra segurar as novilhas no plantel.'
    },

    // ═══════════════════════════════════════
    // SINDI — Rusticidade Extrema + Dupla Aptidão
    // ═══════════════════════════════════════

    {
        id: 'T013',
        nome: 'MAHARAJA DA BAHIA',
        registro: 'SNBA-0850',
        raca: 'Sindi',
        programa: 'PMGZ',
        linhagem: 'Karachi x Hyderabad',
        iabcz: 8.0,
        mgte: null,
        deca: 1,
        percentil: 5,
        deps: {
            PN: -0.8,
            P120: 3.5,
            P210: 7.0,
            P365: 10.5,
            P450: 13.0,
            GPD: 28,
            MP210: 6.5,
            PE: 1.5,
            IPP: -3.0,
            AOL: 1.5,
            EGS: 0.30,
            MS: 0.25
        },
        aptidoes: { cria: 78, engorda: 35, reposicao: 72 },
        selo: 'Rustico',
        centrais: [
            { nome: 'ABS Pecplan', cidade: 'Uberaba-MG', preco: 12.00, tipo: 'convencional' }
        ],
        destaque: 'Sindi puro — raça do sertão. Aguenta seca, carrapato, calor de 45°C e continua parindo. Leite gordo!',
        indicacao: 'SEMIÁRIDO + DUPLA APTIDÃO. Pra quem tem fazenda no Nordeste ou quer cruzar com Nelore pra rústicidade.'
    },

    {
        id: 'T014',
        nome: 'RAJAH FIV CASTILHO',
        registro: 'SNCS-1120',
        raca: 'Sindi',
        programa: 'PMGZ',
        linhagem: 'Maharaja x Sindh Line',
        iabcz: 6.5,
        mgte: null,
        deca: 2,
        percentil: 8,
        deps: {
            PN: -1.0,
            P120: 3.0,
            P210: 6.5,
            P365: 9.8,
            P450: 12.0,
            GPD: 25,
            MP210: 7.2,
            PE: 1.2,
            IPP: -2.5,
            AOL: 1.2,
            EGS: 0.28,
            MS: 0.22
        },
        aptidoes: { cria: 80, engorda: 30, reposicao: 75 },
        selo: 'Rustico',
        centrais: [
            { nome: 'Central Bela Vista', cidade: 'Uberaba-MG', preco: 10.00, tipo: 'convencional' }
        ],
        destaque: 'Sindi com peso ao nascer NEGATIVO — parto fácil garantido. Leite com 5% de gordura. Vaca boa de sertão.',
        indicacao: 'SEMIÁRIDO + CRIA. Bezerro nasce pequeno e fácil, cresce no leite gordo da mãe. Ideal pra Nordeste.'
    }
];

// ═══════════════════════════════════════════════════
// FUNÇÕES DE BUSCA E RECOMENDAÇÃO
// ═══════════════════════════════════════════════════

window.catalogoTouros.buscarPorNome = function (termo) {
    termo = termo.toLowerCase();
    return window.catalogoTouros.filter(function (t) {
        return t.nome.toLowerCase().indexOf(termo) >= 0 ||
            t.registro.toLowerCase().indexOf(termo) >= 0 ||
            (t.linhagem && t.linhagem.toLowerCase().indexOf(termo) >= 0);
    });
};

window.catalogoTouros.buscarPorAptidao = function (aptidao, minNota) {
    minNota = minNota || 70;
    return window.catalogoTouros.filter(function (t) {
        return t.aptidoes && t.aptidoes[aptidao] >= minNota;
    }).sort(function (a, b) {
        return b.aptidoes[aptidao] - a.aptidoes[aptidao];
    });
};

window.catalogoTouros.buscarPorCentral = function (central) {
    central = central.toLowerCase();
    return window.catalogoTouros.filter(function (t) {
        return t.centrais.some(function (c) {
            return c.nome.toLowerCase().indexOf(central) >= 0;
        });
    });
};

// Busca touros que compensam pontos fracos de uma vaca
window.catalogoTouros.buscarCompensacao = function (depsVaca) {
    var fracos = [];
    var genetica = window.genetica;
    if (!genetica) return [];

    for (var sigla in depsVaca) {
        if (genetica.REFS[sigla]) {
            var score = genetica._normalizar(sigla, depsVaca[sigla]);
            if (score <= 40) {
                fracos.push(sigla);
            }
        }
    }

    if (fracos.length === 0) return [];

    // Buscar touros que são fortes exatamente onde a vaca é fraca
    return window.catalogoTouros.filter(function (t) {
        var compensa = 0;
        fracos.forEach(function (sigla) {
            if (t.deps[sigla] !== undefined) {
                var score = genetica._normalizar(sigla, t.deps[sigla]);
                if (score >= 65) compensa++;
            }
        });
        return compensa > 0;
    }).map(function (t) {
        var compensacoes = [];
        fracos.forEach(function (sigla) {
            if (t.deps[sigla] !== undefined) {
                var score = genetica._normalizar(sigla, t.deps[sigla]);
                if (score >= 65) {
                    compensacoes.push(genetica.REFS[sigla].nome);
                }
            }
        });
        return {
            touro: t,
            compensacoes: compensacoes,
            qtdCompensacoes: compensacoes.length
        };
    }).sort(function (a, b) {
        return b.qtdCompensacoes - a.qtdCompensacoes;
    });
};

console.log('📚 Catálogo de Touros: ' + window.catalogoTouros.length + ' touros carregados (Nelore, Angus, Brahman, Guzerá, Tabapuã, Sindi)');
