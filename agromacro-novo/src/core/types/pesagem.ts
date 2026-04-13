export type PesagemSyncStatus = 'pending' | 'synced'

export interface Pesagem {
  id: string
  loteId: string
  loteNome: string
  data: string // ISO date
  pesoMedio: number // kg por cabeça
  cabecas: number
  pesoTotal: number // pesoMedio * cabecas
  responsavel: string
  observacao?: string
  createdAt: string
  syncStatus: PesagemSyncStatus
}

export interface CreatePesagemInput {
  loteId: string
  loteNome: string
  data: string
  pesoMedio: number
  cabecas: number
  responsavel: string
  observacao?: string
}

export interface GmdResult {
  loteId: string
  loteNome: string
  gmd: number | null // kg/dia — null se menos de 2 pesagens
  diasEntrePesagens: number | null
  pesoAtual: number | null
  pesoAnterior: number | null
  ganhoTotal: number | null // kg desde a primeira pesagem
  totalPesagens: number
  ultimaPesagem: string | null // ISO date
}
