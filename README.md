# AgroMacro - Gestao de Fazenda de Pecuaria de Corte

App web (PWA, mobile-first) para tocar uma fazenda de gado de corte no dia a dia:
pastos, lotes, pesagens (GMD), manejo sanitario, compra e venda por arroba,
financeiro por centro de custo e equipe. Funciona offline, sem servidor:
os dados ficam no aparelho (localStorage) com backup/restauracao em JSON.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes de dominio e regras de negocio (vitest)
npm run build      # gera dist/ (deploy: firebase deploy --only hosting)
```

## O que o app faz

| Tela | Funcoes |
|------|---------|
| Inicio | Cabecas, @ em pe, valor do rebanho pela cotacao, lotacao UA/ha, saldo do mes, custo/cab/dia, alertas (lote sem pasto, sem pesagem ha 60+ dias, pasto superlotado, lote em pasto em reforma) |
| Pastos | Cadastro, importacao dos 49 poligonos reais da fazenda com area calculada, mapa SVG por situacao, lotes por pasto, mover lote para o pasto, historico de entradas/saidas |
| Rebanho | Lotes por categoria (cria, recria, engorda, matrizes, touros), pesagem com GMD e previsao de dias ate 520 kg, troca de pasto com responsavel, linha do tempo do lote, encerrar lote |
| Manejo | Vacina, vermifugo, carrapaticida, medicamento, suplementacao, castracao, marcacao. Custo vira despesa automatica (sanidade ou nutricao) |
| Financeiro | Compra de gado (cria lote ou soma em lote existente, peso ponderado), venda por @ (baixa cabecas, encerra lote ao zerar), lancamentos manuais por centro de custo, resumo mensal, custo/cab/dia |
| Equipe | Funcionarios ativos/inativos, folha do mes lancada como mao de obra, responsaveis sugeridos nos formularios |
| Configuracoes | Nome/proprietario/municipio, cotacao da @, rendimento de carcaca, exportar/importar backup JSON, zerar dados |

Regras de negocio principais (todas testadas em `src/data/acoes.test.ts`):

- Toda referencia entre entidades e por `id`, nunca por nome.
- Lote inativo nao movimenta; pasto em reforma bloqueia entrada; funcionario inativo nao registra operacao.
- Compra, venda e manejo com custo geram lancamento vinculado que nao pode ser apagado a mao.
- Pesagem so atualiza o peso do lote se for a mais recente.
- Conversao: `@ = peso vivo x rendimento de carcaca / 15`; `UA = peso vivo / 450`.

## Estrutura

```
src/
  domain/      tipos, calculos zootecnicos e financeiros (puros, testados)
  data/        store localStorage (db.ts), regras de negocio (acoes.ts), poligonos da fazenda
  ui/          componentes base (Kpi, Campo, Modal, Aviso), icones SVG
  features/    uma tela por arquivo: Inicio, Pastos, Rebanho, Manejo, Financeiro, Equipe, Configuracoes
docs/          guia tecnico de pecuaria de corte e pesquisas de pastagem (referencia de dominio)
```

## Proximos passos sugeridos

1. Sincronizacao multi-aparelho (Firebase Auth + Firestore) por cima de `src/data/db.ts`.
2. Controle individual por brinco dentro do lote (nascimentos, mortes, reproducao/IATF).
3. Calendario sanitario com alertas de vencimento por categoria.
4. Estoque de insumos (sal, racao, medicamentos) com baixa automatica no manejo.
