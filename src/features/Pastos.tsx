import { useMemo, useState, type FormEvent } from 'react'
import { criarPasto, editarPasto, excluirPasto, importarPastosDaFazenda, moverLote } from '../data/acoes'
import { useDb } from '../data/db'
import { lotacaoUAporHa } from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { CAPINS, type Lote, type Pasto, type PastoStatus } from '../domain/types'
import { Aviso, Campo, Modal, Vazio, num, tentar } from '../ui/base'

function statusDoPasto(p: Pasto, lotes: Lote[]): PastoStatus {
  if (p.statusManual !== 'disponivel') return p.statusManual
  return lotes.some((l) => l.ativo && l.pastoId === p.id) ? 'ocupado' : 'disponivel'
}

const rotuloStatus: Record<PastoStatus, string> = {
  disponivel: 'Disponivel',
  ocupado: 'Ocupado',
  descanso: 'Em descanso',
  reforma: 'Em reforma',
}

function MapaPastos({ pastos, lotes, selecionado, onSelecionar }: { pastos: Pasto[]; lotes: Lote[]; selecionado: string | null; onSelecionar: (id: string) => void }) {
  const comCoords = pastos.filter((p) => p.coords && p.coords.length > 2)
  const box = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
    for (const p of comCoords) for (const [lat, lng] of p.coords!) {
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
    }
    return { minLat, maxLat, minLng, maxLng }
  }, [comCoords])
  if (comCoords.length === 0) return null
  const W = 1000
  const latMed = (box.minLat + box.maxLat) / 2
  const escalaLng = Math.cos((latMed * Math.PI) / 180)
  const largura = (box.maxLng - box.minLng) * escalaLng
  const altura = box.maxLat - box.minLat
  const H = Math.max(300, Math.round((altura / largura) * W))
  const px = (lng: number) => ((lng - box.minLng) * escalaLng / largura) * W
  const py = (lat: number) => H - ((lat - box.minLat) / altura) * H
  return (
    <>
      <svg className="mapa" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mapa dos pastos">
        {comCoords.map((p) => (
          <polygon
            key={p.id}
            className={`${statusDoPasto(p, lotes)}${selecionado === p.id ? ' selecionado' : ''}`}
            points={p.coords!.map(([lat, lng]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(' ')}
            onClick={() => onSelecionar(p.id)}
          >
            <title>{`${p.nome} - ${fmt.dec1(p.areaHa)} ha`}</title>
          </polygon>
        ))}
      </svg>
      <div className="legenda">
        <span className="disponivel">Disponivel</span>
        <span className="ocupado">Ocupado</span>
        <span className="descanso">Descanso</span>
        <span className="reforma">Reforma</span>
      </div>
    </>
  )
}

export function Pastos() {
  const db = useDb()
  const [novo, setNovo] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  const [form, setForm] = useState({ nome: '', areaHa: '', capim: CAPINS[0]!, aguada: true })

  const pastosOrdenados = useMemo(
    () => [...db.pastos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [db.pastos],
  )
  const filtrados = filtro
    ? pastosOrdenados.filter((p) => p.nome.toLowerCase().includes(filtro.toLowerCase()))
    : pastosOrdenados
  const pastoSel = db.pastos.find((p) => p.id === selecionado) ?? null
  const areaTotal = db.pastos.reduce((a, p) => a + p.areaHa, 0)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => criarPasto({ nome: form.nome, areaHa: num(form.areaHa), capim: form.capim, aguada: form.aguada }))
    setErro(err)
    if (!err) {
      setNovo(false)
      setForm({ nome: '', areaHa: '', capim: CAPINS[0]!, aguada: true })
    }
  }

  const importar = () => {
    const n = importarPastosDaFazenda()
    setMsg(n > 0 ? `${n} pastos importados do mapa da fazenda.` : 'Todos os pastos do mapa ja estao cadastrados.')
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>Pastos</h1>
          <p>{db.pastos.length} pastos - {fmt.dec1(areaTotal)} ha</p>
        </div>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={importar}>Importar mapa da fazenda</button>
          <button type="button" className="btn" onClick={() => setNovo(true)}>+ Novo pasto</button>
        </div>
      </div>

      {msg ? <Aviso tipo="ok">{msg}</Aviso> : null}

      {db.pastos.some((p) => p.coords) ? (
        <section className="card">
          <MapaPastos pastos={db.pastos} lotes={db.lotes} selecionado={selecionado} onSelecionar={setSelecionado} />
        </section>
      ) : null}

      <div className="campo">
        <input placeholder="Buscar pasto..." value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Buscar pasto" />
      </div>

      {filtrados.length === 0 ? (
        <Vazio>Nenhum pasto cadastrado. Importe o mapa da fazenda ou cadastre um novo.</Vazio>
      ) : (
        <div className="lista">
          {filtrados.map((p) => {
            const lotesNoPasto = db.lotes.filter((l) => l.ativo && l.pastoId === p.id)
            const status = statusDoPasto(p, db.lotes)
            const ua = lotacaoUAporHa(p, lotesNoPasto)
            const cab = lotesNoPasto.reduce((a, l) => a + l.cabecas, 0)
            return (
              <div key={p.id} className="item clicavel" onClick={() => setSelecionado(p.id)}>
                <div className="corpo">
                  <strong>{p.nome}</strong>
                  <small>
                    {fmt.dec1(p.areaHa)} ha{p.capim ? ` - ${p.capim}` : ''}{p.aguada ? ' - aguada' : ''}
                  </small>
                </div>
                <div className="direita">
                  <span className={`tag ${status === 'ocupado' ? 'terra' : status === 'disponivel' ? '' : status === 'reforma' ? 'cinza' : 'ambar'}`}>{rotuloStatus[status]}</span>
                  <small>{cab > 0 ? `${cab} cab. - ${fmt.dec2(ua)} UA/ha` : 'vazio'}</small>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal titulo="Novo pasto" aberto={novo} onFechar={() => setNovo(false)}>
        <form onSubmit={salvar}>
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <div className="campos">
            <Campo label="Nome" largo>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required autoFocus />
            </Campo>
            <Campo label="Area (ha)">
              <input inputMode="decimal" value={form.areaHa} onChange={(e) => setForm({ ...form, areaHa: e.target.value })} required />
            </Campo>
            <Campo label="Capim">
              <select value={form.capim} onChange={(e) => setForm({ ...form, capim: e.target.value })}>
                {CAPINS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Campo>
            <div className="campo checkbox">
              <input id="aguada" type="checkbox" checked={form.aguada} onChange={(e) => setForm({ ...form, aguada: e.target.checked })} />
              <label htmlFor="aguada">Tem aguada</label>
            </div>
          </div>
          <div className="botoes">
            <button type="button" className="btn sec" onClick={() => setNovo(false)}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </Modal>

      {pastoSel ? <DetalhePasto pasto={pastoSel} onFechar={() => setSelecionado(null)} /> : null}
    </div>
  )
}

function DetalhePasto({ pasto, onFechar }: { pasto: Pasto; onFechar: () => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const [edit, setEdit] = useState({ nome: pasto.nome, areaHa: String(pasto.areaHa), capim: pasto.capim, aguada: pasto.aguada, statusManual: pasto.statusManual })
  const [mover, setMover] = useState({ loteId: '', responsavel: '' })
  const lotesNoPasto = db.lotes.filter((l) => l.ativo && l.pastoId === pasto.id)
  const lotesFora = db.lotes.filter((l) => l.ativo && l.pastoId !== pasto.id)
  const historico = db.movimentacoes
    .filter((m) => m.paraPastoId === pasto.id || m.dePastoId === pasto.id)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 10)
  const ua = lotacaoUAporHa(pasto, lotesNoPasto)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => {
      if (!edit.nome.trim()) throw new Error('Nome e obrigatorio.')
      if (num(edit.areaHa) <= 0) throw new Error('Area deve ser maior que zero.')
      editarPasto(pasto.id, { nome: edit.nome.trim(), areaHa: num(edit.areaHa), capim: edit.capim, aguada: edit.aguada, statusManual: edit.statusManual })
    })
    setErro(err)
    if (!err) onFechar()
  }

  const trazerLote = () => {
    const err = tentar(() => moverLote(mover.loteId, pasto.id, mover.responsavel))
    setErro(err)
    if (!err) setMover({ loteId: '', responsavel: '' })
  }

  const excluir = () => {
    if (!window.confirm(`Excluir o pasto "${pasto.nome}"?`)) return
    const err = tentar(() => excluirPasto(pasto.id))
    setErro(err)
    if (!err) onFechar()
  }

  return (
    <Modal titulo={pasto.nome} aberto onFechar={onFechar}>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      <div className="detalhes">
        <div><small>Area</small><b>{fmt.dec1(pasto.areaHa)} ha</b></div>
        <div><small>Cabecas</small><b>{lotesNoPasto.reduce((a, l) => a + l.cabecas, 0)}</b></div>
        <div><small>Lotacao</small><b>{fmt.dec2(ua)} UA/ha</b></div>
        <div><small>Origem da area</small><b>{pasto.coords ? 'mapa' : 'manual'}</b></div>
      </div>

      <section className="card">
        <h3>Lotes neste pasto</h3>
        {lotesNoPasto.length === 0 ? <p className="muted">Nenhum lote.</p> : (
          <div className="lista">
            {lotesNoPasto.map((l) => (
              <div key={l.id} className="item">
                <div className="corpo"><strong>{l.nome}</strong><small>{l.categoria}</small></div>
                <div className="direita"><b>{l.cabecas} cab.</b><small>{fmt.inteiro(l.pesoMedioKg)} kg</small></div>
              </div>
            ))}
          </div>
        )}
        {lotesFora.length > 0 && pasto.statusManual !== 'reforma' ? (
          <div className="campos">
            <Campo label="Trazer lote para ca">
              <select value={mover.loteId} onChange={(e) => setMover({ ...mover, loteId: e.target.value })}>
                <option value="">Selecione...</option>
                {lotesFora.map((l) => <option key={l.id} value={l.id}>{l.nome} ({l.cabecas} cab.)</option>)}
              </select>
            </Campo>
            <Campo label="Responsavel">
              <input list="funcionarios" value={mover.responsavel} onChange={(e) => setMover({ ...mover, responsavel: e.target.value })} />
            </Campo>
            <div className="campo"><label>&nbsp;</label><button type="button" className="btn" disabled={!mover.loteId} onClick={trazerLote}>Mover</button></div>
          </div>
        ) : null}
      </section>

      <form onSubmit={salvar} className="card">
        <h3>Editar pasto</h3>
        <div className="campos">
          <Campo label="Nome" largo><input value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Campo>
          <Campo label="Area (ha)"><input inputMode="decimal" value={edit.areaHa} onChange={(e) => setEdit({ ...edit, areaHa: e.target.value })} /></Campo>
          <Campo label="Capim">
            <select value={edit.capim} onChange={(e) => setEdit({ ...edit, capim: e.target.value })}>
              <option value="">-</option>
              {CAPINS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Situacao">
            <select value={edit.statusManual} onChange={(e) => setEdit({ ...edit, statusManual: e.target.value as Pasto['statusManual'] })}>
              <option value="disponivel">Em uso / disponivel</option>
              <option value="descanso">Em descanso</option>
              <option value="reforma">Em reforma (bloqueia entrada)</option>
            </select>
          </Campo>
          <div className="campo checkbox">
            <input id="ed-aguada" type="checkbox" checked={edit.aguada} onChange={(e) => setEdit({ ...edit, aguada: e.target.checked })} />
            <label htmlFor="ed-aguada">Tem aguada</label>
          </div>
        </div>
        <div className="botoes">
          <button type="button" className="btn perigo" onClick={excluir}>Excluir</button>
          <button type="submit" className="btn">Salvar</button>
        </div>
      </form>

      {historico.length > 0 ? (
        <section className="card">
          <h3>Historico de movimentacoes</h3>
          <div className="linha-tempo">
            {historico.map((m) => {
              const lote = db.lotes.find((l) => l.id === m.loteId)
              const entrada = m.paraPastoId === pasto.id
              const outro = db.pastos.find((p) => p.id === (entrada ? m.dePastoId : m.paraPastoId))
              return (
                <div key={m.id} className="evento">
                  {entrada ? 'Entrou' : 'Saiu'} lote <b>{lote?.nome ?? '?'}</b> {entrada ? `de ${outro?.nome ?? 'sem pasto'}` : `para ${outro?.nome ?? '?'}`}
                  <small>{fmt.data(m.data)} - {m.responsavel}</small>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </Modal>
  )
}
