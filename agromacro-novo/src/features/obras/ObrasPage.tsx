import type { FormEvent } from 'react'
import { useState } from 'react'
import { useObras } from '../../core/hooks/useObras'
import { funcionarioService } from '../../core/services/funcionarioService'
import { pastoService } from '../../core/services/pastoService'
import type { ObraStatus, ObraTipo } from '../../core/types/obra'

const tipos: Array<{ value: ObraTipo; label: string }> = [
  { value: 'cerca', label: 'Cerca' },
  { value: 'curral', label: 'Curral' },
  { value: 'bebedouro', label: 'Bebedouro' },
  { value: 'aguada', label: 'Aguada' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'estrada', label: 'Estrada' },
  { value: 'outro', label: 'Outro' },
]

const tipoLabel = Object.fromEntries(tipos.map((t) => [t.value, t.label]))

const statusLabel: Record<ObraStatus, string> = {
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  pausada: 'Pausada',
}

const statusColor: Record<ObraStatus, string> = {
  planejada: '#e8f0fe',
  em_andamento: '#fff4cc',
  concluida: '#d4f7dc',
  pausada: '#eee',
}

const statusTextColor: Record<ObraStatus, string> = {
  planejada: '#1a4fa0',
  em_andamento: '#7a5700',
  concluida: '#1a6b2f',
  pausada: '#666',
}

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function ObrasPage() {
  const { obras, isOnline, pendentes, addObra, atualizarStatus } = useObras()
  const pastos = pastoService.listPastos()
  const funcionarios = funcionarioService.list().filter((f) => f.ativo)

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<ObraTipo>('cerca')
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataPrevisao, setDataPrevisao] = useState('')
  const [pasto, setPasto] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [custoOrcado, setCustoOrcado] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const [custoRealPorObra, setCustoRealPorObra] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!titulo.trim()) { setErro('Informe o título da obra.'); return }
    if (!dataInicio) { setErro('Informe a data de início.'); return }

    await addObra({
      titulo,
      tipo,
      dataInicio,
      dataPrevisao,
      pasto,
      responsavel,
      custoOrcado: Number(custoOrcado.replace(',', '.')) || 0,
      descricao,
    })

    setTitulo('')
    setDataPrevisao('')
    setPasto('')
    setResponsavel('')
    setCustoOrcado('')
    setDescricao('')
  }

  const handleConcluir = async (id: string) => {
    const custoReal = Number((custoRealPorObra[id] ?? '').replace(',', '.')) || undefined
    await atualizarStatus(id, 'concluida', custoReal)
  }

  const emAndamento = obras.filter((o) => o.status === 'em_andamento').length
  const planejadas = obras.filter((o) => o.status === 'planejada').length
  const custoTotal = obras
    .filter((o) => o.status !== 'pausada')
    .reduce((acc, o) => acc + (o.custoReal > 0 ? o.custoReal : o.custoOrcado), 0)

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Operações</p>
        <h1>Obras e Melhorias</h1>
        <p className="subtitle">Planejamento e acompanhamento de cercas, currais, aguadas e infraestrutura.</p>
      </header>

      <section className="status-grid">
        <article className="status-card">
          <h2>Conexão</h2>
          <p className={isOnline ? 'badge online' : 'badge offline'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
        </article>
        <article className="status-card">
          <h2>Planejadas</h2>
          <p className="kpi">{planejadas}</p>
        </article>
        <article className="status-card">
          <h2>Em andamento</h2>
          <p className="kpi">{emAndamento}</p>
        </article>
        <article className="status-card" style={{ borderLeft: '3px solid #c0392b' }}>
          <h2>Custo total</h2>
          <p className="kpi" style={{ fontSize: '1.2rem', color: '#c0392b' }}>{fmt(custoTotal)}</p>
        </article>
      </section>

      <section className="card">
        <h2>Nova obra</h2>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>
            Título
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Cerca divisória pasto 3"
            />
          </label>
          <label>
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as ObraTipo)}>
              {tipos.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label>
            Data de início
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </label>
          <label>
            Previsão de término
            <input type="date" value={dataPrevisao} onChange={(e) => setDataPrevisao(e.target.value)} />
          </label>
          <label>
            Pasto / Local
            <select value={pasto} onChange={(e) => setPasto(e.target.value)}>
              <option value="">Não vinculado</option>
              {pastos.map((p) => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
              <option value="">Não informado</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.nome}>{f.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Custo orçado (R$)
            <input
              value={custoOrcado}
              onChange={(e) => setCustoOrcado(e.target.value)}
              placeholder="Ex: 12.000,00"
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Descrição
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Material, extensão, detalhes da execução..."
            />
          </label>

          {erro ? <p className="error-text" style={{ gridColumn: '1 / -1' }}>{erro}</p> : null}

          <button className="submit-btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Registrar obra
          </button>
        </form>
      </section>

      {pendentes > 0 && (
        <section className="card" style={{ borderLeft: '4px solid #e07c00' }}>
          <h2 style={{ color: '#e07c00' }}>⚠ {pendentes} obra(s) aguardando sincronização</h2>
          <p style={{ fontSize: '0.85rem' }}>Serão enviadas automaticamente quando a conexão voltar.</p>
        </section>
      )}

      <section className="card">
        <h2>Obras registradas</h2>
        {obras.length === 0 ? (
          <p className="empty">Nenhuma obra registrada.</p>
        ) : (
          <ul className="list">
            {obras
              .slice()
              .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
              .map((o) => (
                <li key={o.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong>{o.titulo}</strong>
                    <small>
                      {tipoLabel[o.tipo]} · início {new Date(`${o.dataInicio}T00:00:00`).toLocaleDateString('pt-BR')}
                      {o.dataPrevisao ? ` · previsão ${new Date(`${o.dataPrevisao}T00:00:00`).toLocaleDateString('pt-BR')}` : ''}
                      {o.pasto ? ` · ${o.pasto}` : ''}
                      {o.responsavel ? ` · ${o.responsavel}` : ''}
                    </small>
                    {o.descricao ? <small style={{ color: '#666' }}>{o.descricao}</small> : null}
                  </div>
                  <div className="row-right" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                    <strong style={{ color: '#c0392b' }}>
                      {o.custoReal > 0 ? fmt(o.custoReal) : fmt(o.custoOrcado)}
                    </strong>
                    <small style={{ color: '#888' }}>{o.custoReal > 0 ? 'real' : 'orçado'}</small>
                    <span
                      className="chip"
                      style={{
                        background: statusColor[o.status],
                        color: statusTextColor[o.status],
                        fontWeight: 600,
                        fontSize: '0.78rem',
                      }}
                    >
                      {statusLabel[o.status]}
                    </span>
                    <span className={o.syncStatus === 'synced' ? 'chip synced' : 'chip pending'} style={{ fontSize: '0.75rem' }}>
                      {o.syncStatus === 'synced' ? 'Nuvem' : 'Local'}
                    </span>
                    {o.status === 'planejada' && (
                      <button type="button" className="mini-btn" onClick={() => atualizarStatus(o.id, 'em_andamento')}>
                        Iniciar
                      </button>
                    )}
                    {o.status === 'em_andamento' && (
                      <>
                        <input
                          value={custoRealPorObra[o.id] ?? ''}
                          onChange={(e) =>
                            setCustoRealPorObra((prev) => ({ ...prev, [o.id]: e.target.value }))
                          }
                          placeholder="Custo real (R$)"
                          style={{ width: '110px', fontSize: '0.8rem' }}
                        />
                        <button type="button" className="mini-btn" onClick={() => handleConcluir(o.id)}>
                          Concluir
                        </button>
                        <button type="button" className="mini-btn" onClick={() => atualizarStatus(o.id, 'pausada')}>
                          Pausar
                        </button>
                      </>
                    )}
                    {o.status === 'pausada' && (
                      <button type="button" className="mini-btn" onClick={() => atualizarStatus(o.id, 'em_andamento')}>
                        Retomar
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  )
}
