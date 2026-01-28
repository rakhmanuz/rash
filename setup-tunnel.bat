@echo off
echo ====================================
echo Tunnel Xizmatini Sozlash
echo ====================================
echo.
echo Quyidagi variantlardan birini tanlang:
echo.
echo 1. ngrok (Tavsiya etiladi - oson va tez)
echo 2. localtunnel (Bepul, npm orqali)
echo 3. Cloudflare Tunnel (Bepul, lekin murakkab)
echo.
set /p choice="Tanlang (1/2/3): "

if "%choice%"=="1" goto ngrok
if "%choice%"=="2" goto localtunnel
if "%choice%"=="3" goto cloudflare

:ngrok
echo.
echo ====================================
echo ngrok Sozlash
echo ====================================
echo.
echo 1. https://ngrok.com/ ga kiring va account yarating
echo 2. Authtoken oling
echo 3. ngrok yuklab oling: https://ngrok.com/download
echo.
set /p authtoken="Authtoken kiriting: "
ngrok config add-authtoken %authtoken%
echo.
echo ngrok ishga tushirilmoqda...
start ngrok http 3000
echo.
echo ngrok ishga tushdi! Browser'da http://localhost:4040 ga kiring
echo va u yerda public URL ko'rasiz.
goto end

:localtunnel
echo.
echo ====================================
echo localtunnel Sozlash
echo ====================================
echo.
echo localtunnel o'rnatilmoqda...
call npm install -g localtunnel
echo.
echo localtunnel ishga tushirilmoqda...
start cmd /k "lt --port 3000"
echo.
echo localtunnel ishga tushdi! Terminal'da URL ko'rasiz.
goto end

:cloudflare
echo.
echo ====================================
echo Cloudflare Tunnel Sozlash
echo ====================================
echo.
echo Cloudflare Tunnel sozlash uchun setup-cloudflare-tunnel.md faylini o'qing.
echo.
goto end

:end
echo.
pause
