import { useEffect, useState } from 'react'
import { authService, type AppUser } from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.observeAuth((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return {
    user,
    loading,
    isFirebaseMode: authService.isFirebaseMode(),
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
  }
}
