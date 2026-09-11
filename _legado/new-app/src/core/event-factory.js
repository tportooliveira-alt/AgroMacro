export const EventTypes = {
    MANEJO: 'MANEJO',
    ENTRADA_ESTOQUE: 'ENTRADA_ESTOQUE',
    SAIDA_ESTOQUE: 'SAIDA_ESTOQUE',
    COMPRA_ANIMAL: 'COMPRA_ANIMAL',
    VENDA_ANIMAL: 'VENDA_ANIMAL'
};

export function createEvent(type, data = {}, user = {}) {
    const timestamp = new Date().toISOString();
    const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const base = {
        id,
        tipo: type,
        data: timestamp,
        lote_id: data.lote_id || null,
        item_id: data.item_id || null,
        valor: Number(data.valor) || 0,
        quantidade: Number(data.quantidade) || 0,
        origem: data.origem || 'new-app',
        user_id: user.uid || 'anon'
    };
    switch (type) {
        case EventTypes.ENTRADA_ESTOQUE:
            base.afeta_estoque = true;
            base.afeta_caixa = true;
            base.valor = -Math.abs(base.valor);
            base.quantidade = Math.abs(base.quantidade);
            break;
        case EventTypes.SAIDA_ESTOQUE:
            base.afeta_estoque = true;
            base.afeta_caixa = false;
            base.quantidade = -Math.abs(base.quantidade);
            break;
        case EventTypes.COMPRA_ANIMAL:
            base.afeta_estoque = false;
            base.afeta_caixa = true;
            base.valor = -Math.abs(base.valor);
            base.quantidade = Math.abs(base.quantidade);
            break;
        case EventTypes.VENDA_ANIMAL:
            base.afeta_estoque = false;
            base.afeta_caixa = true;
            base.valor = Math.abs(base.valor);
            base.quantidade = -Math.abs(base.quantidade);
            break;
        case EventTypes.MANEJO:
        default:
            base.afeta_estoque = false;
            base.afeta_caixa = false;
            base.quantidade = Math.abs(base.quantidade);
            break;
    }
    return base;
}
