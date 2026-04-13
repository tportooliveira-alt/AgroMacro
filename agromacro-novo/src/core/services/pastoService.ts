import { STORAGE_KEYS } from '../config/storage'
import { LEGACY_MAP_PASTOS } from '../data/legacyMapPastos'
import type { AcaoPasto, CreateAcaoInput, CreatePastoInput, Pasto } from '../types/pasto'
import { onlineSyncService } from './onlineSyncService'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function normalizeNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function areaFromCoords(coords: Array<[number, number]>): number {
  if (!coords || coords.length < 3) return 0
  let sum = 0
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length
    const lat1 = (coords[i]?.[0] ?? 0) * (Math.PI / 180)
    const lat2 = (coords[j]?.[0] ?? 0) * (Math.PI / 180)
    const dLng = ((coords[j]?.[1] ?? 0) - (coords[i]?.[1] ?? 0)) * (Math.PI / 180)
    sum += dLng * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs((sum * 6378137 * 6378137) / 2) / 10000
}

export const pastoService = {
  listPastos(): Pasto[] {
    return read<Pasto>(STORAGE_KEYS.pastos)
  },

  listAcoes(pastoId?: string): AcaoPasto[] {
    const all = read<AcaoPasto>(STORAGE_KEYS.acoesPasto)
    return pastoId ? all.filter((a) => a.pastoId === pastoId) : all
  },

  addPasto(input: CreatePastoInput): Pasto {
    const pasto: Pasto = {
      id: crypto.randomUUID(),
      nome: input.nome,
      area: input.area,
      capim: input.capim,
      aguada: input.aguada,
      status: 'disponivel',
      loteAtual: input.loteAtual,
      createdAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'pending',
    }
    const list = this.listPastos()
    write(STORAGE_KEYS.pastos, [...list, pasto])
    return pasto
  },

  importLegacyMapPastos() {
    const atuais = this.listPastos()
    const existentes = new Set(atuais.map((p) => normalizeNome(p.nome)))
    const novos: Pasto[] = []

    for (const item of LEGACY_MAP_PASTOS) {
      const nomeLimpo = item.nome.trim()
      const chave = normalizeNome(nomeLimpo)
      if (!nomeLimpo || existentes.has(chave)) {
        continue
      }

      existentes.add(chave)
      novos.push({
        id: crypto.randomUUID(),
        nome: nomeLimpo,
        area: 0,
        areaOrigem: 'manual',
        capim: 'Braquiaria',
        aguada: false,
        status: 'disponivel',
        loteAtual: '',
        createdAt: new Date().toISOString(),
        syncStatus: navigator.onLine ? 'synced' : 'pending',
      })
    }

    if (novos.length > 0) {
      write(STORAGE_KEYS.pastos, [...atuais, ...novos])
    }

    return {
      added: novos.length,
      skipped: LEGACY_MAP_PASTOS.length - novos.length,
    }
  },

  aplicarMapaReal(items: Array<{ nome: string; coords: Array<[number, number]> }>) {
    const atuais = this.listPastos()
    const mapa = new Map<string, Array<[number, number]>>()

    for (const item of items) {
      const nome = item?.nome?.trim()
      if (!nome || !Array.isArray(item.coords) || item.coords.length < 3) continue
      mapa.set(normalizeNome(nome), item.coords)
    }

    let atualizados = 0
    const existentes = new Set(atuais.map((p) => normalizeNome(p.nome)))

    const merged = atuais.map((p) => {
      const coords = mapa.get(normalizeNome(p.nome))
      if (!coords) return p
      atualizados += 1
      return {
        ...p,
        coords,
        area: Number(areaFromCoords(coords).toFixed(2)),
        areaOrigem: 'mapa_real' as const,
      }
    })

    const novos: Pasto[] = []
    for (const item of items) {
      const nome = item?.nome?.trim()
      if (!nome) continue
      const key = normalizeNome(nome)
      if (existentes.has(key)) continue
      existentes.add(key)
      novos.push({
        id: crypto.randomUUID(),
        nome,
        area: Number(areaFromCoords(item.coords).toFixed(2)),
        coords: item.coords,
        areaOrigem: 'mapa_real',
        capim: 'Braquiaria',
        aguada: false,
        status: 'disponivel',
        loteAtual: '',
        createdAt: new Date().toISOString(),
        syncStatus: navigator.onLine ? 'synced' : 'pending',
      })
    }

    const finalList = [...merged, ...novos]
    write(STORAGE_KEYS.pastos, finalList)

    return {
      updated: atualizados,
      added: novos.length,
      total: finalList.length,
    }
  },

  atualizarPoligonoPasto(pastoId: string, coords: Array<[number, number]>) {
    if (!Array.isArray(coords) || coords.length < 3) {
      return false
    }

    const area = Number(areaFromCoords(coords).toFixed(2))
    const pastos = this.listPastos()
    const updated = pastos.map((p) => {
      if (p.id !== pastoId) return p
      return {
        ...p,
        coords,
        area,
        areaOrigem: 'mapa_real' as const,
      }
    })
    write(STORAGE_KEYS.pastos, updated)
    return true
  },

  registrarAcao(input: CreateAcaoInput): AcaoPasto {
    const custo = Number(input.custo ?? 0)
    const custoValido = Number.isFinite(custo) && custo > 0 ? Number(custo.toFixed(2)) : 0
    const acao: AcaoPasto = {
      id: crypto.randomUUID(),
      pastoId: input.pastoId,
      tipo: input.tipo,
      descricao: input.descricao,
      responsavel: input.responsavel,
      custo: custoValido,
      data: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'pending',
    }

    const acoes = this.listAcoes()
    write(STORAGE_KEYS.acoesPasto, [...acoes, acao])

    // Atualiza status do pasto conforme tipo da acao
    const pastos = this.listPastos()
    const updated = pastos.map((p) => {
      if (p.id !== input.pastoId) return p
      const novoStatus =
        input.tipo === 'obra'
          ? 'em_obra'
          : input.tipo === 'troca_pasto'
          ? 'em_descanso'
          : p.status
      return { ...p, status: novoStatus as Pasto['status'] }
    })
    write(STORAGE_KEYS.pastos, updated)

    if ((input.tipo === 'obra' || input.tipo === 'manejo') && custoValido > 0) {
      const centroCusto = input.tipo === 'obra' ? 'INFRAESTRUTURA' : 'SANIDADE'
      const nome = `${input.tipo === 'obra' ? 'Obra' : 'Manejo'} - ${input.descricao}`
      void onlineSyncService.addOperacao({
        nome,
        valor: custoValido,
        tipo: 'despesa',
        centroCusto,
        origemModulo: 'pastos',
        referenciaId: acao.id,
        observacao: `Responsavel: ${input.responsavel}`,
      })
    }

    return acao
  },

  atualizarStatus(pastoId: string, status: Pasto['status']) {
    const pastos = this.listPastos()
    const updated = pastos.map((p) => (p.id === pastoId ? { ...p, status } : p))
    write(STORAGE_KEYS.pastos, updated)
  },

  atualizarRebanhoNoPasto(pastoId: string, loteAtual: string) {
    const loteLimpo = loteAtual.trim()
    const pastos = this.listPastos()
    const updated = pastos.map((p) => {
      if (p.id !== pastoId) return p
      return {
        ...p,
        loteAtual: loteLimpo,
        status: loteLimpo ? 'ocupado' : 'disponivel',
      }
    })
    write(STORAGE_KEYS.pastos, updated)
  },
}
