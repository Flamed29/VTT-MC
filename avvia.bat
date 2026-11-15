@echo off
title VTT TileCraft Server
cd /d "%~dp0"
echo ==============================================
echo   Avvio di VTT TileCraft Map Studio...
echo ==============================================
echo.
echo Apertura del browser in corso...
start http://localhost:5173/
npm.cmd run dev
pause
