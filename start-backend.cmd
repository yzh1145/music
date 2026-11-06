@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 云音乐 · 后端

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "JAR=%BACKEND%\target\music-1.0.0.jar"
if not defined SERVER_PORT set "SERVER_PORT=8080"
if not defined DB_PORT set "DB_PORT=3306"
set "NOPAUSE="
if /i "%~1"=="nopause" set "NOPAUSE=1"

echo ============================================
echo   云音乐 · 后端启动
echo ============================================
echo.

if not exist "%BACKEND%\pom.xml" (
  echo [错误] 未找到 backend 目录，请把脚本放在项目根目录。
  call :pause_error
  exit /b 1
)

call :port_open %SERVER_PORT%
if not errorlevel 1 (
  echo [提示] 端口 %SERVER_PORT% 已在监听，后端应该已经在运行。
  echo        地址：http://localhost:%SERVER_PORT%
  exit /b 0
)

call :port_open %DB_PORT%
if errorlevel 1 (
  echo [警告] 未检测到 MySQL（端口 %DB_PORT%），后端可能无法连接数据库。
  echo        请先启动 MySQL，并确认已导入 sql\music.sql。
  echo.
)

if exist "%JAR%" goto run_backend

echo [信息] 未找到 %JAR%
echo [信息] 开始构建后端，首次构建可能需要几分钟...
call :build_backend
if errorlevel 1 (
  echo [错误] 后端构建失败，请查看上面的构建日志。
  call :pause_error
  exit /b 1
)
if not exist "%JAR%" (
  echo [错误] 构建结束但没有生成 %JAR%。
  call :pause_error
  exit /b 1
)

:run_backend
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" set "PATH=%JAVA_HOME%\bin;%PATH%"
where java >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 java，请安装 JDK 17 及以上版本，并把 java 加入 PATH。
  call :pause_error
  exit /b 1
)

echo [信息] 启动后端，日志会显示在新打开的窗口中...
start "Music Backend" /D "%BACKEND%" cmd /k java -jar "%JAR%"

echo [信息] 等待后端就绪...
call :wait_port %SERVER_PORT% 90
if errorlevel 1 (
  echo [错误] 后端在 90 秒内没有就绪，请查看 “Music Backend” 窗口中的报错。
  call :pause_error
  exit /b 1
)

echo.
echo [成功] 后端已启动：http://localhost:%SERVER_PORT%
exit /b 0

rem ============================================
rem 自动查找 Maven 并构建后端
rem ============================================
:build_backend
set "MVN="
for /f "delims=" %%M in ('where mvn.cmd 2^>nul') do if not defined MVN set "MVN=%%M"

if not defined MVN (
  for %%R in ("%ProgramFiles%" "%ProgramFiles(x86)%" "%ProgramW6432%" "D:\Program Files" "%LOCALAPPDATA%\Programs") do (
    for /d %%D in ("%%~R\JetBrains\*") do (
      if not defined MVN if exist "%%~D\plugins\maven\lib\maven3\bin\mvn.cmd" (
        set "MVN=%%~D\plugins\maven\lib\maven3\bin\mvn.cmd"
        if not defined JAVA_HOME if exist "%%~D\jbr\bin\java.exe" set "JAVA_HOME=%%~D\jbr"
      )
    )
  )
)

if not defined MVN (
  echo [错误] 未找到 Maven，无法自动构建后端。
  echo        请安装 Maven，或在 IDEA 中执行 mvn -DskipTests package 生成 jar。
  call :pause_error
  exit /b 1
)

if not defined JAVA_HOME (
  for /f "delims=" %%J in ('where javac 2^>nul') do if not defined JAVA_HOME set "JAVA_HOME=%%~dpJ.."
)

echo [信息] 使用 Maven：%MVN%
if defined JAVA_HOME echo [信息] 使用 JAVA_HOME：%JAVA_HOME%
pushd "%BACKEND%"
call "%MVN%" -DskipTests package
set "BUILD_RC=%ERRORLEVEL%"
popd
exit /b %BUILD_RC%

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
