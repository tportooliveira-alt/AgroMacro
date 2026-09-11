import type { FormEvent } from 'react'
import { useState } from 'react'

interface LoginPageProps {
  isFirebaseMode: boolean
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
}

export function LoginPage({ isFirebaseMode, onLogin, onRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (mode === 'login') {
        await onLogin(email, password)
      } else {
        await onRegister(email, password)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha na autenticacao'
      setError(message)
      setBusy(false)
      return
    }

    setBusy(false)
  }

  return (
    <main className="page login-page">
      <header className="hero">
        <p className="eyebrow">AgroMacro Novo</p>
        <h1>Acesso da Fazenda</h1>
        <p className="subtitle">
          {isFirebaseMode
            ? 'Autenticacao em modo online (Firebase ativo).'
            : 'Modo local ativo. Configure VITE_FIREBASE_* para autenticar online.'}
        </p>
      </header>

      <section className="card">
        <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="submit-btn" type="submit" disabled={busy}>
            {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <button
          type="button"
          className="mini-btn"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Criar nova conta' : 'Ja tenho conta'}
        </button>
      </section>
    </main>
  )
}
