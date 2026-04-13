import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useFuncionarios } from '../../core/hooks/useFuncionarios'

const pagamentoOptions = [
  { value: 'salario_mensal', label: 'Salario mensal' },
  { value: 'diaria', label: 'Diaria' },
  { value: 'empreiteiro', label: 'Empreiteiro' },
] as const

export function FuncionariosPage() {
  const {
    funcionarios,
    isOnline,
    pendentes,
    addFuncionario,
    inativarFuncionario,
    reativarFuncionario,
  } = useFuncionarios()
  const [nome, setNome] = useState('')
  const [funcao, setFuncao] = useState('Peao')
  const [pagamento, setPagamento] = useState<(typeof pagamentoOptions)[number]['value']>('salario_mensal')
  const [valor, setValor] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [busca, setBusca] = useState('')
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [erro, setErro] = useState('')

  const ativos = useMemo(() => funcionarios.filter((item) => item.ativo), [funcionarios])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErro('')
    if (!nome.trim()) {
      setErro('Informe o nome do funcionario.')
      return
    }

    if (!funcao.trim()) {
      setErro('Informe a funcao do funcionario.')
      return
    }

    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setErro('CPF obrigatorio com 11 digitos.')
      return
    }

    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
      setErro('Telefone deve ter DDD e 8 ou 9 digitos.')
      return
    }

    const existeCpf = funcionarios.some((f) => f.cpf.replace(/\D/g, '') === cpfLimpo)
    if (existeCpf) {
      setErro('Ja existe funcionario com este CPF.')
      return
    }

    try {
      await addFuncionario({
        nome: nome.trim(),
        funcao: funcao.trim(),
        pagamento,
        valor: Number(valor.replace(',', '.')) || 0,
        telefone: telefone.trim(),
        cpf: cpfLimpo,
      })
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message)
        return
      }
      setErro('Falha ao cadastrar funcionario.')
      return
    }

    setNome('')
    setValor('')
    setTelefone('')
    setCpf('')
    setErro('')
  }

  const funcionariosFiltrados = funcionarios.filter((item) => {
    if (!mostrarInativos && !item.ativo) return false
    const termo = busca.trim().toLowerCase()
    if (!termo) return true
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.funcao.toLowerCase().includes(termo) ||
      item.cpf.includes(termo)
    )
  })

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Operacoes</p>
        <h1>Funcionarios</h1>
        <p className="subtitle">
          Cadastro e acompanhamento de equipe com sincronizacao online e fallback offline.
        </p>
      </header>

      <section className="status-grid">
        <article className="status-card">
          <h2>Conexao</h2>
          <p className={isOnline ? 'badge online' : 'badge offline'}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </p>
        </article>
        <article className="status-card">
          <h2>Ativos</h2>
          <p className="kpi">{ativos.length}</p>
        </article>
        <article className="status-card">
          <h2>Pendentes sync</h2>
          <p className="kpi">{pendentes}</p>
        </article>
      </section>

      <section className="card">
        <h2>Novo funcionario</h2>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>
            Nome completo
            <input value={nome} onChange={(event) => setNome(event.target.value)} />
          </label>
          <label>
            Funcao
            <input value={funcao} onChange={(event) => setFuncao(event.target.value)} />
          </label>
          <label>
            Pagamento
            <select value={pagamento} onChange={(event) => setPagamento(event.target.value as (typeof pagamentoOptions)[number]['value'])}>
              {pagamentoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor
            <input value={valor} onChange={(event) => setValor(event.target.value)} placeholder="0,00" />
          </label>
          <label>
            Telefone
            <input
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(99) 99999-9999"
            />
          </label>
          <label>
            CPF
            <input value={cpf} onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" />
          </label>
          <button className="submit-btn" type="submit">
            Cadastrar funcionario
          </button>
        </form>
        {erro ? <p className="error-text" style={{ marginTop: '0.6rem' }}>{erro}</p> : null}
      </section>

      <section className="card">
        <h2>Funcionarios cadastrados</h2>
        <div className="form" style={{ marginBottom: '0.8rem' }}>
          <label>
            Buscar funcionario
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome, funcao ou CPF"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(event) => setMostrarInativos(event.target.checked)}
            />
            Mostrar inativos
          </label>
        </div>
        {funcionariosFiltrados.length === 0 ? (
          <p className="empty">Nenhum funcionario cadastrado.</p>
        ) : (
          <ul className="list">
            {funcionariosFiltrados
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.id} className="row">
                  <div>
                    <strong>{item.nome}</strong>
                    <small>
                      {item.funcao} · {item.telefone || 'Sem telefone'} · CPF {item.cpf || 'nao informado'}
                    </small>
                  </div>
                  <div className="row-right">
                    <span>R$ {item.valor.toFixed(2)}</span>
                    <span className={item.ativo ? 'chip synced' : 'chip pending'}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => (item.ativo ? inativarFuncionario(item.id) : reativarFuncionario(item.id))}
                    >
                      {item.ativo ? 'Inativar' : 'Reativar'}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  )
}
