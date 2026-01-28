@echo off
echo ====================================
echo ngrok Authtoken Sozlash
echo ====================================
echo.

echo 1. https://dashboard.ngrok.com/get-started/your-authtoken ga kiring
echo 2. Login qiling
echo 3. Authtoken'ni nusxalab oling
echo.

set /p authtoken="Yangi Authtoken kiriting: "

if "%authtoken%"=="" (
    echo XATOLIK: Authtoken kiritilmadi!
    pause
    exit
)

echo.
echo Authtoken sozlanmoqda...
ngrok config add-authtoken %authtoken%

if errorlevel 1 (
    echo.
    echo XATOLIK: Authtoken sozlashda xatolik!
    echo.
    echo Tekshiring:
    echo - Authtoken to'g'ri nusxalanganmi?
    echo - ngrok o'rnatilganmi? (ngrok version)
    echo.
    pause
    exit
)

echo.
echo ====================================
echo Authtoken muvaffaqiyatli sozlandi!
echo ====================================
echo.
echo Endi ngrok'ni ishga tushirish mumkin:
echo   ngrok http 3000
echo.
pause
