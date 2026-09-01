@echo off
:: Configura o console do Windows para UTF-8 para exibir os caracteres como ✓ corretamente
chcp 65001 > nul

echo ===========================================
echo       GERADOR DE RELEASE DO PROJETO
echo ===========================================
echo.
echo Verificando ambiente...
echo.

:: Garante que o git.exe real esteja no PATH (PowerShell/CMD muitas vezes
:: só têm GitHubDesktop\bin, que NÃO inclui o git).
where git >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "PATH=C:\Program Files\Git\cmd;%PATH%"
    ) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
        set "PATH=C:\Program Files (x86)\Git\cmd;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
    )
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo O comando git nao foi encontrado no PATH do Windows.
    echo.
    echo O Git Bash funciona porque adiciona o Git ao PATH sozinha.
    echo No PowerShell/CMD, adicione esta pasta ao PATH do usuario:
    echo   C:\Program Files\Git\cmd
    echo.
    echo Operacao cancelada.
    exit /b 1
)

:: 1. Verificar se é repositório Git
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
    echo Este diretório não é um repositório Git.
    echo.
    echo Operação cancelada.
    exit /b 1
)
echo ✓ Repositório Git encontrado

:: 2. Verificar e configurar pull.rebase e rebase.autoStash globalmente
set "PULL_REBASE="
for /f "tokens=*" %%a in ('git config --global --get pull.rebase 2^>nul') do set "PULL_REBASE=%%a"

set "PULL_REBASE_OK=0"
if /i "%PULL_REBASE%"=="true" set "PULL_REBASE_OK=1"

if "%PULL_REBASE_OK%"=="1" (
    echo ✓ pull.rebase já está ativado globalmente
) else (
    echo Configurando pull.rebase=true globalmente...
    git config --global pull.rebase true
    if %errorlevel% neq 0 (
        echo Erro ao configurar pull.rebase globalmente.
        exit /b 1
    )
    echo ✓ pull.rebase ativado globalmente
)

set "REBASE_AUTOSTASH="
for /f "tokens=*" %%a in ('git config --global --get rebase.autoStash 2^>nul') do set "REBASE_AUTOSTASH=%%a"

set "REBASE_AUTOSTASH_OK=0"
if /i "%REBASE_AUTOSTASH%"=="true" set "REBASE_AUTOSTASH_OK=1"

if "%REBASE_AUTOSTASH_OK%"=="1" (
    echo ✓ rebase.autoStash já está ativado globalmente
) else (
    echo Configurando rebase.autoStash=true globalmente...
    git config --global rebase.autoStash true
    if %errorlevel% neq 0 (
        echo Erro ao configurar rebase.autoStash globalmente.
        exit /b 1
    )
    echo ✓ rebase.autoStash ativado globalmente
)
echo.

:: 2. Verificar alterações não commitadas
set "UNCOMMITTED="
for /f "tokens=*" %%i in ('git status --porcelain --untracked-files=no') do set "UNCOMMITTED=%%i"
if not "%UNCOMMITTED%"=="" (
    echo Existem alterações locais não commitadas.
    echo.
    echo Realize um Commit ou Stash antes de criar uma Release.
    exit /b 1
)

:: 3. Verificar acesso ao repositório remoto
git ls-remote origin >nul 2>&1
if %errorlevel% neq 0 (
    echo Não foi possível acessar o repositório remoto.
    echo.
    echo Verifique se você está autenticado no Git.
    echo.
    echo Operação cancelada.
    exit /b 1
)

:: 4. Mudar para branch main e atualizar
git checkout main >nul 2>&1
if %errorlevel% neq 0 (
    echo Não foi possível alternar para a branch main.
    echo.
    echo Operação cancelada.
    exit /b 1
)

for /f "tokens=*" %%b in ('git branch --show-current') do set "BRANCH=%%b"
if not "%BRANCH%"=="main" (
    echo Falha ao alternar para a branch main (atual: %BRANCH%^).
    echo.
    echo Operação cancelada.
    exit /b 1
)

echo ✓ Branch: main
echo ✓ Working Tree limpa
echo ✓ Acesso ao remoto confirmado
echo.

echo Atualizando repositório...
echo.
echo git pull --rebase origin main
git pull --rebase origin main
if %errorlevel% neq 0 (
    echo.
    echo Erro ao atualizar a branch main.
    echo Pode ter ocorrido um conflito durante o Rebase.
    echo Operação cancelada.
    echo.
    exit /b 1
)
git fetch --tags >nul 2>&1
echo.

