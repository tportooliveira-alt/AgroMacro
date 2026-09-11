import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function Kpi({ rotulo, valor, sub, destaque }: { rotulo: string; valor: string; sub?: string; destaque?: boolean }) {
  return (
    <div className={destaque ? 'kpi destaque' : 'kpi'}>
      <div className="rotulo">{rotulo}</div>
      <div className="valor">{valor}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  )
}

export function Campo({
  label,
  children,
  dica,
  largo,
}: {
  label: string
  children: ReactNode
  dica?: string
  largo?: boolean
}) {
  return (
    <label className={largo ? 'campo largo' : 'campo'}>
      <span className="rotulo">{label}</span>
      {children}
      {dica ? <span className="dica">{dica}</span> : null}
    </label>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>
}

export function Aviso({ tipo = 'aviso', children }: { tipo?: 'aviso' | 'erro' | 'ok'; children: ReactNode }) {
  return <div className={tipo === 'aviso' ? 'aviso' : `aviso ${tipo}`}>{children}</div>
}

export function Modal({ titulo, aberto, onFechar, children }: { titulo: string; aberto: boolean; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, onFechar])

  if (!aberto) return null
  return (
    <div className="modal-fundo" onClick={onFechar} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Executa uma acao de negocio e devolve a mensagem de erro (ou null) para o formulario. */
export function tentar(fn: () => void): string | null {
  try {
    fn()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Erro inesperado.'
  }
}

export function num(v: string): number {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
