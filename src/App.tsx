import { useEffect, useState } from 'react'
import { useDb } from './data/db'
import { fmt } from './domain/formatar'
import { Configuracoes } from './features/Configuracoes'
import { Equipe } from './features/Equipe'
import { Financeiro } from './features/Financeiro'
import { Inicio } from './features/Inicio'
import { Manejo } from './features/Manejo'
import { Pastos } from './features/Pastos'
import { Rebanho } from './features/Rebanho'
import { Icone } from './ui/Icone'

export type Tela = 'inicio' | 'pastos' | 'rebanho' | 'manejo' | 'financeiro' | 'equipe' | 'config'

const itensNav: Array<{ id: Tela; rotulo: string; icone: string }> = [
  { id: 'inicio', rotulo: 'Inicio', icone: 'casa' },
  { id: 'pastos', rotulo: 'Pastos', icone: 'pasto' },
  { id: 'rebanho', rotulo: 'Rebanho', icone: 'gado' },
  { id: 'manejo', rotulo: 'Manejo', icone: 'seringa' },
  { id: 'financeiro', rotulo: 'Financeiro', icone: 'dinheiro' },
  { id: 'equipe', rotulo: 'Equipe', icone: 'equipe' },
]

function telaDoHash(): Tela {
  const h = window.location.hash.replace('#', '') as Tela
  return itensNav.some((i) => i.id === h) || h === 'config' ? h : 'inicio'
}

export default function App() {
  const db = useDb()
  const [tela, setTela] = useState<Tela>(() => telaDoHash())

  useEffect(() => {
    const onHash = () => setTela(telaDoHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const irPara = (t: Tela) => {
    window.location.hash = t
    setTela(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <header className="topo">
        <div className="marca">
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#e9e2c9" /><path d="M14 26c-4-6-4-12 0-14 3 4 6 6 9 7h18c3-1 6-3 9-7 4 2 4 8 0 14-3 2-6 3-8 5v10c0 6-4 10-10 10s-10-4-10-10V31c-2-2-5-3-8-5z" fill="#1f3d2b" /></svg>
          <div>
            <strong>AgroMacro</strong>
            <small>{db.fazenda.nome}</small>
          </div>
        </div>
        <button type="button" className="cotacao" onClick={() => irPara('config')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }} aria-label="Configuracoes">
          @ boi gordo
          <b>{fmt.moeda(db.fazenda.cotacaoArroba)}</b>
        </button>
      </header>

      {tela === 'inicio' ? <Inicio irPara={irPara} /> : null}
      {tela === 'pastos' ? <Pastos /> : null}
      {tela === 'rebanho' ? <Rebanho /> : null}
      {tela === 'manejo' ? <Manejo /> : null}
      {tela === 'financeiro' ? <Financeiro /> : null}
      {tela === 'equipe' ? <Equipe /> : null}
      {tela === 'config' ? <Configuracoes /> : null}

      <datalist id="funcionarios">
        {db.funcionarios.filter((f) => f.ativo).map((f) => <option key={f.id} value={f.nome} />)}
      </datalist>

      <nav className="nav" aria-label="Navegacao principal">
        {itensNav.map((i) => (
          <button key={i.id} type="button" className={tela === i.id ? 'ativo' : ''} onClick={() => irPara(i.id)}>
            <Icone nome={i.icone} />
            {i.rotulo}
          </button>
        ))}
      </nav>
    </>
  )
}
