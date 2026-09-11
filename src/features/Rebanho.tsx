import { useMemo, useState, type FormEvent } from 'react'
import { criarLote, editarLote, inativarLote, moverLote, registrarPesagem } from '../data/acoes'
import { useDb } from '../data/db'
import { arrobasDoLote, calcularGmd, diasAteAbate, hojeIso } from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { CATEGORIAS_LOTE, TIPOS_MANEJO, type CategoriaLote, type Lote, type SexoLote } from '../domain/types'
import { Aviso, Campo, Modal, Vazio, num, tentar } from '../ui/base'

const PESO_ABATE_KG = 520

export function Rebanho() {
  const db = useDb()
  const [aba, setAba] = useState<'ativos' | 'inativos'>('ativos')
  const [novo, setNovo] = useState(false)
  const [sel, setSel] = useState<string | null>(null)

  const lotes = useMemo(
    () => db.lotes.filter((l) => (aba === 'ativos' ? l.ativo : !l.ativo)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [db.lotes, aba],
  )
  const ativos = db.lotes.filter((l) => l.ativo)
  const cabecas = ativos.reduce((a, l) => a + l.cabecas, 0)
  const arrobas = ativos.reduce((a, l) => a + arrobasDoLote(l, db.fazenda.rendimentoCarcaca), 0)
  const loteSel = db.lotes.find((l) => l.id === sel) ?? null

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>Rebanho</h1>
          <p>{fmt.inteiro(cabecas)} cabecas - {fmt.dec1(arrobas)} @ em pe</p>
        </div>
        <button type="button" className="btn" onClick={() => setNovo(true)}>+ Novo lote</button>
      </div>

      <div className="abas">
        <button type="button" className={aba === 'ativos' ? 'ativo' : ''} onClick={() => setAba('ativos')}>Ativos ({ativos.length})</button>
        <button type="button" className={aba === 'inativos' ? 'ativo' : ''} onClick={() => setAba('inativos')}>Encerrados ({db.lotes.length - ativos.length})</button>
      </div>

      {lotes.length === 0 ? (
        <Vazio>{aba === 'ativos' ? 'Nenhum lote ativo. Cadastre um lote ou registre uma compra de gado.' : 'Nenhum lote encerrado.'}</Vazio>
      ) : (
        <div className="lista">
          {lotes.map((l) => {
            const pasto = db.pastos.find((p) => p.id === l.pastoId)
            const gmd = calcularGmd(db.pesagens.filter((p) => p.loteId === l.id))
            return (
              <div key={l.id} className={`item clicavel${l.ativo ? '' : ' inativo'}`} onClick={() => setSel(l.id)}>
                <div className="corpo">
                  <strong>{l.nome}</strong>
                  <small>
                    <span className="tag cinza">{CATEGORIAS_LOTE.find((c) => c.value === l.categoria)?.label.split(' -')[0]}</span>{' '}
                    {pasto ? pasto.nome : l.ativo ? 'sem pasto' : 'encerrado'}
                  </small>
                </div>
                <div className="direita">
                  <b>{fmt.inteiro(l.cabecas)} cab.</b>
                  <small>
                    {fmt.inteiro(l.pesoMedioKg)} kg{gmd.gmdKgDia !== null ? ` - GMD ${fmt.dec2(gmd.gmdKgDia)}` : ''}
                  </small>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NovoLoteModal aberto={novo} onFechar={() => setNovo(false)} />
      {loteSel ? <DetalheLote lote={loteSel} onFechar={() => setSel(null)} /> : null}
    </div>
  )
}

function NovoLoteModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState({ nome: '', categoria: 'engorda' as CategoriaLote, sexo: 'M' as SexoLote, cabecas: '', pesoMedioKg: '', pastoId: '' })
  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() =>
      criarLote({ nome: f.nome, categoria: f.categoria, sexo: f.sexo, cabecas: num(f.cabecas), pesoMedioKg: num(f.pesoMedioKg), pastoId: f.pastoId || null }),
    )
    setErro(err)
    if (!err) {
      setF({ nome: '', categoria: 'engorda', sexo: 'M', cabecas: '', pesoMedioKg: '', pastoId: '' })
      onFechar()
    }
  }
  return (
    <Modal titulo="Novo lote" aberto={aberto} onFechar={onFechar}>
      <form onSubmit={salvar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <div className="campos">
          <Campo label="Nome do lote" largo><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required autoFocus placeholder="Ex.: Bois engorda 2026" /></Campo>
          <Campo label="Categoria">
            <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaLote })}>
              {CATEGORIAS_LOTE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Campo>
          <Campo label="Sexo">
            <select value={f.sexo} onChange={(e) => setF({ ...f, sexo: e.target.value as SexoLote })}>
              <option value="M">Machos</option><option value="F">Femeas</option><option value="misto">Misto</option>
            </select>
          </Campo>
          <Campo label="Cabecas"><input inputMode="numeric" value={f.cabecas} onChange={(e) => setF({ ...f, cabecas: e.target.value })} required /></Campo>
          <Campo label="Peso medio (kg)"><input inputMode="decimal" value={f.pesoMedioKg} onChange={(e) => setF({ ...f, pesoMedioKg: e.target.value })} required /></Campo>
          <Campo label="Pasto" largo>
            <select value={f.pastoId} onChange={(e) => setF({ ...f, pastoId: e.target.value })}>
              <option value="">Sem pasto por enquanto</option>
              {db.pastos.filter((p) => p.statusManual !== 'reforma').map((p) => <option key={p.id} value={p.id}>{p.nome} ({fmt.dec1(p.areaHa)} ha)</option>)}
            </select>
          </Campo>
        </div>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn">Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

function DetalheLote({ lote, onFechar }: { lote: Lote; onFechar: () => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [painel, setPainel] = useState<'resumo' | 'pesar' | 'mover' | 'editar'>('resumo')
  const [pes, setPes] = useState({ data: hojeIso(), pesoMedioKg: '', cabecas: String(lote.cabecas), responsavel: '', obs: '' })
  const [mov, setMov] = useState({ pastoId: '', responsavel: '', obs: '' })
  const [ed, setEd] = useState({ nome: lote.nome, categoria: lote.categoria, sexo: lote.sexo, cabecas: String(lote.cabecas), pesoMedioKg: String(lote.pesoMedioKg) })

  const pasto = db.pastos.find((p) => p.id === lote.pastoId)
  const pesagens = db.pesagens.filter((p) => p.loteId === lote.id)
  const gmd = calcularGmd(pesagens)
  const dias = diasAteAbate(lote.pesoMedioKg, PESO_ABATE_KG, gmd.gmdKgDia)
  const arrobasCab = arrobasDoLote({ cabecas: 1, pesoMedioKg: lote.pesoMedioKg }, db.fazenda.rendimentoCarcaca)
  const valor = arrobasCab * lote.cabecas * db.fazenda.cotacaoArroba

  const eventos = useMemo(() => {
    const ev: Array<{ data: string; texto: string; sub: string }> = []
    for (const m of db.movimentacoes.filter((x) => x.loteId === lote.id)) {
      const de = db.pastos.find((p) => p.id === m.dePastoId)?.nome ?? 'sem pasto'
      const para = db.pastos.find((p) => p.id === m.paraPastoId)?.nome ?? '?'
      ev.push({ data: m.data, texto: `Movido de ${de} para ${para}`, sub: m.responsavel })
    }
    for (const p of pesagens) ev.push({ data: p.data, texto: `Pesagem: ${fmt.inteiro(p.pesoMedioKg)} kg medio (${p.cabecas} cab.)`, sub: p.responsavel })
    for (const m of db.manejos.filter((x) => x.loteId === lote.id))
      ev.push({ data: m.data, texto: `${TIPOS_MANEJO.find((t) => t.value === m.tipo)?.label}: ${m.produto}${m.custo ? ` - ${fmt.moeda(m.custo)}` : ''}`, sub: m.responsavel })
    for (const c of db.compras.filter((x) => x.loteId === lote.id)) ev.push({ data: c.data, texto: `Compra de ${c.cabecas} cab. - ${fmt.moeda(c.valorTotal)}`, sub: c.fornecedor })
    for (const v of db.vendas.filter((x) => x.loteId === lote.id)) ev.push({ data: v.data, texto: `Venda de ${v.cabecas} cab. - ${fmt.moeda(v.valorTotal)}`, sub: v.comprador })
    return ev.sort((a, b) => b.data.localeCompare(a.data))
  }, [db, lote.id, pesagens])

  const acao = (fn: () => void, msg: string) => {
    const err = tentar(fn)
    setErro(err)
    if (!err) {
      setOk(msg)
      setPainel('resumo')
    }
  }

  return (
    <Modal titulo={lote.nome} aberto onFechar={onFechar}>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {ok ? <Aviso tipo="ok">{ok}</Aviso> : null}
      <div className="detalhes">
        <div><small>Cabecas</small><b>{fmt.inteiro(lote.cabecas)}</b></div>
        <div><small>Peso medio</small><b>{fmt.inteiro(lote.pesoMedioKg)} kg</b></div>
        <div><small>@ por cabeca</small><b>{fmt.dec1(arrobasCab)} @</b></div>
        <div><small>Valor do lote</small><b>{fmt.moeda(valor)}</b></div>
        <div><small>Pasto</small><b>{pasto?.nome ?? '-'}</b></div>
        <div><small>GMD</small><b>{gmd.gmdKgDia === null ? '-' : `${fmt.dec2(gmd.gmdKgDia)} kg/dia`}</b></div>
        <div><small>Ultima pesagem</small><b>{gmd.ultimaPesagem ? fmt.data(gmd.ultimaPesagem) : '-'}</b></div>
        <div><small>Ate {PESO_ABATE_KG} kg</small><b>{dias === null ? '-' : dias === 0 ? 'pronto' : `${dias} dias`}</b></div>
      </div>

      {lote.ativo ? (
        <div className="abas">
          <button type="button" className={painel === 'resumo' ? 'ativo' : ''} onClick={() => setPainel('resumo')}>Historico</button>
          <button type="button" className={painel === 'pesar' ? 'ativo' : ''} onClick={() => setPainel('pesar')}>Pesar</button>
          <button type="button" className={painel === 'mover' ? 'ativo' : ''} onClick={() => setPainel('mover')}>Trocar pasto</button>
          <button type="button" className={painel === 'editar' ? 'ativo' : ''} onClick={() => setPainel('editar')}>Editar</button>
        </div>
      ) : null}

      {painel === 'pesar' ? (
        <form className="card" onSubmit={(e) => { e.preventDefault(); acao(() => registrarPesagem({ loteId: lote.id, data: pes.data, pesoMedioKg: num(pes.pesoMedioKg), cabecas: num(pes.cabecas), responsavel: pes.responsavel, obs: pes.obs }), 'Pesagem registrada.') }}>
          <h3>Registrar pesagem</h3>
          <div className="campos">
            <Campo label="Data"><input type="date" value={pes.data} onChange={(e) => setPes({ ...pes, data: e.target.value })} required /></Campo>
            <Campo label="Peso medio (kg)"><input inputMode="decimal" value={pes.pesoMedioKg} onChange={(e) => setPes({ ...pes, pesoMedioKg: e.target.value })} required autoFocus /></Campo>
            <Campo label="Cabecas pesadas"><input inputMode="numeric" value={pes.cabecas} onChange={(e) => setPes({ ...pes, cabecas: e.target.value })} /></Campo>
            <Campo label="Responsavel"><input list="funcionarios" value={pes.responsavel} onChange={(e) => setPes({ ...pes, responsavel: e.target.value })} /></Campo>
            <Campo label="Observacao" largo><input value={pes.obs} onChange={(e) => setPes({ ...pes, obs: e.target.value })} /></Campo>
          </div>
          <div className="botoes"><button type="submit" className="btn">Salvar pesagem</button></div>
        </form>
      ) : null}

      {painel === 'mover' ? (
        <form className="card" onSubmit={(e) => { e.preventDefault(); acao(() => moverLote(lote.id, mov.pastoId, mov.responsavel, mov.obs), 'Lote movido.') }}>
          <h3>Trocar de pasto</h3>
          <div className="campos">
            <Campo label="Pasto destino" largo>
              <select value={mov.pastoId} onChange={(e) => setMov({ ...mov, pastoId: e.target.value })} required>
                <option value="">Selecione...</option>
                {db.pastos.filter((p) => p.id !== lote.pastoId && p.statusManual !== 'reforma').sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => {
                  const ocupado = db.lotes.some((l) => l.ativo && l.pastoId === p.id)
                  return <option key={p.id} value={p.id}>{p.nome} ({fmt.dec1(p.areaHa)} ha){ocupado ? ' - ocupado' : ''}</option>
                })}
              </select>
            </Campo>
            <Campo label="Responsavel"><input list="funcionarios" value={mov.responsavel} onChange={(e) => setMov({ ...mov, responsavel: e.target.value })} required /></Campo>
            <Campo label="Observacao"><input value={mov.obs} onChange={(e) => setMov({ ...mov, obs: e.target.value })} /></Campo>
          </div>
          <div className="botoes"><button type="submit" className="btn">Mover lote</button></div>
        </form>
      ) : null}

      {painel === 'editar' ? (
        <form className="card" onSubmit={(e) => { e.preventDefault(); acao(() => { if (!ed.nome.trim()) throw new Error('Nome e obrigatorio.'); editarLote(lote.id, { nome: ed.nome.trim(), categoria: ed.categoria, sexo: ed.sexo, cabecas: Math.round(num(ed.cabecas)), pesoMedioKg: num(ed.pesoMedioKg) }) }, 'Lote atualizado.') }}>
          <h3>Editar lote</h3>
          <div className="campos">
            <Campo label="Nome" largo><input value={ed.nome} onChange={(e) => setEd({ ...ed, nome: e.target.value })} /></Campo>
            <Campo label="Categoria">
              <select value={ed.categoria} onChange={(e) => setEd({ ...ed, categoria: e.target.value as CategoriaLote })}>
                {CATEGORIAS_LOTE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Campo>
            <Campo label="Sexo">
              <select value={ed.sexo} onChange={(e) => setEd({ ...ed, sexo: e.target.value as SexoLote })}>
                <option value="M">Machos</option><option value="F">Femeas</option><option value="misto">Misto</option>
              </select>
            </Campo>
            <Campo label="Cabecas" dica="Ajuste manual (morte, correcao). Compra e venda usam o Financeiro."><input inputMode="numeric" value={ed.cabecas} onChange={(e) => setEd({ ...ed, cabecas: e.target.value })} /></Campo>
            <Campo label="Peso medio (kg)"><input inputMode="decimal" value={ed.pesoMedioKg} onChange={(e) => setEd({ ...ed, pesoMedioKg: e.target.value })} /></Campo>
          </div>
          <div className="botoes">
            <button type="button" className="btn perigo" onClick={() => { if (window.confirm(`Encerrar o lote "${lote.nome}"?`)) { inativarLote(lote.id); onFechar() } }}>Encerrar lote</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      ) : null}

      {painel === 'resumo' ? (
        <section className="card">
          <h3>Historico</h3>
          {eventos.length === 0 ? <p className="muted">Sem eventos ainda.</p> : (
            <div className="linha-tempo">
              {eventos.map((ev, i) => (
                <div key={i} className="evento">{ev.texto}<small>{fmt.data(ev.data)}{ev.sub ? ` - ${ev.sub}` : ''}</small></div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </Modal>
  )
}
