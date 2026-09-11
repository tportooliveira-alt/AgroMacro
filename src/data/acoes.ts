// Regras de negocio. Cada acao valida, aplica a mutacao e retorna a entidade criada.
import { getDb, mutar } from './db'
import { areaPoligonoHa, hojeIso, kgParaArroba } from '../domain/calculos'
import { normalizarTexto, novoId } from '../domain/formatar'
import type {
  CategoriaLancamento,
  CategoriaLote,
  Compra,
  Db,
  Fazenda,
  Funcionario,
  Id,
  Lancamento,
  Lote,
  Manejo,
  Movimentacao,
  Pasto,
  Pesagem,
  SexoLote,
  TipoLancamento,
  TipoManejo,
  Venda,
} from '../domain/types'
import pastosFazenda from './pastos-fazenda.json'

function agora() {
  return new Date().toISOString()
}

function exigir(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

function numPositivo(v: number, campo: string) {
  exigir(Number.isFinite(v) && v > 0, `${campo} deve ser maior que zero.`)
}

function texto(v: string, campo: string) {
  const t = v.trim()
  exigir(t.length > 0, `${campo} e obrigatorio.`)
  return t
}

function lancamentoDe(
  tipo: TipoLancamento,
  categoria: CategoriaLancamento,
  descricao: string,
  valor: number,
  data: string,
  loteId: Id | null,
  origem: Lancamento['origem'],
): Lancamento {
  return { id: novoId(), data, tipo, categoria, descricao, valor, loteId, origem }
}

// ───────────────────────── Fazenda ─────────────────────────

export function salvarFazenda(dados: Fazenda) {
  const nome = texto(dados.nome, 'Nome da fazenda')
  numPositivo(dados.cotacaoArroba, 'Cotacao da arroba')
  exigir(dados.rendimentoCarcaca > 0 && dados.rendimentoCarcaca < 1, 'Rendimento de carcaca deve ficar entre 0 e 1 (ex.: 0,52).')
  mutar((db) => ({ ...db, fazenda: { ...dados, nome } }))
}

// ───────────────────────── Pastos ─────────────────────────

export interface NovoPasto {
  nome: string
  areaHa: number
  capim: string
  aguada: boolean
  coords?: Array<[number, number]>
}

export function criarPasto(input: NovoPasto): Pasto {
  const nome = texto(input.nome, 'Nome do pasto')
  numPositivo(input.areaHa, 'Area')
  const db = getDb()
  exigir(
    !db.pastos.some((p) => normalizarTexto(p.nome) === normalizarTexto(nome)),
    `Ja existe um pasto chamado "${nome}".`,
  )
  const pasto: Pasto = {
    id: novoId(),
    nome,
    areaHa: Number(input.areaHa.toFixed(2)),
    capim: input.capim.trim(),
    aguada: input.aguada,
    statusManual: 'disponivel',
    coords: input.coords,
    criadoEm: agora(),
  }
  mutar((d) => ({ ...d, pastos: [...d.pastos, pasto] }))
  return pasto
}

export function editarPasto(id: Id, dados: Partial<Pick<Pasto, 'nome' | 'areaHa' | 'capim' | 'aguada' | 'statusManual'>>) {
  mutar((db) => ({
    ...db,
    pastos: db.pastos.map((p) => (p.id === id ? { ...p, ...dados } : p)),
  }))
}

export function excluirPasto(id: Id) {
  const db = getDb()
  exigir(!db.lotes.some((l) => l.ativo && l.pastoId === id), 'Ha lote ativo neste pasto. Mova o lote antes de excluir.')
  mutar((d) => ({ ...d, pastos: d.pastos.filter((p) => p.id !== id) }))
}

/** Importa os poligonos reais da fazenda (49 pastos) sem duplicar os ja cadastrados. */
export function importarPastosDaFazenda(): number {
  const db = getDb()
  const existentes = new Set(db.pastos.map((p) => normalizarTexto(p.nome)))
  const novos: Pasto[] = []
  for (const item of pastosFazenda as Array<{ nome: string; coords: Array<[number, number]> }>) {
    const nome = item.nome.trim()
    if (!nome || existentes.has(normalizarTexto(nome))) continue
    existentes.add(normalizarTexto(nome))
    novos.push({
      id: novoId(),
      nome,
      areaHa: Number(areaPoligonoHa(item.coords).toFixed(2)),
      capim: '',
      aguada: false,
      statusManual: 'disponivel',
      coords: item.coords,
      criadoEm: agora(),
    })
  }
  if (novos.length > 0) mutar((d) => ({ ...d, pastos: [...d.pastos, ...novos] }))
  return novos.length
}

// ───────────────────────── Lotes ─────────────────────────

export interface NovoLote {
  nome: string
  categoria: CategoriaLote
  sexo: SexoLote
  cabecas: number
  pesoMedioKg: number
  pastoId: Id | null
}

function validarPastoDestino(db: Db, pastoId: Id): Pasto {
  const pasto = db.pastos.find((p) => p.id === pastoId)
  exigir(pasto, 'Pasto nao encontrado.')
  exigir(pasto.statusManual !== 'reforma', `Pasto "${pasto.nome}" esta em reforma.`)
  return pasto
}

export function criarLote(input: NovoLote): Lote {
  const nome = texto(input.nome, 'Nome do lote')
  numPositivo(input.cabecas, 'Cabecas')
  numPositivo(input.pesoMedioKg, 'Peso medio')
  const db = getDb()
  exigir(
    !db.lotes.some((l) => l.ativo && normalizarTexto(l.nome) === normalizarTexto(nome)),
    `Ja existe um lote ativo chamado "${nome}".`,
  )
  if (input.pastoId) validarPastoDestino(db, input.pastoId)
  const lote: Lote = {
    id: novoId(),
    nome,
    categoria: input.categoria,
    sexo: input.sexo,
    cabecas: Math.round(input.cabecas),
    pesoMedioKg: input.pesoMedioKg,
    pastoId: input.pastoId,
    ativo: true,
    criadoEm: agora(),
  }
  mutar((d) => ({ ...d, lotes: [...d.lotes, lote] }))
  return lote
}

export function editarLote(id: Id, dados: Partial<Pick<Lote, 'nome' | 'categoria' | 'sexo' | 'cabecas' | 'pesoMedioKg'>>) {
  mutar((db) => ({ ...db, lotes: db.lotes.map((l) => (l.id === id ? { ...l, ...dados } : l)) }))
}

export function inativarLote(id: Id) {
  mutar((db) => ({
    ...db,
    lotes: db.lotes.map((l) => (l.id === id ? { ...l, ativo: false, pastoId: null } : l)),
  }))
}

export function moverLote(loteId: Id, paraPastoId: Id, responsavel: string, obs = '', data = hojeIso()): Movimentacao {
  const db = getDb()
  const lote = db.lotes.find((l) => l.id === loteId)
  exigir(lote, 'Lote nao encontrado.')
  exigir(lote.ativo, 'Lote inativo nao pode ser movimentado.')
  exigir(lote.pastoId !== paraPastoId, 'O lote ja esta neste pasto.')
  const destino = validarPastoDestino(db, paraPastoId)
  const resp = texto(responsavel, 'Responsavel')
  const func = db.funcionarios.find((f) => normalizarTexto(f.nome) === normalizarTexto(resp))
  exigir(!func || func.ativo, `Funcionario "${func?.nome}" esta inativo.`)

  const mov: Movimentacao = {
    id: novoId(),
    loteId,
    dePastoId: lote.pastoId,
    paraPastoId: destino.id,
    data,
    responsavel: resp,
    obs: obs.trim(),
  }
  mutar((d) => ({
    ...d,
    lotes: d.lotes.map((l) => (l.id === loteId ? { ...l, pastoId: destino.id } : l)),
    movimentacoes: [...d.movimentacoes, mov],
  }))
  return mov
}

// ───────────────────────── Pesagens ─────────────────────────

export interface NovaPesagem {
  loteId: Id
  data: string
  pesoMedioKg: number
  cabecas?: number
  responsavel: string
  obs?: string
}

export function registrarPesagem(input: NovaPesagem): Pesagem {
  const db = getDb()
  const lote = db.lotes.find((l) => l.id === input.loteId)
  exigir(lote && lote.ativo, 'Lote nao encontrado ou inativo.')
  numPositivo(input.pesoMedioKg, 'Peso medio')
  exigir(input.data, 'Data e obrigatoria.')
  const cabecas = input.cabecas && input.cabecas > 0 ? Math.round(input.cabecas) : lote.cabecas
  const pesagem: Pesagem = {
    id: novoId(),
    loteId: lote.id,
    data: input.data,
    pesoMedioKg: input.pesoMedioKg,
    cabecas,
    responsavel: input.responsavel.trim(),
    obs: (input.obs ?? '').trim(),
  }
  // Atualiza o peso do lote so se esta pesagem for a mais recente
  const maisRecente = db.pesagens
    .filter((p) => p.loteId === lote.id)
    .every((p) => p.data <= pesagem.data)
  mutar((d) => ({
    ...d,
    pesagens: [...d.pesagens, pesagem],
    lotes: maisRecente
      ? d.lotes.map((l) => (l.id === lote.id ? { ...l, pesoMedioKg: pesagem.pesoMedioKg, cabecas } : l))
      : d.lotes,
  }))
  return pesagem
}

// ───────────────────────── Manejo sanitario ─────────────────────────

export interface NovoManejo {
  loteId: Id
  tipo: TipoManejo
  produto: string
  data: string
  custo: number
  responsavel: string
  obs?: string
}

export function registrarManejo(input: NovoManejo): Manejo {
  const db = getDb()
  const lote = db.lotes.find((l) => l.id === input.loteId)
  exigir(lote && lote.ativo, 'Lote nao encontrado ou inativo.')
  exigir(input.data, 'Data e obrigatoria.')
  const produto = texto(input.produto, 'Produto / descricao')
  const custo = Number.isFinite(input.custo) && input.custo > 0 ? input.custo : 0
  const id = novoId()
  const lanc =
    custo > 0
      ? lancamentoDe(
          'despesa',
          input.tipo === 'suplementacao' ? 'nutricao' : 'sanidade',
          `${produto} - ${lote.nome}`,
          custo,
          input.data,
          lote.id,
          { tipo: 'manejo', id },
        )
      : null
  const manejo: Manejo = {
    id,
    loteId: lote.id,
    tipo: input.tipo,
    produto,
    data: input.data,
    custo,
    responsavel: input.responsavel.trim(),
    obs: (input.obs ?? '').trim(),
    lancamentoId: lanc?.id ?? null,
  }
  mutar((d) => ({
    ...d,
    manejos: [...d.manejos, manejo],
    lancamentos: lanc ? [...d.lancamentos, lanc] : d.lancamentos,
  }))
  return manejo
}

// ───────────────────────── Compra e venda ─────────────────────────

export interface NovaCompra {
  data: string
  fornecedor: string
  cabecas: number
  pesoMedioKg: number
  precoArroba: number
  /** Lote existente que recebe os animais, ou null para criar um novo */
  loteId: Id | null
  novoLote?: { nome: string; categoria: CategoriaLote; sexo: SexoLote; pastoId: Id | null }
}

export function comprarGado(input: NovaCompra): Compra {
  const db = getDb()
  numPositivo(input.cabecas, 'Cabecas')
  numPositivo(input.pesoMedioKg, 'Peso medio')
  numPositivo(input.precoArroba, 'Preco da arroba')
  exigir(input.data, 'Data e obrigatoria.')
  const fornecedor = input.fornecedor.trim()
  const cabecas = Math.round(input.cabecas)
  const arrobas = kgParaArroba(input.pesoMedioKg, db.fazenda.rendimentoCarcaca) * cabecas
  const valorTotal = Number((arrobas * input.precoArroba).toFixed(2))

  let lote: Lote
  let lotesAtualizados: Lote[]
  if (input.loteId) {
    const existente = db.lotes.find((l) => l.id === input.loteId)
    exigir(existente && existente.ativo, 'Lote de destino nao encontrado ou inativo.')
    const totalCab = existente.cabecas + cabecas
    const pesoPonderado = (existente.pesoMedioKg * existente.cabecas + input.pesoMedioKg * cabecas) / totalCab
    lote = { ...existente, cabecas: totalCab, pesoMedioKg: Number(pesoPonderado.toFixed(1)) }
    lotesAtualizados = db.lotes.map((l) => (l.id === lote.id ? lote : l))
  } else {
    exigir(input.novoLote, 'Informe o lote de destino.')
    const nome = texto(input.novoLote.nome, 'Nome do novo lote')
    exigir(
      !db.lotes.some((l) => l.ativo && normalizarTexto(l.nome) === normalizarTexto(nome)),
      `Ja existe um lote ativo chamado "${nome}".`,
    )
    if (input.novoLote.pastoId) validarPastoDestino(db, input.novoLote.pastoId)
    lote = {
      id: novoId(),
      nome,
      categoria: input.novoLote.categoria,
      sexo: input.novoLote.sexo,
      cabecas,
      pesoMedioKg: input.pesoMedioKg,
      pastoId: input.novoLote.pastoId,
      ativo: true,
      criadoEm: agora(),
    }
    lotesAtualizados = [...db.lotes, lote]
  }

  const compraId = novoId()
  const lanc = lancamentoDe(
    'despesa',
    'compra_gado',
    `Compra ${cabecas} cab. ${fornecedor ? `de ${fornecedor} ` : ''}- ${lote.nome}`,
    valorTotal,
    input.data,
    lote.id,
    { tipo: 'compra', id: compraId },
  )
  const compra: Compra = {
    id: compraId,
    data: input.data,
    fornecedor,
    loteId: lote.id,
    cabecas,
    pesoMedioKg: input.pesoMedioKg,
    precoArroba: input.precoArroba,
    valorTotal,
    lancamentoId: lanc.id,
  }
  mutar((d) => ({
    ...d,
    lotes: lotesAtualizados,
    compras: [...d.compras, compra],
    lancamentos: [...d.lancamentos, lanc],
  }))
  return compra
}

export interface NovaVenda {
  data: string
  comprador: string
  loteId: Id
  cabecas: number
  pesoMedioKg: number
  precoArroba: number
}

export function venderGado(input: NovaVenda): Venda {
  const db = getDb()
  const lote = db.lotes.find((l) => l.id === input.loteId)
  exigir(lote && lote.ativo, 'Lote nao encontrado ou inativo.')
  numPositivo(input.cabecas, 'Cabecas')
  numPositivo(input.pesoMedioKg, 'Peso medio')
  numPositivo(input.precoArroba, 'Preco da arroba')
  exigir(input.data, 'Data e obrigatoria.')
  const cabecas = Math.round(input.cabecas)
  exigir(cabecas <= lote.cabecas, `O lote "${lote.nome}" tem apenas ${lote.cabecas} cabecas.`)
  const arrobas = kgParaArroba(input.pesoMedioKg, db.fazenda.rendimentoCarcaca) * cabecas
  const valorTotal = Number((arrobas * input.precoArroba).toFixed(2))
  const restantes = lote.cabecas - cabecas
  const vendaId = novoId()
  const lanc = lancamentoDe(
    'receita',
    'venda_gado',
    `Venda ${cabecas} cab. ${input.comprador.trim() ? `para ${input.comprador.trim()} ` : ''}- ${lote.nome}`,
    valorTotal,
    input.data,
    lote.id,
    { tipo: 'venda', id: vendaId },
  )
  const venda: Venda = {
    id: vendaId,
    data: input.data,
    comprador: input.comprador.trim(),
    loteId: lote.id,
    cabecas,
    pesoMedioKg: input.pesoMedioKg,
    precoArroba: input.precoArroba,
    valorTotal,
    lancamentoId: lanc.id,
  }
  mutar((d) => ({
    ...d,
    lotes: d.lotes.map((l) =>
      l.id === lote.id
        ? { ...l, cabecas: restantes, ativo: restantes > 0, pastoId: restantes > 0 ? l.pastoId : null }
        : l,
    ),
    vendas: [...d.vendas, venda],
    lancamentos: [...d.lancamentos, lanc],
  }))
  return venda
}

// ───────────────────────── Lancamentos manuais ─────────────────────────

export interface NovoLancamento {
  data: string
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  loteId?: Id | null
}

export function lancar(input: NovoLancamento): Lancamento {
  exigir(input.data, 'Data e obrigatoria.')
  numPositivo(input.valor, 'Valor')
  const descricao = texto(input.descricao, 'Descricao')
  const lanc = lancamentoDe(input.tipo, input.categoria, descricao, input.valor, input.data, input.loteId ?? null, null)
  mutar((d) => ({ ...d, lancamentos: [...d.lancamentos, lanc] }))
  return lanc
}

export function excluirLancamento(id: Id) {
  const db = getDb()
  const lanc = db.lancamentos.find((l) => l.id === id)
  exigir(lanc, 'Lancamento nao encontrado.')
  exigir(!lanc.origem, 'Lancamento automatico (compra/venda/manejo) nao pode ser excluido aqui.')
  mutar((d) => ({ ...d, lancamentos: d.lancamentos.filter((l) => l.id !== id) }))
}

// ───────────────────────── Funcionarios ─────────────────────────

export interface NovoFuncionario {
  nome: string
  funcao: string
  telefone: string
  salario: number
}

export function criarFuncionario(input: NovoFuncionario): Funcionario {
  const nome = texto(input.nome, 'Nome')
  const db = getDb()
  exigir(
    !db.funcionarios.some((f) => normalizarTexto(f.nome) === normalizarTexto(nome)),
    `Ja existe um funcionario chamado "${nome}".`,
  )
  const f: Funcionario = {
    id: novoId(),
    nome,
    funcao: input.funcao.trim(),
    telefone: input.telefone.trim(),
    salario: Number.isFinite(input.salario) && input.salario > 0 ? input.salario : 0,
    ativo: true,
    criadoEm: agora(),
  }
  mutar((d) => ({ ...d, funcionarios: [...d.funcionarios, f] }))
  return f
}

export function alternarFuncionario(id: Id) {
  mutar((d) => ({ ...d, funcionarios: d.funcionarios.map((f) => (f.id === id ? { ...f, ativo: !f.ativo } : f)) }))
}

/** Lanca a folha do mes (salarios dos ativos) como despesa de mao de obra. */
export function lancarFolha(mes: string): number {
  const db = getDb()
  const ativos = db.funcionarios.filter((f) => f.ativo && f.salario > 0)
  exigir(ativos.length > 0, 'Nenhum funcionario ativo com salario cadastrado.')
  const total = ativos.reduce((acc, f) => acc + f.salario, 0)
  const data = `${mes}-05`
  const lanc = lancamentoDe('despesa', 'mao_de_obra', `Folha ${mes} (${ativos.length} func.)`, total, data, null, null)
  mutar((d) => ({ ...d, lancamentos: [...d.lancamentos, lanc] }))
  return total
}
