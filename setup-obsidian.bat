@echo off
REM 🚀 Script para importar Obsidian Vault automaticamente (Windows)
REM Execute este arquivo para copiar os vaults do repositório pro seu Obsidian

setlocal enabledelayedexpansion

echo.
echo 🚀 Iniciando importacao do Obsidian Vault...
echo.

REM Passo 1: Definir caminhos
echo 📁 Configurando caminhos...

set "DEFAULT_VAULT=%USERPROFILE%\Documents\Obsidian"

if exist "%DEFAULT_VAULT%" (
    echo Vault padrao encontrado: %DEFAULT_VAULT%
) else (
    set "DEFAULT_VAULT=%USERPROFILE%\Documents"
    echo Vault padrao: %DEFAULT_VAULT%
)

echo.

REM Passo 2: Perguntar onde copiar
set "VAULT_PATH="
set /p VAULT_PATH="📂 Caminho do seu Obsidian Vault [%DEFAULT_VAULT%]: "

if "!VAULT_PATH!"=="" (
    set "VAULT_PATH=%DEFAULT_VAULT%"
)

REM Criar pasta se não existir
if not exist "!VAULT_PATH!" (
    echo ⚠️  Pasta nao existe, criando...
    mkdir "!VAULT_PATH!"
)

echo ✅ Usando vault: !VAULT_PATH!
echo.

REM Passo 3: Copiar OBSIDIAN-VAULT
echo 📋 Copiando arquivos do OBSIDIAN-VAULT...

set "OBSIDIAN_VAULT_SRC=%~dp0OBSIDIAN-VAULT"

if not exist "!OBSIDIAN_VAULT_SRC!" (
    echo ❌ OBSIDIAN-VAULT nao encontrado em !OBSIDIAN_VAULT_SRC!
    echo Certifique-se de que o script esta no repositorio clonado.
    pause
    exit /b 1
)

echo Encontrado: !OBSIDIAN_VAULT_SRC!
echo.

REM Passo 4: Copiar todos os arquivos
echo 📚 Copiando estrutura e arquivos...

REM Usar xcopy para copiar recursivamente
xcopy "!OBSIDIAN_VAULT_SRC!" "!VAULT_PATH!" /E /I /Y >nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Arquivos copiados com sucesso!
) else (
    echo ❌ Erro ao copiar arquivos!
    pause
    exit /b 1
)

echo.

REM Passo 5: Resumo
echo 📊 RESUMO DA INSTALACAO
echo ════════════════════════════════════════════════
echo ✅ Vault importado em: !VAULT_PATH!
echo.
echo 📁 Estrutura instalada:
echo   • Projects/ - Seus projetos ^(AgroMacro, Thiago^)
echo   • Areas/ - Areas da vida/trabalho
echo   • Resources/Templates/ - Templates reutilizaveis
echo   • Diario/ - Para suas daily notes
echo.
echo 🎯 PROXIMOS PASSOS:
echo 1. Abra o Obsidian
echo 2. Clique em 'Open folder as vault'
echo 3. Selecione: !VAULT_PATH!
echo 4. Abra 'LEIA-ME-PRIMEIRO.md' ou:
echo    - '🌱 AgroMacro - Index.md' ^(para AgroMacro^)
echo    - '💻 Thiago Poro Oliveira - Index.md' ^(para Thiago^)
echo 5. Comece a explorar! 🚀
echo.
echo ════════════════════════════════════════════════
echo ✨ Tudo pronto! Divirta-se com seu novo vault!
echo.

pause
