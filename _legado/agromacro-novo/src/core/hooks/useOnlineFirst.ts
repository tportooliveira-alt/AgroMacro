import { useEffect, useMemo, useState } from 'react'
import { onlineSyncService } from '../services/onlineSyncService'
import type { CreateOperacaoInput } from '../types/operacao'

export function useOnlineFirst() {
  const [operacoes, setOperacoes] = useState(() => onlineSyncService.listOperacoes())
  const [isOnline, setIsOnline] = useState(() => onlineSyncService.getOnlineState())
  const [syncing, setSyncing] = useState(false)

  const pendentes = useMemo(
    () => operacoes.filter((item) => item.syncStatus === 'pending').length,
    [operacoes],
  )

  useEffect(() => {
    return onlineSyncService.subscribeOnlineState((online) => {
      setIsOnline(online)
    })
  }, [])

  useEffect(() => {
    if (!isOnline || pendentes === 0) {
      return
    }

    const runSync = async () => {
      setSyncing(true)
      await onlineSyncService.syncPending()
      setOperacoes(onlineSyncService.listOperacoes())
      setSyncing(false)
    }

    runSync().catch(() => setSyncing(false))
  }, [isOnline, pendentes])

  const addOperacao = async (input: CreateOperacaoInput) => {
    await onlineSyncService.addOperacao(input)
    setOperacoes(onlineSyncService.listOperacoes())
  }

  const manualSync = async () => {
    setSyncing(true)
    await onlineSyncService.syncPending()
    setOperacoes(onlineSyncService.listOperacoes())
    setSyncing(false)
  }

  return {
    operacoes,
    isOnline,
    syncing,
    pendentes,
    addOperacao,
    manualSync,
  }
}
