import { STORAGE_KEYS } from '../config/storage'
import type { CreateOperacaoInput, Operacao, SyncStatus } from '../types/operacao'

function readFromStorage(key: string): Operacao[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Operacao[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function writeToStorage(key: string, data: Operacao[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function buildOperacao(input: CreateOperacaoInput, status: SyncStatus): Operacao {
  return {
    id: crypto.randomUUID(),
    nome: input.nome,
    valor: input.valor,
    tipo: input.tipo ?? 'despesa',
    centroCusto: input.centroCusto ?? 'ADMINISTRATIVO',
    origemModulo: input.origemModulo ?? 'manual',
    referenciaId: input.referenciaId,
    observacao: input.observacao,
    createdAt: new Date().toISOString(),
    syncStatus: status,
  }
}

async function sendToServer(item: Operacao) {
  // Simulacao remota; trocar por Firebase/REST real.
  await new Promise((resolve) => setTimeout(resolve, 180))
  return { ...item, syncStatus: 'synced' as SyncStatus }
}

export const onlineSyncService = {
  listOperacoes() {
    return readFromStorage(STORAGE_KEYS.operacoes)
  },

  getQueue() {
    return readFromStorage(STORAGE_KEYS.queue)
  },

  getOnlineState() {
    return navigator.onLine
  },

  subscribeOnlineState(callback: (online: boolean) => void) {
    const onOnline = () => callback(true)
    const onOffline = () => callback(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  },

  async addOperacao(input: CreateOperacaoInput) {
    const current = this.listOperacoes()

    if (this.getOnlineState()) {
      const synced = await sendToServer(buildOperacao(input, 'synced'))
      writeToStorage(STORAGE_KEYS.operacoes, [...current, synced])
      return synced
    }

    const pending = buildOperacao(input, 'pending')
    writeToStorage(STORAGE_KEYS.operacoes, [...current, pending])
    writeToStorage(STORAGE_KEYS.queue, [...this.getQueue(), pending])
    return pending
  },

  async syncPending() {
    if (!this.getOnlineState()) {
      return
    }

    const queue = this.getQueue()
    if (queue.length === 0) {
      return
    }

    const syncedItems: Operacao[] = []
    for (const item of queue) {
      const synced = await sendToServer(item)
      syncedItems.push(synced)
    }

    const current = this.listOperacoes()
    const syncedMap = new Map(syncedItems.map((item) => [item.id, item]))
    const updated = current.map((item) => syncedMap.get(item.id) ?? item)

    writeToStorage(STORAGE_KEYS.operacoes, updated)
    writeToStorage(STORAGE_KEYS.queue, [])
  },
}
