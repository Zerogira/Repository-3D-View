@echo off
title GitTree Visualizer - Backend (Porta 8000)
color 0A

echo ========================================================
echo        GitTree Visualizer 3D - Backend (FastAPI)
echo ========================================================
echo.

echo [BACKEND] Verificando ambiente Python e dependencias...
if not exist "backend\venv" (
    echo [BACKEND] Criando ambiente virtual venv...
    python -m venv backend\venv
)

echo [BACKEND] Verificando e instalando pacotes pip...
call backend\venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt

echo.
echo ========================================================
echo   [OK] Backend pronto e iniciando na PORTA 8000:
echo   - API:          http://localhost:8000
echo   - Documentacao: http://localhost:8000/docs
echo ========================================================
echo.

cd /d "%~dp0backend"
venv\Scripts\python.exe main.py
