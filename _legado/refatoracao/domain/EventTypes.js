// ====== EventTypes.js — Tipos de Eventos do Domínio ======
// Definição formal de todos os tipos de eventos suportados
window.EventTypes = Object.freeze({
    // Rebanho
    COMPRA: 'COMPRA',
    VENDA: 'VENDA',
    LOTE: 'LOTE',
    ANIMAL: 'ANIMAL',
    ANIMAL_LOTE: 'ANIMAL_LOTE',
    MANEJO: 'MANEJO',
    MANEJO_SANITARIO: 'MANEJO_SANITARIO',
    MOVIMENTACAO_PASTO: 'MOVIMENTACAO_PASTO',
    JUNCAO_LOTES: 'JUNCAO_LOTES',
    
    // Estoques e Insumos
    ESTOQUE_ENTRADA: 'ESTOQUE_ENTRADA',
    SAIDA_ESTOQUE: 'SAIDA_ESTOQUE',
    ABASTECIMENTO: 'ABASTECIMENTO',
    
    // Financeiro
    CONTA_PAGAR: 'CONTA_PAGAR',
    CONTA_RECEBER: 'CONTA_RECEBER',
    ESTORNO: 'ESTORNO',
    
    // Infraestrutura
    OBRA_REGISTRO: 'OBRA_REGISTRO',
    
    // Administrativo
    FUNCIONARIO_CADASTRO: 'FUNCIONARIO_CADASTRO',
    FUNCIONARIO_INATIVAR: 'FUNCIONARIO_INATIVAR',
    FUNCIONARIO: 'FUNCIONARIO'
});

// Centros de Custo
window.CenterCosts = Object.freeze({
    GADO_CORTE: 'GADO_CORTE',
    NUTRICAO: 'NUTRICAO',
    SANIDADE: 'SANIDADE',
    INFRAESTRUTURA: 'INFRAESTRUTURA',
    OPERACIONAL: 'OPERACIONAL',
    ADMINISTRACAO: 'ADMINISTRACAO',
    OUTROS: 'OUTROS'
});

// Status de Contas
window.AccountStatus = Object.freeze({
    PENDENTE: 'pendente',
    PAGO: 'pago',
    ATRASADO: 'atrasado',
    CANCELADO: 'cancelado'
});

// Interface de Evento (contrato formal)
window.IEvent = Object.freeze({
    id: 'string',
    type: 'string (EventTypes)',
    timestamp: 'ISO8601 string',
    date: 'YYYY-MM-DD string',
    centerCost: 'string (CenterCosts)',
    linkedEventIds: 'array<string>',
    value: 'number',
    estornado: 'boolean (optional)'
});