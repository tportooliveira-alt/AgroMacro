import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { usePastos } from '../../core/hooks/usePastos'
import type { AcaoTipo, Pasto, PastoStatus } from '../../core/types/pasto'

type LegacyCoords = [number, number][]

function normalizeNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildMiniPolygonPoints(coords?: LegacyCoords): string {
  if (!coords || coords.length < 3) {
    return '8,40 24,8 44,13 55,34 42,55 16,50'
  }

  const lats = coords.map((c) => c[0])
  const lngs = coords.map((c) => c[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const w = Math.max(maxLng - minLng, 0.00001)
  const h = Math.max(maxLat - minLat, 0.00001)

  return coords
    .map(([lat, lng]) => {
      const x = 8 + ((lng - minLng) / w) * 48
      const y = 56 - ((lat - minLat) / h) * 48
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function areaFromCoords(coords?: LegacyCoords): number {
  if (!coords || coords.length < 3) return 0
  let sum = 0
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length
    const lat1 = (coords[i]?.[0] ?? 0) * (Math.PI / 180)
    const lat2 = (coords[j]?.[0] ?? 0) * (Math.PI / 180)
    const dLng = ((coords[j]?.[1] ?? 0) - (coords[i]?.[1] ?? 0)) * (Math.PI / 180)
    sum += dLng * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs((sum * 6378137 * 6378137) / 2) / 10000
}

function centerFromCoords(coords?: LegacyCoords): { lat: number; lng: number } | null {
  if (!coords || coords.length === 0) return null
  const lat = coords.reduce((acc, cur) => acc + (cur[0] ?? 0), 0) / coords.length
  const lng = coords.reduce((acc, cur) => acc + (cur[1] ?? 0), 0) / coords.length
  return { lat, lng }
}

function formatCoordsText(coords?: LegacyCoords): string {
  if (!coords || coords.length === 0) return ''
  return coords.map(([lat, lng]) => `${lat}, ${lng}`).join('\n')
}

function parseCoordsText(text: string): LegacyCoords | null {
  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: LegacyCoords = []
  for (const row of rows) {
    const [latRaw, lngRaw] = row.split(',').map((v) => v.trim())
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    parsed.push([lat, lng])
  }

  if (parsed.length < 3) return null
  return parsed
}

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

const statusInfo: Record<PastoStatus, { label: string; cor: string; fundo: string }> = {
  disponivel:  { label: 'Disponível',   cor: '#0b6b50', fundo: '#d9f4ea' },
  ocupado:     { label: 'Ocupado',      cor: '#1a3a6c', fundo: '#ddeaff' },
  em_descanso: { label: 'Em descanso',  cor: '#7a4b00', fundo: '#fff1db' },
  em_obra:     { label: 'Em obra',      cor: '#6c1a1a', fundo: '#ffe5e5' },
}

const acaoLabel: Record<AcaoTipo, string> = {
  troca_pasto: '🔄 Troca de Pasto',
  obra:        '🔧 Obra',
  manejo:      '🐄 Manejo',
}

const TIMELINE_PAGE_SIZE = 10

function PastoCard({
  pasto,
  historico,
  onAcao,
  onAtualizarRebanho,
  onAtualizarPoligono,
  coords,
}: {
  pasto: Pasto
  historico: { tipo: AcaoTipo; descricao: string; responsavel: string; custo?: number; data: string }[]
  onAcao: (
    pastoId: string,
    tipo: AcaoTipo,
    descricao: string,
    responsavel: string,
    custo?: number,
  ) => void
  onAtualizarRebanho: (pastoId: string, loteAtual: string) => void
  onAtualizarPoligono: (pastoId: string, coords: LegacyCoords) => boolean
  coords?: LegacyCoords
}) {
  const [acaoAberta, setAcaoAberta] = useState<AcaoTipo | null>(null)
  const [descricao, setDescricao] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [custo, setCusto] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [verHistorico, setVerHistorico] = useState(false)
  const [rebanhoAberto, setRebanhoAberto] = useState(false)
  const [poligonoAberto, setPoligonoAberto] = useState(false)
  const [loteAtualInput, setLoteAtualInput] = useState(pasto.loteAtual)
  const [coordsText, setCoordsText] = useState(formatCoordsText(coords))
  const [erroCoords, setErroCoords] = useState('')
  const atalhosManejo = [
    'Vermifugacao aplicada',
    'Sal mineral reposto',
    'Conferencia de aguada',
  ]

  const info = statusInfo[pasto.status]
  const areaMapa = areaFromCoords(coords ?? pasto.coords)
  const areaExibida = pasto.area > 0 ? pasto.area : areaMapa

  const confirmarAcao = (e: FormEvent) => {
    e.preventDefault()
    if (!acaoAberta || !descricao.trim() || !responsavel.trim()) return
    const custoNumerico = Number(custo.replace(',', '.')) || 0

    if ((acaoAberta === 'obra' || acaoAberta === 'manejo') && custoNumerico <= 0) {
      setErroAcao('Informe custo maior que zero para obra/manejo.')
      return
    }

    setErroAcao('')
    onAcao(pasto.id, acaoAberta, descricao.trim(), responsavel.trim(), custoNumerico)
    setDescricao('')
    setResponsavel('')
    setCusto('')
    setAcaoAberta(null)
  }

  const salvarRebanho = (e: FormEvent) => {
    e.preventDefault()
    onAtualizarRebanho(pasto.id, loteAtualInput)
    setRebanhoAberto(false)
  }

  const salvarPoligono = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseCoordsText(coordsText)
    if (!parsed) {
      setErroCoords('Coordenadas invalidas. Use uma linha por ponto: lat, lng')
      return
    }
    const ok = onAtualizarPoligono(pasto.id, parsed)
    if (!ok) {
      setErroCoords('Nao foi possivel salvar este poligono.')
      return
    }
    setErroCoords('')
    setPoligonoAberto(false)
  }

  return (
    <article className="pasto-card">
      {/* Cabeçalho do card */}
      <div className="pasto-card-top">
        <div className="pasto-card-info">
          <strong className="pasto-nome">{pasto.nome}</strong>
          <span className="pasto-meta">{areaExibida.toFixed(2)} ha · {pasto.capim}</span>
          {pasto.loteAtual && (
            <span className="pasto-lote">🐄 {pasto.loteAtual}</span>
          )}
        </div>
        <span
          className="pasto-status-chip"
          style={{ background: info.fundo, color: info.cor }}
        >
          {info.label}
        </span>
      </div>

      <button
        type="button"
        className="pasto-mini-mapa"
        aria-label="Desenho do pasto"
        onClick={() => {
          const centro = centerFromCoords(coords)
          if (!centro) return
          const url = `https://www.google.com/maps?q=${centro.lat},${centro.lng}`
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
      >
        <svg viewBox="0 0 64 64" role="img">
          <rect x="2" y="2" width="60" height="60" rx="8" className="mini-mapa-fundo" />
          <polygon points={buildMiniPolygonPoints(coords)} className="mini-mapa-poligono" />
        </svg>
      </button>

      {/* Botões de ação */}
      <div className="pasto-acoes-btns">
        <button
          type="button"
          className={`pasto-acao-btn${poligonoAberto ? ' ativo' : ''}`}
          onClick={() => {
            setCoordsText(formatCoordsText(coords ?? pasto.coords))
            setErroCoords('')
            setPoligonoAberto((v) => !v)
          }}
        >
          🗺️ Editar mapa
        </button>
        <button
          type="button"
          className={`pasto-acao-btn${rebanhoAberto ? ' ativo' : ''}`}
          onClick={() => setRebanhoAberto((v) => !v)}
        >
          🐄 Rebanho
        </button>
        {(['troca_pasto', 'obra', 'manejo'] as AcaoTipo[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            className={`pasto-acao-btn${acaoAberta === tipo ? ' ativo' : ''}`}
            onClick={() => setAcaoAberta(acaoAberta === tipo ? null : tipo)}
          >
            {acaoLabel[tipo]}
          </button>
        ))}
      </div>

      {poligonoAberto && (
        <form className="pasto-form" onSubmit={salvarPoligono}>
          <p className="pasto-form-titulo">Poligono real do pasto</p>
          <label>
            Coordenadas (uma linha por ponto: lat, lng)
            <textarea
              value={coordsText}
              onChange={(e) => setCoordsText(e.target.value)}
              rows={5}
            />
          </label>
          {erroCoords ? <p className="error-text">{erroCoords}</p> : null}
          <div className="pasto-form-btns">
            <button type="submit" className="pasto-confirm-btn">Salvar poligono</button>
            <button type="button" className="pasto-cancel-btn" onClick={() => setPoligonoAberto(false)}>
              Fechar
            </button>
          </div>
        </form>
      )}

      {rebanhoAberto && (
        <form className="pasto-form" onSubmit={salvarRebanho}>
          <p className="pasto-form-titulo">Rebanho no pasto</p>
          <label>
            Lote / Rebanho atual
            <input
              value={loteAtualInput}
              onChange={(e) => setLoteAtualInput(e.target.value)}
              placeholder="Ex: Lote Engorda 1"
            />
          </label>
          <div className="pasto-form-btns">
            <button type="submit" className="pasto-confirm-btn">
              Salvar rebanho
            </button>
            <button type="button" className="pasto-cancel-btn" onClick={() => setRebanhoAberto(false)}>
              Fechar
            </button>
          </div>
        </form>
      )}

      {/* Formulário inline da ação selecionada */}
      {acaoAberta && (
        <form className="pasto-form" onSubmit={confirmarAcao}>
          <p className="pasto-form-titulo">{acaoLabel[acaoAberta]}</p>
          {acaoAberta === 'manejo' && (
            <div className="manejo-atalhos">
              {atalhosManejo.map((atalho) => (
                <button
                  key={atalho}
                  type="button"
                  className="atalho-btn"
                  onClick={() => setDescricao(atalho)}
                >
                  {atalho}
                </button>
              ))}
            </div>
          )}
          <label>
            Responsável
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome de quem fez"
            />
          </label>
          <label>
            Descrição
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={
                acaoAberta === 'troca_pasto'
                  ? 'Ex: Levou lote para pasto 3'
                  : acaoAberta === 'obra'
                  ? 'Ex: Consertou cerca sul, 200m'
                  : 'Ex: Vermifugação geral, sal mineral reposto'
              }
              rows={2}
            />
          </label>
          {(acaoAberta === 'obra' || acaoAberta === 'manejo') && (
            <label>
              Custo (R$)
              <input
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
              />
            </label>
          )}
          {erroAcao ? <p className="error-text">{erroAcao}</p> : null}
          <div className="pasto-form-btns">
            <button type="submit" className="pasto-confirm-btn">
              Registrar
            </button>
            <button
              type="button"
              className="pasto-cancel-btn"
              onClick={() => setAcaoAberta(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="pasto-historico-wrap">
          <button
            type="button"
            className="pasto-historico-toggle"
            onClick={() => setVerHistorico((v) => !v)}
          >
            {verHistorico ? '▲ Ocultar histórico' : `▼ Ver histórico (${historico.length})`}
          </button>
          {verHistorico && (
            <ul className="pasto-historico-list">
              {historico
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i} className="pasto-historico-item">
                    <span className="pasto-historico-tipo">
                      {h.tipo === 'troca_pasto' ? '🔄' : h.tipo === 'obra' ? '🔧' : '🐄'}
                      {' '}{h.tipo.replace('_', ' ')}
                    </span>
                    <span className="pasto-historico-desc">{h.descricao}</span>
                    <span className="pasto-historico-meta">
                      {h.responsavel}
                      {h.custo && h.custo > 0 ? ` · R$ ${h.custo.toFixed(2)}` : ''}
                      {' · '}
                      {new Date(h.data).toLocaleDateString('pt-BR')}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}

export function PastosPage() {
  const {
    pastos,
    acoes,
    addPasto,
    registrarAcao,
    acoesDoPost,
    importarDoMapa,
    atualizarRebanho,
    aplicarAcaoFazenda,
    aplicarMapaReal,
    atualizarPoligono,
  } = usePastos()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [area, setArea] = useState('')
  const [capim, setCapim] = useState('')
  const [aguada, setAguada] = useState(true)
  const [loteAtual, setLoteAtual] = useState('')
  const [mensagemImportacao, setMensagemImportacao] = useState('')
  const [mapaCoords, setMapaCoords] = useState<Record<string, LegacyCoords>>({})
  const [responsavelFazenda, setResponsavelFazenda] = useState('')
  const [mensagemFazenda, setMensagemFazenda] = useState('')
  const [busca, setBusca] = useState('')
  const [timelinePastoId, setTimelinePastoId] = useState('')
  const [timelineInicio, setTimelineInicio] = useState('')
  const [timelineFim, setTimelineFim] = useState(toDateInputValue(new Date()))
  const [timelinePage, setTimelinePage] = useState(1)

  useEffect(() => {
    let ativo = true

    fetch('/legacy-map-pastos.json')
      .then((r) => r.json() as Promise<Array<{ nome: string; coords: LegacyCoords }>>)
      .then((items) => {
        if (!ativo || !Array.isArray(items)) return
        const next: Record<string, LegacyCoords> = {}
        for (const item of items) {
          if (!item?.nome || !Array.isArray(item.coords)) continue
          next[normalizeNome(item.nome)] = item.coords
        }
        setMapaCoords(next)
        aplicarMapaReal(items)
      })
      .catch(() => {
        if (ativo) setMapaCoords({})
      })

    return () => {
      ativo = false
    }
  }, [])

  const handleAddPasto = (e: FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    addPasto({
      nome: nome.trim(),
      area: Number(area) || 0,
      capim: capim.trim() || 'Braquiária',
      aguada,
      loteAtual: loteAtual.trim(),
    })
    setNome('')
    setArea('')
    setCapim('')
    setAguada(true)
    setLoteAtual('')
    setMostrarForm(false)
  }

  const ativos = pastos.length

  const handleImportarMapa = () => {
    const result = importarDoMapa()
    if (result.added === 0) {
      setMensagemImportacao('Nenhum novo pasto para importar. Todos ja estao cadastrados.')
      return
    }

    setMensagemImportacao(`${result.added} pastos importados do Google Maps legado.`)
  }

  const aplicarAcaoGeral = (tipo: AcaoTipo, descricao: string) => {
    const total = aplicarAcaoFazenda(tipo, descricao, responsavelFazenda)
    if (!responsavelFazenda.trim()) {
      setMensagemFazenda('Informe o responsavel para aplicar acao na fazenda toda.')
      return
    }

    setMensagemFazenda(`Acao aplicada em ${total} pastos.`)
  }

  const pastosFiltrados = pastos.filter((p) => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return true
    return normalizeNome(p.nome).includes(normalizeNome(termo))
  })

  const getAreaHa = (pasto: Pasto) => {
    const coords = mapaCoords[normalizeNome(pasto.nome)]
    const areaMapa = areaFromCoords(coords)
    return pasto.area > 0 ? pasto.area : areaMapa
  }

  const areaTotalHa = pastos.reduce((acc, p) => acc + getAreaHa(p), 0)
  const areaMediaHa = pastos.length > 0 ? areaTotalHa / pastos.length : 0
  const timelineFiltrada = acoes
    .filter((acao) => (timelinePastoId ? acao.pastoId === timelinePastoId : true))
    .filter((acao) => withinPeriodo(acao.data, timelineInicio, timelineFim))
    .slice()
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  const totalTimelinePages = Math.max(1, Math.ceil(timelineFiltrada.length / TIMELINE_PAGE_SIZE))
  const timelinePaginada = timelineFiltrada.slice(
    (timelinePage - 1) * TIMELINE_PAGE_SIZE,
    timelinePage * TIMELINE_PAGE_SIZE,
  )

  const exportarTimelinePastosJson = () => {
    const nome = `timeline-pastos-${new Date().toISOString().slice(0, 10)}.json`
    baixarArquivo(JSON.stringify(timelineFiltrada, null, 2), nome, 'application/json;charset=utf-8')
  }

  const exportarTimelinePastosCsv = () => {
    const header = ['data', 'pasto_id', 'tipo', 'descricao', 'responsavel', 'custo', 'sync_status']
    const rows = timelineFiltrada.map((item) => [
      item.data,
      item.pastoId,
      item.tipo,
      item.descricao,
      item.responsavel,
      item.custo ?? 0,
      item.syncStatus,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const nome = `timeline-pastos-${new Date().toISOString().slice(0, 10)}.csv`
    baixarArquivo(csv, nome, 'text/csv;charset=utf-8')
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Fazenda</p>
        <h1>Pastos</h1>
        <p className="subtitle">
          Cada pasto tem seu card. Registre trocas, obras e manejos direto no card.
        </p>
      </header>

      <section className="status-grid">
        <article className="status-card">
          <h2>Total de pastos</h2>
          <p className="kpi">{ativos}</p>
        </article>
        <article className="status-card">
          <h2>Em obra</h2>
          <p className="kpi">{pastos.filter((p) => p.status === 'em_obra').length}</p>
        </article>
        <article className="status-card">
          <h2>Area media (ha)</h2>
          <p className="kpi">{areaMediaHa.toFixed(2)}</p>
        </article>
      </section>

      {/* Botão cadastrar */}
      <section className="card">
        <div className="pasto-header-row">
          <h2 style={{ margin: 0 }}>Seus pastos</h2>
          <div className="pasto-header-actions">
            <button type="button" className="map-import-btn" onClick={handleImportarMapa}>
              Importar do mapa
            </button>
            <button
              type="button"
              className="submit-btn"
              onClick={() => setMostrarForm((v) => !v)}
            >
              {mostrarForm ? 'Cancelar' : '+ Novo pasto'}
            </button>
          </div>
        </div>

        {mensagemImportacao ? <p className="import-info">{mensagemImportacao}</p> : null}

        <div className="form" style={{ marginTop: '0.7rem' }}>
          <label>
            Procurar pasto
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite nome do pasto"
            />
          </label>
        </div>

        {mostrarForm && (
          <form className="form form-grid" onSubmit={handleAddPasto} style={{ marginTop: '1rem' }}>
            <label>
              Nome do pasto
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Pasto 1 - Fundão" />
            </label>
            <label>
              Área (ha)
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex: 12" type="number" min="0" />
            </label>
            <label>
              Tipo de capim
              <input value={capim} onChange={(e) => setCapim(e.target.value)} placeholder="Ex: Braquiária" />
            </label>
            <label>
              Lote atual
              <input value={loteAtual} onChange={(e) => setLoteAtual(e.target.value)} placeholder="Ex: Lote Matriz" />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={aguada} onChange={(e) => setAguada(e.target.checked)} />
              Tem aguada
            </label>
            <button type="submit" className="submit-btn">Cadastrar pasto</button>
          </form>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Acoes em toda fazenda</h2>
        <div className="form">
          <label>
            Responsavel geral
            <input
              value={responsavelFazenda}
              onChange={(e) => setResponsavelFazenda(e.target.value)}
              placeholder="Ex: Equipe Campo A"
            />
          </label>
          <div className="pasto-acoes-btns">
            <button type="button" className="pasto-acao-btn" onClick={() => aplicarAcaoGeral('troca_pasto', 'Rotacao de lotes realizada')}>
              Rotacao de lotes
            </button>
            <button type="button" className="pasto-acao-btn" onClick={() => aplicarAcaoGeral('manejo', 'Manejo geral da fazenda')}>
              Manejo geral
            </button>
            <button type="button" className="pasto-acao-btn" onClick={() => aplicarAcaoGeral('obra', 'Obra geral da fazenda')}>
              Obra geral
            </button>
          </div>
          {mensagemFazenda ? <p className="import-info">{mensagemFazenda}</p> : null}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Timeline de pastos</h2>
        <div className="form form-grid">
          <label>
            Pasto
            <select
              value={timelinePastoId}
              onChange={(e) => {
                setTimelinePastoId(e.target.value)
                setTimelinePage(1)
              }}
            >
              <option value="">Todos os pastos</option>
              {pastos.map((pasto) => (
                <option key={pasto.id} value={pasto.id}>
                  {pasto.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            De
            <input
              type="date"
              value={timelineInicio}
              onChange={(e) => {
                setTimelineInicio(e.target.value)
                setTimelinePage(1)
              }}
            />
          </label>
          <label>
            Ate
            <input
              type="date"
              value={timelineFim}
              onChange={(e) => {
                setTimelineFim(e.target.value)
                setTimelinePage(1)
              }}
            />
          </label>
        </div>
        <div className="row-right" style={{ marginTop: '0.8rem', justifyItems: 'start' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="mini-btn" onClick={exportarTimelinePastosJson}>
              Exportar JSON
            </button>
            <button type="button" className="mini-btn" onClick={exportarTimelinePastosCsv}>
              Exportar CSV
            </button>
          </div>
          <small>{timelineFiltrada.length} registro(s) no periodo filtrado.</small>
        </div>
        {timelineFiltrada.length === 0 ? (
          <p className="empty" style={{ marginTop: '0.8rem' }}>Nenhuma acao encontrada no filtro atual.</p>
        ) : (
          <>
            <ul className="history-list" style={{ marginTop: '0.8rem' }}>
              {timelinePaginada.map((acao) => {
                const nomePasto = pastos.find((p) => p.id === acao.pastoId)?.nome ?? 'Pasto removido'
                return (
                  <li key={acao.id}>
                    {new Date(acao.data).toLocaleDateString('pt-BR')} - {nomePasto}: {acao.tipo.replace('_', ' ')} por {acao.responsavel}
                    {acao.custo && acao.custo > 0 ? ` · R$ ${acao.custo.toFixed(2)}` : ''}
                  </li>
                )
              })}
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

      {/* Cards dos pastos */}
      <section className="pastos-grid">
        {pastosFiltrados.length === 0 && (
          <p className="empty">Nenhum pasto cadastrado ainda. Clique em "Novo pasto" para começar.</p>
        )}
        {pastosFiltrados.map((pasto) => (
          <PastoCard
            key={pasto.id}
            pasto={pasto}
            historico={acoesDoPost(pasto.id)}
            onAtualizarRebanho={atualizarRebanho}
            onAtualizarPoligono={atualizarPoligono}
            coords={pasto.coords ?? mapaCoords[normalizeNome(pasto.nome)]}
            onAcao={(pastoId, tipo, desc, resp, custo) =>
              registrarAcao({ pastoId, tipo, descricao: desc, responsavel: resp, custo })
            }
          />
        ))}
      </section>
    </main>
  )
}
