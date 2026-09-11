import { useState, type ChangeEvent, type FormEvent } from 'react'
import { salvarFazenda } from '../data/acoes'
import { exportarJson, substituirDb, useDb, validarImport, zerarDb } from '../data/db'
import { hojeIso } from '../domain/calculos'
import { Aviso, Campo, num, tentar } from '../ui/base'

export function Configuracoes() {
  const db = useDb()
  const [f, setF] = useState({ ...db.fazenda, cotacaoArroba: String(db.fazenda.cotacaoArroba), rendimentoCarcaca: String(Math.round(db.fazenda.rendimentoCarcaca * 100)) })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const salvar = (e: FormEvent) => {
    e.preventDefault()
    const err = tentar(() => salvarFazenda({ nome: f.nome, proprietario: f.proprietario, municipio: f.municipio, cotacaoArroba: num(f.cotacaoArroba), rendimentoCarcaca: num(f.rendimentoCarcaca) / 100 }))
    setMsg(err ? { tipo: 'erro', texto: err } : { tipo: 'ok', texto: 'Dados da fazenda salvos.' })
  }

  const exportar = () => {
    const blob = new Blob([exportarJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agromacro-backup-${hojeIso()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importar = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!window.confirm('Importar substitui TODOS os dados atuais. Continuar?')) return
    try {
      const novo = validarImport(await arquivo.text())
      substituirDb(novo)
      setMsg({ tipo: 'ok', texto: 'Backup importado com sucesso.' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Arquivo invalido.' })
    }
  }

  const zerar = () => {
    if (!window.confirm('Apagar TODOS os dados do app neste aparelho? Faca um backup antes.')) return
    if (!window.confirm('Tem certeza? Esta acao nao pode ser desfeita.')) return
    zerarDb()
    setMsg({ tipo: 'ok', texto: 'Dados apagados.' })
  }

  const registros = db.pastos.length + db.lotes.length + db.pesagens.length + db.manejos.length + db.lancamentos.length + db.funcionarios.length

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div><h1>Configuracoes</h1><p>Fazenda, cotacao e backup</p></div>
      </div>
      {msg ? <Aviso tipo={msg.tipo}>{msg.texto}</Aviso> : null}

      <form className="card" onSubmit={salvar}>
        <h2>Fazenda</h2>
        <div className="campos">
          <Campo label="Nome da fazenda" largo><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></Campo>
          <Campo label="Proprietario"><input value={f.proprietario} onChange={(e) => setF({ ...f, proprietario: e.target.value })} /></Campo>
          <Campo label="Municipio / UF"><input value={f.municipio} onChange={(e) => setF({ ...f, municipio: e.target.value })} /></Campo>
          <Campo label="Cotacao da @ (R$)" dica="Usada para valor do rebanho e sugerida em compra/venda."><input inputMode="decimal" value={f.cotacaoArroba} onChange={(e) => setF({ ...f, cotacaoArroba: e.target.value })} required /></Campo>
          <Campo label="Rendimento de carcaca (%)" dica="Nelore a pasto ~50-52%; cruzado terminado ~54-56%."><input inputMode="numeric" value={f.rendimentoCarcaca} onChange={(e) => setF({ ...f, rendimentoCarcaca: e.target.value })} required /></Campo>
        </div>
        <div className="botoes"><button type="submit" className="btn">Salvar</button></div>
      </form>

      <section className="card">
        <h2>Backup</h2>
        <p className="muted">Os dados ficam salvos somente neste aparelho ({registros} registros). Exporte um backup regularmente e guarde em lugar seguro.</p>
        <div className="botoes" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn" onClick={exportar}>Exportar backup (JSON)</button>
          <label className="btn sec" style={{ cursor: 'pointer' }}>
            Importar backup
            <input type="file" accept="application/json,.json" onChange={importar} className="sr-only" />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Zona de perigo</h2>
        <p className="muted">Apaga todos os pastos, lotes, pesagens, manejos, lancamentos e funcionarios deste aparelho.</p>
        <div className="botoes" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn perigo" onClick={zerar}>Apagar todos os dados</button>
        </div>
      </section>
    </div>
  )
}
