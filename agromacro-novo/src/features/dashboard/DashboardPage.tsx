import type React from 'react'
import { useMemo } from 'react'
import { funcionarioService } from '../../core/services/funcionarioService'
import { loteService } from '../../core/services/loteService'
import { onlineSyncService } from '../../core/services/onlineSyncService'
import { pastoService } from '../../core/services/pastoService'

interface DashboardPageProps {
  onNavigate: (view: string) => void
  userName?: string
}

const modulos = [
  {
    id: 'pastos',
    emoji: '🌿',
    titulo: 'Pastos',
    descricao: 'Troca, obra e manejo por pasto',
    cor: '#2d5a1b',
    fundo: '#e6f4df',
  },
  {
    id: 'rebanho',
    emoji: '🐄',
    titulo: 'Rebanho',
    descricao: 'Lotes, animais e movimentacoes',
    cor: '#0b6b50',
    fundo: '#d9f4ea',
  },
  {
    id: 'funcionarios',
    emoji: '👷',
    titulo: 'Funcionarios',
    descricao: 'Equipe, funcoes e pagamentos',
    cor: '#5a3a00',
    fundo: '#fff1db',
  },
  {
    id: 'operacoes',
    emoji: '📋',
    titulo: 'Operacoes',
    descricao: 'Registros e historico do dia',
    cor: '#1a3a6c',
    fundo: '#ddeaff',
  },
  {
    id: 'financeiro',
    emoji: '💰',
    titulo: 'Financeiro',
    descricao: 'Despesas, receitas e saldo',
    cor: '#6c1a1a',
    fundo: '#ffe5e5',
  },
] as const

export function DashboardPage({ onNavigate, userName }: DashboardPageProps) {
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const kpis = useMemo(() => {
    const pastos = pastoService.listPastos()
    const lotes = loteService.list()
    const funcionarios = funcionarioService.list()
    const operacoes = onlineSyncService.listOperacoes()

    const lotesAtivos = lotes.filter((l) => l.status === 'ativo')
    const totalCabecas = lotesAtivos.reduce((acc, l) => acc + (l.cabecas ?? 0), 0)
    const funcionariosAtivos = funcionarios.filter((f) => f.ativo)

    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
    const opsMes = operacoes.filter((o) => o.createdAt >= inicioMes)
    const receitaMes = opsMes.filter((o) => o.tipo === 'receita').reduce((acc, o) => acc + o.valor, 0)
    const despesaMes = opsMes.filter((o) => o.tipo === 'despesa').reduce((acc, o) => acc + o.valor, 0)
    const saldoMes = receitaMes - despesaMes

    return {
      totalPastos: pastos.length,
      lotesAtivos: lotesAtivos.length,
      totalCabecas,
      funcionariosAtivos: funcionariosAtivos.length,
      saldoMes,
      despesaMes,
    }
  }, [])

  const fmt = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <main className="cards-home">
      <header className="home-header">
        <p className="home-saudacao">{saudacao} 👋</p>
        <h1 className="home-titulo">
          {userName ? userName.split('@')[0] : 'AgroMacro'}
        </h1>
        <p className="home-sub">O que voce vai fazer hoje?</p>
      </header>

      <section className="status-grid-2">
        <article className="status-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('pastos')}>
          <h2>Pastos</h2>
          <p className="kpi">{kpis.totalPastos}</p>
          <small>cadastrados</small>
        </article>
        <article className="status-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('rebanho')}>
          <h2>Lotes ativos</h2>
          <p className="kpi">{kpis.lotesAtivos}</p>
          <small>{kpis.totalCabecas} cabecas</small>
        </article>
        <article className="status-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('funcionarios')}>
          <h2>Equipe</h2>
          <p className="kpi">{kpis.funcionariosAtivos}</p>
          <small>ativos</small>
        </article>
        <article
          className="status-card"
          style={{ cursor: 'pointer', borderLeft: kpis.saldoMes >= 0 ? '3px solid #2d8a4e' : '3px solid #c0392b' }}
          onClick={() => onNavigate('financeiro')}
        >
          <h2>Saldo do mes</h2>
          <p className="kpi" style={{ color: kpis.saldoMes >= 0 ? '#2d8a4e' : '#c0392b', fontSize: '1.4rem' }}>
            {fmt(kpis.saldoMes)}
          </p>
          <small>Despesas: {fmt(kpis.despesaMes)}</small>
        </article>
      </section>

      <section className="modulos-grid">
        {modulos.map((m) => (
          <button
            key={m.id}
            type="button"
            className="modulo-card"
            style={{ '--card-cor': m.cor, '--card-fundo': m.fundo } as React.CSSProperties}
            onClick={() => onNavigate(m.id)}
          >
            <span className="modulo-emoji">{m.emoji}</span>
            <strong className="modulo-titulo">{m.titulo}</strong>
            <span className="modulo-desc">{m.descricao}</span>
          </button>
        ))}
      </section>
    </main>
  )
}
