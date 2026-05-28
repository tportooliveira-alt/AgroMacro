#!/bin/bash
# 🚀 Script para importar Obsidian Vault automaticamente
# Execute este script para copiar os vaults do repositório pro seu Obsidian

set -e  # Exit se algo der erro

echo "🚀 Iniciando importação do Obsidian Vault..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Passo 1: Definir caminhos
echo -e "${BLUE}📁 Configurando caminhos...${NC}"

# Tenta encontrar o Obsidian Vault padrão
if [ -d "$HOME/Documents/Obsidian" ]; then
    DEFAULT_VAULT="$HOME/Documents/Obsidian"
elif [ -d "$HOME/Obsidian" ]; then
    DEFAULT_VAULT="$HOME/Obsidian"
elif [ -d "$HOME/OneDrive/Documentos/Obsidian" ]; then
    DEFAULT_VAULT="$HOME/OneDrive/Documentos/Obsidian"
else
    DEFAULT_VAULT="$HOME/Documents"
fi

echo "Vault padrão encontrado: $DEFAULT_VAULT"
echo ""

# Passo 2: Perguntar onde copiar
read -p "📂 Caminho do seu Obsidian Vault [$DEFAULT_VAULT]: " VAULT_PATH
VAULT_PATH="${VAULT_PATH:-$DEFAULT_VAULT}"

# Criar pasta se não existir
if [ ! -d "$VAULT_PATH" ]; then
    echo -e "${YELLOW}⚠️  Pasta não existe, criando...${NC}"
    mkdir -p "$VAULT_PATH"
fi

echo -e "${GREEN}✅ Usando vault: $VAULT_PATH${NC}"
echo ""

# Passo 3: Copiar OBSIDIAN-VAULT
echo -e "${BLUE}📋 Copiando arquivos do OBSIDIAN-VAULT...${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OBSIDIAN_VAULT_SRC="$SCRIPT_DIR/OBSIDIAN-VAULT"

if [ ! -d "$OBSIDIAN_VAULT_SRC" ]; then
    echo -e "${YELLOW}⚠️  OBSIDIAN-VAULT não encontrado em $OBSIDIAN_VAULT_SRC${NC}"
    echo "Procurando em diretórios pais..."

    # Procura em diretórios pais
    CURRENT_DIR="$SCRIPT_DIR"
    FOUND=0

    for i in {1..5}; do
        CURRENT_DIR="$(dirname "$CURRENT_DIR")"
        if [ -d "$CURRENT_DIR/OBSIDIAN-VAULT" ]; then
            OBSIDIAN_VAULT_SRC="$CURRENT_DIR/OBSIDIAN-VAULT"
            FOUND=1
            break
        fi
    done

    if [ $FOUND -eq 0 ]; then
        echo -e "${YELLOW}❌ OBSIDIAN-VAULT não encontrado!${NC}"
        echo "Certifique-se de que o script está no repositório clonado."
        exit 1
    fi
fi

echo "Encontrado: $OBSIDIAN_VAULT_SRC"
echo ""

# Passo 4: Copiar todos os arquivos
echo -e "${BLUE}📚 Copiando estrutura e arquivos...${NC}"

# Copia mantendo a estrutura
cp -r "$OBSIDIAN_VAULT_SRC"/* "$VAULT_PATH/"

echo -e "${GREEN}✅ Arquivos copiados com sucesso!${NC}"
echo ""

# Passo 5: Resumo
echo -e "${BLUE}📊 RESUMO DA INSTALAÇÃO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Vault importado em: $VAULT_PATH${NC}"
echo ""
echo "📁 Estrutura instalada:"
echo "  • Projects/ - Seus projetos (AgroMacro, Thiago)"
echo "  • Areas/ - Áreas da vida/trabalho"
echo "  • Resources/Templates/ - Templates reutilizáveis"
echo "  • Diario/ - Para suas daily notes"
echo ""
echo -e "${YELLOW}🎯 PRÓXIMOS PASSOS:${NC}"
echo "1. Abra o Obsidian"
echo "2. Clique em 'Open folder as vault'"
echo "3. Selecione: $VAULT_PATH"
echo "4. Abra 'LEIA-ME-PRIMEIRO.md' ou:"
echo "   - '🌱 AgroMacro - Index.md' (para AgroMacro)"
echo "   - '💻 Thiago Poro Oliveira - Index.md' (para Thiago)"
echo "5. Comece a explorar! 🚀"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Tudo pronto! Divirta-se com seu novo vault!${NC}"
echo ""
