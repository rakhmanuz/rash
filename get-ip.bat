@echo off
echo ====================================
echo Public IP Manzilni Topish
echo ====================================
echo.

echo Kompyuteringizning Public IP manzili:
echo.

powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"

echo.
echo.
echo ====================================
echo Bu IP manzilni DNS sozlamalarida ishlating!
echo ====================================
echo.
pause
