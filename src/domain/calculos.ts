import type { Fazenda, Lancamento, Lote, Pasto, Pesagem } from './types'

/** Peso vivo (kg) -> arrobas de carcaca. 1 @ = 15 kg de carcaca. */
export function kgParaArroba(pesoVivoKg: number, rendimentoCarcaca: number): number {
  if (pesoVivoKg <= 0 || rendimentoCarcaca <= 0) return 0
  return (pesoVivoKg * rendimentoCarcaca) / 15
}

/** Arrobas totais de um lote (peso medio x cabecas). */
export function arrobasDoLote(lote: Pick<Lote, 'cabecas' | 'pesoMedioKg'>, rendimento: number): number {
  return kgParaArroba(lote.pesoMedioKg, rendimento) * lote.cabecas
}

/** Unidade Animal = 450 kg de peso vivo. */
export function unidadesAnimal(pesoMedioKg: number, cabecas: number): number {
  if (pesoMedioKg <= 0 || cabecas <= 0) return 0
  return (pesoMedioKg * cabecas) / 450
}

/** Lotacao em UA/ha de um pasto dado os lotes que estao nele. */
export function lotacaoUAporHa(pasto: Pick<Pasto, 'areaHa'>, lotesNoPasto: Lote[]): number {
  if (pasto.areaHa <= 0) return 0
  const ua = lotesNoPasto.reduce((acc, l) => acc + unidadesAnimal(l.pesoMedioKg, l.cabecas), 0)
  return ua / pasto.areaHa
}

export interface ResultadoGmd {
  gmdKgDia: number | null
  diasEntrePesagens: number | null
  pesoAtualKg: number | null
  pesoAnteriorKg: number | null
  ganhoTotalKg: number | null
  ultimaPesagem: string | null
  totalPesagens: number
}

function diasEntre(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime()
  const b = new Date(bIso).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** GMD (ganho medio diario) entre as duas ultimas pesagens do lote. */
export function calcularGmd(pesagensDoLote: Pesagem[]): ResultadoGmd {
  const ordenadas = [...pesagensDoLote].sort((a, b) => a.data.localeCompare(b.data))
  const total = ordenadas.length
  if (total === 0) {
    return {
      gmdKgDia: null,
      diasEntrePesagens: null,
      pesoAtualKg: null,
      pesoAnteriorKg: null,
      ganhoTotalKg: null,
      ultimaPesagem: null,
      totalPesagens: 0,
    }
  }
  const ultima = ordenadas[total - 1]!
  if (total === 1) {
    return {
      gmdKgDia: null,
      diasEntrePesagens: null,
      pesoAtualKg: ultima.pesoMedioKg,
      pesoAnteriorKg: null,
      ganhoTotalKg: null,
      ultimaPesagem: ultima.data,
      totalPesagens: 1,
    }
  }
  const anterior = ordenadas[total - 2]!
  const primeira = ordenadas[0]!
  const dias = diasEntre(anterior.data, ultima.data)
  const gmd = dias > 0 ? (ultima.pesoMedioKg - anterior.pesoMedioKg) / dias : null
  return {
    gmdKgDia: gmd,
    diasEntrePesagens: dias,
    pesoAtualKg: ultima.pesoMedioKg,
    pesoAnteriorKg: anterior.pesoMedioKg,
    ganhoTotalKg: ultima.pesoMedioKg - primeira.pesoMedioKg,
    ultimaPesagem: ultima.data,
    totalPesagens: total,
  }
}

/** Dias estimados ate atingir o peso alvo com o GMD informado. */
export function diasAteAbate(pesoAtualKg: number, pesoAlvoKg: number, gmdKgDia: number | null): number | null {
  if (gmdKgDia === null || gmdKgDia <= 0) return null
  if (pesoAtualKg >= pesoAlvoKg) return 0
  return Math.ceil((pesoAlvoKg - pesoAtualKg) / gmdKgDia)
}

/** Area (ha) de um poligono de coordenadas [lat, lng] pela formula esferica. */
export function areaPoligonoHa(coords: Array<[number, number]>): number {
  if (!coords || coords.length < 3) return 0
  const R = 6_378_137
  const rad = Math.PI / 180
  let soma = 0
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length
    const [lat1, lng1] = coords[i]!
    const [lat2, lng2] = coords[j]!
    soma += (lng2 - lng1) * rad * (2 + Math.sin(lat1 * rad) + Math.sin(lat2 * rad))
  }
  const m2 = Math.abs((soma * R * R) / 2)
  return m2 / 10_000
}

export function valorRebanho(lotes: Lote[], fazenda: Pick<Fazenda, 'cotacaoArroba' | 'rendimentoCarcaca'>): number {
  return lotes
    .filter((l) => l.ativo)
    .reduce((acc, l) => acc + arrobasDoLote(l, fazenda.rendimentoCarcaca) * fazenda.cotacaoArroba, 0)
}

export interface ResumoFinanceiro {
  receitas: number
  despesas: number
  saldo: number
}

export function resumoFinanceiro(lancamentos: Lancamento[]): ResumoFinanceiro {
  let receitas = 0
  let despesas = 0
  for (const l of lancamentos) {
    if (l.tipo === 'receita') receitas += l.valor
    else despesas += l.valor
  }
  return { receitas, despesas, saldo: receitas - despesas }
}

/** Filtra lancamentos de um mes (formato 'AAAA-MM'). */
export function lancamentosDoMes(lancamentos: Lancamento[], mes: string): Lancamento[] {
  return lancamentos.filter((l) => l.data.slice(0, 7) === mes)
}

/**
 * Custo por cabeca por dia: despesas operacionais (sem compra de gado)
 * divididas por cabecas x dias do periodo.
 */
export function custoPorCabecaDia(lancamentos: Lancamento[], cabecas: number, dias: number): number | null {
  if (cabecas <= 0 || dias <= 0) return null
  const despesas = lancamentos
    .filter((l) => l.tipo === 'despesa' && l.categoria !== 'compra_gado')
    .reduce((acc, l) => acc + l.valor, 0)
  return despesas / (cabecas * dias)
}

export function diasNoMes(mes: string): number {
  const [ano, m] = mes.split('-').map(Number)
  if (!ano || !m) return 30
  return new Date(ano, m, 0).getDate()
}

export function mesAtual(hoje = new Date()): string {
  return hoje.toISOString().slice(0, 7)
}

export function hojeIso(hoje = new Date()): string {
  return hoje.toISOString().slice(0, 10)
}

export function diasDesde(dataIso: string, hoje = new Date()): number {
  return diasEntre(dataIso, hoje.toISOString().slice(0, 10))
}
