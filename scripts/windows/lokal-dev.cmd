@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."

echo.
echo [RASH] Loyiha papkasi: %CD%
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo XATO: npm topilmadi. Node.js LTS o'rnating: https://nodejs.org
  echo Keyin CMD ni qayta oching.
  pause
  exit /b 1
)

echo [1/3] npm install...
call npm install
if errorlevel 1 (
  echo npm install xato bilan tugadi.
  pause
  exit /b 1
)

echo.
echo [2/3] Prisma — bazaga push...
call npx prisma db push
if errorlevel 1 (
  echo prisma db push xato bilan tugadi.
  pause
  exit /b 1
)

echo.
echo [3/3] Development server (Ctrl+C bilan to'xtatiladi)...
call npm run dev

pause
