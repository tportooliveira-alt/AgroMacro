import { STORAGE_KEYS } from '../config/storage'
import type { CompraGado, CompraGadoSyncStatus, CreateCompraGadoInput } from '../types/compraGado'

function readAll(): CompraGado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.comprasGado)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CompraGado[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(data: CompraGado[]) {
  localStorage.setItem(STORAGE_KEYS.comprasGado, JSON.stringify(data))
}

function readQueue(): CompraGado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.comprasGadoQueue)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CompraGado[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(data: CompraGado[]) {
  localStorage.setItem(STORAGE_KEYS.comprasGadoQueue, JSON.stringify(data))
}

function build(input: CreateCompraGadoInput, syncStatus: CompraGadoSyncStatus): CompraGado {
  const valorTotal = input.cabecas * input.valorCabeca
  return {
    id: crypto.randomUUID(),
    data: input.data,
    fornecedor: input.fornecedor.trim(),
    cabecas: input.cabecas,
    pesoMedio: input.pesoMedio,
    valorCabeca: input.valorCabeca,
    valorTotal,
    categoria: input.categoria,
    loteDestino: input.loteDestino?.trim() ?? '',
    responsavel: input.responsavel?.trim() ?? '',
    observacao: input.observacao?.trim() ?? '',
    status: 'concluida',
    createdAt: new Date().toISOString(),
    syncStatus,
  }
}

export const compraGadoService = {
  list() {
    return readAll()
  },

  async add(input: CreateCompraGadoInput) {
    const current = readAll()
    const syncStatus: CompraGadoSyncStatus = navigator.onLine ? 'synced' : 'pending'
    const item = build(input, syncStatus)
    writeAll([...current, item])
    if (!navigator.onLine) {
      writeQueue([...readQueue(), item])
    }
    return item
  },

  async cancelar(id: string) {
    const updated = readAll().map((item) =>
      item.id === id ? { ...item, status: 'cancelada' as const } : item,
    )
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
    const all = readAll().filter((c) => c.status === 'concluida')
    const totalCabecas = all.reduce((acc, c) => acc + c.cabecas, 0)
    const totalGasto = all.reduce((acc, c) => acc + c.valorTotal, 0)
    return { totalCompras: all.length, totalCabecas, totalGasto }
  },
}
