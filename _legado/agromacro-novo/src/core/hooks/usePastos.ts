import { useState } from 'react'
import { pastoService } from '../services/pastoService'
import type { AcaoTipo, CreateAcaoInput, CreatePastoInput } from '../types/pasto'

export function usePastos() {
  const [pastos, setPastos] = useState(() => pastoService.listPastos())
  const [acoes, setAcoes] = useState(() => pastoService.listAcoes())

  const addPasto = (input: CreatePastoInput) => {
    pastoService.addPasto(input)
    setPastos(pastoService.listPastos())
  }

  const registrarAcao = (input: CreateAcaoInput) => {
    pastoService.registrarAcao(input)
    setPastos(pastoService.listPastos())
    setAcoes(pastoService.listAcoes())
  }

  const importarDoMapa = () => {
    const result = pastoService.importLegacyMapPastos()
    setPastos(pastoService.listPastos())
    return result
  }

  const atualizarRebanho = (pastoId: string, loteAtual: string) => {
    pastoService.atualizarRebanhoNoPasto(pastoId, loteAtual)
    setPastos(pastoService.listPastos())
  }

  const aplicarMapaReal = (items: Array<{ nome: string; coords: Array<[number, number]> }>) => {
    const result = pastoService.aplicarMapaReal(items)
    setPastos(pastoService.listPastos())
    return result
  }

  const atualizarPoligono = (pastoId: string, coords: Array<[number, number]>) => {
    const ok = pastoService.atualizarPoligonoPasto(pastoId, coords)
    setPastos(pastoService.listPastos())
    return ok
  }

  const aplicarAcaoFazenda = (tipo: AcaoTipo, descricao: string, responsavel: string) => {
    const descricaoLimpa = descricao.trim()
    const responsavelLimpo = responsavel.trim()
    if (!descricaoLimpa || !responsavelLimpo) {
      return 0
    }

    let total = 0
    for (const pasto of pastoService.listPastos()) {
      pastoService.registrarAcao({
        pastoId: pasto.id,
        tipo,
        descricao: descricaoLimpa,
        responsavel: responsavelLimpo,
      })
      total += 1
    }

    setPastos(pastoService.listPastos())
    setAcoes(pastoService.listAcoes())
    return total
  }

  const acoesDoPost = (pastoId: string) => acoes.filter((a) => a.pastoId === pastoId)

  return {
    pastos,
    acoes,
    addPasto,
    registrarAcao,
    acoesDoPost,
    importarDoMapa,
    atualizarRebanho,
    aplicarAcaoFazenda,
    aplicarMapaReal,
    atualizarPoligono,
  }
}
