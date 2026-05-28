# 🚀 VAULT OBSIDIAN - GUIA DE USO

**Criado:** Maio 2026  
**Status:** ✅ Pronto para usar

---

## 📥 COMO IMPORTAR PARA SEU OBSIDIAN

### Passo 1: Clone ou Copie a Pasta

```bash
# Opção A: Clone dos repos
cd ~/Documents/Obsidian
git clone https://github.com/tportooliveira-alt/AgroMacro.git
cd AgroMacro && cp -r OBSIDIAN-VAULT/* ../meu-vault/

# Opção B: Copie manualmente
# 1. Abra o terminal
# 2. Copie a pasta OBSIDIAN-VAULT pro seu vault Obsidian
```

### Passo 2: Abra no Obsidian

1. Abra o **Obsidian**
2. Clique em "Open folder as vault"
3. Selecione a pasta que copiou
4. ✅ Pronto!

---

## 📁 ESTRUTURA DO VAULT (PARA Method)

```
Vault/
├── Projects/
│   ├── AgroMacro/
│   │   ├── 🌱 AgroMacro - Index.md  ← Comece aqui!
│   │   ├── AgroMacro - Planejamento.md
│   │   ├── AgroMacro - Financeiro.md
│   │   ├── AgroMacro - Operacional.md
│   │   ├── AgroMacro - Aprendizados.md
│   │   ├── Documentacao/
│   │   └── Specs/
│   └── Thiago/  (em desenvolvimento)
│
├── Areas/  (Áreas da vida)
│   ├── Negocio/
│   └── Desenvolvimento/
│
├── Resources/  (Recursos úteis)
│   └── Templates/
│       ├── Template - Nota Padrão.md
│       └── Template - Daily Note.md
│
└── Diario/  (Daily Notes)
    └── Seu arquivo diário vai aqui
```

---

## 🎯 COMO USAR

### 1️⃣ Comece Aqui
- Abra: `Projects/AgroMacro/🌱 AgroMacro - Index.md`
- Esta é sua **Map of Content (MOC)** — centraliza tudo!
- Clique nos links para navegar

### 2️⃣ Todos os Dias
- Crie uma nota em `Diario/` 
- Use o template `Template - Daily Note.md`
- Capture: ideias, tarefas, reflexões

### 3️⃣ Semanalmente
- Revise suas Daily Notes
- Extraia insights importantes
- Crie novas notas de conceito

### 4️⃣ Use os Templates
- **Template - Nota Padrão**: Para qualquer nota nova
- **Template - Daily Note**: Para seu diário

---

## 🔗 LINKS INTERNOS (Como Conectar Notas)

```markdown
[[AgroMacro - Planejamento]]  → Link interno
[[🌱 AgroMacro - Index|Ver Index]]  → Link com texto customizado
```

**Dica:** Enquanto digita `[[`, Obsidian sugere notas existentes!

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### Graph View
- Clique em: **View → Graph View**
- Veja todas as suas notas conectadas visualmente
- Descubra padrões e conexões

### Backlinks
- Veja no final de qualquer nota: "Backlinks"
- Mostra quais notas linkam pra esta

### Search
- `Ctrl+Shift+F` (Windows) ou `Cmd+Shift+F` (Mac)
- Busque por palavras-chave em todo vault

### Tags
- Use `#tag-em-minuscula` em suas notas
- Clique em tags pra ver todas as notas com essa tag

---

## 🎨 PRÓXIMOS PASSOS

### Personalize Seu Vault

1. **Plugins Essenciais** (ative na esquerda)
   - Calendar: Ver notas por data
   - Dataview: Consultar notas
   - Kanban: Quadros de tarefas
   - Templater: Templates automáticos

2. **Customize o Tema**
   - Settings → Appearance
   - Escolha um tema (Light/Dark)

3. **Crie Seu Estilo**
   - Adicione emojis nas suas notas
   - Use cores (markdown):
     ```markdown
     > [!note] Nota importante
     > Este é um callout
     ```

---

## 📝 DICAS IMPORTANTES

✅ **Comece pequeno**: Não tente documentar tudo no dia 1  
✅ **Revise regularmente**: Daily notes → Weekly insights → Monthly patterns  
✅ **Conecte notas**: Use links `[[]]` liberalmente  
✅ **Use tags**: Para categorizar `#agromacro`, `#ideia`, `#importante`  
✅ **Aproveite templates**: Copie e customize conforme necessário  

❌ **Não faça**: Tenha medo de criar notas "erradas"  
❌ **Não faça**: Tente organizar perfeitamente no início  
❌ **Não faça**: Ignore backlinks — eles revelam conexões!  

---

## 🆘 PROBLEMAS COMUNS

### "Os links não funcionam"
→ Certifique-se de que o nome da nota corresponde exatamente  
→ Use `[[Nome Exato]]`

### "Não vejo o Graph View"
→ Ative em: View → Toggle Graph View (ou Ctrl+G)

### "Quero mudar a estrutura"
→ Obsidian permite reorganizar! Basta mover/renomear pastas

---

## 🚀 INTEGRAÇÃO COM CLAUDE CODE

As **Obsidian Skills** estão em `.claude/skills/` dos seus repos!

Use Claude Code para:
- ✏️ Editar notas `.md`
- 🔗 Criar wikilinks automaticamente
- 📊 Transformar dados em `.base` files
- 🎨 Criar canvases `.canvas`

---

## 📚 LEITURA ADICIONAL

- `OBSIDIAN-GUIA-MAIO-2026.md` - Guia completo
- [Obsidian Help](https://help.obsidian.md/) - Documentação oficial
- `Template - Nota Padrão.md` - Copie e customize

---

## ✨ VOCÊ ESTÁ PRONTO!

🎉 Seu vault Obsidian está configurado e pronto para usar.

**Próximo passo:** 
1. Abra `Projects/AgroMacro/🌱 AgroMacro - Index.md`
2. Explore os links
3. Crie sua primeira Daily Note em `Diario/`

**Divirta-se organizando seu conhecimento! 🚀**

---

**Criado com ❤️ - Maio 2026**
