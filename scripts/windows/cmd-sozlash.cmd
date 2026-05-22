@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   Windows CMD — bir martalik sozlash (HKCU)
echo   - UTF-8 har yangi CMD da (AutoRun)
echo   - Quick Edit (tanlash + o'ng tugma = joylash)
echo   - Virtual Terminal (rangli chiqish)
echo ============================================================
echo.

REM Eslatma: Avvalroq AutoRun bo'lsa, u almashtiriladi.
for /f "tokens=2*" %%A in ('reg query "HKCU\Software\Microsoft\Command Processor" /v AutoRun 2^>nul ^| find "AutoRun"') do set "OLD_AUTORUN=%%B"
if defined OLD_AUTORUN (
  echo [DIQQAT] Eski AutoRun topildi. Yangi qiymat bilan almashtiriladi:
  echo   !OLD_AUTORUN!
  echo.
)

reg add "HKCU\Software\Microsoft\Command Processor" /v AutoRun /t REG_SZ /d "@chcp 65001>nul" /f >nul
if errorlevel 1 (
  echo XATO: AutoRun yozib bo'lmadi.
  pause
  exit /b 1
)
echo [OK] AutoRun: UTF-8 (chcp 65001) har yangi CMD da

reg add "HKCU\Console" /v QuickEdit /t REG_DWORD /d 1 /f >nul
echo [OK] Quick Edit yoqildi

reg add "HKCU\Console" /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul
echo [OK] VirtualTerminalLevel yoqildi

echo.
echo --- MUHIM: yangi qator va "bir qatorga yopishish" ---
echo   Bu skript CMD da "har buyruq yangi qatordan" yoki ko'p qatorli
echo   joylashuvni TA'MINLAMAYDI. Yangi qatorlar matnda ^(Enter^) bilan
echo   bor-yo'qligiga bog'liq. Chatdan nusxa olsa, ba'zan barcha qatorlar
echo   BIR qatorga yopishib ketadi — shunda "d:\IQMaxnpm" kabi xato chiqadi.
echo   Yechim: D:\IQMax\lokal-dev.bat ni Explorerdan oching YOKI bitta qatorda:
echo     cd /d d:\IQMax ^&^& npm install ^&^& npx prisma db push ^&^& npm run dev
echo.
echo --- Loyihani ishga tushirish ---
echo   Explorer: D:\IQMax papkasida  lokal-dev.bat  ga ikki marta bosing.
echo   Yoki CMD da bir qator (yo'l xato bermaslik uchun):
echo     d:\IQMax\lokal-dev.bat
echo.
echo O'zgarishlar yangi ochilgan CMD da ko'rinadi.
echo.
pause
