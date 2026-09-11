export type PastoStatus = 'disponivel' | 'ocupado' | 'em_descanso' | 'em_obra'

export type AcaoTipo = 'troca_pasto' | 'obra' | 'manejo'

export interface Pasto {
  id: string
  nome: string
  area: number
  coords?: Array<[number, number]>
  areaOrigem?: 'manual' | 'mapa_real'
  capim: string
  aguada: boolean
  status: PastoStatus
  loteAtual: string
  createdAt: string
  syncStatus: 'pending' | 'synced'
}

export interface AcaoPasto {
  id: string
  pastoId: string
  tipo: AcaoTipo
  descricao: string
  responsavel: string
  custo?: number
  data: string
  syncStatus: 'pending' | 'synced'
}

export interface CreatePastoInput {
  nome: string
  area: number
  capim: string
  aguada: boolean
  loteAtual: string
}

export interface CreateAcaoInput {
  pastoId: string
  tipo: AcaoTipo
  descricao: string
  responsavel: string
  custo?: number
}
