// ====== SEED DATA — Dados realistas para testes ======
// Executar no console do browser: copiar e colar tudo, ou incluir temporariamente no index.html
(function () {
    'use strict';

    // Limpar dados anteriores para começar fresco
    window.data.events = [];

    var today = new Date();
    function daysAgo(n) {
        var d = new Date(today);
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    }

    function saveEv(ev) {
        if (!ev.timestamp) ev.timestamp = new Date().toISOString();
        window.data.saveEvent(ev);
    }

    // ═══════════════════════════════════════════════════
    // 1. PASTOS (4 piquetes)
    // ═══════════════════════════════════════════════════
    var pastos = [
        { nome: 'Piquete Norte', area: 25, tipo: 'Brachiária Marandu', status: 'ATIVO' },
        { nome: 'Piquete Sul', area: 30, tipo: 'Mombaça', status: 'ATIVO' },
        { nome: 'Retiro Água Limpa', area: 40, tipo: 'Brachiária Brizantha', status: 'ATIVO' },
        { nome: 'Reserva Leste', area: 20, tipo: 'Tifton 85', status: 'ATIVO' }
    ];

    pastos.forEach(function (p) {
        saveEv({
            type: 'PASTO',
            nome: p.nome,
            area: p.area,
            tipoCapim: p.tipo,
            status: p.status,
            date: daysAgo(180)
        });
    });

    // ═══════════════════════════════════════════════════
    // 2. LOTES (6 lotes ativos)
    // ═══════════════════════════════════════════════════
    var lotes = [
        {
            nome: 'Engorda 01', categoria: 'engorda', raca: 'Nelore',
            qtdAnimais: 80, pesoMedio: 420, pasto: 'Piquete Norte',
            dataEntrada: daysAgo(90), salMineral: 'Tortuga Phós 60',
            salConsumo: 60, racao: 'Ração Engorda Plus', racaoConsumo: 8,
            obs: 'Lote principal de engorda, previsão de abate em 60 dias'
        },
        {
            nome: 'Engorda 02', categoria: 'engorda', raca: 'Angus x Nelore',
            qtdAnimais: 55, pesoMedio: 380, pasto: 'Piquete Sul',
            dataEntrada: daysAgo(60), salMineral: 'Tortuga Phós 60',
            salConsumo: 60, racao: 'Ração Engorda Plus', racaoConsumo: 10,
            obs: 'Lote cruzamento industrial, alto potencial de GMD'
        },
        {
            nome: 'Recria Nelore', categoria: 'recria', raca: 'Nelore',
            qtdAnimais: 120, pesoMedio: 280, pasto: 'Retiro Água Limpa',
            dataEntrada: daysAgo(150), salMineral: 'Sal Recria Matsuda',
            salConsumo: 40, racao: '', racaoConsumo: 0,
            obs: 'Novilhos em recria a pasto, transição para engorda em 90 dias'
        },
        {
            nome: 'Matrizes Reprodução', categoria: 'matrizes', raca: 'Nelore PO',
            qtdAnimais: 45, pesoMedio: 450, pasto: 'Reserva Leste',
            dataEntrada: daysAgo(365), salMineral: 'Sal Maternidade Guabi',
            salConsumo: 80, racao: '', racaoConsumo: 0,
            obs: '45 vacas em reprodução — última IATF em novembro'
        },
        {
            nome: 'Bezerros 2025', categoria: 'cria', raca: 'Nelore',
            qtdAnimais: 32, pesoMedio: 180, pasto: 'Reserva Leste',
            dataEntrada: daysAgo(120), salMineral: 'Sal Bezerro Premix',
            salConsumo: 30, racao: 'Creep Feeding', racaoConsumo: 2,
            obs: 'Bezerros nascidos na safra 2025, creep feeding ativo'
        },
        {
            nome: 'Touros Elite', categoria: 'touros', raca: 'Nelore PO',
            qtdAnimais: 8, pesoMedio: 650, pasto: 'Piquete Norte',
            dataEntrada: daysAgo(300), salMineral: 'Sal Reprodutores',
            salConsumo: 100, racao: '', racaoConsumo: 0,
            obs: '8 touros provados para monta natural — temporada março/junho'
        }
    ];

    lotes.forEach(function (l) {
        saveEv({
            type: 'LOTE',
            nome: l.nome,
            categoria: l.categoria,
            raca: l.raca,
            qtdAnimais: l.qtdAnimais,
            pesoMedio: l.pesoMedio,
            pasto: l.pasto,
            dataEntrada: l.dataEntrada,
            salMineral: l.salMineral,
            salConsumo: l.salConsumo,
            racao: l.racao,
            racaoConsumo: l.racaoConsumo,
            obs: l.obs,
            status: 'ATIVO',
            date: l.dataEntrada
        });
    });

    // ═══════════════════════════════════════════════════
    // 3. COMPRAS DE GADO (4 compras)
    // ═══════════════════════════════════════════════════
    var compras = [
        {
            qty: 80, peso: 320, value: 192000,
            desc: '80 garrotes Nelore — Fazenda São Pedro',
            fornecedor: 'José da Silva - Faz. São Pedro',
            lote: 'Engorda 01', date: daysAgo(90),
            custoCabeca: 2400, custoArroba: 225
        },
        {
            qty: 55, peso: 300, value: 148500,
            desc: '55 novilhos Angus x Nelore — Leilão Barretos',
            fornecedor: 'Leilão Rural Barretos',
            lote: 'Engorda 02', date: daysAgo(60),
            custoCabeca: 2700, custoArroba: 270
        },
        {
            qty: 120, peso: 200, value: 180000,
            desc: '120 bezerros Nelore desmamados — Faz. Boa Vista',
            fornecedor: 'Antônio Pereira - Faz. Boa Vista',
            lote: 'Recria Nelore', date: daysAgo(150),
            custoCabeca: 1500, custoArroba: 225
        },
        {
            qty: 8, peso: 600, value: 160000,
            desc: '8 touros Nelore PO provados — CEIP',
            fornecedor: 'Agropecuária Estrela',
            lote: 'Touros Elite', date: daysAgo(300),
            custoCabeca: 20000, custoArroba: 1000
        }
    ];

    compras.forEach(function (c) {
        saveEv({
            type: 'COMPRA',
            qty: c.qty,
            peso: c.peso,
            value: c.value,
            desc: c.desc,
            fornecedor: c.fornecedor,
            lote: c.lote,
            custoCabeca: c.custoCabeca,
            custoArroba: c.custoArroba,
            date: c.date
        });
    });

    // ═══════════════════════════════════════════════════
    // 4. VENDAS DE GADO (3 vendas)
    // ═══════════════════════════════════════════════════
    var vendas = [
        {
            qty: 35, peso: 520, value: 163800,
            desc: '35 bois gordos acabados — Frigorífico JBS',
            comprador: 'JBS Lins/SP',
            lote: 'Engorda 01', date: daysAgo(15),
            precoArroba: 270
        },
        {
            qty: 20, peso: 380, value: 68400,
            desc: '20 novilhas Nelore — Pecuarista local',
            comprador: 'Carlos Mendes - Faz. Esperança',
            lote: 'Recria Nelore', date: daysAgo(30),
            precoArroba: 270
        },
        {
            qty: 10, peso: 480, value: 43200,
            desc: '10 bois terminados — Marfrig',
            comprador: 'Marfrig Promissão/SP',
            lote: 'Engorda 02', date: daysAgo(7),
            precoArroba: 270
        }
    ];

    vendas.forEach(function (v) {
        saveEv({
            type: 'VENDA',
            qty: v.qty,
            peso: v.peso,
            value: v.value,
            desc: v.desc,
            comprador: v.comprador,
            lote: v.lote,
            precoArroba: v.precoArroba,
            date: v.date
        });
    });

    // ═══════════════════════════════════════════════════
    // 5. ESTOQUE — Nutrição (ração, sal, milho, silagem)
    // ═══════════════════════════════════════════════════
    var estoqueNutricao = [
        { name: 'Ração Engorda Plus', category: 'racao_sal', qty: 200, unit: 'sacos 40kg', valorUnitario: 112, value: 22400 },
        { name: 'Tortuga Phós 60', category: 'racao_sal', qty: 80, unit: 'sacos 25kg', valorUnitario: 112.50, value: 9000 },
        { name: 'Sal Recria Matsuda', category: 'racao_sal', qty: 40, unit: 'sacos 25kg', valorUnitario: 85, value: 3400 },
        { name: 'Sal Maternidade Guabi', category: 'racao_sal', qty: 30, unit: 'sacos 25kg', valorUnitario: 95, value: 2850 },
        { name: 'Sal Bezerro Premix', category: 'racao_sal', qty: 20, unit: 'sacos 25kg', valorUnitario: 105, value: 2100 },
        { name: 'Sal Reprodutores', category: 'racao_sal', qty: 15, unit: 'sacos 25kg', valorUnitario: 130, value: 1950 },
        { name: 'Creep Feeding', category: 'racao_sal', qty: 50, unit: 'sacos 40kg', valorUnitario: 98, value: 4900 },
        { name: 'Milho Grão', category: 'racao_sal', qty: 300, unit: 'sacos 60kg', valorUnitario: 57, value: 17100 },
        { name: 'Silagem de Milho', category: 'racao_sal', qty: 1, unit: 'tonelada', valorUnitario: 350, value: 52500 },
        { name: 'Farelo de Soja', category: 'racao_sal', qty: 100, unit: 'sacos 50kg', valorUnitario: 110, value: 11000 },
        { name: 'Caroço de Algodão', category: 'racao_sal', qty: 80, unit: 'sacos 30kg', valorUnitario: 42, value: 3360 },
        { name: 'Ureia Pecuária', category: 'racao_sal', qty: 20, unit: 'sacos 25kg', valorUnitario: 85, value: 1700 }
    ];

    estoqueNutricao.forEach(function (item) {
        saveEv({
            type: 'ESTOQUE_ENTRADA',
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            valorUnitario: item.valorUnitario,
            value: item.value,
            date: daysAgo(Math.floor(Math.random() * 60) + 30)
        });
    });

    // ═══════════════════════════════════════════════════
    // 6. ESTOQUE — Sanidade (vacinas, remédios, vermífugos)
    // ═══════════════════════════════════════════════════
    var estoqueSanidade = [
        { name: 'Vacina Aftosa', category: 'remedios', qty: 500, unit: 'doses', valorUnitario: 3.50, value: 1750 },
        { name: 'Vacina Brucelose B19', category: 'remedios', qty: 100, unit: 'doses', valorUnitario: 5.20, value: 520 },
        { name: 'Vacina Raiva Bovina', category: 'remedios', qty: 400, unit: 'doses', valorUnitario: 2.80, value: 1120 },
        { name: 'Vacina Carbúnculo', category: 'remedios', qty: 400, unit: 'doses', valorUnitario: 1.90, value: 760 },
        { name: 'Ivermectina 1% (Gold)', category: 'remedios', qty: 30, unit: 'frascos 500ml', valorUnitario: 38, value: 1140 },
        { name: 'Albendazol 10%', category: 'remedios', qty: 20, unit: 'frascos 1L', valorUnitario: 28, value: 560 },
        { name: 'Terramicina LA', category: 'remedios', qty: 15, unit: 'frascos 50ml', valorUnitario: 45, value: 675 },
        { name: 'Ourofino Flunixin', category: 'remedios', qty: 10, unit: 'frascos 50ml', valorUnitario: 52, value: 520 },
        { name: 'Lepecid Spray (mata-bicheira)', category: 'remedios', qty: 12, unit: 'frascos', valorUnitario: 32, value: 384 },
        { name: 'Cipermetrina Pour-On', category: 'remedios', qty: 8, unit: 'frascos 1L', valorUnitario: 65, value: 520 },
        { name: 'Complexo Vitamínico ADE', category: 'remedios', qty: 15, unit: 'frascos 500ml', valorUnitario: 35, value: 525 },
        { name: 'Ocitocina', category: 'remedios', qty: 10, unit: 'frascos 50ml', valorUnitario: 18, value: 180 }
    ];

    estoqueSanidade.forEach(function (item) {
        saveEv({
            type: 'ESTOQUE_ENTRADA',
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            valorUnitario: item.valorUnitario,
            value: item.value,
            date: daysAgo(Math.floor(Math.random() * 90) + 15)
        });
    });

    // ═══════════════════════════════════════════════════
    // 7. ESTOQUE — Infraestrutura / Obras
    // ═══════════════════════════════════════════════════
    var estoqueObras = [
        { name: 'Arame Farpado Belgo', category: 'obras', qty: 30, unit: 'rolos 500m', valorUnitario: 280, value: 8400 },
        { name: 'Mourão de Eucalipto', category: 'obras', qty: 200, unit: 'unidades', valorUnitario: 22, value: 4400 },
        { name: 'Cocho de Sal 2m (Fibra)', category: 'obras', qty: 8, unit: 'unidades', valorUnitario: 350, value: 2800 },
        { name: 'Bebedouro Australiano 3000L', category: 'obras', qty: 2, unit: 'unidades', valorUnitario: 1800, value: 3600 },
        { name: 'Tela Soldada para Curral', category: 'obras', qty: 15, unit: 'chapas', valorUnitario: 190, value: 2850 },
        { name: 'Cimento CP-II 50kg', category: 'obras', qty: 40, unit: 'sacos', valorUnitario: 38, value: 1520 }
    ];

    estoqueObras.forEach(function (item) {
        saveEv({
            type: 'ESTOQUE_ENTRADA',
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            valorUnitario: item.valorUnitario,
            value: item.value,
            date: daysAgo(Math.floor(Math.random() * 120) + 30)
        });
    });

    // ═══════════════════════════════════════════════════
    // 8. MANEJOS (pesagens, vacinações, vermifugações)
    // ═══════════════════════════════════════════════════
    var manejos = [
        // Pesagens
        { lote: 'Engorda 01', tipoManejo: 'pesagem', pesoMedio: 350, qtd: 80, desc: 'Pesagem de entrada', date: daysAgo(90), cost: 0 },
        { lote: 'Engorda 01', tipoManejo: 'pesagem', pesoMedio: 385, qtd: 80, desc: 'Pesagem 30 dias', date: daysAgo(60), cost: 0 },
        { lote: 'Engorda 01', tipoManejo: 'pesagem', pesoMedio: 420, qtd: 80, desc: 'Pesagem 60 dias', date: daysAgo(30), cost: 0 },
        { lote: 'Engorda 02', tipoManejo: 'pesagem', pesoMedio: 310, qtd: 55, desc: 'Pesagem de entrada', date: daysAgo(60), cost: 0 },
        { lote: 'Engorda 02', tipoManejo: 'pesagem', pesoMedio: 380, qtd: 55, desc: 'Pesagem 30 dias', date: daysAgo(30), cost: 0 },
        { lote: 'Recria Nelore', tipoManejo: 'pesagem', pesoMedio: 210, qtd: 120, desc: 'Pesagem de entrada', date: daysAgo(150), cost: 0 },
        { lote: 'Recria Nelore', tipoManejo: 'pesagem', pesoMedio: 245, qtd: 120, desc: 'Pesagem 60 dias', date: daysAgo(90), cost: 0 },
        { lote: 'Recria Nelore', tipoManejo: 'pesagem', pesoMedio: 280, qtd: 120, desc: 'Pesagem 120 dias', date: daysAgo(30), cost: 0 },
        { lote: 'Bezerros 2025', tipoManejo: 'pesagem', pesoMedio: 120, qtd: 32, desc: 'Pesagem nascimento', date: daysAgo(120), cost: 0 },
        { lote: 'Bezerros 2025', tipoManejo: 'pesagem', pesoMedio: 180, qtd: 32, desc: 'Pesagem 90 dias', date: daysAgo(30), cost: 0 },

        // Vacinações
        { lote: 'Engorda 01', tipoManejo: 'vacinacao', pesoMedio: null, qtd: 80, desc: 'Vacinação Aftosa — campanha estadual', date: daysAgo(75), cost: 280 },
        { lote: 'Engorda 02', tipoManejo: 'vacinacao', pesoMedio: null, qtd: 55, desc: 'Vacinação Aftosa — campanha estadual', date: daysAgo(55), cost: 192.50 },
        { lote: 'Recria Nelore', tipoManejo: 'vacinacao', pesoMedio: null, qtd: 120, desc: 'Vacinação Aftosa + Carbúnculo', date: daysAgo(80), cost: 648 },
        { lote: 'Matrizes Reprodução', tipoManejo: 'vacinacao', pesoMedio: null, qtd: 45, desc: 'Vacinação Aftosa + Brucelose', date: daysAgo(70), cost: 391.50 },
        { lote: 'Bezerros 2025', tipoManejo: 'vacinacao', pesoMedio: null, qtd: 32, desc: 'Vacinação Aftosa + Raiva', date: daysAgo(65), cost: 201.60 },

        // Vermifugação
        { lote: 'Engorda 01', tipoManejo: 'vermifugacao', pesoMedio: null, qtd: 80, desc: 'Ivermectina 1% — carrapato + berne', date: daysAgo(45), cost: 320 },
        { lote: 'Engorda 02', tipoManejo: 'vermifugacao', pesoMedio: null, qtd: 55, desc: 'Ivermectina 1%', date: daysAgo(40), cost: 220 },
        { lote: 'Recria Nelore', tipoManejo: 'vermifugacao', pesoMedio: null, qtd: 120, desc: 'Albendazol 10% + Ivermectina', date: daysAgo(50), cost: 720 },
        { lote: 'Bezerros 2025', tipoManejo: 'vermifugacao', pesoMedio: null, qtd: 32, desc: 'Doramectina (bezerros)', date: daysAgo(35), cost: 192 },

        // Outros
        { lote: 'Matrizes Reprodução', tipoManejo: 'reprodutivo', pesoMedio: null, qtd: 45, desc: 'IATF — protocolo completo (3ª dose)', date: daysAgo(45), cost: 4500 },
        { lote: 'Engorda 01', tipoManejo: 'sanitario', pesoMedio: null, qtd: 5, desc: 'Tratamento bicheira — 5 animais', date: daysAgo(20), cost: 160 },
        { lote: 'Recria Nelore', tipoManejo: 'sanitario', pesoMedio: null, qtd: 3, desc: 'Tratamento Tristeza Parasitária — 3 animais', date: daysAgo(25), cost: 450 }
    ];

    manejos.forEach(function (m) {
        saveEv({
            type: 'MANEJO',
            lote: m.lote,
            tipoManejo: m.tipoManejo,
            pesoMedio: m.pesoMedio,
            qtd: m.qtd,
            desc: m.desc,
            cost: m.cost,
            date: m.date
        });
    });

    // ═══════════════════════════════════════════════════
    // 9. ABASTECIMENTOS (sal + ração nos lotes)
    // ═══════════════════════════════════════════════════
    var abastecimentos = [
        // Engorda 01
        { lote: 'Engorda 01', produto: 'sal', sacos: 8, kgPorSaco: 25, qtdKg: 200, date: daysAgo(85) },
        { lote: 'Engorda 01', produto: 'sal', sacos: 8, kgPorSaco: 25, qtdKg: 200, date: daysAgo(45) },
        { lote: 'Engorda 01', produto: 'sal', sacos: 8, kgPorSaco: 25, qtdKg: 200, date: daysAgo(10) },
        { lote: 'Engorda 01', produto: 'racao', sacos: 40, kgPorSaco: 40, qtdKg: 1600, date: daysAgo(80) },
        { lote: 'Engorda 01', produto: 'racao', sacos: 40, kgPorSaco: 40, qtdKg: 1600, date: daysAgo(55) },
        { lote: 'Engorda 01', produto: 'racao', sacos: 40, kgPorSaco: 40, qtdKg: 1600, date: daysAgo(30) },
        { lote: 'Engorda 01', produto: 'racao', sacos: 40, kgPorSaco: 40, qtdKg: 1600, date: daysAgo(5) },

        // Engorda 02
        { lote: 'Engorda 02', produto: 'sal', sacos: 6, kgPorSaco: 25, qtdKg: 150, date: daysAgo(55) },
        { lote: 'Engorda 02', produto: 'sal', sacos: 6, kgPorSaco: 25, qtdKg: 150, date: daysAgo(15) },
        { lote: 'Engorda 02', produto: 'racao', sacos: 30, kgPorSaco: 40, qtdKg: 1200, date: daysAgo(50) },
        { lote: 'Engorda 02', produto: 'racao', sacos: 30, kgPorSaco: 40, qtdKg: 1200, date: daysAgo(25) },
        { lote: 'Engorda 02', produto: 'racao', sacos: 30, kgPorSaco: 40, qtdKg: 1200, date: daysAgo(3) },

        // Recria
        { lote: 'Recria Nelore', produto: 'sal', sacos: 10, kgPorSaco: 25, qtdKg: 250, date: daysAgo(140) },
        { lote: 'Recria Nelore', produto: 'sal', sacos: 10, kgPorSaco: 25, qtdKg: 250, date: daysAgo(95) },
        { lote: 'Recria Nelore', produto: 'sal', sacos: 10, kgPorSaco: 25, qtdKg: 250, date: daysAgo(50) },
        { lote: 'Recria Nelore', produto: 'sal', sacos: 10, kgPorSaco: 25, qtdKg: 250, date: daysAgo(8) },

        // Matrizes
        { lote: 'Matrizes Reprodução', produto: 'sal', sacos: 6, kgPorSaco: 25, qtdKg: 150, date: daysAgo(60) },
        { lote: 'Matrizes Reprodução', produto: 'sal', sacos: 6, kgPorSaco: 25, qtdKg: 150, date: daysAgo(20) },

        // Bezerros
        { lote: 'Bezerros 2025', produto: 'sal', sacos: 3, kgPorSaco: 25, qtdKg: 75, date: daysAgo(100) },
        { lote: 'Bezerros 2025', produto: 'sal', sacos: 3, kgPorSaco: 25, qtdKg: 75, date: daysAgo(50) },
        { lote: 'Bezerros 2025', produto: 'racao', sacos: 10, kgPorSaco: 40, qtdKg: 400, date: daysAgo(90) },
        { lote: 'Bezerros 2025', produto: 'racao', sacos: 10, kgPorSaco: 40, qtdKg: 400, date: daysAgo(45) },
        { lote: 'Bezerros 2025', produto: 'racao', sacos: 10, kgPorSaco: 40, qtdKg: 400, date: daysAgo(5) },

        // Touros
        { lote: 'Touros Elite', produto: 'sal', sacos: 4, kgPorSaco: 25, qtdKg: 100, date: daysAgo(90) },
        { lote: 'Touros Elite', produto: 'sal', sacos: 4, kgPorSaco: 25, qtdKg: 100, date: daysAgo(30) }
    ];

    abastecimentos.forEach(function (ab) {
        saveEv({
            type: 'ABASTECIMENTO',
            lote: ab.lote,
            produto: ab.produto,
            sacos: ab.sacos,
            kgPorSaco: ab.kgPorSaco,
            qtdKg: ab.qtdKg,
            date: ab.date
        });
    });

    // ═══════════════════════════════════════════════════
    // 10. MORTALIDADES (3 baixas)
    // ═══════════════════════════════════════════════════
    saveEv({ type: 'MORTALIDADE', lote: 'Engorda 01', qty: 2, motivo: 'doenca', obs: 'Tristeza parasitária — não responderam ao tratamento', date: daysAgo(40) });
    saveEv({ type: 'MORTALIDADE', lote: 'Recria Nelore', qty: 1, motivo: 'acidente', obs: 'Queda em barranco — fratura exposta', date: daysAgo(55) });
    saveEv({ type: 'MORTALIDADE', lote: 'Bezerros 2025', qty: 1, motivo: 'predador', obs: 'Provável ataque de onça — encontrado no pasto', date: daysAgo(70) });

    // ═══════════════════════════════════════════════════
    // 11. TRANSFERÊNCIAS (1 transferência)
    // ═══════════════════════════════════════════════════
    saveEv({
        type: 'TRANSFERENCIA',
        loteOrigem: 'Recria Nelore',
        loteDestino: 'Engorda 02',
        qty: 15,
        date: daysAgo(20)
    });

    // ═══════════════════════════════════════════════════
    // 12. NASCIMENTOS (2 eventos)
    // ═══════════════════════════════════════════════════
    saveEv({ type: 'NASCIMENTO', lote: 'Matrizes Reprodução', qty: 18, pesoMedio: 32, sexo: 'misto', date: daysAgo(120) });
    saveEv({ type: 'NASCIMENTO', lote: 'Matrizes Reprodução', qty: 14, pesoMedio: 35, sexo: 'misto', date: daysAgo(100) });

    // ═══════════════════════════════════════════════════
    // 13. MOVIMENTAÇÕES DE PASTO
    // ═══════════════════════════════════════════════════
    saveEv({ type: 'MOVIMENTACAO_PASTO', lote: 'Engorda 01', pastoAnterior: 'Piquete Sul', pastoNovo: 'Piquete Norte', qtdAnimais: 80, date: daysAgo(45) });
    saveEv({ type: 'MOVIMENTACAO_PASTO', lote: 'Recria Nelore', pastoAnterior: 'Piquete Norte', pastoNovo: 'Retiro Água Limpa', qtdAnimais: 120, date: daysAgo(60) });

    // ═══════════════════════════════════════════════════
    // 14. CONTAS A PAGAR
    // ═══════════════════════════════════════════════════
    var contas = [
        { desc: 'Energia Elétrica — CEMIG', valor: 850, vencimento: daysAgo(-5), categoria: 'energia', status: 'pendente' },
        { desc: 'Combustível — Diesel trator', valor: 2400, vencimento: daysAgo(-10), categoria: 'combustivel', status: 'pendente' },
        { desc: 'Veterinário Dr. Marcelo — visita mensal', valor: 1200, vencimento: daysAgo(5), categoria: 'servicos', status: 'pago' },
        { desc: 'Parcela Financiamento Trator', valor: 4500, vencimento: daysAgo(-15), categoria: 'financiamento', status: 'pendente' },
        { desc: 'Salário Peão — João Silva', valor: 2800, vencimento: daysAgo(2), categoria: 'salarios', status: 'pago' },
        { desc: 'Salário Peão — Pedro Santos', valor: 2800, vencimento: daysAgo(2), categoria: 'salarios', status: 'pago' },
        { desc: 'Salário Encarregado — Marcos', valor: 4200, vencimento: daysAgo(2), categoria: 'salarios', status: 'pago' },
        { desc: 'Frete Ração — Transportadora Sol', valor: 1800, vencimento: daysAgo(-3), categoria: 'frete', status: 'pendente' }
    ];

    contas.forEach(function (c) {
        saveEv({
            type: 'CONTA_PAGAR',
            desc: c.desc,
            valor: c.valor,
            vencimento: c.vencimento,
            categoria: c.categoria,
            status: c.status,
            date: c.vencimento
        });
    });

    // ═══════════════════════════════════════════════════
    // 15. OBRAS (2 obras)
    // ═══════════════════════════════════════════════════
    saveEv({
        type: 'OBRA',
        nome: 'Reforma Curral de Manejo',
        desc: 'Troca de tronco, brete e seringa — aço galvanizado',
        status: 'em_andamento',
        workers: [
            { nome: 'Zé Carlos', funcao: 'Soldador', diaria: 250, dias: 8 },
            { nome: 'Tonho', funcao: 'Ajudante', diaria: 150, dias: 8 }
        ],
        date: daysAgo(25)
    });

    saveEv({
        type: 'OBRA',
        nome: 'Novo Bebedouro Piquete Sul',
        desc: 'Instalação de bebedouro Australiano 3000L com encanamento',
        status: 'concluido',
        workers: [
            { nome: 'Marcos', funcao: 'Encanador', diaria: 200, dias: 3 },
            { nome: 'Tonho', funcao: 'Ajudante', diaria: 150, dias: 3 }
        ],
        date: daysAgo(50)
    });

    // ═══════════════════════════════════════════════════
    // 16. FICHAS GENÉTICAS (Matrizes + Touros da fazenda)
    // ═══════════════════════════════════════════════════
    var fichasGeneticas = [
        // ── Matrizes (vacas do lote "Matrizes Reprodução") ──
        {
            brinco: '1001', nome: 'ANTARES PRINCESA', raca: 'Nelore PO', sexo: 'femea',
            pai: 'CFM IMPERADOR', mae: 'ANTARES BONANZA', linhagem: 'Karvadi x Godhavari',
            origem: 'PMGZ', iabcz: 8.5, deca: 2,
            deps: { PN: 0.3, P210: 10.2, MP210: 6.8, PAC: 7.5, AOL: 1.2, EGS: 0.3, PE: null, IPP: -5.0, P3P: 9.0 },
            obs: 'Boa mãe, leite excelente. Fraca em AOL — filhos vêm com pouca carcaça.'
        },
        {
            brinco: '1002', nome: 'ANTARES FORMOSA', raca: 'Nelore PO', sexo: 'femea',
            pai: 'AVATAR DA MATINHA', mae: 'ANTARES ESTRELA', linhagem: 'Supremo x Fabuloso',
            origem: 'PMGZ', iabcz: 10.2, deca: 1,
            deps: { PN: 0.1, P210: 13.5, MP210: 7.2, PAC: 8.0, AOL: 3.5, EGS: 0.7, PE: null, IPP: -7.0, P3P: 12.0 },
            obs: 'Vaca elite. Equilibrada em tudo. Filha do Avatar — leite de sobra.'
        },
        {
            brinco: '1003', nome: 'ANTARES RAINHA', raca: 'Nelore PO', sexo: 'femea',
            pai: 'REM REMANSO', mae: 'ANTARES LUZ', linhagem: 'Remanso x Karvadi',
            origem: 'PMGZ', iabcz: 6.0, deca: 3,
            deps: { PN: 1.2, P210: 8.5, MP210: 3.5, PAC: 4.2, AOL: 0.8, EGS: 0.2, PE: null, IPP: -2.0, P3P: 5.0 },
            obs: 'Leite fraco e carcaça fraca. Precisa de touro forte em MP210 + AOL pra compensar.'
        },
        {
            brinco: '1004', nome: 'ANTARES JADE', raca: 'Nelore PO', sexo: 'femea',
            pai: 'LANDAU DA DI GENIO', mae: 'ANTARES PÉROLA', linhagem: 'Karvadi x Taj Mahal',
            origem: 'PMGZ', iabcz: 12.0, deca: 1,
            deps: { PN: 1.8, P210: 18.0, MP210: 2.5, PAC: 5.0, AOL: 5.5, EGS: 0.9, PE: null, IPP: -8.5, P3P: 14.0 },
            obs: 'Filha do Landau — peso e carcaça excelentes, mas LEITE FRACO. Bezerro não desmama bem.'
        },
        {
            brinco: '1005', nome: 'ANTARES SAFIRA', raca: 'Nelore PO', sexo: 'femea',
            pai: 'BIG BEN STA NICE', mae: 'ANTARES ROSA', linhagem: 'Recanto x Celeiro',
            origem: 'ANCP', iabcz: null, mgte: 6.5, deca: 2,
            deps: { PN: -0.5, P210: 11.0, MP210: 5.5, PAC: 6.8, AOL: 2.0, EGS: 0.5, PE: null, IPP: -6.0, P3P: 8.0 },
            obs: 'Boa pra cria. Equilibrada, sem grandes defeitos mas sem brilho na carcaça.'
        },
        {
            brinco: '1006', nome: 'ANTARES DIAMANTE', raca: 'Nelore PO', sexo: 'femea',
            pai: 'CFM IMPERADOR', mae: 'ANTARES BONITA', linhagem: 'Karvadi x Godhavari',
            origem: 'PMGZ', iabcz: 9.0, deca: 2,
            deps: { PN: 0.0, P210: 12.0, MP210: 6.0, PAC: 7.0, AOL: 2.8, EGS: 0.6, PE: null, IPP: -5.5, P3P: 10.5 },
            obs: 'Filha do Imperador. Boa produção geral. Pode melhorar AOL com touro de carcaça.'
        },

        // ── Touros da fazenda (do lote "Touros Elite") ──
        {
            brinco: '8001', nome: 'ANTARES TROVÃO', raca: 'Nelore PO', sexo: 'macho',
            pai: 'CFM IMPERADOR', mae: 'ANTARES LUA', linhagem: 'Karvadi x Godhavari',
            origem: 'PMGZ', iabcz: 11.0, deca: 1,
            deps: { PN: 0.5, P210: 13.0, P365: 18.0, P450: 22.0, GPD: 48, MP210: 5.0, PE: 2.5, IPP: -6.0, AOL: 3.0, EGS: 0.55, MS: 0.40 },
            obs: 'Touro de monta natural — bom equilíbrio. Serve pra todas as vacas.'
        },
        {
            brinco: '8002', nome: 'ANTARES GUERREIRO', raca: 'Nelore PO', sexo: 'macho',
            pai: 'LANDAU DA DI GENIO', mae: 'ANTARES FORTUNA', linhagem: 'Karvadi x Taj Mahal',
            origem: 'PMGZ', iabcz: 15.5, deca: 1,
            deps: { PN: 1.0, P210: 16.5, P365: 23.0, P450: 28.5, GPD: 58, MP210: 3.8, PE: 3.2, IPP: -9.0, AOL: 5.0, EGS: 0.85, MS: 0.50 },
            obs: 'Filho do Landau — pesado e com carcaça. NÃO usar em novilha (PN alto).'
        }
    ];

    fichasGeneticas.forEach(function (f) {
        saveEv({
            type: 'FICHA_GENETICA',
            brinco: f.brinco,
            nome: f.nome,
            raca: f.raca,
            sexo: f.sexo,
            pai: f.pai,
            mae: f.mae,
            linhagem: f.linhagem,
            origem: f.origem,
            iabcz: f.iabcz || null,
            mgte: f.mgte || null,
            deca: f.deca,
            deps: f.deps,
            obs: f.obs,
            date: daysAgo(200)
        });
    });

    console.log('✅ SEED COMPLETO! Dados realistas carregados:');
    console.log('   🐄 6 lotes ativos');
    console.log('   🌾 4 pastos');
    console.log('   📦 30 itens de estoque (nutrição + sanidade + obras)');
    console.log('   💰 4 compras de gado');
    console.log('   💵 3 vendas de gado');
    console.log('   💉 22 manejos (pesagens, vacinações, vermifugações)');
    console.log('   🧂 25 abastecimentos');
    console.log('   💀 3 mortalidades');
    console.log('   🔄 1 transferência');
    console.log('   🐣 2 nascimentos');
    console.log('   📋 8 contas a pagar');
    console.log('   🔨 2 obras');
    console.log('   TOTAL: ' + window.data.events.length + ' eventos');

    alert('✅ Dados realistas carregados!\n\n' + window.data.events.length + ' eventos no sistema.\n\nRecarregue a página para ver tudo.');
})();
