@echo off
echo Iniciando GovTech Audio Copilot Backend...
cd /d "%~dp0"

if not exist venv (
    echo Criando ambiente virtual python...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

if "%GEMINI_API_KEY%"=="" (
    echo.
    echo [AVISO IMPORTANTE]
    echo A variavel GEMINI_API_KEY nao foi detectada!
    echo Execute antes: set GEMINI_API_KEY=sua_chave_aqui
    echo ou configure nas variaveis de ambiente do Windows.
    echo.
)

python main.py
pause
