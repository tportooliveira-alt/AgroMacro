'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth.service'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      const result = await AuthService.signUp(email, password)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-serif font-bold gradient-text inline-block mb-4">
            Construtor
          </Link>
          <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
          <p className="text-gray-600">Comece seu teste gratuito de 7 dias</p>
        </div>

        <div className="glass rounded-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="mb-4 text-4xl">✅</div>
              <h2 className="text-xl font-bold mb-2">Conta criada com sucesso!</h2>
              <p className="text-gray-600 mb-4">Redirecionando para o dashboard...</p>
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
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
                  disabled={loading}
                  data-testid="password-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
                  disabled={loading}
                  data-testid="confirm-password-input"
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
                data-testid="signup-button"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Já tem conta?{' '}
                <Link href="/auth/login" className="text-dourado hover:text-dourado-deep font-semibold">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ao se registrar, você concorda com nossos{' '}
          <Link href="#" className="hover:underline">
            Termos de Serviço
          </Link>
        </p>
      </div>
    </div>
  )
}
