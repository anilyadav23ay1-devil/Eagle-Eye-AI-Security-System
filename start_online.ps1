# Eagle Eye - Smart Class Attendance & Activity Intelligence - Online Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  EAGLE EYE - SMART CLASS ATTENDANCE & ACTIVITY INTELLIGENCE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend
Write-Host "[1/3] Starting FastAPI Backend on 0.0.0.0:8000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "server" -WindowStyle Minimized

Start-Sleep -Seconds 2

# 2. Start Vite Frontend Dev Server
Write-Host "[2/3] Starting Vite Frontend on 0.0.0.0:5173..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run dev -- --host 0.0.0.0 --port 5173" -WorkingDirectory "client" -WindowStyle Minimized

Start-Sleep -Seconds 3

# 3. Start Cloudflare Public Tunnel
Write-Host "[3/3] Launching Cloudflare Public Internet Tunnel..." -ForegroundColor Yellow
if (Test-Path ".\tools\cloudflared.exe") {
    Start-Process -FilePath ".\tools\cloudflared.exe" -ArgumentList "tunnel --url http://localhost:5173" -WindowStyle Normal
} else {
    Start-Process -FilePath "npx" -ArgumentList "-y localtunnel --port 5173" -WindowStyle Normal
}

Write-Host ""
Write-Host "Eagle Eye - Smart Class Attendance & Activity Intelligence is now ONLINE!" -ForegroundColor Green
Write-Host "- Local URL:    http://localhost:5173" -ForegroundColor White
Write-Host "- LAN (Wi-Fi):  http://$( (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi|Wireless|Ethernet' -and $_.IPAddress -notmatch '169\.254\.' } | Select-Object -First 1).IPAddress ):5173" -ForegroundColor White
Write-Host "- Public Cloudflare / LocalTunnel: Check the opened terminal window for your live HTTPS URL" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
