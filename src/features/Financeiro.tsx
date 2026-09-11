import { useMemo, useState, type FormEvent } from 'react'
import { comprarGado, excluirLancamento, lancar, venderGado } from '../data/acoes'
import { useDb } from '../data/db'
import { custoPorCabecaDia, diasNoMes, hojeIso, kgParaArroba, lancamentosDoMes, mesAtual, resumoFinanceiro } from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { CATEGORIAS_LANCAMENTO, CATEGORIAS_LOTE, type CategoriaLancamento, type CategoriaLote, type SexoLote, type TipoLancamento } from '../domain/types'
import { Aviso, Campo, Kpi, Modal, Vazio, num, tentar } from '../ui/base'

type ModalTipo = null | 'compra' | 'venda' | 'lancamento'

export function Financeiro() {
  const db = useDb()
  const [mes, setMes] = useState(mesAtual())
  const [modal, setModal] = useState<ModalTipo>(null)
  const [ok, setOk] = useState<string | null>(null)

  const meses = useMemo(() => {
    const s = new Set(db.lancamentos.map((l) => l.data.slice(0, 7)))
    s.add(mesAtual())
    return [...s].sort().reverse()
  }, [db.lancamentos])

  const doMes = useMemo(() => lancamentosDoMes(db.lancamentos, mes).sort((a, b) => b.data.localeCompare(a.data)), [db.lancamentos, mes])
  const resumo = resumoFinanceiro(doMes)
  const acumulado = resumoFinanceiro(db.lancamentos)
  const cabecas = db.lotes.filter((l) => l.ativo).reduce((a, l) => a + l.cabecas, 0)
  const custoCab = custoPorCabecaDia(doMes, cabecas, diasNoMes(mes))

  const porCategoria = useMemo(() => {
    const m = new Map<CategoriaLancamento, number>()
    for (const l of doMes.filter((x) => x.tipo === 'despesa')) m.set(l.categoria, (m.get(l.categoria) ?? 0) + l.valor)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [doMes])

  const fechou = (msg: string) => {
    setModal(null)
    setOk(msg)
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>Financeiro</h1>
          <p>Saldo acumulado: {fmt.moeda(acumulado.saldo)}</p>
        </div>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={() => setModal('compra')}>Compra de gado</button>
          <button type="button" className="btn sec" onClick={() => setModal('venda')} disabled={cabecas === 0}>Venda de gado</button>
          <button type="button" className="btn" onClick={() => setModal('lancamento')}>+ Lancamento</button>
        </div>
      </div>

      {ok ? <Aviso tipo="ok">{ok}</Aviso> : null}

      <div className="abas">
        {meses.map((m) => (
          <button key={m} type="button" className={m === mes ? 'ativo' : ''} onClick={() => setMes(m)}>{fmt.mes(m)}</button>
        ))}
      </div>

      <div className="grid-kpi">
        <Kpi rotulo="Receitas" valor={fmt.moeda(resumo.receitas)} />
        <Kpi rotulo="Despesas" valor={fmt.moeda(resumo.despesas)} />
        <Kpi rotulo="Saldo do mes" valor={fmt.moeda(resumo.saldo)} destaque />
        <Kpi rotulo="Custo/cab/dia" valor={custoCab === null ? '-' : fmt.moeda(custoCab)} sub={`${cabecas} cab. x ${diasNoMes(mes)} dias`} />
      </div>

      {porCategoria.length > 0 ? (
        <section className="card">
          <h3>Despesas por centro de custo</h3>
          <div className="tabela-wrap">
            <table>
              <tbody>
                {porCategoria.map(([cat, v]) => (
                  <tr key={cat}>
                    <td>{CATEGORIAS_LANCAMENTO.find((c) => c.value === cat)?.label}</td>
                    <td className="num">{fmt.moeda(v)}</td>
                    <td className="num muted">{resumo.despesas > 0 ? `${Math.round((v / resumo.despesas) * 100)}%` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h3>Lancamentos de {fmt.mes(mes)}</h3>
        {doMes.length === 0 ? <Vazio>Nenhum lancamento neste mes.</Vazio> : (
          <div className="tabela-wrap">
            <table>
              <thead><tr><th>Data</th><th>Descricao</th><th>Categoria</th><th className="num">Valor</th><th></th></tr></thead>
              <tbody>
                {doMes.map((l) => (
                  <tr key={l.id}>
                    <td>{fmt.data(l.data)}</td>
                    <td style={{ whiteSpace: 'normal' }}>{l.descricao}</td>
                    <td><span className="tag cinza">{CATEGORIAS_LANCAMENTO.find((c) => c.value === l.categoria)?.label}</span></td>
                    <td className={`num ${l.tipo}`}>{l.tipo === 'despesa' ? '-' : '+'}{fmt.moeda(l.valor)}</td>
                    <td>
                      {!l.origem ? (
                        <button type="button" className="btn perigo mini" onClick={() => { if (window.confirm('Excluir lancamento?')) tentar(() => excluirLancamento(l.id)) }}>x</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal === 'compra' ? <CompraModal onFechar={() => setModal(null)} onOk={fechou} /> : null}
      {modal === 'venda' ? <VendaModal onFechar={() => setModal(null)} onOk={fechou} /> : null}
      {modal === 'lancamento' ? <LancamentoModal onFechar={() => setModal(null)} onOk={fechou} /> : null}
    </div>
  )
}

function CompraModal({ onFechar, onOk }: { onFechar: () => void; onOk: (m: string) => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState({
    data: hojeIso(), fornecedor: '', cabecas: '', pesoMedioKg: '', precoArroba: String(db.fazenda.cotacaoArroba),
    destino: 'novo', nome: '', categoria: 'recria' as CategoriaLote, sexo: 'M' as SexoLote, pastoId: '',
  })
  const ativos = db.lotes.filter((l) => l.ativo)
  const arrobas = kgParaArroba(num(f.pesoMedioKg), db.fazenda.rendimentoCarcaca) * num(f.cabecas)
  const total = arrobas * num(f.precoArroba)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() =>
      comprarGado({
        data: f.data, fornecedor: f.fornecedor, cabecas: num(f.cabecas), pesoMedioKg: num(f.pesoMedioKg), precoArroba: num(f.precoArroba),
        loteId: f.destino === 'novo' ? null : f.destino,
        novoLote: f.destino === 'novo' ? { nome: f.nome, categoria: f.categoria, sexo: f.sexo, pastoId: f.pastoId || null } : undefined,
      }),
    )
    setErro(err)
    if (!err) onOk(`Compra registrada: ${fmt.moeda(total)}.`)
  }

  return (
    <Modal titulo="Compra de gado" aberto onFechar={onFechar}>
      <form onSubmit={salvar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <div className="campos">
          <Campo label="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required /></Campo>
          <Campo label="Fornecedor"><input value={f.fornecedor} onChange={(e) => setF({ ...f, fornecedor: e.target.value })} /></Campo>
          <Campo label="Cabecas"><input inputMode="numeric" value={f.cabecas} onChange={(e) => setF({ ...f, cabecas: e.target.value })} required autoFocus /></Campo>
          <Campo label="Peso medio (kg)"><input inputMode="decimal" value={f.pesoMedioKg} onChange={(e) => setF({ ...f, pesoMedioKg: e.target.value })} required /></Campo>
          <Campo label="Preco da @ (R$)"><input inputMode="decimal" value={f.precoArroba} onChange={(e) => setF({ ...f, precoArroba: e.target.value })} required /></Campo>
          <Campo label="Destino" largo>
            <select value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })}>
              <option value="novo">Criar novo lote</option>
              {ativos.map((l) => <option key={l.id} value={l.id}>Somar ao lote {l.nome} ({l.cabecas} cab.)</option>)}
            </select>
          </Campo>
          {f.destino === 'novo' ? (
            <>
              <Campo label="Nome do novo lote" largo><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></Campo>
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
              <Campo label="Pasto" largo>
                <select value={f.pastoId} onChange={(e) => setF({ ...f, pastoId: e.target.value })}>
                  <option value="">Sem pasto por enquanto</option>
                  {db.pastos.filter((p) => p.statusManual !== 'reforma').map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Campo>
            </>
          ) : null}
        </div>
        <Aviso>{fmt.dec1(arrobas)} @ x {fmt.moeda(num(f.precoArroba))} = <b>{fmt.moeda(total)}</b> (rendimento {Math.round(db.fazenda.rendimentoCarcaca * 100)}%)</Aviso>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn">Registrar compra</button>
        </div>
      </form>
    </Modal>
  )
}

function VendaModal({ onFechar, onOk }: { onFechar: () => void; onOk: (m: string) => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const ativos = db.lotes.filter((l) => l.ativo)
  const [f, setF] = useState({ data: hojeIso(), comprador: '', loteId: ativos[0]?.id ?? '', cabecas: '', pesoMedioKg: ativos[0] ? String(ativos[0].pesoMedioKg) : '', precoArroba: String(db.fazenda.cotacaoArroba) })
  const lote = ativos.find((l) => l.id === f.loteId)
  const arrobas = kgParaArroba(num(f.pesoMedioKg), db.fazenda.rendimentoCarcaca) * num(f.cabecas)
  const total = arrobas * num(f.precoArroba)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => venderGado({ data: f.data, comprador: f.comprador, loteId: f.loteId, cabecas: num(f.cabecas), pesoMedioKg: num(f.pesoMedioKg), precoArroba: num(f.precoArroba) }))
    setErro(err)
    if (!err) onOk(`Venda registrada: ${fmt.moeda(total)}.`)
  }

  return (
    <Modal titulo="Venda de gado" aberto onFechar={onFechar}>
      <form onSubmit={salvar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <div className="campos">
          <Campo label="Lote" largo>
            <select value={f.loteId} onChange={(e) => { const l = ativos.find((x) => x.id === e.target.value); setF({ ...f, loteId: e.target.value, pesoMedioKg: l ? String(l.pesoMedioKg) : f.pesoMedioKg }) }} required>
              {ativos.map((l) => <option key={l.id} value={l.id}>{l.nome} ({l.cabecas} cab. - {fmt.inteiro(l.pesoMedioKg)} kg)</option>)}
            </select>
          </Campo>
          <Campo label="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required /></Campo>
          <Campo label="Comprador"><input value={f.comprador} onChange={(e) => setF({ ...f, comprador: e.target.value })} placeholder="Frigorifico, leiloeira..." /></Campo>
          <Campo label="Cabecas" dica={lote ? `maximo ${lote.cabecas}` : undefined}><input inputMode="numeric" value={f.cabecas} onChange={(e) => setF({ ...f, cabecas: e.target.value })} required autoFocus /></Campo>
          <Campo label="Peso medio (kg)"><input inputMode="decimal" value={f.pesoMedioKg} onChange={(e) => setF({ ...f, pesoMedioKg: e.target.value })} required /></Campo>
          <Campo label="Preco da @ (R$)"><input inputMode="decimal" value={f.precoArroba} onChange={(e) => setF({ ...f, precoArroba: e.target.value })} required /></Campo>
        </div>
        <Aviso tipo="ok">{fmt.dec1(arrobas)} @ x {fmt.moeda(num(f.precoArroba))} = <b>{fmt.moeda(total)}</b></Aviso>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn">Registrar venda</button>
        </div>
      </form>
    </Modal>
  )
}

function LancamentoModal({ onFechar, onOk }: { onFechar: () => void; onOk: (m: string) => void }) {
  const db = useDb()
  const [erro, setErro] = useState<string | null>(null)
  const [f, setF] = useState({ data: hojeIso(), tipo: 'despesa' as TipoLancamento, categoria: 'nutricao' as CategoriaLancamento, descricao: '', valor: '', loteId: '' })
  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => lancar({ data: f.data, tipo: f.tipo, categoria: f.categoria, descricao: f.descricao, valor: num(f.valor), loteId: f.loteId || null }))
    setErro(err)
    if (!err) onOk('Lancamento salvo.')
  }
  return (
    <Modal titulo="Novo lancamento" aberto onFechar={onFechar}>
      <form onSubmit={salvar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <div className="campos">
          <Campo label="Tipo">
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoLancamento })}>
              <option value="despesa">Despesa</option><option value="receita">Receita</option>
            </select>
          </Campo>
          <Campo label="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required /></Campo>
          <Campo label="Descricao" largo><input value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} required autoFocus placeholder="Ex.: 20 sacos de sal mineral" /></Campo>
          <Campo label="Categoria">
            <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaLancamento })}>
              {CATEGORIAS_LANCAMENTO.filter((c) => c.value !== 'compra_gado' && c.value !== 'venda_gado').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Campo>
          <Campo label="Valor (R$)"><input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required /></Campo>
          <Campo label="Lote (opcional)" largo>
            <select value={f.loteId} onChange={(e) => setF({ ...f, loteId: e.target.value })}>
              <option value="">Fazenda em geral</option>
              {db.lotes.filter((l) => l.ativo).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
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
