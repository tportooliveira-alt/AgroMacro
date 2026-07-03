import './App.css'
import { useMemo, useState } from 'react'
import { useAuth } from './core/hooks/useAuth'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { FinanceiroPage } from './features/financeiro/FinanceiroPage'
import { OperacoesPage } from './features/operacoes/OperacoesPage'
import { FuncionariosPage } from './features/operacoes/FuncionariosPage'
import { RebanhoPage } from './features/rebanho/RebanhoPage'
import { PastosPage } from './features/pastos/PastosPage'
import { CompraGadoPage } from './features/compraGado/CompraGadoPage'
import { ObrasPage } from './features/obras/ObrasPage'

type AppView =
  | 'dashboard'
  | 'pastos'
  | 'rebanho'
  | 'financeiro'
  | 'operacoes'
  | 'funcionarios'
  | 'compra-gado'
  | 'obras'

const navItems: Array<{ id: AppView; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Inicio', icon: '🏠' },
  { id: 'pastos', label: 'Pastos', icon: '🌿' },
  { id: 'rebanho', label: 'Rebanho', icon: '🐄' },
  { id: 'financeiro', label: 'Financeiro', icon: '💰' },
  { id: 'operacoes', label: 'Operacoes', icon: '📋' },
]

function App() {
  const { user, loading, isFirebaseMode, login, register, logout } = useAuth()
  const [view, setView] = useState<AppView>('dashboard')

  const content = useMemo(() => {
    if (view === 'dashboard') {
      return <DashboardPage onNavigate={(v) => setView(v as AppView)} userName={user?.email ?? ''} />
    }

    if (view === 'pastos') {
      return <PastosPage />
    }

    if (view === 'rebanho') {
      return <RebanhoPage onOpenCompraGado={() => setView('compra-gado')} />
    }

    if (view === 'compra-gado') {
      return <CompraGadoPage />
    }

    if (view === 'obras') {
      return <ObrasPage />
    }

    if (view === 'financeiro') {
      return <FinanceiroPage />
    }

    if (view === 'funcionarios') {
      return <FuncionariosPage />
    }

    return (
      <OperacoesPage
        onOpenFuncionarios={() => setView('funcionarios')}
        onOpenObras={() => setView('obras')}
      />
    )
  }, [view])

  if (loading) {
    return (
      <main className="page">
        <section className="card">
          <h2>Carregando...</h2>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <LoginPage
        isFirebaseMode={isFirebaseMode}
        onLogin={async (email, password) => {
          await login(email, password)
        }}
        onRegister={async (email, password) => {
          await register(email, password)
        }}
      />
    )
  }

  return (
    <>
      <header className="app-shell-top">
        <div className="app-shell-inner">
          <strong>AgroMacro Novo</strong>
          <div className="top-actions">
            <span className="user-chip">{user.email}</span>
            {view === 'funcionarios' || view === 'obras' ? (
              <button type="button" className="mini-btn" onClick={() => setView('operacoes')}>
                Voltar para Operacoes
              </button>
            ) : null}
            {view === 'compra-gado' ? (
              <button type="button" className="mini-btn" onClick={() => setView('rebanho')}>
                Voltar para Rebanho
              </button>
            ) : null}
            <button
              type="button"
              className="mini-btn"
              onClick={() => {
                void logout()
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {content}

      <nav className="app-shell-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === view ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

export default App