:: 5. Descobrir a última tag ordenada por versão decrescente
set "LAST_TAG="
for /f "tokens=*" %%t in ('git tag -l "v*" --sort^=-version:refname') do (
    set "LAST_TAG=%%t"
    goto found_tag
)
:found_tag
if "%LAST_TAG%"=="" (
    :: Se não houver tags no projeto, assume v0.0.0 como inicial
    set "LAST_TAG=v0.0.0"
)

echo Última versão encontrada:
echo %LAST_TAG%
echo.

:: Parsear a tag no formato vMAJOR.MINOR.PATCH
set "CLEAN_TAG=%LAST_TAG%"
if "%CLEAN_TAG:~0,1%"=="v" set "CLEAN_TAG=%CLEAN_TAG:~1%"
if "%CLEAN_TAG:~0,1%"=="V" set "CLEAN_TAG=%CLEAN_TAG:~1%"

:: Inicializa variáveis de semver
set "MAJOR=0"
set "MINOR=0"
set "PATCH=0"

for /f "tokens=1,2,3 delims=." %%a in ("%CLEAN_TAG%") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set "PATCH=%%c"
)

if "%MAJOR%"=="" set "MAJOR=0"
if "%MINOR%"=="" set "MINOR=0"
if "%PATCH%"=="" set "PATCH=0"

:menu
echo Escolha o tipo de versionamento
echo.
echo [1] Major
echo [2] Minor
echo [3] Patch
echo [0] Sair
echo.
set "OPTION="
set /p OPTION=Opção: 

if "%OPTION%"=="0" (
    echo.
    echo Operação cancelada pelo usuário.
    exit /b 0
)
if "%OPTION%"=="1" (
    set /a NEW_MAJOR=MAJOR+1
    set "NEW_MINOR=0"
    set "NEW_PATCH=0"
    goto calculate
)
if "%OPTION%"=="2" (
    set "NEW_MAJOR=%MAJOR%"
    set /a NEW_MINOR=MINOR+1
    set "NEW_PATCH=0"
    goto calculate
)
if "%OPTION%"=="3" (
    set "NEW_MAJOR=%MAJOR%"
    set "NEW_MINOR=%MINOR%"
    set /a NEW_PATCH=PATCH+1
    goto calculate
)

echo.
echo Opção inválida. Tente novamente.
echo.
goto menu

:calculate
set "NEW_TAG=v%NEW_MAJOR%.%NEW_MINOR%.%NEW_PATCH%"
echo.

:: 6. Verificar se a nova tag já existe local ou remotamente
set "TAG_EXISTS="
for /f "tokens=*" %%t in ('git tag -l "%NEW_TAG%"') do set "TAG_EXISTS=%%t"
if not "%TAG_EXISTS%"=="" (
    echo A versão %NEW_TAG% já existe.
    echo.
    echo Escolha outro versionamento.
    echo.
    goto menu
)

set "TAG_EXISTS_REMOTE="
for /f "tokens=*" %%t in ('git ls-remote --tags origin "%NEW_TAG%" 2^>nul') do set "TAG_EXISTS_REMOTE=%%t"
if not "%TAG_EXISTS_REMOTE%"=="" (
    echo A versão %NEW_TAG% já existe no repositório remoto.
    echo.
    echo Escolha outro versionamento.
    echo.
    goto menu
)

:: 7. Solicitar confirmação
echo Versão atual:
echo %LAST_TAG%
echo.
echo Nova versão:
echo %NEW_TAG%
echo.
echo Deseja criar esta Tag?
echo.
echo [S] Sim
echo [N] Não
echo.
set "CONFIRM="
set /p CONFIRM=Opção: 

if /i "%CONFIRM%"=="S" goto create
if /i "%CONFIRM%"=="Sim" goto create

echo.
echo Operação cancelada.
exit /b 0

:create
echo.
echo Criando Tag localmente...
git tag %NEW_TAG%
if %errorlevel% neq 0 (
    echo Erro ao criar a Tag local.
    exit /b 1
)

echo.
echo Enviando Tag para o remoto...
git push origin %NEW_TAG%
if %errorlevel% neq 0 (
    echo Erro ao enviar a Tag para o remoto.
    exit /b 1
)

echo.
echo ========================================
echo.
echo Release criada com sucesso.
echo.
echo Nova versão:
echo %NEW_TAG%
echo.
echo ========================================
