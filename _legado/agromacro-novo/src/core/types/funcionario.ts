export type FuncionarioSyncStatus = 'pending' | 'synced'

export interface Funcionario {
  id: string
  nome: string
  funcao: string
  pagamento: 'salario_mensal' | 'diaria' | 'empreiteiro'
  valor: number
  telefone: string
  cpf: string
  ativo: boolean
  createdAt: string
  syncStatus: FuncionarioSyncStatus
}

export interface CreateFuncionarioInput {
  nome: string
  funcao: string
  pagamento: 'salario_mensal' | 'diaria' | 'empreiteiro'
  valor: number
  telefone: string
  cpf: string
}
