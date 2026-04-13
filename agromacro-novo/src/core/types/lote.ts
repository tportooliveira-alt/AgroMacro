export type LoteSyncStatus = 'pending' | 'synced'

export interface Lote {
  id: string
  nome: string
  categoria: 'cria' | 'recria' | 'engorda' | 'matrizes'
  cabecas: number
  pesoMedio: number
  pastoAtual: string
  status: 'ativo' | 'inativo'
  createdAt: string
  syncStatus: LoteSyncStatus
}

export interface LoteMovimentacao {
  id: string
  loteId: string
  loteNome: string
  origemPasto: string
  destinoPasto: string
  responsavel: string
  data: string
  syncStatus: LoteSyncStatus
}

export interface CreateLoteInput {
  nome: string
  categoria: 'cria' | 'recria' | 'engorda' | 'matrizes'
  cabecas: number
  pesoMedio: number
  pastoAtual?: string
}

export interface TransferirLoteInput {
  loteId: string
  destinoPasto: string
  responsavel: string
  bloquearPastoEmObra?: boolean
}
