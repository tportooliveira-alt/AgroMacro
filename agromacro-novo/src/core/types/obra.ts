export type ObraSyncStatus = 'pending' | 'synced'

export type ObraTipo =
  | 'cerca'
  | 'curral'
  | 'bebedouro'
  | 'aguada'
  | 'galpao'
  | 'estrada'
  | 'outro'

export type ObraStatus = 'planejada' | 'em_andamento' | 'concluida' | 'pausada'

export interface Obra {
  id: string
  titulo: string
  descricao: string
  tipo: ObraTipo
  status: ObraStatus
  dataInicio: string
  dataPrevisao: string
  pasto: string
  responsavel: string
  custoOrcado: number
  custoReal: number
  observacao: string
  createdAt: string
  syncStatus: ObraSyncStatus
}

export interface CreateObraInput {
  titulo: string
  descricao?: string
  tipo: ObraTipo
  dataInicio: string
  dataPrevisao?: string
  pasto?: string
  responsavel?: string
  custoOrcado?: number
  observacao?: string
}
