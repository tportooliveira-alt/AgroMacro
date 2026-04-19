import type { FormEvent } from 'react'
import { useState } from 'react'
import { useCompraGado } from '../../core/hooks/useCompraGado'
import { funcionarioService } from '../../core/services/funcionarioService'
import { loteService } from '../../core/services/loteService'
import type { CompraGadoCategoria } from '../../core/types/compraGado'

const categorias: Array<{ value: CompraGadoCategoria; label: string }> = [
  { value: 'cria', label: 'Cria' },
  { value: 'recria', label: 'Recria' },
  { value: 'engorda', label: 'Engorda' },
  { value: 'matrizes', label: 'Matrizes' },
  { value: 'touros', label: 'Touros' },
]

const statusLabel: Record<string, string> = {
  concluida: 'Concluída',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
}

const statusColor: Record<string, string> = {
  concluida: '#d4f7dc',
  pendente: '#fff4cc',
  cancelada: '#ffe0e0',
}

const statusTextColor: Record<string, string> = {
  concluida: '#1a6b2f',
  pendente: '#7a5700',
  cancelada: '#a00',
}

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function CompraGadoPage() {
  const { compras, isOnline, pendentes, addCompra, cancelarCompra } = useCompraGado()
  const lotes = loteService.list().filter((l) => l.status === 'ativo')
  const funcionarios = funcionarioService.list().filter((f) => f.ativo)

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [fornecedor, setFornecedor] = useState('')
  const [cabecas, setCabecas] = useState('')
  const [pesoMedio, setPesoMedio] = useState('')
  const [valorCabeca, setValorCabeca] = useState('')
  const [categoria, setCategoria] = useState<CompraGadoCategoria>('engorda')
  const [loteDestino, setLoteDestino] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')

  const cab = Number(cabecas) || 0
  const val = Number(valorCabeca.replace(',', '.')) || 0
  const totalPreview = cab * val

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!fornecedor.trim()) { setErro('Informe o fornecedor.'); return }
    if (cab <= 0) { setErro('Número de cabeças inválido.'); return }
    if (val <= 0) { setErro('Valor por cabeça inválido.'); return }
    if (!data) { setErro('Informe a data da compra.'); return }

    await addCompra({
      data,
      fornecedor,
      cabecas: cab,
      pesoMedio: Number(pesoMedio.replace(',', '.')) || 0,
      valorCabeca: val,
      categoria,
      loteDestino,
      responsavel,
      observacao,
    })

    setFornecedor('')
    setCabecas('')
    setPesoMedio('')
    setValorCabeca('')
    setLoteDestino('')
    setResponsavel('')
    setObservacao('')
  }

  const concluidas = compras.filter((c) => c.status === 'concluida')
  const totalGasto = concluidas.reduce((acc, c) => acc + c.valorTotal, 0)
  const totalCabecasCompradas = concluidas.reduce((acc, c) => acc + c.cabecas, 0)

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Rebanho</p>
        <h1>Compra de Gado</h1>
        <p className="subtitle">Registro completo de compras com histórico e controle financeiro.</p>
      </header>

      <section className="status-grid">
        <article className="status-card">
          <h2>Conexão</h2>
          <p className={isOnline ? 'badge online' : 'badge offline'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
        </article>
        <article className="status-card">
          <h2>Compras concluídas</h2>
          <p className="kpi">{concluidas.length}</p>
        </article>
        <article className="status-card">
          <h2>Cabeças compradas</h2>
          <p className="kpi">{totalCabecasCompradas}</p>
        </article>
        <article className="status-card" style={{ borderLeft: '3px solid #c0392b' }}>
          <h2>Total investido</h2>
          <p className="kpi" style={{ fontSize: '1.2rem', color: '#c0392b' }}>{fmt(totalGasto)}</p>
        </article>
      </section>

      <section className="card">
        <h2>Nova compra</h2>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>
            Data da compra
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <label>
            Fornecedor / Vendedor
            <input
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Nome do vendedor ou fazenda"
            />
          </label>
          <label>
            Categoria
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CompraGadoCategoria)}>
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label>
            Cabeças
            <input
              value={cabecas}
              onChange={(e) => setCabecas(e.target.value)}
              placeholder="Qtd. animais"
              inputMode="numeric"
            />
          </label>
          <label>
            Peso médio (kg/cab)
            <input
              value={pesoMedio}
              onChange={(e) => setPesoMedio(e.target.value)}
              placeholder="Ex: 350,0"
            />
          </label>
          <label>
            Valor por cabeça (R$)
            <input
              value={valorCabeca}
              onChange={(e) => setValorCabeca(e.target.value)}
              placeholder="Ex: 4.500,00"
            />
          </label>
          <label>
            Lote destino
            <select value={loteDestino} onChange={(e) => setLoteDestino(e.target.value)}>
              <option value="">Sem lote definido</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.nome}>{l.nome}</option>
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
          <label style={{ gridColumn: '1 / -1' }}>
            Observação
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Raça, procedência, condições de pagamento..."
            />
          </label>

          {totalPreview > 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#f0faf4',
                border: '1px solid #b7e4c7',
                borderRadius: '8px',
                padding: '0.8rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                {cab} cabeças × {fmt(val)}
              </span>
              <strong style={{ color: '#1a6b2f', fontSize: '1.1rem' }}>
                Total: {fmt(totalPreview)}
              </strong>
            </div>
          )}

          {erro ? <p className="error-text" style={{ gridColumn: '1 / -1' }}>{erro}</p> : null}

          <button className="submit-btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Registrar compra
          </button>
        </form>
      </section>

      {pendentes > 0 && (
        <section className="card" style={{ borderLeft: '4px solid #e07c00' }}>
          <h2 style={{ color: '#e07c00' }}>⚠ {pendentes} compra(s) aguardando sincronização</h2>
          <p style={{ fontSize: '0.85rem' }}>Serão enviadas automaticamente quando a conexão voltar.</p>
        </section>
      )}

      <section className="card">
        <h2>Histórico de compras</h2>
        {compras.length === 0 ? (
          <p className="empty">Nenhuma compra registrada.</p>
        ) : (
          <ul className="list">
            {compras
              .slice()
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .map((c) => (
                <li key={c.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong>{c.fornecedor}</strong>
                    <small>
                      {new Date(c.data).toLocaleDateString('pt-BR')} · {c.cabecas} cab. · {c.categoria}
                      {c.loteDestino ? ` → ${c.loteDestino}` : ''}
                      {c.responsavel ? ` · ${c.responsavel}` : ''}
                    </small>
                    {c.observacao ? <small style={{ color: '#666' }}>{c.observacao}</small> : null}
                  </div>
                  <div className="row-right" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                    <strong style={{ color: '#c0392b' }}>{fmt(c.valorTotal)}</strong>
                    <small style={{ color: '#888' }}>{fmt(c.valorCabeca)}/cab</small>
                    <span
                      className="chip"
                      style={{
                        background: statusColor[c.status],
                        color: statusTextColor[c.status],
                        fontWeight: 600,
                        fontSize: '0.78rem',
                      }}
                    >
                      {statusLabel[c.status]}
                    </span>
                    <span className={c.syncStatus === 'synced' ? 'chip synced' : 'chip pending'} style={{ fontSize: '0.75rem' }}>
                      {c.syncStatus === 'synced' ? 'Nuvem' : 'Local'}
                    </span>
                    {c.status !== 'cancelada' && (
                      <button
                        type="button"
                        className="mini-btn"
                        style={{ color: '#a00' }}
                        onClick={() => cancelarCompra(c.id)}
                      >
                        Cancelar
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
