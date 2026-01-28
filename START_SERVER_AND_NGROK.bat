@echo off
echo ====================================
echo Server va ngrok Ishga Tushirish
echo ====================================
echo.

echo [1/3] PM2 o'rnatilganligini tekshirilmoqda...
where pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 topilmadi. O'rnatilmoqda...
    call npm install -g pm2
    if errorlevel 1 (
        echo XATOLIK: PM2 o'rnatishda xatolik!
        pause
        exit
    )
)

echo [2/3] Server ishga tushirilmoqda...
cd /d C:\IQMax

pm2 status >nul 2>&1
if errorlevel 1 (
    echo Server build qilinmoqda...
    call npm run build
    if errorlevel 1 (
        echo XATOLIK: Build xatolik!
        pause
        exit
    )
    
    echo PM2 orqali server ishga tushirilmoqda...
    call pm2 start ecosystem.config.js
    if errorlevel 1 (
        echo XATOLIK: Server ishga tushirishda xatolik!
        pause
        exit
    )
) else (
    echo Server allaqachon ishga tushgan!
    call pm2 restart rash
)

echo.
echo [3/3] ngrok ishga tushirilmoqda...
echo.
echo ngrok web interface: http://localhost:4040
echo.

cd /d C:\ngrok
start ngrok http 3000

echo.
echo ====================================
echo Barcha xizmatlar ishga tushdi!
echo ====================================
echo.
echo 1. ngrok web interface: http://localhost:4040
echo 2. Forwarding URL'ni yozib oling
echo 3. Domain'ni ngrok URL'ga yo'naltiring (CNAME Record)
echo.
pause
