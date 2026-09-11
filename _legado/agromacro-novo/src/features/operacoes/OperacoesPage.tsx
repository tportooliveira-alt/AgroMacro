import type { FormEvent } from 'react'
import { useState } from 'react'
import { useOnlineFirst } from '../../core/hooks/useOnlineFirst'

interface OperacoesPageProps {
  onOpenFuncionarios?: () => void
}

export function OperacoesPage({ onOpenFuncionarios }: OperacoesPageProps) {
  const { operacoes, isOnline, syncing, pendentes, addOperacao, manualSync } = useOnlineFirst()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!nome.trim() || !valor.trim()) {
      return
    }

    await addOperacao({
      nome: nome.trim(),
      valor: Number(valor.replace(',', '.')) || 0,
    })

    setNome('')
    setValor('')
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">AgroMacro Nova Base</p>
        <h1>Online por padrao, offline so no essencial</h1>
        <p className="subtitle">
          Dados principais sobem para nuvem sempre que houver conexao. Quando cair a internet,
          apenas as operacoes basicas entram em fila local e sincronizam automaticamente.
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
          <h2>Pendencias locais</h2>
          <p className="kpi">{pendentes}</p>
        </article>
        <article className="status-card">
          <h2>Sincronizacao</h2>
          <button
            className="sync-btn"
            type="button"
            onClick={manualSync}
            disabled={!isOnline || syncing || pendentes === 0}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </article>
      </section>

      <section className="card">
        <h2>Nova operacao</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Nome
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex: Compra de racao"
            />
          </label>
          <label>
            Valor (R$)
            <input
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="0,00"
            />
          </label>
          <button className="submit-btn" type="submit">
            Salvar operacao
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Historico</h2>
        {operacoes.length === 0 ? (
          <p className="empty">Nenhuma operacao registrada.</p>
        ) : (
          <ul className="list">
            {operacoes
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.id} className="row">
                  <div>
                    <strong>{item.nome}</strong>
                    <small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small>
                  </div>
                  <div className="row-right">
                    <span>R$ {item.valor.toFixed(2)}</span>
                    <span className={item.syncStatus === 'synced' ? 'chip synced' : 'chip pending'}>
                      {item.syncStatus === 'synced' ? 'Nuvem' : 'Local'}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="card small">
        <h2>Equipe</h2>
        <p className="empty">Gerencie equipe e pagamentos no modulo de funcionarios.</p>
        <button type="button" className="submit-btn" onClick={onOpenFuncionarios}>
          Ir para Funcionarios
        </button>
      </section>
    </main>
  )
}
