@echo off
echo ====================================================
echo       Empacotador de Release - FinControl
echo ====================================================
echo.

:: 1. Compilar o Frontend
echo [1/5] Compilando o Frontend React...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar o frontend.
    pause
    exit /b 1
)
cd ..

:: 2. Copiar build do Frontend para os recursos estaticos do Backend
echo.
echo [2/5] Copiando build do frontend para recursos estaticos do backend...
if not exist "backend\src\main\resources\static" (
    mkdir "backend\src\main\resources\static"
)
:: Limpar static anterior se houver
del /q /s "backend\src\main\resources\static\*" >nul 2>&1
xcopy /e /y /q "frontend\dist\*" "backend\src\main\resources\static\"

:: 3. Compilar o Backend com o Maven
echo.
echo [3/5] Compilando o Backend Java e gerando o JAR...
cd backend
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Falha ao empacotar o backend.
    pause
    exit /b 1
)
cd ..

:: 4. Criar a estrutura da pasta de Release
echo.
echo [4/5] Criando estrutura da pasta release...
if exist release (
    rd /s /q release
)
mkdir release
mkdir release\db

:: Copiar o JAR compilado
copy /y "backend\target\backend-0.0.1-SNAPSHOT.jar" "release\fincontrol.jar"

:: Criar o Iniciar.bat para o usuario final na pasta release
echo @echo off > release\Iniciar.bat
echo echo ==================================================== >> release\Iniciar.bat
echo echo        Iniciando FinControl - Controle Financeiro >> release\Iniciar.bat
echo echo ==================================================== >> release\Iniciar.bat
echo echo. >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo :: 1. Garantir que a pasta do banco de dados existe >> release\Iniciar.bat
echo if not exist db ( >> release\Iniciar.bat
echo     echo [1/3] Criando pasta do banco de dados... >> release\Iniciar.bat
echo     mkdir db >> release\Iniciar.bat
echo ) else ( >> release\Iniciar.bat
echo     echo [1/3] Pasta do banco de dados verificada. >> release\Iniciar.bat
echo ) >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo :: 2. Verificar e baixar o Java Runtime Environment (JRE) se nao existir >> release\Iniciar.bat
echo set "JRE_DIR=%%~dp0jre" >> release\Iniciar.bat
echo set "JAVA_EXEC=%%JRE_DIR%%\bin\java.exe" >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo if not exist "%%JAVA_EXEC%%" ( >> release\Iniciar.bat
echo     echo [2/3] Java nao encontrado localmente. >> release\Iniciar.bat
echo     echo Baixando versao portatil do Java JRE 21 para Windows... >> release\Iniciar.bat
echo     echo Primeira execucao - baixando e instalando o Java... >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo     :: Criar script powershell temporario >> release\Iniciar.bat
echo     echo $ProgressPreference = 'SilentlyContinue' ^> download_jre.ps1 >> release\Iniciar.bat
echo     echo [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Write-Host "Baixando JRE..." ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk" -OutFile "jre.zip" ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Write-Host "Extraindo arquivos..." ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Expand-Archive -Path "jre.zip" -DestinationPath "jre_temp" ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo $extractedDir = Get-ChildItem -Path "jre_temp" ^^I Select-Object -First 1 ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Move-Item -Path $extractedDir.FullName -Destination "jre" ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Remove-Item -Path "jre.zip" -Force ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Remove-Item -Path "jre_temp" -Recurse -Force ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Remove-Item -Path "download_jre.ps1" -Force ^>^> download_jre.ps1 >> release\Iniciar.bat
echo     echo Write-Host "JRE instalado com sucesso!" ^>^> download_jre.ps1 >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo     :: Executar o script powershell >> release\Iniciar.bat
echo     powershell -NoProfile -ExecutionPolicy Bypass -File download_jre.ps1 >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo     if not exist "%%JAVA_EXEC%%" ( >> release\Iniciar.bat
echo         echo. >> release\Iniciar.bat
echo         echo [ERRO] Nao foi possivel baixar/instalar o Java automaticamente. >> release\Iniciar.bat
echo         echo Verifique sua conexao com a internet e tente executar novamente. >> release\Iniciar.bat
echo         if exist download_jre.ps1 del download_jre.ps1 >> release\Iniciar.bat
echo         pause >> release\Iniciar.bat
echo         exit /b 1 >> release\Iniciar.bat
echo     ) >> release\Iniciar.bat
echo ) else ( >> release\Iniciar.bat
echo     echo [2/3] Java verificado com sucesso. >> release\Iniciar.bat
echo ) >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo :: 3. Iniciar a aplicacao FinControl >> release\Iniciar.bat
echo echo. >> release\Iniciar.bat
echo echo [3/3] Iniciando o FinControl... >> release\Iniciar.bat
echo echo A janela do navegador abrira automaticamente em instantes. >> release\Iniciar.bat
echo echo. >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo :: Abrir o navegador automaticamente em segundo plano apos 5 segundos >> release\Iniciar.bat
echo start "" powershell -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:8080'" >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo :: Executar o JAR definindo a URL do banco dentro do diretorio db do app >> release\Iniciar.bat
echo "%%JAVA_EXEC%%" -jar fincontrol.jar --spring.datasource.url=jdbc:sqlite:db/controle.db >> release\Iniciar.bat
echo. >> release\Iniciar.bat
echo pause >> release\Iniciar.bat

:: 5. Gerar arquivo ZIP da pasta release
echo.
echo [5/5] Compactando pasta release em fincontrol-windows.zip...
if exist fincontrol-windows.zip (
    del /f /q fincontrol-windows.zip
)
powershell -NoProfile -Command "Compress-Archive -Path release\* -DestinationPath fincontrol-windows.zip -Force"

echo.
echo ====================================================
echo COMPILACAO E EMPACOTAMENTO CONCLUIDOS!
echo.
echo O arquivo pronto para envio esta em:
echo %~dp0fincontrol-windows.zip
echo ====================================================
echo.
pause
