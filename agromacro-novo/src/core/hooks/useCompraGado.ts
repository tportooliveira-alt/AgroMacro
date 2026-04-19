import { useCallback, useEffect, useState } from 'react'
import { compraGadoService } from '../services/compraGadoService'
import type { CompraGado, CreateCompraGadoInput } from '../types/compraGado'

export function useCompraGado() {
  const [compras, setCompras] = useState<CompraGado[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendentes, setPendentes] = useState(0)

  const refresh = useCallback(() => {
    setCompras(compraGadoService.list())
    setPendentes(compraGadoService.getQueue().length)
  }, [])

  useEffect(() => {
    refresh()
    const onOnline = () => {
      setIsOnline(true)
      void compraGadoService.syncPending().then(refresh)
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refresh])

  const addCompra = useCallback(
    async (input: CreateCompraGadoInput) => {
      await compraGadoService.add(input)
      refresh()
    },
    [refresh],
  )

  const cancelarCompra = useCallback(
    async (id: string) => {
      await compraGadoService.cancelar(id)
      refresh()
    },
    [refresh],
  )

  return { compras, isOnline, pendentes, addCompra, cancelarCompra }
}
