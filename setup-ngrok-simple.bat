@echo off
echo ====================================
echo ngrok Sozlash - Qadam-Baqadam
echo ====================================
echo.

echo [1/5] ngrok papkasini tekshirilmoqda...
if not exist "C:\ngrok\ngrok.exe" (
    echo.
    echo XATOLIK: ngrok.exe topilmadi!
    echo.
    echo Qadamlar:
    echo 1. https://ngrok.com/download ga kiring
    echo 2. Windows uchun yuklab oling
    echo 3. Zip faylni ochib, ngrok.exe ni C:\ngrok\ papkasiga ko'chiring
    echo.
    pause
    exit
)

echo [2/5] ngrok.exe topildi!
echo.

echo [3/5] Authtoken sozlash...
echo.
set /p authtoken="ngrok Authtoken kiriting (dashboard.ngrok.com dan): "

if "%authtoken%"=="" (
    echo XATOLIK: Authtoken kiritilmadi!
    pause
    exit
)

cd C:\ngrok
ngrok config add-authtoken %authtoken%

if errorlevel 1 (
    echo.
    echo XATOLIK: Authtoken sozlashda xatolik!
    pause
    exit
)

echo.
echo [4/5] Authtoken muvaffaqiyatli sozlandi!
echo.

echo [5/5] Server ishga tushirilganligini tekshirilmoqda...
pm2 status >nul 2>&1
if errorlevel 1 (
    echo.
    echo OGOHLANTIRISH: PM2 topilmadi yoki server ishga tushmagan!
    echo.
    echo Avval serverni ishga tushiring:
    echo   cd C:\IQMax
    echo   npm run build
    echo   pm2 start ecosystem.config.js
    echo.
    pause
)

echo.
echo ====================================
echo ngrok Sozlash Tugadi!
echo ====================================
echo.
echo Keyingi qadamlar:
echo.
echo 1. ngrok'ni ishga tushiring:
echo    cd C:\ngrok
echo    ngrok http 3000
echo.
echo 2. ngrok web interface'ni oching:
echo    http://localhost:4040
echo.
echo 3. Forwarding URL'ni yozib oling
echo.
echo 4. Domain'ni ngrok URL'ga yo'naltiring (CNAME Record)
echo.
pause
