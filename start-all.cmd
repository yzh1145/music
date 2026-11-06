@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 云音乐 · 一键启动

set "ROOT=%~dp0"
if not defined SERVER_PORT set "SERVER_PORT=8080"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5173"
if not defined DB_PORT set "DB_PORT=3306"
if not defined API_TARGET set "API_TARGET=http://localhost:%SERVER_PORT%"

echo ============================================
echo   云音乐 · 一键启动前后端
echo ============================================
echo   后端：http://localhost:%SERVER_PORT%
echo   前端：http://localhost:%FRONTEND_PORT%
echo ============================================
echo.

call "%ROOT%start-backend.cmd" nopause
if errorlevel 1 (
  echo.
  echo [失败] 后端启动失败，请根据上面的提示排查。
  pause
  exit /b 1
)

echo.
call "%ROOT%start-frontend.cmd" nopause
if errorlevel 1 (
  echo.
  echo [失败] 前端启动失败，请根据上面的提示排查。
  pause
  exit /b 1
)

echo.
echo [完成] 正在打开浏览器：http://localhost:%FRONTEND_PORT%
start "" "http://localhost:%FRONTEND_PORT%"
ping -n 4 127.0.0.1 >nul
exit /b 0
