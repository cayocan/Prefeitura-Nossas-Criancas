@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%client"

echo.
echo  Nossas Criancas — Ambiente de Desenvolvimento (local)
echo  =======================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado. Instale em https://nodejs.org e tente novamente.
    pause
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Docker nao encontrado. Necessario para rodar o PostgreSQL.
    pause
    exit /b 1
)

echo  Subindo PostgreSQL e backend via Docker...
cd /d "%ROOT%"
docker compose up -d postgres backend
if %errorlevel% neq 0 (
    echo  [ERRO] Falha ao subir os containers.
    pause
    exit /b 1
)

echo  Aguardando backend ficar pronto...
:wait_backend
docker compose exec postgres pg_isready -U pguser -d childrendb >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_backend
)
echo  Backend pronto (http://localhost:3001).
echo.

echo  Iniciando frontend (http://localhost:3000) ...
start "frontend" cmd /k cd /d "%FRONTEND%" ^&^& npm run dev

echo.
echo  Servicos iniciados.
echo  Para parar Docker: docker compose stop postgres backend
echo.

endlocal



