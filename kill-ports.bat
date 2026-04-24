@echo off
setlocal enabledelayedexpansion

echo.
echo  Nossas Criancas — Liberando portas do sistema
echo  ================================================
echo.

for %%P in (3000 3001 5432) do (
    echo  Verificando porta %%P...
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo    Matando PID %%I na porta %%P...
        taskkill /PID %%I /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo    Processo %%I finalizado.
        ) else (
            echo    Nao foi possivel finalizar PID %%I ^(pode precisar de admin^).
        )
    )
)

echo.
echo  Pronto.
echo.
pause
endlocal
