@echo off
setlocal

echo =========================================
echo       Iniciando Servicos FinControl
echo =========================================

echo.
echo [1/3] Encerrando processos antigos nas portas 8080 e 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find "LISTENING" ^| find ":8080 "') do (
    echo - Encerrando processo %%a (Backend)
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find "LISTENING" ^| find ":5173 "') do (
    echo - Encerrando processo %%a (Frontend)
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [2/3] Iniciando Backend...
cd backend
start "FinControl Backend" cmd /k "mvn spring-boot:run"
cd ..

echo.
echo [3/3] Iniciando Frontend...
cd frontend
start "FinControl Frontend" cmd /k "npm run dev"
cd ..

echo.
echo =========================================
echo Servicos iniciados em novas janelas!
echo.
echo Backend disponivel em:  http://localhost:8080
echo Frontend disponivel em: http://localhost:5173
echo =========================================
echo.
pause
