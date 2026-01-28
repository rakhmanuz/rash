@echo off
echo ========================================
echo   RASH - PM2 Server Manager
echo ========================================
echo.

cd /d %~dp0

echo PM2 bilan server boshqarilmoqda...
echo.

:menu
echo [1] Server ishga tushirish
echo [2] Server to'xtatish
echo [3] Server qayta ishga tushirish
echo [4] Loglarni ko'rish
echo [5] Status ko'rish
echo [6] Chiqish
echo.
set /p choice="Tanlang (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto status
if "%choice%"=="6" goto end

:start
echo Server ishga tushirilmoqda...
call npm run build
call pm2 start npm --name "rash" -- start
call pm2 save
echo Server ishga tushirildi!
echo.
goto menu

:stop
echo Server to'xtatilmoqda...
call pm2 stop rash
echo Server to'xtatildi!
echo.
goto menu

:restart
echo Server qayta ishga tushirilmoqda...
call pm2 restart rash
echo Server qayta ishga tushirildi!
echo.
goto menu

:logs
echo Loglar ko'rsatilmoqda (Ctrl+C bilan chiqish)...
call pm2 logs rash
goto menu

:status
call pm2 list
echo.
goto menu

:end
echo Chiqilmoqda...
exit
