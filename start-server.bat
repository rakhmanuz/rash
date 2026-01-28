@echo off
echo ====================================
echo RASH Server Ishga Tushirish
echo ====================================
echo.

echo [1/4] Dependencies tekshirilmoqda...
call npm install

echo.
echo [2/4] Prisma Client generatsiya qilinmoqda...
call npx prisma generate

echo.
echo [3/4] Production build qilinmoqda...
call npm run build

echo.
echo [4/4] PM2 orqali server ishga tushirilmoqda...
call pm2 start ecosystem.config.js

echo.
echo ====================================
echo Server muvaffaqiyatli ishga tushdi!
echo ====================================
echo.
echo PM2 Status: pm2 status
echo Loglar: pm2 logs rash
echo Qayta ishga tushirish: pm2 restart rash
echo.
pause
