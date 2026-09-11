const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const num2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmt = {
  moeda: (v: number) => brl.format(v),
  inteiro: (v: number) => num0.format(v),
  dec1: (v: number) => num1.format(v),
  dec2: (v: number) => num2.format(v),
  data: (iso: string) => {
    if (!iso) return '-'
    const [a, m, d] = iso.slice(0, 10).split('-')
    return `${d}/${m}/${a}`
  },
  mes: (mes: string) => {
    const [a, m] = mes.split('-')
    const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    return `${nomes[Number(m) - 1] ?? m}/${a}`
  },
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizarTexto(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function capitalizar(v: string): string {
  return v.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}
