import { describe, expect, it } from 'vitest'
import {
  areaPoligonoHa,
  calcularGmd,
  custoPorCabecaDia,
  diasAteAbate,
  kgParaArroba,
  lotacaoUAporHa,
  resumoFinanceiro,
  unidadesAnimal,
} from './calculos'
import type { Lancamento, Lote, Pesagem } from './types'

const lote = (over: Partial<Lote> = {}): Lote => ({
  id: 'l1',
  nome: 'Lote 1',
  categoria: 'engorda',
  sexo: 'M',
  cabecas: 10,
  pesoMedioKg: 450,
  pastoId: 'p1',
  ativo: true,
  criadoEm: '2026-01-01',
  ...over,
})

describe('conversoes zootecnicas', () => {
  it('converte peso vivo em arrobas com rendimento de carcaca', () => {
    // 450 kg x 52% = 234 kg carcaca = 15,6 @
    expect(kgParaArroba(450, 0.52)).toBeCloseTo(15.6, 2)
    expect(kgParaArroba(0, 0.52)).toBe(0)
  })

  it('calcula unidades animal (450 kg = 1 UA)', () => {
    expect(unidadesAnimal(450, 10)).toBe(10)
    expect(unidadesAnimal(225, 4)).toBe(2)
  })

  it('calcula lotacao UA/ha somando os lotes do pasto', () => {
    const l = lotacaoUAporHa({ areaHa: 5 }, [lote(), lote({ id: 'l2', cabecas: 5 })])
    expect(l).toBeCloseTo(3, 5)
    expect(lotacaoUAporHa({ areaHa: 0 }, [lote()])).toBe(0)
  })
})

describe('GMD', () => {
  const pes = (data: string, peso: number): Pesagem => ({
    id: data,
    loteId: 'l1',
    data,
    pesoMedioKg: peso,
    cabecas: 10,
    responsavel: 'Joao',
    obs: '',
  })

  it('sem pesagens retorna tudo nulo', () => {
    expect(calcularGmd([]).gmdKgDia).toBeNull()
    expect(calcularGmd([]).totalPesagens).toBe(0)
  })

  it('com uma pesagem informa peso atual mas nao GMD', () => {
    const r = calcularGmd([pes('2026-03-01', 300)])
    expect(r.pesoAtualKg).toBe(300)
    expect(r.gmdKgDia).toBeNull()
  })

  it('calcula GMD entre as duas ultimas pesagens, independente da ordem de entrada', () => {
    const r = calcularGmd([pes('2026-03-31', 330), pes('2026-03-01', 300), pes('2026-01-01', 280)])
    expect(r.diasEntrePesagens).toBe(30)
    expect(r.gmdKgDia).toBeCloseTo(1, 5)
    expect(r.ganhoTotalKg).toBe(50)
    expect(r.ultimaPesagem).toBe('2026-03-31')
  })

  it('estima dias ate o peso de abate', () => {
    expect(diasAteAbate(400, 520, 0.8)).toBe(150)
    expect(diasAteAbate(530, 520, 0.8)).toBe(0)
    expect(diasAteAbate(400, 520, null)).toBeNull()
    expect(diasAteAbate(400, 520, -0.2)).toBeNull()
  })
})

describe('area de poligono', () => {
  it('calcula ~1 ha para um quadrado de 100 m x 100 m', () => {
    // 100 m em latitude ~ 0.0009 graus; em longitude na lat -15 ~ 0.000932 graus
    const lat = -15.1
    const dLat = 100 / 111_320
    const dLng = 100 / (111_320 * Math.cos((lat * Math.PI) / 180))
    const area = areaPoligonoHa([
      [lat, -40.75],
      [lat + dLat, -40.75],
      [lat + dLat, -40.75 + dLng],
      [lat, -40.75 + dLng],
    ])
    expect(area).toBeGreaterThan(0.98)
    expect(area).toBeLessThan(1.02)
  })

  it('retorna 0 para menos de 3 pontos', () => {
    expect(areaPoligonoHa([[0, 0], [1, 1]])).toBe(0)
  })
})

describe('financeiro', () => {
  const lanc = (tipo: Lancamento['tipo'], valor: number, categoria: Lancamento['categoria'] = 'outro'): Lancamento => ({
    id: `${tipo}-${valor}`,
    data: '2026-04-10',
    tipo,
    categoria,
    descricao: '',
    valor,
    loteId: null,
    origem: null,
  })

  it('soma receitas, despesas e saldo', () => {
    const r = resumoFinanceiro([lanc('receita', 1000), lanc('despesa', 300), lanc('despesa', 200)])
    expect(r).toEqual({ receitas: 1000, despesas: 500, saldo: 500 })
  })

  it('custo por cabeca/dia ignora compra de gado', () => {
    const c = custoPorCabecaDia(
      [lanc('despesa', 3000, 'sanidade'), lanc('despesa', 90_000, 'compra_gado')],
      100,
      30,
    )
    expect(c).toBeCloseTo(1, 5)
    expect(custoPorCabecaDia([], 0, 30)).toBeNull()
  })
})
