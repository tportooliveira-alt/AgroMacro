import { useEffect, useMemo, useState } from 'react'
import { funcionarioService } from '../services/funcionarioService'
import { onlineSyncService } from '../services/onlineSyncService'
import type { CreateFuncionarioInput } from '../types/funcionario'

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState(() => funcionarioService.list())
  const [isOnline, setIsOnline] = useState(() => onlineSyncService.getOnlineState())
  const [syncing, setSyncing] = useState(false)

  const pendentes = useMemo(
    () => funcionarios.filter((item) => item.syncStatus === 'pending').length,
    [funcionarios],
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
      await funcionarioService.syncPending()
      setFuncionarios(funcionarioService.list())
      setSyncing(false)
    }

    runSync().catch(() => setSyncing(false))
  }, [isOnline, pendentes])

  const addFuncionario = async (input: CreateFuncionarioInput) => {
    await funcionarioService.add(input)
    setFuncionarios(funcionarioService.list())
  }

  const inativarFuncionario = async (id: string) => {
    await funcionarioService.inativar(id)
    setFuncionarios(funcionarioService.list())
  }

  const reativarFuncionario = async (id: string) => {
    await funcionarioService.reativar(id)
    setFuncionarios(funcionarioService.list())
  }

  return {
    funcionarios,
    isOnline,
    syncing,
    pendentes,
    addFuncionario,
    inativarFuncionario,
    reativarFuncionario,
  }
}
