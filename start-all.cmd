@echo off
setlocal

rem Start the existing backend and frontend launchers in separate windows.
if not defined SERVER_PORT set "SERVER_PORT=8080"
if not defined API_TARGET set "API_TARGET=http://localhost:%SERVER_PORT%"
start "Music Backend" "%ComSpec%" /k ""%~dp0start-backend.cmd""

rem Wait for Spring Boot before launching Vite so API proxy requests have a target.
echo Waiting for backend on port %SERVER_PORT%...
powershell -NoProfile -Command "$port = [int]$env:SERVER_PORT; for ($i = 0; $i -lt 60; $i++) { try { $client = [System.Net.Sockets.TcpClient]::new(); $client.Connect('localhost', $port); $client.Dispose(); exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1"
if errorlevel 1 echo [WARN] Backend did not respond on port %SERVER_PORT%. Check the backend window, Java, MySQL, and DB settings.

start "Music Frontend" "%ComSpec%" /k ""%~dp0start-frontend.cmd""

rem Wait for Vite to accept connections before opening the app.
set "FRONTEND_PORT=%FRONTEND_PORT%"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5173"
powershell -NoProfile -Command "$port = [int]$env:FRONTEND_PORT; for ($i = 0; $i -lt 90; $i++) { try { $client = [System.Net.Sockets.TcpClient]::new(); $client.Connect('localhost', $port); $client.Dispose(); exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1"
if errorlevel 1 echo [WARN] Frontend did not respond within 90 seconds. Opening the configured page anyway.
start "" "http://localhost:%FRONTEND_PORT%"

endlocal
