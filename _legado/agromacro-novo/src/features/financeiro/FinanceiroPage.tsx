import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { loteService } from '../../core/services/loteService'
import { onlineSyncService } from '../../core/services/onlineSyncService'
import type { CentroCusto } from '../../core/types/operacao'

const centrosCusto = [
  'GADO_CORTE',
  'NUTRICAO',
  'SANIDADE',
  'MAO_DE_OBRA',
  'INFRAESTRUTURA',
  'ADMINISTRATIVO',
] as const

function baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function toDateInputValue(data?: Date) {
  if (!data) return ''
  return data.toISOString().slice(0, 10)
}

export function FinanceiroPage() {
  const [operacoes, setOperacoes] = useState(() => onlineSyncService.listOperacoes())
  const [isOnline, setIsOnline] = useState(() => onlineSyncService.getOnlineState())
  const [centroFiltro, setCentroFiltro] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState(toDateInputValue(new Date()))
  // form lancamento manual
  const [formNome, setFormNome] = useState('')
  const [formValor, setFormValor] = useState('')
  const [formTipo, setFormTipo] = useState<'receita' | 'despesa'>('despesa')
  const [formCentro, setFormCentro] = useState<CentroCusto>('ADMINISTRATIVO')
  const [formObs, setFormObs] = useState('')
  const [formErro, setFormErro] = useState('')

  useEffect(() => {
    return onlineSyncService.subscribeOnlineState((online) => {
      setIsOnline(online)
      if (online) {
        onlineSyncService.syncPending().then(() => {
          setOperacoes(onlineSyncService.listOperacoes())
        })
      }
    })
  }, [])

  useEffect(() => {
    setOperacoes(onlineSyncService.listOperacoes())
  }, [])

  const handleLancamento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErro('')
    if (!formNome.trim()) {
      setFormErro('Descricao obrigatoria.')
      return
    }
    const valor = Number(formValor.replace(',', '.'))
    if (!valor || valor <= 0) {
      setFormErro('Valor deve ser maior que zero.')
      return
    }
    await onlineSyncService.addOperacao({
      nome: formNome.trim(),
      valor,
      tipo: formTipo,
      centroCusto: formCentro,
      origemModulo: 'manual',
      observacao: formObs.trim() || undefined,
    })
    setOperacoes(onlineSyncService.listOperacoes())
    setFormNome('')
    setFormValor('')
    setFormObs('')
  }

  const operacoesFiltradas = useMemo(() => {
    return operacoes.filter((item) => {
      if (centroFiltro && item.centroCusto !== centroFiltro) return false
      if (periodoInicio) {
        const itemData = new Date(item.createdAt)
        const inicioDate = new Date(`${periodoInicio}T00:00:00`)
        if (itemData < inicioDate) return false
      }
      if (periodoFim) {
        const itemData = new Date(item.createdAt)
        const fimDate = new Date(`${periodoFim}T23:59:59.999`)
        if (itemData > fimDate) return false
      }
      return true
    })
  }, [operacoes, centroFiltro, periodoInicio, periodoFim])

  const resumo = useMemo(() => {
    const receita = operacoesFiltradas
      .filter((item) => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)
    const despesa = operacoesFiltradas
      .filter((item) => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)

    // custo diario por cabeca
    const lotesAtivos = loteService.list().filter((l) => l.status === 'ativo')
    const totalCabecas = lotesAtivos.reduce((acc, l) => acc + (l.cabecas ?? 0), 0)
    // dias cobertos pelo filtro (ou 30 se sem filtro)
    let diasPeriodo = 30
    if (periodoInicio && periodoFim) {
      const inicio = new Date(`${periodoInicio}T00:00:00`)
      const fim = new Date(`${periodoFim}T23:59:59`)
      const diff = Math.ceil((fim.getTime() - inicio.getTime()) / 86_400_000)
      diasPeriodo = Math.max(diff, 1)
    }
    const custoDiarioPorCabeca =
      totalCabecas > 0 && diasPeriodo > 0 ? despesa / totalCabecas / diasPeriodo : 0

    return {
      receita,
      despesa,
      saldo: receita - despesa,
      totalCabecas,
      custoDiarioPorCabeca,
      diasPeriodo,
    }
  }, [operacoesFiltradas, periodoInicio, periodoFim])

  const porCentro = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of operacoesFiltradas) {
      const atual = map.get(item.centroCusto) ?? 0
      const sinal = item.tipo === 'receita' ? 1 : -1
      map.set(item.centroCusto, atual + item.valor * sinal)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  }, [operacoesFiltradas])

  const dreMensal = useMemo(() => {
    const map = new Map<string, { receita: number; despesa: number }>()
    for (const item of operacoesFiltradas) {
      const data = new Date(item.createdAt)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const atual = map.get(chave) ?? { receita: 0, despesa: 0 }
      if (item.tipo === 'receita') {
        atual.receita += item.valor
      } else {
        atual.despesa += item.valor
      }
      map.set(chave, atual)
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0], 'pt-BR'))
      .map(([periodo, valores]) => ({
        periodo,
        receita: valores.receita,
        despesa: valores.despesa,
        resultado: valores.receita - valores.despesa,
      }))
  }, [operacoesFiltradas])

  const exportarFinanceiroJson = () => {
    const nome = `financeiro-lancamentos-${new Date().toISOString().slice(0, 10)}.json`
    baixarArquivo(JSON.stringify(operacoesFiltradas, null, 2), nome, 'application/json;charset=utf-8')
  }

  const exportarFinanceiroCsv = () => {
    const header = [
      'data',
      'nome',
      'tipo',
      'centro_custo',
      'valor',
      'origem_modulo',
      'referencia_id',
      'observacao',
      'sync_status',
    ]

    const rows = operacoesFiltradas.map((item) => [
      item.createdAt,
      item.nome,
      item.tipo,
      item.centroCusto,
      item.valor,
      item.origemModulo ?? 'manual',
      item.referenciaId ?? '',
      item.observacao ?? '',
      item.syncStatus,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const nome = `financeiro-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`
    baixarArquivo(csv, nome, 'text/csv;charset=utf-8')
  }

  const exportarDreCsv = () => {
    const header = ['periodo', 'receita', 'despesa', 'resultado']
    const rows = dreMensal.map((item) => [item.periodo, item.receita, item.despesa, item.resultado])
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const nome = `dre-simplificado-${new Date().toISOString().slice(0, 10)}.csv`
    baixarArquivo(csv, nome, 'text/csv;charset=utf-8')
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Financeiro</p>
        <h1>Fluxo operacional</h1>
        <p className="subtitle">Lancamentos automaticos de manejo e obra, com consolidacao por centro de custo.</p>
      </header>

      <section className="status-grid">
        <article className="status-card">
          <h2>Conexao</h2>
          <p className={isOnline ? 'badge online' : 'badge offline'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
        </article>
        <article className="status-card">
          <h2>Saldo</h2>
          <p className="kpi">R$ {resumo.saldo.toFixed(2)}</p>
        </article>
        <article className="status-card">
          <h2>Despesas</h2>
          <p className="kpi">R$ {resumo.despesa.toFixed(2)}</p>
        </article>
        <article className="status-card">
          <h2>Custo/cabeca/dia</h2>
          <p className="kpi">
            {resumo.totalCabecas > 0
              ? `R$ ${resumo.custoDiarioPorCabeca.toFixed(2)}`
              : '—'}
          </p>
          <small>{resumo.totalCabecas} cabecas · {resumo.diasPeriodo}d</small>
        </article>
      </section>

      <section className="card">
        <h2>Novo lancamento</h2>
        <form onSubmit={handleLancamento} className="form form-grid">
          <label>
            Descricao
            <input value={formNome} onChange={(event) => setFormNome(event.target.value)} placeholder="Ex: Venda de boi, Vacina lote A" />
          </label>
          <label>
            Tipo
            <select value={formTipo} onChange={(event) => setFormTipo(event.target.value as 'receita' | 'despesa')}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </label>
          <label>
            Centro de custo
            <select value={formCentro} onChange={(event) => setFormCentro(event.target.value as CentroCusto)}>
              {centrosCusto.map((centro) => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>
          </label>
          <label>
            Valor (R$)
            <input value={formValor} onChange={(event) => setFormValor(event.target.value)} placeholder="0,00" />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Observacao (opcional)
            <input value={formObs} onChange={(event) => setFormObs(event.target.value)} placeholder="Detalhe adicional" />
          </label>
          <button className="submit-btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Registrar lancamento
          </button>
        </form>
        {formErro ? <p className="error-text" style={{ marginTop: '0.5rem' }}>{formErro}</p> : null}
      </section>

      <section className="card">
        <h2>Filtros</h2>
        <div className="form form-grid">
          <label>
            Centro de custo
            <select value={centroFiltro} onChange={(event) => setCentroFiltro(event.target.value)}>
              <option value="">Todos os centros</option>
              {centrosCusto.map((centro) => (
                <option key={centro} value={centro}>
                  {centro}
                </option>
              ))}
            </select>
          </label>
          <label>
            De
            <input type="date" value={periodoInicio} onChange={(event) => setPeriodoInicio(event.target.value)} />
          </label>
          <label>
            Ate
            <input type="date" value={periodoFim} onChange={(event) => setPeriodoFim(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Consolidado por centro</h2>
        {porCentro.length === 0 ? (
          <p className="empty">Nenhum lancamento financeiro ainda.</p>
        ) : (
          <ul className="list">
            {porCentro.map(([centro, total]) => (
              <li key={centro} className="row">
                <div>
                  <strong>{centro}</strong>
                  <small>Saldo do centro de custo</small>
                </div>
                <div className="row-right">
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>DRE simplificado mensal</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <button type="button" className="mini-btn" onClick={exportarDreCsv}>
            Exportar DRE CSV
          </button>
        </div>
        {dreMensal.length === 0 ? (
          <p className="empty">Sem dados para gerar DRE simplificado.</p>
        ) : (
          <ul className="list">
            {dreMensal.map((item) => (
              <li key={item.periodo} className="row">
                <div>
                  <strong>{item.periodo}</strong>
                  <small>Receita R$ {item.receita.toFixed(2)} · Despesa R$ {item.despesa.toFixed(2)}</small>
                </div>
                <div className="row-right">
                  <span>R$ {item.resultado.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Ultimos lancamentos</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <button type="button" className="mini-btn" onClick={exportarFinanceiroJson}>
            Exportar JSON
          </button>
          <button type="button" className="mini-btn" onClick={exportarFinanceiroCsv}>
            Exportar CSV
          </button>
        </div>
        {operacoesFiltradas.length === 0 ? (
          <p className="empty">Sem lancamentos no periodo.</p>
        ) : (
          <ul className="list">
            {operacoesFiltradas
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 30)
              .map((item) => (
                <li key={item.id} className="row">
                  <div>
                    <strong>{item.nome}</strong>
                    <small>
                      {item.centroCusto} · {new Date(item.createdAt).toLocaleDateString('pt-BR')} · {item.origemModulo ?? 'manual'}
                    </small>
                  </div>
                  <div className="row-right">
                    <span>{item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}</span>
                    <span className={item.syncStatus === 'synced' ? 'chip synced' : 'chip pending'}>
                      {item.syncStatus === 'synced' ? 'Sincronizado' : 'Pendente'}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  )
}
