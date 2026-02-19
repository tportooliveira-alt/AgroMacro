// ====== DEMO-DATA.JS — Dados de Demonstração COMPLETOS ======
// Preenche TODOS os pastos com gado, obras, manejos, financeiro
// Simula fazenda operando a TODO VAPOR

(function () {
    'use strict';

    if (!window.data || !window.data.events) {
        console.error('❌ window.data não disponível');
        return;
    }

    // Limpar dados antigos de demo mantendo PASTOS
    var pastosEvents = window.data.events.filter(function (e) { return e.type === 'PASTO'; });
    window.data.events = pastosEvents;

    var now = new Date();
    var fmt = function (d) { return d.toISOString(); };
    var daysAgo = function (n) { var d = new Date(now); d.setDate(d.getDate() - n); return d; };
    var daysFromNow = function (n) { var d = new Date(now); d.setDate(d.getDate() + n); return d; };
    var fmtDate = function (d) { return d.toISOString().split('T')[0]; };

    // ═══════════════════════════════════════════════════════════
    // 1. LOTES COM GADO — TODOS OS PASTOS COM ALTA LOTAÇÃO
    // ═══════════════════════════════════════════════════════════
    var lotes = [
        // Engorda — pastos principais
        { nome: 'Engorda Premium', pasto: 'pasto cocho de cimento', qtdAnimais: 120, pesoMedio: 450, raca: 'Nelore', categoria: 'Boi Gordo', obs: 'Ponto de abate - vender em 15 dias' },
        { nome: 'Engorda Subaco', pasto: 'pasto do subaco engorda', qtdAnimais: 95, pesoMedio: 420, raca: 'Nelore/Angus', categoria: 'Boi', obs: 'Engorda final - 2º lote' },
        { nome: 'Engorda Rio', pasto: 'pasto do rio', qtdAnimais: 85, pesoMedio: 405, raca: 'Brahman', categoria: 'Boi', obs: 'Engorda - próx pesagem em 10 dias' },
        { nome: 'Engorda Pedra Preta', pasto: 'pasto pedra preta', qtdAnimais: 110, pesoMedio: 390, raca: 'Nelore', categoria: 'Boi', obs: 'Lote novo - recém comprado' },

        // Recria
        { nome: 'Recria Chico', pasto: 'pasto casa de chico', qtdAnimais: 140, pesoMedio: 280, raca: 'Nelore', categoria: 'Garrote', obs: 'Recria intensiva' },
        { nome: 'Recria Iris', pasto: 'pasto vizinho de iris', qtdAnimais: 110, pesoMedio: 300, raca: 'Nelore', categoria: 'Garrote', obs: 'Garrotes para engorda em 60 dias' },
        { nome: 'Recria Casinha', pasto: 'pasto da casinha', qtdAnimais: 75, pesoMedio: 260, raca: 'F1 Angus', categoria: 'Garrote', obs: 'Cruzamento industrial' },

        // Matrizes
        { nome: 'Vacas Matrizes', pasto: 'manga das vacas', qtdAnimais: 130, pesoMedio: 460, raca: 'Nelore PO', categoria: 'Vaca', obs: 'Matrizes reprodução - IATF programada' },
        { nome: 'Vacas Paridas', pasto: 'pasto frente sede', qtdAnimais: 65, pesoMedio: 440, raca: 'Nelore', categoria: 'Vaca', obs: 'Vacas com cria ao pé' },
        { nome: 'Vacas Secas', pasto: 'pasto formosa', qtdAnimais: 50, pesoMedio: 430, raca: 'Nelore', categoria: 'Vaca', obs: 'Recondicionar para próx estação' },

        // Sindi / Especial
        { nome: 'Lote Sindi', pasto: 'pasto subaco sindi', qtdAnimais: 80, pesoMedio: 350, raca: 'Sindi', categoria: 'Boi', obs: 'Gado Sindi - adaptado ao semiárido' },

        // Cria e Desmama
        { nome: 'Bezerros Desmama', pasto: 'pasto piteira', qtdAnimais: 90, pesoMedio: 190, raca: 'Nelore', categoria: 'Bezerro', obs: 'Desmamados - suplementação' },
        { nome: 'Bezerras Misael', pasto: 'pasto casa de misael', qtdAnimais: 70, pesoMedio: 175, raca: 'Nelore', categoria: 'Bezerra', obs: 'Bezerras para seleção' },

        // Novilhas reprodução
        { nome: 'Novilhas IATF', pasto: 'pasto da frente do curral', qtdAnimais: 55, pesoMedio: 340, raca: 'Nelore', categoria: 'Novilha', obs: 'IATF iniciando em 7 dias' },

        // Touros
        { nome: 'Touros Reprodutores', pasto: 'area de descanso', qtdAnimais: 18, pesoMedio: 680, raca: 'Nelore PO', categoria: 'Touro', obs: '8 PO + 10 meio-sangue Angus' },

        // Mais pastos com gado
        { nome: 'Engorda Seminterio', pasto: 'pasto do seminterio', qtdAnimais: 88, pesoMedio: 380, raca: 'Nelore', categoria: 'Boi', obs: 'Semi-confinamento' },
        { nome: 'Recria Pantanal', pasto: 'pasto pantanal', qtdAnimais: 65, pesoMedio: 270, raca: 'Nelore', categoria: 'Garrote', obs: 'Pasto com boa água' },
        { nome: 'Vacas Meio', pasto: 'pasto do meio', qtdAnimais: 45, pesoMedio: 420, raca: 'Nelore', categoria: 'Vaca', obs: 'Gestantes confirmadas' },
        { nome: 'Garrotes Baixa', pasto: 'pasto baixa do rio', qtdAnimais: 70, pesoMedio: 290, raca: 'Nelore', categoria: 'Garrote', obs: 'Boa disponibilidade de pasto' },
        { nome: 'Engorda Vizinho', pasto: 'pasto vizinho domingos', qtdAnimais: 60, pesoMedio: 395, raca: 'Nelore', categoria: 'Boi', obs: 'Terminação' },
        { nome: 'Lote Assudão', pasto: 'pasto assudao', qtdAnimais: 55, pesoMedio: 310, raca: 'Nelore', categoria: 'Garrote', obs: 'Próximo ao açude principal' },
        { nome: 'Lote Manga Capim', pasto: 'pasto manga do capim', qtdAnimais: 75, pesoMedio: 350, raca: 'Nelore', categoria: 'Boi', obs: 'Capim excelente' },
        { nome: 'Novilhas Curva', pasto: 'pasto da curva da manga', qtdAnimais: 40, pesoMedio: 300, raca: 'Nelore', categoria: 'Novilha', obs: 'Seleção de matrizes' },
        { nome: 'Lote Vizinha Fern', pasto: 'pasto vizinha fernanda', qtdAnimais: 50, pesoMedio: 360, raca: 'Nelore', categoria: 'Boi', obs: 'Engorda intermediária' },
        { nome: 'Lote Tres Cantos', pasto: 'pasto tres cantos', qtdAnimais: 65, pesoMedio: 330, raca: 'Nelore/Brahman', categoria: 'Garrote', obs: 'Área de recria' },
        { nome: 'Lote Branca Almir', pasto: 'pasto branca e almir', qtdAnimais: 48, pesoMedio: 380, raca: 'Nelore', categoria: 'Boi', obs: 'Pasto compartilhado' },
        { nome: 'Descarte', pasto: 'pasto mangueiro', qtdAnimais: 30, pesoMedio: 400, raca: 'Mista', categoria: 'Vaca', obs: 'Para venda no leilão' }
    ];

    var totalCab = 0;
    lotes.forEach(function (l) {
        totalCab += l.qtdAnimais;
        window.data.events.push({
            type: 'LOTE',
            nome: l.nome,
            pasto: l.pasto,
            qtdAnimais: l.qtdAnimais,
            quantidade: l.qtdAnimais,
            cabecas: l.qtdAnimais,
            pesoMedio: l.pesoMedio,
            raca: l.raca,
            status: 'ATIVO',
            categoria: l.categoria,
            obs: l.obs,
            date: fmt(daysAgo(Math.floor(Math.random() * 30) + 5))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 2. OBRAS — várias em andamento + concluídas
    // ═══════════════════════════════════════════════════════════
    var obras = [
        // Em andamento (sem dataFim)
        { nome: 'Reforma Cerca Piteira', pasto: 'pasto piteira', custo: 12500, obs: 'Troca de 800m de arame + mourões', dataFim: '' },
        { nome: 'Curral de Manejo', pasto: 'pasto da frente do curral', custo: 68000, obs: 'Curral completo com tronco, seringa e balança', dataFim: '' },
        { nome: 'Bebedouro Artesiano', pasto: 'pasto pantanal', custo: 18000, obs: 'Poço artesiano + encanamento + cocho', dataFim: '' },
        { nome: 'Subdivisão Pasto', pasto: 'pasto vizinho de iris', custo: 8500, obs: 'Divisão em 3 piquetes para rotação', dataFim: '' },
        { nome: 'Cocho Sal Proteinado', pasto: 'pasto do seminterio', custo: 4200, obs: 'Cocho coberto 6m', dataFim: '' },

        // Concluídas
        { nome: 'Cerca Elétrica Solar', pasto: 'pasto cocho de cimento', custo: 15800, obs: 'Cerca elétrica com painel solar', dataFim: fmt(daysAgo(20)) },
        { nome: 'Bebedouro Formosa', pasto: 'pasto formosa', custo: 9500, obs: 'Bebedouro + caixa d\'água 5000L', dataFim: fmt(daysAgo(35)) },
        { nome: 'Reforma Sede', pasto: 'pasto frente sede', custo: 25000, obs: 'Reforma galpão + escritório', dataFim: fmt(daysAgo(60)) },
        { nome: 'Estrada Interna', pasto: 'pasto do rio', custo: 32000, obs: 'Cascalhamento 2km acesso', dataFim: fmt(daysAgo(45)) }
    ];

    obras.forEach(function (o) {
        window.data.events.push({
            type: 'OBRA_REGISTRO',
            nome: o.nome,
            pasto: o.pasto,
            custo: o.custo,
            value: o.custo,
            obs: o.obs,
            dataFim: o.dataFim,
            date: fmt(daysAgo(Math.floor(Math.random() * 60) + 10))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 3. COMPRAS — histório de compras recentes
    // ═══════════════════════════════════════════════════════════
    var compras = [
        { nome: 'Compra Nelore Engorda', cabecas: 110, pesoMedio: 360, valor: 396000, lote: 'Engorda Pedra Preta', fornecedor: 'Fazenda Boa Esperança', data: 15 },
        { nome: 'Compra Bezerros Leilão', cabecas: 90, pesoMedio: 180, valor: 171000, lote: 'Bezerros Desmama', fornecedor: 'Leilão Conquista Rural', data: 45 },
        { nome: 'Compra Novilhas PO', cabecas: 30, pesoMedio: 320, valor: 120000, lote: 'Novilhas IATF', fornecedor: 'Cabanha Esperança', data: 60 },
        { nome: 'Compra Touros PO', cabecas: 8, pesoMedio: 620, valor: 96000, lote: 'Touros Reprodutores', fornecedor: 'Agropec Genética', data: 90 },
        { nome: 'Compra Garrotes Recria', cabecas: 140, pesoMedio: 240, valor: 364000, lote: 'Recria Chico', fornecedor: 'Fazenda São José', data: 30 }
    ];

    compras.forEach(function (c, idx) {
        window.data.events.push({
            type: 'COMPRA',
            id: 'DEMO-C' + idx + '-' + Date.now(),
            nome: c.nome,
            desc: c.nome,
            qty: c.cabecas,
            cabecas: c.cabecas,
            peso: c.pesoMedio,
            pesoMedio: c.pesoMedio,
            value: c.valor,
            lote: c.lote,
            fornecedor: c.fornecedor,
            date: fmt(daysAgo(c.data))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 4. VENDAS — vendas realizadas
    // ═══════════════════════════════════════════════════════════
    var vendas = [
        { nome: 'Venda Boi Gordo JBS', cabecas: 45, pesoMedio: 520, valor: 225000, lote: 'Engorda Premium', comprador: 'Frigorífico JBS', data: 5 },
        { nome: 'Venda Vacas Descarte', cabecas: 20, pesoMedio: 400, valor: 60000, lote: 'Descarte', comprador: 'Frigorífico Marfrig', data: 12 },
        { nome: 'Venda Bezerros Leilão', cabecas: 30, pesoMedio: 220, valor: 72000, lote: 'Bezerras Misael', comprador: 'Leilão Nação Nelore', data: 25 },
        { nome: 'Venda Engorda Subaco', cabecas: 35, pesoMedio: 490, valor: 171500, lote: 'Engorda Subaco', comprador: 'Frigorífico Minerva', data: 8 }
    ];

    vendas.forEach(function (v, idx) {
        window.data.events.push({
            type: 'VENDA',
            id: 'DEMO-V' + idx + '-' + Date.now(),
            nome: v.nome,
            desc: v.nome,
            qty: v.cabecas,
            cabecas: v.cabecas,
            peso: v.pesoMedio,
            pesoMedio: v.pesoMedio,
            value: v.valor,
            lote: v.lote,
            comprador: v.comprador,
            date: fmt(daysAgo(v.data))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 5. MANEJO SANITÁRIO — completo
    // ═══════════════════════════════════════════════════════════
    var manejos = [
        // Vacinações obrigatórias
        { lote: 'Engorda Premium', tipo: 'Vacinação', produto: 'Aftosa', custo: 600, obs: 'Campanha Mai/2026', data: 3 },
        { lote: 'Engorda Subaco', tipo: 'Vacinação', produto: 'Aftosa', custo: 475, obs: 'Campanha Mai/2026', data: 3 },
        { lote: 'Vacas Matrizes', tipo: 'Vacinação', produto: 'Brucelose', custo: 520, obs: 'Bezerras 3-8 meses', data: 15 },
        { lote: 'Vacas Matrizes', tipo: 'Vacinação', produto: 'Aftosa', custo: 650, obs: 'Campanha Obrigatória', data: 3 },
        // Vermifugações
        { lote: 'Recria Chico', tipo: 'Vermifugação', produto: 'Ivermectina 3.15%', custo: 1400, obs: 'Controle berne/carrapato', data: 10 },
        { lote: 'Bezerros Desmama', tipo: 'Vermifugação', produto: 'Doramectina', custo: 900, obs: 'Pós-desmama', data: 20 },
        { lote: 'Recria Iris', tipo: 'Vermifugação', produto: 'Albendazol', custo: 770, obs: 'Protocolo trimestral', data: 8 },
        // Suplementação
        { lote: 'Engorda Premium', tipo: 'Suplementação', produto: 'Sal Proteinado 40%', custo: 3500, obs: 'Suplementação engorda', data: 5 },
        { lote: 'Engorda Rio', tipo: 'Suplementação', produto: 'Sal mineral', custo: 1800, obs: 'Reposição mensal', data: 7 },
        { lote: 'Lote Sindi', tipo: 'Suplementação', produto: 'Sal mineral', custo: 1200, obs: 'Suplementação Sindi', data: 12 },
        // Reprodução
        { lote: 'Novilhas IATF', tipo: 'Reprodução', produto: 'IATF - Protocolo', custo: 8500, obs: 'Protocolo IATF 55 novilhas - D0', data: 2 },
        { lote: 'Vacas Matrizes', tipo: 'Reprodução', produto: 'Diagnóstico Gestação', custo: 2600, obs: 'US 130 vacas - 78% prenhes', data: 30 },
        // Exames
        { lote: 'Touros Reprodutores', tipo: 'Exame', produto: 'Andrológico completo', custo: 3600, obs: '18 touros - 16 aptos', data: 25 },
        // Tratamentos
        { lote: 'Engorda Seminterio', tipo: 'Tratamento', produto: 'Antibiótico Oxitetraciclina', custo: 850, obs: '3 animais com tristeza', data: 6 },
        { lote: 'Vacas Paridas', tipo: 'Tratamento', produto: 'Anti-inflamatório', custo: 320, obs: '2 vacas pós-parto', data: 14 }
    ];

    manejos.forEach(function (m, idx) {
        window.data.events.push({
            type: 'MANEJO_SANITARIO',
            id: 'DEMO-M' + idx + '-' + Date.now(),
            lote: m.lote,
            tipo: m.tipo,
            produto: m.produto,
            custo: m.custo,
            cost: m.custo,
            desc: m.tipo + ' — ' + m.produto,
            obs: m.obs,
            date: fmt(daysAgo(m.data))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 6. PESAGENS — todas recentes
    // ═══════════════════════════════════════════════════════════
    lotes.forEach(function (l) {
        window.data.events.push({
            type: 'PESAGEM',
            lote: l.nome,
            peso: l.pesoMedio,
            qtd: l.qtdAnimais,
            gmd: (Math.random() * 0.4 + 0.6).toFixed(2),
            date: fmt(daysAgo(Math.floor(Math.random() * 20) + 1))
        });
        // Pesagem anterior para calcular GMD
        window.data.events.push({
            type: 'PESAGEM',
            lote: l.nome,
            peso: l.pesoMedio - Math.floor(Math.random() * 30 + 15),
            qtd: l.qtdAnimais,
            date: fmt(daysAgo(Math.floor(Math.random() * 20) + 30))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 7. ESTOQUE — completo
    // ═══════════════════════════════════════════════════════════
    var estoque = [
        // Medicamentos
        { item: 'Ivermectina 3.15%', qty: 25, unit: 'litros', cat: 'remedios', preco: 85 },
        { item: 'Doramectina', qty: 15, unit: 'litros', cat: 'remedios', preco: 120 },
        { item: 'Vacina Aftosa', qty: 500, unit: 'doses', cat: 'remedios', preco: 1.80 },
        { item: 'Vacina Brucelose B-19', qty: 100, unit: 'doses', cat: 'remedios', preco: 3.50 },
        { item: 'Vacina Clostridiose', qty: 300, unit: 'doses', cat: 'remedios', preco: 2.20 },
        { item: 'Oxitetraciclina LA', qty: 8, unit: 'frascos', cat: 'remedios', preco: 45 },
        { item: 'Anti-inflamatório Banamine', qty: 5, unit: 'frascos', cat: 'remedios', preco: 68 },
        // Nutrição (CORRIGIDO: era 'remedios', agora 'racao_sal')
        { item: 'Sal Mineral Premix', qty: 2000, unit: 'kg', cat: 'racao_sal', preco: 3.80 },
        { item: 'Sal Proteinado 40%', qty: 3000, unit: 'kg', cat: 'racao_sal', preco: 4.50 },
        { item: 'Ração 18% PB', qty: 5000, unit: 'kg', cat: 'racao_sal', preco: 2.10 },
        { item: 'Ureia Pecuária', qty: 500, unit: 'kg', cat: 'racao_sal', preco: 3.20 },
        // Materiais
        { item: 'Arame Farpado', qty: 120, unit: 'rolos', cat: 'obras', preco: 175 },
        { item: 'Arame Liso', qty: 40, unit: 'rolos', cat: 'obras', preco: 220 },
        { item: 'Mourão Eucalipto 2.2m', qty: 300, unit: 'un', cat: 'obras', preco: 35 },
        { item: 'Mourão Concreto', qty: 80, unit: 'un', cat: 'obras', preco: 65 },
        { item: 'Cimento CP-II', qty: 50, unit: 'sacos', cat: 'obras', preco: 38 },
        { item: 'Barra de Ferro 3/8', qty: 30, unit: 'barras', cat: 'obras', preco: 42 },
        { item: 'Diesel', qty: 800, unit: 'litros', cat: 'obras', preco: 6.50 }
    ];

    estoque.forEach(function (e) {
        window.data.events.push({
            type: 'ESTOQUE_ENTRADA',
            name: e.item,          // 'name' (padrão do estoque.js)
            desc: e.item,
            qty: e.qty,
            unit: e.unit,
            category: e.cat,       // 'category' (padrão do estoque.js)
            value: e.qty * e.preco, // Custo total
            valorUnitario: e.preco,
            date: fmt(daysAgo(Math.floor(Math.random() * 30)))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 8. CONTAS A PAGAR — financeiro completo
    // ═══════════════════════════════════════════════════════════
    var contas = [
        // Vencidas
        { nome: 'Veterinário Dr. Silva - Consultas', value: 4500, vencimento: fmtDate(daysAgo(3)), pago: false },
        { nome: 'Ração Nutriboi - Nota 4521', value: 12800, vencimento: fmtDate(daysAgo(1)), pago: false },
        // A vencer
        { nome: 'Combustível Posto Rural', value: 5200, vencimento: fmtDate(daysFromNow(5)), pago: false },
        { nome: 'Folha Funcionários Fev/26', value: 18500, vencimento: fmtDate(daysFromNow(3)), pago: false },
        { nome: 'INSS Rural', value: 3200, vencimento: fmtDate(daysFromNow(10)), pago: false },
        { nome: 'Energia Elétrica', value: 2100, vencimento: fmtDate(daysFromNow(8)), pago: false },
        { nome: 'Sêmen IATF - Genética Plus', value: 15000, vencimento: fmtDate(daysFromNow(15)), pago: false },
        { nome: 'Manutenção Trator', value: 6800, vencimento: fmtDate(daysFromNow(7)), pago: false },
        // Pagas
        { nome: 'Sal Mineral - Agrosul', value: 8500, vencimento: fmtDate(daysAgo(10)), pago: true },
        { nome: 'Vacina Aftosa', value: 3500, vencimento: fmtDate(daysAgo(15)), pago: true },
        { nome: 'Arame e Mourões', value: 9200, vencimento: fmtDate(daysAgo(20)), pago: true },
        { nome: 'Folha Funcionários Jan/26', value: 18500, vencimento: fmtDate(daysAgo(30)), pago: true }
    ];

    contas.forEach(function (c) {
        window.data.events.push({
            type: 'CONTA_PAGAR', nome: c.nome, value: c.value, vencimento: c.vencimento, pago: c.pago,
            date: fmt(daysAgo(Math.floor(Math.random() * 10)))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 9. FLUXO DE CAIXA — entradas e saídas
    // ═══════════════════════════════════════════════════════════
    // Entradas (vendas de gado)
    [{ desc: 'Venda 45 bois JBS', val: 225000, d: 5 }, { desc: 'Venda 20 vacas Marfrig', val: 60000, d: 12 },
    { desc: 'Venda bezerros leilão', val: 72000, d: 25 }, { desc: 'Venda 35 bois Minerva', val: 171500, d: 8 }
    ].forEach(function (e) {
        window.data.events.push({ type: 'FLUXO_ENTRADA', desc: e.desc, nome: e.desc, value: e.val, date: fmt(daysAgo(e.d)) });
    });

    // Saídas (despesas)
    [{ desc: 'Compra gado', val: 396000, d: 15 }, { desc: 'Ração', val: 12800, d: 5 }, { desc: 'Diesel', val: 5200, d: 7 },
    { desc: 'Funcionários', val: 18500, d: 2 }, { desc: 'Veterinário', val: 4500, d: 3 }, { desc: 'Materiais cerca', val: 9200, d: 20 },
    { desc: 'Manutenção', val: 6800, d: 10 }, { desc: 'Energia', val: 2100, d: 8 }
    ].forEach(function (e) {
        window.data.events.push({ type: 'FLUXO_SAIDA', desc: e.desc, nome: e.desc, value: e.val, date: fmt(daysAgo(e.d)) });
    });

    // ═══════════════════════════════════════════════════════════
    // 10. CHUVA / CLIMA
    // ═══════════════════════════════════════════════════════════
    [45, 0, 12, 28, 0, 0, 35, 8, 0, 22, 15, 0, 0, 18, 42, 0, 5, 0, 30, 0, 0, 10, 25, 0, 0, 0, 8, 20, 0, 0].forEach(function (mm, i) {
        if (mm > 0) {
            window.data.events.push({ type: 'CHUVA', mm: mm, date: fmt(daysAgo(i)) });
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 11. FUNCIONÁRIOS
    // ═══════════════════════════════════════════════════════════
    [
        { nome: 'José Carlos Silva', funcao: 'Vaqueiro Chefe', salario: 3200 },
        { nome: 'Antônio Pereira', funcao: 'Vaqueiro', salario: 2800 },
        { nome: 'Francisco Lima', funcao: 'Vaqueiro', salario: 2800 },
        { nome: 'Pedro Souza', funcao: 'Tratorista', salario: 3000 },
        { nome: 'Manoel Santos', funcao: 'Cercador', salario: 2500 },
        { nome: 'João Oliveira', funcao: 'Peão', salario: 2200 },
        { nome: 'Maria da Silva', funcao: 'Cozinheira', salario: 2000 },
        { nome: 'Carlos Eduardo', funcao: 'Gerente de Campo', salario: 4500 }
    ].forEach(function (f) {
        window.data.events.push({
            type: 'FUNCIONARIO', nome: f.nome, funcao: f.funcao, salario: f.salario, status: 'ATIVO', date: fmt(daysAgo(180))
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 12. CABEÇAS INDIVIDUAIS (animais de destaque)
    // ═══════════════════════════════════════════════════════════
    var brincos = [
        { brinco: 'FAZ-001', nome: 'Imperador', raca: 'Nelore PO', sexo: 'M', peso: 720, lote: 'Touros Reprodutores', pasto: 'area de descanso', nasc: '2020-04-15', obs: 'Touro reprodutor principal - DEP top 1%' },
        { brinco: 'FAZ-002', nome: 'Gladiador', raca: 'Nelore PO', sexo: 'M', peso: 690, lote: 'Touros Reprodutores', pasto: 'area de descanso', nasc: '2020-08-22', obs: 'Touro PO reserva' },
        { brinco: 'FAZ-100', nome: 'Estrela', raca: 'Nelore PO', sexo: 'F', peso: 480, lote: 'Vacas Matrizes', pasto: 'manga das vacas', nasc: '2019-03-10', obs: 'Melhor matriz - 6 crias' },
        { brinco: 'FAZ-101', nome: 'Bonança', raca: 'Nelore', sexo: 'F', peso: 460, lote: 'Vacas Matrizes', pasto: 'manga das vacas', nasc: '2019-07-05', obs: 'Matriz excelente - mãe de touros PO' },
        { brinco: 'FAZ-200', nome: 'Trovão', raca: 'Angus', sexo: 'M', peso: 650, lote: 'Touros Reprodutores', pasto: 'area de descanso', nasc: '2021-01-20', obs: 'Touro Angus para cruzamento industrial' },
    ];

    brincos.forEach(function (a) {
        window.data.events.push({
            type: 'CABECA', brinco: a.brinco, nome: a.nome, raca: a.raca, sexo: a.sexo, peso: a.peso,
            lote: a.lote, pasto: a.pasto, nascimento: a.nasc, obs: a.obs, status: 'ATIVO', date: fmt(daysAgo(90))
        });
    });

    // Salvar tudo
    window.data.save();

    // Limpar centro do mapa
    try { localStorage.removeItem('agromacro_mapa_center'); } catch (e) { }
    // Limpar cache de polígonos para forçar reload com novos dados
    try { localStorage.removeItem('agromacro_mapa_pastos'); } catch (e) { }

    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('🐄 AGROMACRO — DADOS COMPLETOS CARREGADOS!');
    console.log('════════════════════════════════════════════════════');
    console.log('📊 ' + totalCab + ' cabeças em ' + lotes.length + ' lotes');
    console.log('🔨 ' + obras.length + ' obras (' + obras.filter(function (o) { return !o.dataFim; }).length + ' em andamento)');
    console.log('💉 ' + manejos.length + ' manejos sanitários');
    console.log('🛒 ' + compras.length + ' compras | 💵 ' + vendas.length + ' vendas');
    console.log('📦 ' + estoque.length + ' itens de estoque');
    console.log('💸 ' + contas.length + ' contas a pagar');
    console.log('👷 8 funcionários');
    console.log('🐄 5 cabeças individuais registradas');
    console.log('════════════════════════════════════════════════════');

})();
