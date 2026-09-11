// Modelo de dados do AgroMacro - fazenda de pecuaria de corte.
// Todas as entidades sao referenciadas por id (nunca por nome).

export type Id = string

export interface Fazenda {
  nome: string
  proprietario: string
  municipio: string
  /** Cotacao da arroba do boi gordo em R$ */
  cotacaoArroba: number
  /** Rendimento de carcaca usado para converter peso vivo em @ (ex.: 0.52) */
  rendimentoCarcaca: number
}

export type PastoStatus = 'disponivel' | 'ocupado' | 'descanso' | 'reforma'

export interface Pasto {
  id: Id
  nome: string
  areaHa: number
  capim: string
  aguada: boolean
  /** 'descanso' e 'reforma' sao definidos manualmente; 'ocupado' e derivado dos lotes. */
  statusManual: 'disponivel' | 'descanso' | 'reforma'
  /** Poligono [lat, lng] quando importado do mapa da fazenda */
  coords?: Array<[number, number]>
  criadoEm: string
}

export type CategoriaLote = 'bezerros' | 'recria' | 'engorda' | 'matrizes' | 'touros'
export type SexoLote = 'M' | 'F' | 'misto'

export interface Lote {
  id: Id
  nome: string
  categoria: CategoriaLote
  sexo: SexoLote
  cabecas: number
  pesoMedioKg: number
  pastoId: Id | null
  ativo: boolean
  criadoEm: string
}

export interface Movimentacao {
  id: Id
  loteId: Id
  dePastoId: Id | null
  paraPastoId: Id
  data: string
  responsavel: string
  obs: string
}

export interface Pesagem {
  id: Id
  loteId: Id
  data: string
  pesoMedioKg: number
  cabecas: number
  responsavel: string
  obs: string
}

export type TipoManejo =
  | 'vacina'
  | 'vermifugo'
  | 'carrapaticida'
  | 'medicamento'
  | 'suplementacao'
  | 'castracao'
  | 'marcacao'
  | 'outro'

export interface Manejo {
  id: Id
  loteId: Id
  tipo: TipoManejo
  produto: string
  data: string
  custo: number
  responsavel: string
  obs: string
  lancamentoId: Id | null
}

export interface Compra {
  id: Id
  data: string
  fornecedor: string
  loteId: Id
  cabecas: number
  pesoMedioKg: number
  precoArroba: number
  valorTotal: number
  lancamentoId: Id
}

export interface Venda {
  id: Id
  data: string
  comprador: string
  loteId: Id
  cabecas: number
  pesoMedioKg: number
  precoArroba: number
  valorTotal: number
  lancamentoId: Id
}

export type TipoLancamento = 'receita' | 'despesa'

export type CategoriaLancamento =
  | 'compra_gado'
  | 'venda_gado'
  | 'sanidade'
  | 'nutricao'
  | 'mao_de_obra'
  | 'pastagem'
  | 'infraestrutura'
  | 'administrativo'
  | 'outro'

export interface Lancamento {
  id: Id
  data: string
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  loteId: Id | null
  /** Origem automatica (compra, venda, manejo). Nulo quando lancado a mao. */
  origem: { tipo: 'compra' | 'venda' | 'manejo'; id: Id } | null
}

export interface Funcionario {
  id: Id
  nome: string
  funcao: string
  telefone: string
  salario: number
  ativo: boolean
  criadoEm: string
}

export interface Db {
  versao: 1
  fazenda: Fazenda
  pastos: Pasto[]
  lotes: Lote[]
  movimentacoes: Movimentacao[]
  pesagens: Pesagem[]
  manejos: Manejo[]
  compras: Compra[]
  vendas: Venda[]
  lancamentos: Lancamento[]
  funcionarios: Funcionario[]
}

export const CATEGORIAS_LOTE: Array<{ value: CategoriaLote; label: string }> = [
  { value: 'bezerros', label: 'Bezerros(as) - cria' },
  { value: 'recria', label: 'Garrotes / Novilhas - recria' },
  { value: 'engorda', label: 'Bois - engorda' },
  { value: 'matrizes', label: 'Vacas - matrizes' },
  { value: 'touros', label: 'Touros' },
]

export const TIPOS_MANEJO: Array<{ value: TipoManejo; label: string }> = [
  { value: 'vacina', label: 'Vacina' },
  { value: 'vermifugo', label: 'Vermifugo' },
  { value: 'carrapaticida', label: 'Carrapaticida / mosca' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'suplementacao', label: 'Suplementacao / sal' },
  { value: 'castracao', label: 'Castracao' },
  { value: 'marcacao', label: 'Marcacao / brinco' },
  { value: 'outro', label: 'Outro' },
]

export const CATEGORIAS_LANCAMENTO: Array<{ value: CategoriaLancamento; label: string }> = [
  { value: 'compra_gado', label: 'Compra de gado' },
  { value: 'venda_gado', label: 'Venda de gado' },
  { value: 'sanidade', label: 'Sanidade' },
  { value: 'nutricao', label: 'Nutricao / sal / racao' },
  { value: 'mao_de_obra', label: 'Mao de obra' },
  { value: 'pastagem', label: 'Pastagem / cerca' },
  { value: 'infraestrutura', label: 'Infraestrutura / obras' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'outro', label: 'Outro' },
]

export const CAPINS = [
  'Braquiaria (Brachiaria brizantha)',
  'Braquiaria decumbens',
  'Mombaca',
  'Tanzania',
  'Tifton',
  'Andropogon',
  'Capim nativo',
  'Outro',
]
