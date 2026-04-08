// ====== EventValidator.js — Validação Formal de Eventos ======
// Implementa validação de schema para todos os tipos de evento
window.EventValidator = (function() {
    'use strict';

    const SCHEMAS = {
        [EventTypes.COMPRA]: {
            required: ['qty', 'value'],
            optional: ['weight', 'loteId', 'observacoes'],
            types: { qty: 'number', value: 'number', weight: 'number' }
        },
        [EventTypes.VENDA]: {
            required: ['qty', 'value'],
            optional: ['weight', 'loteId', 'comprador', 'observacoes'],
            types: { qty: 'number', value: 'number', weight: 'number' }
        },
        [EventTypes.LOTE]: {
            required: ['nome'],
            optional: ['categoria', 'quantidade', 'pastoId', 'observacoes'],
            types: { quantidade: 'number' }
        },
        [EventTypes.ESTOQUE_ENTRADA]: {
            required: ['name'],
            optional: ['quantity', 'value', 'category', 'unidade', 'observacoes'],
            types: { quantity: 'number', value: 'number' }
        },
        [EventTypes.MANEJO]: {
            required: ['desc'],
            optional: ['tipoManejo', 'loteId', 'value', 'observacoes'],
            types: { value: 'number' }
        },
        [EventTypes.OBRA_REGISTRO]: {
            required: ['nome'],
            optional: ['value', 'dataInicio', 'dataFim', 'observacoes'],
            types: { value: 'number' }
        },
        [EventTypes.CONTA_PAGAR]: {
            required: ['value'],
            optional: ['descricao', 'vencimento', 'status', 'categoria', 'pago', 'observacoes'],
            types: { value: 'number', pago: 'boolean' }
        },
        [EventTypes.FUNCIONARIO_CADASTRO]: {
            required: ['nome'],
            optional: ['funcao', 'salario', 'telefone', 'observacoes'],
            types: { salario: 'number' }
        }
    };

    function validateEvent(event) {
        const errors = [];

        if (!event.type) {
            errors.push('Campo "type" é obrigatório');
        } else if (!EventTypes[event.type]) {
            errors.push('Tipo de evento desconhecido: ' + event.type);
        }

        if (event.type && SCHEMAS[event.type]) {
            const schema = SCHEMAS[event.type];
            schema.required.forEach(function(field) {
                if (event[field] === undefined || event[field] === null) {
                    errors.push('Campo obrigatório faltando: ' + field);
                }
            });
            if (schema.types) {
                Object.keys(schema.types).forEach(function(field) {
                    if (event[field] !== undefined && event[field] !== null) {
                        const expectedType = schema.types[field];
                        const actualType = typeof event[field];
                        if (actualType !== expectedType) {
                            errors.push('Tipo inválido para ' + field + ': esperado ' + expectedType + ', recebido ' + actualType);
                        }
                    }
                });
            }
        }

        return { valid: errors.length === 0, errors: errors };
    }

    function assertValid(event) {
        const result = validateEvent(event);
        if (!result.valid) {
            throw new Error('Evento inválido: ' + result.errors.join(', '));
        }
        return true;
    }

    return { validateEvent: validateEvent, assertValid: assertValid, SCHEMAS: Object.freeze({...SCHEMAS}) };
})();