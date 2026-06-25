@echo off
title Radio-Enlace LoRa Backend

if "%1"=="" (
    echo ============================================
    echo Uso: start.bat ^<COMPORT^>
    echo.
    echo Ejemplos:
    echo   start.bat COM4      - PC con el Receptor
    echo   start.bat COM5      - PC con el Transmisor
    echo.
    echo NOTA: Si no se especifica puerto, se
    echo iniciara en modo SIMULADO (sin datos reales)
    echo ============================================
    echo.
    echo Iniciando en modo SIMULADO...
) else (
    set SERIAL_PORT=%1
    echo ============================================
    echo Puerto configurado: %1
    echo Iniciando en modo REAL...
    echo ============================================
)

echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
