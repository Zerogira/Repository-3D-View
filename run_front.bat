@echo off
title GitTree Visualizer - Frontend (Porta 5173)
color 0D

echo ========================================================
echo        GitTree Visualizer 3D - Frontend (React + Vite)
echo ========================================================
echo.

echo [FRONTEND] Verificando dependencias Node.js...
if not exist "frontend\node_modules" (
    echo [FRONTEND] Instalando pacotes npm...
    cd /d "%~dp0frontend"
    call npm install --legacy-peer-deps
    cd /d "%~dp0"
)

echo.
echo ========================================================
echo   [OK] Frontend pronto e iniciando na PORTA 5173:
echo   - Aplicacao: http://localhost:5173
echo ========================================================
echo.

cd /d "%~dp0frontend"
npm run dev
