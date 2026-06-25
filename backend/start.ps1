param(
    [Parameter(Position=0)]
    [string]$COMPort
)

if (-not $COMPort) {
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "Uso: .\start.ps1 <COMPORT>" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\start.ps1 COM4      - PC con el Receptor"
    Write-Host "  .\start.ps1 COM5      - PC con el Transmisor"
    Write-Host ""
    Write-Host "NOTA: Si no se especifica puerto, se"
    Write-Host "iniciara en modo SIMULADO (sin datos reales)"
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Iniciando en modo SIMULADO..." -ForegroundColor Gray
} else {
    $env:SERIAL_PORT = $COMPort
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Puerto configurado: $COMPort" -ForegroundColor Cyan
    Write-Host "Iniciando en modo REAL..." -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
}

Write-Host ""
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
