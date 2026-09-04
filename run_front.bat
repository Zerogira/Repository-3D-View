@echo off
title GitTree Visualizer - Frontend (Porta 5173)
color 0D

echo ========================================================
echo        GitTree Visualizer 3D - Frontend (React + Vite)
echo ========================================================
echo.

cd /d "%~dp0frontend"

echo [FRONTEND] Verificando dependencias Node.js...

set "NEED_INSTALL=0"
if not exist "node_modules" (
    set "NEED_INSTALL=1"
) else (
    call node check_deps.cjs >nul 2>nul
    if errorlevel 1 set "NEED_INSTALL=1"
)

if "%NEED_INSTALL%"=="1" (
    echo [FRONTEND] Dependencias ausentes ou desatualizadas detectadas.
    echo [FRONTEND] Executando npm install --legacy-peer-deps...
    call npm install --legacy-peer-deps
    if not errorlevel 1 (
        call node check_deps.cjs --save-cache >nul 2>nul
    )
) else (
    echo [FRONTEND] Todas as dependencias estao instaladas e atualizadas.
)

echo.
echo ========================================================
echo   [OK] Frontend pronto e iniciando na PORTA 5173:
echo   - Aplicacao: http://localhost:5173
echo ========================================================
echo.

call npm run dev
