import { useEffect, useMemo, useState } from 'react'
import { onlineSyncService } from '../services/onlineSyncService'
import { loteService } from '../services/loteService'
import type { CreateLoteInput } from '../types/lote'

export function useLotes() {
  const [lotes, setLotes] = useState(() => loteService.list())
  const [movimentacoes, setMovimentacoes] = useState(() => loteService.listMovimentacoes())
  const [alertas, setAlertas] = useState<string[]>(() => loteService.verificarInconsistencias())
  const [isOnline, setIsOnline] = useState(() => onlineSyncService.getOnlineState())
  const [syncing, setSyncing] = useState(false)

  const pendentes = useMemo(
    () => lotes.filter((item) => item.syncStatus === 'pending').length,
    [lotes],
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
      await loteService.syncPending()
      setLotes(loteService.list())
      setSyncing(false)
    }

    runSync().catch(() => setSyncing(false))
  }, [isOnline, pendentes])

  const refreshAll = () => {
    setLotes(loteService.list())
    setMovimentacoes(loteService.listMovimentacoes())
    setAlertas(loteService.verificarInconsistencias())
  }

  const addLote = async (input: CreateLoteInput) => {
    await loteService.add(input)
    refreshAll()
  }

  const inativarLote = async (id: string) => {
    await loteService.inativar(id)
    refreshAll()
  }

  const moverLote = async (id: string, pastoNome: string, responsavel: string) => {
    await loteService.transferirPasto({
      loteId: id,
      destinoPasto: pastoNome,
      responsavel,
    })
    refreshAll()
  }

  const movimentacoesPorLote = (loteId: string) =>
    movimentacoes.filter((item) => item.loteId === loteId)

  return {
    lotes,
    movimentacoes,
    alertas,
    isOnline,
    syncing,
    pendentes,
    addLote,
    inativarLote,
    moverLote,
    movimentacoesPorLote,
  }
}
