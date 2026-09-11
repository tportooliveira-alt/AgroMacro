export type SyncStatus = 'pending' | 'synced'

export type CentroCusto =
  | 'GADO_CORTE'
  | 'NUTRICAO'
  | 'SANIDADE'
  | 'MAO_DE_OBRA'
  | 'INFRAESTRUTURA'
  | 'ADMINISTRATIVO'

export interface Operacao {
  id: string
  nome: string
  valor: number
  tipo: 'receita' | 'despesa'
  centroCusto: CentroCusto
  origemModulo?: 'pastos' | 'rebanho' | 'operacoes' | 'manual'
  referenciaId?: string
  observacao?: string
  createdAt: string
  syncStatus: SyncStatus
}

export interface CreateOperacaoInput {
  nome: string
  valor: number
  tipo?: 'receita' | 'despesa'
  centroCusto?: CentroCusto
  origemModulo?: 'pastos' | 'rebanho' | 'operacoes' | 'manual'
  referenciaId?: string
  observacao?: string
}
