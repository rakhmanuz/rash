@echo off
echo ====================================
echo ngrok Tunnel Ishga Tushirish
echo ====================================
echo.

echo Server ishga tushirilganligini tekshirilmoqda...
pm2 status >nul 2>&1
if errorlevel 1 (
    echo.
    echo XATOLIK: Server ishga tushmagan!
    echo.
    echo Avval serverni ishga tushiring:
    echo   cd C:\IQMax
    echo   npm run build
    echo   pm2 start ecosystem.config.js
    echo.
    pause
    exit
)

echo Server ishga tushgan!
echo.

echo ngrok ishga tushirilmoqda...
echo.
echo Tunnel URL'ni ko'rish uchun: http://localhost:4040
echo.

cd C:\ngrok
ngrok http 3000

pause
