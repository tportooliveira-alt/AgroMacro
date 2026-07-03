import { STORAGE_KEYS } from '../config/storage'
import type {
  CreatePesagemInput,
  GmdResult,
  Pesagem,
} from '../types/pesagem'

function read(): Pesagem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pesagens)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Pesagem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(data: Pesagem[]) {
  localStorage.setItem(STORAGE_KEYS.pesagens, JSON.stringify(data))
}

async function sendToServer(_item: Pesagem): Promise<void> {
  // placeholder para sync futuro
  await new Promise((resolve) => setTimeout(resolve, 100))
}

export const pesagemService = {
  list(): Pesagem[] {
    return read()
  },

  listByLote(loteId: string): Pesagem[] {
    return read()
      .filter((p) => p.loteId === loteId)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  },

  async add(input: CreatePesagemInput): Promise<Pesagem> {
    const all = read()
    const nova: Pesagem = {
      id: crypto.randomUUID(),
      loteId: input.loteId,
      loteNome: input.loteNome,
      data: input.data,
      pesoMedio: input.pesoMedio,
      cabecas: input.cabecas,
      pesoTotal: input.pesoMedio * input.cabecas,
      responsavel: input.responsavel,
      observacao: input.observacao,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    }

    all.push(nova)
    write(all)

    try {
      await sendToServer(nova)
      const updated = read().map((p) =>
        p.id === nova.id ? { ...p, syncStatus: 'synced' as const } : p,
      )
      write(updated)
      return { ...nova, syncStatus: 'synced' }
    } catch {
      return nova
    }
  },

  remove(id: string): void {
    const updated = read().filter((p) => p.id !== id)
    write(updated)
  },

  /**
   * Calcula GMD para um lote específico.
   * GMD = (pesoAtual - pesoAnterior) / dias entre as duas últimas pesagens
   */
  calcularGmd(loteId: string, loteNome: string): GmdResult {
    const pesagens = this.listByLote(loteId)

    if (pesagens.length === 0) {
      return {
        loteId,
        loteNome,
        gmd: null,
        diasEntrePesagens: null,
        pesoAtual: null,
        pesoAnterior: null,
        ganhoTotal: null,
        totalPesagens: 0,
        ultimaPesagem: null,
      }
    }

    const ultima = pesagens[pesagens.length - 1]!
    const primeira = pesagens[0]!

    if (pesagens.length === 1) {
      return {
        loteId,
        loteNome,
        gmd: null,
        diasEntrePesagens: null,
        pesoAtual: ultima.pesoMedio,
        pesoAnterior: null,
        ganhoTotal: null,
        totalPesagens: 1,
        ultimaPesagem: ultima.data,
      }
    }

    const penultima = pesagens[pesagens.length - 2]!
    const diasEntreUltimas = Math.max(
      1,
      Math.round(
        (new Date(ultima.data).getTime() - new Date(penultima.data).getTime()) /
          86_400_000,
      ),
    )
    const gmd = (ultima.pesoMedio - penultima.pesoMedio) / diasEntreUltimas

    const ganhoTotal = ultima.pesoMedio - primeira.pesoMedio

    return {
      loteId,
      loteNome,
      gmd: Math.round(gmd * 100) / 100,
      diasEntrePesagens: diasEntreUltimas,
      pesoAtual: ultima.pesoMedio,
      pesoAnterior: penultima.pesoMedio,
      ganhoTotal: Math.round(ganhoTotal * 10) / 10,
      totalPesagens: pesagens.length,
      ultimaPesagem: ultima.data,
    }
  },

  /**
   * Calcula GMD para todos os lotes que têm pesagens.
   */
  calcularGmdTodos(): GmdResult[] {
    const all = read()
    const loteIds = [...new Set(all.map((p) => p.loteId))]
    return loteIds.map((id) => {
      const nome = all.find((p) => p.loteId === id)?.loteNome ?? id
      return this.calcularGmd(id, nome)
    })
  },
}
