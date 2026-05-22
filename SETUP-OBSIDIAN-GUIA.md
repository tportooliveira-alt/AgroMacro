# 🚀 SETUP OBSIDIAN - GUIA RÁPIDO

**Escolha seu sistema operacional:**

## 🖥️ WINDOWS

1. **Abra o Explorer** e vá até a pasta do repositório
2. **Clique duas vezes** em `setup-obsidian.bat`
3. Escolha o caminho do seu Obsidian Vault (ou deixe padrão)
4. ✅ Pronto! Arquivos copiados

---

## 🍎 macOS / 🐧 Linux

### Opção 1: Script Automático (Recomendado)

```bash
# Abra o terminal e navegue até o repositório
cd /caminho/para/AgroMacro

# Torne o script executável
chmod +x setup-obsidian.sh

# Execute
./setup-obsidian.sh
```

### Opção 2: Manual

```bash
# Copie a pasta OBSIDIAN-VAULT pro seu Obsidian
cp -r OBSIDIAN-VAULT/* ~/Documents/Obsidian/

# Se seu Obsidian está em outro lugar:
cp -r OBSIDIAN-VAULT/* /caminho/seu/obsidian/vault/
```

---

## 📲 PRÓXIMOS PASSOS (Todos os Sistemas)

1. **Abra o Obsidian**
2. Clique em **"Open folder as vault"**
3. Selecione a pasta que foi copiada
4. ✅ Seu vault está pronto!

---

## 📖 COMECE AQUI

Depois que abrir o vault, leia:

- `LEIA-ME-PRIMEIRO.md` — Instruções completas
- `🌱 AgroMacro - Index.md` — Índice do projeto
- `OBSIDIAN-GUIA-MAIO-2026.md` — Guia detalhado sobre Obsidian

---

## 🆘 PROBLEMAS?

### "Script não executável"
```bash
# No macOS/Linux, torne executável:
chmod +x setup-obsidian.sh
./setup-obsidian.sh
```

### "Obsidian Vault não encontrado"
Especifique o caminho:
```bash
# macOS (exemplo):
cp -r OBSIDIAN-VAULT/* ~/Library/Mobile\ Documents/com~apple~CloudDocs/Obsidian\ Vault/

# Windows (exemplo):
xcopy OBSIDIAN-VAULT C:\Users\SeuUsuario\Documents\Obsidian /E /I
```

### "Pasta já existe"
Tudo bem! Os arquivos serão copiados e integrados.

---

## ✨ VOCÊ ESTÁ PRONTO!

Agora você tem todo um vault Obsidian estruturado e pronto pra usar! 🎉

**Divirta-se organizando seu conhecimento! 🚀**
