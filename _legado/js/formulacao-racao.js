/**
 * formulacao-racao.js — Formulador Avançado de Rações Bovinas
 * Base científica: CQBAL 3.0, BR-CORTE 2023, NRC/NASEM 2016
 * Otimização: Programação Linear (Simplex Big-M em JS puro)
 * AgroMacro © 2026
 */
(function () {
  'use strict';

  window.formulacaoRacao = {

    // ================================================================
    // 1. BANCO DE INGREDIENTES — CQBAL 3.0 / BR-CORTE 2023
    //    ms=% MS | pb,fdn,fda,ndt,ee,ca,p em % da MS | em=Mcal EM/kg MS
    //    pdr=% PDR do PB | gossipol=ppm | preco=R$/ton MS (2024-25)
    //    minInc/maxInc = limites de inclusão % na dieta final (base MS)
    // ================================================================
    ING: [
      // ── VOLUMOSOS ──────────────────────────────────────────────────
      { id: 'sil_milho',   nome: 'Silagem de Milho',       grupo: 'volumoso',
        ms: 35,  pb: 8,   fdn: 45,  fda: 25,  ndt: 72,  em: 2.55, ee: 3.0,  ca: 0.27, p: 0.22, pdr: 55, gossipol: 0,
        minInc: 0, maxInc: 70, preco: 250,
        obs: 'Padrão confinamento. Colher 35-40% MS (testículo = 1/2 linha leitosa).' },
      { id: 'sil_sorgo',   nome: 'Silagem de Sorgo',       grupo: 'volumoso',
        ms: 31,  pb: 7,   fdn: 56,  fda: 32,  ndt: 65,  em: 2.34, ee: 2.5,  ca: 0.35, p: 0.20, pdr: 55, gossipol: 0,
        minInc: 0, maxInc: 70, preco: 200,
        obs: '~10% menos valor nutricional que silagem de milho. Boa para regiões semiáridas.' },
      { id: 'cana',        nome: 'Cana-de-Açúcar Triturada', grupo: 'volumoso',
        ms: 23,  pb: 4,   fdn: 54,  fda: 34,  ndt: 61,  em: 2.20, ee: 1.0,  ca: 0.35, p: 0.12, pdr: 60, gossipol: 0,
        minInc: 0, maxInc: 60, preco: 80,
        obs: 'Cortar e fornecer fresca (máx 72h). Complementar P. Açúcar máx 40% na mistura.' },
      { id: 'sil_capim',   nome: 'Silagem de Capim',        grupo: 'volumoso',
        ms: 22,  pb: 9,   fdn: 66,  fda: 40,  ndt: 59,  em: 2.14, ee: 2.0,  ca: 0.40, p: 0.25, pdr: 60, gossipol: 0,
        minInc: 0, maxInc: 60, preco: 180,
        obs: 'Qualidade varia muito. Napier colhido entre 40-50 dias. FDN alto limita CMS.' },
      { id: 'bagaco_cana', nome: 'Bagaço de Cana in Natura', grupo: 'volumoso',
        ms: 45,  pb: 2.5, fdn: 77,  fda: 52,  ndt: 44,  em: 1.58, ee: 0.5,  ca: 0.22, p: 0.12, pdr: 50, gossipol: 0,
        minInc: 0, maxInc: 25, preco: 50,
        obs: 'Apenas enchimento/fibra efetiva. Máx 20% da dieta. Dilui NDT. Complementar com energia.' },
      { id: 'cana_hidrol', nome: 'Cana Hidrolisada (NaOH)',  grupo: 'volumoso',
        ms: 35,  pb: 4,   fdn: 65,  fda: 41,  ndt: 55,  em: 1.98, ee: 0.8,  ca: 0.30, p: 0.12, pdr: 55, gossipol: 0,
        minInc: 0, maxInc: 40, preco: 100,
        obs: 'Tratamento com 4% NaOH. Melhora digestibilidade da parede celular. Aguardar 7 dias.' },
      { id: 'palha_arroz', nome: 'Palha de Arroz',           grupo: 'volumoso',
        ms: 89,  pb: 4,   fdn: 76,  fda: 56,  ndt: 41,  em: 1.50, ee: 1.0,  ca: 0.20, p: 0.10, pdr: 45, gossipol: 0,
        minInc: 0, maxInc: 20, preco: 120,
        obs: 'Valor nutritivo muito baixo. Só como fonte de fibra em situações emergenciais. Máx 15%.' },
      { id: 'napier_fresco',nome:'Capim Napier Fresco',      grupo: 'volumoso',
        ms: 18,  pb: 11,  fdn: 67,  fda: 38,  ndt: 58,  em: 2.10, ee: 1.5,  ca: 0.40, p: 0.25, pdr: 62, gossipol: 0,
        minInc: 0, maxInc: 60, preco: 90,
        obs: 'Cortar entre 45-60 dias. Alta umidade. Verificar FDN no consumo (1,2% PV máx).' },

      // ── CONCENTRADOS ENERGÉTICOS ────────────────────────────────────
      { id: 'milho',       nome: 'Milho Grão Moído',         grupo: 'conc_energetico',
        ms: 88,  pb: 9,   fdn: 12,  fda: 4,   ndt: 88,  em: 3.15, ee: 3.8,  ca: 0.03, p: 0.27, pdr: 52, gossipol: 0,
        minInc: 0, maxInc: 80, preco: 700,
        obs: 'Referência energética. Moagem grossa a média (peneira 4-6 mm) para ruminantes.' },
      { id: 'sorgo_grao',  nome: 'Sorgo Grão Moído',          grupo: 'conc_energetico',
        ms: 88,  pb: 10,  fdn: 12,  fda: 6,   ndt: 85,  em: 3.06, ee: 2.8,  ca: 0.04, p: 0.30, pdr: 50, gossipol: 0,
        minInc: 0, maxInc: 80, preco: 600,
        obs: '90-95% valor energético do milho. Tanino reduz digestibilidade: preferir cultivares low-tannin.' },
      { id: 'f_trigo',     nome: 'Farelo de Trigo',            grupo: 'conc_energetico',
        ms: 88,  pb: 16,  fdn: 45,  fda: 12,  ndt: 79,  em: 2.84, ee: 3.5,  ca: 0.12, p: 1.00, pdr: 75, gossipol: 0,
        minInc: 0, maxInc: 30, preco: 450,
        obs: 'Alto P e FDN. Útil em dietas com baixo P. Máx 30% pelo alto FDN.' },
      { id: 'f_arroz',     nome: 'Farelo de Arroz Integral',   grupo: 'conc_energetico',
        ms: 90,  pb: 14,  fdn: 27,  fda: 10,  ndt: 72,  em: 2.57, ee: 16.0, ca: 0.09, p: 1.50, pdr: 70, gossipol: 0,
        minInc: 0, maxInc: 15, preco: 380,
        obs: 'EE ALTO (14-18%): limita inclusão a 10-15%. Rancificação rápida. Alto P.' },
      { id: 'melaco',      nome: 'Melaço de Cana',              grupo: 'conc_energetico',
        ms: 75,  pb: 6,   fdn: 0,   fda: 0,   ndt: 76,  em: 2.74, ee: 0.1,  ca: 0.80, p: 0.12, pdr: 90, gossipol: 0,
        minInc: 0, maxInc: 10, preco: 350,
        obs: 'Palatabilidade e aglutinante. Máx 5-8%. Líquido: dificulta mistura. Previne poeira.' },
      { id: 'polpa_citrica',nome:'Polpa Cítrica Pelet.',        grupo: 'conc_energetico',
        ms: 88,  pb: 7,   fdn: 24,  fda: 23,  ndt: 77,  em: 2.77, ee: 2.5,  ca: 1.80, p: 0.11, pdr: 65, gossipol: 0,
        minInc: 0, maxInc: 30, preco: 700,
        obs: 'FDN digestível. Alto Ca (cuidado com relação Ca:P). Pectina promove saúde ruminal.' },
      { id: 'casca_soja',  nome: 'Casca de Soja',               grupo: 'conc_energetico',
        ms: 89,  pb: 14,  fdn: 62,  fda: 45,  ndt: 78,  em: 2.81, ee: 2.5,  ca: 0.50, p: 0.18, pdr: 70, gossipol: 0,
        minInc: 0, maxInc: 35, preco: 480,
        obs: 'FDN altamente digestível. Boa fibra efetiva. Não limita CMS como FDN forrageiro.' },
      { id: 'gluten_22',   nome: 'Glúten de Milho 22%',         grupo: 'conc_energetico',
        ms: 88,  pb: 22,  fdn: 40,  fda: 12,  ndt: 80,  em: 2.88, ee: 2.5,  ca: 0.07, p: 0.35, pdr: 45, gossipol: 0,
        minInc: 0, maxInc: 30, preco: 500,
        obs: 'Subproduto da moagem úmida de milho. Boa relação energia+proteína bypass.' },
      { id: 'gluten_60',   nome: 'Glúten de Milho 60% (CGM)',   grupo: 'conc_energetico',
        ms: 89,  pb: 62,  fdn: 5,   fda: 2,   ndt: 85,  em: 3.06, ee: 2.5,  ca: 0.05, p: 0.45, pdr: 30, gossipol: 0,
        minInc: 0, maxInc: 15, preco: 1600,
        obs: 'Alta proteína bypass (PNDR 70%). Costoso. Útil em vacas lactantes e pós-parto.' },

      // ── CONCENTRADOS PROTEICOS ──────────────────────────────────────
      { id: 'f_soja',      nome: 'Farelo de Soja 46%',          grupo: 'conc_proteico',
        ms: 88,  pb: 46,  fdn: 12,  fda: 8,   ndt: 76,  em: 2.74, ee: 2.0,  ca: 0.30, p: 0.65, pdr: 65, gossipol: 0,
        minInc: 0, maxInc: 40, preco: 2000,
        obs: 'Referência proteica. Alta digestibilidade. PDR 65%. Balancear com PNDR para terminação.' },
      { id: 'f_algodao',   nome: 'Farelo de Algodão 38%',        grupo: 'conc_proteico',
        ms: 89,  pb: 39,  fdn: 32,  fda: 24,  ndt: 71,  em: 2.55, ee: 3.5,  ca: 0.18, p: 1.00, pdr: 42, gossipol: 800,
        minInc: 0, maxInc: 30, preco: 1200,
        obs: 'Gossipol: checar teor (máx 1.200 ppm em novilhos, 500 ppm em novilhas). PNDR alto (58%).' },
      { id: 'caroco_algodao', nome:'Caroço de Algodão',          grupo: 'conc_proteico',
        ms: 91,  pb: 24,  fdn: 47,  fda: 36,  ndt: 85,  em: 3.06, ee: 20.0, ca: 0.17, p: 0.60, pdr: 40, gossipol: 600,
        minInc: 0, maxInc: 15, preco: 900,
        obs: 'EE 18-22%! Máx 10-15%. Cuidado gossipol em novilhas. Alta energia + proteína bypass.' },
      { id: 'f_girassol',  nome: 'Farelo de Girassol',           grupo: 'conc_proteico',
        ms: 89,  pb: 32,  fdn: 38,  fda: 31,  ndt: 64,  em: 2.31, ee: 2.5,  ca: 0.35, p: 0.85, pdr: 60, gossipol: 0,
        minInc: 0, maxInc: 25, preco: 900,
        obs: 'Boa fonte de Met+Cys. Alto FDN/FDA. Substituto parcial do farelo de soja.' },
      { id: 'levedura_cerv',nome:'Levedura Seca Cervejaria',     grupo: 'conc_proteico',
        ms: 92,  pb: 45,  fdn: 6,   fda: 4,   ndt: 76,  em: 2.74, ee: 1.0,  ca: 0.30, p: 1.40, pdr: 70, gossipol: 0,
        minInc: 0, maxInc: 20, preco: 1100,
        obs: 'Rico em B-vitaminas. Alta palatabilidade. Alta PDR: combinar com fonte de PNDR.' },
      { id: 'ddg_milho',   nome: 'DDG de Milho (DDGS)',           grupo: 'conc_proteico',
        ms: 90,  pb: 29,  fdn: 36,  fda: 15,  ndt: 82,  em: 2.95, ee: 10.5, ca: 0.08, p: 0.65, pdr: 45, gossipol: 0,
        minInc: 0, maxInc: 20, preco: 900,
        obs: 'EE alto (8-12%): máx 15-20% na dieta. PNDR 55%. Boa relação custo-benefício.' },
      { id: 'f_peixe',     nome: 'Farinha de Peixe 60%',          grupo: 'conc_proteico',
        ms: 90,  pb: 63,  fdn: 0,   fda: 0,   ndt: 74,  em: 2.67, ee: 9.0,  ca: 4.50, p: 2.80, pdr: 26, gossipol: 0,
        minInc: 0, maxInc: 5,  preco: 3500,
        obs: 'PNDR 74%! Costosa. Máx 3-5%. Alto Ca e P. Restrita em alguns sistemas (traçabilidade).' },

      // ── SUBPRODUTOS / OUTROS ───────────────────────────────────────
      { id: 'bagaco_palmiste', nome:'Bagaço de Palmiste',        grupo: 'subproduto',
        ms: 90,  pb: 16,  fdn: 70,  fda: 55,  ndt: 56,  em: 2.02, ee: 7.5,  ca: 0.30, p: 0.65, pdr: 60, gossipol: 0,
        minInc: 0, maxInc: 20, preco: 450,
        obs: 'Subproduto extração óleo de palmiste. Alto FDN. Região Norte/Nordeste.' },
      { id: 'polpa_beterraba', nome:'Polpa de Beterraba Pelet.', grupo: 'subproduto',
        ms: 88,  pb: 9,   fdn: 26,  fda: 22,  ndt: 75,  em: 2.70, ee: 1.0,  ca: 0.65, p: 0.10, pdr: 65, gossipol: 0,
        minInc: 0, maxInc: 20, preco: 800,
        obs: 'FDN pectina (altamente digestível). Importada. Saúde ruminal. Baixo P.' },

      // ── MINERAIS / ADITIVOS ────────────────────────────────────────
      { id: 'ureia',       nome: 'Ureia Pecuária (46% N)',        grupo: 'aditivo',
        ms: 98,  pb: 281, fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 100, gossipol: 0,
        minInc: 0, maxInc: 1.0, preco: 2200,
        obs: 'LIMITE: 1% da MS total da dieta (max 200g/cab/dia). Mistura 9:1 com sulfato de amônio.' },
      { id: 'amireia_150', nome: 'Amiréia 150S',                   grupo: 'aditivo',
        ms: 88,  pb: 150, fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 100, gossipol: 0,
        minInc: 0, maxInc: 2.0, preco: 1800,
        obs: 'Ureia extrusada com amido. Liberação lenta: menor risco intoxicação. Máx 1,5% MS dieta.' },
      { id: 'sulf_amonio', nome: 'Sulfato de Amônio',              grupo: 'aditivo',
        ms: 99,  pb: 132, fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 100, gossipol: 0,
        minInc: 0, maxInc: 0.2, preco: 1800,
        obs: 'Fonte de S para síntese de aminoácidos no rúmen. Usar na relação 9:1 com ureia.' },
      { id: 'calcario',    nome: 'Calcário Calcítico',             grupo: 'mineral',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 38.0, p: 0,    pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 3.0, preco: 150,
        obs: 'Corrigir Ca. Relação Ca:P ideal 1,5:1 a 2,5:1. Granulometria fina para melhor absorção.' },
      { id: 'fosfato_bic', nome: 'Fosfato Bicálcico',               grupo: 'mineral',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 22.0, p: 18.0, pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 3.0, preco: 2500,
        obs: 'Fonte simultânea Ca + P. Usar quando deficiente em ambos.' },
      { id: 'sal_comum',   nome: 'Sal Comum (NaCl)',                grupo: 'mineral',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 5.0, preco: 400,
        obs: 'Controla consumo de suplementos. 0,5-1,0% MS. Na exigência: 0,08% MS.' },
      { id: 'bic_sodio',   nome: 'Bicarbonato de Sódio',            grupo: 'mineral',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 1.5, preco: 3500,
        obs: 'Tamponamento ruminal. 0,75-1,5% MS em dietas alto-grão ou cana. Previne acidose.' },
      { id: 'premix_min',  nome: 'Pré-Mistura Mineral/Vit.',        grupo: 'mineral',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 3.0,  p: 1.5,  pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 2.0, preco: 8000,
        obs: 'Fornece microminerais + vitaminas. Dosagem conforme fabricante (ex: 30g/kg ração).' },
      { id: 'monensina',   nome: 'Monensina (premix 20%)',           grupo: 'aditivo',
        ms: 99,  pb: 0,   fdn: 0,   fda: 0,   ndt: 0,   em: 0,    ee: 0,    ca: 0,    p: 0,    pdr: 0, gossipol: 0,
        minInc: 0, maxInc: 0.1, preco: 15000,
        obs: 'Ionóforo: melhora 10-15% eficiência. Dose: 200-300 mg/cab/dia. Registrada MAPA bovinos.' },
    ],

    // ================================================================
    // 2. CATEGORIAS ANIMAIS — BR-CORTE 2023 / NRC 2016 (Zebuínos)
    // ================================================================
    CAT: {
      bezerro_desmama:    { nome: 'Bezerro Desmamado', pv: 180, gmd: 0.60, fase: 'cria',       sistema: 'pastejo' },
      recria_novilho:     { nome: 'Novilho Recria',    pv: 300, gmd: 0.80, fase: 'recria',     sistema: 'pastejo' },
      terminacao_conf:    { nome: 'Terminação Conf.',  pv: 400, gmd: 1.20, fase: 'terminacao', sistema: 'confinamento' },
      terminacao_semi:    { nome: 'Terminação Semi',   pv: 380, gmd: 1.00, fase: 'terminacao', sistema: 'semiconfinamento' },
      vaca_seca:          { nome: 'Vaca Seca',         pv: 450, gmd: 0,    fase: 'reproducao', sistema: 'pastejo' },
      vaca_gestante:      { nome: 'Vaca Gestante (3°tri)', pv: 480, gmd: 0, fase: 'gestacao', sistema: 'pastejo' },
      vaca_lactante:      { nome: 'Vaca Lactante',     pv: 450, gmd: 0,    fase: 'lactacao',   sistema: 'pastejo' },
      novilha_recria:     { nome: 'Novilha Sobreano',  pv: 300, gmd: 0.60, fase: 'recria',     sistema: 'pastejo' },
      touro:              { nome: 'Touro Reprodutor',  pv: 600, gmd: 0,    fase: 'reproducao', sistema: 'pastejo' },
    },

    // ================================================================
    // 3. RECEITAS PRONTAS EMBRAPA / Campo
    // ================================================================
    RECEITAS: [
      {
        id: 'sal_proteico_seca',
        nome: '🧂 Sal Proteico — Seca (mantença)',
        descricao: 'SPM Embrapa CNPGC para período seco. Mantença a +150 g/dia GMD em pastejo degradado.',
        tipo: 'sal_proteico', consumo_g: 300, sistema: 'pastejo',
        ingredientes: [ {id:'f_soja', pct:60}, {id:'ureia', pct:9}, {id:'sulf_amonio', pct:1}, {id:'premix_min', pct:10}, {id:'sal_comum', pct:20} ],
        obs: 'Consumo alvo: 200-400 g/dia. Ajustar sal para regular consumo.'
      },
      {
        id: 'spe_seca_recria',
        nome: '⚗️ SPE Seca — Recria 1ª Seca',
        descricao: 'Mistura múltipla Embrapa para recria na seca. GMD ~400 g/dia.',
        tipo: 'spe', consumo_g: 500, sistema: 'pastejo',
        ingredientes: [ {id:'milho', pct:60}, {id:'f_soja', pct:31}, {id:'ureia', pct:4}, {id:'sulf_amonio', pct:0.4}, {id:'premix_min', pct:2.7}, {id:'calcario', pct:1.9} ],
        obs: 'Consumo 0,3-0,8% PV/dia. Fornecer em cochos cobertos.'
      },
      {
        id: 'spe_aguas_engorda',
        nome: '🌧️ SPE Águas — Engorda Semiconfinamento',
        descricao: 'Concentrado para semiconfinamento no período chuvoso. GMD 700-900 g/dia.',
        tipo: 'spe', consumo_g: 1500, sistema: 'semiconfinamento',
        ingredientes: [ {id:'milho', pct:75.7}, {id:'f_algodao', pct:15.1}, {id:'ureia', pct:3.2}, {id:'sulf_amonio', pct:0.3}, {id:'premix_min', pct:3.2}, {id:'calcario', pct:2.5} ],
        obs: 'Fornecer 1,5-2,5 kg/cab/dia. Adaptar em 14 dias por causa da ureia.'
      },
      {
        id: 'conc_terminacao_50_50',
        nome: '🐄 Concentrado Terminação (RTM 50:50)',
        descricao: 'Concentrado para RTM 50% volumoso / 50% concentrado. Terminação 400-500 kg.',
        tipo: 'concentrado_rtm', consumo_g: 4500, sistema: 'confinamento',
        ingredientes: [ {id:'milho', pct:70}, {id:'f_soja', pct:20}, {id:'ureia', pct:1.5}, {id:'sulf_amonio', pct:0.2}, {id:'premix_min', pct:3}, {id:'calcario', pct:3.5}, {id:'bic_sodio', pct:1.3}, {id:'monensina', pct:0.1} ],
        obs: 'RTM final: 50% silagem milho + 50% este concentrado. PB ~13%, NDT ~78%.'
      },
      {
        id: 'conc_alto_grao',
        nome: '🌽 Concentrado Alto Grão (80% milho)',
        descricao: 'Ração de alto desempenho para terminação de novilhos confinados. GMD 1,4-1,8 kg/dia.',
        tipo: 'concentrado_rtm', consumo_g: 8000, sistema: 'confinamento',
        ingredientes: [ {id:'milho', pct:80}, {id:'f_soja', pct:11}, {id:'casca_soja', pct:4}, {id:'ureia', pct:0.8}, {id:'sulf_amonio', pct:0.1}, {id:'premix_min', pct:2}, {id:'calcario', pct:1.6}, {id:'bic_sodio', pct:0.4}, {id:'monensina', pct:0.1} ],
        obs: 'Adaptação 21 dias obrigatória. pH ruminal: monitorar acidose subclínica.'
      },
      {
        id: 'creep_feeding',
        nome: '🐣 Creep Feeding — Bezerros',
        descricao: 'Suplemento sólido para bezerros a partir de 30 dias. Meta: desmama 200+ kg.',
        tipo: 'concentrado_rtm', consumo_g: 1000, sistema: 'pastejo',
        ingredientes: [ {id:'milho', pct:70}, {id:'f_soja', pct:27}, {id:'premix_min', pct:3} ],
        obs: 'Fornecer à vontade em cocho exclusivo para bezerros. PB 20%, NDT 82%.'
      },
      {
        id: 'vaca_gestante_min',
        nome: '🤰 Suplemento Vaca Gestante (3° trimestre)',
        descricao: 'Complementação proteico-mineral para vacas no terço final de gestação.',
        tipo: 'sal_proteico', consumo_g: 400, sistema: 'pastejo',
        ingredientes: [ {id:'f_soja', pct:45}, {id:'milho', pct:30}, {id:'premix_min', pct:15}, {id:'fosfato_bic', pct:5}, {id:'sal_comum', pct:5} ],
        obs: 'Manter escore corporal 3,0-3,5. Crítico para colostro e bezerro ao nascer.'
      },
      {
        id: 'spe_algodao_ne',
        nome: '🌿 SPE com Algodão (Nordeste/Cerrado)',
        descricao: 'Mistura regional com subprodutos do algodão para seca no Nordeste.',
        tipo: 'spe', consumo_g: 600, sistema: 'pastejo',
        ingredientes: [ {id:'milho', pct:45}, {id:'f_algodao', pct:30}, {id:'ureia', pct:5}, {id:'sulf_amonio', pct:0.5}, {id:'premix_min', pct:8}, {id:'sal_comum', pct:11.5} ],
        obs: 'Verificar gossipol no farelo de algodão antes de usar. Adaptar ureia em 14 dias.'
      },
      {
        id: 'semi_cana_concentrado',
        nome: '🎋 Semi conf. Cana + Concentrado',
        descricao: 'Sistema semiconfinamento cana picada à vontade + concentrado. GMD 900-1100 g/dia.',
        tipo: 'spe', consumo_g: 3000, sistema: 'semiconfinamento',
        ingredientes: [ {id:'milho', pct:77}, {id:'f_soja', pct:15}, {id:'ureia', pct:2}, {id:'sulf_amonio', pct:0.2}, {id:'premix_min', pct:3}, {id:'calcario', pct:2.8} ],
        obs: 'Volumoso: cana picada à vontade (cortar diariamente). Concentrado: 0,8-1,0% PV.'
      },
      {
        id: 'rtm_sorgo_proteico',
        nome: '🌾 RTM Sorgo — Terminação Econômica',
        descricao: 'RTM econômica com silagem de sorgo + farelo algodão. Para regiões produtoras.',
        tipo: 'concentrado_rtm', consumo_g: 4000, sistema: 'confinamento',
        ingredientes: [ {id:'sorgo_grao', pct:65}, {id:'f_algodao', pct:22}, {id:'polpa_citrica', pct:5}, {id:'ureia', pct:1}, {id:'premix_min', pct:3}, {id:'calcario', pct:3.5}, {id:'bic_sodio', pct:0.5} ],
        obs: 'RTM: 55% silagem sorgo + 45% este concentrado. Verificar gossipol do algodão.'
      },
    ],

    // ================================================================
    // 4. LIMITES DE SEGURANÇA (regulatory + nutritional)
    // ================================================================
    LIMITES: {
      ureia: { maxDietaMS: 1.0, maxDiarioG: 200, adaptacaoDias: 21 },
      amireia: { maxDietaMS: 1.5, maxDiarioG: 300, adaptacaoDias: 14 },
      ee_total: { maxDietaMS: 7.0 },  // EE > 7% deprime digestão FDN
      fdn_min: { minDietaMS: 22.0, minPFDN: 19.0 }, // FDN efetivo mínimo
      fdn_max_pv: 1.2,   // % PV como máx de consumo de FDN
      gossipol: {         // ppm gossipol livre
        novilho_maior4m: 400, novilho_menor4m: 200,
        novilha: 500, vaca: 600, touro: 600
      },
      relCaP: { min: 1.5, max: 3.0 },
    },

    // ================================================================
    // 5. CÁLCULO DE EXIGÊNCIAS — BR-CORTE 2023 (Nellore/Zebu)
    // ================================================================
    calcExigencias: function (pv, gmd, sistema, tipoRaca) {
      // tipoRaca: 'zebu' | 'taurus' | 'cruzado'
      var fatorRaca = tipoRaca === 'taurus' ? 1.10 : tipoRaca === 'cruzado' ? 1.05 : 1.00;
      var pve = pv * 0.96; // peso vazio estimado

      // NEm exigida — BR-CORTE 2023 (Mcal/dia)
      // Zebu = 10% menor mantença que taurus (NRC corrigido)
      var nem = 0.314 * Math.pow(pve, 0.75) * fatorRaca;

      // NEg exigida (Mcal/dia)
      var neg = gmd > 0 ? 0.052 * Math.pow(pve, 0.75) * Math.pow(gmd, 1.062) : 0;

      // CMS (kg MS/dia) — equação BR-CORTE Nellore confinamento
      var cms;
      if (sistema === 'confinamento') {
        cms = -2.40011 + 0.02006 * pv + 4.81946 * gmd - 1.51758 * gmd * gmd;
        cms = Math.max(cms, pv * 0.018); // mínimo 1,8% PV
      } else {
        // Pastejo: 1,8-2,2% PV (menor que confinamento)
        cms = pv * (0.019 + gmd * 0.003);
        cms = Math.min(cms, pv * 0.022);
      }

      // Densidade energética necessária
      var nemd_needed = (nem + neg) / cms;
      // Converter NEm → NDT aproximação
      // NDT% ≈ (NEm/0.82 + 1.12) / (1.37 - 0.138*(NEm/0.82)) — iterativo; usar tabela
      var ndt_needed = (nemd_needed + 0.58) / 0.028; // aprox linear
      ndt_needed = Math.min(Math.max(ndt_needed, 55), 85);

      // PB exigida (g/dia) — proteína metabolizável → PB bruta
      // PM = 6.25 * [proteína microbiana + PNDR absolvida - perdas]
      // Simplificação prática (BR-CORTE):
      var pb_g = (40 + 0.32 * pv + 268 * gmd) * (1 / fatorRaca);
      pb_g = Math.max(pb_g, pv * 1.1); // mínimo 1.1 g PB/kg PV

      // Minerais (g/dia) — BR-CORTE 2023
      var ca = (pv * 0.060 + gmd * 15.0) * fatorRaca;
      var p  = (pv * 0.030 + gmd * 8.0) * fatorRaca;
      var mg = pv * 0.020 + gmd * 3.0;
      var s  = cms * 2.0; // S: 0,20% MS
      var cu = pv * 0.15 + gmd * 10;  // mg/dia
      var zn = pv * 0.60 + gmd * 40;  // mg/dia
      var se = cms * 0.30;             // mg/dia (0,30 mg/kg MS)

      // Relação PDR/CMS e PNDR
      var pdr_g = cms * 65;    // PDR: ~6,5% MS para síntese microbiana ótima
      var pndr_g = Math.max(0, pb_g - pdr_g);

      // FDN mínimo
      var fdn_min_kg = 0.22 * cms; // 22% MS mínimo para saúde ruminal
      var fdn_max_kg = pv * 0.012; // 1,2% PV máx de FDN (limite físico)

      return {
        cms, nem, neg, ndt_needed, pb_g, ca, p, mg, s, cu, zn, se,
        pdr_g, pndr_g, fdn_min_kg, fdn_max_kg,
        pb_pct: (pb_g / 10 / cms), // % MS necessária
        ndt_pct: ndt_needed,
      };
    },

    // ================================================================
    // 6. SOLVER LP — BIG-M SIMPLEX (minimizar custo, restrições nutricionais)
    // n = número de ingredientes (variáveis de decisão, % na dieta base MS)
    // c[i] = custo (R$/kg MS) do ingrediente i
    // cons = [{a: float[n], sense: '<=|>=|=', b: float}] (b >= 0 sempre)
    // Retorna: {ok, x[n], z (R$/100kg MS), motivo}
    // ================================================================
    _lpSolve: function (n, c, cons) {
      var m = cons.length;
      var BIG_M = 1e7;
      if (m === 0) return { ok: false, motivo: 'sem restrições' };

      // Contar variáveis auxiliares
      var nS = 0, nE = 0, nA = 0; // slacks, surplus, artificials
      for (var i = 0; i < m; i++) {
        if (cons[i].sense === '<=') { nS++; }
        else if (cons[i].sense === '>=') { nE++; nA++; }
        else { nA++; } // '='
      }
      var nFull = n + nS + nE + nA;

      // Custo completo: c original, 0 para slacks/surplus, M para artificiais
      var cF = new Array(nFull).fill(0);
      for (var j = 0; j < n; j++) cF[j] = c[j];
      var artStart = n + nS + nE;
      for (var j = artStart; j < nFull; j++) cF[j] = BIG_M;

      // Montar tableau: (m+1) linhas × (nFull+1) colunas
      var T = [];
      for (var i = 0; i <= m; i++) T.push(new Array(nFull + 1).fill(0));
      var basis = new Array(m).fill(-1);
      var si = n, ei = n + nS, ai = artStart;

      for (var i = 0; i < m; i++) {
        var con = cons[i];
        for (var j = 0; j < n; j++) T[i][j] = con.a[j];
        var b = con.b;
        if (con.sense === '<=') {
          if (b >= 0) {
            T[i][si] = 1; T[i][nFull] = b; basis[i] = si++; // slack básico
          } else {
            // b < 0: converter em >= com b>0 (flip)
            for (var j = 0; j < n; j++) T[i][j] *= -1;
            T[i][ei] = -1; T[i][ai] = 1; T[i][nFull] = -b;
            basis[i] = ai++; ei++;
          }
        } else if (cons[i].sense === '>=') {
          if (b >= 0) {
            T[i][ei] = -1; T[i][ai] = 1; T[i][nFull] = b;
            basis[i] = ai++; ei++;
          } else {
            // b < 0: flip para <= com b>0
            for (var j = 0; j < n; j++) T[i][j] *= -1;
            T[i][si] = 1; T[i][nFull] = -b; basis[i] = si++;
          }
        } else { // '='
          T[i][ai] = 1; T[i][nFull] = Math.abs(b);
          if (b < 0) for (var j = 0; j < n; j++) T[i][j] *= -1;
          basis[i] = ai++;
        }
      }

      // Linha objetivo: [cF | 0]
      for (var j = 0; j < nFull; j++) T[m][j] = cF[j];

      // Eliminação inicial: zerrar colunas das artificiais na linha objetivo
      for (var i = 0; i < m; i++) {
        if (basis[i] >= artStart) {
          var f = T[m][basis[i]];
          if (Math.abs(f) < 1e-12) continue;
          for (var j = 0; j <= nFull; j++) T[m][j] -= f * T[i][j];
        }
      }

      // Iterações do Simplex
      var MAX = 500;
      for (var iter = 0; iter < MAX; iter++) {
        // Variável entrante: menor custo reduzido
        var pc = -1, minV = -1e-7;
        for (var j = 0; j < nFull; j++) {
          if (T[m][j] < minV) { minV = T[m][j]; pc = j; }
        }
        if (pc < 0) break; // ótimo

        // Variável saindo: razão mínima
        var pr = -1, minR = 1e18;
        for (var i = 0; i < m; i++) {
          if (T[i][pc] > 1e-10) {
            var r = T[i][nFull] / T[i][pc];
            if (r < minR - 1e-10) { minR = r; pr = i; }
          }
        }
        if (pr < 0) return { ok: false, motivo: 'ilimitado' };

        // Pivô
        var piv = T[pr][pc];
        for (var j = 0; j <= nFull; j++) T[pr][j] /= piv;
        for (var i = 0; i <= m; i++) {
          if (i === pr) continue;
          var fv = T[i][pc];
          if (Math.abs(fv) < 1e-13) continue;
          for (var j = 0; j <= nFull; j++) T[i][j] -= fv * T[pr][j];
        }
        basis[pr] = pc;
      }

      // Extrair solução
      var x = new Array(n).fill(0);
      for (var i = 0; i < m; i++) {
        if (basis[i] >= artStart && T[i][nFull] > 1e-4)
          return { ok: false, motivo: 'inviável — restrições conflitantes' };
        if (basis[i] < n) x[basis[i]] = Math.max(0, T[i][nFull]);
      }
      var z = 0;
      for (var j = 0; j < n; j++) z += c[j] * x[j];
      return { ok: true, x: x, z: z };
    },

    // ================================================================
    // 7. CALCULAR COMPOSIÇÃO DE UMA MISTURA
    // blend: [{id, pct}] onde soma pct = 100
    // ================================================================
    calcBlend: function (blend) {
      var ingMap = {};
      this.ING.forEach(function (g) { ingMap[g.id] = g; });
      var res = { ms: 0, pb: 0, fdn: 0, fda: 0, ndt: 0, em: 0, ee: 0, ca: 0, p: 0, custo: 0, total_pct: 0 };
      blend.forEach(function (item) {
        var ing = ingMap[item.id];
        if (!ing) return;
        var w = item.pct / 100;
        res.pb  += ing.pb  * w;
        res.fdn += ing.fdn * w;
        res.fda += ing.fda * w;
        res.ndt += ing.ndt * w;
        res.em  += ing.em  * w;
        res.ee  += ing.ee  * w;
        res.ca  += ing.ca  * w;
        res.p   += ing.p   * w;
        res.custo += (ing.preco / 1000) * item.pct; // R$/100kg MS
        res.total_pct += item.pct;
        // MS ponderada (para cálculo base MN)
        res.ms += ing.ms * w;
      });
      res.custo_kg = res.custo / 100; // R$/kg MS
      var rCaP = res.p > 0 ? (res.ca / res.p).toFixed(2) : '—';
      res.relCaP = rCaP;
      return res;
    },

    // ================================================================
    // 8. FORMULAÇÃO ÓTIMA — LP (custo mínimo)
    // ingIds: string[] dos ingredientes selecionados
    // exig: resultado de calcExigencias
    // extra: {pbMin, pbMax, ndtMin, ndtMax, fdnMin, fdnMax, eeMax}
    // ================================================================
    formularOtimo: function (ingIds, exig, extra) {
      var self = this;
      var ingMap = {};
      this.ING.forEach(function (g) { ingMap[g.id] = g; });

      var ings = ingIds.map(function (id) { return ingMap[id]; }).filter(Boolean);
      var n = ings.length;
      if (n < 2) return { ok: false, motivo: 'Selecione pelo menos 2 ingredientes.' };

      // Custo: c[j] = R$ por kg MS = preco (R$/ton) / 1000
      var c = ings.map(function (g) { return g.preco / 1000; });

      // Metas nutricionais (% MS)
      var pbMin  = extra.pbMin  || (exig.pb_pct * 0.95);
      var pbMax  = extra.pbMax  || (exig.pb_pct * 1.15 + 5);
      var ndtMin = extra.ndtMin || (exig.ndt_pct - 2);
      var ndtMax = extra.ndtMax || (exig.ndt_pct + 8);
      var fdnMin = extra.fdnMin || 22;
      var fdnMax = extra.fdnMax || 65;
      var eeMax  = extra.eeMax  || 7.0;

      // Construir restrições
      var cons = [];

      // Soma = 100%
      cons.push({ a: ings.map(function () { return 1; }), sense: '=', b: 100 });

      // Nutrientes
      cons.push({ a: ings.map(function (g) { return g.pb; }),  sense: '>=', b: pbMin  });
      cons.push({ a: ings.map(function (g) { return g.pb; }),  sense: '<=', b: pbMax  });
      cons.push({ a: ings.map(function (g) { return g.ndt; }), sense: '>=', b: ndtMin });
      cons.push({ a: ings.map(function (g) { return g.ndt; }), sense: '<=', b: ndtMax });
      cons.push({ a: ings.map(function (g) { return g.fdn; }), sense: '>=', b: fdnMin });
      cons.push({ a: ings.map(function (g) { return g.fdn; }), sense: '<=', b: fdnMax });
      cons.push({ a: ings.map(function (g) { return g.ee; }),  sense: '<=', b: eeMax  });
      if (extra.caMin) cons.push({ a: ings.map(function (g) { return g.ca; }), sense: '>=', b: extra.caMin });
      if (extra.pMin)  cons.push({ a: ings.map(function (g) { return g.p; }),  sense: '>=', b: extra.pMin  });

      // Limites de inclusão por ingrediente
      ings.forEach(function (ing, j) {
        var a0 = new Array(n).fill(0); a0[j] = 1;
        if (ing.minInc > 0) cons.push({ a: a0.slice(), sense: '>=', b: ing.minInc });
        if (ing.maxInc < 100) cons.push({ a: a0.slice(), sense: '<=', b: ing.maxInc });
      });

      var res = this._lpSolve(n, c, cons);
      if (!res.ok) return res;

      // Montar blend resultante
      var blend = [];
      ings.forEach(function (ing, j) {
        if (res.x[j] > 0.01) blend.push({ id: ing.id, nome: ing.nome, pct: +res.x[j].toFixed(2) });
      });

      var comp = this.calcBlend(blend);
      var alertas = this.validarRacao(comp, extra._pv || 400);

      return { ok: true, blend: blend, composicao: comp, custo_100kg: res.z * 100, alertas: alertas };
    },

    // ================================================================
    // 9. QUADRADO DE PEARSON (2 ingredientes, 1 nutriente)
    // ================================================================
    formularPearson: function (idA, idB, meta, nutri) {
      nutri = nutri || 'pb';
      var ingMap = {};
      this.ING.forEach(function (g) { ingMap[g.id] = g; });
      var A = ingMap[idA], B = ingMap[idB];
      if (!A || !B) return { ok: false, motivo: 'Ingrediente não encontrado.' };
      var vA = A[nutri] || 0, vB = B[nutri] || 0;
      if (Math.abs(vA - vB) < 0.01) return { ok: false, motivo: 'Ingredientes com mesmo teor — use outro método.' };
      var diffAB = vB - vA;
      var pctA = ((vB - meta) / diffAB) * 100;
      var pctB = 100 - pctA;
      if (pctA < 0 || pctA > 100) return { ok: false, motivo: 'Meta fora da faixa possível com estes ingredientes.' };
      var blend = [{ id: idA, nome: A.nome, pct: +pctA.toFixed(1) }, { id: idB, nome: B.nome, pct: +pctB.toFixed(1) }];
      var comp = this.calcBlend(blend);
      return {
        ok: true, blend: blend, composicao: comp,
        explicacao: vA.toFixed(1) + '% vs ' + vB.toFixed(1) + '% → meta ' + meta + '% ' + nutri.toUpperCase()
      };
    },

    // ================================================================
    // 10. VALIDAÇÃO DE SEGURANÇA
    // ================================================================
    validarRacao: function (comp, pv) {
      var alertas = [];
      if (comp.ee > 7.0)  alertas.push({ tipo: 'erro',  msg: 'EE ' + comp.ee.toFixed(1) + '% > 7% máximo para ruminantes! Reduzir gordura.' });
      if (comp.fdn < 22)  alertas.push({ tipo: 'erro',  msg: 'FDN ' + comp.fdn.toFixed(1) + '% < 22% mínimo. Risco acidose/timpanismo.' });
      if (comp.fdn > 60 && comp.fdn * (pv * 0.02 / 100) > pv * 0.012)
        alertas.push({ tipo: 'aviso', msg: 'FDN alto pode limitar CMS. Checar consumo real.' });
      var rCaP = comp.p > 0 ? comp.ca / comp.p : 0;
      if (rCaP < 1.5)     alertas.push({ tipo: 'aviso', msg: 'Relação Ca:P ' + rCaP.toFixed(2) + ' < 1,5. Risco urolitíase.' });
      if (rCaP > 3.0)     alertas.push({ tipo: 'aviso', msg: 'Relação Ca:P ' + rCaP.toFixed(2) + ' > 3,0. Pode deprimir absorção de P.' });
      if (comp.ndt < 55)  alertas.push({ tipo: 'aviso', msg: 'NDT ' + comp.ndt.toFixed(1) + '% muito baixo. Energia insuficiente.' });
      return alertas;
    },

    // ================================================================
    // 11. ANÁLISE ECONÔMICA
    // ================================================================
    calcCustoArroba: function (params) {
      var p = Object.assign({ pesoEntrada: 280, pesoSaida: 460, rendCarcaca: 0.52, diasConfinamento: 90, custoDietaDia: 14.0, gmDia: 1.2, precoArroba: 280 }, params);
      var arrobasEntrada = (p.pesoEntrada * p.rendCarcaca) / 15;
      var arrobasSaida   = (p.pesoSaida   * p.rendCarcaca) / 15;
      var arrobasGanhas  = arrobasSaida - arrobasEntrada;
      var custoAlim      = p.custoDietaDia * p.diasConfinamento;
      var custoArroba    = arrobasGanhas > 0 ? custoAlim / arrobasGanhas : 0;
      var receitaVenda   = arrobasSaida * p.precoArroba;
      var margemBruta    = receitaVenda - custoAlim;
      var roi            = custoAlim > 0 ? (margemBruta / custoAlim) * 100 : 0;
      var viavel         = p.precoArroba >= custoArroba * 1.15;
      return { arrobasGanhas, custoArroba, receitaVenda, margemBruta, roi, viavel,
               pontoEquilibrio: custoArroba * 1.15 };
    },

    compararCenarios: function (cenarios) {
      return cenarios.map(function (c) {
        var gmd = c.gmd || 0;
        var dias = gmd > 0 ? Math.ceil((c.pesoSaida - c.pesoEntrada) / gmd) : c.dias || 90;
        return Object.assign({ dias: dias }, c, window.formulacaoRacao.calcCustoArroba(Object.assign({ diasConfinamento: dias }, c)));
      }).sort(function (a, b) { return a.custoArroba - b.custoArroba; });
    },

    // ================================================================
    // 12. INIT
    // ================================================================
    init: function () {
      this._injetarEstilos();
    },

    // ================================================================
    // 13. UI — MODAL PRINCIPAL (5 abas)
    // ================================================================
    abrirModal: function (aba) {
      aba = aba || 'exigencias';
      var self = this;
      var el = document.getElementById('formRacaoModal');
      if (el) el.remove();
      var modal = document.createElement('div');
      modal.id = 'formRacaoModal';
      modal.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px">' +
        '<div style="background:#111827;border-radius:16px;max-width:680px;width:100%;position:relative;border:1px solid #374151">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center">' +
        '<div><div style="font-weight:800;font-size:16px;color:#FDE68A">🔬 Formulador de Rações Pro</div>' +
        '<div style="font-size:11px;color:#9CA3AF;margin-top:2px">CQBAL 3.0 · BR-CORTE 2023 · Otimização LP (Simplex)</div></div>' +
        '<button onclick="document.getElementById(\'formRacaoModal\').remove()" style="color:#9CA3AF;font-size:22px;background:none;border:none;cursor:pointer;line-height:1">×</button></div>' +
        '<div id="frTabs" style="display:flex;gap:0;border-bottom:1px solid #1f2937;overflow-x:auto"></div>' +
        '<div id="frContent" style="padding:16px;min-height:300px"></div>' +
        '</div></div>';
      document.body.appendChild(modal);

      var abas = [
        { id: 'exigencias', label: '📐 Exigências' },
        { id: 'otimizador', label: '🔬 Otimizador LP' },
        { id: 'pearson',    label: '⚡ Pearson' },
        { id: 'receitas',   label: '📋 Receitas' },
        { id: 'custo',      label: '💰 Custo/@' },
        { id: 'ingredientes', label: '🗃️ Ingredientes' },
      ];

      var tabDiv = document.getElementById('frTabs');
      abas.forEach(function (a) {
        var btn = document.createElement('button');
        btn.textContent = a.label;
        btn.style.cssText = 'padding:10px 14px;font-size:12px;white-space:nowrap;border:none;cursor:pointer;transition:all 0.2s;background:transparent;color:#9CA3AF;border-bottom:2px solid transparent;flex-shrink:0';
        btn.onclick = function () {
          Array.from(tabDiv.children).forEach(function (b) {
            b.style.color = '#9CA3AF'; b.style.borderBottom = '2px solid transparent'; b.style.background = 'transparent';
          });
          btn.style.color = '#FDE68A'; btn.style.borderBottom = '2px solid #FDE68A'; btn.style.background = 'rgba(251,191,36,0.05)';
          self._renderAba(a.id);
        };
        if (a.id === aba) {
          btn.style.color = '#FDE68A'; btn.style.borderBottom = '2px solid #FDE68A'; btn.style.background = 'rgba(251,191,36,0.05)';
        }
        tabDiv.appendChild(btn);
      });
      this._renderAba(aba);
    },

    _renderAba: function (aba) {
      var div = document.getElementById('frContent');
      if (!div) return;
      if (aba === 'exigencias')   this._renderExigencias(div);
      else if (aba === 'otimizador') this._renderOtimizador(div);
      else if (aba === 'pearson') this._renderPearson(div);
      else if (aba === 'receitas') this._renderReceitas(div);
      else if (aba === 'custo')   this._renderCusto(div);
      else if (aba === 'ingredientes') this._renderIngredientes(div);
    },

    // ── Aba Exigências ──────────────────────────────────────────────
    _renderExigencias: function (div) {
      var self = this;
      div.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
        '<label style="color:#D1D5DB;font-size:12px">Categoria Animal<select id="frCat" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px">' +
        Object.entries(this.CAT).map(function (e) { return '<option value="' + e[0] + '">' + e[1].nome + '</option>'; }).join('') +
        '</select></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Raça<select id="frRaca" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px"><option value="zebu">Zebu / Nelore</option><option value="cruzado">Cruzado (F1/½ sangue)</option><option value="taurus">Europeu (Angus/Simental)</option></select></label>' +
        '</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">' +
        '<label style="color:#D1D5DB;font-size:12px">Peso Vivo (kg)<input id="frPV" type="number" value="400" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">GMD Alvo (kg/dia)<input id="frGMD" type="number" value="1.2" step="0.1" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Sistema<select id="frSist" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px"><option value="confinamento">Confinamento</option><option value="semiconfinamento">Semiconfinamento</option><option value="pastejo">Pastejo</option></select></label>' +
        '</div>' +
        '<button onclick="window.formulacaoRacao._calcularExig()" style="background:#7C3AED;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%">📐 Calcular Exigências (BR-CORTE 2023)</button>' +
        '<div id="frExigResult" style="margin-top:14px"></div>';
    },

    _calcularExig: function () {
      var pv   = parseFloat(document.getElementById('frPV').value)  || 400;
      var gmd  = parseFloat(document.getElementById('frGMD').value) || 1.2;
      var sist = document.getElementById('frSist').value;
      var raca = document.getElementById('frRaca').value;
      var e = this.calcExigencias(pv, gmd, sist, raca);
      var div = document.getElementById('frExigResult');
      if (!div) return;
      var s = function (v, d) { return (+v).toFixed(d || 1); };
      div.innerHTML = '<div style="background:#1F2937;border-radius:10px;padding:14px;border:1px solid #374151">' +
        '<div style="color:#FDE68A;font-weight:700;margin-bottom:10px">Exigências Calculadas — ' + raca.toUpperCase() + ' ' + pv + ' kg, GMD ' + gmd + ' kg/dia</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
        this._exigCard('CMS',  s(e.cms, 2),  'kg/dia', '#34D399') +
        this._exigCard('PB',   s(e.pb_g/10, 1), 'g/dia / ' + s(e.pb_pct, 1) + '% MS', '#60A5FA') +
        this._exigCard('NDT',  s(e.ndt_pct, 1), '% MS mín', '#FBBF24') +
        this._exigCard('NEm',  s(e.nem, 2),  'Mcal/dia', '#F472B6') +
        this._exigCard('NEg',  s(e.neg, 2),  'Mcal/dia', '#A78BFA') +
        this._exigCard('Ca',   s(e.ca, 1),   'g/dia', '#FB923C') +
        this._exigCard('P',    s(e.p, 1),    'g/dia', '#FB923C') +
        this._exigCard('PDR',  s(e.pdr_g/10, 1), 'g/dia (rúmen)', '#86EFAC') +
        this._exigCard('PNDR', s(e.pndr_g/10, 1),'g/dia (bypass)', '#86EFAC') +
        '</div>' +
        '<div style="margin-top:10px;padding:10px;background:#111827;border-radius:8px;font-size:11px;color:#6B7280">' +
        'FDN: min ' + s(e.fdn_min_kg, 2) + ' kg/dia (22% MS) · máx ' + s(e.fdn_max_kg, 2) + ' kg/dia (1,2% PV) · ' +
        'EE: máx 7% MS · Ureia: máx 1% MS da dieta total</div></div>';
    },

    _exigCard: function (label, val, unit, cor) {
      return '<div style="background:#111827;border-radius:8px;padding:10px;text-align:center">' +
        '<div style="font-size:10px;color:#9CA3AF">' + label + '</div>' +
        '<div style="font-size:18px;font-weight:700;color:' + cor + '">' + val + '</div>' +
        '<div style="font-size:10px;color:#6B7280">' + unit + '</div></div>';
    },

    // ── Aba Otimizador LP ───────────────────────────────────────────
    _renderOtimizador: function (div) {
      var self = this;
      var grupos = ['volumoso', 'conc_energetico', 'conc_proteico', 'subproduto', 'aditivo', 'mineral'];
      var nomes = { volumoso:'Volumosos', conc_energetico:'Energéticos', conc_proteico:'Proteicos', subproduto:'Subprodutos', aditivo:'Aditivos', mineral:'Minerais' };
      var ingHTML = grupos.map(function (g) {
        var its = self.ING.filter(function (i) { return i.grupo === g; });
        if (!its.length) return '';
        return '<div style="margin-bottom:8px"><div style="font-size:11px;color:#9CA3AF;font-weight:700;text-transform:uppercase;margin-bottom:4px">' + nomes[g] + '</div>' +
          its.map(function (i) {
            return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer">' +
              '<input type="checkbox" class="frIngCk" value="' + i.id + '" ' +
              (['milho','f_soja','sil_milho','calcario','premix_min'].includes(i.id) ? 'checked' : '') +
              ' style="width:14px;height:14px;cursor:pointer">' +
              '<span style="font-size:12px;color:#E5E7EB">' + i.nome + '</span>' +
              '<span style="margin-left:auto;font-size:10px;color:#6B7280">R$ ' + i.preco + '/t</span>' +
              '</label>';
          }).join('') + '</div>';
      }).join('');

      div.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
        '<div><div style="color:#9CA3AF;font-size:11px;font-weight:700;margin-bottom:6px">INGREDIENTES DISPONÍVEIS</div>' +
        '<div style="max-height:250px;overflow-y:auto;background:#1F2937;border-radius:8px;padding:10px;border:1px solid #374151">' + ingHTML + '</div></div>' +
        '<div><div style="color:#9CA3AF;font-size:11px;font-weight:700;margin-bottom:6px">PARÂMETROS</div>' +
        '<div style="background:#1F2937;border-radius:8px;padding:10px;border:1px solid #374151;font-size:12px">' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:8px">PV (kg): <input id="lpPV" type="number" value="400" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:5px;margin-top:2px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:8px">GMD (kg/d): <input id="lpGMD" type="number" value="1.2" step="0.1" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:5px;margin-top:2px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:8px">Sistema: <select id="lpSist" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:5px;margin-top:2px"><option value="confinamento">Confinamento</option><option value="semiconfinamento">Semiconfinamento</option><option value="pastejo">Pastejo</option></select></label>' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:8px">Raça: <select id="lpRaca" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:5px;margin-top:2px"><option value="zebu">Zebu/Nelore</option><option value="cruzado">Cruzado</option><option value="taurus">Europeu</option></select></label>' +
        '<div style="color:#9CA3AF;font-size:10px;margin-top:8px">Limites extras opcionais:</div>' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:4px;font-size:11px">PB mín %: <input id="lpPBmin" type="number" step="0.5" placeholder="auto" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:4px;margin-top:2px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;display:block;margin-bottom:4px;font-size:11px">NDT mín %: <input id="lpNDTmin" type="number" step="1" placeholder="auto" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:4px;margin-top:2px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;display:block;font-size:11px">FDN máx %: <input id="lpFDNmax" type="number" step="1" placeholder="65" style="width:100%;background:#111827;color:#fff;border:1px solid #374151;border-radius:6px;padding:4px;margin-top:2px;box-sizing:border-box"></label>' +
        '</div></div></div>' +
        '<button onclick="window.formulacaoRacao._executarLP()" style="background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;border:none;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;width:100%;margin-bottom:4px">🔬 Otimizar (Programação Linear)</button>' +
        '<div id="lpResult" style="margin-top:12px"></div>';
    },

    _executarLP: function () {
      var pv   = parseFloat(document.getElementById('lpPV').value)   || 400;
      var gmd  = parseFloat(document.getElementById('lpGMD').value)  || 1.2;
      var sist = document.getElementById('lpSist').value;
      var raca = document.getElementById('lpRaca').value;
      var pbMin  = parseFloat(document.getElementById('lpPBmin').value)  || null;
      var ndtMin = parseFloat(document.getElementById('lpNDTmin').value) || null;
      var fdnMax = parseFloat(document.getElementById('lpFDNmax').value) || 65;

      var ckd = Array.from(document.querySelectorAll('.frIngCk:checked')).map(function (c) { return c.value; });
      if (ckd.length < 3) { alert('Selecione ao menos 3 ingredientes.'); return; }

      var exig = this.calcExigencias(pv, gmd, sist, raca);
      var res = this.formularOtimo(ckd, exig, { pbMin: pbMin, ndtMin: ndtMin, fdnMax: fdnMax, _pv: pv });

      var div = document.getElementById('lpResult');
      if (!div) return;
      if (!res.ok) {
        div.innerHTML = '<div style="background:#3B1F1F;border-radius:10px;padding:14px;color:#FCA5A5;font-weight:700">❌ ' + res.motivo + '</div>';
        return;
      }

      var comp = res.composicao;
      var s = function (v, d) { return (+v).toFixed(d || 1); };
      var semaf = function (v, min, max, inv) {
        var ok = inv ? v <= min : v >= min;
        var bad = inv ? v > max : v < max;
        var cor = ok ? '#22C55E' : bad ? '#EF4444' : '#F59E0B';
        return '<span style="color:' + cor + ';font-weight:700">' + s(v) + '</span>';
      };

      div.innerHTML = '<div style="background:#1F2937;border-radius:10px;padding:14px;border:1px solid #374151">' +
        '<div style="color:#34D399;font-weight:700;margin-bottom:10px">✅ Formulação Ótima — Custo Mínimo</div>' +
        '<div style="margin-bottom:10px">' +
        res.blend.map(function (b) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #111827">' +
            '<span style="font-size:13px;color:#E5E7EB">' + b.nome + '</span>' +
            '<div style="display:flex;gap:12px">' +
            '<span style="font-size:14px;font-weight:700;color:#60A5FA">' + s(b.pct, 1) + '%</span>' +
            '</div></div>';
        }).join('') + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">' +
        '<div style="background:#111827;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:#9CA3AF">PB</div><div style="font-size:16px;font-weight:700;color:#60A5FA">' + s(comp.pb) + '%</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:#9CA3AF">NDT</div><div style="font-size:16px;font-weight:700;color:#FBBF24">' + s(comp.ndt) + '%</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:#9CA3AF">FDN</div><div style="font-size:16px;font-weight:700;color:#F472B6">' + s(comp.fdn) + '%</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:#9CA3AF">EE</div><div style="font-size:16px;font-weight:700;' + (comp.ee > 7 ? 'color:#EF4444' : 'color:#34D399') + '">' + s(comp.ee) + '%</div></div>' +
        '</div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">' +
        '<div><div style="font-size:11px;color:#9CA3AF">Custo por 100 kg MS</div><div style="font-size:20px;font-weight:800;color:#34D399">R$ ' + s(res.custo_100kg, 2) + '</div></div>' +
        '<div><div style="font-size:11px;color:#9CA3AF">R$/kg MS</div><div style="font-size:20px;font-weight:800;color:#34D399">' + s(res.custo_100kg / 100, 3) + '</div></div>' +
        '<div><div style="font-size:11px;color:#9CA3AF">Ca</div><div style="font-size:14px;font-weight:700;color:#FB923C">' + s(comp.ca, 2) + '%</div></div>' +
        '<div><div style="font-size:11px;color:#9CA3AF">P</div><div style="font-size:14px;font-weight:700;color:#FB923C">' + s(comp.p, 2) + '%</div></div>' +
        '<div><div style="font-size:11px;color:#9CA3AF">Ca:P</div><div style="font-size:14px;font-weight:700;color:' + (parseFloat(comp.relCaP) >= 1.5 && parseFloat(comp.relCaP) <= 3 ? '#34D399' : '#EF4444') + '">' + comp.relCaP + '</div></div>' +
        '</div>' +
        (res.alertas.length ? '<div style="margin-top:10px">' + res.alertas.map(function (a) {
          return '<div style="background:' + (a.tipo === 'erro' ? '#3B1F1F' : '#2D2008') + ';border-radius:6px;padding:8px;font-size:11px;color:' + (a.tipo === 'erro' ? '#FCA5A5' : '#FDE68A') + ';margin-bottom:4px">' + (a.tipo === 'erro' ? '🚨 ' : '⚠️ ') + a.msg + '</div>';
        }).join('') + '</div>' : '') +
        '</div>';
    },

    // ── Aba Pearson ─────────────────────────────────────────────────
    _renderPearson: function (div) {
      var self = this;
      var opts = this.ING.map(function (i) { return '<option value="' + i.id + '">' + i.nome + ' (' + i.pb + '% PB / ' + i.ndt + '% NDT)</option>'; }).join('');
      div.innerHTML = '<div style="font-size:12px;color:#9CA3AF;margin-bottom:12px">Método rápido para 2 ingredientes, 1 nutriente. Útil para SPM e misturas simples.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">' +
        '<label style="color:#D1D5DB;font-size:12px">Ingrediente A (alto teor):<select id="pA" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px">' + opts + '</select></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Ingrediente B (baixo teor):<select id="pB" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px">' + opts + '</select></label>' +
        '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
        '<label style="color:#D1D5DB;font-size:12px">Nutriente:<select id="pNut" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px"><option value="pb">Proteína Bruta (PB)</option><option value="ndt">NDT (Energia)</option><option value="fdn">FDN</option><option value="ee">Extrato Etéreo (EE)</option></select></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Meta (% MS):<input id="pMeta" type="number" value="18" step="0.5" style="width:100%;background:#1F2937;color:#F9FAFB;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '</div>' +
        '<button onclick="window.formulacaoRacao._executarPearson()" style="background:#15803D;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%">⚡ Calcular Quadrado de Pearson</button>' +
        '<div id="pearsonResult" style="margin-top:14px"></div>' +
        '<div style="margin-top:16px;padding:10px;background:#1F2937;border-radius:8px;font-size:11px;color:#9CA3AF;border-left:3px solid #374151">' +
        '<strong style="color:#D1D5DB">Como funciona:</strong> Coloca-se o teor do nutriente no Ingrediente A e B nos extremos do quadrado. A meta no centro. As diagonais dão as proporções. Limitação: só 1 nutriente por vez — para múltiplos use o Otimizador LP.</div>';

      // Pré-selecionar valores úteis
      var selA = document.getElementById('pA'), selB = document.getElementById('pB');
      if (selA) Array.from(selA.options).forEach(function (o, i) { if (o.value === 'f_soja') selA.selectedIndex = i; });
      if (selB) Array.from(selB.options).forEach(function (o, i) { if (o.value === 'milho') selB.selectedIndex = i; });
    },

    _executarPearson: function () {
      var idA  = document.getElementById('pA').value;
      var idB  = document.getElementById('pB').value;
      var nut  = document.getElementById('pNut').value;
      var meta = parseFloat(document.getElementById('pMeta').value) || 18;
      var res  = this.formularPearson(idA, idB, meta, nut);
      var div  = document.getElementById('pearsonResult');
      if (!div) return;
      if (!res.ok) {
        div.innerHTML = '<div style="background:#3B1F1F;border-radius:8px;padding:12px;color:#FCA5A5">❌ ' + res.motivo + '</div>';
        return;
      }
      var comp = res.composicao;
      var s = function (v, d) { return (+v).toFixed(d || 1); };
      div.innerHTML = '<div style="background:#1F2937;border-radius:10px;padding:14px;border:1px solid #374151">' +
        '<div style="color:#34D399;font-weight:700;margin-bottom:8px">✅ Resultado — ' + res.explicacao + '</div>' +
        res.blend.map(function (b) {
          return '<div style="display:flex;justify-content:space-between;padding:8px;background:#111827;border-radius:8px;margin-bottom:6px">' +
            '<span style="color:#E5E7EB">' + b.nome + '</span>' +
            '<span style="color:#60A5FA;font-size:18px;font-weight:700">' + s(b.pct, 1) + '%</span></div>';
        }).join('') +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px">' +
        [['PB',comp.pb,'#60A5FA'],['NDT',comp.ndt,'#FBBF24'],['FDN',comp.fdn,'#F472B6'],['EE',comp.ee,'#34D399'],['Ca:P',comp.relCaP,'#FB923C']].map(function (r) {
          return '<div style="background:#111827;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:#9CA3AF">' + r[0] + '</div><div style="font-size:15px;font-weight:700;color:' + r[2] + '">' + (typeof r[1] === 'number' ? s(r[1]) : r[1]) + '</div></div>';
        }).join('') + '</div>' +
        '<div style="margin-top:10px;font-size:12px;color:#9CA3AF">Custo: <span style="color:#34D399;font-weight:700">R$ ' + s(comp.custo_kg, 3) + '/kg MS</span></div></div>';
    },

    // ── Aba Receitas ────────────────────────────────────────────────
    _renderReceitas: function (div) {
      var self = this;
      var html = this.RECEITAS.map(function (r) {
        var comp = self.calcBlend(r.ingredientes);
        var s = function (v, d) { return (+v).toFixed(d || 1); };
        return '<div style="background:#1F2937;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #374151;cursor:pointer" onclick="this.querySelector(\'.rDetalhe\').style.display=this.querySelector(\'.rDetalhe\').style.display===\'none\'?\'block\':\'none\'">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div><div style="font-weight:700;font-size:14px;color:#FDE68A">' + r.nome + '</div>' +
          '<div style="font-size:11px;color:#9CA3AF;margin-top:2px">' + r.descricao + '</div></div>' +
          '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:#34D399">R$ ' + s(comp.custo_kg, 3) + '/kg MS</div><div style="font-size:10px;color:#6B7280">' + r.consumo_g + ' g/dia</div></div></div>' +
          '<div style="display:flex;gap:8px;margin-top:8px">' +
          ['PB '+s(comp.pb)+'%','NDT '+s(comp.ndt)+'%','FDN '+s(comp.fdn)+'%','EE '+s(comp.ee)+'%'].map(function (t) {
            return '<span style="background:#111827;color:#D1D5DB;font-size:10px;padding:3px 7px;border-radius:12px">' + t + '</span>';
          }).join('') + '</div>' +
          '<div class="rDetalhe" style="display:none;margin-top:10px">' +
          '<div style="font-size:11px;color:#9CA3AF;margin-bottom:6px;font-weight:700">COMPOSIÇÃO:</div>' +
          r.ingredientes.map(function (i) {
            var ing = self.ING.find(function (x) { return x.id === i.id; });
            return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #374151">' +
              '<span style="color:#E5E7EB">' + (ing ? ing.nome : i.id) + '</span>' +
              '<span style="color:#60A5FA;font-weight:700">' + i.pct + '%</span></div>';
          }).join('') +
          '<div style="margin-top:8px;padding:8px;background:#111827;border-radius:6px;font-size:11px;color:#6B7280">📌 ' + r.obs + '</div></div></div>';
      }).join('');
      div.innerHTML = '<div style="font-size:12px;color:#9CA3AF;margin-bottom:12px">Clique em qualquer receita para ver a composição detalhada. Todas validadas pela Embrapa CNPGC.</div>' + html;
    },

    // ── Aba Custo/@ ─────────────────────────────────────────────────
    _renderCusto: function (div) {
      div.innerHTML = '<div style="font-size:12px;color:#9CA3AF;margin-bottom:12px">Calcule o custo real de produção por arroba e compare sistemas.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
        '<label style="color:#D1D5DB;font-size:12px">Peso Entrada (kg)<input id="caPI" type="number" value="280" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Peso Saída (kg)<input id="caPS" type="number" value="460" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Rendimento Carcaça (%)<input id="caRC" type="number" value="52" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Dias de Confinamento<input id="caDias" type="number" value="90" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Custo Dieta R$/cab/dia<input id="caCusto" type="number" value="14.00" step="0.5" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '<label style="color:#D1D5DB;font-size:12px">Preço Arroba (R$/@)<input id="caPreco" type="number" value="280" step="5" style="width:100%;background:#1F2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px;margin-top:4px;box-sizing:border-box"></label>' +
        '</div>' +
        '<button onclick="window.formulacaoRacao._calcCustoArroba()" style="background:#D97706;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%;margin-bottom:12px">💰 Calcular Custo por Arroba</button>' +
        '<div id="caResult"></div>' +
        '<div style="margin-top:16px"><div style="color:#9CA3AF;font-size:11px;font-weight:700;margin-bottom:8px">COMPARAÇÃO DE SISTEMAS (2024-2025)</div>' +
        '<div id="cenarioResult"></div>' +
        '<button onclick="window.formulacaoRacao._calcCenarios()" style="background:#374151;color:#D1D5DB;border:none;padding:8px 16px;border-radius:8px;font-size:12px;cursor:pointer;width:100%;margin-top:8px">📊 Gerar Comparação de Cenários</button>' +
        '</div>';
    },

    _calcCustoArroba: function () {
      var p = {
        pesoEntrada: parseFloat(document.getElementById('caPI').value) || 280,
        pesoSaida:   parseFloat(document.getElementById('caPS').value) || 460,
        rendCarcaca: (parseFloat(document.getElementById('caRC').value) || 52) / 100,
        diasConfinamento: parseInt(document.getElementById('caDias').value) || 90,
        custoDietaDia: parseFloat(document.getElementById('caCusto').value) || 14,
        precoArroba: parseFloat(document.getElementById('caPreco').value) || 280,
      };
      var r = this.calcCustoArroba(p);
      var div = document.getElementById('caResult');
      if (!div) return;
      var s = function (v, d) { return (+v).toFixed(d || 0); };
      div.innerHTML = '<div style="background:#1F2937;border-radius:10px;padding:14px;border:1px solid #374151">' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">' +
        '<div style="background:#111827;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9CA3AF">Arrobas Ganhas</div><div style="font-size:20px;font-weight:700;color:#60A5FA">' + s(r.arrobasGanhas, 1) + '@</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9CA3AF">Custo/@</div><div style="font-size:20px;font-weight:700;color:' + (r.viavel ? '#34D399' : '#EF4444') + '">R$ ' + s(r.custoArroba) + '</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9CA3AF">Ponto Equilíbrio</div><div style="font-size:20px;font-weight:700;color:#FBBF24">R$ ' + s(r.pontoEquilibrio) + '/@</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
        '<div style="background:#111827;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9CA3AF">Custo Total Alimentação</div><div style="font-size:16px;font-weight:700;color:#EF4444">R$ ' + s(p.custoDietaDia * p.diasConfinamento) + '</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9CA3AF">Receita Venda</div><div style="font-size:16px;font-weight:700;color:#34D399">R$ ' + s(r.receitaVenda) + '</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9CA3AF">Margem Bruta</div><div style="font-size:16px;font-weight:700;color:' + (r.margemBruta > 0 ? '#34D399' : '#EF4444') + '">R$ ' + s(r.margemBruta) + '</div></div>' +
        '<div style="background:#111827;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9CA3AF">ROI Alimentação</div><div style="font-size:16px;font-weight:700;color:' + (r.roi > 15 ? '#34D399' : r.roi > 0 ? '#FBBF24' : '#EF4444') + '">' + s(r.roi, 1) + '%</div></div>' +
        '</div>' +
        '<div style="margin-top:10px;padding:8px;background:' + (r.viavel ? '#1A3A2A' : '#3B1F1F') + ';border-radius:8px;font-size:12px;color:' + (r.viavel ? '#34D399' : '#FCA5A5') + ';font-weight:700;text-align:center">' +
        (r.viavel ? '✅ Viável — preço @ cobre custo produção com margem mínima 15%' : '❌ Inviável — preço @ abaixo do ponto de equilíbrio (R$ ' + s(r.pontoEquilibrio) + '/@)') +
        '</div></div>';
    },

    _calcCenarios: function () {
      var precoArroba = parseFloat(document.getElementById('caPreco').value) || 280;
      var cenarios = [
        { nome:'🌿 Só Pastejo',              pesoEntrada:300, pesoSaida:450, rendCarcaca:0.51, gmd:0.45, custoDietaDia:0.30, precoArroba:precoArroba },
        { nome:'🧂 Pasto + Sal Mineral',     pesoEntrada:300, pesoSaida:450, rendCarcaca:0.51, gmd:0.52, custoDietaDia:0.60, precoArroba:precoArroba },
        { nome:'⚗️ Pasto + Sal Proteico',    pesoEntrada:300, pesoSaida:450, rendCarcaca:0.51, gmd:0.70, custoDietaDia:1.50, precoArroba:precoArroba },
        { nome:'🌾 Pasto + Supl. Prot-Ener', pesoEntrada:300, pesoSaida:450, rendCarcaca:0.52, gmd:0.95, custoDietaDia:3.50, precoArroba:precoArroba },
        { nome:'🎋 Semiconfinamento',         pesoEntrada:300, pesoSaida:460, rendCarcaca:0.52, gmd:1.10, custoDietaDia:8.00, precoArroba:precoArroba },
        { nome:'🐄 Confinamento Conv.',       pesoEntrada:300, pesoSaida:460, rendCarcaca:0.52, gmd:1.30, custoDietaDia:14.0, precoArroba:precoArroba },
        { nome:'🌽 Confinamento Alto Grão',   pesoEntrada:320, pesoSaida:470, rendCarcaca:0.53, gmd:1.60, custoDietaDia:18.0, precoArroba:precoArroba },
      ];
      var res = this.compararCenarios(cenarios);
      var div = document.getElementById('cenarioResult');
      if (!div) return;
      var s = function (v, d) { return (+v).toFixed(d || 0); };
      div.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<thead><tr>' + ['Sistema','Dias','Custo/@','Margem','ROI','Viável?'].map(function (h) {
          return '<th style="background:#111827;color:#9CA3AF;padding:7px;text-align:left">' + h + '</th>';
        }).join('') + '</tr></thead><tbody>' +
        res.map(function (r, i) {
          var cor = r.roi > 15 ? '#34D399' : r.roi > 0 ? '#FBBF24' : '#EF4444';
          var bg = i % 2 === 0 ? '#1F2937' : '#111827';
          return '<tr style="background:' + bg + '">' +
            '<td style="padding:7px;color:#E5E7EB;font-weight:600">' + r.nome + '</td>' +
            '<td style="padding:7px;color:#D1D5DB">' + r.dias + '</td>' +
            '<td style="padding:7px;color:' + cor + ';font-weight:700">R$ ' + s(r.custoArroba) + '</td>' +
            '<td style="padding:7px;color:' + (r.margemBruta > 0 ? '#34D399' : '#EF4444') + '">R$ ' + s(r.margemBruta) + '</td>' +
            '<td style="padding:7px;color:' + cor + ';font-weight:700">' + s(r.roi, 1) + '%</td>' +
            '<td style="padding:7px">' + (r.viavel ? '✅' : '❌') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    },

    // ── Aba Ingredientes ────────────────────────────────────────────
    _renderIngredientes: function (div) {
      var grupos = { volumoso:'🌿 Volumosos', conc_energetico:'⚡ Energéticos', conc_proteico:'🧬 Proteicos', subproduto:'♻️ Subprodutos', aditivo:'🧪 Aditivos', mineral:'⚗️ Minerais' };
      var html = '';
      Object.entries(grupos).forEach(function (g) {
        var ings = window.formulacaoRacao.ING.filter(function (i) { return i.grupo === g[0]; });
        if (!ings.length) return;
        html += '<div style="margin-bottom:16px"><div style="color:#FBBF24;font-weight:700;font-size:12px;margin-bottom:8px">' + g[1] + '</div>';
        html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">';
        html += '<thead><tr>' + ['Ingrediente','MS%','PB%','FDN%','NDT%','EE%','Ca%','P%','R$/t'].map(function (h) {
          return '<th style="background:#111827;color:#9CA3AF;padding:6px 4px;text-align:right;white-space:nowrap">' + h + '</th>';
        }).join('') + '</tr></thead><tbody>';
        ings.forEach(function (i, idx) {
          var bg = idx % 2 === 0 ? '#1F2937' : '#111827';
          var s = function (v) { return (+v).toFixed(1); };
          html += '<tr style="background:' + bg + '" title="' + (i.obs || '') + '">' +
            '<td style="padding:6px 4px;color:#E5E7EB;font-weight:600;text-align:left">' + i.nome + '</td>' +
            ['ms','pb','fdn','ndt','ee','ca','p'].map(function (k) { return '<td style="padding:6px 4px;color:#D1D5DB;text-align:right">' + s(i[k]) + '</td>'; }).join('') +
            '<td style="padding:6px 4px;color:#34D399;text-align:right;font-weight:700">' + i.preco + '</td></tr>';
        });
        html += '</tbody></table></div></div>';
      });
      div.innerHTML = '<div style="font-size:11px;color:#6B7280;margin-bottom:10px">Passe o mouse sobre o nome para ver observações. Valores em % da MS. Preços orientativos R$/ton (2024-25).</div>' + html;
    },

    // ================================================================
    // ESTILOS
    // ================================================================
    _injetarEstilos: function () {
      if (document.getElementById('formRacaoCSS')) return;
      var s = document.createElement('style');
      s.id = 'formRacaoCSS';
      s.textContent = '#formRacaoModal select,#formRacaoModal input{outline:none}#formRacaoModal input:focus,#formRacaoModal select:focus{border-color:#7C3AED !important}.frIngCk{accent-color:#7C3AED}#frTabs::-webkit-scrollbar{height:4px}#frTabs::-webkit-scrollbar-thumb{background:#374151;border-radius:2px}';
      document.head.appendChild(s);
    },
  };
})();
