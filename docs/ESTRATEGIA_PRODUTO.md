# Estratégia de Produto — AgroMacro

Documento com as decisões estratégicas discutidas para transformar o AgroMacro em produto comercial.

---

## 1. Armazenamento na Nuvem (Cloud)

### Problema
Atualmente os dados ficam no `localStorage` do navegador. Para um produto comercial, precisamos de nuvem.

### Estratégia em 2 fases:

**Curto prazo → Google Sheets**
- Já temos experiência (FrigoGest)
- Grátis, rápido de implementar
- Ideal para validar o produto com 5-10 primeiros clientes
- Limitação: não escala bem

**Médio prazo → Firebase**
- Gratuito até 50.000 leituras/dia
- Sincronização automática (offline + online)
- Login com Google (fácil pro cliente)
- Multi-tenant (cada fazenda com dados separados)
- Escala pra centenas de clientes

---

## 2. Cadastro Self-Service de Clientes

### Problema
Se vender pra muitos clientes em locais distantes, não dá pra cadastrar manualmente.

### Solução: Self-Service Total
1. Cliente compra (site, WhatsApp, etc.)
2. Recebe um link → `agromacro.com.br`
3. Abre no celular → clica "Criar Conta"
4. Login com Google (todo mundo tem Gmail)
5. Pronto! Dados privados na nuvem automaticamente

**Zero contato presencial. Zero configuração manual.**

O Firebase faz tudo isso — cada login cria um "espaço" separado.

### Trabalho do vendedor:
- Marketing (Instagram, grupos de WhatsApp de fazendeiros)
- Vídeo de demonstração
- Suporte via WhatsApp

---

## 3. IA Assistente — DIFERENCIAL MATADOR

### Problema
A maioria dos pecuaristas **desiste** de apps de gestão por dificuldade de implementar na fazenda. Não entendem menus, formulários, etc.

### Solução: IA Conversacional integrada ao app

O fazendeiro abre um chat e conversa naturalmente:

```
Fazendeiro: "Comprei 30 garrotes nelore hoje, 280kg cada, paguei R$85 mil"

IA AgroMacro: "Entendi! Vou registrar pra você:
  - 30 cabeças nelore, macho, 280kg
  - Valor: R$85.000 (R$2.833/cabeça)  
  - Preço por @: R$151,78
  Quer que eu crie um lote novo ou coloque em um existente?"

Fazendeiro: "Cria lote novo, Engorda 2, pasto do fundo"

IA: "Pronto! Lote Engorda 2 criado com 30 cabeças no Pasto do Fundo.
     A próxima vacinação de Aftosa é em 45 dias — quer que eu agende o alerta?"
```

### Como fazer tecnicamente:
- **API do ChatGPT ou Claude** — centavos por conversa
- Treinamos com o contexto do AgroMacro (lotes, pastos, preços, manejos)
- A IA lê os dados do app e dá sugestões personalizadas

### Sugestões proativas da IA:
- "Seu lote Engorda 1 está há 90 dias sem pesagem"
- "O sal mineral do Pasto 3 acaba em 5 dias"
- "Com o GMD atual, o Lote 2 atinge 18@ em 45 dias"

### Custo:
- API: ~R$0,05 por conversa
- Cliente paga R$29/mês, usa 10 conversas/dia = R$1,50/mês de custo
- **Margem de lucro enorme**

### Mercado:
- **Nenhum concorrente brasileiro** tem isso funcionando bem no campo
- JetBov tem IA mas é cara (R$89-299/mês)
- AgroMacro pode ser mais simples, direto e acessível

---

## Prioridade de Implementação

| # | Feature | Impacto | Esforço |
|---|---------|---------|---------|
| 1 | Firebase + Login | Alto — habilita vendas | Médio |
| 2 | Self-service (criar conta) | Alto — escala | Baixo (vem com Firebase) |
| 3 | IA Assistente | Altíssimo — diferencial | Médio-Alto |
| 4 | Plano de assinatura | Alto — monetização | Baixo |

---

## 4. Mascote — Estilo Duolingo

### Ideia
Criar um personagem mascote (tipo o "Duo" do Duolingo) para o AgroMacro. Um **boizinho simpático e carismático** que:

- Aparece na tela de chat da IA como "avatar"
- Dá dicas e lembretes de forma amigável
- Comemora conquistas ("Parabéns! Você registrou 100 cabeças!")
- Torna o app mais acessível e menos intimidador para fazendeiros mais velhos
- Cria identidade de marca forte e memorável

### Por que funciona:
- Duolingo provou que mascote + gamificação = **retenção altíssima**
- Fazendeiro se identifica com o personagem
- Diferencia dos concorrentes sérios demais (JetBov, iRancho)
- Marketing: o mascote vira a "cara" do produto nas redes sociais

### Implementação:
- Criar design do personagem (pode ser gerado por IA)
- Usar como avatar do assistente IA
- Animações simples (piscar, acenar, comemorar)
- Aparecer nos estados vazios ("Cadastre seu primeiro lote!")

---

> **Visão**: AgroMacro é o app que o fazendeiro abre, conversa com a IA (representada pelo mascote), e toda a gestão da fazenda acontece automaticamente. Sem menus complicados, sem formulários — só conversa natural com um personagem que ele confia.
