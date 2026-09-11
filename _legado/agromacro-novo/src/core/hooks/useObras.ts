import { useCallback, useEffect, useState } from 'react'
import { obraService } from '../services/obraService'
import type { CreateObraInput, Obra, ObraStatus } from '../types/obra'

export function useObras() {
  const [obras, setObras] = useState<Obra[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendentes, setPendentes] = useState(0)

  const refresh = useCallback(() => {
    setObras(obraService.list())
    setPendentes(obraService.getQueue().length)
  }, [])

  useEffect(() => {
    refresh()
    const onOnline = () => {
      setIsOnline(true)
      void obraService.syncPending().then(refresh)
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refresh])

  const addObra = useCallback(
    async (input: CreateObraInput) => {
      await obraService.add(input)
      refresh()
    },
    [refresh],
  )

  const atualizarStatus = useCallback(
    async (id: string, status: ObraStatus, custoReal?: number) => {
      await obraService.atualizarStatus(id, status, custoReal)
      refresh()
    },
    [refresh],
  )

  return { obras, isOnline, pendentes, addObra, atualizarStatus }
}
