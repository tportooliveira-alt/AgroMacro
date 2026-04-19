export type CompraGadoSyncStatus = 'pending' | 'synced'

export type CompraGadoCategoria = 'cria' | 'recria' | 'engorda' | 'matrizes' | 'touros'

export type CompraGadoStatus = 'pendente' | 'concluida' | 'cancelada'

export interface CompraGado {
  id: string
  data: string
  fornecedor: string
  cabecas: number
  pesoMedio: number
  valorCabeca: number
  valorTotal: number
  categoria: CompraGadoCategoria
  loteDestino: string
  responsavel: string
  observacao: string
  status: CompraGadoStatus
  createdAt: string
  syncStatus: CompraGadoSyncStatus
}

export interface CreateCompraGadoInput {
  data: string
  fornecedor: string
  cabecas: number
  pesoMedio: number
  valorCabeca: number
  categoria: CompraGadoCategoria
  loteDestino?: string
  responsavel?: string
  observacao?: string
}
