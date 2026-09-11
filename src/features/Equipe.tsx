import { useState, type FormEvent } from 'react'
import { alternarFuncionario, criarFuncionario, lancarFolha } from '../data/acoes'
import { useDb } from '../data/db'
import { mesAtual } from '../domain/calculos'
import { fmt } from '../domain/formatar'
import { Aviso, Campo, Modal, Vazio, num, tentar } from '../ui/base'

const FUNCOES = ['Vaqueiro', 'Peao', 'Gerente', 'Tratorista', 'Caseiro', 'Diarista', 'Outro']

export function Equipe() {
  const db = useDb()
  const [novo, setNovo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [f, setF] = useState({ nome: '', funcao: FUNCOES[0]!, telefone: '', salario: '' })
  const ativos = db.funcionarios.filter((x) => x.ativo)
  const folha = ativos.reduce((a, x) => a + x.salario, 0)
  const mes = mesAtual()
  const folhaLancada = db.lancamentos.some((l) => l.categoria === 'mao_de_obra' && l.descricao.startsWith(`Folha ${mes}`))

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => criarFuncionario({ nome: f.nome, funcao: f.funcao, telefone: f.telefone, salario: num(f.salario) }))
    setErro(err)
    if (!err) {
      setNovo(false)
      setF({ nome: '', funcao: FUNCOES[0]!, telefone: '', salario: '' })
    }
  }

  const lancarFolhaMes = () => {
    if (!window.confirm(`Lancar folha de ${fmt.mes(mes)} (${fmt.moeda(folha)}) como despesa de mao de obra?`)) return
    const err = tentar(() => lancarFolha(mes))
    setMsg(err ?? `Folha de ${fmt.mes(mes)} lancada no financeiro.`)
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h1>Equipe</h1>
          <p>{ativos.length} ativos - folha mensal {fmt.moeda(folha)}</p>
        </div>
        <div className="botoes">
          <button type="button" className="btn sec" onClick={lancarFolhaMes} disabled={folha === 0 || folhaLancada}>{folhaLancada ? `Folha ${fmt.mes(mes)} lancada` : 'Lancar folha do mes'}</button>
          <button type="button" className="btn" onClick={() => setNovo(true)}>+ Funcionario</button>
        </div>
      </div>
      {msg ? <Aviso tipo="ok">{msg}</Aviso> : null}

      {db.funcionarios.length === 0 ? <Vazio>Nenhum funcionario. Cadastre a equipe para registrar responsaveis nas operacoes.</Vazio> : (
        <div className="lista">
          {[...db.funcionarios].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome)).map((x) => (
            <div key={x.id} className={x.ativo ? 'item' : 'item inativo'}>
              <div className="corpo">
                <strong>{x.nome}</strong>
                <small>{x.funcao}{x.telefone ? ` - ${x.telefone}` : ''}</small>
              </div>
              <div className="direita">
                <b>{x.salario > 0 ? fmt.moeda(x.salario) : '-'}</b>
                <button type="button" className="btn sec mini" onClick={() => alternarFuncionario(x.id)}>{x.ativo ? 'Inativar' : 'Reativar'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal titulo="Novo funcionario" aberto={novo} onFechar={() => setNovo(false)}>
        <form onSubmit={salvar}>
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <div className="campos">
            <Campo label="Nome" largo><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required autoFocus /></Campo>
            <Campo label="Funcao">
              <select value={f.funcao} onChange={(e) => setF({ ...f, funcao: e.target.value })}>{FUNCOES.map((x) => <option key={x}>{x}</option>)}</select>
            </Campo>
            <Campo label="Telefone"><input inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Campo>
            <Campo label="Salario mensal (R$)"><input inputMode="decimal" value={f.salario} onChange={(e) => setF({ ...f, salario: e.target.value })} /></Campo>
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
