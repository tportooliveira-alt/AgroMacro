import { useCallback, useState } from 'react'
import { pesagemService } from '../services/pesagemService'
import type { CreatePesagemInput, GmdResult, Pesagem } from '../types/pesagem'

export function usePesagens(loteId?: string) {
  const [pesagens, setPesagens] = useState<Pesagem[]>(() =>
    loteId ? pesagemService.listByLote(loteId) : pesagemService.list(),
  )

  const [gmds, setGmds] = useState<GmdResult[]>(() =>
    pesagemService.calcularGmdTodos(),
  )

  const refresh = useCallback(() => {
    setPesagens(loteId ? pesagemService.listByLote(loteId) : pesagemService.list())
    setGmds(pesagemService.calcularGmdTodos())
  }, [loteId])

  const addPesagem = useCallback(
    async (input: CreatePesagemInput) => {
      await pesagemService.add(input)
      refresh()
    },
    [refresh],
  )

  const removePesagem = useCallback(
    (id: string) => {
      pesagemService.remove(id)
      refresh()
    },
    [refresh],
  )

  const getGmdForLote = useCallback(
    (id: string, nome: string): GmdResult => {
      return pesagemService.calcularGmd(id, nome)
    },
    [],
  )

  return {
    pesagens,
    gmds,
    addPesagem,
    removePesagem,
    getGmdForLote,
    refresh,
  }
}
