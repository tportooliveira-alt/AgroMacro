import { useMemo, useState, type FormEvent } from 'react'
import { registrarManejo } from '../data/acoes'
import { useDb } from '../data/db'
import { hojeIso } from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { TIPOS_MANEJO, type TipoManejo } from '../domain/types'
import { Aviso, Campo, Modal, Vazio, num, tentar } from '../ui/base'

export function Manejo() {
  const db = useDb()
  const [novo, setNovo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState({ loteId: '', tipo: 'vacina' as TipoManejo, produto: '', data: hojeIso(), custo: '', responsavel: '', obs: '' })
  const ativos = db.lotes.filter((l) => l.ativo)
  const manejos = useMemo(() => [...db.manejos].sort((a, b) => b.data.localeCompare(a.data)), [db.manejos])
  const custoTotal = manejos.reduce((a, m) => a + m.custo, 0)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => registrarManejo({ loteId: f.loteId, tipo: f.tipo, produto: f.produto, data: f.data, custo: num(f.custo), responsavel: f.responsavel, obs: f.obs }))
    setErro(err)
    if (!err) {
      setNovo(false)
      setF({ ...f, produto: '', custo: '', obs: '' })
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>Manejo sanitario</h1>
          <p>{manejos.length} registros - {fmt.moeda(custoTotal)} em insumos</p>
        </div>
        <button type="button" className="btn" onClick={() => setNovo(true)} disabled={ativos.length === 0}>+ Registrar manejo</button>
      </div>

      {ativos.length === 0 ? <Aviso>Cadastre um lote ativo no Rebanho antes de registrar manejo.</Aviso> : null}

      {manejos.length === 0 ? (
        <Vazio>Nenhum manejo registrado. Vacinas, vermifugos e suplementacao aparecem aqui e entram no financeiro quando tem custo.</Vazio>
      ) : (
        <div className="lista">
          {manejos.map((m) => {
            const lote = db.lotes.find((l) => l.id === m.loteId)
            return (
              <div key={m.id} className="item">
                <div className="corpo">
                  <strong>{m.produto}</strong>
                  <small>
                    <span className="tag azul">{TIPOS_MANEJO.find((t) => t.value === m.tipo)?.label}</span> {lote?.nome ?? '?'}{m.responsavel ? ` - ${m.responsavel}` : ''}
                  </small>
                </div>
                <div className="direita">
                  <b>{m.custo > 0 ? fmt.moeda(m.custo) : '-'}</b>
                  <small>{fmt.data(m.data)}</small>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal titulo="Registrar manejo" aberto={novo} onFechar={() => setNovo(false)}>
        <form onSubmit={salvar}>
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <div className="campos">
            <Campo label="Lote" largo>
              <select value={f.loteId} onChange={(e) => setF({ ...f, loteId: e.target.value })} required autoFocus>
                <option value="">Selecione...</option>
                {ativos.map((l) => <option key={l.id} value={l.id}>{l.nome} ({l.cabecas} cab.)</option>)}
              </select>
            </Campo>
            <Campo label="Tipo">
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoManejo })}>
                {TIPOS_MANEJO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Campo>
            <Campo label="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required /></Campo>
            <Campo label="Produto / descricao" largo><input value={f.produto} onChange={(e) => setF({ ...f, produto: e.target.value })} required placeholder="Ex.: Vacina aftosa, Ivermectina 1%" /></Campo>
            <Campo label="Custo total (R$)" dica="Se informado, vira despesa no financeiro."><input inputMode="decimal" value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} /></Campo>
            <Campo label="Responsavel"><input list="funcionarios" value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></Campo>
            <Campo label="Observacao" largo><input value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></Campo>
          </div>
          <div className="botoes">
            <button type="button" className="btn sec" onClick={() => setNovo(false)}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
