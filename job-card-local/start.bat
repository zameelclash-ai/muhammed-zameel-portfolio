@echo off
title Optimex Job Cards
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed on this computer.
  echo  1. Download the LTS version from https://nodejs.org and install it.
  echo  2. Then double-click start.bat again.
  echo.
  start "" https://nodejs.org
  pause
  exit /b
)
if not exist node_modules (
  echo Installing for the first time, please wait...
  call npm install --omit=dev --no-audit --no-fund
)
node server.js
pause
