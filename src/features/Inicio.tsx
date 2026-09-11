import { useDb } from '../data/db'
import {
  arrobasDoLote,
  custoPorCabecaDia,
  diasDesde,
  diasNoMes,
  lancamentosDoMes,
  lotacaoUAporHa,
  mesAtual,
  resumoFinanceiro,
  valorRebanho,
} from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { Icone } from '../ui/Icone'
import { Kpi } from '../ui/base'
import type { Tela } from '../App'

export function Inicio({ irPara }: { irPara: (tela: Tela) => void }) {
  const db = useDb()
  const lotesAtivos = db.lotes.filter((l) => l.ativo)
  const cabecas = lotesAtivos.reduce((a, l) => a + l.cabecas, 0)
  const arrobas = lotesAtivos.reduce((a, l) => a + arrobasDoLote(l, db.fazenda.rendimentoCarcaca), 0)
  const valor = valorRebanho(lotesAtivos, db.fazenda)
  const areaTotal = db.pastos.reduce((a, p) => a + p.areaHa, 0)
  const uaTotal = lotesAtivos.reduce((a, l) => a + (l.pesoMedioKg * l.cabecas) / 450, 0)
  const lotacaoMedia = areaTotal > 0 ? uaTotal / areaTotal : 0

  const mes = mesAtual()
  const doMes = lancamentosDoMes(db.lancamentos, mes)
  const fin = resumoFinanceiro(doMes)
  const custoCab = custoPorCabecaDia(doMes, cabecas, diasNoMes(mes))

  // Alertas operacionais
  const alertas: Array<{ nivel: 'ambar' | 'vermelho'; texto: string }> = []
  for (const l of lotesAtivos) {
    if (!l.pastoId) alertas.push({ nivel: 'ambar', texto: `Lote "${l.nome}" esta sem pasto definido.` })
    const ultima = db.pesagens.filter((p) => p.loteId === l.id).sort((a, b) => b.data.localeCompare(a.data))[0]
    const dias = ultima ? diasDesde(ultima.data) : diasDesde(l.criadoEm)
    if (dias > 60) alertas.push({ nivel: 'ambar', texto: `Lote "${l.nome}" sem pesagem ha ${dias} dias.` })
  }
  for (const p of db.pastos) {
    const noPasto = lotesAtivos.filter((l) => l.pastoId === p.id)
    const ua = lotacaoUAporHa(p, noPasto)
    if (ua > 3) alertas.push({ nivel: 'vermelho', texto: `Pasto "${p.nome}" com lotacao alta: ${fmt.dec1(ua)} UA/ha.` })
    if (p.statusManual === 'reforma' && noPasto.length > 0)
      alertas.push({ nivel: 'vermelho', texto: `Pasto "${p.nome}" em reforma mas tem lote dentro.` })
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>{db.fazenda.nome}</h1>
          <p>{db.fazenda.municipio || 'Visao geral da fazenda'}</p>
        </div>
      </div>

      <div className="grid-kpi">
        <Kpi rotulo="Cabecas" valor={fmt.inteiro(cabecas)} sub={`${lotesAtivos.length} lotes ativos`} destaque />
        <Kpi rotulo="Arrobas em pe" valor={`${fmt.dec1(arrobas)} @`} sub={`rend. ${Math.round(db.fazenda.rendimentoCarcaca * 100)}%`} />
        <Kpi rotulo="Valor do rebanho" valor={fmt.moeda(valor)} sub={`@ a ${fmt.moeda(db.fazenda.cotacaoArroba)}`} />
        <Kpi rotulo="Lotacao media" valor={`${fmt.dec2(lotacaoMedia)} UA/ha`} sub={`${fmt.dec1(areaTotal)} ha em ${db.pastos.length} pastos`} />
        <Kpi rotulo={`Saldo ${fmt.mes(mes)}`} valor={fmt.moeda(fin.saldo)} sub={`${fmt.moeda(fin.receitas)} rec. / ${fmt.moeda(fin.despesas)} desp.`} />
        <Kpi rotulo="Custo/cab/dia" valor={custoCab === null ? '-' : fmt.moeda(custoCab)} sub="despesas do mes sem compra de gado" />
      </div>

      <div className="grid-acoes">
        <button type="button" className="acao-rapida" onClick={() => irPara('rebanho')}>
          <Icone nome="balanca" /> Pesagem <small>Registrar peso do lote</small>
        </button>
        <button type="button" className="acao-rapida" onClick={() => irPara('rebanho')}>
          <Icone nome="mover" /> Trocar pasto <small>Mover lote</small>
        </button>
        <button type="button" className="acao-rapida" onClick={() => irPara('manejo')}>
          <Icone nome="seringa" /> Manejo <small>Vacina, vermifugo...</small>
        </button>
        <button type="button" className="acao-rapida" onClick={() => irPara('financeiro')}>
          <Icone nome="compra" /> Compra / venda <small>Entrada e saida de gado</small>
        </button>
      </div>

      <section className="card">
        <div className="card-titulo">
          <h2>Alertas</h2>
          <span className={alertas.length ? 'tag ambar' : 'tag'}>{alertas.length ? `${alertas.length} pendentes` : 'tudo em ordem'}</span>
        </div>
        {alertas.length === 0 ? (
          <p className="muted">Nenhum alerta. Cadastre pastos e lotes para acompanhar lotacao, pesagens e financeiro.</p>
        ) : (
          <div className="alerta-lista">
            {alertas.slice(0, 8).map((a, i) => (
              <div key={i} className={a.nivel === 'vermelho' ? 'aviso erro' : 'aviso'}>
                {a.texto}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-titulo">
          <h2>Lotes</h2>
          <button type="button" className="btn sec mini" onClick={() => irPara('rebanho')}>
            Ver todos
          </button>
        </div>
        {lotesAtivos.length === 0 ? (
          <p className="muted">Nenhum lote ativo.</p>
        ) : (
          <div className="lista">
            {lotesAtivos.slice(0, 6).map((l) => {
              const pasto = db.pastos.find((p) => p.id === l.pastoId)
              return (
                <div key={l.id} className="item clicavel" onClick={() => irPara('rebanho')}>
                  <div className="corpo">
                    <strong>{l.nome}</strong>
                    <small>{pasto ? pasto.nome : 'sem pasto'}</small>
                  </div>
                  <div className="direita">
                    <b>{fmt.inteiro(l.cabecas)} cab.</b>
                    <small>{fmt.inteiro(l.pesoMedioKg)} kg / {fmt.dec1(arrobasDoLote({ cabecas: 1, pesoMedioKg: l.pesoMedioKg }, db.fazenda.rendimentoCarcaca))} @</small>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
