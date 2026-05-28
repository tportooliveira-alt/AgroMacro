'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth.service'
import { DatabaseService } from '@/lib/database.service'
import { supabase } from '@/lib/supabase'

interface UserData {
  id: string
  email: string
  plan: 'free' | 'pro' | 'agency'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      const userRecord = await DatabaseService.getUserById(session.user.id)
      const count = await DatabaseService.countUserLandingPages(session.user.id)

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        plan: userRecord?.plan || 'free',
      })
      setPageCount(count)
      setLoading(false)
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    await AuthService.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  const planLabel = {
    free: 'Free (1 LP/mês)',
    pro: 'Pro (Ilimitado)',
    agency: 'Agency (Equipe)',
  }[user.plan]

  const canCreateNew = user.plan !== 'free' || pageCount < 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif font-bold gradient-text">
            Construtor
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600" data-testid="user-email">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
              data-testid="logout-button"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Gerencie suas landing pages</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6" data-testid="plan-card">
            <p className="text-sm text-gray-600 mb-1">Plano atual</p>
            <p className="text-xl font-bold">{planLabel}</p>
          </div>

          <div className="glass rounded-xl p-6" data-testid="pages-count-card">
            <p className="text-sm text-gray-600 mb-1">Landing pages criadas</p>
            <p className="text-xl font-bold">{pageCount}</p>
          </div>

          <div className="glass rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className="text-xl font-bold text-green-600">Ativo</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Suas Landing Pages</h2>
          {canCreateNew ? (
            <Link
              href="/editor"
              className="px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado-deep font-semibold"
              data-testid="create-page-button"
            >
              Criar nova
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="px-4 py-2 bg-azul text-white rounded-lg hover:bg-azul-light font-semibold"
              data-testid="upgrade-button"
            >
              Upgrade para Pro
            </Link>
          )}
        </div>

        {pageCount === 0 ? (
          <div className="glass rounded-xl p-12 text-center" data-testid="empty-state">
            <p className="text-gray-600 mb-4">Você ainda não criou nenhuma landing page</p>
            {canCreateNew && (
              <Link
                href="/editor"
                className="inline-block px-6 py-2 bg-dourado text-white rounded-lg hover:bg-dourado-deep font-semibold"
              >
                Criar primeira página
              </Link>
            )}
          </div>
        ) : (
          <div className="glass rounded-xl p-6">
            <p className="text-gray-600">Lista de landing pages em breve...</p>
          </div>
        )}
      </main>
    </div>
  )
}
