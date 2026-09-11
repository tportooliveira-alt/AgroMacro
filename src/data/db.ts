import { useSyncExternalStore } from 'react'
import type { Db } from '../domain/types'

export const STORAGE_KEY = 'agromacro:db:v1'

export function dbVazio(): Db {
  return {
    versao: 1,
    fazenda: {
      nome: 'Minha Fazenda',
      proprietario: '',
      municipio: '',
      cotacaoArroba: 300,
      rendimentoCarcaca: 0.52,
    },
    pastos: [],
    lotes: [],
    movimentacoes: [],
    pesagens: [],
    manejos: [],
    compras: [],
    vendas: [],
    lancamentos: [],
    funcionarios: [],
  }
}

function carregar(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return dbVazio()
    const parsed = JSON.parse(raw) as Partial<Db>
    if (!parsed || parsed.versao !== 1) return dbVazio()
    // Preenche campos ausentes para tolerar versoes antigas do mesmo schema
    return { ...dbVazio(), ...parsed, fazenda: { ...dbVazio().fazenda, ...parsed.fazenda } }
  } catch {
    return dbVazio()
  }
}

let estado: Db = typeof localStorage !== 'undefined' ? carregar() : dbVazio()
const ouvintes = new Set<() => void>()

function persistir() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
  } catch (e) {
    console.error('Falha ao salvar no localStorage', e)
  }
}

export function getDb(): Db {
  return estado
}

/** Aplica uma mutacao imutavel e notifica a UI. */
export function mutar(fn: (db: Db) => Db) {
  estado = fn(estado)
  persistir()
  ouvintes.forEach((o) => o())
}

export function substituirDb(novo: Db) {
  mutar(() => ({ ...dbVazio(), ...novo, versao: 1 }))
}

export function zerarDb() {
  mutar(() => dbVazio())
}

function subscribe(cb: () => void) {
  ouvintes.add(cb)
  return () => ouvintes.delete(cb)
}

/** Hook: re-renderiza quando o banco muda. */
export function useDb(): Db {
  return useSyncExternalStore(subscribe, getDb, getDb)
}

export function exportarJson(): string {
  return JSON.stringify(estado, null, 2)
}

export function validarImport(texto: string): Db {
  const parsed = JSON.parse(texto) as Partial<Db>
  if (!parsed || typeof parsed !== 'object') throw new Error('Arquivo invalido.')
  if (parsed.versao !== 1) throw new Error('Versao de backup nao suportada.')
  const listas: Array<keyof Db> = [
    'pastos',
    'lotes',
    'movimentacoes',
    'pesagens',
    'manejos',
    'compras',
    'vendas',
    'lancamentos',
    'funcionarios',
  ]
  for (const k of listas) {
    if (parsed[k] !== undefined && !Array.isArray(parsed[k])) throw new Error(`Campo "${k}" invalido.`)
  }
  return { ...dbVazio(), ...parsed, versao: 1 }
}
