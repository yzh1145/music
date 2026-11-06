@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 云音乐 · 前端

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
if not defined SERVER_PORT set "SERVER_PORT=8080"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5173"
if not defined API_TARGET set "API_TARGET=http://localhost:%SERVER_PORT%"
set "NOPAUSE="
if /i "%~1"=="nopause" set "NOPAUSE=1"

echo ============================================
echo   云音乐 · 前端启动
echo ============================================
echo.

if not exist "%FRONTEND%\package.json" (
  echo [错误] 未找到 frontend 目录，请把脚本放在项目根目录。
  call :pause_error
  exit /b 1
)

call :port_open %FRONTEND_PORT%
if not errorlevel 1 (
  echo [提示] 端口 %FRONTEND_PORT% 已在监听，前端应该已经在运行。
  echo        地址：http://localhost:%FRONTEND_PORT%
  exit /b 0
)

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 node，请安装 Node.js 20.19+ 或 22.12+。
  call :pause_error
  exit /b 1
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 npm，请重新安装 Node.js。
  call :pause_error
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo [信息] 首次运行，正在安装前端依赖（可能需要几分钟）...
  pushd "%FRONTEND%"
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo [错误] npm install 失败，请检查网络或 npm 镜像配置。
    call :pause_error
    exit /b 1
  )
  popd
)

echo [信息] 启动 Vite 开发服务器，日志会显示在新打开的窗口中...
start "Music Frontend" /D "%FRONTEND%" cmd /k npm run dev

echo [信息] 等待前端就绪...
call :wait_port %FRONTEND_PORT% 90
if errorlevel 1 (
  echo [错误] 前端在 90 秒内没有就绪，请查看 “Music Frontend” 窗口中的报错。
  call :pause_error
  exit /b 1
)

echo.
echo [成功] 前端已启动：http://localhost:%FRONTEND_PORT%
exit /b 0

rem ============================================
rem 端口检测工具
rem ============================================
:port_open
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %~1 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:wait_port
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(%~2); while ((Get-Date) -lt $deadline) { if (Get-NetTCPConnection -LocalPort %~1 -State Listen -ErrorAction SilentlyContinue) { exit 0 }; Start-Sleep -Milliseconds 500 }; exit 1" >nul 2>&1
exit /b %errorlevel%

:pause_error
if not defined NOPAUSE pause
exit /b 0
