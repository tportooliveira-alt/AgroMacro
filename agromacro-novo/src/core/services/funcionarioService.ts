import { STORAGE_KEYS } from '../config/storage'
import type {
  CreateFuncionarioInput,
  Funcionario,
  FuncionarioSyncStatus,
} from '../types/funcionario'

function formatPhoneBr(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone.trim()
}

function readFromStorage(key: string): Funcionario[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Funcionario[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function writeToStorage(key: string, data: Funcionario[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function buildFuncionario(
  input: CreateFuncionarioInput,
  status: FuncionarioSyncStatus,
): Funcionario {
  return {
    id: crypto.randomUUID(),
    nome: input.nome,
    funcao: input.funcao,
    pagamento: input.pagamento,
    valor: input.valor,
    telefone: input.telefone,
    cpf: input.cpf,
    ativo: true,
    createdAt: new Date().toISOString(),
    syncStatus: status,
  }
}

async function sendToServer(item: Funcionario) {
  await new Promise((resolve) => setTimeout(resolve, 180))
  return { ...item, syncStatus: 'synced' as FuncionarioSyncStatus }
}

export const funcionarioService = {
  list() {
    return readFromStorage(STORAGE_KEYS.funcionarios)
  },

  getQueue() {
    return readFromStorage(STORAGE_KEYS.funcionariosQueue)
  },

  getOnlineState() {
    return navigator.onLine
  },

  async add(input: CreateFuncionarioInput) {
    const nome = input.nome.trim()
    const funcao = input.funcao.trim()
    const cpf = input.cpf.replace(/\D/g, '')
    const telefoneDigits = input.telefone.replace(/\D/g, '')

    if (!nome) {
      throw new Error('Nome do funcionario e obrigatorio.')
    }
    if (!funcao) {
      throw new Error('Funcao e obrigatoria.')
    }
    if (cpf.length !== 11) {
      throw new Error('CPF obrigatorio com 11 digitos.')
    }
    if (telefoneDigits.length !== 10 && telefoneDigits.length !== 11) {
      throw new Error('Telefone deve ter DDD e 8 ou 9 digitos.')
    }

    const current = this.list()
    const existeCpf = current.some((item) => item.cpf.replace(/\D/g, '') === cpf)
    if (existeCpf) {
      throw new Error('Ja existe funcionario com este CPF.')
    }

    const inputNormalizado: CreateFuncionarioInput = {
      ...input,
      nome,
      funcao,
      cpf,
      telefone: formatPhoneBr(input.telefone),
    }

    if (this.getOnlineState()) {
      const synced = await sendToServer(buildFuncionario(inputNormalizado, 'synced'))
      writeToStorage(STORAGE_KEYS.funcionarios, [...current, synced])
      return synced
    }

    const pending = buildFuncionario(inputNormalizado, 'pending')
    writeToStorage(STORAGE_KEYS.funcionarios, [...current, pending])
    writeToStorage(STORAGE_KEYS.funcionariosQueue, [...this.getQueue(), pending])
    return pending
  },

  async inativar(id: string) {
    const current = this.list()
    const updated = current.map((item) => {
      if (item.id === id) {
        return { ...item, ativo: false }
      }
      return item
    })
    writeToStorage(STORAGE_KEYS.funcionarios, updated)
    return updated
  },

  async reativar(id: string) {
    const current = this.list()
    const updated = current.map((item) => {
      if (item.id === id) {
        return { ...item, ativo: true }
      }
      return item
    })
    writeToStorage(STORAGE_KEYS.funcionarios, updated)
    return updated
  },

  async syncPending() {
    if (!this.getOnlineState()) {
      return
    }

    const queue = this.getQueue()
    if (queue.length === 0) {
      return
    }

    const syncedItems: Funcionario[] = []
    for (const item of queue) {
      const synced = await sendToServer(item)
      syncedItems.push(synced)
    }

    const current = this.list()
    const syncedMap = new Map(syncedItems.map((item) => [item.id, item]))
    const updated = current.map((item) => syncedMap.get(item.id) ?? item)

    writeToStorage(STORAGE_KEYS.funcionarios, updated)
    writeToStorage(STORAGE_KEYS.funcionariosQueue, [])
  },
}
