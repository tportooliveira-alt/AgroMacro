import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useLotes } from '../../core/hooks/useLotes'
import { usePesagens } from '../../core/hooks/usePesagens'
import { funcionarioService } from '../../core/services/funcionarioService'
import { pastoService } from '../../core/services/pastoService'

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

function withinPeriodo(dataIso: string, inicio: string, fim: string) {
  const instante = new Date(dataIso)
  if (Number.isNaN(instante.getTime())) return false
  if (inicio) {
    const inicioDate = new Date(`${inicio}T00:00:00`)
    if (instante < inicioDate) return false
  }
  if (fim) {
    const fimDate = new Date(`${fim}T23:59:59.999`)
    if (instante > fimDate) return false
  }
  return true
}

const categoriaOptions = [
  { value: 'cria', label: 'Cria' },
  { value: 'recria', label: 'Recria' },
  { value: 'engorda', label: 'Engorda' },
  { value: 'matrizes', label: 'Matrizes' },
] as const

const TIMELINE_PAGE_SIZE = 10

export function RebanhoPage() {
  const {
    lotes,
    movimentacoes,
    alertas,
    isOnline,
    pendentes,
    addLote,
    inativarLote,
    moverLote,
    movimentacoesPorLote,
  } = useLotes()
  const pastos = pastoService.listPastos()
  const funcionariosAtivos = funcionarioService
    .list()
    .filter((item) => item.ativo)
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<(typeof categoriaOptions)[number]['value']>('engorda')
  const [cabecas, setCabecas] = useState('')
  const [pesoMedio, setPesoMedio] = useState('')
  const [pastoAtual, setPastoAtual] = useState('')
  const { pesagens, addPesagem, removePesagem, getGmdForLote } = usePesagens()
  const [pesLoteId, setPesLoteId] = useState('')
  const [pesData, setPesData] = useState(() => new Date().toISOString().slice(0, 10))
  const [pesPesoMedio, setPesPesoMedio] = useState('')
  const [pesCabecas, setPesCabecas] = useState('')
  const [pesResponsavel, setPesResponsavel] = useState('')
  const [pesObs, setPesObs] = useState('')
  const [pesErro, setPesErro] = useState('')

  const [destinosPorLote, setDestinosPorLote] = useState<Record<string, string>>({})
  const [responsavelPorLote, setResponsavelPorLote] = useState<Record<string, string>>({})
  const [erroMovimentacao, setErroMovimentacao] = useState('')
  const [timelineLoteId, setTimelineLoteId] = useState('')
  const [timelineInicio, setTimelineInicio] = useState('')
  const [timelineFim, setTimelineFim] = useState(toDateInputValue(new Date()))
  const [timelinePage, setTimelinePage] = useState(1)

  const ativos = useMemo(() => lotes.filter((item) => item.status === 'ativo'), [lotes])
  const timelineFiltrada = useMemo(() => {
    const base = timelineLoteId
      ? movimentacoes.filter((item) => item.loteId === timelineLoteId)
      : movimentacoes

    return base
      .filter((item) => withinPeriodo(item.data, timelineInicio, timelineFim))
      .slice()
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [movimentacoes, timelineLoteId, timelineInicio, timelineFim])
  const totalTimelinePages = Math.max(1, Math.ceil(timelineFiltrada.length / TIMELINE_PAGE_SIZE))
  const timelinePaginada = timelineFiltrada.slice(
    (timelinePage - 1) * TIMELINE_PAGE_SIZE,
    timelinePage * TIMELINE_PAGE_SIZE,
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!nome.trim()) {
      return
    }

    await addLote({
      nome: nome.trim(),
      categoria,
      cabecas: Number(cabecas) || 0,
      pesoMedio: Number(pesoMedio.replace(',', '.')) || 0,
      pastoAtual,
    })

    setNome('')
    setCabecas('')
    setPesoMedio('')
    setPastoAtual('')
  }

  const handlePesagem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPesErro('')
    const lote = lotes.find((l) => l.id === pesLoteId)
    if (!lote) { setPesErro('Selecione um lote.'); return }
    const peso = Number(pesPesoMedio.replace(',', '.'))
    if (!peso || peso <= 0) { setPesErro('Peso médio inválido.'); return }
    const cab = Number(pesCabecas) || lote.cabecas
    if (!cab || cab <= 0) { setPesErro('Número de cabeças inválido.'); return }
    if (!pesData) { setPesErro('Informe a data da pesagem.'); return }

    await addPesagem({
      loteId: lote.id,
      loteNome: lote.nome,
      data: pesData,
      pesoMedio: peso,
      cabecas: cab,
      responsavel: pesResponsavel.trim() || 'Não informado',
      observacao: pesObs.trim() || undefined,
    })
    setPesPesoMedio('')
    setPesCabecas('')
    setPesObs('')
  }

  const handleMoverLote = async (loteId: string) => {
    const destino = destinosPorLote[loteId] ?? ''
    const responsavel = responsavelPorLote[loteId] ?? ''

    try {
      setErroMovimentacao('')
      await moverLote(loteId, destino, responsavel)
    } catch (error) {
      if (error instanceof Error) {
        setErroMovimentacao(error.message)
        return
      }
      setErroMovimentacao('Falha ao mover lote. Tente novamente.')
    }
  }

  const exportarTimelineJson = () => {
    const nome = `timeline-lotes-${new Date().toISOString().slice(0, 10)}.json`
    baixarArquivo(JSON.stringify(timelineFiltrada, null, 2), nome, 'application/json;charset=utf-8')
  }

  const exportarTimelineCsv = () => {
    const header = [
      'data',
      'lote_id',
      'lote_nome',
      'origem_pasto',
      'destino_pasto',
      'responsavel',
      'sync_status',
    ]
    const rows = timelineFiltrada.map((item) => [
      item.data,
      item.loteId,
      item.loteNome,
      item.origemPasto,
      item.destinoPasto,
      item.responsavel,
      item.syncStatus,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const nome = `timeline-lotes-${new Date().toISOString().slice(0, 10)}.csv`
    baixarArquivo(csv, nome, 'text/csv;charset=utf-8')
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Rebanho</p>
        <h1>Lotes</h1>
        <p className="subtitle">Gestao de lotes com sincronizacao online e fallback offline minimo.</p>
      </header>

      {alertas.length > 0 && (
        <section className="card" style={{ borderLeft: '4px solid #e07c00' }}>
          <h2 style={{ color: '#e07c00' }}>⚠ Inconsistencias detectadas ({alertas.length})</h2>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {alertas.map((alerta, index) => (
              <li key={index} style={{ fontSize: '0.85rem' }}>{alerta}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="status-grid">
        <article className="status-card">
          <h2>Conexao</h2>
          <p className={isOnline ? 'badge online' : 'badge offline'}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </p>
        </article>
        <article className="status-card">
          <h2>Lotes ativos</h2>
          <p className="kpi">{ativos.length}</p>
        </article>
        <article className="status-card">
          <h2>Pendentes sync</h2>
          <p className="kpi">{pendentes}</p>
        </article>
      </section>

      <section className="card">
        <h2>Novo lote</h2>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>
            Nome do lote
            <input value={nome} onChange={(event) => setNome(event.target.value)} />
          </label>
          <label>
            Categoria
            <select
              value={categoria}
              onChange={(event) =>
                setCategoria(event.target.value as (typeof categoriaOptions)[number]['value'])
              }
            >
              {categoriaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cabecas
            <input value={cabecas} onChange={(event) => setCabecas(event.target.value)} />
          </label>
          <label>
            Peso medio (kg)
            <input value={pesoMedio} onChange={(event) => setPesoMedio(event.target.value)} />
          </label>
          <label>
            Pasto atual
            <select value={pastoAtual} onChange={(event) => setPastoAtual(event.target.value)}>
              <option value="">Nao alocado</option>
              {pastos.map((pasto) => (
                <option key={pasto.id} value={pasto.nome}>
                  {pasto.nome}
                </option>
              ))}
            </select>
          </label>
          <button className="submit-btn" type="submit">
            Cadastrar lote
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Registrar pesagem</h2>
        <form onSubmit={handlePesagem} className="form form-grid">
          <label>
            Lote
            <select value={pesLoteId} onChange={(e) => { setPesLoteId(e.target.value); setPesCabecas('') }}>
              <option value="">Selecione o lote</option>
              {lotes.filter((l) => l.status === 'ativo').map((l) => (
                <option key={l.id} value={l.id}>{l.nome} ({l.cabecas} cab.)</option>
              ))}
            </select>
          </label>
          <label>
            Data da pesagem
            <input type="date" value={pesData} onChange={(e) => setPesData(e.target.value)} />
          </label>
          <label>
            Peso médio (kg/cabeça)
            <input value={pesPesoMedio} onChange={(e) => setPesPesoMedio(e.target.value)} placeholder="Ex: 380,5" />
          </label>
          <label>
            Cabeças pesadas
            <input
              value={pesCabecas}
              onChange={(e) => setPesCabecas(e.target.value)}
              placeholder={pesLoteId ? `Padrão: ${lotes.find((l) => l.id === pesLoteId)?.cabecas ?? ''}` : 'Qtd. cabeças'}
            />
          </label>
          <label>
            Responsável
            <select value={pesResponsavel} onChange={(e) => setPesResponsavel(e.target.value)}>
              <option value="">Não informado</option>
              {funcionariosAtivos.map((f) => (
                <option key={f.id} value={f.nome}>{f.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Observação (opcional)
            <input value={pesObs} onChange={(e) => setPesObs(e.target.value)} placeholder="Ex: Pós-desmame, início de engorda..." />
          </label>
          {pesErro ? <p className="error-text" style={{ gridColumn: '1 / -1' }}>{pesErro}</p> : null}
          <button className="submit-btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Registrar pesagem
          </button>
        </form>
      </section>

      {lotes.filter((l) => l.status === 'ativo').length > 0 && (
        <section className="card">
          <h2>GMD por lote</h2>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.8rem' }}>
            Ganho de Peso Diário — calculado entre as duas últimas pesagens de cada lote.
          </p>
          <ul className="list">
            {lotes.filter((l) => l.status === 'ativo').map((lote) => {
              const gmd = getGmdForLote(lote.id, lote.nome)
              return (
                <li key={lote.id} className="row">
                  <div>
                    <strong>{lote.nome}</strong>
                    <small>
                      {gmd.totalPesagens === 0
                        ? 'Nenhuma pesagem registrada'
                        : gmd.totalPesagens === 1
                          ? `1 pesagem · ${gmd.pesoAtual} kg/cab`
                          : `${gmd.totalPesagens} pesagens · Peso atual: ${gmd.pesoAtual} kg/cab`}
                    </small>
                  </div>
                  <div className="row-right">
                    {gmd.gmd !== null ? (
                      <span
                        className="chip"
                        style={{
                          background: gmd.gmd >= 0.8 ? '#d4f7dc' : gmd.gmd >= 0.4 ? '#fff4cc' : '#ffe0e0',
                          color: gmd.gmd >= 0.8 ? '#1a6b2f' : gmd.gmd >= 0.4 ? '#7a5700' : '#a00',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          padding: '0.3rem 0.7rem',
                        }}
                      >
                        {gmd.gmd >= 0} {gmd.gmd > 0 ? '+' : ''}{gmd.gmd} kg/dia
                      </span>
                    ) : (
                      <span className="chip pending">—</span>
                    )}
                    {gmd.ganhoTotal !== null && (
                      <small style={{ color: gmd.ganhoTotal >= 0 ? '#1a6b2f' : '#a00' }}>
                        {gmd.ganhoTotal >= 0 ? '+' : ''}{gmd.ganhoTotal} kg total
                      </small>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {pesagens.length > 0 && (
        <section className="card">
          <h2>Histórico de pesagens</h2>
          <ul className="list">
            {pesagens
              .slice()
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .slice(0, 20)
              .map((p) => (
                <li key={p.id} className="row">
                  <div>
                    <strong>{p.loteNome}</strong>
                    <small>
                      {new Date(p.data).toLocaleDateString('pt-BR')} · {p.pesoMedio} kg/cab · {p.cabecas} cab. · {p.responsavel}
                      {p.observacao ? ` · ${p.observacao}` : ''}
                    </small>
                  </div>
                  <div className="row-right">
                    <span>{(p.pesoMedio * p.cabecas).toFixed(0)} kg total</span>
                    <button
                      type="button"
                      className="mini-btn"
                      style={{ color: '#a00' }}
                      onClick={() => removePesagem(p.id)}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Timeline de movimentacoes</h2>
        <div className="form form-grid">
          <label>
            Lote
            <select
              value={timelineLoteId}
              onChange={(event) => {
                setTimelineLoteId(event.target.value)
                setTimelinePage(1)
              }}
            >
              <option value="">Todos os lotes</option>
              {lotes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            De
            <input
              type="date"
              value={timelineInicio}
              onChange={(event) => {
                setTimelineInicio(event.target.value)
                setTimelinePage(1)
              }}
            />
          </label>
          <label>
            Ate
            <input
              type="date"
              value={timelineFim}
              onChange={(event) => {
                setTimelineFim(event.target.value)
                setTimelinePage(1)
              }}
            />
          </label>
        </div>
        <div className="row-right" style={{ marginTop: '0.8rem', justifyItems: 'start' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="mini-btn" onClick={exportarTimelineJson}>
              Exportar JSON
            </button>
            <button type="button" className="mini-btn" onClick={exportarTimelineCsv}>
              Exportar CSV
            </button>
          </div>
          <small>{timelineFiltrada.length} registro(s) no periodo filtrado.</small>
        </div>
        {timelineFiltrada.length === 0 ? (
          <p className="empty" style={{ marginTop: '0.8rem' }}>Nenhuma movimentacao no filtro atual.</p>
        ) : (
          <>
            <ul className="history-list" style={{ marginTop: '0.8rem' }}>
              {timelinePaginada.map((mov) => (
                <li key={mov.id}>
                  {new Date(mov.data).toLocaleDateString('pt-BR')} - {mov.loteNome}: {mov.origemPasto || 'Sem pasto'} para {mov.destinoPasto} ({mov.responsavel})
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
              <button
                type="button"
                className="mini-btn"
                onClick={() => setTimelinePage((page) => Math.max(1, page - 1))}
                disabled={timelinePage === 1}
              >
                Anterior
              </button>
              <span>Pagina {timelinePage} de {totalTimelinePages}</span>
              <button
                type="button"
                className="mini-btn"
                onClick={() => setTimelinePage((page) => Math.min(totalTimelinePages, page + 1))}
                disabled={timelinePage === totalTimelinePages}
              >
                Proxima
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Lotes cadastrados</h2>
        {erroMovimentacao ? <p className="error-text">{erroMovimentacao}</p> : null}
        {lotes.length === 0 ? (
          <p className="empty">Nenhum lote cadastrado.</p>
        ) : (
          <ul className="list">
            {lotes
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.id} className="row">
                  <div>
                    <strong>{item.nome}</strong>
                    <small>
                      {item.categoria} · {item.cabecas} cabecas · {item.pesoMedio.toFixed(1)} kg · {item.pastoAtual || 'Sem pasto'}
                    </small>
                  </div>
                  <div className="row-right">
                    <span className={item.status === 'ativo' ? 'chip synced' : 'chip pending'}>
                      {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                    {item.status === 'ativo' ? (
                      <>
                        <select
                          value={destinosPorLote[item.id] ?? item.pastoAtual ?? ''}
                          onChange={(event) =>
                            setDestinosPorLote((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                        >
                          <option value="">Nao alocado</option>
                          {pastos.map((pasto) => (
                            <option key={pasto.id} value={pasto.nome}>
                              {pasto.nome}
                            </option>
                          ))}
                        </select>
                        <select
                          value={responsavelPorLote[item.id] ?? ''}
                          onChange={(event) =>
                            setResponsavelPorLote((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                        >
                          <option value="">Responsavel</option>
                          {funcionariosAtivos.map((funcionario) => (
                            <option key={funcionario.id} value={funcionario.nome}>
                              {funcionario.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="mini-btn"
                          onClick={() => handleMoverLote(item.id)}
                        >
                          Mover lote
                        </button>
                        <button type="button" className="mini-btn" onClick={() => inativarLote(item.id)}>
                          Inativar
                        </button>
                      </>
                    ) : null}
                  </div>
                  {movimentacoesPorLote(item.id).length > 0 ? (
                    <ul className="history-list">
                      {movimentacoesPorLote(item.id)
                        .slice()
                        .reverse()
                        .slice(0, 3)
                        .map((mov) => (
                          <li key={mov.id}>
                            {new Date(mov.data).toLocaleDateString('pt-BR')} - {mov.origemPasto || 'Sem pasto'} para {mov.destinoPasto} ({mov.responsavel})
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  )
}
