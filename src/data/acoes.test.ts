import { beforeEach, describe, expect, it } from 'vitest'
import { comprarGado, criarLote, criarPasto, importarPastosDaFazenda, moverLote, registrarManejo, registrarPesagem, venderGado } from './acoes'
import { getDb, zerarDb } from './db'

describe('regras de negocio', () => {
  beforeEach(() => zerarDb())

  it('importa os pastos reais da fazenda com area calculada e sem duplicar', () => {
    const n = importarPastosDaFazenda()
    expect(n).toBe(49)
    expect(importarPastosDaFazenda()).toBe(0)
    const total = getDb().pastos.reduce((a, p) => a + p.areaHa, 0)
    expect(total).toBeGreaterThan(50)
    expect(getDb().pastos.every((p) => p.areaHa > 0)).toBe(true)
  })

  it('move lote entre pastos registrando historico e bloqueia pasto em reforma', () => {
    const p1 = criarPasto({ nome: 'Pasto A', areaHa: 10, capim: '', aguada: true })
    const p2 = criarPasto({ nome: 'Pasto B', areaHa: 8, capim: '', aguada: true })
    const lote = criarLote({ nome: 'Bois 1', categoria: 'engorda', sexo: 'M', cabecas: 20, pesoMedioKg: 400, pastoId: p1.id })
    moverLote(lote.id, p2.id, 'Joao')
    expect(getDb().lotes[0]?.pastoId).toBe(p2.id)
    expect(getDb().movimentacoes).toHaveLength(1)
    expect(getDb().movimentacoes[0]?.dePastoId).toBe(p1.id)
    expect(() => moverLote(lote.id, p2.id, 'Joao')).toThrow(/ja esta/)
    expect(() => moverLote(lote.id, p1.id, '')).toThrow(/Responsavel/)
  })

  it('compra cria lote e gera despesa; venda reduz e gera receita', () => {
    const compra = comprarGado({
      data: '2026-04-01',
      fornecedor: 'Zeca',
      cabecas: 10,
      pesoMedioKg: 300,
      precoArroba: 250,
      loteId: null,
      novoLote: { nome: 'Garrotes', categoria: 'recria', sexo: 'M', pastoId: null },
    })
    // 300 kg * 0.52 / 15 = 10.4 @ * 10 cab * 250 = 26.000
    expect(compra.valorTotal).toBeCloseTo(26_000, 2)
    expect(getDb().lotes).toHaveLength(1)
    expect(getDb().lancamentos[0]?.tipo).toBe('despesa')

    const loteId = getDb().lotes[0]!.id
    const venda = venderGado({ data: '2026-09-01', comprador: 'Frigorifico', loteId, cabecas: 4, pesoMedioKg: 480, precoArroba: 320 })
    expect(venda.valorTotal).toBeCloseTo(((480 * 0.52) / 15) * 4 * 320, 2)
    expect(getDb().lotes[0]?.cabecas).toBe(6)
    expect(() => venderGado({ data: '2026-09-02', comprador: '', loteId, cabecas: 7, pesoMedioKg: 480, precoArroba: 320 })).toThrow(/apenas 6/)
    venderGado({ data: '2026-09-02', comprador: '', loteId, cabecas: 6, pesoMedioKg: 480, precoArroba: 320 })
    expect(getDb().lotes[0]?.ativo).toBe(false)
  })

  it('pesagem mais recente atualiza o peso do lote; pesagem antiga nao', () => {
    const lote = criarLote({ nome: 'L', categoria: 'engorda', sexo: 'M', cabecas: 5, pesoMedioKg: 300, pastoId: null })
    registrarPesagem({ loteId: lote.id, data: '2026-05-01', pesoMedioKg: 330, responsavel: 'Ana' })
    expect(getDb().lotes[0]?.pesoMedioKg).toBe(330)
    registrarPesagem({ loteId: lote.id, data: '2026-03-01', pesoMedioKg: 280, responsavel: 'Ana' })
    expect(getDb().lotes[0]?.pesoMedioKg).toBe(330)
  })

  it('manejo com custo gera lancamento de sanidade vinculado', () => {
    const lote = criarLote({ nome: 'L', categoria: 'engorda', sexo: 'M', cabecas: 5, pesoMedioKg: 300, pastoId: null })
    const m = registrarManejo({ loteId: lote.id, tipo: 'vacina', produto: 'Aftosa', data: '2026-05-01', custo: 150, responsavel: 'Ana' })
    expect(m.lancamentoId).not.toBeNull()
    expect(getDb().lancamentos[0]?.categoria).toBe('sanidade')
    expect(getDb().lancamentos[0]?.origem).toEqual({ tipo: 'manejo', id: m.id })
  })
})
