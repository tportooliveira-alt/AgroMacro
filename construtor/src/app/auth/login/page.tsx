'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth.service'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Email e senha são obrigatórios')
      setLoading(false)
      return
    }

    try {
      const result = await AuthService.signIn(email, password)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setEmail('')
      setPassword('')

      router.push(redirectTo)
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email para resetar a senha')
      return
    }

    setLoading(true)
    const result = await AuthService.resetPassword(email)

    if (result.error) {
      setError(result.error)
    } else {
      setResetSent(true)
      setError('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-serif font-bold gradient-text inline-block mb-4">
            Construtor
          </Link>
          <h1 className="text-3xl font-bold mb-2">Entrar</h1>
          <p className="text-gray-600">Acesse sua conta de landing pages</p>
        </div>

        <div className="glass rounded-xl p-8">
          {resetSent ? (
            <div className="text-center py-8">
              <div className="mb-4 text-4xl">📧</div>
              <h2 className="text-xl font-bold mb-2">Email enviado!</h2>
              <p className="text-gray-600 mb-4">Verifique seu email para resetar a senha</p>
              <button
                onClick={() => setResetSent(false)}
                className="text-dourado hover:text-dourado-deep font-semibold"
              >
                Voltar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
                  disabled={loading}
                  data-testid="email-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
                  disabled={loading}
                  data-testid="password-input"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-dourado text-white font-semibold rounded-lg hover:bg-dourado-deep disabled:opacity-50 disabled:cursor-not-allowed transition"
                data-testid="login-button"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-2 text-dourado hover:text-dourado-deep font-semibold disabled:opacity-50"
              >
                Esqueceu a senha?
              </button>

              <p className="text-center text-sm text-gray-600">
                Não tem conta?{' '}
                <Link href="/auth/signup" className="text-dourado hover:text-dourado-deep font-semibold">
                  Criar conta grátis
                </Link>
              </p>
            </form>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 font-semibold mb-2">Demo (Teste Rápido):</p>
          <p className="text-xs text-blue-600">Email: test@example.com</p>
          <p className="text-xs text-blue-600">Senha: Test123456</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
