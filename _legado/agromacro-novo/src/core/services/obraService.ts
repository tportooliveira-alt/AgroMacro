import { STORAGE_KEYS } from '../config/storage'
import type { CreateObraInput, Obra, ObraSyncStatus, ObraStatus } from '../types/obra'

function readAll(): Obra[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.obras)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Obra[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(data: Obra[]) {
  localStorage.setItem(STORAGE_KEYS.obras, JSON.stringify(data))
}

function readQueue(): Obra[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.obrasQueue)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Obra[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(data: Obra[]) {
  localStorage.setItem(STORAGE_KEYS.obrasQueue, JSON.stringify(data))
}

function build(input: CreateObraInput, syncStatus: ObraSyncStatus): Obra {
  return {
    id: crypto.randomUUID(),
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() ?? '',
    tipo: input.tipo,
    status: 'planejada',
    dataInicio: input.dataInicio,
    dataPrevisao: input.dataPrevisao ?? '',
    pasto: input.pasto?.trim() ?? '',
    responsavel: input.responsavel?.trim() ?? '',
    custoOrcado: input.custoOrcado ?? 0,
    custoReal: 0,
    observacao: input.observacao?.trim() ?? '',
    createdAt: new Date().toISOString(),
    syncStatus,
  }
}

export const obraService = {
  list() {
    return readAll()
  },

  async add(input: CreateObraInput) {
    const current = readAll()
    const syncStatus: ObraSyncStatus = navigator.onLine ? 'synced' : 'pending'
    const item = build(input, syncStatus)
    writeAll([...current, item])
    if (!navigator.onLine) {
      writeQueue([...readQueue(), item])
    }
    return item
  },

  async atualizarStatus(id: string, status: ObraStatus, custoReal?: number) {
    const updated = readAll().map((item) => {
      if (item.id !== id) return item
      return {
        ...item,
        status,
        custoReal: custoReal !== undefined ? custoReal : item.custoReal,
      }
    })
    writeAll(updated)
  },

  async syncPending() {
    if (!navigator.onLine) return
    const queue = readQueue()
    if (queue.length === 0) return
    const current = readAll()
    const ids = new Set(queue.map((q) => q.id))
    const synced = current.map((item) =>
      ids.has(item.id) ? { ...item, syncStatus: 'synced' as const } : item,
    )
    writeAll(synced)
    writeQueue([])
  },

  getQueue() {
    return readQueue()
  },

  resumo() {
    const all = readAll()
    const emAndamento = all.filter((o) => o.status === 'em_andamento').length
    const planejadas = all.filter((o) => o.status === 'planejada').length
    const concluidas = all.filter((o) => o.status === 'concluida').length
    const custoTotal = all
      .filter((o) => o.status !== 'pausada')
      .reduce((acc, o) => acc + (o.custoReal > 0 ? o.custoReal : o.custoOrcado), 0)
    return { total: all.length, emAndamento, planejadas, concluidas, custoTotal }
  },
}
