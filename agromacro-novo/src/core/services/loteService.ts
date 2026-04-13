import { STORAGE_KEYS } from '../config/storage'
import type {
  CreateLoteInput,
  Lote,
  LoteMovimentacao,
  LoteSyncStatus,
  TransferirLoteInput,
} from '../types/lote'
import type { AcaoPasto, Pasto } from '../types/pasto'
import type { Funcionario } from '../types/funcionario'

function readFromStorage(key: string): Lote[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Lote[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function writeToStorage(key: string, data: Lote[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function readAny<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as T[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function writeAny<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildLote(input: CreateLoteInput, status: LoteSyncStatus): Lote {
  return {
    id: crypto.randomUUID(),
    nome: input.nome,
    categoria: input.categoria,
    cabecas: input.cabecas,
    pesoMedio: input.pesoMedio,
    pastoAtual: input.pastoAtual?.trim() ?? '',
    status: 'ativo',
    createdAt: new Date().toISOString(),
    syncStatus: status,
  }
}

async function sendToServer(item: Lote) {
  await new Promise((resolve) => setTimeout(resolve, 180))
  return { ...item, syncStatus: 'synced' as LoteSyncStatus }
}

function registrarAcaoTrocaPasto(
  pastoId: string,
  descricao: string,
  responsavel: string,
  data: string,
  syncStatus: LoteSyncStatus,
) {
  const acoes = readAny<AcaoPasto>(STORAGE_KEYS.acoesPasto)
  const acao: AcaoPasto = {
    id: crypto.randomUUID(),
    pastoId,
    tipo: 'troca_pasto',
    descricao,
    responsavel,
    data,
    syncStatus,
  }
  writeAny(STORAGE_KEYS.acoesPasto, [...acoes, acao])
}

export const loteService = {
  list() {
    return readFromStorage(STORAGE_KEYS.lotes)
  },

  listMovimentacoes(loteId?: string) {
    const all = readAny<LoteMovimentacao>(STORAGE_KEYS.lotesMovimentacoes)
    return loteId ? all.filter((item) => item.loteId === loteId) : all
  },

  getQueue() {
    return readFromStorage(STORAGE_KEYS.lotesQueue)
  },

  getOnlineState() {
    return navigator.onLine
  },

  verificarInconsistencias() {
    const lotes = this.list()
    const pastos = readAny<Pasto>(STORAGE_KEYS.pastos)
    const alertas: string[] = []

    // lote duplicado (mesmo nome, ambos ativos)
    const nomesAtivos = lotes
      .filter((l) => l.status === 'ativo')
      .map((l) => normalizeText(l.nome))
    const duplicados = nomesAtivos.filter((nome, idx) => nomesAtivos.indexOf(nome) !== idx)
    for (const nome of new Set(duplicados)) {
      alertas.push(`Lote duplicado: "${nome}" aparece mais de uma vez como ativo.`)
    }

    // lote ativo apontando para pasto inexistente
    const nomesPastos = new Set(pastos.map((p) => normalizeText(p.nome)))
    for (const lote of lotes.filter((l) => l.status === 'ativo' && l.pastoAtual)) {
      if (!nomesPastos.has(normalizeText(lote.pastoAtual))) {
        alertas.push(`Lote "${lote.nome}" aponta para pasto inexistente: "${lote.pastoAtual}".`)
      }
    }

    // pasto marcado como ocupado mas sem lote apontando para ele
    for (const pasto of pastos.filter((p) => p.status === 'ocupado')) {
      const lotesNoPasto = lotes.filter(
        (l) => l.status === 'ativo' && normalizeText(l.pastoAtual) === normalizeText(pasto.nome),
      )
      if (lotesNoPasto.length === 0) {
        alertas.push(`Pasto "${pasto.nome}" esta como ocupado mas nenhum lote ativo aponta para ele.`)
      }
    }

    // vários lotes ativos no mesmo pasto
    const pastagemPorPasto = new Map<string, string[]>()
    for (const lote of lotes.filter((l) => l.status === 'ativo' && l.pastoAtual)) {
      const chave = normalizeText(lote.pastoAtual)
      const atual = pastagemPorPasto.get(chave) ?? []
      pastagemPorPasto.set(chave, [...atual, lote.nome])
    }
    for (const [pasto, lotesNoPasto] of pastagemPorPasto.entries()) {
      if (lotesNoPasto.length > 1) {
        alertas.push(`Pasto "${pasto}" tem ${lotesNoPasto.length} lotes ativos: ${lotesNoPasto.join(', ')}.`)
      }
    }

    return alertas
  },

  async add(input: CreateLoteInput) {
    const current = this.list()

    // bloquear nome duplicado
    const nomeNovo = normalizeText(input.nome)
    const existeNome = current.some(
      (item) => item.status === 'ativo' && normalizeText(item.nome) === nomeNovo,
    )
    if (existeNome) {
      throw new Error(`Ja existe um lote ativo com o nome "${input.nome}".`)
    }

    if (this.getOnlineState()) {
      const synced = await sendToServer(buildLote(input, 'synced'))
      writeToStorage(STORAGE_KEYS.lotes, [...current, synced])
      return synced
    }

    const pending = buildLote(input, 'pending')
    writeToStorage(STORAGE_KEYS.lotes, [...current, pending])
    writeToStorage(STORAGE_KEYS.lotesQueue, [...this.getQueue(), pending])
    return pending
  },

  async inativar(id: string) {
    const current = this.list()
    const updated = current.map((item) => {
      if (item.id === id) {
        return { ...item, status: 'inativo' as const }
      }
      return item
    })
    writeToStorage(STORAGE_KEYS.lotes, updated)
    return updated
  },

  async transferirPasto(input: TransferirLoteInput) {
    const loteId = input.loteId.trim()
    const destinoPasto = input.destinoPasto.trim()
    const responsavel = input.responsavel.trim()
    const bloquearPastoEmObra = input.bloquearPastoEmObra ?? true

    if (!loteId) {
      throw new Error('Lote obrigatorio para movimentacao.')
    }
    if (!destinoPasto) {
      throw new Error('Pasto destino obrigatorio.')
    }
    if (!responsavel) {
      throw new Error('Responsavel obrigatorio para movimentacao.')
    }

    const lotes = this.list()
    const lote = lotes.find((item) => item.id === loteId)
    if (!lote) {
      throw new Error('Lote nao encontrado.')
    }
    if (lote.status !== 'ativo') {
      throw new Error('Lote inativo nao pode ser movimentado.')
    }

    const origemPasto = lote.pastoAtual.trim()
    if (normalizeText(origemPasto) === normalizeText(destinoPasto)) {
      throw new Error('Pasto destino deve ser diferente do pasto atual.')
    }

    const pastos = readAny<Pasto>(STORAGE_KEYS.pastos)
    const destino = pastos.find((pasto) => normalizeText(pasto.nome) === normalizeText(destinoPasto))
    if (!destino) {
      throw new Error('Pasto destino nao encontrado.')
    }
    if (bloquearPastoEmObra && destino.status === 'em_obra') {
      throw new Error('Pasto destino em obra. Movimentacao bloqueada.')
    }

    const funcionarios = readAny<Funcionario>(STORAGE_KEYS.funcionarios)
    const responsavelAtivo = funcionarios.find(
      (item) => normalizeText(item.nome) === normalizeText(responsavel),
    )
    if (responsavelAtivo && !responsavelAtivo.ativo) {
      throw new Error('Funcionario inativo nao pode registrar movimentacao.')
    }

    const now = new Date().toISOString()
    const syncStatus: LoteSyncStatus = navigator.onLine ? 'synced' : 'pending'

    const lotesAtualizados = lotes.map((item) => {
      if (item.id !== lote.id) {
        return item
      }
      return {
        ...item,
        pastoAtual: destino.nome,
        syncStatus,
      }
    })
    writeToStorage(STORAGE_KEYS.lotes, lotesAtualizados)

    const pastosAtualizados = pastos.map((pasto) => {
      if (origemPasto && normalizeText(pasto.nome) === normalizeText(origemPasto)) {
        const mantendoOutroLote = normalizeText(pasto.loteAtual) !== normalizeText(lote.nome)
        if (mantendoOutroLote) {
          return pasto
        }

        return {
          ...pasto,
          loteAtual: '',
          status: 'em_descanso' as const,
          syncStatus,
        }
      }

      if (pasto.id === destino.id) {
        return {
          ...pasto,
          loteAtual: lote.nome,
          status: 'ocupado' as const,
          syncStatus,
        }
      }

      return pasto
    })
    writeAny(STORAGE_KEYS.pastos, pastosAtualizados)

    const historico = this.listMovimentacoes()
    const movimentacao: LoteMovimentacao = {
      id: crypto.randomUUID(),
      loteId: lote.id,
      loteNome: lote.nome,
      origemPasto,
      destinoPasto: destino.nome,
      responsavel,
      data: now,
      syncStatus,
    }
    writeAny(STORAGE_KEYS.lotesMovimentacoes, [...historico, movimentacao])

    const origemDescricao = origemPasto || 'sem pasto'
    registrarAcaoTrocaPasto(
      destino.id,
      `Lote ${lote.nome} movido de ${origemDescricao} para ${destino.nome}.`,
      responsavel,
      now,
      syncStatus,
    )

    if (origemPasto) {
      const origem = pastos.find((pasto) => normalizeText(pasto.nome) === normalizeText(origemPasto))
      if (origem) {
        registrarAcaoTrocaPasto(
          origem.id,
          `Lote ${lote.nome} saiu para ${destino.nome}.`,
          responsavel,
          now,
          syncStatus,
        )
      }
    }

    return movimentacao
  },

  async syncPending() {
    if (!this.getOnlineState()) {
      return
    }

    const queue = this.getQueue()
    if (queue.length === 0) {
      return
    }

    const syncedItems: Lote[] = []
    for (const item of queue) {
      const synced = await sendToServer(item)
      syncedItems.push(synced)
    }

    const current = this.list()
    const syncedMap = new Map(syncedItems.map((item) => [item.id, item]))
    const updated = current.map((item) => syncedMap.get(item.id) ?? item)

    writeToStorage(STORAGE_KEYS.lotes, updated)
    writeToStorage(STORAGE_KEYS.lotesQueue, [])
  },
}
