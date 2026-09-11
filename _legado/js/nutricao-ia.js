// ====== MÓDULO: NUTRIÇÃO BOVINA & AGENTE ZOOTÉCNICO IA ======
// ZootecIA: formulação de ração, exigências NRC 2016, banco CQBAL 3.0
// Integra com rebanho, estoque e financeiro do AgroMacro
// Autora: gerado para AgroMacro — Bahia, Nordeste
// ============================================================

window.nutricaoIA = {

    historico: [],
    aberto: false,
    _abaAtiva: 'exigencias',

    // ─────────────────────────────────────────────────────────────────
    // BANCO DE ALIMENTOS — CQBAL 3.0 / Embrapa / NRC 2016
    // MS% = matéria original (tal qual) | demais = % na Matéria Seca
    // EM = Energia Metabolizável (Mcal/kg MS)
    // ─────────────────────────────────────────────────────────────────
    ALIMENTOS: [
        // ── VOLUMOSOS ──
        { id:'sil_milho',    nome:'Silagem de Milho',          tipo:'vol', MS:33, PB:7.0,  FDN:58, FDA:32, NDT:68, EM:2.64, EE:3.2, Ca:0.26, P:0.22, preco:0.28, obs:'Volumoso nobre, alta energia. Base do confinamento.' },
        { id:'sil_sorgo',    nome:'Silagem de Sorgo',          tipo:'vol', MS:30, PB:6.5,  FDN:65, FDA:38, NDT:62, EM:2.41, EE:2.8, Ca:0.38, P:0.22, preco:0.22, obs:'Mais barata que milho. Boa no semiárido.' },
        { id:'sil_braq',     nome:'Silagem de Braquiária',     tipo:'vol', MS:30, PB:9.0,  FDN:68, FDA:42, NDT:56, EM:2.17, EE:2.5, Ca:0.45, P:0.25, preco:0.18, obs:'Boa PB. NDT menor. Útil no Nordeste.' },
        { id:'sil_giras',    nome:'Silagem de Girassol',       tipo:'vol', MS:28, PB:12.0, FDN:52, FDA:32, NDT:62, EM:2.41, EE:7.0, Ca:0.52, P:0.25, preco:0.25, obs:'Alta PB e EE. Boa em mistura.' },
        { id:'feno_tifton',  nome:'Feno de Tifton-85',         tipo:'vol', MS:88, PB:12.0, FDN:74, FDA:39, NDT:56, EM:2.18, EE:2.2, Ca:0.48, P:0.22, preco:0.85, obs:'Melhor feno tropical. Alta PB.' },
        { id:'feno_coast',   nome:'Feno de Coast Cross',       tipo:'vol', MS:88, PB:10.0, FDN:77, FDA:41, NDT:52, EM:2.02, EE:2.0, Ca:0.40, P:0.20, preco:0.75, obs:'Qualidade intermediária.' },
        { id:'feno_braq',    nome:'Feno de Braquiária',        tipo:'vol', MS:88, PB:7.5,  FDN:79, FDA:46, NDT:48, EM:1.87, EE:1.8, Ca:0.45, P:0.18, preco:0.55, obs:'PB baixa. Usar com suplemento proteico.' },
        { id:'cana_verde',   nome:'Cana-de-açúcar (verde)',    tipo:'vol', MS:24, PB:3.0,  FDN:52, FDA:35, NDT:67, EM:2.60, EE:1.5, Ca:0.35, P:0.08, preco:0.08, obs:'Alta energia. PB muito baixa. Exige ureia.' },
        { id:'napier',       nome:'Capim Napier Picado',       tipo:'vol', MS:18, PB:8.5,  FDN:71, FDA:42, NDT:55, EM:2.14, EE:2.0, Ca:0.42, P:0.25, preco:0.05, obs:'Colher com 1.5m. MS baixa, bom frescor.' },
        { id:'bagaco_cana',  nome:'Bagaço de Cana in natura',  tipo:'vol', MS:93, PB:2.0,  FDN:88, FDA:56, NDT:41, EM:1.60, EE:1.0, Ca:0.30, P:0.06, preco:0.04, obs:'Baixíssima qualidade. Apenas volumoso de enchimento.' },
        { id:'palha_milho',  nome:'Palhada de Milho',          tipo:'vol', MS:88, PB:5.0,  FDN:83, FDA:52, NDT:46, EM:1.80, EE:1.5, Ca:0.38, P:0.08, preco:0.12, obs:'Baixa qualidade. Útil na entressafra.' },
        // ── CONCENTRADOS ENERGÉTICOS ──
        { id:'milho_moido',  nome:'Milho Grão Moído',          tipo:'cen', MS:88, PB:8.5,  FDN:12, FDA:4,  NDT:88, EM:3.39, EE:4.0, Ca:0.03, P:0.28, preco:1.50, obs:'Rei dos energéticos. Base da terminação.' },
        { id:'sorgo_moido',  nome:'Sorgo Grão Moído',          tipo:'cen', MS:89, PB:8.0,  FDN:18, FDA:7,  NDT:82, EM:3.18, EE:3.2, Ca:0.04, P:0.30, preco:1.20, obs:'80-85% do valor do milho. Ótimo no Nordeste.' },
        { id:'polpa_citrica',nome:'Polpa Cítrica Peletizada',  tipo:'cen', MS:88, PB:7.0,  FDN:24, FDA:23, NDT:78, EM:3.02, EE:3.5, Ca:1.73, P:0.12, preco:1.30, obs:'Alta Ca. Reduz acidose. Excelente coproduto.' },
        { id:'caroço_algo',  nome:'Caroço de Algodão',         tipo:'cen', MS:91, PB:23.0, FDN:53, FDA:40, NDT:86, EM:3.35, EE:18.5,Ca:0.15, P:0.53, preco:1.10, obs:'Alto EE: máx 15% MS total (risco de depressão leiteira). Proteína + energia.' },
        { id:'farelo_trigo', nome:'Farelo de Trigo',           tipo:'cen', MS:88, PB:16.0, FDN:41, FDA:12, NDT:74, EM:2.87, EE:4.0, Ca:0.14, P:1.17, preco:1.00, obs:'Alta PB e P. Transição cuidadosa (alto K).' },
        { id:'ddg',          nome:'DDG (Milho Destilado)',      tipo:'cen', MS:90, PB:28.0, FDN:38, FDA:16, NDT:82, EM:3.18, EE:9.0, Ca:0.20, P:0.75, preco:1.40, obs:'Alto EE: máx 15% MS. Boa fonte PNDR.' },
        { id:'melaco',       nome:'Melaço de Cana',            tipo:'cen', MS:75, PB:4.0,  FDN:0,  FDA:0,  NDT:76, EM:2.96, EE:0.3, Ca:0.88, P:0.08, preco:0.60, obs:'Palatabilizante. Máx 10% MS. Veículo para ureia.' },
        { id:'bagaco_cerv',  nome:'Bagaço de Cervejaria Úmido',tipo:'cen', MS:23, PB:26.0, FDN:56, FDA:28, NDT:59, EM:2.29, EE:7.5, Ca:0.35, P:0.50, preco:0.15, obs:'Alta PB. Perecível. Usar até 30% MS.' },
        // ── CONCENTRADOS PROTEICOS ──
        { id:'fsoja_46',     nome:'Farelo de Soja 46%',        tipo:'cpro', MS:88, PB:46.0, FDN:16, FDA:11, NDT:80, EM:3.10, EE:2.0, Ca:0.32, P:0.65, preco:2.50, obs:'Padrão ouro proteico. PB de alta degradabilidade.' },
        { id:'falgo_38',     nome:'Farelo de Algodão 38%',     tipo:'cpro', MS:90, PB:38.0, FDN:34, FDA:26, NDT:67, EM:2.60, EE:3.0, Ca:0.16, P:0.85, preco:1.80, obs:'Mais barato que soja. Gossipol tóxico: máx 20% conc.' },
        { id:'f_peixe',      nome:'Farinha de Peixe',          tipo:'cpro', MS:91, PB:60.0, FDN:0,  FDA:0,  NDT:72, EM:2.79, EE:10.0,Ca:5.10, P:2.80, preco:4.50, obs:'Altíssima PB. Cara. Uso restrito (bezerros, vacas).' },
        { id:'f_giras',      nome:'Farelo de Girassol',        tipo:'cpro', MS:90, PB:36.0, FDN:38, FDA:24, NDT:65, EM:2.53, EE:2.5, Ca:0.44, P:0.96, preco:1.60, obs:'Boa PNDR. Alta fibra — cuidado com FDN total.' },
        { id:'ureia',        nome:'Uréia Pecuária (NNP)',      tipo:'cpro', MS:99, PB:281.0,FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:0,    P:0,    preco:4.00, obs:'NNP: MÁXIMO 1% da MS total ou 3% do concentrado. Usar S.amônio (9:1 ureia:SA). PROIBIDO para bezerros <150kg.' },
        // ── MINERAIS / ADITIVOS ──
        { id:'calcario',     nome:'Calcário Calcítico',        tipo:'min', MS:100,PB:0,     FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:38.0, P:0,    preco:0.30, obs:'Fonte de Ca barata. Máx 1.5% MS.' },
        { id:'fos_bicalcico',nome:'Fosfato Bicálcico',         tipo:'min', MS:100,PB:0,     FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:22.0, P:17.5, preco:3.50, obs:'Melhor fonte de P. Relação Ca:P = 1.26:1.' },
        { id:'sal_branco',   nome:'Sal Branco (NaCl)',         tipo:'min', MS:100,PB:0,     FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:0,    P:0,    preco:0.80, obs:'0.2-0.5% MS. Na mínimo 0.1%, Cl 0.15%.' },
        { id:'sulf_amonio',  nome:'Sulfato de Amônio',         tipo:'min', MS:100,PB:132.0, FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:0,    P:0,    preco:2.20, obs:'Fonte de S para uso com ureia. 9 kg ureia : 1 kg SA. S=24%.' },
        { id:'premix_min',   nome:'Premix Mineral Bovino',     tipo:'min', MS:100,PB:0,     FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:12.0, P:8.0,  preco:6.00, obs:'Inclui macro e microminerais + vitaminas A, D, E.' },
        { id:'bicarbonato',  nome:'Bicarbonato de Sódio',      tipo:'min', MS:100,PB:0,     FDN:0,  FDA:0,  NDT:0,  EM:0,    EE:0,   Ca:0,    P:0,    preco:2.80, obs:'Tamponante. Máx 0.7% MS em dietas de alto grão.' }
    ],

    // ─────────────────────────────────────────────────────────────────
    // EXIGÊNCIAS NRC 2016 — Adaptado para Bos indicus (Nelore, Brazil)
    // Fonte: NRC Beef Cattle 2016 + Valadares Filho et al. 2016 (CQBAL)
    // NEm Bos indicus = +10% vs taurino (0.077 × PV^0.75 × 1.1)
    // ─────────────────────────────────────────────────────────────────
    CATEGORIAS_REQ: {
        'bezerro':     { label:'Bezerro desmamado (100-200 kg)',      DMI_pct:3.0, PB_min:16, PB_max:18, NDT_min:68, NDT_max:75, Ca_min:0.55, P_min:0.35, FDN_min:25, FDN_max:55 },
        'recria':      { label:'Novilho em recria (200-350 kg)',       DMI_pct:2.8, PB_min:12, PB_max:14, NDT_min:62, NDT_max:68, Ca_min:0.35, P_min:0.25, FDN_min:30, FDN_max:65 },
        'terminacao':  { label:'Terminação / Confinamento (350-550 kg)',DMI_pct:2.5, PB_min:11, PB_max:13, NDT_min:70, NDT_max:78, Ca_min:0.30, P_min:0.20, FDN_min:20, FDN_max:45 },
        'semiconf':    { label:'Semiconfinamento (recria + pasto)',    DMI_pct:2.6, PB_min:12, PB_max:14, NDT_min:64, NDT_max:70, Ca_min:0.32, P_min:0.22, FDN_min:35, FDN_max:60 },
        'vaca_seca':   { label:'Vaca seca / mantença',                 DMI_pct:2.0, PB_min:7,  PB_max:9,  NDT_min:52, NDT_max:58, Ca_min:0.20, P_min:0.15, FDN_min:40, FDN_max:75 },
        'vaca_prenhes':{ label:'Vaca prenhe (último terço gestação)', DMI_pct:2.0, PB_min:9,  PB_max:11, NDT_min:55, NDT_max:62, Ca_min:0.35, P_min:0.22, FDN_min:38, FDN_max:68 },
        'vaca_lac':    { label:'Vaca em lactação (primeiros 90 dias)', DMI_pct:2.5, PB_min:12, PB_max:15, NDT_min:62, NDT_max:70, Ca_min:0.45, P_min:0.28, FDN_min:30, FDN_max:60 },
        'novilha':     { label:'Novilha em recria (200-300 kg)',       DMI_pct:2.8, PB_min:12, PB_max:15, NDT_min:62, NDT_max:68, Ca_min:0.40, P_min:0.25, FDN_min:30, FDN_max:60 },
        'touro':       { label:'Touro adulto (mantença / reprodução)', DMI_pct:2.0, PB_min:8,  PB_max:10, NDT_min:54, NDT_max:60, Ca_min:0.25, P_min:0.18, FDN_min:40, FDN_max:70 }
    },

    // ─────────────────────────────────────────────────────────────────
    // CÁLCULO DE EXIGÊNCIAS NRC 2016
    // ─────────────────────────────────────────────────────────────────
    calcularExigencias: function (categoria, pesoVivo, gmd) {
        var cat = this.CATEGORIAS_REQ[categoria] || this.CATEGORIAS_REQ['recria'];
        var PV = parseFloat(pesoVivo) || 300;
        var GMD = parseFloat(gmd) || 1.0;

        // NEm Mcal/dia — Bos indicus +10%
        var NEm = (0.077 * Math.pow(PV, 0.75) * 1.1);

        // NEg Mcal/dia
        var EBW = PV * 0.891;
        var EBG = GMD * 0.956;
        var NEg = (0.0635 * Math.pow(EBW, 0.75) * Math.pow(EBG, 1.097));

        // DMI (kg MS/dia)
        var DMI = PV * cat.DMI_pct / 100;

        // MS dietética e PB
        var PB_pct = (cat.PB_min + cat.PB_max) / 2;
        var PB_g_dia = DMI * PB_pct / 100 * 1000; // gramas

        // NDT
        var NDT_pct = (cat.NDT_min + cat.NDT_max) / 2;
        var NDT_kg_dia = DMI * NDT_pct / 100;

        // Energia líquida dietética mínima
        var NE_diet = (NEm + NEg) / DMI; // Mcal/kg MS

        return {
            categoria: cat.label,
            PV: PV, GMD: GMD,
            DMI: +DMI.toFixed(1),
            NEm: +NEm.toFixed(2),
            NEg: +NEg.toFixed(2),
            NE_total: +(NEm + NEg).toFixed(2),
            NE_diet: +NE_diet.toFixed(2),
            PB_pct: +PB_pct.toFixed(1),
            PB_min: cat.PB_min, PB_max: cat.PB_max,
            PB_g_dia: +PB_g_dia.toFixed(0),
            NDT_pct: +NDT_pct.toFixed(1),
            NDT_min: cat.NDT_min, NDT_max: cat.NDT_max,
            NDT_kg_dia: +NDT_kg_dia.toFixed(1),
            Ca_min: cat.Ca_min, P_min: cat.P_min,
            FDN_min: cat.FDN_min, FDN_max: cat.FDN_max
        };
    },

    // ─────────────────────────────────────────────────────────────────
    // QUADRADO DE PEARSON
    // Calcula proporções de 2 alimentos para atingir meta de PB
    // ─────────────────────────────────────────────────────────────────
    pearsonSquare: function (idAlim1, idAlim2, metaPB) {
        var a1 = this.getAlimento(idAlim1);
        var a2 = this.getAlimento(idAlim2);
        if (!a1 || !a2) return null;

        var PB_A = a1.PB, PB_B = a2.PB;
        var meta = parseFloat(metaPB);

        // PB_B deve ser >= PB_A para o quadrado funcionar
        if (PB_A > PB_B) { var tmp = a1; a1 = a2; a2 = tmp; PB_A = a1.PB; PB_B = a2.PB; }
        if (meta < PB_A || meta > PB_B) return { erro: 'Meta de PB (' + meta + '%) está fora do intervalo [' + PB_A + '% — ' + PB_B + '%].' };

        var diff = PB_B - PB_A;
        var pct_A = ((PB_B - meta) / diff * 100);
        var pct_B = ((meta - PB_A) / diff * 100);

        // Composição resultante
        var composicao = this._calcularComposicaoBlend([
            { alimento: a1, pct: pct_A },
            { alimento: a2, pct: pct_B }
        ]);

        return {
            alimento1: { nome: a1.nome, PB: PB_A, pct: +pct_A.toFixed(1) },
            alimento2: { nome: a2.nome, PB: PB_B, pct: +pct_B.toFixed(1) },
            metaPB: meta,
            composicao: composicao,
            custo_kg: +(pct_A / 100 * a1.preco + pct_B / 100 * a2.preco).toFixed(3)
        };
    },

    // ─────────────────────────────────────────────────────────────────
    // FORMULADOR DE RAÇÃO — Método iterativo simplificado
    // Ingredientes: [{id, pct_fixa}] — pct_fixa = null = ajustável
    // Meta: {PB_min, NDT_min, categoria}
    // ─────────────────────────────────────────────────────────────────
    formularRacao: function (listaIngredientes, categoria, pesoVivo, gmd) {
        var self = this;
        var exig = this.calcularExigencias(categoria, pesoVivo, gmd);
        var alertas = [];

        // Montar ingredientes com referência ao banco
        var ingredientes = listaIngredientes.map(function (item) {
            var alim = self.getAlimento(item.id);
            if (!alim) return null;
            return { alim: alim, pct: item.pct, fixo: item.fixo };
        }).filter(Boolean);

        if (ingredientes.length === 0) return { erro: 'Nenhum ingrediente selecionado.' };

        // Calcular composição atual
        var totalPct = ingredientes.reduce(function (s, i) { return s + i.pct; }, 0);
        if (Math.abs(totalPct - 100) > 0.5) {
            alertas.push('⚠️ Proporções somam ' + totalPct.toFixed(1) + '% (deve somar 100%). Ajuste as porcentagens.');
        }

        var blend = ingredientes.map(function (i) {
            return { alimento: i.alim, pct: i.pct };
        });
        var comp = this._calcularComposicaoBlend(blend);

        // Verificar atendimento das exigências
        var check = {
            PB:  { val: comp.PB,  min: exig.PB_min,  max: exig.PB_max,  ok: comp.PB  >= exig.PB_min  && comp.PB  <= exig.PB_max  + 4 },
            NDT: { val: comp.NDT, min: exig.NDT_min, max: exig.NDT_max + 5, ok: comp.NDT >= exig.NDT_min },
            Ca:  { val: comp.Ca,  min: exig.Ca_min,  ok: comp.Ca  >= exig.Ca_min  },
            P:   { val: comp.P,   min: exig.P_min,   ok: comp.P   >= exig.P_min   },
            FDN: { val: comp.FDN, min: exig.FDN_min, max: exig.FDN_max, ok: comp.FDN <= exig.FDN_max }
        };

        if (!check.PB.ok)  alertas.push('🔴 PB insuficiente (' + comp.PB.toFixed(1) + '%). Precisa ' + exig.PB_min + '-' + exig.PB_max + '%.');
        if (!check.NDT.ok) alertas.push('🔴 NDT baixo (' + comp.NDT.toFixed(1) + '%). Precisa ≥' + exig.NDT_min + '%.');
        if (!check.Ca.ok)  alertas.push('🟡 Ca insuficiente (' + comp.Ca.toFixed(2) + '%). Precisa ≥' + exig.Ca_min + '%.');
        if (!check.P.ok)   alertas.push('🟡 P insuficiente (' + comp.P.toFixed(2) + '%). Precisa ≥' + exig.P_min + '%.');
        if (!check.FDN.ok) alertas.push('🟠 FDN elevado (' + comp.FDN.toFixed(1) + '%). Reduzir volumoso ou trocar por silagem.');
        if (check.PB.val > exig.PB_max + 4) alertas.push('🟡 PB em excesso (' + comp.PB.toFixed(1) + '%). Pode reduzir proteico e economizar.');

        // Custo por kg MS e por animal/dia
        var custo_kg_ms = comp.custo_kg_ms;
        var custo_dia = +(custo_kg_ms * exig.DMI).toFixed(2);
        var custo_arroba = +((custo_dia * 90) / ((gmd || 1) * 90 / 15)).toFixed(2);

        return {
            exigencias: exig,
            composicao: comp,
            check: check,
            alertas: alertas,
            custo_kg_ms: +custo_kg_ms.toFixed(3),
            custo_dia: custo_dia,
            custo_arroba: custo_arroba,
            ingredientes: blend
        };
    },

    // Retorna composição nutricional de uma mistura
    _calcularComposicaoBlend: function (blend) {
        var PB = 0, FDN = 0, FDA = 0, NDT = 0, EM = 0, EE = 0, Ca = 0, P = 0, MS_media = 0;
        var custo = 0, total = 0;
        blend.forEach(function (item) {
            var a = item.alimento, p = item.pct / 100;
            PB  += a.PB  * p; FDN += a.FDN * p; FDA += a.FDA * p;
            NDT += a.NDT * p; EM  += a.EM  * p; EE  += a.EE  * p;
            Ca  += a.Ca  * p; P   += a.P   * p;
            MS_media += a.MS * p;
            custo += a.preco * (a.MS / 100) * p; // custo por kg na MS
            total += p;
        });
        var custo_kg_ms = total > 0 ? custo / total : 0;
        // Ajusta custo para base MS
        var custo_kg_mf = blend.reduce(function (s, item) {
            return s + item.alimento.preco * item.pct / 100;
        }, 0);

        return {
            PB:  +PB.toFixed(1), FDN: +FDN.toFixed(1), FDA: +FDA.toFixed(1),
            NDT: +NDT.toFixed(1), EM: +EM.toFixed(2),   EE:  +EE.toFixed(1),
            Ca:  +Ca.toFixed(2),  P:  +P.toFixed(2),     MS:  +MS_media.toFixed(1),
            custo_kg_ms: +custo_kg_ms.toFixed(3),
            custo_kg_mf: +custo_kg_mf.toFixed(3)
        };
    },

    getAlimento: function (id) {
        return this.ALIMENTOS.find(function (a) { return a.id === id; }) || null;
    },

    // ─────────────────────────────────────────────────────────────────
    // AGENTE ZOOTÉCNICO IA — Sistema especializado em nutrição bovina
    // ─────────────────────────────────────────────────────────────────

    _getApiConfig: function () {
        try {
            return JSON.parse(localStorage.getItem('agromacro_ia_config') || '{}');
        } catch (e) { return {}; }
    },

    getSystemPrompt: function () {
        var _hoje = new Date().toLocaleDateString('pt-BR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

        return 'Você é o **ZootecIA** — especialista em nutrição animal bovina do AgroMacro.\n'
            + 'Equivale a um Zootecnista Doutor + Consultor com 20 anos no campo (Nordeste/Cerrado).\n'
            + 'Hoje é ' + _hoje + '.\n\n'

            + '══ REGRAS ABSOLUTAS ══\n'
            + '1. Sempre em português, linguagem prática de campo\n'
            + '2. Use dados NRC 2016 + CQBAL 3.0 (valores abaixo)\n'
            + '3. Nunca invente composição de alimentos — use as tabelas\n'
            + '4. Para diagnósticos clínicos, recomende Veterinário\n'
            + '5. Formate com emojis e tópicos (leitura no celular)\n'
            + '6. Máx 500 palavras. Mostre cálculos quando relevante\n\n'

            + '══ EXIGÊNCIAS NRC 2016 — BOVINOs DE CORTE (Bos indicus) ══\n'
            + 'Bezerro desmamado 100-200kg:  PB 16-18%, NDT 68-75%, FDN máx 55%, Ca≥0.55%, P≥0.35%, CMSest 3.0% PV\n'
            + 'Novilho recria 200-350kg:      PB 12-14%, NDT 62-68%, FDN máx 65%, Ca≥0.35%, P≥0.25%, CMSest 2.8% PV\n'
            + 'Terminação confinamento:       PB 11-13%, NDT 70-78%, FDN máx 45%, Ca≥0.30%, P≥0.20%, CMSest 2.5% PV\n'
            + 'Semiconfinamento:              PB 12-14%, NDT 64-70%, FDN máx 60%, CMSest 2.6% PV\n'
            + 'Vaca seca mantença:            PB 7-9%,   NDT 52-58%, FDN máx 75%, CMSest 2.0% PV\n'
            + 'Vaca prenhe (último terço):    PB 9-11%,  NDT 55-62%, Ca≥0.35%, P≥0.22%, CMSest 2.0% PV\n'
            + 'Vaca lactação início:          PB 12-15%, NDT 62-70%, Ca≥0.45%, P≥0.28%, CMSest 2.5% PV\n'
            + 'NEm Bos indicus = 0.077 × PV^0.75 × 1.1 Mcal/dia | NEg = 0.0635×EBW^0.75×EBG^1.097\n\n'

            + '══ BANCO DE ALIMENTOS — CQBAL 3.0 (% na Matéria Seca, EM Mcal/kg MS) ══\n'
            + 'ALIMENTO                  | MS%| PB%  | FDN%| FDA%| NDT%| EM  | EE% | Ca% | P%\n'
            + 'Silagem de Milho          | 33 |  7.0 | 58  | 32  | 68  | 2.64| 3.2 |0.26 |0.22\n'
            + 'Silagem de Sorgo          | 30 |  6.5 | 65  | 38  | 62  | 2.41| 2.8 |0.38 |0.22\n'
            + 'Feno de Tifton-85         | 88 | 12.0 | 74  | 39  | 56  | 2.18| 2.2 |0.48 |0.22\n'
            + 'Feno de Braquiária        | 88 |  7.5 | 79  | 46  | 48  | 1.87| 1.8 |0.45 |0.18\n'
            + 'Cana-de-açúcar (verde)    | 24 |  3.0 | 52  | 35  | 67  | 2.60| 1.5 |0.35 |0.08\n'
            + 'Capim Napier Picado       | 18 |  8.5 | 71  | 42  | 55  | 2.14| 2.0 |0.42 |0.25\n'
            + 'Bagaço de Cana in natura  | 93 |  2.0 | 88  | 56  | 41  | 1.60| 1.0 |0.30 |0.06\n'
            + 'Palhada de Milho          | 88 |  5.0 | 83  | 52  | 46  | 1.80| 1.5 |0.38 |0.08\n'
            + '------\n'
            + 'Milho Grão Moído          | 88 |  8.5 | 12  |  4  | 88  | 3.39| 4.0 |0.03 |0.28\n'
            + 'Sorgo Grão Moído          | 89 |  8.0 | 18  |  7  | 82  | 3.18| 3.2 |0.04 |0.30\n'
            + 'Polpa Cítrica Peletizada  | 88 |  7.0 | 24  | 23  | 78  | 3.02| 3.5 |1.73 |0.12\n'
            + 'Caroço de Algodão         | 91 | 23.0 | 53  | 40  | 86  | 3.35|18.5 |0.15 |0.53\n'
            + 'Farelo de Trigo           | 88 | 16.0 | 41  | 12  | 74  | 2.87| 4.0 |0.14 |1.17\n'
            + 'DDG (Milho Destilado)     | 90 | 28.0 | 38  | 16  | 82  | 3.18| 9.0 |0.20 |0.75\n'
            + 'Melaço de Cana            | 75 |  4.0 |  0  |  0  | 76  | 2.96| 0.3 |0.88 |0.08\n'
            + '------\n'
            + 'Farelo de Soja 46%        | 88 | 46.0 | 16  | 11  | 80  | 3.10| 2.0 |0.32 |0.65\n'
            + 'Farelo de Algodão 38%     | 90 | 38.0 | 34  | 26  | 67  | 2.60| 3.0 |0.16 |0.85\n'
            + 'Farinha de Peixe          | 91 | 60.0 |  0  |  0  | 72  | 2.79|10.0 |5.10 |2.80\n'
            + 'Farelo de Girassol        | 90 | 36.0 | 38  | 24  | 65  | 2.53| 2.5 |0.44 |0.96\n'
            + 'Uréia Pecuária (NNP)      | 99 |281.0 |  0  |  0  |  0  |  0  |  0  |  0  |0.00\n'
            + '------\n'
            + 'Calcário Calcítico        |100 |  0   |  —  |  —  |  —  |  —  |  —  |38.0 |0.00\n'
            + 'Fosfato Bicálcico         |100 |  0   |  —  |  —  |  —  |  —  |  —  |22.0 |17.5\n'
            + 'Sulfato de Amônio         |100 |132.0 |  —  |  —  |  —  |  —  |  —  |  0  |0.00\n\n'

            + '══ PRINCÍPIOS DE FORMULAÇÃO ══\n'
            + 'QUADRADO DE PEARSON (2 alimentos para meta de PB):\n'
            + '  Partes de A = PB_B - PB_meta | Partes de B = PB_meta - PB_A\n'
            + '  Exemplo: milho (8.5%) + farelo soja (46%) → meta 14% PB no concentrado:\n'
            + '  Partes milho = 46-14=32 | Partes soja = 14-8.5=5.5 | Total=37.5\n'
            + '  Milho = 32/37.5 = 85.3% | Soja = 5.5/37.5 = 14.7%\n\n'
            + 'MÉTODO PRÁTICO — DIETA PARA TERMINAÇÃO:\n'
            + '  1. Defina volumoso (50-70% da MS): silagem milho, feno, cana\n'
            + '  2. Calcule PB e NDT do volumoso sozinho\n'
            + '  3. Determine PB necessária no concentrado para atingir meta total:\n'
            + '     PB_conc = (PB_meta_total - %vol × PB_vol) / %conc\n'
            + '  4. Use Pearson para blender milho + proteico\n'
            + '  5. Adicione minerais: premix 1%, sal 0.3%, fosfato se P deficiente\n'
            + '  6. Calcule custo: R$/kg MS × CMS diário × n° cabeças\n\n'
            + 'LIMITES ABSOLUTOS:\n'
            + '  • Uréia: MÁXIMO 1% da MS total | Sempre com sulfato de amônio (9:1)\n'
            + '  • Uréia PROIBIDA para bezerros < 150 kg e animais recém chegados (adaptação 21 dias)\n'
            + '  • Gordura total (EE): não ultrapassar 6-7% da MS (depressão leiteira, acidose)\n'
            + '  • Caroço algodão: máx 15% MS | DDG: máx 15% MS | Farinha peixe: máx 5% MS\n'
            + '  • Gossipol (F.algodão): máx 200mg/animal/dia para fêmeas, 500mg para machos\n'
            + '  • FDN: NUNCA abaixo de 25% da MS total (distúrbios ruminais)\n'
            + '  • Relação Vol:Conc: mínimo 40:60 em peso de MS para evitar acidose\n\n'

            + '══ ESTRATÉGIAS DE CAMPO — NORDESTE/BAHIA ══\n'
            + 'CANA + URÉIA (ração de baixo custo):\n'
            + '  Cana verde + 0.5% ureia + 0.05% sulfato amônio + premix mineral\n'
            + '  Atinge PB ~8-9%, custo <R$0.25/kg MS. Ideal vacas secas e recria.\n'
            + 'PASTO + SUPLEMENTO PROTEICO (sal proteinado):\n'
            + '  Pastejo + 0.1% PV de concentrado proteico 40%PB\n'
            + '  Garante 100-150g PB adicional/dia. GMD +0.3-0.5kg vs sem supl.\n'
            + 'CONFINAMENTO DE BAIXO CUSTO:\n'
            + '  Silagem sorgo 50% + milho 35% + farelo algodão 12% + min 3%\n'
            + '  PB ~12%, NDT ~75%, custo ~R$11-13/cab/dia\n'
            + 'ADAPTAÇÃO AO CONFINAMENTO:\n'
            + '  Semana 1: 80% vol + 20% conc | Semana 2: 60/40 | Semana 3+: meta\n'
            + '  Risco de acidose em transição brusca (pH ruminal cai < 5.5)\n\n'

            + '══ SUPLEMENTAÇÃO MINERAL — REFERÊNCIAS ══\n'
            + 'Macrominerais (%MS): Ca 0.20-0.55, P 0.15-0.35, Mg 0.10, K 0.60, S 0.10, Na 0.10\n'
            + 'Microminerais (ppm): Cu 10-30, Zn 30-60, Mn 20-40, Se 0.1-0.3, Co 0.1, I 0.5\n'
            + 'Relação Ca:P ideal = 1.5:1 a 2:1 | NUNCA inverter (P>Ca = problemas urinários em machos)\n'
            + 'Sal mineral consumo: 80-120g/animal/dia (pastejo) | 30-50g (confinamento via ração)\n\n'

            + '══ AVALIAÇÃO DE COCHO ══\n'
            + 'Sobra ideal: 5-10% do ofertado (indica consumo voluntário máximo atingido)\n'
            + 'Cocho limpo (nota 0): aumentar 5% | Cocho cheio (nota 4): reduzir 30%\n'
            + 'Pesagem 2x/semana: manter controle do GMD e ajustar dieta\n\n'

            + '══ SKILLS DO ZOOTECIA ══\n'
            + '▸ SKILL 1 — FORMULAR RAÇÃO: dado PV, categoria e ingredientes disponíveis,\n'
            + '  calcula proporções, verifica exigências NRC, aponta deficiências e custo.\n'
            + '▸ SKILL 2 — CALCULAR GMD ESPERADO: dado a dieta, estima ganho de peso diário.\n'
            + '▸ SKILL 3 — VIABILIDADE DE CONFINAMENTO: cruza custo dieta + preço arroba.\n'
            + '▸ SKILL 4 — COMPARAR INGREDIENTES: analisa substitutos por custo/nutriente.\n'
            + '▸ SKILL 5 — DIAGNÓSTICO DE DIETA: interpreta sobra de cocho + desempenho.\n'
            + '▸ SKILL 6 — SAL MINERAL + VITAMINAS: recomenda suplemento por categoria.\n'
            + '▸ SKILL 7 — GESTÃO DE ESTOQUE DE RAÇÃO: calcula consumo mensal por lote.\n';
    },

    // Chamada de IA com system prompt zootécnico
    consultar: function (pergunta, cbResposta, cbErro) {
        var self = this;
        var cfg = this._getApiConfig();

        var sysprompt = this.getSystemPrompt();

        // Contexto da fazenda: lotes e estoque
        var ctxFazenda = '';
        try {
            var events = window.data ? window.data.events : [];
            var lotes = events.filter(function (e) { return e.type === 'LOTE' && e.status === 'ATIVO'; });
            if (lotes.length > 0) {
                ctxFazenda += '\nREBANHO ATUAL:\n';
                lotes.forEach(function (l) {
                    ctxFazenda += '  • ' + l.nome + ': ' + (l.qtdAnimais || 0) + ' cab, ' + (l.categoria || '?') + ', peso médio: ' + (l.pesoMedio || '?') + ' kg\n';
                });
            }
            // Estoque de alimentos
            var estoqueDb = window.data ? (window.data._db ? true : false) : false;
            if (window.estoque && window.estoque.items && window.estoque.items.length > 0) {
                var alims = window.estoque.items.filter(function (i) {
                    var cat = (i.categoria || '').toLowerCase();
                    return cat.indexOf('racao') >= 0 || cat.indexOf('nutricao') >= 0 || cat.indexOf('insumo') >= 0;
                });
                if (alims.length > 0) {
                    ctxFazenda += '\nESTOQUE DE ALIMENTOS:\n';
                    alims.forEach(function (i) {
                        ctxFazenda += '  • ' + i.nome + ': ' + i.quantidade + ' ' + (i.unidade || 'kg') + ', R$ ' + (i.valorUnitario || '?') + '/kg\n';
                    });
                }
            }
        } catch (e) {}

        if (ctxFazenda) {
            sysprompt += '\n══ DADOS ATUAIS DA FAZENDA ══' + ctxFazenda;
        }

        var msgs = this.historico.slice(-6).map(function (m) {
            return { role: m.role, content: m.content };
        });

        if (cfg.apiKey) {
            this._callGemini(msgs, pergunta, sysprompt, cfg.apiKey, cbResposta, cbErro);
        } else if (cfg.groqKey) {
            this._callOpenAI(msgs, pergunta, sysprompt,
                'https://api.groq.com/openai/v1/chat/completions',
                cfg.groqKey, 'llama-3.3-70b-versatile', cbResposta, cbErro);
        } else if (cfg.cerebrasKey) {
            this._callOpenAI(msgs, pergunta, sysprompt,
                'https://api.cerebras.ai/v1/chat/completions',
                cfg.cerebrasKey, 'llama3.3-70b', cbResposta, cbErro);
        } else if (cfg.openrouterKey) {
            this._callOpenAI(msgs, pergunta, sysprompt,
                'https://openrouter.ai/api/v1/chat/completions',
                cfg.openrouterKey, 'google/gemma-3-4b-it:free', cbResposta, cbErro,
                { 'HTTP-Referer': window.location.href, 'X-Title': 'AgroMacro ZootecIA' });
        } else if (cfg.claudeKey) {
            this._callClaude(msgs, pergunta, sysprompt, cfg.claudeKey, cbResposta, cbErro);
        } else {
            if (cbErro) cbErro('⚙️ Nenhuma chave API configurada. Configure no módulo IA Consultor.');
        }
    },

    _callGemini: function (historico, pergunta, system, apiKey, cbOk, cbErr) {
        var contents = [];
        contents.push({ role: 'user', parts: [{ text: system }] });
        contents.push({ role: 'model', parts: [{ text: 'Entendido! Sou o ZootecIA. Pronto para formular rações e calcular exigências NRC 2016.' }] });
        historico.forEach(function (m) {
            contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] });
        });
        contents.push({ role: 'user', parts: [{ text: pergunta }] });

        var model = 'gemini-2.5-flash-lite';
        fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents, generationConfig: { temperature: 0.25, topP: 0.85, maxOutputTokens: 1800 } })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    cbOk(data.candidates[0].content.parts[0].text);
                } else {
                    var msg = data.error ? data.error.message : 'Resposta inesperada';
                    if (cbErr) cbErr('Gemini: ' + msg);
                }
            })
            .catch(function (e) { if (cbErr) cbErr('Erro de rede: ' + (e.message || e)); });
    },

    _callOpenAI: function (historico, pergunta, system, url, apiKey, model, cbOk, cbErr, extraHeaders) {
        var messages = [{ role: 'system', content: system }];
        historico.forEach(function (m) { messages.push({ role: m.role, content: m.content }); });
        messages.push({ role: 'user', content: pergunta });
        var headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, extraHeaders || {});
        fetch(url, { method: 'POST', headers: headers, body: JSON.stringify({ model: model, messages: messages, max_tokens: 1800, temperature: 0.25 }) })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.choices && data.choices[0]) {
                    cbOk(data.choices[0].message.content);
                } else {
                    var msg = data.error ? (data.error.message || JSON.stringify(data.error)) : 'Sem resposta';
                    if (cbErr) cbErr(model + ': ' + msg);
                }
            })
            .catch(function (e) { if (cbErr) cbErr('Erro de rede: ' + (e.message || e)); });
    },

    _callClaude: function (historico, pergunta, system, apiKey, cbOk, cbErr) {
        var messages = [];
        historico.forEach(function (m) { messages.push({ role: m.role, content: m.content }); });
        messages.push({ role: 'user', content: pergunta });
        fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1800, system: system, messages: messages })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.content && data.content[0]) {
                    cbOk(data.content[0].text);
                } else {
                    if (cbErr) cbErr('Claude: ' + (data.error ? data.error.message : 'Erro'));
                }
            })
            .catch(function (e) { if (cbErr) cbErr('Erro de rede: ' + (e.message || e)); });
    },

    // ─────────────────────────────────────────────────────────────────
    //  UI  ─  Modal com 4 abas
    // ─────────────────────────────────────────────────────────────────

    init: function () {
        console.log('ZootecIA Nutrição Ready — ' + this.ALIMENTOS.length + ' alimentos, NRC 2016');
    },

    abrirModal: function (abaInicial) {
        this._abaAtiva = abaInicial || 'exigencias';
        if (document.getElementById('modal-zootec')) return;
        this._injetarEstilos();

        var html = '<div id="modal-zootec" class="zt-overlay">'
            + '<div class="zt-modal">'
            + '<div class="zt-header">'
            + '<div class="zt-title">🧬 ZootecIA — Nutrição Bovina</div>'
            + '<button class="zt-close" onclick="window.nutricaoIA.fecharModal()">✕</button>'
            + '</div>'
            + '<div class="zt-tabs">'
            + '<button class="zt-tab" id="zt-tab-exigencias"  onclick="window.nutricaoIA.abrirAba(\'exigencias\')">📊 Exigências</button>'
            + '<button class="zt-tab" id="zt-tab-formulacao" onclick="window.nutricaoIA.abrirAba(\'formulacao\')">⚗️ Formulação</button>'
            + '<button class="zt-tab" id="zt-tab-alimentos"  onclick="window.nutricaoIA.abrirAba(\'alimentos\')">📋 Alimentos</button>'
            + '<button class="zt-tab" id="zt-tab-chat"       onclick="window.nutricaoIA.abrirAba(\'chat\')">🤖 ZootecIA</button>'
            + '</div>'
            + '<div id="zt-body" class="zt-body"></div>'
            + '</div>'
            + '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
        this.abrirAba(this._abaAtiva);
    },

    fecharModal: function () {
        var el = document.getElementById('modal-zootec');
        if (el) el.remove();
    },

    abrirAba: function (aba) {
        this._abaAtiva = aba;
        ['exigencias', 'formulacao', 'alimentos', 'chat'].forEach(function (t) {
            var el = document.getElementById('zt-tab-' + t);
            if (el) el.classList.toggle('ativa', t === aba);
        });
        var body = document.getElementById('zt-body');
        if (!body) return;
        if (aba === 'exigencias')  { body.innerHTML = this._htmlExigencias(); this._bindExigencias(); }
        else if (aba === 'formulacao') { body.innerHTML = this._htmlFormulacao(); this._bindFormulacao(); }
        else if (aba === 'alimentos') { body.innerHTML = this._htmlAlimentos(); }
        else if (aba === 'chat') { body.innerHTML = this._htmlChat(); this._bindChat(); this._renderMensagens(); }
    },

    // ── ABA EXIGÊNCIAS ──
    _htmlExigencias: function () {
        var opts = '';
        var self = this;
        Object.keys(this.CATEGORIAS_REQ).forEach(function (k) {
            opts += '<option value="' + k + '">' + self.CATEGORIAS_REQ[k].label + '</option>';
        });
        return '<div class="zt-form">'
            + '<h3>📊 Exigências Nutricionais NRC 2016</h3>'
            + '<div class="zt-row">'
            + '<div class="zt-field"><label>Categoria</label><select id="zt-cat">' + opts + '</select></div>'
            + '<div class="zt-field"><label>Peso Vivo (kg)</label><input id="zt-pv" type="number" value="300" min="50" max="800"></div>'
            + '<div class="zt-field"><label>GMD desejado (kg/dia)</label><input id="zt-gmd" type="number" value="1.0" min="0" max="3" step="0.1"></div>'
            + '</div>'
            + '<button class="zt-btn-primary" onclick="window.nutricaoIA._calcularExigUI()">Calcular Exigências</button>'
            + '<div id="zt-exig-result"></div>'
            + '</div>';
    },

    _bindExigencias: function () {
        // Auto-preencher com lote selecionado se disponível
        try {
            var events = window.data ? window.data.events : [];
            var lotes = events.filter(function (e) { return e.type === 'LOTE' && e.status === 'ATIVO'; });
            if (lotes.length > 0) {
                var l = lotes[0];
                if (l.pesoMedio) {
                    var pvEl = document.getElementById('zt-pv');
                    if (pvEl) pvEl.value = l.pesoMedio;
                }
                if (l.categoria) {
                    var map = { engorda: 'terminacao', recria: 'recria', cria: 'bezerro' };
                    var catEl = document.getElementById('zt-cat');
                    if (catEl && map[l.categoria]) catEl.value = map[l.categoria];
                }
            }
        } catch (e) {}
    },

    _calcularExigUI: function () {
        var cat = document.getElementById('zt-cat').value;
        var pv  = document.getElementById('zt-pv').value;
        var gmd = document.getElementById('zt-gmd').value;
        var e   = this.calcularExigencias(cat, pv, gmd);
        var r   = document.getElementById('zt-exig-result');
        if (!r) return;

        r.innerHTML = '<div class="zt-card">'
            + '<div class="zt-card-title">📋 ' + e.categoria + '</div>'
            + '<div class="zt-grid-3">'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.DMI + ' kg</span><span class="zt-stat-lab">CMS/dia</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.NEm + ' Mcal</span><span class="zt-stat-lab">NEm/dia</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.NEg + ' Mcal</span><span class="zt-stat-lab">NEg/dia (GMD ' + e.GMD + ')</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.PB_min + ' – ' + e.PB_max + '%</span><span class="zt-stat-lab">PB na MS</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.NDT_min + ' – ' + e.NDT_max + '%</span><span class="zt-stat-lab">NDT na MS</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.PB_g_dia + ' g</span><span class="zt-stat-lab">PB total/dia</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.Ca_min + '%</span><span class="zt-stat-lab">Ca mín na MS</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + e.P_min + '%</span><span class="zt-stat-lab">P mín na MS</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">≤ ' + e.FDN_max + '%</span><span class="zt-stat-lab">FDN máx na MS</span></div>'
            + '</div>'
            + '<div class="zt-info">⚡ Energia dietética mínima: <strong>' + e.NE_diet + ' Mcal/kg MS</strong> | NE total/dia: <strong>' + e.NE_total + ' Mcal</strong></div>'
            + '</div>';
    },

    // ── ABA FORMULAÇÃO ──
    _htmlFormulacao: function () {
        var self = this;
        var opts_cat = '';
        Object.keys(this.CATEGORIAS_REQ).forEach(function (k) {
            opts_cat += '<option value="' + k + '">' + self.CATEGORIAS_REQ[k].label + '</option>';
        });

        var opts_alim = '';
        var tipos = [
            { key: 'vol',  label: 'Volumosos' },
            { key: 'cen',  label: 'Concentrado Energético' },
            { key: 'cpro', label: 'Concentrado Proteico' },
            { key: 'min',  label: 'Minerais / Aditivos' }
        ];
        tipos.forEach(function (t) {
            opts_alim += '<optgroup label="' + t.label + '">';
            self.ALIMENTOS.filter(function (a) { return a.tipo === t.key; }).forEach(function (a) {
                opts_alim += '<option value="' + a.id + '">' + a.nome + ' (PB ' + a.PB + '%, NDT ' + a.NDT + '%)</option>';
            });
            opts_alim += '</optgroup>';
        });

        return '<div class="zt-form">'
            + '<h3>⚗️ Formulação de Ração</h3>'
            + '<div class="zt-row">'
            + '<div class="zt-field"><label>Categoria</label><select id="zf-cat">' + opts_cat + '</select></div>'
            + '<div class="zt-field"><label>Peso Vivo (kg)</label><input id="zf-pv" type="number" value="350" min="50" max="800"></div>'
            + '<div class="zt-field"><label>GMD desejado (kg/dia)</label><input id="zf-gmd" type="number" value="1.2" min="0" max="3" step="0.1"></div>'
            + '</div>'
            + '<div class="zt-separator">Adicionar ingrediente à fórmula</div>'
            + '<div class="zt-row">'
            + '<div class="zt-field" style="flex:2"><label>Ingrediente</label><select id="zf-alim-sel">' + opts_alim + '</select></div>'
            + '<div class="zt-field"><label>% na MS</label><input id="zf-alim-pct" type="number" value="40" min="0.1" max="100" step="0.5"></div>'
            + '<button class="zt-btn-sec" style="align-self:flex-end" onclick="window.nutricaoIA._adicionarIngrediente()">+ Adicionar</button>'
            + '</div>'
            + '<div id="zf-lista-ing" class="zt-lista-ing"></div>'
            + '<div class="zt-row" style="margin-top:8px;align-items:center">'
            + '<span id="zf-total-pct" style="font-size:13px;color:#64748B">Total: 0%</span>'
            + '<div style="flex:1"></div>'
            + '<button class="zt-btn-primary" onclick="window.nutricaoIA._formularUI()">Formular e Avaliar</button>'
            + '</div>'
            + '<div id="zf-result"></div>'
            + '<div class="zt-separator" style="margin-top:16px">Quadrado de Pearson (2 ingredientes)</div>'
            + '<div class="zt-row">'
            + '<div class="zt-field"><label>Ingrediente A</label><select id="zp-a">' + opts_alim + '</select></div>'
            + '<div class="zt-field"><label>Ingrediente B</label><select id="zp-b">' + opts_alim + '</select></div>'
            + '<div class="zt-field"><label>Meta PB (%)</label><input id="zp-meta" type="number" value="14" min="1" max="100" step="0.5"></div>'
            + '<button class="zt-btn-sec" style="align-self:flex-end" onclick="window.nutricaoIA._pearsonUI()">Calcular</button>'
            + '</div>'
            + '<div id="zp-result"></div>'
            + '</div>';
    },

    _formulaIngredientes: [],

    _bindFormulacao: function () {
        this._formulaIngredientes = [];
        this._renderListaIngredientes();
        // Pré-selecionar silagem + milho como padrão
        var sel = document.getElementById('zf-alim-sel');
        if (sel) sel.value = 'sil_milho';
    },

    _adicionarIngrediente: function () {
        var sel = document.getElementById('zf-alim-sel');
        var pctEl = document.getElementById('zf-alim-pct');
        if (!sel || !pctEl) return;
        var id = sel.value;
        var pct = parseFloat(pctEl.value) || 0;
        if (!id || pct <= 0) return;

        var existente = this._formulaIngredientes.findIndex(function (i) { return i.id === id; });
        if (existente >= 0) {
            this._formulaIngredientes[existente].pct = pct;
        } else {
            this._formulaIngredientes.push({ id: id, pct: pct, fixo: false });
        }
        this._renderListaIngredientes();
    },

    _removerIngrediente: function (idx) {
        this._formulaIngredientes.splice(idx, 1);
        this._renderListaIngredientes();
    },

    _renderListaIngredientes: function () {
        var lista = document.getElementById('zf-lista-ing');
        var totalEl = document.getElementById('zf-total-pct');
        if (!lista) return;

        var total = this._formulaIngredientes.reduce(function (s, i) { return s + i.pct; }, 0);
        if (totalEl) {
            totalEl.textContent = 'Total: ' + total.toFixed(1) + '%';
            totalEl.style.color = Math.abs(total - 100) < 1 ? '#16A34A' : (total > 100 ? '#DC2626' : '#CA8A04');
        }

        if (this._formulaIngredientes.length === 0) {
            lista.innerHTML = '<div style="color:#94A3B8;font-size:12px;padding:8px">Nenhum ingrediente adicionado.</div>';
            return;
        }

        var html = '';
        var self = this;
        this._formulaIngredientes.forEach(function (item, idx) {
            var alim = self.getAlimento(item.id);
            if (!alim) return;
            html += '<div class="zt-ing-item">'
                + '<div class="zt-ing-nome">' + alim.nome + '</div>'
                + '<div class="zt-ing-info">PB ' + alim.PB + '% | NDT ' + alim.NDT + '% | R$ ' + alim.preco.toFixed(2) + '/kg</div>'
                + '<div class="zt-ing-pct"><input type="number" value="' + item.pct + '" min="0.1" max="100" step="0.5" onchange="window.nutricaoIA._formulaIngredientes[' + idx + '].pct=parseFloat(this.value)||0; window.nutricaoIA._renderListaIngredientes();"></div>'
                + '<button class="zt-ing-del" onclick="window.nutricaoIA._removerIngrediente(' + idx + ')">✕</button>'
                + '</div>';
        });
        lista.innerHTML = html;
    },

    _formularUI: function () {
        var cat = document.getElementById('zf-cat').value;
        var pv  = document.getElementById('zf-pv').value;
        var gmd = document.getElementById('zf-gmd').value;
        var res = document.getElementById('zf-result');

        if (this._formulaIngredientes.length === 0) {
            if (res) res.innerHTML = '<div class="zt-alerta">⚠️ Adicione pelo menos um ingrediente.</div>';
            return;
        }

        var resultado = this.formularRacao(this._formulaIngredientes, cat, pv, gmd);
        if (resultado.erro) {
            if (res) res.innerHTML = '<div class="zt-alerta">' + resultado.erro + '</div>';
            return;
        }

        var e = resultado.exigencias;
        var c = resultado.composicao;
        var ck = resultado.check;

        var semaforo = function (ok) { return ok ? '🟢' : '🔴'; };
        var html = '<div class="zt-card" style="margin-top:12px">'
            + '<div class="zt-card-title">📊 Resultado da Formulação — ' + e.categoria + '</div>'
            + '<table class="zt-tabela">'
            + '<thead><tr><th>Nutriente</th><th>Dieta</th><th>Meta</th><th>Status</th></tr></thead>'
            + '<tbody>'
            + '<tr><td>PB (%MS)</td><td><strong>' + c.PB + '</strong></td><td>' + e.PB_min + '–' + e.PB_max + '</td><td>' + semaforo(ck.PB.ok) + '</td></tr>'
            + '<tr><td>NDT (%MS)</td><td><strong>' + c.NDT + '</strong></td><td>≥ ' + e.NDT_min + '</td><td>' + semaforo(ck.NDT.ok) + '</td></tr>'
            + '<tr><td>FDN (%MS)</td><td><strong>' + c.FDN + '</strong></td><td>≤ ' + e.FDN_max + '</td><td>' + semaforo(ck.FDN.ok) + '</td></tr>'
            + '<tr><td>EM (Mcal/kg)</td><td><strong>' + c.EM + '</strong></td><td>≥ ' + e.NE_diet + '</td><td>' + (c.EM >= e.NE_diet ? '🟢' : '🔴') + '</td></tr>'
            + '<tr><td>Ca (%MS)</td><td><strong>' + c.Ca + '</strong></td><td>≥ ' + e.Ca_min + '</td><td>' + semaforo(ck.Ca.ok) + '</td></tr>'
            + '<tr><td>P (%MS)</td><td><strong>' + c.P + '</strong></td><td>≥ ' + e.P_min + '</td><td>' + semaforo(ck.P.ok) + '</td></tr>'
            + '<tr><td>EE (%MS)</td><td><strong>' + c.EE + '</strong></td><td>≤ 6.5</td><td>' + (c.EE <= 6.5 ? '🟢' : '🔴') + '</td></tr>'
            + '</tbody>'
            + '</table>'
            + '<div class="zt-grid-3" style="margin-top:10px">'
            + '<div class="zt-stat"><span class="zt-stat-val">R$ ' + resultado.custo_kg_ms.toFixed(3) + '</span><span class="zt-stat-lab">Custo/kg MS</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">R$ ' + resultado.custo_dia.toFixed(2) + '</span><span class="zt-stat-lab">Custo/animal/dia</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">R$ ' + resultado.custo_arroba.toFixed(2) + '</span><span class="zt-stat-lab">Custo/arroba produzida</span></div>'
            + '</div>';

        if (resultado.alertas.length > 0) {
            html += '<div style="margin-top:10px">';
            resultado.alertas.forEach(function (a) {
                html += '<div class="zt-alerta-item">' + a + '</div>';
            });
            html += '</div>';
        }

        // Botão para levar para chat
        var perguntaBase = 'Formulei uma ração para ' + e.categoria + ' (' + pv + 'kg, GMD ' + gmd + 'kg/dia) com: ';
        this._formulaIngredientes.forEach(function (i) {
            var a = window.nutricaoIA.getAlimento(i.id);
            if (a) perguntaBase += a.nome + ' ' + i.pct + '%, ';
        });
        perguntaBase += '. PB=' + c.PB + '%, NDT=' + c.NDT + '%, FDN=' + c.FDN + '%. Custo R$' + resultado.custo_dia.toFixed(2) + '/animal/dia. Análise e sugestões?';
        perguntaBase = perguntaBase.replace(/, \.$/, '.');

        html += '<button class="zt-btn-sec" style="margin-top:10px" onclick="window.nutricaoIA._perguntarSobreFormula(' + JSON.stringify(perguntaBase).replace(/'/g, '&#39;') + ')">🤖 Analisar com ZootecIA</button>';
        html += '</div>';

        if (res) res.innerHTML = html;
    },

    _perguntarSobreFormula: function (pergunta) {
        this.abrirAba('chat');
        setTimeout(function () {
            var inp = document.getElementById('zt-chat-input');
            if (inp) { inp.value = pergunta; window.nutricaoIA._enviarChat(); }
        }, 100);
    },

    _pearsonUI: function () {
        var idA   = document.getElementById('zp-a').value;
        var idB   = document.getElementById('zp-b').value;
        var meta  = document.getElementById('zp-meta').value;
        var res   = document.getElementById('zp-result');

        if (!idA || !idB || idA === idB) {
            if (res) res.innerHTML = '<div class="zt-alerta">⚠️ Selecione dois ingredientes diferentes.</div>';
            return;
        }

        var r = this.pearsonSquare(idA, idB, meta);
        if (!r) { if (res) res.innerHTML = '<div class="zt-alerta">⚠️ Ingrediente não encontrado.</div>'; return; }
        if (r.erro) { if (res) res.innerHTML = '<div class="zt-alerta">⚠️ ' + r.erro + '</div>'; return; }

        if (res) res.innerHTML = '<div class="zt-card" style="margin-top:8px">'
            + '<div class="zt-card-title">🔲 Quadrado de Pearson — meta PB ' + r.metaPB + '%</div>'
            + '<div class="zt-grid-2">'
            + '<div class="zt-stat"><span class="zt-stat-val">' + r.alimento1.pct + '%</span><span class="zt-stat-lab">' + r.alimento1.nome + ' (PB ' + r.alimento1.PB + '%)</span></div>'
            + '<div class="zt-stat"><span class="zt-stat-val">' + r.alimento2.pct + '%</span><span class="zt-stat-lab">' + r.alimento2.nome + ' (PB ' + r.alimento2.PB + '%)</span></div>'
            + '</div>'
            + '<div class="zt-info">Composição resultante — PB: <strong>' + r.composicao.PB + '%</strong> | NDT: <strong>' + r.composicao.NDT + '%</strong> | EM: <strong>' + r.composicao.EM + ' Mcal/kg</strong> | Custo: <strong>R$ ' + r.custo_kg.toFixed(3) + '/kg</strong></div>'
            + '</div>';
    },

    // ── ABA ALIMENTOS ──
    _htmlAlimentos: function () {
        var self = this;
        var tipos = [
            { key:'vol',  label:'Volumosos',               emoji:'🌾' },
            { key:'cen',  label:'Concentrados Energéticos',emoji:'⚡' },
            { key:'cpro', label:'Concentrados Proteicos',   emoji:'💪' },
            { key:'min',  label:'Minerais / Aditivos',      emoji:'🔬' }
        ];

        var html = '<div style="padding:4px">'
            + '<input type="text" id="zt-busca-alim" placeholder="🔍 Buscar alimento..." '
            + 'style="width:100%;padding:8px;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:12px;box-sizing:border-box;font-size:13px"'
            + ' oninput="window.nutricaoIA._filtrarAlimentos(this.value)">'
            + '<div id="zt-lista-alimentos">';

        tipos.forEach(function (t) {
            var alims = self.ALIMENTOS.filter(function (a) { return a.tipo === t.key; });
            html += '<div class="zt-grupo"><div class="zt-grupo-title">' + t.emoji + ' ' + t.label + '</div>';
            alims.forEach(function (a) {
                html += '<div class="zt-alim-row" data-nome="' + a.nome.toLowerCase() + '">'
                    + '<div class="zt-alim-nome">' + a.nome + '</div>'
                    + '<div class="zt-alim-nums">'
                    + '<span title="Matéria Seca (%)">MS ' + a.MS + '%</span>'
                    + '<span title="Proteína Bruta (% MS)">PB ' + a.PB + '%</span>'
                    + '<span title="FDN (% MS)">FDN ' + a.FDN + '%</span>'
                    + '<span title="NDT (% MS)">NDT ' + a.NDT + '%</span>'
                    + '<span title="Energia Metabolizável (Mcal/kg MS)">EM ' + a.EM + '</span>'
                    + '<span title="Cálcio (% MS)">Ca ' + a.Ca + '%</span>'
                    + '<span title="Fósforo (% MS)">P ' + a.P + '%</span>'
                    + '<span title="Preço aproximado R$/kg" class="zt-preco">R$ ' + a.preco.toFixed(2) + '</span>'
                    + '</div>'
                    + (a.obs ? '<div class="zt-alim-obs">ℹ️ ' + a.obs + '</div>' : '')
                    + '</div>';
            });
            html += '</div>';
        });

        html += '</div></div>';
        return html;
    },

    _filtrarAlimentos: function (termo) {
        var rows = document.querySelectorAll('.zt-alim-row');
        var grupos = document.querySelectorAll('.zt-grupo');
        termo = (termo || '').toLowerCase();
        rows.forEach(function (r) {
            r.style.display = (!termo || r.dataset.nome.indexOf(termo) >= 0) ? '' : 'none';
        });
        grupos.forEach(function (g) {
            var visivel = Array.from(g.querySelectorAll('.zt-alim-row')).some(function (r) { return r.style.display !== 'none'; });
            g.style.display = visivel ? '' : 'none';
        });
    },

    // ── ABA CHAT ZOOTECIA ──
    _htmlChat: function () {
        return '<div class="zt-chat-wrap">'
            + '<div id="zt-chat-msgs" class="zt-chat-msgs"></div>'
            + '<div class="zt-chat-input-row">'
            + '<input id="zt-chat-input" class="zt-chat-input" placeholder="Pergunte sobre nutrição, ração, GMD, custo..." '
            + 'onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();window.nutricaoIA._enviarChat();}">'
            + '<button class="zt-btn-primary" onclick="window.nutricaoIA._enviarChat()">Enviar</button>'
            + '</div>'
            + '<div class="zt-chat-sugestoes">'
            + '<span onclick="window.nutricaoIA._usarSugestao(this)">Formular ração terminação 400kg</span>'
            + '<span onclick="window.nutricaoIA._usarSugestao(this)">Qual a exigência de PB para novilho 250kg?</span>'
            + '<span onclick="window.nutricaoIA._usarSugestao(this)">Cana + ureia: como formular?</span>'
            + '<span onclick="window.nutricaoIA._usarSugestao(this)">Calcular custo da arroba no confinamento</span>'
            + '</div>'
            + '</div>';
    },

    _bindChat: function () {},

    _usarSugestao: function (el) {
        var inp = document.getElementById('zt-chat-input');
        if (inp) { inp.value = el.textContent; this._enviarChat(); }
    },

    _enviarChat: function () {
        var inp = document.getElementById('zt-chat-input');
        if (!inp) return;
        var texto = inp.value.trim();
        if (!texto) return;
        inp.value = '';

        this.historico.push({ role: 'user', content: texto, ts: Date.now() });
        this._renderMensagens();

        var self = this;
        var digitandoEl = document.getElementById('zt-digitando');
        if (digitandoEl) digitandoEl.style.display = 'flex';

        this.consultar(texto,
            function (resposta) {
                self.historico.push({ role: 'model', content: resposta, ts: Date.now() });
                if (digitandoEl) digitandoEl.style.display = 'none';
                self._renderMensagens();
            },
            function (erro) {
                self.historico.push({ role: 'model', content: '⚠️ ' + erro, ts: Date.now() });
                if (digitandoEl) digitandoEl.style.display = 'none';
                self._renderMensagens();
            }
        );
    },

    _renderMensagens: function () {
        var container = document.getElementById('zt-chat-msgs');
        if (!container) return;

        if (this.historico.length === 0) {
            container.innerHTML = '<div class="zt-chat-welcome">'
                + '<div style="font-size:40px">🧬</div>'
                + '<div style="font-weight:600;font-size:16px;margin:8px 0">ZootecIA — Especialista em Nutrição Bovina</div>'
                + '<div style="color:#64748B;font-size:13px">Banco CQBAL 3.0 · NRC 2016 · Formulação de Ração · Custo/arroba</div>'
                + '</div>'
                + '<div id="zt-digitando" style="display:none;padding:12px;align-items:center;gap:8px">'
                + '<span style="font-size:13px;color:#64748B">ZootecIA analisando</span>'
                + '<span class="zt-dot"></span><span class="zt-dot"></span><span class="zt-dot"></span>'
                + '</div>';
            return;
        }

        var html = '';
        this.historico.forEach(function (m) {
            var isUser = m.role === 'user';
            var texto = (m.content || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            html += '<div class="zt-msg ' + (isUser ? 'zt-msg-user' : 'zt-msg-ia') + '">'
                + '<div class="zt-msg-bubble">' + texto + '</div>'
                + '</div>';
        });
        html += '<div id="zt-digitando" style="display:none;padding:12px;align-items:center;gap:8px">'
            + '<span style="font-size:13px;color:#64748B">ZootecIA analisando</span>'
            + '<span class="zt-dot"></span><span class="zt-dot"></span><span class="zt-dot"></span>'
            + '</div>';

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    },

    // ─────────────────────────────────────────────────────────────────
    // ESTILOS
    // ─────────────────────────────────────────────────────────────────
    _injetarEstilos: function () {
        if (document.getElementById('zt-styles')) return;
        var s = document.createElement('style');
        s.id = 'zt-styles';
        s.textContent = `
.zt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9100;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.zt-overlay{align-items:center}}
.zt-modal{background:#fff;width:100%;max-width:700px;max-height:92vh;border-radius:16px 16px 0 0;display:flex;flex-direction:column;overflow:hidden}
@media(min-width:600px){.zt-modal{border-radius:16px;max-height:88vh}}
.zt-header{display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #E2E8F0;background:#F0FDF4}
.zt-title{font-weight:700;font-size:16px;color:#15803D;flex:1}
.zt-close{background:none;border:none;font-size:20px;cursor:pointer;color:#64748B;padding:0 4px}
.zt-tabs{display:flex;border-bottom:1px solid #E2E8F0;background:#F8FAFC;overflow-x:auto}
.zt-tab{flex:1;min-width:80px;padding:10px 4px;border:none;background:none;font-size:12px;font-weight:600;color:#64748B;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
.zt-tab.ativa{color:#15803D;border-bottom-color:#15803D;background:#fff}
.zt-body{flex:1;overflow-y:auto;padding:0}
.zt-form{padding:14px}
.zt-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.zt-field{flex:1;min-width:120px;display:flex;flex-direction:column;gap:4px}
.zt-field label{font-size:12px;font-weight:600;color:#374151}
.zt-field input,.zt-field select{padding:7px 10px;border:1px solid #E2E8F0;border-radius:8px;font-size:13px;width:100%;box-sizing:border-box}
.zt-btn-primary{background:#15803D;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer}
.zt-btn-primary:hover{background:#166534}
.zt-btn-sec{background:#F0FDF4;color:#15803D;border:1px solid #86EFAC;padding:8px 14px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer}
.zt-separator{font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 4px;border-top:1px solid #E2E8F0;margin-top:4px}
.zt-card{background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:12px;margin-top:10px}
.zt-card-title{font-weight:700;font-size:14px;color:#15803D;margin-bottom:10px}
.zt-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.zt-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.zt-stat{background:#fff;border-radius:8px;padding:8px;text-align:center;border:1px solid #D1FAE5}
.zt-stat-val{display:block;font-size:16px;font-weight:700;color:#15803D}
.zt-stat-lab{display:block;font-size:10px;color:#6B7280;margin-top:2px}
.zt-info{font-size:12px;color:#374151;padding:8px;background:#fff;border-radius:6px;margin-top:8px}
.zt-alerta{background:#FEF2F2;border:1px solid #FCA5A5;color:#991B1B;padding:10px;border-radius:8px;font-size:13px;margin-top:8px}
.zt-alerta-item{font-size:12px;padding:4px 0;border-bottom:1px solid #D1FAE5}
.zt-tabela{width:100%;border-collapse:collapse;font-size:12px}
.zt-tabela th{background:#DCFCE7;padding:6px 8px;text-align:left;font-weight:600}
.zt-tabela td{padding:5px 8px;border-bottom:1px solid #E2E8F0}
.zt-lista-ing{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.zt-ing-item{display:flex;align-items:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:6px 10px;gap:8px}
.zt-ing-nome{flex:2;font-size:13px;font-weight:600}
.zt-ing-info{flex:3;font-size:11px;color:#64748B}
.zt-ing-pct input{width:64px;padding:4px;border:1px solid #E2E8F0;border-radius:6px;font-size:13px;text-align:center}
.zt-ing-del{background:none;border:none;color:#EF4444;cursor:pointer;font-size:16px;padding:0 4px}
.zt-grupo{margin-bottom:12px}
.zt-grupo-title{font-weight:700;font-size:13px;color:#15803D;padding:6px 0;border-bottom:2px solid #DCFCE7;margin-bottom:4px}
.zt-alim-row{padding:6px 4px;border-bottom:1px solid #F1F5F9}
.zt-alim-nome{font-weight:600;font-size:13px;color:#1E293B;margin-bottom:3px}
.zt-alim-nums{display:flex;flex-wrap:wrap;gap:6px}
.zt-alim-nums span{font-size:11px;background:#F1F5F9;padding:2px 6px;border-radius:4px;color:#374151}
.zt-preco{background:#FEF3C7!important;color:#92400E!important;font-weight:600}
.zt-alim-obs{font-size:11px;color:#64748B;padding-top:3px;font-style:italic}
.zt-chat-wrap{display:flex;flex-direction:column;height:100%;min-height:400px}
.zt-chat-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.zt-chat-welcome{text-align:center;padding:30px 16px;color:#374151}
.zt-msg{display:flex}
.zt-msg-user{justify-content:flex-end}
.zt-msg-ia{justify-content:flex-start}
.zt-msg-bubble{max-width:85%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.5}
.zt-msg-user .zt-msg-bubble{background:#15803D;color:#fff;border-radius:12px 12px 2px 12px}
.zt-msg-ia .zt-msg-bubble{background:#F0FDF4;border:1px solid #DCFCE7;color:#1E293B;border-radius:12px 12px 12px 2px}
.zt-chat-input-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #E2E8F0;background:#fff}
.zt-chat-input{flex:1;padding:9px 12px;border:1px solid #E2E8F0;border-radius:20px;font-size:13px;outline:none}
.zt-chat-input:focus{border-color:#15803D}
.zt-chat-sugestoes{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px;background:#fff}
.zt-chat-sugestoes span{font-size:11px;padding:4px 10px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;cursor:pointer;color:#15803D}
.zt-chat-sugestoes span:hover{background:#DCFCE7}
.zt-dot{width:8px;height:8px;border-radius:50%;background:#15803D;animation:zt-blink 1.2s infinite}
.zt-dot:nth-child(2){animation-delay:.3s}
.zt-dot:nth-child(3){animation-delay:.6s}
@keyframes zt-blink{0%,100%{opacity:.2}50%{opacity:1}}
        `;
        document.head.appendChild(s);
    }
};
